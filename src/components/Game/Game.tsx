import { useCallback, memo } from "react";
import { useShallow } from "zustand/shallow";
import { t } from "../../locales/i18n";
import { useGameStore } from "../../store/gameStore";
import { useBattle } from "../../hooks/useBattle";
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
import { Icon } from "../Icon/Icon";
import { Background } from "./components/Background/Background";
import { BackpackPanel } from "./components/BackpackPanel/BackpackPanel";
import { CheatMenu } from "./components/CheatMenu/CheatMenu";
import { CraftPanel, TCraftableItem } from "./components/CraftPanel/CraftPanel";
import { BestiaryPanel } from "./components/BestiaryPanel/BestiaryPanel";
import { useCPS } from "../../hooks/useCPS";

interface Props {
  onBack: () => void;
  isPaused: boolean;
}

export const Game = memo(function Game({ onBack, isPaused: isGlobalPaused }: Props) {
  const { inventory, ownedWaifus, activeWaifuId, enemy, currentLocation, locationProgress, isPaused, panels } =
    useGameStore(
      useShallow((state) => ({
        inventory: state.inventory,
        ownedWaifus: state.ownedWaifus,
        activeWaifuId: state.activeWaifuId,
        enemy: state.enemy,
        currentLocation: state.currentLocation,
        locationProgress: state.locationProgress,
        isPaused: state.isPaused,
        globalUpgrades: state.globalUpgrades,
        panels: state.panels,
      })),
    );

  const addItem = useGameStore((state) => state.addItem);
  const removeItem = useGameStore((state) => state.removeItem);
  const useItem = useGameStore((state) => state.useItem);
  const refreshWaifus = useGameStore((state) => state.refreshWaifus);
  const setActiveWaifu = useGameStore((state) => state.setActiveWaifu);
  const closePanel = useGameStore((state) => state.closePanel);
  const openPanel = useGameStore((state) => state.openPanel);
  const changeLocation = useGameStore((state) => state.changeLocation);
  const dealDamage = useGameStore((state) => state.dealDamage);

  const { handleClick, currentLevel, locationConfig } = useBattle();
  const { cps, isWarning, recordClick } = useCPS();

  const activeWaifu = ownedWaifus.find((w) => w.id === activeWaifuId);
  const gems = inventory.getItemCount("gem");
  const essence = inventory.getItemCount("essence");

  const handleEnemyClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      recordClick();
      handleClick(e);
    },
    [handleClick],
  );

  const handleLocationChange = useCallback(
    (location: typeof currentLocation) => {
      changeLocation(location);
      closePanel("locationSelector");
    },
    [changeLocation, closePanel],
  );

  const handleUseItem = useCallback(
    (itemId: string) => {
      const item = inventory.getItem(itemId);
      if (!item || !item.effect) return;
      // Используем универсальный тип level_down
      if (item.effect.type === "level_down") {
        const levelsToReduce = item.effect.value;
        const newLevel = Math.max(1, locationProgress[currentLocation].currentLevel - levelsToReduce);
        useGameStore.setState((state) => ({
          locationProgress: {
            ...state.locationProgress,
            [currentLocation]: {
              ...state.locationProgress[currentLocation],
              currentLevel: newLevel,
            },
          },
        }));
        removeItem(itemId, 1);
        useGameStore.getState().spawnEnemy();
        return;
      }

      if (!activeWaifu) {
        alert(t("ui.selectWaifuFirst"));
        return;
      }

      const result = useItem(itemId, activeWaifu.id);
      if (result.success && result.effect) {
        if (result.effect.type === "exp") {
          activeWaifu.addExp(result.effect.value);
        } else if (result.effect.type === "affection") {
          activeWaifu.addAffection(result.effect.value);
        }
        refreshWaifus();
      }
    },
    [inventory, currentLocation, locationProgress, activeWaifu, removeItem, useItem, refreshWaifus],
  );

  const handleCraft = useCallback(
    (item: TCraftableItem, quantity: number = 1) => {
      for (const ing of item.ingredients) {
        if (!removeItem(ing.itemId, ing.count * quantity)) {
          return;
        }
      }
      addItem(item.id, quantity);
    },
    [addItem, removeItem],
  );
  const handleWaifuSelect = useCallback(
    (waifuId: string) => {
      setActiveWaifu(waifuId);
      closePanel("waifuSelect");
    },
    [setActiveWaifu, closePanel],
  );

  const handlePauseSettings = useCallback(() => {
    closePanel("pause");
    openPanel("settings");
  }, [closePanel, openPanel]);

  const handlePauseMenu = useCallback(() => {
    closePanel("pause");
    onBack();
  }, [closePanel, onBack]);

  const handleWaifuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeWaifuId) {
        useGameStore.setState((state) => ({
          panels: { ...state.panels, waifuDetail: activeWaifuId },
        }));
      }
    },
    [activeWaifuId],
  );

  if (!activeWaifu || !enemy) {
    return <div className="game-loading">{t("ui.loading")}</div>;
  }

  return (
    <div className="game">
      <Background locationId={currentLocation} />
      <div className="cps-display" style={{ opacity: 0.9 }}>
        <span className="cps-value">{cps}</span>
        <span className="cps-label">{t("ui.cps")}</span>

        {isWarning && (
          <div className="cps-warning-popup">
            <span className="warning-title">{t("ui.cpsWarning")}</span>
            <span className="warning-subtitle">{t("ui.cpsWarningSubtitle")}</span>
          </div>
        )}
      </div>

      <header className="game-header">
        <div className="currency-display">
          <div className="currency-item">
            <Icon name="gem" size="md" />
            <span className="currency-value">{Math.floor(gems)}</span>
            {locationConfig && locationConfig.bonuses.gemMultiplier > 1 && (
              <span className="bonus-indicator">x{locationConfig.bonuses.gemMultiplier.toFixed(1)}</span>
            )}
          </div>
          <div className="currency-item essence">
            <Icon name="essence" size="md" />
            <span className="currency-value">{Math.floor(essence)}</span>
            {locationConfig && locationConfig.bonuses.essenceMultiplier > 1 && (
              <span className="bonus-indicator">x{locationConfig.bonuses.essenceMultiplier.toFixed(1)}</span>
            )}
          </div>
        </div>
        <button className="btn-icon-only" onClick={() => openPanel("pause")}>
          <Icon name="pause" size="md" />
        </button>
      </header>

      <nav className="game-sidebar">
        <button className="side-btn" onClick={() => openPanel("locationSelector")}>
          <Icon name={currentLocation} size="lg" />
          <span>{t("ui.location")}</span>
          <span className="side-badge">{currentLevel}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("gacha")}>
          <Icon name="gacha" size="lg" />
          <span>{t("ui.gacha")}</span>
          <span className="side-btn-cost">
            10
            <Icon name="essence" size="vsm" />
          </span>
        </button>
        <button className="side-btn" onClick={() => openPanel("collection")}>
          <Icon name="collection" size="lg" />
          <span>{t("ui.collection")}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("waifuSelect")}>
          <Icon name="waifus" size="lg" />
          <span>{t("ui.waifus")}</span>
          <span className="side-badge">{ownedWaifus.length}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("upgrades")}>
          <Icon name="upgrades" size="lg" />
          <span>{t("ui.upgrades")}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("backpack")}>
          <Icon name="backpack" size="lg" />
          <span>{t("ui.backpack")}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("craft")}>
          <Icon name="craft" size="lg" />
          <span>{t("ui.craft")}</span>
        </button>
        <button className="side-btn" onClick={() => openPanel("bestiary")}>
          <Icon name="book" size="lg" />
          <span>{t("ui.bestiary")}</span>
        </button>
      </nav>

      <main className="game-main">
        <div className="battle-arena">
          <div onClick={handleWaifuClick} className="waifu-clickable">
            <WaifuComponent />
          </div>
          <EnemyComponent
            enemy={enemy}
            activeWaifu={activeWaifu}
            isPaused={isGlobalPaused || isPaused}
            dropChanceMultiplier={locationConfig?.bonuses.dropChanceMultiplier ?? 1}
            onClick={handleEnemyClick}
          />
        </div>
      </main>

      <LocationSelector
        isOpen={panels.locationSelector}
        onClose={() => closePanel("locationSelector")}
        currentLocation={currentLocation}
        locationProgress={locationProgress}
        onLocationChange={handleLocationChange}
      />

      <GachaPanel isOpen={panels.gacha} onClose={() => closePanel("gacha")} />

      <CollectionPanel isOpen={panels.collection} onClose={() => closePanel("collection")} />

      <WaifuSelectPanel
        isOpen={panels.waifuSelect}
        onClose={() => closePanel("waifuSelect")}
        onSelect={handleWaifuSelect}
      />

      <UpgradePanel isOpen={panels.upgrades} onClose={() => closePanel("upgrades")} />

      <BackpackPanel
        isOpen={panels.backpack}
        onClose={() => closePanel("backpack")}
        onUseItem={handleUseItem}
        selectedWaifuId={activeWaifu?.id}
      />

      <WaifuDetailPanel
        isOpen={!!panels.waifuDetail}
        onClose={() => closePanel("waifuDetail")}
        waifuId={panels.waifuDetail}
      />

      <Pause
        isOpen={panels.pause}
        onClose={() => closePanel("pause")}
        onSettings={handlePauseSettings}
        onMenu={handlePauseMenu}
      />

      {panels.settings && (
        <Settings
          setIsSettings={() => closePanel("settings")}
          setCurrentLang={() => {}}
          isPaused={isGlobalPaused || isPaused}
        />
      )}

      <CraftPanel
        isOpen={panels.craft}
        onClose={() => closePanel("craft")}
        onCraft={handleCraft}
        onUseItem={handleUseItem}
        selectedWaifuId={activeWaifu?.id}
      />

      <BestiaryPanel isOpen={panels.bestiary} onClose={() => closePanel("bestiary")} />

      <CheatMenu
        onSetGems={(amount) => {
          const current = inventory.getItemCount("gem");
          if (amount > current) {
            addItem("gem", amount - current);
          } else if (amount < current) {
            removeItem("gem", current - amount);
          }
        }}
        onSetEssence={(amount) => {
          const current = inventory.getItemCount("essence");
          if (amount > current) {
            addItem("essence", amount - current);
          } else if (amount < current) {
            removeItem("essence", current - amount);
          }
        }}
        onKillEnemy={() => {
          if (enemy) {
            enemy.currentHp = 0;
            dealDamage(0, false);
          }
        }}
      />
    </div>
  );
});
