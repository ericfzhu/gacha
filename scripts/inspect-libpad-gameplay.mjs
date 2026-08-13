#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ApkArchive } from '../src/binary-port/apk.js';
import { parseElf64 } from '../src/binary-port/elf64.js';

const APK_LIBPAD_PATH = 'lib/arm64-v8a/libpad.so';
const PAD_21_9_LIBPAD_SHA256 = '785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8';
const PAD_21_9_RESTORED_SHA256 = '91223570f42247f155e50fba03e529f2a21b936021bd1525928237a5c87cd99a';
const ENEMY_SKILL_DISPATCH_TABLE = 0xd3cbe0;
const ENEMY_SKILL_DISPATCH_BASE = 0x628fe0;
const EARLY_ENEMY_SKILL_DISPATCH_TABLE = 0xd3caea;
const EARLY_ENEMY_SKILL_DISPATCH_BASE = 0x6286b4;
const ENEMY_SKILL_SETUP_TABLE = 0xd3c99c;
const ENEMY_SKILL_SETUP_BASE = 0x61fee4;
const ENEMY_SKILL_CONDITION_TABLE = 0xd3c6fc;
const ENEMY_SKILL_CONDITION_BASE = 0x61a630;
const BLACK_FALL_ENEMY_SKILL_TYPE = 128;
const BLACK_FALL_HANDLER = 0x62a854;
const BLACK_FALL_SETUP_HANDLER = 0x6211a0;
const SOURCE_TO_POISON_ENEMY_SKILL_TYPE = 56;
const SOURCE_TO_MORTAL_POISON_ENEMY_SKILL_TYPE = 58;
const SOURCE_TO_POISON_HANDLER = 0x62917c;
const SOURCE_TO_POISON_SETUP_HANDLER = 0x61ff08;
const SOURCE_TO_POISON_CONDITION_HANDLER = 0x61a63c;
const POISON_BLOCKS_ENEMY_SKILL_TYPE = 57;
const MORTAL_POISON_BLOCKS_ENEMY_SKILL_TYPE = 59;
const POISON_BLOCKS_HANDLER = 0x6291b8;
const POISON_BLOCKS_SETUP_HANDLER = 0x61fee4;
const POISON_BLOCKS_CONDITION_HANDLER = 0x61a6a0;
const POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE = 60;
const MORTAL_POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE = 61;
const POISON_BLOCK_N_COUNTED_HANDLER = 0x6291e0;
const POISON_BLOCK_N_COUNTED_SETUP_HANDLER = 0x61fee4;
const POISON_BLOCK_N_COUNTED_CONDITION_HANDLER = 0x61a710;
const POISON_BLOCK_N_ENEMY_SKILL_TYPE = 64;
const POISON_BLOCK_N_HANDLER = 0x628ccc;
const POISON_BLOCK_N_SETUP_HANDLER = 0x6203f8;
const POISON_BLOCK_N_CONDITION_HANDLER = 0x61aac4;
const HORIZONTAL_LINES_ENEMY_SKILL_TYPE = 79;
const HORIZONTAL_LINES_HANDLER = 0x6287f8;
const HORIZONTAL_LINES_SETUP_HANDLER = 0x61ff14;
const HORIZONTAL_LINES_CONDITION_HANDLER = 0x61a630;
const HORIZONTAL_LINES_4_ENEMY_SKILL_TYPE = 78;
const HORIZONTAL_LINES_4_HANDLER = 0x629ce0;
const HORIZONTAL_LINES_4_SETUP_HANDLER = 0x61ff14;
const HORIZONTAL_LINES_4_CONDITION_HANDLER = 0x61a630;
const VERTICAL_LINES_ENEMY_SKILL_TYPE = 77;
const VERTICAL_LINES_HANDLER = 0x628d3c;
const VERTICAL_LINES_SETUP_HANDLER = 0x61ff14;
const VERTICAL_LINES_CONDITION_HANDLER = 0x61a630;
const VERTICAL_LINES_4_ENEMY_SKILL_TYPE = 76;
const VERTICAL_LINES_4_HANDLER = 0x629c60;
const VERTICAL_LINES_4_SETUP_HANDLER = 0x61ff14;
const VERTICAL_LINES_4_CONDITION_HANDLER = 0x61a630;
const POISON_TYPE_LIST_ENEMY_SKILL_TYPE = 81;
const POISON_TYPE_LIST_HANDLER = 0x628de0;
const POISON_TYPE_LIST_SETUP_HANDLER = 0x620100;
const POISON_TYPE_LIST_CONDITION_HANDLER = 0x61a630;
const POISON_TYPE_LIST_DIRECT_ENEMY_SKILL_TYPE = 80;
const POISON_TYPE_LIST_DIRECT_HANDLER = 0x629d60;
const POISON_TYPE_LIST_DIRECT_SETUP_HANDLER = 0x620100;
const POISON_TYPE_LIST_DIRECT_CONDITION_HANDLER = 0x61a630;
const POISON_MASK_DIRECT_ENEMY_SKILL_TYPE = 84;
const POISON_MASK_DIRECT_HANDLER = 0x629d84;
const POISON_MASK_DIRECT_SETUP_HANDLER = 0x62004c;
const POISON_MASK_DIRECT_CONDITION_HANDLER = 0x61a630;
const POISON_MASK_ENEMY_SKILL_TYPE = 85;
const POISON_MASK_HANDLER = 0x628e48;
const POISON_MASK_SETUP_HANDLER = 0x62004c;
const POISON_MASK_CONDITION_HANDLER = 0x61a630;
const BLOCK_MINUS_ENEMY_SKILL_TYPE = 151;
const BLOCK_MINUS_HANDLER = 0x62afd0;
const BLOCK_MINUS_SETUP_HANDLER = 0x6217c0;
const BLOCK_MINUS_CONDITION_HANDLER = 0x61bab4;
const BUR_DROP_ENEMY_SKILL_TYPE = 153;
const BUR_DROP_HANDLER = 0x62b0d0;
const BUR_DROP_SETUP_HANDLER = 0x6217c0;
const BUR_DROP_CONDITION_HANDLER = 0x61ba04;

const GAMEPLAY_SYMBOLS = Object.freeze([
  ['input', 'walk1step', '_ZN9cGAMEMAIN10_walk1stepEv', 0x647c28],
  ['input', 'checkXYdir', '_ZN9cGAMEMAIN11_checkXYdirEfRfRiS1_RNS_12sCHECKXYARGSE', 0x666c18],
  ['input', 'isNeighborBlock', '_ZN9cGAMEMAIN16_isNeighborBlockEP6sBLOCKS1_', 0x673e24],
  ['input', 'swapBlockMain', '_ZN9cGAMEMAIN14_swapBlockMainEP6sBLOCKS1_', 0x67a7a0],
  ['input', 'swapBlock', '_ZN9cGAMEMAIN10_swapBlockEbP6sBLOCKS1_', 0x67ab14],
  ['input', 'gamePhaseMove', '_ZN9cGAMEMAIN14_gamePhaseMoveEv', 0x680854],
  ['board', 'getBoardSize', '_ZNK9cGAMEMAIN13_getBoardSizeEP9IS_V2D_SB', 0x651f24],
  ['board', 'getRandomBlock', '_ZN9cGAMEMAIN15_getRandomBlockEibb', 0x617874],
  ['board', 'getRandomBlockOnFace', '_ZN9cGAMEMAIN21_getRandomBlockOnFaceEPibbb', 0x6179fc],
  ['board', 'countBlockBits', '_ZNK9cGAMEMAIN15_countBlockBitsEt', 0x651fa4],
  ['board', 'countBlockType', '_ZNK9cGAMEMAIN15_countBlockTypeEi', 0x65213c],
  ['board', 'spawnNewBlock', '_ZN9cGAMEMAIN14_spawnNewBlockERjj', 0x661978],
  ['board', 'spawnNewBlockInBits', '_ZN9cGAMEMAIN20_spawnNewBlockInBitsEt', 0x62771c],
  ['board', 'buildBlockList', '_ZN9cGAMEMAIN15_buildBlockListEPfj', 0x6615e8],
  ['board', 'initBlocksBody', '_ZN9cGAMEMAIN12__initBlocksEv', 0x661f10],
  ['board', 'isEnableTopLine', '_ZNK9cGAMEMAIN16_isEnableTopLineEv', 0x6401d0],
  ['orb-state', 'setupPlusBoostEffect', '_ZN9cGAMEMAIN21_setupPlusBoostEffectEPK6sBLOCKRf', 0x4361dc],
  ['orb-state', 'makeBlockFlagByPassiveSkill', '_ZN9cGAMEMAIN27makeBlockFlagByPassiveSkillEP10sBLOCKFLAGi', 0x6add50],
  ['orb-state', 'doLockDropBits', '_ZN9cGAMEMAIN15_doLockDropBitsEjit', 0x62676c],
  ['orb-state', 'checkLockFall', '_ZNK9cGAMEMAIN14_checkLockFallEP6sBLOCK', 0x626200],
  ['orb-state', 'checkPassiveSkill4Block', '_ZN9cGAMEMAIN24_checkPassiveSkill4BlockEP6sBLOCKb', 0x64131c],
  ['orb-state', 'doEntireBlack2', '_ZN9cGAMEMAIN15_doEntireBlack2EiPKtPK8sMONSTER', 0x627118],
  ['orb-state', 'doMakeInvDropEfc', '_ZN9cGAMEMAIN17_doMakeInvDropEfcEb', 0x627e58],
  ['orb-state', 'clearBlackFall', '_ZN9cGAMEMAIN15_clearBlackFallEv', 0x6b57a0],
  ['orb-state', 'incEneTurn', '_ZN9cGAMEMAIN11_incEneTurnEb', 0x677978],
  ['orb-state', 'doEnemySkill', '_ZN9cGAMEMAIN13_doEnemySkillEP8sMONSTER', 0x6285a4],
  ['orb-state', 'addNailCounts', '_ZN9sGAMEWORK13addNailCountsEi', 0x422e60],
  ['orb-state', 'countPassiveSkills', '_ZNK9cGAMEMAIN19_countPassiveSkillsEiR8sSKILLBYbb', 0x63fa28],
  ['orb-state', 'hasBlockPowup', '_ZN9cGAMEMAIN14_hasBlockPowupEi', 0x6b0cc8],
  ['orb-state', 'setBlockPowup', '_ZN9cGAMEMAIN14_setBlockPowupEifb', 0x6b0db4],
  ['orb-state', 'doBlockMinus', '_ZN9cGAMEMAIN13_doBlockMinusEbjfi', 0x61caa0],
  ['orb-state', 'doMakeBurDrop', '_ZN9cGAMEMAIN14_doMakeBurDropEbjjtb', 0x61ce38],
  ['orb-state', 'countNonPoisonBlocks', '_ZN9cGAMEMAIN21_countNonPoisonBlocksEb', 0x61c250],
  ['orb-state', 'doPoisonBlockN', '_ZN9cGAMEMAIN15_doPoisonBlockNEiib', 0x626bf0],
  ['orb-state', 'doPoisonBlocks', '_ZN9cGAMEMAIN15_doPoisonBlocksEiib', 0x626e78],
  ['orb-state', 'doPoisonBlockN2', '_ZN9cGAMEMAIN16_doPoisonBlockN2EijjbbPt', 0x61c344],
  ['orb-state', 'doBitReplace', '_ZN9cGAMEMAIN13_doBitReplaceEPKtiRiP10sBLOCKFLAG', 0x6adf2c],
  ['orb-state', 'doBlockSwapMain', '_ZN9cGAMEMAIN16_doBlockSwapMainEP6sBLOCKiRiP10sBLOCKFLAG', 0x6ae028],
  ['orb-state', 'doBlockSwap', '_ZN9cGAMEMAIN12_doBlockSwapEiibPb', 0x6afa84],
  ['orb-state', 'doBlockSwapNew', '_ZN9cGAMEMAIN15_doBlockSwapNewEPhiP10sBLOCKFLAGj', 0x6aee90],
  ['orb-state', 'doBlockSwap4', '_ZN9cGAMEMAIN13_doBlockSwap4EtP10sBLOCKFLAG', 0x6af6cc],
  ['orb-state', 'doBlockSwap5', '_ZN9cGAMEMAIN13_doBlockSwap5EttP10sBLOCKFLAG', 0x6af564],
  ['orb-state', 'doBlockSwapV', '_ZN9cGAMEMAIN13_doBlockSwapVEhjRiP10sBLOCKFLAG', 0x6ae64c],
  ['orb-state', 'doBlockSwapH', '_ZN9cGAMEMAIN13_doBlockSwapHEhjRiP10sBLOCKFLAG', 0x6ae8fc],
  ['orb-state', 'doBlockSwap2', '_ZN9cGAMEMAIN13_doBlockSwap2EiiiiP10sBLOCKFLAG', 0x6af838],
  ['orb-state', 'doBlockSwap3', '_ZN9cGAMEMAIN13_doBlockSwap3EPKN9sSAVEDATA11sSKILLDATA210sSKILLDATAE', 0x6aea98],
  ['board', 'setupDungeons', '_ZN9cGAMEMAIN14_setupDungeonsEv', 0x65ac0c],
  ['enemy-ai', 'chooseEnemyAi', '_ZN9cGAMEMAIN14_chooseEnemyAiEP8sMONSTER', 0x61dd68],
  ['enemy-ai', 'chooseEnemyAiNew', '_ZN9cGAMEMAIN17_chooseEnemyAiNewEP8sMONSTER', 0x61d450],
  ['enemy-ai', 'chooseEnemyAiSub', '_ZN9cGAMEMAIN17_chooseEnemyAiSubEP8sMONSTERPK10sENESKILLSf', 0x61a58c],
  ['enemy-ai', 'parseFlowControl', '_ZN9cGAMEMAIN17_parseFlowControlEP8sMONSTERPKN12sPADCARDDATA7sENEAISEPK10sENESKILLSdRi', 0x619ad0],
  ['enemy-ai', 'checkSameSkillOnTurn', '_ZNK9cGAMEMAIN20checkSameSkillOnTurnEi', 0x61da00],
  ['enemy-ai', 'setupEnemyAiTime', '_ZN9cGAMEMAIN17_setupEnemyAiTimeEP8sMONSTERPK10sENESKILLS', 0x61f5ac],
  ['enemy-ai', 'setupSkillWithAttack', '_ZN9cGAMEMAIN21_setupSkillWithAttackEP8sMONSTERPK10sENESKILLS', 0x61fcec],
  ['enemy-ai', 'setupEnemyAttackSub', '_ZN9cGAMEMAIN20_setupEnemyAttackSubEP8sMONSTERPK10sENESKILLS', 0x61fd78],
  ['enemy-ai', 'doEnemyAi', '_ZN9cGAMEMAIN10_doEnemyAiEP8sMONSTER', 0x622544],
  ['enemy-ai', 'setupEnemyAttack', '_ZN9cGAMEMAIN17_setupEnemyAttackEv', 0x622f64],
  ['enemy-ai', 'resetEnemyAtkLeft', '_ZN9cGAMEMAIN18_resetEnemyAtkLeftEP8sMONSTER', 0x6408f0],
  ['combat', 'setEnemyAttackMain', '_ZN9cGAMEMAIN20__setEnemyAttackMainEP8sMONSTERbfi', 0x62c2cc],
  ['match', 'checkCombos', '_ZN9cGAMEMAIN12_checkCombosEii', 0x659d24],
  ['match', 'checkFlood', '_ZN9cGAMEMAIN11_checkFloodEiiiRi', 0x666724],
  ['match', 'checkFlood4bomb', '_ZN9cGAMEMAIN16_checkFlood4bombEiiiRi', 0x6668e4],
  ['match', 'checkFlood2', '_ZN9cGAMEMAIN12_checkFlood2EiiRi', 0x666a78],
  ['match', 'checkErases', '_ZN9cGAMEMAIN12_checkErasesEv', 0x66c81c],
  ['match', 'checkFalls', '_ZN9cGAMEMAIN11_checkFallsEv', 0x673fbc],
  ['match', 'getComboDrop', '_ZNK9sSAVEDATA10sFLOORLIST12getComboDropEPa', 0x7752fc],
  ['match', 'addComboDropFlags', '_ZN9cGAMEMAIN18_addComboDropFlagsEi', 0x673d90],
  ['match', 'calcCombo', '_ZN9cGAMEMAIN10_calcComboEv', 0x651854],
  ['hazard', 'calcCharge', '_ZN9cGAMEMAIN11_calcChargeEv', 0x64f220],
  ['hazard', 'checkBomb', '_ZN9cGAMEMAIN10_checkBombEv', 0x66a9f8],
  ['hazard', 'gamePhaseWaitBombing', '_ZN9cGAMEMAIN21_gamePhaseWaitBombingEv', 0x668880],
  ['hazard', 'applyHpRecAndPoisonDamage', '_ZN9cGAMEMAIN26_applyHpRecAndPoisonDamageEv', 0x675b70],
  ['combat', 'calcCards', '_ZN9cGAMEMAIN10_calcCardsEv', 0x6537c4],
  ['combat', 'dmgUpBase', '_ZN5sCARD9dmgUpBaseEdf', 0x68363c],
  ['combat', 'dmgUp', '_ZN5sCARD5dmgUpEdfi', 0x683804],
  ['combat', 'applyComboMul', '_ZN9cGAMEMAIN14_applyComboMulEv', 0x683b50],
  ['combat', 'calcAttackPow', '_ZN9cGAMEMAIN14_calcAttackPowEPK5sCARDPNS0_7sATKINFExiP8sMONSTERbPxx', 0x67f198],
  ['combat', 'gamePhaseAttackExec', '_ZN9cGAMEMAIN20_gamePhaseAttackExecEv', 0x68a1f8],
  ['combat', 'gamePhaseEachTurn', '_ZN9cGAMEMAIN18_gamePhaseEachTurnEb', 0x67d2e0],
  ['targeting', 'initChoiceAtkTarget', '_ZN9cGAMEMAIN20_initChoiceAtkTargetEv', 0x6843e8],
  ['targeting', 'countAliveMonsters4target', '_ZN9cGAMEMAIN26_countAliveMonsters4targetEv', 0x6845a8],
  ['targeting', 'calcChoiceAtkTarget', '_ZN9cGAMEMAIN20_calcChoiceAtkTargetEbxibiPK5sCARD', 0x6855e0],
  ['targeting', 'calcFinalAttackPow4target', '_ZN9cGAMEMAIN26_calcFinalAttackPow4targetExiP8sMONSTERbPK5sCARD', 0x68463c],
  ['recovery', 'recPowSet', '_ZN9cGAMEMAIN10_recPowSetEf', 0x68637c],
  ['recovery', 'calcFinalRecPow', '_ZN9cGAMEMAIN16_calcFinalRecPowEv', 0x68641c],
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isElf(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46;
}

function hex(value) {
  return `0x${value.toString(16)}`;
}

function readUint16Virtual(elf, bytes, address) {
  const segment = elf?.loadSegments.find((candidate) => (
    address >= candidate.virtualAddress
    && address + 2 <= candidate.virtualAddress + candidate.fileSize
  ));
  if (!segment) return null;
  const offset = segment.fileOffset + address - segment.virtualAddress;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
}

function usage() {
  console.error('Usage: node scripts/inspect-libpad-gameplay.mjs <APK-or-libpad.so> [--restored <restored-libpad.so>] [--json]');
  process.exitCode = 2;
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const restoredFlag = args.indexOf('--restored');
const inputPath = args.find((arg, index) =>
  !arg.startsWith('--') && (restoredFlag < 0 || index !== restoredFlag + 1));
const restoredPath = restoredFlag >= 0 ? args[restoredFlag + 1] : null;
if (!inputPath || restoredFlag >= 0 && !restoredPath) {
  usage();
} else {
  const inputBytes = new Uint8Array(await readFile(inputPath));
  const sourceIsElf = isElf(inputBytes);
  const protectedBytes = sourceIsElf
    ? inputBytes
    : new ApkArchive(inputBytes).read(APK_LIBPAD_PATH);
  if (!protectedBytes) throw new Error(`${inputPath} does not contain ${APK_LIBPAD_PATH}.`);

  const restoredBytes = restoredPath
    ? new Uint8Array(await readFile(restoredPath))
    : sourceIsElf ? protectedBytes : null;
  const protectedElf = parseElf64(protectedBytes);
  const protectedHash = sha256(protectedBytes);
  const restoredElf = restoredBytes ? parseElf64(restoredBytes) : null;
  const restoredHash = restoredBytes ? sha256(restoredBytes) : null;
  const restoredSymbols = new Map(restoredElf?.dynamicSymbols.map((symbol) => [symbol.name, symbol]) || []);
  const resolveEnemySkillTarget = (type, table, base) => {
    if (!restoredElf) return null;
    const entry = readUint16Virtual(restoredElf, restoredBytes, table + (type - 1) * 2);
    return base + entry * 4;
  };
  const sourceToPoisonDispatchTarget = resolveEnemySkillTarget(
    SOURCE_TO_POISON_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const sourceToPoisonSetupTarget = resolveEnemySkillTarget(
    SOURCE_TO_POISON_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const sourceToPoisonConditionTarget = resolveEnemySkillTarget(
    SOURCE_TO_POISON_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const sourceToMortalPoisonDispatchTarget = resolveEnemySkillTarget(
    SOURCE_TO_MORTAL_POISON_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const sourceToMortalPoisonSetupTarget = resolveEnemySkillTarget(
    SOURCE_TO_MORTAL_POISON_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const sourceToMortalPoisonConditionTarget = resolveEnemySkillTarget(
    SOURCE_TO_MORTAL_POISON_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const sourceToPoisonDispatchMatches = sourceToPoisonDispatchTarget === null
    ? null : sourceToPoisonDispatchTarget === SOURCE_TO_POISON_HANDLER;
  const sourceToPoisonSetupMatches = sourceToPoisonSetupTarget === null
    ? null : sourceToPoisonSetupTarget === SOURCE_TO_POISON_SETUP_HANDLER;
  const sourceToPoisonConditionMatches = sourceToPoisonConditionTarget === null
    ? null : sourceToPoisonConditionTarget === SOURCE_TO_POISON_CONDITION_HANDLER;
  const sourceToMortalPoisonDispatchMatches = sourceToMortalPoisonDispatchTarget === null
    ? null : sourceToMortalPoisonDispatchTarget === SOURCE_TO_POISON_HANDLER;
  const sourceToMortalPoisonSetupMatches = sourceToMortalPoisonSetupTarget === null
    ? null : sourceToMortalPoisonSetupTarget === SOURCE_TO_POISON_SETUP_HANDLER;
  const sourceToMortalPoisonConditionMatches = sourceToMortalPoisonConditionTarget === null
    ? null : sourceToMortalPoisonConditionTarget === SOURCE_TO_POISON_CONDITION_HANDLER;
  const poisonBlocksDispatchTarget = resolveEnemySkillTarget(
    POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const poisonBlocksSetupTarget = resolveEnemySkillTarget(
    POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const poisonBlocksConditionTarget = resolveEnemySkillTarget(
    POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const mortalPoisonBlocksDispatchTarget = resolveEnemySkillTarget(
    MORTAL_POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const mortalPoisonBlocksSetupTarget = resolveEnemySkillTarget(
    MORTAL_POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const mortalPoisonBlocksConditionTarget = resolveEnemySkillTarget(
    MORTAL_POISON_BLOCKS_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const poisonBlocksDispatchMatches = poisonBlocksDispatchTarget === null
    ? null : poisonBlocksDispatchTarget === POISON_BLOCKS_HANDLER;
  const poisonBlocksSetupMatches = poisonBlocksSetupTarget === null
    ? null : poisonBlocksSetupTarget === POISON_BLOCKS_SETUP_HANDLER;
  const poisonBlocksConditionMatches = poisonBlocksConditionTarget === null
    ? null : poisonBlocksConditionTarget === POISON_BLOCKS_CONDITION_HANDLER;
  const mortalPoisonBlocksDispatchMatches = mortalPoisonBlocksDispatchTarget === null
    ? null : mortalPoisonBlocksDispatchTarget === POISON_BLOCKS_HANDLER;
  const mortalPoisonBlocksSetupMatches = mortalPoisonBlocksSetupTarget === null
    ? null : mortalPoisonBlocksSetupTarget === POISON_BLOCKS_SETUP_HANDLER;
  const mortalPoisonBlocksConditionMatches = mortalPoisonBlocksConditionTarget === null
    ? null : mortalPoisonBlocksConditionTarget === POISON_BLOCKS_CONDITION_HANDLER;
  const resolveCountedPoisonTarget = (type, table, base) => resolveEnemySkillTarget(
    type,
    table,
    base,
  );
  const poisonBlockNCountedDispatchTarget = resolveCountedPoisonTarget(
    POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const poisonBlockNCountedSetupTarget = resolveCountedPoisonTarget(
    POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const poisonBlockNCountedConditionTarget = resolveCountedPoisonTarget(
    POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const mortalPoisonBlockNCountedDispatchTarget = resolveCountedPoisonTarget(
    MORTAL_POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const mortalPoisonBlockNCountedSetupTarget = resolveCountedPoisonTarget(
    MORTAL_POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const mortalPoisonBlockNCountedConditionTarget = resolveCountedPoisonTarget(
    MORTAL_POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const poisonBlockNCountedDispatchMatches = poisonBlockNCountedDispatchTarget === null
    ? null : poisonBlockNCountedDispatchTarget === POISON_BLOCK_N_COUNTED_HANDLER;
  const poisonBlockNCountedSetupMatches = poisonBlockNCountedSetupTarget === null
    ? null : poisonBlockNCountedSetupTarget === POISON_BLOCK_N_COUNTED_SETUP_HANDLER;
  const poisonBlockNCountedConditionMatches = poisonBlockNCountedConditionTarget === null
    ? null : poisonBlockNCountedConditionTarget === POISON_BLOCK_N_COUNTED_CONDITION_HANDLER;
  const mortalPoisonBlockNCountedDispatchMatches = mortalPoisonBlockNCountedDispatchTarget === null
    ? null : mortalPoisonBlockNCountedDispatchTarget === POISON_BLOCK_N_COUNTED_HANDLER;
  const mortalPoisonBlockNCountedSetupMatches = mortalPoisonBlockNCountedSetupTarget === null
    ? null : mortalPoisonBlockNCountedSetupTarget === POISON_BLOCK_N_COUNTED_SETUP_HANDLER;
  const mortalPoisonBlockNCountedConditionMatches = mortalPoisonBlockNCountedConditionTarget === null
    ? null : mortalPoisonBlockNCountedConditionTarget === POISON_BLOCK_N_COUNTED_CONDITION_HANDLER;
  const blackFallDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (BLACK_FALL_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const blackFallSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (BLACK_FALL_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const blackFallDispatchTarget = blackFallDispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + blackFallDispatchEntry * 4;
  const blackFallDispatchMatches = blackFallDispatchTarget === null
    ? null
    : blackFallDispatchTarget === BLACK_FALL_HANDLER;
  const blackFallSetupTarget = blackFallSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + blackFallSetupEntry * 4;
  const blackFallSetupMatches = blackFallSetupTarget === null
    ? null
    : blackFallSetupTarget === BLACK_FALL_SETUP_HANDLER;
  const poisonBlockNDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (POISON_BLOCK_N_ENEMY_SKILL_TYPE - 5) * 2,
    )
    : null;
  const poisonBlockNSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (POISON_BLOCK_N_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonBlockNConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (POISON_BLOCK_N_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonBlockNDispatchTarget = poisonBlockNDispatchEntry === null
    ? null
    : EARLY_ENEMY_SKILL_DISPATCH_BASE + poisonBlockNDispatchEntry * 4;
  const poisonBlockNSetupTarget = poisonBlockNSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + poisonBlockNSetupEntry * 4;
  const poisonBlockNConditionTarget = poisonBlockNConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + poisonBlockNConditionEntry * 4;
  const poisonBlockNDispatchMatches = poisonBlockNDispatchTarget === null
    ? null
    : poisonBlockNDispatchTarget === POISON_BLOCK_N_HANDLER;
  const poisonBlockNSetupMatches = poisonBlockNSetupTarget === null
    ? null
    : poisonBlockNSetupTarget === POISON_BLOCK_N_SETUP_HANDLER;
  const poisonBlockNConditionMatches = poisonBlockNConditionTarget === null
    ? null
    : poisonBlockNConditionTarget === POISON_BLOCK_N_CONDITION_HANDLER;
  const horizontalLinesDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (HORIZONTAL_LINES_ENEMY_SKILL_TYPE - 5) * 2,
    )
    : null;
  const horizontalLinesSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (HORIZONTAL_LINES_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const horizontalLinesConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (HORIZONTAL_LINES_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const horizontalLinesDispatchTarget = horizontalLinesDispatchEntry === null
    ? null
    : EARLY_ENEMY_SKILL_DISPATCH_BASE + horizontalLinesDispatchEntry * 4;
  const horizontalLinesSetupTarget = horizontalLinesSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + horizontalLinesSetupEntry * 4;
  const horizontalLinesConditionTarget = horizontalLinesConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + horizontalLinesConditionEntry * 4;
  const horizontalLinesDispatchMatches = horizontalLinesDispatchTarget === null
    ? null
    : horizontalLinesDispatchTarget === HORIZONTAL_LINES_HANDLER;
  const horizontalLinesSetupMatches = horizontalLinesSetupTarget === null
    ? null
    : horizontalLinesSetupTarget === HORIZONTAL_LINES_SETUP_HANDLER;
  const horizontalLinesConditionMatches = horizontalLinesConditionTarget === null
    ? null
    : horizontalLinesConditionTarget === HORIZONTAL_LINES_CONDITION_HANDLER;
  const horizontalLines4DispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (HORIZONTAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const horizontalLines4SetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (HORIZONTAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const horizontalLines4ConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (HORIZONTAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const horizontalLines4DispatchTarget = horizontalLines4DispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + horizontalLines4DispatchEntry * 4;
  const horizontalLines4SetupTarget = horizontalLines4SetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + horizontalLines4SetupEntry * 4;
  const horizontalLines4ConditionTarget = horizontalLines4ConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + horizontalLines4ConditionEntry * 4;
  const horizontalLines4DispatchMatches = horizontalLines4DispatchTarget === null
    ? null
    : horizontalLines4DispatchTarget === HORIZONTAL_LINES_4_HANDLER;
  const horizontalLines4SetupMatches = horizontalLines4SetupTarget === null
    ? null
    : horizontalLines4SetupTarget === HORIZONTAL_LINES_4_SETUP_HANDLER;
  const horizontalLines4ConditionMatches = horizontalLines4ConditionTarget === null
    ? null
    : horizontalLines4ConditionTarget === HORIZONTAL_LINES_4_CONDITION_HANDLER;
  const verticalLinesDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (VERTICAL_LINES_ENEMY_SKILL_TYPE - 5) * 2,
    )
    : null;
  const verticalLinesSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (VERTICAL_LINES_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const verticalLinesConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (VERTICAL_LINES_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const verticalLinesDispatchTarget = verticalLinesDispatchEntry === null
    ? null
    : EARLY_ENEMY_SKILL_DISPATCH_BASE + verticalLinesDispatchEntry * 4;
  const verticalLinesSetupTarget = verticalLinesSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + verticalLinesSetupEntry * 4;
  const verticalLinesConditionTarget = verticalLinesConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + verticalLinesConditionEntry * 4;
  const verticalLinesDispatchMatches = verticalLinesDispatchTarget === null
    ? null
    : verticalLinesDispatchTarget === VERTICAL_LINES_HANDLER;
  const verticalLinesSetupMatches = verticalLinesSetupTarget === null
    ? null
    : verticalLinesSetupTarget === VERTICAL_LINES_SETUP_HANDLER;
  const verticalLinesConditionMatches = verticalLinesConditionTarget === null
    ? null
    : verticalLinesConditionTarget === VERTICAL_LINES_CONDITION_HANDLER;
  const verticalLines4DispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (VERTICAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const verticalLines4SetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (VERTICAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const verticalLines4ConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (VERTICAL_LINES_4_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const verticalLines4DispatchTarget = verticalLines4DispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + verticalLines4DispatchEntry * 4;
  const verticalLines4SetupTarget = verticalLines4SetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + verticalLines4SetupEntry * 4;
  const verticalLines4ConditionTarget = verticalLines4ConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + verticalLines4ConditionEntry * 4;
  const verticalLines4DispatchMatches = verticalLines4DispatchTarget === null
    ? null
    : verticalLines4DispatchTarget === VERTICAL_LINES_4_HANDLER;
  const verticalLines4SetupMatches = verticalLines4SetupTarget === null
    ? null
    : verticalLines4SetupTarget === VERTICAL_LINES_4_SETUP_HANDLER;
  const verticalLines4ConditionMatches = verticalLines4ConditionTarget === null
    ? null
    : verticalLines4ConditionTarget === VERTICAL_LINES_4_CONDITION_HANDLER;
  const poisonTypeListDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (POISON_TYPE_LIST_ENEMY_SKILL_TYPE - 5) * 2,
    )
    : null;
  const poisonTypeListSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (POISON_TYPE_LIST_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonTypeListConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (POISON_TYPE_LIST_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonTypeListDispatchTarget = poisonTypeListDispatchEntry === null
    ? null
    : EARLY_ENEMY_SKILL_DISPATCH_BASE + poisonTypeListDispatchEntry * 4;
  const poisonTypeListSetupTarget = poisonTypeListSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + poisonTypeListSetupEntry * 4;
  const poisonTypeListConditionTarget = poisonTypeListConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + poisonTypeListConditionEntry * 4;
  const poisonTypeListDispatchMatches = poisonTypeListDispatchTarget === null
    ? null
    : poisonTypeListDispatchTarget === POISON_TYPE_LIST_HANDLER;
  const poisonTypeListSetupMatches = poisonTypeListSetupTarget === null
    ? null
    : poisonTypeListSetupTarget === POISON_TYPE_LIST_SETUP_HANDLER;
  const poisonTypeListConditionMatches = poisonTypeListConditionTarget === null
    ? null
    : poisonTypeListConditionTarget === POISON_TYPE_LIST_CONDITION_HANDLER;
  const poisonTypeListDirectDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (POISON_TYPE_LIST_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonTypeListDirectSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (POISON_TYPE_LIST_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonTypeListDirectConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (POISON_TYPE_LIST_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonTypeListDirectDispatchTarget = poisonTypeListDirectDispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + poisonTypeListDirectDispatchEntry * 4;
  const poisonTypeListDirectSetupTarget = poisonTypeListDirectSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + poisonTypeListDirectSetupEntry * 4;
  const poisonTypeListDirectConditionTarget = poisonTypeListDirectConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + poisonTypeListDirectConditionEntry * 4;
  const poisonTypeListDirectDispatchMatches = poisonTypeListDirectDispatchTarget === null
    ? null
    : poisonTypeListDirectDispatchTarget === POISON_TYPE_LIST_DIRECT_HANDLER;
  const poisonTypeListDirectSetupMatches = poisonTypeListDirectSetupTarget === null
    ? null
    : poisonTypeListDirectSetupTarget === POISON_TYPE_LIST_DIRECT_SETUP_HANDLER;
  const poisonTypeListDirectConditionMatches = poisonTypeListDirectConditionTarget === null
    ? null
    : poisonTypeListDirectConditionTarget === POISON_TYPE_LIST_DIRECT_CONDITION_HANDLER;
  const poisonMaskDirectDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (POISON_MASK_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonMaskDirectSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (POISON_MASK_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonMaskDirectConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (POISON_MASK_DIRECT_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonMaskDirectDispatchTarget = poisonMaskDirectDispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + poisonMaskDirectDispatchEntry * 4;
  const poisonMaskDirectSetupTarget = poisonMaskDirectSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + poisonMaskDirectSetupEntry * 4;
  const poisonMaskDirectConditionTarget = poisonMaskDirectConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + poisonMaskDirectConditionEntry * 4;
  const poisonMaskDirectDispatchMatches = poisonMaskDirectDispatchTarget === null
    ? null
    : poisonMaskDirectDispatchTarget === POISON_MASK_DIRECT_HANDLER;
  const poisonMaskDirectSetupMatches = poisonMaskDirectSetupTarget === null
    ? null
    : poisonMaskDirectSetupTarget === POISON_MASK_DIRECT_SETUP_HANDLER;
  const poisonMaskDirectConditionMatches = poisonMaskDirectConditionTarget === null
    ? null
    : poisonMaskDirectConditionTarget === POISON_MASK_DIRECT_CONDITION_HANDLER;
  const poisonMaskDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (POISON_MASK_ENEMY_SKILL_TYPE - 5) * 2,
    )
    : null;
  const poisonMaskSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (POISON_MASK_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonMaskConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (POISON_MASK_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const poisonMaskDispatchTarget = poisonMaskDispatchEntry === null
    ? null
    : EARLY_ENEMY_SKILL_DISPATCH_BASE + poisonMaskDispatchEntry * 4;
  const poisonMaskSetupTarget = poisonMaskSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + poisonMaskSetupEntry * 4;
  const poisonMaskConditionTarget = poisonMaskConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + poisonMaskConditionEntry * 4;
  const poisonMaskDispatchMatches = poisonMaskDispatchTarget === null
    ? null
    : poisonMaskDispatchTarget === POISON_MASK_HANDLER;
  const poisonMaskSetupMatches = poisonMaskSetupTarget === null
    ? null
    : poisonMaskSetupTarget === POISON_MASK_SETUP_HANDLER;
  const poisonMaskConditionMatches = poisonMaskConditionTarget === null
    ? null
    : poisonMaskConditionTarget === POISON_MASK_CONDITION_HANDLER;
  const blockMinusDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (BLOCK_MINUS_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const blockMinusSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (BLOCK_MINUS_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const blockMinusConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (BLOCK_MINUS_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const blockMinusDispatchTarget = blockMinusDispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + blockMinusDispatchEntry * 4;
  const blockMinusSetupTarget = blockMinusSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + blockMinusSetupEntry * 4;
  const blockMinusConditionTarget = blockMinusConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + blockMinusConditionEntry * 4;
  const blockMinusDispatchMatches = blockMinusDispatchTarget === null
    ? null
    : blockMinusDispatchTarget === BLOCK_MINUS_HANDLER;
  const blockMinusSetupMatches = blockMinusSetupTarget === null
    ? null
    : blockMinusSetupTarget === BLOCK_MINUS_SETUP_HANDLER;
  const blockMinusConditionMatches = blockMinusConditionTarget === null
    ? null
    : blockMinusConditionTarget === BLOCK_MINUS_CONDITION_HANDLER;
  const burDropDispatchEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_DISPATCH_TABLE + (BUR_DROP_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const burDropSetupEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_SETUP_TABLE + (BUR_DROP_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const burDropConditionEntry = restoredElf
    ? readUint16Virtual(
      restoredElf,
      restoredBytes,
      ENEMY_SKILL_CONDITION_TABLE + (BUR_DROP_ENEMY_SKILL_TYPE - 1) * 2,
    )
    : null;
  const burDropDispatchTarget = burDropDispatchEntry === null
    ? null
    : ENEMY_SKILL_DISPATCH_BASE + burDropDispatchEntry * 4;
  const burDropSetupTarget = burDropSetupEntry === null
    ? null
    : ENEMY_SKILL_SETUP_BASE + burDropSetupEntry * 4;
  const burDropConditionTarget = burDropConditionEntry === null
    ? null
    : ENEMY_SKILL_CONDITION_BASE + burDropConditionEntry * 4;
  const burDropDispatchMatches = burDropDispatchTarget === null
    ? null
    : burDropDispatchTarget === BUR_DROP_HANDLER;
  const burDropSetupMatches = burDropSetupTarget === null
    ? null
    : burDropSetupTarget === BUR_DROP_SETUP_HANDLER;
  const burDropConditionMatches = burDropConditionTarget === null
    ? null
    : burDropConditionTarget === BUR_DROP_CONDITION_HANDLER;

  const symbols = GAMEPLAY_SYMBOLS.map(([group, label, mangledName, expectedAddress]) => {
    const symbol = restoredSymbols.get(mangledName) || null;
    return {
      group,
      label,
      mangledName,
      expectedAddress: hex(expectedAddress),
      address: symbol ? hex(symbol.value) : null,
      size: symbol?.size ?? null,
      addressMatches21_9: symbol ? symbol.value === expectedAddress : null,
    };
  });
  const mismatches = symbols.filter((symbol) => symbol.addressMatches21_9 === false);
  const missing = symbols.filter((symbol) => restoredElf && !symbol.address);
  const report = {
    source: {
      file: basename(inputPath),
      kind: sourceIsElf ? 'ELF64' : 'APK',
      libpadBytes: protectedBytes.length,
      libpadSha256: protectedHash,
      exactPad21_9: protectedHash === PAD_21_9_LIBPAD_SHA256,
      namedDynamicSymbols: protectedElf.dynamicSymbols.filter((symbol) => symbol.name).length,
    },
    restoration: restoredElf ? {
      file: basename(restoredPath || inputPath),
      sha256: restoredHash,
      exactKnownRestoration: restoredHash === PAD_21_9_RESTORED_SHA256,
      namedDynamicSymbols: restoredElf.dynamicSymbols.filter((symbol) => symbol.name).length,
      allAnchorsPresent: missing.length === 0,
      allAddressesMatch21_9: mismatches.length === 0,
      blackFallDispatchMatches21_9: blackFallDispatchMatches,
      blackFallSetupMatches21_9: blackFallSetupMatches,
      sourceToPoisonDispatchMatches21_9: sourceToPoisonDispatchMatches,
      sourceToPoisonSetupMatches21_9: sourceToPoisonSetupMatches,
      sourceToPoisonConditionMatches21_9: sourceToPoisonConditionMatches,
      sourceToMortalPoisonDispatchMatches21_9: sourceToMortalPoisonDispatchMatches,
      sourceToMortalPoisonSetupMatches21_9: sourceToMortalPoisonSetupMatches,
      sourceToMortalPoisonConditionMatches21_9: sourceToMortalPoisonConditionMatches,
      poisonBlocksDispatchMatches21_9: poisonBlocksDispatchMatches,
      poisonBlocksSetupMatches21_9: poisonBlocksSetupMatches,
      poisonBlocksConditionMatches21_9: poisonBlocksConditionMatches,
      mortalPoisonBlocksDispatchMatches21_9: mortalPoisonBlocksDispatchMatches,
      mortalPoisonBlocksSetupMatches21_9: mortalPoisonBlocksSetupMatches,
      mortalPoisonBlocksConditionMatches21_9: mortalPoisonBlocksConditionMatches,
      poisonBlockNCountedDispatchMatches21_9: poisonBlockNCountedDispatchMatches,
      poisonBlockNCountedSetupMatches21_9: poisonBlockNCountedSetupMatches,
      poisonBlockNCountedConditionMatches21_9: poisonBlockNCountedConditionMatches,
      mortalPoisonBlockNCountedDispatchMatches21_9: mortalPoisonBlockNCountedDispatchMatches,
      mortalPoisonBlockNCountedSetupMatches21_9: mortalPoisonBlockNCountedSetupMatches,
      mortalPoisonBlockNCountedConditionMatches21_9: mortalPoisonBlockNCountedConditionMatches,
      poisonBlockNDispatchMatches21_9: poisonBlockNDispatchMatches,
      poisonBlockNSetupMatches21_9: poisonBlockNSetupMatches,
      poisonBlockNConditionMatches21_9: poisonBlockNConditionMatches,
      horizontalLinesDispatchMatches21_9: horizontalLinesDispatchMatches,
      horizontalLinesSetupMatches21_9: horizontalLinesSetupMatches,
      horizontalLinesConditionMatches21_9: horizontalLinesConditionMatches,
      horizontalLines4DispatchMatches21_9: horizontalLines4DispatchMatches,
      horizontalLines4SetupMatches21_9: horizontalLines4SetupMatches,
      horizontalLines4ConditionMatches21_9: horizontalLines4ConditionMatches,
      verticalLinesDispatchMatches21_9: verticalLinesDispatchMatches,
      verticalLinesSetupMatches21_9: verticalLinesSetupMatches,
      verticalLinesConditionMatches21_9: verticalLinesConditionMatches,
      verticalLines4DispatchMatches21_9: verticalLines4DispatchMatches,
      verticalLines4SetupMatches21_9: verticalLines4SetupMatches,
      verticalLines4ConditionMatches21_9: verticalLines4ConditionMatches,
      poisonTypeListDispatchMatches21_9: poisonTypeListDispatchMatches,
      poisonTypeListSetupMatches21_9: poisonTypeListSetupMatches,
      poisonTypeListConditionMatches21_9: poisonTypeListConditionMatches,
      poisonTypeListDirectDispatchMatches21_9: poisonTypeListDirectDispatchMatches,
      poisonTypeListDirectSetupMatches21_9: poisonTypeListDirectSetupMatches,
      poisonTypeListDirectConditionMatches21_9: poisonTypeListDirectConditionMatches,
      poisonMaskDirectDispatchMatches21_9: poisonMaskDirectDispatchMatches,
      poisonMaskDirectSetupMatches21_9: poisonMaskDirectSetupMatches,
      poisonMaskDirectConditionMatches21_9: poisonMaskDirectConditionMatches,
      poisonMaskDispatchMatches21_9: poisonMaskDispatchMatches,
      poisonMaskSetupMatches21_9: poisonMaskSetupMatches,
      poisonMaskConditionMatches21_9: poisonMaskConditionMatches,
      blockMinusDispatchMatches21_9: blockMinusDispatchMatches,
      blockMinusSetupMatches21_9: blockMinusSetupMatches,
      blockMinusConditionMatches21_9: blockMinusConditionMatches,
      burDropDispatchMatches21_9: burDropDispatchMatches,
      burDropSetupMatches21_9: burDropSetupMatches,
      burDropConditionMatches21_9: burDropConditionMatches,
    } : null,
    layout: {
      boardColumnsOffset: 'cGAMEMAIN+0x70',
      boardRowsOffset: 'cGAMEMAIN+0x71',
      diagonalModeOffset: 'cGAMEMAIN+0x75',
      boardBackingIndex: 'column + (row << 4)',
      blockTypeOffset: 'sBLOCK+0x00 (signed byte)',
      blockFlagsOffset: 'sBLOCK+0x04 (uint32)',
      blockEnhancementOffset: 'sBLOCK+0x08 (signed float32)',
      blockBurstDescriptorOffset: 'sBLOCK+0x0c (uint8; damage percent in low 7 bits)',
      blockBurstFlag: 'sBLOCK.flags & 0x80000',
      blockLockedFlag: 'sBLOCK.flags & 0x800',
      specialLockClearedFlags: 'sBLOCK.flags & ~0x28000',
      erasedBlockMarker: 'sBLOCK.flags & 0x40000',
      matchEnhancementAccumulator: 'float32(1.0 + sequential sum of marked sBLOCK+0x08 values)',
    },
    enemySkillRuntime: {
      definitionTypeOffset: 'sENEMYSKILL+0x04 (signed int16)',
      definitionAttackWithSkillOffset: 'sENEMYSKILL+0x44 (positive signed int32 percent)',
      monsterAttackWithSkillOffset: 'sMONSTER+0x7e8 (uint32 converted to float32 / 100)',
      monsterDurationOffset: 'sMONSTER+0x678 (packed low 10 bits)',
      monsterChanceOffset: 'sMONSTER+0x67c (signed low 16 bits)',
      blackFallType: BLACK_FALL_ENEMY_SKILL_TYPE,
      dispatchEntry: blackFallDispatchEntry === null ? null : hex(blackFallDispatchEntry),
      dispatchTarget: blackFallDispatchTarget === null ? null : hex(blackFallDispatchTarget),
      dispatchMatches21_9: blackFallDispatchMatches,
      setupEntry: blackFallSetupEntry === null ? null : hex(blackFallSetupEntry),
      setupTarget: blackFallSetupTarget === null ? null : hex(blackFallSetupTarget),
      setupMatches21_9: blackFallSetupMatches,
      sourceToPoisonType: SOURCE_TO_POISON_ENEMY_SKILL_TYPE,
      sourceToPoisonDispatchTarget: sourceToPoisonDispatchTarget === null
        ? null : hex(sourceToPoisonDispatchTarget),
      sourceToPoisonDispatchMatches21_9: sourceToPoisonDispatchMatches,
      sourceToPoisonSetupTarget: sourceToPoisonSetupTarget === null
        ? null : hex(sourceToPoisonSetupTarget),
      sourceToPoisonSetupMatches21_9: sourceToPoisonSetupMatches,
      sourceToPoisonConditionTarget: sourceToPoisonConditionTarget === null
        ? null : hex(sourceToPoisonConditionTarget),
      sourceToPoisonConditionMatches21_9: sourceToPoisonConditionMatches,
      sourceToMortalPoisonType: SOURCE_TO_MORTAL_POISON_ENEMY_SKILL_TYPE,
      sourceToMortalPoisonDispatchTarget: sourceToMortalPoisonDispatchTarget === null
        ? null : hex(sourceToMortalPoisonDispatchTarget),
      sourceToMortalPoisonDispatchMatches21_9: sourceToMortalPoisonDispatchMatches,
      sourceToMortalPoisonSetupTarget: sourceToMortalPoisonSetupTarget === null
        ? null : hex(sourceToMortalPoisonSetupTarget),
      sourceToMortalPoisonSetupMatches21_9: sourceToMortalPoisonSetupMatches,
      sourceToMortalPoisonConditionTarget: sourceToMortalPoisonConditionTarget === null
        ? null : hex(sourceToMortalPoisonConditionTarget),
      sourceToMortalPoisonConditionMatches21_9: sourceToMortalPoisonConditionMatches,
      poisonBlocksType: POISON_BLOCKS_ENEMY_SKILL_TYPE,
      poisonBlocksDispatchTarget: poisonBlocksDispatchTarget === null
        ? null : hex(poisonBlocksDispatchTarget),
      poisonBlocksDispatchMatches21_9: poisonBlocksDispatchMatches,
      poisonBlocksSetupTarget: poisonBlocksSetupTarget === null ? null : hex(poisonBlocksSetupTarget),
      poisonBlocksSetupMatches21_9: poisonBlocksSetupMatches,
      poisonBlocksConditionTarget: poisonBlocksConditionTarget === null
        ? null : hex(poisonBlocksConditionTarget),
      poisonBlocksConditionMatches21_9: poisonBlocksConditionMatches,
      mortalPoisonBlocksType: MORTAL_POISON_BLOCKS_ENEMY_SKILL_TYPE,
      mortalPoisonBlocksDispatchTarget: mortalPoisonBlocksDispatchTarget === null
        ? null : hex(mortalPoisonBlocksDispatchTarget),
      mortalPoisonBlocksDispatchMatches21_9: mortalPoisonBlocksDispatchMatches,
      mortalPoisonBlocksSetupTarget: mortalPoisonBlocksSetupTarget === null
        ? null : hex(mortalPoisonBlocksSetupTarget),
      mortalPoisonBlocksSetupMatches21_9: mortalPoisonBlocksSetupMatches,
      mortalPoisonBlocksConditionTarget: mortalPoisonBlocksConditionTarget === null
        ? null : hex(mortalPoisonBlocksConditionTarget),
      mortalPoisonBlocksConditionMatches21_9: mortalPoisonBlocksConditionMatches,
      poisonBlockNCountedType: POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE,
      poisonBlockNCountedDispatchTarget: poisonBlockNCountedDispatchTarget === null
        ? null : hex(poisonBlockNCountedDispatchTarget),
      poisonBlockNCountedDispatchMatches21_9: poisonBlockNCountedDispatchMatches,
      poisonBlockNCountedSetupTarget: poisonBlockNCountedSetupTarget === null
        ? null : hex(poisonBlockNCountedSetupTarget),
      poisonBlockNCountedSetupMatches21_9: poisonBlockNCountedSetupMatches,
      poisonBlockNCountedConditionTarget: poisonBlockNCountedConditionTarget === null
        ? null : hex(poisonBlockNCountedConditionTarget),
      poisonBlockNCountedConditionMatches21_9: poisonBlockNCountedConditionMatches,
      mortalPoisonBlockNCountedType: MORTAL_POISON_BLOCK_N_COUNTED_ENEMY_SKILL_TYPE,
      mortalPoisonBlockNCountedDispatchTarget: mortalPoisonBlockNCountedDispatchTarget === null
        ? null : hex(mortalPoisonBlockNCountedDispatchTarget),
      mortalPoisonBlockNCountedDispatchMatches21_9: mortalPoisonBlockNCountedDispatchMatches,
      mortalPoisonBlockNCountedSetupTarget: mortalPoisonBlockNCountedSetupTarget === null
        ? null : hex(mortalPoisonBlockNCountedSetupTarget),
      mortalPoisonBlockNCountedSetupMatches21_9: mortalPoisonBlockNCountedSetupMatches,
      mortalPoisonBlockNCountedConditionTarget: mortalPoisonBlockNCountedConditionTarget === null
        ? null : hex(mortalPoisonBlockNCountedConditionTarget),
      mortalPoisonBlockNCountedConditionMatches21_9: mortalPoisonBlockNCountedConditionMatches,
      poisonBlockNType: POISON_BLOCK_N_ENEMY_SKILL_TYPE,
      poisonBlockNDispatchTarget: poisonBlockNDispatchTarget === null
        ? null : hex(poisonBlockNDispatchTarget),
      poisonBlockNDispatchMatches21_9: poisonBlockNDispatchMatches,
      poisonBlockNSetupTarget: poisonBlockNSetupTarget === null
        ? null : hex(poisonBlockNSetupTarget),
      poisonBlockNSetupMatches21_9: poisonBlockNSetupMatches,
      poisonBlockNConditionTarget: poisonBlockNConditionTarget === null
        ? null : hex(poisonBlockNConditionTarget),
      poisonBlockNConditionMatches21_9: poisonBlockNConditionMatches,
      horizontalLinesType: HORIZONTAL_LINES_ENEMY_SKILL_TYPE,
      horizontalLinesDispatchTarget: horizontalLinesDispatchTarget === null
        ? null : hex(horizontalLinesDispatchTarget),
      horizontalLinesDispatchMatches21_9: horizontalLinesDispatchMatches,
      horizontalLinesSetupTarget: horizontalLinesSetupTarget === null
        ? null : hex(horizontalLinesSetupTarget),
      horizontalLinesSetupMatches21_9: horizontalLinesSetupMatches,
      horizontalLinesConditionTarget: horizontalLinesConditionTarget === null
        ? null : hex(horizontalLinesConditionTarget),
      horizontalLinesConditionMatches21_9: horizontalLinesConditionMatches,
      horizontalLines4Type: HORIZONTAL_LINES_4_ENEMY_SKILL_TYPE,
      horizontalLines4DispatchTarget: horizontalLines4DispatchTarget === null
        ? null : hex(horizontalLines4DispatchTarget),
      horizontalLines4DispatchMatches21_9: horizontalLines4DispatchMatches,
      horizontalLines4SetupTarget: horizontalLines4SetupTarget === null
        ? null : hex(horizontalLines4SetupTarget),
      horizontalLines4SetupMatches21_9: horizontalLines4SetupMatches,
      horizontalLines4ConditionTarget: horizontalLines4ConditionTarget === null
        ? null : hex(horizontalLines4ConditionTarget),
      horizontalLines4ConditionMatches21_9: horizontalLines4ConditionMatches,
      verticalLinesType: VERTICAL_LINES_ENEMY_SKILL_TYPE,
      verticalLinesDispatchTarget: verticalLinesDispatchTarget === null
        ? null : hex(verticalLinesDispatchTarget),
      verticalLinesDispatchMatches21_9: verticalLinesDispatchMatches,
      verticalLinesSetupTarget: verticalLinesSetupTarget === null
        ? null : hex(verticalLinesSetupTarget),
      verticalLinesSetupMatches21_9: verticalLinesSetupMatches,
      verticalLinesConditionTarget: verticalLinesConditionTarget === null
        ? null : hex(verticalLinesConditionTarget),
      verticalLinesConditionMatches21_9: verticalLinesConditionMatches,
      verticalLines4Type: VERTICAL_LINES_4_ENEMY_SKILL_TYPE,
      verticalLines4DispatchTarget: verticalLines4DispatchTarget === null
        ? null : hex(verticalLines4DispatchTarget),
      verticalLines4DispatchMatches21_9: verticalLines4DispatchMatches,
      verticalLines4SetupTarget: verticalLines4SetupTarget === null
        ? null : hex(verticalLines4SetupTarget),
      verticalLines4SetupMatches21_9: verticalLines4SetupMatches,
      verticalLines4ConditionTarget: verticalLines4ConditionTarget === null
        ? null : hex(verticalLines4ConditionTarget),
      verticalLines4ConditionMatches21_9: verticalLines4ConditionMatches,
      poisonTypeListType: POISON_TYPE_LIST_ENEMY_SKILL_TYPE,
      poisonTypeListDispatchTarget: poisonTypeListDispatchTarget === null
        ? null : hex(poisonTypeListDispatchTarget),
      poisonTypeListDispatchMatches21_9: poisonTypeListDispatchMatches,
      poisonTypeListSetupTarget: poisonTypeListSetupTarget === null
        ? null : hex(poisonTypeListSetupTarget),
      poisonTypeListSetupMatches21_9: poisonTypeListSetupMatches,
      poisonTypeListConditionTarget: poisonTypeListConditionTarget === null
        ? null : hex(poisonTypeListConditionTarget),
      poisonTypeListConditionMatches21_9: poisonTypeListConditionMatches,
      poisonTypeListDirectType: POISON_TYPE_LIST_DIRECT_ENEMY_SKILL_TYPE,
      poisonTypeListDirectDispatchTarget: poisonTypeListDirectDispatchTarget === null
        ? null : hex(poisonTypeListDirectDispatchTarget),
      poisonTypeListDirectDispatchMatches21_9: poisonTypeListDirectDispatchMatches,
      poisonTypeListDirectSetupTarget: poisonTypeListDirectSetupTarget === null
        ? null : hex(poisonTypeListDirectSetupTarget),
      poisonTypeListDirectSetupMatches21_9: poisonTypeListDirectSetupMatches,
      poisonTypeListDirectConditionTarget: poisonTypeListDirectConditionTarget === null
        ? null : hex(poisonTypeListDirectConditionTarget),
      poisonTypeListDirectConditionMatches21_9: poisonTypeListDirectConditionMatches,
      poisonMaskDirectType: POISON_MASK_DIRECT_ENEMY_SKILL_TYPE,
      poisonMaskDirectDispatchTarget: poisonMaskDirectDispatchTarget === null
        ? null : hex(poisonMaskDirectDispatchTarget),
      poisonMaskDirectDispatchMatches21_9: poisonMaskDirectDispatchMatches,
      poisonMaskDirectSetupTarget: poisonMaskDirectSetupTarget === null
        ? null : hex(poisonMaskDirectSetupTarget),
      poisonMaskDirectSetupMatches21_9: poisonMaskDirectSetupMatches,
      poisonMaskDirectConditionTarget: poisonMaskDirectConditionTarget === null
        ? null : hex(poisonMaskDirectConditionTarget),
      poisonMaskDirectConditionMatches21_9: poisonMaskDirectConditionMatches,
      poisonMaskType: POISON_MASK_ENEMY_SKILL_TYPE,
      poisonMaskDispatchTarget: poisonMaskDispatchTarget === null
        ? null : hex(poisonMaskDispatchTarget),
      poisonMaskDispatchMatches21_9: poisonMaskDispatchMatches,
      poisonMaskSetupTarget: poisonMaskSetupTarget === null
        ? null : hex(poisonMaskSetupTarget),
      poisonMaskSetupMatches21_9: poisonMaskSetupMatches,
      poisonMaskConditionTarget: poisonMaskConditionTarget === null
        ? null : hex(poisonMaskConditionTarget),
      poisonMaskConditionMatches21_9: poisonMaskConditionMatches,
      blockMinusType: BLOCK_MINUS_ENEMY_SKILL_TYPE,
      blockMinusDispatchTarget: blockMinusDispatchTarget === null ? null : hex(blockMinusDispatchTarget),
      blockMinusDispatchMatches21_9: blockMinusDispatchMatches,
      blockMinusSetupTarget: blockMinusSetupTarget === null ? null : hex(blockMinusSetupTarget),
      blockMinusSetupMatches21_9: blockMinusSetupMatches,
      blockMinusConditionTarget: blockMinusConditionTarget === null ? null : hex(blockMinusConditionTarget),
      blockMinusConditionMatches21_9: blockMinusConditionMatches,
      burDropType: BUR_DROP_ENEMY_SKILL_TYPE,
      burDropDispatchTarget: burDropDispatchTarget === null ? null : hex(burDropDispatchTarget),
      burDropDispatchMatches21_9: burDropDispatchMatches,
      burDropSetupTarget: burDropSetupTarget === null ? null : hex(burDropSetupTarget),
      burDropSetupMatches21_9: burDropSetupMatches,
      burDropConditionTarget: burDropConditionTarget === null ? null : hex(burDropConditionTarget),
      burDropConditionMatches21_9: burDropConditionMatches,
    },
    enemyTurn: {
      attackCounterOffset: 'sMONSTER+0x120',
      selectedSkillIndexOffset: 'sMONSTER+0x670',
      preparedSkillIndexOffset: 'sMONSTER+0x7d8',
      aiStateOffset: 'sMONSTER+0x7dc',
      readyCondition: 'counter <= 0',
    },
    enemyAi: {
      modeFlagsOffset: 'enemy definition+0xe0 (bit 0 selects chooseEnemyAiNew)',
      budgetCapOffset: 'enemy definition+0xe2 (int16)',
      budgetRegenOffset: 'enemy definition+0xe4 (int16)',
      slotArrayOffset: 'enemy definition+0xec (64 records, 8-byte stride)',
      slotFields: 'uint32 skill id, uint8 immediate chance, uint8 fallback weight',
      skillProbabilityOffsets: 'sENEMYSKILL+0x30/+0x34 (signed int32 factors)',
      skillHpThresholdOffset: 'sENEMYSKILL+0x38 (signed int32 percent)',
      skillBudgetCostOffset: 'sENEMYSKILL+0x40 (signed int32)',
    },
    symbols,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`libpad gameplay inspection: ${report.source.file}`);
    console.log(`  source: ${report.source.kind}, ${report.source.libpadBytes.toLocaleString()} bytes`);
    console.log(`  SHA-256: ${protectedHash}${report.source.exactPad21_9 ? ' (PAD 21.9.0 exact)' : ''}`);
    console.log(`  protected named dynamic symbols: ${report.source.namedDynamicSymbols}`);
    if (!restoredElf) {
      console.log('  gameplay symbols: unavailable in the protected image; pass --restored /tmp/libpad-restored.so');
    } else {
      console.log(`  restored SHA-256: ${restoredHash}${report.restoration.exactKnownRestoration ? ' (known restoration)' : ''}`);
      console.log(`  restored named dynamic symbols: ${report.restoration.namedDynamicSymbols}`);
      let currentGroup = '';
      for (const symbol of symbols) {
        if (symbol.group !== currentGroup) {
          currentGroup = symbol.group;
          console.log(`\n[${currentGroup}]`);
        }
        const location = symbol.address
          ? `${symbol.address.padEnd(10)} ${String(symbol.size).padStart(6)} bytes`
          : `missing (expected ${symbol.expectedAddress})`;
        console.log(`  ${symbol.label.padEnd(30)} ${location}`);
      }
    }
    console.log('\n[board layout]');
    for (const [key, value] of Object.entries(report.layout)) console.log(`  ${key.padEnd(23)} ${value}`);
    console.log('\n[enemy skill runtime]');
    for (const [key, value] of Object.entries(report.enemySkillRuntime)) {
      console.log(`  ${key.padEnd(23)} ${value}`);
    }
    console.log('\n[enemy turn]');
    for (const [key, value] of Object.entries(report.enemyTurn)) {
      console.log(`  ${key.padEnd(23)} ${value}`);
    }
    console.log('\n[enemy AI]');
    for (const [key, value] of Object.entries(report.enemyAi)) {
      console.log(`  ${key.padEnd(23)} ${value}`);
    }
  }

  if (
    missing.length || mismatches.length
    || blackFallDispatchMatches === false || blackFallSetupMatches === false
    || sourceToPoisonDispatchMatches === false || sourceToPoisonSetupMatches === false
    || sourceToPoisonConditionMatches === false
    || sourceToMortalPoisonDispatchMatches === false
    || sourceToMortalPoisonSetupMatches === false
    || sourceToMortalPoisonConditionMatches === false
    || poisonBlocksDispatchMatches === false || poisonBlocksSetupMatches === false
    || poisonBlocksConditionMatches === false
    || mortalPoisonBlocksDispatchMatches === false || mortalPoisonBlocksSetupMatches === false
    || mortalPoisonBlocksConditionMatches === false
    || poisonBlockNCountedDispatchMatches === false || poisonBlockNCountedSetupMatches === false
    || poisonBlockNCountedConditionMatches === false
    || mortalPoisonBlockNCountedDispatchMatches === false
    || mortalPoisonBlockNCountedSetupMatches === false
    || mortalPoisonBlockNCountedConditionMatches === false
    || poisonBlockNDispatchMatches === false || poisonBlockNSetupMatches === false
    || poisonBlockNConditionMatches === false
    || horizontalLinesDispatchMatches === false || horizontalLinesSetupMatches === false
    || horizontalLinesConditionMatches === false
    || horizontalLines4DispatchMatches === false || horizontalLines4SetupMatches === false
    || horizontalLines4ConditionMatches === false
    || verticalLinesDispatchMatches === false || verticalLinesSetupMatches === false
    || verticalLinesConditionMatches === false
    || verticalLines4DispatchMatches === false || verticalLines4SetupMatches === false
    || verticalLines4ConditionMatches === false
    || poisonTypeListDispatchMatches === false || poisonTypeListSetupMatches === false
    || poisonTypeListConditionMatches === false
    || poisonTypeListDirectDispatchMatches === false || poisonTypeListDirectSetupMatches === false
    || poisonTypeListDirectConditionMatches === false
    || poisonMaskDirectDispatchMatches === false || poisonMaskDirectSetupMatches === false
    || poisonMaskDirectConditionMatches === false
    || poisonMaskDispatchMatches === false || poisonMaskSetupMatches === false
    || poisonMaskConditionMatches === false
    || blockMinusDispatchMatches === false || blockMinusSetupMatches === false
    || blockMinusConditionMatches === false
    || burDropDispatchMatches === false || burDropSetupMatches === false
    || burDropConditionMatches === false
  ) process.exitCode = 1;
}
