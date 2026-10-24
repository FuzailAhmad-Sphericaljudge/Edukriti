import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aiHealthResponseSchema,
  assessmentAttemptRequestSchema,
  checkpointAttemptRequestSchema,
  checkpointRubricSchema,
  commonMisconceptionItemSchema,
  lessonAdaptationSchema,
  lessonPlanSchema,
  lessonRequestSchema,
  retrievalRequestSchema,
  responseEvaluationSchema,
  spacedRevisionPromptSchema,
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
  visualInteractiveManifestSchema,
  getVettedVisualRegistry,
  findVettedVisual,
  validateVisualSelection,
  suggestVisualForTopic,
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

test('validates visualInteractiveManifestSchema for diagram, scene3d, sim, and lab', () => {
  const simManifest = {
    kind: 'sim',
    id: 'circuit-builder-dc',
    params: { voltage: 12, resistance: 4 },
    narrationCues: [
      { atSecond: 3, action: 'highlight_battery', label: '12V DC Source' },
      { atSecond: 8, action: 'show_current_flow', label: '3A Current' },
    ],
  };
  assert.equal(visualInteractiveManifestSchema.safeParse(simManifest).success, true);

  const labManifest = {
    kind: 'lab',
    id: 'projectile-motion-lab',
    params: { launchAngle: 45, initialVelocity: 20 },
    narrationCues: [],
  };
  assert.equal(visualInteractiveManifestSchema.safeParse(labManifest).success, true);

  // Rejects invalid kind
  assert.equal(visualInteractiveManifestSchema.safeParse({ kind: 'arbitrary_code', id: 'hack' }).success, false);
});

test('validates checkpointRubricSchema and commonMisconceptionItemSchema', () => {
  const rubric = {
    checkpointId: 'cp-01',
    targetConcept: 'Ohm’s Law',
    keyIdeas: [
      'Current is directly proportional to voltage across a conductor.',
      'Resistance acts as opposition to current flow: R = V / I.',
    ],
    commonMisconceptions: [
      {
        misconception: 'Believing voltage is consumed or used up like fuel.',
        triggerPatterns: ['voltage gets used up', 'battery loses all volts'],
        explanationCorrection: 'Voltage is the potential difference driving charge; current flow transfers energy but charges are conserved.',
        recommendedStrategy: 'new_analogy',
      },
    ],
    passingCriteria: 'Student must mention proportional relation between V and I or resistance opposing current.',
  };
  assert.equal(checkpointRubricSchema.safeParse(rubric).success, true);
});

test('validates adaptive re-teaching v2 strategies and response evaluation', () => {
  const evalResult = {
    checkpointId: 'cp-01',
    isCorrect: false,
    confidence: 0.9,
    understoodConcepts: [],
    misconception: 'Voltage is consumed',
    feedback: 'Remember, voltage is electric pressure, not fuel.',
    nextAction: 'new_analogy',
    rubricScore: 35,
    missingKeyIdeas: ['Resistance formula R = V / I'],
    detectedMisconceptions: ['Voltage is consumed'],
  };
  assert.equal(responseEvaluationSchema.safeParse(evalResult).success, true);

  const adaptation = {
    strategy: 'worked_example',
    title: 'Worked Example: Calculating Resistance',
    explanation: 'Let us compute current given 24V supply and 8 ohm resistor step by step.',
    visualType: 'equation',
    visualBrief: 'Show V = IR step by step',
    wasEffective: true,
    remediationAttempt: 1,
  };
  assert.equal(lessonAdaptationSchema.safeParse(adaptation).success, true);
});

test('validates lessonPlanSchema with interactive manifests, variantMode, and spacedRevision', () => {
  const plan = {
    id: 'lesson-101',
    learnerId: 'learner-1',
    title: 'Electric Circuits & Ohm’s Law',
    objectives: ['Master V=IR', 'Calculate series resistance'],
    language: 'english',
    durationMinutes: 20,
    variantMode: 'practical',
    prerequisiteConcepts: ['Electric charge', 'Potential difference'],
    conceptGraphNodes: ['charge', 'voltage', 'current', 'resistance', 'circuits'],
    spacedRevision: [
      {
        intervalDays: 1,
        concept: 'Ohm’s Law',
        prompt: 'State Ohm’s law equation and the SI unit of resistance.',
        format: 'quick_problem',
      },
      {
        intervalDays: 3,
        concept: 'Resistance in Series',
        prompt: 'If two 4Ω resistors are in series, what is the equivalent resistance?',
        format: 'flashcard',
      },
    ],
    segments: [
      {
        id: 'seg-1',
        title: 'Circuit Foundations',
        objective: 'Observe current flow in a closed loop',
        estimatedMinutes: 5,
        narration: 'Look at how the battery pushes charge through the circuit.',
        visualType: 'diagram',
        visualBrief: 'Interactive circuit with battery and bulb',
        interactive: {
          kind: 'sim',
          id: 'circuit-builder-dc',
          params: { voltage: 12 },
          narrationCues: [{ atSecond: 2, action: 'connect_switch' }],
        },
        citations: [],
      },
    ],
    createdAt: '2026-10-24T10:00:00Z',
  };
  assert.equal(lessonPlanSchema.safeParse(plan).success, true);
});

test('vetted visual registry validates parameters and rejects unknown IDs', () => {
  const registry = getVettedVisualRegistry();
  assert.ok(registry.length >= 10);

  const entry = findVettedVisual('circuit-builder-dc');
  assert.equal(entry?.kind, 'sim');
  assert.equal(entry?.subject, 'physics');

  // Valid params
  const valid = validateVisualSelection('circuit-builder-dc', { voltage: 24, resistance: 8 });
  assert.equal(valid.isValid, true);
  assert.equal(valid.validatedParams?.voltage, 24);
  assert.equal(valid.validatedParams?.resistance, 8);

  // Rejects unregistered ID
  const invalidId = validateVisualSelection('random-hack-sim', {});
  assert.equal(invalidId.isValid, false);
  assert.match(invalidId.error || '', /not registered/i);

  // Rejects out-of-bound params
  const outOfBounds = validateVisualSelection('circuit-builder-dc', { voltage: 9999 });
  assert.equal(outOfBounds.isValid, false);
  assert.match(outOfBounds.error || '', /voltage/i);

  // Suggestions for STEM topics
  const circuitSug = suggestVisualForTopic('Ohm’s law and simple circuits');
  assert.equal(circuitSug?.id, 'circuit-builder-dc');

  const orbitSug = suggestVisualForTopic('Kepler laws of planetary orbit');
  assert.equal(orbitSug?.id, 'gravity-orbital-sim');
});
