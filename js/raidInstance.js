/**
 * raidInstance.js — Active raid state machine + arena world.
 *
 * Every raid now consists of a sequence of uniquely-laid-out rooms. Each
 * room owns its own tile buffer, mob list, puzzle state, and chest, so a
 * room preserves its state when the player backtracks into it.
 *
 * RaidArenaMap  — a lightweight view that proxies to whichever room's tile
 *                 buffer is currently active. setRoom(buffer) swaps the
 *                 reference and flags every tile as changed so the renderer
 *                 rebuilds its chunk cache.
 *
 * RaidInstance  — owns all rooms and the transition logic between them.
 *                 Lifecycle:
 *                   new RaidInstance(def, diff, skills, diffIdx)
 *                   → startRoom(0)         — enter the first room
 *                   → update(dt, player)   — per-frame mob AI + room checks
 *                   → tryEnterDoor('N'|'S')— called by Game when the player
 *                                            steps on a DOOR tile. May transition.
 *                   → onChestClicked(c,r)  — resource/reward chest interaction.
 *                   → .complete === true   — loot has been rolled; summary shown.
 */

import { TILES, TILE_SIZE, SOLID_TILES } from './constants.js';
import { Mob } from './mobs.js';
import {
  RAID_XP, calcScore, getRank, rollLoot, rollResourceLoot, pickRoomType,
} from './raids.js';

// ── Arena dimensions ──────────────────────────────────────────────────────────
const COLS = 24;
const ROWS = 18;

// Door tiles — fixed on each room so transitions are predictable.
const DOOR_COL = Math.floor(COLS / 2);
const NORTH_DOOR_ROW = 0;
const SOUTH_DOOR_ROW = ROWS - 1;
const NORTH_ENTRY_ROW = 2;             // where the player appears when entering from the south (new room's south door)
const SOUTH_ENTRY_ROW = ROWS - 3;      // where the player appears when entering from the north (new room's north door)

// ── Decoration / pillar patterns ─────────────────────────────────────────────
// A pattern is a list of rectangular WALL blocks. All patterns are designed
// to leave the center column (DOOR_COL) walkable from top to bottom so the
// door paths always connect. Rooms pick one pattern on generation to give
// each room a distinct silhouette.
const DECORATION_PATTERNS = [
  // 0 — empty room
  [],
  // 1 — two side pillars
  [{ c: 5, r: 6, w: 2, h: 2 }, { c: 17, r: 6, w: 2, h: 2 }],
  // 2 — four corner pillars
  [{ c: 4, r: 3, w: 2, h: 2 }, { c: 18, r: 3, w: 2, h: 2 },
   { c: 4, r: 13, w: 2, h: 2 }, { c: 18, r: 13, w: 2, h: 2 }],
  // 3 — alleys (two side walls)
  [{ c: 8, r: 4, w: 1, h: 5 }, { c: 15, r: 9, w: 1, h: 5 }],
  // 4 — central flanking pillars (avoid door col)
  [{ c: 10, r: 8, w: 1, h: 2 }, { c: 14, r: 8, w: 1, h: 2 },
   { c: 7, r: 12, w: 1, h: 1 }, { c: 17, r: 12, w: 1, h: 1 }],
  // 5 — scattered rubble
  [{ c: 5, r: 4, w: 1, h: 1 }, { c: 18, r: 4, w: 1, h: 1 },
   { c: 7, r: 7, w: 1, h: 1 }, { c: 16, r: 7, w: 1, h: 1 },
   { c: 5, r: 12, w: 1, h: 1 }, { c: 18, r: 12, w: 1, h: 1 }],
  // 6 — zig-zag barriers
  [{ c: 3, r: 5, w: 5, h: 1 }, { c: 16, r: 8, w: 5, h: 1 },
   { c: 3, r: 11, w: 5, h: 1 }],
];

// ── Room types ────────────────────────────────────────────────────────────────
export const ROOM = {
  MOB:      'mob',
  PUZZLE:   'puzzle',
  RESOURCE: 'resource',
  BOSS:     'boss',
};

const PUZZLE_TYPES = ['plates', 'braziers', 'sequence'];

// ── RaidArenaMap ─────────────────────────────────────────────────────────────
/**
 * Single shared view onto whichever room's tile buffer is active. Player
 * movement, rendering, collision, etc. all talk to this. The tile buffer
 * reference is hot-swapped on room transition via setRoom().
 */
export class RaidArenaMap {
  constructor() {
    this.id   = 'raid_arena';
    this.name = '';
    this.cols = COLS;
    this.rows = ROWS;

    // Placeholder until the first room is installed.
    this._tiles       = new Uint8Array(COLS * ROWS).fill(TILES.WALL);
    this.changedTiles = [];
    this.dirty        = false;

    // Spawn / entry position. Set per-room by RaidInstance.setRoom().
    this.entryCol = Math.floor(COLS / 2);
    this.entryRow = SOUTH_ENTRY_ROW;
  }

  /** Swap the tile buffer to the given room's buffer. Marks every tile
   *  as changed so the renderer chunk cache rebuilds. */
  setRoomTiles(buffer) {
    this._tiles = buffer;
    this.changedTiles.length = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) this.changedTiles.push((r << 16) | c);
    }
    this.dirty = true;
  }

  getTile(c, r) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return TILES.WALL;
    return this._tiles[r * COLS + c];
  }

  isSolid(c, r) { return SOLID_TILES.has(this.getTile(c, r)); }

  setTile(c, r, tile) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    this._tiles[r * COLS + c] = tile;
    this.changedTiles.push((r << 16) | c);
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

  getRotation() { return 0; }
}

// ── RaidInstance ──────────────────────────────────────────────────────────────
export class RaidInstance {
  constructor(raidDef, difficultyDef, skills, difficultyIndex) {
    this.raidDef   = raidDef;
    this.diff      = difficultyDef;
    this.diffIndex = difficultyIndex;
    this.skills    = skills;

    this.arenaMap  = new RaidArenaMap();
    this.arenaMap.name = `${raidDef.name} — ${difficultyDef.name}`;

    // Exposed as { mobs: [] } so Game can swap combat.mobManager to this object.
    // On room transitions the .mobs reference is swapped to the new room's list.
    this.mobContainer = { mobs: [] };

    this._nextMobId = 2000;

    // Generate all rooms up-front so backtracking works.
    this.rooms          = this._generateRooms();
    this.totalRooms     = this.rooms.length;
    this.currentRoomIdx = 0;

    this.complete = false;
    this.failed   = false;

    // Scoring stats
    this.timer        = 0;
    this.damageTaken  = 0;
    this.deaths       = 0;
    this.killCount    = 0;
    this.roomsCleared = 0;

    // Results
    this.xpEarned = 0;
    this.loot     = [];

    // Door cooldown — prevents retriggering on the tile you just spawned onto.
    this._doorCooldown = 0.5;
  }

  // ── Backwards-compat aliases ─────────────────────────────────────────────
  get currentFloorIdx() { return this.currentRoomIdx; }
  get totalFloors()     { return this.totalRooms; }
  get floorsCleared()   { return this.roomsCleared; }

  // ── Accessors ─────────────────────────────────────────────────────────────
  get mobs()       { return this.mobContainer.mobs; }
  get currentRoom(){ return this.rooms[this.currentRoomIdx]; }
  get isBossRoom() { return this.currentRoom?.type === ROOM.BOSS; }
  // Expose current-room props that the HUD + game tick reference.
  get plates()     { return this.currentRoom?.plates    || []; }
  get braziers()   { return this.currentRoom?.braziers  || []; }
  get chest()      { return this.currentRoom?.chest     || null; }
  get roomCleared(){ return !!this.currentRoom?.cleared; }

  // ── Room generation ──────────────────────────────────────────────────────

  _generateRooms() {
    const total = Math.max(2, this.diff.roomCount || 3);
    const weights = this.raidDef.roomTypeWeights || { mob: 5, puzzle: 2, resource: 2 };
    const rooms = [];
    for (let i = 0; i < total - 1; i++) {
      const type = pickRoomType(weights);
      rooms.push(this._buildRoom(type, i, total));
    }
    rooms.push(this._buildRoom(ROOM.BOSS, total - 1, total));
    return rooms;
  }

  _buildRoom(type, idx, totalRooms) {
    const isFirst = idx === 0;
    const isLast  = idx === totalRooms - 1;

    const tiles = new Uint8Array(COLS * ROWS).fill(TILES.WALL);
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        tiles[r * COLS + c] = TILES.STONE;
      }
    }

    // 1. Decorations (pillars / blocks). Each room picks a pattern so each
    //    feels distinct. Boss room is always "open" for clean combat space.
    const patternIdx = isLast ? 0 : 1 + Math.floor(Math.random() * (DECORATION_PATTERNS.length - 1));
    const pattern = DECORATION_PATTERNS[patternIdx] || [];
    for (const p of pattern) this._placeBlock(tiles, p.c, p.r, p.w, p.h, TILES.WALL);

    // 2. Carve door paths through any decorations so the player can always
    //    reach each door from the room's interior.
    const hasNorthDoor = !isLast;
    const hasSouthDoor = !isFirst;
    if (hasNorthDoor) {
      tiles[NORTH_DOOR_ROW * COLS + DOOR_COL] = TILES.DOOR;
      for (let r = 1; r <= 3; r++) tiles[r * COLS + DOOR_COL] = TILES.STONE;
    }
    if (hasSouthDoor) {
      tiles[SOUTH_DOOR_ROW * COLS + DOOR_COL] = TILES.DOOR;
      for (let r = ROWS - 4; r <= ROWS - 2; r++) tiles[r * COLS + DOOR_COL] = TILES.STONE;
    }

    const room = {
      type,
      puzzleType: null,
      patternIdx,
      tiles,
      mobs: [],
      plates: [],
      braziers: [],
      sequence: null,
      chest: null,
      cleared: false,
      visited: false,
      hasNorthDoor,
      hasSouthDoor,
    };

    // 3. Populate room content.
    switch (type) {
      case ROOM.MOB:      this._populateMobRoom(room);      break;
      case ROOM.PUZZLE:   this._populatePuzzleRoom(room);   break;
      case ROOM.RESOURCE: this._populateResourceRoom(room); break;
      case ROOM.BOSS:     this._populateBossRoom(room);     break;
    }
    return room;
  }

  /** Stamp a solid rectangle into a tile buffer, respecting map bounds. */
  _placeBlock(tiles, c0, r0, w, h, tileId) {
    for (let r = r0; r < r0 + h; r++) {
      for (let c = c0; c < c0 + w; c++) {
        if (c <= 0 || c >= COLS - 1 || r <= 0 || r >= ROWS - 1) continue;
        tiles[r * COLS + c] = tileId;
      }
    }
  }

  // ── Room populators ──────────────────────────────────────────────────────

  _populateMobRoom(room) {
    const [minN, maxN] = this.raidDef.mobsPerRoom || [3, 5];
    const base = minN + Math.floor(Math.random() * (maxN - minN + 1));
    const n    = Math.max(1, Math.ceil(base * this.diff.countMult));
    const pool = this.raidDef.mobPool || ['goblin'];
    for (let i = 0; i < n; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const pos  = this._findSpawnCell(room.tiles);
      room.mobs.push(this._spawnMob(type, pos.col, pos.row));
    }
  }

  _populatePuzzleRoom(room) {
    const pick = PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)];
    room.puzzleType = pick;
    if (pick === 'plates')    this._setupPlatePuzzle(room);
    else if (pick === 'braziers') this._setupBrazierPuzzle(room);
    else if (pick === 'sequence') this._setupSequencePuzzle(room);
  }

  _setupPlatePuzzle(room) {
    // Three pressure plates scattered around the room. The player activates
    // each by stepping on it — they stay lit once triggered.
    const positions = [
      { c: 4,             r: 5 },
      { c: DOOR_COL,      r: 9 },
      { c: COLS - 5,      r: 5 },
    ];
    for (const p of positions) {
      room.tiles[p.r * COLS + p.c] = TILES.SAND; // off state
      room.plates.push({ col: p.c, row: p.r, active: false });
    }
  }

  _setupBrazierPuzzle(room) {
    // Four braziers — walk over each to light it. Visually different from
    // pressure plates: dirt pile (off) → fire (lit).
    const positions = [
      { c: 4,             r: 4 },
      { c: COLS - 5,      r: 4 },
      { c: 4,             r: ROWS - 5 },
      { c: COLS - 5,      r: ROWS - 5 },
    ];
    for (const p of positions) {
      room.tiles[p.r * COLS + p.c] = TILES.DIRT; // unlit
      room.braziers.push({ col: p.c, row: p.r, lit: false });
    }
  }

  _setupSequencePuzzle(room) {
    // Four numbered plates. Must step on them in the right order — stepping
    // on any other plate while mid-sequence resets progress.
    const slots = [
      { c: 4,             r: 5,  n: 0 },
      { c: 9,             r: 9,  n: 1 },
      { c: COLS - 10,     r: 9,  n: 2 },
      { c: COLS - 5,      r: 5,  n: 3 },
    ];
    // Deterministic order so the HUD can show "Step on plate N next".
    room.sequence = { slots, order: [0, 1, 2, 3], index: 0 };
    for (const s of slots) {
      room.tiles[s.r * COLS + s.c] = TILES.SAND;
      room.plates.push({ col: s.c, row: s.r, active: false, label: s.n });
    }
  }

  _populateResourceRoom(room) {
    // A single supply chest in the centre. Click to collect and advance.
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    room.tiles[cy * COLS + cx] = TILES.FURN_CHEST;
    room.chest = { col: cx, row: cy, kind: 'resource', consumed: false };
  }

  _populateBossRoom(room) {
    const bossType = this.raidDef.bossType || 'troll';
    const bossHpMult = this.raidDef.bossHpMult || 2.0;
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2) - 2;
    const boss = this._spawnMob(bossType, cx, cy);
    boss.maxHp = Math.round(boss.maxHp * bossHpMult);
    boss.hp    = boss.maxHp;
    boss.isBoss = true;
    room.mobs.push(boss);
  }

  /** Find a walkable cell in the room, preferring the upper half. */
  _findSpawnCell(tiles) {
    for (let tries = 0; tries < 40; tries++) {
      const c = 2 + Math.floor(Math.random() * (COLS - 4));
      const r = 2 + Math.floor(Math.random() * 6);
      if (tiles[r * COLS + c] === TILES.STONE) return { col: c, row: r };
    }
    return { col: 2, row: 2 };
  }

  // ── Room lifecycle ───────────────────────────────────────────────────────

  /** Install room `idx` as the active room. `fromDir` (optional) is 'N'|'S'
   *  to pick the entry position — 'S' means we came from the next room and
   *  land near the north door; 'N' (or initial entry) means we arrive via
   *  the south door. */
  startRoom(idx, fromDir) {
    if (idx < 0 || idx >= this.totalRooms) return;
    this.currentRoomIdx = idx;
    const room = this.currentRoom;
    room.visited = true;

    // Swap the arena's tile buffer to this room's buffer and the mob
    // container's list to this room's mob list.
    this.arenaMap.setRoomTiles(room.tiles);
    this.mobContainer.mobs = room.mobs;

    // Set the spawn entry — room 0 entry defaults to the south door area.
    if (fromDir === 'S') {
      // Coming south from a later room: land just inside the north door.
      this.arenaMap.entryCol = DOOR_COL;
      this.arenaMap.entryRow = NORTH_ENTRY_ROW;
    } else {
      // Initial entry OR coming north from an earlier room: land just
      // inside the south door.
      this.arenaMap.entryCol = DOOR_COL;
      this.arenaMap.entryRow = SOUTH_ENTRY_ROW;
    }

    // Cooldown so the player doesn't immediately re-trigger a door on the
    // entry tile if it happens to be near one.
    this._doorCooldown = 0.6;
  }

  /** Called by Game when the player steps onto a DOOR tile. Attempts to
   *  transition. Returns an object describing the transition (or null if
   *  the door is locked / no target room). */
  tryEnterDoor(doorSide) {
    if (this._doorCooldown > 0) return null;
    const room = this.currentRoom;
    if (!room) return null;

    if (doorSide === 'N') {
      // Next-room door — only available once the current room is cleared.
      if (!room.cleared) return { locked: true, reason: 'Clear the room first.' };
      const nextIdx = this.currentRoomIdx + 1;
      if (nextIdx >= this.totalRooms) return null;
      this.startRoom(nextIdx, 'N');
      return { moved: true, idx: nextIdx };
    }
    if (doorSide === 'S') {
      // Previous-room door — always open (you already cleared it to get past).
      const prevIdx = this.currentRoomIdx - 1;
      if (prevIdx < 0) return null;
      this.startRoom(prevIdx, 'S');
      return { moved: true, idx: prevIdx };
    }
    return null;
  }

  // ── Per-frame update ──────────────────────────────────────────────────────

  update(dt, player) {
    if (this.complete || this.failed) return;
    this.timer += dt;
    if (this._doorCooldown > 0) this._doorCooldown -= dt;

    for (const mob of this.mobs) {
      if (!mob.dead) mob.update(dt, this.arenaMap, player, this.mobs);
    }

    const room = this.currentRoom;
    if (!room || room.cleared) return;

    switch (room.type) {
      case ROOM.MOB:
        if (room.mobs.length > 0 && room.mobs.every(m => m.dead)) {
          this._markRoomCleared(room);
        }
        break;
      case ROOM.PUZZLE:
        this._tickPuzzle(room, player);
        break;
      case ROOM.BOSS:
        this._tickBoss(room);
        break;
      // RESOURCE clears only via chest click (onChestClicked).
    }
  }

  _markRoomCleared(room) {
    if (room.cleared) return;
    room.cleared = true;
    this.roomsCleared++;
    // Award room-clear XP (boss room awards completion XP separately).
    if (room.type !== ROOM.BOSS) {
      const xp = Math.round(RAID_XP.PER_ROOM * this.diff.xpMult);
      this.xpEarned += xp;
      this.skills.addXp(11 /* RAIDING */, xp);
    }
  }

  _tickPuzzle(room, player) {
    const pc = player.col, pr = player.row;
    if (room.puzzleType === 'plates' || room.puzzleType === 'braziers') {
      const list = room.puzzleType === 'plates' ? room.plates : room.braziers;
      const keyOff = room.puzzleType === 'plates' ? 'active' : 'lit';
      const offTile = room.puzzleType === 'plates' ? TILES.SAND  : TILES.DIRT;
      const onTile  = room.puzzleType === 'plates' ? TILES.PLANK : TILES.FIRE;
      for (const p of list) {
        if (!p[keyOff] && pc === p.col && pr === p.row) {
          p[keyOff] = true;
          this.arenaMap.setTile(p.col, p.row, onTile);
        }
      }
      if (list.length > 0 && list.every(p => p[keyOff])) this._markRoomCleared(room);
      // Silence unused variable warning
      void offTile;
    }
    else if (room.puzzleType === 'sequence') {
      const seq = room.sequence;
      // Only trigger on first tile the player arrives on.
      for (const p of room.plates) {
        if (pc === p.col && pr === p.row) {
          if (p.active) return; // already activated, no-op
          // Check if this is the correct next step.
          const expected = seq.order[seq.index];
          if (p.label === expected) {
            p.active = true;
            seq.index++;
            this.arenaMap.setTile(p.col, p.row, TILES.PLANK);
            if (seq.index >= seq.order.length) this._markRoomCleared(room);
          } else {
            // Wrong order — reset progress.
            for (const q of room.plates) {
              q.active = false;
              this.arenaMap.setTile(q.col, q.row, TILES.SAND);
            }
            seq.index = 0;
          }
          return;
        }
      }
    }
  }

  _tickBoss(room) {
    const boss = room.mobs[0];
    if (!boss || !boss.dead) return;
    if (!room.chest) {
      // Drop the reward chest in the centre of the boss room.
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      this.arenaMap.setTile(cx, cy, TILES.FURN_CHEST);
      room.chest = { col: cx, row: cy, kind: 'reward', consumed: false };
      room.cleared = true;
      this.roomsCleared++;
      this._rollFinalLoot(true);
    }
  }

  // ── Chest click (game.js calls this when a raid chest is activated) ──────

  onChestClicked(col, row) {
    const room = this.currentRoom;
    if (!room?.chest) return null;
    if (room.chest.consumed) return null;
    if (room.chest.col !== col || room.chest.row !== row) return null;
    room.chest.consumed = true;
    this.arenaMap.setTile(col, row, TILES.STONE);

    if (room.chest.kind === 'resource') {
      const loot = rollResourceLoot(this.raidDef, this.diff.goldMult);
      // Resource rooms clear on chest click.
      this._markRoomCleared(room);
      return { kind: 'resource', loot };
    }
    if (room.chest.kind === 'reward') {
      this.complete = true;
      return { kind: 'reward', loot: this.loot };
    }
    return null;
  }

  // ── Event callbacks ──────────────────────────────────────────────────────

  onMobKilled(mob) {
    this.killCount++;
    const xp = Math.round(mob.maxHp * RAID_XP.PER_KILL * this.diff.xpMult);
    this.xpEarned += xp;
    this.skills.addXp(11 /* RAIDING */, xp);
  }

  onPlayerDamaged(amount) { this.damageTaken += amount; }

  onPlayerDeath() {
    if (this.failed || this.complete) return;
    this.deaths++;
    this.failed = true;
    this._finishRaid(true);
  }

  // ── Score / rank helpers ──────────────────────────────────────────────────
  getScore() {
    return calcScore(
      this.roomsCleared, this.totalRooms,
      this.timer, this.damageTaken, this.deaths,
      this.diff,
    );
  }
  getRank() { return getRank(this.getScore()); }

  getMobAt(wx, wy) {
    for (const m of this.mobs) {
      if (!m.dead && wx >= m.x && wx <= m.x + m.w && wy >= m.y && wy <= m.y + m.h) return m;
    }
    return null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _spawnMob(type, col, row) {
    const mob = new Mob(type, col * TILE_SIZE, row * TILE_SIZE);
    mob.id = this._nextMobId++;
    mob.maxHp         = Math.max(1, Math.round(mob.maxHp         * this.diff.hpMult));
    mob.hp            = mob.maxHp;
    mob.strengthLevel = Math.round(mob.strengthLevel * this.diff.damageMult);
    mob.attackLevel   = Math.round(mob.attackLevel   * this.diff.damageMult);
    mob.aggressive    = true;
    mob.state         = 'idle';
    return mob;
  }

  _rollFinalLoot(awardCompletionXp) {
    if (this.loot.length > 0) return;
    if (awardCompletionXp) {
      const completionXp = Math.round(RAID_XP.COMPLETION * this.diff.xpMult);
      this.xpEarned += completionXp;
      this.skills.addXp(11 /* RAIDING */, completionXp);
    }
    const rank = this.getRank();
    this.loot  = rollLoot(
      this.raidDef.lootTable,
      this.diffIndex,
      rank.label,
      this.diff.goldMult,
    );
  }

  _finishRaid(failed) {
    this._rollFinalLoot(!failed);
    this.complete = true;
  }
}
