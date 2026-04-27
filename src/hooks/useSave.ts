// src/hooks/useSave.ts
import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { adService } from "../services/AdService";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { Waifu } from "../classes/Waifu";
import { Inventory } from "../classes/Inventory";

export const KEY = STORAGE_KEYS;

let canSave = true;

export function setCanSave(value: boolean) {
  canSave = value;
}

export function useAutoSave() {
  const saveTimeoutRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  const saveGame = useCallback(async () => {
    if (isSavingRef.current || !canSave) return;
    isSavingRef.current = true;
    try {
      // Используем STORAGE_KEYS.SAVE вместо SAVE_KEY
      const localData = localStorage.getItem(STORAGE_KEYS.SAVE);
      if (!localData) {
        isSavingRef.current = false;
        return;
      }

      const now = Date.now();
      const currentUserId = adService.getIsAuthorized() ? adService.getUniqueID() : null;

      // 1. Сохраняем в LocalStorage
      localStorage.setItem(STORAGE_KEYS.SAVE, localData);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, now.toString());

      // ИЗМЕНЕНО: сохраняем ID владельца локального сейва
      localStorage.setItem(STORAGE_KEYS.META, JSON.stringify({ userId: currentUserId, timestamp: now }));

      // 2. Если авторизованы, сохраняем в Облако
      if (adService.getIsAuthorized()) {
        const cloudPayload = {
          data: localData,
          timestamp: now,
        };
        await adService.setData({ [STORAGE_KEYS.CLOUD_SAVE]: JSON.stringify(cloudPayload) });
        console.log("[useSave] Saved to Cloud with timestamp:", now);
      } else {
        console.log("[useSave] Saved to LocalStorage only (not authorized)");
      }
    } catch (error) {
      console.error("[useSave] Save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [canSave]);

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
        const metaStr = localStorage.getItem(STORAGE_KEYS.META);
        if (metaStr) {
          const meta = JSON.parse(metaStr);
          metaUserId = meta.userId;
        }
      } catch (e) {
        console.warn("[useSave] Failed to parse meta", e);
      }

      // ИЗМЕНЕНО: Проверка на смену пользователя
      if (currentUserId !== metaUserId) {
        console.log("[useSave] User mismatch detected. Ignoring local save.");
        if (adService.getIsAuthorized()) {
          const cloudRaw = await adService.getData([STORAGE_KEYS.CLOUD_SAVE]);
          if (cloudRaw && cloudRaw[STORAGE_KEYS.CLOUD_SAVE]) {
            try {
              const parsedCloud = JSON.parse(cloudRaw[STORAGE_KEYS.CLOUD_SAVE]);
              cloudDataStr = parsedCloud.data;
              cloudTimestamp = parsedCloud.timestamp || 0;
              console.log("[useSave] Loaded from Cloud for new user.");

              localStorage.setItem(STORAGE_KEYS.SAVE, cloudDataStr!);
              localStorage.setItem(STORAGE_KEYS.TIMESTAMP, cloudTimestamp.toString());
              localStorage.setItem(
                STORAGE_KEYS.META,
                JSON.stringify({ userId: currentUserId, timestamp: cloudTimestamp }),
              );

              await useGameStore.persist.rehydrate();
              return true;
            } catch (e) {
              console.error("[useSave] Failed to parse cloud save", e);
            }
          }
          console.log("[useSave] No cloud save for new user. Starting fresh.");
          localStorage.removeItem(STORAGE_KEYS.SAVE);
          return false;
        } else {
          if (metaUserId !== null && currentUserId === null) {
            console.log("[useSave] Logged out. Clearing local save.");
            localStorage.removeItem(STORAGE_KEYS.SAVE);
            return false;
          }
        }
      }

      // Стандартная логика загрузки
      if (adService.getIsAuthorized()) {
        const cloudRaw = await adService.getData([STORAGE_KEYS.CLOUD_SAVE]);
        if (cloudRaw && cloudRaw[STORAGE_KEYS.CLOUD_SAVE]) {
          try {
            const parsedCloud = JSON.parse(cloudRaw[STORAGE_KEYS.CLOUD_SAVE]);
            cloudDataStr = parsedCloud.data;
            cloudTimestamp = parsedCloud.timestamp || 0;
          } catch (e) {
            console.warn("[useSave] Legacy cloud save detected, migrating...");
            cloudDataStr = cloudRaw[STORAGE_KEYS.CLOUD_SAVE];
            cloudTimestamp = 0;
          }
        }
      }

      localDataStr = localStorage.getItem(STORAGE_KEYS.SAVE);
      const savedTs = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      localTimestamp = savedTs ? parseInt(savedTs, 10) : 0;

      let dataToLoad: string | null = null;
      let source = "none";

      if (cloudDataStr && localDataStr) {
        if (cloudTimestamp > localTimestamp) {
          console.log("[useSave] Cloud is newer. Loading from Cloud.");
          dataToLoad = cloudDataStr;
          source = "cloud";
          localStorage.setItem(STORAGE_KEYS.TIMESTAMP, cloudTimestamp.toString());
        } else {
          console.log("[useSave] Local is newer or same. Loading from Local.");
          dataToLoad = localDataStr;
          source = "local";
        }
      } else if (cloudDataStr) {
        console.log("[useSave] Only Cloud save exists.");
        dataToLoad = cloudDataStr;
        source = "cloud";
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, cloudTimestamp.toString());
      } else if (localDataStr) {
        console.log("[useSave] Only Local save exists.");
        dataToLoad = localDataStr;
        source = "local";
      }

      if (dataToLoad) {
        localStorage.setItem(STORAGE_KEYS.SAVE, dataToLoad);
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
    const localData = localStorage.getItem(STORAGE_KEYS.SAVE);
    if (!localData) {
      console.log("[useSave] Migration skipped: No local save found.");
      return;
    }

    const currentUserId = adService.getUniqueID();
    let metaUserId: string | null = null;
    try {
      const metaStr = localStorage.getItem(STORAGE_KEYS.META);
      if (metaStr) {
        const meta = JSON.parse(metaStr);
        metaUserId = meta.userId;
      }
    } catch (e) {
      console.warn("[useSave] Failed to parse meta during migration", e);
    }

    if (!currentUserId) {
      console.warn("[useSave] Migration called but user is not authorized.");
      return;
    }

    if (metaUserId !== null && metaUserId !== currentUserId) {
      console.log("[useSave] Migration skipped: Local save belongs to a different user.", {
        metaUserId,
        currentUserId,
      });
      return;
    }

    console.log("[useSave] Starting migration to Cloud...", { metaUserId, currentUserId });
    try {
      const cloudRaw = await adService.getData([STORAGE_KEYS.CLOUD_SAVE]);
      const now = Date.now();
      let shouldUpload = false;
      let finalPayload = "";

      if (!cloudRaw || !cloudRaw[STORAGE_KEYS.CLOUD_SAVE]) {
        console.log("[useSave] Cloud is empty. Uploading local save.");
        finalPayload = JSON.stringify({ data: localData, timestamp: now });
        shouldUpload = true;
      } else {
        try {
          const parsedCloud = JSON.parse(cloudRaw[STORAGE_KEYS.CLOUD_SAVE]);
          const cloudTs = parsedCloud.timestamp || 0;
          const localTs = parseInt(localStorage.getItem(STORAGE_KEYS.TIMESTAMP) || "0", 10);

          if (localTs > cloudTs) {
            console.log("[useSave] Local save is newer than cloud. Updating cloud.");
            finalPayload = JSON.stringify({ data: localData, timestamp: now });
            shouldUpload = true;
          } else {
            console.log("[useSave] Cloud save is newer or equal. Keeping cloud data. Updating local meta.");
            localStorage.setItem(STORAGE_KEYS.SAVE, parsedCloud.data);
            localStorage.setItem(STORAGE_KEYS.TIMESTAMP, cloudTs.toString());
            localStorage.setItem(STORAGE_KEYS.META, JSON.stringify({ userId: currentUserId, timestamp: cloudTs }));
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
        await adService.setData({ [STORAGE_KEYS.CLOUD_SAVE]: finalPayload });
        localStorage.setItem(STORAGE_KEYS.TIMESTAMP, now.toString());
        localStorage.setItem(STORAGE_KEYS.META, JSON.stringify({ userId: currentUserId, timestamp: now }));
        console.log("[useSave] Migration successful.");
      }
    } catch (err) {
      console.error("[useSave] Migration failed", err);
    }
  }, []);

  const createBackup = useCallback(() => {
    try {
      const current = localStorage.getItem(STORAGE_KEYS.SAVE);
      if (current) {
        localStorage.setItem(STORAGE_KEYS.BACKUP, current);
      }
    } catch (error) {
      console.error("[useSave] Backup failed:", error);
    }
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
      const data = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  const getSaveSize = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVE);
      return saved ? new Blob([saved]).size : 0;
    } catch {
      return 0;
    }
  }, []);

  const hasSave = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.SAVE) !== null;
  }, []);

  return {
    getLastSaveTime,
    getSaveSize,
    hasSave,
  };
}

export const resetGame = async () => {
  console.log("[resetGame] Starting hard reset...");
  setCanSave(false); // Блокируем автосохранение

  try {
    // 1. Немедленно очищаем LocalStorage
    localStorage.removeItem(STORAGE_KEYS.SAVE);
    localStorage.removeItem(STORAGE_KEYS.BACKUP);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.META);
    localStorage.removeItem(STORAGE_KEYS.ERROR_LOG);
    localStorage.removeItem(STORAGE_KEYS.ADS_STATE);
    localStorage.removeItem(STORAGE_KEYS.LEADERBOARD_LAST_SENT);

    // Очищаем состояние Zustand вручную, чтобы при рехадратации не было мусора
    useGameStore.setState({
      inventory: new Inventory(),
      ownedWaifus: [Waifu.createDefault()],
      activeWaifuId: "wf_sakura_001",
      currentLocation: "forest",
      locationProgress: {
        forest: { currentLevel: 1, maxLevelReached: 1, unlocked: true },
        desert: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
        ice: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
        volcano: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
        castle: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
        abyss: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
      },
      enemy: null,
      globalUpgrades: {
        clickPowerBonus: 0,
        elementDamage: { water: 0, fire: 0, earth: 0, ice: 0, light: 0, dark: 0, physical: 0 },
        collectionBuffs: {
          elementDamage: { water: 0, fire: 0, earth: 0, ice: 0, light: 0, dark: 0, physical: 0 },
          enemyTypeDamage: {},
          critPowerBonus: 0,
          gemBonus: 0,
          expBonus: 0,
        },
      },
      bestiary: {},
      panels: {
        locationSelector: false,
        gacha: false,
        collection: false,
        waifuSelect: false,
        upgrades: false,
        backpack: false,
        craft: false,
        bestiary: false,
        pause: false,
        settings: false,
        waifuDetail: null,
        ads: false,
      },
      isPaused: false,
      lastDrops: null,
    });

    console.log("[resetGame] LocalStorage cleared and State reset.");

    // 2. Если авторизован, очищаем Облако и ЖДЕМ
    if (adService.getIsAuthorized()) {
      try {
        console.log("[resetGame] Clearing Cloud Save...");

        // Формируем пустой пейлоад. Важно: timestamp должен быть актуальным
        const now = Date.now();
        // Создаем пустое состояние для сериализации
        const emptyInventory = new Inventory();
        const emptyWaifu = Waifu.createDefault();

        // Структура должна соответствовать тому, что ожидает merge/partialize,
        // но проще отправить просто пустой объект данных, если ваша логика loadGame это умеет обрабатывать.
        // Однако, чтобы перебить старые данные, отправим валидную структуру с нулями.

        const emptyPayload = JSON.stringify({
          data: JSON.stringify({
            inventory: emptyInventory.serialize(),
            ownedWaifus: [
              {
                id: emptyWaifu.id,
                stats: { ...emptyWaifu.stats },
                duplicateCount: 0,
                unlockedOutfits: ["default"],
                currentOutfit: "default",
              },
            ],
            activeWaifuId: emptyWaifu.id,
            currentLocation: "forest",
            locationProgress: {
              forest: { currentLevel: 1, maxLevelReached: 1, unlocked: true },
              desert: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
              ice: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
              volcano: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
              castle: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
              abyss: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
            },
            globalUpgrades: {
              clickPowerBonus: 0,
              elementDamage: { water: 0, fire: 0, earth: 0, ice: 0, light: 0, dark: 0, physical: 0 },
              collectionBuffs: {
                elementDamage: { water: 0, fire: 0, earth: 0, ice: 0, light: 0, dark: 0, physical: 0 },
                enemyTypeDamage: {},
                critPowerBonus: 0,
                gemBonus: 0,
                expBonus: 0,
              },
            },
            bestiary: {},
            enemy: null,
          }),
          timestamp: now,
        });

        // Ждем завершения записи
        await adService.setData({ [STORAGE_KEYS.CLOUD_SAVE]: emptyPayload });
        console.log("[resetGame] Cloud save successfully overwritten.");

        // Сбрасываем скор
        await adService.submitScore(0);
      } catch (e) {
        console.error("[resetGame] Failed to clear cloud save:", e);
      }
    }

    // 3. Принудительная перезагрузка с небольшой задержкой
    // Даем браузеру время применить изменения LS и отправить запросы
    setTimeout(() => {
      window.location.reload();
    }, 800);
  } catch (e) {
    console.error("[resetGame] Critical error:", e);
    window.location.reload();
  }
};
