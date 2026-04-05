import { useEffect, useRef, useState } from "react";
import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { testWaifus, BASE_DROP_RATES, RARITY_COLORS, RARITY_KEYS } from "../../../../game/constant";
import type { TRarity } from "../../../../types";

import "./GachaPanel.css";
import { DropPoolPanel } from "./DropPoolPanel";
import { Icon } from "../../../Icon/Icon";

interface GachaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  essence: number;
  ownedWaifus: Waifu[];
  onSummon: (waifu: Waifu, cost: number, isDuplicate: boolean) => void;
}

type Tab = "summon" | "pool";

export function GachaPanel({ isOpen, onClose, essence, ownedWaifus, onSummon }: GachaPanelProps) {
  const timeoutRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState<Tab>("summon");
  const [isAnimating, setIsAnimating] = useState(false);
  const [result, setResult] = useState<{
    waifu: Waifu;
    isDuplicate: boolean;
  } | null>(null);
  const [showPool, setShowPool] = useState(false);

  const getAvailablePool = () => {
    const maxedIds = new Set(ownedWaifus.filter((w) => w.isMaxed()).map((w) => w.id));
    return testWaifus.filter((w) => !maxedIds.has(w.id));
  };

  const calculateDropRates = () => {
    const available = getAvailablePool();
    const counts: Record<TRarity, number> = {
      common: available.filter((w) => w.rarity === "common").length,
      uncommon: available.filter((w) => w.rarity === "uncommon").length,
      rare: available.filter((w) => w.rarity === "rare").length,
      epic: available.filter((w) => w.rarity === "epic").length,
      legendary: available.filter((w) => w.rarity === "legendary").length,
      mythic: available.filter((w) => w.rarity === "mythic").length,
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    return {
      counts,
      rates: BASE_DROP_RATES,
    };
  };

  const performSummon = () => {
    if (essence < 10) return;

    const available = getAvailablePool();
    if (available.length === 0) {
      alert(t("ui.poolEmpty"));
      return;
    }

    setIsAnimating(true);

    timeoutRef.current = setTimeout(() => {
      const roll = Math.random();
      let rarity: TRarity;

      if (roll < BASE_DROP_RATES.mythic) rarity = "mythic";
      else if (roll < BASE_DROP_RATES.legendary) rarity = "legendary";
      else if (roll < BASE_DROP_RATES.epic) rarity = "epic";
      else if (roll < BASE_DROP_RATES.rare) rarity = "rare";
      else if (roll < BASE_DROP_RATES.uncommon) rarity = "uncommon";
      else rarity = "common";

      const candidates = available.filter((w) => w.rarity === rarity);

      let selected;
      if (candidates.length === 0) {
        const randomIdx = Math.floor(Math.random() * available.length);
        selected = available[randomIdx];
      } else {
        const randomIdx = Math.floor(Math.random() * candidates.length);
        selected = candidates[randomIdx];
      }

      const existingWaifu = ownedWaifus.find((w) => w.id === selected.id);
      let waifu: Waifu;
      let isDuplicate = false;

      if (existingWaifu) {
        existingWaifu.addDuplicate();
        waifu = existingWaifu;
        isDuplicate = true;
      } else {
        waifu = Waifu.fromTemplate(selected);
      }

      setResult({ waifu, isDuplicate });
      setIsAnimating(false);
      onSummon(waifu, 10, isDuplicate);
      timeoutRef.current = 0;
    }, 1000);
  };

  const handleClose = () => {
    setResult(null);
    setActiveTab("summon");
    onClose();
  };

  const dropInfo = calculateDropRates();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={handleClose}>
      <div className="panel gacha-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="gacha" size="md" /> {t("ui.gacha")}
          </h2>
          <button className="btn-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="gacha-tabs">
          <button
            className={`gacha-tab ${activeTab === "summon" ? "active" : ""}`}
            onClick={() => setActiveTab("summon")}
          >
            {t("ui.summon")}
          </button>
          <button className={`gacha-tab ${activeTab === "pool" ? "active" : ""}`} onClick={() => setActiveTab("pool")}>
            {t("ui.dropPool")}
          </button>
        </div>

        <div className="panel-content">
          {activeTab === "summon" ? (
            <>
              {isAnimating ? (
                <div className="gacha-animation">
                  <Icon name="summoning" size="lg" className="gacha-orb" />
                  <p>{t("ui.summoning")}...</p>
                </div>
              ) : result ? (
                <div className={`gacha-result rarity-${result.waifu.rarity} ${result.isDuplicate ? "duplicate" : ""}`}>
                  {result.isDuplicate && (
                    <div className="duplicate-banner">
                      <span>
                        <Icon name="duplicate" size="sm" /> {t("ui.duplicate")}
                      </span>
                      <small>+30% {t("ui.stats")}</small>
                    </div>
                  )}

                  <div className="result-waifu">
                    <img src={result.waifu.image} alt={result.waifu.name} />
                    <h3>{result.waifu.name}</h3>
                    <span
                      className="rarity-label"
                      style={{
                        color: RARITY_COLORS[result.waifu.rarity],
                      }}
                    >
                      {t(`ui.${RARITY_KEYS[result.waifu.rarity]}`).toUpperCase()}
                    </span>
                    {result.isDuplicate && <span className="dup-count-badge">{result.waifu.duplicateCount}/20</span>}
                  </div>

                  <div className="waifu-stats-preview">
                    <span>
                      <Icon name="click" size="sm" /> {result.waifu.getClickPower()}
                    </span>
                    <span>
                      <Icon name="crit" size="sm" /> {(result.waifu.getCritChance() * 100).toFixed(1)}%
                    </span>
                    <span>
                      <Icon name="critPower" size="sm" /> {result.waifu.getCritMultiplier().toFixed(1)}x
                    </span>
                  </div>

                  <button className="btn-primary" onClick={() => setResult(null)}>
                    {t("ui.continue")}
                  </button>
                </div>
              ) : (
                <>
                  <p className="gacha-description">{t("gacha.desc")}</p>

                  <div className="gacha-rates">
                    <h4>{t("ui.dropRates")}</h4>
                    {dropInfo ? (
                      <>
                        {Object.entries(BASE_DROP_RATES).map(([rarity, rate]) => (
                          <div key={rarity} className={`rate-row rarity-${rarity}`}>
                            <span className="rarity-name">{t(`ui.${RARITY_KEYS[rarity as TRarity]}`)}</span>
                            <span className="rate-value">{(rate * 100).toFixed(1)}%</span>
                            <span className="available-count">
                              ({dropInfo.counts[rarity as TRarity]} {t("ui.available")})
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="empty-pool-warning">⚠️ {t("ui.poolEmptyWarning")}</p>
                    )}
                  </div>

                  <div className="gacha-action">
                    <div className="cost-display">
                      <span>
                        <Icon name="essence" size="sm" /> 10 {t("ui.essence")}
                      </span>
                      <span className="player-essence">
                        {t("ui.youHave")}: {essence} <Icon name="essence" size="sm" />
                      </span>
                    </div>
                    <button
                      className="btn-primary btn-summon"
                      onClick={performSummon}
                      disabled={essence < 10 || !dropInfo}
                    >
                      {t("ui.summon")}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="pool-preview-tab">
              <p className="pool-preview-hint">{t("ui.poolPreviewHint")}</p>
              <button className="btn-secondary" onClick={() => setShowPool(true)}>
                📚 {t("ui.viewFullPool")}
              </button>

              <div className="quick-pool-stats">
                <h4>{t("ui.collectionProgress")}</h4>
                <div className="collection-bar">
                  <div
                    className="collection-fill"
                    style={{
                      width: `${(ownedWaifus.length / testWaifus.length) * 100}%`,
                    }}
                  />
                  <span>
                    {ownedWaifus.length} / {testWaifus.length}
                  </span>
                </div>

                <div className="maxed-stats">
                  <span>
                    {t("ui.maxedWaifus")}: {ownedWaifus.filter((w) => w.isMaxed()).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DropPoolPanel isOpen={showPool} onClose={() => setShowPool(false)} ownedWaifus={ownedWaifus} />
    </div>
  );
}
