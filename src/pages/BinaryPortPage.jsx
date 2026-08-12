import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Arm64Runtime } from '../binary-port/arm64Runtime.js';

const WIDTH = 900;
const HEIGHT = 560;

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
    ['Current decoder', 'Constructor reaches raw syscall boundary'],
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
      ['PT_LOAD segments', String(state.elf.loadSegments)],
      ['Mapped guest end', `0x${state.elf.maximumAddress.toString(16)}`],
      ['Custom protected section', state.elf.customSectionBytes ? `${state.elf.customSectionBytes.toLocaleString()} bytes` : 'not found'],
      ['Resident probe', state.elf.probePassed ? 'executed from loaded image' : 'not executed'],
      ['Constructor boundary', state.elf.constructorReached ? `${state.elf.constructorSteps} instructions → openat(${state.elf.firstPath})` : 'not reached'],
    ];
    rows.forEach(([label, value], index) => {
      const y = 330 + index * 27;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7f8da3';
      ctx.font = '600 11px "Noto Sans", sans-serif';
      ctx.fillText(label, 49, y);
      ctx.fillStyle = index >= 5 && (state.elf.probePassed || state.elf.constructorReached) ? '#76e19b' : '#e2e8f0';
      ctx.fillText(value, 245, y);
    });
  } else {
    ctx.fillStyle = '#dce5f0';
    ctx.font = '700 17px "Barlow Condensed", sans-serif';
    ctx.fillText('Load the extracted arm64-v8a/libpad.so to map its real PT_LOAD segments.', 49, 345);
    ctx.fillStyle = '#8c9ab0';
    ctx.font = '500 12px "Noto Sans", sans-serif';
    ctx.fillText('The browser keeps the file local. It is copied into Wasm linear memory and is not uploaded.', 49, 377);
    ctx.fillText('The embedded two-instruction probe above comes from this exact APK and validates the execution boundary.', 49, 404);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Next milestone: syscall traps, virtual /proc/self/maps, and the first decrypted mmap module.', 49, 465);
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
  const runtimeRef = useRef(null);
  const stateRef = useRef(null);
  const [state, setState] = useState({ phase: 'booting', probe: null, elf: null, error: null });
  stateRef.current = state;

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

    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'diagnostic canvas: origin top-left, +x right, +y down',
      ...stateRef.current,
    });
    window.advanceTime = () => {};
    return () => {
      disposed = true;
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, []);

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
    const file = event.target.files?.[0];
    const runtime = runtimeRef.current;
    if (!file || !runtime) return;
    setState((current) => ({ ...current, phase: 'mapping elf', error: null }));
    try {
      const buffer = await file.arrayBuffer();
      const elf = runtime.loadElf(buffer);
      const probe = runtime.runLibpadProbe(true);
      const constructor = runtime.runToFirstSyscall();
      const custom = elf.customSections.find((section) => section.type === 0x80000000) || elf.customSections[0];
      setState({
        phase: probe.passed ? 'elf mapped' : 'probe failed',
        probe,
        error: probe.passed ? null : 'The loaded image did not contain the expected libpad probe at VA 0x3323c0.',
        elf: {
          name: file.name,
          fileBytes: file.size,
          loadSegments: elf.loadSegments.length,
          maximumAddress: elf.maximumAddress,
          customSectionBytes: custom?.size || 0,
          probePassed: probe.passed,
          constructorReached: constructor.reached && constructor.number === 56,
          constructorSteps: constructor.steps,
          firstPath: constructor.path,
        },
      });
    } catch (error) {
      setState((current) => ({ ...current, phase: 'error', error: error.message }));
    }
  };

  return (
    <main className="binary-port-page">
      <button className="puzzle-back" onClick={() => navigate('/')} aria-label="Return to title">‹ <span>Title</span></button>
      <section className="binary-port-shell">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="libpad WebAssembly binary port diagnostics" />
        <div className="binary-port-controls">
          <button id="run-arm64-probe" onClick={rerunProbe} disabled={!runtimeRef.current}>Run verified ARM64 probe</button>
          <label className="binary-file-control">
            <span>Load extracted libpad.so</span>
            <input id="libpad-file" type="file" accept=".so,application/octet-stream" onChange={loadElf} />
          </label>
        </div>
      </section>
    </main>
  );
}
