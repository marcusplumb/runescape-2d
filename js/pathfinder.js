import { WORLD_COLS, WORLD_ROWS } from './constants.js';

/**
 * 8-direction BFS pathfinding on the tile grid.
 *
 * Reuses module-level typed arrays to avoid per-call allocations.
 *
 * Returns an array of { col, row } from the tile AFTER start
 * up to goal (inclusive).
 *
 * Returns [] if:
 * - start === goal
 * - start/goal are out of bounds
 * - no path exists
 * - BFS exploration exceeds MAX_TILES
 */

const N = WORLD_COLS * WORLD_ROWS;
const _parent = new Int32Array(N);
const _queue = new Int32Array(N);

// 8 directions: E, W, S, N, SE, SW, NE, NW
const DC = [ 1, -1,  0,  0,  1, -1,  1, -1 ];
const DR = [ 0,  0,  1, -1,  1,  1, -1, -1 ];

const MAX_TILES = 80_000;

// Reused arrays for goal-biased direction ordering
const _dirOrder = new Int8Array(8);
const _dirScore = new Float64Array(8);

function inBounds(col, row) {
  return col >= 0 && col < WORLD_COLS && row >= 0 && row < WORLD_ROWS;
}

function isDiagonalDir(d) {
  return DC[d] !== 0 && DR[d] !== 0;
}

/**
 * Prevent diagonal corner cutting:
 * if moving diagonally, both touching orthogonal tiles must be walkable.
 */
function canStep(world, c, r, d) {
  const nc = c + DC[d];
  const nr = r + DR[d];

  if (!inBounds(nc, nr)) return false;
  if (world.isSolid(nc, nr)) return false;

  if (isDiagonalDir(d)) {
    const side1c = c + DC[d];
    const side1r = r;
    const side2c = c;
    const side2r = r + DR[d];

    if (world.isSolid(side1c, side1r) || world.isSolid(side2c, side2r)) {
      return false;
    }
  }

  return true;
}

/**
 * Bias neighbour expansion toward the goal so the chosen path feels cleaner.
 * This does not affect correctness, just which tied shortest path is chosen.
 */
function computeDirOrder(col, row, goalCol, goalRow) {
  const dx = goalCol - col;
  const dy = goalRow - row;

  for (let d = 0; d < 8; d++) {
    // Higher score = more aligned with the goal direction
    let score = DC[d] * dx + DR[d] * dy;

    // Slightly prefer diagonals when both axes differ
    if (dx !== 0 && dy !== 0 && isDiagonalDir(d)) score += 0.25;

    _dirOrder[d] = d;
    _dirScore[d] = score;
  }

  // Insertion sort 8 items by descending score
  for (let i = 1; i < 8; i++) {
    const ord = _dirOrder[i];
    const sc = _dirScore[ord];
    let j = i - 1;

    while (j >= 0 && _dirScore[_dirOrder[j]] < sc) {
      _dirOrder[j + 1] = _dirOrder[j];
      j--;
    }

    _dirOrder[j + 1] = ord;
  }
}

export function findPath(world, startCol, startRow, goalCol, goalRow) {
  if (!inBounds(startCol, startRow) || !inBounds(goalCol, goalRow)) return [];
  if (startCol === goalCol && startRow === goalRow) return [];

  _parent.fill(-1);

  const si = startCol + startRow * WORLD_COLS;
  const gi = goalCol + goalRow * WORLD_COLS;

  _parent[si] = si;

  let head = 0;
  let tail = 0;

  _queue[tail++] = si;

  let found = false;
  let explored = 0;

  while (head < tail && explored < MAX_TILES) {
    const ci = _queue[head++];
    const c = ci % WORLD_COLS;
    const r = Math.floor(ci / WORLD_COLS);

    explored++;

    if (ci === gi) {
      found = true;
      break;
    }

    computeDirOrder(c, r, goalCol, goalRow);

    for (let k = 0; k < 8; k++) {
      const d = _dirOrder[k];
      if (!canStep(world, c, r, d)) continue;

      const nc = c + DC[d];
      const nr = r + DR[d];
      const ni = nc + nr * WORLD_COLS;

      if (_parent[ni] !== -1) continue;

      _parent[ni] = ci;
      _queue[tail++] = ni;
    }
  }

  if (!found) return [];

  const path = [];
  let i = gi;

  while (i !== si) {
    path.push({
      col: i % WORLD_COLS,
      row: Math.floor(i / WORLD_COLS),
    });
    i = _parent[i];
  }

  path.reverse();
  return path;
}

/**
 * Returns the walkable tile adjacent to (col, row) that is closest to
 * (fromCol, fromRow), or null if none are reachable.
 *
 * Includes diagonals, but still disallows corner cutting.
 */
export function nearestWalkableAdjacent(world, col, row, fromCol, fromRow) {
  if (!inBounds(col, row)) return null;

  let best = null;
  let bestDist = Infinity;

  for (let d = 0; d < 8; d++) {
    const nc = col + DC[d];
    const nr = row + DR[d];

    if (!inBounds(nc, nr)) continue;
    if (world.isSolid(nc, nr)) continue;

    if (isDiagonalDir(d)) {
      const side1c = col + DC[d];
      const side1r = row;
      const side2c = col;
      const side2r = row + DR[d];

      if (world.isSolid(side1c, side1r) || world.isSolid(side2c, side2r)) {
        continue;
      }
    }

    const dist = Math.hypot(nc - fromCol, nr - fromRow);

    if (dist < bestDist) {
      bestDist = dist;
      best = { col: nc, row: nr };
    }
  }

  return best;
}