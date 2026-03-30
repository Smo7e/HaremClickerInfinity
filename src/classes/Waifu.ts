import type { TElementType, TRarity, TWaifu } from "../types";
import { t } from "../locales/i18n";
import type { LocaleKeys } from "../locales/locales";
import type { IGlobalUpgrades } from "../components/Game/Game";

export interface WaifuConfig {
  id: string;
  nameKey: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: LocaleKeys;
  baseStats: {
    clickPower: number;
    autoClick: number;
    critChance: number;
    critMultiplier: number;
  };
}

export interface WaifuStats {
  level: number;
  affection: number;
  exp: number;
  expToNext: number;
  clicksGenerated: number;
  totalDamage: number;
}
export class Waifu {
  id: string;
  nameKey: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  descriptionKey: LocaleKeys;

  baseClickPower: number;
  baseAutoClick: number;
  baseCritChance: number;
  baseCritMultiplier: number;

  stats: WaifuStats;

  duplicateCount: number;
  maxDuplicates: number = 20;

  unlockedOutfits: string[];
  currentOutfit: string;

  globalUpgrades: IGlobalUpgrades = {
    clickPowerBonus: 0,
    elementDamage: {
      water: 0,
      fire: 0,
      earth: 0,
      ice: 0,
      light: 0,
      dark: 0,
      physical: 0,
    },
  };

  constructor(config: WaifuConfig) {
    this.id = config.id;
    this.nameKey = config.nameKey;
    this.rarity = config.rarity;
    this.element = config.element;
    this.image = config.image;
    this.descriptionKey = config.description;

    this.baseClickPower = config.baseStats.clickPower;
    this.baseAutoClick = config.baseStats.autoClick;
    this.baseCritChance = config.baseStats.critChance;
    this.baseCritMultiplier = config.baseStats.critMultiplier;

    this.stats = {
      level: 1,
      affection: 0,
      exp: 0,
      expToNext: 100,
      clicksGenerated: 0,
      totalDamage: 0,
    };

    this.duplicateCount = 0;
    this.unlockedOutfits = ["default"];
    this.currentOutfit = "default";
  }

  setGlobalUpgrades(upgrades: IGlobalUpgrades): void {
    this.globalUpgrades = upgrades;
  }

  get name(): string {
    return t(`waifus.${this.nameKey}.name`);
  }

  get description(): string {
    return t(`waifus.${this.nameKey}.desc`);
  }

  getDuplicateMultiplier(): number {
    return 1 + this.duplicateCount * 0.3;
  }

  getClickPower(): number {
    const baseWithBonus = this.baseClickPower + this.globalUpgrades.clickPowerBonus * 100;

    const totalPercentBonus =
      (this.stats.level - 1) * 10 +
      this.stats.affection * 1 +
      this.duplicateCount * 30 +
      (this.globalUpgrades.elementDamage[this.element] || 0) * 10;

    const totalMultiplier = 1 + totalPercentBonus / 100;

    return Math.floor(baseWithBonus * totalMultiplier);
  }

  getCritChance(): number {
    return this.baseCritChance;
  }

  getCritMultiplier(): number {
    const dupBonus = this.duplicateCount * 0.05;
    return this.baseCritMultiplier + dupBonus;
  }

  addExp(amount: number): boolean {
    this.stats.exp += amount;

    if (this.stats.exp >= this.stats.expToNext) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp(): void {
    this.stats.level++;
    this.stats.exp -= this.stats.expToNext;
    this.stats.expToNext = Math.floor(this.stats.expToNext * 1.2);
  }

  addAffection(amount: number): void {
    this.stats.affection += amount;
  }

  recordClick(damage: number): void {
    this.stats.clicksGenerated++;
    this.stats.totalDamage += damage;
  }

  addDuplicate(): boolean {
    if (this.duplicateCount < this.maxDuplicates) {
      this.duplicateCount++;
      return true;
    }
    return false;
  }

  isMaxed(): boolean {
    return this.duplicateCount >= this.maxDuplicates;
  }

  changeOutfit(outfitId: string): boolean {
    if (this.unlockedOutfits.includes(outfitId)) {
      this.currentOutfit = outfitId;
      return true;
    }
    return false;
  }

  unlockOutfit(outfitId: string): void {
    if (!this.unlockedOutfits.includes(outfitId)) {
      this.unlockedOutfits.push(outfitId);
    }
  }

  getElementMultiplier(enemyResistances: Record<TElementType, number>): number {
    const resist = enemyResistances[this.element] || 0;
    return 1 - resist;
  }

  static createDefault(): Waifu {
    return new Waifu({
      id: "wf_sakura_001",
      nameKey: "Sakura",
      rarity: "common",
      element: "physical",
      image: "/assets/images/waifus/Sakura.png",
      description: "waifus.Sakura.desc",
      baseStats: {
        clickPower: 100,
        autoClick: 50,
        critChance: 0.05,
        critMultiplier: 2,
      },
    });
  }

  static fromTemplate(template: TWaifu): Waifu {
    return new Waifu({
      id: template.id,
      nameKey: template.nameKey,
      rarity: template.rarity,
      element: template.element,
      image: template.image,
      description: template.description,
      baseStats: {
        clickPower: template.clickPower,
        autoClick: template.autoClick,
        critChance: 0.05,
        critMultiplier: 2,
      },
    });
  }
}
