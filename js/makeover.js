import { TILE_SIZE, WORLD_COLS, WORLD_ROWS } from './constants.js';

/* ── Color palettes ─────────────────────────────────────── */
export const HAIR_COLORS  = [
  '#1a0a00', '#4a3520', '#8b5e3c', '#c8902a',
  '#d4a810', '#e0d8cc', '#8b0000', '#3a6b2a', '#1a4a8b',
];
export const SKIN_COLORS  = [
  '#ffdfc4', '#f0c8a0', '#deb887', '#c8956c', '#a0724a', '#7a4f35', '#4a2f20',
];
export const SHIRT_COLORS = [
  '#b04040', '#3d6b8c', '#2e7d32', '#8b4513', '#6b2d8c',
  '#1a1a1a', '#e8e8e8', '#c8920a', '#2c6b5e', '#7a3030',
];
export const PANTS_COLORS = [
  '#3d3424', '#1a2040', '#1a1a1a', '#4a4a4a', '#6b5030', '#5a2820',
];

/* ── Style options ──────────────────────────────────────── */
export const HAIR_STYLES = [
  { id: 'short',    label: 'Short'    },
  { id: 'long',     label: 'Long'     },
  { id: 'mohawk',   label: 'Mohawk'   },
  { id: 'bald',     label: 'Bald'     },
  { id: 'spiky',    label: 'Spiky'    },
  { id: 'ponytail', label: 'Ponytail' },
];
export const SHIRT_STYLES = [
  { id: 'tunic',   label: 'Tunic'   },
  { id: 'armor',   label: 'Armour'  },
  { id: 'robe',    label: 'Robe'    },
  { id: 'cape',    label: 'Cape'    },
  { id: 'stripes', label: 'Striped' },
];

/* ── Panel geometry (shared with game.js for hit-testing) ── */
export const MO_SWATCH      = 26;
export const MO_SWATCH_GAP  = 4;
export const MO_PW          = 490;
export const MO_HEADER_H    = 52;
export const MO_PREVIEW_H   = 120;
export const MO_STYLE_ROW_H = 50;   // rows that hold style buttons
export const MO_ROW_H       = 46;   // rows that hold colour swatches
export const MO_PAD_BOT     = 52;
export const MO_PH          = MO_HEADER_H + MO_PREVIEW_H
                             + 2 * MO_STYLE_ROW_H
                             + 4 * MO_ROW_H
                             + MO_PAD_BOT;
export const MO_LABEL_W     = 82;   // label column width
export const MO_PAD         = 16;
export const MO_BTN_W       = 62;
export const MO_BTN_H       = 28;
export const MO_BTN_GAP     = 5;

export const MO_STYLE_ROWS = [
  { label: 'Hair Style:', key: 'hairStyle',  options: HAIR_STYLES  },
  { label: 'Shirt Style:', key: 'shirtStyle', options: SHIRT_STYLES },
];

export const MO_PALETTES = [
  { label: 'Hair:',  key: 'hair',  colors: HAIR_COLORS  },
  { label: 'Skin:',  key: 'skin',  colors: SKIN_COLORS  },
  { label: 'Shirt:', key: 'shirt', colors: SHIRT_COLORS },
  { label: 'Pants:', key: 'pants', colors: PANTS_COLORS },
];

/* ── MakoverNPC ─────────────────────────────────────────── */
export class MakoverNPC {
  constructor() {
    this.w = 22;
    this.h = 32;
    this.x = (Math.floor(WORLD_COLS / 2) + 5) * TILE_SIZE + (TILE_SIZE - this.w) / 2;
    this.y = (Math.floor(WORLD_ROWS / 2) + 5) * TILE_SIZE;
    this.name = 'Makeover';
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  containsWorld(wx, wy) {
    return wx >= this.x && wx <= this.x + this.w &&
           wy >= this.y && wy <= this.y + this.h;
  }

  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const { w, h } = this;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7a2a7a';
    ctx.fillRect(x + 2, y + 22, w - 4, 10);
    ctx.fillStyle = '#9b3a9b';
    ctx.fillRect(x + 2, y + 10, w - 4, 14);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + 5, y + 13, 2, 2);
    ctx.fillRect(x + 13, y + 19, 2, 2);
    ctx.fillRect(x + 8,  y + 25, 2, 2);

    ctx.fillStyle = '#9b3a9b';
    ctx.fillRect(x - 1, y + 12, 4, 9);
    ctx.fillRect(x + w - 3, y + 12, 4, 9);

    ctx.fillStyle = '#5a1a5a';
    ctx.fillRect(x + 2, y + 21, w - 4, 3);

    ctx.fillStyle = '#f5d0a9';
    ctx.fillRect(x + 4, y + 1, w - 8, 11);

    ctx.fillStyle = '#5a1a7a';
    ctx.fillRect(x + 1, y + 2, w - 2, 4);
    ctx.fillStyle = '#6b1a8b';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 10);
    ctx.lineTo(x + 3,     y + 4);
    ctx.lineTo(x + w - 3, y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + w / 2 - 1, y - 5, 2, 2);

    ctx.fillStyle = '#8b2be2';
    ctx.fillRect(x + 6,  y + 5, 2, 2);
    ctx.fillRect(x + 14, y + 5, 2, 2);

    ctx.fillStyle = '#e040fb';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(this.name, x + w / 2, y - 14);
    ctx.fillText(this.name, x + w / 2, y - 14);
  }
}
