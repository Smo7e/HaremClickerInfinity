import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import "./UpgradePanel.css";
import type { TElementType } from "../../../../types";
import { ELEMENT_COLORS } from "../../../../game/constant";
import { useGameStore } from "../../../../store/gameStore";
import { useShallow } from "zustand/shallow";

interface UpgradePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  getCost: (level: number) => number;
  getEffect: (level: number) => string;
  level: number;
  element?: TElementType;
}

export function UpgradePanel({ isOpen, onClose }: UpgradePanelProps) {
  const { gems, globalUpgrades, upgradeClickPower, upgradeElement } = useGameStore(
    useShallow((state) => ({
      gems: state.inventory.getItemCount("gem"),
      globalUpgrades: state.globalUpgrades,
      upgradeClickPower: state.upgradeClickPower,
      upgradeElement: state.upgradeElement,
    })),
  );

  // Единая формула стоимости для кликов (совпадает с gameStore)
  const getClickCost = (level: number) => {
    return Math.floor(10 + Math.pow(level, 2.3));
  };

  // Единая формула стоимости для элементов (совпадает с gameStore)
  const getElementCost = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level));
  };

  const upgrades: UpgradeConfig[] = [
    {
      id: "click_power",
      name: t("upgrades.click.name"),
      description: t("upgrades.click.desc"),
      icon: "click",
      getCost: (lvl) => getClickCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 100}`,
      level: globalUpgrades.clickPowerBonus,
    },
    {
      id: "element_water",
      name: t("upgrades.elementWater.name"),
      description: t("upgrades.elementWater.desc"),
      icon: "water",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.water,
      element: "water",
    },
    {
      id: "element_fire",
      name: t("upgrades.elementFire.name"),
      description: t("upgrades.elementFire.desc"),
      icon: "fire",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.fire,
      element: "fire",
    },
    {
      id: "element_earth",
      name: t("upgrades.elementEarth.name"),
      description: t("upgrades.elementEarth.desc"),
      icon: "earth",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.earth,
      element: "earth",
    },
    {
      id: "element_ice",
      name: t("upgrades.elementIce.name"),
      description: t("upgrades.elementIce.desc"),
      icon: "ice",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.ice,
      element: "ice",
    },
    {
      id: "element_light",
      name: t("upgrades.elementLight.name"),
      description: t("upgrades.elementLight.desc"),
      icon: "light",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.light,
      element: "light",
    },
    {
      id: "element_dark",
      name: t("upgrades.elementDark.name"),
      description: t("upgrades.elementDark.desc"),
      icon: "dark",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.dark,
      element: "dark",
    },
    {
      id: "element_physical",
      name: t("upgrades.elementPhysical.name"),
      description: t("upgrades.elementPhysical.desc"),
      icon: "physical",
      getCost: (lvl) => getElementCost(lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: globalUpgrades.elementDamage.physical,
      element: "physical",
    },
  ];

  const handleUpgrade = (upgrade: UpgradeConfig) => {
    const cost = upgrade.getCost(upgrade.level);
    if (gems < cost) return; // Дополнительная проверка перед покупкой

    let success = false;
    if (upgrade.element) {
      success = upgradeElement(upgrade.element);
    } else {
      success = upgradeClickPower();
    }

    // Если не удалось — возможно состояние изменилось, обновим UI
    if (!success) {
      console.log("[UpgradePanel] Upgrade failed, insufficient gems or other error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel upgrade-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="upgrades" size="md" /> {t("ui.upgrades")}
          </h2>
          <div className="gems-display">
            <Icon name="gem" size="sm" />
            <span>{Math.floor(gems)}</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>
        <div className="panel-content">
          <p className="upgrades-global-hint">{t("upgrades.globalHint")}</p>
          <div className="upgrade-list-modal">
            {upgrades.map((upgrade) => {
              const cost = upgrade.getCost(upgrade.level);
              const effect = upgrade.getEffect(upgrade.level);
              const canAfford = gems >= cost;

              return (
                <div
                  key={upgrade.id}
                  className={`upgrade-item-modal ${!canAfford ? "cannot-afford" : ""}`}
                  style={upgrade.element ? { borderLeft: `4px solid ${ELEMENT_COLORS[upgrade.element]}` } : undefined}
                >
                  <div className="upgrade-info-modal">
                    <span
                      className="upgrade-icon-modal"
                      style={upgrade.element ? { background: `${ELEMENT_COLORS[upgrade.element]}20` } : undefined}
                    >
                      <Icon name={upgrade.icon} size="lg" />
                    </span>
                    <div className="upgrade-details-modal">
                      <span className="upgrade-name-modal">{upgrade.name}</span>
                      <span className="upgrade-desc-modal">{upgrade.description}</span>
                      <span className="upgrade-level-modal">
                        {t("ui.level")}: {upgrade.level}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn-upgrade-modal ${!canAfford ? "disabled" : ""}`}
                    onClick={() => handleUpgrade(upgrade)}
                    disabled={!canAfford}
                    style={canAfford && upgrade.element ? { background: ELEMENT_COLORS[upgrade.element] } : undefined}
                  >
                    <span className="upgrade-effect-modal">{effect}</span>
                    <span className="upgrade-cost-modal">💎 {cost}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
