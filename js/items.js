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
    description: 'A simple bronze axe. Cuts ordinary trees.',
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
    description: 'Flint and steel in a tidy pouch. Strike to light a fire.',
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
    description: 'A sturdy rod. Use at a fishing spot to cast a line.',
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
    description: 'Legal tender across the kingdom.',
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
    description: 'Rough logs from an ordinary tree. Good for firewood or planks.',
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
    description: 'Dense oak logs. Burn longer and crackle loudly.',
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
    description: 'Pale willow logs, soft and easy to split.',
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
    description: 'Reddish maple logs streaked with amber.',
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
    description: 'Ancient yew — prized by bowyers for its spring.',
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
    description: 'Faintly luminous logs that hum when burned.',
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
    description: 'Relic wood from a forgotten age. Burns with eerie flame.',
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
    description: 'A bronze pickaxe. Strikes soft ores.',
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
    description: 'A chunk of copper ore. Smelt with tin to make bronze.',
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
    description: 'Rust-red iron ore. The backbone of any smith.',
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
    description: 'Dense black coal. Fuels hotter furnaces.',
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
    description: 'Flecked gold ore. Worth a pretty coin.',
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
    description: 'Rare blue-silver ore. Lightweight and fierce.',
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
    description: 'Brittle tin ore. Alloyed with copper to yield bronze.',
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
    description: 'Pale silver ore. Valued by jewellers.',
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
    description: 'Impossibly dense ore. Few forges can tame it.',
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
    description: 'Volcanic glass, black as night and sharp as regret.',
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
    description: 'A pale stone that glows softly under moonlight.',
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
    description: 'The remains of a slain creature.',
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

// ── Shared fish draw helpers ──────────────────────────────────────────────
function _rf(ctx, x, y, s, body, tail) {           // standard raw fish
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x+s*.5, y+s*.5, s*.35, s*.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(x+s*.15, y+s*.5); ctx.lineTo(x+s*.02, y+s*.32); ctx.lineTo(x+s*.02, y+s*.68);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='#222'; ctx.fillRect(x+s*.72, y+s*.44, s*.06, s*.06);
}
function _re(ctx, x, y, s, body) {                // raw eel
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x+s*.5, y+s*.5, s*.43, s*.09, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)';
  ctx.beginPath();
  ctx.ellipse(x+s*.5, y+s*.5, s*.43, s*.06, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#222'; ctx.fillRect(x+s*.83, y+s*.46, s*.05, s*.05);
}
function _rp(ctx, x, y, s, body, spk) {           // raw puffer
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.23, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = spk;
  for (let i=0; i<8; i++) {
    const a = i*Math.PI/4;
    ctx.fillRect(x+s*.5+Math.cos(a)*s*.26-s*.02, y+s*.5+Math.sin(a)*s*.26-s*.02, s*.04, s*.04);
  }
  ctx.fillStyle='#222'; ctx.fillRect(x+s*.62, y+s*.46, s*.06, s*.06);
}
function _rj(ctx, x, y, s, body, glow) {          // raw jellyfish/jelly
  ctx.fillStyle = body+'99';
  ctx.beginPath(); ctx.arc(x+s*.5, y+s*.38, s*.22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = glow+'55';
  ctx.beginPath(); ctx.arc(x+s*.5, y+s*.38, s*.16, Math.PI, 0); ctx.fill();
  ctx.fillStyle = body+'77';
  for (let i=0; i<4; i++) ctx.fillRect(x+s*(.31+i*.12), y+s*.5, s*.03, s*.26);
}
function _cf(ctx, x, y, s, col) {                 // cooked fish (any)
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x+s*.5, y+s*.5, s*.35, s*.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)';
  ctx.fillRect(x+s*.44, y+s*.18, s*.04, s*.14); ctx.fillRect(x+s*.56, y+s*.12, s*.04, s*.17);
}
function _ce(ctx, x, y, s, col) {                 // cooked eel
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x+s*.5, y+s*.5, s*.43, s*.09, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)';
  ctx.fillRect(x+s*.44, y+s*.38, s*.04, s*.1); ctx.fillRect(x+s*.56, y+s*.33, s*.04, s*.12);
}

// ── New fish items ────────────────────────────────────────────────────────
ITEMS.RAW_GUDGEON      = { id:'raw_gudgeon',      name:'Raw Gudgeon',      stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#8B7355','#6B5335')} };
ITEMS.COOKED_GUDGEON   = { id:'cooked_gudgeon',   name:'Cooked Gudgeon',   stackable:false, heal:3,  draw(c,x,y,s){_cf(c,x,y,s,'#7A5830')} };
ITEMS.RAW_CARP         = { id:'raw_carp',         name:'Raw Carp',         stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#D4A030','#B47820')} };
ITEMS.COOKED_CARP      = { id:'cooked_carp',      name:'Cooked Carp',      stackable:false, heal:4,  draw(c,x,y,s){_cf(c,x,y,s,'#A07020')} };
ITEMS.RAW_PERCH        = { id:'raw_perch',        name:'Raw Perch',        stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#6B9B3A','#4B7B2A')} };
ITEMS.COOKED_PERCH     = { id:'cooked_perch',     name:'Cooked Perch',     stackable:false, heal:5,  draw(c,x,y,s){_cf(c,x,y,s,'#4A7020')} };
ITEMS.RAW_BASS         = { id:'raw_bass',         name:'Raw Bass',         stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#A8C870','#788850')} };
ITEMS.COOKED_BASS      = { id:'cooked_bass',      name:'Cooked Bass',      stackable:false, heal:6,  draw(c,x,y,s){_cf(c,x,y,s,'#706840')} };
ITEMS.RAW_PIKE         = { id:'raw_pike',         name:'Raw Pike',         stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#487048','#284828')} };
ITEMS.COOKED_PIKE      = { id:'cooked_pike',      name:'Cooked Pike',      stackable:false, heal:7,  draw(c,x,y,s){_cf(c,x,y,s,'#304828')} };
ITEMS.RAW_ICE_FISH     = { id:'raw_ice_fish',     name:'Raw Ice Fish',     stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#B8E0F0','#88C0D8')} };
ITEMS.COOKED_ICE_FISH  = { id:'cooked_ice_fish',  name:'Cooked Ice Fish',  stackable:false, heal:3,  draw(c,x,y,s){_cf(c,x,y,s,'#A0C0D0')} };
ITEMS.RAW_WALLEYE      = { id:'raw_walleye',      name:'Raw Walleye',      stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#C8A830','#A07820')} };
ITEMS.COOKED_WALLEYE   = { id:'cooked_walleye',   name:'Cooked Walleye',   stackable:false, heal:6,  draw(c,x,y,s){_cf(c,x,y,s,'#906818')} };
ITEMS.RAW_ARCTIC_CHAR  = { id:'raw_arctic_char',  name:'Raw Arctic Char',  stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#D84828','#B83020')} };
ITEMS.COOKED_ARCTIC_CHAR={ id:'cooked_arctic_char',name:'Cooked Arctic Char',stackable:false,heal:8, draw(c,x,y,s){_cf(c,x,y,s,'#A03020')} };
ITEMS.RAW_SNOWFLAKE_EEL= { id:'raw_snowflake_eel',name:'Raw Snowflake Eel',stackable:false, draw(c,x,y,s){_re(c,x,y,s,'#D0E8F8')} };
ITEMS.COOKED_SNOWFLAKE_EEL={ id:'cooked_snowflake_eel',name:'Cooked Snowflake Eel',stackable:false,heal:11,draw(c,x,y,s){_ce(c,x,y,s,'#A0B8C8')} };
ITEMS.RAW_GLACIERFISH  = { id:'raw_glacierfish',  name:'Raw Glacierfish',  stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#80C8E8','#409888')} };
ITEMS.COOKED_GLACIERFISH={ id:'cooked_glacierfish',name:'Cooked Glacierfish',stackable:false,heal:18,draw(c,x,y,s){_cf(c,x,y,s,'#306878')} };
ITEMS.RAW_MUDSKIPPER   = { id:'raw_mudskipper',   name:'Raw Mudskipper',   stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#7B6040','#5B4028')} };
ITEMS.COOKED_MUDSKIPPER= { id:'cooked_mudskipper',name:'Cooked Mudskipper',stackable:false, heal:3,  draw(c,x,y,s){_cf(c,x,y,s,'#604028')} };
ITEMS.RAW_SWAMP_EEL    = { id:'raw_swamp_eel',    name:'Raw Swamp Eel',    stackable:false, draw(c,x,y,s){_re(c,x,y,s,'#4A6030')} };
ITEMS.COOKED_SWAMP_EEL = { id:'cooked_swamp_eel', name:'Cooked Swamp Eel', stackable:false, heal:6,  draw(c,x,y,s){_ce(c,x,y,s,'#304020')} };
ITEMS.RAW_SLIMEJACK    = { id:'raw_slimejack',    name:'Raw Slimejack',    stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#60A040','#A840A0')} };
ITEMS.COOKED_SLIMEJACK = { id:'cooked_slimejack', name:'Cooked Slimejack', stackable:false, heal:11, draw(c,x,y,s){_cf(c,x,y,s,'#406830')} };
ITEMS.RAW_MUTANT_CARP  = { id:'raw_mutant_carp',  name:'Raw Mutant Carp',  stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#506830','#809840')} };
ITEMS.COOKED_MUTANT_CARP={ id:'cooked_mutant_carp',name:'Cooked Mutant Carp',stackable:false,heal:15,draw(c,x,y,s){_cf(c,x,y,s,'#405020')} };
ITEMS.RAW_SANDY_GOBY   = { id:'raw_sandy_goby',   name:'Raw Sandy Goby',   stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#D0A870','#A07848')} };
ITEMS.COOKED_SANDY_GOBY= { id:'cooked_sandy_goby',name:'Cooked Sandy Goby',stackable:false, heal:3,  draw(c,x,y,s){_cf(c,x,y,s,'#906040')} };
ITEMS.RAW_PUFFERFISH   = { id:'raw_pufferfish',   name:'Raw Pufferfish',   stackable:false, draw(c,x,y,s){_rp(c,x,y,s,'#D4B828','#A09020')} };
ITEMS.COOKED_PUFFERFISH= { id:'cooked_pufferfish',name:'Cooked Pufferfish',stackable:false, heal:8,  draw(c,x,y,s){_cf(c,x,y,s,'#906810')} };
ITEMS.RAW_SANDFISH     = { id:'raw_sandfish',     name:'Raw Sandfish',     stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#E0B848','#C09828')} };
ITEMS.COOKED_SANDFISH  = { id:'cooked_sandfish',  name:'Cooked Sandfish',  stackable:false, heal:13, draw(c,x,y,s){_cf(c,x,y,s,'#A07828')} };
ITEMS.RAW_LAVA_EEL     = { id:'raw_lava_eel',     name:'Raw Lava Eel',     stackable:false, draw(c,x,y,s){_re(c,x,y,s,'#D84820')} };
ITEMS.COOKED_LAVA_EEL  = { id:'cooked_lava_eel',  name:'Cooked Lava Eel',  stackable:false, heal:9,  draw(c,x,y,s){_ce(c,x,y,s,'#903010')} };
ITEMS.RAW_MAGMA_CARP   = { id:'raw_magma_carp',   name:'Raw Magma Carp',   stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#803020','#400808')} };
ITEMS.COOKED_MAGMA_CARP= { id:'cooked_magma_carp',name:'Cooked Magma Carp',stackable:false, heal:13, draw(c,x,y,s){_cf(c,x,y,s,'#602010')} };
ITEMS.RAW_DRAGON_GOBY  = { id:'raw_dragon_goby',  name:'Raw Dragon Goby',  stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#601020','#200008')} };
ITEMS.COOKED_DRAGON_GOBY={ id:'cooked_dragon_goby',name:'Cooked Dragon Goby',stackable:false,heal:20,draw(c,x,y,s){_cf(c,x,y,s,'#400810')} };
ITEMS.RAW_BARRACUDA    = { id:'raw_barracuda',    name:'Raw Barracuda',    stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#508098','#304860')} };
ITEMS.COOKED_BARRACUDA = { id:'cooked_barracuda', name:'Cooked Barracuda', stackable:false, heal:9,  draw(c,x,y,s){_cf(c,x,y,s,'#304860')} };
ITEMS.RAW_GIANT_SQUID  = { id:'raw_giant_squid',  name:'Raw Giant Squid',  stackable:false, draw(c,x,y,s){_rj(c,x,y,s,'#C03078','#F060A8')} };
ITEMS.COOKED_GIANT_SQUID={ id:'cooked_giant_squid',name:'Cooked Giant Squid',stackable:false,heal:22,draw(c,x,y,s){_cf(c,x,y,s,'#802050')} };
ITEMS.RAW_CAVE_FISH    = { id:'raw_cave_fish',    name:'Raw Cave Fish',    stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#D0C8B8','#A8A090')} };
ITEMS.COOKED_CAVE_FISH = { id:'cooked_cave_fish', name:'Cooked Cave Fish', stackable:false, heal:4,  draw(c,x,y,s){_cf(c,x,y,s,'#908870')} };
ITEMS.RAW_BLIND_CRAYFISH={ id:'raw_blind_crayfish',name:'Raw Blind Crayfish',stackable:false,draw(c,x,y,s){_rf(c,x,y,s,'#D8A880','#B07850')} };
ITEMS.COOKED_BLIND_CRAYFISH={ id:'cooked_blind_crayfish',name:'Cooked Blind Crayfish',stackable:false,heal:7,draw(c,x,y,s){_cf(c,x,y,s,'#906040')} };
ITEMS.RAW_GLOWJELLY    = { id:'raw_glowjelly',    name:'Raw Glowjelly',    stackable:false, draw(c,x,y,s){_rj(c,x,y,s,'#4060D0','#80A0FF')} };
ITEMS.COOKED_GLOWJELLY = { id:'cooked_glowjelly', name:'Cooked Glowjelly', stackable:false, heal:7,  draw(c,x,y,s){_cf(c,x,y,s,'#304090')} };
ITEMS.RAW_CRYSTAL_FISH = { id:'raw_crystal_fish', name:'Raw Crystal Fish', stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#90D0E8','#40A8C8')} };
ITEMS.COOKED_CRYSTAL_FISH={ id:'cooked_crystal_fish',name:'Cooked Crystal Fish',stackable:false,heal:14,draw(c,x,y,s){_cf(c,x,y,s,'#308098')} };
ITEMS.RAW_ABYSSAL_EEL  = { id:'raw_abyssal_eel',  name:'Raw Abyssal Eel',  stackable:false, draw(c,x,y,s){_re(c,x,y,s,'#101820')} };
ITEMS.COOKED_ABYSSAL_EEL={ id:'cooked_abyssal_eel',name:'Cooked Abyssal Eel',stackable:false,heal:17,draw(c,x,y,s){_ce(c,x,y,s,'#101820')} };

/* ── New biome fish (added by Agent 3) ──────────────── */
ITEMS.RAW_BOG_EEL       = { id:'raw_bog_eel',       name:'Raw Bog Eel',              stackable:false, draw(c,x,y,s){_re(c,x,y,s,'#4a6838')} };
ITEMS.COOKED_BOG_EEL    = { id:'cooked_bog_eel',    name:'Cooked Bog Eel',           stackable:false, heal:7,  draw(c,x,y,s){_ce(c,x,y,s,'#2e4820')} };
ITEMS.RAW_SAND_GOBY     = { id:'raw_sand_goby',     name:'Raw Sand Goby',            stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#d8b870','#b09050')} };
ITEMS.COOKED_SAND_GOBY  = { id:'cooked_sand_goby',  name:'Cooked Sand Goby',         stackable:false, heal:4,  draw(c,x,y,s){_cf(c,x,y,s,'#906840')} };
ITEMS.RAW_SHADOWFIN     = { id:'raw_shadowfin',     name:'Raw Shadowfin',            stackable:false, draw(c,x,y,s){_rf(c,x,y,s,'#1e1e30','#0e0e20')} };
ITEMS.COOKED_SHADOWFIN  = { id:'cooked_shadowfin',  name:'Cooked Shadowfin',         stackable:false, heal:16, draw(c,x,y,s){_cf(c,x,y,s,'#28283a')} };

/* ── Butcher meats ───────────────────────────────────── */
function _rawMeat(ctx, x, y, s, col) {
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x+s*0.2,y+s*0.3,s*0.6,s*0.4);
  ctx.fillStyle = col;       ctx.fillRect(x+s*0.25,y+s*0.33,s*0.5,s*0.34);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x+s*0.3,y+s*0.38,s*0.15,s*0.1);
}
function _cookedMeat(ctx, x, y, s, col) {
  ctx.fillStyle = '#5a3010'; ctx.fillRect(x+s*0.2,y+s*0.3,s*0.6,s*0.4);
  ctx.fillStyle = col;       ctx.fillRect(x+s*0.25,y+s*0.33,s*0.5,s*0.34);
  ctx.fillStyle = '#3a1a00';
  ctx.fillRect(x+s*0.3,y+s*0.37,s*0.08,s*0.04);
  ctx.fillRect(x+s*0.5,y+s*0.42,s*0.08,s*0.04);
}
ITEMS.RAW_BEEF      = { id:'raw_beef',       name:'Raw Beef',       stackable:false, draw(c,x,y,s){ _rawMeat(c,x,y,s,'#d35f5f') } };
ITEMS.COOKED_BEEF   = { id:'cooked_beef',    name:'Cooked Beef',    stackable:false, heal:8,  draw(c,x,y,s){ _cookedMeat(c,x,y,s,'#8b4513') } };
ITEMS.RAW_CHICKEN   = { id:'raw_chicken',    name:'Raw Chicken',    stackable:false, draw(c,x,y,s){ _rawMeat(c,x,y,s,'#f4d4a0') } };
ITEMS.COOKED_CHICKEN= { id:'cooked_chicken', name:'Cooked Chicken', stackable:false, heal:6,  draw(c,x,y,s){ _cookedMeat(c,x,y,s,'#c8860a') } };
ITEMS.RAW_PORK      = { id:'raw_pork',       name:'Raw Pork',       stackable:false, draw(c,x,y,s){ _rawMeat(c,x,y,s,'#e8a090') } };
ITEMS.COOKED_PORK   = { id:'cooked_pork',    name:'Cooked Pork',    stackable:false, heal:7,  draw(c,x,y,s){ _cookedMeat(c,x,y,s,'#a0522d') } };
ITEMS.RAW_LAMB      = { id:'raw_lamb',       name:'Raw Lamb',       stackable:false, draw(c,x,y,s){ _rawMeat(c,x,y,s,'#cc8888') } };
ITEMS.COOKED_LAMB   = { id:'cooked_lamb',    name:'Cooked Lamb',    stackable:false, heal:9,  draw(c,x,y,s){ _cookedMeat(c,x,y,s,'#7a3b1e') } };
ITEMS.RAW_VENISON   = { id:'raw_venison',    name:'Raw Venison',    stackable:false, draw(c,x,y,s){ _rawMeat(c,x,y,s,'#8b2222') } };
ITEMS.COOKED_VENISON= { id:'cooked_venison', name:'Cooked Venison', stackable:false, heal:12, draw(c,x,y,s){ _cookedMeat(c,x,y,s,'#5c1f1f') } };
ITEMS.BURNT_MEAT    = { id:'burnt_meat',     name:'Burnt Meat',     stackable:true,  draw(c,x,y,s){ c.fillStyle='#1a1a1a'; c.fillRect(x+s*0.2,y+s*0.3,s*0.6,s*0.4); c.fillStyle='#333'; c.fillRect(x+s*0.25,y+s*0.35,s*0.5,s*0.3); } };

/** Cooking recipes: raw item → { cooked, burnt, burnChance } */
export const COOK_RECIPES = {
  [ITEMS.RAW_SHRIMP.id]:       { cooked: ITEMS.COOKED_SHRIMP,       burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_SARDINE.id]:      { cooked: ITEMS.COOKED_SARDINE,      burnt: ITEMS.BURNT_FISH, burnChance: 0.38 },
  [ITEMS.RAW_HERRING.id]:      { cooked: ITEMS.COOKED_HERRING,      burnt: ITEMS.BURNT_FISH, burnChance: 0.35 },
  [ITEMS.RAW_TROUT.id]:        { cooked: ITEMS.COOKED_TROUT,        burnt: ITEMS.BURNT_FISH, burnChance: 0.40 },
  [ITEMS.RAW_SALMON.id]:       { cooked: ITEMS.COOKED_SALMON,       burnt: ITEMS.BURNT_FISH, burnChance: 0.45 },
  [ITEMS.RAW_TUNA.id]:         { cooked: ITEMS.COOKED_TUNA,         burnt: ITEMS.BURNT_FISH, burnChance: 0.25 },
  [ITEMS.RAW_LOBSTER.id]:      { cooked: ITEMS.COOKED_LOBSTER,      burnt: ITEMS.BURNT_FISH, burnChance: 0.50 },
  [ITEMS.RAW_SWORDFISH.id]:    { cooked: ITEMS.COOKED_SWORDFISH,    burnt: ITEMS.BURNT_FISH, burnChance: 0.20 },
  [ITEMS.RAW_SHARK.id]:        { cooked: ITEMS.COOKED_SHARK,        burnt: ITEMS.BURNT_FISH, burnChance: 0.15 },
  // New fish
  [ITEMS.RAW_GUDGEON.id]:      { cooked: ITEMS.COOKED_GUDGEON,      burnt: ITEMS.BURNT_FISH, burnChance: 0.28 },
  [ITEMS.RAW_CARP.id]:         { cooked: ITEMS.COOKED_CARP,         burnt: ITEMS.BURNT_FISH, burnChance: 0.32 },
  [ITEMS.RAW_PERCH.id]:        { cooked: ITEMS.COOKED_PERCH,        burnt: ITEMS.BURNT_FISH, burnChance: 0.33 },
  [ITEMS.RAW_BASS.id]:         { cooked: ITEMS.COOKED_BASS,         burnt: ITEMS.BURNT_FISH, burnChance: 0.36 },
  [ITEMS.RAW_PIKE.id]:         { cooked: ITEMS.COOKED_PIKE,         burnt: ITEMS.BURNT_FISH, burnChance: 0.38 },
  [ITEMS.RAW_ICE_FISH.id]:     { cooked: ITEMS.COOKED_ICE_FISH,     burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_WALLEYE.id]:      { cooked: ITEMS.COOKED_WALLEYE,      burnt: ITEMS.BURNT_FISH, burnChance: 0.35 },
  [ITEMS.RAW_ARCTIC_CHAR.id]:  { cooked: ITEMS.COOKED_ARCTIC_CHAR,  burnt: ITEMS.BURNT_FISH, burnChance: 0.40 },
  [ITEMS.RAW_SNOWFLAKE_EEL.id]:{ cooked: ITEMS.COOKED_SNOWFLAKE_EEL,burnt: ITEMS.BURNT_FISH, burnChance: 0.28 },
  [ITEMS.RAW_GLACIERFISH.id]:  { cooked: ITEMS.COOKED_GLACIERFISH,  burnt: ITEMS.BURNT_FISH, burnChance: 0.18 },
  [ITEMS.RAW_MUDSKIPPER.id]:   { cooked: ITEMS.COOKED_MUDSKIPPER,   burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_SWAMP_EEL.id]:    { cooked: ITEMS.COOKED_SWAMP_EEL,    burnt: ITEMS.BURNT_FISH, burnChance: 0.32 },
  [ITEMS.RAW_SLIMEJACK.id]:    { cooked: ITEMS.COOKED_SLIMEJACK,    burnt: ITEMS.BURNT_FISH, burnChance: 0.22 },
  [ITEMS.RAW_MUTANT_CARP.id]:  { cooked: ITEMS.COOKED_MUTANT_CARP,  burnt: ITEMS.BURNT_FISH, burnChance: 0.20 },
  [ITEMS.RAW_SANDY_GOBY.id]:   { cooked: ITEMS.COOKED_SANDY_GOBY,   burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_PUFFERFISH.id]:   { cooked: ITEMS.COOKED_PUFFERFISH,   burnt: ITEMS.BURNT_FISH, burnChance: 0.35 },
  [ITEMS.RAW_SANDFISH.id]:     { cooked: ITEMS.COOKED_SANDFISH,     burnt: ITEMS.BURNT_FISH, burnChance: 0.22 },
  [ITEMS.RAW_LAVA_EEL.id]:     { cooked: ITEMS.COOKED_LAVA_EEL,     burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_MAGMA_CARP.id]:   { cooked: ITEMS.COOKED_MAGMA_CARP,   burnt: ITEMS.BURNT_FISH, burnChance: 0.22 },
  [ITEMS.RAW_DRAGON_GOBY.id]:  { cooked: ITEMS.COOKED_DRAGON_GOBY,  burnt: ITEMS.BURNT_FISH, burnChance: 0.15 },
  [ITEMS.RAW_BARRACUDA.id]:    { cooked: ITEMS.COOKED_BARRACUDA,    burnt: ITEMS.BURNT_FISH, burnChance: 0.28 },
  [ITEMS.RAW_GIANT_SQUID.id]:  { cooked: ITEMS.COOKED_GIANT_SQUID,  burnt: ITEMS.BURNT_FISH, burnChance: 0.12 },
  [ITEMS.RAW_CAVE_FISH.id]:    { cooked: ITEMS.COOKED_CAVE_FISH,    burnt: ITEMS.BURNT_FISH, burnChance: 0.30 },
  [ITEMS.RAW_BLIND_CRAYFISH.id]:{ cooked:ITEMS.COOKED_BLIND_CRAYFISH,burnt:ITEMS.BURNT_FISH, burnChance: 0.35 },
  [ITEMS.RAW_GLOWJELLY.id]:    { cooked: ITEMS.COOKED_GLOWJELLY,    burnt: ITEMS.BURNT_FISH, burnChance: 0.28 },
  [ITEMS.RAW_CRYSTAL_FISH.id]: { cooked: ITEMS.COOKED_CRYSTAL_FISH, burnt: ITEMS.BURNT_FISH, burnChance: 0.20 },
  [ITEMS.RAW_ABYSSAL_EEL.id]:  { cooked: ITEMS.COOKED_ABYSSAL_EEL,  burnt: ITEMS.BURNT_FISH, burnChance: 0.15 },
  // New biome fish (Agent 3)
  [ITEMS.RAW_BOG_EEL.id]:      { cooked: ITEMS.COOKED_BOG_EEL,      burnt: ITEMS.BURNT_FISH, burnChance: 0.32 },
  [ITEMS.RAW_SAND_GOBY.id]:    { cooked: ITEMS.COOKED_SAND_GOBY,    burnt: ITEMS.BURNT_FISH, burnChance: 0.28 },
  [ITEMS.RAW_SHADOWFIN.id]:    { cooked: ITEMS.COOKED_SHADOWFIN,    burnt: ITEMS.BURNT_FISH, burnChance: 0.18 },
  // Meat (items defined above, before this object)
  [ITEMS.RAW_BEEF.id]:         { cooked: ITEMS.COOKED_BEEF,         burnt: ITEMS.BURNT_MEAT, burnChance: 0.35 },
  [ITEMS.RAW_CHICKEN.id]:      { cooked: ITEMS.COOKED_CHICKEN,      burnt: ITEMS.BURNT_MEAT, burnChance: 0.28 },
  [ITEMS.RAW_PORK.id]:         { cooked: ITEMS.COOKED_PORK,         burnt: ITEMS.BURNT_MEAT, burnChance: 0.32 },
  [ITEMS.RAW_LAMB.id]:         { cooked: ITEMS.COOKED_LAMB,         burnt: ITEMS.BURNT_MEAT, burnChance: 0.30 },
  [ITEMS.RAW_VENISON.id]:      { cooked: ITEMS.COOKED_VENISON,      burnt: ITEMS.BURNT_MEAT, burnChance: 0.25 },
}; // end COOK_RECIPES

/* ── Weapons ─────────────────────────────────────────── */
ITEMS.BRONZE_SWORD = {
  id: 'bronze_sword', name: 'Bronze Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 5, strengthBonus: 6, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3010'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35); // grip
    ctx.fillStyle = '#a06020'; ctx.fillRect(x+s*.28, y+s*.48, s*.26, s*.1);  // guard
    ctx.fillStyle = '#cd7f32';
    ctx.fillRect(x+s*.38, y+s*.12, s*.1,  s*.36);                            // blade near→guard
    ctx.fillRect(x+s*.40, y+s*.08, s*.09, s*.06);                            // blade mid
    ctx.fillRect(x+s*.42, y+s*.04, s*.08, s*.06);                            // tip
    ctx.fillStyle = 'rgba(255,200,80,0.4)';
    ctx.fillRect(x+s*.38, y+s*.12, s*.04, s*.36);                            // shine
  },
};
ITEMS.IRON_SWORD = {
  id: 'iron_sword', name: 'Iron Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 12, strengthBonus: 13, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x+s*.26, y+s*.48, s*.3,  s*.1);
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(x+s*.37, y+s*.10, s*.12, s*.38);
    ctx.fillRect(x+s*.39, y+s*.05, s*.10, s*.07);
    ctx.fillRect(x+s*.41, y+s*.01, s*.08, s*.06);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(x+s*.37, y+s*.10, s*.04, s*.38);
  },
};
ITEMS.STEEL_SWORD = {
  id: 'steel_sword', name: 'Steel Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 22, strengthBonus: 24, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x+s*.25, y+s*.48, s*.32, s*.1);
    ctx.fillStyle = '#9aaabb';
    ctx.fillRect(x+s*.37, y+s*.08, s*.13, s*.40);
    ctx.fillRect(x+s*.39, y+s*.04, s*.11, s*.06);
    ctx.fillRect(x+s*.41, y+s*.00, s*.09, s*.06);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x+s*.37, y+s*.08, s*.04, s*.40);
  },
};
ITEMS.MITHRIL_SWORD = {
  id: 'mithril_sword', name: 'Mithril Sword', stackable: false, equipSlot: 'weapon',
  stats: { attackBonus: 42, strengthBonus: 46, defenceBonus: 0 },
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a2a6a'; ctx.fillRect(x+s*.35, y+s*.55, s*.12, s*.35);
    ctx.fillStyle = '#5050aa'; ctx.fillRect(x+s*.24, y+s*.48, s*.34, s*.1);
    ctx.fillStyle = '#7070cc';
    ctx.fillRect(x+s*.37, y+s*.06, s*.13, s*.42);
    ctx.fillRect(x+s*.39, y+s*.02, s*.11, s*.06);
    ctx.fillRect(x+s*.41, y-s*.02, s*.09, s*.06);
    ctx.fillStyle = 'rgba(160,160,255,0.5)';
    ctx.fillRect(x+s*.37, y+s*.06, s*.04, s*.42);
    // Glow
    ctx.fillStyle = 'rgba(100,100,255,0.15)';
    ctx.fillRect(x+s*.3, y+s*.0, s*.22, s*.55);
  },
};

/* ── Smelted bars ────────────────────────────────────── */
ITEMS.BAR_BRONZE = {
  id: 'bar_bronze', name: 'Bronze Bar', stackable: true,
  description: 'A bar of bronze, poured fresh from the crucible.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#8b5020'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#cd7f32'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#e8a060'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#7a4018'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_IRON = {
  id: 'bar_iron', name: 'Iron Bar', stackable: true,
  description: 'A rough iron bar ready for the anvil.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#b0b0b0'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_STEEL = {
  id: 'bar_steel', name: 'Steel Bar', stackable: true,
  description: 'A bar of steel — iron hardened with coal.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a5a6a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#7a9aaa'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#a0c0cc'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#3a4a58'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_SILVER = {
  id: 'bar_silver', name: 'Silver Bar', stackable: true,
  description: 'A lustrous silver bar. Reflects candlelight beautifully.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#808088'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#c0c0c8'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#707078'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_GOLD = {
  id: 'bar_gold', name: 'Gold Bar', stackable: true,
  description: 'A gleaming gold bar. Heavier than it looks.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#9a7000'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#f1c40f'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#f9e04b'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#806000'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_MITHRIL = {
  id: 'bar_mithril', name: 'Mithril Bar', stackable: true,
  description: 'A rare mithril bar, light and cold to the touch.',
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
  description: 'Dense tungsten, forged at extreme temperature.',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#28283a'; ctx.fillRect(x+s*.15, y+s*.52, s*.7, s*.22);
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.16);
    ctx.fillStyle = '#6868a0'; ctx.fillRect(x+s*.15, y+s*.38, s*.7, s*.05);
    ctx.fillStyle = '#20202a'; ctx.fillRect(x+s*.82, y+s*.38, s*.03, s*.36);
  },
};
ITEMS.BAR_OBSIDIAN = {
  id: 'bar_obsidian', name: 'Obsidian Ingot', stackable: true,
  description: 'A black glass ingot. Edges remain razor sharp.',
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
  description: 'A pale ingot humming with lunar energy.',
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
    ctx.fillRect(x+s*.36, y+s*.06, s*.16, s*.42);
    ctx.fillRect(x+s*.38, y+s*.01, s*.12, s*.07);
    ctx.fillRect(x+s*.40, -s*.02, s*.10, s*.05);
    ctx.fillStyle = 'rgba(150,150,220,0.35)'; ctx.fillRect(x+s*.36, y+s*.06, s*.05, s*.42);
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
ITEMS.MITHRIL_AXE = {
  id: 'mithril_axe', name: 'Mithril Axe', stackable: false, toolType: 'axe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.2, y+s*.3, s*.15, s*.55);
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.35, y+s*.12, s*.37, s*.33);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.55, y+s*.07, s*.22, s*.43);
    ctx.fillStyle = 'rgba(140,140,255,0.3)'; ctx.fillRect(x+s*.35, y+s*.12, s*.37, s*.06);
  },
};
ITEMS.TUNGSTEN_AXE = {
  id: 'tungsten_axe', name: 'Tungsten Axe', stackable: false, toolType: 'axe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.2, y+s*.3, s*.15, s*.55);
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.35, y+s*.11, s*.37, s*.35);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.55, y+s*.06, s*.22, s*.44);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.35, y+s*.11, s*.37, s*.06);
    ctx.fillStyle = 'rgba(80,80,180,0.2)'; ctx.fillRect(x+s*.35, y+s*.11, s*.37, s*.35);
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
ITEMS.MITHRIL_PICKAXE = {
  id: 'mithril_pickaxe', name: 'Mithril Pickaxe', stackable: false, toolType: 'pickaxe',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x+s*.15, y+s*.25, s*.15, s*.6);
    ctx.fillStyle = '#5a5a9a';
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.3); ctx.lineTo(x+s*.7, y+s*.14); ctx.lineTo(x+s*.75, y+s*.3); ctx.lineTo(x+s*.3, y+s*.45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3a7a';
    ctx.beginPath(); ctx.moveTo(x+s*.68, y+s*.15); ctx.lineTo(x+s*.89, y+s*.21); ctx.lineTo(x+s*.73, y+s*.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(140,140,255,0.25)'; ctx.fillRect(x+s*.3, y+s*.25, s*.46, s*.2);
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
ITEMS.STEEL_LEGS = {
  id: 'steel_legs', name: 'Steel Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a9aaa'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
    ctx.fillStyle = 'rgba(180,220,240,0.2)'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.1);
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
ITEMS.TUNGSTEN_LEGS = {
  id: 'tungsten_legs', name: 'Tungsten Legs', stackable: false, equipSlot: 'leggings',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.12, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.54, y+s*.52, s*.34, s*.42);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x+s*.44, y+s*.05, s*.12, s*.55);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.1);
    ctx.fillStyle = 'rgba(80,80,180,0.18)'; ctx.fillRect(x+s*.12, y+s*.05, s*.76, s*.55);
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
ITEMS.MITHRIL_GAUNTLETS = {
  id: 'mithril_gauntlets', name: 'Mithril Gauntlets', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.1,  y+s*.18, s*.8,  s*.6);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.1,  y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.28, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.46, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.64, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = 'rgba(140,140,255,0.3)'; ctx.fillRect(x+s*.14, y+s*.2, s*.26, s*.1);
  },
};
ITEMS.TUNGSTEN_GAUNTLETS = {
  id: 'tungsten_gauntlets', name: 'Tungsten Gauntlets', stackable: false, equipSlot: 'gloves',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.1,  y+s*.18, s*.8,  s*.6);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.1,  y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.28, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.46, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.64, y+s*.66, s*.15, s*.2);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.14, y+s*.2, s*.26, s*.1);
    ctx.fillStyle = 'rgba(80,80,180,0.18)'; ctx.fillRect(x+s*.1, y+s*.18, s*.8, s*.6);
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
ITEMS.MITHRIL_BOOTS = {
  id: 'mithril_boots', name: 'Mithril Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a5a9a'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#3a3a7a'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(140,140,255,0.3)'; ctx.fillRect(x+s*.12, y+s*.3, s*.28, s*.12);
  },
};
ITEMS.TUNGSTEN_BOOTS = {
  id: 'tungsten_boots', name: 'Tungsten Boots', stackable: false, equipSlot: 'boots',
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a6a'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
    ctx.fillStyle = '#28284a'; ctx.fillRect(x+s*.08, y+s*.68, s*.84, s*.18);
    ctx.fillStyle = 'rgba(120,120,200,0.35)'; ctx.fillRect(x+s*.12, y+s*.3, s*.28, s*.12);
    ctx.fillStyle = 'rgba(80,80,180,0.18)'; ctx.fillRect(x+s*.08, y+s*.28, s*.84, s*.48);
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

/* ── Farming seeds ───────────────────────────────────── */

ITEMS.POTATO_SEED = {
  id: 'potato_seed', name: 'Potato Seed', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#a08050';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.16, s*.14, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c8a060';
    ctx.beginPath(); ctx.ellipse(x+s*.47, y+s*.48, s*.08, s*.07, -0.3, 0, Math.PI*2); ctx.fill();
  },
};
ITEMS.BERRY_SEED = {
  id: 'berry_seed', name: 'Berry Seed', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#7a2a6a';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.15, s*.13, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#b04090';
    ctx.beginPath(); ctx.ellipse(x+s*.46, y+s*.47, s*.07, s*.06, -0.3, 0, Math.PI*2); ctx.fill();
  },
};
ITEMS.BERRY_BUSH_SAPLING = {
  id: 'berry_bush_sapling', name: 'Berry Bush Sapling', stackable: true,
  draw(ctx, x, y, s) {
    // Small brown stem
    ctx.fillStyle = '#6b4520';
    ctx.fillRect(x + s * .46, y + s * .55, s * .08, s * .3);
    // Small green bush top
    ctx.fillStyle = '#3d7a34';
    ctx.beginPath(); ctx.arc(x + s * .5, y + s * .45, s * .22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5aaa4a';
    ctx.beginPath(); ctx.arc(x + s * .45, y + s * .4, s * .12, 0, Math.PI * 2); ctx.fill();
    // Tiny berry dot
    ctx.fillStyle = '#c0203a';
    ctx.beginPath(); ctx.arc(x + s * .55, y + s * .5, s * .06, 0, Math.PI * 2); ctx.fill();
  },
};
ITEMS.HERB_SEED = {
  id: 'herb_seed', name: 'Herb Seed', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a6a2a';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.54, s*.14, s*.12, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a9a40';
    ctx.beginPath(); ctx.ellipse(x+s*.47, y+s*.49, s*.07, s*.05, -0.4, 0, Math.PI*2); ctx.fill();
  },
};
ITEMS.FLAX_SEED = {
  id: 'flax_seed', name: 'Flax Seed', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#5a7a9a';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.12, s*.16, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7aaacc';
    ctx.beginPath(); ctx.ellipse(x+s*.47, y+s*.47, s*.06, s*.07, 0.1, 0, Math.PI*2); ctx.fill();
  },
};
ITEMS.MAGIC_SEED = {
  id: 'magic_seed', name: 'Magic Seed', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a1a6a';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.16, s*.14, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(140,80,255,0.8)';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.5, s*.10, s*.09, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(200,160,255,0.6)';
    ctx.beginPath(); ctx.ellipse(x+s*.47, y+s*.46, s*.05, s*.04, -0.3, 0, Math.PI*2); ctx.fill();
  },
};

/* ── Farming harvest ─────────────────────────────────── */

ITEMS.POTATO = {
  id: 'potato', name: 'Potato', stackable: true, heal: 4,
  description: 'A hearty potato', value: 5, cookable: true, farmable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#c8a050';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.55, s*.26, s*.22, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e0bc70';
    ctx.beginPath(); ctx.ellipse(x+s*.45, y+s*.48, s*.13, s*.10, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2a6a1a'; ctx.fillRect(x+s*.48, y+s*.25, s*.04, s*.14);
  },
};
ITEMS.BERRIES = {
  id: 'berries', name: 'Berries', stackable: true, heal: 3,
  draw(ctx, x, y, s) {
    const pts = [[.38,.58],[.56,.52],[.44,.38],[.62,.44],[.50,.65]];
    ctx.fillStyle = '#2a0a1a';
    for (const [cx, cy] of pts) { ctx.beginPath(); ctx.arc(x+s*cx, y+s*cy, s*.09, 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#c02060';
    for (const [cx, cy] of pts) { ctx.beginPath(); ctx.arc(x+s*cx, y+s*cy, s*.08, 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,120,160,0.5)';
    for (const [cx, cy] of pts) { ctx.beginPath(); ctx.arc(x+s*(cx-.02), y+s*(cy-.02), s*.03, 0, Math.PI*2); ctx.fill(); }
  },
};
ITEMS.HERB = {
  id: 'herb', name: 'Grimy Herb', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#1a4a18';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.75);
    ctx.bezierCurveTo(x+s*.2, y+s*.5, x+s*.35, y+s*.25, x+s*.5, y+s*.2);
    ctx.bezierCurveTo(x+s*.65, y+s*.25, x+s*.8, y+s*.5, x+s*.5, y+s*.75);
    ctx.fill();
    ctx.fillStyle = '#2d7a28';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.7);
    ctx.bezierCurveTo(x+s*.25, y+s*.48, x+s*.38, y+s*.28, x+s*.5, y+s*.25);
    ctx.bezierCurveTo(x+s*.62, y+s*.28, x+s*.75, y+s*.48, x+s*.5, y+s*.7);
    ctx.fill();
    ctx.strokeStyle = '#1a4a18'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.25); ctx.lineTo(x+s*.5, y+s*.75); ctx.stroke();
  },
};
ITEMS.FLAX = {
  id: 'flax', name: 'Flax', stackable: true,
  draw(ctx, x, y, s) {
    ctx.strokeStyle = '#7ab0d0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.8); ctx.lineTo(x+s*.5, y+s*.15); ctx.stroke();
    ctx.fillStyle = '#5090b8';
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.18, s*.08, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#4a80a8'; ctx.lineWidth = 1;
    for (const [ang, len] of [[-0.4,0.14],[0.4,0.14],[0,0.12]]) {
      ctx.beginPath();
      ctx.moveTo(x+s*.5, y+s*.45);
      ctx.lineTo(x+s*.5 + Math.sin(ang)*s*len, y+s*.45 - Math.cos(ang)*s*len);
      ctx.stroke();
    }
  },
};
ITEMS.MAGIC_HERB = {
  id: 'magic_herb', name: 'Magic Herb', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a0a4a';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.75);
    ctx.bezierCurveTo(x+s*.2, y+s*.5, x+s*.35, y+s*.22, x+s*.5, y+s*.18);
    ctx.bezierCurveTo(x+s*.65, y+s*.22, x+s*.8, y+s*.5, x+s*.5, y+s*.75);
    ctx.fill();
    ctx.fillStyle = '#6a20b0';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.70);
    ctx.bezierCurveTo(x+s*.26, y+s*.48, x+s*.38, y+s*.25, x+s*.5, y+s*.22);
    ctx.bezierCurveTo(x+s*.62, y+s*.25, x+s*.74, y+s*.48, x+s*.5, y+s*.70);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,100,255,0.5)';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.45, s*.06, s*.18, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2a0a4a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.22); ctx.lineTo(x+s*.5, y+s*.70); ctx.stroke();
  },
};

ITEMS.MUSHROOM = {
  id: 'mushroom', name: 'Mushroom', stackable: true, heal: 4,
  draw(ctx, x, y, s) {
    // Two mushrooms side by side
    for (let i = 0; i < 2; i++) {
      const ox = x + s * (0.18 + i * 0.38);
      // Stem
      ctx.fillStyle = '#d4c8a0';
      ctx.fillRect(ox + s * 0.08, y + s * 0.58, s * 0.14, s * 0.26);
      // Cap shadow
      ctx.fillStyle = '#7a3a10';
      ctx.beginPath();
      ctx.ellipse(ox + s * 0.15, y + s * 0.52, s * 0.18, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cap
      ctx.fillStyle = i === 0 ? '#c05a18' : '#a04010';
      ctx.beginPath();
      ctx.ellipse(ox + s * 0.15, y + s * 0.48, s * 0.17, s * 0.16, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Spots
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.arc(ox + s * 0.10, y + s * 0.40, s * 0.03, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + s * 0.20, y + s * 0.36, s * 0.025, 0, Math.PI * 2); ctx.fill();
    }
  },
};

ITEMS.REEDS = {
  id: 'reeds', name: 'Reeds', stackable: true,
  draw(ctx, x, y, s) {
    const stalks = 6;
    for (let i = 0; i < stalks; i++) {
      const sx = x + s * (0.12 + i * 0.13);
      const lean = (i % 2 === 0 ? 1 : -1) * s * 0.03;
      // Stalk
      ctx.strokeStyle = i < 3 ? '#7a9a40' : '#6a8a30';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(sx, y + s * 0.88);
      ctx.quadraticCurveTo(sx + lean, y + s * 0.5, sx + lean * 2, y + s * 0.18);
      ctx.stroke();
      // Seed head (brown oval at top)
      ctx.fillStyle = i % 3 === 0 ? '#8b6030' : '#7a5025';
      ctx.beginPath();
      ctx.ellipse(sx + lean * 2, y + s * 0.14, s * 0.04, s * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

ITEMS.SNOWBERRIES = {
  id: 'snowberries', name: 'Snowberries', stackable: true, heal: 6,
  draw(ctx, x, y, s) {
    // Branch
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.85); ctx.lineTo(x+s*.5, y+s*.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.5); ctx.lineTo(x+s*.2, y+s*.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.45); ctx.lineTo(x+s*.78, y+s*.28); ctx.stroke();
    // White berries
    const pos = [[x+s*.18,y+s*.26],[x+s*.78,y+s*.24],[x+s*.55,y+s*.30],[x+s*.42,y+s*.22]];
    for (const [bx,by] of pos) {
      ctx.fillStyle = '#e8f0f8';
      ctx.beginPath(); ctx.arc(bx, by, s*.055, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      ctx.beginPath(); ctx.arc(bx-s*.015, by-s*.015, s*.022, 0, Math.PI*2); ctx.fill();
    }
  },
};

ITEMS.SULFUR = {
  id: 'sulfur', name: 'Sulfur', stackable: true,
  draw(ctx, x, y, s) {
    // Crystal cluster — jagged yellow chunks
    ctx.fillStyle = '#c8a800';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.18); ctx.lineTo(x+s*.68, y+s*.48);
    ctx.lineTo(x+s*.58, y+s*.72); ctx.lineTo(x+s*.38, y+s*.72);
    ctx.lineTo(x+s*.28, y+s*.48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8c800';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.2); ctx.lineTo(x+s*.62, y+s*.46);
    ctx.lineTo(x+s*.5, y+s*.68); ctx.lineTo(x+s*.36, y+s*.46);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8e030';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.24); ctx.lineTo(x+s*.56, y+s*.44);
    ctx.lineTo(x+s*.5, y+s*.6); ctx.lineTo(x+s*.43, y+s*.44);
    ctx.closePath(); ctx.fill();
    // Highlight facet
    ctx.fillStyle = 'rgba(255,255,200,0.4)';
    ctx.beginPath(); ctx.ellipse(x+s*.46, y+s*.35, s*.04, s*.1, -0.4, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.THORN_VINE = {
  id: 'thorn_vine', name: 'Thorn Vine', stackable: true,
  draw(ctx, x, y, s) {
    // Curved vine stem
    ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x+s*.15, y+s*.8);
    ctx.bezierCurveTo(x+s*.3, y+s*.5, x+s*.65, y+s*.6, x+s*.82, y+s*.25);
    ctx.stroke();
    // Thorns along the vine
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1;
    const thorns = [[.22,.68,.15,.58],[.38,.56,.32,.44],[.55,.6,.62,.5],[.7,.42,.78,.35]];
    for (const [x1,y1,x2,y2] of thorns) {
      ctx.beginPath();
      ctx.moveTo(x+s*x1, y+s*y1); ctx.lineTo(x+s*x2, y+s*y2);
      ctx.stroke();
    }
    // Small dark leaves
    ctx.fillStyle = '#2a3a10';
    ctx.beginPath(); ctx.ellipse(x+s*.3, y+s*.55, s*.07, s*.04, 0.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+s*.62, y+s*.48, s*.07, s*.04, -0.5, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.CACTUS_BLOOM = {
  id: 'cactus_bloom', name: 'Cactus Bloom', stackable: true, heal: 8,
  draw(ctx, x, y, s) {
    // Succulent base leaves
    ctx.fillStyle = '#4a7830';
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(x+s*.5+Math.cos(a)*s*.18, y+s*.62+Math.sin(a)*s*.1, s*.1, s*.06, a, 0, Math.PI*2);
      ctx.fill();
    }
    // Flower petals (pink/magenta)
    ctx.fillStyle = '#e0407a';
    for (let i = 0; i < 5; i++) {
      const a = (i/5)*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(x+s*.5+Math.cos(a)*s*.16, y+s*.4+Math.sin(a)*s*.14, s*.1, s*.06, a, 0, Math.PI*2);
      ctx.fill();
    }
    // Centre
    ctx.fillStyle = '#f8e030';
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.4, s*.07, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fffa80';
    ctx.beginPath(); ctx.arc(x+s*.47, y+s*.37, s*.03, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.ANCIENT_BONE = {
  id: 'ancient_bone', name: 'Ancient Bone', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#d4c8a0';
    ctx.fillRect(x+s*.3, y+s*.4, s*.4, s*.12);
    ctx.fillRect(x+s*.45, y+s*.25, s*.1, s*.5);
    ctx.fillStyle = '#c8ba8a';
    ctx.beginPath(); ctx.arc(x+s*.3, y+s*.4, s*.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+s*.7, y+s*.4, s*.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+s*.45, y+s*.25, s*.07, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+s*.55, y+s*.75, s*.07, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.SILK_THREAD = {
  id: 'silk_thread', name: 'Silk Thread', stackable: true,
  draw(ctx, x, y, s) {
    ctx.strokeStyle = '#e8e0d8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x+s*.2+i*s*.15, y+s*.2);
      ctx.bezierCurveTo(x+s*.1+i*s*.15, y+s*.5, x+s*.35+i*s*.15, y+s*.5, x+s*.25+i*s*.15, y+s*.8);
      ctx.stroke();
    }
    ctx.fillStyle = '#c8c0b8';
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.12, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.STONE_CORE = {
  id: 'stone_core', name: 'Stone Core', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#606870';
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#808a94';
    ctx.beginPath(); ctx.arc(x+s*.44, y+s*.44, s*.18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#505860';
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(160,180,200,0.5)';
    ctx.beginPath(); ctx.arc(x+s*.41, y+s*.38, s*.06, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.DRAGON_SCALE = {
  id: 'dragon_scale', name: 'Dragon Scale', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.15);
    ctx.bezierCurveTo(x+s*.75, y+s*.3, x+s*.8, y+s*.7, x+s*.5, y+s*.85);
    ctx.bezierCurveTo(x+s*.2, y+s*.7, x+s*.25, y+s*.3, x+s*.5, y+s*.15);
    ctx.fill();
    ctx.fillStyle = '#2a7a2a';
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.22);
    ctx.bezierCurveTo(x+s*.68, y+s*.35, x+s*.72, y+s*.65, x+s*.5, y+s*.78);
    ctx.bezierCurveTo(x+s*.28, y+s*.65, x+s*.32, y+s*.35, x+s*.5, y+s*.22);
    ctx.fill();
    ctx.fillStyle = 'rgba(80,200,80,0.3)';
    ctx.beginPath(); ctx.ellipse(x+s*.45, y+s*.45, s*.07, s*.2, -0.3, 0, Math.PI*2); ctx.fill();
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

// ═══════════════════════════════════════════════════════════════════
//  RAID-EXCLUSIVE ITEMS
//  Added via Object.assign so they don't disturb the main ITEMS block.
// ═══════════════════════════════════════════════════════════════════
Object.assign(ITEMS, {

  // ── Raid currency ────────────────────────────────────────────────
  RAID_TOKEN: {
    id: 'raid_token', name: 'Raid Token', stackable: true,
    draw(ctx, x, y, s) {
      // Octagonal gold coin with a shield emblem
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = s * 0.06;
      ctx.stroke();
      // Inner shield
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x + s * 0.38, y + s * 0.3, s * 0.24, s * 0.28);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x + s * 0.43, y + s * 0.52, s * 0.14, s * 0.08);
    },
  },

  CHAOS_FRAGMENT: {
    id: 'chaos_fragment', name: 'Chaos Fragment', stackable: true,
    draw(ctx, x, y, s) {
      // Purple jagged crystal shard
      ctx.fillStyle = '#6d28d9';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5,  y + s * 0.1);
      ctx.lineTo(x + s * 0.75, y + s * 0.45);
      ctx.lineTo(x + s * 0.62, y + s * 0.55);
      ctx.lineTo(x + s * 0.78, y + s * 0.85);
      ctx.lineTo(x + s * 0.38, y + s * 0.72);
      ctx.lineTo(x + s * 0.22, y + s * 0.88);
      ctx.lineTo(x + s * 0.28, y + s * 0.50);
      ctx.lineTo(x + s * 0.18, y + s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Sparkle highlight
      ctx.fillStyle = '#ddd6fe';
      ctx.fillRect(x + s * 0.45, y + s * 0.15, s * 0.08, s * 0.18);
    },
  },

  // ── Raid weapons ─────────────────────────────────────────────────

  RAID_BLADE: {
    id: 'raid_blade', name: "Raider's Blade", stackable: false, equipSlot: 'weapon',
    draw(ctx, x, y, s) {
      // Purple-tinted balanced sword
      ctx.fillStyle = '#4a2060'; ctx.fillRect(x+s*.36, y+s*.6, s*.12, s*.32); // grip
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x+s*.3,  y+s*.55, s*.24, s*.07); // guard
      ctx.fillStyle = '#7c3aed'; ctx.fillRect(x+s*.4,  y+s*.12, s*.14, s*.46); // blade
      ctx.fillStyle = '#c4b5fd'; ctx.fillRect(x+s*.44, y+s*.12, s*.05, s*.42); // edge highlight
      // Glow tip
      ctx.fillStyle = '#a855f7'; ctx.fillRect(x+s*.4, y+s*.1, s*.14, s*.05);
    },
  },

  VOIDBANE_SWORD: {
    id: 'voidbane_sword', name: 'Voidbane Sword', stackable: false, equipSlot: 'weapon',
    draw(ctx, x, y, s) {
      // Void-black blade with teal edge glow
      ctx.fillStyle = '#2a1a3a'; ctx.fillRect(x+s*.36, y+s*.6, s*.12, s*.32); // grip
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x+s*.28, y+s*.54, s*.28, s*.08); // guard
      ctx.fillStyle = '#0f0a1a'; ctx.fillRect(x+s*.39, y+s*.1,  s*.16, s*.46); // blade
      ctx.fillStyle = '#00ffe0'; ctx.fillRect(x+s*.39, y+s*.1,  s*.03, s*.46); // left glow
      ctx.fillStyle = '#00ffe0'; ctx.fillRect(x+s*.52, y+s*.1,  s*.03, s*.46); // right glow
      ctx.fillStyle = '#00ffe0'; ctx.fillRect(x+s*.39, y+s*.08, s*.16, s*.04); // tip glow
    },
  },

  CHAOS_EDGE: {
    id: 'chaos_edge', name: 'Chaos Edge', stackable: false, equipSlot: 'weapon',
    draw(ctx, x, y, s) {
      // Jagged orange-red chaos blade (fast, high-crit)
      ctx.fillStyle = '#3a1a0a'; ctx.fillRect(x+s*.36, y+s*.62, s*.12, s*.3); // grip
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x+s*.27, y+s*.56, s*.26, s*.07); // guard
      // Jagged blade silhouette
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(x+s*.42, y+s*.58); ctx.lineTo(x+s*.36, y+s*.45);
      ctx.lineTo(x+s*.4,  y+s*.38); ctx.lineTo(x+s*.34, y+s*.26);
      ctx.lineTo(x+s*.42, y+s*.2);  ctx.lineTo(x+s*.5,  y+s*.1);
      ctx.lineTo(x+s*.56, y+s*.22); ctx.lineTo(x+s*.52, y+s*.3);
      ctx.lineTo(x+s*.58, y+s*.42); ctx.lineTo(x+s*.52, y+s*.5);
      ctx.lineTo(x+s*.54, y+s*.58);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fdba74'; ctx.fillRect(x+s*.46, y+s*.1, s*.06, s*.4); // bright edge
    },
  },

  DUNGEON_GREATAXE: {
    id: 'dungeon_greataxe', name: 'Dungeon Greataxe', stackable: false, equipSlot: 'weapon',
    draw(ctx, x, y, s) {
      // Massive dark two-handed axe
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(x+s*.44, y+s*.2, s*.1, s*.7); // haft
      // Large axe head
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.moveTo(x+s*.54, y+s*.2); ctx.lineTo(x+s*.82, y+s*.1);
      ctx.lineTo(x+s*.85, y+s*.45); ctx.lineTo(x+s*.54, y+s*.45);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9ca3af'; // blade highlight
      ctx.fillRect(x+s*.76, y+s*.11, s*.07, s*.32);
      // Back spike
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.moveTo(x+s*.44, y+s*.22); ctx.lineTo(x+s*.22, y+s*.18);
      ctx.lineTo(x+s*.26, y+s*.38); ctx.lineTo(x+s*.44, y+s*.38);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b7280'; ctx.fillRect(x+s*.22, y+s*.22, s*.06, s*.12);
    },
  },

  // ── Raider's Armour Set (EPIC) ───────────────────────────────────

  RAIDERS_HELM: {
    id: 'raiders_helm', name: "Raider's Helm", stackable: false, equipSlot: 'helmet',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4c1d95'; ctx.fillRect(x+s*.2, y+s*.3, s*.6, s*.5); // dome
      ctx.beginPath(); ctx.arc(x+s*.5, y+s*.38, s*.3, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x+s*.2, y+s*.6, s*.6, s*.06); // band
      ctx.fillStyle = '#2d1260'; ctx.fillRect(x+s*.28, y+s*.66, s*.44, s*.18); // face
      ctx.fillStyle = '#c4b5fd'; ctx.fillRect(x+s*.3, y+s*.32, s*.06, s*.2); // left ridge
      ctx.fillRect(x+s*.64, y+s*.32, s*.06, s*.2); // right ridge
      ctx.fillStyle = '#7c3aed'; ctx.fillRect(x+s*.38, y+s*.3, s*.24, s*.06); // crest base
    },
  },

  RAIDERS_PLATE: {
    id: 'raiders_plate', name: "Raider's Plate", stackable: false, equipSlot: 'chestplate',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(x+s*.15, y+s*.2, s*.7, s*.65); // main body
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x+s*.15, y+s*.2, s*.7, s*.06); // top trim
      ctx.fillRect(x+s*.15, y+s*.82, s*.7, s*.04); // bottom trim
      ctx.fillStyle = '#2d1260';
      ctx.fillRect(x+s*.38, y+s*.26, s*.24, s*.54); // chest centre
      ctx.fillStyle = '#c4b5fd';
      ctx.fillRect(x+s*.2, y+s*.28, s*.06, s*.5); // left plate line
      ctx.fillRect(x+s*.74, y+s*.28, s*.06, s*.5); // right plate line
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x+s*.38, y+s*.26, s*.24, s*.06); // chest rune band
    },
  },

  RAIDERS_LEGS: {
    id: 'raiders_legs', name: "Raider's Legs", stackable: false, equipSlot: 'leggings',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.3);  // waistband
      ctx.fillRect(x+s*.2, y+s*.4, s*.26, s*.5); // left leg
      ctx.fillRect(x+s*.54, y+s*.4, s*.26, s*.5); // right leg
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.05);  // top trim
      ctx.fillRect(x+s*.2, y+s*.38, s*.6, s*.04); // mid trim
      ctx.fillStyle = '#c4b5fd';
      ctx.fillRect(x+s*.25, y+s*.44, s*.06, s*.4); // left ridge
      ctx.fillRect(x+s*.69, y+s*.44, s*.06, s*.4); // right ridge
    },
  },

  RAIDERS_GAUNTLETS: {
    id: 'raiders_gauntlets', name: "Raider's Gauntlets", stackable: false, equipSlot: 'gloves',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(x+s*.2, y+s*.25, s*.6, s*.55);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x+s*.2, y+s*.25, s*.6, s*.05); // cuff band
      ctx.fillRect(x+s*.2, y+s*.77, s*.6, s*.04); // knuckle band
      ctx.fillStyle = '#c4b5fd';
      ctx.fillRect(x+s*.25, y+s*.32, s*.1, s*.4);  // knuckle plate left
      ctx.fillRect(x+s*.65, y+s*.32, s*.1, s*.4);  // knuckle plate right
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x+s*.38, y+s*.45, s*.24, s*.15); // palm rune
    },
  },

  // ── Voidguard Armour Set (LEGENDARY) ────────────────────────────

  VOIDGUARD_HELM: {
    id: 'voidguard_helm', name: 'Voidguard Helm', stackable: false, equipSlot: 'helmet',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#0f0a1a'; ctx.fillRect(x+s*.2, y+s*.3, s*.6, s*.5);
      ctx.beginPath(); ctx.arc(x+s*.5, y+s*.38, s*.3, Math.PI, 0);
      ctx.fillStyle = '#0f0a1a'; ctx.fill();
      ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = s*.04;
      ctx.beginPath(); ctx.arc(x+s*.5, y+s*.38, s*.3, Math.PI, 0); ctx.stroke();
      ctx.strokeRect(x+s*.2, y+s*.3, s*.6, s*.5);
      ctx.fillStyle = '#2d1260'; ctx.fillRect(x+s*.28, y+s*.66, s*.44, s*.18);
      // Glowing eye slits
      ctx.fillStyle = '#00ffe0'; ctx.fillRect(x+s*.3, y+s*.7, s*.14, s*.06);
      ctx.fillRect(x+s*.56, y+s*.7, s*.14, s*.06);
      ctx.fillStyle = 'rgba(0,255,224,0.3)';
      ctx.fillRect(x+s*.28, y+s*.68, s*.18, s*.1);
      ctx.fillRect(x+s*.54, y+s*.68, s*.18, s*.1);
    },
  },

  VOIDGUARD_PLATE: {
    id: 'voidguard_plate', name: 'Voidguard Plate', stackable: false, equipSlot: 'chestplate',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#0f0a1a'; ctx.fillRect(x+s*.15, y+s*.2, s*.7, s*.65);
      ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = s*.04;
      ctx.strokeRect(x+s*.15, y+s*.2, s*.7, s*.65);
      // Rune lines
      ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = s*.025;
      ctx.beginPath();
      ctx.moveTo(x+s*.5, y+s*.22); ctx.lineTo(x+s*.5, y+s*.84); ctx.stroke();
      ctx.moveTo(x+s*.17, y+s*.5);  ctx.lineTo(x+s*.83, y+s*.5);  ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,224,0.15)';
      ctx.fillRect(x+s*.16, y+s*.21, s*.68, s*.63);
    },
  },

  VOIDGUARD_LEGS: {
    id: 'voidguard_legs', name: 'Voidguard Legs', stackable: false, equipSlot: 'leggings',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#0f0a1a';
      ctx.fillRect(x+s*.2, y+s*.1, s*.6, s*.3);
      ctx.fillRect(x+s*.2, y+s*.4, s*.26, s*.5);
      ctx.fillRect(x+s*.54, y+s*.4, s*.26, s*.5);
      ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = s*.03;
      ctx.strokeRect(x+s*.2, y+s*.1, s*.6, s*.3);
      ctx.strokeRect(x+s*.2, y+s*.4, s*.26, s*.5);
      ctx.strokeRect(x+s*.54, y+s*.4, s*.26, s*.5);
      ctx.fillStyle = 'rgba(0,255,224,0.1)';
      ctx.fillRect(x+s*.21, y+s*.11, s*.58, s*.28);
    },
  },

  VOIDGUARD_BOOTS: {
    id: 'voidguard_boots', name: 'Voidguard Boots', stackable: false, equipSlot: 'boots',
    draw(ctx, x, y, s) {
      ctx.fillStyle = '#0f0a1a';
      ctx.fillRect(x+s*.15, y+s*.15, s*.28, s*.7);
      ctx.fillRect(x+s*.57, y+s*.15, s*.28, s*.7);
      ctx.fillRect(x+s*.1,  y+s*.75, s*.35, s*.15);
      ctx.fillRect(x+s*.55, y+s*.75, s*.35, s*.15);
      ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = s*.03;
      ctx.strokeRect(x+s*.15, y+s*.15, s*.28, s*.7);
      ctx.strokeRect(x+s*.57, y+s*.15, s*.28, s*.7);
      ctx.fillStyle = 'rgba(0,255,224,0.2)';
      ctx.fillRect(x+s*.16, y+s*.16, s*.26, s*.68);
    },
  },

  /* ── Vitality items ────────────────────────────────── */
  DRAGONHIDE_HELM: {
    id: 'dragonhide_helm', name: 'Dragonhide Helm', stackable: false, equipSlot: 'helmet',
    draw(ctx, x, y, s) {
      // Dark crimson scale-plate helm
      ctx.fillStyle = '#5a1010'; ctx.fillRect(x+s*.12, y+s*.2, s*.76, s*.6);
      ctx.fillStyle = '#3a0808'; ctx.fillRect(x+s*.2,  y+s*.08, s*.6, s*.2);
      ctx.fillStyle = '#7a2020';
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 4; col++) {
          const sx2 = x + s*(.14 + col*.18 + (row%2)*.09);
          const sy2 = y + s*(.26 + row*.16);
          ctx.fillRect(sx2, sy2, s*.16, s*.14);
        }
      ctx.fillStyle = 'rgba(255,80,40,0.15)'; ctx.fillRect(x+s*.12, y+s*.2, s*.76, s*.6);
      ctx.fillStyle = '#c04020'; ctx.fillRect(x+s*.3, y+s*.08, s*.4, s*.04);
    },
  },

  TROLLHIDE_VEST: {
    id: 'trollhide_vest', name: 'Trollhide Vest', stackable: false, equipSlot: 'chestplate',
    draw(ctx, x, y, s) {
      // Rough dark-green hide vest
      ctx.fillStyle = '#2a3a1a'; ctx.fillRect(x+s*.08, y+s*.1, s*.84, s*.72);
      ctx.fillStyle = '#1a2810'; ctx.fillRect(x+s*.0, y+s*.18, s*.14, s*.46);
      ctx.fillStyle = '#1a2810'; ctx.fillRect(x+s*.86, y+s*.18, s*.14, s*.46);
      // Hide texture — rough horizontal stripes
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      for (let i = 0; i < 4; i++) ctx.fillRect(x+s*.08, y+s*(.18+i*.16), s*.84, s*.05);
      // Crude stitching
      ctx.fillStyle = '#8b6914';
      for (let i = 0; i < 5; i++) ctx.fillRect(x+s*.46, y+s*(.14+i*.13), s*.08, s*.06);
      ctx.fillStyle = 'rgba(60,80,30,0.30)'; ctx.fillRect(x+s*.1, y+s*.12, s*.36, s*.2);
    },
  },

  OBSIDIAN_PLATE: {
    id: 'obsidian_plate', name: 'Obsidian Plate', stackable: false, equipSlot: 'chestplate',
    draw(ctx, x, y, s) {
      // Near-black with glowing lava cracks
      ctx.fillStyle = '#0e0808'; ctx.fillRect(x+s*.08, y+s*.1, s*.84, s*.72);
      ctx.fillStyle = '#060404'; ctx.fillRect(x+s*.0, y+s*.2, s*.14, s*.44);
      ctx.fillStyle = '#060404'; ctx.fillRect(x+s*.86, y+s*.2, s*.14, s*.44);
      // Lava crack veins
      ctx.strokeStyle = '#c03000'; ctx.lineWidth = s*.025;
      ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.15); ctx.lineTo(x+s*.5, y+s*.5); ctx.lineTo(x+s*.4, y+s*.78); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+s*.6, y+s*.2);  ctx.lineTo(x+s*.5, y+s*.5); ctx.lineTo(x+s*.65,y+s*.75); ctx.stroke();
      ctx.strokeStyle = '#ff6020'; ctx.lineWidth = s*.01;
      ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.15); ctx.lineTo(x+s*.5, y+s*.5); ctx.lineTo(x+s*.4, y+s*.78); ctx.stroke();
      ctx.fillStyle = 'rgba(200,60,0,0.10)'; ctx.fillRect(x+s*.08, y+s*.1, s*.84, s*.72);
    },
  },

  VITALITY_CAPE: {
    id: 'vitality_cape', name: 'Vitality Cape', stackable: false, equipSlot: 'cape',
    draw(ctx, x, y, s) {
      // Emerald green cape with heart motif
      ctx.fillStyle = '#1a6e30'; ctx.fillRect(x+s*.1, y+s*.05, s*.8, s*.85);
      ctx.fillStyle = '#14581f';
      ctx.fillRect(x+s*.1,  y+s*.05, s*.06, s*.85);
      ctx.fillRect(x+s*.84, y+s*.05, s*.06, s*.85);
      // Shimmer highlight
      ctx.fillStyle = 'rgba(80,255,120,0.12)'; ctx.fillRect(x+s*.14, y+s*.06, s*.3, s*.82);
      // Small heart motif
      ctx.fillStyle = '#e03030';
      ctx.fillRect(x+s*.38, y+s*.34, s*.08, s*.06);
      ctx.fillRect(x+s*.54, y+s*.34, s*.08, s*.06);
      ctx.fillRect(x+s*.34, y+s*.38, s*.32, s*.08);
      ctx.fillRect(x+s*.38, y+s*.44, s*.24, s*.06);
      ctx.fillRect(x+s*.44, y+s*.48, s*.12, s*.06);
      ctx.fillRect(x+s*.47, y+s*.52, s*.06, s*.04);
    },
  },

});

/* ── Consumable potions ──────────────────────────────── */

ITEMS.HEALING_POTION = {
  id: 'healing_potion', name: 'Healing Potion', stackable: true,
  description: 'Restores 15 HP', value: 50, healAmount: 15,
  draw(ctx, x, y, s) {
    // Bottle shape
    ctx.fillStyle = '#1a6a1a'; ctx.fillRect(x+s*.35, y+s*.35, s*.3, s*.45);
    ctx.fillStyle = '#2a8a2a'; ctx.fillRect(x+s*.38, y+s*.3, s*.24, s*.08);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x+s*.4, y+s*.22, s*.2, s*.1);
    // Liquid
    ctx.fillStyle = '#40c040'; ctx.fillRect(x+s*.37, y+s*.5, s*.26, s*.28);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x+s*.39, y+s*.37, s*.07, s*.2);
  },
};

ITEMS.STAMINA_BREW = {
  id: 'stamina_brew', name: 'Stamina Brew', stackable: true,
  description: 'Restores stamina', value: 35, staminaRestore: 40,
  // TODO: Agent 4 — stamina_brew calls player.restoreStamina(40)
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#6a3a0a'; ctx.fillRect(x+s*.35, y+s*.35, s*.3, s*.45);
    ctx.fillStyle = '#8a5a1a'; ctx.fillRect(x+s*.38, y+s*.3, s*.24, s*.08);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x+s*.4, y+s*.22, s*.2, s*.1);
    ctx.fillStyle = '#e0a020'; ctx.fillRect(x+s*.37, y+s*.5, s*.26, s*.28);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x+s*.39, y+s*.37, s*.07, s*.2);
  },
};

ITEMS.FIRE_RESIST_POTION = {
  id: 'fire_resist_potion', name: 'Fire Resistance Potion', stackable: true,
  description: 'Reduces fire damage for 60 seconds', value: 75, resistDuration: 60,
  // TODO: combat.js — fire_resist_potion sets player.fireResist=true for 60s
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#1a1a6a'; ctx.fillRect(x+s*.35, y+s*.35, s*.3, s*.45);
    ctx.fillStyle = '#2a2a8a'; ctx.fillRect(x+s*.38, y+s*.3, s*.24, s*.08);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x+s*.4, y+s*.22, s*.2, s*.1);
    ctx.fillStyle = '#4080e0'; ctx.fillRect(x+s*.37, y+s*.5, s*.26, s*.28);
    ctx.fillStyle = 'rgba(200,220,255,0.4)'; ctx.fillRect(x+s*.39, y+s*.37, s*.07, s*.2);
  },
};

/* ── Biome resource items ─────────────────────────────── */

ITEMS.SWAMP_MOSS = {
  id: 'swamp_moss', name: 'Swamp Moss', stackable: true,
  description: 'A clump of slimy moss from the swamp', value: 8,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#3a5a28'; ctx.fillRect(x+s*.12, y+s*.4, s*.76, s*.3);
    ctx.fillStyle = '#4a7a30'; ctx.fillRect(x+s*.18, y+s*.32, s*.2, s*.2);
    ctx.fillStyle = '#4a7a30'; ctx.fillRect(x+s*.4, y+s*.28, s*.22, s*.22);
    ctx.fillStyle = '#5a9038'; ctx.fillRect(x+s*.62, y+s*.34, s*.18, s*.18);
    ctx.fillStyle = 'rgba(80,120,40,0.5)'; ctx.fillRect(x+s*.15, y+s*.62, s*.7, s*.1);
  },
};

ITEMS.VOLCANIC_ASH = {
  id: 'volcanic_ash', name: 'Volcanic Ash', stackable: true,
  description: 'Fine ash from the volcanic region', value: 12,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.6, s*.32, s*.2, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#404040'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.55, s*.25, s*.14, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,80,0,0.2)'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.14, s*.08, 0, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.TUNDRA_ICE = {
  id: 'tundra_ice', name: 'Tundra Ice', stackable: true,
  description: 'A chunk of ice from the frozen north', value: 10,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#a0d0e8'; ctx.fillRect(x+s*.2, y+s*.28, s*.6, s*.5);
    ctx.fillStyle = '#c8e8f8'; ctx.fillRect(x+s*.24, y+s*.3, s*.52, s*.42);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x+s*.28, y+s*.32, s*.18, s*.1);
    ctx.strokeStyle = '#80b8d0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.28); ctx.lineTo(x+s*.2, y+s*.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.6, y+s*.3); ctx.lineTo(x+s*.72, y+s*.48); ctx.stroke();
  },
};

ITEMS.DESERT_CRYSTAL = {
  id: 'desert_crystal', name: 'Desert Crystal', stackable: true,
  description: 'A sparkling crystal from the desert sands', value: 15,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#e8c060'; ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.15); ctx.lineTo(x+s*.72, y+s*.5); ctx.lineTo(x+s*.6, y+s*.82);
    ctx.lineTo(x+s*.4, y+s*.82); ctx.lineTo(x+s*.28, y+s*.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8e090'; ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.18); ctx.lineTo(x+s*.64, y+s*.5); ctx.lineTo(x+s*.5, y+s*.78); ctx.lineTo(x+s*.36, y+s*.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,0.5)'; ctx.beginPath(); ctx.ellipse(x+s*.46, y+s*.38, s*.06, s*.14, -0.3, 0, Math.PI*2); ctx.fill();
  },
};

/* ── Animal produce items (Agent 6) ──────────────────── */
// TODO: Agent 6 — egg/milk/wool_ball are produced by animal pen system

ITEMS.EGG = {
  id: 'egg', name: 'Egg', stackable: true,
  description: 'A fresh egg', value: 5, cookable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#f0e0b0'; ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.52, s*.2, s*.26, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.5)'; ctx.beginPath(); ctx.ellipse(x+s*.44, y+s*.42, s*.07, s*.1, -0.3, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.MILK = {
  id: 'milk', name: 'Milk', stackable: true,
  description: 'Fresh milk', value: 8,
  draw(ctx, x, y, s) {
    // Bucket
    ctx.fillStyle = '#a0a0a0'; ctx.fillRect(x+s*.22, y+s*.3, s*.56, s*.5);
    ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x+s*.22, y+s*.28, s*.56, s*.06);
    // White liquid
    ctx.fillStyle = '#f8f8f8'; ctx.fillRect(x+s*.26, y+s*.34, s*.48, s*.42);
    // Handle
    ctx.strokeStyle = '#808080'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.28, s*.14, Math.PI, 0); ctx.stroke();
  },
};

ITEMS.WOOL_BALL = {
  id: 'wool_ball', name: 'Wool Ball', stackable: true,
  description: 'A ball of fluffy wool', value: 12,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#e8e8e0'; ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.28, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#d0d0c0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.22, 0.2, 2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.28, -0.5, 1.8); ctx.stroke();
    // Knitting needles
    ctx.strokeStyle = '#c0a020'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.25); ctx.lineTo(x+s*.65, y+s*.72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.65, y+s*.25); ctx.lineTo(x+s*.32, y+s*.72); ctx.stroke();
  },
};

/* ── Farming crop yield items (Agent 6) ──────────────── */
// TODO: Agent 6 — wheat/potato/herb_bundle are greenhouse crop yields

ITEMS.WHEAT = {
  id: 'wheat', name: 'Wheat', stackable: true,
  description: 'A bundle of wheat stalks', value: 3, farmable: true,
  draw(ctx, x, y, s) {
    ctx.strokeStyle = '#c8a020'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const sx = x + s * (0.28 + i * 0.18);
      ctx.beginPath(); ctx.moveTo(sx, y+s*.85); ctx.lineTo(sx, y+s*.2); ctx.stroke();
      ctx.fillStyle = '#e0b828';
      ctx.beginPath(); ctx.ellipse(sx, y+s*.18, s*.05, s*.12, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = '#a08010'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+s*.25, y+s*.85); ctx.lineTo(x+s*.75, y+s*.85); ctx.stroke();
  },
};

// ITEMS.POTATO already defined above (Farming harvest section) — cookable:true, farmable:true added there

ITEMS.HERB_BUNDLE = {
  id: 'herb_bundle', name: 'Herb Bundle', stackable: true,
  description: 'A bundle of mixed herbs', value: 20, farmable: true,
  draw(ctx, x, y, s) {
    // Stems
    ctx.strokeStyle = '#3a7a28'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x+s*.4, y+s*.82); ctx.lineTo(x+s*.35, y+s*.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.82); ctx.lineTo(x+s*.5, y+s*.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+s*.6, y+s*.82); ctx.lineTo(x+s*.65, y+s*.3); ctx.stroke();
    // Leaves
    ctx.fillStyle = '#4a9a38';
    ctx.beginPath(); ctx.ellipse(x+s*.28, y+s*.48, s*.1, s*.05, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+s*.62, y+s*.44, s*.1, s*.05, 0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.35, s*.12, s*.05, 0, 0, Math.PI*2); ctx.fill();
    // Tie
    ctx.strokeStyle = '#8b6914'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x+s*.3, y+s*.72); ctx.lineTo(x+s*.7, y+s*.72); ctx.stroke();
  },
};

/* ── Loot table stub items ────────────────────────────── */
// These IDs are referenced in LOOT_TABLES below

ITEMS.FEATHER = {
  id: 'feather', name: 'Feather', stackable: true,
  draw(ctx, x, y, s) {
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x+s*.5, y+s*.85);
    ctx.bezierCurveTo(x+s*.2, y+s*.6, x+s*.25, y+s*.3, x+s*.5, y+s*.1);
    ctx.bezierCurveTo(x+s*.75, y+s*.3, x+s*.8, y+s*.6, x+s*.5, y+s*.85);
    ctx.strokeStyle = '#d8d0b8'; ctx.fillStyle = '#f0e8d8'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c8c0a8'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x+s*.5, y+s*.85); ctx.lineTo(x+s*.5, y+s*.12); ctx.stroke();
  },
};

ITEMS.COWHIDE = {
  id: 'cowhide', name: 'Cowhide', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#c8a060'; ctx.fillRect(x+s*.12, y+s*.2, s*.76, s*.6);
    ctx.fillStyle = '#a07840'; ctx.fillRect(x+s*.18, y+s*.26, s*.64, s*.48);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x+s*.3, y+s*.32, s*.18, s*.14);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x+s*.52, y+s*.38, s*.14, s*.14);
  },
};

ITEMS.RAW_MUTTON = {
  id: 'raw_mutton', name: 'Raw Mutton', stackable: false,
  draw(c, x, y, s) { _rawMeat(c, x, y, s, '#cc9080'); },
};

ITEMS.COOKED_MUTTON = {
  id: 'cooked_mutton', name: 'Cooked Mutton', stackable: false, heal: 7,
  draw(c, x, y, s) { _cookedMeat(c, x, y, s, '#8a4a28'); },
};

ITEMS.WOOL = {
  id: 'wool', name: 'Wool', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#e8e8e0'; ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*.26, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(220,220,210,0.7)'; ctx.beginPath(); ctx.arc(x+s*.38, y+s*.44, s*.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+s*.6, y+s*.42, s*.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+s*.52, y+s*.6, s*.11, 0, Math.PI*2); ctx.fill();
  },
};

ITEMS.VENISON = {
  id: 'venison', name: 'Venison', stackable: false,
  draw(c, x, y, s) { _rawMeat(c, x, y, s, '#8b2222'); },
};

ITEMS.DEER_HIDE = {
  id: 'deer_hide', name: 'Deer Hide', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#b87840'; ctx.fillRect(x+s*.12, y+s*.2, s*.76, s*.6);
    ctx.fillStyle = '#9a6028'; ctx.fillRect(x+s*.18, y+s*.26, s*.64, s*.48);
    ctx.fillStyle = '#e0c090'; ctx.fillRect(x+s*.32, y+s*.36, s*.14, s*.2);
    ctx.fillStyle = '#e0c090'; ctx.fillRect(x+s*.54, y+s*.4, s*.12, s*.16);
  },
};

ITEMS.RAW_RABBIT = {
  id: 'raw_rabbit', name: 'Raw Rabbit', stackable: false,
  draw(c, x, y, s) { _rawMeat(c, x, y, s, '#e8c0a0'); },
};

ITEMS.RABBIT_FUR = {
  id: 'rabbit_fur', name: 'Rabbit Fur', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#c8b890'; ctx.fillRect(x+s*.12, y+s*.22, s*.76, s*.56);
    ctx.fillStyle = '#e0d0a8'; ctx.fillRect(x+s*.18, y+s*.28, s*.64, s*.44);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x+s*.22, y+s*.3, s*.28, s*.12);
  },
};

ITEMS.SPIDER_SILK = {
  id: 'spider_silk', name: 'Spider Silk', stackable: true,
  draw(ctx, x, y, s) {
    ctx.strokeStyle = 'rgba(220,220,220,0.8)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x+s*.5, y+s*.5);
      ctx.lineTo(x+s*.5 + Math.cos(i*Math.PI*0.4)*s*.38, y+s*.5 + Math.sin(i*Math.PI*0.4)*s*.38);
      ctx.stroke();
    }
    for (let r = 0.1; r < 0.42; r += 0.14) {
      ctx.beginPath(); ctx.arc(x+s*.5, y+s*.5, s*r, 0, Math.PI*2); ctx.stroke();
    }
  },
};

ITEMS.VENOM_SAC = {
  id: 'venom_sac', name: 'Venom Sac', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#2a5a1a'; ctx.beginPath(); ctx.arc(x+s*.5, y+s*.52, s*.24, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#40901a'; ctx.beginPath(); ctx.arc(x+s*.46, y+s*.46, s*.14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(80,200,20,0.3)'; ctx.beginPath(); ctx.arc(x+s*.43, y+s*.42, s*.06, 0, Math.PI*2); ctx.fill();
    // Drip
    ctx.fillStyle = '#60c030'; ctx.fillRect(x+s*.48, y+s*.72, s*.06, s*.1);
    ctx.beginPath(); ctx.arc(x+s*.51, y+s*.84, s*.04, 0, Math.PI*2); ctx.fill();
  },
};

/* ── Iron/Mithril ore aliases for LOOT_TABLES ────────── */
// LOOT_TABLES references 'iron_ore' and 'mithril_ore' as readable drop names.
// The canonical ore IDs are 'ore_iron' and 'ore_mithril'.
ITEMS.IRON_ORE = {
  id: 'iron_ore', name: 'Iron Ore', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#6a6a70';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8a8a96';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.5, s*.18, s*.12, -0.3, 0, Math.PI*2); ctx.fill();
  },
};
ITEMS.MITHRIL_ORE = {
  id: 'mithril_ore', name: 'Mithril Ore', stackable: true,
  draw(ctx, x, y, s) {
    ctx.fillStyle = '#4a4a6a';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.55, s*.32, s*.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7b68ee';
    ctx.beginPath(); ctx.ellipse(x+s*.5, y+s*.5, s*.18, s*.12, 0.3, 0, Math.PI*2); ctx.fill();
  },
};

/* ═══════════════════════════════════════════════════════
   LOOT_TABLES — authoritative mob drop source (Agent 2 imports this)
   Each entry: { id, qty: [min,max], chance: 0.0–1.0 }
   ═══════════════════════════════════════════════════════ */
export const LOOT_TABLES = {
  // Passive mobs
  chicken:       [{ id: 'raw_chicken',  qty: [1,1], chance: 1.0 }, { id: 'feather',     qty: [3,8],  chance: 0.9 }],
  cow:           [{ id: 'raw_beef',     qty: [1,2], chance: 1.0 }, { id: 'cowhide',     qty: [1,1],  chance: 1.0 }],
  sheep:         [{ id: 'raw_mutton',   qty: [1,1], chance: 1.0 }, { id: 'wool',        qty: [1,3],  chance: 0.8 }],
  deer:          [{ id: 'venison',      qty: [1,2], chance: 1.0 }, { id: 'deer_hide',   qty: [1,1],  chance: 0.7 }],
  rabbit:        [{ id: 'raw_rabbit',   qty: [1,1], chance: 1.0 }, { id: 'rabbit_fur',  qty: [1,1],  chance: 0.6 }],
  arctic_fox:    [{ id: 'raw_rabbit',   qty: [1,1], chance: 0.8 }, { id: 'rabbit_fur',  qty: [1,1],  chance: 0.7 }],
  frog:          [{ id: 'swamp_moss',   qty: [1,2], chance: 0.6 }],
  fire_lizard:   [{ id: 'volcanic_ash', qty: [1,2], chance: 0.7 }],
  // Aggressive mobs
  goblin:        [{ id: 'gold_coin',    qty: [1,5],   chance: 0.8 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  orc:           [{ id: 'gold_coin',    qty: [5,15],  chance: 0.9 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }, { id: 'iron_sword', qty: [1,1], chance: 0.1 }],
  troll:         [{ id: 'gold_coin',    qty: [8,20],  chance: 1.0 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }, { id: 'iron_ore',   qty: [1,3], chance: 0.3 }],
  demon:         [{ id: 'gold_coin',    qty: [20,50], chance: 1.0 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }, { id: 'mithril_ore',qty: [1,2], chance: 0.2 }],
  forest_spider: [{ id: 'spider_silk',  qty: [1,3],   chance: 0.7 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  bandit:        [{ id: 'gold_coin',    qty: [3,10],  chance: 0.9 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  ice_troll:     [{ id: 'tundra_ice',   qty: [1,3],   chance: 0.7 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  frost_wolf:    [{ id: 'rabbit_fur',   qty: [1,2],   chance: 0.6 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  swamp_serpent: [{ id: 'swamp_moss',   qty: [1,2],   chance: 0.5 }, { id: 'venom_sac',   qty: [1,1],  chance: 0.3 }],
  bog_witch:     [{ id: 'swamp_moss',   qty: [2,4],   chance: 0.8 }, { id: 'gold_coin',   qty: [5,12], chance: 0.7 }],
  sand_scorpion: [{ id: 'desert_crystal',qty:[1,1],   chance: 0.4 }, { id: 'bones',       qty: [1,1],  chance: 1.0 }],
  desert_bandit: [{ id: 'gold_coin',    qty: [4,12],  chance: 0.9 }, { id: 'desert_crystal',qty:[1,1],chance:0.3}],
  lava_golem:    [{ id: 'volcanic_ash', qty: [2,5],   chance: 1.0 }, { id: 'gold_coin',   qty:[15,30], chance: 0.8 }],
  fire_imp:      [{ id: 'volcanic_ash', qty: [1,2],   chance: 0.7 }, { id: 'gold_coin',   qty: [3,8],  chance: 0.6 }],
};

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
  steel_legs:        ITEMS.STEEL_LEGS,
  mithril_legs:      ITEMS.MITHRIL_LEGS,
  tungsten_legs:     ITEMS.TUNGSTEN_LEGS,
  // ── Gloves ────────────────────────────────────────────
  leather_gloves:    ITEMS.LEATHER_GLOVES,
  bronze_gauntlets:  ITEMS.BRONZE_GAUNTLETS,
  iron_gauntlets:    ITEMS.IRON_GAUNTLETS,
  steel_gauntlets:   ITEMS.STEEL_GAUNTLETS,
  mithril_gauntlets: ITEMS.MITHRIL_GAUNTLETS,
  tungsten_gauntlets: ITEMS.TUNGSTEN_GAUNTLETS,
  berserker_wraps:   ITEMS.BERSERKER_WRAPS,
  // ── Boots ─────────────────────────────────────────────
  leather_boots:     ITEMS.LEATHER_BOOTS,
  bronze_boots:      ITEMS.BRONZE_BOOTS,
  iron_boots:        ITEMS.IRON_BOOTS,
  steel_boots:       ITEMS.STEEL_BOOTS,
  mithril_boots:     ITEMS.MITHRIL_BOOTS,
  tungsten_boots:    ITEMS.TUNGSTEN_BOOTS,
  shadow_treads:     ITEMS.SHADOW_TREADS,
  // ── Capes ─────────────────────────────────────────────
  brown_cape:        ITEMS.BROWN_CAPE,
  red_cape:          ITEMS.RED_CAPE,
  blue_cape:         ITEMS.BLUE_CAPE,
  green_cape:        ITEMS.GREEN_CAPE,
  warrior_cape:      ITEMS.WARRIOR_CAPE,
  berserker_cape:    ITEMS.BERSERKER_CAPE,
  // ── Raid weapons ──────────────────────────────────────────────────
  raid_blade:           ITEMS.RAID_BLADE,
  voidbane_sword:       ITEMS.VOIDBANE_SWORD,
  chaos_edge:           ITEMS.CHAOS_EDGE,
  dungeon_greataxe:     ITEMS.DUNGEON_GREATAXE,
  // ── Raider's Set (EPIC) ────────────────────────────────────────────
  raiders_helm:         ITEMS.RAIDERS_HELM,
  raiders_plate:        ITEMS.RAIDERS_PLATE,
  raiders_legs:         ITEMS.RAIDERS_LEGS,
  raiders_gauntlets:    ITEMS.RAIDERS_GAUNTLETS,
  // ── Voidguard Set (LEGENDARY) ─────────────────────────────────────
  voidguard_helm:       ITEMS.VOIDGUARD_HELM,
  voidguard_plate:      ITEMS.VOIDGUARD_PLATE,
  voidguard_legs:       ITEMS.VOIDGUARD_LEGS,
  voidguard_boots:      ITEMS.VOIDGUARD_BOOTS,
  // ── Vitality items ────────────────────────────────────────────────
  dragonhide_helm:      ITEMS.DRAGONHIDE_HELM,
  trollhide_vest:       ITEMS.TROLLHIDE_VEST,
  obsidian_plate:       ITEMS.OBSIDIAN_PLATE,
  vitality_cape:        ITEMS.VITALITY_CAPE,
};
