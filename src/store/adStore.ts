// src/store/adStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AdRewardType, AdCooldownState, ActiveAdBuff, TimerState } from "../types/ads";
import { useGameStore } from "./gameStore";
import { AD_REWARDS } from "../game/adConstants";
import { STORAGE_KEYS } from "../utils/storageKeys";

interface AdState {
  cooldowns: Record<string, TimerState>;
  activeBuffs: {
    damage?: ActiveAdBuff;
    drop?: ActiveAdBuff;
  };
  isGamePaused: boolean;
  isAdPlaying: boolean;
}

interface AdActions {
  isRewardAvailable: (type: AdRewardType) => boolean;
  getCooldownSeconds: (type: AdRewardType) => number;
  getBuffRemainingSeconds: (type: "damage" | "drop") => number;
  applyReward: (type: AdRewardType) => void;
  checkBuffsExpiration: () => void;
  getDamageMultiplier: () => number;
  getDropMultiplier: () => number;
  setGamePaused: (paused: boolean) => void;
  setAdPlaying: (playing: boolean) => void;
  tick: () => void;
}

function createTimer(totalSeconds: number): TimerState {
  return {
    totalSeconds,
    remainingSeconds: totalSeconds,
    isRunning: true,
    lastTickTime: Date.now(),
  };
}

function isTimerExpired(timer: TimerState | undefined): boolean {
  if (!timer) return true;
  return timer.remainingSeconds <= 0;
}

export const useAdStore = create<AdState & AdActions>()(
  persist(
    (set, get) => ({
      cooldowns: {},
      activeBuffs: {},
      isGamePaused: false,
      isAdPlaying: false,

      isRewardAvailable: (type) => {
        const timer = get().cooldowns[type];
        if (!timer) return true;
        return timer.remainingSeconds <= 0;
      },

      getCooldownSeconds: (type) => {
        const timer = get().cooldowns[type];
        if (!timer) return 0;
        return Math.max(0, Math.ceil(timer.remainingSeconds));
      },

      getBuffRemainingSeconds: (type) => {
        const buff = get().activeBuffs[type];
        if (!buff) return 0;
        const timer = buff.timer;
        if (!timer) return 0;
        return Math.max(0, Math.ceil(timer.remainingSeconds));
      },

      applyReward: (type) => {
        const config = AD_REWARDS[type];
        const gameStore = useGameStore.getState();

        if (!config) {
          console.error(`[AdStore] Unknown reward type: ${type}`);
          return;
        }

        const cooldownTimer = createTimer(config.cooldownSeconds);

        set((state) => ({
          cooldowns: {
            ...state.cooldowns,
            [type]: cooldownTimer,
          },
        }));

        switch (type) {
          case "essence_100":
            gameStore.addItem("essence", 100);
            break;
          case "gems_10000":
            gameStore.addItem("gem", 10000);
            break;
          case "damage_2x": {
            const duration = config.durationSeconds || 300;
            const buffTimer = createTimer(duration);
            set((state) => ({
              activeBuffs: {
                ...state.activeBuffs,
                damage: {
                  type: "damage",
                  multiplier: 2,
                  timer: buffTimer,
                },
              },
            }));
            break;
          }
          case "drop_2x": {
            const duration = config.durationSeconds || 300;
            const buffTimer = createTimer(duration);
            set((state) => ({
              activeBuffs: {
                ...state.activeBuffs,
                drop: {
                  type: "drop",
                  multiplier: 2,
                  timer: buffTimer,
                },
              },
            }));
            break;
          }
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
        set((state) => {
          const newBuffs = { ...state.activeBuffs };
          if (newBuffs.damage && isTimerExpired(newBuffs.damage.timer)) {
            delete newBuffs.damage;
          }
          if (newBuffs.drop && isTimerExpired(newBuffs.drop.timer)) {
            delete newBuffs.drop;
          }
          return { activeBuffs: newBuffs };
        });
      },

      getDamageMultiplier: () => {
        const buff = get().activeBuffs.damage;
        if (!buff) return 1;
        if (isTimerExpired(buff.timer)) {
          get().checkBuffsExpiration();
          return 1;
        }
        return buff.multiplier;
      },

      getDropMultiplier: () => {
        const buff = get().activeBuffs.drop;
        if (!buff) return 1;
        if (isTimerExpired(buff.timer)) {
          get().checkBuffsExpiration();
          return 1;
        }
        return buff.multiplier;
      },

      setGamePaused: (paused: boolean) => {
        set({ isGamePaused: paused });
      },

      setAdPlaying: (playing: boolean) => {
        set({ isAdPlaying: playing });
      },

      tick: () => {
        const state = get();
        console.log(state.isGamePaused || state.isAdPlaying, 1000000);
        // НЕ уменьшаем таймеры если игра на паузе или показывается реклама
        if (state.isGamePaused || state.isAdPlaying) {
          // Обновляем lastTickTime чтобы не было скачка после паузы
          const now = Date.now();
          set((s) => {
            const newCooldowns = { ...s.cooldowns };
            Object.keys(newCooldowns).forEach((key) => {
              if (newCooldowns[key]) {
                newCooldowns[key] = {
                  ...newCooldowns[key],
                  lastTickTime: now,
                };
              }
            });

            const newBuffs = { ...s.activeBuffs };
            if (newBuffs.damage?.timer) {
              newBuffs.damage = {
                ...newBuffs.damage,
                timer: {
                  ...newBuffs.damage.timer,
                  lastTickTime: now,
                },
              };
            }
            if (newBuffs.drop?.timer) {
              newBuffs.drop = {
                ...newBuffs.drop,
                timer: {
                  ...newBuffs.drop.timer,
                  lastTickTime: now,
                },
              };
            }

            return { cooldowns: newCooldowns, activeBuffs: newBuffs };
          });
          return;
        }

        const now = Date.now();

        // Обновляем кулдауны
        set((s) => {
          const newCooldowns = { ...s.cooldowns };
          Object.keys(newCooldowns).forEach((key) => {
            const timer = newCooldowns[key];
            if (timer && timer.isRunning && timer.remainingSeconds > 0) {
              const elapsed = (now - timer.lastTickTime) / 1000;
              timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
              timer.lastTickTime = now;
            }
          });
          return { cooldowns: newCooldowns };
        });

        // Обновляем баффы
        set((s) => {
          const newBuffs = { ...s.activeBuffs };

          if (newBuffs.damage?.timer) {
            const timer = newBuffs.damage.timer;
            if (timer.isRunning && timer.remainingSeconds > 0) {
              const elapsed = (now - timer.lastTickTime) / 1000;
              timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
              timer.lastTickTime = now;
            }
          }

          if (newBuffs.drop?.timer) {
            const timer = newBuffs.drop.timer;
            if (timer.isRunning && timer.remainingSeconds > 0) {
              const elapsed = (now - timer.lastTickTime) / 1000;
              timer.remainingSeconds = Math.max(0, timer.remainingSeconds - elapsed);
              timer.lastTickTime = now;
            }
          }

          return { activeBuffs: newBuffs };
        });

        get().checkBuffsExpiration();
      },
    }),
    {
      name: STORAGE_KEYS.ADS_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const cooldownsToSave: AdCooldownState = {};
        Object.entries(state.cooldowns).forEach(([key, timer]) => {
          if (timer && timer.remainingSeconds > 0) {
            cooldownsToSave[key] = timer.remainingSeconds;
          }
        });

        const activeBuffsToSave: any = {};
        if (state.activeBuffs.damage) {
          activeBuffsToSave.damage = {
            type: state.activeBuffs.damage.type,
            multiplier: state.activeBuffs.damage.multiplier,
            remainingSeconds: state.activeBuffs.damage.timer?.remainingSeconds || 0,
          };
        }
        if (state.activeBuffs.drop) {
          activeBuffsToSave.drop = {
            type: state.activeBuffs.drop.type,
            multiplier: state.activeBuffs.drop.multiplier,
            remainingSeconds: state.activeBuffs.drop.timer?.remainingSeconds || 0,
          };
        }

        return {
          cooldowns: cooldownsToSave,
          activeBuffs: activeBuffsToSave,
        };
      },
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState;
        }

        const saved = persistedState as Record<string, unknown>;

        const restoredCooldowns: Record<string, TimerState> = {};
        const savedCooldowns = saved.cooldowns as Record<string, number> | undefined;
        if (savedCooldowns) {
          Object.entries(savedCooldowns).forEach(([key, remainingSeconds]) => {
            if (typeof remainingSeconds === "number" && remainingSeconds > 0) {
              restoredCooldowns[key] = {
                totalSeconds: remainingSeconds,
                remainingSeconds,
                isRunning: true,
                lastTickTime: Date.now(),
              };
            }
          });
        }

        const restoredBuffs: any = {};
        const savedBuffs = saved.activeBuffs as Record<string, any> | undefined;
        if (savedBuffs) {
          if (savedBuffs.damage && savedBuffs.damage.remainingSeconds > 0) {
            restoredBuffs.damage = {
              type: "damage",
              multiplier: savedBuffs.damage.multiplier,
              timer: {
                totalSeconds: savedBuffs.damage.remainingSeconds,
                remainingSeconds: savedBuffs.damage.remainingSeconds,
                isRunning: true,
                lastTickTime: Date.now(),
              },
            };
          }
          if (savedBuffs.drop && savedBuffs.drop.remainingSeconds > 0) {
            restoredBuffs.drop = {
              type: "drop",
              multiplier: savedBuffs.drop.multiplier,
              timer: {
                totalSeconds: savedBuffs.drop.remainingSeconds,
                remainingSeconds: savedBuffs.drop.remainingSeconds,
                isRunning: true,
                lastTickTime: Date.now(),
              },
            };
          }
        }

        return {
          ...currentState,
          cooldowns: restoredCooldowns,
          activeBuffs: restoredBuffs,
        };
      },
    },
  ),
);
