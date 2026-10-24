'use client';

import React, { useState } from 'react';
import { Flag, X, Check, AlertTriangle, Send } from 'lucide-react';
import type { PracticeQuestion } from '@edukriti/contracts';

interface ReportQuestionModalProps {
  question: PracticeQuestion;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportQuestionModal({ question, isOpen, onClose }: ReportQuestionModalProps) {
  const [issueType, setIssueType] = useState<string>('ambiguous_prompt');
  const [description, setDescription] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/questions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          issueType,
          description: description || 'Flagged by student for editorial review.',
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        onClose();
      }, 1800);
    } catch {
      // Allow graceful close
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2 text-foreground">
            <span className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Flag className="size-4" />
            </span>
            <h3 className="font-heading text-base font-bold">Report Question Issue</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {submitted ? (
          <div className="my-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Thank you for reporting!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Our curriculum editorial engine will review this question.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Question ID: <span className="font-mono text-foreground">{question.id}</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">What seems wrong with this question?</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ambiguous_prompt">Ambiguous or unclear wording</option>
                <option value="incorrect_answer">Expected answer appears mathematically incorrect</option>
                <option value="latex_rendering_bug">LaTeX math formula formatting error</option>
                <option value="duplicate_choices">Choices contain duplicate answers</option>
                <option value="unclear_explanation">Step-by-step solution is confusing or incomplete</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Additional details (optional):</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Explain what was confusing or which specific value didn't match..."
                className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-3.5" /> Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

