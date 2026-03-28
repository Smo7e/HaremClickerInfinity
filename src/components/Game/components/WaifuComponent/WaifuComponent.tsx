import { Waifu } from "../../../../classes/Waifu";
import { RARITY_COLORS, ELEMENT_KEYS } from "../../../../game/constant";
import "./WaifuComponent.css";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";

interface WaifuComponentProps {
  waifu: Waifu;
}

export function WaifuComponent({ waifu }: WaifuComponentProps) {
  const rarityColor = RARITY_COLORS[waifu.rarity];

  return (
    <div className="waifu-component">
      <div className="waifu-portrait-container">
        <img
          src={waifu.image}
          alt={waifu.name}
          className="waifu-portrait"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/waifus/placeholder.png";
          }}
        />
        <div className="waifu-element-icon">
          <Icon name={waifu.element} size="md" />
        </div>
      </div>

      <div className="waifu-info-battle">
        <h3 className="waifu-name-battle" style={{ color: rarityColor }}>
          {waifu.name}
        </h3>

        <div className="waifu-stats-battle">
          <span className="waifu-level">
            <Icon name="level" size="sm" /> {t("ui.level")}.{waifu.stats.level}
          </span>
          <span className="waifu-click-power">
            <Icon name="click" size="sm" /> {waifu.getClickPower()}
          </span>
        </div>
      </div>
    </div>
  );
}
