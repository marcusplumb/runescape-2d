/**
 * Manages chat-style notifications and XP drop popups.
 */

const CATEGORY_COLORS = {
  combat:  '#e74c3c',
  xp:      '#27ae60',
  loot:    '#f1c40f',
  system:  '#ffffff',
  warning: '#e67e22',
};

export class Notifications {
  constructor() {
    this.messages = [];     // { text, color, timer, time } — oldest first
    this.xpDrops = [];      // { text, color, x, y, timer }
    this.maxMessages = 30;
    this.msgLifetime = 20;  // seconds
    this.dropLifetime = 2;
  }

  /**
   * Add a chat-log style message.
   * @param {string} text
   * @param {string|null} [color]    - hex color string (backwards compatible)
   * @param {string|null} [category] - key from CATEGORY_COLORS; used when color is omitted
   */
  add(text, color, category) {
    let resolvedColor;
    if (color) {
      resolvedColor = color;
    } else if (category && CATEGORY_COLORS[category]) {
      resolvedColor = CATEGORY_COLORS[category];
    } else {
      resolvedColor = '#fff';
    }
    this.messages.push({ text, color: resolvedColor, timer: this.msgLifetime, time: Date.now() });
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  /** Add a floating XP drop at a screen position */
  xpDrop(text, color, screenX, screenY) {
    this.xpDrops.push({ text, color, x: screenX, y: screenY, timer: this.dropLifetime });
  }

  update(dt) {
    // Age messages
    for (let i = this.messages.length - 1; i >= 0; i--) {
      this.messages[i].timer -= dt;
      if (this.messages[i].timer <= 0) this.messages.splice(i, 1);
    }
    // Age XP drops
    for (let i = this.xpDrops.length - 1; i >= 0; i--) {
      this.xpDrops[i].timer -= dt;
      this.xpDrops[i].y -= 30 * dt; // float upward
      if (this.xpDrops[i].timer <= 0) this.xpDrops.splice(i, 1);
    }
  }

  /** @deprecated Rendering is now handled by game._drawChat (unified box). */
  drawMessages() {}

  /** Draw floating XP drops */
  drawXpDrops(ctx) {
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';

    for (const drop of this.xpDrops) {
      const alpha = Math.min(1, drop.timer / 0.5);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(drop.text, drop.x, drop.y);
      ctx.fillStyle = drop.color;
      ctx.fillText(drop.text, drop.x, drop.y);
    }
    ctx.globalAlpha = 1;
  }
}
