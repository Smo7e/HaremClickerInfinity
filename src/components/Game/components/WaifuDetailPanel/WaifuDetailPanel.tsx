import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { RARITY_COLORS, ELEMENT_ICONS } from "../../../../game/constant";
import "./WaifuDetailPanel.css";

interface WaifuDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  waifu: Waifu | null;
}

export function WaifuDetailPanel({ isOpen, onClose, waifu }: WaifuDetailPanelProps) {
  if (!isOpen || !waifu) return null;

  const rarityColor = RARITY_COLORS[waifu.rarity];

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel waifu-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2 style={{ color: rarityColor }}>{waifu.name}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="panel-content waifu-detail-content">
          <div className="waifu-detail-portrait">
            <img src={waifu.image} alt={waifu.name} style={{ borderColor: rarityColor }} />
            <div className="waifu-detail-element" title={waifu.element}>
              {ELEMENT_ICONS[waifu.element]}
            </div>
            <div className="waifu-detail-rarity" style={{ color: rarityColor }}>
              {waifu.rarity.toUpperCase()}
            </div>
          </div>

          <div className="waifu-detail-info">
            <p className="waifu-description">{t(waifu.description)}</p>

            <div className="waifu-stats-detail">
              <div className="stat-row-detail">
                <span className="stat-label">⭐ {t("level")}</span>
                <span className="stat-value">{waifu.stats.level}</span>
              </div>

              <div className="exp-bar-detail">
                <div
                  className="exp-fill-detail"
                  style={{ width: `${(waifu.stats.exp / waifu.stats.expToNext) * 100}%` }}
                />
                <span className="exp-text">
                  {waifu.stats.exp} / {waifu.stats.expToNext} XP
                </span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">💕 {t("affection") || "Привязанность"}</span>
                <span className="stat-value">{waifu.stats.affection}</span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">👆 {t("click")}</span>
                <span className="stat-value">{waifu.getClickPower()}</span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">⚙️ {t("auto")}</span>
                <span className="stat-value">{waifu.getAutoClick()}/s</span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">🎯 {t("critChance") || "Шанс крита"}</span>
                <span className="stat-value">{(waifu.getCritChance() * 100).toFixed(1)}%</span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">💥 {t("critPower") || "Сила крита"}</span>
                <span className="stat-value">{waifu.getCritMultiplier().toFixed(1)}x</span>
              </div>

              <div className="stat-row-detail">
                <span className="stat-label">🎭 {t("outfits") || "Наряды"}</span>
                <span className="stat-value">{waifu.unlockedOutfits.length}</span>
              </div>
            </div>

            <div className="waifu-stats-total">
              <h4>{t("totalStats") || "Всего нанесено урона"}</h4>
              <p>
                👆 {waifu.stats.clicksGenerated} {t("clicks") || "кликов"}
              </p>
              <p>
                ⚔️ {waifu.stats.totalDamage} {t("damage") || "урона"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
