import {
  TILE_SIZE, TILES, SOLID_TILES,
  SKILL_IDS, ACTION_TIMES, XP_REWARDS, ROCK_RESPAWN_TIME,
} from './constants.js';
import { ITEMS, COOK_RECIPES } from './items.js';
import { FISH_SPECIES, makeFishItem } from './fishing.js';
import { getBiome } from './biomes.js';

// Which tree tile maps to which log item, XP, level requirement, and timing
const TREE_MAP = {
  [TILES.TREE]: {
    item: ITEMS.LOGS,        xp: XP_REWARDS.CHOP,        levelReq: 1,
    chopBase: ACTION_TIMES.CHOP, logsMin: 1, logsMax: 4,
    respawnMin: 15,  respawnMax: 25,  name: 'tree',
  },
  [TILES.OAK_TREE]: {
    item: ITEMS.OAK_LOGS,    xp: XP_REWARDS.CHOP_OAK,    levelReq: 15,
    chopBase: 3.5, logsMin: 1, logsMax: 5,
    respawnMin: 25,  respawnMax: 35,  name: 'oak',
  },
  [TILES.WILLOW_TREE]: {
    item: ITEMS.WILLOW_LOGS, xp: XP_REWARDS.CHOP_WILLOW, levelReq: 30,
    chopBase: 5.0, logsMin: 1, logsMax: 6,
    respawnMin: 35,  respawnMax: 50,  name: 'willow',
  },
  [TILES.MAPLE_TREE]: {
    item: ITEMS.MAPLE_LOGS,  xp: XP_REWARDS.CHOP_MAPLE,  levelReq: 45,
    chopBase: 7.0, logsMin: 1, logsMax: 5,
    respawnMin: 60,  respawnMax: 90,  name: 'maple',
  },
  [TILES.YEW_TREE]: {
    item: ITEMS.YEW_LOGS,    xp: XP_REWARDS.CHOP_YEW,    levelReq: 60,
    chopBase: 10.0, logsMin: 1, logsMax: 5,
    respawnMin: 120, respawnMax: 180, name: 'yew',
  },
  [TILES.MAGIC_TREE]: {
    item: ITEMS.MAGIC_LOGS,  xp: XP_REWARDS.CHOP_MAGIC,  levelReq: 75,
    chopBase: 12.0, logsMin: 1, logsMax: 4,
    respawnMin: 200, respawnMax: 300, name: 'magic',
  },
  [TILES.ELDER_TREE]: {
    item: ITEMS.ELDER_LOGS,  xp: XP_REWARDS.CHOP_ELDER,  levelReq: 90,
    chopBase: 16.0, logsMin: 1, logsMax: 3,
    respawnMin: 500, respawnMax: 700, name: 'elder',
  },
};

// Returns 0=bronze, 1=iron, 2=steel. -1 if no axe.
function getAxeTier(inventory) {
  if (inventory.has('steel_axe')) return 2;
  if (inventory.has('iron_axe'))  return 1;
  if (inventory.has('axe'))       return 0;
  return -1;
}

// Which ore tile maps to which ore item + XP reward + required tool tier
const ORE_MAP = {
  [TILES.ROCK_COPPER]:   { item: ITEMS.ORE_COPPER,   xp: XP_REWARDS.MINE_COPPER,    toolTier: 0, levelReq:  1 },
  [TILES.ROCK_TIN]:      { item: ITEMS.ORE_TIN,      xp: XP_REWARDS.MINE_TIN,       toolTier: 0, levelReq:  1 },
  [TILES.ROCK_IRON]:     { item: ITEMS.ORE_IRON,     xp: XP_REWARDS.MINE_IRON,      toolTier: 0, levelReq: 15 },
  [TILES.ROCK_COAL]:     { item: ITEMS.ORE_COAL,     xp: XP_REWARDS.MINE_COAL,      toolTier: 0, levelReq: 30 },
  [TILES.ROCK_SILVER]:   { item: ITEMS.ORE_SILVER,   xp: XP_REWARDS.MINE_SILVER,    toolTier: 0, levelReq: 20 },
  [TILES.ROCK_GOLD]:     { item: ITEMS.ORE_GOLD,     xp: XP_REWARDS.MINE_GOLD,      toolTier: 0, levelReq: 40 },
  [TILES.ROCK_MITHRIL]:  { item: ITEMS.ORE_MITHRIL,  xp: XP_REWARDS.MINE_MITHRIL,   toolTier: 0, levelReq: 55 },
  [TILES.ROCK_TUNGSTEN]: { item: ITEMS.ORE_TUNGSTEN, xp: XP_REWARDS.MINE_TUNGSTEN,  toolTier: 1, levelReq: 45 },
  [TILES.ROCK_OBSIDIAN]: { item: ITEMS.ORE_OBSIDIAN, xp: XP_REWARDS.MINE_OBSIDIAN,  toolTier: 2, levelReq: 70 },
  [TILES.ROCK_MOONSTONE]:{ item: ITEMS.ORE_MOONSTONE,xp: XP_REWARDS.MINE_MOONSTONE, toolTier: 2, levelReq: 85 },
};

// Forageable overworld resources — no tool required, gives Farming XP
const FORAGE_MAP = {
  [TILES.BERRY_BUSH]: {
    item: ITEMS.BERRIES, qtyMin: 2, qtyMax: 5,
    xp: 12, time: 2.5, respawn: 45,
    label: 'Picking berries...', msg: 'You pick some berries.',
    ground: TILES.DARK_GRASS,
    depletedTile: TILES.BERRY_BUSH_EMPTY,  // bush stays; just loses its berries
  },
  [TILES.MUSHROOM]: {
    item: ITEMS.MUSHROOM, qtyMin: 1, qtyMax: 3,
    xp: 8,  time: 2.0, respawn: 35,
    label: 'Picking mushrooms...', msg: 'You pick some mushrooms.',
    ground: TILES.DARK_GRASS,
  },
  [TILES.WILD_HERB]: {
    item: ITEMS.HERB, qtyMin: 1, qtyMax: 2,
    xp: 15, time: 3.0, respawn: 50,
    label: 'Picking herbs...', msg: 'You pick a grimy herb.',
    ground: TILES.GRASS,
  },
  [TILES.REEDS]: {
    item: ITEMS.REEDS, qtyMin: 2, qtyMax: 5,
    xp: 6,  time: 2.0, respawn: 30,
    label: 'Cutting reeds...', msg: 'You cut some reeds.',
    ground: TILES.GRASS,
  },
  [TILES.FLAX_PLANT]: {
    item: ITEMS.FLAX, qtyMin: 1, qtyMax: 3,
    xp: 10, time: 2.5, respawn: 45,
    label: 'Picking flax...', msg: 'You pick some flax.',
    ground: TILES.GRASS,
  },
  [TILES.SNOWBERRY]: {
    item: ITEMS.SNOWBERRIES, qtyMin: 2, qtyMax: 4,
    xp: 10, time: 2.5, respawn: 55,
    label: 'Picking snowberries...', msg: 'You pick some snowberries.',
    ground: TILES.SNOW,
  },
  [TILES.SULFUR_ROCK]: {
    item: ITEMS.SULFUR, qtyMin: 1, qtyMax: 2,
    xp: 12, time: 3.0, respawn: 65,
    label: 'Chipping sulfur...', msg: 'You chip off some sulfur.',
    ground: TILES.VOLCANIC_ROCK,
  },
  [TILES.THORN_BUSH]: {
    item: ITEMS.THORN_VINE, qtyMin: 1, qtyMax: 3,
    xp: 8,  time: 2.5, respawn: 40,
    label: 'Cutting thorns...', msg: 'You carefully cut a thorn vine.',
    ground: TILES.DEAD_GRASS,
  },
  [TILES.DESERT_FLOWER]: {
    item: ITEMS.CACTUS_BLOOM, qtyMin: 1, qtyMax: 2,
    xp: 14, time: 3.0, respawn: 60,
    label: 'Picking bloom...', msg: 'You pluck a cactus bloom.',
    ground: TILES.SAND_DARK,
  },
};

// Which log type maps to fire XP, lifetime, Firemaking level requirement, and proximity perk
const LOG_MAP = {
  logs:        { xp:  40, fireLifetime:  60, levelReq:  1, perk: null,         name: 'logs' },
  oak_logs:    { xp:  60, fireLifetime: 120, levelReq: 15, perk: 'COOK_SPEED', name: 'oak logs' },
  willow_logs: { xp:  90, fireLifetime: 200, levelReq: 30, perk: 'FISH_SPEED', name: 'willow logs' },
  maple_logs:  { xp: 135, fireLifetime: 360, levelReq: 45, perk: 'NO_BURN',    name: 'maple logs' },
  yew_logs:    { xp: 200, fireLifetime: 480, levelReq: 60, perk: 'DMG_REDUCE', name: 'yew logs' },
  magic_logs:  { xp: 303, fireLifetime: 600, levelReq: 75, perk: 'HP_REGEN',   name: 'magic logs' },
  elder_logs:  { xp: 404, fireLifetime: 900, levelReq: 90, perk: 'XP_BOOST',   name: 'elder logs' },
};
const LOG_PRIORITY = ['elder_logs', 'magic_logs', 'yew_logs', 'maple_logs', 'willow_logs', 'oak_logs', 'logs'];
const _PERK_DESC = {
  COOK_SPEED:  'oak perk: cook 2x faster',
  FISH_SPEED:  'willow perk: fish 40% faster',
  NO_BURN:     'maple perk: food never burns',
  DMG_REDUCE:  'yew perk: 15% less damage taken',
  HP_REGEN:    'magic perk: HP regenerates',
  XP_BOOST:    'elder perk: +10% skill XP',
};

// Returns the best pickaxe tier in inventory: 2=tungsten, 1=steel, 0=any basic
function getPickaxeTier(inventory) {
  if (inventory.has('tungsten_pickaxe')) return 2;
  if (inventory.has('steel_pickaxe') || inventory.has('iron_pickaxe')) return 1;
  if (inventory.has('pickaxe')) return 0;
  return -1;
}



/**
 * Manages timed skill actions with progress bars.
 */
export class Actions {
  constructor(world, player, inventory, skills, notifications) {
    this.world = world;
    this.player = player;
    this.inventory = inventory;
    this.skills = skills;
    this.notif = notifications;

    // Current action state
    this.active = null;  // { type, col, row, timer, duration, label }

    // Fire tracking: { "col,row": { remaining: seconds, logType: string } }
    this.fires = {};

    // Depleted ore tracking: { "col,row": remainingSeconds }
    this.depletedRocks = {};

    // Depleted forageable tracking: { "col,row": { timer, original } }
    this.depletedForageables = {};

    this.fishingRecords = null;
  }

  /* ── Public: attempt an action on the clicked tile ──── */
  tryAction(worldX, worldY) {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    const tile = this.world.getTile(col, row);

    // Must be adjacent (within 2 tiles)
    const pcol = Math.floor(this.player.cx / TILE_SIZE);
    const prow = Math.floor(this.player.cy / TILE_SIZE);
    const dist = Math.abs(pcol - col) + Math.abs(prow - row);
    if (dist > 2) return false;

    // Cancel any current action
    this.active = null;

    // ── Chop tree ────────────────────────────────────
    if (TREE_MAP[tile]) {
      const treeInfo = TREE_MAP[tile];
      const axeTier  = getAxeTier(this.inventory);
      if (axeTier === -1) {
        this.notif.add('You need an axe to chop trees.', '#e74c3c');
        return true;
      }
      const wcLevel = this.skills.getLevel(SKILL_IDS.WOODCUTTING);
      if (wcLevel < treeInfo.levelReq) {
        this.notif.add(`You need Woodcutting level ${treeInfo.levelReq} to chop ${treeInfo.name} trees.`, '#e74c3c');
        return true;
      }
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      // Better axes chop faster: iron=20% faster, steel=40% faster
      const speedMult = [1.0, 0.80, 0.60][axeTier];
      // Level 40 bonus: +1 max log per tree
      const bonusLog = wcLevel >= 40 ? 1 : 0;
      const logsLeft = treeInfo.logsMin + Math.floor(Math.random() * (treeInfo.logsMax - treeInfo.logsMin + 1 + bonusLog));
      this.active = {
        type: 'chop', col, row,
        timer: 0, duration: (treeInfo.chopBase + Math.random() * 2) * speedMult,
        logsLeft,
        originalTile: tile,
        label: `Chopping ${treeInfo.name}...`,
      };
      this.notif.add(`You swing your axe at the ${treeInfo.name} tree.`, '#aaa');
      return true;
    }

    // ── Mine ore ─────────────────────────────────────
    if (ORE_MAP[tile]) {
      const oreInfo   = ORE_MAP[tile];
      const pickTier  = getPickaxeTier(this.inventory);
      if (pickTier === -1) {
        this.notif.add('You need a pickaxe to mine rocks.', '#e74c3c');
        return true;
      }
      const miningLevel = this.skills.getLevel(SKILL_IDS.MINING);
      if (miningLevel < oreInfo.levelReq) {
        this.notif.add(`You need Mining level ${oreInfo.levelReq} to mine ${oreInfo.item.name}.`, '#e74c3c');
        return true;
      }
      if (pickTier < oreInfo.toolTier) {
        const needed = oreInfo.toolTier >= 2 ? 'Tungsten Pickaxe' : 'Steel Pickaxe';
        this.notif.add(`You need a ${needed} to mine this ore.`, '#e74c3c');
        return true;
      }
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      const oreName = ORE_MAP[tile].item.name;
      this.active = {
        type: 'mine', col, row,
        timer: 0, duration: ACTION_TIMES.MINE + Math.random() * 2.5,
        oresLeft: 1 + Math.floor(Math.random() * 3), // 1–3 ores before rock depletes
        label: `Mining ${oreName}...`,
      };
      this.notif.add('You swing your pickaxe at the rock.', '#aaa');
      return true;
    }

    // ── Forage (berry bush, mushroom, wild herb, reeds) ──
    if (FORAGE_MAP[tile]) {
      const info = FORAGE_MAP[tile];
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      this.active = {
        type: 'forage', col, row,
        timer: 0, duration: info.time + Math.random() * 1.0,
        forageTile: tile,
        label: info.label,
      };
      return true;
    }

    // ── Fish ─────────────────────────────────────────
    if (tile === TILES.FISH_SPOT) {
      if (!this.inventory.has('fishing_rod')) {
        this.notif.add('You need a fishing rod to fish.', '#e74c3c');
        return true;
      }
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      const pCol = Math.floor(this.player.cx / TILE_SIZE);
      const pRow = Math.floor(this.player.cy / TILE_SIZE);
      const fishPerks = this.getFirePerks(pCol, pRow);
      const fishMult = fishPerks.has('FISH_SPEED') ? 0.60 : 1.0;
      this.active = {
        type: 'fish', col, row,
        timer: 0, duration: Math.random() * 30 * fishMult,
        label: fishPerks.has('FISH_SPEED') ? 'Fishing... (willow perk)' : 'Fishing...',
      };
      this.notif.add('You cast your line into the water.', '#aaa');
      return true;
    }

    // ── Light fire ───────────────────────────────────
    const lightable = [TILES.STUMP, TILES.GRASS, TILES.DARK_GRASS, TILES.DIRT,
                       TILES.SNOW, TILES.DEAD_GRASS, TILES.SAND];
    if (lightable.includes(tile) && tile !== TILES.FIRE) {
      const logType = LOG_PRIORITY.find(id => this.inventory.has(id));
      if (logType && this.inventory.has('tinderbox')) {
        const logInfo = LOG_MAP[logType];
        const fmLevel = this.skills.getLevel(SKILL_IDS.FIREMAKING);
        if (fmLevel < logInfo.levelReq) {
          this.notif.add(`You need Firemaking level ${logInfo.levelReq} to burn ${logInfo.name}.`, '#e74c3c');
          return true;
        }
        this.active = {
          type: 'light', col, row,
          timer: 0, duration: ACTION_TIMES.LIGHT,
          logType,
          label: `Lighting ${logInfo.name}...`,
        };
        this.notif.add(`You attempt to light a fire with ${logInfo.name}.`, '#aaa');
        return true;
      }
    }

    // ── Cook on fire ─────────────────────────────────
    if (tile === TILES.FIRE) {
      const cookIdx = this.inventory.findCookable(COOK_RECIPES);
      if (cookIdx === -1) {
        this.notif.add('You have nothing to cook.', '#e74c3c');
        return true;
      }
      const rawItem = this.inventory.slots[cookIdx].item;
      const cpCol = Math.floor(this.player.cx / TILE_SIZE);
      const cpRow = Math.floor(this.player.cy / TILE_SIZE);
      const cookPerks = this.getFirePerks(cpCol, cpRow);
      const cookMult = cookPerks.has('COOK_SPEED') ? 0.5 : 1.0;
      this.active = {
        type: 'cook', col, row,
        timer: 0, duration: ACTION_TIMES.COOK * cookMult,
        label: cookPerks.has('COOK_SPEED') ? `Cooking ${rawItem.name}... (oak perk)` : `Cooking ${rawItem.name}...`,
        rawItemId: rawItem.id,
        noBurn: cookPerks.has('NO_BURN'),
      };
      this.notif.add(`You begin cooking ${rawItem.name}.`, '#aaa');
      return true;
    }

    return false;
  }

  /* ── Update: advance action timer ───────────────────── */
  update(dt) {
    // Update fires
    for (const key of Object.keys(this.fires)) {
      this.fires[key].remaining -= dt;
      if (this.fires[key].remaining <= 0) {
        const [c, r] = key.split(',').map(Number);
        this.world.setTile(c, r, TILES.DIRT);
        delete this.fires[key];
        this.world.dirty = true;
      }
    }

    // Update depleted rocks
    for (const key of Object.keys(this.depletedRocks)) {
      this.depletedRocks[key].timer -= dt;
      if (this.depletedRocks[key].timer <= 0) {
        const [c, r] = key.split(',').map(Number);
        this.world.setTile(c, r, this.depletedRocks[key].original);
        delete this.depletedRocks[key];
        this.world.dirty = true;
      }
    }

    // Update depleted forageables
    for (const key of Object.keys(this.depletedForageables)) {
      this.depletedForageables[key].timer -= dt;
      if (this.depletedForageables[key].timer <= 0) {
        const [c, r] = key.split(',').map(Number);
        this.world.setTile(c, r, this.depletedForageables[key].original);
        delete this.depletedForageables[key];
        this.world.dirty = true;
      }
    }

    if (!this.active) return;

    // Check player hasn't moved away
    const pcol = Math.floor(this.player.cx / TILE_SIZE);
    const prow = Math.floor(this.player.cy / TILE_SIZE);
    const dist = Math.abs(pcol - this.active.col) + Math.abs(prow - this.active.row);
    if (dist > 2) {
      this.active = null;
      return;
    }

    this.active.timer += dt;
    if (this.active.timer >= this.active.duration) {
      this._complete();
    }
  }

  /* ── Complete the current action ────────────────────── */
  _complete() {
    const a = this.active;
    this.active = null;

    switch (a.type) {
      case 'chop': {
        const treeInfo = TREE_MAP[a.originalTile ?? TILES.TREE] ?? TREE_MAP[TILES.TREE];
        this.inventory.add(treeInfo.item);
        const res = this._awardXp(SKILL_IDS.WOODCUTTING, treeInfo.xp);
        this.notif.add(`You get some ${treeInfo.item.name.toLowerCase()}. (+${res.awarded} WC XP)`, '#27ae60');
        // Small chance to find a seed while chopping
        if (!this.inventory.isFull()) {
          const tile = a.originalTile ?? TILES.TREE;
          const roll = Math.random();
          let seedFound = null;
          if (tile === TILES.MAPLE_TREE || tile === TILES.YEW_TREE ||
              tile === TILES.MAGIC_TREE || tile === TILES.ELDER_TREE) {
            if (roll < 0.06)       seedFound = ITEMS.MAGIC_SEED;
            else if (roll < 0.12)  seedFound = ITEMS.HERB_SEED;
          } else if (tile === TILES.OAK_TREE || tile === TILES.WILLOW_TREE) {
            if (roll < 0.06)       seedFound = ITEMS.FLAX_SEED;
            else if (roll < 0.12)  seedFound = ITEMS.BERRY_SEED;
            else if (roll < 0.16)  seedFound = ITEMS.HERB_SEED;
          } else {
            if (roll < 0.06)       seedFound = ITEMS.POTATO_SEED;
            else if (roll < 0.10)  seedFound = ITEMS.BERRY_SEED;
          }
          if (seedFound) {
            this.inventory.add(seedFound);
            this.notif.add(`You find a ${seedFound.name} while chopping!`, '#2ecc71');
          }
        }
        if (res.result.leveled) this.notif.add(`🎉 Woodcutting level ${res.result.newLevel}!`, '#f1c40f');
        const logsLeft = (a.logsLeft ?? 1) - 1;
        if (logsLeft > 0 && !this.inventory.isFull()) {
          const axeTier   = getAxeTier(this.inventory);
          const speedMult = [1.0, 0.80, 0.60][axeTier] ?? 1.0;
          this.active = {
            type: 'chop', col: a.col, row: a.row,
            timer: 0, duration: (treeInfo.chopBase + Math.random() * 2) * speedMult,
            logsLeft, originalTile: a.originalTile,
            label: `Chopping ${treeInfo.name}...`,
          };
        } else {
          this.world.setTile(a.col, a.row, TILES.STUMP);
          this.world.dirty = true;
          this.notif.add('The tree falls!', '#27ae60');
          const respawnMs = (treeInfo.respawnMin + Math.random() * (treeInfo.respawnMax - treeInfo.respawnMin)) * 1000;
          setTimeout(() => {
            if (this.world.getTile(a.col, a.row) === TILES.STUMP) {
              this.world.setTile(a.col, a.row, a.originalTile ?? TILES.TREE);
              this.world.dirty = true;
            }
          }, respawnMs);
        }
        break;
      }

      case 'mine': {
        const oreInfo = ORE_MAP[this.world.getTile(a.col, a.row)];
        if (!oreInfo) break;
        this.inventory.add(oreInfo.item);
        const res = this._awardXp(SKILL_IDS.MINING, oreInfo.xp);
        this.notif.add(`You mine some ${oreInfo.item.name}. (+${res.awarded} Mining XP)`, '#95a5a6');
        if (res.result.leveled) this.notif.add(`🎉 Mining level ${res.result.newLevel}!`, '#f1c40f');
        const oresLeft = (a.oresLeft ?? 1) - 1;
        if (oresLeft > 0 && !this.inventory.isFull()) {
          // Rock still has ore — keep mining
          this.active = {
            type: 'mine', col: a.col, row: a.row,
            timer: 0, duration: ACTION_TIMES.MINE + Math.random() * 2.5,
            oresLeft,
            label: `Mining ${oreInfo.item.name}...`,
          };
        } else {
          // Rock depleted
          const originalTile = this.world.getTile(a.col, a.row);
          this.world.setTile(a.col, a.row, TILES.ROCK_DEPLETED);
          this.world.dirty = true;
          this.depletedRocks[`${a.col},${a.row}`] = {
            timer: ROCK_RESPAWN_TIME + Math.random() * 20,
            original: originalTile,
          };
          this.notif.add('The rock is depleted.', '#95a5a6');
        }
        break;
      }

      case 'forage': {
        const info = FORAGE_MAP[a.forageTile];
        if (!info) break;
        const qty = info.qtyMin + Math.floor(Math.random() * (info.qtyMax - info.qtyMin + 1));
        this.inventory.add(info.item, qty);
        const res = this._awardXp(SKILL_IDS.FARMING, info.xp);
        this.notif.add(`${info.msg} (+${res.awarded} Farming XP)`, '#27ae60');
        if (res.result.leveled) this.notif.add(`🎉 Farming level ${res.result.newLevel}!`, '#f1c40f');
        // Deplete — use depletedTile if set (e.g. empty bush), otherwise revert to ground
        this.world.setTile(a.col, a.row, info.depletedTile ?? info.ground);
        this.world.dirty = true;
        this.depletedForageables[`${a.col},${a.row}`] = {
          timer: info.respawn + Math.random() * 15,
          original: a.forageTile,
        };
        break;
      }

      case 'fish': {
        const fishLevel = this.skills.getLevel(SKILL_IDS.FISHING);

        // Determine environment: dungeon maps have ids starting with 'dungeon_'
        const isUnderground = typeof this.world.id === 'string' && this.world.id.startsWith('dungeon_');
        const env = isUnderground ? 'underground' : getBiome(a.col, a.row);

        // Collect eligible species for this biome + level
        const eligible = FISH_SPECIES.filter(
          sp => sp.biomes.includes(env) && fishLevel >= sp.minLevel
        );
        if (eligible.length === 0) {
          this.notif.add('Nothing bites...', '#aaa');
          break;
        }

        // Weighted random selection using each species' rarityWeight
        const total = eligible.reduce((s, sp) => s + sp.rarityWeight, 0);
        let pick = Math.random() * total;
        let chosen = eligible[eligible.length - 1];
        for (const sp of eligible) {
          pick -= sp.rarityWeight;
          if (pick <= 0) { chosen = sp; break; }
        }

        // Random weight within species range (log-normal feel)
        const t      = Math.pow(Math.random(), 1.5);  // skew toward lighter
        const weight = parseFloat((chosen.wMin + t * (chosen.wMax - chosen.wMin)).toFixed(2));

        this.inventory.add(makeFishItem(chosen, weight));
        const res = this._awardXp(SKILL_IDS.FISHING, chosen.xp);
        this.notif.add(
          `You catch a ${chosen.name}! (${weight}kg, +${res.awarded} Fish XP)`,
          '#3498db'
        );
        if (res.result.leveled) this.notif.add(`🎉 Fishing level ${res.result.newLevel}!`, '#f1c40f');

        // Update fishing records
        if (this.fishingRecords) {
          this.fishingRecords.totalCaught += 1;
          this.fishingRecords.totalWeight  = parseFloat(
            (this.fishingRecords.totalWeight + weight).toFixed(2)
          );
          const rec = this.fishingRecords.bySpecies[chosen.id];
          if (rec) {
            rec.count += 1;
            if (weight > rec.heaviest) rec.heaviest = weight;
          }
          const pb = this.fishingRecords.personalBest;
          if (!pb || weight > pb.weight) {
            this.fishingRecords.personalBest = {
              speciesId: chosen.id, name: chosen.name, weight,
            };
          }
        }

        // Roll whether the spot stays or migrates after this catch.
        // Higher rarityWeight (more common) = spot stays longer.
        const stayChance = Math.min(0.85, Math.max(0.15,
          0.15 + (chosen.rarityWeight / 60) * 0.65 + fishLevel * 0.003
        ));
        if (!this.inventory.isFull() && Math.random() < stayChance) {
          // Spot stays — recast with a new random interval
          this.active = {
            type: 'fish', col: a.col, row: a.row,
            timer: 0, duration: Math.random() * 30,
            label: 'Fishing...',
          };
        } else {
          // Spot migrates
          this.world.setTile(a.col, a.row, TILES.WATER);
          this.world.dirty = true;
          this._moveFishSpot(a.col, a.row);
          this.notif.add('The fish scatter — the spot has moved!', '#3498db');
        }
        break;
      }

      case 'light': {
        const logType = a.logType || 'logs';
        const logInfo = LOG_MAP[logType] || LOG_MAP.logs;
        this.inventory.remove(logType, 1);
        this.world.setTile(a.col, a.row, TILES.FIRE);
        this.world.dirty = true;
        this.fires[`${a.col},${a.row}`] = { remaining: logInfo.fireLifetime, logType };
        const xpAmt = logInfo.xp;
        const res = this._awardXp(SKILL_IDS.FIREMAKING, xpAmt);
        const perkNote = logInfo.perk ? ` — ${_PERK_DESC[logInfo.perk]}` : '';
        this.notif.add(`The ${logInfo.name} fire catches! (+${res.awarded} FM XP)${perkNote}`, '#e67e22');
        if (res.result.leveled) this.notif.add(`🎉 Firemaking level ${res.result.newLevel}!`, '#f1c40f');
        break;
      }

      case 'cook': {
        const recipe = COOK_RECIPES[a.rawItemId];
        if (!recipe || !this.inventory.has(a.rawItemId)) break;
        this.inventory.remove(a.rawItemId, 1);
        const cookLvl = this.skills.getLevel(SKILL_IDS.COOKING);
        const burnReduction = cookLvl * 0.02;
        const burnt = a.noBurn ? false : Math.random() < Math.max(0.05, recipe.burnChance - burnReduction);
        if (burnt) {
          this.inventory.add(recipe.burnt);
          this.notif.add('You accidentally burn the fish.', '#e74c3c');
        } else {
          this.inventory.add(recipe.cooked);
          const res = this._awardXp(SKILL_IDS.COOKING, XP_REWARDS.COOK);
          this.notif.add(`You cook the fish perfectly! (+${res.awarded} Cook XP)`, '#e74c3c');
          if (res.result.leveled) this.notif.add(`🎉 Cooking level ${res.result.newLevel}!`, '#f1c40f');
        }
        break;
      }
    }
  }

  /** Progress ratio 0..1 (for drawing the bar) */
  get progress() {
    if (!this.active) return 0;
    return Math.min(1, this.active.timer / this.active.duration);
  }

  get label() {
    return this.active ? this.active.label : '';
  }

  get isActive() {
    return this.active !== null;
  }

  /**
   * Returns a Set of active perk strings from fires within 5 tiles of playerCol/Row.
   * Perk names: COOK_SPEED, FISH_SPEED, NO_BURN, DMG_REDUCE, HP_REGEN, XP_BOOST
   */
  getFirePerks(playerCol, playerRow) {
    const perks = new Set();
    for (const [key, fire] of Object.entries(this.fires)) {
      const logInfo = LOG_MAP[fire.logType];
      if (!logInfo || !logInfo.perk) continue;
      const [fc, fr] = key.split(',').map(Number);
      if (Math.abs(fc - playerCol) + Math.abs(fr - playerRow) <= 5) {
        perks.add(logInfo.perk);
      }
    }
    return perks;
  }

  /**
   * Awards XP, applying the XP_BOOST elder fire perk (+10%) if the player is near one.
   * Returns { result, awarded } where result is the skills.addXp return value.
   */
  _awardXp(skillId, baseXp) {
    const pCol = Math.floor(this.player.cx / TILE_SIZE);
    const pRow = Math.floor(this.player.cy / TILE_SIZE);
    const perks = this.getFirePerks(pCol, pRow);
    const awarded = perks.has('XP_BOOST') ? Math.ceil(baseXp * 1.10) : baseXp;
    const result = this.skills.addXp(skillId, awarded);
    return { result, awarded };
  }

  cancel() {
    this.active = null;
  }

  /* ── Move a fishing spot to a new adjacent-to-walkable water tile ── */
  _moveFishSpot(origCol, origRow) {
    const WATER_TILES = new Set([TILES.WATER, TILES.SWAMP_WATER]);
    const candidates = [];
    const radius = 14;

    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dc === 0 && dr === 0) continue;
        const c = origCol + dc;
        const r = origRow + dr;
        if (c < 1 || c >= this.world.cols - 1 || r < 1 || r >= this.world.rows - 1) continue;
        if (!WATER_TILES.has(this.world.getTile(c, r))) continue;

        // Must be adjacent to at least one non-water, non-solid (walkable) tile
        const adj = [
          this.world.getTile(c - 1, r), this.world.getTile(c + 1, r),
          this.world.getTile(c, r - 1), this.world.getTile(c, r + 1),
        ];
        if (adj.some(t => !WATER_TILES.has(t) && !SOLID_TILES.has(t))) {
          candidates.push({ c, r });
        }
      }
    }

    if (candidates.length === 0) {
      // No valid candidate found — put it back where it was
      this.world.setTile(origCol, origRow, TILES.FISH_SPOT);
      return;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this.world.setTile(pick.c, pick.r, TILES.FISH_SPOT);
    this.world.dirty = true;
  }
}
