import type { TDropItem, TElementType, TLocation } from "../types";
import { t } from "../locales/i18n";
import { LOCATION_BOSSES, LOCATION_ENEMIES, LOCATIONS, MONSTER_TEMPLATES } from "../game/constant";

export type TEnemyRewards = { gems: number; essence?: number; exp: number };

export interface DamageInfo {
  type: TElementType;
  amount: number;
  isCrit?: boolean;
  critMultiplier: number;
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
  drops: TDropItem[];
}
const MAX_SAFE_HP = 9e15;
export class Enemy {
  id: string;
  nameKey: string;
  level: number;
  maxHp: number;
  currentHp: number;
  resistances: Record<TElementType, number>;
  sprite: string;
  isBoss: boolean;
  expReward: number;
  drops: TDropItem[];

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.nameKey = config.nameKey;
    this.level = config.level;
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.sprite = config.sprite;
    this.isBoss = config.isBoss || false;
    this.expReward = this.level * 10 * (this.isBoss ? 2 : 1);
    this.drops = config.drops;

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

  takeDamage(damage: DamageInfo, enemyTypeDamageBonus: number = 0): number {
    const resistance = this.resistances[damage.type] || 0;

    let actualDamage = damage.amount * (1 - resistance) * (1 + enemyTypeDamageBonus);

    if (damage.isCrit) {
      actualDamage *= damage.critMultiplier || 2;
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

  rollDrops(bonusMultiplier: number = 1): Array<{ id: string; count: number }> {
    const results: Array<{ id: string; count: number }> = [];

    for (const drop of this.drops) {
      const roll = Math.random();
      const adjustedChance = Math.min(1, drop.chance * bonusMultiplier);
      if (roll <= adjustedChance) {
        const count = Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1)) + drop.minCount;
        results.push({ id: drop.id, count });
      }
    }

    return results;
  }

  static spawn(level: number, locationId: TLocation): Enemy {
    const isBoss = level % 10 === 0;
    const locationEnemyIds = isBoss ? LOCATION_BOSSES[locationId] : LOCATION_ENEMIES[locationId];
    const availableTemplates = MONSTER_TEMPLATES.filter((m) => locationEnemyIds.includes(m.id) && m.isBoss === isBoss);

    let template;
    if (availableTemplates.length > 0) {
      template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]!;
    } else {
      const fallbackTemplates = MONSTER_TEMPLATES.filter((m) => m.isBoss === isBoss);
      template =
        fallbackTemplates.length > 0
          ? fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)]!
          : MONSTER_TEMPLATES[0]!;
    }

    const locationConfig = LOCATIONS.find((l) => l.id === locationId);
    const locationScaling = locationConfig?.levelScaling ?? 1;

    const baseHp = Math.min(
      MAX_SAFE_HP,
      Math.max(50, template.baseHp * Math.pow(1.15, Math.min(level - 1, 200)) * Math.pow(locationScaling, 2)),
    );
    const maxHp = Math.floor(isBoss ? baseHp * 2 : baseHp);

    const resistances: Partial<Record<TElementType, number>> = {};

    for (const [element, value] of Object.entries(template.resistances)) {
      if (value > 0) {
        resistances[element as TElementType] = Math.random() * value;
      } else if (value < 0) {
        resistances[element as TElementType] = -(Math.random() * Math.abs(value));
      }
    }

    const elements: TElementType[] = ["water", "fire", "earth", "ice", "light", "dark", "physical"];
    const shuffled = [...elements].sort(() => Math.random() - 0.5);

    const resistCount = isBoss ? 3 : 1;
    for (let i = 0; i < resistCount; i++) {
      const element = shuffled[i]!;
      if (resistances[element] === undefined) {
        resistances[element] = 0.25 + Math.random() * 0.5;
      }
    }

    const weakCount = isBoss ? 2 : 1;
    for (let i = 0; i < weakCount; i++) {
      const element = shuffled[shuffled.length - 1 - i]!;
      if (resistances[element] === undefined) {
        resistances[element] = -(0.3 + Math.random() * 0.3);
      }
    }

    const drops: TDropItem[] = [...template.drops];

    if (isBoss) {
      drops.push({ id: "gem", nameKey: "gem", chance: 1, minCount: 50, maxCount: 50, type: "currency" });
      drops.push({ id: "essence", nameKey: "essence", chance: 1, minCount: 1, maxCount: 5, type: "currency" });
      drops.push({ id: "coin", nameKey: "coin", chance: 1, minCount: 1, maxCount: 5, type: "currency" });
    } else {
      drops.push({
        id: "gem",
        nameKey: "gem",
        chance: 1,
        minCount: 10 + Math.floor(level / 4),
        maxCount: 10 + Math.floor(level / 4),
        type: "currency",
      });
      drops.push({ id: "essence", nameKey: "essence", chance: 0.1, minCount: 1, maxCount: 1, type: "currency" });
      drops.push({ id: "coin", nameKey: "coin", chance: 0.3, minCount: 1, maxCount: 1, type: "currency" });
    }

    return new Enemy({
      id: `${template.id}_${level}_${Date.now()}`,
      nameKey: template.nameKey,
      level,
      maxHp,
      resistances,
      sprite: template.sprite,
      isBoss,
      drops,
    });
  }

  static fromExisting(existing: Enemy, newHp: number): Enemy {
    const enemy = new Enemy({
      id: existing.id,
      nameKey: existing.nameKey,
      level: existing.level,
      maxHp: existing.maxHp,
      resistances: { ...existing.resistances },
      sprite: existing.sprite,
      isBoss: existing.isBoss,
      drops: [...existing.drops],
    });
    enemy.currentHp = newHp;
    return enemy;
  }
}
