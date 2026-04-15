import type { Inventory } from "../classes/Inventory";
import type { Waifu } from "../classes/Waifu";
import type { Enemy } from "../classes/Enemy";
import type {
  TLocation,
  TLocationProgress,
  IGlobalUpgrades,
  TElementType,
  TBestiaryProgress,
  TDropItem,
  TInventoryItemId,
} from "../types";

export interface GameState {
  inventory: Inventory;
  ownedWaifus: Waifu[];
  activeWaifuId: string | null;
  enemy: Enemy | null;
  currentLocation: TLocation;
  locationProgress: TLocationProgress;
  isPaused: boolean;
  globalUpgrades: IGlobalUpgrades;
  panels: {
    gacha: boolean;
    collection: boolean;
    waifuSelect: boolean;
    upgrades: boolean;
    backpack: boolean;
    craft: boolean;
    pause: boolean;
    settings: boolean;
    locationSelector: boolean;
    waifuDetail: string | null;
    bestiary: boolean;
    ads: boolean;
  };
  bestiary: TBestiaryProgress;
  lastDrops: Array<{ id: string; count: number }> | null;
}

export interface GameActions {
  addItem: (itemId: TInventoryItemId, count: number) => void;
  removeItem: (itemId: TInventoryItemId, count: number) => boolean;
  useItem: (itemId: TInventoryItemId, waifuId?: string) => UseItemResult;
  refreshInventory: () => void;
  addWaifu: (waifu: Waifu) => void;
  setActiveWaifu: (waifuId: string) => void;
  removeWaifu: (waifuId: string) => void;
  refreshWaifus: () => void;
  spawnEnemy: () => void;
  dealDamage: (damage: number, isCrit: boolean) => number;
  defeatEnemy: () => void;
  changeLocation: (location: TLocation) => void;
  setPaused: (paused: boolean) => void;
  checkLocationUnlocks: () => void;
  openPanel: (panel: keyof GameState["panels"]) => void;
  closePanel: (panel: keyof GameState["panels"]) => void;
  togglePanel: (panel: keyof GameState["panels"]) => void;
  upgradeClickPower: () => boolean;
  upgradeElement: (element: TElementType) => boolean;
  resetGame: () => void;
  loadGame: (savedState: Partial<GameState>) => void;
  recordEnemyKill: (enemyNameKey: string) => void;
  getBestiaryEntry: (enemyId: string) => { killCount: number; unlocked: boolean } | undefined;
  applyCollectionBuff: (itemId: TInventoryItemId) => void;
  recalculateCollectionBuffs: () => void;
}

export interface UseItemResult {
  success: boolean;
  effect?: {
    type: string;
    value: number;
    target: string;
  };
  message?: string;
}

export interface SerializedWaifu {
  id: string;
  stats: {
    level: number;
    affection: number;
    exp: number;
    expToNext: number;
    clicksGenerated: number;
    totalDamage: number;
  };
  duplicateCount: number;
  unlockedOutfits: string[];
  currentOutfit: string;
}

export interface SerializedEnemy {
  id: string;
  nameKey: string;
  level: number;
  maxHp: number;
  currentHp: number;
  sprite: string;
  isBoss: boolean;
  resistances: Record<TElementType, number>;
  drops: TDropItem[];
}

export interface PersistedGameState {
  inventory: string;
  ownedWaifus: SerializedWaifu[];
  activeWaifuId: string | null;
  currentLocation: TLocation;
  locationProgress: TLocationProgress;
  globalUpgrades: IGlobalUpgrades;
  bestiary: TBestiaryProgress;
  enemy: SerializedEnemy | null;
}
