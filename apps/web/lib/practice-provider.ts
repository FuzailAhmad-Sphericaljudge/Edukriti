import type {
  PracticeQuestion,
  PracticeSubmission,
  PracticeEvaluationResult,
  QuestionBankQuery,
  QuestionBankStats,
  MockTestRequest,
  MockTestResult,
} from '@edukriti/contracts';
import {
  PARAMETRIC_TEMPLATES,
  generateParametricQuestion,
  getParametricMetrics,
  getImportedQuestions,
  getImportedDatasetMetrics,
  compareAnswers,
  updateLearnerTheta,
  calculateNextSpacedInterval,
  selectNextAdaptiveQuestion,
  createMockTest,
  evaluateMockTest,
  type LearnerConceptProfile,
  type HistoricalMockTestAttempt,
  type GeneratedMockTest,
} from '@edukriti/questions';

// In-memory sessions store for demo & offline mode
const inMemoryReports = new Map<string, { questionId: string; issueType: string; description: string; reportedAt: string }>();
const inMemoryBookmarks = new Set<string>();
const inMemoryHistoricalMockAttempts: HistoricalMockTestAttempt[] = [
  { attemptId: 'hist-001', score: 3, totalMarks: 6, percentage: 50, completedAt: '2026-10-23T10:00:00.000Z' },
  { attemptId: 'hist-002', score: 4, totalMarks: 6, percentage: 67, completedAt: '2026-10-23T14:30:00.000Z' },
  { attemptId: 'hist-003', score: 5, totalMarks: 6, percentage: 83, completedAt: '2026-10-24T09:15:00.000Z' },
];

/**
 * Builds the canonical initial question pool containing all imported benchmark questions
 * plus seed-1001 instances of all 60 parametric generator templates.
 */
function buildCanonicalQuestionPool(): PracticeQuestion[] {
  const pool: PracticeQuestion[] = [...getImportedQuestions()];

  for (const template of PARAMETRIC_TEMPLATES) {
    try {
      const q = generateParametricQuestion(template.familyId, 1001);
      pool.push(q);
    } catch {
      // Ignore generation failure during pool init
    }
  }

  return pool;
}

const CANONICAL_QUESTION_POOL: PracticeQuestion[] = buildCanonicalQuestionPool();

/**
 * Queries and paginates the practice question bank.
 */
export function queryPracticeBank(query: QuestionBankQuery): {
  questions: PracticeQuestion[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} {
  let filtered = [...CANONICAL_QUESTION_POOL];

  if (query.subject) {
    filtered = filtered.filter((q) => q.subject.toLowerCase() === query.subject?.toLowerCase());
  }
  if (query.conceptId) {
    const normConcept = query.conceptId.toLowerCase();
    filtered = filtered.filter((q) =>
      q.conceptIds.some((c) => c.toLowerCase().includes(normConcept) || normConcept.includes(c.toLowerCase())),
    );
  }
  if (query.grade) {
    filtered = filtered.filter((q) => q.grade.toLowerCase() === query.grade?.toLowerCase());
  }
  if (query.difficulty) {
    filtered = filtered.filter((q) => q.difficulty === query.difficulty);
  }
  if (query.questionType) {
    filtered = filtered.filter((q) => q.type === query.questionType);
  }
  if (query.verifiedOnly) {
    filtered = filtered.filter((q) => q.verified);
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter(
      (q) =>
        q.prompt.toLowerCase().includes(s) ||
        q.conceptIds.some((c) => c.toLowerCase().includes(s)) ||
        q.subject.toLowerCase().includes(s),
    );
  }

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return {
    questions: paginated,
    totalCount: filtered.length,
    page,
    pageSize,
    hasMore: startIndex + pageSize < filtered.length,
  };
}

/**
 * Finds a question by ID or generates it on the fly if it is a parametric instance ID.
 */
export function findQuestionById(id: string): PracticeQuestion | undefined {
  const direct = CANONICAL_QUESTION_POOL.find((q) => q.id === id);
  if (direct) return direct;

  // Check if it's a parametric ID pattern: e.g. pq-math-lin-1234
  for (const template of PARAMETRIC_TEMPLATES) {
    if (id.includes(template.familyId) || id.startsWith('pq-')) {
      // Try extracting seed or using default seed
      const parts = id.split('-');
      const seed = parseInt(parts[parts.length - 1] || '1001', 10);
      try {
        return generateParametricQuestion(template.familyId, isNaN(seed) ? 1001 : seed);
      } catch {
        // Continue searching
      }
    }
  }

  return undefined;
}

/**
 * Evaluates a student practice submission, diagnoses errors, and updates learner ability.
 */
export function evaluateSubmission(submission: PracticeSubmission): PracticeEvaluationResult {
  const question = findQuestionById(submission.questionId);
  const nowIso = new Date().toISOString();
  const submittedAns = String(submission.submittedAnswer ?? submission.userAnswer ?? '');

  if (!question) {
    return {
      questionId: submission.questionId,
      isCorrect: false,
      score: 0,
      expectedAnswer: 'Unknown',
      submittedAnswer: submittedAns,
      explanation: 'The question could not be found in the current session bank.',
      solutionSteps: [],
      diagnosedError: {
        errorTag: 'question_not_found',
        whyWrong: 'The question could not be found in the current session bank.',
      },
    };
  }

  const match = compareAnswers(question.expectedAnswer, submittedAns, question.tolerance);
  const isCorrect = match.matches;

  let diagnosedErrorTag: string | undefined;
  let errorExplanation: string | undefined;

  if (!isCorrect) {
    const userAnsNorm = submittedAns.trim().toLowerCase();
    const distractor = question.distractorExplanations?.find(
      (d) =>
        d.choiceId.toLowerCase() === userAnsNorm ||
        compareAnswers(submittedAns, d.choiceId).matches,
    );

    if (distractor) {
      diagnosedErrorTag = distractor.errorTag;
      errorExplanation = distractor.explanation;
    } else {
      diagnosedErrorTag = 'miscalculation';
      errorExplanation = `Your answer "${submittedAns}" differed from the expected solution "${question.expectedAnswer}".`;
    }
  }

  // Update learner ability
  const currentTheta = submission.currentTheta ?? 0.0;
  const newTheta = updateLearnerTheta(currentTheta, question.difficulty, isCorrect);

  // Spaced repetition progression
  const currentInterval = submission.intervalDays ?? 1;
  const consecutive = submission.consecutiveCorrect ?? 0;
  const spaced = calculateNextSpacedInterval(currentInterval, consecutive, isCorrect, nowIso);

  return {
    questionId: question.id,
    isCorrect,
    score: isCorrect ? 1.0 : 0.0,
    expectedAnswer: question.expectedAnswer,
    submittedAnswer: submittedAns,
    explanation: question.solutionSteps.map((s) => `${s.title}: ${s.explanation}`).join(' '),
    solutionSteps: question.solutionSteps,
    diagnosedError: diagnosedErrorTag
      ? {
          errorTag: diagnosedErrorTag,
          whyWrong: errorExplanation || 'Common conceptual mistake',
        }
      : undefined,
    updatedIrtTheta: newTheta,
    nextReviewDate: spaced.nextReviewDate,
    intervalDays: spaced.nextIntervalDays,
    consecutiveCorrect: spaced.newConsecutive,
  };
}

/**
 * Selects the next adaptive question for a student.
 */
export function getAdaptiveQuestion(
  profiles: Record<string, LearnerConceptProfile>,
  targetSubject?: string,
  targetConceptIds?: string[],
  weakConceptIds: string[] = [],
) {
  return selectNextAdaptiveQuestion({
    learnerProfiles: profiles,
    candidateQuestions: CANONICAL_QUESTION_POOL,
    targetSubject,
    targetConceptIds,
    weakConceptIds,
  });
}

/**
 * Bookmarking functions.
 */
export function toggleBookmark(questionId: string): boolean {
  if (inMemoryBookmarks.has(questionId)) {
    inMemoryBookmarks.delete(questionId);
    return false;
  } else {
    inMemoryBookmarks.add(questionId);
    return true;
  }
}

export function isBookmarked(questionId: string): boolean {
  return inMemoryBookmarks.has(questionId);
}

export function getAllBookmarkedIds(): string[] {
  return Array.from(inMemoryBookmarks);
}

/**
 * Report a question function.
 */
export function reportQuestion(questionId: string, issueType: string, description: string): string {
  const reportId = `rep-${Date.now()}`;
  inMemoryReports.set(reportId, {
    questionId,
    issueType,
    description,
    reportedAt: new Date().toISOString(),
  });
  return reportId;
}

export function getReportedCount(): number {
  return inMemoryReports.size;
}

/**
 * Creates and evaluates mock assessments.
 */
export function generateMockTestAssessment(request: MockTestRequest): GeneratedMockTest {
  return createMockTest(request, CANONICAL_QUESTION_POOL);
}

export function submitMockTestAssessment(
  test: GeneratedMockTest,
  answers: Record<string, string>,
  timeSpentSeconds: number,
): MockTestResult {
  const result = evaluateMockTest(test, answers, timeSpentSeconds, inMemoryHistoricalMockAttempts);

  // Record this attempt into session history for future percentile calculations
  inMemoryHistoricalMockAttempts.push({
    attemptId: result.testId,
    score: result.score,
    totalMarks: result.maxScore,
    percentage: result.percentage,
    completedAt: result.completedAt,
  });

  return result;
}

/**
 * Derives real stats under Rule 4 (Honest numbers).
 */
export function getQuestionBankStats(): QuestionBankStats {
  const parametricMetrics = getParametricMetrics();
  const datasetMetrics = getImportedDatasetMetrics();

  const bySubject: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  let totalVerified = 0;

  for (const q of CANONICAL_QUESTION_POOL) {
    bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    if (q.verified) {
      totalVerified++;
    }
  }

  return {
    totalQuestions: CANONICAL_QUESTION_POOL.length,
    totalVerified,
    parametricTemplatesCount: parametricMetrics.totalTemplateFamilies,
    estimatedCombinations: parametricMetrics.totalCombinationsEstimate,
    bySubject,
    byDifficulty,
  };
}
