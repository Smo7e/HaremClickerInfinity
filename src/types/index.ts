import type { LocaleKeys } from "../locales/locales";

export type TRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type TElementType = "water" | "fire" | "earth" | "ice" | "light" | "dark" | "physical";
export type TLocation = "forest" | "castle" | "desert" | "volcano" | "ice" | "abyss";

export type TItemType = "collection" | "consumable" | "material" | "currency";

export interface ILocationConfig {
  id: TLocation;
  nameKey: string;
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
export type TInventoryItemId =
  | "gem"
  | "essence"
  | "coin"
  | "gel"
  | "slime_core"
  | "goblin_dagger"
  | "goblin_ear"
  | "bone"
  | "skull"
  | "ectoplasm"
  | "soul_shard"
  | "magic_scroll"
  | "dark_orb"
  | "mage_staff"
  | "demon_horn"
  | "hellfire_essence"
  | "demon_wing"
  | "ancient_coin"
  | "forest_essence"
  | "spider_venom"
  | "sand_stone"
  | "ice_crystal"
  | "frost_fang"
  | "lava_chunk"
  | "imp_ash"
  | "cursed_cloth"
  | "void_essence"
  | "affection_potion_forest"
  | "exp_scroll_forest"
  | "level_down_scroll_forest"
  | "affection_potion_desert"
  | "exp_scroll_desert"
  | "level_down_scroll_desert"
  | "affection_potion_ice"
  | "exp_scroll_ice"
  | "level_down_scroll_ice"
  | "affection_potion_volcano"
  | "exp_scroll_volcano"
  | "level_down_scroll_volcano"
  | "affection_potion_castle"
  | "exp_scroll_castle"
  | "level_down_scroll_castle"
  | "affection_potion_abyss"
  | "exp_scroll_abyss"
  | "level_down_scroll_abyss";
export type TInventoryItem = {
  id: TInventoryItemId;
  nameKey: string;
  descriptionKey: LocaleKeys;
  icon: string;
  rarity: TRarity;
  type: TItemType;
  count: number;
  maxStack?: number;
  canCraft?: boolean;
  ingredients?: Array<{
    itemId: TInventoryItemId;
    count: number;
  }>;
  effect?: {
    type: "exp" | "affection" | "level_down";
    value: number;
    target: "selected_waifu" | "global" | "current_location";
  };
  collectionCategory?: TCollectionCategory;
};

export type TDropItem = {
  id: TInventoryItemId;
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
  id: TInventoryItemId;
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

export type TBestiaryEntry = {
  enemyId: string;
  killCount: number;
  unlocked: boolean;
  firstSeenAt: number | null;
};

export type TBestiaryProgress = Record<string, TBestiaryEntry>;
