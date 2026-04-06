import { useState, useEffect } from "react";
import { t } from "../../../../locales/i18n";
import { useGameStore } from "../../../../store/gameStore";
import { testWaifus, INVENTORY_ITEMS, COLLECTION_BUFFS } from "../../../../game/constant";
import type { TWaifu } from "../../../../types";
import { Waifu } from "../../../../classes/Waifu";
import "./CheatMenu.css";
import { useShallow } from "zustand/shallow";

interface CheatMenuProps {
  onSetGems: (amount: number) => void;
  onSetEssence: (amount: number) => void;
  onKillEnemy: () => void;
}

type CheatTab = "resources" | "waifus" | "items" | "buffs" | "battle" | "system";

export function CheatMenu({ onSetGems, onSetEssence, onKillEnemy }: CheatMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<CheatTab>("resources");
  const [resourceAmount, setResourceAmount] = useState<string>("1000");
  const [selectedWaifuId, setSelectedWaifuId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemCount, setItemCount] = useState<string>("1");

  const store = useGameStore();

  const gems = store.inventory.getItemCount("gem");
  const essence = store.inventory.getItemCount("essence");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Backquote") {
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
    store.addItem("gem", amount);
  };

  const handleAddEssence = () => {
    const amount = parseInt(resourceAmount) || 0;
    store.addItem("essence", amount);
  };

  const handleGetAllItems = () => {
    Object.keys(INVENTORY_ITEMS).forEach((itemId) => {
      const item = INVENTORY_ITEMS[itemId];
      if (item) {
        if (item.type === "collection") {
          store.addItem(itemId, 1);
        } else {
          store.addItem(itemId, item.maxStack || 99);
        }
      }
    });
  };

  const handleGetSelectedItem = () => {
    if (!selectedItemId) return;
    const count = parseInt(itemCount) || 1;
    const item = INVENTORY_ITEMS[selectedItemId];
    if (item?.type === "collection") {
      store.addItem(selectedItemId, 1);
    } else {
      store.addItem(selectedItemId, count);
    }
  };

  const handleClearInventory = () => {
    const newInventory = store.inventory.clone();
    newInventory.items.clear();
    newInventory.collection.clear();
    newInventory["invalidateCollectionCache"]();
    useGameStore.setState({ inventory: newInventory });
  };

  const handleGetAllWaifus = () => {
    testWaifus.forEach((template: TWaifu) => {
      const owned = store.ownedWaifus.find((w) => w.id === template.id);
      if (!owned) {
        const newWaifu = Waifu.fromTemplate(template);
        store.addWaifu(newWaifu);
      }
    });
  };

  const handleGetSelectedWaifu = () => {
    if (!selectedWaifuId) return;
    const template = testWaifus.find((w) => w.id === selectedWaifuId);
    if (!template) return;
    const owned = store.ownedWaifus.find((w) => w.id === selectedWaifuId);
    if (!owned) {
      const newWaifu = Waifu.fromTemplate(template);
      store.addWaifu(newWaifu);
    }
  };

  const handleMaxAllDuplicates = () => {
    const updatedWaifus = store.ownedWaifus.map((w) => {
      const newWaifu = w.clone();
      newWaifu.duplicateCount = 20;
      newWaifu.setGlobalUpgrades(store.globalUpgrades);
      return newWaifu;
    });
    useGameStore.setState({ ownedWaifus: updatedWaifus });
    store.refreshWaifus();
  };

  const handleMaxSelectedDuplicate = () => {
    if (!selectedWaifuId) return;
    const updatedWaifus = store.ownedWaifus.map((w) => {
      if (w.id === selectedWaifuId) {
        const newWaifu = w.clone();
        newWaifu.duplicateCount = 20;
        newWaifu.setGlobalUpgrades(store.globalUpgrades);
        return newWaifu;
      }
      return w;
    });
    useGameStore.setState({ ownedWaifus: updatedWaifus });
    store.refreshWaifus();
  };

  const handleDeleteSave = () => {
    localStorage.removeItem("harem-clicker-save-v2");
    localStorage.removeItem("harem-clicker-backup-v2");
    localStorage.removeItem("harem-clicker-last-save");
    window.location.reload();
  };

  const tabs: { id: CheatTab; label: string }[] = [
    { id: "resources", label: "Ресурсы" },
    { id: "waifus", label: "Вайфу" },
    { id: "items", label: "Предметы" },
    { id: "buffs", label: "Баффы" },
    { id: "battle", label: "Бой" },
    { id: "system", label: "Система" },
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
        <div className="cheat-hint">Нажмите ` чтобы закрыть</div>
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
                <button className="cheat-btn cheat-btn-danger" onClick={() => onSetGems(parseInt(resourceAmount) || 0)}>
                  =💎 Установить кристаллы
                </button>
                <button
                  className="cheat-btn cheat-btn-danger"
                  onClick={() => onSetEssence(parseInt(resourceAmount) || 0)}
                >
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
                  <option value="">-- Выберите --</option>
                  {testWaifus.map((w) => (
                    <option key={w.id} value={w.id}>
                      {t(`waifus.${w.nameKey}.name`)} ({w.rarity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cheat-buttons">
                <button className="cheat-btn" onClick={handleGetSelectedWaifu} disabled={!selectedWaifuId}>
                  👤 Получить выбранную
                </button>
                <button className="cheat-btn cheat-btn-primary" onClick={handleGetAllWaifus}>
                  👯 Получить всех
                </button>
                <button className="cheat-btn" onClick={handleMaxSelectedDuplicate} disabled={!selectedWaifuId}>
                  ⭐ Макс дубликат (выбранная)
                </button>
                <button className="cheat-btn cheat-btn-primary" onClick={handleMaxAllDuplicates}>
                  ⭐⭐ Макс дубликаты (все)
                </button>
              </div>
              <div className="cheat-owned">
                <h4>Имеющиеся: {store.ownedWaifus.length}</h4>
                <div className="cheat-waifu-list">
                  {store.ownedWaifus.map((w) => (
                    <span key={w.id} className={`cheat-waifu-tag rarity-${w.rarity}`}>
                      {w.name} ({w.duplicateCount}/20)
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
                <label>Выбрать предмет:</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="cheat-select"
                >
                  <option value="">-- Выберите --</option>
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
                <button className="cheat-btn" onClick={handleGetSelectedItem} disabled={!selectedItemId}>
                  📦 Получить выбранный
                </button>
                <button className="cheat-btn cheat-btn-primary" onClick={handleGetAllItems}>
                  🎒 Получить все
                </button>
                <button className="cheat-btn cheat-btn-danger" onClick={handleClearInventory}>
                  🗑️ Очистить инвентарь
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
                  const hasItem = store.inventory.hasCollection(itemId);
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
              </div>
            </div>
          )}
          {activeTab === "system" && (
            <div className="cheat-section">
              <h3>Система</h3>
              <div className="cheat-buttons">
                <button className="cheat-btn cheat-btn-danger" onClick={handleDeleteSave}>
                  🗑️ Удалить сохранение и перезагрузить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
