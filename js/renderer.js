import {
  TILE_SIZE, TILE_COLORS, TILE_HAS_DETAIL, TILES,
  INV_COLS, INV_ROWS, INV_CELL, INV_PAD,
  SKILL_NAMES, SKILL_COLORS,
} from './constants.js';
import { ITEMS } from './items.js';
import { getItemLore } from './itemLore.js';
import { getBiome, BIOMES } from './biomes.js';
import {
  SHOP_PW, SHOP_HEADER_H, SHOP_TAB_H, SHOP_ROW_H, SHOP_PH,
  SELL_PRICES,
} from './shop.js';
import {
  MO_PW, MO_PH, MO_HEADER_H, MO_PREVIEW_H,
  MO_STYLE_ROW_H, MO_ROW_H, MO_PAD_BOT,
  MO_SWATCH, MO_SWATCH_GAP, MO_LABEL_W, MO_PAD,
  MO_BTN_W, MO_BTN_H, MO_BTN_GAP,
  MO_PALETTES, MO_STYLE_ROWS,
} from './makeover.js';
import { drawHairStyle, drawBodyStyle } from './player.js';
import { drawHelmet, drawChestplate, drawLeggings } from './equipment.js';
import {
  FORGE_PW, FORGE_HEADER_H, FORGE_TAB_H, FORGE_ROW_H,
  SMELT_PH, SMITH_PH, SMITH_CONTENT_H,
} from './forge.js';
import { EQUIP_ID_TO_ITEM } from './items.js';
import { GEAR_BY_ID } from './gear.js';
import {
  ROOM_DEFS, getUnlockedRoomDefs, furnitureForRoom,
  flattenFurnitureVariants, sortedFurnitureEntries,
  rotatedFootprint,
  FLOOR_TINT_OPTIONS, WALL_TINT_OPTIONS,
  GRID_COLS, GRID_ROWS,
  BM_PW, BM_PH, BM_HEADER_H, BM_GRID_CELL, BM_GRID_OFF, BM_GRID_TOP, BM_SPLIT_X,
} from './housing.js';

// Tiles that animate each frame (use this.time) — excluded from the chunk cache
const ANIMATED_TILES = new Set([
  TILES.WATER, TILES.SWAMP_WATER, TILES.LAVA,
  TILES.FISH_SPOT,
  TILES.FIRE, TILES.PORTAL,
  TILES.FOUNTAIN,
  TILES.HEARTH, TILES.FURN_CANDELABRA,
  TILES.FURN_POND_WATER,
  TILES.FURN_FISH_TANK,
]);
// Tiles whose sprite extends visually beyond their own tile bounds (e.g. a tall
// grandfather clock spanning into the tile above). Skipped from the chunk
// cache and drawn fresh each frame in a post-pass so the overhang isn't
// clipped at chunk boundaries.
const OVERHANG_TILES = new Set([
  TILES.FURN_CLOCK,
  TILES.FURN_WARDROBE,
  TILES.FURN_BOOKSHELF,
  TILES.ARMOR_STAND,
  TILES.FURN_THRONE,
  TILES.FURN_LANTERN,
  TILES.FURN_VASE,
  TILES.FURN_WEAPON_CASE,
]);
// Prop tiles that don't fill their cell — rendered on top of the underlying ground tile
const PROP_TILES = new Set([
  // Structures / furniture
  TILES.BARREL, TILES.SIGN, TILES.FENCE, TILES.WELL,
  TILES.FURNACE, TILES.ANVIL,
  TILES.FURN_CHAIR, TILES.FURN_RUG, TILES.FURN_TABLE,
  TILES.FURN_CHEST, TILES.FURN_BOOKSHELF, TILES.FURN_PLANT,
  TILES.FURN_BED, TILES.FURN_BENCH,
  TILES.FURN_CAULDRON, TILES.FURN_CANDELABRA, TILES.FURN_TAPESTRY,
  TILES.FURN_WARDROBE, TILES.FURN_HAY_BALE, TILES.FURN_SCARECROW,
  TILES.FURN_STOOL, TILES.FURN_THRONE, TILES.FURN_PAINTING,
  TILES.FURN_VASE, TILES.FURN_NIGHTSTAND, TILES.FURN_FLOWER_PATCH,
  TILES.FURN_CLOCK, TILES.FURN_LANTERN,
  // Interactive display furniture
  TILES.FURN_WEAPON_CASE, TILES.FURN_FISH_MOUNT, TILES.FURN_TROPHY_PLAQUE,
  TILES.FURN_RELIC_SHELF, TILES.FURN_ACHIEVEMENTS_BOOK,
  // Garden / taming plot decorations
  TILES.FURN_GARDEN_ROCK, TILES.FURN_POND_WATER,
  TILES.FURN_TRAIL_DIRT, TILES.FURN_TRAIL_STONE,
  TILES.FURN_TRAIL_GRAVEL, TILES.FURN_TRAIL_FLAGSTONE,
  // Misc new furniture
  TILES.FURN_FISH_TANK, TILES.FURN_ALCHEMY_TABLE,
  TILES.FURN_ARCHERY_TARGET, TILES.FURN_WINE_CASK, TILES.FURN_LOOM,
  // Kingdom shop interior props
  TILES.HEARTH, TILES.BUTCHER_BLOCK, TILES.MEAT_HOOK,
  TILES.WEAPON_RACK, TILES.ARMOR_STAND, TILES.DISPLAY_SHELF,
  TILES.FISH_COUNTER, TILES.FISH_TANK, TILES.ICE_BOX,
  TILES.CAPE_DISPLAY, TILES.TAILOR_TABLE,
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
  // Kingdom courtyard decorations
  TILES.FOUNTAIN,
  TILES.PLANTER_FLOWERS,
  TILES.PLANTER_BUSH,
  // Cave props
  TILES.SPIDER_WEB,
  // Overworld forageable resources (drawn on top of biome ground tile)
  TILES.BERRY_BUSH,
  TILES.BERRY_BUSH_EMPTY,
  TILES.MUSHROOM,
  TILES.WILD_HERB,
  TILES.REEDS,
  TILES.FLAX_PLANT,
  TILES.SNOWBERRY,
  TILES.SULFUR_ROCK,
  TILES.THORN_BUSH,
  TILES.DESERT_FLOWER,
]);
const CHUNK_TILES = 16;                        // tiles per chunk side
const CHUNK_PX    = CHUNK_TILES * TILE_SIZE;   // pixels per chunk side (512)

// ── Biome-aware colour palettes for structure tiles ──────────────────────────
// Palettes are applied during _renderChunk() (baked into the OffscreenCanvas).
// Chunk cache is per-world-object — a new world always rebuilds all chunks from scratch.
const BIOME_TILE_PALETTES = {
  forest: {
    wall:    '#4a3728',
    floor:   '#5c4a2a',
    stone:   '#6b7c5a',
    path:    '#7a6040',
    door:    '#7a5c3a',
    roof:    '#826428',      // dark mossy thatch
    roofRgb: [130, 100, 40],
  },
  plains: {
    wall:    '#c8a878',
    floor:   '#a08050',
    stone:   '#9a9a8a',
    path:    '#b09060',
    door:    '#a06030',
    roof:    '#c29838',      // golden straw thatch
    roofRgb: [194, 152, 56],
  },
  desert: {
    wall:    '#d4a855',
    floor:   '#c8983a',
    stone:   '#b89060',
    path:    '#d4b870',
    door:    '#e4c870',
    roof:    '#a8702a',      // terracotta flat roof
    roofRgb: [168, 112, 42],
  },
  tundra: {
    wall:    '#8090a0',
    floor:   '#909cac',
    stone:   '#7a8898',
    path:    '#a0b0c0',
    door:    '#b0c4d4',
    roof:    '#607890',      // icy grey-blue stone slab
    roofRgb: [96, 120, 144],
  },
  swamp: {
    wall:    '#4a5a38',
    floor:   '#506040',
    stone:   '#5a6848',
    path:    '#606840',
    door:    '#6a7a50',
    roof:    '#485830',      // dark wet moss thatch
    roofRgb: [72, 88, 48],
  },
  volcanic: {
    wall:    '#6a2218',
    floor:   '#3a2828',
    stone:   '#585040',
    path:    '#504040',
    door:    '#8a3828',
    roof:    '#6e230c',      // scorched dark red stone
    roofRgb: [110, 35, 12],
  },
  royal: {
    wall:    '#b8a060',
    floor:   '#d0b880',
    stone:   '#c0a870',
    path:    '#c8b078',
    door:    '#d8c888',
    roof:    '#283c8c',      // royal blue
    roofRgb: [40, 60, 140],
  },
};

// Structure tile categories — only these get biome-palette colour overrides.
// Terrain tiles (GRASS, WATER, SAND, SNOW, LAVA, etc.) are never remapped.
const STRUCTURE_WALL_TILES  = new Set([TILES.WALL, TILES.PLASTER_WALL]);
const STRUCTURE_FLOOR_TILES = new Set([TILES.DIRT, TILES.STONE, TILES.WET_STONE, TILES.STONE_TILE]);
const STRUCTURE_PATH_TILES  = new Set([TILES.PATH]);
const STRUCTURE_DOOR_TILES  = new Set([TILES.DOOR]);

/**
 * Returns true when (col, row) is within 2 tiles of any wall tile.
 * Used to decide if a floor tile is inside a structure (and should use the
 * biome palette floor colour rather than the generic terrain colour).
 * Defined at module level so it isn't re-created on every _renderChunk call.
 */
function _hasAdjacentWall(world, col, row) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const t = world.getTile(col + dc, row + dr);
      if (t === TILES.WALL || t === TILES.PLASTER_WALL) return true;
    }
  }
  return false;
}

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

  /** Parse a #rrggbb hex string to [r, g, b] (0..255). */
  static _parseHex(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  /** Shift a colour's lightness by `amt` (−1..1). Positive = lighter. */
  static shadeHex(hex, amt) {
    const [r, g, b] = Renderer._parseHex(hex);
    const f = amt > 0 ? (255 - 0) : 0;
    const k = amt > 0 ? amt : -amt;
    const adj = (c) => {
      const target = amt > 0 ? 255 : 0;
      return Math.max(0, Math.min(255, Math.round(c + (target - c) * k))) | 0;
    };
    return `#${adj(r).toString(16).padStart(2, '0')}${adj(g).toString(16).padStart(2, '0')}${adj(b).toString(16).padStart(2, '0')}`;
    void f;
  }

  /** Blend two #rrggbb colours; t=0 → a, t=1 → b. */
  static mixHex(a, b, t) {
    const [ar, ag, ab] = Renderer._parseHex(a);
    const [br, bg, bb] = Renderer._parseHex(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
  }

  /** Derive a 5-tone wood palette from a primary tint.
   *  Used by variant-aware furniture sprites so all shades stay consistent
   *  when the player picks oak / yew / magic / maple / etc. */
  static woodPalette(tint) {
    const base = tint || '#5a3418';
    return {
      dk:   Renderer.shadeHex(base, -0.35),  // deepest shadow
      mid:  base,
      lt:   Renderer.shadeHex(base, +0.18),
      hi:   Renderer.shadeHex(base, +0.35),  // top highlight
      shdw: Renderer.shadeHex(base, -0.55),  // drop shadow
    };
  }

  /** Derive a 4-tone fabric palette (rug / cushion / tapestry). */
  static fabricPalette(tint) {
    const base = tint || '#8a4a40';
    return {
      dk:  Renderer.shadeHex(base, -0.30),
      mid: base,
      lt:  Renderer.shadeHex(base, +0.20),
      hi:  Renderer.shadeHex(base, +0.38),
    };
  }

  /** Rect of the shared top-right ✕ close button, relative to a panel.
   *  Match this in every modal's click handler so the X consistently closes. */
  closeButtonRect(panelX, panelY, panelW) {
    const SZ = 22, INSET = 8;
    return { x: panelX + panelW - SZ - INSET, y: panelY + INSET, w: SZ, h: SZ };
  }

  /** Draw the shared top-right ✕ close button on a panel. */
  drawCloseButton(ctx, panelX, panelY, panelW, mouseX = -1, mouseY = -1) {
    const r = this.closeButtonRect(panelX, panelY, panelW);
    const hover = mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h;
    // Oxblood button body with a bronze-style bevel
    ctx.fillStyle = hover ? '#5a1010' : '#2a0808';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = hover ? '#b04040' : '#7a2020';
    ctx.fillRect(r.x, r.y, r.w, 1);
    ctx.fillRect(r.x, r.y, 1, r.h);
    ctx.fillStyle = '#1a0404';
    ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
    ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
    ctx.fillStyle = hover ? '#ffd0d0' : '#e07070';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✕', r.x + r.w / 2, r.y + r.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    return r;
  }

  /** Shared bronze-trim HUD frame — matches the side panel and minimap panel.
   *  Pass `rivets: true` for the 5×5 corner rivets (used on larger panels). */
  drawBronzeFrame(ctx, x, y, w, h, { rivets = false } = {}) {
    // Dark base
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(x, y, w, h);
    // Outermost hard black edge
    ctx.fillStyle = '#050301';
    ctx.fillRect(x - 5, y - 5, w + 10, 1);
    ctx.fillRect(x - 5, y + h + 4, w + 10, 1);
    ctx.fillRect(x - 5, y - 5, 1, h + 10);
    ctx.fillRect(x + w + 4, y - 5, 1, h + 10);
    // Gold sheen top/left, dark shadow bottom/right
    ctx.fillStyle = '#e8b858';
    ctx.fillRect(x - 4, y - 4, w + 8, 1);
    ctx.fillRect(x - 4, y - 4, 1, h + 8);
    ctx.fillStyle = '#2a1608';
    ctx.fillRect(x - 4, y + h + 3, w + 8, 1);
    ctx.fillRect(x + w + 3, y - 4, 1, h + 8);
    // Bronze band (3 px)
    ctx.fillStyle = '#a07028';
    ctx.fillRect(x - 3, y - 3, w + 6, 3);
    ctx.fillRect(x - 3, y - 3, 3, h + 6);
    ctx.fillStyle = '#5a3810';
    ctx.fillRect(x - 3, y + h, w + 6, 3);
    ctx.fillRect(x + w, y - 3, 3, h + 6);
    // Inner bronze sheen
    ctx.fillStyle = '#c89040';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = '#7a5018';
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h);
    // Inner recess line
    ctx.strokeStyle = '#0a0604';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    if (rivets) {
      const r = (rx, ry) => {
        ctx.fillStyle = '#1c0c04'; ctx.fillRect(rx - 1, ry - 1, 7, 7);
        ctx.fillStyle = '#3a2008'; ctx.fillRect(rx, ry, 5, 5);
        ctx.fillStyle = '#e0b050'; ctx.fillRect(rx + 1, ry + 1, 3, 3);
        ctx.fillStyle = '#fff1c0'; ctx.fillRect(rx + 1, ry + 1, 1, 1);
        ctx.fillStyle = '#6a4010'; ctx.fillRect(rx + 3, ry + 3, 1, 1);
      };
      r(x + 4, y + 4);
      r(x + w - 9, y + 4);
      r(x + 4, y + h - 9);
      r(x + w - 9, y + h - 9);
    }
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
          const groundId = world.propGroundMap?.get(`${c},${r}`);
          if (groundId !== undefined) {
            ctx.fillStyle = TILE_COLORS[groundId] || '#000';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            if (TILE_HAS_DETAIL.has(groundId))
              this._drawTileDetail(ctx, groundId, px, py, c, r, world);
          } else {
            ctx.fillStyle = TILE_COLORS[tile] || '#000';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
          this._drawTileDetail(ctx, tile, px, py, c, r, world);
        }
      }
    }

    // Overhang tiles (e.g. grandfather clock) are NOT drawn here — the caller
    // pushes them into its entity-sort buffer via collectOverhangSortables so
    // they interleave correctly with players/mobs (entities north of a clock
    // draw behind its crown, entities south draw in front).

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
    for (const { doorC, doorR, doorFace, bC, bR, bW, bH, floorTile } of world.roofBounds) {
      if (doorC === undefined) continue;
      if (playerCol < bC || playerCol >= bC + bW) continue;
      if (playerRow < bR || playerRow >= bR + bH) continue;

      const dx = doorC * TILE_SIZE;
      const dy = doorR * TILE_SIZE;
      const T  = TILE_SIZE;

      // Floor beneath the open door — uses the building's own floor tile
      const floorId = floorTile ?? TILES.STONE;
      ctx.fillStyle = TILE_COLORS[floorId] || '#7a7a7a';
      ctx.fillRect(dx, dy, T, T);
      if (TILE_HAS_DETAIL.has(floorId) && !ANIMATED_TILES.has(floorId))
        this._drawTileDetail(ctx, floorId, dx, dy, doorC, doorR, world);

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
      for (const { c, r, rW, rH, bC, bR, bW, bH, roofTile } of world.roofBounds) {
        if (c + rW < startCol - 2 || c > endCol + 2) continue;
        if (r + rH < startRow - 2 || r > endRow + 2) continue;
        if (playerCol >= bC && playerCol < bC + bW &&
            playerRow >= bR && playerRow < bR + bH) continue;
        const palette = BIOME_TILE_PALETTES[getBiome(c, r)] ?? BIOME_TILE_PALETTES.plains;
        if (roofTile === TILES.THATCH_ROOF || roofTile === undefined) {
          const [rr0, rg0, rb0] = palette.roofRgb;
          ctx.drawImage(
            this._getOrBuildRoofTexture(rW * TILE_SIZE + OVER_SIDE * 2, rH * TILE_SIZE + OVER_TOP + OVER_BOT, rr0, rg0, rb0),
            c * TILE_SIZE - OVER_SIDE,
            r * TILE_SIZE - OVER_TOP,
          );
        } else {
          // Flat roof — draw a solid colour rectangle covering the building footprint
          ctx.fillStyle = palette.roof;
          ctx.fillRect(
            bC * TILE_SIZE,
            bR * TILE_SIZE,
            bW * TILE_SIZE,
            bH * TILE_SIZE,
          );
        }
      }
    } else {
      for (let r = startRow - 1; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (world.getTile(c, r) !== TILES.THATCH_ROOF) continue;
          if (world.getTile(c - 1, r) === TILES.THATCH_ROOF) continue;
          if (world.getTile(c, r - 1) === TILES.THATCH_ROOF) continue;
          let rW = 0; while (world.getTile(c + rW, r) === TILES.THATCH_ROOF) rW++;
          let rH = 0; while (world.getTile(c, r + rH) === TILES.THATCH_ROOF) rH++;
          const [rr0, rg0, rb0] = (BIOME_TILE_PALETTES[getBiome(c, r)] ?? BIOME_TILE_PALETTES.plains).roofRgb;
          ctx.drawImage(
            this._getOrBuildRoofTexture(rW * TILE_SIZE + OVER_SIDE * 2, rH * TILE_SIZE + OVER_TOP + OVER_BOT, rr0, rg0, rb0),
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
        // Resolve the biome palette for this tile position once, used below.
        const _biome   = getBiome(col, row);
        const _palette = BIOME_TILE_PALETTES[_biome] ?? BIOME_TILE_PALETTES.plains;

        if (PROP_TILES.has(tile)) {
          // Render the underlying ground tile first so the prop sits on top of it
          const groundId = world.propGroundMap?.get(`${col},${row}`) ?? TILES.DIRT;
          // Apply biome palette to structure floor tiles under props
          let groundColor = TILE_COLORS[groundId] || '#000';
          if (STRUCTURE_FLOOR_TILES.has(groundId) && _hasAdjacentWall(world, col, row)) {
            groundColor = _palette.floor;
          } else if (STRUCTURE_WALL_TILES.has(groundId)) {
            groundColor = _palette.wall;
          } else if (STRUCTURE_PATH_TILES.has(groundId)) {
            groundColor = _palette.path;
          } else if (STRUCTURE_DOOR_TILES.has(groundId)) {
            groundColor = _palette.door;
          }
          // Player-house paint override — replaces the base fill on floor tiles
          // so prop sprites (e.g. furniture) sit on the tinted floor.
          const floorTintU = world.floorTints?.get(`${col},${row}`);
          if (floorTintU) groundColor = floorTintU;
          ctx.fillStyle = groundColor;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          if (TILE_HAS_DETAIL.has(groundId) && !ANIMATED_TILES.has(groundId))
            this._drawTileDetail(ctx, groundId, px, py, col, row, world);
          // OVERHANG_TILES: skip baking the furniture sprite into the chunk
          // cache — the caller depth-sorts it via collectOverhangSortables
          // so entities get correct front/back occlusion against the sprite.
          if (OVERHANG_TILES.has(tile)) continue;
        } else {
          // Apply biome palette override for structure tiles only
          let tileColor = TILE_COLORS[tile] || '#000';
          if (STRUCTURE_WALL_TILES.has(tile)) {
            tileColor = _palette.wall;
          } else if (STRUCTURE_DOOR_TILES.has(tile)) {
            tileColor = _palette.door;
          } else if (STRUCTURE_PATH_TILES.has(tile)) {
            tileColor = _palette.path;
          } else if (tile === TILES.ROOF || tile === TILES.THATCH_ROOF) {
            tileColor = _palette.roof;  // base color; THATCH_ROOF overlay drawn on top
          } else if (STRUCTURE_FLOOR_TILES.has(tile) && _hasAdjacentWall(world, col, row)) {
            tileColor = _palette.floor;
          }
          // Player-house paint overrides — floor tiles first, then walls.
          const floorTintU = world.floorTints?.get(`${col},${row}`);
          if (floorTintU) tileColor = floorTintU;
          const wallTintU = world.wallTints?.get(`${col},${row}`);
          if (wallTintU) tileColor = wallTintU;
          ctx.fillStyle = tileColor;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
        // THATCH_ROOF and ROOF detail are replaced by the multi-tile overlay pass in drawWorld
        if (TILE_HAS_DETAIL.has(tile) && !ANIMATED_TILES.has(tile) && tile !== TILES.THATCH_ROOF && tile !== TILES.ROOF) {
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
  _getOrBuildRoofTexture(pw, ph, r0 = 194, g0 = 152, b0 = 58) {
    const key = `${pw}x${ph}:${r0},${g0},${b0}`;
    if (this._roofCache.has(key)) return this._roofCache.get(key);

    const oc  = new OffscreenCanvas(pw, ph);
    const ctx = oc.getContext('2d');
    const w = pw, h = ph;
    const R0 = r0, G0 = g0, B0 = b0;   // biome-specific base colour

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

    if (tile === TILES.FISH_SPOT) {
      const t = this.time;
      // Use ((x % 1) + 1) % 1 to guarantee [0, 1) even if intermediate value is negative
      const raw   = t * 1.5 + s1 * 0.5;
      const phase  = ((raw      ) % 1 + 1) % 1;
      const phase2 = ((raw + 0.5) % 1 + 1) % 1;
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

    // ── Royal carpet ─────────────────────────────────────

    if (tile === TILES.CARPET) {
      // Gold side borders
      ctx.fillStyle = '#c8960c';
      ctx.fillRect(px,      py, 4, 32);
      ctx.fillRect(px + 28, py, 4, 32);
      // Inner border line
      ctx.fillStyle = '#a87a08';
      ctx.fillRect(px + 3,  py, 1, 32);
      ctx.fillRect(px + 28, py, 1, 32);
      // Horizontal alternating bands
      for (let iy = 0; iy < 32; iy += 8) {
        ctx.fillStyle = iy % 16 === 0 ? 'rgba(180,0,0,0.25)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(px + 4, py + iy, 24, 8);
      }
      // Centre medallion
      ctx.fillStyle = 'rgba(220,170,30,0.40)';
      ctx.fillRect(px + 10, py + 10, 12, 12);
      ctx.fillStyle = 'rgba(220,170,30,0.22)';
      ctx.fillRect(px + 13, py + 13, 6,  6);
      ctx.fillStyle = 'rgba(200,140,20,0.55)';
      ctx.fillRect(px + 15, py + 15, 2,  2);
      // Edge highlight / shadow
      ctx.fillStyle = 'rgba(255,200,80,0.30)';
      ctx.fillRect(px, py, 32, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px, py + 31, 32, 1);
      return;
    }

    // ── Throne ────────────────────────────────────────────

    if (tile === TILES.THRONE) {
      // Seat cushion (crimson velvet)
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(px + 5, py + 18, 22, 10);
      ctx.fillStyle = '#6b0000';
      ctx.fillRect(px + 6, py + 19, 20, 8);
      ctx.fillStyle = 'rgba(255,100,100,0.18)';
      ctx.fillRect(px + 7, py + 19, 18, 3);
      // Back rest (dark oak)
      ctx.fillStyle = '#3a1a00';
      ctx.fillRect(px + 5, py + 2, 22, 17);
      ctx.fillStyle = '#4a2800';
      ctx.fillRect(px + 6, py + 3, 20, 15);
      // Armrests
      ctx.fillStyle = '#3a1a00';
      ctx.fillRect(px + 2,  py + 14, 5, 14);
      ctx.fillRect(px + 25, py + 14, 5, 14);
      ctx.fillStyle = '#4a2800';
      ctx.fillRect(px + 3,  py + 15, 3, 12);
      ctx.fillRect(px + 26, py + 15, 3, 12);
      // Gold trim on seat edge
      ctx.fillStyle = '#c8960c';
      ctx.fillRect(px + 5,  py + 17, 22, 2);
      ctx.fillRect(px + 5,  py + 27, 22, 2);
      ctx.fillRect(px + 2,  py + 14, 3, 2);
      ctx.fillRect(px + 27, py + 14, 3, 2);
      // Gold trim on backrest top
      ctx.fillStyle = '#d4a020';
      ctx.fillRect(px + 5, py + 2, 22, 2);
      // Crown finials at top
      ctx.fillStyle = '#c8960c';
      ctx.fillRect(px + 6,  py,     3, 4);
      ctx.fillRect(px + 13, py - 1, 6, 5);
      ctx.fillRect(px + 23, py,     3, 4);
      // Finial tops (jewel)
      ctx.fillStyle = '#e84040';
      ctx.fillRect(px + 7,  py,     1, 1);
      ctx.fillRect(px + 15, py - 1, 2, 2);
      ctx.fillRect(px + 24, py,     1, 1);
      // Backrest panel design (cross motif)
      ctx.fillStyle = 'rgba(220,160,20,0.45)';
      ctx.fillRect(px + 15, py + 4, 2, 13);
      ctx.fillRect(px + 8,  py + 9, 16, 2);
      return;
    }

    // ── Wooden plank floor ────────────────────────────────

    if (tile === TILES.WOOD_FLOOR) {
      // Four horizontal boards, each 8 px tall
      const boardTones = ['#c47a32','#b86c28','#cc8038','#b47030'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = boardTones[(i + s1) % 4];
        ctx.fillRect(px, py + i * 8, 32, 8);
        // Wood grain — 3–4 subtle vertical streaks per board
        ctx.fillStyle = 'rgba(0,0,0,0.09)';
        const off = (s2 * 3 + i * 9) % 5;
        for (let gx = off + 3; gx < 32; gx += 7 + (s3 % 3))
          ctx.fillRect(px + gx, py + i * 8 + 1, 1, 6);
        // Board top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.11)';
        ctx.fillRect(px, py + i * 8, 32, 1);
      }
      // Joints between boards
      ctx.fillStyle = '#6a3810';
      for (let i = 1; i < 4; i++) ctx.fillRect(px, py + i * 8 - 1, 32, 2);
      // Random blood smear for atmosphere (1-in-6 tiles)
      if (s3 % 6 === 0) {
        ctx.fillStyle = 'rgba(110,15,15,0.22)';
        ctx.fillRect(px + 5  + (s1 % 14), py + 3  + (s2 % 20), 7, 4);
        ctx.fillRect(px + 9  + (s3 % 10), py + 9  + (s1 % 14), 3, 2);
      }
      return;
    }

    // ── Meat hooks (wall-mounted raw meat display) ────────

    if (tile === TILES.MEAT_HOOK) {
      // Wall-mounted: the wall face renders underneath via propGroundMap.
      // Wooden beam rail mounted on the wall face (below the ledge)
      ctx.fillStyle = '#2e1008';
      ctx.fillRect(px, py + 12, 32, 5);
      ctx.fillStyle = '#4a2010';
      ctx.fillRect(px, py + 13, 32, 3);
      ctx.fillStyle = 'rgba(255,200,120,0.12)';
      ctx.fillRect(px, py + 13, 32, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px, py + 16, 32, 1);

      // Iron bracket mounts into the wall
      ctx.fillStyle = '#5a5a60';
      ctx.fillRect(px + 4,  py + 11, 3, 2);
      ctx.fillRect(px + 25, py + 11, 3, 2);

      // Three metal S-hooks hanging from beam
      const hx = [6, 15, 24];
      for (const x of hx) {
        ctx.fillStyle = '#9090a0';
        ctx.fillRect(px + x,     py + 15, 2, 4);   // shank
        ctx.fillRect(px + x - 1, py + 18, 4, 2);   // hook curve
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(px + x,     py + 15, 1, 3);   // sheen
      }

      // Left cut — beef, deep red
      ctx.fillStyle = '#9a2020';
      ctx.fillRect(px + 2, py + 19, 9, 10);
      ctx.fillStyle = '#c43030';
      ctx.fillRect(px + 3, py + 19, 7, 8);
      ctx.fillStyle = '#d84040';
      ctx.fillRect(px + 4, py + 20, 5, 6);
      ctx.fillStyle = 'rgba(255,235,205,0.80)';
      ctx.fillRect(px + 4, py + 22, 3, 1);
      ctx.fillRect(px + 7, py + 24, 2, 1);

      // Centre cut — pork, slightly pink
      ctx.fillStyle = '#b83838';
      ctx.fillRect(px + 12, py + 19, 7, 8);
      ctx.fillStyle = '#d04848';
      ctx.fillRect(px + 13, py + 19, 5, 6);
      ctx.fillStyle = 'rgba(255,235,205,0.75)';
      ctx.fillRect(px + 14, py + 22, 3, 1);

      // Right cut — venison, darker
      ctx.fillStyle = '#8a1818';
      ctx.fillRect(px + 21, py + 19, 9, 10);
      ctx.fillStyle = '#b02828';
      ctx.fillRect(px + 22, py + 19, 7, 8);
      ctx.fillStyle = '#c83838';
      ctx.fillRect(px + 23, py + 20, 5, 6);
      ctx.fillStyle = 'rgba(255,235,205,0.75)';
      ctx.fillRect(px + 24, py + 23, 2, 1);
      ctx.fillRect(px + 26, py + 25, 1, 1);

      // Bottom shadows under each cut
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 2,  py + 29, 9,  2);
      ctx.fillRect(px + 12, py + 27, 7,  2);
      ctx.fillRect(px + 21, py + 29, 9,  2);
      return;
    }

    // ── Framed painting (wall-mounted) ─────────────────────
    //
    // Wall-mounted props like MEAT_HOOK / HEARTH use a direct case here (not
    // the FURN_SET sprite dispatch below) so the wall face renders underneath
    // via propGroundMap and the prop draws on top without being obscured.

    if (tile === TILES.FURN_PAINTING) {
      // Sits on the wall face (y = 10..28) so it hangs at the same height
      // as other wall-mounts like the meat hooks.
      // Ornate gilt frame
      ctx.fillStyle = '#2a1808'; ctx.fillRect(px + 4,  py + 10, 24, 18);  // frame outer
      ctx.fillStyle = '#c8a227'; ctx.fillRect(px + 5,  py + 11, 22, 16);  // gold inlay
      ctx.fillStyle = '#8a6018'; ctx.fillRect(px + 6,  py + 12, 20, 14);  // inner shadow
      // Canvas — stylised landscape
      ctx.fillStyle = '#79bce8'; ctx.fillRect(px + 7,  py + 13, 18, 7);   // sky
      ctx.fillStyle = '#f4cf3f'; ctx.fillRect(px + 20, py + 15, 3, 3);    // sun
      ctx.fillStyle = '#4a7a2a'; ctx.fillRect(px + 7,  py + 19, 18, 3);   // hill band
      ctx.fillStyle = '#6a8a3a'; ctx.fillRect(px + 8,  py + 18, 3, 2);    // far hill L
      ctx.fillRect(px + 14, py + 18, 4, 2);                               // far hill R
      ctx.fillStyle = '#2a4a18'; ctx.fillRect(px + 7,  py + 22, 18, 3);   // ground
      // Frame highlight + small plaque
      ctx.fillStyle = '#e4c84a'; ctx.fillRect(px + 5,  py + 11, 22, 1);   // top highlight
      ctx.fillStyle = '#c8a227'; ctx.fillRect(px + 13, py + 26, 6, 1);    // plaque
      // Hanging wire (small peak above frame)
      ctx.fillStyle = '#2a1808'; ctx.fillRect(px + 15, py + 9, 2, 1);
      return;
    }

    // ── Mounted fish plaque (wall-mount) ───────────────────
    if (tile === TILES.FURN_FISH_MOUNT) {
      // Sits on the wall face (y = 10..28), aligned with other wall-mounts.
      // Wooden plaque backdrop
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 3,  py + 10, 26, 18);
      ctx.fillStyle = '#6a4018'; ctx.fillRect(px + 4,  py + 11, 24, 16);
      ctx.fillStyle = '#8a5820'; ctx.fillRect(px + 4,  py + 11, 24, 1);    // top highlight
      ctx.fillStyle = '#2a1604'; ctx.fillRect(px + 4,  py + 26, 24, 1);    // bottom shadow
      // Gold inset rim around the full inner display area
      ctx.fillStyle = '#c8a227';
      ctx.fillRect(px + 6,  py + 12, 20, 1);
      ctx.fillRect(px + 6,  py + 25, 20, 1);
      ctx.fillRect(px + 6,  py + 12, 1, 14);
      ctx.fillRect(px + 25, py + 12, 1, 14);

      const fm = world?.displayContent?.get(`${c},${r}`);
      if (fm?.content) {
        // Draw the actual fish inventory icon, centred in the plaque's
        // inner display area. Weight / rarity are shown via the hover
        // tooltip so the icon can use the full space.
        const fishDef = this._itemById?.get(fm.content.itemId);
        if (fishDef?.draw) {
          const ICON = 14;
          const iconX = px + 16 - ICON / 2;           // centred horizontally
          const iconY = py + 12 + (13 - ICON) / 2;    // centred in y=12..25
          fishDef.draw(ctx, iconX, iconY, ICON);
        }
      } else {
        // Empty: faint "?" cue centred in the display area
        ctx.fillStyle = '#8a6018';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', px + 16, py + 19);
        ctx.textBaseline = 'alphabetic';
      }
      return;
    }

    // ── Trophy plaque (wall-mount, engraved text) ───────────
    if (tile === TILES.FURN_TROPHY_PLAQUE) {
      // Sits on the wall face (y = 10..28), aligned with other wall-mounts.
      ctx.fillStyle = '#2a1604'; ctx.fillRect(px + 3,  py + 10, 26, 18);
      ctx.fillStyle = '#5a3010'; ctx.fillRect(px + 4,  py + 11, 24, 16);
      ctx.fillStyle = '#7a4820'; ctx.fillRect(px + 4,  py + 11, 24, 1);    // highlight
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 4,  py + 26, 24, 1);
      // Inner gold trim
      ctx.fillStyle = '#c8a227';
      ctx.fillRect(px + 6,  py + 13, 20, 1);
      ctx.fillRect(px + 6,  py + 25, 20, 1);
      ctx.fillRect(px + 6,  py + 13, 1, 13);
      ctx.fillRect(px + 25, py + 13, 1, 13);
      // Text engraving
      const tp = world?.displayContent?.get(`${c},${r}`);
      const label = (tp?.content?.text || '').slice(0, 10) || '— — —';
      ctx.fillStyle = tp?.content?.text ? '#f0d090' : '#6a5030';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, px + 16, py + 19);
      ctx.fillText(tp?.content?.text ? '★' : ' ', px + 16, py + 24);
      return;
    }

    // ── WEAPON_RACK — wall-mounted rack with 3 weapons (wall face y=10..28) ──
    if (tile === TILES.WEAPON_RACK) {
      const rail    = '#7a4a1e', railHi = '#9a6028', railSh = '#4a2c12';
      const cap     = '#9a7040', bracket = '#3a2a14';
      const hilt    = '#5a3a1e', guard = '#806040', pommel = '#c8a030';
      const blade   = '#b8b8cc', bladeHi = '#d0d0e0', bladeShd = '#7a7a8a';
      const axeH    = '#8a8890', axeHi = '#a8a8b0', axeShd = '#5a5a6a';
      const haftDk  = '#3a2008';

      // Drop shadow below the rack
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(px + 4, py + 27, 24, 1);

      // Wooden mounting rail across the middle of the wall face
      ctx.fillStyle = rail;    ctx.fillRect(px + 1, py + 15, 30, 5);
      ctx.fillStyle = railHi;  ctx.fillRect(px + 2, py + 15, 28, 1);
      ctx.fillStyle = railHi;  ctx.fillRect(px + 2, py + 16, 28, 1);
      ctx.fillStyle = railSh;  ctx.fillRect(px + 2, py + 19, 28, 1);
      // Rail end caps (iron brackets into the wall)
      ctx.fillStyle = cap;     ctx.fillRect(px + 0, py + 14, 3, 7);
      ctx.fillRect(px + 29, py + 14, 3, 7);
      ctx.fillStyle = bracket; ctx.fillRect(px + 0, py + 19, 3, 2);
      ctx.fillRect(px + 29, py + 19, 3, 2);

      // ── SWORD (left) — hilt above rail, blade hanging below ──
      // Pommel + grip above rail
      ctx.fillStyle = pommel; ctx.fillRect(px + 5, py + 10, 3, 2);
      ctx.fillStyle = hilt;   ctx.fillRect(px + 5, py + 12, 3, 3);
      // Guard sitting across rail
      ctx.fillStyle = guard;  ctx.fillRect(px + 3, py + 14, 7, 2);
      ctx.fillStyle = '#a07848'; ctx.fillRect(px + 3, py + 14, 7, 1);
      // Blade hanging down
      ctx.fillStyle = blade;  ctx.fillRect(px + 5, py + 20, 3, 8);
      ctx.fillStyle = bladeHi;ctx.fillRect(px + 5, py + 20, 1, 7);
      ctx.fillStyle = bladeShd; ctx.fillRect(px + 7, py + 20, 1, 8);
      ctx.fillStyle = blade;  ctx.fillRect(px + 6, py + 27, 1, 1);   // sword point

      // ── AXE (centre) — head above rail, haft hanging below ──
      // Haft poking up above rail
      ctx.fillStyle = haftDk; ctx.fillRect(px + 15, py + 11, 2, 4);
      // Axe head — wide blade above the rail
      ctx.fillStyle = axeH;   ctx.fillRect(px + 13, py + 10, 8, 5);
      ctx.fillStyle = axeHi;  ctx.fillRect(px + 13, py + 10, 8, 2);
      ctx.fillStyle = axeShd; ctx.fillRect(px + 13, py + 14, 8, 1);
      // Axe edge tip
      ctx.fillStyle = axeHi;  ctx.fillRect(px + 12, py + 11, 1, 3);
      ctx.fillStyle = axeHi;  ctx.fillRect(px + 21, py + 11, 1, 3);
      // Haft hanging below rail
      ctx.fillStyle = haftDk; ctx.fillRect(px + 15, py + 20, 2, 7);
      ctx.fillStyle = '#5a3818'; ctx.fillRect(px + 15, py + 20, 1, 7);

      // ── SPEAR (right) — tip above rail, haft hanging below ──
      // Spear tip (triangular)
      ctx.fillStyle = blade;  ctx.fillRect(px + 24, py + 10, 3, 5);
      ctx.fillStyle = bladeHi;ctx.fillRect(px + 24, py + 10, 1, 5);
      ctx.fillStyle = bladeShd; ctx.fillRect(px + 26, py + 10, 1, 5);
      // Spear socket
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(px + 24, py + 13, 3, 1);
      // Haft hanging below rail
      ctx.fillStyle = haftDk; ctx.fillRect(px + 25, py + 20, 2, 7);
      ctx.fillStyle = '#5a3818'; ctx.fillRect(px + 25, py + 20, 1, 7);

      // Subtle shadow along the rail's bottom where weapons touch
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 3, py + 20, 7, 1);
      ctx.fillRect(px + 13, py + 20, 9, 1);
      ctx.fillRect(px + 23, py + 20, 6, 1);
      return;
    }

    // ── Weapon display case — glass-fronted cabinet (modest overhang) ──
    if (tile === TILES.FURN_WEAPON_CASE) {
      const wood   = '#5a3418', woodDk = '#3a1f08', woodLt = '#7a4820';
      const gold   = '#c8a227', goldLt = '#f1cc40', goldDk = '#8a6818';
      const velvet = '#6a0810';

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px + 4, py + 30, 24, 2);

      // ── Crown pediment (top of sprite, y = -14..-8) ────────
      ctx.fillStyle = gold;    ctx.fillRect(px + 2,  py - 14, 28, 2);
      ctx.fillStyle = goldLt;  ctx.fillRect(px + 2,  py - 14, 28, 1);
      ctx.fillStyle = goldDk;  ctx.fillRect(px + 2,  py - 12, 28, 1);
      ctx.fillStyle = wood;    ctx.fillRect(px + 3,  py - 11, 26, 3);
      ctx.fillStyle = woodLt;  ctx.fillRect(px + 3,  py - 11, 26, 1);
      // Central crest
      ctx.fillStyle = gold;    ctx.fillRect(px + 14, py - 17, 4, 3);
      ctx.fillStyle = goldLt;  ctx.fillRect(px + 14, py - 17, 3, 1);

      // ── Cabinet body (single tall pane, y = -8..+28) ──────
      ctx.fillStyle = woodDk;  ctx.fillRect(px + 2,  py - 8, 28, 36);
      ctx.fillStyle = wood;    ctx.fillRect(px + 3,  py - 7, 26, 34);
      ctx.fillStyle = gold;    ctx.fillRect(px + 3,  py - 8, 26, 1);
      ctx.fillStyle = goldDk;  ctx.fillRect(px + 3,  py + 27, 26, 1);

      // ── Single glass pane from top to bottom (no mid divider) ──
      ctx.fillStyle = 'rgba(200,230,255,0.22)';
      ctx.fillRect(px + 5,  py - 5, 22, 29);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(px + 5,  py - 5, 22, 1);
      ctx.fillRect(px + 5,  py - 5, 1, 29);
      // Velvet backdrop behind weapon (full height)
      ctx.fillStyle = velvet;  ctx.fillRect(px + 6,  py - 4, 20, 27);

      // Assigned weapon sprite — centred in the unobstructed pane
      const wc = world?.displayContent?.get(`${c},${r}`);
      if (wc?.content?.itemId && this._itemById?.has(wc.content.itemId)) {
        // Draw weapon centred vertically across the full glass pane
        this._itemById.get(wc.content.itemId).draw(ctx, px + 4, py - 2, 24);
      } else {
        // Empty: faint sword silhouette + "?" hint
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(px + 15, py - 2, 2, 20);
        ctx.fillRect(px + 13, py + 14, 6, 1);
        ctx.fillStyle = gold;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', px + 16, py + 10);
        ctx.textAlign = 'left';
      }

      // Small brass door latch at bottom
      ctx.fillStyle = gold;    ctx.fillRect(px + 14, py + 25, 4, 2);
      ctx.fillStyle = goldDk;  ctx.fillRect(px + 15, py + 26, 2, 1);
      // Feet
      ctx.fillStyle = woodDk;
      ctx.fillRect(px + 3, py + 28, 3, 3);
      ctx.fillRect(px + 26, py + 28, 3, 3);
      return;
    }

    // ── Relic shelf (floor, displays one item) ───────────────
    if (tile === TILES.FURN_RELIC_SHELF) {
      // Bracket (wall-attached look)
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 4,  py + 10, 24, 14);
      ctx.fillStyle = '#6a4018'; ctx.fillRect(px + 5,  py + 11, 22, 12);
      ctx.fillStyle = '#8a5820'; ctx.fillRect(px + 5,  py + 11, 22, 1); // top sheen
      // Shelf surface
      ctx.fillStyle = '#5a3010'; ctx.fillRect(px + 3,  py + 9, 26, 3);
      ctx.fillStyle = '#7a4818'; ctx.fillRect(px + 3,  py + 9, 26, 1);
      // Item on shelf
      const rs = world?.displayContent?.get(`${c},${r}`);
      if (rs?.content?.itemId && this._itemById?.has(rs.content.itemId)) {
        this._itemById.get(rs.content.itemId).draw(ctx, px + 10, py - 4, 14);
        // Soft light glow on the shelf around the item
        ctx.fillStyle = 'rgba(255,220,140,0.20)';
        ctx.fillRect(px + 6, py + 9, 20, 2);
      } else {
        // Empty: dashed question marker
        ctx.fillStyle = '#c8a227';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', px + 16, py + 5);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + 13, py + 7, 6, 1);
      }
      // Brackets / supports on either side
      ctx.fillStyle = '#3a2008';
      ctx.fillRect(px + 5,  py + 23, 2, 5);
      ctx.fillRect(px + 25, py + 23, 2, 5);
      return;
    }

    // ── Achievements book (floor, on pedestal) ───────────────
    if (tile === TILES.FURN_ACHIEVEMENTS_BOOK) {
      // Pedestal
      ctx.fillStyle = '#2a1404'; ctx.fillRect(px + 6,  py + 19, 20, 12);
      ctx.fillStyle = '#5a3010'; ctx.fillRect(px + 7,  py + 20, 18, 10);
      ctx.fillStyle = '#7a4820'; ctx.fillRect(px + 7,  py + 20, 18, 1);  // top sheen
      ctx.fillStyle = '#1a0804'; ctx.fillRect(px + 7,  py + 29, 18, 1);  // shadow
      // Pedestal feet
      ctx.fillStyle = '#2a1404';
      ctx.fillRect(px + 5,  py + 30, 4, 1);
      ctx.fillRect(px + 23, py + 30, 4, 1);
      // Top plinth
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 4,  py + 16, 24, 4);
      ctx.fillStyle = '#6a4018'; ctx.fillRect(px + 5,  py + 17, 22, 2);
      // Book — open, tilted toward viewer
      // Left page
      ctx.fillStyle = '#f0e8d0'; ctx.fillRect(px + 6,  py + 10, 10, 8);
      // Right page
      ctx.fillRect(px + 16, py + 10, 10, 8);
      // Page lines
      ctx.fillStyle = 'rgba(80,60,20,0.45)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(px + 7,  py + 12 + i * 2, 8, 1);
        ctx.fillRect(px + 17, py + 12 + i * 2, 8, 1);
      }
      // Spine
      ctx.fillStyle = '#6a0810'; ctx.fillRect(px + 15, py + 9,  2, 10);
      // Gilded glow on top of book
      ctx.fillStyle = 'rgba(255,220,140,0.28)';
      ctx.fillRect(px + 6, py + 9, 20, 1);
      // Small star to indicate interactivity
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 15, py + 6, 2, 2);
      ctx.fillRect(px + 14, py + 7, 4, 1);
      ctx.fillRect(px + 15, py + 7, 2, 1);
      return;
    }

    // ── Butcher's chopping block ──────────────────────────

    if (tile === TILES.BUTCHER_BLOCK) {
      // Drop shadow beneath block
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(px + 17, py + 27, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Block body — thick end-grain cross section, centred
      // Outer bark ring
      ctx.fillStyle = '#3a2008';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 15, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
      // Sapwood ring
      ctx.fillStyle = '#7a4e20';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 15, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Heartwood ring 1
      ctx.fillStyle = '#5a3410';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 15,  8,  7, 0, 0, Math.PI * 2); ctx.fill();
      // Heartwood ring 2
      ctx.fillStyle = '#7a4c1c';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 15,  5,  4, 0, 0, Math.PI * 2); ctx.fill();
      // Pith
      ctx.fillStyle = '#3a2008';
      ctx.beginPath(); ctx.arc(px + 16, py + 15, 1.5, 0, Math.PI * 2); ctx.fill();

      // Knife cut grooves across the surface
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(px + 10, py + 12, 13, 1);
      ctx.fillRect(px + 12, py + 17,  9, 1);
      ctx.fillRect(px + 18, py + 10,  1, 9);

      // Top-left highlight (ambient light from above-left)
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.ellipse(px + 12, py + 11, 4, 3, -0.4, 0, Math.PI * 2); ctx.fill();

      // Cleaver blade (top-down: blade facing left, handle right)
      ctx.fillStyle = '#b0b0c0'; // blade face
      ctx.fillRect(px + 20, py + 10, 7, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.40)'; // blade sheen
      ctx.fillRect(px + 20, py + 10, 1, 10);
      ctx.fillStyle = '#3a3a4e'; // spine of blade
      ctx.fillRect(px + 26, py + 10, 1, 10);
      // Guard
      ctx.fillStyle = '#7a7a80';
      ctx.fillRect(px + 19, py + 9, 2, 12);
      // Handle
      ctx.fillStyle = '#5a2c10';
      ctx.fillRect(px + 27, py + 11, 5, 8);
      ctx.fillStyle = '#3a1a08';
      ctx.fillRect(px + 27, py + 11, 5, 2);
      ctx.fillRect(px + 27, py + 17, 5, 2);
      return;
    }

    // ── Hearth (stone fireplace — embedded in north wall) ──

    if (tile === TILES.HEARTH) {
      const t = this.time;
      // Wall-mounted: the 3D wall renders underneath via propGroundMap.
      // The wall face occupies roughly py+12 to py+27. We draw a stone
      // fireplace recessed into that face.

      // Stone surround — left pillar on wall face
      ctx.fillStyle = '#5a5050';
      ctx.fillRect(px + 2, py + 11, 6, 18);
      ctx.fillStyle = '#4e4444';
      ctx.fillRect(px + 3, py + 12, 4, 16);
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(px + 2, py + 19, 6, 1); // mortar line
      // Stone surround — right pillar
      ctx.fillStyle = '#5a5050';
      ctx.fillRect(px + 24, py + 11, 6, 18);
      ctx.fillStyle = '#4e4444';
      ctx.fillRect(px + 25, py + 12, 4, 16);
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(px + 24, py + 19, 6, 1);
      // Lintel across the top of the opening
      ctx.fillStyle = '#5a5050';
      ctx.fillRect(px + 2, py + 11, 28, 3);
      ctx.fillStyle = '#6a6060';
      ctx.fillRect(px + 3, py + 11, 26, 1); // highlight
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(px + 8, py + 11, 1, 3); // mortar
      ctx.fillRect(px + 23, py + 11, 1, 3);

      // Firebox cavity (dark recess)
      ctx.fillStyle = '#140a04';
      ctx.fillRect(px + 8, py + 14, 16, 12);

      // Soot at top of cavity
      ctx.fillStyle = 'rgba(0,0,0,0.50)';
      ctx.fillRect(px + 8, py + 14, 16, 2);

      // Ash bed at bottom of firebox
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(px + 9, py + 24, 14, 2);
      ctx.fillStyle = '#7a6a5a';
      ctx.fillRect(px + 11, py + 24, 4, 1);
      ctx.fillRect(px + 18, py + 24, 3, 1);

      // Front hearth ledge (stone sill at bottom)
      ctx.fillStyle = '#5a5050';
      ctx.fillRect(px + 2, py + 27, 28, 3);
      ctx.fillStyle = '#6a6060';
      ctx.fillRect(px + 3, py + 27, 26, 1);

      // Animated fire inside the firebox
      for (let i = 0; i < 3; i++) {
        const fx = px + 10 + i * 4;
        const flicker = Math.sin(t * 10 + i * 2.5) * 1.5;
        const fh = 6 + Math.sin(t * 8 + i * 1.7) * 2.5;
        ctx.fillStyle = i === 1 ? '#e67e22' : '#b03020';
        ctx.beginPath();
        ctx.moveTo(fx, py + 25);
        ctx.lineTo(fx + 2 + flicker, py + 25 - fh);
        ctx.lineTo(fx + 4, py + 25);
        ctx.fill();
      }
      // Bright inner flame
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 25);
      ctx.lineTo(px + 16, py + 17 + (Math.sin(t * 12) * 2 | 0));
      ctx.lineTo(px + 20, py + 25);
      ctx.fill();
      // Hot core
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath();
      ctx.moveTo(px + 14, py + 25);
      ctx.lineTo(px + 16, py + 20 + (Math.sin(t * 15) * 1.5 | 0));
      ctx.lineTo(px + 18, py + 25);
      ctx.fill();

      // Ember particles
      for (let e = 0; e < 2; e++) {
        const ex = px + 14 + (Math.sin(t * 7 + e * 3 + s1) * 5 | 0);
        const ey = py + 20 - ((t * 25 + e * 12 + s1 * 4) % 8);
        ctx.fillStyle = `rgba(255,200,0,${(0.8 - ((t * 1.5 + e) % 1) * 0.8).toFixed(2)})`;
        ctx.fillRect(ex, ey, 1, 1);
      }

      // Warm glow cast below hearth
      ctx.fillStyle = 'rgba(255,100,0,0.06)';
      ctx.fillRect(px + 4, py + 28, 24, 4);
      return;
    }

    // ── Wet stone floor (fishmonger) ─────────────────────

    if (tile === TILES.WET_STONE) {
      const v = s1 % 3;
      // Dark wet base
      ctx.fillStyle = '#3a5060'; ctx.fillRect(px, py, 32, 32);
      // Top-left cobble
      ctx.fillStyle = '#4a6470'; ctx.fillRect(px + 1,        py + 1,      13 + v, 12);
      ctx.fillStyle = '#587480'; ctx.fillRect(px + 2,        py + 2,      11 + v, 2);   // highlight
      // Top-right cobble
      ctx.fillStyle = '#486270'; ctx.fillRect(px + 17,       py + 1,      13 + v, 12);
      ctx.fillStyle = '#567278'; ctx.fillRect(px + 18,       py + 2,      11 + v, 2);
      // Bottom cobble (spans most of width)
      ctx.fillStyle = '#506870'; ctx.fillRect(px + 1,        py + 16,     28,     14);
      ctx.fillStyle = '#607880'; ctx.fillRect(px + 2,        py + 17,     26,      2);
      // Mortar joints
      ctx.fillStyle = '#253040';
      ctx.fillRect(px,      py + 14, 32, 2);
      ctx.fillRect(px + 15, py,       2, 14);
      // Water puddle (occasional)
      if (s3 % 3 === 0) {
        ctx.fillStyle = 'rgba(40,100,150,0.50)';
        ctx.fillRect(px + 5 + (s2 % 8), py + 20 + (s1 % 6), 8, 3);
        ctx.fillStyle = 'rgba(160,210,250,0.35)';
        ctx.fillRect(px + 6 + (s2 % 8), py + 20 + (s1 % 6), 4, 1);
      }
      // Wet sheen
      ctx.fillStyle = 'rgba(100,180,220,0.07)'; ctx.fillRect(px, py, 32, 32);
      return;
    }

    // ── Fish counter (display with fish laid out) ─────────

    if (tile === TILES.FISH_COUNTER) {
      // Dark aged-wood counter body
      ctx.fillStyle = '#3a2010'; ctx.fillRect(px, py, 32, 32);
      // Front face planks
      ctx.fillStyle = '#5a3818'; ctx.fillRect(px + 1, py + 22, 30, 9);
      ctx.fillStyle = '#4a2810'; // plank joints
      ctx.fillRect(px + 11, py + 22, 1, 9);
      ctx.fillRect(px + 21, py + 22, 1, 9);
      // Rim edge
      ctx.fillStyle = '#7a5028'; ctx.fillRect(px + 1, py + 20, 30, 3);
      // Counter top surface (slate grey)
      ctx.fillStyle = '#807868'; ctx.fillRect(px + 1, py + 1, 30, 20);
      ctx.fillStyle = '#908878'; ctx.fillRect(px + 2, py + 2, 28, 2); // surface highlight
      // Surface wear lines
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(px + 4, py + 8, 24, 1);
      ctx.fillRect(px + 6, py + 14, 20, 1);

      // Fish 1 — herring (small silver, left side)
      const hx = px + 2 + (s1 % 4);
      ctx.fillStyle = '#a8b4b0'; ctx.fillRect(hx,      py + 6, 10, 5);   // body
      ctx.fillStyle = '#c0ccc8'; ctx.fillRect(hx + 1,  py + 7,  7, 2);   // belly highlight
      ctx.fillStyle = '#707880'; ctx.fillRect(hx - 2,  py + 7,  3, 3);   // tail
      ctx.fillStyle = '#404848'; ctx.fillRect(hx + 8,  py + 7,  2, 2);   // eye
      ctx.fillStyle = 'rgba(200,220,220,0.4)';
      ctx.fillRect(hx + 3, py + 6, 2, 2); ctx.fillRect(hx + 6, py + 6, 2, 2); // scales

      // Fish 2 — salmon (larger, pink-orange, right side)
      const sx = px + 16 + (s2 % 3);
      ctx.fillStyle = '#c86030'; ctx.fillRect(sx,      py + 4, 13, 7);   // body
      ctx.fillStyle = '#e07848'; ctx.fillRect(sx + 1,  py + 6, 10, 3);   // belly
      ctx.fillStyle = '#a04820'; ctx.fillRect(sx - 2,  py + 5,  3, 5);   // tail
      ctx.fillStyle = '#380800'; ctx.fillRect(sx + 11, py + 5,  2, 2);   // eye
      ctx.fillStyle = 'rgba(210,100,50,0.45)';
      ctx.fillRect(sx + 3, py + 5, 2, 2); ctx.fillRect(sx + 6, py + 5, 2, 2); // scales

      // Seaweed / garnish sprig between fish
      ctx.fillStyle = '#306020';
      ctx.fillRect(px + 13, py + 9, 2, 5); ctx.fillRect(px + 12, py + 11, 4, 2);
      return;
    }

    // ── Fish tank (water trough with live fish) ───────────

    if (tile === TILES.FISH_TANK) {
      // Wooden barrel frame (2 px inset on all sides)
      ctx.fillStyle = '#4a3018'; ctx.fillRect(px + 2, py + 2, 28, 28);
      // Water interior
      ctx.fillStyle = '#143060'; ctx.fillRect(px + 5, py + 5, 22, 22);
      ctx.fillStyle = '#1a3c78'; ctx.fillRect(px + 5, py + 5, 22,  8); // surface layer
      // Surface ripples
      ctx.fillStyle = '#204890';
      ctx.fillRect(px + 7,  py + 7, 6, 1); ctx.fillRect(px + 20, py + 8, 5, 1);
      ctx.fillRect(px + 10, py + 10, 3, 1); ctx.fillRect(px + 18, py + 11, 6, 1);
      // Subtle surface sheen
      ctx.fillStyle = 'rgba(100,160,255,0.22)'; ctx.fillRect(px + 6, py + 6, 20, 2);
      // Fish silhouettes underwater
      const ft1x = px + 7 + (s1 % 6), ft1y = py + 16 + (s2 % 5);
      ctx.fillStyle = '#0a1a40'; ctx.fillRect(ft1x,     ft1y,      9, 3); // body
      ctx.fillStyle = '#0c2050'; ctx.fillRect(ft1x - 1, ft1y + 1,  2, 1); // tail
      const ft2x = px + 19 + (s3 % 5), ft2y = py + 22 + (s1 % 4);
      ctx.fillStyle = '#091838'; ctx.fillRect(ft2x,     ft2y,      8, 3);
      ctx.fillStyle = '#0b1e48'; ctx.fillRect(ft2x + 7, ft2y,      2, 3);
      // Wooden barrel hoops (iron bands)
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(px + 2, py + 12, 28, 2);
      ctx.fillRect(px + 2, py + 22, 28, 2);
      // Barrel side staves (edge highlight)
      ctx.fillStyle = '#6a4828';
      ctx.fillRect(px + 2, py + 2, 2, 28); ctx.fillRect(px + 28, py + 2, 2, 28);
      ctx.fillRect(px + 2, py + 2, 28, 2); ctx.fillRect(px + 2, py + 28, 28, 2);
      return;
    }

    // ── Ice box (crate of fish packed in ice) ─────────────

    if (tile === TILES.ICE_BOX) {
      // Wooden crate exterior (2 px inset on all sides)
      ctx.fillStyle = '#5a4030'; ctx.fillRect(px + 2, py + 2, 28, 28);
      // Plank grain lines
      ctx.fillStyle = '#3a2820';
      ctx.fillRect(px + 12, py + 2,  2, 28); ctx.fillRect(px + 22, py + 2, 2, 28);
      ctx.fillRect(px + 2,  py + 12, 28, 2); ctx.fillRect(px + 2,  py + 22, 28, 2);
      // Ice surface inside the crate (top portion)
      ctx.fillStyle = '#b0d0e0'; ctx.fillRect(px + 4, py + 4, 22, 14);
      // Ice chunk highlights
      ctx.fillStyle = '#d0eaf8';
      ctx.fillRect(px + 5,             py + 5,  8, 5);           // chunk 1
      ctx.fillRect(px + 16 + (s1 % 3), py + 6,  6, 4);           // chunk 2
      ctx.fillRect(px + 5,             py + 12, 5, 4);           // chunk 3
      ctx.fillRect(px + 13,            py + 11, 7 + (s2 % 3), 4); // chunk 4
      ctx.fillRect(px + 22,            py + 5,  4, 7);           // chunk 5
      // Ice crystal glints
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(px + 5,             py + 5, 3, 1);
      ctx.fillRect(px + 16 + (s1 % 3), py + 6, 2, 1);
      ctx.fillRect(px + 22,            py + 5, 2, 1);
      // Fish body sticking out below ice line
      const fix = px + 8 + (s3 % 7);
      ctx.fillStyle = '#b04028'; ctx.fillRect(fix,     py + 19, 7, 11);  // body
      ctx.fillStyle = '#c05030'; ctx.fillRect(fix + 1, py + 20, 4,  3);  // belly
      // Tail fin
      ctx.fillStyle = '#903020';
      ctx.fillRect(fix - 1, py + 27, 3, 3);
      ctx.fillRect(fix + 6, py + 27, 3, 3);
      // Cold mist wisp at ice line
      ctx.fillStyle = 'rgba(220,240,255,0.18)'; ctx.fillRect(px + 5, py + 19, 22, 3);
      // Corner nails
      ctx.fillStyle = '#484030';
      ctx.fillRect(px + 3, py +  3, 2, 2); ctx.fillRect(px + 27, py +  3, 2, 2);
      ctx.fillRect(px + 3, py + 27, 2, 2); ctx.fillRect(px + 27, py + 27, 2, 2);
      return;
    }

    // ── Dark armory stone floor ───────────────────────────

    if (tile === TILES.STONE_TILE) {
      // Near-black base
      ctx.fillStyle = '#22202c'; ctx.fillRect(px, py, 32, 32);
      // Two large stone slabs (upper / lower half)
      ctx.fillStyle = '#2e2a38'; ctx.fillRect(px + 1,  py + 1,  30, 13);
      ctx.fillStyle = '#282434'; ctx.fillRect(px + 1,  py + 16, 30, 15);
      // Polished edge highlights
      ctx.fillStyle = '#3c3848'; ctx.fillRect(px + 2,  py + 2,  28,  2);
      ctx.fillStyle = '#3a3646'; ctx.fillRect(px + 2,  py + 17, 28,  2);
      // Seams
      ctx.fillStyle = '#161420';
      ctx.fillRect(px,      py + 14, 32,  2);  // horizontal slab seam
      ctx.fillRect(px + 16, py,       2, 14);  // vertical seam in upper slab
      // Polished corner gloss
      ctx.fillStyle = 'rgba(160,140,200,0.10)'; ctx.fillRect(px + 2,  py + 2,  13, 11);
      ctx.fillStyle = 'rgba(160,140,200,0.06)'; ctx.fillRect(px + 18, py + 17, 11, 12);
      // Iron inlay accent lines
      ctx.fillStyle = '#3e3850';
      ctx.fillRect(px + 5,  py + 7,  6, 1); ctx.fillRect(px + 21, py + 7,  6, 1);
      ctx.fillRect(px + 5,  py + 22, 6, 1); ctx.fillRect(px + 21, py + 22, 6, 1);
      return;
    }

    // WEAPON_RACK is rendered via FURN_SET → _drawFurnitureSprite

    // ── Armor stand (chainmail mannequin) ─────────────────

    if (tile === TILES.ARMOR_STAND) {
      // Blank wooden mannequin shaped like a player. Helmet / chestplate /
      // leggings assigned via displayContent are drawn with the same
      // functions used to render them on the player, so the pieces line up.
      // Sprite spans y = py - 32 .. py + 32 (64 px tall).
      //
      // "Virtual player" anchor: the armour-piece draw functions expect a
      // player origin (cx, cy) where the body occupies cx..cx+24, cy..cy+32.
      // We anchor the mannequin head roughly one tile above the base tile
      // so the whole figure sits neatly atop the plinth.
      const pcx = px + 4;     // body horizontal origin
      const pcy = py - 16;    // body vertical origin (head at pcy+1)
      const wDk = '#3a1e08', wMd = '#5a3018', wLt = '#7a4820', wDkr = '#2a1608';

      // Drop shadow under the plinth
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(px + 6, py + 30, 20, 2);

      // ── Wooden plinth (wider, two-tier) ─────────────
      ctx.fillStyle = wDkr; ctx.fillRect(px + 5,  py + 18, 22, 13);
      ctx.fillStyle = wDk;  ctx.fillRect(px + 5,  py + 18, 22, 2);   // top edge
      ctx.fillStyle = wMd;  ctx.fillRect(px + 6,  py + 19, 20, 1);   // highlight
      ctx.fillStyle = wDk;  ctx.fillRect(px + 6,  py + 20, 20, 10);  // side face
      ctx.fillStyle = wMd;  ctx.fillRect(px + 7,  py + 21, 18, 8);   // face centre
      ctx.fillStyle = wLt;  ctx.fillRect(px + 7,  py + 21, 18, 1);   // sheen
      ctx.fillStyle = wDkr; ctx.fillRect(px + 6,  py + 29, 20, 1);   // shadow
      ctx.fillStyle = wDk;  ctx.fillRect(px + 5,  py + 30, 22, 1);

      // ── Wooden head orb (gets covered by helmet when equipped) ─
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 5,  pcy + 1, 14, 12);
      ctx.fillStyle = wLt;  ctx.fillRect(pcx + 6,  pcy + 1, 12, 2);   // top sheen
      ctx.fillStyle = wDkr; ctx.fillRect(pcx + 5,  pcy + 11, 14, 2);  // chin shadow
      // Subtle face groove (suggests sculpted eyes) — hidden once helmet covers
      ctx.fillStyle = wDkr; ctx.fillRect(pcx + 8, pcy + 5, 2, 1); ctx.fillRect(pcx + 14, pcy + 5, 2, 1);

      // ── Neck peg ─────────────────────────────
      ctx.fillStyle = wDk;  ctx.fillRect(pcx + 10, pcy + 13, 4, 2);
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 10, pcy + 13, 4, 1);

      // ── Torso form (covered by chestplate) ────────────
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 5,  pcy + 13, 14, 9);
      ctx.fillStyle = wLt;  ctx.fillRect(pcx + 5,  pcy + 13, 14, 1);
      ctx.fillStyle = wDkr; ctx.fillRect(pcx + 5,  pcy + 21, 14, 1);
      ctx.fillStyle = wLt;  ctx.fillRect(pcx + 5,  pcy + 13, 1, 9);   // left edge
      ctx.fillStyle = wDk;  ctx.fillRect(pcx + 18, pcy + 13, 1, 9);
      // Center "button" line (mannequin seam)
      ctx.fillStyle = wDk;  ctx.fillRect(pcx + 11, pcy + 14, 2, 7);

      // ── Shoulders (small stubs flanking torso) ─────────
      ctx.fillStyle = wDk;  ctx.fillRect(pcx + 3,  pcy + 13, 3, 5);
      ctx.fillStyle = wDk;  ctx.fillRect(pcx + 18, pcy + 13, 3, 5);
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 3,  pcy + 13, 3, 1);
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 18, pcy + 13, 3, 1);

      // ── Legs (covered by leggings) ────────────────
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 5,  pcy + 22, 5, 10);
      ctx.fillStyle = wMd;  ctx.fillRect(pcx + 14, pcy + 22, 5, 10);
      ctx.fillStyle = wLt;  ctx.fillRect(pcx + 5,  pcy + 22, 5, 1);
      ctx.fillStyle = wLt;  ctx.fillRect(pcx + 14, pcy + 22, 5, 1);
      ctx.fillStyle = wDkr; ctx.fillRect(pcx + 5,  pcy + 31, 5, 1);
      ctx.fillStyle = wDkr; ctx.fillRect(pcx + 14, pcy + 31, 5, 1);

      // ── Assigned armour pieces (same functions the player uses) ──
      const ac = world?.displayContent?.get(`${c},${r}`)?.content;
      if (ac) {
        // Legs first (so chestplate/helmet overlap naturally), bob = 0, legSpread = 0
        if (ac.leggings)   drawLeggings  (ctx, pcx, pcy, 1, ac.leggings,   0, 0);
        if (ac.chestplate) drawChestplate(ctx, pcx, pcy, 1, ac.chestplate, 0, 0);
        if (ac.helmet)     drawHelmet    (ctx, pcx, pcy, 1, ac.helmet,     0, 0); // 0 = DIR_DOWN (front-facing)
      }
      return;
    }

    // ── Textile / tailor shop floor ───────────────────────

    if (tile === TILES.TEXTILE_FLOOR) {
      const tones = ['#d09a18','#c89010','#daa420','#c08808'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = tones[i];
        ctx.fillRect(px, py + i * 8, 32, 7);
      }
      // Plank joints
      ctx.fillStyle = '#6a4808';
      for (let i = 1; i <= 3; i++) ctx.fillRect(px, py + i * 8 - 1, 32, 2);
      // Wood grain streaks
      ctx.fillStyle = 'rgba(0,0,0,0.09)';
      ctx.fillRect(px + 2 + (s1 % 12), py + 1,  1, 6);
      ctx.fillRect(px + 4 + (s2 % 12), py + 9,  1, 6);
      ctx.fillRect(px + 3 + (s3 % 12), py + 17, 1, 6);
      ctx.fillRect(px + 1 + (s1 % 10), py + 25, 1, 6);
      // Fabric swatches on floor
      ctx.fillStyle = '#a0209a'; ctx.fillRect(px + 3 + (s2 % 6), py + 4 + (s1 % 10), 6, 3); // purple
      ctx.fillStyle = '#c04010'; ctx.fillRect(px + 19 + (s3 % 4), py + 8 + (s2 %  8), 5, 3); // red
      ctx.fillStyle = '#1858c0'; ctx.fillRect(px + 9 + (s1 % 6), py + 20 + (s3 %  5), 4, 3); // blue
      // Gold thread line
      ctx.fillStyle = '#e8c040'; ctx.fillRect(px + 14, py + 2, 1, 15);
      return;
    }

    // ── Cape display (wall-hung capes on rod) ─────────────

    if (tile === TILES.CAPE_DISPLAY) {
      // Dark wall surface
      ctx.fillStyle = '#1c1820'; ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#242030'; ctx.fillRect(px + 1, py + 1, 30, 30);
      ctx.fillStyle = '#2e2a38'; ctx.fillRect(px + 2, py + 2, 28,  2); // surface shimmer

      // Wooden hanging rod
      ctx.fillStyle = '#7a4a1e'; ctx.fillRect(px + 2, py + 6, 28, 4);
      ctx.fillStyle = '#9a6228'; ctx.fillRect(px + 3, py + 7, 26, 1); // rod shine
      ctx.fillStyle = '#4a2c12'; ctx.fillRect(px + 3, py + 9, 26, 1); // rod shadow
      // Hook pegs
      ctx.fillStyle = '#b09060';
      ctx.fillRect(px + 5,  py + 5, 3, 3);
      ctx.fillRect(px + 14, py + 5, 3, 3);
      ctx.fillRect(px + 23, py + 5, 3, 3);
      // Rod end caps
      ctx.fillStyle = '#9a7040';
      ctx.fillRect(px,      py + 5, 3, 6); ctx.fillRect(px + 29, py + 5, 3, 6);

      // Cape 1 — crimson red (left)
      ctx.fillStyle = '#b81808'; ctx.fillRect(px + 3,  py + 9,  8, 20);
      ctx.fillStyle = '#d82818'; ctx.fillRect(px + 4,  py + 10, 4,  5); // sheen
      ctx.fillStyle = '#881008';
      ctx.fillRect(px + 7,  py + 10, 2, 18); ctx.fillRect(px + 4,  py + 24, 2, 5); // folds
      ctx.fillStyle = '#d4aa00'; ctx.fillRect(px + 3,  py + 9,  8,  2); // gold trim

      // Cape 2 — royal blue (centre)
      ctx.fillStyle = '#1028b0'; ctx.fillRect(px + 12, py + 9,  8, 20);
      ctx.fillStyle = '#1838c8'; ctx.fillRect(px + 13, py + 10, 4,  5);
      ctx.fillStyle = '#081898';
      ctx.fillRect(px + 16, py + 10, 2, 18); ctx.fillRect(px + 13, py + 24, 2, 5);
      ctx.fillStyle = '#d4aa00'; ctx.fillRect(px + 12, py + 9,  8,  2);

      // Cape 3 — forest green (right)
      ctx.fillStyle = '#185a18'; ctx.fillRect(px + 21, py + 9,  8, 20);
      ctx.fillStyle = '#207a20'; ctx.fillRect(px + 22, py + 10, 4,  5);
      ctx.fillStyle = '#103e10';
      ctx.fillRect(px + 25, py + 10, 2, 18); ctx.fillRect(px + 22, py + 24, 2, 5);
      ctx.fillStyle = '#d4aa00'; ctx.fillRect(px + 21, py + 9,  8,  2);
      return;
    }

    // ── Tailor's cutting table ─────────────────────────────

    if (tile === TILES.TAILOR_TABLE) {
      // Table leg stumps visible below
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(px + 1,  py + 27, 5, 4); ctx.fillRect(px + 26, py + 27, 5, 4);
      // Table top surface
      ctx.fillStyle = '#7a5028'; ctx.fillRect(px + 1, py + 1, 30, 26);
      ctx.fillStyle = '#5a3818'; ctx.fillRect(px + 1, py + 25, 30,  2); // rim shadow

      // Green cutting mat
      ctx.fillStyle = '#2c6038'; ctx.fillRect(px + 3, py + 3, 26, 20);
      // Mat measurement grid
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 1; i <= 4; i++) ctx.fillRect(px + 3, py + 3 + i * 4, 26, 1);
      for (let i = 1; i <= 5; i++) ctx.fillRect(px + 3 + i * 4, py + 3,   1, 20);

      // Purple fabric bolt (rolled, upper-right)
      ctx.fillStyle = '#8818a0'; ctx.fillRect(px + 19, py + 2, 10, 6);
      ctx.fillStyle = '#a820bc'; ctx.fillRect(px + 20, py + 3,  8, 2); // highlight
      ctx.fillStyle = '#600e78'; ctx.fillRect(px + 19, py + 7, 10, 1); // shadow

      // Scissors (crossed on mat)
      ctx.fillStyle = '#a0a0b0';
      ctx.fillRect(px + 5, py + 6, 1, 9);   // blade 1
      ctx.fillRect(px + 5, py + 6, 6, 1);   // handle 1
      ctx.fillRect(px + 8, py + 6, 1, 9);   // blade 2
      ctx.fillRect(px + 8, py + 6, 6, 1);   // handle 2
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(px + 6, py + 9, 3, 2); // pivot rivet

      // Thread spool
      ctx.fillStyle = '#d04820'; ctx.fillRect(px + 4, py + 17, 6, 4); // spool body
      ctx.fillStyle = '#e86030'; ctx.fillRect(px + 5, py + 18, 4, 1); // thread highlight
      ctx.fillStyle = '#8a3010';
      ctx.fillRect(px + 4, py + 17, 6, 1); ctx.fillRect(px + 4, py + 20, 6, 1); // flanges
      return;
    }

    // DISPLAY_SHELF is rendered via FURN_SET → _drawFurnitureSprite

    // ── Kingdom fountain (5×5 multi-tile basin) ───────────
    // Rim tiles  = stone parapet wall (shorter than WALL but same style)
    // Inner tiles = animated flowing water
    // Centre tile = stone pedestal with animated water jet

    if (tile === TILES.FOUNTAIN) {
      const t = this.time;
      const F = TILES.FOUNTAIN;
      const nN  = world.getTile(c,   r-1) === F;
      const nS  = world.getTile(c,   r+1) === F;
      const nE  = world.getTile(c+1, r  ) === F;
      const nW  = world.getTile(c-1, r  ) === F;
      const nNE = world.getTile(c+1, r-1) === F;
      const nNW = world.getTile(c-1, r-1) === F;
      const nSE = world.getTile(c+1, r+1) === F;
      const nSW = world.getTile(c-1, r+1) === F;
      const isInner  = nN && nS && nE && nW && nNE && nNW && nSE && nSW;
      const isCenter = isInner &&
        world.getTile(c, r-2) === F && world.getTile(c, r+2) === F &&
        world.getTile(c-2, r) === F && world.getTile(c+2, r) === F;

      if (isInner) {
        // ── Inner 3×3 water area ────────────────────────────
        // Deep basin water base
        ctx.fillStyle = '#14385a'; ctx.fillRect(px, py, 32, 32);

        // Flowing wave bands — scroll with time
        const w1y = ((t * 28 + s1 * 11) % 32) | 0;
        const w2y = ((t * 20 + s2 * 9)  % 32) | 0;
        const w3y = ((t * 16 + s3 * 13) % 32) | 0;
        ctx.fillStyle = 'rgba(40,130,220,0.35)';
        ctx.fillRect(px, py + w1y, 32, 3);
        ctx.fillRect(px, py + ((w1y + 16) % 32), 32, 3);
        ctx.fillStyle = 'rgba(80,170,255,0.25)';
        ctx.fillRect(px, py + w2y, 32, 2);
        ctx.fillRect(px, py + ((w2y + 12) % 32), 32, 2);
        // Diagonal shimmer streaks
        ctx.fillStyle = 'rgba(160,220,255,0.18)';
        const sx1 = ((t * 18 + s1 * 7) % 40) | 0;
        ctx.fillRect(px + ((sx1) % 32), py, 2, 32);
        ctx.fillRect(px + ((sx1 + 18) % 32), py, 1, 32);
        // Bright surface sparkle
        ctx.fillStyle = 'rgba(220,240,255,0.50)';
        ctx.fillRect(px + w3y % 28, py + w1y % 28, 2, 1);
        ctx.fillRect(px + (w2y + s1) % 26, py + w3y % 26, 3, 1);
        // Ambient depth shadow at tile edges (continuity with rim)
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        if (!nN) ctx.fillRect(px, py, 32, 3);
        if (!nS) ctx.fillRect(px, py + 29, 32, 3);
        if (!nW) ctx.fillRect(px, py, 3, 32);
        if (!nE) ctx.fillRect(px + 29, py, 3, 32);

        if (isCenter) {
          // Pedestal base (stone disc at water level)
          ctx.fillStyle = '#505868'; ctx.fillRect(px + 11, py + 21, 10, 7);
          ctx.fillStyle = '#606878'; ctx.fillRect(px + 12, py + 22, 8,  5);
          // Column shaft
          ctx.fillStyle = '#585870'; ctx.fillRect(px + 14, py + 8, 4, 14);
          ctx.fillStyle = '#686882'; ctx.fillRect(px + 15, py + 9, 2, 12);
          // Capital (wider top)
          ctx.fillStyle = '#606878'; ctx.fillRect(px + 12, py + 6, 8, 3);
          ctx.fillStyle = '#9090a8'; ctx.fillRect(px + 13, py + 6, 6, 1);
          // ── Animated water jet ────────────────────────────
          const jh = (Math.sin(t * 4) * 2 + 5) | 0; // jet height 3-7px
          // Main upward jet
          ctx.fillStyle = 'rgba(160,225,255,0.95)';
          ctx.fillRect(px + 15, py + 6 - jh, 2, jh + 1);
          // Falling arc droplets (time-based)
          for (let i = 0; i < 4; i++) {
            const phase = (t * 2 + i * 1.5) % 6;
            const dx = (Math.sin(phase * 1.2 + i) * 7) | 0;
            const dy = (phase * phase * 0.4 - 2) | 0;
            const alpha = Math.max(0, 1 - phase / 6);
            ctx.fillStyle = `rgba(140,210,255,${(alpha * 0.9).toFixed(2)})`;
            ctx.fillRect(px + 16 + dx, py + 6 - jh + 2 + dy, 2, 2);
          }
          // Splash ring at water surface
          ctx.fillStyle = 'rgba(180,230,255,0.55)';
          const sr = (Math.sin(t * 3) * 1.5 + 3) | 0;
          ctx.fillRect(px + 16 - sr, py + 7, sr * 2, 1);
          // Foam ring around pedestal base
          ctx.fillStyle = 'rgba(200,240,255,0.30)';
          ctx.fillRect(px + 10, py + 27, 12, 1);
        }
      } else {
        // ── Rim tile — shorter stone parapet wall ──────────
        // Like the WALL tile: if the tile directly south is also fountain,
        // this rim tile is an interior walkway surface (no face visible yet).
        // Only the southernmost exposed rim row shows the ledge + face + shadow.
        const rimBelow = world.getTile(c, r + 1) === TILES.FOUNTAIN;
        const TOP = 8;
        const s4F = (c * 17 + r * 5) % 29;

        if (rimBelow) {
          // ─── WALKWAY (rim continues below — only top surface visible) ──
          ctx.fillStyle = 'rgba(255,255,255,0.52)'; ctx.fillRect(px, py, 32, 32);
          ctx.fillStyle = 'rgba(255,228,180,0.15)'; ctx.fillRect(px, py, 32, 32);
          // Full-tile flagstone joints (continuous across stacked tiles)
          const tvx = 8 + (s1 % 16);
          const thy  = 5 + (s2 % 22);
          const thy2 = thy + 10 + (s3 % 12);
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(px + tvx, py, 1, 32);
          ctx.fillRect(px, py + thy, 32, 1);
          if (thy2 < 32) ctx.fillRect(px, py + thy2, 32, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(px + 1, py + 1, tvx - 2, 1);
          ctx.fillRect(px + tvx + 1, py + 1, 31 - tvx, 1);
          // Left-edge highlight
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px, py, 2, 32);
          // Subtle water tint on inward-facing edges
          ctx.fillStyle = 'rgba(20,80,160,0.18)';
          if (nS) ctx.fillRect(px, py + 30, 32, 2);
          if (nE) ctx.fillRect(px + 30, py, 2, 32);
          if (nW) ctx.fillRect(px, py, 2, 32);
        } else {
          // ─── PARAPET EDGE (bottom-exposed rim tile — face visible) ────
          ctx.fillStyle = 'rgba(255,255,255,0.52)'; ctx.fillRect(px, py, 32, TOP);
          ctx.fillStyle = 'rgba(255,228,180,0.15)'; ctx.fillRect(px, py, 32, TOP);
          // Flagstone joints on top surface
          const tvx = 8 + (s1 % 16);
          const thy = 2 + (s2 % 5);
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(px + tvx, py + 1, 1, TOP - 1);
          ctx.fillRect(px + 1, py + thy, 31, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(px + 1,    py + 1, tvx - 1, 1);
          ctx.fillRect(px + tvx + 1, py + 1, 31 - tvx, 1);
          // Ledge (3D parapet edge)
          ctx.fillStyle = 'rgba(255,255,255,0.62)'; ctx.fillRect(px, py + TOP, 32, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fillRect(px, py + TOP + 1, 32, 1);
          // Wall face with stone courses
          const FACE = 24;
          const faceStart = TOP + 2;
          ctx.fillStyle = 'rgba(0,0,0,0.30)';
          ctx.fillRect(px, py + faceStart, 32, FACE - faceStart);
          this._drawWallCourses(ctx, px, py, faceStart, FACE, r, s1, s2, s3, s4F);
          // Cast shadow
          ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(px, py + FACE,     32, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.24)'; ctx.fillRect(px, py + FACE + 2, 32, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(px, py + FACE + 4, 32, 1);
          // Water-blue tint on inner-facing edge of the top surface
          ctx.fillStyle = 'rgba(20,80,160,0.30)';
          if (nS) ctx.fillRect(px, py,          32, 2);
          if (nN) ctx.fillRect(px, py + TOP - 2, 32, 2);
          if (nE) ctx.fillRect(px + 28, py,       4, TOP);
          if (nW) ctx.fillRect(px,      py,        4, TOP);
        }
      }
      return;
    }

    // ── Elevated stone planters (3×6 connected block) ─────
    // Outer tiles (some neighbour is not same type) → stone parapet wall face.
    // Inner tiles (all 8 neighbours same type) → soil / plants.

    if (tile === TILES.PLANTER_FLOWERS || tile === TILES.PLANTER_BUSH) {
      const P = tile;
      const pN  = world.getTile(c,   r-1) === P;
      const pS  = world.getTile(c,   r+1) === P;
      const pE  = world.getTile(c+1, r  ) === P;
      const pW  = world.getTile(c-1, r  ) === P;
      const pNE = world.getTile(c+1, r-1) === P;
      const pNW = world.getTile(c-1, r-1) === P;
      const pSE = world.getTile(c+1, r+1) === P;
      const pSW = world.getTile(c-1, r+1) === P;
      const pInner = pN && pS && pE && pW && pNE && pNW && pSE && pSW;

      if (pInner) {
        // ── Interior tile: rich soil with plants ────────────
        ctx.fillStyle = '#3a2010'; ctx.fillRect(px, py, 32, 32);
        // Soil texture variation
        ctx.fillStyle = 'rgba(80,40,10,0.35)';
        ctx.fillRect(px + (s1 % 8),       py + (s2 % 10),       14, 10);
        ctx.fillRect(px + 14 + (s2 % 10), py + 10 + (s3 % 12),  12, 8);

        if (tile === TILES.PLANTER_FLOWERS) {
          // Grass/turf base
          ctx.fillStyle = '#2d5a1e'; ctx.fillRect(px + 1, py + 1, 30, 30);
          ctx.fillStyle = '#38702a';
          ctx.fillRect(px + 1 + (s1 % 10), py + 1 + (s2 % 8), 8, 6);
          ctx.fillRect(px + 14 + (s2 % 8), py + 16 + (s1 % 8), 10, 5);
          // Flower stems
          ctx.fillStyle = '#3a8a2a';
          ctx.fillRect(px + 7,  py + 16, 1, 10);
          ctx.fillRect(px + 14, py + 14, 1, 12);
          ctx.fillRect(px + 21, py + 18, 1, 8);
          ctx.fillRect(px + 26, py + 12, 1, 14);
          // Flower heads (seeded colour per position)
          const fc1 = ['#e84040','#e8d840','#e040e8','#ffffff','#40c8e8','#f08020'];
          ctx.fillStyle = fc1[(c * 3 + r * 5) % fc1.length];
          ctx.fillRect(px + 5,  py + 13, 4, 4);
          ctx.fillStyle = fc1[(c * 7 + r * 2) % fc1.length];
          ctx.fillRect(px + 12, py + 11, 4, 4);
          ctx.fillStyle = fc1[(c * 5 + r * 7) % fc1.length];
          ctx.fillRect(px + 19, py + 15, 4, 4);
          ctx.fillStyle = fc1[(c * 2 + r * 11) % fc1.length];
          ctx.fillRect(px + 24, py + 9,  4, 4);
          // Flower centres
          ctx.fillStyle = '#f0d020';
          ctx.fillRect(px + 6,  py + 14, 2, 2);
          ctx.fillRect(px + 13, py + 12, 2, 2);
          ctx.fillRect(px + 20, py + 16, 2, 2);
          ctx.fillRect(px + 25, py + 10, 2, 2);
        } else {
          // PLANTER_BUSH: rounded bush mass
          ctx.fillStyle = '#1e4a18'; ctx.fillRect(px + 2, py + 8, 28, 18);
          ctx.fillStyle = '#1e4a18'; ctx.fillRect(px + 6, py + 4, 20, 26);
          // Bush highlight patches (light from top-left)
          ctx.fillStyle = '#2e6828';
          ctx.fillRect(px + 3,  py + 9,  10, 6);
          ctx.fillRect(px + 18, py + 6,  8,  5);
          ctx.fillRect(px + 8,  py + 4,  6,  3);
          // Berries (seeded colour)
          const bc = (c * 7 + r * 3) % 3;
          ctx.fillStyle = bc === 0 ? '#c03030' : bc === 1 ? '#e0a020' : '#6040c8';
          ctx.fillRect(px + 5  + (s1 % 8), py + 12 + (s2 % 6), 3, 3);
          ctx.fillRect(px + 18 + (s2 % 7), py + 8  + (s3 % 8), 3, 3);
          ctx.fillRect(px + 10 + (s3 % 6), py + 20 + (s1 % 5), 3, 3);
        }
      } else {
        // ── Outer tile: stone planter parapet wall ──────────
        // Same walkway-vs-parapet-edge logic as the WALL tile:
        // if the tile south is also the same planter type, this tile is a
        // continuous walkway surface. Only the bottom-exposed row shows the face.
        const planterBelow = world.getTile(c, r + 1) === P;
        const TOP = 7;
        const s4P = (c * 17 + r * 5) % 29;

        if (planterBelow) {
          // ─── WALKWAY (planter continues below) ───────────
          ctx.fillStyle = 'rgba(255,255,255,0.48)'; ctx.fillRect(px, py, 32, 32);
          ctx.fillStyle = 'rgba(200,180,140,0.22)'; ctx.fillRect(px, py, 32, 32);
          // Full-tile flagstone joints (continuous across stacked tiles)
          const tvx = 9 + (s1 % 14);
          const thy  = 5 + (s2 % 22);
          const thy2 = thy + 11 + (s3 % 11);
          ctx.fillStyle = 'rgba(0,0,0,0.24)';
          ctx.fillRect(px + tvx, py, 1, 32);
          ctx.fillRect(px, py + thy, 32, 1);
          if (thy2 < 32) ctx.fillRect(px, py + thy2, 32, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fillRect(px + 1, py + 1, tvx - 2, 1);
          ctx.fillRect(px + tvx + 1, py + 1, 31 - tvx, 1);
          // Left-edge highlight
          ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(px, py, 2, 32);
          // Soil-peek tint on inward-facing edges
          ctx.fillStyle = 'rgba(58,32,16,0.25)';
          if (pS) ctx.fillRect(px, py + 30, 32, 2);
          if (pE) ctx.fillRect(px + 30, py, 2, 32);
          if (pW) ctx.fillRect(px, py, 2, 32);
        } else {
          // ─── PARAPET EDGE (bottom-exposed planter tile) ──
          ctx.fillStyle = 'rgba(255,255,255,0.48)'; ctx.fillRect(px, py, 32, TOP);
          ctx.fillStyle = 'rgba(200,180,140,0.22)'; ctx.fillRect(px, py, 32, TOP);
          // Flagstone joints on top surface
          const tvx = 9 + (s1 % 14);
          const thy = 2 + (s2 % 4);
          ctx.fillStyle = 'rgba(0,0,0,0.26)';
          ctx.fillRect(px + tvx, py + 1, 1, TOP - 1);
          ctx.fillRect(px + 1, py + thy, 31, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.fillRect(px + 1,    py + 1, tvx - 1, 1);
          ctx.fillRect(px + tvx + 1, py + 1, 31 - tvx, 1);
          // Ledge
          ctx.fillStyle = 'rgba(255,255,255,0.58)'; ctx.fillRect(px, py + TOP, 32, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px, py + TOP + 1, 32, 1);
          // Wall face
          const FACE_P = 22;
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(px, py + TOP + 2, 32, FACE_P - TOP - 2);
          this._drawWallCourses(ctx, px, py, TOP + 2, FACE_P, r, s1, s2, s3, s4P);
          // Cast shadow
          ctx.fillStyle = 'rgba(0,0,0,0.44)'; ctx.fillRect(px, py + FACE_P,     32, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(px, py + FACE_P + 2, 32, 2);
          // Soil-peek on inner edges
          ctx.fillStyle = 'rgba(58,32,16,0.45)';
          if (pS) ctx.fillRect(px, py,          32, 2);
          if (pN) ctx.fillRect(px, py + TOP - 2, 32, 2);
          if (pE) ctx.fillRect(px + 28, py,       4, TOP);
          if (pW) ctx.fillRect(px,      py,        4, TOP);
        }
      }
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

    // ── WOOD FENCE (taming pen) — horizontal ─────────────────────────
    if (tile === TILES.WOOD_FENCE_H) {
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 3, py + 14, 1, 6); ctx.fillRect(px + 19, py + 18, 1, 5);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 11, py + 16, 1, 6); ctx.fillRect(px + 27, py + 12, 1, 7);
      // Viewed from the front — two horizontal rails with vertical pickets
      // Horizontal rails
      ctx.fillStyle = '#6b4520';
      ctx.fillRect(px, py + 10, 32, 3);   // top rail
      ctx.fillRect(px, py + 21, 32, 3);   // bottom rail
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(px, py + 10, 32, 1);
      ctx.fillRect(px, py + 21, 32, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(px, py + 12, 32, 1);
      ctx.fillRect(px, py + 23, 32, 1);
      // Vertical pickets — rounded tops
      [1, 9, 17, 25].forEach(pxo => {
        ctx.fillStyle = '#7a5028';
        ctx.fillRect(px + pxo, py + 6, 5, 22);
        // Rounded top
        ctx.fillStyle = '#8a5e30';
        ctx.fillRect(px + pxo + 1, py + 4, 3, 3);
        ctx.beginPath(); ctx.arc(px + pxo + 2.5, py + 4, 2.5, Math.PI, 0); ctx.fill();
        // Left highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px + pxo, py + 6, 1, 22);
        // Right shadow
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(px + pxo + 4, py + 6, 1, 22);
      });
      return;
    }

    // ── WOOD FENCE (taming pen) — vertical ───────────────────────────
    if (tile === TILES.WOOD_FENCE_V) {
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 5, py + 10, 1, 7); ctx.fillRect(px + 24, py + 8, 1, 6);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 8, py + 14, 1, 5); ctx.fillRect(px + 22, py + 18, 1, 7);
      // Single vertical post running top to bottom
      ctx.fillStyle = '#7a5028';
      ctx.fillRect(px + 14, py, 5, 32);
      // Front face highlight (angled view shows left lit face)
      ctx.fillStyle = '#8a5e30';
      ctx.fillRect(px + 14, py, 2, 32);
      // Right shadow edge
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 18, py, 1, 32);
      // Horizontal slats centered on post
      [4, 12, 20, 28].forEach(pyo => {
        ctx.fillStyle = '#6b4520';
        ctx.fillRect(px + 11, py + pyo, 11, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(px + 11, py + pyo, 11, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + 11, py + pyo + 2, 11, 1);
      });
      return;
    }

    // ── STEEL FENCE (garden) — horizontal ───────────────────────────
    if (tile === TILES.STEEL_FENCE_H) {
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 6, py + 16, 1, 6); ctx.fillRect(px + 22, py + 12, 1, 7);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 14, py + 14, 1, 5); ctx.fillRect(px + 28, py + 18, 1, 6);
      // Iron/steel bars — two horizontal rails with vertical bars between
      // Horizontal rails
      ctx.fillStyle = '#4a5a68';
      ctx.fillRect(px, py + 9, 32, 2);
      ctx.fillRect(px, py + 22, 32, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(px, py + 9, 32, 1);
      ctx.fillRect(px, py + 22, 32, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px, py + 10, 32, 1);
      ctx.fillRect(px, py + 23, 32, 1);
      // Vertical bars — thin steel with pointed tops
      [3, 9, 15, 21, 27].forEach(pxo => {
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(px + pxo, py + 5, 3, 22);
        // Pointed top (spear tip)
        ctx.fillStyle = '#6a7a8a';
        ctx.fillRect(px + pxo + 1, py + 2, 1, 4);
        ctx.fillRect(px + pxo, py + 4, 3, 2);
        // Metallic highlight
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(px + pxo, py + 5, 1, 22);
        // Shadow edge
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(px + pxo + 2, py + 5, 1, 22);
      });
      return;
    }

    // ── STEEL FENCE (garden) — vertical ──────────────────────────────
    if (tile === TILES.STEEL_FENCE_V) {
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 4, py + 12, 1, 6); ctx.fillRect(px + 25, py + 10, 1, 7);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 9, py + 16, 1, 5); ctx.fillRect(px + 20, py + 14, 1, 6);
      // Single vertical bar running top to bottom
      ctx.fillStyle = '#5a6a7a';
      ctx.fillRect(px + 14, py, 4, 32);
      // Lit left face
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(px + 14, py, 2, 32);
      // Right shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 17, py, 1, 32);
      // Horizontal slats centered on post
      [3, 9, 15, 21, 27].forEach(pyo => {
        ctx.fillStyle = '#4a5a68';
        ctx.fillRect(px + 11, py + pyo, 10, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + 11, py + pyo, 10, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(px + 11, py + pyo + 1, 10, 1);
      });
      return;
    }

    // ── WOOD FENCE — corner post ─────────────────────────────────────
    if (tile === TILES.WOOD_FENCE_CORNER) {
      // Check which directions have connecting fences
      const wL = world && world.getTile(c - 1, r); const hasLeft  = wL === TILES.WOOD_FENCE_H || wL === TILES.WOOD_FENCE_CORNER;
      const wR = world && world.getTile(c + 1, r); const hasRight = wR === TILES.WOOD_FENCE_H || wR === TILES.WOOD_FENCE_CORNER;
      const wU = world && world.getTile(c, r - 1); const hasUp    = wU === TILES.WOOD_FENCE_V || wU === TILES.WOOD_FENCE_CORNER;
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 3, py + 12, 1, 6); ctx.fillRect(px + 26, py + 18, 1, 5);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 8, py + 20, 1, 5); ctx.fillRect(px + 22, py + 10, 1, 7);
      // Left horizontal rails + pickets (if connected)
      if (hasLeft) {
        ctx.fillStyle = '#6b4520';
        ctx.fillRect(px, py + 10, 12, 3);
        ctx.fillRect(px, py + 21, 12, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(px, py + 10, 12, 1);
        ctx.fillRect(px, py + 21, 12, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px, py + 12, 12, 1);
        ctx.fillRect(px, py + 23, 12, 1);
        [1, 7].forEach(pxo => {
          ctx.fillStyle = '#7a5028';
          ctx.fillRect(px + pxo, py + 6, 5, 22);
          ctx.fillStyle = '#8a5e30';
          ctx.fillRect(px + pxo + 1, py + 4, 3, 3);
          ctx.beginPath(); ctx.arc(px + pxo + 2.5, py + 4, 2.5, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(px + pxo, py + 6, 1, 22);
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(px + pxo + 4, py + 6, 1, 22);
        });
      }
      // Right horizontal rails + pickets (if connected)
      if (hasRight) {
        ctx.fillStyle = '#6b4520';
        ctx.fillRect(px + 20, py + 10, 12, 3);
        ctx.fillRect(px + 20, py + 21, 12, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(px + 20, py + 10, 12, 1);
        ctx.fillRect(px + 20, py + 21, 12, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + 20, py + 12, 12, 1);
        ctx.fillRect(px + 20, py + 23, 12, 1);
        [21, 27].forEach(pxo => {
          ctx.fillStyle = '#7a5028';
          ctx.fillRect(px + pxo, py + 6, 5, 22);
          ctx.fillStyle = '#8a5e30';
          ctx.fillRect(px + pxo + 1, py + 4, 3, 3);
          ctx.beginPath(); ctx.arc(px + pxo + 2.5, py + 4, 2.5, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(px + pxo, py + 6, 1, 22);
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(px + pxo + 4, py + 6, 1, 22);
        });
      }
      // Vertical post stub upward (if connected)
      if (hasUp) {
        ctx.fillStyle = '#6b4520';
        ctx.fillRect(px + 14, py, 5, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(px + 14, py, 1, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px + 18, py, 1, 10);
      }
      // Corner post — extends from cap down to bottom rail
      ctx.fillStyle = '#7a5028';
      ctx.fillRect(px + 12, py + 8, 8, 16);
      ctx.fillStyle = '#8a5e30';
      ctx.fillRect(px + 12, py + 8, 3, 16); // lit left face
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(px + 19, py + 8, 1, 16);
      // Post cap
      ctx.fillStyle = '#8a5e30';
      ctx.fillRect(px + 13, py + 6, 6, 3);
      ctx.fillRect(px + 14, py + 5, 4, 2);
      return;
    }

    // ── STEEL FENCE — corner post ──────────────────────────────────────
    if (tile === TILES.STEEL_FENCE_CORNER) {
      // Check which directions have connecting fences
      const sL = world && world.getTile(c - 1, r); const hasLeft  = sL === TILES.STEEL_FENCE_H || sL === TILES.STEEL_FENCE_CORNER;
      const sR = world && world.getTile(c + 1, r); const hasRight = sR === TILES.STEEL_FENCE_H || sR === TILES.STEEL_FENCE_CORNER;
      const sU = world && world.getTile(c, r - 1); const hasUp    = sU === TILES.STEEL_FENCE_V || sU === TILES.STEEL_FENCE_CORNER;
      // Grass base
      ctx.fillStyle = TILE_COLORS[TILES.GRASS];
      ctx.fillRect(px, py, 32, 32);
      ctx.fillStyle = '#5aaa4a';
      ctx.fillRect(px + 4, py + 14, 1, 5); ctx.fillRect(px + 25, py + 16, 1, 6);
      ctx.fillStyle = '#3a9928';
      ctx.fillRect(px + 9, py + 20, 1, 5); ctx.fillRect(px + 23, py + 10, 1, 6);
      // Left horizontal rails + steel bars (if connected)
      if (hasLeft) {
        ctx.fillStyle = '#4a5a68';
        ctx.fillRect(px, py + 9, 12, 2);
        ctx.fillRect(px, py + 22, 12, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px, py + 9, 12, 1);
        ctx.fillRect(px, py + 22, 12, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, py + 10, 12, 1);
        ctx.fillRect(px, py + 23, 12, 1);
        [3, 9].forEach(pxo => {
          ctx.fillStyle = '#5a6a7a';
          ctx.fillRect(px + pxo, py + 5, 3, 22);
          ctx.fillStyle = '#6a7a8a';
          ctx.fillRect(px + pxo + 1, py + 2, 1, 4);
          ctx.fillRect(px + pxo, py + 4, 3, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(px + pxo, py + 5, 1, 22);
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(px + pxo + 2, py + 5, 1, 22);
        });
      }
      // Right horizontal rails + steel bars (if connected)
      if (hasRight) {
        ctx.fillStyle = '#4a5a68';
        ctx.fillRect(px + 20, py + 9, 12, 2);
        ctx.fillRect(px + 20, py + 22, 12, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + 20, py + 9, 12, 1);
        ctx.fillRect(px + 20, py + 22, 12, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px + 20, py + 10, 12, 1);
        ctx.fillRect(px + 20, py + 23, 12, 1);
        [21, 27].forEach(pxo => {
          ctx.fillStyle = '#5a6a7a';
          ctx.fillRect(px + pxo, py + 5, 3, 22);
          ctx.fillStyle = '#6a7a8a';
          ctx.fillRect(px + pxo + 1, py + 2, 1, 4);
          ctx.fillRect(px + pxo, py + 4, 3, 2);
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(px + pxo, py + 5, 1, 22);
          ctx.fillStyle = 'rgba(0,0,0,0.20)';
          ctx.fillRect(px + pxo + 2, py + 5, 1, 22);
        });
      }
      // Vertical post stub upward (if connected)
      if (hasUp) {
        ctx.fillStyle = '#4a5a68';
        ctx.fillRect(px + 14, py, 4, 9);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + 14, py, 1, 9);
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(px + 17, py, 1, 9);
      }
      // Corner post — extends from cap down to bottom rail
      ctx.fillStyle = '#5a6a7a';
      ctx.fillRect(px + 12, py + 7, 8, 17);
      ctx.fillStyle = '#6a7a8a';
      ctx.fillRect(px + 12, py + 7, 3, 17); // lit left face
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 19, py + 7, 1, 17);
      // Post cap / finial
      ctx.fillStyle = '#7a8a9a';
      ctx.fillRect(px + 13, py + 5, 6, 3);
      ctx.fillRect(px + 14, py + 3, 4, 3);
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
      // Base soil (always brown)
      ctx.fillStyle = '#6b4e2a';
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
        // Fully grown plants on soil — thick stems with bushy leaf clusters
        const plants = [[6,24],[16,16],[26,22],[10,10],[24,8]];
        for (const [bx, by] of plants) {
          // Stem
          ctx.strokeStyle = '#3a7a20'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(px+bx, py+by+8); ctx.lineTo(px+bx, py+by-1); ctx.stroke();
          // Lower leaves
          ctx.fillStyle = '#4a9a30';
          ctx.beginPath(); ctx.ellipse(px+bx-4, py+by+2, 4, 2.5, -0.6, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+bx+4, py+by+3, 4, 2.5,  0.6, 0, Math.PI*2); ctx.fill();
          // Upper leaves
          ctx.fillStyle = '#6acd40';
          ctx.beginPath(); ctx.ellipse(px+bx-3, py+by-1, 3.5, 2, -0.4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+bx+3, py+by,   3.5, 2,  0.4, 0, Math.PI*2); ctx.fill();
          // Top highlight
          ctx.fillStyle = '#90e050';
          ctx.beginPath(); ctx.ellipse(px+bx, py+by-2, 3, 2, 0, 0, Math.PI*2); ctx.fill();
        }
      }
      return;
    }

    // ── Farm berry bush (on soil) ──────────────────────────────────────────
    if (tile === TILES.FARM_BERRY_BUSH || tile === TILES.FARM_BERRY_EMPTY) {
      const T = TILE_SIZE;
      // Soil base
      ctx.fillStyle = '#6b4e2a';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 3 + i * 7, T, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 5 + i * 7, T, 1);
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(px+16, py+27, 10, 4, 0, 0, Math.PI*2); ctx.fill();
      // Bush lobes
      const lobes = [
        { x: px+11, y: py+17, r: 8 },
        { x: px+21, y: py+16, r: 7 },
        { x: px+16, y: py+11, r: 7 },
      ];
      const isFull = tile === TILES.FARM_BERRY_BUSH;
      for (const lobe of lobes) {
        ctx.fillStyle = isFull
          ? `rgb(${38+(s1%12)},${100+(s2%18)},${28+(s3%10)})`
          : `rgb(${28+(s1%10)},${80+(s2%14)},${22+(s3%8)})`;
        ctx.beginPath(); ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI*2); ctx.fill();
      }
      // Highlight
      ctx.fillStyle = isFull ? 'rgba(120,200,60,0.30)' : 'rgba(80,160,30,0.20)';
      ctx.beginPath(); ctx.arc(px+14, py+9, 4, 0, Math.PI*2); ctx.fill();
      // Berries (only when full)
      if (isFull) {
        const berryPos = [[px+10,py+18],[px+19,py+15],[px+16,py+21],[px+22,py+20],[px+13,py+13]];
        for (let i = 0; i < berryPos.length; i++) {
          const [bx, by] = berryPos[i];
          ctx.fillStyle = (i + s1) % 3 === 0 ? '#c0203a' : '#8b1a3a';
          ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(255,180,180,0.5)';
          ctx.beginPath(); ctx.arc(bx-0.5, by-0.5, 0.8, 0, Math.PI*2); ctx.fill();
        }
      }
      return;
    }

    // ── Farm crop ready tiles (unique per seed type) ────────────────────────
    if (tile === TILES.FARM_POTATO_READY || tile === TILES.FARM_BERRIES_READY ||
        tile === TILES.FARM_HERB_READY || tile === TILES.FARM_FLAX_READY ||
        tile === TILES.FARM_MAGIC_READY) {
      const T = TILE_SIZE;
      // Soil base (shared)
      ctx.fillStyle = '#6b4e2a';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 3 + i * 7, T, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let i = 0; i < 4; i++) ctx.fillRect(px, py + 5 + i * 7, T, 1);

      if (tile === TILES.FARM_POTATO_READY) {
        // Bushy green top with visible potato lumps in soil
        const plants = [[8,14],[20,12],[14,20],[26,18]];
        for (const [bx, by] of plants) {
          // Leafy top
          ctx.fillStyle = '#4a9a30';
          ctx.beginPath(); ctx.ellipse(px+bx, py+by-3, 4, 3, 0.3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#6acd40';
          ctx.beginPath(); ctx.ellipse(px+bx-1, py+by-4, 3, 2, -0.2, 0, Math.PI*2); ctx.fill();
          // Stem
          ctx.strokeStyle = '#3a7a20'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(px+bx, py+by+4); ctx.lineTo(px+bx, py+by-1); ctx.stroke();
          // Potato lumps poking out of soil
          ctx.fillStyle = '#c8a050';
          ctx.beginPath(); ctx.ellipse(px+bx+2, py+by+5, 3, 2, 0.4, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#b89040';
          ctx.beginPath(); ctx.ellipse(px+bx-2, py+by+6, 2.5, 1.5, -0.3, 0, Math.PI*2); ctx.fill();
        }
      } else if (tile === TILES.FARM_BERRIES_READY) {
        // Small berry plants with red/purple berries (not a full bush)
        const plants = [[8,18],[18,14],[28,20],[14,24]];
        for (const [bx, by] of plants) {
          // Small leafy cluster
          ctx.fillStyle = '#3a8a28';
          ctx.beginPath(); ctx.ellipse(px+bx, py+by-2, 4, 3, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#5aaa40';
          ctx.beginPath(); ctx.ellipse(px+bx-2, py+by-3, 3, 2, -0.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+bx+2, py+by-2, 3, 2, 0.5, 0, Math.PI*2); ctx.fill();
          // Stem
          ctx.strokeStyle = '#2a6a18'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px+bx, py+by+4); ctx.lineTo(px+bx, py+by); ctx.stroke();
          // Berries
          ctx.fillStyle = '#c0203a';
          ctx.beginPath(); ctx.arc(px+bx-1, py+by-1, 1.8, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#8b1a3a';
          ctx.beginPath(); ctx.arc(px+bx+2, py+by, 1.8, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#c0203a';
          ctx.beginPath(); ctx.arc(px+bx, py+by-4, 1.5, 0, Math.PI*2); ctx.fill();
        }
      } else if (tile === TILES.FARM_HERB_READY) {
        // Leafy herb stems radiating from base (matches WILD_HERB style)
        const plants = [[8,22],[18,16],[28,20],[12,10]];
        for (const [bx, by] of plants) {
          const stemCount = 3 + (s1 % 2);
          for (let i = 0; i < stemCount; i++) {
            const angle = (i / stemCount) * Math.PI - Math.PI * 0.1;
            const len = 6 + (s3 % 3);
            const ex = px + bx + Math.sin(angle) * len;
            const ey = py + by - Math.cos(angle) * len;
            ctx.strokeStyle = '#2a7a18'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px+bx, py+by); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.fillStyle = '#4aaa34';
            ctx.beginPath(); ctx.ellipse(ex, ey, 3, 1.8, angle, 0, Math.PI*2); ctx.fill();
          }
          // Small flower bud
          if ((bx + s2) % 3 === 0) {
            ctx.fillStyle = '#e8c030';
            ctx.beginPath(); ctx.arc(px+bx, py+by-6, 1.5, 0, Math.PI*2); ctx.fill();
          }
        }
      } else if (tile === TILES.FARM_FLAX_READY) {
        // Tall thin stalks with blue-purple flowers (matches FLAX_PLANT style)
        const stalks = [[6,26],[13,24],[20,26],[27,24],[10,22],[24,22]];
        for (let i = 0; i < stalks.length; i++) {
          const [sx, sy] = stalks[i];
          const lean = ((i + s2) % 3 - 1) * 1.5;
          const h = 14 + (s3 % 4);
          // Stem
          ctx.strokeStyle = '#5a8a30'; ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(px+sx, py+sy);
          ctx.quadraticCurveTo(px+sx+lean, py+sy-h*0.6, px+sx+lean*1.3, py+sy-h);
          ctx.stroke();
          // Leaf
          if (i % 2 === 0) {
            ctx.fillStyle = '#4a7a28';
            ctx.beginPath();
            ctx.ellipse(px+sx+lean*0.5, py+sy-h*0.45, 3, 1.5, 0.5, 0, Math.PI*2);
            ctx.fill();
          }
          // Flower
          const fc = (i + s1) % 3;
          ctx.fillStyle = fc === 0 ? '#6a60d0' : fc === 1 ? '#8060c8' : '#5050b8';
          ctx.beginPath(); ctx.arc(px+sx+lean*1.3, py+sy-h, 2.5, 0, Math.PI*2); ctx.fill();
        }
      } else if (tile === TILES.FARM_MAGIC_READY) {
        // Glowing mystical plant with ethereal leaves
        const plants = [[8,20],[20,14],[14,22],[26,18]];
        for (const [bx, by] of plants) {
          // Glow aura
          ctx.fillStyle = 'rgba(100,200,255,0.15)';
          ctx.beginPath(); ctx.arc(px+bx, py+by-2, 7, 0, Math.PI*2); ctx.fill();
          // Stem
          ctx.strokeStyle = '#2a6a5a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(px+bx, py+by+5); ctx.lineTo(px+bx, py+by-3); ctx.stroke();
          // Leaves — teal/cyan
          ctx.fillStyle = '#30a8a0';
          ctx.beginPath(); ctx.ellipse(px+bx-3, py+by-1, 3.5, 2, -0.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+bx+3, py+by, 3.5, 2, 0.5, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#50d0c0';
          ctx.beginPath(); ctx.ellipse(px+bx, py+by-4, 3, 2, 0, 0, Math.PI*2); ctx.fill();
          // Sparkle
          ctx.fillStyle = 'rgba(200,240,255,0.7)';
          ctx.beginPath(); ctx.arc(px+bx+1, py+by-5, 1.2, 0, Math.PI*2); ctx.fill();
        }
      }
      return;
    }

    // ── FURN_CAULDRON — iron cauldron on tripod over embers ────────────────
    if (tile === TILES.FURN_CAULDRON) {
      // Embers glow beneath
      ctx.fillStyle = 'rgba(200,80,20,0.25)'; ctx.fillRect(px + 8, py + 24, 16, 6);
      ctx.fillStyle = 'rgba(255,120,30,0.15)'; ctx.fillRect(px + 10, py + 25, 12, 4);
      // Tripod legs (3 iron legs)
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px + 6, py + 12, 2, 18);  // left
      ctx.fillRect(px + 24, py + 12, 2, 18); // right
      ctx.fillRect(px + 15, py + 10, 2, 20); // back
      // Cauldron body (wide rounded pot)
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(px + 7, py + 8, 18, 14);
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 8, py + 7, 16, 14);
      // Rim
      ctx.fillStyle = '#4a4a4a'; ctx.fillRect(px + 7, py + 6, 18, 2);
      // Liquid inside (dark stew)
      ctx.fillStyle = '#3a2a10'; ctx.fillRect(px + 9, py + 8, 14, 4);
      // Steam wisps
      ctx.fillStyle = 'rgba(200,200,200,0.2)';
      ctx.fillRect(px + 12, py + 2, 2, 4);
      ctx.fillRect(px + 17, py + 3, 2, 3);
      // Handle
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(px + 6, py + 8, 2, 2);
      ctx.fillRect(px + 24, py + 8, 2, 2);
      return;
    }

    // ── FURN_CANDELABRA — standing iron candle holder ────────────────────
    if (tile === TILES.FURN_CANDELABRA) {
      const t = this.time;
      // Circular base plate
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 10, py + 26, 12, 4);
      ctx.fillStyle = '#4a4a4a'; ctx.fillRect(px + 11, py + 27, 10, 2);
      // Central stem
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 15, py + 8, 2, 18);
      // Left arm + candle
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 8, py + 10, 7, 2);
      ctx.fillStyle = '#e8d8a0'; ctx.fillRect(px + 8, py + 5, 3, 5);
      // Right arm + candle
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 17, py + 10, 7, 2);
      ctx.fillStyle = '#e8d8a0'; ctx.fillRect(px + 21, py + 5, 3, 5);
      // Centre candle (taller)
      ctx.fillStyle = '#e8d8a0'; ctx.fillRect(px + 14, py + 3, 4, 6);

      // Animated flames — each candle flickers independently
      // Left flame
      const lh = 3 + Math.sin(t * 11 + 1.0) * 1.5;
      const lx = Math.sin(t * 8 + 2.0) * 0.5;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(px + 8.5 + lx, py + 5 - lh);
      ctx.lineTo(px + 8, py + 5);
      ctx.lineTo(px + 11, py + 5);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 9, py + 5 - lh + 1, 1, 1);

      // Right flame
      const rh = 3 + Math.sin(t * 12 + 3.5) * 1.5;
      const rx = Math.sin(t * 9 + 5.0) * 0.5;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(px + 22.5 + rx, py + 5 - rh);
      ctx.lineTo(px + 21, py + 5);
      ctx.lineTo(px + 24, py + 5);
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 22, py + 5 - rh + 1, 1, 1);

      // Centre flame (taller)
      const ch = 4 + Math.sin(t * 10) * 2;
      const cx2 = Math.sin(t * 7 + 1.0) * 0.7;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(px + 16 + cx2, py + 3 - ch);
      ctx.lineTo(px + 14, py + 3);
      ctx.lineTo(px + 18, py + 3);
      ctx.fill();
      ctx.fillStyle = '#fff8e0';
      ctx.fillRect(px + 15, py + 3 - ch + 1, 2, 2);

      // Warm glow (pulses slightly)
      const glow = 0.06 + Math.sin(t * 6) * 0.03;
      ctx.fillStyle = `rgba(255,200,60,${glow.toFixed(3)})`;
      ctx.fillRect(px + 2, py - 2, 28, 24);
      return;
    }

    // FURN_TAPESTRY and FURN_WARDROBE are rendered via FURN_SET → _drawFurnitureSprite

    // ── FURN_HAY_BALE — stacked dried hay ───────────────────────────────
    if (tile === TILES.FURN_HAY_BALE) {
      // Bale body (rectangular bundle)
      ctx.fillStyle = '#b8a040'; ctx.fillRect(px + 3, py + 10, 26, 18);
      // Highlight strands
      ctx.fillStyle = '#d0b850';
      ctx.fillRect(px + 5, py + 12, 8, 2);
      ctx.fillRect(px + 16, py + 14, 10, 2);
      ctx.fillRect(px + 6, py + 18, 12, 2);
      ctx.fillRect(px + 20, py + 20, 6, 2);
      ctx.fillRect(px + 4, py + 23, 9, 2);
      // Dark strands
      ctx.fillStyle = '#9a8030';
      ctx.fillRect(px + 10, py + 16, 6, 1);
      ctx.fillRect(px + 18, py + 22, 8, 1);
      // Binding twine
      ctx.fillStyle = '#6a4a20';
      ctx.fillRect(px + 3, py + 16, 26, 1);
      ctx.fillRect(px + 3, py + 22, 26, 1);
      // Top surface (lighter)
      ctx.fillStyle = '#c8b048'; ctx.fillRect(px + 4, py + 10, 24, 3);
      // Wisps poking out
      ctx.fillStyle = '#d0b850';
      ctx.fillRect(px + 2, py + 14, 2, 4);
      ctx.fillRect(px + 28, py + 18, 2, 3);
      return;
    }

    // ── FURN_SCARECROW — straw-stuffed scare figure ─────────────────────
    if (tile === TILES.FURN_SCARECROW) {
      // Stake (vertical pole)
      ctx.fillStyle = '#5a3a18'; ctx.fillRect(px + 14, py + 8, 4, 22);
      // Crossbar (arms)
      ctx.fillStyle = '#5a3a18'; ctx.fillRect(px + 5, py + 12, 22, 3);
      // Head (burlap sack)
      ctx.fillStyle = '#b8a060'; ctx.fillRect(px + 11, py + 2, 10, 8);
      ctx.fillStyle = '#a89050'; ctx.fillRect(px + 12, py + 3, 8, 6);
      // Eyes (button eyes)
      ctx.fillStyle = '#222';
      ctx.fillRect(px + 13, py + 4, 2, 2);
      ctx.fillRect(px + 17, py + 4, 2, 2);
      // Mouth
      ctx.fillStyle = '#222'; ctx.fillRect(px + 14, py + 7, 4, 1);
      // Hat (floppy brim)
      ctx.fillStyle = '#4a3018'; ctx.fillRect(px + 9, py + 1, 14, 3);
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(px + 12, py - 1, 8, 3);
      // Shirt / torso
      ctx.fillStyle = '#6a8a4a'; ctx.fillRect(px + 12, py + 10, 8, 8);
      // Straw poking from sleeves
      ctx.fillStyle = '#d0b850';
      ctx.fillRect(px + 4, py + 11, 3, 2);
      ctx.fillRect(px + 25, py + 11, 3, 2);
      ctx.fillRect(px + 3, py + 13, 2, 2);
      ctx.fillRect(px + 27, py + 13, 2, 2);
      // Straw at bottom
      ctx.fillStyle = '#d0b850';
      ctx.fillRect(px + 12, py + 18, 2, 4);
      ctx.fillRect(px + 16, py + 18, 2, 5);
      ctx.fillRect(px + 19, py + 18, 2, 3);
      return;
    }

    // ── GARDEN BOULDER ─────────────────────────────────────────────────
    if (tile === TILES.FURN_GARDEN_ROCK) {
      const s1 = (c * 7  + r * 13) % 17;
      const s2 = (c * 11 + r * 7)  % 19;
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 6, py + 25, 20, 3);
      // Main boulder body
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(px + 5,  py + 11, 22, 15);
      ctx.fillRect(px + 7,  py + 9,  18, 2);
      ctx.fillRect(px + 9,  py + 7,  14, 2);
      // Top lit face
      ctx.fillStyle = '#8a8a8a';
      ctx.fillRect(px + 7,  py + 9,  18, 3);
      ctx.fillRect(px + 9,  py + 7,  14, 2);
      ctx.fillRect(px + 5,  py + 11, 4,  4);   // left cheek sheen
      // Mid-tone speckles (moss / weathering)
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(px + 10 + (s1 % 8),  py + 13 + (s2 % 4), 3, 2);
      ctx.fillRect(px + 15 + (s2 % 6),  py + 18 + (s1 % 3), 4, 2);
      // Dark undercut
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px + 5,  py + 23, 22, 2);
      ctx.fillRect(px + 7,  py + 24, 18, 2);
      // Moss patches on top
      ctx.fillStyle = '#4a7a28';
      ctx.fillRect(px + 12, py + 9, 3, 1);
      ctx.fillRect(px + 20, py + 11, 3, 1);
      ctx.fillStyle = '#6a9a38';
      ctx.fillRect(px + 13, py + 9, 1, 1);
      return;
    }

    // ── POND WATER (animated) ──────────────────────────────────────────
    if (tile === TILES.FURN_POND_WATER) {
      // Look up neighbour pond tiles so adjacent placements merge into a
      // seamless body of water instead of tiling visibly.
      const _isPond = (dc, dr) =>
        world && world.getTile(c + dc, r + dr) === TILES.FURN_POND_WATER;
      const pN = _isPond(0, -1), pS = _isPond(0, 1);
      const pE = _isPond(1, 0),  pW = _isPond(-1, 0);

      // Base water fill
      ctx.fillStyle = '#2d68a0';
      ctx.fillRect(px, py, 32, 32);
      // Slight depth gradient (darker near bottom)
      ctx.fillStyle = '#265a90';
      ctx.fillRect(px, py + 22, 32, 10);

      // Stony rim around exposed edges (where there's no neighbour pond)
      ctx.fillStyle = '#5a5a5a';
      if (!pN) ctx.fillRect(px,      py,      32, 3);
      if (!pS) ctx.fillRect(px,      py + 29, 32, 3);
      if (!pW) ctx.fillRect(px,      py,      3,  32);
      if (!pE) ctx.fillRect(px + 29, py,      3,  32);
      // Rim highlight / shadow
      ctx.fillStyle = '#8a8a8a';
      if (!pN) ctx.fillRect(px + 1,  py + 1,  30, 1);
      if (!pW) ctx.fillRect(px + 1,  py + 1,  1,  30);
      ctx.fillStyle = '#3a3a3a';
      if (!pS) ctx.fillRect(px,      py + 31, 32, 1);
      if (!pE) ctx.fillRect(px + 31, py,      1,  32);

      // Animated ripples — sine-phased per-tile so they shimmer
      const t = this.time;
      const phase = (c + r) * 0.7;
      const rip1 = 0.5 + 0.5 * Math.sin(t * 2 + phase);
      const rip2 = 0.5 + 0.5 * Math.sin(t * 2.7 + phase + 1.3);
      ctx.fillStyle = `rgba(150,200,240,${0.15 + 0.15 * rip1})`;
      ctx.fillRect(px + 6,  py + 10, 12, 1);
      ctx.fillRect(px + 16, py + 18, 10, 1);
      ctx.fillStyle = `rgba(200,230,255,${0.10 + 0.12 * rip2})`;
      ctx.fillRect(px + 10, py + 14, 8,  1);
      ctx.fillRect(px + 4,  py + 22, 6,  1);
      // Lily pad (visible on some tiles via seed)
      const s1 = (c * 13 + r * 11) % 23;
      if (s1 === 0 || s1 === 7) {
        ctx.fillStyle = '#2e5a22';
        ctx.fillRect(px + 12, py + 12, 6, 4);
        ctx.fillStyle = '#4a8a3a';
        ctx.fillRect(px + 13, py + 12, 4, 1);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(px + 14, py + 13, 2, 2);  // lily flower
      }
      return;
    }

    // ── TRAIL: DIRT (packed earth path) ────────────────────────────────
    if (tile === TILES.FURN_TRAIL_DIRT) {
      const s1 = (c * 7  + r * 13) % 17;
      const s2 = (c * 11 + r * 7)  % 19;
      const s3 = (c * 13 + r * 11) % 23;
      // Base
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(px, py, 32, 32);
      // Lighter sandy streaks
      ctx.fillStyle = '#a08668';
      ctx.fillRect(px + 2 + (s1 % 8), py + 4 + (s2 % 4), 16, 2);
      ctx.fillRect(px + 6 + (s2 % 6), py + 18 + (s1 % 4), 20, 2);
      // Darker tread marks
      ctx.fillStyle = '#6a5840';
      ctx.fillRect(px + 4 + (s3 % 6), py + 10, 3, 1);
      ctx.fillRect(px + 14 + (s1 % 8), py + 24, 4, 1);
      // Specks of pebble
      ctx.fillStyle = '#5a4a38';
      ctx.fillRect(px + 8  + (s2 % 14), py + 8  + (s1 % 8), 1, 1);
      ctx.fillRect(px + 20 + (s3 % 8),  py + 14 + (s2 % 10), 1, 1);
      ctx.fillRect(px + 5  + (s1 % 18), py + 26 + (s3 % 4),  1, 1);
      return;
    }

    // ── TRAIL: STONE COBBLE ────────────────────────────────────────────
    if (tile === TILES.FURN_TRAIL_STONE) {
      const s1 = (c * 7  + r * 13) % 17;
      const s2 = (c * 11 + r * 7)  % 19;
      // Dark grout base
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px, py, 32, 32);
      // Irregular cobbles — 4 per tile in a rough 2x2 grid with jitter
      const stones = [
        [ 1 + (s1 % 3),  1 + (s2 % 2),  14 + (s1 % 3), 14 ],
        [17 + (s2 % 2),  1 + (s1 % 3),  14,            14 + (s2 % 3) ],
        [ 1 + (s2 % 3), 17 + (s1 % 3),  14 + (s2 % 3), 14 ],
        [17 + (s1 % 2), 17 + (s2 % 2),  14,            14 + (s1 % 3) ],
      ];
      for (const [sx, sy, sw, sh] of stones) {
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(px + sx, py + sy, sw, sh);
        ctx.fillStyle = '#8a8a8a';                    // top sheen
        ctx.fillRect(px + sx, py + sy, sw, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';     // highlight
        ctx.fillRect(px + sx + 1, py + sy + 1, 3, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';           // inner shadow bottom
        ctx.fillRect(px + sx, py + sy + sh - 1, sw, 1);
      }
      return;
    }

    // ── TRAIL: GRAVEL ──────────────────────────────────────────────────
    if (tile === TILES.FURN_TRAIL_GRAVEL) {
      const s1 = (c * 7  + r * 13) % 17;
      const s2 = (c * 11 + r * 7)  % 19;
      const s3 = (c * 13 + r * 11) % 23;
      // Base
      ctx.fillStyle = '#908880';
      ctx.fillRect(px, py, 32, 32);
      // Lighter specks (sandy flecks)
      ctx.fillStyle = '#b0a898';
      for (let i = 0; i < 14; i++) {
        const x = (s1 + i * 7)  % 32;
        const y = (s2 + i * 11) % 32;
        ctx.fillRect(px + x, py + y, 2, 2);
      }
      // Darker pebbles
      ctx.fillStyle = '#605850';
      for (let i = 0; i < 10; i++) {
        const x = (s3 + i * 13) % 32;
        const y = (s1 + i * 5)  % 32;
        ctx.fillRect(px + x, py + y, 2, 2);
      }
      // Tiny highlights on some pebbles
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < 6; i++) {
        const x = (s2 + i * 9)  % 32;
        const y = (s3 + i * 17) % 32;
        ctx.fillRect(px + x, py + y, 1, 1);
      }
      return;
    }

    // ── TRAIL: FLAGSTONE ───────────────────────────────────────────────
    if (tile === TILES.FURN_TRAIL_FLAGSTONE) {
      // Base grout (dark)
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(px, py, 32, 32);
      // Two large interlocking slabs per tile
      ctx.fillStyle = '#8a8070';
      ctx.fillRect(px + 1,  py + 1,  18, 14);
      ctx.fillRect(px + 20, py + 1,  11, 18);
      ctx.fillRect(px + 1,  py + 16, 11, 15);
      ctx.fillRect(px + 13, py + 20, 18, 11);
      // Top sheen on each slab
      ctx.fillStyle = '#9a9080';
      ctx.fillRect(px + 1,  py + 1,  18, 2);
      ctx.fillRect(px + 20, py + 1,  11, 2);
      ctx.fillRect(px + 1,  py + 16, 11, 2);
      ctx.fillRect(px + 13, py + 20, 18, 2);
      // Bottom shadow line
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(px + 1,  py + 14, 18, 1);
      ctx.fillRect(px + 20, py + 18, 11, 1);
      ctx.fillRect(px + 1,  py + 30, 11, 1);
      ctx.fillRect(px + 13, py + 30, 18, 1);
      // Subtle stone grain — one per slab
      ctx.fillStyle = 'rgba(90,70,50,0.22)';
      ctx.fillRect(px + 4,  py + 7,  10, 1);
      ctx.fillRect(px + 22, py + 8,  6,  1);
      ctx.fillRect(px + 4,  py + 23, 6,  1);
      ctx.fillRect(px + 18, py + 25, 10, 1);
      return;
    }

    // ── FISH TANK (animated) ───────────────────────────────────────────
    if (tile === TILES.FURN_FISH_TANK) {
      // Wooden stand
      ctx.fillStyle = '#3a1f08'; ctx.fillRect(px + 2,  py + 26, 28, 5);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(px + 3,  py + 27, 26, 2);
      ctx.fillStyle = '#2a1404'; ctx.fillRect(px + 2,  py + 30, 28, 1);
      // Glass frame
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(px + 3,  py + 3,  26, 24);
      // Water
      ctx.fillStyle = '#2a6090'; ctx.fillRect(px + 4,  py + 4,  24, 22);
      ctx.fillStyle = '#356fa8'; ctx.fillRect(px + 4,  py + 4,  24, 12);
      // Water surface highlight
      ctx.fillStyle = 'rgba(180,220,255,0.35)'; ctx.fillRect(px + 4, py + 4,  24, 2);
      // Sand floor with pebbles
      ctx.fillStyle = '#a89868'; ctx.fillRect(px + 4,  py + 22, 24, 4);
      ctx.fillStyle = '#8a7848'; ctx.fillRect(px + 4,  py + 25, 24, 1);
      ctx.fillStyle = '#606060';
      ctx.fillRect(px + 8,  py + 23, 2, 2); ctx.fillRect(px + 16, py + 24, 2, 1);
      ctx.fillRect(px + 22, py + 23, 3, 2);
      // Seaweed swaying with time
      const swA = Math.sin(this.time * 1.6) * 1;
      const swB = Math.sin(this.time * 2.1 + 1) * 1;
      ctx.fillStyle = '#2e7a32';
      ctx.fillRect(px + 7 + swA, py + 16, 1, 7);
      ctx.fillRect(px + 8 + swA, py + 14, 1, 9);
      ctx.fillRect(px + 23 + swB, py + 18, 1, 5);
      ctx.fillRect(px + 24 + swB, py + 15, 1, 8);
      // Two fish swimming, one orange one blue, bobbing in opposite phase
      const fxA = Math.floor(((this.time * 6) % 20) - 10);     // -10..+10
      const fxB = Math.floor(((this.time * 5 + 2) % 20) - 10);
      const fyA = Math.round(Math.sin(this.time * 3) * 1);
      const fyB = Math.round(Math.sin(this.time * 2.4 + 2) * 1);
      // Fish A — orange, moving east
      const axA = px + 16 + fxA, ayA = py + 10 + fyA;
      ctx.fillStyle = '#e27a20';
      ctx.fillRect(axA - 3, ayA, 5, 3);
      ctx.fillRect(axA - 4, ayA, 1, 1);    // tail fork upper
      ctx.fillRect(axA - 4, ayA + 2, 1, 1);// tail fork lower
      ctx.fillStyle = '#f0a040'; ctx.fillRect(axA - 2, ayA, 3, 1);
      ctx.fillStyle = '#1a0804'; ctx.fillRect(axA + 1, ayA, 1, 1); // eye
      // Fish B — blue, moving west
      const axB = px + 16 + fxB, ayB = py + 17 + fyB;
      ctx.fillStyle = '#3a7ac4';
      ctx.fillRect(axB, ayB, 5, 3);
      ctx.fillRect(axB + 5, ayB, 1, 1);
      ctx.fillRect(axB + 5, ayB + 2, 1, 1);
      ctx.fillStyle = '#6aa0e0'; ctx.fillRect(axB + 1, ayB, 3, 1);
      ctx.fillStyle = '#1a0804'; ctx.fillRect(axB, ayB, 1, 1);
      // Bubbles drifting up
      const bTime = this.time * 1.5;
      for (let i = 0; i < 3; i++) {
        const by = py + 25 - ((bTime * 10 + i * 7) % 20);
        const bx = px + 10 + i * 6;
        ctx.fillStyle = 'rgba(230,240,255,0.5)';
        ctx.fillRect(bx, by, 1, 1);
      }
      // Glass frame top (solid black ring on top)
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px + 3, py + 3, 26, 1);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px + 3, py + 3, 1, 23);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px + 28, py + 3, 1, 23);
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(px + 4, py + 4, 1, 1); // corner sheen
      return;
    }

    // ── ALCHEMY TABLE ──────────────────────────────────────────────────
    if (tile === TILES.FURN_ALCHEMY_TABLE) {
      // Wooden bench
      ctx.fillStyle = '#2a1408'; ctx.fillRect(px + 2,  py + 16, 28, 14);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(px + 3,  py + 17, 26, 11);
      ctx.fillStyle = '#7a4820'; ctx.fillRect(px + 3,  py + 17, 26, 1);
      ctx.fillStyle = '#2a1408'; ctx.fillRect(px + 3,  py + 28, 26, 1);
      // Legs
      ctx.fillStyle = '#2a1408'; ctx.fillRect(px + 3, py + 26, 3, 5);
      ctx.fillRect(px + 26, py + 26, 3, 5);
      // Mortar and pestle (left)
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(px + 4,  py + 12, 7, 5);
      ctx.fillStyle = '#8a8a8a'; ctx.fillRect(px + 5,  py + 12, 5, 2);
      ctx.fillStyle = '#4a4a4a'; ctx.fillRect(px + 5,  py + 15, 5, 1);
      ctx.fillStyle = '#8a6818'; ctx.fillRect(px + 7,  py + 8,  2, 5);  // pestle
      // Bubbling alembic (centre) — flame animated
      ctx.fillStyle = '#8a8a9a'; ctx.fillRect(px + 13, py + 10, 7, 7);  // base sphere
      ctx.fillStyle = '#aaaabc'; ctx.fillRect(px + 14, py + 10, 5, 2);
      ctx.fillStyle = '#5a8a38'; ctx.fillRect(px + 15, py + 12, 3, 3);  // green potion
      ctx.fillStyle = '#8acc48'; ctx.fillRect(px + 15, py + 12, 1, 1);
      ctx.fillStyle = '#8a8a9a'; ctx.fillRect(px + 15, py + 6,  3, 4);  // neck
      ctx.fillStyle = '#aaaabc'; ctx.fillRect(px + 16, py + 6,  1, 4);
      // Bubbles from potion top
      const bubT = this.time * 2;
      for (let i = 0; i < 3; i++) {
        const by = py + 12 - ((bubT * 3 + i * 4) % 8);
        ctx.fillStyle = 'rgba(140,220,120,0.6)';
        ctx.fillRect(px + 15 + (i % 2), by, 1, 1);
      }
      // Flame under alembic (flicker)
      const fl = Math.sin(this.time * 10) * 0.5 + 0.5;
      ctx.fillStyle = '#e06020'; ctx.fillRect(px + 14, py + 17, 5, 2);
      ctx.fillStyle = '#f8c040'; ctx.fillRect(px + 15, py + 17, 3, 1 + Math.round(fl));
      // Bottles on the right
      ctx.fillStyle = '#8a1818'; ctx.fillRect(px + 22, py + 11, 3, 6);  // red bottle
      ctx.fillStyle = '#c02020'; ctx.fillRect(px + 23, py + 12, 1, 4);
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(px + 22, py + 10, 3, 1);  // cork
      ctx.fillStyle = '#2a4898'; ctx.fillRect(px + 26, py + 13, 3, 4);  // blue bottle
      ctx.fillStyle = '#4a78c8'; ctx.fillRect(px + 27, py + 14, 1, 2);
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(px + 26, py + 12, 3, 1);
      return;
    }

    // ── ARCHERY TARGET ─────────────────────────────────────────────────
    if (tile === TILES.FURN_ARCHERY_TARGET) {
      // Wooden tripod stand (lower)
      ctx.fillStyle = '#3a2008';
      ctx.fillRect(px + 8,  py + 22, 3, 9);
      ctx.fillRect(px + 21, py + 22, 3, 9);
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(px + 6, py + 30, 20, 1);
      // Target body — concentric rings centred at (px+16, py+14)
      const cx = px + 16, cy = py + 14;
      // Outermost straw ring
      ctx.fillStyle = '#d8c890';
      ctx.fillRect(cx - 10, cy - 8, 20, 16);
      ctx.fillRect(cx - 12, cy - 6, 24, 12);
      ctx.fillRect(cx - 11, cy - 7, 22, 14);
      // Straw texture — little flecks
      ctx.fillStyle = '#b8a868';
      ctx.fillRect(cx - 9, cy - 5, 1, 2);
      ctx.fillRect(cx + 6, cy + 2, 1, 2);
      ctx.fillRect(cx - 4, cy + 4, 1, 1);
      // Blue ring
      ctx.fillStyle = '#2a6a9a';
      ctx.fillRect(cx - 8, cy - 6, 16, 12);
      ctx.fillRect(cx - 9, cy - 5, 18, 10);
      // Red ring
      ctx.fillStyle = '#b8301c';
      ctx.fillRect(cx - 6, cy - 4, 12, 8);
      ctx.fillRect(cx - 7, cy - 3, 14, 6);
      // Yellow centre
      ctx.fillStyle = '#e8c030';
      ctx.fillRect(cx - 4, cy - 2, 8, 4);
      ctx.fillRect(cx - 5, cy - 1, 10, 2);
      // Bullseye
      ctx.fillStyle = '#8a3010';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      // Arrow stuck in target (red fletching)
      ctx.fillStyle = '#3a2008'; ctx.fillRect(cx + 2, cy - 6, 1, 8);  // shaft
      ctx.fillStyle = '#6a4018'; ctx.fillRect(cx + 2, cy - 6, 1, 1);  // arrowhead
      ctx.fillStyle = '#c02020'; ctx.fillRect(cx + 3, cy - 6, 2, 2);  // fletching
      ctx.fillStyle = '#e04040'; ctx.fillRect(cx + 3, cy - 6, 1, 1);
      return;
    }

    // ── WINE CASK ──────────────────────────────────────────────────────
    if (tile === TILES.FURN_WINE_CASK) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(px + 6, py + 30, 20, 1);
      // Cask body (barrel on its side)
      ctx.fillStyle = '#3a1808'; ctx.fillRect(px + 4,  py + 10, 24, 20);
      ctx.fillStyle = '#6a3818'; ctx.fillRect(px + 5,  py + 11, 22, 18);
      ctx.fillStyle = '#8a5028'; ctx.fillRect(px + 5,  py + 12, 22, 2);   // top stave sheen
      ctx.fillStyle = '#4a2008'; ctx.fillRect(px + 5,  py + 27, 22, 1);   // bottom shadow
      // Vertical stave seams
      ctx.fillStyle = '#4a2008';
      ctx.fillRect(px + 10, py + 11, 1, 18);
      ctx.fillRect(px + 15, py + 11, 1, 18);
      ctx.fillRect(px + 21, py + 11, 1, 18);
      // Iron hoops
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(px + 4, py + 13, 24, 2);
      ctx.fillRect(px + 4, py + 25, 24, 2);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(px + 4, py + 13, 24, 1);
      ctx.fillRect(px + 4, py + 25, 24, 1);
      // Brass tap
      ctx.fillStyle = '#c8a227'; ctx.fillRect(px + 14, py + 20, 4, 3);
      ctx.fillStyle = '#f1cc40'; ctx.fillRect(px + 14, py + 20, 4, 1);
      ctx.fillStyle = '#8a6018'; ctx.fillRect(px + 15, py + 23, 2, 2);
      // Wine puddle drip
      ctx.fillStyle = '#6a1a1a'; ctx.fillRect(px + 15, py + 27, 2, 1);
      ctx.fillStyle = '#8a2020'; ctx.fillRect(px + 14, py + 28, 4, 1);
      // Wood-cap end (left) — shows end-grain
      ctx.fillStyle = '#5a2808'; ctx.fillRect(px + 4, py + 10, 2, 20);
      ctx.fillStyle = '#8a5028'; ctx.fillRect(px + 4, py + 10, 1, 20);
      return;
    }

    // ── LOOM ───────────────────────────────────────────────────────────
    if (tile === TILES.FURN_LOOM) {
      // Wooden frame posts
      ctx.fillStyle = '#3a2008';
      ctx.fillRect(px + 4,  py + 4,  4, 26);
      ctx.fillRect(px + 24, py + 4,  4, 26);
      ctx.fillStyle = '#5a3418';
      ctx.fillRect(px + 5,  py + 4,  2, 26);
      ctx.fillRect(px + 25, py + 4,  2, 26);
      // Top crossbar
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 4, py + 4, 24, 4);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(px + 4, py + 4, 24, 2);
      // Bottom beam
      ctx.fillStyle = '#3a2008'; ctx.fillRect(px + 4, py + 26, 24, 4);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(px + 4, py + 26, 24, 2);
      // Warp threads (vertical)
      ctx.fillStyle = '#e8dcb0';
      for (let i = 0; i < 8; i++) {
        ctx.fillRect(px + 9 + i * 2, py + 8, 1, 18);
      }
      // Weft rows (horizontal) — partial weave at bottom
      ctx.fillStyle = '#b8a070';
      ctx.fillRect(px + 9,  py + 22, 15, 1);
      ctx.fillRect(px + 9,  py + 24, 15, 1);
      ctx.fillStyle = '#8a7848';
      ctx.fillRect(px + 9,  py + 23, 15, 1);
      ctx.fillRect(px + 9,  py + 25, 15, 1);
      // Shuttle mid-row
      ctx.fillStyle = '#8a4820'; ctx.fillRect(px + 14, py + 15, 6, 2);
      ctx.fillStyle = '#a06030'; ctx.fillRect(px + 14, py + 15, 6, 1);
      ctx.fillStyle = '#4a2008'; ctx.fillRect(px + 15, py + 16, 4, 1);
      // Thread spool near corner
      ctx.fillStyle = '#c8a030'; ctx.fillRect(px + 6, py + 10, 3, 3);
      ctx.fillStyle = '#e8c040'; ctx.fillRect(px + 6, py + 10, 3, 1);
      return;
    }

    // ── TABLE — neighbour-aware 3/4-angle connected table ───────────────────
    // Tables placed adjacent to each other merge into a single larger table.
    // Rendered in the game's slight-south 3/4 perspective: back legs peek
    // above the top surface, south apron shows the front face's thickness,
    // and front legs hang below the apron. Both back and front legs share
    // the same X columns so the legs visually line up vertically.
    //
    // Legs only draw at OUTER corners of the connected group; the wooden
    // top extends seamlessly across connected edges.
    if (tile === TILES.FURN_TABLE) {
      const _isTable = (dc, dr) => world && world.getTile(c + dc, r + dr) === TILES.FURN_TABLE;
      const rN = _isTable(0, -1), rS = _isTable(0, 1);
      const rE = _isTable(1, 0),  rW = _isTable(-1, 0);

      // Variant-aware palette: falls back to the original oak look if the
      // placed table hasn't been tinted.
      const tint = world?.furnVariants?.get(`${c},${r}`);
      const wp = tint ? Renderer.woodPalette(tint) : null;
      const topWood  = wp ? wp.hi   : '#a67844';
      const apronC   = wp ? wp.mid  : '#6a3818';
      const legBack  = wp ? wp.shdw : '#2e1008';
      const legFront = wp ? wp.dk   : '#4a2010';
      const legHi    = wp ? wp.mid  : '#6a3818';
      // Leg X columns — same for back & front so left legs align at x=4 and
      // right legs align at x=24. 4 px wide each.
      const LX_LEFT  = 4;
      const LX_RIGHT = 24;

      // ── 1. Back legs (drawn FIRST so the top will cover most of them,
      //       leaving only a 2-px peek above the top). ──────────────────
      if (!rN && !rW) {
        ctx.fillStyle = legBack;
        ctx.fillRect(px + LX_LEFT, py + 4, 4, 4);
      }
      if (!rN && !rE) {
        ctx.fillStyle = legBack;
        ctx.fillRect(px + LX_RIGHT, py + 4, 4, 4);
      }

      // ── 2. Top surface — main wood colour, spans to connected edges. ─
      const tL = rW ? 0 : 2, tR = rE ? 32 : 30;
      const tT = rN ? 0 : 6, tB = rS ? 32 : 22;
      ctx.fillStyle = topWood;                          // wood
      ctx.fillRect(px + tL, py + tT, tR - tL, tB - tT);
      // Top-edge highlight only on the northernmost row of the group.
      if (!rN) {
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(px + tL, py + tT, tR - tL, 1);
      }
      // Horizontal wood grain — continuous east-west across connected tiles.
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(px + tL, py + 11, tR - tL, 1);
      ctx.fillRect(px + tL, py + 17, tR - tL, 1);
      // Soft shadow along the underside of the top (only where the south
      // edge is actually exposed, marking where the top meets the apron).
      if (!rS) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(px + tL, py + 21, tR - tL, 1);
      }

      // ── 3. South apron (front face showing the 3/4 thickness). Only on
      //       the southernmost row of the group. ──────────────────────
      if (!rS) {
        const aL = rW ? 0 : 3, aR = rE ? 32 : 29;
        ctx.fillStyle = apronC;
        ctx.fillRect(px + aL, py + 22, aR - aL, 3);
        ctx.fillStyle = 'rgba(255,180,120,0.10)';       // lit top of apron
        ctx.fillRect(px + aL, py + 22, aR - aL, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';             // dark bottom edge
        ctx.fillRect(px + aL, py + 24, aR - aL, 1);
      }

      // ── 4. Front legs — drawn on outer south corners only. Same X
      //       columns as back legs so the legs line up vertically. ──────
      if (!rS && !rW) {
        ctx.fillStyle = legFront;
        ctx.fillRect(px + LX_LEFT, py + 25, 4, 5);
        ctx.fillStyle = legHi;
        ctx.fillRect(px + LX_LEFT, py + 25, 4, 1);    // top-edge sheen
      }
      if (!rS && !rE) {
        ctx.fillStyle = legFront;
        ctx.fillRect(px + LX_RIGHT, py + 25, 4, 5);
        ctx.fillStyle = legHi;
        ctx.fillRect(px + LX_RIGHT, py + 25, 4, 1);
      }

      // ── 5. Cast shadow under the front edge of the group. ─────────────
      if (!rS) {
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        const sL = rW ? 0 : 3, sR = rE ? 32 : 29;
        ctx.fillRect(px + sL, py + 30, sR - sL, 1);
      }
      return;
    }

    // ── BED — 1×2 neighbour-aware (head half + foot half) ────────────────
    if (tile === TILES.FURN_BED) {
      const _isBed = (dc, dr) => world && world.getTile(c + dc, r + dr) === TILES.FURN_BED;
      const rot = world?.getRotation ? world.getRotation(c, r) : 0;

      // Direction from head tile toward foot tile, indexed by rotation.
      // rot 0 head=N foot=S, rot 1 head=E foot=W, rot 2 head=S foot=N, rot 3 head=W foot=E.
      const dirTowardFoot = [[0,1],[-1,0],[0,-1],[1,0]];
      const [dfx, dfy] = dirTowardFoot[rot & 3];
      const isHead = _isBed(dfx, dfy);
      const isFoot = _isBed(-dfx, -dfy);
      // If neither neighbor matches (build-mode preview or orphaned save),
      // default to drawing the head half.
      const drawHead = isHead || (!isHead && !isFoot);

      // Draw sprite oriented as if this were rot=0 (head at north), then
      // apply rotation. Coords below are "local" — (0..32, 0..32).
      ctx.save();
      ctx.translate(px + 16, py + 16);
      ctx.rotate((rot & 3) * Math.PI / 2);
      ctx.translate(-16, -16);

      // Variant-aware wood palette for the frame; sheets/pillow/blanket
      // stay fixed (blanket colour already has strong identity).
      const tint = world?.furnVariants?.get(`${c},${r}`);
      const wp   = tint ? Renderer.woodPalette(tint) : null;
      const wDk  = wp ? wp.shdw : '#2e1608';
      const wMd  = wp ? wp.mid  : '#5a3418';
      const wLt  = wp ? wp.lt   : '#7a5028';
      const wHi  = wp ? wp.hi   : '#9a6838';
      const rail = wp ? wp.dk   : '#4a2a10';
      const railHi = wp ? wp.lt : '#6a4020';
      const railShd = wp ? wp.shdw : '#2a1404';
      const sheetDk = '#b8b090', sheetMd = '#d4cca8', sheetLt = '#e8e0c0';
      const pillowDk = '#c8bea0', pillowMd = '#f0e8d0', pillowLt = '#fff8e0';
      const bl1 = '#7a1a1a', bl2 = '#a02828', bl3 = '#c84040', blStitch = '#e0b040';

      // Side frame rails (always visible on both halves)
      ctx.fillStyle = rail;    ctx.fillRect(0,  0, 3, 32);
      ctx.fillRect(29, 0, 3, 32);
      ctx.fillStyle = railHi;  ctx.fillRect(0, 0, 1, 32);
      ctx.fillStyle = railShd; ctx.fillRect(2, 0, 1, 32);
      ctx.fillStyle = railHi;  ctx.fillRect(29, 0, 1, 32);
      ctx.fillStyle = railShd; ctx.fillRect(31, 0, 1, 32);

      if (drawHead) {
        // ── HEAD HALF (contains headboard + pillow + upper blanket) ──
        // Headboard (tall, arched)
        ctx.fillStyle = wDk; ctx.fillRect(0,  0, 32, 11);
        ctx.fillStyle = wMd; ctx.fillRect(1,  1, 30, 10);
        ctx.fillStyle = wLt; ctx.fillRect(2,  1, 28, 2);   // top sheen
        ctx.fillStyle = wDk; ctx.fillRect(2, 10, 28, 1);   // bottom shadow
        // Arched decorative panel
        ctx.fillStyle = wDk; ctx.fillRect(8, 2, 16, 7);
        ctx.fillStyle = wHi; ctx.fillRect(9, 3, 14, 5);
        ctx.fillStyle = wLt; ctx.fillRect(10, 3, 12, 2);
        ctx.fillStyle = '#c8a030'; ctx.fillRect(15, 4, 2, 4); // brass medallion
        // Headboard posts (outer flanking)
        ctx.fillStyle = wDk; ctx.fillRect(0, 0, 5, 12);
        ctx.fillStyle = wMd; ctx.fillRect(1, 1, 3, 10);
        ctx.fillStyle = wDk; ctx.fillRect(27, 0, 5, 12);
        ctx.fillStyle = wMd; ctx.fillRect(28, 1, 3, 10);
        // Post finials (small caps)
        ctx.fillStyle = wLt; ctx.fillRect(1, 0, 3, 1); ctx.fillRect(28, 0, 3, 1);

        // Mattress base
        ctx.fillStyle = sheetDk; ctx.fillRect(3, 11, 26, 21);
        ctx.fillStyle = sheetMd; ctx.fillRect(3, 11, 26, 2);   // sheet top edge
        ctx.fillStyle = sheetLt; ctx.fillRect(3, 11, 26, 1);

        // Pillow (stacked shadow + body + highlight)
        ctx.fillStyle = pillowDk; ctx.fillRect(6, 14, 20, 10);
        ctx.fillStyle = pillowMd; ctx.fillRect(7, 14, 18, 8);
        ctx.fillStyle = pillowLt; ctx.fillRect(8, 15, 10, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(7, 22, 18, 1);

        // Upper blanket (starts at y ≈ 25)
        ctx.fillStyle = bl1; ctx.fillRect(3, 25, 26, 2);   // blanket fold shadow
        ctx.fillStyle = bl2; ctx.fillRect(3, 26, 26, 6);
        ctx.fillStyle = bl3; ctx.fillRect(3, 26, 26, 1);   // top sheen
        // Gold stitching line
        ctx.fillStyle = blStitch; ctx.fillRect(3, 25, 26, 1);
      } else {
        // ── FOOT HALF (continues blanket + footboard) ──
        // Blanket body
        ctx.fillStyle = bl2; ctx.fillRect(3, 0, 26, 24);
        ctx.fillStyle = bl3; ctx.fillRect(3, 0, 26, 1);   // top sheen
        // Weave pattern — diagonal stripes
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 6, 3, 2, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        for (let i = 0; i < 4; i++) ctx.fillRect(6 + i * 6, 3, 1, 18);
        // Blanket edge shadow where it drapes over footboard
        ctx.fillStyle = bl1; ctx.fillRect(3, 22, 26, 2);

        // Footboard (low wooden panel)
        ctx.fillStyle = wDk; ctx.fillRect(0, 24, 32, 6);
        ctx.fillStyle = wMd; ctx.fillRect(1, 25, 30, 4);
        ctx.fillStyle = wLt; ctx.fillRect(2, 25, 28, 1);   // top highlight
        ctx.fillStyle = wDk; ctx.fillRect(2, 28, 28, 1);   // shadow line
        // Footboard decorative panel
        ctx.fillStyle = wHi; ctx.fillRect(10, 26, 12, 2);
        // Corner posts
        ctx.fillStyle = wDk; ctx.fillRect(0, 24, 5, 8);
        ctx.fillStyle = wMd; ctx.fillRect(1, 25, 3, 6);
        ctx.fillStyle = wDk; ctx.fillRect(27, 24, 5, 8);
        ctx.fillStyle = wMd; ctx.fillRect(28, 25, 3, 6);

        // Drop shadow under footboard
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(3, 30, 26, 2);
      }
      ctx.restore();
      return;
    }

    // ── RUG — neighbour-aware connected rug ──────────────────────────────────
    if (tile === TILES.FURN_RUG) {
      const _isRug = (dc, dr) => world && world.getTile(c + dc, r + dr) === TILES.FURN_RUG;
      const rN = _isRug(0, -1), rS = _isRug(0, 1);
      const rE = _isRug(1, 0),  rW = _isRug(-1, 0);

      // Variant-aware fabric palette — falls back to the original red weave.
      const tint = world?.furnVariants?.get(`${c},${r}`);
      const fp = tint ? Renderer.fabricPalette(tint) : null;
      const borderDk = fp ? Renderer.shadeHex(fp.dk, -0.30) : '#8b1010';
      const borderMd = fp ? fp.dk   : '#a02018';
      const fieldC   = fp ? fp.mid  : '#c0392b';
      const fieldHi  = fp ? fp.lt   : '#d04030';
      const fringeC  = fp ? Renderer.shadeHex(fp.dk, -0.40) : '#6a0808';

      // Edge insets: 0 on connected edges (seamless), 2 on exposed edges (border)
      const eL = rW ? 0 : 2, eR = rE ? 0 : 2;
      const eT = rN ? 0 : 2, eB = rS ? 0 : 2;

      // Outer border layer (dark red)
      ctx.fillStyle = borderDk;
      ctx.fillRect(px + eL, py + eT, 32 - eL - eR, 32 - eT - eB);

      // Inner border layer
      const iL = rW ? 0 : 4, iR = rE ? 0 : 4;
      const iT = rN ? 0 : 4, iB = rS ? 0 : 4;
      ctx.fillStyle = borderMd;
      ctx.fillRect(px + iL, py + iT, 32 - iL - iR, 32 - iT - iB);

      // Main field (crimson)
      const fL = rW ? 0 : 6, fR = rE ? 0 : 6;
      const fT = rN ? 0 : 6, fB = rS ? 0 : 6;
      ctx.fillStyle = fieldC;
      ctx.fillRect(px + fL, py + fT, 32 - fL - fR, 32 - fT - fB);

      // Subtle inner highlight
      ctx.fillStyle = fieldHi;
      const hL = rW ? 0 : 8, hR = rE ? 0 : 8;
      const hT = rN ? 0 : 8, hB = rS ? 0 : 8;
      ctx.fillRect(px + hL, py + hT, 32 - hL - hR, 32 - hT - hB);

      // Tiling accent pattern — thin gold lines at tile midpoint.
      // These lines connect seamlessly across adjacent rug tiles.
      ctx.fillStyle = 'rgba(212,160,0,0.30)';
      ctx.fillRect(px + fL, py + 15, 32 - fL - fR, 2);   // horizontal
      ctx.fillRect(px + 15, py + fT, 2, 32 - fT - fB);   // vertical

      // Gold diamond motif at tile centre (repeating pattern across large rugs)
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(px + 14, py + 14, 4, 4);
      ctx.fillStyle = '#d4a000';
      ctx.fillRect(px + 15, py + 15, 2, 2);
      // Small accent dots creating a cross around the diamond
      ctx.fillStyle = 'rgba(241,196,15,0.45)';
      ctx.fillRect(px + 12, py + 15, 2, 2);
      ctx.fillRect(px + 18, py + 15, 2, 2);
      ctx.fillRect(px + 15, py + 12, 2, 2);
      ctx.fillRect(px + 15, py + 18, 2, 2);

      // Fringe tassels on exposed edges only
      ctx.fillStyle = fringeC;
      if (!rN) for (let i = 0; i < 7; i++) ctx.fillRect(px + 3 + i * 4, py,      2, 2);
      if (!rS) for (let i = 0; i < 7; i++) ctx.fillRect(px + 3 + i * 4, py + 30, 2, 2);
      if (!rW) for (let i = 0; i < 7; i++) ctx.fillRect(px,      py + 3 + i * 4, 2, 2);
      if (!rE) for (let i = 0; i < 7; i++) ctx.fillRect(px + 30, py + 3 + i * 4, 2, 2);
      return;
    }

    // ── Furniture tiles (floor drawn by PROP_TILES path; just draw the sprite) ─
    const FURN_SET = new Set([
      TILES.FURN_CHAIR,
      TILES.FURN_CHEST, TILES.FURN_PLANT,
      TILES.FURN_BENCH,
      TILES.FURN_TAPESTRY,
      TILES.DISPLAY_SHELF,
      TILES.FURN_STOOL,
      TILES.FURN_NIGHTSTAND, TILES.FURN_FLOWER_PATCH,
      // FURN_TABLE is neighbour-aware (like FURN_RUG) — handled as a direct
      // case in _drawTileDetail so adjacent tables merge seamlessly.
      // FURN_PAINTING is a wall-mount — handled as a direct case in
      // _drawTileDetail (next to MEAT_HOOK / HEARTH) so the wall draws beneath it.
      // FURN_BED is a 1×2 neighbour-aware direct case so each tile draws
      // only its half (headboard vs footboard) instead of duplicating.
      // OVERHANG tiles (clock, wardrobe, bookshelf, throne, vase, lantern,
      // weapon_case, armor_stand) keep their FURN_SET or direct dispatch but
      // are NOT baked into the chunk cache — they render via depth-sorted
      // sortables so entities get proper front/back occlusion.
      TILES.FURN_WARDROBE,
      TILES.FURN_BOOKSHELF,
      TILES.FURN_THRONE,
      TILES.FURN_VASE,
      TILES.FURN_CLOCK,
      TILES.FURN_LANTERN,
    ]);
    if (FURN_SET.has(tile)) {
      const rot = world.getRotation ? world.getRotation(c, r) : 0;
      const tint = world?.furnVariants?.get(`${c},${r}`) || null;
      ctx.save();
      ctx.translate(px, py);
      this._drawFurnitureSprite(ctx, tile, rot, tint);
      ctx.restore();
      return;
    }

    // ── CAVE_FLOOR — packed earth underground floor ───────────────────────
    if (tile === TILES.CAVE_FLOOR) {
      // Subtle strata bands (horizontal layers of compressed earth)
      const bandY = ((r * 7) % 5);  // 0-4 — vary starting band per row
      for (let b = 0; b < 3; b++) {
        const by = py + ((bandY + b * 11) % 32);
        const bh = 2 + (s2 % 2);
        ctx.fillStyle = (b % 2 === 0) ? 'rgba(80,50,20,0.18)' : 'rgba(20,10,4,0.14)';
        ctx.fillRect(px, by, 32, bh);
      }
      // Small pebbles / gravel
      const pebblePositions = [
        [3  + (s1 % 6),  5  + (s2 % 8)],
        [18 + (s2 % 7),  12 + (s3 % 6)],
        [8  + (s3 % 5),  22 + (s1 % 7)],
        [24 + (s1 % 5),  26 + (s2 % 5)],
        [14 + (s1 % 6),  3  + (s3 % 5)],
      ];
      pebblePositions.forEach(([bx, by], i) => {
        if ((s1 + i) % 3 === 0) return;  // skip ~1/3 for variety
        const shade = 30 + (s3 + i * 7) % 25;
        ctx.fillStyle = `rgb(${shade + 15},${shade},${shade - 10})`;
        ctx.fillRect(px + bx, py + by, 2, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px + bx, py + by, 1, 1);
      });
      // Thin root fragments (occasional)
      if (s3 % 3 === 0) {
        ctx.fillStyle = 'rgba(90,55,20,0.45)';
        const rx = px + 5 + (s1 % 20);
        const ry = py + 4 + (s2 % 22);
        ctx.fillRect(rx, ry, 1, 5 + (s3 % 8));
        if (s2 % 2 === 0) ctx.fillRect(rx, ry + 3, 4 + (s1 % 5), 1);
      }
      // Occasional crack line
      if (s1 % 5 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        const crx = px + 8 + (s3 % 16);
        const cry = py + 6 + (s1 % 18);
        ctx.fillRect(crx, cry, 1, 4 + (s2 % 6));
        ctx.fillRect(crx, cry + 2, 3, 1);
      }
      return;
    }

    // ── CAVE_WALL — rough natural dirt/rock underground wall ──────────────
    if (tile === TILES.CAVE_WALL) {
      const wS = world.getTile(c, r + 1) === TILES.CAVE_WALL;

      if (wS) {
        // Interior wall — full-tile rough dirt surface
        // Layered earth strata
        for (let b = 0; b < 4; b++) {
          const by = py + b * 8 + (s2 % 4);
          const br = 40 + (b * 6) + (s1 % 12);
          const bg = 22 + (b * 3) + (s2 % 8);
          const bb = 8  + (b * 2) + (s3 % 5);
          ctx.fillStyle = `rgb(${br},${bg},${bb})`;
          ctx.fillRect(px, by, 32, 8 + (s3 % 4));
        }
        // Embedded rocks (darker lumps)
        [[4, 5, 7, 5], [18, 14, 5, 4], [8, 23, 6, 4], [25, 8, 5, 6]].forEach(([rx, ry, rw, rh], i) => {
          if ((s2 + i) % 3 === 0) return;
          ctx.fillStyle = `rgb(${28 + (s1 + i * 11) % 15},${16 + (s2 + i * 7) % 10},${8})`;
          ctx.fillRect(px + rx + (s3 % 3), py + ry + (s1 % 4), rw, rh);
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(px + rx + (s3 % 3), py + ry + (s1 % 4), rw, 1);
        });
        // Moisture drip streaks
        if (s1 % 4 === 0) {
          ctx.fillStyle = 'rgba(20,12,4,0.50)';
          const dx = px + 6 + (s2 % 20);
          ctx.fillRect(dx, py, 1, 12 + (s3 % 12));
          ctx.fillStyle = 'rgba(20,12,4,0.22)';
          ctx.fillRect(dx - 1, py, 1, 8 + (s1 % 10));
        }
        // Root tendrils across wall face
        if (s3 % 3 === 0) {
          ctx.fillStyle = 'rgba(80,50,18,0.55)';
          const rtx = px + 10 + (s1 % 12);
          const rty = py + 2 + (s2 % 10);
          ctx.fillRect(rtx, rty, 12 + (s2 % 8), 1);
          ctx.fillRect(rtx + 3, rty + 1, 1, 4 + (s3 % 5));
        }
      } else {
        // South-exposed wall edge — shows a face + top surface
        const TOP = 10;
        // Top surface of wall (darker earth)
        const tr = 38 + (s1 % 12); const tg = 22 + (s2 % 8);
        ctx.fillStyle = `rgb(${tr},${tg},10)`;
        ctx.fillRect(px, py, 32, TOP);
        // Strata on top surface
        for (let b = 0; b < 2; b++) {
          ctx.fillStyle = `rgba(0,0,0,${0.12 + b * 0.08})`;
          ctx.fillRect(px, py + b * 5 + (s3 % 4), 32, 2);
        }
        // Pebble on top
        if (s2 % 2 === 0) {
          ctx.fillStyle = `rgb(${50 + (s2 % 20)},${30 + (s1 % 12)},12)`;
          ctx.fillRect(px + 4 + (s3 % 22), py + 3 + (s1 % 5), 3, 2);
        }
        // Ledge highlight
        ctx.fillStyle = 'rgba(120,80,30,0.35)'; ctx.fillRect(px, py + TOP, 32, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.50)';     ctx.fillRect(px, py + TOP + 1, 32, 1);
        // Wall face — darker rough earth
        const fr = 28 + (s2 % 10); const fg = 15 + (s1 % 7);
        ctx.fillStyle = `rgb(${fr},${fg},6)`;
        ctx.fillRect(px, py + TOP + 2, 32, 32 - TOP - 2);
        // Strata bands on face
        for (let b = 0; b < 3; b++) {
          const sby = py + TOP + 4 + b * 7 + (s3 % 5);
          ctx.fillStyle = `rgba(0,0,0,${0.10 + b * 0.07})`;
          ctx.fillRect(px, sby, 32, 2);
          ctx.fillStyle = `rgba(255,200,100,${0.06 - b * 0.02})`;
          ctx.fillRect(px, sby + 2, 32, 1);
        }
        // Embedded stone fragments on face
        if (s1 % 3 !== 0) {
          const sx2 = px + 5 + (s1 % 20);
          const sy2 = py + TOP + 6 + (s2 % 12);
          ctx.fillStyle = `rgb(${35 + (s3 % 15)},${20 + (s2 % 10)},8)`;
          ctx.fillRect(sx2, sy2, 4 + (s3 % 3), 3);
          ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(sx2, sy2, 4, 1);
        }
        // Bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.44)'; ctx.fillRect(px, py + 28, 32, 4);
      }
      return;
    }

    // ── SPIDER_WEB — decorative web prop on cave floor ────────────────────
    if (tile === TILES.SPIDER_WEB) {
      // Center of tile
      const cx2 = px + 16, cy2 = py + 16;
      // Per-tile variation using seeds
      const wobble = (s1 % 5) - 2;   // -2..+2 centre offset
      const webCx  = cx2 + wobble;
      const webCy  = cy2 + ((s2 % 5) - 2);
      const maxR   = 13 + (s3 % 4);  // 13-16 — outer radius varies per tile

      ctx.save();
      ctx.globalAlpha = 0.55 + (s1 % 3) * 0.1;  // 0.55, 0.65, or 0.75

      // ── Radial spokes (8 directions) ─────────────────────────────────
      const SPOKES = 8;
      const baseAngle = (s2 % 628) / 100;  // slight random rotation per tile
      ctx.strokeStyle = 'rgba(220,210,190,0.80)';
      ctx.lineWidth   = 0.6;
      ctx.beginPath();
      for (let i = 0; i < SPOKES; i++) {
        const angle = baseAngle + (i / SPOKES) * Math.PI * 2;
        ctx.moveTo(webCx, webCy);
        ctx.lineTo(webCx + Math.cos(angle) * maxR, webCy + Math.sin(angle) * maxR);
      }
      ctx.stroke();

      // ── Concentric polygon rings (3 rings) ───────────────────────────
      ctx.strokeStyle = 'rgba(210,200,180,0.65)';
      ctx.lineWidth   = 0.7;
      for (let ring = 1; ring <= 3; ring++) {
        const ringR = (maxR * ring) / 3.4;
        // Slight per-ring warp using seeds
        const warp = (s3 % 3) * 0.04;
        ctx.beginPath();
        for (let i = 0; i <= SPOKES; i++) {
          const angle = baseAngle + (i / SPOKES) * Math.PI * 2;
          const r2 = ringR * (1 + warp * ((i + ring) % 2 === 0 ? 1 : -1));
          const vx = webCx + Math.cos(angle) * r2;
          const vy = webCy + Math.sin(angle) * r2;
          if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // ── Dew drops on a few strand intersections ────────────────────
      if (s1 % 3 !== 0) {
        ctx.fillStyle = 'rgba(180,200,220,0.7)';
        for (let i = 0; i < 3; i++) {
          const angle = baseAngle + ((s2 + i * 3) % SPOKES) / SPOKES * Math.PI * 2;
          const ringR = (maxR * (1 + (i % 3))) / 3.4;
          ctx.beginPath();
          ctx.arc(webCx + Math.cos(angle) * ringR, webCy + Math.sin(angle) * ringR, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      return;
    }

    // ── BERRY_BUSH — rounded leafy bush with berries ──────────────────────
    if (tile === TILES.BERRY_BUSH) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(px+16, py+26, 12, 5, 0, 0, Math.PI*2); ctx.fill();
      // Main bush body — three overlapping lobes
      const lobes = [
        { x: px+11, y: py+18, r: 9 },
        { x: px+21, y: py+17, r: 8 },
        { x: px+16, y: py+12, r: 8 },
      ];
      for (const lobe of lobes) {
        ctx.fillStyle = `rgb(${38+(s1%12)},${100+(s2%18)},${28+(s3%10)})`;
        ctx.beginPath(); ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI*2); ctx.fill();
      }
      // Highlight on top lobe
      ctx.fillStyle = 'rgba(120,200,60,0.30)';
      ctx.beginPath(); ctx.arc(px+14, py+10, 5, 0, Math.PI*2); ctx.fill();
      // Berries — small red/purple dots scattered on bush
      const berryPositions = [
        [px+10, py+19], [px+19, py+16], [px+16, py+22],
        [px+22, py+21], [px+13, py+14], [px+20, py+12],
      ];
      for (let i = 0; i < berryPositions.length; i++) {
        const [bx, by] = berryPositions[i];
        ctx.fillStyle = (i + s1) % 3 === 0 ? '#c0203a' : '#8b1a3a';
        ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,180,180,0.5)';
        ctx.beginPath(); ctx.arc(bx-0.7, by-0.7, 0.9, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── BERRY_BUSH_EMPTY — same bush shape, no berries ────────────────────
    if (tile === TILES.BERRY_BUSH_EMPTY) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(px+16, py+26, 12, 5, 0, 0, Math.PI*2); ctx.fill();
      const lobes = [
        { x: px+11, y: py+18, r: 9 },
        { x: px+21, y: py+17, r: 8 },
        { x: px+16, y: py+12, r: 8 },
      ];
      for (const lobe of lobes) {
        // Slightly duller/darker green — no fruit, nutrients diverted
        ctx.fillStyle = `rgb(${28+(s1%10)},${80+(s2%14)},${22+(s3%8)})`;
        ctx.beginPath(); ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(80,160,30,0.20)';
      ctx.beginPath(); ctx.arc(px+14, py+10, 5, 0, Math.PI*2); ctx.fill();
      return;
    }

    // ── MUSHROOM — cluster of 2-3 mushrooms ──────────────────────────────
    if (tile === TILES.MUSHROOM) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(px+16, py+27, 10, 4, 0, 0, Math.PI*2); ctx.fill();
      // Draw 2-3 mushrooms based on seed
      const count = 2 + (s1 % 2);
      const positions = count === 3
        ? [[px+9, py+20], [px+17, py+16], [px+23, py+21]]
        : [[px+12, py+18], [px+21, py+17]];
      for (let i = 0; i < positions.length; i++) {
        const [mx, my] = positions[i];
        // Stem
        ctx.fillStyle = '#d8d0a8';
        ctx.fillRect(mx-3, my+2, 6, 7);
        // Gills underside
        ctx.fillStyle = 'rgba(200,180,140,0.7)';
        ctx.beginPath(); ctx.ellipse(mx, my+3, 7, 3, 0, 0, Math.PI*2); ctx.fill();
        // Cap
        const capR = (i + s3) % 2 === 0 ? '#b84818' : '#8a3510';
        ctx.fillStyle = capR;
        ctx.beginPath();
        ctx.arc(mx, my, 8, Math.PI, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx, my, 8, 3, 0, 0, Math.PI*2); ctx.fill();
        // White spots
        ctx.fillStyle = 'rgba(255,255,255,0.70)';
        ctx.beginPath(); ctx.arc(mx-3, my-4, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx+2, my-6, 1.2, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── WILD_HERB — small leafy plant with delicate stems ─────────────────
    if (tile === TILES.WILD_HERB) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(px+16, py+26, 8, 3, 0, 0, Math.PI*2); ctx.fill();
      // Stem cluster — 4-5 thin stems radiating from base
      const stemCount = 4 + (s1 % 2);
      for (let i = 0; i < stemCount; i++) {
        const angle = (i / stemCount) * Math.PI - Math.PI * 0.1 + (s2 % 10) * 0.05;
        const len   = 10 + (s3 % 5);
        const ex    = px + 16 + Math.sin(angle) * len;
        const ey    = py + 24 - Math.cos(angle) * len;
        ctx.strokeStyle = `rgb(${28+(s1%10)},${90+(s2%20)},${22+(s3%8)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px+16, py+24); ctx.lineTo(ex, ey); ctx.stroke();
        // Small leaf at tip
        ctx.fillStyle = `rgb(${40+(s2%15)},${110+(s1%20)},${30+(s3%12)})`;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 3.5, 2, angle, 0, Math.PI*2);
        ctx.fill();
      }
      // Small flower buds on some stems (variation)
      if (s3 % 3 !== 0) {
        ctx.fillStyle = (s1 % 2 === 0) ? '#e8c030' : '#e060a0';
        ctx.beginPath(); ctx.arc(px+16 + (s2%6)-3, py+14 + (s1%4), 2, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── REEDS — bundle of tall waterside stalks ───────────────────────────
    if (tile === TILES.REEDS) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.beginPath(); ctx.ellipse(px+16, py+28, 9, 3, 0, 0, Math.PI*2); ctx.fill();
      // 5-7 stalks of varying height
      const stalkCount = 5 + (s1 % 3);
      for (let i = 0; i < stalkCount; i++) {
        const sx    = px + 6 + i * (20 / stalkCount) + (s2 % 3) - 1;
        const lean  = ((i + s1) % 3 - 1) * 3;  // -3, 0, or +3 px lean
        const height = 16 + (s3 % 8) + (i % 2) * 4;
        const topY  = py + 28 - height;
        // Stalk — golden-tan like dried cattail reeds, not grass green
        ctx.strokeStyle = i % 3 === 0 ? '#b8a050' : '#9a8432';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sx, py+28);
        ctx.quadraticCurveTo(sx + lean * 0.5, py + 16, sx + lean, topY);
        ctx.stroke();
        // Seed head — dark brown cylindrical catkin
        ctx.fillStyle = (i + s2) % 3 === 0 ? '#5a3010' : '#4a2808';
        ctx.beginPath();
        ctx.ellipse(sx + lean, topY + 4, 2.2, 5, 0, 0, Math.PI*2);
        ctx.fill();
      }
      return;
    }

    // ── FLAX_PLANT — tall blue-purple flowering stalks ───────────────────
    if (tile === TILES.FLAX_PLANT) {
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.beginPath(); ctx.ellipse(px+16, py+27, 8, 3, 0, 0, Math.PI*2); ctx.fill();
      const count = 3 + (s1 % 2);
      for (let i = 0; i < count; i++) {
        const sx   = px + 8 + i * (16 / (count - 1));
        const lean = ((i + s2) % 3 - 1) * 2;
        const h    = 18 + (s3 % 6);
        ctx.strokeStyle = '#5a8a30'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx, py + 28);
        ctx.quadraticCurveTo(sx + lean, py + 18, sx + lean * 1.5, py + 28 - h);
        ctx.stroke();
        if (i % 2 === 0) {
          ctx.fillStyle = '#4a7a28';
          ctx.beginPath();
          ctx.ellipse(sx + lean * 0.7, py + 28 - h * 0.55, 4, 2, 0.6, 0, Math.PI*2);
          ctx.fill();
        }
        const fc = (i + s1) % 3;
        ctx.fillStyle = fc === 0 ? '#6a60d0' : fc === 1 ? '#8060c8' : '#5050b8';
        ctx.beginPath(); ctx.arc(sx + lean * 1.5, py + 28 - h, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(200,180,255,0.5)';
        ctx.beginPath(); ctx.arc(sx + lean * 1.5 - 1, py + 28 - h - 1, 1.2, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── SNOWBERRY — bare winter branches with white berry clusters ────────
    if (tile === TILES.SNOWBERRY) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.beginPath(); ctx.ellipse(px+16, py+27, 10, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 1.8;
      const lean = (s1 % 5) - 2;
      ctx.beginPath(); ctx.moveTo(px+16, py+28); ctx.lineTo(px+16+lean, py+14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+16+lean, py+18); ctx.lineTo(px+8+(s2%4), py+10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px+16+lean, py+16); ctx.lineTo(px+24-(s3%4), py+10); ctx.stroke();
      ctx.fillStyle = 'rgba(230,240,255,0.75)';
      ctx.beginPath(); ctx.ellipse(px+16+lean, py+14, 4, 2, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px+9+(s2%4), py+10, 3, 1.5, 0, 0, Math.PI*2); ctx.fill();
      const clusters = [[px+8+(s2%4), py+9], [px+24-(s3%4), py+9], [px+16+lean, py+7]];
      for (const [bx, by] of clusters) {
        for (let b = 0; b < 2+(s1%2); b++) {
          const ox = (b % 2) * 5 - 2, oy = (b / 2 | 0) * (-4);
          ctx.fillStyle = '#e8f0fc';
          ctx.beginPath(); ctx.arc(bx+ox, by+oy, 2.5, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.beginPath(); ctx.arc(bx+ox-0.8, by+oy-0.8, 1, 0, Math.PI*2); ctx.fill();
        }
      }
      return;
    }

    // ── SULFUR_ROCK — bright yellow crystal cluster on volcanic rock ──────
    if (tile === TILES.SULFUR_ROCK) {
      ctx.fillStyle = '#2a1e1e';
      ctx.beginPath(); ctx.ellipse(px+16, py+24, 11, 6, 0, 0, Math.PI*2); ctx.fill();
      const spires = 3 + (s1 % 3);
      for (let i = 0; i < spires; i++) {
        const sx   = px + 7 + i * (18 / (spires - 1));
        const h    = 10 + (s2 % 8) + (i % 2) * 5;
        const w    = 3 + (s3 % 3);
        const lean = ((i + s1) % 3 - 1) * 3;
        ctx.fillStyle = '#b89000';
        ctx.beginPath();
        ctx.moveTo(sx, py+24); ctx.lineTo(sx-w+lean, py+24-h); ctx.lineTo(sx+w+lean, py+24-h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8c800';
        ctx.beginPath();
        ctx.moveTo(sx+lean*0.6, py+24); ctx.lineTo(sx-w*0.4+lean, py+24-h*0.85); ctx.lineTo(sx+w*0.4+lean, py+24-h*0.85);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff8a0';
        ctx.beginPath(); ctx.arc(sx+lean, py+24-h, 1.5, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── THORN_BUSH — gnarled dark spiky branches ─────────────────────────
    if (tile === TILES.THORN_BUSH) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath(); ctx.ellipse(px+16, py+26, 11, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#3a2a0e'; ctx.lineWidth = 1.6;
      const branches = [
        [px+16,py+26, px+10,py+14], [px+16,py+26, px+22,py+13],
        [px+16,py+26, px+16,py+11], [px+10,py+17, px+6, py+12],
        [px+22,py+16, px+26,py+11],
      ];
      for (const [x1,y1,x2,y2] of branches) {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
      ctx.strokeStyle = '#5a3a15'; ctx.lineWidth = 1;
      const thorns = [
        [px+13,py+20, px+10,py+16], [px+19,py+19, px+22,py+15],
        [px+10,py+14, px+7, py+11], [px+22,py+13, px+25,py+10],
        [px+16,py+16, px+13,py+12], [px+16,py+16, px+19,py+12],
      ];
      for (const [x1,y1,x2,y2] of thorns) {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
      if (s1 % 3 !== 0) {
        ctx.fillStyle = '#2a3a0a';
        ctx.beginPath(); ctx.ellipse(px+9,  py+12, 3, 1.8, -0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px+23, py+11, 3, 1.8,  0.4, 0, Math.PI*2); ctx.fill();
      }
      return;
    }

    // ── DESERT_FLOWER — succulent rosette with a bright bloom ─────────────
    if (tile === TILES.DESERT_FLOWER) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(px+16, py+26, 9, 3, 0, 0, Math.PI*2); ctx.fill();
      const leafColors = ['#3a6828', '#4a7830', '#386028'];
      for (let i = 0; i < 6; i++) {
        const a  = (i / 6) * Math.PI * 2;
        ctx.fillStyle = leafColors[i % 3];
        ctx.beginPath();
        ctx.ellipse(px+16+Math.cos(a)*7, py+22+Math.sin(a)*4, 5, 3, a, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,200,80,0.25)';
        ctx.beginPath();
        ctx.ellipse(px+16+Math.cos(a)*5.5, py+22+Math.sin(a)*3, 2, 1, a, 0, Math.PI*2);
        ctx.fill();
      }
      const petalColor = (s2 % 3) === 0 ? '#e03878' : (s2 % 3) === 1 ? '#e89020' : '#c030b0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.fillStyle = petalColor;
        ctx.beginPath();
        ctx.ellipse(px+16+Math.cos(a)*6, py+16+Math.sin(a)*5, 4.5, 3, a, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8e028';
      ctx.beginPath(); ctx.arc(px+16, py+16, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff07a';
      ctx.beginPath(); ctx.arc(px+15, py+15, 1.5, 0, Math.PI*2); ctx.fill();
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
  _drawFurnitureSprite(ctx, tile, rot, tint = null) {
    const T = TILES;

    // (RUG is rendered via neighbour-aware code in _drawTileDetail, not here)

    // ── CHAIR ───────────────────────────────────────────────
    if (tile === T.FURN_CHAIR) {
      const shadow = () => { ctx.fillStyle='rgba(0,0,0,0.2)'; };
      // When the player chose a wood variant, derive the chair's palette
      // from the tint so every shade stays harmonised.
      const wp     = tint ? Renderer.woodPalette(tint) : null;
      const legDk  = wp ? wp.shdw : '#2e1008';
      const legMd  = wp ? wp.dk   : '#4a2808';
      const topFace  = wp ? wp.hi  : '#c8844a';  // seat / backrest top (lightest)
      const sthFace  = wp ? wp.mid : '#7a4a20';  // south-facing vertical face
      const bkFace   = wp ? wp.dk  : '#5a3010';  // backrest south face (medium)
      const cush     = '#c0392b';
      const cushDk   = '#8b1a14';
      const bkTop    = wp ? wp.lt : '#9a6a3a';  // backrest top face

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
        // Seat south face (front apron)
        ctx.fillStyle=sthFace; ctx.fillRect(2,24,22,4);
        // Near armrest (south side — faces viewer, prominent)
        ctx.fillStyle='#8a5a30'; ctx.fillRect(2,11,20,3);     // arm top
        ctx.fillStyle=sthFace;   ctx.fillRect(2,14,3,10);     // arm front post
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(2,11,20,1);
        // Far armrest (north side — mostly hidden, just the top edge peek)
        ctx.fillStyle='#6a4020'; ctx.fillRect(2,2,18,2);
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
        // Seat south face (front apron)
        ctx.fillStyle=sthFace; ctx.fillRect(10,24,20,4);
        // Near armrest (south side — faces viewer, prominent)
        ctx.fillStyle='#8a5a30'; ctx.fillRect(12,11,18,3);    // arm top
        ctx.fillStyle=sthFace;   ctx.fillRect(27,14,3,10);    // arm front post
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(12,11,18,1);
        // Far armrest (north side — mostly hidden, just the top edge peek)
        ctx.fillStyle='#6a4020'; ctx.fillRect(14,2,16,2);
        // Far-right back leg (north-east corner)
        ctx.fillStyle=legDk; ctx.fillRect(25,2,4,12);
        // Front-right leg (south-east)
        ctx.fillStyle=legMd; ctx.fillRect(25,22,4,6);
      }
      return;
    }

    // FURN_TABLE is rendered as a neighbour-aware direct case in
    // _drawTileDetail (alongside FURN_RUG) so adjacent tables merge
    // seamlessly into a larger table. It is NOT in FURN_SET.

    // ── CHEST ───────────────────────────────────────────────
    if (tile === T.FURN_CHEST) {
      // 3/4 top-down perspective. Chest is roughly 2:1 (wide:deep).
      // rot 0/2 (long axis E-W): wide on screen, shallow top.
      // rot 1/3 (long axis N-S): narrow on screen, deeper top (long axis recedes).
      const bodyFront = '#8b5020', bodyTop = '#b87030', bodyDark = '#5a2808';
      const sideDk = '#4a1e06';
      const brass = '#d4a017', gold = '#f1c40f';

      if (rot === 0) {
        // ─ Wide view. Clasp faces south (viewer). ─
        // L=left edge, R=right edge of chest body
        const L = 2, R = 30, W = R - L;        // 28px wide
        const topY = 10, midY = 18, botY = 28;  // top / lid-edge / bottom
        ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(L+1,botY,W,3);     // shadow
        ctx.fillStyle=sideDk;   ctx.fillRect(R-1,topY,3,midY-topY+10);     // east side
        ctx.fillStyle=bodyDark; ctx.fillRect(L-1,topY,3,midY-topY+10);     // west side
        ctx.fillStyle=bodyFront; ctx.fillRect(L,midY,W,botY-midY);         // front face
        ctx.fillStyle='#7a4018'; ctx.fillRect(L,midY,W,2);                 // lid edge
        ctx.fillStyle=bodyTop;   ctx.fillRect(L,topY,W,midY-topY);         // lid top
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(L,topY,W,2);
        // Brass
        ctx.fillStyle=brass;
        ctx.fillRect(L,midY+2,W,2);                                        // horiz band
        ctx.fillRect(L+12,topY,4,botY-topY);                               // vert band
        ctx.fillRect(L+2,topY+1,3,3); ctx.fillRect(R-5,topY+1,3,3);       // top studs
        ctx.fillRect(L+2,botY-5,3,3); ctx.fillRect(R-5,botY-5,3,3);       // bot studs
        ctx.fillStyle=gold; ctx.fillRect(L+10,midY-2,6,4);
        ctx.fillStyle='#8b6000'; ctx.fillRect(L+11,midY-1,4,2);

      } else if (rot === 1) {
        // ─ Narrow view. Long axis runs N-S. Clasp faces east. ─
        const L = 9, R = 23, W = R - L;         // 14px wide (short end)
        const topY = 6, midY = 18, botY = 28;   // more top = deeper top face
        ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(L+1,botY,W+3,3);
        // East side face (long side, receding into depth — dark strip)
        ctx.fillStyle=bodyDark;  ctx.fillRect(R,topY,5,botY-topY);
        ctx.fillStyle=sideDk;    ctx.fillRect(R+3,topY+2,2,botY-topY-4);
        // South face (short end — visible front)
        ctx.fillStyle=bodyFront; ctx.fillRect(L,midY,W,botY-midY);
        ctx.fillStyle='#7a4018'; ctx.fillRect(L,midY,W,2);
        // Lid top (deeper — long axis goes N-S)
        ctx.fillStyle=bodyTop;   ctx.fillRect(L,topY,W,midY-topY);
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(L,topY,W,2);
        // South face detail — plain band
        ctx.fillStyle=brass;
        ctx.fillRect(L,midY+2,W,2);
        ctx.fillRect(L+5,topY,4,botY-topY);
        ctx.fillRect(L+1,topY+1,3,3); ctx.fillRect(L+1,botY-5,3,3);
        // East face detail — clasp
        ctx.fillStyle=brass; ctx.fillRect(R,midY+2,5,2);
        ctx.fillRect(R+1,topY+2,3,3); ctx.fillRect(R+1,botY-5,3,3);
        ctx.fillStyle=gold; ctx.fillRect(R,midY-2,4,4);
        ctx.fillStyle='#8b6000'; ctx.fillRect(R+1,midY-1,2,2);

      } else if (rot === 2) {
        // ─ Wide view. Clasp faces north (away). Back faces viewer. ─
        const L = 2, R = 30, W = R - L;
        const topY = 10, midY = 18, botY = 28;
        ctx.fillStyle='rgba(0,0,0,0.20)'; ctx.fillRect(L+1,botY,W,3);
        ctx.fillStyle=sideDk;   ctx.fillRect(R-1,topY,3,midY-topY+10);
        ctx.fillStyle=bodyDark; ctx.fillRect(L-1,topY,3,midY-topY+10);
        // Back face — plainer wood, no clasp
        ctx.fillStyle='#6a3c18'; ctx.fillRect(L,midY,W,botY-midY);
        ctx.fillStyle='#5a3010'; ctx.fillRect(L,midY,W,2);
        ctx.fillStyle=bodyTop;   ctx.fillRect(L,topY,W,midY-topY);
        ctx.fillStyle='rgba(255,255,255,0.10)'; ctx.fillRect(L,topY,W,2);
        ctx.fillStyle=brass;
        ctx.fillRect(L,midY+2,W,2); ctx.fillRect(L+12,topY,4,botY-topY);
        ctx.fillRect(L+2,topY+1,3,3); ctx.fillRect(R-5,topY+1,3,3);
        ctx.fillRect(L+2,botY-5,3,3); ctx.fillRect(R-5,botY-5,3,3);
        // Hinges
        ctx.fillStyle=brass; ctx.fillRect(L+5,midY-2,5,3); ctx.fillRect(R-10,midY-2,5,3);

      } else { // rot=3 — narrow view, clasp faces west
        const L = 9, R = 23, W = R - L;
        const topY = 6, midY = 18, botY = 28;
        ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(L-2,botY,W+3,3);
        // West side face (long side, receding)
        ctx.fillStyle=bodyDark;  ctx.fillRect(L-5,topY,5,botY-topY);
        ctx.fillStyle=sideDk;    ctx.fillRect(L-5,topY+2,2,botY-topY-4);
        // South face (short end)
        ctx.fillStyle=bodyFront; ctx.fillRect(L,midY,W,botY-midY);
        ctx.fillStyle='#7a4018'; ctx.fillRect(L,midY,W,2);
        // Lid top
        ctx.fillStyle=bodyTop;   ctx.fillRect(L,topY,W,midY-topY);
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(L,topY,W,2);
        // South face detail
        ctx.fillStyle=brass;
        ctx.fillRect(L,midY+2,W,2);
        ctx.fillRect(L+5,topY,4,botY-topY);
        ctx.fillRect(R-4,topY+1,3,3); ctx.fillRect(R-4,botY-5,3,3);
        // West face detail — clasp
        ctx.fillStyle=brass; ctx.fillRect(L-5,midY+2,5,2);
        ctx.fillRect(L-4,topY+2,3,3); ctx.fillRect(L-4,botY-5,3,3);
        ctx.fillStyle=gold; ctx.fillRect(L-4,midY-2,4,4);
        ctx.fillStyle='#8b6000'; ctx.fillRect(L-3,midY-1,2,2);
      }
      return;
    }

    // ── BOOKSHELF — tall library shelf (overhangs into tile above) ──
    if (tile === T.FURN_BOOKSHELF) {
      // Muted, library-appropriate book palette (leather-bound tones)
      const books = [
        ['#6a2418', '#8a3820'],  // burgundy
        ['#2a4868', '#3a6088'],  // navy
        ['#3a5828', '#4a7038'],  // forest
        ['#7a5018', '#a07028'],  // tan
        ['#4a2a48', '#6a3a68'],  // plum
        ['#2a2a2a', '#484848'],  // charcoal
      ];
      const wp = tint ? Renderer.woodPalette(tint) : null;
      const wDk     = wp ? wp.shdw : '#2a1808';
      const wMd     = wp ? wp.mid  : '#4a2e14';
      const wLt     = wp ? wp.lt   : '#6a4020';
      const shelf   = wp ? wp.dk   : '#3a2010';
      const shelfLt = wp ? wp.mid  : '#5a3818';
      const crown   = wp ? wp.mid  : '#5a3818';
      const crownLt = wp ? wp.lt   : '#7a5028';

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(2, 29, 28, 2);

      // Helper: draw a row of book spines. `count` books, slight height variation.
      const drawBookRow = (y, h, rowSeed) => {
        // Books vary in width (3-4 px) so the row looks natural
        let bx = 4;
        let i = 0;
        while (bx < 28) {
          const w = 3 + ((rowSeed + i) % 2);  // 3 or 4
          if (bx + w > 28) break;
          const [base, hi] = books[(rowSeed + i * 3) % books.length];
          // Random book height: some books shorter, some full
          const bh = h - ((rowSeed + i * 7) % 3);    // 0..2 px shorter
          const by = y + (h - bh);
          // Spine
          ctx.fillStyle = base; ctx.fillRect(bx, by, w, bh);
          ctx.fillStyle = hi;   ctx.fillRect(bx, by, 1, bh);
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx + 1, by, 1, bh);
          ctx.fillStyle = 'rgba(0,0,0,0.22)';       ctx.fillRect(bx + w - 1, by, 1, bh);
          // Top cap (dark) — suggests the book's page edge
          ctx.fillStyle = 'rgba(0,0,0,0.30)';       ctx.fillRect(bx, by, w, 1);
          // Occasional gold title band
          if ((rowSeed + i) % 3 === 0 && bh >= 7) {
            ctx.fillStyle = '#c8a030'; ctx.fillRect(bx + 1, by + Math.floor(bh / 2), w - 2, 1);
          }
          bx += w;
          i++;
        }
      };

      // Helper: draw a book with its pages facing out (end-on view on side face)
      const drawBookEndOn = (x, y, w, h, seed) => {
        ctx.fillStyle = '#d4c8a0'; ctx.fillRect(x, y, w, h);       // paper edge
        ctx.fillStyle = '#b8ac88'; ctx.fillRect(x, y + h - 1, w, 1);
        // Spine peek (colored)
        const [base] = books[seed % books.length];
        ctx.fillStyle = base; ctx.fillRect(x, y, 1, h);
        ctx.fillRect(x + w - 1, y, 1, h);
      };

      if (rot === 0) {
        // ── Front view: book spines face south ──
        // Carcass (upper + lower as one continuous cabinet)
        ctx.fillStyle = wDk;    ctx.fillRect(0, -30, 4, 60); ctx.fillRect(28, -30, 4, 60);
        ctx.fillStyle = wMd;    ctx.fillRect(4, -30, 24, 60);
        // Side-panel wood grain highlight
        ctx.fillStyle = wLt;    ctx.fillRect(0, -30, 1, 60); ctx.fillRect(28, -30, 1, 60);
        // Crown moulding (top cap)
        ctx.fillStyle = crown;  ctx.fillRect(0, -32, 32, 3);
        ctx.fillStyle = crownLt;ctx.fillRect(0, -32, 32, 1);
        ctx.fillStyle = wDk;    ctx.fillRect(0, -29, 32, 1);
        // Base plinth
        ctx.fillStyle = crown;  ctx.fillRect(0, 28, 32, 2);
        ctx.fillStyle = wDk;    ctx.fillRect(0, 30, 32, 2);
        // Feet
        ctx.fillStyle = wDk;    ctx.fillRect(0, 30, 4, 2); ctx.fillRect(28, 30, 4, 2);

        // 4 shelves with a book row on each. Shelf board, then books resting on it.
        // Shelf Y positions (board tops) and book row heights:
        //   shelf 1 board y=-26 (top row of books y=-25..-17, h=8)
        //   shelf 2 board y=-14 (books y=-13..-5, h=8)
        //   shelf 3 board y=-2  (books y=-1..+10, h=11)  ← bigger row to feel grounded
        //   shelf 4 board y=+14 (books y=+15..+26, h=11)
        const rows = [
          { boardY: -26, bookY: -25, bookH: 8,  seed: 1 },
          { boardY: -14, bookY: -13, bookH: 8,  seed: 5 },
          { boardY:  -2, bookY:  -1, bookH: 11, seed: 2 },
          { boardY:  14, bookY:  15, bookH: 11, seed: 7 },
        ];
        for (const { boardY, bookY, bookH, seed } of rows) {
          // Shelf board
          ctx.fillStyle = shelf;   ctx.fillRect(3, boardY, 26, 2);
          ctx.fillStyle = shelfLt; ctx.fillRect(3, boardY, 26, 1);
          // Books on this shelf
          drawBookRow(bookY, bookH, seed);
        }
      } else if (rot === 1 || rot === 3) {
        // ── Side view: one flat side of the shelf faces the viewer ──
        const sideSign = rot === 1 ? +1 : -1;
        // Side panel (the one facing viewer) — solid dark wood slab
        const sideX  = rot === 1 ? 24 : 2;
        const sideW  = 6;
        const backX  = rot === 1 ? 2 : 8;
        const backW  = 22;
        // Back body
        ctx.fillStyle = wMd; ctx.fillRect(backX, -30, backW, 60);
        ctx.fillStyle = wLt; ctx.fillRect(backX, -30, 1, 60);
        // Visible side slab (darker)
        ctx.fillStyle = wDk; ctx.fillRect(sideX, -30, sideW, 60);
        ctx.fillStyle = wMd; ctx.fillRect(sideX, -30, sideW, 1);
        ctx.fillStyle = wLt; ctx.fillRect(sideX, -30, 1, 60);
        // Crown + base
        ctx.fillStyle = crown;   ctx.fillRect(0, -32, 32, 3);
        ctx.fillStyle = crownLt; ctx.fillRect(0, -32, 32, 1);
        ctx.fillStyle = wDk;     ctx.fillRect(0, -29, 32, 1);
        ctx.fillStyle = crown;   ctx.fillRect(0, 28, 32, 2);
        ctx.fillStyle = wDk;     ctx.fillRect(0, 30, 32, 2);

        // 4 shelves on the back-face body with end-on book pages visible
        const shelfYs = [-24, -12, 0, 16];
        for (const sy of shelfYs) {
          ctx.fillStyle = shelf;   ctx.fillRect(backX, sy, backW, 2);
          ctx.fillStyle = shelfLt; ctx.fillRect(backX, sy, backW, 1);
          // Pages visible end-on across the back face
          const rowY = sy + 2;
          const rowH = sy === 0 || sy === 16 ? 11 : 8;
          let bx = backX + 1;
          let i = 0;
          while (bx < backX + backW - 2) {
            const w = 3 + ((sy * sideSign + i) % 2);
            if (bx + w > backX + backW - 1) break;
            drawBookEndOn(bx, rowY + (rowH - 8), w, 8, i + Math.abs(sy));
            bx += w + 1;
            i++;
          }
        }
        // Hint of spines peek through on the far shelf edge
        ctx.fillStyle = books[0][0];
        for (let sy of shelfYs) {
          const peekX = rot === 1 ? backX + 1 : backX + backW - 2;
          ctx.fillRect(peekX, sy + 3, 1, 6);
        }
      } else {
        // ── rot=2: back of shelf faces viewer ──
        ctx.fillStyle = wDk; ctx.fillRect(0, -30, 4, 60); ctx.fillRect(28, -30, 4, 60);
        ctx.fillStyle = wMd; ctx.fillRect(4, -30, 24, 60);
        ctx.fillStyle = wLt; ctx.fillRect(0, -30, 1, 60); ctx.fillRect(28, -30, 1, 60);
        // Crown + base
        ctx.fillStyle = crown;   ctx.fillRect(0, -32, 32, 3);
        ctx.fillStyle = crownLt; ctx.fillRect(0, -32, 32, 1);
        ctx.fillStyle = wDk;     ctx.fillRect(0, -29, 32, 1);
        ctx.fillStyle = crown;   ctx.fillRect(0, 28, 32, 2);
        ctx.fillStyle = wDk;     ctx.fillRect(0, 30, 32, 2);
        // Plank seams on back
        ctx.fillStyle = wDk;
        ctx.fillRect(12, -30, 1, 60); ctx.fillRect(20, -30, 1, 60);
        ctx.fillStyle = wLt;
        ctx.fillRect(13, -30, 1, 60); ctx.fillRect(21, -30, 1, 60);
        // Nail marks at each shelf
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        for (const sy of [-24, -12, 0, 16]) {
          ctx.fillRect(8,  sy, 2, 2);
          ctx.fillRect(22, sy, 2, 2);
        }
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
    // FURN_BED is rendered as a neighbour-aware direct case in _drawTileDetail
    // so the 1×2 footprint splits into a head half and a foot half.

    // ── BENCH ────────────────────────────────────────────────
    if (tile === T.FURN_BENCH) {
      if (rot === 0 || rot === 2) {
        // E-W orientation (default)
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(3,27,26,5);
        ctx.fillStyle='#3a2008';
        ctx.fillRect(3,20,4,10); ctx.fillRect(25,20,4,10);
        ctx.fillStyle='#5a3818'; ctx.fillRect(3,18,4,4); ctx.fillRect(25,18,4,4);
        ctx.fillStyle='#7a5028'; ctx.fillRect(3,18,26,4);
        ctx.fillStyle='#5a3818'; ctx.fillRect(3,18,26,1);
        ctx.fillStyle='#c09060'; ctx.fillRect(2,10,28,9);
        ctx.fillStyle='#d4a878'; ctx.fillRect(3,11,26,7);
        ctx.fillStyle='rgba(0,0,0,0.12)';
        for (let xi = 5; xi < 28; xi += 6) ctx.fillRect(xi, 11, 1, 7);
        ctx.fillStyle='#8a6040'; ctx.fillRect(2,17,28,2);
        ctx.fillStyle='#4a4848'; ctx.fillRect(23,12,5,5);
        ctx.fillStyle='#6a6a6a'; ctx.fillRect(24,13,3,3);
      } else {
        // N-S orientation (rotated 90°)
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(3,27,26,5);
        ctx.fillStyle='#3a2008';
        ctx.fillRect(3,3,10,4); ctx.fillRect(3,25,10,4);
        ctx.fillStyle='#5a3818'; ctx.fillRect(11,3,4,4); ctx.fillRect(11,25,4,4);
        ctx.fillStyle='#7a5028'; ctx.fillRect(11,3,4,26);
        ctx.fillStyle='#5a3818'; ctx.fillRect(11,3,1,26);
        ctx.fillStyle='#c09060'; ctx.fillRect(14,2,9,28);
        ctx.fillStyle='#d4a878'; ctx.fillRect(15,3,7,26);
        ctx.fillStyle='rgba(0,0,0,0.12)';
        for (let yi = 5; yi < 28; yi += 6) ctx.fillRect(15, yi, 7, 1);
        ctx.fillStyle='#8a6040'; ctx.fillRect(14,2,2,28);
        ctx.fillStyle='#4a4848'; ctx.fillRect(16,4,5,5);
        ctx.fillStyle='#6a6a6a'; ctx.fillRect(17,5,3,3);
      }
      return;
    }

    // ── WARDROBE — tall cabinet (overhangs into tile above) ─────
    if (tile === T.FURN_WARDROBE) {
      const wp = tint ? Renderer.woodPalette(tint) : null;
      const frame    = wp ? wp.dk   : '#4a2a10';
      const body     = wp ? wp.mid  : '#5a3a18';
      const panel    = wp ? wp.lt   : '#6a4a28';
      const crown    = wp ? wp.lt   : '#7a5228';
      const crownLt  = wp ? wp.hi   : '#9a6a38';
      const crownShd = wp ? wp.dk   : '#4a2e14';
      const split    = wp ? wp.shdw : '#3a2008';
      const handle = '#d8cc88', handleShd = '#8a7a40';
      const shadow = 'rgba(0,0,0,0.35)';

      // Drop shadow at the base
      ctx.fillStyle = shadow; ctx.fillRect(3, 30, 26, 2);

      if (rot === 0) {
        // Doors face south — tall body from y=-22 to y=30, stepped crown on top
        // Pediment crown
        ctx.fillStyle=crown;    ctx.fillRect(0, -22, 32, 2);
        ctx.fillStyle=crownLt;  ctx.fillRect(1, -22, 30, 1);
        ctx.fillStyle=crownShd; ctx.fillRect(0, -20, 32, 1);
        // Cornice step
        ctx.fillStyle=crown;    ctx.fillRect(2, -19, 28, 3);
        ctx.fillStyle=crownShd; ctx.fillRect(2, -16, 28, 1);
        // Upper body (into tile above)
        ctx.fillStyle=body;     ctx.fillRect(3, -15, 26, 15);
        ctx.fillStyle=frame;    ctx.fillRect(3, -15,  2, 15);
        ctx.fillStyle=frame;    ctx.fillRect(27,-15,  2, 15);
        ctx.fillStyle=split;    ctx.fillRect(15,-15,  2, 15);
        ctx.fillStyle=panel;
        ctx.fillRect(6, -13, 8, 10);  ctx.fillRect(18, -13, 8, 10);
        // Main body in base tile
        ctx.fillStyle=body;     ctx.fillRect(3, 0, 26, 30);
        ctx.fillStyle=frame;
        ctx.fillRect(3, 0, 26, 2); ctx.fillRect(3, 28, 26, 2);
        ctx.fillRect(3, 0, 2, 30); ctx.fillRect(27, 0, 2, 30);
        ctx.fillStyle=split;    ctx.fillRect(15, 2, 2, 26);
        ctx.fillStyle=panel;
        ctx.fillRect(6, 2, 8, 12);   ctx.fillRect(18, 2, 8, 12);
        ctx.fillRect(6, 16, 8, 10);  ctx.fillRect(18, 16, 8, 10);
        // Panel inner shadows
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(6, 13, 8, 1); ctx.fillRect(18, 13, 8, 1);
        // Brass knob handles
        ctx.fillStyle=handle;    ctx.fillRect(13, 14, 2, 3); ctx.fillRect(17, 14, 2, 3);
        ctx.fillStyle=handleShd; ctx.fillRect(13, 16, 2, 1); ctx.fillRect(17, 16, 2, 1);
        // Feet
        ctx.fillStyle=crownShd;  ctx.fillRect(3, 28, 4, 2); ctx.fillRect(25, 28, 4, 2);
      } else if (rot === 1) {
        // Doors face east — side view, tall body
        ctx.fillStyle=crown;    ctx.fillRect(0, -22, 32, 2);
        ctx.fillStyle=crownLt;  ctx.fillRect(1, -22, 30, 1);
        ctx.fillStyle=crown;    ctx.fillRect(2, -19, 28, 3);
        ctx.fillStyle=crownShd; ctx.fillRect(2, -16, 28, 1);
        ctx.fillStyle=body;     ctx.fillRect(2, -15, 28, 15);
        ctx.fillStyle=frame;    ctx.fillRect(2, -15, 2, 15); ctx.fillRect(28,-15, 2, 15);
        ctx.fillStyle=split;    ctx.fillRect(4, -8, 24, 2);
        ctx.fillStyle=panel;
        ctx.fillRect(5, -13, 10, 4); ctx.fillRect(17, -13, 10, 4);
        ctx.fillRect(5, -5, 10, 5);  ctx.fillRect(17, -5, 10, 5);
        ctx.fillStyle=body;     ctx.fillRect(2, 0, 28, 30);
        ctx.fillStyle=frame;
        ctx.fillRect(2, 0, 2, 30); ctx.fillRect(28, 0, 2, 30);
        ctx.fillRect(2, 0, 28, 2); ctx.fillRect(2, 28, 28, 2);
        ctx.fillStyle=split;    ctx.fillRect(4, 15, 24, 2);
        ctx.fillStyle=panel;
        ctx.fillRect(5, 4, 10, 9); ctx.fillRect(17, 4, 10, 9);
        ctx.fillRect(5, 18, 10, 9); ctx.fillRect(17, 18, 10, 9);
        ctx.fillStyle=handle;    ctx.fillRect(15, 12, 2, 3); ctx.fillRect(15, 17, 2, 3);
        ctx.fillStyle=crownShd;  ctx.fillRect(2, 28, 4, 2); ctx.fillRect(26, 28, 4, 2);
      } else if (rot === 2) {
        // Back panel — plain paneled back, still tall
        ctx.fillStyle=crown;    ctx.fillRect(0, -22, 32, 2);
        ctx.fillStyle=crownLt;  ctx.fillRect(1, -22, 30, 1);
        ctx.fillStyle=crown;    ctx.fillRect(2, -19, 28, 3);
        ctx.fillStyle=crownShd; ctx.fillRect(2, -16, 28, 1);
        ctx.fillStyle=crownShd; ctx.fillRect(3, -15, 26, 15);
        ctx.fillStyle=frame;    ctx.fillRect(3, -15, 2, 15); ctx.fillRect(27,-15, 2, 15);
        // Nail marks upper
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(8, -10, 2, 2); ctx.fillRect(22, -10, 2, 2);
        ctx.fillStyle=crownShd; ctx.fillRect(3, 0, 26, 30);
        ctx.fillStyle=frame;
        ctx.fillRect(3, 0, 26, 2); ctx.fillRect(3, 28, 26, 2);
        ctx.fillRect(3, 0, 2, 30); ctx.fillRect(27, 0, 2, 30);
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(8, 7, 2, 2);  ctx.fillRect(22, 7, 2, 2);
        ctx.fillRect(8, 22, 2, 2); ctx.fillRect(22, 22, 2, 2);
      } else {
        // Doors face west — mirror of rot=1
        ctx.fillStyle=crown;    ctx.fillRect(0, -22, 32, 2);
        ctx.fillStyle=crownLt;  ctx.fillRect(1, -22, 30, 1);
        ctx.fillStyle=crown;    ctx.fillRect(2, -19, 28, 3);
        ctx.fillStyle=crownShd; ctx.fillRect(2, -16, 28, 1);
        ctx.fillStyle=body;     ctx.fillRect(2, -15, 28, 15);
        ctx.fillStyle=frame;    ctx.fillRect(2, -15, 2, 15); ctx.fillRect(28,-15, 2, 15);
        ctx.fillStyle=split;    ctx.fillRect(4, -8, 24, 2);
        ctx.fillStyle=panel;
        ctx.fillRect(5, -13, 10, 4); ctx.fillRect(17, -13, 10, 4);
        ctx.fillRect(5, -5, 10, 5);  ctx.fillRect(17, -5, 10, 5);
        ctx.fillStyle=body;     ctx.fillRect(2, 0, 28, 30);
        ctx.fillStyle=frame;
        ctx.fillRect(2, 0, 2, 30); ctx.fillRect(28, 0, 2, 30);
        ctx.fillRect(2, 0, 28, 2); ctx.fillRect(2, 28, 28, 2);
        ctx.fillStyle=split;    ctx.fillRect(4, 15, 24, 2);
        ctx.fillStyle=panel;
        ctx.fillRect(5, 4, 10, 9); ctx.fillRect(17, 4, 10, 9);
        ctx.fillRect(5, 18, 10, 9); ctx.fillRect(17, 18, 10, 9);
        ctx.fillStyle=handle;    ctx.fillRect(15, 12, 2, 3); ctx.fillRect(15, 17, 2, 3);
        ctx.fillStyle=crownShd;  ctx.fillRect(2, 28, 4, 2); ctx.fillRect(26, 28, 4, 2);
      }
      return;
    }

    // ── TAPESTRY ──────────────────────────────────────────────
    if (tile === T.FURN_TAPESTRY) {
      const fabric = '#7a2020', gold = '#c8a030', fringe = '#6a1818';
      const rod = '#5a4020', bracket = '#4a3018';

      if (rot === 0) {
        // Hanging on north wall, facing south (standard)
        ctx.fillStyle=rod; ctx.fillRect(3,2,26,2);
        ctx.fillStyle=bracket; ctx.fillRect(2,1,2,4); ctx.fillRect(28,1,2,4);
        ctx.fillStyle=fabric; ctx.fillRect(6,4,20,24);
        ctx.fillStyle=gold;
        ctx.fillRect(6,4,20,1); ctx.fillRect(6,27,20,1);
        ctx.fillRect(6,4,1,24); ctx.fillRect(25,4,1,24);
        ctx.fillRect(14,8,4,16); ctx.fillRect(10,13,12,4);
        ctx.fillStyle=fringe;
        ctx.fillRect(8,28,3,2); ctx.fillRect(14,28,4,2); ctx.fillRect(21,28,3,2);
      } else if (rot === 1) {
        // Hanging on east wall, facing west
        ctx.fillStyle=rod; ctx.fillRect(28,3,2,26);
        ctx.fillStyle=bracket; ctx.fillRect(27,2,4,2); ctx.fillRect(27,28,4,2);
        ctx.fillStyle=fabric; ctx.fillRect(4,6,24,20);
        ctx.fillStyle=gold;
        ctx.fillRect(4,6,1,20); ctx.fillRect(27,6,1,20);
        ctx.fillRect(4,6,24,1); ctx.fillRect(4,25,24,1);
        ctx.fillRect(8,14,16,4); ctx.fillRect(13,10,4,12);
        ctx.fillStyle=fringe;
        ctx.fillRect(2,8,2,3); ctx.fillRect(2,14,2,4); ctx.fillRect(2,21,2,3);
      } else if (rot === 2) {
        // Hanging on south wall, facing north
        ctx.fillStyle=rod; ctx.fillRect(3,28,26,2);
        ctx.fillStyle=bracket; ctx.fillRect(2,27,2,4); ctx.fillRect(28,27,2,4);
        ctx.fillStyle=fabric; ctx.fillRect(6,4,20,24);
        ctx.fillStyle=gold;
        ctx.fillRect(6,4,20,1); ctx.fillRect(6,27,20,1);
        ctx.fillRect(6,4,1,24); ctx.fillRect(25,4,1,24);
        ctx.fillRect(14,8,4,16); ctx.fillRect(10,13,12,4);
        ctx.fillStyle=fringe;
        ctx.fillRect(8,2,3,2); ctx.fillRect(14,2,4,2); ctx.fillRect(21,2,3,2);
      } else {
        // Hanging on west wall, facing east
        ctx.fillStyle=rod; ctx.fillRect(2,3,2,26);
        ctx.fillStyle=bracket; ctx.fillRect(1,2,4,2); ctx.fillRect(1,28,4,2);
        ctx.fillStyle=fabric; ctx.fillRect(4,6,24,20);
        ctx.fillStyle=gold;
        ctx.fillRect(4,6,1,20); ctx.fillRect(27,6,1,20);
        ctx.fillRect(4,6,24,1); ctx.fillRect(4,25,24,1);
        ctx.fillRect(8,14,16,4); ctx.fillRect(13,10,4,12);
        ctx.fillStyle=fringe;
        ctx.fillRect(28,8,2,3); ctx.fillRect(28,14,2,4); ctx.fillRect(28,21,2,3);
      }
      return;
    }

    // WEAPON_RACK is rendered as a wall-mount direct case in _drawTileDetail
    // (next to MEAT_HOOK / FURN_PAINTING) so the wall face renders underneath
    // and the rack's weapons sit in the y = 10..28 wall-face zone.

    // ── DISPLAY_SHELF ────────────────────────────────────────
    if (tile === T.DISPLAY_SHELF) {
      // Two-tier shelf with goods — front faces the rotation direction
      const frameDk='#3a2010', side='#4a2a14', back='#281808';
      const shelf='#5a3818', shelfHi='#7a5028', base='#4a2a14';

      function _drawShelfContents(cx) {
        // Upper shelf — potion bottles
        cx.fillStyle='#c01420'; cx.fillRect(5,8,4,7);
        cx.fillStyle='#e02830'; cx.fillRect(6,9,2,3);
        cx.fillStyle='#787878'; cx.fillRect(6,6,2,3);
        cx.fillStyle='#1438c0'; cx.fillRect(12,8,4,7);
        cx.fillStyle='#1848d8'; cx.fillRect(13,9,2,3);
        cx.fillStyle='#787878'; cx.fillRect(13,6,2,3);
        cx.fillStyle='#187018'; cx.fillRect(19,8,4,7);
        cx.fillStyle='#208820'; cx.fillRect(20,9,2,3);
        cx.fillStyle='#787878'; cx.fillRect(20,6,2,3);
        cx.fillStyle='#c8a020'; cx.fillRect(25,9,4,6);
        cx.fillStyle='#e8c030'; cx.fillRect(26,10,2,2);
        // Lower shelf — tools
        cx.fillStyle='#6a6878'; cx.fillRect(5,22,6,5);
        cx.fillStyle='#888898'; cx.fillRect(6,23,4,2);
        cx.fillStyle='#6a4828'; cx.fillRect(7,27,2,3);
        cx.fillStyle='#9a7838'; cx.fillRect(15,21,7,7);
        cx.fillStyle='#7a5820'; cx.fillRect(17,23,3,3);
        cx.fillStyle='#e8e0c8'; cx.fillRect(25,24,4,5);
        cx.fillStyle='#c04800'; cx.fillRect(26,21,2,4);
        cx.fillStyle='#f0a820'; cx.fillRect(27,22,1,2);
      }

      if (rot === 0) {
        // Front faces south (standard)
        ctx.fillStyle=frameDk; ctx.fillRect(0,0,32,32);
        ctx.fillStyle=side;
        ctx.fillRect(1,1,2,30); ctx.fillRect(29,1,2,30);
        ctx.fillStyle=back;
        ctx.fillRect(3,5,26,11); ctx.fillRect(3,20,26,11);
        ctx.fillStyle=base; ctx.fillRect(1,30,30,2);
        ctx.fillStyle=shelf;
        ctx.fillRect(1,1,30,5); ctx.fillRect(1,16,30,5);
        ctx.fillStyle=shelfHi;
        ctx.fillRect(2,2,28,1); ctx.fillRect(2,17,28,1);
        _drawShelfContents(ctx);
      } else if (rot === 2) {
        // Front faces north (back panel visible from south)
        ctx.fillStyle=frameDk; ctx.fillRect(0,0,32,32);
        ctx.fillStyle=side;
        ctx.fillRect(1,1,2,30); ctx.fillRect(29,1,2,30);
        ctx.fillStyle='#4a2e14'; ctx.fillRect(3,3,26,26);
        ctx.fillStyle=base; ctx.fillRect(1,0,30,2);
        ctx.fillStyle=shelf;
        ctx.fillRect(1,27,30,5); ctx.fillRect(1,12,30,5);
        ctx.fillStyle=shelfHi;
        ctx.fillRect(2,28,28,1); ctx.fillRect(2,13,28,1);
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(8,7,2,2); ctx.fillRect(22,7,2,2);
        ctx.fillRect(8,20,2,2); ctx.fillRect(22,20,2,2);
      } else if (rot === 1) {
        // Front faces east (side view from south)
        ctx.fillStyle=frameDk; ctx.fillRect(0,0,32,32);
        ctx.fillStyle=side;
        ctx.fillRect(1,1,30,2); ctx.fillRect(1,29,30,2);
        ctx.fillStyle=back;
        ctx.fillRect(5,3,11,26); ctx.fillRect(20,3,11,26);
        ctx.fillStyle=base; ctx.fillRect(0,1,2,30);
        ctx.fillStyle=shelf;
        ctx.fillRect(1,1,5,30); ctx.fillRect(16,1,5,30);
        ctx.fillStyle=shelfHi;
        ctx.fillRect(2,2,1,28); ctx.fillRect(17,2,1,28);
        // Simplified side-view items
        ctx.fillStyle='#c01420'; ctx.fillRect(8,5,3,4);
        ctx.fillStyle='#1438c0'; ctx.fillRect(8,11,3,4);
        ctx.fillStyle='#187018'; ctx.fillRect(8,17,3,4);
        ctx.fillStyle='#6a6878'; ctx.fillRect(22,5,5,3);
        ctx.fillStyle='#9a7838'; ctx.fillRect(22,12,4,4);
        ctx.fillStyle='#e8e0c8'; ctx.fillRect(23,20,3,4);
      } else {
        // Front faces west
        ctx.fillStyle=frameDk; ctx.fillRect(0,0,32,32);
        ctx.fillStyle=side;
        ctx.fillRect(1,1,30,2); ctx.fillRect(1,29,30,2);
        ctx.fillStyle=back;
        ctx.fillRect(5,3,11,26); ctx.fillRect(20,3,11,26);
        ctx.fillStyle=base; ctx.fillRect(30,1,2,30);
        ctx.fillStyle=shelf;
        ctx.fillRect(11,1,5,30); ctx.fillRect(26,1,5,30);
        ctx.fillStyle=shelfHi;
        ctx.fillRect(12,2,1,28); ctx.fillRect(27,2,1,28);
        ctx.fillStyle='#c01420'; ctx.fillRect(21,5,3,4);
        ctx.fillStyle='#1438c0'; ctx.fillRect(21,11,3,4);
        ctx.fillStyle='#187018'; ctx.fillRect(21,17,3,4);
        ctx.fillStyle='#6a6878'; ctx.fillRect(5,5,5,3);
        ctx.fillStyle='#9a7838'; ctx.fillRect(6,12,4,4);
        ctx.fillStyle='#e8e0c8'; ctx.fillRect(6,20,3,4);
      }
      return;
    }

    // ── STOOL ───────────────────────────────────────────────
    if (tile === T.FURN_STOOL) {
      const wp = tint ? Renderer.woodPalette(tint) : null;
      const legC   = wp ? wp.shdw : '#2e1008';
      const seatC  = wp ? wp.mid  : '#8b5e3c';
      const seatHi = wp ? wp.hi   : '#a67844';
      const shadC  = wp ? wp.dk   : '#5a3010';
      ctx.fillStyle = legC;   ctx.fillRect(4, 24, 3, 6);  // left leg
      ctx.fillRect(14, 24, 3, 8);                         // mid leg (front)
      ctx.fillRect(25, 24, 3, 6);                         // right leg
      ctx.fillStyle = seatC;  ctx.fillRect(3, 19, 26, 6); // seat
      ctx.fillStyle = seatHi; ctx.fillRect(4, 20, 24, 2); // seat top highlight
      ctx.fillStyle = shadC;  ctx.fillRect(3, 24, 26, 1); // seat underside shadow
      return;
    }

    // ── THRONE — ornate high-backed chair ───────────────────
    if (tile === T.FURN_THRONE) {
      // Gilded throne with a tall crowned backrest — extends into tile above.
      const goldDk = '#8a6818', gold = '#c8a227', goldLt = '#f1cc40';
      const wood   = '#6a4410', woodShd = '#3a1808';
      const cushDk = '#8a2222', cushMd = '#b83030', cushLt = '#e05050';

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(4, 30, 24, 2);

      // ── Crown pinnacles (top of sprite) ────────────
      // Central peak (tallest)
      ctx.fillStyle = gold;   ctx.fillRect(15, -28, 2, 6);
      ctx.fillStyle = goldLt; ctx.fillRect(15, -28, 1, 4);
      ctx.fillStyle = goldDk; ctx.fillRect(14, -24, 4, 2);
      // Side spikes
      ctx.fillStyle = gold;   ctx.fillRect(9, -24, 2, 5); ctx.fillRect(21, -24, 2, 5);
      ctx.fillStyle = goldDk; ctx.fillRect(8, -20, 4, 2); ctx.fillRect(20, -20, 4, 2);
      // Small outer spikes
      ctx.fillStyle = gold;   ctx.fillRect(5, -20, 2, 3); ctx.fillRect(25, -20, 2, 3);

      // ── Tall backrest frame (from y=-18 to y=20) ────
      ctx.fillStyle = wood;    ctx.fillRect(5, -18, 22, 38);
      ctx.fillStyle = gold;    ctx.fillRect(5, -18, 22, 4);    // gold crown band
      ctx.fillStyle = goldLt;  ctx.fillRect(6, -17, 20, 1);    // band highlight
      ctx.fillStyle = goldDk;  ctx.fillRect(5, -14, 22, 1);    // band shadow
      // Gold pilasters running down the sides
      ctx.fillStyle = gold;    ctx.fillRect(5, -14, 3, 34); ctx.fillRect(24, -14, 3, 34);
      ctx.fillStyle = goldLt;  ctx.fillRect(5, -14, 1, 34); ctx.fillRect(24, -14, 1, 34);
      ctx.fillStyle = goldDk;  ctx.fillRect(7, -14, 1, 34); ctx.fillRect(26, -14, 1, 34);

      // Velvet backrest cushion
      ctx.fillStyle = cushDk;  ctx.fillRect(8, -12, 16, 28);
      ctx.fillStyle = cushMd;  ctx.fillRect(9, -11, 14, 26);
      ctx.fillStyle = cushLt;  ctx.fillRect(10, -10, 12, 3);   // top sheen
      ctx.fillStyle = cushLt;  ctx.fillRect(10, -5, 4, 12);    // left sheen stripe
      // Gold buttons on cushion
      ctx.fillStyle = gold;
      ctx.fillRect(12, -6, 2, 2); ctx.fillRect(18, -6, 2, 2);
      ctx.fillRect(12, 2, 2, 2);  ctx.fillRect(18, 2, 2, 2);
      ctx.fillRect(15, -2, 2, 2);                               // center button

      // ── Seat (base tile) ───────────────────────────
      ctx.fillStyle = wood;    ctx.fillRect(3, 20, 26, 8);
      ctx.fillStyle = gold;    ctx.fillRect(3, 20, 26, 2);      // gold trim
      ctx.fillStyle = goldLt;  ctx.fillRect(3, 20, 26, 1);
      ctx.fillStyle = cushMd;  ctx.fillRect(5, 22, 22, 5);      // seat cushion
      ctx.fillStyle = cushLt;  ctx.fillRect(6, 22, 20, 1);      // sheen
      ctx.fillStyle = cushDk;  ctx.fillRect(5, 26, 22, 1);      // cushion shadow edge

      // Gilded lion-paw legs
      ctx.fillStyle = woodShd; ctx.fillRect(3, 28, 5, 4); ctx.fillRect(24, 28, 5, 4);
      ctx.fillStyle = gold;    ctx.fillRect(3, 28, 5, 1); ctx.fillRect(24, 28, 5, 1);
      // Claw detail
      ctx.fillStyle = goldDk;
      ctx.fillRect(3, 30, 2, 1); ctx.fillRect(6, 30, 2, 1);
      ctx.fillRect(24, 30, 2, 1); ctx.fillRect(27, 30, 2, 1);
      return;
    }

    // FURN_PAINTING is rendered as a direct case in _drawTileDetail so the
    // wall face draws beneath it via the PROP_TILES pipeline. It is NOT in
    // FURN_SET and NOT handled here.

    // ── VASE — floor vase with a tall flower bouquet (overhangs up) ──
    if (tile === T.FURN_VASE) {
      const vaseDk  = '#2a2032', vaseMd = '#3a2d44', vaseLt = '#4a3854';
      const vaseShd = '#18121f';
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.fillRect(10, 30, 12, 2);

      // ── Ceramic vase (occupies y = 5..31) ──────────────────
      ctx.fillStyle = vaseDk;
      ctx.fillRect(11, 28, 10, 3);   // foot base
      ctx.fillRect(13, 24, 6, 4);    // stem
      ctx.fillRect(9, 14, 14, 11);   // belly
      ctx.fillRect(10, 11, 12, 4);   // shoulder
      ctx.fillRect(12, 7, 8, 5);     // neck
      ctx.fillRect(11, 5, 10, 3);    // lip
      // Left highlight stripe
      ctx.fillStyle = vaseLt; ctx.fillRect(11, 11, 2, 14);
      ctx.fillStyle = vaseMd; ctx.fillRect(10, 7, 1, 18);
      // Right shadow
      ctx.fillStyle = vaseShd; ctx.fillRect(22, 11, 1, 14);
      // Floral band — blue ring
      ctx.fillStyle = '#3a6aa8'; ctx.fillRect(10, 18, 12, 3);
      ctx.fillStyle = '#5a8ac8'; ctx.fillRect(11, 19, 10, 1);
      // Lip highlight
      ctx.fillStyle = vaseLt; ctx.fillRect(12, 5, 8, 1);
      // Broad sheen
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(11, 8, 2, 14);

      // ── Tall bouquet rising into tile above ───────────────
      // Stems
      ctx.fillStyle = '#1e5a20';
      ctx.fillRect(13, 2, 1, 4);  ctx.fillRect(16, 0, 1, 6);
      ctx.fillRect(19, 1, 1, 5);
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(12, -4, 1, 8); ctx.fillRect(17, -8, 1, 14);
      ctx.fillRect(20, -2, 1, 8);
      // Leaves on stems
      ctx.fillStyle = '#2e7a32';
      ctx.fillRect(11, -2, 3, 1); ctx.fillRect(12, -5, 2, 1);
      ctx.fillRect(18, -4, 3, 1); ctx.fillRect(18, -10, 2, 1);
      ctx.fillRect(21, 0, 2, 1);
      // Small filler greenery
      ctx.fillStyle = '#4a9040';
      ctx.fillRect(14, -3, 1, 1); ctx.fillRect(19, -6, 1, 1);
      // Flower heads — a bigger bouquet reaching up into the tile above
      // Red rose (left-front)
      ctx.fillStyle = '#8a1a10'; ctx.fillRect(11, -8, 4, 4);
      ctx.fillStyle = '#d02828'; ctx.fillRect(12, -8, 3, 3);
      ctx.fillStyle = '#f05050'; ctx.fillRect(12, -7, 1, 1);
      // Yellow (tallest, centre)
      ctx.fillStyle = '#a07400'; ctx.fillRect(15, -18, 5, 5);
      ctx.fillStyle = '#e8c030'; ctx.fillRect(16, -17, 3, 3);
      ctx.fillStyle = '#f8e060'; ctx.fillRect(16, -17, 1, 1);
      // Pink daisy (right)
      ctx.fillStyle = '#a04070'; ctx.fillRect(19, -12, 4, 4);
      ctx.fillStyle = '#e070a0'; ctx.fillRect(20, -12, 3, 3);
      ctx.fillStyle = '#ffcce0'; ctx.fillRect(20, -11, 1, 1);
      // White blossom (top-left)
      ctx.fillStyle = '#c8c8c8'; ctx.fillRect(9,  -14, 3, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(10, -14, 2, 2);
      ctx.fillStyle = '#d0a020'; ctx.fillRect(10, -13, 1, 1);  // centre
      // Small red bud (top-right)
      ctx.fillStyle = '#8a1a10'; ctx.fillRect(22, -18, 2, 2);
      ctx.fillStyle = '#e04040'; ctx.fillRect(22, -18, 1, 1);
      return;
    }

    // ── NIGHTSTAND — small bedside table with drawer ────────
    if (tile === T.FURN_NIGHTSTAND) {
      ctx.fillStyle = '#5a3a18'; ctx.fillRect(3, 10, 26, 18);  // body
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(3, 10, 26, 3);   // top face
      ctx.fillStyle = '#8a5a28'; ctx.fillRect(4, 10, 24, 1);   // top highlight
      ctx.fillStyle = '#3a2008'; ctx.fillRect(3, 28, 26, 2);   // bottom shadow
      // Drawer outline
      ctx.fillStyle = '#3a2008'; ctx.fillRect(5, 15, 22, 1);
      ctx.fillRect(5, 22, 22, 1);
      // Drawer handle
      ctx.fillStyle = '#c8a227'; ctx.fillRect(15, 18, 2, 2);
      ctx.fillStyle = '#e0b840'; ctx.fillRect(15, 18, 1, 1);
      // Legs
      ctx.fillStyle = '#2e1008'; ctx.fillRect(3, 28, 3, 3);
      ctx.fillRect(26, 28, 3, 3);
      // Small lamp on top — warm glow
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(14, 7, 4, 3);    // lamp base
      ctx.fillStyle = '#e8c874'; ctx.fillRect(13, 3, 6, 5);    // shade
      ctx.fillStyle = 'rgba(255,220,100,0.35)';
      ctx.fillRect(11, 4, 10, 6);                              // soft light
      return;
    }

    // ── FLOWER PATCH — garden cluster ───────────────────────
    if (tile === T.FURN_FLOWER_PATCH) {
      // Soil mound
      ctx.fillStyle = '#3a2410'; ctx.fillRect(4, 22, 24, 7);
      ctx.fillStyle = '#5a3818'; ctx.fillRect(5, 23, 22, 2);
      // Leaves
      ctx.fillStyle = '#2e5a22'; ctx.fillRect(6, 14, 4, 9);
      ctx.fillRect(13, 12, 4, 11);
      ctx.fillRect(22, 14, 4, 9);
      ctx.fillStyle = '#4a8a3a'; ctx.fillRect(7, 15, 2, 7);
      ctx.fillRect(14, 13, 2, 9);
      ctx.fillRect(23, 15, 2, 7);
      // Flowers — red / yellow / pink
      ctx.fillStyle = '#c0392b'; ctx.fillRect(6, 10, 4, 4);
      ctx.fillStyle = '#e05050'; ctx.fillRect(7, 11, 2, 2);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(13, 8, 4, 4);
      ctx.fillStyle = '#fce070'; ctx.fillRect(14, 9, 2, 2);
      ctx.fillStyle = '#e83b9b'; ctx.fillRect(22, 10, 4, 4);
      ctx.fillStyle = '#f070c0'; ctx.fillRect(23, 11, 2, 2);
      // Little buds
      ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 17, 2, 2);
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(26, 17, 2, 2);
      return;
    }

    // ── CLOCK — tall grandfather clock (64 px, overhangs into tile above) ──
    if (tile === T.FURN_CLOCK) {
      // Sprite spans y = -32 .. 32 in tile-local coords; OVERHANG_TILES
      // ensures the post-pass paints it on top of the already-rendered scene.
      // Color palette
      const woodDk  = '#2a1008';
      const woodMd  = '#4a2010';
      const woodLt  = '#6a3018';
      const woodShd = '#1a0804';
      const gold    = '#c8a227';
      const goldLt  = '#e0b840';
      const goldShd = '#8a6818';
      const faceBg  = '#e8dcb0';
      const faceShd = '#b8ac88';

      // Drop shadow pooled at the base
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(7, 30, 18, 2);

      // ── Pediment / crown cornice (top of sprite) ──────────
      // Decorative arched bonnet
      ctx.fillStyle = gold;    ctx.fillRect(10, -30, 12, 2);   // top finial cap
      ctx.fillStyle = goldLt;  ctx.fillRect(11, -30, 10, 1);
      ctx.fillStyle = goldShd; ctx.fillRect(10, -29, 12, 1);
      // Tapered crown
      ctx.fillStyle = woodDk; ctx.fillRect(9,  -28, 14, 2);
      ctx.fillStyle = woodMd; ctx.fillRect(10, -28, 12, 1);
      ctx.fillStyle = gold;   ctx.fillRect(8,  -26, 16, 2);    // cornice gold band
      ctx.fillStyle = goldLt; ctx.fillRect(8,  -26, 16, 1);
      ctx.fillStyle = goldShd;ctx.fillRect(8,  -25, 16, 1);

      // ── Bonnet / hood (holds the clock face) ───────────────
      ctx.fillStyle = woodDk; ctx.fillRect(9,  -24, 14, 16);
      ctx.fillStyle = woodMd; ctx.fillRect(10, -24, 12, 14);
      ctx.fillStyle = woodLt; ctx.fillRect(10, -24, 1,  14);   // left highlight
      ctx.fillStyle = woodShd;ctx.fillRect(21, -24, 1,  14);   // right shadow

      // Gold-trimmed round clock face (recessed panel)
      ctx.fillStyle = gold;   ctx.fillRect(10, -22, 12, 1);    // face rim top
      ctx.fillRect(10, -10, 12, 1);                            // face rim bottom
      ctx.fillRect(10, -22, 1, 13);                            // rim left
      ctx.fillRect(21, -22, 1, 13);                            // rim right
      ctx.fillStyle = faceBg; ctx.fillRect(11, -21, 10, 10);
      // Inner face shading (subtle rounded look via corner chamfers)
      ctx.fillStyle = faceShd;
      ctx.fillRect(11, -21, 10, 1);                            // face shadow top
      ctx.fillRect(11, -12, 10, 1);                            // face shadow bot
      ctx.fillRect(11, -21, 1,  10);
      ctx.fillRect(20, -21, 1,  10);
      // Hour markers — 12/3/6/9
      ctx.fillStyle = '#1a0804';
      ctx.fillRect(15, -20, 2, 1);   // 12
      ctx.fillRect(19, -16, 1, 2);   // 3
      ctx.fillRect(15, -13, 2, 1);   // 6
      ctx.fillRect(12, -16, 1, 2);   // 9
      // Clock hands — point to roughly 10:10 (classic watch pose)
      ctx.fillStyle = woodDk;
      ctx.fillRect(15, -19, 1, 4);                             // minute hand (up-ish)
      ctx.fillRect(12, -16, 4, 1);                             // hour hand (left)
      ctx.fillStyle = gold;  ctx.fillRect(15, -16, 1, 1);       // centre pin

      // ── Neck / moulding between bonnet and waist ──────────
      ctx.fillStyle = woodDk; ctx.fillRect(9,  -8, 14, 2);
      ctx.fillStyle = gold;   ctx.fillRect(8,  -7, 16, 1);
      ctx.fillStyle = goldShd;ctx.fillRect(8,  -6, 16, 1);
      ctx.fillStyle = woodDk; ctx.fillRect(10, -5, 12, 2);

      // ── Waist cabinet (pendulum window lives here) ─────────
      ctx.fillStyle = woodDk; ctx.fillRect(10, -3, 12, 25);
      ctx.fillStyle = woodMd; ctx.fillRect(11, -3, 10, 25);
      ctx.fillStyle = woodLt; ctx.fillRect(11, -3, 1,  25);    // left highlight
      ctx.fillStyle = woodShd;ctx.fillRect(20, -3, 1,  25);    // right shadow

      // Pendulum window — glass pane with gold surround
      ctx.fillStyle = gold;   ctx.fillRect(12, 0, 8, 1);        // window top
      ctx.fillRect(12, 19, 8, 1);                              // window bottom
      ctx.fillRect(12, 0, 1, 20);                              // left
      ctx.fillRect(19, 0, 1, 20);                              // right
      ctx.fillStyle = '#120604';                               // deep interior
      ctx.fillRect(13, 1, 6, 18);
      // Subtle glass highlight
      ctx.fillStyle = 'rgba(240,220,140,0.10)';
      ctx.fillRect(13, 1, 2, 18);

      // Animated pendulum — swings on a short arc
      const swing = Math.sin(this.time * 2.2);                 // ~2.2 rad/s
      const pendX = 16 + Math.round(swing * 2);                // -2..+2 px
      ctx.fillStyle = gold;   ctx.fillRect(pendX, 2, 1, 13);    // rod
      ctx.fillStyle = goldLt; ctx.fillRect(pendX - 2, 14, 5, 3);// bob
      ctx.fillStyle = gold;   ctx.fillRect(pendX - 2, 16, 5, 1);
      ctx.fillStyle = goldShd;ctx.fillRect(pendX - 2, 17, 5, 1);

      // ── Base plinth ───────────────────────────────────────
      ctx.fillStyle = woodDk; ctx.fillRect(8,  22, 16, 8);
      ctx.fillStyle = woodMd; ctx.fillRect(9,  22, 14, 7);
      ctx.fillStyle = gold;   ctx.fillRect(8,  23, 16, 1);     // moulding highlight
      ctx.fillStyle = goldShd;ctx.fillRect(8,  24, 16, 1);
      // Carved bottom moulding
      ctx.fillStyle = woodDk; ctx.fillRect(8,  28, 16, 1);
      ctx.fillStyle = woodShd;ctx.fillRect(8,  29, 16, 1);
      // Feet
      ctx.fillStyle = woodDk; ctx.fillRect(8,  30, 3,  1);
      ctx.fillRect(21, 30, 3, 1);
      return;
    }

    // ── LANTERN — tall iron floor lantern (overhangs upward) ────
    if (tile === T.FURN_LANTERN) {
      const iron = '#2a2a2a', ironLt = '#4a4a4a', ironDk = '#121212';
      // Flicker the flame slightly
      const flick = Math.sin(this.time * 9) * 0.5 + 0.5;  // 0..1

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(11, 30, 10, 2);

      // Broad iron plinth base (3 tiers)
      ctx.fillStyle = iron;   ctx.fillRect(10, 28, 12, 3);
      ctx.fillStyle = ironDk; ctx.fillRect(10, 30, 12, 1);
      ctx.fillStyle = iron;   ctx.fillRect(11, 26, 10, 2);
      ctx.fillStyle = ironLt; ctx.fillRect(11, 26, 10, 1);
      ctx.fillStyle = iron;   ctx.fillRect(12, 24, 8, 2);

      // Tall stem reaching upward
      ctx.fillStyle = iron;   ctx.fillRect(15, -8, 2, 32);
      ctx.fillStyle = ironLt; ctx.fillRect(15, -8, 1, 32);
      // Decorative finial ring at mid-stem
      ctx.fillStyle = iron;   ctx.fillRect(14, 10, 4, 2);
      ctx.fillStyle = ironLt; ctx.fillRect(14, 10, 4, 1);

      // Bracket arm + mounting
      ctx.fillStyle = iron;   ctx.fillRect(13, -10, 6, 2);

      // Lantern head — now sits up in the tile above (y = -24..-10)
      ctx.fillStyle = iron;   ctx.fillRect(9, -24, 14, 14);     // head body
      ctx.fillRect(10, -26, 12, 2);                             // cap brim
      ctx.fillRect(11, -28, 10, 2);                             // cap top
      ctx.fillStyle = ironLt; ctx.fillRect(10, -26, 12, 1);
      ctx.fillStyle = ironDk; ctx.fillRect(9, -12, 14, 1);
      // Spire finial on cap
      ctx.fillStyle = iron;   ctx.fillRect(15, -31, 2, 3);
      ctx.fillStyle = ironLt; ctx.fillRect(15, -31, 1, 3);

      // Glass panels (inside head)
      ctx.fillStyle = '#f8e090'; ctx.fillRect(11, -22, 10, 10);
      ctx.fillStyle = 'rgba(255,200,80,0.55)';
      ctx.fillRect(10, -23, 12, 12);
      // Window crossbars
      ctx.fillStyle = ironDk; ctx.fillRect(9, -18, 14, 1); ctx.fillRect(15, -22, 2, 10);

      // Flame — animated
      const fh = 3 + Math.round(flick);            // 3..4 px tall
      ctx.fillStyle = '#e06020'; ctx.fillRect(15, -18, 2, fh);
      ctx.fillStyle = '#f8c040'; ctx.fillRect(15, -17, 2, 1);
      ctx.fillStyle = '#ffe070'; ctx.fillRect(15, -16, 1, 1);

      // Soft glow halo around the head (additive-feeling)
      ctx.fillStyle = 'rgba(255,200,80,0.14)';
      ctx.fillRect(2, -28, 28, 22);
      ctx.fillStyle = 'rgba(255,220,120,0.10)';
      ctx.fillRect(5, -24, 22, 16);
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
     OVERHANG TILE SORTABLES  (tall furniture drawn with the entity layer
     so depth-sort produces correct front/back occlusion — e.g. a player
     standing north of a grandfather clock appears behind its crown.)
     Pushes one sortable per visible OVERHANG tile into `outArr`.
     Each sortable has { y, h, draw(ctx) } — sort key is y + h.
     ═══════════════════════════════════════════════════════ */
  collectOverhangSortables(world, startCol, startRow, endCol, endRow, outArr) {
    if (!this._overhangPool) this._overhangPool = [];
    const self = this;
    // Iterate one row past the bottom so a tall sprite just below the
    // viewport still contributes its crown into view.
    let idx = 0;
    for (let r = startRow; r <= endRow + 1; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = world.getTile(c, r);
        if (!OVERHANG_TILES.has(tile)) continue;
        let s = this._overhangPool[idx];
        if (!s) {
          // Route through _drawTileDetail so both FURN_SET dispatch (e.g.
          // clock, wardrobe) and direct cases (e.g. weapon_case using
          // world.displayContent) render the same way.
          s = { y:0, h:0, tpx:0, tpy:0, c:0, r:0, tile:0, world:null,
                draw(ctx) {
                  self._drawTileDetail(ctx, this.tile, this.tpx, this.tpy, this.c, this.r, this.world);
                } };
          this._overhangPool[idx] = s;
        }
        const px = c * TILE_SIZE, py = r * TILE_SIZE;
        // Sprite top reaches up one tile; height spans 2 tiles; sort key
        // (y + h) equals the base tile's bottom edge, so entities south of
        // the base tile draw over it and entities north draw behind it.
        s.tile  = tile;
        s.c     = c;
        s.r     = r;
        s.world = world;
        s.tpx   = px;
        s.tpy   = py;
        s.y     = py - TILE_SIZE;
        s.h     = TILE_SIZE * 2;
        outArr.push(s);
        idx++;
      }
    }
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

    // Background — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, panelW, panelH);

    // Title
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Skills', px + panelW / 2, py + 22);

    // Total level
    ctx.fillStyle = '#a08848';
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

    // ── Panel background — shared bronze frame with a rarity accent line ──
    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });
    ctx.fillStyle = color;
    ctx.fillRect(px + 4, py + 3, PW - 8, 1);
    this.drawCloseButton(ctx, px, py, PW);

    // ── Header ───────────────────────────────────────────
    const HICON = 42;
    this._drawSkillIcon(ctx, skillId, px + PAD, py + PAD, HICON);

    ctx.fillStyle = color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(name, px + PAD + HICON + 12, py + PAD + 16);

    ctx.fillStyle = '#f0e8d0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Level ${level} / 100`, px + PAD + HICON + 12, py + PAD + 34);

    ctx.fillStyle = '#8a7050';
    ctx.font = '11px monospace';
    const xpText = level >= 100
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
  drawCircleMinimap(world, player, mouseX = -1, mouseY = -1) {
    const ctx = this.ctx;
    const RADIUS = 110;
    const TILE_PX = 3;
    const mapAvailable = !!world;  // minimap + map button only render when a world is provided

    // Outer integrated HUD panel — holds the minimap, map button, HP bar,
    // and (when inside the player house) the BUILD button in a new row below.
    const PANEL_W = 246, PANEL_H = this.getMinimapPanelHeight(world);
    const panelX = this.canvas.width - PANEL_W - 4;
    const panelY = 10;
    const cx = panelX + Math.floor(PANEL_W / 2);  // minimap centered in panel
    const cy = RADIUS + 14;

    // ── Bronze frame (matches side-panel trim) ────────────
    // Panel base
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(panelX, panelY, PANEL_W, PANEL_H);
    // Outermost hard black edge
    ctx.fillStyle = '#050301';
    ctx.fillRect(panelX - 5, panelY - 5, PANEL_W + 10, 1);
    ctx.fillRect(panelX - 5, panelY + PANEL_H + 4, PANEL_W + 10, 1);
    ctx.fillRect(panelX - 5, panelY - 5, 1, PANEL_H + 10);
    ctx.fillRect(panelX + PANEL_W + 4, panelY - 5, 1, PANEL_H + 10);
    // Gold sheen top/left, dark shadow bottom/right
    ctx.fillStyle = '#e8b858';
    ctx.fillRect(panelX - 4, panelY - 4, PANEL_W + 8, 1);
    ctx.fillRect(panelX - 4, panelY - 4, 1, PANEL_H + 8);
    ctx.fillStyle = '#2a1608';
    ctx.fillRect(panelX - 4, panelY + PANEL_H + 3, PANEL_W + 8, 1);
    ctx.fillRect(panelX + PANEL_W + 3, panelY - 4, 1, PANEL_H + 8);
    // Bronze band — 3px, highlight top/left, shadow bottom/right
    ctx.fillStyle = '#a07028';
    ctx.fillRect(panelX - 3, panelY - 3, PANEL_W + 6, 3);
    ctx.fillRect(panelX - 3, panelY - 3, 3, PANEL_H + 6);
    ctx.fillStyle = '#5a3810';
    ctx.fillRect(panelX - 3, panelY + PANEL_H, PANEL_W + 6, 3);
    ctx.fillRect(panelX + PANEL_W, panelY - 3, 3, PANEL_H + 6);
    // Inner bronze sheen line
    ctx.fillStyle = '#c89040';
    ctx.fillRect(panelX, panelY, PANEL_W, 1);
    ctx.fillRect(panelX, panelY, 1, PANEL_H);
    ctx.fillStyle = '#7a5018';
    ctx.fillRect(panelX, panelY + PANEL_H - 1, PANEL_W, 1);
    ctx.fillRect(panelX + PANEL_W - 1, panelY, 1, PANEL_H);
    // Inner recess line
    ctx.strokeStyle = '#0a0604';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 1.5, panelY + 1.5, PANEL_W - 3, PANEL_H - 3);

    const span = Math.ceil(RADIUS / TILE_PX) + 1;

    if (mapAvailable) {
      const pcol = Math.floor(player.cx / TILE_SIZE);
      const prow = Math.floor(player.cy / TILE_SIZE);
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
    } else {
      // No world map available (interior / raid / dungeon) — fill the circle
      // with a dim crosshatch so the HUD reads as "map not available here".
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2);
      ctx.fillStyle = 'rgba(90,56,16,0.35)';
      for (let i = -RADIUS; i <= RADIUS; i += 6) {
        ctx.fillRect(cx - RADIUS, cy + i, RADIUS * 2, 1);
      }
      ctx.restore();
      ctx.fillStyle = '#6a5030';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('— INTERIOR —', cx, cy);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }

    // Thin dark inner ring — just enough to separate the circular map from
    // the bronze frame around it (no standalone gold ring — the outer frame
    // now serves that role, so everything reads as one HUD piece).
    ctx.strokeStyle = 'rgba(10,6,2,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS + 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Divider between the minimap and the button/HP row — same gold/dark
    // double-rule used under the tab bar in the side panel.
    const dividerY = cy + RADIUS + 2; // just below the minimap circle
    ctx.fillStyle = '#c89030';
    ctx.fillRect(panelX + 4, dividerY, PANEL_W - 8, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(panelX + 4, dividerY + 1, PANEL_W - 8, 1);

    // Corner bronze rivets — same treatment as the side panel.
    const rivet = (rx, ry) => {
      ctx.fillStyle = '#1c0c04'; ctx.fillRect(rx - 1, ry - 1, 7, 7);
      ctx.fillStyle = '#3a2008'; ctx.fillRect(rx, ry, 5, 5);
      ctx.fillStyle = '#e0b050'; ctx.fillRect(rx + 1, ry + 1, 3, 3);
      ctx.fillStyle = '#fff1c0'; ctx.fillRect(rx + 1, ry + 1, 1, 1);
      ctx.fillStyle = '#6a4010'; ctx.fillRect(rx + 3, ry + 3, 1, 1);
    };
    rivet(panelX + 4,              panelY + 4);
    rivet(panelX + PANEL_W - 9,    panelY + 4);
    rivet(panelX + 4,              panelY + PANEL_H - 9);
    rivet(panelX + PANEL_W - 9,    panelY + PANEL_H - 9);

    // ── Map icon button (below the minimap) ───────────────
    const mb = this.getMapButtonRect();
    const hoverMap = mapAvailable &&
                     mouseX >= mb.x && mouseX <= mb.x + mb.w &&
                     mouseY >= mb.y && mouseY <= mb.y + mb.h;

    // Button body + bevel (same bronze treatment as View Character / Log Out).
    // When the map isn't available, render it in a muted, disabled state.
    ctx.fillStyle = !mapAvailable ? '#1a120a'
                  : hoverMap       ? '#4a3414'
                  :                  '#2a1c08';
    ctx.fillRect(mb.x, mb.y, mb.w, mb.h);
    ctx.fillStyle = !mapAvailable ? '#3a2410'
                  : hoverMap       ? '#c89040'
                  :                  '#8a5c20';
    ctx.fillRect(mb.x, mb.y, mb.w, 1);
    ctx.fillRect(mb.x, mb.y, 1, mb.h);
    ctx.fillStyle = '#1a0e04';
    ctx.fillRect(mb.x, mb.y + mb.h - 1, mb.w, 1);
    ctx.fillRect(mb.x + mb.w - 1, mb.y, 1, mb.h);

    // Folded-map icon (parchment square with fold lines + red pin)
    const ix = mb.x + 6, iy = mb.y + 6, iw = 20, ih = mb.h - 12;
    ctx.globalAlpha = mapAvailable ? 1 : 0.45;
    ctx.fillStyle = '#e8d08a';
    ctx.fillRect(ix, iy, iw, ih);
    ctx.strokeStyle = '#8a6028';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
    ctx.strokeStyle = 'rgba(138,96,40,0.55)';
    ctx.beginPath();
    ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw / 2, iy + ih);
    ctx.moveTo(ix, iy + ih / 2); ctx.lineTo(ix + iw, iy + ih / 2);
    ctx.stroke();
    // Red location pin
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(ix + iw / 2 - 1, iy + 3, 3, 3);
    ctx.fillRect(ix + iw / 2, iy + 6, 1, 3);
    ctx.globalAlpha = 1;

    // "MAP" label to the right of icon
    ctx.fillStyle = !mapAvailable ? '#6a5030'
                  : hoverMap       ? '#fff1c0'
                  :                  '#f0d090';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('MAP', ix + iw + 6, mb.y + mb.h / 2);
    ctx.textBaseline = 'alphabetic';

    // ── Build-mode button (only when in the player house) ───
    if (world?.id === 'player_house') {
      const bb = this.getBuildButtonRect();
      const hoverBuild = mouseX >= bb.x && mouseX <= bb.x + bb.w &&
                         mouseY >= bb.y && mouseY <= bb.y + bb.h;
      // Button body (same bronze bevel)
      ctx.fillStyle = hoverBuild ? '#4a3414' : '#2a1c08';
      ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
      ctx.fillStyle = hoverBuild ? '#c89040' : '#8a5c20';
      ctx.fillRect(bb.x, bb.y, bb.w, 1);
      ctx.fillRect(bb.x, bb.y, 1, bb.h);
      ctx.fillStyle = '#1a0e04';
      ctx.fillRect(bb.x, bb.y + bb.h - 1, bb.w, 1);
      ctx.fillRect(bb.x + bb.w - 1, bb.y, 1, bb.h);

      // Center the icon+label group inside the wider button.
      //   Icon occupies ~20 px wide, gap 6, label "BUILD" ~40 px → group ~66 px
      const GROUP_W = 66;
      const groupX  = bb.x + Math.floor((bb.w - GROUP_W) / 2);
      const hx = groupX, hy = bb.y + 6, hh = bb.h - 12;

      // Hammer icon (wood handle + grey head)
      ctx.fillStyle = '#8a5a28';
      for (let i = 0; i < 10; i++) ctx.fillRect(hx + 3 + i, hy + hh - 2 - i, 2, 2);
      ctx.fillStyle = '#6a4018';
      for (let i = 0; i < 10; i++) ctx.fillRect(hx + 3 + i, hy + hh - 1 - i, 1, 1);
      // Hammer head (steel block at upper-right end of handle)
      ctx.fillStyle = '#6a7080';
      ctx.fillRect(hx + 11, hy + 1, 9, 7);
      ctx.fillStyle = '#9aa0b0';
      ctx.fillRect(hx + 11, hy + 1, 9, 2);   // top shine
      ctx.fillStyle = '#3a4050';
      ctx.fillRect(hx + 11, hy + 7, 9, 1);   // bottom shadow
      // Claw tips on left side of head
      ctx.fillStyle = '#4a5260';
      ctx.fillRect(hx + 10, hy + 2, 1, 2); ctx.fillRect(hx + 10, hy + 5, 1, 2);

      // "BUILD" label — right of icon, same baseline
      ctx.fillStyle = hoverBuild ? '#fff1c0' : '#f0d090';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('BUILD', hx + 24, bb.y + bb.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
  }

  /** Shared rect for the world-map button (used by renderer + hit-test).
   *  Kept in sync with the HUD panel in drawCircleMinimap. */
  getMapButtonRect() {
    const RADIUS = 110;
    const cy = RADIUS + 14;
    const PANEL_W = 246;
    const panelX = this.canvas.width - PANEL_W - 4;
    const MB_W = 60, MB_H = 28;
    return {
      x: panelX + 8,              // 8px padding inside the panel
      y: cy + RADIUS + 6,         // below the minimap + divider
      w: MB_W,
      h: MB_H,
    };
  }

  /** Shared rect for the Build-mode button — a full-width bar in its own row
   *  directly below the HP bar inside the minimap HUD panel. Only drawn when
   *  the player is inside their house (see drawCircleMinimap). */
  getBuildButtonRect() {
    const mb = this.getMapButtonRect();
    const PANEL_W = 246;
    const panelX = this.canvas.width - PANEL_W - 4;
    const BB_H = 28;
    // Sits below the MAP/HP row with a 6px gap.
    return { x: panelX + 8, y: mb.y + mb.h + 6, w: PANEL_W - 16, h: BB_H };
  }

  /** Total pixel height of the minimap HUD panel. Grows by one button row
   *  when the player is inside their house so the BUILD button fits. */
  getMinimapPanelHeight(world) {
    return world?.id === 'player_house' ? 300 : 262;
  }

  /* ═══════════════════════════════════════════════════════
     UNIFIED SIDE PANEL (bottom-right)
     ═══════════════════════════════════════════════════════ */
  drawSidePanel(activeTab, inventory, skills, equipment, dragSlot, hoverSlot, dragX, dragY, mouseX, mouseY, showLogout = false) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    const PW = 254;
    const TAB_H = 28;
    const CONTENT_H = 386;
    const FOOTER_H = 30;
    const PH = TAB_H + CONTENT_H + FOOTER_H + 4;
    const px = W - PW - 4;
    const py = H - PH - 4;

    // ── Ornate panel frame ────────────────────────────────
    // Layered bronze-and-black frame (≈6px thick): outermost hard black rule,
    // gold sheen on the lit edge / dark rule on the shadow edge, 3px bronze
    // band (highlight top/left, shadow bottom/right), inner dark recess line,
    // then corner rivets. Gives the panel a medieval metal-trim feel.
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(px, py, PW, PH);

    // Outermost hard black edge — 1px rule, 5px outside the panel
    ctx.fillStyle = '#050301';
    ctx.fillRect(px - 5, py - 5, PW + 10, 1);
    ctx.fillRect(px - 5, py + PH + 4, PW + 10, 1);
    ctx.fillRect(px - 5, py - 5, 1, PH + 10);
    ctx.fillRect(px + PW + 4, py - 5, 1, PH + 10);

    // Gold sheen on top/left, dark shadow on bottom/right — 1px at offset -4
    ctx.fillStyle = '#e8b858';
    ctx.fillRect(px - 4, py - 4, PW + 8, 1);
    ctx.fillRect(px - 4, py - 4, 1, PH + 8);
    ctx.fillStyle = '#2a1608';
    ctx.fillRect(px - 4, py + PH + 3, PW + 8, 1);
    ctx.fillRect(px + PW + 3, py - 4, 1, PH + 8);

    // Bronze trim — 3px band, highlight top/left, shadow bottom/right
    ctx.fillStyle = '#a07028';
    ctx.fillRect(px - 3, py - 3, PW + 6, 3);           // top highlight
    ctx.fillRect(px - 3, py - 3, 3, PH + 6);           // left highlight
    ctx.fillStyle = '#5a3810';
    ctx.fillRect(px - 3, py + PH, PW + 6, 3);          // bottom shadow
    ctx.fillRect(px + PW, py - 3, 3, PH + 6);          // right shadow

    // Inner bronze sheen — 1px bright line just inside the trim (catches the light)
    ctx.fillStyle = '#c89040';
    ctx.fillRect(px, py, PW, 1);
    ctx.fillRect(px, py, 1, PH);
    ctx.fillStyle = '#7a5018';
    ctx.fillRect(px, py + PH - 1, PW, 1);
    ctx.fillRect(px + PW - 1, py, 1, PH);

    // Inner recess line — a single dark rule to separate trim from content
    ctx.strokeStyle = '#0a0604';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1.5, py + 1.5, PW - 3, PH - 3);

    // Corner rivets (5×5 bronze studs with dark border). Drawn further below
    // so they sit on top of the tab bar at the top and the footer at the bottom.
    const rivet = (rx, ry) => {
      ctx.fillStyle = '#1c0c04';
      ctx.fillRect(rx - 1, ry - 1, 7, 7);      // outer border
      ctx.fillStyle = '#3a2008';
      ctx.fillRect(rx, ry, 5, 5);              // base
      ctx.fillStyle = '#e0b050';
      ctx.fillRect(rx + 1, ry + 1, 3, 3);      // bronze stud
      ctx.fillStyle = '#fff1c0';
      ctx.fillRect(rx + 1, ry + 1, 1, 1);      // hot highlight
      ctx.fillStyle = '#6a4010';
      ctx.fillRect(rx + 3, ry + 3, 1, 1);      // shadow pit
    };

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

    // ── Footer: logout button attached to the HUD ─────────
    // The footer's top is flush with the content area; a gold separator above
    // mirrors the one under the tab bar so the whole panel reads as one frame.
    const footerY = py + TAB_H + CONTENT_H + 4;
    if (showLogout) {
      // Separator (double line, gold over dark) — same treatment as above
      ctx.fillStyle = '#c89030';
      ctx.fillRect(px + 2, footerY, PW - 4, 1);
      ctx.fillStyle = '#080503';
      ctx.fillRect(px + 2, footerY + 1, PW - 4, 1);

      const btnX = px + 10;
      const btnY = footerY + 5;
      const btnW = PW - 20;
      const btnH = 20;
      const hover = mouseX >= btnX && mouseX <= btnX + btnW &&
                    mouseY >= btnY && mouseY <= btnY + btnH;

      // Button body — oxblood red
      ctx.fillStyle = hover ? '#5a1414' : '#2a0808';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      // Top/left highlight, bottom/right shadow (matches HUD bevel direction)
      ctx.fillStyle = hover ? '#b04040' : '#7a2020';
      ctx.fillRect(btnX, btnY, btnW, 1);
      ctx.fillRect(btnX, btnY, 1, btnH);
      ctx.fillStyle = '#1a0404';
      ctx.fillRect(btnX, btnY + btnH - 1, btnW, 1);
      ctx.fillRect(btnX + btnW - 1, btnY, 1, btnH);
      // Label
      ctx.fillStyle = hover ? '#ffd0d0' : '#e07070';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Log Out', btnX + btnW / 2, btnY + btnH / 2);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    }

    // Corner bronze rivets — sit on top of the tab bar at top, and on the
    // footer at the bottom. Break up the straight edges of the frame.
    rivet(px + 4,         py + 4);
    rivet(px + PW - 9,    py + 4);
    rivet(px + 4,         py + PH - 9);
    rivet(px + PW - 9,    py + PH - 9);

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

          // Medium-gray slot fill with a soft top highlight + bottom shadow for depth.
          ctx.fillStyle = isDropTarget ? '#c4b06c'
                        : isHovered    ? '#a8a8a8'
                        :                '#8e8e8e';
          ctx.fillRect(cx2, cy2, CELL, CELL);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(cx2, cy2, CELL, 1);
          ctx.fillRect(cx2, cy2, 1, CELL);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(cx2, cy2 + CELL - 1, CELL, 1);
          ctx.fillRect(cx2 + CELL - 1, cy2, 1, CELL);

          // Slot border
          ctx.strokeStyle = isDropTarget ? '#f1c40f' : '#2a1a08';
          ctx.lineWidth = isDropTarget ? 2 : 1;
          ctx.strokeRect(cx2, cy2, CELL, CELL);

          if (isDragging) continue;
          const slot = inventory.slots[idx];
          if (slot) {
            slot.item.draw(ctx, cx2 + 3, cy2 + 3, CELL - 6);

            if (slot.qty > 1) {
              const q = slot.qty;
              const qStr = q >= 10_000_000 ? `${Math.floor(q / 1_000_000)}M`
                         : q >= 100_000    ? `${Math.floor(q / 1_000)}K`
                         : q >= 10_000     ? `${Math.floor(q / 1_000)}K`
                         :                   q.toString();
              const qCol = q >= 10_000_000 ? '#00ff80'
                         : q >= 100_000    ? '#ffffff'
                         :                   '#ffff00';
              ctx.font = 'bold 11px monospace';
              ctx.textAlign = 'left';
              ctx.lineJoin = 'round';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 3;
              ctx.strokeText(qStr, cx2 + 2, cy2 + 11);
              ctx.fillStyle = qCol;
              ctx.fillText(qStr, cx2 + 2, cy2 + 11);
              ctx.lineJoin = 'miter';
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
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'left';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(qStr, gx + 2, gy + 11);
          ctx.fillStyle = '#ffff00';
          ctx.fillText(qStr, gx + 2, gy + 11);
          ctx.lineJoin = 'miter';
        }
      }
    }

    // ── Skills tab — 4×5 icon grid ────────────────────────
    if (activeTab === 'skills') {
      const COLS = 4, ROWS = 5;
      const TOTAL_CELLS = COLS * ROWS;
      const HEADER_H = 22;
      const cellW = Math.floor(PW / COLS);
      const cellH = Math.floor((CONTENT_H - HEADER_H) / ROWS);

      // "Total Level" header — bright gold, outlined so it reads clearly
      // against the dark panel and matches the bronze frame theme.
      const totalStr = `Total Level: ${skills.totalLevel}`;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(totalStr, px + PW / 2, contentY + 15);
      ctx.fillStyle = '#f0d090';
      ctx.fillText(totalStr, px + PW / 2, contentY + 15);
      ctx.lineJoin = 'miter';

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

        // Level number under each icon — outlined so it stays readable on any cell tint
        ctx.font = `bold 14px monospace`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(`${level}`, cx2 + cellW / 2, cy2 + cellH - 5);
        ctx.fillStyle = hovered ? '#fff1c0' : '#f0d090';
        ctx.fillText(`${level}`, cx2 + cellW / 2, cy2 + cellH - 5);
        ctx.lineJoin = 'miter';
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
        ctx.fillText(`Level:       ${level} / 100`, ttx + 10, tty + 36);
        ctx.fillText(`Total XP:    ${xp.toLocaleString()}`, ttx + 10, tty + 51);
        ctx.fillText(
          level >= 100 ? 'XP to next:  MAX' : `XP to next:  ${toNext.toLocaleString()}`,
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

        // Row hover tint — brighter so the hovered row is clearly the click target.
        if (hovered && !isEmpty) {
          ctx.fillStyle = 'rgba(200,144,48,0.16)';
          ctx.fillRect(px + 2, ry + 1, PW - 4, ROW_H - 2);
        }

        // Row separator
        ctx.fillStyle = '#5a3810';
        ctx.fillRect(px + 6, ry, PW - 12, 1);

        // Item icon box — dark inset matching the skills cells
        const iconX = px + 8;
        const iconY = ry + Math.floor((ROW_H - ICON_SIZE) / 2);
        ctx.fillStyle = '#120c06';
        ctx.fillRect(iconX, iconY, ICON_SIZE, ICON_SIZE);
        ctx.strokeStyle = '#5a3810';
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

        // Slot label — bright bronze, outlined so it pops on either empty or filled rows
        const labelX = px + ICON_SIZE + 16;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(LABELS[slot], labelX, ry + ROW_H / 2 - 4);
        ctx.fillStyle = '#e8b858';
        ctx.fillText(LABELS[slot], labelX, ry + ROW_H / 2 - 4);

        // Equipped item name — bright cream or rarity color, outlined for readability
        const gearEntry = isEmpty ? null : GEAR_BY_ID.get(equipped);
        const displayName = isEmpty ? 'Empty'
          : gearEntry ? gearEntry.name
          : equipped.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const rarityColor = gearEntry?.rarity?.color ?? null;

        ctx.font = isEmpty ? 'italic 11px monospace' : 'bold 11px monospace';
        ctx.strokeText(displayName, labelX, ry + ROW_H / 2 + 11);
        ctx.fillStyle = isEmpty ? '#8a7050' : (rarityColor ?? '#f0d090');
        ctx.fillText(displayName, labelX, ry + ROW_H / 2 + 11);
        ctx.lineJoin = 'miter';

        // Unequip hint on hover
        if (!isEmpty && hovered) {
          ctx.fillStyle = '#ff8860';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('unequip', px + PW - 8, ry + ROW_H - 5);
        }
      });

      // View Character button — bronze theme matching the rest of the HUD
      const vbY = contentY + SLOTS.length * ROW_H + 6;
      const vbH = 26;
      const vbHov = mouseX >= px + 8 && mouseX < px + PW - 8 &&
                    mouseY >= vbY && mouseY < vbY + vbH;

      // Button body + bevel (same treatment as the Log Out button)
      ctx.fillStyle = vbHov ? '#4a3414' : '#2a1c08';
      ctx.fillRect(px + 8, vbY, PW - 16, vbH);
      ctx.fillStyle = vbHov ? '#c89040' : '#8a5c20';
      ctx.fillRect(px + 8, vbY, PW - 16, 1);
      ctx.fillRect(px + 8, vbY, 1, vbH);
      ctx.fillStyle = '#1a0e04';
      ctx.fillRect(px + 8, vbY + vbH - 1, PW - 16, 1);
      ctx.fillRect(px + PW - 9, vbY, 1, vbH);
      ctx.fillStyle = vbHov ? '#fff1c0' : '#f0d090';
      ctx.font = 'bold 12px monospace';
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

    // Top-left: tile coordinates + FPS inside a bronze HUD frame.
    const COORD_W = 190, COORD_H = 24;
    const COORD_X = 8, COORD_Y = 8;
    this.drawBronzeFrame(ctx, COORD_X, COORD_Y, COORD_W, COORD_H);
    const col = Math.floor(player.cx / TILE_SIZE);
    const row = Math.floor(player.cy / TILE_SIZE);
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Tile: (${col}, ${row})   FPS: ${fps}`, COORD_X + 10, COORD_Y + COORD_H / 2);
    ctx.textBaseline = 'alphabetic';

    // HP bar shares a row with the map button inside the minimap HUD panel.
    // The outer frame is drawn by drawCircleMinimap, so the bar sits directly
    // on that panel's dark base — no separate backdrop here.
    const hpRatio  = Math.max(0, Math.min(1, player.hp / player.maxHp));
    const critical = hpRatio <= 0.25;
    const MM_RADIUS = 110;
    const MM_CY = MM_RADIUS + 14;
    const HUD_PANEL_W = 246;
    const HUD_PANEL_X = this.canvas.width - HUD_PANEL_W - 4;
    const HP_PW = 164, HP_PH = 28;
    const HP_PX = HUD_PANEL_X + HUD_PANEL_W - HP_PW - 8; // right-aligned inside panel (8px pad)
    const HP_PY = MM_CY + MM_RADIUS + 6;
    const BAR_X = HP_PX + 26, BAR_Y = HP_PY + 6;
    const BAR_W = HP_PW - 34, BAR_H = 16;

    ctx.save();

    // Bar track
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.roundRect(BAR_X, BAR_Y, BAR_W, BAR_H, 3);
    ctx.fill();

    // Bar fill — gradient shifts green→orange→red
    if (hpRatio > 0) {
      const grad = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W * hpRatio, 0);
      if (hpRatio > 0.5) {
        grad.addColorStop(0, '#145c22'); grad.addColorStop(1, '#27ae60');
      } else if (hpRatio > 0.25) {
        grad.addColorStop(0, '#8b3a00'); grad.addColorStop(1, '#e67e22');
      } else {
        grad.addColorStop(0, '#5c0000'); grad.addColorStop(1, '#e74c3c');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(BAR_X, BAR_Y, BAR_W * hpRatio, BAR_H, 3);
      ctx.fill();
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(BAR_X, BAR_Y, BAR_W * hpRatio, BAR_H / 2);
    }

    // Heart icon — pulses red when critical
    if (critical) ctx.globalAlpha = 0.65 + 0.35 * Math.abs(Math.sin(Date.now() / 350));
    ctx.font = '15px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = critical ? '#e74c3c' : '#c0392b';
    ctx.fillText('♥', HP_PX + 13, HP_PY + HP_PH / 2);
    ctx.globalAlpha = 1;

    // HP text
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2);

    ctx.restore();

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
  /** Rich multi-line item tooltip used when hovering an inventory slot.
   *  Shows: name (gold), rarity (rarity color), wrapped description, then
   *  extras (weight / stats / requirements). */
  drawItemTooltip(item, screenX, screenY) {
    const lore = getItemLore(item);
    if (!lore) return;

    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const PAD    = 10;
    const NAME_H = 18;     // name line height
    const LINE_H = 14;     // body/extra line height
    const SEP_H  = 4;      // gap before extras block

    // Measure to decide tooltip width (bounded to avoid huge tooltips)
    ctx.font = 'bold 13px monospace';
    let contentW = ctx.measureText(lore.name).width;
    ctx.font = 'bold 11px monospace';
    contentW = Math.max(contentW, ctx.measureText(lore.rarity.label).width);
    for (const e of lore.extras) {
      ctx.font = '11px monospace';
      const s = `${e.label}:  ${e.value}`;
      contentW = Math.max(contentW, ctx.measureText(s).width);
    }
    const MAX_DESC_W = 240;
    const descW = Math.min(MAX_DESC_W, Math.max(contentW, 180));

    ctx.font = '11px monospace';
    const descLines = this._wrapLine(ctx, lore.description, descW);
    for (const l of descLines) contentW = Math.max(contentW, ctx.measureText(l).width);

    const TW = Math.ceil(contentW + PAD * 2);
    const extrasBlockH = lore.extras.length > 0 ? SEP_H + lore.extras.length * LINE_H : 0;
    const TH = PAD + NAME_H + LINE_H + descLines.length * LINE_H + extrasBlockH + PAD;

    // Position near cursor, flip if near edges
    let tx = screenX + 16;
    let ty = screenY + 16;
    if (tx + TW > W - 8) tx = screenX - TW - 12;
    if (ty + TH > H - 8) ty = Math.max(8, H - TH - 8);
    if (tx < 8) tx = 8;
    if (ty < 8) ty = 8;

    // Bronze frame matches the rest of the HUD
    this.drawBronzeFrame(ctx, tx, ty, TW, TH);

    // Rarity accent line across the top (inside the frame)
    ctx.fillStyle = lore.rarity.color;
    ctx.fillRect(tx + 4, ty + 3, TW - 8, 1);

    let y = ty + PAD;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Name — bold cream with soft outline for readability
    ctx.font = 'bold 13px monospace';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(lore.name, tx + PAD, y);
    ctx.fillStyle = '#f0d090';
    ctx.fillText(lore.name, tx + PAD, y);
    y += NAME_H;

    // Rarity line
    ctx.font = 'bold 11px monospace';
    ctx.strokeText(lore.rarity.label, tx + PAD, y);
    ctx.fillStyle = lore.rarity.color;
    ctx.fillText(lore.rarity.label, tx + PAD, y);
    y += LINE_H;

    // Description
    ctx.font = '11px monospace';
    ctx.fillStyle = '#e8dcb0';
    for (const line of descLines) {
      ctx.fillText(line, tx + PAD, y);
      y += LINE_H;
    }

    // Extras (weight / stats / requirements)
    if (lore.extras.length > 0) {
      y += SEP_H;
      for (const e of lore.extras) {
        const labelStr = `${e.label}:`;
        ctx.fillStyle = '#a08848';
        ctx.fillText(labelStr, tx + PAD, y);
        const labelW = ctx.measureText(labelStr).width;
        ctx.fillStyle = e.color || '#f0e8d0';
        ctx.fillText(String(e.value), tx + PAD + labelW + 6, y);
        y += LINE_H;
      }
    }

    ctx.lineJoin = 'miter';
    ctx.textBaseline = 'alphabetic';
  }

  /** Minimal word-wrap helper used by drawItemTooltip. */
  _wrapLine(ctx, text, maxWidth) {
    if (!text) return [''];
    const words = text.split(/\s+/);
    const out = [];
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (ctx.measureText(candidate).width > maxWidth && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  }

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
  drawShopPanel(shopTab, shopStock, inventory, title = 'General Store', scroll = 0) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const px = Math.floor((W - SHOP_PW) / 2);
    const py = Math.floor((H - SHOP_PH) / 2);

    // Dim background overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);

    // Panel background — shared bronze frame matching the HUD theme
    this.drawBronzeFrame(ctx, px, py, SHOP_PW, SHOP_PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, SHOP_PW);

    // Header — title
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(title, px + 12, py + 24);

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

    // Build item list for the active tab
    const VIEWPORT_H = 8 * SHOP_ROW_H;
    let rows;
    if (shopTab === 'buy') {
      rows = shopStock.map(s => ({ item: s.item, price: s.buyPrice, qty: null, afford: gold }));
    } else {
      const sellable = inventory.slots.filter(s => s && SELL_PRICES[s.item.id] !== undefined);
      rows = sellable.map(s => {
        const qty = s.item.stackable ? s.qty : 1;
        return { item: s.item, price: SELL_PRICES[s.item.id] * qty, qty: qty > 1 ? qty : null, afford: Infinity };
      });
    }

    // Clamp scroll to actual content
    const totalH   = rows.length * SHOP_ROW_H;
    const maxScroll = Math.max(0, totalH - VIEWPORT_H);
    const sc        = Math.min(scroll, maxScroll);

    // Clip to content viewport so rows don't bleed outside the panel
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, contentY, SHOP_PW, VIEWPORT_H);
    ctx.clip();

    if (rows.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Nothing to sell', px + SHOP_PW / 2, contentY + SHOP_ROW_H - sc);
    } else {
      for (let i = 0; i < rows.length; i++) {
        const ry = contentY + i * SHOP_ROW_H - sc;
        if (ry + SHOP_ROW_H < contentY || ry > contentY + VIEWPORT_H) continue;
        const r = rows[i];
        this._drawShopRow(ctx, px, ry, SHOP_PW, SHOP_ROW_H, r.item, r.price, r.qty, r.afford, shopTab === 'buy' ? 'Buy' : 'Sell');
      }
    }

    ctx.restore();

    // Scrollbar
    if (totalH > VIEWPORT_H) {
      const SBW   = 4;
      const sbX   = px + SHOP_PW - SBW - 2;
      const thumbH = Math.max(24, VIEWPORT_H * VIEWPORT_H / totalH);
      const thumbY = contentY + (sc / maxScroll) * (VIEWPORT_H - thumbH);
      ctx.fillStyle = 'rgba(90,64,16,0.35)';
      ctx.fillRect(sbX, contentY, SBW, VIEWPORT_H);
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(sbX, thumbY, SBW, thumbH);
    }
  }

  /* ═══════════════════════════════════════════════════════
     FORGE PANELS — Smelting (Furnace) & Smithing (Anvil)
     ═══════════════════════════════════════════════════════ */

  /** Draw one crafting recipe row: icon, name/level, ingredients, Craft button. */
  _drawForgeRow(ctx, px, rowY, pw, rowH, recipe, canCraft, skillLevel, smithMode = false) {
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

    const btnRowY = rowY + Math.floor((rowH - 24) / 2);

    if (smithMode) {
      // Single "Smith" button
      const bx = px + pw - 70;
      const enabled = !locked && canCraft;
      ctx.fillStyle = enabled ? '#1a3a5a' : '#141414';
      this._roundRect(ctx, bx, btnRowY, 62, 24, 4);
      ctx.fill();
      ctx.strokeStyle = enabled ? '#4a7ab7' : '#2a2a2a';
      ctx.lineWidth = 1;
      this._roundRect(ctx, bx, btnRowY, 62, 24, 4);
      ctx.stroke();
      ctx.fillStyle = enabled ? '#78b4ff' : '#445566';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Smith', bx + 31, btnRowY + 16);
    } else {
      // Quantity buttons: 1× | 5× | 15×
      const BTN_W = 38, BTN_GAP = 3;
      const SMELT_QTYS = [
        { qty: 1,  label: '1×',  levelReq: 1  },
        { qty: 5,  label: '5×',  levelReq: 10 },
        { qty: 15, label: '15×', levelReq: 25 },
      ];
      for (let i = 0; i < SMELT_QTYS.length; i++) {
        const q = SMELT_QTYS[i];
        const bx = px + pw - 8 - (SMELT_QTYS.length - i) * BTN_W - (SMELT_QTYS.length - i - 1) * BTN_GAP;
        const qLocked = skillLevel < q.levelReq;
        const enabled  = !locked && !qLocked && canCraft;
        ctx.fillStyle = enabled ? '#7a3a00' : (qLocked ? '#141414' : '#2a2020');
        this._roundRect(ctx, bx, btnRowY, BTN_W, 24, 4);
        ctx.fill();
        ctx.strokeStyle = enabled ? '#b7410e' : (qLocked ? '#2a2a2a' : '#443030');
        ctx.lineWidth = 1;
        this._roundRect(ctx, bx, btnRowY, BTN_W, 24, 4);
        ctx.stroke();
        if (qLocked) {
          ctx.fillStyle = '#444';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(q.label, bx + BTN_W / 2, btnRowY + 10);
          ctx.fillStyle = '#553333';
          ctx.font = '8px monospace';
          ctx.fillText(`lv${q.levelReq}`, bx + BTN_W / 2, btnRowY + 20);
        } else {
          ctx.fillStyle = enabled ? '#ff8c42' : '#665544';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(q.label, bx + BTN_W / 2, btnRowY + 16);
        }
      }
    }
  }

  drawSmeltPanel(recipes, inventory, skills) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - FORGE_PW) / 2);
    const py = Math.floor((H - SMELT_PH) / 2);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, FORGE_PW, SMELT_PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, FORGE_PW);

    // Flame accent strip along top (inside the frame)
    const grad = ctx.createLinearGradient(px, py, px + FORGE_PW, py);
    grad.addColorStop(0, 'rgba(183,65,14,0)');
    grad.addColorStop(0.5, 'rgba(255,140,66,0.25)');
    grad.addColorStop(1, 'rgba(183,65,14,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px + 3, py + 3, FORGE_PW - 6, FORGE_HEADER_H - 3);

    // Header
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 Furnace — Smelting', px + 12, py + 26);
    ctx.fillStyle = '#a08848';
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

  drawSmithPanel(recipes, tab, inventory, skills, scrollOffset = 0) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - FORGE_PW) / 2);
    const py = Math.floor((H - SMITH_PH) / 2);

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Panel bg — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, FORGE_PW, SMITH_PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, FORGE_PW);

    // Steel accent strip (inside the frame)
    const grad2 = ctx.createLinearGradient(px, py, px + FORGE_PW, py);
    grad2.addColorStop(0, 'rgba(74,122,183,0)');
    grad2.addColorStop(0.5, 'rgba(120,180,255,0.18)');
    grad2.addColorStop(1, 'rgba(74,122,183,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(px + 3, py + 3, FORGE_PW - 6, FORGE_HEADER_H - 3);

    // Header
    ctx.fillStyle = '#78b4ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚒ Anvil — Smithing', px + 12, py + 26);
    ctx.fillStyle = '#a08848';
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

    // Recipe rows — clipped scrollable area
    const tabRecipes = recipes[tab] || [];
    const totalH = tabRecipes.length * FORGE_ROW_H;
    const scrollW = 10; // scrollbar width

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, contentY, FORGE_PW, SMITH_CONTENT_H);
    ctx.clip();

    for (let i = 0; i < tabRecipes.length; i++) {
      const rowY = contentY + i * FORGE_ROW_H - scrollOffset;
      if (rowY + FORGE_ROW_H < contentY || rowY > contentY + SMITH_CONTENT_H) continue;
      const recipe = tabRecipes[i];
      const canCraft = recipe.inputs.every(({ item, qty }) =>
        inventory.count(item().id) >= qty
      );
      this._drawForgeRow(ctx, px, rowY, FORGE_PW - scrollW, FORGE_ROW_H,
        recipe, canCraft, forgeLevel, true);
    }

    ctx.restore();

    // Scrollbar
    if (totalH > SMITH_CONTENT_H) {
      const trackX = px + FORGE_PW - scrollW - 2;
      const trackY = contentY;
      const trackH = SMITH_CONTENT_H;
      // Track
      ctx.fillStyle = 'rgba(20,25,35,0.8)';
      this._roundRect(ctx, trackX, trackY, scrollW, trackH, 4);
      ctx.fill();
      // Thumb
      const thumbH = Math.max(24, trackH * (SMITH_CONTENT_H / totalH));
      const thumbY = trackY + (trackH - thumbH) * (scrollOffset / (totalH - SMITH_CONTENT_H));
      ctx.fillStyle = '#4a7ab7';
      this._roundRect(ctx, trackX, thumbY, scrollW, thumbH, 4);
      ctx.fill();
    }
  }

  /* ═══════════════════════════════════════════════════════
     CHEST STORAGE PANEL
     ═══════════════════════════════════════════════════════ */

  drawChestPanel(chestSlots, inventory) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // Panel dimensions (must match _handleChestClick constants)
    const CHEST_PW = 390, CHEST_PH = 356, CHEST_HEADER = 58;
    const CELL = 36, PAD = 4, COLS = 4, ROWS = 7;
    const GRID_W = COLS * CELL + (COLS - 1) * PAD; // 156

    const px = Math.floor((W - CHEST_PW) / 2);
    const py = Math.floor((H - CHEST_PH) / 2);
    const leftX  = px + 14;
    const rightX = px + CHEST_PW - 14 - GRID_W;
    const gridY  = py + CHEST_HEADER;

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    // Panel background — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, CHEST_PW, CHEST_PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, CHEST_PW);

    // Amber gradient accent along top
    const grad = ctx.createLinearGradient(px, py, px + CHEST_PW, py);
    grad.addColorStop(0,   'rgba(100,60,5,0)');
    grad.addColorStop(0.5, 'rgba(180,120,30,0.2)');
    grad.addColorStop(1,   'rgba(100,60,5,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, CHEST_PW, CHEST_HEADER);

    // Header — chest icon drawn by hand
    const iconCX = px + 22, iconCY = py + 29;
    // Chest body
    ctx.fillStyle = '#8b6200';
    ctx.fillRect(iconCX - 10, iconCY - 7, 20, 14);
    // Lid (slightly lighter)
    ctx.fillStyle = '#a07828';
    ctx.fillRect(iconCX - 10, iconCY - 11, 20, 5);
    // Brass latch
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(iconCX - 3, iconCY - 4, 6, 6);
    // Lock keyhole
    ctx.fillStyle = '#3a2a00';
    ctx.beginPath();
    ctx.arc(iconCX, iconCY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8c060';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Chest Storage', px + 38, py + 26);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Click an item to transfer it  •  ESC to close', px + 38, py + 42);

    // Divider below header
    ctx.strokeStyle = '#6a4a10';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + CHEST_HEADER - 1);
    ctx.lineTo(px + CHEST_PW - 10, py + CHEST_HEADER - 1);
    ctx.stroke();

    // Column labels
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c8a850';
    ctx.fillText('Your Inventory', leftX  + GRID_W / 2, gridY - 6);
    ctx.fillText('Chest', rightX + GRID_W / 2, gridY - 6);

    // Vertical divider between grids
    const divX = px + CHEST_PW / 2;
    ctx.strokeStyle = 'rgba(160,120,40,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(divX, py + CHEST_HEADER + 10);
    ctx.lineTo(divX, py + CHEST_PH - 10);
    ctx.stroke();

    // Draw a grid of slots
    const drawGrid = (slots, startX) => {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = r * COLS + c;
          const cx = startX + c * (CELL + PAD);
          const cy = gridY   + r * (CELL + PAD);

          // Slot background
          ctx.fillStyle = 'rgba(55,42,20,0.75)';
          this._roundRect(ctx, cx, cy, CELL, CELL, 4);
          ctx.fill();
          ctx.strokeStyle = 'rgba(130,95,30,0.45)';
          ctx.lineWidth = 1;
          this._roundRect(ctx, cx, cy, CELL, CELL, 4);
          ctx.stroke();

          // Item
          const slot = slots[idx];
          if (slot) {
            slot.item.draw(ctx, cx + 2, cy + 2, CELL - 4);
            if (slot.qty > 1) {
              ctx.fillStyle = '#f1c40f';
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'left';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.strokeText(slot.qty.toString(), cx + 2, cy + 11);
              ctx.fillText(slot.qty.toString(), cx + 2, cy + 11);
            }
          }
        }
      }
    };

    drawGrid(inventory.slots, leftX);
    drawGrid(chestSlots,      rightX);
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

    // Panel bg — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, PW);
    void elapsed; // no longer used for animated border

    // Header
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Character', px + 14, py + 28);
    ctx.fillStyle = '#8a7050';
    ctx.font = '10px monospace';
    ctx.fillText('Click outside or the ✕ to close', px + 14, py + 44);

    // Header divider — gold over dark double rule
    ctx.fillStyle = '#c89030';
    ctx.fillRect(px + 8, py + 51, PW - 16, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(px + 8, py + 52, PW - 16, 1);

    // ── Left: character preview ──
    const charW = 200;
    const charH = PH - 62;
    const charX = px + 8;
    const charY = py + 56;

    // Inset bronze-framed portrait box to match the rest of the HUD.
    this.drawBronzeFrame(ctx, charX, charY, charW, charH);

    // Draw player character (scaled up, clipped). Force front-facing pose
    // and suppress the name tag + any action animation so the preview is
    // a clean portrait regardless of the live player state.
    const SCALE = 3.5;
    const charCX = charX + charW / 2;
    const charCY = charY + charH * 0.44;

    const prevDir          = player.dir;
    const prevAction       = player.currentAction;
    const prevLocked       = player.actionLocked;
    const prevHideName     = player.hideNameTag;
    const prevHideShadow   = player.hideShadow;
    player.dir             = 0; // DIR.DOWN — face forward
    player.currentAction   = 'idle';
    player.actionLocked    = false;
    player.hideNameTag     = true;
    player.hideShadow      = true;

    ctx.save();
    ctx.beginPath();
    ctx.rect(charX + 2, charY + 2, charW - 4, charH - 4);
    ctx.clip();
    ctx.translate(charCX - (player.x + player.w / 2) * SCALE,
                  charCY - (player.y + player.h / 2) * SCALE);
    ctx.scale(SCALE, SCALE);
    player.draw(ctx);
    ctx.restore();

    player.dir           = prevDir;
    player.currentAction = prevAction;
    player.actionLocked  = prevLocked;
    player.hideNameTag   = prevHideName;
    player.hideShadow    = prevHideShadow;

    // Pedestal — bronze-toned ellipse under the feet
    ctx.fillStyle = 'rgba(140,96,48,0.35)';
    ctx.beginPath();
    ctx.ellipse(charX + charW / 2, charCY + player.h * SCALE * 0.56, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.fillStyle = '#e8b858';
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

    // Shared bronze-framed column
    this.drawBronzeFrame(ctx, totalsX, totalsY, totalsColW, totalsH);

    // Column header
    ctx.fillStyle = '#f0d090';
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

      // Divider — subtle bronze hairline
      ctx.strokeStyle = 'rgba(200,144,48,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(totalsX + 4, ry); ctx.lineTo(totalsX + totalsColW - 4, ry);
      ctx.stroke();

      // Label
      ctx.fillStyle = sr.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sr.label, totalsX + 5, ry + 11);

      // Value — cream if non-zero, muted bronze if zero/default
      ctx.fillStyle = sr.nonZero ? '#f0d090' : '#6a5030';
      ctx.font = `bold ${sr.nonZero ? 12 : 10}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(sr.dispVal, totalsX + totalsColW - 4, ry + rowSlotH - 5);
    }

    // ── Combat stats section ──
    const statsY = slotsStartY + numSlots * slotRowH + 14;

    // Gold/dark double rule separator (matches the tab bar divider).
    ctx.fillStyle = '#c89030';
    ctx.fillRect(rightX, statsY,     rightW, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(rightX, statsY + 1, rightW, 1);

    ctx.fillStyle = '#e8b858';
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
      const bw = colW - 4, bh = 68;

      // Shared bronze-framed stat box + skill-color accent line at the top.
      this.drawBronzeFrame(ctx, bx, by, bw, bh);
      ctx.fillStyle = sc.color;
      ctx.fillRect(bx + 3, by + 3, bw - 6, 1);

      ctx.fillStyle = sc.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sc.label, bx + bw / 2, by + 13);

      ctx.fillStyle = '#f0d090';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${sc.level}`, bx + bw / 2, by + 40);

      if (sc.bonus > 0) {
        ctx.fillStyle = '#8bc34a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`+${sc.bonus}${sc.bonusLabel ? ' ' + sc.bonusLabel : ''}`, bx + bw / 2, by + 58);
      } else {
        ctx.fillStyle = '#6a5030';
        ctx.font = '9px monospace';
        ctx.fillText(sc.bonusLabel ? 'no ' + sc.bonusLabel : '—', bx + bw / 2, by + 58);
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

    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });

    // Inner top accent glow — warm ember sweep across the top of the frame
    const topGrad = ctx.createLinearGradient(px, py, px + PW, py);
    topGrad.addColorStop(0, 'rgba(255,60,0,0)');
    topGrad.addColorStop(0.5, `rgba(255,120,0,${0.2 + flicker})`);
    topGrad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(px + 3, py + 3, PW - 6, 3);

    // Title
    ctx.fillStyle = '#ff8c42';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Smelting...', px + PW / 2, py + 34);

    // Recipe name + bar count
    ctx.fillStyle = '#ddd';
    ctx.font = '13px monospace';
    if (action.total > 1) {
      const curBar = action.total - action.remaining + 1;
      ctx.fillText(`${recipe.name}  —  Bar ${curBar} of ${action.total}`, px + PW / 2, py + 56);
    } else {
      ctx.fillText(recipe.name, px + PW / 2, py + 56);
    }

    // ── Furnace illustration ──
    const fx = px + PW / 2;
    const fy = py + 120;

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

    // Bottom labels
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    if (action.total > 1) {
      const slowPct = Math.round((action.duration / action.baseDuration - 1) * 100);
      const slowStr = slowPct > 0 ? `  •  +${slowPct}% slower per bar` : '';
      ctx.fillText(`${action.remaining} bar(s) remaining${slowStr}`, pbX + pbW / 2, py + PH - 30);
    }
    ctx.fillText(`Forgery xp per bar: +${recipe.xp}`, pbX + pbW / 2, py + PH - 14);

    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     SMITHING PROGRESS OVERLAY
     ═══════════════════════════════════════════════════════ */
  drawSmithingProgress(action, elapsed) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const prog = Math.min(action.progress, 1);
    const recipe = action.recipe;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    // Central panel
    const PW = 400, PH = 300;
    const px = Math.floor((W - PW) / 2);
    const py = Math.floor((H - PH) / 2);

    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });

    // Inner top accent — steel-blue sweep across the top of the frame
    const topGrad = ctx.createLinearGradient(px, py, px + PW, py);
    topGrad.addColorStop(0,   'rgba(0,80,200,0)');
    topGrad.addColorStop(0.5, 'rgba(80,160,255,0.2)');
    topGrad.addColorStop(1,   'rgba(0,80,200,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(px + 3, py + 3, PW - 6, 3);
    void elapsed; // animated border removed in favour of the shared frame

    // Title
    ctx.fillStyle = '#6ab0ff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Smithing...', px + PW / 2, py + 34);

    // Recipe name
    ctx.fillStyle = '#ddd';
    ctx.font = '13px monospace';
    ctx.fillText(recipe.name, px + PW / 2, py + 56);

    // ── Anvil illustration ──
    const ax = px + PW / 2 - 20;
    const ay = py + 105;

    // Anvil base
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(ax - 28, ay + 42, 76, 12);
    // Anvil body
    ctx.fillStyle = '#484848';
    ctx.fillRect(ax - 18, ay + 22, 56, 20);
    // Anvil horn
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(ax - 18, ay + 22);
    ctx.lineTo(ax - 18, ay + 36);
    ctx.lineTo(ax - 42, ay + 36);
    ctx.closePath();
    ctx.fill();
    // Anvil top face
    ctx.fillStyle = '#606060';
    ctx.fillRect(ax - 18, ay + 18, 56, 6);
    ctx.fillStyle = '#707070';
    ctx.fillRect(ax - 18, ay + 18, 56, 2);

    // Hot metal piece on anvil
    const metalGlow = 0.6 + 0.4 * Math.sin(elapsed * 6.2);
    ctx.fillStyle = `rgba(255,${Math.floor(100 + 80 * metalGlow)},0,0.9)`;
    ctx.fillRect(ax, ay + 10, 30, 10);
    ctx.fillStyle = `rgba(255,${Math.floor(200 + 55 * metalGlow)},50,0.7)`;
    ctx.fillRect(ax + 4, ay + 11, 22, 6);

    // ── Hammer (arc swing, pivot at grip/bottom of handle) ──
    const hammerCycle = (elapsed * 1.8) % 1.0;
    const swingFrac = Math.pow(Math.abs(Math.sin(hammerCycle * Math.PI)), 1.5);

    const headH = 14, headW = 22;
    const handleLen = 36, handleW = 6;

    // Pivot = grip (bottom of handle), placed right of anvil near base
    const hammerPivotX = ax + 52;
    const hammerPivotY = ay + 51;

    // Swing arc: raised (tilted right, +0.6 rad) → impact (tilted left, −0.85 rad)
    // At impact angle, head bottom lands on anvil surface (ay+18) at ≈ ax+15
    const raisedAngle = 0.6;
    const impactAngle = -0.85;
    const hammerAngle = raisedAngle + (impactAngle - raisedAngle) * swingFrac;

    ctx.save();
    ctx.translate(hammerPivotX, hammerPivotY);
    ctx.rotate(hammerAngle);
    // Handle extends upward from grip (local negative-y)
    ctx.fillStyle = '#6b3a1a';
    ctx.fillRect(-handleW / 2, -handleLen, handleW, handleLen);
    // Head at top of handle
    ctx.fillStyle = '#787878';
    ctx.fillRect(-headW / 2, -handleLen - headH, headW, headH);
    ctx.fillStyle = '#999';
    ctx.fillRect(-headW / 2, -handleLen - headH, headW, 5);
    ctx.restore();

    // Sparks near impact
    const nearImpact = swingFrac > 0.92;
    if (nearImpact) {
      for (let i = 0; i < 8; i++) {
        const sa = (i / 8) * Math.PI + Math.PI * 0.5;
        const sr = 8 + (i % 3) * 5;
        const spX = ax + 15 + Math.cos(sa) * sr;
        const spY = ay + 16 + Math.sin(sa) * sr * 0.4;
        ctx.fillStyle = `rgba(255,${180 + i * 9},0,${0.8 - i * 0.08})`;
        ctx.fillRect(Math.round(spX), Math.round(spY), 2, 2);
      }
    }

    // ── Output item preview ──
    const barPX = px + PW - 105;
    const barPY = ay + 10;
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Result:', barPX + 40, barPY - 4);
    ctx.fillStyle = 'rgba(10,20,40,0.8)';
    this._roundRect(ctx, barPX + 10, barPY, 60, 60, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,160,255,0.6)';
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

    ctx.fillStyle = '#020810';
    this._roundRect(ctx, pbX, pbY, pbW, pbH, 8);
    ctx.fill();
    ctx.strokeStyle = '#0a2040';
    ctx.lineWidth = 1;
    this._roundRect(ctx, pbX, pbY, pbW, pbH, 8);
    ctx.stroke();

    const fillW = Math.max(4, pbW * prog);
    const steelG = ctx.createLinearGradient(pbX, pbY, pbX + pbW, pbY);
    steelG.addColorStop(0,   '#003080');
    steelG.addColorStop(0.4, '#1a6acc');
    steelG.addColorStop(0.8, '#3a9aee');
    steelG.addColorStop(1,   '#7acfff');
    ctx.fillStyle = steelG;
    this._roundRect(ctx, pbX, pbY, fillW, pbH, 8);
    ctx.fill();

    if (prog > 0.02) {
      const edgeX = pbX + fillW - 6;
      const edgeGlow = ctx.createLinearGradient(edgeX, pbY, edgeX + 10, pbY);
      edgeGlow.addColorStop(0, 'rgba(180,220,255,0.6)');
      edgeGlow.addColorStop(1, 'rgba(180,220,255,0)');
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(edgeX, pbY, 10, pbH);
    }

    ctx.fillStyle = prog > 0.45 ? '#020810' : '#88ccff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(prog * 100)}%`, pbX + pbW / 2, pbY + 21);

    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(`Forgery xp: +${recipe.xp}`, pbX + pbW / 2, py + PH - 14);

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
  drawBuildModeFurnCursor(col, row, elapsed, furnitureDef, rotation, invalid = false, tint = null) {
    if (!furnitureDef) return;
    const ctx = this.ctx;
    const { w, h } = rotatedFootprint(furnitureDef, rotation);
    const px = col * 32, py = row * 32;
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 6);
    const cr = invalid ? 255 : 255, cg = invalid ? 60 : 220, cb = invalid ? 60 : 80;

    // Ghost preview of the furniture sprite
    const tileId = furnitureDef.tileId;
    if (tileId != null) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          const tx = px + dc * 32, ty = py + dr * 32;
          // Base colour fill
          ctx.fillStyle = TILE_COLORS[tileId] || '#555';
          ctx.fillRect(tx, ty, 32, 32);
          // Fake world that exposes the chosen variant tint to tint-aware
          // sprite cases (table/rug/bed/etc.) during the ghost preview.
          const fakeWorld = {
            getTile: () => 0,
            getRotation: () => rotation,
            furnVariants: tint ? { get: () => tint } : null,
          };
          try { this._drawTileDetail(ctx, tileId, tx, ty, col + dc, row + dr, fakeWorld); } catch (_) {}
          // Furniture sprite (FURN_SET tiles like chair, chest, bed, etc.)
          try { ctx.save(); ctx.translate(tx, ty); this._drawFurnitureSprite(ctx, tileId, rotation, tint); ctx.restore(); } catch (_) { ctx.restore(); }
        }
      }
      ctx.restore();
    }

    // Pulsing border
    ctx.save();
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, w * 32 - 2, h * 32 - 2);
    if (furnitureDef.rotatable) {
      const dirLabels = ['↑','→','↓','←'];
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.8 + 0.2 * pulse})`;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dirLabels[rotation], px + 26, py + 12);
    }
    ctx.restore();
  }

  /** Draw a 32×32 tile preview icon at (x, y) with a border. Used for build-mode lists. */
  /** Rect for the Paint Picker popup (tint options list). */
  paintPickerRect() {
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 360, PH = 420;
    return {
      px: Math.floor((W - PW) / 2),
      py: Math.floor((H - PH) / 2),
      PW, PH,
    };
  }

  /** Draw the paint picker overlay. `kind` = 'floor' | 'wall'.
   *  Returns an array of per-option rects for the click handler. */
  drawPaintPicker(kind, inventory, currentTintId, mouseX, mouseY) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const { px, py, PW, PH } = this.paintPickerRect();
    const options = kind === 'wall' ? WALL_TINT_OPTIONS : FLOOR_TINT_OPTIONS;

    // Dim backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, PW, mouseX, mouseY);

    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(kind === 'wall' ? 'Repaint Walls' : 'Refinish Floor', px + 14, py + 28);
    ctx.fillStyle = '#8a7050';
    ctx.font = '10px monospace';
    ctx.fillText('Choose a tint. Materials are consumed on apply.', px + 14, py + 44);

    // Divider
    ctx.fillStyle = '#c89030'; ctx.fillRect(px + 8, py + 51, PW - 16, 1);
    ctx.fillStyle = '#080503'; ctx.fillRect(px + 8, py + 52, PW - 16, 1);

    const rects = [];
    const ROW_H = 36, PAD = 4;
    const listTop = py + 62;
    options.forEach((opt, i) => {
      const rx = px + 14;
      const ry = listTop + i * (ROW_H + PAD);
      const rw = PW - 28, rh = ROW_H;
      const isCur = opt.id === currentTintId;
      const canAfford = opt.materials.every(m => inventory.count(m.itemId) >= m.qty);
      const hov = mouseX >= rx && mouseX <= rx + rw && mouseY >= ry && mouseY <= ry + rh;

      ctx.fillStyle = isCur ? 'rgba(100,160,60,0.28)'
                    : hov   ? 'rgba(200,160,60,0.18)'
                    :         'rgba(40,24,10,0.5)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = isCur ? '#6acc4a' : canAfford ? '#8a6020' : '#4a3010';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);

      // Colour swatch
      if (opt.tint) {
        ctx.fillStyle = opt.tint;
        ctx.fillRect(rx + 4, ry + 6, 24, 24);
      } else {
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(rx + 4, ry + 6, 24, 24);
        ctx.fillStyle = '#8a7050';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('—', rx + 16, ry + 22);
      }
      ctx.strokeStyle = '#1a0e04';
      ctx.strokeRect(rx + 4.5, ry + 6.5, 23, 23);

      // Name
      ctx.fillStyle = canAfford || isCur ? '#f0d090' : '#8a7050';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(opt.name + (isCur ? ' (current)' : ''), rx + 34, ry + 16);

      // Materials
      ctx.fillStyle = canAfford || isCur ? '#a89868' : '#6a5030';
      ctx.font = '9px monospace';
      const matStr = opt.materials.length === 0
        ? 'Free'
        : opt.materials.map(m => `${m.qty}×${m.itemId.replace(/_/g,' ')}`).join('  ');
      ctx.fillText(matStr, rx + 34, ry + 28);

      rects.push({ id: opt.id, x: rx, y: ry, w: rw, h: rh });
    });

    return rects;
  }

  _drawTilePreview(ctx, tileId, x, y, seed = 0, tint = null) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 32, 32);
    ctx.clip();
    // Base colour fill
    ctx.fillStyle = TILE_COLORS[tileId] || '#000';
    ctx.fillRect(x, y, 32, 32);
    // Fake world that yields `tint` for any tile lookup in furnVariants,
    // so variant-aware sprites (table/rug/bed/etc.) pick up the preview colour.
    const fakeWorld = {
      getTile: () => 0,
      getRotation: () => 0,
      furnVariants: tint ? { get: () => tint } : null,
    };

    if (OVERHANG_TILES.has(tileId)) {
      // Tall sprite (y = -32..32). Scale vertically 0.5× so the full 64 px
      // silhouette fits into the 32×32 thumbnail. Works for both FURN_SET
      // dispatch (clock/wardrobe/bookshelf/throne/lantern/vase) and direct
      // cases (armor_stand, weapon_case using px, py absolute coords).
      ctx.save();
      ctx.translate(x, y + 16);
      ctx.scale(1, 0.5);
      try { this._drawTileDetail(ctx, tileId, 0, 0, seed, 0, fakeWorld); } catch (_) {}
      ctx.restore();
    } else {
      try { this._drawTileDetail(ctx, tileId, x, y, seed, 0, fakeWorld); } catch (_) {}
      // Furniture sprites rendered via FURN_SET — draw default rotation for preview
      try {
        ctx.save(); ctx.translate(x, y);
        this._drawFurnitureSprite(ctx, tileId, 0, tint);
        ctx.restore();
      } catch (_) { /* ok — tile not a furniture sprite */ }
    }
    // Border
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,100,60,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 31, 31);
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
    this.drawBronzeFrame(ctx, px, py, BM_PW, BM_PH, { rivets: true });

    // ── header band + gold/dark divider under it ──────────
    ctx.fillStyle = '#1a0e02';
    ctx.fillRect(px + 3, py + 3, BM_PW - 6, BM_HEADER_H - 3);
    ctx.fillStyle = '#c89030';
    ctx.fillRect(px + 4, py + BM_HEADER_H, BM_PW - 8, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(px + 4, py + BM_HEADER_H + 1, BM_PW - 8, 1);

    ctx.fillStyle = '#f0d090';
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
          // Exit indicator
          if (gx === housingState.exitGX && gy === housingState.exitGY) {
            ctx.fillStyle = 'rgba(100,220,100,0.8)';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('EXIT', cx2 + BM_GRID_CELL / 2, cy2 + BM_GRID_CELL - 5);
          }
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
      const listH = py + BM_PH - 10 - listTop;
      const maxVis = Math.floor(listH / ROW_H);
      const visible = allDefs.slice(roomScroll, roomScroll + maxVis);

      // Clipped scroll region
      ctx.save();
      ctx.beginPath();
      ctx.rect(rox, listTop, rpW, maxVis * ROW_H);
      ctx.clip();

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

        // Tile preview icon
        this._drawTilePreview(ctx, def.floorTile, rox + 4, ry + 6, i + roomScroll);

        ctx.fillStyle = canBuild ? '#e8c870' : '#6a5030';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(def.name, rox + 40, ry + 16);

        ctx.fillStyle = canBuild ? '#a0a870' : '#6a5030';
        ctx.font = '9px monospace';
        const cat = def.category === 'indoor' ? 'Indoor' : 'Outdoor';
        ctx.fillText(`Arch ${def.levelReq}  ${def.goldCost}g  ${cat}`, rox + 40, ry + 28);

        const matStr = def.materials.map(m => `${m.qty}×${m.itemId.replace(/_/g,' ')}`).join('  ') || 'No materials';
        ctx.fillText(matStr, rox + 40, ry + 40);
      });

      ctx.restore();

      // Scrollbar
      if (allDefs.length > maxVis) {
        const trackX = rox + rpW - 6;
        const trackH = maxVis * ROW_H;
        const thumbH = Math.max(20, (maxVis / allDefs.length) * trackH);
        const thumbY = listTop + (roomScroll / Math.max(1, allDefs.length - maxVis)) * (trackH - thumbH);
        ctx.fillStyle = 'rgba(80,60,20,0.3)';
        ctx.fillRect(trackX, listTop, 4, trackH);
        ctx.fillStyle = 'rgba(200,160,60,0.5)';
        this._roundRect(ctx, trackX, thumbY, 4, thumbH, 2);
        ctx.fill();
      }
    } else if (step === 'pick_furniture') {
      const cell = housingState.getCell(selGX, selGY);
      if (!cell) return;
      const roomDef = ROOM_DEFS[cell.typeId];
      ctx.fillStyle = '#e8c870';
      ctx.fillText(`Furnish: ${roomDef?.name ?? '?'}`, rox, py + BM_HEADER_H + 16);
      ctx.fillStyle = '#a08050';
      ctx.fillText('Choose furniture to place:', rox, py + BM_HEADER_H + 32);

      // Expanded + sorted: craftable-now first, then by level.
      const allFurn = sortedFurnitureEntries(
        furnitureForRoom(cell.typeId), inventory, archLevel,
      );

      // Bottom buttons zone starts at py + BM_PH - 100
      const furnListH = py + BM_PH - 134 - listTop;
      const maxVis = Math.floor(furnListH / ROW_H);
      const visible = allFurn.slice(furnScroll, furnScroll + maxVis);

      // Clipped scroll region
      ctx.save();
      ctx.beginPath();
      ctx.rect(rox, listTop, rpW, maxVis * ROW_H);
      ctx.clip();

      visible.forEach(({ def: fd, variant }, i) => {
        const ry = listTop + i * ROW_H;
        const materials = variant?.materials || fd.materials;
        const canPlace = archLevel >= fd.levelReq &&
          materials.every(m => inventory.count(m.itemId) >= m.qty);
        const rowHov = mouseX >= rox && mouseX <= rox + rpW && mouseY >= ry && mouseY <= ry + ROW_H - 4;

        ctx.fillStyle = rowHov ? 'rgba(255,220,80,0.12)' : 'rgba(60,40,10,0.4)';
        ctx.fillRect(rox, ry, rpW, ROW_H - 4);
        ctx.strokeStyle = canPlace ? '#a08040' : '#4a3010';
        ctx.lineWidth = 1;
        ctx.strokeRect(rox, ry, rpW, ROW_H - 4);

        // Tile preview icon (optionally tinted to show the variant colour)
        this._drawTilePreview(ctx, fd.tileId, rox + 4, ry + 6, i + furnScroll, variant?.tint ?? null);

        // Variant colour swatch next to the name so the colour reads at a glance
        if (variant?.tint) {
          ctx.fillStyle = variant.tint;
          ctx.fillRect(rox + 40, ry + 8, 6, 6);
          ctx.strokeStyle = '#1a0e04';
          ctx.lineWidth = 1;
          ctx.strokeRect(rox + 40.5, ry + 8.5, 5, 5);
        }

        ctx.fillStyle = canPlace ? '#e8c870' : '#6a5030';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const fpLabel = `${fd.footprint.w}×${fd.footprint.h}`;
        const label = variant ? `${variant.name} ${fd.name}` : fd.name;
        const labelX = rox + (variant?.tint ? 50 : 40);
        ctx.fillText(`${label}  [${fpLabel}]`, labelX, ry + 16);

        ctx.fillStyle = canPlace ? '#a0a870' : '#6a5030';
        ctx.font = '9px monospace';
        ctx.fillText(`Arch ${fd.levelReq}  ${fd.solid ? 'solid' : 'walkable'}`, rox + 40, ry + 28);

        const matStr = materials.map(m => `${m.qty}×${m.itemId.replace(/_/g,' ')}`).join('  ') || 'Free';
        ctx.fillText(matStr, rox + 40, ry + 40);
      });

      ctx.restore();

      // Scrollbar
      if (allFurn.length > maxVis) {
        const trackX = rox + rpW - 6;
        const trackH = maxVis * ROW_H;
        const thumbH = Math.max(20, (maxVis / allFurn.length) * trackH);
        const thumbY = listTop + (furnScroll / Math.max(1, allFurn.length - maxVis)) * (trackH - thumbH);
        ctx.fillStyle = 'rgba(80,60,20,0.3)';
        ctx.fillRect(trackX, listTop, 4, trackH);
        ctx.fillStyle = 'rgba(200,160,60,0.5)';
        this._roundRect(ctx, trackX, thumbY, 4, thumbH, 2);
        ctx.fill();
      }

      // Placed furniture summary
      const placed = housingState.getFurniture(selGX, selGY);
      if (placed.length > 0) {
        ctx.fillStyle = '#6a5030';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${placed.length} item(s) placed in this room.`, rox, py + BM_PH - 126);
      }

      // ── Paint Floor / Paint Wall buttons ─────────────────
      const paintBtnH = 24;
      const paintBtnW = Math.floor((rpW - 6) / 2);
      const paintBtnY = py + BM_PH - 120;
      const sel = housingState.getCell(selGX, selGY);
      const floorTintId = sel?.floorTintId || 'natural';
      const wallTintId  = sel?.wallTintId  || 'natural';
      const pfHov = mouseX >= rox && mouseX <= rox + paintBtnW && mouseY >= paintBtnY && mouseY <= paintBtnY + paintBtnH;
      const pwX   = rox + paintBtnW + 6;
      const pwHov = mouseX >= pwX && mouseX <= pwX + paintBtnW && mouseY >= paintBtnY && mouseY <= paintBtnY + paintBtnH;
      // Paint Floor
      ctx.fillStyle = pfHov ? 'rgba(140,90,40,0.4)' : 'rgba(80,50,20,0.3)';
      ctx.fillRect(rox, paintBtnY, paintBtnW, paintBtnH);
      ctx.strokeStyle = '#8a5a20'; ctx.lineWidth = 1;
      ctx.strokeRect(rox, paintBtnY, paintBtnW, paintBtnH);
      ctx.fillStyle = '#e8c870';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paint Floor', rox + paintBtnW / 2, paintBtnY + paintBtnH / 2 - 4);
      ctx.fillStyle = '#a08050';
      ctx.font = '9px monospace';
      ctx.fillText(floorTintId === 'natural' ? 'Natural' :
        (FLOOR_TINT_OPTIONS.find(o => o.id === floorTintId)?.name ?? floorTintId),
        rox + paintBtnW / 2, paintBtnY + paintBtnH / 2 + 7);
      // Paint Wall
      ctx.fillStyle = pwHov ? 'rgba(140,90,40,0.4)' : 'rgba(80,50,20,0.3)';
      ctx.fillRect(pwX, paintBtnY, paintBtnW, paintBtnH);
      ctx.strokeStyle = '#8a5a20';
      ctx.strokeRect(pwX, paintBtnY, paintBtnW, paintBtnH);
      ctx.fillStyle = '#e8c870';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Paint Wall', pwX + paintBtnW / 2, paintBtnY + paintBtnH / 2 - 4);
      ctx.fillStyle = '#a08050';
      ctx.font = '9px monospace';
      ctx.fillText(wallTintId === 'natural' ? 'Natural' :
        (WALL_TINT_OPTIONS.find(o => o.id === wallTintId)?.name ?? wallTintId),
        pwX + paintBtnW / 2, paintBtnY + paintBtnH / 2 + 7);
      ctx.textBaseline = 'alphabetic';

      // Store rects so the click handler can find them without recomputing
      this._paintBtnRects = {
        floor: { x: rox, y: paintBtnY, w: paintBtnW, h: paintBtnH },
        wall:  { x: pwX, y: paintBtnY, w: paintBtnW, h: paintBtnH },
      };

      // "Set Exit" button above Remove Room
      const exBtnW = rpW, exBtnH = 24;
      const exBtnX = rox, exBtnY = py + BM_PH - 66;
      const isExit = selGX === housingState.exitGX && selGY === housingState.exitGY;
      const canExit = !housingState.cells.has(`${selGX},${selGY + 1}`);
      const exHov = !isExit && canExit && mouseX >= exBtnX && mouseX <= exBtnX + exBtnW &&
                    mouseY >= exBtnY && mouseY <= exBtnY + exBtnH;
      ctx.fillStyle = isExit ? 'rgba(40,120,40,0.30)'
        : exHov ? 'rgba(40,100,140,0.35)' : 'rgba(30,60,90,0.25)';
      ctx.fillRect(exBtnX, exBtnY, exBtnW, exBtnH);
      ctx.strokeStyle = isExit ? '#4a9a4a' : '#3a6a8a';
      ctx.lineWidth = 1;
      ctx.strokeRect(exBtnX, exBtnY, exBtnW, exBtnH);
      ctx.fillStyle = isExit ? '#6aca6a' : canExit ? '#5aaaca' : '#666';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isExit ? 'Exit is here' : canExit ? 'Set as Exit' : 'Has south neighbour', exBtnX + exBtnW / 2, exBtnY + exBtnH / 2);

      // "Remove Room" button at bottom of panel
      const rmBtnW = rpW, rmBtnH = 24;
      const rmBtnX = rox, rmBtnY = py + BM_PH - 36;
      const rmHov = mouseX >= rmBtnX && mouseX <= rmBtnX + rmBtnW &&
                    mouseY >= rmBtnY && mouseY <= rmBtnY + rmBtnH;
      ctx.fillStyle = rmHov ? 'rgba(180,50,50,0.35)' : 'rgba(100,30,30,0.25)';
      ctx.fillRect(rmBtnX, rmBtnY, rmBtnW, rmBtnH);
      ctx.strokeStyle = '#8a3030';
      ctx.lineWidth = 1;
      ctx.strokeRect(rmBtnX, rmBtnY, rmBtnW, rmBtnH);
      ctx.fillStyle = '#d04040';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Remove Room', rmBtnX + rmBtnW / 2, rmBtnY + rmBtnH / 2);
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

    // Panel background — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, MO_PW, MO_PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, MO_PW);

    // Header
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Character Makeover', px + 12, py + 24);
    ctx.fillStyle = '#8a7050';
    ctx.font = '10px monospace';
    ctx.fillText('Click a swatch or style button  |  Click outside or Done to close', px + 12, py + 40);

    // Header divider — gold over dark double rule
    ctx.fillStyle = '#c89030';
    ctx.fillRect(px + 8, py + MO_HEADER_H - 3, MO_PW - 16, 1);
    ctx.fillStyle = '#080503';
    ctx.fillRect(px + 8, py + MO_HEADER_H - 2, MO_PW - 16, 1);

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

    // Panel bg — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, PW, PH);

    // Title
    ctx.fillStyle = '#f0d090';
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
      case 11: // Raiding — two crossed swords (X)
        // Sword A — blade NW→SE (tip top-left, handle bottom-right).
        for (let i = 0; i < 13; i++) p(5 + i, 5 + i, 2, 2, '#c0c0c0');  // blade
        for (let i = 1; i < 11; i++) p(5 + i, 5 + i, 1, 1, '#ebebeb');  // blade sheen
        for (let i = 0; i < 5;  i++) p(19 - i, 15 + i, 2, 2, '#cd7f32'); // crossguard (⟂)
        for (let i = 0; i < 3;  i++) p(20 + i, 20 + i, 2, 2, '#8b4513'); // grip
        p(24, 24, 3, 3, '#e0a840');                                      // pommel
        // Sword B — blade NE→SW (tip top-right, handle bottom-left). Drawn second
        // so its blade crosses on top of sword A at the centre.
        for (let i = 0; i < 13; i++) p(25 - i, 5 + i, 2, 2, '#c0c0c0');  // blade
        for (let i = 1; i < 11; i++) p(25 - i, 5 + i, 1, 1, '#ebebeb');  // blade sheen
        for (let i = 0; i < 5;  i++) p(11 + i, 15 + i, 2, 2, '#cd7f32'); // crossguard (⟂)
        for (let i = 0; i < 3;  i++) p(10 - i, 20 + i, 2, 2, '#8b4513'); // grip
        p( 5, 24, 3, 3, '#e0a840');                                      // pommel
        break;
      case 12: // Farming — cabbage (round leafy head)
        // Outer leaf ring (darkest green) — octagon silhouette
        p( 8,  8, 16, 16, '#1e5a1e');
        p(10,  6, 12,  2, '#1e5a1e'); // top cap
        p(10, 24, 12,  2, '#1e5a1e'); // bottom cap
        p( 6, 10,  2, 12, '#1e5a1e'); // left cap
        p(24, 10,  2, 12, '#1e5a1e'); // right cap
        // Middle leaf layer (mid green)
        p(10, 10, 12, 12, '#3a8e34');
        p(12,  8,  8,  2, '#3a8e34');
        p(12, 22,  8,  2, '#3a8e34');
        p( 8, 12,  2,  8, '#3a8e34');
        p(22, 12,  2,  8, '#3a8e34');
        // Inner leaf layer (lighter green)
        p(12, 12,  8,  8, '#6bc06b');
        p(13, 10,  6,  2, '#6bc06b');
        p(13, 20,  6,  2, '#6bc06b');
        p(10, 13,  2,  6, '#6bc06b');
        p(20, 13,  2,  6, '#6bc06b');
        // Leaf veins — a bright + highlight in the centre
        p(15, 12,  2,  8, '#a6e8a6');
        p(12, 15,  8,  2, '#a6e8a6');
        // Stem nub poking out the top
        p(15,  3,  2,  4, '#2a7a2a');
        p(14,  6,  4,  1, '#1e5a1e');
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

    // Soft drop shadow underneath the frame
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(px + 3, py + 3, PW, PH);
    // Shared bronze frame (no rivets — context menus are small)
    this.drawBronzeFrame(ctx, px, py, PW, PH);

    menu.options.forEach((opt, i) => {
      const oy = py + PAD + i * OPT_H;
      const hovered = mx >= px && mx < px + PW && my >= oy && my < oy + OPT_H;
      if (hovered) {
        ctx.fillStyle = 'rgba(200,144,48,0.22)';
        ctx.fillRect(px + 2, oy, PW - 4, OPT_H);
      }
      ctx.fillStyle = hovered ? '#fff1c0' : '#f0d090';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(opt.label, px + 10, oy + 17);
    });
    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     BOTTOM HUD (always-visible overlay)
     ═══════════════════════════════════════════════════════ */
  /**
   * Draws the always-visible bottom-left HUD elements:
   *   1. Stamina bar (bottom-left, guarded)
   *
   * TODO: Agent 4 — player.stamina and player.isRunning() used in stamina bar
   */
  drawBottomHUD(ctx, player) {
    const ch = this.canvas.height;

    ctx.save();
    ctx.globalAlpha = 0.85;

    // Anchor for stamina bar position
    const HP_H = 18;
    const hpX = 8, hpY = ch - 8 - HP_H;

    // ── 2. Stamina bar (only when stamina exists and is not full) ──
    // TODO: Agent 4 — player.stamina and player.isRunning() used in stamina bar
    if (typeof player.stamina !== 'undefined' &&
        (player.stamina < player.maxStamina || player.exhausted)) {
      const STM_W = 120, STM_H = 10;
      const stmX = hpX;
      const stmY = hpY - 4 - STM_H;

      ctx.save();
      ctx.globalAlpha = 0.85;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(stmX, stmY, STM_W, STM_H);

      const stmRatio = Math.max(0, Math.min(1,
        player.maxStamina > 0 ? player.stamina / player.maxStamina : 0));
      ctx.fillStyle = player.exhausted ? '#888' : '#e67e22';
      ctx.fillRect(stmX, stmY, STM_W * stmRatio, STM_H);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('STM', stmX + 2, stmY + STM_H - 2);

      ctx.restore();
    }


    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     SKILLS PANEL — FULL-SCREEN OVERLAY (K key)
     ═══════════════════════════════════════════════════════ */
  drawSkillsPanelFull(ctx, skills, canvas) {
    const cw = canvas.width;
    const ch = canvas.height;
    const PW = 420, PH = 520;
    const px = Math.floor((cw - PW) / 2);
    const py = Math.floor((ch - PH) / 2);

    // Dim backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cw, ch);

    // Panel background — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, PW);

    // ── Header ──────────────────────────────────────────
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Skills', px + PW / 2, py + 32);

    ctx.fillStyle = '#a08848';
    ctx.font = '10px monospace';
    ctx.fillText(`Total Level: ${skills.totalLevel}`, px + PW / 2, py + 48);

    // Close button drawn via the shared helper above.

    // ── Skill rows ──────────────────────────────────────
    const ROW_H = 36;
    const ICON_SZ = 28;
    const HEADER_H = 56;
    const BAR_W = 80;

    for (let i = 0; i < SKILL_NAMES.length; i++) {
      const ry = py + HEADER_H + i * ROW_H;

      // Alternating row background
      ctx.fillStyle = i % 2 === 0
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(0,0,0,0.15)';
      ctx.fillRect(px + 2, ry, PW - 4, ROW_H);

      const level = skills.getLevel(i);
      const progress = skills.progressToNext(i);

      // Icon box with skill initial
      const iconX = px + 8;
      const iconY = ry + Math.floor((ROW_H - ICON_SZ) / 2);
      ctx.fillStyle = '#0d1020';
      ctx.fillRect(iconX, iconY, ICON_SZ, ICON_SZ);
      ctx.strokeStyle = '#3a3a5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(iconX, iconY, ICON_SZ, ICON_SZ);
      ctx.fillStyle = SKILL_COLORS[i] || '#888';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(SKILL_NAMES[i][0], iconX + ICON_SZ / 2, iconY + ICON_SZ - 8);

      // Skill name (white)
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(SKILL_NAMES[i], px + 44, ry + ROW_H / 2 + 4);

      // Level (gold, bold, right-aligned)
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(level), px + PW - BAR_W - 16, ry + ROW_H / 2 + 4);

      // XP progress bar (thin, 80px wide, blue fill)
      const barX = px + PW - BAR_W - 8;
      const barY = ry + Math.floor((ROW_H - 6) / 2);
      ctx.fillStyle = '#0d1020';
      ctx.fillRect(barX, barY, BAR_W, 6);
      if (progress > 0) {
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(barX, barY, Math.floor(BAR_W * progress), 6);
      }
    }

    ctx.textAlign = 'left';
  }

  /* ═══════════════════════════════════════════════════════
     DIALOGUE BOX (bottom-centre)
     ═══════════════════════════════════════════════════════ */
  /**
   * Draw the NPC dialogue panel.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ npcName: string, text: string, options: string[] }} dialogueData
   * @param {HTMLCanvasElement} canvas
   */
  drawDialoguePanel(ctx, dialogueData, canvas) {
    const cw = canvas.width;
    const ch = canvas.height;
    const PW = 600, PH = 160;
    const px = Math.floor((cw - PW) / 2);
    const py = ch - PH - 20;

    // Slightly dimmed backdrop strip
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, py - 10, cw, PH + 30);

    // Panel background — shared bronze frame
    this.drawBronzeFrame(ctx, px, py, PW, PH, { rivets: true });
    this.drawCloseButton(ctx, px, py, PW);

    // NPC name (gold, top-left)
    ctx.fillStyle = '#f0d090';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(dialogueData.npcName || 'NPC', px + 12, py + 20);

    // Body text
    ctx.fillStyle = '#f0e8d0';
    ctx.font = '12px monospace';
    ctx.fillText(dialogueData.text || '', px + 12, py + 40);

    // Option rows
    const OPTION_H = 22;
    const OPTION_START_Y = py + 56;
    const opts = dialogueData.options || [];
    for (let i = 0; i < opts.length; i++) {
      const oy = OPTION_START_Y + i * OPTION_H;

      // Option button background
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(px + 8, oy, PW - 16, OPTION_H - 2);
      ctx.strokeStyle = '#3a3a5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 8, oy, PW - 16, OPTION_H - 2);

      // Number prefix + option text
      ctx.fillStyle = '#c9a84c';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, px + 14, oy + OPTION_H - 7);

      ctx.fillStyle = '#dddddd';
      ctx.font = '11px monospace';
      ctx.fillText(opts[i], px + 42, oy + OPTION_H - 7);
    }

    // "ESC to close" hint (small grey, bottom-right)
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('ESC to close', px + PW - 8, py + PH - 6);

    ctx.textAlign = 'left';
  }
}
