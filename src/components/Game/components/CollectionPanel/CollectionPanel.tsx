import { useState, useMemo } from "react";
import { t } from "../../../../locales/i18n";
import type { TCollectionCategory, TInventoryItemId } from "../../../../types";
import { COLLECTION_BUFFS, INVENTORY_ITEMS } from "../../../../game/constant";
import "./CollectionPanel.css";
import { Icon } from "../../../Icon/Icon";
import { useGameStore } from "../../../../store/gameStore";

interface CollectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionPanel({ isOpen, onClose }: CollectionPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<TCollectionCategory | "all">("all");

  // Получаем inventory напрямую, а не через useShallow
  const inventory = useGameStore((state) => state.inventory);

  const collectedItems = useMemo(() => {
    const entries = Array.from(inventory.getCollection().entries());
    return entries.map(([id, category]) => {
      const template = INVENTORY_ITEMS[id as TInventoryItemId];
      return {
        id,
        category,
        nameKey: template?.nameKey || id,
        descriptionKey: template?.descriptionKey || "",
        icon: template?.icon || "unknown",
        rarity: template?.rarity || "common",
      };
    });
  }, [inventory]);

  const getItemBuff = (itemId: TInventoryItemId) => {
    return COLLECTION_BUFFS[itemId];
  };

  const categories = [
    { id: "all", name: t("ui.all"), icon: "all" },
    { id: "weapon", name: t("collection.weapons"), icon: "weapon" },
    { id: "accessory", name: t("collection.accessories"), icon: "accessory" },
    { id: "memoria", name: t("collection.memoria"), icon: "memoria" },
    { id: "outfit", name: t("collection.outfits"), icon: "outfit" },
  ] as const;

  const filteredItems =
    selectedCategory === "all" ? collectedItems : collectedItems.filter((item) => item.category === selectedCategory);

  const counts = useMemo(() => {
    const total = collectedItems.length;
    const byCategory = {
      weapon: collectedItems.filter((i) => i.category === "weapon").length,
      accessory: collectedItems.filter((i) => i.category === "accessory").length,
      memoria: collectedItems.filter((i) => i.category === "memoria").length,
      outfit: collectedItems.filter((i) => i.category === "outfit").length,
    };
    return { total, byCategory };
  }, [collectedItems]);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel collection-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>{t("ui.collection")}</h2>
          <div className="collection-progress">
            {counts.total} {t("ui.items")}
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id as TCollectionCategory | "all")}
            >
              <Icon name={cat.icon} size="md" />
              <span>{cat.name}</span>
              {cat.id !== "all" && (
                <span className="category-count">{counts.byCategory[cat.id as TCollectionCategory] || 0}</span>
              )}
            </button>
          ))}
        </div>
        <div className="collection-scroll-content">
          <div className="collection-grid">
            {filteredItems.length === 0 ? (
              <div className="empty-collection">
                <Icon name="collection" size="lg" />
                <p>{t("ui.noCollectionItems")}</p>
                <small>{t("ui.killEnemiesForDrops")}</small>
              </div>
            ) : (
              filteredItems.map((item) => {
                const buff = getItemBuff(item.id as TInventoryItemId);
                return (
                  <div key={item.id} className={`collection-item obtained rarity-${item.rarity}`}>
                    <div className="item-icon">
                      <Icon name={item.icon} size="lg" />
                    </div>
                    <div className="item-info">
                      <span className="item-name">{t(`items.${item.nameKey}.name`)}</span>
                      <span className="item-desc">{t(`items.${item.nameKey}.desc`)}</span>
                      <span className="item-category">{t(`collection.${item.category}s`)}</span>
                      {buff && (
                        <span className="item-buff">
                          <Icon name="upgrades" size="sm" />
                          {t(buff.descriptionKey)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedCategory === "memoria" && counts.byCategory.memoria === 0 && (
            <div className="category-hint">
              <Icon name="memoria" size="md" />
              <p>{t("ui.memoriaHint")}</p>
              <small>{t("ui.buyInShop")}</small>
            </div>
          )}
          {selectedCategory === "outfit" && counts.byCategory.outfit === 0 && (
            <div className="category-hint">
              <Icon name="outfit" size="md" />
              <p>{t("ui.outfitHint")}</p>
              <small>{t("ui.buyInShop")}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
