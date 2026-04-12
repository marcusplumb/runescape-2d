/**
 * Player Housing System
 *
 * Grid-based expandable house tied to the Architect skill.
 * The player house interior (90×90 tiles) contains a 6×6 grid of "cells".
 * Each cell is CELL_SIZE×CELL_SIZE tiles and can be an indoor room or
 * an outdoor plot. Cells must be placed adjacent to owned cells.
 */

import { TILES, SKILL_IDS } from './constants.js';

// ── Large Storage Chest ───────────────────────────────────────────────────
/** Slot capacity of the large chest when unlocked (Architect level 5 required).
 *  TODO: game.js — check skills[9] >= 5 before calling housingState.unlockLargeChest()
 */
export const LARGE_CHEST_CAPACITY = 112;

// ── Produce timers (seconds) per animal type ──────────────────────────────
const ANIMAL_PRODUCE_TIMERS = {
  chicken: 600,
  cow:     1200,
  sheep:   900,
};

// ── Produce item IDs per animal type ─────────────────────────────────────
// TODO: Agent 3 — egg/milk/wool_ball item IDs must exist in items.js
const ANIMAL_PRODUCE_IDS = {
  chicken: 'egg',
  cow:     'milk',
  sheep:   'wool_ball',
};

// ── Grid constants ────────────────────────────────────────────────────────
export const CELL_SIZE     = 13;   // tile size per cell including outer walls
export const CELL_INNER    = 11;   // inner walkable floor width/height
export const GRID_COLS     = 6;
export const GRID_ROWS     = 6;
export const GRID_OFFSET_C = 6;    // tile col where grid (0,0) top-left starts
export const GRID_OFFSET_R = 6;    // tile row where grid (0,0) top-left starts
export const START_GX      = 2;    // starter cell grid col
export const START_GY      = 2;    // starter cell grid row

// Build-mode panel dimensions (used by both renderer and click-handler)
export const BM_PW          = 600;  // panel width  (pixels)
export const BM_PH          = 450;  // panel height (pixels)
export const BM_HEADER_H    = 40;
export const BM_GRID_CELL   = 38;  // each cell square in the UI grid
export const BM_GRID_OFF    = 24;  // left pad inside grid section
export const BM_GRID_TOP    = BM_HEADER_H + 16;
export const BM_SPLIT_X     = BM_GRID_OFF * 2 + GRID_COLS * BM_GRID_CELL + 4; // ≈ 284

/** Tile col/row of a cell's top-left corner (outer wall). */
export function cellOrigin(gx, gy) {
  return {
    col: GRID_OFFSET_C + gx * CELL_SIZE,
    row: GRID_OFFSET_R + gy * CELL_SIZE,
  };
}

/** Tile col/row of a cell's inner floor top-left corner. */
export function cellInnerOrigin(gx, gy) {
  const o = cellOrigin(gx, gy);
  return { col: o.col + 1, row: o.row + 1 };
}

// ── Room definitions ──────────────────────────────────────────────────────
// category: 'indoor' | 'outdoor'
// materials: [{ itemId, qty }]   — must match item IDs from items.js

export const ROOM_DEFS = {
  starter: {
    id: 'starter', name: 'Starter Room',
    category: 'indoor',
    desc: 'The room where your adventure begins.',
    levelReq: 1, goldCost: 0, materials: [],
    floorTile: TILES.PLANK,
    color: '#5a3a18',
  },
  living_room: {
    id: 'living_room', name: 'Living Room',
    category: 'indoor',
    desc: 'A comfortable space to relax and entertain.',
    levelReq: 5, goldCost: 100, materials: [{ itemId: 'logs', qty: 10 }],
    floorTile: TILES.PLANK,
    color: '#6b4a22',
  },
  workshop: {
    id: 'workshop', name: 'Workshop',
    category: 'indoor',
    desc: 'A room for crafting, smithing, and tinkering.',
    levelReq: 10, goldCost: 200,
    materials: [{ itemId: 'logs', qty: 15 }, { itemId: 'bar_iron', qty: 3 }],
    floorTile: TILES.STONE,
    color: '#4a4a4a',
  },
  bedroom: {
    id: 'bedroom', name: 'Bedroom',
    category: 'indoor',
    desc: 'A peaceful room for rest.',
    levelReq: 15, goldCost: 150,
    materials: [{ itemId: 'oak_logs', qty: 8 }],
    floorTile: TILES.PLANK,
    color: '#7a5040',
  },
  kitchen: {
    id: 'kitchen', name: 'Kitchen',
    category: 'indoor',
    desc: 'Prepare and cook food here.',
    levelReq: 20, goldCost: 250,
    materials: [{ itemId: 'oak_logs', qty: 12 }, { itemId: 'bar_iron', qty: 5 }],
    floorTile: TILES.STONE,
    color: '#7a6840',
  },
  library: {
    id: 'library', name: 'Library',
    category: 'indoor',
    desc: 'A quiet room of knowledge and study.',
    levelReq: 25, goldCost: 300,
    materials: [{ itemId: 'oak_logs', qty: 20 }],
    floorTile: TILES.PLANK,
    color: '#3a2a10',
  },
  storage: {
    id: 'storage', name: 'Storeroom',
    category: 'indoor',
    desc: 'Keep your extra belongings safely stored.',
    levelReq: 30, goldCost: 200,
    materials: [{ itemId: 'logs', qty: 20 }, { itemId: 'bar_iron', qty: 5 }],
    floorTile: TILES.PLANK,
    color: '#5a3820',
  },
  trophy_room: {
    id: 'trophy_room', name: 'Trophy Room',
    category: 'indoor',
    desc: 'Display your greatest achievements.',
    levelReq: 40, goldCost: 500,
    materials: [{ itemId: 'willow_logs', qty: 20 }, { itemId: 'bar_steel', qty: 10 }],
    floorTile: TILES.STONE,
    color: '#3a3050',
  },
  // ── Outdoor ──────────────────────────────────────────────
  courtyard: {
    id: 'courtyard', name: 'Courtyard',
    category: 'outdoor',
    desc: 'An open stone-paved area.',
    levelReq: 5, goldCost: 50, materials: [],
    floorTile: TILES.PATH,
    color: '#7a6a58',
  },
  garden: {
    id: 'garden', name: 'Garden',
    category: 'outdoor',
    desc: 'A peaceful garden for plants and relaxation.',
    levelReq: 10, goldCost: 100,
    materials: [{ itemId: 'logs', qty: 5 }],
    floorTile: TILES.DARK_GRASS,
    color: '#2e5a22',
  },
  farming_plot: {
    id: 'farming_plot', name: 'Farming Plot',
    category: 'outdoor',
    desc: 'Grow crops and herbs.',
    levelReq: 15, goldCost: 150,
    materials: [{ itemId: 'logs', qty: 10 }],
    floorTile: TILES.DIRT,
    color: '#6a4a20',
  },
  pond: {
    id: 'pond', name: 'Pond',
    category: 'outdoor',
    desc: 'A serene decorative water feature.',
    levelReq: 20, goldCost: 200,
    materials: [{ itemId: 'bar_iron', qty: 5 }],
    floorTile: TILES.WATER,
    color: '#1a5080',
  },
  decorative_path: {
    id: 'decorative_path', name: 'Stone Path',
    category: 'outdoor',
    desc: 'A paved walkway.',
    levelReq: 5, goldCost: 25, materials: [],
    floorTile: TILES.PATH,
    color: '#6a6050',
  },
  taming_pen: {
    id: 'taming_pen', name: 'Taming Pen',
    category: 'outdoor',
    desc: 'A fenced enclosure for animals.',
    levelReq: 35, goldCost: 400,
    materials: [{ itemId: 'oak_logs', qty: 20 }, { itemId: 'bar_iron', qty: 10 }],
    floorTile: TILES.GRASS,
    color: '#3a5a20',
  },
};

// ── Furniture definitions ─────────────────────────────────────────────────
// category: 'indoor' | 'outdoor' | 'both'
// footprint: { w, h } — tiles wide × tall (before rotation)
// solid: whether the tile blocks movement

export const FURNITURE_DEFS = {
  // ── Indoor ──────────────────────────────────────────────
  chair: {
    id: 'chair', name: 'Wooden Chair',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_CHAIR,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 2 }],
    desc: 'A simple wooden chair.',
  },
  rug: {
    id: 'rug', name: 'Rug',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_RUG,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A decorative floor rug.',
  },
  table: {
    id: 'table', name: 'Wooden Table',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_TABLE,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 4 }],
    desc: 'A sturdy wooden dining table.',
  },
  chest: {
    id: 'chest', name: 'Storage Chest',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_CHEST,
    levelReq: 5, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 4 }],
    desc: 'A lockable wooden chest.',
  },
  bookshelf: {
    id: 'bookshelf', name: 'Bookshelf',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_BOOKSHELF,
    levelReq: 10, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 6 }],
    desc: 'A shelf packed with books.',
  },
  bed: {
    id: 'bed', name: 'Wooden Bed',
    category: 'indoor', footprint: { w: 1, h: 2 }, solid: true,
    tileId: TILES.FURN_BED,
    levelReq: 15, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 8 }],
    desc: 'A cosy bed to sleep in.',
  },
  crafting_bench: {
    id: 'crafting_bench', name: 'Crafting Bench',
    category: 'indoor', footprint: { w: 2, h: 1 }, solid: true,
    tileId: TILES.FURN_BENCH,
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 8 }, { itemId: 'bar_iron', qty: 2 }],
    desc: 'A heavy-duty work surface.',
  },
  furnace: {
    id: 'furnace', name: 'Furnace',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURNACE,
    levelReq: 20, goldCost: 0, materials: [{ itemId: 'bar_iron', qty: 10 }],
    desc: 'Smelt ores into bars.',
  },
  anvil: {
    id: 'anvil', name: 'Anvil',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.ANVIL,
    levelReq: 20, goldCost: 0, materials: [{ itemId: 'bar_steel', qty: 5 }],
    desc: 'Smith bars into equipment.',
  },
  plant: {
    id: 'plant', name: 'Potted Plant',
    category: 'both', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_PLANT,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A decorative potted plant.',
  },
  // ── Outdoor ─────────────────────────────────────────────
  barrel: {
    id: 'barrel', name: 'Barrel',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.BARREL,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 3 }],
    desc: 'A wooden storage barrel.',
  },
  well: {
    id: 'well', name: 'Stone Well',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.WELL,
    levelReq: 10, goldCost: 0, materials: [{ itemId: 'bar_iron', qty: 3 }],
    desc: 'A decorative stone well.',
  },
  fence: {
    id: 'fence', name: 'Fence',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FENCE,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 2 }],
    desc: 'A wooden fence section.',
  },
  campfire: {
    id: 'campfire', name: 'Campfire',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FIRE,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 3 }],
    desc: 'A crackling outdoor campfire.',
  },
};

// ── Inventory helpers ─────────────────────────────────────────────────────

function _hasAll(inventory, materials) {
  for (const { itemId, qty } of materials) {
    if (inventory.count(itemId) < qty) return { ok: false, reason: `Need ${qty}x ${itemId.replace(/_/g, ' ')}.` };
  }
  return { ok: true };
}

function _deductAll(inventory, materials) {
  for (const { itemId, qty } of materials) inventory.remove(itemId, qty);
}

// ── Footprint helpers ─────────────────────────────────────────────────────

export function rotatedFootprint(def, rotation) {
  const w = def.footprint.w, h = def.footprint.h;
  return (rotation & 1) ? { w: h, h: w } : { w, h };
}

function _rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ── HousingState ──────────────────────────────────────────────────────────

export class HousingState {
  constructor() {
    /** @type {Map<string, { typeId: string }>} */
    this.cells = new Map();
    /** @type {Map<string, Array<{ defId: string, localCol: number, localRow: number, rotation: number }>>} */
    this.furniture = new Map();

    // Starter room is always present
    this.cells.set(`${START_GX},${START_GY}`, { typeId: 'starter' });

    // ── Large Storage Chest ──────────────────────────────
    /** True once the large chest upgrade is unlocked (Architect level 5 required).
     *  TODO: game.js — check skills[9] >= 5 before setting hasLargeChest via unlockLargeChest()
     */
    this.hasLargeChest = false;

    // ── Animal Pen ───────────────────────────────────────
    /**
     * animals: max 4, each: { type: 'chicken'|'cow'|'sheep', produceTimer: 0, produceReady: false }
     * TODO: Agent 2 — passive mob types chicken/cow/sheep — implement capture mechanic
     *   so the player can call housingState.addAnimal(type) after catching one in the world
     */
    this.animalPen = {
      animals:  [],  // max 4
      capacity: 4,
    };
  }

  // ── Cell queries ────────────────────────────────────────

  hasCell(gx, gy) { return this.cells.has(`${gx},${gy}`); }
  getCell(gx, gy) { return this.cells.get(`${gx},${gy}`); }

  isAdjacentToOwned(gx, gy) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    return dirs.some(([dx, dy]) => this.cells.has(`${gx+dx},${gy+dy}`));
  }

  /** All empty grid slots adjacent to at least one owned cell. */
  getAvailableSlots() {
    const avail = new Set();
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const key of this.cells.keys()) {
      const [gx, gy] = key.split(',').map(Number);
      for (const [dx, dy] of dirs) {
        const nx = gx + dx, ny = gy + dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        const nk = `${nx},${ny}`;
        if (!this.cells.has(nk)) avail.add(nk);
      }
    }
    return avail;
  }

  // ── Room building ────────────────────────────────────────

  /**
   * Check whether a room/plot can be added at (gx, gy).
   * @returns {{ ok: boolean, reason?: string }}
   */
  canAddCell(gx, gy, roomDefId, inventory, skills, isAdmin = false) {
    if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS)
      return { ok: false, reason: 'Out of bounds.' };
    if (this.cells.has(`${gx},${gy}`))
      return { ok: false, reason: 'Already built here.' };
    if (!this.isAdjacentToOwned(gx, gy))
      return { ok: false, reason: 'Must be adjacent to an existing room or plot.' };

    const def = ROOM_DEFS[roomDefId];
    if (!def) return { ok: false, reason: 'Unknown room type.' };

    if (!isAdmin) {
      const lvl = skills.getLevel(SKILL_IDS.ARCHITECT);
      if (lvl < def.levelReq)
        return { ok: false, reason: `Requires Architect level ${def.levelReq} (you have ${lvl}).` };

      if (def.goldCost > 0 && inventory.count('gold_coin') < def.goldCost)
        return { ok: false, reason: `Need ${def.goldCost} gold coins (have ${inventory.count('gold_coin')}).` };

      const matCheck = _hasAll(inventory, def.materials);
      if (!matCheck.ok) return matCheck;
    }

    return { ok: true };
  }

  /** Add a cell, deducting costs. Assumes canAddCell returned ok. */
  addCell(gx, gy, roomDefId, inventory, isAdmin = false) {
    const def = ROOM_DEFS[roomDefId];
    if (!isAdmin) {
      if (def.goldCost > 0) inventory.remove('gold_coin', def.goldCost);
      _deductAll(inventory, def.materials);
    }
    this.cells.set(`${gx},${gy}`, { typeId: roomDefId });
    if (!this.furniture.has(`${gx},${gy}`)) this.furniture.set(`${gx},${gy}`, []);
  }

  // ── Furniture ────────────────────────────────────────────

  getFurniture(gx, gy) {
    return this.furniture.get(`${gx},${gy}`) ?? [];
  }

  /**
   * Check whether furniture can be placed at localCol/localRow within the cell.
   * @returns {{ ok: boolean, reason?: string }}
   */
  canPlaceFurniture(gx, gy, defId, localCol, localRow, rotation, inventory, skills, isAdmin = false) {
    const cell = this.getCell(gx, gy);
    if (!cell) return { ok: false, reason: 'No room here.' };

    const def = FURNITURE_DEFS[defId];
    if (!def) return { ok: false, reason: 'Unknown furniture.' };

    const roomDef = ROOM_DEFS[cell.typeId];
    if (def.category === 'indoor'  && roomDef.category !== 'indoor')
      return { ok: false, reason: 'Indoor furniture only.' };
    if (def.category === 'outdoor' && roomDef.category !== 'outdoor')
      return { ok: false, reason: 'Outdoor furniture only.' };

    if (!isAdmin) {
      const lvl = skills.getLevel(SKILL_IDS.ARCHITECT);
      if (lvl < def.levelReq)
        return { ok: false, reason: `Requires Architect level ${def.levelReq}.` };
    }

    const { w, h } = rotatedFootprint(def, rotation);
    if (localCol < 0 || localRow < 0 || localCol + w > CELL_INNER || localRow + h > CELL_INNER)
      return { ok: false, reason: 'Does not fit inside this room.' };

    const existing = this.getFurniture(gx, gy);
    for (const placed of existing) {
      const pd = FURNITURE_DEFS[placed.defId];
      if (!pd) continue;
      const { w: pw, h: ph } = rotatedFootprint(pd, placed.rotation);
      if (_rectOverlap(localCol, localRow, w, h, placed.localCol, placed.localRow, pw, ph))
        return { ok: false, reason: 'Overlaps existing furniture.' };
    }

    if (!isAdmin) {
      const matCheck = _hasAll(inventory, def.materials);
      if (!matCheck.ok) return matCheck;
    }

    return { ok: true };
  }

  /** Place furniture. Assumes canPlaceFurniture returned ok. */
  placeFurniture(gx, gy, defId, localCol, localRow, rotation, inventory, isAdmin = false) {
    const def = FURNITURE_DEFS[defId];
    if (!isAdmin) _deductAll(inventory, def.materials);
    if (!this.furniture.has(`${gx},${gy}`)) this.furniture.set(`${gx},${gy}`, []);
    this.furniture.get(`${gx},${gy}`).push({ defId, localCol, localRow, rotation });
  }

  /** Remove furniture at index within (gx, gy). */
  removeFurniture(gx, gy, index) {
    const list = this.furniture.get(`${gx},${gy}`);
    if (list && index >= 0 && index < list.length) list.splice(index, 1);
  }

  /** Find furniture occupying localCol/localRow within a cell. */
  furnitureAt(gx, gy, localCol, localRow) {
    const list = this.getFurniture(gx, gy);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const pd = FURNITURE_DEFS[f.defId];
      if (!pd) continue;
      const { w, h } = rotatedFootprint(pd, f.rotation);
      if (localCol >= f.localCol && localCol < f.localCol + w &&
          localRow >= f.localRow && localRow < f.localRow + h)
        return { index: i, entry: f };
    }
    return null;
  }

  // ── Large Chest ──────────────────────────────────────────

  /** Unlock the large storage chest upgrade. Caller must verify Architect level >= 5.
   *  TODO: game.js — check skills[9] >= 5 before calling this; then rebuild the house interior
   *    so the new FURN_CHEST tile at interior position (10,3) becomes active.
   *  TODO: game.js — when player opens chest at interior position (10,3),
   *    use LARGE_CHEST_CAPACITY slots if housingState.hasLargeChest, else standard 28 slots.
   */
  unlockLargeChest() {
    this.hasLargeChest = true;
  }

  // ── Animal Pen ───────────────────────────────────────────

  /**
   * Add an animal to the pen. Returns true if added, false if pen is full.
   * @param {'chicken'|'cow'|'sheep'} type
   */
  addAnimal(type) {
    if (this.animalPen.animals.length >= this.animalPen.capacity) return false;
    this.animalPen.animals.push({ type, produceTimer: 0, produceReady: false });
    return true;
  }

  /**
   * Remove an animal at a given index from the pen.
   * @param {number} index
   */
  removeAnimal(index) {
    this.animalPen.animals.splice(index, 1);
  }

  /**
   * Advance all animal produce timers by dt seconds.
   * Call this from game.js each update tick.
   * TODO: game.js — call housingState.tickAnimals(dt) inside the update loop when inInterior
   * @param {number} dt  Elapsed seconds since last tick
   */
  tickAnimals(dt) {
    for (const animal of this.animalPen.animals) {
      if (animal.produceReady) continue;
      animal.produceTimer += dt;
      const threshold = ANIMAL_PRODUCE_TIMERS[animal.type] ?? 600;
      if (animal.produceTimer >= threshold) {
        animal.produceReady = true;
      }
    }
  }

  /**
   * Collect produce from an animal that is ready.
   * Resets the timer and returns the yield object, or null if not ready.
   * @param {number} animalIndex
   * @returns {{ id: string, qty: number }|null}
   */
  collectProduce(animalIndex) {
    const animal = this.animalPen.animals[animalIndex];
    if (!animal || !animal.produceReady) return null;
    animal.produceTimer = 0;
    animal.produceReady = false;
    const produceId = ANIMAL_PRODUCE_IDS[animal.type] ?? 'egg';
    return { id: produceId, qty: 1 };
  }

  /**
   * Returns a shallow copy of the animalPen state (safe for reading in renderer).
   * TODO: renderer.js — call housingState.getAnimalPenState() to draw the animal pen panel;
   *   add animalPenOpen panel flag in game.js; clicking a pen tile at interior positions
   *   (2,9), (4,9), (2,11), (4,11) opens animal management panel.
   * @returns {{ animals: Array, capacity: number }}
   */
  getAnimalPenState() {
    return {
      animals:  this.animalPen.animals.slice(),
      capacity: this.animalPen.capacity,
    };
  }

  // ── Serialisation ────────────────────────────────────────

  toJSON() {
    const cells = {};
    for (const [k, v] of this.cells) cells[k] = v;
    const furniture = {};
    for (const [k, v] of this.furniture) if (v.length > 0) furniture[k] = v;

    // Serialize animalPen — round timers to avoid float bloat in save file
    const animalPenOut = {
      animals: this.animalPen.animals.map(a => ({
        type:         a.type,
        produceTimer: Math.round(a.produceTimer),
        produceReady: a.produceReady,
      })),
    };

    return {
      cells,
      furniture,
      hasLargeChest: this.hasLargeChest,
      animalPen: animalPenOut,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.cells.clear();
    this.furniture.clear();
    if (data.cells) {
      for (const [k, v] of Object.entries(data.cells)) this.cells.set(k, v);
    }
    if (data.furniture) {
      for (const [k, v] of Object.entries(data.furniture)) {
        if (Array.isArray(v)) this.furniture.set(k, v);
      }
    }
    // Always keep starter cell
    if (!this.cells.has(`${START_GX},${START_GY}`))
      this.cells.set(`${START_GX},${START_GY}`, { typeId: 'starter' });

    // Restore hasLargeChest flag
    this.hasLargeChest = data.hasLargeChest === true;

    // Restore animalPen
    if (data.animalPen && Array.isArray(data.animalPen.animals)) {
      this.animalPen.animals = data.animalPen.animals.map(a => ({
        type:         a.type ?? 'chicken',
        produceTimer: typeof a.produceTimer === 'number' ? a.produceTimer : 0,
        produceReady: a.produceReady === true,
      }));
    }
  }
}

// ── Utility exports ───────────────────────────────────────────────────────

/** All ROOM_DEFS accessible at the given architect level (excluding starter). */
export function getUnlockedRoomDefs(archLevel) {
  return Object.values(ROOM_DEFS).filter(d => d.id !== 'starter' && d.levelReq <= archLevel);
}

/** All FURNITURE_DEFS accessible at the given architect level. */
export function getUnlockedFurnitureDefs(archLevel) {
  return Object.values(FURNITURE_DEFS).filter(d => d.levelReq <= archLevel);
}
