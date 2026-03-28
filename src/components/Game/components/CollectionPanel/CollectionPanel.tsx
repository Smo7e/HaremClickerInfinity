// src/components/Game/components/CollectionPanel/CollectionPanel.tsx
import { useState } from "react";
import { t } from "../../../../locales/i18n";
import type { TRarity } from "../../../../types";

import "./CollectionPanel.css";
import { Icon } from "../../../Icon/Icon";

export interface CollectionItem {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  rarity: TRarity;
  obtained: boolean;
  category: "weapon" | "accessory" | "memoria" | "outfit";
  bonus?: string;
}

interface CollectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CollectionItem[];
}

export function CollectionPanel({ isOpen, onClose, items }: CollectionPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", name: t("ui.all"), icon: "all" },
    { id: "weapon", name: t("collection.weapons"), icon: "weapon" },
    {
      id: "accessory",
      name: t("collection.accessories"),
      icon: "accessory",
    },
    { id: "memoria", name: t("collection.memoria"), icon: "memoria" },
    { id: "outfit", name: t("collection.outfits"), icon: "outfit" },
  ];

  const filteredItems = selectedCategory === "all" ? items : items.filter((item) => item.category === selectedCategory);

  const obtainedCount = items.filter((item) => item.obtained).length;

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel collection-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2> {t("ui.collection")}</h2>
          <div className="collection-progress">
            {obtainedCount} / {items.length}
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
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon name={cat.icon} size="md" />

              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="collection-grid">
          {filteredItems.length === 0 ? (
            <p className="empty-message">{t("ui.noItems")}</p>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`collection-item ${item.obtained ? "obtained" : "locked"} rarity-${item.rarity}`}
              >
                <div className="item-icon">
                  {item.obtained ? <Icon name={item.icon} size="lg" /> : <Icon name="unknown" size="lg" />}
                </div>
                <div className="item-info">
                  <span className="item-name">{item.obtained ? t(`items.${item.nameKey}.name`) : "???"}</span>
                  {item.obtained && (
                    <>
                      <span className="item-desc">{t(`items.${item.nameKey}.desc`)}</span>
                      {item.bonus && <span className="item-bonus">+{item.bonus}</span>}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
