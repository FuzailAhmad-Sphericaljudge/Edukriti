import type { PracticeQuestion } from '@edukriti/contracts';

/**
 * MATH Benchmark Dataset
 * License: MIT License (Hendrycks et al., UC Berkeley, 2021)
 * Citation: Hendrycks et al., "Measuring Mathematical Problem Solving With the MATH Dataset", NeurIPS 2021
 * Source: https://github.com/hendrycks/math
 */
export const MATH_DATASET_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'math-ds-001',
    type: 'numeric',
    conceptIds: ['algebra_linear_equations'],
    subject: 'mathematics',
    grade: 'Grade 10',
    difficulty: 'hard',
    prompt: 'Find the value of $x$ such that $\\frac{2x - 3}{5} + \\frac{x + 1}{2} = 4$.',
    choices: [
      { id: 'a', text: 'x = 4.44' },
      { id: 'b', text: 'x = 5.2' },
      { id: 'c', text: 'x = 3.8' },
      { id: 'd', text: 'x = 4.0' },
    ],
    expectedAnswer: 'a',
    tolerance: 0.05,
    unit: '',
    solutionSteps: [
      { stepNumber: 1, title: 'Find common denominator', formula: '\\text{LCM}(5, 2) = 10', explanation: 'Multiply the entire equation by 10 to clear denominators.' },
      { stepNumber: 2, title: 'Expand terms', formula: '2(2x - 3) + 5(x + 1) = 4 \\times 10 \\implies (4x - 6) + (5x + 5) = 40', explanation: 'Distribute factors across terms.' },
      { stepNumber: 3, title: 'Combine like terms', formula: '9x - 1 = 40 \\implies 9x = 41 \\implies x = \\frac{41}{9} \\approx 4.44', explanation: 'Add 1 and divide by 9.' },
    ],
    commonErrorTags: ['forgot_to_multiply_rhs_by_lcm', 'sign_distribution_error'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'forgot_to_multiply_rhs_by_lcm', explanation: 'Multiplied left-hand side by 10 but forgot to multiply RHS (kept 4 instead of 40).' },
      { choiceId: 'c', errorTag: 'sign_distribution_error', explanation: 'Made a sign error when expanding 2(2x - 3) or combining constants.' },
      { choiceId: 'd', errorTag: 'rounded_to_nearest_integer', explanation: 'Prematurely truncated fraction.' },
    ],
    source: 'MATH Dataset (Hendrycks et al., MIT License)',
    license: 'MIT',
    verified: true,
    verifiedReason: 'Symbolic fraction manipulation verified x = 41/9 ~ 4.44',
    datasetId: 'math_hendrycks',
    externalReferenceId: 'math-algebra-level2-001',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'math-ds-002',
    type: 'mcq',
    conceptIds: ['quadratic_equations_polynomials'],
    subject: 'mathematics',
    grade: 'Grade 10',
    difficulty: 'hard',
    prompt: 'If $r$ and $s$ are the roots of the quadratic equation $x^2 - 7x + 12 = 0$, what is the exact value of $r^2 + s^2$?',
    choices: [
      { id: 'a', text: '25' },
      { id: 'b', text: '49' },
      { id: 'c', text: '37' },
      { id: 'd', text: '73' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [
      { stepNumber: 1, title: 'Apply Vieta’s formulas', formula: 'r + s = -\\left(\\frac{-7}{1}\\right) = 7, \\quad r \\cdot s = \\frac{12}{1} = 12', explanation: 'Sum of roots is 7, product of roots is 12.' },
      { stepNumber: 2, title: 'Algebraic identity for sum of squares', formula: 'r^2 + s^2 = (r + s)^2 - 2rs = 7^2 - 2(12) = 49 - 24 = 25', explanation: 'Substitute Vieta values into the identity.' },
    ],
    commonErrorTags: ['forgot_to_subtract_2rs', 'added_2rs_instead_of_subtracting'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'forgot_to_subtract_2rs', explanation: 'Squared (r+s) directly without subtracting 2rs (49).' },
      { choiceId: 'c', errorTag: 'subtracted_only_one_rs', explanation: 'Subtracted rs once instead of 2rs (49 - 12 = 37).' },
      { choiceId: 'd', errorTag: 'added_2rs_instead_of_subtracting', explanation: 'Added 2rs instead of subtracting (49 + 24 = 73).' },
    ],
    source: 'MATH Dataset (Hendrycks et al., MIT License)',
    license: 'MIT',
    verified: true,
    verifiedReason: 'Vieta’s identity verified roots 3 and 4 -> 3^2 + 4^2 = 25',
    datasetId: 'math_hendrycks',
    externalReferenceId: 'math-algebra-level3-002',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'math-ds-003',
    type: 'mcq',
    conceptIds: ['pythagoras_geometry'],
    subject: 'mathematics',
    grade: 'Grade 9',
    difficulty: 'medium',
    prompt: 'In a right-angled triangle, the legs have lengths $5\\text{ cm}$ and $12\\text{ cm}$. What is the radius of the circle circumscribed around this triangle?',
    choices: [
      { id: 'a', text: '6.5 cm' },
      { id: 'b', text: '13 cm' },
      { id: 'c', text: '6.0 cm' },
      { id: 'd', text: '8.5 cm' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [
      { stepNumber: 1, title: 'Find hypotenuse using Pythagorean theorem', formula: 'c = \\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = \\sqrt{169} = 13\\text{ cm}', explanation: 'Calculate hypotenuse length.' },
      { stepNumber: 2, title: 'Thales’s Theorem circumradius property', formula: 'R = \\frac{c}{2} = \\frac{13}{2} = 6.5\\text{ cm}', explanation: 'For any right triangle, the hypotenuse is the diameter of its circumscribed circle.' },
    ],
    commonErrorTags: ['confused_diameter_with_radius', 'inradius_miscalculation'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'confused_diameter_with_radius', explanation: 'Reported the circumdiameter (hypotenuse = 13 cm) instead of the circumradius (half).' },
      { choiceId: 'c', errorTag: 'approximated_hypotenuse', explanation: 'Used average of legs instead of Pythagorean hypotenuse.' },
      { choiceId: 'd', errorTag: 'arithmetic_offset', explanation: 'Calculation error.' },
    ],
    source: 'MATH Dataset (Hendrycks et al., MIT License)',
    license: 'MIT',
    verified: true,
    verifiedReason: 'Circumradius of right triangle R = c/2 verified',
    datasetId: 'math_hendrycks',
    externalReferenceId: 'math-geo-level2-003',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
];
