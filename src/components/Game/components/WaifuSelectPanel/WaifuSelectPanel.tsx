import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";

import "./WaifuSelectPanel.css";
import { RARITY_COLORS } from "../../../../game/constant";
import { Icon } from "../../../Icon/Icon";

interface WaifuSelectPanelProps {
  isOpen: boolean;
  waifus: Waifu[];
  activeWaifu: Waifu | null;

  onClose: () => void;
  onSelect: (waifu: Waifu) => void;
}

export function WaifuSelectPanel({ isOpen, onClose, waifus, activeWaifu, onSelect }: WaifuSelectPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel waifu-select-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>{t("ui.selectWaifu")}</h2>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="waifu-list">
          {waifus.length === 0 ? (
            <p className="empty-message">{t("ui.noWaifus")}</p>
          ) : (
            waifus.map((waifu) => (
              <button
                key={waifu.id}
                className={`waifu-card ${activeWaifu?.id === waifu.id ? "active" : ""}`}
                style={{ borderColor: activeWaifu?.id === waifu.id ? undefined : RARITY_COLORS[waifu.rarity] }}
                onClick={() => {
                  onSelect(waifu);
                  onClose();
                }}
              >
                <div className="waifu-card-portrait">
                  <img
                    src={waifu.image}
                    alt={waifu.name}
                    style={{
                      borderColor: RARITY_COLORS[waifu.rarity],
                    }}
                  />
                  <span className="waifu-element">
                    <Icon name={waifu.element} size="sm" />
                  </span>
                </div>

                <div className="waifu-card-info">
                  <span className="waifu-name" style={{ color: RARITY_COLORS[waifu.rarity] }}>
                    {waifu.name}
                  </span>
                  <span className="waifu-lvl">
                    {t("ui.level")}.{waifu.stats.level}
                  </span>
                  <div className="waifu-stats-row">
                    <small>
                      <Icon name="click" size="sm" /> {waifu.getClickPower()}
                    </small>
                    <small>
                      <Icon name="auto" size="sm" /> {waifu.getClickPower()}
                    </small>
                  </div>
                </div>

                {activeWaifu?.id === waifu.id && <span className="active-badge">✓</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
