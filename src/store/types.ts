import type { Inventory } from "../classes/Inventory";
import type { Waifu } from "../classes/Waifu";
import type { Enemy } from "../classes/Enemy";
import type { TLocation, TLocationProgress, IGlobalUpgrades, TElementType } from "../types";

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
  };
}

export interface GameActions {
  addItem: (itemId: string, count: number) => void;
  removeItem: (itemId: string, count: number) => boolean;
  useItem: (itemId: string, waifuId?: string) => UseItemResult;
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

export interface PersistedGameState {
  inventory: string;
  ownedWaifus: SerializedWaifu[];
  activeWaifuId: string | null;
  currentLocation: TLocation;
  locationProgress: TLocationProgress;
  globalUpgrades: IGlobalUpgrades;
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
