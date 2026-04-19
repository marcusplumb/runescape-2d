import { CAMERA_LERP, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from './constants.js';

/**
 * Clamp a camera axis.
 * If the map fits entirely inside the viewport, centre it (may be negative).
 * Otherwise clamp to [0, mapSize - viewSize].
 */
function _clampAxis(ideal, mapSize, viewSize) {
  if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
  return Math.max(0, Math.min(ideal, mapSize - viewSize));
}

// Lookahead offset in tiles applied in the player's movement direction
const LOOKAHEAD_TILES = 1.5;

// Player direction constants (mirrors DIR in player.js — no import needed)
const DIR_DOWN  = 0;
const DIR_LEFT  = 1;
const DIR_RIGHT = 2;
const DIR_UP    = 3;

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.mapW = WORLD_WIDTH;
    this.mapH = WORLD_HEIGHT;

    // World zoom factor. Applied in begin()/screenToWorld — HUD draws at 1.0
    // because it renders outside the camera transform.
    this.zoom = 1.25;

    // Adaptive lerp state
    this._moving     = false;
    this._movingTime = 0;

    // Last computed ideal target (pre-clamp) — used to detect movement
    this._lastIdealX = null;
    this._lastIdealY = null;

    // Lookahead blend weight (0 = idle, 1 = full speed)
    this._lookAheadWeight = 0;
  }

  /** Call whenever the active map changes (world ↔ interior ↔ raid). */
  setBounds(mapW = WORLD_WIDTH, mapH = WORLD_HEIGHT) {
    this.mapW = mapW;
    this.mapH = mapH;
  }

  /**
   * Smoothly follow a target point (player centre).
   * @param {number} targetX  - player centre X in world pixels
   * @param {number} targetY  - player centre Y in world pixels
   * @param {number} dt       - delta time in seconds
   * @param {object} [player] - optional Player instance for lookahead/speed
   */
  follow(targetX, targetY, dt, player) {
    // ── Movement lookahead ─────────────────────────────────
    // Blend lookahead based on whether the player is actually moving
    const isMoving = player && player.moving;
    this._lookAheadWeight += ((isMoving ? 1 : 0) - this._lookAheadWeight) * Math.min(dt * 8, 1);

    let lookaheadX = 0;
    let lookaheadY = 0;

    if (player && this._lookAheadWeight > 0.001) {
      const offset = LOOKAHEAD_TILES * TILE_SIZE * this._lookAheadWeight;
      switch (player.dir) {
        case DIR_DOWN:  lookaheadY = +offset; break;
        case DIR_UP:    lookaheadY = -offset; break;
        case DIR_RIGHT: lookaheadX = +offset; break;
        case DIR_LEFT:  lookaheadX = -offset; break;
      }
    }

    // Viewport dimensions in WORLD units (shrinks when zoom > 1 → shows less world)
    const viewW = this.canvas.width  / this.zoom;
    const viewH = this.canvas.height / this.zoom;

    const idealX = (targetX + lookaheadX) - viewW / 2;
    const idealY = (targetY + lookaheadY) - viewH / 2;

    // ── Adaptive lerp ──────────────────────────────────────
    // Detect whether the target is changing by more than 0.5 tiles per frame
    const tileThreshold = TILE_SIZE * 0.5;
    if (this._lastIdealX !== null) {
      const moved = Math.abs(idealX - this._lastIdealX) > tileThreshold ||
                    Math.abs(idealY - this._lastIdealY) > tileThreshold;
      if (moved) {
        this._moving     = true;
        this._movingTime = 0;
      } else {
        this._movingTime += dt;
        if (this._movingTime > 0.3) {
          this._moving = false;
        }
      }
    }
    this._lastIdealX = idealX;
    this._lastIdealY = idealY;

    // Faster lerp factor when the target is actively moving
    const lerpSpeed = (this._moving && this._movingTime < 0.3)
      ? CAMERA_LERP * 1.8
      : CAMERA_LERP;

    // dt-based exponential smoothing — frame-rate independent
    const k = 1 - Math.exp(-lerpSpeed * dt);
    this.x += (idealX - this.x) * k;
    this.y += (idealY - this.y) * k;

    // ── Bounds clamping ────────────────────────────────────
    // Camera x/y is the top-left corner of the viewport; must not go out of map.
    // The viewport is scaled down by zoom when expressed in world units.
    this.x = _clampAxis(this.x, this.mapW, viewW);
    this.y = _clampAxis(this.y, this.mapH, viewH);
  }

  /** Snap to target instantly (e.g. on init or map transition) */
  snapTo(targetX, targetY) {
    const viewW = this.canvas.width  / this.zoom;
    const viewH = this.canvas.height / this.zoom;
    this.x = _clampAxis(targetX - viewW / 2, this.mapW, viewW);
    this.y = _clampAxis(targetY - viewH / 2, this.mapH, viewH);
    // Reset adaptive-lerp state so the snap doesn't trigger a fast-lerp burst
    this._lastIdealX = null;
    this._lastIdealY = null;
    this._moving     = false;
    this._movingTime = 0;
    this._lookAheadWeight = 0;
  }

  /** Apply camera transform to canvas context */
  begin(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  end(ctx) {
    ctx.restore();
  }

  /** Convert screen coords → world coords (accounts for zoom). */
  screenToWorld(sx, sy) {
    return { x: sx / this.zoom + this.x, y: sy / this.zoom + this.y };
  }
}
