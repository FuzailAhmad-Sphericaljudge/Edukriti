'use client';

import React, { useState } from 'react';
import {
  READING_PRACTICE_EXERCISES,
  evaluateReadingSubmission,
  ReadingEvaluationResult,
} from '@edukriti/lab';
import { InstrumentSvgViewer } from './instrument-svg-viewer.tsx';
import { Award, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export function ReadingPracticeCard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submittedMain, setSubmittedMain] = useState<string>('');
  const [submittedVernier, setSubmittedVernier] = useState<string>('');
  const [submittedTotal, setSubmittedTotal] = useState<string>('');
  const [evaluation, setEvaluation] = useState<ReadingEvaluationResult | null>(null);

  const currentExercise = READING_PRACTICE_EXERCISES[selectedIndex];

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    const mainNum = parseFloat(submittedMain) || 0;
    const vernierNum = parseFloat(submittedVernier) || 0;
    const totalNum = parseFloat(submittedTotal) || 0;

    const result = evaluateReadingSubmission({
      exerciseId: currentExercise.id,
      submittedMainReading: mainNum,
      submittedVernierReading: vernierNum,
      submittedTotal: totalNum,
    });
    setEvaluation(result);
  };

  const handleReset = () => {
    setSubmittedMain('');
    setSubmittedVernier('');
    setSubmittedTotal('');
    setEvaluation(null);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % READING_PRACTICE_EXERCISES.length);
    handleReset();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-lg text-slate-100">Instrument Reading Practice & Scoring</h3>
        </div>
        <div className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
          Exercise {selectedIndex + 1} of {READING_PRACTICE_EXERCISES.length}
        </div>
      </div>

      {/* Exercise Prompt */}
      <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{currentExercise.prompt}</p>
      </div>

      {/* Simulated Visual Representation */}
      <div className="my-6 flex justify-center">
        <InstrumentSvgViewer
          type={currentExercise.instrumentType}
          value={currentExercise.trueTotalReading}
          unit={currentExercise.unit}
        />
      </div>

      {/* Input Form */}
      <form onSubmit={handleEvaluate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Main Scale Reading ({currentExercise.unit})
            </label>
            <input
              type="number"
              step="any"
              required
              value={submittedMain}
              onChange={(e) => setSubmittedMain(e.target.value)}
              placeholder="e.g. 2.4"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Coinciding Division (#)
            </label>
            <input
              type="number"
              step="any"
              value={submittedVernier}
              onChange={(e) => setSubmittedVernier(e.target.value)}
              placeholder="e.g. 6"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Total Reading ({currentExercise.unit})
            </label>
            <input
              type="number"
              step="any"
              required
              value={submittedTotal}
              onChange={(e) => setSubmittedTotal(e.target.value)}
              placeholder="e.g. 2.44"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-600/30"
          >
            Check Reading & Score
          </button>
        </div>
      </form>

      {/* Evaluation Results */}
      {evaluation && (
        <div
          className={`mt-6 p-4 rounded-xl border ${
            evaluation.isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {evaluation.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className="font-semibold text-sm">
                Score: {evaluation.score} / 100 ({evaluation.isCorrect ? 'Correct!' : 'Incorrect'})
              </span>
            </div>
            <button
              onClick={handleNext}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg font-medium transition-colors"
            >
              Next Exercise →
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3">{evaluation.feedback}</p>

          <div className="bg-slate-900/80 rounded-lg p-3 text-xs font-mono space-y-1 text-slate-300">
            <div className="font-semibold text-slate-100 mb-1">Step-by-Step Mathematical Derivation:</div>
            {evaluation.calculationBreakdown.map((step, idx) => (
              <div key={idx} className="text-slate-300">{step}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

