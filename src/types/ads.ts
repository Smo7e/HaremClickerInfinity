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
  titleKey: string; // ключ для i18n
  descriptionKey: string;
  icon: string;
  cooldownSeconds: number;
  durationSeconds?: number; // для временных баффов
}

export interface AdCooldownState {
  [key: string]: number; // timestamp когда будет доступно
}

export interface ActiveAdBuff {
  type: "damage" | "drop";
  multiplier: number;
  expiresAt: number;
}
