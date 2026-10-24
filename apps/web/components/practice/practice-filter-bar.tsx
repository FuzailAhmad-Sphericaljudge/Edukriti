'use client';

import React from 'react';
import { Search, Filter, Clock, CheckCircle, Sparkles } from 'lucide-react';
import type { QuestionDifficulty } from '@edukriti/contracts';

interface PracticeFilterBarProps {
  selectedSubject: string;
  onSubjectChange: (subj: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (diff: string) => void;
  timerSeconds: number;
  onTimerChange: (secs: number) => void;
  verifiedOnly: boolean;
  onVerifiedToggle: (val: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  availableConcepts?: string[];
  selectedConcept?: string;
  onConceptChange?: (c: string) => void;
}

export function PracticeFilterBar({
  selectedSubject,
  onSubjectChange,
  selectedDifficulty,
  onDifficultyChange,
  timerSeconds,
  onTimerChange,
  verifiedOnly,
  onVerifiedToggle,
  searchQuery,
  onSearchChange,
  availableConcepts = [],
  selectedConcept = '',
  onConceptChange,
}: PracticeFilterBarProps) {
  const subjects = [
    { id: '', label: 'All Subjects' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'physics', label: 'Physics' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'biology', label: 'Biology' },
    { id: 'computer_science', label: 'Computer Science' },
  ];

  const difficulties = [
    { id: '', label: 'All Difficulties' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'olympiad', label: 'Olympiad' },
  ];

  const timerOptions = [
    { value: 0, label: 'No Timer' },
    { value: 30, label: '30s Blitz' },
    { value: 60, label: '60s Standard' },
    { value: 120, label: '2m Exam' },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems by keyword (e.g., Ohm's law, quadratic, momentum, stoichiometry)..."
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Timer selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-input bg-background p-0.5 text-xs">
            <span className="flex items-center gap-1 px-2.5 text-muted-foreground">
              <Clock className="size-3.5" /> Timer:
            </span>
            {timerOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTimerChange(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  timerSeconds === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onVerifiedToggle(!verifiedOnly)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition ${
              verifiedOnly
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-input bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            <CheckCircle className="size-3.5" />
            Verified Only
          </button>
        </div>
      </div>

      {/* Subject and Difficulty Pills */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Subject:
          </span>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSubjectChange(sub.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSubject === sub.id
                  ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Difficulty:
          </span>
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => onDifficultyChange(diff.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedDifficulty === diff.id
                  ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

