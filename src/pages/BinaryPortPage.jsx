import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Arm64Runtime, LIBPAD_CONSTRUCTOR_ADDRESS } from '../binary-port/arm64Runtime.js';
import { VirtualLinux } from '../binary-port/virtualLinux.js';
import { extractPadRuntimeFromApk } from '../binary-port/apk.js';
import { PadBrowserInputModel } from '../binary-port/padInputModel.js';

const WIDTH = 900;
const HEIGHT = 560;
const GAME_WIDTH = 560;
const GAME_HEIGHT = 900;
function drawPanel(ctx, x, y, width, height, title) {
  ctx.fillStyle = 'rgba(12, 22, 37, .76)';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(130, 210, 226, .18)';
  ctx.stroke();
  ctx.fillStyle = '#8ba0b9';
  ctx.font = '700 11px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 18, y + 25);
}

function drawRuntimeLab(ctx, state) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#111d31');
  gradient.addColorStop(1, '#07111e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(113, 187, 205, .045)';
  for (let x = 0; x < WIDTH; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
  for (let y = 0; y < HEIGHT; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }

  ctx.fillStyle = '#f2f5f9';
  ctx.font = '800 32px "Barlow Condensed", sans-serif';
  ctx.fillText('LIBPAD BINARY PORT LAB', 34, 48);
  ctx.fillStyle = '#78c8d9';
  ctx.font = '700 11px "Noto Sans", sans-serif';
  ctx.fillText('AARCH64 → WEBASSEMBLY EXECUTION HARNESS', 35, 68);

  const ready = state.phase !== 'booting' && state.phase !== 'error';
  ctx.fillStyle = ready ? '#76e19b' : state.phase === 'error' ? '#ff7b75' : '#efc765';
  ctx.beginPath();
  ctx.arc(839, 43, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'right';
  ctx.font = '700 11px "Noto Sans", sans-serif';
  ctx.fillText(state.phase.toUpperCase(), 824, 47);

  drawPanel(ctx, 30, 94, 400, 178, 'WASM CPU CORE');
  const metrics = [
    ['Guest ISA', 'ARMv8-A / AArch64'],
    ['Host target', 'WebAssembly 32-bit'],
    ['Memory model', 'Biased guest virtual memory'],
      ['Current decoder', 'Protected loader + JNI / Android ABI'],
  ];
  metrics.forEach(([label, value], index) => {
    const y = 130 + index * 31;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8392a8';
    ctx.font = '600 12px "Noto Sans", sans-serif';
    ctx.fillText(label, 49, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e6edf6';
    ctx.font = '700 12px "Noto Sans", sans-serif';
    ctx.fillText(value, 410, y);
  });

  drawPanel(ctx, 450, 94, 420, 178, 'EXACT LIBPAD PROBE · VA 0x003323c0');
  const probe = state.probe;
  ctx.textAlign = 'left';
  ctx.fillStyle = probe?.passed ? '#76e19b' : '#efc765';
  ctx.font = '800 25px "Barlow Condensed", sans-serif';
  ctx.fillText(probe?.passed ? 'PASS · X0 = 225' : 'AWAITING EXECUTION', 469, 143);
  ctx.fillStyle = '#9eabc0';
  ctx.font = '600 12px "Noto Sans", sans-serif';
  ctx.fillText('52801c20   mov w0, #0xe1', 469, 181);
  ctx.fillText('d65f03c0   ret', 469, 207);
  ctx.fillStyle = '#728097';
  ctx.font = '600 10px "Noto Sans", sans-serif';
  ctx.fillText(`${probe?.steps || 0} guest instructions · halt sentinel ${probe?.status ?? '—'}`, 469, 242);

  drawPanel(ctx, 30, 291, 840, 225, state.elf ? 'LOADED ELF64 IMAGE' : 'PROTECTED ELF64 IMAGE');
  if (state.elf) {
    const rows = [
      ['File', state.elf.name],
      ['Bytes', state.elf.fileBytes.toLocaleString()],
      ['PT_LOAD segments / bias', `${state.elf.loadSegments} / 0x${state.elf.loadBias.toString(16)}`],
      ['Custom protected section', state.elf.customSectionBytes ? `${state.elf.customSectionBytes.toLocaleString()} bytes` : 'not found'],
      ['Resident probe', state.elf.probePassed ? 'executed from loaded image' : 'not executed'],
      ['Constructor boundary', state.elf.constructorReached ? `${state.elf.constructorSteps} instructions → openat(${state.elf.firstPath})` : 'not reached'],
      ['Protected loader', state.elf.decryptedModule ? `${state.elf.deepInstructions.toLocaleString()} instructions · ${state.elf.syscalls} syscalls · ${state.elf.executableStages} stages` : 'not reached'],
      ['Current boundary', state.elf.loadSequence ? `${state.elf.loadSequence} · ${state.elf.deepStatus}` : state.elf.dependencyPath ? `Android namespace needs ${state.elf.dependencyPath}` : state.elf.deepStatus],
    ];
    rows.forEach(([label, value], index) => {
      const y = 330 + index * 25;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7f8da3';
      ctx.font = '600 11px "Noto Sans", sans-serif';
      ctx.fillText(label, 49, y);
      ctx.fillStyle = index === 7 && state.elf.dependencyPath ? '#efc765'
        : index >= 4 && (state.elf.probePassed || state.elf.constructorReached) ? '#76e19b'
          : '#e2e8f0';
      ctx.fillText(value, 245, y);
    });
  } else {
    ctx.fillStyle = '#dce5f0';
    ctx.font = '700 17px "Barlow Condensed", sans-serif';
    ctx.fillText('Load the APK directly, or select its four extracted runtime files together.', 49, 345);
    ctx.fillStyle = '#8c9ab0';
    ctx.font = '500 12px "Noto Sans", sans-serif';
    ctx.fillText('The browser keeps the file local. It is copied into Wasm linear memory and is not uploaded.', 49, 377);
    ctx.fillText('The embedded two-instruction probe above comes from this exact APK and validates the execution boundary.', 49, 404);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Current milestone: exact Android load order + JNI bridge; next boundary is protected native binding.', 49, 465);
  }

  if (state.error) {
    ctx.fillStyle = 'rgba(94, 24, 32, .92)';
    ctx.fillRect(30, 518, 840, 28);
    ctx.fillStyle = '#ffb3b0';
    ctx.font = '600 11px "Noto Sans", sans-serif';
    ctx.fillText(state.error, 43, 537);
  }
}

export default function BinaryPortPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameCanvasRef = useRef(null);
  const runtimeRef = useRef(null);
  const workerRef = useRef(null);
  const frameRequestRef = useRef(0);
  const inputRef = useRef(new PadBrowserInputModel());
  const [state, setState] = useState({ phase: 'booting', probe: null, elf: null, error: null });

  useEffect(() => {
    let disposed = false;
    Arm64Runtime.create().then((runtime) => {
      if (disposed) return;
      runtimeRef.current = runtime;
      const probe = runtime.runLibpadProbe();
      setState({ phase: probe.passed ? 'wasm ready' : 'probe failed', probe, elf: null, error: null });
    }).catch((error) => {
      if (!disposed) setState({ phase: 'error', probe: null, elf: null, error: error.message });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frameRequestRef.current);
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const renderToText = () => JSON.stringify({
      coordinateSystem: 'diagnostic canvas: origin top-left, +x right, +y down',
      gameplay: state.phase === 'native game running' ? {
        canvas: { width: GAME_WIDTH, height: GAME_HEIGHT },
        input: 'Android onTouchEvent(FFIIIIJI)',
        frame: state.frame ?? 0,
        drawCalls: state.drawCalls ?? 0,
      } : null,
      ...state,
    }, (_, value) => typeof value === 'bigint' ? value.toString() : value);
    const advanceTime = () => {};
    window.render_game_to_text = renderToText;
    window.advanceTime = advanceTime;
    return () => {
      if (window.render_game_to_text === renderToText) delete window.render_game_to_text;
      if (window.advanceTime === advanceTime) delete window.advanceTime;
    };
  }, [state]);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context) drawRuntimeLab(context, state);
  }, [state]);

  const rerunProbe = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const probe = runtime.runLibpadProbe();
    setState((current) => ({ ...current, phase: probe.passed ? 'wasm ready' : 'probe failed', probe, error: null }));
  };

  const loadElf = async (event) => {
    const selectedFiles = [...(event.target.files || [])];
    const file = selectedFiles[0];
    const runtime = runtimeRef.current;
    if (!file || !runtime) return;
    setState((current) => ({ ...current, phase: 'mapping elf', error: null }));
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const apk = selectedFiles.find((candidate) => candidate.name.toLowerCase().endsWith('.apk'));
      let runtimeFiles;
      if (apk) runtimeFiles = await extractPadRuntimeFromApk(apk);
      else {
        const byName = new Map(selectedFiles.map((candidate) => [candidate.name, candidate]));
        const read = async (name) => byName.has(name) ? new Uint8Array(await byName.get(name).arrayBuffer()) : null;
        runtimeFiles = {
          libpad: await read('libpad.so') || new Uint8Array(await file.arrayBuffer()),
          libopenal: await read('libopenal.so'),
          lib6dba: await read('lib__6dba__.so'),
          protectionData: await read('data1.dat'),
          baseApk: null,
        };
      }
      runtimeFiles.extraFiles = await Promise.all(selectedFiles
        .filter((candidate) => candidate !== apk && candidate.name.toLowerCase().endsWith('.bin'))
        .map(async (candidate) => ({ name: candidate.name, bytes: new Uint8Array(await candidate.arrayBuffer()) })));
      const elf = runtime.loadElf(runtimeFiles.libpad);
      const completeRuntime = runtimeFiles.libopenal && runtimeFiles.lib6dba && runtimeFiles.protectionData;
      if (completeRuntime) {
        workerRef.current?.terminate();
        const worker = new Worker(new URL('../binary-port/binaryPortWorker.js', import.meta.url), { type: 'module' });
        workerRef.current = worker;
        const requestNativeFrame = () => {
          cancelAnimationFrame(frameRequestRef.current);
          frameRequestRef.current = requestAnimationFrame((timestamp) => worker.postMessage({ type: 'frame', timestamp }));
        };
        worker.onmessage = ({ data }) => {
          if (data.type === 'progress') {
            setState((current) => ({ ...current, phase: data.phase, error: null }));
          } else if (data.type === 'complete') {
            setState({ phase: data.phase, probe: data.probe, elf: data.elf, error: null, frame: 1, drawCalls: data.elf.firstFrameDrawCalls });
            requestNativeFrame();
          } else if (data.type === 'frame') {
            setState((current) => ({
              ...current,
              frame: (current.frame || 0) + 1,
              drawCalls: data.drawCalls,
              graphics: data.graphics,
              jni: data.jni,
              platform: data.platform,
            }));
            requestNativeFrame();
          } else if (data.type === 'touch') {
            setState((current) => ({ ...current, lastTouch: data.touch, touchResult: data.result, touchCount: data.touchCount }));
          } else if (data.type === 'error') {
            setState((current) => ({ ...current, phase: 'error', error: data.message }));
            worker.terminate();
            if (workerRef.current === worker) workerRef.current = null;
          }
        };
        worker.onerror = (workerError) => {
          setState((current) => ({ ...current, phase: 'error', error: workerError.message || 'Binary-port worker failed.' }));
        };
        const offscreen = gameCanvasRef.current?.transferControlToOffscreen();
        if (!offscreen) throw new Error('OffscreenCanvas is required for the native GLES worker.');
        const transferableBuffers = [
          ...Object.values(runtimeFiles).filter((bytes) => bytes instanceof Uint8Array).map((bytes) => bytes.buffer),
          ...runtimeFiles.extraFiles.map((entry) => entry.bytes.buffer),
        ];
        worker.postMessage({
          type: 'run', sourceName: apk?.name || file.name, runtimeFiles,
          canvas: offscreen, width: GAME_WIDTH, height: GAME_HEIGHT,
        }, [
          ...transferableBuffers,
          offscreen,
        ]);
        setState((current) => ({ ...current, phase: 'starting worker', error: null }));
        return;
      }
      const probe = runtime.runLibpadProbe(true);
      const constructor = runtime.runToFirstSyscall();
      runtime.reset(runtime.elfAddress(LIBPAD_CONSTRUCTOR_ADDRESS));
      const linux = new VirtualLinux(runtime).mountLibpad(runtimeFiles.libpad);
      const deepRun = linux.run(10_000_000);
      const executableMapping = deepRun.events.some((entry) => entry.name === 'mprotect' && entry.protection === 7);
      const missingDependency = deepRun.events.find((entry) => entry.path === '/system/lib64/libc.so' && entry.result < 0n);
      const stateWrites = deepRun.events.filter((entry) => entry.name === 'write' && /^\d+\n\d+\n/.test(entry.text || ''));
      const finalState = stateWrites.at(-1)?.text?.split('\n')[0] || null;
      const executableStages = linux.mappings.filter((mapping) => mapping.protection & 4).length;
      const custom = elf.customSections.find((section) => section.type === 0x80000000) || elf.customSections[0];
      setState({
        phase: deepRun.exited ? 'guest exited' : probe.passed && executableMapping ? 'loader active' : probe.passed ? 'elf mapped' : 'probe failed',
        probe,
        error: probe.passed ? null : 'The loaded image did not contain the expected libpad probe at VA 0x3323c0.',
        elf: {
          name: apk?.name || file.name,
          fileBytes: runtimeFiles.libpad.length,
          loadSegments: elf.loadSegments.length,
          maximumAddress: elf.maximumAddress,
          loadBias: runtime.loadBias,
          customSectionBytes: custom?.size || 0,
          probePassed: probe.passed,
          constructorReached: constructor.reached && constructor.number === 56,
          constructorSteps: constructor.steps,
          firstPath: constructor.path,
          decryptedModule: executableMapping,
          deepInstructions: deepRun.instructions,
          syscalls: deepRun.syscalls,
          executableStages,
          dependencyPath: missingDependency?.path || null,
          deepStatus: deepRun.exited ? `guest exit(${deepRun.exitCode})${finalState ? ` · protection state ${finalState}` : ''}` : `CPU status ${deepRun.status}`,
        },
      });
    } catch (error) {
      setState((current) => ({ ...current, phase: 'error', error: error.message }));
    }
  };

  const pointerCoordinates = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * GAME_WIDTH / rect.width,
      y: (event.clientY - rect.top) * GAME_HEIGHT / rect.height,
    };
  };

  const sendTouch = (touch) => {
    if (touch && workerRef.current) workerRef.current.postMessage({ type: 'touch', touch });
  };

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerCoordinates(event);
    sendTouch(inputRef.current.begin(event.pointerId, point.x, point.y, event.timeStamp));
  };
  const onPointerMove = (event) => {
    const point = pointerCoordinates(event);
    sendTouch(inputRef.current.move(event.pointerId, point.x, point.y, event.timeStamp));
  };
  const onPointerUp = (event) => {
    const point = pointerCoordinates(event);
    sendTouch(inputRef.current.end(event.pointerId, point.x, point.y, event.timeStamp));
  };
  const onPointerCancel = (event) => sendTouch(inputRef.current.cancel(event.timeStamp));

  return (
    <main className="binary-port-page">
      <button className="puzzle-back" onClick={() => navigate('/')} aria-label="Return to title">‹ <span>Title</span></button>
      <section className="binary-port-shell">
        <div className={`binary-game-stage ${state.phase === 'native game running' ? 'is-portrait' : ''}`}>
          <canvas ref={canvasRef} className={state.phase === 'native game running' ? 'is-hidden' : ''} width={WIDTH} height={HEIGHT} aria-label="libpad WebAssembly binary port diagnostics" />
          <canvas
            ref={gameCanvasRef}
            className={state.phase === 'native game running' ? 'is-playing' : 'is-hidden'}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            aria-label="Puzzle and Dragons native browser port"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
        </div>
        <div className="binary-port-controls">
          <button
            id="run-arm64-probe"
            onClick={state.phase === 'native game running' ? () => navigate('/puzzle') : rerunProbe}
            disabled={!runtimeRef.current}
          >
            {state.phase === 'native game running' ? 'Open reconstructed puzzle core' : 'Run verified ARM64 probe'}
          </button>
          <label className="binary-file-control">
            <span>Load APK + optional runtime data</span>
            <input id="libpad-file" type="file" multiple accept=".apk,.so,.dat,.bin,application/vnd.android.package-archive,application/octet-stream" onChange={loadElf} />
          </label>
          <output id="binary-port-state" aria-live="polite">
            {state.phase}{state.elf ? ` · ${state.elf.deepInstructions.toLocaleString()} instructions · ${state.elf.executableStages} executable stages` : ''}
            {state.platform?.files?.some((event) => event.name === 'openat' && event.result === -2 && /\/(data048|data030)\.bin$/.test(event.path))
              ? ' · downloaded data048/data030 not present; native client remains at its offline startup screen'
              : ''}
          </output>
        </div>
      </section>
    </main>
  );
}
