import { SKILL_NAMES, XP_TABLE } from './constants.js';

export class Skills {
  constructor() {
    // XP array indexed by SKILL_IDS
    this.xp = new Array(SKILL_NAMES.length).fill(0);
    this.xpGainQueue = [];
  }

  /** Add XP to a skill. Returns { leveled, newLevel } */
  addXp(skillId, amount) {
    const rounded = Math.round(amount);
    const oldLevel = this.getLevel(skillId);
    const progBefore = this.progressToNext(skillId);
    this.xp[skillId] += rounded;
    const progAfter = this.progressToNext(skillId);
    this.xpGainQueue.push({ skillId, gained: rounded, progBefore, progAfter });
    const newLevel = this.getLevel(skillId);
    return { leveled: newLevel > oldLevel, newLevel };
  }

  /** Current level for a skill (1-99).
   *  XP_TABLE[i] = XP threshold to reach level i+1, so we return i+1 on match. */
  getLevel(skillId) {
    const xp = this.xp[skillId];
    for (let i = XP_TABLE.length - 1; i >= 1; i--) {
      if (xp >= XP_TABLE[i]) return i + 1;
    }
    return 1;
  }

  /** XP needed for next level */
  xpToNext(skillId) {
    const lvl = this.getLevel(skillId);
    if (lvl >= 99) return 0;
    return XP_TABLE[lvl] - this.xp[skillId];
  }

  /** Progress ratio to next level (0..1).
   *  XP_TABLE[lvl-1] = floor XP for current level,
   *  XP_TABLE[lvl]   = floor XP for next level. */
  progressToNext(skillId) {
    const lvl = this.getLevel(skillId);
    if (lvl >= 99) return 1;
    const floorXp = XP_TABLE[lvl - 1];
    const ceilXp  = XP_TABLE[lvl];
    const needed  = ceilXp - floorXp;
    const current = this.xp[skillId] - floorXp;
    return Math.max(0, Math.min(1, needed > 0 ? current / needed : 0));
  }

  /** Total level across all skills */
  get totalLevel() {
    return this.xp.reduce((sum, _, i) => sum + this.getLevel(i), 0);
  }
}
