'use strict';
/**
 * Server-side mob simulation.
 * Uses dynamic import() to load the ESM game modules (world + mobs).
 * The server runs the full mob AI so all clients see identical animals.
 */

let _world      = null;
let _mobManager = null;
let _ready      = false;
let _nextId     = 0;

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
 * Call this on a fixed interval (e.g. every 100 ms → dt = 0.1).
 */
function update(dt) {
  if (!_ready) return;
  _mobManager.update(dt, _world, null); // null player = no aggro server-side
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
  }));
}

/**
 * Apply damage to a mob by ID.
 * Returns { id, hp, dead } on success, or null if mob is not found / already dead.
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
  // Bypass setTile to avoid pushing to changedTiles
  if (col >= 0 && col < _world.cols && row >= 0 && row < _world.rows) {
    _world.tiles[row][col] = tile;
    _world.dirty = true;
  }
}

module.exports = {
  init,
  update,
  getSnapshot,
  applyDamage,
  setTile,
  get ready() { return _ready; },
};
