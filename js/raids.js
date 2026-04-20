/**
 * raids.js — Raid system data layer.
 *
 * Contains all tunable constants, definitions, and pure functions.
 * No game-state mutation happens here — only data and calculations.
 *
 * ── Tuning cheat-sheet ────────────────────────────────────────────────────
 *   RAID_XP.PER_KILL     — raiding XP = mob.maxHp × PER_KILL × diff.xpMult
 *   RAID_XP.PER_ROOM     — flat XP added when a room is cleared
 *   RAID_XP.COMPLETION   — bonus XP on clearing the final (boss) room
 *   difficulty.hpMult    — scales enemy max HP  (1.0 = baseline)
 *   difficulty.damageMult— scales enemy attack + strength levels
 *   difficulty.countMult — multiplies spawn count per mob room
 *   difficulty.roomCount — total rooms in the dungeon (boss room included)
 *   difficulty.xpMult    — multiplies all raiding XP earned
 *   difficulty.goldMult  — used by loot roller for gold quantity scaling
 *   difficulty.tokenMult — base raid tokens awarded at end
 * ─────────────────────────────────────────────────────────────────────────
 */

import { SKILL_IDS } from './constants.js';
import { ITEMS } from './items.js';

// ── XP formula constants ──────────────────────────────────────────────────────
// Tune these to adjust how fast the raiding skill levels up.
export const RAID_XP = {
  PER_KILL:   5,    // XP per HP of mob max-health (before difficulty mult)
  PER_ROOM:   200,  // flat XP per room cleared
  COMPLETION: 500,  // bonus XP for clearing the boss room
};
// Backwards-compat alias for any external callers.
RAID_XP.PER_FLOOR = RAID_XP.PER_ROOM;

// ── Score / rank thresholds ───────────────────────────────────────────────────
// Score is calculated by calcScore() below.  Higher difficulty xpMult pushes
// the base score up, making S-rank more achievable on harder modes.
export const SCORE_RANKS = [
  { min: 450, label: 'S',      color: '#ffd700' },
  { min: 250, label: 'Gold',   color: '#f1c40f' },
  { min: 100, label: 'Silver', color: '#bdc3c7' },
  { min: 0,   label: 'Bronze', color: '#cd7f32' },
];

/**
 * Compute a numeric raid score from run statistics.
 * Higher score = better rank = better loot.
 *
 * @param {number} floorsCleared
 * @param {number} totalFloors
 * @param {number} timeTaken      seconds elapsed during the run
 * @param {number} damageTaken    cumulative damage the player received
 * @param {number} deaths
 * @param {object} difficultyDef  — must have .xpMult
 */
export function calcScore(roomsCleared, totalRooms, timeTaken, damageTaken, deaths, difficultyDef) {
  let score = 0;
  score += roomsCleared * 50;                              // room progress
  if (roomsCleared >= totalRooms) score += 100;            // full clear bonus
  score += Math.max(0, Math.floor((300 - timeTaken) / 3)); // speed bonus (up to 100)
  score += Math.max(0, 50 - Math.floor(damageTaken));       // low-damage bonus
  score -= deaths * 100;                                    // death penalty
  score  = Math.max(0, Math.round(score * difficultyDef.xpMult));
  return score;
}

/** Returns the SCORE_RANKS entry that applies for the given score. */
export function getRank(score) {
  for (const rank of SCORE_RANKS) {
    if (score >= rank.min) return rank;
  }
  return SCORE_RANKS[SCORE_RANKS.length - 1];
}

// ── Difficulty definitions ────────────────────────────────────────────────────
// unlockReq: null = always available
//            { type: 'skill', skillId, level } = requires that skill level
export const RAID_DIFFICULTIES = [
  {
    id: 'novice', name: 'Novice', color: '#7cb36a',
    unlockReq: null,
    hpMult: 1.0, damageMult: 1.0, countMult: 1.0, roomCount: 3,
    xpMult: 1.0, goldMult: 1.0, tokenMult: 1,
    recLevel: 1,
    description: 'Gentle introduction. 3 rooms.',
  },
  {
    id: 'adept', name: 'Adept', color: '#e8d44d',
    unlockReq: { type: 'skill', skillId: 11 /* RAIDING */, level: 5 },
    hpMult: 1.5, damageMult: 1.3, countMult: 1.2, roomCount: 4,
    xpMult: 2.0, goldMult: 1.8, tokenMult: 2,
    recLevel: 15,
    description: 'Tougher enemies. 4 rooms.',
  },
  {
    id: 'veteran', name: 'Veteran', color: '#e8943b',
    unlockReq: { type: 'skill', skillId: 11 /* RAIDING */, level: 20 },
    hpMult: 2.2, damageMult: 1.8, countMult: 1.5, roomCount: 5,
    xpMult: 3.5, goldMult: 3.0, tokenMult: 4,
    recLevel: 35,
    description: 'Hardened enemies. 5 rooms. Bring good gear.',
  },
  {
    id: 'elite', name: 'Elite', color: '#c050e8',
    unlockReq: { type: 'skill', skillId: 11 /* RAIDING */, level: 45 },
    hpMult: 3.5, damageMult: 2.5, countMult: 2.0, roomCount: 6,
    xpMult: 6.0, goldMult: 5.0, tokenMult: 8,
    recLevel: 60,
    description: 'Only skilled raiders survive. 6 rooms. Rare drops improved.',
  },
  {
    id: 'master', name: 'Master', color: '#e83b3b',
    unlockReq: { type: 'skill', skillId: 11 /* RAIDING */, level: 70 },
    hpMult: 6.0, damageMult: 4.0, countMult: 2.5, roomCount: 7,
    xpMult: 10.0, goldMult: 8.0, tokenMult: 15,
    recLevel: 80,
    description: 'The ultimate challenge. 7 rooms. Top-tier loot exclusively here.',
  },
];

// ── Loot tables ───────────────────────────────────────────────────────────────
// Each entry:
//   item()         — returns the ITEMS reference (lazy to avoid circular deps)
//   chance         — base drop probability (0–1)
//   qty            — amount dropped
//   minDifficulty  — 0=novice … 4=master; entry skipped on lower difficulties
//   rankBonus      — chance multiplier applied when rank is Gold (sqrt) or S (full)
//
// goldMult (from the difficulty def) is passed in as difficultyMult and applied
// to the gold coin qty, giving more gold on harder runs.
export const LOOT_TABLES = {

  // ── Goblin Cave (basic) ───────────────────────────────────────────────────
  basic: [
    { item: () => ITEMS.GOLD_COIN,         chance: 1.0,  qty: 25,  minDifficulty: 0 },
    { item: () => ITEMS.RAID_TOKEN,        chance: 0.8,  qty: 3,   minDifficulty: 0 },
    { item: () => ITEMS.ORE_COAL,          chance: 0.5,  qty: 2,   minDifficulty: 0 },
    { item: () => ITEMS.CHAOS_FRAGMENT,    chance: 0.25, qty: 1,   minDifficulty: 1 },
    { item: () => ITEMS.RAIDERS_HELM,      chance: 0.06, qty: 1,   minDifficulty: 2, rankBonus: 1.5 },
    { item: () => ITEMS.RAID_BLADE,        chance: 0.04, qty: 1,   minDifficulty: 2, rankBonus: 2.0 },
  ],

  // ── Dungeon Depths ────────────────────────────────────────────────────────
  dungeon: [
    { item: () => ITEMS.GOLD_COIN,         chance: 1.0,  qty: 75,  minDifficulty: 0 },
    { item: () => ITEMS.RAID_TOKEN,        chance: 1.0,  qty: 8,   minDifficulty: 0 },
    { item: () => ITEMS.CHAOS_FRAGMENT,    chance: 0.6,  qty: 2,   minDifficulty: 0 },
    { item: () => ITEMS.RAIDERS_HELM,      chance: 0.12, qty: 1,   minDifficulty: 1, rankBonus: 1.5 },
    { item: () => ITEMS.RAIDERS_PLATE,     chance: 0.10, qty: 1,   minDifficulty: 1, rankBonus: 1.5 },
    { item: () => ITEMS.RAIDERS_LEGS,      chance: 0.10, qty: 1,   minDifficulty: 1, rankBonus: 1.5 },
    { item: () => ITEMS.RAID_BLADE,        chance: 0.08, qty: 1,   minDifficulty: 1, rankBonus: 2.0 },
    { item: () => ITEMS.CHAOS_EDGE,        chance: 0.04, qty: 1,   minDifficulty: 2, rankBonus: 2.5 },
    { item: () => ITEMS.VOIDGUARD_HELM,    chance: 0.02, qty: 1,   minDifficulty: 3, rankBonus: 3.0 },
    { item: () => ITEMS.VOIDBANE_SWORD,    chance: 0.01, qty: 1,   minDifficulty: 3, rankBonus: 4.0 },
  ],

  // ── Abyssal Sanctum ───────────────────────────────────────────────────────
  abyss: [
    { item: () => ITEMS.GOLD_COIN,         chance: 1.0,  qty: 200, minDifficulty: 0 },
    { item: () => ITEMS.RAID_TOKEN,        chance: 1.0,  qty: 25,  minDifficulty: 0 },
    { item: () => ITEMS.CHAOS_FRAGMENT,    chance: 1.0,  qty: 5,   minDifficulty: 0 },
    { item: () => ITEMS.RAIDERS_HELM,      chance: 0.25, qty: 1,   minDifficulty: 0, rankBonus: 1.3 },
    { item: () => ITEMS.RAIDERS_PLATE,     chance: 0.25, qty: 1,   minDifficulty: 0, rankBonus: 1.3 },
    { item: () => ITEMS.RAIDERS_GAUNTLETS, chance: 0.25, qty: 1,   minDifficulty: 0, rankBonus: 1.3 },
    { item: () => ITEMS.CHAOS_EDGE,        chance: 0.12, qty: 1,   minDifficulty: 1, rankBonus: 2.0 },
    { item: () => ITEMS.DUNGEON_GREATAXE,  chance: 0.10, qty: 1,   minDifficulty: 1, rankBonus: 2.0 },
    { item: () => ITEMS.VOIDGUARD_HELM,    chance: 0.08, qty: 1,   minDifficulty: 2, rankBonus: 2.5 },
    { item: () => ITEMS.VOIDGUARD_PLATE,   chance: 0.06, qty: 1,   minDifficulty: 2, rankBonus: 2.5 },
    { item: () => ITEMS.VOIDGUARD_LEGS,    chance: 0.05, qty: 1,   minDifficulty: 2, rankBonus: 2.5 },
    { item: () => ITEMS.VOIDGUARD_BOOTS,   chance: 0.05, qty: 1,   minDifficulty: 2, rankBonus: 2.5 },
    { item: () => ITEMS.VOIDBANE_SWORD,    chance: 0.04, qty: 1,   minDifficulty: 3, rankBonus: 3.0 },
  ],
};

/**
 * Roll loot for a completed (or failed) raid.
 *
 * @param {string} tableId         key into LOOT_TABLES
 * @param {number} difficultyIndex 0–4
 * @param {string} rankLabel       'Bronze'|'Silver'|'Gold'|'S'
 * @param {number} goldMult        difficulty.goldMult — scales gold qty
 * @returns {{ item: ItemDef, qty: number }[]}
 */
export function rollLoot(tableId, difficultyIndex, rankLabel, goldMult = 1) {
  const table = LOOT_TABLES[tableId];
  if (!table) return [];

  const isGold = rankLabel === 'Gold' || rankLabel === 'S';
  const isS    = rankLabel === 'S';

  const results = [];
  for (const entry of table) {
    if ((entry.minDifficulty ?? 0) > difficultyIndex) continue;

    let chance = entry.chance;
    if (entry.rankBonus) {
      if (isS)         chance *= entry.rankBonus;
      else if (isGold) chance *= Math.sqrt(entry.rankBonus);
    }

    if (Math.random() >= Math.min(1, chance)) continue;

    const itemDef = entry.item();
    let qty = entry.qty;

    // Scale gold/token quantities by difficulty goldMult for richer rewards
    if (itemDef.id === 'gold_coin' || itemDef.id === 'raid_token') {
      qty = Math.max(1, Math.round(qty * goldMult));
    }

    results.push({ item: itemDef, qty });
  }
  return results;
}

// ── Raid definitions ──────────────────────────────────────────────────────────
// Room-based model: the raid instance generates a sequence of rooms on entry.
// The number of rooms comes from difficulty.roomCount. Every raid ends in a
// boss room. Non-boss rooms are randomised across types weighted by
// `roomTypeWeights` (mob / puzzle / resource).
//
// mobPool       — mob types drawn from for each "mob" room.
// mobsPerRoom   — [min, max] count picked per mob room (before countMult).
// bossType      — the single mob spawned in the final room.
// bossHpMult    — extra HP multiplier on the boss (stacks with difficulty.hpMult).
// roomTypeWeights — { mob, puzzle, resource } integer weights for non-boss rooms.
// resourceLoot  — loot table for a resource room's mid-raid chest.
//
// Mob types available (from mobs.js MOB_DEFS):
//   chicken, cow, sheep, goblin, orc, troll, demon, frog, deer, fox,
//   wolf, bear, rabbit, boar, polar_bear, coyote, scorpion, ice_golem,
//   magma_golem, swamp_stalker, desert_sprite
export const RAID_DEFS = [
  {
    id:          'goblin_warrens',
    name:        'Goblin Warrens',
    description: 'Goblins have dug a warren beneath the hills. Cut through their patrols, outwit their traps, and take down the warchief at the bottom.',
    mobPool:     ['goblin', 'wolf'],
    mobsPerRoom: [3, 5],
    bossType:    'troll',
    bossHpMult:  2.5,
    roomTypeWeights: { mob: 5, puzzle: 2, resource: 2 },
    resourceLoot: [
      { item: () => ITEMS.GOLD_COIN,  chance: 1.0, qty: 15 },
      { item: () => ITEMS.ORE_COAL,   chance: 0.7, qty: 2  },
      { item: () => ITEMS.RAID_TOKEN, chance: 0.5, qty: 1  },
    ],
    lootTable: 'basic',
    iconColor:  '#7cb36a',
    recLevel:   1,
  },
  {
    id:          'dungeon_depths',
    name:        'Dungeon Depths',
    description: 'Ancient chambers teeming with orcs and their warlord. Clear each room.',
    mobPool:     ['goblin', 'orc', 'wolf'],
    mobsPerRoom: [3, 5],
    bossType:    'demon',
    bossHpMult:  3.0,
    roomTypeWeights: { mob: 5, puzzle: 2, resource: 2 },
    resourceLoot: [
      { item: () => ITEMS.GOLD_COIN,  chance: 1.0, qty: 40 },
      { item: () => ITEMS.ORE_COAL,   chance: 0.8, qty: 3  },
      { item: () => ITEMS.RAID_TOKEN, chance: 0.7, qty: 2  },
    ],
    lootTable: 'dungeon',
    iconColor:  '#c87941',
    recLevel:   20,
  },
  {
    id:          'abyssal_sanctum',
    name:        'Abyssal Sanctum',
    description: 'Void demons have broken through to this plane. Purge the sanctum before they spread.',
    mobPool:     ['demon', 'troll', 'orc'],
    mobsPerRoom: [3, 5],
    bossType:    'demon',
    bossHpMult:  4.0,
    roomTypeWeights: { mob: 6, puzzle: 2, resource: 2 },
    resourceLoot: [
      { item: () => ITEMS.GOLD_COIN,       chance: 1.0, qty: 80 },
      { item: () => ITEMS.CHAOS_FRAGMENT,  chance: 0.8, qty: 1  },
      { item: () => ITEMS.RAID_TOKEN,      chance: 0.8, qty: 3  },
    ],
    lootTable: 'abyss',
    iconColor:  '#9b23c8',
    recLevel:   45,
  },
];

/** Pick a room type (non-boss) by weight. */
export function pickRoomType(weights, rand = Math.random) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total   = entries.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [type, w] of entries) {
    r -= w;
    if (r <= 0) return type;
  }
  return entries[0][0];
}

/** Roll simple loot for a resource-room chest (not a full run). */
export function rollResourceLoot(raidDef, goldMult = 1) {
  const results = [];
  for (const entry of raidDef.resourceLoot || []) {
    if (Math.random() >= Math.min(1, entry.chance)) continue;
    const itemDef = entry.item();
    let qty = entry.qty;
    if (itemDef.id === 'gold_coin' || itemDef.id === 'raid_token') {
      qty = Math.max(1, Math.round(qty * goldMult));
    }
    results.push({ item: itemDef, qty });
  }
  return results;
}
