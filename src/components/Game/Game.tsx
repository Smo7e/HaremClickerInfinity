import { useCallback, memo, useEffect } from "react";
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

import { CraftPanel, TCraftableItem } from "./components/CraftPanel/CraftPanel";
import { BestiaryPanel } from "./components/BestiaryPanel/BestiaryPanel";
import { useCPS } from "../../hooks/useCPS";
import { TInventoryItemId } from "../../types";
import { audioManager } from "../../audio/AudioManager";
import { AdPanel } from "./components/AdPanel/AdPanel";
import { adService } from "../../services/AdService";
import { useLeaderboard } from "../../hooks/useLeaderboard";

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
  const setPaused = useGameStore((state) => state.setPaused);

  const { handleClick, currentLevel, locationConfig } = useBattle();
  const { cps, isWarning, recordClick } = useCPS();
  const { rank, isAuthorized: isLeaderboardAuth, isLoading, hasImproved } = useLeaderboard();

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

  useEffect(() => {
    setPaused(panels.pause);
  }, [panels.pause, setPaused]);

  const handleLocationChange = useCallback(
    (location: typeof currentLocation) => {
      changeLocation(location);
      closePanel("locationSelector");
    },
    [changeLocation, closePanel],
  );

  const handleUseItem = useCallback(
    (itemId: TInventoryItemId) => {
      const item = inventory.getItem(itemId);
      if (!item || !item.effect) return;

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

  useEffect(() => {
    if (!isPaused) {
      adService.startGameplay();
      audioManager.setMuted(false);
    } else {
      adService.stopGameplay();
      audioManager.setMuted(true);
    }
  }, [isPaused]);

  useEffect(() => {
    // Предотвращает масштабирование двойным тапом на iOS/Android
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    // ИСПРАВЛЕННЫЙ обработчик — блокируем только pull-to-refresh, не скролл панелей
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      // Разрешаем скролл внутри панелей и туториала
      const isInScrollablePanel =
        target.closest(".panel") ||
        target.closest(".panel-content") ||
        target.closest(".panel-scroll-content") ||
        target.closest(".tutorial-scroll-content") ||
        target.closest(".game-sidebar") || // Важно для навигации!
        target.closest(".backpack-panel") ||
        target.closest(".craft-panel") ||
        target.closest(".settings-modal") ||
        target.closest(".collection-panel") ||
        target.closest(".bestiary-panel") ||
        target.closest(".waifu-select-panel") ||
        target.closest(".gacha-panel") ||
        target.closest(".upgrade-panel-modal") ||
        target.closest(".location-selector-panel") ||
        target.closest(".ad-panel") ||
        target.closest(".pause-panel") ||
        target.closest(".waifu-detail-panel") ||
        target.closest(".drop-pool-panel");

      if (isInScrollablePanel) {
        return; // Не блокируем — пусть скроллится
      }

      const isAtTop = window.scrollY === 0;
      const isPullDown = e.touches[0] && e.touches[0].clientY > 0;

      if (isAtTop && isPullDown && e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

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
    adService.showFullscreenAd();
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
    <div className="game-layout">
      <Background locationId={currentLocation} />

      {/* --- HEADER AREA --- */}
      {/* --- HEADER AREA --- */}
      <header className="game-header">
        {/* Центр: Валюты и Кнопки управления (Реклама/Пауза) */}
        <div className="currency-display">
          {/* Кнопка Рекламы (теперь слева от валют) */}
          <button
            className="btn-icon-only ads-btn header-control-btn"
            onClick={() => {
              openPanel("ads");
              audioManager.playSFX("panel_click");
            }}
            aria-label={t("ui.ads")}
          >
            <Icon name="play" size="md" />
          </button>

          {/* Валюты */}
          <div className="currency-item gem">
            <Icon name="gem" size="sm" />
            <span className="currency-value">{Math.floor(gems)}</span>
            {locationConfig && locationConfig.bonuses.gemMultiplier > 1 && (
              <span className="bonus-indicator">x{locationConfig.bonuses.gemMultiplier.toFixed(1)}</span>
            )}
          </div>

          <div className="currency-item essence">
            <Icon name="essence" size="sm" />
            <span className="currency-value">{Math.floor(essence)}</span>
            {locationConfig && locationConfig.bonuses.essenceMultiplier > 1 && (
              <span className="bonus-indicator">x{locationConfig.bonuses.essenceMultiplier.toFixed(1)}</span>
            )}
          </div>

          {/* Кнопка Паузы (теперь справа от валют) */}
          <button
            className="btn-icon-only pause-btn header-control-btn"
            onClick={() => openPanel("pause")}
            aria-label={t("ui.pause")}
          >
            <Icon name="pause" size="md" />
          </button>
        </div>
      </header>

      {/* --- SIDEBAR AREA --- */}
      <nav className="game-sidebar">
        {/* ... содержимое сайдбара остается прежним ... */}
        <button
          className="side-btn"
          onClick={() => {
            openPanel("locationSelector");
            audioManager.playSFX("panel_click");
            adService.showFullscreenAd();
          }}
        >
          <Icon name={currentLocation} size="lg" />
          <span>{t("ui.location")}</span>
          <span className="side-badge">{currentLevel}</span>
        </button>
        {/* ... остальные кнопки сайдбара ... */}
        <button
          className="side-btn"
          onClick={() => {
            openPanel("gacha");
            adService.showFullscreenAd();
            audioManager.playSFX("panel_click");
          }}
        >
          <Icon name="gacha" size="lg" />
          <span>{t("ui.gacha")}</span>
          <span className="side-btn-cost">
            10
            <Icon name="essence" size="vsm" />
          </span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("collection");
            audioManager.playSFX("panel_click");
            adService.showFullscreenAd();
          }}
        >
          <Icon name="collection" size="lg" />
          <span>{t("ui.collection")}</span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("waifuSelect");
            audioManager.playSFX("panel_click");
          }}
        >
          <Icon name="waifus" size="lg" />
          <span>{t("ui.waifus")}</span>
          <span className="side-badge">{ownedWaifus.length}</span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("upgrades");
            audioManager.playSFX("panel_click");
          }}
        >
          <Icon name="upgrades" size="lg" />
          <span>{t("ui.upgrades")}</span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("backpack");
            audioManager.playSFX("panel_click");
          }}
        >
          <Icon name="backpack" size="lg" />
          <span>{t("ui.backpack")}</span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("craft");
            audioManager.playSFX("panel_click");
          }}
        >
          <Icon name="craft" size="lg" />
          <span>{t("ui.craft")}</span>
        </button>
        <button
          className="side-btn"
          onClick={() => {
            openPanel("bestiary");
            audioManager.playSFX("panel_click");
            adService.showFullscreenAd();
          }}
        >
          <Icon name="book" size="lg" />
          <span>{t("ui.bestiary")}</span>
        </button>
      </nav>

      {/* --- MAIN AREA (BATTLE ARENA) --- */}
      <main className="game-main">
        <div className="cps-display">
          <span className="cps-value">{cps}</span>
          <span className="cps-label">{t("ui.cps")}</span>
          {isLeaderboardAuth && (
            <div className={`leaderboard-rank ${hasImproved ? "improved" : ""} ${isLoading ? "loading" : ""}`}>
              <span className="rank-icon">🏆</span>
              {isLoading ? (
                <span className="rank-spinner">⟳</span>
              ) : rank !== null ? (
                <span className="rank-value">#{rank}</span>
              ) : (
                <span className="rank-value">-</span>
              )}
              {/* Индикатор что есть несохранённый прогресс */}
              {hasImproved && !isLoading && <span className="rank-pending">↑</span>}
            </div>
          )}
          {isWarning && (
            <div className="cps-warning-popup">
              <span className="warning-title">{t("ui.cpsWarning")}</span>
              <span className="warning-subtitle">{t("ui.cpsWarningSubtitle")}</span>
            </div>
          )}
        </div>

        <div className="battle-arena">
          <div onClick={handleWaifuClick} className="waifu-clickable">
            <WaifuComponent />
          </div>
          <EnemyComponent
            enemy={enemy}
            activeWaifu={activeWaifu}
            isPaused={isGlobalPaused || isPaused}
            onClick={handleEnemyClick}
          />
        </div>
      </main>

      {/* ... Панели остаются прежними ... */}
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
      <AdPanel isOpen={panels.ads} onClose={() => closePanel("ads")} />
    </div>
  );
});
