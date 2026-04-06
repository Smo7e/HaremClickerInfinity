import type { Waifu } from "../classes/Waifu";
import type { Enemy } from "../classes/Enemy";
import type { IGlobalUpgrades } from "../types";

export interface DamageCalculation {
  base: number;
  isCrit: boolean;
  effectiveness: "weak" | "normal" | "resist";
  elementMultiplier: number;
}

export interface RewardCalculation {
  exp: number;
  gems: number;
  essence: number;
  drops: Array<{ id: string; count: number }>;
}

export const BattleService = {
  calculateDamage(waifu: Waifu, enemy: Enemy, _globalUpgrades: IGlobalUpgrades): DamageCalculation {
    const clickPower = waifu.getClickPower();
    const critChance = waifu.getCritChance();
    const isCrit = Math.random() < critChance;

    const elementMultiplier = waifu.getElementMultiplier(enemy.resistances);
    let effectiveness: "weak" | "normal" | "resist" = "normal";

    if (elementMultiplier > 1.3) {
      effectiveness = "weak";
    } else if (elementMultiplier < 0.7) {
      effectiveness = "resist";
    }

    const base = Math.floor(clickPower * elementMultiplier);

    return {
      base,
      isCrit,
      effectiveness,
      elementMultiplier,
    };
  },

  calculateRewards(
    enemy: Enemy,
    locationBonus: {
      gemMultiplier: number;
      essenceMultiplier: number;
      expMultiplier: number;
      dropChanceMultiplier: number;
    },
    globalUpgrades: IGlobalUpgrades,
    currentLevel: number,
  ): RewardCalculation {
    const gemBonus = globalUpgrades.collectionBuffs.gemBonus;
    const expBonus = globalUpgrades.collectionBuffs.expBonus;

    const exp = Math.floor(enemy.expReward * locationBonus.expMultiplier * (1 + expBonus));

    const baseGems = Math.floor(10 + currentLevel / 5);
    const gems = Math.floor(baseGems * locationBonus.gemMultiplier * (1 + gemBonus));

    const baseEssence = 1;
    const essence = Math.floor(baseEssence * locationBonus.essenceMultiplier);

    const drops = enemy.rollDrops(locationBonus.dropChanceMultiplier);

    return { exp, gems, essence, drops };
  },

  shouldAutoAttack(isPaused: boolean, enemyAlive: boolean, waifuExists: boolean): boolean {
    return !isPaused && enemyAlive && waifuExists;
  },
};
