/**
 * Player Housing System
 *
 * Grid-based expandable house tied to the Architect skill.
 * The player house interior is a 73×73-tile map containing a 6×6 grid of
 * "cells".  Every cell is 11×11 walkable tiles separated by 1-tile walls.
 * The entire property is fenced — grass fills unbuilt areas.
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
export const CELL_INNER    = 11;   // inner walkable floor width/height per cell
export const CELL_STRIDE   = 12;   // inner + 1 wall tile between cells
export const GRID_COLS     = 6;
export const GRID_ROWS     = 6;
export const HOUSE_MAP_SIZE = 1 + GRID_COLS * CELL_INNER + (GRID_COLS - 1) + 1; // 73
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

/** Tile col/row of a cell's inner floor top-left corner. */
export function cellInnerOrigin(gx, gy) {
  return {
    col: 1 + gx * CELL_STRIDE,
    row: 1 + gy * CELL_STRIDE,
  };
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

/** Floor / wall recolour palettes. Each entry has a material cost — scale
 *  reflects how much flooring the player would need to "refinish" a whole
 *  room, not just a single tile, so the numbers feel earned.
 *  tint === null means "keep the natural colour". */
export const FLOOR_TINT_OPTIONS = [
  { id: 'natural', name: 'Natural',   tint: null,      materials: [] },
  { id: 'oak',     name: 'Oak Stain', tint: '#8a5028', materials: [{ itemId: 'oak_logs',        qty: 40 }] },
  { id: 'willow',  name: 'Willow',    tint: '#b0823a', materials: [{ itemId: 'willow_logs',     qty: 40 }] },
  { id: 'maple',   name: 'Maple',     tint: '#c4794a', materials: [{ itemId: 'maple_logs',      qty: 40 }] },
  { id: 'yew',     name: 'Yew',       tint: '#6a3820', materials: [{ itemId: 'yew_logs',        qty: 40 }] },
  { id: 'magic',   name: 'Magic',     tint: '#6a4a8a', materials: [{ itemId: 'magic_logs',      qty: 40 }] },
  { id: 'sand',    name: 'Sandstone', tint: '#d4c078', materials: [{ itemId: 'desert_crystal',  qty: 20 }] },
  { id: 'slate',   name: 'Slate',     tint: '#6a6a70', materials: [{ itemId: 'bar_iron',        qty: 15 }] },
  { id: 'marble',  name: 'Marble',    tint: '#cac8c0', materials: [{ itemId: 'bar_silver',      qty: 10 }] },
];

export const WALL_TINT_OPTIONS = [
  { id: 'natural',  name: 'Natural',  tint: null,      materials: [] },
  { id: 'plaster',  name: 'Plaster',  tint: '#d8c8a8', materials: [{ itemId: 'sulfur',           qty: 30 }] },
  { id: 'mahogany', name: 'Mahogany', tint: '#5a2818', materials: [{ itemId: 'yew_logs',         qty: 30 }] },
  { id: 'marble',   name: 'Marble',   tint: '#cac8c0', materials: [{ itemId: 'bar_silver',       qty: 12 }] },
  { id: 'obsidian', name: 'Obsidian', tint: '#2a2a30', materials: [{ itemId: 'bar_tungsten',     qty: 6 }] },
  { id: 'slate',    name: 'Slate',    tint: '#5a6a6a', materials: [{ itemId: 'bar_iron',         qty: 20 }] },
  { id: 'sand',     name: 'Sandstone',tint: '#c0a068', materials: [{ itemId: 'desert_crystal',   qty: 25 }] },
];

/** Expand a list of furniture defs into one row per variant. Defs without
 *  variants produce a single row with variant === null. Used by the build-
 *  mode UI so players can pick which colour/material to craft from. */
export function flattenFurnitureVariants(defs) {
  const out = [];
  for (const fd of defs) {
    if (fd.variants && fd.variants.length > 0) {
      for (const v of fd.variants) out.push({ def: fd, variant: v });
    } else {
      out.push({ def: fd, variant: null });
    }
  }
  return out;
}

/** Same as flattenFurnitureVariants but sorted so entries the player can
 *  craft right now land at the top, then by level requirement, then by
 *  display name. Each entry also carries a `_canCraft` boolean so the
 *  renderer doesn't need to recompute the material check. */
export function sortedFurnitureEntries(defs, inventory, archLevel) {
  return flattenFurnitureVariants(defs)
    .map(entry => {
      const mats = entry.variant?.materials || entry.def.materials;
      const hasMats = mats.every(m => inventory.count(m.itemId) >= m.qty);
      const canCraft = archLevel >= entry.def.levelReq && hasMats;
      return { ...entry, _canCraft: canCraft };
    })
    .sort((a, b) => {
      if (a._canCraft !== b._canCraft) return a._canCraft ? -1 : 1;
      if (a.def.levelReq !== b.def.levelReq) return a.def.levelReq - b.def.levelReq;
      return (a.def.name + (a.variant?.name ?? '')).localeCompare(
        b.def.name + (b.variant?.name ?? ''));
    });
}

/** Shared wood-variant recipes. All wooden furniture that shares this shape
 *  can spread itself into 7 colour variants (standard / oak / willow / maple /
 *  yew / magic / elder) by calling woodVariants(qty). The player picks which
 *  variant to craft; the chosen tint is stored on the furniture entry so the
 *  renderer can colour the sprite. */
export function woodVariants(qty) {
  return [
    { id: 'standard', name: 'Standard', materials: [{ itemId: 'logs',        qty }],   tint: '#8a6b3a' },
    { id: 'oak',      name: 'Oak',      materials: [{ itemId: 'oak_logs',    qty }],   tint: '#8a5028' },
    { id: 'willow',   name: 'Willow',   materials: [{ itemId: 'willow_logs', qty }],   tint: '#b0823a' },
    { id: 'maple',    name: 'Maple',    materials: [{ itemId: 'maple_logs',  qty }],   tint: '#c4794a' },
    { id: 'yew',      name: 'Yew',      materials: [{ itemId: 'yew_logs',    qty }],   tint: '#6a3820' },
    { id: 'magic',    name: 'Magic',    materials: [{ itemId: 'magic_logs',  qty }],   tint: '#6a4a8a' },
    { id: 'elder',    name: 'Elder',    materials: [{ itemId: 'elder_logs',  qty }],   tint: '#8a4870' },
  ];
}

/** Fabric colour variants for rugs, cushions, and tapestries. Each variant
 *  uses a distinct material so rarer colours feel earned. */
export function rugVariants(qty) {
  return [
    { id: 'red',       name: 'Red Weave',      materials: [{ itemId: 'logs',           qty }],        tint: '#8a2828' },
    { id: 'sand',      name: 'Desert Sand',    materials: [{ itemId: 'desert_crystal', qty: qty * 3 }], tint: '#d4a858' },
    { id: 'moss',      name: 'Moss Green',     materials: [{ itemId: 'reeds',          qty: qty * 4 }], tint: '#3a7838' },
    { id: 'midnight',  name: 'Midnight Blue',  materials: [{ itemId: 'bar_silver',     qty: qty * 2 }], tint: '#2a4a8a' },
    { id: 'arcane',    name: 'Arcane Violet',  materials: [{ itemId: 'magic_logs',     qty: qty * 2 }], tint: '#6a2a8a' },
    { id: 'gold',      name: 'Royal Gold',     materials: [{ itemId: 'bar_gold',       qty: qty * 2 }], tint: '#c8a030' },
  ];
}

export const FURNITURE_DEFS = {
  // ── General indoor (most rooms) ────────────────────────────
  chair: {
    id: 'chair', name: 'Wooden Chair',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_CHAIR, rotatable: true,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 2 }],
    variants: woodVariants(2),
    desc: 'A simple wooden chair.',
  },
  rug: {
    id: 'rug', name: 'Rug',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_RUG, rotatable: true,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    variants: rugVariants(2),
    desc: 'A decorative floor rug.',
    rooms: ['starter', 'living_room', 'bedroom', 'kitchen', 'library', 'trophy_room'],
  },
  table: {
    id: 'table', name: 'Wooden Table',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_TABLE, rotatable: true,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 4 }],
    variants: woodVariants(4),
    desc: 'A sturdy wooden dining table.',
  },
  chest: {
    id: 'chest', name: 'Storage Chest',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_CHEST, rotatable: true,
    levelReq: 5, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 4 }],
    desc: 'A lockable wooden chest.',
    rooms: ['starter', 'living_room', 'bedroom', 'kitchen', 'storage', 'workshop', 'trophy_room'],
  },
  candelabra: {
    id: 'candelabra', name: 'Candelabra',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_CANDELABRA,
    levelReq: 5, goldCost: 0,
    materials: [{ itemId: 'bar_iron', qty: 3 }],
    desc: 'A standing iron candle holder.',
  },
  plant: {
    id: 'plant', name: 'Potted Plant',
    category: 'both', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_PLANT,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A decorative potted plant.',
  },
  // ── Bedroom ────────────────────────────────────────────────
  bed: {
    id: 'bed', name: 'Wooden Bed',
    category: 'indoor', footprint: { w: 1, h: 2 }, solid: true,
    tileId: TILES.FURN_BED, rotatable: true,
    levelReq: 15, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 8 }],
    variants: woodVariants(8),
    desc: 'A cosy bed to sleep in.',
    rooms: ['bedroom', 'starter'],
  },
  wardrobe: {
    id: 'wardrobe', name: 'Wardrobe',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_WARDROBE, rotatable: true,
    levelReq: 15, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 10 }],
    variants: woodVariants(10),
    desc: 'A tall wooden cabinet for garments.',
    rooms: ['bedroom', 'starter', 'living_room'],
  },
  // ── Kitchen / cooking ──────────────────────────────────────
  fireplace: {
    id: 'fireplace', name: 'Fireplace',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.HEARTH, wallMount: 'north',
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'bar_iron', qty: 4 }, { itemId: 'logs', qty: 6 }],
    desc: 'A stone hearth for warmth and cooking.',
    rooms: ['kitchen', 'living_room', 'starter', 'bedroom'],
  },
  chopping_block: {
    id: 'chopping_block', name: 'Chopping Block',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.BUTCHER_BLOCK,
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 6 }, { itemId: 'bar_iron', qty: 1 }],
    desc: 'A thick wooden block for preparing meat.',
    rooms: ['kitchen'],
  },
  meat_hooks: {
    id: 'meat_hooks', name: 'Meat Hooks',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.MEAT_HOOK, wallMount: 'north',
    levelReq: 15, goldCost: 0,
    materials: [{ itemId: 'bar_iron', qty: 4 }],
    desc: 'Iron hooks for hanging cured meats.',
    rooms: ['kitchen', 'storage'],
  },
  cauldron: {
    id: 'cauldron', name: 'Cauldron',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_CAULDRON,
    levelReq: 15, goldCost: 0,
    materials: [{ itemId: 'bar_iron', qty: 6 }],
    desc: 'A large iron pot for stews and brews.',
    rooms: ['kitchen'],
  },
  // ── Library ────────────────────────────────────────────────
  bookshelf: {
    id: 'bookshelf', name: 'Bookshelf',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_BOOKSHELF, rotatable: true,
    levelReq: 10, goldCost: 0, materials: [{ itemId: 'oak_logs', qty: 6 }],
    variants: woodVariants(6),
    desc: 'A shelf packed with books.',
    rooms: ['library', 'living_room', 'starter', 'bedroom', 'trophy_room'],
  },
  // ── Living room / decoration ───────────────────────────────
  tapestry: {
    id: 'tapestry', name: 'Tapestry',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_TAPESTRY, rotatable: true,
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 2 }],
    desc: 'A woven wall banner.',
    rooms: ['living_room', 'bedroom', 'library', 'trophy_room', 'starter'],
  },
  // ── Workshop ───────────────────────────────────────────────
  crafting_bench: {
    id: 'crafting_bench', name: 'Crafting Bench',
    category: 'indoor', footprint: { w: 2, h: 1 }, solid: true,
    tileId: TILES.FURN_BENCH, rotatable: true,
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 8 }, { itemId: 'bar_iron', qty: 2 }],
    desc: 'A heavy-duty work surface.',
    rooms: ['workshop'],
  },
  furnace: {
    id: 'furnace', name: 'Furnace',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURNACE,
    levelReq: 20, goldCost: 0, materials: [{ itemId: 'bar_iron', qty: 10 }],
    desc: 'Smelt ores into bars.',
    rooms: ['workshop'],
  },
  anvil: {
    id: 'anvil', name: 'Anvil',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.ANVIL,
    levelReq: 20, goldCost: 0, materials: [{ itemId: 'bar_steel', qty: 5 }],
    desc: 'Smith bars into equipment.',
    rooms: ['workshop'],
  },
  // ── Trophy room / display ──────────────────────────────────
  weapon_rack: {
    id: 'weapon_rack', name: 'Weapon Rack',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.WEAPON_RACK, wallMount: 'north',
    levelReq: 20, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 8 }, { itemId: 'bar_iron', qty: 3 }],
    desc: 'A wall rack displaying swords and axes. Hangs on the north wall.',
    rooms: ['trophy_room', 'workshop', 'living_room'],
  },
  armor_stand: {
    id: 'armor_stand', name: 'Armour Stand',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.ARMOR_STAND,
    displayKind: 'armor',
    levelReq: 25, goldCost: 500,
    materials: [{ itemId: 'oak_logs', qty: 8 }, { itemId: 'bar_iron', qty: 4 }],
    desc: 'A wooden mannequin. Click to equip it with armour from your inventory.',
    rooms: ['trophy_room', 'living_room', 'bedroom', 'starter'],
  },
  display_shelf: {
    id: 'display_shelf', name: 'Display Shelf',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.DISPLAY_SHELF, rotatable: true,
    levelReq: 10, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 6 }],
    desc: 'Shelves for displaying wares and trophies.',
    rooms: ['trophy_room', 'storage', 'library', 'living_room'],
  },
  // ── Outdoor ────────────────────────────────────────────────
  barrel: {
    id: 'barrel', name: 'Barrel',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.BARREL,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 3 }],
    desc: 'A wooden storage barrel.',
    rooms: ['courtyard', 'garden', 'taming_pen', 'farming_plot'],
  },
  well: {
    id: 'well', name: 'Stone Well',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.WELL,
    levelReq: 10, goldCost: 0, materials: [{ itemId: 'bar_iron', qty: 3 }],
    desc: 'A decorative stone well.',
    rooms: ['courtyard', 'garden'],
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
    rooms: ['courtyard', 'garden', 'farming_plot'],
  },
  hay_bale: {
    id: 'hay_bale', name: 'Hay Bale',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_HAY_BALE,
    levelReq: 1, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 2 }],
    desc: 'A bundle of dried hay.',
    rooms: ['courtyard', 'garden', 'farming_plot', 'taming_pen'],
  },
  scarecrow: {
    id: 'scarecrow', name: 'Scarecrow',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_SCARECROW,
    levelReq: 5, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 4 }],
    desc: 'A straw-stuffed guardian for the crops.',
    rooms: ['farming_plot', 'garden'],
  },
  // ── Garden decorations ───────────────────────────────────
  garden_rock: {
    id: 'garden_rock', name: 'Garden Boulder',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_GARDEN_ROCK,
    levelReq: 1, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A weathered stone. Nice against a flower bed.',
    rooms: ['garden', 'courtyard'],
  },
  pond_water: {
    id: 'pond_water', name: 'Pond Water',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_POND_WATER,
    levelReq: 5, goldCost: 25,
    materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A shimmering water tile. Place several to build a pond.',
    rooms: ['garden'],
  },
  // ── Trail textures (walkable) ────────────────────────────
  trail_dirt: {
    id: 'trail_dirt', name: 'Dirt Path',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_TRAIL_DIRT,
    levelReq: 1, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A short stretch of packed earth path.',
    rooms: ['garden', 'taming_pen'],
  },
  trail_stone: {
    id: 'trail_stone', name: 'Cobblestone Path',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_TRAIL_STONE,
    levelReq: 5, goldCost: 15,
    materials: [{ itemId: 'bar_iron', qty: 1 }],
    desc: 'Rough-cut cobblestones laid as a path.',
    rooms: ['garden', 'taming_pen'],
  },
  trail_gravel: {
    id: 'trail_gravel', name: 'Gravel Path',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_TRAIL_GRAVEL,
    levelReq: 3, goldCost: 10,
    materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'Loose gravel crunches underfoot.',
    rooms: ['garden', 'taming_pen'],
  },
  trail_flagstone: {
    id: 'trail_flagstone', name: 'Flagstone Path',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_TRAIL_FLAGSTONE,
    levelReq: 10, goldCost: 40,
    materials: [{ itemId: 'bar_iron', qty: 2 }],
    desc: 'Polished flagstone slabs. A touch of refinement.',
    rooms: ['garden', 'taming_pen'],
  },

  // ── New decorative furniture ────────────────────────────────────
  stool: {
    id: 'stool', name: 'Wooden Stool',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: false,
    tileId: TILES.FURN_STOOL,
    levelReq: 1, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    variants: woodVariants(1),
    desc: 'A sturdy three-legged stool.',
  },
  throne: {
    id: 'throne', name: 'Gilded Throne',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_THRONE,
    levelReq: 30, goldCost: 1500,
    materials: [{ itemId: 'oak_logs', qty: 10 }, { itemId: 'bar_gold', qty: 3 }],
    desc: 'An ornate throne fit for a lord of the manor.',
    rooms: ['living_room', 'trophy_room', 'starter'],
  },
  painting: {
    id: 'painting', name: 'Framed Painting',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_PAINTING, wallMount: 'north',
    levelReq: 8, goldCost: 0,
    materials: [{ itemId: 'logs', qty: 2 }, { itemId: 'bar_gold', qty: 1 }],
    desc: 'A framed landscape painting.',
    rooms: ['living_room', 'bedroom', 'library', 'trophy_room', 'starter'],
  },
  vase: {
    id: 'vase', name: 'Porcelain Vase',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_VASE,
    levelReq: 5, goldCost: 0,
    materials: [{ itemId: 'bar_silver', qty: 1 }],
    desc: 'A slender vase with fresh flowers.',
    rooms: ['living_room', 'bedroom', 'library', 'trophy_room', 'starter'],
  },
  nightstand: {
    id: 'nightstand', name: 'Nightstand',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_NIGHTSTAND,
    levelReq: 12, goldCost: 0,
    materials: [{ itemId: 'oak_logs', qty: 4 }],
    desc: 'A bedside table with a small lamp.',
    rooms: ['bedroom', 'starter'],
  },
  flower_patch: {
    id: 'flower_patch', name: 'Flower Patch',
    category: 'outdoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_FLOWER_PATCH,
    levelReq: 3, goldCost: 0, materials: [{ itemId: 'logs', qty: 1 }],
    desc: 'A colourful cluster of garden flowers.',
    rooms: ['garden', 'courtyard', 'farming_plot'],
  },
  grandfather_clock: {
    id: 'grandfather_clock', name: 'Grandfather Clock',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_CLOCK,
    levelReq: 25, goldCost: 500,
    materials: [{ itemId: 'oak_logs', qty: 12 }, { itemId: 'bar_gold', qty: 1 }],
    desc: 'A tall pendulum clock — counts the hours.',
    rooms: ['living_room', 'library', 'trophy_room', 'starter'],
  },
  floor_lantern: {
    id: 'floor_lantern', name: 'Floor Lantern',
    category: 'both', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_LANTERN,
    levelReq: 8, goldCost: 0,
    materials: [{ itemId: 'bar_iron', qty: 4 }],
    desc: 'A tall iron lantern. Casts a warm glow.',
  },

  // ── Interactive Prestige / Display Furniture ─────────────────────
  // These open a picker on click so the player can assign the displayed
  // content. The `displayKind` field tells the interact handler which
  // picker / input flow to use.
  weapon_case: {
    id: 'weapon_case', name: 'Weapon Display Case',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_WEAPON_CASE,
    displayKind: 'weapon',
    levelReq: 25, goldCost: 500,
    materials: [{ itemId: 'oak_logs', qty: 10 }, { itemId: 'bar_iron', qty: 4 }],
    desc: 'A glass-fronted case. Click to showcase a weapon from your inventory.',
    rooms: ['living_room', 'trophy_room', 'library', 'starter'],
  },
  fish_mount: {
    id: 'fish_mount', name: 'Mounted Fish',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_FISH_MOUNT, wallMount: 'north',
    displayKind: 'fish',
    levelReq: 20, goldCost: 200,
    materials: [{ itemId: 'oak_logs', qty: 4 }, { itemId: 'bar_silver', qty: 1 }],
    desc: 'A wall-mounted plaque. Click to mount one of your caught fish.',
    rooms: ['living_room', 'trophy_room', 'library', 'starter'],
  },
  trophy_plaque: {
    id: 'trophy_plaque', name: 'Trophy Plaque',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_TROPHY_PLAQUE, wallMount: 'north',
    displayKind: 'text',
    levelReq: 15, goldCost: 100,
    materials: [{ itemId: 'oak_logs', qty: 3 }, { itemId: 'bar_gold', qty: 1 }],
    desc: 'An engraved plaque. Click to set an inscription.',
    rooms: ['living_room', 'trophy_room', 'library', 'starter', 'bedroom'],
  },
  relic_shelf: {
    id: 'relic_shelf', name: 'Relic Shelf',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_RELIC_SHELF,
    displayKind: 'relic',
    levelReq: 18, goldCost: 250,
    materials: [{ itemId: 'oak_logs', qty: 6 }, { itemId: 'bar_silver', qty: 2 }],
    desc: 'A small display shelf. Click to place a treasured item.',
    rooms: ['trophy_room', 'library', 'living_room', 'starter'],
  },
  achievements_book: {
    id: 'achievements_book', name: 'Achievements Book',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_ACHIEVEMENTS_BOOK,
    displayKind: 'achievements',
    levelReq: 10, goldCost: 150,
    materials: [{ itemId: 'oak_logs', qty: 4 }, { itemId: 'bar_gold', qty: 1 }],
    desc: 'An open tome on a pedestal. Click to review your milestones.',
    rooms: ['library', 'trophy_room', 'living_room', 'starter'],
  },

  // ── Misc new indoor furniture ────────────────────────────
  fish_tank: {
    id: 'fish_tank', name: 'Fish Tank',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_FISH_TANK,
    levelReq: 20, goldCost: 300,
    materials: [{ itemId: 'oak_logs', qty: 4 }, { itemId: 'bar_silver', qty: 2 }],
    desc: 'A glass aquarium with swimming fish.',
    rooms: ['living_room', 'library', 'kitchen', 'trophy_room', 'starter'],
  },
  alchemy_table: {
    id: 'alchemy_table', name: 'Alchemy Table',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_ALCHEMY_TABLE, rotatable: true,
    levelReq: 25, goldCost: 250,
    materials: [{ itemId: 'oak_logs', qty: 6 }, { itemId: 'bar_silver', qty: 1 }, { itemId: 'sulfur', qty: 4 }],
    desc: 'A bench for mixing potions. Purely decorative.',
    rooms: ['library', 'workshop', 'kitchen', 'trophy_room'],
  },
  archery_target: {
    id: 'archery_target', name: 'Archery Target',
    category: 'both', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_ARCHERY_TARGET,
    levelReq: 12, goldCost: 100,
    materials: [{ itemId: 'logs', qty: 6 }, { itemId: 'bar_iron', qty: 1 }],
    desc: 'A round straw target with arrows in it.',
    rooms: ['trophy_room', 'workshop', 'courtyard', 'garden'],
  },
  wine_cask: {
    id: 'wine_cask', name: 'Wine Cask',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_WINE_CASK,
    levelReq: 15, goldCost: 150,
    materials: [{ itemId: 'oak_logs', qty: 5 }, { itemId: 'bar_iron', qty: 2 }],
    desc: 'A wooden cask of wine with a brass tap.',
    rooms: ['kitchen', 'living_room', 'trophy_room', 'storage'],
  },
  loom: {
    id: 'loom', name: 'Loom',
    category: 'indoor', footprint: { w: 1, h: 1 }, solid: true,
    tileId: TILES.FURN_LOOM, rotatable: true,
    levelReq: 18, goldCost: 120,
    materials: [{ itemId: 'oak_logs', qty: 8 }, { itemId: 'flax', qty: 6 }],
    desc: 'A wooden weaving frame strung with flax.',
    rooms: ['workshop', 'library', 'living_room', 'kitchen'],
  },
};

/** Return furniture defs available for a given room type. */
export function furnitureForRoom(roomTypeId) {
  const roomDef = ROOM_DEFS[roomTypeId];
  if (!roomDef) return [];
  return Object.values(FURNITURE_DEFS).filter(fd => {
    if (fd.rooms) return fd.rooms.includes(roomTypeId);
    return fd.category === roomDef.category || fd.category === 'both';
  });
}

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

    // ── Exit cell (which room has the entrance/exit door) ──
    this.exitGX = START_GX;
    this.exitGY = START_GY;

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

  // ── Exit cell management ────────────────────────────────

  /**
   * Check whether a room can be set as the exit.
   * Only rooms with no south neighbour are allowed.
   * @returns {{ ok: boolean, reason?: string }}
   */
  canSetExitCell(gx, gy) {
    if (!this.cells.has(`${gx},${gy}`))
      return { ok: false, reason: 'No room here.' };
    if (this.cells.has(`${gx},${gy + 1}`))
      return { ok: false, reason: 'Exit must be on a room with no south neighbour.' };
    return { ok: true };
  }

  setExitCell(gx, gy) {
    this.exitGX = gx;
    this.exitGY = gy;
  }

  // ── Room removal ────────────────────────────────────────

  /**
   * Check whether a room can be removed without disconnecting the house.
   * The starter room can never be removed.
   * The exit room can never be removed.
   * @returns {{ ok: boolean, reason?: string }}
   */
  canRemoveCell(gx, gy) {
    const key = `${gx},${gy}`;
    if (!this.cells.has(key))
      return { ok: false, reason: 'No room here.' };
    if (gx === START_GX && gy === START_GY)
      return { ok: false, reason: 'Cannot remove the starter room.' };
    if (gx === this.exitGX && gy === this.exitGY)
      return { ok: false, reason: 'Cannot remove the exit room. Move the exit first.' };

    // Check connectivity: removing this cell must leave all remaining cells connected
    const remaining = new Set([...this.cells.keys()].filter(k => k !== key));
    if (remaining.size === 0) return { ok: true };

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const start = remaining.values().next().value;
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
      const cur = queue.shift();
      const [cx, cy] = cur.split(',').map(Number);
      for (const [dx, dy] of dirs) {
        const nk = `${cx+dx},${cy+dy}`;
        if (remaining.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(nk);
        }
      }
    }
    if (visited.size < remaining.size)
      return { ok: false, reason: 'Removing this room would disconnect other rooms.' };

    return { ok: true };
  }

  /** Remove a cell and its furniture. Assumes canRemoveCell returned ok. */
  removeCell(gx, gy) {
    const key = `${gx},${gy}`;
    this.cells.delete(key);
    this.furniture.delete(key);
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
  canPlaceFurniture(gx, gy, defId, localCol, localRow, rotation, inventory, skills, isAdmin = false, variantId = null) {
    const cell = this.getCell(gx, gy);
    if (!cell) return { ok: false, reason: 'No room here.' };

    const def = FURNITURE_DEFS[defId];
    if (!def) return { ok: false, reason: 'Unknown furniture.' };

    // Resolve the variant recipe (if this def has variants). Variants share
    // the def's stats but each has its own materials + colour tint.
    const variant = variantId && def.variants
      ? def.variants.find(v => v.id === variantId)
      : null;

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
    const minRow = def.wallMount === 'north' ? -1 : 0;
    if (localCol < 0 || localRow < minRow || localCol + w > CELL_INNER || localRow + h > CELL_INNER)
      return { ok: false, reason: 'Does not fit inside this room.' };

    // Wall-mounted furniture must be placed directly on the wall
    if (def.wallMount === 'north') {
      if (localRow !== -1)
        return { ok: false, reason: 'Must be placed on the north wall.' };
      // Cannot place on the 3-tile door gap if an adjacent room exists to the north
      const mid = Math.floor(CELL_INNER / 2);       // centre of 11-tile span = 5
      if (this.hasCell(gx, gy - 1) &&
          localCol >= mid - 1 && localCol <= mid + 1)
        return { ok: false, reason: 'Cannot place on a doorway.' };
    }

    const existing = this.getFurniture(gx, gy);
    for (const placed of existing) {
      const pd = FURNITURE_DEFS[placed.defId];
      if (!pd) continue;
      const { w: pw, h: ph } = rotatedFootprint(pd, placed.rotation);
      if (_rectOverlap(localCol, localRow, w, h, placed.localCol, placed.localRow, pw, ph))
        return { ok: false, reason: 'Overlaps existing furniture.' };
    }

    if (!isAdmin) {
      const mats = variant ? variant.materials : def.materials;
      const matCheck = _hasAll(inventory, mats);
      if (!matCheck.ok) return matCheck;
    }

    return { ok: true };
  }

  /** Place furniture. Assumes canPlaceFurniture returned ok. */
  placeFurniture(gx, gy, defId, localCol, localRow, rotation, inventory, isAdmin = false, variantId = null) {
    const def = FURNITURE_DEFS[defId];
    const variant = variantId && def.variants
      ? def.variants.find(v => v.id === variantId)
      : null;
    const mats = variant ? variant.materials : def.materials;
    if (!isAdmin) _deductAll(inventory, mats);
    if (!this.furniture.has(`${gx},${gy}`)) this.furniture.set(`${gx},${gy}`, []);
    const entry = { defId, localCol, localRow, rotation };
    if (variant) entry.variantId = variant.id;
    this.furniture.get(`${gx},${gy}`).push(entry);
  }

  /** Remove furniture at index within (gx, gy). */
  removeFurniture(gx, gy, index) {
    const list = this.furniture.get(`${gx},${gy}`);
    if (list && index >= 0 && index < list.length) list.splice(index, 1);
  }

  /** Apply a floor or wall tint to a cell. `which` = 'floor' | 'wall'.
   *  Pass `tintId = 'natural'` (or null) to revert to the default colour.
   *  Deducts materials from inventory unless `isAdmin` is true.
   *  Returns { ok, reason? }. */
  setCellTint(gx, gy, which, tintId, inventory, isAdmin = false) {
    const cell = this.getCell(gx, gy);
    if (!cell) return { ok: false, reason: 'No room here.' };
    const opts = which === 'wall' ? WALL_TINT_OPTIONS : FLOOR_TINT_OPTIONS;
    const opt  = opts.find(o => o.id === tintId);
    if (!opt) return { ok: false, reason: 'Unknown tint.' };
    if (!isAdmin) {
      const matCheck = _hasAll(inventory, opt.materials);
      if (!matCheck.ok) return matCheck;
      _deductAll(inventory, opt.materials);
    }
    const field = which === 'wall' ? 'wallTintId' : 'floorTintId';
    if (opt.tint === null) delete cell[field];
    else                   cell[field] = opt.id;
    return { ok: true };
  }

  /** Set or clear the per-instance content of a placed display piece.
   *  Content shape depends on def.displayKind (e.g. { itemId } for weapon/relic,
   *  { speciesId, weight } for a fish, { text } for a trophy plaque).
   *  Pass `null` to clear. */
  setFurnitureContent(gx, gy, index, content) {
    const list = this.furniture.get(`${gx},${gy}`);
    if (!list || index < 0 || index >= list.length) return false;
    list[index] = { ...list[index], content: content ?? undefined };
    return true;
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
      exitGX: this.exitGX,
      exitGY: this.exitGY,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.cells.clear();
    this.furniture.clear();
    if (data.cells) {
      for (const [k, v] of Object.entries(data.cells)) {
        // Skip cells whose room type was removed
        if (v && v.typeId && !ROOM_DEFS[v.typeId]) continue;
        this.cells.set(k, v);
      }
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

    // Restore exit cell (fallback: find southernmost room for old saves)
    if (typeof data.exitGX === 'number' && typeof data.exitGY === 'number' &&
        this.cells.has(`${data.exitGX},${data.exitGY}`)) {
      this.exitGX = data.exitGX;
      this.exitGY = data.exitGY;
    } else {
      // Old save — pick southernmost room with no south neighbour
      let maxGY = -1;
      let bestGX = START_GX;
      for (const key of this.cells.keys()) {
        const [gx, gy] = key.split(',').map(Number);
        if (gy > maxGY && !this.cells.has(`${gx},${gy + 1}`)) {
          maxGY = gy; bestGX = gx;
        }
      }
      this.exitGX = bestGX;
      this.exitGY = maxGY >= 0 ? maxGY : START_GY;
    }

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
