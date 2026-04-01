import { ITEMS } from './items.js';
import { TILE_SIZE, WORLD_COLS, WORLD_ROWS } from './constants.js';

/* ── Panel geometry (shared with game.js for hit-testing) ── */
export const SHOP_PW       = 430;
export const SHOP_HEADER_H = 52;
export const SHOP_TAB_H    = 36;
export const SHOP_ROW_H    = 46;
export const SHOP_PAD_BOT  = 14;
export const SHOP_PH       = SHOP_HEADER_H + SHOP_TAB_H + 8 * SHOP_ROW_H + SHOP_PAD_BOT;

/* ── What the shop sells (buy prices) ─────────────────── */
export const SHOP_STOCK = [
  { item: ITEMS.AXE,           buyPrice: 40 },
  { item: ITEMS.PICKAXE,       buyPrice: 50 },
  { item: ITEMS.TINDERBOX,     buyPrice: 20 },
  { item: ITEMS.FISHING_ROD,   buyPrice: 60 },
  { item: ITEMS.FISHING_BAIT,  buyPrice: 3  },
  { item: ITEMS.COOKED_SHRIMP, buyPrice: 5  },
  { item: ITEMS.COOKED_TROUT,  buyPrice: 10 },
  { item: ITEMS.COOKED_SALMON, buyPrice: 20 },
];

/* ── What the shop buys from the player (sell prices) ──── */
export const SELL_PRICES = {
  axe:            20,
  pickaxe:        25,
  tinderbox:      10,
  fishing_rod:    30,
  fishing_bait:   1,
  logs:           5,
  oak_logs:       12,
  willow_logs:    25,
  maple_logs:     50,
  yew_logs:       100,
  magic_logs:     200,
  elder_logs:     400,
  raw_shrimp:     2,
  raw_trout:      5,
  raw_salmon:     10,
  raw_lobster:    20,
  cooked_shrimp:  8,
  cooked_trout:   15,
  cooked_salmon:  30,
  cooked_lobster: 60,
  burnt_fish:     1,
  bones:          2,
  ore_copper:       8,
  ore_iron:         20,
  ore_coal:         35,
  ore_gold:         60,
  ore_mithril:      100,
  ore_tin:          4,
  ore_silver:       18,
  ore_tungsten:     55,
  ore_obsidian:     35,
  ore_moonstone:    90,
  bar_bronze:       22,
  bar_iron:         45,
  bar_steel:        95,
  bar_silver:       85,
  bar_gold:         130,
  bar_mithril:      190,
  bar_tungsten:     260,
  bar_obsidian:     210,
  bar_moonstone:    420,
  bronze_sword:     30,
  iron_sword:       80,
  steel_sword:      200,
  mithril_sword:    500,
  tungsten_blade:   800,
  obsidian_cleaver: 1200,
  moonstone_staff:  2500,
  iron_axe:         65,
  iron_legs:        65,
  steel_axe:        160,
  iron_pickaxe:     65,
  steel_pickaxe:    160,
  tungsten_pickaxe: 520,
  bronze_helm:      35,
  iron_helm:        90,
  steel_helm:       220,
  tungsten_helm:    640,
  bronze_plate:     85,
  iron_plate:       220,
  steel_plate:      540,
  tungsten_plate:   1600,
};

/* ── House furniture shop ──────────────────────────────── */
export const HOUSE_SHOP_PW       = 380;
export const HOUSE_SHOP_HEADER_H = 52;
export const HOUSE_SHOP_ROW_H    = 46;
export const HOUSE_SHOP_PAD_BOT  = 14;
export const HOUSE_SHOP_PH       = HOUSE_SHOP_HEADER_H + 6 * HOUSE_SHOP_ROW_H + HOUSE_SHOP_PAD_BOT;

export const HOUSE_SHOP_STOCK = [
  { item: ITEMS.FURN_CHAIR,     buyPrice: 1 },
  { item: ITEMS.FURN_RUG,       buyPrice: 1 },
  { item: ITEMS.FURN_TABLE,     buyPrice: 1 },
  { item: ITEMS.FURN_CHEST,     buyPrice: 1 },
  { item: ITEMS.FURN_BOOKSHELF, buyPrice: 1 },
  { item: ITEMS.FURN_PLANT,     buyPrice: 1 },
];

/* ── ShopKeeper NPC ─────────────────────────────────────── */
export class ShopKeeper {
  constructor() {
    // Placed at center of the building interior
    this.w = 24;
    this.h = 32;
    this.x = Math.floor(WORLD_COLS / 2) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = Math.floor(WORLD_ROWS / 2) * TILE_SIZE;
    this.name = 'Shop';
  }

  /** True if a world-coordinate point lands inside this NPC's rect */
  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w &&
           wy >= this.y && wy <= this.y + this.h;
  }

  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const { w, h } = this;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#4a3424';
    ctx.fillRect(x + 5,      y + 26, 5, 6);
    ctx.fillRect(x + w - 10, y + 26, 5, 6);

    // Robe body
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x + 2, y + 10, w - 4, 18);

    // Robe lower (darker)
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(x + 2, y + 22, w - 4, 6);

    // Belt
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(x + 2, y + 20, w - 4, 3);

    // Belt pouch
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + 7, y + 22, 7, 5);

    // Arms
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x - 1, y + 12, 4, 9);
    ctx.fillRect(x + w - 3, y + 12, 4, 9);

    // Head
    ctx.fillStyle = '#deb887';
    ctx.fillRect(x + 4, y + 1, w - 8, 11);

    // Hat brim
    ctx.fillStyle = '#4a2c00';
    ctx.fillRect(x + 1, y + 3, w - 2, 3);

    // Hat top
    ctx.fillStyle = '#5c3800';
    ctx.fillRect(x + 4, y - 6, w - 8, 10);

    // Hat band
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + 4, y + 1, w - 8, 2);

    // Moustache
    ctx.fillStyle = '#5c3800';
    ctx.fillRect(x + 6, y + 8, w - 12, 2);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 6,  y + 5, 2, 2);
    ctx.fillRect(x + 16, y + 5, 2, 2);

    // Name tag (gold)
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(this.name, x + w / 2, y - 10);
    ctx.fillText(this.name, x + w / 2, y - 10);
  }
}

/* ── HouseShopKeeper NPC (inside player house) ─────────── */
export class HouseShopKeeper {
  constructor() {
    this.w = 24;
    this.h = 32;
    // Top-right of the 9×9 plank floor inside the house (box at col 40, row 40 — plank 41-49)
    this.x = 47 * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = 42 * TILE_SIZE;
    this.name = 'Decorator';
  }

  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w &&
           wy >= this.y && wy <= this.y + this.h;
  }

  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const { w, h } = this;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 5,      y + 26, 5, 6);
    ctx.fillRect(x + w - 10, y + 26, 5, 6);

    ctx.fillStyle = '#2c3e7a'; ctx.fillRect(x + 2, y + 10, w - 4, 18);
    ctx.fillStyle = '#1a2a5a'; ctx.fillRect(x + 2, y + 22, w - 4, 6);
    ctx.fillStyle = '#d4a017'; ctx.fillRect(x + 2, y + 20, w - 4, 3);
    ctx.fillStyle = '#8b6914'; ctx.fillRect(x + 7, y + 22, 7, 5);
    ctx.fillStyle = '#2c3e7a';
    ctx.fillRect(x - 1,      y + 12, 4, 9);
    ctx.fillRect(x + w - 3,  y + 12, 4, 9);

    ctx.fillStyle = '#deb887'; ctx.fillRect(x + 4, y + 1, w - 8, 11);
    ctx.fillStyle = '#2c3e7a'; ctx.fillRect(x + 1, y + 3, w - 2, 3);
    ctx.fillStyle = '#1a2a5a'; ctx.fillRect(x + 4, y - 6, w - 8, 10);
    ctx.fillStyle = '#d4a017'; ctx.fillRect(x + 4, y + 1, w - 8, 2);

    ctx.fillStyle = '#222';
    ctx.fillRect(x + 6,  y + 5, 2, 2);
    ctx.fillRect(x + 16, y + 5, 2, 2);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 8,  y + 8, 2, 1);
    ctx.fillRect(x + 14, y + 8, 2, 1);
    ctx.fillRect(x + 10, y + 9, 4, 1);

    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(this.name, x + w / 2, y - 10);
    ctx.fillText(this.name, x + w / 2, y - 10);
  }
}
