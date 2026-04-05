import type { LocaleKeys } from "../locales/locales";

export type TRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type TElementType = "water" | "fire" | "earth" | "ice" | "light" | "dark" | "physical";
export type TLocation = "forest" | "castle" | "desert" | "volcano" | "ice" | "abyss";

export type TItemType = "collection" | "consumable" | "material" | "currency";

export interface ILocationConfig {
  id: TLocation;
  nameKey: string;
  availableEnemies: string[];
  minLevel: number;
  maxLevel: number;
  levelScaling: number;
  bonuses: {
    gemMultiplier: number;
    essenceMultiplier: number;
    expMultiplier: number;
    dropChanceMultiplier: number;
  };
}

export type TWaifu = {
  id: string;
  nameKey: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: LocaleKeys;
  clickPower: number;
  critChance: number;
  critMultiplier: number;
};
export type TCollectionCategory = "weapon" | "accessory" | "memoria" | "outfit";
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
    type:
      | "exp"
      | "affection"
      | "crit_chance"
      | "heal"
      | "damage_boost"
      | "level_down_10"
      | "level_down_20"
      | "level_down_50";
    value: number;
    target: "selected_waifu" | "global" | "current_location";
    duration?: number;
  };
  collectionCategory?: TCollectionCategory;
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

export type TLocationProgress = Record<
  TLocation,
  {
    currentLevel: number;
    maxLevelReached: number;
    unlocked: boolean;
  }
>;
export interface IGlobalUpgrades {
  clickPowerBonus: number;
  elementDamage: Record<TElementType, number>;
  collectionBuffs: {
    elementDamage: Record<TElementType, number>;
    enemyTypeDamage: Record<string, number>;
    critPowerBonus: number;
    gemBonus: number;
    expBonus: number;
  };
}
export type TCraftItem = {
  id: string;
  nameKey: string;
  descriptionKey: LocaleKeys;
  icon: string;
  rarity: TRarity;
  ingredients: Array<{
    itemId: string;
    count: number;
  }>;
  effect?: {
    type: "exp" | "affection" | "heal" | "level_down_10" | "level_down_20" | "level_down_50";
    value: number;
    target: "selected_waifu" | "global" | "current_location";
  };
};
