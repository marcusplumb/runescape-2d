/**
 * dungeons.js — Underground dungeon generation and management
 *
 * Three dungeons of increasing difficulty:
 *  1. Goblin Cave    — near spawn, easy   (levels  5–25)
 *  2. Spider Den     — tundra region, med (levels 25–45)
 *  3. Ancient Mines  — volcanic, hard     (levels 50–80)
 */
import { TILES, TILE_SIZE } from './constants.js';
import { Mob } from './mobs.js';
import { InteriorMap } from './interiors.js';

// ── Tile helpers ──────────────────────────────────────────

function _fill(t, W, x, y, w, h, tile) {
  const H = t.length / W | 0;
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) {
      const c = x + dx, r = y + dy;
      if (c >= 0 && c < W && r >= 0 && r < H) t[r * W + c] = tile;
    }
}

function _hcorr(t, W, x1, x2, y, tile) {
  const H = t.length / W | 0;
  for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++)
    for (let dy = 0; dy < 3; dy++) { const r = y+dy; if (r>=0&&r<H) t[r*W+x]=tile; }
}

function _vcorr(t, W, y1, y2, x, tile) {
  const H = t.length / W | 0;
  for (let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++)
    for (let dx = 0; dx < 3; dx++) { const c = x+dx; if (c>=0&&c<W) t[y*W+c]=tile; }
}

function _scatterOres(t, W, rooms, oreList, density, propGroundMap) {
  for (const room of rooms)
    for (let dy = 1; dy < room.h-1; dy++)
      for (let dx = 1; dx < room.w-1; dx++) {
        if (Math.random() > density) continue;
        const c = room.x+dx, r = room.y+dy;
        if (t[r*W+c] === TILES.STONE) {
          propGroundMap.set(`${c},${r}`, TILES.STONE);
          t[r*W+c] = oreList[Math.floor(Math.random()*oreList.length)];
        }
      }
}

// ── DungeonInstance ───────────────────────────────────────

export class DungeonInstance {
  constructor(map, mobSpawnDefs) {
    this.map         = map;
    this.mobContainer = { mobs: [] };
    this._spawnDefs  = mobSpawnDefs;
  }

  spawnMobs() {
    this.mobContainer.mobs = this._spawnDefs.map(({ type, col, row }) => {
      const mob       = new Mob(type, col * TILE_SIZE, row * TILE_SIZE);
      mob.id          = `dungeon_${col}_${row}`;
      mob.aggressive  = true;
      mob.state       = 'idle';
      return mob;
    });
  }

  update(dt, player) {
    for (const mob of this.mobContainer.mobs)
      if (!mob.dead) mob.update(dt, this.map, player, this.mobContainer.mobs);
  }

  get mobs() { return this.mobContainer.mobs; }

  getMobAt(wx, wy) {
    for (const m of this.mobContainer.mobs) {
      if (!m.dead && wx >= m.x && wx <= m.x + m.w && wy >= m.y && wy <= m.y + m.h)
        return m;
    }
    return null;
  }
}

// ── Dungeon 1: Goblin Cave ────────────────────────────────

export function buildGoblinCave() {
  const W = 80, H = 60;
  const t = new Uint8Array(W * H).fill(TILES.WALL);
  const F = TILES.STONE;

  const rooms = [
    { x:5,  y:5,  w:18, h:12 },
    { x:28, y:3,  w:20, h:14 },
    { x:53, y:5,  w:18, h:12 },
    { x:5,  y:23, w:20, h:16 },
    { x:30, y:22, w:22, h:18 },
    { x:56, y:22, w:18, h:16 },
    { x:8,  y:43, w:22, h:13 },
    { x:40, y:42, w:26, h:14 },
  ];
  for (const r of rooms) _fill(t, W, r.x, r.y, r.w, r.h, F);

  _hcorr(t, W, 23, 28, 9,  F); _hcorr(t, W, 48, 53, 9,  F);
  _vcorr(t, W, 17, 23, 13, F); _vcorr(t, W, 17, 22, 38, F);
  _hcorr(t, W, 25, 30, 29, F); _hcorr(t, W, 52, 56, 28, F);
  _vcorr(t, W, 38, 43, 18, F); _vcorr(t, W, 38, 42, 53, F);
  _hcorr(t, W, 30, 40, 49, F);

  const propGroundMap = new Map();
  _scatterOres(t, W, rooms,
    [TILES.ROCK_COPPER, TILES.ROCK_TIN, TILES.ROCK_IRON, TILES.ROCK_COAL, TILES.ROCK_SILVER],
    0.06, propGroundMap);

  t[7 * W + 12] = TILES.STAIRS; // exit one tile above entry (12, 8)

  const map = new InteriorMap('dungeon_goblin_cave', 'Goblin Cave', W, H, t, 12, 8);
  map.propGroundMap = propGroundMap;

  return new DungeonInstance(map, [
    { type:'cave_rat',  col:34, row:7  }, { type:'cave_rat',  col:40, row:7  },
    { type:'goblin',    col:57, row:9  }, { type:'goblin',    col:62, row:10 },
    { type:'cave_bat',  col:13, row:29 }, { type:'cave_bat',  col:40, row:29 },
    { type:'cave_rat',  col:42, row:31 }, { type:'goblin',    col:60, row:28 },
    { type:'cave_rat',  col:16, row:49 }, { type:'goblin',    col:45, row:47 },
    { type:'cave_troll',col:50, row:49 }, { type:'goblin',    col:56, row:47 },
  ]);
}

// ── Dungeon 2: Spider Den ─────────────────────────────────

export function buildSpiderDen() {
  const W = 80, H = 70;
  const t = new Uint8Array(W * H).fill(TILES.WALL);
  const F = TILES.STONE;

  const rooms = [
    { x:5,  y:5,  w:18, h:13 },
    { x:27, y:4,  w:22, h:14 },
    { x:54, y:5,  w:22, h:13 },
    { x:6,  y:24, w:20, h:18 },
    { x:30, y:23, w:22, h:18 },
    { x:57, y:22, w:18, h:18 },
    { x:8,  y:47, w:24, h:17 },
    { x:36, y:46, w:24, h:18 },
    { x:63, y:48, w:13, h:16 },
  ];
  for (const r of rooms) _fill(t, W, r.x, r.y, r.w, r.h, F);

  _hcorr(t, W, 23, 27, 10, F); _hcorr(t, W, 49, 54, 10, F);
  _vcorr(t, W, 18, 24, 13, F); _vcorr(t, W, 18, 23, 38, F);
  _hcorr(t, W, 26, 30, 30, F); _hcorr(t, W, 52, 57, 29, F);
  _vcorr(t, W, 41, 47, 17, F); _vcorr(t, W, 41, 46, 48, F);
  _hcorr(t, W, 32, 36, 55, F); _hcorr(t, W, 60, 63, 54, F);

  const propGroundMap = new Map();
  _scatterOres(t, W, rooms,
    [TILES.ROCK_SILVER, TILES.ROCK_GOLD, TILES.ROCK_COAL, TILES.ROCK_IRON],
    0.055, propGroundMap);

  t[7 * W + 12] = TILES.STAIRS; // exit one tile above entry (12, 8)

  const map = new InteriorMap('dungeon_spider_den', 'Spider Den', W, H, t, 12, 8);
  map.propGroundMap = propGroundMap;

  return new DungeonInstance(map, [
    { type:'cave_bat',     col:33, row:9  }, { type:'cave_bat',     col:40, row:9  },
    { type:'giant_spider', col:60, row:10 },
    { type:'skeleton',     col:13, row:31 }, { type:'giant_spider', col:36, row:30 },
    { type:'giant_spider', col:43, row:31 }, { type:'cave_troll',   col:61, row:29 },
    { type:'skeleton',     col:14, row:54 }, { type:'giant_spider', col:44, row:52 },
    { type:'cave_troll',   col:49, row:54 }, { type:'giant_spider', col:66, row:53 },
    { type:'cave_troll',   col:68, row:58 },
  ]);
}

// ── Dungeon 3: Ancient Mines ──────────────────────────────

export function buildAncientMines() {
  const W = 100, H = 80;
  const t = new Uint8Array(W * H).fill(TILES.WALL);
  const F = TILES.STONE;

  const rooms = [
    { x:5,  y:5,  w:20, h:15 },
    { x:30, y:3,  w:24, h:15 },
    { x:59, y:5,  w:20, h:14 },
    { x:83, y:7,  w:13, h:16 },
    { x:5,  y:26, w:22, h:20 },
    { x:32, y:24, w:26, h:22 },
    { x:63, y:23, w:22, h:20 },
    { x:84, y:28, w:12, h:20 },
    { x:6,  y:52, w:25, h:22 },
    { x:36, y:51, w:28, h:22 },
    { x:69, y:53, w:24, h:20 },
  ];
  for (const r of rooms) _fill(t, W, r.x, r.y, r.w, r.h, F);

  // Volcanic rock patches in southern rooms
  for (const ri of [8, 9, 10]) {
    const room = rooms[ri];
    for (let dy = 1; dy < room.h-1; dy++)
      for (let dx = 1; dx < room.w-1; dx++)
        if (Math.random() < 0.07 && t[(room.y+dy)*W+(room.x+dx)] === F)
          t[(room.y+dy)*W+(room.x+dx)] = TILES.VOLCANIC_ROCK;
  }

  _hcorr(t, W, 25, 30, 11, F); _hcorr(t, W, 53, 59, 11, F); _hcorr(t, W, 79, 83, 14, F);
  _vcorr(t, W, 20, 26, 13, F); _vcorr(t, W, 20, 24, 44, F);
  _hcorr(t, W, 27, 32, 33, F); _hcorr(t, W, 58, 63, 32, F); _hcorr(t, W, 79, 84, 36, F);
  _vcorr(t, W, 46, 52, 15, F); _vcorr(t, W, 46, 51, 48, F); _vcorr(t, W, 47, 53, 79, F);
  _hcorr(t, W, 31, 36, 62, F); _hcorr(t, W, 64, 69, 62, F);

  const propGroundMap = new Map();
  _scatterOres(t, W, rooms, [
    TILES.ROCK_MITHRIL, TILES.ROCK_MITHRIL,
    TILES.ROCK_TUNGSTEN,
    TILES.ROCK_OBSIDIAN, TILES.ROCK_OBSIDIAN,
    TILES.ROCK_MOONSTONE,
    TILES.ROCK_GOLD,
  ], 0.07, propGroundMap);

  t[8 * W + 13] = TILES.STAIRS; // exit one tile above entry (13, 9)

  const map = new InteriorMap('dungeon_ancient_mines', 'Ancient Mines', W, H, t, 13, 9);
  map.propGroundMap = propGroundMap;

  return new DungeonInstance(map, [
    { type:'skeleton',       col:37, row:8  }, { type:'skeleton',       col:44, row:8  },
    { type:'stone_golem',    col:65, row:10 }, { type:'undead_warrior', col:87, row:13 },
    { type:'skeleton',       col:11, row:34 }, { type:'stone_golem',    col:40, row:32 },
    { type:'undead_warrior', col:48, row:33 }, { type:'stone_golem',    col:68, row:30 },
    { type:'undead_warrior', col:86, row:36 },
    { type:'skeleton',       col:14, row:61 }, { type:'stone_golem',    col:43, row:60 },
    { type:'dragon_whelp',   col:51, row:63 }, { type:'undead_warrior', col:73, row:62 },
    { type:'dragon_whelp',   col:77, row:64 },
  ]);
}

// ── Registry ──────────────────────────────────────────────

export function buildAllDungeons() {
  return new Map([
    ['dungeon_goblin_cave',   buildGoblinCave()],
    ['dungeon_spider_den',    buildSpiderDen()],
    ['dungeon_ancient_mines', buildAncientMines()],
  ]);
}
