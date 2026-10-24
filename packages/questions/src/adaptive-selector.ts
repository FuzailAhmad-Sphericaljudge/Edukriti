import type { PracticeQuestion, QuestionDifficulty } from '@edukriti/contracts';

export interface LearnerConceptProfile {
  conceptId: string;
  theta: number; // Ability score in [-3.0, +3.0]
  attempts: number;
  correctCount: number;
  lastAttemptDate?: string;
  consecutiveCorrect: number;
  intervalDays: number;
  nextReviewDate?: string;
  isWeakConcept?: boolean;
}

export interface AdaptiveSelectionOptions {
  learnerProfiles: Record<string, LearnerConceptProfile>;
  candidateQuestions: PracticeQuestion[];
  targetConceptIds?: string[];
  targetSubject?: string;
  weakConceptIds?: string[];
  nowIso?: string;
}

export interface AdaptiveSelectionResult {
  selectedQuestion: PracticeQuestion;
  targetConcept: string;
  selectionReason: string;
  estimatedProbability: number;
  currentTheta: number;
}

/**
 * Maps question difficulty string to numeric Rasch parameter b.
 */
export function difficultyToRaschB(difficulty: QuestionDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return -1.0;
    case 'medium':
      return 0.0;
    case 'hard':
      return 1.2;
    case 'olympiad':
      return 2.2;
    default:
      return 0.0;
  }
}

/**
 * Calculates probability of a correct answer under 1-PL IRT (Rasch model).
 * P(correct | theta, b) = 1 / (1 + e^-(theta - b))
 */
export function calculateProbabilityOfSuccess(theta: number, b: number): number {
  const diff = theta - b;
  return 1 / (1 + Math.exp(-diff));
}

/**
 * Updates learner ability theta using an online Rasch / Elo update rule.
 * theta_new = theta_old + K * (y - P)
 */
export function updateLearnerTheta(
  currentTheta: number,
  questionDifficulty: QuestionDifficulty,
  isCorrect: boolean,
  kFactor: number = 0.35,
): number {
  const b = difficultyToRaschB(questionDifficulty);
  const p = calculateProbabilityOfSuccess(currentTheta, b);
  const y = isCorrect ? 1.0 : 0.0;
  const newTheta = currentTheta + kFactor * (y - p);

  // Clamp ability to realistic range [-3.0, +3.0]
  return Math.max(-3.0, Math.min(3.0, Math.round(newTheta * 1000) / 1000));
}

/**
 * Calculates the next spaced repetition interval using cognitive expansion.
 */
export function calculateNextSpacedInterval(
  currentIntervalDays: number,
  consecutiveCorrect: number,
  isCorrect: boolean,
  nowIso: string = new Date().toISOString(),
): { nextIntervalDays: number; nextReviewDate: string; newConsecutive: number } {
  const nowDate = new Date(nowIso);

  if (!isCorrect) {
    // Reset to 1 day on mistake
    const nextDate = new Date(nowDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    return {
      nextIntervalDays: 1,
      nextReviewDate: nextDate.toISOString(),
      newConsecutive: 0,
    };
  }

  // Expansion progression: 1d -> 3d -> 7d -> 14d -> 30d
  const intervals = [1, 3, 7, 14, 30];
  const newConsecutive = consecutiveCorrect + 1;
  const nextIntervalIndex = Math.min(intervals.length - 1, newConsecutive);
  const nextIntervalDays = intervals[nextIntervalIndex] ?? 30;

  const nextDate = new Date(nowDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);
  return {
    nextIntervalDays,
    nextReviewDate: nextDate.toISOString(),
    newConsecutive,
  };
}

/**
 * Selects the optimal question for a learner using:
 * 1. Spaced repetition urgency (due/overdue items).
 * 2. Weak-concept remediation priority.
 * 3. Zone of Proximal Development (ZPD) targeting: preferred P(success) ~ 0.65 - 0.75.
 */
export function selectNextAdaptiveQuestion(
  options: AdaptiveSelectionOptions,
): AdaptiveSelectionResult {
  const {
    learnerProfiles,
    candidateQuestions,
    targetConceptIds,
    targetSubject,
    weakConceptIds = [],
    nowIso = new Date().toISOString(),
  } = options;

  if (candidateQuestions.length === 0) {
    throw new Error('No candidate questions available for adaptive selection.');
  }

  const nowMs = new Date(nowIso).getTime();

  // Filter candidates by target subject or target concepts if provided
  let filtered = candidateQuestions;
  if (targetSubject) {
    filtered = filtered.filter((q) => q.subject.toLowerCase() === targetSubject.toLowerCase());
  }
  if (targetConceptIds && targetConceptIds.length > 0) {
    const conceptSet = new Set(targetConceptIds.map((c) => c.toLowerCase()));
    const matching = filtered.filter((q) => q.conceptIds.some((c) => conceptSet.has(c.toLowerCase())));
    if (matching.length > 0) {
      filtered = matching;
    }
  }

  if (filtered.length === 0) {
    filtered = candidateQuestions;
  }

  const scoredCandidates: Array<{
    question: PracticeQuestion;
    primaryConcept: string;
    score: number;
    probability: number;
    theta: number;
    reason: string;
  }> = [];

  for (const q of filtered) {
    const primaryConcept = q.conceptIds[0] || 'general';
    const profile = learnerProfiles[primaryConcept] || {
      conceptId: primaryConcept,
      theta: 0.0,
      attempts: 0,
      correctCount: 0,
      consecutiveCorrect: 0,
      intervalDays: 1,
    };

    const b = difficultyToRaschB(q.difficulty);
    const prob = calculateProbabilityOfSuccess(profile.theta, b);

    let score = 0;
    let reason = 'General practice matching your proficiency level';

    // 1. Spaced Repetition Due Bonus
    if (profile.nextReviewDate) {
      const reviewMs = new Date(profile.nextReviewDate).getTime();
      if (nowMs >= reviewMs) {
        const daysOverdue = Math.max(0, Math.floor((nowMs - reviewMs) / (24 * 60 * 60 * 1000)));
        score += 60 + Math.min(20, daysOverdue * 5);
        reason = `Spaced repetition review due today for ${primaryConcept}`;
      }
    }

    // 2. Weak Concept Priority Bonus
    const isWeak = weakConceptIds.some((w) => w.toLowerCase() === primaryConcept.toLowerCase()) || profile.isWeakConcept;
    if (isWeak) {
      score += 40;
      reason = `Targeting diagnosed weak concept: ${primaryConcept}`;
    }

    // 3. Zone of Proximal Development (ZPD) optimization
    // Ideal learning probability is around 0.68 (not too easy, not frustrating)
    const zpdDistance = Math.abs(prob - 0.68);
    const zpdScore = Math.max(0, (1.0 - zpdDistance * 2.5)) * 30;
    score += zpdScore;

    // 4. Verification boost: prefer verified questions
    if (q.verified) {
      score += 10;
    }

    // 5. Penalize over-attempted difficulty mismatch (e.g. beginner getting olympiad)
    if (prob < 0.20 && profile.theta < -0.5) {
      score -= 30;
    }

    scoredCandidates.push({
      question: q,
      primaryConcept,
      score,
      probability: prob,
      theta: profile.theta,
      reason,
    });
  }

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  const best = scoredCandidates[0]!;
  return {
    selectedQuestion: best.question,
    targetConcept: best.primaryConcept,
    selectionReason: best.reason,
    estimatedProbability: Math.round(best.probability * 100) / 100,
    currentTheta: best.theta,
  };
}
