/**
 * raidInstance.js — Active raid state machine + arena world.
 *
 * RaidArenaMap  — small tile grid used as the world while raiding.
 *                 Implements the same getTile / isSolid / isBlocked API as
 *                 World and InteriorMap so the renderer and player movement
 *                 work without modification.
 *
 * RaidInstance  — owns the arena, the active mob list, and all run stats.
 *                 Lifecycle:
 *                   new RaidInstance(def, diff, skills, diffIdx)
 *                   → startFloor()          — spawn enemies for floor 0
 *                   → update(dt, player)    — called every game frame
 *                   → advanceFloor()        — called when floorCleared is true
 *                   → .complete === true    — loot + XP already awarded
 */

import { TILES, TILE_SIZE, SOLID_TILES } from './constants.js';
import { Mob } from './mobs.js';
import { RAID_XP, calcScore, getRank, rollLoot } from './raids.js';

// ── Arena dimensions ──────────────────────────────────────────────────────────
const COLS = 24;
const ROWS = 18;

// ── RaidArenaMap ─────────────────────────────────────────────────────────────
export class RaidArenaMap {
  constructor() {
    this.id   = 'raid_arena';
    this.name = '';      // set by RaidInstance before the transition
    this.cols = COLS;
    this.rows = ROWS;

    // Fill everything with WALL, then carve out a stone floor interior.
    this._tiles = new Uint8Array(COLS * ROWS).fill(TILES.WALL);
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        this._tiles[r * COLS + c] = TILES.STONE;
      }
    }

    // Entry position — player appears here when the raid begins.
    this.entryCol = Math.floor(COLS / 2);
    this.entryRow = ROWS - 3;

    this.changedTiles = [];
    this.dirty        = false;
  }

  getTile(c, r) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return TILES.WALL;
    return this._tiles[r * COLS + c];
  }

  isSolid(c, r) { return SOLID_TILES.has(this.getTile(c, r)); }

  setTile(c, r, tile) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    this._tiles[r * COLS + c] = tile;
  }

  /** Pixel-level collision check — mirrors World.isBlocked(). */
  isBlocked(x, y, w, h) {
    const l = Math.floor(x / TILE_SIZE);
    const t = Math.floor(y / TILE_SIZE);
    const r = Math.floor((x + w - 1) / TILE_SIZE);
    const b = Math.floor((y + h - 1) / TILE_SIZE);
    for (let row = t; row <= b; row++) {
      for (let col = l; col <= r; col++) {
        if (this.isSolid(col, row)) return true;
      }
    }
    return false;
  }

  // Stub — InteriorMap compat; renderer calls this for furniture rotation.
  getRotation() { return 0; }
}

// ── RaidInstance ──────────────────────────────────────────────────────────────
export class RaidInstance {
  /**
   * @param {object} raidDef       — entry from RAID_DEFS
   * @param {object} difficultyDef — entry from RAID_DIFFICULTIES
   * @param {Skills} skills
   * @param {number} difficultyIndex  0–4 (index into RAID_DIFFICULTIES)
   */
  constructor(raidDef, difficultyDef, skills, difficultyIndex) {
    this.raidDef   = raidDef;
    this.diff      = difficultyDef;
    this.diffIndex = difficultyIndex;
    this.skills    = skills;

    this.arenaMap        = new RaidArenaMap();
    this.arenaMap.name   = `${raidDef.name} — ${difficultyDef.name}`;

    // Exposed as { mobs: [] } so Game can swap combat.mobManager to this object.
    this.mobContainer    = { mobs: [] };

    // ── Progression ───────────────────────────────────────────────────────
    this.currentFloorIdx = 0;
    this.floorsCleared   = 0;
    this.totalFloors     = raidDef.floors.length;
    this.complete        = false;
    this.failed          = false;
    // True while waiting for the advance-floor delay timer.
    this._floorAdvancing     = false;
    this._floorAdvanceTimer  = 0;

    // ── Scoring stats ─────────────────────────────────────────────────────
    this.timer       = 0;   // total seconds inside the raid
    this.damageTaken = 0;   // cumulative HP lost by the player
    this.deaths      = 0;
    this.killCount   = 0;

    // ── Results (populated by _finishRaid) ────────────────────────────────
    this.xpEarned = 0;
    this.loot     = [];   // [{ item: ItemDef, qty }]

    this._nextMobId = 2000; // avoid clashing with world mob IDs
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get mobs() { return this.mobContainer.mobs; }

  get floorCleared() {
    return this.mobs.length > 0 && this.mobs.every(m => m.dead);
  }

  // ── Floor management ─────────────────────────────────────────────────────

  /** Spawn enemies for the current floor. */
  startFloor() {
    this.mobContainer.mobs = [];
    this._floorAdvancing   = false;
    const floorDef = this.raidDef.floors[this.currentFloorIdx];
    const d        = this.diff;

    for (const { type, count } of floorDef.mobs) {
      const n = Math.max(1, Math.ceil(count * d.countMult));
      for (let i = 0; i < n; i++) {
        this.mobContainer.mobs.push(this._spawnMob(type));
      }
    }
  }

  /** Advance one floor after a delay has elapsed. Returns true if raid is now complete. */
  advanceFloor() {
    this.floorsCleared++;
    const floorXp = Math.round(RAID_XP.PER_FLOOR * this.diff.xpMult);
    this.xpEarned += floorXp;
    this.skills.addXp(11 /* RAIDING */, floorXp);

    this.currentFloorIdx++;
    if (this.currentFloorIdx >= this.totalFloors) {
      this._finishRaid(false);
      return true;
    }

    this.startFloor();
    return false;
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  /**
   * Called once per game frame while a raid is active.
   * Updates the timer and runs mob AI using the arena world.
   * Pass the player so aggressive mobs auto-aggro when in range.
   *
   * @param {number} dt       delta-time in seconds
   * @param {Player} player   the local player object
   */
  update(dt, player) {
    if (this.complete || this.failed) return;

    this.timer += dt;

    for (const mob of this.mobs) {
      if (!mob.dead) mob.update(dt, this.arenaMap, player, this.mobs);
    }

    // Advance-floor delay: wait 1.5 s after last kill before spawning next floor
    if (this._floorAdvancing) {
      this._floorAdvanceTimer -= dt;
    }
  }

  // ── Event callbacks (called by Game) ─────────────────────────────────────

  /** Call when a mob in this raid has just died. Accumulates per-kill XP. */
  onMobKilled(mob) {
    this.killCount++;
    const xp = Math.round(mob.maxHp * RAID_XP.PER_KILL * this.diff.xpMult);
    this.xpEarned += xp;
    this.skills.addXp(11 /* RAIDING */, xp);
  }

  /** Call when the player takes damage during the raid (for scoring). */
  onPlayerDamaged(amount) {
    this.damageTaken += amount;
  }

  /** Call when the player dies in the raid. Marks failure and finishes. */
  onPlayerDeath() {
    if (this.failed || this.complete) return;
    this.deaths++;
    this.failed = true;
    this._finishRaid(true);
  }

  // ── Score / rank helpers ──────────────────────────────────────────────────

  getScore() {
    return calcScore(
      this.floorsCleared, this.totalFloors,
      this.timer, this.damageTaken, this.deaths,
      this.diff
    );
  }

  getRank() { return getRank(this.getScore()); }

  // ── Mob click helper (used by Game._handleClick) ──────────────────────────

  getMobAt(wx, wy) {
    for (const m of this.mobs) {
      if (!m.dead && wx >= m.x && wx <= m.x + m.w && wy >= m.y && wy <= m.y + m.h) {
        return m;
      }
    }
    return null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _spawnMob(type) {
    // Spawn in the upper third of the arena (rows 2–7), random column.
    const spawnRow = 2 + Math.floor(Math.random() * 6);
    const spawnCol = 2 + Math.floor(Math.random() * (COLS - 4));

    const mob    = new Mob(type, spawnCol * TILE_SIZE, spawnRow * TILE_SIZE);
    mob.id       = this._nextMobId++;

    // Scale stats by difficulty
    mob.maxHp         = Math.max(1, Math.round(mob.maxHp         * this.diff.hpMult));
    mob.hp            = mob.maxHp;
    mob.strengthLevel = Math.round(mob.strengthLevel * this.diff.damageMult);
    mob.attackLevel   = Math.round(mob.attackLevel   * this.diff.damageMult);

    // Raid mobs are always aggressive and start idle (combat.js will engage them)
    mob.aggressive = true;
    mob.state      = 'idle';

    return mob;
  }

  _finishRaid(failed) {
    if (!failed) {
      const completionXp = Math.round(RAID_XP.COMPLETION * this.diff.xpMult);
      this.xpEarned     += completionXp;
      this.skills.addXp(11 /* RAIDING */, completionXp);
    }

    // Roll loot (even partial failures get something; chance reduced by bad rank)
    const rank = this.getRank();
    this.loot  = rollLoot(
      this.raidDef.lootTable,
      this.diffIndex,
      rank.label,
      this.diff.goldMult
    );

    this.complete = true;
  }
}
