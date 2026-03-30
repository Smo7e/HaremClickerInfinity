import type { LocaleKeys } from "../locales/locales";

export type TRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type TElementType = "water" | "fire" | "earth" | "ice" | "light" | "dark" | "physical";

export type TItemType = "collection" | "consumable" | "material" | "currency";

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

export type TInventoryItem = {
  id: string;
  nameKey: string;
  descriptionKey: LocaleKeys;
  icon: string;
  rarity: TRarity;
  type: TItemType;
  count: number;
  maxStack?: number;
  effect?: {
    type: "exp" | "affection" | "crit_chance" | "heal" | "damage_boost";
    value: number;
    target: "selected_waifu" | "global";
    duration?: number;
  };
};

export type TDropItem = {
  id: string;
  nameKey: string;
  chance: number;
  minCount: number;
  maxCount: number;
  type: TItemType;
};

export interface IInventory {
  items: TInventoryItem[];
  collection: string[];
}

export type TConsumableItem = {
  id: string;
  nameKey: string;
  descriptionKey: LocaleKeys;
  icon: string;
  effect: {
    type: string;
    value: number;
    target: string;
    duration?: number;
  };
  rarity: TRarity;
};
