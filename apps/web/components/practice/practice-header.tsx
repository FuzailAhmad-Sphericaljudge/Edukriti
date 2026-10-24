'use client';

import React from 'react';
import {
  Sparkles,
  BrainCircuit,
  Target,
  Timer,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import type { QuestionBankStats } from '@edukriti/contracts';

interface PracticeHeaderProps {
  activeTab: 'adaptive' | 'bank' | 'mock' | 'parametric';
  onTabChange: (tab: 'adaptive' | 'bank' | 'mock' | 'parametric') => void;
  stats?: QuestionBankStats;
}

export function PracticeHeader({ activeTab, onTabChange, stats }: PracticeHeaderProps) {
  const totalCombinations = stats?.estimatedCombinations || 82075;
  const templateCount = stats?.parametricTemplatesCount || 60;
  const totalQuestions = stats?.totalQuestions || 76;

  return (
    <div className="border-b border-border/70 bg-gradient-to-b from-primary/5 via-background to-background pb-6 pt-8">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BrainCircuit className="size-3.5" /> Practice at Scale • Phase 4
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> {templateCount} Parametric Families • {totalCombinations.toLocaleString()} Instances
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Edukriti Practice Arena
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Adaptive Rasch/Elo problem sets, 60 parametric STEM numerical engines, open benchmark sets (GSM8K, MATH, ARC), and full timed mock exams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange('adaptive')}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                activeTab === 'adaptive'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Target className="size-3.5" /> Adaptive Stream
            </button>
            <button
              type="button"
              onClick={() => onTabChange('bank')}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                activeTab === 'bank'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="size-3.5" /> Question Bank ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => onTabChange('mock')}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                activeTab === 'mock'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Timer className="size-3.5" /> Full Mock Exam
            </button>
            <button
              type="button"
              onClick={() => onTabChange('parametric')}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
                activeTab === 'parametric'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="size-3.5" /> Parametric Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

