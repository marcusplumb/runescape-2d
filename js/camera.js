import { CAMERA_LERP, WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

/**
 * Clamp a camera axis.
 * If the map fits entirely inside the viewport, centre it (may be negative).
 * Otherwise clamp to [0, mapSize - viewSize].
 */
function _clampAxis(ideal, mapSize, viewSize) {
  if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
  return Math.max(0, Math.min(ideal, mapSize - viewSize));
}

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.mapW = WORLD_WIDTH;
    this.mapH = WORLD_HEIGHT;
  }

  /** Call whenever the active map changes (world ↔ interior ↔ raid). */
  setBounds(mapW = WORLD_WIDTH, mapH = WORLD_HEIGHT) {
    this.mapW = mapW;
    this.mapH = mapH;
  }

  /** Smoothly follow a target point (player centre) */
  follow(targetX, targetY, dt) {
    const idealX = targetX - this.canvas.width  / 2;
    const idealY = targetY - this.canvas.height / 2;

    // dt-based exponential smoothing — frame-rate independent and very tight
    const k = 1 - Math.exp(-CAMERA_LERP * dt);
    this.x += (idealX - this.x) * k;
    this.y += (idealY - this.y) * k;

    this.x = _clampAxis(this.x, this.mapW, this.canvas.width);
    this.y = _clampAxis(this.y, this.mapH, this.canvas.height);
  }

  /** Snap to target instantly (e.g. on init or map transition) */
  snapTo(targetX, targetY) {
    this.x = _clampAxis(targetX - this.canvas.width  / 2, this.mapW, this.canvas.width);
    this.y = _clampAxis(targetY - this.canvas.height / 2, this.mapH, this.canvas.height);
  }

  /** Apply camera transform to canvas context */
  begin(ctx) {
    ctx.save();
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  end(ctx) {
    ctx.restore();
  }

  /** Convert screen coords → world coords */
  screenToWorld(sx, sy) {
    return { x: sx + this.x, y: sy + this.y };
  }
}
