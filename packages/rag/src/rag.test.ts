import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chunkPages,
  normalizeText,
  rankChunks,
  retrieveFromKnowledgeBase,
  validateClaimsAgainstEvidence,
  CURATED_KNOWLEDGE_BASE,
} from './index.ts';

test('normalizes document text without joining paragraphs', () => {
  assert.equal(normalizeText('Voltage   pushes\r\n\r\n\r\ncurrent.'), 'Voltage pushes\n\ncurrent.');
});

test('returns no chunks for empty pages', () => {
  assert.deepEqual(chunkPages([{ page: 1, text: '   ' }]), []);
});

test('splits long pages with bounded overlap and page citations', () => {
  const chunks = chunkPages([{ page: 4, text: 'Resistance controls current. '.repeat(40) }], { maxChars: 320, overlapChars: 60 });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.pageStart === 4 && chunk.text.length <= 320));
});

test('ranks concept matches ahead of unrelated chunks', () => {
  const chunks = chunkPages([
    { page: 1, text: 'Plants use sunlight during photosynthesis.' },
    { page: 2, text: 'Ohm law explains how resistance affects electric current.' },
  ]).map((chunk) => ({ ...chunk, id: `chunk-${chunk.index}` }));
  const ranked = rankChunks(chunks, 'How does resistance affect current?', 2);
  assert.equal(ranked[0]?.pageStart, 2);
});

test('retrieval is a no-op for punctuation-only queries', () => {
  const chunks = [{ id: 'chunk-1', index: 0, pageStart: 1, pageEnd: 1, text: 'Current flows.', tokenCount: 2 }];
  assert.deepEqual(rankChunks(chunks, '???', 3), []);
});

test('retrieveFromKnowledgeBase matches curated curriculum topics with citations', () => {
  assert.ok(CURATED_KNOWLEDGE_BASE.length >= 10);

  // Physics query
  const physicsResult = retrieveFromKnowledgeBase('What is Newton second law and formula?');
  assert.equal(physicsResult.isGrounded, true);
  assert.ok(physicsResult.chunks.length > 0);
  assert.equal(physicsResult.citations[0]?.title.includes('Newton'), true);
  assert.equal(physicsResult.citations[0]?.source.includes('OpenStax'), true);

  // Biology query
  const bioResult = retrieveFromKnowledgeBase('How does chlorophyll absorb light during photosynthesis?');
  assert.equal(bioResult.isGrounded, true);
  assert.equal(bioResult.chunks[0]?.subject, 'biology');
  assert.ok(bioResult.citations.length > 0);
});

test('retrieveFromKnowledgeBase labels ungrounded queries as not from course material', () => {
  const result = retrieveFromKnowledgeBase('What was the football score in the Premier League final 2024?');
  assert.equal(result.isGrounded, false);
  assert.equal(result.sourceAttributionNotice, 'not from course material');
  assert.deepEqual(result.citations, []);
});

test('validateClaimsAgainstEvidence flags unsupported citations and verifies valid claims', () => {
  const chunks = CURATED_KNOWLEDGE_BASE.filter((c) => c.subject === 'physics');
  const validAnswer = "According to Newton's second law, force is proportional to acceleration: F = m*a [1]. Work done is measured in Joules [2].";
  const validCheck = validateClaimsAgainstEvidence(validAnswer, chunks);
  assert.equal(validCheck.isValid, true);
  assert.ok(validCheck.supportScore >= 0.7);

  const hallucinatedAnswer = "According to Newton's law [1], gravity is caused by microscopic invisible fairies spinning strings in hyper-dimensions.";
  const invalidCheck = validateClaimsAgainstEvidence(hallucinatedAnswer, chunks);
  assert.equal(invalidCheck.isValid, false);
  assert.ok(invalidCheck.unsupportedClaims.length > 0);
});
