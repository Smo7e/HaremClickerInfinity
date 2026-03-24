import { useState, useEffect, useRef } from "react";
import { Enemy, type DamageInfo, type TEnemyRewards } from "../../../../classes/Enemy";
import type { Waifu } from "../../../../classes/Waifu";
import "./EnemyComponent.css";
import { ELEMENT_COLORS, ELEMENT_ICONS } from "../../../../game/constant";
import type { TElementType } from "../../../../types";
import { audioManager } from "../../../../audio/AudioManager";

interface EnemyComponentProps {
  enemy: Enemy;
  activeWaifu: Waifu;
  onEnemyDefeated: (rewards: TEnemyRewards) => void;
  onDamageDealt: (damage: number, isCrit: boolean, element: TElementType) => void;
  isPaused: boolean;
}

export function EnemyComponent({ enemy, activeWaifu, onEnemyDefeated, onDamageDealt, isPaused }: EnemyComponentProps) {
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

  const clickIdRef = useRef(0);

  // Автоатака вайфу
  useEffect(() => {
    if (isPaused || !activeWaifu.getAutoClick()) return;

    const interval = setInterval(() => {
      performAutoAttack();
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, activeWaifu, enemy]);

  const performAutoAttack = () => {
    const damage = activeWaifu.getAutoClick();
    const isCrit = Math.random() < activeWaifu.getCritChance();

    const damageInfo: DamageInfo = {
      type: activeWaifu.element,
      amount: damage,
      isCrit,
      source: activeWaifu.id,
    };

    const actualDamage = enemy.takeDamage(damageInfo);
    onDamageDealt(actualDamage, isCrit, activeWaifu.element);

    // Добавляем эффект
    addClickEffect(window.innerWidth / 2, window.innerHeight / 2 - 100, actualDamage, isCrit, activeWaifu.element);
    audioManager.playClick();

    if (!enemy.isAlive()) {
      audioManager.playEnemyDefeat();

      onEnemyDefeated(enemy.rewards);
    }
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPaused) return;
    audioManager.playClick();

    // Координаты для эффекта
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
      source: activeWaifu.id,
    };

    const actualDamage = enemy.takeDamage(damageInfo);
    const effectiveness = enemy.getElementEffectiveness(activeWaifu.element);

    onDamageDealt(actualDamage, isCrit, activeWaifu.element);
    activeWaifu.recordClick(actualDamage);

    addClickEffect(clientX, clientY, actualDamage, isCrit, activeWaifu.element, effectiveness);

    if (!enemy.isAlive()) {
      audioManager.playEnemyDefeat();
      onEnemyDefeated(enemy.rewards);
    }
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

  // Элементальные цвета

  return (
    <div className="enemy-component">
      {/* Инфо врага */}
      <div className="enemy-header">
        <span className="enemy-name">{enemy.name}</span>
        <span className="enemy-level">Lv.{enemy.level}</span>
        {enemy.isBoss && <span className="boss-badge">BOSS</span>}
      </div>

      {/* Спрайт врага */}
      <div
        className={`enemy-sprite-container ${!enemy.isAlive() ? "defeated" : ""}`}
        onClick={handleClick}
        onTouchStart={handleClick}
      >
        <img src={enemy.sprite} alt={enemy.name} draggable={false} />

        {enemy.isBoss && <div className="boss-aura" />}
      </div>

      {/* HP бар */}
      <div className="enemy-hp-container">
        <div className="enemy-hp-bar">
          <div className="enemy-hp-fill" style={{ width: `${enemy.getHpPercent()}%` }} />
        </div>
        <span className="enemy-hp-text">
          {Math.floor(enemy.currentHp)} / {Math.floor(enemy.maxHp)} HP
        </span>
      </div>

      {/* Резисты */}
      <div className="enemy-resists">
        {Object.entries(enemy.resistances)
          .filter(([_, value]) => value !== 0)
          .map(([element, value]) => (
            <span
              key={element}
              className={`resist-badge ${value > 0 ? "resist" : "weak"}`}
              title={`${element}: ${value > 0 ? "+" : ""}${(value * 100).toFixed(0)}%`}
            >
              {ELEMENT_ICONS[element as TElementType]}
              {value > 0 ? "↓" : "↑"}
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
          <span className="damage-icon">
            {effect.isCrit ? "💥" : "⚔️"}
            {effect.effectiveness === "weak" && "💫"}
            {effect.effectiveness === "resist" && "🛡️"}
          </span>
          <span className="damage-value">{effect.value}</span>
        </div>
      ))}
    </div>
  );
}
