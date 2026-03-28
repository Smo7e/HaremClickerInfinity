// src/classes/Enemy.ts
import type { TElementType } from "../types";
import { t } from "../locales/i18n";
import { MONSTER_TEMPLATES } from "../game/constant";

export type TEnemyRewards = { gems: number; essence?: number; exp: number };

export interface DamageInfo {
  type: TElementType;
  amount: number;
  isCrit?: boolean;
  source: string;
}

export interface EnemyConfig {
  id: string;
  nameKey: string;
  level: number;
  maxHp: number;
  resistances: Partial<Record<TElementType, number>>;
  sprite: string;
  isBoss?: boolean;
  rewards: {
    gems: number;
    essence?: number;
  };
}

export class Enemy {
  id: string;
  nameKey: string;
  level: number;
  maxHp: number;
  currentHp: number;
  resistances: Record<TElementType, number>;
  sprite: string;
  isBoss: boolean;
  rewards: TEnemyRewards;

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.nameKey = config.nameKey;
    this.level = config.level;
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.sprite = config.sprite;
    this.isBoss = config.isBoss || false;
    this.rewards = {
      ...config.rewards,
      exp: this.level * 10 * (this.isBoss ? 2 : 1),
    };

    this.resistances = {
      water: 0,
      fire: 0,
      earth: 0,
      ice: 0,
      light: 0,
      dark: 0,
      physical: 0,
      ...config.resistances,
    };
  }

  get name(): string {
    return t(`monsters.${this.nameKey}.name`);
  }

  get description(): string {
    return t(`monsters.${this.nameKey}.desc`);
  }

  takeDamage(damage: DamageInfo): number {
    const resistance = this.resistances[damage.type] || 0;

    let actualDamage = damage.amount * (1 - resistance);

    if (damage.isCrit) {
      actualDamage *= 2;
    }

    actualDamage = Math.floor(actualDamage);

    this.currentHp = Math.max(0, this.currentHp - actualDamage);

    return actualDamage;
  }

  isAlive(): boolean {
    return this.currentHp > 0;
  }

  getHpPercent(): number {
    return (this.currentHp / this.maxHp) * 100;
  }

  getElementEffectiveness(element: TElementType): "weak" | "normal" | "resist" {
    const res = this.resistances[element];
    if (res < 0) return "weak";
    if (res > 0.3) return "resist";
    return "normal";
  }

  static spawn(level: number): Enemy {
    const isBoss = level % 10 === 0;

    const templates = MONSTER_TEMPLATES.filter((m) => m.isBoss === isBoss);
    const template = templates[Math.floor(Math.random() * templates.length)] || MONSTER_TEMPLATES[0];

    const baseHp = template.baseHp * Math.pow(template.hpMultiplier, level - 1);
    const maxHp = isBoss ? baseHp * 5 : baseHp;

    const elements: TElementType[] = ["water", "fire", "earth", "ice", "light", "dark", "physical"];
    const resistances: Partial<Record<TElementType, number>> = { ...template.resistances };

    const resistCount = isBoss ? 3 : 1;
    const shuffled = [...elements].sort(() => Math.random() - 0.5);

    for (let i = 0; i < resistCount; i++) {
      if (resistances[shuffled[i]] === undefined) {
        resistances[shuffled[i]] = 0.25 + Math.random() * 0.5;
      }
    }

    const weakCount = isBoss ? 2 : 1;
    for (let i = 0; i < weakCount; i++) {
      if (resistances[shuffled[i]] === undefined) {
        resistances[shuffled[i]] = -0.5;
      }
    }

    return new Enemy({
      id: `${template.id}_${level}_${Date.now()}`,
      nameKey: template.nameKey,
      level,
      maxHp,
      resistances,
      sprite: template.sprite,
      isBoss,
      rewards: {
        gems: isBoss ? 50 : 10 + Math.floor(level / 5),
        essence: isBoss ? 5 : 1,
      },
    });
  }
}
