import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, TILES, AGGRO_RANGE, MOB_RESPAWN_TIME } from './constants.js';
import { BIOMES, getBiome } from './biomes.js';
import { ITEMS } from './items.js';

// Seeded PRNG (mulberry32) — same algorithm as world.js so mob spawn positions
// are deterministic across page refreshes as long as the world seed is unchanged.
const MOB_SEED = 137;
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOB_DEFS = {
  // ── Passive mobs (spawn in safe areas) ──────────────────
  chicken: {
    name: 'Chicken', hp: 3, speed: 52, w: 14, h: 16,
    aggressive: false, attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
    xpHp: 1.5, drops: [
      { item: ITEMS.BONES,       chance: 1.0, qty: 1 },
      { item: ITEMS.POTATO_SEED, chance: 0.08, qty: 1 },
      { item: ITEMS.BERRY_SEED,  chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.PLAINS, BIOMES.FOREST],
  },
  cow: {
    name: 'Cow', hp: 10, speed: 34, w: 26, h: 22,
    aggressive: false, attackLevel: 1, strengthLevel: 2, defenceLevel: 1,
    xpHp: 2, drops: [
      { item: ITEMS.BONES,       chance: 1.0, qty: 1 },
      { item: ITEMS.POTATO_SEED, chance: 0.08, qty: 1 },
      { item: ITEMS.BERRY_SEED,  chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.PLAINS],
  },
  sheep: {
    name: 'Sheep', hp: 8, speed: 44, w: 20, h: 18,
    aggressive: false, attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
    xpHp: 1.5, drops: [
      { item: ITEMS.BONES,       chance: 1.0, qty: 1 },
      { item: ITEMS.POTATO_SEED, chance: 0.07, qty: 1 },
      { item: ITEMS.FLAX_SEED,   chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.PLAINS, BIOMES.TUNDRA],
  },

  // ── Danger zone mobs (aggressive, drop more) ────────────
  goblin: {
    name: 'Goblin', hp: 12, speed: 68, w: 16, h: 20,
    aggressive: true, attackLevel: 8, strengthLevel: 6, defenceLevel: 4,
    xpHp: 5, drops: [
      { item: ITEMS.BONES,      chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN,  chance: 0.5, qty: 3 },
      { item: ITEMS.HERB_SEED,  chance: 0.06, qty: 1 },
    ],
    biomes: [BIOMES.DANGER],
  },
  orc: {
    name: 'Orc', hp: 30, speed: 55, w: 22, h: 28,
    aggressive: true, attackLevel: 16, strengthLevel: 18, defenceLevel: 12,
    xpHp: 10, drops: [
      { item: ITEMS.BONES,      chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN,  chance: 0.7, qty: 8 },
      { item: ITEMS.ORE_IRON,   chance: 0.3, qty: 1 },
      { item: ITEMS.HERB_SEED,  chance: 0.07, qty: 1 },
      { item: ITEMS.FLAX_SEED,  chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.DANGER],
  },
  troll: {
    name: 'Troll', hp: 60, speed: 38, w: 28, h: 32,
    aggressive: true, attackLevel: 24, strengthLevel: 28, defenceLevel: 20,
    xpHp: 15, drops: [
      { item: ITEMS.BONES,      chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN,  chance: 0.9, qty: 20 },
      { item: ITEMS.ORE_COAL,   chance: 0.4, qty: 1 },
      { item: ITEMS.HERB_SEED,  chance: 0.08, qty: 1 },
      { item: ITEMS.MAGIC_SEED, chance: 0.04, qty: 1 },
    ],
    biomes: [BIOMES.DANGER],
  },
  demon: {
    name: 'Demon', hp: 120, speed: 62, w: 30, h: 34,
    aggressive: true, attackLevel: 40, strengthLevel: 42, defenceLevel: 35,
    xpHp: 25, drops: [
      { item: ITEMS.BONES,       chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN,   chance: 1.0, qty: 50 },
      { item: ITEMS.ORE_MITHRIL, chance: 0.3, qty: 1 },
      { item: ITEMS.MAGIC_SEED,  chance: 0.08, qty: 1 },
    ],
    biomes: [BIOMES.DANGER, BIOMES.VOLCANIC],
  },

  // ── Wildlife (biome-specific, rare) ─────────────────────
  frog: {
    name: 'Frog', hp: 2, speed: 72, w: 10, h: 8,
    aggressive: false, attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
    xpHp: 1, drops: [{ item: ITEMS.BONES, chance: 0.4, qty: 1 }],
    biomes: [BIOMES.SWAMP, BIOMES.PLAINS],
    nearWater: true,  // must spawn adjacent to a water tile
  },
  deer: {
    name: 'Deer', hp: 14, speed: 95, w: 20, h: 24,
    aggressive: false, attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
    xpHp: 2, drops: [
      { item: ITEMS.BONES,      chance: 1.0, qty: 1 },
      { item: ITEMS.BERRY_SEED, chance: 0.06, qty: 1 },
      { item: ITEMS.FLAX_SEED,  chance: 0.04, qty: 1 },
    ],
    biomes: [BIOMES.FOREST, BIOMES.PLAINS],
  },
  fox: {
    name: 'Fox', hp: 8, speed: 100, w: 18, h: 14,
    aggressive: false, attackLevel: 1, strengthLevel: 4, defenceLevel: 2,
    xpHp: 2, drops: [
      { item: ITEMS.BONES,      chance: 1.0, qty: 1 },
      { item: ITEMS.BERRY_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.FOREST, BIOMES.PLAINS],
    prey: ['rabbit', 'chicken'],
  },
  wolf: {
    name: 'Wolf', hp: 22, speed: 85, w: 22, h: 18,
    aggressive: true, attackLevel: 15, strengthLevel: 13, defenceLevel: 8,
    xpHp: 7, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.3, qty: 5 },
      { item: ITEMS.HERB_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.FOREST],
    prey: ['deer', 'rabbit', 'sheep', 'chicken'],
  },
  bear: {
    name: 'Bear', hp: 55, speed: 46, w: 28, h: 24,
    aggressive: true, attackLevel: 20, strengthLevel: 28, defenceLevel: 15,
    xpHp: 12, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.5, qty: 10 },
      { item: ITEMS.HERB_SEED, chance: 0.07, qty: 1 },
    ],
    biomes: [BIOMES.FOREST, BIOMES.TUNDRA],
    prey: ['deer', 'rabbit', 'sheep', 'chicken'],
  },
  polar_bear: {
    name: 'Polar Bear', hp: 62, speed: 44, w: 28, h: 24,
    aggressive: true, attackLevel: 22, strengthLevel: 32, defenceLevel: 18,
    xpHp: 14, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.5, qty: 12 },
      { item: ITEMS.FLAX_SEED, chance: 0.06, qty: 1 },
    ],
    biomes: [BIOMES.TUNDRA],
    prey: ['rabbit', 'sheep', 'deer'],
  },
  alligator: {
    name: 'Alligator', hp: 48, speed: 28, w: 36, h: 14,
    aggressive: true, attackLevel: 24, strengthLevel: 26, defenceLevel: 20,
    xpHp: 13, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.6, qty: 15 },
      { item: ITEMS.HERB_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.SWAMP],
    prey: ['frog', 'rabbit'],
  },
  scorpion: {
    name: 'Scorpion', hp: 20, speed: 68, w: 16, h: 12,
    aggressive: true, attackLevel: 17, strengthLevel: 15, defenceLevel: 10,
    xpHp: 8, drops: [
      { item: ITEMS.BONES,       chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN,   chance: 0.4, qty: 8 },
      { item: ITEMS.POTATO_SEED, chance: 0.06, qty: 1 },
    ],
    biomes: [BIOMES.DESERT],
    prey: ['rabbit'],
  },

  // ── New wildlife ────────────────────────────────────────
  rabbit: {
    name: 'Rabbit', hp: 3, speed: 110, w: 12, h: 12,
    aggressive: false, attackLevel: 1, strengthLevel: 1, defenceLevel: 1,
    xpHp: 1, drops: [
      { item: ITEMS.BONES,       chance: 0.6, qty: 1 },
      { item: ITEMS.BERRY_SEED,  chance: 0.06, qty: 1 },
    ],
    biomes: [BIOMES.FOREST, BIOMES.PLAINS, BIOMES.TUNDRA],
  },
  boar: {
    name: 'Boar', hp: 28, speed: 72, w: 24, h: 18,
    aggressive: true, attackLevel: 13, strengthLevel: 16, defenceLevel: 10,
    xpHp: 8, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.4, qty: 6 },
      { item: ITEMS.HERB_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.FOREST],
  },
  snake: {
    name: 'Snake', hp: 12, speed: 60, w: 22, h: 8,
    aggressive: true, attackLevel: 12, strengthLevel: 10, defenceLevel: 6,
    xpHp: 5, drops: [
      { item: ITEMS.BONES,       chance: 0.8, qty: 1 },
      { item: ITEMS.POTATO_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.SWAMP, BIOMES.DESERT],
    prey: ['frog', 'rabbit'],
  },
  coyote: {
    name: 'Coyote', hp: 18, speed: 88, w: 20, h: 16,
    aggressive: true, attackLevel: 12, strengthLevel: 10, defenceLevel: 7,
    xpHp: 6, drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.3, qty: 4 },
      { item: ITEMS.HERB_SEED, chance: 0.05, qty: 1 },
    ],
    biomes: [BIOMES.DESERT, BIOMES.PLAINS],
    prey: ['rabbit', 'chicken', 'deer'],
  },

  // ── Kingdom guards ────────────────────────────────────
  guard: {
    name: 'Guard', hp: 40, speed: 56, w: 24, h: 32,
    aggressive: false, retaliates: true,
    attackLevel: 20, strengthLevel: 18, defenceLevel: 16,
    xpHp: 8, wanderRadius: 10,
    drops: [
      { item: ITEMS.BONES,     chance: 1.0, qty: 1 },
      { item: ITEMS.GOLD_COIN, chance: 0.8, qty: 12 },
    ],
    biomes: [],
  },

  // ── Dungeon mobs ──────────────────────────────────────
  cave_rat: {
    name: 'Cave Rat', hp: 10, speed: 70, w: 16, h: 12,
    aggressive: true, attackLevel: 5, strengthLevel: 6, defenceLevel: 2,
    xpHp: 4, drops: [
      { item: ITEMS.BONES,        chance: 0.9, qty: 1 },
      { item: ITEMS.GOLD_COIN,    chance: 0.2, qty: 2 },
      { item: ITEMS.ANCIENT_BONE, chance: 0.05, qty: 1 },
    ],
    biomes: [],
  },
  cave_bat: {
    name: 'Cave Bat', hp: 8, speed: 85, w: 18, h: 10,
    aggressive: true, attackLevel: 4, strengthLevel: 5, defenceLevel: 1,
    xpHp: 3, drops: [
      { item: ITEMS.BONES,        chance: 0.7, qty: 1 },
      { item: ITEMS.GOLD_COIN,    chance: 0.15, qty: 1 },
    ],
    biomes: [],
  },
  giant_spider: {
    name: 'Giant Spider', hp: 50, speed: 75, w: 26, h: 20,
    aggressive: true, attackLevel: 18, strengthLevel: 22, defenceLevel: 10,
    xpHp: 7, drops: [
      { item: ITEMS.SILK_THREAD,  chance: 0.8, qty: 1 },
      { item: ITEMS.GOLD_COIN,    chance: 0.4, qty: 8 },
      { item: ITEMS.ANCIENT_BONE, chance: 0.1, qty: 1 },
    ],
    biomes: [],
  },
  skeleton: {
    name: 'Skeleton', hp: 55, speed: 55, w: 18, h: 28,
    aggressive: true, attackLevel: 20, strengthLevel: 25, defenceLevel: 14,
    xpHp: 7, drops: [
      { item: ITEMS.ANCIENT_BONE, chance: 1.0, qty: 2 },
      { item: ITEMS.GOLD_COIN,    chance: 0.5, qty: 12 },
      { item: ITEMS.HERB_SEED,    chance: 0.08, qty: 1 },
    ],
    biomes: [],
  },
  cave_troll: {
    name: 'Cave Troll', hp: 80, speed: 38, w: 28, h: 32,
    aggressive: true, attackLevel: 28, strengthLevel: 35, defenceLevel: 18,
    xpHp: 9, drops: [
      { item: ITEMS.ANCIENT_BONE, chance: 0.6, qty: 1 },
      { item: ITEMS.STONE_CORE,   chance: 0.3, qty: 1 },
      { item: ITEMS.GOLD_COIN,    chance: 0.6, qty: 20 },
    ],
    biomes: [],
  },
  stone_golem: {
    name: 'Stone Golem', hp: 130, speed: 28, w: 30, h: 34,
    aggressive: true, attackLevel: 35, strengthLevel: 45, defenceLevel: 30,
    xpHp: 12, drops: [
      { item: ITEMS.STONE_CORE,   chance: 0.9, qty: 2 },
      { item: ITEMS.GOLD_COIN,    chance: 0.7, qty: 30 },
      { item: ITEMS.ANCIENT_BONE, chance: 0.4, qty: 1 },
    ],
    biomes: [],
  },
  undead_warrior: {
    name: 'Undead Warrior', hp: 90, speed: 48, w: 22, h: 30,
    aggressive: true, attackLevel: 32, strengthLevel: 40, defenceLevel: 22,
    xpHp: 10, drops: [
      { item: ITEMS.ANCIENT_BONE, chance: 1.0, qty: 3 },
      { item: ITEMS.GOLD_COIN,    chance: 0.6, qty: 25 },
      { item: ITEMS.STONE_CORE,   chance: 0.2, qty: 1 },
    ],
    biomes: [],
  },
  dragon_whelp: {
    name: 'Dragon Whelp', hp: 180, speed: 52, w: 32, h: 28,
    aggressive: true, attackLevel: 55, strengthLevel: 65, defenceLevel: 35,
    xpHp: 15, drops: [
      { item: ITEMS.DRAGON_SCALE, chance: 1.0, qty: 2 },
      { item: ITEMS.GOLD_COIN,    chance: 0.8, qty: 60 },
      { item: ITEMS.STONE_CORE,   chance: 0.5, qty: 1 },
      { item: ITEMS.ANCIENT_BONE, chance: 0.5, qty: 2 },
    ],
    biomes: [],
  },
};

// ── Mob AI tuning constants ───────────────────────────────────────────────────
// Max tiles from its spawn anchor a mob will wander during idle roaming.
// Increase to make mobs drift further from their home territory.
const WANDER_RADIUS   = 6;
// Tiles from the target at which a melee mob stops moving and enters attack stance.
// Must be ≤ the combat.js attack range (3 tiles) so hits fire reliably.
const MELEE_RANGE     = 1.5;
// Tiles from spawn anchor that counts as "home" — ends the returning walk.
const HOME_RADIUS     = 2;
// Radius (tiles) within which prey animals detect and flee from predators.
const FLEE_RANGE      = 7;
// Distance (tiles) prey runs when fleeing — long enough to escape aggro radius.
const FLEE_SPREAD     = 14;
// Radius (tiles) predator wildlife scans when looking for killable prey mobs.
const HUNT_RANGE      = 8;

const AGGRO_LOSE_RANGE = AGGRO_RANGE + 4;  // tiles before aggro mob gives up and returns

/**
 * Bresenham tile-walk line-of-sight check.
 * Returns true if there are no solid tiles between (cx0,cy0) and (cx1,cy1).
 * The start and end tiles are not checked — only the tiles in between.
 * Pass world=null (server-side) to always return true.
 */
function hasLineOfSight(world, cx0, cy0, cx1, cy1) {
  if (!world) return true;

  let c = Math.floor(cx0 / TILE_SIZE);
  let r = Math.floor(cy0 / TILE_SIZE);
  const ec = Math.floor(cx1 / TILE_SIZE);
  const er = Math.floor(cy1 / TILE_SIZE);

  const dc = Math.abs(ec - c);
  const dr = Math.abs(er - r);
  const sc = c < ec ? 1 : -1;
  const sr = r < er ? 1 : -1;
  let err = dc - dr;

  while (c !== ec || r !== er) {
    const e2 = 2 * err;
    if (e2 > -dr) { err -= dr; c += sc; }
    if (e2 <  dc) { err += dc; r += sr; }
    if (c === ec && r === er) break; // reached destination tile — don't check it
    if (world.isSolid(c, r)) return false;
  }
  return true;
}

/**
 * Snap a mob to the nearest tile-aligned resting position.
 * Feet (y + h) land on the tile's bottom edge, matching the player's foot alignment.
 * Center (cx) lands on the tile's horizontal centre.
 */
function _snap(mob) {
  const feetRow  = Math.round((mob.y + mob.h) / TILE_SIZE);
  const centerCol = Math.floor(mob.cx    / TILE_SIZE);
  mob.y   = feetRow  * TILE_SIZE - mob.h;
  mob.x   = centerCol * TILE_SIZE + TILE_SIZE / 2 - mob.w / 2;
  mob.row = feetRow - 1;
  mob.col = centerCol;
}

// Auto-build flee table: prey animals automatically know which predators to run from
const _fleeFrom = {};
for (const [type, def] of Object.entries(MOB_DEFS)) {
  if (!def.prey) continue;
  for (const preyType of def.prey) {
    if (!_fleeFrom[preyType]) _fleeFrom[preyType] = [];
    _fleeFrom[preyType].push(type);
  }
}
// Coyotes also flee from wolves and bears (bigger predators)
(_fleeFrom.coyote ??= []).push('wolf', 'bear', 'polar_bear');
// Foxes flee from wolves and bears
(_fleeFrom.fox ??= []).push('wolf', 'bear', 'polar_bear');

export class Mob {
  constructor(type, x, y) {
    const def = MOB_DEFS[type];
    this.type  = type;
    this.name  = def.name;
    this.w     = def.w;
    this.h     = def.h;
    this.hp    = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.aggressive = def.aggressive;
    this.attackLevel   = def.attackLevel;
    this.strengthLevel = def.strengthLevel;
    this.defenceLevel  = def.defenceLevel;
    this.xpHp  = def.xpHp;  // XP per HP of damage dealt
    // OSRS-style combat level: floor(0.25 * (def + hp + floor(max(atk, str) * 1.3)))
    this.combatLevel = Math.max(1, Math.floor(0.25 * (
      def.defenceLevel + def.hp +
      Math.floor(Math.max(def.attackLevel, def.strengthLevel) * 1.3)
    )));
    this.drops      = def.drops;
    this.retaliates = def.retaliates ?? false;
    // Per-mob wander radius (tiles); falls back to module constant if not set
    this._wanderRadius = def.wanderRadius ?? WANDER_RADIUS;

    // Spawn anchor — mob returns here when not chasing
    const spawnCol    = Math.round(x / TILE_SIZE);
    const spawnRow    = Math.round(y / TILE_SIZE);
    this.spawnCol     = spawnCol;
    this.spawnRow     = spawnRow;
    // Feet-aligned initial position (feet at tile bottom, centre on tile centre)
    this.spawnX  = spawnCol * TILE_SIZE + TILE_SIZE / 2 - this.w / 2;
    this.spawnY  = spawnRow * TILE_SIZE + TILE_SIZE      - this.h;
    this.col     = spawnCol;
    this.row     = spawnRow;
    this.x       = this.spawnX;
    this.y       = this.spawnY;

    this.targetX     = null;
    this.targetY     = null;
    this.wanderTimer = Math.random() * 4;
    this.idleTime    = 1.5 + Math.random() * 2;

    this.animTimer  = 0;
    this.animFrame  = 0;
    this.moving     = false;
    this.facingLeft = false;

    // Combat state
    this.inCombat        = false;
    this.combatTarget    = null;   // reference to player
    this.isPlayerTarget  = false;  // true when combat.js is actively targeting this mob
    this.attackCooldown  = 0;      // seconds until next attack
    // True once the mob has snapped to a tile at melee range — prevents jitter.
    // Only cleared when player moves far enough away (hysteresis).
    this.atMeleeStop     = false;

    // Movement state machine
    // States: 'idle' | 'wandering' | 'chasing' | 'returning' | 'fleeing'
    this.state = 'idle';

    // Death / respawn
    this.dead         = false;
    this.respawnTimer = 0;

    // Wildlife: hunting prey mobs
    this.huntTarget = null;
    this.huntTimer  = 1 + Math.random();
  }

  update(dt, world, player, mobs) {
    if (this.dead) {
      this.respawnTimer -= dt;
      return;
    }

    // Drop aggro if the combat target escapes far enough.
    // Compare against combatTarget directly (not the player parameter) so this
    // works on both the client (combatTarget = player) and the server
    // (combatTarget = position proxy { cx, cy }).
    if (this.aggressive && this.inCombat && this.combatTarget) {
      const pdx = this.combatTarget.cx - this.cx;
      const pdy = this.combatTarget.cy - this.cy;
      const distTiles = Math.sqrt(pdx * pdx + pdy * pdy) / TILE_SIZE;

      if (distTiles > AGGRO_LOSE_RANGE) {
        this._startReturn();
      }
    }

    const myDef = MOB_DEFS[this.type];

    // ── 1. Aggressive mobs self-detect the player ─────────────────────
    if (this.aggressive && player && !this.inCombat) {
      const pdx = player.cx - this.cx;
      const pdy = player.cy - this.cy;
      if (Math.sqrt(pdx * pdx + pdy * pdy) / TILE_SIZE <= AGGRO_RANGE &&
          hasLineOfSight(world, this.cx, this.cy, player.cx, player.cy)) {
        this.inCombat     = true;
        this.combatTarget = player;
      }
    }

    // ── 2. Combat movement ────────────────────────────────────────────
    // When in combat, skip ALL other AI and move straight toward the player.
    
    if (this.inCombat && this.combatTarget) {
      this.state = 'chasing';
      const tdx = this.combatTarget.cx - this.cx;
      const tdy = this.combatTarget.cy - this.cy;
      const distTiles = Math.sqrt(tdx * tdx + tdy * tdy) / TILE_SIZE;

      if (distTiles <= MELEE_RANGE) {
        if (!this.atMeleeStop) {
          _snap(this);
          this.atMeleeStop = true;
        }
        this.targetX = null;
        this.targetY = null;
      } else if (this.atMeleeStop && distTiles <= MELEE_RANGE + 1.0) {
        // Hysteresis: stay put until player is clearly far enough away.
        this.targetX = null;
        this.targetY = null;
      } else {
        this.atMeleeStop = false;
        this.targetX = this.combatTarget.cx - this.w / 2;
        this.targetY = this.combatTarget.cy - this.h / 2;
      }
    } else {
      // ── 3. Non-combat AI ─────────────────────────────────────────────
      // Reset to idle if combat was just released
      if (this.state === 'chasing' || this.state === 'attacking') {
        this._transitionIdle();
      }

      // Prey flee from nearby predators
      if (this.state !== 'returning' && this.state !== 'fleeing') {
        const predators = _fleeFrom[this.type];
        if (predators) {
          const FLEE_R_SQ = (FLEE_RANGE * TILE_SIZE) ** 2;
          for (const other of mobs) {
            if (other === this || other.dead) continue;
            if (!predators.includes(other.type)) continue;
            const dx = other.cx - this.cx;
            const dy = other.cy - this.cy;
            if (dx * dx + dy * dy < FLEE_R_SQ) { this._startFlee(other); break; }
          }
        }
      }

      // Idle / wander / return / flee states
      switch (this.state) {
        case 'idle':
          this.wanderTimer -= dt;
          if (this.wanderTimer <= 0) this._startWander(world);
          break;

        case 'wandering':
          if (this.targetX !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            if (Math.sqrt(dx * dx + dy * dy) <= 4) {
              _snap(this);
              this.state       = 'idle';
              this.targetX     = null;
              this.targetY     = null;
              this.wanderTimer = this.idleTime + Math.random() * 2;
            }
          }
          break;

        case 'returning':
          this.targetX = this.spawnX;
          this.targetY = this.spawnY;
          if (Math.hypot(this.spawnX - this.x, this.spawnY - this.y) / TILE_SIZE <= HOME_RADIUS) {
            this._transitionIdle();
          }
          break;

        case 'fleeing':
          if (this.targetX === null || this.targetY === null ||
            Math.hypot(this.targetX - this.x, this.targetY - this.y) <= 4) {
            this._transitionIdle();
          }
          break;

        default: this.state = 'idle';
      }

      // Wildlife: hunt prey mobs
      if (this.state !== 'fleeing' && mobs && myDef.prey?.length > 0) {
        const HUNT_R_SQ = (HUNT_RANGE * TILE_SIZE) ** 2;
        if (this.huntTarget?.dead) this.huntTarget = null;
        if (!this.huntTarget) {
          for (const other of mobs) {
            if (other === this || other.dead) continue;
            if (!myDef.prey.includes(other.type)) continue;
            const dx = other.cx - this.cx;
            const dy = other.cy - this.cy;
            if (dx * dx + dy * dy < HUNT_R_SQ) { this.huntTarget = other; break; }
          }
        }
        if (this.huntTarget) {
          this.huntTimer -= dt;
          const dx = this.huntTarget.cx - this.cx;
          const dy = this.huntTarget.cy - this.cy;
          if (dx * dx + dy * dy < (TILE_SIZE * 1.5) ** 2) {
            this.targetX = null;
            this.targetY = null;
            if (this.huntTimer <= 0) {
              const dmg    = Math.max(1, Math.floor(myDef.strengthLevel * 0.4));
              const killed = this.huntTarget.takeDamage(dmg);
              if (killed) {
                this.huntTarget.dead         = true;
                this.huntTarget.respawnTimer = MOB_RESPAWN_TIME;
                this.huntTarget              = null;
              }
              this.huntTimer = 1.8 + Math.random() * 0.6;
            }
          } else {
            this.targetX = this.huntTarget.x;
            this.targetY = this.huntTarget.y;
          }
        }
      } else {
        this.huntTarget = null;
      }
    }

  // ── 4. Move toward target ─────────────────────────────────────────
  this.moving = false;
  if (this.targetX !== null && this.targetY !== null) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const nx = dx / dist;
      const ny = dy / dist;

      if (dx < 0) this.facingLeft = true;
      else if (dx > 0) this.facingLeft = false;

      const prevX = this.x;
      const prevY = this.y;

      let blockedX = false;
      let blockedY = false;

      const newX = this.x + nx * this.speed * dt;
      if (!world.isBlocked(newX, this.y, this.w, this.h)) {
        this.x = newX;
      } else {
        blockedX = true;
      }

      const newY = this.y + ny * this.speed * dt;
      if (!world.isBlocked(this.x, newY, this.w, this.h)) {
        this.y = newY;
      } else {
        blockedY = true;
      }

      if ((blockedX || blockedY) && this.state === 'wandering') {
        // Pause briefly instead of immediately re-picking a direction — prevents
        // rapid left/right oscillation when surrounded by obstacles.
        this._transitionIdle();
      }

      if ((blockedX || blockedY) && this.state === 'returning') {
        this._transitionIdle();
      }

      this.x = Math.max(0, Math.min(this.x, WORLD_COLS * TILE_SIZE - this.w));
      this.y = Math.max(0, Math.min(this.y, WORLD_ROWS * TILE_SIZE - this.h));

      this.moving =
        Math.abs(this.x - prevX) > 0.01 || Math.abs(this.y - prevY) > 0.01;
    } else {
      // Arrived — snap to tile with feet-aligned position
      _snap(this);
      this.targetX = null;
      this.targetY = null;
    }
  }

    // ── 5. Walk animation ─────────────────────────────────────────────
    if (this.moving) {
      this.animTimer += dt;
      if (this.animTimer > 0.18) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  // ── State transition helpers ────────────────────────────────────────

  /** Clear all combat/movement state and return to idle standing. */
  _transitionIdle() {
    this.inCombat     = false;
    this.combatTarget = null;
    this.atMeleeStop  = false;
    this.state        = 'idle';
    this.targetX      = null;
    this.targetY      = null;
    this.wanderTimer  = 1 + Math.random() * 2;
    _snap(this);
  }

  /**
   * Begin wandering to a random point within WANDER_RADIUS of the spawn anchor.
   * Mobs stay near their home territory rather than drifting across the world.
   */
  _startWander(world) {
    const MAX_TRIES = 8;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = (0.5 + Math.random() * 0.5) * this._wanderRadius; // in tiles
      const tCol   = Math.round(this.spawnCol + Math.cos(angle) * radius);
      const tRow   = Math.round(this.spawnRow + Math.sin(angle) * radius);
      const col    = Math.max(0, Math.min(tCol, WORLD_COLS - 1));
      const row    = Math.max(0, Math.min(tRow, WORLD_ROWS - 1));
      if (world && world.isSolid(col, row)) continue;
      this.targetX = col * TILE_SIZE + TILE_SIZE / 2 - this.w / 2;
      this.targetY = row * TILE_SIZE + TILE_SIZE      - this.h;
      this.state   = 'wandering';
      return;
    }
    // All attempts landed on solid tiles — stay idle a bit longer
    this.wanderTimer = this.idleTime + Math.random() * 2;
  }

  /** Disengage and walk back to spawn anchor. HP is not reset. */
  _startReturn() {
    this.inCombat     = false;
    this.combatTarget = null;
    this.atMeleeStop  = false;
    this.state        = 'returning';
    this.targetX      = this.spawnX;
    this.targetY      = this.spawnY;
  }

  /** Run directly away from a predator to the flee spread distance. */
  _startFlee(predator) {
    const dx     = predator.cx - this.cx;
    const dy     = predator.cy - this.cy;
    const d      = Math.sqrt(dx * dx + dy * dy) || 1;
    const tCol   = Math.round(this.col - (dx / d) * FLEE_SPREAD);
    const tRow   = Math.round(this.row - (dy / d) * FLEE_SPREAD);
    const col    = Math.max(0, Math.min(tCol, WORLD_COLS - 1));
    const row    = Math.max(0, Math.min(tRow, WORLD_ROWS - 1));
    this.targetX = col * TILE_SIZE + TILE_SIZE / 2 - this.w / 2;
    this.targetY = row * TILE_SIZE + TILE_SIZE      - this.h;
    this.state   = 'fleeing';
  }


  takeDamage(amount, attacker = null) {
    this.hp = Math.max(0, this.hp - amount);
    // Retaliatory mobs (e.g. guards) fight back when first struck
    if (this.retaliates && !this.inCombat && attacker && amount > 0) {
      this.inCombat     = true;
      this.combatTarget = attacker;
    }
    return this.hp <= 0;
  }

  draw(ctx) {
    if (this.dead) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const { w, h, moving, animFrame, facingLeft, name, hp, maxHp, type } = this;
    const bob = moving ? Math.abs(Math.sin(animFrame * Math.PI / 2)) * 1 : 0;
    const legBob = moving ? Math.abs(Math.sin(animFrame * Math.PI / 2)) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w / 2 - 1, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'chicken') {
      _drawChicken(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'cow') {
      _drawCow(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'sheep') {
      _drawSheep(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'goblin') {
      _drawGoblin(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'orc') {
      _drawOrc(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'troll') {
      _drawTroll(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'demon') {
      _drawDemon(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'frog') {
      _drawFrog(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'deer') {
      _drawDeer(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'fox') {
      _drawFox(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'wolf') {
      _drawWolf(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'bear') {
      _drawBear(ctx, x, y, w, h, bob, legBob, facingLeft, false);
    } else if (type === 'polar_bear') {
      _drawBear(ctx, x, y, w, h, bob, legBob, facingLeft, true);
    } else if (type === 'alligator') {
      _drawAlligator(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'scorpion') {
      _drawScorpion(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'rabbit') {
      _drawRabbit(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'boar') {
      _drawBoar(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'snake') {
      _drawSnake(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'coyote') {
      _drawCoyote(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'cave_rat') {
      _drawCaveRat(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'cave_bat') {
      _drawCaveBat(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'giant_spider') {
      _drawGiantSpider(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'skeleton') {
      _drawSkeleton(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'cave_troll') {
      _drawCaveTroll(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'stone_golem') {
      _drawStoneGolem(ctx, x, y, w, h, bob, facingLeft);
    } else if (type === 'undead_warrior') {
      _drawUndeadWarrior(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'dragon_whelp') {
      _drawDragonWhelp(ctx, x, y, w, h, bob, legBob, facingLeft);
    } else if (type === 'guard') {
      _drawGuard(ctx, x, y, w, h, bob, legBob, facingLeft);
    }

    // Name tag — "Name (Lvl. X)", matching player label style
    // aggressive=red, retaliates=yellow, passive=white
    const nameColor = this.aggressive ? '#e74c3c' : this.retaliates ? '#f1c40f' : '#fff';
    const label = `${name} (Lvl. ${this.combatLevel})`;
    ctx.fillStyle = nameColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(label, x + w / 2, y - 4);
    ctx.fillText(label, x + w / 2, y - 4);

    // HP bar — always visible for combat mobs, only when damaged for passive
    if (hp < maxHp || this.inCombat) {
      const ratio = hp / maxHp;
      const bw = Math.max(w, 30), bh = 6;
      const bx = x + (w - bw) / 2, by = y - 14;
      // Background track
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(bx, by, bw, bh);
      // Fill colour matches player bar thresholds
      ctx.fillStyle = ratio > 0.5 ? '#27ae60' : ratio > 0.25 ? '#f39c12' : '#c0392b';
      ctx.fillRect(bx, by, bw * ratio, bh);
      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
      // HP text
      ctx.fillStyle = '#fff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hp}/${maxHp}`, bx + bw / 2, by - 1);
      ctx.textAlign = 'left';
    }
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

/* ── Per-type draw helpers ──────────────────────────── */

function _drawChicken(ctx, x, y, w, h, bob, legBob, facingLeft) {
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(x + 3 - legBob, y + h - 4, 2, 4);
  ctx.fillRect(x + w - 5 + legBob, y + h - 4, 2, 4);
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(x + 1, y + 5 - bob, w - 2, h - 9);
  ctx.fillStyle = '#d8d8d0';
  ctx.fillRect(x + 2, y + 7 - bob, w - 4, Math.floor((h - 11) / 2));
  const tailX = facingLeft ? x + w - 4 : x;
  ctx.fillStyle = '#e8e8e0';
  ctx.fillRect(tailX, y + 6 - bob, 4, 5);
  const headX = facingLeft ? x : x + w - 7;
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(headX, y + 1 - bob, 7, 7);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(headX + 1, y - 2 - bob, 4, 4);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(headX + 2, y + 6 - bob, 2, 3);
  ctx.fillStyle = '#e67e22';
  const beakX = facingLeft ? headX - 2 : headX + 7;
  ctx.fillRect(beakX, y + 3 - bob, 2, 2);
  ctx.fillStyle = '#222';
  ctx.fillRect(headX + (facingLeft ? 4 : 1), y + 3 - bob, 2, 2);
}

function _drawCow(ctx, x, y, w, h, bob, legBob, facingLeft) {
  ctx.fillStyle = '#7b5430';
  ctx.fillRect(x + w - 8 + legBob, y + h - 7, 4, 7);
  ctx.fillStyle = '#a07848';
  ctx.fillRect(x + 2, y + 7 - bob, w - 6, h - 12);
  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(x + 4, y + 9 - bob, 6, 4);
  ctx.fillRect(x + w - 13, y + 13 - bob, 4, 3);
  ctx.fillStyle = '#f0c0b0';
  ctx.fillRect(x + Math.floor(w / 2) - 4, y + h - 9 - bob, 9, 5);
  ctx.fillStyle = '#7b5430';
  ctx.fillRect(x + 4 - legBob, y + h - 7, 4, 7);
  const headX = facingLeft ? x - 2 : x + w - 11;
  ctx.fillStyle = '#a07848';
  ctx.fillRect(headX, y + 3 - bob, 11, 9);
  ctx.fillStyle = '#c49a70';
  const noseOffset = facingLeft ? 0 : 1;
  ctx.fillRect(headX + noseOffset, y + 8 - bob, 9, 5);
  ctx.fillStyle = '#7a4a30';
  ctx.fillRect(headX + noseOffset + 1, y + 9 - bob, 2, 2);
  ctx.fillRect(headX + noseOffset + 5, y + 9 - bob, 2, 2);
  ctx.fillStyle = '#e0d060';
  const hornX = facingLeft ? headX + 8 : headX + 1;
  ctx.fillRect(hornX, y - bob, 3, 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(headX + (facingLeft ? 7 : 2), y + 4 - bob, 2, 2);
}

function _drawSheep(ctx, x, y, w, h, bob, legBob, facingLeft) {
  ctx.fillStyle = '#777';
  ctx.fillRect(x + 3 - legBob, y + h - 5, 3, 5);
  ctx.fillRect(x + w - 6 + legBob, y + h - 5, 3, 5);
  ctx.fillStyle = '#e4e4d8';
  ctx.fillRect(x + 2, y + 7 - bob, w - 4, h - 12);
  ctx.fillStyle = '#f0f0e4';
  ctx.beginPath();
  ctx.arc(x + 4, y + 8 - bob, 5, Math.PI, 0);
  ctx.arc(x + Math.floor(w / 2), y + 6 - bob, 5, Math.PI, 0);
  ctx.arc(x + w - 4, y + 8 - bob, 5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 1, y + 12 - bob, 3, Math.PI / 2, -Math.PI / 2);
  ctx.arc(x + w - 1, y + 12 - bob, 3, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  const headX = facingLeft ? x - 1 : x + w - 9;
  ctx.fillStyle = '#888';
  ctx.fillRect(headX, y + 4 - bob, 9, 8);
  ctx.fillStyle = '#aaa';
  const earX = facingLeft ? headX + 8 : headX - 1;
  ctx.fillRect(earX, y + 4 - bob, 2, 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(headX + (facingLeft ? 5 : 2), y + 6 - bob, 2, 2);
  ctx.fillStyle = '#b07070';
  ctx.fillRect(headX + (facingLeft ? 1 : 2), y + 9 - bob, 4, 2);
}

function _drawGoblin(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Legs
  ctx.fillStyle = '#5a4020';
  ctx.fillRect(x + 3 - legBob, y + h - 6, 4, 6);
  ctx.fillRect(x + w - 7 + legBob, y + h - 6, 4, 6);
  // Body
  ctx.fillStyle = '#6a9a20';
  ctx.fillRect(x + 2, y + h * 0.4 - bob, w - 4, h * 0.45);
  // Chest rag
  ctx.fillStyle = '#5a7a18';
  ctx.fillRect(x + 4, y + h * 0.42 - bob, w - 8, h * 0.2);
  // Arms
  ctx.fillStyle = '#6a9a20';
  ctx.fillRect(x - 1, y + h * 0.42 - bob, 4, h * 0.35);
  ctx.fillRect(x + w - 3, y + h * 0.42 - bob, 4, h * 0.35);
  // Head (large, goblin-style)
  const headX = facingLeft ? x - 1 : x + 1;
  ctx.fillStyle = '#6a9a20';
  ctx.fillRect(headX, y + 2 - bob, w - 2, h * 0.38);
  // Ears
  ctx.fillStyle = '#5a8018';
  ctx.fillRect(facingLeft ? headX - 3 : headX + w - 2, y + 4 - bob, 3, 5);
  ctx.fillRect(facingLeft ? headX + w - 2 : headX - 3, y + 4 - bob, 3, 5);
  // Eyes (mean)
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(headX + 2, y + 5 - bob, 3, 2);
  ctx.fillRect(headX + w - 7, y + 5 - bob, 3, 2);
  // Nose
  ctx.fillStyle = '#4a7010';
  ctx.fillRect(headX + Math.floor(w / 2) - 1, y + 8 - bob, 2, 2);
}

function _drawOrc(ctx, x, y, w, h, bob, legBob, _facingLeft) {
  // Legs
  ctx.fillStyle = '#2a3a28';
  ctx.fillRect(x + 3 - legBob, y + h - 8, 6, 8);
  ctx.fillRect(x + w - 9 + legBob, y + h - 8, 6, 8);
  // Armoured body
  ctx.fillStyle = '#5a8050';
  ctx.fillRect(x + 1, y + h * 0.35 - bob, w - 2, h * 0.5);
  // Armour plate
  ctx.fillStyle = '#7a9a70';
  ctx.fillRect(x + 3, y + h * 0.37 - bob, w - 6, h * 0.25);
  // Belt
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x + 1, y + h * 0.6 - bob, w - 2, 3);
  // Arms
  ctx.fillStyle = '#5a8050';
  ctx.fillRect(x - 2, y + h * 0.37 - bob, 5, h * 0.4);
  ctx.fillRect(x + w - 3, y + h * 0.37 - bob, 5, h * 0.4);
  // Head
  ctx.fillStyle = '#5a8050';
  ctx.fillRect(x + 2, y + 1 - bob, w - 4, h * 0.38);
  // Tusks
  ctx.fillStyle = '#e8e0a0';
  ctx.fillRect(x + 4, y + h * 0.3 - bob, 3, 5);
  ctx.fillRect(x + w - 7, y + h * 0.3 - bob, 3, 5);
  // Eyes
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(x + 5, y + 6 - bob, 3, 3);
  ctx.fillRect(x + w - 8, y + 6 - bob, 3, 3);
}

function _drawTroll(ctx, x, y, w, h, bob, legBob, _facingLeft) {
  // Wide legs
  ctx.fillStyle = '#5a4a38';
  ctx.fillRect(x + 2 - legBob, y + h - 10, 8, 10);
  ctx.fillRect(x + w - 10 + legBob, y + h - 10, 8, 10);
  // Big rocky body
  ctx.fillStyle = '#6a5a48';
  ctx.fillRect(x, y + h * 0.3 - bob, w, h * 0.55);
  // Rock texture patches
  ctx.fillStyle = '#5a4a38';
  ctx.fillRect(x + 3, y + h * 0.35 - bob, 6, 4);
  ctx.fillRect(x + w - 11, y + h * 0.45 - bob, 7, 4);
  // Arms (huge)
  ctx.fillStyle = '#6a5a48';
  ctx.fillRect(x - 4, y + h * 0.3 - bob, 6, h * 0.5);
  ctx.fillRect(x + w - 2, y + h * 0.3 - bob, 6, h * 0.5);
  // Big head
  ctx.fillStyle = '#6a5a48';
  ctx.fillRect(x + 1, y - bob, w - 2, h * 0.38);
  // Nose (big)
  ctx.fillStyle = '#5a4a38';
  ctx.fillRect(x + Math.floor(w / 2) - 3, y + h * 0.18 - bob, 6, 5);
  // Eyes (tiny, mean)
  ctx.fillStyle = '#cc2200';
  ctx.fillRect(x + 5, y + 6 - bob, 3, 3);
  ctx.fillRect(x + w - 8, y + 6 - bob, 3, 3);
}

function _drawDemon(ctx, x, y, w, h, bob, legBob, _facingLeft) {
  // Dark legs
  ctx.fillStyle = '#2a0a0a';
  ctx.fillRect(x + 2 - legBob, y + h - 9, 7, 9);
  ctx.fillRect(x + w - 9 + legBob, y + h - 9, 7, 9);
  // Dark body with fire glow
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(x + 1, y + h * 0.3 - bob, w - 2, h * 0.55);
  // Glowing chest rune
  ctx.fillStyle = '#ff2200';
  ctx.fillRect(x + Math.floor(w / 2) - 3, y + h * 0.38 - bob, 6, 8);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(x + Math.floor(w / 2) - 1, y + h * 0.4 - bob, 2, 4);
  // Wings
  ctx.fillStyle = '#1a0505';
  ctx.fillRect(x - 6, y + h * 0.25 - bob, 7, h * 0.45);
  ctx.fillRect(x + w - 1, y + h * 0.25 - bob, 7, h * 0.45);
  // Arms
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(x - 2, y + h * 0.32 - bob, 5, h * 0.4);
  ctx.fillRect(x + w - 3, y + h * 0.32 - bob, 5, h * 0.4);
  // Head
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(x + 2, y + 1 - bob, w - 4, h * 0.33);
  // Horns
  ctx.fillStyle = '#660000';
  ctx.fillRect(x + 4, y - 6 - bob, 3, 8);
  ctx.fillRect(x + w - 7, y - 6 - bob, 3, 8);
  // Glowing eyes
  ctx.fillStyle = '#ff2200';
  ctx.fillRect(x + 5, y + 5 - bob, 4, 4);
  ctx.fillRect(x + w - 9, y + 5 - bob, 4, 4);
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(x + 6, y + 6 - bob, 2, 2);
  ctx.fillRect(x + w - 8, y + 6 - bob, 2, 2);
}

function _drawFrog(ctx, x, y, w, h, bob, facingLeft) {
  // Back legs (splayed)
  ctx.fillStyle = '#2a6a18';
  ctx.fillRect(x - 2, y + h - 4 + bob, 4, 3);
  ctx.fillRect(x + w - 2, y + h - 4 + bob, 4, 3);
  // Body — squat oval shape
  ctx.fillStyle = '#3a8c20';
  ctx.fillRect(x + 1, y + 2 - bob, w - 2, h - 4);
  // Belly — lighter
  ctx.fillStyle = '#6ab840';
  ctx.fillRect(x + 2, y + 4 - bob, w - 4, h - 7);
  // Eyes — bulging on top
  ctx.fillStyle = '#4aaa28';
  ctx.fillRect(x,     y - 2 - bob, 4, 4);
  ctx.fillRect(x + w - 4, y - 2 - bob, 4, 4);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 1, y - 1 - bob, 2, 2);
  ctx.fillRect(x + w - 3, y - 1 - bob, 2, 2);
  // Mouth line
  ctx.fillStyle = '#1a5a10';
  ctx.fillRect(facingLeft ? x + w - 5 : x + 1, y + h - 5 - bob, 4, 1);
  // Front feet
  ctx.fillStyle = '#2a6a18';
  ctx.fillRect(x + 1, y + h - 2 + bob, 2, 2);
  ctx.fillRect(x + w - 3, y + h - 2 + bob, 2, 2);
}

function _drawDeer(ctx, x, y, w, h, bob, legBob, facingLeft) {
  const legH = Math.round(h * 0.42);
  // Back legs
  ctx.fillStyle = '#7a4a28';
  ctx.fillRect(x + w - 7 + legBob, y + h - legH, 3, legH);
  ctx.fillRect(x + w - 11 - legBob, y + h - legH + 2, 3, legH - 2);
  // Front legs
  ctx.fillRect(x + 4 - legBob, y + h - legH, 3, legH);
  ctx.fillRect(x + 8 + legBob, y + h - legH + 2, 3, legH - 2);
  // Body
  ctx.fillStyle = '#c8844a';
  ctx.fillRect(x + 2, y + Math.round(h * 0.28) - bob, w - 4, Math.round(h * 0.45));
  // White rump patch
  ctx.fillStyle = '#f0e8d8';
  ctx.fillRect(x + w - 7, y + Math.round(h * 0.3) - bob, 6, Math.round(h * 0.28));
  // Neck
  ctx.fillStyle = '#b87840';
  const neckX = facingLeft ? x + w - 8 : x + 2;
  ctx.fillRect(neckX, y + Math.round(h * 0.14) - bob, 6, Math.round(h * 0.22));
  // Head
  const headX = facingLeft ? x + w - 11 : x - 1;
  ctx.fillStyle = '#c8844a';
  ctx.fillRect(headX, y + 2 - bob, 10, 7);
  // Snout
  ctx.fillStyle = '#a86838';
  ctx.fillRect(facingLeft ? headX - 2 : headX + 8, y + 4 - bob, 3, 4);
  // Eye
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 7 : 2), y + 3 - bob, 2, 2);
  // Antlers (branching)
  ctx.fillStyle = '#7a4a1a';
  const antlerX = facingLeft ? headX + 6 : headX + 2;
  ctx.fillRect(antlerX, y - 5 - bob, 2, 6);
  ctx.fillRect(antlerX + (facingLeft ? -3 : 2), y - 4 - bob, 3, 2);
}

function _drawFox(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Legs
  ctx.fillStyle = '#b84a10';
  ctx.fillRect(x + 2 - legBob, y + h - 5, 3, 5);
  ctx.fillRect(x + w - 5 + legBob, y + h - 5, 3, 5);
  // Bushy tail
  const tailX = facingLeft ? x + 1 : x + w - 7;
  ctx.fillStyle = '#d86020';
  ctx.fillRect(tailX, y + Math.round(h * 0.3) - bob, 6, Math.round(h * 0.5));
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(tailX + 1, y + Math.round(h * 0.55) - bob, 4, Math.round(h * 0.25));
  // Body
  ctx.fillStyle = '#d86020';
  ctx.fillRect(x + 2, y + Math.round(h * 0.3) - bob, w - 4, Math.round(h * 0.5));
  // White chest
  ctx.fillStyle = '#f0ece0';
  ctx.fillRect(x + 4, y + Math.round(h * 0.35) - bob, w - 8, Math.round(h * 0.3));
  // Head
  const headX = facingLeft ? x - 1 : x + w - 8;
  ctx.fillStyle = '#d86020';
  ctx.fillRect(headX, y + 2 - bob, 8, 6);
  // Pointed ears
  ctx.fillStyle = '#b84a10';
  ctx.fillRect(headX + (facingLeft ? 4 : 0), y - 3 - bob, 3, 5);
  ctx.fillRect(headX + (facingLeft ? 1 : 3), y - 3 - bob, 3, 5);
  // Inner ear
  ctx.fillStyle = '#ff8888';
  ctx.fillRect(headX + (facingLeft ? 5 : 1), y - 2 - bob, 1, 3);
  // Pointed snout
  ctx.fillStyle = '#c84010';
  ctx.fillRect(facingLeft ? headX - 3 : headX + 7, y + 4 - bob, 3, 3);
  // Eye
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 5 : 1), y + 3 - bob, 2, 2);
  ctx.fillStyle = '#d4a000';
  ctx.fillRect(headX + (facingLeft ? 5 : 1), y + 3 - bob, 1, 1);
}

function _drawWolf(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Legs
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(x + 2 - legBob, y + h - 6, 4, 6);
  ctx.fillRect(x + w - 6 + legBob, y + h - 6, 4, 6);
  ctx.fillRect(x + 5 + legBob, y + h - 5, 3, 5);
  ctx.fillRect(x + w - 8 - legBob, y + h - 5, 3, 5);
  // Tail (raised when aggressive)
  const tailX = facingLeft ? x + w - 4 : x;
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(tailX, y + Math.round(h * 0.1) - bob, 4, Math.round(h * 0.4));
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(tailX + 1, y + Math.round(h * 0.12) - bob, 2, 4);
  // Body
  ctx.fillStyle = '#787878';
  ctx.fillRect(x + 2, y + Math.round(h * 0.28) - bob, w - 4, Math.round(h * 0.48));
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(x + 3, y + Math.round(h * 0.3) - bob, w - 6, Math.round(h * 0.22));
  // Neck
  const neckX = facingLeft ? x + w - 8 : x + 2;
  ctx.fillStyle = '#787878';
  ctx.fillRect(neckX, y + Math.round(h * 0.18) - bob, 6, Math.round(h * 0.2));
  // Scruff
  ctx.fillStyle = '#505050';
  ctx.fillRect(neckX, y + Math.round(h * 0.18) - bob, 6, 4);
  // Head
  const headX = facingLeft ? x + w - 11 : x - 1;
  ctx.fillStyle = '#787878';
  ctx.fillRect(headX, y + 2 - bob, 10, 8);
  // Pointed ears
  ctx.fillStyle = '#505050';
  ctx.fillRect(headX + (facingLeft ? 6 : 1), y - 4 - bob, 3, 6);
  ctx.fillRect(headX + (facingLeft ? 2 : 5), y - 3 - bob, 3, 5);
  // Snout
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(facingLeft ? headX - 4 : headX + 9, y + 5 - bob, 5, 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(facingLeft ? headX - 2 : headX + 10, y + 5 - bob, 2, 2);
  // Eyes (yellow, piercing)
  ctx.fillStyle = '#c8a800';
  ctx.fillRect(headX + (facingLeft ? 6 : 2), y + 3 - bob, 2, 2);
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 7 : 2), y + 3 - bob, 1, 1);
}

function _drawBear(ctx, x, y, w, h, bob, legBob, facingLeft, polar) {
  const fur    = polar ? '#e8eee8' : '#6a3c18';
  const dark   = polar ? '#c8d4c8' : '#4a2808';
  const nose   = polar ? '#1a1a1a' : '#2a1408';
  // Thick legs
  ctx.fillStyle = dark;
  ctx.fillRect(x + 2 - legBob, y + h - 7, 6, 7);
  ctx.fillRect(x + w - 8 + legBob, y + h - 7, 6, 7);
  ctx.fillRect(x + 5 + legBob, y + h - 6, 5, 6);
  ctx.fillRect(x + w - 10 - legBob, y + h - 6, 5, 6);
  // Massive body
  ctx.fillStyle = fur;
  ctx.fillRect(x + 1, y + Math.round(h * 0.25) - bob, w - 2, Math.round(h * 0.55));
  ctx.fillStyle = dark;
  ctx.fillRect(x + 2, y + Math.round(h * 0.3) - bob, w - 4, Math.round(h * 0.18));
  // Hump on back
  ctx.fillStyle = fur;
  const humpX = facingLeft ? x + w - 10 : x + 2;
  ctx.fillRect(humpX, y + Math.round(h * 0.15) - bob, 9, Math.round(h * 0.2));
  // Head (large, round)
  const headX = facingLeft ? x + w - 12 : x;
  ctx.fillStyle = fur;
  ctx.fillRect(headX, y + 2 - bob, 12, 10);
  // Round ears
  ctx.fillRect(headX + (facingLeft ? 8 : 0), y - 2 - bob, 4, 4);
  ctx.fillRect(headX + (facingLeft ? 3 : 7), y - 2 - bob, 4, 4);
  ctx.fillStyle = dark;
  ctx.fillRect(headX + (facingLeft ? 9 : 1), y - 1 - bob, 2, 2);
  ctx.fillRect(headX + (facingLeft ? 4 : 8), y - 1 - bob, 2, 2);
  // Broad muzzle
  ctx.fillStyle = dark;
  ctx.fillRect(facingLeft ? headX - 3 : headX + 9, y + 5 - bob, 5, 5);
  ctx.fillStyle = nose;
  ctx.fillRect(facingLeft ? headX - 1 : headX + 10, y + 5 - bob, 2, 2);
  // Eyes
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 8 : 2), y + 3 - bob, 2, 2);
}

function _drawAlligator(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Short stubby legs
  ctx.fillStyle = '#1a4a14';
  ctx.fillRect(x + 4 - legBob, y + h - 4, 4, 4);
  ctx.fillRect(x + w - 10 + legBob, y + h - 4, 4, 4);
  ctx.fillRect(x + 8 + legBob, y + h - 3, 4, 3);
  ctx.fillRect(x + w - 14 - legBob, y + h - 3, 4, 3);
  // Long flat body
  ctx.fillStyle = '#2a6020';
  ctx.fillRect(x + 4, y + Math.round(h * 0.2) - bob, w - 8, Math.round(h * 0.65));
  // Ridged back (scutes)
  ctx.fillStyle = '#1a4814';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 6 + i * Math.round((w - 14) / 5), y + Math.round(h * 0.2) - bob, 4, 3);
  }
  // Tapering tail
  const tailX = facingLeft ? x + w - 6 : x;
  ctx.fillStyle = '#2a6020';
  ctx.fillRect(tailX, y + Math.round(h * 0.3) - bob, 6, Math.round(h * 0.45));
  // Head — wide, flat snout
  const headX = facingLeft ? x - 4 : x + w - 14;
  ctx.fillStyle = '#2a6020';
  ctx.fillRect(headX, y + Math.round(h * 0.15) - bob, 14, Math.round(h * 0.6));
  // Nostrils on top
  ctx.fillStyle = '#1a4814';
  ctx.fillRect(headX + (facingLeft ? 1 : 10), y + Math.round(h * 0.18) - bob, 2, 2);
  ctx.fillRect(headX + (facingLeft ? 4 : 7), y + Math.round(h * 0.18) - bob, 2, 2);
  // Yellow eyes
  ctx.fillStyle = '#c8b800';
  ctx.fillRect(headX + (facingLeft ? 9 : 2), y + Math.round(h * 0.2) - bob, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 10 : 3), y + Math.round(h * 0.21) - bob, 1, 2);
  // Teeth
  ctx.fillStyle = '#e8e0c0';
  const toothStart = facingLeft ? headX - 2 : headX + 12;
  const dir = facingLeft ? -1 : 1;
  for (let t = 0; t < 3; t++) {
    ctx.fillRect(toothStart + dir * t * 2, y + Math.round(h * 0.55) - bob, 1, 3);
  }
}

function _drawScorpion(ctx, x, y, w, h, bob, facingLeft) {
  // Many legs (3 pairs)
  ctx.fillStyle = '#3a2010';
  for (let i = 0; i < 3; i++) {
    const lx = x + 3 + i * 3;
    ctx.fillRect(lx - 3, y + Math.round(h * 0.5) - bob, 3, 2);
    ctx.fillRect(lx + w - 5, y + Math.round(h * 0.5) - bob, 3, 2);
  }
  // Main body (cephalothorax)
  ctx.fillStyle = '#4a2818';
  ctx.fillRect(x + 2, y + Math.round(h * 0.25) - bob, Math.round(w * 0.55), Math.round(h * 0.5));
  // Segmented tail curving upward
  ctx.fillStyle = '#3a2010';
  const tailBase = facingLeft ? x + 2 : x + Math.round(w * 0.55);
  ctx.fillRect(tailBase, y + Math.round(h * 0.15) - bob, Math.round(w * 0.28), Math.round(h * 0.25));
  ctx.fillRect(tailBase + (facingLeft ? -3 : Math.round(w * 0.2)), y + 1 - bob, Math.round(w * 0.22), Math.round(h * 0.2));
  // Stinger tip
  ctx.fillStyle = '#cc4400';
  ctx.fillRect(tailBase + (facingLeft ? -4 : Math.round(w * 0.38)), y - 1 - bob, 3, 3);
  // Claws (pincers)
  ctx.fillStyle = '#4a2818';
  const clawX = facingLeft ? x + Math.round(w * 0.45) : x + 1;
  ctx.fillRect(clawX, y + Math.round(h * 0.28) - bob, 4, 3);
  ctx.fillRect(clawX + (facingLeft ? 3 : -2), y + Math.round(h * 0.2) - bob, 3, 2);
  ctx.fillRect(clawX + (facingLeft ? 3 : -2), y + Math.round(h * 0.34) - bob, 3, 2);
  // Eyes (two small dots)
  ctx.fillStyle = '#880000';
  ctx.fillRect(x + Math.round(w * 0.35), y + Math.round(h * 0.28) - bob, 2, 2);
}

function _drawRabbit(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Hind legs (powerful, large)
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(x + 1 - legBob, y + h - 5, 4, 5);
  ctx.fillRect(x + w - 5 + legBob, y + h - 5, 4, 5);
  // Body — rounded
  ctx.fillStyle = '#d4b898';
  ctx.fillRect(x + 1, y + 3 - bob, w - 2, h - 6);
  ctx.fillStyle = '#e8d0b8';
  ctx.fillRect(x + 3, y + 4 - bob, w - 6, h - 9);
  // Cotton tail
  const tailX = facingLeft ? x + w - 4 : x;
  ctx.fillStyle = '#f4f0ec';
  ctx.fillRect(tailX, y + h - 8 - bob, 4, 4);
  // Head
  const headX = facingLeft ? x - 2 : x + w - 7;
  ctx.fillStyle = '#d4b898';
  ctx.fillRect(headX, y + 1 - bob, 7, 6);
  // Long ears
  ctx.fillRect(headX + (facingLeft ? 3 : 1), y - 6 - bob, 2, 7);
  ctx.fillRect(headX + (facingLeft ? 1 : 3), y - 5 - bob, 2, 6);
  ctx.fillStyle = '#f0a0a0';
  ctx.fillRect(headX + (facingLeft ? 4 : 2), y - 5 - bob, 1, 5);
  ctx.fillRect(headX + (facingLeft ? 2 : 4), y - 4 - bob, 1, 4);
  // Nose + eye
  ctx.fillStyle = '#cc8080';
  ctx.fillRect(facingLeft ? headX - 1 : headX + 6, y + 4 - bob, 2, 2);
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 4 : 1), y + 2 - bob, 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(headX + (facingLeft ? 5 : 1), y + 2 - bob, 1, 1);
}

function _drawBoar(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Short thick legs
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x + 2 - legBob, y + h - 6, 5, 6);
  ctx.fillRect(x + w - 7 + legBob, y + h - 6, 5, 6);
  ctx.fillRect(x + 6 + legBob, y + h - 5, 4, 5);
  ctx.fillRect(x + w - 10 - legBob, y + h - 5, 4, 5);
  // Massive body — barrel-shaped
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(x + 1, y + Math.round(h * 0.22) - bob, w - 2, Math.round(h * 0.6));
  // Bristly dark back ridge
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(x + 2, y + Math.round(h * 0.22) - bob, w - 4, 4);
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 3 + i * Math.round((w-8)/5), y + Math.round(h * 0.16) - bob, 2, 5);
  }
  // Belly — lighter
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x + 4, y + Math.round(h * 0.5) - bob, w - 8, Math.round(h * 0.25));
  // Neck / shoulder hump
  ctx.fillStyle = '#6a4028';
  const humpX = facingLeft ? x + w - 10 : x + 2;
  ctx.fillRect(humpX, y + Math.round(h * 0.1) - bob, 8, Math.round(h * 0.22));
  // Head — low-slung, heavy
  const headX = facingLeft ? x + w - 12 : x - 2;
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(headX, y + Math.round(h * 0.3) - bob, 12, 9);
  // Long snout
  ctx.fillStyle = '#6a4028';
  ctx.fillRect(facingLeft ? headX - 4 : headX + 10, y + Math.round(h * 0.36) - bob, 5, 5);
  ctx.fillStyle = '#4a2818';
  ctx.fillRect(facingLeft ? headX - 3 : headX + 11, y + Math.round(h * 0.38) - bob, 2, 2);
  // Tusks
  ctx.fillStyle = '#e8e0b8';
  ctx.fillRect(facingLeft ? headX - 5 : headX + 11, y + Math.round(h * 0.48) - bob, 5, 2);
  // Small eye
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 8 : 2), y + Math.round(h * 0.32) - bob, 2, 2);
  ctx.fillStyle = '#cc4400';
  ctx.fillRect(headX + (facingLeft ? 9 : 2), y + Math.round(h * 0.32) - bob, 1, 1);
}

function _drawSnake(ctx, x, y, w, h, bob, facingLeft) {
  // Sinuous body — use segments with slight vertical offset for S-shape feel
  const bx  = facingLeft ? x + w - 2 : x;
  const dir = facingLeft ? -1 : 1;
  const segW = Math.round(w / 5);
  // Tail segment (thinner)
  ctx.fillStyle = '#2a5a18';
  ctx.fillRect(bx + dir * Math.round(w * 0.72), y + 3 - bob, segW - 1, h - 5);
  // Mid body segments
  ctx.fillStyle = '#3a7a20';
  ctx.fillRect(bx + dir * Math.round(w * 0.44), y + 1 - bob, segW + 1, h - 2);
  ctx.fillRect(bx + dir * Math.round(w * 0.22), y + 2 - bob, segW, h - 3);
  // Scale pattern on mid
  ctx.fillStyle = '#2a5a18';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(bx + dir * (Math.round(w * 0.24) + i * 3), y + 3 - bob, 2, 2);
  }
  // Head — wider, triangular look
  ctx.fillStyle = '#3a7a20';
  ctx.fillRect(facingLeft ? x - 2 : x + w - 8, y + 1 - bob, 9, h - 1);
  // Eyes
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(facingLeft ? x + 4 : x + w - 7, y + 2 - bob, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(facingLeft ? x + 5 : x + w - 6, y + 3 - bob, 1, 2);
  // Forked tongue
  ctx.fillStyle = '#cc2020';
  const tongueX = facingLeft ? x - 4 : x + w + 1;
  ctx.fillRect(tongueX, y + Math.round(h * 0.5) - bob, 3, 1);
  ctx.fillRect(facingLeft ? tongueX - 1 : tongueX + 2, y + Math.round(h * 0.5) - 1 - bob, 1, 1);
  ctx.fillRect(facingLeft ? tongueX - 1 : tongueX + 2, y + Math.round(h * 0.5) + 1 - bob, 1, 1);
}

function _drawCoyote(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Lean legs
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(x + 2 - legBob, y + h - 6, 3, 6);
  ctx.fillRect(x + w - 5 + legBob, y + h - 6, 3, 6);
  ctx.fillRect(x + 5 + legBob, y + h - 5, 3, 5);
  ctx.fillRect(x + w - 8 - legBob, y + h - 5, 3, 5);
  // Bushy tail (lower than wolf's)
  const tailX = facingLeft ? x + w - 5 : x;
  ctx.fillStyle = '#9a7a48';
  ctx.fillRect(tailX, y + Math.round(h * 0.3) - bob, 5, Math.round(h * 0.45));
  ctx.fillStyle = '#e8e0c0';
  ctx.fillRect(tailX + 1, y + Math.round(h * 0.6) - bob, 3, Math.round(h * 0.18));
  // Body — lean, sandy coloured
  ctx.fillStyle = '#b8905a';
  ctx.fillRect(x + 2, y + Math.round(h * 0.28) - bob, w - 4, Math.round(h * 0.48));
  ctx.fillStyle = '#9a7848';
  ctx.fillRect(x + 3, y + Math.round(h * 0.3) - bob, w - 6, Math.round(h * 0.2));
  // Pale belly
  ctx.fillStyle = '#e8d8b0';
  ctx.fillRect(x + 5, y + Math.round(h * 0.46) - bob, w - 10, Math.round(h * 0.25));
  // Neck
  const neckX = facingLeft ? x + w - 8 : x + 2;
  ctx.fillStyle = '#b8905a';
  ctx.fillRect(neckX, y + Math.round(h * 0.18) - bob, 6, Math.round(h * 0.2));
  // Head — narrow, pointed
  const headX = facingLeft ? x + w - 11 : x - 1;
  ctx.fillStyle = '#b8905a';
  ctx.fillRect(headX, y + 2 - bob, 10, 8);
  // Large pointed ears (bigger than wolf's)
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(headX + (facingLeft ? 6 : 1), y - 5 - bob, 4, 7);
  ctx.fillRect(headX + (facingLeft ? 1 : 5), y - 4 - bob, 4, 6);
  ctx.fillStyle = '#ffbbaa';
  ctx.fillRect(headX + (facingLeft ? 7 : 2), y - 4 - bob, 2, 5);
  ctx.fillRect(headX + (facingLeft ? 2 : 6), y - 3 - bob, 2, 4);
  // Long narrow snout
  ctx.fillStyle = '#9a7848';
  ctx.fillRect(facingLeft ? headX - 5 : headX + 9, y + 5 - bob, 6, 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(facingLeft ? headX - 3 : headX + 10, y + 5 - bob, 3, 2);
  // Eyes (amber)
  ctx.fillStyle = '#d4a820';
  ctx.fillRect(headX + (facingLeft ? 6 : 2), y + 3 - bob, 2, 2);
  ctx.fillStyle = '#111';
  ctx.fillRect(headX + (facingLeft ? 7 : 2), y + 3 - bob, 1, 1);
}

function _drawCaveRat(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Body — hunched brown rat
  ctx.fillStyle = '#6b4a28';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.55-bob, w*.42, h*.3, 0.1, 0, Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle = '#7a5530';
  ctx.beginPath(); ctx.ellipse(x+(facingLeft?w*.25:w*.75), y+h*.38-bob, w*.22, h*.22, 0, 0, Math.PI*2); ctx.fill();
  // Ears
  ctx.fillStyle = '#c07060';
  const ex = facingLeft ? x+w*.18 : x+w*.82;
  ctx.beginPath(); ctx.ellipse(ex, y+h*.22-bob, w*.08, h*.12, 0, 0, Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#e04020';
  ctx.beginPath(); ctx.arc(x+(facingLeft?w*.3:w*.7), y+h*.34-bob, 2, 0, Math.PI*2); ctx.fill();
  // Tail
  ctx.strokeStyle = '#8a6038'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x+(facingLeft?w*.8:w*.2), y+h*.6-bob);
  ctx.bezierCurveTo(x+(facingLeft?w*.9:w*.1), y+h*.55-bob, x+(facingLeft?w*.95:w*.05), y+h*.7-bob, x+(facingLeft?w*.85:w*.15), y+h*.8-bob);
  ctx.stroke();
  // Legs
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(x+w*.3-legBob, y+h*.7-bob, w*.1, h*.3);
  ctx.fillRect(x+w*.6+legBob, y+h*.7-bob, w*.1, h*.3);
}

function _drawCaveBat(ctx, x, y, w, h, bob, _facingLeft) {
  // Wings (animated based on bob)
  const wingSpread = 0.3 + bob * 0.4;
  ctx.fillStyle = '#3a2050';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(x+w*.5, y+h*.5-bob);
  ctx.bezierCurveTo(x+w*.1, y+h*(0.3-wingSpread)-bob, x, y+h*.7-bob, x+w*.3, y+h*.65-bob);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(x+w*.5, y+h*.5-bob);
  ctx.bezierCurveTo(x+w*.9, y+h*(0.3-wingSpread)-bob, x+w, y+h*.7-bob, x+w*.7, y+h*.65-bob);
  ctx.fill();
  // Body
  ctx.fillStyle = '#2a1838';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.55-bob, w*.18, h*.25, 0, 0, Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle = '#3a2048';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.3-bob, w*.16, h*.18, 0, 0, Math.PI*2); ctx.fill();
  // Ears
  ctx.fillStyle = '#5a3068';
  ctx.beginPath(); ctx.moveTo(x+w*.38, y+h*.22-bob); ctx.lineTo(x+w*.3, y+h*.05-bob); ctx.lineTo(x+w*.45, y+h*.18-bob); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+w*.62, y+h*.22-bob); ctx.lineTo(x+w*.7, y+h*.05-bob); ctx.lineTo(x+w*.55, y+h*.18-bob); ctx.fill();
  // Eyes
  ctx.fillStyle = '#ff4040';
  ctx.beginPath(); ctx.arc(x+w*.43, y+h*.29-bob, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.57, y+h*.29-bob, 2, 0, Math.PI*2); ctx.fill();
}

function _drawGiantSpider(ctx, x, y, w, h, bob, _facingLeft) {
  const cx2 = x+w*.5, cy2 = y+h*.5-bob;
  // Legs (4 pairs)
  ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1;
    const angle = (i%2 === 0 ? -0.5 : 0.3) * (side < 0 ? -1 : 1);
    ctx.beginPath();
    ctx.moveTo(cx2 + side*w*.2, cy2);
    ctx.lineTo(cx2 + side*w*.55, cy2 + Math.sin(angle)*h*.4-bob*0.5);
    ctx.lineTo(cx2 + side*w*.8, cy2 + Math.sin(angle+0.4)*h*.6);
    ctx.stroke();
    // mirror pair
    const a2 = (i%2 === 0 ? 0.4 : -0.2) * (side < 0 ? -1 : 1);
    ctx.beginPath();
    ctx.moveTo(cx2 + side*w*.2, cy2+h*.1);
    ctx.lineTo(cx2 + side*w*.5, cy2 + Math.sin(a2)*h*.35+h*.2);
    ctx.lineTo(cx2 + side*w*.75, cy2 + h*.5);
    ctx.stroke();
  }
  // Abdomen
  ctx.fillStyle = '#1a1008';
  ctx.beginPath(); ctx.ellipse(cx2, cy2+h*.1, w*.28, h*.28, 0, 0, Math.PI*2); ctx.fill();
  // Abdomen markings
  ctx.fillStyle = '#d05010';
  ctx.beginPath(); ctx.ellipse(cx2, cy2+h*.1, w*.12, h*.14, 0, 0, Math.PI*2); ctx.fill();
  // Cephalothorax (head+thorax)
  ctx.fillStyle = '#2a1808';
  ctx.beginPath(); ctx.ellipse(cx2, cy2-h*.1, w*.22, h*.2, 0, 0, Math.PI*2); ctx.fill();
  // Eyes (6 small red dots)
  ctx.fillStyle = '#e04010';
  for (let i = -2; i <= 2; i += 2) {
    ctx.beginPath(); ctx.arc(cx2+i*w*.06, cy2-h*.16, 2, 0, Math.PI*2); ctx.fill();
  }
  // Fangs
  ctx.fillStyle = '#e8e0a0';
  ctx.fillRect(cx2-w*.08, cy2-h*.03, w*.05, h*.08);
  ctx.fillRect(cx2+w*.03, cy2-h*.03, w*.05, h*.08);
}

function _drawSkeleton(ctx, x, y, w, h, bob, legBob, _facingLeft) {
  const bone = '#d4c89a', joint = '#c8b888', dark = '#4a3a18';
  // Legs
  ctx.fillStyle = bone;
  ctx.fillRect(x+w*.3-legBob, y+h*.6-bob, w*.12, h*.4);
  ctx.fillRect(x+w*.58+legBob, y+h*.6-bob, w*.12, h*.4);
  ctx.fillStyle = joint;
  ctx.beginPath(); ctx.arc(x+w*.36, y+h*.6-bob, w*.08, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.64, y+h*.6-bob, w*.08, 0, Math.PI*2); ctx.fill();
  // Ribcage
  ctx.fillStyle = bone;
  ctx.fillRect(x+w*.28, y+h*.3-bob, w*.44, h*.32);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = dark;
    ctx.fillRect(x+w*.32, y+h*.32-bob+i*h*.07, w*.36, h*.025);
  }
  // Arms
  ctx.fillStyle = bone;
  ctx.fillRect(x+w*.1, y+h*.3-bob, w*.14, h*.35);
  ctx.fillRect(x+w*.76, y+h*.3-bob, w*.14, h*.35);
  // Skull
  ctx.fillStyle = '#e0d4a8';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.18-bob, w*.22, h*.2, 0, 0, Math.PI*2); ctx.fill();
  // Eye sockets
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(x+w*.4, y+h*.16-bob, w*.07, h*.07, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x+w*.6, y+h*.16-bob, w*.07, h*.07, 0, 0, Math.PI*2); ctx.fill();
  // Jaw
  ctx.fillStyle = bone;
  ctx.fillRect(x+w*.35, y+h*.26-bob, w*.3, h*.05);
  ctx.fillStyle = dark;
  for (let i = 0; i < 4; i++) ctx.fillRect(x+w*.37+i*w*.065, y+h*.26-bob, w*.04, h*.04);
}

function _drawCaveTroll(ctx, x, y, w, h, bob, legBob, _facingLeft) {
  // Huge muscular troll
  ctx.fillStyle = '#4a6038';
  // Legs
  ctx.fillRect(x+w*.2-legBob, y+h*.6-bob, w*.22, h*.4);
  ctx.fillRect(x+w*.58+legBob, y+h*.6-bob, w*.22, h*.4);
  // Body
  ctx.fillRect(x+w*.1, y+h*.25-bob, w*.8, h*.4);
  ctx.fillStyle = '#5a7048';
  ctx.fillRect(x+w*.15, y+h*.28-bob, w*.7, h*.2);
  // Arms (huge)
  ctx.fillStyle = '#4a6038';
  ctx.fillRect(x-w*.05, y+h*.2-bob, w*.22, h*.5);
  ctx.fillRect(x+w*.83, y+h*.2-bob, w*.22, h*.5);
  // Fists
  ctx.fillStyle = '#3a5028';
  ctx.beginPath(); ctx.arc(x+w*.06, y+h*.68-bob, w*.12, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.94, y+h*.68-bob, w*.12, 0, Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle = '#4a6038';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.12-bob, w*.32, h*.2, 0, 0, Math.PI*2); ctx.fill();
  // Face
  ctx.fillStyle = '#e06030';
  ctx.beginPath(); ctx.arc(x+w*.38, y+h*.1-bob, w*.07, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.62, y+h*.1-bob, w*.07, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#d04020';
  ctx.fillRect(x+w*.35, y+h*.18-bob, w*.3, h*.04);
  // Tusks
  ctx.fillStyle = '#f0e0a0';
  ctx.fillRect(x+w*.36, y+h*.2-bob, w*.06, h*.1);
  ctx.fillRect(x+w*.58, y+h*.2-bob, w*.06, h*.1);
}

function _drawStoneGolem(ctx, x, y, w, h, bob, _facingLeft) {
  const stone = '#6a7278', dark = '#404850';
  // Legs (thick stone pillars)
  ctx.fillStyle = stone;
  ctx.fillRect(x+w*.2, y+h*.58-bob, w*.22, h*.42);
  ctx.fillRect(x+w*.58, y+h*.58-bob, w*.22, h*.42);
  // Body (boulder)
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.38-bob, w*.4, h*.32, 0, 0, Math.PI*2); ctx.fill();
  // Cracks
  ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x+w*.3, y+h*.25-bob); ctx.lineTo(x+w*.45, y+h*.45-bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+w*.65, y+h*.3-bob); ctx.lineTo(x+w*.55, y+h*.5-bob); ctx.stroke();
  // Arms (large stone blocks)
  ctx.fillStyle = stone;
  ctx.fillRect(x-w*.02, y+h*.22-bob, w*.2, h*.45);
  ctx.fillRect(x+w*.82, y+h*.22-bob, w*.2, h*.45);
  // Head (rough boulder)
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.1-bob, w*.25, h*.2, 0, 0, Math.PI*2); ctx.fill();
  // Glowing eyes
  ctx.fillStyle = '#60a030';
  ctx.beginPath(); ctx.arc(x+w*.41, y+h*.08-bob, w*.06, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.59, y+h*.08-bob, w*.06, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#a0ff60';
  ctx.beginPath(); ctx.arc(x+w*.41, y+h*.08-bob, w*.03, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*.59, y+h*.08-bob, w*.03, 0, Math.PI*2); ctx.fill();
}

function _drawUndeadWarrior(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Decayed armour — dark metal with bone showing
  ctx.fillStyle = '#2a2a38';
  // Legs in armour
  ctx.fillRect(x+w*.25-legBob, y+h*.58-bob, w*.18, h*.42);
  ctx.fillRect(x+w*.57+legBob, y+h*.58-bob, w*.18, h*.42);
  // Armoured body
  ctx.fillRect(x+w*.18, y+h*.28-bob, w*.64, h*.34);
  ctx.fillStyle = '#3a3a50';
  ctx.fillRect(x+w*.22, y+h*.3-bob, w*.56, h*.18);
  // Arms
  ctx.fillStyle = '#2a2a38';
  ctx.fillRect(x+w*.05, y+h*.28-bob, w*.16, h*.38);
  ctx.fillRect(x+w*.79, y+h*.28-bob, w*.16, h*.38);
  // Skull head with helmet
  ctx.fillStyle = '#3a3a50';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.17-bob, w*.24, h*.2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#d4c89a';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.18-bob, w*.18, h*.16, 0, 0, Math.PI*2); ctx.fill();
  // Dark eye sockets glowing purple
  ctx.fillStyle = '#6020a0';
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.56:.44), y+h*.16-bob, w*.05, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.44:.56), y+h*.16-bob, w*.05, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#c060ff';
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.56:.44), y+h*.16-bob, w*.025, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.44:.56), y+h*.16-bob, w*.025, 0, Math.PI*2); ctx.fill();
  // Sword hint
  const sx2 = facingLeft ? x-w*.06 : x+w*.82;
  ctx.fillStyle = '#808090';
  ctx.fillRect(sx2, y+h*.3-bob, w*.08, h*.5);
}

function _drawDragonWhelp(ctx, x, y, w, h, bob, legBob, facingLeft) {
  // Young dragon — emerald green, small wings
  const body = '#1a5a1a', light = '#2a8a2a';
  // Tail
  ctx.strokeStyle = body; ctx.lineWidth = w*.14;
  ctx.beginPath();
  ctx.moveTo(x+w*(facingLeft?.65:.35), y+h*.65-bob);
  ctx.bezierCurveTo(x+w*(facingLeft?.85:.15), y+h*.7-bob, x+w*(facingLeft?.95:.05), y+h*.5-bob, x+w*(facingLeft?.9:.1), y+h*.38-bob);
  ctx.stroke();
  // Hind legs
  ctx.fillStyle = body;
  ctx.fillRect(x+w*.28-legBob, y+h*.62-bob, w*.16, h*.38);
  ctx.fillRect(x+w*.56+legBob, y+h*.62-bob, w*.16, h*.38);
  // Body
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.45-bob, w*.36, h*.3, 0, 0, Math.PI*2); ctx.fill();
  // Belly (lighter)
  ctx.fillStyle = '#2a7030';
  ctx.beginPath(); ctx.ellipse(x+w*.5, y+h*.5-bob, w*.22, h*.2, 0, 0, Math.PI*2); ctx.fill();
  // Wings (small, folded)
  ctx.fillStyle = '#0e2a0e';
  ctx.beginPath();
  ctx.moveTo(x+w*.45, y+h*.28-bob);
  ctx.bezierCurveTo(x+w*.2, y+h*.1-bob, x+w*.05, y+h*.35-bob, x+w*.3, y+h*.4-bob);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x+w*.55, y+h*.28-bob);
  ctx.bezierCurveTo(x+w*.8, y+h*.1-bob, x+w*.95, y+h*.35-bob, x+w*.7, y+h*.4-bob);
  ctx.fill();
  // Neck + Head
  ctx.fillStyle = body;
  ctx.fillRect(x+w*(facingLeft?.35:.42), y+h*.12-bob, w*.2, h*.22);
  ctx.beginPath(); ctx.ellipse(x+w*(facingLeft?.3:.7), y+h*.1-bob, w*.22, h*.16, facingLeft?.3:-.3, 0, Math.PI*2); ctx.fill();
  // Spines on head
  ctx.fillStyle = light;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x+w*(facingLeft?.18+i*.08:.82-i*.08), y+h*.06-bob); ctx.lineTo(x+w*(facingLeft?.22+i*.08:.78-i*.08), y-h*.04-bob); ctx.lineTo(x+w*(facingLeft?.26+i*.08:.74-i*.08), y+h*.06-bob); ctx.fill();
  }
  // Eyes (amber)
  ctx.fillStyle = '#d0a010';
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.22:.78), y+h*.07-bob, w*.05, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#201008';
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.22:.78), y+h*.07-bob, w*.025, 0, Math.PI*2); ctx.fill();
  // Nostrils with fire glow
  ctx.fillStyle = '#ff6010';
  ctx.beginPath(); ctx.arc(x+w*(facingLeft?.12:.88), y+h*.11-bob, w*.03, 0, Math.PI*2); ctx.fill();
}

function _drawGuard(ctx, x, y, w, h, bob, legBob, facingLeft) {
  const mx = facingLeft ? -1 : 1;
  const cx = x + w / 2;

  // Legs — steel greaves
  ctx.fillStyle = '#7890a8';
  ctx.fillRect(cx - w * 0.28 - legBob * mx, y + h * 0.62 - bob, w * 0.22, h * 0.38);
  ctx.fillRect(cx + w * 0.06 + legBob * mx, y + h * 0.62 - bob, w * 0.22, h * 0.38);
  // Boot soles
  ctx.fillStyle = '#282830';
  ctx.fillRect(cx - w * 0.28 - legBob * mx, y + h - 3, w * 0.22, 3);
  ctx.fillRect(cx + w * 0.06 + legBob * mx, y + h - 3, w * 0.22, 3);

  // Tabard (royal blue surcoat over armour)
  ctx.fillStyle = '#1a3a8a';
  ctx.fillRect(cx - w * 0.30, y + h * 0.30 - bob, w * 0.60, h * 0.40);
  // Surcoat cross emblem
  ctx.fillStyle = '#d4aa00';
  ctx.fillRect(cx - w * 0.04, y + h * 0.33 - bob, w * 0.08, h * 0.22); // vertical
  ctx.fillRect(cx - w * 0.13, y + h * 0.38 - bob, w * 0.26, h * 0.07); // horizontal

  // Chainmail body (under tabard, visible at sides)
  ctx.fillStyle = '#8898a8';
  ctx.fillRect(cx - w * 0.36, y + h * 0.30 - bob, w * 0.10, h * 0.35);
  ctx.fillRect(cx + w * 0.26, y + h * 0.30 - bob, w * 0.10, h * 0.35);

  // Pauldrons (shoulder armour)
  ctx.fillStyle = '#6880a0';
  ctx.fillRect(cx - w * 0.42, y + h * 0.22 - bob, w * 0.18, h * 0.14);
  ctx.fillRect(cx + w * 0.24, y + h * 0.22 - bob, w * 0.18, h * 0.14);
  ctx.fillStyle = '#8aa0c0'; // pauldron shine
  ctx.fillRect(cx - w * 0.42, y + h * 0.22 - bob, w * 0.18, h * 0.04);
  ctx.fillRect(cx + w * 0.24, y + h * 0.22 - bob, w * 0.18, h * 0.04);

  // Spear (held in right hand — opposite of facingLeft)
  const spearX = facingLeft ? cx - w * 0.48 : cx + w * 0.38;
  ctx.fillStyle = '#6a4818'; // shaft
  ctx.fillRect(spearX, y - h * 0.35 - bob, w * 0.07, h * 1.30);
  ctx.fillStyle = '#c0c8d0'; // spearhead
  ctx.beginPath();
  ctx.moveTo(spearX + w * 0.035, y - h * 0.35 - bob);
  ctx.lineTo(spearX, y - h * 0.10 - bob);
  ctx.lineTo(spearX + w * 0.07, y - h * 0.10 - bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // blade sheen
  ctx.fillRect(spearX + w * 0.010, y - h * 0.32 - bob, w * 0.020, h * 0.18);

  // Head (skin)
  ctx.fillStyle = '#e8b87a';
  ctx.beginPath(); ctx.arc(cx, y + h * 0.14 - bob, w * 0.22, 0, Math.PI * 2); ctx.fill();
  // Neck
  ctx.fillStyle = '#d4a060';
  ctx.fillRect(cx - w * 0.10, y + h * 0.28 - bob, w * 0.20, h * 0.08);

  // Helmet — full steel bucket helm with visor
  ctx.fillStyle = '#7890a8';
  ctx.beginPath(); ctx.arc(cx, y + h * 0.10 - bob, w * 0.24, Math.PI, 0); ctx.fill(); // dome
  ctx.fillRect(cx - w * 0.24, y + h * 0.10 - bob, w * 0.48, h * 0.10); // brim
  // Visor slot
  ctx.fillStyle = '#282830';
  ctx.fillRect(cx - w * 0.14, y + h * 0.12 - bob, w * 0.28, h * 0.05);
  // Helmet cheek guards
  ctx.fillStyle = '#6880a0';
  ctx.fillRect(cx - w * 0.24, y + h * 0.10 - bob, w * 0.08, h * 0.10);
  ctx.fillRect(cx + w * 0.16, y + h * 0.10 - bob, w * 0.08, h * 0.10);
  // Helmet crest (plume)
  ctx.fillStyle = '#c02020';
  ctx.fillRect(cx - w * 0.04, y - h * 0.02 - bob, w * 0.08, h * 0.12);
  ctx.fillStyle = '#e03030';
  ctx.fillRect(cx - w * 0.02, y - h * 0.02 - bob, w * 0.04, h * 0.10);
}

/* ── MobManager ─────────────────────────────────────── */

export class MobManager {
  constructor(world) {
    this.mobs = [];
    this.spawnTopUpTimer = 0;
    this.desiredCounts = this._buildDesiredCounts(world);
    // Use a seeded RNG for the initial fill so spawn positions are identical
    // on every page load (same world seed → same mob positions).
    const rng = makeRng(MOB_SEED);
    this._spawnMissing(world, Infinity, rng);
    this._spawnKingdomGuards();
  }

  /** Place guards at fixed positions throughout the kingdom marketplace. */
  _spawnKingdomGuards() {
    // Kingdom centre: cx=512, cy=208.  Marketplace rows 200–237, cols 479–544.
    const guardSpawns = [
      // Flanking the entrance (south path)
      [509, 231], [515, 231],
      // Mid-marketplace, west and east of central path
      [499, 213], [526, 213],
      [499, 222], [526, 222],
      // Near west and east building rows
      [487, 208], [540, 208],
    ];
    for (const [col, row] of guardSpawns) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      this.mobs.push(new Mob('guard', x, y));
    }
  }

  _buildDesiredCounts(world) {
    const area = world.cols * world.rows;

    const byArea = (tilesPerMob, min, max = Infinity) =>
      Math.max(min, Math.min(max, Math.round(area / tilesPerMob)));

    return {
      // Passive mobs
      chicken: byArea(18000, 12, 90),
      cow:     byArea(30000,  6, 50),
      sheep:   byArea(22000,  8, 70),

      // Aggressive mobs
      goblin:  byArea(26000,  8, 60),
      orc:     byArea(50000,  5, 30),
      troll:   byArea(90000,  3, 18),
      demon:   byArea(140000, 2, 10),

      // Wildlife — rare, biome-specific
      frog:       byArea(90000,  2,  10),
      deer:       byArea(38000,  4,  22),
      fox:        byArea(100000, 2,   8),
      wolf:       byArea(58000,  3,  16),
      bear:       byArea(160000, 1,   6),
      polar_bear: byArea(200000, 1,   4),
      alligator:  byArea(260000, 1,   4),
      scorpion:   byArea(70000,  2,  12),
      rabbit:     byArea(18000,  8,  50),
      boar:       byArea(80000,  2,  12),
      snake:      byArea(88000,  2,  10),
      coyote:     byArea(52000,  3,  16),
    };
  }

  _currentCounts() {
    const counts = {};
    for (const mob of this.mobs) {
      counts[mob.type] = (counts[mob.type] || 0) + 1;
    }
    return counts;
  }

  _trySpawnOne(world, type, rng = Math.random) {
    const def = MOB_DEFS[type];
    const { w, h } = def;

    let attempts = 0;
    const maxAttempts = 3000;

    while (attempts < maxAttempts) {
      attempts++;

      const col = 5 + Math.floor(rng() * (world.cols - 10));
      const row = 5 + Math.floor(rng() * (world.rows - 10));
      const tile = world.getTile(col, row);
      const biome = getBiome(col, row);

      if (!def.biomes.includes(biome)) continue;

      const walkable = (
        tile === TILES.GRASS ||
        tile === TILES.DARK_GRASS ||
        tile === TILES.DIRT ||
        tile === TILES.SNOW ||
        tile === TILES.DEAD_GRASS ||
        tile === TILES.SAND ||
        tile === TILES.SAND_DARK
      );
      if (!walkable) continue;

      // Frogs must spawn adjacent to water
      if (def.nearWater) {
        const waterSet = new Set([TILES.WATER, TILES.SWAMP_WATER]);
        const adj = [
          world.getTile(col - 1, row), world.getTile(col + 1, row),
          world.getTile(col, row - 1), world.getTile(col, row + 1),
        ];
        if (!adj.some(t => waterSet.has(t))) continue;
      }

      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (!world.isBlocked(x, y, w, h)) {
        this.mobs.push(new Mob(type, x, y));
        return true;
      }
    }

    return false;
  }

  _spawnMissing(world, maxToSpawn = 8, rng = Math.random) {
    const counts = this._currentCounts();
    let spawned = 0;

    for (const [type, desired] of Object.entries(this.desiredCounts)) {
      let missing = desired - (counts[type] || 0);

      while (missing > 0 && spawned < maxToSpawn) {
        const ok = this._trySpawnOne(world, type, rng);
        if (!ok) break;

        missing--;
        spawned++;
      }

      if (spawned >= maxToSpawn) break;
    }
  }

  update(dt, world, player) {
    for (const mob of this.mobs) {
      if (mob.dead) {
        mob.respawnTimer -= dt;
        if (mob.respawnTimer <= 0) {
          mob.hp           = mob.maxHp;
          mob.dead         = false;
          mob.col          = mob.spawnCol;
          mob.row          = mob.spawnRow;
          mob.x            = mob.spawnX;
          mob.y            = mob.spawnY;
          mob.targetX      = null;
          mob.targetY      = null;
          mob.inCombat     = false;
          mob.combatTarget = null;
          mob.isPlayerTarget = false;
          mob.state        = 'idle';
          mob.wanderTimer  = 1 + Math.random() * 3;
        }
      } else {
        mob.update(dt, world, player, this.mobs);
      }
    }

    // In case initial spawning couldn't hit desired population,
    // keep trying to top up gently over time.
    this.spawnTopUpTimer -= dt;
    if (this.spawnTopUpTimer <= 0) {
      this.spawnTopUpTimer = 3;
      this._spawnMissing(world, 4);
    }
  }

  /** Returns the mob under the given world coordinates, or null. */
  getMobAt(worldX, worldY) {
    for (const mob of this.mobs) {
      if (mob.dead) continue;
      if (
        worldX >= mob.x && worldX <= mob.x + mob.w &&
        worldY >= mob.y && worldY <= mob.y + mob.h
      ) {
        return mob;
      }
    }
    return null;
  }
}
