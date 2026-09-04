import assert from 'node:assert/strict';
import test from 'node:test';

import { assessmentAttemptRequestSchema, checkpointAttemptRequestSchema, lessonRequestSchema, retrievalRequestSchema, utcTimestampSchema } from './index.ts';

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
