'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Flag,
  Sparkles,
  Clock,
  CheckCircle2,
  Send,
  MessageCircleQuestion,
  HelpCircle,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import type { PracticeQuestion, PracticeEvaluationResult } from '@edukriti/contracts';
import { MarkdownMath } from '../tutor/markdown-math';
import { SolutionDrawer } from './solution-drawer';
import { ReportQuestionModal } from './report-question-modal';

interface QuestionViewerProps {
  question: PracticeQuestion;
  timerDuration?: number; // In seconds, 0 = no timer
  onAnswerSubmitted?: (result: PracticeEvaluationResult) => void;
  onNextQuestionRequested?: () => void;
}

export function QuestionViewer({
  question,
  timerDuration = 0,
  onAnswerSubmitted,
  onNextQuestionRequested,
}: QuestionViewerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [numericAnswer, setNumericAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(timerDuration);
  const [timerActive, setTimerActive] = useState<boolean>(timerDuration > 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<PracticeEvaluationResult | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // Reset local state when question changes
  useEffect(() => {
    setSelectedAnswer('');
    setNumericAnswer('');
    setEvaluation(null);
    if (timerDuration > 0) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }

    // Check bookmark status
    fetch('/api/questions/bookmark')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          setIsBookmarked(data.bookmarks.includes(question.id));
        }
      })
      .catch(() => {});
  }, [question.id, timerDuration]);

  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || evaluation) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          // Auto submit on time expire
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft, evaluation]);

  const handleToggleBookmark = async () => {
    try {
      const res = await fetch('/api/questions/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      });
      const data = (await res.json()) as { bookmarked: boolean };
      setIsBookmarked(Boolean(data.bookmarked));
    } catch {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleSubmit = async () => {
    if (evaluation) return;

    const answerToSubmit = question.type === 'numeric' ? numericAnswer.trim() : selectedAnswer;
    if (!answerToSubmit) return;

    setIsSubmitting(true);
    try {
      const timeSpent = timerDuration > 0 ? timerDuration - timeLeft : 15;
      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          learnerId: 'learner_session',
          submittedAnswer: answerToSubmit,
          timeSpentSeconds: Math.max(1, timeSpent),
        }),
      });

      const evalData = (await res.json()) as PracticeEvaluationResult;
      setEvaluation(evalData);
      onAnswerSubmitted?.(evalData);
    } catch {
      // Fallback evaluation offline
      const isCorrect = answerToSubmit.toLowerCase() === String(question.expectedAnswer).toLowerCase();
      const mockResult: PracticeEvaluationResult = {
        questionId: question.id,
        isCorrect,
        score: isCorrect ? 1.0 : 0.0,
        expectedAnswer: question.expectedAnswer,
        submittedAnswer: answerToSubmit,
        explanation: question.solutionSteps.map((s) => s.explanation).join(' '),
        solutionSteps: question.solutionSteps,
      };
      setEvaluation(mockResult);
      onAnswerSubmitted?.(mockResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setSelectedAnswer('');
    setNumericAnswer('');
    if (timerDuration > 0) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
    }
  };

  const handleAskAarohi = () => {
    // Dispatch custom event to open tutor drawer with this question context
    window.dispatchEvent(
      new CustomEvent('open-tutor-drawer', {
        detail: {
          doubtSnippet: `Can you explain this problem step-by-step?\n\n"${question.prompt}"`,
        },
      }),
    );
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
            {question.subject.replace('_', ' ')}
          </span>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {question.grade}
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
              question.difficulty === 'easy'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : question.difficulty === 'hard' || question.difficulty === 'olympiad'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {question.difficulty}
          </span>
          {question.verified && (
            <span
              title={question.verifiedReason || 'Verified via independent solve'}
              className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400"
            >
              <ShieldCheck className="size-3.5" /> Verified
            </span>
          )}
        </div>

        {/* Right Action Icons & Timer */}
        <div className="flex items-center gap-2">
          {timerDuration > 0 && !evaluation && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-mono text-xs font-bold transition ${
                timeLeft <= 10
                  ? 'animate-pulse bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-muted text-foreground'
              }`}
            >
              <Clock className="size-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
            className={`rounded-xl border p-2 transition ${
              isBookmarked
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Bookmark className={`size-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            title="Report an issue with this question"
            className="rounded-xl border border-input p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Flag className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleAskAarohi}
            title="Ask Aarohi to explain this doubt"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <MessageCircleQuestion className="size-3.5" /> Ask Aarohi
          </button>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="my-6">
        <div className="text-base font-medium leading-relaxed text-foreground sm:text-lg">
          <MarkdownMath content={question.prompt} />
        </div>
      </div>

      {/* Answer Inputs (MCQ vs Numeric) */}
      {question.choices && question.choices.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswer.toLowerCase() === choice.id.toLowerCase();
            return (
              <button
                key={choice.id}
                type="button"
                disabled={Boolean(evaluation)}
                onClick={() => setSelectedAnswer(choice.id)}
                className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                    : 'border-border/80 bg-background/60 hover:border-primary/50 hover:bg-muted/40'
                } ${evaluation ? 'cursor-default' : ''}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold uppercase transition ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border/80 bg-muted/60 text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground'
                  }`}
                >
                  {choice.id}
                </span>
                <span className="text-sm font-medium leading-relaxed text-foreground">
                  <MarkdownMath content={choice.text} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="my-4 max-w-sm">
          <label className="text-xs font-semibold text-muted-foreground">Enter numerical answer:</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              disabled={Boolean(evaluation)}
              value={numericAnswer}
              onChange={(e) => setNumericAnswer(e.target.value)}
              placeholder="e.g. 14.5"
              className="h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {question.unit && (
              <span className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-mono font-medium text-muted-foreground">
                {question.unit}
              </span>
            )}
          </div>
          {question.tolerance !== undefined && question.tolerance > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tolerance: ±{question.tolerance} {question.unit || ''}
            </p>
          )}
        </div>
      )}

      {/* Attribution Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Tag className="size-3.5 text-muted-foreground/70" />
          <span>Source: {question.source}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
            {question.license}
          </span>
        </div>

        {!evaluation && (
          <button
            type="button"
            disabled={
              isSubmitting ||
              (question.choices && question.choices.length > 0 ? !selectedAnswer : !numericAnswer)
            }
            onClick={handleSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="size-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'Check Answer'}</span>
          </button>
        )}
      </div>

      {/* Instant Solution & Feedback Drawer */}
      {evaluation && (
        <SolutionDrawer
          evaluation={evaluation}
          question={question}
          onNextQuestion={() => onNextQuestionRequested?.()}
          onRetry={handleRetry}
        />
      )}

      {/* Report Question Modal */}
      <ReportQuestionModal
        question={question}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}

