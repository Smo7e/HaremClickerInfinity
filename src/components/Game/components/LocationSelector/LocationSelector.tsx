import { t } from "../../../../locales/i18n";
import { LOCATIONS, LOCATION_UNLOCK_REQUIREMENTS } from "../../../../game/constant";
import type { TLocation } from "../../../../types";
import { Icon } from "../../../Icon/Icon";
import "./LocationSelector.css";

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: TLocation;
  locationProgress: Record<TLocation, { currentLevel: number; maxLevelReached: number; unlocked: boolean }>;
  onLocationChange: (location: TLocation) => void;
}

export function LocationSelector({
  isOpen,
  onClose,
  currentLocation,
  locationProgress,
  onLocationChange,
}: LocationSelectorProps) {
  if (!isOpen) return null;

  const formatBonus = (value: number) => (value >= 1 ? value.toFixed(1) : value.toFixed(2));

  const getUnlockRequirement = (locationId: TLocation) => {
    const req = LOCATION_UNLOCK_REQUIREMENTS[locationId];
    if (!req) return null;
    return {
      prevLocationName: t(`ui.locations.${req.prevLocation}`),
      killLevel: req.killLevel,
      currentMax: locationProgress[req.prevLocation].maxLevelReached,
    };
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel location-selector-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="pool" size="md" /> {t("ui.changeLocation")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="location-list">
          {LOCATIONS.map((loc) => {
            const progress = locationProgress[loc.id];
            const isUnlocked = progress.unlocked;
            const isCurrent = currentLocation === loc.id;
            const unlockReq = getUnlockRequirement(loc.id);

            return (
              <button
                key={loc.id}
                className={`location-card ${isCurrent ? "active" : ""} ${!isUnlocked ? "locked" : ""}`}
                onClick={() => {
                  if (isUnlocked && !isCurrent) {
                    onLocationChange(loc.id);
                  }
                }}
                disabled={!isUnlocked || isCurrent}
              >
                <div className="location-icon">
                  <Icon name={loc.id} size="lg" />
                </div>
                <div className="location-info">
                  <span className="location-name">{t(`ui.locations.${loc.id}`)}</span>

                  <div className="location-bonuses">
                    <span className="bonus-badge gem">💎 x{formatBonus(loc.bonuses.gemMultiplier)}</span>
                    <span className="bonus-badge essence">✨ x{formatBonus(loc.bonuses.essenceMultiplier)}</span>
                    <span className="bonus-badge exp">⭐ x{formatBonus(loc.bonuses.expMultiplier)}</span>
                  </div>
                </div>
                <div className="location-meta">
                  {isCurrent ? (
                    <span className="current-badge">{t("ui.active")}</span>
                  ) : isUnlocked ? (
                    <div className="progress-info">
                      <span className="level-badge">Lvl {progress.currentLevel}</span>
                      <span className="max-badge">Max {progress.maxLevelReached}</span>
                    </div>
                  ) : unlockReq ? (
                    <span className="lock-badge">
                      {t("ui.unlockRequirement")
                        .replace("{{location}}", unlockReq.prevLocationName)
                        .replace("{{level}}", unlockReq.killLevel.toString())}
                      <br />({unlockReq.currentMax}/{unlockReq.killLevel})
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
