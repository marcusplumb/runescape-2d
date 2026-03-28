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
import { GEAR_BY_ID, meetsRequirements } from './gear.js';
import { MobManager } from './mobs.js';
import { Combat } from './combat.js';
import { ShopKeeper, SHOP_STOCK, SELL_PRICES, SHOP_PW, SHOP_HEADER_H, SHOP_TAB_H, SHOP_ROW_H, SHOP_PH,
  HouseShopKeeper, HOUSE_SHOP_STOCK, HOUSE_SHOP_PW, HOUSE_SHOP_PH, HOUSE_SHOP_HEADER_H, HOUSE_SHOP_ROW_H,
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
import { STRUCTURE_NODES } from './structures.js';
import { ARMOR_OPTIONS, EQUIPMENT_SLOTS, SLOT_LABELS } from './equipment.js';
import { getBiome } from './biomes.js';
import {
  TILE_SIZE, PLAYER_SPEED, TILES,
  INV_COLS, INV_ROWS, INV_CELL, INV_PAD, SKILL_IDS,
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
  SMELT_PH, SMITH_PH, SMELT_RECIPE_COUNT,
} from './forge.js';

const TILE_TOOLTIPS = {
  [TILES.TREE]:              'Tree — click to chop (need Axe)',
  [TILES.FISH_SPOT]:         'Fishing spot — click to fish (need Rod)',
  [TILES.FISH_SPOT_SALMON]:  'Salmon spot — click to fish (need Rod)',
  [TILES.FISH_SPOT_LOBSTER]: 'Lobster spot — click to fish (need Rod)',
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
  [TILES.FURNACE]:           'Furnace — smelt ores into bars',
  [TILES.ANVIL]:             'Anvil — smith bars into equipment',
};

// Reverse lookup: item id string → item definition object
const ITEM_BY_ID = new Map(Object.values(ITEMS).map(item => [item.id, item]));

export class Game {
  constructor(canvas, savedState = null, token = null, username = null) {
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
    this.mobManager   = new MobManager(this.world);
    this.shopKeeper      = new ShopKeeper();
    this.makoverNpc      = new MakoverNPC();
    this.fishermanNpc    = new FishermanNPC();
    this.fishermanOpen   = false;
    this.fishermanTab    = 'guide';
    this.fishingRecords  = makeFishingRecords();
    this.actions.fishingRecords = this.fishingRecords;
    this.combat          = new Combat(
      this.player, this.mobManager, this.inventory,
      this.skills, this.notifications
    );
    this.pendingInteract = null; // { type, col, row, worldX?, worldY? }
    this.clickDest       = null; // { col, row } — shown as click marker, null for WASD

    // Interior / map transition system
    this.inInterior       = false;
    this.activeMap        = this.world;
    this.interiors        = buildAllInteriors(this.world.doorMap);
    this.interiors.set('player_house', buildPlayerHouse());
    this.returnPos        = null;   // { col, row } to return to in world
    this.fadeAlpha        = 0;
    this.fadingOut        = false;
    this._fadeCallback    = null;
    this.transitionCooldown = 0;

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

    // Multiplayer network connection
    this.network       = token ? new Network(token) : null;
    this.remotePlayers = new Map(); // socketId → remote player view
    if (this.network) {
      this._setupNetworkHandlers();
      this.network.onForceLogout(({ reason }) => {
        this.notifications.add(`Logged out: ${reason}`, '#e74c3c');
        setTimeout(() => this._logout(), 1500);
      });
    }

    // Auto-save every 30 s + on page unload
    if (token) {
      this._saveToken    = token;
      this._saveUsername = username;
      setInterval(() => this._saveToServer(), 30_000);
      window.addEventListener('beforeunload', () => this._saveToServer());
    }

    // Idle auto-logout: 3 min idle → logout; warn at 2m30s
    this._idleTimeout  = 3 * 60;  // seconds
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
    this.houseShopOpen = false;
    this.houseShopKeeper = new HouseShopKeeper();
    this.placingFurniture = null; // { item, slotIndex } when in furniture placement mode
    this.placingRotation  = 0;   // 0-3 (×90°) — cycled with R
    this.makoverOpen   = false;
    this.forgeOpen     = false;  // smelting panel (Furnace)
    this.smithOpen     = false;  // smithing panel (Anvil)
    this.smithTab      = 'weapons'; // 'weapons' | 'tools' | 'armor'
    this.playerViewOpen = false; // character stat popup (from Worn tab)
    this.smeltingAction = null;  // { recipe, progress, duration } — animated smelting
    this.showAdminTp   = false;
    this.adminEquipOpen  = false;
    this.equipPanelOpen  = false;   // worn-items panel
    this.contextMenu     = null;    // { x, y, invSlot, options:[{label,cb}] }

    // Mouse screen pos for tooltip + drag
    this.mouseScreen = { x: 0, y: 0 };
    this.dragSlot    = -1;

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      this.mouseScreen.x = e.clientX - rect.left;
      this.mouseScreen.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      if (this.sidePanelTab !== 'inventory') return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const idx = this._getInventorySlotAt(sx, sy);
      if (idx !== -1 && this.inventory.slots[idx] !== null) {
        this.dragSlot = idx;
      }
    });

    window.addEventListener('mouseup', e => {
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

    canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.sidePanelTab !== 'inventory') return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
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
    const loop = (now) => {
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
      this.draw();
      this.input.endFrame();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
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

    // Panel toggles
    if (this.input.wasJustPressed('KeyI')) {
      this.sidePanelTab = 'inventory';
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
    if (this.input.wasJustPressed('KeyG')) {
      this.adminEquipOpen = !this.adminEquipOpen;
    }
    if (this.input.wasJustPressed('KeyR') && this.placingFurniture) {
      this.placingRotation = (this.placingRotation + 1) & 3;
    }
    // Escape closes panels / cancels action / drops combat
    if (this.input.wasJustPressed('Escape')) {
      if (this.contextMenu) {
        this.contextMenu = null;
      } else if (this.adminEquipOpen) {
        this.adminEquipOpen = false;
      } else if (this.showAdminTp) {
        this.showAdminTp = false;
      } else if (this.placingFurniture) {
        this.placingFurniture = null;
        this.notifications.add('Placement cancelled.', '#aaa');
      } else if (this.playerViewOpen) {
        this.playerViewOpen = false;
      } else if (this.forgeOpen) {
        this.forgeOpen = false;
      } else if (this.smithOpen) {
        this.smithOpen = false;
      } else if (this.houseShopOpen) {
        this.houseShopOpen = false;
      } else if (this.shopOpen) {
        this.shopOpen = false;
      } else if (this.makoverOpen) {
        this.makoverOpen = false;
      } else if (this.fishermanOpen) {
        this.fishermanOpen = false;
      } else if (this.combat.isInCombat) {
        this.combat.clearTarget();
        this.notifications.add('You stop fighting.', '#aaa');
      } else if (this.actions.isActive) {
        this.actions.cancel();
        this.player.actionLocked = false;
        this.pendingInteract = null;
        this.notifications.add('Action cancelled.', '#aaa');
      }
    }

    const dir = this.input.getDirection();
    const click = this.input.consumeClick();

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
      if (this.contextMenu) {
        this._handleContextMenuClick(click.screenX, click.screenY);
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
      } else if (this.houseShopOpen) {
        this._handleHouseShopClick(click.screenX, click.screenY);
      } else if (this.shopOpen) {
        this._handleShopClick(click.screenX, click.screenY);
      } else if (this.makoverOpen) {
        this._handleMakeoverClick(click.screenX, click.screenY);
      } else if (this.fishermanOpen) {
        this._handleFishermanClick(click.screenX, click.screenY);
        return;
      } else if (this._clickOnSidePanel(click.screenX, click.screenY)) {
        // handled
      } else if (!this._clickOnUI(click.screenX, click.screenY)) {
        // Cancel any running skill action when clicking in the world
        if (this.player.actionLocked) {
          this.actions.cancel();
          this.player.actionLocked = false;
          this.notifications.add('Action cancelled.', '#aaa');
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
        } else if (!this.inInterior && this.shopKeeper.containsWorld(worldPos.x, worldPos.y)) {
          // Walk to shopkeeper then open shop
          const skCol = Math.floor((this.shopKeeper.x + this.shopKeeper.w / 2) / TILE_SIZE);
          const skRow = Math.floor((this.shopKeeper.y + this.shopKeeper.h / 2) / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.world, skCol, skRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.world, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'shop', col: skCol, row: skRow };
            this.clickDest = { col: skCol, row: skRow };
          }
        } else if (!this.inInterior && this.makoverNpc.containsWorld(worldPos.x, worldPos.y)) {
          // Walk to Makeover NPC
          const moCol = Math.floor(this.makoverNpc.cx / TILE_SIZE);
          const moRow = Math.floor(this.makoverNpc.cy / TILE_SIZE);
          const adj   = nearestWalkableAdjacent(this.world, moCol, moRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.world, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'makeover', col: moCol, row: moRow };
            this.clickDest = { col: moCol, row: moRow };
          }
        } else if (!this.inInterior && this.fishermanNpc.containsWorld(worldPos.x, worldPos.y)) {
          const fnCol = Math.floor((this.fishermanNpc.x + this.fishermanNpc.w / 2) / TILE_SIZE);
          const fnRow = Math.floor((this.fishermanNpc.y + this.fishermanNpc.h / 2) / TILE_SIZE);
          const adj = nearestWalkableAdjacent(this.world, fnCol, fnRow, this.player.col, this.player.row);
          if (adj) {
            this.player.setPath(findPath(this.world, this.player.col, this.player.row, adj.col, adj.row));
            this.pendingInteract = { type: 'fisherman', col: fnCol, row: fnRow };
            this.clickDest = { col: fnCol, row: fnRow };
          }
        } else if (!this.inInterior) {
          // ── World only: mob clicks & interactable tiles ──
          const clickedMob = this.mobManager.getMobAt(worldPos.x, worldPos.y);
          if (clickedMob) {
            const mobCol = Math.floor(clickedMob.cx / TILE_SIZE);
            const mobRow = Math.floor(clickedMob.cy / TILE_SIZE);
            const adj = nearestWalkableAdjacent(this.world, mobCol, mobRow, this.player.col, this.player.row);
            if (adj) {
              this.player.setPath(findPath(this.world, this.player.col, this.player.row, adj.col, adj.row));
              this.pendingInteract = { type: 'combat', mob: clickedMob };
              this.clickDest = { col: mobCol, row: mobRow };
            } else {
              this.combat.setTarget(clickedMob);
            }
          } else if (TILE_TOOLTIPS[this.world.getTile(clickCol, clickRow)] !== undefined
                     && this.world.getTile(clickCol, clickRow) !== TILES.ROCK_DEPLETED) {
            const solid = this.world.isSolid(clickCol, clickRow);
            const target = solid
              ? nearestWalkableAdjacent(this.world, clickCol, clickRow, this.player.col, this.player.row)
              : { col: clickCol, row: clickRow };
            if (target) {
              this.player.setPath(findPath(this.world, this.player.col, this.player.row, target.col, target.row));
              this.pendingInteract = { type: 'action', col: clickCol, row: clickRow, worldX: worldPos.x, worldY: worldPos.y };
              this.clickDest = { col: clickCol, row: clickRow };
            }
          } else {
            this.player.setPath(findPath(this.world, this.player.col, this.player.row, clickCol, clickRow));
            this.clickDest = { col: clickCol, row: clickRow };
          }
        } else {
          // ── Interior: plain walk only ────────────────────
          this.player.setPath(findPath(this.activeMap, this.player.col, this.player.row, clickCol, clickRow));
          this.clickDest = { col: clickCol, row: clickRow };
        }
      }
    }

    // Update player movement
    const result = this.player.update(dt, dir);

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
      this.notifications.add('Action cancelled.', '#aaa');
    }

    // Keep local player's combat level up to date (cheap: 4 array lookups)
    this.player.combatLevel = Math.max(1, Math.floor(
      (this.skills.getLevel(SKILL_IDS.ATTACK)    + this.skills.getLevel(SKILL_IDS.STRENGTH) +
       this.skills.getLevel(SKILL_IDS.DEFENCE)   + this.skills.getLevel(SKILL_IDS.HITPOINTS)) / 4
    ));

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
    }

    // Interior transition triggers
    if (this.transitionCooldown <= 0) {
      const tile = this.activeMap.getTile(this.player.col, this.player.row);
      if (!this.inInterior && tile === TILES.PORTAL) {
        this._beginTransition(() => this._enterInterior('player_house'));
      } else if (!this.inInterior && tile === TILES.DOOR) {
        const key = `${this.player.col},${this.player.row}`;
        const intId = this.world.doorMap.get(key);
        if (intId && this.interiors.has(intId)) {
          this._beginTransition(() => this._enterInterior(intId));
        }
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
      } else if (pi.type === 'shop') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) this.shopOpen = true;
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
      } else if (pi.type === 'action') {
        const dist = Math.abs(this.player.col - pi.col) + Math.abs(this.player.row - pi.row);
        if (dist <= 2) {
          // Intercept furnace / anvil before regular action handler
          const tileAtTarget = this.world.getTile(pi.col, pi.row);
          if (tileAtTarget === TILES.FURNACE) {
            this.forgeOpen = true;
            return;
          } else if (tileAtTarget === TILES.ANVIL) {
            this.smithOpen = true;
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
            if (t === TILES.TREE)
              this.player.currentAction = 'chop';
            else if (t === TILES.FISH_SPOT || t === TILES.FISH_SPOT_SALMON || t === TILES.FISH_SPOT_LOBSTER)
              this.player.currentAction = 'fish';
            else if (t === TILES.ROCK_COPPER || t === TILES.ROCK_TIN || t === TILES.ROCK_IRON ||
                     t === TILES.ROCK_COAL   || t === TILES.ROCK_SILVER || t === TILES.ROCK_GOLD ||
                     t === TILES.ROCK_MITHRIL || t === TILES.ROCK_TUNGSTEN ||
                     t === TILES.ROCK_OBSIDIAN || t === TILES.ROCK_MOONSTONE)
              this.player.currentAction = 'mine';
            else if (t === TILES.FIRE)
              this.player.currentAction = 'cook';
            else
              this.player.currentAction = 'idle';
          }
        }
      } else if (pi.type === 'combat') {
        // Start attacking the mob now that we're close
        if (!pi.mob.dead) {
          this.combat.setTarget(pi.mob);
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
      }
    }

    // Update systems
    this.actions.update(dt);
    this.combat.update(dt);

    // Consume XP gain events from skills queue
    // Smelting action tick
    if (this.smeltingAction) {
      this.smeltingAction.progress += dt / this.smeltingAction.duration;
      if (this.smeltingAction.progress >= 1) {
        const { recipe } = this.smeltingAction;
        this.inventory.add(recipe.output(), 1);
        this.skills.addXp(SKILL_IDS.FORGERY, recipe.xp);
        this.notifications.add(`Smelted ${recipe.name}! (+${recipe.xp} Forgery XP)`, '#ff8c42');
        this.smeltingAction = null;
      }
    }

    for (const ev of this.skills.xpGainQueue) {
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

    this.camera.follow(this.player.cx, this.player.cy, dt);
    this.notifications.update(dt);
    this.mobManager.update(dt, this.world, this.player);
  }

  draw() {
    const ctx = this.renderer.ctx;
    this.renderer.clear();
    this.renderer.setTime(this.elapsed);

    // World-space
    this.camera.begin(ctx);
      this.renderer.drawWorld(this.activeMap, this.camera.x, this.camera.y);

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
        const treeSortables = [];
        for (let tr = sr; tr <= er; tr++) {
          for (let tc = sc; tc <= ec; tc++) {
            if (this.activeMap.getTile(tc, tr) === TILES.TREE) {
              const tpx = tc * TILE_SIZE, tpy = tr * TILE_SIZE;
              const seed = {
                s1: (tc * 7  + tr * 13) % 17,
                s2: (tc * 11 + tr * 7)  % 19,
                s3: (tc * 13 + tr * 11) % 23,
                s4: (tc * 17 + tr * 5)  % 29,
              };
              const biome = getBiome(tc, tr);
              treeSortables.push({
                y: tpy - TREE_OVERHANG,
                h: TILE_SIZE + TREE_OVERHANG, // y+h = tpy + TILE_SIZE = tile bottom
                draw: (ctx) => this.renderer.drawTreeSprite(ctx, tpx, tpy, seed, biome),
              });
            }
          }
        }

        // Draw entities sorted by Y (painter's algorithm)
        const remoteViews = [...this.remotePlayers.values()];
        const entities = [this.player, ...remoteViews, ...this.mobManager.mobs, this.shopKeeper, this.makoverNpc, this.fishermanNpc, ...treeSortables];
        entities.sort((a, b) => (a.y + a.h) - (b.y + b.h));
        for (const e of entities) e.draw(ctx);

        // Combat target highlight
        if (this.combat.targetMob && !this.combat.targetMob.dead) {
          this.renderer.drawCombatTarget(this.combat.targetMob);
        }

        // Hit splats (world-space, drawn after all entities)
        this._drawHitSplats(ctx, this.combat.hitSplats);
      } else {
        // Interior: draw player + any interior-specific NPCs
        if (this.activeMap.id === 'player_house') {
          const entities = [this.player, this.houseShopKeeper];
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
      }
    this.camera.end(ctx);

    // Screen-space UI
    if (!this.inInterior) {
      this.renderer.drawCircleMinimap(this.world, this.player);
    }
    this.renderer.drawHUD(this.player, this.fps, this.xpFlashes);
    if (this.actions.active?.type !== 'fish') this.renderer.drawActionBar(this.actions);
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
    if (this.forgeOpen) {
      this.renderer.drawSmeltPanel(SMELT_RECIPES, this.inventory, this.skills);
    }
    if (this.smithOpen) {
      this.renderer.drawSmithPanel(SMITH_RECIPES, this.smithTab, this.inventory, this.skills);
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
      this.renderer.drawShopPanel(this.shopTab, SHOP_STOCK, this.inventory);
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
      } else if (this.makoverNpc.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Makeover Mage — click to customise your character';
      } else if (this.fishermanNpc.containsWorld(worldPos.x, worldPos.y)) {
        tooltip = 'Fisherman — click to trade & view records';
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
            tooltip = TILE_TOOLTIPS[this.world.getTile(hoverCol, hoverRow)] || null;
          }
        }
      }
    }

    this.renderer.drawTileTooltip(tooltip, this.mouseScreen.x, this.mouseScreen.y);

    // Logout button (bottom-right, only when logged in)
    if (this._saveToken) this._drawLogoutButton(ctx);

    // Notifications
    this.notifications.drawMessages(ctx, this.canvas.height);
    this.notifications.drawXpDrops(ctx);

    if (this.inInterior) {
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

  _clickOnUI(sx, sy) {
    if (this.contextMenu)    return true;
    if (this.adminEquipOpen) return true;
    if (this.showAdminTp)    return true;
    if (this.playerViewOpen) return true;
    if (this.forgeOpen)      return true;
    if (this.smithOpen)      return true;
    if (this.shopOpen)       return true;
    if (this.houseShopOpen)  return true;
    if (this.makoverOpen)    return true;
    if (this.fishermanOpen)  return true;
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
    const btnX = px + FORGE_PW - 70;
    if (sx < btnX) return;
    // Validate and start animated smelting (do NOT use _tryForgeRecipe)
    const recipe = SMELT_RECIPES[row];
    const forgeLevel = this.skills.getLevel(SKILL_IDS.FORGERY);
    if (forgeLevel < recipe.level) {
      this.notifications.add(`Need Forgery level ${recipe.level} to smelt ${recipe.name}.`, '#e74c3c');
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
    // Consume ingredients immediately, then start action
    for (const { item, qty } of recipe.inputs) {
      this.inventory.remove(item().id, qty);
    }
    this.forgeOpen = false;
    const duration = 2.5 + recipe.level / 20;
    this.smeltingAction = { recipe, progress: 0, duration };
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
      if      (sx < px + tabW)     this.smithTab = 'weapons';
      else if (sx < px + tabW * 2) this.smithTab = 'tools';
      else                         this.smithTab = 'armor';
      return;
    }
    const contentY = tabY + FORGE_TAB_H;
    if (sy < contentY) return;
    const row = Math.floor((sy - contentY) / FORGE_ROW_H);
    const recipes = SMITH_RECIPES[this.smithTab];
    if (row < 0 || row >= recipes.length) return;
    const btnX = px + FORGE_PW - 70;
    if (sx < btnX) return;
    this._tryForgeRecipe(recipes[row]);
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

  _handleShopClick(sx, sy) {
    const px = Math.floor((this.canvas.width  - SHOP_PW) / 2);
    const py = Math.floor((this.canvas.height - SHOP_PH) / 2);
    if (sx < px || sx > px + SHOP_PW || sy < py || sy > py + SHOP_PH) {
      this.shopOpen = false;
      return;
    }
    const tabY = py + SHOP_HEADER_H;
    const tabW = Math.floor(SHOP_PW / 2) - 8;
    if (sy >= tabY && sy <= tabY + SHOP_TAB_H) {
      if (sx >= px + 4 && sx <= px + 4 + tabW) this.shopTab = 'buy';
      else if (sx >= px + SHOP_PW / 2 + 4)     this.shopTab = 'sell';
      return;
    }
    const contentY = tabY + SHOP_TAB_H;
    if (sy < contentY) return;
    const row = Math.floor((sy - contentY) / SHOP_ROW_H);
    const btnX = px + SHOP_PW - 64;
    if (sx < btnX) return;
    if (this.shopTab === 'buy') {
      if (row < SHOP_STOCK.length) this._buyItem(SHOP_STOCK[row]);
    } else {
      const sellable = this._getSellableSlots();
      if (row < sellable.length) this._sellItem(sellable[row]);
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
    const row    = Math.floor((sy - contentY) / FISH_ROW_H);
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

    const fishLevel = this.skills.getLevel(SKILL_IDS.FISHING);

    // ── Tab content ───────────────────────────────────────
    if (this.fishermanTab === 'guide') {
      for (let i = 0; i < FISH_SPECIES.length; i++) {
        const sp  = FISH_SPECIES[i];
        const ry  = contentY + i * FISH_ROW_H;
        const rec = this.fishingRecords.bySpecies[sp.id];
        const unlocked = fishLevel >= sp.minLevel;

        // Row alt shading
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(px + 4, ry, FISH_PW - 8, FISH_ROW_H - 1);
        }

        // Fish colour swatch
        ctx.fillStyle = unlocked ? sp.color : '#333';
        ctx.fillRect(px + 10, ry + 8, 24, 24);
        ctx.strokeStyle = '#2a4a6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 10, ry + 8, 24, 24);

        // Name + rarity
        ctx.fillStyle = unlocked ? '#ddd' : '#555';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(sp.name, px + 42, ry + 19);
        ctx.fillStyle = unlocked ? '#3498db' : '#444';
        ctx.font = '10px monospace';
        ctx.fillText(sp.rarity, px + 42, ry + 33);

        // Level requirement
        ctx.fillStyle = unlocked ? '#27ae60' : '#c0392b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${sp.minLevel}`, px + 155, ry + 22);

        // Weight range
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(`${sp.wMin}–${sp.wMax}kg`, px + 220, ry + 22);

        // XP
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`${sp.xp} XP`, px + 295, ry + 22);

        // Personal best
        const pb = rec && rec.heaviest > 0 ? `PB: ${rec.heaviest}kg` : '—';
        ctx.fillStyle = rec && rec.heaviest > 0 ? '#27ae60' : '#444';
        ctx.fillText(pb, px + 370, ry + 22);

        // Catch count
        const cnt = rec ? rec.count : 0;
        ctx.fillStyle = cnt > 0 ? '#3498db' : '#333';
        ctx.textAlign = 'right';
        ctx.fillText(`×${cnt}`, px + FISH_PW - 12, ry + 22);
      }
    } else if (this.fishermanTab === 'records') {
      const rec = this.fishingRecords;
      let ry = contentY + 12;
      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Your Fishing Records', px + 16, ry);
      ry += 28;

      const stats = [
        ['Total Caught',       `${rec.totalCaught} fish`],
        ['Total Weight',       `${rec.totalWeight.toFixed(1)} kg`],
        ['Personal Best',      rec.personalBest
          ? `${rec.personalBest.name} — ${rec.personalBest.weight}kg`
          : 'None yet'],
        ['Fishing Level',      `${fishLevel}`],
      ];
      for (const [label, value] of stats) {
        ctx.fillStyle = '#666';
        ctx.font = '11px monospace';
        ctx.fillText(label, px + 16, ry);
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(value, px + FISH_PW - 16, ry);
        ctx.textAlign = 'left';
        ry += 24;
      }

      // Per-species table
      ry += 8;
      ctx.strokeStyle = '#1a4060';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px+8, ry); ctx.lineTo(px+FISH_PW-8, ry); ctx.stroke();
      ry += 14;
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Species', px + 16, ry);
      ctx.textAlign = 'center';
      ctx.fillText('Caught', px + 260, ry);
      ctx.fillText('Heaviest', px + 380, ry);
      ctx.textAlign = 'left';
      ry += 14;

      for (const sp of FISH_SPECIES) {
        const srec = rec.bySpecies[sp.id] || { count: 0, heaviest: 0 };
        ctx.fillStyle = srec.count > 0 ? '#ccc' : '#444';
        ctx.font = '10px monospace';
        ctx.fillText(sp.name, px + 16, ry);
        ctx.textAlign = 'center';
        ctx.fillText(srec.count > 0 ? String(srec.count) : '—', px + 260, ry);
        ctx.fillText(srec.heaviest > 0 ? `${srec.heaviest}kg` : '—', px + 380, ry);
        ctx.textAlign = 'left';
        ry += 20;
      }
    } else if (this.fishermanTab === 'buy') {
      for (let i = 0; i < FISH_SHOP_STOCK.length; i++) {
        const entry = FISH_SHOP_STOCK[i];
        const ry2   = contentY + i * FISH_ROW_H;
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
        const btnW = 56, btnX2 = px + FISH_PW - btnW - 8;
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
      const sellable = this._getFishSellableSlots();
      if (sellable.length === 0) {
        ctx.fillStyle = '#555';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No fish to sell', px + FISH_PW / 2, contentY + FISH_ROW_H);
      } else {
        for (let i = 0; i < Math.min(sellable.length, 9); i++) {
          const slot  = sellable[i];
          const price = FISH_SELL_PRICES[slot.item.id] ?? 0;
          const ry3   = contentY + i * FISH_ROW_H;
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
          const btnW = 56, btnX3 = px + FISH_PW - btnW - 8;
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

  _adminTpPanelRect() {
    const ROW_H = 28;
    const PW = 240;
    const PH = 36 + STRUCTURE_NODES.length * ROW_H + 8;
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
      village: '#27ae60', kingdom: '#e74c3c', watchtower: '#e67e22',
      outpost: '#9b59b6', ruins: '#95a5a6',
    };

    STRUCTURE_NODES.forEach((node, i) => {
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
    const idx = Math.floor((sy - listY) / ROW_H);
    if (idx < 0 || idx >= STRUCTURE_NODES.length) return;

    const node = STRUCTURE_NODES[idx];
    this.player.col = node.c;
    this.player.row = node.r;
    this.player.x   = node.c * TILE_SIZE + 4;
    this.player.y   = node.r * TILE_SIZE;
    this.player.path    = [];
    this.player.moving  = false;
    this.player.targetCol = null;
    this.player.targetRow = null;
    this.camera.snapTo(this.player.cx, this.player.cy);
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
      this.notifications.add(`You use the ${item.name}.`, '#aaa');
      this.contextMenu = null;
    }});
    opts.push({ label: `Drop ${item.name}`, cb: () => this._dropItem(invSlot) });

    return { x: sx, y: sy, invSlot, options: opts };
  }

  _eatItem(invSlot) {
    const slot = this.inventory.slots[invSlot];
    if (!slot || !slot.item.heal) return;
    if (this.player.hp >= this.player.maxHp) {
      this.notifications.add('You are already at full health.', '#aaa');
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
    this.notifications.add(`You drop the ${slot.item.name}.`, '#aaa');
    this.contextMenu = null;
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
    this.notifications.add(`Equipped ${slot.item.name}.`, '#aaa');
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
    if (item) this.notifications.add(`Unequipped ${item.name}.`, '#aaa');
    this._saveToServer();
    if (this.network) this.network.sendEquip(this.player.equipment, this.player.style, this.player.name, this.player.combatLevel);
  }

  _handleContextMenuClick(sx, sy) {
    const m = this.contextMenu;
    if (!m) return;
    const optH = 26, menuW = 170;
    const mx = m.x, my = m.y;
    let hit = false;
    m.options.forEach((opt, i) => {
      const oy = my + i * optH;
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
    this.player.col = interior.entryCol;
    this.player.row = interior.entryRow;
    this.player.x   = interior.entryCol * 32 + 4;
    this.player.y   = interior.entryRow * 32;

    // Snap camera to interior (small map — centre it)
    this.camera.snapTo(this.player.cx, this.player.cy);

    this.transitionCooldown = 1.0;
    this.combat.clearTarget();
    this.actions.cancel();
    this.player.actionLocked = false;
  }

  _exitToWorld() {
    // Switch back to world map
    this.inInterior    = false;
    this.activeMap     = this.world;
    this.player.world  = this.world;
    this.actions.world = this.world;

    // Return to saved position (one tile south of door)
    const rc = this.returnPos ?? { col: Math.floor(1024 / 2), row: Math.floor(768 / 2) + 6 };
    this.player.col = rc.col;
    this.player.row = rc.row;
    this.player.x   = rc.col * 32 + 4;
    this.player.y   = rc.row * 32;

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
    const house = this.interiors.get('player_house');
    const save = {
      col:       this.player.col,
      row:       this.player.row,
      hp:        this.player.hp,
      maxHp:     this.player.maxHp,
      name:      this.player.name,
      style:     { ...this.player.style },
      equipment: { ...this.player.equipment },
      inventory: inv,
      skills:    [...this.skills.xp],
    };
    if (house) {
      save.houseTiles     = btoa(String.fromCharCode(...house._tiles));
      save.houseRotations = btoa(String.fromCharCode(...house._rotations));
    }
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

    // Player house tiles
    const house = this.interiors.get('player_house');
    if (house && save.houseTiles) {
      try {
        const tiles = Uint8Array.from(atob(save.houseTiles),     c => c.charCodeAt(0));
        const rots  = Uint8Array.from(atob(save.houseRotations), c => c.charCodeAt(0));
        house._tiles.set(tiles.subarray(0, house._tiles.length));
        house._rotations.set(rots.subarray(0, house._rotations.length));
      } catch { /* ignore corrupt data */ }
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
    this._saveToServer();
    if (this.network) this.network.disconnect();
    localStorage.removeItem('rw_token');
    localStorage.removeItem('rw_username');
    // Small delay so the save beacon can fire before reload
    setTimeout(() => location.reload(), 300);
  }

  _saveToServer() {
    if (!this._saveToken) return;
    const body = JSON.stringify(this._serializeState());
    // Use sendBeacon if available (works on page unload); fall back to fetch
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(`/save?token=${encodeURIComponent(this._saveToken)}`, blob);
    } else {
      fetch('/save', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this._saveToken}`,
        },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  }

  // ── Multiplayer ──────────────────────────────────────────────────────────

  _setupNetworkHandlers() {
    const net = this.network;

    net.on('world_state', (players) => {
      for (const snap of players) this._upsertRemotePlayer(snap);
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

    net.on('player_left', ({ id }) => {
      const view = this.remotePlayers.get(id);
      if (view) {
        this.notifications.add(`${view.name} left.`, '#888');
        this.remotePlayers.delete(id);
      }
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
      if (snap.equipment) view.equipment = snap.equipment;
      if (snap.style)     view.style     = snap.style;
      if (snap.name)      view.name      = snap.name;
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
      currentAction: 'idle',
      hp:            10,
      maxHp:         10,
      style:         { ...{ hair:'#4a3520',skin:'#deb887',shirt:'#b04040',pants:'#3d3424',hairStyle:'short',shirtStyle:'tunic' }, ...(snap.style || {}) },
      equipment:     { helmet:'none',chestplate:'none',leggings:'none',gloves:'none',boots:'none',cape:'none',weapon:'none', ...(snap.equipment || {}) },
      combatLevel:   snap.combatLevel || 1,
      draw(ctx) { Player.prototype.draw.call(this, ctx); },
    };
    this.remotePlayers.set(snap.id, view);
  }
}
