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
  ROOM_DEFS, FURNITURE_DEFS, rotatedFootprint,
  CELL_SIZE, CELL_INNER, GRID_ROWS,
  START_GX, START_GY,
  cellOrigin, cellInnerOrigin,
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
 * Build (or rebuild) the 90×90 player house interior from a HousingState.
 *
 * Layout rules:
 *   • Every cell in the 6×6 grid that is owned gets its tiles placed.
 *   • Indoor cells get WALL borders + their floorTile inside.
 *   • Outdoor cells fill their 13×13 area with floorTile (no walls).
 *   • Adjacent cells get a 1-tile doorway opened through the shared wall.
 *   • Furniture stored in housing state is placed as tile IDs.
 *   • STAIRS exit is placed at the south-wall centre of the southernmost
 *     owned cell in the START_GX column.
 *
 * @param {import('./housing.js').HousingState} housingState
 */
function _buildPlayerHouseFromState(housingState, farmingState = null) {
  const W = 90, H = 90;
  const t = new Uint8Array(W * H).fill(TILES.GRASS);

  // ── Phase 1: place each owned cell ────────────────────
  for (const [key, cell] of housingState.cells) {
    const [gx, gy] = key.split(',').map(Number);
    const def = ROOM_DEFS[cell.typeId];
    if (!def) continue;
    const o = cellOrigin(gx, gy);
    if (def.category === 'indoor') {
      _fill(t, W, o.col, o.row, CELL_SIZE, CELL_SIZE, TILES.WALL);
      _fill(t, W, o.col + 1, o.row + 1, CELL_INNER, CELL_INNER, def.floorTile);
    } else {
      _fill(t, W, o.col, o.row, CELL_SIZE, CELL_SIZE, def.floorTile);
    }
  }

  // ── Phase 2: open doorways between adjacent owned cells ─
  for (const [key, cell] of housingState.cells) {
    const [gx, gy] = key.split(',').map(Number);
    const def = ROOM_DEFS[cell.typeId];
    if (!def) continue;
    const o = cellOrigin(gx, gy);

    // South neighbour
    if (housingState.hasCell(gx, gy + 1)) {
      const oS = cellOrigin(gx, gy + 1);
      const dc = o.col + Math.floor(CELL_SIZE / 2);
      const nbrDef = ROOM_DEFS[housingState.getCell(gx, gy + 1).typeId];
      if (def.category === 'indoor')
        _set(t, W, dc, o.row + CELL_SIZE - 1, def.floorTile);
      if (nbrDef && nbrDef.category === 'indoor')
        _set(t, W, dc, oS.row, nbrDef.floorTile);
    }
    // East neighbour
    if (housingState.hasCell(gx + 1, gy)) {
      const oE = cellOrigin(gx + 1, gy);
      const dr = o.row + Math.floor(CELL_SIZE / 2);
      const nbrDef = ROOM_DEFS[housingState.getCell(gx + 1, gy).typeId];
      if (def.category === 'indoor')
        _set(t, W, o.col + CELL_SIZE - 1, dr, def.floorTile);
      if (nbrDef && nbrDef.category === 'indoor')
        _set(t, W, oE.col, dr, nbrDef.floorTile);
    }
  }

  const propGroundMap = new Map(); // floor tile under each furniture/patch position

  // ── Phase 3: place furniture tiles ────────────────────
  for (const [key, furList] of housingState.furniture) {
    const [gx, gy] = key.split(',').map(Number);
    const io = cellInnerOrigin(gx, gy);
    for (const f of furList) {
      const fd = FURNITURE_DEFS[f.defId];
      if (!fd) continue;
      const { w, h } = rotatedFootprint(fd, f.rotation);
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          const tc = io.col + f.localCol + dc;
          const tr = io.row + f.localRow + dr;
          if (tc >= 0 && tc < W && tr >= 0 && tr < H) {
            propGroundMap.set(`${tc},${tr}`, t[tr * W + tc]);
            _set(t, W, tc, tr, fd.tileId);
          }
        }
      }
    }
  }

  // ── Phase 3.5: farming patch tiles ────────────────────
  for (const [key, cell] of housingState.cells) {
    if (cell.typeId !== 'farming_plot') continue;
    const [gx, gy] = key.split(',').map(Number);
    const io = cellInnerOrigin(gx, gy);
    const patches = farmingState ? (farmingState.patches.get(key) ?? []) : [];
    for (let i = 0; i < PATCH_LOCAL_POSITIONS.length; i++) {
      const { localCol, localRow } = PATCH_LOCAL_POSITIONS[i];
      const pc = io.col + localCol, pr = io.row + localRow;
      const patch = patches[i] ?? null;
      const stage = farmingState ? farmingState.getPatchStage(patch) : 0;
      propGroundMap.set(`${pc},${pr}`, t[pr * W + pc]);
      _set(t, W, pc, pr, GROW_STAGES[stage].tile);
    }
  }

  // ── Phase 4: STAIRS exit ───────────────────────────────
  let stairsGY = START_GY;
  for (let gy = START_GY + 1; gy < GRID_ROWS; gy++) {
    if (housingState.hasCell(START_GX, gy)) stairsGY = gy;
    else break;
  }
  const stO = cellOrigin(START_GX, stairsGY);
  const stairsCol = stO.col + Math.floor(CELL_SIZE / 2);
  const stairsRow = stO.row + CELL_SIZE - 1;
  _set(t, W, stairsCol, stairsRow, TILES.STAIRS);

  // Entry point: north inner area of starter cell
  const eO = cellInnerOrigin(START_GX, START_GY);
  const entryC = eO.col + Math.floor(CELL_INNER / 2);
  const entryR = eO.row;

  const map = new InteriorMap('player_house', 'My Home', W, H, t, entryC, entryR);
  map.propGroundMap = propGroundMap;
  return map;
}

/* ── Public factory ─────────────────────────────────── */

/**
 * Build a fresh player house interior from a HousingState.
 * Call again to rebuild after the state changes (room added, furniture placed).
 *
 * @param {import('./housing.js').HousingState} housingState
 */
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
