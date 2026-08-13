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
  return Math.trunc(total);
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
