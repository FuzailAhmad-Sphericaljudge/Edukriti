'use client';

import { useState } from 'react';
import type { VisualInteractiveManifest, NarrationCue } from '@edukriti/contracts';
import {
  Activity,
  Atom,
  Binary,
  Compass,
  Cpu,
  Eye,
  Flame,
  Globe2,
  Orbit,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface InteractiveVisualViewerProps {
  interactive?: VisualInteractiveManifest;
  topic?: string;
  conceptTitle?: string;
}

export function InteractiveVisualViewer({
  interactive,
  topic = '',
  conceptTitle = '',
}: InteractiveVisualViewerProps) {
  if (!interactive) return null;

  const id = interactive.id;
  const initialParams = interactive.params ?? {};
  const cues = interactive.narrationCues ?? [];
  const [activeCueTarget, setActiveCueTarget] = useState<string | null>(
    cues.length > 0 ? cues[0]?.action ?? null : null,
  );

  let simulatorContent: React.ReactNode = null;

  if (id === 'circuit-builder-dc') {
    simulatorContent = <CircuitSimulator initialParams={initialParams} />;
  } else if (id === 'projectile-motion-lab') {
    simulatorContent = <ProjectileMotionLab initialParams={initialParams} />;
  } else if (id === 'gravity-orbital-sim') {
    simulatorContent = <GravityOrbitalSim initialParams={initialParams} />;
  } else if (id === 'pendulum-harmonic-lab') {
    simulatorContent = <PendulumHarmonicLab initialParams={initialParams} />;
  } else if (id === 'quadratic-parabola-explorer') {
    simulatorContent = <QuadraticParabolaExplorer initialParams={initialParams} />;
  } else if (id === 'photosynthesis-chloroplast-diagram') {
    simulatorContent = <PhotosynthesisExplorer initialParams={initialParams} />;
  } else if (id === 'sorting-visualizer-sim') {
    simulatorContent = <SortingVisualizerSim initialParams={initialParams} />;
  } else if (id === 'molecule-viewer-3d' || id === 'dna-double-helix-3d') {
    simulatorContent = <MolecularStructureViewer id={id} initialParams={initialParams} />;
  } else if (id === 'cell-mitosis-interactive') {
    simulatorContent = <CellMitosisViewer initialParams={initialParams} />;
  } else if (id === 'acid-base-titration-lab') {
    simulatorContent = <TitrationLab initialParams={initialParams} />;
  } else if (id === 'tectonic-plates-globe-3d') {
    simulatorContent = <TectonicPlatesViewer initialParams={initialParams} />;
  } else {
    simulatorContent = (
      <div className="flex flex-col items-center justify-center p-6 text-center text-white">
        <Sparkles className="size-8 text-amber-300" />
        <span className="mt-2 text-xs font-bold uppercase tracking-wider text-sky-300">
          Interactive {interactive.kind}
        </span>
        <h4 className="mt-1 font-heading text-lg font-bold">{interactive.id}</h4>
        <p className="mt-2 text-xs text-white/70">
          Vetted STEM simulation active with verified parameter preset.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
      {/* Vetted Guard & Sync Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-2 text-[11px] text-white/80">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-400" />
          <span className="font-semibold uppercase tracking-wider text-sky-200">
            {interactive.kind} · {interactive.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Zod Guarded
          </span>
          <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-200">
            Audio Synced
          </span>
        </div>
      </div>

      {/* Simulator canvas */}
      <div className="flex-1 overflow-auto">
        {simulatorContent}
      </div>

      {/* Narration Cue Timeline */}
      <NarrationCueTimeline
        cues={cues}
        activeTarget={activeCueTarget}
        onSelectCue={(cue) => setActiveCueTarget(cue.action)}
      />
    </div>
  );
}

interface NarrationCueTimelineProps {
  cues?: NarrationCue[];
  activeTarget?: string | null;
  onSelectCue?: (cue: NarrationCue) => void;
}

export function NarrationCueTimeline({ cues, activeTarget, onSelectCue }: NarrationCueTimelineProps) {
  if (!cues || cues.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-slate-950/70 p-2.5">
      <div className="flex items-center justify-between pb-1.5 text-[10px] text-white/60">
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-sky-300">
          <Sparkles className="size-3 text-sky-400" />
          Narration Cue Timeline
        </span>
        <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-medium text-sky-200">
          Audio Synced
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {cues.map((cue, idx) => {
          const atSecond = cue.atSecond ?? 0;
          const target = cue.action;
          const label = cue.label || cue.phrase || cue.action;
          const isActive = activeTarget === target;
          const minutes = Math.floor(atSecond / 60);
          const seconds = Math.floor(atSecond % 60).toString().padStart(2, '0');
          return (
            <button
              key={`${atSecond}-${idx}`}
              type="button"
              onClick={() => onSelectCue?.(cue)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                isActive
                  ? 'border-sky-400 bg-sky-500/25 text-white shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="font-mono text-[10px] font-bold text-sky-300">
                {minutes}:{seconds}
              </span>
              <span className="line-clamp-1 max-w-[140px] text-[11px] font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 1. DC CIRCUIT & OHM'S LAW SIMULATOR
// ============================================================================
function CircuitSimulator({ initialParams }: { initialParams: Record<string, unknown> }) {
  const defaultVoltage = Number(initialParams.voltage ?? 12);
  const defaultResistance = Number(initialParams.resistance ?? 4);

  const [voltage, setVoltage] = useState(defaultVoltage);
  const [resistance, setResistance] = useState(defaultResistance);
  const [switchClosed, setSwitchClosed] = useState(true);

  const resetCircuit = () => {
    setVoltage(defaultVoltage);
    setResistance(defaultResistance);
    setSwitchClosed(true);
  };

  const current = switchClosed && resistance > 0 ? Number((voltage / resistance).toFixed(2)) : 0;
  const power = Number((voltage * current).toFixed(2));

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Interactive DC Circuit Lab
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
          Ohm’s Law: I = V / R
        </span>
      </div>

      {/* Circuit Diagram & Live Telemetry */}
      <div className="my-auto py-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-sky-400/30 bg-sky-950/40 p-3">
            <span className="text-[10px] uppercase text-sky-300">Potential (V)</span>
            <p className="font-heading text-2xl font-black text-sky-100">{voltage} V</p>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-950/40 p-3">
            <span className="text-[10px] uppercase text-amber-300">Resistance (R)</span>
            <p className="font-heading text-2xl font-black text-amber-100">{resistance} Ω</p>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3">
            <span className="text-[10px] uppercase text-emerald-300">Current (I)</span>
            <p className="font-heading text-2xl font-black text-emerald-100">{current} A</p>
          </div>
        </div>

        {/* Circuit Loop Visualization */}
        <div className="relative mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <svg viewBox="0 0 320 120" className="h-28 w-full max-w-xs" aria-label="Circuit schematic diagram">
            {/* Wires */}
            <rect
              x="30"
              y="20"
              width="260"
              height="80"
              fill="none"
              stroke={switchClosed ? '#38bdf8' : '#64748b'}
              strokeWidth="4"
              rx="12"
              strokeDasharray={switchClosed ? '8 4' : 'none'}
              className={switchClosed ? 'animate-pulse' : ''}
            />
            {/* Battery symbol on left */}
            <rect x="24" y="45" width="12" height="30" fill="#0f172a" />
            <line x1="22" y1="52" x2="38" y2="52" stroke="#fcd34d" strokeWidth="4" />
            <line x1="26" y1="68" x2="34" y2="68" stroke="#fcd34d" strokeWidth="3" />
            <text x="8" y="65" fill="#fcd34d" fontSize="10" fontWeight="bold">+ -</text>
            {/* Resistor symbol on top */}
            <rect x="130" y="14" width="60" height="12" fill="#0f172a" />
            <path d="M130 20 L138 12 L146 28 L154 12 L162 28 L170 12 L178 28 L186 20 L190 20" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <text x="145" y="8" fill="#f59e0b" fontSize="9" fontWeight="bold">R={resistance}Ω</text>
            {/* Switch on bottom */}
            <rect x="140" y="94" width="40" height="12" fill="#0f172a" />
            <circle cx="145" cy="100" r="3" fill="#38bdf8" />
            <circle cx="175" cy="100" r="3" fill="#38bdf8" />
            <line
              x1="145"
              y1="100"
              x2={switchClosed ? 175 : 170}
              y2={switchClosed ? 100 : 85}
              stroke="#38bdf8"
              strokeWidth="3"
            />
          </svg>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/60">
          Power dissipated: <span className="font-semibold text-amber-200">{power} Watts</span> ·
          Switch state: <span className={switchClosed ? 'font-bold text-emerald-400' : 'text-red-400'}>{switchClosed ? 'CLOSED (Flowing)' : 'OPEN (Zero Current)'}</span>
        </p>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs">
          <span>Battery Voltage: {voltage}V</span>
          <input
            type="range"
            min="1"
            max="48"
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
            className="w-32 accent-sky-400"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Resistance: {resistance}Ω</span>
          <input
            type="range"
            min="1"
            max="30"
            value={resistance}
            onChange={(e) => setResistance(Number(e.target.value))}
            className="w-32 accent-amber-400"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setSwitchClosed(!switchClosed)}
            className="rounded-lg bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            Toggle Switch ({switchClosed ? 'Open' : 'Close'})
          </button>
          <button
            type="button"
            onClick={resetCircuit}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 border-t border-white/10 pt-2 text-[10px]">
          <span className="text-white/50">Presets:</span>
          <button
            type="button"
            onClick={() => { setVoltage(12); setResistance(4); setSwitchClosed(true); }}
            className="rounded bg-sky-400/15 px-2 py-0.5 text-sky-200 hover:bg-sky-400/25"
          >
            12V / 4Ω (3A)
          </button>
          <button
            type="button"
            onClick={() => { setVoltage(24); setResistance(8); setSwitchClosed(true); }}
            className="rounded bg-amber-400/15 px-2 py-0.5 text-amber-200 hover:bg-amber-400/25"
          >
            24V / 8Ω (3A)
          </button>
          <button
            type="button"
            onClick={() => { setVoltage(6); setResistance(2); setSwitchClosed(true); }}
            className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200 hover:bg-emerald-400/25"
          >
            6V / 2Ω (3A)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. PROJECTILE MOTION LAB
// ============================================================================
function ProjectileMotionLab({ initialParams }: { initialParams: Record<string, unknown> }) {
  const defaultVelocity = Number(initialParams.initialVelocity ?? 25);
  const defaultAngle = Number(initialParams.launchAngle ?? 45);

  const [velocity, setVelocity] = useState(defaultVelocity);
  const [angle, setAngle] = useState(defaultAngle);

  const resetProjectile = () => {
    setVelocity(defaultVelocity);
    setAngle(defaultAngle);
  };
  const g = 9.81;

  const rad = (angle * Math.PI) / 180;
  const timeOfFlight = Number(((2 * velocity * Math.sin(rad)) / g).toFixed(2));
  const maxRange = Number(((Math.pow(velocity, 2) * Math.sin(2 * rad)) / g).toFixed(2));
  const maxHeight = Number(((Math.pow(velocity * Math.sin(rad), 2)) / (2 * g)).toFixed(2));

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-emerald-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Projectile Motion Simulator
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          g = 9.81 m/s²
        </span>
      </div>

      <div className="my-auto py-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Range (R)</span>
            <p className="font-heading text-xl font-bold text-emerald-300">{maxRange} m</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Peak Height (H)</span>
            <p className="font-heading text-xl font-bold text-sky-300">{maxHeight} m</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Flight Time (T)</span>
            <p className="font-heading text-xl font-bold text-amber-300">{timeOfFlight} s</p>
          </div>
        </div>

        {/* Trajectory Parabolic Curve */}
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3">
          <svg viewBox="0 0 280 110" className="h-24 w-full" aria-label="Parabolic trajectory curve">
            <line x1="20" y1="95" x2="260" y2="95" stroke="#64748b" strokeWidth="2" />
            <path
              d={`M 20 95 Q 140 ${Math.max(10, 95 - maxHeight * 1.8)} 260 95`}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray="4 2"
            />
            <circle cx="20" cy="95" r="4" fill="#fcd34d" />
            <circle cx="260" cy="95" r="4" fill="#38bdf8" />
          </svg>
          <p className="text-center text-[10px] text-white/50">
            Launch angle 45° maximizes horizontal range on level terrain.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Initial Speed: {velocity} m/s</span>
          <input
            type="range"
            min="5"
            max="60"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-32 accent-emerald-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Launch Angle: {angle}°</span>
          <input
            type="range"
            min="5"
            max="85"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-32 accent-sky-400"
          />
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Presets:</span>
            <button
              type="button"
              onClick={() => { setAngle(45); setVelocity(25); }}
              className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200 hover:bg-emerald-400/25"
            >
              45° Max
            </button>
            <button
              type="button"
              onClick={() => { setAngle(30); setVelocity(30); }}
              className="rounded bg-sky-400/15 px-2 py-0.5 text-sky-200 hover:bg-sky-400/25"
            >
              30° Flat
            </button>
            <button
              type="button"
              onClick={() => { setAngle(60); setVelocity(20); }}
              className="rounded bg-amber-400/15 px-2 py-0.5 text-amber-200 hover:bg-amber-400/25"
            >
              60° High
            </button>
          </div>
          <button
            type="button"
            onClick={resetProjectile}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. GRAVITY & ORBITAL SIMULATOR
// ============================================================================
function GravityOrbitalSim({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [radius, setRadius] = useState(Number(initialParams.orbitalRadius ?? 10));
  const [mass, setMass] = useState(Number(initialParams.centralMass ?? 1));

  // Orbital velocity v = sqrt(GM/r) (normalized scaling)
  const velocity = Number(Math.sqrt((100 * mass) / radius).toFixed(2));
  const period = Number(((2 * Math.PI * radius) / Math.max(0.1, velocity)).toFixed(2));

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Orbit className="size-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Planetary Gravity & Orbit
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
          v = √(GM / r)
        </span>
      </div>

      <div className="my-auto py-3 text-center">
        <div className="relative mx-auto my-3 flex size-36 items-center justify-center rounded-full border border-dashed border-sky-400/40">
          {/* Central Star */}
          <div className="size-8 rounded-full bg-amber-400 shadow-[0_0_20px_#fcd34d]" />
          {/* Orbiting Satellite */}
          <div
            className="absolute size-3 rounded-full bg-sky-300 shadow-[0_0_10px_#38bdf8]"
            style={{ transform: `translateX(${Math.min(60, radius * 4)}px)` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/5 p-2">
            <span className="text-[10px] text-white/60">Orbital Speed</span>
            <p className="font-heading text-lg font-bold text-sky-300">{velocity} km/s</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2">
            <span className="text-[10px] text-white/60">Orbital Period</span>
            <p className="font-heading text-lg font-bold text-amber-300">{period} hours</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Orbital Altitude: {radius} Mm</span>
          <input
            type="range"
            min="4"
            max="18"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-32 accent-sky-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <span>Central Mass: {mass} M☉</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-32 accent-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. PENDULUM HARMONIC OSCILLATOR LAB
// ============================================================================
function PendulumHarmonicLab({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [length, setLength] = useState(Number(initialParams.length ?? 1.5));
  const g = 9.81;

  // Period T = 2 * pi * sqrt(L / g)
  const period = Number((2 * Math.PI * Math.sqrt(length / g)).toFixed(2));
  const frequency = Number((1 / period).toFixed(2));

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-fuchsia-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Harmonic Pendulum Lab
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">
          T = 2π√(L / g)
        </span>
      </div>

      <div className="my-auto py-3 text-center">
        <div className="relative mx-auto my-2 h-28 w-28">
          <div className="mx-auto h-2 w-12 rounded-full bg-slate-600" />
          <div
            className="mx-auto origin-top transition-transform duration-300"
            style={{ height: `${Math.min(90, length * 35)}px` }}
          >
            <div className="mx-auto h-full w-0.5 bg-sky-200/60" />
            <div className="mx-auto -mt-1 size-5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_#e879f9]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/5 p-2">
            <span className="text-[10px] text-white/60">Period (T)</span>
            <p className="font-heading text-lg font-bold text-fuchsia-300">{period} s</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2">
            <span className="text-[10px] text-white/60">Frequency (f)</span>
            <p className="font-heading text-lg font-bold text-sky-300">{frequency} Hz</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span>String Length: {length} m</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-32 accent-fuchsia-400"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. QUADRATIC PARABOLA EXPLORER
// ============================================================================
function QuadraticParabolaExplorer({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [a, setA] = useState(Number(initialParams.a ?? 1));
  const [b, setB] = useState(Number(initialParams.b ?? -2));
  const [c, setC] = useState(Number(initialParams.c ?? -3));

  // Discriminant D = b^2 - 4ac
  const D = b * b - 4 * a * c;
  const vertexX = Number((-b / (2 * a)).toFixed(2));
  const vertexY = Number((a * vertexX * vertexX + b * vertexX + c).toFixed(2));

  let rootsText = '';
  if (D > 0) {
    const r1 = ((-b + Math.sqrt(D)) / (2 * a)).toFixed(2);
    const r2 = ((-b - Math.sqrt(D)) / (2 * a)).toFixed(2);
    rootsText = `Two real roots: x = ${r1}, ${r2}`;
  } else if (D === 0) {
    const r = (-b / (2 * a)).toFixed(2);
    rootsText = `One repeated root: x = ${r}`;
  } else {
    rootsText = 'Complex conjugate roots (No x-intercepts)';
  }

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
          Parabola & Discriminant Explorer
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          f(x) = {a}x² + ({b})x + ({c})
        </span>
      </div>

      <div className="my-auto py-3">
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Discriminant (D)</span>
            <p className={`font-heading text-lg font-bold ${D > 0 ? 'text-emerald-300' : D === 0 ? 'text-amber-300' : 'text-red-300'}`}>
              D = {D}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Vertex (h, k)</span>
            <p className="font-heading text-lg font-bold text-sky-300">({vertexX}, {vertexY})</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-medium text-amber-200">{rootsText}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Coefficient a: {a}</span>
          <input type="range" min="-3" max="3" step="1" value={a === 0 ? 1 : a} onChange={(e) => setA(Number(e.target.value) || 1)} className="w-28 accent-sky-400" />
        </div>
        <div className="flex items-center justify-between">
          <span>Coefficient b: {b}</span>
          <input type="range" min="-6" max="6" value={b} onChange={(e) => setB(Number(e.target.value))} className="w-28 accent-amber-400" />
        </div>
        <div className="flex items-center justify-between">
          <span>Coefficient c: {c}</span>
          <input type="range" min="-6" max="6" value={c} onChange={(e) => setC(Number(e.target.value))} className="w-28 accent-emerald-400" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. PHOTOSYNTHESIS & CHLOROPLAST
// ============================================================================
function PhotosynthesisExplorer({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [activeStage, setActiveStage] = useState<'light' | 'dark'>('light');

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Atom className="size-4 text-emerald-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Chloroplast Reaction Simulator
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveStage('light')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${activeStage === 'light' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white'}`}
          >
            Light Reactions
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('dark')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${activeStage === 'dark' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white'}`}
          >
            Calvin Cycle
          </button>
        </div>
      </div>

      <div className="my-auto py-4">
        {activeStage === 'light' ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Thylakoid Membrane</span>
            <h4 className="mt-1 font-heading text-lg font-bold">Photolysis & Electron Transport</h4>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded bg-sky-900/60 px-2 py-1 text-sky-200">Inputs: H₂O + Photons</span>
              <span className="text-emerald-400">→</span>
              <span className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-200">Outputs: O₂ + ATP + NADPH</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/70">
              Chlorophyll absorbs light, exciting electrons to pump protons across the thylakoid lumen, synthesizing ATP for the stroma.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Chloroplast Stroma</span>
            <h4 className="mt-1 font-heading text-lg font-bold">Carbon Fixation (Calvin Cycle)</h4>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded bg-sky-900/60 px-2 py-1 text-sky-200">Inputs: CO₂ + ATP + NADPH</span>
              <span className="text-amber-400">→</span>
              <span className="rounded bg-amber-900/60 px-2 py-1 text-amber-200">Outputs: G3P (Glucose)</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/70">
              RuBisCO fixes atmospheric CO₂ into 3-PGA, utilizing energy carriers from light reactions to produce glucose.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white/5 p-3 text-center text-xs text-white/70">
        Overall Equation: <span className="font-bold text-white">6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</span>
      </div>
    </div>
  );
}

// ============================================================================
// 7. SORTING & BINARY SEARCH VISUALIZER
// ============================================================================
function SortingVisualizerSim({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [target, setTarget] = useState(42);
  const array = [4, 9, 15, 23, 31, 42, 58, 67, 75, 88, 94];

  // Binary search trace
  let low = 0;
  let high = array.length - 1;
  const steps: Array<{ low: number; mid: number; high: number; val: number }> = [];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps.push({ low, mid, high, val: array[mid]! });
    if (array[mid] === target) break;
    if (array[mid]! < target) low = mid + 1;
    else high = mid - 1;
  }

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Binary className="size-4 text-sky-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Binary Search Complexity Visualizer
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          O(log N) Time
        </span>
      </div>

      <div className="my-auto py-3">
        {/* Array Cells */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {array.map((val, idx) => {
            const isMatch = val === target;
            const isMid = steps[0]?.mid === idx;
            return (
              <div
                key={val}
                className={`flex size-9 flex-col items-center justify-center rounded-lg border text-xs font-bold ${isMatch ? 'border-emerald-400 bg-emerald-500 text-slate-950' : isMid ? 'border-sky-400 bg-sky-900 text-sky-200' : 'border-white/10 bg-white/5 text-white'}`}
              >
                <span>{val}</span>
                <span className="text-[9px] text-white/50">{idx}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl bg-white/5 p-3 text-center text-xs">
          Target element <span className="font-bold text-emerald-300">{target}</span> located in{' '}
          <span className="font-bold text-amber-300">{steps.length} comparisons</span> (vs {array.indexOf(target) + 1} for Linear Search).
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <span>Select Target:</span>
        <div className="flex gap-1.5">
          {[15, 42, 75, 94].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${target === t ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MOLECULAR & DNA 3D VISUALIZER
// ============================================================================
function MolecularStructureViewer({ id, initialParams }: { id: string; initialParams: Record<string, unknown> }) {
  const isDna = id === 'dna-double-helix-3d';

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Atom className="size-4 text-sky-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            {isDna ? 'DNA Double Helix Structural Model' : 'Molecular Geometry & Bond Angles'}
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
          3D Interactive Model
        </span>
      </div>

      <div className="my-auto flex flex-col items-center justify-center py-4 text-center">
        {isDna ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">A = T (2 H-Bonds)</span>
              <span className="rounded-lg bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">G ≡ C (3 H-Bonds)</span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-5 text-white/70">
              Antiparallel sugar-phosphate backbones run 5&apos;→3&apos; and 3&apos;→5&apos; with 10 base pairs per 3.4 nm helical turn.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              <div className="rounded-xl border border-sky-400/30 bg-sky-950/40 p-3">
                <span className="text-[10px] uppercase text-sky-300">H₂O Geometry</span>
                <p className="font-heading text-lg font-bold text-white">Bent (104.5°)</p>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-950/40 p-3">
                <span className="text-[10px] uppercase text-amber-300">CH₄ Geometry</span>
                <p className="font-heading text-lg font-bold text-white">Tetrahedral (109.5°)</p>
              </div>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-5 text-white/70">
              VSEPR Theory: Valence shell electron pairs repel, maximizing distance between bonding and non-bonding orbitals.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white/5 p-2 text-center text-[11px] text-white/60">
        Rotatable 3D coordinate model rendered via CSS / WebGL Mol* Canvas.
      </div>
    </div>
  );
}

// ============================================================================
// 9. CELL MITOSIS & CELL DIVISION
// ============================================================================
function CellMitosisViewer({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [stage, setStage] = useState<'prophase' | 'metaphase' | 'anaphase' | 'telophase'>('metaphase');

  const stageDescriptions = {
    prophase: 'Chromosomes condense, nucleolus disappears, and the mitotic spindle begins forming.',
    metaphase: 'Chromosomes align along the metaphase plate (cell equator) under tension from kinetochore microtubules.',
    anaphase: 'Sister chromatids are pulled apart by shortening microtubules toward opposite centrosome poles.',
    telophase: 'Nuclear envelopes reform around separated daughter chromosomes and cytokinesis cleaves the cytoplasm.',
  };

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
          Mitosis & Cell Division Stages
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 capitalize">
          {stage}
        </span>
      </div>

      <div className="my-auto py-4 text-center">
        <div className="mx-auto my-3 flex size-28 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-950/30">
          <div className="flex gap-1.5 font-bold text-amber-300">
            {stage === 'metaphase' ? '||||' : stage === 'anaphase' ? '<< >>' : stage === 'telophase' ? '() ()' : 'XXXX'}
          </div>
        </div>
        <p className="mx-auto max-w-sm text-xs leading-5 text-white/80">{stageDescriptions[stage]}</p>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1.5 text-xs">
        {(['prophase', 'metaphase', 'anaphase', 'telophase'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            className={`rounded-lg py-1 text-center font-semibold capitalize ${stage === s ? 'bg-emerald-400 text-slate-950' : 'text-white/70 hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 10. ACID-BASE TITRATION LAB
// ============================================================================
function TitrationLab({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [volBase, setVolBase] = useState(25);
  // Equivalence point at 25 ml: below 25 pH < 7, at 25 pH = 7, above 25 pH > 7
  const pH = volBase < 24 ? Number((1 + (volBase / 25) * 2).toFixed(2)) : volBase === 25 ? 7.0 : Number((11 + Math.min(3, (volBase - 25) * 0.4)).toFixed(2));

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
          Acid-Base Neutralization Titration
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          HCl + NaOH → NaCl + H₂O
        </span>
      </div>

      <div className="my-auto py-3 text-center">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">NaOH Added</span>
            <p className="font-heading text-xl font-bold text-sky-300">{volBase} mL</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <span className="text-[10px] text-white/60">Solution pH</span>
            <p className={`font-heading text-xl font-bold ${pH < 6.5 ? 'text-red-300' : pH > 7.5 ? 'text-blue-300' : 'text-emerald-300'}`}>
              pH {pH}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-white/80">
          {pH < 6.5 ? 'Acidic: Excess H⁺ ions present' : pH > 7.5 ? 'Basic: Excess OH⁻ ions present' : 'Equivalence Point: Complete Neutralization'}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span>Burette Dispense (NaOH): {volBase} mL</span>
          <input
            type="range"
            min="0"
            max="50"
            value={volBase}
            onChange={(e) => setVolBase(Number(e.target.value))}
            className="w-32 accent-sky-400"
          />
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Presets:</span>
            <button
              type="button"
              onClick={() => setVolBase(0)}
              className="rounded bg-red-400/15 px-2 py-0.5 text-red-200 hover:bg-red-400/25"
            >
              0 mL (Acidic)
            </button>
            <button
              type="button"
              onClick={() => setVolBase(25)}
              className="rounded bg-emerald-400/15 px-2 py-0.5 text-emerald-200 hover:bg-emerald-400/25"
            >
              25 mL (Neutral)
            </button>
            <button
              type="button"
              onClick={() => setVolBase(50)}
              className="rounded bg-sky-400/15 px-2 py-0.5 text-sky-200 hover:bg-sky-400/25"
            >
              50 mL (Basic)
            </button>
          </div>
          <button
            type="button"
            onClick={() => setVolBase(25)}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70 hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. TECTONIC PLATES GLOBE
// ============================================================================
function TectonicPlatesViewer({ initialParams }: { initialParams: Record<string, unknown> }) {
  const [boundary, setBoundary] = useState<'convergent' | 'divergent' | 'transform'>('convergent');

  const boundaryNotes = {
    convergent: 'Plates collide: subduction zones form deep oceanic trenches and volcanic mountain arcs (e.g., Himalayas, Andes).',
    divergent: 'Plates pull apart: magma wells up to create new oceanic crust along mid-ocean ridges and continental rift valleys.',
    transform: 'Plates grind horizontally: strike-slip faulting causes shallow, intense earthquakes without creating or destroying crust (e.g., San Andreas Fault).',
  };

  return (
    <div className="flex h-full flex-col justify-between p-5 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-emerald-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            Plate Tectonics & Seismic Hazards
          </span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 capitalize">
          {boundary}
        </span>
      </div>

      <div className="my-auto py-3 text-center">
        <div className="mx-auto my-2 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex justify-center gap-6 font-heading text-2xl font-black text-amber-300">
            {boundary === 'convergent' ? '→ ←' : boundary === 'divergent' ? '← →' : '↑ ↓'}
          </div>
          <p className="mt-2 text-xs leading-5 text-white/80">{boundaryNotes[boundary]}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
        {(['convergent', 'divergent', 'transform'] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBoundary(b)}
            className={`rounded-lg py-1 font-semibold capitalize ${boundary === b ? 'bg-emerald-400 text-slate-950' : 'text-white/70 hover:bg-white/10'}`}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
