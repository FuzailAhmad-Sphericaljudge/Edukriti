import assert from 'node:assert/strict';
import test from 'node:test';
import { tutorRequestSchema } from '@edukriti/contracts';
import { POST as feedbackPost } from '../app/api/tutor/feedback/route.ts';

test('POST /api/tutor/feedback accepts valid student feedback', async () => {
  const req = new Request('http://localhost:3000/api/tutor/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'fb-test-01',
      rating: 'positive',
      comment: 'Very clear explanation of photosynthesis!',
      questionSnippet: 'How do plants make glucose?',
      timestamp: '2026-10-23T12:00:00Z',
    }),
  });

  const res = await feedbackPost(req);
  assert.equal(res.status, 200);
  const data = (await res.json()) as { success: boolean; feedbackId: string };
  assert.equal(data.success, true);
  assert.equal(data.feedbackId, 'fb-test-01');
});

test('POST /api/tutor/feedback rejects malformed feedback payload', async () => {
  const req = new Request('http://localhost:3000/api/tutor/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'fb-bad',
      rating: 'unknown_rating',
    }),
  });

  const res = await feedbackPost(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as { error: { code: string } };
  assert.equal(data.error.code, 'INVALID_TUTOR_FEEDBACK');
});

test('tutorRequestSchema rejects empty question strings', () => {
  const result = tutorRequestSchema.safeParse({
    question: '',
  });
  assert.equal(result.success, false);
});

test('tutorRequestSchema validates multimodal image attachments and styles', () => {
  const result = tutorRequestSchema.safeParse({
    question: 'Solve this circuit question from the photo',
    style: 'exam_style',
    language: 'hinglish',
    image: {
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      caption: 'circuit-diagram.png',
    },
    history: [
      { role: 'user', content: 'What is Ohm Law?' },
      { role: 'assistant', content: 'Ohm law states V = IR.' },
    ],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.style, 'exam_style');
    assert.equal(result.data.language, 'hinglish');
    assert.equal(result.data.image?.mimeType, 'image/png');
    assert.equal(result.data.history?.length, 2);
  }
});
