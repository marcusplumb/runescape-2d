/**
 * Interior maps — small hand-crafted tile grids for building interiors.
 * Each interior has the same getTile/isSolid API as World so the renderer
 * and player movement work without modification.
 *
 * Entering: player walks onto TILES.DOOR in the world → fade → interior
 * Exiting:  player walks onto TILES.STAIRS in interior → fade → world
 */
import { TILES, SOLID_TILES, TILE_SIZE } from './constants.js';
import {
  FURNITURE_DEFS, rotatedFootprint, ROOM_DEFS,
  CELL_INNER, CELL_STRIDE, GRID_COLS, GRID_ROWS,
  HOUSE_MAP_SIZE, cellInnerOrigin,
} from './housing.js';
import { PATCH_LOCAL_POSITIONS, GROW_STAGES } from './farming.js';

/* ── Interior map class ─────────────────────────────── */

export class InteriorMap {
  /**
   * @param {string} id
   * @param {string} name        Shown at top of screen while inside
   * @param {number} cols
   * @param {number} rows
   * @param {Uint8Array} tiles   Flat row-major array, length = cols*rows
   * @param {number} entryCol    Where the player appears when entering
   * @param {number} entryRow
   */
  constructor(id, name, cols, rows, tiles, entryCol, entryRow) {
    this.id         = id;
    this.name       = name;
    this.cols       = cols;
    this.rows       = rows;
    this._tiles     = tiles;
    this._rotations = new Uint8Array(cols * rows); // 0-3, furniture rotation
    this.entryCol    = entryCol;
    this.entryRow    = entryRow;
    this.changedTiles = [];
    this.propGroundMap = new Map(); // underlying floor tile for prop/furniture tiles
  }

  getTile(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return TILES.WALL;
    return this._tiles[r * this.cols + c];
  }

  isSolid(c, r) {
    return SOLID_TILES.has(this.getTile(c, r));
  }

  isBlocked(x, y, w, h) {
    const c0 = Math.floor(x / TILE_SIZE);
    const r0 = Math.floor(y / TILE_SIZE);
    const c1 = Math.floor((x + w - 1) / TILE_SIZE);
    const r1 = Math.floor((y + h - 1) / TILE_SIZE);
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        if (this.isSolid(c, r)) return true;
    return false;
  }

  setTile(c, r, tile, rotation = 0) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    const idx = r * this.cols + c;
    this._tiles[idx]     = tile;
    this._rotations[idx] = rotation & 3;
    this.changedTiles.push(c | (r << 16));
  }

  getRotation(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return 0;
    return this._rotations[r * this.cols + c];
  }
}

/* ── Tile grid helpers ──────────────────────────────── */

function _grid(cols, rows) {
  return new Uint8Array(cols * rows).fill(TILES.WALL);
}

function _fill(tiles, cols, c, r, w, h, tile) {
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      tiles[(r + dr) * cols + (c + dc)] = tile;
    }
  }
}

function _set(tiles, cols, c, r, tile) {
  tiles[r * cols + c] = tile;
}

/* ── Layout builders ────────────────────────────────── */

/**
 * Generic village house interior (14 wide × 10 tall).
 * All village house entrances share this template.
 */
function _buildHouseInterior(id) {
  const W = 14, H = 10;
  const t = _grid(W, H);

  // Stone floor
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Fireplace in NW corner (2 tiles)
  _set(t, W, 1, 1, TILES.FIRE);
  _set(t, W, 2, 1, TILES.FIRE);

  // Table (solid wall blocks in middle of room)
  _set(t, W, 5, 4, TILES.WALL);
  _set(t, W, 6, 4, TILES.WALL);
  _set(t, W, 7, 4, TILES.WALL);

  // Stairs (exit) at bottom centre
  const exitC = 7, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap(id, 'Village House', W, H, t, exitC, exitR - 1);
}

/**
 * Castle throne room (36 wide × 22 tall).
 */
function _buildCastleKeepInterior() {
  const W = 36, H = 22;
  const t = _grid(W, H);

  // Stone floor throughout
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Central carpet / aisle (dirt — darker colour)
  _fill(t, W, W >> 1, 1, 1, H - 2, TILES.DIRT);

  // Throne at north wall — raised dais of wall blocks
  _set(t, W, 17, 1, TILES.WALL);
  _set(t, W, 18, 1, TILES.WALL);  // throne centre
  _set(t, W, 19, 1, TILES.WALL);

  // Torches (fire) near throne and at entrance
  _set(t, W, 1,  1,  TILES.FIRE);
  _set(t, W, 34, 1,  TILES.FIRE);
  _set(t, W, 1,  20, TILES.FIRE);
  _set(t, W, 34, 20, TILES.FIRE);

  // Pillars down each side (6 pairs)
  for (let pr = 4; pr < H - 2; pr += 4) {
    _set(t, W, 3,      pr, TILES.WALL);
    _set(t, W, W - 4,  pr, TILES.WALL);
  }

  // Stairs at south centre
  const exitC = 18, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap('castle_keep', 'Castle — Throne Room', W, H, t, exitC, exitR - 1);
}

/**
 * Watchtower guard room (10 wide × 10 tall).
 */
function _buildWatchtowerInterior(id) {
  const W = 10, H = 10;
  const t = _grid(W, H);

  // Stone floor
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Weapon racks (wall blocks) on each side
  _set(t, W, 2, 3, TILES.WALL);
  _set(t, W, 3, 3, TILES.WALL);
  _set(t, W, 6, 3, TILES.WALL);
  _set(t, W, 7, 3, TILES.WALL);

  // Torches in upper corners
  _set(t, W, 1, 1, TILES.FIRE);
  _set(t, W, W - 2, 1, TILES.FIRE);

  // Stairs at bottom centre
  const exitC = 5, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap(id, 'Watchtower', W, H, t, exitC, exitR - 1);
}

/**
 * Military outpost barracks (18 wide × 12 tall).
 */
function _buildOutpostInterior() {
  const W = 18, H = 12;
  const t = _grid(W, H);

  // Stone floor
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Bunks on west and east walls (pairs of wall blocks)
  for (let br = 2; br <= 8; br += 2) {
    _set(t, W, 2,      br, TILES.WALL);
    _set(t, W, W - 3,  br, TILES.WALL);
  }

  // Central table
  _set(t, W, 7,  5, TILES.WALL);
  _set(t, W, 8,  5, TILES.WALL);
  _set(t, W, 9,  5, TILES.WALL);
  _set(t, W, 10, 5, TILES.WALL);

  // Torches / hearth
  _set(t, W, 1,  1, TILES.FIRE);
  _set(t, W, W - 2, 1, TILES.FIRE);

  // Stairs at bottom centre
  const exitC = 9, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap('outpost_interior', 'Outpost Barracks', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom throne room (44 wide × 30 tall) — grand carpeted hall with raised throne.
 */
function _buildKingdomKeepInterior() {
  const W = 44, H = 30;
  const t = _grid(W, H);

  // Stone floor throughout
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Grand carpet — 4 tiles wide, runs from south entrance to the throne dais
  const carpetC = (W >> 1) - 2;
  for (let r = 2; r < H - 4; r++) {
    for (let cc = carpetC; cc < carpetC + 4; cc++) {
      _set(t, W, cc, r, TILES.CARPET);
    }
  }

  // Throne dais — stone platform at north end (full width inner)
  _fill(t, W, 2, 1, W - 4, 5, TILES.WALL);
  // Open walkable platform top
  _fill(t, W, 3, 2, W - 6, 3, TILES.STONE);
  // Carpet on the dais leading to throne
  for (let r = 2; r <= 4; r++) {
    for (let cc = carpetC; cc < carpetC + 4; cc++) {
      _set(t, W, cc, r, TILES.CARPET);
    }
  }
  // Throne itself — centred on the dais back wall
  _set(t, W, (W >> 1) - 1, 1, TILES.THRONE);
  _set(t, W,  W >> 1,      1, TILES.THRONE);

  // Torch braziers flanking throne on dais
  _set(t, W, 4,      2, TILES.FIRE);
  _set(t, W, W - 5,  2, TILES.FIRE);

  // Grand pillars flanking the carpet (4 pairs, stone columns with fire tops)
  for (let pr = 6; pr <= 22; pr += 5) {
    // Left pair
    _set(t, W, carpetC - 2, pr, TILES.WALL);
    _set(t, W, carpetC - 3, pr, TILES.WALL);
    // Right pair
    _set(t, W, carpetC + 6, pr, TILES.WALL);
    _set(t, W, carpetC + 7, pr, TILES.WALL);
    // Torch on top of every other pillar pair
    if ((pr - 6) % 10 === 0) {
      _set(t, W, carpetC - 2, pr - 1, TILES.FIRE);
      _set(t, W, carpetC + 6, pr - 1, TILES.FIRE);
    }
  }

  // Gallery benches along the outer side walls
  for (let br = 8; br <= 22; br += 5) {
    _set(t, W, 1, br,     TILES.WALL);
    _set(t, W, 1, br + 1, TILES.WALL);
    _set(t, W, W - 2, br,     TILES.WALL);
    _set(t, W, W - 2, br + 1, TILES.WALL);
  }

  // Corner torches
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);
  _set(t, W, 1,     H - 2, TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);

  // Stairs at south centre (carpet connects to exit)
  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap('kingdom_keep', 'Kingdom — Throne Room', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Butcher Shop (20 wide × 14 tall).
 */
function _buildKingdomButcherInterior() {
  const W = 20, H = 14;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Serving counter along north wall (L-shaped)
  _fill(t, W, 2, 1, 10, 2, TILES.WALL);
  _set(t, W, 11, 2, TILES.STONE); // service gap

  // Meat hooks / hanging display (wall blocks in a row above counter)
  for (let hc = 3; hc <= 9; hc += 2) {
    _set(t, W, hc, 1, TILES.WALL);
  }

  // Cutting table in the back (behind counter)
  _fill(t, W, 14, 2, 4, 2, TILES.WALL);

  // Storage barrels in NE corner
  _set(t, W, W - 3, 1, TILES.BARREL);
  _set(t, W, W - 2, 1, TILES.BARREL);

  // Display tables for meat (centre of shop)
  _fill(t, W, 4,  6, 3, 2, TILES.WALL);
  _fill(t, W, 10, 6, 3, 2, TILES.WALL);

  // Corner torches
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_butcher', 'Butcher Shop', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Fishmonger (18 wide × 12 tall).
 */
function _buildKingdomFishmongerInterior() {
  const W = 18, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Main counter (north wall)
  _fill(t, W, 2, 1, 8, 2, TILES.WALL);
  _set(t, W, 6, 2, TILES.STONE); // service gap

  // Fish display tanks (wall blocks along east side)
  _fill(t, W, W - 3, 2, 2, 5, TILES.WALL);

  // Ice storage (back NW)
  _fill(t, W, 11, 1, 4, 2, TILES.WALL);

  // Display table
  _fill(t, W, 3, 6, 4, 2, TILES.WALL);

  // Torch / lantern
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_fishmonger', 'Fishmonger', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Weapon Salesman (20 wide × 14 tall).
 */
function _buildKingdomWeaponsInterior() {
  const W = 20, H = 14;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Sales counter (north wall)
  _fill(t, W, 2, 1, 8, 2, TILES.WALL);
  _set(t, W, 6, 2, TILES.STONE); // gap

  // Weapon rack on west wall (vertical strip of wall blocks)
  for (let wr = 2; wr <= 9; wr += 2) {
    _set(t, W, 1, wr, TILES.WALL);
  }

  // Armour / shield rack on east wall
  for (let er = 2; er <= 9; er += 2) {
    _set(t, W, W - 2, er, TILES.WALL);
  }

  // Central display stands
  _fill(t, W, 5,  5, 2, 3, TILES.WALL);
  _fill(t, W, 11, 5, 2, 3, TILES.WALL);
  _fill(t, W, 8,  7, 4, 2, TILES.WALL);

  // Torch braziers
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);
  _set(t, W, 1,     H - 2, TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_weapons', 'Weapon Salesman', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Variety Shop (20 wide × 12 tall).
 */
function _buildKingdomVarietyInterior() {
  const W = 20, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Main counter along north wall
  _fill(t, W, 2, 1, 12, 2, TILES.WALL);
  _set(t, W, 8, 2, TILES.STONE); // service gap

  // Shelving unit east wall
  _fill(t, W, W - 3, 1, 2, 6, TILES.WALL);

  // Barrels / crates along west wall
  _set(t, W, 1, 3, TILES.BARREL);
  _set(t, W, 1, 4, TILES.BARREL);
  _set(t, W, 1, 6, TILES.BARREL);

  // Central display table
  _fill(t, W, 5, 5, 4, 2, TILES.WALL);
  _fill(t, W, 11, 5, 4, 2, TILES.WALL);

  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_variety', 'Variety Shop', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Cape Salesman (18 wide × 12 tall).
 */
function _buildKingdomCapesInterior() {
  const W = 18, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Service counter
  _fill(t, W, 2, 1, 6, 2, TILES.WALL);
  _set(t, W, 5, 2, TILES.STONE); // gap

  // Cape display racks on east and west walls
  for (let cr = 2; cr <= 8; cr += 2) {
    _set(t, W, 1,     cr, TILES.WALL);
    _set(t, W, W - 2, cr, TILES.WALL);
  }

  // Mannequin-style stands in centre
  _fill(t, W, 5, 5, 2, 2, TILES.WALL);
  _fill(t, W, 10, 5, 2, 2, TILES.WALL);

  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_capes', 'Cape Salesman', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom Exchange — open trading hall, no NPC (future player exchange).
 */
function _buildKingdomExchangeInterior() {
  const W = 20, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Grand central carpet strip
  _fill(t, W, (W >> 1) - 1, 1, 3, H - 2, TILES.CARPET);

  // Notice boards / pillars flanking the carpet
  for (let pr = 2; pr <= H - 3; pr += 3) {
    _set(t, W, (W >> 1) - 4, pr, TILES.WALL);
    _set(t, W, (W >> 1) + 4, pr, TILES.WALL);
  }

  // Trading counters on east and west sides
  _fill(t, W, 1,     2, 3, H - 4, TILES.WALL);
  _fill(t, W, W - 4, 2, 3, H - 4, TILES.WALL);

  // Corner torches
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);
  _set(t, W, 1,     H - 2, TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_exchange', 'Exchange — Coming Soon', W, H, t, exitC, exitR - 1);
}

/* ── Player house interior ──────────────────────────── */

/**
 * Build (or rebuild) the player house interior map (73x73 tiles).
 *
 * Layout: 6x6 grid of 11x11 cells on a grass field enclosed by fence.
 * Only cells owned by HousingState are carved out (floor + walls).
 * Adjacent owned cells are connected by DOOR tiles in the shared wall.
 * Farming plot rooms contain 5 rows x 9 soil patches.
 * Player spawns at the centre of the starter cell (grid 2,2).
 * STAIRS exit at the bottom edge of the starter room.
 *
 * @param {import('./housing.js').HousingState} housingState
 * @param {import('./farming.js').FarmingState|null} farmingState
 */
function _buildPlayerHouseFromState(housingState, farmingState = null) {
  const W = HOUSE_MAP_SIZE;  // 73
  const H = HOUSE_MAP_SIZE;

  // Start with grass everywhere — unbuilt areas are open lawn.
  const t = new Uint8Array(W * H).fill(TILES.GRASS);
  const propGroundMap = new Map();

  function _prop(c, r, tile) {
    propGroundMap.set(`${c},${r}`, t[r * W + c]);
    _set(t, W, c, r, tile);
  }

  // ── Fence border — solid, player cannot leave ──────────
  for (let c = 0; c < W; c++) {
    _set(t, W, c, 0,     TILES.FENCE);
    _set(t, W, c, H - 1, TILES.FENCE);
  }
  for (let r = 0; r < H; r++) {
    _set(t, W, 0,     r, TILES.FENCE);
    _set(t, W, W - 1, r, TILES.FENCE);
  }

  // Collect furniture rotations during build; applied after InteriorMap creation.
  const furnRotations = [];

  // ── Build each owned cell ──────────────────────────────
  for (const [key, cell] of housingState.cells) {
    const [gx, gy] = key.split(',').map(Number);
    const roomDef  = ROOM_DEFS[cell.typeId];
    if (!roomDef) continue;

    const io = cellInnerOrigin(gx, gy);          // top-left of 11x11 inner area

    // Fill the 11x11 inner floor
    _fill(t, W, io.col, io.row, CELL_INNER, CELL_INNER, roomDef.floorTile);

    // ── Walls around this cell ───────────────────────────
    const wL = io.col - 1;
    const wR = io.col + CELL_INNER;
    const wT = io.row - 1;
    const wB = io.row + CELL_INNER;

    // Choose wall tile per edge.
    // Fenced rooms: garden (steel), taming_pen (wood), farming_plot (wood).
    // Use fence when edge is exterior OR adjacent room is also fenced.
    // Use WALL when adjacent room is a non-fenced type.
    const FENCED_TYPES = new Set(['garden', 'taming_pen', 'farming_plot']);
    const isFenced = FENCED_TYPES.has(cell.typeId);
    const fenceH = cell.typeId === 'garden' ? TILES.STEEL_FENCE_H : TILES.WOOD_FENCE_H;
    const fenceV = cell.typeId === 'garden' ? TILES.STEEL_FENCE_V : TILES.WOOD_FENCE_V;
    const fenceCorner = cell.typeId === 'garden' ? TILES.STEEL_FENCE_CORNER : TILES.WOOD_FENCE_CORNER;

    function _edgeTile(adjGX, adjGY, isHoriz) {
      if (!isFenced) return TILES.WALL;
      const adj = housingState.getCell(adjGX, adjGY);
      // No adjacent room → fence (exterior edge)
      if (!adj) return isHoriz ? fenceH : fenceV;
      // Adjacent room is also fenced → fence
      if (FENCED_TYPES.has(adj.typeId)) return isHoriz ? fenceH : fenceV;
      // Adjacent room is a solid-wall type → WALL
      return TILES.WALL;
    }

    const tileTop   = _edgeTile(gx, gy - 1, true);
    const tileBot   = _edgeTile(gx, gy + 1, true);
    const tileLeft  = _edgeTile(gx - 1, gy, false);
    const tileRight = _edgeTile(gx + 1, gy, false);

    // Top wall row (excluding corners)
    if (wT >= 0) {
      for (let c = io.col; c < io.col + CELL_INNER; c++)
        _set(t, W, c, wT, tileTop);
    }
    // Bottom wall row (excluding corners)
    if (wB < H) {
      for (let c = io.col; c < io.col + CELL_INNER; c++)
        _set(t, W, c, wB, tileBot);
    }
    // Left wall column (excluding corners)
    if (wL >= 0) {
      for (let r = io.row; r < io.row + CELL_INNER; r++)
        _set(t, W, wL, r, tileLeft);
    }
    // Right wall column (excluding corners)
    if (wR < W) {
      for (let r = io.row; r < io.row + CELL_INNER; r++)
        _set(t, W, wR, r, tileRight);
    }

    // Corners — set corner post for now; second pass below upgrades to WALL if needed
    const cornerPositions = [
      [wL, wT], [wR, wT], [wL, wB], [wR, wB],
    ];
    for (const [cc, cr] of cornerPositions) {
      if (cc < 0 || cc >= W || cr < 0 || cr >= H) continue;
      _set(t, W, cc, cr, isFenced ? fenceCorner : TILES.WALL);
    }

    // ── 3-tile gap in shared walls to adjacent rooms (no doors) ─
    const mid = 5; // centre of 11-tile span
    if (housingState.hasCell(gx + 1, gy)) {
      for (let r = io.row + mid - 1; r <= io.row + mid + 1; r++)
        _set(t, W, wR, r, roomDef.floorTile);
    }
    if (housingState.hasCell(gx - 1, gy)) {
      for (let r = io.row + mid - 1; r <= io.row + mid + 1; r++)
        _set(t, W, wL, r, roomDef.floorTile);
    }
    if (housingState.hasCell(gx, gy + 1)) {
      for (let c = io.col + mid - 1; c <= io.col + mid + 1; c++)
        _set(t, W, c, wB, roomDef.floorTile);
    }
    if (housingState.hasCell(gx, gy - 1)) {
      for (let c = io.col + mid - 1; c <= io.col + mid + 1; c++)
        _set(t, W, c, wT, roomDef.floorTile);
    }

    // ── Room-specific content ────────────────────────────

    // Farming plot — rows of soil patches
    if (cell.typeId === 'farming_plot') {
      const patches = farmingState ? (farmingState.patches.get(key) ?? []) : [];
      let patchIdx = 0;
      for (const pos of PATCH_LOCAL_POSITIONS) {
        const pc = io.col + pos.localCol;
        const pr = io.row + pos.localRow;
        const patch = patches[patchIdx] ?? null;
        const tile = farmingState ? farmingState.getPatchTile(patch) : GROW_STAGES[0].tile;
        _prop(pc, pr, tile);
        patchIdx++;
      }
    }

    // Furniture placement — record rotation for each tile so the renderer
    // can draw directional sprites (chairs, chests, bookshelves, etc.).
    const furList = housingState.getFurniture(gx, gy);
    for (const f of furList) {
      const fd = FURNITURE_DEFS[f.defId];
      if (!fd) continue;
      const { w, h } = rotatedFootprint(fd, f.rotation);
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          const tc = io.col + f.localCol + dc;
          const tr = io.row + f.localRow + dr;
          // Wall-mount items may sit on the wall row (localRow = -1)
          const onWall = fd.wallMount && tr === io.row + f.localRow && f.localRow < 0;
          if (onWall ||
              (tc >= io.col && tc < io.col + CELL_INNER &&
               tr >= io.row && tr < io.row + CELL_INNER)) {
            _prop(tc, tr, fd.tileId);
            furnRotations.push({ c: tc, r: tr, rot: f.rotation });
          }
        }
      }
    }
  }

  // ── Corner fix pass: upgrade fence corners to WALL if any adjacent edge is WALL ─
  for (const [key] of housingState.cells) {
    const [gx, gy] = key.split(',').map(Number);
    const io = cellInnerOrigin(gx, gy);
    const wL = io.col - 1, wR = io.col + CELL_INNER;
    const wT = io.row - 1, wB = io.row + CELL_INNER;
    // Each corner: check the two edge tiles adjacent to it (one horizontal, one vertical)
    const cornerChecks = [
      // [cornerCol, cornerRow, horizNeighbor, vertNeighbor]
      [wL, wT, [io.col, wT], [wL, io.row]],        // top-left
      [wR, wT, [io.col + CELL_INNER - 1, wT], [wR, io.row]],  // top-right
      [wL, wB, [io.col, wB], [wL, io.row + CELL_INNER - 1]],  // bottom-left
      [wR, wB, [io.col + CELL_INNER - 1, wB], [wR, io.row + CELL_INNER - 1]],  // bottom-right
    ];
    for (const [cc, cr, [hc, hr], [vc, vr]] of cornerChecks) {
      if (cc < 0 || cc >= W || cr < 0 || cr >= H) continue;
      const cur = t[cr * W + cc];
      if (cur === TILES.WALL) continue; // already WALL
      // If either adjacent edge tile is WALL, corner must be WALL
      const hTile = (hr >= 0 && hr < H && hc >= 0 && hc < W) ? t[hr * W + hc] : TILES.WALL;
      const vTile = (vr >= 0 && vr < H && vc >= 0 && vc < W) ? t[vr * W + vc] : TILES.WALL;
      if (hTile === TILES.WALL || vTile === TILES.WALL) {
        _set(t, W, cc, cr, TILES.WALL);
      }
    }
  }

  // ── Exit door in the player-chosen exit room ───────────
  // Validate: if exit room now has a south neighbour, auto-fix
  let exitGX = housingState.exitGX;
  let exitGY = housingState.exitGY;
  if (housingState.cells.has(`${exitGX},${exitGY + 1}`)) {
    // Find a valid exit room (southernmost with no south neighbour)
    let maxGY = -1;
    for (const key of housingState.cells.keys()) {
      const [gx, gy] = key.split(',').map(Number);
      if (gy > maxGY && !housingState.cells.has(`${gx},${gy + 1}`)) {
        maxGY = gy; exitGX = gx;
      }
    }
    exitGY = maxGY >= 0 ? maxGY : housingState.exitGY;
    housingState.setExitCell(exitGX, exitGY);
  }
  const exitIO = cellInnerOrigin(exitGX, exitGY);
  const doorCol = exitIO.col + 5;                 // centre of 11-wide room
  const doorRow = exitIO.row + CELL_INNER;        // south wall (one tile below inner floor)
  _set(t, W, doorCol, doorRow, TILES.DOOR);

  // Entry point — one tile above the exit door
  const entryC = doorCol;
  const entryR = doorRow - 1;

  const map = new InteriorMap('player_house', 'My Home', W, H, t, entryC, entryR);
  map.propGroundMap = propGroundMap;

  // Apply furniture rotations now that the InteriorMap's _rotations array exists.
  for (const { c, r, rot } of furnRotations) {
    map._rotations[r * W + c] = rot & 3;
  }

  return map;
}

export function buildPlayerHouse(housingState, farmingState = null) {
  return _buildPlayerHouseFromState(housingState, farmingState);
}

export function buildAllInteriors(doorMap) {
  const interiors = new Map();

  for (const interiorId of doorMap.values()) {
    if (interiors.has(interiorId)) continue; // already built this template

    if (interiorId.includes('_house_')) {
      interiors.set(interiorId, _buildHouseInterior(interiorId));
    } else if (interiorId === 'castle_keep') {
      interiors.set(interiorId, _buildCastleKeepInterior());
    } else if (interiorId === 'kingdom_keep') {
      interiors.set(interiorId, _buildKingdomKeepInterior());
    } else if (interiorId === 'kingdom_butcher') {
      interiors.set(interiorId, _buildKingdomButcherInterior());
    } else if (interiorId === 'kingdom_fishmonger') {
      interiors.set(interiorId, _buildKingdomFishmongerInterior());
    } else if (interiorId === 'kingdom_weapons') {
      interiors.set(interiorId, _buildKingdomWeaponsInterior());
    } else if (interiorId === 'kingdom_variety') {
      interiors.set(interiorId, _buildKingdomVarietyInterior());
    } else if (interiorId === 'kingdom_capes') {
      interiors.set(interiorId, _buildKingdomCapesInterior());
    } else if (interiorId === 'kingdom_exchange') {
      interiors.set(interiorId, _buildKingdomExchangeInterior());
    } else if (interiorId.endsWith('_interior') && interiorId.startsWith('tower')) {
      interiors.set(interiorId, _buildWatchtowerInterior(interiorId));
    } else if (interiorId === 'outpost_interior') {
      interiors.set(interiorId, _buildOutpostInterior());
    }
  }

  return interiors;
}
