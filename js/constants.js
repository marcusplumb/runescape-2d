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
  // Rare tree varieties (level-gated woodcutting)
  OAK_TREE:    47,
  WILLOW_TREE: 48,
  MAPLE_TREE:  49,
  YEW_TREE:    50,
  MAGIC_TREE:  51,
  ELDER_TREE:  52,
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
  // Rare trees
  TILES.OAK_TREE,
  TILES.WILLOW_TREE,
  TILES.MAPLE_TREE,
  TILES.YEW_TREE,
  TILES.MAGIC_TREE,
  TILES.ELDER_TREE,
]);

/** All tile IDs that are choppable trees (used for depth-sort and action detection). */
export const TREE_TILES = new Set([
  TILES.TREE, TILES.OAK_TREE, TILES.WILLOW_TREE,
  TILES.MAPLE_TREE, TILES.YEW_TREE, TILES.MAGIC_TREE, TILES.ELDER_TREE,
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
  // Rare trees (ground color beneath — sprite drawn in entity layer)
  [TILES.OAK_TREE]:    '#3d7a34',
  [TILES.WILLOW_TREE]: '#3a7050',
  [TILES.MAPLE_TREE]:  '#4a7030',
  [TILES.YEW_TREE]:    '#1e3a18',
  [TILES.MAGIC_TREE]:  '#1a1640',
  [TILES.ELDER_TREE]:  '#4a5a40',
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
  RAIDING:     11,
};
export const SKILL_NAMES  = ['Woodcutting', 'Firemaking', 'Fishing', 'Cooking', 'Attack', 'Strength', 'Defence', 'Hitpoints', 'Mining', 'Architect', 'Forgery', 'Raiding'];

// ── Skill unlock tables ───────────────────────────────────
// Indexed by SKILL_IDS. Each entry: { level, text, icon? }
// icon: item id string → draw that item sprite; null → draw the skill icon
export const SKILL_UNLOCKS = [
  // 0 — Woodcutting
  [
    { level:  1, text: 'Chop Trees → Logs (25 XP)',                       icon: 'axe' },
    { level: 10, text: 'Iron Axe — 20% faster chops',                     icon: 'iron_axe' },
    { level: 15, text: 'Oak Trees → Oak Logs (38 XP)',                    icon: 'oak_logs' },
    { level: 20, text: 'Steel Axe — 40% faster chops',                    icon: 'steel_axe' },
    { level: 30, text: 'Willow Trees → Willow Logs (68 XP)',              icon: 'willow_logs' },
    { level: 40, text: 'Experienced logger — +1 max log per tree',        icon: 'logs' },
    { level: 45, text: 'Maple Trees → Maple Logs (100 XP)',               icon: 'maple_logs' },
    { level: 60, text: 'Yew Trees → Yew Logs (175 XP)',                   icon: 'yew_logs' },
    { level: 75, text: 'Magic Trees → Magic Logs (250 XP)',               icon: 'magic_logs' },
    { level: 90, text: 'Elder Trees → Elder Logs (400 XP)',               icon: 'elder_logs' },
    { level: 99, text: 'Master Woodcutter — fastest possible speed',       icon: null },
  ],
  // 1 — Firemaking
  [
    { level:  1, text: 'Logs — 40 XP  •  60s fire',          sub: 'Lets you cook raw fish nearby',            icon: 'logs' },
    { level: 15, text: 'Oak Logs — 60 XP  •  120s fire',     sub: 'Nearby perk: cook 2× faster',             icon: 'oak_logs' },
    { level: 30, text: 'Willow Logs — 90 XP  •  200s fire',  sub: 'Nearby perk: fish 40% faster',            icon: 'willow_logs' },
    { level: 45, text: 'Maple Logs — 135 XP  •  360s fire',  sub: 'Nearby perk: food never burns',           icon: 'maple_logs' },
    { level: 60, text: 'Yew Logs — 200 XP  •  480s fire',    sub: 'Nearby perk: 15% less damage taken',      icon: 'yew_logs' },
    { level: 75, text: 'Magic Logs — 303 XP  •  600s fire',  sub: 'Nearby perk: +1 HP every 8 seconds',      icon: 'magic_logs' },
    { level: 90, text: 'Elder Logs — 404 XP  •  900s fire',  sub: 'Nearby perk: +10% XP from all skills',    icon: 'elder_logs' },
    { level: 99, text: 'Master Firestarter',                  sub: 'Fires light instantly',                   icon: null },
  ],
  // 2 — Fishing
  [
    { level:  1, text: 'Shrimp (Common) — any Fishing Spot, 10 XP',      icon: 'raw_shrimp' },
    { level:  5, text: 'Sardine (Common) — Fishing & Salmon Spots',       icon: 'raw_sardine' },
    { level: 10, text: 'Herring (Common) — Fishing & Salmon Spots',       icon: 'raw_herring' },
    { level: 20, text: 'Trout (Uncommon) — Fishing & Salmon Spots',       icon: 'raw_trout' },
    { level: 30, text: 'Salmon (Uncommon) — Salmon Spots only',           icon: 'raw_salmon' },
    { level: 40, text: 'Tuna (Rare) — Lobster Spots only',                icon: 'raw_tuna' },
    { level: 50, text: 'Lobster (Rare) — Lobster Spots only',             icon: 'raw_lobster' },
    { level: 60, text: 'Swordfish (Very Rare) — Lobster Spots only',      icon: 'raw_swordfish' },
    { level: 76, text: 'Shark (Legendary) — Lobster Spots only',          icon: 'raw_shark' },
    { level: 99, text: 'Master Fisher — fastest catch speed',             icon: null },
  ],
  // 3 — Cooking
  [
    { level:  1, text: 'Cook any raw fish on a Campfire',                 icon: 'cooked_shrimp' },
    { level:  5, text: 'Shark: reaches minimum burn chance (5%)',         icon: 'cooked_shark' },
    { level:  8, text: 'Swordfish: reaches minimum burn chance',          icon: 'cooked_swordfish' },
    { level: 13, text: 'Shrimp: reaches minimum burn chance',             icon: 'cooked_shrimp' },
    { level: 15, text: 'Herring: reaches minimum burn chance',            icon: 'cooked_herring' },
    { level: 17, text: 'Sardine: reaches minimum burn chance',            icon: 'cooked_sardine' },
    { level: 18, text: 'Trout: reaches minimum burn chance',              icon: 'cooked_trout' },
    { level: 20, text: 'Salmon: reaches minimum burn chance',             icon: 'cooked_salmon' },
    { level: 23, text: 'Lobster: reaches minimum burn chance',            icon: 'cooked_lobster' },
    { level: 50, text: 'Seasoned chef — overall burn rate reduced',       icon: null },
    { level: 99, text: 'Master Chef — 5% burn floor on all dishes',       icon: null },
  ],
  // 4 — Attack
  [
    { level:  1, text: 'Bronze Sword (accuracy 5, power 4)',              icon: 'bronze_sword' },
    { level: 10, text: 'Iron Sword (accuracy 12, power 10)',              icon: 'iron_sword' },
    { level: 20, text: 'Steel Sword (accuracy 22, power 20)',             icon: 'steel_sword' },
    { level: 30, text: 'Shadow Treads boots (+accuracy, +speed)',         icon: null },
    { level: 35, text: 'Mithril Sword (accuracy 36, power 32)',           icon: 'mithril_sword' },
    { level: 35, text: 'Shadow Tunic chestplate (+crit)',                 icon: null },
    { level: 40, text: 'Venom Blade (accuracy 50, 10% crit)',             icon: null },
    { level: 45, text: 'Shadow Dagger (accuracy 60, 20% crit, fast)',     icon: null },
    { level: 50, text: 'Tungsten Blade (accuracy 52, power 48)',          icon: 'tungsten_blade' },
    { level: 55, text: 'Obsidian Cleaver (power 75, 8% crit)',            icon: 'obsidian_cleaver' },
    { level: 70, text: 'Moonstone Staff (accuracy 80, power 50)',         icon: 'moonstone_staff' },
    { level: 99, text: 'Max Attack — unmatched hit accuracy',             icon: null },
  ],
  // 5 — Strength
  [
    { level:  1, text: 'Unarmed attacks deal minimal damage',             icon: null },
    { level: 40, text: "Berserker Mask (+power, +crit bonus)",            icon: null },
    { level: 40, text: "Berserker's Wraps gloves (+power, +crit)",        icon: null },
    { level: 45, text: 'Venom Blade (Strength secondary req.)',           icon: null },
    { level: 50, text: "Berserker's Axe (power 85, 14% crit)",           icon: null },
    { level: 99, text: 'Max Strength — maximum damage output',            icon: null },
  ],
  // 6 — Defence
  [
    { level:  1, text: 'Leather Cap, Body, Legs, Gloves, Boots',          icon: null },
    { level:  1, text: 'Bronze Plate, Helm, Gauntlets, Boots, Legs',      icon: 'bronze_plate' },
    { level: 10, text: 'Iron Plate, Helm, Gauntlets, Boots, Legs',        icon: 'iron_plate' },
    { level: 20, text: 'Steel Plate, Helm, Gauntlets, Boots, Legs',       icon: 'steel_plate' },
    { level: 35, text: 'Mithril Plate, Helm, Legs (armour 50/26/32)',     icon: 'mithril_plate' },
    { level: 50, text: 'Tungsten Plate & Helm (armour 80 & 40)',          icon: 'tungsten_plate' },
    { level: 99, text: 'Max Defence — highest damage reduction',           icon: null },
  ],
  // 7 — Hitpoints
  [
    { level:  1, text: 'Base HP = 10; XP gained passively from combat',  icon: null },
    { level: 10, text: 'Veteran fighter — increased combat survivability', icon: null },
    { level: 30, text: 'Hardened warrior — noticeable HP pool growth',   icon: null },
    { level: 50, text: 'Battle-scarred — significantly more HP',          icon: null },
    { level: 70, text: 'Iron constitution — rarely falls in one fight',   icon: null },
    { level: 99, text: 'Max Hitpoints — near-unkillable HP pool',         icon: null },
  ],
  // 8 — Mining
  [
    { level:  1, text: 'Copper Ore (17 XP)',                              icon: 'ore_copper' },
    { level:  1, text: 'Tin Ore (14 XP)',                                 icon: 'ore_tin' },
    { level: 10, text: 'Iron Pickaxe — mines faster (Forgery 10)',        icon: 'iron_pickaxe' },
    { level: 15, text: 'Iron Ore (35 XP)',                                icon: 'ore_iron' },
    { level: 20, text: 'Silver Ore (45 XP)',                              icon: 'ore_silver' },
    { level: 20, text: 'Steel Pickaxe — mines faster (Forgery 20)',       icon: 'steel_pickaxe' },
    { level: 30, text: 'Coal (50 XP)',                                    icon: 'ore_coal' },
    { level: 40, text: 'Gold Ore (65 XP)',                                icon: 'ore_gold' },
    { level: 45, text: 'Tungsten Ore (needs Steel Pickaxe, 90 XP)',       icon: 'ore_tungsten' },
    { level: 50, text: 'Tungsten Pickaxe (craft at Forgery 50)',          icon: 'tungsten_pickaxe' },
    { level: 55, text: 'Mithril Ore (80 XP)',                             icon: 'ore_mithril' },
    { level: 70, text: 'Obsidian Ore (needs Tungsten Pickaxe, 110 XP)',   icon: 'ore_obsidian' },
    { level: 85, text: 'Moonstone (needs Tungsten Pickaxe, 150 XP)',      icon: 'ore_moonstone' },
    { level: 99, text: 'Master Miner — fastest ore extraction',           icon: null },
  ],
  // 9 — Architect
  [
    { level:  1, text: 'Place furniture in your Player House',            icon: null },
    { level:  1, text: 'Chair, Rug, Table, Chest, Bookshelf, Plant',     icon: null },
    { level: 10, text: 'Unlock additional furniture designs',             icon: null },
    { level: 25, text: 'Expanded house layout options',                   icon: null },
    { level: 50, text: 'Master Builder — premium furniture sets',         icon: null },
    { level: 99, text: 'Grand Architect — full house customisation',      icon: null },
  ],
  // 10 — Forgery
  [
    { level:  1, text: 'Smelt Bronze Bar (Copper + Tin, 25 XP)',          icon: 'bar_bronze' },
    { level:  1, text: 'Smith Bronze Sword, Legs, Gauntlets, Boots',      icon: 'bronze_sword' },
    { level:  3, text: 'Smith Bronze Helm',                               icon: 'bronze_helm' },
    { level:  5, text: 'Smith Bronze Plate',                              icon: 'bronze_plate' },
    { level: 10, text: 'Smelt Iron Bar (40 XP)',                          icon: 'bar_iron' },
    { level: 10, text: 'Smith Iron Sword, Axe, Pickaxe, Gauntlets…',     icon: 'iron_sword' },
    { level: 12, text: 'Smith Iron Helm',                                 icon: 'iron_helm' },
    { level: 14, text: 'Smith Iron Plate',                                icon: 'iron_plate' },
    { level: 20, text: 'Smelt Steel Bar (55 XP)',                         icon: 'bar_steel' },
    { level: 20, text: 'Smith Steel Sword, Axe, Pickaxe, Gauntlets…',    icon: 'steel_sword' },
    { level: 22, text: 'Smith Steel Helm',                                icon: 'steel_helm' },
    { level: 24, text: 'Smith Steel Plate',                               icon: 'steel_plate' },
    { level: 25, text: 'Smelt Silver Bar (50 XP)',                        icon: 'bar_silver' },
    { level: 30, text: 'Smelt Gold Bar (65 XP)',                          icon: 'bar_gold' },
    { level: 40, text: 'Smelt Mithril Bar; Smith Mithril Sword & Armour', icon: 'bar_mithril' },
    { level: 50, text: 'Smelt Tungsten Bar; Smith Tungsten Blade & Pick', icon: 'bar_tungsten' },
    { level: 52, text: 'Smith Tungsten Helm',                             icon: 'tungsten_helm' },
    { level: 54, text: 'Smith Tungsten Plate',                            icon: 'tungsten_plate' },
    { level: 65, text: 'Smelt Obsidian Ingot; Smith Obsidian Cleaver',    icon: 'bar_obsidian' },
    { level: 80, text: 'Smelt Moonstone Ingot; Smith Moonstone Staff',    icon: 'bar_moonstone' },
    { level: 99, text: 'Grand Forgemaster — all recipes available',       icon: null },
  ],
  // 11 — Raiding
  [
    { level:  1, text: 'Goblin Cave — Novice difficulty unlocked',        icon: null },
    { level:  5, text: 'Adept difficulty unlocked',                       icon: null },
    { level: 20, text: 'Veteran difficulty + Dungeon Depths unlocked',    icon: null },
    { level: 45, text: 'Elite difficulty + Abyssal Sanctum unlocked',     icon: null },
    { level: 70, text: 'Master difficulty unlocked',                      icon: null },
    { level: 99, text: 'Grand Raider — maximum raid mastery',             icon: null },
  ],
];
export const SKILL_COLORS = ['#27ae60', '#e67e22', '#3498db', '#e74c3c', '#c0392b', '#8e44ad', '#2980b9', '#ec407a', '#95a5a6', '#d4a017', '#b7410e', '#a855f7'];

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
  CHOP_OAK:      38,
  CHOP_WILLOW:   68,
  CHOP_MAPLE:    100,
  CHOP_YEW:      175,
  CHOP_MAGIC:    250,
  CHOP_ELDER:    400,
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
