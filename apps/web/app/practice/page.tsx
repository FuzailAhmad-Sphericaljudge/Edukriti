'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Target } from 'lucide-react';
import type { PracticeQuestion, QuestionBankStats, PracticeEvaluationResult } from '@edukriti/contracts';
import { PracticeHeader } from '@/components/practice/practice-header';
import { PracticeFilterBar } from '@/components/practice/practice-filter-bar';
import { QuestionViewer } from '@/components/practice/question-viewer';
import { MockTestArena } from '@/components/practice/mock-test-arena';
import { ParametricLab } from '@/components/practice/parametric-lab';

interface AdaptiveResponse {
  selectedQuestion?: PracticeQuestion;
  selectionReason?: string;
}

interface QuestionsQueryResponse {
  questions?: PracticeQuestion[];
  totalCount?: number;
  hasMore?: boolean;
}

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<'adaptive' | 'bank' | 'mock' | 'parametric'>('adaptive');
  const [stats, setStats] = useState<QuestionBankStats | undefined>(undefined);

  // Filter state for Question Bank tab
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Bank questions state
  const [bankQuestions, setBankQuestions] = useState<PracticeQuestion[]>([]);
  const [totalBankCount, setTotalBankCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingBank, setIsLoadingBank] = useState<boolean>(false);

  // Adaptive stream state
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<PracticeQuestion | null>(null);
  const [adaptiveReason, setAdaptiveReason] = useState<string>('');
  const [isLoadingAdaptive, setIsLoadingAdaptive] = useState<boolean>(false);
  const [learnerProfiles, setLearnerProfiles] = useState<Record<string, {
    conceptId: string;
    theta: number;
    attempts: number;
    correctCount: number;
    consecutiveCorrect: number;
    intervalDays: number;
    nextReviewDate?: string;
  }>>({});
  const [recentWeakConcepts, setRecentWeakConcepts] = useState<string[]>(['ohms_law']);

  // Load stats on mount
  useEffect(() => {
    fetch('/api/admin/practice-stats')
      .then((res) => res.json())
      .then((data: unknown) => {
        setStats(data as QuestionBankStats);
      })
      .catch(() => {});
  }, []);

  // Fetch adaptive question
  const fetchNextAdaptive = useCallback(async () => {
    setIsLoadingAdaptive(true);
    try {
      const res = await fetch('/api/questions/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: learnerProfiles,
          targetSubject: selectedSubject || undefined,
          weakConceptIds: recentWeakConcepts,
        }),
      });

      const data = (await res.json()) as AdaptiveResponse;
      if (data.selectedQuestion) {
        setAdaptiveQuestion(data.selectedQuestion);
        setAdaptiveReason(data.selectionReason || 'Matched to your current proficiency level');
      }
    } catch (err) {
      console.error('Failed to load adaptive question', err);
    } finally {
      setIsLoadingAdaptive(false);
    }
  }, [learnerProfiles, recentWeakConcepts, selectedSubject]);

  // Initial adaptive fetch or when switching to adaptive tab
  useEffect(() => {
    let ignore = false;
    if (activeTab === 'adaptive' && !adaptiveQuestion) {
      fetch('/api/questions/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: learnerProfiles,
          targetSubject: selectedSubject || undefined,
          weakConceptIds: recentWeakConcepts,
        }),
      })
        .then((res) => res.json())
        .then((rawData: unknown) => {
          const data = rawData as AdaptiveResponse;
          if (!ignore && data.selectedQuestion) {
            setAdaptiveQuestion(data.selectedQuestion);
            setAdaptiveReason(data.selectionReason || 'Matched to your current proficiency level');
          }
        })
        .catch((err) => {
          if (!ignore) console.error('Failed to load adaptive question', err);
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, adaptiveQuestion, learnerProfiles, recentWeakConcepts, selectedSubject]);

  // Fetch bank questions
  const fetchBankQuestions = useCallback(async (pageNum: number = 1) => {
    setIsLoadingBank(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '10',
      });
      if (selectedSubject) params.set('subject', selectedSubject);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = (await res.json()) as QuestionsQueryResponse;

      if (data.questions) {
        setBankQuestions(data.questions);
        setTotalBankCount(data.totalCount || 0);
        setHasMore(Boolean(data.hasMore));
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Failed to load bank questions', err);
    } finally {
      setIsLoadingBank(false);
    }
  }, [searchQuery, selectedDifficulty, selectedSubject, verifiedOnly]);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'bank') {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '10',
      });
      if (selectedSubject) params.set('subject', selectedSubject);
      if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      if (searchQuery) params.set('search', searchQuery);

      fetch(`/api/questions?${params.toString()}`)
        .then((res) => res.json())
        .then((rawData: unknown) => {
          const data = rawData as QuestionsQueryResponse;
          if (!ignore && data.questions) {
            setBankQuestions(data.questions);
            setTotalBankCount(data.totalCount || 0);
            setHasMore(Boolean(data.hasMore));
            setPage(1);
          }
        })
        .catch((err) => {
          if (!ignore) console.error('Failed to load bank questions', err);
        });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, searchQuery, selectedDifficulty, selectedSubject, verifiedOnly]);

  const handleAdaptiveAnswerSubmitted = (result: PracticeEvaluationResult) => {
    // Update local profile
    if (adaptiveQuestion) {
      const primaryConcept = adaptiveQuestion.conceptIds[0] || 'general';
      setLearnerProfiles((prev) => ({
        ...prev,
        [primaryConcept]: {
          conceptId: primaryConcept,
          theta: result.updatedIrtTheta ?? 0.0,
          attempts: (prev[primaryConcept]?.attempts || 0) + 1,
          correctCount: (prev[primaryConcept]?.correctCount || 0) + (result.isCorrect ? 1 : 0),
          consecutiveCorrect: result.consecutiveCorrect || 0,
          intervalDays: result.intervalDays || 1,
          nextReviewDate: result.nextReviewDate,
        },
      }));

      if (!result.isCorrect) {
        setRecentWeakConcepts((prev) => Array.from(new Set([...prev, primaryConcept])));
      }
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Practice Header with Tab Switcher */}
      <PracticeHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      />

      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-9">
        {/* ----------------- ADAPTIVE TAB ----------------- */}
        {activeTab === 'adaptive' && (
          <div className="space-y-6">
            {/* Adaptive Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Target className="size-4" />
                </span>
                <div>
                  <span className="font-bold text-foreground">Adaptive Intelligence:</span>{' '}
                  <span className="text-muted-foreground">{adaptiveReason}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchNextAdaptive}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-background px-3 py-1 font-semibold text-primary transition hover:bg-muted"
              >
                <RotateCcw className="size-3" /> Fetch New Question
              </button>
            </div>

            {/* Active Question Viewer */}
            {isLoadingAdaptive ? (
              <div className="grid h-72 place-items-center rounded-3xl border border-border/80 bg-card p-8">
                <div className="text-center">
                  <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-3 text-xs text-muted-foreground">Calibrating next ZPD question...</p>
                </div>
              </div>
            ) : adaptiveQuestion ? (
              <QuestionViewer
                question={adaptiveQuestion}
                timerDuration={timerDuration}
                onAnswerSubmitted={handleAdaptiveAnswerSubmitted}
                onNextQuestionRequested={fetchNextAdaptive}
              />
            ) : (
              <div className="rounded-3xl border border-border/80 bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">No questions found matching your filter.</p>
              </div>
            )}
          </div>
        )}

        {/* ----------------- QUESTION BANK EXPLORER TAB ----------------- */}
        {activeTab === 'bank' && (
          <div className="space-y-6">
            <PracticeFilterBar
              selectedSubject={selectedSubject}
              onSubjectChange={setSelectedSubject}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              timerSeconds={timerDuration}
              onTimerChange={setTimerDuration}
              verifiedOnly={verifiedOnly}
              onVerifiedToggle={setVerifiedOnly}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {bankQuestions.length} of {totalBankCount} problems in repository</span>
              <span>Page {page}</span>
            </div>

            {isLoadingBank ? (
              <div className="grid h-64 place-items-center rounded-3xl border border-border/80 bg-card">
                <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : bankQuestions.length > 0 ? (
              <div className="space-y-6">
                {bankQuestions.map((q) => (
                  <QuestionViewer key={q.id} question={q} timerDuration={timerDuration} />
                ))}

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => fetchBankQuestions(page - 1)}
                    className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    Previous Page
                  </button>
                  <span className="text-xs text-muted-foreground">Page {page}</span>
                  <button
                    type="button"
                    disabled={!hasMore}
                    onClick={() => fetchBankQuestions(page + 1)}
                    className="rounded-xl border border-input px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    Next Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border/80 bg-card p-12 text-center text-sm text-muted-foreground">
                No problems match your current search filters. Try clearing filters or searching another concept.
              </div>
            )}
          </div>
        )}

        {/* ----------------- MOCK TEST TAB ----------------- */}
        {activeTab === 'mock' && <MockTestArena />}

        {/* ----------------- PARAMETRIC LAB TAB ----------------- */}
        {activeTab === 'parametric' && <ParametricLab />}
      </div>
    </main>
  );
}

