import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import "./WaifuSelectPanel.css";
import { RARITY_COLORS } from "../../../../game/constant";
import { Icon } from "../../../Icon/Icon";
import { useShallow } from "zustand/shallow";

interface WaifuSelectPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (waifuId: string) => void;
}

export function WaifuSelectPanel({ isOpen, onClose, onSelect }: WaifuSelectPanelProps) {
  const { ownedWaifus, activeWaifuId } = useGameStore(
    useShallow((state) => ({
      ownedWaifus: state.ownedWaifus,
      activeWaifuId: state.activeWaifuId,
    })),
  );

  if (!isOpen) return null;

  const handleSelect = (waifuId: string) => {
    onSelect(waifuId);
  };

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
          {ownedWaifus.length === 0 ? (
            <p className="empty-message">{t("ui.noWaifus")}</p>
          ) : (
            ownedWaifus
              .sort((wA, wB) => {
                if (wA.id === activeWaifuId) return -1;
                if (wB.id === activeWaifuId) return 1;
                return wB.getClickPower() - wA.getClickPower();
              })
              .map((waifu) => (
                <button
                  key={waifu.id}
                  className={`waifu-card ${activeWaifuId === waifu.id ? "active" : ""}`}
                  style={{ borderColor: activeWaifuId === waifu.id ? undefined : RARITY_COLORS[waifu.rarity] }}
                  onClick={() => handleSelect(waifu.id)}
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
                        <Icon name="crit" size="sm" /> {(waifu.getCritChance() * 100).toFixed(0)}%
                      </small>
                    </div>
                  </div>
                  {activeWaifuId === waifu.id && <span className="active-badge">✓</span>}
                </button>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
