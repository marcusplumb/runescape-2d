import { INV_SLOTS } from './constants.js';

/**
 * Each slot: { item: ItemDef, qty: number } or null
 */
export class Inventory {
  constructor() {
    this.slots = new Array(INV_SLOTS).fill(null);
  }

  /**
   * Add item to inventory. Returns true if successful.
   * Stackable items merge into existing stacks first.
   */
  add(itemDef, qty = 1) {
    if (itemDef.stackable) {
      // Find existing stack
      const idx = this.slots.findIndex(s => s && s.item.id === itemDef.id);
      if (idx !== -1) {
        this.slots[idx].qty += qty;
        return true;
      }
    }
    // Find empty slot
    const empty = this.slots.findIndex(s => s === null);
    if (empty === -1) return false; // inventory full
    this.slots[empty] = { item: itemDef, qty };
    return true;
  }

  /**
   * Remove qty of an item by id. Returns true if successful.
   */
  remove(itemId, qty = 1) {
    const idx = this.slots.findIndex(s => s && s.item.id === itemId);
    if (idx === -1) return false;
    this.slots[idx].qty -= qty;
    if (this.slots[idx].qty <= 0) {
      this.slots[idx] = null;
    }
    return true;
  }

  /** Check if inventory contains at least qty of item */
  has(itemId, qty = 1) {
    const slot = this.slots.find(s => s && s.item.id === itemId);
    return slot ? slot.qty >= qty : false;
  }

  /** Count of a specific item */
  count(itemId) {
    const slot = this.slots.find(s => s && s.item.id === itemId);
    return slot ? slot.qty : 0;
  }

  /** Is inventory completely full (no empty slots)? */
  isFull() {
    return this.slots.every(s => s !== null);
  }

  /** Total items across all slots */
  get usedSlots() {
    return this.slots.filter(s => s !== null).length;
  }

  /** Swap the contents of two slot indices (works even if one is empty) */
  swap(idxA, idxB) {
    const tmp = this.slots[idxA];
    this.slots[idxA] = this.slots[idxB];
    this.slots[idxB] = tmp;
  }

  /** Find first slot index containing a cookable raw fish */
  findCookable(cookRecipes) {
    return this.slots.findIndex(s => s && cookRecipes[s.item.id]);
  }
}
