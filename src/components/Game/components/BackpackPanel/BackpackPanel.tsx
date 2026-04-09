import { useState } from "react";
import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import { RARITY_COLORS } from "../../../../game/constant";
import "./BackpackPanel.css";
import { Icon } from "../../../Icon/Icon";

interface BackpackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUseItem: (itemId: string) => void;
  selectedWaifuId?: string;
}

type TabType = "all" | "consumable" | "material" | "currency";

export function BackpackPanel({ isOpen, onClose, onUseItem, selectedWaifuId }: BackpackPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const inventory = useGameStore((state) => state.inventory);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const locationProgress = useGameStore((state) => state.locationProgress);

  // Текущий уровень активной локации
  const currentLevel = locationProgress[currentLocation]?.currentLevel ?? 1;

  if (!isOpen) return null;

  const items = inventory.getAllItems();
  const filteredItems = activeTab === "all" ? items : items.filter((item) => item.type === activeTab);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "all", label: t("ui.all"), icon: "all" },
    { id: "consumable", label: t("ui.consumables"), icon: "potion" },
    { id: "material", label: t("ui.materials"), icon: "collection" },
    { id: "currency", label: t("ui.currency"), icon: "gem" },
  ];

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel backpack-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="backpack" size="md" /> {t("ui.backpack")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="backpack-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`backpack-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size="sm" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="backpack-content">
          {filteredItems.length === 0 ? (
            <p className="empty-message">{t("ui.noItems")}</p>
          ) : (
            <div className="item-grid">
              {filteredItems.map((item) => {
                // Безопасная подстановка уровня только для свитков понижения
                let itemDesc = t(`items.${item.nameKey}.desc`);
                if (itemDesc.includes("{{level}}")) {
                  itemDesc = itemDesc.replace("{{level}}", currentLevel.toString());
                }

                return (
                  <div key={item.id} className={`item-card rarity-${item.rarity}`}>
                    <div className="item-icon-container">
                      <Icon name={item.icon} size="lg" />
                      {item.count > 1 && <span className="item-count">{item.count}</span>}
                    </div>
                    <div className="item-info">
                      <span className="item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {t(`items.${item.nameKey}.name`)}
                      </span>
                      <span className="item-desc">{itemDesc}</span>
                    </div>
                    {item.type === "consumable" && (
                      <button
                        className="btn-use-item"
                        onClick={() => onUseItem(item.id)}
                        disabled={item.effect?.target === "selected_waifu" && !selectedWaifuId}
                      >
                        {t("ui.use")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
