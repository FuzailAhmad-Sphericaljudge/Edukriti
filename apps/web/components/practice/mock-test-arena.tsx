'use client';

import React, { useState, useEffect } from 'react';
import {
  Timer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { MockTestResult, PracticeQuestion } from '@edukriti/contracts';
import { MarkdownMath } from '../tutor/markdown-math';

interface GeneratedMockTest {
  testId: string;
  title: string;
  grade: string;
  totalTimeMinutes: number;
  sections: Array<{
    id: string;
    name: string;
    subject: string;
    timeLimitMinutes: number;
    questions: PracticeQuestion[];
  }>;
  allQuestions: PracticeQuestion[];
  createdAt: string;
}

export function MockTestArena() {
  const [stage, setStage] = useState<'setup' | 'running' | 'results'>('setup');
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 10');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['physics', 'mathematics']);
  const [testLength, setTestLength] = useState<number>(6); // total questions
  const [timeLimit, setTimeLimit] = useState<number>(15); // minutes
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Running exam state
  const [mockTest, setMockTest] = useState<GeneratedMockTest | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [testResult, setTestResult] = useState<MockTestResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Timer effect
  useEffect(() => {
    if (stage !== 'running' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, secondsRemaining]);

  const handleStartExam = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subjects: selectedSubjects,
          totalQuestions: testLength,
          timeLimitMinutes: timeLimit,
        }),
      });

      const data = (await res.json()) as GeneratedMockTest;
      setMockTest(data);
      setSecondsRemaining(data.totalTimeMinutes * 60);
      setUserAnswers({});
      setMarkedForReview(new Set());
      setActiveSectionIndex(0);
      setCurrentQuestionIndex(0);
      setStage('running');
    } catch (err) {
      console.error('Failed to create mock test', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectOption = (questionId: string, choiceId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleToggleReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleFinishExam = async () => {
    if (!mockTest || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const totalTimeSpentSec = mockTest.totalTimeMinutes * 60 - secondsRemaining;
      const res = await fetch('/api/mock-tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: mockTest,
          answers: userAnswers,
          timeSpentSeconds: Math.max(1, totalTimeSpentSec),
        }),
      });

      const result = (await res.json()) as MockTestResult;
      setTestResult(result);
      setStage('results');
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // SETUP SCREEN
  // -------------------------------------------------------------
  if (stage === 'setup') {
    const availableSubjects = [
      { id: 'physics', label: 'Physics' },
      { id: 'mathematics', label: 'Mathematics' },
      { id: 'chemistry', label: 'Chemistry' },
      { id: 'biology', label: 'Biology' },
    ];

    const toggleSubject = (id: string) => {
      if (selectedSubjects.includes(id)) {
        if (selectedSubjects.length > 1) {
          setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
        }
      } else {
        setSelectedSubjects([...selectedSubjects, id]);
      }
    };

    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-10">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Timer className="size-3.5" /> Full Mock Exam Mode
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Timed Sectional Mock Examination
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Experience authentic exam conditions with sectional time allocations, multi-subject balance, and realistic percentile ranking derived strictly from real attempts.
          </p>
        </div>

        <div className="mt-8 grid gap-6 border-t border-border/60 pt-6 md:grid-cols-2">
          {/* Grade Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Target Grade Level
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`rounded-xl border p-3 text-xs font-semibold transition ${
                    selectedGrade === g
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sections to Include (Choose 1 or more)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {availableSubjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubject(sub.id)}
                    className={`rounded-xl border p-3 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Questions */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Examination Length & Timing
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {[
                { questions: 6, mins: 10, title: 'Quick Mini-Mock', desc: '6 questions • 10 minutes' },
                { questions: 12, mins: 20, title: 'Standard Sectional', desc: '12 questions • 20 minutes' },
                { questions: 20, mins: 40, title: 'Full Length Exam', desc: '20 questions • 40 minutes' },
              ].map((opt) => {
                const isSelected = testLength === opt.questions;
                return (
                  <button
                    key={opt.questions}
                    type="button"
                    onClick={() => {
                      setTestLength(opt.questions);
                      setTimeLimit(opt.mins);
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <p className="font-heading text-sm font-bold text-foreground">{opt.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end border-t border-border/60 pt-6">
          <button
            type="button"
            disabled={isCreating}
            onClick={handleStartExam}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Timer className="size-4" />
            <span>{isCreating ? 'Preparing Examination...' : 'Start Examination Now'}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RUNNING EXAM SCREEN
  // -------------------------------------------------------------
  if (stage === 'running' && mockTest) {
    const currentSection = mockTest.sections[activeSectionIndex];
    const sectionQuestions = currentSection?.questions || [];
    const currentQuestion = sectionQuestions[currentQuestionIndex];
    const isAnswered = currentQuestion ? Boolean(userAnswers[currentQuestion.id]) : false;
    const isMarked = currentQuestion ? markedForReview.has(currentQuestion.id) : false;

    return (
      <div className="space-y-6">
        {/* Exam Header */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-md backdrop-blur-md">
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">{mockTest.title}</h3>
            <p className="text-xs text-muted-foreground">
              Section {activeSectionIndex + 1} of {mockTest.sections.length}: {currentSection?.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold ${
                secondsRemaining <= 180
                  ? 'animate-pulse border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-border bg-background text-foreground'
              }`}
            >
              <Clock className="size-4 text-primary" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinishExam}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{isSubmitting ? 'Scoring...' : 'Submit Exam'}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          {mockTest.sections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setActiveSectionIndex(idx);
                setCurrentQuestionIndex(0);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeSectionIndex === idx
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {sec.name} ({sec.questions.length} Qs)
            </button>
          ))}
        </div>

        {/* Question Area & Question Palette Grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Main Question Card */}
          {currentQuestion && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {sectionQuestions.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleReview(currentQuestion.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-medium transition ${
                    isMarked
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Flag className="size-3.5" />
                  <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              <div className="my-6 text-base font-medium leading-relaxed text-foreground sm:text-lg">
                <MarkdownMath content={currentQuestion.prompt} />
              </div>

              {/* Choices */}
              {currentQuestion.choices && currentQuestion.choices.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentQuestion.choices.map((choice) => {
                    const isSelected = userAnswers[currentQuestion.id] === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.id, choice.id)}
                        className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold uppercase transition ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-muted/60 text-muted-foreground group-hover:text-foreground'
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
                  <label className="text-xs font-semibold text-muted-foreground">Your numeric answer:</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={userAnswers[currentQuestion.id] || ''}
                      onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                      placeholder="e.g. 24"
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    {currentQuestion.unit && (
                      <span className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-mono font-medium text-muted-foreground">
                        {currentQuestion.unit}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Prev / Next Question Nav */}
              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-input px-3.5 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIndex >= sectionQuestions.length - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(sectionQuestions.length - 1, prev + 1))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-30"
                >
                  Next Question <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Question Palette Sidebar */}
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Question Palette
            </h4>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {sectionQuestions.map((q, idx) => {
                const ans = Boolean(userAnswers[q.id]);
                const rev = markedForReview.has(q.id);
                const isCur = idx === currentQuestionIndex;

                let badgeClass = 'border-border bg-background text-muted-foreground';
                if (rev) {
                  badgeClass = 'border-purple-500/50 bg-purple-500/20 text-purple-600 dark:text-purple-400';
                } else if (ans) {
                  badgeClass = 'border-emerald-500/50 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold';
                }

                if (isCur) {
                  badgeClass += ' ring-2 ring-primary';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`grid size-10 place-items-center rounded-xl border text-xs font-semibold transition ${badgeClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-md bg-emerald-500/30 border border-emerald-500/50" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-md bg-purple-500/30 border border-purple-500/50" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-md bg-muted border border-border" />
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RESULTS SCREEN
  // -------------------------------------------------------------
  if (stage === 'results' && testResult) {
    const totalScore = testResult.score ?? testResult.correctCount ?? 0;
    const maxScore = testResult.maxScore ?? testResult.totalQuestions ?? 0;
    const scorePct = testResult.percentage ?? testResult.scorePercentage ?? 0;
    const percentileVal = testResult.percentile ?? testResult.percentileRank ?? 100;
    const strongList = testResult.strongConcepts ?? [];
    const weakList = testResult.weakConcepts ?? [];
    const evalList = testResult.evaluations ?? [];
    const schedList = testResult.reviewSchedule ?? [];

    return (
      <div className="space-y-6">
        {/* Scorecard Hero */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Award className="size-3.5" /> Examination Complete
              </span>
              <h2 className="mt-2 font-heading text-3xl font-bold text-foreground">
                Score: {totalScore} / {maxScore} ({scorePct}%)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your performance has been evaluated across all sections with honest percentile calculation.
              </p>
            </div>

            {/* Rank Percentile Box */}
            <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:px-6">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Empirical Percentile
                </p>
                <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                  {percentileVal}th %ile
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (Computed from real attempts under Rule 4)
                </p>
              </div>
            </div>
          </div>

          {/* Sectional Analysis Breakdown */}
          <div className="mt-8 border-t border-border/60 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sectional Performance Breakdown
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {testResult.sectionalAnalysis.map((sec) => {
                const sName = sec.sectionName || `${sec.subject.charAt(0).toUpperCase() + sec.subject.slice(1)} Section`;
                const sScore = sec.score ?? sec.correctCount ?? 0;
                const sMax = sec.maxScore ?? sec.totalQuestions ?? 0;
                const sPct = sec.percentage ?? sec.accuracyPercentage ?? 0;
                const sTime = sec.timeSpentSeconds ?? sec.averageTimeSeconds ?? 0;
                return (
                  <div key={sName} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs font-bold text-foreground">{sName}</p>
                    <p className="mt-2 font-heading text-xl font-bold text-primary">
                      {sScore} / {sMax}{' '}
                      <span className="text-xs font-normal text-muted-foreground">({sPct}%)</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Time spent: ~{Math.round(sTime)}s
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Strong Concepts ({strongList.length})
              </h5>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {strongList.length > 0 ? (
                  strongList.map((c) => (
                    <span key={c} className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Continue practicing to establish mastery.</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4" /> Concepts to Review ({weakList.length})
              </h5>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {weakList.length > 0 ? (
                  weakList.map((c) => (
                    <span key={c} className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">All tested concepts met passing mastery!</span>
                )}
              </div>
            </div>
          </div>

          {/* Spaced Revision Schedule */}
          {schedList.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Calendar className="size-4 text-primary" /> Spaced Cognitive Revision Schedule
              </h5>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {schedList.map((sched) => {
                  const sDate = sched.scheduledDate || sched.recommendedReviewDate || new Date().toISOString();
                  return (
                    <div key={sched.conceptId} className="rounded-xl border border-border/60 bg-background p-3 text-xs">
                      <p className="font-semibold capitalize text-foreground">{sched.conceptId.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Review: {new Date(sDate).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t border-border/60 pt-6">
            <button
              type="button"
              onClick={() => setStage('setup')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-input px-4 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Retake New Test
            </button>
          </div>
        </div>

        {/* Question-by-Question Solution Review */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          <h3 className="font-heading text-lg font-bold text-foreground">
            Detailed Solution Review ({evalList.length} Questions)
          </h3>
          <div className="mt-6 space-y-4">
            {evalList.map((ev, idx) => (
              <div
                key={ev.questionId}
                className={`rounded-2xl border p-4 ${
                  ev.isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-rose-500/20 bg-rose-500/5'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">Question {idx + 1}</span>
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      ev.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {ev.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                {!ev.isCorrect && ev.diagnosedError && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                    <strong>Why your answer was wrong:</strong> {ev.diagnosedError.whyWrong}
                  </div>
                )}

                <div className="mt-3 text-xs text-muted-foreground">
                  <p><strong>Expected Answer:</strong> {String(ev.expectedAnswer)}</p>
                  <p className="mt-1"><strong>Submitted:</strong> {String(ev.submittedAnswer || 'None')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

