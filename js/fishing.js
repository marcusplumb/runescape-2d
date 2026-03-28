/**
 * fishing.js — Fish species data, Fisherman NPC, panel constants, records helpers.
 */
import { TILES, TILE_SIZE, WORLD_COLS, WORLD_ROWS } from './constants.js';
import { ITEMS } from './items.js';

/* ── Panel geometry ─────────────────────────────────────── */
export const FISH_PW       = 500;
export const FISH_PH       = 510;
export const FISH_HEADER_H = 52;
export const FISH_TAB_H    = 34;
export const FISH_ROW_H    = 44;
export const FISH_PAD      = 10;

export const FISH_TAB_KEYS   = ['guide', 'records', 'buy', 'sell'];
export const FISH_TAB_LABELS = { guide: 'Fish Guide', records: 'Records', buy: 'Buy', sell: 'Sell' };

/* ── Fish species definitions ───────────────────────────── */
// wMin/wMax in kg; xp awarded on catch; baseValue = sell price at fisherman
export const FISH_SPECIES = [
  {
    id: 'shrimp',    name: 'Shrimp',
    get item() { return ITEMS.RAW_SHRIMP; },
    minLevel: 1,  xp: 10,  baseValue: 3,
    wMin: 0.05, wMax: 0.20, rarity: 'Common',
    color: '#e88e7a',
    spots: [TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON, TILES.FISH_SPOT_LOBSTER],
  },
  {
    id: 'sardine',   name: 'Sardine',
    get item() { return ITEMS.RAW_SARDINE; },
    minLevel: 5,  xp: 20,  baseValue: 6,
    wMin: 0.10, wMax: 0.40, rarity: 'Common',
    color: '#b0c8d8',
    spots: [TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON],
  },
  {
    id: 'herring',   name: 'Herring',
    get item() { return ITEMS.RAW_HERRING; },
    minLevel: 10, xp: 30,  baseValue: 10,
    wMin: 0.20, wMax: 0.60, rarity: 'Common',
    color: '#90a8b8',
    spots: [TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON],
  },
  {
    id: 'trout',     name: 'Trout',
    get item() { return ITEMS.RAW_TROUT; },
    minLevel: 20, xp: 50,  baseValue: 18,
    wMin: 0.50, wMax: 3.00, rarity: 'Uncommon',
    color: '#7ab0c4',
    spots: [TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON],
  },
  {
    id: 'salmon',    name: 'Salmon',
    get item() { return ITEMS.RAW_SALMON; },
    minLevel: 30, xp: 70,  baseValue: 30,
    wMin: 1.00, wMax: 6.00, rarity: 'Uncommon',
    color: '#e8946a',
    spots: [TILES.FISH_SPOT_SALMON],
  },
  {
    id: 'tuna',      name: 'Tuna',
    get item() { return ITEMS.RAW_TUNA; },
    minLevel: 40, xp: 80,  baseValue: 45,
    wMin: 5.00, wMax: 25.0, rarity: 'Rare',
    color: '#4a6888',
    spots: [TILES.FISH_SPOT_SALMON, TILES.FISH_SPOT_LOBSTER],
  },
  {
    id: 'lobster',   name: 'Lobster',
    get item() { return ITEMS.RAW_LOBSTER; },
    minLevel: 50, xp: 90,  baseValue: 60,
    wMin: 0.50, wMax: 2.50, rarity: 'Rare',
    color: '#c84830',
    spots: [TILES.FISH_SPOT_LOBSTER],
  },
  {
    id: 'swordfish', name: 'Swordfish',
    get item() { return ITEMS.RAW_SWORDFISH; },
    minLevel: 60, xp: 100, baseValue: 85,
    wMin: 10.0, wMax: 55.0, rarity: 'Very Rare',
    color: '#5888a8',
    spots: [TILES.FISH_SPOT_LOBSTER],
  },
  {
    id: 'shark',     name: 'Shark',
    get item() { return ITEMS.RAW_SHARK; },
    minLevel: 76, xp: 110, baseValue: 120,
    wMin: 30.0, wMax: 150., rarity: 'Legendary',
    color: '#607080',
    spots: [TILES.FISH_SPOT_LOBSTER],
  },
];

/* ── Fisherman shop stock ────────────────────────────────── */
export const FISH_SHOP_STOCK = [
  { item: ITEMS.FISHING_ROD,   buyPrice: 60  },
  { item: ITEMS.FISHING_BAIT,  buyPrice: 3   },
];

/* ── Sell prices at fisherman (fish only) ───────────────── */
export const FISH_SELL_PRICES = Object.fromEntries(
  FISH_SPECIES.flatMap(sp => [
    [sp.id === 'shrimp'    ? 'raw_shrimp'    :
     sp.id === 'sardine'   ? 'raw_sardine'   :
     sp.id === 'herring'   ? 'raw_herring'   :
     sp.id === 'trout'     ? 'raw_trout'     :
     sp.id === 'salmon'    ? 'raw_salmon'    :
     sp.id === 'tuna'      ? 'raw_tuna'      :
     sp.id === 'lobster'   ? 'raw_lobster'   :
     sp.id === 'swordfish' ? 'raw_swordfish' :
                              'raw_shark',    sp.baseValue],
    [sp.id === 'shrimp'    ? 'cooked_shrimp'    :
     sp.id === 'sardine'   ? 'cooked_sardine'   :
     sp.id === 'herring'   ? 'cooked_herring'   :
     sp.id === 'trout'     ? 'cooked_trout'     :
     sp.id === 'salmon'    ? 'cooked_salmon'    :
     sp.id === 'tuna'      ? 'cooked_tuna'      :
     sp.id === 'lobster'   ? 'cooked_lobster'   :
     sp.id === 'swordfish' ? 'cooked_swordfish' :
                              'cooked_shark',    Math.round(sp.baseValue * 2.5)],
  ])
);

/* ── Blank fishing records (call makeFishingRecords()) ──── */
export function makeFishingRecords() {
  return {
    totalCaught:  0,
    totalWeight:  0,
    personalBest: null,   // { speciesId, name, weight }
    bySpecies:    Object.fromEntries(
      FISH_SPECIES.map(sp => [sp.id, { count: 0, heaviest: 0 }])
    ),
  };
}

/* ── makeFishItem ────────────────────────────────────────── */
export function makeFishItem(species, weight) {
  return {
    ...species.item,
    name: `${species.name} (${weight}kg)`,
    weight,
    stackable: false,
  };
}

/* ── Fisherman NPC ──────────────────────────────────────── */
export class FishermanNPC {
  constructor() {
    this.w = 24;
    this.h = 32;
    this.x = 525 * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = 394 * TILE_SIZE;
    this.name = 'Fisherman';
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
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x + 4,      y + 27, 6, 5);
    ctx.fillRect(x + w - 10, y + 27, 6, 5);

    // Trousers
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(x + 4,      y + 20, 6, 8);
    ctx.fillRect(x + w - 10, y + 20, 6, 8);

    // Coat body (navy)
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(x + 2, y + 10, w - 4, 13);

    // Coat lower darker stripe
    ctx.fillStyle = '#141e38';
    ctx.fillRect(x + 2, y + 20, w - 4, 3);

    // Belt
    ctx.fillStyle = '#4a3010';
    ctx.fillRect(x + 2, y + 19, w - 4, 2);

    // Arms (coat sleeves)
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(x - 1, y + 12, 4, 9);
    ctx.fillRect(x + w - 3, y + 12, 4, 9);

    // Hands
    ctx.fillStyle = '#deb887';
    ctx.fillRect(x - 1, y + 20, 4, 3);
    ctx.fillRect(x + w - 3, y + 20, 4, 3);

    // Fishing rod (held in right hand, pointing up-right)
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + w - 2, y + 4, 2, 18);
    ctx.fillStyle = 'rgba(200,200,200,0.7)';
    ctx.beginPath();
    ctx.moveTo(x + w - 1, y + 4);
    ctx.lineTo(x + w + 8, y + 14);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#deb887';
    ctx.fillRect(x + 4, y + 1, w - 8, 11);

    // Rain hat brim
    ctx.fillStyle = '#c8a020';
    ctx.fillRect(x + 0, y + 4, w, 3);

    // Rain hat top
    ctx.fillStyle = '#d4aa28';
    ctx.fillRect(x + 3, y - 5, w - 6, 10);

    // Hat band
    ctx.fillStyle = '#7a6010';
    ctx.fillRect(x + 3, y + 3, w - 6, 2);

    // Beard
    ctx.fillStyle = '#6a5030';
    ctx.fillRect(x + 5, y + 7, w - 10, 4);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 6,  y + 4, 2, 2);
    ctx.fillRect(x + 16, y + 4, 2, 2);

    // Name tag
    ctx.fillStyle = '#3498db';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(this.name, x + w / 2, y - 10);
    ctx.fillText(this.name, x + w / 2, y - 10);
  }
}
