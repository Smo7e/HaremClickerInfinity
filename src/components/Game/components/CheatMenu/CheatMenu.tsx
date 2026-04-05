import { useState, useEffect } from "react";
import { t } from "../../../../locales/i18n";
import { Waifu } from "../../../../classes/Waifu";
import { Inventory } from "../../../../classes/Inventory";
import { testWaifus, INVENTORY_ITEMS, COLLECTION_BUFFS } from "../../../../game/constant";
import type { TElementType, TCollectionCategory } from "../../../../types";
import "./CheatMenu.css";

interface CheatMenuProps {
  inventory: Inventory;
  ownedWaifus: Waifu[];
  onInventoryUpdate: () => void;
  onWaifuAdd: (waifu: Waifu) => void;
  onSetGems: (amount: number) => void;
  onSetEssence: (amount: number) => void;
  onKillEnemy: () => void;
  onLevelUp: () => void;
  gems: number;
  essence: number;
}

type CheatTab = "resources" | "waifus" | "items" | "buffs" | "battle";

export function CheatMenu({
  inventory,
  ownedWaifus,
  onInventoryUpdate,
  onWaifuAdd,
  onSetGems,
  onSetEssence,
  onKillEnemy,
  onLevelUp,
  gems,
  essence,
}: CheatMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CheatTab>("resources");
  const [resourceAmount, setResourceAmount] = useState<string>("1000");
  const [selectedWaifuId, setSelectedWaifuId] = useState<string>(testWaifus[0]?.id || "");
  const [selectedItemId, setSelectedItemId] = useState<string>("gem");
  const [itemCount, setItemCount] = useState<string>("10");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "~" || e.key === "F12") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const handleAddGems = () => {
    const amount = parseInt(resourceAmount) || 0;
    for (let i = 0; i < amount; i++) {
      inventory.addItem("gem", 1);
    }
    onInventoryUpdate();
  };

  const handleAddEssence = () => {
    const amount = parseInt(resourceAmount) || 0;
    for (let i = 0; i < amount; i++) {
      inventory.addItem("essence", 1);
    }
    onInventoryUpdate();
  };

  const handleSetGems = () => {
    const amount = parseInt(resourceAmount) || 0;
    onSetGems(amount);
  };

  const handleSetEssence = () => {
    const amount = parseInt(resourceAmount) || 0;
    onSetEssence(amount);
  };

  const handleSpawnWaifu = () => {
    const template = testWaifus.find((w) => w.id === selectedWaifuId);
    if (!template) return;

    const existing = ownedWaifus.find((w) => w.id === selectedWaifuId);
    if (existing) {
      existing.addDuplicate();
      onWaifuAdd(existing);
    } else {
      const newWaifu = Waifu.fromTemplate(template);
      onWaifuAdd(newWaifu);
    }
  };

  const handleSpawnAllWaifus = () => {
    testWaifus.forEach((template) => {
      const existing = ownedWaifus.find((w) => w.id === template.id);
      if (existing) {
        existing.addDuplicate();
        onWaifuAdd(existing);
      } else {
        const newWaifu = Waifu.fromTemplate(template);
        onWaifuAdd(newWaifu);
      }
    });
  };

  const handleMaxAllWaifus = () => {
    ownedWaifus.forEach((waifu) => {
      while (!waifu.isMaxed()) {
        waifu.addDuplicate();
      }
    });
    onInventoryUpdate();
  };

  const handleAddItem = () => {
    const count = parseInt(itemCount) || 1;
    inventory.addItem(selectedItemId, count);
    onInventoryUpdate();
  };

  const handleAddAllItems = () => {
    Object.keys(INVENTORY_ITEMS).forEach((itemId) => {
      const item = INVENTORY_ITEMS[itemId];
      if (item.type !== "currency") {
        inventory.addItem(itemId, 99);
      }
    });
    onInventoryUpdate();
  };

  const handleAddAllCollection = () => {
    Object.keys(INVENTORY_ITEMS).forEach((itemId) => {
      const item = INVENTORY_ITEMS[itemId];
      if (item.type === "collection") {
        inventory.addItem(itemId, 1);
      }
    });
    onInventoryUpdate();
  };

  const handleClearInventory = () => {
    const items = inventory.getAllItems();
    items.forEach((item) => {
      inventory.removeItem(item.id, item.count);
    });
    onInventoryUpdate();
  };

  const tabs: { id: CheatTab; label: string }[] = [
    { id: "resources", label: "Ресурсы" },
    { id: "waifus", label: "Вайфу" },
    { id: "items", label: "Предметы" },
    { id: "buffs", label: "Баффы" },
    { id: "battle", label: "Бой" },
  ];

  const itemOptions = Object.entries(INVENTORY_ITEMS).map(([id, item]) => ({
    id,
    name: t(`items.${item.nameKey}.name`),
    type: item.type,
  }));

  return (
    <div className="cheat-overlay" onClick={() => setIsVisible(false)}>
      <div className="cheat-menu" onClick={(e) => e.stopPropagation()}>
        <div className="cheat-header">
          <h2>🛠️ DEBUG MENU</h2>
          <button className="cheat-close" onClick={() => setIsVisible(false)}>
            ✕
          </button>
        </div>

        <div className="cheat-hint">Нажмите ` или F12 чтобы закрыть</div>

        <div className="cheat-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`cheat-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cheat-content">
          {activeTab === "resources" && (
            <div className="cheat-section">
              <h3>Ресурсы</h3>
              <div className="cheat-current">
                <span>💎 {gems}</span>
                <span>✨ {essence}</span>
              </div>
              <div className="cheat-input-group">
                <label>Количество:</label>
                <input
                  type="number"
                  value={resourceAmount}
                  onChange={(e) => setResourceAmount(e.target.value)}
                  className="cheat-input"
                />
              </div>
              <div className="cheat-buttons">
                <button className="cheat-btn" onClick={handleAddGems}>
                  +💎 Добавить кристаллы
                </button>
                <button className="cheat-btn" onClick={handleAddEssence}>
                  +✨ Добавить эссенцию
                </button>
                <button className="cheat-btn cheat-btn-danger" onClick={handleSetGems}>
                  =💎 Установить кристаллы
                </button>
                <button className="cheat-btn cheat-btn-danger" onClick={handleSetEssence}>
                  =✨ Установить эссенцию
                </button>
              </div>
            </div>
          )}

          {activeTab === "waifus" && (
            <div className="cheat-section">
              <h3>Вайфу</h3>
              <div className="cheat-input-group">
                <label>Выбрать вайфу:</label>
                <select
                  value={selectedWaifuId}
                  onChange={(e) => setSelectedWaifuId(e.target.value)}
                  className="cheat-select"
                >
                  {testWaifus.map((w) => (
                    <option key={w.id} value={w.id}>
                      {t(`waifus.${w.nameKey}.name`)} ({w.rarity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cheat-buttons">
                <button className="cheat-btn" onClick={handleSpawnWaifu}>
                  Призвать вайфу
                </button>
                <button className="cheat-btn" onClick={handleSpawnAllWaifus}>
                  Призвать всех вайфу
                </button>
                <button className="cheat-btn cheat-btn-warning" onClick={handleMaxAllWaifus}>
                  Макс. дубликаты всем
                </button>
              </div>
              <div className="cheat-owned">
                <h4>Имеющиеся: {ownedWaifus.length}</h4>
                <div className="cheat-waifu-list">
                  {ownedWaifus.map((w) => (
                    <span key={w.id} className={`cheat-waifu-tag rarity-${w.rarity}`}>
                      {w.name} ({w.duplicateCount})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "items" && (
            <div className="cheat-section">
              <h3>Предметы</h3>
              <div className="cheat-input-group">
                <label>Предмет:</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="cheat-select"
                >
                  {itemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} [{item.type}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="cheat-input-group">
                <label>Количество:</label>
                <input
                  type="number"
                  value={itemCount}
                  onChange={(e) => setItemCount(e.target.value)}
                  className="cheat-input"
                  min="1"
                  max="999"
                />
              </div>
              <div className="cheat-buttons">
                <button className="cheat-btn" onClick={handleAddItem}>
                  Добавить предмет
                </button>
                <button className="cheat-btn" onClick={handleAddAllItems}>
                  Все предметы x99
                </button>
                <button className="cheat-btn cheat-btn-success" onClick={handleAddAllCollection}>
                  Все коллекционные
                </button>
                <button className="cheat-btn cheat-btn-danger" onClick={handleClearInventory}>
                  Очистить инвентарь
                </button>
              </div>
            </div>
          )}

          {activeTab === "buffs" && (
            <div className="cheat-section">
              <h3>Коллекционные баффы</h3>
              <div className="cheat-buffs-list">
                {Object.entries(COLLECTION_BUFFS).map(([itemId, buff]) => {
                  const item = INVENTORY_ITEMS[itemId];
                  const hasItem = inventory.hasCollection(itemId);
                  return (
                    <div key={itemId} className={`cheat-buff-item ${hasItem ? "owned" : ""}`}>
                      <span className="cheat-buff-name">{item ? t(`items.${item.nameKey}.name`) : itemId}</span>
                      <span className="cheat-buff-desc">{t(buff.descriptionKey)}</span>
                      <span className="cheat-buff-status">{hasItem ? "✅" : "❌"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "battle" && (
            <div className="cheat-section">
              <h3>Бой</h3>
              <div className="cheat-buttons">
                <button className="cheat-btn cheat-btn-danger" onClick={onKillEnemy}>
                  💀 Убить врага
                </button>
                <button className="cheat-btn" onClick={onLevelUp}>
                  ⬆️ Увеличить уровень локации
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
