// src/hooks/useSave.ts
import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { adService } from "../services/AdService";

const SAVE_KEY = "harem-clicker-save-v2";
const BACKUP_KEY = "harem-clicker-backup-v2";
const CLOUD_SAVE_KEY = "cloud_save_v1";
const TIMESTAMP_KEY = "harem-clicker-last-save-ts"; // Новый ключ для времени

export function useAutoSave() {
  const saveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  // Основная функция сохранения
  const saveGame = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const localData = localStorage.getItem(SAVE_KEY);

      if (!localData) {
        isSavingRef.current = false;
        return;
      }

      const now = Date.now();

      // 1. Сохраняем в LocalStorage с меткой времени
      localStorage.setItem(SAVE_KEY, localData);
      localStorage.setItem(TIMESTAMP_KEY, now.toString());
      localStorage.setItem("harem-clicker-last-save", JSON.stringify({ timestamp: now }));

      // 2. Если авторизованы, сохраняем в Облако вместе с меткой времени
      if (adService.getIsAuthorized()) {
        // Оборачиваем данные в объект с timestamp, чтобы сравнивать версии
        const cloudPayload = {
          data: localData,
          timestamp: now,
        };
        await adService.setData({ [CLOUD_SAVE_KEY]: JSON.stringify(cloudPayload) });
        console.log("[useSave] Saved to Cloud with timestamp:", now);
      } else {
        console.log("[useSave] Saved to LocalStorage only (not authorized)");
      }
    } catch (error) {
      console.error("[useSave] Save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Функция загрузки с логикой Merge/Sync
  const loadGame = useCallback(async (): Promise<boolean> => {
    try {
      let cloudDataStr: string | null = null;
      let cloudTimestamp: number = 0;
      let localDataStr: string | null = null;
      let localTimestamp: number = 0;

      // 1. Получаем данные из Облака (если авторизованы)
      if (adService.getIsAuthorized()) {
        const cloudRaw = await adService.getData([CLOUD_SAVE_KEY]);
        if (cloudRaw && cloudRaw[CLOUD_SAVE_KEY]) {
          try {
            // Парсим оболочку { data: "...", timestamp: 123 }
            const parsedCloud = JSON.parse(cloudRaw[CLOUD_SAVE_KEY]);
            cloudDataStr = parsedCloud.data;
            cloudTimestamp = parsedCloud.timestamp || 0;
          } catch (e) {
            // Fallback для старых сохранений без оболочки
            console.warn("[useSave] Legacy cloud save detected, migrating...");
            cloudDataStr = cloudRaw[CLOUD_SAVE_KEY];
            cloudTimestamp = 0; // Считаем старым
          }
        }
      }

      // 2. Получаем данные из LocalStorage
      localDataStr = localStorage.getItem(SAVE_KEY);
      const savedTs = localStorage.getItem(TIMESTAMP_KEY);
      localTimestamp = savedTs ? parseInt(savedTs, 10) : 0;

      // 3. Логика выбора источника истины
      let dataToLoad: string | null = null;
      let source = "none";

      if (cloudDataStr && localDataStr) {
        // Есть и там, и там. Сравниваем время.
        if (cloudTimestamp > localTimestamp) {
          console.log("[useSave] Cloud is newer. Loading from Cloud.");
          dataToLoad = cloudDataStr;
          source = "cloud";
          // Обновляем локальную метку времени, чтобы не перезаписать облако старыми данными при следующем сейве
          localStorage.setItem(TIMESTAMP_KEY, cloudTimestamp.toString());
        } else {
          console.log("[useSave] Local is newer or same. Loading from Local.");
          dataToLoad = localDataStr;
          source = "local";
          // Если локальные данные новее, при следующем сохранении они перезапишут облако (это нормально)
        }
      } else if (cloudDataStr) {
        // Только облако
        console.log("[useSave] Only Cloud save exists.");
        dataToLoad = cloudDataStr;
        source = "cloud";
        localStorage.setItem(TIMESTAMP_KEY, cloudTimestamp.toString());
      } else if (localDataStr) {
        // Только локально
        console.log("[useSave] Only Local save exists.");
        dataToLoad = localDataStr;
        source = "local";
      }

      // 4. Загрузка данных в Store
      if (dataToLoad) {
        // Записываем выбранные данные в localStorage, чтобы zustand persist подхватил их при реайдрации
        // Или если стор уже гидрирован, нам нужно вызвать setState вручную?
        // Zustand persist при вызове rehydrate читает из storage (localStorage).
        // Поэтому мы должны положить "победившие" данные в localStorage перед вызовом rehydrate.
        localStorage.setItem(SAVE_KEY, dataToLoad);

        // Триггерим реайдацию стора
        await useGameStore.persist.rehydrate();

        console.log(`[useSave] Game loaded successfully from ${source}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[useSave] Load check failed:", error);
      return false;
    }
  }, []);

  // Функция миграции: вызывается при успешной авторизации
  const migrateSaveToCloud = useCallback(async () => {
    const localData = localStorage.getItem(SAVE_KEY);
    if (!localData) return;

    console.log("[useSave] Migrating save to Cloud...");
    try {
      // Проверяем, есть ли уже данные в облаке
      const cloudRaw = await adService.getData([CLOUD_SAVE_KEY]);

      // Если в облаке пусто ИЛИ данные в облаке старые (на случай рассинхрона при первом входе)
      if (!cloudRaw || !cloudRaw[CLOUD_SAVE_KEY]) {
        const now = Date.now();
        const payload = JSON.stringify({ data: localData, timestamp: now });
        await adService.setData({ [CLOUD_SAVE_KEY]: payload });
        localStorage.setItem(TIMESTAMP_KEY, now.toString());
        console.log("[useSave] Migration successful");
      } else {
        console.log("[useSave] Cloud save already exists. Comparing timestamps...");
        // Дополнительная проверка при миграции: если облако новее, загружаем его
        try {
          const parsedCloud = JSON.parse(cloudRaw[CLOUD_SAVE_KEY]);
          const cloudTs = parsedCloud.timestamp || 0;
          const localTs = parseInt(localStorage.getItem(TIMESTAMP_KEY) || "0", 10);

          if (cloudTs > localTs) {
            console.log("[useSave] Cloud save is newer during migration. Updating local...");
            localStorage.setItem(SAVE_KEY, parsedCloud.data);
            localStorage.setItem(TIMESTAMP_KEY, cloudTs.toString());
            await useGameStore.persist.rehydrate();
          }
        } catch (e) {
          console.warn("[useSave] Could not parse cloud data during migration comparison", e);
        }
      }
    } catch (err) {
      console.error("[useSave] Migration failed", err);
    }
  }, []);

  const createBackup = useCallback(() => {
    try {
      const current = localStorage.getItem(SAVE_KEY);
      if (current) {
        localStorage.setItem(BACKUP_KEY, current);
      }
    } catch (error) {
      console.error("[useSave] Backup failed:", error);
    }
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    localStorage.removeItem("harem-clicker-last-save");
    // Если авторизован, чистим и облако
    if (adService.getIsAuthorized()) {
      adService.setData({ [CLOUD_SAVE_KEY]: null });
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    saveTimeoutRef.current = window.setInterval(() => {
      saveGame();
    }, 30000); // Автосохранение каждые 30 сек
    return () => {
      if (saveTimeoutRef.current) clearInterval(saveTimeoutRef.current);
    };
  }, [saveGame]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGame();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveGame]);

  return {
    saveGame,
    loadGame,
    migrateSaveToCloud,
    createBackup,
    resetGame,
  };
}

export function useSaveStatus() {
  const getLastSaveTime = useCallback(() => {
    try {
      const data = localStorage.getItem("harem-clicker-last-save");
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.timestamp;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const getSaveSize = useCallback(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved ? new Blob([saved]).size : 0;
    } catch {
      return 0;
    }
  }, []);

  const hasSave = useCallback(() => {
    return localStorage.getItem(SAVE_KEY) !== null;
  }, []);

  return {
    getLastSaveTime,
    getSaveSize,
    hasSave,
  };
}
