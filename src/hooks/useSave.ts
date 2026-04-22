import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { adService } from "../services/AdService";

const SAVE_KEY = "harem-clicker-save-v2";
const BACKUP_KEY = "harem-clicker-backup-v2";
const CLOUD_SAVE_KEY = "cloud_save_v1";
const TIMESTAMP_KEY = "harem-clicker-last-save-ts";
// ИЗМЕНЕНО: добавлен ключ для хранения метаданных владельца сохранения
const META_KEY = "harem-clicker-meta-v1";

export function useAutoSave() {
  const saveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const canSave = useRef(true);

  const saveGame = useCallback(async () => {
    if (isSavingRef.current && !canSave) return;
    isSavingRef.current = true;

    try {
      const localData = localStorage.getItem(SAVE_KEY);
      if (!localData) {
        isSavingRef.current = false;
        return;
      }

      const now = Date.now();
      const currentUserId = adService.getIsAuthorized() ? adService.getUniqueID() : null;

      // 1. Сохраняем в LocalStorage
      localStorage.setItem(SAVE_KEY, localData);
      localStorage.setItem(TIMESTAMP_KEY, now.toString());

      // ИЗМЕНЕНО: сохраняем ID владельца локального сейва
      localStorage.setItem(META_KEY, JSON.stringify({ userId: currentUserId, timestamp: now }));

      // 2. Если авторизованы, сохраняем в Облако
      if (adService.getIsAuthorized()) {
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

  const loadGame = useCallback(async (): Promise<boolean> => {
    try {
      let cloudDataStr: string | null = null;
      let cloudTimestamp: number = 0;
      let localDataStr: string | null = null;
      let localTimestamp: number = 0;

      // Получаем текущего пользователя
      const currentUserId = adService.getIsAuthorized() ? adService.getUniqueID() : null;

      // Читаем метаданные локального сохранения
      let metaUserId = null;
      try {
        const metaStr = localStorage.getItem(META_KEY);
        if (metaStr) {
          const meta = JSON.parse(metaStr);
          metaUserId = meta.userId;
        }
      } catch (e) {
        console.warn("[useSave] Failed to parse meta", e);
      }

      // ИЗМЕНЕНО: Проверка на смену пользователя
      // Если текущий пользователь не совпадает с тем, кто записал локальный сейв
      if (currentUserId !== metaUserId) {
        console.log("[useSave] User mismatch detected. Ignoring local save.");

        // Если мы авторизованы, пытаемся загрузить только из облака
        if (adService.getIsAuthorized()) {
          const cloudRaw = await adService.getData([CLOUD_SAVE_KEY]);
          if (cloudRaw && cloudRaw[CLOUD_SAVE_KEY]) {
            try {
              const parsedCloud = JSON.parse(cloudRaw[CLOUD_SAVE_KEY]);
              cloudDataStr = parsedCloud.data;
              cloudTimestamp = parsedCloud.timestamp || 0;

              console.log("[useSave] Loaded from Cloud for new user.");
              localStorage.setItem(SAVE_KEY, cloudDataStr!);
              localStorage.setItem(TIMESTAMP_KEY, cloudTimestamp.toString());
              // Обновляем мету
              localStorage.setItem(META_KEY, JSON.stringify({ userId: currentUserId, timestamp: cloudTimestamp }));

              await useGameStore.persist.rehydrate();
              return true;
            } catch (e) {
              console.error("[useSave] Failed to parse cloud save", e);
            }
          }
          // Если в облаке пусто, начинаем с чистого листа
          console.log("[useSave] No cloud save for new user. Starting fresh.");
          localStorage.removeItem(SAVE_KEY);
          return false;
        } else {
          // Если мы гость, а предыдущий сейв был от юзера (или другого гостя с другим ID, хотя для гостей это сложнее)
          // Для простоты: если вышли из аккаунта (был юзер, стал null), сбрасываем
          if (metaUserId !== null && currentUserId === null) {
            console.log("[useSave] Logged out. Clearing local save.");
            localStorage.removeItem(SAVE_KEY);
            return false;
          }
          // Если оба null (гость -> гость), грузим как обычно ниже
        }
      }

      // Стандартная логика загрузки, если ID совпали или это тот же гость

      // 1. Получаем данные из Облака
      if (adService.getIsAuthorized()) {
        const cloudRaw = await adService.getData([CLOUD_SAVE_KEY]);
        if (cloudRaw && cloudRaw[CLOUD_SAVE_KEY]) {
          try {
            const parsedCloud = JSON.parse(cloudRaw[CLOUD_SAVE_KEY]);
            cloudDataStr = parsedCloud.data;
            cloudTimestamp = parsedCloud.timestamp || 0;
          } catch (e) {
            console.warn("[useSave] Legacy cloud save detected, migrating...");
            cloudDataStr = cloudRaw[CLOUD_SAVE_KEY];
            cloudTimestamp = 0;
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
        if (cloudTimestamp > localTimestamp) {
          console.log("[useSave] Cloud is newer. Loading from Cloud.");
          dataToLoad = cloudDataStr;
          source = "cloud";
          localStorage.setItem(TIMESTAMP_KEY, cloudTimestamp.toString());
        } else {
          console.log("[useSave] Local is newer or same. Loading from Local.");
          dataToLoad = localDataStr;
          source = "local";
        }
      } else if (cloudDataStr) {
        console.log("[useSave] Only Cloud save exists.");
        dataToLoad = cloudDataStr;
        source = "cloud";
        localStorage.setItem(TIMESTAMP_KEY, cloudTimestamp.toString());
      } else if (localDataStr) {
        console.log("[useSave] Only Local save exists.");
        dataToLoad = localDataStr;
        source = "local";
      }

      // 4. Загрузка данных в Store
      if (dataToLoad) {
        localStorage.setItem(SAVE_KEY, dataToLoad);
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

  const migrateSaveToCloud = useCallback(async () => {
    const localData = localStorage.getItem(SAVE_KEY);
    if (!localData) {
      console.log("[useSave] Migration skipped: No local save found.");
      return;
    }

    // 1. Получаем ID текущего пользователя (кто сейчас залогинен)
    const currentUserId = adService.getUniqueID();

    // 2. Получаем ID владельца локального сохранения (кто играл раньше)
    let metaUserId: string | null = null;
    try {
      const metaStr = localStorage.getItem(META_KEY);
      if (metaStr) {
        const meta = JSON.parse(metaStr);
        metaUserId = meta.userId;
      }
    } catch (e) {
      console.warn("[useSave] Failed to parse meta during migration", e);
    }

    // СЦЕНАРИЙ 1: Пользователь не авторизован (не должно происходить при вызове из кнопки "Войти", но на всякий случай)
    if (!currentUserId) {
      console.warn("[useSave] Migration called but user is not authorized.");
      return;
    }

    // СЦЕНАРИЙ 2: Локальный сейв принадлежит ДРУГОМУ пользователю (Смена аккаунта User A -> User B)
    // Если metaUserId не null и не совпадает с currentUserId, мы НЕ перезаписываем облако User B данными User A.
    if (metaUserId !== null && metaUserId !== currentUserId) {
      console.log("[useSave] Migration skipped: Local save belongs to a different user.", {
        metaUserId,
        currentUserId,
      });
      // В этом случае loadGame должен будет загрузить данные из облака для currentUserId, игнорируя локальные.
      return;
    }

    // СЦЕНАРИЙ 3: Гость -> Авторизованный пользователь (metaUserId === null) ИЛИ Тот же пользователь (metaUserId === currentUserId)
    console.log("[useSave] Starting migration to Cloud...", { metaUserId, currentUserId });

    try {
      // Проверяем, что уже есть в облаке
      const cloudRaw = await adService.getData([CLOUD_SAVE_KEY]);

      const now = Date.now();
      let shouldUpload = false;
      let finalPayload = "";

      if (!cloudRaw || !cloudRaw[CLOUD_SAVE_KEY]) {
        // В облаке пусто. Безопасно загружаем локальный прогресс.
        console.log("[useSave] Cloud is empty. Uploading local save.");
        finalPayload = JSON.stringify({ data: localData, timestamp: now });
        shouldUpload = true;
      } else {
        // В облаке что-то есть. Сравниваем время.
        try {
          const parsedCloud = JSON.parse(cloudRaw[CLOUD_SAVE_KEY]);
          const cloudTs = parsedCloud.timestamp || 0;
          // Берем timestamp локального сейва
          const localTs = parseInt(localStorage.getItem(TIMESTAMP_KEY) || "0", 10);

          if (localTs > cloudTs) {
            // Локальный сейв новее (например, игрок играл оффлайн или был гостем и прогрессировал)
            console.log("[useSave] Local save is newer than cloud. Updating cloud.");
            finalPayload = JSON.stringify({ data: localData, timestamp: now }); // Используем новое время для обновления
            shouldUpload = true;
          } else {
            // Облачный сейв новее или такой же.
            // Если это был Гость (metaUserId === null), а в облаке есть старые данные этого аккаунта,
            // то облачные данные важнее (игрок уже играл с этого аккаунта на другом устройстве).
            // Мы НЕ перезаписываем облако старыми данными гостя.
            console.log("[useSave] Cloud save is newer or equal. Keeping cloud data. Updating local meta.");
            // Обновляем локальный сейв данными из облака, чтобы синхронизироваться
            localStorage.setItem(SAVE_KEY, parsedCloud.data);
            localStorage.setItem(TIMESTAMP_KEY, cloudTs.toString());
            // Важно: обновляем мета-данные, чтобы привязать этот локальный файл к текущему пользователю
            localStorage.setItem(META_KEY, JSON.stringify({ userId: currentUserId, timestamp: cloudTs }));

            // Перезагружаем стейт игры, чтобы подтянуть облачные данные
            await useGameStore.persist.rehydrate();
            return;
          }
        } catch (e) {
          console.error("[useSave] Error comparing timestamps, forcing upload to be safe", e);
          finalPayload = JSON.stringify({ data: localData, timestamp: now });
          shouldUpload = true;
        }
      }

      if (shouldUpload) {
        await adService.setData({ [CLOUD_SAVE_KEY]: finalPayload });
        localStorage.setItem(TIMESTAMP_KEY, now.toString());
        localStorage.setItem(META_KEY, JSON.stringify({ userId: currentUserId, timestamp: now }));
        console.log("[useSave] Migration successful.");
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

  const resetGame = useCallback(async () => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    localStorage.removeItem(META_KEY);
    localStorage.removeItem("harem-clicker-last-save");

    if (adService.getIsAuthorized()) {
      await adService.setData({ [CLOUD_SAVE_KEY]: null });
      await adService.submitScore(0, "totalMaxLevels");
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    saveTimeoutRef.current = window.setInterval(() => {
      saveGame();
    }, 30000);
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
    canSave,
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
