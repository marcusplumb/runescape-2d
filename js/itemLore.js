/**
 * itemLore.js — Build the tooltip payload for any inventory item.
 *
 * Returns a normalised `{ name, rarity, description, extras }` structure.
 *   rarity:   a RARITY entry from gear.js ({ id, label, color })
 *   extras:   [{ label, value, color? }]  — weight for fish, stats for gear, etc.
 *
 * Sources (in priority order):
 *   1. Gear registry (GEAR_BY_ID) — equipment gets rarity + stats + flavour text.
 *   2. Fish instances — dynamic items carrying a `weight` plus `rarityLabel` and
 *      `description` added by makeFishItem().
 *   3. Food (has `heal`).
 *   4. Generic — item.description if present, else a benign fallback.
 */

import { GEAR_BY_ID, RARITY, STAT_META } from './gear.js';

const FISH_RARITY_MAP = {
  'Common':    RARITY.COMMON,
  'Uncommon':  RARITY.UNCOMMON,
  'Rare':      RARITY.RARE,
  'Epic':      RARITY.EPIC,
  'Legendary': RARITY.LEGENDARY,
};

const fmt = (v) => (v > 0 ? `+${v}` : `${v}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function getItemLore(item) {
  if (!item) return null;

  // ── Equipment (weapons, armour) ─────────────────────────
  const gear = GEAR_BY_ID.get(item.id);
  if (gear) {
    const extras = [];
    const s = gear.stats || {};
    if (s.accuracy)   extras.push({ label: STAT_META.accuracy.label,   value: fmt(s.accuracy),   color: STAT_META.accuracy.color });
    if (s.power)      extras.push({ label: STAT_META.power.label,      value: fmt(s.power),      color: STAT_META.power.color });
    if (s.armour)     extras.push({ label: STAT_META.armour.label,     value: fmt(s.armour),     color: STAT_META.armour.color });
    if (s.critChance) extras.push({ label: STAT_META.critChance.label, value: `${Math.round(s.critChance * 100)}%`, color: STAT_META.critChance.color });
    if (s.hp)         extras.push({ label: STAT_META.hp.label,         value: fmt(s.hp),         color: STAT_META.hp.color });
    if (s.speed && s.speed !== 1.0) {
      extras.push({ label: STAT_META.speed.label, value: `×${s.speed.toFixed(2)}`, color: STAT_META.speed.color });
    }
    if (gear.requires) {
      for (const [skill, lvl] of Object.entries(gear.requires)) {
        extras.push({ label: `Requires ${cap(skill)}`, value: lvl, color: '#c0a060' });
      }
    }
    return {
      name: item.name,
      rarity: gear.rarity,
      description: gear.description || 'A piece of equipment.',
      extras,
    };
  }

  // ── Caught fish (dynamic item with .weight) ─────────────
  if (item.weight !== undefined) {
    const rarity = FISH_RARITY_MAP[item.rarityLabel] || RARITY.COMMON;
    return {
      name: item.name,
      rarity,
      description: item.description || 'A fresh catch from the waters.',
      extras: [{ label: 'Weight', value: `${item.weight}kg`, color: '#9ac7ff' }],
    };
  }

  // ── Food / consumables ──────────────────────────────────
  if (item.heal) {
    return {
      name: item.name,
      rarity: RARITY.COMMON,
      description: item.description || 'Edible. Restores some hitpoints.',
      extras: [{ label: 'Heals', value: `+${item.heal} HP`, color: '#27ae60' }],
    };
  }

  // ── Generic fallback ────────────────────────────────────
  return {
    name: item.name,
    rarity: RARITY.COMMON,
    description: item.description || 'An ordinary item.',
    extras: [],
  };
}
