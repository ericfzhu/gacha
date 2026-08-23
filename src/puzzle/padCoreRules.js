export const PAD_BOARD_COLUMNS = 6;
export const PAD_BOARD_ROWS = 5;
export const PAD_MINIMUM_MATCH = 3;
export const PAD_MASS_ATTACK_ORBS = 5;
export const PAD_DEFAULT_MOVE_TIME_SECONDS = 5;
export const PAD_EXTRA_ORB_BONUS = 0.25;
export const PAD_EXTRA_COMBO_BONUS = 0.25;
export const PAD_POISON_MAX_HP_RATIO = 0.2;
export const PAD_MORTAL_POISON_MAX_HP_RATIO = 0.5;
export const PAD_BOMB_MAX_HP_RATIO = 0.2;
export const PAD_NAIL_ENEMY_MAX_HP_RATIO = 0.01;
export const PAD_DEFAULT_THORN_HP_PERCENT = 4;
export const PAD_ENHANCED_ORB_BONUS = 0.06;
export const PAD_CHANGED_SECONDARY_ATTRIBUTE_RATIO = 0.15;
export const PAD_TERTIARY_ATTRIBUTE_RATIO = 0.05;
export const PAD_LCG_MULTIPLIER = 0x343fd;
export const PAD_LCG_INCREMENT = 0x269ec3;
export const PAD_INT32_MAX = 0x7fffffff;

// Version 21.9.0's restored image exposes the corresponding native routines as
// cGAMEMAIN::_isNeighborBlock (0x673e24), _swapBlock (0x67ab14),
// _checkFlood/_checkFlood2 (0x666724/0x666a78), and _checkErases (0x66c81c).

export function padOrbMatchMultiplier(size) {
  return 1 + PAD_EXTRA_ORB_BONUS * Math.max(0, size - PAD_MINIMUM_MATCH);
}

export function padComboMultiplier(combos, extraComboBonus = PAD_EXTRA_COMBO_BONUS) {
  return 1 + Math.max(0, Number(extraComboBonus) || 0) * Math.max(0, combos - 1);
}

// Leader effects are data, not a global part of the combo formula. The full
// binary dispatches saved leader-skill records through _applyLeaderSkill; this
// compact fallback supports its common threshold-based attack multiplier form.
export function padComboLeaderMultiplier(combos, leaderSkill) {
  if (leaderSkill?.type !== 'comboAttack' || !Array.isArray(leaderSkill.thresholds)) return 1;
  return leaderSkill.thresholds.reduce((multiplier, threshold) => {
    const minimum = Math.max(0, Math.trunc(Number(threshold.combos) || 0));
    const candidate = Math.max(0, Number(threshold.multiplier) || 0);
    return combos >= minimum ? Math.max(multiplier, candidate) : multiplier;
  }, 1);
}

// libpad's exported izRndLcGet (0x3741d8) advances a 32-bit LCG and returns
// the unsigned high 16 bits. Math.imul preserves the native low-32-bit product.
export function padLcgStep(state) {
  const nextState = (Math.imul(Number(state) >>> 0, PAD_LCG_MULTIPLIER) + PAD_LCG_INCREMENT) >>> 0;
  return { state: nextState, value: nextState >>> 16 };
}

export function createPadRng(seed = 0) {
  let state = Number(seed) >>> 0;
  const nextUint16 = () => {
    const next = padLcgStep(state);
    state = next.state;
    return next.value;
  };
  return {
    get state() {
      return state;
    },
    setState(value) {
      state = Number(value) >>> 0;
    },
    nextUint16() {
      return nextUint16();
    },
    nextFloat() {
      return nextUint16() / 0x10000;
    },
    shuffleBlockCandidates(candidates) {
      const shuffled = padShuffleBlockCandidates(state, candidates);
      state = shuffled.state;
      return shuffled.candidates;
    },
    shuffleBlockMinusCandidates(candidates) {
      const shuffled = padShuffleBlockMinusCandidates(state, candidates);
      state = shuffled.state;
      return shuffled.candidates;
    },
    shuffleBurDropCandidates(candidates) {
      const shuffled = padShuffleBurDropCandidates(state, candidates);
      state = shuffled.state;
      return shuffled.candidates;
    },
    selectPoisonBlockCandidates(boardTypes, count, excludeHeart = false) {
      const selected = padSelectPoisonBlockCandidates(state, boardTypes, count, excludeHeart);
      state = selected.state;
      return selected.candidates;
    },
    selectPoisonBlockTypes(faceTypes, boardTypes, count, excludeHeart = false) {
      const selected = padSelectPoisonBlockTypes(state, faceTypes, boardTypes, count, excludeHeart);
      state = selected.state;
      return selected.types;
    },
    selectMaskedBlockChanges(
      boardTypes,
      perTypeCount,
      destinationTypeMask,
      excludedSourceTypeMask,
      dryRun = false,
      selectedRows = null,
    ) {
      const selected = padSelectMaskedBlockChanges(
        state,
        boardTypes,
        perTypeCount,
        destinationTypeMask,
        excludedSourceTypeMask,
        dryRun,
        selectedRows,
      );
      state = selected.state;
      return selected;
    },
    resolveBitReplacements(
      selectedRows,
      boardTypes,
      destinationType,
      lockedRows = null,
      initialEffectFlags = 0,
    ) {
      const resolved = padResolveBitReplacements(
        state,
        selectedRows,
        boardTypes,
        destinationType,
        lockedRows,
        initialEffectFlags,
      );
      state = resolved.state;
      return resolved;
    },
    resolveBlockSwapNew(
      destinationTypes,
      boardTypes,
      sourceTypeMask,
      lockedRows = null,
      initialEffectFlags = 0,
    ) {
      const resolved = padResolveBlockSwapNew(
        state,
        destinationTypes,
        boardTypes,
        sourceTypeMask,
        lockedRows,
        initialEffectFlags,
      );
      state = resolved.state;
      return resolved;
    },
    resolveLineBlockSwaps(
      lineMask,
      destinationTypeMask,
      boardTypes,
      orientation,
      lockedRows = null,
      initialEffectFlags = 0,
    ) {
      const resolved = padResolveLineBlockSwaps(
        state,
        lineMask,
        destinationTypeMask,
        boardTypes,
        orientation,
        lockedRows,
        initialEffectFlags,
      );
      state = resolved.state;
      return resolved;
    },
    resolveSkillBoardSwap(skillTypes, boardTypes, lockedRows = null) {
      const resolved = padResolveSkillBoardSwap(state, skillTypes, boardTypes, lockedRows);
      state = resolved.state;
      return resolved;
    },
    spawnNewBlock(dropRates, faceTypes, excludedTypeMask = 0, scriptedType = null) {
      const result = padSpawnNewBlock(state, dropRates, faceTypes, excludedTypeMask, scriptedType);
      state = result.state;
      return result.type;
    },
    spawnNewBlockInBits(typeMask, faceTypes) {
      const result = padSpawnNewBlockInBits(state, typeMask, faceTypes);
      state = result.state;
      return result.type;
    },
    createInitialBoard(rows, columns, dropRates, faceTypes, minimumMatch = PAD_MINIMUM_MATCH) {
      const result = padCreateInitialBoard(state, rows, columns, dropRates, faceTypes, minimumMatch);
      state = result.state;
      return result.board;
    },
    getRandomBlock(excludedType = -1, includeJammer = false, includeHeart = true) {
      const result = padGetRandomBlock(state, excludedType, includeJammer, includeHeart);
      state = result.state;
      return result.type;
    },
    getRandomBlockOnFace(faceCounts, includeHeart = true) {
      const result = padGetRandomBlockOnFace(state, faceCounts, includeHeart);
      state = result.state;
      return { type: result.type, alternateType: result.alternateType };
    },
  };
}

export function createPadLcg(seed = 0) {
  const rng = createPadRng(seed);
  return () => rng.nextFloat();
}

// _spawnNewBlock (0x661978) uses one saved LCG roll for the ordinary face-list
// path. When at least one of ten binary32 drop-rate lanes is active, it instead
// consumes a first roll against those lanes scaled by 10,000 and always advances
// once more: the second roll is discarded after a weighted win or selects the
// fallback face after a miss. Only the face fallback honors excludedTypeMask.
// A scripted drop bypasses random advances and is the optional final argument.
export function padSpawnNewBlock(
  state,
  dropRates,
  faceTypes,
  excludedTypeMask = 0,
  scriptedType = null,
) {
  const scripted = Number(scriptedType);
  if (scriptedType !== null && scriptedType !== undefined && Number.isInteger(scripted)) {
    return { state: Number(state) >>> 0, type: scripted, spawnFlags: 0, weighted: false, scripted: true };
  }
  const rateSummary = padSummarizeDropRates(dropRates);
  const { rates } = rateSummary;
  const hasActiveRates = rateSummary.units >= 1;
  const first = padLcgStep(state);
  let type = -1;
  let faceRoll = first;
  if (hasActiveRates) {
    let remaining = Math.fround(Math.floor(first.value * 10_000 / 0x10000));
    for (let index = 0; index < 10; index += 1) {
      const rate = rates[index];
      if (rate === 0) continue;
      remaining = Math.fround(remaining - Math.fround(rate * Math.fround(10_000)));
      if (remaining < 0) {
        type = index;
        break;
      }
    }
    faceRoll = padLcgStep(first.state);
  }
  if (type >= 0) {
    return { state: faceRoll.state, type, spawnFlags: 0, weighted: true, scripted: false };
  }
  const faces = (Array.isArray(faceTypes) ? faceTypes : [])
    .map((value) => Math.trunc(Number(value)))
    .filter((value) => value >= 0 && value <= 9);
  if (faces.length === 0) {
    return { state: faceRoll.state, type: -1, spawnFlags: 0, weighted: false, scripted: false };
  }
  const start = Math.floor(faceRoll.value * faces.length / 0x10000);
  const excluded = Number(excludedTypeMask) >>> 0;
  type = faces[start];
  for (let offset = 0; offset < faces.length && (excluded & (1 << type)) !== 0; offset += 1) {
    type = faces[(start + offset + 1) % faces.length];
  }
  return { state: faceRoll.state, type, spawnFlags: 0, weighted: false, scripted: false };
}

// _checkFalls (0x673fbc) first generates every replacement type, then rolls
// floor-configured combo-drop chances once per replacement until the configured
// cap is full. Requested markers each spend one additional saved LCG advance;
// native starts at that random replacement index and scans forward (wrapping)
// for an unmarked natural type. The output byte's bit 6 becomes sBLOCK flag
// 0x8000 when the replacement object is initialized.
export function padResolveComboDropSpawns(
  state,
  spawnedTypes,
  {
    pendingCount = 0,
    chanceBasisPoints = 0,
    remainingCapacity = 0,
  } = {},
) {
  const types = (Array.isArray(spawnedTypes) ? spawnedTypes : [])
    .map((type) => Math.trunc(Number(type)));
  const marked = Array(types.length).fill(false);
  let nextState = Number(state) >>> 0;
  let desiredCount = Math.max(0, Math.trunc(Number(pendingCount) || 0));
  let capacity = Math.max(0, Math.trunc(Number(remainingCapacity) || 0));
  const chance = Math.max(0, Math.trunc(Number(chanceBasisPoints) || 0));

  for (let index = 0; index < types.length && capacity > 0 && chance > 0; index += 1) {
    const roll = padLcgStep(nextState);
    nextState = roll.state;
    const scaled = Math.floor(roll.value * 10_000 / 0x10000);
    if (scaled < chance) {
      desiredCount += 1;
      capacity -= 1;
    }
  }

  for (let marker = 0; marker < desiredCount && types.length > 0; marker += 1) {
    const roll = padLcgStep(nextState);
    nextState = roll.state;
    let candidate = Math.floor(roll.value * types.length / 0x10000);
    for (let attempt = 0; attempt < types.length * 2; attempt += 1) {
      if (!marked[candidate] && types[candidate] >= 0 && types[candidate] <= 5) {
        marked[candidate] = true;
        break;
      }
      candidate = (candidate + 1) % types.length;
    }
  }

  return { state: nextState, marked, desiredCount };
}

// _checkErases (0x66c81c) builds five elemental counts from passive skill 62.
// Every connected elemental match of at least ten blocks queues that type's
// full count for _checkFalls and adds the same number of dummy combos, with a
// four-combo cap shared by the current erase pass. The pending byte wraps like
// native uint8 storage; Heart and special types do not use this branch.
export function padResolveComboDropAwakenings(matches, awakeningCounts) {
  const typeIndices = new Map([
    ['fire', 0], ['water', 1], ['wood', 2], ['light', 3], ['dark', 4],
  ]);
  const counts = Array.from({ length: 5 }, (_, index) => (
    Math.max(0, Math.trunc(Number(awakeningCounts?.[index]) || 0))
  ));
  let pendingCount = 0;
  let bonusCombos = 0;
  for (const match of Array.isArray(matches) ? matches : []) {
    const typeIndex = typeIndices.get(match?.type);
    if (typeIndex === undefined || Math.trunc(Number(match?.size) || 0) < 10) continue;
    const count = counts[typeIndex];
    pendingCount = (pendingCount + count) & 0xff;
    bonusCombos += Math.min(count, 4 - bonusCombos);
  }
  return { pendingCount, bonusCombos };
}

// _checkPassiveSkill4Block's first branch applies the enemy black/invisible
// skyfall record before thorn, Nail, enhancement, and lock assignment. Its
// signed 16-bit chance is measured against a 10,000-unit roll. Successful
// blocks receive a one-turn low-seven-bit countdown plus bit 7 in sBLOCK+1;
// flag 0x10000 tells _incEneTurn to clear the marker without decrementing that
// countdown on the spawn turn. Special types 6..9 lose enhancement and any
// pre-existing combo-drop/Nail flags when the black state is applied.
export function padResolveBlackFall(state, type, rule, initialBlockFlags = 0) {
  let blockFlags = Number(initialBlockFlags) >>> 0;
  const typeIndex = Math.trunc(Number(type));
  if (!rule?.active || typeIndex < 0 || typeIndex > 10) {
    return {
      state: Number(state) >>> 0,
      blockFlags,
      blindCountdown: 0,
      blindFresh: false,
      clearEnhancement: false,
      applied: false,
      attempts: 0,
    };
  }

  const roll = padLcgStep(state);
  const scaled = Math.floor(roll.value * 10_000 / 0x10000);
  const chanceBasisPoints = (Math.trunc(Number(rule.chanceBasisPoints) || 0) << 16) >> 16;
  const applied = scaled < chanceBasisPoints;
  let clearEnhancement = false;
  const blindFresh = applied && rule.skipInitialCountdown !== false;
  if (applied) {
    const oldFlags = blockFlags;
    blockFlags |= 0x1000;
    if (blindFresh) blockFlags |= 0x10000;
    if (typeIndex >= 6 && typeIndex <= 9) {
      blockFlags &= ~0x20000;
      if ((oldFlags & 0x8000) !== 0) blockFlags &= ~0x8000;
      clearEnhancement = true;
    }
  }
  return {
    state: roll.state,
    blockFlags: blockFlags >>> 0,
    blindCountdown: applied ? 1 : 0,
    blindFresh,
    clearEnhancement,
    applied,
    attempts: 1,
  };
}

// _checkPassiveSkill4Block (0x64131c) applies the active thorn-fall record
// before _checkLockFall. Unlike lock-fall, an active record spends one roll for
// every spawned block and only checks its optional type mask after the chance
// succeeds. The descriptor's high bit is supplied by a separate packed control
// bit while the low seven bits are the per-crossing max-HP damage percentage.
export function padResolveThornFall(state, type, rule, initialBlockFlags = 0) {
  let blockFlags = Number(initialBlockFlags) >>> 0;
  if (!rule?.active) {
    return {
      state: Number(state) >>> 0,
      blockFlags,
      thornDescriptor: 0,
      clearEnhancement: false,
      applied: false,
      attempts: 0,
    };
  }

  const roll = padLcgStep(state);
  const chancePercent = Math.trunc(Number(rule.chancePercent) || 0) & 0xffff;
  const threshold = (100 - chancePercent) * 100;
  const scaled = Math.floor(roll.value * 10_000 / 0x10000);
  const typeIndex = Math.trunc(Number(type));
  const typeMask = Number(rule.typeMask) >>> 0;
  const typeMatches = typeMask === 0 || (
    typeIndex >= 0 && typeIndex <= 31 && (typeMask & (1 << typeIndex)) !== 0
  );
  const applied = scaled >= threshold && typeMatches;
  let clearEnhancement = false;
  if (applied) {
    const oldFlags = blockFlags;
    blockFlags |= 0x80000;
    if (typeIndex >= 6 && typeIndex <= 9 && (oldFlags & 0x28000) !== 0) {
      blockFlags &= ~0x20000;
      if ((oldFlags & 0x8000) !== 0) blockFlags &= ~0x8000;
      clearEnhancement = true;
    }
  }
  const thornDescriptor = applied
    ? (Math.trunc(Number(rule.descriptor) || 0) & 0x7f) | (rule.descriptorHighBit ? 0x80 : 0)
    : 0;
  return {
    state: roll.state,
    blockFlags: blockFlags >>> 0,
    thornDescriptor,
    clearEnhancement,
    applied,
    attempts: 1,
  };
}

// The next _checkPassiveSkill4Block branch is the Nail Orb fall record. It is
// limited to the six natural types, spends one +0x66a14 LCG advance per eligible
// spawn, and marks the block when floor(high16 * 100 / 65536) < percent.
export function padResolveNailFall(state, type, rule, initialBlockFlags = 0) {
  const blockFlags = Number(initialBlockFlags) >>> 0;
  const typeIndex = Math.trunc(Number(type));
  if (!rule?.active || typeIndex < 0 || typeIndex > 5) {
    return {
      state: Number(state) >>> 0,
      blockFlags,
      applied: false,
      attempts: 0,
    };
  }
  const roll = padLcgStep(state);
  const chancePercent = Math.trunc(Number(rule.chancePercent) || 0) & 0xff;
  const scaled = Math.floor(roll.value * 100 / 0x10000);
  const applied = scaled < chancePercent;
  return {
    state: roll.state,
    blockFlags: (blockFlags | (applied ? 0x20000 : 0)) >>> 0,
    applied,
    attempts: 1,
  };
}

// The final _checkPassiveSkill4Block branch combines the six attribute-specific
// orb-enhance awakening counts (skill IDs 14..18 and 29) with the active floor
// modifier. Each awakening contributes 20 percentage points, capped at 100.
// A weakening record subtracts its chance; an ordinary boost adds it. Every
// natural spawn consumes one +0x66a14 roll even when the net chance is exactly
// zero, while special types return without advancing the stream.
export function padResolveEnhancementFall(
  state,
  type,
  awakeningCounts,
  modifier = null,
  passiveEnabled = true,
) {
  const typeIndex = Math.trunc(Number(type));
  if (typeIndex < 0 || typeIndex > 5) {
    return {
      state: Number(state) >>> 0,
      enhancementPower: 0,
      netChancePercent: 0,
      applied: false,
      processed: false,
    };
  }

  const count = Math.max(0, Math.trunc(Number(awakeningCounts?.[typeIndex]) || 0));
  let netChancePercent = passiveEnabled
    ? Math.fround(Math.min(Math.fround(count * 20), 100))
    : Math.fround(0);
  const weakeningPowerPercent = Math.trunc(Number(modifier?.weakeningPowerPercent) || 0) & 0xffff;
  if (modifier?.active) {
    const chancePercent = (Math.trunc(Number(modifier.chancePercent) || 0) << 16) >> 16;
    netChancePercent = Math.fround(weakeningPowerPercent === 0
      ? netChancePercent + chancePercent
      : netChancePercent - chancePercent);
  }

  const roll = padLcgStep(state);
  const scaled = Math.floor(roll.value * 10_000 / 0x10000);
  let enhancementPower = 0;
  let applied = false;
  if (netChancePercent > 0) {
    const threshold = Math.fround(Math.min(netChancePercent, 100) * 100);
    applied = threshold > scaled;
    if (applied) enhancementPower = PAD_ENHANCED_ORB_BONUS;
  } else if (netChancePercent < 0) {
    const threshold = Math.min(Math.fround(netChancePercent * -100), 10_000);
    applied = threshold > scaled;
    if (applied) enhancementPower = Math.fround(weakeningPowerPercent / -100);
  }
  return {
    state: roll.state,
    enhancementPower: Math.fround(enhancementPower),
    netChancePercent,
    applied,
    processed: true,
  };
}

// Nail damage is resolved after ordinary attacks. _gamePhaseEachTurn computes
// max(1.0, enemyMaxHp * nailCount / 100.0) in binary64 and passes it through
// izMathRoundSint64 (positive values round by truncating value + 0.5).
export function padNailDamage(enemyMaxHp, nailCount) {
  const maxHp = Math.max(0, Math.trunc(Number(enemyMaxHp) || 0));
  const count = Math.max(0, Math.trunc(Number(nailCount) || 0));
  if (count === 0) return 0;
  return Math.trunc(Math.max(1, maxHp * count * PAD_NAIL_ENEMY_MAX_HP_RATIO) + 0.5);
}

// _checkLockFall (0x626200) walks ten active rules. A matching type mask spends
// one advance from the dedicated lock-fall LCG at game-work+0x66a14 (separate
// from _spawnNewBlock's stream) and locks when roll >= (100 - percent) * 100.
export function padResolveLockFall(state, type, rules, initialBlockFlags = 0) {
  let nextState = Number(state) >>> 0;
  let blockFlags = Number(initialBlockFlags) >>> 0;
  let attempts = 0;
  const typeIndex = Math.trunc(Number(type));
  for (const rule of (Array.isArray(rules) ? rules : []).slice(0, 10)) {
    const typeMask = Number(rule?.typeMask) & 0xffff;
    if (typeIndex < 0 || typeIndex > 15 || (typeMask & (1 << typeIndex)) === 0) continue;
    const roll = padLcgStep(nextState);
    nextState = roll.state;
    attempts += 1;
    const chancePercent = Math.trunc(Number(rule?.chancePercent) || 0);
    const threshold = (100 - chancePercent) * 100;
    const scaled = Math.floor(roll.value * 10_000 / 0x10000);
    if (scaled >= threshold) blockFlags |= 0x800;
  }
  return { state: nextState, blockFlags: blockFlags >>> 0, attempts };
}

// _buildBlockList (0x6615e8) emits ten float32 lanes, adds them sequentially,
// multiplies the final binary32 total by 100000.0f, and returns
// izMathCeiling(result). The raw dungeon/passive records are upstream inputs;
// this helper preserves the exact final-lane summary consumed by spawning.
export function padSummarizeDropRates(dropRates) {
  const rates = Array.from({ length: 10 }, (_, index) => (
    Math.fround(Number(dropRates?.[index]) || 0)
  ));
  let total = Math.fround(0);
  let positiveMask = 0;
  rates.forEach((rate, type) => {
    total = Math.fround(total + rate);
    if (rate > 0) positiveMask |= 1 << type;
  });
  const units = Math.ceil(Math.fround(total * Math.fround(100_000)));
  return { rates, total, units, positiveMask };
}

// _spawnNewBlockInBits (0x62771c) counts every bit in its uint16 mask and
// consumes one roll to select an enabled bit. Bits 0..5 return directly. A
// selected higher bit (or an empty mask) consumes a second roll and returns a
// uniformly selected active face type instead.
export function padSpawnNewBlockInBits(state, typeMask, faceTypes) {
  const mask = Number(typeMask) & 0xffff;
  let count = 0;
  for (let bits = mask; bits !== 0; bits >>>= 1) count += bits & 1;
  const first = padLcgStep(state);
  let selectedIndex = Math.floor(first.value * count / 0x10000);
  for (let type = 0; type <= 5; type += 1) {
    if ((mask & (1 << type)) === 0) continue;
    if (selectedIndex === 0) return { state: first.state, type, usedFaceFallback: false };
    selectedIndex -= 1;
  }
  const second = padLcgStep(first.state);
  const faces = (Array.isArray(faceTypes) ? faceTypes : [])
    .map((value) => Math.trunc(Number(value)))
    .filter((value) => value >= 0 && value <= 9);
  const type = faces.length > 0
    ? faces[Math.floor(second.value * faces.length / 0x10000)]
    : -1;
  return { state: second.state, type, usedFaceFallback: true };
}

// __initBlocks (0x661f10) visits the live board row-major. Before each
// _spawnNewBlock call it masks the type of a same-color run occupying the
// previous minimumMatch-1 horizontal cells and does the same vertically. The
// spawn fallback rotates forward through the face list rather than rescaling
// its random roll over a filtered candidate list.
export function padCreateInitialBoard(
  state,
  rows,
  columns,
  dropRates,
  faceTypes,
  minimumMatch = PAD_MINIMUM_MATCH,
) {
  const height = Math.max(0, Math.trunc(Number(rows) || 0));
  const width = Math.max(0, Math.trunc(Number(columns) || 0));
  const runLength = Math.max(2, Math.trunc(Number(minimumMatch) || PAD_MINIMUM_MATCH));
  const board = Array.from({ length: height }, () => Array(width).fill(-1));
  const rateSummary = padSummarizeDropRates(dropRates);
  const saturatedRates = (rateSummary.units >>> 5) >= 3_125;
  let savedState = Number(state) >>> 0;
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      let excludedMask = 0;
      if (column >= runLength - 1) {
        const type = board[row][column - 1];
        let same = true;
        for (let offset = 2; offset < runLength; offset += 1) {
          if (board[row][column - offset] !== type) same = false;
        }
        if (same && type >= 0) excludedMask |= 1 << type;
      }
      if (row >= runLength - 1) {
        const type = board[row - 1][column];
        let same = true;
        for (let offset = 2; offset < runLength; offset += 1) {
          if (board[row - offset][column] !== type) same = false;
        }
        if (same && type >= 0) excludedMask |= 1 << type;
      }
      const spawned = padSpawnNewBlock(savedState, dropRates, faceTypes, excludedMask);
      savedState = spawned.state;
      let type = spawned.type;
      if (saturatedRates && (rateSummary.positiveMask & (1 << type)) === 0) {
        for (let offset = 1; offset <= 10; offset += 1) {
          const candidate = (type + offset) % 10;
          const candidateBit = 1 << candidate;
          if ((excludedMask & candidateBit) === 0 && (rateSummary.positiveMask & candidateBit) !== 0) {
            type = candidate;
            break;
          }
        }
      }
      board[row][column] = type;
    }
  }
  return { state: savedState, board };
}

// cGAMEMAIN::_getRandomBlock (0x617874) advances the saved game-work LCG
// exactly twice, combines the high halves of those two states into a temporary
// seed, then performs a forward Fisher-Yates pass over its eligible block
// list. The temporary shuffle advances are deliberately not written back to
// game work. Candidate eligibility is caller-specific, so keep that separate
// from this exact ordering primitive.
export function padShuffleBlockCandidates(state, candidates) {
  const first = padLcgStep(state);
  const second = padLcgStep(first.state);
  let localState = ((first.state & 0xffff0000) | (second.state >>> 16)) >>> 0;
  const shuffled = [...candidates];
  for (let index = 1; index < shuffled.length; index += 1) {
    localState = padLcgStep(localState).state;
    const target = (((localState >>> 16) * (index + 1)) >>> 16);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return { state: second.state, candidates: shuffled };
}

// _doBlockMinus (0x61caa0) uses a separate shuffle contract for a capped
// enemy debuff. It persists one LCG advance even for zero/one candidates, seeds
// a temporary LCG from that state's high 16 bits, then swaps every index i with
// a target in [0, i). The temporary advances are not written back to game work.
export function padShuffleBlockMinusCandidates(state, candidates) {
  const persisted = padLcgStep(state);
  let localState = persisted.value;
  const shuffled = [...candidates];
  for (let index = 1; index < shuffled.length; index += 1) {
    localState = padLcgStep(localState).state;
    const target = (((localState >>> 16) * index) >>> 16);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return { state: persisted.state, candidates: shuffled };
}

// _doMakeBurDrop (0x61ce38) uses the same persisted/local LCG split as
// _doBlockMinus. Keep a named entry point because the candidate rules and
// zero-request behavior belong to the caller, not to this ordering primitive.
export function padShuffleBurDropCandidates(state, candidates) {
  return padShuffleBlockMinusCandidates(state, candidates);
}

// _doLockDropBits (0x62676c) receives a caller-supplied uint16 seed and never
// updates the saved game-work RNG. Its forward swaps use [0, i), like the
// enemy-debuff shuffle, but begin directly from that 16-bit seed.
export function padShuffleLockDropCandidates(seed, candidates) {
  let localState = Number(seed) & 0xffff;
  const shuffled = [...candidates];
  for (let index = 1; index < shuffled.length; index += 1) {
    localState = padLcgStep(localState).state;
    const target = (((localState >>> 16) * index) >>> 16);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

// _doPoisonBlockN (0x626bf0) spends two saved LCG advances for every requested
// cell. Those values choose a starting column and row; the routine then walks
// forward in row-major order with wraparound until it finds a cell not already
// selected by this call, not type 7/8, and optionally not heart type 5.
export function padSelectPoisonBlockCandidates(state, boardTypes, count, excludeHeart = false) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  if (rows === 0 || columns === 0 || boardTypes.some((row) => !Array.isArray(row) || row.length !== columns)) {
    return { state: Number(state) >>> 0, candidates: [] };
  }
  let savedState = Number(state) >>> 0;
  const selected = new Set();
  const candidates = [];
  const attempts = Math.max(0, Math.trunc(Number(count) || 0));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const columnRoll = padLcgStep(savedState);
    const rowRoll = padLcgStep(columnRoll.state);
    savedState = rowRoll.state;
    let column = Math.floor(columnRoll.value * columns / 0x10000);
    let row = Math.floor(rowRoll.value * rows / 0x10000);
    for (let scanned = 0; scanned < rows * columns; scanned += 1) {
      const key = row * columns + column;
      const type = Number(boardTypes[row][column]);
      if (!selected.has(key) && type !== 7 && type !== 8 && (!excludeHeart || type !== 5)) {
        selected.add(key);
        candidates.push({ row, column });
        break;
      }
      column += 1;
      if (column >= columns) {
        column = 0;
        row = (row + 1) % rows;
      }
    }
  }
  return { state: savedState, candidates };
}

// _doPoisonBlocks (0x626e78) filters the dungeon's ordered face-color list by
// live board counts, optionally removes Heart, and uses the ordinary two-saved-
// step shuffle. A non-empty eligible list consumes both steps even if the
// requested number of whole color groups is zero.
export function padSelectPoisonBlockTypes(state, faceTypes, boardTypes, count, excludeHeart = false) {
  const flattened = Array.isArray(boardTypes) ? boardTypes.flat() : [];
  const eligible = (Array.isArray(faceTypes) ? faceTypes : []).filter((value) => {
    const type = Math.trunc(Number(value));
    if (excludeHeart && type === 5) return false;
    return flattened.some((cell) => {
      const cellType = Math.trunc(Number(cell));
      return type === 7 || type === 8 ? cellType === 7 || cellType === 8 : cellType === type;
    });
  }).map((value) => Math.trunc(Number(value)));
  if (eligible.length === 0) return { state: Number(state) >>> 0, types: [] };
  const shuffled = padShuffleBlockCandidates(state, eligible);
  const requested = Math.max(0, Math.trunc(Number(count) || 0));
  return { state: shuffled.state, types: shuffled.candidates.slice(0, requested) };
}

// _doPoisonBlockN2 (0x61c344) is the general masked block-change writer used
// by several skills. Without a caller bitmap it excludes source types by mask;
// with one it instead excludes cells whose row bit is already set. Applying
// always spends the ordinary two saved LCG steps, even if no assignment can be
// made. Its return value and bitmap count attempted writes, including writes a
// locked block will later reject.
export function padSelectMaskedBlockChanges(
  state,
  boardTypes,
  perTypeCount,
  destinationTypeMask,
  excludedSourceTypeMask,
  dryRun = false,
  selectedRows = null,
) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  const validBoard = rows > 0 && columns > 0
    && boardTypes.every((row) => Array.isArray(row) && row.length === columns);
  const hasSelectionMap = selectedRows !== null && selectedRows !== undefined;
  const outputRows = hasSelectionMap
    ? Array.from({ length: rows }, (_, row) => Number(selectedRows[row] ?? 0) & 0xffff)
    : null;

  const excludedMask = Number(excludedSourceTypeMask) >>> 0;
  const candidates = [];
  if (validBoard) {
    boardTypes.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
      const type = Math.trunc(Number(value));
      const excluded = hasSelectionMap
        ? (outputRows[rowIndex] & (1 << columnIndex)) !== 0
        : type >= 0 && type < 32 && (excludedMask & (1 << type)) !== 0;
      if (!excluded) candidates.push({ row: rowIndex, column: columnIndex, type });
    }));
  }
  if (dryRun) {
    return {
      state: Number(state) >>> 0,
      candidateCount: candidates.length,
      assignments: [],
      selectedRows: outputRows,
    };
  }

  const shuffled = padShuffleBlockCandidates(state, candidates);
  const destinationMask = Number(destinationTypeMask) >>> 0;
  const requested = Math.trunc(Number(perTypeCount) || 0);
  const assignments = [];
  let candidateIndex = 0;
  if (requested >= 1) {
    for (let type = 0; type <= 9 && candidateIndex < shuffled.candidates.length; type += 1) {
      if ((destinationMask & (1 << type)) === 0) continue;
      for (let count = 0; count < requested && candidateIndex < shuffled.candidates.length; count += 1) {
        const candidate = shuffled.candidates[candidateIndex];
        candidateIndex += 1;
        assignments.push({ row: candidate.row, column: candidate.column, type });
        if (outputRows) outputRows[candidate.row] |= 1 << candidate.column;
      }
    }
  }
  return {
    state: shuffled.state,
    candidateCount: candidates.length,
    assignments,
    selectedRows: outputRows,
  };
}

// _countBlockBits (0x651fa4) tests a uint16 type mask over the live board.
// Mortal poison type 8 deliberately also exposes poison bit 7, so a poison-mask
// query counts both poison variants while bit 8 can still target mortal poison.
export function padCountBlockBits(boardTypes, typeMask) {
  const mask = Number(typeMask) & 0xffff;
  if (!Array.isArray(boardTypes)) return 0;
  let count = 0;
  boardTypes.forEach((row) => {
    if (!Array.isArray(row)) return;
    row.forEach((value) => {
      const type = Math.trunc(Number(value));
      if (type < 0 || type > 15) return;
      const bits = (1 << type) | (type === 8 ? 1 << 7 : 0);
      if ((mask & bits) !== 0) count += 1;
    });
  });
  return count;
}

// _countNonPoisonBlocks (0x61c250) ignores poison types 7/8 and optionally
// Heart type 5. It counts every other live board cell regardless of lock or
// enhancement state.
export function padCountNonPoisonBlocks(boardTypes, excludeHeart = false) {
  if (!Array.isArray(boardTypes)) return 0;
  let count = 0;
  boardTypes.forEach((row) => {
    if (!Array.isArray(row)) return;
    row.forEach((value) => {
      const type = Math.trunc(Number(value));
      if (type !== 7 && type !== 8 && (!excludeHeart || type !== 5)) count += 1;
    });
  });
  return count;
}

// _doBitReplace (0x6adf2c) walks caller-supplied uint16 row masks and delegates
// each active cell to _doBlockSwapMain (0x6ae028). The shared integer is not a
// changed-cell count: it accumulates native effect categories (natural/bomb=1,
// poison=2, jammer=4). A negative destination independently rolls one of the
// six natural types for each unlocked selected cell and consumes one saved LCG
// step per successful attempt.
export function padResolveBitReplacements(
  state,
  selectedRows,
  boardTypes,
  destinationType,
  lockedRows = null,
  initialEffectFlags = 0,
) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  const validBoard = rows > 0 && columns > 0
    && boardTypes.every((row) => Array.isArray(row) && row.length === columns);
  let savedState = Number(state) >>> 0;
  let effectFlags = Number(initialEffectFlags) | 0;
  const assignments = [];
  if (!validBoard) return { state: savedState, effectFlags, assignments };
  const requestedType = Math.trunc(Number(destinationType) || 0);
  for (let row = 0; row < rows; row += 1) {
    const selectedBits = Number(selectedRows?.[row] ?? 0) & 0xffff;
    const lockedBits = Number(lockedRows?.[row] ?? 0) & 0xffff;
    for (let column = 0; column < columns; column += 1) {
      const bit = 1 << column;
      if ((selectedBits & bit) === 0 || (lockedBits & bit) !== 0) continue;
      let type = requestedType;
      if (type < 0) {
        const roll = padLcgStep(savedState);
        savedState = roll.state;
        type = Math.floor(roll.value * 6 / 0x10000);
      }
      if (type < 0 || type > 9) continue;
      effectFlags |= type === 6 ? 4 : type === 7 || type === 8 ? 2 : 1;
      assignments.push({ row, column, type });
    }
  }
  return { state: savedState, effectFlags, assignments };
}

function padBlockSwapSourceEligible(type, effectiveSourceMask) {
  if ((effectiveSourceMask & (1 << 7)) !== 0 && (type === 7 || type === 8)) return true;
  return type >= 0 && type < 32 && (effectiveSourceMask & (1 << type)) !== 0;
}

// _doBlockSwapNew (0x6aee90) powers the public type-mask replacement wrappers.
// It always folds poison/mortal-poison into a source mask that names neither,
// uses per-cell saved LCG rolls for its first assignment, and then either
// balances viable assignments to three of every destination or falls back to a
// two-step shuffled cyclic distribution when fewer changes are available.
export function padResolveBlockSwapNew(
  state,
  destinationTypes,
  boardTypes,
  sourceTypeMask,
  lockedRows = null,
  initialEffectFlags = 0,
) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  const validBoard = rows > 0 && columns > 0
    && boardTypes.every((row) => Array.isArray(row) && row.length === columns);
  const destinations = (Array.isArray(destinationTypes) ? destinationTypes : [])
    .map((value) => Math.trunc(Number(value)))
    .filter((type) => type >= 0 && type <= 9);
  let savedState = Number(state) >>> 0;
  let effectFlags = Number(initialEffectFlags) | 0;
  if (!validBoard || destinations.length === 0) {
    return { state: savedState, effectFlags, assignments: [], effectiveSourceMask: 0 };
  }
  let effectiveSourceMask = Number(sourceTypeMask) >>> 0;
  if ((effectiveSourceMask & 0x180) === 0) effectiveSourceMask |= 0x180;
  const randomMap = Array.from({ length: rows }, () => Array(columns).fill(-1));
  const destinationCounts = Array(destinations.length).fill(0);
  let changedCount = 0;
  const eligible = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const currentType = Math.trunc(Number(boardTypes[row][column]));
      if (!padBlockSwapSourceEligible(currentType, effectiveSourceMask)) continue;
      const roll = padLcgStep(savedState);
      savedState = roll.state;
      const destinationIndex = Math.floor(roll.value * destinations.length / 0x10000);
      const destinationType = destinations[destinationIndex];
      destinationCounts[destinationIndex] += 1;
      eligible.push({ row, column });
      if (currentType !== destinationType) {
        randomMap[row][column] = destinationType;
        changedCount += 1;
      }
    }
  }

  if (changedCount < destinations.length * 3) {
    const fallbackCandidates = eligible.slice(0, 64);
    const shuffled = padShuffleBlockCandidates(savedState, fallbackCandidates);
    savedState = shuffled.state;
    shuffled.candidates.forEach(({ row, column }, index) => {
      randomMap[row][column] = destinations[index % destinations.length];
    });
  } else {
    for (let destinationIndex = 0; destinationIndex < destinations.length; destinationIndex += 1) {
      let localCount = destinationCounts[destinationIndex];
      while (localCount <= 2) {
        let sourceIndex = 0;
        let sourceCount = 0;
        for (let index = 0; index < destinations.length; index += 1) {
          if (index !== destinationIndex && destinationCounts[index] > sourceCount) {
            sourceCount = destinationCounts[index];
            sourceIndex = index;
          }
        }
        const columnRoll = padLcgStep(savedState);
        const rowRoll = padLcgStep(columnRoll.state);
        savedState = rowRoll.state;
        let column = Math.floor(columnRoll.value * columns / 0x10000);
        let row = Math.floor(rowRoll.value * rows / 0x10000);
        for (let scanned = 0; scanned < rows * columns; scanned += 1) {
          if (randomMap[row][column] === destinations[sourceIndex]) {
            randomMap[row][column] = destinations[destinationIndex];
            destinationCounts[sourceIndex] -= 1;
            destinationCounts[destinationIndex] += 1;
            break;
          }
          column += 1;
          if (column >= columns) {
            column = 0;
            row = (row + 1) % rows;
          }
        }
        localCount += 1;
      }
    }
  }

  const assignments = [];
  for (let row = 0; row < rows; row += 1) {
    const lockedBits = Number(lockedRows?.[row] ?? 0) & 0xffff;
    for (let column = 0; column < columns; column += 1) {
      const type = randomMap[row][column];
      if (type < 0 || (lockedBits & (1 << column)) !== 0) continue;
      const currentType = Math.trunc(Number(boardTypes[row][column]));
      if (!padBlockSwapSourceEligible(currentType, effectiveSourceMask)) continue;
      effectFlags |= type === 6 ? 4 : type === 7 || type === 8 ? 2 : 1;
      assignments.push({ row, column, type });
    }
  }
  return { state: savedState, effectFlags, assignments, effectiveSourceMask };
}

// The native skill patterns are authored against the ordinary 6x5 board. The
// V/H writers relocate their packed byte before testing larger or smaller live
// boards, inserting a gap for 7x6 and compressing the canonical pattern below
// 6x5 with these exact bit operations.
export function padRelocateBoardXBits(mask, columns) {
  const bits = Number(mask) & 0xff;
  const width = Math.trunc(Number(columns) || 0);
  if (width >= 7) return ((bits & 0x07) | ((bits >>> 3) << 4)) & 0xff;
  if (width === 6) return bits;
  return ((bits & 0x07) | ((bits >>> 1) & 0x7c)) & 0xff;
}

export function padRelocateBoardYBits(mask, rows) {
  const bits = Number(mask) & 0xff;
  const height = Math.trunc(Number(rows) || 0);
  if (height >= 6) return ((bits & 0x03) | ((bits >>> 2) << 3)) & 0xff;
  if (height === 5) return bits;
  return ((bits & 0x07) | ((bits >>> 1) & 0x7c)) & 0xff;
}

// _doBlockSwapV/H (0x6ae64c/0x6ae8fc) choose one enabled destination type for
// every cell in selected columns/rows. Horizontal pattern bits are bottom-up;
// vertical bits are left-to-right. The saved LCG advances before lock rejection,
// unlike _doBitReplace's negative-destination path.
export function padResolveLineBlockSwaps(
  state,
  lineMask,
  destinationTypeMask,
  boardTypes,
  orientation,
  lockedRows = null,
  initialEffectFlags = 0,
) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  const validBoard = rows > 0 && columns > 0
    && boardTypes.every((row) => Array.isArray(row) && row.length === columns);
  const originalLineMask = Number(lineMask) & 0xff;
  let savedState = Number(state) >>> 0;
  if (originalLineMask === 0) return { state: savedState, effectFlags: 0, assignments: [], relocatedMask: 0 };
  let effectFlags = Number(initialEffectFlags) | 0;
  if (!validBoard) return { state: savedState, effectFlags, assignments: [], relocatedMask: originalLineMask };
  const horizontal = orientation === 'horizontal' || orientation === 'h';
  const relocatedMask = horizontal
    ? padRelocateBoardYBits(originalLineMask, rows)
    : padRelocateBoardXBits(originalLineMask, columns);
  const destinationMask = Number(destinationTypeMask) & 0x3ff;
  const destinationTypes = [];
  for (let type = 0; type <= 9; type += 1) {
    if ((destinationMask & (1 << type)) !== 0) destinationTypes.push(type);
  }
  const assignments = [];
  for (let row = 0; row < rows; row += 1) {
    const rowSelected = (relocatedMask & (1 << (rows - 1 - row))) !== 0;
    const lockedBits = Number(lockedRows?.[row] ?? 0) & 0xffff;
    for (let column = 0; column < columns; column += 1) {
      const selected = horizontal ? rowSelected : (relocatedMask & (1 << column)) !== 0;
      if (!selected) continue;
      const roll = padLcgStep(savedState);
      savedState = roll.state;
      const destinationIndex = destinationTypes.length
        ? Math.floor(roll.value * destinationTypes.length / 0x10000)
        : 0;
      const type = destinationTypes[destinationIndex] ?? 0;
      if ((lockedBits & (1 << column)) !== 0) continue;
      effectFlags |= type === 6 ? 4 : type === 7 || type === 8 ? 2 : 1;
      assignments.push({ row, column, type });
    }
  }
  return { state: savedState, effectFlags, assignments, relocatedMask };
}

// _doBlockSwap3 (0x6aea98) reads up to seven non-negative types from its skill
// record, seeds three copies of each, fills the remaining distribution with
// saved-LCG choices, and finally performs the ordinary two-step combined-seed
// shuffle. Locked/already-matching cells consume their row-major shuffled slot.
export function padResolveSkillBoardSwap(state, skillTypes, boardTypes, lockedRows = null) {
  const rows = Array.isArray(boardTypes) ? boardTypes.length : 0;
  const columns = rows > 0 && Array.isArray(boardTypes[0]) ? boardTypes[0].length : 0;
  const validBoard = rows > 0 && columns > 0
    && boardTypes.every((row) => Array.isArray(row) && row.length === columns);
  let savedState = Number(state) >>> 0;
  if (!validBoard) return { state: savedState, assignments: [], distribution: [] };
  const destinations = [];
  for (const value of (Array.isArray(skillTypes) ? skillTypes : []).slice(0, 7)) {
    const type = Math.trunc(Number(value));
    if (type < 0) break;
    if (type <= 9) destinations.push(type);
  }
  if (destinations.length === 0) return { state: savedState, assignments: [], distribution: [] };
  const cellCount = rows * columns;
  const workingTypes = destinations.flatMap((type) => [type, type, type]);
  let nativeFillCount = destinations.length;
  while (nativeFillCount < cellCount) {
    const roll = padLcgStep(savedState);
    savedState = roll.state;
    const index = Math.floor(roll.value * destinations.length / 0x10000);
    workingTypes.push(destinations[index]);
    nativeFillCount += 1;
  }
  const shuffled = padShuffleBlockCandidates(savedState, workingTypes.slice(0, nativeFillCount));
  savedState = shuffled.state;
  const assignments = [];
  let distributionIndex = 0;
  for (let row = 0; row < rows; row += 1) {
    const lockedBits = Number(lockedRows?.[row] ?? 0) & 0xffff;
    for (let column = 0; column < columns; column += 1) {
      const type = shuffled.candidates[distributionIndex];
      distributionIndex += 1;
      if (type === undefined || type === Math.trunc(Number(boardTypes[row][column]))
        || (lockedBits & (1 << column)) !== 0) continue;
      assignments.push({ row, column, type });
    }
  }
  return {
    state: savedState,
    assignments,
    distribution: shuffled.candidates.slice(0, cellCount),
  };
}

// makeBlockFlagByPassiveSkill (0x6add50) and _doBlockSwapMain share one byte:
// checked jammer=0x80, jammer resistance=0x10, jammer presentation=0x20;
// checked poison=0x08, poison resistance=0x01, poison presentation=0x02.
// Resistance suppresses the write after all caller-side selection/RNG work.
export function padResolveBlockSwapPassive(assignments, initialEffectFlags = 0, blockFlag = null) {
  let byte = typeof blockFlag === 'number'
    ? Number(blockFlag) & 0xff
    : Number(blockFlag?.byte ?? 0) & 0xff;
  let effectFlags = Number(initialEffectFlags) | 0;
  const applied = [];
  for (const assignment of Array.isArray(assignments) ? assignments : []) {
    const type = Math.trunc(Number(assignment.type));
    if (type === 6 && blockFlag !== null && blockFlag !== undefined) {
      if ((byte & 0x80) === 0) {
        byte |= 0x80;
        if (typeof blockFlag === 'object' && blockFlag.jammerResist) byte |= 0x10;
      }
      if ((byte & 0x10) !== 0) {
        byte |= 0x20;
        continue;
      }
    } else if ((type === 7 || type === 8) && blockFlag !== null && blockFlag !== undefined) {
      if ((byte & 0x08) === 0) {
        byte |= 0x08;
        if (typeof blockFlag === 'object' && blockFlag.poisonResist) byte |= 0x01;
      }
      if ((byte & 0x01) !== 0) {
        byte |= 0x02;
        continue;
      }
    }
    effectFlags |= type === 6 ? 4 : type === 7 || type === 8 ? 2 : 1;
    applied.push(assignment);
  }
  if (blockFlag && typeof blockFlag === 'object') blockFlag.byte = byte;
  return { assignments: applied, effectFlags, blockFlag: byte };
}

// The same native routine builds its candidates from numeric block types
// 0..5, optionally extends the range through jammer type 6, removes the type
// supplied in w1, and can suppress heart type 5. It returns the first element
// of the shuffled list while persisting only the two global LCG advances.
export function padGetRandomBlock(
  state,
  excludedType = -1,
  includeJammer = false,
  includeHeart = true,
) {
  const candidates = [];
  const typeCount = includeJammer ? 7 : 6;
  for (let type = 0; type < typeCount; type += 1) {
    if (type !== excludedType && (type !== 5 || includeHeart)) candidates.push(type);
  }
  const shuffled = padShuffleBlockCandidates(state, candidates);
  return { state: shuffled.state, type: shuffled.candidates[0] ?? 0 };
}

// cGAMEMAIN::_getRandomBlockOnFace (0x6179fc) queries types 0..4 and, when
// enabled, heart type 5. A type is eligible when the query returns at least
// one. An empty face returns -1 without consuming RNG; every non-empty face
// uses the same two persisted LCG advances and local forward shuffle as
// _getRandomBlock. Its optional pointer receives the second shuffled type.
// Keep the face-count query outside this primitive because the native source
// depends on live board/game-work data that is not packaged in the APK.
export function padGetRandomBlockOnFace(state, faceCounts, includeHeart = true) {
  const candidates = [];
  const typeCount = includeHeart ? 6 : 5;
  for (let type = 0; type < typeCount; type += 1) {
    const count = Array.isArray(faceCounts)
      ? faceCounts[type]
      : faceCounts instanceof Map ? faceCounts.get(type) : faceCounts?.[type];
    if (Number(count) >= 1) candidates.push(type);
  }
  if (!candidates.length) {
    return { state: Number(state) >>> 0, type: -1, alternateType: null };
  }
  const shuffled = padShuffleBlockCandidates(state, candidates);
  return {
    state: shuffled.state,
    type: shuffled.candidates[0],
    alternateType: shuffled.candidates[1] ?? null,
  };
}

export function padAttributeMultiplier(attacker, defender) {
  if ((attacker === 'fire' && defender === 'wood') ||
      (attacker === 'wood' && defender === 'water') ||
      (attacker === 'water' && defender === 'fire')) return 2;
  if ((attacker === 'wood' && defender === 'fire') ||
      (attacker === 'water' && defender === 'wood') ||
      (attacker === 'fire' && defender === 'water')) return 0.5;
  if ((attacker === 'light' && defender === 'dark') ||
      (attacker === 'dark' && defender === 'light')) return 2;
  return 1;
}

export function padMatchPower(attack, matchSizes) {
  return matchSizes.reduce((total, size) => total + attack * padOrbMatchMultiplier(size), 0);
}

export function padEnhancedOrbMultiplier(enhancedCount) {
  const count = Math.max(0, Math.trunc(Number(enhancedCount) || 0));
  return padEnhancementPowerMultiplier(Array(count).fill(PAD_ENHANCED_ORB_BONUS));
}

// _checkXYdir (0x666c18) starts this lane at 1.0f, then adds each matched
// sBLOCK+0x08 value with an AArch64 fadd/str pair at 0x667a6c-0x667a74.
// Preserve the sequential binary32 additions: modern data can provide values
// other than the classic +0.06, including negative block-minus values.
export function padEnhancementPowerMultiplier(enhancementPowers) {
  const powers = Array.isArray(enhancementPowers) ? enhancementPowers : [enhancementPowers];
  return powers.reduce((multiplier, power) => {
    const numeric = Number(power);
    return Math.fround(multiplier + Math.fround(Number.isFinite(numeric) ? numeric : 0));
  }, Math.fround(1));
}

function padMatchEnhancementMultiplier(match) {
  if (typeof match === 'number') return Math.fround(1);
  if (Number.isFinite(Number(match.enhancementMultiplier))) {
    return Math.fround(Number(match.enhancementMultiplier));
  }
  return Math.fround(padEnhancedOrbMultiplier(match.enhancedCount || 0));
}

function padFloat32Multiply(left, right) {
  return Math.fround(Math.fround(left) * Math.fround(right));
}

// libpad keeps a per-card integer base lane. _calcCharge adds each same-color
// match to that lane before _gamePhaseComboWait invokes _applyComboMul for the
// completed combo. sCARD::dmgUpBase then recomputes the current lane from the
// accumulated base with izMathCeiling. Keep the two rounding boundaries
// separate: round each match into the integer base, sum, then round the final
// combo multiplication once. Later attack multipliers route through
// sCARD::dmgUp and round positive values with +0.5. _calcAttackPow then applies
// elemental advantage with izMathCeilingSint64.
export function padNativeBaseAttackPower(attack, matchSizes, combos, extraComboBonus = PAD_EXTRA_COMBO_BONUS) {
  const comboMultiplier = Math.fround(padComboMultiplier(combos, extraComboBonus));
  const baseAttack = matchSizes.reduce((total, match) => {
    const size = typeof match === 'number' ? match : match.size;
    const orbScaled = padFloat32Multiply(attack, padOrbMatchMultiplier(size));
    const enhancedScaled = padFloat32Multiply(orbScaled, padMatchEnhancementMultiplier(match));
    return total + Math.ceil(enhancedScaled);
  }, 0);
  return Math.ceil(padFloat32Multiply(baseAttack, comboMultiplier));
}

// _buildAttackCharge keeps secondary and tertiary attributes in separate
// integer attack lanes. A natural secondary divides by 10 when it repeats the
// main attribute and by 3 when it differs. An attribute-change awakening takes
// the dedicated 15% branch instead. All paths call the native ceiling helper
// before match scaling.
export function padSecondaryAttributeAttack(attack, mainAttribute, secondaryAttribute, attributeChanged = false) {
  if (!secondaryAttribute) return 0;
  const value = Math.fround(Math.max(0, Number(attack) || 0));
  if (attributeChanged) return Math.ceil(padFloat32Multiply(value, PAD_CHANGED_SECONDARY_ATTRIBUTE_RATIO));
  return Math.ceil(Math.fround(value / (mainAttribute === secondaryAttribute ? 10 : 3)));
}

// The lane-index 2 path in _buildAttackCharge multiplies by the exact float
// 0.05 and rounds upward. Unlike a secondary attribute, its element does not
// alter the base ratio.
export function padTertiaryAttributeAttack(attack, tertiaryAttribute) {
  if (!tertiaryAttribute) return 0;
  return Math.ceil(padFloat32Multiply(Math.max(0, Number(attack) || 0), PAD_TERTIARY_ATTRIBUTE_RATIO));
}

export function padApplyAttackMultipliers(attack, multipliers) {
  return multipliers.reduce((value, multiplier) =>
    Math.trunc(Math.fround(padFloat32Multiply(value, multiplier) + 0.5)), attack);
}

// _calcFinalRecPow keeps its per-card recovery contributions in single-
// precision registers, accumulates those floats, then converts the final sum
// to an integer with fcvtzs. Accept either the team total or the six native
// card values; the latter preserves per-card float additions for callers that
// model recovery modifiers.
export function padNativeRecoveryPower(
  recoveries,
  heartMatches,
  combos,
  extraComboBonus = PAD_EXTRA_COMBO_BONUS,
  recoveryMultiplier = 1,
) {
  const cardRecoveries = Array.isArray(recoveries) ? recoveries : [recoveries];
  const matchPower = heartMatches.reduce((total, match) => {
    const size = typeof match === 'number' ? match : match.size;
    const contribution = padFloat32Multiply(padOrbMatchMultiplier(size), padMatchEnhancementMultiplier(match));
    return Math.fround(total + contribution);
  }, Math.fround(0));
  const comboMultiplier = Math.fround(padComboMultiplier(combos, extraComboBonus));
  const total = cardRecoveries.reduce((sum, recovery) => {
    const matchScaled = padFloat32Multiply(Math.max(0, Number(recovery) || 0), matchPower);
    const comboScaled = padFloat32Multiply(matchScaled, comboMultiplier);
    return Math.fround(sum + comboScaled);
  }, Math.fround(0));
  return Math.trunc(padFloat32Multiply(total, Math.fround(Number(recoveryMultiplier) || 0)));
}

export function padDamageAfterDefense(
  attack,
  attributeMultiplier,
  defense,
  damageCap = PAD_INT32_MAX,
  minimumDamage = 1,
) {
  // _calcAttackPow (0x67f198) rounds attribute scaling first, clamps that
  // integer lane to the card's damage cap, subtracts defense, and only then
  // applies the caller-supplied minimum damage. A null card takes INT32_MAX as
  // its cap; modern cap-breaking cards can supply a larger 64-bit value.
  const attributeDamage = Math.ceil(Math.max(0, Number(attack) || 0) * Math.max(0, Number(attributeMultiplier) || 0));
  const cap = Math.max(0, Math.trunc(Number(damageCap) || 0));
  const defended = Math.min(attributeDamage, cap) - Math.max(0, Math.trunc(Number(defense) || 0));
  return Math.max(Math.max(0, Math.trunc(Number(minimumDamage) || 0)), defended);
}

// _chcekDamageRatio4DamageDisp (0x684274) reads the type-72 passive lane for
// the attacking attribute. 100 is the native no-resist sentinel; other values
// are interpreted as percentage reduction in binary32 before _calcAttackPow
// widens the ratio, multiplies the post-defense integer, and rounds upward.
export function padEnemyAttributeResistDamage(damage, shieldPercent) {
  return padEnemyDamageAfterShields(damage, shieldPercent, null);
}

// The tail of _chcekDamageRatio4DamageDisp multiplies an active type-74
// all-damage shield into the type-72 attribute ratio in binary32. calcAttackPow
// then rounds the combined post-defense product upward exactly once.
export function padEnemyDamageAfterShields(
  damage,
  attributeShieldPercent = 100,
  damageShieldPercent = null,
) {
  const incoming = Math.max(0, Math.trunc(Number(damage) || 0));
  const nativePercent = Math.trunc(Number(attributeShieldPercent) || 0) & 0xffff;
  let ratio = nativePercent === 100
    ? Math.fround(1)
    : Math.fround(Math.fround(100 - nativePercent) / Math.fround(100));
  if (damageShieldPercent !== null && damageShieldPercent !== undefined) {
    const clampedShield = Math.min(100, Math.max(
      0,
      Math.trunc(Number(damageShieldPercent) || 0),
    ));
    const shieldRatio = Math.fround(
      Math.fround(100 - clampedShield) / Math.fround(100),
    );
    ratio = Math.fround(ratio * shieldRatio);
  }
  return Math.max(0, Math.ceil(incoming * ratio));
}

// Type 73 stores its low-16-bit threshold at sMONSTER+0xafc. attack2Enemy
// computes this boundary in binary64 and passes it through izMathCeilingSint64.
export function padEnemyResolveThresholdHp(maxHp, thresholdPercent) {
  const hp = Math.max(0, Math.trunc(Number(maxHp) || 0));
  const percent = Math.trunc(Number(thresholdPercent) || 0) & 0xffff;
  return percent === 0 ? 0 : Math.ceil((hp / 100) * percent);
}

// _calcCharge (0x64f220) runs izMathCeiling for every poison combo before it
// adds that combo to the deferred HP-damage accumulator at game-work+0x8aacc.
export function padPoisonDamage(maxHp, poisonMatchSizes = [], mortalPoisonMatchSizes = []) {
  const hp = Math.max(0, Number(maxHp) || 0);
  let total = 0;
  const addMatches = (matchSizes, percent) => matchSizes.forEach((size) => {
    // _calcCharge builds the +25%-per-extra-orb factor in s registers,
    // widens it to d, then multiplies max HP, percentage, and divides by
    // 100 before izMathCeiling. Preserve that order: hp * 0.2 first is not
    // equivalent at every binary64 integer boundary.
    const orbMultiplier = Math.fround(padOrbMatchMultiplier(size));
    total = Math.min(PAD_INT32_MAX, total + Math.ceil((hp * orbMultiplier * percent) / 100));
  });
  addMatches(poisonMatchSizes, PAD_POISON_MAX_HP_RATIO * 100);
  addMatches(mortalPoisonMatchSizes, PAD_MORTAL_POISON_MAX_HP_RATIO * 100);
  return total;
}

// cGAMEMAIN::_checkBomb (0x66a9f8) calculates and accumulates the HP hit once
// per detonating bomb. Preserve that per-bomb ceiling instead of rounding the
// combined ratio, which differs whenever max HP is not divisible by five.
export function padBombDamage(maxHp, bombCount = 1) {
  const hp = Math.max(0, Number(maxHp) || 0);
  const count = Math.max(0, Math.trunc(Number(bombCount) || 0));
  const perBomb = Math.ceil((hp * (PAD_BOMB_MAX_HP_RATIO * 100)) / 100);
  return Math.min(PAD_INT32_MAX, perBomb * count);
}

// _swapBlockMain (0x67a7a0) reads sBLOCK+0x0c & 0x7f, divides by 100,
// multiplies maximum HP, and passes the result through izMathCeiling.
export function padThornDamage(maxHp, percent = PAD_DEFAULT_THORN_HP_PERCENT) {
  const hp = Math.max(0, Number(maxHp) || 0);
  const rate = Math.max(0, Math.min(0x7f, Math.trunc(Number(percent) || 0)));
  return Math.ceil(hp * rate / 100);
}

// Android may coalesce pointer motion. The native normal-board swap routine
// rejects diagonal neighbours, so a sparse event must be expanded into the
// orthogonal grid boundaries crossed by its line segment. Exact corner ties are
// resolved horizontally first and never become a one-step diagonal swap.
export function tracePadDragCells(fromRow, fromColumn, toRow, toColumn, allowDiagonal = false) {
  if (![fromRow, fromColumn, toRow, toColumn].every(Number.isInteger)) {
    throw new Error('PAD drag coordinates must be integer cells.');
  }
  const rowDelta = toRow - fromRow;
  const columnDelta = toColumn - fromColumn;
  const rowDistance = Math.abs(rowDelta);
  const columnDistance = Math.abs(columnDelta);
  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);
  let row = fromRow;
  let column = fromColumn;
  let rowCrossing = rowDistance ? 0.5 / rowDistance : Infinity;
  let columnCrossing = columnDistance ? 0.5 / columnDistance : Infinity;
  const rowIncrement = rowDistance ? 1 / rowDistance : Infinity;
  const columnIncrement = columnDistance ? 1 / columnDistance : Infinity;
  const cells = [];
  while (row !== toRow || column !== toColumn) {
    if (allowDiagonal && row !== toRow && column !== toColumn && columnCrossing === rowCrossing) {
      row += rowStep;
      column += columnStep;
      rowCrossing += rowIncrement;
      columnCrossing += columnIncrement;
    } else if (column !== toColumn && columnCrossing <= rowCrossing) {
      column += columnStep;
      columnCrossing += columnIncrement;
    } else {
      row += rowStep;
      rowCrossing += rowIncrement;
    }
    cells.push({ row, column });
  }
  return cells;
}

function clampGridCoordinate(value, extent) {
  return Math.max(0, Math.min(extent - Number.EPSILON * extent, value));
}

export function tracePadPointerCells(
  fromRow,
  fromColumn,
  fromGridColumn,
  fromGridRow,
  toGridColumn,
  toGridRow,
  rowCount = PAD_BOARD_ROWS,
  columnCount = PAD_BOARD_COLUMNS,
  allowDiagonal = false,
) {
  if (![fromRow, fromColumn, rowCount, columnCount].every(Number.isInteger) ||
      ![fromGridColumn, fromGridRow, toGridColumn, toGridRow].every(Number.isFinite) ||
      rowCount <= 0 || columnCount <= 0) {
    throw new Error('PAD pointer traversal requires finite grid coordinates and integer dimensions.');
  }
  const startColumn = clampGridCoordinate(fromGridColumn, columnCount);
  const startRow = clampGridCoordinate(fromGridRow, rowCount);
  const endColumn = clampGridCoordinate(toGridColumn, columnCount);
  const endRow = clampGridCoordinate(toGridRow, rowCount);
  const targetColumn = Math.floor(endColumn);
  const targetRow = Math.floor(endRow);
  if (fromRow === targetRow && fromColumn === targetColumn) return [];

  const columnDelta = endColumn - startColumn;
  const rowDelta = endRow - startRow;
  const columnStep = Math.sign(columnDelta);
  const rowStep = Math.sign(rowDelta);
  let columnCrossing = columnStep > 0
    ? (Math.floor(startColumn) + 1 - startColumn) / columnDelta
    : columnStep < 0 ? (startColumn - Math.floor(startColumn)) / -columnDelta : Infinity;
  let rowCrossing = rowStep > 0
    ? (Math.floor(startRow) + 1 - startRow) / rowDelta
    : rowStep < 0 ? (startRow - Math.floor(startRow)) / -rowDelta : Infinity;
  const columnIncrement = columnStep ? 1 / Math.abs(columnDelta) : Infinity;
  const rowIncrement = rowStep ? 1 / Math.abs(rowDelta) : Infinity;
  let row = fromRow;
  let column = fromColumn;
  const cells = [];
  while (row !== targetRow || column !== targetColumn) {
    if (allowDiagonal && row !== targetRow && column !== targetColumn && columnCrossing === rowCrossing) {
      row += rowStep;
      column += columnStep;
      rowCrossing += rowIncrement;
      columnCrossing += columnIncrement;
    } else if (column !== targetColumn && columnCrossing <= rowCrossing) {
      column += columnStep;
      columnCrossing += columnIncrement;
    } else {
      row += rowStep;
      rowCrossing += rowIncrement;
    }
    cells.push({ row, column });
  }
  return cells;
}

function matchShape(cells, rowCount, columnCount) {
  const coordinates = new Set(cells.map(({ row, column }) => `${row}:${column}`));
  const rows = new Set(cells.map(({ row }) => row));
  const columns = new Set(cells.map(({ column }) => column));
  const isHorizontal = rows.size === 1;
  const isVertical = columns.size === 1;
  const isRow = [...rows].some((row) =>
    Array.from({ length: columnCount }, (_, column) => coordinates.has(`${row}:${column}`)).every(Boolean));
  const isColumn = [...columns].some((column) =>
    Array.from({ length: rowCount }, (_, row) => coordinates.has(`${row}:${column}`)).every(Boolean));
  const isBox = cells.length === 9 && rows.size === 3 && columns.size === 3 &&
    [...rows].every((row) => [...columns].every((column) => coordinates.has(`${row}:${column}`)));
  const isCross = cells.length === 5 && cells.some(({ row, column }) =>
    coordinates.has(`${row - 1}:${column}`) && coordinates.has(`${row + 1}:${column}`) &&
    coordinates.has(`${row}:${column - 1}`) && coordinates.has(`${row}:${column + 1}`));
  const isL = cells.length === 5 && cells.some(({ row, column }) => {
    const arms = [
      [[1, 0], [2, 0], [0, 1], [0, 2]],
      [[-1, 0], [-2, 0], [0, 1], [0, 2]],
      [[1, 0], [2, 0], [0, -1], [0, -2]],
      [[-1, 0], [-2, 0], [0, -1], [0, -2]],
    ];
    return arms.some((offsets) => offsets.every(([dr, dc]) => coordinates.has(`${row + dr}:${column + dc}`)));
  });
  return { isHorizontal, isVertical, isRow, isColumn, isBox, isCross, isL };
}

export function findPadMatches(board, getType = (cell) => cell?.type, minimum = PAD_MINIMUM_MATCH) {
  const rowCount = board.length;
  const columnCount = board[0]?.length || 0;
  if (!rowCount || !columnCount || board.some((row) => row.length !== columnCount)) {
    throw new Error('PAD board must be a non-empty rectangle.');
  }
  const marked = Array.from({ length: rowCount }, () => Array(columnCount).fill(false));
  for (let row = 0; row < rowCount; row += 1) {
    let start = 0;
    while (start < columnCount) {
      const type = getType(board[row][start]);
      let end = start + 1;
      while (end < columnCount && getType(board[row][end]) === type) end += 1;
      if (type != null && end - start >= minimum) {
        for (let column = start; column < end; column += 1) marked[row][column] = true;
      }
      start = end;
    }
  }
  for (let column = 0; column < columnCount; column += 1) {
    let start = 0;
    while (start < rowCount) {
      const type = getType(board[start][column]);
      let end = start + 1;
      while (end < rowCount && getType(board[end][column]) === type) end += 1;
      if (type != null && end - start >= minimum) {
        for (let row = start; row < end; row += 1) marked[row][column] = true;
      }
      start = end;
    }
  }

  const visited = Array.from({ length: rowCount }, () => Array(columnCount).fill(false));
  const matches = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (!marked[row][column] || visited[row][column]) continue;
      const type = getType(board[row][column]);
      const cells = [];
      const queue = [{ row, column }];
      visited[row][column] = true;
      for (let index = 0; index < queue.length; index += 1) {
        const cell = queue[index];
        cells.push(cell);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nextRow = cell.row + dr;
          const nextColumn = cell.column + dc;
          if (nextRow < 0 || nextRow >= rowCount || nextColumn < 0 || nextColumn >= columnCount ||
              visited[nextRow][nextColumn] || !marked[nextRow][nextColumn] ||
              getType(board[nextRow][nextColumn]) !== type) continue;
          visited[nextRow][nextColumn] = true;
          queue.push({ row: nextRow, column: nextColumn });
        }
      }
      matches.push({
        type,
        cells,
        size: cells.length,
        isMassAttack: cells.length >= PAD_MASS_ATTACK_ORBS,
        ...matchShape(cells, rowCount, columnCount),
      });
    }
  }
  return matches;
}

// A bomb already marked by normal match detection clears as part of that combo
// and never explodes. Every remaining type-9 bomb detonates independently. Its
// cross skips other bombs so they can each run their own damage/effect path.
export function findPadBombDetonations(
  board,
  matches,
  getType = (cell) => cell?.type,
  bombType = 'bomb',
) {
  const rowCount = board.length;
  const columnCount = board[0]?.length || 0;
  if (!rowCount || !columnCount || board.some((row) => row.length !== columnCount)) {
    throw new Error('PAD board must be a non-empty rectangle.');
  }
  const matched = new Set();
  matches.forEach((match) => match.cells.forEach(({ row, column }) => matched.add(`${row}:${column}`)));
  const bombs = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (getType(board[row][column]) === bombType && !matched.has(`${row}:${column}`)) {
        bombs.push({ row, column });
      }
    }
  }

  const cleared = new Map();
  const add = (row, column) => cleared.set(`${row}:${column}`, { row, column });
  bombs.forEach(({ row, column }) => {
    add(row, column);
    for (let nextColumn = 0; nextColumn < columnCount; nextColumn += 1) {
      if (getType(board[row][nextColumn]) !== bombType) add(row, nextColumn);
    }
    for (let nextRow = 0; nextRow < rowCount; nextRow += 1) {
      if (getType(board[nextRow][column]) !== bombType) add(nextRow, column);
    }
  });
  return { bombs, cells: [...cleared.values()] };
}
