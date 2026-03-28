/**
 * Manages chat-style notifications and XP drop popups.
 */
export class Notifications {
  constructor() {
    this.messages = [];     // { text, color, timer }
    this.xpDrops = [];      // { text, color, x, y, timer }
    this.maxMessages = 8;
    this.msgLifetime = 6;   // seconds
    this.dropLifetime = 2;
  }

  /** Add a chat-log style message */
  add(text, color = '#fff') {
    this.messages.unshift({ text, color, timer: this.msgLifetime });
    if (this.messages.length > this.maxMessages) {
      this.messages.pop();
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

  /** Draw chat log (bottom-left, above coords) */
  drawMessages(ctx, canvasH) {
    const baseY = canvasH - 50;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      const alpha = Math.min(1, msg.timer / 1.5); // fade out
      const y = baseY - i * 16;

      ctx.fillStyle = `rgba(0,0,0,${0.5 * alpha})`;
      ctx.fillRect(8, y - 12, ctx.measureText(msg.text).width + 12, 16);

      ctx.fillStyle = msg.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      // Handle hex colors
      if (msg.color.startsWith('#')) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = msg.color;
      }
      ctx.fillText(msg.text, 14, y);
      ctx.globalAlpha = 1;
    }
  }

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
