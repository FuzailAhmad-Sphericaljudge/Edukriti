import assert from 'node:assert/strict';
import test from 'node:test';

import { lessonRequestSchema, retrievalRequestSchema, utcTimestampSchema } from './index.ts';

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
