import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GameState, SerializedWaifu, GameActions, PersistedGameState } from "./types";
import { Inventory } from "../classes/Inventory";
import { Waifu } from "../classes/Waifu";
import { Enemy } from "../classes/Enemy";
import {
  testWaifus,
  LOCATIONS,
  LOCATION_UNLOCK_REQUIREMENTS,
  INITIAL_LOCATION_PROGRESS,
  INITIAL_GLOBAL_UPGRADES,
  COLLECTION_BUFFS,
  INVENTORY_ITEMS,
} from "../game/constant";
import type {
  TLocation,
  TElementType,
  TLocationProgress,
  IGlobalUpgrades,
  TBestiaryProgress,
  TDropItem,
  TInventoryItemId,
} from "../types";
import { useAdStore } from "./adStore";

const createInitialState = (): GameState => ({
  inventory: new Inventory(),
  ownedWaifus: [Waifu.fromTemplate(testWaifus[testWaifus.length - 1]!)],
  activeWaifuId: testWaifus[testWaifus.length - 1]?.id ?? null,
  enemy: Enemy.spawn(1, "forest"),
  currentLocation: "forest",
  locationProgress: INITIAL_LOCATION_PROGRESS,
  isPaused: false,
  globalUpgrades: INITIAL_GLOBAL_UPGRADES,
  panels: {
    gacha: false,
    collection: false,
    waifuSelect: false,
    upgrades: false,
    backpack: false,
    craft: false,
    pause: false,
    settings: false,
    locationSelector: false,
    waifuDetail: null,
    bestiary: false,
    ads: false,
  },
  bestiary: {},
  lastDrops: null,
});

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      addItem: (itemId: TInventoryItemId, count: number) => {
        const state = get();
        const current = state.inventory.clone();
        const template = INVENTORY_ITEMS[itemId];

        if (template?.type === "collection") {
          // Проверяем, есть ли уже в коллекции (чтобы не дублировать бафф)
          const alreadyHas = current.hasCollection(itemId);

          current.addItem(itemId, count);
          set({ inventory: current });

          // Применяем бафф только при первом получении
          if (!alreadyHas) {
            get().applyCollectionBuff(itemId);
          }
        } else {
          current.addItem(itemId, count);
          set({ inventory: current });
        }
      },

      removeItem: (itemId: string, count: number): boolean => {
        const current = get().inventory.clone();
        const success = current.removeItem(itemId, count);
        if (success) {
          set({ inventory: current });
        }
        return success;
      },

      useItem: (itemId: TInventoryItemId, waifuId?: string) => {
        const current = get().inventory;
        const result = current.useItem(itemId, waifuId);
        if (result.success) {
          const cloned = current.clone();
          set({ inventory: cloned });
        }
        return result;
      },

      refreshInventory: () => {
        const current = get().inventory.clone();
        set({ inventory: current });
      },

      addWaifu: (waifu: Waifu) => {
        const state = get();
        const existing = state.ownedWaifus.find((w) => w.id === waifu.id);
        if (existing) {
          const updatedWaifus = state.ownedWaifus.map((w) => {
            if (w.id === waifu.id) {
              const newWaifu = w.clone();
              newWaifu.addDuplicate();
              newWaifu.setGlobalUpgrades(state.globalUpgrades);
              return newWaifu;
            }
            return w;
          });
          set({ ownedWaifus: updatedWaifus });
        } else {
          waifu.setGlobalUpgrades(state.globalUpgrades);
          set({
            ownedWaifus: [...state.ownedWaifus, waifu],
            activeWaifuId: state.activeWaifuId ?? waifu.id,
          });
        }
      },

      setActiveWaifu: (waifuId: string) => {
        set({ activeWaifuId: waifuId });
      },

      removeWaifu: (waifuId: string) => {
        set((state) => {
          const newWaifus = state.ownedWaifus.filter((w) => w.id !== waifuId);
          let newActiveId = state.activeWaifuId;
          if (state.activeWaifuId === waifuId) {
            newActiveId = newWaifus[0]?.id ?? null;
          }
          return {
            ownedWaifus: newWaifus,
            activeWaifuId: newActiveId,
          };
        });
      },

      refreshWaifus: () => {
        const state = get();
        const updatedWaifus = state.ownedWaifus.map((w) => {
          const newWaifu = w.clone();
          newWaifu.setGlobalUpgrades(state.globalUpgrades);
          return newWaifu;
        });
        set({ ownedWaifus: updatedWaifus });
      },

      spawnEnemy: () => {
        const state = get();
        const level = state.locationProgress[state.currentLocation].currentLevel;
        set({ enemy: Enemy.spawn(level, state.currentLocation) });
      },

      dealDamage: (damage: number, isCrit: boolean): number => {
        const state = get();
        const enemy = state.enemy;
        const activeWaifu = state.ownedWaifus.find((w) => w.id === state.activeWaifuId);

        if (!enemy || !activeWaifu || enemy.currentHp <= 0) return 0;

        const enemyTypeDamageBonus = state.globalUpgrades.collectionBuffs.enemyTypeDamage[enemy.nameKey] || 0;
        const actualDamage = enemy.takeDamage(
          {
            type: activeWaifu.element,
            amount: damage,
            isCrit,
            critMultiplier: activeWaifu.getCritMultiplier(),
            source: activeWaifu.id,
          },
          enemyTypeDamageBonus,
        );

        const newEnemy = Enemy.fromExisting(enemy, enemy.currentHp);
        set({ enemy: newEnemy });

        if (!newEnemy.isAlive()) {
          setTimeout(() => {
            const currentState = get();
            if (currentState.enemy?.id === newEnemy.id && !currentState.enemy.isAlive()) {
              currentState.defeatEnemy();
            }
          }, 100);
        }

        return actualDamage;
      },

      defeatEnemy: () => {
        const state = get();
        const enemy = state.enemy;
        if (!enemy) return;

        get().recordEnemyKill(enemy.nameKey);

        const locationConfig = LOCATIONS.find((l) => l.id === state.currentLocation);
        if (!locationConfig) return;
        const bonuses = locationConfig.bonuses;
        const gemBonus = state.globalUpgrades.collectionBuffs.gemBonus;
        const expBonus = state.globalUpgrades.collectionBuffs.expBonus;
        const expReward = Math.floor(enemy.expReward * bonuses.expMultiplier * (1 + expBonus));
        const activeWaifu = state.ownedWaifus.find((w) => w.id === state.activeWaifuId);
        if (activeWaifu) {
          const leveledUp = activeWaifu.addExp(expReward);
          if (leveledUp) {
            set({ ownedWaifus: [...state.ownedWaifus] });
          }
        }
        const currentLevel = state.locationProgress[state.currentLocation].currentLevel;
        const baseGems = Math.floor(10 + currentLevel / 5);
        const boostedGems = Math.floor(baseGems * bonuses.gemMultiplier * (1 + gemBonus));
        state.addItem("gem", boostedGems);
        const baseEssence = 1;
        const boostedEssence = Math.floor(baseEssence * bonuses.essenceMultiplier);
        state.addItem("essence", Math.max(1, boostedEssence));

        const dropMultiplier = useAdStore.getState().getDropMultiplier();
        const baseDrops = enemy.rollDrops();
        const finalDrops: Array<{ id: string; count: number }> = [];

        for (const drop of baseDrops) {
          const boostedCount = Math.floor(drop.count * dropMultiplier);
          const countToAdd = Math.max(1, boostedCount);
          state.addItem(drop.id, countToAdd);
          finalDrops.push({ id: drop.id, count: countToAdd });
        }

        const newProgress = {
          ...state.locationProgress,
          [state.currentLocation]: {
            ...state.locationProgress[state.currentLocation],
            currentLevel: state.locationProgress[state.currentLocation].currentLevel + 1,
            maxLevelReached: Math.max(
              state.locationProgress[state.currentLocation].maxLevelReached,
              state.locationProgress[state.currentLocation].currentLevel + 1,
            ),
          },
        };

        const newEnemy = Enemy.spawn(newProgress[state.currentLocation].currentLevel, state.currentLocation);

        set({
          locationProgress: newProgress,
          enemy: newEnemy,
          lastDrops: finalDrops,
        });

        setTimeout(() => {
          get().checkLocationUnlocks();
        }, 0);
      },
      changeLocation: (location: TLocation) => {
        set({ currentLocation: location });
        setTimeout(() => {
          get().spawnEnemy();
        }, 0);
      },

      setPaused: (paused: boolean) => {
        set({ isPaused: paused });
      },

      checkLocationUnlocks: () => {
        const state = get();
        const newProgress = { ...state.locationProgress };
        let changed = false;
        for (const [locationId, requirement] of Object.entries(LOCATION_UNLOCK_REQUIREMENTS)) {
          const locId = locationId as TLocation;
          if (!newProgress[locId].unlocked && requirement) {
            const prevLocation = requirement.prevLocation;
            if (newProgress[prevLocation].maxLevelReached >= requirement.killLevel) {
              newProgress[locId].unlocked = true;
              changed = true;
            }
          }
        }
        if (changed) {
          set({ locationProgress: newProgress });
        }
      },

      openPanel: (panel: keyof GameState["panels"]) => {
        set((state) => ({
          panels: { ...state.panels, [panel]: true },
        }));
      },

      closePanel: (panel: keyof GameState["panels"]) => {
        set((state) => ({
          panels: { ...state.panels, [panel]: false },
        }));
      },

      togglePanel: (panel: keyof GameState["panels"]) => {
        set((state) => ({
          panels: { ...state.panels, [panel]: !state.panels[panel] },
        }));
      },

      upgradeClickPower: (): boolean => {
        const state = get();
        const currentLevel = state.globalUpgrades.clickPowerBonus;
        const cost = Math.floor(10 + Math.pow(currentLevel, 2.3));

        const inventory = state.inventory.clone();
        if (!inventory.removeItem("gem", cost)) {
          return false;
        }
        set({
          inventory,
          globalUpgrades: {
            ...state.globalUpgrades,
            clickPowerBonus: currentLevel + 1,
          },
        });
        get().refreshWaifus();
        return true;
      },

      upgradeElement: (element: TElementType): boolean => {
        const state = get();
        const currentLevel = state.globalUpgrades.elementDamage[element];
        const cost = Math.floor(100 * Math.pow(1.5, currentLevel));
        const inventory = state.inventory.clone();
        if (!inventory.removeItem("gem", cost)) {
          return false;
        }
        set({
          inventory,
          globalUpgrades: {
            ...state.globalUpgrades,
            elementDamage: {
              ...state.globalUpgrades.elementDamage,
              [element]: currentLevel + 1,
            },
          },
        });
        get().refreshWaifus();
        return true;
      },

      resetGame: () => {
        localStorage.removeItem("harem-clicker-save-v2");
        window.location.reload();
      },

      loadGame: (_savedState: Partial<GameState>) => {
        console.log("[Store] Load game");
      },

      recordEnemyKill: (enemyNameKey: string) => {
        set((state) => {
          const currentEntry = state.bestiary[enemyNameKey];
          const newBestiary = {
            ...state.bestiary,
            [enemyNameKey]: {
              enemyId: enemyNameKey,
              killCount: (currentEntry?.killCount || 0) + 1,
              unlocked: true,
              firstSeenAt: currentEntry?.firstSeenAt || Date.now(),
            },
          };
          return { bestiary: newBestiary };
        });
      },

      getBestiaryEntry: (enemyId: string) => {
        const state = get();
        return state.bestiary[enemyId];
      },

      // НОВЫЕ МЕТОДЫ ДЛЯ БАФФОВ КОЛЛЕКЦИИ
      applyCollectionBuff: (itemId: TInventoryItemId) => {
        const buff = COLLECTION_BUFFS[itemId];
        if (!buff) return;

        set((state) => {
          const newGlobalUpgrades = { ...state.globalUpgrades };
          const newCollectionBuffs = { ...newGlobalUpgrades.collectionBuffs };

          switch (buff.buffType) {
            case "enemy_type_damage":
              if (buff.target) {
                newCollectionBuffs.enemyTypeDamage = {
                  ...newCollectionBuffs.enemyTypeDamage,
                  [buff.target]: (newCollectionBuffs.enemyTypeDamage[buff.target] || 0) + buff.value,
                };
              }
              break;
            case "element_damage":
              if (buff.target) {
                newCollectionBuffs.elementDamage = {
                  ...newCollectionBuffs.elementDamage,
                  [buff.target as TElementType]:
                    (newCollectionBuffs.elementDamage[buff.target as TElementType] || 0) + buff.value,
                };
              }
              break;
            case "crit_power":
              newCollectionBuffs.critPowerBonus += buff.value;
              break;
            case "gem_bonus":
              newCollectionBuffs.gemBonus += buff.value;
              break;
            case "exp_bonus":
              newCollectionBuffs.expBonus += buff.value;
              break;
          }

          newGlobalUpgrades.collectionBuffs = newCollectionBuffs;

          const updatedWaifus = state.ownedWaifus.map((w) => {
            const newWaifu = w.clone();
            newWaifu.setGlobalUpgrades(newGlobalUpgrades);
            return newWaifu;
          });

          return {
            globalUpgrades: newGlobalUpgrades,
            ownedWaifus: updatedWaifus,
          };
        });
      },

      recalculateCollectionBuffs: () => {
        const state = get();
        const collection = state.inventory.getCollection();

        const newCollectionBuffs = {
          elementDamage: { water: 0, fire: 0, earth: 0, ice: 0, light: 0, dark: 0, physical: 0 },
          enemyTypeDamage: {} as Record<string, number>,
          critPowerBonus: 0,
          gemBonus: 0,
          expBonus: 0,
        };

        collection.forEach((_, itemId) => {
          const buff = COLLECTION_BUFFS[itemId as TInventoryItemId];
          if (buff) {
            switch (buff.buffType) {
              case "enemy_type_damage":
                if (buff.target) {
                  newCollectionBuffs.enemyTypeDamage[buff.target] =
                    (newCollectionBuffs.enemyTypeDamage[buff.target] || 0) + buff.value;
                }
                break;
              case "element_damage":
                if (buff.target) {
                  newCollectionBuffs.elementDamage[buff.target as TElementType] += buff.value;
                }
                break;
              case "crit_power":
                newCollectionBuffs.critPowerBonus += buff.value;
                break;
              case "gem_bonus":
                newCollectionBuffs.gemBonus += buff.value;
                break;
              case "exp_bonus":
                newCollectionBuffs.expBonus += buff.value;
                break;
            }
          }
        });

        set((state) => {
          const newGlobalUpgrades = {
            ...state.globalUpgrades,
            collectionBuffs: newCollectionBuffs,
          };

          const updatedWaifus = state.ownedWaifus.map((w) => {
            const newWaifu = w.clone();
            newWaifu.setGlobalUpgrades(newGlobalUpgrades);
            return newWaifu;
          });

          return {
            globalUpgrades: newGlobalUpgrades,
            ownedWaifus: updatedWaifus,
          };
        });
      },
    }),
    {
      name: "harem-clicker-save-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const partial: PersistedGameState = {
          inventory: state.inventory.serialize(),
          ownedWaifus: state.ownedWaifus.map((w) => ({
            id: w.id,
            stats: { ...w.stats },
            duplicateCount: w.duplicateCount,
            unlockedOutfits: [...w.unlockedOutfits],
            currentOutfit: w.currentOutfit,
          })),
          activeWaifuId: state.activeWaifuId,
          currentLocation: state.currentLocation,
          locationProgress: state.locationProgress,
          globalUpgrades: state.globalUpgrades,
          bestiary: state.bestiary,
          enemy: state.enemy
            ? {
                id: state.enemy.id,
                nameKey: state.enemy.nameKey,
                level: state.enemy.level,
                maxHp: state.enemy.maxHp,
                currentHp: state.enemy.currentHp,
                sprite: state.enemy.sprite,
                isBoss: state.enemy.isBoss,
                resistances: state.enemy.resistances,
                drops: state.enemy.drops,
              }
            : null,
        };
        return partial;
      },
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState;
        }

        const saved = persistedState as Record<string, unknown>;

        const inventory = new Inventory();
        const inventoryData = saved.inventory;
        if (typeof inventoryData === "string") {
          try {
            const parsed = JSON.parse(inventoryData);
            if (parsed && typeof parsed === "object") {
              inventory.items = new Map(parsed.items || []);
              inventory.collection = new Map(parsed.collection || []);
            }
          } catch (e) {
            console.warn("[Store] Failed to deserialize inventory:", e);
          }
        }

        const mergedGlobalUpgrades = (saved.globalUpgrades as IGlobalUpgrades) ?? currentState.globalUpgrades;
        const mergedBestiary = (saved.bestiary as TBestiaryProgress) ?? currentState.bestiary;

        const ownedWaifusRaw = saved.ownedWaifus;
        let ownedWaifus = currentState.ownedWaifus;
        if (Array.isArray(ownedWaifusRaw)) {
          ownedWaifus = ownedWaifusRaw.map((data: SerializedWaifu) => {
            try {
              const template = testWaifus.find((t) => t.id === data.id);
              const waifu = template ? Waifu.fromTemplate(template) : Waifu.createDefault();
              waifu.stats = { ...data.stats };
              waifu.duplicateCount = data.duplicateCount;
              waifu.unlockedOutfits = data.unlockedOutfits || [];
              waifu.currentOutfit = data.currentOutfit || "default";
              waifu.setGlobalUpgrades(mergedGlobalUpgrades);
              return waifu;
            } catch (e) {
              console.warn(`[Store] Failed to deserialize waifu ${data?.id}:`, e);
              return Waifu.createDefault();
            }
          });
        }

        let enemy: Enemy | null = null;
        const savedEnemy = saved.enemy as {
          id: string;
          nameKey: string;
          level: number;
          maxHp: number;
          currentHp: number;
          sprite: string;
          isBoss: boolean;
          resistances: Record<TElementType, number>;
          drops: TDropItem[];
        } | null;

        if (savedEnemy) {
          try {
            enemy = new Enemy({
              id: savedEnemy.id,
              nameKey: savedEnemy.nameKey,
              level: savedEnemy.level,
              maxHp: savedEnemy.maxHp,
              resistances: savedEnemy.resistances,
              sprite: savedEnemy.sprite,
              isBoss: savedEnemy.isBoss,
              drops: savedEnemy.drops,
            });
            enemy.currentHp = savedEnemy.currentHp;
          } catch (e) {
            console.warn("[Store] Failed to restore enemy:", e);
            enemy = null;
          }
        }

        if (!enemy) {
          const savedLocation = (saved.currentLocation as TLocation) ?? currentState.currentLocation;
          const savedProgress = (saved.locationProgress as TLocationProgress) ?? currentState.locationProgress;
          const level = savedProgress[savedLocation]?.currentLevel ?? 1;
          enemy = Enemy.spawn(level, savedLocation);
        }

        // Пересчитываем баффы коллекции при загрузке
        const finalState = {
          ...currentState,
          inventory,
          ownedWaifus,
          activeWaifuId: (saved.activeWaifuId as string | null) ?? currentState.activeWaifuId,
          currentLocation: (saved.currentLocation as TLocation) ?? currentState.currentLocation,
          locationProgress: (saved.locationProgress as TLocationProgress) ?? currentState.locationProgress,
          globalUpgrades: mergedGlobalUpgrades,
          bestiary: mergedBestiary,
          enemy,
        };

        // Отложенный пересчет баффов после восстановления состояния
        setTimeout(() => {
          useGameStore.getState().recalculateCollectionBuffs();
        }, 0);

        return finalState;
      },
      onRehydrateStorage: () => (_state, _error) => {
        if (_error) {
          console.error("[Store] Rehydration failed:", _error);
        } else {
          console.log("[Store] Rehydration successful");
        }
      },
    },
  ),
);
