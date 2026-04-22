import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import {
  testWaifus,
  BASE_DROP_RATES,
  RARITY_COLORS,
  RARITY_KEYS,
  DUPLICATE_REFUND_RATES,
} from "../../../../game/constant";
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

// Интерфейс для результата призыва
interface SummonResult {
  waifu: Waifu;
  isDuplicate: boolean;
  isMaxed: boolean; // Новое поле: true если вайфу уже была и у неё 20 дублей
  refundAmount: number; // Количество гемов, если isMaxed
}

export function GachaPanel({ isOpen, onClose }: GachaPanelProps) {
  const timeoutRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summon");
  const [isAnimating, setIsAnimating] = useState(false);
  const [results, setResults] = useState<SummonResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showPool, setShowPool] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const essence = useGameStore((state) => state.inventory.getItemCount("essence"));
  const ownedWaifus = useGameStore((state) => state.ownedWaifus);
  const addWaifu = useGameStore((state) => state.addWaifu);
  const removeItem = useGameStore((state) => state.removeItem);
  const addItem = useGameStore((state) => state.addItem); // Для добавления гемов

  const sortedRarities: TRarity[] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

  const getAvailablePool = useCallback(() => {
    // Пул доступен всегда, но результат может быть "сгоревшим"
    return testWaifus;
  }, []);

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
    return { counts, rates: BASE_DROP_RATES };
  }, [getAvailablePool]);

  // Вспомогательная функция для обработки одного призыва
  const processSingleSummon = useCallback(() => {
    const available = getAvailablePool();
    if (available.length === 0) return null;

    const roll = Math.random();
    let rarity: TRarity;
    if (roll < BASE_DROP_RATES.mythic) rarity = "mythic";
    else if (roll < BASE_DROP_RATES.legendary) rarity = "legendary";
    else if (roll < BASE_DROP_RATES.epic) rarity = "epic";
    else if (roll < BASE_DROP_RATES.rare) rarity = "rare";
    else if (roll < BASE_DROP_RATES.uncommon) rarity = "uncommon";
    else rarity = "common";

    const candidates = available.filter((w) => w.rarity === rarity);
    const selectedTemplate =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]!
        : available[Math.floor(Math.random() * available.length)]!;

    const waifu = Waifu.fromTemplate(selectedTemplate);
    const existing = ownedWaifus.find((w) => w.id === waifu.id);

    const isDuplicate = !!existing;
    let isMaxed = false;
    let refundAmount = 0;

    if (isDuplicate && existing) {
      // Проверяем, достигнут ли лимит дубликатов (20)
      if (existing.duplicateCount >= 20) {
        isMaxed = true;
        refundAmount = DUPLICATE_REFUND_RATES[rarity] || 0;
      } else {
        // Если не макс, то просто увеличиваем дубликаты (стандартная логика addWaifu сделает это)
        waifu.duplicateCount = existing.duplicateCount + 1;
      }
    }

    return { waifu, isDuplicate, isMaxed, refundAmount };
  }, [ownedWaifus, getAvailablePool]);

  const performSummon = useCallback(() => {
    if (essence < 10) return;
    setIsAnimating(true);

    timeoutRef.current = window.setTimeout(() => {
      const result = processSingleSummon();
      if (!result) {
        setIsAnimating(false);
        return;
      }

      const { waifu, isDuplicate, isMaxed, refundAmount } = result;

      // Логика выдачи награды
      if (isMaxed) {
        // Если вайфу макс, даем гемы
        addItem("gem", refundAmount);
        console.log(`[Gacha] Maxed duplicate refunded ${refundAmount} gems`);
      } else {
        // Иначе добавляем вайфу (или дубликат)
        addWaifu(waifu);
      }

      setResults([{ waifu, isDuplicate, isMaxed, refundAmount }]);
      setCurrentResultIndex(0);
      setIsAnimating(false);
      removeItem("essence", 10);

      timeoutRef.current = null;
    }, 1000);
  }, [essence, processSingleSummon, addWaifu, removeItem, addItem]);

  const performSummon10 = useCallback(() => {
    if (essence < 100) return;
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

      const result = processSingleSummon();
      if (result) {
        const { waifu, isDuplicate, isMaxed, refundAmount } = result;

        if (isMaxed) {
          addItem("gem", refundAmount);
        } else {
          addWaifu(waifu);
        }

        newResults.push({ waifu, isDuplicate, isMaxed, refundAmount });
      }

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
  }, [essence, processSingleSummon, addWaifu, removeItem, addItem]);

  // НОВАЯ ЛОГИКА ПРОПУСКА
  const handleSmartSkip = useCallback(() => {
    if (isSkipping || results.length === 0) return;
    setIsSkipping(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let targetIndex = -1;

    // Ищем индекс цели:
    // 1. Новая вайфу (!isDuplicate)
    // 2. ИЛИ Вайфу, которая не является "сгоревшей" (!isMaxed), если мы хотим видеть улучшения статов.
    // По ТЗ: "останавливается если выпадает только новая вайфу".
    // Но обычно игроку важно увидеть и апгрейд дубликата.
    // Если строго по ТЗ "только новая":
    for (let i = currentResultIndex + 1; i < results.length; i++) {
      const res = results[i]!;
      if (!res.isDuplicate) {
        targetIndex = i;
        break;
      }
    }

    // Если новых нет, листаем до конца
    if (targetIndex === -1) {
      targetIndex = results.length - 1;
    }

    let step = currentResultIndex;
    const stepThrough = () => {
      if (step < targetIndex) {
        step++;
        setCurrentResultIndex(step);
        timeoutRef.current = window.setTimeout(stepThrough, 200);
      } else {
        setIsSkipping(false);
      }
    };
    stepThrough();
  }, [currentResultIndex, results, isSkipping]);

  const handleNextResult = () => {
    if (currentResultIndex < results.length - 1) {
      setCurrentResultIndex((prev) => prev + 1);
    } else {
      setResults([]);
      setCurrentResultIndex(0);
    }
  };

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
        {/* Header */}
        <div className="panel-header">
          <h2>
            <Icon name="gacha" size="md" /> {t("ui.gacha")}
          </h2>
          <button className="btn-close" onClick={handleClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        {/* Tabs */}
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

        {/* Content Area */}
        <div className="panel-content gacha-content-wrapper">
          {activeTab === "summon" ? (
            <>
              {isAnimating ? (
                <div className="gacha-animation">
                  <Icon name="summoning" size="lg" className="gacha-orb" />
                  <p>{t("ui.summoning")}...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="gacha-results-container">
                  {(() => {
                    const currentResult = results[currentResultIndex];
                    if (!currentResult) return null;

                    // Определяем, показываем ли мы "Refund" (Гемы) или Вайфу
                    const isRefund = currentResult.isMaxed;

                    return (
                      <div className="gacha-result-card-wrapper">
                        <div className="result-counter">
                          {currentResultIndex + 1} / {results.length}
                        </div>

                        {isRefund ? (
                          // КАРТОЧКА ВОЗВРАТА ГЕМОВ
                          <div className={`gacha-result-card rarity-${currentResult.waifu.rarity} refund-card`}>
                            <div
                              className="result-waifu-visual"
                              style={{ justifyContent: "center", alignItems: "center", height: "200px" }}
                            >
                              <div style={{ fontSize: "60px" }}>💎</div>
                            </div>

                            <div className="result-info">
                              <h3>
                                +{currentResult.refundAmount} {t("items.gem.name")}
                              </h3>
                              <span
                                className="rarity-label"
                                style={{ color: RARITY_COLORS[currentResult.waifu.rarity] }}
                              >
                                {t(`ui.${RARITY_KEYS[currentResult.waifu.rarity]}`).toUpperCase()}
                              </span>
                            </div>

                            <div className="waifu-stats-preview">
                              <span>{`${t("ui.waifus")} ${t("ui.max")}`}</span>
                            </div>
                          </div>
                        ) : (
                          // СТАНДАРТНАЯ КАРТОЧКА ВАЙФУ
                          <div
                            className={`gacha-result-card rarity-${currentResult.waifu.rarity} ${
                              currentResult.isDuplicate ? "duplicate" : "new-waifu"
                            }`}
                          >
                            {/* Баннеры */}
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
                                <span>{t("ui.new")}</span>
                              </div>
                            )}

                            {/* Визуал */}
                            <div className="result-waifu-visual">
                              <img src={currentResult.waifu.image} alt={currentResult.waifu.name} />
                            </div>

                            {/* Инфо */}
                            <div className="result-info">
                              <h3>{currentResult.waifu.name}</h3>
                              <span
                                className="rarity-label"
                                style={{ color: RARITY_COLORS[currentResult.waifu.rarity] }}
                              >
                                {t(`ui.${RARITY_KEYS[currentResult.waifu.rarity]}`).toUpperCase()}
                              </span>
                              {currentResult.isDuplicate && (
                                <span className="dup-count-badge">{currentResult.waifu.duplicateCount}/20</span>
                              )}
                            </div>

                            {/* Статы */}
                            <div className="waifu-stats-preview">
                              <span>
                                <Icon name="click" size="sm" /> {currentResult.waifu.getClickPower()}
                              </span>
                              <span>
                                <Icon name="crit" size="sm" /> {(currentResult.waifu.getCritChance() * 100).toFixed(1)}%
                              </span>
                              <span>
                                <Icon name="critPower" size="sm" /> {currentResult.waifu.getCritMultiplier().toFixed(1)}
                                x
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Кнопки управления */}
                        <div className="gacha-controls-fixed">
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
                  })()}
                </div>
              ) : (
                // --- ЭКРАН ПРИЗЫВА (КНОПКИ) ---
                <div className="gacha-summon-screen">
                  <p className="gacha-description">{t("gacha.desc")}</p>
                  <div className="gacha-rates">
                    <h4>{t("ui.dropRates")}</h4>
                    {dropInfo ? (
                      <>
                        {sortedRarities.map((rarity) => {
                          return (
                            <div key={rarity} className={`rate-row rarity-${rarity}`}>
                              <span className="rarity-name">{t(`ui.${RARITY_KEYS[rarity]}`)}</span>
                              <span className="rate-value">{(BASE_DROP_RATES[rarity] * 100).toFixed(1)}%</span>
                              <span className="available-count">
                                ({dropInfo.counts[rarity]} {t("ui.available")})
                              </span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="empty-pool-warning">⚠️ {t("ui.poolEmptyWarning")}</p>
                    )}
                  </div>
                  <div className="gacha-action-fixed">
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
                    <div className="summon-buttons-grid">
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
                </div>
              )}
            </>
          ) : (
            // --- ПРЕДПРОСМОТР ПУЛА ---
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
                    style={{ width: `${(ownedWaifus.length / testWaifus.length) * 100}%` }}
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
      {/* Модальное окно полного пула */}
      <DropPoolPanel isOpen={showPool} onClose={() => setShowPool(false)} ownedWaifus={ownedWaifus} />
    </div>
  );
}
