import {
  TILE_SIZE, PLAYER_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT,
  WORLD_COLS, WORLD_ROWS,
} from './constants.js';
import {
  drawCape, drawCapeOverlay, drawLeggings, drawBoots,
  drawChestplate, drawGloves, drawHelmet, drawWeapon,
} from './equipment.js';

const MOVE_TIME  = TILE_SIZE / PLAYER_SPEED; // seconds to cross one tile
const X_OFFSET   = (TILE_SIZE - PLAYER_WIDTH) / 2; // centers sprite horizontally in tile

export const DIR = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };

/* ═══════════════════════════════════════════════════════════
   Shared character drawing — used by both Player.draw() and
   the Renderer's makeover preview.
   x, y  = top-left of sprite in screen/canvas pixels
   s     = scale factor (1 for in-game, 3 for panel preview)
   bob   = vertical bob offset in pixels (pass 0 for preview)
   ═══════════════════════════════════════════════════════════ */

export function drawHairStyle(ctx, x, y, s, style, bob = 0) {
  ctx.fillStyle = style.hair;
  switch (style.hairStyle) {
    default:
    case 'short':
      ctx.fillRect(x + 4*s, y - 1*s - bob, 16*s, 5*s);
      break;
    case 'long':
      ctx.fillRect(x + 4*s, y - 1*s - bob, 16*s, 5*s);   // top band
      ctx.fillRect(x + 3*s, y + 3*s - bob,  3*s, 9*s);   // left side
      ctx.fillRect(x +18*s, y + 3*s - bob,  3*s, 9*s);   // right side
      break;
    case 'mohawk':
      ctx.fillRect(x + 9*s, y - 7*s - bob,  6*s, 8*s);   // tall centre spike
      ctx.fillRect(x + 7*s, y - 1*s - bob,  10*s, 3*s);  // base band
      break;
    case 'bald':
      // subtle shine
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 7*s, y + 2*s - bob,  6*s, 2*s);
      break;
    case 'spiky':
      ctx.fillRect(x + 4*s,  y - 5*s - bob,  4*s, 7*s);
      ctx.fillRect(x + 10*s, y - 7*s - bob,  4*s, 9*s);
      ctx.fillRect(x + 16*s, y - 5*s - bob,  4*s, 7*s);
      ctx.fillRect(x + 4*s,  y - 1*s - bob, 16*s, 3*s);  // base
      break;
    case 'ponytail':
      ctx.fillRect(x + 4*s, y - 1*s - bob, 13*s,  5*s);  // top band
      ctx.fillRect(x +19*s, y + 1*s - bob,  3*s, 11*s);  // tail down
      ctx.fillRect(x +18*s, y +11*s - bob,  4*s,  3*s);  // tail curl
      break;
  }
}

// Draws an arm rect. When angle≠0, pivots from the shoulder (top-centre) instead of translating.
function drawArm(ctx, ax, ay, w, h, angle) {
  if (angle) {
    ctx.save();
    ctx.translate(ax + w / 2, ay);
    ctx.rotate(angle);
    ctx.fillRect(-w / 2, 0, w, h);
    ctx.restore();
  } else {
    ctx.fillRect(ax, ay, w, h);
  }
}

export function drawBodyStyle(ctx, x, y, s, style, armSwing = 0, bob = 0, punchAngle = 0, punchSide = 'right') {
  const shirt = style.shirt;
  const skin  = style.skin;
  const la    = punchSide === 'left'  ? punchAngle : 0;  // angle for left arm
  const ra    = punchSide === 'right' ? punchAngle : 0;  // angle for right arm

  switch (style.shirtStyle) {
    default:
    case 'tunic':
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 3*s, y +10*s - bob, 18*s, 14*s);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + 3*s, y +21*s - bob, 18*s,  3*s);
      ctx.fillStyle = skin;
      drawArm(ctx, x,        y +12*s - bob - armSwing, 4*s, 10*s, la);
      drawArm(ctx, x +20*s,  y +12*s - bob + armSwing, 4*s, 10*s, ra);
      break;

    case 'armor':
      // Shoulder pads
      ctx.fillStyle = shirt;
      ctx.fillRect(x - 2*s, y +10*s - bob, 5*s, 7*s);
      ctx.fillRect(x +21*s, y +10*s - bob, 5*s, 7*s);
      // Body plate
      ctx.fillRect(x + 3*s, y +10*s - bob, 18*s, 14*s);
      // Centre engraving
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(x +11*s, y +10*s - bob,  2*s, 13*s);
      // Metal belt
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(x + 3*s, y +21*s - bob, 18*s,  3*s);
      // Armoured arms
      ctx.fillStyle = shirt;
      drawArm(ctx, x,        y +12*s - bob - armSwing, 4*s, 10*s, la);
      drawArm(ctx, x +20*s,  y +12*s - bob + armSwing, 4*s, 10*s, ra);
      break;

    case 'robe':
      // Long robe body (covers upper legs)
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 2*s, y +10*s - bob, 20*s, 20*s);
      // Hem
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x + 2*s, y +26*s - bob, 20*s,  4*s);
      // Long sleeves
      ctx.fillStyle = shirt;
      drawArm(ctx, x - 1*s,  y +12*s - bob - armSwing, 4*s, 12*s, la);
      drawArm(ctx, x +21*s,  y +12*s - bob + armSwing, 4*s, 12*s, ra);
      break;

    case 'cape':
      // Cape wings (same colour, visually wider than body)
      ctx.fillStyle = shirt;
      ctx.fillRect(x - 2*s, y + 8*s - bob,  4*s, 22*s);  // left wing
      ctx.fillRect(x +22*s, y + 8*s - bob,  4*s, 22*s);  // right wing
      // Body on top
      ctx.fillRect(x + 3*s, y +10*s - bob, 18*s, 14*s);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + 3*s, y +21*s - bob, 18*s,  3*s);
      ctx.fillStyle = skin;
      drawArm(ctx, x,        y +12*s - bob - armSwing, 4*s, 10*s, la);
      drawArm(ctx, x +20*s,  y +12*s - bob + armSwing, 4*s, 10*s, ra);
      break;

    case 'stripes':
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 3*s, y +10*s - bob, 18*s, 14*s);
      // Light stripe overlays
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x + 3*s, y +12*s - bob, 18*s, 2*s);
      ctx.fillRect(x + 3*s, y +16*s - bob, 18*s, 2*s);
      ctx.fillRect(x + 3*s, y +20*s - bob, 18*s, 1*s);
      // Belt
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + 3*s, y +21*s - bob, 18*s,  3*s);
      ctx.fillStyle = skin;
      drawArm(ctx, x,        y +12*s - bob - armSwing, 4*s, 10*s, la);
      drawArm(ctx, x +20*s,  y +12*s - bob + armSwing, 4*s, 10*s, ra);
      break;
  }
}

export class Player {
  constructor(world) {
    this.world = world;

    // Logical tile position (always integer, snapped to grid)
    this.col = Math.floor(WORLD_COLS / 2);
    this.row = Math.floor(WORLD_ROWS / 2) + 5;

    // Smooth visual pixel position (interpolated between tiles)
    this.x = this.col * TILE_SIZE + X_OFFSET;
    this.y = this.row * TILE_SIZE;

    this.w = PLAYER_WIDTH;
    this.h = PLAYER_HEIGHT;

    // Movement
    this.path      = [];    // queued {col, row} tiles to visit
    this.targetCol = null;  // tile currently sliding toward
    this.targetRow = null;
    this.moveT     = 0;     // elapsed seconds into the current tile move

    this.dir       = DIR.DOWN;
    this.moving    = false;
    this.animTimer = 0;
    this.animFrame = 0;

    this.name  = 'Player';
    this.hp    = 10;
    this.maxHp = 10;
    this._regenTimer = 0;

    // Appearance (customisable via Makeover NPC)
    this.style = {
      hair:       '#4a3520',
      skin:       '#deb887',
      shirt:      '#b04040',
      pants:      '#3d3424',
      hairStyle:  'short',
      shirtStyle: 'tunic',
    };

    // Equipped armour (set via admin panel or future equipment system)
    this.equipment = {
      helmet:     'none',
      chestplate: 'none',
      leggings:   'none',
      gloves:     'none',
      boots:      'none',
      cape:       'none',
      weapon:     'none',
    };

    this.actionLocked  = false;
    this.skillAnim     = 0;
    this.currentAction = 'idle'; // 'idle' | 'chop' | 'mine' | 'fish' | 'cook' | 'fight'
    this.actionTarget  = null;   // { col, row } tile the current action is targeting
    this.combatLevel   = 1;      // updated each frame by Game from Skills
  }

  /** Replace the queued path. The player finishes the current tile, then follows. */
  setPath(path) {
    this.path = path;
  }

  /** Returns the final destination {col, row}, or null if idle. */
  getDestination() {
    if (this.path.length > 0) return this.path[this.path.length - 1];
    if (this.targetCol !== null) return { col: this.targetCol, row: this.targetRow };
    return null;
  }

  update(dt, inputDir) {
    /* ── Passive HP regen (1 HP every 12s) ─────────────── */
    if (this.hp < this.maxHp) {
      this._regenTimer += dt;
      if (this._regenTimer >= 12) {
        this.hp = Math.min(this.maxHp, this.hp + 1);
        this._regenTimer = 0;
      }
    } else {
      this._regenTimer = 0;
    }

    /* ── Action lock ───────────────────────────────────── */
    if (this.actionLocked) {
      this.moving = false;
      this.skillAnim += dt;
      if (inputDir.x !== 0 || inputDir.y !== 0) {
        this.actionLocked = false;
        this.path = [];
        return 'cancel_action';
      }
      return null;
    }
    // Keep skillAnim ticking during combat (fight doesn't use actionLocked)
    if (this.currentAction === 'fight') {
      this.skillAnim += dt;
    } else {
      this.skillAnim = 0;
    }

    /* ── WASD clears queued path (keyboard takes over) ── */
    if (inputDir.x !== 0 || inputDir.y !== 0) {
      this.path = [];
    }

    /* ── Advance current tile movement ─────────────────── */
    let excessDt = 0;
    if (this.moving) {
      this.moveT += dt;
      const p = Math.min(this.moveT / MOVE_TIME, 1);
      const fromX = this.col * TILE_SIZE + X_OFFSET;
      const fromY = this.row * TILE_SIZE;
      this.x = fromX + (this.targetCol * TILE_SIZE + X_OFFSET - fromX) * p;
      this.y = fromY + (this.targetRow * TILE_SIZE - fromY) * p;

      if (p >= 1) {
        // Carry leftover time into the next tile so no time is wasted at boundaries
        excessDt    = this.moveT - MOVE_TIME;
        this.col    = this.targetCol;
        this.row    = this.targetRow;
        this.x      = this.col * TILE_SIZE + X_OFFSET;
        this.y      = this.row * TILE_SIZE;
        this.moving    = false;
        this.targetCol = null;
        this.targetRow = null;
        this.moveT     = 0;
      }
    }

    /* ── Start next movement when idle ─────────────────── */
    if (!this.moving) {
      let nc = null, nr = null;

      if (inputDir.x !== 0 || inputDir.y !== 0) {
        // Prioritise horizontal over vertical for diagonal key combos
        nc = this.col + (inputDir.x !== 0 ? inputDir.x : 0);
        nr = this.row + (inputDir.x !== 0 ? 0 : inputDir.y);
      } else if (this.path.length > 0) {
        const next = this.path.shift();
        nc = next.col;
        nr = next.row;
      }

      if (nc !== null) {
        if (nc >= 0 && nc < this.world.cols &&
            nr >= 0 && nr < this.world.rows &&
            !this.world.isSolid(nc, nr)) {
          this._startMovingTo(nc, nr, excessDt);
        } else {
          // Blocked mid-path — abort remaining path
          this.path = [];
        }
      }
    }

    /* ── Walk animation ─────────────────────────────────── */
    if (this.moving) {
      this.animTimer += dt;
      if (this.animTimer > 0.15) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    return null;
  }

  _startMovingTo(col, row, startTime = 0) {
    const dc = col - this.col;
    const dr = row - this.row;
    if (Math.abs(dc) >= Math.abs(dr)) {
      this.dir = dc > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      this.dir = dr > 0 ? DIR.DOWN : DIR.UP;
    }
    this.targetCol = col;
    this.targetRow = row;
    this.moving    = true;
    this.moveT     = startTime; // carry over excess time from previous tile
  }

  draw(ctx) {
    const cx = Math.round(this.x);
    const cy = Math.round(this.y);

    // animFrame cycles 0→1→2→3; phase = frame*π/2 gives sin values 0,1,0,−1
    const animPhase = this.animFrame * Math.PI / 2;
    const bob = this.moving ? Math.abs(Math.sin(animPhase)) * 2 : 0;

    // Per-action arm animation
    let skillBob = 0;
    if (this.actionLocked) {
      switch (this.currentAction) {
        case 'chop':
        case 'mine':
          // Gentle arm travel — the axe/pick head does the big arc, not the arm
          skillBob = Math.sin(this.skillAnim * 4) * 5;
          break;
        case 'fish':
          skillBob = Math.sin(this.skillAnim * 2.5) * 4;
          break;
        case 'fight':
          skillBob = Math.sin(this.skillAnim * 6) * 8;
          break;
        default:
          skillBob = Math.sin(this.skillAnim * 8) * 3;
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx + this.w / 2, cy + this.h, this.w / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSpread = this.moving ? Math.abs(Math.sin(animPhase)) * 4 : 0;
    const armSwing  = this.moving ? Math.sin(animPhase) * 5 : skillBob;
    const eq = this.equipment;

    // Bare-fist punch: half-sine over 0.6 s, then held at 0
    const stab = (this.currentAction === 'fight' && this.skillAnim < 0.6)
      ? Math.sin(this.skillAnim * (Math.PI / 0.6)) * 8
      : 0;

    // Rotate the punching arm in drawBodyStyle (no extra arm drawn on top)
    let punchAngle = 0;
    let punchSide  = 'right';
    if (stab > 0 && (!eq.weapon || eq.weapon === 'none')) {
      const swing = (stab / 8) * (Math.PI / 4); // 0 → 45°
      if      (this.dir === DIR.RIGHT) { punchAngle = -swing;       punchSide = 'right'; }
      else if (this.dir === DIR.LEFT)  { punchAngle =  swing;       punchSide = 'left';  }
      else if (this.dir === DIR.DOWN)  { punchAngle = -swing * 0.5; punchSide = 'right'; }
      else                             { punchAngle =  swing * 0.5; punchSide = 'right'; }
    }

    // Tools drawn BEHIND the player when facing up (player faces away = tool is in front of them)
    if (this.actionLocked && this.dir === DIR.UP) {
      if (this.currentAction === 'fish') {
        this._drawFishingRod(ctx, cx, cy, bob, armSwing);
      } else if (this.currentAction === 'chop' || this.currentAction === 'mine') {
        this._drawActionTool(ctx, cx, cy, bob, armSwing);
      }
    }

    // Cape — behind player unless facing up (away from camera), where it covers the front
    if (this.dir !== DIR.UP) {
      drawCape(ctx, cx, cy, 1, eq.cape, bob, this.dir);
    }

    // Legs — abs so both legs spread outward symmetrically
    ctx.fillStyle = this.style.pants;
    ctx.fillRect(cx + 5 - legSpread, cy + 22 - bob, 5, 10);
    ctx.fillRect(cx + 14 + legSpread, cy + 22 - bob, 5, 10);

    // Leggings + boots over pants, before body so body overlaps waist
    drawLeggings(ctx, cx, cy, 1, eq.leggings, legSpread, bob);
    drawBoots   (ctx, cx, cy, 1, eq.boots,    legSpread, bob);

    // Body + arms (style-dependent)
    drawBodyStyle(ctx, cx, cy, 1, this.style, armSwing, bob, punchAngle, punchSide);

    // Chestplate + gloves over body/arms
    drawChestplate(ctx, cx, cy, 1, eq.chestplate, armSwing, bob);
    drawGloves    (ctx, cx, cy, 1, eq.gloves,     armSwing, bob);

    // Cape shoulder overlay for left/right movement (over chestplate)
    drawCapeOverlay(ctx, cx, cy, 1, eq.cape, bob, this.dir);

    // Head
    ctx.fillStyle = this.style.skin;
    ctx.fillRect(cx + 5, cy + 1 - bob, 14, 12);

    // Hair (style-dependent)
    drawHairStyle(ctx, cx, cy, 1, this.style, bob);

    // Helmet over hair — direction-aware visor/eye-holes
    drawHelmet(ctx, cx, cy, 1, eq.helmet, bob, this.dir);

    // Weapon — hidden when another action tool is in hand (axe/rod replace the sword visually)
    if (this.currentAction === 'fight') {
      // stab is already computed above; bare-fist swing is handled by drawBodyStyle via punchAngle.
      if (eq.weapon && eq.weapon !== 'none') {
        // ── Armed: angle forearm out + translate weapon for stab ──
        let dx = 0, dy = 0;
        if      (this.dir === DIR.RIGHT) dx = +stab;
        else if (this.dir === DIR.LEFT)  dx = -stab;
        else if (this.dir === DIR.DOWN)  dy = +stab;
        else                             dy = -stab;

        ctx.fillStyle = this.style.skin;
        if (this.dir === DIR.RIGHT || this.dir === DIR.DOWN) {
          ctx.fillRect(cx + 23, cy + 17 - bob, 4, 5);  // right forearm angled out
        } else if (this.dir === DIR.LEFT) {
          ctx.fillRect(cx - 3, cy + 17 - bob, 4, 5);   // left forearm angled out
        }

        ctx.save();
        ctx.translate(dx, dy);
        drawWeapon(ctx, cx, cy, 1, eq.weapon, this.dir, armSwing, bob);
        ctx.restore();
      }
    } else if (!this.actionLocked || this.currentAction === 'idle') {
      drawWeapon(ctx, cx, cy, 1, eq.weapon, this.dir, armSwing, bob);
    }

    // Skill action tool overlay (chop/mine/fish/cook only — not during fight, not UP chop/mine which drew early)
    if (this.actionLocked && this.currentAction !== 'idle' && this.currentAction !== 'fight') {
      const upChopMine = this.dir === DIR.UP && (this.currentAction === 'chop' || this.currentAction === 'mine');
      if (!upChopMine) {
        this._drawActionTool(ctx, cx, cy, bob, armSwing);
      }
    }

    // Cape in front when facing away from camera (covers player's back)
    if (this.dir === DIR.UP) {
      drawCape(ctx, cx, cy, 1, eq.cape, bob, this.dir);
    }

    // Eyes — always on top
    ctx.fillStyle = '#222';
    if (this.dir === DIR.DOWN || this.dir === DIR.LEFT) {
      ctx.fillRect(cx + 7, cy + 6 - bob, 2, 2);
    }
    if (this.dir === DIR.DOWN || this.dir === DIR.RIGHT) {
      ctx.fillRect(cx + 15, cy + 6 - bob, 2, 2);
    }

    // HP bar — shown during combat
    if (this.currentAction === 'fight') {
      const barW = 24, barH = 4;
      const barX = cx + 1;
      const barY = cy - 18 - bob;
      const frac = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#111';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = frac > 0.5 ? '#2ecc71' : frac > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, Math.round(barW * frac), barH);
    }

    // Name tag — "Name (Lvl. X)"
    const label = `${this.name} (Lvl. ${this.combatLevel || 1})`;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    const nameY = cy - 6 - bob;
    ctx.strokeText(label, cx + this.w / 2, nameY);
    ctx.fillText(label, cx + this.w / 2, nameY);
  }

  _drawActionTool(ctx, cx, cy, bob, armSwing) {
    const dir = this.dir;

    // Use the arm closest to the target tile.
    // Left arm swings opposite to armSwing (right arm swings with it).
    const useLeft = (dir === DIR.LEFT);
    const ax = useLeft ? cx + 2  : cx + 22;
    const ay = useLeft ? cy + 22 - bob - armSwing   // left arm bottom
                       : cy + 22 - bob + armSwing;  // right arm bottom

    if (this.currentAction === 'chop' || this.currentAction === 'mine') {
      // 180° swing arc — same phase as skillBob (sin(t*4)):
      //   sin = +1  →  right arm DOWN = impact; angle = baseAngle + π/2 (head past horizontal, into tree)
      //   sin = -1  →  right arm UP   = backswing; angle = baseAngle - π/2 (head raised behind)
      // For LEFT: left arm goes opposite, so sin=+1 = arm UP = backswing, sin=-1 = impact.
      //   baseAngle = -π/6 so that the arc mirrors correctly: backswing right, impact left.
      let baseAngle, swingAmt;
      if      (dir === DIR.RIGHT) { baseAngle =  Math.PI / 6;      swingAmt = Math.PI / 2; }  // -60° → +120°
      else if (dir === DIR.LEFT)  { baseAngle = -Math.PI / 6;      swingAmt = Math.PI / 2; }  // +60° → -120°
      else if (dir === DIR.DOWN)  { baseAngle =  Math.PI * 3 / 4;  swingAmt = Math.PI / 2; }  // +45° → -135°
      else /* UP */               { baseAngle =  0;                 swingAmt = Math.PI / 3; }  // -60° → +60° overhead only

      const angle = baseAngle + Math.sin(this.skillAnim * 4) * swingAmt;

      // When facing UP the arms are near the waist from camera view; shift the grip up to
      // shoulder level so the tool swings properly overhead.
      const toolAy = (dir === DIR.UP) ? cy + 13 - bob + armSwing : ay;

      ctx.save();
      ctx.translate(ax, toolAy);
      ctx.rotate(angle);

      // Handle extends UPWARD from hand — grip is at the origin (bottom of handle)
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(-1, -11, 2, 11);

      if (this.currentAction === 'chop') {
        // Axe: cutting bit on the leading edge of the swing.
        // Scale(-1,1) mirrors the blade for the left arm OR when facing UP (blade inward toward tree).
        ctx.save();
        if (useLeft || dir === DIR.UP) ctx.scale(-1, 1);
        ctx.fillStyle = '#cd7f32';
        ctx.fillRect(-1, -14, 2, 2);    // collar
        ctx.fillRect( 0, -17, 6, 5);    // blade body (extends toward +x)
        ctx.fillStyle = '#b06c2a';
        ctx.fillRect( 4, -19, 4, 7);    // cutting bit (right/leading edge)
        ctx.fillStyle = 'rgba(255,200,100,0.35)';
        ctx.fillRect( 6, -19, 2, 2);    // edge shine
        ctx.restore();
      } else {
        // Pickaxe: RS-style asymmetric head — long pick spike forward, short blunt poll back
        // scale(-1,1) already applied for useLeft/UP, so +x is always the "forward" swing side

        // Socket / collar around handle top
        ctx.fillStyle = '#787878';
        ctx.fillRect(-2, -14,  5, 4);

        // Poll (blunt back end)
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(-7, -15,  5, 4);

        // Pick shaft + tapering tip (raised above poll for the RS curve)
        ctx.fillRect( 3, -16,  3, 3);   // raised pick base
        ctx.fillRect( 6, -15,  3, 2);   // mid taper
        ctx.fillRect( 9, -14,  3, 1);   // sharp tip

        // Top-edge shine
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.fillRect(-7, -15,  5, 1);   // poll
        ctx.fillRect( 3, -16,  9, 1);   // pick

        // Underside shadow
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(-7, -12,  5, 1);   // poll bottom
        ctx.fillRect( 3, -13,  9, 1);   // pick bottom
      }

      ctx.restore();

    } else if (this.currentAction === 'fish' && this.dir !== DIR.UP) {
      // UP direction is drawn early in draw() so the rod appears behind the player body
      this._drawFishingRod(ctx, cx, cy, bob, armSwing);
    }
  }

  _drawFishingRod(ctx, cx, cy, bob, armSwing) {
    const dir = this.dir;
    const useLeft = (dir === DIR.LEFT);
    const ax = useLeft ? cx + 2  : cx + 22;
    const ay = useLeft ? cy + 22 - bob - armSwing
                       : cy + 22 - bob + armSwing;

    // Fixed elevated pose per direction — rod held up, line drapes down to the water.
    // Angle convention: 0 = tip points UP, π/2 = RIGHT, -π/2 = LEFT, π = DOWN.
    let baseAngle;
    if      (dir === DIR.RIGHT) baseAngle =  Math.PI / 4;   // upper-right, ~45° from vertical
    else if (dir === DIR.LEFT)  baseAngle = -Math.PI / 4;   // upper-left
    else if (dir === DIR.DOWN)  baseAngle =  Math.PI * 2/3; // mostly forward (downward on screen)
    else                        baseAngle =  Math.PI / 5;   // UP: nearly vertical, slight forward tilt

    const rodAngle = baseAngle + Math.sin(this.skillAnim * 2.5) * 0.08;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rodAngle);
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(-1, -22, 2, 22);
    ctx.restore();

    // Rod tip position in world space
    const tipX = ax + 22 * Math.sin(rodAngle);
    const tipY = ay - 22 * Math.cos(rodAngle);

    // Bobber sits at the fish spot tile centre, with a gentle vertical bob
    let bx, by;
    if (this.actionTarget) {
      bx = this.actionTarget.col * TILE_SIZE + TILE_SIZE / 2;
      by = this.actionTarget.row * TILE_SIZE + TILE_SIZE / 2 + Math.sin(this.skillAnim * 2.5) * 2;
    } else {
      bx = cx + 28;
      by = cy + 36 - bob;
    }

    // Fishing line from rod tip to bobber
    ctx.strokeStyle = 'rgba(200,200,200,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Bobber: red float body + white cap
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}
