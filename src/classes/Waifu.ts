import type { locales } from "../locales/locales";
import type { TElementType, TRarity } from "../types";

export interface WaifuConfig {
  id: string;
  name: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: keyof typeof locales.ru;
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
  name: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: keyof typeof locales.ru;

  // Базовые статы (неизменные)
  baseClickPower: number;
  baseAutoClick: number;
  baseCritChance: number;
  baseCritMultiplier: number;

  // Текущие статы (с учетом уровня и дубликатов)
  stats: WaifuStats;

  // Счетчик дубликатов (0-20)
  duplicateCount: number;
  maxDuplicates: number = 20;

  // Аутфиты
  unlockedOutfits: string[];
  currentOutfit: string;

  constructor(config: WaifuConfig) {
    this.id = config.id;
    this.name = config.name;
    this.rarity = config.rarity;
    this.element = config.element;
    this.image = config.image;
    this.description = config.description;

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

  getDuplicateMultiplier(): number {
    return 1 + this.duplicateCount * 0.3;
  }

  getClickPower(): number {
    const levelMultiplier = 1 + (this.stats.level - 1) * 0.1;
    const affectionBonus = 1 + this.stats.affection * 0.01;
    const dupMultiplier = this.getDuplicateMultiplier();
    return Math.floor(this.baseClickPower * levelMultiplier * affectionBonus * dupMultiplier);
  }

  getAutoClick(): number {
    const levelMultiplier = 1 + (this.stats.level - 1) * 0.1;
    const dupMultiplier = this.getDuplicateMultiplier();
    return Math.floor(this.baseAutoClick * levelMultiplier * dupMultiplier);
  }

  getCritChance(): number {
    const affectionBonus = this.stats.affection * 0.001;
    const dupBonus = this.duplicateCount * 0.01; // +1% за каждый дубликат
    return Math.min(1, this.baseCritChance + affectionBonus + dupBonus);
  }

  getCritMultiplier(): number {
    const dupBonus = this.duplicateCount * 0.05; // +0.05x за каждый дубликат
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
      name: "Sakura",
      rarity: "common",
      element: "physical",
      image: "/assets/images/waifus/default.png",
      description: "common_trainee_desc",
      baseStats: {
        clickPower: 100,
        autoClick: 50,
        critChance: 0.05,
        critMultiplier: 2,
      },
    });
  }

  static fromTemplate(template: (typeof import("../game/constant").testWaifus)[0]): Waifu {
    return new Waifu({
      id: template.id,
      name: template.name,
      rarity: template.rarity,
      element: template.element,
      image: "/assets/images/waifus/default.png",
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
