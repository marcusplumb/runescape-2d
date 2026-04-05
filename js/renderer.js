import {
  TILE_SIZE, TILE_COLORS, TILE_HAS_DETAIL, TILES,
  INV_COLS, INV_ROWS, INV_CELL, INV_PAD,
  SKILL_NAMES, SKILL_COLORS,
} from './constants.js';
import { ITEMS } from './items.js';
import { getBiome, BIOMES } from './biomes.js';
import {
  SHOP_PW, SHOP_HEADER_H, SHOP_TAB_H, SHOP_ROW_H, SHOP_PH,
  SELL_PRICES,
  HOUSE_SHOP_PW, HOUSE_SHOP_HEADER_H, HOUSE_SHOP_ROW_H, HOUSE_SHOP_PH,
} from './shop.js';
import {
  MO_PW, MO_PH, MO_HEADER_H, MO_PREVIEW_H,
  MO_STYLE_ROW_H, MO_ROW_H, MO_PAD_BOT,
  MO_SWATCH, MO_SWATCH_GAP, MO_LABEL_W, MO_PAD,
  MO_BTN_W, MO_BTN_H, MO_BTN_GAP,
  MO_PALETTES, MO_STYLE_ROWS,
} from './makeover.js';
import { drawHairStyle, drawBodyStyle } from './player.js';
import {
  FORGE_PW, FORGE_HEADER_H, FORGE_TAB_H, FORGE_ROW_H,
  SMELT_PH, SMITH_PH,
} from './forge.js';
import { EQUIP_ID_TO_ITEM } from './items.js';
import { GEAR_BY_ID } from './gear.js';
import {
  ROOM_DEFS, FURNITURE_DEFS, getUnlockedRoomDefs,
  rotatedFootprint,
  GRID_COLS, GRID_ROWS,
  BM_PW, BM_PH, BM_HEADER_H, BM_GRID_CELL, BM_GRID_OFF, BM_GRID_TOP, BM_SPLIT_X,
} from './housing.js';

// Tiles that animate each frame (use this.time) — excluded from the chunk cache
const ANIMATED_TILES = new Set([
  TILES.WATER, TILES.SWAMP_WATER, TILES.LAVA,
  TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON, TILES.FISH_SPOT_LOBSTER,
  TILES.FIRE, TILES.PORTAL,
]);
// Prop tiles that don't fill their cell — rendered on top of the underlying ground tile
const PROP_TILES = new Set([
  // Structures / furniture
  TILES.BARREL, TILES.SIGN, TILES.FENCE, TILES.WELL,
  TILES.FURNACE, TILES.ANVIL,
  TILES.FURN_CHAIR, TILES.FURN_RUG, TILES.FURN_TABLE,
  TILES.FURN_CHEST, TILES.FURN_BOOKSHELF, TILES.FURN_PLANT,
  TILES.FURN_BED, TILES.FURN_BENCH,
  // Vegetation (sprites drawn on top of biome ground)
  TILES.TREE, TILES.OAK_TREE, TILES.WILLOW_TREE, TILES.MAPLE_TREE,
  TILES.YEW_TREE, TILES.MAGIC_TREE, TILES.ELDER_TREE,
  TILES.STUMP, TILES.CACTUS, TILES.FLOWERS,
  // Ore rocks
  TILES.ROCK_COPPER, TILES.ROCK_TIN, TILES.ROCK_IRON, TILES.ROCK_COAL,
  TILES.ROCK_SILVER, TILES.ROCK_GOLD, TILES.ROCK_MITHRIL,
  TILES.ROCK_TUNGSTEN, TILES.ROCK_OBSIDIAN, TILES.ROCK_MOONSTONE,
  TILES.ROCK_DEPLETED,
  // Dungeon ladder (drawn on top of the stone floor inside the shrine)
  TILES.DUNGEON_ENTRANCE,
]);
const CHUNK_TILES = 16;                        // tiles per chunk side
const CHUNK_PX    = CHUNK_TILES * TILE_SIZE;   // pixels per chunk side (512)

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.minimapCanvas = null;
    this.minimapDirty = true;

    // Tile chunk cache — per world-object so world and interiors stay separate
    this._chunkCaches = new WeakMap(); // world → Map<"cx,cy", OffscreenCanvas>
    this._dirtyChunks = new WeakMap(); // world → Set<"cx,cy">

    // Tree sprite cache — keyed by seed+biome, built once per unique tree variant
    this._treeCache = new Map(); // key → OffscreenCanvas

    // Multi-tile roof texture cache — keyed by "WxH" pixel dimensions
    this._roofCache = new Map();

    // Animated time for tile effects
    this.time = 0;

    // Item sprite lookup for skill-unlock popup icons
    this._itemById = new Map(Object.values(ITEMS).map(item => [item.id, item]));
  }

  clear() {
    // Re-apply context settings that canvas resize resets
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setTime(t) { this.time = t; }

  /* ═══════════════════════════════════════════════════════
     WORLD TILES
     ═══════════════════════════════════════════════════════ */
  drawWorld(world, camX, camY) {
    const ctx = this.ctx;

    // Ensure per-world cache maps exist
    if (!this._chunkCaches.has(world)) this._chunkCaches.set(world, new Map());
    if (!this._dirtyChunks.has(world)) this._dirtyChunks.set(world, new Set());
    const cache = this._chunkCaches.get(world);
    const dirty = this._dirtyChunks.get(world);

    // Drain tile-change notifications → mark the affected chunk dirty
    if (world.changedTiles.length) {
      for (const packed of world.changedTiles) {
        const col = packed & 0xFFFF;
        const row = packed >>> 16;
        dirty.add(`${col / CHUNK_TILES | 0},${row / CHUNK_TILES | 0}`);
      }
      world.changedTiles.length = 0;
      this.minimapDirty = true;
    }

    // Raw visible range from camera position, then capped to 70×70
    let startCol = Math.floor(camX / TILE_SIZE) - 2;
    let startRow = Math.floor(camY / TILE_SIZE) - 2;
    let endCol   = startCol + Math.ceil(this.canvas.width  / TILE_SIZE) + 5;
    let endRow   = startRow + Math.ceil(this.canvas.height / TILE_SIZE) + 5;

    const cxMin = startCol / CHUNK_TILES | 0;
    const cyMin = startRow / CHUNK_TILES | 0;
    const cxMax = endCol   / CHUNK_TILES | 0;
    const cyMax = endRow   / CHUNK_TILES | 0;

    // Blit static chunks — build/rebuild only when missing or dirty
    for (let cy = cyMin; cy <= cyMax; cy++) {
      for (let cx = cxMin; cx <= cxMax; cx++) {
        const key = `${cx},${cy}`;
        if (!cache.has(key) || dirty.has(key)) {
          cache.set(key, this._renderChunk(cx, cy, world));
          dirty.delete(key);
        }
        ctx.drawImage(cache.get(key), cx * CHUNK_PX, cy * CHUNK_PX);
      }
    }

    // Animated tiles drawn on top each frame (they use this.time)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = world.getTile(c, r);
        if (ANIMATED_TILES.has(tile)) {
          const px = c * TILE_SIZE, py = r * TILE_SIZE;
          ctx.fillStyle = TILE_COLORS[tile] || '#000';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          this._drawTileDetail(ctx, tile, px, py, c, r, world);
        }
      }
    }

    // Evict chunks far from the viewport to bound memory (~90 chunks max kept)
    const BORDER = 2;
    for (const key of cache.keys()) {
      const comma = key.indexOf(',');
      const kcx = key.slice(0, comma) | 0;
      const kcy = key.slice(comma + 1) | 0;
      if (kcx < cxMin - BORDER || kcx > cxMax + BORDER ||
          kcy < cyMin - BORDER || kcy > cyMax + BORDER) {
        cache.delete(key);
      }
    }
  }

  /** Draw open-door floor + panel. Call BEFORE entities so the player walks over it. */
  drawOpenDoors(world, playerCol, playerRow) {
    if (!world.roofBounds) return;
    const ctx = this.ctx;
    for (const { doorC, doorR, doorFace, bC, bR, bW, bH } of world.roofBounds) {
      if (doorC === undefined) continue;
      if (playerCol < bC || playerCol >= bC + bW) continue;
      if (playerRow < bR || playerRow >= bR + bH) continue;

      const dx = doorC * TILE_SIZE;
      const dy = doorR * TILE_SIZE;
      const T  = TILE_SIZE;

      // Floor beneath the open door
      ctx.fillStyle = '#7a4e22'; ctx.fillRect(dx, dy, T, T);
      const planks = ['#8b5c2a','#7e5224','#966030','#7a4c20'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = planks[i];                ctx.fillRect(dx, dy + i * 8, T, 7);
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(dx, dy + i * 8, T, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.16)';       ctx.fillRect(dx, dy + i * 8 + 7, T, 1);
      }

      // Door panel swung open against the jamb
      const panelX = doorFace === 'north' ? dx + T - 5 : dx;
      const panelY = dy + 2;
      const panelW = 5, panelH = T - 4;
      ctx.fillStyle = '#4a2a0e'; ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.fillStyle = 'rgba(200,130,50,0.55)'; ctx.fillRect(panelX, panelY, 1, panelH);
      ctx.fillStyle = 'rgba(0,0,0,0.50)'; ctx.fillRect(panelX + panelW - 1, panelY, 1, panelH);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(panelX, panelY + Math.floor(panelH * 0.35), panelW, 1);
      ctx.fillRect(panelX, panelY + Math.floor(panelH * 0.65), panelW, 1);
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(panelX + 1, panelY + 4, 2, 2);
      ctx.fillRect(panelX + 1, panelY + panelH - 6, 2, 2);
      const shadowX = doorFace === 'north' ? panelX - 3 : panelX + panelW;
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(shadowX, panelY, 3, panelH);
    }
  }

  /** Draw roof overlays. Call AFTER entities so roofs cover them. */
  drawRoofOverlays(world, camX, camY, playerCol, playerRow) {
    const ctx = this.ctx;
    const startCol = Math.floor(camX / TILE_SIZE) - 2;
    const startRow = Math.floor(camY / TILE_SIZE) - 2;
    const endCol   = startCol + Math.ceil(this.canvas.width  / TILE_SIZE) + 5;
    const endRow   = startRow + Math.ceil(this.canvas.height / TILE_SIZE) + 5;
    const OVER_TOP = TILE_SIZE, OVER_BOT = TILE_SIZE >> 2, OVER_SIDE = TILE_SIZE;

    if (world.roofBounds) {
      for (const { c, r, rW, rH, bC, bR, bW, bH } of world.roofBounds) {
        if (c + rW < startCol - 2 || c > endCol + 2) continue;
        if (r + rH < startRow - 2 || r > endRow + 2) continue;
        if (playerCol >= bC && playerCol < bC + bW &&
            playerRow >= bR && playerRow < bR + bH) continue;
        ctx.drawImage(
          this._getOrBuildRoofTexture(rW * TILE_SIZE + OVER_SIDE * 2, rH * TILE_SIZE + OVER_TOP + OVER_BOT),
          c * TILE_SIZE - OVER_SIDE,
          r * TILE_SIZE - OVER_TOP,
        );
      }
    } else {
      for (let r = startRow - 1; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (world.getTile(c, r) !== TILES.THATCH_ROOF) continue;
          if (world.getTile(c - 1, r) === TILES.THATCH_ROOF) continue;
          if (world.getTile(c, r - 1) === TILES.THATCH_ROOF) continue;
          let rW = 0; while (world.getTile(c + rW, r) === TILES.THATCH_ROOF) rW++;
          let rH = 0; while (world.getTile(c, r + rH) === TILES.THATCH_ROOF) rH++;
          ctx.drawImage(
            this._getOrBuildRoofTexture(rW * TILE_SIZE + OVER_SIDE * 2, rH * TILE_SIZE + OVER_TOP + OVER_BOT),
            c * TILE_SIZE - OVER_SIDE,
            r * TILE_SIZE - OVER_TOP,
          );
        }
      }
    }
  }

  /** Pre-render a 16×16-tile chunk to an OffscreenCanvas (static tiles only). */
  _renderChunk(cx, cy, world) {
    const oc  = new OffscreenCanvas(CHUNK_PX, CHUNK_PX);
    const ctx = oc.getContext('2d');
    const c0  = cx * CHUNK_TILES;
    const r0  = cy * CHUNK_TILES;
    for (let dr = 0; dr < CHUNK_TILES; dr++) {
      for (let dc = 0; dc < CHUNK_TILES; dc++) {
        const col  = c0 + dc;
        const row  = r0 + dr;
        const tile = world.getTile(col, row);
        const px   = dc * TILE_SIZE;
        const py   = dr * TILE_SIZE;
        if (PROP_TILES.has(tile)) {
          // Render the underlying ground tile first so the prop sits on top of it
          const groundId = world.propGroundMap?.get(`${col},${row}`) ?? TILES.GRASS;
          ctx.fillStyle = TILE_COLORS[groundId] || '#000';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          if (TILE_HAS_DETAIL.has(groundId) && !ANIMATED_TILES.has(groundId))
            this._drawTileDetail(ctx, groundId, px, py, col, row, world);
        } else {
          ctx.fillStyle = TILE_COLORS[tile] || '#000';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
        // THATCH_ROOF detail is replaced by the multi-tile overlay pass in drawWorld
        if (TILE_HAS_DETAIL.has(tile) && !ANIMATED_TILES.has(tile) && tile !== TILES.THATCH_ROOF) {
          this._drawTileDetail(ctx, tile, px, py, col, row, world);
        }
      }
    }
    return oc;
  }

  /** Build (or return cached) a single cohesive thatched roof texture of the given pixel size.
   *  Simulates a gabled roof viewed at a classic RPG angle: the ridge is at the back (top of
   *  texture, darkest), and the roof surface slopes toward the viewer, getting lighter and more
   *  detailed toward the front eave (bottom of texture). Straw courses are foreshortened —
   *  tighter at the top (far), wider at the bottom (near). A visible eave fascia at the bottom
   *  gives depth, as if you're looking slightly upward at the front overhang.
   */
  _getOrBuildRoofTexture(pw, ph) {
    const key = `${pw}x${ph}`;
    if (this._roofCache.has(key)) return this._roofCache.get(key);

    const oc  = new OffscreenCanvas(pw, ph);
    const ctx = oc.getContext('2d');
    const w = pw, h = ph;
    const R0 = 194, G0 = 152, B0 = 58;   // golden straw base

    // ── Main surface gradient: dark at top (ridge/far) → bright at bottom (eave/near) ──
    const gMain = ctx.createLinearGradient(0, 0, 0, h);
    gMain.addColorStop(0,    `rgb(${R0-62},${G0-48},${B0-30})`);
    gMain.addColorStop(0.30, `rgb(${R0-28},${G0-22},${B0-12})`);
    gMain.addColorStop(0.65, `rgb(${R0+8},${G0+6},${B0+3})`);
    gMain.addColorStop(1,    `rgb(${R0+16},${G0+12},${B0+5})`);
    ctx.fillStyle = gMain;
    ctx.fillRect(0, 0, w, h);

    // ── Foreshortened straw courses: tight at top, wider at bottom ─────
    let cy = 0, ci = 0;
    while (cy < h) {
      const t       = cy / h;                                   // 0=top 1=bottom
      const cH      = Math.round(6 + t * 6);                   // 6px top → 12px bottom
      const bandH   = Math.min(cH - 1, h - cy);
      if (bandH < 1) break;

      // Alternating light/dark tint — more contrast near bottom (closer)
      const alpha = 0.07 + t * 0.10;
      ctx.fillStyle = ci % 2 === 0
        ? `rgba(255,225,95,${alpha})` : `rgba(0,0,0,${alpha * 1.2})`;
      ctx.fillRect(0, cy, w, bandH);

      // Mortar/gap line
      ctx.fillStyle = `rgba(45,28,4,${0.22 + t * 0.18})`;
      ctx.fillRect(0, cy + cH - 1, w, 1);

      // Strand highlights — brighter and more visible near the bottom
      for (let sx = 0; sx < w; sx += 6) {
        const wobble = Math.round(Math.sin(sx * 0.14 + ci * 0.9) * (t * 1.5));
        ctx.fillStyle = `rgba(255,210,75,${0.06 + t * 0.14})`;
        ctx.fillRect(sx, cy + 1 + wobble, 5, 1);
      }

      // Bundle separators (staggered)
      const bOff = (ci % 2) * 5;
      for (let bx = bOff; bx < w; bx += 9 + (ci % 2) * 2) {
        ctx.fillStyle = `rgba(0,0,0,${0.09 + t * 0.08})`;
        ctx.fillRect(bx, cy, 1, bandH);
      }

      cy += cH;
      ci++;
    }

    // ── Ridge cap at top — the back peak of the gable ──────────────────
    const RIDGE = 11;
    ctx.fillStyle = `rgb(${R0-58},${G0-45},${B0-28})`;
    ctx.fillRect(0, 0, w, RIDGE);
    // Cap tile segments along the ridge
    const CAP_W = 13;
    for (let rx = 0; rx < w; rx += CAP_W) {
      const cw = Math.min(CAP_W - 1, w - rx);
      ctx.fillStyle = (Math.floor(rx / CAP_W) % 2 === 0)
        ? 'rgba(255,200,80,0.18)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(rx, 2, cw, RIDGE - 3);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(rx + cw, 0, 1, RIDGE);
    }
    // Very dark top edge — roof meets the back wall
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(0, 2, w, 1);
    // Ridge-to-body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, RIDGE, w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(0, RIDGE + 2, w, 1);

    // ── Front eave fascia — the face of the roof overhang near the viewer ──
    // This strip reads as "the front edge of the roof seen head-on"
    const FASCIA = 16;
    const fy = h - FASCIA;
    // Slightly warmer/brighter than the slope body
    ctx.fillStyle = `rgb(${R0+4},${G0+3},${B0+1})`;
    ctx.fillRect(0, fy, w, FASCIA);
    // Highlight at top of fascia (light catching the exposed eave edge)
    ctx.fillStyle = 'rgba(255,228,110,0.46)';
    ctx.fillRect(0, fy, w, 3);
    ctx.fillStyle = 'rgba(255,215,90,0.22)';
    ctx.fillRect(0, fy + 3, w, 2);
    // Horizontal thatching lines on the fascia face
    for (let ey = fy + 5; ey < h - 4; ey += 3) {
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(0, ey, w, 1);
      ctx.fillStyle = 'rgba(255,200,70,0.10)';
      ctx.fillRect(0, ey + 1, w, 1);
    }
    // Underside shadow at bottom of fascia
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, h - 3, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(0, h - 5, w, 2);
    // Straw fringe hanging from the eave
    for (let fx = 3; fx < w - 3; fx += 4) {
      const flen = 4 + (fx * 11 + 23) % 5;
      ctx.fillStyle = `rgba(${R0+10},${G0+8},${B0+3},0.90)`;
      ctx.fillRect(fx, h - flen, 1, flen);
      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(fx + 1, h - flen + 1, 1, flen - 1);
    }

    // ── Side gable edges — hard dark lines + shadow vignette ───────────
    const GABLE_VIG = 18;
    const gL = ctx.createLinearGradient(0, 0, GABLE_VIG, 0);
    gL.addColorStop(0, 'rgba(0,0,0,0.52)');
    gL.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gL; ctx.fillRect(0, 0, GABLE_VIG, h);

    const gR = ctx.createLinearGradient(w - GABLE_VIG, 0, w, 0);
    gR.addColorStop(0, 'rgba(0,0,0,0)');
    gR.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = gR; ctx.fillRect(w - GABLE_VIG, 0, GABLE_VIG, h);

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);

    this._roofCache.set(key, oc);
    return oc;
  }

  // Shared ashlar-course painter used by both WALL render paths.
  // Draws staggered stone courses from yStart to yEnd within the tile at (px,py).
  // r, s1-s4 are the same seeds used by _drawTileDetail.
  _drawWallCourses(ctx, px, py, yStart, yEnd, r, s1, s2, s3, s4) {
    // Course height 4px (3 stone + 1 mortar). Stagger index uses absolute
    // world-row position so vertically stacked tiles share the same grid.
    const COURSE = 4;
    for (let cy2 = yStart; cy2 < yEnd; cy2 += COURSE) {
      const ch = Math.min(COURSE - 1, yEnd - cy2 - 1);
      if (ch < 1) break;

      // Horizontal mortar line
      ctx.fillStyle = 'rgba(0,0,0,0.40)';
      ctx.fillRect(px, py + cy2, 32, 1);

      // Stone face lighting
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(px + 1, py + cy2 + 1, 30, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + 1, py + cy2 + ch, 30, 1);

      // Vertical block joints — stagger based on absolute row in the course grid
      // so tiles stacked vertically share the same stagger pattern seamlessly.
      const courseIdx = Math.floor((r * 32 + cy2) / COURSE);
      const stag = courseIdx % 2 === 0;
      const j1 = (stag ? 10 : 5)  + (s2 % 4);
      const j2 = (stag ? 22 : 17) + (s3 % 4);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(px + j1, py + cy2 + 1, 1, ch - 1);
      ctx.fillRect(px + j2, py + cy2 + 1, 1, ch - 1);

      // Per-block brightness nudge
      const ci = Math.floor(cy2 / COURSE);
      if ((s4 + ci) % 4 === 0) {
        ctx.fillStyle = (s1 + ci) % 2 === 0
          ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
        const bfw = j1 - 2;
        if (bfw > 2) ctx.fillRect(px + 1, py + cy2 + 1, bfw, ch - 1);
      }
    }
  }

  _drawTileDetail(ctx, tile, px, py, c, r, world) {
    const s1 = (c * 7  + r * 13) % 17;
    const s2 = (c * 11 + r * 7)  % 19;
    const s3 = (c * 13 + r * 11) % 23;

    // ── Base terrain ──────────────────────────────────────

    if (tile === TILES.GRASS) {
      if (s1 % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(px, py, 16, 16); }
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 3  + (s1 * 3 % 12), py + 10 + (s2 % 8), 1, 7);
      ctx.fillRect(px + 10 + (s2 * 2 % 12), py + 5  + (s1 % 8), 1, 9);
      ctx.fillRect(px + 22 + (s3 % 8),      py + 12 + (s2 % 6), 1, 6);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 16 + (s1 % 8),      py + 8  + (s3 % 8), 1, 7);
      if (s1 % 5 === 0) { ctx.fillStyle = '#8a8a7a'; ctx.fillRect(px + 5 + (s3 * 3 % 18), py + (s2 * 5 % 18), 2, 2); }
      if (s2 % 9 === 0) { ctx.fillStyle = '#ffdd44'; ctx.fillRect(px + 12 + (s3 % 12), py + 14 + (s1 % 8), 2, 2); }
      return;
    }

    if (tile === TILES.DARK_GRASS) {
      const dgBiome = getBiome(c, r);
      if (dgBiome === BIOMES.SWAMP) {
        // Murky swamp undergrowth — dark olive with mud patches
        if (s2 % 3 === 0) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(px + (s1 * 5 % 20), py + (s2 * 5 % 20), 14, 14); }
        ctx.fillStyle = '#3a6a28';
        ctx.fillRect(px + 4  + (s1 * 3 % 12), py + 6  + (s2 % 8), 1, 9);
        ctx.fillRect(px + 12 + (s2 * 2 % 10), py + 2  + (s1 % 8), 2, 11);
        ctx.fillStyle = '#2a4a1a';
        ctx.fillRect(px + 20 + (s3 % 8),      py + 10 + (s2 % 6), 1, 8);
        // Mud puddle
        if (s1 % 4 === 0) { ctx.fillStyle = '#3a2a10'; ctx.fillRect(px + 6 + (s3 % 12), py + 18 + (s2 % 8), 8, 4); }
        // Hanging tendril
        ctx.fillStyle = '#1e4010'; ctx.fillRect(px + 14 + (s2 % 10), py + 4, 1, 12);
      } else if (dgBiome === BIOMES.TUNDRA) {
        // Frost-dusted dark grass — teal-grey tones, frost crystals
        if (s2 % 3 === 0) { ctx.fillStyle = 'rgba(180,210,230,0.08)'; ctx.fillRect(px + (s1 * 5 % 20), py + (s2 * 5 % 20), 14, 14); }
        ctx.fillStyle = '#3a7060';
        ctx.fillRect(px + 4  + (s1 * 3 % 12), py + 6  + (s2 % 8), 1, 9);
        ctx.fillRect(px + 12 + (s2 * 2 % 10), py + 2  + (s1 % 8), 1, 11);
        ctx.fillRect(px + 23 + (s3 % 7),      py + 8  + (s2 % 6), 1, 8);
        // Frost sparkle
        if (s1 % 5 === 0) { ctx.fillStyle = '#c8e8f0'; ctx.fillRect(px + 16 + (s3 % 10), py + 14 + (s2 % 8), 2, 2); }
      } else {
        // Default forest dark grass
        if (s2 % 3 === 0) { ctx.fillStyle = 'rgba(0,0,0,0.09)'; ctx.fillRect(px + (s1 * 5 % 20), py + (s2 * 5 % 20), 14, 14); }
        ctx.fillStyle = '#4aaa3a';
        ctx.fillRect(px + 4  + (s1 * 3 % 12), py + 6  + (s2 % 8), 1, 9);
        ctx.fillRect(px + 12 + (s2 * 2 % 10), py + 2  + (s1 % 8), 1, 11);
        ctx.fillRect(px + 23 + (s3 % 7),      py + 8  + (s2 % 6), 1, 8);
        if (s1 % 7 === 0) {
          ctx.fillStyle = '#cc4444'; ctx.fillRect(px + 18 + (s2 % 8), py + 20 + (s3 % 6), 4, 3);
          ctx.fillStyle = '#ffaaaa'; ctx.fillRect(px + 19 + (s2 % 8), py + 20 + (s3 % 6), 1, 1);
        }
      }
      return;
    }

    if (tile === TILES.DIRT) {
      ctx.fillStyle = s1 % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(px + (s1 * 2 % 18), py + (s2 * 2 % 18), 12, 10);
      ctx.fillStyle = '#a09080';
      ctx.fillRect(px + 4  + (s3 * 5 % 18), py + 8  + (s2 * 3 % 16), 3, 2);
      if (s2 % 3 === 0) { ctx.fillStyle = '#907060'; ctx.fillRect(px + 18 + (s1 % 10), py + 20 + (s3 % 8), 2, 2); }
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(px + 6 + (s1 % 8), py + 16 + (s3 % 8), 10, 2);
      return;
    }

    if (tile === TILES.SAND) {
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(px + 2, py + 7  + (s1 % 3), 28, 1);
      ctx.fillRect(px + 2, py + 15 + (s2 % 3), 26, 1);
      ctx.fillRect(px + 2, py + 22 + (s3 % 3), 24, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(px + 4, py + 10 + (s2 % 2), 20, 1);
      ctx.fillRect(px + 6, py + 18 + (s1 % 2), 16, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(px + (s3 * 7 % 24), py + (s1 * 7 % 24), 2, 1);
      ctx.fillRect(px + (s2 * 7 % 22), py + (s3 * 9 % 24), 1, 2);
      return;
    }

    if (tile === TILES.SAND_DARK) {
      ctx.fillStyle = 'rgba(0,0,0,0.11)';
      ctx.fillRect(px + 2, py + 8  + (s1 % 3), 28, 1);
      ctx.fillRect(px + 2, py + 16 + (s2 % 3), 26, 1);
      ctx.fillRect(px + 2, py + 24 + (s3 % 2), 22, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(px + 4, py + 12 + (s2 % 3), 16, 1);
      if (s1 % 4 === 0) { ctx.fillStyle = '#7a6a44'; ctx.fillRect(px + (s3 * 5 % 20), py + (s2 * 3 % 20), 4, 3); }
      return;
    }

    if (tile === TILES.STONE) {
      // Seed-varied irregular flagstone pattern.
      // A cross of mortar lines divides the tile into 4 unequal slabs.
      const vx = 9  + (s1 % 14);  // vertical mortar x  (9..22)
      const hy = 9  + (s2 % 14);  // horizontal mortar y (9..22)
      const s4 = (c * 19 + r * 3) % 31;

      // Per-quadrant brightness tint (each slab subtly different)
      const tints = [
        'rgba(255,255,255,0.06)', null,
        'rgba(0,0,0,0.05)',       'rgba(255,255,255,0.03)',
      ];
      const order = [s4 % 4, (s4 + 1) % 4, (s4 + 2) % 4, (s4 + 3) % 4];
      const slabs = [
        [1,    1,    vx - 1,  hy - 1 ],
        [vx+1, 1,    31 - vx, hy - 1 ],
        [1,    hy+1, vx - 1,  31 - hy],
        [vx+1, hy+1, 31 - vx, 31 - hy],
      ];

      for (let i = 0; i < 4; i++) {
        const [sx, sy, sw, sh] = slabs[i];
        const tint = tints[order[i]];
        if (tint) { ctx.fillStyle = tint; ctx.fillRect(px + sx, py + sy, sw, sh); }
        // Top + left edge: highlight (stone top face catches light)
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(px + sx, py + sy, sw, 1);
        ctx.fillRect(px + sx, py + sy, 1, sh);
        // Bottom + right edge: shadow
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.fillRect(px + sx,        py + sy + sh - 1, sw, 1);
        ctx.fillRect(px + sx + sw - 1, py + sy,        1,  sh);
      }

      // Mortar joints (dark filled gaps)
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(px + vx, py + 1,  1, 31);   // vertical joint
      ctx.fillRect(px + 1,  py + hy, 31, 1);   // horizontal joint

      // Moss in mortar junction
      if (s1 % 5 === 0) {
        ctx.fillStyle = 'rgba(60,100,35,0.42)';
        ctx.fillRect(px + vx - 1, py + hy - 1, 3, 3);
      }
      // Worn/stained patch on one slab
      if (s3 % 6 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.09)';
        ctx.fillRect(px + vx + 2, py + hy + 2, 4 + (s4 % 6), 3 + (s1 % 4));
      }
      // Occasional chip at a corner
      if (s2 % 9 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + vx - 2, py + hy - 2, 2, 2);
      }
      return;
    }

    if (tile === TILES.WALL) {
      // Neighbour-aware 3D wall rendering.
      // wallBelow=true  → wall continues south: this tile is the walkable top surface (all light).
      // wallBelow=false → southernmost/exposed tile: parapet top + bright ledge + dark face + shadow.
      const s4        = (c * 17 + r * 5) % 29;
      const wallBelow = world && world.getTile(c, r + 1) === TILES.WALL;
      const FACE      = 27;  // last row before cast-shadow zone

      if (wallBelow) {
        // ─── TOP SURFACE (wall continues south — only the top is visible) ──
        // Full tile = warm lit walkway, no face or shadow.
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px, py, 32, 32);
        ctx.fillStyle = 'rgba(255,228,180,0.18)';
        ctx.fillRect(px, py, 32, 32);

        // Full-tile flagstone joints (continuous across stacked tiles)
        const tvx = 9  + (s1 % 14);
        const thy = 5  + (s2 % 22); // spread across full 32px height
        const thy2 = thy + 10 + (s3 % 12);
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.fillRect(px + tvx, py,      1, 32);
        ctx.fillRect(px,       py + thy, 32, 1);
        if (thy2 < 32) ctx.fillRect(px, py + thy2, 32, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.20)';
        ctx.fillRect(px + 1,      py + 1, tvx - 2, 1);
        ctx.fillRect(px + tvx+1,  py + 1, 31 - tvx, 1);
        // Left-edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px, py, 2, 32);

      } else {
        // ─── PARAPET EDGE (southernmost wall tile — face visible below top) ─
        const TOP = 9;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px, py, 32, TOP + 1);
        ctx.fillStyle = 'rgba(255,228,180,0.18)';
        ctx.fillRect(px, py, 32, TOP + 1);

        // Flagstone joints on parapet walkway
        const tvx = 9 + (s1 % 14);
        const thy = 4 + (s2 % 4);
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(px + tvx, py + 1,   1, TOP - 1);
        ctx.fillRect(px + 1,   py + thy, 31, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(px + 1,     py + 1, tvx - 1, 1);
        ctx.fillRect(px + tvx+1, py + 1, 31 - tvx, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px, py + 1, 2, TOP);

        // ─── LEDGE (key 3D edge) ────────────────────────────────
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(px, py + TOP,     32, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(px, py + TOP + 1, 32, 1);

        // Dark wall face below the ledge
        const faceStart = TOP + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(px, py + faceStart, 32, FACE - faceStart);
        this._drawWallCourses(ctx, px, py, faceStart, FACE, r, s1, s2, s3, s4);

        // Occasional crack on face
        if (s2 % 8 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          const crx = 3 + (s4 % 22);
          ctx.fillRect(px + crx, py + 13, 1, 7 + (s1 % 5));
          if (s3 % 2 === 0) ctx.fillRect(px + crx + 1, py + 17, 3, 1);
        }

        // Moss near base of face
        if (s1 % 5 === 0) {
          ctx.fillStyle = 'rgba(48,78,28,0.24)';
          ctx.fillRect(px + (s3 * 5 % 22), py + FACE - 5 + (s2 % 4), 6 + (s2 % 7), 4);
        }

        // ─── CAST SHADOW below the wall face ───────────────────
        ctx.fillStyle = 'rgba(0,0,0,0.50)';
        ctx.fillRect(px, py + FACE,     32, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.26)';
        ctx.fillRect(px, py + FACE + 2, 32, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.fillRect(px, py + FACE + 4, 32, 1);
      }

      // ─── ROOF EAVE (south + east sides rendered from the wall tile) ────────
      // The wall tiles on the south and east sides of a building render AFTER
      // the ROOF tiles, so they can overdraw the eave area into the ROOF tile.
      const EAVE = 14;
      const R0 = 118, G0 = 48, B0 = 22;
      const roofN = world && world.getTile(c, r - 1) === TILES.ROOF; // south eave
      const roofW = world && world.getTile(c - 1, r) === TILES.ROOF; // east eave
      if (roofN) {
        // South-facing eave: extend EAVE px upward into ROOF tile above
        ctx.fillStyle = `rgb(${R0-28},${G0-14},${B0-6})`;
        ctx.fillRect(px - 2, py - EAVE, 36, EAVE);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        for (let i = 0; i <= 4; i++) ctx.fillRect(px - 2 + i * 8, py - EAVE, 1, EAVE);
        ctx.fillStyle = 'rgba(255,190,120,0.10)';
        ctx.fillRect(px, py - EAVE + 2, 32, EAVE - 4);
        ctx.fillStyle = `rgb(${R0-40},${G0-20},${B0-10})`;
        ctx.fillRect(px - 2, py - EAVE, 36, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(px - 2, py - EAVE, 36, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(px - 2, py - 3, 36, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(px - 2, py,     36, 2);
      }
      if (roofW) {
        // East-facing eave: extend EAVE px leftward into ROOF tile to the west
        ctx.fillStyle = `rgb(${R0-28},${G0-14},${B0-6})`;
        ctx.fillRect(px - EAVE, py - 2, EAVE, 36);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        for (let i = 0; i <= 4; i++) ctx.fillRect(px - EAVE, py - 2 + i * 8, EAVE, 1);
        ctx.fillStyle = 'rgba(255,190,120,0.10)';
        ctx.fillRect(px - EAVE + 2, py, EAVE - 4, 32);
        ctx.fillStyle = `rgb(${R0-40},${G0-20},${B0-10})`;
        ctx.fillRect(px - EAVE, py - 2, 3, 36);
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(px - EAVE, py - 2, 2, 36);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(px - 3, py - 2, 3, 36);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(px,     py - 2, 2, 36);
      }

      return;
    }

    if (tile === TILES.DEAD_GRASS) {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4 + (s1 % 8), py + 8); ctx.lineTo(px + 14 + (s1 % 4), py + 18); ctx.lineTo(px + 20 + (s2 % 4), py + 28);
      ctx.stroke();
      if (s2 % 2 === 0) {
        ctx.beginPath(); ctx.moveTo(px + 20 + (s3 % 6), py + 6); ctx.lineTo(px + 14 + (s2 % 4), py + 16); ctx.stroke();
      }
      ctx.fillStyle = '#c0a860';
      ctx.fillRect(px + 6  + (s1 * 3 % 14), py + 4  + (s2 % 10), 1, 7);
      ctx.fillRect(px + 20 + (s2 % 8),      py + 10 + (s3 % 8),  1, 6);
      ctx.fillStyle = '#a09050';
      ctx.fillRect(px + 14 + (s3 % 8),      py + 2  + (s1 % 8),  1, 5);
      ctx.fillStyle = 'rgba(255,255,200,0.06)';
      ctx.fillRect(px + (s1 * 5 % 20), py + (s2 * 5 % 20), 12, 8);
      return;
    }

    if (tile === TILES.ICE) {
      ctx.strokeStyle = 'rgba(180,230,255,0.55)'; ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px + 2,  py + 12 + (s1 % 6));
      ctx.lineTo(px + 14 + (s2 % 6), py + 22);
      ctx.lineTo(px + 26 + (s1 % 4), py + 16 + (s3 % 6));
      ctx.stroke();
      if (s3 % 2 === 0) {
        ctx.beginPath(); ctx.moveTo(px + 20, py + 4 + (s2 % 6)); ctx.lineTo(px + 10 + (s1 % 6), py + 14 + (s3 % 4)); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(px + 4  + (s1 % 6), py + 4  + (s2 % 6), 8, 3);
      ctx.fillRect(px + 18 + (s2 % 4), py + 20 + (s1 % 4), 6, 2);
      if (s1 % 4 === 0) {
        ctx.fillStyle = 'rgba(180,220,255,0.45)';
        ctx.beginPath(); ctx.arc(px + 22 + (s2 % 6), py + 10 + (s3 % 6), 3, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // ── Vegetation ────────────────────────────────────────

    if (tile === TILES.STUMP) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 24, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2e0a';
      ctx.fillRect(px + 9, py + 16, 14, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(px + 11, py + 17, 1, 10);
      ctx.fillRect(px + 15, py + 17, 1, 10);
      ctx.fillRect(px + 19, py + 17, 1, 10);
      ctx.fillStyle = '#7a5520';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 16, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a2e08'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(px + 16, py + 16, 5, 3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(px + 16, py + 16, 3, 2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(px + 16, py + 16, 1, 1, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(px + 12, py + 14, 4, 2);
      return;
    }

    if (tile === TILES.FLOWERS) {
      const flBiome = getBiome(c, r);
      let flColors;
      if (flBiome === BIOMES.TUNDRA) {
        // Pale arctic flowers — whites, pale blues, pale yellows
        flColors = ['#d8eef8', '#eaf4ff', '#f0e8c0', '#c8d8e8', '#ffffff', '#e0d890'];
      } else if (flBiome === BIOMES.SWAMP) {
        // Murky swamp blooms — purples, dark reds, sickly yellows
        flColors = ['#7a3090', '#501828', '#a0a020', '#603060', '#884488', '#606000'];
      } else if (flBiome === BIOMES.DESERT) {
        // Desert wildflowers — hot pinks, oranges, bright yellows
        flColors = ['#ff6030', '#ffb020', '#e83060', '#ffdd00', '#ff8040', '#ffd060'];
      } else {
        // Default bright meadow palette
        flColors = ['#e74c7a', '#f1c40f', '#e67e22', '#9b59b6', '#ffffff', '#ff6699'];
      }
      const stemColor = flBiome === BIOMES.SWAMP ? '#2a4a18' : '#3a7a30';
      for (let i = 0; i < 4; i++) {
        const fx = px + 4 + ((s1 * (i + 1) * 7) % 22);
        const fy = py + 5 + ((s2 * (i + 1) * 5) % 20);
        ctx.fillStyle = stemColor; ctx.fillRect(fx, fy + 4, 1, 5); ctx.fillRect(fx - 1, fy + 6, 2, 1);
        const col = flColors[(s1 + i * 3) % flColors.length];
        ctx.fillStyle = col;
        ctx.fillRect(fx - 1, fy,     3, 1);
        ctx.fillRect(fx - 1, fy + 2, 3, 1);
        ctx.fillRect(fx - 2, fy + 1, 1, 1);
        ctx.fillRect(fx + 2, fy + 1, 1, 1);
        ctx.fillStyle = '#f9e040'; ctx.fillRect(fx, fy + 1, 1, 1);
      }
      return;
    }

    if (tile === TILES.CACTUS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 29, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e5220'; ctx.fillRect(px + 12, py + 6, 8, 24);
      ctx.fillStyle = '#2a6e2a'; ctx.fillRect(px + 15, py + 7, 2, 22);
      ctx.fillStyle = '#1e5220';
      ctx.fillRect(px + 5,  py + 14, 7, 4); ctx.fillRect(px + 5,  py + 10, 5, 4);
      ctx.fillRect(px + 20, py + 12, 7, 4); ctx.fillRect(px + 22, py + 8,  4, 5);
      ctx.fillStyle = '#c8c060';
      for (let sp = 0; sp < 5; sp++) { ctx.fillRect(px + 11, py + 7 + sp * 4, 1, 3); ctx.fillRect(px + 20, py + 9 + sp * 3, 1, 3); }
      ctx.fillRect(px + 6,  py + 12, 3, 1); ctx.fillRect(px + 23, py + 10, 3, 1);
      return;
    }

    // ── Water tiles ───────────────────────────────────────

    if (tile === TILES.WATER) {
      const t = this.time;
      ctx.fillStyle = 'rgba(0,0,40,0.1)';
      ctx.fillRect(px + (s2 * 3 % 20), py + (s1 * 3 % 20), 14, 10);
      const r1y = ((t * 22 + s1 * 9) % 30) | 0;
      const r2y = ((t * 16 + s2 * 9) % 30) | 0;
      ctx.fillStyle = 'rgba(180,230,255,0.22)'; ctx.fillRect(px + 2, py + r1y, 20, 1);
      ctx.fillStyle = 'rgba(180,230,255,0.15)'; ctx.fillRect(px + 8, py + r2y, 16, 1);
      ctx.fillStyle = 'rgba(200,240,255,0.10)';
      ctx.fillRect(px + 4 + (Math.sin(t * 2 + s1) * 4 | 0), py + 14, 10, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px + (s1 % 16), py + 8 + (s2 % 8), 18, 3);
      return;
    }

    if (tile === TILES.SWAMP_WATER) {
      const t = this.time;
      ctx.fillStyle = 'rgba(80,120,60,0.28)';
      ctx.fillRect(px + (s1 % 14), py + 8  + (Math.sin(t + s1) * 3 | 0), 14, 2);
      ctx.fillRect(px + (s2 % 10), py + 20 + (Math.cos(t * 0.8 + s2) * 3 | 0), 12, 2);
      ctx.fillStyle = '#2e6a28';
      ctx.beginPath(); ctx.arc(px + 20, py + 20, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e4a18';
      ctx.beginPath(); ctx.arc(px + 22, py + 22, 2, 0, Math.PI * 2); ctx.fill();
      if (s1 % 3 === 0) {
        ctx.strokeStyle = 'rgba(100,160,80,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px + 8 + (s2 % 8), py + 10 + (s3 % 6), 3, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }

    if (tile === TILES.LAVA) {
      const t = this.time;
      ctx.strokeStyle = 'rgba(255,140,0,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 2,  py + 16 + (s1 % 6));
      ctx.lineTo(px + 12 + (s2 % 6), py + 10 + (s1 % 4));
      ctx.lineTo(px + 26 + (s3 % 4), py + 20 + (s2 % 4));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,0,0.2)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 2,  py + 16 + (s1 % 6));
      ctx.lineTo(px + 12 + (s2 % 6), py + 10 + (s1 % 4));
      ctx.stroke();
      const b1x = px + 8  + (Math.sin(t * 2.5 + s1) * 5 | 0);
      const b1y = py + 14 + (Math.cos(t * 2.0 + s1) * 4 | 0);
      ctx.fillStyle = 'rgba(255,200,0,0.4)'; ctx.beginPath(); ctx.arc(b1x, b1y, 4, 0, Math.PI * 2); ctx.fill();
      const b2x = px + 22 + (Math.sin(t * 1.8 + s2) * 4 | 0);
      const b2y = py + 20 + (Math.cos(t * 2.2 + s2) * 3 | 0);
      ctx.fillStyle = 'rgba(255,100,0,0.3)'; ctx.beginPath(); ctx.arc(b2x, b2y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,80,0,0.12)';
      ctx.fillRect(px, py, 32, 4); ctx.fillRect(px, py + 28, 32, 4);
      return;
    }

    // ── Special environment ───────────────────────────────

    if (tile === TILES.SNOW) {
      const sparkles = [[px + 6 + (s1 % 8), py + 6 + (s2 % 8)], [px + 18 + (s2 % 6), py + 16 + (s1 % 6)], [px + 10 + (s3 % 6), py + 22 + (s2 % 6)]];
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const [sx, sy] of sparkles) { ctx.fillRect(sx - 2, sy, 5, 1); ctx.fillRect(sx, sy - 2, 1, 5); }
      ctx.fillStyle = 'rgba(160,210,255,0.12)'; ctx.fillRect(px + (s1 % 4), py + 20, 28 - (s1 % 4), 8);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px + (s3 * 5 % 26), py + (s1 * 5 % 26), 2, 2);
      ctx.fillRect(px + (s2 * 7 % 24), py + (s3 * 5 % 24), 2, 2);
      return;
    }

    if (tile === TILES.VOLCANIC_ROCK) {
      ctx.strokeStyle = 'rgba(220,80,0,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4 + (s1 % 8), py + 6); ctx.lineTo(px + 14 + (s2 % 6), py + 18); ctx.lineTo(px + 22 + (s3 % 4), py + 28);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 18 + (s2 % 6), py + 4); ctx.lineTo(px + 10 + (s1 % 4), py + 14 + (s3 % 4)); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,140,0,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px + 4 + (s1 % 8), py + 6); ctx.lineTo(px + 14 + (s2 % 6), py + 18); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(px + (s3 * 3 % 20), py + (s1 * 3 % 20), 10, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + (s2 * 3 % 18), py + (s3 * 3 % 18), 12, 10);
      return;
    }

    // ── Bridge ────────────────────────────────────────────

    if (tile === TILES.BRIDGE) {
      ctx.fillStyle = '#b08828'; ctx.fillRect(px, py + 2, TILE_SIZE, 3); ctx.fillRect(px, py + TILE_SIZE - 5, TILE_SIZE, 3);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#9a7418' : '#8b6610';
        ctx.fillRect(px + i * 8, py + 5, 8, TILE_SIZE - 10);
        ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(px + i * 8 + 3, py + 6, 1, TILE_SIZE - 12);
        ctx.fillStyle = '#4a4a4a'; ctx.fillRect(px + i * 8 + 2, py + 6, 2, 2); ctx.fillRect(px + i * 8 + 2, py + TILE_SIZE - 8, 2, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px, py + 5, TILE_SIZE, 3); ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 3);
      return;
    }

    // ── Fish spots ────────────────────────────────────────

    if (tile === TILES.FISH_SPOT || tile === TILES.FISH_SPOT_SALMON || tile === TILES.FISH_SPOT_LOBSTER) {
      const t = this.time;
      const phase  = (t * 1.5 + s1 * 0.5) % 1;
      const phase2 = (t * 1.5 + s1 * 0.5 + 0.5) % 1;
      ctx.strokeStyle = `rgba(160,220,255,${(0.4 * (1 - phase)).toFixed(2)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px + 16, py + 16, 4 + phase * 10, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(160,220,255,${(0.4 * (1 - phase2)).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(px + 16, py + 16, 4 + phase2 * 10, 0, Math.PI * 2); ctx.stroke();
      const bx = px + 10 + (Math.sin(t * 3 + s1) * 5 | 0);
      const by = py + 12 + (Math.cos(t * 2 + s2) * 4 | 0);
      ctx.fillStyle = 'rgba(200,240,255,0.5)';
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + 7, by + 5, 1.5, 0, Math.PI * 2); ctx.fill();
      return;
    }

    // ── Fire ─────────────────────────────────────────────

    if (tile === TILES.FIRE) {
      const t = this.time;
      ctx.fillStyle = 'rgba(255,120,0,0.13)';
      ctx.beginPath(); ctx.arc(px + 16, py + 20, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e0e04'; ctx.fillRect(px + 8, py + 25, 16, 5);
      ctx.fillStyle = '#4e2a0e'; ctx.fillRect(px + 5, py + 22, 22, 5); ctx.fillRect(px + 10, py + 20, 5, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 7,  py + 23, 1, 3); ctx.fillRect(px + 14, py + 23, 1, 3); ctx.fillRect(px + 21, py + 23, 1, 3);
      for (let i = 0; i < 3; i++) {
        const fx = px + 9 + i * 5;
        const flicker = Math.sin(t * 10 + i * 2) * 3;
        const fh = 11 + Math.sin(t * 8 + i) * 4;
        ctx.fillStyle = i === 1 ? '#e67e22' : '#b03020';
        ctx.beginPath(); ctx.moveTo(fx, py + 22); ctx.lineTo(fx + 3 + flicker, py + 22 - fh); ctx.lineTo(fx + 6, py + 22); ctx.fill();
      }
      ctx.fillStyle = '#f39c12';
      ctx.beginPath(); ctx.moveTo(px + 12, py + 22); ctx.lineTo(px + 16, py + 11 + (Math.sin(t * 12) * 2 | 0)); ctx.lineTo(px + 20, py + 22); ctx.fill();
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath(); ctx.moveTo(px + 14, py + 22); ctx.lineTo(px + 16, py + 16 + (Math.sin(t * 15) * 2 | 0)); ctx.lineTo(px + 18, py + 22); ctx.fill();
      for (let e = 0; e < 2; e++) {
        const ex = px + 12 + (Math.sin(t * 7 + e * 3 + s1) * 8 | 0);
        const ey = py + 16 - ((t * 30 + e * 15 + s1 * 5) % 18);
        ctx.fillStyle = `rgba(255,200,0,${(0.8 - ((t * 1.5 + e) % 1) * 0.8).toFixed(2)})`;
        ctx.fillRect(ex, ey, 1, 1);
      }
      return;
    }

    // ── Ore rocks ─────────────────────────────────────────

    const oreData = {
      [TILES.ROCK_COPPER]:   { base: '#8a5228', dark: '#5a2e10', vein: '#cd7f32', shine: '#e8a060' },
      [TILES.ROCK_TIN]:      { base: '#7a8a7a', dark: '#4a5a4a', vein: '#b0c8b0', shine: '#d4ead4' },
      [TILES.ROCK_IRON]:     { base: '#626278', dark: '#424258', vein: '#9090b8', shine: '#c0c0d8' },
      [TILES.ROCK_COAL]:     { base: '#282830', dark: '#181818', vein: '#383838', shine: '#505050' },
      [TILES.ROCK_GOLD]:     { base: '#8a7a20', dark: '#5a5010', vein: '#f1c40f', shine: '#f9e04b' },
      [TILES.ROCK_MITHRIL]:  { base: '#464878', dark: '#262848', vein: '#7b68ee', shine: '#b0a8ff' },
      [TILES.ROCK_SILVER]:   { base: '#707880', dark: '#484e55', vein: '#c8d8e8', shine: '#e8f0f8' },
      [TILES.ROCK_TUNGSTEN]: { base: '#505860', dark: '#303840', vein: '#8898a8', shine: '#aabbc8' },
      [TILES.ROCK_OBSIDIAN]: { base: '#181020', dark: '#0c0814', vein: '#7030a0', shine: '#c060ff' },
      [TILES.ROCK_MOONSTONE]:{ base: '#303848', dark: '#1a2030', vein: '#60c0e0', shine: '#a0e8ff' },
    };
    if (oreData[tile]) {
      const od = oreData[tile];
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 26, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = od.dark;
      ctx.fillRect(px + 4, py + 10, 24, 16); ctx.fillRect(px + 8, py + 8, 16, 2); ctx.fillRect(px + 8, py + 24, 16, 2);
      ctx.fillStyle = od.base;
      ctx.fillRect(px + 6, py + 8, 20, 18);
      ctx.fillRect(px + 4, py + 11, 2, 12); ctx.fillRect(px + 26, py + 11, 2, 12);
      ctx.fillStyle = od.vein;
      ctx.fillRect(px + 8  + (s1 % 4), py + 10, 14, 5);
      ctx.fillRect(px + 12 + (s2 % 4), py + 14, 8,  4);
      ctx.fillStyle = od.shine;
      ctx.fillRect(px + 9  + (s1 % 4), py + 11, 5, 2);
      ctx.fillRect(px + 18,             py + 15, 3, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px + 7, py + 9, 10, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 22, py + 10, 4, 14); ctx.fillRect(px + 6, py + 22, 18, 4);
      return;
    }

    if (tile === TILES.ROCK_DEPLETED) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 26, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#484848'; ctx.fillRect(px + 5, py + 9, 22, 16);
      ctx.fillStyle = '#606060'; ctx.fillRect(px + 7, py + 9, 18, 14);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 9,  py + 11, 3, 8); ctx.fillRect(px + 16, py + 12, 3, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(px + 7, py + 10, 8, 3);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(px + 5,  py + 24, 4, 2); ctx.fillRect(px + 18, py + 25, 4, 2); ctx.fillRect(px + 12, py + 26, 3, 2);
      return;
    }

    // ── Furnace ───────────────────────────────────────────

    if (tile === TILES.FURNACE) {
      // Stone base
      ctx.fillStyle = '#484848'; ctx.fillRect(px + 2, py + 14, 28, 18);
      ctx.fillStyle = '#606060'; ctx.fillRect(px + 4, py + 12, 24, 6);
      // Furnace mouth (arch)
      ctx.fillStyle = '#181010'; ctx.fillRect(px + 8, py + 16, 16, 12);
      ctx.fillStyle = '#0a0808'; ctx.fillRect(px + 10, py + 14, 12, 4);
      // Inner glow — orange/yellow flame colours
      ctx.fillStyle = '#ff6600'; ctx.fillRect(px + 10, py + 18, 12, 8);
      ctx.fillStyle = '#ff9900'; ctx.fillRect(px + 12, py + 18, 8, 5);
      ctx.fillStyle = '#ffdd00'; ctx.fillRect(px + 14, py + 19, 4, 3);
      // Glow spill on stone
      ctx.fillStyle = 'rgba(255,120,0,0.18)'; ctx.fillRect(px + 6, py + 15, 20, 14);
      // Chimney
      ctx.fillStyle = '#404040'; ctx.fillRect(px + 10, py + 2, 12, 11);
      ctx.fillStyle = '#505050'; ctx.fillRect(px + 11, py + 3, 10, 9);
      ctx.fillStyle = '#383030'; ctx.fillRect(px + 8, py + 1, 16, 3);
      // Smoke puffs
      ctx.fillStyle = 'rgba(80,70,60,0.55)';
      ctx.beginPath(); ctx.arc(px + 14, py,     4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 18, py - 2, 3, 0, Math.PI * 2); ctx.fill();
      return;
    }

    // ── Anvil ─────────────────────────────────────────────

    if (tile === TILES.ANVIL) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
      // Base / feet
      ctx.fillStyle = '#303030'; ctx.fillRect(px + 6,  py + 22, 20, 6);
      ctx.fillStyle = '#404040'; ctx.fillRect(px + 8,  py + 21, 16, 2);
      // Waist
      ctx.fillStyle = '#282828'; ctx.fillRect(px + 10, py + 16, 12, 6);
      // Top face
      ctx.fillStyle = '#555555'; ctx.fillRect(px + 5,  py + 10, 22, 7);
      ctx.fillStyle = '#686868'; ctx.fillRect(px + 6,  py + 10, 20, 5);
      // Horn (left)
      ctx.fillStyle = '#484848'; ctx.fillRect(px + 2,  py + 13, 6, 3);
      ctx.fillStyle = '#383838'; ctx.fillRect(px + 1,  py + 14, 4, 2);
      // Highlights
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(px + 6, py + 10, 20, 2);
      ctx.fillRect(px + 2, py + 13, 6, 1);
      // Fresh-hammered glow on top
      ctx.fillStyle = 'rgba(255,160,50,0.08)';
      ctx.fillRect(px + 5, py + 10, 22, 7);
      return;
    }

    // ── Door ─────────────────────────────────────────────

    if (tile === TILES.DOOR) {
      // Stone door surround (arch jambs)
      ctx.fillStyle = '#525252'; ctx.fillRect(px, py, 5, 32);      // left jamb
      ctx.fillStyle = '#525252'; ctx.fillRect(px + 27, py, 5, 32); // right jamb
      ctx.fillStyle = '#484848'; ctx.fillRect(px + 5, py, 22, 4);  // lintel

      // Door frame shadow inside jambs
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.fillRect(px + 1, py + 4, 3, 28);
      ctx.fillRect(px + 28, py + 4, 3, 28);

      // Door planks — two vertical halves, dark aged oak
      ctx.fillStyle = '#2c1a0a'; ctx.fillRect(px + 5, py + 4, 11, 28); // left leaf
      ctx.fillStyle = '#301c0c'; ctx.fillRect(px + 16, py + 4, 11, 28);// right leaf

      // Plank grain lines
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let gx = 7; gx <= 14; gx += 3) ctx.fillRect(px + gx, py + 4, 1, 28);
      for (let gx = 18; gx <= 25; gx += 3) ctx.fillRect(px + gx, py + 4, 1, 28);

      // Horizontal iron straps (reinforcing bands)
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px + 5, py + 8,  22, 3);  // top strap
      ctx.fillRect(px + 5, py + 19, 22, 3);  // mid strap
      ctx.fillRect(px + 5, py + 28, 22, 3);  // bottom strap
      // Strap highlight + shadow
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(px + 5, py + 8,  22, 1);
      ctx.fillRect(px + 5, py + 19, 22, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 5, py + 10, 22, 1);
      ctx.fillRect(px + 5, py + 21, 22, 1);

      // Iron rivets on straps (4 per strap)
      ctx.fillStyle = '#505050';
      for (const ry of [9, 20, 29]) {
        for (const rx of [7, 12, 19, 24]) {
          ctx.fillRect(px + rx, py + ry, 2, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px + rx, py + ry, 1, 1);
          ctx.fillStyle = '#505050';
        }
      }

      // Centre split (gap between the two door leaves)
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px + 15, py + 4, 2, 28);

      // Door knocker / ring on right leaf
      ctx.fillStyle = '#a08000'; ctx.fillRect(px + 22, py + 14, 4, 4);
      ctx.fillStyle = '#c0a000'; ctx.fillRect(px + 23, py + 15, 2, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(px + 22, py + 17, 4, 1);

      // Top shadow (recess at lintel)
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(px + 5, py + 4, 22, 3);
      return;
    }

    // ── Dungeon entrance — top-down ladder into darkness ──
    if (tile === TILES.DUNGEON_ENTRANCE) {
      // Stone frame (drawn over whatever propGroundMap ground was rendered)
      ctx.fillStyle = '#706050';
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#504030';
      ctx.fillRect(px+2, py+2, 28, 28);

      // Dark pit — the hole in the floor
      ctx.fillStyle = '#080404';
      ctx.fillRect(px+4, py+4, 24, 24);

      // Warm glow rising from below (torch/lantern light at the bottom of the shaft)
      const grd = ctx.createRadialGradient(px+16, py+28, 0, px+16, py+28, 16);
      grd.addColorStop(0, 'rgba(200,110,20,0.55)');
      grd.addColorStop(0.6, 'rgba(140,60,10,0.2)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.fillRect(px+4, py+4, 24, 24);

      // Ladder side rails (dark wood)
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(px+9,  py+4, 2, 24);
      ctx.fillRect(px+21, py+4, 2, 24);
      // Rail highlight edge
      ctx.fillStyle = '#7a4820';
      ctx.fillRect(px+9,  py+4, 1, 24);
      ctx.fillRect(px+21, py+4, 1, 24);

      // Ladder rungs — 5 evenly spaced
      for (let i = 0; i < 5; i++) {
        const ry = py + 5 + i * 5;
        ctx.fillStyle = '#6b3c18';
        ctx.fillRect(px+9, ry, 14, 2);
        ctx.fillStyle = '#8a5228';  // top highlight
        ctx.fillRect(px+9, ry, 14, 1);
      }

      // Frame top-edge highlight (lighter stone)
      ctx.fillStyle = '#8a7060';
      ctx.fillRect(px, py, 32, 1);
      ctx.fillRect(px, py, 1, 32);
      // Frame bottom-edge shadow
      ctx.fillStyle = '#302018';
      ctx.fillRect(px, py+31, 32, 1);
      ctx.fillRect(px+31, py, 1, 32);

      return;
    }

    // ── Stairs ───────────────────────────────────────────

    if (tile === TILES.STAIRS) {
      // Stone staircase descending northward (top = deeper, bottom = landing)

      // Dark pit beneath the stairs
      ctx.fillStyle = '#1a1a28'; ctx.fillRect(px + 2, py + 2, 28, 28);

      // 5 stone steps, each narrower as they go deeper
      const stepH = 5;
      for (let i = 0; i < 5; i++) {
        const indent = i * 3;
        const sw = 28 - indent * 2;
        const sx = px + 2 + indent;
        const sy = py + 2 + i * stepH;
        // Step riser face (front of step, lighter — catches overhead light)
        ctx.fillStyle = `rgb(${100 - i * 8},${100 - i * 8},${118 - i * 8})`;
        ctx.fillRect(sx, sy, sw, 2);

        // Step tread (top surface, slightly darker — recessed)
        ctx.fillStyle = `rgb(${80 - i * 6},${80 - i * 6},${96 - i * 6})`;
        ctx.fillRect(sx, sy + 2, sw, stepH - 2);

        // Left + right side shadow
        ctx.fillStyle = `rgba(0,0,0,${0.18 + i * 0.04})`;
        ctx.fillRect(sx, sy, 2, stepH);
        ctx.fillRect(sx + sw - 2, sy, 2, stepH);

        // Step tread highlight (leading edge)
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(sx + 2, sy, sw - 4, 1);

        // Mortar line between tread and riser
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(sx, sy + 2, sw, 1);
      }

      // Stone landing at top (northmost step, flat)
      ctx.fillStyle = '#484860'; ctx.fillRect(px + 17, py + 2, 11, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(px + 17, py + 2, 11, 1);

      // Down-arrow glyph to hint interactivity
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.fillRect(px + 13, py + 27, 6, 2);
      ctx.fillRect(px + 14, py + 29, 4, 2);
      ctx.fillRect(px + 15, py + 31, 2, 1);
      return;
    }

    // ── Roof ─────────────────────────────────────────────
    if (tile === TILES.ROOF) {
      // Clay roof tile palette
      const s4 = (c * 17 + r * 5) % 29;
      const R0 = 118, G0 = 48, B0 = 22;  // warm terracotta base

      // ─── EAVE OVERHANGS (north + west, where neighbours already rendered) ───
      // North: WALL above → extends upward to hide its dark masonry face.
      // West:  WALL left  → extends leftward over the wall's top surface.
      // South + east eaves are drawn FROM those wall tiles (render after ROOF).
      const EAVE = 14;
      const hasNorthWall = world && world.getTile(c, r - 1) === TILES.WALL;
      const hasWestWall  = world && world.getTile(c - 1, r) === TILES.WALL;

      // Shared eave painter — draws a horizontal or vertical eave soffit rect.
      // hx,hy = top-left corner; hw,hh = size; fasciaX,fasciaY = fascia edge.
      // dsx,dsy = drip-shadow position; dsw,dsh = drip shadow size.
      const _eaveH = (ex, ey, ew, eh) => {
        // Soffit (underside colour)
        ctx.fillStyle = `rgb(${R0-28},${G0-14},${B0-6})`;
        ctx.fillRect(ex, ey, ew, eh);
        // Rafter lines across the short axis
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        for (let i = 0; i <= Math.floor(ew / 8); i++) ctx.fillRect(ex + i * 8, ey, 1, eh);
        // Warm bounce light
        ctx.fillStyle = 'rgba(255,190,120,0.10)';
        ctx.fillRect(ex + 2, ey, ew - 4, eh);
        // Fascia board (top/north edge of soffit = front face of eave)
        ctx.fillStyle = `rgb(${R0-40},${G0-20},${B0-10})`;
        ctx.fillRect(ex, ey, ew, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(ex, ey, ew, 2);
        // Drip shadow (bottom/south edge of soffit, where it meets the wall)
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(ex, ey + eh - 3, ew, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(ex, ey + eh, ew, 2);
      };
      const _eaveV = (ex, ey, ew, eh) => {
        ctx.fillStyle = `rgb(${R0-28},${G0-14},${B0-6})`;
        ctx.fillRect(ex, ey, ew, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        for (let i = 0; i <= Math.floor(eh / 8); i++) ctx.fillRect(ex, ey + i * 8, ew, 1);
        ctx.fillStyle = 'rgba(255,190,120,0.10)';
        ctx.fillRect(ex, ey + 2, ew, eh - 4);
        // Fascia (left/west edge)
        ctx.fillStyle = `rgb(${R0-40},${G0-20},${B0-10})`;
        ctx.fillRect(ex, ey, 3, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(ex, ey, 2, eh);
        // Drip shadow (right/east edge, where it meets the main tile)
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(ex + ew - 3, ey, 3, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(ex + ew, ey, 2, eh);
      };

      if (hasNorthWall) _eaveH(px - 2, py - EAVE, 36, EAVE);
      if (hasWestWall)  _eaveV(px - EAVE, py - 2, EAVE, 36);

      // ─── MAIN SHINGLE BODY ──────────────────────────────────────────────────
      // 4 rows of overlapping clay shingles, staggered each row.
      // Rows closer to the eave (south) are slightly darker — less direct light.
      const SH = 8;   // shingle row height (px)
      for (let row = 0; row < 4; row++) {
        const sy     = py + row * SH;
        const off    = (row % 2) * 6;           // stagger alternating rows
        const darker = row * 7;
        const baseR  = R0 - darker + (s1 % 8) - 4;
        const baseG  = G0 - Math.floor(darker / 2);

        // Each shingle is slightly varied in width (8–12px) for hand-crafted look
        let sx = px - 4 + off;
        let col = 0;
        while (sx < px + 32) {
          const sw = 9 + ((col * 3 + row * 5 + s2) % 4);  // 9–12px wide
          const x0 = Math.max(sx, px);
          const x1 = Math.min(sx + sw - 1, px + 31);
          if (x1 > x0) {
            const sw2 = x1 - x0;
            const hue = ((col * 5 + row * 3 + s3) % 9) - 4;

            // Main body — warm terracotta
            ctx.fillStyle = `rgb(${Math.max(40, baseR + hue)},${Math.max(20, baseG)},${B0})`;
            ctx.fillRect(x0, sy, sw2, SH - 1);

            // Convex highlight — top edge catches sky
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(x0, sy, sw2, 2);
            ctx.fillStyle = 'rgba(255,255,255,0.10)';
            ctx.fillRect(x0, sy + 2, sw2, 1);

            // Concave shadow — bottom tucks under next row
            ctx.fillStyle = 'rgba(0,0,0,0.42)';
            ctx.fillRect(x0, sy + SH - 2, sw2, 2);

            // Left seam
            if (sx >= px) {
              ctx.fillStyle = 'rgba(0,0,0,0.28)';
              ctx.fillRect(sx, sy, 1, SH - 1);
              ctx.fillStyle = 'rgba(255,255,255,0.12)';
              ctx.fillRect(sx + 1, sy + 1, 1, SH - 3);
            }
          }
          sx += sw;
          col++;
        }
      }

      // ─── RIDGE CAP (top row — bright, raised, running east–west) ───────────
      // The highest point of the pitched roof; catches the most direct light.
      const ridgeSW = 8;
      for (let i = 0; i < 5; i++) {
        const rx  = px + i * ridgeSW - (s3 % 4);
        const x0r = Math.max(rx, px);
        const x1r = Math.min(rx + ridgeSW - 1, px + 31);
        if (x1r <= x0r) continue;
        const hue = ((i + s4) % 5) - 2;
        // Cap body — noticeably brighter/warmer than field shingles
        ctx.fillStyle = `rgb(${R0 + 18 + hue},${G0 + 8},${B0 + 6})`;
        ctx.fillRect(x0r, py, x1r - x0r, 5);
        // Bright top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.fillRect(x0r, py, x1r - x0r, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x0r, py + 1, x1r - x0r, 1);
        // Cap side seam
        if (rx >= px) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(rx, py, 1, 5);
        }
        // Shadow under cap, into first shingle row
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x0r, py + 5, x1r - x0r, 1);
      }

      // ─── WEATHERING ─────────────────────────────────────────────────────────
      // Lichen/moss patch
      if (s1 % 6 === 0) {
        ctx.fillStyle = 'rgba(70,100,40,0.22)';
        ctx.fillRect(px + (s2 * 5 % 16) + 4, py + (s3 * 4 % 18) + 5, 6 + (s4 % 5), 3);
        ctx.fillStyle = 'rgba(90,120,50,0.12)';
        ctx.fillRect(px + (s2 * 5 % 16) + 5, py + (s3 * 4 % 18) + 6, 4 + (s4 % 3), 1);
      }
      // Cracked/chipped shingle
      if (s2 % 7 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        const cx2 = px + (s3 * 7 % 20) + 4;
        const cy2 = py + (s1 * 5 % 20) + 5;
        ctx.fillRect(cx2, cy2, 5, 1);
        ctx.fillRect(cx2 + 1, cy2 + 1, 3, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(cx2, cy2 - 1, 5, 1);
      }
      // Rain streak / discolouration
      if (s3 % 9 === 0) {
        ctx.fillStyle = 'rgba(80,50,30,0.15)';
        ctx.fillRect(px + (s4 * 7 % 24) + 2, py + 8, 2, 18 + (s1 % 8));
      }

      return;
    }

    // ── Portal — grand 3-tile-wide arch ───────────────────
    if (tile === TILES.PORTAL) {
      const t = this.time;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);

      // Arch geometry: extends 28px left, 28px right, 42px upward from tile top
      const AL = px - 28;   // arch left edge
      const AW = 88;        // total arch width
      const PW = 13;        // pillar width
      const LP = AL + 2;    // left pillar x
      const RP = AL + AW - 2 - PW;  // right pillar x
      const IX = LP + PW;   // portal energy left x
      const IW = RP - IX;   // portal energy width
      const PT = py - 42;   // pillar top y
      const PH = 54;        // pillar height (to py+12)
      const IT = PT + 10;   // energy field top
      const IH = PH - 10;   // energy field height

      // Stone base slab
      ctx.fillStyle = '#2d2320'; ctx.fillRect(AL + 4, py + 16, AW - 8, 16);
      ctx.fillStyle = '#3d3028'; ctx.fillRect(AL,     py + 10, AW,     8);
      ctx.fillStyle = '#4d4036'; ctx.fillRect(AL,     py + 10, AW,     2); // top highlight

      // Left pillar
      ctx.fillStyle = '#2a2422'; ctx.fillRect(LP, PT, PW, PH);
      ctx.fillStyle = '#4a3e3c'; ctx.fillRect(LP, PT,  3, PH);      // lit left edge
      ctx.fillStyle = '#1a1412'; ctx.fillRect(LP + PW - 2, PT, 2, PH); // shadow right
      for (let ly = 4; ly < PH; ly += 9) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(LP, PT + ly, PW, 1);
      }
      // Rune carvings
      const ra = 0.28 + 0.18 * Math.sin(t * 1.5);
      ctx.fillStyle = `rgba(155,75,255,${ra})`;
      ctx.fillRect(LP + 4, PT + 13, 5, 1); ctx.fillRect(LP + 4, PT + 14, 1, 5); ctx.fillRect(LP + 8, PT + 14, 1, 5);
      ctx.fillRect(LP + 4, PT + 25, 5, 1); ctx.fillRect(LP + 6, PT + 26, 1, 5);
      ctx.fillRect(LP + 4, PT + 36, 5, 1); ctx.fillRect(LP + 4, PT + 37, 1, 4); ctx.fillRect(LP + 8, PT + 37, 1, 4); ctx.fillRect(LP + 4, PT + 41, 5, 1);

      // Right pillar (mirror)
      ctx.fillStyle = '#2a2422'; ctx.fillRect(RP, PT, PW, PH);
      ctx.fillStyle = '#4a3e3c'; ctx.fillRect(RP + PW - 3, PT, 3, PH);
      ctx.fillStyle = '#1a1412'; ctx.fillRect(RP, PT, 2, PH);
      for (let ly = 4; ly < PH; ly += 9) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(RP, PT + ly, PW, 1);
      }
      ctx.fillStyle = `rgba(155,75,255,${ra})`;
      ctx.fillRect(RP + 4, PT + 13, 5, 1); ctx.fillRect(RP + 4, PT + 14, 1, 5); ctx.fillRect(RP + 8, PT + 14, 1, 5);
      ctx.fillRect(RP + 4, PT + 25, 5, 1); ctx.fillRect(RP + 6, PT + 26, 1, 5);
      ctx.fillRect(RP + 4, PT + 36, 5, 1); ctx.fillRect(RP + 4, PT + 37, 1, 4); ctx.fillRect(RP + 8, PT + 37, 1, 4); ctx.fillRect(RP + 4, PT + 41, 5, 1);

      // Lintel (horizontal crossbeam connecting pillars)
      const LW = RP + PW - LP;
      ctx.fillStyle = '#2a2422'; ctx.fillRect(LP, PT - 4, LW, 10);
      ctx.fillStyle = '#4a3e3c'; ctx.fillRect(LP, PT - 4, LW,  3);  // top highlight
      ctx.fillStyle = '#1a1412'; ctx.fillRect(LP, PT + 4,  LW,  2); // bottom shadow

      // Keystone at arch peak
      const KX = LP + Math.floor(LW / 2) - 7;
      ctx.fillStyle = '#1e1620'; ctx.fillRect(KX, PT - 11, 14, 8);
      ctx.fillStyle = `rgba(195,120,255,${0.4 + 0.28 * Math.sin(t * 1.9)})`;
      ctx.fillRect(KX + 4, PT -  9, 6, 2);
      ctx.fillRect(KX + 6, PT -  7, 2, 4);

      // Portal energy — dark void + layered glow
      ctx.fillStyle = 'rgba(13,3,34,0.97)';              ctx.fillRect(IX, IT, IW, IH);
      ctx.fillStyle = `rgba(65,22,148,${0.55 + pulse * 0.22})`; ctx.fillRect(IX + 1, IT + 1, IW - 2, IH - 2);
      ctx.fillStyle = `rgba(115,52,205,${0.30 + pulse * 0.22})`; ctx.fillRect(IX + 4, IT + 4, IW - 8, IH - 8);
      ctx.fillStyle = `rgba(185,108,255,${0.14 + pulse * 0.28})`; ctx.fillRect(IX + 8, IT + 8, IW - 16, IH - 16);
      // Bright central flash
      const cW = 8, cH = 12;
      ctx.fillStyle = `rgba(235,200,255,${0.05 + pulse * 0.32})`;
      ctx.fillRect(IX + Math.floor((IW - cW) / 2), IT + Math.floor((IH - cH) / 2), cW, cH);

      // Expanding ripple ring
      const rT = (t * 0.55) % 1;
      if (rT > 0.04) {
        ctx.strokeStyle = `rgba(195,148,255,${(1 - rT) * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          IX + Math.floor((IW - IW * rT) / 2),
          IT + Math.floor((IH - IH * rT) / 2),
          Math.ceil(IW * rT), Math.ceil(IH * rT)
        );
      }

      // Sparkle particles
      for (const [sx, sy, ph] of [
        [IX + 3,           IT + 4,           0.0],
        [IX + IW - 6,      IT + 7,           1.1],
        [IX + 5,           IT + IH - 8,      2.2],
        [IX + IW - 8,      IT + IH - 5,      3.3],
        [IX + IW / 2 | 0,  IT + 3,           4.4],
        [IX + 7,           IT + IH / 2 | 0,  0.8],
        [IX + IW - 10,     IT + IH / 2 | 0,  2.0],
      ]) {
        const a = Math.abs(Math.sin(t * 3.8 + ph));
        ctx.fillStyle = `rgba(228,192,255,${a * 0.9})`;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Floating orbs
      const orbT = t * 0.85;
      const ox1 = IX + IW / 2 + 8 * Math.cos(orbT),      oy1 = IT + IH / 2 + 6 * Math.sin(orbT * 1.3);
      const ox2 = IX + IW / 2 - 6 * Math.cos(orbT * 0.7 + 1), oy2 = IT + IH / 2 - 4 * Math.sin(orbT + 0.5);
      ctx.fillStyle = 'rgba(208,162,255,0.9)'; ctx.fillRect(Math.round(ox1), Math.round(oy1), 3, 3);
      ctx.fillStyle = 'rgba(152,98,228,0.8)';  ctx.fillRect(Math.round(ox2), Math.round(oy2), 2, 2);

      // Inner-edge glow on pillar faces (where energy meets stone)
      ctx.fillStyle = `rgba(125,56,235,${0.32 + pulse * 0.2})`;
      ctx.fillRect(LP + PW - 1, IT, 2, IH);
      ctx.fillRect(RP - 1,      IT, 2, IH);

      // Ground glow
      ctx.fillStyle = `rgba(85,38,185,${0.18 + pulse * 0.10})`;
      ctx.fillRect(AL + 8, py + 10, AW - 16, 8);

      return;
    }

    // ── Plank floor (inside player house) ────────────────
    if (tile === TILES.PLANK) {
      // Warm base
      ctx.fillStyle = '#7a4e22'; ctx.fillRect(px, py, 32, 32);

      // 4 plank boards running east–west
      const boardH = 8, gap = 1;
      const planks = ['#8b5c2a','#7e5224','#966030','#7a4c20'];
      for (let i = 0; i < 4; i++) {
        const by2 = py + i * (boardH + gap);
        ctx.fillStyle = planks[i % planks.length];
        ctx.fillRect(px, by2, 32, boardH);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px, by2, 32, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px, by2 + boardH - 1, 32, 1);
      }
      if ((c + r) % 5 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.ellipse(px + ((c * 7 + r * 3) % 20) + 6, py + 4, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // ── PATH — worn cobblestone village path ─────────────────────────────
    if (tile === TILES.PATH) {
      // Mortar/sand base
      ctx.fillStyle = '#4e4840'; ctx.fillRect(px, py, 32, 32);
      // Two rows of cobblestones, pattern staggered by tile coordinate
      const even = (c + r) % 2 === 0;
      const stones = even
        ? [[1,1,9,14],[11,1,9,14],[22,1,9,14],[1,17,14,14],[17,17,14,14]]
        : [[5,1,9,14],[16,1,14,14],[1,17,9,14],[11,17,9,14],[21,17,10,14]];
      stones.forEach(([sx, sy, sw, sh], i) => {
        const hue = ((c * 7 + r * 5 + i * 13) % 24) - 12;
        const L   = 108 + hue;
        ctx.fillStyle = `rgb(${L+8},${L+2},${L-6})`; ctx.fillRect(px+sx, py+sy, sw, sh);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px+sx+1, py+sy+1, sw-2, 2);
        ctx.fillRect(px+sx+1, py+sy+1, 2, sh-3);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(px+sx+1, py+sy+sh-2, sw-2, 2);
        ctx.fillRect(px+sx+sw-2, py+sy+2, 2, sh-4);
      });
      if (s2 % 6 === 0) {
        ctx.fillStyle = 'rgba(55,80,30,0.28)';
        ctx.fillRect(px+(s3%26)+2, py+(s1%26)+2, 2, 2);
      }
      return;
    }

    // ── PLASTER_WALL — half-timber cottage wall ────────────────────────
    if (tile === TILES.PLASTER_WALL) {
      const wallBelow = world && world.getTile(c, r + 1) === TILES.PLASTER_WALL;

      if (wallBelow) {
        // Top surface — cream plank boarding viewed from above
        const L = 196 + (s1 % 12) - 6;
        ctx.fillStyle = `rgb(${L+6},${L},${L-12})`; ctx.fillRect(px, py, 32, 32);
        ctx.fillStyle = 'rgba(60,30,10,0.14)';
        ctx.fillRect(px, py, 32, 2);
        ctx.fillRect(px, py + 18, 32, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px+2, py+3, 28, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px, py, 3, 32);
      } else {
        // Southernmost face — plaster + timber frame cottage front
        const TOP = 9;
        const L   = 196 + (s1 % 12) - 6;
        // Top walkway surface
        ctx.fillStyle = `rgb(${L+6},${L},${L-12})`; ctx.fillRect(px, py, 32, TOP + 1);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px, py, 32, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(px, py, 3, TOP + 1);
        // Ledge
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px, py + TOP, 32, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px, py + TOP + 1, 32, 1);
        // Plaster face
        const fY = TOP + 2;
        ctx.fillStyle = `rgb(${L+6},${L},${L-12})`; ctx.fillRect(px, py+fY, 32, 32-fY-5);
        // Timber frame posts + beams
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(px,    py+fY, 2, 32-fY-5);   // left post
        ctx.fillRect(px+30, py+fY, 2, 32-fY-5);   // right post
        ctx.fillRect(px,    py+fY, 32, 2);         // top beam
        ctx.fillRect(px,    py+fY+8, 32, 2);       // mid beam
        // Diagonal brace (left panel)
        ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px+2, py+fY+8); ctx.lineTo(px+13, py+fY+2); ctx.stroke();
        // Small casement window (right panel)
        ctx.fillStyle = '#1a2830'; ctx.fillRect(px+17, py+fY+2, 11, 7);
        ctx.fillStyle = 'rgba(120,185,230,0.38)';
        ctx.fillRect(px+18, py+fY+3, 4, 5);
        ctx.fillRect(px+24, py+fY+3, 3, 5);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(px+22, py+fY+2, 1, 7);   // window divider
        ctx.fillRect(px+17, py+fY+5, 11, 1);  // window sill
        // Cast shadow below face
        ctx.fillStyle = 'rgba(0,0,0,0.52)'; ctx.fillRect(px, py+27, 32, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.24)'; ctx.fillRect(px, py+29, 32, 2);
      }

      return;
    }

    // ── THATCH_ROOF — golden straw thatching ──────────────────────────
    if (tile === TILES.THATCH_ROOF) {
      const s4 = (c * 17 + r * 5) % 29;
      const R0 = 192, G0 = 148, B0 = 56;  // golden straw base

      // Eave overhangs into adjacent PLASTER_WALL tiles
      const EAVE = 12;
      const _eaveH = (ex, ey, ew, eh) => {
        ctx.fillStyle = `rgb(${R0-20},${G0-10},${B0-4})`; ctx.fillRect(ex, ey, ew, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i <= Math.floor(ew/8); i++) ctx.fillRect(ex+i*8, ey, 1, eh);
        ctx.fillStyle = 'rgba(255,210,120,0.10)'; ctx.fillRect(ex+2, ey, ew-4, eh);
        ctx.fillStyle = `rgb(${R0-32},${G0-16},${B0-8})`; ctx.fillRect(ex, ey, ew, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.40)'; ctx.fillRect(ex, ey, ew, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ex, ey+eh-3, ew, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(ex, ey+eh, ew, 2);
      };
      const _eaveV = (ex, ey, ew, eh) => {
        ctx.fillStyle = `rgb(${R0-20},${G0-10},${B0-4})`; ctx.fillRect(ex, ey, ew, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = 0; i <= Math.floor(eh/8); i++) ctx.fillRect(ex, ey+i*8, ew, 1);
        ctx.fillStyle = 'rgba(255,210,120,0.10)'; ctx.fillRect(ex, ey+2, ew, eh-4);
        ctx.fillStyle = `rgb(${R0-32},${G0-16},${B0-8})`; ctx.fillRect(ex, ey, 3, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.40)'; ctx.fillRect(ex, ey, 2, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ex+ew-3, ey, 3, eh);
        ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(ex+ew, ey, 2, eh);
      };
      const hasPW_N = world && world.getTile(c, r-1) === TILES.PLASTER_WALL;
      const hasPW_W = world && world.getTile(c-1, r) === TILES.PLASTER_WALL;
      if (hasPW_N) _eaveH(px-2, py-EAVE, 36, EAVE);
      if (hasPW_W) _eaveV(px-EAVE, py-2, EAVE, 36);

      // Main thatch body — 4 rows of straw bundles
      const SH = 8;
      for (let row = 0; row < 4; row++) {
        const sy      = py + row * SH;
        const off     = (row % 2) * 5;
        const darker  = row * 9;
        const bR      = R0 - darker + (s1 % 6) - 3;
        const bG      = G0 - Math.floor(darker * 0.6);
        let sx = px - 3 + off;
        let col2 = 0;
        while (sx < px + 32) {
          const sw = 8 + ((col2 * 3 + row * 5 + s2) % 4);
          const x0 = Math.max(sx, px);
          const x1 = Math.min(sx + sw - 1, px + 31);
          if (x1 > x0) {
            const sw2 = x1 - x0;
            const hue = ((col2 * 7 + row * 3 + s3) % 9) - 4;
            ctx.fillStyle = `rgb(${Math.max(40,bR+hue)},${Math.max(20,bG)},${B0})`;
            ctx.fillRect(x0, sy, sw2, SH - 1);
            ctx.fillStyle = 'rgba(255,240,180,0.28)';
            ctx.fillRect(x0, sy, sw2, 2);
            ctx.fillStyle = 'rgba(255,240,180,0.12)';
            ctx.fillRect(x0, sy + 2, sw2, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(x0, sy + SH - 2, sw2, 2);
            if (sx >= px) {
              ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(sx, sy, 1, SH - 1);
              ctx.fillStyle = 'rgba(255,255,200,0.14)'; ctx.fillRect(sx+1, sy+1, 1, SH-3);
            }
          }
          sx += sw; col2++;
        }
      }

      // Ridge cap — bright dense bundles at top
      const ridgeSW = 7;
      for (let i = 0; i < 6; i++) {
        const rx  = px + i * ridgeSW - (s3 % 3);
        const x0r = Math.max(rx, px);
        const x1r = Math.min(rx + ridgeSW - 1, px + 31);
        if (x1r <= x0r) continue;
        const hue = ((i + s4) % 5) - 2;
        ctx.fillStyle = `rgb(${R0+20+hue},${G0+12},${B0+8})`;
        ctx.fillRect(x0r, py, x1r - x0r, 5);
        ctx.fillStyle = 'rgba(255,255,220,0.36)'; ctx.fillRect(x0r, py, x1r-x0r, 1);
        ctx.fillStyle = 'rgba(255,255,220,0.16)'; ctx.fillRect(x0r, py+1, x1r-x0r, 1);
        if (rx >= px) { ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(rx, py, 1, 5); }
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x0r, py+5, x1r-x0r, 1);
      }

      // Weathering — occasional damp discolouration patch
      if (s1 % 5 === 0) {
        ctx.fillStyle = 'rgba(100,70,20,0.22)';
        ctx.fillRect(px+(s2*5%16)+4, py+(s3*4%18)+5, 5+(s4%4), 3);
      }

      return;
    }

    // ── FENCE — wooden picket fence ───────────────────────────────────
    if (tile === TILES.FENCE) {
      // Horizontal rails
      ctx.fillStyle = '#6b4520';
      ctx.fillRect(px, py+10, 32, 3);   // top rail
      ctx.fillRect(px, py+21, 32, 3);   // bottom rail
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(px, py+10, 32, 1);
      ctx.fillRect(px, py+21, 32, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px, py+12, 32, 1);
      ctx.fillRect(px, py+23, 32, 1);

      // Vertical pickets (4 per tile, evenly spaced, pointed tops)
      [1, 9, 17, 25].forEach(pxo => {
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(px+pxo, py+6, 5, 22);
        ctx.fillStyle = '#8a5e30';
        ctx.fillRect(px+pxo+1, py+3, 3, 4);
        ctx.fillRect(px+pxo+2, py+1, 1, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px+pxo, py+6, 1, 22);
        ctx.fillRect(px+pxo+1, py+3, 1, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(px+pxo+4, py+6, 1, 22);
      });

      return;
    }

    // ── WELL — stone village well ─────────────────────────────────────
    if (tile === TILES.WELL) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(px+16, py+27, 11, 5, 0, 0, Math.PI*2); ctx.fill();

      // Stone surround top face
      ctx.fillStyle = '#8a7a6a';
      ctx.beginPath(); ctx.ellipse(px+16, py+19, 10, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#101820'; // dark water hole
      ctx.beginPath(); ctx.ellipse(px+16, py+19, 7, 3, 0, 0, Math.PI*2); ctx.fill();

      // Well shaft side (below top face)
      ctx.fillStyle = '#686058';
      ctx.beginPath(); ctx.ellipse(px+16, py+24, 10, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(30,90,140,0.55)'; // water sheen inside
      ctx.beginPath(); ctx.ellipse(px+16, py+24, 5, 2, 0, 0, Math.PI*2); ctx.fill();

      // Stone course line on shaft
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(px+16, py+22, 10, 4, 0, 0.1, Math.PI-0.1); ctx.stroke();

      // Wooden upright posts
      ctx.fillStyle = '#4a3010';
      ctx.fillRect(px+5,  py+10, 4, 14);
      ctx.fillRect(px+23, py+10, 4, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(px+5,  py+10, 1, 14);
      ctx.fillRect(px+23, py+10, 1, 14);

      // Crossbeam
      ctx.fillStyle = '#5a3c18';
      ctx.fillRect(px+3, py+8, 26, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(px+3, py+8, 26, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px+3, py+11, 26, 1);

      // Rope and bucket
      ctx.fillStyle = '#c8a858'; ctx.fillRect(px+15, py+12, 2, 9);
      ctx.fillStyle = '#6b4a20'; ctx.fillRect(px+13, py+20, 6, 5);
      ctx.fillStyle = '#8b6028'; ctx.fillRect(px+13, py+20, 6, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px+13, py+24, 6, 1);

      // Post bases
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(px+4, py+22, 6, 3);
      ctx.fillRect(px+22, py+22, 6, 3);

      return;
    }

    // ── BARREL — wooden storage barrel ───────────────────────────────
    if (tile === TILES.BARREL) {
      const bX = 8, bY = 6, bW = 16, bH = 22;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(px+bX+bW/2, py+bY+bH+2, bW/2, 3, 0, 0, Math.PI*2); ctx.fill();

      // Stave body
      ctx.fillStyle = '#6b3a18'; ctx.fillRect(px+bX, py+bY, bW, bH);
      // Stave lines
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 3; i < bW; i += 4) ctx.fillRect(px+bX+i, py+bY, 1, bH);
      // Side shadows
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.fillRect(px+bX, py+bY, 2, bH);
      ctx.fillRect(px+bX+bW-2, py+bY, 2, bH);

      // Metal hoops
      [bY+1, Math.floor(bY+bH/2)-1, bY+bH-3].forEach(hy => {
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px+bX-1, py+hy, bW+2, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(px+bX-1, py+hy, bW+2, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(px+bX-1, py+hy+2, bW+2, 1);
      });

      // Top face
      ctx.fillStyle = '#8a5028';
      ctx.beginPath(); ctx.ellipse(px+bX+bW/2, py+bY, bW/2, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.ellipse(px+bX+bW/2, py+bY-1, bW/2-2, 2, 0, 0, Math.PI*2); ctx.fill();

      return;
    }

    // ── SIGN — wooden directional signpost ────────────────────────────
    if (tile === TILES.SIGN) {
      // Post
      ctx.fillStyle = '#5a3810';
      ctx.fillRect(px+14, py+16, 4, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px+14, py+16, 1, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.20)'; ctx.fillRect(px+17, py+16, 1, 16);
      ctx.fillStyle = '#3a2408'; ctx.fillRect(px+13, py+28, 6, 4);

      // Sign board (two plank layers)
      ctx.fillStyle = '#7a5020'; ctx.fillRect(px+5, py+4, 22, 13);
      ctx.fillStyle = '#6a4418'; ctx.fillRect(px+5, py+4,  22, 2);
      ctx.fillStyle = '#8a5c28'; ctx.fillRect(px+5, py+8,  22, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px+5, py+4, 22, 1);
      // Board frame
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(px+5, py+4, 22, 1); ctx.fillRect(px+5, py+16, 22, 1);
      ctx.fillRect(px+5, py+4, 1, 13); ctx.fillRect(px+26, py+4, 1, 13);
      // Nail heads
      ctx.fillStyle = '#505050';
      [[6,5],[25,5],[6,15],[25,15]].forEach(([nx,ny]) => {
        ctx.fillRect(px+nx, py+ny, 2, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px+nx, py+ny, 1, 1);
        ctx.fillStyle = '#505050';
      });
      // Custom label text or default arrow on sign face
      const label = world?.signLabels?.get(`${c},${r}`);
      if (label) {
        ctx.save();
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(30,15,0,0.75)';
        ctx.fillText(label, px + 16, py + 11);
        ctx.fillStyle = 'rgba(220,170,55,0.95)';
        ctx.fillText(label, px + 16, py + 10);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(200,160,60,0.85)';
        ctx.fillRect(px+8,  py+9, 9, 2);
        ctx.fillRect(px+15, py+7, 2, 6);
        ctx.fillRect(px+16, py+8, 2, 4);
        ctx.fillRect(px+17, py+9, 2, 2);
      }

      return;
    }

    // ── Farming patch tiles ───────────────────────────────────────────────
    if (tile === TILES.FARM_PATCH || tile === TILES.FARM_PATCH_SEEDED ||
        tile === TILES.FARM_PATCH_GROWING || tile === TILES.FARM_PATCH_READY) {
      const T = TILE_SIZE;
      // Base soil
      ctx.fillStyle = tile === TILES.FARM_PATCH_READY ? '#4a6a1a' : '#6b4e2a';
      ctx.fillRect(px, py, T, T);
      // Furrow lines (horizontal ridges)
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 3 + i * 7, T, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 5 + i * 7, T, 1);

      if (tile === TILES.FARM_PATCH_SEEDED) {
        // Small seed bumps
        ctx.fillStyle = '#c8a050';
        const bumps = [[8,8],[22,14],[14,22],[26,24],[6,26]];
        for (const [bx, by] of bumps) {
          ctx.beginPath(); ctx.arc(px + bx, py + by, 2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (tile === TILES.FARM_PATCH_GROWING) {
        // Small green sprouts
        ctx.strokeStyle = '#4a9a30'; ctx.lineWidth = 1.5;
        const sprouts = [[8,24],[16,18],[24,22],[12,14],[22,8]];
        for (const [sx2, sy] of sprouts) {
          ctx.beginPath();
          ctx.moveTo(px + sx2, py + sy + 6);
          ctx.quadraticCurveTo(px + sx2 - 3, py + sy + 2, px + sx2, py + sy);
          ctx.stroke();
          ctx.fillStyle = '#5ab040';
          ctx.beginPath(); ctx.ellipse(px + sx2, py + sy, 3, 2, -0.5, 0, Math.PI * 2); ctx.fill();
        }
      } else if (tile === TILES.FARM_PATCH_READY) {
        // Lush plants with bright leaves
        ctx.fillStyle = '#2a5a10';
        ctx.fillRect(px, py, T, T);
        for (let i = 0; i < 3; i++) ctx.fillRect(px, py + 4 + i * 9, T, 1);
        const plants = [[6,24],[16,16],[26,22],[10,10],[24,8]];
        for (const [bx, by] of plants) {
          ctx.strokeStyle = '#3a7a20'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(px+bx, py+by+7); ctx.lineTo(px+bx, py+by); ctx.stroke();
          ctx.fillStyle = '#6acd40';
          ctx.beginPath(); ctx.ellipse(px+bx-3, py+by+1, 4, 2, -0.7, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+bx+3, py+by+2, 4, 2,  0.7, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#90e050';
          ctx.beginPath(); ctx.ellipse(px+bx, py+by, 3, 2, 0, 0, Math.PI*2); ctx.fill();
        }
      }
      return;
    }

    // ── Furniture tiles (floor drawn by PROP_TILES path; just draw the sprite) ─
    const FURN_SET = new Set([
      TILES.FURN_CHAIR, TILES.FURN_RUG, TILES.FURN_TABLE,
      TILES.FURN_CHEST, TILES.FURN_BOOKSHELF, TILES.FURN_PLANT,
      TILES.FURN_BED, TILES.FURN_BENCH,
    ]);
    if (FURN_SET.has(tile)) {
      const rot = world.getRotation ? world.getRotation(c, r) : 0;
      ctx.save();
      ctx.translate(px, py);
      this._drawFurnitureSprite(ctx, tile, rot);
      ctx.restore();
      return;
    }
  }

  /**
   * Draw a furniture sprite in 0-31 local coordinate space.
   * Each of the 4 rotations is a hand-drawn perspective-correct variant —
   * no canvas rotation is used.
   *
   * Perspective convention (fixed for all sprites):
   *   North = top of tile  = far from viewer
   *   South = bottom       = close to viewer
   *   Top faces: lightest   South faces: medium   East/West: slightly dark
   */
  _drawFurnitureSprite(ctx, tile, rot) {
    const T = TILES;

    // ── RUG ─────────────────────────────────────────────────
    // Flat textile — symmetric; fringe orientation follows rot
    if (tile === T.FURN_RUG) {
      const horiz = (rot === 0 || rot === 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(2,2,28,28);
      ctx.fillStyle = '#8b1010'; ctx.fillRect(1,1,28,28);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(3,3,24,24);
      ctx.fillStyle = '#d04030'; ctx.fillRect(5,5,20,20);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(9,9,12,12);
      ctx.fillStyle = '#d4a000'; ctx.fillRect(12,12,6,6);
      ctx.fillStyle = '#8b1010';
      if (horiz) {
        for (let i = 0; i < 6; i++) { ctx.fillRect(3+i*4,0,2,2); ctx.fillRect(3+i*4,29,2,2); }
      } else {
        for (let i = 0; i < 6; i++) { ctx.fillRect(0,3+i*4,2,2); ctx.fillRect(29,3+i*4,2,2); }
      }
      return;
    }

    // ── CHAIR ───────────────────────────────────────────────
    if (tile === T.FURN_CHAIR) {
      const shadow = () => { ctx.fillStyle='rgba(0,0,0,0.2)'; };
      const legDk  = '#2e1008';
      const legMd  = '#4a2808';
      const topFace  = '#c8844a';  // seat / backrest top (lightest)
      const sthFace  = '#7a4a20';  // south-facing vertical face
      const bkFace   = '#5a3010';  // backrest south face (medium)
      const cush     = '#c0392b';
      const cushDk   = '#8b1a14';
      const bkTop    = '#9a6a3a';  // backrest top face

      if (rot === 0) {
        // Backrest = north (top). Standard view.
        shadow(); ctx.fillRect(4,25,24,5);
        // Back legs
        ctx.fillStyle=legDk; ctx.fillRect(4,2,4,18); ctx.fillRect(24,2,4,18);
        // Backrest top face (we look over it slightly)
        ctx.fillStyle=bkTop; ctx.fillRect(2,2,28,5);
        // Backrest south face (faces viewer)
        ctx.fillStyle=bkFace; ctx.fillRect(2,7,28,7);
        // Highlight on backrest top edge
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(2,2,28,1);
        // Seat top face
        ctx.fillStyle=topFace; ctx.fillRect(2,14,28,10);
        // Cushion on seat
        ctx.fillStyle=cush; ctx.fillRect(4,13,24,9); ctx.fillStyle=cushDk; ctx.fillRect(4,21,24,2);
        // Seat south face (front edge facing viewer)
        ctx.fillStyle=sthFace; ctx.fillRect(2,24,28,4);
        // Front legs (below seat, south side)
        ctx.fillStyle=legMd; ctx.fillRect(4,22,4,6); ctx.fillRect(24,22,4,6);

      } else if (rot === 1) {
        // Backrest = east (right). Seat occupies left 2/3; backrest panel on right.
        shadow(); ctx.fillRect(4,25,24,5);
        // Far-left back leg (north-west corner, partially behind seat)
        ctx.fillStyle=legDk; ctx.fillRect(3,2,4,12);
        // Front-left leg (south-west)
        ctx.fillStyle=legMd; ctx.fillRect(3,22,4,6);
        // Seat top face (left area)
        ctx.fillStyle=topFace; ctx.fillRect(2,12,22,12);
        // Cushion
        ctx.fillStyle=cush; ctx.fillRect(4,12,18,10); ctx.fillStyle=cushDk; ctx.fillRect(4,21,18,2);
        // Seat south face
        ctx.fillStyle=sthFace; ctx.fillRect(2,24,22,4);
        // Right back leg (behind backrest)
        ctx.fillStyle=legDk; ctx.fillRect(24,2,4,26);
        // Backrest top face (upper-right; we look down onto it)
        ctx.fillStyle=bkTop; ctx.fillRect(20,2,10,12);
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(20,2,10,1);
        // Backrest south face (bottom of backrest panel, faces viewer)
        ctx.fillStyle=bkFace; ctx.fillRect(20,14,8,12);
        // Backrest east face (right edge, darkest — faces away to the right)
        ctx.fillStyle='#3a1808'; ctx.fillRect(28,2,3,26);

      } else if (rot === 2) {
        // Backrest = south (bottom). Backrest closest to viewer — dominates.
        shadow(); ctx.fillRect(4,25,24,5);
        // Front legs (now on south side = bottom, closest)
        ctx.fillStyle=legDk; ctx.fillRect(4,18,4,10); ctx.fillRect(24,18,4,10);
        // Seat top face (partially visible above/behind backrest)
        ctx.fillStyle=topFace; ctx.fillRect(2,4,28,12);
        // Cushion (visible on seat top)
        ctx.fillStyle=cush; ctx.fillRect(4,4,24,9); ctx.fillStyle=cushDk; ctx.fillRect(4,12,24,2);
        // Seat north face (thin — faces away from viewer, barely visible)
        ctx.fillStyle='#6a3818'; ctx.fillRect(2,4,28,2);
        // Backrest top face (we look over it from the south)
        ctx.fillStyle=bkTop; ctx.fillRect(2,14,28,5);
        ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(2,14,28,1);
        // Backrest south face (front of backrest, faces us directly — prominent)
        ctx.fillStyle=bkFace; ctx.fillRect(2,19,28,8);
        // Back legs (now north side = top, far from viewer, thin/dark)
        ctx.fillStyle=legDk; ctx.fillRect(4,2,4,4); ctx.fillRect(24,2,4,4);

      } else { // rot === 3
        // Backrest = west (left). Mirror of rot=1.
        shadow(); ctx.fillRect(4,25,24,5);
        // Left back leg (behind backrest)
        ctx.fillStyle=legDk; ctx.fillRect(4,2,4,26);
        // Backrest top face (upper-left)
        ctx.fillStyle=bkTop; ctx.fillRect(2,2,10,12);
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(2,2,10,1);
        // Backrest south face
        ctx.fillStyle=bkFace; ctx.fillRect(4,14,8,12);
        // Backrest west face (left edge, darkest)
        ctx.fillStyle='#3a1808'; ctx.fillRect(0,2,3,26);
        // Seat top face (right area)
        ctx.fillStyle=topFace; ctx.fillRect(10,12,20,12);
        // Cushion
        ctx.fillStyle=cush; ctx.fillRect(12,12,16,10); ctx.fillStyle=cushDk; ctx.fillRect(12,21,16,2);
        // Seat south face
        ctx.fillStyle=sthFace; ctx.fillRect(10,24,20,4);
        // Far-right back leg (north-east corner)
        ctx.fillStyle=legDk; ctx.fillRect(25,2,4,12);
        // Front-right leg (south-east)
        ctx.fillStyle=legMd; ctx.fillRect(25,22,4,6);
      }
      return;
    }

    // ── TABLE ───────────────────────────────────────────────
    // 4-legged table — symmetric, but apron face shifts with rotation
    if (tile === T.FURN_TABLE) {
      // Common elements for all rotations
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(4,25,24,5); // shadow
      // Back legs (always at top/north = far, darker)
      ctx.fillStyle='#3a1808';
      ctx.fillRect(4,8,4,16); ctx.fillRect(24,8,4,16);
      // Front legs (bottom/south = near, lighter)
      ctx.fillStyle='#5a3010';
      ctx.fillRect(4,17,4,10); ctx.fillRect(24,17,4,10);
      // Table top surface (always visible)
      ctx.fillStyle='#d09050'; ctx.fillRect(2,6,28,12);
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(2,6,28,1);
      // Wood grain
      ctx.fillStyle='rgba(0,0,0,0.08)';
      for (let gx=8; gx<28; gx+=8) ctx.fillRect(gx,7,1,10);
      // South-facing apron (always at bottom of top surface, faces viewer)
      ctx.fillStyle='#7a4820'; ctx.fillRect(4,18,24,4);
      // Side aprons (east/west faces — slightly darker)
      if (rot === 0 || rot === 2) {
        ctx.fillStyle='#6a3a18'; ctx.fillRect(2,10,4,8); ctx.fillRect(26,10,4,8);
      } else {
        // rot=1/3: show north/south aprons more — same look, just different emphasis
        ctx.fillStyle='#6a3a18'; ctx.fillRect(2,10,4,8); ctx.fillRect(26,10,4,8);
        ctx.fillStyle='#553010'; ctx.fillRect(4,6,24,3); // top apron strip (north face, barely visible)
      }
      return;
    }

    // ── CHEST ───────────────────────────────────────────────
    if (tile === T.FURN_CHEST) {
      const bodyFront = '#8b5020', bodyTop = '#b87030', bodyDark = '#5a2808';
      const brass = '#d4a017', gold = '#f1c40f';

      if (rot === 0) {
        // Front of chest faces south (viewer). Standard view.
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(4,26,24,4);
        ctx.fillStyle=bodyDark; ctx.fillRect(2,18,4,10); ctx.fillRect(26,18,4,10); // side faces
        ctx.fillStyle=bodyFront; ctx.fillRect(2,18,28,10);                          // front face
        ctx.fillStyle=bodyTop;   ctx.fillRect(4,8,24,12);                           // lid top
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(4,8,24,2);
        ctx.fillStyle='#7a4018'; ctx.fillRect(2,18,28,3);                           // lid front edge
        ctx.fillStyle=brass; ctx.fillRect(2,20,28,2); ctx.fillRect(14,8,4,20);     // bands
        ctx.fillStyle=brass; ctx.fillRect(4,9,3,3); ctx.fillRect(25,9,3,3); ctx.fillRect(4,23,3,3); ctx.fillRect(25,23,3,3);
        ctx.fillStyle=gold; ctx.fillRect(13,17,6,4); ctx.fillStyle='#8b6000'; ctx.fillRect(14,18,4,2);

      } else if (rot === 1) {
        // Right side of chest faces viewer (east face visible).
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(6,26,24,4);
        ctx.fillStyle=bodyDark; ctx.fillRect(24,10,6,18);                           // east (right) face — visible
        ctx.fillStyle=bodyFront; ctx.fillRect(2,18,24,10);                          // south face (still partially visible)
        ctx.fillStyle=bodyTop;   ctx.fillRect(2,8,24,12);                           // lid top (slight perspective shift)
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(2,8,24,2);
        ctx.fillStyle='#7a4018'; ctx.fillRect(2,18,24,3);
        ctx.fillStyle=brass; ctx.fillRect(2,20,24,2); ctx.fillRect(12,8,4,20);
        ctx.fillStyle=brass; ctx.fillRect(4,9,3,3); ctx.fillRect(4,23,3,3);
        // East face detail
        ctx.fillStyle=brass; ctx.fillRect(25,11,3,3); ctx.fillRect(25,23,3,3);
        ctx.fillStyle=gold; ctx.fillRect(12,17,5,4); ctx.fillStyle='#8b6000'; ctx.fillRect(13,18,3,2);

      } else if (rot === 2) {
        // Back of chest faces viewer — no clasp, plain wood back.
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(4,26,24,4);
        ctx.fillStyle=bodyDark; ctx.fillRect(2,18,4,10); ctx.fillRect(26,18,4,10);
        ctx.fillStyle='#6a3c18'; ctx.fillRect(2,18,28,10);                          // back face (plainer)
        ctx.fillStyle=bodyTop;   ctx.fillRect(4,8,24,12);
        ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(4,8,24,2);
        ctx.fillStyle='#5a3010'; ctx.fillRect(2,18,28,3);
        ctx.fillStyle=brass; ctx.fillRect(2,20,28,2); ctx.fillRect(14,8,4,20);
        ctx.fillStyle=brass; ctx.fillRect(4,9,3,3); ctx.fillRect(25,9,3,3); ctx.fillRect(4,23,3,3); ctx.fillRect(25,23,3,3);
        // Hinge on back
        ctx.fillStyle=brass; ctx.fillRect(8,17,5,3); ctx.fillRect(19,17,5,3);

      } else { // rot=3 — left side
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(2,26,24,4);
        ctx.fillStyle=bodyDark; ctx.fillRect(2,10,6,18);                            // west (left) face
        ctx.fillStyle=bodyFront; ctx.fillRect(8,18,22,10);
        ctx.fillStyle=bodyTop;   ctx.fillRect(8,8,22,12);
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(8,8,22,2);
        ctx.fillStyle='#7a4018'; ctx.fillRect(8,18,22,3);
        ctx.fillStyle=brass; ctx.fillRect(8,20,22,2); ctx.fillRect(16,8,4,20);
        ctx.fillStyle=brass; ctx.fillRect(10,9,3,3); ctx.fillRect(27,9,3,3); ctx.fillRect(10,23,3,3); ctx.fillRect(27,23,3,3);
        ctx.fillStyle=brass; ctx.fillRect(3,11,3,3); ctx.fillRect(3,23,3,3);
        ctx.fillStyle=gold; ctx.fillRect(15,17,6,4); ctx.fillStyle='#8b6000'; ctx.fillRect(16,18,4,2);
      }
      return;
    }

    // ── BOOKSHELF ────────────────────────────────────────────
    if (tile === T.FURN_BOOKSHELF) {
      const topC = ['#e74c3c','#3498db','#27ae60','#f39c12'];
      const midC = ['#8e44ad','#e67e22','#c0392b','#1a8a6a'];

      if (rot === 0) {
        // Books face south — standard library shelf view
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(2,28,28,3);
        ctx.fillStyle='#2e1a08'; ctx.fillRect(0,4,4,26); ctx.fillRect(28,4,4,26); // side faces
        ctx.fillStyle='#3a2010'; ctx.fillRect(4,4,24,26);                          // body
        ctx.fillStyle='#7a5030'; ctx.fillRect(0,2,32,4);                           // top face
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(0,2,32,1);
        ctx.fillStyle='#5a3818'; ctx.fillRect(4,14,24,3); ctx.fillRect(4,24,24,3); // shelves
        for (let i=0;i<4;i++) { ctx.fillStyle=topC[i]; ctx.fillRect(5+i*6,6,4,8); ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(5+i*6,6,1,8); }
        for (let i=0;i<4;i++) { ctx.fillStyle=midC[i]; ctx.fillRect(5+i*6,17,4,7); ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(5+i*6,17,1,7); }

      } else if (rot === 1) {
        // Right side of shelf faces viewer. Books visible on the right edge (side-on).
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(4,28,26,3);
        ctx.fillStyle='#3a2010'; ctx.fillRect(2,4,22,26);                           // left face / body (back)
        ctx.fillStyle='#2e1a08'; ctx.fillRect(24,4,6,26);                           // right (east) face — visible
        ctx.fillStyle='#7a5030'; ctx.fillRect(2,2,28,4);                            // top face
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(2,2,28,1);
        ctx.fillStyle='#5a3818'; ctx.fillRect(2,14,22,3); ctx.fillRect(2,24,22,3);
        // Books visible through the south face (left portion)
        for (let i=0;i<4;i++) { ctx.fillStyle=topC[i]; ctx.fillRect(3+i*5,6,3,8); ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(3+i*5,6,1,8); }
        for (let i=0;i<4;i++) { ctx.fillStyle=midC[i]; ctx.fillRect(3+i*5,17,3,7); }
        // Right face — book spines visible end-on (thin coloured lines)
        ctx.fillStyle='#2e1a08'; ctx.fillRect(24,4,6,26);
        for (let i=0;i<4;i++) { ctx.fillStyle=topC[i]; ctx.fillRect(25,6+i*2,4,1); }
        for (let i=0;i<4;i++) { ctx.fillStyle=midC[i]; ctx.fillRect(25,17+i*2,4,1); }

      } else if (rot === 2) {
        // Back of shelf faces viewer — plain wood back, no books visible
        ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(2,28,28,3);
        ctx.fillStyle='#2e1a08'; ctx.fillRect(0,4,4,26); ctx.fillRect(28,4,4,26);
        ctx.fillStyle='#4a2e14'; ctx.fillRect(4,4,24,26);                           // back panel (lighter plank back)
        ctx.fillStyle='#7a5030'; ctx.fillRect(0,2,32,4);
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(0,2,32,1);
        // Shelf edges visible
        ctx.fillStyle='#3a2010'; ctx.fillRect(4,14,24,3); ctx.fillRect(4,24,24,3);
        // Nail marks on back
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(8,7,2,2); ctx.fillRect(22,7,2,2);
        ctx.fillRect(8,17,2,2); ctx.fillRect(22,17,2,2);

      } else { // rot=3 — left side faces viewer
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(2,28,26,3);
        ctx.fillStyle='#2e1a08'; ctx.fillRect(2,4,6,26);                            // west (left) face — visible
        ctx.fillStyle='#3a2010'; ctx.fillRect(8,4,22,26);                           // body
        ctx.fillStyle='#7a5030'; ctx.fillRect(2,2,28,4);
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(2,2,28,1);
        ctx.fillStyle='#5a3818'; ctx.fillRect(8,14,22,3); ctx.fillRect(8,24,22,3);
        // Books (right portion, angled view)
        for (let i=0;i<4;i++) { ctx.fillStyle=topC[i]; ctx.fillRect(9+i*5,6,3,8); ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(9+i*5,6,1,8); }
        for (let i=0;i<4;i++) { ctx.fillStyle=midC[i]; ctx.fillRect(9+i*5,17,3,7); }
        // Left face end-on book spines
        for (let i=0;i<4;i++) { ctx.fillStyle=topC[i]; ctx.fillRect(3,6+i*2,4,1); }
        for (let i=0;i<4;i++) { ctx.fillStyle=midC[i]; ctx.fillRect(3,17+i*2,4,1); }
      }
      return;
    }

    // ── PLANT ───────────────────────────────────────────────
    // Symmetric — all 4 rotations are identical (plant looks the same from all sides)
    if (tile === T.FURN_PLANT) {
      ctx.fillStyle='rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(16,29,9,3,0,0,Math.PI*2); ctx.fill();
      // Pot
      ctx.fillStyle='#a04a18'; ctx.fillRect(9,20,14,10);
      ctx.fillStyle='#804010'; ctx.fillRect(9,20,3,10); ctx.fillRect(20,20,3,10);
      ctx.fillStyle='#c06020'; ctx.fillRect(8,18,16,4);
      ctx.fillStyle='#3a2010'; ctx.fillRect(10,18,12,4);
      ctx.fillStyle='#2a1808'; ctx.fillRect(12,19,8,2);
      // Stem
      ctx.fillStyle='#1b5e20'; ctx.fillRect(15,8,3,12);
      // Leaves back
      ctx.fillStyle='#2e7d32';
      ctx.beginPath(); ctx.ellipse(10,11,7,4,-0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22,10,6,4,0.4,0,Math.PI*2); ctx.fill();
      // Leaves front
      ctx.fillStyle='#4caf50';
      ctx.beginPath(); ctx.ellipse(11,10,5,3,-0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(21,9,5,3,0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16,5,5,3,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(10,10,3,2,-0.4,0,Math.PI*2); ctx.fill();
      return;
    }

    // ── BED ─────────────────────────────────────────────────
    if (tile === T.FURN_BED) {
      // Frame (dark oak)
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(3,28,26,4);
      ctx.fillStyle='#4a2808'; ctx.fillRect(2,4,28,27);
      ctx.fillStyle='#6b3a18'; ctx.fillRect(3,5,26,25);
      // Mattress
      ctx.fillStyle='#e8dcc8'; ctx.fillRect(4,7,24,20);
      ctx.fillStyle='#d4c8b0'; ctx.fillRect(5,8,22,18);
      // Pillow
      ctx.fillStyle='#f0eae0'; ctx.fillRect(7,8,18,7);
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(8,9,8,3);
      // Blanket fold
      ctx.fillStyle='#9b3a3a'; ctx.fillRect(4,19,24,8);
      ctx.fillStyle='#b04444'; ctx.fillRect(5,20,22,6);
      ctx.fillStyle='#7a2828'; ctx.fillRect(4,19,24,2);
      // Headboard
      ctx.fillStyle='#3a1a08'; ctx.fillRect(2,4,28,4);
      ctx.fillStyle='#5a2a10'; ctx.fillRect(3,5,26,2);
      // Footboard
      ctx.fillStyle='#4a2808'; ctx.fillRect(2,29,28,3);
      return;
    }

    // ── BENCH ────────────────────────────────────────────────
    if (tile === T.FURN_BENCH) {
      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(3,27,26,5);
      // Legs
      ctx.fillStyle='#3a2008';
      ctx.fillRect(3,20,4,10); ctx.fillRect(25,20,4,10);
      // Side apron
      ctx.fillStyle='#5a3818'; ctx.fillRect(3,18,4,4); ctx.fillRect(25,18,4,4);
      // Front apron face
      ctx.fillStyle='#7a5028'; ctx.fillRect(3,18,26,4);
      ctx.fillStyle='#5a3818'; ctx.fillRect(3,18,26,1);
      // Worktop (top face — lightest)
      ctx.fillStyle='#c09060'; ctx.fillRect(2,10,28,9);
      ctx.fillStyle='#d4a878'; ctx.fillRect(3,11,26,7);
      // Wood grain lines
      ctx.fillStyle='rgba(0,0,0,0.12)';
      for (let xi = 5; xi < 28; xi += 6) ctx.fillRect(xi, 11, 1, 7);
      // Front edge shadow
      ctx.fillStyle='#8a6040'; ctx.fillRect(2,17,28,2);
      // Vise/clamp detail on right
      ctx.fillStyle='#4a4848'; ctx.fillRect(23,12,5,5);
      ctx.fillStyle='#6a6a6a'; ctx.fillRect(24,13,3,3);
      return;
    }
  }

  /* ═══════════════════════════════════════════════════════
     GROUND ITEMS (loot dropped by mobs)
     ═══════════════════════════════════════════════════════ */
  drawGroundItems(groundItems) {
    if (!groundItems.length) return;
    const ctx = this.ctx;
    for (const gi of groundItems) {
      const s = 20;
      const gx = gi.x - s / 2;
      const gy = gi.y - s / 2;
      // Item icon
      gi.item.draw(ctx, gx, gy, s);
      // Count badge
      if (gi.qty > 1) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(gi.qty, gx, gy + 10);
        ctx.fillText(gi.qty, gx, gy + 10);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     COMBAT TARGET HIGHLIGHT
     ═══════════════════════════════════════════════════════ */
  drawCombatTarget(mob) {
    const ctx = this.ctx;
    const cx = mob.x + mob.w / 2;
    const cy = mob.y + mob.h;
    const pulse = Math.sin(this.time * 8) * 2 + 6;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* ═══════════════════════════════════════════════════════
     TREE SPRITE  (drawn in entity layer for depth sorting)
     px, py  = tile top-left in world coords
     seed    = { s1:(c*7+r*13)%17, s2:(c*11+r*7)%19,
                 s3:(c*13+r*11)%23, s4:(c*17+r*5)%29 }
     ═══════════════════════════════════════════════════════ */
  drawTreeSprite(ctx, px, py, seed, tileType, biome) {
    const { s1, s2, s3, s4 } = seed;
    const key = `${tileType}_${biome}_${s1}_${s2}_${s3}_${s4}`;

    if (!this._treeCache.has(key)) {
      // Extra padding for large trees (yew/elder/magic need more room)
      const PAD_X = 14, PAD_Y = 30, PAD_B = 6;
      const W = TILE_SIZE + PAD_X * 2;
      const H = TILE_SIZE + PAD_Y + PAD_B;
      const oc   = new OffscreenCanvas(W, H);
      const octx = oc.getContext('2d');
      // Rare tree types take priority; TILES.TREE falls back to biome
      switch (tileType) {
        case TILES.OAK_TREE:    this._drawOakTree(octx, PAD_X, PAD_Y, seed);    break;
        case TILES.WILLOW_TREE: this._drawWillowTree(octx, PAD_X, PAD_Y, seed); break;
        case TILES.MAPLE_TREE:  this._drawMapleTree(octx, PAD_X, PAD_Y, seed);  break;
        case TILES.YEW_TREE:    this._drawYewTree(octx, PAD_X, PAD_Y, seed);    break;
        case TILES.MAGIC_TREE:  this._drawMagicTree(octx, PAD_X, PAD_Y, seed);  break;
        case TILES.ELDER_TREE:  this._drawElderTree(octx, PAD_X, PAD_Y, seed);  break;
        default: // TILES.TREE — biome determines appearance
          switch (biome) {
            case BIOMES.TUNDRA:   this._drawPineTree(octx, PAD_X, PAD_Y, seed);  break;
            case BIOMES.SWAMP:    this._drawSwampTree(octx, PAD_X, PAD_Y, seed); break;
            case BIOMES.VOLCANIC:
            case BIOMES.DANGER:   this._drawDeadTree(octx, PAD_X, PAD_Y, seed);  break;
            default:              this._drawLeafyTree(octx, PAD_X, PAD_Y, seed); break;
          }
      }
      if (this._treeCache.size >= 2048) {
        this._treeCache.delete(this._treeCache.keys().next().value);
      }
      this._treeCache.set(key, { oc, PAD_X, PAD_Y });
    }

    const entry = this._treeCache.get(key);
    this._treeCache.delete(key);
    this._treeCache.set(key, entry);
    ctx.drawImage(entry.oc, px - entry.PAD_X, py - entry.PAD_Y);
  }

  /** Oak — darker, richer greens */
  _drawOakTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#061a04', bulk:'#0e3208', mid:'#184a0e', hi:'#286018', top:'#387828' },
      { shadow:'#08200a', bulk:'#10380e', mid:'#1c5214', hi:'#2c6e20', top:'#3e882e' },
      { shadow:'#042004', bulk:'#0c340a', mid:'#164c10', hi:'#24641c', top:'#347c28' },
      { shadow:'#061c06', bulk:'#103008', mid:'#1a480e', hi:'#285e1a', top:'#387426' },
    ]);
  }

  /** Willow — blue-green teal tones */
  _drawWillowTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#041e1a', bulk:'#0c3830', mid:'#165048', hi:'#226a60', top:'#308478' },
      { shadow:'#061e18', bulk:'#0e3c30', mid:'#185448', hi:'#266e60', top:'#348876' },
      { shadow:'#041c18', bulk:'#0a3428', mid:'#144c3c', hi:'#206452', top:'#2e7e68' },
      { shadow:'#062018', bulk:'#103830', mid:'#1a5244', hi:'#286c5c', top:'#368670' },
    ]);
  }

  /** Maple — warm autumn oranges, reds, and golds */
  _drawMapleTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#2a0c02', bulk:'#5a1e06', mid:'#8c340a', hi:'#b84e10', top:'#d86818' },
      { shadow:'#1e1002', bulk:'#483006', mid:'#785010', hi:'#a87020', top:'#c88c28' },
      { shadow:'#240c04', bulk:'#4e1e08', mid:'#7a340e', hi:'#a84e14', top:'#cc681c' },
      { shadow:'#1a1402', bulk:'#3e3006', mid:'#66500c', hi:'#8e7018', top:'#b09020' },
    ]);
  }

  /** Yew — very dark, near-black ancient greens */
  _drawYewTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#020802', bulk:'#061406', mid:'#0c200c', hi:'#142e14', top:'#1e3e1e' },
      { shadow:'#020a02', bulk:'#081608', mid:'#0e2410', hi:'#163214', top:'#204220' },
      { shadow:'#030804', bulk:'#071206', mid:'#0d1e0c', hi:'#152c12', top:'#1f3c1c' },
      { shadow:'#020902', bulk:'#061808', mid:'#0c260e', hi:'#163414', top:'#20461e' },
    ]);
  }

  /** Magic — blue-purple violet tones */
  _drawMagicTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#0c0428', bulk:'#200a5c', mid:'#381494', hi:'#5030b8', top:'#7050d0' },
      { shadow:'#0a0630', bulk:'#1c1060', mid:'#32209a', hi:'#4c38bc', top:'#6c58d4' },
      { shadow:'#0e0224', bulk:'#240856', mid:'#3c1490', hi:'#5828b0', top:'#7848cc' },
      { shadow:'#080428', bulk:'#180c5a', mid:'#2c1892', hi:'#4430b4', top:'#6452cc' },
    ]);
  }

  /** Elder — pale silver-white tones */
  _drawElderTree(ctx, px, py, seed) {
    this._drawLeafyTree(ctx, px, py, seed, [
      { shadow:'#2a3028', bulk:'#485448', mid:'#6a786a', hi:'#909e90', top:'#b8c8b4' },
      { shadow:'#2c3230', bulk:'#4a5650', mid:'#6c7c74', hi:'#92a49a', top:'#bacac0' },
      { shadow:'#283028', bulk:'#465048', mid:'#687068', hi:'#8e9a8e', top:'#b6c4b2' },
      { shadow:'#2e3430', bulk:'#4c5850', mid:'#6e7e76', hi:'#94a89c', top:'#bccec4' },
    ]);
  }

  /** Default broad-leaf tree (plains / forest / desert edge).
   *  Pass a custom `palettes` array to reuse this drawing for other tree types. */
  _drawLeafyTree(ctx, px, py, { s1, s2, s3, s4 }, palettes) {
    // Per-tree variation parameters
    const lean     = (s2 % 5) - 2;          // -2..+2 px horizontal lean
    const bigness  = (s3 % 5);              // 0..4 px extra radius on main lobes
    const tallness = (s4 % 4);              // 0..3 px extra height
    const tint     = s4 % 4;               // selects color palette variant

    // Four green palette variants (dark → mid → highlight → bright)
    if (!palettes) palettes = [
      { shadow:'#0a2e04', bulk:'#185210', mid:'#267016', hi:'#3a9428', top:'#52b438' },
      { shadow:'#0c3408', bulk:'#1e5c12', mid:'#2e7c1c', hi:'#44a030', top:'#5cc040' },
      { shadow:'#083008', bulk:'#164e10', mid:'#226818', hi:'#36902a', top:'#4aaa38' },
      { shadow:'#102c06', bulk:'#1c5410', mid:'#2a6e18', hi:'#3e9424', top:'#54b036' },
    ];
    const pal = palettes[tint];

    // Ground shadow (wider for bigger trees)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(px + 16 + lean, py + 29, 13 + bigness, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Trunk (leans with tree)
    const tx = px + 13 + lean;
    ctx.fillStyle = '#201008';
    ctx.fillRect(tx, py + 17, 6, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(tx + 1, py + 19, 1, 13);
    ctx.fillRect(tx + 4, py + 21, 1, 11);

    // Root flares
    ctx.fillStyle = '#1a0c04';
    ctx.fillRect(tx - 3, py + 27, 4, 5);
    ctx.fillRect(tx + 6, py + 27, 4, 5);
    if (s3 % 3 === 0) ctx.fillRect(tx + 2, py + 29, 3, 4); // extra mid root

    // Canopy origin shifts with lean and tallness
    const cx = px + 16 + lean, cy = py + 9 - tallness;

    // Depth shadow
    ctx.fillStyle = pal.shadow;
    ctx.beginPath(); ctx.arc(cx + 1, cy, 18 + bigness, 0, Math.PI * 2); ctx.fill();

    // Outer bulk lobes — positions vary with s2/s3
    ctx.fillStyle = pal.bulk;
    ctx.beginPath(); ctx.arc(cx,            cy - 4,           16 + bigness,        0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 9 + (s2 % 3),  cy + 1 + (s3 % 3), 11 + (s2 % 3),   0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 9 - (s3 % 3),  cy + 1 + (s2 % 3), 11 + (s3 % 3),   0, Math.PI * 2); ctx.fill();

    // Mid canopy
    ctx.fillStyle = pal.mid;
    ctx.beginPath(); ctx.arc(cx - 1,          cy - 8 - tallness, 13 + bigness,       0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6 + (s1%3), cy - 4 + (s2%3),   10 + (s1%3),       0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 7 - (s2%3), cy - 4 + (s1%3),    9 + (s2%3),       0, Math.PI * 2); ctx.fill();

    // Highlight lobes
    ctx.fillStyle = pal.hi;
    ctx.beginPath(); ctx.arc(cx - 3 + (s3%3), cy - 12 - tallness, 9 + (s1%3), 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4 + (s4%3), cy - 9  + (s2%3),   7 + (s2%3), 0, Math.PI * 2); ctx.fill();

    // Top bright clump
    ctx.fillStyle = pal.top;
    ctx.beginPath(); ctx.arc(cx - 4 + (s4%5), cy - 15 - tallness, 5 + (s3%3), 0, Math.PI * 2); ctx.fill();

    // Seed-varied extra side lobe (makes silhouette irregular)
    ctx.fillStyle = pal.mid;
    const elx = (s1 % 2 === 0) ? cx - 12 - (s4%4) : cx + 9 + (s4%4);
    ctx.beginPath(); ctx.arc(elx, cy - 2 + (s1%5), 5 + (s2%4), 0, Math.PI * 2); ctx.fill();

    // Specular
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.beginPath(); ctx.arc(cx - 5, cy - 16 - tallness, 3, 0, Math.PI * 2); ctx.fill();
  }

  /** Conifer / pine tree (tundra) — tall triangular silhouette with snow caps */
  _drawPineTree(ctx, px, py, { s1, s2, s3, s4 }) {
    // Per-tree variation
    const lean     = (s2 % 5) - 2;          // lean -2..+2
    const spread   = s3 % 4;                // 0..3 extra base width
    const tallness = s4 % 5;                // 0..4 extra height
    const snowAmt  = 0.55 + (s2 % 5) * 0.07; // 0.55..0.83 snow coverage

    // Tint: bluish-green vs yellowish-green conifers
    const darkCol  = s1 % 2 === 0 ? '#0e3808' : '#0a3412';
    const midCol   = s1 % 2 === 0 ? '#1a5510' : '#155040';
    const litCol   = s1 % 2 === 0 ? '#2a7018' : '#206858';

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath(); ctx.ellipse(px + 16 + lean, py + 30, 9 + spread, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Trunk
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(px + 14 + lean, py + 20, 4, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px + 15 + lean, py + 21, 1, 10);

    // Tiers — radii and vertical spacing vary
    const tierGap = 8 + (s4 % 3);
    const tiers = [
      { cy: py - 14 - tallness, r: 7  + (s3 % 3)            },
      { cy: py - 14 - tallness + tierGap,     r: 10 + (s2 % 3) + (spread >> 1) },
      { cy: py - 14 - tallness + tierGap * 2, r: 13 + spread                   },
    ];
    for (const t of tiers) {
      ctx.fillStyle = darkCol;
      ctx.beginPath(); ctx.arc(px + 16 + lean, t.cy + 3, t.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = midCol;
      ctx.beginPath(); ctx.arc(px + 16 + lean, t.cy,     t.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = litCol;
      ctx.beginPath(); ctx.arc(px + 13 + lean, t.cy - 1, t.r * 0.6, 0, Math.PI * 2); ctx.fill();
      // Snow cap — coverage varies per tree
      ctx.fillStyle = `rgba(220,240,255,${snowAmt.toFixed(2)})`;
      ctx.beginPath(); ctx.arc(px + 15 + lean, t.cy - (t.r * 0.35), t.r * 0.45, Math.PI, Math.PI * 2); ctx.fill();
    }

    // Seed-varied drooping branch stub
    ctx.fillStyle = midCol;
    const stubSide = s1 % 2 === 0 ? px + 3 + lean : px + 23 + lean;
    ctx.fillRect(stubSide, py + 10 + (s2 % 5), 6 + (s3 % 3), 2);

    // Top spike — height varies
    const spikeH = 8 + s4 % 5;
    ctx.fillStyle = midCol;
    ctx.fillRect(px + 15 + lean, py - 14 - tallness - spikeH, 2, spikeH + 2);
    ctx.fillStyle = `rgba(220,240,255,${snowAmt.toFixed(2)})`;
    ctx.fillRect(px + 15 + lean, py - 14 - tallness - spikeH, 2, 3);
  }

  /** Gnarled swamp tree — dark, twisted, with hanging moss */
  _drawSwampTree(ctx, px, py, { s1, s2, s3, s4 }) {
    // Per-tree variation
    const lean      = (s4 % 5) - 2;         // -2..+2 lean
    const trunkW    = 6 + (s2 % 4);         // trunk width 6..9
    const mossCnt   = 3 + (s1 % 5);         // 3..7 tendrils
    const canopyBig = s3 % 4;               // 0..3 extra radius

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(px + 16 + lean, py + 29, 12 + canopyBig, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Wide gnarled trunk
    const tx = px + 13 + lean - (trunkW >> 1);
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(tx, py + 12, trunkW, 20);
    ctx.fillStyle = '#0e0a04';
    ctx.fillRect(tx, py + 14, 2, 16);
    ctx.fillRect(tx + trunkW - 2, py + 16, 2, 14);

    // Root buttresses — count varies
    ctx.fillStyle = '#120c04';
    ctx.fillRect(tx - 4,          py + 24, 5, 8);
    ctx.fillRect(tx + trunkW - 1, py + 22, 5, 9);
    if (s2 % 2 === 0) ctx.fillRect(tx + 1, py + 28, 3, 4);
    if (s3 % 3 === 0) ctx.fillRect(tx - 2, py + 26, 3, 6);

    // Canopy — lobe positions shift per tree
    const cx = px + 16 + lean, cy = py + 8;
    ctx.fillStyle = '#0d2808';
    ctx.beginPath(); ctx.arc(cx, cy, 16 + canopyBig, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a3a10';
    ctx.beginPath(); ctx.arc(cx - 4 + (s1%4), cy - 4 + (s2%3), 12 + (s2%3),     0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6 + (s2%3), cy - 2 + (s3%3), 10 + (s3%3),     0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e4612';
    ctx.beginPath(); ctx.arc(cx - 6 + (s3%4), cy - 9 + (s1%3),  9 + (s1%3),     0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4 + (s4%3), cy - 10 + (s2%3), 8 + (s4%3),     0, Math.PI * 2); ctx.fill();

    // Branch stubs — position flips with lean/s1
    ctx.fillStyle = '#0e0a04';
    const lbx = s1 % 2 === 0 ? px + 2 + lean : px + 4 + lean;
    ctx.fillRect(lbx,     py + 10, 9,  2);
    ctx.fillRect(lbx + 1, py + 8,  3,  3);
    const rbx = s2 % 2 === 0 ? px + 21 + lean : px + 19 + lean;
    ctx.fillRect(rbx, py + 8,  8,  2);
    ctx.fillRect(rbx + 4, py + 6,  3, 3);

    // Hanging moss tendrils — count and length vary
    ctx.fillStyle = '#2a4a10';
    for (let i = 0; i < mossCnt; i++) {
      const mx   = px + 4 + ((s1 * (i + 1) * 7 + s2 * i) % 24);
      const mlen = 5 + ((s3 + i * s4) % 10);
      const moff = (i + s2) % 4;
      ctx.fillRect(mx,     py + 13 + moff, 1, mlen);
      ctx.fillRect(mx + 1, py + 15 + moff, 1, mlen - 3);
    }

    // Fungi — color and presence vary
    const fungiColors = ['#88cc44', '#aabb22', '#66aa22', '#99cc55'];
    if (s1 % 3 !== 2) {
      ctx.fillStyle = fungiColors[s4 % fungiColors.length];
      const fx = tx + 1 + (s3 % 3);
      ctx.fillRect(fx,     py + 16 + (s2 % 6), 3, 2);
      ctx.fillRect(fx - 1, py + 17 + (s2 % 6), 5, 1);
      if (s2 % 3 === 0) {  // second cluster
        ctx.fillRect(fx + 3, py + 22 + (s4 % 4), 2, 2);
        ctx.fillRect(fx + 2, py + 23 + (s4 % 4), 4, 1);
      }
    }
  }

  /** Dead / charred tree (volcanic / danger) — bare branches, no foliage */
  _drawDeadTree(ctx, px, py, { s1, s2, s3, s4 }) {
    // Per-tree variation
    const lean    = (s3 % 5) - 2;          // lean -2..+2
    const trunkH  = 26 + (s4 % 8);         // trunk height 26..33
    const glowInt = 0.12 + (s2 % 5) * 0.04; // ember glow 0.12..0.32

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(px + 16 + lean, py + 30, 10 + (s1 % 4), 4, 0, 0, Math.PI * 2); ctx.fill();

    // Main trunk
    const tx = px + 13 + lean;
    ctx.fillStyle = '#1a0a04';
    ctx.fillRect(tx, py + 32 - trunkH, 5, trunkH);
    ctx.fillStyle = '#100604';
    ctx.fillRect(tx, py + 34 - trunkH, 2, trunkH - 4);
    ctx.fillStyle = '#2a1008';
    ctx.fillRect(tx + 3, py + 36 - trunkH, 1, trunkH - 8);

    // Root claws — count/position varies
    ctx.fillStyle = '#0e0604';
    ctx.fillRect(tx - 4, py + 26, 5, 6);
    ctx.fillRect(tx + 5, py + 27, 6, 5);
    if (s2 % 2 === 0) ctx.fillRect(tx + 1, py + 29, 3, 4);

    // Branch system — each major fork shifts with seeds
    ctx.fillStyle = '#1a0a04';
    // Left fork — length and angle vary
    const lbLen = 6 + (s1 % 5);
    const lbY   = py + 10 + (s2 % 6);
    ctx.fillRect(tx - lbLen, lbY,           lbLen,      3);
    ctx.fillRect(tx - lbLen, lbY - 3 - (s3%3), lbLen - 2, 3);
    ctx.fillRect(tx - lbLen - 1, lbY - 6 - (s4%4), 3, 5 + (s1%3));

    // Right fork
    const rbLen = 6 + (s4 % 5);
    const rbY   = py + 8 + (s3 % 6);
    ctx.fillRect(tx + 5, rbY,              rbLen,      3);
    ctx.fillRect(tx + 5, rbY - 4 - (s2%4), rbLen - 2,  3);
    ctx.fillRect(tx + 5 + rbLen - 3, rbY - 8 - (s3%4), 3, 6 + (s2%3));

    // Central upward branch — height varies
    const ubH = 12 + (s2 % 6);
    ctx.fillRect(tx + 1, py + 32 - trunkH - ubH + 4, 3, ubH);
    if (s1 % 2 === 0) {
      ctx.fillRect(tx - 2, py + 32 - trunkH - ubH + 10, 4, 2); // left twig
    } else {
      ctx.fillRect(tx + 3, py + 32 - trunkH - ubH + 8, 4, 2);  // right twig
    }
    // Extra upper twig (varies)
    ctx.fillRect(tx + (s4%3), py + 32 - trunkH - ubH - 2, 2, 5 + (s3%3));

    // Bark cracks — position varies
    ctx.fillStyle = '#2a1208';
    ctx.fillRect(tx + 1 + (s1%3), py + 16, 1, 7 + (s4%5));
    ctx.fillRect(tx,               py + 20 + (s2%5), 4, 1);
    if (s3 % 3 === 0) ctx.fillRect(tx + 3, py + 12 + (s1%4), 1, 5);

    // Lava glow — intensity varies
    ctx.fillStyle = `rgba(220,80,0,${glowInt.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(px + 16 + lean, py + 16, 13 + (s4%4), 0, Math.PI * 2); ctx.fill();

    // Ember sparks — count and position vary
    const sparkCount = 1 + (s1 % 3);
    ctx.fillStyle = '#ff6600';
    for (let i = 0; i < sparkCount; i++) {
      const sx = px + 4 + ((s1 * (i+1) * 5 + s2 * i) % 24) + lean;
      const sy = py + 4 + ((s3 * (i+1) * 3 + s4 * i) % 20);
      ctx.fillRect(sx, sy, (s2 + i) % 2 === 0 ? 2 : 1, (s3 + i) % 2 === 0 ? 2 : 1);
    }
    // Hot core ember
    if (s4 % 3 === 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(px + 10 + lean + (s2%8), py + 18 + (s1%8), 2, 2);
    }
  }

  /* ═══════════════════════════════════════════════════════
     CLICK TARGET
     ═══════════════════════════════════════════════════════ */
  drawClickTarget(x, y, time) {
    const ctx = this.ctx;
    const pulse = Math.sin(time * 6) * 3 + 8;
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
    ctx.stroke();
  }

  /* ═══════════════════════════════════════════════════════
     ACTION PROGRESS BAR
     ═══════════════════════════════════════════════════════ */
  drawActionBar(actions) {
    if (!actions.isActive) return;
    const ctx = this.ctx;
    const w = 200;
    const h = 24;
    const x = (this.canvas.width - w) / 2;
    const y = this.canvas.height / 2 + 60;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this._roundRect(ctx, x - 4, y - 18, w + 8, h + 24, 6);
    ctx.fill();

    // Label
    ctx.fillStyle = '#ddd';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(actions.label, x + w / 2, y - 4);

    // Bar background
    ctx.fillStyle = '#333';
    this._roundRect(ctx, x, y, w, h, 4);
    ctx.fill();

    // Bar fill
    const progress = actions.progress;
    if (progress > 0) {
      ctx.fillStyle = '#27ae60';
      this._roundRect(ctx, x, y, w * progress, h, 4);
      ctx.fill();
    }

    // Percentage
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.floor(progress * 100)}%`, x + w / 2, y + 16);
  }

  /* ═══════════════════════════════════════════════════════
     INVENTORY PANEL (right side)
     ═══════════════════════════════════════════════════════ */
  drawInventory(inventory, showPanel, dragSlot = -1, hoverSlot = -1, dragX = 0, dragY = 0) {
    if (!showPanel) return;
    const ctx = this.ctx;
    const panelW = INV_COLS * (INV_CELL + INV_PAD) + INV_PAD + 16;
    const panelH = INV_ROWS * (INV_CELL + INV_PAD) + INV_PAD + 36;
    const px = this.canvas.width - panelW - 10;
    const py = this.canvas.height / 2 - panelH / 2;

    // Panel background
    ctx.fillStyle = 'rgba(20,15,10,0.88)';
    this._roundRect(ctx, px, py, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, panelW, panelH, 8);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Inventory', px + panelW / 2, py + 20);

    // Grid
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < INV_COLS; c++) {
        const idx = r * INV_COLS + c;
        const cx = px + 8 + c * (INV_CELL + INV_PAD);
        const cy = py + 30 + r * (INV_CELL + INV_PAD);
        const isDragging  = idx === dragSlot;
        const isDropTarget = idx === hoverSlot && dragSlot !== -1;

        // Slot background — highlight drop target
        ctx.fillStyle = isDropTarget ? 'rgba(139,105,20,0.5)' : 'rgba(60,50,35,0.7)';
        this._roundRect(ctx, cx, cy, INV_CELL, INV_CELL, 4);
        ctx.fill();
        ctx.strokeStyle = isDropTarget ? '#f1c40f' : 'rgba(139,105,20,0.4)';
        ctx.lineWidth = isDropTarget ? 2 : 1;
        this._roundRect(ctx, cx, cy, INV_CELL, INV_CELL, 4);
        ctx.stroke();

        // Don't draw item in the slot it's being dragged from
        if (isDragging) continue;

        const slot = inventory.slots[idx];
        if (slot) {
          slot.item.draw(ctx, cx + 2, cy + 2, INV_CELL - 4);

          // Weight label for caught fish
          if (slot.item.weight !== undefined) {
            const wText = `${slot.item.weight}kg`;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(wText, cx + INV_CELL / 2, cy + INV_CELL - 3);
            ctx.fillStyle = '#fff';
            ctx.fillText(wText, cx + INV_CELL / 2, cy + INV_CELL - 3);
          }

          if (slot.qty > 1) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'left';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(slot.qty.toString(), cx + 2, cy + 12);
            ctx.fillText(slot.qty.toString(), cx + 2, cy + 12);
          }
        }
      }
    }

    // Ghost item — drawn on top of everything, centred on cursor
    if (dragSlot !== -1 && inventory.slots[dragSlot]) {
      const gs = INV_CELL;
      const gx = dragX - gs / 2;
      const gy = dragY - gs / 2;
      ctx.globalAlpha = 0.75;
      inventory.slots[dragSlot].item.draw(ctx, gx + 2, gy + 2, gs - 4);
      ctx.globalAlpha = 1;
      // Stack count on ghost
      const qty = inventory.slots[dragSlot].qty;
      if (qty > 1) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(qty.toString(), gx + 2, gy + 12);
        ctx.fillText(qty.toString(), gx + 2, gy + 12);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     SKILLS PANEL (left side)
     ═══════════════════════════════════════════════════════ */
  drawSkillsPanel(skills, showPanel) {
    if (!showPanel) return;
    const ctx = this.ctx;
    const panelW = 200;
    const rowH = 42;
    const panelH = SKILL_NAMES.length * rowH + 50;
    const px = 10;
    const py = this.canvas.height / 2 - panelH / 2;

    // Background
    ctx.fillStyle = 'rgba(20,15,10,0.88)';
    this._roundRect(ctx, px, py, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, panelW, panelH, 8);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Skills', px + panelW / 2, py + 22);

    // Total level
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(`Total Level: ${skills.totalLevel}`, px + panelW / 2, py + 36);

    // Each skill
    for (let i = 0; i < SKILL_NAMES.length; i++) {
      const ry = py + 44 + i * rowH;
      const level = skills.getLevel(i);
      const progress = skills.progressToNext(i);
      const xp = skills.xp[i];

      // Skill name + level
      ctx.fillStyle = SKILL_COLORS[i];
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(SKILL_NAMES[i], px + 12, ry + 14);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${level}`, px + panelW - 12, ry + 14);

      // XP bar background
      ctx.fillStyle = '#333';
      this._roundRect(ctx, px + 12, ry + 20, panelW - 24, 10, 3);
      ctx.fill();

      // XP bar fill
      if (progress > 0) {
        ctx.fillStyle = SKILL_COLORS[i];
        this._roundRect(ctx, px + 12, ry + 20, (panelW - 24) * progress, 10, 3);
        ctx.fill();
      }

      // XP text
      ctx.fillStyle = '#999';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${xp} XP`, px + panelW / 2, ry + 29);
    }
  }

  drawSkillInfoPopup(skillId, skills, SKILL_UNLOCKS, scrollY = 0) {
    const ctx     = this.ctx;
    const W       = this.canvas.width;
    const H       = this.canvas.height;
    const color   = SKILL_COLORS[skillId];
    const name    = SKILL_NAMES[skillId];
    const level   = skills.getLevel(skillId);
    const xp      = skills.xp[skillId];
    const toNext  = skills.xpToNext(skillId);
    const prog    = skills.progressToNext(skillId);
    // Sort unlocks lowest → highest level
    const unlocks = [...(SKILL_UNLOCKS[skillId] || [])].sort((a, b) => a.level - b.level);

    // ── Layout ───────────────────────────────────────────
    const PAD     = 16;
    const hasSub  = unlocks.some(u => u.sub);
    const ROW_H   = hasSub ? 62 : 48;
    const ICON_S  = 32;
    const BADGE_W = 36;
    const HDR_H   = 92;
    const FOOT_H  = 26;
    const SCROLL_W = 8;
    const PW      = Math.min(480, W - 32);
    const PH      = Math.min(H - 48, HDR_H + unlocks.length * ROW_H + FOOT_H);
    const px      = Math.round((W - PW) / 2);
    const py      = Math.round((H - PH) / 2);
    const contentH = PH - HDR_H - FOOT_H;           // visible scroll viewport height
    const totalH   = unlocks.length * ROW_H;         // total scrollable height
    const maxScroll = Math.max(0, totalH - contentH);
    const scroll    = Math.max(0, Math.min(scrollY, maxScroll));

    // ── Dim backdrop ─────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    // ── Panel background ─────────────────────────────────
    ctx.fillStyle = '#100c06';
    this._roundRect(ctx, px, py, PW, PH, 8);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, PW, PH, 8);
    ctx.stroke();
    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 1;
    this._roundRect(ctx, px + 3, py + 3, PW - 6, PH - 6, 6);
    ctx.stroke();

    // ── Header ───────────────────────────────────────────
    const HICON = 42;
    this._drawSkillIcon(ctx, skillId, px + PAD, py + PAD, HICON);

    ctx.fillStyle = color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(name, px + PAD + HICON + 12, py + PAD + 16);

    ctx.fillStyle = '#f0e8d0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Level ${level} / 99`, px + PAD + HICON + 12, py + PAD + 34);

    ctx.fillStyle = '#8a7050';
    ctx.font = '11px monospace';
    const xpText = level >= 99
      ? `${xp.toLocaleString()} XP total`
      : `${xp.toLocaleString()} XP  (${toNext.toLocaleString()} to next)`;
    ctx.fillText(xpText, px + PAD + HICON + 12, py + PAD + 52);

    const barX = px + PAD + HICON + 12;
    const barY = py + PAD + 58;
    const barW = PW - PAD * 2 - HICON - 12;
    ctx.fillStyle = '#1e1408';
    this._roundRect(ctx, barX, barY, barW, 8, 3);
    ctx.fill();
    if (prog > 0) {
      ctx.fillStyle = color;
      this._roundRect(ctx, barX, barY, Math.max(4, barW * prog), 8, 3);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(px + PAD, py + HDR_H - 6, PW - PAD * 2, 1);
    ctx.globalAlpha = 1;

    // ── Scrollable content area ───────────────────────────
    const clipX = px + 4;
    const clipY = py + HDR_H;
    const clipW = PW - 8;
    const clipH = contentH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipX, clipY, clipW, clipH);
    ctx.clip();

    const rowW = PW - PAD * 2 - (maxScroll > 0 ? SCROLL_W + 4 : 0);

    for (let i = 0; i < unlocks.length; i++) {
      const { level: reqLvl, text, sub, icon } = unlocks[i];
      const unlocked = level >= reqLvl;
      const rx = px + PAD;
      const ry = clipY + i * ROW_H - scroll;

      // Skip rows entirely outside the clip zone
      if (ry + ROW_H < clipY || ry > clipY + clipH) continue;

      // Row background
      ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)';
      this._roundRect(ctx, rx, ry + 2, rowW, ROW_H - 4, 4);
      ctx.fill();
      if (unlocked) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1;
        this._roundRect(ctx, rx, ry + 2, rowW, ROW_H - 4, 4);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Icon
      const iconX = rx + 6;
      const iconY = ry + (ROW_H - ICON_S) / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(iconX, iconY, ICON_S, ICON_S);
      ctx.globalAlpha = unlocked ? 1 : 0.3;
      if (icon && this._itemById.has(icon)) {
        this._itemById.get(icon).draw(ctx, iconX + 1, iconY + 1, ICON_S - 2);
      } else {
        this._drawSkillIcon(ctx, skillId, iconX + 1, iconY + 1, ICON_S - 2);
      }
      ctx.globalAlpha = 1;

      // Level badge
      const badgeX = iconX + ICON_S + 6;
      const badgeMid = ry + ROW_H / 2;
      ctx.fillStyle = unlocked ? color : '#241a0a';
      this._roundRect(ctx, badgeX, badgeMid - 11, BADGE_W, 22, 3);
      ctx.fill();
      ctx.fillStyle = unlocked ? '#0c0804' : '#5a4020';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${reqLvl}`, badgeX + BADGE_W / 2, badgeMid + 4);

      // Unlock text (main line + optional sub line)
      const textX = badgeX + BADGE_W + 8;
      const maxTW  = rowW - ICON_S - BADGE_W - 32;
      ctx.textAlign = 'left';
      const textY = sub ? ry + ROW_H / 2 - 4 : badgeMid + 4;
      ctx.fillStyle = unlocked ? '#e8dfc0' : '#4a3820';
      ctx.font = `${unlocked ? 'bold ' : ''}12px monospace`;
      let label = text;
      while (ctx.measureText(label).width > maxTW && label.length > 1) label = label.slice(0, -1);
      if (label !== text) label = label.slice(0, -2) + '…';
      ctx.fillText(label, textX, textY);

      if (sub) {
        ctx.font = '10px monospace';
        ctx.fillStyle = unlocked ? color : '#3a2c14';
        ctx.globalAlpha = unlocked ? 0.85 : 1;
        let subLabel = sub;
        while (ctx.measureText(subLabel).width > maxTW && subLabel.length > 1) subLabel = subLabel.slice(0, -1);
        if (subLabel !== sub) subLabel = subLabel.slice(0, -2) + '…';
        ctx.fillText(subLabel, textX, textY + 15);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    // ── Scrollbar ─────────────────────────────────────────
    if (maxScroll > 0) {
      const sbX    = px + PW - PAD / 2 - SCROLL_W;
      const sbTopY = clipY + 2;
      const sbH    = clipH - 4;
      // Track
      ctx.fillStyle = '#1a1208';
      this._roundRect(ctx, sbX, sbTopY, SCROLL_W, sbH, 4);
      ctx.fill();
      // Thumb
      const thumbH  = Math.max(20, (contentH / totalH) * sbH);
      const thumbY  = sbTopY + (scroll / maxScroll) * (sbH - thumbH);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      this._roundRect(ctx, sbX, thumbY, SCROLL_W, thumbH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── Footer ────────────────────────────────────────────
    ctx.fillStyle = '#2a1e0a';
    ctx.fillRect(px + 4, py + PH - FOOT_H, PW - 8, 1);
    ctx.fillStyle = '#3a2c14';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      maxScroll > 0 ? 'Scroll to see more  •  Esc or click skill to close' : 'Esc or click skill to close',
      px + PW / 2, py + PH - 8
    );
  }

  /* ═══════════════════════════════════════════════════════
     MINIMAP
     ═══════════════════════════════════════════════════════ */
  drawCircleMinimap(world, player) {
    const ctx = this.ctx;
    const RADIUS = 95;
    const TILE_PX = 4;
    const cx = this.canvas.width - RADIUS - 14;
    const cy = RADIUS + 14;

    const pcol = Math.floor(player.cx / TILE_SIZE);
    const prow = Math.floor(player.cy / TILE_SIZE);
    const span = Math.ceil(RADIUS / TILE_PX) + 1;
    const SIZE  = (span * 2 + 1) * TILE_PX;

    // Rebuild the offscreen tile cache only when the player crosses a tile boundary
    if (this.minimapDirty || !this.minimapCanvas ||
        this._mmPcol !== pcol || this._mmProw !== prow) {
      this.minimapDirty = false;
      this._mmPcol = pcol;
      this._mmProw = prow;

      if (!this.minimapCanvas) {
        this.minimapCanvas = document.createElement('canvas');
      }
      if (this.minimapCanvas.width !== SIZE) {
        this.minimapCanvas.width  = SIZE;
        this.minimapCanvas.height = SIZE;
      }
      const mc = this.minimapCanvas.getContext('2d');
      const origin = span * TILE_PX; // pixel centre of the offscreen canvas

      mc.fillStyle = '#0c0c0c';
      mc.fillRect(0, 0, SIZE, SIZE);

      for (let dr = -span; dr <= span; dr++) {
        for (let dc = -span; dc <= span; dc++) {
          const tile = world.getTile(pcol + dc, prow + dr);
          mc.fillStyle = TILE_COLORS[tile] || '#000';
          mc.fillRect(
            origin + dc * TILE_PX - Math.floor(TILE_PX / 2),
            origin + dr * TILE_PX - Math.floor(TILE_PX / 2),
            TILE_PX, TILE_PX
          );
        }
      }

      // Player dot at centre
      mc.fillStyle = '#ffffff';
      mc.fillRect(origin - 2, origin - 2, 4, 4);
    }

    // Blit cached canvas clipped to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.minimapCanvas, cx - span * TILE_PX, cy - span * TILE_PX);
    ctx.restore();

    // Gold border ring
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Thin inner dark ring
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* ═══════════════════════════════════════════════════════
     UNIFIED SIDE PANEL (bottom-right)
     ═══════════════════════════════════════════════════════ */
  drawSidePanel(activeTab, inventory, skills, equipment, dragSlot, hoverSlot, dragX, dragY, mouseX, mouseY) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    const PW = 232;
    const TAB_H = 28;
    const CONTENT_H = 378;
    const PH = TAB_H + CONTENT_H + 4;
    const px = W - PW - 4;
    const py = H - PH - 4;

    // ── Stone panel base ──────────────────────────────────
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(px, py, PW, PH);

    // Outer dark border
    ctx.strokeStyle = '#07050200';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 1, py - 1, PW + 2, PH + 2);

    // Inner bevel — light highlight (top + left)
    ctx.strokeStyle = '#5a3c1c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 1, py + PH - 1);
    ctx.lineTo(px + 1, py + 1);
    ctx.lineTo(px + PW - 1, py + 1);
    ctx.stroke();

    // Inner bevel — shadow (bottom + right)
    ctx.strokeStyle = '#080503';
    ctx.beginPath();
    ctx.moveTo(px + 1, py + PH - 1);
    ctx.lineTo(px + PW - 1, py + PH - 1);
    ctx.lineTo(px + PW - 1, py + 1);
    ctx.stroke();

    // ── Tab bar ───────────────────────────────────────────
    const TABS = [
      { key: 'inventory', label: 'Items'  },
      { key: 'skills',    label: 'Skills' },
      { key: 'equip',     label: 'Worn'   },
    ];
    const tabW = Math.floor(PW / TABS.length);
    for (let i = 0; i < TABS.length; i++) {
      const t = TABS[i];
      const tx = px + i * tabW;
      const tw = (i === TABS.length - 1) ? PW - i * tabW : tabW; // last tab fills remainder
      const active = activeTab === t.key;

      // Tab background
      ctx.fillStyle = active ? '#2c1c0a' : '#100b05';
      ctx.fillRect(tx, py, tw, TAB_H);

      // Active tab: gold top strip
      if (active) {
        ctx.fillStyle = '#c89030';
        ctx.fillRect(tx + 1, py, tw - 2, 2);
      }

      // Tab divider
      if (i > 0) {
        ctx.fillStyle = '#080503';
        ctx.fillRect(tx, py + 2, 1, TAB_H - 4);
        ctx.fillStyle = '#3a2410';
        ctx.fillRect(tx + 1, py + 2, 1, TAB_H - 4);
      }

      ctx.fillStyle = active ? '#f0d060' : '#6a5030';
      ctx.font = `bold 11px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(t.label, tx + tw / 2, py + TAB_H / 2 + 4);
    }

    // Content separator: double line (gold over dark)
    ctx.fillStyle = '#c89030';
    ctx.fillRect(px + 2, py + TAB_H, PW - 4, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(px + 2, py + TAB_H + 1, PW - 4, 1);

    const contentY = py + TAB_H + 4;

    // ── Inventory tab ─────────────────────────────────────
    if (activeTab === 'inventory') {
      const CELL = INV_CELL, PAD = INV_PAD;
      const gridW = INV_COLS * (CELL + PAD) + PAD;
      const startX = px + Math.floor((PW - gridW) / 2);
      const startY = contentY + 6;

      for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) {
          const idx = r * INV_COLS + c;
          const cx2 = startX + PAD + c * (CELL + PAD);
          const cy2 = startY + r * (CELL + PAD);
          const isDragging   = idx === dragSlot;
          const isDropTarget = idx === hoverSlot && dragSlot !== -1;
          const isHovered    = dragSlot === -1 && mouseX >= cx2 && mouseX < cx2 + CELL &&
                               mouseY >= cy2 && mouseY < cy2 + CELL;

          // Dark inset slot
          ctx.fillStyle = isDropTarget ? '#2e1e00'
                        : isHovered    ? '#221608'
                        :                '#0d0804';
          ctx.fillRect(cx2, cy2, CELL, CELL);

          // Slot border: outer dark, inner dim amber
          ctx.strokeStyle = isDropTarget ? '#c89030' : '#2a1a08';
          ctx.lineWidth = isDropTarget ? 2 : 1;
          ctx.strokeRect(cx2, cy2, CELL, CELL);
          if (!isDropTarget) {
            ctx.strokeStyle = '#1a1006';
            ctx.strokeRect(cx2 + 1, cy2 + 1, CELL - 2, CELL - 2);
          }

          if (isDragging) continue;
          const slot = inventory.slots[idx];
          if (slot) {
            slot.item.draw(ctx, cx2 + 3, cy2 + 3, CELL - 6);

            if (slot.item.weight !== undefined) {
              const wText = `${slot.item.weight}kg`;
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.strokeText(wText, cx2 + CELL / 2, cy2 + CELL - 3);
              ctx.fillStyle = '#fff';
              ctx.fillText(wText, cx2 + CELL / 2, cy2 + CELL - 3);
            }

            if (slot.qty > 1) {
              const qStr = slot.qty >= 1000 ? `${(slot.qty / 1000).toFixed(0)}k` : slot.qty.toString();
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'left';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.strokeText(qStr, cx2 + 2, cy2 + 10);
              ctx.fillStyle = slot.qty >= 100000 ? '#00ff00' : slot.qty >= 1000 ? '#a0ff80' : '#f1c40f';
              ctx.fillText(qStr, cx2 + 2, cy2 + 10);
            }

          }
        }
      }

      // Ghost drag item
      if (dragSlot !== -1 && inventory.slots[dragSlot]) {
        const gs = CELL;
        const gx = dragX - gs / 2;
        const gy = dragY - gs / 2;
        ctx.globalAlpha = 0.75;
        inventory.slots[dragSlot].item.draw(ctx, gx + 3, gy + 3, gs - 6);
        ctx.globalAlpha = 1;
        if (inventory.slots[dragSlot].qty > 1) {
          const qStr = inventory.slots[dragSlot].qty.toString();
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeText(qStr, gx + 2, gy + 10);
          ctx.fillStyle = '#f1c40f';
          ctx.fillText(qStr, gx + 2, gy + 10);
        }
      }
    }

    // ── Skills tab — 4×5 icon grid ────────────────────────
    if (activeTab === 'skills') {
      const COLS = 4, ROWS = 5;
      const TOTAL_CELLS = COLS * ROWS;
      const HEADER_H = 20;
      const cellW = Math.floor(PW / COLS);
      const cellH = Math.floor((CONTENT_H - HEADER_H) / ROWS);

      ctx.fillStyle = '#6a5030';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Total Level: ${skills.totalLevel}`, px + PW / 2, contentY + 13);

      let hoveredSkill = -1;

      for (let i = 0; i < TOTAL_CELLS; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx2 = px + col * cellW;
        const cy2 = contentY + HEADER_H + row * cellH;
        const hasSkill = i < SKILL_NAMES.length;
        const level = hasSkill ? skills.getLevel(i) : 0;
        const hovered = hasSkill && mouseX >= cx2 && mouseX < cx2 + cellW &&
                        mouseY >= cy2 && mouseY < cy2 + cellH;
        if (hovered) hoveredSkill = i;

        // Cell background — dark inset
        ctx.fillStyle = !hasSkill ? '#080503'
                      : hovered   ? '#2c1c0a'
                      :             '#130e06';
        ctx.fillRect(cx2 + 2, cy2 + 2, cellW - 4, cellH - 4);

        // Cell border
        ctx.strokeStyle = !hasSkill ? '#1a1006'
                        : hovered   ? SKILL_COLORS[i]
                        :             '#2a1a08';
        ctx.lineWidth = hovered ? 1.5 : 1;
        ctx.strokeRect(cx2 + 2, cy2 + 2, cellW - 4, cellH - 4);

        if (!hasSkill) continue;

        const iconSize = Math.min(cellW - 10, cellH - 26);
        const iconX = cx2 + Math.floor((cellW - iconSize) / 2);
        const iconY = cy2 + 4;
        this._drawSkillIcon(ctx, i, iconX, iconY, iconSize);

        ctx.fillStyle = hovered ? '#f0d060' : '#e0d090';
        ctx.font = `bold 13px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${level}`, cx2 + cellW / 2, cy2 + cellH - 4);
      }

      // Skill tooltip
      if (hoveredSkill !== -1) {
        const si = hoveredSkill;
        const level  = skills.getLevel(si);
        const xp     = skills.xp[si];
        const toNext = skills.xpToNext(si);
        const prog   = skills.progressToNext(si);
        const TW = 188, TH = 112;
        let ttx = px - TW - 8;
        if (ttx < 4) ttx = px + PW + 8;
        const tty = Math.max(4, Math.min(mouseY - TH / 2, H - TH - 4));

        ctx.fillStyle = '#0d0804';
        ctx.fillRect(ttx, tty, TW, TH);
        ctx.strokeStyle = SKILL_COLORS[si];
        ctx.lineWidth = 1;
        ctx.strokeRect(ttx, tty, TW, TH);
        ctx.strokeStyle = '#5a3c1c';
        ctx.strokeRect(ttx + 1, tty + 1, TW - 2, TH - 2);

        ctx.fillStyle = SKILL_COLORS[si];
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(SKILL_NAMES[si], ttx + 10, tty + 18);

        ctx.fillStyle = '#c0a860';
        ctx.font = '10px monospace';
        ctx.fillText(`Level:       ${level} / 99`, ttx + 10, tty + 36);
        ctx.fillText(`Total XP:    ${xp.toLocaleString()}`, ttx + 10, tty + 51);
        ctx.fillText(
          level >= 99 ? 'XP to next:  MAX' : `XP to next:  ${toNext.toLocaleString()}`,
          ttx + 10, tty + 66
        );

        const barW = TW - 20;
        ctx.fillStyle = '#1a1006';
        ctx.fillRect(ttx + 10, tty + 76, barW, 10);
        if (prog > 0) {
          ctx.fillStyle = SKILL_COLORS[si];
          ctx.fillRect(ttx + 10, tty + 76, barW * prog, 10);
        }
        ctx.fillStyle = '#6a5030';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(prog * 100)}%  to level ${Math.min(99, level + 1)}`, ttx + TW / 2, tty + 103);
      }
    }

    // ── Worn Items (Equipment) tab ────────────────────────
    if (activeTab === 'equip') {
      const SLOTS = ['helmet','chestplate','leggings','gloves','boots','cape','weapon'];
      const LABELS = {
        helmet: 'Helmet', chestplate: 'Chest', leggings: 'Legs',
        gloves: 'Gloves', boots: 'Boots',  cape: 'Cape', weapon: 'Weapon',
      };
      const ICON_SIZE = 28;
      const ROW_H = Math.floor((CONTENT_H - 36) / SLOTS.length);

      SLOTS.forEach((slot, i) => {
        const ry = contentY + i * ROW_H;
        const equipped = equipment[slot];
        const isEmpty = !equipped || equipped === 'none';
        const hovered = mouseX >= px && mouseX < px + PW && mouseY >= ry && mouseY < ry + ROW_H;

        // Row hover tint
        if (hovered && !isEmpty) {
          ctx.fillStyle = 'rgba(200,144,48,0.08)';
          ctx.fillRect(px + 2, ry + 1, PW - 4, ROW_H - 2);
        }

        // Row separator
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(px + 6, ry, PW - 12, 1);

        // Item icon box
        const iconX = px + 8;
        const iconY = ry + Math.floor((ROW_H - ICON_SIZE) / 2);
        ctx.fillStyle = '#0d0804';
        ctx.fillRect(iconX, iconY, ICON_SIZE, ICON_SIZE);
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX, iconY, ICON_SIZE, ICON_SIZE);

        // Draw item sprite in icon box if equipped
        if (!isEmpty) {
          const itemDef = EQUIP_ID_TO_ITEM[equipped];
          if (itemDef) {
            itemDef.draw(ctx, iconX + 2, iconY + 2, ICON_SIZE - 4);
          }
          // Rarity colour dot on icon corner
          const gearEntry = GEAR_BY_ID.get(equipped);
          if (gearEntry?.rarity?.color) {
            ctx.fillStyle = gearEntry.rarity.color;
            ctx.fillRect(iconX + ICON_SIZE - 5, iconY, 5, 5);
          }
        }

        // Slot label
        ctx.fillStyle = '#6a5030';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(LABELS[slot], px + ICON_SIZE + 14, ry + ROW_H / 2 - 4);

        // Equipped item name — use gear entry name if available, fall back to id
        const gearEntry = isEmpty ? null : GEAR_BY_ID.get(equipped);
        const displayName = isEmpty ? 'Empty'
          : gearEntry ? gearEntry.name
          : equipped.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const rarityColor = gearEntry?.rarity?.color ?? null;

        ctx.fillStyle = isEmpty ? '#3a2810' : (rarityColor ?? '#c0a860');
        ctx.font = isEmpty ? '9px monospace' : 'bold 9px monospace';
        ctx.fillText(displayName, px + ICON_SIZE + 14, ry + ROW_H / 2 + 7);

        // Unequip hint on hover
        if (!isEmpty && hovered) {
          ctx.fillStyle = '#a03020';
          ctx.font = '8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('unequip', px + PW - 6, ry + ROW_H - 4);
        }
      });

      // View Character button
      const vbY = contentY + SLOTS.length * ROW_H + 6;
      const vbH = 26;
      const vbHov = mouseX >= px + 8 && mouseX < px + PW - 8 &&
                    mouseY >= vbY && mouseY < vbY + vbH;

      ctx.fillStyle = vbHov ? '#243040' : '#141c26';
      ctx.fillRect(px + 8, vbY, PW - 16, vbH);
      ctx.strokeStyle = vbHov ? '#4a90d0' : '#243040';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 8, vbY, PW - 16, vbH);
      ctx.fillStyle = vbHov ? '#78b4ff' : '#4a7aaa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('View Character', px + PW / 2, vbY + 17);
    }

    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     HUD
     ═══════════════════════════════════════════════════════ */
  drawHUD(player, fps, xpFlashes) {
    const ctx = this.ctx;

    // Bottom-left: coordinates
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, this.canvas.height - 34, 200, 26);
    ctx.fillStyle = '#ccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const col = Math.floor(player.cx / TILE_SIZE);
    const row = Math.floor(player.cy / TILE_SIZE);
    ctx.fillText(`Tile: (${col}, ${row})  FPS: ${fps}`, 14, this.canvas.height - 16);

    // Top-left: HP bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, 8, 140, 28);
    ctx.fillStyle = '#333';
    ctx.fillRect(12, 12, 132, 20);
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? '#27ae60' : hpRatio > 0.25 ? '#f39c12' : '#c0392b';
    ctx.fillRect(12, 12, 132 * hpRatio, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 78, 27);

    // Bottom-centre hint
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    const hintW = 440;
    const hintX = (this.canvas.width - hintW) / 2;
    ctx.fillRect(hintX, this.canvas.height - 34, hintW, 26);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD/click to move • Click mobs to fight • [I]/[TAB]/[E] Panel tabs • [ESC] Cancel', this.canvas.width / 2, this.canvas.height - 16);

    // XP progress cards (top centre, stacked)
    if (xpFlashes && xpFlashes.length > 0) {
      const CARD_W = 300, CARD_H = 62, CARD_GAP = 6;
      const ICON_SIZE = 36, PAD = 10;
      const bx = Math.floor((this.canvas.width - CARD_W) / 2);
      let by = 10;

      for (const f of xpFlashes) {
        // Fade out over last second
        const alpha = f.timer > 1 ? 1 : f.timer;
        const color = SKILL_COLORS[f.skillId] || '#888';
        const prog = Math.max(0, Math.min(1, f.displayProg ?? 0));
        const level = f.level ?? 1;
        const skillName = SKILL_NAMES[f.skillId] ?? 'Unknown';

        ctx.save();
        ctx.globalAlpha = alpha;

        // Card shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        this._roundRect(ctx, bx + 3, by + 3, CARD_W, CARD_H, 8);
        ctx.fill();

        // Card background — dark with subtle gradient-like layering
        ctx.fillStyle = 'rgb(18,14,10)';
        this._roundRect(ctx, bx, by, CARD_W, CARD_H, 8);
        ctx.fill();

        // Coloured left accent strip
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(bx, by + 8);
        ctx.lineTo(bx, by + CARD_H - 8);
        ctx.quadraticCurveTo(bx, by + CARD_H, bx + 8, by + CARD_H);
        ctx.lineTo(bx + 4, by + CARD_H);
        ctx.quadraticCurveTo(bx, by + CARD_H, bx, by + CARD_H - 4);
        ctx.lineTo(bx, by + CARD_H - 8);
        // simple rect strip
        ctx.fillRect(bx, by + 8, 4, CARD_H - 16);
        ctx.fill();

        // Card border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.6;
        this._roundRect(ctx, bx, by, CARD_W, CARD_H, 8);
        ctx.stroke();
        ctx.globalAlpha = alpha;

        // Skill icon box (left side)
        const iconX = bx + PAD + 4;
        const iconY = by + Math.floor((CARD_H - ICON_SIZE) / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        this._roundRect(ctx, iconX - 2, iconY - 2, ICON_SIZE + 4, ICON_SIZE + 4, 5);
        ctx.fill();
        this._drawSkillIcon(ctx, f.skillId, iconX, iconY, ICON_SIZE);

        // Skill name + level (right of icon)
        const textX = iconX + ICON_SIZE + PAD;
        ctx.fillStyle = color;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(skillName, textX, by + 20);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Level ${level}`, textX, by + 35);

        // +XP gained (top right)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`+${f.gained} xp`, bx + CARD_W - PAD, by + 20);

        // Progress bar (bottom strip inside card)
        const barX = textX;
        const barY = by + CARD_H - 16;
        const barW = CARD_W - textX + bx - PAD;
        const barH = 7;

        // Track
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this._roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fill();

        // Fill
        if (prog > 0) {
          ctx.fillStyle = color;
          this._roundRect(ctx, barX, barY, barW * prog, barH, 3);
          ctx.fill();
        }

        // Progress % text
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(prog * 100)}%`, bx + CARD_W - PAD, barY + barH - 1);

        ctx.restore();
        by += CARD_H + CARD_GAP;
      }
      ctx.textAlign = 'left';
    }
  }

  /* ═══════════════════════════════════════════════════════
     TILE HOVER TOOLTIP
     ═══════════════════════════════════════════════════════ */
  drawTileTooltip(text, screenX, screenY) {
    if (!text) return;
    const ctx = this.ctx;
    ctx.font = '12px monospace';
    const tw = ctx.measureText(text).width + 12;
    const tx = screenX + 16;
    const ty = screenY - 8;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this._roundRect(ctx, tx, ty - 14, tw, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'left';
    ctx.fillText(text, tx + 6, ty);
  }

  /* ═══════════════════════════════════════════════════════
     SHOP PANEL
     ═══════════════════════════════════════════════════════ */
  drawShopPanel(shopTab, shopStock, inventory) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const px = Math.floor((W - SHOP_PW) / 2);
    const py = Math.floor((H - SHOP_PH) / 2);

    // Dim background overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);

    // Panel background
    ctx.fillStyle = 'rgba(15,12,8,0.97)';
    this._roundRect(ctx, px, py, SHOP_PW, SHOP_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, SHOP_PW, SHOP_PH, 8);
    ctx.stroke();

    // Header — title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('General Store', px + 12, py + 24);

    // Header — subtitle hint
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Click outside to close', px + 12, py + 40);

    // Header — gold
    const gold = inventory.count('gold_coin');
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${gold}`, px + SHOP_PW - 12, py + 28);

    // Divider
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + SHOP_HEADER_H - 2);
    ctx.lineTo(px + SHOP_PW - 8, py + SHOP_HEADER_H - 2);
    ctx.stroke();

    // Tabs
    const tabW = Math.floor(SHOP_PW / 2) - 8;
    const tabY = py + SHOP_HEADER_H;

    // Buy tab
    ctx.fillStyle = shopTab === 'buy' ? '#6b4f10' : 'rgba(50,40,25,0.8)';
    this._roundRect(ctx, px + 4, tabY + 4, tabW, SHOP_TAB_H - 8, 4);
    ctx.fill();
    ctx.strokeStyle = shopTab === 'buy' ? '#8b6914' : '#444';
    ctx.lineWidth = 1;
    this._roundRect(ctx, px + 4, tabY + 4, tabW, SHOP_TAB_H - 8, 4);
    ctx.stroke();
    ctx.fillStyle = shopTab === 'buy' ? '#f1c40f' : '#888';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Buy', px + 4 + tabW / 2, tabY + 22);

    // Sell tab
    ctx.fillStyle = shopTab === 'sell' ? '#6b4f10' : 'rgba(50,40,25,0.8)';
    this._roundRect(ctx, px + SHOP_PW / 2 + 4, tabY + 4, tabW, SHOP_TAB_H - 8, 4);
    ctx.fill();
    ctx.strokeStyle = shopTab === 'sell' ? '#8b6914' : '#444';
    this._roundRect(ctx, px + SHOP_PW / 2 + 4, tabY + 4, tabW, SHOP_TAB_H - 8, 4);
    ctx.stroke();
    ctx.fillStyle = shopTab === 'sell' ? '#f1c40f' : '#888';
    ctx.fillText('Sell', px + SHOP_PW / 2 + 4 + tabW / 2, tabY + 22);

    // Content divider
    const contentY = tabY + SHOP_TAB_H;
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, contentY);
    ctx.lineTo(px + SHOP_PW - 8, contentY);
    ctx.stroke();

    // Item rows
    if (shopTab === 'buy') {
      for (let i = 0; i < shopStock.length; i++) {
        this._drawShopRow(ctx, px, contentY + i * SHOP_ROW_H, SHOP_PW, SHOP_ROW_H,
          shopStock[i].item, shopStock[i].buyPrice, null, gold, 'Buy');
      }
    } else {
      const sellable = inventory.slots
        .filter(s => s && SELL_PRICES[s.item.id] !== undefined);
      if (sellable.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Nothing to sell', px + SHOP_PW / 2, contentY + SHOP_ROW_H);
      } else {
        for (let i = 0; i < Math.min(sellable.length, 8); i++) {
          const slot = sellable[i];
          const qty = slot.item.stackable ? slot.qty : 1;
          const total = SELL_PRICES[slot.item.id] * qty;
          this._drawShopRow(ctx, px, contentY + i * SHOP_ROW_H, SHOP_PW, SHOP_ROW_H,
            slot.item, total, qty > 1 ? qty : null, Infinity, 'Sell');
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     HOUSE FURNITURE SHOP PANEL
     ═══════════════════════════════════════════════════════ */
  drawHouseShopPanel(stock, inventory) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - HOUSE_SHOP_PW) / 2);
    const py = Math.floor((H - HOUSE_SHOP_PH) / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(15,12,8,0.97)';
    this._roundRect(ctx, px, py, HOUSE_SHOP_PW, HOUSE_SHOP_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#5a3aaa';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, HOUSE_SHOP_PW, HOUSE_SHOP_PH, 8);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#d4a017';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Decorator\'s Shop', px + 12, py + 24);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Furniture for your home  •  Click outside to close', px + 12, py + 40);

    const gold = inventory.count('gold_coin');
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${gold}`, px + HOUSE_SHOP_PW - 12, py + 28);

    ctx.strokeStyle = '#3a2a6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + HOUSE_SHOP_HEADER_H - 2);
    ctx.lineTo(px + HOUSE_SHOP_PW - 8, py + HOUSE_SHOP_HEADER_H - 2);
    ctx.stroke();

    const contentY = py + HOUSE_SHOP_HEADER_H;
    for (let i = 0; i < stock.length; i++) {
      this._drawShopRow(ctx, px, contentY + i * HOUSE_SHOP_ROW_H, HOUSE_SHOP_PW, HOUSE_SHOP_ROW_H,
        stock[i].item, stock[i].buyPrice, null, gold, 'Buy');
    }
  }

  /* ═══════════════════════════════════════════════════════
     FORGE PANELS — Smelting (Furnace) & Smithing (Anvil)
     ═══════════════════════════════════════════════════════ */

  /** Draw one crafting recipe row: icon, name/level, ingredients, Craft button. */
  _drawForgeRow(ctx, px, rowY, pw, rowH, recipe, canCraft, skillLevel) {
    // Row separator
    ctx.strokeStyle = 'rgba(90,50,10,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, rowY + rowH - 1);
    ctx.lineTo(px + pw - 8, rowY + rowH - 1);
    ctx.stroke();

    const iconSize = rowH - 10;
    const iconX = px + 8;
    const iconY = rowY + 5;
    const locked = skillLevel < recipe.level;

    // Output icon background
    ctx.fillStyle = locked ? 'rgba(40,30,20,0.5)' : 'rgba(60,50,30,0.7)';
    this._roundRect(ctx, iconX, iconY, iconSize, iconSize, 3);
    ctx.fill();
    if (locked) { ctx.globalAlpha = 0.35; }
    recipe.output().draw(ctx, iconX, iconY, iconSize);
    ctx.globalAlpha = 1;

    // Recipe name
    ctx.fillStyle = locked ? '#555' : '#ddd';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.name, iconX + iconSize + 10, rowY + 15);

    // Level requirement
    ctx.fillStyle = locked ? '#a04040' : '#888';
    ctx.font = '10px monospace';
    ctx.fillText(`Forgery lv.${recipe.level}  •  +${recipe.xp} XP`, iconX + iconSize + 10, rowY + 28);

    // Ingredients
    let ingX = iconX + iconSize + 10;
    for (const { item, qty } of recipe.inputs) {
      const itm = item();
      const label = qty > 1 ? `${qty}x ${itm.name}` : itm.name;
      ctx.fillStyle = locked ? '#444' : (canCraft ? '#8bc34a' : '#c0392b');
      ctx.font = '10px monospace';
      ctx.fillText(label, ingX, rowY + rowH - 8);
      ingX += ctx.measureText(label).width + 14;
    }

    // Craft button
    const btnW = 62;
    const btnX = px + pw - btnW - 8;
    const btnY = rowY + Math.floor((rowH - 24) / 2);
    ctx.fillStyle = (!locked && canCraft) ? '#7a3a00' : '#333';
    this._roundRect(ctx, btnX, btnY, btnW, 24, 4);
    ctx.fill();
    ctx.strokeStyle = (!locked && canCraft) ? '#b7410e' : '#555';
    ctx.lineWidth = 1;
    this._roundRect(ctx, btnX, btnY, btnW, 24, 4);
    ctx.stroke();
    ctx.fillStyle = (!locked && canCraft) ? '#ff8c42' : '#555';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Forge', btnX + btnW / 2, btnY + 16);
  }

  drawSmeltPanel(recipes, inventory, skills) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - FORGE_PW) / 2);
    const py = Math.floor((H - SMELT_PH) / 2);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg
    ctx.fillStyle = 'rgba(12,8,4,0.97)';
    this._roundRect(ctx, px, py, FORGE_PW, SMELT_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#b7410e';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, FORGE_PW, SMELT_PH, 8);
    ctx.stroke();

    // Flame accent strip along top
    const grad = ctx.createLinearGradient(px, py, px + FORGE_PW, py);
    grad.addColorStop(0, 'rgba(183,65,14,0)');
    grad.addColorStop(0.5, 'rgba(255,140,66,0.25)');
    grad.addColorStop(1, 'rgba(183,65,14,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, FORGE_PW, FORGE_HEADER_H);

    // Header
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 Furnace — Smelting', px + 12, py + 26);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Smelt ores into bars  •  Click outside to close', px + 12, py + 42);

    const forgeLevel = skills.getLevel(10); // SKILL_IDS.FORGERY
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Forgery Lv.${forgeLevel}`, px + FORGE_PW - 12, py + 28);

    // Divider
    ctx.strokeStyle = '#7a2a00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + FORGE_HEADER_H - 1);
    ctx.lineTo(px + FORGE_PW - 8, py + FORGE_HEADER_H - 1);
    ctx.stroke();

    // Recipe rows
    const contentY = py + FORGE_HEADER_H;
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const canCraft = recipe.inputs.every(({ item, qty }) =>
        inventory.count(item().id) >= qty
      );
      this._drawForgeRow(ctx, px, contentY + i * FORGE_ROW_H, FORGE_PW, FORGE_ROW_H,
        recipe, canCraft, forgeLevel);
    }
  }

  drawSmithPanel(recipes, tab, inventory, skills) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - FORGE_PW) / 2);
    const py = Math.floor((H - SMITH_PH) / 2);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg
    ctx.fillStyle = 'rgba(8,10,14,0.97)';
    this._roundRect(ctx, px, py, FORGE_PW, SMITH_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a7ab7';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, FORGE_PW, SMITH_PH, 8);
    ctx.stroke();

    // Steel accent strip
    const grad2 = ctx.createLinearGradient(px, py, px + FORGE_PW, py);
    grad2.addColorStop(0, 'rgba(74,122,183,0)');
    grad2.addColorStop(0.5, 'rgba(120,180,255,0.18)');
    grad2.addColorStop(1, 'rgba(74,122,183,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(px, py, FORGE_PW, FORGE_HEADER_H);

    // Header
    ctx.fillStyle = '#78b4ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚒ Anvil — Smithing', px + 12, py + 26);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Smith bars into equipment  •  Click outside to close', px + 12, py + 42);

    const forgeLevel = skills.getLevel(10);
    ctx.fillStyle = '#78b4ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Forgery Lv.${forgeLevel}`, px + FORGE_PW - 12, py + 28);

    // Divider
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + FORGE_HEADER_H - 1);
    ctx.lineTo(px + FORGE_PW - 8, py + FORGE_HEADER_H - 1);
    ctx.stroke();

    // Tabs: Weapons | Tools | Armor
    const tabs = ['weapons', 'tools', 'armor'];
    const tabLabels = ['Weapons', 'Tools', 'Armor'];
    const tabW = Math.floor(FORGE_PW / 3);
    const tabY = py + FORGE_HEADER_H;
    for (let t = 0; t < tabs.length; t++) {
      const active = tab === tabs[t];
      ctx.fillStyle = active ? '#1e3a5a' : 'rgba(20,25,35,0.8)';
      this._roundRect(ctx, px + t * tabW + 3, tabY + 4, tabW - 6, FORGE_TAB_H - 8, 4);
      ctx.fill();
      ctx.strokeStyle = active ? '#4a7ab7' : '#333';
      ctx.lineWidth = 1;
      this._roundRect(ctx, px + t * tabW + 3, tabY + 4, tabW - 6, FORGE_TAB_H - 8, 4);
      ctx.stroke();
      ctx.fillStyle = active ? '#78b4ff' : '#666';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tabLabels[t], px + t * tabW + tabW / 2, tabY + 22);
    }

    // Content divider
    const contentY = tabY + FORGE_TAB_H;
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, contentY);
    ctx.lineTo(px + FORGE_PW - 8, contentY);
    ctx.stroke();

    // Recipe rows for active tab
    const tabRecipes = recipes[tab] || [];
    for (let i = 0; i < tabRecipes.length; i++) {
      const recipe = tabRecipes[i];
      const canCraft = recipe.inputs.every(({ item, qty }) =>
        inventory.count(item().id) >= qty
      );
      this._drawForgeRow(ctx, px, contentY + i * FORGE_ROW_H, FORGE_PW, FORGE_ROW_H,
        recipe, canCraft, forgeLevel);
    }
  }

  /* ═══════════════════════════════════════════════════════
     PLAYER VIEW PANEL
     ═══════════════════════════════════════════════════════ */
  /**
   * equipData: array of { slot, item, gear } — item may be null, gear from GEAR_BY_ID
   * Stats are derived directly from gear entries (accuracy/power/armour).
   */
  drawPlayerViewPanel(player, equipData, _totalStats, skills, elapsed) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 660, PH = 530;
    const px = Math.floor((W - PW) / 2);
    const py = Math.floor((H - PH) / 2);

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg
    ctx.fillStyle = 'rgba(6,8,14,0.98)';
    this._roundRect(ctx, px, py, PW, PH, 10);
    ctx.fill();
    // Animated border glow
    const glow = 0.6 + 0.3 * Math.sin(elapsed * 2);
    ctx.strokeStyle = `rgba(74,144,208,${glow})`;
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, PW, PH, 10);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#78b4ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Character', px + 14, py + 28);
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.fillText('Click outside to close', px + 14, py + 44);

    // Header divider
    ctx.strokeStyle = 'rgba(74,144,208,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 52); ctx.lineTo(px + PW - 8, py + 52);
    ctx.stroke();

    // ── Left: character preview ──
    const charW = 200;
    const charH = PH - 62;
    const charX = px + 8;
    const charY = py + 56;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, charX, charY, charW, charH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,80,140,0.6)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, charX, charY, charW, charH, 6);
    ctx.stroke();

    // Grid lines in background
    ctx.strokeStyle = 'rgba(40,80,140,0.15)';
    ctx.lineWidth = 1;
    for (let gx = charX + 20; gx < charX + charW; gx += 20) {
      ctx.beginPath(); ctx.moveTo(gx, charY + 1); ctx.lineTo(gx, charY + charH - 1); ctx.stroke();
    }
    for (let gy = charY + 20; gy < charY + charH; gy += 20) {
      ctx.beginPath(); ctx.moveTo(charX + 1, gy); ctx.lineTo(charX + charW - 1, gy); ctx.stroke();
    }

    // Draw player character (scaled up, clipped)
    const SCALE = 3.5;
    const charCX = charX + charW / 2;
    const charCY = charY + charH * 0.44;
    ctx.save();
    ctx.beginPath();
    this._roundRect(ctx, charX + 1, charY + 1, charW - 2, charH - 2, 5);
    ctx.clip();
    ctx.translate(charCX - (player.x + player.w / 2) * SCALE,
                  charCY - (player.y + player.h / 2) * SCALE);
    ctx.scale(SCALE, SCALE);
    player.draw(ctx);
    ctx.restore();

    // Pedestal
    ctx.fillStyle = 'rgba(40,80,140,0.3)';
    ctx.beginPath();
    ctx.ellipse(charX + charW / 2, charCY + player.h * SCALE * 0.56, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // "Player" label
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Player', charX + charW / 2, charY + charH - 10);

    // ── Accumulate all five gear stats from gear registry ──
    let offAtk = 0, offStr = 0, defTotal = 0, totalCrit = 0, weaponSpeed = 1.0;
    let hasWeapon = false;
    for (const { slot, gear } of equipData) {
      if (!gear) continue;
      if (slot === 'weapon') {
        offAtk     += gear.stats.accuracy   || 0;
        offStr     += gear.stats.power      || 0;
        weaponSpeed = gear.stats.speed      ?? 1.0;
        hasWeapon   = true;
      } else {
        defTotal   += gear.stats.armour     || 0;
        const spd   = gear.stats.speed      ?? 1.0;
        if (spd !== 1.0) weaponSpeed *= spd;
      }
      totalCrit += gear.stats.critChance || 0;
    }
    if (!hasWeapon) weaponSpeed = 1.0;
    totalCrit = Math.min(totalCrit, 0.60);

    // ── Right: equipment + stats ──
    const rightX = charX + charW + 14;
    const rightW = PW - charW - 22;
    const SLOT_LABELS2 = { weapon:'Weapon', helmet:'Helmet', chestplate:'Chest',
                           leggings:'Legs', gloves:'Gloves', boots:'Boots', cape:'Cape' };
    const slotRowH = 44;
    const numSlots = equipData.length;
    const totalsColW = 100;

    // Equipment slots section header
    ctx.fillStyle = '#4a90d0';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('EQUIPMENT', rightX, py + 66);

    const slotsStartY = py + 74;

    for (let i = 0; i < equipData.length; i++) {
      const { slot, item } = equipData[i];
      const ry = slotsStartY + i * slotRowH;
      const isEmpty = !item;

      // Row separator
      if (i > 0) {
        ctx.strokeStyle = 'rgba(40,80,140,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX, ry); ctx.lineTo(rightX + rightW, ry);
        ctx.stroke();
      }

      // Item icon bg
      ctx.fillStyle = isEmpty ? 'rgba(20,15,8,0.5)' : 'rgba(40,30,20,0.8)';
      this._roundRect(ctx, rightX, ry + 6, 32, 32, 3);
      ctx.fill();
      ctx.strokeStyle = isEmpty ? 'rgba(60,50,30,0.3)' : 'rgba(139,105,20,0.5)';
      ctx.lineWidth = 1;
      this._roundRect(ctx, rightX, ry + 6, 32, 32, 3);
      ctx.stroke();

      if (!isEmpty && item.draw) {
        item.draw(ctx, rightX, ry + 6, 32);
      }

      // Slot label
      ctx.fillStyle = '#555';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(SLOT_LABELS2[slot] || slot, rightX + 38, ry + 16);

      // Item name — clipped to avoid overlapping the totals column
      ctx.save();
      ctx.beginPath();
      ctx.rect(rightX + 38, ry, rightW - totalsColW - 42, slotRowH);
      ctx.clip();
      const { gear } = equipData[i];
      const nameColor = isEmpty ? '#3a3a3a' : (gear?.rarity?.color ?? '#ddd');
      ctx.fillStyle = nameColor;
      ctx.font = isEmpty ? '9px monospace' : 'bold 10px monospace';
      ctx.fillText(isEmpty ? 'Empty' : item.name, rightX + 38, ry + 29);
      ctx.restore();
    }

    // ── Gear stats column: all 5 stats ──
    const totalsX = rightX + rightW - totalsColW;
    const totalsY = slotsStartY;
    const totalsH = numSlots * slotRowH - 4;

    // Column background
    ctx.fillStyle = 'rgba(8,10,16,0.92)';
    this._roundRect(ctx, totalsX, totalsY, totalsColW, totalsH, 5);
    ctx.fill();
    ctx.strokeStyle = `rgba(74,144,208,${0.4 + 0.15 * Math.sin(elapsed * 1.8)})`;
    ctx.lineWidth = 1;
    this._roundRect(ctx, totalsX, totalsY, totalsColW, totalsH, 5);
    ctx.stroke();

    // Column header
    ctx.fillStyle = '#78b4ff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GEAR STATS', totalsX + totalsColW / 2, totalsY + 11);

    // Five stat rows
    const critPct  = Math.round(totalCrit * 100);
    const spdVal   = weaponSpeed.toFixed(2) + '\u00d7';  // × symbol
    const statRows = [
      { label: 'Accuracy', color: '#e67e22', rawVal: offAtk,   dispVal: `+${offAtk}`,   nonZero: offAtk   > 0 },
      { label: 'Power',    color: '#e74c3c', rawVal: offStr,   dispVal: `+${offStr}`,   nonZero: offStr   > 0 },
      { label: 'Crit',     color: '#f39c12', rawVal: critPct,  dispVal: `${critPct}%`,  nonZero: critPct  > 0 },
      { label: 'Armour',   color: '#3498db', rawVal: defTotal, dispVal: `+${defTotal}`, nonZero: defTotal > 0 },
      { label: 'Speed',    color: '#2ecc71', rawVal: 0,        dispVal: spdVal,         nonZero: Math.abs(weaponSpeed - 1.0) > 0.004 },
    ];
    const rowSlotH = Math.floor((totalsH - 16) / statRows.length);

    for (let ri = 0; ri < statRows.length; ri++) {
      const sr  = statRows[ri];
      const ry  = totalsY + 14 + ri * rowSlotH;

      // Divider
      ctx.strokeStyle = 'rgba(74,144,208,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(totalsX + 4, ry); ctx.lineTo(totalsX + totalsColW - 4, ry);
      ctx.stroke();

      // Label
      ctx.fillStyle = sr.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sr.label, totalsX + 5, ry + 11);

      // Value — green if non-zero, grey if zero/default
      ctx.fillStyle = sr.nonZero ? '#8bc34a' : '#484848';
      ctx.font = `bold ${sr.nonZero ? 12 : 10}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(sr.dispVal, totalsX + totalsColW - 4, ry + rowSlotH - 5);
    }

    // ── Combat stats section ──
    const statsY = slotsStartY + numSlots * slotRowH + 14;

    ctx.strokeStyle = 'rgba(74,144,208,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX, statsY); ctx.lineTo(rightX + rightW, statsY);
    ctx.stroke();

    ctx.fillStyle = '#4a90d0';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('COMBAT STATS', rightX, statsY + 14);

    // Skill levels + gear bonuses  (offAtk = accuracy, offStr = power, defTotal = armour)
    const statCols = [
      { label: 'Attack',   color: '#e74c3c', level: skills.getLevel(4), bonus: offAtk,   bonusLabel: 'acc' },
      { label: 'Strength', color: '#e67e22', level: skills.getLevel(5), bonus: offStr,   bonusLabel: 'pow' },
      { label: 'Defence',  color: '#3498db', level: skills.getLevel(6), bonus: defTotal, bonusLabel: 'arm' },
      { label: 'HP',       color: '#2ecc71', level: skills.getLevel(7), bonus: 0,        bonusLabel: ''    },
    ];
    const colW = Math.floor(rightW / 4);

    for (let i = 0; i < 4; i++) {
      const sc = statCols[i];
      const bx = rightX + i * colW;
      const by = statsY + 20;

      ctx.fillStyle = 'rgba(10,8,4,0.9)';
      this._roundRect(ctx, bx, by, colW - 4, 68, 4);
      ctx.fill();
      ctx.strokeStyle = sc.color;
      ctx.lineWidth = 1;
      this._roundRect(ctx, bx, by, colW - 4, 68, 4);
      ctx.stroke();

      ctx.fillStyle = sc.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sc.label, bx + (colW - 4) / 2, by + 13);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${sc.level}`, bx + (colW - 4) / 2, by + 40);

      if (sc.bonus > 0) {
        ctx.fillStyle = '#8bc34a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`+${sc.bonus}${sc.bonusLabel ? ' ' + sc.bonusLabel : ''}`, bx + (colW - 4) / 2, by + 58);
      } else {
        ctx.fillStyle = '#444';
        ctx.font = '9px monospace';
        ctx.fillText(sc.bonusLabel ? 'no ' + sc.bonusLabel : '—', bx + (colW - 4) / 2, by + 58);
      }
    }

    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     SMELTING PROGRESS OVERLAY
     ═══════════════════════════════════════════════════════ */
  drawSmeltingProgress(action, elapsed) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const prog = Math.min(action.progress, 1);
    const recipe = action.recipe;

    // Dark overlay — flicker with furnace glow
    const flicker = 0.05 * Math.sin(elapsed * 17.3);
    ctx.fillStyle = `rgba(0,0,0,${0.72 + flicker})`;
    ctx.fillRect(0, 0, W, H);

    // Ambient glow on floor
    const glowX = W / 2, glowY = H / 2 + 80;
    const glowR = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, 260);
    glowR.addColorStop(0, `rgba(255,80,0,${0.18 + flicker * 2})`);
    glowR.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = glowR;
    ctx.fillRect(glowX - 260, glowY - 260, 520, 520);

    // Central panel
    const PW = 400, PH = 300;
    const px = Math.floor((W - PW) / 2);
    const py = Math.floor((H - PH) / 2);

    ctx.fillStyle = 'rgba(6,2,0,0.97)';
    this._roundRect(ctx, px, py, PW, PH, 12);
    ctx.fill();

    // Animated orange border
    const borderGlow = 0.55 + 0.35 * Math.sin(elapsed * 5);
    ctx.strokeStyle = `rgba(255,100,0,${borderGlow})`;
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, PW, PH, 12);
    ctx.stroke();

    // Inner top accent glow
    const topGrad = ctx.createLinearGradient(px, py, px + PW, py);
    topGrad.addColorStop(0, 'rgba(255,60,0,0)');
    topGrad.addColorStop(0.5, `rgba(255,120,0,${0.2 + flicker})`);
    topGrad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(px, py, PW, 3);

    // Title
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Smelting...', px + PW / 2, py + 34);

    // Recipe name
    ctx.fillStyle = '#ddd';
    ctx.font = '13px monospace';
    ctx.fillText(recipe.name, px + PW / 2, py + 56);

    // ── Furnace illustration ──
    const fx = px + PW / 2;
    const fy = py + 80;

    // Stone body
    ctx.fillStyle = '#484848'; ctx.fillRect(fx - 40, fy, 80, 55);
    ctx.fillStyle = '#606060'; ctx.fillRect(fx - 38, fy,  76, 8);

    // Furnace mouth (arch)
    ctx.fillStyle = '#181010'; ctx.fillRect(fx - 22, fy + 10, 44, 38);
    ctx.fillStyle = '#0e0808'; ctx.fillRect(fx - 18, fy + 6, 36, 12);

    // Fire glow inside furnace — animated
    const f1 = 0.6 + 0.4 * Math.sin(elapsed * 7.1);
    const f2 = 0.6 + 0.4 * Math.sin(elapsed * 8.3 + 1.2);
    const f3 = 0.6 + 0.4 * Math.sin(elapsed * 5.7 + 2.4);

    ctx.fillStyle = `rgba(255,100,0,${f1})`;   ctx.fillRect(fx - 18, fy + 18, 36, 28);
    ctx.fillStyle = `rgba(255,160,0,${f2})`;   ctx.fillRect(fx - 12, fy + 14, 24, 22);
    ctx.fillStyle = `rgba(255,220,50,${f3})`;  ctx.fillRect(fx - 6,  fy + 16, 12, 14);
    ctx.fillStyle = `rgba(255,255,200,${f1})`; ctx.fillRect(fx - 3,  fy + 20, 6,  6);

    // Glow spill
    const spill = ctx.createRadialGradient(fx, fy + 30, 5, fx, fy + 30, 50);
    spill.addColorStop(0, `rgba(255,140,0,${0.25 * f1})`);
    spill.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.fillStyle = spill; ctx.fillRect(fx - 50, fy, 100, 70);

    // Chimney
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(fx - 16, fy - 32, 32, 34);
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(fx - 14, fy - 30, 28, 30);
    ctx.fillStyle = '#303030'; ctx.fillRect(fx - 20, fy - 35, 40, 6);

    // Smoke puffs
    for (let i = 0; i < 4; i++) {
      const t = ((elapsed * 0.6 + i * 0.7) % 2.5);
      const smoke_y = fy - 36 - t * 28;
      const smoke_a = Math.max(0, 0.5 - t * 0.2);
      const smoke_r = 5 + t * 4;
      ctx.fillStyle = `rgba(70,60,50,${smoke_a})`;
      ctx.beginPath();
      ctx.arc(fx + Math.sin(i * 1.8 + elapsed) * 8, smoke_y, smoke_r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sparks flying up
    for (let i = 0; i < 10; i++) {
      const t = ((elapsed * 1.8 + i * 0.4) % 2.2);
      if (t > 1.1) continue;
      const sx2 = fx + Math.sin(i * 2.7 + elapsed * 0.5) * 18 * (1 + t);
      const sy2 = fy + 30 - t * 55;
      const sa = Math.max(0, 1 - t * 1.5);
      const hue = 30 + (i * 13) % 40;
      ctx.fillStyle = `rgba(255,${150 + hue},0,${sa})`;
      ctx.fillRect(Math.round(sx2), Math.round(sy2), 2, 2);
    }

    // ── Molten metal bar preview ──
    const barPX = px + PW - 105;
    const barPY = fy + 10;
    // Show input ore(s) → output bar
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Result:', barPX + 40, barPY - 4);
    // Draw output icon large
    ctx.fillStyle = 'rgba(40,30,20,0.8)';
    this._roundRect(ctx, barPX + 10, barPY, 60, 60, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,140,0,0.6)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, barPX + 10, barPY, 60, 60, 4);
    ctx.stroke();
    if (recipe.output) {
      const outItem = recipe.output();
      if (outItem && outItem.draw) outItem.draw(ctx, barPX + 10, barPY, 60);
    }

    // ── Progress bar ──
    const pbX = px + 24, pbY = py + PH - 70;
    const pbW = PW - 48, pbH = 30;

    // Track
    ctx.fillStyle = '#1a0800';
    this._roundRect(ctx, pbX, pbY, pbW, pbH, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a1800';
    ctx.lineWidth = 1;
    this._roundRect(ctx, pbX, pbY, pbW, pbH, 8);
    ctx.stroke();

    // Fill — lava gradient
    const fillW = Math.max(4, pbW * prog);
    const lavaG = ctx.createLinearGradient(pbX, pbY, pbX + pbW, pbY);
    lavaG.addColorStop(0,   '#cc3300');
    lavaG.addColorStop(0.4, '#ff6600');
    lavaG.addColorStop(0.8, '#ff9900');
    lavaG.addColorStop(1,   '#ffcc00');
    ctx.fillStyle = lavaG;
    this._roundRect(ctx, pbX, pbY, fillW, pbH, 8);
    ctx.fill();

    // Glow edge
    if (prog > 0.02) {
      const edgeX = pbX + fillW - 6;
      const edgeGlow = ctx.createLinearGradient(edgeX, pbY, edgeX + 10, pbY);
      edgeGlow.addColorStop(0, `rgba(255,200,100,${0.5 + flicker})`);
      edgeGlow.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(edgeX, pbY, 10, pbH);
    }

    // Ripple effect on lava surface
    for (let i = 0; i < 3; i++) {
      const rx = pbX + (fillW * (0.2 + i * 0.3));
      const ra = 0.4 * Math.sin(elapsed * 4 + i * 2.1);
      if (ra > 0 && rx < pbX + fillW - 4) {
        ctx.fillStyle = `rgba(255,230,100,${ra})`;
        ctx.fillRect(Math.round(rx), pbY + 4, 8, 4);
      }
    }

    // Percentage text
    ctx.fillStyle = prog > 0.45 ? '#1a0800' : '#ffaa44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(prog * 100)}%`, pbX + pbW / 2, pbY + 21);

    // Bottom label
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(`Forgery xp on completion: +${recipe.xp}`, pbX + pbW / 2, py + PH - 14);

    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     PLACEMENT CURSOR (camera-space)
     ═══════════════════════════════════════════════════════ */
  drawPlacementCursor(col, row, elapsed, item, rotation) {
    const ctx = this.ctx;
    const px = col * 32, py = row * 32;
    const pulse = 0.55 + 0.45 * Math.sin(elapsed * 6);

    const facingMap = ["north", "east", "south", "west"];
    const facing = facingMap[rotation] || "south";

    ctx.save();
    ctx.globalAlpha = 0.7;

    if (item?.draw) {
      item.draw(ctx, px, py, 32, facing);
    }

    ctx.globalAlpha = 1;

    ctx.strokeStyle = `rgba(100,220,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, 30, 30);

    const dirLabels = ['↑','→','↓','←'];
    ctx.fillStyle = `rgba(100,220,255,${pulse})`;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dirLabels[rotation], px + 26, py + 12);

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     BUILD-MODE FURNITURE CURSOR (camera-space)
     ═══════════════════════════════════════════════════════ */
  drawBuildModeFurnCursor(col, row, elapsed, furnitureDef, rotation) {
    if (!furnitureDef) return;
    const ctx = this.ctx;
    const { w, h } = rotatedFootprint(furnitureDef, rotation);
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 6);
    ctx.save();
    ctx.strokeStyle = `rgba(255,220,80,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.fillStyle = `rgba(255,220,80,${0.12 * pulse})`;
    ctx.fillRect(col * 32, row * 32, w * 32, h * 32);
    ctx.strokeRect(col * 32 + 1, row * 32 + 1, w * 32 - 2, h * 32 - 2);
    const dirLabels = ['↑','→','↓','←'];
    ctx.fillStyle = `rgba(255,220,80,${0.8 + 0.2 * pulse})`;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dirLabels[rotation], col * 32 + 26, row * 32 + 12);
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     HOUSING BUILD MODE PANEL (screen-space)
     ═══════════════════════════════════════════════════════ */
  drawHousingBuildMode(housingState, step, selGX, selGY,
                       roomScroll, furnScroll,
                       mouseX, mouseY, archLevel,
                       inventory,
                       canvasW, canvasH) {
    const ctx = this.ctx;
    const px = Math.floor((canvasW - BM_PW) / 2);
    const py = Math.floor((canvasH - BM_PH) / 2);

    // ── backdrop ──────────────────────────────────────────
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(px, py, BM_PW, BM_PH);
    ctx.strokeStyle = '#7a5a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, BM_PW - 2, BM_PH - 2);
    ctx.strokeStyle = '#3a2a0a';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 3, BM_PW - 6, BM_PH - 6);

    // ── header ────────────────────────────────────────────
    ctx.fillStyle = '#1a0e02';
    ctx.fillRect(px, py, BM_PW, BM_HEADER_H);
    ctx.strokeStyle = '#7a5a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py + BM_HEADER_H, BM_PW, 0);

    ctx.fillStyle = '#e8c870';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Build Mode  [B] or [Esc] to close', px + BM_PW / 2, py + BM_HEADER_H / 2);

    // Close button
    const cx = px + BM_PW - 20, cy = py + 20;
    const hover = mouseX >= cx - 14 && mouseX <= cx + 14 && mouseY >= cy - 14 && mouseY <= cy + 14;
    ctx.fillStyle = hover ? '#7a1010' : '#3a0808';
    ctx.fillRect(cx - 14, cy - 14, 28, 28);
    ctx.strokeStyle = hover ? '#e05050' : '#6a2020';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 14, cy - 14, 28, 28);
    ctx.fillStyle = '#e07070';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', cx, cy);

    // ── Grid section ──────────────────────────────────────
    const gridLeft = px + BM_GRID_OFF;
    const gridTop  = py + BM_GRID_TOP;
    const availSlots = housingState.getAvailableSlots();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#a08050';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Layout  (click a cell or available slot)', gridLeft, gridTop - 6);

    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        const cx2 = gridLeft + gx * BM_GRID_CELL;
        const cy2 = gridTop  + gy * BM_GRID_CELL;
        const key = `${gx},${gy}`;
        const cell = housingState.getCell(gx, gy);
        const isAvail = availSlots.has(key);
        const isSel   = selGX === gx && selGY === gy;

        // Cell background
        if (cell) {
          const def = ROOM_DEFS[cell.typeId];
          ctx.fillStyle = def ? def.color : '#444';
          ctx.fillRect(cx2 + 1, cy2 + 1, BM_GRID_CELL - 2, BM_GRID_CELL - 2);
          // Tiny label
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const lbl = (def?.name ?? '?').substring(0, 6);
          ctx.fillText(lbl, cx2 + BM_GRID_CELL / 2, cy2 + BM_GRID_CELL / 2);
        } else if (isAvail) {
          ctx.fillStyle = 'rgba(255,255,160,0.08)';
          ctx.fillRect(cx2 + 1, cy2 + 1, BM_GRID_CELL - 2, BM_GRID_CELL - 2);
          ctx.fillStyle = 'rgba(255,255,100,0.5)';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', cx2 + BM_GRID_CELL / 2, cy2 + BM_GRID_CELL / 2);
        } else {
          ctx.fillStyle = 'rgba(20,10,0,0.6)';
          ctx.fillRect(cx2 + 1, cy2 + 1, BM_GRID_CELL - 2, BM_GRID_CELL - 2);
        }

        // Border
        ctx.strokeStyle = isSel ? '#f1c40f'
          : cell     ? 'rgba(180,140,60,0.6)'
          : isAvail  ? 'rgba(200,200,80,0.4)'
          : 'rgba(60,40,10,0.4)';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(cx2 + 0.5, cy2 + 0.5, BM_GRID_CELL - 1, BM_GRID_CELL - 1);
      }
    }

    // ── Right panel ───────────────────────────────────────
    const rox = px + BM_SPLIT_X + 10;
    const rpW = BM_PW - BM_SPLIT_X - 20;
    const listTop = py + BM_HEADER_H + 48;
    const ROW_H = 52;

    ctx.fillStyle = '#a08050';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (step === 'grid' || selGX === null) {
      ctx.fillStyle = '#6a5030';
      ctx.font = '11px monospace';
      const lines = [
        'Click an owned cell (coloured)',
        'to place furniture inside.',
        '',
        'Click a slot marked  +  to',
        'build a new room or plot.',
        '',
        `Architect level: ${archLevel}`,
      ];
      lines.forEach((ln, i) => {
        ctx.fillText(ln, rox, py + BM_HEADER_H + 16 + i * 16);
      });
    } else if (step === 'pick_room') {
      ctx.fillStyle = '#e8c870';
      ctx.fillText(`Build at (${selGX}, ${selGY})`, rox, py + BM_HEADER_H + 16);
      ctx.fillStyle = '#a08050';
      ctx.fillText('Choose a room type:', rox, py + BM_HEADER_H + 32);

      const allDefs = getUnlockedRoomDefs(99).filter(d => d.id !== 'starter');
      const visible = allDefs.slice(roomScroll, roomScroll + 5);
      visible.forEach((def, i) => {
        const ry = listTop + i * ROW_H;
        const canBuild = archLevel >= def.levelReq &&
          inventory.count('gold_coin') >= def.goldCost &&
          def.materials.every(m => inventory.count(m.itemId) >= m.qty);
        const rowHov = mouseX >= rox && mouseX <= rox + rpW && mouseY >= ry && mouseY <= ry + ROW_H - 4;

        ctx.fillStyle = rowHov ? 'rgba(255,220,80,0.12)' : 'rgba(60,40,10,0.4)';
        ctx.fillRect(rox, ry, rpW, ROW_H - 4);
        ctx.strokeStyle = canBuild ? '#a08040' : '#4a3010';
        ctx.lineWidth = 1;
        ctx.strokeRect(rox, ry, rpW, ROW_H - 4);

        // Colour swatch
        ctx.fillStyle = def.color;
        ctx.fillRect(rox + 4, ry + 4, 16, 16);

        ctx.fillStyle = canBuild ? '#e8c870' : '#6a5030';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(def.name, rox + 24, ry + 14);

        ctx.fillStyle = canBuild ? '#a0a870' : '#6a5030';
        ctx.font = '9px monospace';
        const cat = def.category === 'indoor' ? 'Indoor' : 'Outdoor';
        ctx.fillText(`Arch ${def.levelReq}  ${def.goldCost}g  ${cat}`, rox + 24, ry + 26);

        const matStr = def.materials.map(m => `${m.qty}×${m.itemId.replace(/_/g,' ')}`).join('  ') || 'No materials';
        ctx.fillText(matStr, rox + 4, ry + 40);
      });

      // Scroll arrows
      if (allDefs.length > 5) {
        const arrowY = listTop + 5 * ROW_H + 4;
        ctx.fillStyle = '#a08050';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        if (roomScroll > 0) ctx.fillText('▲ prev', rox + rpW / 2 - 30, arrowY + 14);
        if (roomScroll + 5 < allDefs.length) ctx.fillText('▼ next', rox + rpW / 2 + 30, arrowY + 14);
      }
    } else if (step === 'pick_furniture') {
      const cell = housingState.getCell(selGX, selGY);
      if (!cell) return;
      const roomDef = ROOM_DEFS[cell.typeId];
      ctx.fillStyle = '#e8c870';
      ctx.fillText(`Furnish: ${roomDef?.name ?? '?'}`, rox, py + BM_HEADER_H + 16);
      ctx.fillStyle = '#a08050';
      ctx.fillText('Choose furniture to place:', rox, py + BM_HEADER_H + 32);

      const allFurn = Object.values(FURNITURE_DEFS).filter(fd =>
        fd.category === roomDef.category || fd.category === 'both');
      const visible = allFurn.slice(furnScroll, furnScroll + 5);
      visible.forEach((fd, i) => {
        const ry = listTop + i * ROW_H;
        const canPlace = archLevel >= fd.levelReq &&
          fd.materials.every(m => inventory.count(m.itemId) >= m.qty);
        const rowHov = mouseX >= rox && mouseX <= rox + rpW && mouseY >= ry && mouseY <= ry + ROW_H - 4;

        ctx.fillStyle = rowHov ? 'rgba(255,220,80,0.12)' : 'rgba(60,40,10,0.4)';
        ctx.fillRect(rox, ry, rpW, ROW_H - 4);
        ctx.strokeStyle = canPlace ? '#a08040' : '#4a3010';
        ctx.lineWidth = 1;
        ctx.strokeRect(rox, ry, rpW, ROW_H - 4);

        ctx.fillStyle = canPlace ? '#e8c870' : '#6a5030';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const fpLabel = `${fd.footprint.w}×${fd.footprint.h}`;
        ctx.fillText(`${fd.name}  [${fpLabel}]`, rox + 4, ry + 14);

        ctx.fillStyle = canPlace ? '#a0a870' : '#6a5030';
        ctx.font = '9px monospace';
        ctx.fillText(`Arch ${fd.levelReq}  ${fd.solid ? 'solid' : 'walkable'}`, rox + 4, ry + 26);

        const matStr = fd.materials.map(m => `${m.qty}×${m.itemId.replace(/_/g,' ')}`).join('  ') || 'Free';
        ctx.fillText(matStr, rox + 4, ry + 40);
      });

      // Placed furniture summary
      const placed = housingState.getFurniture(selGX, selGY);
      if (placed.length > 0) {
        const sumY = py + BM_PH - 44;
        ctx.fillStyle = '#6a5030';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${placed.length} item(s) placed in this room.`, rox, sumY);
      }

      if (allFurn.length > 5) {
        const arrowY = listTop + 5 * ROW_H + 4;
        ctx.fillStyle = '#a08050';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        if (furnScroll > 0) ctx.fillText('▲ prev', rox + rpW / 2 - 30, arrowY + 14);
        if (furnScroll + 5 < allFurn.length) ctx.fillText('▼ next', rox + rpW / 2 + 30, arrowY + 14);
      }
    }

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  _drawShopRow(ctx, px, rowY, pw, rowH, item, price, qty, playerGold, btnLabel) {
    const iconSize = rowH - 8;
    const iconX = px + 8;
    const iconY = rowY + 4;

    // Row separator
    ctx.strokeStyle = 'rgba(90,64,16,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, rowY + rowH - 1);
    ctx.lineTo(px + pw - 8, rowY + rowH - 1);
    ctx.stroke();

    // Item icon background
    ctx.fillStyle = 'rgba(60,50,35,0.6)';
    this._roundRect(ctx, iconX, iconY, iconSize, iconSize, 3);
    ctx.fill();

    // Draw item sprite at icon size
    item.draw(ctx, iconX, iconY, iconSize);

    // Item name
    const canAfford = playerGold >= price;
    ctx.fillStyle = canAfford ? '#ddd' : '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const label = qty != null ? `${item.name} x${qty}` : item.name;
    ctx.fillText(label, iconX + iconSize + 10, rowY + rowH / 2 - 2);

    // Price
    ctx.fillStyle = canAfford ? '#f1c40f' : '#a06010';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${price}g`, iconX + iconSize + 10, rowY + rowH / 2 + 12);

    // Button
    const btnW = 56;
    const btnX = px + pw - btnW - 8;
    const btnY = rowY + Math.floor((rowH - 24) / 2);
    ctx.fillStyle = canAfford ? '#8b6914' : '#444';
    this._roundRect(ctx, btnX, btnY, btnW, 24, 4);
    ctx.fill();
    ctx.fillStyle = canAfford ? '#f1c40f' : '#666';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(btnLabel, btnX + btnW / 2, btnY + 16);
  }

  /* ═══════════════════════════════════════════════════════
     MAKEOVER PANEL
     ═══════════════════════════════════════════════════════ */
  drawMakeoverPanel(style) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const px = Math.floor((W - MO_PW) / 2);
    const py = Math.floor((H - MO_PH) / 2);

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);

    // Panel background
    ctx.fillStyle = 'rgba(15,8,22,0.97)';
    this._roundRect(ctx, px, py, MO_PW, MO_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#9b3a9b';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, MO_PW, MO_PH, 8);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Character Makeover', px + 12, py + 24);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Click a swatch or style button  |  Click outside or Done to close', px + 12, py + 40);

    // Header divider
    ctx.strokeStyle = '#5a1a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + MO_HEADER_H - 2);
    ctx.lineTo(px + MO_PW - 8, py + MO_HEADER_H - 2);
    ctx.stroke();

    // ── Character preview ──────────────────────────────────
    const previewBoxW = 90;
    const previewBoxH = MO_PREVIEW_H - 16;
    const previewBoxX = px + (MO_PW - previewBoxW) / 2;
    const previewBoxY = py + MO_HEADER_H + 8;
    ctx.fillStyle = 'rgba(50,20,60,0.6)';
    this._roundRect(ctx, previewBoxX, previewBoxY, previewBoxW, previewBoxH, 6);
    ctx.fill();
    ctx.strokeStyle = '#5a1a7a';
    ctx.lineWidth = 1;
    this._roundRect(ctx, previewBoxX, previewBoxY, previewBoxW, previewBoxH, 6);
    ctx.stroke();

    const scale = 3;
    const charW = 24 * scale;
    const charX = previewBoxX + (previewBoxW - charW) / 2;
    const charY = previewBoxY + 6;
    this._drawCharacterPreview(ctx, charX, charY, scale, style);

    // ── Style rows (hair style, shirt style) ───────────────
    let contentY = py + MO_HEADER_H + MO_PREVIEW_H;
    for (let sr = 0; sr < MO_STYLE_ROWS.length; sr++) {
      const { label, key, options } = MO_STYLE_ROWS[sr];
      const rowY = contentY + sr * MO_STYLE_ROW_H;

      // Row separator
      ctx.strokeStyle = 'rgba(90,26,122,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 8, rowY);
      ctx.lineTo(px + MO_PW - 8, rowY);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ccc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + MO_PAD, rowY + MO_STYLE_ROW_H / 2 + 4);

      // Style buttons
      for (let i = 0; i < options.length; i++) {
        const { id, label: btnLabel } = options[i];
        const bx = px + MO_PAD + MO_LABEL_W + i * (MO_BTN_W + MO_BTN_GAP);
        const by = rowY + (MO_STYLE_ROW_H - MO_BTN_H) / 2;
        const active = style[key] === id;

        ctx.fillStyle = active ? '#6b1a8b' : 'rgba(40,20,55,0.8)';
        this._roundRect(ctx, bx, by, MO_BTN_W, MO_BTN_H, 4);
        ctx.fill();
        ctx.strokeStyle = active ? '#e040fb' : '#3a1a4a';
        ctx.lineWidth = active ? 2 : 1;
        this._roundRect(ctx, bx, by, MO_BTN_W, MO_BTN_H, 4);
        ctx.stroke();

        ctx.fillStyle = active ? '#e040fb' : '#aaa';
        ctx.font = `${active ? 'bold ' : ''}10px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(btnLabel, bx + MO_BTN_W / 2, by + MO_BTN_H / 2 + 4);
      }
    }

    // ── Colour swatch rows ─────────────────────────────────
    const swatchStartY = contentY + MO_STYLE_ROWS.length * MO_STYLE_ROW_H;
    for (let row = 0; row < MO_PALETTES.length; row++) {
      const { label, key, colors } = MO_PALETTES[row];
      const rowY      = swatchStartY + row * MO_ROW_H;
      const swatchTop = rowY + Math.floor((MO_ROW_H - MO_SWATCH) / 2);

      ctx.strokeStyle = 'rgba(90,26,122,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 8, rowY);
      ctx.lineTo(px + MO_PW - 8, rowY);
      ctx.stroke();

      ctx.fillStyle = '#ccc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + MO_PAD, swatchTop + MO_SWATCH - 7);

      for (let i = 0; i < colors.length; i++) {
        const swx      = px + MO_PAD + MO_LABEL_W + i * (MO_SWATCH + MO_SWATCH_GAP);
        const selected = style[key] === colors[i];
        if (selected) {
          ctx.fillStyle = '#e040fb';
          ctx.fillRect(swx - 3, swatchTop - 3, MO_SWATCH + 6, MO_SWATCH + 6);
        }
        ctx.fillStyle = colors[i];
        ctx.fillRect(swx, swatchTop, MO_SWATCH, MO_SWATCH);
      }
    }

    // ── Done button ────────────────────────────────────────
    ctx.strokeStyle = '#5a1a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + MO_PH - MO_PAD_BOT);
    ctx.lineTo(px + MO_PW - 8, py + MO_PH - MO_PAD_BOT);
    ctx.stroke();

    const doneBtnW = 110;
    const doneBtnH = 30;
    const doneBtnX = Math.floor(px + (MO_PW - doneBtnW) / 2);
    const doneBtnY = py + MO_PH - MO_PAD_BOT + 11;
    ctx.fillStyle = '#6b1a8b';
    this._roundRect(ctx, doneBtnX, doneBtnY, doneBtnW, doneBtnH, 6);
    ctx.fill();
    ctx.strokeStyle = '#9b3a9b';
    ctx.lineWidth = 1;
    this._roundRect(ctx, doneBtnX, doneBtnY, doneBtnW, doneBtnH, 6);
    ctx.stroke();
    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Done', doneBtnX + doneBtnW / 2, doneBtnY + 20);
  }

  _drawCharacterPreview(ctx, x, y, s, style) {
    // Legs
    ctx.fillStyle = style.pants;
    ctx.fillRect(x +  5*s, y + 22*s, 5*s, 10*s);
    ctx.fillRect(x + 14*s, y + 22*s, 5*s, 10*s);

    // Body + arms (delegates to shared helper so styles match the in-game sprite)
    drawBodyStyle(ctx, x, y, s, style, 0, 0);

    // Head
    ctx.fillStyle = style.skin;
    ctx.fillRect(x + 5*s, y + 1*s, 14*s, 12*s);

    // Hair (delegates to shared helper)
    drawHairStyle(ctx, x, y, s, style, 0);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(x +  7*s, y + 6*s, 2*s, 2*s);
    ctx.fillRect(x + 15*s, y + 6*s, 2*s, 2*s);
  }

  /* ── Utility ────────────────────────────────────────── */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawFade(alpha) {
    if (alpha <= 0) return;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
  }

  drawInteriorHeader(name) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, this.canvas.width, 28);
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, this.canvas.width / 2, 18);
  }

  drawEquipPanel(equipment, mx, my) {
    const ctx = this.ctx;
    const SLOTS = ['helmet','chestplate','leggings','gloves','boots','cape','weapon'];
    const LABELS = { helmet:'Helmet', chestplate:'Chestplate', leggings:'Leggings',
                     gloves:'Gloves', boots:'Boots', cape:'Cape', weapon:'Weapon' };
    const SLOT_COLORS = {
      leather_cap:'#6b4a2a', bronze_helm:'#cd7f32', iron_helm:'#8a8a8a', steel_helm:'#7a8a9a',
      leather_body:'#6b4a2a', bronze_plate:'#cd7f32', iron_plate:'#8a8a8a', mithril_plate:'#5a5a9a',
      leather_legs:'#6b4a2a', bronze_legs:'#cd7f32', iron_legs:'#8a8a8a', mithril_legs:'#5a5a9a',
      leather_gloves:'#6b4a2a', bronze_gauntlets:'#cd7f32', iron_gauntlets:'#8a8a8a', steel_gauntlets:'#7a8a9a',
      leather_boots:'#6b4a2a', bronze_boots:'#cd7f32', iron_boots:'#8a8a8a', steel_boots:'#7a8a9a',
      brown_cape:'#7a5030', red_cape:'#c0392b', blue_cape:'#2980b9', green_cape:'#27ae60',
      bronze_sword:'#cd7f32', iron_sword:'#8a8a8a', steel_sword:'#9aaabb', mithril_sword:'#7070cc',
      tungsten_blade:'#4a4a6a', obsidian_cleaver:'#2a1535', moonstone_staff:'#7090d0',
      steel_helm:'#7a8a9a', tungsten_helm:'#3a3a5a',
      steel_plate:'#7a9aaa', tungsten_plate:'#4a4a6a',
    };
    const SLOT_NAMES = {
      leather_cap:'Leather Cap', bronze_helm:'Bronze Helm', iron_helm:'Iron Helm', steel_helm:'Steel Helm',
      leather_body:'Leather Body', bronze_plate:'Bronze Plate', iron_plate:'Iron Plate', mithril_plate:'Mithril Plate',
      leather_legs:'Leather Legs', bronze_legs:'Bronze Legs', iron_legs:'Iron Legs', mithril_legs:'Mithril Legs',
      leather_gloves:'Leather Gloves', bronze_gauntlets:'Bronze Gauntlets', iron_gauntlets:'Iron Gauntlets', steel_gauntlets:'Steel Gauntlets',
      leather_boots:'Leather Boots', bronze_boots:'Bronze Boots', iron_boots:'Iron Boots', steel_boots:'Steel Boots',
      brown_cape:'Brown Cape', red_cape:'Red Cape', blue_cape:'Blue Cape', green_cape:'Green Cape',
      bronze_sword:'Bronze Sword', iron_sword:'Iron Sword', steel_sword:'Steel Sword', mithril_sword:'Mithril Sword',
      tungsten_blade:'Tungsten Blade', obsidian_cleaver:'Obsidian Cleaver', moonstone_staff:'Moonstone Staff',
      steel_helm:'Steel Helm', tungsten_helm:'Tungsten Helm',
      steel_plate:'Steel Plate', tungsten_plate:'Tungsten Plate',
    };

    const ROW_H = 48, PW = 220, PAD = 14;
    const PH = 36 + SLOTS.length * ROW_H + PAD;
    const px = 10;
    const py = Math.round(this.canvas.height / 2 - PH / 2);

    // Panel bg
    ctx.fillStyle = 'rgba(10,8,5,0.92)';
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, PW, PH);

    // Title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Equipment  [E]', px + PW / 2, py + 22);

    SLOTS.forEach((slot, i) => {
      const ry = py + 36 + i * ROW_H;
      const equipped = equipment[slot];
      const isEmpty = !equipped || equipped === 'none';
      const hovered = mx >= px && mx < px + PW && my >= ry && my < ry + ROW_H;

      ctx.fillStyle = hovered && !isEmpty ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0)';
      ctx.fillRect(px + 2, ry, PW - 4, ROW_H);

      // Divider
      ctx.strokeStyle = 'rgba(139,105,20,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 4, ry);
      ctx.lineTo(px + PW - 4, ry);
      ctx.stroke();

      // Colour swatch
      const sw = equipped && SLOT_COLORS[equipped];
      ctx.fillStyle = sw || 'rgba(60,50,35,0.6)';
      ctx.fillRect(px + 8, ry + 10, 20, 28);
      ctx.strokeStyle = 'rgba(200,200,200,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 8, ry + 10, 20, 28);

      // Slot label
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(LABELS[slot], px + 36, ry + 18);

      // Item name
      ctx.fillStyle = isEmpty ? '#444' : '#ddd';
      ctx.font = isEmpty ? '10px monospace' : 'bold 10px monospace';
      ctx.fillText(
        isEmpty ? 'Empty' : (SLOT_NAMES[equipped] || equipped),
        px + 36, ry + 33
      );

      // Unequip hint
      if (!isEmpty && hovered) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('click to remove', px + PW - 8, ry + ROW_H - 6);
      }
    });
    ctx.textAlign = 'left';
  }

  /** Pixel-art skill icons — drawn at (x,y) into a (size×size) box */
  _drawSkillIcon(ctx, skillIndex, x, y, size) {
    // Cache each (skillIndex, size) pair in an OffscreenCanvas so the 5-8
    // fillStyle/fillRect calls only run once per unique (skill, size) combo.
    if (!this._skillIconCache) this._skillIconCache = new Map();
    const cacheKey = skillIndex * 10000 + size;
    let cached = this._skillIconCache.get(cacheKey);
    if (!cached) {
      cached = new OffscreenCanvas(size, size);
      this._renderSkillIconInto(cached.getContext('2d'), skillIndex, 0, 0, size);
      this._skillIconCache.set(cacheKey, cached);
    }
    ctx.drawImage(cached, x, y);
  }

  _renderSkillIconInto(ctx, skillIndex, x, y, size) {
    const s = size / 32;
    const p = (px, py, pw, ph, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + px * s, y + py * s, pw * s, ph * s);
    };
    switch (skillIndex) {
      case 0: // Woodcutting — axe
        p(14,  2,  4, 16, '#8B5E3C'); // handle
        p(10,  2, 12,  8, '#C0C0C0'); // blade body
        p( 8,  2,  2,  4, '#A0A0A0'); // blade tip top
        p( 8,  6,  2,  4, '#A0A0A0'); // blade tip bot
        p(22,  2,  2,  8, '#888');    // back of blade
        break;
      case 1: // Firemaking — flame
        p(13, 24,  6,  4, '#8B4513'); // log
        p(12, 20,  8,  4, '#CD853F'); // ember
        p(11, 14,  4,  8, '#E74C3C'); // outer flame left
        p(17, 14,  4,  8, '#E74C3C'); // outer flame right
        p(13, 10,  6,  8, '#E67E22'); // mid flame
        p(14,  6,  4,  6, '#F39C12'); // upper flame
        p(15,  4,  2,  4, '#FFF176'); // tip
        break;
      case 2: // Fishing — fish
        p( 6, 14, 20,  6, '#3498DB'); // body
        p( 4, 12,  4,  4, '#2980B9'); // tail top
        p( 4, 18,  4,  4, '#2980B9'); // tail bot
        p(22, 13,  4,  2, '#5DADE2'); // fin top
        p(22, 17,  4,  2, '#5DADE2'); // fin bot
        p(24, 14,  2,  4, '#1F618D'); // head
        p(25, 14,  2,  2, '#fff');    // eye white
        p(26, 14,  1,  1, '#000');    // pupil
        break;
      case 3: // Cooking — pot
        p( 8, 14, 16, 12, '#95A5A6'); // pot body
        p( 6, 20,  2,  6, '#7F8C8D'); // left side
        p(24, 20,  2,  6, '#7F8C8D'); // right side
        p( 8, 26, 16,  2, '#BDC3C7'); // base
        p( 4, 14,  4,  4, '#7F8C8D'); // left handle
        p(24, 14,  4,  4, '#7F8C8D'); // right handle
        p(10, 10, 12,  6, '#BDC3C7'); // lid
        p(14,  8,  4,  4, '#95A5A6'); // lid knob
        p(12, 16,  8,  4, '#E74C3C'); // soup
        break;
      case 4: // Attack — sword
        p(15,  2,  2, 20, '#C0C0C0'); // blade
        p(10, 20, 12,  3, '#CD7F32'); // crossguard
        p(14, 23,  4,  8, '#8B4513'); // grip
        p(13, 29,  6,  2, '#CD7F32'); // pommel
        p(15,  2,  2,  4, '#E8E8E8'); // blade tip
        break;
      case 5: // Strength — fist
        p( 9, 10, 14, 12, '#F4A460'); // fingers
        p( 8, 18,  2,  6, '#F4A460'); // thumb
        p( 9, 22, 14,  6, '#F4A460'); // palm
        p( 9, 10, 14,  4, '#D2691E'); // knuckles
        break;
      case 6: // Defence — shield
        p( 9,  4, 14,  2, '#8B6914'); // top border
        p( 7,  6,  2, 14, '#8B6914'); // left border
        p(23,  6,  2, 14, '#8B6914'); // right border
        p( 9,  4, 14, 18, '#2471A3'); // shield face
        p(14,  6,  4, 14, '#1A5276'); // centre stripe v
        p( 9, 13, 14,  4, '#1A5276'); // centre stripe h
        p(12, 20,  8,  6, '#1A5276'); // lower point
        p(13, 26,  6,  4, '#2471A3'); // tip
        break;
      case 7: // Hitpoints — heart
        p( 7,  8,  8,  6, '#E74C3C'); // left lobe
        p(17,  8,  8,  6, '#E74C3C'); // right lobe
        p( 5, 12, 22, 10, '#E74C3C'); // main body
        p( 7, 20, 18,  4, '#C0392B'); // lower
        p(11, 24, 10,  4, '#C0392B'); // taper
        p(14, 27,  4,  2, '#C0392B'); // tip
        break;
      case 8: // Mining — pickaxe
        p(14,  8,  4, 18, '#8B5E3C'); // handle
        p( 4,  4, 14,  6, '#9B9B9B'); // pick head
        p( 4,  4,  4,  4, '#777');    // left point
        p(18,  6,  6,  2, '#777');    // right point
        break;
      case 9: // Architect — hammer + blueprint
        p( 6, 14, 14, 14, '#2471A3'); // blue paper
        p( 6, 14, 14,  2, '#1A5276'); // top edge
        p( 8, 18,  4,  2, '#5DADE2'); // line 1 left
        p( 8, 22,  4,  2, '#5DADE2'); // line 2 left
        p(13, 18,  5,  2, '#5DADE2'); // line 1 right
        p(13, 22,  5,  2, '#5DADE2'); // line 2 right
        p(18,  8,  4, 18, '#8B5E3C'); // hammer handle
        p(14,  4, 12,  8, '#9B9B9B'); // hammer head
        p(14,  4,  4,  4, '#777');    // left face
        p(22,  4,  4,  4, '#777');    // right face
        break;
      case 10: // Forgery — anvil + flame
        p( 6, 18, 20,  5, '#555');   // top face
        p( 8, 16, 16,  3, '#686868'); // raised top
        p(10, 22, 12,  5, '#383838'); // waist
        p( 5, 26, 22,  4, '#444');   // base
        p( 3, 19,  5,  3, '#484848'); // horn
        p( 6, 18, 20,  2, 'rgba(255,255,255,0.14)'); // highlight
        p( 4, 20,  4,  6, '#ff6600'); // outer flame
        p( 5, 18,  3,  4, '#ff9900'); // mid flame
        p( 6, 17,  2,  3, '#ffdd00'); // tip
        break;
    }
  }

  drawContextMenu(menu, mx, my) {
    if (!menu) return;
    const ctx = this.ctx;
    const OPT_H = 26, PW = 170, PAD = 4;
    const PH = menu.options.length * OPT_H + PAD * 2;
    const px = Math.min(menu.x, this.canvas.width  - PW - 4);
    const py = Math.min(menu.y, this.canvas.height - PH - 4);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 3, py + 3, PW, PH);
    // Bg
    ctx.fillStyle = 'rgba(15,12,8,0.96)';
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, PW, PH);

    menu.options.forEach((opt, i) => {
      const oy = py + PAD + i * OPT_H;
      const hovered = mx >= px && mx < px + PW && my >= oy && my < oy + OPT_H;
      if (hovered) {
        ctx.fillStyle = 'rgba(139,105,20,0.35)';
        ctx.fillRect(px + 1, oy, PW - 2, OPT_H);
      }
      ctx.fillStyle = hovered ? '#f1c40f' : '#ddd';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(opt.label, px + 10, oy + 17);
    });
    ctx.textAlign = 'left';
  }
}
