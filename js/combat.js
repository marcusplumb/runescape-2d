/**
 * RuneScape-like combat system.
 *
 * Attack roll vs Defence roll — both are random values up to a max
 * derived from the attacker's/defender's level. If attack >= defence,
 * a hit occurs and damage is rolled 0..max_hit.
 *
 * XP is awarded in Attack, Strength, Defence (for the player), and
 * Hitpoints (both sides).
 */
import { SKILL_IDS, COMBAT_TICK } from './constants.js';
import { getTotalStats } from './gear.js';

const COMBAT_SIDE_GAP = 6;       // pixels between player and mob
const COMBAT_SLOT_EPSILON = 10;  // how close mob must get to its slot before fighting

export class Combat {
  constructor(player, mobManager, inventory, skills, notifications) {
    this.player       = player;
    this.mobManager   = mobManager;
    this.inventory    = inventory;
    this.skills       = skills;
    this.notif        = notifications;

    // The mob the player is currently attacking (or null)
    this.targetMob    = null;

    // Cooldown timer — counts down to the next auto-attack tick
    this.attackTimer     = 0;
    // Seconds since the player was last in active melee range
    this.combatIdleTimer = 0;
    this.hitSplats = [];

    // Ground items: [{ item, qty, x, y, timer }]
    this.groundItems  = [];

    // Optional callback(mob, damage) fired after each successful hit — used by Game to sync damage to server
    this.onMobDamaged = null;
  }

  /* ── Public: player clicks a mob to initiate combat ──── */
  setTarget(mob) {
    if (mob === this.targetMob) return;

    if (this.targetMob) {
      this._releaseMob(this.targetMob);
    }

    this.targetMob       = mob;
    this.attackTimer     = 0;
    this.combatIdleTimer = 0;

    if (mob) {
      mob.combatSide = this._pickCombatSide(mob);
      this._engageMob(mob);
      this._updateMobCombatDestination(mob);
      this.notif.add(`Attacking ${mob.name}...`, '#e74c3c');
    }
  }

  clearTarget() {
    if (this.targetMob) {
      this._releaseMob(this.targetMob);
    }
    this.targetMob       = null;
    this.attackTimer     = 0;
    this.combatIdleTimer = 0;
  }

  get isInCombat() {
    return this.targetMob !== null && !this.targetMob.dead;
  }

  /* ── Update each frame ───────────────────────────────── */
  update(dt) {
    for (const gi of this.groundItems) gi.timer -= dt;
    this.groundItems = this.groundItems.filter(gi => gi.timer > 0);

    for (const s of this.hitSplats) s.timer += dt;
    this.hitSplats = this.hitSplats.filter(s => s.timer < s.maxTimer);

    if (!this.targetMob) return;

    if (this.targetMob.dead) {
      this._releaseMob(this.targetMob);
      this.targetMob = null;
      return;
    }

    this._engageMob(this.targetMob);
    this._updateMobCombatDestination(this.targetMob);

    // Keep player facing the mob every frame (mob repositions to a side slot)
    const faceX = this.targetMob.cx - this.player.cx;
    const faceY = this.targetMob.cy - this.player.cy;
    if (Math.abs(faceX) >= Math.abs(faceY)) {
      this.player.dir = faceX > 0 ? 2 : 1;  // 2=RIGHT, 1=LEFT
    } else {
      this.player.dir = faceY > 0 ? 0 : 3;  // 0=DOWN, 3=UP
    }

    // Combat idle timeout — disengage after 5 s outside active melee range
    const mobAtSlot = this._isMobAtCombatSlot(this.targetMob);
    const pdx = this.player.cx - this.targetMob.cx;
    const pdy = this.player.cy - this.targetMob.cy;
    const dist = Math.sqrt(pdx * pdx + pdy * pdy) / 32;

    if (mobAtSlot && dist <= 3) {
      this.combatIdleTimer = 0;
    } else {
      this.combatIdleTimer += dt;
      if (this.combatIdleTimer >= 5.0) {
        this.notif.add('You are no longer in combat.', '#aaa');
        this._releaseMob(this.targetMob);
        this.targetMob = null;
        this.player.currentAction = 'idle';
        return;
      }
    }

    if (!mobAtSlot) return;
    if (dist > 3) return;

    this.attackTimer -= dt;
    if (this.attackTimer > 0) return;

    const gear = getTotalStats(this.player.equipment);
    this.attackTimer = COMBAT_TICK * gear.speed;
    this.player.skillAnim = 0;  // sync stab animation to this attack

    // ── Player attacks mob ────────────────────────────────
    const atkLvl = this.skills.getLevel(SKILL_IDS.ATTACK);
    const strLvl = this.skills.getLevel(SKILL_IDS.STRENGTH);
    const hit    = _rollHit(atkLvl, this.targetMob.defenceLevel, gear.accuracy, 0);

    if (hit) {
      const damage = _rollDamage(strLvl, gear.power, gear.critChance);
      const killed = this.targetMob.takeDamage(damage);
      if (this.onMobDamaged && damage > 0) this.onMobDamaged(this.targetMob, damage);

      this.hitSplats.push({
        wx: this.targetMob.x + this.targetMob.w / 2,
        wy: this.targetMob.y + this.targetMob.h * 0.25,
        value: damage,
        isPlayer: false,
        timer: 0,
        maxTimer: 1.5,
      });

      if (damage > 0) {
        this.notif.add(`You hit ${this.targetMob.name} for ${damage}.`, '#e74c3c');
      } else {
        this.notif.add(`You miss ${this.targetMob.name}.`, '#aaa');
      }

      const combatXp = damage * 4;
      if (combatXp > 0) {
        const atkRes = this.skills.addXp(SKILL_IDS.ATTACK, combatXp);
        const strRes = this.skills.addXp(SKILL_IDS.STRENGTH, combatXp);
        const hpRes  = this.skills.addXp(SKILL_IDS.HITPOINTS, Math.floor(combatXp / 3));

        if (atkRes.leveled) this.notif.add(`🎉 Attack level ${atkRes.newLevel}!`, '#f1c40f');
        if (strRes.leveled) this.notif.add(`🎉 Strength level ${strRes.newLevel}!`, '#f1c40f');
        if (hpRes.leveled)  this.notif.add(`🎉 Hitpoints level ${hpRes.newLevel}!`, '#f1c40f');
      }

      if (killed) {
        const deadMob = this.targetMob;
        this._handleMobDeath(deadMob);
        this.targetMob = null;
      }
    } else {
      this.hitSplats.push({
        wx: this.targetMob.x + this.targetMob.w / 2,
        wy: this.targetMob.y + this.targetMob.h * 0.25,
        value: 0,
        isPlayer: false,
        timer: 0,
        maxTimer: 1.5,
      });
      this.notif.add(`You miss ${this.targetMob.name}.`, '#aaa');
    }

    // ── Mob attacks player ────────────────────────────────
    if (this.targetMob && !this.targetMob.dead) {
      const mobHit = _rollHit(
        this.targetMob.attackLevel,
        this.skills.getLevel(SKILL_IDS.DEFENCE),
        0, gear.armour
      );

      if (mobHit) {
        const mobDmg = _rollDamage(this.targetMob.strengthLevel);
        if (mobDmg > 0) {
          this.player.hp = Math.max(0, this.player.hp - mobDmg);
          this.hitSplats.push({
            wx: this.player.x + (this.player.w ?? 24) / 2,
            wy: this.player.y + (this.player.h ?? 32) * 0.25,
            value: mobDmg,
            isPlayer: true,
            timer: 0,
            maxTimer: 1.5,
          });
          this.notif.add(`${this.targetMob.name} hits you for ${mobDmg}!`, '#e74c3c');

          const defXp = mobDmg * 4;
          const defRes = this.skills.addXp(SKILL_IDS.DEFENCE, defXp);
          if (defRes.leveled) {
            this.notif.add(`🎉 Defence level ${defRes.newLevel}!`, '#f1c40f');
          }
        }
      }
    }

    if (this.player.hp <= 0) {
      this.notif.add('You have been defeated! Respawning...', '#e74c3c');
      this._respawnPlayer();
    }
  }

  _pickCombatSide(mob) {
    if (mob.cx < this.player.cx) return 'left';
    if (mob.cx > this.player.cx) return 'right';
    return Math.random() < 0.5 ? 'left' : 'right';
  }

  _getMobCombatSlot(mob) {
    const playerW = this.player.w ?? 24;
    const playerH = this.player.h ?? 32;
    const side = mob.combatSide || this._pickCombatSide(mob);

    let x;
    if (side === 'left') {
      x = this.player.x - mob.w - COMBAT_SIDE_GAP;
    } else {
      x = this.player.x + playerW + COMBAT_SIDE_GAP;
    }

    const y = this.player.y + (playerH - mob.h) / 2;
    return { x, y, side };
  }

  _updateMobCombatDestination(mob) {
    if (!mob) return;

    const slot = this._getMobCombatSlot(mob);
    mob.combatSide = slot.side;
    mob.combatSlotX = slot.x;
    mob.combatSlotY = slot.y;

    // Let the mob walk there naturally
    mob.targetX = slot.x;
    mob.targetY = slot.y;

    if (slot.side === 'left') {
      mob.facingLeft = false;
    } else {
      mob.facingLeft = true;
    }

    if (Array.isArray(mob.path)) mob.path = [];
    if ('targetCol' in mob) mob.targetCol = null;
    if ('targetRow' in mob) mob.targetRow = null;
  }

  _isMobAtCombatSlot(mob) {
    if (!mob) return false;
    if (typeof mob.combatSlotX !== 'number' || typeof mob.combatSlotY !== 'number') return false;

    const dx = mob.combatSlotX - mob.x;
    const dy = mob.combatSlotY - mob.y;
    return Math.sqrt(dx * dx + dy * dy) <= COMBAT_SLOT_EPSILON;
  }

  _engageMob(mob) {
    if (!mob) return;
    mob.inCombat = true;
    mob.combatTarget = this.player;

    if (!mob.combatSide) {
      mob.combatSide = this._pickCombatSide(mob);
    }
  }

  _releaseMob(mob) {
    if (!mob) return;
    mob.inCombat = false;
    mob.combatTarget = null;
    mob.combatSide = null;
    mob.combatSlotX = null;
    mob.combatSlotY = null;
  }

  _handleMobDeath(mob) {
    mob.dead = true;
    mob.respawnTimer = 45 + Math.random() * 15;
    this._releaseMob(mob);
    this.notif.add(`You defeated the ${mob.name}!`, '#27ae60');

    for (const drop of mob.drops) {
      if (Math.random() <= drop.chance) {
        // Always drop to the ground — player walks over to pick up
        this.spawnGroundItem(drop.item, drop.qty, mob.x + mob.w / 2, mob.y + mob.h);
      }
    }
  }

  spawnGroundItem(item, qty, x, y) {
    // Scatter slightly so stacked drops don't overlap
    const ox = (Math.random() - 0.5) * 20;
    const oy = (Math.random() - 0.5) * 20;
    this.groundItems.push({ item, qty, x: x + ox, y: y + oy, timer: 120 });
  }

  _respawnPlayer() {
    if (this.targetMob) {
      this._releaseMob(this.targetMob);
    }

    this.targetMob = null;

    this.player.hp = this.player.maxHp;

    const spawnCol = Math.floor(1024 / 2);
    const spawnRow = Math.floor(768 / 2) + 5;
    this.player.col = spawnCol;
    this.player.row = spawnRow;
    this.player.x   = spawnCol * 32 + 4;
    this.player.y   = spawnRow * 32;
    this.player.path = [];
    this.player.moving = false;
    this.player.targetCol = null;
    this.player.targetRow = null;
  }

  tryPickup(playerX, playerY) {
    const range = 40;
    for (let i = 0; i < this.groundItems.length; i++) {
      const gi = this.groundItems[i];
      const dx = gi.x - playerX;
      const dy = gi.y - playerY;

      if (dx * dx + dy * dy < range * range) {
        const added = this.inventory.add(gi.item, gi.qty);
        if (added) {
          this.groundItems.splice(i, 1);
          this.notif.add(`Picked up ${gi.item.name}.`, '#f1c40f');
          return true;
        }

        this.notif.add('Inventory is full!', '#e74c3c');
        return false;
      }
    }
    return false;
  }
}

function _rollHit(attackLevel, defenceLevel, accuracy = 0, armour = 0) {
  const atkRoll = Math.floor(Math.random() * (attackLevel * 2 + accuracy + 8));
  const defRoll = Math.floor(Math.random() * (defenceLevel * 2 + armour  + 8));
  return atkRoll >= defRoll;
}

function _rollDamage(strengthLevel, power = 0, critChance = 0) {
  const maxHit = Math.max(1, Math.floor(strengthLevel * 0.5 + power * 0.3 + 1));
  let damage = Math.floor(Math.random() * (maxHit + 1));
  if (critChance > 0 && Math.random() < critChance) {
    damage = Math.max(1, Math.floor(damage * 1.5));
  }
  return damage;
}