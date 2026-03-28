/**
 * forge.js — Smelting (Furnace) and Smithing (Anvil) recipe data + panel geometry.
 *
 * Forgery skill covers both activities:
 *   Level  1-9  : basic smelting / bronze smithing
 *   Level 10-19 : iron tier
 *   Level 20-29 : steel tier
 *   Level 25-29 : silver / gold
 *   Level 40-49 : mithril tier
 *   Level 50-64 : tungsten tier
 *   Level 65-79 : obsidian tier
 *   Level 80+   : moonstone tier
 */
import { ITEMS } from './items.js';

/* ── Panel geometry ─────────────────────────────────────── */
export const FORGE_PW         = 490;
export const FORGE_HEADER_H   = 52;
export const FORGE_TAB_H      = 36;
export const FORGE_ROW_H      = 48;
export const FORGE_PAD_BOT    = 14;

export const SMELT_RECIPE_COUNT = 9;
export const SMELT_PH = FORGE_HEADER_H + SMELT_RECIPE_COUNT * FORGE_ROW_H + FORGE_PAD_BOT;

export const SMITH_CATEGORIES = ['weapons', 'tools', 'armor'];
// Panel height uses the longest category (armor = 8 rows)
export const SMITH_PH = FORGE_HEADER_H + FORGE_TAB_H + 8 * FORGE_ROW_H + FORGE_PAD_BOT;

/* ── Smelting recipes (Furnace) ─────────────────────────── */
// Each entry: { name, level, inputs:[{item,qty}], output, xp }
export const SMELT_RECIPES = [
  {
    name: 'Bronze Bar', level: 1, xp: 25, output: () => ITEMS.BAR_BRONZE,
    inputs: [{ item: () => ITEMS.ORE_COPPER, qty: 1 }, { item: () => ITEMS.ORE_TIN, qty: 1 }],
  },
  {
    name: 'Iron Bar', level: 10, xp: 40, output: () => ITEMS.BAR_IRON,
    inputs: [{ item: () => ITEMS.ORE_IRON, qty: 2 }],
  },
  {
    name: 'Steel Bar', level: 20, xp: 55, output: () => ITEMS.BAR_STEEL,
    inputs: [{ item: () => ITEMS.ORE_IRON, qty: 1 }, { item: () => ITEMS.ORE_COAL, qty: 2 }],
  },
  {
    name: 'Silver Bar', level: 25, xp: 50, output: () => ITEMS.BAR_SILVER,
    inputs: [{ item: () => ITEMS.ORE_SILVER, qty: 1 }],
  },
  {
    name: 'Gold Bar', level: 30, xp: 65, output: () => ITEMS.BAR_GOLD,
    inputs: [{ item: () => ITEMS.ORE_GOLD, qty: 1 }],
  },
  {
    name: 'Mithril Bar', level: 40, xp: 90, output: () => ITEMS.BAR_MITHRIL,
    inputs: [{ item: () => ITEMS.ORE_MITHRIL, qty: 2 }],
  },
  {
    name: 'Tungsten Bar', level: 50, xp: 110, output: () => ITEMS.BAR_TUNGSTEN,
    inputs: [{ item: () => ITEMS.ORE_TUNGSTEN, qty: 1 }, { item: () => ITEMS.ORE_COAL, qty: 3 }],
  },
  {
    name: 'Obsidian Ingot', level: 65, xp: 150, output: () => ITEMS.BAR_OBSIDIAN,
    inputs: [{ item: () => ITEMS.ORE_OBSIDIAN, qty: 4 }],
  },
  {
    name: 'Moonstone Ingot', level: 80, xp: 200, output: () => ITEMS.BAR_MOONSTONE,
    inputs: [{ item: () => ITEMS.ORE_MOONSTONE, qty: 1 }, { item: () => ITEMS.BAR_OBSIDIAN, qty: 1 }],
  },
];

/* ── Smithing recipes (Anvil) ───────────────────────────── */
export const SMITH_RECIPES = {
  weapons: [
    {
      name: 'Bronze Sword', level: 1, xp: 25, output: () => ITEMS.BRONZE_SWORD,
      inputs: [{ item: () => ITEMS.BAR_BRONZE, qty: 1 }],
    },
    {
      name: 'Iron Sword', level: 10, xp: 50, output: () => ITEMS.IRON_SWORD,
      inputs: [{ item: () => ITEMS.BAR_IRON, qty: 2 }],
    },
    {
      name: 'Steel Sword', level: 20, xp: 75, output: () => ITEMS.STEEL_SWORD,
      inputs: [{ item: () => ITEMS.BAR_STEEL, qty: 3 }],
    },
    {
      name: 'Mithril Sword', level: 40, xp: 120, output: () => ITEMS.MITHRIL_SWORD,
      inputs: [{ item: () => ITEMS.BAR_MITHRIL, qty: 4 }],
    },
    {
      name: 'Tungsten Blade', level: 50, xp: 150, output: () => ITEMS.TUNGSTEN_BLADE,
      inputs: [{ item: () => ITEMS.BAR_TUNGSTEN, qty: 4 }],
    },
    {
      name: 'Obsidian Cleaver', level: 65, xp: 200, output: () => ITEMS.OBSIDIAN_CLEAVER,
      inputs: [{ item: () => ITEMS.BAR_OBSIDIAN, qty: 3 }],
    },
    {
      name: 'Moonstone Staff', level: 80, xp: 280, output: () => ITEMS.MOONSTONE_STAFF,
      inputs: [{ item: () => ITEMS.BAR_MOONSTONE, qty: 2 }, { item: () => ITEMS.BAR_SILVER, qty: 1 }],
    },
  ],
  tools: [
    {
      name: 'Iron Axe', level: 10, xp: 40, output: () => ITEMS.IRON_AXE,
      inputs: [{ item: () => ITEMS.BAR_IRON, qty: 2 }],
    },
    {
      name: 'Steel Axe', level: 20, xp: 65, output: () => ITEMS.STEEL_AXE,
      inputs: [{ item: () => ITEMS.BAR_STEEL, qty: 3 }],
    },
    {
      name: 'Iron Pickaxe', level: 10, xp: 50, output: () => ITEMS.IRON_PICKAXE,
      inputs: [{ item: () => ITEMS.BAR_IRON, qty: 3 }],
    },
    {
      name: 'Steel Pickaxe', level: 20, xp: 80, output: () => ITEMS.STEEL_PICKAXE,
      inputs: [{ item: () => ITEMS.BAR_STEEL, qty: 4 }],
    },
    {
      name: 'Tungsten Pickaxe', level: 50, xp: 180, output: () => ITEMS.TUNGSTEN_PICKAXE,
      inputs: [{ item: () => ITEMS.BAR_TUNGSTEN, qty: 5 }],
      note: 'Required for Obsidian & Moonstone',
    },
  ],
  armor: [
    {
      name: 'Bronze Helm', level: 3, xp: 18, output: () => ITEMS.BRONZE_HELM,
      inputs: [{ item: () => ITEMS.BAR_BRONZE, qty: 1 }],
    },
    {
      name: 'Iron Helm', level: 12, xp: 50, output: () => ITEMS.IRON_HELM,
      inputs: [{ item: () => ITEMS.BAR_IRON, qty: 2 }],
    },
    {
      name: 'Steel Helm', level: 22, xp: 80, output: () => ITEMS.STEEL_HELM,
      inputs: [{ item: () => ITEMS.BAR_STEEL, qty: 3 }],
    },
    {
      name: 'Tungsten Helm', level: 52, xp: 160, output: () => ITEMS.TUNGSTEN_HELM,
      inputs: [{ item: () => ITEMS.BAR_TUNGSTEN, qty: 4 }],
    },
    {
      name: 'Bronze Plate', level: 5, xp: 45, output: () => ITEMS.BRONZE_PLATE,
      inputs: [{ item: () => ITEMS.BAR_BRONZE, qty: 3 }],
    },
    {
      name: 'Iron Plate', level: 14, xp: 125, output: () => ITEMS.IRON_PLATE,
      inputs: [{ item: () => ITEMS.BAR_IRON, qty: 5 }],
    },
    {
      name: 'Steel Plate', level: 24, xp: 185, output: () => ITEMS.STEEL_PLATE,
      inputs: [{ item: () => ITEMS.BAR_STEEL, qty: 7 }],
    },
    {
      name: 'Tungsten Plate', level: 54, xp: 350, output: () => ITEMS.TUNGSTEN_PLATE,
      inputs: [{ item: () => ITEMS.BAR_TUNGSTEN, qty: 8 }],
    },
  ],
};
