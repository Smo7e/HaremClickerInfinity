// src/game/adConstants.ts
import type { AdRewardConfig, AdRewardType } from "../types/ads";

export const AD_REWARDS: Record<string, AdRewardConfig> = {
  essence_100: {
    id: "essence_100",
    titleKey: "ads.reward.essence100.title",
    descriptionKey: "ads.reward.essence100.desc",
    icon: "essence",
    cooldownSeconds: 60, // 1 минута
  },
  gems_10000: {
    id: "gems_10000",
    titleKey: "ads.reward.gems10000.title",
    descriptionKey: "ads.reward.gems10000.desc",
    icon: "gem",
    cooldownSeconds: 60, // 1 минута
  },
  damage_2x: {
    id: "damage_2x",
    titleKey: "ads.reward.damage2x.title",
    descriptionKey: "ads.reward.damage2x.desc",
    icon: "crit", // или создайте иконку "buff_damage"
    cooldownSeconds: 360, // 6 минут
    durationSeconds: 300, // 5 минут действия
  },
  drop_2x: {
    id: "drop_2x",
    titleKey: "ads.reward.drop2x.title",
    descriptionKey: "ads.reward.drop2x.desc",
    icon: "collection", // или "buff_drop"
    cooldownSeconds: 360, // 6 минут
    durationSeconds: 300, // 5 минут действия
  },
  scroll_forest_40: {
    id: "scroll_forest_40",
    titleKey: "ads.reward.scrollForest.title",
    descriptionKey: "ads.reward.scrollForest.desc",
    icon: "scroll_forest_down",
    cooldownSeconds: 60, // 1 минута
  },
  scroll_abyss_bundle: {
    id: "scroll_abyss_bundle",
    titleKey: "ads.reward.abyssBundle.title",
    descriptionKey: "ads.reward.abyssBundle.desc",
    icon: "scroll_abyss_down",
    cooldownSeconds: 400,
  },
};

export const AD_REWARD_LIST: AdRewardType[] = [
  "essence_100",
  "gems_10000",
  "damage_2x",
  "drop_2x",
  "scroll_forest_40",
  "scroll_abyss_bundle",
];
