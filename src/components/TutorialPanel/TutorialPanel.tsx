import { useState } from "react";
import { t } from "../../locales/i18n";
import { Icon } from "../Icon/Icon";

import "./TutorialPanel.css";

interface TutorialPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TutorialTab = "basics" | "combat" | "locations" | "waifus" | "upgrades" | "craft" | "collection";

export function TutorialPanel({ isOpen, onClose }: TutorialPanelProps) {
  const [activeTab, setActiveTab] = useState<TutorialTab>("basics");

  if (!isOpen) return null;

  const tabs: { id: TutorialTab; label: string; icon: string }[] = [
    { id: "basics", label: t("tutorial.basics"), icon: "click" },
    { id: "combat", label: t("tutorial.combat"), icon: "crit" },
    { id: "locations", label: t("tutorial.locations"), icon: "pool" },
    { id: "waifus", label: t("tutorial.waifus"), icon: "waifus" },
    { id: "upgrades", label: t("tutorial.upgrades"), icon: "upgrades" },
    { id: "craft", label: t("tutorial.craft"), icon: "collection" },
    { id: "collection", label: t("tutorial.collection"), icon: "backpack" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "basics":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.basicsTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="click" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.clickTitle")}</h4>
                <p>{t("tutorial.clickDesc")}</p>
              </div>
            </div>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="gem" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.currencyTitle")}</h4>
                <p>{t("tutorial.currencyDesc")}</p>
                <div className="tutorial-currencies">
                  <span className="currency-tag gem">
                    <Icon name="gem" size="vsm" /> {t("items.gem.name")}
                  </span>
                  <span className="currency-tag essence">
                    <Icon name="essence" size="vsm" /> {t("items.essence.name")}
                  </span>
                </div>
              </div>
            </div>
            <div className="tutorial-notice">
              <Icon name="check" size="sm" />
              <span>{t("tutorial.autoSaveTip")}</span>
            </div>
          </div>
        );

      case "combat":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.combatTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="crit" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.critTitle")}</h4>
                <p>{t("tutorial.critDesc")}</p>
              </div>
            </div>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="weak" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.elementsTitle")}</h4>
                <p>{t("tutorial.elementsDesc")}</p>
                <div className="elements-grid">
                  {["water", "fire", "earth", "ice", "light", "dark", "physical"].map((el) => (
                    <span key={el} className={`element-tag ${el}`}>
                      <Icon name={el} size="sm" /> {t(`ui.${el}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="tutorial-warning">
              <Icon name="shield" size="sm" />
              <span>{t("tutorial.resistWarning")}</span>
            </div>
          </div>
        );

      case "locations":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.locationsTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="forest" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.locationChangeTitle")}</h4>
                <p>{t("tutorial.locationChangeDesc")}</p>
              </div>
            </div>

            <div className="tutorial-card highlight">
              <div className="tutorial-card-icon">
                <Icon name="scroll" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.scrollsTitle")}</h4>
                <p>{t("tutorial.scrollsDesc")}</p>
                <div className="scrolls-list">
                  <div className="scroll-item">
                    <span className="scroll-name">{t("items.levelDownScroll10.name")}</span>
                    <span className="scroll-effect">-10 {t("ui.levels")}</span>
                  </div>
                  <div className="scroll-item">
                    <span className="scroll-name">{t("items.levelDownScroll20.name")}</span>
                    <span className="scroll-effect">-20 {t("ui.levels")}</span>
                  </div>
                  <div className="scroll-item">
                    <span className="scroll-name">{t("items.levelDownScroll50.name")}</span>
                    <span className="scroll-effect">-50 {t("ui.levels")}</span>
                  </div>
                </div>
                <p className="tutorial-hint">{t("tutorial.scrollsHint")}</p>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="pool" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.locationBonusTitle")}</h4>
                <p>{t("tutorial.locationBonusDesc")}</p>
              </div>
            </div>
          </div>
        );

      case "waifus":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.waifusTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="gacha" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.gachaTitle")}</h4>
                <p>{t("tutorial.gachaDesc")}</p>
                <div className="cost-badge">
                  <Icon name="essence" size="sm" /> 10 {t("ui.essence")}
                </div>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="duplicate" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.duplicatesTitle")}</h4>
                <p>{t("tutorial.duplicatesDesc")}</p>
                <div className="bonus-tag">+30% {t("ui.stats")}</div>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="level" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.expTitle")}</h4>
                <p>{t("tutorial.expDesc")}</p>
              </div>
            </div>
          </div>
        );

      case "upgrades":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.upgradesTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="upgrades" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.globalUpgradesTitle")}</h4>
                <p>{t("tutorial.globalUpgradesDesc")}</p>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="click" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.clickPowerTitle")}</h4>
                <p>{t("tutorial.clickPowerDesc")}</p>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="fire" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.elementUpgradesTitle")}</h4>
                <p>{t("tutorial.elementUpgradesDesc")}</p>
              </div>
            </div>

            <div className="tutorial-notice">
              <Icon name="gem" size="sm" />
              <span>{t("tutorial.upgradeCostTip")}</span>
            </div>
          </div>
        );

      case "craft":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.craftTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="collection" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.craftingTitle")}</h4>
                <p>{t("tutorial.craftingDesc")}</p>
              </div>
            </div>

            <div className="tutorial-grid">
              <div className="tutorial-mini-card">
                <Icon name="scroll" size="md" />
                <span>{t("items.expScroll500.name")}</span>
              </div>
              <div className="tutorial-mini-card">
                <Icon name="potion" size="md" />
                <span>{t("items.affectionPotion.name")}</span>
              </div>
              <div className="tutorial-mini-card highlight">
                <Icon name="scroll" size="md" />
                <span>{t("items.levelDownScroll10.name")}</span>
              </div>
            </div>

            <div className="tutorial-warning">
              <Icon name="backpack" size="sm" />
              <span>{t("tutorial.materialsTip")}</span>
            </div>
          </div>
        );

      case "collection":
        return (
          <div className="tutorial-content">
            <h3>{t("tutorial.collectionTitle")}</h3>
            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="backpack" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.collectionItemsTitle")}</h4>
                <p>{t("tutorial.collectionItemsDesc")}</p>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="upgrades" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.buffsTitle")}</h4>
                <p>{t("tutorial.buffsDesc")}</p>
                <div className="buff-examples">
                  <span className="buff-tag">+50% {t("tutorial.vsSlimes")}</span>
                  <span className="buff-tag">+20% {t("tutorial.darkDamage")}</span>
                </div>
              </div>
            </div>

            <div className="tutorial-card">
              <div className="tutorial-card-icon">
                <Icon name="collection" size="lg" />
              </div>
              <div className="tutorial-card-content">
                <h4>{t("tutorial.bestiaryTitle")}</h4>
                <p>{t("tutorial.bestiaryDesc")}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel tutorial-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="book" size="md" /> {t("tutorial.title")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="tutorial-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tutorial-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size="sm" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tutorial-scroll-content">{renderContent()}</div>
      </div>
    </div>
  );
}
