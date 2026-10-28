'use client';

import React from 'react';
import { InstrumentType } from '@edukriti/lab';

interface InstrumentSvgViewerProps {
  type: InstrumentType;
  value: number;
  maxRange?: number;
  unit: string;
  secondaryValue?: number;
  highlightWarning?: boolean;
}

export function InstrumentSvgViewer({
  type,
  value,
  maxRange = 5,
  unit,
  secondaryValue,
  highlightWarning = false,
}: InstrumentSvgViewerProps) {
  // 1. Analog Voltmeter / Ammeter Gauge
  if (type === 'voltmeter' || type === 'ammeter') {
    const isVoltmeter = type === 'voltmeter';
    const clampedVal = Math.max(0, Math.min(maxRange, Math.abs(value)));
    // Gauge sweep from -45 deg to +45 deg (total 90 deg)
    const angle = -45 + (clampedVal / maxRange) * 90;
    const isReverse = value < 0;

    return (
      <div className="flex flex-col items-center bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-100">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
          {isVoltmeter ? 'DC Voltmeter' : 'DC Ammeter'}
        </div>
        <svg viewBox="0 0 160 110" className="w-48 h-32 overflow-visible">
          {/* Bezel */}
          <rect x="10" y="10" width="140" height="90" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Scale Arc */}
          <path d="M 30 75 A 60 60 0 0 1 130 75" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
          {/* Ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const tickAngle = (-45 + frac * 90) * (Math.PI / 180);
            const r1 = 58;
            const r2 = 66;
            const cx = 80;
            const cy = 85;
            const x1 = cx + r1 * Math.sin(tickAngle);
            const y1 = cy - r1 * Math.cos(tickAngle);
            const x2 = cx + r2 * Math.sin(tickAngle);
            const y2 = cy - r2 * Math.cos(tickAngle);
            const tickVal = (frac * maxRange).toFixed(isVoltmeter ? 1 : 2);
            return (
              <g key={idx}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f8fafc" strokeWidth={idx % 2 === 0 ? "2" : "1"} />
                <text x={x2 + (frac < 0.5 ? -6 : frac > 0.5 ? 6 : 0)} y={y2 - 2} fill="#94a3b8" fontSize="7" textAnchor="middle">
                  {tickVal}
                </text>
              </g>
            );
          })}
          {/* Center Pivot */}
          <circle cx="80" cy="85" r="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
          {/* Needle */}
          <line
            x1="80"
            y1="85"
            x2={80 + 55 * Math.sin((isReverse ? -55 : angle) * (Math.PI / 180))}
            y2={85 - 55 * Math.cos((isReverse ? -55 : angle) * (Math.PI / 180))}
            stroke={highlightWarning || isReverse ? "#ef4444" : "#38bdf8"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Badge */}
          <circle cx="80" cy="45" r="12" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="80" y="49" fill={isVoltmeter ? "#38bdf8" : "#fbbf24"} fontSize="11" fontWeight="bold" textAnchor="middle">
            {isVoltmeter ? 'V' : 'A'}
          </text>
        </svg>
        <div className="mt-2 text-sm font-mono font-bold text-sky-400">
          {isReverse ? `Reverse Polarity (-${Math.abs(value).toFixed(2)} ${unit})` : `${value.toFixed(2)} ${unit}`}
        </div>
      </div>
    );
  }

  // 2. Vernier Caliper Scale
  if (type === 'vernier_caliper') {
    const msr = Math.floor(value * 10) / 10;
    const vsd = Math.round((value - msr) / 0.01);
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-100 flex flex-col items-center">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
          Vernier Caliper Window (LC = 0.01 cm)
        </div>
        <svg viewBox="0 0 280 80" className="w-full max-w-sm h-24">
          {/* Main Scale bar */}
          <rect x="10" y="10" width="260" height="30" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="3" />
          {/* Main scale millimeter ticks */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = 20 + i * 10;
            const isCm = i % 10 === 0;
            return (
              <g key={i}>
                <line x1={x} y1="40" x2={x} y2={isCm ? "22" : "30"} stroke="#e2e8f0" strokeWidth={isCm ? "1.5" : "1"} />
                {isCm && (
                  <text x={x} y="19" fill="#94a3b8" fontSize="8" textAnchor="middle">
                    {i / 10 + Math.floor(msr)}
                  </text>
                )}
              </g>
            );
          })}
          {/* Sliding Vernier Scale Plate */}
          <g transform={`translate(${Math.min(100, Math.max(0, (value % 1) * 70))}, 38)`}>
            <rect x="20" y="0" width="100" height="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="2" opacity="0.95" />
            {Array.from({ length: 11 }).map((_, v) => {
              const vx = 25 + v * 9;
              const isCoinciding = v === vsd;
              return (
                <g key={v}>
                  <line
                    x1={vx}
                    y1="0"
                    x2={vx}
                    y2="10"
                    stroke={isCoinciding ? "#ef4444" : "#38bdf8"}
                    strokeWidth={isCoinciding ? "2" : "1"}
                  />
                  <text x={vx} y="20" fill={isCoinciding ? "#ef4444" : "#94a3b8"} fontSize="6.5" textAnchor="middle">
                    {v}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="mt-2 text-xs font-mono text-slate-300">
          MSR = <span className="text-sky-400 font-bold">{msr.toFixed(1)} cm</span> | Coinciding Vernier Div = <span className="text-rose-400 font-bold">{vsd}</span>
        </div>
      </div>
    );
  }

  // 3. Screw Gauge / Micrometer
  if (type === 'screw_gauge') {
    const psr = Math.floor(value * 10); // mm
    const csd = Math.round(((value * 10) - psr) / 0.01);
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-100 flex flex-col items-center">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
          Micrometer Screw Gauge (LC = 0.01 mm)
        </div>
        <svg viewBox="0 0 240 90" className="w-full max-w-sm h-24">
          {/* Main Barrel */}
          <rect x="20" y="25" width="110" height="40" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="2" />
          <line x1="20" y1="45" x2="130" y2="45" stroke="#f8fafc" strokeWidth="1.5" />
          {/* Pitch mm graduations */}
          {Array.from({ length: 10 }).map((_, i) => {
            const x = 30 + i * 10;
            return (
              <g key={i}>
                <line x1={x} y1="45" x2={x} y2="35" stroke="#e2e8f0" strokeWidth="1" />
                <text x={x} y="32" fill="#94a3b8" fontSize="7" textAnchor="middle">{i}</text>
              </g>
            );
          })}
          {/* Rotating Thimble */}
          <rect x="130" y="15" width="85" height="60" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" rx="3" />
          {/* Circular scale marks */}
          {[-2, -1, 0, 1, 2].map((offset) => {
            const markVal = (csd + offset + 100) % 100;
            const y = 45 - offset * 9;
            const isZeroLine = offset === 0;
            return (
              <g key={offset}>
                <line x1="130" y1={y} x2="145" y2={y} stroke={isZeroLine ? "#ef4444" : "#94a3b8"} strokeWidth={isZeroLine ? "2" : "1"} />
                <text x="152" y={y + 3} fill={isZeroLine ? "#ef4444" : "#cbd5e1"} fontSize="7.5" fontWeight={isZeroLine ? "bold" : "normal"}>
                  {markVal}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 text-xs font-mono text-slate-300">
          PSR = <span className="text-sky-400 font-bold">{psr} mm</span> | Circular Division = <span className="text-rose-400 font-bold">{csd}</span>
        </div>
      </div>
    );
  }

  // 4. Burette / Measuring Cylinder Liquid Meniscus
  if (type === 'burette' || type === 'measuring_cylinder') {
    const isBurette = type === 'burette';
    const fillPercent = Math.max(5, Math.min(95, isBurette ? (1 - value / 50) * 85 + 10 : (value / 100) * 80 + 10));
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-100 flex flex-col items-center">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
          {isBurette ? 'Burette Meniscus (LC 0.1 mL)' : 'Graduated Cylinder (LC 1 mL)'}
        </div>
        <svg viewBox="0 0 100 160" className="w-28 h-40">
          {/* Glass cylinder outline */}
          <rect x="25" y="10" width="50" height="140" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" opacity="0.8" />
          {/* Liquid level */}
          <rect x="27" y={150 - (fillPercent * 1.3)} width="46" height={fillPercent * 1.3} fill="#0284c7" opacity="0.4" />
          {/* Curved concave meniscus */}
          <path
            d={`M 27 ${150 - (fillPercent * 1.3)} Q 50 ${150 - (fillPercent * 1.3) + 5} 73 ${150 - (fillPercent * 1.3)}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          {/* Scale ticks */}
          {Array.from({ length: 9 }).map((_, idx) => {
            const y = 25 + idx * 14;
            return (
              <g key={idx}>
                <line x1="25" y1={y} x2="35" y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x="20" y={y + 3} fill="#94a3b8" fontSize="6.5" textAnchor="end">
                  {isBurette ? (idx * 5) : 100 - (idx * 10)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-1 text-xs font-mono font-bold text-sky-400">
          Volume: {value.toFixed(1)} {unit}
        </div>
      </div>
    );
  }

  // 5. Default Digital Readout
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-100 flex flex-col items-center">
      <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
        {type.replace(/_/g, ' ')}
      </div>
      <div className="text-2xl font-mono font-bold text-emerald-400 my-2">
        {value.toFixed(2)} {unit}
      </div>
    </div>
  );
}

