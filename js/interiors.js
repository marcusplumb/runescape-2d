/**
 * Interior maps — small hand-crafted tile grids for building interiors.
 * Each interior has the same getTile/isSolid API as World so the renderer
 * and player movement work without modification.
 *
 * Entering: player walks onto TILES.DOOR in the world → fade → interior
 * Exiting:  player walks onto TILES.STAIRS in interior → fade → world
 */
import { TILES, SOLID_TILES } from './constants.js';

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
    this.entryCol   = entryCol;
    this.entryRow   = entryRow;
  }

  getTile(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return TILES.WALL;
    return this._tiles[r * this.cols + c];
  }

  isSolid(c, r) {
    return SOLID_TILES.has(this.getTile(c, r));
  }

  setTile(c, r, tile, rotation = 0) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
    const idx = r * this.cols + c;
    this._tiles[idx]     = tile;
    this._rotations[idx] = rotation & 3;
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
 * Kingdom throne room (40 wide × 26 tall).
 * Grand pillared hall with central aisle, raised throne dais, and side galleries.
 */
function _buildKingdomKeepInterior() {
  const W = 40, H = 26;
  const t = _grid(W, H);

  // Stone floor throughout
  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Central aisle (dirt carpet from south entrance to throne)
  for (let r = 2; r < H - 2; r++) _set(t, W, W >> 1, r, TILES.DIRT);

  // Throne dais — raised platform of wall blocks at north wall
  _fill(t, W, 16, 1, 8, 3, TILES.WALL);
  // Open centre of dais (the throne seat itself walkable)
  _set(t, W, 19, 2, TILES.STONE);
  _set(t, W, 20, 2, TILES.STONE);

  // Pillar pairs flanking the aisle (every 4 rows, 5 pairs)
  for (let pr = 4; pr <= 20; pr += 4) {
    _set(t, W, 4,      pr, TILES.WALL);
    _set(t, W, 5,      pr, TILES.WALL);
    _set(t, W, W - 6,  pr, TILES.WALL);
    _set(t, W, W - 5,  pr, TILES.WALL);
  }

  // Side alcove benches along the outer walls
  for (let bc = 7; bc <= 13; bc += 3) {
    _set(t, W, bc, 8,  TILES.WALL);
    _set(t, W, bc, 14, TILES.WALL);
    _set(t, W, W - 1 - bc, 8,  TILES.WALL);
    _set(t, W, W - 1 - bc, 14, TILES.WALL);
  }

  // Torches (fire) — corners and flanking throne
  _set(t, W, 1,      1,      TILES.FIRE);
  _set(t, W, W - 2,  1,      TILES.FIRE);
  _set(t, W, 1,      H - 2,  TILES.FIRE);
  _set(t, W, W - 2,  H - 2,  TILES.FIRE);
  _set(t, W, 14,     3,      TILES.FIRE);
  _set(t, W, W - 15, 3,      TILES.FIRE);

  // Stairs at south centre
  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);

  return new InteriorMap('kingdom_keep', 'Kingdom — Throne Room', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom barracks (20 wide × 14 tall).
 */
function _buildKingdomBarracksInterior() {
  const W = 20, H = 14;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Bunk rows on east and west walls (pairs of WALL blocks)
  for (let br = 2; br <= 9; br += 2) {
    _set(t, W, 2, br, TILES.WALL); _set(t, W, 3, br, TILES.WALL);
    _set(t, W, W - 4, br, TILES.WALL); _set(t, W, W - 3, br, TILES.WALL);
  }

  // Central table
  _fill(t, W, 8, 5, 4, 2, TILES.WALL);

  // Weapon rack (north wall centre)
  _fill(t, W, 7, 1, 6, 1, TILES.WALL);

  _set(t, W, 1,      1,     TILES.FIRE);
  _set(t, W, W - 2,  1,     TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_barracks', 'Kingdom Barracks', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom smithy (16 wide × 12 tall).
 */
function _buildKingdomSmithyInterior() {
  const W = 16, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Forge (fire) in NW corner
  _set(t, W, 1, 1, TILES.FIRE);
  _set(t, W, 2, 1, TILES.FIRE);
  _set(t, W, 1, 2, TILES.FIRE);

  // Anvil block beside forge
  _set(t, W, 4, 2, TILES.WALL);

  // Work bench along east wall
  _fill(t, W, W - 3, 2, 2, 5, TILES.WALL);

  // Coal/fuel storage (south east)
  _fill(t, W, W - 4, H - 4, 3, 2, TILES.WALL);

  // Torch in NE corner
  _set(t, W, W - 2, 1, TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_smithy', 'Kingdom Smithy', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom chapel (20 wide × 14 tall).
 */
function _buildKingdomChapelInterior() {
  const W = 20, H = 14;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Central aisle (dirt)
  for (let r = 2; r < H - 2; r++) _set(t, W, W >> 1, r, TILES.DIRT);

  // Altar at north wall
  _fill(t, W, 7, 1, 6, 2, TILES.WALL);
  _set(t, W, 9,  2, TILES.STONE); // opening at altar centre
  _set(t, W, 10, 2, TILES.STONE);

  // Pews — 3 rows on each side of aisle
  for (let pr = 4; pr <= 10; pr += 3) {
    _fill(t, W, 2,          pr, 6, 1, TILES.WALL);
    _fill(t, W, W - 8,      pr, 6, 1, TILES.WALL);
  }

  // Candles / torches in corners and flanking altar
  _set(t, W, 1,     1,     TILES.FIRE);
  _set(t, W, W - 2, 1,     TILES.FIRE);
  _set(t, W, 1,     H - 2, TILES.FIRE);
  _set(t, W, W - 2, H - 2, TILES.FIRE);
  _set(t, W, 6,     3,     TILES.FIRE);
  _set(t, W, W - 7, 3,     TILES.FIRE);

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_chapel', 'Kingdom Chapel', W, H, t, exitC, exitR - 1);
}

/**
 * Kingdom inn (18 wide × 12 tall).
 */
function _buildKingdomInnInterior() {
  const W = 18, H = 12;
  const t = _grid(W, H);

  _fill(t, W, 1, 1, W - 2, H - 2, TILES.STONE);

  // Bar counter along north wall
  _fill(t, W, 2, 1, 8, 2, TILES.WALL);
  // Gap in bar for service
  _set(t, W, 6, 2, TILES.STONE);

  // Fireplace on east wall
  _set(t, W, W - 2, 2, TILES.FIRE);
  _set(t, W, W - 2, 3, TILES.FIRE);

  // Tables and stools scattered around the room
  _fill(t, W, 3, 5, 2, 2, TILES.WALL);  // table 1
  _fill(t, W, 7, 5, 2, 2, TILES.WALL);  // table 2
  _fill(t, W, 3, 8, 2, 2, TILES.WALL);  // table 3
  _fill(t, W, 11,5, 2, 2, TILES.WALL);  // table 4 (east)

  const exitC = W >> 1, exitR = H - 2;
  _set(t, W, exitC, exitR, TILES.STAIRS);
  return new InteriorMap('kingdom_inn', 'The King\'s Rest Inn', W, H, t, exitC, exitR - 1);
}

/* ── Player house interior ──────────────────────────── */

/**
 * 90×90 plot: grass everywhere, centred 11×11 wooden box (1-tile walls,
 * 9×9 plank floor), exit STAIRS in the south wall.
 */
function _buildPlayerHouseInterior() {
  const W = 90, H = 90;
  const t = new Uint8Array(W * H).fill(TILES.GRASS);

  // Box position: centred in plot
  const BOX_C = 40, BOX_R = 40, BOX_W = 11, BOX_H = 11;

  // Outer walls
  _fill(t, W, BOX_C, BOX_R, BOX_W, BOX_H, TILES.WALL);

  // Inner plank floor (9×9)
  _fill(t, W, BOX_C + 1, BOX_R + 1, 9, 9, TILES.PLANK);

  // Exit STAIRS centred on south wall (replaces one wall tile)
  _set(t, W, BOX_C + 5, BOX_R + BOX_H - 1, TILES.STAIRS);

  // Entry row (tile just inside the north wall, centred)
  const entryC = BOX_C + 5;
  const entryR = BOX_R + 1;

  return new InteriorMap('player_house', 'My Home', W, H, t, entryC, entryR);
}

/* ── Public factory ─────────────────────────────────── */

/**
 * Build all interior instances from the doorMap returned by placeAllStructures.
 * Returns Map<interiorId, InteriorMap>.
 */
/** Returns a fresh PlayerHouseInterior instance. */
export function buildPlayerHouse() {
  return _buildPlayerHouseInterior();
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
    } else if (interiorId === 'kingdom_barracks') {
      interiors.set(interiorId, _buildKingdomBarracksInterior());
    } else if (interiorId === 'kingdom_smithy') {
      interiors.set(interiorId, _buildKingdomSmithyInterior());
    } else if (interiorId === 'kingdom_chapel') {
      interiors.set(interiorId, _buildKingdomChapelInterior());
    } else if (interiorId === 'kingdom_inn') {
      interiors.set(interiorId, _buildKingdomInnInterior());
    } else if (interiorId.endsWith('_interior') && interiorId.startsWith('tower')) {
      interiors.set(interiorId, _buildWatchtowerInterior(interiorId));
    } else if (interiorId === 'outpost_interior') {
      interiors.set(interiorId, _buildOutpostInterior());
    }
  }

  return interiors;
}
