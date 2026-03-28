import {
  TILE_SIZE, TILES, SOLID_TILES,
  SKILL_IDS, ACTION_TIMES, XP_REWARDS, FIRE_LIFETIME, ROCK_RESPAWN_TIME,
} from './constants.js';
import { ITEMS, COOK_RECIPES } from './items.js';
import { FISH_SPECIES, makeFishItem } from './fishing.js';

// Which ore tile maps to which ore item + XP reward + required tool tier
const ORE_MAP = {
  [TILES.ROCK_COPPER]:   { item: ITEMS.ORE_COPPER,   xp: XP_REWARDS.MINE_COPPER,    toolTier: 0 },
  [TILES.ROCK_TIN]:      { item: ITEMS.ORE_TIN,      xp: XP_REWARDS.MINE_TIN,       toolTier: 0 },
  [TILES.ROCK_IRON]:     { item: ITEMS.ORE_IRON,     xp: XP_REWARDS.MINE_IRON,      toolTier: 0 },
  [TILES.ROCK_COAL]:     { item: ITEMS.ORE_COAL,     xp: XP_REWARDS.MINE_COAL,      toolTier: 0 },
  [TILES.ROCK_SILVER]:   { item: ITEMS.ORE_SILVER,   xp: XP_REWARDS.MINE_SILVER,    toolTier: 0 },
  [TILES.ROCK_GOLD]:     { item: ITEMS.ORE_GOLD,     xp: XP_REWARDS.MINE_GOLD,      toolTier: 0 },
  [TILES.ROCK_MITHRIL]:  { item: ITEMS.ORE_MITHRIL,  xp: XP_REWARDS.MINE_MITHRIL,   toolTier: 0 },
  [TILES.ROCK_TUNGSTEN]: { item: ITEMS.ORE_TUNGSTEN, xp: XP_REWARDS.MINE_TUNGSTEN,  toolTier: 1 },
  [TILES.ROCK_OBSIDIAN]: { item: ITEMS.ORE_OBSIDIAN, xp: XP_REWARDS.MINE_OBSIDIAN,  toolTier: 2 },
  [TILES.ROCK_MOONSTONE]:{ item: ITEMS.ORE_MOONSTONE,xp: XP_REWARDS.MINE_MOONSTONE, toolTier: 2 },
};

// Returns the best pickaxe tier in inventory: 2=tungsten, 1=steel, 0=any basic
function getPickaxeTier(inventory) {
  if (inventory.has('tungsten_pickaxe')) return 2;
  if (inventory.has('steel_pickaxe') || inventory.has('iron_pickaxe')) return 1;
  if (inventory.has('pickaxe')) return 0;
  return -1;
}

function hasAnyAxe(inventory) {
  return inventory.has('axe') || inventory.has('iron_axe') || inventory.has('steel_axe');
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

    // Fire tracking: { "col,row": remainingSeconds }
    this.fires = {};

    // Depleted ore tracking: { "col,row": remainingSeconds }
    this.depletedRocks = {};

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
    if (tile === TILES.TREE) {
      if (!hasAnyAxe(this.inventory)) {
        this.notif.add('You need an axe to chop trees.', '#e74c3c');
        return true;
      }
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      this.active = {
        type: 'chop', col, row,
        timer: 0, duration: ACTION_TIMES.CHOP + Math.random() * 2,
        logsLeft: 1 + Math.floor(Math.random() * 4), // 1–4 logs before tree falls
        label: 'Chopping...',
      };
      this.notif.add('You swing your axe at the tree.', '#aaa');
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

    // ── Fish ─────────────────────────────────────────
    const fishSpotTiles = [TILES.FISH_SPOT, TILES.FISH_SPOT_SALMON, TILES.FISH_SPOT_LOBSTER];
    if (fishSpotTiles.includes(tile)) {
      if (!this.inventory.has('fishing_rod')) {
        this.notif.add('You need a fishing rod to fish.', '#e74c3c');
        return true;
      }
      if (this.inventory.isFull()) {
        this.notif.add('Your inventory is full.', '#e74c3c');
        return true;
      }
      this.active = {
        type: 'fish', col, row,
        timer: 0, duration: Math.random() * 30,
        label: 'Fishing...',
      };
      this.notif.add('You cast your line into the water.', '#aaa');
      return true;
    }

    // ── Light fire ───────────────────────────────────
    const lightable = [TILES.STUMP, TILES.GRASS, TILES.DARK_GRASS, TILES.DIRT,
                       TILES.SNOW, TILES.DEAD_GRASS, TILES.SAND];
    if (lightable.includes(tile) && tile !== TILES.FIRE) {
      if (this.inventory.has('logs') && this.inventory.has('tinderbox')) {
        this.active = {
          type: 'light', col, row,
          timer: 0, duration: ACTION_TIMES.LIGHT,
          label: 'Lighting fire...',
        };
        this.notif.add('You attempt to light a fire.', '#aaa');
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
      this.active = {
        type: 'cook', col, row,
        timer: 0, duration: ACTION_TIMES.COOK,
        label: `Cooking ${rawItem.name}...`,
        rawItemId: rawItem.id,
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
      this.fires[key] -= dt;
      if (this.fires[key] <= 0) {
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
        this.inventory.add(ITEMS.LOGS);
        const res = this.skills.addXp(SKILL_IDS.WOODCUTTING, XP_REWARDS.CHOP);
        this.notif.add(`You get some logs. (+${XP_REWARDS.CHOP} WC XP)`, '#27ae60');
        if (res.leveled) this.notif.add(`🎉 Woodcutting level ${res.newLevel}!`, '#f1c40f');
        const logsLeft = (a.logsLeft ?? 1) - 1;
        if (logsLeft > 0 && !this.inventory.isFull()) {
          // Tree still has logs — keep chopping
          this.active = {
            type: 'chop', col: a.col, row: a.row,
            timer: 0, duration: ACTION_TIMES.CHOP + Math.random() * 2,
            logsLeft,
            label: 'Chopping...',
          };
        } else {
          // Tree exhausted — turn to stump and respawn later
          this.world.setTile(a.col, a.row, TILES.STUMP);
          this.world.dirty = true;
          this.notif.add('The tree falls!', '#27ae60');
          setTimeout(() => {
            if (this.world.getTile(a.col, a.row) === TILES.STUMP) {
              this.world.setTile(a.col, a.row, TILES.TREE);
              this.world.dirty = true;
            }
          }, (15 + Math.random() * 10) * 1000);
        }
        break;
      }

      case 'mine': {
        const oreInfo = ORE_MAP[this.world.getTile(a.col, a.row)];
        if (!oreInfo) break;
        this.inventory.add(oreInfo.item);
        const res = this.skills.addXp(SKILL_IDS.MINING, oreInfo.xp);
        this.notif.add(`You mine some ${oreInfo.item.name}. (+${oreInfo.xp} Mining XP)`, '#95a5a6');
        if (res.leveled) this.notif.add(`🎉 Mining level ${res.newLevel}!`, '#f1c40f');
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

      case 'fish': {
        const fishLevel  = this.skills.getLevel(SKILL_IDS.FISHING);
        const spotTile   = this.world.getTile(a.col, a.row);

        // Collect eligible species for this spot + level
        const eligible = FISH_SPECIES.filter(
          sp => sp.spots.includes(spotTile) && fishLevel >= sp.minLevel
        );
        if (eligible.length === 0) {
          this.notif.add('Nothing bites...', '#aaa');
          break;
        }

        // Weight-biased random selection: higher-level (rarer) fish less likely
        const weights = eligible.map((_, i) => Math.max(1, eligible.length - i));
        const total   = weights.reduce((s, w) => s + w, 0);
        let pick = Math.random() * total, chosen = eligible[0];
        for (let i = 0; i < eligible.length; i++) {
          pick -= weights[i];
          if (pick <= 0) { chosen = eligible[i]; break; }
        }

        // Random weight within species range (log-normal feel)
        const t      = Math.pow(Math.random(), 1.5);  // skew toward lighter
        const weight = parseFloat((chosen.wMin + t * (chosen.wMax - chosen.wMin)).toFixed(2));

        this.inventory.add(makeFishItem(chosen, weight));
        const res = this.skills.addXp(SKILL_IDS.FISHING, chosen.xp);
        this.notif.add(
          `You catch a ${chosen.name}! (${weight}kg, +${chosen.xp} Fish XP)`,
          '#3498db'
        );
        if (res.leveled) this.notif.add(`🎉 Fishing level ${res.newLevel}!`, '#f1c40f');

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
        // Common fish (low minLevel) stay longer; rarer fish scatter sooner.
        // Better fishing level gives a small bonus to staying.
        const stayChance = Math.min(0.85, Math.max(0.1,
          0.7 - (chosen.minLevel / 76) * 0.6 + fishLevel * 0.003
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
          const spotType = this.world.getTile(a.col, a.row);
          this.world.setTile(a.col, a.row, TILES.WATER);
          this.world.dirty = true;
          this._moveFishSpot(a.col, a.row, spotType);
          this.notif.add('The fish scatter — the spot has moved!', '#3498db');
        }
        break;
      }

      case 'light': {
        this.inventory.remove('logs', 1);
        this.world.setTile(a.col, a.row, TILES.FIRE);
        this.world.dirty = true;
        this.fires[`${a.col},${a.row}`] = FIRE_LIFETIME;
        const res = this.skills.addXp(SKILL_IDS.FIREMAKING, XP_REWARDS.LIGHT);
        this.notif.add(`The fire catches! (+${XP_REWARDS.LIGHT} FM XP)`, '#e67e22');
        if (res.leveled) this.notif.add(`🎉 Firemaking level ${res.newLevel}!`, '#f1c40f');
        break;
      }

      case 'cook': {
        const recipe = COOK_RECIPES[a.rawItemId];
        if (!recipe || !this.inventory.has(a.rawItemId)) break;
        this.inventory.remove(a.rawItemId, 1);
        const cookLvl = this.skills.getLevel(SKILL_IDS.COOKING);
        const burnReduction = cookLvl * 0.02;
        const burnt = Math.random() < Math.max(0.05, recipe.burnChance - burnReduction);
        if (burnt) {
          this.inventory.add(recipe.burnt);
          this.notif.add('You accidentally burn the fish.', '#e74c3c');
        } else {
          this.inventory.add(recipe.cooked);
          const res = this.skills.addXp(SKILL_IDS.COOKING, XP_REWARDS.COOK);
          this.notif.add(`You cook the fish perfectly! (+${XP_REWARDS.COOK} Cook XP)`, '#e74c3c');
          if (res.leveled) this.notif.add(`🎉 Cooking level ${res.newLevel}!`, '#f1c40f');
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

  cancel() {
    this.active = null;
  }

  /* ── Move a fishing spot to a new adjacent-to-walkable water tile ── */
  _moveFishSpot(origCol, origRow, spotType) {
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
      this.world.setTile(origCol, origRow, spotType);
      return;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    this.world.setTile(pick.c, pick.r, spotType);
    this.world.dirty = true;
  }
}
