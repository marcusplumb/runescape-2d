import { ITEMS } from './items.js';
import { TILE_SIZE, WORLD_COLS, WORLD_ROWS } from './constants.js';


/* ── Kingdom shop stock ─────────────────────────────── */

export const BUTCHER_STOCK = [
  { item: ITEMS.RAW_BEEF,      buyPrice:  6 },
  { item: ITEMS.RAW_CHICKEN,   buyPrice:  4 },
  { item: ITEMS.RAW_PORK,      buyPrice:  5 },
  { item: ITEMS.RAW_LAMB,      buyPrice:  8 },
  { item: ITEMS.RAW_VENISON,   buyPrice: 14 },
  { item: ITEMS.COOKED_BEEF,   buyPrice: 14 },
  { item: ITEMS.COOKED_CHICKEN,buyPrice: 10 },
  { item: ITEMS.COOKED_PORK,   buyPrice: 12 },
];

export const BUTCHER_SELL_PRICES = {
  raw_beef: 3, cooked_beef: 7,
  raw_chicken: 2, cooked_chicken: 5,
  raw_pork: 2, cooked_pork: 6,
  raw_lamb: 4, cooked_lamb: 9,
  raw_venison: 7, cooked_venison: 12,
  burnt_meat: 1,
};

export const WEAPON_SHOP_STOCK = [
  { item: ITEMS.STEEL_SWORD,    buyPrice:  400 },
  { item: ITEMS.MITHRIL_SWORD,  buyPrice: 1100 },
  { item: ITEMS.STEEL_HELM,     buyPrice:  440 },
  { item: ITEMS.MITHRIL_HELM,   buyPrice: 1200 },
  { item: ITEMS.STEEL_PLATE,    buyPrice: 1080 },
  { item: ITEMS.MITHRIL_PLATE,  buyPrice: 2800 },
];

export const WEAPON_SELL_PRICES = {
  bronze_sword: 25, iron_sword: 70, steel_sword: 200, mithril_sword: 550,
  bronze_helm: 30, iron_helm: 80, steel_helm: 220, mithril_helm: 600,
  bronze_plate: 80, iron_plate: 200, steel_plate: 540, mithril_plate: 1400,
};

export const VARIETY_STOCK = [
  { item: ITEMS.AXE,           buyPrice:  40 },
  { item: ITEMS.PICKAXE,       buyPrice:  50 },
  { item: ITEMS.TINDERBOX,     buyPrice:  20 },
  { item: ITEMS.FISHING_ROD,   buyPrice:  60 },
  { item: ITEMS.FISHING_BAIT,  buyPrice:   3 },
  { item: ITEMS.COOKED_BEEF,   buyPrice:  14 },
  { item: ITEMS.COOKED_CHICKEN,buyPrice:  10 },
  { item: ITEMS.COOKED_TROUT,  buyPrice:  20 },
];

export const VARIETY_SELL_PRICES = {
  axe: 20, pickaxe: 25, tinderbox: 10, fishing_rod: 30, fishing_bait: 1,
  logs: 5, oak_logs: 12, willow_logs: 25, maple_logs: 50, yew_logs: 100,
  bones: 2,
};

export const CAPE_STOCK = [
  { item: ITEMS.BROWN_CAPE,      buyPrice:  80 },
  { item: ITEMS.RED_CAPE,        buyPrice:  80 },
  { item: ITEMS.BLUE_CAPE,       buyPrice:  80 },
  { item: ITEMS.GREEN_CAPE,      buyPrice:  80 },
  { item: ITEMS.WARRIOR_CAPE,    buyPrice: 400 },
  { item: ITEMS.BERSERKER_CAPE,  buyPrice: 600 },
];

export const CAPE_SELL_PRICES = {
  brown_cape: 40, red_cape: 40, blue_cape: 40, green_cape: 40,
  warrior_cape: 200, berserker_cape: 300,
};

/* ── Smithy shop (weapons + armour up to steel) ─────── */
export const SMITHY_STOCK = [
  // Weapons
  { item: ITEMS.BRONZE_SWORD,      buyPrice:   60 },
  { item: ITEMS.IRON_SWORD,        buyPrice:  160 },
  { item: ITEMS.STEEL_SWORD,       buyPrice:  400 },
  // Helmets
  { item: ITEMS.BRONZE_HELM,       buyPrice:   70 },
  { item: ITEMS.IRON_HELM,         buyPrice:  180 },
  { item: ITEMS.STEEL_HELM,        buyPrice:  440 },
  // Chestplates
  { item: ITEMS.BRONZE_PLATE,      buyPrice:  170 },
  { item: ITEMS.IRON_PLATE,        buyPrice:  440 },
  { item: ITEMS.STEEL_PLATE,       buyPrice: 1080 },
  // Leggings (no steel legs exists)
  { item: ITEMS.BRONZE_LEGS,       buyPrice:   90 },
  { item: ITEMS.IRON_LEGS,         buyPrice:  230 },
  // Gauntlets
  { item: ITEMS.BRONZE_GAUNTLETS,  buyPrice:   50 },
  { item: ITEMS.IRON_GAUNTLETS,    buyPrice:  130 },
  { item: ITEMS.STEEL_GAUNTLETS,   buyPrice:  300 },
  // Boots
  { item: ITEMS.BRONZE_BOOTS,      buyPrice:   50 },
  { item: ITEMS.IRON_BOOTS,        buyPrice:  130 },
  { item: ITEMS.STEEL_BOOTS,       buyPrice:  300 },
];

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
  { item: ITEMS.BERRY_BUSH_SAPLING, buyPrice: 15 },
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
  iron_gauntlets:   40,
  iron_boots:   40,
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
  steel_gauntlets:  150,
  tungsten_plate:   1600,
  // Mithril (also in weapon shop but sellable here too)
  mithril_helm:     600,
  mithril_plate:    1400,
  mithril_legs:     500,
  // Bronze/leather armour tiers
  bronze_legs:      40,
  bronze_gauntlets: 20,
  bronze_boots:     20,
  leather_cap:      15,
  leather_body:     35,
  leather_legs:     25,
  leather_gloves:   12,
  leather_boots:    12,
  steel_boots:      80,
  // Epic equipment (rare drops)
  berserker_axe:    800,
  shadow_dagger:    600,
  venom_blade:      700,
  berserker_mask:   500,
  shadow_tunic:     700,
  berserker_wraps:  300,
  shadow_treads:    300,
  // Farming seeds
  potato_seed:      1,
  berry_seed:       1,
  herb_seed:        2,
  flax_seed:        3,
  magic_seed:       10,
  berry_bush_sapling: 8,
  // Farming harvest
  potato:           3,
  berries:          2,
  mushroom:         3,
  reeds:            2,
  snowberries:      5,
  sulfur:           18,
  thorn_vine:       6,
  cactus_bloom:     10,
  herb:             5,
  flax:             8,
  magic_herb:       25,
  // Raid materials
  ancient_bone:     50,
  silk_thread:      80,
  stone_core:       100,
  dragon_scale:     200,
  raid_token:       10,
  chaos_fragment:   150,
  // Raid weapons
  raid_blade:       2000,
  voidbane_sword:   3000,
  chaos_edge:       4000,
  dungeon_greataxe: 2500,
  // Raid armour
  raiders_helm:     800,
  raiders_plate:    1800,
  raiders_legs:     1200,
  raiders_gauntlets:500,
  voidguard_helm:   1500,
  voidguard_plate:  3500,
  voidguard_legs:   2500,
  voidguard_boots:  1000,
  // Vitality items
  dragonhide_helm:  600,
  trollhide_vest:   700,
  obsidian_plate:   2200,
  vitality_cape:    400,
};

/* ── ShopKeeper NPC ─────────────────────────────────────── */
export class ShopKeeper {
  constructor() {
    // Placed inside the middle (N) village house — spawnC-5, bldTop-14
    this.w = 24;
    this.h = 32;
    const spawnC  = Math.floor(WORLD_COLS / 2);       // 512
    const bldTop  = Math.floor(WORLD_ROWS / 2) - 3;   // 381
    const HW = 7;
    const shopLeft = spawnC - 5;                       // 507
    const shopTop  = bldTop - 14;                      // 367
    // Centre of interior back row — behind the table counter
    this.x = (shopLeft + 1 + Math.floor((HW - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (shopTop + 1) * TILE_SIZE;
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

  }
}

/* ── SmithyKeeper NPC — stands at the forge entrance ── */
export class SmithyKeeper {
  constructor() {
    this.w = 24;
    this.h = 32;
    // Forge is at spawnC-18, spawnR-6 (FC=494, FR=383).
    // NPC stands 1 tile south of the open forge entrance (col FC+4=498, row FR+4=387).
    const spawnC = Math.floor(WORLD_COLS / 2);
    const spawnR = Math.floor(WORLD_ROWS / 2) + 5;
    const FC = spawnC - 18;
    const FR = spawnR - 6;
    this.x = (FC + 4) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (FR + 4) * TILE_SIZE;
    this.name = 'Smith';
  }

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

    // Boots
    ctx.fillStyle = '#1a1408';
    ctx.fillRect(x + 4, y + 28, 6, 4);
    ctx.fillRect(x + w - 10, y + 28, 6, 4);

    // Trousers
    ctx.fillStyle = '#2c2010';
    ctx.fillRect(x + 3, y + 22, 7, 8);
    ctx.fillRect(x + w - 10, y + 22, 7, 8);

    // Dark shirt
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x + 2, y + 11, w - 4, 13);

    // Leather apron
    ctx.fillStyle = '#7a4e22';
    ctx.fillRect(x + 5, y + 13, w - 10, 13);
    ctx.fillStyle = '#5a3a14';
    ctx.fillRect(x + 5, y + 13, 1, 13);
    ctx.fillRect(x + w - 6, y + 13, 1, 13);

    // Apron shoulder ties
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(x + 1, y + 14, 5, 2);
    ctx.fillRect(x + w - 6, y + 14, 5, 2);

    // Arms (muscular)
    ctx.fillStyle = '#a06840';
    ctx.fillRect(x - 2, y + 12, 5, 11);
    ctx.fillRect(x + w - 3, y + 12, 5, 11);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(x - 2, y + 17, 5, 1);
    ctx.fillRect(x + w - 3, y + 17, 5, 1);

    // Hammer (right hand)
    ctx.fillStyle = '#6a6a6a';
    ctx.fillRect(x + w + 1, y + 12, 5, 4);
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(x + w + 2, y + 16, 2, 9);

    // Head
    ctx.fillStyle = '#a06840';
    ctx.fillRect(x + 4, y + 1, w - 8, 11);

    // Heavy brows
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(x + 4, y + 4, 6, 2);
    ctx.fillRect(x + 14, y + 4, 6, 2);

    // Eyes (squinted)
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 6, y + 7, 3, 2);
    ctx.fillRect(x + 15, y + 7, 3, 2);

    // Thick dark beard
    ctx.fillStyle = '#2c1a08';
    ctx.fillRect(x + 4, y + 8, w - 8, 5);
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(x + 5, y + 9, 3, 3);

    // Soot smudge
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(x + 9, y + 5, 2, 2);
    ctx.fillRect(x + 15, y + 8, 3, 2);

    // Headband
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(x + 4, y + 1, w - 8, 3);

    // Name tag
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(this.name, x + w / 2, y - 10);
    ctx.fillText(this.name, x + w / 2, y - 10);
  }
}

/* ── Shared helpers for kingdom NPC rendering ──────── */
function _drawNpcLabel(ctx, x, y, w, name) {
  ctx.fillStyle = '#f1c40f';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.strokeText(name, x + w / 2, y - 10);
  ctx.fillText(name, x + w / 2, y - 10);
}
function _drawShadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ── ButcherKeeper NPC ─────────────────────────────── */
export class ButcherKeeper {
  constructor() {
    this.w = 24; this.h = 32;
    this.name = 'Butcher';
    // World coords: kingdom cx=512,cy=208 → ox=474,oy=178 → bldR=200,westC=479
    // Butcher building: (479,200) w=12 h=8 → inner center col 485, first inner row 201
    this.x = (479 + 1 + Math.floor((12 - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (200 + 1) * TILE_SIZE;
  }
  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w && wy >= this.y && wy <= this.y + this.h;
  }
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y), { w, h } = this;
    _drawShadow(ctx, x, y, w, h);
    ctx.fillStyle = '#2c1a08'; ctx.fillRect(x+5, y+26, 5, 6); ctx.fillRect(x+w-10, y+26, 5, 6);
    ctx.fillStyle = '#8b1a1a'; ctx.fillRect(x+2, y+10, w-4, 18);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x+4, y+12, w-8, 16); // white apron
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x+6, y+14, 3, 2); ctx.fillRect(x+12, y+18, 2, 3); ctx.fillRect(x+9, y+22, 4, 2); // blood
    ctx.fillStyle = '#4a2010'; ctx.fillRect(x+2, y+22, w-4, 3); // belt
    ctx.fillStyle = '#8b1a1a'; ctx.fillRect(x-1, y+12, 4, 9); ctx.fillRect(x+w-3, y+12, 4, 9);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(x+w+1, y+14, 6, 5); // cleaver blade
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(x+w+3, y+19, 2, 5); // cleaver handle
    ctx.fillStyle = '#deb887'; ctx.fillRect(x+4, y+1, w-8, 11);
    ctx.fillStyle = '#f0ece0'; ctx.fillRect(x+2, y+1, w-4, 5); // white cap
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x+1, y+3, w-2, 2);
    ctx.fillStyle = '#222'; ctx.fillRect(x+6, y+5, 2, 2); ctx.fillRect(x+16, y+5, 2, 2);
    ctx.fillStyle = '#5c2a00'; ctx.fillRect(x+6, y+8, w-12, 2); // moustache
    _drawNpcLabel(ctx, x, y, w, this.name);
  }
}

/* ── WeaponKeeper NPC ──────────────────────────────── */
export class WeaponKeeper {
  constructor() {
    this.w = 24; this.h = 32;
    this.name = 'Weaponsmith';
    // World coords: Weapons building: (533,200) w=12 h=8 → inner center col 539, second inner row 202
    this.x = (533 + 1 + Math.floor((12 - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (200 + 2) * TILE_SIZE;
  }
  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w && wy >= this.y && wy <= this.y + this.h;
  }
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y), { w, h } = this;
    _drawShadow(ctx, x, y, w, h);
    ctx.fillStyle = '#5a6070'; ctx.fillRect(x+5, y+26, 5, 6); ctx.fillRect(x+w-10, y+26, 5, 6); // armoured legs
    ctx.fillStyle = '#7a8090'; ctx.fillRect(x+5, y+26, 5, 2); ctx.fillRect(x+w-10, y+26, 5, 2);
    ctx.fillStyle = '#6a7080'; ctx.fillRect(x+2, y+10, w-4, 18); // chainmail body
    ctx.fillStyle = '#9aabb0'; ctx.fillRect(x+5, y+12, w-10, 8); // plate chest
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x+6, y+12, 5, 3);
    ctx.fillStyle = '#4a3820'; ctx.fillRect(x+2, y+22, w-4, 3); // belt
    ctx.fillStyle = '#c8a030'; ctx.fillRect(x+9, y+22, 6, 3); // buckle
    ctx.fillStyle = '#6a7080'; ctx.fillRect(x-1, y+12, 4, 9); ctx.fillRect(x+w-3, y+12, 4, 9);
    ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x-4, y+8, 2, 18); // sword
    ctx.fillStyle = '#c8a030'; ctx.fillRect(x-6, y+14, 6, 2); // crossguard
    ctx.fillStyle = '#5a3818'; ctx.fillRect(x-3, y+25, 2, 5); // handle
    ctx.fillStyle = '#deb887'; ctx.fillRect(x+4, y+1, w-8, 11);
    ctx.fillStyle = '#6a7080'; ctx.fillRect(x+2, y+1, w-4, 6); // helmet
    ctx.fillStyle = '#9aabb0'; ctx.fillRect(x+4, y+1, 4, 1); ctx.fillRect(x+16, y+1, 4, 1);
    ctx.fillStyle = '#222'; ctx.fillRect(x+6, y+6, 2, 2); ctx.fillRect(x+16, y+6, 2, 2);
    ctx.fillStyle = '#4a3010'; ctx.fillRect(x+5, y+9, w-10, 3); // beard
    _drawNpcLabel(ctx, x, y, w, this.name);
  }
}

/* ── VarietyKeeper NPC ─────────────────────────────── */
export class VarietyKeeper {
  constructor() {
    this.w = 24; this.h = 32;
    this.name = 'Variety Shop';
    // World coords: Variety building: (479,221) w=12 h=7 → inner center col 485, second inner row 223
    this.x = (479 + 1 + Math.floor((12 - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (221 + 2) * TILE_SIZE;
  }
  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w && wy >= this.y && wy <= this.y + this.h;
  }
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y), { w, h } = this;
    _drawShadow(ctx, x, y, w, h);
    ctx.fillStyle = '#2c3e50'; ctx.fillRect(x+5, y+26, 5, 6); ctx.fillRect(x+w-10, y+26, 5, 6);
    ctx.fillStyle = '#1a6b6b'; ctx.fillRect(x+2, y+10, w-4, 18); // teal tunic
    ctx.fillStyle = '#7a1e7a'; ctx.fillRect(x+5, y+12, w-10, 12); // purple vest
    ctx.fillStyle = '#c8a030';
    ctx.fillRect(x+10, y+13, 2, 2); ctx.fillRect(x+10, y+17, 2, 2); ctx.fillRect(x+10, y+21, 2, 2); // buttons
    ctx.fillStyle = '#5a3010'; ctx.fillRect(x+2, y+22, w-4, 3);
    ctx.fillStyle = '#8b6914'; ctx.fillRect(x+7, y+22, 6, 5); // pouch
    ctx.fillStyle = '#1a6b6b'; ctx.fillRect(x-1, y+12, 4, 9); ctx.fillRect(x+w-3, y+12, 4, 9);
    ctx.fillStyle = '#deb887'; ctx.fillRect(x+4, y+1, w-8, 11);
    ctx.fillStyle = '#7a1e7a'; ctx.fillRect(x+1, y+3, w-2, 3); // hat brim
    ctx.fillStyle = '#5a0e5a'; ctx.fillRect(x+5, y-4, w-10, 8); // hat top
    ctx.fillStyle = '#c8a030'; ctx.fillRect(x+5, y+2, w-10, 2); // hat band
    ctx.fillStyle = '#222'; ctx.fillRect(x+6, y+5, 2, 2); ctx.fillRect(x+16, y+5, 2, 2);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(x+7, y+8, 2, 1); ctx.fillRect(x+15, y+8, 2, 1); ctx.fillRect(x+9, y+9, 6, 1); // smile
    _drawNpcLabel(ctx, x, y, w, this.name);
  }
}

/* ── CapeKeeper NPC ────────────────────────────────── */
export class CapeKeeper {
  constructor() {
    this.w = 24; this.h = 32;
    this.name = 'Cape Merchant';
    // World coords: Capes building: (533,211) w=10 h=7 → inner center col 538, second inner row 213
    this.x = (533 + 1 + Math.floor((10 - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (211 + 2) * TILE_SIZE;
  }
  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w && wy >= this.y && wy <= this.y + this.h;
  }
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y), { w, h } = this;
    _drawShadow(ctx, x, y, w, h);
    // Dramatic sweeping cape
    ctx.fillStyle = '#8b0000';
    ctx.beginPath(); ctx.moveTo(x-4, y+8); ctx.lineTo(x-8, y+h+2);
    ctx.lineTo(x+w+8, y+h+2); ctx.lineTo(x+w+4, y+8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c80000'; ctx.fillRect(x-3, y+9, w+6, h-8); // lining
    ctx.fillStyle = '#6b0000'; ctx.fillRect(x-4, y+8, 2, h-4); ctx.fillRect(x+w+2, y+8, 2, h-4);
    ctx.fillStyle = '#2c2010'; ctx.fillRect(x+5, y+26, 5, 6); ctx.fillRect(x+w-10, y+26, 5, 6);
    ctx.fillStyle = '#1a1050'; ctx.fillRect(x+2, y+10, w-4, 18); // shirt
    ctx.fillStyle = '#c8a030'; ctx.fillRect(x+8, y+10, 8, 3); // clasp
    ctx.fillStyle = '#f0c840'; ctx.fillRect(x+10, y+10, 4, 1);
    ctx.fillStyle = '#8b0000'; ctx.fillRect(x-1, y+12, 4, 9); ctx.fillRect(x+w-3, y+12, 4, 9);
    ctx.fillStyle = '#deb887'; ctx.fillRect(x+4, y+1, w-8, 11);
    ctx.fillStyle = '#1a1050'; ctx.fillRect(x+2, y+2, w-4, 3); // hat brim
    ctx.fillStyle = '#0d0830'; ctx.fillRect(x+4, y-3, w-8, 6); // hat top
    ctx.fillStyle = '#c8a030'; ctx.fillRect(x+4, y+1, w-8, 2); // gold band
    ctx.fillStyle = '#e84040'; ctx.fillRect(x+15, y-6, 2, 8); // feather
    ctx.fillStyle = '#ff6060'; ctx.fillRect(x+15, y-5, 1, 5);
    ctx.fillStyle = '#222'; ctx.fillRect(x+6, y+5, 2, 2); ctx.fillRect(x+16, y+5, 2, 2);
    ctx.fillStyle = '#2c1a08'; ctx.fillRect(x+7, y+8, w-14, 1); // thin moustache
    _drawNpcLabel(ctx, x, y, w, this.name);
  }
}
