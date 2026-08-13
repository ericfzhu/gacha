import { readFile } from 'node:fs/promises';
import { Arm64Runtime } from '../src/binary-port/arm64Runtime.js';
import { VirtualLinux } from '../src/binary-port/virtualLinux.js';
import { VirtualJni } from '../src/binary-port/virtualJni.js';

const wasm = await readFile(new URL('../public/wasm/arm64_core.wasm', import.meta.url));
const restored = new Uint8Array(await readFile('/tmp/libpad-restored.so'));
const runtime = await Arm64Runtime.create(wasm);
runtime.loadBytes(0x1000, new Uint8Array([0xc0, 0x03, 0x5f, 0xd6]));
const linux = new VirtualLinux(runtime, { libraryPath: '/data/app/jp.gungho.pad/lib/arm64/libpad.so' });
for (const name of [
  'libz.so', 'libm.so', 'liblog.so', 'libandroid.so', 'libEGL.so', 'libGLESv1_CM.so',
  'libOpenSLES.so', 'libjnigraphics.so', 'libdl.so', 'libc.so', 'libstdc++.so',
]) linux.mountSharedObject(`/system/lib64/${name}`, await readFile(`/tmp/browser-${name}`));
linux.mountSharedObject('/system/lib64/libart.so', await readFile('/tmp/browser-libc.so'));
const jni = new VirtualJni(linux);
linux.mountSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so', restored, 0x2000000);
const pad = linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so');
const initArray = pad.elf.sections.find((section) => section.name === '.init_array');
const runs = [];
for (let index = 0; process.argv.includes('--constructors') && index < initArray.size / 8; index += 1) {
  const address = Number(new DataView(runtime.readBytes(pad.address + initArray.virtualAddress + index * 8, 8).buffer).getBigUint64(0, true));
  if (!address) continue;
  try {
    const result = linux.executeGuestCallback(address, [0n, 0n, 0n]);
    runs.push({ index, address: `0x${address.toString(16)}`, result: `0x${result.toString(16)}` });
  } catch (error) {
    console.log(JSON.stringify({ phase: 'constructor', index, address: `0x${address.toString(16)}`, error: error.message }, null, 2));
    process.exit(0);
  }
}
const find = (name) => {
  const symbol = pad.elf.dynamicSymbols.find((candidate) => candidate.name === name && candidate.sectionIndex);
  return symbol ? pad.address + symbol.value : 0;
};
const invoke = (name, integerArguments = [], vectorArguments = []) => {
  const address = find(`Java_jp_gungho_pad_AppDelegate_${name}`);
  const eventStart = linux.events.length;
  try {
    const result = linux.executeGuestCallback(
      address,
      [BigInt(jni.envAddress), 1n, ...integerArguments.map(BigInt)],
      0,
      vectorArguments,
    );
    return { name, address: `0x${address.toString(16)}`, result: `0x${result.toString(16)}`, events: linux.events.slice(eventStart).slice(-20) };
  } catch (error) {
    return { name, address: `0x${address.toString(16)}`, error: error.message };
  }
};
const jniOnLoad = linux.executeGuestCallback(find('JNI_OnLoad'), [BigInt(jni.vmAddress), 0n]);
const lifecycle = [
  invoke('didFinishLaunchingWithOptions'),
  invoke('onSurfaceCreated', [1]),
  invoke('onSurfaceChanged', [900, 560, 900, 560], [0, 0, 900, 560]),
  invoke('onDrawFrame'),
];
console.log(JSON.stringify({ constructors: runs.length, jniOnLoad: `0x${jniOnLoad.toString(16)}`, lifecycle }, (_, value) => typeof value === 'bigint' ? `0x${value.toString(16)}` : value, 2));
