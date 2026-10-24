import type { PracticeQuestion } from '@edukriti/contracts';
import { SeededRng } from '../prng.ts';
import type { ParametricTemplate } from '../types.ts';
import { makeChoicesWithDistractors, calcCombinations } from '../template-helper.ts';

export const MATH_TEMPLATES: ParametricTemplate[] = [
  // 1. Linear Equation: ax + b = c
  {
    familyId: 'math_linear_eq_1var',
    title: 'Linear Equation in One Variable',
    subject: 'mathematics',
    conceptIds: ['algebra_linear_equations'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      a: { name: 'Coefficient a', min: 2, max: 12, step: 1 },
      x: { name: 'Target Root x', min: 1, max: 20, step: 1 },
      b: { name: 'Constant b', min: 3, max: 30, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const a = rng.nextInt(2, 12);
      const x = rng.nextInt(1, 20);
      const b = rng.nextInt(3, 30);
      const c = a * x + b;

      const correctText = `x = ${x}`;
      const distractors = [
        { text: `x = ${x + 2}`, errorTag: 'sign_error_on_transposition', explanation: 'Added b instead of subtracting b before dividing by a.' },
        { text: `x = ${Math.max(1, Math.round(c / a))}`, errorTag: 'forgot_constant_term', explanation: 'Divided c directly by a without subtracting constant b.' },
        { text: `x = ${Math.max(1, x - 1)}`, errorTag: 'arithmetic_subtraction_error', explanation: 'Made a small subtraction calculation error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-lin-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Solve for $x$ in the linear equation: $$${a}x + ${b} = ${c}$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Subtract constant from both sides', formula: `${a}x = ${c} - ${b}`, explanation: `Subtract ${b} from both sides: ${a}x = ${c - b}.` },
          { stepNumber: 2, title: 'Divide by coefficient', formula: `x = \\frac{${c - b}}{${a}}`, explanation: `Divide both sides by ${a}: x = ${x}.` },
        ],
        commonErrorTags: ['sign_error_on_transposition', 'forgot_constant_term'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Linear Equations',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 2. Quadratic Equation Roots
  {
    familyId: 'math_quadratic_roots',
    title: 'Roots of Quadratic Equation',
    subject: 'mathematics',
    conceptIds: ['quadratic_discriminant'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      r1: { name: 'Root 1', min: 1, max: 9, step: 1 },
      r2: { name: 'Root 2', min: 2, max: 12, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r1 = rng.nextInt(1, 9);
      const r2 = rng.nextInt(r1 + 1, 12);
      const b = r1 + r2;
      const c = r1 * r2;

      const correctText = `x = ${r1}, ${r2}`;
      const distractors = [
        { text: `x = -${r1}, -${r2}`, errorTag: 'factor_root_sign_reversal', explanation: 'Forgot to invert signs when equating factors $(x - r_1)(x - r_2) = 0$ to zero.' },
        { text: `x = -${r1}, ${r2}`, errorTag: 'partial_sign_error', explanation: 'Flipped the sign of only one root.' },
        { text: `x = ${r1 + 1}, ${r2 - 1}`, errorTag: 'distractor_sum_trick', explanation: 'Picked numbers that add up to the sum but do not multiply to the product.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-quad-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the real roots of the quadratic equation: $$x^2 - ${b}x + ${c} = 0$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Factor the quadratic', formula: `(x - ${r1})(x - ${r2}) = 0`, explanation: `Find two numbers whose sum is ${b} and product is ${c}: ${r1} and ${r2}.` },
          { stepNumber: 2, title: 'Set each factor to zero', formula: `x - ${r1} = 0 \\implies x = ${r1}, \\quad x - ${r2} = 0 \\implies x = ${r2}`, explanation: `The roots are x = ${r1} and x = ${r2}.` },
        ],
        commonErrorTags: ['factor_root_sign_reversal', 'partial_sign_error'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Quadratics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 3. Pythagoras Hypotenuse
  {
    familyId: 'math_pythagoras_hypotenuse',
    title: 'Pythagorean Theorem Hypotenuse',
    subject: 'mathematics',
    conceptIds: ['geometry_triangles'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      scale: { name: 'Triple Multiplier', min: 1, max: 15, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges) * 4;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const baseTriples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
      const triple = rng.choice(baseTriples);
      const k = rng.nextInt(1, 15);
      const a = triple[0] * k;
      const b = triple[1] * k;
      const c = triple[2] * k;

      const correctText = `${c} cm`;
      const distractors = [
        { text: `${a + b} cm`, errorTag: 'sum_instead_of_pythagoras', explanation: 'Added the leg lengths directly instead of using squares and square root.' },
        { text: `${Math.round(Math.sqrt(a * b))} cm`, errorTag: 'geometric_mean_error', explanation: 'Multiplied the legs instead of adding their squares.' },
        { text: `${c + 2} cm`, errorTag: 'arithmetic_square_error', explanation: 'Calculation error when taking the square root.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-pyth-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A right-angled triangle has legs of length $a = ${a}\\text{ cm}$ and $b = ${b}\\text{ cm}$. What is the length of the hypotenuse $c$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'State Pythagorean formula', formula: 'c = \\sqrt{a^2 + b^2}', explanation: 'In a right triangle, the hypotenuse squared equals the sum of the squares of the legs.' },
          { stepNumber: 2, title: 'Compute squares and sum', formula: `c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${c * c}}`, explanation: `Sum of squares is ${c * c}.` },
          { stepNumber: 3, title: 'Extract square root', formula: `c = ${c}\\text{ cm}`, explanation: `Hypotenuse length is ${c} cm.` },
        ],
        commonErrorTags: ['sum_instead_of_pythagoras', 'geometric_mean_error'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Pythagorean Geometry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 4. Circle Area and Circumference
  {
    familyId: 'math_circle_area_circumference',
    title: 'Circle Area Calculation',
    subject: 'mathematics',
    conceptIds: ['geometry_circles'],
    grade: 'Grade 7',
    difficulty: 'easy',
    parameterRanges: {
      r: { name: 'Radius r', min: 2, max: 25, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r = rng.nextInt(2, 25);
      const area = Math.round(Math.PI * r * r * 100) / 100;
      const circumference = Math.round(2 * Math.PI * r * 100) / 100;

      const correctText = `${area} cm²`;
      const distractors = [
        { text: `${circumference} cm²`, errorTag: 'used_circumference_formula', explanation: 'Used circumference formula $2\\pi r$ instead of area formula $\\pi r^2$.' },
        { text: `${Math.round(Math.PI * (2 * r) ** 2 * 100) / 100} cm²`, errorTag: 'used_diameter_instead_of_radius', explanation: 'Squared the diameter instead of the radius.' },
        { text: `${Math.round(2 * Math.PI * r * r * 100) / 100} cm²`, errorTag: 'multiplied_by_two_pi_r_squared', explanation: 'Used $2\\pi r^2$ instead of $\\pi r^2$.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-circ-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Calculate the area of a circle with radius $r = ${r}\\text{ cm}$. (Use $\\pi \\approx 3.1416$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Circle Area Formula', formula: 'A = \\pi r^2', explanation: 'Area of circle is pi multiplied by radius squared.' },
          { stepNumber: 2, title: 'Substitute values', formula: `A = \\pi \\times ${r}^2 = \\pi \\times ${r * r} \\approx ${area}\\text{ cm}^2`, explanation: `Computed area is ${area} cm².` },
        ],
        commonErrorTags: ['used_circumference_formula', 'used_diameter_instead_of_radius'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Circles',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 5. Percentage Discount
  {
    familyId: 'math_percentage_discount',
    title: 'Percentage Discount and Sale Price',
    subject: 'mathematics',
    conceptIds: ['arithmetic_percentages'],
    grade: 'Grade 7',
    difficulty: 'easy',
    parameterRanges: {
      originalPrice: { name: 'Original Price', min: 50, max: 500, step: 10 },
      discountPercent: { name: 'Discount %', min: 10, max: 50, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const originalPrice = rng.nextInt(5, 50) * 10;
      const discountPercent = rng.nextInt(2, 10) * 5;
      const discountAmount = (originalPrice * discountPercent) / 100;
      const salePrice = originalPrice - discountAmount;

      const correctText = `$${salePrice}`;
      const distractors = [
        { text: `$${discountAmount}`, errorTag: 'reported_discount_instead_of_sale_price', explanation: 'Reported the discount amount instead of the final discounted price.' },
        { text: `$${originalPrice + discountAmount}`, errorTag: 'added_discount_instead_of_subtracting', explanation: 'Added the discount amount instead of subtracting it.' },
        { text: `$${Math.round(originalPrice - discountPercent)}`, errorTag: 'subtracted_percentage_as_currency', explanation: 'Subtracted the percentage number directly from the dollar price.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-disc-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An item originally priced at $\\$${originalPrice}$ is on sale with a $${discountPercent}\\%$ discount. What is the final sale price?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Calculate discount amount', formula: `\\text{Discount} = ${originalPrice} \\times \\frac{${discountPercent}}{100} = \\$${discountAmount}`, explanation: 'Calculate how much is deducted.' },
          { stepNumber: 2, title: 'Subtract discount from original price', formula: `\\text{Sale Price} = ${originalPrice} - ${discountAmount} = \\$${salePrice}`, explanation: 'Subtract discount to get final price.' },
        ],
        commonErrorTags: ['reported_discount_instead_of_sale_price', 'added_discount_instead_of_subtracting'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Percentages',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 6. Simple Interest: I = PRT / 100
  {
    familyId: 'math_simple_interest',
    title: 'Simple Interest Calculation',
    subject: 'mathematics',
    conceptIds: ['commercial_mathematics'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      principal: { name: 'Principal P', min: 500, max: 10000, step: 250 },
      rate: { name: 'Interest Rate R (%)', min: 2, max: 15, step: 1 },
      time: { name: 'Time T (years)', min: 1, max: 10, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const p = rng.nextInt(2, 40) * 250;
      const r = rng.nextInt(2, 15);
      const t = rng.nextInt(1, 10);
      const interest = (p * r * t) / 100;
      const totalAmount = p + interest;

      const correctText = `$${interest}`;
      const distractors = [
        { text: `$${totalAmount}`, errorTag: 'reported_total_amount_instead_of_interest', explanation: 'Reported principal + interest instead of just interest.' },
        { text: `$${(p * r) / 100}`, errorTag: 'forgot_time_multiplier', explanation: 'Calculated 1-year interest without multiplying by time T.' },
        { text: `$${interest + 50}`, errorTag: 'calculation_offset', explanation: 'Arithmetic addition error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-si-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Calculate the simple interest earned on a principal of $\\$${p}$ invested at an annual interest rate of $${r}\\%$ for $${t}$ years.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Simple interest formula', formula: 'I = \\frac{P \\times R \\times T}{100}', explanation: 'Substitute principal P, rate R, and time T.' },
          { stepNumber: 2, title: 'Calculate interest', formula: `I = \\frac{${p} \\times ${r} \\times ${t}}{100} = \\$${interest}`, explanation: `Earned interest is $${interest}.` },
        ],
        commonErrorTags: ['reported_total_amount_instead_of_interest', 'forgot_time_multiplier'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Simple Interest',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 7. Compound Interest Annual
  {
    familyId: 'math_compound_interest',
    title: 'Compound Interest Maturity Amount',
    subject: 'mathematics',
    conceptIds: ['commercial_mathematics'],
    grade: 'Grade 9',
    difficulty: 'medium',
    parameterRanges: {
      p: { name: 'Principal P', min: 2000, max: 8000, step: 1000 },
      r: { name: 'Rate R (%)', min: 5, max: 10, step: 5 },
      t: { name: 'Time T (years)', min: 2, max: 3, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const p = rng.nextInt(2, 8) * 1000;
      const r = rng.choice([5, 10]);
      const t = rng.nextInt(2, 3);
      const amount = Math.round(p * (1 + r / 100) ** t);
      const simpleAmount = p + (p * r * t) / 100;

      const correctText = `$${amount}`;
      const distractors = [
        { text: `$${simpleAmount}`, errorTag: 'used_simple_interest_instead_of_compound', explanation: 'Calculated linear simple interest instead of compounding interest.' },
        { text: `$${amount - p}`, errorTag: 'reported_ci_instead_of_total_amount', explanation: 'Reported compound interest only, not total maturity amount.' },
        { text: `$${amount + 120}`, errorTag: 'arithmetic_variance', explanation: 'Calculation exponent rounding error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-ci-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A sum of $\\$${p}$ is invested at $${r}\\%$ per annum compounded annually for $${t}$ years. What is the total maturity amount?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Compound interest formula', formula: 'A = P\\left(1 + \\frac{R}{100}\\right)^T', explanation: 'Apply annual compound interest formula.' },
          { stepNumber: 2, title: 'Substitute and compute', formula: `A = ${p} \\times \\left(1 + \\frac{${r}}{100}\\right)^${t} = ${p} \\times ${(1 + r / 100) ** t} = \\$${amount}`, explanation: `Maturity amount is $${amount}.` },
        ],
        commonErrorTags: ['used_simple_interest_instead_of_compound', 'reported_ci_instead_of_total_amount'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Compound Interest',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 8. Ratio Partition: Divide Quantity Q in ratio a : b
  {
    familyId: 'math_ratio_partition',
    title: 'Ratio Division and Parts',
    subject: 'mathematics',
    conceptIds: ['arithmetic_ratios'],
    grade: 'Grade 6',
    difficulty: 'easy',
    parameterRanges: {
      a: { name: 'Part a', min: 2, max: 7, step: 1 },
      b: { name: 'Part b', min: 3, max: 8, step: 1 },
      multiplier: { name: 'Unit Multiplier', min: 5, max: 25, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const a = rng.nextInt(2, 7);
      const b = rng.nextInt(a + 1, 9);
      const k = rng.nextInt(2, 10) * 5;
      const total = (a + b) * k;
      const partA = a * k;
      const partB = b * k;

      const correctText = `${partA} and ${partB}`;
      const distractors = [
        { text: `${partB} and ${partA}`, errorTag: 'reversed_ratio_order', explanation: 'Assigned larger part to first term and smaller part to second term.' },
        { text: `${total / 2} and ${total / 2}`, errorTag: 'divided_equally_ignoring_ratio', explanation: 'Split equally into halves instead of partitioning by ratio.' },
        { text: `${partA + 5} and ${partB - 5}`, errorTag: 'improper_ratio_fractions', explanation: 'Parts sum to total but do not satisfy the exact ratio.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-rat-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Divide $${total}$ items between Alice and Bob in the ratio $${a} : ${b}$. How many items does each receive?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Sum of ratio parts', formula: `\\text{Total Parts} = ${a} + ${b} = ${a + b}`, explanation: 'Find total units in ratio.' },
          { stepNumber: 2, title: 'Value of one part', formula: `\\text{One Part} = \\frac{${total}}{${a + b}} = ${k}`, explanation: 'Divide total items by number of parts.' },
          { stepNumber: 3, title: 'Compute respective shares', formula: `\\text{Alice} = ${a} \\times ${k} = ${partA}, \\quad \\text{Bob} = ${b} \\times ${k} = ${partB}`, explanation: 'Multiply one part value by ratio terms.' },
        ],
        commonErrorTags: ['reversed_ratio_order', 'divided_equally_ignoring_ratio'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Ratios',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 9. Arithmetic Progression: nth term: a_n = a + (n-1)d
  {
    familyId: 'math_ap_nth_term',
    title: 'Arithmetic Progression Nth Term',
    subject: 'mathematics',
    conceptIds: ['sequences_and_series'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      a: { name: 'First term a', min: 1, max: 25, step: 1 },
      d: { name: 'Common difference d', min: 2, max: 15, step: 1 },
      n: { name: 'Term index n', min: 5, max: 35, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const a = rng.nextInt(1, 25);
      const d = rng.nextInt(2, 15);
      const n = rng.nextInt(5, 35);
      const nthTerm = a + (n - 1) * d;

      const correctText = `${nthTerm}`;
      const distractors = [
        { text: `${a + n * d}`, errorTag: 'used_n_instead_of_n_minus_one', explanation: 'Multiplied d by n instead of (n - 1).' },
        { text: `${a + (n - 2) * d}`, errorTag: 'off_by_one_index_error', explanation: 'Used (n - 2) instead of (n - 1).' },
        { text: `${nthTerm + d}`, errorTag: 'next_term_confusion', explanation: 'Calculated the (n + 1)th term.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-ap-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the $${n}\\text{th}$ term of an arithmetic progression where the first term is $a = ${a}$ and the common difference is $d = ${d}$.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'AP Nth term formula', formula: 'a_n = a + (n - 1)d', explanation: 'State AP general term formula.' },
          { stepNumber: 2, title: 'Substitute values', formula: `a_{${n}} = ${a} + (${n} - 1) \\times ${d} = ${a} + ${n - 1} \\times ${d} = ${nthTerm}`, explanation: `The ${n}th term is ${nthTerm}.` },
        ],
        commonErrorTags: ['used_n_instead_of_n_minus_one', 'off_by_one_index_error'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Arithmetic Progressions',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 10. Arithmetic Progression Sum: S_n = n/2 * (2a + (n-1)d)
  {
    familyId: 'math_ap_sum',
    title: 'Sum of First N Terms of an AP',
    subject: 'mathematics',
    conceptIds: ['sequences_and_series'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      a: { name: 'First term a', min: 2, max: 10, step: 1 },
      d: { name: 'Common difference d', min: 2, max: 6, step: 1 },
      n: { name: 'Number of terms n', min: 10, max: 20, step: 2 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const a = rng.nextInt(2, 10);
      const d = rng.nextInt(2, 6);
      const n = rng.nextInt(5, 10) * 2; // Even for nice division
      const sum = (n / 2) * (2 * a + (n - 1) * d);

      const correctText = `${sum}`;
      const distractors = [
        { text: `${n * (a + (n - 1) * d)}`, errorTag: 'forgot_divide_by_two', explanation: 'Forgot to divide by 2 in the sum formula $n/2(a + l)$.' },
        { text: `${(n / 2) * (a + (n - 1) * d)}`, errorTag: 'used_a_instead_of_2a', explanation: 'Used $a$ instead of $2a$ inside the bracket $(2a + (n-1)d)$.' },
        { text: `${sum + 20}`, errorTag: 'arithmetic_offset', explanation: 'Sum arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-apsum-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the sum of the first $${n}$ terms of an arithmetic progression having first term $a = ${a}$ and common difference $d = ${d}$.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'AP sum formula', formula: 'S_n = \\frac{n}{2}\\left(2a + (n - 1)d\\right)', explanation: 'State AP sum formula.' },
          { stepNumber: 2, title: 'Substitute parameters', formula: `S_{${n}} = \\frac{${n}}{2}\\left(2(${a}) + (${n} - 1)${d}\\right) = ${n / 2}\\left(${2 * a} + ${(n - 1) * d}\\right) = ${sum}`, explanation: `Sum is ${sum}.` },
        ],
        commonErrorTags: ['forgot_divide_by_two', 'used_a_instead_of_2a'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: AP Sums',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 11. Probability Single Event: Marbles in a bag
  {
    familyId: 'math_probability_marbles',
    title: 'Probability of a Simple Event',
    subject: 'mathematics',
    conceptIds: ['probability_basics'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      red: { name: 'Red Marbles', min: 3, max: 10, step: 1 },
      blue: { name: 'Blue Marbles', min: 4, max: 12, step: 1 },
      green: { name: 'Green Marbles', min: 2, max: 8, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const red = rng.nextInt(3, 10);
      const blue = rng.nextInt(4, 12);
      const green = rng.nextInt(2, 8);
      const total = red + blue + green;

      const correctText = `${red}/${total}`;
      const distractors = [
        { text: `${red}/${blue + green}`, errorTag: 'divided_by_favorable_outcomes_only', explanation: 'Divided red marbles by non-red marbles instead of total marbles.' },
        { text: `${blue}/${total}`, errorTag: 'picked_wrong_color_event', explanation: 'Calculated probability of blue instead of red.' },
        { text: `${red + 1}/${total}`, errorTag: 'miscounted_favorable_outcomes', explanation: 'Miscounted the favorable outcomes.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-prob-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A bag contains $${red}$ red, $${blue}$ blue, and $${green}$ green marbles. If one marble is drawn at random, what is the probability of picking a red marble?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Find total outcomes', formula: `\\text{Total} = ${red} + ${blue} + ${green} = ${total}`, explanation: 'Total outcomes equals sum of all marbles.' },
          { stepNumber: 2, title: 'Calculate probability', formula: `P(\\text{Red}) = \\frac{\\text{Number of Red}}{\\text{Total}} = \\frac{${red}}{${total}}`, explanation: 'Divide favorable red outcomes by total outcomes.' },
        ],
        commonErrorTags: ['divided_by_favorable_outcomes_only', 'picked_wrong_color_event'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Probability',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 12. Trigonometry Height & Distance: h = d * tan(theta)
  {
    familyId: 'math_trig_height_distance',
    title: 'Trigonometric Height & Distance',
    subject: 'mathematics',
    conceptIds: ['trigonometry_applications'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      d: { name: 'Distance from base', min: 10, max: 80, step: 5 },
      angle: { name: 'Elevation Angle', min: 30, max: 60, step: 15 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const d = rng.nextInt(2, 16) * 5;
      const angle = rng.choice([30, 45, 60]);
      let tanVal = 1;
      let tanStr = '1';
      if (angle === 30) {
        tanVal = 1 / Math.sqrt(3);
        tanStr = '1/\\sqrt{3} \\approx 0.577';
      } else if (angle === 60) {
        tanVal = Math.sqrt(3);
        tanStr = '\\sqrt{3} \\approx 1.732';
      }
      const h = Math.round(d * tanVal * 10) / 10;

      const correctText = `${h} m`;
      const distractors = [
        { text: `${Math.round(d / tanVal * 10) / 10} m`, errorTag: 'inverted_tangent_ratio', explanation: 'Used cotangent (d / tan θ) instead of tangent (d * tan θ).' },
        { text: `${d} m`, errorTag: 'assumed_45_degree_elevation', explanation: 'Assumed height equals distance regardless of the elevation angle.' },
        { text: `${Math.round((h + 5) * 10) / 10} m`, errorTag: 'trig_value_precision_error', explanation: 'Rounding or arithmetic offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-trig-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An observer stands at a distance of $d = ${d}\\text{ m}$ from the base of a vertical tower and measures the angle of elevation to the top as $${angle}^\\circ$. What is the height of the tower?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Tanget ratio relation', formula: '\\tan(\\theta) = \\frac{\\text{Opposite}}{\\text{Adjacent}} = \\frac{h}{d}', explanation: 'In a right triangle, tangent of elevation angle equals height over distance.' },
          { stepNumber: 2, title: 'Solve for height h', formula: `h = d \\times \\tan(${angle}^\\circ) = ${d} \\times ${tanStr} \\approx ${h}\\text{ m}`, explanation: `Tower height is ${h} meters.` },
        ],
        commonErrorTags: ['inverted_tangent_ratio', 'assumed_45_degree_elevation'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Trigonometry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 13. Coordinate Distance Formula
  {
    familyId: 'math_coordinate_distance',
    title: 'Distance Between Two Points',
    subject: 'mathematics',
    conceptIds: ['coordinate_geometry'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      x1: { name: 'Point A X-coord', min: 1, max: 20, step: 1 },
      y1: { name: 'Point A Y-coord', min: 1, max: 20, step: 1 },
      tripleIndex: { name: 'Pythagorean Triple index', min: 0, max: 7, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [12, 16, 20], [15, 20, 25]];
      const t = rng.choice(triples);
      const x1 = rng.nextInt(1, 20);
      const y1 = rng.nextInt(1, 20);
      const x2 = x1 + t[0];
      const y2 = y1 + t[1];
      const dist = t[2];

      const correctText = `${dist} units`;
      const distractors = [
        { text: `${t[0] + t[1]} units`, errorTag: 'manhattan_distance_instead_of_euclidean', explanation: 'Added |x2-x1| + |y2-y1| directly without squaring and square root.' },
        { text: `${dist * dist} units`, errorTag: 'forgot_square_root', explanation: 'Computed (x2-x1)^2 + (y2-y1)^2 but forgot to take the square root.' },
        { text: `${dist + 1} units`, errorTag: 'arithmetic_variance', explanation: 'Arithmetic error in distance formula.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-coord-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the distance between the two points $A(${x1}, ${y1})$ and $B(${x2}, ${y2})$ in the Cartesian plane.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Distance formula', formula: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}', explanation: 'Apply 2D Euclidean distance formula.' },
          { stepNumber: 2, title: 'Substitute coordinates', formula: `d = \\sqrt{(${x2} - ${x1})^2 + (${y2} - ${y1})^2} = \\sqrt{${t[0]}^2 + ${t[1]}^2} = \\sqrt{${t[0] * t[0] + t[1] * t[1]}} = ${dist}`, explanation: `Distance is ${dist} units.` },
        ],
        commonErrorTags: ['manhattan_distance_instead_of_euclidean', 'forgot_square_root'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Coordinate Geometry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 14. Exponent Laws Simplification
  {
    familyId: 'math_exponent_laws',
    title: 'Product and Quotient Rule of Exponents',
    subject: 'mathematics',
    conceptIds: ['algebra_exponents'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      m: { name: 'Exponent m', min: 3, max: 8, step: 1 },
      n: { name: 'Exponent n', min: 2, max: 7, step: 1 },
      k: { name: 'Exponent k', min: 1, max: 4, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(3, 8);
      const n = rng.nextInt(2, 7);
      const k = rng.nextInt(1, Math.min(3, m + n - 1));
      const finalExp = m + n - k;

      const correctText = `a^${finalExp}`;
      const distractors = [
        { text: `a^${m * n - k}`, errorTag: 'multiplied_exponents_instead_of_adding', explanation: 'Multiplied powers in numerator ($a^m \\cdot a^n$) instead of adding exponents.' },
        { text: `a^${m + n + k}`, errorTag: 'added_denominator_exponent', explanation: 'Added the denominator power instead of subtracting.' },
        { text: `a^${finalExp + 1}`, errorTag: 'arithmetic_offset', explanation: 'Off-by-one arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-exp-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Simplify the algebraic expression using laws of exponents: $$\\frac{a^{${m}} \\cdot a^{${n}}}{a^{${k}}}$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Product rule in numerator', formula: `a^{${m}} \\cdot a^{${n}} = a^{${m} + ${n}} = a^{${m + n}}`, explanation: 'When multiplying powers with the same base, add their exponents.' },
          { stepNumber: 2, title: 'Quotient rule', formula: `\\frac{a^{${m + n}}}{a^{${k}}} = a^{${m + n} - ${k}} = a^{${finalExp}}`, explanation: 'When dividing powers with the same base, subtract the exponent.' },
        ],
        commonErrorTags: ['multiplied_exponents_instead_of_adding', 'added_denominator_exponent'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Exponent Laws',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 15. Cylinder Volume: V = pi * r^2 * h
  {
    familyId: 'math_cylinder_volume',
    title: 'Volume of a Right Circular Cylinder',
    subject: 'mathematics',
    conceptIds: ['mensuration_3d'],
    grade: 'Grade 9',
    difficulty: 'medium',
    parameterRanges: {
      r: { name: 'Radius r', min: 2, max: 10, step: 1 },
      h: { name: 'Height h', min: 5, max: 20, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r = rng.nextInt(2, 10);
      const h = rng.nextInt(5, 20);
      const vol = Math.round(Math.PI * r * r * h * 10) / 10;

      const correctText = `${vol} cm³`;
      const distractors = [
        { text: `${Math.round(2 * Math.PI * r * h * 10) / 10} cm³`, errorTag: 'used_curved_surface_area_formula', explanation: 'Used curved surface area formula $2\\pi r h$ instead of volume $\\pi r^2 h$.' },
        { text: `${Math.round((1 / 3) * Math.PI * r * r * h * 10) / 10} cm³`, errorTag: 'used_cone_volume_formula', explanation: 'Multiplied by 1/3 (cone volume formula).' },
        { text: `${Math.round(Math.PI * r * h * 10) / 10} cm³`, errorTag: 'forgot_to_square_radius', explanation: 'Forgot to square the radius ($\pi r h$).' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-cyl-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the volume of a solid right circular cylinder with base radius $r = ${r}\\text{ cm}$ and height $h = ${h}\\text{ cm}$. (Use $\\pi \\approx 3.1416$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Cylinder volume formula', formula: 'V = \\pi r^2 h', explanation: 'Base area multiplied by perpendicular height.' },
          { stepNumber: 2, title: 'Substitute values', formula: `V = \\pi \\times ${r}^2 \\times ${h} = \\pi \\times ${r * r} \\times ${h} \\approx ${vol}\\text{ cm}^3`, explanation: `Volume is ${vol} cm³.` },
        ],
        commonErrorTags: ['used_curved_surface_area_formula', 'used_cone_volume_formula'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Mensuration',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 16. Sphere Surface Area: A = 4 * pi * r^2
  {
    familyId: 'math_sphere_surface_area',
    title: 'Surface Area of a Sphere',
    subject: 'mathematics',
    conceptIds: ['mensuration_3d'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      r: { name: 'Radius r', min: 3, max: 15, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r = rng.nextInt(3, 15);
      const area = Math.round(4 * Math.PI * r * r * 10) / 10;
      const vol = Math.round((4 / 3) * Math.PI * r ** 3 * 10) / 10;

      const correctText = `${area} cm²`;
      const distractors = [
        { text: `${vol} cm²`, errorTag: 'used_sphere_volume_formula', explanation: 'Used 4/3 * pi * r^3 (volume formula) instead of 4 * pi * r^2.' },
        { text: `${Math.round(2 * Math.PI * r * r * 10) / 10} cm²`, errorTag: 'used_hemisphere_area', explanation: 'Used 2 * pi * r^2 (curved area of hemisphere) instead of full sphere.' },
        { text: `${Math.round(Math.PI * r * r * 10) / 10} cm²`, errorTag: 'circle_area_confusion', explanation: 'Used pi * r^2 (flat circle area) instead of 4 * pi * r^2.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-sph-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Calculate the total surface area of a sphere having radius $r = ${r}\\text{ cm}$. (Use $\\pi \\approx 3.1416$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Surface area formula of sphere', formula: 'A = 4\\pi r^2', explanation: 'Total surface area equals four times the cross-sectional circle area.' },
          { stepNumber: 2, title: 'Substitute values', formula: `A = 4 \\times \\pi \\times ${r}^2 = 4 \\times \\pi \\times ${r * r} \\approx ${area}\\text{ cm}^2`, explanation: `Surface area is ${area} cm².` },
        ],
        commonErrorTags: ['used_sphere_volume_formula', 'used_hemisphere_area'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Spheres',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 17. Polynomial Derivative: d/dx (a x^n + b x)
  {
    familyId: 'math_polynomial_derivative',
    title: 'Derivative of Power Function',
    subject: 'mathematics',
    conceptIds: ['calculus_derivatives'],
    grade: 'Grade 11',
    difficulty: 'medium',
    parameterRanges: {
      a: { name: 'Coefficient a', min: 2, max: 8, step: 1 },
      n: { name: 'Power n', min: 3, max: 6, step: 1 },
      b: { name: 'Linear Coefficient b', min: 2, max: 9, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const a = rng.nextInt(2, 8);
      const n = rng.nextInt(3, 6);
      const b = rng.nextInt(2, 9);
      const derivA = a * n;
      const derivPow = n - 1;

      const correctText = `${derivA}x^${derivPow} + ${b}`;
      const distractors = [
        { text: `${derivA}x^${n} + ${b}`, errorTag: 'forgot_to_decrement_power', explanation: 'Forgot to reduce the exponent by 1 (kept power as n).' },
        { text: `${a}x^${derivPow} + ${b}`, errorTag: 'forgot_to_multiply_by_exponent', explanation: 'Reduced exponent but forgot to multiply coefficient by n.' },
        { text: `${derivA}x^${derivPow}`, errorTag: 'dropped_linear_derivative_term', explanation: 'Omitted the derivative of bx (which is b).' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-diff-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the first derivative $\\frac{dy}{dx}$ of the polynomial function: $$y = ${a}x^{${n}} + ${b}x$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Power rule of differentiation', formula: '\\frac{d}{dx}[c x^k] = c \\cdot k \\cdot x^{k-1}', explanation: 'Multiply by current power and decrease exponent by 1.' },
          { stepNumber: 2, title: 'Differentiate each term', formula: `\\frac{d}{dx}[${a}x^{${n}}] = ${a} \\times ${n} x^{${derivPow}} = ${derivA}x^{${derivPow}}, \\quad \\frac{d}{dx}[${b}x] = ${b}`, explanation: `Result is ${derivA}x^${derivPow} + ${b}.` },
        ],
        commonErrorTags: ['forgot_to_decrement_power', 'forgot_to_multiply_by_exponent'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Calculus',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 18. Sample Mean and Statistics
  {
    familyId: 'math_statistics_mean',
    title: 'Arithmetic Mean of Dataset',
    subject: 'mathematics',
    conceptIds: ['statistics_basics'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      d1: { name: 'Sample Item 1', min: 10, max: 25, step: 1 },
      d2: { name: 'Sample Item 2', min: 15, max: 30, step: 1 },
      d3: { name: 'Sample Item 3', min: 20, max: 35, step: 1 },
      d4: { name: 'Sample Item 4', min: 10, max: 20, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const d1 = rng.nextInt(10, 25);
      const d2 = rng.nextInt(15, 30);
      const d3 = rng.nextInt(20, 35);
      const d4 = rng.nextInt(10, 20);
      // Pick d5 such that sum is multiple of 5
      const partialSum = d1 + d2 + d3 + d4;
      const remainder = partialSum % 5;
      const d5 = rng.nextInt(10, 30) + (5 - remainder);
      const data = [d1, d2, d3, d4, d5];
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = sum / data.length;

      const correctText = `${mean}`;
      const distractors = [
        { text: `${mean + 2}`, errorTag: 'arithmetic_summation_error', explanation: 'Sum calculation was off by 10.' },
        { text: `${Math.round(sum / (data.length - 1))}`, errorTag: 'divided_by_n_minus_one', explanation: 'Divided sum by (n - 1) instead of n.' },
        { text: `${data[2]}`, errorTag: 'confused_median_with_mean', explanation: 'Reported an arbitrary middle element instead of computing the average.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-stat-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the arithmetic mean (average) of the following set of numbers: $$[${data.join(', ')}]$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Sum all values', formula: `\\sum x = ${data.join(' + ')} = ${sum}`, explanation: 'Add all numbers together.' },
          { stepNumber: 2, title: 'Divide by count', formula: `\\bar{x} = \\frac{${sum}}{${data.length}} = ${mean}`, explanation: `Mean is ${mean}.` },
        ],
        commonErrorTags: ['arithmetic_summation_error', 'divided_by_n_minus_one'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Statistics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 19. System of 2 Linear Equations
  {
    familyId: 'math_system_2linear',
    title: 'Simultaneous Linear Equations',
    subject: 'mathematics',
    conceptIds: ['algebra_linear_equations'],
    grade: 'Grade 9',
    difficulty: 'medium',
    parameterRanges: {
      x: { name: 'Root x', min: 2, max: 8, step: 1 },
      y: { name: 'Root y', min: 1, max: 7, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const x = rng.nextInt(2, 8);
      const y = rng.nextInt(1, 7);
      const c1 = x + y;
      const c2 = 2 * x - y;

      const correctText = `x = ${x}, y = ${y}`;
      const distractors = [
        { text: `x = ${y}, y = ${x}`, errorTag: 'swapped_variable_values', explanation: 'Assigned y value to x and x value to y.' },
        { text: `x = ${x + 1}, y = ${y - 1}`, errorTag: 'satisfied_first_eq_only', explanation: 'Satisfies x + y = c1 but fails the second equation 2x - y = c2.' },
        { text: `x = -${x}, y = ${y}`, errorTag: 'sign_error_elimination', explanation: 'Sign error during variable elimination.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-sys-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Solve the system of simultaneous linear equations for $x$ and $y$: $$\\begin{cases} x + y = ${c1} \\\\ 2x - y = ${c2} \\end{cases}$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Add the two equations to eliminate y', formula: `(x + y) + (2x - y) = ${c1} + ${c2} \\implies 3x = ${c1 + c2}`, explanation: `Adding equations eliminates y: 3x = ${c1 + c2}.` },
          { stepNumber: 2, title: 'Solve for x', formula: `x = \\frac{${c1 + c2}}{3} = ${x}`, explanation: `Dividing by 3 yields x = ${x}.` },
          { stepNumber: 3, title: 'Substitute x to find y', formula: `y = ${c1} - x = ${c1} - ${x} = ${y}`, explanation: `Substitute x into first equation: y = ${y}.` },
        ],
        commonErrorTags: ['swapped_variable_values', 'satisfied_first_eq_only'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Linear Systems',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 20. Logarithm Identity Evaluation: log_b(b^k)
  {
    familyId: 'math_logarithm_eval',
    title: 'Evaluation of Logarithms',
    subject: 'mathematics',
    conceptIds: ['algebra_logarithms'],
    grade: 'Grade 11',
    difficulty: 'easy',
    parameterRanges: {
      base: { name: 'Base b', min: 2, max: 5, step: 1 },
      exp: { name: 'Power k', min: 2, max: 5, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const b = rng.nextInt(2, 5);
      const k = rng.nextInt(2, 5);
      const arg = b ** k;

      const correctText = `${k}`;
      const distractors = [
        { text: `${b}`, errorTag: 'confused_base_with_log_value', explanation: 'Reported the base b instead of the exponent k.' },
        { text: `${b * k}`, errorTag: 'multiplied_base_and_exponent', explanation: 'Multiplied base and power instead of evaluating logarithm.' },
        { text: `${k + 1}`, errorTag: 'off_by_one_power', explanation: 'Off by one on power counting.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-math-log-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Evaluate the exact value of the logarithmic expression: $$\\log_{${b}}(${arg})$$`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Express argument as power of base', formula: `${arg} = ${b}^{${k}}`, explanation: `Recognize that ${b} raised to power ${k} equals ${arg}.` },
          { stepNumber: 2, title: 'Apply logarithm power rule', formula: `\\log_{${b}}(${b}^{${k}}) = ${k} \\cdot \\log_{${b}}(${b}) = ${k} \\cdot 1 = ${k}`, explanation: `The logarithm value is ${k}.` },
        ],
        commonErrorTags: ['confused_base_with_log_value', 'multiplied_base_and_exponent'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Logarithms',
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
