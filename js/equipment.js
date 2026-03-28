/* ══════════════════════════════════════════════════════════
   equipment.js — Armour slot definitions and pixel-art draw functions.

   All draw functions share the signature:
     (ctx, x, y, s, id, bob?, armSwing?, legSpread?)
   where x,y = sprite top-left, s = scale (1 in-game, 3 for preview).
   ══════════════════════════════════════════════════════════ */

export const EQUIPMENT_SLOTS = ['helmet', 'chestplate', 'leggings', 'gloves', 'boots', 'cape', 'weapon'];

export const SLOT_LABELS = {
  helmet:     'Helmet',
  chestplate: 'Chestplate',
  leggings:   'Leggings',
  gloves:     'Gloves',
  boots:      'Boots',
  cape:       'Cape',
  weapon:     'Weapon',
};

export const ARMOR_OPTIONS = {
  helmet: [
    { id: 'none',           label: 'None',      color: null      },
    { id: 'leather_cap',    label: 'Leather',   color: '#6b4a2a' },
    { id: 'bronze_helm',    label: 'Bronze',    color: '#cd7f32' },
    { id: 'iron_helm',      label: 'Iron',      color: '#8a8a8a' },
    { id: 'steel_helm',     label: 'Steel',     color: '#7a8a9a' },
    { id: 'mithril_helm',   label: 'Mithril',   color: '#5a5a9a' },
    { id: 'tungsten_helm',  label: 'Tungsten',  color: '#4a4a6a' },
    { id: 'berserker_mask', label: 'Berserker', color: '#8a2020' },
  ],
  chestplate: [
    { id: 'none',           label: 'None',      color: null      },
    { id: 'leather_body',   label: 'Leather',   color: '#6b4a2a' },
    { id: 'bronze_plate',   label: 'Bronze',    color: '#cd7f32' },
    { id: 'iron_plate',     label: 'Iron',      color: '#8a8a8a' },
    { id: 'steel_plate',    label: 'Steel',     color: '#7a9aaa' },
    { id: 'mithril_plate',  label: 'Mithril',   color: '#5a5a9a' },
    { id: 'tungsten_plate', label: 'Tungsten',  color: '#4a4a6a' },
    { id: 'shadow_tunic',   label: 'Shadow',    color: '#2a2a4a' },
  ],
  leggings: [
    { id: 'none',           label: 'None',    color: null      },
    { id: 'leather_legs',   label: 'Leather', color: '#6b4a2a' },
    { id: 'bronze_legs',    label: 'Bronze',  color: '#cd7f32' },
    { id: 'iron_legs',      label: 'Iron',    color: '#8a8a8a' },
    { id: 'mithril_legs',   label: 'Mithril', color: '#5a5a9a' },
  ],
  gloves: [
    { id: 'none',              label: 'None',      color: null      },
    { id: 'leather_gloves',    label: 'Leather',   color: '#6b4a2a' },
    { id: 'bronze_gauntlets',  label: 'Bronze',    color: '#cd7f32' },
    { id: 'iron_gauntlets',    label: 'Iron',      color: '#8a8a8a' },
    { id: 'steel_gauntlets',   label: 'Steel',     color: '#7a8a9a' },
    { id: 'berserker_wraps',   label: 'Berserker', color: '#6a2010' },
  ],
  boots: [
    { id: 'none',           label: 'None',      color: null      },
    { id: 'leather_boots',  label: 'Leather',   color: '#6b4a2a' },
    { id: 'bronze_boots',   label: 'Bronze',    color: '#cd7f32' },
    { id: 'iron_boots',     label: 'Iron',      color: '#8a8a8a' },
    { id: 'steel_boots',    label: 'Steel',     color: '#7a8a9a' },
    { id: 'shadow_treads',  label: 'Shadow',    color: '#2a2a4a' },
  ],
  cape: [
    { id: 'none',            label: 'None',      color: null      },
    { id: 'brown_cape',      label: 'Brown',     color: '#7a5030' },
    { id: 'red_cape',        label: 'Red',       color: '#c0392b' },
    { id: 'blue_cape',       label: 'Blue',      color: '#2980b9' },
    { id: 'green_cape',      label: 'Green',     color: '#27ae60' },
    { id: 'warrior_cape',    label: 'Warrior',   color: '#8a2020' },
    { id: 'berserker_cape',  label: 'Berserker', color: '#3a0808' },
  ],
  weapon: [
    { id: 'none',             label: 'None',      color: null      },
    { id: 'bronze_sword',     label: 'Bronze',    color: '#cd7f32' },
    { id: 'iron_sword',       label: 'Iron',      color: '#8a8a8a' },
    { id: 'steel_sword',      label: 'Steel',     color: '#9aaabb' },
    { id: 'mithril_sword',    label: 'Mithril',   color: '#6a6acc' },
    { id: 'tungsten_blade',   label: 'Tungsten',  color: '#5a5a8a' },
    { id: 'obsidian_cleaver', label: 'Obsidian',  color: '#3a1a4a' },
    { id: 'moonstone_staff',  label: 'Moonstone', color: '#5878b0' },
    { id: 'berserker_axe',    label: 'Berserk',   color: '#8a2020' },
    { id: 'shadow_dagger',    label: 'Shadow',    color: '#2a2a4a' },
    { id: 'venom_blade',      label: 'Venom',     color: '#3a5a2a' },
  ],
};

// DIR constants mirroring player.js (0=DOWN 1=LEFT 2=RIGHT 3=UP)
const DIR_DOWN = 0, DIR_LEFT = 1, DIR_RIGHT = 2, DIR_UP = 3;

// ── Cape (drawn BEFORE body for DOWN/LEFT/RIGHT, AFTER everything for UP) ────

export function drawCape(ctx, x, y, s, capeId, bob = 0, dir = DIR_DOWN) {
  if (!capeId || capeId === 'none') return;
  const COLORS = {
    brown_cape:     '#7a5030',
    red_cape:       '#c0392b',
    blue_cape:      '#2980b9',
    green_cape:     '#27ae60',
    warrior_cape:   '#8a2020',
    berserker_cape: '#3a0808',
  };
  const col = COLORS[capeId];
  if (!col) return;
  ctx.fillStyle = col;

  if (dir === DIR_UP) {
    // Full back panel visible — covers body from collar to below waist
    ctx.fillRect(x + 1*s,  y + 4*s  - bob, 22*s, 28*s);  // full back
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  5*s, 22*s);  // left wing
    ctx.fillRect(x + 22*s, y + 8*s  - bob,  5*s, 22*s);  // right wing
    // Shading
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x + 1*s,  y + 26*s - bob, 22*s,  4*s);  // hem shadow
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  2*s, 22*s);  // left edge
    ctx.fillRect(x + 25*s, y + 8*s  - bob,  2*s, 22*s);  // right edge
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 4*s,  y + 5*s  - bob, 16*s,  8*s);  // collar highlight
  } else if (dir === DIR_DOWN) {
    // Center panel fills gap above body, body renders on top of center, tail peeks below
    ctx.fillRect(x + 1*s,  y + 8*s  - bob, 22*s, 14*s);  // center back panel
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  5*s, 22*s);  // left wing
    ctx.fillRect(x + 22*s, y + 8*s  - bob,  5*s, 22*s);  // right wing
    ctx.fillRect(x + 1*s,  y + 22*s - bob, 22*s,  9*s);  // bottom tail
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  2*s, 22*s);
    ctx.fillRect(x + 25*s, y + 8*s  - bob,  2*s, 22*s);
    ctx.fillRect(x + 1*s,  y + 28*s - bob, 22*s,  3*s);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  5*s,  1*s);  // top hem
    ctx.fillRect(x + 22*s, y + 8*s  - bob,  5*s,  1*s);
  } else {
    // LEFT/RIGHT — wings only, no bottom tail
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  5*s, 22*s);  // left wing
    ctx.fillRect(x + 22*s, y + 8*s  - bob,  5*s, 22*s);  // right wing
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  2*s, 22*s);
    ctx.fillRect(x + 25*s, y + 8*s  - bob,  2*s, 22*s);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x - 3*s,  y + 8*s  - bob,  5*s,  1*s);  // top hem
    ctx.fillRect(x + 22*s, y + 8*s  - bob,  5*s,  1*s);
  }
}

// ── Cape shoulder overlay (drawn AFTER body for LEFT/RIGHT) ──
// When moving right the cape trails left, wrapping over the left shoulder.
// When moving left it wraps over the right shoulder.

export function drawCapeOverlay(ctx, x, y, s, capeId, bob = 0, dir = DIR_DOWN) {
  if (!capeId || capeId === 'none') return;
  if (dir !== DIR_LEFT && dir !== DIR_RIGHT) return;
  const COLORS = {
    brown_cape:     '#7a5030',
    red_cape:       '#c0392b',
    blue_cape:      '#2980b9',
    green_cape:     '#27ae60',
    warrior_cape:   '#8a2020',
    berserker_cape: '#3a0808',
  };
  const col = COLORS[capeId];
  if (!col) return;

  if (dir === DIR_RIGHT) {
    // Moving right → cape trails left → left shoulder covered
    ctx.fillStyle = col;
    ctx.fillRect(x - 1*s, y + 8*s - bob, 8*s, 14*s);   // shoulder drape
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 6*s, y + 8*s - bob, 1*s, 14*s);   // trailing edge shadow
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x - 1*s, y + 8*s - bob, 4*s,  5*s);   // shoulder highlight
  } else {
    // Moving left → cape trails right → right shoulder covered
    ctx.fillStyle = col;
    ctx.fillRect(x + 17*s, y + 8*s - bob, 8*s, 14*s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 17*s, y + 8*s - bob, 1*s, 14*s);  // trailing edge shadow
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 20*s, y + 8*s - bob, 4*s,  5*s);  // shoulder highlight
  }
}

// ── Helmet (drawn AFTER hair so full helms cover it) ─────────
// dir: 0=DOWN (front), 1=LEFT (left profile), 2=RIGHT (right profile), 3=UP (back)

export function drawHelmet(ctx, x, y, s, helmId, bob = 0, dir = DIR_DOWN) {
  if (!helmId || helmId === 'none') return;
  switch (helmId) {

    case 'leather_cap': {
      // Leather cap has no visor — same shape every direction, just flip shine
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(x + 4*s, y - 1*s - bob, 16*s, 8*s);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + 3*s, y + 6*s - bob, 18*s, 2*s);
      if (dir !== DIR_UP) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 6*s, y - 1*s - bob, 5*s, 3*s);
      }
      break;
    }

    case 'bronze_helm': {
      ctx.fillStyle = '#cd7f32';
      ctx.fillRect(x + 3*s, y - 2*s - bob, 18*s, 14*s);  // skull
      if (dir === DIR_UP) {
        // Back of helm — neck guard, no visor
        ctx.fillStyle = '#b06820';
        ctx.fillRect(x + 4*s, y + 10*s - bob, 16*s, 2*s);  // neck guard
      } else {
        // Visor gap — full, left half, or right half
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        if (dir === DIR_DOWN)       ctx.fillRect(x + 7*s,  y + 5*s - bob, 10*s, 4*s);
        else if (dir === DIR_LEFT)  ctx.fillRect(x + 7*s,  y + 5*s - bob,  5*s, 4*s);
        else if (dir === DIR_RIGHT) ctx.fillRect(x + 12*s, y + 5*s - bob,  5*s, 4*s);
        // Nose guard only when facing front
        if (dir === DIR_DOWN) {
          ctx.fillStyle = '#cd7f32';
          ctx.fillRect(x + 11*s, y + 3*s - bob, 2*s, 7*s);
        }
        ctx.fillStyle = 'rgba(255,200,80,0.2)';
        ctx.fillRect(x + 5*s, y - 1*s - bob, 6*s, 3*s);
      }
      break;
    }

    case 'iron_helm': {
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(x + 3*s, y - 2*s - bob, 18*s, 14*s);  // skull
      if (dir === DIR_UP) {
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(x + 4*s, y + 10*s - bob, 16*s, 2*s);  // neck guard
      } else {
        // Visor gap
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        if (dir === DIR_DOWN)       ctx.fillRect(x + 6*s,  y + 5*s - bob, 12*s, 4*s);
        else if (dir === DIR_LEFT)  ctx.fillRect(x + 6*s,  y + 5*s - bob,  6*s, 4*s);
        else if (dir === DIR_RIGHT) ctx.fillRect(x + 12*s, y + 5*s - bob,  6*s, 4*s);
        // Nose guard only front-facing
        if (dir === DIR_DOWN) {
          ctx.fillStyle = '#8a8a8a';
          ctx.fillRect(x + 11*s, y + 3*s - bob, 2*s, 7*s);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x + 5*s, y - 1*s - bob, 5*s, 3*s);
        // Cheek plate on visible side only
        ctx.fillStyle = '#7a7a7a';
        if (dir !== DIR_RIGHT) ctx.fillRect(x + 3*s,  y + 6*s - bob, 4*s, 6*s);  // left cheek
        if (dir !== DIR_LEFT)  ctx.fillRect(x + 17*s, y + 6*s - bob, 4*s, 6*s);  // right cheek
      }
      break;
    }

    case 'steel_helm': {
      ctx.fillStyle = '#7a8a9a';
      ctx.fillRect(x + 3*s, y - 4*s - bob, 18*s, 17*s);  // skull
      // Crest fin always visible
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(x + 9*s, y - 7*s - bob, 6*s, 4*s);
      ctx.fillRect(x + 10*s, y - 9*s - bob, 4*s, 3*s);
      if (dir === DIR_UP) {
        ctx.fillStyle = '#6a7a8a';
        ctx.fillRect(x + 4*s, y + 11*s - bob, 16*s, 2*s);  // neck guard
      } else {
        // T-visor: vertical bar always, horizontal bar split by direction
        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.fillRect(x + 11*s, y + 2*s - bob, 2*s, 8*s);   // vertical always
        if (dir === DIR_DOWN)       ctx.fillRect(x + 4*s,  y + 5*s - bob, 16*s, 2*s);
        else if (dir === DIR_LEFT)  ctx.fillRect(x + 4*s,  y + 5*s - bob,  8*s, 2*s);
        else if (dir === DIR_RIGHT) ctx.fillRect(x + 11*s, y + 5*s - bob,  9*s, 2*s);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 5*s, y - 3*s - bob, 5*s, 3*s);
      }
      break;
    }

    case 'tungsten_helm': {
      ctx.fillStyle = '#3a3a5a';
      ctx.fillRect(x + 2*s, y - 4*s - bob, 20*s, 18*s);  // skull
      // Angular brow plate
      ctx.fillStyle = '#28284a';
      ctx.fillRect(x + 3*s, y + 8*s - bob, 18*s, 4*s);
      // Vertical crest ridge
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(x + 10*s, y - 6*s - bob, 4*s, 5*s);
      if (dir === DIR_UP) {
        ctx.fillStyle = '#28284a';
        ctx.fillRect(x + 3*s, y + 12*s - bob, 18*s, 2*s);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x + 11*s, y + 1*s - bob, 2*s, 9*s);
        if (dir === DIR_DOWN)       ctx.fillRect(x + 3*s,  y + 5*s - bob, 18*s, 3*s);
        else if (dir === DIR_LEFT)  ctx.fillRect(x + 3*s,  y + 5*s - bob,  9*s, 3*s);
        else if (dir === DIR_RIGHT) ctx.fillRect(x + 11*s, y + 5*s - bob, 10*s, 3*s);
        ctx.fillStyle = 'rgba(100,100,200,0.4)';
        ctx.fillRect(x + 5*s, y - 2*s - bob, 4*s, 2*s);
        ctx.fillRect(x + 15*s, y - 2*s - bob, 4*s, 2*s);
      }
      break;
    }

    case 'mithril_helm': {
      ctx.fillStyle = '#5a5a9a';
      ctx.fillRect(x + 3*s, y - 3*s - bob, 18*s, 16*s);
      ctx.fillStyle = '#3a3a7a';
      ctx.fillRect(x + 3*s, y + 11*s - bob, 18*s, 2*s);
      ctx.fillStyle = '#3a3a8a';
      ctx.fillRect(x + 9*s, y - 6*s - bob, 6*s, 4*s);
      if (dir === DIR_UP) {
        ctx.fillStyle = '#3a3a7a';
        ctx.fillRect(x + 4*s, y + 12*s - bob, 16*s, 2*s);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + 11*s, y + 2*s - bob, 2*s, 8*s);
        if (dir === DIR_DOWN)       ctx.fillRect(x + 4*s,  y + 5*s - bob, 16*s, 2*s);
        else if (dir === DIR_LEFT)  ctx.fillRect(x + 4*s,  y + 5*s - bob,  8*s, 2*s);
        else if (dir === DIR_RIGHT) ctx.fillRect(x + 11*s, y + 5*s - bob,  9*s, 2*s);
        ctx.fillStyle = 'rgba(140,140,255,0.45)';
        ctx.fillRect(x + 5*s, y - 2*s - bob, 5*s, 2*s);
        ctx.fillRect(x + 14*s, y - 2*s - bob, 5*s, 2*s);
      }
      break;
    }

    case 'berserker_mask': {
      ctx.fillStyle = '#5a1010';
      ctx.fillRect(x + 2*s, y - 3*s - bob, 20*s, 16*s);
      ctx.fillStyle = '#3a0808';
      ctx.fillRect(x + 3*s, y + 11*s - bob, 18*s, 3*s);
      // Tusk/fang marks on skull
      ctx.fillStyle = '#f0a020';
      ctx.fillRect(x + 5*s,  y - 2*s - bob, 2*s, 6*s);
      ctx.fillRect(x + 17*s, y - 2*s - bob, 2*s, 6*s);
      if (dir === DIR_UP) {
        ctx.fillStyle = '#3a0808';
        ctx.fillRect(x + 3*s, y + 12*s - bob, 18*s, 2*s);
      } else {
        // Narrow angled eye slits
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        if (dir === DIR_DOWN) {
          ctx.fillRect(x + 5*s,  y + 4*s - bob, 6*s, 3*s);
          ctx.fillRect(x + 13*s, y + 4*s - bob, 6*s, 3*s);
        } else if (dir === DIR_LEFT) {
          ctx.fillRect(x + 5*s,  y + 4*s - bob, 6*s, 3*s);
        } else {
          ctx.fillRect(x + 13*s, y + 4*s - bob, 6*s, 3*s);
        }
        // Red glow behind slits
        ctx.fillStyle = 'rgba(255,60,0,0.5)';
        if (dir !== DIR_RIGHT) ctx.fillRect(x + 6*s,  y + 5*s - bob, 4*s, 1*s);
        if (dir !== DIR_LEFT)  ctx.fillRect(x + 14*s, y + 5*s - bob, 4*s, 1*s);
        ctx.fillStyle = 'rgba(200,30,0,0.2)';
        ctx.fillRect(x + 2*s, y - 3*s - bob, 20*s, 16*s);
      }
      break;
    }
  }
}

// ── Chestplate (drawn AFTER drawBodyStyle) ────────────────────

export function drawChestplate(ctx, x, y, s, chestId, armSwing = 0, bob = 0) {
  if (!chestId || chestId === 'none') return;
  switch (chestId) {

    case 'leather_body': {
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(x + 3*s, y + 10*s - bob, 18*s, 11*s);  // main body
      // Shoulder pads
      ctx.fillRect(x + 1*s,  y + 10*s - bob, 5*s, 5*s);
      ctx.fillRect(x + 18*s, y + 10*s - bob, 5*s, 5*s);
      // Belt
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + 3*s, y + 20*s - bob, 18*s, 2*s);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 4*s, y + 11*s - bob, 5*s, 3*s);
      break;
    }

    case 'bronze_plate': {
      ctx.fillStyle = '#cd7f32';
      // Shoulder pauldrons
      ctx.fillRect(x - 2*s, y + 9*s  - bob, 6*s, 9*s);
      ctx.fillRect(x + 20*s, y + 9*s - bob, 6*s, 9*s);
      // Main breastplate
      ctx.fillRect(x + 2*s, y + 9*s - bob, 20*s, 13*s);
      // Arm guards tracking animation
      ctx.fillRect(x - 1*s, y + 12*s - bob - armSwing, 5*s, 9*s);
      ctx.fillRect(x + 20*s, y + 12*s - bob + armSwing, 5*s, 9*s);
      // Center engraving
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(x + 11*s, y + 9*s - bob, 2*s, 12*s);
      // Specular
      ctx.fillStyle = 'rgba(255,200,80,0.2)';
      ctx.fillRect(x + 4*s, y + 10*s - bob, 6*s, 4*s);
      break;
    }

    case 'iron_plate': {
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(x - 2*s,  y + 9*s  - bob, 6*s,  9*s);
      ctx.fillRect(x + 20*s, y + 9*s  - bob, 6*s,  9*s);
      ctx.fillRect(x + 2*s,  y + 9*s  - bob, 20*s, 13*s);
      ctx.fillRect(x - 1*s,  y + 12*s - bob - armSwing, 5*s, 9*s);
      ctx.fillRect(x + 20*s, y + 12*s - bob + armSwing, 5*s, 9*s);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 11*s, y + 9*s - bob, 2*s, 12*s);
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(x + 4*s, y + 10*s - bob, 5*s, 3*s);
      break;
    }

    case 'mithril_plate': {
      ctx.fillStyle = '#5a5a9a';
      // Larger spiked pauldrons
      ctx.fillRect(x - 3*s,  y + 8*s  - bob, 7*s, 11*s);
      ctx.fillRect(x + 20*s, y + 8*s  - bob, 7*s, 11*s);
      // Spike tips
      ctx.fillRect(x - 4*s,  y + 8*s  - bob, 2*s, 5*s);
      ctx.fillRect(x + 26*s, y + 8*s  - bob, 2*s, 5*s);
      // Main plate
      ctx.fillRect(x + 2*s,  y + 9*s  - bob, 20*s, 13*s);
      ctx.fillRect(x - 1*s,  y + 12*s - bob - armSwing, 5*s, 9*s);
      ctx.fillRect(x + 20*s, y + 12*s - bob + armSwing, 5*s, 9*s);
      // Center line
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 11*s, y + 9*s - bob, 2*s, 12*s);
      // Rune-glow markings
      ctx.fillStyle = 'rgba(130,130,230,0.35)';
      ctx.fillRect(x + 5*s,  y + 12*s - bob, 4*s, 2*s);
      ctx.fillRect(x + 15*s, y + 12*s - bob, 4*s, 2*s);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x + 4*s, y + 10*s - bob, 5*s, 3*s);
      break;
    }

    case 'steel_plate': {
      ctx.fillStyle = '#7a9aaa';
      ctx.fillRect(x - 2*s,  y + 9*s  - bob, 6*s,  9*s);
      ctx.fillRect(x + 20*s, y + 9*s  - bob, 6*s,  9*s);
      ctx.fillRect(x + 2*s,  y + 9*s  - bob, 20*s, 13*s);
      ctx.fillRect(x - 1*s,  y + 12*s - bob - armSwing, 5*s, 9*s);
      ctx.fillRect(x + 20*s, y + 12*s - bob + armSwing, 5*s, 9*s);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x + 11*s, y + 9*s - bob, 2*s, 12*s);
      ctx.fillStyle = 'rgba(180,220,240,0.25)';
      ctx.fillRect(x + 4*s, y + 10*s - bob, 5*s, 3*s);
      break;
    }

    case 'tungsten_plate': {
      ctx.fillStyle = '#4a4a6a';
      // Massive angular pauldrons
      ctx.fillRect(x - 4*s,  y + 7*s  - bob, 8*s, 13*s);
      ctx.fillRect(x + 20*s, y + 7*s  - bob, 8*s, 13*s);
      ctx.fillRect(x + 2*s,  y + 8*s  - bob, 20*s, 14*s);
      ctx.fillRect(x - 2*s,  y + 11*s - bob - armSwing, 6*s, 10*s);
      ctx.fillRect(x + 20*s, y + 11*s - bob + armSwing, 6*s, 10*s);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + 11*s, y + 8*s - bob, 2*s, 13*s);
      ctx.fillStyle = 'rgba(100,100,200,0.4)';
      ctx.fillRect(x + 4*s,  y + 13*s - bob, 5*s, 2*s);
      ctx.fillRect(x + 15*s, y + 13*s - bob, 5*s, 2*s);
      ctx.fillStyle = 'rgba(80,80,180,0.2)';
      ctx.fillRect(x + 2*s, y + 8*s - bob, 20*s, 14*s);
      break;
    }

    case 'shadow_tunic': {
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(x - 1*s,  y + 9*s  - bob, 5*s,  8*s);  // left shoulder
      ctx.fillRect(x + 20*s, y + 9*s  - bob, 5*s,  8*s);  // right shoulder
      ctx.fillRect(x + 2*s,  y + 9*s  - bob, 20*s, 13*s); // torso
      ctx.fillRect(x - 0*s,  y + 12*s - bob - armSwing, 4*s, 9*s);
      ctx.fillRect(x + 20*s, y + 12*s - bob + armSwing, 4*s, 9*s);
      // Shadow stitching lines
      ctx.fillStyle = 'rgba(80,80,180,0.4)';
      ctx.fillRect(x + 11*s, y + 9*s - bob, 2*s, 12*s);   // center seam
      ctx.fillRect(x + 5*s,  y + 14*s - bob, 4*s, 1*s);
      ctx.fillRect(x + 15*s, y + 14*s - bob, 4*s, 1*s);
      ctx.fillStyle = 'rgba(60,60,140,0.2)';
      ctx.fillRect(x + 2*s, y + 9*s - bob, 20*s, 13*s);
      break;
    }
  }
}

// ── Leggings (drawn AFTER pants/legs) ────────────────────────

export function drawLeggings(ctx, x, y, s, legsId, legSpread = 0, bob = 0) {
  if (!legsId || legsId === 'none') return;
  const COLORS = {
    leather_legs: '#6b4a2a',
    bronze_legs:  '#cd7f32',
    iron_legs:    '#8a8a8a',
    mithril_legs: '#5a5a9a',
  };
  const col = COLORS[legsId];
  if (!col) return;
  ctx.fillStyle = col;
  // Left leg plate (slightly wider than pants)
  ctx.fillRect(x + 4*s - legSpread, y + 22*s - bob, 7*s, 9*s);
  // Right leg plate
  ctx.fillRect(x + 13*s + legSpread, y + 22*s - bob, 7*s, 9*s);
  // Kneecap recess
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + 5*s  - legSpread, y + 25*s - bob, 5*s, 3*s);
  ctx.fillRect(x + 14*s + legSpread, y + 25*s - bob, 5*s, 3*s);
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 5*s  - legSpread, y + 22*s - bob, 3*s, 2*s);
  ctx.fillRect(x + 14*s + legSpread, y + 22*s - bob, 3*s, 2*s);
}

// ── Gloves (drawn AFTER chestplate, tips of arms) ─────────────

export function drawGloves(ctx, x, y, s, gloveId, armSwing = 0, bob = 0) {
  if (!gloveId || gloveId === 'none') return;
  const COLORS = {
    leather_gloves:   '#6b4a2a',
    bronze_gauntlets: '#cd7f32',
    iron_gauntlets:   '#8a8a8a',
    steel_gauntlets:  '#7a8a9a',
    berserker_wraps:  '#6a2010',
  };
  const col = COLORS[gloveId];
  if (!col) return;
  ctx.fillStyle = col;
  // Left gauntlet cuff
  ctx.fillRect(x - 1*s, y + 18*s - bob - armSwing, 5*s, 5*s);
  // Right gauntlet cuff
  ctx.fillRect(x + 20*s, y + 18*s - bob + armSwing, 5*s, 5*s);
  // Top seam shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x - 1*s,  y + 18*s - bob - armSwing, 5*s, 1*s);
  ctx.fillRect(x + 20*s, y + 18*s - bob + armSwing, 5*s, 1*s);
}

// ── Boots (drawn AFTER leggings, bottom of legs) ──────────────

export function drawBoots(ctx, x, y, s, bootId, legSpread = 0, bob = 0) {
  if (!bootId || bootId === 'none') return;
  const COLORS = {
    leather_boots:  '#6b4a2a',
    bronze_boots:   '#cd7f32',
    iron_boots:     '#8a8a8a',
    steel_boots:    '#7a8a9a',
    shadow_treads:  '#1a1a2a',
  };
  const col = COLORS[bootId];
  if (!col) return;
  ctx.fillStyle = col;
  // Left boot
  ctx.fillRect(x + 3*s - legSpread, y + 28*s - bob, 8*s, 4*s);
  // Right boot
  ctx.fillRect(x + 13*s + legSpread, y + 28*s - bob, 8*s, 4*s);
  // Sole darker strip at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 3*s  - legSpread, y + 30*s - bob, 8*s, 2*s);
  ctx.fillRect(x + 13*s + legSpread, y + 30*s - bob, 8*s, 2*s);
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x + 4*s  - legSpread, y + 28*s - bob, 3*s, 1*s);
  ctx.fillRect(x + 14*s + legSpread, y + 28*s - bob, 3*s, 1*s);
}

// ── Weapon (drawn after gloves, in the player's right/near hand) ─────────────
export function drawWeapon(ctx, x, y, s, weaponId, dir = DIR_DOWN, armSwing = 0, bob = 0) {
  if (!weaponId || weaponId === 'none') return;

  // ── Special non-sword weapons ─────────────────────────
  if (weaponId === 'moonstone_staff') {
    const ox = x + 20*s, oy = y + 8*s - bob + armSwing;
    // Staff shaft
    ctx.fillStyle = '#6b4a2a';
    if (dir === DIR_RIGHT)      ctx.fillRect(ox,       oy + 4*s, 18*s,  3*s);
    else if (dir === DIR_LEFT)  ctx.fillRect(x - 16*s, oy + 4*s, 18*s,  3*s);
    else {
      const bx = x + 18*s;
      ctx.fillRect(bx, (dir === DIR_DOWN ? oy : y + 6*s - bob), 3*s, 22*s);
    }
    // Crystal orb
    ctx.fillStyle = '#4a6090';
    ctx.beginPath();
    ctx.arc(
      dir === DIR_RIGHT ? ox + 18*s : dir === DIR_LEFT ? x - 16*s : x + 19*s,
      dir === DIR_DOWN  ? oy + 3*s  : dir === DIR_UP   ? y + 6*s - bob : oy + 3*s,
      5*s, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = 'rgba(140,180,255,0.7)';
    ctx.beginPath();
    ctx.arc(
      dir === DIR_RIGHT ? ox + 17*s : dir === DIR_LEFT ? x - 17*s : x + 18*s,
      dir === DIR_DOWN  ? oy + 2*s  : dir === DIR_UP   ? y + 5*s - bob : oy + 2*s,
      2*s, 0, Math.PI * 2
    );
    ctx.fill();
    return;
  }

  // ── Berserker Axe ─────────────────────────────────────
  if (weaponId === 'berserker_axe') {
    const ox = x + 20*s, oy = y + 14*s - bob + armSwing;
    ctx.fillStyle = '#3a1a08';
    if (dir === DIR_RIGHT || dir === DIR_DOWN) {
      ctx.fillRect(ox,       oy + 4*s, 3*s, 12*s);   // handle
      ctx.fillStyle = '#8a2020';
      ctx.fillRect(ox - 2*s, oy,       11*s, 6*s);   // head top
      ctx.fillRect(ox + 5*s, oy - 2*s,  5*s, 3*s);   // spike up
      ctx.fillRect(ox - 2*s, oy + 5*s, 10*s, 4*s);   // head bottom
      ctx.fillStyle = '#c03030';
      ctx.fillRect(ox - 2*s, oy,        11*s, 2*s);   // shine
      ctx.fillStyle = 'rgba(255,60,60,0.25)';
      ctx.fillRect(ox - 4*s, oy - 3*s,  14*s, 14*s);
    } else {
      ctx.fillRect(x + 1*s,  oy + 4*s, 3*s, 12*s);
      ctx.fillStyle = '#8a2020';
      ctx.fillRect(x - 5*s,  oy,        11*s, 6*s);
      ctx.fillRect(x - 6*s,  oy - 2*s,   5*s, 3*s);
      ctx.fillRect(x - 4*s,  oy + 5*s,  10*s, 4*s);
      ctx.fillStyle = '#c03030';
      ctx.fillRect(x - 5*s,  oy,        11*s, 2*s);
      ctx.fillStyle = 'rgba(255,60,60,0.25)';
      ctx.fillRect(x - 8*s,  oy - 3*s,  14*s, 14*s);
    }
    return;
  }

  // ── Shadow Dagger ─────────────────────────────────────
  if (weaponId === 'shadow_dagger') {
    const ox = x + 22*s, oy = y + 20*s - bob + armSwing;
    ctx.fillStyle = '#1a1a2a';
    if (dir === DIR_RIGHT) {
      ctx.fillRect(ox - 3*s, oy,       3*s, 2*s);    // grip
      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(ox - s,   oy - 2*s, 2*s, 5*s);   // guard
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(ox,       oy - s,   8*s, 2*s);    // blade
      ctx.fillRect(ox + 6*s, oy - 2*s, 2*s, s);      // tip
      ctx.fillStyle = 'rgba(120,120,220,0.55)';
      ctx.fillRect(ox,       oy - s,   8*s, s);       // edge
    } else if (dir === DIR_LEFT) {
      ctx.fillRect(x + 4*s,  oy,       3*s, 2*s);
      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(x + 3*s,  oy - 2*s, 2*s, 5*s);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(x - 6*s,  oy - s,   8*s, 2*s);
      ctx.fillRect(x - 8*s,  oy - 2*s, 2*s, s);
      ctx.fillStyle = 'rgba(120,120,220,0.55)';
      ctx.fillRect(x - 6*s,  oy - s,   8*s, s);
    } else if (dir === DIR_DOWN) {
      ctx.fillRect(ox - s,   oy - 3*s, 2*s, 3*s);
      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(ox - 3*s, oy - s,   5*s, 2*s);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(ox - s,   oy,       2*s, 8*s);
      ctx.fillStyle = 'rgba(120,120,220,0.55)';
      ctx.fillRect(ox - s,   oy,       s,   8*s);
    } else {
      ctx.fillRect(ox - s,   oy,       2*s, 3*s);
      ctx.fillStyle = '#2a2a4a';
      ctx.fillRect(ox - 3*s, oy - s,   5*s, 2*s);
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(ox - s,   oy - 8*s, 2*s, 8*s);
      ctx.fillStyle = 'rgba(120,120,220,0.55)';
      ctx.fillRect(ox - s,   oy - 8*s, s,   8*s);
    }
    return;
  }

  // ── Venom Blade ───────────────────────────────────────
  if (weaponId === 'venom_blade') {
    const ox = x + 22*s, oy = y + 18*s - bob + armSwing;
    ctx.fillStyle = '#2a3a1a';
    if (dir === DIR_RIGHT) {
      ctx.fillRect(ox - 4*s, oy + s,   4*s, 2*s);    // grip
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(ox - s,   oy - 2*s, 2*s, 6*s);   // guard
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(ox,       oy,       10*s, 3*s);
      ctx.fillRect(ox + 8*s, oy - s,   2*s, 2*s);
      ctx.fillStyle = 'rgba(60,200,60,0.5)';
      ctx.fillRect(ox,       oy,       10*s, s);
    } else if (dir === DIR_LEFT) {
      ctx.fillRect(x + 4*s,  oy + s,   4*s, 2*s);
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(x + 3*s,  oy - 2*s, 2*s, 6*s);
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(x - 8*s,  oy,       10*s, 3*s);
      ctx.fillRect(x - 10*s, oy - s,   2*s, 2*s);
      ctx.fillStyle = 'rgba(60,200,60,0.5)';
      ctx.fillRect(x - 8*s,  oy,       10*s, s);
    } else if (dir === DIR_DOWN) {
      ctx.fillRect(ox - s,   oy - 4*s, 2*s, 4*s);
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(ox - 3*s, oy - s,   6*s, 2*s);
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(ox - s,   oy,       3*s, 10*s);
      ctx.fillStyle = 'rgba(60,200,60,0.5)';
      ctx.fillRect(ox - s,   oy,       s,   10*s);
    } else {
      ctx.fillRect(ox - s,   oy,       2*s, 4*s);
      ctx.fillStyle = '#1a4a1a';
      ctx.fillRect(ox - 3*s, oy - s,   6*s, 2*s);
      ctx.fillStyle = '#3a5a2a';
      ctx.fillRect(ox - s,   oy - 10*s, 3*s, 10*s);
      ctx.fillStyle = 'rgba(60,200,60,0.5)';
      ctx.fillRect(ox - s,   oy - 10*s, s,  10*s);
    }
    return;
  }

  const SWORDS = {
    bronze_sword:    { len: 9,  col: '#cd7f32', shine: 'rgba(255,200,80,0.4)',   guard: '#a06020', grip: '#5a3010' },
    iron_sword:      { len: 11, col: '#8a8a8a', shine: 'rgba(255,255,255,0.25)', guard: '#6a6a6a', grip: '#3a2a18' },
    steel_sword:     { len: 13, col: '#9aaabb', shine: 'rgba(255,255,255,0.3)',  guard: '#7a8a9a', grip: '#2a3a4a' },
    mithril_sword:   { len: 14, col: '#7070cc', shine: 'rgba(160,160,255,0.5)',  guard: '#5050aa', grip: '#2a2a6a' },
    tungsten_blade:  { len: 15, col: '#5a5a8a', shine: 'rgba(140,140,220,0.4)', guard: '#4a4a7a', grip: '#20203a' },
    obsidian_cleaver:{ len: 14, col: '#2e1a3e', shine: 'rgba(180,80,220,0.55)', guard: '#4a1a5a', grip: '#18101a' },
  };
  const sw = SWORDS[weaponId];
  if (!sw) return;
  const bl = sw.len * s;
  const t  = Math.max(1, Math.floor(bl / 3));  // one-third of blade

  // Helper: draw the scimitar blade in a given direction from origin (ox, oy)
  // For horizontal blades: curves upward at tip (scimitar sweep)
  // For vertical blades:   curves outward at tip

  if (dir === DIR_RIGHT) {
    const ox = x + 22*s, oy = y + 18*s - bob + armSwing;
    // Grip
    ctx.fillStyle = sw.grip;
    ctx.fillRect(ox - 4*s, oy + s, 4*s, 2*s);
    // Guard
    ctx.fillStyle = sw.guard;
    ctx.fillRect(ox - s, oy - 3*s, 2*s, 8*s);
    // Blade — 3 segments stepping upward (scimitar curve)
    ctx.fillStyle = sw.col;
    ctx.fillRect(ox,       oy,       t,        4*s);   // near: deep belly
    ctx.fillRect(ox + t,   oy - s,   t,        4*s);   // mid: 1px up
    ctx.fillRect(ox + 2*t, oy - 2*s, bl - 2*t, 3*s);  // tip: 2px up
    ctx.fillRect(ox + bl,  oy - 3*s, s,        2*s);   // sharp tip
    // Shine along top edge
    ctx.fillStyle = sw.shine;
    ctx.fillRect(ox,       oy,       t,        s);
    ctx.fillRect(ox + t,   oy - s,   t,        s);
    ctx.fillRect(ox + 2*t, oy - 2*s, bl - 2*t, s);

  } else if (dir === DIR_LEFT) {
    const ox = x + 2*s, oy = y + 18*s - bob - armSwing;
    ctx.fillStyle = sw.grip;
    ctx.fillRect(ox,       oy + s, 4*s, 2*s);
    ctx.fillStyle = sw.guard;
    ctx.fillRect(ox - s,   oy - 3*s, 2*s, 8*s);
    ctx.fillStyle = sw.col;
    ctx.fillRect(ox - t,        oy,       t,        4*s);
    ctx.fillRect(ox - 2*t,      oy - s,   t,        4*s);
    ctx.fillRect(ox - bl,       oy - 2*s, bl - 2*t, 3*s);
    ctx.fillRect(ox - bl - s,   oy - 3*s, s,        2*s);
    ctx.fillStyle = sw.shine;
    ctx.fillRect(ox - t,        oy,       t,        s);
    ctx.fillRect(ox - 2*t,      oy - s,   t,        s);
    ctx.fillRect(ox - bl,       oy - 2*s, bl - 2*t, s);

  } else if (dir === DIR_DOWN) {
    const ox = x + 20*s, oy = y + 19*s - bob + armSwing;
    ctx.fillStyle = sw.grip;
    ctx.fillRect(ox + s, oy - 4*s, 2*s, 4*s);
    ctx.fillStyle = sw.guard;
    ctx.fillRect(ox - s, oy - s,   6*s, 2*s);
    ctx.fillStyle = sw.col;
    ctx.fillRect(ox + s,       oy,       3*s, t);
    ctx.fillRect(ox + 2*s,     oy + t,   3*s, t);
    ctx.fillRect(ox + 3*s,     oy + 2*t, 2*s, bl - 2*t);
    ctx.fillRect(ox + 4*s,     oy + bl,  s,   s);
    ctx.fillStyle = sw.shine;
    ctx.fillRect(ox + s, oy, s, bl);

  } else {  // DIR_UP
    const ox = x + 20*s, oy = y + 19*s - bob;
    ctx.fillStyle = sw.grip;
    ctx.fillRect(ox + s, oy,        2*s, 4*s);
    ctx.fillStyle = sw.guard;
    ctx.fillRect(ox - s, oy - s,    6*s, 2*s);
    ctx.fillStyle = sw.col;
    ctx.fillRect(ox + s,   oy - t,       3*s, t);
    ctx.fillRect(ox + 2*s, oy - 2*t,     3*s, t);
    ctx.fillRect(ox + 3*s, oy - bl,      2*s, bl - 2*t);
    ctx.fillRect(ox + 4*s, oy - bl - s,  s,   s);
    ctx.fillStyle = sw.shine;
    ctx.fillRect(ox + s, oy - bl, s, bl);
  }

  // Magical glow effects
  if (weaponId === 'mithril_sword') {
    ctx.fillStyle = 'rgba(100,100,255,0.15)';
    if (dir === DIR_RIGHT)     ctx.fillRect(x + 22*s, y + 17*s - bob + armSwing, bl + 4*s, 5*s);
    else if (dir === DIR_LEFT) ctx.fillRect(x + 2*s - bl, y + 17*s - bob - armSwing, bl + 4*s, 5*s);
    else if (dir === DIR_DOWN) ctx.fillRect(x + 19*s, y + 19*s - bob + armSwing, 5*s, bl + 4*s);
    else                       ctx.fillRect(x + 19*s, y + 15*s - bob - bl, 5*s, bl + 4*s);
  }
  if (weaponId === 'obsidian_cleaver') {
    ctx.fillStyle = 'rgba(160,60,220,0.12)';
    if (dir === DIR_RIGHT)     ctx.fillRect(x + 22*s, y + 16*s - bob + armSwing, bl + 4*s, 7*s);
    else if (dir === DIR_LEFT) ctx.fillRect(x + 2*s - bl, y + 16*s - bob - armSwing, bl + 4*s, 7*s);
    else if (dir === DIR_DOWN) ctx.fillRect(x + 18*s, y + 18*s - bob + armSwing, 7*s, bl + 4*s);
    else                       ctx.fillRect(x + 18*s, y + 14*s - bob - bl, 7*s, bl + 4*s);
  }
}

// ── Convenience: draw all equipment layers in correct order ───
// Call drawCape() before drawBodyStyle; call drawArmourOver() after hair.
export function drawArmourOver(ctx, x, y, s, eq, armSwing = 0, bob = 0, legSpread = 0) {
  drawLeggings(ctx, x, y, s, eq.leggings,   legSpread, bob);
  drawBoots   (ctx, x, y, s, eq.boots,      legSpread, bob);
  drawChestplate(ctx, x, y, s, eq.chestplate, armSwing, bob);
  drawGloves  (ctx, x, y, s, eq.gloves,     armSwing,  bob);
  drawHelmet  (ctx, x, y, s, eq.helmet,     bob);
}
