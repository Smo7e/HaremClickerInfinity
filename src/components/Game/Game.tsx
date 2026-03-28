import { useState, useEffect, useCallback } from "react";
import { t } from "../../locales/i18n";
import { Enemy, type TEnemyRewards } from "../../classes/Enemy";
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

interface Props {
  onBack: () => void;
  isPaused: boolean;
}

const INITIAL_COLLECTION: CollectionItem[] = [
  {
    id: "sword1",
    name: "Iron Sword",
    description: "Basic weapon",
    icon: "⚔️",
    rarity: "common",
    obtained: false,
    category: "weapon",
    bonus: "+10% DMG",
  },
];

export function Game({ onBack, isPaused: isGlobalPaused }: Props) {
  const [gems, setGems] = useState(0);
  const [essence, setEssence] = useState(10000);

  const [enemy, setEnemy] = useState<Enemy>(() => Enemy.spawn(1));
  const [enemyLevel, setEnemyLevel] = useState(1);

  const [ownedWaifus, setOwnedWaifus] = useState<Waifu[]>(() =>
    testWaifus.map((template) => Waifu.fromTemplate(template)),
  );
  const [activeWaifu, setActiveWaifu] = useState<Waifu | null>(null);

  const [globalUpgrades, setGlobalUpgrades] = useState({
    clickPowerBonus: 0,
    autoClickBonus: 0,
    critChanceBonus: 0,
  });

  const [collection] = useState<CollectionItem[]>(INITIAL_COLLECTION);

  const [showGacha, setShowGacha] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showWaifuSelect, setShowWaifuSelect] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [selectedWaifuDetail, setSelectedWaifuDetail] = useState<Waifu | null>(null);
  const [showPause, setShowPause] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleEnemyDefeated = useCallback(
    (rewards: TEnemyRewards) => {
      activeWaifu?.addExp(rewards.exp);
      setGems((prev) => prev + rewards.gems);
      if (rewards.essence) {
        setEssence((prev) => prev + (rewards.essence || 0));
      }

      const newLevel = enemyLevel + 1;
      setEnemyLevel(newLevel);
      setEnemy(Enemy.spawn(newLevel));
    },
    [enemyLevel, activeWaifu],
  );

  const handleDamageDealt = useCallback((damage: number, isCrit: boolean, element: string) => {
    damage;
    isCrit;
    element;
  }, []);

  const handleUpgrade = (type: string, cost: number) => {
    if (gems < cost) return;

    setGems((prev) => prev - cost);

    setGlobalUpgrades((prev) => {
      const next = { ...prev };
      switch (type) {
        case "click_power":
          next.clickPowerBonus += 1;
          break;
        case "auto_click":
          next.autoClickBonus += 0.5;
          break;
        case "crit_chance":
          next.critChanceBonus += 0.05;
          break;
      }
      return next;
    });

    setOwnedWaifus((prev) =>
      prev.map((waifu) => {
        const updated = new Waifu({
          id: waifu.id,
          nameKey: waifu.nameKey,
          rarity: waifu.rarity,
          element: waifu.element,
          image: waifu.image,
          description: waifu.description,
          baseStats: {
            clickPower: waifu.baseClickPower + (type === "click_power" ? 1 : 0),
            autoClick: waifu.baseAutoClick + (type === "auto_click" ? 0.5 : 0),
            critChance: waifu.baseCritChance + (type === "crit_chance" ? 0.05 : 0),
            critMultiplier: waifu.baseCritMultiplier,
          },
        });
        updated.stats = { ...waifu.stats };
        updated.unlockedOutfits = [...waifu.unlockedOutfits];
        updated.currentOutfit = waifu.currentOutfit;
        updated.duplicateCount = waifu.duplicateCount;
        return updated;
      }),
    );

    if (activeWaifu) {
      setActiveWaifu((prev) => {
        if (!prev) return null;
        return ownedWaifus.find((w) => w.id === prev.id) || prev;
      });
    }
  };

  const handleSummon = (waifu: Waifu, cost: number, isDuplicate: boolean) => {
    setEssence((prev) => prev - cost);

    if (isDuplicate) {
      setOwnedWaifus((prev) => prev.map((w) => (w.id === waifu.id ? waifu : w)));

      if (activeWaifu?.id === waifu.id) {
        setActiveWaifu(waifu);
      }
    } else {
      setOwnedWaifus((prev) => [...prev, waifu]);
    }
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
      </nav>

      <main className="game-main">
        <div className="battle-arena">
          <EnemyComponent
            enemy={enemy}
            activeWaifu={activeWaifu}
            onEnemyDefeated={handleEnemyDefeated}
            onDamageDealt={handleDamageDealt}
            isPaused={isGlobalPaused || showPause}
          />
          <div onClick={handleWaifuClick} className="waifu-clickable">
            <WaifuComponent waifu={activeWaifu} />
          </div>
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
          autoClick: Math.floor(globalUpgrades.autoClickBonus),
          critChance: Math.floor(globalUpgrades.critChanceBonus / 0.05),
        }}
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
