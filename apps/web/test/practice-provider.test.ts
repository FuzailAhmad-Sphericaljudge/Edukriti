import assert from 'node:assert/strict';
import test from 'node:test';

import {
  queryPracticeBank,
  findQuestionById,
  evaluateSubmission,
  getAdaptiveQuestion,
  toggleBookmark,
  isBookmarked,
  reportQuestion,
  generateMockTestAssessment,
  submitMockTestAssessment,
  getQuestionBankStats,
} from '../lib/practice-provider.ts';
import { GET as handleGetQuestions } from '../app/api/questions/route.ts';
import { POST as handleSubmitQuestion } from '../app/api/questions/submit/route.ts';
import { POST as handleAdaptiveQuestion } from '../app/api/questions/adaptive/route.ts';
import { GET as handleAdminStats } from '../app/api/admin/practice-stats/route.ts';

test('queryPracticeBank returns paginated questions with honest count and filters', () => {
  const allRes = queryPracticeBank({ page: 1, pageSize: 10 });
  assert.equal(allRes.page, 1);
  assert.equal(allRes.pageSize, 10);
  assert.equal(allRes.questions.length, 10);
  assert.ok(allRes.totalCount >= 70, `Expected totalCount >= 70, found ${allRes.totalCount}`);
  assert.equal(allRes.hasMore, true);

  // Subject filtering
  const physicsRes = queryPracticeBank({ subject: 'physics', page: 1, pageSize: 50 });
  assert.ok(physicsRes.questions.every((q) => q.subject === 'physics'));
  assert.ok(physicsRes.totalCount >= 20);

  // Concept filtering
  const ohmRes = queryPracticeBank({ conceptId: 'ohms_law', page: 1, pageSize: 20 });
  assert.ok(ohmRes.totalCount >= 1);
  assert.ok(ohmRes.questions.some((q) => q.conceptIds.includes('ohms_law')));
});

test('evaluateSubmission evaluates answer, diagnoses authentic error tag, and updates theta', () => {
  const q = findQuestionById('gsm8k-001');
  assert.ok(q, 'gsm8k-001 must exist');

  // Correct submission
  const correctEval = evaluateSubmission({
    questionId: 'gsm8k-001',
    learnerId: 'learner_test',
    userAnswer: 'a',
    currentTheta: 0.0,
    intervalDays: 1,
    consecutiveCorrect: 0,
    timeSpentSeconds: 10,
  });
  assert.equal(correctEval.isCorrect, true);
  assert.equal(correctEval.score, 1);
  assert.ok(correctEval.updatedIrtTheta! > 0.0);
  assert.equal(correctEval.consecutiveCorrect, 1);
  assert.equal(correctEval.intervalDays, 3);

  // Distractor submission with known student error
  const distractorEval = evaluateSubmission({
    questionId: 'gsm8k-001',
    learnerId: 'learner_test',
    userAnswer: 'b',
    currentTheta: 0.2,
    intervalDays: 3,
    consecutiveCorrect: 1,
    timeSpentSeconds: 20,
  });
  assert.equal(distractorEval.isCorrect, false);
  assert.equal(distractorEval.score, 0);
  assert.equal(distractorEval.diagnosedError?.errorTag, 'reported_partial_step_instead_of_total');
  assert.ok(distractorEval.diagnosedError?.whyWrong?.includes('Calculated May sales (24) but forgot to add April sales'));
  assert.ok(distractorEval.updatedIrtTheta! < 0.2);
  assert.equal(distractorEval.consecutiveCorrect, 0);
  assert.equal(distractorEval.intervalDays, 1);
});

test('getAdaptiveQuestion prioritizes weak concepts and overdue reviews', () => {
  const result = getAdaptiveQuestion(
    {
      photosynthesis_cellular_respiration: {
        conceptId: 'photosynthesis_cellular_respiration',
        theta: -0.5,
        attempts: 2,
        correctCount: 0,
        consecutiveCorrect: 0,
        intervalDays: 1,
        isWeakConcept: true,
      },
    },
    undefined,
    undefined,
    ['photosynthesis_cellular_respiration'],
  );

  assert.ok(result.selectedQuestion);
  assert.ok(result.targetConcept);
  assert.ok(result.selectionReason.includes('weak concept'));
});

test('bookmark and report functions manage student flags', () => {
  const qId = 'arc-001';
  assert.equal(isBookmarked(qId), false);

  const setTrue = toggleBookmark(qId);
  assert.equal(setTrue, true);
  assert.equal(isBookmarked(qId), true);

  const setFalse = toggleBookmark(qId);
  assert.equal(setFalse, false);
  assert.equal(isBookmarked(qId), false);

  const reportId = reportQuestion(qId, 'ambiguous_prompt', 'Option wording could be clearer.');
  assert.ok(reportId.startsWith('rep-'));
});

test('generateMockTestAssessment and submitMockTestAssessment generate and evaluate full mock test', () => {
  const mockTest = generateMockTestAssessment({
    grade: 'Grade 9',
    subjects: ['physics', 'mathematics'],
    totalQuestions: 6,
    timeLimitMinutes: 30,
  });

  assert.ok(mockTest.testId.startsWith('mock-'));
  assert.equal(mockTest.sections.length, 2);
  assert.ok(mockTest.allQuestions.length >= 4);

  const answers: Record<string, string> = {};
  for (const q of mockTest.allQuestions) {
    // Answer first 2 correctly, remainder wrongly
    if (Object.keys(answers).length < 2) {
      answers[q.id] = q.expectedAnswer;
    } else {
      answers[q.id] = 'wrong_choice';
    }
  }

  const result = submitMockTestAssessment(mockTest, answers, 600);
  assert.equal(result.score, 2);
  assert.ok(result.percentile >= 1 && result.percentile <= 99);
  assert.equal(result.sectionalAnalysis.length, 2);
  assert.ok(result.reviewSchedule.length >= 0);
});

test('getQuestionBankStats computes honest numbers without hardcoded claims', () => {
  const stats = getQuestionBankStats();

  assert.ok(stats.totalQuestions >= 70);
  assert.equal(stats.parametricTemplatesCount, 60);
  assert.ok(stats.estimatedCombinations > 50_000);
  assert.ok(stats.totalVerified > 0);
  assert.ok(stats.bySubject.physics >= 20);
  assert.ok(stats.bySubject.mathematics >= 20);
});

test('API endpoints handle query, submission, adaptive selection, and admin stats', async () => {
  // 1. GET /api/questions
  const req1 = new Request('http://localhost/api/questions?subject=physics&pageSize=5');
  const res1 = await handleGetQuestions(req1);
  assert.equal(res1.status, 200);
  const data1 = (await res1.json()) as any;
  assert.equal(data1.pageSize, 5);
  assert.ok(data1.questions.length <= 5);

  // 2. POST /api/questions/submit
  const req2 = new Request('http://localhost/api/questions/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: 'arc-001',
      learnerId: 'learner_test',
      userAnswer: 'a',
      timeSpentSeconds: 15,
    }),
  });
  const res2 = await handleSubmitQuestion(req2);
  assert.equal(res2.status, 200);
  const data2 = (await res2.json()) as any;
  assert.equal(data2.isCorrect, true);

  // 3. POST /api/questions/adaptive
  const req3 = new Request('http://localhost/api/questions/adaptive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      weakConceptIds: ['ohms_law'],
    }),
  });
  const res3 = await handleAdaptiveQuestion(req3);
  assert.equal(res3.status, 200);
  const data3 = (await res3.json()) as any;
  assert.ok(data3.selectedQuestion);

  // 4. GET /api/admin/practice-stats
  const res4 = await handleAdminStats();
  assert.equal(res4.status, 200);
  const data4 = (await res4.json()) as any;
  assert.equal(data4.parametricRegistry.totalFamilies, 60);
  assert.ok(data4.parametricRegistry.estimatedCombinations > 50_000);
  assert.equal(data4.importedDatasets.totalQuestions, 16);
});
