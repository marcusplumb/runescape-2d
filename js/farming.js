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

// ── Greenhouse crop definitions ────────────────────────────────────────────
// growthDuration: seconds until fully grown
// yield.id: item ID — TODO: Agent 3 defines wheat/potato/herb_bundle items in items.js
export const GREENHOUSE_CROPS = {
  wheat:  { growthDuration: 180, yield: { id: 'wheat',        qty: 3 } },
  potato: { growthDuration: 240, yield: { id: 'potato',       qty: 2 } },
  herb:   { growthDuration: 300, yield: { id: 'herb_bundle',  qty: 1 } },
};

// ── FarmingState ───────────────────────────────────────────────────────────

export class FarmingState {
  constructor() {
    /**
     * Map<"gx,gy", Array<null | { seedId: string, plantedAt: number }>>
     * Each array has exactly PATCH_LOCAL_POSITIONS.length (6) slots.
     */
    this.patches = new Map();

    /**
     * Greenhouse patches — up to 12 slots, driven by tickGreenhouse(dt).
     * Each slot: { state: 'empty'|'seeded'|'growing'|'ready', cropType: string|null,
     *              growthTimer: number (seconds), growthDuration: number (seconds) }
     * Placed in interiors.js greenhouse room (rows 1-5, cols 1-7, 4×3 grid with spacing).
     */
    this.greenhousePatches = Array.from({ length: 12 }, () => ({
      state:          'empty',
      cropType:       null,
      growthTimer:    0,
      growthDuration: 0,
    }));
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

  // ── Greenhouse methods ────────────────────────────────────

  /**
   * Plant a crop in a greenhouse patch.
   * @param {number} patchIndex  0-11
   * @param {string} cropType    Key from GREENHOUSE_CROPS (e.g. 'wheat')
   * @param {number} growthDuration  Seconds until ready (use GREENHOUSE_CROPS[cropType].growthDuration)
   */
  plantGreenhouse(patchIndex, cropType, growthDuration) {
    const patch = this.greenhousePatches[patchIndex];
    if (!patch) return;
    patch.state          = 'seeded';
    patch.cropType       = cropType;
    patch.growthTimer    = 0;
    patch.growthDuration = growthDuration;
  }

  /**
   * Advance greenhouse growth timers by dt seconds.
   * At 50% of growthDuration: state → 'growing'.
   * At 100%: state → 'ready'.
   * Called automatically from tick() — do not call separately.
   * @param {number} dt  Elapsed seconds since last tick
   */
  tickGreenhouse(dt) {
    for (const patch of this.greenhousePatches) {
      if (patch.state !== 'seeded' && patch.state !== 'growing') continue;
      patch.growthTimer += dt;
      if (patch.growthTimer >= patch.growthDuration) {
        patch.state = 'ready';
      } else if (patch.growthTimer >= patch.growthDuration * 0.5) {
        patch.state = 'growing';
      }
    }
  }

  /**
   * Harvest a ready greenhouse patch. Returns the yield object or null.
   * The patch is reset to empty on success.
   * @param {number} patchIndex  0-11
   * @returns {{ id: string, qty: number }|null}
   */
  harvestGreenhouse(patchIndex) {
    const patch = this.greenhousePatches[patchIndex];
    if (!patch || patch.state !== 'ready') return null;
    const cropDef = GREENHOUSE_CROPS[patch.cropType];
    // Reset patch to empty
    patch.state          = 'empty';
    patch.cropType       = null;
    patch.growthTimer    = 0;
    patch.growthDuration = 0;
    if (!cropDef) return null;
    return { id: cropDef.yield.id, qty: cropDef.yield.qty };
  }

  /**
   * Main update tick — call this from game.js each frame (dt in seconds).
   * Drives greenhouse patch timers.
   * TODO: game.js — call farmingState.tick(dt) in the update loop (dt = deltaMs / 1000)
   * @param {number} dt  Elapsed seconds since last tick
   */
  tick(dt) {
    this.tickGreenhouse(dt);
  }

  toJSON() {
    // patches — only include non-empty cells to keep save file small
    const patches = {};
    for (const [k, v] of this.patches) {
      if (v.some(p => p !== null)) patches[k] = v;
    }

    // greenhousePatches — include all 12 slots so indices stay stable
    const greenhousePatches = this.greenhousePatches.map(p => ({
      state:          p.state,
      cropType:       p.cropType,
      growthTimer:    Math.round(p.growthTimer * 100) / 100, // 2dp precision
      growthDuration: p.growthDuration,
    }));

    return { patches, greenhousePatches };
  }

  fromJSON(data) {
    this.patches.clear();
    if (!data) return;

    // Support old format (bare object of patch arrays) or new { patches, greenhousePatches }
    const rawPatches = data.patches ?? data;
    if (rawPatches && typeof rawPatches === 'object' && !Array.isArray(rawPatches)) {
      for (const [k, v] of Object.entries(rawPatches)) {
        if (Array.isArray(v)) this.patches.set(k, v);
      }
    }

    // Restore greenhouse patches
    if (Array.isArray(data.greenhousePatches)) {
      for (let i = 0; i < Math.min(data.greenhousePatches.length, 12); i++) {
        const src = data.greenhousePatches[i];
        if (!src) continue;
        this.greenhousePatches[i] = {
          state:          src.state          ?? 'empty',
          cropType:       src.cropType       ?? null,
          growthTimer:    typeof src.growthTimer    === 'number' ? src.growthTimer    : 0,
          growthDuration: typeof src.growthDuration === 'number' ? src.growthDuration : 0,
        };
      }
    }
  }
}
