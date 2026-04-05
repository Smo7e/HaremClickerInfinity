import { useState, useEffect, useRef } from "react";
import { Enemy, type DamageInfo } from "../../../../classes/Enemy";
import type { Waifu } from "../../../../classes/Waifu";
import "./EnemyComponent.css";
import { ELEMENT_COLORS, ELEMENT_KEYS, INVENTORY_ITEMS } from "../../../../game/constant";
import type { TElementType } from "../../../../types";
import { audioManager } from "../../../../audio/AudioManager";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";

interface DropEffect {
  id: number;
  x: number;
  y: number;
  itemId: string;
  count: number;
}

interface EnemyComponentProps {
  enemy: Enemy;
  activeWaifu: Waifu;
  onEnemyDefeated: (expReward: number, drops: Array<{ id: string; count: number }>) => void;
  isPaused: boolean;
  dropChanceMultiplier?: number;
}

export function EnemyComponent({
  enemy,
  activeWaifu,
  onEnemyDefeated,
  isPaused,
  dropChanceMultiplier = 1,
}: EnemyComponentProps) {
  const [clickEffects, setClickEffects] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      value: number;
      isCrit: boolean;
      element: TElementType;
      effectiveness: "weak" | "normal" | "resist";
    }>
  >([]);
  const [dropEffects, setDropEffects] = useState<DropEffect[]>([]);
  const dropIdRef = useRef(0);
  const clickIdRef = useRef(0);
  const waifuRef = useRef(activeWaifu);
  const enemyRef = useRef(enemy);
  const pausedRef = useRef(isPaused);

  useEffect(() => {
    waifuRef.current = activeWaifu;
  }, [activeWaifu]);

  useEffect(() => {
    enemyRef.current = enemy;
  }, [enemy]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  const addDropEffect = (x: number, y: number, itemId: string, count: number) => {
    const id = dropIdRef.current++;
    setDropEffects((prev) => [...prev, { id, x, y, itemId, count }]);
    setTimeout(() => {
      setDropEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, 800);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;

      const currentWaifu = waifuRef.current;
      const currentEnemy = enemyRef.current;

      if (!currentWaifu || !currentEnemy) return;

      const damage = currentWaifu.getClickPower();
      const isCrit = Math.random() < currentWaifu.getCritChance();
      const damageInfo: DamageInfo = {
        type: currentWaifu.element,
        amount: damage,
        isCrit,
        critMultiplier: currentWaifu.getCritMultiplier(),
        source: currentWaifu.id,
      };
      const actualDamage = currentEnemy.takeDamage(damageInfo);

      setClickEffects((prev) => [
        ...prev,
        {
          id: clickIdRef.current++,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2 - 100,
          value: actualDamage,
          isCrit,
          element: currentWaifu.element,
          effectiveness: "normal",
        },
      ]);

      setTimeout(() => {
        setClickEffects((prev) => prev.filter((e) => e.id !== clickIdRef.current - 1));
      }, 600);

      audioManager.playClick();

      if (!currentEnemy.isAlive()) {
        audioManager.playEnemyDefeat();
        const drops = currentEnemy.rollDrops(dropChanceMultiplier);
        drops.forEach((drop, index) => {
          const offsetX = (index - drops.length / 2) * 40;
          const offsetY = -50 - Math.random() * 30;
          addDropEffect(window.innerWidth / 2 + offsetX, window.innerHeight / 2 + offsetY, drop.id, drop.count);
        });
        onEnemyDefeated(currentEnemy.expReward, drops);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dropChanceMultiplier, onEnemyDefeated]);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPaused) return;
    audioManager.playClick();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const clickPower = activeWaifu.getClickPower();
    const isCrit = Math.random() < activeWaifu.getCritChance();
    const damageInfo: DamageInfo = {
      type: activeWaifu.element,
      amount: clickPower,
      isCrit,
      critMultiplier: activeWaifu.getCritMultiplier(),
      source: activeWaifu.id,
    };
    const actualDamage = enemy.takeDamage(damageInfo);
    const effectiveness = enemy.getElementEffectiveness(activeWaifu.element);
    activeWaifu.recordClick(actualDamage);
    addClickEffect(clientX, clientY, actualDamage, isCrit, activeWaifu.element, effectiveness);
    if (!enemy.isAlive()) {
      death();
    }
  };

  const death = () => {
    audioManager.playEnemyDefeat();
    const drops = enemy.rollDrops(dropChanceMultiplier);
    drops.forEach((drop, index) => {
      const offsetX = (index - drops.length / 2) * 40;
      const offsetY = -50 - Math.random() * 30;
      addDropEffect(window.innerWidth / 2 + offsetX, window.innerHeight / 2 + offsetY, drop.id, drop.count);
    });
    onEnemyDefeated(enemy.expReward, drops);
  };

  const addClickEffect = (
    x: number,
    y: number,
    value: number,
    isCrit: boolean,
    element: TElementType,
    effectiveness?: "weak" | "normal" | "resist",
  ) => {
    const id = clickIdRef.current++;
    setClickEffects((prev) => [
      ...prev,
      {
        id,
        x,
        y,
        value,
        isCrit,
        element,
        effectiveness: effectiveness || "normal",
      },
    ]);
    setTimeout(() => {
      setClickEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, 600);
  };

  const getResistanceTooltip = (value: number): string => {
    if (value > 0) {
      return `${t("ui.resist")}: ${Math.round(value * 100)}%`;
    } else {
      return `${t("ui.weak")}: ${Math.round(Math.abs(value) * 100)}%`;
    }
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
        className={`enemy-sprite-container ${!enemy.isAlive() ? "defeated" : ""}`}
        onClick={handleClick}
        onTouchStart={handleClick}
      >
        <img src={enemy.sprite} alt={enemy.name} draggable={false} />
        {enemy.isBoss && <div className="boss-aura" />}
      </div>

      <div className="enemy-hp-container">
        <div className="enemy-hp-bar">
          <div className="enemy-hp-fill" style={{ width: `${enemy.getHpPercent()}%` }} />
        </div>
        <span className="enemy-hp-text">
          {Math.floor(enemy.currentHp)} / {Math.floor(enemy.maxHp)} {t("ui.hp")}
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
        <div
          key={effect.id}
          className="drop-effect"
          style={{
            left: effect.x,
            top: effect.y,
          }}
        >
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
