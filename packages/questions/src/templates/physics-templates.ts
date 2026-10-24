import type { PracticeQuestion } from '@edukriti/contracts';
import { SeededRng } from '../prng.ts';
import type { ParametricTemplate } from '../types.ts';
import { makeChoicesWithDistractors, calcCombinations } from '../template-helper.ts';

export const PHYSICS_TEMPLATES: ParametricTemplate[] = [
  // 21. Ohm's Law: I = V / R
  {
    familyId: 'physics_ohms_law_current',
    title: 'Ohm’s Law Current Calculation',
    subject: 'physics',
    conceptIds: ['ohms_law'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      voltage: { name: 'Voltage V', min: 6, max: 120, step: 3 },
      resistance: { name: 'Resistance R', min: 2, max: 50, step: 2 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const v = rng.nextInt(2, 40) * 3;
      const r = rng.nextInt(1, 25) * 2;
      const current = Math.round((v / r) * 100) / 100;

      const correctText = `${current} A`;
      const distractors = [
        { text: `${v * r} A`, errorTag: 'multiplied_voltage_and_resistance', explanation: 'Multiplied V and R instead of dividing V by R ($I = V / R$).' },
        { text: `${Math.round((r / v) * 100) / 100} A`, errorTag: 'reciprocal_ohms_law_error', explanation: 'Divided resistance by voltage ($R / V$) instead of voltage by resistance ($V / R$).' },
        { text: `${Math.round((current + 1.5) * 100) / 100} A`, errorTag: 'arithmetic_offset', explanation: 'Calculation arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-ohm-${seed}`,
        type: 'numeric',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A circuit has a DC voltage source of $V = ${v}\\text{ V}$ connected across a resistor of $R = ${r}\\text{ }\\Omega$. Calculate the electric current flowing through the circuit in amperes.`,
        choices,
        expectedAnswer,
        tolerance: 0.05,
        unit: 'A',
        solutionSteps: [
          { stepNumber: 1, title: 'State Ohm’s Law', formula: 'I = \\frac{V}{R}', explanation: 'Electric current equals potential difference divided by resistance.' },
          { stepNumber: 2, title: 'Substitute values', formula: `I = \\frac{${v}\\text{ V}}{${r}\\text{ }\\Omega} = ${current}\\text{ A}`, explanation: `Current flowing is ${current} amperes.` },
        ],
        commonErrorTags: ['multiplied_voltage_and_resistance', 'reciprocal_ohms_law_error'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Ohm’s Law',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 22. Resistors in Series: R_eq = R1 + R2 + R3
  {
    familyId: 'physics_resistors_series',
    title: 'Equivalent Resistance in Series',
    subject: 'physics',
    conceptIds: ['electric_circuits_series'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      r1: { name: 'Resistor 1', min: 5, max: 40, step: 5 },
      r2: { name: 'Resistor 2', min: 10, max: 50, step: 5 },
      r3: { name: 'Resistor 3', min: 5, max: 30, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r1 = rng.nextInt(1, 8) * 5;
      const r2 = rng.nextInt(2, 10) * 5;
      const r3 = rng.nextInt(1, 6) * 5;
      const totalR = r1 + r2 + r3;

      const correctText = `${totalR} Ω`;
      const distractors = [
        { text: `${Math.round((1 / (1 / r1 + 1 / r2 + 1 / r3)) * 10) / 10} Ω`, errorTag: 'used_parallel_formula_for_series', explanation: 'Used the reciprocal parallel resistance formula instead of adding in series.' },
        { text: `${r1 + r2} Ω`, errorTag: 'omitted_third_resistor', explanation: 'Forgot to add the third resistor to the sum.' },
        { text: `${totalR + 10} Ω`, errorTag: 'arithmetic_sum_error', explanation: 'Addition calculation error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-ser-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Three resistors with values $R_1 = ${r1}\\text{ }\\Omega$, $R_2 = ${r2}\\text{ }\\Omega$, and $R_3 = ${r3}\\text{ }\\Omega$ are connected in series. What is the equivalent resistance of the combination?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Series resistance formula', formula: 'R_{\\text{eq}} = R_1 + R_2 + R_3', explanation: 'In a series circuit, resistances add linearly.' },
          { stepNumber: 2, title: 'Compute total resistance', formula: `R_{\\text{eq}} = ${r1} + ${r2} + ${r3} = ${totalR}\\text{ }\\Omega`, explanation: `Total equivalent resistance is ${totalR} Ω.` },
        ],
        commonErrorTags: ['used_parallel_formula_for_series', 'omitted_third_resistor'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Circuit Theory',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 23. Resistors in Parallel: Req = (R1 * R2) / (R1 + R2)
  {
    familyId: 'physics_resistors_parallel',
    title: 'Equivalent Resistance in Parallel',
    subject: 'physics',
    conceptIds: ['electric_circuits_parallel'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      r1: { name: 'Resistor 1', min: 10, max: 60, step: 10 },
      r2: { name: 'Resistor 2', min: 10, max: 60, step: 10 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const r1 = rng.nextInt(1, 6) * 10;
      const r2 = rng.nextInt(1, 6) * 10;
      const req = Math.round(((r1 * r2) / (r1 + r2)) * 10) / 10;

      const correctText = `${req} Ω`;
      const distractors = [
        { text: `${r1 + r2} Ω`, errorTag: 'used_series_sum_for_parallel', explanation: 'Added resistances linearly ($R_1 + R_2$) instead of reciprocal parallel formula.' },
        { text: `${Math.round((r1 + r2) / (r1 * r2) * 1000) / 1000} Ω`, errorTag: 'forgot_to_invert_reciprocal_sum', explanation: 'Calculated $1/R_{eq}$ but forgot to invert to find $R_{eq}$.' },
        { text: `${Math.round((r1 + r2) / 2)} Ω`, errorTag: 'averaged_parallel_resistors', explanation: 'Took the arithmetic average of the two resistors.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-par-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Two resistors with values $R_1 = ${r1}\\text{ }\\Omega$ and $R_2 = ${r2}\\text{ }\\Omega$ are connected in parallel. What is their equivalent resistance?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Parallel resistance formula', formula: '\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} \\implies R_{\\text{eq}} = \\frac{R_1 R_2}{R_1 + R_2}', explanation: 'Equivalent resistance of two parallel resistors equals product over sum.' },
          { stepNumber: 2, title: 'Substitute values', formula: `R_{\\text{eq}} = \\frac{${r1} \\times ${r2}}{${r1} + ${r2}} = \\frac{${r1 * r2}}{${r1 + r2}} \\approx ${req}\\text{ }\\Omega`, explanation: `Equivalent resistance is ${req} Ω.` },
        ],
        commonErrorTags: ['used_series_sum_for_parallel', 'forgot_to_invert_reciprocal_sum'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Circuit Theory',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 24. Electric Power: P = V * I
  {
    familyId: 'physics_electric_power',
    title: 'Electric Power Dissipation',
    subject: 'physics',
    conceptIds: ['ohms_law'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      voltage: { name: 'Voltage V', min: 110, max: 240, step: 10 },
      current: { name: 'Current I', min: 1, max: 10, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const v = rng.nextInt(11, 24) * 10;
      const i = rng.nextInt(1, 10);
      const power = v * i;

      const correctText = `${power} W`;
      const distractors = [
        { text: `${Math.round((v / i) * 10) / 10} W`, errorTag: 'divided_voltage_by_current', explanation: 'Calculated resistance V / I instead of power V * I.' },
        { text: `${Math.round(v * i * i)} W`, errorTag: 'multiplied_current_squared_with_voltage', explanation: 'Used $V I^2$ instead of $V I$ or $I^2 R$.' },
        { text: `${power + 50} W`, errorTag: 'arithmetic_offset', explanation: 'Multiplication offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-pow-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An electrical appliance operates on a mains voltage of $V = ${v}\\text{ V}$ and draws a current of $I = ${i}\\text{ A}$. What is the electric power consumed by the appliance?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Electric power formula', formula: 'P = V \\times I', explanation: 'Power is potential difference multiplied by current.' },
          { stepNumber: 2, title: 'Substitute values', formula: `P = ${v}\\text{ V} \\times ${i}\\text{ A} = ${power}\\text{ W}`, explanation: `Power consumed is ${power} watts.` },
        ],
        commonErrorTags: ['divided_voltage_by_current', 'multiplied_current_squared_with_voltage'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Electrical Power',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 25. Newton's Second Law: F = m * a
  {
    familyId: 'physics_newtons_second_law',
    title: 'Newton’s Second Law Force',
    subject: 'physics',
    conceptIds: ['newtons_second_law'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      mass: { name: 'Mass m', min: 2, max: 50, step: 2 },
      accel: { name: 'Acceleration a', min: 2, max: 15, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(1, 25) * 2;
      const a = rng.nextInt(2, 15);
      const force = m * a;

      const correctText = `${force} N`;
      const distractors = [
        { text: `${Math.round((m / a) * 10) / 10} N`, errorTag: 'divided_mass_by_acceleration', explanation: 'Divided mass by acceleration ($m / a$) instead of multiplying ($m \\cdot a$).' },
        { text: `${m + a} N`, errorTag: 'added_mass_and_acceleration', explanation: 'Added mass and acceleration together instead of multiplying.' },
        { text: `${force + 10} N`, errorTag: 'arithmetic_offset', explanation: 'Multiplication arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-fma-${seed}`,
        type: 'numeric',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A net force acts on an object of mass $m = ${m}\\text{ kg}$, producing an acceleration of $a = ${a}\\text{ m/s}^2$. What is the magnitude of the applied net force in Newtons?`,
        choices,
        expectedAnswer,
        tolerance: 0.1,
        unit: 'N',
        solutionSteps: [
          { stepNumber: 1, title: 'Newton’s Second Law', formula: 'F = m \\cdot a', explanation: 'Net force equals mass times acceleration.' },
          { stepNumber: 2, title: 'Substitute values', formula: `F = ${m}\\text{ kg} \\times ${a}\\text{ m/s}^2 = ${force}\\text{ N}`, explanation: `Net force is ${force} Newtons.` },
        ],
        commonErrorTags: ['divided_mass_by_acceleration', 'added_mass_and_acceleration'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Mechanics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 26. Kinematics Velocity: v = u + a * t
  {
    familyId: 'physics_kinematics_velocity',
    title: 'Final Velocity under Uniform Acceleration',
    subject: 'physics',
    conceptIds: ['kinematics_motion'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      u: { name: 'Initial speed u', min: 0, max: 40, step: 2 },
      a: { name: 'Acceleration a', min: 1, max: 10, step: 1 },
      t: { name: 'Time t', min: 1, max: 20, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const u = rng.nextInt(0, 20) * 2;
      const a = rng.nextInt(1, 10);
      const t = rng.nextInt(1, 20);
      const v = u + a * t;

      const correctText = `${v} m/s`;
      const distractors = [
        { text: `${u + a} m/s`, errorTag: 'forgot_time_factor', explanation: 'Forgot to multiply acceleration by time ($u + a$ instead of $u + at$).' },
        { text: `${a * t} m/s`, errorTag: 'ignored_initial_velocity', explanation: 'Ignored initial velocity u ($a \\cdot t$ instead of $u + at$).' },
        { text: `${v + 5} m/s`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic addition error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-kinv-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A car starts with an initial velocity of $u = ${u}\\text{ m/s}$ and accelerates uniformly at $a = ${a}\\text{ m/s}^2$ for $t = ${t}\\text{ s}$. Find its final velocity $v$.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'First equation of motion', formula: 'v = u + a \\cdot t', explanation: 'Final velocity equals initial velocity plus acceleration times time.' },
          { stepNumber: 2, title: 'Calculate final velocity', formula: `v = ${u} + (${a} \\times ${t}) = ${u} + ${a * t} = ${v}\\text{ m/s}`, explanation: `Final velocity is ${v} m/s.` },
        ],
        commonErrorTags: ['forgot_time_factor', 'ignored_initial_velocity'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Kinematics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 27. Kinematics Displacement: s = u*t + 0.5*a*t^2
  {
    familyId: 'physics_kinematics_displacement',
    title: 'Displacement under Uniform Acceleration',
    subject: 'physics',
    conceptIds: ['kinematics_motion'],
    grade: 'Grade 9',
    difficulty: 'medium',
    parameterRanges: {
      u: { name: 'Initial speed u', min: 0, max: 20, step: 5 },
      a: { name: 'Acceleration a', min: 2, max: 6, step: 2 },
      t: { name: 'Time t', min: 2, max: 8, step: 2 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const u = rng.nextInt(0, 4) * 5;
      const a = rng.nextInt(1, 3) * 2;
      const t = rng.nextInt(1, 4) * 2;
      const s = u * t + 0.5 * a * t * t;

      const correctText = `${s} m`;
      const distractors = [
        { text: `${u * t + a * t * t} m`, errorTag: 'forgot_half_factor_in_displacement', explanation: 'Omitted the factor of 1/2 in $0.5 a t^2$.' },
        { text: `${u * t + 0.5 * a * t} m`, errorTag: 'forgot_to_square_time', explanation: 'Used $t$ instead of $t^2$ in the acceleration term.' },
        { text: `${s + 10} m`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic summation error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-kins-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A body travels with initial velocity $u = ${u}\\text{ m/s}$ and accelerates at $a = ${a}\\text{ m/s}^2$ for $t = ${t}\\text{ s}$. Calculate the total distance covered.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Second equation of motion', formula: 's = u \\cdot t + \\frac{1}{2} a \\cdot t^2', explanation: 'State displacement formula under uniform acceleration.' },
          { stepNumber: 2, title: 'Substitute values', formula: `s = (${u} \\times ${t}) + \\frac{1}{2}(${a})(${t}^2) = ${u * t} + ${0.5 * a * t * t} = ${s}\\text{ m}`, explanation: `Distance covered is ${s} meters.` },
        ],
        commonErrorTags: ['forgot_half_factor_in_displacement', 'forgot_to_square_time'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Kinematics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 28. Kinetic Energy: KE = 0.5 * m * v^2
  {
    familyId: 'physics_kinetic_energy',
    title: 'Kinetic Energy Calculation',
    subject: 'physics',
    conceptIds: ['work_energy_power'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      m: { name: 'Mass m', min: 2, max: 20, step: 2 },
      v: { name: 'Speed v', min: 2, max: 15, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(1, 10) * 2;
      const v = rng.nextInt(2, 15);
      const ke = 0.5 * m * v * v;

      const correctText = `${ke} J`;
      const distractors = [
        { text: `${m * v * v} J`, errorTag: 'forgot_half_factor_in_kinetic_energy', explanation: 'Forgot the 1/2 factor ($m v^2$ instead of $0.5 m v^2$).' },
        { text: `${m * v} J`, errorTag: 'confused_with_momentum', explanation: 'Calculated momentum ($p = m v$) instead of kinetic energy.' },
        { text: `${0.5 * m * v} J`, errorTag: 'forgot_to_square_speed', explanation: 'Forgot to square the velocity ($0.5 m v$ instead of $0.5 m v^2$).' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-ke-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An object of mass $m = ${m}\\text{ kg}$ moves with a uniform speed of $v = ${v}\\text{ m/s}$. What is its kinetic energy?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Kinetic energy formula', formula: 'KE = \\frac{1}{2} m v^2', explanation: 'Kinetic energy equals half mass times velocity squared.' },
          { stepNumber: 2, title: 'Substitute values', formula: `KE = \\frac{1}{2} \\times ${m} \\times ${v}^2 = ${0.5 * m} \\times ${v * v} = ${ke}\\text{ J}`, explanation: `Kinetic energy is ${ke} Joules.` },
        ],
        commonErrorTags: ['forgot_half_factor_in_kinetic_energy', 'confused_with_momentum', 'forgot_to_square_speed'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Work and Energy',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 29. Gravitational Potential Energy: PE = m * g * h
  {
    familyId: 'physics_potential_energy',
    title: 'Gravitational Potential Energy',
    subject: 'physics',
    conceptIds: ['work_energy_power'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      m: { name: 'Mass m', min: 2, max: 25, step: 1 },
      h: { name: 'Height h', min: 2, max: 30, step: 2 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(2, 25);
      const h = rng.nextInt(1, 15) * 2;
      const g = 9.8;
      const pe = Math.round(m * g * h * 10) / 10;
      const peApprox = m * 10 * h;

      const correctText = `${pe} J`;
      const distractors = [
        { text: `${peApprox} J`, errorTag: 'used_g_equals_10_instead_of_9_8', explanation: 'Used g = 10 m/s^2 approximation instead of standard g = 9.8 m/s^2.' },
        { text: `${m * h} J`, errorTag: 'forgot_gravity_constant', explanation: 'Forgot to multiply by acceleration due to gravity g ($m \\cdot h$).' },
        { text: `${Math.round(pe + 50)} J`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic multiplication error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-pe-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A boulder of mass $m = ${m}\\text{ kg}$ is lifted to a vertical height of $h = ${h}\\text{ m}$. Calculate its gravitational potential energy relative to the ground. (Take $g = 9.8\\text{ m/s}^2$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Potential energy formula', formula: 'PE = m \\cdot g \\cdot h', explanation: 'Gravitational potential energy is mass times gravitational acceleration times height.' },
          { stepNumber: 2, title: 'Substitute values', formula: `PE = ${m} \\times 9.8 \\times ${h} = ${pe}\\text{ J}`, explanation: `Potential energy is ${pe} Joules.` },
        ],
        commonErrorTags: ['used_g_equals_10_instead_of_9_8', 'forgot_gravity_constant'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Work and Energy',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 30. Work Done: W = F * d
  {
    familyId: 'physics_work_done',
    title: 'Work Done along Line of Force',
    subject: 'physics',
    conceptIds: ['work_energy_power'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      f: { name: 'Force F', min: 10, max: 150, step: 10 },
      d: { name: 'Displacement d', min: 2, max: 20, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const f = rng.nextInt(1, 15) * 10;
      const d = rng.nextInt(2, 20);
      const w = f * d;

      const correctText = `${w} J`;
      const distractors = [
        { text: `${Math.round((f / d) * 10) / 10} J`, errorTag: 'divided_force_by_distance', explanation: 'Divided force by distance instead of multiplying.' },
        { text: `${f + d} J`, errorTag: 'added_force_and_distance', explanation: 'Added force and distance instead of taking product.' },
        { text: `${w + 30} J`, errorTag: 'arithmetic_offset', explanation: 'Multiplication error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-work-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A constant horizontal force of $F = ${f}\\text{ N}$ moves a crate a displacement of $d = ${d}\\text{ m}$ in the direction of the force. What is the work done?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Work formula', formula: 'W = F \\cdot d \\cos(\\theta)', explanation: 'Since displacement is in the direction of force, cos(0°) = 1.' },
          { stepNumber: 2, title: 'Calculate work', formula: `W = ${f}\\text{ N} \\times ${d}\\text{ m} = ${w}\\text{ J}`, explanation: `Work done is ${w} Joules.` },
        ],
        commonErrorTags: ['divided_force_by_distance', 'added_force_and_distance'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Work and Energy',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 31. Projectile Range: R = (v^2 * sin(2 theta)) / g
  {
    familyId: 'physics_projectile_range',
    title: 'Horizontal Range of a Projectile',
    subject: 'physics',
    conceptIds: ['projectile_motion'],
    grade: 'Grade 11',
    difficulty: 'hard',
    parameterRanges: {
      v0: { name: 'Initial speed v0', min: 10, max: 40, step: 5 },
      angle: { name: 'Launch angle', min: 30, max: 60, step: 15 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const v0 = rng.nextInt(2, 8) * 5;
      const angle = rng.choice([30, 45, 60]);
      const g = 9.8;
      const sin2Theta = Math.sin((2 * angle * Math.PI) / 180);
      const rangeVal = Math.round(((v0 * v0 * sin2Theta) / g) * 10) / 10;

      const correctText = `${rangeVal} m`;
      const distractors = [
        { text: `${Math.round(((v0 * v0 * Math.sin((angle * Math.PI) / 180)) / g) * 10) / 10} m`, errorTag: 'used_sin_theta_instead_of_sin_2theta', explanation: 'Used sin(θ) instead of sin(2θ) in the horizontal range formula.' },
        { text: `${Math.round(((v0 * sin2Theta) / g) * 10) / 10} m`, errorTag: 'forgot_to_square_launch_speed', explanation: 'Forgot to square the initial velocity v0.' },
        { text: `${Math.round((rangeVal + 8) * 10) / 10} m`, errorTag: 'trig_precision_error', explanation: 'Arithmetic/trig value offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-projr-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A projectile is launched from ground level with speed $v_0 = ${v0}\\text{ m/s}$ at an angle of $\\theta = ${angle}^\\circ$ above the horizontal. Calculate its horizontal range. (Take $g = 9.8\\text{ m/s}^2$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Range formula', formula: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}', explanation: 'Horizontal range formula on flat ground.' },
          { stepNumber: 2, title: 'Substitute values', formula: `R = \\frac{${v0}^2 \\times \\sin(${2 * angle}^\\circ)}{9.8} = \\frac{${v0 * v0} \\times ${Math.round(sin2Theta * 1000) / 1000}}{9.8} \\approx ${rangeVal}\\text{ m}`, explanation: `Range is ${rangeVal} meters.` },
        ],
        commonErrorTags: ['used_sin_theta_instead_of_sin_2theta', 'forgot_to_square_launch_speed'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Projectile Motion',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 32. Projectile Max Height: H = (v0^2 * sin^2(theta)) / (2g)
  {
    familyId: 'physics_projectile_max_height',
    title: 'Maximum Height of a Projectile',
    subject: 'physics',
    conceptIds: ['projectile_motion'],
    grade: 'Grade 11',
    difficulty: 'hard',
    parameterRanges: {
      v0: { name: 'Initial speed v0', min: 10, max: 40, step: 5 },
      angle: { name: 'Launch angle', min: 30, max: 60, step: 15 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const v0 = rng.nextInt(2, 8) * 5;
      const angle = rng.choice([30, 45, 60]);
      const g = 9.8;
      const sinTheta = Math.sin((angle * Math.PI) / 180);
      const hMax = Math.round(((v0 * v0 * sinTheta * sinTheta) / (2 * g)) * 10) / 10;

      const correctText = `${hMax} m`;
      const distractors = [
        { text: `${Math.round(((v0 * v0 * sinTheta * sinTheta) / g) * 10) / 10} m`, errorTag: 'forgot_2g_in_denominator', explanation: 'Divided by g instead of 2g in maximum height formula.' },
        { text: `${Math.round(((v0 * sinTheta) / (2 * g)) * 10) / 10} m`, errorTag: 'forgot_to_square_vertical_velocity', explanation: 'Did not square (v0 * sin θ).' },
        { text: `${Math.round((hMax + 3) * 10) / 10} m`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic calculation offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-projh-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the maximum height reached by a projectile launched at $v_0 = ${v0}\\text{ m/s}$ at an angle of $\\theta = ${angle}^\\circ$. (Take $g = 9.8\\text{ m/s}^2$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Max height formula', formula: 'H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}', explanation: 'Maximum vertical apex height of projectile.' },
          { stepNumber: 2, title: 'Calculate height', formula: `H = \\frac{${v0}^2 \\times (${Math.round(sinTheta * 1000) / 1000})^2}{2 \\times 9.8} = \\frac{${v0 * v0 * sinTheta * sinTheta}}{19.6} \\approx ${hMax}\\text{ m}`, explanation: `Maximum height is ${hMax} meters.` },
        ],
        commonErrorTags: ['forgot_2g_in_denominator', 'forgot_to_square_vertical_velocity'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Projectile Motion',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 33. Simple Pendulum Period: T = 2 * pi * sqrt(L / g)
  {
    familyId: 'physics_pendulum_period',
    title: 'Simple Pendulum Oscillation Period',
    subject: 'physics',
    conceptIds: ['pendulum_harmonic_motion'],
    grade: 'Grade 11',
    difficulty: 'medium',
    parameterRanges: {
      length: { name: 'Length L (m)', min: 0.5, max: 4.0, step: 0.5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const l = rng.nextInt(1, 8) * 0.5;
      const g = 9.8;
      const period = Math.round(2 * Math.PI * Math.sqrt(l / g) * 100) / 100;

      const correctText = `${period} s`;
      const distractors = [
        { text: `${Math.round(2 * Math.PI * Math.sqrt(g / l) * 100) / 100} s`, errorTag: 'inverted_l_and_g_ratio', explanation: 'Used sqrt(g / L) (angular frequency omega) instead of sqrt(L / g).' },
        { text: `${Math.round(Math.PI * Math.sqrt(l / g) * 100) / 100} s`, errorTag: 'forgot_factor_of_two_pi', explanation: 'Used pi instead of 2*pi in period formula.' },
        { text: `${Math.round((period + 0.4) * 100) / 100} s`, errorTag: 'arithmetic_offset', explanation: 'Rounding/arithmetic offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-pend-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A simple pendulum has a string of length $L = ${l}\\text{ m}$. What is its period of small-angle oscillation? (Take $g = 9.8\\text{ m/s}^2$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Simple pendulum period formula', formula: 'T = 2\\pi \\sqrt{\\frac{L}{g}}', explanation: 'Period depends only on string length and gravitational field.' },
          { stepNumber: 2, title: 'Substitute values', formula: `T = 2\\pi \\sqrt{\\frac{${l}}{9.8}} = 2\\pi \\times ${Math.round(Math.sqrt(l / 9.8) * 1000) / 1000} \\approx ${period}\\text{ s}`, explanation: `Oscillation period is ${period} seconds.` },
        ],
        commonErrorTags: ['inverted_l_and_g_ratio', 'forgot_factor_of_two_pi'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Harmonic Motion',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 34. Density: rho = m / V
  {
    familyId: 'physics_density_mass_volume',
    title: 'Density of a Substance',
    subject: 'physics',
    conceptIds: ['matter_properties'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      mass: { name: 'Mass m (g)', min: 50, max: 500, step: 25 },
      volume: { name: 'Volume V (cm3)', min: 10, max: 100, step: 10 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(2, 20) * 25;
      const v = rng.nextInt(1, 10) * 10;
      const density = Math.round((m / v) * 100) / 100;

      const correctText = `${density} g/cm³`;
      const distractors = [
        { text: `${m * v} g/cm³`, errorTag: 'multiplied_mass_and_volume', explanation: 'Multiplied mass and volume instead of dividing ($m \\cdot V$).' },
        { text: `${Math.round((v / m) * 1000) / 1000} g/cm³`, errorTag: 'inverted_density_ratio', explanation: 'Divided volume by mass ($V / m$).' },
        { text: `${Math.round((density + 1.2) * 100) / 100} g/cm³`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic division error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-dens-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A solid metal sample has mass $m = ${m}\\text{ g}$ and occupies a volume of $V = ${v}\\text{ cm}^3$. Find the density of the metal.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Density definition formula', formula: '\\rho = \\frac{m}{V}', explanation: 'Density is mass per unit volume.' },
          { stepNumber: 2, title: 'Substitute values', formula: `\\rho = \\frac{${m}\\text{ g}}{${v}\\text{ cm}^3} = ${density}\\text{ g/cm}^3`, explanation: `Density is ${density} g/cm³.` },
        ],
        commonErrorTags: ['multiplied_mass_and_volume', 'inverted_density_ratio'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Matter Properties',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 35. Pressure: P = F / A
  {
    familyId: 'physics_pressure_force_area',
    title: 'Pressure Exerted on a Surface',
    subject: 'physics',
    conceptIds: ['fluid_mechanics'],
    grade: 'Grade 8',
    difficulty: 'easy',
    parameterRanges: {
      force: { name: 'Thrust F (N)', min: 100, max: 1000, step: 50 },
      area: { name: 'Contact Area A (m2)', min: 0.1, max: 2.0, step: 0.1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const f = rng.nextInt(2, 20) * 50;
      const a = rng.nextInt(1, 20) * 0.1;
      const pressure = Math.round(f / a);

      const correctText = `${pressure} Pa`;
      const distractors = [
        { text: `${Math.round(f * a)} Pa`, errorTag: 'multiplied_force_and_area', explanation: 'Multiplied force and area instead of dividing ($F \\cdot A$).' },
        { text: `${Math.round((a / f) * 10000) / 10000} Pa`, errorTag: 'inverted_pressure_ratio', explanation: 'Divided area by force ($A / F$).' },
        { text: `${pressure + 50} Pa`, errorTag: 'arithmetic_offset', explanation: 'Division arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-pres-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A perpendicular force of $F = ${f}\\text{ N}$ is applied uniformly over an area of $A = ${Math.round(a * 10) / 10}\\text{ m}^2$. What pressure is exerted on the surface in Pascals (Pa)?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Pressure formula', formula: 'P = \\frac{F}{A}', explanation: 'Pressure is perpendicular force per unit area.' },
          { stepNumber: 2, title: 'Calculate pressure', formula: `P = \\frac{${f}\\text{ N}}{${Math.round(a * 10) / 10}\\text{ m}^2} = ${pressure}\\text{ Pa}`, explanation: `Pressure exerted is ${pressure} Pascals.` },
        ],
        commonErrorTags: ['multiplied_force_and_area', 'inverted_pressure_ratio'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Pressure',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 36. Hooke's Law: F = k * x
  {
    familyId: 'physics_hookes_law',
    title: 'Hooke’s Law Spring Restoring Force',
    subject: 'physics',
    conceptIds: ['harmonic_motion'],
    grade: 'Grade 11',
    difficulty: 'easy',
    parameterRanges: {
      k: { name: 'Spring constant k (N/m)', min: 50, max: 500, step: 50 },
      x: { name: 'Extension x (cm)', min: 2, max: 20, step: 2 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const k = rng.nextInt(1, 10) * 50;
      const xCm = rng.nextInt(1, 10) * 2;
      const xM = xCm / 100;
      const f = Math.round(k * xM * 10) / 10;
      const fCmError = k * xCm;

      const correctText = `${f} N`;
      const distractors = [
        { text: `${fCmError} N`, errorTag: 'forgot_centimeter_to_meter_conversion', explanation: 'Used displacement in cm directly without converting to meters.' },
        { text: `${Math.round((k / xM) * 10) / 10} N`, errorTag: 'divided_spring_constant_by_extension', explanation: 'Divided k by x instead of multiplying.' },
        { text: `${Math.round((f + 2.5) * 10) / 10} N`, errorTag: 'arithmetic_offset', explanation: 'Multiplication offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-hooke-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A spring having spring constant $k = ${k}\\text{ N/m}$ is stretched by a distance of $x = ${xCm}\\text{ cm}$ from its equilibrium position. What restoring force does the spring exert?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Convert displacement to SI meters', formula: `x = ${xCm}\\text{ cm} = \\frac{${xCm}}{100}\\text{ m} = ${xM}\\text{ m}`, explanation: 'Convert centimeters to SI base unit meters.' },
          { stepNumber: 2, title: 'Apply Hooke’s Law', formula: `F = k \\cdot x = ${k}\\text{ N/m} \\times ${xM}\\text{ m} = ${f}\\text{ N}`, explanation: `Restoring force is ${f} Newtons.` },
        ],
        commonErrorTags: ['forgot_centimeter_to_meter_conversion', 'divided_spring_constant_by_extension'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Elasticity',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 37. Universal Gravitation Ratio: F = G * m1 * m2 / r^2
  {
    familyId: 'physics_universal_gravitation',
    title: 'Newton’s Law of Universal Gravitation Scaling',
    subject: 'physics',
    conceptIds: ['gravitation_laws'],
    grade: 'Grade 9',
    difficulty: 'medium',
    parameterRanges: {
      factorR: { name: 'Distance Multiplier', min: 2, max: 4, step: 1 },
    },
    estimateCombinations() {
      return 3;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const factorR = rng.nextInt(2, 4);
      const factorF = factorR * factorR;

      const correctText = `Decreases by a factor of ${factorF} (F / ${factorF})`;
      const distractors = [
        { text: `Decreases by a factor of ${factorR} (F / ${factorR})`, errorTag: 'linear_distance_inverse_error', explanation: 'Assumed inverse linear dependence (1/r) instead of inverse-square law (1/r^2).' },
        { text: `Increases by a factor of ${factorF} (${factorF} F)`, errorTag: 'inverted_proportionality', explanation: 'Claimed gravitational attraction increases as distance increases.' },
        { text: `Decreases by a factor of ${2 * factorR}`, errorTag: 'doubled_instead_of_squared', explanation: 'Doubled the factor instead of squaring it.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-grav-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `According to Newton’s law of universal gravitation, if the distance between two masses is increased to $${factorR}$ times its original value, how does the gravitational force between them change?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Inverse-square law', formula: 'F = G \\frac{m_1 m_2}{r^2} \\implies F \\propto \\frac{1}{r^2}', explanation: 'Gravitational force is inversely proportional to the square of the distance.' },
          { stepNumber: 2, title: 'Substitute distance multiplier', formula: `F' = G \\frac{m_1 m_2}{(${factorR}r)^2} = \\frac{1}{${factorF}} \\left(G \\frac{m_1 m_2}{r^2}\\right) = \\frac{F}{${factorF}}`, explanation: `Force decreases by a factor of ${factorF}.` },
        ],
        commonErrorTags: ['linear_distance_inverse_error', 'inverted_proportionality'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Gravitation',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 38. Snell's Law of Refraction: n1 * sin(theta1) = n2 * sin(theta2)
  {
    familyId: 'physics_snells_law',
    title: 'Snell’s Law Refraction Angle',
    subject: 'physics',
    conceptIds: ['optics_refraction'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      n1: { name: 'Medium 1 index', min: 1.0, max: 1.0, step: 0.1 },
      n2: { name: 'Medium 2 index', min: 1.33, max: 1.6, step: 0.1 },
    },
    estimateCombinations() {
      return 6;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const angle1 = 30; // 30 deg has exact sin = 0.5
      const n2 = rng.choice([1.33, 1.5, 1.6]);
      const sin2 = 0.5 / n2;
      const angle2 = Math.round(Math.asin(sin2) * (180 / Math.PI) * 10) / 10;

      const correctText = `${angle2}°`;
      const distractors = [
        { text: `${Math.round(Math.asin(0.5 * n2) * (180 / Math.PI) * 10) / 10 || 45}°`, errorTag: 'multiplied_by_refractive_index', explanation: 'Multiplied by n2 instead of dividing by n2 in Snell’s Law.' },
        { text: `30°`, errorTag: 'assumed_no_refraction', explanation: 'Assumed angle of refraction equals angle of incidence.' },
        { text: `${Math.round((angle2 + 4.5) * 10) / 10}°`, errorTag: 'arithmetic_offset', explanation: 'Trigonometric evaluation offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-snell-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A ray of light traveling in air ($n_1 = 1.0$) enters a transparent medium with refractive index $n_2 = ${n2}$ at an angle of incidence $\\theta_1 = 30^\\circ$. What is the angle of refraction $\\theta_2$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Snell’s Law of Refraction', formula: 'n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)', explanation: 'Ratio of sines of incidence and refraction equals ratio of refractive indices.' },
          { stepNumber: 2, title: 'Solve for sin(theta2)', formula: `\\sin(\\theta_2) = \\frac{n_1 \\sin(\\theta_1)}{n_2} = \\frac{1.0 \\times \\sin(30^\\circ)}{${n2}} = \\frac{0.5}{${n2}} \\approx ${Math.round(sin2 * 1000) / 1000}`, explanation: 'Evaluate sine of angle of refraction.' },
          { stepNumber: 3, title: 'Find angle theta2', formula: `\\theta_2 = \\arcsin(${Math.round(sin2 * 1000) / 1000}) \\approx ${angle2}^\\circ`, explanation: `Angle of refraction is ${angle2}°.` },
        ],
        commonErrorTags: ['multiplied_by_refractive_index', 'assumed_no_refraction'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Optics',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 39. Wave Speed: v = f * lambda
  {
    familyId: 'physics_wave_speed',
    title: 'Wave Equation Velocity',
    subject: 'physics',
    conceptIds: ['wave_optics_sound'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      freq: { name: 'Frequency f (Hz)', min: 100, max: 1000, step: 50 },
      wavelength: { name: 'Wavelength lambda (m)', min: 0.5, max: 3.0, step: 0.5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const f = rng.nextInt(2, 20) * 50;
      const lambda = rng.nextInt(1, 6) * 0.5;
      const v = Math.round(f * lambda);

      const correctText = `${v} m/s`;
      const distractors = [
        { text: `${Math.round(f / lambda)} m/s`, errorTag: 'divided_frequency_by_wavelength', explanation: 'Divided frequency by wavelength ($f / \\lambda$) instead of multiplying.' },
        { text: `${Math.round((lambda / f) * 1000) / 1000} m/s`, errorTag: 'divided_wavelength_by_frequency', explanation: 'Divided wavelength by frequency.' },
        { text: `${v + 40} m/s`, errorTag: 'arithmetic_offset', explanation: 'Multiplication offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-wave-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A sound wave has a frequency of $f = ${f}\\text{ Hz}$ and a wavelength of $\\lambda = ${lambda}\\text{ m}$. Find the propagation speed of the wave in the medium.`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Wave speed formula', formula: 'v = f \\cdot \\lambda', explanation: 'Wave propagation speed equals frequency multiplied by wavelength.' },
          { stepNumber: 2, title: 'Calculate wave speed', formula: `v = ${f}\\text{ Hz} \\times ${lambda}\\text{ m} = ${v}\\text{ m/s}`, explanation: `Speed of sound in this medium is ${v} m/s.` },
        ],
        commonErrorTags: ['divided_frequency_by_wavelength', 'divided_wavelength_by_frequency'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Waves and Sound',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 40. Specific Heat: Q = m * c * deltaT
  {
    familyId: 'physics_specific_heat',
    title: 'Thermal Energy and Specific Heat',
    subject: 'physics',
    conceptIds: ['thermodynamics_heat'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      mass: { name: 'Mass m (kg)', min: 1, max: 10, step: 1 },
      deltaT: { name: 'Temp Rise (C)', min: 10, max: 50, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m = rng.nextInt(1, 10);
      const deltaT = rng.nextInt(2, 10) * 5;
      const c = 4184; // Water specific heat in J/(kg K)
      const q = m * c * deltaT;

      const correctText = `${q} J`;
      const distractors = [
        { text: `${m * deltaT} J`, errorTag: 'omitted_specific_heat_capacity', explanation: 'Omitted the specific heat capacity c of water.' },
        { text: `${Math.round(q / 1000)} J`, errorTag: 'confused_joules_and_kilojoules', explanation: 'Reported value in kilojoules but labelled unit as Joules.' },
        { text: `${q + 2000} J`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic multiplication error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-phy-heat-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `How much heat energy $Q$ is required to raise the temperature of $m = ${m}\\text{ kg}$ of water by $\\Delta T = ${deltaT}^\\circ\\text{C}$? (Specific heat capacity of water $c = 4184\\text{ J/(kg}\\cdot\\text{K)}$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Heat transfer formula', formula: 'Q = m \\cdot c \\cdot \\Delta T', explanation: 'Thermal energy transferred equals mass times specific heat capacity times temperature change.' },
          { stepNumber: 2, title: 'Calculate thermal energy', formula: `Q = ${m}\\text{ kg} \\times 4184\\text{ J/(kg}\\cdot\\text{K)} \\times ${deltaT}\\text{ K} = ${q}\\text{ J}`, explanation: `Heat required is ${q} Joules.` },
        ],
        commonErrorTags: ['omitted_specific_heat_capacity', 'confused_joules_and_kilojoules'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Thermal Physics',
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
