# RuneWorld 2D — Claude Context

Browser-based multiplayer RPG inspired by RuneScape. Vanilla ES6 modules + HTML5 Canvas (client), Node.js + Express + Socket.io (server).

---

## Stack

| Layer | Tech |
|---|---|
| Client | Vanilla ES6 modules, HTML5 Canvas (no framework) |
| Server | Node.js, Express, Socket.io |
| Auth | bcryptjs + HttpOnly session cookie (24h TTL) |
| Save | JSON files in `./data/` (one per player) |
| Multiplayer | Socket.io — position/equipment/mob sync |

---

## File Map

### Client (`js/`)
| File | Purpose |
|---|---|
| `main.js` | Entry point: auth check → load save → `new Game()` |
| `game.js` | Central orchestrator — game loop, input dispatch, all panel state |
| `constants.js` | All tile IDs, world dimensions, skill names, XP table, UI sizes |
| `renderer.js` | All canvas drawing: world chunks, entities, UI panels, overlays |
| `world.js` | Procedural map generation (seeded Perlin noise, biomes, structures) |
| `player.js` | Player entity: tile movement, smooth interpolation, appearance |
| `actions.js` | Skill actions: woodcutting, fishing, firemaking, cooking, mining, foraging |
| `combat.js` | Auto-attack loop, attack/defence rolls, XP gain, mob aggro |
| `mobs.js` | Mob types, AI pathfinding, combat behaviour |
| `items.js` | Full item registry (ITEMS object + ITEM_BY_ID Map) |
| `inventory.js` | 28-slot inventory class |
| `skills.js` | XP tracking, level calculation (1-99) |
| `equipment.js` | Armor/weapon slots, stat bonuses, visual overlays |
| `gear.js` | Equipment database |
| `forge.js` | Smelting (ore→bars) and smithing (bars→equipment) |
| `fishing.js` | Fish species, biome-specific spots, cooking |
| `shop.js` | 6 shop NPCs with buy/sell |
| `housing.js` | HousingState — expandable 6×6 room grid, furniture placement |
| `farming.js` | FarmingState — 5 crop patches, 3 growth stages |
| `interiors.js` | Interior map builders (shops, kingdom, dungeons, player house) |
| `pathfinder.js` | BFS pathfinding for click-to-move and mob AI |
| `camera.js` | Exponential-smoothing camera |
| `input.js` | Keyboard/mouse capture |
| `network.js` | Socket.io client wrapper |
| `loginScreen.js` | Canvas login/register UI |
| `makeover.js` | Character appearance customisation |
| `notifications.js` | On-screen message queue |
| `raids.js` / `raidInstance.js` / `dungeonMaster.js` / `dungeons.js` | Raid/dungeon systems |
| `biomes.js` / `structures.js` | World generation helpers |

### Server (`server/`)
| File | Purpose |
|---|---|
| `auth.js` | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| `db.js` | Load/save player JSON, password hashing |
| `rooms.js` | Socket.io events: move, equip, tile changes, broadcasts |
| `sessions.js` | Session management (24h TTL, renewed on activity) |
| `mobSim.js` | Server-side mob simulation (100ms tick, synced to all clients) |
| `rateLimit.js` | IP-based rate limiting for auth endpoints |

---

## Key Constants (from `constants.js`)

### Tile IDs (selected)
```
GRASS=0  DIRT=1  WATER=2  SAND=3  STONE=4  TREE=5  WALL=6
STUMP=10  FISH_SPOT=11  FIRE=12  SNOW=13  LAVA=17
ROCK_COPPER=21  ROCK_IRON=22  ROCK_COAL=23  ROCK_GOLD=24  ROCK_MITHRIL=25  ROCK_DEPLETED=26
DOOR=29  FURNACE=40  ANVIL=41
OAK_TREE=47  WILLOW_TREE=48  MAPLE_TREE=49  YEW_TREE=50  MAGIC_TREE=51  ELDER_TREE=52
FURN_CHEST=37  FURN_BED=60  FURN_BENCH=61
FARM_PATCH=62  FARM_PATCH_SEEDED=63  FARM_PATCH_GROWING=64  FARM_PATCH_READY=65
```

### UI Sizes
```
INV_SLOTS=28   INV_COLS=4   INV_ROWS=7   INV_CELL=40px   INV_PAD=6px
TILE_SIZE=32px
PLAYER_SPEED=120 px/s  (~0.27s per tile)
COMBAT_TICK=2.4s
```

### Skills (by index)
```
0=Woodcutting  1=Firemaking  2=Fishing  3=Cooking
4=Attack  5=Strength  6=Defence  7=Hitpoints
8=Mining  9=Architect  10=Forgery  11=Raiding  12=Farming
```

---

## Architecture Patterns

### Game Loop
`run()` uses `requestAnimationFrame`. When the tab is hidden (`visibilitychange`), it switches to a `setInterval` at 50ms (~20 tps) so timers, auto-logout, and saves keep running. Resumes rAF on tab focus.

### Panel State (in `game.js`)
Each UI panel has a boolean flag (`forgeOpen`, `smithOpen`, `chestOpen`, `playerViewOpen`, etc.). All panels:
- Are closed by ESC (checked in order in the ESC handler)
- Block world clicks via `_clickOnUI()` and `_isAnyPanelOpen()`
- Have a matching `draw*Panel()` call in `renderer.js`
- Have a matching `_handle*Click()` handler dispatched from the main click handler

### Interior System
- `this.activeMap` is either `this.world` (overworld) or an interior map
- `this.inInterior` gates interior-specific logic
- **Always use `this.activeMap.getTile()`, never `this.world.getTile()`**, when inside an interior
- `pendingInteract = { type: 'action', col, row }` is set when the player starts walking to an interactive tile; processed when they arrive

### Pending Interact Pattern (click-to-interact on solid tiles)
```js
// 1. Find walkable tile adjacent to target
const target = nearestWalkableAdjacent(this.activeMap, col, row, player.col, player.row);
// 2. Pathfind to it
this.player.setPath(findPath(this.activeMap, player.col, player.row, target.col, target.row));
// 3. Set pending — processed in update() when player arrives
this.pendingInteract = { type: 'action', col, row, worldX, worldY };
```

### Chest Storage
`this.chestStorage` is a `Map<"col,row", Array<{item,qty}|null>[28]>`. Keys are world tile coordinates. Serialised in `_serializeState()` / restored in `_restoreState()`. **Must be initialised before `_restoreState()` is called** (it's set up early in the constructor for this reason).

### Item Registry
Items are defined in `items.js` as `ITEMS.*` constants and indexed in `ITEM_BY_ID: Map<string, ItemDef>`. Always look up items by ID using `ITEM_BY_ID.get(id)` when deserialising saves.

### Rendering
- World is split into 16-tile chunks cached as `OffscreenCanvas`
- Chunk cache is invalidated (`renderer.minimapDirty`) on tile changes
- Animated tiles (water, lava, fire, portal) are drawn fresh every frame
- Player and entities are drawn in a separate entity pass (above terrain, below UI)

---

## Save Format (JSON)
```json
{
  "col": 512, "row": 389,
  "hp": 10, "maxHp": 10,
  "name": "PlayerName",
  "style": { "hair": "#333", "skin": "#e8b87a", "hairStyle": "short", "shirt": "#4a90d9", "pants": "#2c3e50", "shirtStyle": "tunic" },
  "equipment": { "helmet": "none", "chestplate": "none", "leggings": "none", "gloves": "none", "boots": "none", "cape": "none", "weapon": "none" },
  "inventory": [ { "id": "axe", "qty": 1 }, null ],
  "skills": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "housing": { },
  "farming": { },
  "chests": { "col,row": [ { "id": "gold_coin", "qty": 10 }, null ] }
}
```

---

## Biomes
| Biome | Location | Key Resources |
|---|---|---|
| Plains | Centre | Copper/tin, beginner fish |
| Forest | North | Abundant trees, salmon |
| Tundra | NW | Snow/ice, cold fish |
| Swamp | SW | Swamp water, mud fish |
| Desert | South | Sand, cacti, pufferfish |
| Volcanic | SE | Lava, magma fish, rare ore |
| Danger Zone | NE | Aggressive mobs (goblin/orc/troll/demon), rare drops |

---

## Multiplayer Notes
- Position/equipment/style broadcast via Socket.io
- Server mob simulation runs at 100ms tick in `server/mobSim.js`; mob HP is authoritative on server
- Tile changes (chopping trees, depleting ore) broadcast to all clients
- Single-session: new login kicks old session
- Auto-save: every 30s + on page unload
- Idle logout after 20 minutes (warn at 30s remaining)
