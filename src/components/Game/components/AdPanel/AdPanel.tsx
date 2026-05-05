// src/components/Game/components/AdPanel/AdPanel.tsx
import { useState, useEffect, useCallback } from "react";
import { useAdStore } from "../../../../store/adStore";
import { adService } from "../../../../services/AdService";
import { AD_REWARDS, AD_REWARD_LIST } from "../../../../game/adConstants";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import "./AdPanel.css";

interface AdPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AdPanel({ isOpen, onClose }: AdPanelProps) {
  const [watching, setWatching] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, number>>({});

  const isRewardAvailable = useAdStore((state) => state.isRewardAvailable);
  const getCooldownSeconds = useAdStore((state) => state.getCooldownSeconds);
  const getBuffRemainingSeconds = useAdStore((state) => state.getBuffRemainingSeconds);
  const applyReward = useAdStore((state) => state.applyReward);
  const tick = useAdStore((state) => state.tick);
  const setAdPlaying = useAdStore((state) => state.setAdPlaying);
  const activeBuffs = useAdStore((state) => state.activeBuffs);

  useEffect(() => {
    const interval = window.setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTimers = () => {
      const newTimers: Record<string, number> = {};
      AD_REWARD_LIST.forEach((type) => {
        newTimers[type] = getCooldownSeconds(type);
      });

      if (activeBuffs.damage) {
        newTimers["buff_damage"] = getBuffRemainingSeconds("damage");
      }
      if (activeBuffs.drop) {
        newTimers["buff_drop"] = getBuffRemainingSeconds("drop");
      }

      setTimers(newTimers);
    };

    updateTimers();
    const displayInterval = window.setInterval(updateTimers, 500);

    return () => clearInterval(displayInterval);
  }, [isOpen, getCooldownSeconds, getBuffRemainingSeconds, activeBuffs]);

  const handleWatchAd = useCallback(
    (type: string) => {
      if (!isRewardAvailable(type as any)) return;

      setWatching(type);
      setAdPlaying(true); // Таймеры остановятся

      adService.showRewardedAd((success) => {
        setWatching(null);
        setAdPlaying(false); // Таймеры продолжат

        if (success) {
          applyReward(type as any);
          const newTimers: Record<string, number> = {};
          AD_REWARD_LIST.forEach((t) => {
            newTimers[t] = getCooldownSeconds(t);
          });
          setTimers(newTimers);
        }
      });
    },
    [isRewardAvailable, applyReward, getCooldownSeconds, setAdPlaying],
  );

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel bonus-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="play" size="md" /> {t("ads.title")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        {/* Индикаторы активных баффов */}
        {(activeBuffs.damage || activeBuffs.drop) && (
          <div className="active-buffs-bar">
            {activeBuffs.damage && (
              <div className="buff-indicator damage-buff">
                <Icon name="crit" size="sm" />
                <span>2x {t("ui.damage")}</span>
                <span className="buff-timer">{formatTime(timers["buff_damage"] || 0)}</span>
              </div>
            )}
            {activeBuffs.drop && (
              <div className="buff-indicator drop-buff">
                <Icon name="collection" size="sm" />
                <span>2x {t("ui.ads")}</span>
                <span className="buff-timer">{formatTime(timers["buff_drop"] || 0)}</span>
              </div>
            )}
          </div>
        )}

        <div className="bonus-rewards-grid">
          {AD_REWARD_LIST.map((type) => {
            const config = AD_REWARDS[type];
            if (!config) return null;

            const cooldown = timers[type] || 0;
            const available = cooldown <= 0 && !watching;
            const isBuff = !!config.durationSeconds;

            return (
              <div key={type} className={`bonus-reward-card ${!available ? "cooldown" : ""} ${isBuff ? "buff" : ""}`}>
                <div className="reward-icon">
                  <Icon name={config.icon} size="lg" />
                  {isBuff && <span className="buff-badge">2x</span>}
                </div>

                <div className="reward-info">
                  <h3>{t(config.titleKey)}</h3>
                  <p>{t(config.descriptionKey)}</p>

                  {isBuff && (
                    <span className="duration-badge">
                      {t("ads.duration")}: {Math.floor((config.durationSeconds || 300) / 60)} {t("ui.minutes")}
                    </span>
                  )}
                </div>

                <div className="reward-action">
                  {!available ? (
                    <div className="cooldown-timer">
                      <Icon name="pause" size="sm" />
                      <span>{formatTime(cooldown)}</span>
                    </div>
                  ) : (
                    <button
                      className="btn-watch-bonus"
                      onClick={() => handleWatchAd(type)}
                      disabled={watching === type}
                    >
                      {watching === type ? (
                        <span className="loading-dots">{t("ads.loading")}</span>
                      ) : (
                        <>
                          <Icon name="play" size="sm" />
                          {t("ads.watch")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bonus-footer">
          <p>{t("ads.hint")}</p>
        </div>
      </div>
    </div>
  );
}
