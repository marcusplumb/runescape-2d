import {
  WORLD_COLS, WORLD_ROWS, TILE_SIZE,
  TILES, SOLID_TILES, TREE_TILES,
} from './constants.js';
import { buildBiomeMap, getBiome, BIOMES } from './biomes.js';
import { placeAllStructures } from './structures.js';

// ── Seeded PRNG (mulberry32) ─────────────────────────
const WORLD_SEED = 42;

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ore rocks per biome, ascending rarity order
const BIOME_ORES = {
  [BIOMES.PLAINS]:   [TILES.ROCK_COPPER, TILES.ROCK_TIN],
  [BIOMES.FOREST]:   [TILES.ROCK_COPPER, TILES.ROCK_TIN,  TILES.ROCK_IRON],
  [BIOMES.TUNDRA]:   [TILES.ROCK_TIN,    TILES.ROCK_IRON, TILES.ROCK_COAL],
  [BIOMES.SWAMP]:    [TILES.ROCK_COPPER, TILES.ROCK_TIN,  TILES.ROCK_COAL],
  [BIOMES.DESERT]:   [TILES.ROCK_COPPER, TILES.ROCK_TIN,  TILES.ROCK_IRON],
  [BIOMES.VOLCANIC]: [TILES.ROCK_COAL,   TILES.ROCK_IRON, TILES.ROCK_TIN],
  [BIOMES.DANGER]:   [TILES.ROCK_IRON,   TILES.ROCK_COAL, TILES.ROCK_TIN],
};

export class World {
  constructor() {
    this.cols = WORLD_COLS;
    this.rows = WORLD_ROWS;
    this.dirty = true;
    this.changedTiles = []; // packed (col | row<<16) entries, drained by renderer
    this.tiles = this.generate();
  }

  generate() {
    const rng = makeRng(WORLD_SEED);

    // ── Multiple noise layers ────────────────────────────
    // Large-scale terrain noise (determines height / water level)
    const terrainNoise = this._noiseGrid(this.cols, this.rows, 18, rng);

    // Two independent warp grids for biome boundary distortion
    const warpX = this._noiseGrid(this.cols, this.rows, 55, rng);
    const warpY = this._noiseGrid(this.cols, this.rows, 55, rng);

    // Fine detail noise (adds local variation within a biome)
    const detailNoise = this._noiseGrid(this.cols, this.rows, 7, rng);

    // Cluster noise for trees / rocks (medium scale — creates patches)
    const clusterNoise = this._noiseGrid(this.cols, this.rows, 5, rng);
    // Separate cluster grid for rocks so they don't overlap trees perfectly
    const rockCluster  = this._noiseGrid(this.cols, this.rows, 6, rng);

    // Build the biome map using the warp grids
    buildBiomeMap(this.cols, this.rows, warpX, warpY);

    const map = Array.from({ length: this.rows }, () =>
      new Uint8Array(this.cols).fill(TILES.GRASS)
    );

    // ── Phase 1: Terrain per biome ────────────────────────
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v  = terrainNoise[r][c];
        const dv = detailNoise[r][c];
        // Blend terrain and detail for richer local variation
        const t  = v * 0.75 + dv * 0.25;
        const biome = getBiome(c, r);

        switch (biome) {
          case BIOMES.TUNDRA:
            if (t < 0.18)       map[r][c] = TILES.ICE;
            else if (t < 0.28)  map[r][c] = TILES.WATER;
            else if (t < 0.38)  map[r][c] = TILES.STONE;
            else                map[r][c] = TILES.SNOW;
            break;

          case BIOMES.SWAMP:
            if (t < 0.30)       map[r][c] = TILES.SWAMP_WATER;
            else if (t < 0.45)  map[r][c] = TILES.DEAD_GRASS;
            else if (t < 0.60)  map[r][c] = TILES.DIRT;
            else                map[r][c] = TILES.DARK_GRASS;
            break;

          case BIOMES.DESERT:
            if (t < 0.16)       map[r][c] = TILES.WATER;
            else if (t < 0.32)  map[r][c] = TILES.SAND_DARK;
            else if (t < 0.72)  map[r][c] = TILES.SAND;
            else                map[r][c] = TILES.STONE;
            break;

          case BIOMES.VOLCANIC:
            if (t < 0.22)       map[r][c] = TILES.LAVA;
            else if (t < 0.42)  map[r][c] = TILES.VOLCANIC_ROCK;
            else if (t < 0.60)  map[r][c] = TILES.STONE;
            else                map[r][c] = TILES.DEAD_GRASS;
            break;

          case BIOMES.DANGER:
            if (t < 0.16)       map[r][c] = TILES.LAVA;
            else if (t < 0.32)  map[r][c] = TILES.VOLCANIC_ROCK;
            else if (t < 0.52)  map[r][c] = TILES.DARK_GRASS;
            else                map[r][c] = TILES.DEAD_GRASS;
            break;

          case BIOMES.FOREST:
            if (t < 0.18)       map[r][c] = TILES.WATER;
            else if (t < 0.26)  map[r][c] = TILES.SAND;
            else if (t < 0.50)  map[r][c] = TILES.DARK_GRASS;
            else if (t < 0.72)  map[r][c] = TILES.GRASS;
            else if (t < 0.82)  map[r][c] = TILES.DIRT;
            else                map[r][c] = TILES.STONE;
            break;

          default: // PLAINS
            if (t < 0.20)       map[r][c] = TILES.WATER;
            else if (t < 0.26)  map[r][c] = TILES.SAND;
            else if (t < 0.40)  map[r][c] = TILES.DARK_GRASS;
            else if (t < 0.68)  map[r][c] = TILES.GRASS;
            else if (t < 0.76)  map[r][c] = TILES.DIRT;
            else if (t < 0.84)  map[r][c] = TILES.STONE;
            else                map[r][c] = TILES.GRASS;
            break;
        }
      }
    }

    // propGroundMap records the tile underneath each prop so the renderer can
    // draw the biome ground first, then the prop sprite on top.
    this.propGroundMap = new Map();
    const _setProp = (r, c, tile) => {
      this.propGroundMap.set(`${c},${r}`, map[r][c]);
      map[r][c] = tile;
    };

    // ── Phase 2: Clustered vegetation ────────────────────
    // Trees and desert plants only grow where clusterNoise is above a
    // threshold — this creates dense patches with open clearings between.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = map[r][c];
        const cn = clusterNoise[r][c];
        const biome = getBiome(c, r);

        if (biome === BIOMES.FOREST) {
          // Dense forest — trees fill high-cluster areas, but leave some clearings
          if ((t === TILES.DARK_GRASS || t === TILES.GRASS) && cn > 0.52 && rng() < 0.75) {
            _setProp(r, c, TILES.TREE);
          }
        } else if (biome === BIOMES.TUNDRA) {
          // Sparse snow trees in patches
          if (t === TILES.SNOW && cn > 0.72 && rng() < 0.35) {
            _setProp(r, c, TILES.TREE);
          }
        } else if (biome === BIOMES.SWAMP) {
          // Dead stumps in swamp — loose clusters
          if ((t === TILES.DEAD_GRASS || t === TILES.DARK_GRASS) && cn > 0.62 && rng() < 0.25) {
            _setProp(r, c, TILES.STUMP);
          }
        } else if (biome === BIOMES.DESERT) {
          // Cacti — sparse, only in small tight clusters
          if ((t === TILES.SAND || t === TILES.SAND_DARK) && cn > 0.78 && rng() < 0.18) {
            _setProp(r, c, TILES.CACTUS);
          }
        } else if (biome === BIOMES.DANGER || biome === BIOMES.VOLCANIC) {
          // No trees, only dead stumps occasionally
          if (t === TILES.DEAD_GRASS && cn > 0.76 && rng() < 0.10) {
            _setProp(r, c, TILES.STUMP);
          }
        } else {
          // Plains — moderate tree clusters with open clearings
          if ((t === TILES.GRASS || t === TILES.DARK_GRASS) && cn > 0.65 && rng() < 0.55) {
            _setProp(r, c, TILES.TREE);
          }
          // Flowers only in open grass, away from tree clusters
          if (t === TILES.GRASS && cn < 0.35 && rng() < 0.12) {
            _setProp(r, c, TILES.FLOWERS);
          }
        }
      }
    }

    // ── Phase 2b: Upgrade common trees to rarer varieties ─
    // Higher cluster density → rarer tree type. Rarer trees are also slower
    // to respawn so they stay scarce during play.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t     = map[r][c];
        const cn    = clusterNoise[r][c];
        const biome = getBiome(c, r);
        if (!TREE_TILES.has(t)) continue; // only upgrade existing trees

        // Oak — Forest and Plains, moderate cluster threshold
        if (t === TILES.TREE &&
            (biome === BIOMES.FOREST || biome === BIOMES.PLAINS) &&
            cn > 0.72 && rng() < 0.30) {
          map[r][c] = TILES.OAK_TREE;
          continue;
        }
        // Willow — placed near the lower end of tree-cluster density (openings near water)
        if ((t === TILES.TREE || t === TILES.OAK_TREE) &&
            (biome === BIOMES.FOREST || biome === BIOMES.PLAINS) &&
            cn > 0.60 && cn < 0.72 && rng() < 0.06) {
          map[r][c] = TILES.WILLOW_TREE;
          continue;
        }
        // Maple — Forest only, high cluster
        if ((t === TILES.TREE || t === TILES.OAK_TREE) &&
            biome === BIOMES.FOREST && cn > 0.82 && rng() < 0.18) {
          map[r][c] = TILES.MAPLE_TREE;
          continue;
        }
        // Yew — Forest only, very high cluster
        if (TREE_TILES.has(t) && biome === BIOMES.FOREST && cn > 0.90 && rng() < 0.12) {
          map[r][c] = TILES.YEW_TREE;
          continue;
        }
        // Magic — any non-desert/volcanic biome, very rare
        if (biome !== BIOMES.DESERT && biome !== BIOMES.VOLCANIC &&
            cn > 0.93 && rng() < 0.025) {
          map[r][c] = TILES.MAGIC_TREE;
          continue;
        }
        // Elder — Forest/Plains only, extremely rare
        if ((biome === BIOMES.FOREST || biome === BIOMES.PLAINS) &&
            cn > 0.96 && rng() < 0.015) {
          map[r][c] = TILES.ELDER_TREE;
        }
      }
    }

    // ── Phase 3: Clustered ore rocks ─────────────────────
    // Rock clusters appear on stone/ground tiles where rockCluster is high.
    // A "vein roll" then picks the specific ore from the biome's ore list.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = map[r][c];
        const rk = rockCluster[r][c];
        const biome = getBiome(c, r);
        const ores = BIOME_ORES[biome];
        if (!ores) continue;

        // Ores spawn on stone-like or open ground tiles
        const stoneBase = (t === TILES.STONE || t === TILES.VOLCANIC_ROCK);
        const groundBase = (
          t === TILES.DIRT || t === TILES.GRASS ||
          t === TILES.DARK_GRASS || t === TILES.DEAD_GRASS || t === TILES.SNOW
        );

        // Ores are rare — only the peak of high-cluster areas on stone,
        // and even rarer isolated veins on open ground.
        const threshold = stoneBase ? 0.76 : 0.90;
        const chance    = stoneBase ? 0.38 : 0.10;

        if (rk > threshold && rng() < chance) {
          // Pick ore: weight toward rarer ores at the high end of cluster density
          const roll = (rk - threshold) / (1 - threshold); // 0..1 within cluster
          const idx  = Math.min(ores.length - 1, Math.floor(Math.pow(roll, 1.6) * ores.length));
          _setProp(r, c, ores[idx]);
        } else if (groundBase && rk > 0.93 && rng() < 0.04 && ores.length > 0) {
          // Very occasional isolated surface outcrop on open ground
          _setProp(r, c, ores[0]);
        }
      }
    }

    // ── Phase 4: Fishing spots ────────────────────────────
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        const t = map[r][c];
        const isWater = (t === TILES.WATER || t === TILES.SWAMP_WATER);
        if (!isWater) continue;

        const neighbors = [
          map[r - 1]?.[c], map[r + 1]?.[c],
          map[r]?.[c - 1], map[r]?.[c + 1],
        ];
        const hasLand = neighbors.some(n =>
          n !== undefined && n !== TILES.WATER && n !== TILES.SWAMP_WATER &&
          !SOLID_TILES.has(n)
        );
        if (!hasLand || rng() > 0.055) continue;

        map[r][c] = TILES.FISH_SPOT;
      }
    }

    // ── Phase 5: Bridges over water gaps ─────────────────
    this._placeBridges(map, rng);

    // ── Phase 6: Structures and roads ────────────────────
    const _structures  = placeAllStructures(map, this.rows, this.cols, rng);
    this.doorMap       = _structures.doorMap;
    this.dungeonMap    = new Map();
    this.roofBounds    = [..._structures.roofBounds]; // { c, r, rW, rH, bC, bR, bW, bH } per roofed building
    this.signLabels    = new Map(); // "col,row" → text label rendered on that SIGN tile

    // Kingdom shop BARRELs sit on interior floor tiles — register ground so
    // the PROP_TILES renderer draws the correct floor beneath them.
    // Butcher (westC=479, bldR=200): barrels at row 205, cols 480 & 489
    // Variety (westC=479, bldR+21=221): barrels at row 224, cols 480 & 489
    for (const [c, r] of [[480, 205], [489, 205], [480, 224], [489, 224]])
      this.propGroundMap.set(`${c},${r}`, TILES.WOOD_FLOOR);

    // Kingdom courtyard PROP_TILES (FLOWERS, FOUNTAIN, FIRE) all sit on stone.
    // Scan the interior of the outer wall and register any prop tile as STONE.
    {
      const kOx = 474, kOy = 178, kOW = 76, kOH = 60;
      const courtYardProps = new Set([TILES.FLOWERS, TILES.FOUNTAIN, TILES.FIRE,
                                       TILES.PLANTER_FLOWERS, TILES.PLANTER_BUSH]);
      for (let r = kOy + 1; r < kOy + kOH - 1; r++) {
        for (let c = kOx + 1; c < kOx + kOW - 1; c++) {
          const t = map[r]?.[c];
          if (courtYardProps.has(t) && !this.propGroundMap.has(`${c},${r}`))
            this.propGroundMap.set(`${c},${r}`, TILES.STONE);
        }
      }
    }

    // Clear a generous area around spawn so the player never starts stuck
    const spawnC = Math.floor(this.cols / 2);
    const spawnR = Math.floor(this.rows / 2) + 5;
    for (let dr = -4; dr <= 4; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const rr = spawnR + dr;
        const cc = spawnC + dc;
        if (rr >= 0 && rr < this.rows && cc >= 0 && cc < this.cols) {
          map[rr][cc] = TILES.GRASS;
        }
      }
    }

    // ── Phase 7b: Spawn village houses ───────────────────
    this._placeSpawnVillage(map, spawnC);

    // ── Phase 7c: Portal to player house ─────────────────
    this._placePortal(map, spawnC, spawnR);

    // ── Phase 8: Forge (smithy) ──────────────────────────
    this._placeForge(map, spawnC, spawnR);

    // ── Phase 9: Fishing harbour ────────────────────────
    this._placeFishingHarbor(map);

    // ── Phase 10: Dungeon entrances ──────────────────────
    this._placeDungeons(map, spawnC, spawnR);

    return map;
  }

  _placePortal(map, spawnC, spawnR) {
    const portalC = spawnC - 6;  // 506
    const portalR = spawnR;      // 389

    // Clear a generous 9×7 area so the grand arch visual has breathing room
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const rr = portalR + dr, cc = portalC + dc;
        if (rr >= 0 && rr < this.rows && cc >= 0 && cc < this.cols)
          map[rr][cc] = TILES.GRASS;
      }
    }

    // Cobblestone approach directly south of portal (continuation of main street)
    for (let dc = -1; dc <= 1; dc++) {
      if (portalR + 1 < this.rows) map[portalR + 1][portalC + dc] = TILES.PATH;
      if (portalR + 2 < this.rows) map[portalR + 2][portalC + dc] = TILES.PATH;
    }

    map[portalR][portalC] = TILES.PORTAL;
    this.portalCol = portalC;
    this.portalRow = portalR;
  }

  _placeSpawnVillage(map, spawnC) {
    // Spawn building occupies rows [bldTop, bldTop+6], cols [spawnC-3, spawnC+3]
    const bldTop = Math.floor(this.rows / 2) - 3;   // 381
    const spawnR = Math.floor(this.rows / 2) + 5;   // 389

    // ── Helpers ───────────────────────────────────────────────
    const safe = (r, c, t) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) map[r][c] = t;
    };
    // Set PATH only on walkable/open tiles (never overwrite buildings or furniture)
    const SKIP = new Set([
      TILES.WALL, TILES.PLASTER_WALL, TILES.DOOR, TILES.PORTAL,
      TILES.FURNACE, TILES.ANVIL, TILES.WELL, TILES.BARREL, TILES.SIGN,
      TILES.FENCE, TILES.FLOWERS, TILES.STONE,
    ]);
    const safePath = (r, c) => {
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
      if (!SKIP.has(map[r][c])) map[r][c] = TILES.PATH;
    };
    // Place a prop tile, recording the tile underneath for transparent rendering
    const safeProp = (r, c, t) => {
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
      this.propGroundMap.set(`${c},${r}`, map[r][c]);
      map[r][c] = t;
    };

    // ── THREE RESIDENTIAL COTTAGES (PLASTER_WALL + THATCH_ROOF) ───────
    // Positions chosen so the pair of side houses flank the central one,
    // with a clear path network between them and the town square below.
    const HW = 7, HH = 6;
    const houses = [
      { left: spawnC - 16, top: bldTop - 12 },  // NW: cols 496-502, rows 369-374
      { left: spawnC -  5, top: bldTop - 14 },  // N:  cols 507-513, rows 367-372
      { left: spawnC +  5, top: bldTop - 12 },  // NE: cols 517-523, rows 369-374
    ];

    houses.forEach(({ left, top }, id) => {
      // Cottage walls and thatch roof
      for (let dr = 0; dr < HH; dr++) {
        for (let dc = 0; dc < HW; dc++) {
          const rr = top + dr, cc = left + dc;
          if (rr < 0 || rr >= this.rows || cc < 0 || cc >= this.cols) continue;
          const isEdge = dr === 0 || dr === HH - 1 || dc === 0 || dc === HW - 1;
          map[rr][cc] = isEdge ? TILES.PLASTER_WALL : TILES.PLANK;
        }
      }
      // Interactable door on south wall (centre)
      const doorC = left + Math.floor(HW / 2);
      const doorR = top + HH - 1;
      // Record roof bounds: interior region + full footprint + door position
      this.roofBounds.push({ c: left + 1, r: top + 1, rW: HW - 2, rH: HH - 2,
                             bC: left, bR: top, bW: HW, bH: HH,
                             doorC, doorR, doorFace: 'south' });
      safe(doorR, doorC, TILES.DOOR);
      this.doorMap.set(`${doorC},${doorR}`, `spawn_village_house_${id}`);

      // Picket fence immediately south of the house; gap in front of door
      const fenceR = doorR + 1;
      for (let dc = 0; dc < HW; dc++) {
        const fc = left + dc;
        if (fc === doorC) safe(fenceR, fc, TILES.PATH);
        else safeProp(fenceR, fc, TILES.FENCE);
      }

      // Short cobblestone gate path from house to town square
      for (let r = fenceR + 1; r <= bldTop - 2; r++) safePath(r, doorC);

      // Flower beds flanking garden gate
      safe(fenceR + 1, left + 1,       TILES.FLOWERS);
      safe(fenceR + 1, left + HW - 2,  TILES.FLOWERS);

      if (id === 1) {
        // Shop counter — 3-tile wide table across the north half of the interior
        safe(top + 2, left + 2, TILES.FURN_TABLE);
        safe(top + 2, left + 3, TILES.FURN_TABLE);
        safe(top + 2, left + 4, TILES.FURN_TABLE);
        // Exterior sign labelled 'SHOP', placed right of the gate path
        safeProp(fenceR + 1, doorC + 1, TILES.SIGN);
        this.signLabels.set(`${doorC + 1},${fenceR + 1}`, 'SHOP');
      }
    });

    // ── TOWN SQUARE — cobblestone plaza between houses and spawn building
    for (let r = bldTop - 6; r < bldTop; r++) {
      for (let c = spawnC - 16; c <= spawnC + 12; c++) {
        safePath(r, c);
      }
    }

    // ── STONE WELL at plaza centre ─────────────────────────────────────
    safeProp(bldTop - 4, spawnC - 1, TILES.WELL);

    // ── COBBLESTONE PATHS alongside spawn building ─────────────────────
    // Two narrow lanes flanking the spawn building let the player walk
    // between the town square (north) and the main street (south).
    for (let r = bldTop; r < spawnR; r++) {
      safePath(r, spawnC - 5);   // west lane (col 507)
      safePath(r, spawnC + 4);   // east lane  (col 516)
    }
    // One tile approach south of building door
    safePath(spawnR - 1, spawnC);

    // ── MAIN EAST–WEST COBBLESTONE STREET (at spawnR row) ─────────────
    // Runs from the forge entrance in the west to the fishing harbour path east.
    for (let c = spawnC - 18; c <= spawnC + 14; c++) safePath(spawnR, c);

    // (Forge props — barrels & sign — are placed in _placeForge after that
    // method clears the surrounding area, so they don't get wiped.)

    // Flower tufts at the four corners of the town square
    for (const [fr, fc] of [
      [bldTop - 6, spawnC - 15], [bldTop - 6, spawnC + 11],
      [bldTop - 2, spawnC - 15], [bldTop - 2, spawnC + 11],
    ]) safe(fr, fc, TILES.FLOWERS);

  }

  _placeForge(map, spawnC, spawnR) {
    // Open-air forge: 9 wide × 4 tall, west of portal, north of spawn
    // Forge is 18 tiles west of spawn center, 3 tiles north
    const FC = spawnC - 18;  // forge left col
    const FR = spawnR - 6;   // forge top row

    // Clear the area first
    for (let r = FR - 1; r <= FR + 4; r++) {
      for (let c = FC - 1; c <= FC + 9; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols)
          map[r][c] = TILES.GRASS;
      }
    }

    // Back wall (north side)
    for (let c = FC; c < FC + 9; c++) {
      if (FR >= 0 && FR < this.rows) map[FR][c] = TILES.WALL;
    }
    // Side walls
    for (let r = FR; r <= FR + 3; r++) {
      if (r >= 0 && r < this.rows) {
        if (FC >= 0) map[r][FC] = TILES.WALL;
        if (FC + 8 < this.cols) map[r][FC + 8] = TILES.WALL;
      }
    }
    // Stone floor interior
    for (let r = FR + 1; r <= FR + 3; r++) {
      for (let c = FC + 1; c <= FC + 7; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols)
          map[r][c] = TILES.STONE;
      }
    }
    // Place Furnace and Anvil; record underlying STONE for transparent rendering
    const furnC = FC + 2, furnR = FR + 1;
    const anvilC = FC + 6, anvilR = FR + 2;
    if (furnR < this.rows && furnC < this.cols) {
      this.propGroundMap.set(`${furnC},${furnR}`, TILES.STONE);
      map[furnR][furnC] = TILES.FURNACE;
    }
    if (anvilR < this.rows && anvilC < this.cols) {
      this.propGroundMap.set(`${anvilC},${anvilR}`, TILES.STONE);
      map[anvilR][anvilC] = TILES.ANVIL;
    }

    // Open south entrance (remove the bottom wall, replace with dirt path)
    for (let c = FC + 3; c <= FC + 5; c++) {
      if (FR + 3 >= 0 && FR + 3 < this.rows && c >= 0 && c < this.cols)
        map[FR + 3][c] = TILES.STONE; // keep floor, no wall
    }
    // Cobblestone path from forge entrance south to main street
    const pathR = FR + 4;
    for (let r = pathR; r <= spawnR; r++) {
      for (let c = FC + 3; c <= FC + 5; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols &&
            map[r][c] !== TILES.PORTAL && map[r][c] !== TILES.WALL)
          map[r][c] = TILES.PATH;
      }
    }

    // Store forge tile positions for game reference
    this.furnaceCol = furnC;
    this.furnaceRow = furnR;
    this.anvilCol   = anvilC;
    this.anvilRow   = anvilR;

    // Decorative props outside the forge (placed after the clear-zone pass)
    const safeProp = (r, c, t) => {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.propGroundMap.set(`${c},${r}`, map[r][c]);
        map[r][c] = t;
      }
    };
    safeProp(FR + 1, FC - 1, TILES.BARREL);   // stacked barrels west of forge
    safeProp(FR + 2, FC - 1, TILES.BARREL);
    safeProp(spawnR - 1, FC + 2, TILES.SIGN); // smithy sign on path approach
  }

  _placeFishingHarbor(map) {
    const spawnC = Math.floor(this.cols / 2);
    const spawnR = Math.floor(this.rows / 2) + 5;

    const C1    = spawnC + 8;   // 520 — west water edge
    const C2    = spawnC + 37;  // 549 — east water edge
    const R1    = spawnR - 12;  // 377 — north water edge
    const R2    = spawnR + 5;   // 394 — south water edge
    const SHORE = R2 + 1;       // 395 — walkable south shore

    // Irregular lake: ellipse with sine-wave boundary distortion (less square)
    const cx2 = (C1 + C2) / 2;
    const cy2 = (R1 + R2) / 2;
    const rx2 = (C2 - C1) / 2 + 2;  // slightly wider than rectangle
    const ry2 = (R2 - R1) / 2 + 2;  // slightly taller
    for (let r = R1 - 2; r <= R2 + 2; r++) {
      for (let c = C1 - 2; c <= C2 + 2; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const dc2 = (c - cx2) / rx2;
        const dr2 = (r - cy2) / ry2;
        const angle = Math.atan2(dr2, dc2);
        // 3-lobe organic distortion for a natural shoreline
        const boundary = 1
          + 0.12 * Math.sin(angle * 2.8 + 0.6)
          + 0.07 * Math.sin(angle * 5.1 - 0.4);
        if (dc2 * dc2 + dr2 * dr2 <= boundary)
          map[r][c] = TILES.WATER;
      }
    }

    // North shore — 1-tile sand strip above lake
    for (let c = C1 - 1; c <= C2 + 1; c++) {
      const r = R1 - 1;
      if (r >= 0 && c >= 0 && c < this.cols) map[r][c] = TILES.SAND;
    }
    // South shore — 2-tile sand strip
    for (let c = C1 - 1; c <= C2 + 1; c++) {
      if (SHORE     < this.rows && c >= 0 && c < this.cols) map[SHORE][c]     = TILES.SAND;
      if (SHORE + 1 < this.rows && c >= 0 && c < this.cols) map[SHORE + 1][c] = TILES.SAND;
    }
    // West shore strip
    for (let r = R1; r <= SHORE + 1; r++) {
      const c = C1 - 1;
      if (r >= 0 && r < this.rows && c >= 0) map[r][c] = TILES.SAND;
    }
    // East shore strip
    for (let r = R1; r <= SHORE + 1; r++) {
      const c = C2 + 1;
      if (r >= 0 && r < this.rows && c < this.cols) map[r][c] = TILES.SAND;
    }

    // West dock pier (col DOCK1 = 526)
    const DOCK1 = spawnC + 14;
    for (let r = R2 - 3; r <= SHORE; r++) {
      if (r >= 0 && r < this.rows) map[r][DOCK1] = TILES.BRIDGE;
    }
    // Widen base (L-shape at shore)
    if (SHORE     < this.rows) { map[SHORE][DOCK1 - 1]     = TILES.BRIDGE; map[SHORE][DOCK1 + 1]     = TILES.BRIDGE; }
    if (SHORE - 1 < this.rows) { map[SHORE - 1][DOCK1 - 1] = TILES.BRIDGE; map[SHORE - 1][DOCK1 + 1] = TILES.BRIDGE; }

    // East dock pier (col DOCK2 = 540)
    const DOCK2 = spawnC + 28;
    for (let r = R2 - 3; r <= SHORE; r++) {
      if (r >= 0 && r < this.rows) map[r][DOCK2] = TILES.BRIDGE;
    }
    if (SHORE     < this.rows) { map[SHORE][DOCK2 - 1]     = TILES.BRIDGE; map[SHORE][DOCK2 + 1]     = TILES.BRIDGE; }
    if (SHORE - 1 < this.rows) { map[SHORE - 1][DOCK2 - 1] = TILES.BRIDGE; map[SHORE - 1][DOCK2 + 1] = TILES.BRIDGE; }

    // Fish spots at dock tips (in water, 1-4 tiles inside lake from south edge)
    const TIP_R = R2 - 4;  // 390
    if (TIP_R >= R1) {
      map[TIP_R][DOCK1]         = TILES.FISH_SPOT;
      map[TIP_R][DOCK1 - 1]     = TILES.FISH_SPOT;
      map[TIP_R][DOCK2]         = TILES.FISH_SPOT;
      map[TIP_R][DOCK2 + 1]     = TILES.FISH_SPOT;
      map[TIP_R - 1][DOCK1 + 1] = TILES.FISH_SPOT;
      map[TIP_R - 1][DOCK2 - 1] = TILES.FISH_SPOT;
    }
    // Shore-adjacent spots along the south edge (fishable from SHORE row)
    map[R2][C1 + 4]  = TILES.FISH_SPOT;
    map[R2][C1 + 8]  = TILES.FISH_SPOT;
    map[R2][C2 - 4]  = TILES.FISH_SPOT;
    map[R2][C2 - 8]  = TILES.FISH_SPOT;

    // Fisherman's hut (small building south of west dock)
    const HUT_C = spawnC + 16;  // 528
    const HUT_R = SHORE + 1;    // 396
    this._placeBuilding(map, HUT_C, HUT_R, 7, 5);

    // Walkable grass path connecting spawn to south shore
    for (let r = spawnR; r <= SHORE + 1; r++) {
      for (let c = spawnC + 4; c < C1; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols && map[r][c] !== TILES.WATER)
          map[r][c] = TILES.GRASS;
      }
    }
  }

  _placeDungeons(map, spawnC, spawnR) {
    const entries = [
      { id: 'dungeon_goblin_cave',   col: spawnC + 15,  row: spawnR - 55  },
      { id: 'dungeon_spider_den',    col: spawnC + 110, row: spawnR - 85  },
      { id: 'dungeon_ancient_mines', col: spawnC + 265, row: spawnR + 145 },
    ];
    for (const { id, col, row } of entries) {
      const c = Math.max(4, Math.min(this.cols - 5, col));
      const r = Math.max(3, Math.min(this.rows - 4, row));

      // 7×5 stone shrine around the entrance ladder
      // Layout (dc = -3..+3, dr = -2..+2):
      //   top row:     W W W W W W W
      //   rows -1..+1: W S S S S S W  (stone floor, side walls)
      //   bottom row:  W W D D D W W  (D = dirt opening, player approaches from south)
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          const tc = c + dc, tr = r + dr;
          if (tc < 0 || tr < 0 || tc >= this.cols || tr >= this.rows) continue;
          const isPerimeter = dr === -2
                            || dc === -3 || dc === 3
                            || (dr === 2 && Math.abs(dc) >= 2);
          const isOpeningBottom = dr === 2 && Math.abs(dc) <= 1;
          if (isOpeningBottom) {
            map[tr][tc] = TILES.DIRT;
          } else {
            map[tr][tc] = isPerimeter ? TILES.WALL : TILES.STONE;
          }
        }
      }

      // Ladder tile (DUNGEON_ENTRANCE) at shrine centre
      map[r][c] = TILES.DUNGEON_ENTRANCE;
      this.propGroundMap.set(`${c},${r}`, TILES.STONE);
      this.dungeonMap.set(`${c},${r}`, id);
    }
  }

  _placeBuilding(map, x, y, w, h) {
    for (let r = y; r < y + h && r < this.rows; r++) {
      for (let c = x; c < x + w && c < this.cols; c++) {
        if (r < 0 || c < 0) continue;
        if (r === y || r === y + h - 1 || c === x || c === x + w - 1) {
          map[r][c] = TILES.WALL;
        } else {
          map[r][c] = TILES.STONE;
        }
      }
    }
    const doorC = x + Math.floor(w / 2);
    const doorR = y + h - 1;
    if (doorR < this.rows && doorC < this.cols) {
      map[doorR][doorC] = TILES.DIRT;
    }
  }

  _placeBridges(map, rng) {
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (map[r][c] !== TILES.WATER) continue;
        const leftRight = !SOLID_TILES.has(map[r][c - 1]) && !SOLID_TILES.has(map[r][c + 1])
                        && map[r][c - 1] !== TILES.WATER && map[r][c + 1] !== TILES.WATER;
        if (leftRight && rng() < 0.12) {
          map[r][c] = TILES.BRIDGE;
        }
      }
    }
  }

  // Bilinear-interpolated noise grid
  _noiseGrid(cols, rows, scale, rng) {
    const sw = Math.ceil(cols / scale) + 2;
    const sh = Math.ceil(rows / scale) + 2;
    const seed = Array.from({ length: sh }, () =>
      Array.from({ length: sw }, () => rng())
    );
    const grid = Array.from({ length: rows }, () => new Float32Array(cols));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = c / scale;
        const sy = r / scale;
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const fx = sx - x0;
        const fy = sy - y0;
        const a  = seed[y0]?.[x0]     ?? 0;
        const b  = seed[y0]?.[x0 + 1] ?? 0;
        const cc = seed[y0 + 1]?.[x0]     ?? 0;
        const d  = seed[y0 + 1]?.[x0 + 1] ?? 0;
        // Smoothstep interpolation for softer transitions
        const ux = fx * fx * (3 - 2 * fx);
        const uy = fy * fy * (3 - 2 * fy);
        const top = a + (b - a) * ux;
        const bot = cc + (d - cc) * ux;
        grid[r][c] = top + (bot - top) * uy;
      }
    }
    return grid;
  }

  /* ── Queries / mutations ────────────────────────────── */
  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TILES.WATER;
    }
    return this.tiles[row][col];
  }

  setTile(col, row, tile) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.tiles[row][col] = tile;
    this.dirty = true;
    this.changedTiles.push(col | (row << 16));
  }

  isSolid(col, row) {
    return SOLID_TILES.has(this.getTile(col, row));
  }

  isBlocked(x, y, w, h) {
    const c0 = Math.floor(x / TILE_SIZE);
    const r0 = Math.floor(y / TILE_SIZE);
    const c1 = Math.floor((x + w - 1) / TILE_SIZE);
    const r1 = Math.floor((y + h - 1) / TILE_SIZE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (this.isSolid(c, r)) return true;
      }
    }
    return false;
  }
}
