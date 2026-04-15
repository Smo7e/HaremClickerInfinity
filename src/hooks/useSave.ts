// src/hooks/useSave.ts
import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { adService } from "../services/AdService";

const SAVE_KEY = "harem-clicker-save-v2";
const BACKUP_KEY = "harem-clicker-backup-v2";
const CLOUD_SAVE_KEY = "cloud_save_v1"; // Ключ для Яндекс.Облака

export function useAutoSave() {
  const saveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  // Основная функция сохранения
  const saveGame = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      // Zustand persist делает это автоматически, но нам нужно получить данные для облака
      // Просто берем из localStorage, так как persist уже записал туда актуальное состояние
      const localData = localStorage.getItem(SAVE_KEY);

      if (!localData) {
        isSavingRef.current = false;
        return;
      }

      // 1. Сохраняем в LocalStorage (как бэкап и для скорости)
      localStorage.setItem(SAVE_KEY, localData);
      localStorage.setItem("harem-clicker-last-save", JSON.stringify({ timestamp: Date.now() }));

      // 2. Если авторизованы, сохраняем в Облако
      if (adService.getIsAuthorized()) {
        await adService.setData({ [CLOUD_SAVE_KEY]: localData });
        console.log("[useSave] Saved to Cloud");
      } else {
        console.log("[useSave] Saved to LocalStorage only (not authorized)");
      }
    } catch (error) {
      console.error("[useSave] Save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Функция загрузки
  const loadGame = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Пробуем загрузить из Облака, если авторизованы
      if (adService.getIsAuthorized()) {
        const cloudData = await adService.getData([CLOUD_SAVE_KEY]);
        if (cloudData && cloudData[CLOUD_SAVE_KEY]) {
          console.log("[useSave] Loaded from Cloud");
          localStorage.setItem(SAVE_KEY, cloudData[CLOUD_SAVE_KEY]);
          // Триггерим реайдрацию стора
          await useGameStore.persist.rehydrate();
          return true;
        }
      }

      // 2. Если не авторизованы или в облаке пусто, грузим из LocalStorage
      const localData = localStorage.getItem(SAVE_KEY);
      if (localData) {
        console.log("[useSave] Loaded from LocalStorage");
        await useGameStore.persist.rehydrate();
        return true;
      }

      return false;
    } catch (error) {
      console.error("[useSave] Load check failed:", error);
      return false;
    }
  }, []);

  // Функция миграции: вызывается при успешной авторизации, если в LocalStorage есть сейв, а в Облаке нет
  const migrateSaveToCloud = useCallback(async () => {
    const localData = localStorage.getItem(SAVE_KEY);
    if (!localData) return;

    console.log("[useSave] Migrating save to Cloud...");
    try {
      // Проверяем, нет ли уже данных в облаке (чтобы не перезаписать более новый сейв, если пользователь зашел с другого устройства)
      const cloudData = await adService.getData([CLOUD_SAVE_KEY]);
      if (!cloudData || !cloudData[CLOUD_SAVE_KEY]) {
        await adService.setData({ [CLOUD_SAVE_KEY]: localData });
        console.log("[useSave] Migration successful");
      } else {
        console.log("[useSave] Cloud save already exists, skipping migration");
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

// ✅ ДОБАВИТЬ: Экспорт хука статуса, который отсутствовал
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
