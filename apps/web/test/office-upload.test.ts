import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseDocxDocument,
  parsePptxDocument,
  createSampleDocx,
  createSamplePptx,
  chunkPages,
} from '@edukriti/rag';
import { buildDeterministicLessonPlan } from '@edukriti/teaching-engine';
import type { LessonRequest } from '@edukriti/contracts';

test('DOCX ingestion parses chapters into page chunks and supports grounded lesson planning with citations', () => {
  const docxBytes = createSampleDocx([
    [
      'Principles of Chemical Bonding.',
      'An ionic bond is formed when valence electrons are transferred from a metal to a nonmetal.',
    ],
    [
      'Covalent Bonding Mechanisms.',
      'Covalent bonds form when atoms share pairs of valence electrons to attain a stable octet.',
    ],
  ]);

  const pages = parseDocxDocument(docxBytes);
  assert.equal(pages.length, 2);
  assert.equal(pages[0]?.page, 1);
  assert.equal(pages[1]?.page, 2);

  const chunks = chunkPages(pages);
  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0]?.pageStart, 1);
  assert.equal(chunks[1]?.pageStart, 2);

  const evidence = chunks.map((c) => ({
    sourceId: 'doc-source-1',
    chunkId: `chunk-${c.index}`,
    page: c.pageStart,
    text: c.text,
  }));

  const request: LessonRequest = {
    learnerId: 'test-learner',
    topic: 'Chemical Bonding and Octet Rule',
    level: 'intermediate',
    language: 'english',
    durationMinutes: 20,
    style: 'simple_examples',
    goal: 'Understand ionic and covalent bonding from uploaded notes',
  };

  const plan = buildDeterministicLessonPlan(request, evidence);
  assert.ok(plan.segments.length > 0);
  assert.ok(plan.segments[0]?.citations.length! > 0);
  assert.equal(plan.segments[0]?.citations[0]?.page, 1);
});

test('PPTX presentation ingestion parses slides into discrete slide pages for lecture slides', () => {
  const pptxBytes = createSamplePptx([
    ['Slide 1: DNA Structure', 'DNA is composed of two antiparallel polynucleotide strands.'],
    ['Slide 2: Complementary Base Pairing', 'Adenine pairs with thymine via two hydrogen bonds; guanine pairs with cytosine.'],
    ['Slide 3: DNA Replication Fork', 'DNA polymerase synthesizes the leading strand continuously in the 5 to 3 prime direction.'],
  ]);

  const pages = parsePptxDocument(pptxBytes);
  assert.equal(pages.length, 3);
  assert.equal(pages[0]?.page, 1);
  assert.equal(pages[1]?.page, 2);
  assert.equal(pages[2]?.page, 3);

  const chunks = chunkPages(pages);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[2]?.pageStart, 3);
  assert.ok(chunks[2]?.text.includes('DNA polymerase'));
});
