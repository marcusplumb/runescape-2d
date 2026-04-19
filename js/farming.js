/**
 * Farming system
 *
 * Seeds are planted in farming_plot cells inside the player house.
 * Each farming_plot cell contains rows of soil patches inside the 11×11
 * inner floor area.  Rows at local y = 1, 3, 5, 7, 9 (5 rows), each
 * spanning local x = 1..9 (9 patches per row) = 45 patches per cell.
 * Patches grow through 4 stages based on real wall-clock time.
 */

import { TILES } from './constants.js';

// ── Patch layout inside a farming_plot cell ────────────────────────────────
// localCol/localRow are offsets from cellInnerOrigin(gx, gy).
// 5 soil rows (y = 1,3,5,7,9) each 9 tiles wide (x = 1..9).
// Walking paths on y = 0,2,4,6,8,10.
export const FARM_PATCH_ROWS = [1, 3, 5, 7, 9];
export const FARM_PATCH_COL_MIN = 1;
export const FARM_PATCH_COL_MAX = 9;

/** All patch positions in row-major order (45 per farming_plot cell). */
export const PATCH_LOCAL_POSITIONS = (() => {
  const positions = [];
  for (const row of FARM_PATCH_ROWS) {
    for (let col = FARM_PATCH_COL_MIN; col <= FARM_PATCH_COL_MAX; col++) {
      positions.push({ localCol: col, localRow: row });
    }
  }
  return positions;
})();

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
    readyTile: TILES.FARM_POTATO_READY,
  },
  berry_seed: {
    id: 'berry_seed', name: 'Berry Seed',
    levelReq: 5,  growTime:  3 * 60 * 1000, xp: 30,
    harvestId: 'berries',   harvestMin: 4, harvestMax: 8,
    readyTile: TILES.FARM_BERRIES_READY,
  },
  herb_seed: {
    id: 'herb_seed', name: 'Herb Seed',
    levelReq: 10, growTime:  5 * 60 * 1000, xp: 50,
    harvestId: 'herb',      harvestMin: 2, harvestMax: 4,
    readyTile: TILES.FARM_HERB_READY,
  },
  flax_seed: {
    id: 'flax_seed', name: 'Flax Seed',
    levelReq: 15, growTime:  4 * 60 * 1000, xp: 40,
    harvestId: 'flax',      harvestMin: 3, harvestMax: 5,
    readyTile: TILES.FARM_FLAX_READY,
  },
  magic_seed: {
    id: 'magic_seed', name: 'Magic Seed',
    levelReq: 25, growTime: 10 * 60 * 1000, xp: 100,
    harvestId: 'magic_herb', harvestMin: 1, harvestMax: 2,
    readyTile: TILES.FARM_MAGIC_READY,
  },
  berry_bush_sapling: {
    id: 'berry_bush_sapling', name: 'Berry Bush Sapling',
    levelReq: 10, growTime: 5 * 60 * 1000, xp: 40,
    harvestId: 'berries', harvestMin: 3, harvestMax: 6,
    perpetual: true, regrowTime: 2 * 60 * 1000,
    readyTile: TILES.FARM_BERRY_BUSH,
    pickedTile: TILES.FARM_BERRY_EMPTY,
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
     * Each array has exactly PATCH_LOCAL_POSITIONS.length (45) slots.
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

  /**
   * Returns growth stage 0-4 based on elapsed time.
   * 0=empty, 1=seeded, 2=growing, 3=ready, 4=picked (perpetual regrowing)
   */
  getPatchStage(patch) {
    if (!patch || !patch.seedId) return 0;
    const def = SEED_DEFS[patch.seedId];
    if (!def) return 0;
    // Perpetual crop picked — check regrow timer
    if (patch.pickedAt != null) {
      const regrowElapsed = Date.now() - patch.pickedAt;
      if (regrowElapsed >= (def.regrowTime || def.growTime)) {
        patch.pickedAt = null; // regrown — clear picked state
        return 3;
      }
      return 4; // still regrowing
    }
    const elapsed = Date.now() - patch.plantedAt;
    if (elapsed >= def.growTime)         return 3; // ready
    if (elapsed >= def.growTime * 0.5)   return 2; // growing
    return 1;                                       // seeded
  }

  /** Returns the tile ID for a given patch based on its stage and seed type. */
  getPatchTile(patch) {
    const stage = this.getPatchStage(patch);
    if (!patch || !patch.seedId) return GROW_STAGES[0].tile;
    const def = SEED_DEFS[patch.seedId];
    if (stage === 3 && def && def.readyTile)  return def.readyTile;
    if (stage === 4 && def && def.pickedTile) return def.pickedTile;
    return GROW_STAGES[Math.min(stage, 3)].tile;
  }

  /** Pick berries from a perpetual crop (sets regrow timer instead of clearing). */
  pickPatch(gx, gy, patchIndex) {
    const arr = this.patches.get(`${gx},${gy}`);
    if (!arr) return null;
    const patch = arr[patchIndex];
    if (patch) patch.pickedAt = Date.now();
    return patch;
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
