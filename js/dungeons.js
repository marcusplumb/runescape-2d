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

/** Fill an axis-aligned ellipse with the given tile. */
function _fillEllipse(t, W, cx, cy, rx, ry, tile) {
  const H = t.length / W | 0;
  for (let dy = -ry; dy <= ry; dy++)
    for (let dx = -rx; dx <= rx; dx++) {
      if (dx * dx * ry * ry + dy * dy * rx * rx > rx * rx * ry * ry) continue;
      const c = cx + dx, r = cy + dy;
      if (c >= 0 && c < W && r >= 0 && r < H) t[r * W + c] = tile;
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
  const t = new Uint8Array(W * H).fill(TILES.CAVE_WALL);
  const F = TILES.STONE;  // used temporarily for room fills + ore scatter compatibility

  // ── Rooms ──────────────────────────────────────────────────────────────
  const rooms = [
    { x:4,  y:5,  w:19, h:11 },  // 0  Entry Hall     (NW)
    { x:27, y:3,  w:22, h:12 },  // 1  Rat Warren      (N centre)
    { x:53, y:5,  w:23, h:11 },  // 2  Bat Roost       (NE)
    { x:3,  y:22, w:21, h:15 },  // 3  Goblin Village  (W)
    { x:26, y:20, w:30, h:20 },  // 4  Grand Cave      (centre — largest)
    { x:58, y:22, w:18, h:15 },  // 5  Mine Works      (E)
    { x:5,  y:43, w:20, h:13 },  // 6  Goblin Barracks (SW)
    { x:27, y:42, w:32, h:14 },  // 7  Throne Room     (S centre)
    { x:63, y:45, w:13, h:11 },  // 8  Hidden Chamber  (SE)
  ];
  for (const r of rooms) _fill(t, W, r.x, r.y, r.w, r.h, F);

  // Extra alcoves / nooks for irregular feel
  _fill(t, W, 8,  2,  6,  4,  F);   // north nook jutting above Entry Hall
  _fill(t, W, 73, 6,  5,  8,  F);   // east dead-end alcove off Bat Roost

  // ── Corridors ──────────────────────────────────────────────────────────
  _hcorr(t, W, 23, 26,  9,  F);  // Entry Hall    → Rat Warren
  _hcorr(t, W, 49, 52,  9,  F);  // Rat Warren    → Bat Roost
  _vcorr(t, W, 16, 21, 10,  F);  // Entry Hall    → Goblin Village
  _vcorr(t, W, 15, 19, 34,  F);  // Rat Warren    → Grand Cave
  _vcorr(t, W, 16, 21, 62,  F);  // Bat Roost     → Mine Works
  _hcorr(t, W, 24, 25, 28,  F);  // Goblin Village → Grand Cave
  _hcorr(t, W, 56, 57, 27,  F);  // Grand Cave    → Mine Works
  _vcorr(t, W, 37, 42, 12,  F);  // Goblin Village → Goblin Barracks
  _vcorr(t, W, 40, 41, 40,  F);  // Grand Cave    → Throne Room
  _vcorr(t, W, 37, 44, 65,  F);  // Mine Works    → Hidden Chamber
  _hcorr(t, W, 25, 26, 50,  F);  // Goblin Barracks → Throne Room
  _hcorr(t, W, 59, 62, 50,  F);  // Throne Room   → Hidden Chamber

  // ── propGroundMap tracks what tile sits beneath props (ores, fires) ──────
  const propGroundMap = new Map();

  // ── Campfires — placed on cave floor, registered in propGroundMap ────────
  // [row, col] pairs
  const campfires = [
    [14, 13], [29, 11], [22, 31], [22, 50], [36, 29],
    [51, 13], [44, 31], [44, 53], [52, 67],
  ];
  for (const [fr, fc] of campfires) {
    t[fr * W + fc] = TILES.FIRE;
    propGroundMap.set(`${fc},${fr}`, TILES.CAVE_FLOOR);
  }

  // ── Underground pools (solid water obstacles, adds navigation texture) ─
  _fill(t, W, 35,  7, 2, 2, TILES.WATER);  // Rat Warren drip pool
  _fill(t, W, 38, 27, 3, 3, TILES.WATER);  // Grand Cave central underground lake
  _fill(t, W, 66, 48, 2, 2, TILES.WATER);  // Hidden Chamber pool

  // ── Ore scatter ────────────────────────────────────────────────────────
  _scatterOres(t, W, rooms,
    [TILES.ROCK_COPPER, TILES.ROCK_TIN, TILES.ROCK_IRON, TILES.ROCK_COAL, TILES.ROCK_SILVER],
    0.06, propGroundMap);
  // Mine Works gets extra iron & coal veins
  _scatterOres(t, W, [rooms[5]],
    [TILES.ROCK_IRON, TILES.ROCK_COAL, TILES.ROCK_COAL],
    0.05, propGroundMap);

  // ── Convert stone floor → cave floor ────────────────────────────────────
  // Ore scatter checked for TILES.STONE; now convert all remaining stone to
  // packed-earth cave floor. Update propGroundMap so ore backgrounds match.
  for (let i = 0; i < t.length; i++) {
    if (t[i] === TILES.STONE) t[i] = TILES.CAVE_FLOOR;
  }
  for (const [key, val] of propGroundMap) {
    if (val === TILES.STONE) propGroundMap.set(key, TILES.CAVE_FLOOR);
  }

  // ── Entry / exit ───────────────────────────────────────────────────────
  t[7 * W + 10] = TILES.STAIRS;   // exit, one tile above entry (10, 8)

  const map = new InteriorMap('dungeon_goblin_cave', 'Goblin Cave', W, H, t, 10, 8);
  map.propGroundMap = propGroundMap;

  return new DungeonInstance(map, [
    // Entry Hall — a few rats lurk near the entrance
    { type:'cave_rat',   col:13, row:9  },
    { type:'cave_rat',   col:18, row:13 },
    // Rat Warren — infested with rats and a bat
    { type:'cave_rat',   col:32, row:7  },
    { type:'cave_rat',   col:38, row:7  },
    { type:'cave_rat',   col:44, row:10 },
    { type:'cave_bat',   col:30, row:11 },
    // Bat Roost — bats and a goblin lookout
    { type:'cave_bat',   col:58, row:8  },
    { type:'cave_bat',   col:65, row:8  },
    { type:'cave_bat',   col:72, row:10 },
    { type:'goblin',     col:70, row:7  },
    // Goblin Village — main inhabited area
    { type:'goblin',     col:8,  row:27 },
    { type:'goblin',     col:15, row:27 },
    { type:'goblin',     col:19, row:32 },
    { type:'cave_rat',   col:6,  row:33 },
    // Grand Cave — patrolling bats and goblin sentries
    { type:'cave_bat',   col:29, row:23 },
    { type:'cave_bat',   col:52, row:23 },
    { type:'goblin',     col:35, row:36 },
    { type:'goblin',     col:46, row:35 },
    { type:'cave_rat',   col:45, row:24 },
    // Mine Works — goblins guarding ore
    { type:'goblin',     col:63, row:27 },
    { type:'goblin',     col:71, row:31 },
    { type:'cave_rat',   col:68, row:25 },
    // Goblin Barracks — sleeping/resting goblins
    { type:'goblin',     col:9,  row:48 },
    { type:'goblin',     col:17, row:51 },
    { type:'goblin',     col:21, row:47 },
    { type:'cave_rat',   col:7,  row:53 },
    // Throne Room — trolls and elite goblin guards (boss area)
    { type:'cave_troll', col:35, row:48 },
    { type:'cave_troll', col:50, row:48 },
    { type:'goblin',     col:30, row:46 },
    { type:'goblin',     col:40, row:52 },
    { type:'goblin',     col:55, row:46 },
    // Hidden Chamber — secret room guard
    { type:'goblin',     col:67, row:50 },
    { type:'cave_bat',   col:71, row:52 },
  ]);
}

// ── Dungeon 2: Spider Den ─────────────────────────────────

export function buildSpiderDen() {
  const W = 82, H = 72;
  // Start with solid cave walls throughout
  const t = new Uint8Array(W * H).fill(TILES.CAVE_WALL);
  const F = TILES.STONE;  // temporary floor — ore scatter checks for STONE

  // ── Elliptical rooms ──────────────────────────────────────────────────────
  // { cx, cy, rx, ry } — all in tile coordinates
  const ellipses = [
    { cx: 14, cy: 12, rx: 9,  ry: 8  },  // 0  Entry Chamber   (NW)
    { cx: 37, cy:  9, rx: 11, ry: 6  },  // 1  Web Tunnel      (N centre)
    { cx: 63, cy: 12, rx: 10, ry: 8  },  // 2  Bat Colony      (NE)
    { cx: 12, cy: 33, rx: 9,  ry: 10 },  // 3  Hatchery W      (W)
    { cx: 39, cy: 32, rx: 15, ry: 13 },  // 4  Grand Lair      (centre — largest)
    { cx: 64, cy: 32, rx: 9,  ry: 10 },  // 5  Egg Chamber E   (E)
    { cx: 13, cy: 55, rx: 9,  ry: 8  },  // 6  Dead End SW     (SW)
    { cx: 40, cy: 57, rx: 14, ry: 8  },  // 7  Throne Room     (S centre)
    { cx: 67, cy: 56, rx: 7,  ry: 7  },  // 8  Hidden Sac      (SE)
  ];
  for (const e of ellipses) _fillEllipse(t, W, e.cx, e.cy, e.rx, e.ry, F);

  // ── Corridors connecting rooms ────────────────────────────────────────────
  // Entry → Web Tunnel (top row)
  _hcorr(t, W, 23, 26,  9, F);
  // Web Tunnel → Bat Colony (top row)
  _hcorr(t, W, 48, 53,  9, F);
  // Entry → Hatchery W (left column)
  _vcorr(t, W, 20, 23, 12, F);
  // Web Tunnel → Grand Lair (mid)
  _vcorr(t, W, 15, 19, 37, F);
  // Bat Colony → Egg Chamber E (right column)
  _vcorr(t, W, 20, 22, 62, F);
  // Hatchery W → Grand Lair (mid row)
  _hcorr(t, W, 21, 24, 31, F);
  // Grand Lair → Egg Chamber E (mid row)
  _hcorr(t, W, 54, 55, 31, F);
  // Hatchery W → Dead End SW (left column)
  _vcorr(t, W, 43, 47, 11, F);
  // Grand Lair → Throne Room (south)
  _vcorr(t, W, 45, 49, 38, F);
  // Egg Chamber E → Hidden Sac (south)
  _vcorr(t, W, 42, 49, 63, F);
  // Dead End SW → Throne Room (bottom row)
  _hcorr(t, W, 22, 26, 53, F);
  // Throne Room → Hidden Sac (bottom row)
  _hcorr(t, W, 54, 60, 55, F);

  // ── propGroundMap tracks underlying ground for props ──────────────────────
  const propGroundMap = new Map();

  // ── Campfires ─────────────────────────────────────────────────────────────
  const campfires = [
    [12, 14], [9,  37], [11, 63],  // top rooms
    [33, 11], [31, 39], [32, 64],  // mid rooms
    [55, 12], [57, 40], [56, 67],  // bottom rooms
  ];
  for (const [fr, fc] of campfires) {
    if (t[fr * W + fc] === F) {
      t[fr * W + fc] = TILES.FIRE;
      propGroundMap.set(`${fc},${fr}`, TILES.CAVE_FLOOR);
    }
  }

  // ── Ore scatter (while floor is still TILES.STONE) ───────────────────────
  // Use bounding boxes of ellipses — scatter checks each cell for TILES.STONE
  const oreRooms = ellipses.map(e => ({
    x: e.cx - e.rx, y: e.cy - e.ry,
    w: e.rx * 2 + 1, h: e.ry * 2 + 1,
  }));
  _scatterOres(t, W, oreRooms,
    [TILES.ROCK_SILVER, TILES.ROCK_GOLD, TILES.ROCK_COAL, TILES.ROCK_IRON],
    0.05, propGroundMap);

  // ── Convert STONE floor → CAVE_FLOOR ─────────────────────────────────────
  for (let i = 0; i < t.length; i++) {
    if (t[i] === TILES.STONE) t[i] = TILES.CAVE_FLOOR;
  }
  for (const [key, val] of propGroundMap) {
    if (val === TILES.STONE) propGroundMap.set(key, TILES.CAVE_FLOOR);
  }

  // ── Spider web scatter — placed on CAVE_FLOOR tiles ───────────────────────
  for (let i = 0; i < t.length; i++) {
    if (t[i] === TILES.CAVE_FLOOR && Math.random() < 0.07) {
      t[i] = TILES.SPIDER_WEB;
      propGroundMap.set(`${i % W},${i / W | 0}`, TILES.CAVE_FLOOR);
    }
  }

  // ── Entry / exit ──────────────────────────────────────────────────────────
  t[7 * W + 10] = TILES.STAIRS;   // exit above spawn

  const map = new InteriorMap('dungeon_spider_den', 'Spider Den', W, H, t, 10, 8);
  map.propGroundMap = propGroundMap;

  return new DungeonInstance(map, [
    // Entry Chamber (room 0)
    { type:'giant_spider', col: 9,  row: 12 },
    { type:'giant_spider', col: 19, row: 14 },
    { type:'cave_bat',     col: 14, row:  7 },
    // Web Tunnel (room 1)
    { type:'giant_spider', col: 30, row:  9 },
    { type:'giant_spider', col: 44, row:  9 },
    { type:'cave_bat',     col: 37, row:  5 },
    // Bat Colony (room 2)
    { type:'cave_bat',     col: 57, row:  8 },
    { type:'cave_bat',     col: 65, row:  8 },
    { type:'cave_bat',     col: 70, row: 14 },
    { type:'giant_spider', col: 62, row: 16 },
    // Hatchery W (room 3)
    { type:'giant_spider', col:  6, row: 30 },
    { type:'giant_spider', col: 18, row: 30 },
    { type:'giant_spider', col: 12, row: 40 },
    { type:'skeleton',     col: 10, row: 36 },
    // Grand Lair (room 4 — largest, heaviest population)
    { type:'giant_spider', col: 27, row: 27 },
    { type:'giant_spider', col: 45, row: 27 },
    { type:'giant_spider', col: 32, row: 38 },
    { type:'giant_spider', col: 48, row: 38 },
    { type:'giant_spider', col: 39, row: 34 },
    { type:'skeleton',     col: 36, row: 25 },
    { type:'cave_troll',   col: 43, row: 43 },
    // Egg Chamber E (room 5)
    { type:'giant_spider', col: 58, row: 28 },
    { type:'giant_spider', col: 70, row: 36 },
    { type:'skeleton',     col: 64, row: 40 },
    // Dead End SW (room 6)
    { type:'giant_spider', col:  8, row: 52 },
    { type:'giant_spider', col: 18, row: 56 },
    { type:'skeleton',     col: 13, row: 60 },
    // Throne Room (room 7)
    { type:'giant_spider', col: 30, row: 55 },
    { type:'giant_spider', col: 50, row: 57 },
    { type:'cave_troll',   col: 40, row: 62 },
    { type:'skeleton',     col: 35, row: 52 },
    { type:'skeleton',     col: 46, row: 52 },
    // Hidden Sac (room 8)
    { type:'giant_spider', col: 63, row: 54 },
    { type:'giant_spider', col: 71, row: 60 },
    { type:'cave_troll',   col: 67, row: 58 },
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
