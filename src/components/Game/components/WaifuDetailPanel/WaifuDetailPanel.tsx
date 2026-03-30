import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { RARITY_COLORS, ELEMENT_KEYS, RARITY_KEYS } from "../../../../game/constant";
import "./WaifuDetailPanel.css";
import { Icon } from "../../../Icon/Icon";

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
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="waifu-detail-content">
          {/* ПОРТРЕТ ВАЙФУ - добавлен обратно */}
          <div className="waifu-detail-portrait">
            <img
              src={waifu.image}
              alt={waifu.name}
              style={{ borderColor: rarityColor }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/images/waifus/default.png";
              }}
            />
            {/* ИКОНКА ЭЛЕМЕНТА - теперь правильно позиционирована относительно портрета */}
            <div className="waifu-detail-element">
              <Icon name={waifu.element} size="lg" />
            </div>
          </div>

          {/* РЕДКОСТЬ */}
          <div className="waifu-detail-rarity" style={{ color: rarityColor, borderColor: rarityColor }}>
            <Icon name={waifu.rarity} size="sm" />
            {t(`ui.${RARITY_KEYS[waifu.rarity]}`).toUpperCase()}
          </div>

          {/* ОПИСАНИЕ - добавлено */}
          <p className="waifu-description">{t(waifu.description as any)}</p>

          {/* СТАТИСТИКА */}
          <div className="waifu-stats-detail">
            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="level" size="sm" /> {t("ui.level")}
              </span>
              <span className="stat-value">{waifu.stats.level}</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="affection" size="sm" /> {t("ui.affection")}
              </span>
              <span className="stat-value">{waifu.stats.affection}</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="click" size="sm" /> {t("ui.click")}
              </span>
              <span className="stat-value">{waifu.getClickPower()}</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="auto" size="sm" /> {t("ui.auto")}
              </span>
              <span className="stat-value">{waifu.getClickPower()}/s</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="crit" size="sm" /> {t("ui.critChance")}
              </span>
              <span className="stat-value">{(waifu.getCritChance() * 100).toFixed(1)}%</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="critPower" size="sm" /> {t("ui.critPower")}
              </span>
              <span className="stat-value">{waifu.getCritMultiplier().toFixed(1)}x</span>
            </div>

            <div className="stat-row-detail">
              <span className="stat-label">
                <Icon name="outfit" size="sm" /> {t("ui.outfits")}
              </span>
              <span className="stat-value">{waifu.unlockedOutfits.length}</span>
            </div>
          </div>

          {/* ОБЩАЯ СТАТИСТИКА */}
          <div className="waifu-stats-total">
            <h4>{t("ui.totalStats")}</h4>
            <p>
              <Icon name="click" size="sm" /> {waifu.stats.clicksGenerated} {t("ui.clicks")}
            </p>
            <p>
              <Icon name="damage" size="sm" /> {waifu.stats.totalDamage} {t("ui.damage")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
