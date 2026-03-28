import { memo, useState } from "react";
import { t } from "../../../../locales/i18n";
import { testWaifus, RARITY_COLORS, RARITY_KEYS } from "../../../../game/constant";
import type { Waifu } from "../../../../classes/Waifu";
import { ELEMENT_KEYS } from "../../../../game/constant";
import type { TRarity, TWaifu } from "../../../../types";

import "./DropPoolPanel.css";
import { Icon } from "../../../Icon/Icon";

interface DropPoolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ownedWaifus: Waifu[];
}

const rarities: TRarity[] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

const GROUPED_WAIFUS = rarities.reduce(
  (acc, rarity) => {
    acc[rarity] = testWaifus.filter((w) => w.rarity === rarity);
    return acc;
  },
  {} as Record<TRarity, TWaifu[]>,
);

export const DropPoolPanel = memo(({ isOpen, onClose, ownedWaifus }: DropPoolPanelProps) => {
  const [selectedRarity, setSelectedRarity] = useState<TRarity | "all">("all");

  if (!isOpen) return null;

  const getWaifuStatus = (waifuId: string) => {
    const owned = ownedWaifus.find((w) => w.id === waifuId);
    return {
      isOwned: !!owned,
      count: owned?.duplicateCount || 0,
      max: 20,
    };
  };

  const displayedRarities = selectedRarity === "all" ? rarities : [selectedRarity];

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel drop-pool-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="pool" size="md" /> {t("ui.dropPool")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rarity-filter-tabs">
          <button
            className={`rarity-tab ${selectedRarity === "all" ? "active" : ""}`}
            onClick={() => setSelectedRarity("all")}
          >
            {t("ui.all")}
          </button>
          {rarities.map((rarity) => (
            <button
              key={rarity}
              className={`rarity-tab ${selectedRarity === rarity ? "active" : ""} rarity-${rarity}`}
              onClick={() => setSelectedRarity(rarity)}
              style={{
                borderColor: RARITY_COLORS[rarity],
                color: selectedRarity === rarity ? RARITY_COLORS[rarity] : undefined,
              }}
            >
              {t(`ui.${RARITY_KEYS[rarity]}`)}
            </button>
          ))}
        </div>

        <div className="drop-pool-content">
          {displayedRarities.map((rarity) => (
            <div key={rarity} className="rarity-section">
              <h3 className="rarity-title" style={{ color: RARITY_COLORS[rarity] }}>
                {t(`ui.${RARITY_KEYS[rarity]}`)} <Icon name={rarity} size="sm" />
              </h3>

              <div className="waifu-grid">
                {GROUPED_WAIFUS[rarity].map((template) => {
                  const status = getWaifuStatus(template.id);

                  return (
                    <div key={template.id} className={`pool-waifu-card ${status.isOwned ? "owned" : "locked"}`}>
                      <div className="pool-waifu-image-container">
                        {status.isOwned ? (
                          <img
                            src={template.image}
                            alt={t(`waifus.names.${template.nameKey}`)}
                            className="pool-waifu-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/images/waifus/default.png";
                            }}
                          />
                        ) : (
                          <div className="pool-waifu-unknown">
                            <span className="unknown-icon">❓</span>
                          </div>
                        )}

                        <div className="pool-waifu-element">
                          <Icon name={template.element} size="sm" />
                        </div>

                        {status.isOwned && (
                          <div className="duplicate-counter">
                            <span className="dup-count">{status.count}</span>
                            <span className="dup-separator">/</span>
                            <span className="dup-max">{status.max}</span>
                          </div>
                        )}
                      </div>

                      <div className="pool-waifu-info">
                        <span className="pool-waifu-name">
                          {status.isOwned ? t(`waifus.names.${template.nameKey}`) : "???"}
                        </span>

                        {status.isOwned && (
                          <div className="pool-waifu-stats">
                            <small>
                              <Icon name="click" size="sm" />{" "}
                              {Math.floor(template.clickPower * (1 + status.count * 0.3))}
                            </small>
                            <small>
                              <Icon name="auto" size="sm" /> {Math.floor(template.autoClick * (1 + status.count * 0.3))}
                            </small>
                          </div>
                        )}

                        {status.isOwned && status.count >= 20 && (
                          <div className="maxed-badge">
                            <Icon name="max" size="sm" /> {t("ui.max")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="drop-pool-footer">
          <p className="drop-hint">{t("ui.dropPoolHint")}</p>
        </div>
      </div>
    </div>
  );
});
