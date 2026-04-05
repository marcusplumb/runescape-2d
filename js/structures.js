/**
 * Structures and paths for the world map.
 *
 * Generation order:
 *   1. drawPath()       — lays dirt roads, clearing trees/ores en route
 *   2. placeVillage()   — houses + plaza placed on top of any underlying path
 *   3. placeCastle()    — large walled fortress
 *   4. placeWatchtower()— small stone tower
 *   5. placeOutpost()   — small military post near the danger zone
 *   6. placeRuins()     — crumbling partial walls
 *
 * Structure footprints overwrite whatever's underneath, so paths leading
 * to a building's entrance look correct (dirt outside, wall/stone inside).
 */
import { TILES } from './constants.js';

/* ═══════════════════════════════════════════════════════
   PATH DRAWING
   ═══════════════════════════════════════════════════════ */

function _canOverwrite(tile) {
  // Tiles the path can paint over
  return tile !== TILES.WATER     && tile !== TILES.SWAMP_WATER &&
         tile !== TILES.LAVA      && tile !== TILES.ICE         &&
         tile !== TILES.WALL;
}

/**
 * Draw a wandering dirt path from (c1,r1) to (c2,r2).
 * The path skips impassable tiles and uses a biased drunk-walk
 * so roads look naturally curved rather than perfectly straight.
 */
export function drawPath(map, rows, cols, c1, r1, c2, r2, rng) {
  let c = c1, r = r1;
  const maxSteps = (Math.abs(c2 - c1) + Math.abs(r2 - r1)) * 6;

  for (let step = 0; step < maxSteps; step++) {
    // Paint current tile
    if (r >= 0 && r < rows && c >= 0 && c < cols && _canOverwrite(map[r][c])) {
      map[r][c] = TILES.DIRT;
    }

    if (c === c2 && r === r2) break;

    const dc = c2 - c;
    const dr = r2 - r;

    // Three possible moves:
    // Primary   — advance along the dominant remaining axis
    // Secondary — advance along the minor remaining axis
    // Wander    — step perpendicular to goal direction (creates curves)
    let nc, nr;
    const roll = rng();

    if (roll < 0.70) {
      // Primary: move along dominant axis
      if (Math.abs(dc) >= Math.abs(dr)) { nc = c + Math.sign(dc); nr = r; }
      else                              { nc = c; nr = r + Math.sign(dr); }
    } else if (roll < 0.88) {
      // Secondary: move along minor axis (or primary if minor is zero)
      if (Math.abs(dc) >= Math.abs(dr)) {
        nc = c; nr = dr !== 0 ? r + Math.sign(dr) : r + (rng() < 0.5 ? 1 : -1);
      } else {
        nc = dc !== 0 ? c + Math.sign(dc) : c + (rng() < 0.5 ? 1 : -1); nr = r;
      }
    } else {
      // Wander: one tile perpendicular to the dominant direction
      if (Math.abs(dc) >= Math.abs(dr)) { nc = c; nr = r + (rng() < 0.5 ? 1 : -1); }
      else                              { nc = c + (rng() < 0.5 ? 1 : -1); nr = r; }
    }

    nc = Math.max(2, Math.min(cols - 3, nc));
    nr = Math.max(2, Math.min(rows - 3, nr));

    // If proposed tile is impassable, try the other axis
    if (!_canOverwrite(map[nr]?.[nc])) {
      if (Math.abs(dc) >= Math.abs(dr)) { nc = c; nr = dr !== 0 ? r + Math.sign(dr) : r; }
      else                              { nc = dc !== 0 ? c + Math.sign(dc) : c; nr = r; }
      nc = Math.max(2, Math.min(cols - 3, nc));
      nr = Math.max(2, Math.min(rows - 3, nr));
    }

    // Last resort: force toward goal regardless of terrain (cross water)
    if (nc === c && nr === r) {
      nc = dc !== 0 ? c + Math.sign(dc) : c;
      nr = dr !== 0 ? r + Math.sign(dr) : r;
      nc = Math.max(2, Math.min(cols - 3, nc));
      nr = Math.max(2, Math.min(rows - 3, nr));
    }

    c = nc;
    r = nr;
  }
}

/* ═══════════════════════════════════════════════════════
   LOW-LEVEL HELPERS
   ═══════════════════════════════════════════════════════ */

function _fill(map, rows, cols, c, r, w, h, tile) {
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        map[rr][cc] = tile;
      }
    }
  }
}

/** Place a rectangular building with outer WALL, inner STONE, and a door. */
function _house(map, rows, cols, c, r, w, h, doorSide) {
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      map[rr][cc] = (dr === 0 || dr === h - 1 || dc === 0 || dc === w - 1)
        ? TILES.WALL : TILES.ROOF;
    }
  }
  // Door (gap in specified wall, centred)
  const mid = Math.floor;
  let doorC = c + mid(w / 2);
  let doorR = r + mid(h / 2);
  if (doorSide === 'S') { doorR = r + h - 1; doorC = c + mid(w / 2); map[doorR][doorC] = TILES.DOOR; }
  if (doorSide === 'N') { doorR = r;          doorC = c + mid(w / 2); map[doorR][doorC] = TILES.DOOR; }
  if (doorSide === 'E') { doorR = r + mid(h / 2); doorC = c + w - 1; map[doorR][doorC] = TILES.DOOR; }
  if (doorSide === 'W') { doorR = r + mid(h / 2); doorC = c;          map[doorR][doorC] = TILES.DOOR; }
  return { col: doorC, row: doorR };
}

/* ═══════════════════════════════════════════════════════
   STRUCTURE TYPES
   ═══════════════════════════════════════════════════════ */

/**
 * Village — 3–5 houses arranged around a dirt plaza.
 * cx/cy is the centre of the plaza.
 */
function placeVillage(map, rows, cols, cx, cy, rng) {
  const PR = 3; // plaza half-radius → 7×7 dirt square

  // Dirt plaza
  _fill(map, rows, cols, cx - PR, cy - PR, PR * 2 + 1, PR * 2 + 1, TILES.DIRT);
  // Stone well in the centre
  if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) map[cy][cx] = TILES.STONE;

  // Possible house slots: (colOffset, rowOffset, w, h, doorSide)
  const slots = [
    // North
    [-(2), -(PR + 5), 5, 4, 'S'],
    // South
    [-(2),   PR + 1,  5, 4, 'N'],
    // West
    [-(PR + 5), -(2), 4, 5, 'E'],
    // East
    [  PR + 1,  -(2), 4, 5, 'W'],
    // NW diagonal
    [-(PR + 5), -(PR + 5), 4, 4, 'E'],
    // NE diagonal
    [  PR + 1,  -(PR + 5), 4, 4, 'W'],
  ];

  // Shuffle and pick 3–5 houses
  const shuffled = [...slots].sort(() => rng() - 0.5);
  const count = 3 + Math.floor(rng() * 3);
  const doors = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const [dc, dr, w, h, door] = shuffled[i];
    const d = _house(map, rows, cols, cx + dc, cy + dr, w, h, door);
    doors.push(d);
  }
  return doors;
}

/**
 * Kingdom — large walled city with outer ramparts, inner keep compound,
 * and interior buildings (barracks, smithy, chapel, inn).
 * cx/cy is the centre of the outer wall.
 * Returns array of { door, id } objects.
 */
function placeKingdom(map, rows, cols, cx, cy) {
  const doors = [];
  const OW = 76, OH = 60;
  const ox = cx - 38, oy = cy - 30;

  // ── COURTYARD FLOOR ─────────────────────────────────────────
  _fill(map, rows, cols, ox + 1, oy + 1, OW - 2, OH - 2, TILES.STONE);

  // ── OUTER WALL PERIMETER ────────────────────────────────────
  for (let dr = 0; dr < OH; dr++) {
    for (let dc = 0; dc < OW; dc++) {
      if (dr !== 0 && dr !== OH - 1 && dc !== 0 && dc !== OW - 1) continue;
      const rr = oy + dr, cc = ox + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.WALL;
    }
  }

  // ── OUTER CORNER TOWERS (5×5, protrude 2 tiles outward) ─────
  for (const [tc, tr] of [
    [ox - 2, oy - 2], [ox + OW - 3, oy - 2],
    [ox - 2, oy + OH - 3], [ox + OW - 3, oy + OH - 3],
  ]) _fill(map, rows, cols, tc, tr, 5, 5, TILES.WALL);

  // ── INTERMEDIATE WALL BUTTRESSES ────────────────────────────
  // Four along N and S walls (skip centre to leave room for gates)
  for (const tc of [ox + 12, ox + 26, ox + 50, ox + 63]) {
    _fill(map, rows, cols, tc - 1, oy - 1,        3, 3, TILES.WALL); // north
    _fill(map, rows, cols, tc - 1, oy + OH - 2,   3, 3, TILES.WALL); // south
  }
  // Three along E and W walls
  for (const tr of [oy + 14, oy + 30, oy + 46]) {
    _fill(map, rows, cols, ox - 1,        tr - 1, 3, 3, TILES.WALL); // west
    _fill(map, rows, cols, ox + OW - 2,   tr - 1, 3, 3, TILES.WALL); // east
  }

  // ── SOUTH GATE (5 wide, centred) ────────────────────────────
  const gateC = cx - 2;
  for (let dc = 0; dc < 5; dc++) {
    const cc = gateC + dc, rr = oy + OH - 1;
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.STONE;
  }
  // Gatehouse flanking towers (outside south wall, 4×4 each)
  _fill(map, rows, cols, gateC - 5, oy + OH - 1, 4, 4, TILES.WALL);
  _fill(map, rows, cols, gateC + 5, oy + OH - 1, 4, 4, TILES.WALL);

  // ── NORTH POSTERN (3 wide, allows northern roads through) ───
  for (let dc = 0; dc < 3; dc++) {
    const cc = cx - 1 + dc, rr = oy;
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.STONE;
  }

  // ── CENTRAL STONE ROAD (south gate → inner compound) ────────
  for (let dr = 1; dr < OH - 1; dr++) {
    const rr = oy + dr;
    if (rr < 0 || rr >= rows) continue;
    for (let dc = 0; dc < 5; dc++) {
      const cc = gateC + dc;
      if (cc >= 0 && cc < cols && map[rr][cc] !== TILES.WALL) map[rr][cc] = TILES.STONE;
    }
  }

  // ── INNER KEEP COMPOUND (IW×IH, 1-thick wall + corner towers) ─
  const IW = 28, IH = 20;
  const ix = cx - 14, iy = oy + 3;

  _fill(map, rows, cols, ix + 1, iy + 1, IW - 2, IH - 2, TILES.STONE);

  for (let dr = 0; dr < IH; dr++) {
    for (let dc = 0; dc < IW; dc++) {
      if (dr !== 0 && dr !== IH - 1 && dc !== 0 && dc !== IW - 1) continue;
      const rr = iy + dr, cc = ix + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.WALL;
    }
  }

  // Inner corner towers (3×3)
  for (const [tc, tr] of [
    [ix - 1, iy - 1], [ix + IW - 2, iy - 1],
    [ix - 1, iy + IH - 2], [ix + IW - 2, iy + IH - 2],
  ]) _fill(map, rows, cols, tc, tr, 3, 3, TILES.WALL);

  // Inner south gate (3 wide, aligned with central road)
  const innerGateC = cx - 1;
  for (let dc = 0; dc < 3; dc++) {
    const cc = innerGateC + dc, rr = iy + IH - 1;
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.STONE;
  }

  // Inner north postern (2 wide)
  for (let dc = 0; dc < 2; dc++) {
    const cc = cx - 1 + dc, rr = iy;
    if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) map[rr][cc] = TILES.STONE;
  }

  // Stone path inside compound from gate to keep
  for (let dr = 1; dr < IH - 1; dr++) {
    const rr = iy + dr;
    if (rr < 0 || rr >= rows) continue;
    for (let dc = 0; dc < 3; dc++) {
      const cc = innerGateC + dc;
      if (cc >= 0 && cc < cols && map[rr][cc] !== TILES.WALL) map[rr][cc] = TILES.STONE;
    }
  }

  // ── CASTLE KEEP BUILDING (16×12, inside inner compound) ─────
  const KW = 16, KH = 12;
  const kc = cx - 8, kr = iy + 2;
  const keepDoor = _house(map, rows, cols, kc, kr, KW, KH, 'S');
  doors.push({ door: keepDoor, id: 'kingdom_keep' });

  // Keep corner towers (3×3)
  for (const [tc, tr] of [
    [kc - 1, kr - 1], [kc + KW - 2, kr - 1],
    [kc - 1, kr + KH - 2], [kc + KW - 2, kr + KH - 2],
  ]) _fill(map, rows, cols, tc, tr, 3, 3, TILES.WALL);

  // ── MARKETPLACE BUILDINGS ───────────────────────────────────
  const bldR  = oy + 22;          // first-tier building start row
  const westC = ox + 5;           // west building column
  const eastC = ox + OW - 17;     // east building column

  /** Helper: push a building, record its door and roof bounds */
  const roofBounds = [];
  function _bld(c, r, w, h, id, floorTile = TILES.STONE) {
    const door = _house(map, rows, cols, c, r, w, h, 'S');
    doors.push({ door, id });
    roofBounds.push({ c: c + 1, r: r + 1, rW: w - 2, rH: h - 2,
                      bC: c, bR: r, bW: w, bH: h,
                      doorC: door.col, doorR: door.row, doorFace: 'south', floorTile });
  }

  // Keep roof bounds
  roofBounds.push({ c: kc + 1, r: kr + 1, rW: KW - 2, rH: KH - 2,
                    bC: kc, bR: kr, bW: KW, bH: KH,
                    doorC: keepDoor.col, doorR: keepDoor.row, doorFace: 'south' });

  // ── West side (3 stacked) ───────────────────────────────────
  _bld(westC, bldR,      12, 8, 'kingdom_butcher',    TILES.WOOD_FLOOR);
  // ── Butcher interior ──────────────────────────────────────────
  // Building: (westC, bldR) 12 wide × 8 tall, inner 10×6 at offsets dc=1..10, dr=1..6
  {
    const bc = westC, br = bldR;

    // Warm wooden plank floor throughout
    for (let dr = 1; dr <= 6; dr++)
      for (let dc = 1; dc <= 10; dc++)
        map[br + dr][bc + dc] = TILES.WOOD_FLOOR;

    // Meat hook display along north inner wall (row br+1)
    // Gap at bc+6 aligns with NPC position and door below
    const gapC = bc + 6;
    for (let dc = 1; dc <= 10; dc++)
      if (bc + dc !== gapC) map[br + 1][bc + dc] = TILES.MEAT_HOOK;

    // Butcher's chopping blocks flanking the aisle (row br+3)
    map[br + 3][bc + 3] = TILES.BUTCHER_BLOCK;
    map[br + 3][bc + 8] = TILES.BUTCHER_BLOCK;

    // Storage barrels in the rear corners (row br+5)
    map[br + 5][bc + 1]  = TILES.BARREL;
    map[br + 5][bc + 10] = TILES.BARREL;

    // Hearth fireplace in the south-west inner corner (row br+6)
    map[br + 6][bc + 1]  = TILES.HEARTH;
  }

  _bld(westC, bldR + 11, 10, 7, 'kingdom_fishmonger', TILES.WET_STONE);
  // ── Fishmonger interior ────────────────────────────────────────────────────
  // Building: (westC, bldR+11) 10 wide × 7 tall → inner 8×5 at dc=1..8, dr=1..5
  // Fishmonger NPC stands at col westC+5 (gap in counter row)
  {
    const bc = westC, br = bldR + 11;
    // Wet cobblestone floor throughout
    for (let dr = 1; dr <= 5; dr++)
      for (let dc = 1; dc <= 8; dc++)
        map[br + dr][bc + dc] = TILES.WET_STONE;
    // Fish counter along north inner wall; gap at dc=5 for NPC
    for (let dc = 1; dc <= 8; dc++)
      if (dc !== 5) map[br + 1][bc + dc] = TILES.FISH_COUNTER;
    // Fish tanks flanking the aisle (row br+2)
    map[br + 2][bc + 1] = TILES.FISH_TANK;
    map[br + 2][bc + 8] = TILES.FISH_TANK;
    // Ice boxes near the entrance (row br+4)
    map[br + 4][bc + 1] = TILES.ICE_BOX;
    map[br + 4][bc + 8] = TILES.ICE_BOX;
  }

  _bld(westC, bldR + 21, 12, 7, 'kingdom_variety',    TILES.WOOD_FLOOR);
  // ── Variety shop interior ──────────────────────────────────────────────────
  // Building: (westC, bldR+21) 12 wide × 7 tall → inner 10×5 at dc=1..10, dr=1..5
  // VarietyKeeper NPC at col westC+6 (dc=6), row bldR+23 (dr=2)
  {
    const bc = westC, br = bldR + 21;
    // Warm wood floor throughout
    for (let dr = 1; dr <= 5; dr++)
      for (let dc = 1; dc <= 10; dc++)
        map[br + dr][bc + dc] = TILES.WOOD_FLOOR;
    // Display shelves along north inner wall (dr=1, full row)
    for (let dc = 1; dc <= 10; dc++)
      map[br + 1][bc + dc] = TILES.DISPLAY_SHELF;
    // Barrels flanking mid-aisle (dr=3, corners)
    map[br + 3][bc + 1]  = TILES.BARREL;
    map[br + 3][bc + 10] = TILES.BARREL;
    // Side shelves near entrance (dr=4, outer pairs)
    map[br + 4][bc + 1]  = TILES.DISPLAY_SHELF;
    map[br + 4][bc + 2]  = TILES.DISPLAY_SHELF;
    map[br + 4][bc + 9]  = TILES.DISPLAY_SHELF;
    map[br + 4][bc + 10] = TILES.DISPLAY_SHELF;
  }

  // ── East side (3 stacked) ───────────────────────────────────
  _bld(eastC, bldR,      12, 8, 'kingdom_weapons',    TILES.STONE_TILE);
  // ── Weapons shop interior ─────────────────────────────────────────────────
  // Building: (eastC, bldR) 12 wide × 8 tall → inner 10×6 at dc=1..10, dr=1..6
  // WeaponKeeper NPC at col eastC+6 (dc=6), row bldR+202 (dr=2)
  {
    const bc = eastC, br = bldR;
    // Dark armory stone floor throughout
    for (let dr = 1; dr <= 6; dr++)
      for (let dc = 1; dc <= 10; dc++)
        map[br + dr][bc + dc] = TILES.STONE_TILE;
    // Weapon racks along full north inner wall (dr=1)
    for (let dc = 1; dc <= 10; dc++)
      map[br + 1][bc + dc] = TILES.WEAPON_RACK;
    // Armor stands flanking the room in two rows
    map[br + 2][bc + 1]  = TILES.ARMOR_STAND;
    map[br + 2][bc + 10] = TILES.ARMOR_STAND;
    map[br + 4][bc + 1]  = TILES.ARMOR_STAND;
    map[br + 4][bc + 10] = TILES.ARMOR_STAND;
  }

  _bld(eastC, bldR + 11, 10, 7, 'kingdom_capes',      TILES.TEXTILE_FLOOR);
  // ── Cape shop interior ────────────────────────────────────────────────────
  // Building: (eastC, bldR+11) 10 wide × 7 tall → inner 8×5 at dc=1..8, dr=1..5
  // CapeKeeper NPC at col eastC+5 (dc=5), row bldR+213 (dr=2)
  {
    const bc = eastC, br = bldR + 11;
    // Textile floor throughout
    for (let dr = 1; dr <= 5; dr++)
      for (let dc = 1; dc <= 8; dc++)
        map[br + dr][bc + dc] = TILES.TEXTILE_FLOOR;
    // Cape displays along full north inner wall (dr=1)
    for (let dc = 1; dc <= 8; dc++)
      map[br + 1][bc + dc] = TILES.CAPE_DISPLAY;
    // Tailor tables flanking the room (dr=2 and dr=4, sides)
    map[br + 2][bc + 1] = TILES.TAILOR_TABLE;
    map[br + 2][bc + 8] = TILES.TAILOR_TABLE;
    map[br + 4][bc + 1] = TILES.TAILOR_TABLE;
    map[br + 4][bc + 8] = TILES.TAILOR_TABLE;
  }

  _bld(eastC, bldR + 21, 12, 7, 'kingdom_exchange');

  // ── MARKETPLACE PATH NETWORK ────────────────────────────────
  // Central spine: 3-wide cobblestone walkway from south gate to top of shops
  // (spine centre = cx; runs cols cx-1 .. cx+1 = 511..513)
  const spineC1 = cx - 1, spineC2 = cx + 1;
  for (let pr = bldR + 1; pr <= oy + OH - 2; pr++) {
    for (let pc = spineC1; pc <= spineC2; pc++) {
      if (map[pr][pc] !== TILES.WALL && map[pr][pc] !== TILES.DOOR)
        map[pr][pc] = TILES.PATH;
    }
  }

  // Horizontal branches: 2 rows wide, starting one row below each door row.
  // Extend from west building left edge to spine (west side) and spine to east
  // building right edge — so the path covers the full area in front of each door.
  const shopTiers = [
    { doorRow: bldR + 8,  eastW: 12 },  // one row below butcher/weapons doors
    { doorRow: bldR + 18, eastW: 10 },  // one row below fishmonger/capes doors
    { doorRow: bldR + 28, eastW: 12 },  // one row below variety/exchange doors
  ];
  for (const { doorRow, eastW } of shopTiers) {
    for (let dr = 0; dr < 2; dr++) {
      const pr = doorRow + dr;
      if (pr < 0 || pr >= rows) continue;
      // West branch: west building left edge → spine left edge
      for (let pc = westC; pc < spineC1; pc++) {
        if (pc >= 0 && pc < cols && map[pr][pc] !== TILES.WALL && map[pr][pc] !== TILES.DOOR)
          map[pr][pc] = TILES.PATH;
      }
      // East branch: spine right edge → east building right edge (inclusive)
      for (let pc = spineC2 + 1; pc <= eastC + eastW - 1; pc++) {
        if (pc >= 0 && pc < cols && map[pr][pc] !== TILES.WALL && map[pr][pc] !== TILES.DOOR)
          map[pr][pc] = TILES.PATH;
      }
    }
  }

  // 5×5 fountains flanking the spine at the top of the marketplace
  const fountainRow = bldR + 5;   // row 205 — fountain centres
  const fountainWC  = cx - 8;     // col 504 — west fountain centre
  const fountainEC  = cx + 8;     // col 520 — east fountain centre
  for (const fc of [fountainWC, fountainEC]) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const fr = fountainRow + dr, fcc = fc + dc;
        if (fr >= 0 && fr < rows && fcc >= 0 && fcc < cols)
          map[fr][fcc] = TILES.FOUNTAIN;
      }
    }
  }

  // ── Elevated planter boxes (3 wide × 6 tall each) ───────
  // Placed in the open stone strips between the buildings and the central spine.
  // westC=479, west building east wall = westC+11=490  → first free col = 491
  // eastC=533, east building west wall = eastC        → last free col  = 532
  // Each planter: top-left corner at (planterCol, planterRow), size 3×6.

  /** Fill a 3-wide × 6-tall planter block, skipping walls/doors/paths/fountains. */
  function _planter(pc, pr, type) {
    for (let dr = 0; dr < 6; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const fc = pc + dc, fr = pr + dr;
        if (fr >= 0 && fr < rows && fc >= 0 && fc < cols &&
            map[fr][fc] !== TILES.WALL && map[fr][fc] !== TILES.DOOR &&
            map[fr][fc] !== TILES.PATH && map[fr][fc] !== TILES.FOUNTAIN)
          map[fr][fc] = type;
      }
    }
  }

  // All planters centred at X=507 (west) and X=517 (east).
  // 3-wide block: left col = centre - 1 → col 506 (west) and col 516 (east).
  const pWest = 506, pEast = 516;

  // Middle tier (rows bldR+11..+16 = 211-216): PLANTER_BUSH — alongside tier-2 buildings
  _planter(pWest, bldR + 11, TILES.PLANTER_BUSH);
  _planter(pEast, bldR + 11, TILES.PLANTER_BUSH);
  // Lower tier (rows bldR+21..+26 = 221-226): PLANTER_FLOWERS — alongside tier-3 buildings
  _planter(pWest, bldR + 21, TILES.PLANTER_FLOWERS);
  _planter(pEast, bldR + 21, TILES.PLANTER_FLOWERS);
  // New bottom tier (rows bldR+31..+36 = 231-236): PLANTER_BUSH — south of tier-3 path
  _planter(pWest, bldR + 31, TILES.PLANTER_BUSH);
  _planter(pEast, bldR + 31, TILES.PLANTER_BUSH);

  // ── Signposts outside shop doors ───────────────────────────
  // (SIGN tile placed 1 row south of each door, on the walkway)
  const signRow = bldR + 8 - 1 + 1;  // 1 tile south of first-row doors
  if (signRow >= 0 && signRow < rows) {
    const midW = westC + 6;
    const midE = eastC + 6;
    if (midW >= 0 && midW < cols) map[signRow][midW] = TILES.SIGN;
    if (midE >= 0 && midE < cols) map[signRow][midE] = TILES.SIGN;
  }

  // ── DECORATIONS ─────────────────────────────────────────────
  // Central plaza well (between inner gate and south buildings)
  const plazaR = iy + IH + 3, plazaC = cx - 4;
  _fill(map, rows, cols, plazaC, plazaR, 9, 5, TILES.STONE);
  const wellR = plazaR + 2, wellC = cx;
  if (wellR >= 0 && wellR < rows && wellC >= 0 && wellC < cols) map[wellR][wellC] = TILES.WALL;

  // Flower gardens flanking the plaza
  for (const fc of [plazaC - 2, plazaC - 1]) {
    for (let fr = plazaR; fr < plazaR + 3; fr++) {
      if (fr >= 0 && fr < rows && fc >= 0 && fc < cols && map[fr][fc] === TILES.STONE)
        map[fr][fc] = TILES.FLOWERS;
    }
  }
  for (const fc of [plazaC + 9, plazaC + 10]) {
    for (let fr = plazaR; fr < plazaR + 3; fr++) {
      if (fr >= 0 && fr < rows && fc >= 0 && fc < cols && map[fr][fc] === TILES.STONE)
        map[fr][fc] = TILES.FLOWERS;
    }
  }

  // Torch braziers flanking the inner compound south gate
  const torchR = iy + IH;
  for (const torchC of [innerGateC - 2, innerGateC + 3]) {
    if (torchR >= 0 && torchR < rows && torchC >= 0 && torchC < cols &&
        map[torchR][torchC] === TILES.STONE)
      map[torchR][torchC] = TILES.FIRE;
  }

  return { doors, roofBounds };
}

/**
 * Watchtower — solid 5×5 stone tower.
 * cx/cy is the centre.
 */
function placeWatchtower(map, rows, cols, cx, cy) {
  _fill(map, rows, cols, cx - 2, cy - 2, 5, 5, TILES.WALL);
  _fill(map, rows, cols, cx - 1, cy - 1, 3, 3, TILES.STONE);
  // Door south
  const rr = cy + 2;
  if (rr >= 0 && rr < rows && cx >= 0 && cx < cols) map[rr][cx] = TILES.DOOR;
  return [{ col: cx, row: rr }];
}

/**
 * Military outpost — rectangular fortified building with a small outer palisade.
 * cx/cy is the centre.
 */
function placeOutpost(map, rows, cols, cx, cy) {
  // Main building 10×7
  const mainDoor = _house(map, rows, cols, cx - 5, cy - 3, 10, 7, 'S');
  // Outer palisade wall strips on N/E/W sides (1 tile thick, 2 tiles away)
  _fill(map, rows, cols, cx - 7, cy - 5, 14, 1, TILES.WALL);  // north
  _fill(map, rows, cols, cx - 7, cy - 4, 1, 8,  TILES.WALL);  // west
  _fill(map, rows, cols, cx + 6, cy - 4, 1, 8,  TILES.WALL);  // east
  // Gate gap in south palisade — left open intentionally
  return [mainDoor];
}

/**
 * Ruins — a crumbling building with partial walls and scattered stone floor.
 * cx/cy is the centre.
 */
function placeRuins(map, rows, cols, cx, cy, rng) {
  const w = 9 + Math.floor(rng() * 5);
  const h = 6 + Math.floor(rng() * 4);
  const ox = cx - Math.floor(w / 2);
  const oy = cy - Math.floor(h / 2);

  // Scattered stone floor (not solid, just visual)
  for (let dr = 1; dr < h - 1; dr++) {
    for (let dc = 1; dc < w - 1; dc++) {
      const rr = oy + dr, cc = ox + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
        if (rng() < 0.55) map[rr][cc] = TILES.STONE;
      }
    }
  }

  // Broken perimeter walls — each wall tile has a ~50% chance of being missing
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      if (dr !== 0 && dr !== h - 1 && dc !== 0 && dc !== w - 1) continue;
      const rr = oy + dr, cc = ox + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      if (rng() < 0.52) map[rr][cc] = TILES.WALL;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   MAP-LEVEL LAYOUT
   ═══════════════════════════════════════════════════════ */

/**
 * All named structure positions on the 1024×768 grid.
 * Spawn is at approximately (512, 389).
 */
export const STRUCTURE_NODES = [
  // Villages
  { id: 'village_w',   c: 340, r: 435, type: 'village'    },
  { id: 'village_e',   c: 672, r: 420, type: 'village'    },
  { id: 'village_n',   c: 455, r: 198, type: 'village'    },
  { id: 'village_sw',  c: 238, r: 372, type: 'village'    },
  // Kingdom — walled city north of spawn
  { id: 'kingdom',     c: 512, r: 208, type: 'kingdom'    },
  // Watchtowers
  { id: 'tower_nw',    c: 148, r: 208, type: 'watchtower' },
  { id: 'tower_ne',    c: 798, r: 202, type: 'watchtower' },
  // Military outpost near danger zone
  { id: 'outpost',     c: 718, r: 262, type: 'outpost'    },
  // Ruins
  { id: 'ruins_swamp', c: 198, r: 618, type: 'ruins'      },
  { id: 'ruins_desert',c: 622, r: 658, type: 'ruins'      },
];

/** Road network — pairs of node IDs to connect with dirt paths. */
const ROADS = [
  // Main roads from spawn
  ['spawn',       'village_w'  ],
  ['spawn',       'village_e'  ],
  ['spawn',       'kingdom'    ],
  // Secondary roads
  ['village_w',   'village_sw' ],
  ['village_w',   'kingdom'    ],
  ['village_e',   'kingdom'    ],
  ['village_n',   'kingdom'    ],
  ['village_sw',  'tower_nw'   ],
  // Northern road toward danger zone
  ['kingdom',     'tower_ne'   ],
  ['tower_ne',    'outpost'    ],
  ['village_e',   'outpost'    ],
];

/**
 * Place all structures and draw the road network.
 * Call this after terrain + vegetation phases, before the spawn building.
 * Returns a Map of "col,row" string → interiorId string.
 */
export function placeAllStructures(map, rows, cols, rng) {
  const spawnC = Math.floor(cols / 2);
  const spawnR = Math.floor(rows / 2) + 5;

  const nodes = { spawn: { c: spawnC, r: spawnR } };
  for (const n of STRUCTURE_NODES) nodes[n.id] = { c: n.c, r: n.r };

  const doorMap = new Map(); // "col,row" → interiorId string
  const roofBounds = [];

  // 1. Draw roads first
  for (const [a, b] of ROADS) {
    const na = nodes[a], nb = nodes[b];
    if (na && nb) drawPath(map, rows, cols, na.c, na.r, nb.c, nb.r, rng);
  }

  // 2. Place structures and collect door positions
  for (const node of STRUCTURE_NODES) {
    let doors = [];
    switch (node.type) {
      case 'village': {
        const houseDoors = placeVillage(map, rows, cols, node.c, node.r, rng);
        houseDoors.forEach((d, i) => {
          doorMap.set(`${d.col},${d.row}`, `${node.id}_house_${i}`);
        });
        break;
      }
      case 'kingdom': {
        const kd = placeKingdom(map, rows, cols, node.c, node.r);
        kd.doors.forEach(({ door, id }) => doorMap.set(`${door.col},${door.row}`, id));
        kd.roofBounds.forEach(rb => roofBounds.push(rb));
        break;
      }
      case 'watchtower': {
        doors = placeWatchtower(map, rows, cols, node.c, node.r);
        doors.forEach(d => doorMap.set(`${d.col},${d.row}`, `${node.id}_interior`));
        break;
      }
      case 'outpost': {
        doors = placeOutpost(map, rows, cols, node.c, node.r);
        doors.forEach(d => doorMap.set(`${d.col},${d.row}`, 'outpost_interior'));
        break;
      }
      case 'ruins':
        placeRuins(map, rows, cols, node.c, node.r, rng);
        break;
    }
  }

  return { doorMap, roofBounds };
}
