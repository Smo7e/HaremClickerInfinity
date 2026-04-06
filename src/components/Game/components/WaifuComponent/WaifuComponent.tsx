import { useGameStore } from "../../../../store/gameStore";
import { RARITY_COLORS } from "../../../../game/constant";
import "./WaifuComponent.css";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import { useShallow } from "zustand/shallow";

export function WaifuComponent() {
  const { activeWaifuId, ownedWaifus } = useGameStore(
    useShallow((state) => ({
      activeWaifuId: state.activeWaifuId,
      ownedWaifus: state.ownedWaifus,
    })),
  );
  const activeWaifu = ownedWaifus.find((w) => w.id === activeWaifuId);

  if (!activeWaifu) return null;

  const rarityColor = RARITY_COLORS[activeWaifu.rarity];

  return (
    <div className="waifu-component">
      <div className="waifu-portrait-container">
        <img
          src={activeWaifu.image}
          alt={activeWaifu.name}
          className="waifu-portrait"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/waifus/placeholder.png";
          }}
        />
        <div className="waifu-element-icon">
          <Icon name={activeWaifu.element} size="md" />
        </div>
      </div>
      <div className="waifu-info-battle">
        <h3 className="waifu-name-battle" style={{ color: rarityColor }}>
          {activeWaifu.name}
        </h3>
        <div className="waifu-stats-battle">
          <span className="waifu-level">
            <Icon name="level" size="sm" /> {t("ui.level")}.{activeWaifu.stats.level}
          </span>
          <span className="waifu-click-power">
            <Icon name="click" size="sm" /> {activeWaifu.getClickPower()}
          </span>
        </div>
      </div>
    </div>
  );
}
