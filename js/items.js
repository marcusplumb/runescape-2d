/**
 * Item registry — each item has an id, name, stackable flag,
 * and a draw function for rendering in the inventory.
 */

export const ITEMS = {
  /* ── Tools (given at start) ─────────────────────────── */
  AXE: {
    id: 'axe',
    name: 'Bronze Axe',
    stackable: false,
    draw(ctx, x, y, s) {
      // Handle
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.15, s * 0.55);
      // Head
      ctx.fillStyle = '#cd7f32';
      ctx.fillRect(x + s * 0.35, y + s * 0.15, s * 0.35, s * 0.3);
      ctx.fillStyle = '#b06c2a';
      ctx.fillRect(x + s * 0.55, y + s * 0.1, s * 0.2, s * 0.4);
    },
  },

  TINDERBOX: {
    id: 'tinderbox',
    name: 'Tinderbox',
    stackable: false,
    draw(ctx, x, y, s) {
      // Box
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + s * 0.15, y + s * 0.3, s * 0.7, s * 0.45);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.6, s * 0.35);
      // Spark
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x + s * 0.55, y + s * 0.15, s * 0.08, s * 0.12);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x + s * 0.65, y + s * 0.2, s * 0.06, s * 0.08);
    },
  },

  FISHING_ROD: {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    stackable: false,
    draw(ctx, x, y, s) {
      // Rod
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(x + s * 0.45, y + s * 0.05, s * 0.06, s * 0.75);
      // Handle
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + s * 0.42, y + s * 0.65, s * 0.12, s * 0.25);
      // Line
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.48, y + s * 0.05);
      ctx.lineTo(x + s * 0.7, y + s * 0.25);
      ctx.stroke();
      // Hook
      ctx.strokeStyle = '#aaa';
      ctx.beginPath();
      ctx.arc(x + s * 0.7, y + s * 0.3, s * 0.05, 0, Math.PI);
      ctx.stroke();
    },
  },

  /* ── Currency ───────────────────────────────────────── */
  GOLD_COIN: {
    id: 'gold_coin',
    name: 'Gold Coin',
    stackable: true,
    draw(ctx, x, y, s) {
      // Coin stack
      ctx.fillStyle = '#c8960c';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.62, s * 0.28, s * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.28, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f9e04b';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.48, y + s * 0.48, s * 0.16, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // G mark
      ctx.fillStyle = '#b8860b';
      ctx.font = `bold ${Math.floor(s * 0.28)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('g', x + s * 0.5, y + s * 0.56);
    },
  },

  /* ── Resources ──────────────────────────────────────── */
  FISHING_BAIT: {
    id: 'fishing_bait',
    name: 'Fishing Bait',
    stackable: true,
    draw(ctx, x, y, s) {
      // Little worm
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.7);
      ctx.bezierCurveTo(x + s * 0.2, y + s * 0.5, x + s * 0.7, y + s * 0.5, x + s * 0.6, y + s * 0.3);
      ctx.lineWidth = s * 0.12;
      ctx.strokeStyle = '#a0522d';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.65);
      ctx.bezierCurveTo(x + s * 0.7, y + s * 0.55, x + s * 0.35, y + s * 0.4, x + s * 0.55, y + s * 0.25);
      ctx.stroke();
      // Head dot
      ctx.fillStyle = '#5a1a00';
      ctx.beginPath();
      ctx.arc(x + s * 0.6, y + s * 0.3, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  LOGS: {
    id: 'logs',
    name: 'Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(x + s * 0.1, y + s * 0.55, s * 0.8, s * 0.18);
      ctx.fillStyle = '#a07820';
      ctx.fillRect(x + s * 0.15, y + s * 0.35, s * 0.7, s * 0.18);
      ctx.fillStyle = '#6d5210';
      ctx.beginPath();
      ctx.arc(x + s * 0.85, y + s * 0.64, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  OAK_LOGS: {
    id: 'oak_logs',
    name: 'Oak Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#5e3d10';
      ctx.fillRect(x + s * 0.08, y + s * 0.53, s * 0.84, s * 0.20);
      ctx.fillStyle = '#7a5020';
      ctx.fillRect(x + s * 0.12, y + s * 0.32, s * 0.76, s * 0.20);
      ctx.fillStyle = '#3a2008';
      ctx.beginPath();
      ctx.arc(x + s * 0.88, y + s * 0.63, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Knot
      ctx.fillStyle = '#2e1808';
      ctx.beginPath();
      ctx.arc(x + s * 0.35, y + s * 0.42, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  WILLOW_LOGS: {
    id: 'willow_logs',
    name: 'Willow Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#8a7a50';
      ctx.fillRect(x + s * 0.08, y + s * 0.55, s * 0.84, s * 0.18);
      ctx.fillStyle = '#a09068';
      ctx.fillRect(x + s * 0.12, y + s * 0.36, s * 0.76, s * 0.18);
      // Pale greenish grain streak
      ctx.fillStyle = '#8a9870';
      ctx.fillRect(x + s * 0.3, y + s * 0.38, s * 0.2, s * 0.14);
      ctx.fillStyle = '#70604a';
      ctx.beginPath();
      ctx.arc(x + s * 0.88, y + s * 0.64, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  MAPLE_LOGS: {
    id: 'maple_logs',
    name: 'Maple Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#8b4a14';
      ctx.fillRect(x + s * 0.08, y + s * 0.54, s * 0.84, s * 0.20);
      ctx.fillStyle = '#a85e20';
      ctx.fillRect(x + s * 0.12, y + s * 0.34, s * 0.76, s * 0.20);
      // Orange-red heartwood
      ctx.fillStyle = '#c4602a';
      ctx.fillRect(x + s * 0.25, y + s * 0.36, s * 0.35, s * 0.16);
      ctx.fillStyle = '#7a3a10';
      ctx.beginPath();
      ctx.arc(x + s * 0.88, y + s * 0.64, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  YEW_LOGS: {
    id: 'yew_logs',
    name: 'Yew Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(x + s * 0.06, y + s * 0.53, s * 0.88, s * 0.22);
      ctx.fillStyle = '#4e3818';
      ctx.fillRect(x + s * 0.10, y + s * 0.33, s * 0.80, s * 0.20);
      // Dark reddish grain
      ctx.fillStyle = '#5e2010';
      ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.15, s * 0.16);
      ctx.fillRect(x + s * 0.5, y + s * 0.55, s * 0.12, s * 0.18);
      ctx.fillStyle = '#281808';
      ctx.beginPath();
      ctx.arc(x + s * 0.90, y + s * 0.64, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  MAGIC_LOGS: {
    id: 'magic_logs',
    name: 'Magic Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      // Glow aura
      ctx.fillStyle = 'rgba(80,60,200,0.18)';
      ctx.fillRect(x + s * 0.02, y + s * 0.28, s * 0.96, s * 0.50);
      ctx.fillStyle = '#1e1850';
      ctx.fillRect(x + s * 0.08, y + s * 0.54, s * 0.84, s * 0.20);
      ctx.fillStyle = '#2e28a0';
      ctx.fillRect(x + s * 0.12, y + s * 0.34, s * 0.76, s * 0.20);
      // Glowing veins
      ctx.fillStyle = '#6858e8';
      ctx.fillRect(x + s * 0.2, y + s * 0.36, s * 0.5, s * 0.04);
      ctx.fillRect(x + s * 0.25, y + s * 0.56, s * 0.4, s * 0.04);
      // Sparkles
      ctx.fillStyle = '#c0b0ff';
      ctx.fillRect(x + s * 0.3, y + s * 0.35, s * 0.04, s * 0.04);
      ctx.fillRect(x + s * 0.6, y + s * 0.55, s * 0.04, s * 0.04);
      ctx.fillRect(x + s * 0.45, y + s * 0.45, s * 0.03, s * 0.03);
      ctx.fillStyle = '#8070d0';
      ctx.beginPath();
      ctx.arc(x + s * 0.88, y + s * 0.64, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  ELDER_LOGS: {
    id: 'elder_logs',
    name: 'Elder Logs',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#a0a898';
      ctx.fillRect(x + s * 0.06, y + s * 0.52, s * 0.88, s * 0.24);
      ctx.fillStyle = '#c8d0c0';
      ctx.fillRect(x + s * 0.10, y + s * 0.32, s * 0.80, s * 0.22);
      // Gold grain
      ctx.fillStyle = '#d4b820';
      ctx.fillRect(x + s * 0.22, y + s * 0.34, s * 0.4, s * 0.04);
      ctx.fillRect(x + s * 0.18, y + s * 0.54, s * 0.3, s * 0.04);
      // Bright highlight
      ctx.fillStyle = '#e8f0e0';
      ctx.fillRect(x + s * 0.12, y + s * 0.33, s * 0.6, s * 0.06);
      ctx.fillStyle = '#8090a0';
      ctx.beginPath();
      ctx.arc(x + s * 0.90, y + s * 0.64, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c0a010';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s * 0.90, y + s * 0.64, s * 0.09, 0, Math.PI * 2);
      ctx.stroke();
    },
  },

  RAW_SHRIMP: {
    id: 'raw_shrimp',
    name: 'Raw Shrimp',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#e88e7a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.fillStyle = '#d4735e';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, y + s * 0.45);
      ctx.lineTo(x + s * 0.12, y + s * 0.3);
      ctx.lineTo(x + s * 0.2, y + s * 0.5);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#333';
      ctx.fillRect(x + s * 0.62, y + s * 0.42, s * 0.05, s * 0.05);
    },
  },

  RAW_TROUT: {
    id: 'raw_trout',
    name: 'Raw Trout',
    stackable: false,
    draw(ctx, x, y, s) {
      // Body
      ctx.fillStyle = '#7ab0c4';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.fillStyle = '#5a90a4';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.5);
      ctx.lineTo(x + s * 0.02, y + s * 0.3);
      ctx.lineTo(x + s * 0.02, y + s * 0.7);
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s * 0.72, y + s * 0.44, s * 0.06, s * 0.06);
      // Spots
      ctx.fillStyle = '#6090a0';
      ctx.fillRect(x + s * 0.4, y + s * 0.42, s * 0.04, s * 0.04);
      ctx.fillRect(x + s * 0.55, y + s * 0.52, s * 0.04, s * 0.04);
    },
  },

  COOKED_SHRIMP: {
    id: 'cooked_shrimp',
    name: 'Cooked Shrimp',
    stackable: false, heal: 3,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#e05a3a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c04828';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, y + s * 0.45);
      ctx.lineTo(x + s * 0.12, y + s * 0.3);
      ctx.lineTo(x + s * 0.2, y + s * 0.5);
      ctx.fill();
      // Steam
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.03, s * 0.1);
      ctx.fillRect(x + s * 0.55, y + s * 0.15, s * 0.03, s * 0.12);
    },
  },

  COOKED_TROUT: {
    id: 'cooked_trout',
    name: 'Cooked Trout',
    stackable: false, heal: 7,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#a07040';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#806030';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.5);
      ctx.lineTo(x + s * 0.02, y + s * 0.3);
      ctx.lineTo(x + s * 0.02, y + s * 0.7);
      ctx.closePath();
      ctx.fill();
      // Steam
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.03, s * 0.12);
      ctx.fillRect(x + s * 0.58, y + s * 0.18, s * 0.03, s * 0.1);
    },
  },

  BURNT_FISH: {
    id: 'burnt_fish',
    name: 'Burnt Fish',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.3, s * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.2, y + s * 0.5);
      ctx.lineTo(x + s * 0.08, y + s * 0.35);
      ctx.lineTo(x + s * 0.08, y + s * 0.65);
      ctx.closePath();
      ctx.fill();
    },
  },

  /* ── Mining tool ─────────────────────────────────────── */
  PICKAXE: {
    id: 'pickaxe',
    name: 'Bronze Pickaxe',
    stackable: false,
    draw(ctx, x, y, s) {
      // Handle
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(x + s * 0.15, y + s * 0.25, s * 0.15, s * 0.6);
      // Head (left pointing)
      ctx.fillStyle = '#cd7f32';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.3);
      ctx.lineTo(x + s * 0.7, y + s * 0.15);
      ctx.lineTo(x + s * 0.75, y + s * 0.3);
      ctx.lineTo(x + s * 0.3, y + s * 0.45);
      ctx.closePath();
      ctx.fill();
      // Spike tip
      ctx.fillStyle = '#b06c2a';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.68, y + s * 0.16);
      ctx.lineTo(x + s * 0.88, y + s * 0.22);
      ctx.lineTo(x + s * 0.73, y + s * 0.3);
      ctx.closePath();
      ctx.fill();
    },
  },

  /* ── Ores ────────────────────────────────────────────── */
  ORE_COPPER: {
    id: 'ore_copper',
    name: 'Copper Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.32, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cd7f32';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.2, s * 0.14, 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  ORE_IRON: {
    id: 'ore_iron',
    name: 'Iron Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#6a6a70';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.32, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8a96';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.18, s * 0.12, -0.3, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  ORE_COAL: {
    id: 'ore_coal',
    name: 'Coal',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.3, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.48, y + s * 0.48, s * 0.16, s * 0.1, 0.4, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  ORE_GOLD: {
    id: 'ore_gold',
    name: 'Gold Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.32, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.2, s * 0.13, -0.2, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  ORE_MITHRIL: {
    id: 'ore_mithril',
    name: 'Mithril Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4a4a6a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.32, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7b68ee';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.18, s * 0.12, 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  ORE_TIN: {
    id: 'ore_tin',
    name: 'Tin Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#8a8a80';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c0c0b8';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.5, s*.16, s*.1, -0.2, 0, Math.PI*2); ctx.fill();
    },
  },
  ORE_SILVER: {
    id: 'ore_silver',
    name: 'Silver Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#7a7a80';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d8d8e8';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.5, s*.2, s*.13, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(x+s*.45, y+s*.46, s*.07, s*.04, 0.3, 0, Math.PI*2); ctx.fill();
    },
  },
  ORE_TUNGSTEN: {
    id: 'ore_tungsten',
    name: 'Tungsten Ore',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#3a3a4a';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#6a6a8a';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.5, s*.18, s*.11, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a4a60';
      ctx.fillRect(x+s*.42, y+s*.45, s*.04, s*.04);
    },
  },
  ORE_OBSIDIAN: {
    id: 'ore_obsidian',
    name: 'Obsidian Shard',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#1a0e1e';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3d2050';
      ctx.beginPath();
      ctx.moveTo(x+s*.5, y+s*.28);
      ctx.lineTo(x+s*.72, y+s*.58);
      ctx.lineTo(x+s*.28, y+s*.58);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(180,120,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(x+s*.5, y+s*.3);
      ctx.lineTo(x+s*.56, y+s*.42);
      ctx.lineTo(x+s*.44, y+s*.42);
      ctx.closePath(); ctx.fill();
    },
  },
  ORE_MOONSTONE: {
    id: 'ore_moonstone',
    name: 'Moonstone Crystal',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#2a2a3a';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a5a8a';
      ctx.beginPath();
      ctx.ellipse(x+s*.5, y+s*.5, s*.2, s*.13, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(160,200,255,0.7)';
      ctx.beginPath();
      ctx.ellipse(x+s*.46, y+s*.46, s*.08, s*.05, 0.2, 0, Math.PI*2); ctx.fill();
    },
  },

  /* ── New fish ────────────────────────────────────────── */
  RAW_SALMON: {
    id: 'raw_salmon',
    name: 'Raw Salmon',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#e8804a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0603a';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.5);
      ctx.lineTo(x + s * 0.02, y + s * 0.32);
      ctx.lineTo(x + s * 0.02, y + s * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s * 0.72, y + s * 0.44, s * 0.06, s * 0.06);
    },
  },
  RAW_LOBSTER: {
    id: 'raw_lobster',
    name: 'Raw Lobster',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#8a4a2a';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Claws
      ctx.fillRect(x + s * 0.7, y + s * 0.3, s * 0.18, s * 0.1);
      ctx.fillRect(x + s * 0.7, y + s * 0.6, s * 0.18, s * 0.1);
      // Antennae
      ctx.strokeStyle = '#7a3a1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.72, y + s * 0.3);
      ctx.lineTo(x + s * 0.9,  y + s * 0.15);
      ctx.moveTo(x + s * 0.72, y + s * 0.38);
      ctx.lineTo(x + s * 0.95, y + s * 0.28);
      ctx.stroke();
    },
  },
  COOKED_SALMON: {
    id: 'cooked_salmon',
    name: 'Cooked Salmon',
    stackable: false, heal: 9,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#c06030';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a04020';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.5);
      ctx.lineTo(x + s * 0.02, y + s * 0.32);
      ctx.lineTo(x + s * 0.02, y + s * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.03, s * 0.12);
      ctx.fillRect(x + s * 0.58, y + s * 0.18, s * 0.03, s * 0.1);
    },
  },
  COOKED_LOBSTER: {
    id: 'cooked_lobster',
    name: 'Cooked Lobster',
    stackable: false, heal: 12,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#e05a20';
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.28, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s * 0.7, y + s * 0.3, s * 0.18, s * 0.1);
      ctx.fillRect(x + s * 0.7, y + s * 0.6, s * 0.18, s * 0.1);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + s * 0.3, y + s * 0.2, s * 0.03, s * 0.12);
    },
  },

  RAW_SARDINE: {
    id: 'raw_sardine',
    name: 'Raw Sardine',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#b0c8d8';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.32, s*0.13, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#88a8b8';
      ctx.beginPath();
      ctx.moveTo(x + s*0.18, y + s*0.5);
      ctx.lineTo(x + s*0.05, y + s*0.34);
      ctx.lineTo(x + s*0.05, y + s*0.66);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.72, y + s*0.44, s*0.05, s*0.05);
    },
  },

  RAW_HERRING: {
    id: 'raw_herring',
    name: 'Raw Herring',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#90a8b8';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.34, s*0.14, 0.15, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#6888a0';
      ctx.beginPath();
      ctx.moveTo(x + s*0.16, y + s*0.5);
      ctx.lineTo(x + s*0.03, y + s*0.33);
      ctx.lineTo(x + s*0.03, y + s*0.67);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.05, s*0.05);
      ctx.fillStyle = '#b8c8d8';
      ctx.fillRect(x + s*0.38, y + s*0.43, s*0.04, s*0.04);
    },
  },

  RAW_TUNA: {
    id: 'raw_tuna',
    name: 'Raw Tuna',
    stackable: false,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4a6888';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.38, s*0.18, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#384858';
      ctx.beginPath();
      ctx.moveTo(x + s*0.12, y + s*0.5);
      ctx.lineTo(x + s*0.0,  y + s*0.3);
      ctx.lineTo(x + s*0.0,  y + s*0.7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.76, y + s*0.43, s*0.06, s*0.06);
      ctx.fillStyle = '#607898';
      ctx.fillRect(x + s*0.3, y + s*0.38, s*0.08, s*0.06);
    },
  },

  RAW_SWORDFISH: {
    id: 'raw_swordfish',
    name: 'Raw Swordfish',
    stackable: false,
    draw(ctx, x, y, s) {
      // Body
      ctx.fillStyle = '#5888a8';
      ctx.beginPath();
      ctx.ellipse(x + s*0.52, y + s*0.5, s*0.36, s*0.15, 0, 0, Math.PI*2);
      ctx.fill();
      // Sword bill
      ctx.fillStyle = '#4a7090';
      ctx.fillRect(x + s*0.78, y + s*0.47, s*0.2, s*0.04);
      // Tail
      ctx.fillStyle = '#3a6880';
      ctx.beginPath();
      ctx.moveTo(x + s*0.16, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.28);
      ctx.lineTo(x + s*0.0, y + s*0.72);
      ctx.closePath(); ctx.fill();
      // Dorsal fin
      ctx.fillStyle = '#3a6880';
      ctx.beginPath();
      ctx.moveTo(x + s*0.4, y + s*0.35);
      ctx.lineTo(x + s*0.6, y + s*0.35);
      ctx.lineTo(x + s*0.5, y + s*0.2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.05, s*0.05);
    },
  },

  RAW_SHARK: {
    id: 'raw_shark',
    name: 'Raw Shark',
    stackable: false,
    draw(ctx, x, y, s) {
      // Body
      ctx.fillStyle = '#607080';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.4, s*0.19, 0, 0, Math.PI*2);
      ctx.fill();
      // Belly
      ctx.fillStyle = '#d0d8e0';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.58, s*0.3, s*0.1, 0, 0, Math.PI*2);
      ctx.fill();
      // Tail
      ctx.fillStyle = '#4a5a6a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.10, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.25);
      ctx.lineTo(x + s*0.14, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.75);
      ctx.closePath(); ctx.fill();
      // Dorsal fin
      ctx.fillStyle = '#4a5a6a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.38, y + s*0.33);
      ctx.lineTo(x + s*0.58, y + s*0.33);
      ctx.lineTo(x + s*0.48, y + s*0.12);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.06, s*0.06);
    },
  },

  COOKED_SARDINE: {
    id: 'cooked_sardine',
    name: 'Cooked Sardine',
    stackable: false, heal: 4,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#c89060';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.32, s*0.13, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#a07040';
      ctx.beginPath();
      ctx.moveTo(x + s*0.18, y + s*0.5);
      ctx.lineTo(x + s*0.05, y + s*0.34);
      ctx.lineTo(x + s*0.05, y + s*0.66);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.72, y + s*0.44, s*0.05, s*0.05);
    },
  },

  COOKED_HERRING: {
    id: 'cooked_herring',
    name: 'Cooked Herring',
    stackable: false, heal: 5,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#c09070';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.34, s*0.14, 0.15, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#9a7050';
      ctx.beginPath();
      ctx.moveTo(x + s*0.16, y + s*0.5);
      ctx.lineTo(x + s*0.03, y + s*0.33);
      ctx.lineTo(x + s*0.03, y + s*0.67);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.05, s*0.05);
    },
  },

  COOKED_TUNA: {
    id: 'cooked_tuna',
    name: 'Cooked Tuna',
    stackable: false, heal: 10,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#a07858';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.5, s*0.38, s*0.18, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#7a5838';
      ctx.beginPath();
      ctx.moveTo(x + s*0.12, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.3);
      ctx.lineTo(x + s*0.0, y + s*0.7);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.76, y + s*0.43, s*0.06, s*0.06);
    },
  },

  COOKED_SWORDFISH: {
    id: 'cooked_swordfish',
    name: 'Cooked Swordfish',
    stackable: false, heal: 14,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#a08060';
      ctx.beginPath();
      ctx.ellipse(x + s*0.52, y + s*0.5, s*0.36, s*0.15, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#806040';
      ctx.fillRect(x + s*0.78, y + s*0.47, s*0.2, s*0.04);
      ctx.fillStyle = '#705030';
      ctx.beginPath();
      ctx.moveTo(x + s*0.16, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.28);
      ctx.lineTo(x + s*0.0, y + s*0.72);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.05, s*0.05);
    },
  },

  COOKED_SHARK: {
    id: 'cooked_shark',
    name: 'Cooked Shark',
    stackable: false, heal: 20,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#b09070';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.4, s*0.19, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#e8d8b8';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.58, s*0.3, s*0.1, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#806040';
      ctx.beginPath();
      ctx.moveTo(x + s*0.10, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.25);
      ctx.lineTo(x + s*0.14, y + s*0.5);
      ctx.lineTo(x + s*0.0, y + s*0.75);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillRect(x + s*0.74, y + s*0.44, s*0.06, s*0.06);
    },
  },

  /* ── Combat drops ────────────────────────────────────── */
  BONES: {
    id: 'bones',
    name: 'Bones',
    stackable: true,
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#e8e0c8';
      // Shaft
      ctx.fillRect(x + s * 0.2, y + s * 0.45, s * 0.6, s * 0.12);
      // End knobs
      ctx.beginPath();
      ctx.ellipse(x + s * 0.22, y + s * 0.51, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.78, y + s * 0.51, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
};

/** Look up item def by string id */
export function getItemById(id) {
  return Object.values(ITEMS).find(it => it.id === id) || null;
}

/** Cooking recipes: raw item → { cooked, burnt, burnChance } */
export const COOK_RECIPES = {
  [ITEMS.RAW_SHRIMP.id]: {
    cooked: ITEMS.COOKED_SHRIMP,
    burnt:  ITEMS.BURNT_FISH,
    burnChance: 0.3,
  },
  [ITEMS.RAW_TROUT.id]: {
    cooked: ITEMS.COOKED_TROUT,
    burnt:  ITEMS.BURNT_FISH,
    burnChance: 0.4,
  },
  [ITEMS.RAW_SALMON.id]: {
    cooked: ITEMS.COOKED_SALMON,
    burnt:  ITEMS.BURNT_FISH,
    burnChance: 0.45,
  },
  [ITEMS.RAW_LOBSTER.id]: {
    cooked: ITEMS.COOKED_LOBSTER,
    burnt:  ITEMS.BURNT_FISH,
    burnChance: 0.5,
  },
  [ITEMS.RAW_SARDINE.id]:   { cooked: ITEMS.COOKED_SARDINE,   burnt: ITEMS.BURNT_FISH, burnChance: 0.38 },
  [ITEMS.RAW_HERRING.id]:   { cooked: ITEMS.COOKED_HERRING,   burnt: ITEMS.BURNT_FISH, burnChance: 0.35 },
  [ITEMS.RAW_TUNA.id]:      { cooked: ITEMS.COOKED_TUNA,      burnt: ITEMS.BURNT_FISH, burnChance: 0.25 },
  [ITEMS.RAW_SWORDFISH.id]: { cooked: ITEMS.COOKED_SWORDFISH, burnt: ITEMS.BURNT_FISH, burnChance: 0.20 },
  [ITEMS.RAW_SHARK.id]:     { cooked: ITEMS.COOKED_SHARK,     burnt: ITEMS.BURNT_FISH, burnChance: 0.15 },
};

/* ── Weapons ─────────────────────────────────────────── */
ITEMS.BRONZE_SWORD = {
  id: 'bronze_sword', name: 'Bronze Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 5, strengthBonus: 6, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3010'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35); // grip
    ctx.fillStyle = '#a06020'; ctx.fillRect(x+s*.28, y+s*.48, s*.26, s*.1);  // guard
    ctx.fillStyle = '#cd7f32';
    ctx.fillRect(x+s*.38, y+s*.12, s*.1,  s*.18);                            // blade near
    ctx.fillRect(x+s*.40, y+s*.08, s*.09, s*.06);                            // blade mid
    ctx.fillRect(x+s*.42, y+s*.04, s*.08, s*.06);                            // tip
    ctx.fillStyle = 'rgba(255,200,80,0.4)';
    ctx.fillRect(x+s*.38, y+s*.12, s*.04, s*.18);                            // shine
  },
};
ITEMS.IRON_SWORD = {
  id: 'iron_sword', name: 'Iron Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 12, strengthBonus: 13, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.26, y+s*.48, s*.3,  s*.1);
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(x+s*.37, y+s*.10, s*.12, s*.2);
    ctx.fillRect(x+s*.39, y+s*.05, s*.10, s*.07);
    ctx.fillRect(x+s*.41, y+s*.01, s*.08, s*.06);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x+s*.37, y+s*.10, s*.04, s*.2);
  },
};
ITEMS.STEEL_SWORD = {
  id: 'steel_sword', name: 'Steel Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 22, strengthBonus: 24, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x+s*.25, y+s*.48, s*.32, s*.1);
    ctx.fillStyle = '#9aaabb';
    ctx.fillRect(x+s*.37, y+s*.08, s*.13, s*.22);
    ctx.fillRect(x+s*.39, y+s*.04, s*.11, s*.06);
    ctx.fillRect(x+s*.41, y+s*.00, s*.09, s*.06);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x+s*.37, y+s*.08, s*.04, s*.22);
  },
};
ITEMS.MITHRIL_SWORD = {
  id: 'mithril_sword', name: 'Mithril Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 42, strengthBonus: 46, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a2a6a'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#5050aa'; ctx.fillRect(x+s*.24, y+s*.48, s*.34, s*.1);
    ctx.fillStyle = '#7070cc';
    ctx.fillRect(x+s*.37, y+s*.06, s*.13, s*.24);
    ctx.fillRect(x+s*.39, y+s*.02, s*.11, s*.06);
    ctx.fillRect(x+s*.41, y-s*.02, s*.09, s*.06);
    ctx.fillStyle = 'rgba(160,160,255,0.5)';
    ctx.fillRect(x+s*.37, y+s*.06, s*.04, s*.24);
    // Glow
    ctx.fillStyle = 'rgba(100,100,255,0.15)';
    ctx.fillRect(x+s*.3, y+s*.0, s*.22, s*.55);
  },
};

/* ── Smelted bars ────────────────────────────────────── */
ITEMS.BAR_BRONZE = {
  id: 'bar_bronze', name: 'Bronze Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5020'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#e8a060'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#7a4018'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_IRON = {
  id: 'bar_iron', name: 'Iron Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_STEEL = {
  id: 'bar_steel', name: 'Steel Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a5a6a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#7a9aaa'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#a0c0cc'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#3a4a58'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_SILVER = {
  id: 'bar_silver', name: 'Silver Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#808088'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#c0c0c8'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#707078'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_GOLD = {
  id: 'bar_gold', name: 'Gold Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#9a7000'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#f9e04b'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#806000'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_MITHRIL = {
  id: 'bar_mithril', name: 'Mithril Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#6a6acc'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#9090e8'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#2a2a5a'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
    ctx.fillStyle = 'rgba(120,120,255,0.25)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.36);
  },
};
ITEMS.BAR_TUNGSTEN = {
  id: 'bar_tungsten', name: 'Tungsten Bar', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#28283a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#6868a0'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#20202a'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_OBSIDIAN = {
  id: 'bar_obsidian', name: 'Obsidian Ingot', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#18101a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#2e1a3e'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = 'rgba(160,80,220,0.6)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.04);
    ctx.fillStyle = '#180e22'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
    ctx.fillStyle = 'rgba(120,60,200,0.2)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.36);
  },
};
ITEMS.BAR_MOONSTONE = {
  id: 'bar_moonstone', name: 'Moonstone Ingot', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#303050'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#5878b0'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = 'rgba(160,200,255,0.8)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#283058'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
    ctx.fillStyle = 'rgba(100,160,255,0.3)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.36);
  },
};

/* ── Smithed weapons (beyond existing swords) ────────── */
ITEMS.TUNGSTEN_BLADE = {
  id: 'tungsten_blade', name: 'Tungsten Blade', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 68, strengthBonus: 75, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#20202a'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.22, y+s*.48, s*.38, s*.1);
    ctx.fillStyle = '#5a5a8a';
    ctx.fillRect(x+s*.36, y+s*.06, s*.16, s*.26);
    ctx.fillRect(x+s*.38, y+s*.01, s*.12, s*.07);
    ctx.fillRect(x+s*.40, -s*.02, s*.10, s*.05);
    ctx.fillStyle = 'rgba(150,150,220,0.35)'; ctx.fillRect(x+s*.36, y+s*.06, s*.05, s*.26);
  },
};
ITEMS.OBSIDIAN_CLEAVER = {
  id: 'obsidian_cleaver', name: 'Obsidian Cleaver', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 95, strengthBonus: 108, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#18101a'; ctx.fillRect(x+s*.35, y+s*.54, s*.13, s*.36);
    ctx.fillStyle = '#3a1a4a'; ctx.fillRect(x+s*.2, y+s*.44, s*.3, s*.14);
    ctx.fillStyle = '#2a1535';
    ctx.fillRect(x+s*.35, y+s*.04, s*.22, s*.42);
    ctx.fillRect(x+s*.55, y+s*.08, s*.08, s*.34);
    ctx.fillStyle = 'rgba(160,80,220,0.5)'; ctx.fillRect(x+s*.35, y+s*.04, s*.05, s*.42);
    ctx.fillStyle = 'rgba(200,120,255,0.25)'; ctx.fillRect(x+s*.3, y+s*.0, s*.35, s*.55);
  },
};
ITEMS.MOONSTONE_STAFF = {
  id: 'moonstone_staff', name: 'Moonstone Staff', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 125, strengthBonus: 85, defenceBonus: 18 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.46, y+s*.28, s*.08, s*.62);
    ctx.fillStyle = '#8b6030'; ctx.fillRect(x+s*.47, y+s*.28, s*.04, s*.62);
    ctx.fillStyle = '#3a4870'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.2, s*.1, s*.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7090d0'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.2, s*.07, s*.07, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(140,180,255,0.6)'; ctx.beginPath(); ctx.ellipse(x+s*.47, y+s*.17, s*.03, s*.03, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(100,160,255,0.2)'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.2, s*.14, s*.14, 0, 0, Math.PI*2); ctx.fill();
  },
};

/* ── Smithed tools ───────────────────────────────────── */
ITEMS.IRON_AXE = {
  id: 'iron_axe', name: 'Iron Axe', stackable: false, toolType: 'axe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.2, y+s*.3, s*.15, s*.55);
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.35, y+s*.15, s*.35, s*.3);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.55, y+s*.1, s*.2, s*.4);
  },
};
ITEMS.STEEL_AXE = {
  id: 'steel_axe', name: 'Steel Axe', stackable: false, toolType: 'axe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.2, y+s*.3, s*.15, s*.55);
    ctx.fillStyle = '#7a9aaa'; ctx.fillRect(x+s*.35, y+s*.13, s*.37, s*.32);
    ctx.fillStyle = '#5a7a8a'; ctx.fillRect(x+s*.55, y+s*.08, s*.22, s*.42);
    ctx.fillStyle = 'rgba(180,220,240,0.3)'; ctx.fillRect(x+s*.35, y+s*.13, s*.37, s*.06);
  },
};
ITEMS.IRON_PICKAXE = {
  id: 'iron_pickaxe', name: 'Iron Pickaxe', stackable: false, toolType: 'pickaxe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.15, y+s*.25, s*.15, s*.6);
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.3); ctx.lineTo(x+s*.7, y+s*.15); ctx.lineTo(x+s*.75, y+s*.3); ctx.lineTo(x+s*.3, y+s*.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath(); ctx.moveTo(x+s*.68, y+s*.16); ctx.lineTo(x+s*.88, y+s*.22); ctx.lineTo(x+s*.73, y+s*.3); ctx.closePath(); ctx.fill();
  },
};
ITEMS.STEEL_PICKAXE = {
  id: 'steel_pickaxe', name: 'Steel Pickaxe', stackable: false, toolType: 'pickaxe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.15, y+s*.25, s*.15, s*.6);
    ctx.fillStyle = '#7a9aaa';
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.3); ctx.lineTo(x+s*.7, y+s*.15); ctx.lineTo(x+s*.75, y+s*.3); ctx.lineTo(x+s*.3, y+s*.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a7a8a';
    ctx.beginPath(); ctx.moveTo(x+s*.68, y+s*.16); ctx.lineTo(x+s*.88, y+s*.22); ctx.lineTo(x+s*.73, y+s*.3); ctx.closePath(); ctx.fill();
  },
};
ITEMS.TUNGSTEN_PICKAXE = {
  id: 'tungsten_pickaxe', name: 'Tungsten Pickaxe', stackable: false, toolType: 'pickaxe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.15, y+s*.25, s*.15, s*.6);
    ctx.fillStyle = '#4a4a6a';
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.3); ctx.lineTo(x+s*.7, y+s*.12); ctx.lineTo(x+s*.76, y+s*.3); ctx.lineTo(x+s*.3, y+s*.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a6a9a';
    ctx.beginPath(); ctx.moveTo(x+s*.68, y+s*.13); ctx.lineTo(x+s*.9, y+s*.2); ctx.lineTo(x+s*.74, y+s*.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(130,130,200,0.3)'; ctx.fillRect(x+s*.3, y+s*.25, s*.46, s*.2);
  },
};

/* ── Smithed armor (helmets) ─────────────────────────── */
ITEMS.BRONZE_HELM = {
  id: 'bronze_helm', name: 'Bronze Helm', stackable: false, equipSlot: 'helmet',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 5 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.15, y+s*.12, s*.7, s*.5);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.15, y+s*.48, s*.7, s*.1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x+s*.28, y+s*.3, s*.44, s*.2);
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.44, y+s*.24, s*.12, s*.3);
    ctx.fillStyle = 'rgba(255,200,80,0.2)'; ctx.fillRect(x+s*.2, y+s*.14, s*.3, s*.12);
  },
};
ITEMS.IRON_HELM = {
  id: 'iron_helm', name: 'Iron Helm', stackable: false, equipSlot: 'helmet',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 12 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.12, y+s*.1, s*.76, s*.52);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.12, y+s*.5, s*.76, s*.12);
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(x+s*.22, y+s*.28, s*.56, s*.2);
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.44, y+s*.22, s*.12, s*.3);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x+s*.18, y+s*.12, s*.25, s*.12);
  },
};
ITEMS.STEEL_HELM = {
  id: 'steel_helm', name: 'Steel Helm', stackable: false, equipSlot: 'helmet',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 24 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x+s*.12, y+s*.08, s*.76, s*.56);
    ctx.fillStyle = '#4a5060'; ctx.fillRect(x+s*.38, y+s*.0, s*.24, s*.1);
    ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(x+s*.44, y+s*.18, s*.12, s*.35);
    ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(x+s*.2, y+s*.3, s*.6, s*.1);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x+s*.2, y+s*.1, s*.25, s*.12);
  },
};
ITEMS.TUNGSTEN_HELM = {
  id: 'tungsten_helm', name: 'Tungsten Helm', stackable: false, equipSlot: 'helmet',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 50 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a3a5a'; ctx.fillRect(x+s*.1, y+s*.06, s*.8, s*.58);
    ctx.fillStyle = '#20203a'; ctx.fillRect(x+s*.1, y+s*.52, s*.8, s*.12);
    ctx.fillStyle = '#28285a'; ctx.fillRect(x+s*.36, y+s*.0, s*.28, s*.08);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x+s*.18, y+s*.28, s*.64, s*.22);
    ctx.fillStyle = 'rgba(120,120,200,0.4)'; ctx.fillRect(x+s*.18, y+s*.1, s*.28, s*.1);
    ctx.fillStyle = 'rgba(80,80,180,0.25)'; ctx.fillRect(x+s*.1, y+s*.06, s*.8, s*.58);
  },
};

/* ── Smithed armor (chestplates) ─────────────────────── */
ITEMS.BRONZE_PLATE = {
  id: 'bronze_plate', name: 'Bronze Plate', stackable: false, equipSlot: 'chestplate',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 12 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.0, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.85, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(255,200,80,0.22)'; ctx.fillRect(x+s*.14, y+s*.14, s*.3, s*.18);
  },
};
ITEMS.IRON_PLATE = {
  id: 'iron_plate', name: 'Iron Plate', stackable: false, equipSlot: 'chestplate',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 25 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.0, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.85, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x+s*.14, y+s*.14, s*.28, s*.16);
  },
};
ITEMS.STEEL_PLATE = {
  id: 'steel_plate', name: 'Steel Plate', stackable: false, equipSlot: 'chestplate',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 52 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a9aaa'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
    ctx.fillStyle = '#4a6a7a'; ctx.fillRect(x+s*.0, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = '#4a6a7a'; ctx.fillRect(x+s*.85, y+s*.2, s*.15, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(180,220,240,0.25)'; ctx.fillRect(x+s*.14, y+s*.14, s*.28, s*.16);
  },
};
ITEMS.TUNGSTEN_PLATE = {
  id: 'tungsten_plate', name: 'Tungsten Plate', stackable: false, equipSlot: 'chestplate',
  stats: { attackBonus: 0, strengthBonus: 0, defenceBonus: 110 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.0, y+s*.2, s*.16, s*.44);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.84, y+s*.2, s*.16, s*.44);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.22, y+s*.32, s*.18, s*.08);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.6, y+s*.32, s*.18, s*.08);
    ctx.fillStyle = 'rgba(80,80,180,0.2)'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
  },
};

/* ── Mithril armour (missing from original) ─────────── */
ITEMS.MITHRIL_HELM = {
  id: 'mithril_helm', name: 'Mithril Helm', stackable: false, equipSlot: 'helmet',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.11, y+s*.08, s*.78, s*.56);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.11, y+s*.52, s*.78, s*.12);
    ctx.fillStyle = '#3a3a8a'; ctx.fillRect(x+s*.37, y+s*.0,  s*.26, s*.1);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';   ctx.fillRect(x+s*.2,  y+s*.28, s*.6,  s*.2);
    ctx.fillStyle = 'rgba(140,140,255,0.45)'; ctx.fillRect(x+s*.18, y+s*.1, s*.26, s*.12);
    ctx.fillStyle = 'rgba(100,100,220,0.2)';  ctx.fillRect(x+s*.11, y+s*.08, s*.78, s*.56);
  },
};
ITEMS.MITHRIL_PLATE = {
  id: 'mithril_plate', name: 'Mithril Plate', stackable: false, equipSlot: 'chestplate',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.1,  y+s*.12, s*.8,  s*.65);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.0,  y+s*.2,  s*.15, s*.42);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.85, y+s*.2,  s*.15, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';    ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(140,140,255,0.3)'; ctx.fillRect(x+s*.14, y+s*.14, s*.28, s*.16);
    ctx.fillStyle = 'rgba(100,100,220,0.18)'; ctx.fillRect(x+s*.1, y+s*.12, s*.8, s*.65);
  },
};

/* ── Leggings ────────────────────────────────────────── */
ITEMS.BRONZE_LEGS = {
  id: 'bronze_legs', name: 'Bronze Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
  },
};
ITEMS.IRON_LEGS = {
  id: 'iron_legs', name: 'Iron Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
  },
};
ITEMS.MITHRIL_LEGS = {
  id: 'mithril_legs', name: 'Mithril Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
    ctx.fillStyle = 'rgba(120,120,220,0.2)'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
  },
};

/* ── Gloves ──────────────────────────────────────────── */
ITEMS.LEATHER_GLOVES = {
  id: 'leather_gloves', name: 'Leather Gloves', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5e3c'; ctx.fillRect(x+s*.1,  y+s*.2,  s*.8,  s*.55);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.1,  y+s*.65, s*.15, s*.2);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.28, y+s*.65, s*.15, s*.2);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.46, y+s*.65, s*.15, s*.2);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.64, y+s*.65, s*.15, s*.2);
  },
};
ITEMS.BRONZE_GAUNTLETS = {
  id: 'bronze_gauntlets', name: 'Bronze Gauntlets', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.1,  y+s*.18, s*.8,  s*.6);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.1,  y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.28, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.46, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.64, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = 'rgba(255,180,60,0.2)'; ctx.fillRect(x+s*.14, y+s*.2, s*.28, s*.1);
  },
};
ITEMS.IRON_GAUNTLETS = {
  id: 'iron_gauntlets', name: 'Iron Gauntlets', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.1,  y+s*.18, s*.8,  s*.6);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.1,  y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.28, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.46, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.64, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x+s*.14, y+s*.2, s*.26, s*.1);
  },
};
ITEMS.STEEL_GAUNTLETS = {
  id: 'steel_gauntlets', name: 'Steel Gauntlets', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x+s*.1,  y+s*.18, s*.8,  s*.6);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.1,  y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.28, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.46, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.64, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = 'rgba(180,220,240,0.25)'; ctx.fillRect(x+s*.14, y+s*.2, s*.26, s*.1);
  },
};

/* ── Boots ───────────────────────────────────────────── */
ITEMS.LEATHER_BOOTS = {
  id: 'leather_boots', name: 'Leather Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5e3c'; ctx.fillRect(x+s*.08, y+s*.3,  s*.84, s*.45);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.08, y+s*.3,  s*.84, s*.1);
  },
};
ITEMS.BRONZE_BOOTS = {
  id: 'bronze_boots', name: 'Bronze Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#b06820'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(255,180,60,0.2)'; ctx.fillRect(x+s*.12, y+s*.3, s*.3, s*.12);
  },
};
ITEMS.IRON_BOOTS = {
  id: 'iron_boots', name: 'Iron Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x+s*.12, y+s*.3, s*.28, s*.12);
  },
};
ITEMS.STEEL_BOOTS = {
  id: 'steel_boots', name: 'Steel Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(180,220,240,0.25)'; ctx.fillRect(x+s*.12, y+s*.3, s*.28, s*.12);
  },
};

/* ── Leather armour ──────────────────────────────────── */
ITEMS.LEATHER_CAP = {
  id: 'leather_cap', name: 'Leather Cap', stackable: false, equipSlot: 'helmet',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5e3c'; ctx.fillRect(x+s*.18, y+s*.14, s*.64, s*.48);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.18, y+s*.5,  s*.64, s*.1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x+s*.28, y+s*.32, s*.44, s*.18);
    ctx.fillStyle = 'rgba(180,120,60,0.3)'; ctx.fillRect(x+s*.22, y+s*.16, s*.24, s*.1);
  },
};
ITEMS.LEATHER_BODY = {
  id: 'leather_body', name: 'Leather Body', stackable: false, equipSlot: 'chestplate',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5e3c'; ctx.fillRect(x+s*.1,  y+s*.12, s*.8,  s*.65);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.0,  y+s*.2,  s*.15, s*.42);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.85, y+s*.2,  s*.15, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+s*.46, y+s*.12, s*.08, s*.65);
    ctx.fillStyle = 'rgba(180,120,60,0.25)'; ctx.fillRect(x+s*.14, y+s*.14, s*.28, s*.16);
  },
};
ITEMS.LEATHER_LEGS = {
  id: 'leather_legs', name: 'Leather Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5e3c'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#6a4428'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
  },
};

/* ── Capes ───────────────────────────────────────────── */
ITEMS.BROWN_CAPE = {
  id: 'brown_cape', name: 'Brown Cape', stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a5030'; ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.8);
    ctx.fillStyle = '#5a3818'; ctx.fillRect(x+s*.2, y+s*.8, s*.6, s*.1);
  },
};
ITEMS.RED_CAPE = {
  id: 'red_cape', name: 'Red Cape', stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.8);
    ctx.fillStyle = '#8e1a12'; ctx.fillRect(x+s*.2, y+s*.8, s*.6, s*.1);
    ctx.fillStyle = 'rgba(255,80,50,0.18)'; ctx.fillRect(x+s*.24, y+s*.12, s*.18, s*.3);
  },
};
ITEMS.BLUE_CAPE = {
  id: 'blue_cape', name: 'Blue Cape', stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2980b9'; ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.8);
    ctx.fillStyle = '#1a5c8a'; ctx.fillRect(x+s*.2, y+s*.8, s*.6, s*.1);
    ctx.fillStyle = 'rgba(100,180,255,0.2)'; ctx.fillRect(x+s*.24, y+s*.12, s*.18, s*.3);
  },
};
ITEMS.GREEN_CAPE = {
  id: 'green_cape', name: 'Green Cape', stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#27ae60'; ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.8);
    ctx.fillStyle = '#1a7a42'; ctx.fillRect(x+s*.2, y+s*.8, s*.6, s*.1);
    ctx.fillStyle = 'rgba(80,220,120,0.18)'; ctx.fillRect(x+s*.24, y+s*.12, s*.18, s*.3);
  },
};

/* ── Epic / new-playstyle items ──────────────────────── */
ITEMS.BERSERKER_AXE = {
  id: 'berserker_axe', name: "Berserker's Axe", stackable: false, equipSlot: 'weapon',
  draw(ctx, x, y, s) {
    // Handle
    ctx.fillStyle = '#3a1a08'; ctx.fillRect(x+s*.42, y+s*.42, s*.14, s*.5);
    // Head — wide, chunky
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(x+s*.16, y+s*.08, s*.6,  s*.22);
    ctx.fillRect(x+s*.58, y+s*.04, s*.16, s*.34);
    ctx.fillStyle = '#c03030'; ctx.fillRect(x+s*.16, y+s*.08, s*.6, s*.1);
    // Notch
    ctx.fillStyle = '#1a0808'; ctx.fillRect(x+s*.16, y+s*.22, s*.3, s*.08);
    ctx.fillStyle = 'rgba(255,80,80,0.3)'; ctx.fillRect(x+s*.2, y+s*.1, s*.3, s*.08);
    // Guard
    ctx.fillStyle = '#5a1010'; ctx.fillRect(x+s*.28, y+s*.38, s*.4, s*.08);
  },
};
ITEMS.SHADOW_DAGGER = {
  id: 'shadow_dagger', name: 'Shadow Dagger', stackable: false, equipSlot: 'weapon',
  draw(ctx, x, y, s) {
    // Handle
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x+s*.42, y+s*.56, s*.14, s*.36);
    ctx.fillStyle = '#2a2a4a'; ctx.fillRect(x+s*.42, y+s*.52, s*.14, s*.08);
    // Blade — short and narrow
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x+s*.44, y+s*.08, s*.1, s*.46);
    ctx.fillRect(x+s*.46, y+s*.04, s*.06, s*.06);
    // Edge highlight
    ctx.fillStyle = 'rgba(140,140,220,0.5)'; ctx.fillRect(x+s*.44, y+s*.08, s*.03, s*.46);
    ctx.fillStyle = 'rgba(80,80,180,0.2)'; ctx.fillRect(x+s*.42, y+s*.06, s*.14, s*.5);
  },
};
ITEMS.VENOM_BLADE = {
  id: 'venom_blade', name: 'Venom Blade', stackable: false, equipSlot: 'weapon',
  draw(ctx, x, y, s) {
    // Handle
    ctx.fillStyle = '#2a3a1a'; ctx.fillRect(x+s*.42, y+s*.56, s*.14, s*.35);
    ctx.fillStyle = '#1a4a1a'; ctx.fillRect(x+s*.3, y+s*.5, s*.38, s*.08);
    // Curved blade
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(x+s*.38, y+s*.08, s*.18, s*.44);
    ctx.fillRect(x+s*.44, y+s*.04, s*.12, s*.08);
    ctx.fillRect(x+s*.48, y+s*.02, s*.08, s*.06);
    // Venom glint
    ctx.fillStyle = 'rgba(80,200,80,0.45)'; ctx.fillRect(x+s*.38, y+s*.08, s*.04, s*.44);
    ctx.fillStyle = 'rgba(60,160,60,0.2)';  ctx.fillRect(x+s*.36, y+s*.06, s*.22, s*.48);
  },
};
ITEMS.BERSERKER_MASK = {
  id: 'berserker_mask', name: 'Berserker Mask', stackable: false, equipSlot: 'helmet',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a1010'; ctx.fillRect(x+s*.12, y+s*.08, s*.76, s*.58);
    ctx.fillStyle = '#3a0808'; ctx.fillRect(x+s*.12, y+s*.54, s*.76, s*.12);
    // Fang markings
    ctx.fillStyle = '#f0a020'; ctx.fillRect(x+s*.24, y+s*.14, s*.08, s*.2);
    ctx.fillStyle = '#f0a020'; ctx.fillRect(x+s*.68, y+s*.14, s*.08, s*.2);
    // Eye slits
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x+s*.2,  y+s*.28, s*.22, s*.12);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x+s*.58, y+s*.28, s*.22, s*.12);
    ctx.fillStyle = 'rgba(255,80,0,0.5)'; ctx.fillRect(x+s*.22, y+s*.3, s*.18, s*.06);
    ctx.fillStyle = 'rgba(255,80,0,0.5)'; ctx.fillRect(x+s*.6,  y+s*.3, s*.18, s*.06);
    ctx.fillStyle = 'rgba(200,40,0,0.25)'; ctx.fillRect(x+s*.12, y+s*.08, s*.76, s*.58);
  },
};
ITEMS.SHADOW_TUNIC = {
  id: 'shadow_tunic', name: 'Shadow Tunic', stackable: false, equipSlot: 'chestplate',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x+s*.1,  y+s*.12, s*.8,  s*.65);
    ctx.fillStyle = '#0e0e1e'; ctx.fillRect(x+s*.0,  y+s*.2,  s*.14, s*.42);
    ctx.fillStyle = '#0e0e1e'; ctx.fillRect(x+s*.86, y+s*.2,  s*.14, s*.42);
    ctx.fillStyle = 'rgba(80,80,160,0.35)'; ctx.fillRect(x+s*.14, y+s*.14, s*.28, s*.16);
    ctx.fillStyle = 'rgba(80,80,160,0.35)'; ctx.fillRect(x+s*.28, y+s*.36, s*.44, s*.08);
    ctx.fillStyle = 'rgba(60,60,140,0.2)';  ctx.fillRect(x+s*.1,  y+s*.12, s*.8,  s*.65);
  },
};
ITEMS.BERSERKER_WRAPS = {
  id: 'berserker_wraps', name: "Berserker's Wraps", stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#6a2010'; ctx.fillRect(x+s*.1,  y+s*.2,  s*.8,  s*.55);
    // Wrap lines
    ctx.fillStyle = '#4a1008'; ctx.fillRect(x+s*.1,  y+s*.3,  s*.8, s*.05);
    ctx.fillStyle = '#4a1008'; ctx.fillRect(x+s*.1,  y+s*.42, s*.8, s*.05);
    ctx.fillStyle = '#4a1008'; ctx.fillRect(x+s*.1,  y+s*.54, s*.8, s*.05);
    ctx.fillStyle = 'rgba(220,60,20,0.3)'; ctx.fillRect(x+s*.14, y+s*.22, s*.22, s*.08);
  },
};
ITEMS.SHADOW_TREADS = {
  id: 'shadow_treads', name: 'Shadow Treads', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#0e0e1e'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(80,80,200,0.4)'; ctx.fillRect(x+s*.12, y+s*.3,  s*.28, s*.12);
    ctx.fillStyle = 'rgba(60,60,180,0.2)'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
  },
};
ITEMS.WARRIOR_CAPE = {
  id: 'warrior_cape', name: "Warrior's Cape", stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8a2020'; ctx.fillRect(x+s*.18, y+s*.08, s*.64, s*.82);
    ctx.fillStyle = '#5a1010'; ctx.fillRect(x+s*.18, y+s*.82, s*.64, s*.1);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(x+s*.18, y+s*.08, s*.64, s*.06);
    ctx.fillStyle = 'rgba(255,100,60,0.2)'; ctx.fillRect(x+s*.22, y+s*.1, s*.2, s*.35);
  },
};
ITEMS.BERSERKER_CAPE = {
  id: 'berserker_cape', name: "Berserker's Cape", stackable: false, equipSlot: 'cape',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a0808'; ctx.fillRect(x+s*.18, y+s*.08, s*.64, s*.82);
    ctx.fillStyle = '#1e0404'; ctx.fillRect(x+s*.18, y+s*.82, s*.64, s*.1);
    // Rune marks
    ctx.fillStyle = 'rgba(220,40,0,0.5)'; ctx.fillRect(x+s*.3, y+s*.2, s*.08, s*.5);
    ctx.fillStyle = 'rgba(220,40,0,0.5)'; ctx.fillRect(x+s*.26, y+s*.4, s*.16, s*.06);
    ctx.fillStyle = 'rgba(255,80,0,0.25)'; ctx.fillRect(x+s*.18, y+s*.08, s*.64, s*.82);
  },
};

/* ── Furniture helpers ───────────────────────────────── */

function normalizeFurnitureFacing(facing) {
  switch ((facing || "south").toLowerCase()) {
    case "n":
    case "north":
      return "north";
    case "e":
    case "east":
      return "east";
    case "w":
    case "west":
      return "west";
    default:
      return "south";
  }
}

function drawMirroredX(ctx, x, y, s, painter) {
  ctx.save();
  ctx.translate(x + s, y);
  ctx.scale(-1, 1);
  painter(ctx, 0, 0, s);
  ctx.restore();
}

function makeDirectionalFurniture(config) {
  const defaultFacing = config.defaultFacing || "south";
  const variants = config.variants || {};

  return {
    ...config,
    defaultFacing,
    variants,
    draw(ctx, x, y, s, facing = defaultFacing) {
      const dir = normalizeFurnitureFacing(facing);
      const fn = variants[dir] || variants[defaultFacing] || variants.south;
      if (fn) fn.call(variants, ctx, x, y, s);
    },
  };
}

/* ── Furniture (placeable in player house) ───────────── */

ITEMS.FURN_CHAIR = makeDirectionalFurniture({
  id: "furn_chair",
  name: "Chair",
  stackable: true,
  placeable: true,
  furnitureTileId: 34,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.2, y + s * 0.7, s * 0.6, s * 0.12);

      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(x + s * 0.18, y + s * 0.08, s * 0.09, s * 0.52);
      ctx.fillRect(x + s * 0.73, y + s * 0.08, s * 0.09, s * 0.52);

      ctx.fillStyle = "#8b5e3c";
      ctx.fillRect(x + s * 0.18, y + s * 0.08, s * 0.64, s * 0.12);

      ctx.fillStyle = "#6a3e1e";
      ctx.fillRect(x + s * 0.18, y + s * 0.2, s * 0.64, s * 0.13);

      ctx.fillStyle = "#c8844a";
      ctx.fillRect(x + s * 0.16, y + s * 0.38, s * 0.68, s * 0.16);

      ctx.fillStyle = "#7a4a20";
      ctx.fillRect(x + s * 0.16, y + s * 0.53, s * 0.68, s * 0.07);

      ctx.fillStyle = "#c0392b";
      ctx.fillRect(x + s * 0.19, y + s * 0.36, s * 0.62, s * 0.12);

      ctx.fillStyle = "#901a14";
      ctx.fillRect(x + s * 0.19, y + s * 0.46, s * 0.62, s * 0.04);

      ctx.fillStyle = "#4a2808";
      ctx.fillRect(x + s * 0.18, y + s * 0.58, s * 0.09, s * 0.32);
      ctx.fillRect(x + s * 0.73, y + s * 0.58, s * 0.09, s * 0.32);
    },

    north(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.2, y + s * 0.72, s * 0.6, s * 0.1);

      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(x + s * 0.18, y + s * 0.12, s * 0.09, s * 0.34);
      ctx.fillRect(x + s * 0.73, y + s * 0.12, s * 0.09, s * 0.34);

      ctx.fillStyle = "#c8844a";
      ctx.fillRect(x + s * 0.16, y + s * 0.24, s * 0.68, s * 0.16);

      ctx.fillStyle = "#9c5b26";
      ctx.fillRect(x + s * 0.16, y + s * 0.24, s * 0.68, s * 0.05);

      ctx.fillStyle = "#c0392b";
      ctx.fillRect(x + s * 0.19, y + s * 0.27, s * 0.62, s * 0.1);

      ctx.fillStyle = "#901a14";
      ctx.fillRect(x + s * 0.19, y + s * 0.27, s * 0.62, s * 0.035);

      ctx.fillStyle = "#8b5e3c";
      ctx.fillRect(x + s * 0.18, y + s * 0.54, s * 0.64, s * 0.12);

      ctx.fillStyle = "#6a3e1e";
      ctx.fillRect(x + s * 0.18, y + s * 0.66, s * 0.64, s * 0.13);

      ctx.fillStyle = "#4a2808";
      ctx.fillRect(x + s * 0.18, y + s * 0.42, s * 0.09, s * 0.46);
      ctx.fillRect(x + s * 0.73, y + s * 0.42, s * 0.09, s * 0.46);
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.24, y + s * 0.74, s * 0.52, s * 0.1);

      ctx.fillStyle = "#3a1a08";
      ctx.fillRect(x + s * 0.16, y + s * 0.14, s * 0.14, s * 0.6);
      ctx.fillRect(x + s * 0.16, y + s * 0.14, s * 0.1, s * 0.16);
      ctx.fillRect(x + s * 0.16, y + s * 0.58, s * 0.1, s * 0.28);
      ctx.fillRect(x + s * 0.68, y + s * 0.58, s * 0.1, s * 0.28);

      ctx.fillStyle = "#8b5e3c";
      ctx.fillRect(x + s * 0.16, y + s * 0.14, s * 0.12, s * 0.58);

      ctx.fillStyle = "#6a3e1e";
      ctx.fillRect(x + s * 0.28, y + s * 0.14, s * 0.06, s * 0.58);

      ctx.fillStyle = "#c8844a";
      ctx.fillRect(x + s * 0.3, y + s * 0.4, s * 0.44, s * 0.16);

      ctx.fillStyle = "#7a4a20";
      ctx.fillRect(x + s * 0.3, y + s * 0.56, s * 0.44, s * 0.07);

      ctx.fillStyle = "#c0392b";
      ctx.fillRect(x + s * 0.32, y + s * 0.38, s * 0.4, s * 0.12);

      ctx.fillStyle = "#901a14";
      ctx.fillRect(x + s * 0.32, y + s * 0.48, s * 0.4, s * 0.04);

      ctx.fillStyle = "#4a2808";
      ctx.fillRect(x + s * 0.68, y + s * 0.16, s * 0.1, s * 0.18);
      ctx.fillRect(x + s * 0.68, y + s * 0.58, s * 0.1, s * 0.28);
    },

    west(ctx, x, y, s) {
      drawMirroredX(ctx, x, y, s, this.east);
    },
  },
});

ITEMS.FURN_RUG = makeDirectionalFurniture({
  id: "furn_rug",
  name: "Rug",
  stackable: true,
  placeable: true,
  furnitureTileId: 35,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(x + s * 0.06, y + s * 0.2, s * 0.88, s * 0.62);

      ctx.fillStyle = "#8b1010";
      ctx.fillRect(x + s * 0.06, y + s * 0.19, s * 0.88, s * 0.6);

      ctx.fillStyle = "#c0392b";
      ctx.fillRect(x + s * 0.1, y + s * 0.23, s * 0.8, s * 0.52);

      ctx.fillStyle = "#d04030";
      ctx.fillRect(x + s * 0.14, y + s * 0.27, s * 0.72, s * 0.44);

      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(x + s * 0.28, y + s * 0.37, s * 0.44, s * 0.24);

      ctx.fillStyle = "#d4a000";
      ctx.fillRect(x + s * 0.36, y + s * 0.43, s * 0.28, s * 0.12);

      ctx.fillStyle = "#8b1010";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + s * (0.08 + i * 0.16), y + s * 0.15, s * 0.06, s * 0.05);
        ctx.fillRect(x + s * (0.08 + i * 0.16), y + s * 0.79, s * 0.06, s * 0.05);
      }
    },

    north(ctx, x, y, s) {
      this.south(ctx, x, y, s);
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(x + s * 0.19, y + s * 0.06, s * 0.62, s * 0.88);

      ctx.fillStyle = "#8b1010";
      ctx.fillRect(x + s * 0.18, y + s * 0.06, s * 0.6, s * 0.88);

      ctx.fillStyle = "#c0392b";
      ctx.fillRect(x + s * 0.22, y + s * 0.1, s * 0.52, s * 0.8);

      ctx.fillStyle = "#d04030";
      ctx.fillRect(x + s * 0.26, y + s * 0.14, s * 0.44, s * 0.72);

      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(x + s * 0.36, y + s * 0.28, s * 0.24, s * 0.44);

      ctx.fillStyle = "#d4a000";
      ctx.fillRect(x + s * 0.42, y + s * 0.36, s * 0.12, s * 0.28);

      ctx.fillStyle = "#8b1010";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + s * 0.14, y + s * (0.08 + i * 0.16), s * 0.05, s * 0.06);
        ctx.fillRect(x + s * 0.78, y + s * (0.08 + i * 0.16), s * 0.05, s * 0.06);
      }
    },

    west(ctx, x, y, s) {
      this.east(ctx, x, y, s);
    },
  },
});

ITEMS.FURN_TABLE = makeDirectionalFurniture({
  id: "furn_table",
  name: "Table",
  stackable: true,
  placeable: true,
  furnitureTileId: 36,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.1, y + s * 0.72, s * 0.8, s * 0.14);

      ctx.fillStyle = "#3a1808";
      ctx.fillRect(x + s * 0.12, y + s * 0.28, s * 0.1, s * 0.32);
      ctx.fillRect(x + s * 0.78, y + s * 0.28, s * 0.1, s * 0.32);

      ctx.fillStyle = "#5a3010";
      ctx.fillRect(x + s * 0.12, y + s * 0.52, s * 0.1, s * 0.32);
      ctx.fillRect(x + s * 0.78, y + s * 0.52, s * 0.1, s * 0.32);

      ctx.fillStyle = "#7a4820";
      ctx.fillRect(x + s * 0.12, y + s * 0.52, s * 0.76, s * 0.1);

      ctx.fillStyle = "#d09050";
      ctx.fillRect(x + s * 0.08, y + s * 0.22, s * 0.84, s * 0.32);

      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + s * 0.08, y + s * 0.22, s * 0.84, s * 0.04);

      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let gx = 0.2; gx < 0.85; gx += 0.22) {
        ctx.fillRect(x + s * gx, y + s * 0.24, s * 0.02, s * 0.28);
      }

      ctx.fillStyle = "#a06030";
      ctx.fillRect(x + s * 0.08, y + s * 0.5, s * 0.84, s * 0.04);
    },

    north(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.1, y + s * 0.72, s * 0.8, s * 0.12);

      ctx.fillStyle = "#5a3010";
      ctx.fillRect(x + s * 0.12, y + s * 0.28, s * 0.1, s * 0.32);
      ctx.fillRect(x + s * 0.78, y + s * 0.28, s * 0.1, s * 0.32);

      ctx.fillStyle = "#3a1808";
      ctx.fillRect(x + s * 0.12, y + s * 0.52, s * 0.1, s * 0.32);
      ctx.fillRect(x + s * 0.78, y + s * 0.52, s * 0.1, s * 0.32);

      ctx.fillStyle = "#a06030";
      ctx.fillRect(x + s * 0.08, y + s * 0.26, s * 0.84, s * 0.04);

      ctx.fillStyle = "#d09050";
      ctx.fillRect(x + s * 0.08, y + s * 0.3, s * 0.84, s * 0.32);

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + s * 0.08, y + s * 0.34, s * 0.84, s * 0.03);

      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let gx = 0.2; gx < 0.85; gx += 0.22) {
        ctx.fillRect(x + s * gx, y + s * 0.32, s * 0.02, s * 0.28);
      }

      ctx.fillStyle = "#7a4820";
      ctx.fillRect(x + s * 0.12, y + s * 0.52, s * 0.76, s * 0.1);
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.18, y + s * 0.74, s * 0.64, s * 0.1);

      ctx.fillStyle = "#3a1808";
      ctx.fillRect(x + s * 0.22, y + s * 0.24, s * 0.1, s * 0.22);
      ctx.fillRect(x + s * 0.22, y + s * 0.58, s * 0.1, s * 0.26);
      ctx.fillRect(x + s * 0.68, y + s * 0.24, s * 0.1, s * 0.22);
      ctx.fillRect(x + s * 0.68, y + s * 0.58, s * 0.1, s * 0.26);

      ctx.fillStyle = "#d09050";
      ctx.fillRect(x + s * 0.18, y + s * 0.18, s * 0.54, s * 0.18);

      ctx.fillStyle = "#b87738";
      ctx.fillRect(x + s * 0.72, y + s * 0.18, s * 0.12, s * 0.18);

      ctx.fillStyle = "#a06030";
      ctx.fillRect(x + s * 0.18, y + s * 0.36, s * 0.54, s * 0.04);

      ctx.fillStyle = "#7a4820";
      ctx.fillRect(x + s * 0.72, y + s * 0.36, s * 0.12, s * 0.28);

      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + s * 0.18, y + s * 0.18, s * 0.66, s * 0.03);

      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let gy = 0.24; gy < 0.58; gy += 0.11) {
        ctx.fillRect(x + s * 0.24, y + s * gy, s * 0.42, s * 0.015);
      }
    },

    west(ctx, x, y, s) {
      drawMirroredX(ctx, x, y, s, this.east);
    },
  },
});

ITEMS.FURN_CHEST = makeDirectionalFurniture({
  id: "furn_chest",
  name: "Chest",
  stackable: true,
  placeable: true,
  furnitureTileId: 37,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + s * 0.1, y + s * 0.78, s * 0.8, s * 0.1);

      ctx.fillStyle = "#4a1a08";
      ctx.fillRect(x + s * 0.08, y + s * 0.35, s * 0.1, s * 0.42);
      ctx.fillRect(x + s * 0.82, y + s * 0.35, s * 0.1, s * 0.42);

      ctx.fillStyle = "#8b5020";
      ctx.fillRect(x + s * 0.08, y + s * 0.5, s * 0.84, s * 0.28);

      ctx.fillStyle = "#b87030";
      ctx.fillRect(x + s * 0.1, y + s * 0.22, s * 0.8, s * 0.3);

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(x + s * 0.1, y + s * 0.22, s * 0.8, s * 0.05);

      ctx.fillStyle = "#7a4018";
      ctx.fillRect(x + s * 0.08, y + s * 0.5, s * 0.84, s * 0.06);

      ctx.fillStyle = "#d4a017";
      ctx.fillRect(x + s * 0.08, y + s * 0.52, s * 0.84, s * 0.05);
      ctx.fillRect(x + s * 0.46, y + s * 0.22, s * 0.08, s * 0.56);
      ctx.fillRect(x + s * 0.12, y + s * 0.25, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.81, y + s * 0.25, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.12, y + s * 0.65, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.81, y + s * 0.65, s * 0.07, s * 0.07);

      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(x + s * 0.44, y + s * 0.49, s * 0.12, s * 0.1);

      ctx.fillStyle = "#8b6000";
      ctx.fillRect(x + s * 0.46, y + s * 0.51, s * 0.08, s * 0.06);
    },

    north(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + s * 0.1, y + s * 0.78, s * 0.8, s * 0.1);

      ctx.fillStyle = "#4a1a08";
      ctx.fillRect(x + s * 0.08, y + s * 0.42, s * 0.1, s * 0.36);
      ctx.fillRect(x + s * 0.82, y + s * 0.42, s * 0.1, s * 0.36);

      ctx.fillStyle = "#d4a017";
      ctx.fillRect(x + s * 0.08, y + s * 0.34, s * 0.84, s * 0.05);
      ctx.fillRect(x + s * 0.46, y + s * 0.22, s * 0.08, s * 0.56);

      ctx.fillStyle = "#b87030";
      ctx.fillRect(x + s * 0.1, y + s * 0.28, s * 0.8, s * 0.3);

      ctx.fillStyle = "#a86428";
      ctx.fillRect(x + s * 0.1, y + s * 0.28, s * 0.8, s * 0.04);

      ctx.fillStyle = "#8b5020";
      ctx.fillRect(x + s * 0.08, y + s * 0.39, s * 0.84, s * 0.39);

      ctx.fillStyle = "#7a4018";
      ctx.fillRect(x + s * 0.08, y + s * 0.34, s * 0.84, s * 0.06);

      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(x + s * 0.44, y + s * 0.33, s * 0.12, s * 0.1);

      ctx.fillStyle = "#8b6000";
      ctx.fillRect(x + s * 0.46, y + s * 0.35, s * 0.08, s * 0.06);

      ctx.fillStyle = "#d4a017";
      ctx.fillRect(x + s * 0.12, y + s * 0.31, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.81, y + s * 0.31, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.12, y + s * 0.65, s * 0.07, s * 0.07);
      ctx.fillRect(x + s * 0.81, y + s * 0.65, s * 0.07, s * 0.07);
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + s * 0.18, y + s * 0.78, s * 0.66, s * 0.09);

      ctx.fillStyle = "#8b5020";
      ctx.fillRect(x + s * 0.18, y + s * 0.42, s * 0.44, s * 0.34);

      ctx.fillStyle = "#4a1a08";
      ctx.fillRect(x + s * 0.62, y + s * 0.38, s * 0.18, s * 0.38);

      ctx.fillStyle = "#b87030";
      ctx.fillRect(x + s * 0.2, y + s * 0.24, s * 0.4, s * 0.18);

      ctx.fillStyle = "#9b5d28";
      ctx.fillRect(x + s * 0.62, y + s * 0.24, s * 0.16, s * 0.18);

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(x + s * 0.2, y + s * 0.24, s * 0.58, s * 0.035);

      ctx.fillStyle = "#7a4018";
      ctx.fillRect(x + s * 0.18, y + s * 0.38, s * 0.44, s * 0.05);
      ctx.fillRect(x + s * 0.62, y + s * 0.38, s * 0.18, s * 0.05);

      ctx.fillStyle = "#d4a017";
      ctx.fillRect(x + s * 0.18, y + s * 0.45, s * 0.62, s * 0.05);
      ctx.fillRect(x + s * 0.46, y + s * 0.24, s * 0.06, s * 0.52);
      ctx.fillRect(x + s * 0.23, y + s * 0.28, s * 0.05, s * 0.05);
      ctx.fillRect(x + s * 0.69, y + s * 0.28, s * 0.05, s * 0.05);
      ctx.fillRect(x + s * 0.23, y + s * 0.66, s * 0.05, s * 0.05);
      ctx.fillRect(x + s * 0.69, y + s * 0.66, s * 0.05, s * 0.05);

      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(x + s * 0.44, y + s * 0.41, s * 0.09, s * 0.09);

      ctx.fillStyle = "#8b6000";
      ctx.fillRect(x + s * 0.46, y + s * 0.43, s * 0.05, s * 0.05);
    },

    west(ctx, x, y, s) {
      drawMirroredX(ctx, x, y, s, this.east);
    },
  },
});

ITEMS.FURN_BOOKSHELF = makeDirectionalFurniture({
  id: "furn_bookshelf",
  name: "Bookshelf",
  stackable: true,
  placeable: true,
  furnitureTileId: 38,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + s * 0.06, y + s * 0.88, s * 0.88, s * 0.08);

      ctx.fillStyle = "#2e1a08";
      ctx.fillRect(x + s * 0.06, y + s * 0.1, s * 0.1, s * 0.8);
      ctx.fillRect(x + s * 0.84, y + s * 0.1, s * 0.1, s * 0.8);

      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x + s * 0.16, y + s * 0.1, s * 0.68, s * 0.8);

      ctx.fillStyle = "#7a5030";
      ctx.fillRect(x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.1);

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.03);

      ctx.fillStyle = "#5a3818";
      ctx.fillRect(x + s * 0.16, y + s * 0.44, s * 0.68, s * 0.06);
      ctx.fillRect(x + s * 0.16, y + s * 0.72, s * 0.68, s * 0.06);

      const topC = ["#e74c3c", "#3498db", "#27ae60", "#f39c12"];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = topC[i];
        ctx.fillRect(x + s * (0.18 + i * 0.16), y + s * 0.13, s * 0.12, s * 0.3);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(x + s * (0.18 + i * 0.16), y + s * 0.13, s * 0.03, s * 0.3);
      }

      const midC = ["#8e44ad", "#e67e22", "#c0392b", "#1a8a6a"];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = midC[i];
        ctx.fillRect(x + s * (0.18 + i * 0.16), y + s * 0.5, s * 0.12, s * 0.2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x + s * (0.18 + i * 0.16), y + s * 0.5, s * 0.03, s * 0.2);
      }
    },

    north(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + s * 0.06, y + s * 0.88, s * 0.88, s * 0.08);

      ctx.fillStyle = "#2a1607";
      ctx.fillRect(x + s * 0.06, y + s * 0.12, s * 0.88, s * 0.78);

      ctx.fillStyle = "#6c4729";
      ctx.fillRect(x + s * 0.06, y + s * 0.08, s * 0.88, s * 0.08);

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + s * 0.06, y + s * 0.08, s * 0.88, s * 0.025);

      ctx.fillStyle = "#5a3818";
      ctx.fillRect(x + s * 0.12, y + s * 0.34, s * 0.76, s * 0.05);
      ctx.fillRect(x + s * 0.12, y + s * 0.58, s * 0.76, s * 0.05);
      ctx.fillRect(x + s * 0.12, y + s * 0.8, s * 0.76, s * 0.05);

      ctx.fillStyle = "#201208";
      for (let gy = 0.18; gy < 0.76; gy += 0.17) {
        ctx.fillRect(x + s * 0.16, y + s * gy, s * 0.68, s * 0.03);
      }
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + s * 0.22, y + s * 0.88, s * 0.62, s * 0.08);

      ctx.fillStyle = "#2e1a08";
      ctx.fillRect(x + s * 0.18, y + s * 0.12, s * 0.18, s * 0.78);

      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x + s * 0.36, y + s * 0.12, s * 0.32, s * 0.78);

      ctx.fillStyle = "#7a5030";
      ctx.fillRect(x + s * 0.18, y + s * 0.08, s * 0.5, s * 0.08);

      ctx.fillStyle = "#5a3818";
      ctx.fillRect(x + s * 0.22, y + s * 0.38, s * 0.42, s * 0.05);
      ctx.fillRect(x + s * 0.22, y + s * 0.6, s * 0.42, s * 0.05);
      ctx.fillRect(x + s * 0.22, y + s * 0.82, s * 0.42, s * 0.05);

      const colors = ["#e74c3c", "#3498db", "#27ae60", "#f39c12", "#8e44ad", "#e67e22"];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(x + s * 0.42, y + s * (0.15 + i * 0.11), s * 0.18, s * 0.08);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x + s * 0.42, y + s * (0.15 + i * 0.11), s * 0.03, s * 0.08);
      }
    },

    west(ctx, x, y, s) {
      drawMirroredX(ctx, x, y, s, this.east);
    },
  },
});

ITEMS.FURN_PLANT = makeDirectionalFurniture({
  id: "furn_plant",
  name: "Plant",
  stackable: true,
  placeable: true,
  furnitureTileId: 39,
  variants: {
    south(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.9, s * 0.22, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a04a18";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.28);

      ctx.fillStyle = "#7a3010";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.07, s * 0.28);
      ctx.fillRect(x + s * 0.63, y + s * 0.6, s * 0.07, s * 0.28);

      ctx.fillStyle = "#c06020";
      ctx.fillRect(x + s * 0.27, y + s * 0.57, s * 0.46, s * 0.07);

      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x + s * 0.3, y + s * 0.57, s * 0.4, s * 0.06);

      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(x + s * 0.47, y + s * 0.28, s * 0.06, s * 0.32);

      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.3, y + s * 0.38, s * 0.2, s * 0.12, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.7, y + s * 0.36, s * 0.18, s * 0.11, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.31, y + s * 0.36, s * 0.14, s * 0.08, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.69, y + s * 0.34, s * 0.13, s * 0.08, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.22, s * 0.14, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.3, y + s * 0.36, s * 0.06, s * 0.03, -0.4, 0, Math.PI * 2);
      ctx.fill();
    },

    north(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.9, s * 0.22, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a04a18";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.28);

      ctx.fillStyle = "#7a3010";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.07, s * 0.28);
      ctx.fillRect(x + s * 0.63, y + s * 0.6, s * 0.07, s * 0.28);

      ctx.fillStyle = "#c06020";
      ctx.fillRect(x + s * 0.27, y + s * 0.57, s * 0.46, s * 0.07);

      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x + s * 0.3, y + s * 0.57, s * 0.4, s * 0.06);

      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(x + s * 0.47, y + s * 0.28, s * 0.06, s * 0.32);

      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.28, y + s * 0.32, s * 0.16, s * 0.1, -0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.72, y + s * 0.3, s * 0.16, s * 0.1, 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.34, y + s * 0.26, s * 0.14, s * 0.08, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.66, y + s * 0.24, s * 0.14, s * 0.08, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.18, s * 0.14, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    east(ctx, x, y, s) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.52, y + s * 0.9, s * 0.22, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a04a18";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.28);

      ctx.fillStyle = "#7a3010";
      ctx.fillRect(x + s * 0.3, y + s * 0.6, s * 0.07, s * 0.28);
      ctx.fillRect(x + s * 0.63, y + s * 0.6, s * 0.07, s * 0.28);

      ctx.fillStyle = "#c06020";
      ctx.fillRect(x + s * 0.27, y + s * 0.57, s * 0.46, s * 0.07);

      ctx.fillStyle = "#3a2010";
      ctx.fillRect(x + s * 0.3, y + s * 0.57, s * 0.4, s * 0.06);

      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(x + s * 0.47, y + s * 0.26, s * 0.06, s * 0.34);

      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.36, y + s * 0.32, s * 0.15, s * 0.1, -0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.63, y + s * 0.28, s * 0.22, s * 0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.66, y + s * 0.42, s * 0.18, s * 0.1, 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.66, y + s * 0.27, s * 0.16, s * 0.09, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.66, y + s * 0.41, s * 0.14, s * 0.08, 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s * 0.38, y + s * 0.3, s * 0.1, s * 0.06, -0.8, 0, Math.PI * 2);
      ctx.fill();
    },

    west(ctx, x, y, s) {
      drawMirroredX(ctx, x, y, s, this.east);
    },
  },
});

/** Maps equipment slot IDs → inventory item defs for equip/unequip */
export const EQUIP_ID_TO_ITEM = {
  // ── Weapons ──────────────────────────────────────────
  bronze_sword:      ITEMS.BRONZE_SWORD,
  iron_sword:        ITEMS.IRON_SWORD,
  steel_sword:       ITEMS.STEEL_SWORD,
  mithril_sword:     ITEMS.MITHRIL_SWORD,
  tungsten_blade:    ITEMS.TUNGSTEN_BLADE,
  obsidian_cleaver:  ITEMS.OBSIDIAN_CLEAVER,
  moonstone_staff:   ITEMS.MOONSTONE_STAFF,
  berserker_axe:     ITEMS.BERSERKER_AXE,
  shadow_dagger:     ITEMS.SHADOW_DAGGER,
  venom_blade:       ITEMS.VENOM_BLADE,
  // ── Helmets ───────────────────────────────────────────
  leather_cap:       ITEMS.LEATHER_CAP,
  bronze_helm:       ITEMS.BRONZE_HELM,
  iron_helm:         ITEMS.IRON_HELM,
  steel_helm:        ITEMS.STEEL_HELM,
  mithril_helm:      ITEMS.MITHRIL_HELM,
  tungsten_helm:     ITEMS.TUNGSTEN_HELM,
  berserker_mask:    ITEMS.BERSERKER_MASK,
  // ── Chestplates ───────────────────────────────────────
  leather_body:      ITEMS.LEATHER_BODY,
  bronze_plate:      ITEMS.BRONZE_PLATE,
  iron_plate:        ITEMS.IRON_PLATE,
  steel_plate:       ITEMS.STEEL_PLATE,
  mithril_plate:     ITEMS.MITHRIL_PLATE,
  tungsten_plate:    ITEMS.TUNGSTEN_PLATE,
  shadow_tunic:      ITEMS.SHADOW_TUNIC,
  // ── Leggings ──────────────────────────────────────────
  leather_legs:      ITEMS.LEATHER_LEGS,
  bronze_legs:       ITEMS.BRONZE_LEGS,
  iron_legs:         ITEMS.IRON_LEGS,
  mithril_legs:      ITEMS.MITHRIL_LEGS,
  // ── Gloves ────────────────────────────────────────────
  leather_gloves:    ITEMS.LEATHER_GLOVES,
  bronze_gauntlets:  ITEMS.BRONZE_GAUNTLETS,
  iron_gauntlets:    ITEMS.IRON_GAUNTLETS,
  steel_gauntlets:   ITEMS.STEEL_GAUNTLETS,
  berserker_wraps:   ITEMS.BERSERKER_WRAPS,
  // ── Boots ─────────────────────────────────────────────
  leather_boots:     ITEMS.LEATHER_BOOTS,
  bronze_boots:      ITEMS.BRONZE_BOOTS,
  iron_boots:        ITEMS.IRON_BOOTS,
  steel_boots:       ITEMS.STEEL_BOOTS,
  shadow_treads:     ITEMS.SHADOW_TREADS,
  // ── Capes ─────────────────────────────────────────────
  brown_cape:        ITEMS.BROWN_CAPE,
  red_cape:          ITEMS.RED_CAPE,
  blue_cape:         ITEMS.BLUE_CAPE,
  green_cape:        ITEMS.GREEN_CAPE,
  warrior_cape:      ITEMS.WARRIOR_CAPE,
  berserker_cape:    ITEMS.BERSERKER_CAPE,
};
