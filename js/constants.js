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
  // ── Village props & surfaces ──────────────────────────
  PATH:          53,  // worn cobblestone path (walkable)
  PLASTER_WALL:  54,  // half-timber cottage wall (solid)
  THATCH_ROOF:   55,  // thatched cottage roof (walkable)
  FENCE:         56,  // wooden picket fence (solid)
  WELL:          57,  // stone village well (solid)
  BARREL:        58,  // wooden barrel prop (solid)
  SIGN:          59,  // wooden signpost (walkable)
  // Housing expansion furniture
  FURN_BED:      60,  // solid — bed frame
  FURN_BENCH:    61,  // solid — crafting bench
  // Farming patches (walkable, interactive — inside farming_plot cells)
  FARM_PATCH:         62,  // empty soil ready for planting
  FARM_PATCH_SEEDED:  63,  // seed just planted
  FARM_PATCH_GROWING: 64,  // crop sprouting
  FARM_PATCH_READY:   65,  // ready to harvest
  DUNGEON_ENTRANCE:   66,
  // Kingdom decorations
  CARPET:             67,  // royal red carpet — walkable
  THRONE:             68,  // throne seat — solid
  // Butcher shop interior
  WOOD_FLOOR:         69,  // warm wooden plank floor — walkable
  MEAT_HOOK:          70,  // wall-mounted meat hooks display — solid
  BUTCHER_BLOCK:      71,  // chopping block with cleaver — solid
  HEARTH:             72,  // stone fireplace — solid, decorative
  // Fishmonger shop interior
  WET_STONE:          73,  // wet cobblestone floor — walkable
  FISH_COUNTER:       74,  // wooden counter with fish display — solid
  FISH_TANK:          75,  // water trough with live fish — solid
  ICE_BOX:            76,  // crate of fish packed in ice — solid
  // Weapons shop interior
  STONE_TILE:         77,  // dark polished armory stone floor — walkable
  WEAPON_RACK:        78,  // wall rack with sword/axe/spear — solid
  ARMOR_STAND:        79,  // chainmail mannequin on T-stand — solid
  // Cape shop interior
  TEXTILE_FLOOR:      80,  // golden maple wood floor with fabric scraps — walkable
  CAPE_DISPLAY:       81,  // wall rod with hanging capes — solid
  TAILOR_TABLE:       82,  // cutting table with mat, scissors, fabric — solid
  // Variety shop interior
  DISPLAY_SHELF:      83,  // two-tier shelf with potions/tools/misc — solid
  // Kingdom courtyard decorations
  FOUNTAIN:           84,  // stone basin fountain — solid prop (use 5×5 block)
  PLANTER_FLOWERS:    85,  // elevated stone planter box with soil and flowers — solid prop
  PLANTER_BUSH:       86,  // elevated stone planter box with soil and a bush — solid prop
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
  // Village props (solid obstacles)
  TILES.PLASTER_WALL,
  TILES.FENCE,
  TILES.WELL,
  TILES.BARREL,
  // Housing furniture
  TILES.FURN_BED,
  TILES.FURN_BENCH,
  // Kingdom
  TILES.THRONE,
  // Butcher shop
  TILES.MEAT_HOOK,
  TILES.BUTCHER_BLOCK,
  TILES.HEARTH,
  // Fishmonger shop
  TILES.FISH_COUNTER,
  TILES.FISH_TANK,
  TILES.ICE_BOX,
  // Weapons shop
  TILES.WEAPON_RACK,
  TILES.ARMOR_STAND,
  // Cape shop
  TILES.CAPE_DISPLAY,
  TILES.TAILOR_TABLE,
  // Variety shop
  TILES.DISPLAY_SHELF,
  // Kingdom courtyard
  TILES.FOUNTAIN,
  TILES.PLANTER_FLOWERS,
  TILES.PLANTER_BUSH,
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
  // Village props
  [TILES.PATH]:         '#8a7a6a',
  [TILES.PLASTER_WALL]: '#c8bca8',
  [TILES.THATCH_ROOF]:  '#c09038',
  [TILES.FENCE]:        '#8b5e3c',
  [TILES.WELL]:         '#7a6a5a',
  [TILES.BARREL]:       '#6b3a1a',
  [TILES.SIGN]:         '#8b6914',
  [TILES.FURN_BED]:     '#7a3a22',
  [TILES.FURN_BENCH]:   '#5a4018',
  // Farming patches
  [TILES.FARM_PATCH]:         '#6b4e2a',
  [TILES.FARM_PATCH_SEEDED]:  '#7a5a30',
  [TILES.FARM_PATCH_GROWING]: '#5a6a2a',
  [TILES.FARM_PATCH_READY]:   '#3a7a22',
  [TILES.DUNGEON_ENTRANCE]: '#1a1218',
  [TILES.CARPET]: '#6b0000',
  [TILES.THRONE]: '#2a1500',
  // Butcher shop interior
  [TILES.WOOD_FLOOR]:     '#b87030',
  [TILES.MEAT_HOOK]:      '#2e1008',
  [TILES.BUTCHER_BLOCK]:  '#6a3e18',
  [TILES.HEARTH]:         '#4a3c38',
  // Fishmonger shop interior
  [TILES.WET_STONE]:      '#3a5060',
  [TILES.FISH_COUNTER]:   '#807868',
  [TILES.FISH_TANK]:      '#143060',
  [TILES.ICE_BOX]:        '#b0d0e0',
  // Weapons shop interior
  [TILES.STONE_TILE]:     '#22202c',
  [TILES.WEAPON_RACK]:    '#1c1820',
  [TILES.ARMOR_STAND]:    '#28243a',
  // Cape shop interior
  [TILES.TEXTILE_FLOOR]:  '#c89010',
  [TILES.CAPE_DISPLAY]:   '#1c1820',
  [TILES.TAILOR_TABLE]:   '#2c6038',
  // Variety shop interior
  [TILES.DISPLAY_SHELF]:  '#3a2010',
  // Kingdom courtyard
  [TILES.FOUNTAIN]:         '#506070',
  [TILES.PLANTER_FLOWERS]:  '#787060',
  [TILES.PLANTER_BUSH]:     '#787060',
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
  TILES.FURN_BED, TILES.FURN_BENCH,
  TILES.FURNACE, TILES.ANVIL,
  TILES.ROCK_TIN, TILES.ROCK_SILVER, TILES.ROCK_TUNGSTEN,
  TILES.ROCK_OBSIDIAN, TILES.ROCK_MOONSTONE,
  // Village props
  TILES.PATH, TILES.PLASTER_WALL, TILES.THATCH_ROOF,
  TILES.FENCE, TILES.WELL, TILES.BARREL, TILES.SIGN,
  // Farming patches
  TILES.FARM_PATCH, TILES.FARM_PATCH_SEEDED,
  TILES.FARM_PATCH_GROWING, TILES.FARM_PATCH_READY,
  TILES.DUNGEON_ENTRANCE,
  TILES.CARPET, TILES.THRONE,
  // Butcher shop
  TILES.WOOD_FLOOR, TILES.MEAT_HOOK, TILES.BUTCHER_BLOCK, TILES.HEARTH,
  // Fishmonger shop
  TILES.WET_STONE, TILES.FISH_COUNTER, TILES.FISH_TANK, TILES.ICE_BOX,
  // Weapons shop
  TILES.STONE_TILE, TILES.WEAPON_RACK, TILES.ARMOR_STAND,
  // Cape shop
  TILES.TEXTILE_FLOOR, TILES.CAPE_DISPLAY, TILES.TAILOR_TABLE,
  // Variety shop
  TILES.DISPLAY_SHELF,
  // Kingdom courtyard
  TILES.FOUNTAIN,
  TILES.PLANTER_FLOWERS,
  TILES.PLANTER_BUSH,
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
  FARMING:     12,
};
export const SKILL_NAMES  = ['Woodcutting', 'Firemaking', 'Fishing', 'Cooking', 'Attack', 'Strength', 'Defence', 'Hitpoints', 'Mining', 'Architect', 'Forgery', 'Raiding', 'Farming'];

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
    { level:  1, text: 'Gudgeon (Common) — Plains & Forest',              icon: 'raw_gudgeon' },
    { level:  1, text: 'Shrimp (Common) — Plains',                        icon: 'raw_shrimp' },
    { level:  5, text: 'Sardine (Common) — Plains & Forest',              icon: 'raw_sardine' },
    { level:  5, text: 'Carp (Common) — Plains, Forest & Swamp',          icon: 'raw_carp' },
    { level:  5, text: 'Sandy Goby (Common) — Desert',                    icon: 'raw_sandy_goby' },
    { level: 10, text: 'Herring (Common) — Plains & Forest',              icon: 'raw_herring' },
    { level: 10, text: 'Mudskipper (Common) — Swamp',                     icon: 'raw_mudskipper' },
    { level: 12, text: 'Perch (Common) — Plains & Forest',                icon: 'raw_perch' },
    { level: 15, text: 'Ice Fish (Common) — Tundra',                      icon: 'raw_ice_fish' },
    { level: 20, text: 'Trout (Uncommon) — Plains & Forest',              icon: 'raw_trout' },
    { level: 20, text: 'Swamp Eel (Uncommon) — Swamp',                    icon: 'raw_swamp_eel' },
    { level: 20, text: 'Cave Fish (Common) — Underground',                icon: 'raw_cave_fish' },
    { level: 20, text: 'Pufferfish (Uncommon) — Desert',                  icon: 'raw_pufferfish' },
    { level: 25, text: 'Bass (Uncommon) — Forest & Plains',               icon: 'raw_bass' },
    { level: 25, text: 'Arctic Char (Uncommon) — Tundra',                 icon: 'raw_arctic_char' },
    { level: 25, text: 'Lava Eel (Uncommon) — Volcanic',                  icon: 'raw_lava_eel' },
    { level: 28, text: 'Walleye (Uncommon) — Plains',                     icon: 'raw_walleye' },
    { level: 30, text: 'Salmon (Uncommon) — Forest & Plains',             icon: 'raw_salmon' },
    { level: 30, text: 'Blind Crayfish (Uncommon) — Underground',         icon: 'raw_blind_crayfish' },
    { level: 35, text: 'Pike (Uncommon) — Forest & Plains',               icon: 'raw_pike' },
    { level: 35, text: 'Slimejack (Rare) — Swamp',                        icon: 'raw_slimejack' },
    { level: 40, text: 'Tuna (Rare) — Plains & Forest',                   icon: 'raw_tuna' },
    { level: 40, text: 'Snowflake Eel (Rare) — Tundra',                   icon: 'raw_snowflake_eel' },
    { level: 40, text: 'Sandfish (Rare) — Desert',                        icon: 'raw_sandfish' },
    { level: 45, text: 'Magma Carp (Rare) — Volcanic',                    icon: 'raw_magma_carp' },
    { level: 45, text: 'Glowjelly (Rare) — Underground',                  icon: 'raw_glowjelly' },
    { level: 50, text: 'Lobster (Rare) — Danger & Plains',                icon: 'raw_lobster' },
    { level: 50, text: 'Barracuda (Rare) — Forest & Danger',              icon: 'raw_barracuda' },
    { level: 55, text: 'Mutant Carp (Very Rare) — Swamp',                 icon: 'raw_mutant_carp' },
    { level: 60, text: 'Swordfish (Very Rare) — Plains & Forest',         icon: 'raw_swordfish' },
    { level: 60, text: 'Crystal Fish (Very Rare) — Underground',          icon: 'raw_crystal_fish' },
    { level: 65, text: 'Glacierfish (Legendary) — Tundra',                icon: 'raw_glacierfish' },
    { level: 65, text: 'Dragon Goby (Very Rare) — Volcanic',              icon: 'raw_dragon_goby' },
    { level: 65, text: 'Giant Squid (Very Rare) — Danger & Plains',       icon: 'raw_giant_squid' },
    { level: 75, text: 'Abyssal Eel (Legendary) — Underground',           icon: 'raw_abyssal_eel' },
    { level: 76, text: 'Shark (Legendary) — Plains & Danger',             icon: 'raw_shark' },
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
  // 12 — Farming
  [
    { level:  1, text: 'Plant Potato Seeds → Potatoes (20 XP/harvest)',   icon: 'potato_seed' },
    { level:  5, text: 'Plant Berry Seeds → Berries (30 XP/harvest)',     icon: 'berry_seed' },
    { level: 10, text: 'Plant Herb Seeds → Grimy Herbs (50 XP/harvest)',  icon: 'herb_seed' },
    { level: 15, text: 'Plant Flax Seeds → Flax (40 XP/harvest)',         icon: 'flax_seed' },
    { level: 25, text: 'Plant Magic Seeds → Magic Herbs (100 XP/harvest)',icon: 'magic_seed' },
    { level: 99, text: 'Master Farmer — all crops available',             icon: null },
  ],
];
export const SKILL_COLORS = ['#27ae60', '#e67e22', '#3498db', '#e74c3c', '#c0392b', '#8e44ad', '#2980b9', '#ec407a', '#95a5a6', '#d4a017', '#b7410e', '#a855f7', '#56a832'];

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
