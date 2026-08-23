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
const SOURCE_ORB_CONVERSION_ENEMY_SKILL_TYPE = 4;
const SOURCE_ORB_CONVERSION_HANDLER = 0x6292b4;
const SOURCE_ORB_CONVERSION_SETUP_HANDLER = 0x61fee4;
const SOURCE_ORB_CONVERSION_CONDITION_HANDLER = 0x61b2d8;
const ENTIRE_BLIND_ENEMY_SKILL_TYPE = 5;
const ENTIRE_BLIND_HANDLER = 0x6286b4;
const ENTIRE_BLIND_SETUP_HANDLER = 0x6217c0;
const ENTIRE_BLIND_CONDITION_HANDLER = 0x61b31c;
const ENTIRE_BLIND_ALT_ENEMY_SKILL_TYPE = 62;
const ENTIRE_BLIND_ALT_HANDLER = 0x6289b8;
const ENTIRE_BLIND_ALT_SETUP_HANDLER = 0x620154;
const ENTIRE_BLIND_ALT_CONDITION_HANDLER = 0x61ae4c;
const BIND_ATTACK_ENEMY_SKILL_TYPE = 63;
const BIND_ATTACK_HANDLER = 0x628b94;
const BIND_ATTACK_SETUP_HANDLER = 0x621544;
const BIND_ATTACK_CONDITION_HANDLER = 0x61a87c;
const RANDOM_SUB_BIND_ENEMY_SKILL_TYPE = 65;
const RANDOM_SUB_BIND_HANDLER = 0x628fe0;
const RANDOM_SUB_BIND_SETUP_HANDLER = 0x621108;
const RANDOM_SUB_BIND_CONDITION_HANDLER = 0x61b6f0;
const CLEAR_PLAYER_BUFFS_ENEMY_SKILL_TYPE = 6;
const CLEAR_PLAYER_BUFFS_HANDLER = 0x6292e8;
const CLEAR_PLAYER_BUFFS_SETUP_HANDLER = 0x6217c0;
const CLEAR_PLAYER_BUFFS_CONDITION_HANDLER = 0x61b404;
const HEAL_ENEMY_SKILL_TYPE = 7;
const HEAL_ENEMY_HANDLER = 0x629098;
const HEAL_ENEMY_SETUP_HANDLER = 0x61ff5c;
const HEAL_ENEMY_CONDITION_HANDLER = 0x61b418;
const ADDITIONAL_ATTACK_ENEMY_SKILL_TYPE = 8;
const ADDITIONAL_ATTACK_HANDLER = 0x629304;
const ADDITIONAL_ATTACK_SETUP_HANDLER = 0x61ff5c;
const ADDITIONAL_ATTACK_CONDITION_HANDLER = 0x61b450;
const EARLY_DEFENSE_SHIELD_SKILLS = Object.freeze([
  Object.freeze({ type: 9, kind: 'defenseBoost', dispatch: 0x629360, setup: 0x6212ac }),
  Object.freeze({ type: 10, kind: 'attributeNullify', dispatch: 0x6293b8, setup: 0x61fee4 }),
  Object.freeze({ type: 11, kind: 'dualAttributeNullify', dispatch: 0x6293c8, setup: 0x6217a8 }),
].map((entry) => Object.freeze({ ...entry, condition: 0x61bb98 })));
const SOURCE_TO_JAMMER_ENEMY_SKILL_TYPE = 12;
const SOURCE_TO_JAMMER_HANDLER = 0x6293f8;
const SOURCE_TO_JAMMER_SETUP_HANDLER = 0x61ff08;
const SOURCE_TO_JAMMER_CONDITION_HANDLER = 0x61a63c;
const EARLY_PARTY_CONTROL_SKILLS = Object.freeze([
  Object.freeze({
    type: 13,
    kind: 'randomPartyBind',
    dispatch: 0x629430,
    setup: 0x61fee4,
    condition: 0x61ac50,
  }),
  Object.freeze({
    type: 14,
    kind: 'activeSkillSeal',
    dispatch: 0x629524,
    setup: 0x621300,
    condition: 0x61aca4,
  }),
]);
const REPEAT_ATTACK_ENEMY_SKILL_TYPE = 15;
const REPEAT_ATTACK_HANDLER = 0x62be50;
const REPEAT_ATTACK_SETUP_HANDLER = 0x6214a8;
const REPEAT_ATTACK_CONDITION_HANDLER = 0x61b49c;
const INACTIVITY_ENEMY_SKILL_TYPE = 16;
const INACTIVITY_HANDLER = 0x62be50;
const INACTIVITY_SETUP_HANDLER = 0x6217c0;
const INACTIVITY_CONDITION_HANDLER = 0x61acbc;
const UNCONDITIONAL_INACTIVITY_ENEMY_SKILL_TYPE = 66;
const UNCONDITIONAL_INACTIVITY_HANDLER = 0x62be50;
const UNCONDITIONAL_INACTIVITY_SETUP_HANDLER = 0x6217c0;
const UNCONDITIONAL_INACTIVITY_CONDITION_HANDLER = 0x61a630;
const COMBO_ABSORB_ENEMY_SKILL_TYPE = 67;
const COMBO_ABSORB_HANDLER = 0x629968;
const COMBO_ABSORB_SETUP_HANDLER = 0x61ffe8;
const COMBO_ABSORB_CONDITION_HANDLER = 0x61ab6c;
const SKYFALL_RATE_ENEMY_SKILL_TYPE = 68;
const SKYFALL_RATE_HANDLER = 0x629984;
const SKYFALL_RATE_SETUP_HANDLER = 0x6200a4;
const SKYFALL_RATE_CONDITION_HANDLER = 0x61af40;
const DEATH_CRY_ENEMY_SKILL_TYPE = 69;
const DEATH_CRY_HANDLER = 0x62be50;
const DEATH_CRY_SETUP_HANDLER = 0x621c94;
const DEATH_CRY_CONDITION_HANDLER = 0x61bb1c;
const INACTIVITY_PRESENTATION_ENEMY_SKILL_TYPE = 70;
const INACTIVITY_PRESENTATION_HANDLER = 0x6299fc;
const INACTIVITY_PRESENTATION_SETUP_HANDLER = 0x621790;
const INACTIVITY_PRESENTATION_CONDITION_HANDLER = 0x61b558;
const DAMAGE_VOID_ENEMY_SKILL_TYPE = 71;
const DAMAGE_VOID_HANDLER = 0x629a48;
const DAMAGE_VOID_SETUP_HANDLER = 0x6217a8;
const DAMAGE_VOID_CONDITION_HANDLER = 0x61b774;
const ATTRIBUTE_RESIST_ENEMY_SKILL_TYPE = 72;
const ATTRIBUTE_RESIST_HANDLER = 0x62be50;
const ATTRIBUTE_RESIST_SETUP_HANDLER = 0x621c94;
const ATTRIBUTE_RESIST_CONDITION_HANDLER = 0x61c01c;
const RESOLVE_ENEMY_SKILL_TYPE = 73;
const RESOLVE_HANDLER = 0x62be50;
const RESOLVE_SETUP_HANDLER = 0x621c94;
const RESOLVE_CONDITION_HANDLER = 0x61c01c;
const DAMAGE_SHIELD_ENEMY_SKILL_TYPE = 74;
const DAMAGE_SHIELD_HANDLER = 0x629a78;
const DAMAGE_SHIELD_SETUP_HANDLER = 0x61fee4;
const DAMAGE_SHIELD_CONDITION_HANDLER = 0x61af8c;
const LEADER_SWAP_ENEMY_SKILL_TYPE = 75;
const LEADER_SWAP_HANDLER = 0x629ad8;
const LEADER_SWAP_SETUP_HANDLER = 0x620444;
const LEADER_SWAP_CONDITION_HANDLER = 0x61ab74;
const NORMAL_ATTACK_ENEMY_SKILL_TYPE = 82;
const NORMAL_ATTACK_HANDLER = 0x62be50;
const NORMAL_ATTACK_SETUP_HANDLER = 0x621c94;
const NORMAL_ATTACK_CONDITION_HANDLER = 0x61a630;
const MULTI_ATTACK_ENEMY_SKILL_TYPE = 83;
const MULTI_ATTACK_HANDLER = 0x62be50;
const MULTI_ATTACK_SETUP_HANDLER = 0x621c94;
const MULTI_ATTACK_CONDITION_HANDLER = 0x61a630;
const MULTI_ATTACK_INSTRUCTION_ANCHORS = Object.freeze([
  [0x6222a0, 0x71014d1f], // cmp child-list owner type, #0x53
  [0x6222b0, 0x92400d08], // and cursor, packed state, #0xf
  [0x6222bc, 0xb9401101], // ldr child skill ID, [parent + cursor*4 + 0x10]
  [0x6222e0, 0x32180108], // set packed-state active bit 8
  [0x6226b4, 0x11000509], // increment the low-nibble child cursor
  [0x622808, 0x52801e0b], // initialize completed-child nibble to signed -1
  [0x622814, 0x3317594b], // insert parent ID into packed bits 9..31
  [0x628550, 0x13041d09], // signed extract of completed-child nibble
  [0x628570, 0xb907de68], // persist completed-child advance
]);
const UNCONDITIONAL_HEAL_ENEMY_SKILL_TYPE = 86;
const UNCONDITIONAL_HEAL_HANDLER = 0x629098;
const UNCONDITIONAL_HEAL_SETUP_HANDLER = 0x61ff5c;
const UNCONDITIONAL_HEAL_CONDITION_HANDLER = 0x61a630;
const DAMAGE_ABSORB_ENEMY_SKILL_TYPE = 87;
const DAMAGE_ABSORB_HANDLER = 0x629d9c;
const DAMAGE_ABSORB_SETUP_HANDLER = 0x61fee4;
const DAMAGE_ABSORB_CONDITION_HANDLER = 0x61af94;
const DAMAGE_ABSORB_INSTRUCTION_ANCHORS = Object.freeze([
  [0x629d9c, 0xb9467a61], // runtime +0x678 duration
  [0x629da0, 0x91258260], // protected duration at sMONSTER+0x960
  [0x629da8, 0xb9467e61], // runtime +0x67c damage threshold
  [0x629dac, 0x9125c260], // protected threshold at sMONSTER+0x970
  [0x61af94, 0x912582a0], // condition reads protected duration
  [0x624458, 0x91258280], // combat reads damage-absorb duration
  [0x62446c, 0x9125c280], // combat reads damage threshold
  [0x6244e0, 0xeb08033f], // compare resolved damage against threshold
]);
const AWAKENING_BIND_ENEMY_SKILL_TYPE = 88;
const AWAKENING_BIND_HANDLER = 0x629dc0;
const AWAKENING_BIND_SETUP_HANDLER = 0x6218a4;
const AWAKENING_BIND_CONDITION_HANDLER = 0x61b56c;
const AWAKENING_BIND_INSTRUCTION_ANCHORS = Object.freeze([
  [0x6218a4, 0xb94012a8], // definition +0x10 duration
  [0x6218b0, 0xb9067a68], // runtime +0x678 duration
  [0x629df8, 0x794cf26b], // execution reads duration as unsigned low 16 bits
  [0x629e10, 0x3300256a], // replace the packed counter's low ten bits
  [0x629e14, 0x3216014b], // set bit 0x400 for an already-active bind
  [0x629e20, 0x7829690a], // store the packed global awakening-bind timer
  [0x61b56c, 0x797e5f28], // condition reads the packed global timer
  [0x61b57c, 0x7101011f], // eligible only below shifted value 0x40
  [0x678acc, 0x375000aa], // active continuation bit skips one decrement
  [0x678ae0, 0x12157948], // clear continuation bit after enemy attack
]);
const SKILL_DELAY_ENEMY_SKILL_TYPE = 89;
const SKILL_DELAY_HANDLER = 0x629208;
const SKILL_DELAY_SETUP_HANDLER = 0x62117c;
const SKILL_DELAY_CONDITION_HANDLER = 0x61a630;
const SKILL_DELAY_INSTRUCTION_ANCHORS = Object.freeze([
  [0x62117c, 0x12800003], // setup invokes gauge-down helper in all-slot mode -1
  [0x61f950, 0xb9067b3f], // clear each per-card runtime delay at +0x678 + index*4
  [0x61f9c8, 0x29422b49], // load inclusive definition +0x10/+0x14 range
  [0x61f9f4, 0xb82c6909], // persist one shared-LCG step per eligible gauge
  [0x61fb44, 0x0b8942c9], // add scaled roll to authored minimum
  [0x61fb68, 0x4b080136], // subtract applicable awakening protection
  [0x61fb80, 0x6b2022df], // cap delay to the card's current skill charge
  [0x61f928, 0xb9000296], // store the materialized per-card delay
  [0x61fca0, 0x790cea68], // store six-bit target mask at runtime +0x674
  [0x629278, 0xb8766afb], // execution loads per-card runtime delay
  [0x629234, 0x4b1b0001], // subtract delay from current skill charge
  [0x6292ac, 0x2a1f03e1], // floor charge at zero when delay is larger
]);
const BLACK_FALL_ENEMY_SKILL_TYPE = 128;
const BLACK_FALL_HANDLER = 0x62a854;
const BLACK_FALL_SETUP_HANDLER = 0x6211a0;
const HEAL_PLAYER_ENEMY_SKILL_TYPE = 55;
const HEAL_PLAYER_HANDLER = 0x629900;
const HEAL_PLAYER_SETUP_HANDLER = 0x620040;
const HEAL_PLAYER_CONDITION_HANDLER = 0x61aa74;
const LONE_ATTACK_BOOST_ENEMY_SKILL_TYPE = 17;
const LONE_ATTACK_BOOST_HANDLER = 0x629064;
const LONE_ATTACK_BOOST_SETUP_HANDLER = 0x61ffdc;
const LONE_ATTACK_BOOST_CONDITION_HANDLER = 0x61acdc;
const STATUS_TRIGGERED_ATTACK_BOOST_ENEMY_SKILL_TYPE = 18;
const STATUS_TRIGGERED_ATTACK_BOOST_HANDLER = 0x629064;
const STATUS_TRIGGERED_ATTACK_BOOST_SETUP_HANDLER = 0x61fee4;
const STATUS_TRIGGERED_ATTACK_BOOST_CONDITION_HANDLER = 0x61ad7c;
const DAMAGED_TURN_ATTACK_BOOST_ENEMY_SKILL_TYPE = 19;
const DAMAGED_TURN_ATTACK_BOOST_HANDLER = 0x629064;
const DAMAGED_TURN_ATTACK_BOOST_SETUP_HANDLER = 0x61ffdc;
const DAMAGED_TURN_ATTACK_BOOST_CONDITION_HANDLER = 0x61ade8;
const STATUS_SHIELD_ENEMY_SKILL_TYPE = 20;
const STATUS_SHIELD_HANDLER = 0x629534;
const STATUS_SHIELD_SETUP_HANDLER = 0x61ff08;
const STATUS_SHIELD_CONDITION_HANDLER = 0x61b4d8;
const INACTIVE_ENEMY_SKILL_TYPE37_SETUP_HANDLER = 0x6217c0;
const INACTIVE_ENEMY_SKILL_TYPES_21_THROUGH_38 = Object.freeze(
  Array.from({ length: 18 }, (_, index) => index + 21),
);
const MOVE_TIME_REDUCTION_ENEMY_SKILL_TYPE = 39;
const MOVE_TIME_REDUCTION_HANDLER = 0x629544;
const MOVE_TIME_REDUCTION_SETUP_HANDLER = 0x6217a8;
const MOVE_TIME_REDUCTION_CONDITION_HANDLER = 0x61b4f0;
const SELF_DESTRUCT_ENEMY_SKILL_TYPE = 40;
const SELF_DESTRUCT_HANDLER = 0x629660;
const SELF_DESTRUCT_SETUP_HANDLER = 0x6217c0;
const SELF_DESTRUCT_CONDITION_HANDLER = 0x61a630;
const INACTIVE_ENEMY_SKILL_TYPES = Object.freeze([41, 42, 43, 44, 45]);
const INACTIVE_ENEMY_SKILL_HANDLER = 0x62be50;
const INACTIVE_ENEMY_SKILL_SETUP_HANDLER = 0x621c94;
const INACTIVE_ENEMY_SKILL_CONDITION_HANDLER = 0x61c01c;
const CHANGE_ATTRIBUTE_ENEMY_SKILL_TYPE = 46;
const CHANGE_ATTRIBUTE_HANDLER = 0x629708;
const CHANGE_ATTRIBUTE_SETUP_HANDLER = 0x621504;
const CHANGE_ATTRIBUTE_CONDITION_HANDLER = 0x61b520;
const SCALED_ATTACK_ENEMY_SKILL_TYPE = 47;
const SCALED_ATTACK_HANDLER = 0x62972c;
const SCALED_ATTACK_SETUP_HANDLER = 0x620040;
const SCALED_ATTACK_CONDITION_HANDLER = 0x61b54c;
const CURRENT_HP_GRAVITY_ENEMY_SKILL_TYPE = 50;
const CURRENT_HP_GRAVITY_HANDLER = 0x62974c;
const CURRENT_HP_GRAVITY_SETUP_HANDLER = 0x621530;
const CURRENT_HP_GRAVITY_CONDITION_HANDLER = 0x61a630;
const REVIVE_ENEMY_SKILL_TYPE = 52;
const REVIVE_ENEMY_HANDLER = 0x6297ac;
const REVIVE_ENEMY_SETUP_HANDLER = 0x620350;
const REVIVE_ENEMY_CONDITION_HANDLER = 0x61a9d0;
const ATTRIBUTE_ABSORB_ENEMY_SKILL_TYPE = 53;
const ATTRIBUTE_ABSORB_HANDLER = 0x6298ac;
const ATTRIBUTE_ABSORB_SETUP_HANDLER = 0x61ffe8;
const ATTRIBUTE_ABSORB_CONDITION_HANDLER = 0x61ae34;
const BIND_LEADER_HELPER_ENEMY_SKILL_TYPE = 54;
const BIND_LEADER_HELPER_HANDLER = 0x628fe0;
const BIND_LEADER_HELPER_SETUP_HANDLER = 0x621008;
const BIND_LEADER_HELPER_CONDITION_HANDLER = 0x61aa5c;
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
  ['input', 'resetTouchBar', '_ZN9cGAMEMAIN14_resetTouchBarEv', 0x675514],
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
  ['orb-state', 'countBlackBlocks', '_ZNK9cGAMEMAIN17_countBlackBlocksEv', 0x618058],
  ['orb-state', 'doBlock2Black', '_ZN9cGAMEMAIN14_doBlock2BlackEv', 0x625994],
  ['orb-state', 'doMakeInvDropEfc', '_ZN9cGAMEMAIN17_doMakeInvDropEfcEb', 0x627e58],
  ['orb-state', 'clearBlackFall', '_ZN9cGAMEMAIN15_clearBlackFallEv', 0x6b57a0],
  ['orb-state', 'incEneTurn', '_ZN9cGAMEMAIN11_incEneTurnEb', 0x677978],
  ['orb-state', 'doEnemySkill', '_ZN9cGAMEMAIN13_doEnemySkillEP8sMONSTER', 0x6285a4],
  ['enemy-death', 'setupDeadmanEffect', '_ZN9cGAMEMAIN19_setupDeadmanEffectEP8sMONSTER', 0x62d4d8],
  ['enemy-death', 'gamePhaseEnemyDead', '_ZN9cGAMEMAIN19_gamePhaseEnemyDeadEv', 0x64b9e4],
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
  ['orb-state', 'checkNewBlockSwap', '_ZN9cGAMEMAIN18_checkNewBlockSwapERfii', 0x617cdc],
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
  ['enemy-ai', 'setupDoubleAttack', '_ZN9cGAMEMAIN18_setupDoubleAttackEP8sMONSTER', 0x62224c],
  ['enemy-ai', 'checkEndOfMultiAttack', '_ZN9cGAMEMAIN22_checkEndOfMultiAttackEP8sMONSTER', 0x628510],
  ['enemy-ai', 'setupEnemyAttack', '_ZN9cGAMEMAIN17_setupEnemyAttackEv', 0x622f64],
  ['enemy-ai', 'resetEnemyAtkLeft', '_ZN9cGAMEMAIN18_resetEnemyAtkLeftEP8sMONSTER', 0x6408f0],
  ['enemy-ai', 'resetMonsterStatus', '_ZN8sMONSTER11resetStatusEv', 0x6b159c],
  ['enemy-ai', 'clearMonsterStatus', '_ZN9cGAMEMAIN16_monsStatusClearEb', 0x691bcc],
  ['enemy-ai', 'doItetukuHadou', '_ZN9cGAMEMAIN15_doItetukuHadouEv', 0x618d04],
  ['enemy-ai', 'getCountClearParams', '_ZNK9cGAMEMAIN20_getCountClearParamsEP8sMONSTER', 0x618320],
  ['enemy-ai', 'applyLeaderSkill', '_ZN9cGAMEMAIN17_applyLeaderSkillEb', 0x63a7e8],
  ['enemy-ai', 'doLeaderChange', '_ZN9cGAMEMAIN15_doLeaderChangeEP5sCARDib', 0x6b5afc],
  ['enemy-ai', 'monsterAddHp', '_ZN8sMONSTER5addHpEx', 0x6246e8],
  ['enemy-ai', 'playerMaxHp', '_ZNK7sPLAYER3mhpEv', 0x66b840],
  ['enemy-ai', 'playerAddHp', '_ZN7sPLAYER5addHpEib', 0x678838],
  ['enemy-ai', 'doBind', '_ZN9cGAMEMAIN7_doBindEPK8sMONSTERjib', 0x616de4],
  ['enemy-ai', 'doSelectBindTargets', '_ZN9cGAMEMAIN19_doSelectBindTargesEbii', 0x61652c],
  ['enemy-ai', 'canBindCard', '_ZNK9cGAMEMAIN12_canBindCardEi', 0x6168b8],
  ['enemy-ai', 'doVoidActSkill', '_ZN9cGAMEMAIN15_doVoidActSkillEPK8sMONSTER', 0x616924],
  ['enemy-ai', 'doOnPostEnemyAttack', '_ZN9cGAMEMAIN20_doOnPostEnemyAttackEv', 0x678980],
  ['enemy-ai', 'doRepeatAttack', '_ZN9cGAMEMAIN15_doRepeatAttackEP8sMONSTER', 0x625a64],
  ['enemy-ai', 'hasPassiveSkillsCard', '_ZNK9cGAMEMAIN17_hasPassiveSkillsEPK5sCARDi', 0x640a90],
  ['enemy-ai', 'isValidCardNumber', '_ZN9cSAVEDATA17isValidCardNumberEib', 0x74393c],
  ['combat', 'checkMonsterAbsorb', '_ZN9cGAMEMAIN18_checkMonterAbsorbEv', 0x6239dc],
  ['combat', 'calcFinalDamage', '_ZN9cGAMEMAIN16_calcFinalDamageEbPK5sCARDPNS0_7sATKINFExRiP8sMONSTERiRbS8_S8_', 0x623b40],
  ['combat', 'checkPassiveSkills', '_ZN9cGAMEMAIN19_checkPassiveSkillsEP8sMONSTER', 0x62d984],
  ['combat', 'checkDamageRatioForDisplay', '_ZNK9cGAMEMAIN28_chcekDamageRatio4DamageDispEiPK8sMONSTERPK5sCARDPNS_12sMONSDEFFLAGE', 0x684274],
  ['combat', 'attack2Enemy', '_ZN9cGAMEMAIN13_attack2EnemyEP5sCARDPNS0_7sATKINFExiP8sMONSTERixi', 0x624998],
  ['combat', 'isHitSuperResolve', '_ZN8sMONSTER13isHitKonjyou2Ev', 0x625794],
  ['combat', 'monsterEndOfAttack', '_ZN9cGAMEMAIN19_monsterEndOfAttackEP8sMONSTER', 0x622364],
  ['combat', 'initTurn', '_ZN9cGAMEMAIN9_initTurnEv', 0x679a64],
  ['combat', 'drawAndCountMonsIcons', '_ZN9cGAMEMAIN22_drawAndCountMonsIconsEPiP8sMONSTERR6IS_V2D8IS_RGBA8', 0x6a36fc],
  ['math', 'roundDouble', 'izMathRoundD', 0x36b2ec],
  ['math', 'roundFloat', 'izMathRound', 0x36a9bc],
  ['math', 'clipFloat', 'izMathClipF', 0x36a9a8],
  ['math', 'roundSignedInt64', 'izMathRoundSint64', 0x36b3e0],
  ['math', 'signedIntMultiplyAdd', 'izMathSint32MulAdd', 0x36b3fc],
  ['combat', 'setEnemyAttackMain', '_ZN9cGAMEMAIN20__setEnemyAttackMainEP8sMONSTERbfi', 0x62c2cc],
  ['combat', 'setEnemyAttack', '_ZN9cGAMEMAIN15_setEnemyAttackEP8sMONSTERfi', 0x625bcc],
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

function readUint32Virtual(elf, bytes, address) {
  const segment = elf?.loadSegments.find((candidate) => (
    address >= candidate.virtualAddress
    && address + 4 <= candidate.virtualAddress + candidate.fileSize
  ));
  if (!segment) return null;
  const offset = segment.fileOffset + address - segment.virtualAddress;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
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
  const resolveEarlyEnemySkillTarget = (type) => {
    if (!restoredElf) return null;
    const entry = readUint16Virtual(
      restoredElf,
      restoredBytes,
      EARLY_ENEMY_SKILL_DISPATCH_TABLE + (type - 5) * 2,
    );
    return EARLY_ENEMY_SKILL_DISPATCH_BASE + entry * 4;
  };
  const sourceOrbConversionDispatchTarget = resolveEnemySkillTarget(
    SOURCE_ORB_CONVERSION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const sourceOrbConversionSetupTarget = resolveEnemySkillTarget(
    SOURCE_ORB_CONVERSION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const sourceOrbConversionConditionTarget = resolveEnemySkillTarget(
    SOURCE_ORB_CONVERSION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const sourceOrbConversionDispatchMatches = sourceOrbConversionDispatchTarget === null
    ? null : sourceOrbConversionDispatchTarget === SOURCE_ORB_CONVERSION_HANDLER;
  const sourceOrbConversionSetupMatches = sourceOrbConversionSetupTarget === null
    ? null : sourceOrbConversionSetupTarget === SOURCE_ORB_CONVERSION_SETUP_HANDLER;
  const sourceOrbConversionConditionMatches = sourceOrbConversionConditionTarget === null
    ? null : sourceOrbConversionConditionTarget === SOURCE_ORB_CONVERSION_CONDITION_HANDLER;
  const entireBlindDispatchTarget = resolveEarlyEnemySkillTarget(ENTIRE_BLIND_ENEMY_SKILL_TYPE);
  const entireBlindSetupTarget = resolveEnemySkillTarget(
    ENTIRE_BLIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const entireBlindConditionTarget = resolveEnemySkillTarget(
    ENTIRE_BLIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const entireBlindDispatchMatches = entireBlindDispatchTarget === null
    ? null : entireBlindDispatchTarget === ENTIRE_BLIND_HANDLER;
  const entireBlindSetupMatches = entireBlindSetupTarget === null
    ? null : entireBlindSetupTarget === ENTIRE_BLIND_SETUP_HANDLER;
  const entireBlindConditionMatches = entireBlindConditionTarget === null
    ? null : entireBlindConditionTarget === ENTIRE_BLIND_CONDITION_HANDLER;
  const entireBlindAltDispatchTarget = resolveEarlyEnemySkillTarget(
    ENTIRE_BLIND_ALT_ENEMY_SKILL_TYPE,
  );
  const entireBlindAltSetupTarget = resolveEnemySkillTarget(
    ENTIRE_BLIND_ALT_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const entireBlindAltConditionTarget = resolveEnemySkillTarget(
    ENTIRE_BLIND_ALT_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const entireBlindAltDispatchMatches = entireBlindAltDispatchTarget === null
    ? null : entireBlindAltDispatchTarget === ENTIRE_BLIND_ALT_HANDLER;
  const entireBlindAltSetupMatches = entireBlindAltSetupTarget === null
    ? null : entireBlindAltSetupTarget === ENTIRE_BLIND_ALT_SETUP_HANDLER;
  const entireBlindAltConditionMatches = entireBlindAltConditionTarget === null
    ? null : entireBlindAltConditionTarget === ENTIRE_BLIND_ALT_CONDITION_HANDLER;
  const bindAttackDispatchTarget = resolveEarlyEnemySkillTarget(BIND_ATTACK_ENEMY_SKILL_TYPE);
  const bindAttackSetupTarget = resolveEnemySkillTarget(
    BIND_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const bindAttackConditionTarget = resolveEnemySkillTarget(
    BIND_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const bindAttackDispatchMatches = bindAttackDispatchTarget === null
    ? null : bindAttackDispatchTarget === BIND_ATTACK_HANDLER;
  const bindAttackSetupMatches = bindAttackSetupTarget === null
    ? null : bindAttackSetupTarget === BIND_ATTACK_SETUP_HANDLER;
  const bindAttackConditionMatches = bindAttackConditionTarget === null
    ? null : bindAttackConditionTarget === BIND_ATTACK_CONDITION_HANDLER;
  const randomSubBindDispatchTarget = resolveEnemySkillTarget(
    RANDOM_SUB_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const randomSubBindSetupTarget = resolveEnemySkillTarget(
    RANDOM_SUB_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const randomSubBindConditionTarget = resolveEnemySkillTarget(
    RANDOM_SUB_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const randomSubBindDispatchMatches = randomSubBindDispatchTarget === null
    ? null : randomSubBindDispatchTarget === RANDOM_SUB_BIND_HANDLER;
  const randomSubBindSetupMatches = randomSubBindSetupTarget === null
    ? null : randomSubBindSetupTarget === RANDOM_SUB_BIND_SETUP_HANDLER;
  const randomSubBindConditionMatches = randomSubBindConditionTarget === null
    ? null : randomSubBindConditionTarget === RANDOM_SUB_BIND_CONDITION_HANDLER;
  const clearPlayerBuffsDispatchTarget = resolveEnemySkillTarget(
    CLEAR_PLAYER_BUFFS_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const clearPlayerBuffsSetupTarget = resolveEnemySkillTarget(
    CLEAR_PLAYER_BUFFS_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const clearPlayerBuffsConditionTarget = resolveEnemySkillTarget(
    CLEAR_PLAYER_BUFFS_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const clearPlayerBuffsDispatchMatches = clearPlayerBuffsDispatchTarget === null
    ? null : clearPlayerBuffsDispatchTarget === CLEAR_PLAYER_BUFFS_HANDLER;
  const clearPlayerBuffsSetupMatches = clearPlayerBuffsSetupTarget === null
    ? null : clearPlayerBuffsSetupTarget === CLEAR_PLAYER_BUFFS_SETUP_HANDLER;
  const clearPlayerBuffsConditionMatches = clearPlayerBuffsConditionTarget === null
    ? null : clearPlayerBuffsConditionTarget === CLEAR_PLAYER_BUFFS_CONDITION_HANDLER;
  const healEnemyDispatchTarget = resolveEnemySkillTarget(
    HEAL_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const healEnemySetupTarget = resolveEnemySkillTarget(
    HEAL_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const healEnemyConditionTarget = resolveEnemySkillTarget(
    HEAL_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const healEnemyDispatchMatches = healEnemyDispatchTarget === null
    ? null : healEnemyDispatchTarget === HEAL_ENEMY_HANDLER;
  const healEnemySetupMatches = healEnemySetupTarget === null
    ? null : healEnemySetupTarget === HEAL_ENEMY_SETUP_HANDLER;
  const healEnemyConditionMatches = healEnemyConditionTarget === null
    ? null : healEnemyConditionTarget === HEAL_ENEMY_CONDITION_HANDLER;
  const additionalAttackDispatchTarget = resolveEnemySkillTarget(
    ADDITIONAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const additionalAttackSetupTarget = resolveEnemySkillTarget(
    ADDITIONAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const additionalAttackConditionTarget = resolveEnemySkillTarget(
    ADDITIONAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const additionalAttackDispatchMatches = additionalAttackDispatchTarget === null
    ? null : additionalAttackDispatchTarget === ADDITIONAL_ATTACK_HANDLER;
  const additionalAttackSetupMatches = additionalAttackSetupTarget === null
    ? null : additionalAttackSetupTarget === ADDITIONAL_ATTACK_SETUP_HANDLER;
  const additionalAttackConditionMatches = additionalAttackConditionTarget === null
    ? null : additionalAttackConditionTarget === ADDITIONAL_ATTACK_CONDITION_HANDLER;
  const earlyDefenseShieldTargets = EARLY_DEFENSE_SHIELD_SKILLS.map((entry) => {
    const dispatchTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
    );
    const setupTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
    );
    const conditionTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
    );
    return Object.freeze({
      ...entry,
      dispatchTarget,
      setupTarget,
      conditionTarget,
      matches21_9: dispatchTarget === null ? null : (
        dispatchTarget === entry.dispatch
        && setupTarget === entry.setup
        && conditionTarget === entry.condition
      ),
    });
  });
  const earlyDefenseShieldEntriesMatch = restoredElf === null
    ? null : earlyDefenseShieldTargets.every((entry) => entry.matches21_9);
  const sourceToJammerDispatchTarget = resolveEnemySkillTarget(
    SOURCE_TO_JAMMER_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const sourceToJammerSetupTarget = resolveEnemySkillTarget(
    SOURCE_TO_JAMMER_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const sourceToJammerConditionTarget = resolveEnemySkillTarget(
    SOURCE_TO_JAMMER_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const sourceToJammerDispatchMatches = sourceToJammerDispatchTarget === null
    ? null : sourceToJammerDispatchTarget === SOURCE_TO_JAMMER_HANDLER;
  const sourceToJammerSetupMatches = sourceToJammerSetupTarget === null
    ? null : sourceToJammerSetupTarget === SOURCE_TO_JAMMER_SETUP_HANDLER;
  const sourceToJammerConditionMatches = sourceToJammerConditionTarget === null
    ? null : sourceToJammerConditionTarget === SOURCE_TO_JAMMER_CONDITION_HANDLER;
  const earlyPartyControlTargets = EARLY_PARTY_CONTROL_SKILLS.map((entry) => {
    const dispatchTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
    );
    const setupTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
    );
    const conditionTarget = resolveEnemySkillTarget(
      entry.type, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
    );
    return Object.freeze({
      ...entry,
      dispatchTarget,
      setupTarget,
      conditionTarget,
      matches21_9: dispatchTarget === null ? null : (
        dispatchTarget === entry.dispatch
        && setupTarget === entry.setup
        && conditionTarget === entry.condition
      ),
    });
  });
  const earlyPartyControlEntriesMatch = restoredElf === null
    ? null : earlyPartyControlTargets.every((entry) => entry.matches21_9);
  const repeatAttackDispatchTarget = resolveEnemySkillTarget(
    REPEAT_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const repeatAttackSetupTarget = resolveEnemySkillTarget(
    REPEAT_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const repeatAttackConditionTarget = resolveEnemySkillTarget(
    REPEAT_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const repeatAttackDispatchMatches = repeatAttackDispatchTarget === null
    ? null : repeatAttackDispatchTarget === REPEAT_ATTACK_HANDLER;
  const repeatAttackSetupMatches = repeatAttackSetupTarget === null
    ? null : repeatAttackSetupTarget === REPEAT_ATTACK_SETUP_HANDLER;
  const repeatAttackConditionMatches = repeatAttackConditionTarget === null
    ? null : repeatAttackConditionTarget === REPEAT_ATTACK_CONDITION_HANDLER;
  const inactivityDispatchTarget = resolveEnemySkillTarget(
    INACTIVITY_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const inactivitySetupTarget = resolveEnemySkillTarget(
    INACTIVITY_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const inactivityConditionTarget = resolveEnemySkillTarget(
    INACTIVITY_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const inactivityDispatchMatches = inactivityDispatchTarget === null
    ? null : inactivityDispatchTarget === INACTIVITY_HANDLER;
  const inactivitySetupMatches = inactivitySetupTarget === null
    ? null : inactivitySetupTarget === INACTIVITY_SETUP_HANDLER;
  const inactivityConditionMatches = inactivityConditionTarget === null
    ? null : inactivityConditionTarget === INACTIVITY_CONDITION_HANDLER;
  const unconditionalInactivityDispatchTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_INACTIVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const unconditionalInactivitySetupTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_INACTIVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const unconditionalInactivityConditionTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_INACTIVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const unconditionalInactivityDispatchMatches = unconditionalInactivityDispatchTarget === null
    ? null : unconditionalInactivityDispatchTarget === UNCONDITIONAL_INACTIVITY_HANDLER;
  const unconditionalInactivitySetupMatches = unconditionalInactivitySetupTarget === null
    ? null : unconditionalInactivitySetupTarget === UNCONDITIONAL_INACTIVITY_SETUP_HANDLER;
  const unconditionalInactivityConditionMatches = unconditionalInactivityConditionTarget === null
    ? null : unconditionalInactivityConditionTarget === UNCONDITIONAL_INACTIVITY_CONDITION_HANDLER;
  const comboAbsorbDispatchTarget = resolveEnemySkillTarget(
    COMBO_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const comboAbsorbSetupTarget = resolveEnemySkillTarget(
    COMBO_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const comboAbsorbConditionTarget = resolveEnemySkillTarget(
    COMBO_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const comboAbsorbDispatchMatches = comboAbsorbDispatchTarget === null
    ? null : comboAbsorbDispatchTarget === COMBO_ABSORB_HANDLER;
  const comboAbsorbSetupMatches = comboAbsorbSetupTarget === null
    ? null : comboAbsorbSetupTarget === COMBO_ABSORB_SETUP_HANDLER;
  const comboAbsorbConditionMatches = comboAbsorbConditionTarget === null
    ? null : comboAbsorbConditionTarget === COMBO_ABSORB_CONDITION_HANDLER;
  const skyfallRateDispatchTarget = resolveEnemySkillTarget(
    SKYFALL_RATE_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const skyfallRateSetupTarget = resolveEnemySkillTarget(
    SKYFALL_RATE_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const skyfallRateConditionTarget = resolveEnemySkillTarget(
    SKYFALL_RATE_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const skyfallRateDispatchMatches = skyfallRateDispatchTarget === null
    ? null : skyfallRateDispatchTarget === SKYFALL_RATE_HANDLER;
  const skyfallRateSetupMatches = skyfallRateSetupTarget === null
    ? null : skyfallRateSetupTarget === SKYFALL_RATE_SETUP_HANDLER;
  const skyfallRateConditionMatches = skyfallRateConditionTarget === null
    ? null : skyfallRateConditionTarget === SKYFALL_RATE_CONDITION_HANDLER;
  const deathCryDispatchTarget = resolveEnemySkillTarget(
    DEATH_CRY_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const deathCrySetupTarget = resolveEnemySkillTarget(
    DEATH_CRY_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const deathCryConditionTarget = resolveEnemySkillTarget(
    DEATH_CRY_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const deathCryDispatchMatches = deathCryDispatchTarget === null
    ? null : deathCryDispatchTarget === DEATH_CRY_HANDLER;
  const deathCrySetupMatches = deathCrySetupTarget === null
    ? null : deathCrySetupTarget === DEATH_CRY_SETUP_HANDLER;
  const deathCryConditionMatches = deathCryConditionTarget === null
    ? null : deathCryConditionTarget === DEATH_CRY_CONDITION_HANDLER;
  const inactivityPresentationDispatchTarget = resolveEnemySkillTarget(
    INACTIVITY_PRESENTATION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const inactivityPresentationSetupTarget = resolveEnemySkillTarget(
    INACTIVITY_PRESENTATION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const inactivityPresentationConditionTarget = resolveEnemySkillTarget(
    INACTIVITY_PRESENTATION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const inactivityPresentationDispatchMatches = inactivityPresentationDispatchTarget === null
    ? null : inactivityPresentationDispatchTarget === INACTIVITY_PRESENTATION_HANDLER;
  const inactivityPresentationSetupMatches = inactivityPresentationSetupTarget === null
    ? null : inactivityPresentationSetupTarget === INACTIVITY_PRESENTATION_SETUP_HANDLER;
  const inactivityPresentationConditionMatches = inactivityPresentationConditionTarget === null
    ? null : inactivityPresentationConditionTarget === INACTIVITY_PRESENTATION_CONDITION_HANDLER;
  const damageVoidDispatchTarget = resolveEnemySkillTarget(
    DAMAGE_VOID_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const damageVoidSetupTarget = resolveEnemySkillTarget(
    DAMAGE_VOID_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const damageVoidConditionTarget = resolveEnemySkillTarget(
    DAMAGE_VOID_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const damageVoidDispatchMatches = damageVoidDispatchTarget === null
    ? null : damageVoidDispatchTarget === DAMAGE_VOID_HANDLER;
  const damageVoidSetupMatches = damageVoidSetupTarget === null
    ? null : damageVoidSetupTarget === DAMAGE_VOID_SETUP_HANDLER;
  const damageVoidConditionMatches = damageVoidConditionTarget === null
    ? null : damageVoidConditionTarget === DAMAGE_VOID_CONDITION_HANDLER;
  const attributeResistDispatchTarget = resolveEnemySkillTarget(
    ATTRIBUTE_RESIST_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const attributeResistSetupTarget = resolveEnemySkillTarget(
    ATTRIBUTE_RESIST_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const attributeResistConditionTarget = resolveEnemySkillTarget(
    ATTRIBUTE_RESIST_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const attributeResistDispatchMatches = attributeResistDispatchTarget === null
    ? null : attributeResistDispatchTarget === ATTRIBUTE_RESIST_HANDLER;
  const attributeResistSetupMatches = attributeResistSetupTarget === null
    ? null : attributeResistSetupTarget === ATTRIBUTE_RESIST_SETUP_HANDLER;
  const attributeResistConditionMatches = attributeResistConditionTarget === null
    ? null : attributeResistConditionTarget === ATTRIBUTE_RESIST_CONDITION_HANDLER;
  const resolveDispatchTarget = resolveEnemySkillTarget(
    RESOLVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const resolveSetupTarget = resolveEnemySkillTarget(
    RESOLVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const resolveConditionTarget = resolveEnemySkillTarget(
    RESOLVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const resolveDispatchMatches = resolveDispatchTarget === null
    ? null : resolveDispatchTarget === RESOLVE_HANDLER;
  const resolveSetupMatches = resolveSetupTarget === null
    ? null : resolveSetupTarget === RESOLVE_SETUP_HANDLER;
  const resolveConditionMatches = resolveConditionTarget === null
    ? null : resolveConditionTarget === RESOLVE_CONDITION_HANDLER;
  const damageShieldDispatchTarget = resolveEnemySkillTarget(
    DAMAGE_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const damageShieldSetupTarget = resolveEnemySkillTarget(
    DAMAGE_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const damageShieldConditionTarget = resolveEnemySkillTarget(
    DAMAGE_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const damageShieldDispatchMatches = damageShieldDispatchTarget === null
    ? null : damageShieldDispatchTarget === DAMAGE_SHIELD_HANDLER;
  const damageShieldSetupMatches = damageShieldSetupTarget === null
    ? null : damageShieldSetupTarget === DAMAGE_SHIELD_SETUP_HANDLER;
  const damageShieldConditionMatches = damageShieldConditionTarget === null
    ? null : damageShieldConditionTarget === DAMAGE_SHIELD_CONDITION_HANDLER;
  const leaderSwapDispatchTarget = resolveEnemySkillTarget(
    LEADER_SWAP_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const leaderSwapSetupTarget = resolveEnemySkillTarget(
    LEADER_SWAP_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const leaderSwapConditionTarget = resolveEnemySkillTarget(
    LEADER_SWAP_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const leaderSwapDispatchMatches = leaderSwapDispatchTarget === null
    ? null : leaderSwapDispatchTarget === LEADER_SWAP_HANDLER;
  const leaderSwapSetupMatches = leaderSwapSetupTarget === null
    ? null : leaderSwapSetupTarget === LEADER_SWAP_SETUP_HANDLER;
  const leaderSwapConditionMatches = leaderSwapConditionTarget === null
    ? null : leaderSwapConditionTarget === LEADER_SWAP_CONDITION_HANDLER;
  const normalAttackDispatchTarget = resolveEnemySkillTarget(
    NORMAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const normalAttackSetupTarget = resolveEnemySkillTarget(
    NORMAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const normalAttackConditionTarget = resolveEnemySkillTarget(
    NORMAL_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const normalAttackDispatchMatches = normalAttackDispatchTarget === null
    ? null : normalAttackDispatchTarget === NORMAL_ATTACK_HANDLER;
  const normalAttackSetupMatches = normalAttackSetupTarget === null
    ? null : normalAttackSetupTarget === NORMAL_ATTACK_SETUP_HANDLER;
  const normalAttackConditionMatches = normalAttackConditionTarget === null
    ? null : normalAttackConditionTarget === NORMAL_ATTACK_CONDITION_HANDLER;
  const multiAttackDispatchTarget = resolveEnemySkillTarget(
    MULTI_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const multiAttackSetupTarget = resolveEnemySkillTarget(
    MULTI_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const multiAttackConditionTarget = resolveEnemySkillTarget(
    MULTI_ATTACK_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const multiAttackDispatchMatches = multiAttackDispatchTarget === null
    ? null : multiAttackDispatchTarget === MULTI_ATTACK_HANDLER;
  const multiAttackSetupMatches = multiAttackSetupTarget === null
    ? null : multiAttackSetupTarget === MULTI_ATTACK_SETUP_HANDLER;
  const multiAttackConditionMatches = multiAttackConditionTarget === null
    ? null : multiAttackConditionTarget === MULTI_ATTACK_CONDITION_HANDLER;
  const multiAttackInstructionAnchorsMatch = restoredElf === null ? null
    : MULTI_ATTACK_INSTRUCTION_ANCHORS.every(([address, instruction]) => (
      readUint32Virtual(restoredElf, restoredBytes, address) === instruction
    ));
  const unconditionalHealDispatchTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_HEAL_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const unconditionalHealSetupTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_HEAL_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const unconditionalHealConditionTarget = resolveEnemySkillTarget(
    UNCONDITIONAL_HEAL_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const unconditionalHealDispatchMatches = unconditionalHealDispatchTarget === null
    ? null : unconditionalHealDispatchTarget === UNCONDITIONAL_HEAL_HANDLER;
  const unconditionalHealSetupMatches = unconditionalHealSetupTarget === null
    ? null : unconditionalHealSetupTarget === UNCONDITIONAL_HEAL_SETUP_HANDLER;
  const unconditionalHealConditionMatches = unconditionalHealConditionTarget === null
    ? null : unconditionalHealConditionTarget === UNCONDITIONAL_HEAL_CONDITION_HANDLER;
  const damageAbsorbDispatchTarget = resolveEnemySkillTarget(
    DAMAGE_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const damageAbsorbSetupTarget = resolveEnemySkillTarget(
    DAMAGE_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const damageAbsorbConditionTarget = resolveEnemySkillTarget(
    DAMAGE_ABSORB_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const damageAbsorbDispatchMatches = damageAbsorbDispatchTarget === null
    ? null : damageAbsorbDispatchTarget === DAMAGE_ABSORB_HANDLER;
  const damageAbsorbSetupMatches = damageAbsorbSetupTarget === null
    ? null : damageAbsorbSetupTarget === DAMAGE_ABSORB_SETUP_HANDLER;
  const damageAbsorbConditionMatches = damageAbsorbConditionTarget === null
    ? null : damageAbsorbConditionTarget === DAMAGE_ABSORB_CONDITION_HANDLER;
  const damageAbsorbInstructionAnchorsMatch = restoredElf === null ? null
    : DAMAGE_ABSORB_INSTRUCTION_ANCHORS.every(([address, instruction]) => (
      readUint32Virtual(restoredElf, restoredBytes, address) === instruction
    ));
  const awakeningBindDispatchTarget = resolveEnemySkillTarget(
    AWAKENING_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const awakeningBindSetupTarget = resolveEnemySkillTarget(
    AWAKENING_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const awakeningBindConditionTarget = resolveEnemySkillTarget(
    AWAKENING_BIND_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const awakeningBindDispatchMatches = awakeningBindDispatchTarget === null
    ? null : awakeningBindDispatchTarget === AWAKENING_BIND_HANDLER;
  const awakeningBindSetupMatches = awakeningBindSetupTarget === null
    ? null : awakeningBindSetupTarget === AWAKENING_BIND_SETUP_HANDLER;
  const awakeningBindConditionMatches = awakeningBindConditionTarget === null
    ? null : awakeningBindConditionTarget === AWAKENING_BIND_CONDITION_HANDLER;
  const awakeningBindInstructionAnchorsMatch = restoredElf === null ? null
    : AWAKENING_BIND_INSTRUCTION_ANCHORS.every(([address, instruction]) => (
      readUint32Virtual(restoredElf, restoredBytes, address) === instruction
    ));
  const skillDelayDispatchTarget = resolveEnemySkillTarget(
    SKILL_DELAY_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const skillDelaySetupTarget = resolveEnemySkillTarget(
    SKILL_DELAY_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const skillDelayConditionTarget = resolveEnemySkillTarget(
    SKILL_DELAY_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const skillDelayDispatchMatches = skillDelayDispatchTarget === null
    ? null : skillDelayDispatchTarget === SKILL_DELAY_HANDLER;
  const skillDelaySetupMatches = skillDelaySetupTarget === null
    ? null : skillDelaySetupTarget === SKILL_DELAY_SETUP_HANDLER;
  const skillDelayConditionMatches = skillDelayConditionTarget === null
    ? null : skillDelayConditionTarget === SKILL_DELAY_CONDITION_HANDLER;
  const skillDelayInstructionAnchorsMatch = restoredElf === null ? null
    : SKILL_DELAY_INSTRUCTION_ANCHORS.every(([address, instruction]) => (
      readUint32Virtual(restoredElf, restoredBytes, address) === instruction
    ));
  const healPlayerDispatchTarget = resolveEnemySkillTarget(
    HEAL_PLAYER_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const healPlayerSetupTarget = resolveEnemySkillTarget(
    HEAL_PLAYER_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const healPlayerConditionTarget = resolveEnemySkillTarget(
    HEAL_PLAYER_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const healPlayerDispatchMatches = healPlayerDispatchTarget === null
    ? null : healPlayerDispatchTarget === HEAL_PLAYER_HANDLER;
  const healPlayerSetupMatches = healPlayerSetupTarget === null
    ? null : healPlayerSetupTarget === HEAL_PLAYER_SETUP_HANDLER;
  const healPlayerConditionMatches = healPlayerConditionTarget === null
    ? null : healPlayerConditionTarget === HEAL_PLAYER_CONDITION_HANDLER;
  const loneAttackBoostDispatchTarget = resolveEnemySkillTarget(
    LONE_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const loneAttackBoostSetupTarget = resolveEnemySkillTarget(
    LONE_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const loneAttackBoostConditionTarget = resolveEnemySkillTarget(
    LONE_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const loneAttackBoostDispatchMatches = loneAttackBoostDispatchTarget === null
    ? null : loneAttackBoostDispatchTarget === LONE_ATTACK_BOOST_HANDLER;
  const loneAttackBoostSetupMatches = loneAttackBoostSetupTarget === null
    ? null : loneAttackBoostSetupTarget === LONE_ATTACK_BOOST_SETUP_HANDLER;
  const loneAttackBoostConditionMatches = loneAttackBoostConditionTarget === null
    ? null : loneAttackBoostConditionTarget === LONE_ATTACK_BOOST_CONDITION_HANDLER;
  const statusTriggeredAttackBoostDispatchTarget = resolveEnemySkillTarget(
    STATUS_TRIGGERED_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const statusTriggeredAttackBoostSetupTarget = resolveEnemySkillTarget(
    STATUS_TRIGGERED_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const statusTriggeredAttackBoostConditionTarget = resolveEnemySkillTarget(
    STATUS_TRIGGERED_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const statusTriggeredAttackBoostDispatchMatches = statusTriggeredAttackBoostDispatchTarget === null
    ? null : statusTriggeredAttackBoostDispatchTarget === STATUS_TRIGGERED_ATTACK_BOOST_HANDLER;
  const statusTriggeredAttackBoostSetupMatches = statusTriggeredAttackBoostSetupTarget === null
    ? null : statusTriggeredAttackBoostSetupTarget === STATUS_TRIGGERED_ATTACK_BOOST_SETUP_HANDLER;
  const statusTriggeredAttackBoostConditionMatches = statusTriggeredAttackBoostConditionTarget === null
    ? null : statusTriggeredAttackBoostConditionTarget === STATUS_TRIGGERED_ATTACK_BOOST_CONDITION_HANDLER;
  const damagedTurnAttackBoostDispatchTarget = resolveEnemySkillTarget(
    DAMAGED_TURN_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const damagedTurnAttackBoostSetupTarget = resolveEnemySkillTarget(
    DAMAGED_TURN_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const damagedTurnAttackBoostConditionTarget = resolveEnemySkillTarget(
    DAMAGED_TURN_ATTACK_BOOST_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const damagedTurnAttackBoostDispatchMatches = damagedTurnAttackBoostDispatchTarget === null
    ? null : damagedTurnAttackBoostDispatchTarget === DAMAGED_TURN_ATTACK_BOOST_HANDLER;
  const damagedTurnAttackBoostSetupMatches = damagedTurnAttackBoostSetupTarget === null
    ? null : damagedTurnAttackBoostSetupTarget === DAMAGED_TURN_ATTACK_BOOST_SETUP_HANDLER;
  const damagedTurnAttackBoostConditionMatches = damagedTurnAttackBoostConditionTarget === null
    ? null : damagedTurnAttackBoostConditionTarget === DAMAGED_TURN_ATTACK_BOOST_CONDITION_HANDLER;
  const statusShieldDispatchTarget = resolveEnemySkillTarget(
    STATUS_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const statusShieldSetupTarget = resolveEnemySkillTarget(
    STATUS_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const statusShieldConditionTarget = resolveEnemySkillTarget(
    STATUS_SHIELD_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const statusShieldDispatchMatches = statusShieldDispatchTarget === null
    ? null : statusShieldDispatchTarget === STATUS_SHIELD_HANDLER;
  const statusShieldSetupMatches = statusShieldSetupTarget === null
    ? null : statusShieldSetupTarget === STATUS_SHIELD_SETUP_HANDLER;
  const statusShieldConditionMatches = statusShieldConditionTarget === null
    ? null : statusShieldConditionTarget === STATUS_SHIELD_CONDITION_HANDLER;
  const inactiveEnemySkillTargets21Through38 = INACTIVE_ENEMY_SKILL_TYPES_21_THROUGH_38
    .map((type) => ({
      type,
      dispatchTarget: resolveEnemySkillTarget(
        type, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
      ),
      setupTarget: resolveEnemySkillTarget(type, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE),
      conditionTarget: resolveEnemySkillTarget(
        type, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
      ),
    }));
  const inactiveEnemySkills21Through38Match = restoredElf === null ? null
    : inactiveEnemySkillTargets21Through38.every((entry) => (
      entry.dispatchTarget === INACTIVE_ENEMY_SKILL_HANDLER
      && entry.setupTarget === (entry.type === 37
        ? INACTIVE_ENEMY_SKILL_TYPE37_SETUP_HANDLER
        : INACTIVE_ENEMY_SKILL_SETUP_HANDLER)
      && entry.conditionTarget === INACTIVE_ENEMY_SKILL_CONDITION_HANDLER
    ));
  const moveTimeReductionDispatchTarget = resolveEnemySkillTarget(
    MOVE_TIME_REDUCTION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const moveTimeReductionSetupTarget = resolveEnemySkillTarget(
    MOVE_TIME_REDUCTION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const moveTimeReductionConditionTarget = resolveEnemySkillTarget(
    MOVE_TIME_REDUCTION_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const moveTimeReductionDispatchMatches = moveTimeReductionDispatchTarget === null
    ? null : moveTimeReductionDispatchTarget === MOVE_TIME_REDUCTION_HANDLER;
  const moveTimeReductionSetupMatches = moveTimeReductionSetupTarget === null
    ? null : moveTimeReductionSetupTarget === MOVE_TIME_REDUCTION_SETUP_HANDLER;
  const moveTimeReductionConditionMatches = moveTimeReductionConditionTarget === null
    ? null : moveTimeReductionConditionTarget === MOVE_TIME_REDUCTION_CONDITION_HANDLER;
  const selfDestructDispatchTarget = resolveEnemySkillTarget(
    SELF_DESTRUCT_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const selfDestructSetupTarget = resolveEnemySkillTarget(
    SELF_DESTRUCT_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const selfDestructConditionTarget = resolveEnemySkillTarget(
    SELF_DESTRUCT_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const selfDestructDispatchMatches = selfDestructDispatchTarget === null
    ? null : selfDestructDispatchTarget === SELF_DESTRUCT_HANDLER;
  const selfDestructSetupMatches = selfDestructSetupTarget === null
    ? null : selfDestructSetupTarget === SELF_DESTRUCT_SETUP_HANDLER;
  const selfDestructConditionMatches = selfDestructConditionTarget === null
    ? null : selfDestructConditionTarget === SELF_DESTRUCT_CONDITION_HANDLER;
  const inactiveEnemySkillTargets = INACTIVE_ENEMY_SKILL_TYPES.map((type) => ({
    type,
    dispatchTarget: resolveEnemySkillTarget(
      type, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
    ),
    setupTarget: resolveEnemySkillTarget(type, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE),
    conditionTarget: resolveEnemySkillTarget(
      type, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
    ),
  }));
  const inactiveEnemySkillsMatch = restoredElf === null ? null : inactiveEnemySkillTargets.every((entry) => (
    entry.dispatchTarget === INACTIVE_ENEMY_SKILL_HANDLER
    && entry.setupTarget === INACTIVE_ENEMY_SKILL_SETUP_HANDLER
    && entry.conditionTarget === INACTIVE_ENEMY_SKILL_CONDITION_HANDLER
  ));
  const changeAttributeDispatchTarget = resolveEnemySkillTarget(
    CHANGE_ATTRIBUTE_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const changeAttributeSetupTarget = resolveEnemySkillTarget(
    CHANGE_ATTRIBUTE_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const changeAttributeConditionTarget = resolveEnemySkillTarget(
    CHANGE_ATTRIBUTE_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const changeAttributeDispatchMatches = changeAttributeDispatchTarget === null
    ? null : changeAttributeDispatchTarget === CHANGE_ATTRIBUTE_HANDLER;
  const changeAttributeSetupMatches = changeAttributeSetupTarget === null
    ? null : changeAttributeSetupTarget === CHANGE_ATTRIBUTE_SETUP_HANDLER;
  const changeAttributeConditionMatches = changeAttributeConditionTarget === null
    ? null : changeAttributeConditionTarget === CHANGE_ATTRIBUTE_CONDITION_HANDLER;
  const scaledAttackDispatchTarget = resolveEnemySkillTarget(
    SCALED_ATTACK_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const scaledAttackSetupTarget = resolveEnemySkillTarget(
    SCALED_ATTACK_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const scaledAttackConditionTarget = resolveEnemySkillTarget(
    SCALED_ATTACK_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const scaledAttackDispatchMatches = scaledAttackDispatchTarget === null
    ? null : scaledAttackDispatchTarget === SCALED_ATTACK_HANDLER;
  const scaledAttackSetupMatches = scaledAttackSetupTarget === null
    ? null : scaledAttackSetupTarget === SCALED_ATTACK_SETUP_HANDLER;
  const scaledAttackConditionMatches = scaledAttackConditionTarget === null
    ? null : scaledAttackConditionTarget === SCALED_ATTACK_CONDITION_HANDLER;
  const currentHpGravityDispatchTarget = resolveEnemySkillTarget(
    CURRENT_HP_GRAVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const currentHpGravitySetupTarget = resolveEnemySkillTarget(
    CURRENT_HP_GRAVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const currentHpGravityConditionTarget = resolveEnemySkillTarget(
    CURRENT_HP_GRAVITY_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const currentHpGravityDispatchMatches = currentHpGravityDispatchTarget === null
    ? null : currentHpGravityDispatchTarget === CURRENT_HP_GRAVITY_HANDLER;
  const currentHpGravitySetupMatches = currentHpGravitySetupTarget === null
    ? null : currentHpGravitySetupTarget === CURRENT_HP_GRAVITY_SETUP_HANDLER;
  const currentHpGravityConditionMatches = currentHpGravityConditionTarget === null
    ? null : currentHpGravityConditionTarget === CURRENT_HP_GRAVITY_CONDITION_HANDLER;
  const reviveEnemyDispatchTarget = resolveEnemySkillTarget(
    REVIVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_DISPATCH_TABLE, ENEMY_SKILL_DISPATCH_BASE,
  );
  const reviveEnemySetupTarget = resolveEnemySkillTarget(
    REVIVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_SETUP_TABLE, ENEMY_SKILL_SETUP_BASE,
  );
  const reviveEnemyConditionTarget = resolveEnemySkillTarget(
    REVIVE_ENEMY_SKILL_TYPE, ENEMY_SKILL_CONDITION_TABLE, ENEMY_SKILL_CONDITION_BASE,
  );
  const reviveEnemyDispatchMatches = reviveEnemyDispatchTarget === null
    ? null : reviveEnemyDispatchTarget === REVIVE_ENEMY_HANDLER;
  const reviveEnemySetupMatches = reviveEnemySetupTarget === null
    ? null : reviveEnemySetupTarget === REVIVE_ENEMY_SETUP_HANDLER;
  const reviveEnemyConditionMatches = reviveEnemyConditionTarget === null
    ? null : reviveEnemyConditionTarget === REVIVE_ENEMY_CONDITION_HANDLER;
  const attributeAbsorbDispatchTarget = resolveEnemySkillTarget(
    ATTRIBUTE_ABSORB_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const attributeAbsorbSetupTarget = resolveEnemySkillTarget(
    ATTRIBUTE_ABSORB_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const attributeAbsorbConditionTarget = resolveEnemySkillTarget(
    ATTRIBUTE_ABSORB_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const attributeAbsorbDispatchMatches = attributeAbsorbDispatchTarget === null
    ? null : attributeAbsorbDispatchTarget === ATTRIBUTE_ABSORB_HANDLER;
  const attributeAbsorbSetupMatches = attributeAbsorbSetupTarget === null
    ? null : attributeAbsorbSetupTarget === ATTRIBUTE_ABSORB_SETUP_HANDLER;
  const attributeAbsorbConditionMatches = attributeAbsorbConditionTarget === null
    ? null : attributeAbsorbConditionTarget === ATTRIBUTE_ABSORB_CONDITION_HANDLER;
  const bindLeaderHelperDispatchTarget = resolveEnemySkillTarget(
    BIND_LEADER_HELPER_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_DISPATCH_TABLE,
    ENEMY_SKILL_DISPATCH_BASE,
  );
  const bindLeaderHelperSetupTarget = resolveEnemySkillTarget(
    BIND_LEADER_HELPER_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_SETUP_TABLE,
    ENEMY_SKILL_SETUP_BASE,
  );
  const bindLeaderHelperConditionTarget = resolveEnemySkillTarget(
    BIND_LEADER_HELPER_ENEMY_SKILL_TYPE,
    ENEMY_SKILL_CONDITION_TABLE,
    ENEMY_SKILL_CONDITION_BASE,
  );
  const bindLeaderHelperDispatchMatches = bindLeaderHelperDispatchTarget === null
    ? null : bindLeaderHelperDispatchTarget === BIND_LEADER_HELPER_HANDLER;
  const bindLeaderHelperSetupMatches = bindLeaderHelperSetupTarget === null
    ? null : bindLeaderHelperSetupTarget === BIND_LEADER_HELPER_SETUP_HANDLER;
  const bindLeaderHelperConditionMatches = bindLeaderHelperConditionTarget === null
    ? null : bindLeaderHelperConditionTarget === BIND_LEADER_HELPER_CONDITION_HANDLER;
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
      sourceOrbConversionDispatchMatches21_9: sourceOrbConversionDispatchMatches,
      sourceOrbConversionSetupMatches21_9: sourceOrbConversionSetupMatches,
      sourceOrbConversionConditionMatches21_9: sourceOrbConversionConditionMatches,
      entireBlindDispatchMatches21_9: entireBlindDispatchMatches,
      entireBlindSetupMatches21_9: entireBlindSetupMatches,
      entireBlindConditionMatches21_9: entireBlindConditionMatches,
      entireBlindAltDispatchMatches21_9: entireBlindAltDispatchMatches,
      entireBlindAltSetupMatches21_9: entireBlindAltSetupMatches,
      entireBlindAltConditionMatches21_9: entireBlindAltConditionMatches,
      bindAttackDispatchMatches21_9: bindAttackDispatchMatches,
      bindAttackSetupMatches21_9: bindAttackSetupMatches,
      bindAttackConditionMatches21_9: bindAttackConditionMatches,
      randomSubBindDispatchMatches21_9: randomSubBindDispatchMatches,
      randomSubBindSetupMatches21_9: randomSubBindSetupMatches,
      randomSubBindConditionMatches21_9: randomSubBindConditionMatches,
      clearPlayerBuffsDispatchMatches21_9: clearPlayerBuffsDispatchMatches,
      clearPlayerBuffsSetupMatches21_9: clearPlayerBuffsSetupMatches,
      clearPlayerBuffsConditionMatches21_9: clearPlayerBuffsConditionMatches,
      healEnemyDispatchMatches21_9: healEnemyDispatchMatches,
      healEnemySetupMatches21_9: healEnemySetupMatches,
      healEnemyConditionMatches21_9: healEnemyConditionMatches,
      additionalAttackDispatchMatches21_9: additionalAttackDispatchMatches,
      additionalAttackSetupMatches21_9: additionalAttackSetupMatches,
      additionalAttackConditionMatches21_9: additionalAttackConditionMatches,
      earlyDefenseShieldEntriesMatch21_9: earlyDefenseShieldEntriesMatch,
      earlyPartyControlEntriesMatch21_9: earlyPartyControlEntriesMatch,
      repeatAttackDispatchMatches21_9: repeatAttackDispatchMatches,
      repeatAttackSetupMatches21_9: repeatAttackSetupMatches,
      repeatAttackConditionMatches21_9: repeatAttackConditionMatches,
      inactivityDispatchMatches21_9: inactivityDispatchMatches,
      inactivitySetupMatches21_9: inactivitySetupMatches,
      inactivityConditionMatches21_9: inactivityConditionMatches,
      unconditionalInactivityDispatchMatches21_9: unconditionalInactivityDispatchMatches,
      unconditionalInactivitySetupMatches21_9: unconditionalInactivitySetupMatches,
      unconditionalInactivityConditionMatches21_9: unconditionalInactivityConditionMatches,
      comboAbsorbDispatchMatches21_9: comboAbsorbDispatchMatches,
      comboAbsorbSetupMatches21_9: comboAbsorbSetupMatches,
      comboAbsorbConditionMatches21_9: comboAbsorbConditionMatches,
      skyfallRateDispatchMatches21_9: skyfallRateDispatchMatches,
      skyfallRateSetupMatches21_9: skyfallRateSetupMatches,
      skyfallRateConditionMatches21_9: skyfallRateConditionMatches,
      deathCryDispatchMatches21_9: deathCryDispatchMatches,
      deathCrySetupMatches21_9: deathCrySetupMatches,
      deathCryConditionMatches21_9: deathCryConditionMatches,
      inactivityPresentationDispatchMatches21_9: inactivityPresentationDispatchMatches,
      inactivityPresentationSetupMatches21_9: inactivityPresentationSetupMatches,
      inactivityPresentationConditionMatches21_9: inactivityPresentationConditionMatches,
      damageVoidDispatchMatches21_9: damageVoidDispatchMatches,
      damageVoidSetupMatches21_9: damageVoidSetupMatches,
      damageVoidConditionMatches21_9: damageVoidConditionMatches,
      attributeResistDispatchMatches21_9: attributeResistDispatchMatches,
      attributeResistSetupMatches21_9: attributeResistSetupMatches,
      attributeResistConditionMatches21_9: attributeResistConditionMatches,
      resolveDispatchMatches21_9: resolveDispatchMatches,
      resolveSetupMatches21_9: resolveSetupMatches,
      resolveConditionMatches21_9: resolveConditionMatches,
      damageShieldDispatchMatches21_9: damageShieldDispatchMatches,
      damageShieldSetupMatches21_9: damageShieldSetupMatches,
      damageShieldConditionMatches21_9: damageShieldConditionMatches,
      leaderSwapDispatchMatches21_9: leaderSwapDispatchMatches,
      leaderSwapSetupMatches21_9: leaderSwapSetupMatches,
      leaderSwapConditionMatches21_9: leaderSwapConditionMatches,
      normalAttackDispatchMatches21_9: normalAttackDispatchMatches,
      normalAttackSetupMatches21_9: normalAttackSetupMatches,
      normalAttackConditionMatches21_9: normalAttackConditionMatches,
      multiAttackDispatchMatches21_9: multiAttackDispatchMatches,
      multiAttackSetupMatches21_9: multiAttackSetupMatches,
      multiAttackConditionMatches21_9: multiAttackConditionMatches,
      multiAttackInstructionAnchorsMatch21_9: multiAttackInstructionAnchorsMatch,
      unconditionalHealDispatchMatches21_9: unconditionalHealDispatchMatches,
      unconditionalHealSetupMatches21_9: unconditionalHealSetupMatches,
      unconditionalHealConditionMatches21_9: unconditionalHealConditionMatches,
      damageAbsorbDispatchMatches21_9: damageAbsorbDispatchMatches,
      damageAbsorbSetupMatches21_9: damageAbsorbSetupMatches,
      damageAbsorbConditionMatches21_9: damageAbsorbConditionMatches,
      damageAbsorbInstructionAnchorsMatch21_9: damageAbsorbInstructionAnchorsMatch,
      awakeningBindDispatchMatches21_9: awakeningBindDispatchMatches,
      awakeningBindSetupMatches21_9: awakeningBindSetupMatches,
      awakeningBindConditionMatches21_9: awakeningBindConditionMatches,
      awakeningBindInstructionAnchorsMatch21_9: awakeningBindInstructionAnchorsMatch,
      skillDelayDispatchMatches21_9: skillDelayDispatchMatches,
      skillDelaySetupMatches21_9: skillDelaySetupMatches,
      skillDelayConditionMatches21_9: skillDelayConditionMatches,
      skillDelayInstructionAnchorsMatch21_9: skillDelayInstructionAnchorsMatch,
      sourceToJammerDispatchMatches21_9: sourceToJammerDispatchMatches,
      sourceToJammerSetupMatches21_9: sourceToJammerSetupMatches,
      sourceToJammerConditionMatches21_9: sourceToJammerConditionMatches,
      earlyPartyControlSkills: earlyPartyControlTargets.map((entry) => ({
        type: entry.type,
        kind: entry.kind,
        dispatchTarget: entry.dispatchTarget === null ? null : hex(entry.dispatchTarget),
        setupTarget: entry.setupTarget === null ? null : hex(entry.setupTarget),
        conditionTarget: entry.conditionTarget === null ? null : hex(entry.conditionTarget),
        matches21_9: entry.matches21_9,
      })),
      randomPartyBindSemantics:
        'type 13: +0x10 target count; choose currently unbound party cards with the native two-step/private-state shuffle, then bind each for the hardcoded six-turn operand',
      activeSkillSealSemantics:
        'type 14: one-LCG inclusive +0x10..+0x14 duration; 20% per resistance awakening plus badge; add into protected low-ten-bit sGAMEWORK+0x87250 and count down in _doOnPostEnemyAttack',
      repeatAttackSemantics:
        'type 15: one-LCG inclusive +0x10..+0x14 hit count capped at 15; +0x18 percent is sent once per hit through _setEnemyAttack; +0x67c is the completed-hit bitset',
      inactivitySemantics:
        'type 16: generic no-parameter setup and no-effect dispatch; condition scale is 1.0 for water monsters and 1.0 minus incoming scale otherwise; recovered new-AI callers supply 1.0',
      healPlayerDispatchMatches21_9: healPlayerDispatchMatches,
      healPlayerSetupMatches21_9: healPlayerSetupMatches,
      healPlayerConditionMatches21_9: healPlayerConditionMatches,
      loneAttackBoostDispatchMatches21_9: loneAttackBoostDispatchMatches,
      loneAttackBoostSetupMatches21_9: loneAttackBoostSetupMatches,
      loneAttackBoostConditionMatches21_9: loneAttackBoostConditionMatches,
      statusTriggeredAttackBoostDispatchMatches21_9: statusTriggeredAttackBoostDispatchMatches,
      statusTriggeredAttackBoostSetupMatches21_9: statusTriggeredAttackBoostSetupMatches,
      statusTriggeredAttackBoostConditionMatches21_9: statusTriggeredAttackBoostConditionMatches,
      damagedTurnAttackBoostDispatchMatches21_9: damagedTurnAttackBoostDispatchMatches,
      damagedTurnAttackBoostSetupMatches21_9: damagedTurnAttackBoostSetupMatches,
      damagedTurnAttackBoostConditionMatches21_9: damagedTurnAttackBoostConditionMatches,
      statusShieldDispatchMatches21_9: statusShieldDispatchMatches,
      statusShieldSetupMatches21_9: statusShieldSetupMatches,
      statusShieldConditionMatches21_9: statusShieldConditionMatches,
      inactiveEnemySkillTypes21Through38Match21_9: inactiveEnemySkills21Through38Match,
      moveTimeReductionDispatchMatches21_9: moveTimeReductionDispatchMatches,
      moveTimeReductionSetupMatches21_9: moveTimeReductionSetupMatches,
      moveTimeReductionConditionMatches21_9: moveTimeReductionConditionMatches,
      selfDestructDispatchMatches21_9: selfDestructDispatchMatches,
      selfDestructSetupMatches21_9: selfDestructSetupMatches,
      selfDestructConditionMatches21_9: selfDestructConditionMatches,
      inactiveEnemySkillTypes41Through45Match21_9: inactiveEnemySkillsMatch,
      changeAttributeDispatchMatches21_9: changeAttributeDispatchMatches,
      changeAttributeSetupMatches21_9: changeAttributeSetupMatches,
      changeAttributeConditionMatches21_9: changeAttributeConditionMatches,
      scaledAttackDispatchMatches21_9: scaledAttackDispatchMatches,
      scaledAttackSetupMatches21_9: scaledAttackSetupMatches,
      scaledAttackConditionMatches21_9: scaledAttackConditionMatches,
      currentHpGravityDispatchMatches21_9: currentHpGravityDispatchMatches,
      currentHpGravitySetupMatches21_9: currentHpGravitySetupMatches,
      currentHpGravityConditionMatches21_9: currentHpGravityConditionMatches,
      reviveEnemyDispatchMatches21_9: reviveEnemyDispatchMatches,
      reviveEnemySetupMatches21_9: reviveEnemySetupMatches,
      reviveEnemyConditionMatches21_9: reviveEnemyConditionMatches,
      attributeAbsorbDispatchMatches21_9: attributeAbsorbDispatchMatches,
      attributeAbsorbSetupMatches21_9: attributeAbsorbSetupMatches,
      attributeAbsorbConditionMatches21_9: attributeAbsorbConditionMatches,
      bindLeaderHelperDispatchMatches21_9: bindLeaderHelperDispatchMatches,
      bindLeaderHelperSetupMatches21_9: bindLeaderHelperSetupMatches,
      bindLeaderHelperConditionMatches21_9: bindLeaderHelperConditionMatches,
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
      monsterHealPercentOffset: 'sMONSTER+0x678 (type 55 signed int32 percent)',
      monsterAttackBoostMultiplierOffset: 'sMONSTER+0x850 (type 17 protected float32)',
      monsterAttackBoostDurationOffset: 'sMONSTER+0x860 (type 17 protected signed int16)',
      monsterStatusShieldDurationOffset: 'sMONSTER+0x870 (type 20 protected signed int16)',
      moveTimeDurationOffset: 'sMONSTER+0x678 (type 39 packed low 10 bits)',
      moveTimeFixedReductionOffset: 'sMONSTER+0x67c (type 39 signed centiseconds)',
      moveTimePercentReductionOffset: 'sMONSTER+0x680 (type 39 nonzero selects percent mode)',
      monsterCurrentHpOffset: 'sMONSTER+0x3c/+0x4c (protected int64; type 40 writes zero)',
      monsterDisplayedHpOffset: 'sMONSTER+0xd4/+0xe4 (protected int64 mirror; type 40 writes zero)',
      monsterAttributeTargetOffset: 'sMONSTER+0x678 (type 46 signed attribute index)',
      monsterAttributeOverrideOffset: 'sMONSTER+0x22f (signed byte; negative uses definition+0x0c)',
      monsterScaledAttackPercentOffset: 'sMONSTER+0x678 (type 47 signed int32 percent)',
      monsterScaledAttackGateOffset: 'sMONSTER+0x6c0 (type 47 must equal zero)',
      monsterCurrentHpGravityPercentOffset: 'sMONSTER+0x678 (type 50 signed int32 percent)',
      monsterAttributeAbsorbDurationOffset: 'sMONSTER+0x890 (type 53 TCHKVAL<int16>)',
      monsterAttributeAbsorbMaskOffset: 'sMONSTER+0x880 (type 53 TCHKVAL<int16>)',
      monsterBindTargetMaskOffset: 'sMONSTER+0x674 (type 54 uint16 party mask)',
      monsterBindSetupDurationOffset: 'sMONSTER+0x678 (type 54 signed int32; execution rerolls)',
      monsterChanceOffset: 'sMONSTER+0x67c (signed low 16 bits)',
      monsterReviveTargetOffset: 'sMONSTER+0x678 (type 52 signed enemy index)',
      monsterRevivePercentOffset: 'sMONSTER+0x67c (type 52 signed HP percent)',
      sourceOrbConversionType: SOURCE_ORB_CONVERSION_ENEMY_SKILL_TYPE,
      sourceOrbConversionDispatchTarget: sourceOrbConversionDispatchTarget === null
        ? null : hex(sourceOrbConversionDispatchTarget),
      sourceOrbConversionDispatchMatches21_9: sourceOrbConversionDispatchMatches,
      sourceOrbConversionSetupTarget: sourceOrbConversionSetupTarget === null
        ? null : hex(sourceOrbConversionSetupTarget),
      sourceOrbConversionSetupMatches21_9: sourceOrbConversionSetupMatches,
      sourceOrbConversionConditionTarget: sourceOrbConversionConditionTarget === null
        ? null : hex(sourceOrbConversionConditionTarget),
      sourceOrbConversionConditionMatches21_9: sourceOrbConversionConditionMatches,
      sourceOrbConversionParameters:
        'definition +0x10/+0x14 -> sMONSTER+0x678/+0x67c source/destination; negative selects native random mode',
      entireBlindType: ENTIRE_BLIND_ENEMY_SKILL_TYPE,
      entireBlindDispatchTarget: entireBlindDispatchTarget === null
        ? null : hex(entireBlindDispatchTarget),
      entireBlindDispatchMatches21_9: entireBlindDispatchMatches,
      entireBlindSetupTarget: entireBlindSetupTarget === null ? null : hex(entireBlindSetupTarget),
      entireBlindSetupMatches21_9: entireBlindSetupMatches,
      entireBlindConditionTarget: entireBlindConditionTarget === null
        ? null : hex(entireBlindConditionTarget),
      entireBlindConditionMatches21_9: entireBlindConditionMatches,
      entireBlindSemantics:
        'early dispatch calls doBlock2Black: classic blind bit 0x4 plus fresh bit 0x8; condition is binary32 visible-cell fraction; swapBlockMain reveals both swapped cells; +0x44 attack remains generic',
      entireBlindAltType: ENTIRE_BLIND_ALT_ENEMY_SKILL_TYPE,
      entireBlindAltDispatchTarget: entireBlindAltDispatchTarget === null
        ? null : hex(entireBlindAltDispatchTarget),
      entireBlindAltDispatchMatches21_9: entireBlindAltDispatchMatches,
      entireBlindAltSetupTarget: entireBlindAltSetupTarget === null
        ? null : hex(entireBlindAltSetupTarget),
      entireBlindAltSetupMatches21_9: entireBlindAltSetupMatches,
      entireBlindAltConditionTarget: entireBlindAltConditionTarget === null
        ? null : hex(entireBlindAltConditionTarget),
      entireBlindAltConditionMatches21_9: entireBlindAltConditionMatches,
      entireBlindAltSemantics:
        'type 62 alternate presentation setup copies +0x10 to sMONSTER+0x680 and initializes 3.0/0.4 animation lanes; early handler inlines the same bit 0x4/0x8 board mutation; condition returns exactly 1.0 iff any board cell lacks bit 0x4',
      bindAttackType: BIND_ATTACK_ENEMY_SKILL_TYPE,
      bindAttackDispatchTarget: bindAttackDispatchTarget === null
        ? null : hex(bindAttackDispatchTarget),
      bindAttackDispatchMatches21_9: bindAttackDispatchMatches,
      bindAttackSetupTarget: bindAttackSetupTarget === null ? null : hex(bindAttackSetupTarget),
      bindAttackSetupMatches21_9: bindAttackSetupMatches,
      bindAttackConditionTarget: bindAttackConditionTarget === null
        ? null : hex(bindAttackConditionTarget),
      bindAttackConditionMatches21_9: bindAttackConditionMatches,
      bindAttackSemantics:
        'type 63: +0x14..+0x18 inclusive duration; +0x1c target selector and +0x20 target count feed doSelectBindTarges; target selection precedes the duration LCG; handler calls doBind with sMONSTER+0x674 mask and +0x684 duration; +0x44 attack composes afterward',
      randomSubBindType: RANDOM_SUB_BIND_ENEMY_SKILL_TYPE,
      randomSubBindDispatchTarget: randomSubBindDispatchTarget === null
        ? null : hex(randomSubBindDispatchTarget),
      randomSubBindDispatchMatches21_9: randomSubBindDispatchMatches,
      randomSubBindSetupTarget: randomSubBindSetupTarget === null
        ? null : hex(randomSubBindSetupTarget),
      randomSubBindSetupMatches21_9: randomSubBindSetupMatches,
      randomSubBindConditionTarget: randomSubBindConditionTarget === null
        ? null : hex(randomSubBindConditionTarget),
      randomSubBindConditionMatches21_9: randomSubBindConditionMatches,
      randomSubBindSemantics:
        'type 65: +0x10 count selects only subs through doSelectBindTarges selector 4; setup stores mask at sMONSTER+0x674 and an inclusive +0x14..+0x18 duration at +0x678; common bind execution rerolls that duration before doBind; condition admits iff any present sub is unbound',
      clearPlayerBuffsType: CLEAR_PLAYER_BUFFS_ENEMY_SKILL_TYPE,
      clearPlayerBuffsDispatchTarget: clearPlayerBuffsDispatchTarget === null
        ? null : hex(clearPlayerBuffsDispatchTarget),
      clearPlayerBuffsDispatchMatches21_9: clearPlayerBuffsDispatchMatches,
      clearPlayerBuffsSetupTarget: clearPlayerBuffsSetupTarget === null
        ? null : hex(clearPlayerBuffsSetupTarget),
      clearPlayerBuffsSetupMatches21_9: clearPlayerBuffsSetupMatches,
      clearPlayerBuffsConditionTarget: clearPlayerBuffsConditionTarget === null
        ? null : hex(clearPlayerBuffsConditionTarget),
      clearPlayerBuffsConditionMatches21_9: clearPlayerBuffsConditionMatches,
      clearPlayerBuffsCondition:
        '_getCountClearParams(sMONSTER) as float32; modeled sGAMEWORK+0x86bd4/+0x86c3c lanes are skipped while sMONSTER+0x870 is active',
      clearPlayerBuffsExecution:
        '_doItetukuHadou(); _applyLeaderSkill(false)',
      healEnemyType: HEAL_ENEMY_SKILL_TYPE,
      healEnemyDispatchTarget: healEnemyDispatchTarget === null
        ? null : hex(healEnemyDispatchTarget),
      healEnemyDispatchMatches21_9: healEnemyDispatchMatches,
      healEnemySetupTarget: healEnemySetupTarget === null ? null : hex(healEnemySetupTarget),
      healEnemySetupMatches21_9: healEnemySetupMatches,
      healEnemyConditionTarget: healEnemyConditionTarget === null
        ? null : hex(healEnemyConditionTarget),
      healEnemyConditionMatches21_9: healEnemyConditionMatches,
      healEnemySemantics:
        'one-LCG inclusive +0x10..+0x14 percentage; max HP * percent / 100 in binary64; admit when player current HP >= low32 enemy attack',
      additionalAttackType: ADDITIONAL_ATTACK_ENEMY_SKILL_TYPE,
      additionalAttackDispatchTarget: additionalAttackDispatchTarget === null
        ? null : hex(additionalAttackDispatchTarget),
      additionalAttackDispatchMatches21_9: additionalAttackDispatchMatches,
      additionalAttackSetupTarget: additionalAttackSetupTarget === null
        ? null : hex(additionalAttackSetupTarget),
      additionalAttackSetupMatches21_9: additionalAttackSetupMatches,
      additionalAttackConditionTarget: additionalAttackConditionTarget === null
        ? null : hex(additionalAttackConditionTarget),
      additionalAttackConditionMatches21_9: additionalAttackConditionMatches,
      additionalAttackSemantics:
        'one-LCG inclusive +0x10..+0x14 percentage; add round(float32(int64 attack*percent)/100); condition clipF(float32(player HP)/float32(enemy attack), 0, 2)',
      repeatAttackType: REPEAT_ATTACK_ENEMY_SKILL_TYPE,
      repeatAttackDispatchTarget: repeatAttackDispatchTarget === null
        ? null : hex(repeatAttackDispatchTarget),
      repeatAttackDispatchMatches21_9: repeatAttackDispatchMatches,
      repeatAttackSetupTarget: repeatAttackSetupTarget === null ? null : hex(repeatAttackSetupTarget),
      repeatAttackSetupMatches21_9: repeatAttackSetupMatches,
      repeatAttackConditionTarget: repeatAttackConditionTarget === null
        ? null : hex(repeatAttackConditionTarget),
      repeatAttackConditionMatches21_9: repeatAttackConditionMatches,
      inactivityType: INACTIVITY_ENEMY_SKILL_TYPE,
      inactivityDispatchTarget: inactivityDispatchTarget === null
        ? null : hex(inactivityDispatchTarget),
      inactivityDispatchMatches21_9: inactivityDispatchMatches,
      inactivitySetupTarget: inactivitySetupTarget === null ? null : hex(inactivitySetupTarget),
      inactivitySetupMatches21_9: inactivitySetupMatches,
      inactivityConditionTarget: inactivityConditionTarget === null
        ? null : hex(inactivityConditionTarget),
      inactivityConditionMatches21_9: inactivityConditionMatches,
      unconditionalInactivityType: UNCONDITIONAL_INACTIVITY_ENEMY_SKILL_TYPE,
      unconditionalInactivityDispatchTarget: unconditionalInactivityDispatchTarget === null
        ? null : hex(unconditionalInactivityDispatchTarget),
      unconditionalInactivityDispatchMatches21_9: unconditionalInactivityDispatchMatches,
      unconditionalInactivitySetupTarget: unconditionalInactivitySetupTarget === null
        ? null : hex(unconditionalInactivitySetupTarget),
      unconditionalInactivitySetupMatches21_9: unconditionalInactivitySetupMatches,
      unconditionalInactivityConditionTarget: unconditionalInactivityConditionTarget === null
        ? null : hex(unconditionalInactivityConditionTarget),
      unconditionalInactivityConditionMatches21_9: unconditionalInactivityConditionMatches,
      unconditionalInactivitySemantics:
        'type 66: generic no-parameter setup, no-effect dispatch, and unconditional 1.0 AI condition; selected records consume only the ordinary probability draw and then end the enemy action',
      comboAbsorbType: COMBO_ABSORB_ENEMY_SKILL_TYPE,
      comboAbsorbDispatchTarget: comboAbsorbDispatchTarget === null
        ? null : hex(comboAbsorbDispatchTarget),
      comboAbsorbDispatchMatches21_9: comboAbsorbDispatchMatches,
      comboAbsorbSetupTarget: comboAbsorbSetupTarget === null
        ? null : hex(comboAbsorbSetupTarget),
      comboAbsorbSetupMatches21_9: comboAbsorbSetupMatches,
      comboAbsorbConditionTarget: comboAbsorbConditionTarget === null
        ? null : hex(comboAbsorbConditionTarget),
      comboAbsorbConditionMatches21_9: comboAbsorbConditionMatches,
      comboAbsorbSemantics:
        'type 67: one-LCG inclusive +0x10..+0x14 duration stored at sMONSTER+0x678; +0x18 combo threshold stored at +0x67c; handler applies them to +0x8b0/+0x8a0; condition admits only while the protected duration is below one',
      skyfallRateType: SKYFALL_RATE_ENEMY_SKILL_TYPE,
      skyfallRateDispatchTarget: skyfallRateDispatchTarget === null
        ? null : hex(skyfallRateDispatchTarget),
      skyfallRateDispatchMatches21_9: skyfallRateDispatchMatches,
      skyfallRateSetupTarget: skyfallRateSetupTarget === null
        ? null : hex(skyfallRateSetupTarget),
      skyfallRateSetupMatches21_9: skyfallRateSetupMatches,
      skyfallRateConditionTarget: skyfallRateConditionTarget === null
        ? null : hex(skyfallRateConditionTarget),
      skyfallRateConditionMatches21_9: skyfallRateConditionMatches,
      skyfallRateSemantics:
        'type 68: +0x10 nine-bit orb mask, one-LCG inclusive +0x14..+0x18 duration, and +0x1c chance are materialized at sMONSTER+0x678/+0x67c/+0x680; execution applies separate natural 0x03f and hazard 0x1c0 status categories; same active masks reject while different masks can replace them',
      deathCryType: DEATH_CRY_ENEMY_SKILL_TYPE,
      deathCryDispatchTarget: deathCryDispatchTarget === null
        ? null : hex(deathCryDispatchTarget),
      deathCryDispatchMatches21_9: deathCryDispatchMatches,
      deathCrySetupTarget: deathCrySetupTarget === null
        ? null : hex(deathCrySetupTarget),
      deathCrySetupMatches21_9: deathCrySetupMatches,
      deathCryConditionTarget: deathCryConditionTarget === null
        ? null : hex(deathCryConditionTarget),
      deathCryConditionMatches21_9: deathCryConditionMatches,
      deathCrySemantics:
        'type 69 is rejected by the ordinary turn selector; setupDeadmanEffect scans the 64 monster skill slots at death, copies +0x10..+0x2c presentation fields into the dedicated +0x108 death record, and gamePhaseEnemyDead presents it before battle continuation',
      inactivityPresentationType: INACTIVITY_PRESENTATION_ENEMY_SKILL_TYPE,
      inactivityPresentationDispatchTarget: inactivityPresentationDispatchTarget === null
        ? null : hex(inactivityPresentationDispatchTarget),
      inactivityPresentationDispatchMatches21_9: inactivityPresentationDispatchMatches,
      inactivityPresentationSetupTarget: inactivityPresentationSetupTarget === null
        ? null : hex(inactivityPresentationSetupTarget),
      inactivityPresentationSetupMatches21_9: inactivityPresentationSetupMatches,
      inactivityPresentationConditionTarget: inactivityPresentationConditionTarget === null
        ? null : hex(inactivityPresentationConditionTarget),
      inactivityPresentationConditionMatches21_9: inactivityPresentationConditionMatches,
      inactivityPresentationSemantics:
        'type 70 is a no-gameplay inactivity action with a distinct transient presentation path: setup stages +0x10/+0x14/+0x18 at runtime +0x678/+0x67c/+0x680 when the controller is empty, condition admits only while sMONSTER+0x910 reports zero, and execution applies or clears the presentation controller before the common action tail',
      damageVoidType: DAMAGE_VOID_ENEMY_SKILL_TYPE,
      damageVoidDispatchTarget: damageVoidDispatchTarget === null
        ? null : hex(damageVoidDispatchTarget),
      damageVoidDispatchMatches21_9: damageVoidDispatchMatches,
      damageVoidSetupTarget: damageVoidSetupTarget === null
        ? null : hex(damageVoidSetupTarget),
      damageVoidSetupMatches21_9: damageVoidSetupMatches,
      damageVoidConditionTarget: damageVoidConditionTarget === null
        ? null : hex(damageVoidConditionTarget),
      damageVoidConditionMatches21_9: damageVoidConditionMatches,
      damageVoidSemantics:
        'type 71: setup copies +0x10/+0x14/+0x18 to runtime +0x678/+0x67c/+0x680; the handler installs the void presentation, fixed duration, and mode while resolving the +0x1c damage threshold through the selected definition; condition admits only while the +0x8d0 void controller is inactive',
      attributeResistType: ATTRIBUTE_RESIST_ENEMY_SKILL_TYPE,
      attributeResistDispatchTarget: attributeResistDispatchTarget === null
        ? null : hex(attributeResistDispatchTarget),
      attributeResistDispatchMatches21_9: attributeResistDispatchMatches,
      attributeResistSetupTarget: attributeResistSetupTarget === null
        ? null : hex(attributeResistSetupTarget),
      attributeResistSetupMatches21_9: attributeResistSetupMatches,
      attributeResistConditionTarget: attributeResistConditionTarget === null
        ? null : hex(attributeResistConditionTarget),
      attributeResistConditionMatches21_9: attributeResistConditionMatches,
      attributeResistSemantics:
        'type 72 is an initialization-time passive: ordinary dispatch/setup/condition are inert; checkPassiveSkills scans all 64 slots, maps +0x10 bits 0..4 to sMONSTER+0xb16..+0xb1e, and stores low16(+0x14); the damage-ratio helper returns 1.0 for sentinel 100 or binary32((100-value)/100) before calcAttackPow rounds the post-defense product upward',
      resolveType: RESOLVE_ENEMY_SKILL_TYPE,
      resolveDispatchTarget: resolveDispatchTarget === null ? null : hex(resolveDispatchTarget),
      resolveDispatchMatches21_9: resolveDispatchMatches,
      resolveSetupTarget: resolveSetupTarget === null ? null : hex(resolveSetupTarget),
      resolveSetupMatches21_9: resolveSetupMatches,
      resolveConditionTarget: resolveConditionTarget === null ? null : hex(resolveConditionTarget),
      resolveConditionMatches21_9: resolveConditionMatches,
      resolveSemantics:
        'type 73 is an initialization-time passive: ordinary dispatch/setup/condition are inert; checkPassiveSkills stores low16(+0x10) at sMONSTER+0xafc; attack2Enemy computes ceil(maxHp*threshold/100) and allows lethal damage to leave 1 HP only when current HP began that hit at or above the boundary, so a later hit can kill',
      damageShieldType: DAMAGE_SHIELD_ENEMY_SKILL_TYPE,
      damageShieldDispatchTarget: damageShieldDispatchTarget === null
        ? null : hex(damageShieldDispatchTarget),
      damageShieldDispatchMatches21_9: damageShieldDispatchMatches,
      damageShieldSetupTarget: damageShieldSetupTarget === null
        ? null : hex(damageShieldSetupTarget),
      damageShieldSetupMatches21_9: damageShieldSetupMatches,
      damageShieldConditionTarget: damageShieldConditionTarget === null
        ? null : hex(damageShieldConditionTarget),
      damageShieldConditionMatches21_9: damageShieldConditionMatches,
      damageShieldSemantics:
        'type 74: setup copies +0x10/+0x14 to runtime +0x678/+0x67c; execution installs signed-int16 turns at sMONSTER+0x940 and clamps the shield percentage to 0..100 at +0x950; condition requires the turn controller to be inactive; chcekDamageRatio4DamageDisp multiplies binary32((100-percent)/100) into the passive attribute ratio before calcAttackPow rounds upward once',
      leaderSwapType: LEADER_SWAP_ENEMY_SKILL_TYPE,
      leaderSwapDispatchTarget: leaderSwapDispatchTarget === null
        ? null : hex(leaderSwapDispatchTarget),
      leaderSwapDispatchMatches21_9: leaderSwapDispatchMatches,
      leaderSwapSetupTarget: leaderSwapSetupTarget === null
        ? null : hex(leaderSwapSetupTarget),
      leaderSwapSetupMatches21_9: leaderSwapSetupMatches,
      leaderSwapConditionTarget: leaderSwapConditionTarget === null
        ? null : hex(leaderSwapConditionTarget),
      leaderSwapConditionMatches21_9: leaderSwapConditionMatches,
      leaderSwapSemantics:
        'type 75: condition checks that the native changeable-sub count is positive; setup copies signed-int16 +0x10 turns to runtime +0x678, consumes one LCG roll, selects one eligible party index 1..4 by rank, and stores it at +0x67c; execution installs the global leader-change duration and selected index, swaps that sub with slot 0 through _doLeaderChange, and restores the original order on expiry',
      normalAttackType: NORMAL_ATTACK_ENEMY_SKILL_TYPE,
      normalAttackDispatchTarget: normalAttackDispatchTarget === null
        ? null : hex(normalAttackDispatchTarget),
      normalAttackDispatchMatches21_9: normalAttackDispatchMatches,
      normalAttackSetupTarget: normalAttackSetupTarget === null
        ? null : hex(normalAttackSetupTarget),
      normalAttackSetupMatches21_9: normalAttackSetupMatches,
      normalAttackConditionTarget: normalAttackConditionTarget === null
        ? null : hex(normalAttackConditionTarget),
      normalAttackConditionMatches21_9: normalAttackConditionMatches,
      normalAttackSemantics:
        'type 82: unconditional AI condition, sentinel setup writes -1 to sMONSTER+0x670, and the shared no-special-effect dispatch performs one ordinary 100%-power hit independently of the generic +0x44 attack-with-skill field',
      multiAttackType: MULTI_ATTACK_ENEMY_SKILL_TYPE,
      multiAttackDispatchTarget: multiAttackDispatchTarget === null
        ? null : hex(multiAttackDispatchTarget),
      multiAttackDispatchMatches21_9: multiAttackDispatchMatches,
      multiAttackSetupTarget: multiAttackSetupTarget === null
        ? null : hex(multiAttackSetupTarget),
      multiAttackSetupMatches21_9: multiAttackSetupMatches,
      multiAttackConditionTarget: multiAttackConditionTarget === null
        ? null : hex(multiAttackConditionTarget),
      multiAttackConditionMatches21_9: multiAttackConditionMatches,
      multiAttackInstructionAnchorsMatch21_9: multiAttackInstructionAnchorsMatch,
      multiAttackSemantics:
        'type 83: unconditional structural parent with up to eight positive child IDs at +0x10..+0x2c; packed sMONSTER+0x7dc stores active bit 8, signed completed-child nibble 4..7, low-nibble cursor, and parent ID in bits 9..31; each child condition runs at scale 1.0 without child slot/HP/budget gates, eligible children execute in order in the same enemy turn, type 82 or a rejected child takes the -1.0 ordinary-attack path and terminates, while the zero/missing-child -1000.0 path ends without another attack',
      unconditionalHealType: UNCONDITIONAL_HEAL_ENEMY_SKILL_TYPE,
      unconditionalHealDispatchTarget: unconditionalHealDispatchTarget === null
        ? null : hex(unconditionalHealDispatchTarget),
      unconditionalHealDispatchMatches21_9: unconditionalHealDispatchMatches,
      unconditionalHealSetupTarget: unconditionalHealSetupTarget === null
        ? null : hex(unconditionalHealSetupTarget),
      unconditionalHealSetupMatches21_9: unconditionalHealSetupMatches,
      unconditionalHealConditionTarget: unconditionalHealConditionTarget === null
        ? null : hex(unconditionalHealConditionTarget),
      unconditionalHealConditionMatches21_9: unconditionalHealConditionMatches,
      unconditionalHealSemantics:
        'type 86: shares type 7 dispatch/setup, selecting one inclusive +0x10..+0x14 max-HP percentage with one LCG roll and adding round(maxHP*percent/100); unlike type 7 it uses the unconditional 1.0 condition at 0x61a630',
      damageAbsorbType: DAMAGE_ABSORB_ENEMY_SKILL_TYPE,
      damageAbsorbDispatchTarget: damageAbsorbDispatchTarget === null
        ? null : hex(damageAbsorbDispatchTarget),
      damageAbsorbDispatchMatches21_9: damageAbsorbDispatchMatches,
      damageAbsorbSetupTarget: damageAbsorbSetupTarget === null
        ? null : hex(damageAbsorbSetupTarget),
      damageAbsorbSetupMatches21_9: damageAbsorbSetupMatches,
      damageAbsorbConditionTarget: damageAbsorbConditionTarget === null
        ? null : hex(damageAbsorbConditionTarget),
      damageAbsorbConditionMatches21_9: damageAbsorbConditionMatches,
      damageAbsorbInstructionAnchorsMatch21_9: damageAbsorbInstructionAnchorsMatch,
      damageAbsorbSemantics:
        'type 87: generic +0x10/+0x14 setup stores duration/threshold at runtime +0x678/+0x67c; execution installs protected signed-int16 duration at sMONSTER+0x960 and signed-int32 threshold at +0x970; condition admits only while duration < 1; _calcFinalDamage absorbs each positive post-shield lane whose damage is >= threshold before the later damage-void check',
      awakeningBindType: AWAKENING_BIND_ENEMY_SKILL_TYPE,
      awakeningBindDispatchTarget: awakeningBindDispatchTarget === null
        ? null : hex(awakeningBindDispatchTarget),
      awakeningBindDispatchMatches21_9: awakeningBindDispatchMatches,
      awakeningBindSetupTarget: awakeningBindSetupTarget === null
        ? null : hex(awakeningBindSetupTarget),
      awakeningBindSetupMatches21_9: awakeningBindSetupMatches,
      awakeningBindConditionTarget: awakeningBindConditionTarget === null
        ? null : hex(awakeningBindConditionTarget),
      awakeningBindConditionMatches21_9: awakeningBindConditionMatches,
      awakeningBindInstructionAnchorsMatch21_9: awakeningBindInstructionAnchorsMatch,
      awakeningBindSemantics:
        'type 88: +0x10 duration is added into the protected low-ten-bit sGAMEWORK+0x874d4 counter; an already-active bind sets continuation bit 0x400 to skip one post-enemy-attack decrement; the condition admits only while the ordinary counter is zero; active reads suppress awakening-derived passives and the handler recalculates card awakenings both on application and expiry',
      skillDelayType: SKILL_DELAY_ENEMY_SKILL_TYPE,
      skillDelayDispatchTarget: skillDelayDispatchTarget === null
        ? null : hex(skillDelayDispatchTarget),
      skillDelayDispatchMatches21_9: skillDelayDispatchMatches,
      skillDelaySetupTarget: skillDelaySetupTarget === null
        ? null : hex(skillDelaySetupTarget),
      skillDelaySetupMatches21_9: skillDelaySetupMatches,
      skillDelayConditionTarget: skillDelayConditionTarget === null
        ? null : hex(skillDelayConditionTarget),
      skillDelayConditionMatches21_9: skillDelayConditionMatches,
      skillDelayInstructionAnchorsMatch21_9: skillDelayInstructionAnchorsMatch,
      skillDelaySemantics:
        'type 89: setup walks six present usable skill gauges, advances the shared LCG for each charged gauge, rolls inclusive +0x10..+0x14, subtracts applicable skill-delay-resist latent protection (disabled by the ordinary awakening-bind path), caps to current charge, and stores six int32 delays at runtime +0x678 plus target mask +0x674; execution subtracts each stored delay and floors charge at zero; condition is unconditional',
      earlyDefenseShieldSkills: earlyDefenseShieldTargets.map((entry) => ({
        type: entry.type,
        kind: entry.kind,
        dispatchTarget: entry.dispatchTarget === null ? null : hex(entry.dispatchTarget),
        setupTarget: entry.setupTarget === null ? null : hex(entry.setupTarget),
        conditionTarget: entry.conditionTarget === null ? null : hex(entry.conditionTarget),
        matches21_9: entry.matches21_9,
      })),
      defenseBoostSemantics:
        'type 9: +0x10 duration; one-LCG inclusive +0x14..+0x18 percent; +0x800 = round(float32(int64 base defense*percent)/100), +0x810 signed-int16 turns',
      attributeNullifySemantics:
        'types 10/11: +0x10 duration and one/two +0x14/+0x18 attributes; bitmask at +0x820 and signed-int16 turns at +0x830 force matching attributes 0..4 to zero damage',
      sourceToJammerType: SOURCE_TO_JAMMER_ENEMY_SKILL_TYPE,
      sourceToJammerDispatchTarget: sourceToJammerDispatchTarget === null
        ? null : hex(sourceToJammerDispatchTarget),
      sourceToJammerDispatchMatches21_9: sourceToJammerDispatchMatches,
      sourceToJammerSetupTarget: sourceToJammerSetupTarget === null
        ? null : hex(sourceToJammerSetupTarget),
      sourceToJammerSetupMatches21_9: sourceToJammerSetupMatches,
      sourceToJammerConditionTarget: sourceToJammerConditionTarget === null
        ? null : hex(sourceToJammerConditionTarget),
      sourceToJammerConditionMatches21_9: sourceToJammerConditionMatches,
      blackFallType: BLACK_FALL_ENEMY_SKILL_TYPE,
      dispatchEntry: blackFallDispatchEntry === null ? null : hex(blackFallDispatchEntry),
      dispatchTarget: blackFallDispatchTarget === null ? null : hex(blackFallDispatchTarget),
      dispatchMatches21_9: blackFallDispatchMatches,
      setupEntry: blackFallSetupEntry === null ? null : hex(blackFallSetupEntry),
      setupTarget: blackFallSetupTarget === null ? null : hex(blackFallSetupTarget),
      setupMatches21_9: blackFallSetupMatches,
      healPlayerType: HEAL_PLAYER_ENEMY_SKILL_TYPE,
      healPlayerDispatchTarget: healPlayerDispatchTarget === null
        ? null : hex(healPlayerDispatchTarget),
      healPlayerDispatchMatches21_9: healPlayerDispatchMatches,
      healPlayerSetupTarget: healPlayerSetupTarget === null ? null : hex(healPlayerSetupTarget),
      healPlayerSetupMatches21_9: healPlayerSetupMatches,
      healPlayerConditionTarget: healPlayerConditionTarget === null
        ? null : hex(healPlayerConditionTarget),
      healPlayerConditionMatches21_9: healPlayerConditionMatches,
      loneAttackBoostType: LONE_ATTACK_BOOST_ENEMY_SKILL_TYPE,
      loneAttackBoostDispatchTarget: loneAttackBoostDispatchTarget === null
        ? null : hex(loneAttackBoostDispatchTarget),
      loneAttackBoostDispatchMatches21_9: loneAttackBoostDispatchMatches,
      loneAttackBoostSetupTarget: loneAttackBoostSetupTarget === null
        ? null : hex(loneAttackBoostSetupTarget),
      loneAttackBoostSetupMatches21_9: loneAttackBoostSetupMatches,
      loneAttackBoostConditionTarget: loneAttackBoostConditionTarget === null
        ? null : hex(loneAttackBoostConditionTarget),
      loneAttackBoostConditionMatches21_9: loneAttackBoostConditionMatches,
      statusTriggeredAttackBoostType: STATUS_TRIGGERED_ATTACK_BOOST_ENEMY_SKILL_TYPE,
      statusTriggeredAttackBoostDispatchTarget: statusTriggeredAttackBoostDispatchTarget === null
        ? null : hex(statusTriggeredAttackBoostDispatchTarget),
      statusTriggeredAttackBoostDispatchMatches21_9: statusTriggeredAttackBoostDispatchMatches,
      statusTriggeredAttackBoostSetupTarget: statusTriggeredAttackBoostSetupTarget === null
        ? null : hex(statusTriggeredAttackBoostSetupTarget),
      statusTriggeredAttackBoostSetupMatches21_9: statusTriggeredAttackBoostSetupMatches,
      statusTriggeredAttackBoostConditionTarget: statusTriggeredAttackBoostConditionTarget === null
        ? null : hex(statusTriggeredAttackBoostConditionTarget),
      statusTriggeredAttackBoostConditionMatches21_9: statusTriggeredAttackBoostConditionMatches,
      statusTriggeredAttackBoostConditionLanes:
        'sGAMEWORK+0x86bd4, sGAMEWORK+0x86c3c, or sMONSTER+0x07; requires sMONSTER+0x860 inactive',
      damagedTurnAttackBoostType: DAMAGED_TURN_ATTACK_BOOST_ENEMY_SKILL_TYPE,
      damagedTurnAttackBoostDispatchTarget: damagedTurnAttackBoostDispatchTarget === null
        ? null : hex(damagedTurnAttackBoostDispatchTarget),
      damagedTurnAttackBoostDispatchMatches21_9: damagedTurnAttackBoostDispatchMatches,
      damagedTurnAttackBoostSetupTarget: damagedTurnAttackBoostSetupTarget === null
        ? null : hex(damagedTurnAttackBoostSetupTarget),
      damagedTurnAttackBoostSetupMatches21_9: damagedTurnAttackBoostSetupMatches,
      damagedTurnAttackBoostConditionTarget: damagedTurnAttackBoostConditionTarget === null
        ? null : hex(damagedTurnAttackBoostConditionTarget),
      damagedTurnAttackBoostConditionMatches21_9: damagedTurnAttackBoostConditionMatches,
      damagedTurnCounterOffset:
        'sMONSTER+0x7d0 uint16; increments once per player turn with positive calculated damage',
      statusShieldType: STATUS_SHIELD_ENEMY_SKILL_TYPE,
      statusShieldDispatchTarget: statusShieldDispatchTarget === null
        ? null : hex(statusShieldDispatchTarget),
      statusShieldDispatchMatches21_9: statusShieldDispatchMatches,
      statusShieldSetupTarget: statusShieldSetupTarget === null
        ? null : hex(statusShieldSetupTarget),
      statusShieldSetupMatches21_9: statusShieldSetupMatches,
      statusShieldConditionTarget: statusShieldConditionTarget === null
        ? null : hex(statusShieldConditionTarget),
      statusShieldConditionMatches21_9: statusShieldConditionMatches,
      inactiveEnemySkillTypes21Through38: inactiveEnemySkillTargets21Through38.map((entry) => ({
        type: entry.type,
        dispatchTarget: entry.dispatchTarget === null ? null : hex(entry.dispatchTarget),
        setupTarget: entry.setupTarget === null ? null : hex(entry.setupTarget),
        conditionTarget: entry.conditionTarget === null ? null : hex(entry.conditionTarget),
      })),
      inactiveEnemySkillTypes21Through38Match21_9: inactiveEnemySkills21Through38Match,
      moveTimeReductionType: MOVE_TIME_REDUCTION_ENEMY_SKILL_TYPE,
      moveTimeReductionDispatchTarget: moveTimeReductionDispatchTarget === null
        ? null : hex(moveTimeReductionDispatchTarget),
      moveTimeReductionDispatchMatches21_9: moveTimeReductionDispatchMatches,
      moveTimeReductionSetupTarget: moveTimeReductionSetupTarget === null
        ? null : hex(moveTimeReductionSetupTarget),
      moveTimeReductionSetupMatches21_9: moveTimeReductionSetupMatches,
      moveTimeReductionConditionTarget: moveTimeReductionConditionTarget === null
        ? null : hex(moveTimeReductionConditionTarget),
      moveTimeReductionConditionMatches21_9: moveTimeReductionConditionMatches,
      selfDestructType: SELF_DESTRUCT_ENEMY_SKILL_TYPE,
      selfDestructDispatchTarget: selfDestructDispatchTarget === null
        ? null : hex(selfDestructDispatchTarget),
      selfDestructDispatchMatches21_9: selfDestructDispatchMatches,
      selfDestructSetupTarget: selfDestructSetupTarget === null
        ? null : hex(selfDestructSetupTarget),
      selfDestructSetupMatches21_9: selfDestructSetupMatches,
      selfDestructConditionTarget: selfDestructConditionTarget === null
        ? null : hex(selfDestructConditionTarget),
      selfDestructConditionMatches21_9: selfDestructConditionMatches,
      inactiveEnemySkillTypes: inactiveEnemySkillTargets.map((entry) => ({
        type: entry.type,
        dispatchTarget: entry.dispatchTarget === null ? null : hex(entry.dispatchTarget),
        setupTarget: entry.setupTarget === null ? null : hex(entry.setupTarget),
        conditionTarget: entry.conditionTarget === null ? null : hex(entry.conditionTarget),
      })),
      inactiveEnemySkillTypes41Through45Match21_9: inactiveEnemySkillsMatch,
      changeAttributeType: CHANGE_ATTRIBUTE_ENEMY_SKILL_TYPE,
      changeAttributeDispatchTarget: changeAttributeDispatchTarget === null
        ? null : hex(changeAttributeDispatchTarget),
      changeAttributeDispatchMatches21_9: changeAttributeDispatchMatches,
      changeAttributeSetupTarget: changeAttributeSetupTarget === null
        ? null : hex(changeAttributeSetupTarget),
      changeAttributeSetupMatches21_9: changeAttributeSetupMatches,
      changeAttributeConditionTarget: changeAttributeConditionTarget === null
        ? null : hex(changeAttributeConditionTarget),
      changeAttributeConditionMatches21_9: changeAttributeConditionMatches,
      scaledAttackType: SCALED_ATTACK_ENEMY_SKILL_TYPE,
      scaledAttackDispatchTarget: scaledAttackDispatchTarget === null
        ? null : hex(scaledAttackDispatchTarget),
      scaledAttackDispatchMatches21_9: scaledAttackDispatchMatches,
      scaledAttackSetupTarget: scaledAttackSetupTarget === null
        ? null : hex(scaledAttackSetupTarget),
      scaledAttackSetupMatches21_9: scaledAttackSetupMatches,
      scaledAttackConditionTarget: scaledAttackConditionTarget === null
        ? null : hex(scaledAttackConditionTarget),
      scaledAttackConditionMatches21_9: scaledAttackConditionMatches,
      currentHpGravityType: CURRENT_HP_GRAVITY_ENEMY_SKILL_TYPE,
      currentHpGravityDispatchTarget: currentHpGravityDispatchTarget === null
        ? null : hex(currentHpGravityDispatchTarget),
      currentHpGravityDispatchMatches21_9: currentHpGravityDispatchMatches,
      currentHpGravitySetupTarget: currentHpGravitySetupTarget === null
        ? null : hex(currentHpGravitySetupTarget),
      currentHpGravitySetupMatches21_9: currentHpGravitySetupMatches,
      currentHpGravityConditionTarget: currentHpGravityConditionTarget === null
        ? null : hex(currentHpGravityConditionTarget),
      currentHpGravityConditionMatches21_9: currentHpGravityConditionMatches,
      reviveEnemyType: REVIVE_ENEMY_SKILL_TYPE,
      reviveEnemyDispatchTarget: reviveEnemyDispatchTarget === null
        ? null : hex(reviveEnemyDispatchTarget),
      reviveEnemyDispatchMatches21_9: reviveEnemyDispatchMatches,
      reviveEnemySetupTarget: reviveEnemySetupTarget === null
        ? null : hex(reviveEnemySetupTarget),
      reviveEnemySetupMatches21_9: reviveEnemySetupMatches,
      reviveEnemyConditionTarget: reviveEnemyConditionTarget === null
        ? null : hex(reviveEnemyConditionTarget),
      reviveEnemyConditionMatches21_9: reviveEnemyConditionMatches,
      attributeAbsorbType: ATTRIBUTE_ABSORB_ENEMY_SKILL_TYPE,
      attributeAbsorbDispatchTarget: attributeAbsorbDispatchTarget === null
        ? null : hex(attributeAbsorbDispatchTarget),
      attributeAbsorbDispatchMatches21_9: attributeAbsorbDispatchMatches,
      attributeAbsorbSetupTarget: attributeAbsorbSetupTarget === null
        ? null : hex(attributeAbsorbSetupTarget),
      attributeAbsorbSetupMatches21_9: attributeAbsorbSetupMatches,
      attributeAbsorbConditionTarget: attributeAbsorbConditionTarget === null
        ? null : hex(attributeAbsorbConditionTarget),
      attributeAbsorbConditionMatches21_9: attributeAbsorbConditionMatches,
      bindLeaderHelperType: BIND_LEADER_HELPER_ENEMY_SKILL_TYPE,
      bindLeaderHelperDispatchTarget: bindLeaderHelperDispatchTarget === null
        ? null : hex(bindLeaderHelperDispatchTarget),
      bindLeaderHelperDispatchMatches21_9: bindLeaderHelperDispatchMatches,
      bindLeaderHelperSetupTarget: bindLeaderHelperSetupTarget === null
        ? null : hex(bindLeaderHelperSetupTarget),
      bindLeaderHelperSetupMatches21_9: bindLeaderHelperSetupMatches,
      bindLeaderHelperConditionTarget: bindLeaderHelperConditionTarget === null
        ? null : hex(bindLeaderHelperConditionTarget),
      bindLeaderHelperConditionMatches21_9: bindLeaderHelperConditionMatches,
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
    || sourceOrbConversionDispatchMatches === false
    || sourceOrbConversionSetupMatches === false
    || sourceOrbConversionConditionMatches === false
    || entireBlindDispatchMatches === false
    || entireBlindSetupMatches === false
    || entireBlindConditionMatches === false
    || entireBlindAltDispatchMatches === false
    || entireBlindAltSetupMatches === false
    || entireBlindAltConditionMatches === false
    || bindAttackDispatchMatches === false
    || bindAttackSetupMatches === false
    || bindAttackConditionMatches === false
    || randomSubBindDispatchMatches === false
    || randomSubBindSetupMatches === false
    || randomSubBindConditionMatches === false
    || clearPlayerBuffsDispatchMatches === false
    || clearPlayerBuffsSetupMatches === false
    || clearPlayerBuffsConditionMatches === false
    || healEnemyDispatchMatches === false
    || healEnemySetupMatches === false
    || healEnemyConditionMatches === false
    || additionalAttackDispatchMatches === false
    || additionalAttackSetupMatches === false
    || additionalAttackConditionMatches === false
    || earlyDefenseShieldEntriesMatch === false
    || earlyPartyControlEntriesMatch === false
    || repeatAttackDispatchMatches === false
    || repeatAttackSetupMatches === false
    || repeatAttackConditionMatches === false
    || inactivityDispatchMatches === false
    || inactivitySetupMatches === false
    || inactivityConditionMatches === false
    || unconditionalInactivityDispatchMatches === false
    || unconditionalInactivitySetupMatches === false
    || unconditionalInactivityConditionMatches === false
    || comboAbsorbDispatchMatches === false
    || comboAbsorbSetupMatches === false
    || comboAbsorbConditionMatches === false
    || skyfallRateDispatchMatches === false
    || skyfallRateSetupMatches === false
    || skyfallRateConditionMatches === false
    || deathCryDispatchMatches === false
    || deathCrySetupMatches === false
    || deathCryConditionMatches === false
    || inactivityPresentationDispatchMatches === false
    || inactivityPresentationSetupMatches === false
    || inactivityPresentationConditionMatches === false
    || damageVoidDispatchMatches === false
    || damageVoidSetupMatches === false
    || damageVoidConditionMatches === false
    || attributeResistDispatchMatches === false
    || attributeResistSetupMatches === false
    || attributeResistConditionMatches === false
    || resolveDispatchMatches === false
    || resolveSetupMatches === false
    || resolveConditionMatches === false
    || damageShieldDispatchMatches === false
    || damageShieldSetupMatches === false
    || damageShieldConditionMatches === false
    || leaderSwapDispatchMatches === false
    || leaderSwapSetupMatches === false
    || leaderSwapConditionMatches === false
    || normalAttackDispatchMatches === false
    || normalAttackSetupMatches === false
    || normalAttackConditionMatches === false
    || multiAttackDispatchMatches === false
    || multiAttackSetupMatches === false
    || multiAttackConditionMatches === false
    || multiAttackInstructionAnchorsMatch === false
    || unconditionalHealDispatchMatches === false
    || unconditionalHealSetupMatches === false
    || unconditionalHealConditionMatches === false
    || damageAbsorbDispatchMatches === false
    || damageAbsorbSetupMatches === false
    || damageAbsorbConditionMatches === false
    || damageAbsorbInstructionAnchorsMatch === false
    || awakeningBindDispatchMatches === false
    || awakeningBindSetupMatches === false
    || awakeningBindConditionMatches === false
    || awakeningBindInstructionAnchorsMatch === false
    || skillDelayDispatchMatches === false
    || skillDelaySetupMatches === false
    || skillDelayConditionMatches === false
    || skillDelayInstructionAnchorsMatch === false
    || sourceToJammerDispatchMatches === false
    || sourceToJammerSetupMatches === false
    || sourceToJammerConditionMatches === false
    || blackFallDispatchMatches === false || blackFallSetupMatches === false
    || healPlayerDispatchMatches === false || healPlayerSetupMatches === false
    || healPlayerConditionMatches === false
    || loneAttackBoostDispatchMatches === false || loneAttackBoostSetupMatches === false
    || loneAttackBoostConditionMatches === false
    || statusTriggeredAttackBoostDispatchMatches === false
    || statusTriggeredAttackBoostSetupMatches === false
    || statusTriggeredAttackBoostConditionMatches === false
    || damagedTurnAttackBoostDispatchMatches === false
    || damagedTurnAttackBoostSetupMatches === false
    || damagedTurnAttackBoostConditionMatches === false
    || statusShieldDispatchMatches === false || statusShieldSetupMatches === false
    || statusShieldConditionMatches === false || inactiveEnemySkills21Through38Match === false
    || moveTimeReductionDispatchMatches === false || moveTimeReductionSetupMatches === false
    || moveTimeReductionConditionMatches === false
    || selfDestructDispatchMatches === false || selfDestructSetupMatches === false
    || selfDestructConditionMatches === false || inactiveEnemySkillsMatch === false
    || changeAttributeDispatchMatches === false || changeAttributeSetupMatches === false
    || changeAttributeConditionMatches === false
    || scaledAttackDispatchMatches === false || scaledAttackSetupMatches === false
    || scaledAttackConditionMatches === false
    || currentHpGravityDispatchMatches === false || currentHpGravitySetupMatches === false
    || currentHpGravityConditionMatches === false
    || reviveEnemyDispatchMatches === false || reviveEnemySetupMatches === false
    || reviveEnemyConditionMatches === false
    || attributeAbsorbDispatchMatches === false || attributeAbsorbSetupMatches === false
    || attributeAbsorbConditionMatches === false
    || bindLeaderHelperDispatchMatches === false || bindLeaderHelperSetupMatches === false
    || bindLeaderHelperConditionMatches === false
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
