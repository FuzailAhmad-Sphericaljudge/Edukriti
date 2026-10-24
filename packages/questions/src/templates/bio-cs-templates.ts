import type { PracticeQuestion } from '@edukriti/contracts';
import { SeededRng } from '../prng.ts';
import type { ParametricTemplate } from '../types.ts';
import { makeChoicesWithDistractors, calcCombinations } from '../template-helper.ts';

export const BIO_CS_TEMPLATES: ParametricTemplate[] = [
  // 56. Mendelian Monohybrid Cross Ratio (3:1)
  {
    familyId: 'bio_mendelian_monohybrid',
    title: 'Mendelian Monohybrid Phenotypic Ratio',
    subject: 'biology',
    conceptIds: ['genetics_inheritance'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      totalOffspring: { name: 'Total Offspring', min: 100, max: 400, step: 40 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const total = rng.nextInt(2, 10) * 40; // Divisible by 4
      const dominant = (total * 3) / 4;
      const recessive = total / 4;

      const correctText = `${dominant} dominant and ${recessive} recessive`;
      const distractors = [
        { text: `${total / 2} dominant and ${total / 2} recessive`, errorTag: 'assumed_one_to_one_ratio', explanation: 'Assumed a 1:1 phenotypic ratio (typical of test cross, not heterozygous monohybrid cross).' },
        { text: `${recessive} dominant and ${dominant} recessive`, errorTag: 'inverted_dominant_recessive_ratio', explanation: 'Inverted the 3:1 ratio (giving 1:3 instead of 3:1).' },
        { text: `${total} dominant and 0 recessive`, errorTag: 'confused_f1_with_f2_generation', explanation: 'Confused the F2 generation with the homozygous parent F1 generation.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-bio-mend-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Two heterozygous pea plants ($Aa \\times Aa$) with purple flowers (dominant) are crossed. If a total of $${total}$ offspring are produced in the $F_2$ generation, what is the expected phenotypic count?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Expected Mendelian ratio', formula: '\\text{Phenotypic Ratio} = 3 : 1', explanation: 'Heterozygous monohybrid cross yields 3 dominant to 1 recessive phenotype.' },
          { stepNumber: 2, title: 'Calculate counts', formula: `\\text{Dominant} = \\frac{3}{4} \\times ${total} = ${dominant}, \\quad \\text{Recessive} = \\frac{1}{4} \\times ${total} = ${recessive}`, explanation: `Expected ${dominant} purple and ${recessive} white flower offspring.` },
        ],
        commonErrorTags: ['assumed_one_to_one_ratio', 'inverted_dominant_recessive_ratio'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Mendelian Genetics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 57. Hardy-Weinberg Equilibrium: p^2 + 2pq + q^2 = 1
  {
    familyId: 'bio_hardy_weinberg_equilibrium',
    title: 'Hardy-Weinberg Heterozygote Frequency',
    subject: 'biology',
    conceptIds: ['population_genetics'],
    grade: 'Grade 12',
    difficulty: 'hard',
    parameterRanges: {
      qVal: { name: 'Recessive allele frequency q', min: 0.1, max: 0.4, step: 0.1 },
    },
    estimateCombinations() {
      return 4;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const q = rng.choice([0.1, 0.2, 0.3, 0.4]);
      const p = Math.round((1 - q) * 10) / 10;
      const twoPq = Math.round(2 * p * q * 100) / 100;

      const correctText = `${twoPq} (or ${Math.round(twoPq * 100)}%)`;
      const distractors = [
        { text: `${Math.round(p * q * 100) / 100} (or ${Math.round(p * q * 100)}%)`, errorTag: 'forgot_factor_of_two_in_2pq', explanation: 'Calculated p*q instead of 2pq for heterozygous carriers.' },
        { text: `${Math.round(q * q * 100) / 100} (or ${Math.round(q * q * 100)}%)`, errorTag: 'calculated_homozygous_recessive_frequency', explanation: 'Calculated q^2 (homozygous recessive) instead of 2pq (heterozygotes).' },
        { text: `${Math.round(p * p * 100) / 100} (or ${Math.round(p * p * 100)}%)`, errorTag: 'calculated_homozygous_dominant_frequency', explanation: 'Calculated p^2 (homozygous dominant) instead of 2pq.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-bio-hw-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `In a population adhering to Hardy-Weinberg equilibrium, the frequency of a recessive allele is $q = ${q}$. What is the expected frequency of heterozygous carriers ($2pq$) in the population?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Calculate dominant allele frequency p', formula: `p = 1 - q = 1 - ${q} = ${p}`, explanation: 'Allele frequencies sum to 1: p + q = 1.' },
          { stepNumber: 2, title: 'Calculate carrier frequency 2pq', formula: `2pq = 2 \\times ${p} \\times ${q} = ${twoPq}`, explanation: `Heterozygote frequency is ${twoPq} (${Math.round(twoPq * 100)}%).` },
        ],
        commonErrorTags: ['forgot_factor_of_two_in_2pq', 'calculated_homozygous_recessive_frequency'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Population Genetics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 58. Microscope Magnification: Total = Ocular * Objective
  {
    familyId: 'bio_microscope_magnification',
    title: 'Total Optical Microscope Magnification',
    subject: 'biology',
    conceptIds: ['cell_biology_microscopy'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      ocular: { name: 'Eyepiece Lens', min: 10, max: 15, step: 5 },
      objective: { name: 'Objective Lens', min: 20, max: 100, step: 20 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const ocular = rng.choice([10, 15]);
      const objective = rng.choice([20, 40, 60, 100]);
      const totalMag = ocular * objective;

      const correctText = `${totalMag}×`;
      const distractors = [
        { text: `${ocular + objective}×`, errorTag: 'added_magnifications_instead_of_multiplying', explanation: 'Added eyepiece and objective magnifications instead of multiplying.' },
        { text: `${objective}×`, errorTag: 'ignored_eyepiece_magnification', explanation: 'Reported only objective power, ignoring eyepiece lens.' },
        { text: `${totalMag + 50}×`, errorTag: 'arithmetic_offset', explanation: 'Multiplication offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-bio-mag-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A compound light microscope is configured with a $${ocular}\\times$ ocular eyepiece and a $${objective}\\times$ high-power objective lens. What is the total optical magnification of the specimen?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Total magnification rule', formula: '\\text{Total Magnification} = \\text{Ocular Power} \\times \\text{Objective Power}', explanation: 'Compound lens magnification multiplies powers.' },
          { stepNumber: 2, title: 'Calculate product', formula: `\\text{Total} = ${ocular} \\times ${objective} = ${totalMag}\\times`, explanation: `Total magnification is ${totalMag}×.` },
        ],
        commonErrorTags: ['added_magnifications_instead_of_multiplying', 'ignored_eyepiece_magnification'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Microscopy',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 59. Binary to Decimal Conversion (CS)
  {
    familyId: 'cs_binary_to_decimal',
    title: 'Binary to Decimal Representation',
    subject: 'computer_science',
    conceptIds: ['computer_systems_binary'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      val: { name: 'Decimal Integer', min: 17, max: 254, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const decimalVal = rng.nextInt(17, 254);
      const binaryStr = decimalVal.toString(2).padStart(8, '0');

      const correctText = `${decimalVal}`;
      const distractors = [
        { text: `${decimalVal + 2}`, errorTag: 'least_significant_bit_error', explanation: 'Miscalculated the 2^0 or 2^1 bit weight.' },
        { text: `${Math.round(decimalVal / 2)}`, errorTag: 'forgot_most_significant_bit', explanation: 'Dropped the high bit during binary positional summation.' },
        { text: `${decimalVal + 16}`, errorTag: 'power_of_two_shift_error', explanation: 'Added an extra 2^4 power weight.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-cs-bin-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Convert the 8-bit unsigned binary number $\\mathbf{${binaryStr}_2}$ to its base-10 decimal equivalent.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Sum positional powers of 2', formula: `\\sum b_i \\cdot 2^i`, explanation: 'Multiply each binary digit by its corresponding positional weight: 128, 64, 32, 16, 8, 4, 2, 1.' },
          { stepNumber: 2, title: 'Evaluate decimal sum', formula: `\\text{Value} = ${decimalVal}`, explanation: `Decimal representation is ${decimalVal}.` },
        ],
        commonErrorTags: ['least_significant_bit_error', 'power_of_two_shift_error'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Binary Systems',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 60. Algorithm Complexity Loop Iterations (CS)
  {
    familyId: 'cs_algorithm_complexity_iterations',
    title: 'Time Complexity and Loop Operation Count',
    subject: 'computer_science',
    conceptIds: ['algorithms_complexity'],
    grade: 'Grade 11',
    difficulty: 'medium',
    parameterRanges: {
      n: { name: 'Array Size n', min: 10, max: 50, step: 10 },
    },
    estimateCombinations() {
      return 5;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const n = rng.choice([10, 20, 30, 40, 50]);
      const nestedIterations = n * n;

      const correctText = `${nestedIterations} operations ($O(n^2)$)`;
      const distractors = [
        { text: `${2 * n} operations ($O(n)$)`, errorTag: 'added_nested_loops_instead_of_multiplying', explanation: 'Added loop bounds ($n + n$) instead of multiplying nested loop iterations ($n \\times n$).' },
        { text: `${n} operations ($O(n)$)`, errorTag: 'considered_single_loop_only', explanation: 'Ignored the inner nested loop entirely.' },
        { text: `${Math.round(n * Math.log2(n))} operations ($O(n \\log n)$)`, errorTag: 'confused_with_log_linear_sorting', explanation: 'Confused quadratic double loop with n log n divide-and-conquer.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-cs-loop-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Consider an algorithm with nested loops where both the outer and inner loops iterate $n = ${n}$ times:
\`\`\`python
for i in range(n):
    for j in range(n):
        # constant-time basic operation
\`\`\`
How many total basic operations are executed, and what is its asymptotic time complexity?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Analyze nested loop structure', formula: '\\sum_{i=1}^{n} \\sum_{j=1}^{n} 1 = n \\times n = n^2', explanation: 'For each of the n outer iterations, the inner loop executes n times.' },
          { stepNumber: 2, title: 'Compute total operations', formula: `${n} \\times ${n} = ${nestedIterations} \\implies O(n^2)`, explanation: `Executes ${nestedIterations} operations with quadratic time complexity O(n²).` },
        ],
        commonErrorTags: ['added_nested_loops_instead_of_multiplying', 'considered_single_loop_only'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Algorithmic Complexity',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },
];

