import type { TElementType } from "../types";

export type TEnemyRewards = { gems: number; essence?: number; exp: number };

export interface DamageInfo {
  type: TElementType;
  amount: number;
  isCrit?: boolean;
  source: string; // от кого (waifu id или player)
}

export interface EnemyConfig {
  id: string;
  name: string;
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
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  resistances: Record<TElementType, number>;
  sprite: string;
  isBoss: boolean;
  rewards: TEnemyRewards;

  constructor(config: EnemyConfig) {
    this.id = config.id;
    this.name = config.name;
    this.level = config.level;
    this.maxHp = config.maxHp;
    this.currentHp = config.maxHp;
    this.sprite = config.sprite;
    this.isBoss = config.isBoss || false;
    this.rewards = { ...config.rewards, exp: this.level * 10 * (this.isBoss ? 2 : 1) };

    // Заполняем резисты (по умолчанию 0)
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
    if (res < 0) return "weak"; // Уязвимость
    if (res > 0.3) return "resist"; // Сильный резист
    return "normal"; // Нейтрально
  }

  static spawn(level: number): Enemy {
    const isBoss = level % 10 === 0;
    const baseHp = 100 * Math.pow(1.15, level - 1);
    const maxHp = isBoss ? baseHp * 5 : baseHp;

    const elements: TElementType[] = ["water", "fire", "earth", "ice", "light", "dark", "physical"];
    const resistances: Partial<Record<TElementType, number>> = {};

    // У обычных врагов 1-2 резиста, у боссов 2-3
    const resistCount = isBoss ? 3 : 1;
    const shuffled = [...elements].sort(() => Math.random() - 0.5);

    for (let i = 0; i < resistCount; i++) {
      // Резист от 0.25 до 0.75
      resistances[shuffled[i]] = 0.25 + Math.random() * 0.5;
    }

    // Уязвимости (отрицательные резисты)
    const weakCount = isBoss ? 2 : 1;
    for (let i = resistCount; i < resistCount + weakCount; i++) {
      resistances[shuffled[i]] = -0.5; // 50% уязвимость
    }
    const normalSprites = ["/assets/images/enemies/default.png"];
    const bossSprites = ["/assets/images/enemies/default.png"];

    const sprite = isBoss
      ? bossSprites[Math.floor(Math.random() * bossSprites.length)]
      : normalSprites[Math.floor(Math.random() * normalSprites.length)];

    return new Enemy({
      id: `enemy_${level}_${Date.now()}`,
      name: isBoss ? `Boss ${level}` : `Enemy ${level}`,
      level,
      maxHp,
      resistances,
      sprite,
      isBoss,
      rewards: {
        gems: isBoss ? 50 : 10 + Math.floor(level / 5),
        essence: isBoss ? 5 : 1,
      },
    });
  }
}
