import { useState, useEffect, useCallback } from "react";
import { t } from "../../locales/i18n";
import { Enemy } from "../../classes/Enemy";
import { Waifu } from "../../classes/Waifu";
import { EnemyComponent } from "./components/EnemyComponent/EnemyComponent";
import { WaifuComponent } from "./components/WaifuComponent/WaifuComponent";
import { UpgradePanel } from "./components/UpgradePanel/UpgradePanel";
import { GachaPanel } from "./components/GachaPanel/GachaPanel";
import { CollectionPanel, type CollectionItem } from "./components/CollectionPanel/CollectionPanel";
import { WaifuSelectPanel } from "./components/WaifuSelectPanel/WaifuSelectPanel";
import { WaifuDetailPanel } from "./components/WaifuDetailPanel/WaifuDetailPanel";
import { Pause } from "./components/Pause/Pause";
import { Settings } from "../Settings/Settings";
import "./Game.css";
import { testWaifus } from "../../game/constant";
import { Icon } from "../Icon/Icon";
import { Background } from "./components/Background/Background";
import { Inventory } from "../../classes/Inventory";
import { BackpackPanel } from "./components/BackpackPanel/BackpackPanel";
import type { TElementType } from "../../types";

interface Props {
  onBack: () => void;
  isPaused: boolean;
}

const INITIAL_COLLECTION: CollectionItem[] = [
  {
    id: "sword1",
    nameKey: "ironSword",
    descriptionKey: "items.ironSword.desc",
    icon: "weapon",
    rarity: "common",
    obtained: false,
    category: "weapon",
    bonus: "+10% DMG",
  },
];
export interface IGlobalUpgrades {
  clickPowerBonus: number;
  elementDamage: Record<TElementType, number>;
}

export function Game({ onBack, isPaused: isGlobalPaused }: Props) {
  const [inventory, setInventory] = useState(() => new Inventory());

  const [enemy, setEnemy] = useState<Enemy>(() => Enemy.spawn(1));
  const [enemyLevel, setEnemyLevel] = useState(1);

  const [ownedWaifus, setOwnedWaifus] = useState<Waifu[]>(() =>
    testWaifus.map((template) => Waifu.fromTemplate(template)),
  );
  const [activeWaifu, setActiveWaifu] = useState<Waifu | null>(null);

  const [globalUpgrades, setGlobalUpgrades] = useState<IGlobalUpgrades>({
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
  });

  const [collection] = useState<CollectionItem[]>(INITIAL_COLLECTION);

  const [showGacha, setShowGacha] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showWaifuSelect, setShowWaifuSelect] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [selectedWaifuDetail, setSelectedWaifuDetail] = useState<Waifu | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showBackpack, setShowBackpack] = useState(false);

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

  const refreshInventory = useCallback(() => {
    setInventory((prev) => {
      const next = new Inventory();
      next.deserialize(prev.serialize());
      return next;
    });
  }, []);

  const handleEnemyDefeated = useCallback(
    (expReward: number, drops: Array<{ id: string; count: number }>) => {
      activeWaifu?.addExp(expReward);

      for (const drop of drops) {
        inventory.addItem(drop.id, drop.count);
      }

      refreshInventory();

      const newLevel = enemyLevel + 1;
      setEnemyLevel(newLevel);
      setEnemy(Enemy.spawn(newLevel));
    },
    [enemyLevel, activeWaifu, inventory, refreshInventory],
  );

  const handleUseItem = (itemId: string) => {
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

  return (
    <div className="game">
      <Background locationId="forest" />
      <header className="game-header">
        <div className="currency-display">
          <div className="currency-item">
            <Icon name="gem" size="md" />
            <span className="currency-value">{Math.floor(gems)}</span>
          </div>
          <div className="currency-item essence">
            <Icon name="essence" size="md" />
            <span className="currency-value">{Math.floor(essence)}</span>
          </div>
        </div>

        <button className="btn-icon-only" onClick={() => setShowPause(true)}>
          <Icon name="pause" size="md" />
        </button>
      </header>

      <nav className="game-sidebar">
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
          <Icon name="back" size="lg" />
          <span>{t("ui.backpack")}</span>
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
          />
        </div>
      </main>

      <GachaPanel
        isOpen={showGacha}
        onClose={() => setShowGacha(false)}
        essence={essence}
        ownedWaifus={ownedWaifus}
        onSummon={handleSummon}
      />

      <CollectionPanel isOpen={showCollection} onClose={() => setShowCollection(false)} items={collection} />

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
    </div>
  );
}
