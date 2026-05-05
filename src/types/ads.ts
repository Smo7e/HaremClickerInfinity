// src/types/ads.ts
export type AdRewardType =
  | "essence_100"
  | "gems_10000"
  | "damage_2x"
  | "drop_2x"
  | "scroll_forest_40"
  | "scroll_abyss_bundle";

export interface AdRewardConfig {
  id: AdRewardType;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  cooldownSeconds: number;
  durationSeconds?: number;
}

// Упрощённое состояние для сохранения (только оставшиеся секунды)
export interface AdCooldownState {
  [key: string]: number;
}

export interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastTickTime: number;
}

export interface ActiveAdBuff {
  type: "damage" | "drop";
  multiplier: number;
  timer: TimerState;
}
