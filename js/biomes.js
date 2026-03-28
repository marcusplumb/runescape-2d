/**
 * Biome system for a 1024×768 world.
 *
 * Instead of hard rectangular blocks, biomes are defined by a set of
 * "seed points" spread across the map. Each tile's biome is determined
 * by the nearest seed point after applying a low-frequency noise warp
 * to the coordinates — this makes borders organic and irregular.
 *
 * Spawn: ~col 512, row 389 (WORLD_COLS/2, WORLD_ROWS/2 + 5)
 */

export const BIOMES = {
  PLAINS:   'plains',
  FOREST:   'forest',
  TUNDRA:   'tundra',
  SWAMP:    'swamp',
  DESERT:   'desert',
  VOLCANIC: 'volcanic',
  DANGER:   'danger',
};

// Integer IDs for fast storage in typed arrays
const BIOME_ID = {
  [BIOMES.PLAINS]:   0,
  [BIOMES.FOREST]:   1,
  [BIOMES.TUNDRA]:   2,
  [BIOMES.SWAMP]:    3,
  [BIOMES.DESERT]:   4,
  [BIOMES.VOLCANIC]: 5,
  [BIOMES.DANGER]:   6,
};
const ID_BIOME = Object.fromEntries(Object.entries(BIOME_ID).map(([k,v]) => [v,k]));

/**
 * Voronoi seed points. Multiple seeds per biome create larger, more
 * natural-shaped regions.
 *
 * Coordinates are on the 1024×768 grid.
 * DANGER is placed in the NE quadrant, far from spawn.
 */
const SEEDS = [
  // Central safe area — spawn is here
  { biome: BIOMES.PLAINS, cx: 512, cy: 390 },
  { biome: BIOMES.PLAINS, cx: 380, cy: 430 },
  { biome: BIOMES.PLAINS, cx: 640, cy: 430 },
  { biome: BIOMES.PLAINS, cx: 490, cy: 530 },

  // Forest — upper-centre and upper-left, surrounds plains from the north
  { biome: BIOMES.FOREST, cx: 300, cy: 280 },
  { biome: BIOMES.FOREST, cx: 512, cy: 220 },
  { biome: BIOMES.FOREST, cx: 680, cy: 310 },
  { biome: BIOMES.FOREST, cx: 420, cy: 330 },

  // Tundra — far north-west corner
  { biome: BIOMES.TUNDRA, cx: 110, cy: 110 },
  { biome: BIOMES.TUNDRA, cx: 230, cy: 150 },
  { biome: BIOMES.TUNDRA, cx: 130, cy: 300 },

  // Swamp — south-west
  { biome: BIOMES.SWAMP, cx: 180, cy: 560 },
  { biome: BIOMES.SWAMP, cx: 280, cy: 670 },
  { biome: BIOMES.SWAMP, cx: 140, cy: 700 },

  // Desert — south-centre and south-east lower
  { biome: BIOMES.DESERT, cx: 560, cy: 660 },
  { biome: BIOMES.DESERT, cx: 700, cy: 700 },
  { biome: BIOMES.DESERT, cx: 450, cy: 720 },

  // Volcanic — east, mid-south
  { biome: BIOMES.VOLCANIC, cx: 850, cy: 530 },
  { biome: BIOMES.VOLCANIC, cx: 920, cy: 420 },
  { biome: BIOMES.VOLCANIC, cx: 800, cy: 650 },

  // Danger zone — far north-east (most distant from spawn)
  { biome: BIOMES.DANGER, cx: 880, cy: 130 },
  { biome: BIOMES.DANGER, cx: 950, cy: 230 },
  { biome: BIOMES.DANGER, cx: 780, cy: 190 },
];

/** Precomputed biome map — filled once by buildBiomeMap() */
let _biomeMap = null;
let _cols = 0, _rows = 0;

/**
 * Build the biome map using noise-warped Voronoi.
 * Must be called once during World construction, passing the two noise grids
 * (warpX, warpY) that displace the coordinate used for distance tests.
 * Warp strength of ~80-100 tiles creates naturally irregular borders.
 */
export function buildBiomeMap(cols, rows, warpX, warpY) {
  _cols = cols;
  _rows = rows;
  _biomeMap = new Uint8Array(rows * cols);

  const WARP = 110; // tiles of maximum coordinate displacement

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Warp the query point so borders aren't straight
      const wx = c + (warpX[r][c] - 0.5) * WARP;
      const wy = r + (warpY[r][c] - 0.5) * WARP;

      let bestId = BIOME_ID[BIOMES.PLAINS];
      let bestDist = Infinity;

      for (const s of SEEDS) {
        const dx = wx - s.cx;
        const dy = wy - s.cy;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestId = BIOME_ID[s.biome];
        }
      }

      _biomeMap[r * cols + c] = bestId;
    }
  }
}

/** Returns the biome string for a tile coordinate. */
export function getBiome(col, row) {
  if (!_biomeMap) return BIOMES.PLAINS;
  if (col < 0 || col >= _cols || row < 0 || row >= _rows) return BIOMES.PLAINS;
  return ID_BIOME[_biomeMap[row * _cols + col]];
}

/** Returns true if the tile is in the danger zone. */
export function isDangerZone(col, row) {
  return getBiome(col, row) === BIOMES.DANGER;
}

