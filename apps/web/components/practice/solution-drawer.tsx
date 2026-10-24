'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Calendar,
  Brain,
  AlertOctagon,
} from 'lucide-react';
import type { PracticeEvaluationResult, PracticeQuestion } from '@edukriti/contracts';
import { MarkdownMath } from '../tutor/markdown-math';

interface SolutionDrawerProps {
  evaluation: PracticeEvaluationResult;
  question: PracticeQuestion;
  onNextQuestion: () => void;
  onRetry: () => void;
}

export function SolutionDrawer({
  evaluation,
  question,
  onNextQuestion,
  onRetry,
}: SolutionDrawerProps) {
  const isCorrect = evaluation.isCorrect;

  return (
    <div className="mt-6 rounded-2xl border border-border/80 bg-card p-6 shadow-md transition-all">
      {/* Result Status Banner */}
      <div
        className={`flex items-start gap-3 rounded-xl p-4 ${
          isCorrect
            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20'
        }`}
      >
        {isCorrect ? (
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        ) : (
          <XCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="text-sm font-bold">
            {isCorrect ? 'Correct! Outstanding reasoning.' : 'Not quite right yet.'}
          </h4>
          <p className="mt-0.5 text-xs opacity-90">
            {isCorrect
              ? 'You applied the core physical principles and formulas accurately.'
              : `Expected: ${String(evaluation.expectedAnswer)} • Your Answer: ${String(evaluation.submittedAnswer || 'None')}`}
          </p>
        </div>
      </div>

      {/* "Why My Wrong Answer Was Wrong" Callout Box */}
      {!isCorrect && evaluation.diagnosedError && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertOctagon className="size-4 shrink-0" />
            <h5 className="text-xs font-bold uppercase tracking-wider">
              Why your wrong answer was wrong
            </h5>
          </div>
          <div className="mt-2 text-xs leading-relaxed text-foreground">
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              Diagnosed misconception [{evaluation.diagnosedError.errorTag}]:
            </span>{' '}
            <MarkdownMath content={evaluation.diagnosedError.whyWrong} />
          </div>
        </div>
      )}

      {/* Step-by-Step Complete Solution */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <HelpCircle className="size-3.5" /> Step-by-Step Solution Breakdown
        </h5>

        <div className="mt-3 space-y-3">
          {evaluation.solutionSteps && evaluation.solutionSteps.length > 0 ? (
            evaluation.solutionSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {step.stepNumber}
                  </span>
                  <span className="font-semibold text-foreground">{step.title}</span>
                </div>
                {step.formula && (
                  <div className="my-2 rounded-lg bg-background/80 p-2 text-center">
                    <MarkdownMath content={`$$${step.formula}$$`} />
                  </div>
                )}
                <p className="mt-1 leading-relaxed text-muted-foreground">{step.explanation}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <MarkdownMath content={evaluation.explanation} />
            </div>
          )}
        </div>
      </div>

      {/* Spaced Repetition & Ability Progression Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          <span>
            Updated Ability Score:{' '}
            <strong className="text-foreground">
              {evaluation.updatedIrtTheta !== undefined ? `${evaluation.updatedIrtTheta > 0 ? '+' : ''}${evaluation.updatedIrtTheta.toFixed(2)}` : 'Active'}
            </strong>
          </span>
        </div>

        {evaluation.nextReviewDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              Spaced Review:{' '}
              <strong className="text-foreground">
                In {evaluation.intervalDays || 1} day{(evaluation.intervalDays || 1) > 1 ? 's' : ''}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex items-center justify-end gap-2.5">
        {!isCorrect && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input px-3.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> Try Again
          </button>
        )}
        <button
          type="button"
          onClick={onNextQuestion}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          <span>Next Adaptive Question</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

