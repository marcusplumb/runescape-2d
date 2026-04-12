/**
 * Interior maps — small hand-crafted tile grids for building interiors.
 * Each interior has the same getTile/isSolid API as World so the renderer
 * and player movement work without modification.
 *
 * Entering: player walks onto TILES.DOOR in the world → fade → interior
 * Exiting:  player walks onto TILES.STAIRS in interior → fade → world
 */
import { TILES, SOLID_TILES, TILE_SIZE } from './constants.js';
import { FURNITURE_DEFS, rotatedFootprint } from './housing.js';
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
 * Build (or rebuild) the player house interior.
 *
 * Fixed 4-room layout — 22 tiles wide × 18 tiles tall.
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  GREENHOUSE  (cols 0-21, rows 0-5)  — GRASS floor          │
 * │  4×3 grid of FARM_PATCH at cols 2,4,6,8 × rows 1,3 (+ 5)  │
 * ├──────────────┬──────────────────────┬──────────────────────┤
 * │ ANIMAL PEN   │   ENTRY / MAIN ROOM  │   STORAGE ROOM       │
 * │ cols 0-5     │   cols 6-15          │   cols 16-21         │
 * │ rows 6-17    │   rows 6-12          │   rows 6-12          │
 * │ DIRT floor   │   PLANK floor        │   PLANK floor        │
 * │ 4 pen slots  │   furniture here     │   FURN_CHEST at      │
 * │              │                      │   (19, 8)            │
 * │              ├──────────────────────┤                      │
 * │              │   (south open area)  │                      │
 * │              │   rows 13-17         │                      │
 * └──────────────┴──────────────────────┴──────────────────────┘
 *
 * Walls: WALL=6 between all rooms.  Every room connects to the
 * entry/main room via a DOOR=29 gap — no room is ever sealed off.
 *
 * Player spawn: centre of the entry/main room at (10, 9).
 * Exit (STAIRS=30): south wall of entry room at (10, 17).
 *
 * Solidity: WALL=6 is solid (via SOLID_TILES in constants.js).
 *           DOOR=29 is walkable.
 *
 * @param {import('./housing.js').HousingState} housingState
 * @param {import('./farming.js').FarmingState|null} farmingState
 */
function _buildPlayerHouseFromState(housingState, farmingState = null) {
  const W = 22, H = 18;

  // Start with all walls; we'll carve out rooms below.
  const t = _grid(W, H); // fills with TILES.WALL

  const propGroundMap = new Map();

  // ── Helper: record floor under a prop tile ─────────────
  function _prop(c, r, tile) {
    propGroundMap.set(`${c},${r}`, t[r * W + c]);
    _set(t, W, c, r, tile);
  }

  // ══════════════════════════════════════════════════════
  // ROOM 1 — GREENHOUSE  (cols 0-21, rows 0-5)
  // Floor: GRASS.  Surrounded by the outer WALL border
  // already set by _grid.  South wall shared with rooms below.
  // ══════════════════════════════════════════════════════
  // Interior floor: cols 1-20, rows 1-4
  _fill(t, W, 1, 1, 20, 4, TILES.GRASS);

  // 12 greenhouse FARM_PATCH tiles — 4 cols × 3 rows.
  // Cols: 2, 4, 6, 8   Rows: 1, 2, 3  (fits within greenhouse interior rows 1-4)
  const greenhouseCols = [2, 4, 6, 8];
  const ghRows = [1, 2, 3];
  let ghPatchIndex = 0;
  for (const pr of ghRows) {
    for (const pc of greenhouseCols) {
      // Determine tile from farmingState greenhouse patch state
      let patchTile = TILES.FARM_PATCH; // default: empty
      if (farmingState && farmingState.greenhousePatches[ghPatchIndex]) {
        const gp = farmingState.greenhousePatches[ghPatchIndex];
        if      (gp.state === 'seeded')  patchTile = TILES.FARM_PATCH_SEEDED;
        else if (gp.state === 'growing') patchTile = TILES.FARM_PATCH_GROWING;
        else if (gp.state === 'ready')   patchTile = TILES.FARM_PATCH_READY;
      }
      _prop(pc, pr, patchTile);
      ghPatchIndex++;
    }
  }

  // Door from greenhouse → main entry room.
  // Shared wall is row 5 (south border of greenhouse / north border of middle rooms).
  // Place DOOR at col 10, row 5 (aligns with the centre of the entry room).
  _set(t, W, 10, 5, TILES.DOOR);

  // ══════════════════════════════════════════════════════
  // ROOM 2 — ENTRY / MAIN ROOM  (cols 6-15, rows 6-12)
  // Floor: PLANK.  Existing furniture placed here by HousingState.
  // ══════════════════════════════════════════════════════
  // Outer walls already wall from _grid.  Carve interior:
  _fill(t, W, 7, 7, 8, 5, TILES.PLANK); // cols 7-14, rows 7-11 (interior floor)

  // Left wall of entry room (col 6): solid WALL — already set by _grid.
  // Right wall of entry room (col 15): solid WALL — already set by _grid.
  // North wall of entry room (row 6): solid WALL row — already set.
  // South wall of entry room (row 12): solid WALL row — already set.

  // ── Phase: place furniture tiles from HousingState ────
  // Map furniture from the housing grid onto the entry/main room floor.
  // We iterate over all furniture entries and place them relative to the
  // inner origin of the starter cell, then offset into the entry room area.
  // For compatibility, furniture local coords are placed starting at (7,7).
  for (const [, furList] of housingState.furniture) {
    for (const f of furList) {
      const fd = FURNITURE_DEFS[f.defId];
      if (!fd) continue;
      const { w, h } = rotatedFootprint(fd, f.rotation);
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          // Place furniture within the main room floor area (cols 7-14, rows 7-11)
          const tc = 7 + f.localCol + dc;
          const tr = 7 + f.localRow + dr;
          if (tc >= 7 && tc <= 14 && tr >= 7 && tr <= 11) {
            _prop(tc, tr, fd.tileId);
          }
        }
      }
    }
  }

  // ── Phase: old-style farming patches inside entry room ─
  // (farming_plot cell patches from patches Map, for backward compatibility)
  for (const [key, cell] of housingState.cells) {
    if (cell.typeId !== 'farming_plot') continue;
    const patches = farmingState ? (farmingState.patches.get(key) ?? []) : [];
    for (let i = 0; i < PATCH_LOCAL_POSITIONS.length; i++) {
      const { localCol, localRow } = PATCH_LOCAL_POSITIONS[i];
      const pc = 7 + localCol, pr = 7 + localRow;
      if (pc >= 7 && pc <= 14 && pr >= 7 && pr <= 11) {
        const patch = patches[i] ?? null;
        const stage = farmingState ? farmingState.getPatchStage(patch) : 0;
        _prop(pc, pr, GROW_STAGES[stage].tile);
      }
    }
  }

  // South extension of entry room (cols 7-14, rows 12-16) — open walkable area
  _fill(t, W, 7, 12, 8, 5, TILES.PLANK); // cols 7-14, rows 12-16

  // STAIRS exit at south wall of entry room (bottom of map)
  // South outer wall is row 17. Place stairs at (10, 16) — one tile from south wall.
  _set(t, W, 10, 16, TILES.STAIRS);
  // Open the south wall at col 10 so the player can reach stairs from inside.
  _set(t, W, 10, 17, TILES.DOOR);

  // ══════════════════════════════════════════════════════
  // ROOM 3 — STORAGE ROOM  (cols 16-21, rows 6-12)
  // Floor: PLANK.  Contains large chest.
  // ══════════════════════════════════════════════════════
  // Interior: cols 17-20, rows 7-11
  _fill(t, W, 17, 7, 4, 5, TILES.PLANK);

  // Large chest at interior position (19, 8)
  // TODO: game.js — when player opens chest at interior position (19,8), use
  //   LARGE_CHEST_CAPACITY (112) slots if housingState.hasLargeChest, else 28 slots.
  _prop(19, 8, TILES.FURN_CHEST);

  // Shelving along the east wall of storage room (col 20, rows 9-10)
  _prop(20, 9,  TILES.FURN_BOOKSHELF);
  _prop(20, 10, TILES.FURN_BOOKSHELF);

  // Door from storage room → entry room at shared wall col 15, row 9
  // (centre of the shared wall between entry col 15 and storage col 16)
  _set(t, W, 15, 9, TILES.DOOR);
  _set(t, W, 16, 9, TILES.PLANK); // open passage tile inside storage room

  // ══════════════════════════════════════════════════════
  // ROOM 4 — ANIMAL PEN  (cols 0-5, rows 6-17)
  // Floor: DIRT.  4 animal slot positions using FARM_PATCH.
  // ══════════════════════════════════════════════════════
  // Interior: cols 1-4, rows 7-16
  _fill(t, W, 1, 7, 4, 10, TILES.DIRT);

  // 4 animal slot positions (FARM_PATCH tiles mark interactive spots)
  // Positions: (2,9), (4,9), (2,11), (4,11)
  // TODO: game.js — add animalPenOpen panel flag; clicking a pen tile at
  //   interior positions (2,9), (4,9), (2,11), (4,11) opens animal management;
  //   call housingState.tickAnimals(dt) in update loop; renderer.drawAnimalPenPanel()
  _prop(2,  9,  TILES.FARM_PATCH);
  _prop(4,  9,  TILES.FARM_PATCH);
  _prop(2,  11, TILES.FARM_PATCH);
  _prop(4,  11, TILES.FARM_PATCH);

  // Door from animal pen → entry room at shared wall col 5, row 9
  // (passage connecting pen to entry room)
  _set(t, W, 5, 9, TILES.DOOR);
  _set(t, W, 6, 9, TILES.PLANK); // open passage tile on entry room side

  // ── Ensure outer border is solid WALL ─────────────────
  // Top row and bottom row
  for (let c = 0; c < W; c++) {
    _set(t, W, c, 0,     TILES.WALL);
    _set(t, W, c, H - 1, TILES.WALL);
  }
  // Left col and right col
  for (let r = 0; r < H; r++) {
    _set(t, W, 0,     r, TILES.WALL);
    _set(t, W, W - 1, r, TILES.WALL);
  }

  // ── Spawn point: centre of entry/main room ─────────────
  // Entry room interior is cols 7-14, rows 7-11. Centre ≈ (10, 9).
  const entryC = 10;
  const entryR = 9;

  const map = new InteriorMap('player_house', 'My Home', W, H, t, entryC, entryR);
  map.propGroundMap = propGroundMap;
  return map;
}

/* ── Public factory ─────────────────────────────────── */

/**
 * Build (or rebuild) the player house interior map (22×18 tiles).
 *
 * Room layout:
 *   Greenhouse   — cols 0-21, rows 0-5   (GRASS floor, 12 FARM_PATCH slots)
 *   Entry/Main   — cols 6-15, rows 6-17  (PLANK floor, furniture, STAIRS exit)
 *   Storage      — cols 16-21, rows 6-12 (PLANK floor, FURN_CHEST at (19,8))
 *   Animal Pen   — cols 0-5,  rows 6-17  (DIRT floor, 4 pen slots)
 *
 * All rooms connect to the entry/main room via DOOR=29 gaps.
 * WALL=6 is solid (isSolid returns true). DOOR=29 is walkable.
 * Player spawns at (10, 9) — centre of entry room.
 * STAIRS exit at (10, 16), door gap at (10, 17) in south wall.
 *
 * Call again to rebuild after state changes (room added, furniture placed,
 * greenhouse patch updated, animal pen changed).
 *
 * @param {import('./housing.js').HousingState} housingState
 * @param {import('./farming.js').FarmingState|null} farmingState
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
