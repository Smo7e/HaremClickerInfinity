import { useState, useMemo, useCallback, useEffect } from "react";
import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import { INVENTORY_ITEMS, RARITY_COLORS } from "../../../../game/constant";
import type { TInventoryItem, TInventoryItemId, TRarity } from "../../../../types";
import { Icon } from "../../../Icon/Icon";
import "./CraftPanel.css";

export type TCraftableItem = TInventoryItem & {
  canCraft: true;
  ingredients: Array<{
    itemId: string;
    count: number;
  }>;
};

interface CraftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCraft: (item: TCraftableItem, quantity: number) => void;
  onUseItem: (itemId: TInventoryItemId) => void;
  selectedWaifuId?: string;
}

type CraftTab = "craft" | "use";
type CraftFilter = "all" | "potion" | "scroll" | "available";
const rarityOrder: TRarity[] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

export function CraftPanel({ isOpen, onClose, onCraft, onUseItem, selectedWaifuId }: CraftPanelProps) {
  const [activeTab, setActiveTab] = useState<CraftTab>("craft");
  const [selectedCraftItem, setSelectedCraftItem] = useState<TCraftableItem | null>(null);
  const [craftQuantity, setCraftQuantity] = useState(1);
  const [craftFilter, setCraftFilter] = useState<CraftFilter>("all");
  const inventory = useGameStore((state) => state.inventory);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const locationProgress = useGameStore((state) => state.locationProgress);
  const currentLevel = locationProgress[currentLocation]?.currentLevel ?? 1;

  // Получаем все крафтовые предметы
  const craftableItems = useMemo(() => {
    const items = Object.values(INVENTORY_ITEMS)
      .filter((item): item is TCraftableItem => item.canCraft === true && !!item.ingredients)
      .sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));

    return items.map((item) => {
      const canCraft = item.ingredients.every((ing) => inventory.getItemCount(ing.itemId) >= ing.count);
      return { ...item, canCraft };
    });
  }, [inventory]);

  const consumableItems = useMemo(() => {
    return inventory.getItemsByType("consumable");
  }, [inventory]);

  // Фильтрация
  const filteredCraftItems = useMemo(() => {
    return craftableItems.filter((item) => {
      if (craftFilter === "available") return item.canCraft;
      if (craftFilter === "potion") return item.id.includes("potion") || item.icon.includes("potion");
      if (craftFilter === "scroll") return item.id.includes("scroll") || item.icon.includes("scroll");
      return true;
    });
  }, [craftableItems, craftFilter]);

  // Расчет максимального количества для крафта
  const getMaxCraftable = useCallback(
    (item: TCraftableItem) => {
      if (!item.ingredients || item.ingredients.length === 0) return 99;

      const maxStack = item.maxStack || 1;
      const currentCount = inventory.getItemCount(item.id);
      const canFit = Math.max(0, maxStack - currentCount);

      let max = Infinity;
      for (const ing of item.ingredients) {
        const has = inventory.getItemCount(ing.itemId);
        const possible = Math.floor(has / ing.count);
        if (possible < max) max = possible;
      }

      return Math.max(0, Math.min(max, canFit));
    },
    [inventory],
  );

  // Сбрасываем количество при открытии модалки
  useEffect(() => {
    if (selectedCraftItem) {
      setCraftQuantity(1);
    }
  }, [selectedCraftItem?.id]);

  const handleCraftClick = useCallback(() => {
    if (!selectedCraftItem) return;
    onCraft(selectedCraftItem, craftQuantity);
    setSelectedCraftItem(null);
    setCraftQuantity(1);
  }, [selectedCraftItem, craftQuantity, onCraft]);

  // Проверка возможности крафта выбранного количества
  const canCraftAmount = useMemo(() => {
    if (!selectedCraftItem) return false;
    return selectedCraftItem.ingredients.every((ing) => {
      const has = inventory.getItemCount(ing.itemId);
      return has >= ing.count * craftQuantity;
    });
  }, [selectedCraftItem, craftQuantity, inventory]);

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

              <div className="craft-list">
                {filteredCraftItems.length === 0 ? (
                  <p className="empty-message">{t("ui.noItems")}</p>
                ) : (
                  filteredCraftItems.map((item) => {
                    const maxAmount = getMaxCraftable(item as TCraftableItem);
                    return (
                      <div
                        key={item.id}
                        className={`craft-item-card ${maxAmount > 0 ? "can-craft" : "cannot-craft"} rarity-${item.rarity}`}
                        onClick={() => setSelectedCraftItem(item as TCraftableItem)}
                      >
                        <div className="craft-item-header">
                          <Icon name={item.icon} size="md" />
                          <span className="craft-item-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                            {t(`items.${item.nameKey}.name`)}
                          </span>
                          <span className={`craft-status ${maxAmount > 0 ? "ready" : "locked"}`}>
                            {maxAmount > 0 ? "✓" : "✕"}
                          </span>
                        </div>
                        <p className="craft-item-desc">
                          {t(item.descriptionKey).replace("{{value}}", item.effect?.value.toString() || "0") +
                            ` (${inventory.getItemCount(item.id)})`}
                        </p>
                        <div className="craft-ingredients">
                          {item.ingredients.map((ing) => {
                            const has = inventory.getItemCount(ing.itemId);
                            const template = INVENTORY_ITEMS[ing.itemId];
                            return (
                              <div key={ing.itemId} className={`ingredient ${has >= ing.count ? "has" : "missing"}`}>
                                <Icon name={template?.icon || "unknown"} size="sm" />
                                <span>
                                  {has}/{ing.count} {t(`items.${template?.nameKey || ing.itemId}.name`)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {item.effect && (
                          <div className="craft-effect">
                            {item.effect.type === "level_down" && <Icon name="scroll" size="sm" />}
                            {item.effect.type === "exp" && <Icon name="exp" size="sm" />}
                            {item.effect.type === "affection" && <Icon name="affection" size="sm" />}
                            <span>
                              {item.effect.type === "level_down" && -item.effect.value + " " + t("ui.levels")}
                              {item.effect.type === "exp" && `+${item.effect.value} EXP`}
                              {item.effect.type === "affection" && `+${item.effect.value} ${t("ui.affection")}`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
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
                        <p className="use-item-desc">
                          {t(`items.${item.nameKey}.desc`) +
                            (item.effect?.type === "level_down" ? ` (${currentLevel.toString()})` : "")}
                        </p>
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

              <div className="craft-quantity-selector">
                <label>{t("ui.quantity") || "Количество"}:</label>
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() => setCraftQuantity((q) => Math.max(1, q - 1))}
                    disabled={craftQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max={getMaxCraftable(selectedCraftItem)}
                    value={craftQuantity}
                    onChange={(e) => setCraftQuantity(Number(e.target.value))}
                    className="craft-quantity-slider"
                  />
                  <button
                    className="qty-btn"
                    onClick={() => setCraftQuantity((q) => Math.min(getMaxCraftable(selectedCraftItem), q + 1))}
                    disabled={craftQuantity >= getMaxCraftable(selectedCraftItem)}
                  >
                    +
                  </button>
                  <span className="quantity-value">{craftQuantity}</span>
                </div>
                <small className="max-craft-hint">
                  {t("ui.maxAvailable") || "Максимум"}: {getMaxCraftable(selectedCraftItem)}
                </small>
              </div>

              <div className="craft-modal-ingredients">
                <h4>{t("ui.requiredMaterials")}</h4>
                {selectedCraftItem.ingredients.map((ing) => {
                  const has = inventory.getItemCount(ing.itemId);
                  const needed = ing.count * craftQuantity;
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
                <button className="btn-primary" onClick={handleCraftClick} disabled={!canCraftAmount}>
                  {t("ui.craft")} {craftQuantity > 1 ? `x${craftQuantity}` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
