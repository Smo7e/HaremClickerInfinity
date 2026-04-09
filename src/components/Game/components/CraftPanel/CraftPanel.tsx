import { useState, useMemo, useCallback } from "react";
import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import { CRAFT_ITEMS, INVENTORY_ITEMS, RARITY_COLORS } from "../../../../game/constant";
import type { TCraftItem } from "../../../../types";
import { Icon } from "../../../Icon/Icon";
import "./CraftPanel.css";

interface CraftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCraft: (item: TCraftItem) => void;
  onUseItem: (itemId: string) => void;
  selectedWaifuId?: string;
}

type CraftTab = "craft" | "use";
type CraftFilter = "all" | "potion" | "scroll" | "available";

export function CraftPanel({ isOpen, onClose, onCraft, onUseItem, selectedWaifuId }: CraftPanelProps) {
  const [activeTab, setActiveTab] = useState<CraftTab>("craft");
  const [selectedCraftItem, setSelectedCraftItem] = useState<TCraftItem | null>(null);
  const [craftFilter, setCraftFilter] = useState<CraftFilter>("all");
  const inventory = useGameStore((state) => state.inventory);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const locationProgress = useGameStore((state) => state.locationProgress);
  const currentLevel = locationProgress[currentLocation]?.currentLevel ?? 1;

  const craftableItems = useMemo(() => {
    return CRAFT_ITEMS.map((item) => {
      const canCraft = item.ingredients.every((ing) => inventory.getItemCount(ing.itemId) >= ing.count);
      return { ...item, canCraft };
    });
  }, [inventory]);

  const consumableItems = useMemo(() => {
    return inventory.getItemsByType("consumable");
  }, [inventory]);

  // Фильтрация по подкатегориям
  const filteredCraftItems = useMemo(() => {
    return craftableItems.filter((item) => {
      if (craftFilter === "available") return item.canCraft;
      if (craftFilter === "potion") return item.id.includes("potion") || item.icon.includes("potion");
      if (craftFilter === "scroll") return item.id.includes("scroll") || item.icon.includes("scroll");
      return true;
    });
  }, [craftableItems, craftFilter]);

  const handleCraft = useCallback(
    (item: TCraftItem) => {
      const canCraft = item.ingredients.every((ing) => inventory.getItemCount(ing.itemId) >= ing.count);
      if (canCraft) {
        onCraft(item);
      }
    },
    [inventory, onCraft],
  );

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel craft-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="collection" size="md" /> {t("ui.craft")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="craft-tabs">
          <button
            className={`craft-tab ${activeTab === "craft" ? "active" : ""}`}
            onClick={() => setActiveTab("craft")}
          >
            <Icon name="collection" size="sm" />
            {t("ui.craftItems")}
          </button>
          <button className={`craft-tab ${activeTab === "use" ? "active" : ""}`} onClick={() => setActiveTab("use")}>
            <Icon name="potion" size="sm" />
            {t("ui.useItems")}
          </button>
        </div>

        <div className="panel-content">
          {activeTab === "craft" ? (
            <>
              {/* Фильтры в стиле коллекции */}
              <div className="craft-filters">
                <button
                  className={`craft-filter-btn ${craftFilter === "all" ? "active" : ""}`}
                  onClick={() => setCraftFilter("all")}
                >
                  <Icon name="all" size="sm" />
                  <span>{t("ui.all")}</span>
                </button>
                <button
                  className={`craft-filter-btn ${craftFilter === "potion" ? "active" : ""}`}
                  onClick={() => setCraftFilter("potion")}
                >
                  <Icon name="potion" size="sm" />
                  <span>{t("ui.potions")}</span>
                </button>
                <button
                  className={`craft-filter-btn ${craftFilter === "scroll" ? "active" : ""}`}
                  onClick={() => setCraftFilter("scroll")}
                >
                  <Icon name="scroll" size="sm" />
                  <span>{t("ui.scrolls")}</span>
                </button>
                <button
                  className={`craft-filter-btn ${craftFilter === "available" ? "active" : ""}`}
                  onClick={() => setCraftFilter("available")}
                >
                  <Icon name="check" size="sm" />
                  <span>{t("ui.available")}</span>
                </button>
              </div>

              {/* Список рецептов (скроллится вместе с панелью) */}
              <div className="craft-list">
                {filteredCraftItems.length === 0 ? (
                  <p className="empty-message">{t("ui.noItems")}</p>
                ) : (
                  filteredCraftItems.map((item) => (
                    <div
                      key={item.id}
                      className={`craft-item-card ${item.canCraft ? "can-craft" : "cannot-craft"} rarity-${item.rarity}`}
                      onClick={() => setSelectedCraftItem(item)}
                    >
                      <div className="craft-item-header">
                        <Icon name={item.icon} size="md" />
                        <span className="craft-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                          {t(`items.${item.nameKey}.name`)}
                        </span>
                        <span className={`craft-status ${item.canCraft ? "ready" : "locked"}`}>
                          {item.canCraft ? "✓" : "✕"}
                        </span>
                      </div>
                      <p className="craft-item-desc">
                        {t(item.descriptionKey).replace("{{level}}", currentLevel.toString())}
                      </p>
                      <div className="craft-ingredients">
                        {item.ingredients.map((ing) => {
                          const has = inventory.getItemCount(ing.itemId);
                          const needed = ing.count;
                          const template = INVENTORY_ITEMS[ing.itemId];
                          return (
                            <div key={ing.itemId} className={`ingredient ${has >= needed ? "has" : "missing"}`}>
                              <Icon name={template?.icon || "unknown"} size="sm" />
                              <span>
                                {has}/{needed} {t(`items.${template?.nameKey || ing.itemId}.name`)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {item.effect && (
                        <div className="craft-effect">
                          <Icon name="upgrades" size="sm" />
                          <span>
                            {item.effect.type === "level_down_10" && "-10 " + t("ui.levels")}
                            {item.effect.type === "level_down_20" && "-20 " + t("ui.levels")}
                            {item.effect.type === "level_down_50" && "-50 " + t("ui.levels")}
                            {item.effect.type === "exp" && `+${item.effect.value} EXP`}
                            {item.effect.type === "affection" && `+${item.effect.value} ${t("ui.affection")}`}
                            {item.effect.type === "heal" && `+${item.effect.value} HP`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="use-items-list">
              {consumableItems.length === 0 ? (
                <p className="empty-message">{t("ui.noConsumables")}</p>
              ) : (
                consumableItems.map((item) => (
                  <div key={item.id} className={`use-item-card rarity-${item.rarity}`}>
                    <div className="use-item-info">
                      <Icon name={item.icon} size="md" />
                      <div>
                        <span className="use-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                          {t(`items.${item.nameKey}.name`)}
                        </span>
                        <span className="use-item-count">x{item.count}</span>
                        <p className="use-item-desc">{t(`items.${item.nameKey}.desc`)}</p>
                      </div>
                    </div>
                    <button
                      className="btn-use"
                      onClick={() => onUseItem(item.id)}
                      disabled={item.effect?.target === "selected_waifu" && !selectedWaifuId}
                    >
                      {t("ui.use")}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedCraftItem && (
          <div className="craft-modal-overlay" onClick={() => setSelectedCraftItem(null)}>
            <div className="craft-modal" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: RARITY_COLORS[selectedCraftItem.rarity] }}>
                {t(`items.${selectedCraftItem.nameKey}.name`)}
              </h3>
              <p>{t(selectedCraftItem.descriptionKey).replace("{{level}}", currentLevel.toString())}</p>
              <div className="craft-modal-ingredients">
                <h4>{t("ui.requiredMaterials")}</h4>
                {selectedCraftItem.ingredients.map((ing) => {
                  const has = inventory.getItemCount(ing.itemId);
                  const needed = ing.count;
                  const template = INVENTORY_ITEMS[ing.itemId];
                  return (
                    <div key={ing.itemId} className={`modal-ingredient ${has >= needed ? "has" : "missing"}`}>
                      <Icon name={template?.icon || "unknown"} size="md" />
                      <span>{t(`items.${template?.nameKey || ing.itemId}.name`)}</span>
                      <span className="ingredient-count">
                        {has}/{needed}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="craft-modal-actions">
                <button className="btn-secondary" onClick={() => setSelectedCraftItem(null)}>
                  {t("ui.cancel")}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleCraft(selectedCraftItem)}
                  disabled={
                    !selectedCraftItem.ingredients.every((ing) => inventory.getItemCount(ing.itemId) >= ing.count)
                  }
                >
                  {t("ui.craft")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
