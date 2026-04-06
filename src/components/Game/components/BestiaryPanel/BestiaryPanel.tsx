import { useState, useMemo } from "react";
import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import {
  MONSTER_TEMPLATES,
  LOCATION_ENEMIES,
  LOCATION_BOSSES,
  INVENTORY_ITEMS,
  ELEMENT_COLORS,
} from "../../../../game/constant";
import type { TLocation, TElementType } from "../../../../types";
import { Icon } from "../../../Icon/Icon";
import "./BestiaryPanel.css";

interface BestiaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "all" | TLocation;

const UNLOCK_THRESHOLDS = {
  locations: 5,
  resistances: 100,
  drops: 500,
};

export function BestiaryPanel({ isOpen, onClose }: BestiaryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);

  const bestiary = useGameStore((state) => state.bestiary);
  const locationProgress = useGameStore((state) => state.locationProgress);

  const locationOrder: TLocation[] = ["forest", "desert", "ice", "volcano", "castle", "abyss"];

  // Карта враг->локации (только разблокированные для игрока)
  // Учитываем и обычных врагов из LOCATION_ENEMIES, и боссов из LOCATION_BOSSES
  const enemyLocations = useMemo(() => {
    const map: Record<string, TLocation[]> = {};

    // Обычные враги
    for (const [location, enemies] of Object.entries(LOCATION_ENEMIES)) {
      const loc = location as TLocation;
      if (locationProgress[loc].unlocked) {
        for (const enemyId of enemies) {
          if (!map[enemyId]) map[enemyId] = [];
          if (!map[enemyId].includes(loc)) {
            map[enemyId].push(loc);
          }
        }
      }
    }

    // Боссы
    for (const [location, bosses] of Object.entries(LOCATION_BOSSES)) {
      const loc = location as TLocation;
      if (locationProgress[loc].unlocked) {
        for (const bossId of bosses) {
          if (!map[bossId]) map[bossId] = [];
          if (!map[bossId].includes(loc)) {
            map[bossId].push(loc);
          }
        }
      }
    }

    return map;
  }, [locationProgress]);

  // Фильтруем только разблокированных врагов (хотя бы 1 убийство)
  const unlockedEnemies = useMemo(() => {
    return MONSTER_TEMPLATES.filter((template) => {
      const entry = bestiary[template.nameKey];
      return entry && entry.killCount > 0;
    }).map((template) => ({
      ...template,
      killCount: bestiary[template.nameKey]?.killCount || 0,
      locations: enemyLocations[template.id] || [],
    }));
  }, [bestiary, enemyLocations]);

  // Фильтрация по вкладке
  const filteredEnemies = useMemo(() => {
    if (activeTab === "all") return unlockedEnemies;
    return unlockedEnemies.filter((enemy) => enemy.locations.includes(activeTab));
  }, [unlockedEnemies, activeTab]);

  // Статистика открытых монстров
  const stats = useMemo(() => {
    const totalMonsters = MONSTER_TEMPLATES.length;
    const unlockedCount = unlockedEnemies.length;
    return { totalMonsters, unlockedCount };
  }, [unlockedEnemies]);

  // Данные выбранного врага с учетом разблокировок
  const selectedEnemyData = useMemo(() => {
    if (!selectedEnemy) return null;
    const template = MONSTER_TEMPLATES.find((t) => t.id === selectedEnemy);
    if (!template) return null;
    const entry = bestiary[template.nameKey];
    const killCount = entry?.killCount || 0;
    const allLocations = enemyLocations[template.id] || [];

    return {
      ...template,
      killCount,
      locations: allLocations,
      hasLocationsUnlocked: killCount >= UNLOCK_THRESHOLDS.locations,
      hasResistancesUnlocked: killCount >= UNLOCK_THRESHOLDS.resistances,
      hasDropsUnlocked: killCount >= UNLOCK_THRESHOLDS.drops,
    };
  }, [selectedEnemy, bestiary, enemyLocations]);

  const getResistanceLabel = (value: number): string => {
    if (value > 0.3) return t("ui.resist");
    if (value < -0.2) return t("ui.weak");
    return t("ui.normal");
  };

  const getResistanceColor = (value: number): string => {
    if (value > 0.3) return "#ff6b6b";
    if (value < -0.2) return "#51cf66";
    return "#9e9e9e";
  };

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel bestiary-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="collection" size="md" /> {t("ui.bestiary")}
          </h2>
          <div className="bestiary-stats">
            <span className="stats-counter">
              {stats.unlockedCount} / {stats.totalMonsters}
            </span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="bestiary-tabs">
          <button className={`bestiary-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            <Icon name="all" size="sm" />
            <span>{t("ui.all")}</span>
          </button>
          {locationOrder.map((loc) => (
            <button
              key={loc}
              className={`bestiary-tab ${activeTab === loc ? "active" : ""}`}
              onClick={() => setActiveTab(loc)}
              disabled={locationProgress[loc].maxLevelReached === 0}
              title={locationProgress[loc].maxLevelReached === 0 ? t("ui.locationLocked") : ""}
            >
              <Icon name={loc} size="sm" />
              <span>{t(`ui.locations.${loc}`)}</span>
              {locationProgress[loc].maxLevelReached === 0 && <span className="location-locked-icon">🔒</span>}
            </button>
          ))}
        </div>

        <div className="bestiary-content">
          {filteredEnemies.length === 0 ? (
            <div className="bestiary-empty">
              <Icon name="unknown" size="lg" />
              <p>{t("ui.noBestiaryEntries")}</p>
              <small>{t("ui.killEnemiesToUnlock")}</small>
            </div>
          ) : (
            <div className="bestiary-grid">
              {filteredEnemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className={`bestiary-card ${enemy.isBoss ? "boss" : ""}`}
                  onClick={() => setSelectedEnemy(enemy.id)}
                >
                  <div className="bestiary-image-container">
                    <img
                      src={enemy.sprite}
                      alt={t(`monsters.${enemy.nameKey}.name`)}
                      className="bestiary-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {enemy.isBoss && <span className="boss-indicator">{t("ui.boss")}</span>}
                  </div>
                  <div className="bestiary-info">
                    <span className="bestiary-name">{t(`monsters.${enemy.nameKey}.name`)}</span>
                    <span className="bestiary-kills">
                      {t("ui.kills")}: {enemy.killCount}
                    </span>
                    {enemy.locations.length > 0 && (
                      <div className="bestiary-locations">
                        {enemy.locations.slice(0, 3).map((loc) => (
                          <span key={loc} className="location-tag">
                            <Icon name={loc} size="sm" />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedEnemyData && (
          <div className="bestiary-detail-overlay" onClick={() => setSelectedEnemy(null)}>
            <div className="bestiary-detail" onClick={(e) => e.stopPropagation()}>
              <button className="btn-close detail-close" onClick={() => setSelectedEnemy(null)}>
                <Icon name="close" size="md" />
              </button>

              <div className="detail-header">
                <img
                  src={selectedEnemyData.sprite}
                  alt={t(`monsters.${selectedEnemyData.nameKey}.name`)}
                  className="detail-image"
                />
                <div className="detail-title">
                  <h3>{t(`monsters.${selectedEnemyData.nameKey}.name`)}</h3>
                  {selectedEnemyData.isBoss && <span className="detail-boss-badge">{t("ui.boss")}</span>}
                  <span className="detail-kills">
                    {t("ui.totalKills")}: {selectedEnemyData.killCount}
                  </span>
                </div>
              </div>

              <p className="detail-description">{t(selectedEnemyData.description)}</p>

              {/* Локации - разблокируются при 5 убийствах */}
              {selectedEnemyData.hasLocationsUnlocked ? (
                <div className="detail-section">
                  <h4>
                    <Icon name="pool" size="sm" /> {t("ui.foundIn")}
                  </h4>
                  <div className="detail-locations">
                    {selectedEnemyData.locations.length > 0 ? (
                      selectedEnemyData.locations.map((loc) => (
                        <span key={loc} className="detail-location-tag">
                          <Icon name={loc} size="sm" />
                          {t(`ui.locations.${loc}`)}
                        </span>
                      ))
                    ) : (
                      <span className="no-data">{t("ui.unknownLocations")}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="detail-section locked">
                  <h4>
                    <Icon name="pool" size="sm" /> {t("ui.foundIn")}
                  </h4>
                  <div className="locked-hint">
                    <Icon name="lock" size="sm" />
                    <span>
                      {t("ui.killsToUnlock")
                        .replace("{{current}}", selectedEnemyData.killCount.toString())
                        .replace("{{required}}", UNLOCK_THRESHOLDS.locations.toString())}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (selectedEnemyData.killCount / UNLOCK_THRESHOLDS.locations) * 100)}%`,
                      }}
                    />
                    <span className="progress-text">
                      {selectedEnemyData.killCount} / {UNLOCK_THRESHOLDS.locations}
                    </span>
                  </div>
                </div>
              )}

              {/* Сопротивления - разблокируются при 100 убийствах */}
              {selectedEnemyData.hasResistancesUnlocked ? (
                <div className="detail-section">
                  <h4>
                    <Icon name="shield" size="sm" /> {t("ui.resistances")}
                  </h4>
                  <div className="detail-resistances">
                    {Object.entries(selectedEnemyData.resistances).length > 0 ? (
                      Object.entries(selectedEnemyData.resistances).map(([element, value]) => {
                        const numValue = value as number;
                        return (
                          <div
                            key={element}
                            className="resistance-item"
                            style={{ borderColor: ELEMENT_COLORS[element as TElementType] }}
                          >
                            <Icon name={element} size="sm" />
                            <span className="resistance-name">{t(`ui.${element}`)}</span>
                            <span className="resistance-value" style={{ color: getResistanceColor(numValue) }}>
                              {numValue > 0 ? "+" : ""}
                              {Math.round(numValue * 100)}%
                            </span>
                            <span className="resistance-label" style={{ color: getResistanceColor(numValue) }}>
                              {getResistanceLabel(numValue)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="no-resists">{t("ui.noSpecialResists")}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="detail-section locked">
                  <h4>
                    <Icon name="shield" size="sm" /> {t("ui.resistances")}
                  </h4>
                  <div className="locked-hint">
                    <Icon name="lock" size="sm" />
                    <span>
                      {t("ui.killsToUnlock")
                        .replace("{{current}}", selectedEnemyData.killCount.toString())
                        .replace("{{required}}", UNLOCK_THRESHOLDS.resistances.toString())}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (selectedEnemyData.killCount / UNLOCK_THRESHOLDS.resistances) * 100)}%`,
                      }}
                    />
                    <span className="progress-text">
                      {selectedEnemyData.killCount} / {UNLOCK_THRESHOLDS.resistances}
                    </span>
                  </div>
                </div>
              )}

              {/* Дропы - разблокируются при 500 убийствах */}
              {selectedEnemyData.hasDropsUnlocked ? (
                <div className="detail-section">
                  <h4>
                    <Icon name="backpack" size="sm" /> {t("ui.possibleDrops")}
                  </h4>
                  <div className="detail-drops">
                    {selectedEnemyData.drops.map((drop) => {
                      const item = INVENTORY_ITEMS[drop.id];
                      return (
                        <div key={drop.id} className="drop-item-detail">
                          <Icon name={item?.icon || "unknown"} size="sm" />
                          <span className="drop-name">{item ? t(`items.${item.nameKey}.name`) : drop.id}</span>
                          <span className="drop-chance">{Math.round(drop.chance * 100)}%</span>
                          <span className="drop-range">
                            {drop.minCount}-{drop.maxCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="detail-section locked">
                  <h4>
                    <Icon name="backpack" size="sm" /> {t("ui.possibleDrops")}
                  </h4>
                  <div className="locked-hint">
                    <Icon name="lock" size="sm" />
                    <span>
                      {t("ui.killsToUnlock")
                        .replace("{{current}}", selectedEnemyData.killCount.toString())
                        .replace("{{required}}", UNLOCK_THRESHOLDS.drops.toString())}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (selectedEnemyData.killCount / UNLOCK_THRESHOLDS.drops) * 100)}%`,
                      }}
                    />
                    <span className="progress-text">
                      {selectedEnemyData.killCount} / {UNLOCK_THRESHOLDS.drops}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
