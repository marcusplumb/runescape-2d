// ── Tile & World ──────────────────────────────────────────
export const TILE_SIZE = 32;
export const WORLD_COLS = 1024;
export const WORLD_ROWS = 768;
export const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;

// ── Player ───────────────────────────────────────────────
export const PLAYER_SPEED = 120;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 32;

// ── Camera ───────────────────────────────────────────────
export const CAMERA_LERP = 25; // exponential smoothing speed (higher = tighter follow)

// ── Minimap ──────────────────────────────────────────────
export const MINIMAP_SCALE = 0.25;
export const MINIMAP_PADDING = 12;

// ── Tile types ───────────────────────────────────────────
export const TILES = {
  GRASS:              0,
  DIRT:               1,
  WATER:              2,
  SAND:               3,
  STONE:              4,
  TREE:               5,
  WALL:               6,
  BRIDGE:             7,
  FLOWERS:            8,
  DARK_GRASS:         9,
  STUMP:              10,
  FISH_SPOT:          11,
  FIRE:               12,
  // Biome tiles
  SNOW:               13,
  ICE:                14,
  SWAMP_WATER:        15,
  VOLCANIC_ROCK:      16,
  LAVA:               17,
  DEAD_GRASS:         18,
  CACTUS:             19,
  SAND_DARK:          20,
  // Ore rocks (solid when intact, depleted = walkable)
  ROCK_COPPER:        21,
  ROCK_IRON:          22,
  ROCK_COAL:          23,
  ROCK_GOLD:          24,
  ROCK_MITHRIL:       25,
  ROCK_DEPLETED:      26,
  // Biome fishing spots
  FISH_SPOT_SALMON:   27,
  FISH_SPOT_LOBSTER:  28,
  DOOR:   29,   // building entrance — walkable, triggers interior transition
  STAIRS: 30,   // interior exit — walkable, triggers return to world
  ROOF:   31,   // building roof — visible from world map, non-solid
  PORTAL: 32,   // player house portal — walkable, triggers house entry
  PLANK:  33,   // wooden floor inside player house — walkable
  // Placeable furniture (player house only)
  FURN_CHAIR:     34,  // walkable
  FURN_RUG:       35,  // walkable
  FURN_TABLE:     36,  // solid
  FURN_CHEST:     37,  // solid
  FURN_BOOKSHELF: 38,  // solid
  FURN_PLANT:     39,  // solid
  // Forge structures
  FURNACE:        40,  // solid, interactive — smelting
  ANVIL:          41,  // solid, interactive — smithing
  // New ore rocks
  ROCK_TIN:       42,
  ROCK_SILVER:    43,
  ROCK_TUNGSTEN:  44,
  ROCK_OBSIDIAN:  45,
  ROCK_MOONSTONE: 46,
};

// Which tiles block movement
export const SOLID_TILES = new Set([
  TILES.WATER,
  TILES.TREE,
  TILES.WALL,
  TILES.FISH_SPOT,
  TILES.ICE,
  TILES.SWAMP_WATER,
  TILES.LAVA,
  TILES.ROCK_COPPER,
  TILES.ROCK_IRON,
  TILES.ROCK_COAL,
  TILES.ROCK_GOLD,
  TILES.ROCK_MITHRIL,
  TILES.CACTUS,
  TILES.FISH_SPOT_SALMON,
  TILES.FISH_SPOT_LOBSTER,
  // Solid furniture
  TILES.FURN_TABLE,
  TILES.FURN_CHEST,
  TILES.FURN_BOOKSHELF,
  TILES.FURN_PLANT,
  // Forge
  TILES.FURNACE,
  TILES.ANVIL,
  // New ore rocks
  TILES.ROCK_TIN,
  TILES.ROCK_SILVER,
  TILES.ROCK_TUNGSTEN,
  TILES.ROCK_OBSIDIAN,
  TILES.ROCK_MOONSTONE,
]);

// ── Tile colours ─────────────────────────────────────────
export const TILE_COLORS = {
  [TILES.GRASS]:            '#4a8c3f',
  [TILES.DIRT]:             '#8b7355',
  [TILES.WATER]:            '#3272a8',
  [TILES.SAND]:             '#d4c078',
  [TILES.STONE]:            '#7a7a7a',
  [TILES.TREE]:             '#4a8c3f',  // grass beneath — tree drawn in entity layer
  [TILES.WALL]:             '#5c5c5c',
  [TILES.BRIDGE]:           '#8b6914',
  [TILES.FLOWERS]:          '#5a9c4f',
  [TILES.DARK_GRASS]:       '#3d7a34',
  [TILES.STUMP]:            '#4a8c3f',
  [TILES.FISH_SPOT]:        '#2868a0',
  [TILES.FIRE]:             '#4a8c3f',
  [TILES.SNOW]:             '#dce8f0',
  [TILES.ICE]:              '#a8d4e8',
  [TILES.SWAMP_WATER]:      '#3a5a3a',
  [TILES.VOLCANIC_ROCK]:    '#3a2a2a',
  [TILES.LAVA]:             '#c83c00',
  [TILES.DEAD_GRASS]:       '#8a7a50',
  [TILES.CACTUS]:           '#3d7a34',
  [TILES.SAND_DARK]:        '#b8a060',
  [TILES.ROCK_COPPER]:      '#7a7a7a',
  [TILES.ROCK_IRON]:        '#6a6a70',
  [TILES.ROCK_COAL]:        '#4a4a4a',
  [TILES.ROCK_GOLD]:        '#7a7050',
  [TILES.ROCK_MITHRIL]:     '#5a5a8a',
  [TILES.ROCK_DEPLETED]:    '#6a6a6a',
  [TILES.FISH_SPOT_SALMON]: '#2868a0',
  [TILES.FISH_SPOT_LOBSTER]:'#2060a0',
  [TILES.DOOR]:   '#7a4a2a',
  [TILES.STAIRS]: '#6a6aaa',
  [TILES.ROOF]:   '#4a2010',
  [TILES.PORTAL]: '#5a3aaa',
  [TILES.PLANK]:  '#8b6030',
  [TILES.FURN_CHAIR]:     '#8b5e3c',
  [TILES.FURN_RUG]:       '#9b2222',
  [TILES.FURN_TABLE]:     '#7a5030',
  [TILES.FURN_CHEST]:     '#8b6914',
  [TILES.FURN_BOOKSHELF]: '#5a3a1a',
  [TILES.FURN_PLANT]:     '#2e7d32',
  [TILES.FURNACE]:        '#3a2020',
  [TILES.ANVIL]:          '#3a3a3a',
  [TILES.ROCK_TIN]:       '#8a8a7a',
  [TILES.ROCK_SILVER]:    '#b0b0b8',
  [TILES.ROCK_TUNGSTEN]:  '#4a4a5a',
  [TILES.ROCK_OBSIDIAN]:  '#2a1a2a',
  [TILES.ROCK_MOONSTONE]: '#3a3a5a',
};

// ── Tile detail overlays ─────────────────────────────────
export const TILE_HAS_DETAIL = new Set([
  // Base terrain (now all textured)
  TILES.GRASS, TILES.DIRT, TILES.SAND, TILES.STONE, TILES.WALL,
  TILES.DARK_GRASS, TILES.DEAD_GRASS, TILES.SAND_DARK, TILES.ICE,
  // Existing detailed tiles (TREE excluded — drawn in entity layer for depth sorting)
  TILES.FLOWERS, TILES.WATER, TILES.BRIDGE,
  TILES.STUMP, TILES.FISH_SPOT, TILES.FIRE,
  TILES.SNOW, TILES.LAVA, TILES.SWAMP_WATER, TILES.VOLCANIC_ROCK,
  TILES.ROCK_COPPER, TILES.ROCK_IRON, TILES.ROCK_COAL,
  TILES.ROCK_GOLD, TILES.ROCK_MITHRIL, TILES.ROCK_DEPLETED,
  TILES.CACTUS,
  TILES.FISH_SPOT_SALMON, TILES.FISH_SPOT_LOBSTER,
  TILES.DOOR, TILES.STAIRS, TILES.ROOF,
  TILES.PORTAL, TILES.PLANK,
  TILES.FURN_CHAIR, TILES.FURN_RUG, TILES.FURN_TABLE,
  TILES.FURN_CHEST, TILES.FURN_BOOKSHELF, TILES.FURN_PLANT,
  TILES.FURNACE, TILES.ANVIL,
  TILES.ROCK_TIN, TILES.ROCK_SILVER, TILES.ROCK_TUNGSTEN,
  TILES.ROCK_OBSIDIAN, TILES.ROCK_MOONSTONE,
]);

// ── Inventory ────────────────────────────────────────────
export const INV_COLS = 4;
export const INV_ROWS = 7;
export const INV_SLOTS = INV_COLS * INV_ROWS;
export const INV_CELL = 40;
export const INV_PAD = 6;

// ── Skills ───────────────────────────────────────────────
export const SKILL_IDS = {
  WOODCUTTING: 0,
  FIREMAKING:  1,
  FISHING:     2,
  COOKING:     3,
  ATTACK:      4,
  STRENGTH:    5,
  DEFENCE:     6,
  HITPOINTS:   7,
  MINING:      8,
  ARCHITECT:   9,
  FORGERY:     10,
};
export const SKILL_NAMES  = ['Woodcutting', 'Firemaking', 'Fishing', 'Cooking', 'Attack', 'Strength', 'Defence', 'Hitpoints', 'Mining', 'Architect', 'Forgery'];
export const SKILL_COLORS = ['#27ae60', '#e67e22', '#3498db', '#e74c3c', '#c0392b', '#8e44ad', '#2980b9', '#ec407a', '#95a5a6', '#d4a017', '#b7410e'];

// XP table — Runescape-inspired curve
export const XP_TABLE = (() => {
  const table = [0];
  for (let lvl = 2; lvl <= 99; lvl++) {
    let total = 0;
    for (let i = 1; i < lvl; i++) {
      total += Math.floor(i + 300 * Math.pow(2, i / 7));
    }
    table.push(Math.floor(total / 4));
  }
  return table;
})();

// ── Action timings (seconds) ─────────────────────────────
export const ACTION_TIMES = {
  CHOP:  2.5,
  FISH:  3.5,
  COOK:  2.0,
  LIGHT: 1.5,
  MINE:  3.0,
};

// ── XP rewards ───────────────────────────────────────────
export const XP_REWARDS = {
  CHOP:          25,
  FISH:          30,
  COOK:          40,
  LIGHT:         20,
  MINE_COPPER:   17,
  MINE_IRON:     35,
  MINE_COAL:     50,
  MINE_GOLD:     65,
  MINE_MITHRIL:  80,
  MINE_TIN:      14,
  MINE_SILVER:   45,
  MINE_TUNGSTEN: 90,
  MINE_OBSIDIAN: 110,
  MINE_MOONSTONE:150,
};

// ── Fire ─────────────────────────────────────────────────
export const FIRE_LIFETIME = 45; // seconds before fire burns out

// ── Mining ───────────────────────────────────────────────
export const ROCK_RESPAWN_TIME = 60; // seconds before ore rock refills

// ── Combat ───────────────────────────────────────────────
export const COMBAT_TICK     = 2.4;  // seconds between auto-attacks
export const AGGRO_RANGE     = 8;    // tiles — dangerous mobs chase the player within this range
export const MOB_RESPAWN_TIME = 45;  // seconds before a dead mob respawns
