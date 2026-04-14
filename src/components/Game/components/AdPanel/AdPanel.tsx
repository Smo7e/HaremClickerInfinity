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
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AdPanel({ isOpen, onClose }: AdPanelProps) {
  const [watching, setWatching] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, number>>({});

  const isRewardAvailable = useAdStore((state) => state.isRewardAvailable);
  const getCooldownSeconds = useAdStore((state) => state.getCooldownSeconds);
  const applyReward = useAdStore((state) => state.applyReward);

  // Обновление таймеров каждую секунду
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const newTimers: Record<string, number> = {};
      AD_REWARD_LIST.forEach((type) => {
        newTimers[type] = getCooldownSeconds(type);
      });
      setTimers(newTimers);
    }, 1000);

    // Первый запуск
    const initialTimers: Record<string, number> = {};
    AD_REWARD_LIST.forEach((type) => {
      initialTimers[type] = getCooldownSeconds(type);
    });
    setTimers(initialTimers);

    return () => clearInterval(interval);
  }, [isOpen, getCooldownSeconds]);

  const handleWatchAd = useCallback(
    (type: string) => {
      if (!isRewardAvailable(type as any)) return;

      setWatching(type);
      adService.showRewardedAd((success) => {
        setWatching(null);
        if (success) {
          applyReward(type as any);
          // Обновим таймеры сразу
          const newTimers: Record<string, number> = {};
          AD_REWARD_LIST.forEach((t) => {
            newTimers[t] = getCooldownSeconds(t);
          });
          setTimers(newTimers);
        }
      });
    },
    [isRewardAvailable, applyReward, getCooldownSeconds],
  );

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel ad-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="play" size="md" /> {t("ads.title")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="ad-rewards-grid">
          {AD_REWARD_LIST.map((type) => {
            const config = AD_REWARDS[type];
            if (!config) return null; // Защита от undefined

            const cooldown = timers[type] || 0;
            const available = cooldown <= 0 && !watching;
            const isBuff = !!config.durationSeconds;

            return (
              <div key={type} className={`ad-reward-card ${!available ? "cooldown" : ""} ${isBuff ? "buff" : ""}`}>
                <div className="reward-icon">
                  <Icon name={config.icon} size="lg" />
                  {isBuff && <span className="buff-badge">2x</span>}
                </div>

                <div className="reward-info">
                  <h3>{t(config.titleKey)}</h3>
                  <p>{t(config.descriptionKey)}</p>

                  {isBuff && (
                    <span className="duration-badge">
                      {t("ads.duration")}: 5 {t("ui.minutes")}
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
                    <button className="btn-watch-ad" onClick={() => handleWatchAd(type)} disabled={watching === type}>
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

        <div className="ad-footer">
          <p>{t("ads.hint")}</p>
        </div>
      </div>
    </div>
  );
}
