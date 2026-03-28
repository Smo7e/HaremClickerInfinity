import type { LocaleKeys } from "../locales/locales";

export type TRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type TElementType = "water" | "fire" | "earth" | "ice" | "light" | "dark" | "physical";

export type TWaifu = {
  id: string;
  nameKey: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: LocaleKeys;
  clickPower: number;
  autoClick: number;
  multiplier: number;
};

export type TItemType = "currency" | "collection" | "consumable" | "material";

export type TDropItem = {
  id: string;
  nameKey: string;
  chance: number;
  minCount: number;
  maxCount: number;
  type: TItemType;
};

export type TConsumableItem = {
  id: string;
  nameKey: string;
  icon: string;
  effect: {
    type: string;
    value: number;
    target: string;
    duration?: number;
  };
  rarity: TRarity;
};
