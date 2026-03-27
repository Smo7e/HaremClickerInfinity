import { t } from "../../../../locales/i18n";
import "./UpgradePanel.css";

interface Upgrade {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    effect: string;
    multiplier: number;
}

interface UpgradePanelProps {
    isOpen: boolean;
    onClose: () => void;
    gems: number;
    onUpgrade: (type: string, cost: number) => void;
    upgradeLevels: {
        clickPower: number;
        autoClick: number;
        critChance: number;
    };
}

export function UpgradePanel({
    isOpen,
    onClose,
    gems,
    onUpgrade,
    upgradeLevels,
}: UpgradePanelProps) {
    const getUpgradeCost = (baseCost: number, level: number) => {
        return Math.floor(baseCost * Math.pow(1.5, level));
    };

    const upgrades: Upgrade[] = [
        {
            id: "click_power",
            name: t("upgrades.click.name"),
            description: t("upgrades.click.desc"),
            icon: "👆",
            cost: getUpgradeCost(10, upgradeLevels.clickPower),
            effect: "+1",
            multiplier: 1,
        },
        {
            id: "auto_click",
            name: t("upgrades.auto.name"),
            description: t("upgrades.auto.desc"),
            icon: "⚙️",
            cost: getUpgradeCost(50, upgradeLevels.autoClick),
            effect: "+0.5/s",
            multiplier: 1,
        },
        {
            id: "crit_chance",
            name: t("upgrades.crit.name"),
            description: t("upgrades.crit.desc"),
            icon: "⚔️",
            cost: getUpgradeCost(100, upgradeLevels.critChance),
            effect: "+5%",
            multiplier: 1,
        },
    ];

    const handleUpgrade = (upgrade: Upgrade) => {
        if (gems >= upgrade.cost) {
            onUpgrade(upgrade.id, upgrade.cost);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="panel-overlay" onClick={onClose}>
            <div
                className="panel upgrade-panel-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="panel-header">
                    <h2>⬆️ {t("ui.upgrades")}</h2>
                    <div className="gems-display">
                        <span className="currency-icon">💎</span>
                        <span>{Math.floor(gems)}</span>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="panel-content">
                    <p className="upgrades-global-hint">
                        {t("upgrades.globalHint")}
                    </p>

                    <div className="upgrade-list-modal">
                        {upgrades.map((upgrade) => (
                            <div
                                key={upgrade.id}
                                className="upgrade-item-modal"
                            >
                                <div className="upgrade-info-modal">
                                    <span className="upgrade-icon-modal">
                                        {upgrade.icon}
                                    </span>
                                    <div className="upgrade-details-modal">
                                        <span className="upgrade-name-modal">
                                            {upgrade.name}
                                        </span>
                                        <span className="upgrade-desc-modal">
                                            {upgrade.description}
                                        </span>
                                        <span className="upgrade-level-modal">
                                            {t("ui.level")}:{" "}
                                            {upgrade.id === "click_power"
                                                ? upgradeLevels.clickPower
                                                : upgrade.id === "auto_click"
                                                  ? upgradeLevels.autoClick
                                                  : upgradeLevels.critChance}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-upgrade-modal"
                                    onClick={() => handleUpgrade(upgrade)}
                                    disabled={gems < upgrade.cost}
                                >
                                    <span className="upgrade-effect-modal">
                                        {upgrade.effect}
                                    </span>
                                    <span className="upgrade-cost-modal">
                                        💎 {upgrade.cost}
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
