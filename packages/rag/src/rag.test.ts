import assert from 'node:assert/strict';
import test from 'node:test';

import { chunkPages, normalizeText, rankChunks } from './index.ts';

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
