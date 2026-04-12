import { World } from './world.js';
import { Player, DIR } from './player.js';
import { Network } from './network.js';
import { Camera } from './camera.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Inventory } from './inventory.js';
import { Skills } from './skills.js';
import { Actions } from './actions.js';
import { Notifications } from './notifications.js';
import { ITEMS, EQUIP_ID_TO_ITEM } from './items.js';
import { GEAR_BY_ID, meetsRequirements, getTotalStats } from './gear.js';
import { MobManager, Mob } from './mobs.js';
import { Combat } from './combat.js';
import { ShopKeeper, SHOP_STOCK, SELL_PRICES, SHOP_PW, SHOP_HEADER_H, SHOP_TAB_H, SHOP_ROW_H, SHOP_PH,
  HouseShopKeeper, HOUSE_SHOP_STOCK, HOUSE_SHOP_PW, HOUSE_SHOP_PH, HOUSE_SHOP_HEADER_H, HOUSE_SHOP_ROW_H,
  SmithyKeeper, SMITHY_STOCK,
  ButcherKeeper, BUTCHER_STOCK, BUTCHER_SELL_PRICES,
  WeaponKeeper,  WEAPON_SHOP_STOCK, WEAPON_SELL_PRICES,
  VarietyKeeper, VARIETY_STOCK, VARIETY_SELL_PRICES,
  CapeKeeper,    CAPE_STOCK, CAPE_SELL_PRICES,
} from './shop.js';
import {
  MakoverNPC,
  MO_PW, MO_PH, MO_HEADER_H, MO_PREVIEW_H,
  MO_STYLE_ROW_H, MO_ROW_H, MO_PAD_BOT,
  MO_SWATCH, MO_SWATCH_GAP, MO_LABEL_W, MO_PAD,
  MO_BTN_W, MO_BTN_H, MO_BTN_GAP,
  MO_PALETTES, MO_STYLE_ROWS,
} from './makeover.js';
import { findPath, nearestWalkableAdjacent } from './pathfinder.js';
import { buildAllInteriors, buildPlayerHouse } from './interiors.js';
import {
  HousingState, ROOM_DEFS, FURNITURE_DEFS,
  getUnlockedRoomDefs, getUnlockedFurnitureDefs,
  cellInnerOrigin, CELL_INNER,
  GRID_COLS, GRID_ROWS,
  BM_PW, BM_PH, BM_HEADER_H, BM_GRID_CELL, BM_GRID_OFF, BM_GRID_TOP, BM_SPLIT_X,
  LARGE_CHEST_CAPACITY,
} from './housing.js';
import { STRUCTURE_NODES } from './structures.js';
import { ARMOR_OPTIONS, EQUIPMENT_SLOTS, SLOT_LABELS } from './equipment.js';
import { getBiome } from './biomes.js';
import {
  TILE_SIZE, PLAYER_SPEED, TILES, TREE_TILES,
  INV_COLS, INV_ROWS, INV_CELL, INV_PAD, SKILL_IDS, SKILL_NAMES, SKILL_UNLOCKS,
  TILE_COLORS,
} from './constants.js';

// Duration to cross one tile — remote players interpolate at the same speed as local
const REMOTE_MOVE_TIME = TILE_SIZE / PLAYER_SPEED;
import {
  FishermanNPC, FISH_SPECIES, FISH_SHOP_STOCK, FISH_SELL_PRICES,
  FISH_PW, FISH_PH, FISH_HEADER_H, FISH_TAB_H, FISH_ROW_H,
  FISH_TAB_KEYS, FISH_TAB_LABELS, makeFishingRecords,
} from './fishing.js';
import {
  SMELT_RECIPES, SMITH_RECIPES,
  FORGE_PW, FORGE_HEADER_H, FORGE_TAB_H, FORGE_ROW_H,
  SMELT_PH, SMITH_PH, SMELT_RECIPE_COUNT, SMITH_CONTENT_H,
} from './forge.js';
import { DungeonMasterNPC } from './dungeonMaster.js';
import { RaidInstance } from './raidInstance.js';
import { RAID_DEFS, RAID_DIFFICULTIES } from './raids.js';
import { FarmingState, SEED_DEFS, PATCH_LOCAL_POSITIONS, GROW_STAGES } from './farming.js';
import { buildAllDungeons } from './dungeons.js';

const TILE_TOOLTIPS = {
  [TILES.TREE]:              'Tree — click to chop (need Axe)',
  [TILES.OAK_TREE]:          'Oak Tree — click to chop (level 15)',
  [TILES.WILLOW_TREE]:       'Willow Tree — click to chop (level 30)',
  [TILES.MAPLE_TREE]:        'Maple Tree — click to chop (level 45)',
  [TILES.YEW_TREE]:          'Yew Tree — click to chop (level 60)',
  [TILES.MAGIC_TREE]:        'Magic Tree — click to chop (level 75)',
  [TILES.ELDER_TREE]:        'Elder Tree — click to chop (level 90)',
  [TILES.FISH_SPOT]:         'Fishing spot — click to fish (need Rod)',
  [TILES.FIRE]:              'Fire — click to cook',
  [TILES.STUMP]:             'Stump — click with Logs + Tinderbox to light',
  [TILES.ROCK_COPPER]:       'Copper Rock — click to mine',
  [TILES.ROCK_TIN]:          'Tin Rock — click to mine',
  [TILES.ROCK_IRON]:         'Iron Rock — click to mine',
  [TILES.ROCK_COAL]:         'Coal Rock — click to mine',
  [TILES.ROCK_SILVER]:       'Silver Rock — click to mine',
  [TILES.ROCK_GOLD]:         'Gold Rock — click to mine',
  [TILES.ROCK_MITHRIL]:      'Mithril Rock — click to mine',
  [TILES.ROCK_TUNGSTEN]:     'Tungsten Rock — click to mine (need Steel+ Pickaxe)',
  [TILES.ROCK_OBSIDIAN]:     'Obsidian Vent — click to mine (need Tungsten Pickaxe)',
  [TILES.ROCK_MOONSTONE]:    'Moonstone Vein — click to mine (need Tungsten Pickaxe)',
  [TILES.ROCK_DEPLETED]:     'Depleted Rock — wait for it to refill',
  [TILES.BERRY_BUSH]:       'Berry Bush — click to pick berries',
  [TILES.BERRY_BUSH_EMPTY]: 'Berry Bush — berries are regrowing...',
  [TILES.MUSHROOM]:      'Mushroom — click to pick',
  [TILES.WILD_HERB]:     'Wild Herb — click to pick',
  [TILES.REEDS]:         'Reeds — click to cut',
  [TILES.FLAX_PLANT]:   'Flax Plant — click to pick flax',
  [TILES.SNOWBERRY]:    'Snowberry Bush — click to pick',
  [TILES.SULFUR_ROCK]:  'Sulfur Deposit — click to chip off sulfur',
  [TILES.THORN_BUSH]:   'Thorn Bush — click to cut thorn vines',
  [TILES.DESERT_FLOWER]:'Desert Flower — click to pluck bloom',
  [TILES.FURNACE]:               'Furnace — smelt ores into bars',
  [TILES.ANVIL]:                 'Anvil — smith bars into equipment',
  [TILES.FURN_CHEST]:            'Chest — click to open storage',
  [TILES.FURN_BED]:              'Bed — click to rest and restore HP',
  [TILES.FARM_PATCH]:            'Empty soil patch — click to plant a seed',
  [TILES.FARM_PATCH_SEEDED]:     'Crop planted — growing...',
  [TILES.FARM_PATCH_GROWING]:    'Crop growing — almost ready...',
  [TILES.FARM_PATCH_READY]:      'Crop ready! — click to harvest',
  [TILES.DUNGEON_ENTRANCE]: '⚠ Dungeon Entrance — DANGEROUS. Walk onto it to descend.',
};

// Reverse lookup: item id string → item definition object
const ITEM_BY_ID = new Map(Object.values(ITEMS).map(item => [item.id, item]));

export class Game {
  constructor(canvas, savedState = null, username = null) {
    this.canvas = canvas;
    this.resizeCanvas();

    // Core systems
    this.world        = new World();
    this.player       = new Player(this.world);
    this._applyingRemoteTile = false; // prevents echo-back when applying others' tile changes
    // Intercept setTile so every world mutation is broadcast to other players
    const _origSetTile = this.world.setTile.bind(this.world);
    this.world.setTile = (col, row, tile) => {
      _origSetTile(col, row, tile);
      if (this.network && !this._applyingRemoteTile) {
        this.network.sendTileChange(col, row, tile);
      }
    };
    this.camera       = new Camera(canvas);
    this.input        = new Input(canvas);
    this.renderer     = new Renderer(canvas);
    this.inventory    = new Inventory();
    this.skills       = new Skills();
    this.notifications = new Notifications();
    this.actions      = new Actions(
      this.world, this.player, this.inventory,
      this.skills, this.notifications
    );
    this.mobManager      = new MobManager(this.world);
    this.remoteHitSplats = []; // hit splats from other players' combat
    this.shopKeeper      = new ShopKeeper();
    this.smithyKeeper    = new SmithyKeeper();
    this.makoverNpc      = new MakoverNPC();
    this.fishermanNpc     = new FishermanNPC();
    this.fishermanOpen    = false;
    this.fishermanTab     = 'guide';
    this.fishermanScrolls = { guide: 0, records: 0, buy: 0, sell: 0 };
    this.dungeonMaster   = new DungeonMasterNPC();
    this.fishingRecords  = makeFishingRecords();
    this.actions.fishingRecords = this.fishingRecords;
    this.combat          = new Combat(
      this.player, this.mobManager, this.inventory,
      this.skills, this.notifications, this.actions
    );
    this._hpRegenTimer = 0; // seconds since last magic-fire HP regen tick
    this.pendingInteract = null; // { type, col, row, worldX?, worldY? }
    this.clickDest       = null; // { col, row } — shown as click marker, null for WASD

    // Housing + farming systems
    this.housingState  = new HousingState();
    this.farmingState  = new FarmingState();
    this._farmTimer    = 0; // seconds between patch-stage checks

    // Interior / map transition system
    this.inInterior       = false;
    this.activeMap        = this.world;
    this.interiors        = buildAllInteriors(this.world.doorMap);
    this.interiors.set('player_house', buildPlayerHouse(this.housingState, this.farmingState));
    this.returnPos        = null;   // { col, row } to return to in world
    this.fadeAlpha        = 0;
    this.fadingOut        = false;
    this._fadeCallback    = null;
    this.transitionCooldown = 0;

    // Chest storage must exist before _restoreState populates it
    this.chestStorage  = new Map(); // "col,row" → Array<{item,qty}|null>[28]

    // Restore saved state, or give default starting inventory for new players
    if (savedState) {
      this._restoreState(savedState);
    } else {
      this.inventory.add(ITEMS.AXE);
      this.inventory.add(ITEMS.TINDERBOX);
      this.inventory.add(ITEMS.FISHING_ROD);
      this.inventory.add(ITEMS.PICKAXE);
      this.inventory.add(ITEMS.GOLD_COIN, 25);
    }
    // Always use the authenticated username — overrides any stale save value
    if (username) this.player.name = username;

    // Multiplayer network — created whenever a username is present (logged in).
    // Auth is handled by the HttpOnly session cookie; no token needed here.
    this.network       = username ? new Network() : null;
    this.remotePlayers = new Map(); // socketId → remote player view
    this._mobById      = new Map(); // mob id   → Mob object (server-synced)
    this._lastSentAction       = 'idle';
    this._lastSentActionLocked = false;
    this._lastSentCombatLevel  = 1;
    this._lastSentHp           = null; // null = not yet sent
    if (this.network) {
      this._setupNetworkHandlers();
      this.network.onForceLogout(({ reason }) => {
        this.notifications.add(`Logged out: ${reason}`, '#e74c3c');
        setTimeout(() => this._logout(), 1500);
      });
      // Relay mob hits to the server so all clients see the same HP
      this.combat.onMobDamaged = (mob, damage) => {
        if (!this.inRaid && mob.id !== undefined) this.network.sendMobHit(mob.id, damage);
      };
      // Relay attack swing animation to other clients
      this.combat.onPlayerAttack = () => {
        this.network.sendAttack();
      };
    }

    // Auto-save every 30 s + on page unload
    if (username) {
      // _saveToken repurposed as a truthy "logged-in" guard (no longer holds a JWT)
      this._saveToken    = true;
      this._loggingOut   = false; // set true in _logout() to suppress false 401 alarms
      this._saveUsername = username;
      setInterval(() => this._saveToServer(), 30_000);
      window.addEventListener('beforeunload', () => this._saveToServer(true));
    }

    // Idle auto-logout: 20 min idle → logout; warn at 30 s remaining
    this._idleTimeout  = 20 * 60; // seconds
    this._idleWarnAt   = 30;       // warn when this many seconds remain
    this._idleTimer    = this._idleTimeout;
    this._idleWarned   = false;
    const resetIdle = () => {
      this._idleTimer  = this._idleTimeout;
      this._idleWarned = false;
    };
    ['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(evt =>
      window.addEventListener(evt, resetIdle, { passive: true })
    );

    // Panel visibility
    this.showInventory = false;
    this.showSkills    = false;
    this.sidePanelTab  = 'inventory';
    this.xpFlashes     = [];
    this.shopOpen      = false;
    this.shopTab       = 'buy';
    this.smithyShopOpen = false;
    this.smithyShopTab  = 'buy';
    // Kingdom shop NPCs
    this.butcherKeeper  = new ButcherKeeper();
    this.weaponKeeper   = new WeaponKeeper();
    this.varietyKeeper  = new VarietyKeeper();
    this.capeKeeper     = new CapeKeeper();
    this.butcherShopOpen  = false;  this.butcherShopTab  = 'buy';
    this.weaponShopOpen   = false;  this.weaponShopTab   = 'buy';
    this.varietyShopOpen  = false;  this.varietyShopTab  = 'buy';
    this.capeShopOpen     = false;  this.capeShopTab     = 'buy';
    // Scroll offsets (pixels) for each shop panel
    this.shopScroll        = 0;
    this.smithyShopScroll  = 0;
    this.butcherShopScroll = 0;
    this.weaponShopScroll  = 0;
    this.varietyShopScroll = 0;
    this.capeShopScroll    = 0;
    this.houseShopOpen = false;
    this.houseShopKeeper = new HouseShopKeeper();
    this.placingFurniture = null; // { item, slotIndex } when in furniture placement mode
    this.placingRotation  = 0;   // 0-3 (×90°) — cycled with R

    // Housing build mode
    this.buildModeOpen     = false;
    this.buildModeStep     = 'grid'; // 'grid' | 'pick_room' | 'pick_furniture'
    this.buildModeSelGX    = null;
    this.buildModeSelGY    = null;
    this.buildModeRoomScroll = 0;
    this.buildModeFurnScroll = 0;
    // { gx, gy, defId, rotation } — active furniture-placement from build mode
    this.buildModeFurnPlacing = null;
    this.makoverOpen   = false;
    this.forgeOpen     = false;  // smelting panel (Furnace)
    this.smithOpen     = false;  // smithing panel (Anvil)
    this.chestOpen     = false;  // chest storage panel
    this.chestPos      = null;   // { col, row } of the open chest tile
    this.smithTab      = 'weapons'; // 'weapons' | 'tools' | 'armor'
    this.smithScrollOffsets = { weapons: 0, tools: 0, armor: 0 };
    this.playerViewOpen  = false; // character stat popup (from Worn tab)
    this.skillInfoSkill  = null;  // index of skill whose info popup is open, or null
    this.skillInfoScroll = 0;     // scroll offset in pixels for skill info popup

    // New panel flags — Agent 5
    this.skillsOpen    = false;  // full-screen Skills panel (K key)
    this.dialogueOpen  = false;  // NPC dialogue box
    this.dialogueData  = null;   // { npcName: string, text: string, options: Array<string> }

    // HUD state
    this.lastActiveSkill = null; // index of last skill that gained XP (for XP bar in HUD)
    // TODO: update this.lastActiveSkill = skillIndex whenever skills.addXp(skillIndex, ...) is called
    this.smeltingAction = null;  // { recipe, progress, duration } — animated smelting
    this.smithingAction = null;  // { recipe, progress, duration } — animated smithing
    this.showAdminTp   = false;
    this.adminEquipOpen  = false;

    // ── Raid system state ──────────────────────────────────────────
    this.raidMenuOpen      = false;
    this.raidSelectedRaid  = 0;   // index into RAID_DEFS
    this.raidSelectedDiff  = 0;   // index into RAID_DIFFICULTIES
    this.activeRaid        = null; // RaidInstance | null
    this.inRaid            = false;
    this.inDungeon         = false;
    this.activeDungeon     = null;
    this.dungeons          = buildAllDungeons(); // Map<id, DungeonInstance>
    this.showWorldMap      = false;
    this._worldMapCache    = null; // offscreen canvas, built lazily on first open
    this._mapZoom          = 1;   // zoom multiplier (1 = fit-to-screen)
    this._mapPanX          = 0;   // pan offset in screen pixels
    this._mapPanY          = 0;
    this._mapDragging      = false;
    this._mapDragStart     = null; // { x, y, panX, panY }
    this.equipPanelOpen  = false;   // worn-items panel
    this.contextMenu     = null;    // { x, y, invSlot, options:[{label,cb}] }

    // Chat system
    this.chatMessages     = [];       // { name, text, time } — most-recent last
    this.chatInputActive  = false;
    this._chatInput       = null;     // DOM <input> element, created on first open
    this._chatScrollOffset = 0;       // lines scrolled up from newest (0 = see latest)

    // Mouse screen pos for tooltip + drag
    this.mouseScreen = { x: 0, y: 0 };
    this.dragSlot    = -1;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen.x = e.clientX - rect.left;
      this.mouseScreen.y = e.clientY - rect.top;
      if (this._mapDragging && this._mapDragStart) {
        this._mapPanX = this._mapDragStart.panX + (this.mouseScreen.x - this._mapDragStart.x);
        this._mapPanY = this._mapDragStart.panY + (this.mouseScreen.y - this._mapDragStart.y);
      }
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (this.showWorldMap) {
        this._mapDragging   = true;
        this._mapDragStart  = { x: sx, y: sy, panX: this._mapPanX, panY: this._mapPanY };
        canvas.style.cursor = 'grabbing';
        return;
      }
      if (this.sidePanelTab !== 'inventory') return;
      const idx = this._getInventorySlotAt(sx, sy);
      if (idx !== -1 && this.inventory.slots[idx] !== null) {
        this.dragSlot = idx;
      }
    });

    window.addEventListener('mouseup', e => {
      if (this._mapDragging) {
        this._mapDragging  = false;
        this._mapDragStart = null;
        if (this.showWorldMap) canvas.style.cursor = 'grab';
        return;
      }
      if (this.dragSlot === -1) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const target = this._getInventorySlotAt(sx, sy);
      if (target !== -1 && target !== this.dragSlot) {
        this.inventory.swap(this.dragSlot, target);
        this.input.click = null;
      }
      this.dragSlot = -1;
    });

    // World map zoom — scroll wheel zooms around the mouse cursor
    canvas.addEventListener('wheel', e => {
      if (!this.showWorldMap) return;
      e.preventDefault();
      const rect    = canvas.getBoundingClientRect();
      const mouseX  = e.clientX - rect.left;
      const mouseY  = e.clientY - rect.top;
      const W = this.world.cols, H = this.world.rows;
      const cw = canvas.width,   ch = canvas.height;

      const baseScale = Math.min(cw * 0.88 / W, ch * 0.88 / H);
      const oldScale  = baseScale * this._mapZoom;

      // Zoom toward / away from cursor
      const factor    = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      this._mapZoom   = Math.max(0.8, Math.min(10, this._mapZoom * factor));
      const newScale  = baseScale * this._mapZoom;

      // Current map top-left corner
      const oldMW = W * oldScale, oldMH = H * oldScale;
      const oldMX = (cw - oldMW) / 2 + this._mapPanX;
      const oldMY = (ch - oldMH) / 2 + this._mapPanY;

      // Tile coordinates under the mouse
      const tileX = (mouseX - oldMX) / oldScale;
      const tileY = (mouseY - oldMY) / oldScale;

      // New map top-left that keeps that tile under the mouse
      const newMW = W * newScale, newMH = H * newScale;
      this._mapPanX = (mouseX - tileX * newScale) - (cw - newMW) / 2;
      this._mapPanY = (mouseY - tileY * newScale) - (ch - newMH) / 2;
    }, { passive: false });

    canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // Furniture removal — right-click on a placed item inside the player house
      if (this.inInterior && this.activeMap.id === 'player_house') {
        const worldPos = this.camera.screenToWorld(sx, sy);
        const col = Math.floor(worldPos.x / TILE_SIZE);
        const row = Math.floor(worldPos.y / TILE_SIZE);
        const menu = this._buildHouseFurnitureContextMenu(sx, sy, col, row);
        if (menu) { this.contextMenu = menu; return; }
      }

      // Default: inventory item context menu
      if (this.sidePanelTab !== 'inventory') return;
      const idx = this._getInventorySlotAt(sx, sy);
      if (idx !== -1 && this.inventory.slots[idx]) {
        this.contextMenu = this._buildContextMenu(sx, sy, idx);
      } else {
        this.contextMenu = null;
      }
    });

    // Snap camera
    this.camera.snapTo(this.player.cx, this.player.cy);

    // Timing
    this.lastTime = performance.now();
    this.elapsed  = 0;
    this.fps      = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('wheel', (e) => {
      if (this.skillInfoSkill !== null) {
        e.preventDefault();
        this.skillInfoScroll = Math.max(0, this.skillInfoScroll + e.deltaY);
      } else if (this.fishermanOpen) {
        e.preventDefault();
        const tab = this.fishermanTab;
        this.fishermanScrolls[tab] = Math.max(0, (this.fishermanScrolls[tab] || 0) + e.deltaY);
      } else if (this.shopOpen) {
        e.preventDefault();
        this.shopScroll = Math.max(0, this.shopScroll + e.deltaY);
      } else if (this.smithOpen) {
        e.preventDefault();
        const tab = this.smithTab;
        const maxScroll = Math.max(0, SMITH_RECIPES[tab].length * FORGE_ROW_H - SMITH_CONTENT_H);
        this.smithScrollOffsets[tab] = Math.max(0, Math.min(maxScroll, this.smithScrollOffsets[tab] + e.deltaY));
      } else if (this.smithyShopOpen) {
        e.preventDefault();
        this.smithyShopScroll = Math.max(0, this.smithyShopScroll + e.deltaY);
      } else if (this.butcherShopOpen) {
        e.preventDefault();
        this.butcherShopScroll = Math.max(0, this.butcherShopScroll + e.deltaY);
      } else if (this.weaponShopOpen) {
        e.preventDefault();
        this.weaponShopScroll = Math.max(0, this.weaponShopScroll + e.deltaY);
      } else if (this.varietyShopOpen) {
        e.preventDefault();
        this.varietyShopScroll = Math.max(0, this.varietyShopScroll + e.deltaY);
      } else if (this.capeShopOpen) {
        e.preventDefault();
        this.capeShopScroll = Math.max(0, this.capeShopScroll + e.deltaY);
      } else {
        // Scroll the chat log (no panel open)
        const totalItems = this.notifications.messages.length + this.chatMessages.length;
        const MAX_LINES  = 7;
        const maxOffset  = Math.max(0, totalItems - MAX_LINES);
        if (maxOffset > 0) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -1 : 1; // up = scroll toward older messages
          this._chatScrollOffset = Math.max(0, Math.min(maxOffset, this._chatScrollOffset + delta));
        }
      }
    }, { passive: false });

    // Hook: fired by combat.js when player HP hits 0 (before respawn)
    this.combat.onPlayerDeath = () => {
      if (this.inRaid && this.activeRaid && !this.activeRaid.failed) {
        this.activeRaid.onPlayerDeath();
      }

      // Exit dungeon/interior so _respawnPlayer() lands in the overworld
      if (this.inDungeon) {
        this.inDungeon         = false;
        this.activeDungeon     = null;
        this.activeMap         = this.world;
        this.player.world      = this.world;
        this.actions.world     = this.world;
        this.combat.mobManager = this.mobManager;
        this.fadingOut         = false;
        this.fadeAlpha         = 0;
        this._fadeCallback     = null;
        this.camera.setBounds();
        this.transitionCooldown = 1.0;
        this.notifications.add('You died in the dungeon and were carried to safety.', '#e74c3c');
      } else if (this.inInterior) {
        this.inInterior        = false;
        this.activeMap         = this.world;
        this.player.world      = this.world;
        if (this.actions) this.actions.world = this.world;
        this.fadingOut         = false;
        this.fadeAlpha         = 0;
        this._fadeCallback     = null;
        this.camera.setBounds();
        this.transitionCooldown = 1.0;
      }
    };
    // Hook: fired by combat.js each time the player takes damage
    this.combat.onPlayerDamaged = (dmg) => {
      if (this.inRaid && this.activeRaid && !this.activeRaid.complete && !this.activeRaid.failed) {
        this.activeRaid.onPlayerDamaged(dmg);
      }
      if (this.network && !this.inRaid) {
        // Splat positioned at centre-top of the player sprite
        const wx = this.player.x + (this.player.w ?? 24) / 2;
        const wy = this.player.y + (this.player.h ?? 32) * 0.25;
        this.network.sendPlayerSplat(dmg, wx, wy);
        this.network.sendPlayerHp(this.player.hp, this.player.maxHp);
      }
    };

    this.notifications.add('Welcome! You have an Axe, Pickaxe, Tinderbox, Fishing Rod, and 25g.', '#f1c40f');
    this.notifications.add('Explore biomes: Forest, Tundra, Swamp, Desert, Volcanic & Danger Zone!', '#aaa');
    this.notifications.add('Click mobs to fight. Dangerous mobs in the NE corner will attack you!', '#e74c3c');
  }

  resizeCanvas() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.renderer) {
      this.renderer.minimapDirty = true;
    }
  }

  run() {
    // rAF handle so we can cancel it when switching to hidden-tab mode
    this._rafId = null;
    // setInterval handle used while the tab is hidden
    this._hiddenInterval = null;

    const HIDDEN_TICK_MS = 50; // ~20 tps while hidden — enough for timers/autosave/logout

    const tick = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.elapsed += dt;

      this.frameCount++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 1) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      this.update(dt);
      if (!document.hidden) {
        this.draw();
        this.input.endFrame();
      }
    };

    const rafLoop = (now) => {
      tick(now);
      this._rafId = requestAnimationFrame(rafLoop);
    };

    const startRaf = () => {
      this.lastTime = performance.now();
      this._rafId = requestAnimationFrame(rafLoop);
    };

    const startHidden = () => {
      this.lastTime = performance.now();
      this._hiddenInterval = setInterval(() => {
        tick(performance.now());
      }, HIDDEN_TICK_MS);
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Switching away — move from rAF to interval so updates keep running
        if (this._rafId !== null) {
          cancelAnimationFrame(this._rafId);
          this._rafId = null;
        }
        startHidden();
      } else {
        // Returning — cancel interval, resume rAF
        if (this._hiddenInterval !== null) {
          clearInterval(this._hiddenInterval);
          this._hiddenInterval = null;
        }
        startRaf();
      }
    });

    startRaf();
  }

  update(dt) {
    // Fade animation
    if (this.transitionCooldown > 0) this.transitionCooldown -= dt;

    if (this.fadingOut) {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt * 3);
      if (this.fadeAlpha >= 1 && this._fadeCallback) {
        this._fadeCallback();
        this._fadeCallback = null;
        this.fadingOut = false;
      }
      return; // freeze game during transition
    } else if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 3);
    }

    // Chat input open/close
    if (this.input.wasJustPressed('Enter')) {
      if (this.chatInputActive) {
        this._submitChat();
      } else {
        this._openChat();
      }
    }
    if (this.chatInputActive) {
      // While chat is open: Esc cancels, movement and panel keys are blocked
      if (this.input.wasJustPressed('Escape')) {
        this._closeChat();
      }
      this.input.endFrame(); // consume all remaining keys
      return;
    }

    // Panel toggles
    if (this.input.wasJustPressed('KeyI')) {
      this.sidePanelTab = 'inventory';
    }
    if (this.input.wasJustPressed('KeyK')) {
      this.skillsOpen = !this.skillsOpen;
    }
    if (this.input.wasJustPressed('Tab')) {
      const tabs = ['inventory', 'skills', 'equip'];
      this.sidePanelTab = tabs[(tabs.indexOf(this.sidePanelTab) + 1) % tabs.length];
    }
    if (this.input.wasJustPressed('KeyE')) {
      this.sidePanelTab = 'equip';
      this.contextMenu = null;
    }
    if (this.input.wasJustPressed('Backquote')) {
      this.showAdminTp = !this.showAdminTp;
    }
    if (this.input.wasJustPressed('KeyM')) {
      this.showWorldMap = !this.showWorldMap;
      if (this.showWorldMap) {
        this._mapZoom = 1; this._mapPanX = 0; this._mapPanY = 0;
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
    if (this.input.wasJustPressed('KeyG')) {
      this.adminEquipOpen = !this.adminEquipOpen;
    }
    if (this.input.wasJustPressed('KeyR') && this.placingFurniture) {
      this.placingRotation = (this.placingRotation + 1) & 3;
    }
    if (this.input.wasJustPressed('KeyR') && this.buildModeFurnPlacing) {
      this.buildModeFurnPlacing = { ...this.buildModeFurnPlacing, rotation: (this.buildModeFurnPlacing.rotation + 1) & 3 };
    }
    // Build mode toggle (B key — only in player house)
    if (this.input.wasJustPressed('KeyB') && this.inInterior && this.activeMap.id === 'player_house' && !this.buildModeFurnPlacing) {
      this.buildModeOpen = !this.buildModeOpen;
      this.buildModeStep = 'grid';
      this.buildModeSelGX = null;
      this.buildModeSelGY = null;
    }
    // Escape closes panels / cancels action / drops combat
    if (this.input.wasJustPressed('Escape')) {
      if (this.showWorldMap) {
        this.showWorldMap = false;
        this.canvas.style.cursor = 'default';
      } else if (this.contextMenu) {
        this.contextMenu = null;
      } else if (this.adminEquipOpen) {
        this.adminEquipOpen = false;
      } else if (this.showAdminTp) {
        this.showAdminTp = false;
      } else if (this.buildModeFurnPlacing) {
        this.buildModeFurnPlacing = null;
        this.buildModeOpen = true;
      } else if (this.buildModeOpen) {
        this.buildModeOpen = false;
      } else if (this.placingFurniture) {
        this.placingFurniture = null;
      } else if (this.skillInfoSkill !== null) {
        this.skillInfoSkill  = null;
        this.skillInfoScroll = 0;
      } else if (this.playerViewOpen) {
        this.playerViewOpen = false;
      } else if (this.forgeOpen) {
        this.forgeOpen = false;
      } else if (this.smithOpen) {
        this.smithOpen = false;
      } else if (this.chestOpen) {
        this.chestOpen = false;
        this.chestPos  = null;
      } else if (this.houseShopOpen) {
        this.houseShopOpen = false;
      } else if (this.smithyShopOpen) {
        this.smithyShopOpen = false;
      } else if (this.shopOpen) {
        this.shopOpen = false;
      } else if (this.butcherShopOpen) {
        this.butcherShopOpen = false;
      } else if (this.weaponShopOpen) {
        this.weaponShopOpen = false;
      } else if (this.varietyShopOpen) {
        this.varietyShopOpen = false;
      } else if (this.capeShopOpen) {
        this.capeShopOpen = false;
      } else if (this.makoverOpen) {
        this.makoverOpen = false;
      } else if (this.fishermanOpen) {
        this.fishermanOpen = false;
      } else if (this.raidMenuOpen) {
        this.raidMenuOpen = false;
      } else if (this.skillsOpen) {
        this.skillsOpen = false;
      } else if (this.dialogueOpen) {
        this.dialogueOpen = false;
        this.dialogueData = null;
      } else if (this.inRaid && this.activeRaid && this.activeRaid.complete) {
        this._exitRaid();
      } else if (this.inRaid) {
        this._exitRaid();
        this.notifications.add('Raid abandoned.', '#e74c3c');
      } else if (this.combat.isInCombat) {
        if (this.network) this.network.sendStopCombat(this.combat.targetMob.id);
        this.combat.clearTarget();
      } else if (this.actions.isActive) {
        this.actions.cancel();
        this.player.actionLocked = false;
        this.pendingInteract = null;
      }
    }

    const dir = this.input.getDirection();
    const click = this.showWorldMap ? (this.input.consumeClick(), null) : this.input.consumeClick();

    // Keyboard movement cancels queued interaction and click marker
    if (dir.x !== 0 || dir.y !== 0) {
      this.pendingInteract = null;
      this.clickDest = null;
    }

    if (click) {
      // Logout button (always checked first)
      if (this._saveToken) {
        const lb = this._logoutButtonRect();
        if (click.screenX >= lb.x && click.screenX <= lb.x + lb.w &&
            click.screenY >= lb.y && click.screenY <= lb.y + lb.h) {
          this._logout();
          return;
        }
      }
      if (this.buildModeOpen) {
        this._handleBuildModeClick(click.screenX, click.screenY);
        return;
      } else if (this.buildModeFurnPlacing) {
        const worldPos = this.camera.screenToWorld(click.screenX, click.screenY);
        this._placeBuildModeFurniture(Math.floor(worldPos.x / TILE_SIZE), Math.floor(worldPos.y / TILE_SIZE));
        return;
      } else if (this.contextMenu) {
        this._handleContextMenuClick(click.screenX, click.screenY);
      } else if (this.activeRaid && this.activeRaid.complete) {
        this._handleRaidSummaryClick(click.screenX, click.screenY);
        return;
      } else if (this.raidMenuOpen) {
        this._handleRaidMenuClick(click.screenX, click.screenY);
        return;
      } else if (this.adminEquipOpen) {
        this._handleAdminEquipClick(click.screenX, click.screenY);
      } else if (this.showAdminTp) {
        this._handleAdminTpClick(click.screenX, click.screenY);
      } else if (this.playerViewOpen) {
        this._handlePlayerViewClick(click.screenX, click.screenY);
      } else if (this.forgeOpen) {
        this._handleSmeltClick(click.screenX, click.screenY);
      } else if (this.smithOpen) {
        this._handleSmithClick(click.screenX, click.screenY);
      } else if (this.chestOpen) {
        this._handleChestClick(click.screenX, click.screenY);
      } else if (this.houseShopOpen) {
        this._handleHouseShopClick(click.screenX, click.screenY);
      } else if (this.smithyShopOpen) {
        this._handleSmithyShopClick(click.screenX, click.screenY);
      } else if (this.shopOpen) {
        this._handleShopClick(click.screenX, click.screenY);
      } else if (this.butcherShopOpen) {
        this._handleKingdomShopClick(click.screenX, click.screenY, 'butcher');
      } else if (this.weaponShopOpen) {
        this._handleKingdomShopClick(click.screenX, click.screenY, 'weapon');
      } else if (this.varietyShopOpen) {
        this._handleKingdomShopClick(click.screenX, click.screenY, 'variety');
      } else if (this.capeShopOpen) {
        this._handleKingdomShopClick(click.screenX, click.screenY, 'cape');
      } else if (this.makoverOpen) {
        this._handleMakeoverClick(click.screenX, click.screenY);
      } else if (this.fishermanOpen) {
        this._handleFishermanClick(click.screenX, click.screenY);
        return;
      } else if (this.skillsOpen) {
        this._handleSkillsPanelClick(click.screenX, click.screenY);
        return;
      } else if (this.dialogueOpen) {
        this._handleDialogueClick(click.screenX, click.screenY);
        return;
      } else if (this._clickOnSidePanel(click.screenX, click.screenY)) {
        // handled
      } else if (!this._clickOnUI(click.screenX, click.screenY)) {
        // Cancel any running skill action when clicking in the world
        if (this.player.actionLocked) {
          this.actions.cancel();
          this.player.actionLocked = false;
        }
        this.pendingInteract = null;

        const worldPos = this.camera.screenToWorld(click.screenX, click.screenY);
        const clickCol  = Math.floor(worldPos.x / TILE_SIZE);
        const clickRow  = Math.floor(worldPos.y / TILE_SIZE);

        // ── Furniture placement mode ──────────────────────
        if (this.placingFurniture) {
          this._placeFurniture(clickCol, clickRow);
        // ── House shopkeeper (interior only) ──────────────
        } else if (this.inInterior && this.activeMap.id === 'player_house' &&
                   this.houseShopKeeper.containsWorld(worldPos.x, worldPos.y)) {
          const npcCol = Math.floor((this.houseShopKeeper.x + this.houseShopKeeper.w / 2) / TILE_SIZE);
          const npcRow = Math.floor((this.houseShopKeeper.y + this.houseShopKeeper.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, npcCol, npcRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'house_shop', col: npcCol, row: npcRow };
            this.clickDest = { col: npcCol, row: npcRow };
          }
        // ── Check for ground item pickup first (world only) ─
        } else if (!this.inInterior && this.combat.tryPickup(worldPos.x, worldPos.y)) {
          // Picked up item — no movement needed
        } else if (!this.inInterior && !this.inRaid && this.dungeonMaster.containsWorld(worldPos.x, worldPos.y)) {
          const dmCol = Math.floor(this.dungeonMaster.cx / TILE_SIZE);
          const dmRow = Math.floor(this.dungeonMaster.cy / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.activeMap, dmCol, dmRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'dungeon_master', col: dmCol, row: dmRow };
            this.clickDest = { col: dmCol, row: dmRow };
          }
        } else if (!this.inInterior && this.shopKeeper.containsWorld(worldPos.x, worldPos.y)) {
          // Walk to shopkeeper then open shop
          const skCol = Math.floor((this.shopKeeper.x + this.shopKeeper.w / 2) / TILE_SIZE);
          const skRow = Math.floor((this.shopKeeper.y + this.shopKeeper.h / 2) / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.activeMap, skCol, skRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'shop', col: skCol, row: skRow };
            this.clickDest = { col: skCol, row: skRow };
          }
        } else if (!this.inInterior && this.smithyKeeper.containsWorld(worldPos.x, worldPos.y)) {
          // Walk to smithy keeper then open smithy shop
          const smCol = Math.floor((this.smithyKeeper.x + this.smithyKeeper.w / 2) / TILE_SIZE);
          const smRow = Math.floor((this.smithyKeeper.y + this.smithyKeeper.h / 2) / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.activeMap, smCol, smRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'smithy', col: smCol, row: smRow };
            this.clickDest = { col: smCol, row: smRow };
          }
        } else if (!this.inInterior && this.makoverNpc.containsWorld(worldPos.x, worldPos.y)) {
          // Walk to Makeover NPC
          const moCol = Math.floor(this.makoverNpc.cx / TILE_SIZE);
          const moRow = Math.floor(this.makoverNpc.cy / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.activeMap, moCol, moRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'makeover', col: moCol, row: moRow };
            this.clickDest = { col: moCol, row: moRow };
          }
        } else if (!this.inInterior && this.fishermanNpc.containsWorld(worldPos.x, worldPos.y)) {
          const fnCol = Math.floor((this.fishermanNpc.x + this.fishermanNpc.w / 2) / TILE_SIZE);
          const fnRow = Math.floor((this.fishermanNpc.y + this.fishermanNpc.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, fnCol, fnRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'fisherman', col: fnCol, row: fnRow };
            this.clickDest = { col: fnCol, row: fnRow };
          }
        } else if (!this.inInterior && this.butcherKeeper.containsWorld(worldPos.x, worldPos.y)) {
          const col = Math.floor((this.butcherKeeper.x + this.butcherKeeper.w / 2) / TILE_SIZE);
          const row = Math.floor((this.butcherKeeper.y + this.butcherKeeper.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, col, row, this.player.col, this.player.row);
          if (adj) { this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row)); this.pendingInteract = { type: 'butcher', col, row }; this.clickDest = { col, row }; }
        } else if (!this.inInterior && this.weaponKeeper.containsWorld(worldPos.x, worldPos.y)) {
          const col = Math.floor((this.weaponKeeper.x + this.weaponKeeper.w / 2) / TILE_SIZE);
          const row = Math.floor((this.weaponKeeper.y + this.weaponKeeper.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, col, row, this.player.col, this.player.row);
          if (adj) { this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row)); this.pendingInteract = { type: 'weapon_shop', col, row }; this.clickDest = { col, row }; }
        } else if (!this.inInterior && this.varietyKeeper.containsWorld(worldPos.x, worldPos.y)) {
          const col = Math.floor((this.varietyKeeper.x + this.varietyKeeper.w / 2) / TILE_SIZE);
          const row = Math.floor((this.varietyKeeper.y + this.varietyKeeper.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, col, row, this.player.col, this.player.row);
          if (adj) { this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row)); this.pendingInteract = { type: 'variety_shop', col, row }; this.clickDest = { col, row }; }
        } else if (!this.inInterior && this.capeKeeper.containsWorld(worldPos.x, worldPos.y)) {
          const col = Math.floor((this.capeKeeper.x + this.capeKeeper.w / 2) / TILE_SIZE);
          const row = Math.floor((this.capeKeeper.y + this.capeKeeper.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.activeMap, col, row, this.player.col, this.player.row);
          if (adj) { this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, adj.col, adj.row)); this.pendingInteract = { type: 'cape_shop', col, row }; this.clickDest = { col, row }; }
        } else if (!this.inInterior) {
          // ── World / raid / dungeon: mob clicks & interactable tiles ──
          const navMap    = this.activeMap; // always use active map for pathfinding
          const mobSource = this.inRaid    ? this.activeRaid
                          : this.inDungeon ? this.activeDungeon
                          :                  this.mobManager;
          const clickedMob = mobSource.getMobAt(worldPos.x, worldPos.y);
          if (clickedMob) {
            const mobCol = Math.floor(clickedMob.cx / TILE_SIZE);
            const mobRow = Math.floor(clickedMob.cy / TILE_SIZE);
            const adj = nearestWalkableAdjacent(navMap, mobCol, mobRow, this.player.col, this.player.row);
            if (adj) {
              this.player.setPath(findPath(navMap, this.player.col, this.player.row, adj.col, adj.row));
              this.pendingInteract = { type: 'combat', mob: clickedMob };
              this.clickDest = { col: mobCol, row: mobRow };
            } else {
              this.combat.setTarget(clickedMob);
              if (this.network) this.network.sendStartCombat(clickedMob.id);
            }
          } else if (TILE_TOOLTIPS[this.activeMap.getTile(clickCol, clickRow)] !== undefined
                     && this.activeMap.getTile(clickCol, clickRow) !== TILES.ROCK_DEPLETED) {
            const solid = this.activeMap.isSolid(clickCol, clickRow);
            const target = solid
              ? nearestWalkableAdjacent(navMap, clickCol, clickRow, this.player.col, this.player.row)
              : { col: clickCol, row: clickRow };
            if (target) {
              this.player.setPath(findPath(navMap, this.player.col, this.player.row, target.col, target.row));
              this.pendingInteract = { type: 'action', col: clickCol, row: clickRow, worldX: worldPos.x, worldY: worldPos.y };
              this.clickDest = { col: clickCol, row: clickRow };
            }
          } else {
            this.player.setPath(findPath(navMap, this.player.col, this.player.row, clickCol, clickRow));
            this.clickDest = { col: clickCol, row: clickRow };
          }
        } else {
          // ── Interior: plain walk, farm patch, or furniture interaction ─
          const iTile = this.activeMap.getTile(clickCol, clickRow);
          if (this.activeMap.id === 'player_house' &&
              (iTile === TILES.FARM_PATCH || iTile === TILES.FARM_PATCH_SEEDED ||
               iTile === TILES.FARM_PATCH_GROWING || iTile === TILES.FARM_PATCH_READY)) {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, clickCol, clickRow));
            this.pendingInteract = { type: 'farm_patch', col: clickCol, row: clickRow };
            this.clickDest = { col: clickCol, row: clickRow };
          } else if (TILE_TOOLTIPS[iTile] !== undefined) {
            // Furniture or interactive tile inside interior — walk adjacent then interact
            const solid = this.activeMap.isSolid(clickCol, clickRow);
            const target = solid
              ? nearestWalkableAdjacent(this.activeMap, clickCol, clickRow, this.player.col, this.player.row)
              : { col: clickCol, row: clickRow };
            if (target) {
              this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, target.col, target.row));
              this.pendingInteract = { type: 'action', col: clickCol, row: clickRow, worldX: worldPos.x, worldY: worldPos.y };
              this.clickDest = { col: clickCol, row: clickRow };
            }
          } else {
            this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, clickCol, clickRow));
            this.clickDest = { col: clickCol, row: clickRow };
          }
        }
      }
    }

    // Update player movement
    const result = this.player.update(dt, dir, this.activeMap, this.input);

    // Broadcast position to other players (Network class throttles duplicate emissions)
    if (this.network && !this.inInterior) {
      this.network.sendMove(this.player.col, this.player.row, this.player.dir);
    }

    // Idle auto-logout timer (only when logged in)
    if (this._saveToken) {
      this._idleTimer -= dt;
      if (!this._idleWarned && this._idleTimer <= this._idleWarnAt) {
        this._idleWarned = true;
        this.notifications.add('You will be logged out in 30 seconds due to inactivity.', '#e67e22');
      }
      if (this._idleTimer <= 0) {
        this._logout();
      }
    }

    if (result === 'cancel_action') {
      this.actions.cancel();
      this.pendingInteract = null;
    }

    // Keep local player's combat level and max HP up to date
    this.player.combatLevel = Math.max(1, Math.floor(
      (this.skills.getLevel(SKILL_IDS.ATTACK)    + this.skills.getLevel(SKILL_IDS.STRENGTH) +
       this.skills.getLevel(SKILL_IDS.DEFENCE)   + this.skills.getLevel(SKILL_IDS.HITPOINTS)) / 4
    ));
    this._recalcMaxHp();

    // Sync combat level and HP changes to other players
    if (this.network) {
      if (this.player.combatLevel !== this._lastSentCombatLevel) {
        this._lastSentCombatLevel = this.player.combatLevel;
        this.network.sendEquip(this.player.equipment, this.player.style, this.player.name, this.player.combatLevel);
      }
      if (this.player.hp !== this._lastSentHp) {
        this._lastSentHp = this.player.hp;
        this.network.sendPlayerHp(this.player.hp, this.player.maxHp);
      }
    }

    // Interpolate and animate remote players
    for (const view of this.remotePlayers.values()) {
      if (view.moveT < REMOTE_MOVE_TIME) {
        view.moveT += dt;
        const p = Math.min(view.moveT / REMOTE_MOVE_TIME, 1);
        view.x = view._fromX + (view._toX - view._fromX) * p;
        view.y = view._fromY + (view._toY - view._fromY) * p;
        view.moving = view.moveT < REMOTE_MOVE_TIME;
      } else {
        view.moving = false;
      }

      if (view.moving) {
        view.animTimer += dt;
        if (view.animTimer > 0.15) {
          view.animTimer = 0;
          view.animFrame = (view.animFrame + 1) % 4;
        }
      } else {
        view.animFrame = 0;
        view.animTimer = 0;
      }

      // Tick skill animation for remote players doing actions
      if (view.actionLocked || view.currentAction === 'fight') {
        view.skillAnim += dt;
      } else {
        view.skillAnim = 0;
      }
    }

    // Interpolate networked mob positions (avoids 100ms snap jitter)
    if (this.network) {
      for (const mob of this.mobManager.mobs) {
        if (mob._lerpT !== undefined && mob._lerpT < 0.15) {
          mob._lerpT += dt;
          const p = Math.min(mob._lerpT / 0.15, 1);
          mob.x = mob._fromX + (mob._toX - mob._fromX) * p;
          mob.y = mob._fromY + (mob._toY - mob._fromY) * p;
        }
      }
    }

    // Interior transition triggers
    if (this.transitionCooldown <= 0) {
      const tile = this.activeMap.getTile(this.player.col, this.player.row);
      if (!this.inInterior && !this.inRaid && !this.inDungeon && tile === TILES.PORTAL) {
        this._beginTransition(() => this._enterInterior('player_house'));
      } else if (!this.inInterior && !this.inRaid && !this.inDungeon && tile === TILES.DUNGEON_ENTRANCE) {
        const dungId = this.world.dungeonMap?.get(`${this.player.col},${this.player.row}`);
        if (dungId) this._enterDungeon(dungId);
      } else if (this.inDungeon && tile === TILES.STAIRS) {
        this._exitDungeon();
      } else if (this.inInterior && tile === TILES.STAIRS) {
        this._beginTransition(() => this._exitToWorld());
      }
    }

    // Clear click marker once the player has stopped
    if (!this.player.moving && this.player.path.length === 0) {
      this.clickDest = null;
    }

    // Fire pending interaction once the player has stopped at the destination
    if (this.pendingInteract && !this.player.moving && this.player.path.length === 0) {
      const pi = this.pendingInteract;
      this.pendingInteract = null;
      if (pi.type === 'house_shop') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.houseShopOpen = true;
      } else if (pi.type === 'dungeon_master') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.raidMenuOpen = true;
      } else if (pi.type === 'shop') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.shopOpen = true;
      } else if (pi.type === 'smithy') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.smithyShopOpen = true;
      } else if (pi.type === 'makeover') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.makoverOpen = true;
      } else if (pi.type === 'fisherman') {
        const dx = pi.col - this.player.col;
        const dy = pi.row - this.player.row;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 2.5) {
          this.fishermanOpen = true;
        }
      } else if (pi.type === 'butcher') {
        if (Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row) <= 2) this.butcherShopOpen = true;
      } else if (pi.type === 'weapon_shop') {
        if (Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row) <= 2) this.weaponShopOpen = true;
      } else if (pi.type === 'variety_shop') {
        if (Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row) <= 2) this.varietyShopOpen = true;
      } else if (pi.type === 'cape_shop') {
        if (Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row) <= 2) this.capeShopOpen = true;
      } else if (pi.type === 'action') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) {
          // Intercept furnace / anvil / house furniture before regular action handler
          const tileAtTarget = this.activeMap.getTile(pi.col, pi.row);
          if (tileAtTarget === TILES.FURNACE) {
            this.forgeOpen = true;
            return;
          } else if (tileAtTarget === TILES.ANVIL) {
            this.smithOpen = true;
            return;
          } else if (tileAtTarget === TILES.FURN_CHEST) {
            this.chestOpen = true;
            this.chestPos  = { col: pi.col, row: pi.row };
            return;
          } else if (tileAtTarget === TILES.FURN_BED) {
            if (this.player.hp < this.player.maxHp) {
              this.player.hp = this.player.maxHp;
              this.notifications.add('You rest in the bed. HP fully restored!', '#27ae60');
            } else {
              this.notifications.add('You are already at full health.', '#aaa');
            }
            return;
          }
          const triggered = this.actions.tryAction(pi.worldX, pi.worldY);
          if (triggered) {
            this.player.actionLocked = true;
            this.player.actionTarget = { col: pi.col, row: pi.row };
            // Face toward the target tile
            const fdc = pi.col - this.player.col;
            const fdr = pi.row - this.player.row;
            if (Math.abs(fdc) >= Math.abs(fdr)) {
              this.player.dir = fdc > 0 ? DIR.RIGHT : DIR.LEFT;
            } else {
              this.player.dir = fdr > 0 ? DIR.DOWN : DIR.UP;
            }
            const t = this.activeMap.getTile(pi.col, pi.row);
            if (TREE_TILES.has(t))
              this.player.currentAction = 'chop';
            else if (t === TILES.FISH_SPOT)
              this.player.currentAction = 'fish';
            else if (t === TILES.ROCK_COPPER || t === TILES.ROCK_TIN || t === TILES.ROCK_IRON ||
                     t === TILES.ROCK_COAL   || t === TILES.ROCK_SILVER || t === TILES.ROCK_GOLD ||
                     t === TILES.ROCK_MITHRIL || t === TILES.ROCK_TUNGSTEN ||
                     t === TILES.ROCK_OBSIDIAN || t === TILES.ROCK_MOONSTONE)
              this.player.currentAction = 'mine';
            else if (t === TILES.FIRE)
              this.player.currentAction = 'cook';
            else if (t === TILES.BERRY_BUSH   || t === TILES.MUSHROOM ||
                     t === TILES.WILD_HERB    || t === TILES.REEDS    ||
                     t === TILES.FLAX_PLANT   || t === TILES.SNOWBERRY ||
                     t === TILES.SULFUR_ROCK  || t === TILES.THORN_BUSH ||
                     t === TILES.DESERT_FLOWER)
              this.player.currentAction = 'forage';
            else
              this.player.currentAction = 'idle';
          }
        }
      } else if (pi.type === 'combat') {
        // Start attacking the mob now that we're close
        if (!pi.mob.dead) {
          this.combat.setTarget(pi.mob);
          if (this.network) this.network.sendStartCombat(pi.mob.id);
          this.player.currentAction = 'fight';
          this.player.skillAnim = 1.0;  // suppress stab until first real attack fires
          // Face toward the mob
          const mdx = pi.mob.cx - this.player.cx;
          const mdy = pi.mob.cy - this.player.cy;
          if (Math.abs(mdx) >= Math.abs(mdy)) {
            this.player.dir = mdx > 0 ? DIR.RIGHT : DIR.LEFT;
          } else {
            this.player.dir = mdy > 0 ? DIR.DOWN : DIR.UP;
          }
        }
      } else if (pi.type === 'farm_patch') {
        this._handleFarmPatchInteract(pi.col, pi.row);
      }
    }

    // Farming patch stage check (every 5 s while inside player house)
    this._farmTimer += dt;
    if (this._farmTimer >= 5) {
      this._farmTimer = 0;
      this._updateFarmingPatches();
    }

    // Greenhouse timers (dt-based, run always so crops grow even when away)
    this.farmingState.tick(dt);

    // Animal pen produce timers (only meaningful when logged in)
    if (this.inInterior) {
      this.housingState.tickAnimals(dt);
    }

    // Update systems
    this.actions.update(dt);
    this.combat.update(dt);

    // Magic fire HP regen — 1 HP every 8 seconds when near a magic log fire
    this._hpRegenTimer += dt;
    if (this._hpRegenTimer >= 8) {
      this._hpRegenTimer = 0;
      const pCol = Math.floor(this.player.cx / TILE_SIZE);
      const pRow = Math.floor(this.player.cy / TILE_SIZE);
      if (this.actions.getFirePerks(pCol, pRow).has('HP_REGEN') && this.player.hp < this.player.maxHp) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.notifications.add('The magic fire restores your health. (+1 HP)', '#2ecc71');
      }
    }
    for (const s of this.remoteHitSplats) s.timer += dt;
    this.remoteHitSplats = this.remoteHitSplats.filter(s => s.timer < s.maxTimer);

    // Consume XP gain events from skills queue
    // Smelting action tick
    if (this.smeltingAction) {
      this.smeltingAction.progress += dt / this.smeltingAction.duration;
      if (this.smeltingAction.progress >= 1) {
        const { recipe, remaining, total, baseDuration } = this.smeltingAction;
        this.inventory.add(recipe.output(), 1);
        this.skills.addXp(SKILL_IDS.FORGERY, recipe.xp);
        const newRemaining = remaining - 1;
        if (newRemaining > 0) {
          const hasIngredients = recipe.inputs.every(({ item, qty }) =>
            this.inventory.count(item().id) >= qty
          );
          const hasSpace = !this.inventory.isFull() || this.inventory.has(recipe.output().id);
          if (hasIngredients && hasSpace) {
            for (const { item, qty } of recipe.inputs) {
              this.inventory.remove(item().id, qty);
            }
            const barIndex = total - newRemaining + 1; // 1-indexed bar about to start
            const nextDuration = baseDuration * (1 + 0.15 * (barIndex - 1));
            this.smeltingAction = { recipe, progress: 0, duration: nextDuration, baseDuration, remaining: newRemaining, total };
          } else {
            const barsCompleted = total - newRemaining;
            this.notifications.add(`Smelted ${barsCompleted}x ${recipe.name}! (+${recipe.xp * barsCompleted} Forgery XP)`, '#ff8c42');
            this.smeltingAction = null;
          }
        } else {
          if (total > 1) {
            this.notifications.add(`Smelted ${total}x ${recipe.name}! (+${recipe.xp * total} Forgery XP)`, '#ff8c42');
          } else {
            this.notifications.add(`Smelted ${recipe.name}! (+${recipe.xp} Forgery XP)`, '#ff8c42');
          }
          this.smeltingAction = null;
        }
      }
    }

    // Smithing tick
    if (this.smithingAction) {
      this.smithingAction.progress += dt / this.smithingAction.duration;
      if (this.smithingAction.progress >= 1) {
        const { recipe } = this.smithingAction;
        this.inventory.add(recipe.output(), 1);
        this.skills.addXp(SKILL_IDS.FORGERY, recipe.xp);
        this.notifications.add(`Forged ${recipe.name}! (+${recipe.xp} Forgery XP)`, '#4a90d9');
        this.smithingAction = null;
      }
    }

    for (const ev of this.skills.xpGainQueue) {
      this.lastActiveSkill = ev.skillId; // drives HUD XP bar (Agent 5)
      const existing = this.xpFlashes.find(f => f.skillId === ev.skillId);
      const level = this.skills.getLevel(ev.skillId);
      if (existing) {
        existing.gained += ev.gained;
        existing.progAfter = ev.progAfter;
        existing.level = level;
        existing.animSpeed = (ev.progAfter - existing.displayProg) / 0.6;
        existing.timer = 5;
      } else {
        const delta = ev.progAfter - ev.progBefore;
        this.xpFlashes.push({
          skillId: ev.skillId,
          gained: ev.gained,
          timer: 5,
          level,
          progAfter: ev.progAfter,
          displayProg: ev.progBefore,
          animSpeed: Math.max(delta / 0.6, 0.001),
        });
      }
    }
    this.skills.xpGainQueue = [];
    // Tick flash timers and animate bar fill
    for (const f of this.xpFlashes) {
      f.timer -= dt;
      if (f.displayProg < f.progAfter) {
        f.displayProg = Math.min(f.progAfter, f.displayProg + f.animSpeed * dt);
      }
    }
    this.xpFlashes = this.xpFlashes.filter(f => f.timer > 0);

    // Unlock player once action completes
    if (!this.actions.isActive && this.player.actionLocked) {
      this.player.actionLocked  = false;
      this.player.currentAction = 'idle';
    }
    // Clear fight action when combat ends
    if (!this.combat.isInCombat && this.player.currentAction === 'fight') {
      this.player.currentAction = 'idle';
    }

    // Broadcast action state to other players when it changes
    if (this.network) {
      const ca = this.player.currentAction;
      const al = this.player.actionLocked;
      if (ca !== this._lastSentAction || al !== this._lastSentActionLocked) {
        this._lastSentAction       = ca;
        this._lastSentActionLocked = al;
        this.network.sendAction(ca, al ? this.player.actionTarget : null);
      }
    }

    this.camera.follow(this.player.cx, this.player.cy, dt);
    this.notifications.update(dt);
    // Server drives all mob AI when networked; local sim only in offline mode.
    if (!this.network && !this.inRaid) {
      this.mobManager.update(dt, this.world, this.player);
    }
    if (this.inDungeon && this.activeDungeon) {
      this.activeDungeon.update(dt, this.player);
    }

    // ── Raid tick ──────────────────────────────────────────────────────────
    if (this.inRaid && this.activeRaid && !this.activeRaid.complete && !this.activeRaid.failed) {
      const raid = this.activeRaid;

      // Award kill XP for newly-dead mobs (once per mob)
      for (const mob of raid.mobContainer.mobs) {
        if (mob.dead && !mob._killCounted) {
          mob._killCounted = true;
          raid.onMobKilled(mob);
        }
      }

      // Floor-clear detection: all mobs dead → start advance delay
      const liveMobCount = raid.mobContainer.mobs.filter(m => !m.dead).length;
      if (!raid._floorAdvancing && raid.mobContainer.mobs.length > 0 && liveMobCount === 0) {
        raid._floorAdvancing    = true;
        raid._floorAdvanceTimer = 1.5;
        this.notifications.add(`Floor ${raid.currentFloorIdx + 1} cleared!`, '#f1c40f');
      }

      raid.update(dt, this.player); // mob AI + timer countdown

      // Floor advance when delay timer expires
      if (raid._floorAdvancing && raid._floorAdvanceTimer <= 0) {
        raid._floorAdvancing = false;
        const done = raid.advanceFloor();
        if (done) {
          this.notifications.add('Raid complete! Check your results.', '#27ae60');
          this.combat.clearTarget();
        } else {
          this.combat.mobManager = raid.mobContainer;
          this.notifications.add(
            `Floor ${raid.currentFloorIdx + 1} / ${raid.totalFloors}`, '#a855f7'
          );
        }
      }
    }
  }

  draw() {
    const ctx = this.renderer.ctx;
    this.renderer.clear();
    this.renderer.setTime(this.elapsed);

    // World-space
    this.camera.begin(ctx);
      this.renderer.drawWorld(this.activeMap, this.camera.x, this.camera.y);
      this.renderer.drawOpenDoors(this.activeMap, this.player.col, this.player.row);

      if (this.clickDest) {
        this.renderer.drawClickTarget(
          this.clickDest.col * TILE_SIZE + TILE_SIZE / 2,
          this.clickDest.row * TILE_SIZE + TILE_SIZE / 2,
          this.elapsed
        );
      }

      if (!this.inInterior) {
        // Ground items (loot)
        this.renderer.drawGroundItems(this.combat.groundItems);

        // Collect visible trees as depth-sortable objects.
        // Each tree sorts by its tile bottom (y + h = tileY + TILE_SIZE) so entities
        // south of the tree draw over the trunk; entities north draw behind the canopy.
        const TREE_OVERHANG = 22; // canopy extends this many px above the tile top
        const camX = this.camera.x, camY = this.camera.y;
        const sc = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
        const sr = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
        const ec = sc + Math.ceil(this.canvas.width  / TILE_SIZE) + 3;
        const er = sr + Math.ceil(this.canvas.height / TILE_SIZE) + 3;
        // Reuse pool of tree-sortable objects to avoid per-frame GC pressure.
        // Each object doubles as the seed (has s1-s4) so no extra seed allocation.
        if (!this._treeSortablesBuf) {
          this._treeSortablesBuf = [];
          this._treeSortablePool = [];
          const _game = this;
          this._treeDraw = function(ctx) {
            _game.renderer.drawTreeSprite(ctx, this.tpx, this.tpy, this, this.tileType, this.biome);
          };
        }
        const treeSortables = this._treeSortablesBuf;
        treeSortables.length = 0;
        let _poolIdx = 0;
        for (let tr = sr; tr <= er; tr++) {
          for (let tc = sc; tc <= ec; tc++) {
            const tileType = this.activeMap.getTile(tc, tr);
            if (!TREE_TILES.has(tileType)) continue;
            let ts = this._treeSortablePool[_poolIdx];
            if (!ts) {
              ts = { y:0, h:0, tpx:0, tpy:0, tileType:0, biome:'', s1:0, s2:0, s3:0, s4:0, draw: this._treeDraw };
              this._treeSortablePool[_poolIdx] = ts;
            }
            const tpx = tc * TILE_SIZE, tpy = tr * TILE_SIZE;
            ts.y        = tpy - TREE_OVERHANG;
            ts.h        = TILE_SIZE + TREE_OVERHANG;
            ts.tpx      = tpx;
            ts.tpy      = tpy;
            ts.tileType = tileType;
            ts.biome    = getBiome(tc, tr);
            ts.s1       = (tc * 7  + tr * 13) % 17;
            ts.s2       = (tc * 11 + tr * 7)  % 19;
            ts.s3       = (tc * 13 + tr * 11) % 23;
            ts.s4       = (tc * 17 + tr * 5)  % 29;
            treeSortables.push(ts);
            _poolIdx++;
          }
        }

        // Draw entities sorted by Y (painter's algorithm) — reuse array to avoid per-frame GC
        if (!this._entityBuf) this._entityBuf = [];
        const eb = this._entityBuf;
        eb.length = 0;
        eb.push(this.player);
        for (const rv of this.remotePlayers.values()) eb.push(rv);
        const _mobSrc = this.inRaid && this.activeRaid
          ? this.activeRaid.mobContainer.mobs
          : this.inDungeon && this.activeDungeon
            ? this.activeDungeon.mobContainer.mobs
            : this.mobManager.mobs;
        for (const m of _mobSrc) eb.push(m);
        if (!this.inRaid && !this.inDungeon) eb.push(this.shopKeeper, this.smithyKeeper, this.makoverNpc, this.dungeonMaster, this.butcherKeeper, this.fishermanNpc, this.weaponKeeper, this.varietyKeeper, this.capeKeeper);
        for (const t of treeSortables) eb.push(t);
        eb.sort((a, b) => (a.y + a.h) - (b.y + b.h));
        for (let ei = 0; ei < eb.length; ei++) eb[ei].draw(ctx);

        // Combat target highlight
        if (this.combat.targetMob && !this.combat.targetMob.dead) {
          this.renderer.drawCombatTarget(this.combat.targetMob);
        }

        // Hit splats (world-space, drawn after all entities)
        this._drawHitSplats(ctx, this.combat.hitSplats);
        this._drawHitSplats(ctx, this.remoteHitSplats);

        // Roof overlays drawn last so they cover entities and hit splats inside buildings
        this.renderer.drawRoofOverlays(this.activeMap, this.camera.x, this.camera.y, this.player.col, this.player.row);
      } else {
        // Interior: draw player + any interior-specific NPCs
        const _intId = this.activeMap.id;
        let _intNpc = null;
        if (_intId === 'player_house') _intNpc = this.houseShopKeeper;

        if (_intNpc) {
          const entities = [this.player, _intNpc];
          entities.sort((a, b) => (a.y + a.h) - (b.y + b.h));
          for (const e of entities) e.draw(ctx);
        } else {
          this.player.draw(ctx);
        }
        // Placement cursor (camera-space)
        if (this.placingFurniture) {
          const mw = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
          this.renderer.drawPlacementCursor(
            Math.floor(mw.x / TILE_SIZE), Math.floor(mw.y / TILE_SIZE),
            this.elapsed, this.placingFurniture.item, this.placingRotation
          );
        }
        if (this.buildModeFurnPlacing) {
          const mw = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
          const fd = FURNITURE_DEFS[this.buildModeFurnPlacing.defId];
          this.renderer.drawBuildModeFurnCursor(
            Math.floor(mw.x / TILE_SIZE), Math.floor(mw.y / TILE_SIZE),
            this.elapsed, fd, this.buildModeFurnPlacing.rotation
          );
        }
      }
    this.camera.end(ctx);

    // Dungeon darkness — radial vignette centred on player gives a torchlight feel
    if (this.inDungeon) {
      const cw = this.canvas.width, ch = this.canvas.height;
      const pcx = this.player.cx - this.camera.x;
      const pcy = this.player.cy - this.camera.y;
      const r0 = Math.min(cw, ch) * 0.18;
      const r1 = Math.min(cw, ch) * 0.72;
      const grad = ctx.createRadialGradient(pcx, pcy, r0, pcx, pcy, r1);
      grad.addColorStop(0,    'rgba(0,0,0,0)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
      grad.addColorStop(1,    'rgba(0,0,0,0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // Fire glow — warm light pools around each campfire, additive over the vignette
      const startCol = Math.floor(this.camera.x / TILE_SIZE) - 2;
      const startRow = Math.floor(this.camera.y / TILE_SIZE) - 2;
      const endCol   = startCol + Math.ceil(cw / TILE_SIZE) + 5;
      const endRow   = startRow + Math.ceil(ch / TILE_SIZE) + 5;
      ctx.globalCompositeOperation = 'lighter';
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (this.activeMap.getTile(col, row) !== TILES.FIRE) continue;
          const scx = col * TILE_SIZE + TILE_SIZE / 2 - this.camera.x;
          const scy = row * TILE_SIZE + TILE_SIZE / 2 - this.camera.y;
          const flicker = 0.88 + Math.sin(this.renderer.time * 2.5 + col * 2.3 + row * 1.7) * 0.12;
          const glowR = TILE_SIZE * 8;
          const glow = ctx.createRadialGradient(scx, scy, 0, scx, scy, glowR);
          glow.addColorStop(0,   `rgba(255,180,60,${(0.32 * flicker).toFixed(3)})`);
          glow.addColorStop(0.35, `rgba(220,100,20,${(0.18 * flicker).toFixed(3)})`);
          glow.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(scx - glowR, scy - glowR, glowR * 2, glowR * 2);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Screen-space UI
    if (!this.inInterior && !this.inRaid && !this.inDungeon) {
      this.renderer.drawCircleMinimap(this.world, this.player);
    }
    this.renderer.drawHUD(this.player, this.fps, this.xpFlashes);
    this.renderer.drawBottomHUD(ctx, this.player);
    const hoverSlot = this.dragSlot !== -1
      ? this._getInventorySlotAt(this.mouseScreen.x, this.mouseScreen.y)
      : -1;
    this.renderer.drawSidePanel(
      this.sidePanelTab,
      this.inventory, this.skills, this.player.equipment,
      this.dragSlot, hoverSlot,
      this.mouseScreen.x, this.mouseScreen.y,
      this.mouseScreen.x, this.mouseScreen.y,
    );
    if (this.smeltingAction) {
      this.renderer.drawSmeltingProgress(this.smeltingAction, this.elapsed);
    }
    if (this.smithingAction) {
      this.renderer.drawSmithingProgress(this.smithingAction, this.elapsed);
    }
    if (this.forgeOpen) {
      this.renderer.drawSmeltPanel(SMELT_RECIPES, this.inventory, this.skills);
    }
    if (this.smithOpen) {
      this.renderer.drawSmithPanel(SMITH_RECIPES, this.smithTab, this.inventory, this.skills, this.smithScrollOffsets[this.smithTab]);
    }
    if (this.chestOpen && this.chestPos) {
      const chestSlots = this._getChestSlots(this.chestPos.col, this.chestPos.row);
      this.renderer.drawChestPanel(chestSlots, this.inventory);
    }
    if (this.playerViewOpen) {
      const SLOTS2 = ['weapon','helmet','chestplate','leggings','gloves','boots','cape'];
      const equipData = SLOTS2.map(slot => {
        const id = this.player.equipment[slot];
        const item = (!id || id === 'none') ? null : EQUIP_ID_TO_ITEM[id];
        const gear = id ? GEAR_BY_ID.get(id) : null;
        return { slot, item, gear };
      });
      this.renderer.drawPlayerViewPanel(
        this.player, equipData, null, this.skills, this.elapsed
      );
    }
    if (this.shopOpen) {
      this.renderer.drawShopPanel(this.shopTab, SHOP_STOCK, this.inventory, 'General Store', this.shopScroll);
    }
    if (this.smithyShopOpen) {
      this.renderer.drawShopPanel(this.smithyShopTab, SMITHY_STOCK, this.inventory, 'Weapon Salesman', this.smithyShopScroll);
    }
    if (this.butcherShopOpen) {
      this.renderer.drawShopPanel(this.butcherShopTab, BUTCHER_STOCK, this.inventory, 'Butcher Shop', this.butcherShopScroll);
    }
    if (this.weaponShopOpen) {
      this.renderer.drawShopPanel(this.weaponShopTab, WEAPON_SHOP_STOCK, this.inventory, 'Weaponsmith', this.weaponShopScroll);
    }
    if (this.varietyShopOpen) {
      this.renderer.drawShopPanel(this.varietyShopTab, VARIETY_STOCK, this.inventory, 'Variety Shop', this.varietyShopScroll);
    }
    if (this.capeShopOpen) {
      this.renderer.drawShopPanel(this.capeShopTab, CAPE_STOCK, this.inventory, 'Cape Merchant', this.capeShopScroll);
    }
    if (this.houseShopOpen) {
      this.renderer.drawHouseShopPanel(HOUSE_SHOP_STOCK, this.inventory);
    }
    if (this.makoverOpen) {
      this.renderer.drawMakeoverPanel(this.player.style);
    }
    if (this.fishermanOpen) {
      this._drawFishermanPanel(ctx);
    }
    if (this.showAdminTp) {
      this._drawAdminTpPanel(ctx);
    }
    if (this.adminEquipOpen) {
      this._drawAdminEquipPanel(ctx);
    }
    if (this.contextMenu) {
      this.renderer.drawContextMenu(this.contextMenu, this.mouseScreen.x, this.mouseScreen.y);
    }
    if (this.raidMenuOpen) this._drawRaidMenu(ctx);
    if (this.inRaid && this.activeRaid && this.activeRaid.complete) this._drawRaidSummary(ctx);
    if (this.inRaid && this.activeRaid && !this.activeRaid.complete && !this.activeRaid.failed) {
      this._drawRaidFloorHUD(ctx);
    }
    if (this.skillsOpen) {
      this.renderer.drawSkillsPanelFull(ctx, this.skills, this.canvas);
    }
    if (this.dialogueOpen && this.dialogueData) {
      this.renderer.drawDialoguePanel(ctx, this.dialogueData, this.canvas);
    }

    // World map overlay (drawn last — covers everything)
    if (this.showWorldMap) {
      this._drawWorldMap(ctx);
      return; // skip tooltip when map is open
    }

    // Tooltip
    let tooltip = null;
    {
      const invTooltip = this._getHoveredInventoryItem(this.mouseScreen.x, this.mouseScreen.y);
      if (invTooltip) tooltip = invTooltip;
    }

    if (!tooltip) {
      const worldPos = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
      if (this.shopKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Shopkeeper — click to trade';
      } else if (this.smithyKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Smith — click to buy weapons & armour';
      } else if (this.makoverNpc.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Makeover Mage — click to customise your character';
      } else if (this.fishermanNpc.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Fishmonger — click to trade & view records';
      } else if (this.butcherKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Butcher — click to buy meats';
      } else if (this.weaponKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Weaponsmith — click to buy weapons & armour';
      } else if (this.varietyKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Variety Shop — click to trade';
      } else if (this.capeKeeper.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Cape Merchant — click to buy capes';
      } else {
        // Check mob hover
        const hoveredMob = this.mobManager.getMobAt(worldPos.x, worldPos.y);
        if (hoveredMob && !hoveredMob.dead) {
          tooltip = `${hoveredMob.name} (HP: ${hoveredMob.hp}/${hoveredMob.maxHp}) — click to attack`;
        } else {
          // Check ground items
          const gi = this.combat.groundItems.find(g => {
            const dx = g.x - worldPos.x;
            const dy = g.y - worldPos.y;
            return dx * dx + dy * dy < 40 * 40;
          });
          if (gi) {
            tooltip = `${gi.item.name}${gi.qty > 1 ? ` x${gi.qty}` : ''} — click to pick up`;
          } else {
            const hoverCol = Math.floor(worldPos.x / TILE_SIZE);
            const hoverRow = Math.floor(worldPos.y / TILE_SIZE);
            const hoverTile = this.activeMap.getTile(hoverCol, hoverRow);
            if (hoverTile === TILES.DUNGEON_ENTRANCE && this.world.dungeonMap) {
              const dungeonId = this.world.dungeonMap.get(`${hoverCol},${hoverRow}`);
              const DUNGEON_LABELS = {
                'dungeon_goblin_cave':   '⚠ Goblin Cave — DANGEROUS (levels 5–25). Walk onto it to descend.',
                'dungeon_spider_den':    '⚠ Spider Den — DANGEROUS (levels 25–45). Walk onto it to descend.',
                'dungeon_ancient_mines': '⚠ Ancient Mines — DANGEROUS (levels 50–80). Walk onto it to descend.',
              };
              tooltip = (dungeonId && DUNGEON_LABELS[dungeonId]) || TILE_TOOLTIPS[TILES.DUNGEON_ENTRANCE];
            } else {
              tooltip = TILE_TOOLTIPS[hoverTile] || null;
            }
          }
        }
      }
    }

    this.renderer.drawTileTooltip(tooltip, this.mouseScreen.x, this.mouseScreen.y);

    // Housing build mode panel
    if (this.buildModeOpen && this.inInterior && this.activeMap.id === 'player_house') {
      const archLevel = this.skills.getLevel(SKILL_IDS.ARCHITECT);
      this.renderer.drawHousingBuildMode(
        this.housingState, this.buildModeStep,
        this.buildModeSelGX, this.buildModeSelGY,
        this.buildModeRoomScroll, this.buildModeFurnScroll,
        this.mouseScreen.x, this.mouseScreen.y,
        archLevel, this.inventory,
        this.canvas.width, this.canvas.height
      );
    }

    // Skill info popup
    if (this.skillInfoSkill !== null) {
      this.renderer.drawSkillInfoPopup(this.skillInfoSkill, this.skills, SKILL_UNLOCKS, this.skillInfoScroll);
    }

    // Logout button (bottom-right, only when logged in)
    if (this._saveToken) this._drawLogoutButton(ctx);

    // Chat box (bottom-left)
    this._drawChat(ctx);

    this.notifications.drawXpDrops(ctx);

    if (this.inInterior || this.inRaid || this.inDungeon) {
      this.renderer.drawInteriorHeader(this.activeMap.name);
    }
    this.renderer.drawFade(this.fadeAlpha);
  }

  /* ── Helpers ─────────────────────────────────────────── */

  _getInventorySlotAt(sx, sy) {
    if (this.sidePanelTab !== 'inventory') return -1;
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 232, TAB_H = 28, CONTENT_H = 378, PH = TAB_H + CONTENT_H + 4;
    const px = W - PW - 4;
    const py = H - PH - 4;
    const contentY = py + TAB_H + 4;
    const startX = px + Math.floor((PW - (INV_COLS * (INV_CELL + INV_PAD) + INV_PAD)) / 2);
    const startY = contentY + 6;
    const relX = sx - (startX + INV_PAD);
    const relY = sy - startY;
    if (relX < 0 || relY < 0) return -1;
    const c = Math.floor(relX / (INV_CELL + INV_PAD));
    const r = Math.floor(relY / (INV_CELL + INV_PAD));
    if (c < 0 || c >= INV_COLS || r < 0 || r >= INV_ROWS) return -1;
    if (relX % (INV_CELL + INV_PAD) >= INV_CELL) return -1;
    if (relY % (INV_CELL + INV_PAD) >= INV_CELL) return -1;
    return r * INV_COLS + c;
  }

  _getHoveredInventoryItem(sx, sy) {
    if (this.dragSlot !== -1) return null;
    if (this.sidePanelTab !== 'inventory') return null;
    const idx = this._getInventorySlotAt(sx, sy);
    if (idx === -1) return null;
    const slot = this.inventory.slots[idx];
    if (!slot) return null;
    return slot.qty > 1 ? `${slot.item.name} (${slot.qty})` : slot.item.name;
  }

  // ── Skills panel (K key) ─────────────────────────────────────────────────

  /**
   * Open the full-screen Skills panel.
   * TODO: Agent 2 — call game.openDialogue({npcName, text, options}) from NPC click handler
   */
  openDialogue(data) {
    this.dialogueData = data;
    this.dialogueOpen = true;
  }

  _handleSkillsPanelClick(sx, sy) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const PW = 420, PH = 520;
    const px = Math.floor((cw - PW) / 2);
    const py = Math.floor((ch - PH) / 2);

    // Close if click is outside the panel rect
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.skillsOpen = false;
      return;
    }

    // Detect which skill row was clicked (for future tooltip)
    const ROW_H = 36;
    const HEADER_H = 56;
    const relY = sy - (py + HEADER_H);
    if (relY >= 0) {
      const rowIdx = Math.floor(relY / ROW_H);
      if (rowIdx >= 0 && rowIdx < 13) {
        // Future: open skill tooltip / info
        console.log('[Skills panel] clicked skill row:', rowIdx, SKILL_NAMES[rowIdx]);
      }
    }
  }

  _handleDialogueClick(sx, sy) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const PW = 600, PH = 160;
    const px = Math.floor((cw - PW) / 2);
    const py = ch - PH - 20;

    // Close if click outside panel
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.dialogueOpen  = false;
      this.dialogueData  = null;
      return;
    }

    if (!this.dialogueData || !this.dialogueData.options) return;

    // Detect which option button was clicked
    const OPTION_H = 22;
    const OPTION_START_Y = py + 54;
    for (let i = 0; i < this.dialogueData.options.length; i++) {
      const oy = OPTION_START_Y + i * OPTION_H;
      if (sy >= oy && sy < oy + OPTION_H && sx >= px + 8 && sx <= px + PW - 8) {
        // TODO: Agent 2 — dispatch dialogue option callback (option index) to NPC interaction handler
        console.log('[Dialogue] option clicked:', i, this.dialogueData.options[i]);
        return;
      }
    }
  }

  _clickOnUI(sx, sy) {
    if (this.contextMenu)    return true;
    if (this.adminEquipOpen) return true;
    if (this.showAdminTp)    return true;
    if (this.playerViewOpen) return true;
    if (this.forgeOpen)      return true;
    if (this.smithOpen)      return true;
    if (this.smithingAction) return true;
    if (this.chestOpen)      return true;
    if (this.shopOpen)       return true;
    if (this.smithyShopOpen) return true;
    if (this.houseShopOpen)  return true;
    if (this.makoverOpen)    return true;
    if (this.fishermanOpen)  return true;
    if (this.skillsOpen)     return true;
    if (this.dialogueOpen)   return true;
    // Side panel (always present)
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 232, PH = 28 + 378 + 4;
    const px = W - PW - 4, py = H - PH - 4;
    if (sx >= px && sx <= px + PW && sy >= py && sy <= py + PH) return true;
    // Logout button
    if (this._saveToken) {
      const lb = this._logoutButtonRect();
      if (sx >= lb.x && sx <= lb.x + lb.w && sy >= lb.y && sy <= lb.y + lb.h) return true;
    }
    return false;
  }

  _clickOnSidePanel(sx, sy) {
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 232, TAB_H = 28, CONTENT_H = 378, PH = TAB_H + CONTENT_H + 4;
    const px = W - PW - 4, py = H - PH - 4;
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) return false;

    // Tab bar click
    if (sy < py + TAB_H) {
      const tabW = Math.floor(PW / 3);
      const tabIdx = Math.floor((sx - px) / tabW);
      const tabs = ['inventory', 'skills', 'equip'];
      if (tabIdx >= 0 && tabIdx < tabs.length) {
        this.sidePanelTab = tabs[tabIdx];
      }
      return true;
    }

    // Skills tab: click a cell to open skill info popup
    if (this.sidePanelTab === 'skills') {
      const contentY = py + TAB_H + 2;
      const COLS = 4, ROWS = 5, HEADER_H = 20;
      const cellW = Math.floor(PW / COLS);
      const cellH = Math.floor((CONTENT_H - HEADER_H) / ROWS);
      const relX = sx - px, relY = sy - (contentY + HEADER_H);
      if (relX >= 0 && relY >= 0) {
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const idx = row * COLS + col;
        if (col < COLS && row < ROWS && idx < SKILL_NAMES.length) {
          if (this.skillInfoSkill === idx) {
            this.skillInfoSkill = null;
          } else {
            this.skillInfoSkill  = idx;
            this.skillInfoScroll = 0;
          }
          return true;
        }
      }
    }

    // Inventory tab: left-click food to eat
    if (this.sidePanelTab === 'inventory') {
      const idx = this._getInventorySlotAt(sx, sy);
      if (idx !== -1) {
        const slot = this.inventory.slots[idx];
        if (slot && slot.item.heal) {
          this._eatItem(idx);
          return true;
        }
      }
    }

    // Equip tab: unequip on click OR open character view
    if (this.sidePanelTab === 'equip') {
      const SLOTS = ['helmet','chestplate','leggings','gloves','boots','cape','weapon'];
      const contentY = py + TAB_H + 4;
      const ROW_H = Math.floor((CONTENT_H - 36) / SLOTS.length);
      for (let i = 0; i < SLOTS.length; i++) {
        const ry = contentY + i * ROW_H;
        if (sy >= ry && sy < ry + ROW_H) {
          this._unequipSlot(SLOTS[i]);
          return true;
        }
      }
      // View Character button
      const vbY = contentY + SLOTS.length * ROW_H + 6;
      if (sy >= vbY && sy < vbY + 26 && sx >= px + 8 && sx < px + PW - 8) {
        this.playerViewOpen = true;
        return true;
      }
    }

    return true; // consumed click even if no specific action
  }

  _handleHouseShopClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - HOUSE_SHOP_PW) / 2);
    const py = Math.floor((this.canvas.height - HOUSE_SHOP_PH) / 2);
    if (sx < px || sx > px + HOUSE_SHOP_PW || sy < py || sy > py + HOUSE_SHOP_PH) {
      this.houseShopOpen = false;
      return;
    }
    const contentY = py + HOUSE_SHOP_HEADER_H;
    const row = Math.floor((sy - contentY) / HOUSE_SHOP_ROW_H);
    const btnX = px + HOUSE_SHOP_PW - 64;
    if (sx < btnX || row < 0 || row >= HOUSE_SHOP_STOCK.length) return;
    this._buyItem(HOUSE_SHOP_STOCK[row]);
  }

  /* ── Forge helpers ───────────────────────────────────── */

  _tryForgeRecipe(recipe) {
    const forgeLevel = this.skills.getLevel(SKILL_IDS.FORGERY);
    if (forgeLevel < recipe.level) {
      this.notifications.add(`Need Forgery level ${recipe.level} to make ${recipe.name}.`, '#e74c3c');
      return;
    }
    for (const { item, qty } of recipe.inputs) {
      if (this.inventory.count(item().id) < qty) {
        const needed = qty > 1 ? `${qty}x ` : '';
        this.notifications.add(`Need ${needed}${item().name}.`, '#e74c3c');
        return;
      }
    }
    if (this.inventory.isFull() && !this.inventory.has(recipe.output().id)) {
      this.notifications.add('Inventory full!', '#e74c3c');
      return;
    }
    for (const { item, qty } of recipe.inputs) {
      this.inventory.remove(item().id, qty);
    }
    this.inventory.add(recipe.output(), 1);
    this.skills.addXp(SKILL_IDS.FORGERY, recipe.xp);
    this.notifications.add(`Made ${recipe.name}! (+${recipe.xp} Forgery XP)`, '#b7410e');
  }

  _handlePlayerViewClick(sx, sy) {
    const PW = 660, PH = 530;
    const px = Math.floor((this.canvas.width  - PW) / 2);
    const py = Math.floor((this.canvas.height - PH) / 2);
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.playerViewOpen = false;
    }
  }

  _handleSmeltClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - FORGE_PW) / 2);
    const py = Math.floor((this.canvas.height - SMELT_PH) / 2);
    if (sx < px || sx > px + FORGE_PW || sy < py || sy > py + SMELT_PH) {
      this.forgeOpen = false;
      return;
    }
    const contentY = py + FORGE_HEADER_H;
    if (sy < contentY) return;
    const row = Math.floor((sy - contentY) / FORGE_ROW_H);
    if (row < 0 || row >= SMELT_RECIPE_COUNT) return;

    // Detect which quantity button was clicked (1x / 5x / 15x)
    const BTN_W = 38, BTN_GAP = 3;
    const SMELT_QTYS = [
      { qty: 1,  levelReq: 1  },
      { qty: 5,  levelReq: 10 },
      { qty: 15, levelReq: 25 },
    ];
    const btnY = contentY + row * FORGE_ROW_H + Math.floor((FORGE_ROW_H - 24) / 2);
    let clickedQty = null;
    for (let i = 0; i < SMELT_QTYS.length; i++) {
      const bx = px + FORGE_PW - 8 - (SMELT_QTYS.length - i) * BTN_W - (SMELT_QTYS.length - i - 1) * BTN_GAP;
      if (sx >= bx && sx <= bx + BTN_W && sy >= btnY && sy <= btnY + 24) {
        clickedQty = SMELT_QTYS[i];
        break;
      }
    }
    if (!clickedQty) return;

    const recipe = SMELT_RECIPES[row];
    const forgeLevel = this.skills.getLevel(SKILL_IDS.FORGERY);
    if (forgeLevel < recipe.level) {
      this.notifications.add(`Need Forgery level ${recipe.level} to smelt ${recipe.name}.`, '#e74c3c');
      return;
    }
    if (forgeLevel < clickedQty.levelReq) {
      this.notifications.add(`Need Forgery level ${clickedQty.levelReq} to smelt ${clickedQty.qty}x at once.`, '#e74c3c');
      return;
    }
    for (const { item, qty } of recipe.inputs) {
      if (this.inventory.count(item().id) < qty) {
        const needed = qty > 1 ? `${qty}x ` : '';
        this.notifications.add(`Need ${needed}${item().name}.`, '#e74c3c');
        return;
      }
    }
    if (this.inventory.isFull() && !this.inventory.has(recipe.output().id)) {
      this.notifications.add('Inventory full!', '#e74c3c');
      return;
    }
    // Consume ingredients for first bar, then start action
    for (const { item, qty } of recipe.inputs) {
      this.inventory.remove(item().id, qty);
    }
    this.forgeOpen = false;
    const baseDuration = 2.5 + recipe.level / 20;
    this.smeltingAction = { recipe, progress: 0, duration: baseDuration, baseDuration, remaining: clickedQty.qty, total: clickedQty.qty };
  }

  _handleSmithClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - FORGE_PW) / 2);
    const py = Math.floor((this.canvas.height - SMITH_PH) / 2);
    if (sx < px || sx > px + FORGE_PW || sy < py || sy > py + SMITH_PH) {
      this.smithOpen = false;
      return;
    }
    // Tab bar
    const tabY = py + FORGE_HEADER_H;
    if (sy >= tabY && sy <= tabY + FORGE_TAB_H) {
      const tabW = Math.floor(FORGE_PW / 3);
      let newTab = this.smithTab;
      if      (sx < px + tabW)     newTab = 'weapons';
      else if (sx < px + tabW * 2) newTab = 'tools';
      else                         newTab = 'armor';
      this.smithTab = newTab;
      return;
    }
    const contentY = tabY + FORGE_TAB_H;
    if (sy < contentY || sy > contentY + SMITH_CONTENT_H) return;
    const scroll = this.smithScrollOffsets[this.smithTab] || 0;
    const row = Math.floor((sy - contentY + scroll) / FORGE_ROW_H);
    const recipes = SMITH_RECIPES[this.smithTab];
    if (row < 0 || row >= recipes.length) return;
    const btnX = px + FORGE_PW - 70;
    if (sx < btnX) return;
    const recipe = recipes[row];
    const forgeLevel = this.skills.getLevel(SKILL_IDS.FORGERY);
    if (forgeLevel < recipe.level) {
      this.notifications.add(`Need Forgery level ${recipe.level} to forge ${recipe.name}.`, '#e74c3c');
      return;
    }
    for (const { item, qty } of recipe.inputs) {
      if (this.inventory.count(item().id) < qty) {
        const needed = qty > 1 ? `${qty}x ` : '';
        this.notifications.add(`Need ${needed}${item().name}.`, '#e74c3c');
        return;
      }
    }
    if (this.inventory.isFull() && !this.inventory.has(recipe.output().id)) {
      this.notifications.add('Inventory full!', '#e74c3c');
      return;
    }
    for (const { item, qty } of recipe.inputs) {
      this.inventory.remove(item().id, qty);
    }
    this.smithOpen = false;
    const duration = 2.0 + recipe.level / 25;
    this.smithingAction = { recipe, progress: 0, duration };
  }

  // ── Chest storage ────────────────────────────────────────────────────────

  _getChestSlots(col, row) {
    const key = `${col},${row}`;
    if (!this.chestStorage.has(key)) {
      // Large chest at interior (19,8) holds 4× normal capacity when unlocked
      const isLargeChest = this.inInterior && col === 19 && row === 8
        && this.housingState.hasLargeChest;
      const capacity = isLargeChest ? LARGE_CHEST_CAPACITY : 28;
      this.chestStorage.set(key, new Array(capacity).fill(null));
    }
    return this.chestStorage.get(key);
  }

  _handleChestClick(sx, sy) {
    const W = this.canvas.width, H = this.canvas.height;
    const CHEST_PW = 390, CHEST_PH = 356, CHEST_HEADER = 58;
    const CELL = 36, PAD = 4, COLS = 4, ROWS = 7;
    const GRID_W = COLS * CELL + (COLS - 1) * PAD; // 156

    const px = Math.floor((W - CHEST_PW) / 2);
    const py = Math.floor((H - CHEST_PH) / 2);

    // Close if outside panel
    if (sx < px || sx > px + CHEST_PW || sy < py || sy > py + CHEST_PH) {
      this.chestOpen = false;
      this.chestPos  = null;
      return;
    }

    const chestSlots = this._getChestSlots(this.chestPos.col, this.chestPos.row);
    const leftX  = px + 14;
    const rightX = px + CHEST_PW - 14 - GRID_W;
    const gridY  = py + CHEST_HEADER;

    // Check left grid (player inventory)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const cx = leftX  + c * (CELL + PAD);
        const cy = gridY  + r * (CELL + PAD);
        if (sx >= cx && sx < cx + CELL && sy >= cy && sy < cy + CELL) {
          const slot = this.inventory.slots[idx];
          if (!slot) return;
          // Try to stack if stackable
          if (slot.item.stackable) {
            const si = chestSlots.findIndex(s => s && s.item.id === slot.item.id);
            if (si !== -1) {
              chestSlots[si].qty += slot.qty;
              this.inventory.slots[idx] = null;
              this._saveToServer();
              return;
            }
          }
          const emptyIdx = chestSlots.findIndex(s => s === null);
          if (emptyIdx !== -1) {
            chestSlots[emptyIdx] = { item: slot.item, qty: slot.qty };
            this.inventory.slots[idx] = null;
            this._saveToServer();
          } else {
            this.notifications.add('Chest is full.', '#e74c3c');
          }
          return;
        }
      }
    }

    // Check right grid (chest)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        const cx = rightX + c * (CELL + PAD);
        const cy = gridY  + r * (CELL + PAD);
        if (sx >= cx && sx < cx + CELL && sy >= cy && sy < cy + CELL) {
          const slot = chestSlots[idx];
          if (!slot) return;
          const added = this.inventory.add(slot.item, slot.qty);
          if (added) {
            chestSlots[idx] = null;
            this._saveToServer();
          } else {
            this.notifications.add('Your inventory is full.', '#e74c3c');
          }
          return;
        }
      }
    }
  }

  _placeFurniture(col, row) {
    const tile = this.activeMap.getTile(col, row);
    const canPlace = tile === TILES.GRASS || tile === TILES.PLANK;
    if (!canPlace) {
      this.notifications.add('Cannot place furniture there.', '#e74c3c');
      this.placingFurniture = null;
      return;
    }
    if (col === this.player.col && row === this.player.row) {
      this.notifications.add('Cannot place furniture on yourself.', '#e74c3c');
      return;
    }
    const { item, slotIndex } = this.placingFurniture;
    this.activeMap.setTile(col, row, item.furnitureTileId, this.placingRotation);
    this.inventory.remove(slotIndex, 1);
    this.placingFurniture = null;
    this.notifications.add(`Placed ${item.name}.`, '#f1c40f');
  }

  // ── Farming ──────────────────────────────────────────────────────────────

  _handleFarmPatchInteract(col, row) {
    for (const [key, cell] of this.housingState.cells) {
      if (cell.typeId !== 'farming_plot') continue;
      const [gx, gy] = key.split(',').map(Number);
      const io = cellInnerOrigin(gx, gy);
      for (let i = 0; i < PATCH_LOCAL_POSITIONS.length; i++) {
        const { localCol, localRow } = PATCH_LOCAL_POSITIONS[i];
        if (io.col + localCol === col && io.row + localRow === row) {
          this._doFarmAction(gx, gy, i);
          return;
        }
      }
    }
  }

  _doFarmAction(gx, gy, patchIndex) {
    const patch = this.farmingState.getPatch(gx, gy, patchIndex);
    const stage = this.farmingState.getPatchStage(patch);
    const farmLevel = this.skills.getLevel(SKILL_IDS.FARMING);

    if (stage === 0) {
      const seedId = this._findFarmableSeed(farmLevel);
      if (!seedId) {
        this.notifications.add('You have no seeds to plant here.', '#e74c3c');
        return;
      }
      this.inventory.remove(seedId, 1);
      this.farmingState.plantSeed(gx, gy, patchIndex, seedId);
      this._updateFarmPatchTile(gx, gy, patchIndex);
      const prevLvl = this.skills.getLevel(SKILL_IDS.FARMING);
      this.skills.addXp(SKILL_IDS.FARMING, 5);
      const newLvl = this.skills.getLevel(SKILL_IDS.FARMING);
      this.notifications.add(`You plant a ${SEED_DEFS[seedId].name}. (+5 Farming XP)`, '#27ae60');
      if (newLvl > prevLvl) this.notifications.add(`Farming level ${newLvl}!`, '#f1c40f');
      this._saveToServer();
    } else if (stage === 1 || stage === 2) {
      const def = SEED_DEFS[patch.seedId];
      const remaining = Math.max(1, Math.ceil((def.growTime - (Date.now() - patch.plantedAt)) / 60000));
      this.notifications.add(`Still growing... (~${remaining} min${remaining !== 1 ? 's' : ''} left)`, '#e67e22');
    } else {
      // stage 3 — harvest
      if (this.inventory.isFull()) {
        this.notifications.add('Your inventory is full!', '#e74c3c');
        return;
      }
      const def = SEED_DEFS[patch.seedId];
      const qty = def.harvestMin + Math.floor(Math.random() * (def.harvestMax - def.harvestMin + 1));
      const harvestItem = ITEM_BY_ID.get(def.harvestId);
      if (!harvestItem) return;
      this.farmingState.harvestPatch(gx, gy, patchIndex);
      for (let i = 0; i < qty; i++) {
        if (!this.inventory.isFull()) this.inventory.add(harvestItem);
      }
      this._updateFarmPatchTile(gx, gy, patchIndex);
      const prevLvl = this.skills.getLevel(SKILL_IDS.FARMING);
      this.skills.addXp(SKILL_IDS.FARMING, def.xp);
      const newLvl = this.skills.getLevel(SKILL_IDS.FARMING);
      this.notifications.add(`You harvest ${qty}x ${harvestItem.name}! (+${def.xp} Farming XP)`, '#27ae60');
      if (newLvl > prevLvl) this.notifications.add(`Farming level ${newLvl}!`, '#f1c40f');
      this._saveToServer();
    }
  }

  _findFarmableSeed(farmLevel) {
    // Prefer the highest-level seed the player can use
    const usable = Object.values(SEED_DEFS)
      .filter(d => d.levelReq <= farmLevel && this.inventory.has(d.id))
      .sort((a, b) => b.levelReq - a.levelReq);
    return usable[0]?.id ?? null;
  }

  _updateFarmPatchTile(gx, gy, patchIndex) {
    if (!this.inInterior || this.activeMap.id !== 'player_house') return;
    const io = cellInnerOrigin(gx, gy);
    const { localCol, localRow } = PATCH_LOCAL_POSITIONS[patchIndex];
    const patch = this.farmingState.getPatch(gx, gy, patchIndex);
    const stage = this.farmingState.getPatchStage(patch);
    this.activeMap.setTile(io.col + localCol, io.row + localRow, GROW_STAGES[stage].tile);
  }

  _updateFarmingPatches() {
    if (!this.inInterior || this.activeMap.id !== 'player_house') return;
    let readyNotified = false;
    for (const [key, patches] of this.farmingState.patches) {
      if (!patches) continue;
      const [gx, gy] = key.split(',').map(Number);
      if (!this.housingState.hasCell(gx, gy)) continue;
      const cell = this.housingState.getCell(gx, gy);
      if (cell.typeId !== 'farming_plot') continue;
      const io = cellInnerOrigin(gx, gy);
      for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        if (!patch) continue;
        const { localCol, localRow } = PATCH_LOCAL_POSITIONS[i];
        const col = io.col + localCol;
        const row = io.row + localRow;
        const stage = this.farmingState.getPatchStage(patch);
        const expectedTile = GROW_STAGES[stage].tile;
        if (this.activeMap.getTile(col, row) !== expectedTile) {
          this.activeMap.setTile(col, row, expectedTile);
          if (stage === 3 && !readyNotified) {
            readyNotified = true;
            this.notifications.add('A crop in your farming plot is ready to harvest!', '#27ae60');
          }
        }
      }
    }
  }

  // ── Housing furniture removal ────────────────────────────────────────────

  _buildHouseFurnitureContextMenu(sx, sy, col, row) {
    for (const key of this.housingState.cells.keys()) {
      const [gx, gy] = key.split(',').map(Number);
      const io = cellInnerOrigin(gx, gy);
      const localCol = col - io.col;
      const localRow = row - io.row;
      if (localCol < 0 || localRow < 0 || localCol >= CELL_INNER || localRow >= CELL_INNER) continue;
      const found = this.housingState.furnitureAt(gx, gy, localCol, localRow);
      if (!found) continue;
      const fd = FURNITURE_DEFS[found.entry.defId];
      if (!fd) continue;
      return {
        x: sx, y: sy,
        options: [{
          label: `Remove ${fd.name}`,
          cb: () => {
            this.housingState.removeFurniture(gx, gy, found.index);
            this._rebuildPlayerHouse();
            this._saveToServer();
            this.contextMenu = null;
          },
        }],
      };
    }
    return null;
  }

  // ── Admin helper ────────────────────────────────────────────────────────

  get isAdmin() { return this.player.name === '12345'; }

  // ── Housing Build Mode ──────────────────────────────────────────────────

  _rebuildPlayerHouse() {
    const house = buildPlayerHouse(this.housingState, this.farmingState);
    this.interiors.set('player_house', house);
    if (this.inInterior && this.activeMap.id === 'player_house') {
      this.activeMap     = house;
      this.player.world  = house;
      this.actions.world = house;
      // If player ended up in a solid tile (e.g. room was removed), move to entry
      if (house.isSolid(this.player.col, this.player.row)) {
        this.player.col = house.entryCol;
        this.player.row = house.entryRow;
        this.player.x   = this.player.col * TILE_SIZE + 4;
        this.player.y   = this.player.row * TILE_SIZE;
      }
    }
  }

  _handleBuildModeClick(sx, sy) {
    const cw = this.canvas.width, ch = this.canvas.height;
    const px = Math.floor((cw - BM_PW) / 2);
    const py = Math.floor((ch - BM_PH) / 2);

    // Close if click is outside the panel
    if (sx < px || sx > px + BM_PW || sy < py || sy > py + BM_PH) {
      this.buildModeOpen = false;
      return;
    }

    // Close button (top-right X)
    if (sx >= px + BM_PW - 34 && sx <= px + BM_PW - 6 && sy >= py + 6 && sy <= py + 34) {
      this.buildModeOpen = false;
      return;
    }

    const archLevel = this.skills.getLevel(SKILL_IDS.ARCHITECT);

    // Grid click — left panel
    const gridLeft = px + BM_GRID_OFF;
    const gridTop  = py + BM_GRID_TOP;
    if (sx >= gridLeft && sy >= gridTop &&
        sx < gridLeft + GRID_COLS * BM_GRID_CELL &&
        sy < gridTop  + GRID_ROWS * BM_GRID_CELL) {
      const gx = Math.floor((sx - gridLeft) / BM_GRID_CELL);
      const gy = Math.floor((sy - gridTop)  / BM_GRID_CELL);
      if (this.housingState.hasCell(gx, gy)) {
        this.buildModeSelGX = gx;
        this.buildModeSelGY = gy;
        this.buildModeStep  = 'pick_furniture';
        this.buildModeFurnScroll = 0;
      } else if (this.housingState.getAvailableSlots().has(`${gx},${gy}`)) {
        this.buildModeSelGX = gx;
        this.buildModeSelGY = gy;
        this.buildModeStep  = 'pick_room';
        this.buildModeRoomScroll = 0;
      }
      return;
    }

    // Right panel clicks
    const rox = px + BM_SPLIT_X + 10;
    const ROW_H = 52, ROW_PAD = 8;
    const listTop = py + BM_HEADER_H + 48;

    if (this.buildModeStep === 'pick_room') {
      const defs = getUnlockedRoomDefs(99).filter(d => d.id !== 'starter');
      const visible = defs.slice(this.buildModeRoomScroll, this.buildModeRoomScroll + 5);
      for (let i = 0; i < visible.length; i++) {
        const rowY = listTop + i * ROW_H;
        if (sy < rowY || sy > rowY + ROW_H - ROW_PAD) continue;
        const def = visible[i];
        const check = this.housingState.canAddCell(
          this.buildModeSelGX, this.buildModeSelGY, def.id, this.inventory, this.skills, this.isAdmin);
        if (!check.ok) {
          this.notifications.add(check.reason, '#e74c3c');
          return;
        }
        this.housingState.addCell(this.buildModeSelGX, this.buildModeSelGY, def.id, this.inventory, this.isAdmin);
        this.skills.addXp(SKILL_IDS.ARCHITECT, 50 + def.levelReq * 5);
        this.notifications.add(`Built ${def.name}! (+Architect XP)`, '#f1c40f');
        this._rebuildPlayerHouse();
        this.buildModeStep = 'grid';
        this.buildModeSelGX = null;
        this.buildModeSelGY = null;
        this._saveToServer();
        return;
      }
      // Scroll arrows
      const arrowY = listTop + 5 * ROW_H + 4;
      if (sy >= arrowY && sy <= arrowY + 24) {
        const mid = rox + (BM_PW - BM_SPLIT_X - 20) / 2;
        if (sx < mid && this.buildModeRoomScroll > 0) this.buildModeRoomScroll--;
        else if (sx >= mid && this.buildModeRoomScroll + 5 < defs.length) this.buildModeRoomScroll++;
      }
    } else if (this.buildModeStep === 'pick_furniture') {
      const cell = this.housingState.getCell(this.buildModeSelGX, this.buildModeSelGY);
      if (!cell) return;
      const roomDef = ROOM_DEFS[cell.typeId];
      const defs = getUnlockedFurnitureDefs(this.isAdmin ? 99 : archLevel).filter(fd =>
        fd.category === roomDef.category || fd.category === 'both');
      const visible = defs.slice(this.buildModeFurnScroll, this.buildModeFurnScroll + 5);
      for (let i = 0; i < visible.length; i++) {
        const rowY = listTop + i * ROW_H;
        if (sy < rowY || sy > rowY + ROW_H - ROW_PAD) continue;
        const def = visible[i];
        // Start furniture placement
        this.buildModeFurnPlacing = { gx: this.buildModeSelGX, gy: this.buildModeSelGY, defId: def.id, rotation: 0 };
        this.buildModeOpen = false;
        this.notifications.add(`Click inside the room to place ${def.name}. [R] = rotate, [Esc] = cancel`, '#f1c40f');
        return;
      }
      // Scroll arrows
      const arrowY = listTop + 5 * ROW_H + 4;
      if (sy >= arrowY && sy <= arrowY + 24) {
        const mid = rox + (BM_PW - BM_SPLIT_X - 20) / 2;
        if (sx < mid && this.buildModeFurnScroll > 0) this.buildModeFurnScroll--;
        else if (sx >= mid && this.buildModeFurnScroll + 5 < defs.length) this.buildModeFurnScroll++;
      }
    }
  }

  _placeBuildModeFurniture(col, row) {
    const { gx, gy, defId, rotation } = this.buildModeFurnPlacing;
    const io = cellInnerOrigin(gx, gy);
    const localCol = col - io.col;
    const localRow = row - io.row;

    const check = this.housingState.canPlaceFurniture(
      gx, gy, defId, localCol, localRow, rotation, this.inventory, this.skills, this.isAdmin);
    if (!check.ok) {
      this.notifications.add(check.reason, '#e74c3c');
      return;
    }
    this.housingState.placeFurniture(gx, gy, defId, localCol, localRow, rotation, this.inventory, this.isAdmin);
    const fd = FURNITURE_DEFS[defId];
    this.skills.addXp(SKILL_IDS.ARCHITECT, 10 + fd.levelReq * 2);
    this.notifications.add(`Placed ${fd.name}! (+Architect XP)`, '#f1c40f');
    this.buildModeFurnPlacing = null;
    this.buildModeOpen = true;
    this._rebuildPlayerHouse();
    this._saveToServer();
  }

  _handleShopClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - SHOP_PW) / 2);
    const py = Math.floor((this.canvas.height - SHOP_PH) / 2);
    if (sx < px || sx > px + SHOP_PW || sy < py || sy > py + SHOP_PH) {
      this.shopOpen = false; this.shopScroll = 0;
      return;
    }
    const tabY = py + SHOP_HEADER_H;
    const tabW = Math.floor(SHOP_PW / 2) - 8;
    if (sy >= tabY && sy <= tabY + SHOP_TAB_H) {
      if (sx >= px + 4 && sx <= px + 4 + tabW) { this.shopTab = 'buy';  this.shopScroll = 0; }
      else if (sx >= px + SHOP_PW / 2 + 4)     { this.shopTab = 'sell'; this.shopScroll = 0; }
      return;
    }
    const contentY = tabY + SHOP_TAB_H;
    if (sy < contentY) return;
    const row = Math.floor((sy - contentY + this.shopScroll) / SHOP_ROW_H);
    const btnX = px + SHOP_PW - 64;
    if (sx < btnX) return;
    if (this.shopTab === 'buy') {
      if (row < SHOP_STOCK.length) this._buyItem(SHOP_STOCK[row]);
    } else {
      const sellable = this._getSellableSlots();
      if (row < sellable.length) this._sellItem(sellable[row]);
    }
  }

  _handleSmithyShopClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - SHOP_PW) / 2);
    const py = Math.floor((this.canvas.height - SHOP_PH) / 2);
    if (sx < px || sx > px + SHOP_PW || sy < py || sy > py + SHOP_PH) {
      this.smithyShopOpen = false; this.smithyShopScroll = 0;
      return;
    }
    const tabY = py + SHOP_HEADER_H;
    const tabW = Math.floor(SHOP_PW / 2) - 8;
    if (sy >= tabY && sy <= tabY + SHOP_TAB_H) {
      if (sx >= px + 4 && sx <= px + 4 + tabW) { this.smithyShopTab = 'buy';  this.smithyShopScroll = 0; }
      else if (sx >= px + SHOP_PW / 2 + 4)     { this.smithyShopTab = 'sell'; this.smithyShopScroll = 0; }
      return;
    }
    const contentY = tabY + SHOP_TAB_H;
    if (sy < contentY) return;
    const row = Math.floor((sy - contentY + this.smithyShopScroll) / SHOP_ROW_H);
    const btnX = px + SHOP_PW - 64;
    if (sx < btnX) return;
    if (this.smithyShopTab === 'buy') {
      if (row < SMITHY_STOCK.length) this._buyItem(SMITHY_STOCK[row]);
    } else {
      const sellable = this._getSellableSlots();
      if (row < sellable.length) this._sellItem(sellable[row]);
    }
  }

  _handleKingdomShopClick(sx, sy, shopType) {
    const SHOP_CFG = {
      butcher:  { openFlag: 'butcherShopOpen',  tabFlag: 'butcherShopTab',  scrollFlag: 'butcherShopScroll',  stock: BUTCHER_STOCK,     prices: BUTCHER_SELL_PRICES  },
      weapon:   { openFlag: 'weaponShopOpen',   tabFlag: 'weaponShopTab',   scrollFlag: 'weaponShopScroll',   stock: WEAPON_SHOP_STOCK, prices: WEAPON_SELL_PRICES   },
      variety:  { openFlag: 'varietyShopOpen',  tabFlag: 'varietyShopTab',  scrollFlag: 'varietyShopScroll',  stock: VARIETY_STOCK,     prices: VARIETY_SELL_PRICES  },
      cape:     { openFlag: 'capeShopOpen',     tabFlag: 'capeShopTab',     scrollFlag: 'capeShopScroll',     stock: CAPE_STOCK,        prices: CAPE_SELL_PRICES     },
    };
    const cfg = SHOP_CFG[shopType];
    if (!cfg) return;
    const px = Math.floor((this.canvas.width  - SHOP_PW) / 2);
    const py = Math.floor((this.canvas.height - SHOP_PH) / 2);
    if (sx < px || sx > px + SHOP_PW || sy < py || sy > py + SHOP_PH) {
      this[cfg.openFlag] = false; this[cfg.scrollFlag] = 0;
      return;
    }
    const tabY = py + SHOP_HEADER_H;
    const tabW = Math.floor(SHOP_PW / 2) - 8;
    if (sy >= tabY && sy <= tabY + SHOP_TAB_H) {
      if (sx >= px + 4 && sx <= px + 4 + tabW) { this[cfg.tabFlag] = 'buy';  this[cfg.scrollFlag] = 0; }
      else if (sx >= px + SHOP_PW / 2 + 4)     { this[cfg.tabFlag] = 'sell'; this[cfg.scrollFlag] = 0; }
      return;
    }
    const contentY = tabY + SHOP_TAB_H;
    if (sy < contentY) return;
    const row  = Math.floor((sy - contentY + (this[cfg.scrollFlag] || 0)) / SHOP_ROW_H);
    const btnX = px + SHOP_PW - 64;
    if (sx < btnX) return;
    if (this[cfg.tabFlag] === 'buy') {
      if (row < cfg.stock.length) this._buyItem(cfg.stock[row]);
    } else {
      const sellable = this.inventory.slots.filter(s => s && cfg.prices[s.item.id] !== undefined);
      if (row < sellable.length) {
        const slot  = sellable[row];
        const price = cfg.prices[slot.item.id];
        const qty   = slot.item.stackable ? slot.qty : 1;
        this.inventory.remove(slot.item.id, qty);
        this.inventory.add(ITEMS.GOLD_COIN, price * qty);
        const suffix = qty > 1 ? ` x${qty}` : '';
        this.notifications.add(`Sold ${slot.item.name}${suffix} for ${price * qty}g`, '#f1c40f');
      }
    }
  }

  _handleMakeoverClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - MO_PW) / 2);
    const py = Math.floor((this.canvas.height - MO_PH) / 2);
    if (sx < px || sx > px + MO_PW || sy < py || sy > py + MO_PH) {
      this.makoverOpen = false;
      return;
    }
    const doneBtnW = 110;
    const doneBtnX = Math.floor(px + (MO_PW - doneBtnW) / 2);
    const doneBtnY = py + MO_PH - MO_PAD_BOT + 11;
    if (sx >= doneBtnX && sx <= doneBtnX + doneBtnW && sy >= doneBtnY && sy <= doneBtnY + 30) {
      this.makoverOpen = false;
      if (this.network) this.network.sendEquip(this.player.equipment, this.player.style, this.player.name, this.player.combatLevel);
      this._saveToServer();
      return;
    }
    const contentY = py + MO_HEADER_H + MO_PREVIEW_H;
    for (let sr = 0; sr < MO_STYLE_ROWS.length; sr++) {
      const { key, options } = MO_STYLE_ROWS[sr];
      const rowY = contentY + sr * MO_STYLE_ROW_H;
      const btnY = rowY + (MO_STYLE_ROW_H - MO_BTN_H) / 2;
      if (sy < btnY || sy > btnY + MO_BTN_H) continue;
      for (let i = 0; i < options.length; i++) {
        const bx = px + MO_PAD + MO_LABEL_W + i * (MO_BTN_W + MO_BTN_GAP);
        if (sx >= bx && sx <= bx + MO_BTN_W) {
          this.player.style[key] = options[i].id;
          return;
        }
      }
    }
    const swatchStartY = contentY + MO_STYLE_ROWS.length * MO_STYLE_ROW_H;
    for (let row = 0; row < MO_PALETTES.length; row++) {
      const { key, colors } = MO_PALETTES[row];
      const rowY      = swatchStartY + row * MO_ROW_H;
      const swatchTop = rowY + Math.floor((MO_ROW_H - MO_SWATCH) / 2);
      if (sy < swatchTop || sy > swatchTop + MO_SWATCH) continue;
      for (let i = 0; i < colors.length; i++) {
        const swx = px + MO_PAD + MO_LABEL_W + i * (MO_SWATCH + MO_SWATCH_GAP);
        if (sx >= swx && sx <= swx + MO_SWATCH) {
          this.player.style[key] = colors[i];
          return;
        }
      }
    }
  }

  _handleFishermanClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - FISH_PW) / 2);
    const py = Math.floor((this.canvas.height - FISH_PH) / 2);
    if (sx < px || sx > px + FISH_PW || sy < py || sy > py + FISH_PH) {
      this.fishermanOpen = false;
      return;
    }
    // Tab row
    const tabY = py + FISH_HEADER_H;
    if (sy >= tabY && sy <= tabY + FISH_TAB_H) {
      const tabW = Math.floor((FISH_PW - 8) / FISH_TAB_KEYS.length);
      const idx  = Math.floor((sx - px - 4) / tabW);
      if (idx >= 0 && idx < FISH_TAB_KEYS.length) {
        this.fishermanTab = FISH_TAB_KEYS[idx];
      }
      return;
    }
    const contentY = tabY + FISH_TAB_H;
    if (sy < contentY) return;
    const scroll = this.fishermanScrolls[this.fishermanTab] || 0;
    const row    = Math.floor((sy - contentY + scroll) / FISH_ROW_H);
    const btnX   = px + FISH_PW - 64;
    if (sx < btnX) return;

    if (this.fishermanTab === 'buy') {
      if (row < FISH_SHOP_STOCK.length) {
        const entry = FISH_SHOP_STOCK[row];
        const gold  = this.inventory.count('gold_coin');
        if (gold < entry.buyPrice) { this.notifications.add('Not enough gold.', '#e74c3c'); return; }
        if (this.inventory.isFull()) { this.notifications.add('Inventory is full.', '#e74c3c'); return; }
        this.inventory.remove('gold_coin', entry.buyPrice);
        this.inventory.add(entry.item);
        this.notifications.add(`Bought ${entry.item.name} for ${entry.buyPrice}g.`, '#f1c40f');
      }
    } else if (this.fishermanTab === 'sell') {
      const sellable = this._getFishSellableSlots();
      if (row < sellable.length) {
        const slot  = sellable[row];
        const price = FISH_SELL_PRICES[slot.item.id] ?? 0;
        if (price === 0) return;
        this.inventory.remove(slot.item.id, 1);
        this.inventory.add(ITEMS.GOLD_COIN, price);
        this.notifications.add(`Sold ${slot.item.name} for ${price}g.`, '#f1c40f');
      }
    }
  }

  _getFishSellableSlots() {
    return this.inventory.slots.filter(
      s => s && FISH_SELL_PRICES[s.item.id] !== undefined
    );
  }

  _drawFishermanPanel(ctx) {
    const W  = this.canvas.width;
    const H  = this.canvas.height;
    const px = Math.floor((W - FISH_PW) / 2);
    const py = Math.floor((H - FISH_PH) / 2);
    const r  = this.renderer;

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);

    // Panel background
    ctx.fillStyle = 'rgba(8,18,30,0.97)';
    r._roundRect(ctx, px, py, FISH_PW, FISH_PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    r._roundRect(ctx, px, py, FISH_PW, FISH_PH, 8);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Fisherman', px + 12, py + 24);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Click outside to close', px + 12, py + 40);
    const gold = this.inventory.count('gold_coin');
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${gold}`, px + FISH_PW - 12, py + 28);

    // Header divider
    ctx.strokeStyle = '#1a4060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + FISH_HEADER_H - 2);
    ctx.lineTo(px + FISH_PW - 8, py + FISH_HEADER_H - 2);
    ctx.stroke();

    // Tabs
    const tabY = py + FISH_HEADER_H;
    const tabW = Math.floor((FISH_PW - 8) / FISH_TAB_KEYS.length);
    for (let i = 0; i < FISH_TAB_KEYS.length; i++) {
      const key    = FISH_TAB_KEYS[i];
      const active = this.fishermanTab === key;
      const tx     = px + 4 + i * tabW;
      ctx.fillStyle = active ? '#1a4060' : 'rgba(20,40,60,0.7)';
      r._roundRect(ctx, tx, tabY + 3, tabW - 4, FISH_TAB_H - 6, 4);
      ctx.fill();
      ctx.strokeStyle = active ? '#2980b9' : '#333';
      ctx.lineWidth = 1;
      r._roundRect(ctx, tx, tabY + 3, tabW - 4, FISH_TAB_H - 6, 4);
      ctx.stroke();
      ctx.fillStyle = active ? '#3498db' : '#777';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(FISH_TAB_LABELS[key], tx + (tabW - 4) / 2, tabY + 21);
    }

    // Content divider
    const contentY = tabY + FISH_TAB_H;
    ctx.strokeStyle = '#1a4060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, contentY);
    ctx.lineTo(px + FISH_PW - 8, contentY);
    ctx.stroke();

    const fishLevel  = this.skills.getLevel(SKILL_IDS.FISHING);
    const VIEWPORT_H = FISH_PH - FISH_HEADER_H - FISH_TAB_H;
    const SCROLL_W   = 8;

    // Compute total scrollable height for current tab
    const sellable = this._getFishSellableSlots();
    // records: title(12) + gap(28) + 4 stats(96) + gap(8) + divider(1) + col header(28) + species rows
    const RECORDS_HEADER_H = 12 + 28 + 4 * 24 + 8 + 1 + 28;
    let totalH;
    if      (this.fishermanTab === 'guide')   totalH = FISH_SPECIES.length * FISH_ROW_H;
    else if (this.fishermanTab === 'records') totalH = RECORDS_HEADER_H + FISH_SPECIES.length * 20;
    else if (this.fishermanTab === 'buy')     totalH = FISH_SHOP_STOCK.length * FISH_ROW_H;
    else                                      totalH = Math.max(FISH_ROW_H, sellable.length * FISH_ROW_H);

    const maxScroll = Math.max(0, totalH - VIEWPORT_H);
    const scroll    = Math.max(0, Math.min(this.fishermanScrolls[this.fishermanTab] || 0, maxScroll));
    this.fishermanScrolls[this.fishermanTab] = scroll;

    // Width of the content area (shrink by scrollbar if needed)
    const contentW = FISH_PW - 8 - (maxScroll > 0 ? SCROLL_W + 4 : 0);

    // Clip to content viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(px + 4, contentY, contentW, VIEWPORT_H);
    ctx.clip();

    // ── Tab content (scroll-offset applied to ry) ─────────
    if (this.fishermanTab === 'guide') {
      for (let i = 0; i < FISH_SPECIES.length; i++) {
        const sp  = FISH_SPECIES[i];
        const ry  = contentY + i * FISH_ROW_H - scroll;
        if (ry + FISH_ROW_H < contentY || ry > contentY + VIEWPORT_H) continue;
        const rec = this.fishingRecords.bySpecies[sp.id];
        const unlocked = fishLevel >= sp.minLevel;

        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(px + 4, ry, contentW, FISH_ROW_H - 1);
        }

        ctx.fillStyle = unlocked ? sp.color : '#333';
        ctx.fillRect(px + 10, ry + 8, 24, 24);
        ctx.strokeStyle = '#2a4a6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 10, ry + 8, 24, 24);

        ctx.fillStyle = unlocked ? '#ddd' : '#555';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(sp.name, px + 42, ry + 19);
        ctx.fillStyle = unlocked ? '#3498db' : '#444';
        ctx.font = '10px monospace';
        ctx.fillText(sp.rarity, px + 42, ry + 33);

        ctx.fillStyle = unlocked ? '#27ae60' : '#c0392b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${sp.minLevel}`, px + 148, ry + 22);

        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(`${sp.wMin}–${sp.wMax}kg`, px + 210, ry + 22);

        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`${sp.xp} XP`, px + 280, ry + 22);

        const pb = rec && rec.heaviest > 0 ? `PB: ${rec.heaviest}kg` : '—';
        ctx.fillStyle = rec && rec.heaviest > 0 ? '#27ae60' : '#444';
        ctx.fillText(pb, px + 350, ry + 22);

        const cnt = rec ? rec.count : 0;
        ctx.fillStyle = cnt > 0 ? '#3498db' : '#333';
        ctx.textAlign = 'right';
        ctx.fillText(`×${cnt}`, px + contentW + 4, ry + 22);
      }

    } else if (this.fishermanTab === 'records') {
      const rec = this.fishingRecords;
      let ry = contentY + 12 - scroll;

      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Your Fishing Records', px + 16, ry);
      ry += 28;

      const stats = [
        ['Total Caught',  `${rec.totalCaught} fish`],
        ['Total Weight',  `${rec.totalWeight.toFixed(1)} kg`],
        ['Personal Best', rec.personalBest
          ? `${rec.personalBest.name} — ${rec.personalBest.weight}kg`
          : 'None yet'],
        ['Fishing Level', `${fishLevel}`],
      ];
      for (const [label, value] of stats) {
        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.fillText(label, px + 16, ry);
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(value, px + contentW + 4, ry);
        ctx.textAlign = 'left';
        ry += 24;
      }

      ry += 8;
      ctx.strokeStyle = '#1a4060';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 8, ry); ctx.lineTo(px + contentW + 4, ry); ctx.stroke();
      ry += 14;
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Species', px + 16, ry);
      ctx.textAlign = 'center';
      ctx.fillText('Caught', px + 260, ry);
      ctx.fillText('Heaviest', px + 370, ry);
      ctx.textAlign = 'left';
      ry += 14;

      for (const sp of FISH_SPECIES) {
        if (ry > contentY + VIEWPORT_H) break;
        const srec = rec.bySpecies[sp.id] || { count: 0, heaviest: 0 };
        ctx.fillStyle = srec.count > 0 ? '#ccc' : '#444';
        ctx.font = '10px monospace';
        ctx.fillText(sp.name, px + 16, ry);
        ctx.textAlign = 'center';
        ctx.fillText(srec.count > 0 ? String(srec.count) : '—', px + 260, ry);
        ctx.fillText(srec.heaviest > 0 ? `${srec.heaviest}kg` : '—', px + 370, ry);
        ctx.textAlign = 'left';
        ry += 20;
      }

    } else if (this.fishermanTab === 'buy') {
      for (let i = 0; i < FISH_SHOP_STOCK.length; i++) {
        const entry  = FISH_SHOP_STOCK[i];
        const ry2    = contentY + i * FISH_ROW_H - scroll;
        if (ry2 + FISH_ROW_H < contentY || ry2 > contentY + VIEWPORT_H) continue;
        const canAff = gold >= entry.buyPrice;
        const iconSz = FISH_ROW_H - 8;
        ctx.fillStyle = 'rgba(20,40,60,0.5)';
        r._roundRect(ctx, px + 8, ry2 + 4, iconSz, iconSz, 3);
        ctx.fill();
        entry.item.draw(ctx, px + 8, ry2 + 4, iconSz);
        ctx.fillStyle = canAff ? '#ddd' : '#555';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(entry.item.name, px + 8 + iconSz + 10, ry2 + FISH_ROW_H / 2 - 4);
        ctx.fillStyle = canAff ? '#f1c40f' : '#a06010';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${entry.buyPrice}g`, px + 8 + iconSz + 10, ry2 + FISH_ROW_H / 2 + 10);
        const btnW = 56, btnX2 = px + FISH_PW - btnW - 8 - (maxScroll > 0 ? SCROLL_W + 4 : 0);
        const btnY2 = ry2 + Math.floor((FISH_ROW_H - 24) / 2);
        ctx.fillStyle = canAff ? '#1a5a8a' : '#333';
        r._roundRect(ctx, btnX2, btnY2, btnW, 24, 4);
        ctx.fill();
        ctx.fillStyle = canAff ? '#3498db' : '#555';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Buy', btnX2 + btnW / 2, btnY2 + 16);
      }

    } else if (this.fishermanTab === 'sell') {
      if (sellable.length === 0) {
        ctx.fillStyle = '#555';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No fish to sell', px + FISH_PW / 2, contentY + FISH_ROW_H - scroll);
      } else {
        for (let i = 0; i < sellable.length; i++) {
          const slot   = sellable[i];
          const price  = FISH_SELL_PRICES[slot.item.id] ?? 0;
          const ry3    = contentY + i * FISH_ROW_H - scroll;
          if (ry3 + FISH_ROW_H < contentY || ry3 > contentY + VIEWPORT_H) continue;
          const iconSz = FISH_ROW_H - 8;
          ctx.fillStyle = 'rgba(20,40,60,0.5)';
          r._roundRect(ctx, px + 8, ry3 + 4, iconSz, iconSz, 3);
          ctx.fill();
          slot.item.draw(ctx, px + 8, ry3 + 4, iconSz);
          ctx.fillStyle = '#ddd';
          ctx.font = '12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(slot.item.name, px + 8 + iconSz + 10, ry3 + FISH_ROW_H / 2 - 4);
          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`${price}g each`, px + 8 + iconSz + 10, ry3 + FISH_ROW_H / 2 + 10);
          const btnW = 56, btnX3 = px + FISH_PW - btnW - 8 - (maxScroll > 0 ? SCROLL_W + 4 : 0);
          const btnY3 = ry3 + Math.floor((FISH_ROW_H - 24) / 2);
          ctx.fillStyle = '#1a5a1a';
          r._roundRect(ctx, btnX3, btnY3, btnW, 24, 4);
          ctx.fill();
          ctx.fillStyle = '#27ae60';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Sell', btnX3 + btnW / 2, btnY3 + 16);
        }
      }
    }

    ctx.restore();

    // ── Scrollbar ─────────────────────────────────────────
    if (maxScroll > 0) {
      const sbX    = px + FISH_PW - 4 - SCROLL_W;
      const sbTopY = contentY + 2;
      const sbH    = VIEWPORT_H - 4;
      ctx.fillStyle = '#0d1e2e';
      r._roundRect(ctx, sbX, sbTopY, SCROLL_W, sbH, 4);
      ctx.fill();
      const thumbH = Math.max(20, (sbH * VIEWPORT_H / totalH) | 0);
      const thumbY = sbTopY + ((sbH - thumbH) * scroll / maxScroll) | 0;
      ctx.fillStyle = '#2980b9';
      r._roundRect(ctx, sbX, thumbY, SCROLL_W, thumbH, 4);
      ctx.fill();
    }
  }

  _buyItem({ item, buyPrice }) {
    const gold = this.inventory.count('gold_coin');
    if (gold < buyPrice) {
      this.notifications.add('Not enough gold!', '#e74c3c');
      return;
    }
    if (this.inventory.isFull() && !this.inventory.has(item.id)) {
      this.notifications.add('Inventory full!', '#e74c3c');
      return;
    }
    this.inventory.remove('gold_coin', buyPrice);
    this.inventory.add(item, 1);
    this.notifications.add(`Bought ${item.name} for ${buyPrice}g`, '#f1c40f');
  }

  _sellItem(slot) {
    const price = SELL_PRICES[slot.item.id];
    if (price === undefined) return;
    const qty   = slot.item.stackable ? slot.qty : 1;
    const total = price * qty;
    this.inventory.remove(slot.item.id, qty);
    this.inventory.add(ITEMS.GOLD_COIN, total);
    const suffix = qty > 1 ? ` x${qty}` : '';
    this.notifications.add(`Sold ${slot.item.name}${suffix} for ${total}g`, '#f1c40f');
  }

  _getSellableSlots() {
    return this.inventory.slots.filter(s => s && SELL_PRICES[s.item.id] !== undefined);
  }

  /* ── Admin teleport panel ────────────────────────────── */

  _getTpDestinations() {
    const spawnC = Math.floor(this.world.cols / 2);
    const spawnR = Math.floor(this.world.rows / 2) + 5;
    return [
      { id: 'Spawn',         c: spawnC,       r: spawnR,       type: 'spawn'   },
      ...STRUCTURE_NODES,
      { id: 'Goblin Cave',   c: spawnC + 15,  r: spawnR - 55,  type: 'dungeon' },
      { id: 'Spider Den',    c: spawnC + 110, r: spawnR - 85,  type: 'dungeon' },
      { id: 'Ancient Mines', c: spawnC + 265, r: spawnR + 145, type: 'dungeon' },
    ];
  }

  _adminTpPanelRect() {
    const ROW_H = 28;
    const PW = 240;
    const dests = this._getTpDestinations();
    const PH = 36 + dests.length * ROW_H + 8;
    const px = Math.floor((this.canvas.width - PW) / 2);
    const py = Math.floor((this.canvas.height - PH) / 2);
    return { px, py, PW, PH, ROW_H };
  }

  // ── Admin Equip Panel ────────────────────────────────────
  _adminEquipPanelRect() {
    const BTN_W = 64, BTN_H = 24, BTN_GAP = 4, BTNS_PER_ROW = 6;
    const LABEL_W = 90, PAD = 12, SLOT_PAD_TOP = 8, SLOT_PAD_BOT = 6;

    // Variable height per slot based on how many button rows are needed
    const slotHeights = EQUIPMENT_SLOTS.map(slot => {
      const nRows = Math.ceil(ARMOR_OPTIONS[slot].length / BTNS_PER_ROW);
      return SLOT_PAD_TOP + nRows * BTN_H + (nRows - 1) * BTN_GAP + SLOT_PAD_BOT;
    });

    const PW = PAD + LABEL_W + BTN_GAP + BTNS_PER_ROW * BTN_W + (BTNS_PER_ROW - 1) * BTN_GAP + PAD;
    const PH = 40 + slotHeights.reduce((a, b) => a + b, 0) + PAD;
    const px = Math.round(this.canvas.width  / 2 - PW / 2);
    const py = Math.round(this.canvas.height / 2 - PH / 2);
    return { px, py, PW, PH, BTN_W, BTN_H, BTN_GAP, BTNS_PER_ROW, LABEL_W, PAD, SLOT_PAD_TOP, SLOT_PAD_BOT, slotHeights };
  }

  _drawAdminEquipPanel(ctx) {
    const { px, py, PW, PH, BTN_W, BTN_H, BTN_GAP, BTNS_PER_ROW, LABEL_W, PAD, SLOT_PAD_TOP, slotHeights } = this._adminEquipPanelRect();

    // Background
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, PW, PH);

    // Title
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ADMIN EQUIP  [G]', px + PW / 2, py + 22);

    let ry = py + 40;
    EQUIPMENT_SLOTS.forEach((slot, si) => {
      const slotH = slotHeights[si];
      const opts = ARMOR_OPTIONS[slot];
      const current = this.player.equipment[slot];

      // Slot label — vertically centred in its slot
      ctx.fillStyle = '#ccc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(SLOT_LABELS[slot], px + PAD, ry + slotH / 2 + 4);

      // Option buttons in rows of BTNS_PER_ROW
      opts.forEach((opt, oi) => {
        const row = Math.floor(oi / BTNS_PER_ROW);
        const col = oi % BTNS_PER_ROW;
        const bx = px + PAD + LABEL_W + BTN_GAP + col * (BTN_W + BTN_GAP);
        const by = ry + SLOT_PAD_TOP + row * (BTN_H + BTN_GAP);
        const active = opt.id === current;
        const hovered = this.mouseScreen.x >= bx && this.mouseScreen.x < bx + BTN_W
                     && this.mouseScreen.y >= by && this.mouseScreen.y < by + BTN_H;

        // Button bg
        ctx.fillStyle = active  ? '#7a3a00'
                      : hovered ? 'rgba(255,255,255,0.12)'
                      :           'rgba(255,255,255,0.05)';
        ctx.fillRect(bx, by, BTN_W, BTN_H);

        // Border
        ctx.strokeStyle = active ? '#e67e22' : '#555';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(bx, by, BTN_W, BTN_H);

        // Colour swatch
        if (opt.color) {
          ctx.fillStyle = opt.color;
          ctx.fillRect(bx + 3, by + 4, 6, BTN_H - 8);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 3, by + 4, 6, BTN_H - 8);
        }

        // Label
        ctx.fillStyle = active ? '#e67e22' : '#ddd';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(opt.label, bx + BTN_W / 2 + (opt.color ? 3 : 0), by + BTN_H - 6);
        ctx.textAlign = 'left';
      });

      ry += slotH;
    });
  }

  _handleAdminEquipClick(sx, sy) {
    const { px, py, PW, PH, BTN_W, BTN_H, BTN_GAP, BTNS_PER_ROW, LABEL_W, PAD, SLOT_PAD_TOP, slotHeights } = this._adminEquipPanelRect();
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.adminEquipOpen = false;
      return;
    }
    let ry = py + 40;
    EQUIPMENT_SLOTS.forEach((slot, si) => {
      const slotH = slotHeights[si];
      ARMOR_OPTIONS[slot].forEach((opt, oi) => {
        const row = Math.floor(oi / BTNS_PER_ROW);
        const col = oi % BTNS_PER_ROW;
        const bx = px + PAD + LABEL_W + BTN_GAP + col * (BTN_W + BTN_GAP);
        const by = ry + SLOT_PAD_TOP + row * (BTN_H + BTN_GAP);
        if (sx >= bx && sx < bx + BTN_W && sy >= by && sy < by + BTN_H) {
          this.player.equipment[slot] = opt.id;
        }
      });
      ry += slotH;
    });
  }

  _drawAdminTpPanel(ctx) {
    const { px, py, PW, PH, ROW_H } = this._adminTpPanelRect();

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, PW, PH);

    // Title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ADMIN TELEPORT  [`]', px + PW / 2, py + 18);

    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const TYPE_COLOR = {
      spawn: '#f1c40f', village: '#27ae60', kingdom: '#e74c3c', watchtower: '#e67e22',
      outpost: '#9b59b6', ruins: '#95a5a6', dungeon: '#a855f7',
    };

    this._getTpDestinations().forEach((node, i) => {
      const ry = py + 32 + i * ROW_H;
      const hover = this.mouseScreen.y >= ry && this.mouseScreen.y < ry + ROW_H
                 && this.mouseScreen.x >= px  && this.mouseScreen.x < px + PW;
      if (hover) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px + 2, ry, PW - 4, ROW_H);
      }
      ctx.fillStyle = TYPE_COLOR[node.type] ?? '#fff';
      ctx.fillText(`${node.id}`, px + 12, ry + 17);
      ctx.fillStyle = '#aaa';
      ctx.fillText(`(${node.c}, ${node.r})`, px + 160, ry + 17);
    });
  }

  _handleAdminTpClick(sx, sy) {
    const { px, py, PW, PH, ROW_H } = this._adminTpPanelRect();
    // Click outside closes panel
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.showAdminTp = false;
      return;
    }
    const listY = py + 32;
    const dests = this._getTpDestinations();
    const idx = Math.floor((sy - listY) / ROW_H);
    if (idx < 0 || idx >= dests.length) return;

    const node = dests[idx];

    // Exit any sub-map so teleport always lands in the overworld
    if (this.inDungeon) {
      this.inDungeon     = false;
      this.activeDungeon = null;
      this.activeMap     = this.world;
      this.player.world  = this.world;
      this.actions.world = this.world;
      this.combat.mobManager = this.mobManager;
      this.combat.clearTarget();
      this.camera.setBounds(this.world.cols * TILE_SIZE, this.world.rows * TILE_SIZE);
    } else if (this.inRaid) {
      this.inRaid      = false;
      this.activeRaid  = null;
      this.activeMap   = this.world;
      this.player.world  = this.world;
      this.actions.world = this.world;
      this.combat.mobManager = this.mobManager;
      this.combat.clearTarget();
      this.camera.setBounds(this.world.cols * TILE_SIZE, this.world.rows * TILE_SIZE);
    } else if (this.inInterior) {
      this.inInterior  = false;
      this.activeMap   = this.world;
    }

    // Cancel any in-progress fade transition
    this.fadingOut        = false;
    this.fadeAlpha        = 0;
    this._fadeCallback    = null;

    this.player.col = node.c;
    this.player.row = node.r;
    this.player.x   = node.c * TILE_SIZE + 4;
    this.player.y   = node.r * TILE_SIZE;
    this.player.path    = [];
    this.player.moving  = false;
    this.player.targetCol = null;
    this.player.targetRow = null;
    this.player.actionLocked = false;
    this.transitionCooldown = 1.0; // prevent immediate portal/dungeon entry
    this.camera.snapTo(this.player.cx, this.player.cy);
    this.showAdminTp = false;
    this.notifications.add(`Teleported to ${node.id}.`, '#f1c40f');
  }

  // ── Equip from inventory ─────────────────────────────
  _buildContextMenu(sx, sy, invSlot) {
    const slot = this.inventory.slots[invSlot];
    if (!slot) return null;
    const opts = [];
    const item = slot.item;

    if (item.heal) {
      opts.push({ label: `Eat ${item.name}`, cb: () => this._eatItem(invSlot) });
    }
    if (item.equipSlot) {
      opts.push({ label: `Equip ${item.name}`, cb: () => this._equipItem(invSlot) });
    }
    if (item.placeable && this.inInterior && this.activeMap.id === 'player_house') {
      opts.push({ label: `Place ${item.name}`, cb: () => {
        this.placingFurniture = { item, slotIndex: invSlot };
        this.placingRotation  = 0;
        this.contextMenu = null;
        this.notifications.add(`Click to place ${item.name}.  R = rotate  Esc = cancel`, '#f1c40f');
      }});
    }
    opts.push({ label: `Use ${item.name}`, cb: () => {
      this.contextMenu = null;
    }});
    opts.push({ label: `Drop ${item.name}`, cb: () => this._dropItem(invSlot) });

    return { x: sx, y: sy, invSlot, options: opts };
  }

  _eatItem(invSlot) {
    const slot = this.inventory.slots[invSlot];
    if (!slot || !slot.item.heal) return;
    if (this.player.hp >= this.player.maxHp) {
      this.contextMenu = null;
      return;
    }
    const healed = Math.min(slot.item.heal, this.player.maxHp - this.player.hp);
    this.player.hp += healed;
    this.inventory.remove(slot.item.id, 1);
    this.notifications.add(`You eat the ${slot.item.name} and heal ${healed} HP.`, '#27ae60');
    this.contextMenu = null;
  }

  _dropItem(invSlot) {
    const slot = this.inventory.slots[invSlot];
    if (!slot) return;
    this.inventory.slots[invSlot] = null;
    this.combat.spawnGroundItem(slot.item, slot.qty, this.player.cx, this.player.cy);
    this.contextMenu = null;
  }

  _recalcMaxHp() {
    const hpLevel  = this.skills.getLevel(SKILL_IDS.HITPOINTS);
    const { hp: bonusHp } = getTotalStats(this.player.equipment);
    const newMax   = Math.floor(9 + hpLevel) + bonusHp;
    if (newMax === this.player.maxHp) return;
    const diff = newMax - this.player.maxHp;
    this.player.maxHp = newMax;
    if (diff > 0) this.player.hp = Math.min(newMax, this.player.hp + diff);
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
  }

  _equipItem(invSlot) {
    const slot = this.inventory.slots[invSlot];
    if (!slot || !slot.item.equipSlot) return;

    // Check level requirements
    const gearEntry = GEAR_BY_ID.get(slot.item.id);
    if (gearEntry) {
      const { ok, reason } = meetsRequirements(gearEntry, this.skills);
      if (!ok) {
        this.notifications.add(reason, '#e74c3c');
        this.contextMenu = null;
        return;
      }
    }

    const eqSlot = slot.item.equipSlot;
    const current = this.player.equipment[eqSlot];
    // Swap current equipped item back to inventory
    if (current && current !== 'none') {
      const oldItem = EQUIP_ID_TO_ITEM[current];
      if (oldItem && !this.inventory.isFull()) {
        this.inventory.add(oldItem, 1);
      }
    }
    this.player.equipment[eqSlot] = slot.item.id;
    this.inventory.slots[invSlot] = null;
    this.contextMenu = null;
    this._recalcMaxHp();
    this._saveToServer();
    if (this.network) this.network.sendEquip(this.player.equipment, this.player.style, this.player.name, this.player.combatLevel);
  }

  _unequipSlot(slot) {
    const equipped = this.player.equipment[slot];
    if (!equipped || equipped === 'none') return;
    const item = EQUIP_ID_TO_ITEM[equipped];
    if (item) {
      if (this.inventory.isFull()) {
        this.notifications.add('Inventory full!', '#e74c3c');
        return;
      }
      this.inventory.add(item, 1);
    }
    this.player.equipment[slot] = 'none';
    this._recalcMaxHp();
    this._saveToServer();
    if (this.network) this.network.sendEquip(this.player.equipment, this.player.style, this.player.name, this.player.combatLevel);
  }

  _handleContextMenuClick(sx, sy) {
    const m = this.contextMenu;
    if (!m) return;
    const optH = 26, menuW = 170, PAD = 4;
    const PH = m.options.length * optH + PAD * 2;
    // Mirror the renderer's clamping so hit zones match the visible menu
    const mx = Math.min(m.x, this.canvas.width  - menuW - 4);
    const my = Math.min(m.y, this.canvas.height - PH    - 4);
    let hit = false;
    m.options.forEach((opt, i) => {
      const oy = my + PAD + i * optH;
      if (sx >= mx && sx <= mx + menuW && sy >= oy && sy <= oy + optH) {
        opt.cb();
        hit = true;
      }
    });
    if (!hit) this.contextMenu = null;
  }

  _equipPanelRect() {
    const PW = 220, ROW_H = 48, PAD = 14;
    const PH = 36 + EQUIPMENT_SLOTS.length * ROW_H + PAD;
    const px = 10;
    const py = Math.round(this.canvas.height / 2 - PH / 2);
    return { px, py, PW, PH, ROW_H, PAD };
  }

  _handleEquipPanelClick(sx, sy) {
    const { px, py, PW, PH, ROW_H } = this._equipPanelRect();
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.equipPanelOpen = false;
      return;
    }
    EQUIPMENT_SLOTS.forEach((slot, i) => {
      const ry = py + 36 + i * ROW_H;
      if (sy >= ry && sy < ry + ROW_H) {
        this._unequipSlot(slot);
      }
    });
  }

  _beginTransition(callback) {
    if (this.fadingOut) return;
    this.fadingOut     = true;
    this.fadeAlpha     = 0;
    this._fadeCallback = callback;
    // Stop any movement
    this.player.path      = [];
    this.player.moving    = false;
    this.player.targetCol = null;
    this.player.targetRow = null;
  }

  _enterInterior(interiorId) {
    const interior = this.interiors.get(interiorId);
    if (!interior) return;

    // Remember where to return
    this.returnPos = { col: this.player.col, row: this.player.row + 1 };

    // Switch to interior
    this.inInterior    = true;
    this.activeMap     = interior;
    this.player.world  = interior;
    this.actions.world = interior;

    // Place player at interior entry point
    this.player.col       = interior.entryCol;
    this.player.row       = interior.entryRow;
    this.player.x         = interior.entryCol * 32 + 4;
    this.player.y         = interior.entryRow * 32;
    // Clear any in-progress movement so the player doesn't slide to a stale world tile
    this.player.targetCol = null;
    this.player.targetRow = null;
    this.player.moveT     = 0;
    this.player.moving    = false;
    this.player.path      = [];

    // Set bounds to interior size so the camera centres the small map
    this.camera.setBounds(interior.cols * TILE_SIZE, interior.rows * TILE_SIZE);
    this.camera.snapTo(this.player.cx, this.player.cy);

    this.transitionCooldown = 1.0;
    if (this.network && this.combat.targetMob) this.network.sendStopCombat(this.combat.targetMob.id);
    this.combat.clearTarget();
    this.actions.cancel();
    this.player.actionLocked = false;
  }

  _exitToWorld() {
    // Close any shop panels that were open inside the interior
    this.butcherShopOpen  = false;
    this.weaponShopOpen   = false;
    this.varietyShopOpen  = false;
    this.capeShopOpen     = false;
    this.fishermanOpen    = false;

    // Switch back to world map
    this.inInterior    = false;
    this.activeMap     = this.world;
    this.player.world  = this.world;
    this.actions.world = this.world;

    // Return to saved position (one tile south of door)
    const rc = this.returnPos ?? { col: Math.floor(1024 / 2), row: Math.floor(768 / 2) + 6 };
    this.player.col       = rc.col;
    this.player.row       = rc.row;
    this.player.x         = rc.col * 32 + 4;
    this.player.y         = rc.row * 32;
    // Clear any in-progress movement so the player doesn't slide to a stale interior tile
    this.player.targetCol = null;
    this.player.targetRow = null;
    this.player.moveT     = 0;
    this.player.moving    = false;
    this.player.path      = [];

    this.camera.setBounds(); // reset to world bounds
    this.camera.snapTo(this.player.cx, this.player.cy);
    this.transitionCooldown = 1.0;
  }

  _drawHitSplats(ctx, splats) {
    for (const s of splats) {
      const t      = s.timer / s.maxTimer;          // 0 → 1
      const alpha  = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; // fade last 30 %
      const floatY = s.wy - t * 18;                 // float up 18 px

      ctx.save();
      ctx.globalAlpha = alpha;

      // Splat circle
      const r = 7;
      ctx.beginPath();
      ctx.arc(s.wx, floatY, r, 0, Math.PI * 2);
      ctx.fillStyle = s.value > 0 ? '#cc2200' : '#224488';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(s.value), s.wx, floatY);

      ctx.restore();
    }
    ctx.textBaseline = 'alphabetic';
  }

  // ── Save / Load ─────────────────────────────────────────────────────────

  _serializeState() {
    const inv = this.inventory.slots.map(s =>
      s ? { id: s.item.id, qty: s.qty } : null
    );
    // If the player is in an interior or raid, save their world return position
    // instead of interior tile coords (which would place them at the wrong spot on restore).
    const worldSpawn = { col: 512, row: 390 };
    const savePos = (this.inInterior || this.inRaid || this.inDungeon)
      ? (this.returnPos ?? worldSpawn)
      : { col: this.player.col, row: this.player.row };
    const save = {
      col:       savePos.col,
      row:       savePos.row,
      hp:        this.player.hp,
      maxHp:     this.player.maxHp,
      name:      this.player.name,
      style:     { ...this.player.style },
      equipment: { ...this.player.equipment },
      inventory: inv,
      skills:    [...this.skills.xp],
    };
    save.housing = this.housingState.toJSON();
    save.farming = this.farmingState.toJSON();
    // Chest storage — serialize item objects back to id+qty
    const chests = {};
    for (const [k, slots] of this.chestStorage) {
      const ser = slots.map(s => s ? { id: s.item.id, qty: s.qty } : null);
      if (ser.some(s => s !== null)) chests[k] = ser;
    }
    if (Object.keys(chests).length > 0) save.chests = chests;
    return save;
  }

  _restoreState(save) {
    // Position
    this.player.col = save.col ?? this.player.col;
    this.player.row = save.row ?? this.player.row;
    this.player.x   = this.player.col * TILE_SIZE + 4;
    this.player.y   = this.player.row * TILE_SIZE;

    // Stats
    if (save.hp    != null) this.player.hp    = save.hp;
    if (save.maxHp != null) this.player.maxHp = save.maxHp;
    if (save.name)          this.player.name  = save.name;

    // Appearance
    if (save.style)     Object.assign(this.player.style,     save.style);
    if (save.equipment) Object.assign(this.player.equipment, save.equipment);

    // Skills
    if (Array.isArray(save.skills)) {
      save.skills.forEach((xp, i) => { if (typeof xp === 'number') this.skills.xp[i] = xp; });
    }

    // Inventory
    if (Array.isArray(save.inventory)) {
      save.inventory.forEach((entry, i) => {
        if (!entry) { this.inventory.slots[i] = null; return; }
        const item = ITEM_BY_ID.get(entry.id);
        this.inventory.slots[i] = item ? { item, qty: entry.qty } : null;
      });
    }

    // Housing state — rebuild the interior map from saved layout
    if (save.housing) {
      this.housingState.fromJSON(save.housing);
    }
    if (save.farming) {
      this.farmingState.fromJSON(save.farming);
    }
    if (save.housing || save.farming) {
      this.interiors.set('player_house', buildPlayerHouse(this.housingState, this.farmingState));
    }

    // Chest storage
    if (save.chests) {
      for (const [k, slots] of Object.entries(save.chests)) {
        const resolved = slots.map(s => {
          if (!s) return null;
          const item = ITEM_BY_ID.get(s.id);
          return item ? { item, qty: s.qty } : null;
        });
        this.chestStorage.set(k, resolved);
      }
    }
  }

  _logoutButtonRect() {
    const W = this.canvas.width, H = this.canvas.height;
    const PW = 232, PH = 28 + 378 + 4;
    const px = W - PW - 4;
    // sit just below the side panel with a small gap
    const by = H - PH - 4 - 26 - 4;
    return { x: px, y: by, w: PW, h: 26 };
  }

  _drawLogoutButton(ctx) {
    const r = this._logoutButtonRect();
    const hover = this.mouseScreen.x >= r.x && this.mouseScreen.x <= r.x + r.w &&
                  this.mouseScreen.y >= r.y && this.mouseScreen.y <= r.y + r.h;
    ctx.fillStyle = hover ? '#4a1010' : '#2a0808';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    // bevel border
    ctx.strokeStyle = hover ? '#c05050' : '#7a2020';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = '#e07070';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Log Out', r.x + r.w / 2, r.y + r.h / 2);
    ctx.textAlign = 'left';
  }

  _logout() {
    // Flag first so the save's 401 handler doesn't also trigger a reload —
    // the session will be intentionally invalidated a moment later.
    this._loggingOut = true;
    this._saveToServer();
    if (this.network) this.network.disconnect();
    // Tell the server to invalidate the session and clear the cookie,
    // then reload so the login screen is shown again.
    fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => setTimeout(() => location.reload(), 300));
  }

  _saveToServer(isUnload = false) {
    if (!this._saveToken) return;
    let body;
    try {
      body = JSON.stringify(this._serializeState());
    } catch (e) {
      console.error('[Save] failed to serialize state:', e);
      return;
    }

    if (isUnload && navigator.sendBeacon) {
      // sendBeacon survives page close. The browser includes the session cookie
      // automatically for same-origin requests — no Authorization header needed.
      const blob = new Blob([body], { type: 'application/json' });
      const ok   = navigator.sendBeacon('/save', blob);
      if (!ok) console.warn('[Save] sendBeacon rejected (payload too large?)');
      return;
    }

    // Regular saves use fetch with credentials so the session cookie is sent.
    fetch('/save', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body,
      keepalive:   true,
    })
      .then(r => {
        if (r.status === 401) {
          // If we're already in the middle of a voluntary logout the session is
          // intentionally being invalidated — don't double-reload or show a
          // spurious "session expired" notification.
          if (this._loggingOut) return;
          // Genuine session expiry — stop saving and prompt re-login.
          console.warn('[Save] session rejected (401)');
          this._saveToken = null;
          this.notifications.add('Session expired — please log in again.', '#e74c3c');
          setTimeout(() => location.reload(), 3000);
        } else if (!r.ok) {
          r.text().then(t => console.warn('[Save] server error:', r.status, t));
        } else {
          console.log('[Save] saved successfully');
        }
      })
      .catch(err => console.error('[Save] network error:', err));
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  _openChat() {
    if (!this.network) return; // chat only available in multiplayer
    this.chatInputActive = true;
    if (!this._chatInput) {
      const input = document.createElement('input');
      input.type        = 'text';
      input.maxLength   = 120;
      input.placeholder = 'Press Enter to send, Esc to cancel';
      input.style.cssText = [
        'position:fixed',
        'bottom:10px',
        'left:12px',
        'width:324px',
        'height:20px',
        'background:rgba(20,14,8,0.88)',
        'color:#f0e8d0',
        'border:1px solid #8b6914',
        'border-radius:2px',
        'padding:1px 6px',
        'font:12px monospace',
        'outline:none',
        'z-index:9999',
      ].join(';');
      // Enter submits, Esc cancels (handled via DOM in case canvas doesn't have focus)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  { e.preventDefault(); this._submitChat(); }
        if (e.key === 'Escape') { e.preventDefault(); this._closeChat(); }
        e.stopPropagation(); // prevent game key handlers from firing
      });
      document.body.appendChild(input);
      this._chatInput = input;
    }
    this._chatInput.style.display = 'block';
    this._chatInput.value = '';
    this._chatInput.focus();
  }

  _closeChat() {
    this.chatInputActive = false;
    if (this._chatInput) {
      this._chatInput.style.display = 'none';
      this._chatInput.blur();
    }
  }

  _submitChat() {
    if (!this._chatInput || !this.network) { this._closeChat(); return; }
    const text = this._chatInput.value.trim();
    if (text) {
      this.network.sendChat(text);
      this._chatScrollOffset = 0; // snap to newest on send
    }
    this._closeChat();
  }

  _drawChat(ctx) {
    const PAD      = 8;
    const LINE_H   = 16;
    const MAX_LINES = 7;
    const BOX_W    = 340;
    const HINT_H   = 24;
    const MSG_H    = MAX_LINES * LINE_H + PAD * 2; // 128
    const BOX_H    = MSG_H + HINT_H;               // 152
    const boxX     = 8;
    const boxY     = this.canvas.height - 46 - BOX_H; // leave room for FPS/coords line below
    // Panel background
    ctx.save();
    ctx.fillStyle = 'rgba(10,7,4,0.72)';
    ctx.strokeStyle = 'rgba(139,105,20,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, BOX_W, BOX_H, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Merge notifications (game log) + player chat, sorted oldest→newest
    const notifItems = this.notifications.messages.map(m => ({
      text: m.text, color: m.color, time: m.time, isChat: false,
    }));
    const chatItems = this.chatMessages.map(m => ({
      name: m.name, text: m.text, color: '#f0e8d0', time: m.time, isChat: true,
    }));
    const all   = [...notifItems, ...chatItems].sort((a, b) => a.time - b.time);
    const total = all.length;
    const maxOffset = Math.max(0, total - MAX_LINES);
    // Clamp scroll in case messages expired
    this._chatScrollOffset = Math.max(0, Math.min(maxOffset, this._chatScrollOffset));
    const end   = total - this._chatScrollOffset;
    const slice = all.slice(Math.max(0, end - MAX_LINES), end);
    const hasMore = this._chatScrollOffset > 0; // older messages above current view

    // Draw messages (oldest at top, newest at bottom)
    ctx.save();
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';
    const maxW = BOX_W - PAD * 2;
    for (let i = 0; i < slice.length; i++) {
      const msg = slice[i];
      const y = boxY + PAD + i * LINE_H;
      if (msg.isChat) {
        const prefix = msg.name + ': ';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(prefix, boxX + PAD, y);
        const prefixW = ctx.measureText(prefix).width;
        ctx.fillStyle = '#f0e8d0';
        let text = msg.text;
        while (ctx.measureText(text).width > maxW - prefixW && text.length > 1) text = text.slice(0, -1);
        ctx.fillText(text, boxX + PAD + prefixW, y);
      } else {
        ctx.fillStyle = msg.color;
        let text = msg.text;
        while (ctx.measureText(text).width > maxW && text.length > 1) text = text.slice(0, -1);
        ctx.fillText(text, boxX + PAD, y);
      }
    }
    // "Scroll up for more" indicator
    if (hasMore) {
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(200,180,120,0.6)';
      ctx.textAlign = 'right';
      ctx.fillText(`▲ ${this._chatScrollOffset} more`, boxX + BOX_W - PAD, boxY + PAD);
    }
    ctx.restore();

    // Separator between messages and hint/input row
    const sepY = boxY + MSG_H;
    ctx.save();
    ctx.strokeStyle = 'rgba(139,105,20,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + PAD, sepY);
    ctx.lineTo(boxX + BOX_W - PAD, sepY);
    ctx.stroke();
    ctx.restore();

    // Hint row (when input not active)
    if (!this.chatInputActive && this.network) {
      ctx.save();
      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(200,180,120,0.45)';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Enter to chat', boxX + PAD, sepY + HINT_H / 2);
      ctx.restore();
    }
  }

  // ── Multiplayer ──────────────────────────────────────────────────────────

  _setupNetworkHandlers() {
    const net = this.network;

    // On every (re)connect, push our current state to the server so other
    // players immediately see our correct position, appearance, and HP.
    net.on('connect', () => {
      // Reset dedup guards so all values are re-sent on the next update tick
      this.network._lastCol         = null;
      this.network._lastRow         = null;
      this.network._lastDir         = null;
      this._lastSentHp              = null;
      this._lastSentCombatLevel     = 0; // < any real level → forces sendEquip
      // Send appearance and HP immediately (don't wait for a change)
      this.network.sendEquip(
        this.player.equipment, this.player.style,
        this.player.name,      this.player.combatLevel
      );
      this.network.sendPlayerHp(this.player.hp, this.player.maxHp);
      // Position is sent on the next update tick once sendMove dedup is cleared
    });

    net.on('world_state', (players) => {
      for (const snap of players) this._upsertRemotePlayer(snap);
      if (players.length === 1) {
        this.notifications.add(`${players[0].name} is already online.`, '#6a9');
      } else if (players.length > 1) {
        this.notifications.add(`${players.length} other players are already online.`, '#6a9');
      }
    });

    net.on('player_joined', (snap) => {
      this._upsertRemotePlayer(snap);
      this.notifications.add(`${snap.name} joined.`, '#6a9');
    });

    net.on('player_moved', ({ id, col, row, dir }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      // Set up smooth interpolation from current pixel pos to the new tile
      view._fromX = view.x;
      view._fromY = view.y;
      view._toX   = col * TILE_SIZE + 4;
      view._toY   = row * TILE_SIZE;
      view.moveT  = 0;
      view.col    = col;
      view.row    = row;
      view.dir    = dir ?? view.dir;
    });

    net.on('player_updated', ({ id, equipment, style, name, combatLevel }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      if (equipment)              view.equipment    = equipment;
      if (style)                  view.style        = style;
      if (name)                   view.name         = name;
      if (combatLevel != null)    view.combatLevel  = combatLevel;
    });

    net.on('player_action', ({ id, currentAction, actionTarget }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      view.currentAction = currentAction;
      view.actionLocked  = currentAction !== 'idle' && currentAction !== 'fight';
      view.actionTarget  = actionTarget || null;
      if (currentAction === 'fight') view.skillAnim = 0; // start at 0 so the swing anim plays immediately
      else if (currentAction === 'idle') view.skillAnim = 0;
    });

    net.on('player_left', ({ id }) => {
      const view = this.remotePlayers.get(id);
      if (view) {
        this.notifications.add(`${view.name} left.`, '#888');
        this.remotePlayers.delete(id);
      }
    });

    net.on('player_hp', ({ id, hp, maxHp }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      view.hp    = hp;
      view.maxHp = maxHp;
    });

    net.on('player_splat', ({ id, damage, wx, wy }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      this.remoteHitSplats.push({ wx, wy, value: damage, timer: 0, maxTimer: 1.5, isPlayer: true });
    });

    net.on('player_attack', ({ id }) => {
      const view = this.remotePlayers.get(id);
      if (!view) return;
      view.skillAnim = 0; // reset swing animation so the stab plays
    });

    // Shared world state: tile changes from other players
    net.on('world_overrides', (overrides) => {
      this._applyingRemoteTile = true;
      for (const { col, row, tile } of overrides) {
        this.world.setTile(col, row, tile);
      }
      this._applyingRemoteTile = false;
    });

    net.on('tile_change', ({ col, row, tile }) => {
      this._applyingRemoteTile = true;
      this.world.setTile(col, row, tile);
      this._applyingRemoteTile = false;
    });

    // ── Server-authoritative mob sync ─────────────────────
    net.on('mob_state', (serverMobs) => {
      const seen = new Set();
      for (const s of serverMobs) {
        seen.add(s.id);
        let mob = this._mobById.get(s.id);
        if (!mob) {
          mob = new Mob(s.type, s.x, s.y);
          mob.id     = s.id;
          mob._fromX = s.x;  mob._fromY = s.y;
          mob._toX   = s.x;  mob._toY   = s.y;
          mob._lerpT = 0.15; // start as arrived — no initial snap
          this._mobById.set(s.id, mob);
          this.mobManager.mobs.push(mob);
        } else {
          // Set up lerp from current visual position to new server position
          mob._fromX = mob.x;  mob._fromY = mob.y;
          mob._toX   = s.x;    mob._toY   = s.y;
          mob._lerpT = 0;
        }
        mob.hp         = s.hp;
        mob.maxHp      = s.maxHp;
        mob.dead       = s.dead;
        mob.facingLeft = s.facingLeft;
        mob.animFrame  = s.animFrame;
        mob.moving     = s.moving;
      }
      // Remove any mobs not in the server snapshot — this includes the
      // locally-spawned mobs (id === undefined) created by MobManager's
      // constructor before the network connected.  Keeping them would cause
      // getMobAt() to return phantom mobs that the server never tracks,
      // making mob_hit events silently dropped (typeof undefined !== 'number').
      this.mobManager.mobs = this.mobManager.mobs.filter(m => {
        if (seen.has(m.id)) return true;
        if (m.id !== undefined) this._mobById.delete(m.id);
        return false;
      });
    });

    net.on('mob_damage', ({ id, hp, dead }) => {
      const mob = this._mobById.get(id);
      if (!mob) return;
      mob.hp       = hp;
      mob.dead     = dead;
      mob.inCombat = !dead; // keep HP bar visible while mob is being fought
    });

    net.on('mob_splat', ({ id, damage, wx, wy }) => {
      const mob = this._mobById.get(id);
      if (!mob || mob.dead) return;
      this.remoteHitSplats.push({ wx, wy, value: damage, timer: 0, maxTimer: 1.5 });
    });

    net.on('chat_message', ({ name, message }) => {
      this.chatMessages.push({ name, text: message, time: Date.now() });
      if (this.chatMessages.length > 50) this.chatMessages.shift();
      if (this._chatScrollOffset === 0) return; // already at bottom
      // Keep scroll position so user doesn't lose their place (they can scroll back)
    });
  }

  // ── Raid system ──────────────────────────────────────────────────────────

  _startRaid(raidIndex, diffIndex) {
    const raidDef = RAID_DEFS[raidIndex];
    const diffDef = RAID_DIFFICULTIES[diffIndex];
    this.activeRaid = new RaidInstance(raidDef, diffDef, this.skills, diffIndex);

    this._beginTransition(() => {
      const arena = this.activeRaid.arenaMap;
      this.inRaid            = true;
      this.activeMap         = arena;
      this.player.world      = arena;
      this.actions.world     = arena;
      this.combat.mobManager = this.activeRaid.mobContainer;

      this.player.col = arena.entryCol;
      this.player.row = arena.entryRow;
      this.player.x   = arena.entryCol * TILE_SIZE + 4;
      this.player.y   = arena.entryRow * TILE_SIZE;

      this.camera.setBounds(arena.cols * TILE_SIZE, arena.rows * TILE_SIZE);
      this.camera.snapTo(this.player.cx, this.player.cy);
      this.transitionCooldown = 1.0;
      this.combat.clearTarget();
      this.actions.cancel();
      this.player.actionLocked = false;

      this.activeRaid.startFloor();
      this.notifications.add(
        `Entering ${raidDef.name} — ${diffDef.name}  ·  Floor 1/${raidDef.floors.length}`,
        '#a855f7'
      );
    });
  }

  _exitRaid() {
    const raid = this.activeRaid; // capture now; will be null after callback
    this._beginTransition(() => {
      // Give loot to player inventory (overflow dropped at spawn)
      const spawnCol = Math.floor(1024 / 2);
      const spawnRow = Math.floor(768 / 2) + 5;
      if (raid && raid.loot && raid.loot.length > 0) {
        for (const { item, qty } of raid.loot) {
          if (!this.inventory.isFull() || this.inventory.has(item.id)) {
            this.inventory.add(item, qty);
          } else {
            this.combat.spawnGroundItem(
              item, qty,
              spawnCol * TILE_SIZE + TILE_SIZE / 2,
              spawnRow * TILE_SIZE + TILE_SIZE / 2
            );
          }
        }
        this.notifications.add('Loot added to your inventory!', '#f1c40f');
      }

      // Restore world state
      this.inRaid            = false;
      this.inInterior        = false;
      this.activeMap         = this.world;
      this.player.world      = this.world;
      this.actions.world     = this.world;
      this.combat.mobManager = this.mobManager;
      this.combat.clearTarget();
      this.activeRaid        = null;

      // Return player to spawn
      this.player.col        = spawnCol;
      this.player.row        = spawnRow;
      this.player.x          = spawnCol * TILE_SIZE + 4;
      this.player.y          = spawnRow * TILE_SIZE;
      this.player.path       = [];
      this.player.moving     = false;
      this.player.targetCol  = null;
      this.player.targetRow  = null;

      this.camera.setBounds(); // reset to full world bounds
      this.camera.snapTo(this.player.cx, this.player.cy);
      this.transitionCooldown = 1.0;
    });
  }

  _enterDungeon(dungeonId) {
    const inst = this.dungeons.get(dungeonId);
    if (!inst) return;

    inst.spawnMobs();
    this.returnPos = { col: this.player.col, row: this.player.row };

    this._beginTransition(() => {
      this.inDungeon         = true;
      this.activeDungeon     = inst;
      this.activeMap         = inst.map;
      this.player.world      = inst.map;
      this.actions.world     = inst.map;
      this.combat.mobManager = inst.mobContainer;

      this.player.col        = inst.map.entryCol;
      this.player.row        = inst.map.entryRow;
      this.player.x          = inst.map.entryCol * TILE_SIZE + 4;
      this.player.y          = inst.map.entryRow * TILE_SIZE;
      this.player.targetCol  = null;
      this.player.targetRow  = null;
      this.player.moveT      = 0;
      this.player.moving     = false;
      this.player.path       = [];

      this.camera.setBounds(inst.map.cols * TILE_SIZE, inst.map.rows * TILE_SIZE);
      this.camera.snapTo(this.player.cx, this.player.cy);
      this.transitionCooldown = 1.0;
      this.combat.clearTarget();
      this.actions.cancel();
      this.player.actionLocked = false;
      this.notifications.add(`Entering ${inst.map.name}...`, '#b060e0');
    });
  }

  // ── World Map ────────────────────────────────────────────────────────────

  _buildWorldMapCache() {
    const W = this.world.cols, H = this.world.rows;
    const oc = document.createElement('canvas');
    oc.width = W; oc.height = H;
    const octx = oc.getContext('2d');
    const img = octx.createImageData(W, H);
    const data = img.data;

    // Pre-parse TILE_COLORS hex strings → [r, g, b] lookup
    const colorLookup = new Map();
    for (const [tileIdStr, hex] of Object.entries(TILE_COLORS)) {
      const h = hex.replace('#', '');
      colorLookup.set(+tileIdStr, [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ]);
    }
    const fallback = [0, 0, 0];

    for (let row = 0; row < H; row++) {
      const tileRow = this.world.tiles[row];
      for (let col = 0; col < W; col++) {
        const [r, g, b] = colorLookup.get(tileRow[col]) ?? fallback;
        const i = (row * W + col) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }

    octx.putImageData(img, 0, 0);
    this._worldMapCache = oc;
  }

  _drawWorldMap(ctx) {
    if (!this._worldMapCache) this._buildWorldMapCache();

    const cw = this.canvas.width, ch = this.canvas.height;
    const W = this.world.cols, H = this.world.rows;

    // Darkened full-screen backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, cw, ch);

    // Scale: base = fit-to-88%-screen, multiplied by zoom
    const baseScale = Math.min(cw * 0.88 / W, ch * 0.88 / H);
    const scale = baseScale * this._mapZoom;
    const mw = Math.floor(W * scale), mh = Math.floor(H * scale);
    const mx = Math.floor((cw - mw) / 2 + this._mapPanX);
    const my = Math.floor((ch - mh) / 2 + this._mapPanY);

    // Update cursor (grab/grabbing)
    this.canvas.style.cursor = this._mapDragging ? 'grabbing' : 'grab';

    // Tile image (nearest-neighbour so pixel boundaries stay crisp)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._worldMapCache, mx, my, mw, mh);

    // Gold border
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2;
    ctx.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);

    // ── Structure markers ──────────────────────────────────────────────────
    const STRUCTURE_STYLE = {
      village:    { color: '#5dade2', label: 'Village'    },
      kingdom:    { color: '#f1c40f', label: 'Kingdom'    },
      watchtower: { color: '#aab7b8', label: 'Watchtower' },
      outpost:    { color: '#ec7063', label: 'Outpost'    },
      ruins:      { color: '#7d6608', label: 'Ruins'      },
    };
    ctx.font = 'bold 9px monospace';
    ctx.textBaseline = 'bottom';
    for (const node of STRUCTURE_NODES) {
      const info = STRUCTURE_STYLE[node.type];
      if (!info) continue;
      const dx = mx + node.c * scale, dy = my + node.r * scale;
      const dotR = Math.max(3, scale * 1.8);
      ctx.fillStyle = info.color;
      ctx.beginPath(); ctx.arc(dx, dy, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'center'; ctx.lineWidth = 2;
      ctx.strokeStyle = '#000'; ctx.strokeText(node.id.replace(/_/g, ' '), dx, dy - dotR - 1);
      ctx.fillStyle = info.color; ctx.fillText(node.id.replace(/_/g, ' '), dx, dy - dotR - 1);
    }

    // ── Dungeon entrance markers ───────────────────────────────────────────
    const DUNGEON_STYLE = {
      'dungeon_goblin_cave':   { color: '#a855f7', label: 'Goblin Cave'   },
      'dungeon_spider_den':    { color: '#f97316', label: 'Spider Den'    },
      'dungeon_ancient_mines': { color: '#ef4444', label: 'Ancient Mines' },
    };
    for (const [key, id] of this.world.dungeonMap) {
      const [col, row] = key.split(',').map(Number);
      const info = DUNGEON_STYLE[id]; if (!info) continue;
      const dx = mx + col * scale, dy = my + row * scale;
      const dotR = Math.max(4, scale * 2.5);
      ctx.fillStyle = info.color;
      ctx.beginPath(); ctx.arc(dx, dy, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 2;
      ctx.strokeStyle = '#000'; ctx.strokeText(info.label, dx, dy - dotR - 1);
      ctx.fillStyle = '#fff';   ctx.fillText(info.label, dx, dy - dotR - 1);
    }

    // ── Spawn marker ──────────────────────────────────────────────────────
    const spawnC = Math.floor(W / 2), spawnR = Math.floor(H / 2) + 5;
    const sx = mx + spawnC * scale, sy = my + spawnR * scale;
    const spawnDotR = Math.max(4, scale * 2.5);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath(); ctx.arc(sx, sy, spawnDotR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 2;
    ctx.strokeStyle = '#000'; ctx.strokeText('Spawn', sx, sy - spawnDotR - 1);
    ctx.fillStyle = '#f1c40f'; ctx.fillText('Spawn', sx, sy - spawnDotR - 1);

    // ── Player position (blinking ring + dot) ─────────────────────────────
    const px = mx + this.player.col * scale, py = my + this.player.row * scale;
    const blink = 0.55 + 0.45 * Math.sin(Date.now() / 350);
    const playerDotR = Math.max(3, scale * 2);
    ctx.fillStyle = `rgba(255,255,255,${blink})`;
    ctx.beginPath(); ctx.arc(px, py, playerDotR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${blink})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, playerDotR + 3, 0, Math.PI * 2); ctx.stroke();

    // ── Title ─────────────────────────────────────────────────────────────
    ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('World Map', cw / 2, my - 6);
    ctx.fillStyle = '#c8a040'; ctx.fillText('World Map', cw / 2, my - 6);

    // ── Legend ────────────────────────────────────────────────────────────
    const legend = [
      { color: '#fff',    text: '● You'          },
      { color: '#f1c40f', text: '● Spawn'         },
      { color: '#5dade2', text: '● Village'       },
      { color: '#f1c40f', text: '◆ Kingdom'       },
      { color: '#aab7b8', text: '● Watchtower'    },
      { color: '#a855f7', text: '▼ Goblin Cave'   },
      { color: '#f97316', text: '▼ Spider Den'    },
      { color: '#ef4444', text: '▼ Ancient Mines' },
    ];
    ctx.font = '9px monospace'; ctx.textBaseline = 'top'; ctx.lineWidth = 1.5;
    let lx = mx + 4;
    const ly = my + mh + 4;
    for (const e of legend) {
      ctx.strokeStyle = '#000'; ctx.textAlign = 'left';
      ctx.strokeText(e.text, lx, ly);
      ctx.fillStyle = e.color; ctx.fillText(e.text, lx, ly);
      lx += ctx.measureText(e.text).width + 8;
    }

    // ── Close hint ────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '10px monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('Scroll to zoom  •  Drag to pan  •  [M] / [Esc] to close', mx + mw - 2, my + mh + 4);
  }

  _exitDungeon() {
    this._beginTransition(() => {
      this.inDungeon         = false;
      this.activeDungeon     = null;
      this.activeMap         = this.world;
      this.player.world      = this.world;
      this.actions.world     = this.world;
      this.combat.mobManager = this.mobManager;
      this.combat.clearTarget();
      this.actions.cancel();

      const spawn = this.returnPos ?? { col: Math.floor(1024/2), row: Math.floor(768/2)+5 };
      this.player.col       = spawn.col;
      this.player.row       = spawn.row;
      this.player.x         = spawn.col * TILE_SIZE + 4;
      this.player.y         = spawn.row * TILE_SIZE;
      this.player.targetCol = null;
      this.player.targetRow = null;
      this.player.path      = [];
      this.player.moving    = false;

      this.camera.setBounds();
      this.camera.snapTo(this.player.cx, this.player.cy);
      this.transitionCooldown = 1.0;
      this.player.actionLocked = false;
      this.notifications.add('You emerge from the dungeon.', '#a080c0');
    });
  }

  // ── Raid menu panel ───────────────────────────────────────────────────────

  _raidMenuPanelRect() {
    const PW = 540, PH = 460;
    const px = Math.floor((this.canvas.width  - PW) / 2);
    const py = Math.floor((this.canvas.height - PH) / 2);
    return { px, py, PW, PH };
  }

  _drawRaidMenu(ctx) {
    const { px, py, PW, PH } = this._raidMenuPanelRect();
    const W = this.canvas.width, H = this.canvas.height;
    const r = this.renderer;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(15,8,30,0.97)';
    r._roundRect(ctx, px, py, PW, PH, 8);
    ctx.fill();
    ctx.strokeStyle = '#8b3fc8';
    ctx.lineWidth = 2;
    r._roundRect(ctx, px, py, PW, PH, 8);
    ctx.stroke();

    // Header
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DUNGEON MASTER', px + PW / 2, py + 26);
    ctx.fillStyle = '#777';
    ctx.font = '11px monospace';
    ctx.fillText('Select a raid and difficulty, then press Start', px + PW / 2, py + 44);

    const HEADER_H   = 54;
    const FOOTER_H   = 82;
    const BODY_H     = PH - HEADER_H - FOOTER_H;
    const RAID_COL_W = 202;
    const DIVIDER_X  = px + RAID_COL_W;
    const DIFF_COL_X = DIVIDER_X + 10;
    const bodyY      = py + HEADER_H + 18;

    const raidingLvl  = this.skills.getLevel(SKILL_IDS.RAIDING);
    const diffUnlocked = (diff) => !diff.unlockReq || raidingLvl >= diff.unlockReq.level;

    // Column divider
    ctx.strokeStyle = '#4a1f7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(DIVIDER_X, py + HEADER_H);
    ctx.lineTo(DIVIDER_X, py + HEADER_H + BODY_H);
    ctx.stroke();

    // Column labels
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RAIDS', px + 10, py + HEADER_H + 13);
    ctx.fillText('DIFFICULTY', DIFF_COL_X + 2, py + HEADER_H + 13);

    // ── Raid list ──
    const raidRowH = Math.floor(BODY_H / RAID_DEFS.length);
    for (let i = 0; i < RAID_DEFS.length; i++) {
      const rd  = RAID_DEFS[i];
      const ry  = bodyY + i * raidRowH;
      const sel = this.raidSelectedRaid === i;

      ctx.fillStyle = sel ? 'rgba(168,85,247,0.22)' : (i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent');
      ctx.fillRect(px + 4, ry, RAID_COL_W - 8, raidRowH - 3);
      if (sel) {
        ctx.strokeStyle = '#7b2fbf';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 4, ry, RAID_COL_W - 8, raidRowH - 3);
      }

      ctx.fillStyle = rd.iconColor;
      ctx.beginPath();
      ctx.arc(px + 18, ry + raidRowH / 2, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = sel ? '#e0c8f8' : '#bbb';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(rd.name, px + 32, ry + raidRowH / 2 - 5);
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      ctx.fillText(`${rd.floors.length} floors  Lv.${rd.recLevel}+`, px + 32, ry + raidRowH / 2 + 9);
    }

    // ── Difficulty list ──
    const diffColW  = PW - RAID_COL_W - 10;
    const diffRowH  = Math.floor(BODY_H / RAID_DIFFICULTIES.length);
    for (let i = 0; i < RAID_DIFFICULTIES.length; i++) {
      const diff    = RAID_DIFFICULTIES[i];
      const ry      = bodyY + i * diffRowH;
      const sel     = this.raidSelectedDiff === i;
      const unlocked = diffUnlocked(diff);

      ctx.fillStyle = sel && unlocked ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(DIFF_COL_X - 2, ry, diffColW, diffRowH - 3);
      if (sel && unlocked) {
        ctx.strokeStyle = diff.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(DIFF_COL_X - 2, ry, diffColW, diffRowH - 3);
      }

      ctx.fillStyle = unlocked ? diff.color : '#444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(diff.name, DIFF_COL_X + 6, ry + diffRowH / 2 + 4);

      ctx.font = '10px monospace';
      if (!unlocked) {
        ctx.fillStyle = '#555';
        ctx.fillText(`Requires Raiding ${diff.unlockReq.level}`, DIFF_COL_X + 90, ry + diffRowH / 2 + 4);
      } else {
        ctx.fillStyle = '#777';
        ctx.fillText(`×${diff.xpMult} XP  ×${diff.goldMult} Gold`, DIFF_COL_X + 90, ry + diffRowH / 2 + 4);
      }
    }

    // ── Footer ──
    const footerY  = py + HEADER_H + BODY_H + 10;
    const selRaid  = RAID_DEFS[this.raidSelectedRaid];
    ctx.fillStyle  = '#666';
    ctx.font       = '11px monospace';
    ctx.textAlign  = 'left';
    ctx.fillText(selRaid.description, px + 12, footerY + 14);

    ctx.fillStyle = '#a855f7';
    ctx.font      = '10px monospace';
    ctx.fillText(`Your Raiding level: ${raidingLvl}`, px + 12, footerY + 32);

    const canStart = diffUnlocked(RAID_DIFFICULTIES[this.raidSelectedDiff]);
    const btnW = 124, btnH = 32;
    const btnX = px + PW - btnW - 12;
    const btnY = footerY + 6;
    ctx.fillStyle = canStart ? '#4a1070' : '#251535';
    r._roundRect(ctx, btnX, btnY, btnW, btnH, 5);
    ctx.fill();
    ctx.strokeStyle = canStart ? '#a855f7' : '#3a2050';
    ctx.lineWidth = 1;
    r._roundRect(ctx, btnX, btnY, btnW, btnH, 5);
    ctx.stroke();
    ctx.fillStyle = canStart ? '#dbb8f8' : '#5a4070';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(canStart ? 'Start Raid' : 'Locked', btnX + btnW / 2, btnY + 21);
    ctx.textAlign = 'left';
  }

  _handleRaidMenuClick(sx, sy) {
    const { px, py, PW, PH } = this._raidMenuPanelRect();
    if (sx < px || sx > px + PW || sy < py || sy > py + PH) {
      this.raidMenuOpen = false;
      return;
    }

    const HEADER_H   = 54;
    const FOOTER_H   = 82;
    const BODY_H     = PH - HEADER_H - FOOTER_H;
    const RAID_COL_W = 202;
    const DIVIDER_X  = px + RAID_COL_W;
    const DIFF_COL_X = DIVIDER_X + 10;
    const bodyY      = py + HEADER_H + 18;

    const raidingLvl  = this.skills.getLevel(SKILL_IDS.RAIDING);
    const diffUnlocked = (diff) => !diff.unlockReq || raidingLvl >= diff.unlockReq.level;

    // Raid selection (left column)
    const raidRowH = Math.floor(BODY_H / RAID_DEFS.length);
    if (sx >= px && sx < DIVIDER_X && sy >= bodyY && sy < bodyY + BODY_H) {
      const i = Math.floor((sy - bodyY) / raidRowH);
      if (i >= 0 && i < RAID_DEFS.length) {
        this.raidSelectedRaid = i;
        return;
      }
    }

    // Difficulty selection (right column)
    const diffRowH = Math.floor(BODY_H / RAID_DIFFICULTIES.length);
    if (sx >= DIFF_COL_X && sx < px + PW && sy >= bodyY && sy < bodyY + BODY_H) {
      const i = Math.floor((sy - bodyY) / diffRowH);
      if (i >= 0 && i < RAID_DIFFICULTIES.length) {
        if (diffUnlocked(RAID_DIFFICULTIES[i])) {
          this.raidSelectedDiff = i;
        } else {
          const req = RAID_DIFFICULTIES[i].unlockReq;
          this.notifications.add(`Need Raiding level ${req.level} for ${RAID_DIFFICULTIES[i].name}.`, '#e74c3c');
        }
        return;
      }
    }

    // Start button
    const footerY  = py + HEADER_H + BODY_H + 10;
    const btnW = 124, btnH = 32;
    const btnX = px + PW - btnW - 12;
    const btnY = footerY + 6;
    if (sx >= btnX && sx <= btnX + btnW && sy >= btnY && sy <= btnY + btnH) {
      if (!diffUnlocked(RAID_DIFFICULTIES[this.raidSelectedDiff])) return;
      this.raidMenuOpen = false;
      this._startRaid(this.raidSelectedRaid, this.raidSelectedDiff);
    }
  }

  // ── Raid summary panel ────────────────────────────────────────────────────

  _drawRaidSummary(ctx) {
    const PW = 440, PH = 490;
    const W  = this.canvas.width, H = this.canvas.height;
    const px = Math.floor((W - PW) / 2);
    const py = Math.floor((H - PH) / 2);
    const r  = this.renderer;
    const raid  = this.activeRaid;
    const rank  = raid.getRank();
    const score = raid.getScore();

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(8,12,24,0.97)';
    r._roundRect(ctx, px, py, PW, PH, 8);
    ctx.fill();
    ctx.strokeStyle = rank.color;
    ctx.lineWidth = 2;
    r._roundRect(ctx, px, py, PW, PH, 8);
    ctx.stroke();

    // Header
    ctx.fillStyle = rank.color;
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    const outcome = raid.failed ? 'RAID FAILED' : 'RAID COMPLETE';
    ctx.fillText(`${outcome} — ${rank.label} RANK`, px + PW / 2, py + 28);
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.fillText(`${raid.raidDef.name}  ·  ${raid.diff.name}`, px + PW / 2, py + 46);

    ctx.fillStyle = rank.color;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`Score: ${score}`, px + PW / 2, py + 72);

    // Stats
    const statsY = py + 90;
    const mins   = Math.floor(raid.timer / 60);
    const secs   = Math.floor(raid.timer % 60);
    const stats  = [
      ['Floors Cleared',  `${raid.floorsCleared} / ${raid.totalFloors}`],
      ['Time',            `${mins}m ${secs}s`],
      ['Kills',           String(raid.killCount)],
      ['Damage Taken',    String(Math.round(raid.damageTaken))],
      ['Deaths',          String(raid.deaths)],
      ['Raiding XP',      `+${raid.xpEarned}`],
    ];
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i < stats.length; i++) {
      const sy2 = statsY + i * 22;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px + 8, sy2 - 2, PW - 16, 21);
      }
      ctx.fillStyle = '#777';
      ctx.fillText(stats[i][0], px + 16, sy2 + 14);
      ctx.fillStyle = '#ddd';
      ctx.textAlign = 'right';
      ctx.fillText(stats[i][1], px + PW - 16, sy2 + 14);
      ctx.textAlign = 'left';
    }

    // Loot divider
    const divY = statsY + stats.length * 22 + 10;
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 10, divY);
    ctx.lineTo(px + PW - 10, divY);
    ctx.stroke();

    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LOOT:', px + 16, divY + 18);

    if (!raid.loot || raid.loot.length === 0) {
      ctx.fillStyle = '#444';
      ctx.font = '11px monospace';
      ctx.fillText('Nothing dropped.', px + 60, divY + 18);
    } else {
      const maxShow = Math.min(raid.loot.length, 5);
      for (let i = 0; i < maxShow; i++) {
        const { item, qty } = raid.loot[i];
        ctx.fillStyle = '#ccc';
        ctx.font = '11px monospace';
        ctx.fillText(`• ${item.name}${qty > 1 ? ` ×${qty}` : ''}`, px + 24, divY + 36 + i * 22);
      }
      if (raid.loot.length > 5) {
        ctx.fillStyle = '#555';
        ctx.font = '10px monospace';
        ctx.fillText(`  …and ${raid.loot.length - 5} more`, px + 24, divY + 36 + 5 * 22);
      }
    }

    // Return button
    const btnW = 150, btnH = 34;
    const btnX = px + Math.floor((PW - btnW) / 2);
    const btnY = py + PH - btnH - 14;
    ctx.fillStyle = '#0e2a1a';
    r._roundRect(ctx, btnX, btnY, btnW, btnH, 5);
    ctx.fill();
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 1;
    r._roundRect(ctx, btnX, btnY, btnW, btnH, 5);
    ctx.stroke();
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Return to World', btnX + btnW / 2, btnY + 23);
    ctx.textAlign = 'left';
  }

  _handleRaidSummaryClick(sx, sy) {
    const PW = 440, PH = 490;
    const px = Math.floor((this.canvas.width  - PW) / 2);
    const py = Math.floor((this.canvas.height - PH) / 2);
    const btnW = 150, btnH = 34;
    const btnX = px + Math.floor((PW - btnW) / 2);
    const btnY = py + PH - btnH - 14;
    if (sx >= btnX && sx <= btnX + btnW && sy >= btnY && sy <= btnY + btnH) {
      this._exitRaid();
    }
  }

  // ── Raid floor HUD (top-center banner) ───────────────────────────────────

  _drawRaidFloorHUD(ctx) {
    const raid = this.activeRaid;
    if (!raid) return;
    const W        = this.canvas.width;
    const panW     = 200, panH = 40;
    const panX     = Math.floor((W - panW) / 2);
    const panY     = 12;
    const liveMobs = raid.mobContainer.mobs.filter(m => !m.dead).length;

    ctx.save();
    ctx.fillStyle = 'rgba(15,8,30,0.87)';
    ctx.beginPath();
    ctx.roundRect(panX, panY, panW, panH, 6);
    ctx.fill();
    ctx.strokeStyle = '#8b3fc8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Floor ${raid.currentFloorIdx + 1} / ${raid.totalFloors}`, panX + panW / 2, panY + 16);

    ctx.fillStyle = liveMobs > 0 ? '#e74c3c' : '#27ae60';
    ctx.font = '10px monospace';
    ctx.fillText(
      liveMobs > 0
        ? `${liveMobs} enem${liveMobs === 1 ? 'y' : 'ies'} remaining`
        : raid._floorAdvancing ? 'Next floor incoming...' : 'Floor cleared!',
      panX + panW / 2, panY + 31
    );
    ctx.restore();
  }

  _upsertRemotePlayer(snap) {
    const sx = snap.col * TILE_SIZE + 4;
    const sy = snap.row * TILE_SIZE;
    if (this.remotePlayers.has(snap.id)) {
      // Snap to the reported position (world_state / player_joined — not a movement event)
      const view = this.remotePlayers.get(snap.id);
      view.col    = snap.col;  view.row    = snap.row;
      view.x      = sx;        view.y      = sy;
      view._fromX = sx;        view._fromY = sy;
      view._toX   = sx;        view._toY   = sy;
      view.moveT  = REMOTE_MOVE_TIME; // mark as "arrived"
      view.dir    = snap.dir ?? view.dir;
      if (snap.equipment)                  view.equipment   = snap.equipment;
      if (snap.style)                      view.style       = snap.style;
      if (snap.name)                       view.name        = snap.name;
      if (snap.combatLevel != null)        view.combatLevel = snap.combatLevel;
      if (snap.hp    != null)              view.hp          = snap.hp;
      if (snap.maxHp != null)              view.maxHp       = snap.maxHp;
      return;
    }
    // Create a duck-type object that Player.prototype.draw can render
    const view = {
      id:            snap.id,
      name:          snap.name || snap.username,
      col:           snap.col,
      row:           snap.row,
      x:             sx,
      y:             sy,
      _fromX:        sx,
      _fromY:        sy,
      _toX:          sx,
      _toY:          sy,
      moveT:         REMOTE_MOVE_TIME, // start as "arrived" — no initial lerp
      w:             24,
      h:             32,
      dir:           snap.dir ?? 0,
      moving:        false,
      animFrame:     0,
      animTimer:     0,
      skillAnim:     0,
      actionLocked:  false,
      currentAction: snap.currentAction || 'idle',
      actionTarget:  snap.actionTarget  || null,
      hp:            snap.hp    ?? 10,
      maxHp:         snap.maxHp ?? 10,
      style:         { ...{ hair:'#4a3520',skin:'#deb887',shirt:'#b04040',pants:'#3d3424',hairStyle:'short',shirtStyle:'tunic' }, ...(snap.style || {}) },
      equipment:     { helmet:'none',chestplate:'none',leggings:'none',gloves:'none',boots:'none',cape:'none',weapon:'none', ...(snap.equipment || {}) },
      combatLevel:   snap.combatLevel ?? 1,
      // Player.prototype.draw calls these sub-methods via `this`; add them so
      // the duck-typed view object doesn't throw "is not a function" when another
      // player chops/mines/fishes and the action-tool/rod drawing code is reached.
      _drawActionTool: Player.prototype._drawActionTool,
      _drawFishingRod: Player.prototype._drawFishingRod,
      draw(ctx) { Player.prototype.draw.call(this, ctx); },
    };
    this.remotePlayers.set(snap.id, view);
  }
}
