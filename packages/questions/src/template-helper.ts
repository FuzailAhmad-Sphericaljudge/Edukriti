import type { PracticeQuestion, QuestionDifficulty } from '@edukriti/contracts';
import { SeededRng } from './prng.ts';
import type { ParameterRangeDef, ParametricTemplate } from './types.ts';

export function makeChoicesWithDistractors(
  correctAnswerText: string,
  distractors: Array<{ text: string; errorTag: string; explanation: string }>,
  rng: SeededRng,
): {
  choices: Array<{ id: string; text: string }>;
  expectedAnswer: string;
  distractorExplanations: Array<{ choiceId: string; errorTag: string; explanation: string }>;
} {
  // Ensure distractors are unique and don't match the correct answer
  const seenTexts = new Set<string>([correctAnswerText.trim()]);
  const validDistractors: typeof distractors = [];

  for (const d of distractors) {
    const trimmed = d.text.trim();
    if (!seenTexts.has(trimmed)) {
      seenTexts.add(trimmed);
      validDistractors.push(d);
    }
  }

  // If fewer than 3 distractors, synthesize plausible numeric shifts
  let fallbackCount = 1;
  while (validDistractors.length < 3) {
    const num = parseFloat(correctAnswerText);
    const altText = !isNaN(num)
      ? (num + fallbackCount * 2).toFixed(2).replace(/\.00$/, '')
      : `${correctAnswerText} (Option ${fallbackCount})`;
    if (!seenTexts.has(altText)) {
      seenTexts.add(altText);
      validDistractors.push({
        text: altText,
        errorTag: 'arithmetic_variance',
        explanation: 'Calculation offset error.',
      });
    }
    fallbackCount++;
  }

  // Pick top 3 distractors
  const chosenDistractors = validDistractors.slice(0, 3);
  const rawItems = [
    { isCorrect: true, text: correctAnswerText, errorTag: '', explanation: '' },
    ...chosenDistractors.map((d) => ({ isCorrect: false, text: d.text, errorTag: d.errorTag, explanation: d.explanation })),
  ];

  // Shuffle items deterministically
  const shuffled = rng.shuffle(rawItems);
  const choiceIds = ['a', 'b', 'c', 'd'];
  const choices: Array<{ id: string; text: string }> = [];
  const distractorExplanations: Array<{ choiceId: string; errorTag: string; explanation: string }> = [];
  let expectedAnswer = 'a';

  shuffled.forEach((item, index) => {
    const id = choiceIds[index] || `opt-${index}`;
    choices.push({ id, text: item.text });
    if (item.isCorrect) {
      expectedAnswer = id;
    } else {
      distractorExplanations.push({
        choiceId: id,
        errorTag: item.errorTag,
        explanation: item.explanation,
      });
    }
  });

  return { choices, expectedAnswer, distractorExplanations };
}

export function calcCombinations(ranges: Record<string, ParameterRangeDef>): number {
  let total = 1;
  for (const range of Object.values(ranges)) {
    const step = range.step && range.step > 0 ? range.step : 1;
    const count = Math.max(1, Math.floor((range.max - range.min) / step) + 1);
    total *= count;
  }
  return total;
}

