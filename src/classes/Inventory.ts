import type { TInventoryItem, TItemType, TCollectionCategory } from "../types";
import { INVENTORY_ITEMS } from "../game/constant";

export class Inventory {
  items: Map<string, TInventoryItem>;
  collection: Map<string, TCollectionCategory>;
  private _collectionCache: Map<string, TCollectionCategory> | null = null;

  constructor() {
    this.items = new Map();
    this.collection = new Map();
  }

  private invalidateCollectionCache(): void {
    this._collectionCache = null;
  }

  addItem(itemId: string, count: number = 1): void {
    const template = INVENTORY_ITEMS[itemId];
    if (!template) {
      console.warn(`Unknown item: ${itemId}`);
      return;
    }
    if (template.type === "collection") {
      const category = template.collectionCategory || "accessory";
      this.collection.set(itemId, category);
      this.invalidateCollectionCache();
      return;
    }
    const existing = this.items.get(itemId);
    const maxStack = template.maxStack || 99;
    if (existing) {
      const newCount = Math.min(existing.count + count, maxStack);
      existing.count = newCount;
    } else {
      this.items.set(itemId, {
        ...template,
        count: Math.min(count, maxStack),
      });
    }
    this.invalidateCollectionCache();
  }

  removeItem(itemId: string, count: number = 1): boolean {
    const existing = this.items.get(itemId);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) {
      this.items.delete(itemId);
      this.invalidateCollectionCache();
    }
    return true;
  }

  getItem(itemId: string): TInventoryItem | undefined {
    return this.items.get(itemId);
  }

  getItemCount(itemId: string): number {
    return this.items.get(itemId)?.count || 0;
  }

  getAllItems(): TInventoryItem[] {
    return Array.from(this.items.values()).filter((item) => item.type !== "collection");
  }

  getItemsByType(type: TItemType): TInventoryItem[] {
    return this.getAllItems().filter((item) => item.type === type);
  }

  hasItem(itemId: string, count: number = 1): boolean {
    const item = this.items.get(itemId);
    return item ? item.count >= count : false;
  }

  hasCollection(itemId: string): boolean {
    return this.collection.has(itemId);
  }

  getCollection(): ReadonlyMap<string, TCollectionCategory> {
    if (!this._collectionCache) {
      this._collectionCache = new Map(this.collection);
    }
    return this._collectionCache;
  }

  getCollectionByCategory(category: TCollectionCategory): string[] {
    return Array.from(this.collection.entries())
      .filter(([_, cat]) => cat === category)
      .map(([id]) => id);
  }

  useItem(itemId: string, waifuId?: string): { success: boolean; effect?: TInventoryItem["effect"]; message?: string } {
    const item = this.items.get(itemId);
    if (!item) return { success: false, message: "Item not found" };
    if (item.type !== "consumable" || !item.effect) {
      return { success: false, message: "Item is not usable" };
    }
    if (item.effect.target === "selected_waifu" && !waifuId) {
      return { success: false, message: "No waifu selected" };
    }
    this.removeItem(itemId, 1);
    return { success: true, effect: item.effect };
  }

  serialize(): string {
    return JSON.stringify({
      items: Array.from(this.items.entries()),
      collection: Array.from(this.collection.entries()),
    });
  }

  deserialize(data: string): Inventory {
    try {
      const parsed = JSON.parse(data);
      const newInventory = new Inventory();
      if (parsed.items && Array.isArray(parsed.items)) {
        newInventory.items = new Map(parsed.items);
      }
      if (parsed.collection && Array.isArray(parsed.collection)) {
        newInventory.collection = new Map(parsed.collection);
      }
      return newInventory;
    } catch (e) {
      console.error("Failed to deserialize inventory:", e);
      return new Inventory();
    }
  }

  clone(): Inventory {
    return this.deserialize(this.serialize());
  }
}
