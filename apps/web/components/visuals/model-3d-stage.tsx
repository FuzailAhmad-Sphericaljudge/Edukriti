'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D } from '@edukriti/visuals';
import { isWebGLAvailable, getSafePixelRatio, prefersReducedMotion } from './webgl-detector';
import { Diagram2DFallback } from './diagram-2d-fallback';
import {
  RotateCcw,
  Sparkles,
  Layers,
  Ruler,
  HelpCircle,
  Eye,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';

interface Model3DStageProps {
  scene: Scene3DDefinition;
  initialParams?: Record<string, unknown>;
  currentTime?: number;
  isNarrationPlaying?: boolean;
  onQuizScore?: (isCorrect: boolean, quizId: string) => void;
  className?: string;
}

export function Model3DStage({
  scene,
  initialParams = {},
  currentTime = 0,
  isNarrationPlaying = false,
  onQuizScore,
  className = '',
}: Model3DStageProps) {
  const [params, setParams] = useState<Record<string, unknown>>({
    ...scene.defaultParams,
    ...initialParams,
  });

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [force2DMode, setForce2DMode] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<'inspect' | 'measure' | 'quiz' | 'exploded' | 'step'>('inspect');
  const [selectedElement, setSelectedElement] = useState<ProceduralMeshElement | null>(null);
  const [isPauseAndExplore, setIsPauseAndExplore] = useState<boolean>(false);

  // Measurement tool state
  const [measurePoints, setMeasurePoints] = useState<ProceduralMeshElement[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [measuredAngle, setMeasuredAngle] = useState<number | null>(null);

  // Quiz-on-the-model state
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Check WebGL availability on mount
  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  const geo: SceneGeometryData = useMemo(() => {
    return scene.generateGeometry(params);
  }, [scene, params]);

  // Teacher Narration Cue Sync
  const activeCue = useMemo(() => {
    if (isPauseAndExplore || !scene.narrationCues || scene.narrationCues.length === 0) {
      return null;
    }
    const matching = [...scene.narrationCues]
      .filter((cue) => cue.timeInSeconds <= currentTime)
      .sort((a, b) => b.timeInSeconds - a.timeInSeconds)[0];
    return matching ?? scene.narrationCues[0];
  }, [scene.narrationCues, currentTime, isPauseAndExplore]);

  // Measurement calculation
  const handleElementSelect = (el: ProceduralMeshElement) => {
    setSelectedElement(el);

    if (interactionMode === 'measure') {
      const nextPoints = [...measurePoints, el].slice(-3);
      setMeasurePoints(nextPoints);

      if (nextPoints.length === 2 && nextPoints[0] && nextPoints[1]) {
        const p1 = nextPoints[0].position;
        const p2 = nextPoints[1].position;
        const dist = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2 + (p2[2] - p1[2]) ** 2);
        setMeasuredDistance(dist);
        setMeasuredAngle(null);
      } else if (nextPoints.length === 3 && nextPoints[0] && nextPoints[1] && nextPoints[2]) {
        const p1 = nextPoints[0].position;
        const vertex = nextPoints[1].position;
        const p3 = nextPoints[2].position;

        const v1 = [p1[0] - vertex[0], p1[1] - vertex[1], p1[2] - vertex[2]];
        const v2 = [p3[0] - vertex[0], p3[1] - vertex[1], p3[2] - vertex[2]];

        const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
        const mag1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2);
        const mag2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2 + v2[2] ** 2);

        if (mag1 > 0 && mag2 > 0) {
          const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
          const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
          setMeasuredAngle(angleDeg);
        }
      }
    } else if (interactionMode === 'quiz') {
      handleQuizAnswer(el.id);
    }
  };

  const handleQuizAnswer = (clickedId: string) => {
    const currentQuiz = scene.quizPrompts[activeQuizIndex];
    if (!currentQuiz) return;

    const isMatch =
      clickedId.toLowerCase().includes(currentQuiz.targetPartId.toLowerCase()) ||
      currentQuiz.targetPartId.toLowerCase().includes(clickedId.toLowerCase());

    if (isMatch) {
      setQuizFeedback({ isCorrect: true, message: currentQuiz.successFeedback });
      onQuizScore?.(true, currentQuiz.id);
    } else {
      setQuizFeedback({ isCorrect: false, message: `Not quite! Hint: ${currentQuiz.hint}` });
      onQuizScore?.(false, currentQuiz.id);
    }
  };

  const handleParamChange = (key: string, val: unknown) => {
    setParams((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleReset = () => {
    setParams(scene.defaultParams);
    setSelectedElement(null);
    setMeasurePoints([]);
    setMeasuredDistance(null);
    setMeasuredAngle(null);
    setQuizFeedback(null);
  };

  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl ${className}`}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-emerald-400" />
          <span className="font-heading text-xs font-bold tracking-wide text-sky-200">
            {scene.title}
          </span>
          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
            {scene.subject.toUpperCase()}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Pause & Explore toggle */}
          <button
            type="button"
            onClick={() => setIsPauseAndExplore(!isPauseAndExplore)}
            title="Pause and Explore Mode"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
              isPauseAndExplore
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isPauseAndExplore ? <Play className="size-3 text-amber-300" /> : <Pause className="size-3 text-slate-300" />}
            <span>{isPauseAndExplore ? 'Exploring' : 'Sync Mode'}</span>
          </button>

          {/* 3D vs 2D Diagram Toggle */}
          <button
            type="button"
            onClick={() => setForce2DMode(!force2DMode)}
            title="Toggle 2D Diagram / 3D Canvas"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <Eye className="size-3" />
            <span>{force2DMode ? '3D Stage' : '2D Diagram'}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset Model"
            className="inline-flex size-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar: Interaction Modes */}
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/40 px-4 py-1.5 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInteractionMode('inspect')}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              interactionMode === 'inspect' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inspect & Orbit
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode('measure')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              interactionMode === 'measure' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="size-3" /> Measure
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode('quiz')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              interactionMode === 'quiz' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="size-3" /> Quiz on Model
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode('exploded')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition ${
              interactionMode === 'exploded' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="size-3" /> Exploded View
          </button>
        </div>

        {/* Live teacher cue badge */}
        {activeCue && !isPauseAndExplore && (
          <div className="flex items-center gap-1 text-[11px] text-sky-300">
            <span className="size-1.5 animate-pulse rounded-full bg-sky-400" />
            <span className="max-w-[280px] truncate">{activeCue.caption}</span>
          </div>
        )}
      </div>

      {/* 3. Main Stage Content */}
      <div className="relative flex-1">
        {!hasWebGL || force2DMode ? (
          <Diagram2DFallback
            scene={scene}
            params={params}
            selectedElementId={selectedElement?.id ?? null}
            onElementClick={handleElementSelect}
            quizActive={interactionMode === 'quiz'}
            quizTargetPartId={scene.quizPrompts[activeQuizIndex]?.targetPartId ?? null}
            onQuizAnswer={handleQuizAnswer}
          />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between p-4">
            {/* SVG / Vector Canvas with Perspective Projection */}
            <div className="relative flex flex-1 items-center justify-center">
              <svg viewBox="0 0 540 400" className="h-full w-full select-none">
                <defs>
                  <radialGradient id="stage-bg-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0369a1" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="540" height="400" fill="url(#stage-bg-glow)" />

                {/* 3D Elements rendered with depth ordering */}
                {geo.elements.map((el) => {
                  const scale = 28;
                  const cx = 270 + el.position[0] * scale;
                  const cy = 200 - el.position[1] * scale + el.position[2] * (scale * 0.35);
                  const isSelected = selectedElement?.id === el.id;
                  const isHighlighted = activeCue?.highlightPartId === el.id;

                  if (el.type === 'ring') {
                    const r = (el.radius ?? 1) * scale;
                    return (
                      <ellipse
                        key={el.id}
                        cx={cx}
                        cy={cy}
                        rx={Math.max(8, r)}
                        ry={Math.max(4, r * 0.45)}
                        fill="none"
                        stroke={isSelected || isHighlighted ? '#f43f5e' : el.color}
                        strokeWidth={isSelected || isHighlighted ? 2.5 : 1.2}
                        strokeDasharray="4 4"
                        opacity={el.opacity ?? 0.6}
                        className="cursor-pointer transition-all"
                        onClick={() => handleElementSelect(el)}
                      />
                    );
                  }

                  if (el.type === 'cylinder') {
                    const h = (el.height ?? 1) * scale;
                    return (
                      <line
                        key={el.id}
                        x1={cx}
                        y1={cy - h / 2}
                        x2={cx}
                        y2={cy + h / 2}
                        stroke={isSelected || isHighlighted ? '#f43f5e' : el.color}
                        strokeWidth={Math.max(4, (el.radius ?? 0.15) * scale * 2)}
                        strokeLinecap="round"
                        className="cursor-pointer transition-all"
                        onClick={() => handleElementSelect(el)}
                      />
                    );
                  }

                  const r = Math.max(7, (el.radius ?? 0.4) * scale);
                  return (
                    <g
                      key={el.id}
                      className="cursor-pointer transition-transform hover:scale-110"
                      onClick={() => handleElementSelect(el)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={el.color}
                        stroke={isSelected || isHighlighted ? '#ffffff' : 'rgba(0,0,0,0.5)'}
                        strokeWidth={isSelected || isHighlighted ? 3 : 1.5}
                        className="transition-all"
                      />
                      {(isSelected || isHighlighted) && (
                        <text
                          x={cx}
                          y={cy - r - 6}
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

            {/* Selected Element Info Card Overlay */}
            {selectedElement && (
              <div className="absolute bottom-4 left-4 z-10 max-w-sm rounded-2xl border border-sky-500/30 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                  <div className="font-heading text-xs font-bold text-sky-200">
                    {selectedElement.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedElement(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-400">Position (x,y,z):</span>{' '}
                  [{selectedElement.position.map((p) => p.toFixed(2)).join(', ')}]
                </div>
                {selectedElement.userData && (
                  <div className="mt-1 space-y-0.5 text-[11px] text-slate-300">
                    {Object.entries(selectedElement.userData).map(([k, v]) => (
                      <div key={k}>
                        <span className="capitalize text-slate-400">{k}:</span> {String(v)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Measurement Feedback Banner */}
            {interactionMode === 'measure' && (
              <div className="absolute top-4 left-4 z-10 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-3 text-xs shadow-xl backdrop-blur-md">
                <div className="font-semibold text-amber-300">3D Measurement Tool</div>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  Tap 2 points for Euclidean distance; tap 3 points for angular vertex.
                </p>
                {measuredDistance !== null && (
                  <div className="mt-1.5 rounded-lg bg-white/5 p-1.5 font-mono text-[11px] text-emerald-300">
                    Distance d = {measuredDistance.toFixed(3)} units
                  </div>
                )}
                {measuredAngle !== null && (
                  <div className="mt-1 rounded-lg bg-white/5 p-1.5 font-mono text-[11px] text-sky-300">
                    Angle θ = {measuredAngle.toFixed(1)}°
                  </div>
                )}
              </div>
            )}

            {/* Quiz on the Model Overlay */}
            {interactionMode === 'quiz' && scene.quizPrompts.length > 0 && (
              <div className="absolute top-4 right-4 z-10 max-w-sm rounded-2xl border border-purple-500/30 bg-slate-900/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">Quiz on Model</span>
                  <span className="text-[10px] text-slate-400">
                    Question {activeQuizIndex + 1} of {scene.quizPrompts.length}
                  </span>
                </div>
                <p className="mt-1 font-medium text-slate-100">
                  {scene.quizPrompts[activeQuizIndex]?.question}
                </p>

                {quizFeedback && (
                  <div
                    className={`mt-2 flex items-start gap-1.5 rounded-xl p-2 text-[11px] ${
                      quizFeedback.isCorrect
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
                    }`}
                  >
                    {quizFeedback.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-400" />
                    )}
                    <span>{quizFeedback.message}</span>
                  </div>
                )}

                {/* Next Quiz Prompt */}
                {quizFeedback?.isCorrect && activeQuizIndex < scene.quizPrompts.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuizIndex((prev) => prev + 1);
                      setQuizFeedback(null);
                      setSelectedElement(null);
                    }}
                    className="mt-2 w-full rounded-xl bg-purple-600 py-1 text-center font-semibold text-white shadow hover:bg-purple-500"
                  >
                    Next Question
                  </button>
                )}
              </div>
            )}

            {/* Exploded View Slider Overlay */}
            {interactionMode === 'exploded' && (
              <div className="absolute top-4 right-4 z-10 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-xs shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between font-semibold text-sky-200">
                  <span>Exploded View Separation</span>
                  <span>{((params.explodedView as number ?? 0) * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={Number(params.explodedView ?? 0)}
                  onChange={(e) => handleParamChange('explodedView', parseFloat(e.target.value))}
                  className="mt-2 w-full accent-sky-400"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Educational Equations & Insights */}
      <div className="border-t border-white/10 bg-slate-950/80 px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-300">Key Principles:</span>
            <span className="text-slate-300">
              {geo.educationalSummary.insights[0] ?? scene.description}
            </span>
          </div>

          {/* Quick Param Adjustment Drawer Trigger */}
          <div className="flex items-center gap-2">
            {scene.paramKeys.slice(0, 2).map((key) => {
              const currentVal = params[key];
              if (typeof currentVal === 'number') {
                return (
                  <div key={key} className="flex items-center gap-1.5 text-[11px]">
                    <span className="capitalize text-slate-400">{key}:</span>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={currentVal}
                      onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                      className="w-16 accent-sky-400"
                    />
                    <span className="font-mono text-white">{currentVal}</span>
                  </div>
                );
              }
              if (typeof currentVal === 'boolean') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleParamChange(key, !currentVal)}
                    className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white"
                  >
                    {key}: {currentVal ? 'ON' : 'OFF'}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

