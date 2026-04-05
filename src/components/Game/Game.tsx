import { useState, useEffect, useCallback } from "react";
import { t } from "../../locales/i18n";
import { Enemy } from "../../classes/Enemy";
import { Waifu } from "../../classes/Waifu";
import { EnemyComponent } from "./components/EnemyComponent/EnemyComponent";
import { WaifuComponent } from "./components/WaifuComponent/WaifuComponent";
import { UpgradePanel } from "./components/UpgradePanel/UpgradePanel";
import { GachaPanel } from "./components/GachaPanel/GachaPanel";
import { CollectionPanel } from "./components/CollectionPanel/CollectionPanel";
import { WaifuSelectPanel } from "./components/WaifuSelectPanel/WaifuSelectPanel";
import { WaifuDetailPanel } from "./components/WaifuDetailPanel/WaifuDetailPanel";
import { Pause } from "./components/Pause/Pause";
import { Settings } from "../Settings/Settings";
import { LocationSelector } from "./components/LocationSelector/LocationSelector";
import "./Game.css";
import { testWaifus, LOCATIONS, LOCATION_UNLOCK_REQUIREMENTS, COLLECTION_BUFFS } from "../../game/constant";
import { Icon } from "../Icon/Icon";
import { Background } from "./components/Background/Background";
import { Inventory } from "../../classes/Inventory";
import { BackpackPanel } from "./components/BackpackPanel/BackpackPanel";
import type {
  IGlobalUpgrades,
  TCollectionCategory,
  TCraftItem,
  TElementType,
  TLocation,
  TLocationProgress,
} from "../../types";
import { CheatMenu } from "./components/CheatMenu/CheatMenu";
import { CraftPanel } from "./components/CraftPanel/CraftPanel";

interface Props {
  onBack: () => void;
  isPaused: boolean;
}

const INITIAL_LOCATION_PROGRESS: TLocationProgress = {
  forest: { currentLevel: 1, maxLevelReached: 1, unlocked: true },
  desert: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
  ice: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
  volcano: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
  castle: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
  abyss: { currentLevel: 1, maxLevelReached: 1, unlocked: false },
};
export const INITIAL_GLOBAL_UPGRADES: IGlobalUpgrades = {
  clickPowerBonus: 0,
  elementDamage: {
    water: 0,
    fire: 0,
    earth: 0,
    ice: 0,
    light: 0,
    dark: 0,
    physical: 0,
  },
  collectionBuffs: {
    elementDamage: {
      water: 0,
      fire: 0,
      earth: 0,
      ice: 0,
      light: 0,
      dark: 0,
      physical: 0,
    },
    enemyTypeDamage: {},
    critPowerBonus: 0,
    gemBonus: 0,
    expBonus: 0,
  },
};
export function Game({ onBack, isPaused: isGlobalPaused }: Props) {
  const [inventory, setInventory] = useState(() => new Inventory());

  const [currentLocation, setCurrentLocation] = useState<TLocation>("forest");
  const [locationProgress, setLocationProgress] = useState<TLocationProgress>(INITIAL_LOCATION_PROGRESS);

  const getCurrentEnemyLevel = useCallback(() => {
    return locationProgress[currentLocation].currentLevel;
  }, [currentLocation, locationProgress]);

  const [enemy, setEnemy] = useState<Enemy>(() => Enemy.spawn(1, currentLocation));

  const [ownedWaifus, setOwnedWaifus] = useState<Waifu[]>([Waifu.fromTemplate(testWaifus[0])]);
  // testWaifus.map((template) => Waifu.fromTemplate(template)),
  const [activeWaifu, setActiveWaifu] = useState<Waifu | null>(null);

  const [globalUpgrades, setGlobalUpgrades] = useState<IGlobalUpgrades>(INITIAL_GLOBAL_UPGRADES);

  const [collection, setCollection] = useState<Map<string, TCollectionCategory>>(new Map());

  const [showGacha, setShowGacha] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showWaifuSelect, setShowWaifuSelect] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [selectedWaifuDetail, setSelectedWaifuDetail] = useState<Waifu | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showCraft, setShowCraft] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);

  const currentLocationConfig = LOCATIONS.find((l) => l.id === currentLocation)!;

  const calculateCollectionBuffs = useCallback(
    (collection: Map<string, TCollectionCategory>): IGlobalUpgrades["collectionBuffs"] => {
      const buffs: IGlobalUpgrades["collectionBuffs"] = {
        elementDamage: {
          water: 0,
          fire: 0,
          earth: 0,
          ice: 0,
          light: 0,
          dark: 0,
          physical: 0,
        },
        enemyTypeDamage: {},
        critPowerBonus: 0,
        gemBonus: 0,
        expBonus: 0,
      };

      for (const [itemId] of collection) {
        const buff = COLLECTION_BUFFS[itemId];
        if (!buff) continue;

        switch (buff.buffType) {
          case "element_damage":
            if (buff.target && typeof buff.target === "string") {
              buffs.elementDamage[buff.target as TElementType] += buff.value;
            }
            break;
          case "enemy_type_damage":
            if (buff.target) {
              buffs.enemyTypeDamage[buff.target] = (buffs.enemyTypeDamage[buff.target] || 0) + buff.value;
            }
            break;
          case "crit_power":
            buffs.critPowerBonus += buff.value;
            break;
          case "gem_bonus":
            buffs.gemBonus += buff.value;
            break;
          case "exp_bonus":
            buffs.expBonus += buff.value;
            break;
        }
      }

      return buffs;
    },
    [],
  );
  useEffect(() => {
    setActiveWaifu(ownedWaifus[0]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPause((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setOwnedWaifus((prev) =>
      prev.map((w) => {
        w.setGlobalUpgrades(globalUpgrades);
        return w;
      }),
    );
    if (activeWaifu) {
      activeWaifu.setGlobalUpgrades(globalUpgrades);
    }
  }, [globalUpgrades]);

  useEffect(() => {
    const level = getCurrentEnemyLevel();
    setEnemy(Enemy.spawn(level, currentLocation));
  }, [currentLocation, getCurrentEnemyLevel]);

  const refreshInventory = useCallback(() => {
    setInventory((prev) => {
      const next = new Inventory();
      next.deserialize(prev.serialize());
      const newCollection = next.getCollection();
      setCollection(newCollection);

      const collectionBuffs = calculateCollectionBuffs(newCollection);
      setGlobalUpgrades((prevUpgrades) => ({
        ...prevUpgrades,
        collectionBuffs,
      }));

      return next;
    });
  }, []);

  const checkLocationUnlocks = useCallback((progress: TLocationProgress): TLocationProgress => {
    const newProgress = { ...progress };

    for (const [locationId, requirement] of Object.entries(LOCATION_UNLOCK_REQUIREMENTS)) {
      const locId = locationId as TLocation;
      if (!newProgress[locId].unlocked && requirement) {
        const prevLocation = requirement.prevLocation;
        if (newProgress[prevLocation].maxLevelReached >= requirement.killLevel) {
          newProgress[locId].unlocked = true;
        }
      }
    }

    return newProgress;
  }, []);

  const handleLocationChange = useCallback((location: TLocation) => {
    setCurrentLocation(location);
    setShowLocationSelector(false);
  }, []);
  const handleCraft = useCallback(
    (item: TCraftItem) => {
      for (const ing of item.ingredients) {
        if (!inventory.removeItem(ing.itemId, ing.count)) {
          return;
        }
      }
      inventory.addItem(item.id, 1);
      refreshInventory();
    },
    [inventory, refreshInventory],
  );

  const handleEnemyDefeated = useCallback(
    (baseExpReward: number, baseDrops: Array<{ id: string; count: number }>) => {
      const bonuses = currentLocationConfig.bonuses;
      const gemBonus = globalUpgrades.collectionBuffs.gemBonus;
      const expBonus = globalUpgrades.collectionBuffs.expBonus;

      const expReward = Math.floor(baseExpReward * bonuses.expMultiplier * (1 + expBonus));
      activeWaifu?.addExp(expReward);

      for (const drop of baseDrops) {
        const boostedCount = Math.floor(drop.count * bonuses.dropChanceMultiplier);
        inventory.addItem(drop.id, Math.max(1, boostedCount));
      }

      const currentLevel = getCurrentEnemyLevel();
      const baseGems = Math.floor(10 + currentLevel / 5);
      const boostedGems = Math.floor(baseGems * bonuses.gemMultiplier * (1 + gemBonus));
      inventory.addItem("gem", boostedGems);

      const baseEssence = 1;
      const boostedEssence = Math.floor(baseEssence * bonuses.essenceMultiplier);
      inventory.addItem("essence", Math.max(1, boostedEssence));

      setLocationProgress((prev) => {
        const newProgress = {
          ...prev,
          [currentLocation]: {
            ...prev[currentLocation],
            currentLevel: prev[currentLocation].currentLevel + 1,
            maxLevelReached: Math.max(prev[currentLocation].maxLevelReached, prev[currentLocation].currentLevel),
          },
        };
        return checkLocationUnlocks(newProgress);
      });

      refreshInventory();
    },
    [
      activeWaifu,
      inventory,
      refreshInventory,
      currentLocation,
      currentLocationConfig,
      getCurrentEnemyLevel,
      checkLocationUnlocks,
      globalUpgrades.collectionBuffs.gemBonus,
      globalUpgrades.collectionBuffs.expBonus,
    ],
  );

  const handleUseItem = (itemId: string) => {
    const item = inventory.getItem(itemId);
    if (!item || !item.effect) return;

    if (
      item.effect.type === "level_down_10" ||
      item.effect.type === "level_down_20" ||
      item.effect.type === "level_down_50"
    ) {
      const levelsToReduce = item.effect.value;
      setLocationProgress((prev) => {
        const currentLevel = prev[currentLocation].currentLevel;
        const newLevel = Math.max(1, currentLevel - levelsToReduce);
        return {
          ...prev,
          [currentLocation]: {
            ...prev[currentLocation],
            currentLevel: newLevel,
          },
        };
      });
      inventory.removeItem(itemId, 1);
      refreshInventory();
      return;
    }
    if (!activeWaifu) {
      alert(t("ui.selectWaifuFirst"));
      return;
    }

    const result = inventory.useItem(itemId, activeWaifu.id);
    if (result.success && result.effect) {
      if (result.effect.type === "exp") {
        activeWaifu.addExp(result.effect.value);
      } else if (result.effect.type === "affection") {
        activeWaifu.addAffection(result.effect.value);
      }
      setOwnedWaifus([...ownedWaifus]);
      refreshInventory();
    }
  };

  const handleUpgrade = (type: string, cost: number, element?: TElementType) => {
    if (!inventory.removeItem("gem", cost)) return;

    refreshInventory();

    setGlobalUpgrades((prev) => {
      const next = { ...prev };
      if (type === "click_power") {
        next.clickPowerBonus += 1;
      } else if (type === "element" && element) {
        next.elementDamage[element] += 1;
      }

      setOwnedWaifus((waifus) =>
        waifus.map((w) => {
          w.setGlobalUpgrades(next);
          return w;
        }),
      );

      if (activeWaifu) {
        activeWaifu.setGlobalUpgrades(next);
      }

      return next;
    });
  };

  const handleSummon = (waifu: Waifu, cost: number, isDuplicate: boolean) => {
    inventory.removeItem("essence", cost);

    waifu.setGlobalUpgrades(globalUpgrades);

    if (isDuplicate) {
      setOwnedWaifus((prev) => prev.map((w) => (w.id === waifu.id ? waifu : w)));

      if (activeWaifu?.id === waifu.id) {
        setActiveWaifu(waifu);
      }
    } else {
      setOwnedWaifus((prev) => [...prev, waifu]);
    }
    refreshInventory();
  };

  const handleWaifuSelect = (waifu: Waifu) => {
    setActiveWaifu(waifu);
  };

  const handleWaifuClick = () => {
    if (activeWaifu) {
      setSelectedWaifuDetail(activeWaifu);
    }
  };

  const handlePauseSettings = () => {
    setShowPause(false);
    setShowSettings(true);
  };

  const handlePauseMenu = () => {
    setShowPause(false);
    onBack();
  };

  if (!activeWaifu) {
    return <div className="game-loading">{t("ui.loading")}</div>;
  }

  const gems = inventory.getItemCount("gem");
  const essence = inventory.getItemCount("essence");
  const currentLevel = getCurrentEnemyLevel();

  return (
    <div className="game">
      <Background locationId={currentLocation} />
      <header className="game-header">
        <div className="currency-display">
          <div className="currency-item">
            <Icon name="gem" size="md" />
            <span className="currency-value">{Math.floor(gems)}</span>
            {currentLocationConfig.bonuses.gemMultiplier > 1 && (
              <span className="bonus-indicator">x{currentLocationConfig.bonuses.gemMultiplier.toFixed(1)}</span>
            )}
          </div>
          <div className="currency-item essence">
            <Icon name="essence" size="md" />
            <span className="currency-value">{Math.floor(essence)}</span>
            {currentLocationConfig.bonuses.essenceMultiplier > 1 && (
              <span className="bonus-indicator">x{currentLocationConfig.bonuses.essenceMultiplier.toFixed(1)}</span>
            )}
          </div>
        </div>

        <button className="btn-icon-only" onClick={() => setShowPause(true)}>
          <Icon name="pause" size="md" />
        </button>
      </header>

      <nav className="game-sidebar">
        <button className="side-btn" onClick={() => setShowLocationSelector(true)}>
          <Icon name={currentLocation} size="lg" />
          <span>{t("ui.location")}</span>
          <span className="side-badge">{currentLevel}</span>
        </button>

        <button className="side-btn" onClick={() => setShowGacha(true)}>
          <Icon name="gacha" size="lg" />
          <span>{t("ui.gacha")}</span>
          <span className="side-btn-cost">10✨</span>
        </button>

        <button className="side-btn" onClick={() => setShowCollection(true)}>
          <Icon name="collection" size="lg" />
          <span>{t("ui.collection")}</span>
        </button>

        <button className="side-btn" onClick={() => setShowWaifuSelect(true)}>
          <Icon name="waifus" size="lg" />
          <span>{t("ui.waifus")}</span>
          <span className="side-badge">{ownedWaifus.length}</span>
        </button>

        <button className="side-btn" onClick={() => setShowUpgrades(true)}>
          <Icon name="upgrades" size="lg" />
          <span>{t("ui.upgrades")}</span>
        </button>
        <button className="side-btn" onClick={() => setShowBackpack(true)}>
          <Icon name="backpack" size="lg" />
          <span>{t("ui.backpack")}</span>
        </button>
        <button className="side-btn" onClick={() => setShowCraft(true)}>
          <Icon name="collection" size="lg" />
          <span>{t("ui.craft")}</span>
        </button>
      </nav>

      <main className="game-main">
        <div className="battle-arena">
          <div onClick={handleWaifuClick} className="waifu-clickable">
            <WaifuComponent waifu={activeWaifu} />
          </div>
          <EnemyComponent
            enemy={enemy}
            activeWaifu={activeWaifu}
            onEnemyDefeated={handleEnemyDefeated}
            isPaused={isGlobalPaused || showPause}
            dropChanceMultiplier={currentLocationConfig.bonuses.dropChanceMultiplier}
          />
        </div>
      </main>

      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        currentLocation={currentLocation}
        locationProgress={locationProgress}
        onLocationChange={handleLocationChange}
      />

      <GachaPanel
        isOpen={showGacha}
        onClose={() => setShowGacha(false)}
        essence={essence}
        ownedWaifus={ownedWaifus}
        onSummon={handleSummon}
      />

      <CollectionPanel isOpen={showCollection} onClose={() => setShowCollection(false)} collection={collection} />

      <WaifuSelectPanel
        isOpen={showWaifuSelect}
        onClose={() => setShowWaifuSelect(false)}
        waifus={ownedWaifus}
        activeWaifu={activeWaifu}
        onSelect={handleWaifuSelect}
      />

      <UpgradePanel
        isOpen={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        gems={gems}
        onUpgrade={handleUpgrade}
        upgradeLevels={{
          clickPower: Math.floor(globalUpgrades.clickPowerBonus),
          elementDamage: globalUpgrades.elementDamage,
        }}
      />
      <BackpackPanel
        isOpen={showBackpack}
        onClose={() => setShowBackpack(false)}
        inventory={inventory}
        onUseItem={handleUseItem}
        selectedWaifuId={activeWaifu?.id}
      />

      <WaifuDetailPanel
        isOpen={!!selectedWaifuDetail}
        onClose={() => setSelectedWaifuDetail(null)}
        waifu={selectedWaifuDetail}
      />

      <Pause
        isOpen={showPause}
        onClose={() => setShowPause(false)}
        onSettings={handlePauseSettings}
        onMenu={handlePauseMenu}
      />

      {showSettings && (
        <Settings
          setIsSettings={() => setShowSettings(false)}
          setCurrentLang={() => {}}
          isPaused={isGlobalPaused || showPause}
        />
      )}
      <CraftPanel
        isOpen={showCraft}
        onClose={() => setShowCraft(false)}
        inventory={inventory}
        onCraft={handleCraft}
        onUseItem={handleUseItem}
        selectedWaifuId={activeWaifu?.id}
      />

      <CheatMenu
        inventory={inventory}
        ownedWaifus={ownedWaifus}
        onInventoryUpdate={refreshInventory}
        onWaifuAdd={(waifu) => {
          if (!ownedWaifus.find((w) => w.id === waifu.id)) {
            setOwnedWaifus((prev) => [...prev, waifu]);
          }
          refreshInventory();
        }}
        onSetGems={(amount) => {
          const current = inventory.getItemCount("gem");
          if (amount > current) {
            inventory.addItem("gem", amount - current);
          } else if (amount < current) {
            inventory.removeItem("gem", current - amount);
          }
          refreshInventory();
        }}
        onSetEssence={(amount) => {
          const current = inventory.getItemCount("essence");
          if (amount > current) {
            inventory.addItem("essence", amount - current);
          } else if (amount < current) {
            inventory.removeItem("essence", current - amount);
          }
          refreshInventory();
        }}
        onKillEnemy={() => {
          setEnemy((prev) => {
            prev.currentHp = 0;
            return prev;
          });
        }}
        onLevelUp={() => {
          setLocationProgress((prev) => ({
            ...prev,
            [currentLocation]: {
              ...prev[currentLocation],
              currentLevel: prev[currentLocation].currentLevel + 10,
            },
          }));
        }}
        gems={inventory.getItemCount("gem")}
        essence={inventory.getItemCount("essence")}
      />
    </div>
  );
}
