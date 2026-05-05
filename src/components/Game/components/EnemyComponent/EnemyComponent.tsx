import { useState, useRef, useEffect, useCallback } from "react";

import type { Waifu } from "../../../../classes/Waifu";
import type { Enemy } from "../../../../classes/Enemy";
import "./EnemyComponent.css";
import { ELEMENT_COLORS, INVENTORY_ITEMS } from "../../../../game/constant";
import type { TElementType, TInventoryItemId } from "../../../../types";
import { audioManager } from "../../../../audio/AudioManager";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import { BattleService } from "../../../../services/BattleService";
import { useGameStore } from "../../../../store/gameStore";
import { useAdStore } from "../../../../store/adStore";

interface DropEffect {
  id: number;
  x: number;
  y: number;
  itemId: string;
  count: number;
}

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  element: TElementType;
  effectiveness: "weak" | "normal" | "resist";
}

interface EnemyComponentProps {
  enemy: Enemy;
  activeWaifu: Waifu | null;
  isPaused: boolean;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

const clickIdRef = { current: 0 };
let dropIdCounter = 0;
const AUTO_ATTACK_INTERVAL = 1000;

export function EnemyComponent({ enemy, activeWaifu, isPaused, onClick }: EnemyComponentProps) {
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const [dropEffects, setDropEffects] = useState<DropEffect[]>([]);
  const [hpPercent, setHpPercent] = useState(() => enemy.getHpPercent());
  const [currentHp, setCurrentHp] = useState(() => enemy.currentHp);

  const enemyRef = useRef(enemy);
  const autoAttackIntervalRef = useRef<number | null>(null);
  const enemyContainerRef = useRef<HTMLDivElement>(null);
  const touchHandledRef = useRef(false);
  const defeatedEnemyKeyRef = useRef<string | null>(null);
  const dealDamage = useGameStore((state) => state.dealDamage);
  const lastDrops = useGameStore((state) => state.lastDrops);
  const defeatEnemy = useGameStore((state) => state.defeatEnemy);

  const getEnemyKey = (e: Enemy) => `${e.id}-${e.level}`;

  const handleEnemyDeath = useCallback(() => {
    const currentEnemy = enemyRef.current;
    if (!currentEnemy) return;

    const key = getEnemyKey(currentEnemy);
    if (defeatedEnemyKeyRef.current === key) {
      return;
    }

    defeatedEnemyKeyRef.current = key;
    audioManager.playEnemyDefeat();
  }, []);

  useEffect(() => {
    enemyRef.current = enemy;
    setHpPercent(enemy.getHpPercent());
    setCurrentHp(enemy.currentHp);

    const key = getEnemyKey(enemy);

    if (enemy.currentHp <= 0 && defeatedEnemyKeyRef.current !== key) {
      console.log("[EnemyComponent] Detected stuck dead enemy on load/render. Triggering defeat.");
      defeatedEnemyKeyRef.current = key;
      handleEnemyDeath();

      setTimeout(() => {
        defeatEnemy();
      }, 100);
    } else if (enemy.currentHp > 0) {
      defeatedEnemyKeyRef.current = null;
    }
  }, [enemy, defeatEnemy, handleEnemyDeath]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (enemyRef.current) {
        setHpPercent(enemyRef.current.getHpPercent());
        setCurrentHp(enemyRef.current.currentHp);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const addDropEffect = useCallback((itemId: string, count: number, x: number, y: number) => {
    const id = dropIdCounter++;
    setDropEffects((prev) => [...prev, { id, x, y, itemId, count }]);
    setTimeout(() => {
      setDropEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, 1200);
  }, []);

  const addClickEffect = useCallback(
    (
      x: number,
      y: number,
      value: number,
      isCrit: boolean,
      element: TElementType,
      effectiveness: "weak" | "normal" | "resist",
    ) => {
      const id = clickIdRef.current++;
      setClickEffects((prev) => [...prev, { id, x, y, value, isCrit, element, effectiveness }]);
      setTimeout(() => {
        setClickEffects((prev) => prev.filter((effect) => effect.id !== id));
      }, 1000);
    },
    [],
  );

  useEffect(() => {
    if (lastDrops && lastDrops.length > 0) {
      lastDrops.forEach((drop, index) => {
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 50;

        setTimeout(() => {
          addDropEffect(drop.id, drop.count, x, y);
        }, index * 200);
      });

      setTimeout(() => {
        useGameStore.setState({ lastDrops: null });
      }, 2000);
    }
  }, [lastDrops, addDropEffect]);

  const performAttack = useCallback(
    (isAuto: boolean = false) => {
      const currentEnemy = enemyRef.current;

      if (!currentEnemy || !activeWaifu) return;

      if (!currentEnemy.isAlive()) return;

      // Расчет урона
      const calculation = BattleService.calculateDamage(activeWaifu, currentEnemy);

      // Наносим урон через стор (это обновит enemy в сторе и вызовет ре-рендер)
      // dealDamage возвращает фактический нанесенный урон
      const actualDamage = dealDamage(calculation.base, calculation.isCrit);

      // Визуальные эффекты (клики)
      let x: number, y: number;
      if (isAuto && enemyContainerRef.current) {
        const rect = enemyContainerRef.current.getBoundingClientRect();
        x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 20; // Немного разброса
        y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 20;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
      }

      addClickEffect(x, y, actualDamage, calculation.isCrit, activeWaifu.element, calculation.effectiveness);

      const remainingHp = currentEnemy.currentHp;

      if (remainingHp <= 0) {
        handleEnemyDeath();
      }
    },
    [activeWaifu, dealDamage, addClickEffect, handleEnemyDeath], // Убрали enemy из зависимостей, используем ref
  );
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPaused && activeWaifu && enemy.isAlive()) {
        e.preventDefault();
        audioManager.playClick();
        performAttack(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performAttack]);

  useEffect(() => {
    if (autoAttackIntervalRef.current) {
      clearInterval(autoAttackIntervalRef.current);
      autoAttackIntervalRef.current = null;
    }

    if (isPaused || !enemy || !activeWaifu) {
      return;
    }

    autoAttackIntervalRef.current = window.setInterval(() => {
      if (!enemy.isAlive()) {
        if (autoAttackIntervalRef.current) {
          clearInterval(autoAttackIntervalRef.current);
          autoAttackIntervalRef.current = null;
        }
        return;
      }
      performAttack(true);
      audioManager.playClick();
    }, AUTO_ATTACK_INTERVAL);

    return () => {
      if (autoAttackIntervalRef.current) {
        clearInterval(autoAttackIntervalRef.current);
        autoAttackIntervalRef.current = null;
      }
    };
  }, [isPaused, enemy?.id, activeWaifu?.id, performAttack]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isPaused || !activeWaifu) return;
      if (!enemy.isAlive()) return;

      e.preventDefault();

      const rect = enemyContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let clickX = e.clientX;
      let clickY = e.clientY;

      if (e.pointerType === "touch") {
        if (touchHandledRef.current) return;
        touchHandledRef.current = true;
        setTimeout(() => {
          touchHandledRef.current = false;
        }, 100);
      }

      if (onClick) {
        onClick(e as unknown as React.MouseEvent);
      }

      audioManager.playClick();

      const critChance = activeWaifu.getCritChance();
      const isCrit = Math.random() < critChance;

      const clickPower = activeWaifu.getClickPower();
      const elementMultiplier = activeWaifu.getElementMultiplier(enemy.resistances);
      const adMultiplier = useAdStore.getState().getDamageMultiplier();

      const baseDamage = Math.floor(clickPower * elementMultiplier * adMultiplier);
      const actualDamage = dealDamage(baseDamage, isCrit);

      // Проверяем убил ли клик
      if (enemy.currentHp - actualDamage <= 0) {
        handleEnemyDeath();
      }

      const effectiveness = enemy.getElementEffectiveness(activeWaifu.element);
      addClickEffect(clickX, clickY, actualDamage, isCrit, activeWaifu.element, effectiveness);
    },
    [isPaused, activeWaifu, enemy, onClick, addClickEffect, dealDamage, handleEnemyDeath],
  );

  const getResistanceTooltip = (value: number): string => {
    if (value > 0) {
      return `${t("ui.resist")}: ${Math.round(value * 100)}%`;
    }
    return `${t("ui.weak")}: ${Math.round(Math.abs(value) * 100)}%`;
  };

  return (
    <div className="enemy-component">
      <div className="enemy-header">
        <span className="enemy-name">{enemy.name}</span>
        <span className="enemy-level">
          {t("ui.level")} {enemy.level}
        </span>
        {enemy.isBoss && <span className="boss-badge">{t("ui.boss")}</span>}
      </div>
      <div
        ref={enemyContainerRef}
        className={`enemy-sprite-container ${!enemy.isAlive() ? "defeated" : ""}`}
        onPointerDown={handlePointerDown}
      >
        <img src={enemy.sprite} alt={enemy.name} draggable={false} />
        {enemy.isBoss && <div className="boss-aura" />}
      </div>
      <div className="enemy-hp-container">
        <div className="enemy-hp-bar">
          <div className="enemy-hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="enemy-hp-text">
          {Math.floor(currentHp)} / {Math.floor(enemy.maxHp)} {t("ui.hp")}
        </span>
      </div>
      <div className="enemy-resists">
        {Object.entries(enemy.resistances)
          .filter(([_, value]) => value !== 0)
          .map(([element, value]) => (
            <span
              key={element}
              className={`resist-badge ${value > 0 ? "resist" : "weak"}`}
              title={getResistanceTooltip(value)}
            >
              <Icon name={element} size="md" />
              {value > 0 ? "▼" : "▲"}
            </span>
          ))}
      </div>
      {clickEffects.map((effect) => (
        <div
          key={effect.id}
          className={`damage-effect ${effect.isCrit ? "crit" : ""} ${effect.effectiveness}`}
          style={{
            left: effect.x * 0.86,
            top: effect.y * 0.7,
            color: ELEMENT_COLORS[effect.element],
          }}
        >
          <div className="damage-icon">
            <Icon name={effect.isCrit ? "crit" : "click"} size="sm" />
            {effect.effectiveness === "weak" && <Icon name="weak" size="sm" />}
            {effect.effectiveness === "resist" && <Icon name="shield" size="sm" />}
          </div>
          <span className="damage-value">{effect.value}</span>
        </div>
      ))}
      {dropEffects.map((effect) => (
        <div key={effect.id} className="drop-effect" style={{ left: effect.x, top: effect.y }}>
          <Icon name={INVENTORY_ITEMS[effect.itemId as TInventoryItemId]?.icon || "unknown"} size="md" />
          <span className="drop-count">+{effect.count}</span>
          <span className="drop-name">
            {t(`items.${INVENTORY_ITEMS[effect.itemId as TInventoryItemId]?.nameKey || effect.itemId}.name`)}
          </span>
        </div>
      ))}
    </div>
  );
}
