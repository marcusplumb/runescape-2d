import { CAMERA_LERP, WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
  }

  /** Smoothly follow a target point (player centre) */
  follow(targetX, targetY, dt) {
    const idealX = targetX - this.canvas.width / 2;
    const idealY = targetY - this.canvas.height / 2;

    // dt-based exponential smoothing — frame-rate independent and very tight
    // so the camera stays locked to the already-interpolated player position
    const k = 1 - Math.exp(-CAMERA_LERP * dt);
    this.x += (idealX - this.x) * k;
    this.y += (idealY - this.y) * k;

    // Clamp so we don't show outside the world
    this.x = Math.max(0, Math.min(this.x, WORLD_WIDTH - this.canvas.width));
    this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT - this.canvas.height));
  }

  /** Snap to target instantly (e.g. on init) */
  snapTo(targetX, targetY) {
    this.x = targetX - this.canvas.width / 2;
    this.y = targetY - this.canvas.height / 2;
    this.x = Math.max(0, Math.min(this.x, WORLD_WIDTH - this.canvas.width));
    this.y = Math.max(0, Math.min(this.y, WORLD_HEIGHT - this.canvas.height));
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
