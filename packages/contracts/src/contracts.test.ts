import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aiHealthResponseSchema,
  assessmentAttemptRequestSchema,
  checkpointAttemptRequestSchema,
  lessonRequestSchema,
  retrievalRequestSchema,
  tutorImageAttachmentSchema,
  tutorIntentSchema,
  tutorMathVerificationSchema,
  tutorNoteSchema,
  tutorFeedbackSchema,
  tutorExportPayloadSchema,
  tutorNumericStepSchema,
  tutorPedagogicalStyleSchema,
  tutorRequestSchema,
  tutorResponseSchema,
  tutorStreamEventSchema,
  utcTimestampSchema,
} from './index.ts';

const validRequest = {
  learnerId: 'learner-demo',
  topic: 'Electricity',
  level: 'beginner',
  language: 'hinglish',
  durationMinutes: 20,
  style: 'simple_examples',
  goal: 'Understand current, voltage, and resistance',
} as const;

test('accepts the canonical lesson request', () => {
  assert.equal(lessonRequestSchema.parse(validRequest).topic, 'Electricity');
});

test('rejects a request without a topic or source', () => {
  const { topic: _topic, ...missingSource } = validRequest;
  assert.equal(lessonRequestSchema.safeParse(missingSource).success, false);
});

test('accepts only supported lesson durations', () => {
  assert.equal(lessonRequestSchema.safeParse({ ...validRequest, durationMinutes: 10 }).success, false);
});

test('requires UTC timestamps with an explicit offset', () => {
  assert.equal(utcTimestampSchema.safeParse('2026-09-04T14:30:00Z').success, true);
  assert.equal(utcTimestampSchema.safeParse('2026-09-04T14:30:00').success, false);
});

test('caps retrieval result requests', () => {
  assert.equal(retrievalRequestSchema.safeParse({ sourceId: 'source-1', query: 'current', limit: 11 }).success, false);
});

test('requires a durable idempotency key for checkpoint attempts', () => {
  const valid = checkpointAttemptRequestSchema.safeParse({ lessonId: 'lesson', checkpointId: 'checkpoint', response: 'Voltage pushes current around a circuit.', clientRequestId: '550e8400-e29b-41d4-a716-446655440000' });
  const invalid = checkpointAttemptRequestSchema.safeParse({ lessonId: 'lesson', checkpointId: 'checkpoint', response: '', clientRequestId: 'retry-me' });
  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test('rejects empty final assessment answers', () => {
  const result = assessmentAttemptRequestSchema.safeParse({ lessonId: 'lesson', questionId: 'question', response: ' ', clientRequestId: '550e8400-e29b-41d4-a716-446655440000' });
  assert.equal(result.success, false);
});

test('validates contextual tutor questions and grounded answers', () => {
  const request = tutorRequestSchema.safeParse({ lessonId: 'lesson-1', question: 'Why does this happen?', history: [{ role: 'user', content: 'What is force?' }, { role: 'assistant', content: 'Force is a push or pull.' }] });
  assert.equal(request.success, true);
  assert.equal(request.success && request.data.history.length, 2);
  assert.equal(tutorRequestSchema.safeParse({ lessonId: 'lesson-1', question: '' }).success, false);
  assert.equal(tutorRequestSchema.safeParse({ lessonId: 'lesson-1', question: 'Continue', history: Array.from({ length: 21 }, () => ({ role: 'user', content: 'Earlier question' })) }).success, false);
  assert.equal(tutorResponseSchema.safeParse({ answer: 'Because the force changes motion.', followUpQuestion: 'Can you name an example?', grounded: false, provider: 'deterministic', citations: [] }).success, true);
  assert.equal(tutorResponseSchema.safeParse({ answer: 'Because the force changes motion.', followUpQuestion: 'Can you name an example?', grounded: false, provider: 'gemini', citations: [] }).success, true);
});

test('validates expanded tutor contracts: intent, style, numeric steps, photo doubt, and streaming', () => {
  // Intent
  assert.equal(tutorIntentSchema.safeParse('numerical_problem').success, true);
  assert.equal(tutorIntentSchema.safeParse('invalid_intent').success, false);

  // Style
  assert.equal(tutorPedagogicalStyleSchema.safeParse('eli10').success, true);
  assert.equal(tutorPedagogicalStyleSchema.safeParse('deep_dive').success, true);

  // Numeric step
  const step = tutorNumericStepSchema.safeParse({
    stepNumber: 1,
    title: 'Calculate acceleration',
    formula: 'a = (v - u) / t',
    substitution: 'a = (20 - 0) / 4',
    result: '5',
    unit: 'm/s^2',
    explanation: 'Divide the change in velocity by elapsed time.',
  });
  assert.equal(step.success, true);

  // Math verification
  const verification = tutorMathVerificationSchema.safeParse({
    isVerified: true,
    computedValue: 5,
    expectedValue: 5,
    tolerance: 0.001,
    notes: 'Recomputed using kinematics formula.',
  });
  assert.equal(verification.success, true);

  // Photo doubt image attachment
  const photo = tutorImageAttachmentSchema.safeParse({
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
    caption: 'Circuit diagram problem 4',
  });
  assert.equal(photo.success, true);

  // Global standalone request without lessonId
  const globalRequest = tutorRequestSchema.safeParse({
    question: 'How do plants convert sunlight into chemical energy?',
    intent: 'concept',
    style: 'eli10',
    language: 'hinglish',
  });
  assert.equal(globalRequest.success, true);
  assert.equal(globalRequest.data?.lessonId, undefined);

  // Streaming event
  const streamDelta = tutorStreamEventSchema.safeParse({
    type: 'delta',
    text: 'Photosynthesis occurs in chloroplasts.',
  });
  assert.equal(streamDelta.success, true);

  // Tutor note
  const note = tutorNoteSchema.safeParse({
    id: 'note-123',
    question: 'What is Ohm’s law?',
    answer: 'V = IR relating potential difference and current.',
    intent: 'concept',
    subject: 'Physics',
    tags: ['electricity', 'circuits'],
    savedAt: '2026-10-23T11:00:00Z',
  });
  assert.equal(note.success, true);
});

test('validates AI health response schema', () => {
  const validHealth = {
    status: 'healthy',
    provider: 'gemini',
    configuredProvider: 'gemini',
    model: 'gemini-2.5-flash',
    latencyMs: 120,
    timestamp: '2026-10-23T10:00:00Z',
    features: {
      lessonGeneration: true,
      tutor: true,
      checkpointEvaluation: true,
      adaptiveAssessment: true,
      offlineFallbackReady: true,
    },
    credentials: {
      geminiConfigured: true,
      openaiConfigured: false,
    },
    error: null,
  };
  assert.equal(aiHealthResponseSchema.safeParse(validHealth).success, true);
  assert.equal(aiHealthResponseSchema.safeParse({ ...validHealth, status: 'invalid' }).success, false);
});

test('validates tutor student feedback and note export schemas', () => {
  const validFeedback = {
    id: 'fb-001',
    rating: 'positive',
    comment: 'Great step-by-step breakdown of Ohm law!',
    questionSnippet: 'Calculate the resistance in a 24V circuit',
    timestamp: '2026-10-23T12:00:00Z',
  };
  assert.equal(tutorFeedbackSchema.safeParse(validFeedback).success, true);
  assert.equal(tutorFeedbackSchema.safeParse({ ...validFeedback, rating: 'invalid_rating' }).success, false);

  const validExport = {
    format: 'markdown',
    notes: [
      {
        id: 'note-1',
        question: 'What is Newton second law?',
        answer: 'F = m*a with force in Newtons.',
        intent: 'concept',
        tags: ['physics', 'mechanics'],
        savedAt: '2026-10-23T12:05:00Z',
      },
    ],
    exportedAt: '2026-10-23T12:10:00Z',
  };
  assert.equal(tutorExportPayloadSchema.safeParse(validExport).success, true);
  assert.equal(tutorExportPayloadSchema.safeParse({ ...validExport, notes: [] }).success, false);
});
