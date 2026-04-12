'use strict';
/**
 * Server-side mob simulation.
 * Uses dynamic import() to load the ESM game modules (world + mobs).
 * The server runs the full mob AI so all clients see identical mobs.
 *
 * Combat targeting:
 *   - Clients call startCombat(socketId, mobId) when attacking a mob.
 *   - setPlayerPos(socketId, col, row) keeps each player's proxy position live.
 *   - mob.combatTarget is a direct reference to the player proxy, so the mob
 *     always chases the player's current position without extra bookkeeping.
 *   - removePlayer(socketId) releases any mobs targeting the disconnected player.
 */

// Must match js/constants.js
const TILE_SIZE   = 32;
const AGGRO_RANGE = 8; // tiles

let _world      = null;
let _mobManager = null;
let _ready      = false;
let _nextId     = 0;

// Map<socketId, { cx, cy }> — live position proxies.
// mob.combatTarget holds a direct reference into this map, so updating
// p.cx / p.cy here automatically steers the chasing mob every tick.
const _players = new Map();

async function init() {
  try {
    const { World }      = await import('../js/world.js');
    const { MobManager } = await import('../js/mobs.js');

    _world      = new World();
    _mobManager = new MobManager(_world);

    // Assign stable numeric IDs to all initially spawned mobs
    for (const m of _mobManager.mobs) m.id = _nextId++;

    _ready = true;
    console.log(`[MobSim] ready — ${_mobManager.mobs.length} mobs spawned`);
  } catch (err) {
    console.error('[MobSim] init failed:', err);
  }
}

/**
 * Advance the simulation by dt seconds.
 * Called on a fixed interval (100 ms → dt = 0.1).
 */
function update(dt) {
  if (!_ready) return;

  // Aggro: aggressive mobs self-target the nearest player within range.
  // This mirrors the client-side aggro check in mob.update() but runs
  // server-authoritatively so all clients see the same behaviour.
  //
  // Skip NPCs (npc:true) — they only patrol/wander, never aggro players.
  // Skip passive mobs (aggressive:false) — flee logic runs in mob.update().
  for (const mob of _mobManager.mobs) {
    if (mob.dead || mob.inCombat || !mob.aggressive) continue;
    if (mob.npc) continue; // NPCs never enter the combat/aggro tick

    // Use per-mob aggroRadius if set, otherwise fall back to module constant
    const aggroRadius = mob._aggroRadius ?? AGGRO_RANGE;

    let nearest = null, nearestDist = Infinity;
    for (const p of _players.values()) {
      const dx = p.cx - mob.cx, dy = p.cy - mob.cy;
      const d  = Math.sqrt(dx * dx + dy * dy) / TILE_SIZE;
      if (d < nearestDist) { nearestDist = d; nearest = p; }
    }
    if (nearest && nearestDist <= aggroRadius) {
      mob.inCombat     = true;
      mob.combatTarget = nearest;
    }
  }

  // Decrement fleeTimer for passive mobs that are fleeing.
  // mob.update() also does this client-side; the server mirrors it so
  // the authoritative fleeing boolean stays accurate.
  for (const mob of _mobManager.mobs) {
    if (mob.dead || mob.npc) continue;
    if (mob.fleeTimer > 0) {
      mob.fleeTimer -= dt;
      if (mob.fleeTimer <= 0) {
        mob.fleeTimer = 0;
        mob.fleeing   = false;
      }
    }
  }

  // null player passed — combat targets are already set directly above
  _mobManager.update(dt, _world, null);

  // Assign IDs to any mobs newly added by the top-up spawner
  for (const m of _mobManager.mobs) {
    if (m.id === undefined) m.id = _nextId++;
  }

  // changedTiles is a renderer concept — prevent unbounded growth on the server
  _world.changedTiles.length = 0;
}

/** Returns a lightweight snapshot array suitable for Socket.io broadcast. */
function getSnapshot() {
  if (!_ready) return [];
  return _mobManager.mobs.map(m => ({
    id:         m.id,
    type:       m.type,
    x:          m.x,
    y:          m.y,
    hp:         m.hp,
    maxHp:      m.maxHp,
    dead:       m.dead,
    facingLeft: m.facingLeft,
    animFrame:  m.animFrame,
    moving:     m.moving,
    fleeing:    m.fleeing ?? false, // clients can render flee animation when true
    npc:        m.npc    ?? false,  // clients skip combat UI for NPCs
  }));
}

/**
 * Apply damage to a mob by ID.
 * Returns { id, hp, dead, wx, wy } on success, or null if not found / already dead.
 */
function applyDamage(mobId, damage) {
  if (!_ready) return null;
  const mob = _mobManager.mobs.find(m => m.id === mobId);
  if (!mob || mob.dead) return null;

  const killed = mob.takeDamage(damage);
  if (killed) {
    mob.dead         = true;
    mob.respawnTimer = 45 + Math.random() * 15;
    mob.inCombat     = false;
    mob.combatTarget = null;
  }
  return {
    id:   mobId,
    hp:   mob.hp,
    dead: mob.dead,
    wx:   mob.x + mob.w / 2,
    wy:   mob.y + mob.h * 0.25,
  };
}

/**
 * Keep the server world in sync with tile changes made by players
 * (chopped trees, mined rocks, etc.) so mob pathfinding stays correct.
 */
function setTile(col, row, tile) {
  if (!_world) return;
  if (col >= 0 && col < _world.cols && row >= 0 && row < _world.rows) {
    _world.tiles[row][col] = tile;
    _world.dirty = true;
  }
}

/**
 * Register or update a connected player's world position.
 * The proxy object is stored by value-of-reference so that any mob whose
 * combatTarget points at this proxy immediately sees the updated position.
 */
function setPlayerPos(socketId, col, row) {
  let p = _players.get(socketId);
  if (!p) {
    p = { cx: 0, cy: 0 };
    _players.set(socketId, p);
  }
  p.cx = col * TILE_SIZE + TILE_SIZE / 2;
  p.cy = row * TILE_SIZE + TILE_SIZE / 2;
}

/**
 * Begin combat: the mob starts chasing this player.
 * Silently ignored if the mob is dead or already chasing a different player.
 */
function startCombat(socketId, mobId) {
  if (!_ready) return;
  const mob    = _mobManager.mobs.find(m => m.id === mobId);
  const player = _players.get(socketId);
  if (!mob || !player || mob.dead) return;
  // Don't steal a mob that is already targeting someone else
  if (mob.inCombat && mob.combatTarget && mob.combatTarget !== player) return;
  mob.inCombat     = true;
  mob.combatTarget = player;
}

/**
 * Release a mob from combat (player fled / disengaged).
 * Only releases if this player is the current combat target.
 */
function stopCombat(socketId, mobId) {
  if (!_ready) return;
  const mob = _mobManager.mobs.find(m => m.id === mobId);
  if (!mob) return;
  if (mob.combatTarget === _players.get(socketId)) {
    mob.inCombat     = false;
    mob.combatTarget = null;
  }
}

/** Clean up all state for a disconnected player. */
function removePlayer(socketId) {
  const p = _players.get(socketId);
  if (p && _mobManager) {
    for (const mob of _mobManager.mobs) {
      if (mob.combatTarget === p) {
        mob.inCombat     = false;
        mob.combatTarget = null;
      }
    }
  }
  _players.delete(socketId);
}

module.exports = {
  init,
  update,
  getSnapshot,
  applyDamage,
  setTile,
  setPlayerPos,
  startCombat,
  stopCombat,
  removePlayer,
  get ready() { return _ready; },
};
