/**
 * Farming system
 *
 * Seeds are planted in farming_plot cells inside the player house.
 * Each farming_plot cell contains 6 fixed patch positions arranged in a
 * 3-column × 2-row grid inside the 11×11 inner floor area.
 * Patches grow through 4 stages based on real wall-clock time.
 */

import { TILES } from './constants.js';

// ── Patch layout inside a farming_plot cell ────────────────────────────────
// localCol/localRow are offsets from cellInnerOrigin(gx, gy).
// The 11-wide inner area: columns 0-10, rows 0-10.
export const PATCH_LOCAL_POSITIONS = [
  { localCol: 1, localRow: 2 }, { localCol: 4, localRow: 2 }, { localCol: 7, localRow: 2 },
  { localCol: 1, localRow: 6 }, { localCol: 4, localRow: 6 }, { localCol: 7, localRow: 6 },
];

// ── Growth stage → tile ID ─────────────────────────────────────────────────
export const GROW_STAGES = [
  { name: 'Empty',   tile: TILES.FARM_PATCH },
  { name: 'Seeded',  tile: TILES.FARM_PATCH_SEEDED },
  { name: 'Growing', tile: TILES.FARM_PATCH_GROWING },
  { name: 'Ready',   tile: TILES.FARM_PATCH_READY },
];

// ── Seed definitions ───────────────────────────────────────────────────────
// growTime  : milliseconds until fully grown
// xp        : Farming XP awarded on harvest
// harvestMin/Max : random quantity range
export const SEED_DEFS = {
  potato_seed: {
    id: 'potato_seed', name: 'Potato Seed',
    levelReq: 1,  growTime:  2 * 60 * 1000, xp: 20,
    harvestId: 'potato',    harvestMin: 3, harvestMax: 6,
  },
  berry_seed: {
    id: 'berry_seed', name: 'Berry Seed',
    levelReq: 5,  growTime:  3 * 60 * 1000, xp: 30,
    harvestId: 'berries',   harvestMin: 4, harvestMax: 8,
  },
  herb_seed: {
    id: 'herb_seed', name: 'Herb Seed',
    levelReq: 10, growTime:  5 * 60 * 1000, xp: 50,
    harvestId: 'herb',      harvestMin: 2, harvestMax: 4,
  },
  flax_seed: {
    id: 'flax_seed', name: 'Flax Seed',
    levelReq: 15, growTime:  4 * 60 * 1000, xp: 40,
    harvestId: 'flax',      harvestMin: 3, harvestMax: 5,
  },
  magic_seed: {
    id: 'magic_seed', name: 'Magic Seed',
    levelReq: 25, growTime: 10 * 60 * 1000, xp: 100,
    harvestId: 'magic_herb', harvestMin: 1, harvestMax: 2,
  },
};

// ── FarmingState ───────────────────────────────────────────────────────────

export class FarmingState {
  constructor() {
    /**
     * Map<"gx,gy", Array<null | { seedId: string, plantedAt: number }>>
     * Each array has exactly PATCH_LOCAL_POSITIONS.length (6) slots.
     */
    this.patches = new Map();
  }

  _ensureCell(gx, gy) {
    const k = `${gx},${gy}`;
    if (!this.patches.has(k)) {
      this.patches.set(k, new Array(PATCH_LOCAL_POSITIONS.length).fill(null));
    }
    return this.patches.get(k);
  }

  getPatch(gx, gy, patchIndex) {
    const arr = this.patches.get(`${gx},${gy}`);
    return arr ? (arr[patchIndex] ?? null) : null;
  }

  /** Returns growth stage 0-3 based on elapsed time. */
  getPatchStage(patch) {
    if (!patch || !patch.seedId) return 0;
    const def = SEED_DEFS[patch.seedId];
    if (!def) return 0;
    const elapsed = Date.now() - patch.plantedAt;
    if (elapsed >= def.growTime)         return 3; // ready
    if (elapsed >= def.growTime * 0.5)   return 2; // growing
    return 1;                                       // seeded
  }

  plantSeed(gx, gy, patchIndex, seedId) {
    const arr = this._ensureCell(gx, gy);
    arr[patchIndex] = { seedId, plantedAt: Date.now() };
  }

  /** Clears the patch and returns the patch object (or null). */
  harvestPatch(gx, gy, patchIndex) {
    const arr = this.patches.get(`${gx},${gy}`);
    if (!arr) return null;
    const patch = arr[patchIndex];
    arr[patchIndex] = null;
    return patch;
  }

  toJSON() {
    const out = {};
    for (const [k, v] of this.patches) {
      if (v.some(p => p !== null)) out[k] = v;
    }
    return out;
  }

  fromJSON(data) {
    this.patches.clear();
    if (!data) return;
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) this.patches.set(k, v);
    }
  }
}
