'use client';

import React, { useState, useEffect } from 'react';
import { DemonstrationCue } from '@edukriti/lab';
import { Volume2, Play, Pause, SkipForward, UserCheck, Sparkles } from 'lucide-react';

interface TeacherDemonstrationRunnerProps {
  cues: DemonstrationCue[];
  onApplyControls: (controls: Record<string, any>) => void;
  onRecordObservation: (obs: Record<string, any>) => void;
  onHandoverToLearner: () => void;
}

export function TeacherDemonstrationRunner({
  cues,
  onApplyControls,
  onRecordObservation,
  onHandoverToLearner,
}: TeacherDemonstrationRunnerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentCue = cues[currentStepIndex] ?? cues[0];

  useEffect(() => {
    if (!currentCue) return;
    onApplyControls(currentCue.targetControls);
    if (Object.keys(currentCue.expectedObservation).length > 0) {
      onRecordObservation(currentCue.expectedObservation);
    }
  }, [currentStepIndex, currentCue, onApplyControls, onRecordObservation]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      if (currentStepIndex < cues.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, currentCue?.durationMs ?? 3500);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying, cues.length, currentCue]);

  const handleNext = () => {
    if (currentStepIndex < cues.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/40 rounded-2xl p-5 shadow-2xl text-slate-100 mb-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-sky-400">
              आ
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Teacher Aarohi Demonstration Mode
            </div>
            <h4 className="text-sm font-bold text-slate-100">
              Step {currentStepIndex + 1} of {cues.length}: {currentCue?.title}
            </h4>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title={isPlaying ? 'Pause Demo' : 'Play Demo'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStepIndex >= cues.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={onHandoverToLearner}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-700/30 flex items-center gap-1.5 transition-all"
          >
            <UserCheck className="w-4 h-4" /> Take Over & Explore
          </button>
        </div>
      </div>

      {/* Narration Script Speech Box */}
      <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-3">
        <Volume2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{currentCue?.narration}</p>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {cues.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStepIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentStepIndex ? 'w-8 bg-sky-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

