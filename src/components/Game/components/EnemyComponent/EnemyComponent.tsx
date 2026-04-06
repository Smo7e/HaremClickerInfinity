import { useState, useRef, useEffect, useCallback } from "react";

import type { Waifu } from "../../../../classes/Waifu";
import type { Enemy } from "../../../../classes/Enemy";
import "./EnemyComponent.css";
import { ELEMENT_COLORS, ELEMENT_KEYS, INVENTORY_ITEMS } from "../../../../game/constant";
import type { TElementType } from "../../../../types";
import { audioManager } from "../../../../audio/AudioManager";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import { BattleService } from "../../../../services/BattleService";
import { useGameStore } from "../../../../store/gameStore";

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
  dropChanceMultiplier?: number;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

const clickIdRef = { current: 0 };
let dropIdCounter = 0;
const AUTO_ATTACK_INTERVAL = 1000;

export function EnemyComponent({
  enemy,
  activeWaifu,
  isPaused,
  dropChanceMultiplier = 1,
  onClick,
}: EnemyComponentProps) {
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const [dropEffects, setDropEffects] = useState<DropEffect[]>([]);
  const [hpPercent, setHpPercent] = useState(() => enemy.getHpPercent());
  const [currentHp, setCurrentHp] = useState(() => enemy.currentHp);

  const enemyRef = useRef(enemy);
  const autoAttackIntervalRef = useRef<number | null>(null);
  const enemyContainerRef = useRef<HTMLDivElement>(null);

  const globalUpgrades = useGameStore((state) => state.globalUpgrades);
  const dealDamage = useGameStore((state) => state.dealDamage);

  useEffect(() => {
    enemyRef.current = enemy;
    setHpPercent(enemy.getHpPercent());
    setCurrentHp(enemy.currentHp);
  }, [enemy]);

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
    }, 1500);
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
      }, 600);
    },
    [],
  );

  const performAttack = useCallback(
    (isAuto: boolean = false) => {
      if (!enemy || !activeWaifu) return;

      const calculation = BattleService.calculateDamage(activeWaifu, enemy, globalUpgrades);
      const actualDamage = dealDamage(calculation.base, calculation.isCrit);

      let x: number, y: number;
      if (isAuto && enemyContainerRef.current) {
        const rect = enemyContainerRef.current.getBoundingClientRect();
        x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
        y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 60;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
      }

      addClickEffect(x, y, actualDamage, calculation.isCrit, activeWaifu.element, calculation.effectiveness);

      const newHp = enemy.currentHp - actualDamage;
      if (newHp <= 0) {
        const drops = enemy.rollDrops(dropChanceMultiplier);
        drops.forEach((drop, index) => {
          setTimeout(() => {
            addDropEffect(drop.id, drop.count, x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 50);
          }, index * 200);
        });
      }
    },
    [enemy, activeWaifu, globalUpgrades, dealDamage, dropChanceMultiplier, addClickEffect, addDropEffect],
  );

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

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isPaused || !activeWaifu) return;

      if (onClick) {
        onClick(e);
      }

      audioManager.playClick();

      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? window.innerWidth / 2;
        clientY = e.touches[0]?.clientY ?? window.innerHeight / 2;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      const clickPower = activeWaifu.getClickPower();
      const elementMultiplier = activeWaifu.getElementMultiplier(enemy.resistances);
      const isCrit = Math.random() < activeWaifu.getCritChance();
      const critMultiplier = isCrit ? activeWaifu.getCritMultiplier() : 1;

      const finalDamage = Math.floor(clickPower * elementMultiplier * critMultiplier);

      const effectiveness = enemy.getElementEffectiveness(activeWaifu.element);
      addClickEffect(clientX, clientY, finalDamage, isCrit, activeWaifu.element, effectiveness);

      const newHp = enemy.currentHp - finalDamage;
      if (newHp <= 0) {
        const drops = enemy.rollDrops(dropChanceMultiplier);
        drops.forEach((drop, index) => {
          setTimeout(() => {
            addDropEffect(
              drop.id,
              drop.count,
              clientX + (Math.random() - 0.5) * 100,
              clientY + (Math.random() - 0.5) * 50,
            );
          }, index * 200);
        });
      }
    },
    [isPaused, activeWaifu, enemy, dropChanceMultiplier, onClick, addClickEffect, addDropEffect],
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
        onClick={handleClick}
        onTouchStart={handleClick}
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
              {t(`ui.${ELEMENT_KEYS[element as TElementType]}`)}
            </span>
          ))}
      </div>
      {clickEffects.map((effect) => (
        <div
          key={effect.id}
          className={`damage-effect ${effect.isCrit ? "crit" : ""} ${effect.effectiveness}`}
          style={{
            left: effect.x,
            top: effect.y,
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
          <Icon name={INVENTORY_ITEMS[effect.itemId]?.icon || "unknown"} size="md" />
          <span className="drop-count">+{effect.count}</span>
          <span className="drop-name">
            {t(`items.${INVENTORY_ITEMS[effect.itemId]?.nameKey || effect.itemId}.name`)}
          </span>
        </div>
      ))}
    </div>
  );
}
