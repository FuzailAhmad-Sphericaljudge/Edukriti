import assert from 'node:assert/strict';
import test from 'node:test';
import { exportConversationAsMarkdown, type ExportableMessage } from '../lib/tutor-export.ts';

test('exportConversationAsMarkdown formats empty session correctly', () => {
  const md = exportConversationAsMarkdown([], 'Chemistry Basics');
  assert.ok(md.includes('# Ask Aarohi Study Session Notes'));
  assert.ok(md.includes('Chemistry Basics'));
  assert.ok(md.includes('No questions recorded'));
});

test('exportConversationAsMarkdown outputs user doubts, math notes, and citations', () => {
  const messages: ExportableMessage[] = [
    {
      role: 'user',
      content: 'A circuit has 12V and 4 ohms resistor. What is current?',
    },
    {
      role: 'assistant',
      content: 'Using Ohm Law, I = V / R = 3 A.',
      response: {
        answer: 'Using Ohm Law, I = V / R = 3 A.',
        followUpQuestion: 'Would you like to try with 24V?',
        grounded: true,
        knowledgeBaseGrounded: true,
        safetyPassed: true,
        provider: 'deterministic',
        citations: [
          {
            sourceId: 'phys-book',
            chunkId: 'c1',
            title: 'Electric Current & Ohm Law',
            excerpt: 'Ohm law states V = IR.',
            page: 210,
          },
        ],
        intent: 'numerical_problem',
        style: 'default',
        isMathOrNumerical: true,
        steps: [],
        suggestedQuestions: [],
        mathVerification: {
          isVerified: true,
          computedValue: 3,
          expectedValue: 3,
          notes: 'Recomputation verified: I = V / R yields 3 A.',
        },
      },
    },
  ];

  const md = exportConversationAsMarkdown(messages, 'Electricity');
  assert.ok(md.includes('### 🙋 Doubt #1'));
  assert.ok(md.includes('### 👩‍🏫 Aarohi Explanation'));
  assert.ok(md.includes('Verified Calculation:'));
  assert.ok(md.includes('Electric Current & Ohm Law'));
});
