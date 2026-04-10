/**
 * gear.js — Equipment stat registry.
 *
 * Single authoritative source for:
 *   • Rarity tiers
 *   • Stat metadata
 *   • Every equippable item's stats, rarity, level requirements
 *
 * Separation of concerns:
 *   items.js  — inventory draw() functions (visual layer)
 *   gear.js   — combat/stat data (game-logic layer)
 *   combat.js — stat application (uses getTotalStats from here)
 *
 * Future extension hooks are documented on every entry but left inert
 * until needed:  affixes, setId, upgradeLevel, craftRecipe.
 */

/* ════════════════════════════════════════════════════════
   RARITY
   ════════════════════════════════════════════════════════ */
export const RARITY = {
  COMMON:    { id: 'common',    label: 'Common',    color: '#9e9e9e' },
  UNCOMMON:  { id: 'uncommon',  label: 'Uncommon',  color: '#4caf50' },
  RARE:      { id: 'rare',      label: 'Rare',      color: '#2196f3' },
  EPIC:      { id: 'epic',      label: 'Epic',      color: '#9c27b0' },
  LEGENDARY: { id: 'legendary', label: 'Legendary', color: '#ffd700' },
};

/* ════════════════════════════════════════════════════════
   STAT METADATA  (used by UI for tooltips, colours, icons)
   ════════════════════════════════════════════════════════
   accuracy   — adds to player attack-roll ceiling  (+hit chance)
   power      — contributes to max-hit; each point ≈ +0.3 max damage
   armour     — adds to player defence-roll ceiling (+damage reduction)
   speed      — attack-interval multiplier (0.8 = 20% faster, 1.2 = slower)
   critChance — 0–1 probability of dealing ×1.5 damage on a successful hit
*/
export const STAT_META = {
  accuracy:   { label: 'Accuracy',   color: '#e67e22', desc: 'Adds to attack roll — improves hit chance.'       },
  power:      { label: 'Power',      color: '#e74c3c', desc: 'Adds to max damage. Each point ≈ +0.3 max hit.'  },
  armour:     { label: 'Armour',     color: '#3498db', desc: 'Adds to defence roll — reduces incoming hits.'    },
  speed:      { label: 'Speed',      color: '#2ecc71', desc: 'Attack interval multiplier. Lower = faster.'      },
  critChance: { label: 'Crit',       color: '#f39c12', desc: 'Chance to deal 1.5× damage on a successful hit.' },
  hp:         { label: 'HP Bonus',   color: '#e74c3c', desc: 'Increases maximum hitpoints while equipped.'      },
};

const DEFAULTS = { accuracy: 0, power: 0, armour: 0, speed: 1.0, critChance: 0, hp: 0 };

/**
 * Factory — builds a gear entry with defaults filled in.
 * @param {string}  id
 * @param {string}  name
 * @param {string}  slot       — 'weapon'|'helmet'|'chestplate'|'leggings'|'gloves'|'boots'|'cape'
 * @param {string}  rarityKey  — key into RARITY
 * @param {object}  requires   — { attack?, strength?, defence? }  (skill level requirements)
 * @param {object}  stats      — partial override of DEFAULTS
 * @param {string}  [desc]     — flavour text
 */
function g(id, name, slot, rarityKey, requires, stats, desc = '') {
  return {
    id,
    name,
    slot,
    rarity:      RARITY[rarityKey],
    requires:    requires ?? {},
    stats:       { ...DEFAULTS, ...stats },
    description: desc,
    // ── Extension hooks (inactive until implemented) ──────
    // affixes:      [],        // [{ stat, value, label }] randomised/crafted modifiers
    // setId:        null,      // string — enables set-bonus counting
    // upgradeLevel: 0,         // 0–5; each level multiplies stats by 1.05
    // craftRecipe:  null,      // { requiredLevel, ingredients: [{ itemId, qty }] }
  };
}

/* ════════════════════════════════════════════════════════
   GEAR REGISTRY
   ════════════════════════════════════════════════════════ */
export const GEAR = {

  /* ──────────────────────────────────────────────────────
     WEAPONS
     Accuracy → hit chance.  Power → max damage.
     Speed multiplier < 1.0 means faster attacks.
     ────────────────────────────────────────────────────── */

  // ── Balanced swords  (consistent accuracy + power, speed 1.0) ──────────
  BRONZE_SWORD:     g('bronze_sword',     'Bronze Sword',      'weapon', 'COMMON',
    { attack:  1 }, { accuracy:  5, power:  4 },
    'A starter blade — better than bare hands.'),

  IRON_SWORD:       g('iron_sword',       'Iron Sword',        'weapon', 'COMMON',
    { attack: 10 }, { accuracy: 12, power: 10 },
    'A reliable workhorse weapon.'),

  STEEL_SWORD:      g('steel_sword',      'Steel Sword',       'weapon', 'UNCOMMON',
    { attack: 20 }, { accuracy: 22, power: 20 },
    'Well-balanced for any fighting style.'),

  MITHRIL_SWORD:    g('mithril_sword',    'Mithril Sword',     'weapon', 'RARE',
    { attack: 35 }, { accuracy: 36, power: 32 },
    'Forged from rare blue-grey metal. Holds a supernatural edge.'),

  TUNGSTEN_BLADE:   g('tungsten_blade',   'Tungsten Blade',    'weapon', 'RARE',
    { attack: 50 }, { accuracy: 52, power: 48 },
    'Extremely dense — every swing carries real weight.'),

  // ── Berserker weapons  (high power + crit, lower accuracy, slow) ────────
  OBSIDIAN_CLEAVER: g('obsidian_cleaver', 'Obsidian Cleaver',  'weapon', 'EPIC',
    { attack: 55, strength: 45 }, { accuracy: 40, power: 75, critChance: 0.08, speed: 1.10 },
    'A brutal volcanic cleaver. Slow, but devastating on a crit.'),

  BERSERKER_AXE:    g('berserker_axe',    "Berserker's Axe",   'weapon', 'EPIC',
    { strength: 50 }, { accuracy: 28, power: 85, critChance: 0.14, speed: 1.15 },
    'Wild and unpredictable — misses often, crits harder.'),

  // ── Precision weapons  (fast, crit-focused, moderate power) ────────────
  SHADOW_DAGGER:    g('shadow_dagger',    'Shadow Dagger',     'weapon', 'EPIC',
    { attack: 45 }, { accuracy: 60, power: 22, critChance: 0.20, speed: 0.82 },
    'Lightweight and lethal. Each thrust may prove fatal.'),

  VENOM_BLADE:      g('venom_blade',      'Venom Blade',       'weapon', 'RARE',
    { attack: 40 }, { accuracy: 50, power: 38, critChance: 0.10, speed: 0.90 },
    'Quick strikes. Decent damage. Forgiving to learn.'),

  // ── Magic staff  (balanced all-rounder, mild self-buff) ─────────────────
  MOONSTONE_STAFF:  g('moonstone_staff',  'Moonstone Staff',   'weapon', 'LEGENDARY',
    { attack: 70 }, { accuracy: 80, power: 50, armour: 15, speed: 1.15 },
    'Ancient lunar magic. Hits hard and protects the bearer.'),

  /* ──────────────────────────────────────────────────────
     HELMETS
     ────────────────────────────────────────────────────── */
  LEATHER_CAP:      g('leather_cap',      'Leather Cap',       'helmet', 'COMMON',
    {}, { armour:  1 }),

  BRONZE_HELM:      g('bronze_helm',      'Bronze Helm',       'helmet', 'COMMON',
    { defence:  1 }, { armour:  3 }),

  IRON_HELM:        g('iron_helm',        'Iron Helm',         'helmet', 'COMMON',
    { defence: 10 }, { armour:  8 }),

  STEEL_HELM:       g('steel_helm',       'Steel Helm',        'helmet', 'UNCOMMON',
    { defence: 20 }, { armour: 16 }),

  MITHRIL_HELM:     g('mithril_helm',     'Mithril Helm',      'helmet', 'RARE',
    { defence: 35 }, { armour: 26 },
    'Surprisingly light for its protection rating.'),

  TUNGSTEN_HELM:    g('tungsten_helm',    'Tungsten Helm',     'helmet', 'RARE',
    { defence: 50 }, { armour: 40 },
    'Nearly impenetrable. Heavy but worth every ounce.'),

  BERSERKER_MASK:   g('berserker_mask',   'Berserker Mask',    'helmet', 'EPIC',
    { strength: 40 }, { armour: 12, power: 15, critChance: 0.04 },
    'A war mask that sharpens the killing instinct.'),

  /* ──────────────────────────────────────────────────────
     CHESTPLATES
     ────────────────────────────────────────────────────── */
  LEATHER_BODY:     g('leather_body',     'Leather Body',      'chestplate', 'COMMON',
    {}, { armour:  3 }),

  BRONZE_PLATE:     g('bronze_plate',     'Bronze Plate',      'chestplate', 'COMMON',
    { defence:  1 }, { armour:  8 }),

  IRON_PLATE:       g('iron_plate',       'Iron Plate',        'chestplate', 'COMMON',
    { defence: 10 }, { armour: 18 }),

  STEEL_PLATE:      g('steel_plate',      'Steel Plate',       'chestplate', 'UNCOMMON',
    { defence: 20 }, { armour: 32 }),

  MITHRIL_PLATE:    g('mithril_plate',    'Mithril Plate',     'chestplate', 'RARE',
    { defence: 35 }, { armour: 50 },
    'Mithril weave — best balance of weight and protection.'),

  TUNGSTEN_PLATE:   g('tungsten_plate',   'Tungsten Plate',    'chestplate', 'RARE',
    { defence: 50 }, { armour: 80 },
    'Massive armour. Your enemies will fear it.'),

  SHADOW_TUNIC:     g('shadow_tunic',     'Shadow Tunic',      'chestplate', 'EPIC',
    { attack: 35 }, { armour: 15, accuracy: 12, critChance: 0.06 },
    'Shadow-infused leather. Rewards quick, precise fighters.'),

  /* ──────────────────────────────────────────────────────
     LEGGINGS
     ────────────────────────────────────────────────────── */
  LEATHER_LEGS:     g('leather_legs',     'Leather Legs',      'leggings', 'COMMON',
    {}, { armour:  2 }),

  BRONZE_LEGS:      g('bronze_legs',      'Bronze Legs',       'leggings', 'COMMON',
    { defence:  1 }, { armour:  5 }),

  IRON_LEGS:        g('iron_legs',        'Iron Legs',         'leggings', 'COMMON',
    { defence: 10 }, { armour: 12 }),

  MITHRIL_LEGS:     g('mithril_legs',     'Mithril Legs',      'leggings', 'RARE',
    { defence: 35 }, { armour: 32 }),

  /* ──────────────────────────────────────────────────────
     GLOVES  (armour; berserker variant adds power + crit)
     ────────────────────────────────────────────────────── */
  LEATHER_GLOVES:   g('leather_gloves',   'Leather Gloves',    'gloves', 'COMMON',
    {}, { armour:  1 }),

  BRONZE_GAUNTLETS: g('bronze_gauntlets', 'Bronze Gauntlets',  'gloves', 'COMMON',
    { defence:  1 }, { armour:  2 }),

  IRON_GAUNTLETS:   g('iron_gauntlets',   'Iron Gauntlets',    'gloves', 'COMMON',
    { defence: 10 }, { armour:  5 }),

  STEEL_GAUNTLETS:  g('steel_gauntlets',  'Steel Gauntlets',   'gloves', 'UNCOMMON',
    { defence: 20 }, { armour:  9 }),

  BERSERKER_WRAPS:  g('berserker_wraps',  "Berserker's Wraps", 'gloves', 'EPIC',
    { strength: 40 }, { armour: 4, power: 12, critChance: 0.04 },
    "Tight wraps worn by berserkers. Raw power, minimal protection."),

  /* ──────────────────────────────────────────────────────
     BOOTS  (armour; shadow variant adds accuracy + speed)
     ────────────────────────────────────────────────────── */
  LEATHER_BOOTS:    g('leather_boots',    'Leather Boots',     'boots', 'COMMON',
    {}, { armour:  1 }),

  BRONZE_BOOTS:     g('bronze_boots',     'Bronze Boots',      'boots', 'COMMON',
    { defence:  1 }, { armour:  2 }),

  IRON_BOOTS:       g('iron_boots',       'Iron Boots',        'boots', 'COMMON',
    { defence: 10 }, { armour:  5 }),

  STEEL_BOOTS:      g('steel_boots',      'Steel Boots',       'boots', 'UNCOMMON',
    { defence: 20 }, { armour:  9 }),

  SHADOW_TREADS:    g('shadow_treads',    'Shadow Treads',     'boots', 'EPIC',
    { attack: 30 }, { armour: 7, accuracy: 8, speed: 0.95 },
    'Light boots that improve footwork and attack cadence.'),

  /* ──────────────────────────────────────────────────────
     CAPES  (small all-round bonuses; rare/epic variants meaningful)
     ────────────────────────────────────────────────────── */
  BROWN_CAPE:       g('brown_cape',       'Brown Cape',        'cape', 'COMMON',
    {}, { armour: 1 }),

  RED_CAPE:         g('red_cape',         'Red Cape',          'cape', 'COMMON',
    {}, { armour: 1, power: 2 }),

  BLUE_CAPE:        g('blue_cape',        'Blue Cape',         'cape', 'COMMON',
    {}, { armour: 1, accuracy: 2 }),

  GREEN_CAPE:       g('green_cape',       'Green Cape',        'cape', 'COMMON',
    {}, { armour: 1 }),

  WARRIOR_CAPE:     g('warrior_cape',     "Warrior's Cape",    'cape', 'RARE',
    { attack: 40 }, { armour: 8, accuracy: 10, power: 8 },
    'Worn by seasoned veterans. Solid offence and defence.'),

  BERSERKER_CAPE:   g('berserker_cape',   "Berserker's Cape",  'cape', 'EPIC',
    { strength: 50 }, { armour: 5, power: 18, critChance: 0.05 },
    'Radiates primal fury — amplifies the rage within.'),

  /* ──────────────────────────────────────────────────────
     RAID WEAPONS
     Obtainable only from raid loot tables.
     All require the listed Attack level; some also need Strength.
     setId wires up the future set-bonus system when implemented.
     ────────────────────────────────────────────────────── */

  // ── Balanced EPIC — solid all-rounder with crit flair ───────────
  RAID_BLADE:       g('raid_blade',       "Raider's Blade",    'weapon', 'EPIC',
    { attack: 60 }, { accuracy: 65, power: 55, critChance: 0.12 },
    'Forged in dungeon heat. Precise and deadly.'),

  // ── LEGENDARY void sword — best-in-slot weapon ──────────────────
  VOIDBANE_SWORD:   g('voidbane_sword',   'Voidbane Sword',    'weapon', 'LEGENDARY',
    { attack: 75 }, { accuracy: 90, power: 70, critChance: 0.08 },
    'Absorbs void essence. Even the air around it feels wrong.'),

  // ── Fast crit EPIC — glass cannon for skilled players ───────────
  CHAOS_EDGE:       g('chaos_edge',       'Chaos Edge',        'weapon', 'EPIC',
    { attack: 55 }, { accuracy: 55, power: 35, critChance: 0.25, speed: 0.85 },
    'Chaotic energies make every strike unpredictable. Crits often, crits hard.'),

  // ── Slow heavy EPIC — enormous damage, sluggish swing ───────────
  DUNGEON_GREATAXE: g('dungeon_greataxe', 'Dungeon Greataxe',  'weapon', 'EPIC',
    { attack: 60, strength: 55 }, { accuracy: 40, power: 100, critChance: 0.10, speed: 1.20 },
    'Slow enough to plan a meal around. Each hit shakes the earth.'),

  /* ──────────────────────────────────────────────────────
     RAIDER'S ARMOUR SET  (EPIC)
     Full set: Helm + Plate + Legs + Gauntlets
     Future hook: setId: 'raiders' for set-bonus counting.
     ────────────────────────────────────────────────────── */

  RAIDERS_HELM:       g('raiders_helm',       "Raider's Helm",       'helmet',     'EPIC',
    { defence: 55 }, { armour: 45, power: 8, hp: 10 },
    "A purple-alloy helm worn by veteran dungeon runners."),

  RAIDERS_PLATE:      g('raiders_plate',      "Raider's Plate",      'chestplate', 'EPIC',
    { defence: 55 }, { armour: 90, power: 12, hp: 25 },
    "Heavy plate reinforced with raid-tempered alloy. Exceptional protection."),

  RAIDERS_LEGS:       g('raiders_legs',       "Raider's Legs",       'leggings',   'EPIC',
    { defence: 55 }, { armour: 50, hp: 12 },
    "Sturdy greaves that let you move freely even in the deepest dungeon."),

  RAIDERS_GAUNTLETS:  g('raiders_gauntlets',  "Raider's Gauntlets",  'gloves',     'EPIC',
    { defence: 55 }, { armour: 18, power: 10, hp: 8 },
    "Power-infused gauntlets that add force to every punch and parry."),

  /* ──────────────────────────────────────────────────────
     VOIDGUARD ARMOUR SET  (LEGENDARY)
     Full set: Helm + Plate + Legs + Boots
     Best-in-slot armour. Drops only on Elite/Master difficulty.
     Future hook: setId: 'voidguard' for set-bonus counting.
     ────────────────────────────────────────────────────── */

  VOIDGUARD_HELM:     g('voidguard_helm',     'Voidguard Helm',      'helmet',     'LEGENDARY',
    { defence: 70 }, { armour: 60, accuracy: 10, hp: 15 },
    "Void-forged metal. The teal runes pulse with dimensional energy."),

  VOIDGUARD_PLATE:    g('voidguard_plate',    'Voidguard Plate',     'chestplate', 'LEGENDARY',
    { defence: 70 }, { armour: 120, accuracy: 15, hp: 35 },
    "The finest chest armour in existence. Void-hardened, nearly impenetrable."),

  VOIDGUARD_LEGS:     g('voidguard_legs',     'Voidguard Legs',      'leggings',   'LEGENDARY',
    { defence: 70 }, { armour: 65, hp: 15 },
    "Legs forged from the same void-metal as the plate. Light despite its strength."),

  VOIDGUARD_BOOTS:    g('voidguard_boots',    'Voidguard Boots',     'boots',      'LEGENDARY',
    { defence: 70 }, { armour: 20, speed: 0.97, hp: 8 },
    "Void-energy enhances footwork. You move just a touch faster wearing these."),

  /* ──────────────────────────────────────────────────────
     VITALITY ITEMS  — primary purpose is boosting max HP
     ────────────────────────────────────────────────────── */

  DRAGONHIDE_HELM:    g('dragonhide_helm',    'Dragonhide Helm',     'helmet',     'RARE',
    { defence: 30 }, { armour: 28, hp: 20 },
    'Helmet crafted from dragon scales. Tough hide grants impressive vitality.'),

  TROLLHIDE_VEST:     g('trollhide_vest',     'Trollhide Vest',      'chestplate', 'RARE',
    { defence: 18 }, { armour: 18, hp: 35 },
    "Stitched from cave troll hide. Not pretty, but the thick skin soaks up damage."),

  OBSIDIAN_PLATE:     g('obsidian_plate',     'Obsidian Plate',      'chestplate', 'EPIC',
    { defence: 45 }, { armour: 65, hp: 55 },
    'Forged from volcanic obsidian. Channels heat into raw constitution.'),

  VITALITY_CAPE:      g('vitality_cape',      'Vitality Cape',       'cape',       'UNCOMMON',
    {}, { armour: 3, hp: 20 },
    'A cape woven with life-thread. Increases maximum HP while worn.'),
};

/* ════════════════════════════════════════════════════════
   O(1) ID LOOKUP
   ════════════════════════════════════════════════════════ */
export const GEAR_BY_ID = new Map(Object.values(GEAR).map(e => [e.id, e]));

/* ════════════════════════════════════════════════════════
   getTotalStats
   Accumulate stats from all equipped gear.
   Speed: weapon sets the base; non-weapon items multiply it
   (e.g. Shadow Treads ×0.95 stacks on top of weapon speed).
   ════════════════════════════════════════════════════════ */
export function getTotalStats(playerEquipment) {
  let accuracy   = 0;
  let power      = 0;
  let armour     = 0;
  let speed      = 1.0;    // weapon base
  let critChance = 0;
  let hp         = 0;
  let weaponSpeedSet = false;

  for (const [slot, id] of Object.entries(playerEquipment)) {
    if (!id || id === 'none') continue;
    const entry = GEAR_BY_ID.get(id);
    if (!entry) continue;

    accuracy   += entry.stats.accuracy;
    power      += entry.stats.power;
    armour     += entry.stats.armour;
    critChance += entry.stats.critChance;
    hp         += entry.stats.hp ?? 0;

    if (slot === 'weapon') {
      speed = entry.stats.speed;
      weaponSpeedSet = true;
    } else if (entry.stats.speed !== 1.0) {
      speed *= entry.stats.speed;
    }
  }

  if (!weaponSpeedSet) speed = 1.0;          // bare-handed baseline
  critChance = Math.min(critChance, 0.60);   // hard cap

  return { accuracy, power, armour, speed, critChance, hp };
}

/* ════════════════════════════════════════════════════════
   meetsRequirements
   Returns { ok, reason } so callers can show a helpful message.
   ════════════════════════════════════════════════════════ */
export function meetsRequirements(gearEntry, skills) {
  if (!gearEntry?.requires) return { ok: true, reason: null };
  const SKILL_ID = { attack: 4, strength: 5, defence: 6 };
  for (const [skill, req] of Object.entries(gearEntry.requires)) {
    const id = SKILL_ID[skill];
    if (id === undefined) continue;
    const current = skills.getLevel(id);
    if (current < req) {
      const cap = skill[0].toUpperCase() + skill.slice(1);
      return { ok: false, reason: `Requires ${cap} level ${req} (you have ${current})` };
    }
  }
  return { ok: true, reason: null };
}
