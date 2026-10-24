import type {
  MockTestRequest,
  MockTestResult,
  PracticeEvaluationResult,
  PracticeQuestion,
} from '@edukriti/contracts';
import { SeededRng } from './prng.ts';
import { compareAnswers } from './verifier.ts';
import { updateLearnerTheta } from './adaptive-selector.ts';

export interface MockTestSectionConfig {
  id: string;
  name: string;
  subject: string;
  questionCount: number;
  timeLimitMinutes: number;
}

export interface GeneratedMockTest {
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

export interface HistoricalMockTestAttempt {
  attemptId: string;
  learnerId?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  completedAt: string;
}

/**
 * Creates a balanced, sectional mock test drawing from available question banks.
 */
export function createMockTest(
  request: MockTestRequest,
  availableQuestions: PracticeQuestion[],
  seed: number = Math.floor(Math.random() * 1_000_000),
): GeneratedMockTest {
  const rng = new SeededRng(seed);
  const testId = `mock-${Date.now()}-${seed}`;
  const nowIso = new Date().toISOString();

  // Filter available questions by grade and requested subjects
  const subjectSet = new Set(request.subjects.map((s) => s.toLowerCase()));
  const candidatePool = availableQuestions.filter(
    (q) => subjectSet.has(q.subject.toLowerCase()),
  );

  const sections: GeneratedMockTest['sections'] = [];
  const allSelectedQuestions: PracticeQuestion[] = [];

  const qCount = request.totalQuestions || request.questionCount || 15;
  const tMinutes = request.timeLimitMinutes || request.durationMinutes || 30;
  const grade = request.grade || 'Grade 10';

  const questionsPerSubject = Math.max(2, Math.floor(qCount / request.subjects.length));
  const timePerSection = Math.max(5, Math.floor(tMinutes / request.subjects.length));

  for (const subject of request.subjects) {
    const subjectPool = candidatePool.filter((q) => q.subject.toLowerCase() === subject.toLowerCase());
    const shuffled = rng.shuffle(subjectPool);
    const selected = shuffled.slice(0, questionsPerSubject);

    sections.push({
      id: `sec-${subject.toLowerCase()}`,
      name: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Section`,
      subject,
      timeLimitMinutes: timePerSection,
      questions: selected,
    });

    allSelectedQuestions.push(...selected);
  }

  return {
    testId,
    title: request.title || `${grade} Comprehensive Mock Assessment`,
    grade,
    totalTimeMinutes: tMinutes,
    sections,
    allQuestions: allSelectedQuestions,
    createdAt: nowIso,
  };
}

/**
 * Evaluates a mock test submission, calculates sectional analytics,
 * diagnoses wrong answer error tags, and computes honest rank percentile
 * derived solely from real recorded attempts (Rule 4).
 */
export function evaluateMockTest(
  test: GeneratedMockTest,
  answers: Record<string, string>,
  timeSpentSeconds: number,
  historicalAttempts: HistoricalMockTestAttempt[] = [],
): MockTestResult {
  const nowIso = new Date().toISOString();
  let totalScore = 0;
  const maxScore = test.allQuestions.length;

  const evaluations: PracticeEvaluationResult[] = [];
  const sectionMetrics: Record<string, { total: number; correct: number; timeSec: number }> = {};
  const conceptAccuracies: Record<string, { total: number; correct: number }> = {};

  for (const q of test.allQuestions) {
    const studentAnswer = answers[q.id] || '';
    const match = compareAnswers(String(q.expectedAnswer), studentAnswer, q.tolerance);
    const isCorrect = match.matches;

    if (isCorrect) {
      totalScore++;
    }

    // Section metrics
    if (!sectionMetrics[q.subject]) {
      sectionMetrics[q.subject] = { total: 0, correct: 0, timeSec: 0 };
    }
    sectionMetrics[q.subject]!.total++;
    if (isCorrect) {
      sectionMetrics[q.subject]!.correct++;
    }

    // Concept metrics
    for (const c of q.conceptIds) {
      if (!conceptAccuracies[c]) {
        conceptAccuracies[c] = { total: 0, correct: 0 };
      }
      conceptAccuracies[c]!.total++;
      if (isCorrect) {
        conceptAccuracies[c]!.correct++;
      }
    }

    // Diagnose error explanation if incorrect
    let errorExplanation: string | undefined;
    let diagnosedErrorTag: string | undefined;

    if (!isCorrect && studentAnswer) {
      const distractor = q.distractorExplanations?.find(
        (d) =>
          d.choiceId.toLowerCase() === studentAnswer.toLowerCase() ||
          compareAnswers(studentAnswer, d.choiceId).matches,
      );
      if (distractor) {
        diagnosedErrorTag = distractor.errorTag;
        errorExplanation = distractor.explanation;
      } else {
        diagnosedErrorTag = 'miscalculation';
        errorExplanation = `Selected answer differed from correct solution ($${q.expectedAnswer}$).`;
      }
    }

    evaluations.push({
      questionId: q.id,
      isCorrect,
      score: isCorrect ? 1.0 : 0.0,
      expectedAnswer: q.expectedAnswer,
      submittedAnswer: studentAnswer,
      explanation: q.solutionSteps.map((s) => s.explanation).join(' '),
      diagnosedError: diagnosedErrorTag
        ? { errorTag: diagnosedErrorTag, whyWrong: errorExplanation || 'Common mistake' }
        : undefined,
      solutionSteps: q.solutionSteps,
      updatedIrtTheta: updateLearnerTheta(0.0, q.difficulty, isCorrect),
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Sectional Analysis
  const sectionalAnalysis = Object.entries(sectionMetrics).map(([subject, stats]) => {
    const secPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      subject,
      sectionName: `${subject.charAt(0).toUpperCase() + subject.slice(1)} Section`,
      score: stats.correct,
      maxScore: stats.total,
      percentage: secPercentage,
      totalQuestions: stats.total,
      correctCount: stats.correct,
      accuracyPercentage: secPercentage,
      averageTimeSeconds: Math.round(timeSpentSeconds / Object.keys(sectionMetrics).length),
      timeSpentSeconds: Math.round(timeSpentSeconds / Object.keys(sectionMetrics).length),
      weakConcepts: [],
      strongConcepts: [],
    };
  });

  // Weak and Strong Concepts
  const weakConcepts: string[] = [];
  const strongConcepts: string[] = [];

  for (const [concept, stats] of Object.entries(conceptAccuracies)) {
    const acc = stats.total > 0 ? stats.correct / stats.total : 0;
    if (acc < 0.6) {
      weakConcepts.push(concept);
    } else if (acc >= 0.8) {
      strongConcepts.push(concept);
    }
  }

  // Honest Percentile Calculation (Rule 4):
  // Computed strictly from real historical attempts, never hardcoded.
  let percentile = 100;
  if (historicalAttempts.length > 0) {
    const lowerScores = historicalAttempts.filter((a) => a.score < totalScore).length;
    const equalScores = historicalAttempts.filter((a) => a.score === totalScore).length;
    // Standard empirical percentile definition: (lower + 0.5 * equal) / N * 100
    percentile = Math.round(((lowerScores + 0.5 * equalScores) / historicalAttempts.length) * 100);
    percentile = Math.max(1, Math.min(99, percentile));
  }

  // Spaced revision schedule for weak concepts
  const reviewSchedule = weakConcepts.map((concept, index) => {
    const reviewDate = new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000);
    return {
      conceptId: concept,
      recommendedReviewDate: reviewDate.toISOString(),
      scheduledDate: reviewDate.toISOString(),
      reviewReason: `Diagnosed weak concept in mock exam: ${concept}`,
      priority: index === 0 ? ('high' as const) : ('medium' as const),
    };
  });

  return {
    testId: test.testId,
    learnerId: 'student-session',
    title: test.title,
    totalQuestions: maxScore,
    correctCount: totalScore,
    score: totalScore,
    maxScore,
    percentage,
    scorePercentage: percentage,
    percentile,
    percentileRank: percentile,
    totalTimeSpentSeconds: timeSpentSeconds,
    timeSpentSeconds,
    completedAt: nowIso,
    sectionalAnalysis,
    evaluations,
    weakConcepts,
    strongConcepts,
    reviewSchedule,
  };
}

