import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";

const SAVE_KEY = "harem-clicker-save-v2";
const BACKUP_KEY = "harem-clicker-backup-v2";
const AUTO_SAVE_INTERVAL = 30000;

export function useAutoSave() {
  const saveTimeoutRef = useRef<number | null>(null);

  const saveGame = useCallback(() => {
    try {
      useGameStore.persist.rehydrate();
      console.log("[useSave] Game saved via persist");
    } catch (error) {
      console.error("[useSave] Save failed:", error);
    }
  }, []);

  const loadGame = useCallback(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      const hasSave = saved !== null;
      console.log("[useSave] Save check:", hasSave ? "found" : "not found");
      return hasSave;
    } catch (error) {
      console.error("[useSave] Load check failed:", error);
      return false;
    }
  }, []);

  const createBackup = useCallback(() => {
    try {
      const current = localStorage.getItem(SAVE_KEY);
      if (current) {
        localStorage.setItem(BACKUP_KEY, current);
        console.log("[useSave] Backup created");
      }
    } catch (error) {
      console.error("[useSave] Backup failed:", error);
    }
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem("harem-clicker-last-save");
    window.location.reload();
  }, []);

  const exportSave = useCallback((): string | null => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved ? btoa(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const importSave = useCallback((encoded: string): boolean => {
    try {
      const decoded = atob(encoded);
      JSON.parse(decoded);
      localStorage.setItem(SAVE_KEY, decoded);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    saveTimeoutRef.current = window.setInterval(() => {
      saveGame();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [saveGame]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGame();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveGame]);

  return {
    saveGame,
    loadGame,
    createBackup,
    resetGame,
    exportSave,
    importSave,
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
