// src/store/adStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdRewardType, AdCooldownState, ActiveAdBuff } from "../types/ads";
import { useGameStore } from "./gameStore";
import { AD_REWARDS } from "../game/adConstants";
import { STORAGE_KEYS } from "../utils/storageKeys";

interface AdState {
  cooldowns: AdCooldownState;
  activeBuffs: {
    damage?: ActiveAdBuff;
    drop?: ActiveAdBuff;
  };
}

interface AdActions {
  isRewardAvailable: (type: AdRewardType) => boolean;
  getCooldownSeconds: (type: AdRewardType) => number;
  applyReward: (type: AdRewardType) => void;
  checkBuffsExpiration: () => void;
  getDamageMultiplier: () => number;
  getDropMultiplier: () => number;
}

export const useAdStore = create<AdState & AdActions>()(
  persist(
    (set, get) => ({
      cooldowns: {},
      activeBuffs: {},

      isRewardAvailable: (type) => {
        const now = Date.now();
        const availableAt = get().cooldowns[type] || 0;
        return now >= availableAt;
      },

      getCooldownSeconds: (type) => {
        const now = Date.now();
        const availableAt = get().cooldowns[type] || 0;
        const diff = Math.ceil((availableAt - now) / 1000);
        return Math.max(0, diff);
      },

      applyReward: (type) => {
        const now = Date.now();
        const config = AD_REWARDS[type];
        const gameStore = useGameStore.getState();

        if (!config) {
          console.error(`[AdStore] Unknown reward type: ${type}`);
          return;
        }
        set((state) => ({
          cooldowns: {
            ...state.cooldowns,
            [type]: now + config.cooldownSeconds * 1000,
          },
        }));

        // Выдаем награды
        switch (type) {
          case "essence_100":
            gameStore.addItem("essence", 100);
            break;

          case "gems_10000":
            gameStore.addItem("gem", 10000);
            break;

          case "damage_2x":
            set((state) => ({
              activeBuffs: {
                ...state.activeBuffs,
                damage: {
                  type: "damage",
                  multiplier: 2,
                  expiresAt: now + (config.durationSeconds || 300) * 1000,
                },
              },
            }));
            break;

          case "drop_2x":
            set((state) => ({
              activeBuffs: {
                ...state.activeBuffs,
                drop: {
                  type: "drop",
                  multiplier: 2,
                  expiresAt: now + (config.durationSeconds || 300) * 1000,
                },
              },
            }));
            break;

          case "scroll_forest_40":
            gameStore.addItem("level_down_scroll_forest", 40);
            break;

          case "scroll_abyss_bundle":
            gameStore.addItem("exp_scroll_abyss", 1);
            gameStore.addItem("affection_potion_abyss", 1);
            break;
        }
      },

      checkBuffsExpiration: () => {
        const now = Date.now();
        set((state) => {
          const newBuffs = { ...state.activeBuffs };

          if (newBuffs.damage && newBuffs.damage.expiresAt <= now) {
            delete newBuffs.damage;
          }
          if (newBuffs.drop && newBuffs.drop.expiresAt <= now) {
            delete newBuffs.drop;
          }

          return { activeBuffs: newBuffs };
        });
      },

      getDamageMultiplier: () => {
        const buff = get().activeBuffs.damage;
        if (!buff) return 1;
        if (buff.expiresAt <= Date.now()) {
          get().checkBuffsExpiration();
          return 1;
        }
        return buff.multiplier;
      },

      getDropMultiplier: () => {
        const buff = get().activeBuffs.drop;
        if (!buff) return 1;
        if (buff.expiresAt <= Date.now()) {
          get().checkBuffsExpiration();
          return 1;
        }
        return buff.multiplier;
      },
    }),
    {
      name: STORAGE_KEYS.ADS_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cooldowns: state.cooldowns,
      }),
    },
  ),
);
