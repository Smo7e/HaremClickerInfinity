import { useState, useEffect, useRef } from "react";
import { Enemy, type DamageInfo, type TEnemyRewards } from "../../../../classes/Enemy";
import type { Waifu } from "../../../../classes/Waifu";
import "./EnemyComponent.css";
import { ELEMENT_COLORS, ELEMENT_KEYS } from "../../../../game/constant";
import type { TElementType } from "../../../../types";
import { audioManager } from "../../../../audio/AudioManager";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";

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
            <span key={element} className={`resist-badge ${value > 0 ? "resist" : "weak"}`}>
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
            <Icon name={effect.isCrit ? "crit" : "damage"} size="sm" />
            {effect.effectiveness === "weak" && <Icon name="weak" size="sm" />}
            {effect.effectiveness === "resist" && <Icon name="shield" size="sm" />}
          </div>
          <span className="damage-value">{effect.value}</span>
        </div>
      ))}
    </div>
  );
}
