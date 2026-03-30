import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import "./UpgradePanel.css";
import type { TElementType } from "../../../../types";
import { ELEMENT_COLORS } from "../../../../game/constant";

interface UpgradePanelProps {
  isOpen: boolean;
  onClose: () => void;
  gems: number;
  onUpgrade: (type: string, cost: number, element?: TElementType) => void;
  upgradeLevels: {
    clickPower: number;
    elementDamage: Record<TElementType, number>;
  };
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

export function UpgradePanel({ isOpen, onClose, gems, onUpgrade, upgradeLevels }: UpgradePanelProps) {
  const getCost = (baseCost: number, level: number) => {
    const scaledLevel = Math.min(level, 100);
    return Math.floor(baseCost * Math.pow(1.5, scaledLevel));
  };

  const upgrades: UpgradeConfig[] = [
    {
      id: "click_power",
      name: t("upgrades.click.name"),
      description: t("upgrades.click.desc"),
      icon: "click",
      getCost: (lvl) => getCost(10, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 1000}`,
      level: upgradeLevels.clickPower,
    },
    {
      id: "element_water",
      name: t("upgrades.elementWater.name"),
      description: t("upgrades.elementWater.desc"),
      icon: "water",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.water,
      element: "water",
    },
    {
      id: "element_fire",
      name: t("upgrades.elementFire.name"),
      description: t("upgrades.elementFire.desc"),
      icon: "fire",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.fire,
      element: "fire",
    },
    {
      id: "element_earth",
      name: t("upgrades.elementEarth.name"),
      description: t("upgrades.elementEarth.desc"),
      icon: "earth",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.earth,
      element: "earth",
    },
    {
      id: "element_ice",
      name: t("upgrades.elementIce.name"),
      description: t("upgrades.elementIce.desc"),
      icon: "ice",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.ice,
      element: "ice",
    },
    {
      id: "element_light",
      name: t("upgrades.elementLight.name"),
      description: t("upgrades.elementLight.desc"),
      icon: "light",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.light,
      element: "light",
    },
    {
      id: "element_dark",
      name: t("upgrades.elementDark.name"),
      description: t("upgrades.elementDark.desc"),
      icon: "dark",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.dark,
      element: "dark",
    },
    {
      id: "element_physical",
      name: t("upgrades.elementPhysical.name"),
      description: t("upgrades.elementPhysical.desc"),
      icon: "physical",
      getCost: (lvl) => getCost(100, lvl),
      getEffect: (lvl) => `+${(lvl + 1) * 10}%`,
      level: upgradeLevels.elementDamage.physical,
      element: "physical",
    },
  ];

  const handleUpgrade = (upgrade: UpgradeConfig) => {
    const cost = upgrade.getCost(upgrade.level);
    if (gems >= cost) {
      onUpgrade(upgrade.element ? "element" : upgrade.id, cost, upgrade.element);
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
                  className="upgrade-item-modal"
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
                    className="btn-upgrade-modal"
                    onClick={() => handleUpgrade(upgrade)}
                    disabled={!canAfford}
                    style={upgrade.element ? { background: ELEMENT_COLORS[upgrade.element] } : undefined}
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
