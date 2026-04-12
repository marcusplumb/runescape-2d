# Graphics Review Report
**Reviewer:** Agent 3 — Graphics Reviewer
**Date:** 2026-04-10
**Files reviewed:** `CLAUDE.md`, `js/renderer.js`, `js/structures.js`, `js/biomes.js`, `js/constants.js`, `js/world.js` (Phase 11 section)

---

## Checklist Results

---

### 1. SETTLEMENT_THEMES colorScheme keys vs BIOME_TILE_PALETTES keys

✅ **PASS**

All seven `colorScheme` values used in `SETTLEMENT_THEMES` have matching keys in `BIOME_TILE_PALETTES`.

| colorScheme value | Key in BIOME_TILE_PALETTES |
|---|---|
| `'forest'`   | `forest` — present |
| `'plains'`   | `plains` — present |
| `'desert'`   | `desert` — present |
| `'tundra'`   | `tundra` — present |
| `'swamp'`    | `swamp` — present |
| `'volcanic'` | `volcanic` — present |
| `'royal'`    | `royal` — present |

No missing keys. The fallback `?? BIOME_TILE_PALETTES.plains` in `_renderChunk` (renderer.js line 366) additionally guards against any future unknown biomes.

---

### 2. Tile IDs in SETTLEMENT_THEMES vs constants.js TILES

✅ **PASS**

Every tile ID referenced in `SETTLEMENT_THEMES` (fields: `wallTile`, `floorTile`, `roofAccent`, `pathTile`, `fenceTile`, `accentTile`) exists in `constants.js TILES`:

| Theme | wallTile | floorTile | roofAccent | pathTile | fenceTile | accentTile |
|---|---|---|---|---|---|---|
| `hamlet_forest`  | WALL(6)     | DIRT(1)    | OAK_TREE(47)    | DIRT(1)    | STUMP(10)  | TREE(5)          |
| `hamlet_plains`  | WALL(6)     | DIRT(1)    | TREE(5)         | DIRT(1)    | STONE(4)   | FLOWERS(8)       |
| `village_north`  | WALL(6)     | DIRT(1)    | OAK_TREE(47)    | STONE(4)   | STUMP(10)  | WILLOW_TREE(48)  |
| `village_south`  | WALL(6)     | SAND(3)    | ROCK_GOLD(24)   | SAND(3)    | STONE(4)   | CACTUS(19)       |
| `village_swamp`  | WALL(6)     | STONE(4)   | WILLOW_TREE(48) | STONE(4)   | STUMP(10)  | WILLOW_TREE(48)  |
| `town_east`      | STONE(4)    | STONE(4)   | ROCK_MITHRIL(25)| STONE(4)   | WALL(6)    | ROCK_GOLD(24)    |
| `town_north`     | STONE(4)    | STONE(4)   | SNOW(13)        | STONE(4)   | WALL(6)    | SNOW(13)         |
| `kingdom`        | WALL(6)     | STONE(4)   | STONE(4)        | STONE(4)   | WALL(6)    | MAPLE_TREE(49)   |

All IDs resolve correctly. No mismatches found.

---

### 3. getBiome() call scope inside _renderChunk

✅ **PASS**

`getBiome()` is called **per tile** inside the inner loop of `_renderChunk`, not once per chunk.

**Line reference:** `renderer.js:365`
```js
// Inside the dr/dc inner loop — col and row are tile-level coordinates
const _biome   = getBiome(col, row);
const _palette = BIOME_TILE_PALETTES[_biome] ?? BIOME_TILE_PALETTES.plains;
```

The variables `col` and `row` are computed from `c0 + dc` and `r0 + dr` on lines 359–360, which are tile coordinates updated every iteration of the inner loop. The `getBiome()` call on line 365 is inside that same inner loop, not outside it. Correct.

---

### 4. Structure types that bypass _themeForBiome()

⚠️ **WARNING**

Three structure types (`watchtower`, `outpost`, `ruins`) bypass `_themeForBiome()` entirely. They call their placement functions directly without any biome theme argument.

**Line references:**
- `structures.js:1252–1255` — `case 'watchtower'` calls `placeWatchtower()` with no theme.
- `structures.js:1257–1260` — `case 'outpost'` calls `placeOutpost()` with no theme.
- `structures.js:1262–1264` — `case 'ruins'` calls `placeRuins()` with no theme.

**Justification for WARNING rather than FAIL:** These three structure functions (`placeWatchtower`, `placeOutpost`, `placeRuins`) are hard-coded to use `TILES.WALL`, `TILES.STONE`, and `TILES.DIRT` only — they have no theme parameter in their signatures. When rendered, the biome palette is still applied by `_renderChunk` because the wall/floor tiles they write are in `STRUCTURE_WALL_TILES` / `STRUCTURE_FLOOR_TILES`. So they _do_ receive biome-tinted colouring at render time, just not different _layout_ tile choices. This is a design gap rather than a rendering bug.

**Fix:** Document that these three structure types are intentionally "biome-neutral" (no themed tile choices), or add optional `theme` parameters to `placeWatchtower` / `placeOutpost` if visual variety is desired. Also note that `case 'kingdom'` (line 1245) also bypasses `_themeForBiome()`, but this is intentional — the kingdom uses its fixed hardcoded geometry and its own `SETTLEMENT_THEMES.kingdom` entry.

---

### 5. Palette system scope — terrain tiles excluded from structure sets

✅ **PASS**

The four structure tile sets in `renderer.js` (lines 138–141) contain only structure/building tile IDs. None of the terrain tiles `GRASS=0`, `WATER=2`, `SAND=3`, `SNOW=13`, `LAVA=17`, or `ICE=14` appear in any of them.

**Exact set contents (renderer.js:138–141):**
```js
const STRUCTURE_WALL_TILES  = new Set([TILES.WALL, TILES.PLASTER_WALL]);
// numeric: {6, 54}

const STRUCTURE_FLOOR_TILES = new Set([TILES.DIRT, TILES.STONE, TILES.WET_STONE, TILES.STONE_TILE]);
// numeric: {1, 4, 73, 77}

const STRUCTURE_PATH_TILES  = new Set([TILES.PATH]);
// numeric: {53}

const STRUCTURE_DOOR_TILES  = new Set([TILES.DOOR]);
// numeric: {29}
```

Confirmed: GRASS=0, WATER=2, SAND=3, SNOW=13, LAVA=17, ICE=14 are absent from all four sets. Terrain tiles are never remapped.

**Note:** `TILES.DIRT=1` appears in `STRUCTURE_FLOOR_TILES`. Dirt is also used as a terrain tile in the overworld. The palette override for floor tiles is guarded by `_hasAdjacentWall()` (renderer.js:373, 395), so isolated overworld dirt tiles are not inadvertently recoloured. This guard is correct.

---

### 6. Chunk cache invalidation and new-world empty cache

✅ **PASS**

**Dirty chunk invalidation:** When `world.changedTiles` has entries, `drawWorld()` (renderer.js:207–215) drains that list, computes the chunk key for each changed tile, and adds it to the `dirty` Set. The main chunk-blit loop (line 232) rebuilds any chunk that is missing from `cache` or present in `dirty`, then deletes the dirty entry. This correctly ensures stale cached tiles are redrawn after any tile change (tree chop, ore depletion, etc.).

**New World empty cache:** The cache is a `WeakMap` keyed by world object (renderer.js:169). Per-world cache maps are only created on first access (lines 201–202):
```js
if (!this._chunkCaches.has(world)) this._chunkCaches.set(world, new Map());
if (!this._dirtyChunks.has(world)) this._dirtyChunks.set(world, new Set());
```
A brand new `World` object is a new key in the `WeakMap`, so it always starts with an empty `Map()`. Interior maps also get their own separate cache because they are separate objects. No stale chunks can leak between worlds.

---

### 7. Wall colour proximity between palettes (within 20 hex points on all three channels)

❌ **FAIL**

The `forest` and `volcanic` palettes have wall colours within 20 hex points on **all three channels**:

| Palette  | wall hex   | R   | G   | B   |
|----------|-----------|-----|-----|-----|
| forest   | `#4a3728` |  74 |  55 |  40 |
| volcanic | `#4a3030` |  74 |  48 |  48 |
| **Diff** |           |   0 |   7 |   8 |

All three channel differences (0, 7, 8) are well under 20. In-game these two building styles will look nearly identical — a dark brownish-grey that does not visually distinguish a forest hamlet from a volcanic-zone fortress.

All other palette pairs have at least one channel exceeding 20 points. No other collisions found.

**Line reference:** `renderer.js:85–126` (the `forest` and `volcanic` entries in `BIOME_TILE_PALETTES`).

**Fix:** Shift the `volcanic` wall colour to a distinctly reddish-dark tone, e.g. `'#5a2820'` (R=90, G=40, B=32), which increases all channel distances from `forest` to at least 17 on R, 15 on G, and increases B from 8 to >8 — or more dramatically `'#6a2218'` (R=106, G=34, B=24) for an unmistakable heat-scorched stone appearance.

---

### 8. Door vs wall distinguishability per palette

❌ **FAIL**

The `plains` palette has door and wall colours that are within 20 hex points on **all three channels**:

| Palette | tile  | hex       | R   | G   | B   |
|---------|-------|-----------|-----|-----|-----|
| plains  | wall  | `#c8a878` | 200 | 168 | 120 |
| plains  | door  | `#d4b888` | 212 | 184 | 136 |
| **Diff**|       |           |  12 |  16 |  16 |

All channel differences (12, 16, 16) are below 20. Plains building entrances will not be visually distinguishable from the surrounding walls — players will struggle to find doors.

All other palettes have at least one channel exceeding 20 between their `wall` and `door` values and are acceptable.

**Line reference:** `renderer.js:92–98` (the `plains` entry in `BIOME_TILE_PALETTES`).

**Fix:** Make the plains door noticeably darker or warmer, e.g. change `door` from `'#d4b888'` to `'#a06030'` — a clear brown-wood contrast against the sandy cream wall. A minimum 30-point difference on at least one channel is recommended.

---

### 9. drawPath() — getBiome() per step, _pathTileForBiome(), getBiome import

✅ **PASS**

**getBiome import:** `structures.js:16`
```js
import { getBiome, BIOMES } from './biomes.js';
```
Both `getBiome` and `BIOMES` are imported at the top of the file.

**getBiome() called per step:** `structures.js:229`
```js
const biome = getBiome(c, r);
map[r][c] = _pathTileForBiome(biome);
```
This is inside the `for (let step = 0; step < maxSteps; step++)` loop body, after the current `(c, r)` position is advanced each iteration. Each tile painted queries its own biome independently — roads correctly transition as they cross biome boundaries.

**_pathTileForBiome() is called:** `structures.js:230` — confirmed called with the per-step biome result.

---

### 10. Phase 11 kingdom centre coordinate vs STRUCTURE_NODES

❌ **FAIL**

The Phase 11 road stub code in `world.js` computes `kingdomR` as:
```js
const kingdomR = Math.floor(this.rows / 2) - 180;
// = Math.floor(768 / 2) - 180 = 384 - 180 = 204
```

However, the kingdom node in `STRUCTURE_NODES` (`structures.js:1162`) is:
```js
{ id: 'kingdom', c: 512, r: 208, type: 'kingdom' }
```

The kingdom's actual row is **r=208**. The Phase 11 code targets **row 204** — a 4-tile discrepancy.

This means the road stubs generated by Phase 11 are offset 4 rows north of the actual kingdom structure. The north stub will start 4 tiles inside the kingdom's outer wall instead of at the north postern opening; the south stub will emerge 4 tiles short of the south gatehouse; and the east/west stubs will be misaligned with the kingdom's mid-point.

**Line reference:** `world.js:613`

**Fix:** Replace the arithmetic derivation with the literal value that matches `STRUCTURE_NODES`:
```js
const kingdomR = 208; // matches STRUCTURE_NODES kingdom r
```
Or import `STRUCTURE_NODES` and look up the kingdom node by id to avoid the magic number.

---

## PRIORITY

### Bugs (fix immediately)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 10 | Phase 11 kingdom `kingdomR` is 204, not 208 | `world.js:613` | Road stubs attach to the wrong row of the kingdom — north stub punches through the outer wall instead of exiting at the postern; south stub falls short of the gatehouse. Visible misalignment in-game for every world generated. |
| 8  | Plains palette: `door` colour too close to `wall` (max diff 16) | `renderer.js:92–98` | Plains building entrances are nearly invisible — players cannot distinguish doors from walls. |
| 7  | Forest and volcanic `wall` colours are almost identical (max diff 8) | `renderer.js:85–126` | A forest hamlet and a volcanic fortress look the same colour in-game — the intended visual distinction is lost. |

### Polish (fix later)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 4  | `watchtower`, `outpost`, `ruins` bypass `_themeForBiome()` | `structures.js:1252–1264` | These structures only get biome colouring via the render-time palette, but always use the same tile types (WALL/STONE) regardless of biome. Low visual impact currently since the palette still tints them correctly, but layout variety is absent. |
