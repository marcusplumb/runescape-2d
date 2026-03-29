/**
 * dungeonMaster.js — The Dungeon Master NPC.
 *
 * Positioned near the player spawn area.  Clicking him opens the raid menu.
 * The sprite is a hooded, staff-carrying figure with glowing teal eyes and
 * a gold-trimmed dark-purple robe to make him visually distinctive.
 */

import { TILE_SIZE } from './constants.js';

// World-tile position of the Dungeon Master.
// Adjust these to move him in the overworld (col, row).
const DM_COL = 505;
const DM_ROW = 375;

export class DungeonMasterNPC {
  constructor() {
    this.x = DM_COL * TILE_SIZE;
    this.y = DM_ROW * TILE_SIZE;
    this.w = 24;
    this.h = 32;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  /** World-space hit test used by the click handler in game.js. */
  containsWorld(wx, wy) {
    const pad = 4;
    return wx >= this.x - pad && wx <= this.x + this.w + pad &&
           wy >= this.y - pad && wy <= this.y + this.h + pad;
  }

  /** Draw in world-space (called inside camera.begin / camera.end). */
  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // ── Shadow ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 31, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Legs (robe bottom) ────────────────────────────────────────────────
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(x +  7, y + 20, 5, 12);
    ctx.fillRect(x + 13, y + 20, 5, 12);

    // ── Robe body ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#2d1260';
    ctx.fillRect(x + 4, y + 11, 17, 11);

    // Gold trim on robe edges
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x +  4, y + 11, 2, 11); // left trim
    ctx.fillRect(x + 19, y + 11, 2, 11); // right trim
    ctx.fillRect(x +  4, y + 11, 17, 2); // top trim

    // ── Hood ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#1a0a2e';
    ctx.beginPath();
    ctx.arc(x + 12, y + 9, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 4, y + 6, 16, 8);

    // Shadow within hood (face obscured)
    ctx.fillStyle = '#100720';
    ctx.fillRect(x + 7, y + 6, 11, 6);

    // ── Glowing eyes ─────────────────────────────────────────────────────
    ctx.fillStyle = '#00ffe0';
    ctx.fillRect(x +  8, y + 7, 3, 2);
    ctx.fillRect(x + 14, y + 7, 3, 2);
    // Subtle glow halo
    ctx.fillStyle = 'rgba(0,255,224,0.25)';
    ctx.fillRect(x +  7, y + 6, 5, 4);
    ctx.fillRect(x + 13, y + 6, 5, 4);

    // ── Staff ─────────────────────────────────────────────────────────────
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(x + 21, y + 5, 3, 26);  // shaft

    // Orb atop staff
    ctx.fillStyle = '#9b23c8';
    ctx.beginPath();
    ctx.arc(x + 22, y + 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Orb highlight
    ctx.fillStyle = '#d070ff';
    ctx.beginPath();
    ctx.arc(x + 20, y + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Gold ring around orb
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(x + 22, y + 4, 5, 0, Math.PI * 2);
    ctx.stroke();

    // ── Name tag ──────────────────────────────────────────────────────────
    ctx.fillStyle    = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 14, y - 15, 52, 13);
    ctx.strokeStyle  = '#c9a227';
    ctx.lineWidth    = 1;
    ctx.strokeRect(x - 14, y - 15, 52, 13);
    ctx.fillStyle    = '#c9a227';
    ctx.font         = 'bold 9px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Dungeon Master', x + 12, y - 9);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
