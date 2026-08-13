#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { ApkArchive } from '../src/binary-port/apk.js';
import { parseElf64 } from '../src/binary-port/elf64.js';

const APK_LIBPAD_PATH = 'lib/arm64-v8a/libpad.so';
const PAD_21_9_LIBPAD_SHA256 = '785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8';
const PAD_21_9_RESTORED_SHA256 = '91223570f42247f155e50fba03e529f2a21b936021bd1525928237a5c87cd99a';

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
  ['orb-state', 'doBlockSwapNew', '_ZN9cGAMEMAIN15_doBlockSwapNewEPhiP10sBLOCKFLAGj', 0x6aee90],
  ['orb-state', 'doBlockSwap4', '_ZN9cGAMEMAIN13_doBlockSwap4EtP10sBLOCKFLAG', 0x6af6cc],
  ['orb-state', 'doBlockSwap5', '_ZN9cGAMEMAIN13_doBlockSwap5EttP10sBLOCKFLAG', 0x6af564],
  ['orb-state', 'doBlockSwapV', '_ZN9cGAMEMAIN13_doBlockSwapVEhjRiP10sBLOCKFLAG', 0x6ae64c],
  ['orb-state', 'doBlockSwapH', '_ZN9cGAMEMAIN13_doBlockSwapHEhjRiP10sBLOCKFLAG', 0x6ae8fc],
  ['orb-state', 'doBlockSwap2', '_ZN9cGAMEMAIN13_doBlockSwap2EiiiiP10sBLOCKFLAG', 0x6af838],
  ['orb-state', 'doBlockSwap3', '_ZN9cGAMEMAIN13_doBlockSwap3EPKN9sSAVEDATA11sSKILLDATA210sSKILLDATAE', 0x6aea98],
  ['board', 'setupDungeons', '_ZN9cGAMEMAIN14_setupDungeonsEv', 0x65ac0c],
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
  }

  if (missing.length || mismatches.length) process.exitCode = 1;
}
