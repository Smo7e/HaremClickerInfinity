import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { testWaifus, BASE_DROP_RATES, RARITY_COLORS, RARITY_KEYS } from "../../../../game/constant";
import type { TRarity } from "../../../../types";
import "./GachaPanel.css";
import { DropPoolPanel } from "./DropPoolPanel";
import { Icon } from "../../../Icon/Icon";
import { useGameStore } from "../../../../store/gameStore";

interface GachaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "summon" | "pool";

type SummonResult = {
  waifu: Waifu;
  isDuplicate: boolean;
};

export function GachaPanel({ isOpen, onClose }: GachaPanelProps) {
  const timeoutRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summon");
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState<SummonResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showPool, setShowPool] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false); // Флаг процесса пропуска

  const essence = useGameStore((state) => state.inventory.getItemCount("essence"));
  const ownedWaifus = useGameStore((state) => state.ownedWaifus);
  const addWaifu = useGameStore((state) => state.addWaifu);
  const removeItem = useGameStore((state) => state.removeItem);

  const sortedRarities: TRarity[] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

  const getActualRate = (rarity: TRarity, index: number): number => {
    const cumulative = BASE_DROP_RATES[rarity];
    const prevCumulative = index === 0 ? 0 : BASE_DROP_RATES[sortedRarities[index - 1]!];
    return cumulative - prevCumulative;
  };

  const getAvailablePool = useCallback(() => {
    const maxedIds = new Set(ownedWaifus.filter((w) => w.isMaxed()).map((w) => w.id));
    return testWaifus.filter((w) => !maxedIds.has(w.id));
  }, [ownedWaifus]);

  const dropInfo = useMemo(() => {
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
  }, [getAvailablePool]);

  const performSummon = useCallback(() => {
    if (essence < 10) return;
    const available = getAvailablePool();
    if (available.length === 0) {
      alert(t("ui.poolEmpty"));
      return;
    }

    setIsAnimating(true);
    timeoutRef.current = window.setTimeout(() => {
      const roll = Math.random();
      let rarity: TRarity;
      if (roll < BASE_DROP_RATES.mythic) rarity = "mythic";
      else if (roll < BASE_DROP_RATES.legendary) rarity = "legendary";
      else if (roll < BASE_DROP_RATES.epic) rarity = "epic";
      else if (roll < BASE_DROP_RATES.rare) rarity = "rare";
      else if (roll < BASE_DROP_RATES.uncommon) rarity = "uncommon";
      else rarity = "common";

      const candidates = available.filter((w) => w.rarity === rarity);
      const selected =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]!
          : available[Math.floor(Math.random() * available.length)]!;

      const waifu = Waifu.fromTemplate(selected);
      const existing = ownedWaifus.find((w) => w.id === waifu.id);
      const isDuplicate = !!existing;

      if (isDuplicate && existing) {
        waifu.duplicateCount = existing.duplicateCount + 1;
      }

      setResults([{ waifu, isDuplicate }]);
      setCurrentResultIndex(0);
      setIsAnimating(false);
      removeItem("essence", 10);
      addWaifu(waifu);
      timeoutRef.current = null;
    }, 1000);
  }, [essence, getAvailablePool, ownedWaifus, removeItem, addWaifu]);

  const performSummon10 = useCallback(() => {
    if (essence < 100) return;
    const available = getAvailablePool();
    if (available.length === 0) {
      alert(t("ui.poolEmpty"));
      return;
    }

    setIsAnimating(true);
    removeItem("essence", 100);

    const newResults: SummonResult[] = [];
    let currentIndex = 0;

    const summonNext = () => {
      if (currentIndex >= 10) {
        setIsAnimating(false);
        setResults(newResults);
        setCurrentResultIndex(0);
        return;
      }

      const roll = Math.random();
      let rarity: TRarity;
      if (roll < BASE_DROP_RATES.mythic) rarity = "mythic";
      else if (roll < BASE_DROP_RATES.legendary) rarity = "legendary";
      else if (roll < BASE_DROP_RATES.epic) rarity = "epic";
      else if (roll < BASE_DROP_RATES.rare) rarity = "rare";
      else if (roll < BASE_DROP_RATES.uncommon) rarity = "uncommon";
      else rarity = "common";

      const candidates = available.filter((w) => w.rarity === rarity);
      const selected =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]!
          : available[Math.floor(Math.random() * available.length)]!;

      const waifu = Waifu.fromTemplate(selected);
      const existing = ownedWaifus.find((w) => w.id === waifu.id);
      const isDuplicate = !!existing;

      if (isDuplicate && existing) {
        waifu.duplicateCount = existing.duplicateCount + 1;
      }

      newResults.push({ waifu, isDuplicate });
      addWaifu(waifu);

      currentIndex++;
      if (currentIndex < 10) {
        timeoutRef.current = window.setTimeout(summonNext, 400);
      } else {
        setIsAnimating(false);
        setResults(newResults);
        setCurrentResultIndex(0);
      }
    };

    timeoutRef.current = window.setTimeout(summonNext, 500);
  }, [essence, getAvailablePool, ownedWaifus, removeItem, addWaifu]);

  const handleNextResult = () => {
    if (currentResultIndex < results.length - 1) {
      setCurrentResultIndex((prev) => prev + 1);
    } else {
      // Если это последняя карточка, мы НЕ закрываем окно автоматически,
      // чтобы пользователь мог осмотреть результат.
      // Закрытие происходит только по кнопке "Продолжить" (которая меняет текст на последней карточке)
      // Или можно оставить как есть, если кнопка "Далее" на последней карточке называется "Продолжить"
      // В текущей реализации ниже кнопка "btn-continue" вызывает handleNextResult.
      // Если мы на последнем элементе, handleNextResult сбросит результаты.
      setResults([]);
      setCurrentResultIndex(0);
    }
  };

  // Новая логика умного пропуска
  // ГАРАНТИЯ: Никогда не закрывает панель сама. Только листает.
  const handleSmartSkip = useCallback(() => {
    if (isSkipping || results.length === 0) return;
    setIsSkipping(true);

    // Очищаем предыдущие таймеры, если были
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let targetIndex = -1;

    // Ищем индекс цели (Новая или Легендарная/Мифическая)
    for (let i = currentResultIndex + 1; i < results.length; i++) {
      const res = results[i]!;
      const isNew = !res.isDuplicate;
      const isHighRarity = res.waifu.rarity === "legendary" || res.waifu.rarity === "mythic";

      if (isNew || isHighRarity) {
        targetIndex = i;
        break;
      }
    }

    // Если цель не найдена, листаем до самого конца
    if (targetIndex === -1) {
      targetIndex = results.length - 1;
    }

    let step = currentResultIndex;

    const stepThrough = () => {
      if (step < targetIndex) {
        step++;
        setCurrentResultIndex(step);
        // Быстрая задержка 200мс для эффекта пролистывания
        timeoutRef.current = window.setTimeout(stepThrough, 200);
      } else {
        // Дошли до цели или конца списка.
        // Останавливаемся. Панель НЕ закрывается.
        setIsSkipping(false);
      }
    };

    stepThrough();
  }, [currentResultIndex, results, isSkipping]);

  const handleClose = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setResults([]);
    setCurrentResultIndex(0);
    setActiveTab("summon");
    setIsSkipping(false);
    onClose();
  }, [onClose]);

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
              ) : results.length > 0 ? (
                (() => {
                  const currentResult = results[currentResultIndex];
                  if (!currentResult) return null;

                  return (
                    <div className="gacha-results-overlay" onClick={(e) => e.stopPropagation()}>
                      <div className="result-counter">
                        {currentResultIndex + 1} / {results.length}
                      </div>

                      <div
                        className={`gacha-result-card rarity-${currentResult.waifu.rarity} ${
                          currentResult.isDuplicate ? "duplicate" : "new-waifu"
                        }`}
                      >
                        {currentResult.isDuplicate && (
                          <div className="duplicate-banner">
                            <span>
                              <Icon name="duplicate" size="sm" /> {t("ui.duplicate")}
                            </span>
                            <small>+30% {t("ui.stats")}</small>
                          </div>
                        )}

                        {!currentResult.isDuplicate && (
                          <div className="new-waifu-banner">
                            <span>✨ NEW ✨</span>
                          </div>
                        )}

                        <div className="result-waifu-visual">
                          <img src={currentResult.waifu.image} alt={currentResult.waifu.name} />
                        </div>

                        <div className="result-info">
                          <h3>{currentResult.waifu.name}</h3>
                          <span
                            className="rarity-label"
                            style={{
                              color: RARITY_COLORS[currentResult.waifu.rarity],
                            }}
                          >
                            {t(`ui.${RARITY_KEYS[currentResult.waifu.rarity]}`).toUpperCase()}
                          </span>
                          {currentResult.isDuplicate && (
                            <span className="dup-count-badge">{currentResult.waifu.duplicateCount}/20</span>
                          )}
                        </div>

                        <div className="waifu-stats-preview">
                          <span>
                            <Icon name="click" size="sm" /> {currentResult.waifu.getClickPower()}
                          </span>
                          <span>
                            <Icon name="crit" size="sm" /> {(currentResult.waifu.getCritChance() * 100).toFixed(1)}%
                          </span>
                          <span>
                            <Icon name="critPower" size="sm" /> {currentResult.waifu.getCritMultiplier().toFixed(1)}x
                          </span>
                        </div>
                      </div>

                      {/* Блок управления кнопками */}
                      <div className="gacha-controls">
                        <button
                          className="btn-secondary btn-skip-fast"
                          onClick={handleSmartSkip}
                          disabled={isSkipping || currentResultIndex === results.length - 1}
                        >
                          {isSkipping ? "..." : t("ui.skip")}
                        </button>

                        <button className="btn-primary btn-continue" onClick={handleNextResult} disabled={isSkipping}>
                          {currentResultIndex < results.length - 1 ? t("ui.next") : t("ui.continue")}
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <p className="gacha-description">{t("gacha.desc")}</p>
                  <div className="gacha-rates">
                    <h4>{t("ui.dropRates")}</h4>
                    {dropInfo ? (
                      <>
                        {sortedRarities.map((rarity, index) => (
                          <div key={rarity} className={`rate-row rarity-${rarity}`}>
                            <span className="rarity-name">{t(`ui.${RARITY_KEYS[rarity]}`)}</span>
                            <span className="rate-value">{(getActualRate(rarity, index) * 100).toFixed(1)}%</span>
                            <span className="available-count">
                              ({dropInfo.counts[rarity]} {t("ui.available")})
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
                      <div className="cost-row">
                        <span>
                          <Icon name="essence" size="sm" /> 10 {t("ui.essence")}
                        </span>
                        <span className="player-essence">
                          {t("ui.youHave")}: {essence} <Icon name="essence" size="sm" />
                        </span>
                      </div>
                      <div className="cost-row x10-row">
                        <span>
                          <Icon name="essence" size="sm" /> 100 {t("ui.essence")}
                        </span>
                        <span className="x10-badge">x10</span>
                      </div>
                    </div>
                    <div className="summon-buttons">
                      <button
                        className="btn-primary btn-summon"
                        onClick={performSummon}
                        disabled={essence < 10 || !dropInfo || isAnimating}
                      >
                        {t("ui.summon")} x1
                      </button>
                      <button
                        className="btn-primary btn-summon x10"
                        onClick={performSummon10}
                        disabled={essence < 100 || !dropInfo || isAnimating}
                      >
                        {t("ui.summon")} x10
                      </button>
                    </div>
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
