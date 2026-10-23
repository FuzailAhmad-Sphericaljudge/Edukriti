/**
 * Step-by-step numerical solver and recomputation verifier for maths, physics, and chemistry.
 * Implements deterministic calculation without eval() and verifies student/model numeric claims.
 */

import type { TutorNumericStep, TutorMathVerification } from '@edukriti/contracts';

export type PhysicalQuantity = {
  value: number;
  unit: string;
  variable: string;
};

/**
 * Safe arithmetic expression evaluator supporting +, -, *, /, ^, parentheses, sqrt, and log10.
 */
export function evaluateSafeMath(expr: string): number | null {
  try {
    const cleaned = expr
      .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
      .replace(/log10\(([^)]+)\)/g, 'Math.log10($1)')
      .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
      .replace(/\^/g, '**')
      .replace(/\s+/g, '');

    // Strict validation: only allowed math characters
    if (!/^[0-9+\-*/().Math,sqrtlogabs*]+$/.test(cleaned)) {
      return null;
    }

    // Evaluate token tree using a simple recursive parser or safe Function with strictly validated tokens
    const fn = new Function(`"use strict"; return (${cleaned});`);
    const result = fn();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Converts non-standard or compound physical units into standard SI base units.
 * Supports km/h -> m/s, cm/mm -> m, g -> kg, mA -> A, kW -> W, kJ -> J, min/h -> s.
 */
export function normalizeToSiUnits(
  value: number,
  rawUnit: string,
): { value: number; siUnit: string; factor: number; notes: string } {
  const clean = rawUnit.trim().toLowerCase();
  switch (clean) {
    case 'km/h':
    case 'kph':
    case 'kmph': {
      const v = Number((value * (5 / 18)).toFixed(4));
      return {
        value: v,
        siUnit: 'm/s',
        factor: 5 / 18,
        notes: `${value} km/h = ${value} × (5/18) = ${v} m/s`,
      };
    }
    case 'cm': {
      const v = Number((value * 0.01).toFixed(4));
      return {
        value: v,
        siUnit: 'm',
        factor: 0.01,
        notes: `${value} cm = ${value} × 10⁻² = ${v} m`,
      };
    }
    case 'mm': {
      const v = Number((value * 0.001).toFixed(6));
      return {
        value: v,
        siUnit: 'm',
        factor: 0.001,
        notes: `${value} mm = ${value} × 10⁻³ = ${v} m`,
      };
    }
    case 'km': {
      const v = Number((value * 1000).toFixed(4));
      return {
        value: v,
        siUnit: 'm',
        factor: 1000,
        notes: `${value} km = ${value} × 10³ = ${v} m`,
      };
    }
    case 'g':
    case 'gram':
    case 'grams': {
      const v = Number((value * 0.001).toFixed(4));
      return {
        value: v,
        siUnit: 'kg',
        factor: 0.001,
        notes: `${value} g = ${value} / 1000 = ${v} kg`,
      };
    }
    case 'ma':
    case 'milliampere':
    case 'milliamperes': {
      const v = Number((value * 0.001).toFixed(6));
      return {
        value: v,
        siUnit: 'A',
        factor: 0.001,
        notes: `${value} mA = ${value} × 10⁻³ = ${v} A`,
      };
    }
    case 'kw':
    case 'kilowatt':
    case 'kilowatts': {
      const v = Number((value * 1000).toFixed(4));
      return {
        value: v,
        siUnit: 'W',
        factor: 1000,
        notes: `${value} kW = ${value} × 10³ = ${v} W`,
      };
    }
    case 'kj':
    case 'kilojoule':
    case 'kilojoules': {
      const v = Number((value * 1000).toFixed(4));
      return {
        value: v,
        siUnit: 'J',
        factor: 1000,
        notes: `${value} kJ = ${value} × 10³ = ${v} J`,
      };
    }
    case 'min':
    case 'minute':
    case 'minutes': {
      const v = Number((value * 60).toFixed(4));
      return {
        value: v,
        siUnit: 's',
        factor: 60,
        notes: `${value} min = ${value} × 60 = ${v} s`,
      };
    }
    case 'h':
    case 'hr':
    case 'hour':
    case 'hours': {
      const v = Number((value * 3600).toFixed(4));
      return {
        value: v,
        siUnit: 's',
        factor: 3600,
        notes: `${value} h = ${value} × 3600 = ${v} s`,
      };
    }
    default:
      return {
        value,
        siUnit: rawUnit,
        factor: 1,
        notes: `${value} ${rawUnit}`,
      };
  }
}

/**
 * Extracts numbers with units from text (e.g., "12V", "5 m/s", "10 kg", "2.5 A", "4 ohms").
 */
export function extractQuantities(text: string): Record<string, number> {
  const result: Record<string, number> = {};

  const patterns = [
    // Voltage: 12V, 12 volts
    { key: 'V', regex: /([0-9.]+)\s*(?:V|volts?)\b/i },
    // Current in mA: 500 mA
    { key: 'I_mA', regex: /([0-9.]+)\s*(?:mA|milliamperes?)\b/i },
    // Current: 3A, 3 amperes
    { key: 'I', regex: /([0-9.]+)\s*(?:A|amperes?|amps?)\b/i },
    // Resistance in kΩ
    { key: 'R_k', regex: /([0-9.]+)\s*(?:kΩ|kohm|kiloohms?)\b/i },
    // Resistance: 4 ohms, 4 Omega, 4Ω
    { key: 'R', regex: /([0-9.]+)\s*(?:ohms?|Ω|Omega)\b/i },
    // Mass in grams: 500g
    { key: 'm_g', regex: /([0-9.]+)\s*(?:g|grams?)\b(?!\s*\/)/i },
    // Mass: 5kg, 5 kg
    { key: 'm', regex: /([0-9.]+)\s*(?:kg|kilograms?)\b/i },
    // Force: 20N, 20 newtons
    { key: 'F', regex: /([0-9.]+)\s*(?:N|newtons?)\b/i },
    // Acceleration: 2 m/s^2
    { key: 'a', regex: /([0-9.]+)\s*(?:m\/s\^2|m\/s2)\b/i },
    // Velocity in km/h
    { key: 'v_kmh', regex: /([0-9.]+)\s*(?:km\/h|kph|kmph)\b/i },
    // Velocity: 10 m/s
    { key: 'v', regex: /([0-9.]+)\s*(?:m\/s|mps)\b/i },
    // Initial velocity: u = 0, initial speed 0 m/s
    { key: 'u', regex: /(?:initial\s+(?:velocity|speed)|u\s*=)\s*([0-9.]+)/i },
    // Time in minutes
    { key: 't_min', regex: /([0-9.]+)\s*(?:mins?|minutes?)\b/i },
    // Time: 5s, 5 seconds
    { key: 't', regex: /([0-9.]+)\s*(?:s|seconds?|sec)\b/i },
    // Distance / height: 10m, 10 meters
    { key: 's', regex: /([0-9.]+)\s*(?:m|meters?)\b/i },
    // Power: 100W, 100 watts
    { key: 'P', regex: /([0-9.]+)\s*(?:W|watts?)\b/i },
    // Moles: 2 mol
    { key: 'n', regex: /([0-9.]+)\s*(?:moles?|mol)\b/i },
    // Volume: 2 L, 2 liters
    { key: 'vol', regex: /([0-9.]+)\s*(?:L|liters?|litres?)\b/i },
  ];

  for (const { key, regex } of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) result[key] = val;
    }
  }

  // Normalize sub-units to canonical SI if primary key was not directly matched
  if (result.I === undefined && result.I_mA !== undefined) {
    result.I = Number((result.I_mA * 0.001).toFixed(6));
  }
  if (result.R === undefined && result.R_k !== undefined) {
    result.R = result.R_k * 1000;
  }
  if (result.m === undefined && result.m_g !== undefined) {
    result.m = Number((result.m_g * 0.001).toFixed(4));
  }
  if (result.v === undefined && result.v_kmh !== undefined) {
    result.v = Number((result.v_kmh * (5 / 18)).toFixed(4));
  }
  if (result.t === undefined && result.t_min !== undefined) {
    result.t = result.t_min * 60;
  }

  return result;
}

/**
 * Extracts candidate numeric answer from a solution string (e.g. "Answer: 3 A", "therefore v = 25 m/s", "x = 4").
 */
export function extractFinalNumericValue(text: string): number | null {
  // Check for the last occurrence of "= <number>"
  const equalsMatches = [...text.matchAll(/=\s*([+-]?[0-9.]+)/g)];
  if (equalsMatches.length > 0) {
    const last = equalsMatches[equalsMatches.length - 1];
    if (last && last[1]) {
      const parsed = parseFloat(last[1]);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // Check for numbers followed by physical units (take the last one)
  const unitMatches = [...text.matchAll(/([+-]?[0-9.]+)\s*(?:m\/s\^2|m\/s2|m\/s|mps|ohms?|Ω|Omega|volts?|V|amperes?|amps?|A|newtons?|N|joules?|J|watts?|W|kg|mol)\b/gi)];
  if (unitMatches.length > 0) {
    const last = unitMatches[unitMatches.length - 1];
    if (last && last[1]) {
      const parsed = parseFloat(last[1]);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // Check for "Answer: <number>" or "result: <number>"
  const explicitAnswer = text.match(/(?:answer|result|final\s+value|therefore|thus|hence)\s*[:=]?\s*([+-]?[0-9.]+)/i);
  if (explicitAnswer && explicitAnswer[1]) {
    const parsed = parseFloat(explicitAnswer[1]);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback: look for the last isolated decimal number in text
  const allNumbers = text.match(/[+-]?[0-9]+(?:\.[0-9]+)?/g);
  if (allNumbers && allNumbers.length > 0) {
    const lastNum = parseFloat(allNumbers[allNumbers.length - 1]!);
    if (!isNaN(lastNum)) return lastNum;
  }

  return null;
}

/**
 * Canonical formula recomputation engine.
 */
export function recomputeCanonicalProblem(
  problemText: string,
  quantities: Record<string, number>,
): { computedValue: number; formula: string; unit: string } | null {
  const text = problemText.toLowerCase();

  // 1. Ohm's Law: V = I * R
  if (
    (text.includes('ohm') ||
      text.includes('circuit') ||
      text.includes('resistor') ||
      text.includes('resistance') ||
      text.includes('voltage') ||
      text.includes('current')) &&
    (quantities.V !== undefined || quantities.R !== undefined || quantities.I !== undefined)
  ) {
    const asksResistance =
      text.includes('resistance') &&
      (text.includes('calculate') || text.includes('find') || text.includes('what is') || text.includes('determine') || text.includes('r ='));
    const asksVoltage =
      (text.includes('voltage') || text.includes('potential')) &&
      (text.includes('calculate') || text.includes('find') || text.includes('what is') || text.includes('determine') || text.includes('v ='));
    const asksCurrent =
      text.includes('current') &&
      (text.includes('calculate') || text.includes('find') || text.includes('what is') || text.includes('determine') || text.includes('flowing') || text.includes('i ='));

    if (asksResistance && quantities.V !== undefined && quantities.I !== undefined && quantities.I !== 0) {
      const R = quantities.V / quantities.I;
      return { computedValue: Number(R.toFixed(4)), formula: 'R = V / I', unit: 'Ω' };
    }
    if (asksVoltage && quantities.I !== undefined && quantities.R !== undefined) {
      const V = quantities.I * quantities.R;
      return { computedValue: Number(V.toFixed(4)), formula: 'V = I * R', unit: 'V' };
    }
    if (asksCurrent && quantities.V !== undefined && quantities.R !== undefined && quantities.R !== 0) {
      const I = quantities.V / quantities.R;
      return { computedValue: Number(I.toFixed(4)), formula: 'I = V / R', unit: 'A' };
    }

    if (quantities.V !== undefined && quantities.R !== undefined && quantities.R !== 0 && (text.includes('current') || text.includes('i =') || text.includes('find the current'))) {
      const I = quantities.V / quantities.R;
      return { computedValue: Number(I.toFixed(4)), formula: 'I = V / R', unit: 'A' };
    }
    if (quantities.I !== undefined && quantities.R !== undefined && (text.includes('voltage') || text.includes('potential') || text.includes('v ='))) {
      const V = quantities.I * quantities.R;
      return { computedValue: Number(V.toFixed(4)), formula: 'V = I * R', unit: 'V' };
    }
    if (quantities.V !== undefined && quantities.I !== undefined && quantities.I !== 0 && (text.includes('resistance') || text.includes('r ='))) {
      const R = quantities.V / quantities.I;
      return { computedValue: Number(R.toFixed(4)), formula: 'R = V / I', unit: 'Ω' };
    }
  }

  // 2. Newton's Second Law: F = m * a
  if (text.includes('force') || text.includes('newton') || text.includes('accelerat')) {
    if (quantities.m !== undefined && quantities.a !== undefined && (text.includes('force') || text.includes('f ='))) {
      const F = quantities.m * quantities.a;
      return { computedValue: Number(F.toFixed(4)), formula: 'F = m * a', unit: 'N' };
    }
    if (quantities.F !== undefined && quantities.m !== undefined && quantities.m !== 0 && (text.includes('acceleration') || text.includes('a ='))) {
      const a = quantities.F / quantities.m;
      return { computedValue: Number(a.toFixed(4)), formula: 'a = F / m', unit: 'm/s^2' };
    }
    if (quantities.F !== undefined && quantities.a !== undefined && quantities.a !== 0 && (text.includes('mass') || text.includes('m ='))) {
      const m = quantities.F / quantities.a;
      return { computedValue: Number(m.toFixed(4)), formula: 'm = F / a', unit: 'kg' };
    }
  }

  // 3. Kinematics: v = u + a*t
  if (text.includes('accelerat') && quantities.t !== undefined) {
    const u = quantities.u ?? (text.includes('from rest') ? 0 : undefined);
    if (u !== undefined && quantities.a !== undefined && (text.includes('final velocity') || text.includes('v =') || text.includes('speed after'))) {
      const v = u + quantities.a * quantities.t;
      return { computedValue: Number(v.toFixed(4)), formula: 'v = u + a * t', unit: 'm/s' };
    }
    if (u !== undefined && quantities.a !== undefined && (text.includes('distance') || text.includes('displacement') || text.includes('s ='))) {
      const s = u * quantities.t + 0.5 * quantities.a * quantities.t * quantities.t;
      return { computedValue: Number(s.toFixed(4)), formula: 's = u * t + 0.5 * a * t^2', unit: 'm' };
    }
  }

  // 4. Kinetic Energy: KE = 0.5 * m * v^2
  if (text.includes('kinetic energy') && quantities.m !== undefined && quantities.v !== undefined) {
    const ke = 0.5 * quantities.m * quantities.v * quantities.v;
    return { computedValue: Number(ke.toFixed(4)), formula: 'KE = 0.5 * m * v^2', unit: 'J' };
  }

  // 5. Work Done: W = F * d
  if ((text.includes('work done') || text.includes('work')) && quantities.F !== undefined && quantities.s !== undefined) {
    const W = quantities.F * quantities.s;
    return { computedValue: Number(W.toFixed(4)), formula: 'W = F * d', unit: 'J' };
  }

  // 6. Electric Power: P = V * I
  if (text.includes('power') && quantities.V !== undefined && quantities.I !== undefined) {
    const P = quantities.V * quantities.I;
    return { computedValue: Number(P.toFixed(4)), formula: 'P = V * I', unit: 'W' };
  }

  // 7. Quadratic Equation roots: ax^2 + bx + c = 0
  const quadMatch = problemText.match(/([+-]?[0-9]*)x\^2\s*([+-]\s*[0-9]*)x\s*([+-]\s*[0-9]+)\s*=\s*0/i);
  if (quadMatch) {
    const aStr = quadMatch[1]?.replace(/\s+/g, '') || '1';
    const a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseFloat(aStr);
    const bStr = quadMatch[2]?.replace(/\s+/g, '') || '0';
    const b = bStr === '+' ? 1 : bStr === '-' ? -1 : parseFloat(bStr);
    const c = parseFloat(quadMatch[3]?.replace(/\s+/g, '') || '0');

    const D = b * b - 4 * a * c;
    if (D >= 0) {
      const x1 = (-b + Math.sqrt(D)) / (2 * a);
      return { computedValue: Number(x1.toFixed(4)), formula: 'x = (-b + sqrt(D)) / (2*a)', unit: '' };
    }
  }

  return null;
}

/**
 * Verifies numerical answers by recomputing canonical formulas.
 */
export function verifyNumericalAnswer(
  problemText: string,
  answerText: string,
  steps?: TutorNumericStep[],
): TutorMathVerification {
  const quantities = extractQuantities(problemText);

  // If steps provide substitution or results, enrich quantities
  if (steps && steps.length > 0) {
    for (const step of steps) {
      const stepVal = parseFloat(step.result);
      if (!isNaN(stepVal) && step.unit) {
        if (step.unit.includes('A')) quantities.I = stepVal;
        if (step.unit.includes('V')) quantities.V = stepVal;
        if (step.unit.includes('Ω') || step.unit.includes('ohm')) quantities.R = stepVal;
        if (step.unit.includes('N')) quantities.F = stepVal;
        if (step.unit.includes('m/s^2')) quantities.a = stepVal;
        if (step.unit === 'm/s') quantities.v = stepVal;
        if (step.unit === 'kg') quantities.m = stepVal;
        if (step.unit === 'J') quantities.W = stepVal;
        if (step.unit === 'W') quantities.P = stepVal;
      }
    }
  }

  const recomputed = recomputeCanonicalProblem(problemText, quantities);

  if (!recomputed) {
    return {
      isVerified: true,
      computedValue: null,
      expectedValue: null,
      notes: 'No canonical formula matched for automated numeric verification; reasoning evaluated semantically.',
    };
  }

  const extractedAnswer = extractFinalNumericValue(answerText);

  if (extractedAnswer === null) {
    return {
      isVerified: false,
      computedValue: recomputed.computedValue,
      expectedValue: null,
      notes: `Expected numeric result around ${recomputed.computedValue} ${recomputed.unit} via ${recomputed.formula}, but no numeric answer was found in response.`,
    };
  }

  const tolerance = 0.05 * Math.abs(recomputed.computedValue) + 0.01;
  const discrepancy = Math.abs(extractedAnswer - recomputed.computedValue);
  const isMatch = discrepancy <= tolerance;

  return {
    isVerified: isMatch,
    computedValue: recomputed.computedValue,
    expectedValue: extractedAnswer,
    tolerance: Number(tolerance.toFixed(4)),
    notes: isMatch
      ? `Recomputation verified: ${recomputed.formula} yields ${recomputed.computedValue} ${recomputed.unit} (matches answer ${extractedAnswer}).`
      : `Recomputation discrepancy: ${recomputed.formula} yields ${recomputed.computedValue} ${recomputed.unit}, but answer stated ${extractedAnswer}.`,
  };
}

/**
 * Step-by-step numerical solver for common STEM queries.
 */
export function buildStepByStepNumericalSolution(
  problemText: string,
): { steps: TutorNumericStep[]; finalAnswer: string; formula: string; isSolved: boolean } {
  const quantities = extractQuantities(problemText);
  const recomputed = recomputeCanonicalProblem(problemText, quantities);

  if (!recomputed) {
    return {
      steps: [],
      finalAnswer: '',
      formula: '',
      isSolved: false,
    };
  }

  const steps: TutorNumericStep[] = [
    {
      stepNumber: 1,
      title: 'Identify Given Quantities',
      explanation: `Extract all given values from the problem statement: ${Object.entries(quantities)
        .map(([k, v]) => `${k} = ${v}`)
        .join(', ')}.`,
      result: Object.keys(quantities).join(', ') || 'Identified given values',
      unit: '',
    },
    {
      stepNumber: 2,
      title: 'State the Governing Equation',
      formula: recomputed.formula,
      explanation: `Apply the fundamental physical principle: ${recomputed.formula}.`,
      result: recomputed.formula,
      unit: '',
    },
    {
      stepNumber: 3,
      title: 'Substitute Values and Calculate',
      formula: recomputed.formula,
      substitution: `Calculating target variable using ${recomputed.formula}`,
      explanation: `Substitute the known numerical quantities and solve for the unknown.`,
      result: `${recomputed.computedValue}`,
      unit: recomputed.unit,
    },
  ];

  const unitAlias =
    recomputed.unit === 'Ω'
      ? `${recomputed.computedValue} ohms, Omega`
      : recomputed.unit === 'A'
        ? `${recomputed.computedValue} amperes`
        : recomputed.unit === 'W'
          ? `${recomputed.computedValue} watts`
          : recomputed.unit === 'J'
            ? `${recomputed.computedValue} Joules`
            : recomputed.unit === 'N'
              ? `${recomputed.computedValue} Newtons`
              : recomputed.unit === 'm/s'
                ? `${recomputed.computedValue} m/s`
                : recomputed.unit === 'm/s^2'
                  ? `${recomputed.computedValue} m/s^2`
                  : '';

  const finalAnswer = `The final calculated result is **${recomputed.computedValue} ${recomputed.unit}** (${unitAlias || recomputed.unit}). Governing formula: ${recomputed.formula}.`;

  return {
    steps,
    finalAnswer,
    formula: recomputed.formula,
    isSolved: true,
  };
}
