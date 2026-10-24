'use client';

import React, { useState } from 'react';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement } from '@edukriti/visuals';
import { Eye, Info, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';

interface Diagram2DFallbackProps {
  scene: Scene3DDefinition;
  params: Record<string, unknown>;
  onElementClick?: (element: ProceduralMeshElement) => void;
  selectedElementId?: string | null;
  quizActive?: boolean;
  quizTargetPartId?: string | null;
  onQuizAnswer?: (elementId: string) => void;
}

export function Diagram2DFallback({
  scene,
  params,
  onElementClick,
  selectedElementId,
  quizActive,
  onQuizAnswer,
}: Diagram2DFallbackProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const geo: SceneGeometryData = scene.generateGeometry(params);

  // 2D projection bounds
  const scale = 26; // pixels per unit
  const centerX = 240;
  const centerY = 190;

  const handleSelect = (el: ProceduralMeshElement) => {
    onElementClick?.(el);
    if (quizActive) {
      onQuizAnswer?.(el.id);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-slate-950 p-4 text-slate-100">
      {/* 2D Fallback Notification Banner */}
      <div className="mb-2 flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-950/40 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Info className="size-3.5 text-sky-400" />
          <span className="font-semibold text-sky-200">2D Diagram Mode</span>
          <span className="text-[11px] text-sky-300/80">
            (Optimized for low power / non-WebGL environments)
          </span>
        </div>
        <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
          Interactive Vector Canvas
        </span>
      </div>

      {/* SVG Orthographic Projection Stage */}
      <div className="relative flex flex-1 items-center justify-center">
        <svg
          viewBox="0 0 480 380"
          className="h-full w-full max-h-[420px] select-none"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="480" height="380" fill="url(#grid-pattern)" />

          {/* Render Elements projected onto X-Y / X-Z */}
          {geo.elements.map((el) => {
            const px = centerX + el.position[0] * scale;
            const py = centerY - el.position[1] * scale + el.position[2] * (scale * 0.3); // Isometric slant
            const isSelected = selectedElementId === el.id;
            const isHovered = hoveredId === el.id;

            if (el.type === 'ring') {
              const r = (el.radius ?? 1) * scale;
              return (
                <circle
                  key={el.id}
                  cx={px}
                  cy={py}
                  r={Math.max(6, r)}
                  fill="none"
                  stroke={isSelected ? '#f43f5e' : isHovered ? '#38bdf8' : el.color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray="4 4"
                  opacity={el.opacity ?? 0.6}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredId(el.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(el)}
                />
              );
            }

            if (el.type === 'cylinder') {
              const h = (el.height ?? 1) * scale;
              return (
                <line
                  key={el.id}
                  x1={px}
                  y1={py - h / 2}
                  x2={px}
                  y2={py + h / 2}
                  stroke={isSelected ? '#f43f5e' : isHovered ? '#38bdf8' : el.color}
                  strokeWidth={Math.max(4, (el.radius ?? 0.2) * scale * 2)}
                  strokeLinecap="round"
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredId(el.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(el)}
                />
              );
            }

            // Default Sphere / Box node
            const radius = Math.max(7, ((el.radius ?? 0.4) * scale));
            return (
              <g
                key={el.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(el.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(el)}
              >
                <circle
                  cx={px}
                  cy={py}
                  r={radius}
                  fill={el.color}
                  stroke={isSelected ? '#f43f5e' : isHovered ? '#ffffff' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all"
                />
                {(isHovered || isSelected) && (
                  <text
                    x={px}
                    y={py - radius - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow"
                  >
                    {el.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Educational Summary Drawer */}
      <div className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Sparkles className="size-3.5" />
            <span className="font-semibold">{scene.title}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Tap any organelle, atom, or orbital to inspect properties
          </span>
        </div>
      </div>
    </div>
  );
}

