import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { BattleService } from "../services/BattleService";
import { audioManager } from "../audio/AudioManager";
import { LOCATIONS } from "../game/constant";

const AUTO_ATTACK_INTERVAL = 1000;

export function useBattle() {
  const enemy = useGameStore((state) => state.enemy);
  const ownedWaifus = useGameStore((state) => state.ownedWaifus);
  const activeWaifuId = useGameStore((state) => state.activeWaifuId);
  const globalUpgrades = useGameStore((state) => state.globalUpgrades);
  const isPaused = useGameStore((state) => state.isPaused);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const locationProgress = useGameStore((state) => state.locationProgress);
  const dealDamage = useGameStore((state) => state.dealDamage);

  const activeWaifu = ownedWaifus.find((w) => w.id === activeWaifuId);
  const lastAttackRef = useRef(0);
  const autoAttackIntervalRef = useRef<number | null>(null);

  const handleClick = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      onDamageDealt?: (damage: number, isCrit: boolean, x: number, y: number) => void,
    ) => {
      if (!enemy || !activeWaifu || isPaused) return;
      const now = Date.now();
      if (now - lastAttackRef.current < 100) return;
      lastAttackRef.current = now;
      audioManager.playClick();
      const calculation = BattleService.calculateDamage(activeWaifu, enemy, globalUpgrades);
      const actualDamage = dealDamage(calculation.base, calculation.isCrit);
      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? window.innerWidth / 2;
        clientY = e.touches[0]?.clientY ?? window.innerHeight / 2;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      if (onDamageDealt) {
        onDamageDealt(actualDamage, calculation.isCrit, clientX, clientY);
      }
      activeWaifu.recordClick(actualDamage);
    },
    [enemy, activeWaifu, isPaused, globalUpgrades, dealDamage],
  );

  // Автоклик
  useEffect(() => {
    // Очищаем предыдущий интервал
    if (autoAttackIntervalRef.current) {
      clearInterval(autoAttackIntervalRef.current);
      autoAttackIntervalRef.current = null;
    }

    if (isPaused || !enemy || !activeWaifu) {
      return;
    }

    autoAttackIntervalRef.current = window.setInterval(() => {
      if (!enemy.isAlive()) {
        // Если враг мёртв, очищаем интервал
        if (autoAttackIntervalRef.current) {
          clearInterval(autoAttackIntervalRef.current);
          autoAttackIntervalRef.current = null;
        }
        return;
      }
      const calculation = BattleService.calculateDamage(activeWaifu, enemy, globalUpgrades);
      dealDamage(calculation.base, calculation.isCrit);
      audioManager.playClick();
    }, AUTO_ATTACK_INTERVAL);

    return () => {
      if (autoAttackIntervalRef.current) {
        clearInterval(autoAttackIntervalRef.current);
        autoAttackIntervalRef.current = null;
      }
    };
  }, [isPaused, enemy?.id, activeWaifu?.id, globalUpgrades, dealDamage]);

  const currentLevel = locationProgress[currentLocation]?.currentLevel ?? 1;
  const locationConfig = LOCATIONS.find((l) => l.id === currentLocation);

  return {
    handleClick,
    enemy,
    activeWaifu,
    isPaused,
    currentLevel,
    locationConfig,
  };
}
