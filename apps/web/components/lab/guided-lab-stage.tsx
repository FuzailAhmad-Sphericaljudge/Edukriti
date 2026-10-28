'use client';

import React, { useState } from 'react';
import {
  ExperimentDefinition,
  ObservationRow,
  SimulationResult,
  evaluateLabReport,
  LabReportGrade,
  computeLinearRegression,
} from '@edukriti/lab';
import { InstrumentSvgViewer } from './instrument-svg-viewer.tsx';
import { TeacherDemonstrationRunner } from './teacher-demonstration-runner.tsx';
import { ReadingPracticeCard } from './reading-practice-card.tsx';
import { LabReportCard } from './lab-report-card.tsx';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Table,
  LineChart,
  Calculator,
  HelpCircle,
  FileText,
  Sliders,
  ShieldAlert,
  Compass,
} from 'lucide-react';

interface GuidedLabStageProps {
  experiment: ExperimentDefinition;
}

export function GuidedLabStage({ experiment }: GuidedLabStageProps) {
  const [activeTab, setActiveTab] = useState<
    'aim' | 'apparatus' | 'setup' | 'perform' | 'table' | 'graph' | 'calculate' | 'viva' | 'report'
  >('perform');
  const [labMode, setLabMode] = useState<'guided' | 'teacher_demo' | 'reading_practice'>('guided');

  // Simulation state
  const [params, setParams] = useState<Record<string, number | boolean | string>>(experiment.defaultParams);
  const [observations, setObservations] = useState<ObservationRow[]>(experiment.sampleObservations.slice(0, 3));
  const [vivaAnswers, setVivaAnswers] = useState<Record<string, number>>({});
  const [generatedReport, setGeneratedReport] = useState<LabReportGrade | null>(null);

  // Run simulation
  const simResult: SimulationResult = experiment.simulate(params);

  const handleParamChange = (key: string, val: number | boolean | string) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const handleRecordCurrentReading = () => {
    const newRow: ObservationRow = {
      readingNo: observations.length + 1,
      ...simResult.stateValues,
    };
    setObservations((prev) => [...prev, newRow]);
  };

  const handleClearObservations = () => {
    setObservations([]);
  };

  const handleLoadSampleObservations = () => {
    setObservations(experiment.sampleObservations);
  };

  const handleGenerateReport = () => {
    const calc = experiment.calculateResult(observations);
    const report = evaluateLabReport(
      {
        experimentId: experiment.id,
        studentName: 'Learner',
        observations,
        calculatedValue: calc.calculatedValue,
        vivaAnswers,
      },
      experiment
    );
    setGeneratedReport(report);
    setActiveTab('report');
  };

  // Regression for graph tab
  const xKey = experiment.graph.xKey;
  const yKey = experiment.graph.yKey;
  const graphPoints = observations
    .map((o) => ({ x: Number(o[xKey] ?? 0), y: Number(o[yKey] ?? 0) }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));
  const regression = computeLinearRegression(graphPoints);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 text-slate-100 font-sans">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <span>{experiment.subject.toUpperCase()}</span> • <span>GRADE {experiment.grade}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{experiment.title}</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setLabMode('guided')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              labMode === 'guided' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guided Lab
          </button>
          <button
            onClick={() => setLabMode('teacher_demo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              labMode === 'teacher_demo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Teacher Demo
          </button>
          <button
            onClick={() => setLabMode('reading_practice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              labMode === 'reading_practice' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reading Practice
          </button>
        </div>
      </div>

      {/* Teacher Demonstration Mode Runner */}
      {labMode === 'teacher_demo' && (
        <TeacherDemonstrationRunner
          cues={experiment.demonstrationScript}
          onApplyControls={(ctrls) => setParams((p) => ({ ...p, ...ctrls }))}
          onRecordObservation={(obs) => setObservations((prev) => [...prev, { readingNo: prev.length + 1, ...obs }])}
          onHandoverToLearner={() => setLabMode('guided')}
        />
      )}

      {/* Reading Practice Mode */}
      {labMode === 'reading_practice' && <ReadingPracticeCard />}

      {/* Guided Lab Mode Workflow */}
      {labMode === 'guided' && (
        <div>
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 mb-6 text-xs font-medium">
            {[
              { id: 'aim', label: 'Aim & Theory', icon: Compass },
              { id: 'apparatus', label: 'Apparatus', icon: Table },
              { id: 'setup', label: 'Setup & Wiring', icon: Sliders },
              { id: 'perform', label: 'Perform & Measure', icon: Play },
              { id: 'table', label: 'Observation Table', icon: Table },
              { id: 'graph', label: 'Graph', icon: LineChart },
              { id: 'calculate', label: 'Calculations', icon: Calculator },
              { id: 'viva', label: 'Viva Voce', icon: HelpCircle },
              { id: 'report', label: 'Lab Report', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: AIM & THEORY */}
          {activeTab === 'aim' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-sky-400 mb-2">Experimental Aim</h3>
                <p className="text-sm text-slate-200 leading-relaxed">{experiment.aim}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-slate-100 mb-2">Theoretical Formula & Governing Law</h3>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-sm text-emerald-400 mb-3">
                  {experiment.theoreticalFormula}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {experiment.variables.map((v, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200">{v.name} ({v.symbol})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-700 text-sky-300">
                          {v.role}
                        </span>
                      </div>
                      <p className="text-slate-400">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Notes */}
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                  <ShieldAlert className="w-4 h-4" /> Laboratory Safety Precautions
                </div>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {experiment.safetyNotes.map((note) => (
                    <li key={note.id}>
                      <span className="font-semibold uppercase text-amber-300 mr-1">[{note.severity}]</span>
                      {note.note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: APPARATUS */}
          {activeTab === 'apparatus' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl">
              <h3 className="text-base font-bold text-slate-100 mb-4">Required Apparatus & Least Counts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-3">Apparatus</th>
                      <th className="py-2.5 px-3">Range</th>
                      <th className="py-2.5 px-3">Least Count</th>
                      <th className="py-2.5 px-3">Role / Function</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {experiment.apparatus.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono">{item.spec.minRange} to {item.spec.maxRange} {item.spec.unit}</td>
                        <td className="py-2.5 px-3 font-mono text-sky-400 font-bold">{item.spec.leastCount} {item.spec.unit}</td>
                        <td className="py-2.5 px-3">{item.roleDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SETUP & WIRING */}
          {activeTab === 'setup' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-6">
              <h3 className="text-base font-bold text-slate-100">Experimental Rig & Circuit Configuration</h3>
              {experiment.requiredConnections && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Verified Connections:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                    {experiment.requiredConnections.map((c, i) => (
                      <div key={i} className="p-2 bg-slate-900 rounded-lg flex items-center gap-2">
                        <span className="text-sky-400">{c.fromInstrumentId} ({c.fromPin})</span>
                        <span>→</span>
                        <span className="text-emerald-400">{c.toInstrumentId} ({c.toPin})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reverse Polarity / Safety Check Toggle */}
              {experiment.id === 'ohms_law' && (
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">Test Reverse Polarity Consequence</div>
                      <div className="text-xs text-slate-400">Flip the voltmeter leads backwards to see realistic meter deflection warning.</div>
                    </div>
                    <button
                      onClick={() => handleParamChange('reversePolarity', !params.reversePolarity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        params.reversePolarity ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {params.reversePolarity ? 'Polarity Reversed!' : 'Normal Polarity'}
                    </button>
                  </div>
                </div>
              )}

              {!simResult.isConnectionValid && (
                <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-rose-200">Circuit Wiring Alert:</div>
                    {simResult.connectionError || 'Review wiring connection configuration.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERFORM & MEASURE */}
          {activeTab === 'perform' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-slate-100">Apparatus Controls</h3>
                  <button
                    onClick={() => setParams(experiment.defaultParams)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Specific Experiment Controls */}
                {experiment.id === 'ohms_law' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Rheostat Slider: {((Number(params.rheostatSlider ?? 0.5)) * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={Number(params.rheostatSlider ?? 0.5)}
                        onChange={(e) => handleParamChange('rheostatSlider', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-slate-300 font-semibold">Plug Key:</span>
                      <button
                        onClick={() => handleParamChange('plugKeyClosed', !params.plugKeyClosed)}
                        className={`px-3 py-1 rounded-xl font-bold transition-all ${
                          params.plugKeyClosed ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {params.plugKeyClosed ? 'Inserted (Closed)' : 'Removed (Open)'}
                      </button>
                    </div>
                  </div>
                )}

                {experiment.id === 'simple_pendulum' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Effective Length L: {Number(params.effectiveLengthCm ?? 80).toFixed(1)} cm
                      </label>
                      <input
                        type="range"
                        min="40"
                        max="120"
                        step="5"
                        value={Number(params.effectiveLengthCm ?? 80)}
                        onChange={(e) => handleParamChange('effectiveLengthCm', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {experiment.id === 'projectile_motion' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Launch Angle θ: {Number(params.launchAngleDeg ?? 45).toFixed(0)}°
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        step="5"
                        value={Number(params.launchAngleDeg ?? 45)}
                        onChange={(e) => handleParamChange('launchAngleDeg', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Launch Speed v0: {Number(params.launchVelocityMps ?? 14).toFixed(0)} m/s
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="2"
                        value={Number(params.launchVelocityMps ?? 14)}
                        onChange={(e) => handleParamChange('launchVelocityMps', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {experiment.id === 'convex_lens_uv' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Object Distance u: {Number(params.objectDistanceCm ?? 30).toFixed(1)} cm
                      </label>
                      <input
                        type="range"
                        min="18"
                        max="60"
                        step="2"
                        value={Number(params.objectDistanceCm ?? 30)}
                        onChange={(e) => handleParamChange('objectDistanceCm', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {experiment.id === 'acid_base_titration' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Burette NaOH Added: {Number(params.addedNaOhMl ?? 0).toFixed(1)} mL
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="0.5"
                        value={Number(params.addedNaOhMl ?? 0)}
                        onChange={(e) => handleParamChange('addedNaOhMl', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {experiment.id === 'density_archimedes' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Immersion Depth: {((Number(params.immersedFraction ?? 1.0)) * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.25"
                        value={Number(params.immersedFraction ?? 1.0)}
                        onChange={(e) => handleParamChange('immersedFraction', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {experiment.id === 'refraction_glass_slab' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Angle of Incidence i: {Number(params.incidentAngleDeg ?? 30).toFixed(0)}°
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="70"
                        step="5"
                        value={Number(params.incidentAngleDeg ?? 30)}
                        onChange={(e) => handleParamChange('incidentAngleDeg', parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* Add to Observation Table CTA */}
                <button
                  onClick={handleRecordCurrentReading}
                  className="w-full mt-4 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" /> Record Current Reading
                </button>
              </div>

              {/* Live Virtual Instruments Display */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-slate-100">Live Virtual Instruments</h3>
                  <div className="text-xs font-mono text-emerald-400">Simulation Active</div>
                </div>

                {/* Warnings banner */}
                {simResult.warnings.length > 0 && (
                  <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{simResult.warnings[0]}</span>
                  </div>
                )}

                {/* Grid of Gauges & Instruments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(simResult.displayReadings).map(([key, item]) => {
                    let instType = 'multimeter';
                    if (key.includes('current')) instType = 'ammeter';
                    else if (key.includes('voltage')) instType = 'voltmeter';
                    else if (key.includes('volume')) instType = 'burette';
                    else if (key.includes('vernier')) instType = 'vernier_caliper';
                    else if (key.includes('screw')) instType = 'screw_gauge';

                    return (
                      <div key={key}>
                        <InstrumentSvgViewer
                          type={instType as any}
                          value={item.value}
                          unit={item.unit}
                          highlightWarning={!simResult.isConnectionValid}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OBSERVATION TABLE */}
          {activeTab === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100">Recorded Observations</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadSampleObservations}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Load Standard Dataset
                  </button>
                  <button
                    onClick={handleClearObservations}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>

              {observations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No readings recorded yet. Go to "Perform & Measure" and click "Record Current Reading", or click "Load Standard Dataset".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        {experiment.observationColumns.map((col) => (
                          <th key={col.key} className="py-2.5 px-3">
                            {col.label} {col.unit && col.unit !== '#' && `(${col.unit})`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                      {observations.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          {experiment.observationColumns.map((col) => (
                            <td key={col.key} className="py-2 px-3">
                              {typeof row[col.key] === 'number' ? (row[col.key] as number).toFixed(2) : row[col.key] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DYNAMIC GRAPH */}
          {activeTab === 'graph' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {experiment.graph.yLabel} vs {experiment.graph.xLabel}
                  </h3>
                  <div className="text-xs text-slate-400">{experiment.graph.interpretation}</div>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="text-sky-400 font-bold">Slope = {regression.slope.toFixed(3)}</div>
                  <div className="text-indigo-400">R² = {regression.rSquared.toFixed(3)}</div>
                </div>
              </div>

              {/* SVG Coordinate Plot */}
              <div className="flex justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <svg viewBox="0 0 320 200" className="w-full max-w-lg h-60">
                  {/* Grid Lines */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={i} x1="40" y1={30 + i * 26} x2="300" y2={30 + i * 26} stroke="#1e293b" strokeWidth="1" />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={i} x1={40 + i * 52} y1="30" x2={40 + i * 52} y2="160" stroke="#1e293b" strokeWidth="1" />
                  ))}
                  {/* Axes */}
                  <line x1="40" y1="160" x2="300" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="40" y1="30" x2="40" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Axis Labels */}
                  <text x="170" y="185" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                    {experiment.graph.xLabel} ({experiment.graph.xUnit})
                  </text>
                  <text x="18" y="95" fill="#cbd5e1" fontSize="9" textAnchor="middle" transform="rotate(-90 18 95)">
                    {experiment.graph.yLabel} ({experiment.graph.yUnit})
                  </text>
                  {/* Linear regression best-fit line */}
                  <line x1="40" y1="160" x2="280" y2="45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  {/* Plotted Data Points */}
                  {graphPoints.map((pt, idx) => {
                    const cx = 40 + Math.min(240, Math.max(10, pt.x * 35));
                    const cy = 160 - Math.min(125, Math.max(10, pt.y * 30));
                    return (
                      <circle key={idx} cx={cx} cy={cy} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    );
                  })}
                </svg>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl text-xs font-mono text-slate-300">
                {experiment.graph.slopeFormula}
              </div>
            </div>
          )}

          {/* TAB 7: CALCULATIONS */}
          {activeTab === 'calculate' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-4">
              <h3 className="text-base font-bold text-slate-100">Step-by-Step Mathematical Evaluation</h3>
              {(() => {
                const calc = experiment.calculateResult(observations);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
                        <div className="text-xs text-slate-400">Calculated Value</div>
                        <div className="text-xl font-bold text-slate-100 mt-1">
                          {calc.calculatedValue} {calc.unit}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
                        <div className="text-xs text-slate-400">Theoretical Value</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {calc.theoreticalValue} {calc.unit}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
                        <div className="text-xs text-slate-400">Percentage Error</div>
                        <div className="text-xl font-bold text-sky-400 mt-1">{calc.percentageError}%</div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
                      <div className="font-bold text-slate-200 mb-1">Formula & Derivations:</div>
                      {calc.formulaSteps.map((st, i) => (
                        <div key={i}>{st}</div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 8: VIVA VOCE */}
          {activeTab === 'viva' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100">Viva Voce Conceptual Examination</h3>
                <div className="text-xs text-slate-400">Answer to complete certified lab report</div>
              </div>

              {experiment.vivaQuestions.map((q, qIdx) => (
                <div key={q.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-3">
                  <div className="text-sm font-semibold text-slate-200">
                    Q{qIdx + 1}: {q.question}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = vivaAnswers[q.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setVivaAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                          className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-3 ${
                            isChosen
                              ? 'bg-sky-950/80 border border-sky-500 text-sky-100'
                              : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-bold shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateReport}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-700/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Observations & Generate Report
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: LAB REPORT CARD */}
          {activeTab === 'report' && (
            <div>
              {generatedReport ? (
                <LabReportCard grade={generatedReport} experimentTitle={experiment.title} />
              ) : (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto text-xs text-slate-400 space-y-3">
                  <p>You have not generated an official report for this experiment yet.</p>
                  <button
                    onClick={handleGenerateReport}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl"
                  >
                    Evaluate Current Lab Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

