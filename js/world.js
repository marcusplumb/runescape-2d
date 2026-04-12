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

// Biome ore tables — [common, rare]. Indexed by biome string key.
// "common" spawns at most cluster seeds; "rare" appears at high rockCluster peaks.
const BIOME_ORES = {
  [BIOMES.PLAINS]:   [TILES.ROCK_COPPER,  TILES.ROCK_TIN],
  [BIOMES.FOREST]:   [TILES.ROCK_IRON,    TILES.ROCK_COPPER],
  [BIOMES.TUNDRA]:   [TILES.ROCK_IRON,    TILES.ROCK_COAL],
  [BIOMES.SWAMP]:    [TILES.ROCK_COAL,    TILES.ROCK_COPPER],
  [BIOMES.DESERT]:   [TILES.ROCK_GOLD,    TILES.ROCK_COAL],
  [BIOMES.VOLCANIC]: [TILES.ROCK_MITHRIL, TILES.ROCK_GOLD],
  [BIOMES.DANGER]:   [TILES.ROCK_GOLD,    TILES.ROCK_MITHRIL],
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
        let t  = v * 0.75 + dv * 0.25;

        // ── Edge-water border ────────────────────────────────
        // Fade terrain to minimum (water) within 40 tiles of any map border.
        // Using nearest-edge distance (not center distance) ensures peripheral
        // biomes like Tundra, Volcanic, and Danger are NOT crushed — their tiles
        // are 100+ tiles from the actual map boundary and remain at full noise.
        const edgeDist = Math.min(r, this.rows - 1 - r, c, this.cols - 1 - c);
        t = t * Math.min(edgeDist / 40, 1.0);

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

    // ── Shore smoothing ──────────────────────────────────
    // Convert any GRASS or DARK_GRASS tile that directly borders WATER or
    // SWAMP_WATER to SAND.  This guarantees a non-green buffer at every water
    // edge so neither bare terrain tiles nor prop-tile backgrounds ever render
    // green inside what visually reads as the water body.
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        const t = map[r][c];
        if (t !== TILES.GRASS && t !== TILES.DARK_GRASS) continue;
        if (
          map[r-1][c] === TILES.WATER || map[r+1][c] === TILES.WATER ||
          map[r][c-1] === TILES.WATER || map[r][c+1] === TILES.WATER ||
          map[r-1][c] === TILES.SWAMP_WATER || map[r+1][c] === TILES.SWAMP_WATER ||
          map[r][c-1] === TILES.SWAMP_WATER || map[r][c+1] === TILES.SWAMP_WATER
        ) {
          map[r][c] = TILES.SAND;
        }
      }
    }

    // ── Erosion pass (2 iterations) ───────────────────────
    // Any GRASS/DIRT tile with 3+ adjacent WATER becomes SAND.
    // Any SAND tile with 3+ adjacent WATER becomes WATER.
    // Smooths beaches and creates gradual coastal transitions.
    for (let pass = 0; pass < 2; pass++) {
      for (let r = 1; r < this.rows - 1; r++) {
        for (let c = 1; c < this.cols - 1; c++) {
          const t = map[r][c];
          if (t !== TILES.GRASS && t !== TILES.DIRT && t !== TILES.SAND &&
              t !== TILES.DARK_GRASS) continue;
          const neighbors4 = [
            map[r-1][c], map[r+1][c], map[r][c-1], map[r][c+1],
          ];
          const waterCount = neighbors4.filter(n => n === TILES.WATER).length;
          if (waterCount >= 3) {
            if (t === TILES.SAND) {
              map[r][c] = TILES.WATER;
            } else {
              map[r][c] = TILES.SAND;
            }
          }
        }
      }
    }

    // ── Small island clusters ─────────────────────────────
    // Scatter 6–12 island groups in open WATER areas, each at least
    // 30 tiles from the main landmass.  Each island is a 5–9 tile
    // circular patch with trees and a chance of a rare resource.
    {
      const islandCount = 6 + Math.floor(rng() * 7); // 6–12
      const ISLAND_MIN_DIST = 30; // min tiles from nearest non-WATER tile
      const candidates = [];

      // Build candidate water tiles that are far enough from land
      // Sample sparsely to keep generation fast
      for (let r = 10; r < this.rows - 10; r += 3) {
        for (let c = 10; c < this.cols - 10; c += 3) {
          if (map[r][c] !== TILES.WATER) continue;
          // Check a rough bounding box for land proximity
          let farEnough = true;
          outerCheck:
          for (let dr = -ISLAND_MIN_DIST; dr <= ISLAND_MIN_DIST; dr += 4) {
            for (let dc = -ISLAND_MIN_DIST; dc <= ISLAND_MIN_DIST; dc += 4) {
              const nr = r + dr, nc = c + dc;
              if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
              if (map[nr][nc] !== TILES.WATER) { farEnough = false; break outerCheck; }
            }
          }
          if (farEnough) candidates.push({ r, c });
        }
      }

      // Shuffle candidates and pick island centres
      candidates.sort(() => rng() - 0.5);
      const placed = [];
      for (const cand of candidates) {
        if (placed.length >= islandCount) break;
        // Ensure islands are at least 20 tiles apart from each other
        const tooClose = placed.some(p =>
          Math.abs(p.r - cand.r) + Math.abs(p.c - cand.c) < 20
        );
        if (tooClose) continue;
        placed.push(cand);

        // Draw island using a circular brush (radius 2–4 tiles)
        const radius = 2 + Math.floor(rng() * 3); // 2–4
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = cand.r + dr, nc = cand.c + dc;
            if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
            if (dr * dr + dc * dc > radius * radius) continue; // circular shape
            // Centre tiles are GRASS, ring tiles alternate GRASS/SAND
            const distSq = dr * dr + dc * dc;
            if (distSq <= (radius - 1) * (radius - 1)) {
              map[nr][nc] = TILES.GRASS;
            } else {
              map[nr][nc] = TILES.SAND;
            }
          }
        }

        // Place 1–3 trees on the island
        const treeCount = 1 + Math.floor(rng() * 3);
        let treesPlaced = 0;
        for (let attempt = 0; attempt < 20 && treesPlaced < treeCount; attempt++) {
          const tr = cand.r + Math.floor((rng() * 2 - 1) * (radius - 1));
          const tc = cand.c + Math.floor((rng() * 2 - 1) * (radius - 1));
          if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols &&
              map[tr][tc] === TILES.GRASS) {
            map[tr][tc] = TILES.TREE;
            treesPlaced++;
          }
        }

        // 40% chance of a rare resource (ROCK_GOLD or FISH_SPOT)
        if (rng() < 0.40) {
          const rare = rng() < 0.5 ? TILES.ROCK_GOLD : TILES.FISH_SPOT;
          // Place rare resource on a non-tree grass tile near centre
          for (let attempt = 0; attempt < 10; attempt++) {
            const rr = cand.r + Math.floor((rng() * 2 - 1) * Math.max(1, radius - 2));
            const rc = cand.c + Math.floor((rng() * 2 - 1) * Math.max(1, radius - 2));
            if (rr >= 0 && rr < this.rows && rc >= 0 && rc < this.cols &&
                map[rr][rc] === TILES.GRASS) {
              // FISH_SPOT must be in water — place it adjacent to shore instead
              if (rare === TILES.FISH_SPOT) {
                map[rr][rc] = TILES.FISH_SPOT;
              } else {
                map[rr][rc] = TILES.ROCK_GOLD;
              }
              break;
            }
          }
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

        // Prevent any prop with a green/grass ground background from appearing
        // adjacent to water — those green squares look like grass inside the water.
        const adjWater = (
          map[r-1]?.[c] === TILES.WATER || map[r+1]?.[c] === TILES.WATER ||
          map[r]?.[c-1] === TILES.WATER || map[r]?.[c+1] === TILES.WATER ||
          map[r-1]?.[c] === TILES.SWAMP_WATER || map[r+1]?.[c] === TILES.SWAMP_WATER ||
          map[r]?.[c-1] === TILES.SWAMP_WATER || map[r]?.[c+1] === TILES.SWAMP_WATER
        );

        if (biome === BIOMES.FOREST) {
          // Dense forest — trees fill high-cluster areas, but leave some clearings
          if (!adjWater && (t === TILES.DARK_GRASS || t === TILES.GRASS) && cn > 0.52 && rng() < 0.75) {
            _setProp(r, c, TILES.TREE);
          }
        } else if (biome === BIOMES.TUNDRA) {
          // Sparse trees on snow, ice, and frozen stone — radial gradient pushes most tundra to ICE
          if ((t === TILES.SNOW || t === TILES.ICE || t === TILES.STONE) && cn > 0.68 && rng() < 0.30) {
            _setProp(r, c, TILES.OAK_TREE);
          }
        } else if (biome === BIOMES.SWAMP) {
          // Willows grow in shallow swamp water; stumps on muddy ground
          const onGround = (t === TILES.DEAD_GRASS || t === TILES.DARK_GRASS || t === TILES.DIRT);
          const inSwampWater = (t === TILES.SWAMP_WATER);
          if ((onGround || inSwampWater) && cn > 0.58 && rng() < 0.18) {
            _setProp(r, c, inSwampWater ? TILES.WILLOW_TREE : TILES.STUMP);
          }
        } else if (biome === BIOMES.DESERT) {
          // Cacti — sparse, only in small tight clusters (sand background — not green)
          if ((t === TILES.SAND || t === TILES.SAND_DARK) && cn > 0.78 && rng() < 0.18) {
            _setProp(r, c, TILES.CACTUS);
          }
        } else if (biome === BIOMES.DANGER || biome === BIOMES.VOLCANIC) {
          // Charred stumps — radial gradient collapses peripheral tiles to LAVA/VOLCANIC_ROCK
          if ((t === TILES.VOLCANIC_ROCK || t === TILES.DEAD_GRASS ||
               t === TILES.DARK_GRASS   || t === TILES.LAVA) && cn > 0.76 && rng() < 0.10) {
            _setProp(r, c, TILES.STUMP);
          }
        } else {
          // Plains — moderate tree clusters with open clearings
          if (!adjWater && (t === TILES.GRASS || t === TILES.DARK_GRASS) && cn > 0.65 && rng() < 0.55) {
            _setProp(r, c, TILES.TREE);
          }
          // Flowers only in open grass, away from tree clusters and water
          if (!adjWater && t === TILES.GRASS && cn < 0.35 && rng() < 0.12) {
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

    // ── Phase 2c: Forageable overworld resources ─────────
    // Each resource is biome-specific and placed sparingly.
    // "_setProp" records the original ground tile so the renderer draws it beneath the plant.
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        const t     = map[r][c];
        const cn    = clusterNoise[r][c];
        const biome = getBiome(c, r);

        // Pre-compute water adjacency once — used to exclude non-reed forageables
        // from shore tiles (their solid GRASS background reads as "grass in water").
        const nearWater = (
          map[r-1][c] === TILES.WATER || map[r+1][c] === TILES.WATER ||
          map[r][c-1] === TILES.WATER || map[r][c+1] === TILES.WATER ||
          map[r-1][c] === TILES.SWAMP_WATER || map[r+1][c] === TILES.SWAMP_WATER ||
          map[r][c-1] === TILES.SWAMP_WATER || map[r][c+1] === TILES.SWAMP_WATER
        );

        // Berry bush — Forest clearings and open Plains only; away from tree clusters
        if (!nearWater && (t === TILES.DARK_GRASS || t === TILES.GRASS) &&
            (biome === BIOMES.FOREST || biome === BIOMES.PLAINS) &&
            cn < 0.40 && rng() < 0.012) {
          _setProp(r, c, TILES.BERRY_BUSH);
          continue;
        }

        // Mushroom — shadowed spots in Swamp (uncommon) and deep Forest (rare)
        if (!nearWater && (t === TILES.DARK_GRASS || t === TILES.DEAD_GRASS || t === TILES.DIRT) &&
            (biome === BIOMES.SWAMP || biome === BIOMES.FOREST) &&
            cn < 0.45 && rng() < (biome === BIOMES.SWAMP ? 0.020 : 0.006)) {
          _setProp(r, c, TILES.MUSHROOM);
          continue;
        }

        // Wild herb — only in very open meadow grass (low cluster, Plains + Forest edges)
        if (!nearWater && t === TILES.GRASS &&
            (biome === BIOMES.PLAINS || biome === BIOMES.FOREST) &&
            cn < 0.28 && rng() < 0.014) {
          _setProp(r, c, TILES.WILD_HERB);
          continue;
        }

        // Flax plant — Plains only, open grass, small pockets
        if (!nearWater && t === TILES.GRASS && biome === BIOMES.PLAINS &&
            cn < 0.32 && rng() < 0.010) {
          _setProp(r, c, TILES.FLAX_PLANT);
          continue;
        }

        // Snowberry bush — Tundra only, on snow/ice/stone (radial gradient collapses most to ICE)
        if (!nearWater && (t === TILES.SNOW || t === TILES.ICE || t === TILES.STONE) &&
            biome === BIOMES.TUNDRA && rng() < 0.008) {
          _setProp(r, c, TILES.SNOWBERRY);
          continue;
        }

        // Sulfur deposit — Volcanic biome only, on volcanic rock, lava, or dead grass
        if (!nearWater && (t === TILES.VOLCANIC_ROCK || t === TILES.LAVA || t === TILES.DEAD_GRASS) &&
            biome === BIOMES.VOLCANIC && rng() < 0.010) {
          _setProp(r, c, TILES.SULFUR_ROCK);
          continue;
        }

        // Thorn bush — Danger zone only; peripheral tiles collapse to LAVA so include it
        if (!nearWater && (t === TILES.DEAD_GRASS || t === TILES.DARK_GRASS ||
            t === TILES.VOLCANIC_ROCK || t === TILES.LAVA) &&
            biome === BIOMES.DANGER && rng() < 0.014) {
          _setProp(r, c, TILES.THORN_BUSH);
          continue;
        }

        // Desert flower — Desert only, on SAND_DARK (sheltered dune sides), very rare
        if (!nearWater && t === TILES.SAND_DARK && biome === BIOMES.DESERT && rng() < 0.007) {
          _setProp(r, c, TILES.DESERT_FLOWER);
          continue;
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
        // LAVA added to stoneBase: Volcanic/Danger tiles collapse to LAVA via radial gradient
        // ICE added to groundBase: Tundra tiles collapse to ICE via radial gradient
        const stoneBase = (t === TILES.STONE || t === TILES.VOLCANIC_ROCK || t === TILES.LAVA);
        const groundBase = (
          t === TILES.DIRT || t === TILES.GRASS ||
          t === TILES.DARK_GRASS || t === TILES.DEAD_GRASS || t === TILES.SNOW || t === TILES.ICE
        );

        // Surface ores are rare pockets — only at the very peak of stone clusters.
        // Open ground outcrops are nearly non-existent.
        const threshold = stoneBase ? 0.88 : 0.97;
        const chance    = stoneBase ? 0.18 : 0.03;

        const adjWaterOre = (
          map[r-1]?.[c] === TILES.WATER || map[r+1]?.[c] === TILES.WATER ||
          map[r]?.[c-1] === TILES.WATER || map[r]?.[c+1] === TILES.WATER ||
          map[r-1]?.[c] === TILES.SWAMP_WATER || map[r+1]?.[c] === TILES.SWAMP_WATER ||
          map[r]?.[c-1] === TILES.SWAMP_WATER || map[r]?.[c+1] === TILES.SWAMP_WATER
        );
        if (rk > threshold && rng() < chance) {
          // Always pick the lowest-tier ore for the biome — no escalation to rarer types
          _setProp(r, c, ores[0]);
        } else if (!adjWaterOre && groundBase && rk > 0.97 && rng() < 0.01 && ores.length > 0) {
          // Extremely rare surface outcrop on open ground — always lowest tier
          _setProp(r, c, ores[0]);
        }
      }
    }

    // ── Phase 4: Fishing spots ────────────────────────────
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        const t = map[r][c];
        // Include LAVA for Volcanic biome (lava eel / magma carp fishing)
        const biomeHere = getBiome(c, r);
        const isLava  = (t === TILES.LAVA && biomeHere === BIOMES.VOLCANIC);
        const isWater = (t === TILES.WATER || t === TILES.SWAMP_WATER || isLava);
        if (!isWater) continue;

        const neighbors = [
          map[r - 1]?.[c], map[r + 1]?.[c],
          map[r]?.[c - 1], map[r]?.[c + 1],
        ];
        const hasLand = neighbors.some(n =>
          n !== undefined && n !== TILES.WATER && n !== TILES.SWAMP_WATER && n !== TILES.LAVA &&
          !SOLID_TILES.has(n)
        );
        // For lava spots, also accept volcanic rock / stone as a "bank"
        const hasLavaEdge = isLava && neighbors.some(n =>
          n === TILES.VOLCANIC_ROCK || n === TILES.STONE || n === TILES.DEAD_GRASS
        );
        if ((!hasLand && !hasLavaEdge) || rng() > 0.055) continue;

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

    // ── Phase 11: World entry road stubs ─────────────────────────────────
    // Short stone roads extending from the kingdom toward each map edge,
    // implying the world continues beyond the visible area.
    {
      const kingdomC = Math.floor(this.cols / 2);
      const kingdomR = 208; // matches STRUCTURE_NODES kingdom node r:208
      const STUB_LEN = 20;
      const STUB_W   = 2;
      const roadTile = TILES.STONE; // kingdom roads are stone

      // North stub
      for (let i = 0; i < STUB_LEN; i++) {
        for (let w = 0; w < STUB_W; w++) {
          const r = kingdomR - i, c = kingdomC + w;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            const t = map[r][c];
            if (t !== TILES.WALL && t !== TILES.WATER && t !== TILES.LAVA) map[r][c] = roadTile;
          }
        }
      }
      // South stub
      for (let i = 0; i < STUB_LEN; i++) {
        for (let w = 0; w < STUB_W; w++) {
          const r = kingdomR + 60 + i, c = kingdomC + w;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            const t = map[r][c];
            if (t !== TILES.WALL && t !== TILES.WATER && t !== TILES.LAVA) map[r][c] = roadTile;
          }
        }
      }
      // East stub
      for (let i = 0; i < STUB_LEN; i++) {
        for (let w = 0; w < STUB_W; w++) {
          const c = kingdomC + 38 + i, r = kingdomR + 30 + w;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            const t = map[r][c];
            if (t !== TILES.WALL && t !== TILES.WATER && t !== TILES.LAVA) map[r][c] = roadTile;
          }
        }
      }
      // West stub
      for (let i = 0; i < STUB_LEN; i++) {
        for (let w = 0; w < STUB_W; w++) {
          const c = kingdomC - 38 - i, r = kingdomR + 30 + w;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            const t = map[r][c];
            if (t !== TILES.WALL && t !== TILES.WATER && t !== TILES.LAVA) map[r][c] = roadTile;
          }
        }
      }
    }

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
        if (dc2 * dc2 + dr2 * dr2 <= boundary) {
          map[r][c] = TILES.WATER;
          // Remove any stale prop background from vegetation phases — the lake
          // overwrites whatever was generated here, and the animated-water
          // renderer uses propGroundMap as the background colour.  A leftover
          // GRASS entry would render green under the blue water waves.
          this.propGroundMap.delete(`${c},${r}`);
        }
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
