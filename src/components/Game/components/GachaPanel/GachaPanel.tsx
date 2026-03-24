import { useState } from "react";
import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { testWaifus, BASE_DROP_RATES, RARITY_COLORS } from "../../../../game/constant";
import type { TRarity } from "../../../../types";

import "./GachaPanel.css";
import { DropPoolPanel } from "./DropPoolPanel";

interface GachaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  essence: number;
  ownedWaifus: Waifu[];
  onSummon: (waifu: Waifu, cost: number, isDuplicate: boolean) => void;
}

type Tab = "summon" | "pool";

export function GachaPanel({ isOpen, onClose, essence, ownedWaifus, onSummon }: GachaPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summon");
  const [isAnimating, setIsAnimating] = useState(false);
  const [result, setResult] = useState<{ waifu: Waifu; isDuplicate: boolean } | null>(null);
  const [showPool, setShowPool] = useState(false);

  // Получаем доступный пул (исключая максированные вайфу)
  const getAvailablePool = () => {
    const maxedIds = new Set(ownedWaifus.filter((w) => w.isMaxed()).map((w) => w.id));
    return testWaifus.filter((w) => !maxedIds.has(w.id));
  };

  // Рассчитываем шансы с учетом выпавших вайфу (базовые шансы)
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

    // Если пул пуст, возвращаем 0
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
      alert(t("poolEmpty") || "Все вайфу достигли максимума!");
      return;
    }

    setIsAnimating(true);

    setTimeout(() => {
      // Определяем редкость по базовым шансам
      const roll = Math.random();
      let rarity: TRarity;

      if (roll < BASE_DROP_RATES.mythic) rarity = "mythic";
      else if (roll < BASE_DROP_RATES.legendary) rarity = "legendary";
      else if (roll < BASE_DROP_RATES.epic) rarity = "epic";
      else if (roll < BASE_DROP_RATES.rare) rarity = "rare";
      else if (roll < BASE_DROP_RATES.uncommon) rarity = "uncommon";
      else rarity = "common";

      // Фильтруем доступных вайфу этой редкости
      const candidates = available.filter((w) => w.rarity === rarity);

      if (candidates.length === 0) {
        // Если нет кандидатов этой редкости, берем любого доступного
        const randomIdx = Math.floor(Math.random() * available.length);
        var selected = available[randomIdx];
      } else {
        const randomIdx = Math.floor(Math.random() * candidates.length);
        var selected = candidates[randomIdx];
      }

      // Проверяем, есть ли уже такая вайфу
      const existingWaifu = ownedWaifus.find((w) => w.id === selected.id);
      let waifu: Waifu;
      let isDuplicate = false;

      if (existingWaifu) {
        // Дубликат
        existingWaifu.addDuplicate();
        waifu = existingWaifu;
        isDuplicate = true;
      } else {
        // Новая вайфу
        waifu = Waifu.fromTemplate(selected);
      }

      setResult({ waifu, isDuplicate });
      setIsAnimating(false);
      onSummon(waifu, 10, isDuplicate);
    }, 10);
  };

  const handleClose = () => {
    setResult(null);
    setActiveTab("summon");
    onClose();
  };

  const dropInfo = calculateDropRates();

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={handleClose}>
      <div className="panel gacha-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>🎲 {t("gacha")}</h2>
          <button className="btn-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Вкладки */}
        <div className="gacha-tabs">
          <button
            className={`gacha-tab ${activeTab === "summon" ? "active" : ""}`}
            onClick={() => setActiveTab("summon")}
          >
            {t("summon") || "Призыв"}
          </button>
          <button className={`gacha-tab ${activeTab === "pool" ? "active" : ""}`} onClick={() => setActiveTab("pool")}>
            {t("dropPool") || "Пул"}
          </button>
        </div>

        <div className="panel-content">
          {activeTab === "summon" ? (
            <>
              {isAnimating ? (
                <div className="gacha-animation">
                  <div className="gacha-orb">✨</div>
                  <p>{t("summoning")}...</p>
                </div>
              ) : result ? (
                <div className={`gacha-result rarity-${result.waifu.rarity} ${result.isDuplicate ? "duplicate" : ""}`}>
                  {result.isDuplicate && (
                    <div className="duplicate-banner">
                      <span>⬆️ {t("duplicate") || "Дубликат!"}</span>
                      <small>+30% {t("stats") || "статов"}</small>
                    </div>
                  )}

                  <div className="result-waifu">
                    <img src={result.waifu.image} alt={result.waifu.name} />
                    <h3>{result.waifu.name}</h3>
                    <span className="rarity-label" style={{ color: RARITY_COLORS[result.waifu.rarity] }}>
                      {result.waifu.rarity.toUpperCase()}
                    </span>
                    {result.isDuplicate && <span className="dup-count-badge">{result.waifu.duplicateCount}/20</span>}
                  </div>

                  <div className="waifu-stats-preview">
                    <span>👆 {result.waifu.getClickPower()}</span>
                    <span>⚙️ {result.waifu.getAutoClick()}</span>
                    <span>⚔️ {(result.waifu.getCritChance() * 100).toFixed(1)}%</span>
                  </div>

                  <button className="btn-primary" onClick={() => setResult(null)}>
                    {t("continue")}
                  </button>
                </div>
              ) : (
                <>
                  <p className="gacha-description">{t("gachaDesc")}</p>

                  <div className="gacha-rates">
                    <h4>{t("dropRates")}</h4>
                    {dropInfo ? (
                      <>
                        {Object.entries(BASE_DROP_RATES).map(([rarity, rate]) => (
                          <div key={rarity} className={`rate-row rarity-${rarity}`}>
                            <span className="rarity-name">{rarity}</span>
                            <span className="rate-value">{(rate * 100).toFixed(1)}%</span>
                            <span className="available-count">
                              ({dropInfo.counts[rarity as TRarity]} {t("available") || "дост."})
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="empty-pool-warning">⚠️ {t("poolEmptyWarning") || "Все вайфу достигли лимита!"}</p>
                    )}
                  </div>

                  <div className="gacha-action">
                    <div className="cost-display">
                      <span>💎 10 {t("essence")}</span>
                      <span className="player-essence">
                        {t("youHave")}: {essence} ✨
                      </span>
                    </div>
                    <button
                      className="btn-primary btn-summon"
                      onClick={performSummon}
                      disabled={essence < 10 || !dropInfo}
                    >
                      {t("summon")}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="pool-preview-tab">
              <p className="pool-preview-hint">
                {t("poolPreviewHint") || "Нажмите кнопку ниже чтобы увидеть всех доступных вайфу"}
              </p>
              <button className="btn-secondary" onClick={() => setShowPool(true)}>
                📚 {t("viewFullPool") || "Открыть полный пул"}
              </button>

              <div className="quick-pool-stats">
                <h4>{t("collectionProgress") || "Прогресс коллекции"}</h4>
                <div className="collection-bar">
                  <div
                    className="collection-fill"
                    style={{ width: `${(ownedWaifus.length / testWaifus.length) * 100}%` }}
                  />
                  <span>
                    {ownedWaifus.length} / {testWaifus.length}
                  </span>
                </div>

                <div className="maxed-stats">
                  <span>
                    {t("maxedWaifus") || "Максимум:"} {ownedWaifus.filter((w) => w.isMaxed()).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модал полного пула */}
      <DropPoolPanel isOpen={showPool} onClose={() => setShowPool(false)} ownedWaifus={ownedWaifus} />
    </div>
  );
}
