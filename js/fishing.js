/**
 * fishing.js — Fish species data, Fisherman NPC, panel constants, records helpers.
 */
import { TILE_SIZE } from './constants.js';
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
// wMin/wMax in kg; xp on catch; baseValue = sell at fisherman
// biomes: array of environment strings ('plains','forest','tundra','swamp',
//         'desert','volcanic','danger','underground')
// rarityWeight: Common=60, Uncommon=25, Rare=10, Very Rare=3, Legendary=1
export const FISH_SPECIES = [
  // ── Plains & Forest (freshwater) ─────────────────────
  {
    id: 'gudgeon',      name: 'Gudgeon',
    get item() { return ITEMS.RAW_GUDGEON; },
    minLevel: 1,  xp: 8,   baseValue: 2,
    wMin: 0.02, wMax: 0.15, rarity: 'Common',    rarityWeight: 60,
    color: '#b8a870', biomes: ['plains', 'forest'],
  },
  {
    id: 'shrimp',       name: 'Shrimp',
    get item() { return ITEMS.RAW_SHRIMP; },
    minLevel: 1,  xp: 10,  baseValue: 3,
    wMin: 0.05, wMax: 0.20, rarity: 'Common',    rarityWeight: 60,
    color: '#e88e7a', biomes: ['plains'],
  },
  {
    id: 'sardine',      name: 'Sardine',
    get item() { return ITEMS.RAW_SARDINE; },
    minLevel: 5,  xp: 20,  baseValue: 6,
    wMin: 0.10, wMax: 0.40, rarity: 'Common',    rarityWeight: 60,
    color: '#b0c8d8', biomes: ['plains', 'forest'],
  },
  {
    id: 'carp',         name: 'Carp',
    get item() { return ITEMS.RAW_CARP; },
    minLevel: 5,  xp: 18,  baseValue: 7,
    wMin: 0.20, wMax: 1.50, rarity: 'Common',    rarityWeight: 55,
    color: '#8a9060', biomes: ['plains', 'forest', 'swamp'],
  },
  {
    id: 'herring',      name: 'Herring',
    get item() { return ITEMS.RAW_HERRING; },
    minLevel: 10, xp: 30,  baseValue: 10,
    wMin: 0.20, wMax: 0.60, rarity: 'Common',    rarityWeight: 55,
    color: '#90a8b8', biomes: ['plains', 'forest'],
  },
  {
    id: 'perch',        name: 'Perch',
    get item() { return ITEMS.RAW_PERCH; },
    minLevel: 12, xp: 35,  baseValue: 12,
    wMin: 0.15, wMax: 0.80, rarity: 'Common',    rarityWeight: 50,
    color: '#c0a858', biomes: ['plains', 'forest'],
  },
  {
    id: 'trout',        name: 'Trout',
    get item() { return ITEMS.RAW_TROUT; },
    minLevel: 20, xp: 50,  baseValue: 18,
    wMin: 0.50, wMax: 3.00, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#7ab0c4', biomes: ['plains', 'forest'],
  },
  {
    id: 'bass',         name: 'Bass',
    get item() { return ITEMS.RAW_BASS; },
    minLevel: 25, xp: 60,  baseValue: 22,
    wMin: 0.30, wMax: 2.50, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#90b898', biomes: ['forest', 'plains'],
  },
  {
    id: 'walleye',      name: 'Walleye',
    get item() { return ITEMS.RAW_WALLEYE; },
    minLevel: 28, xp: 65,  baseValue: 25,
    wMin: 0.50, wMax: 4.00, rarity: 'Uncommon',  rarityWeight: 22,
    color: '#a0b8c8', biomes: ['plains'],
  },
  {
    id: 'salmon',       name: 'Salmon',
    get item() { return ITEMS.RAW_SALMON; },
    minLevel: 30, xp: 70,  baseValue: 30,
    wMin: 1.00, wMax: 6.00, rarity: 'Uncommon',  rarityWeight: 22,
    color: '#e8946a', biomes: ['forest', 'plains'],
  },
  {
    id: 'pike',         name: 'Pike',
    get item() { return ITEMS.RAW_PIKE; },
    minLevel: 35, xp: 75,  baseValue: 35,
    wMin: 0.80, wMax: 7.00, rarity: 'Uncommon',  rarityWeight: 20,
    color: '#708048', biomes: ['forest', 'plains'],
  },
  {
    id: 'tuna',         name: 'Tuna',
    get item() { return ITEMS.RAW_TUNA; },
    minLevel: 40, xp: 80,  baseValue: 45,
    wMin: 5.00, wMax: 25.0, rarity: 'Rare',       rarityWeight: 10,
    color: '#4a6888', biomes: ['plains', 'forest'],
  },
  {
    id: 'lobster',      name: 'Lobster',
    get item() { return ITEMS.RAW_LOBSTER; },
    minLevel: 50, xp: 90,  baseValue: 60,
    wMin: 0.50, wMax: 2.50, rarity: 'Rare',       rarityWeight: 10,
    color: '#c84830', biomes: ['danger', 'plains'],
  },
  {
    id: 'barracuda',    name: 'Barracuda',
    get item() { return ITEMS.RAW_BARRACUDA; },
    minLevel: 50, xp: 92,  baseValue: 65,
    wMin: 2.00, wMax: 12.0, rarity: 'Rare',       rarityWeight: 10,
    color: '#607888', biomes: ['forest', 'danger'],
  },
  {
    id: 'swordfish',    name: 'Swordfish',
    get item() { return ITEMS.RAW_SWORDFISH; },
    minLevel: 60, xp: 100, baseValue: 85,
    wMin: 10.0, wMax: 55.0, rarity: 'Very Rare',  rarityWeight: 3,
    color: '#5888a8', biomes: ['plains', 'forest'],
  },
  {
    id: 'giant_squid',  name: 'Giant Squid',
    get item() { return ITEMS.RAW_GIANT_SQUID; },
    minLevel: 65, xp: 105, baseValue: 95,
    wMin: 5.00, wMax: 40.0, rarity: 'Very Rare',  rarityWeight: 3,
    color: '#cc4488', biomes: ['danger', 'plains'],
  },
  {
    id: 'shark',        name: 'Shark',
    get item() { return ITEMS.RAW_SHARK; },
    minLevel: 76, xp: 110, baseValue: 120,
    wMin: 30.0, wMax: 150., rarity: 'Legendary',  rarityWeight: 1,
    color: '#607080', biomes: ['plains', 'danger'],
  },

  // ── Tundra (cold water) ───────────────────────────────
  {
    id: 'ice_fish',     name: 'Ice Fish',
    get item() { return ITEMS.RAW_ICE_FISH; },
    minLevel: 15, xp: 38,  baseValue: 14,
    wMin: 0.10, wMax: 0.50, rarity: 'Common',    rarityWeight: 60,
    color: '#b8e0f8', biomes: ['tundra'],
  },
  {
    id: 'arctic_char',  name: 'Arctic Char',
    get item() { return ITEMS.RAW_ARCTIC_CHAR; },
    minLevel: 25, xp: 62,  baseValue: 28,
    wMin: 0.30, wMax: 2.00, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#88c8e8', biomes: ['tundra'],
  },
  {
    id: 'snowflake_eel', name: 'Snowflake Eel',
    get item() { return ITEMS.RAW_SNOWFLAKE_EEL; },
    minLevel: 40, xp: 82,  baseValue: 50,
    wMin: 0.50, wMax: 3.00, rarity: 'Rare',       rarityWeight: 10,
    color: '#d0e8f8', biomes: ['tundra'],
  },
  {
    id: 'glacierfish',  name: 'Glacierfish',
    get item() { return ITEMS.RAW_GLACIERFISH; },
    minLevel: 65, xp: 108, baseValue: 100,
    wMin: 2.00, wMax: 15.0, rarity: 'Legendary',  rarityWeight: 1,
    color: '#a8d8f8', biomes: ['tundra'],
  },

  // ── Swamp (murky water) ───────────────────────────────
  {
    id: 'mudskipper',   name: 'Mudskipper',
    get item() { return ITEMS.RAW_MUDSKIPPER; },
    minLevel: 10, xp: 28,  baseValue: 9,
    wMin: 0.05, wMax: 0.30, rarity: 'Common',    rarityWeight: 60,
    color: '#7a8a5a', biomes: ['swamp'],
  },
  {
    id: 'swamp_eel',    name: 'Swamp Eel',
    get item() { return ITEMS.RAW_SWAMP_EEL; },
    minLevel: 20, xp: 52,  baseValue: 20,
    wMin: 0.20, wMax: 1.50, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#5a7a50', biomes: ['swamp'],
  },
  {
    id: 'slimejack',    name: 'Slimejack',
    get item() { return ITEMS.RAW_SLIMEJACK; },
    minLevel: 35, xp: 78,  baseValue: 42,
    wMin: 0.30, wMax: 2.50, rarity: 'Rare',       rarityWeight: 10,
    color: '#809060', biomes: ['swamp'],
  },
  {
    id: 'mutant_carp',  name: 'Mutant Carp',
    get item() { return ITEMS.RAW_MUTANT_CARP; },
    minLevel: 55, xp: 96,  baseValue: 75,
    wMin: 1.00, wMax: 8.00, rarity: 'Very Rare',  rarityWeight: 3,
    color: '#6a8c50', biomes: ['swamp'],
  },

  // ── Desert (oasis / sandy water) ─────────────────────
  {
    id: 'sandy_goby',   name: 'Sandy Goby',
    get item() { return ITEMS.RAW_SANDY_GOBY; },
    minLevel: 5,  xp: 22,  baseValue: 8,
    wMin: 0.03, wMax: 0.20, rarity: 'Common',    rarityWeight: 60,
    color: '#d8c890', biomes: ['desert'],
  },
  {
    id: 'pufferfish',   name: 'Pufferfish',
    get item() { return ITEMS.RAW_PUFFERFISH; },
    minLevel: 20, xp: 55,  baseValue: 22,
    wMin: 0.10, wMax: 0.80, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#e8d060', biomes: ['desert'],
  },
  {
    id: 'sandfish',     name: 'Sandfish',
    get item() { return ITEMS.RAW_SANDFISH; },
    minLevel: 40, xp: 85,  baseValue: 55,
    wMin: 0.50, wMax: 4.00, rarity: 'Rare',       rarityWeight: 10,
    color: '#c8a850', biomes: ['desert'],
  },

  // ── Volcanic (hot springs / lava channels) ────────────
  {
    id: 'lava_eel',     name: 'Lava Eel',
    get item() { return ITEMS.RAW_LAVA_EEL; },
    minLevel: 25, xp: 60,  baseValue: 30,
    wMin: 0.30, wMax: 2.00, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#e85820', biomes: ['volcanic'],
  },
  {
    id: 'magma_carp',   name: 'Magma Carp',
    get item() { return ITEMS.RAW_MAGMA_CARP; },
    minLevel: 45, xp: 88,  baseValue: 58,
    wMin: 0.80, wMax: 6.00, rarity: 'Rare',       rarityWeight: 10,
    color: '#d84820', biomes: ['volcanic'],
  },
  {
    id: 'dragon_goby',  name: 'Dragon Goby',
    get item() { return ITEMS.RAW_DRAGON_GOBY; },
    minLevel: 65, xp: 106, baseValue: 98,
    wMin: 1.00, wMax: 9.00, rarity: 'Very Rare',  rarityWeight: 3,
    color: '#c03010', biomes: ['volcanic'],
  },

  // ── Underground (caves / dungeons) ───────────────────
  {
    id: 'cave_fish',    name: 'Cave Fish',
    get item() { return ITEMS.RAW_CAVE_FISH; },
    minLevel: 20, xp: 48,  baseValue: 16,
    wMin: 0.10, wMax: 0.80, rarity: 'Common',    rarityWeight: 60,
    color: '#808898', biomes: ['underground'],
  },
  {
    id: 'blind_crayfish', name: 'Blind Crayfish',
    get item() { return ITEMS.RAW_BLIND_CRAYFISH; },
    minLevel: 30, xp: 68,  baseValue: 32,
    wMin: 0.10, wMax: 0.60, rarity: 'Uncommon',  rarityWeight: 25,
    color: '#d0b090', biomes: ['underground'],
  },
  {
    id: 'glowjelly',    name: 'Glowjelly',
    get item() { return ITEMS.RAW_GLOWJELLY; },
    minLevel: 45, xp: 90,  baseValue: 62,
    wMin: 0.05, wMax: 0.40, rarity: 'Rare',       rarityWeight: 10,
    color: '#80c8f0', biomes: ['underground'],
  },
  {
    id: 'crystal_fish', name: 'Crystal Fish',
    get item() { return ITEMS.RAW_CRYSTAL_FISH; },
    minLevel: 60, xp: 102, baseValue: 88,
    wMin: 0.20, wMax: 2.00, rarity: 'Very Rare',  rarityWeight: 3,
    color: '#c8e8ff', biomes: ['underground'],
  },
  {
    id: 'abyssal_eel',  name: 'Abyssal Eel',
    get item() { return ITEMS.RAW_ABYSSAL_EEL; },
    minLevel: 75, xp: 112, baseValue: 125,
    wMin: 1.00, wMax: 10.0, rarity: 'Legendary',  rarityWeight: 1,
    color: '#604880', biomes: ['underground'],
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
    [`raw_${sp.id}`,    sp.baseValue],
    [`cooked_${sp.id}`, Math.round(sp.baseValue * 2.5)],
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

/* ── Fisherman NPC (inside Kingdom Fishmonger building) ─ */
export class FishermanNPC {
  constructor() {
    this.w = 24;
    this.h = 32;
    // World coords: Fishmonger building: (479,211) w=10 h=7 → inner center col 484, first inner row 212
    this.x = (479 + 1 + Math.floor((10 - 2) / 2)) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (211 + 1) * TILE_SIZE;
    this.name = 'Fishmonger';
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
