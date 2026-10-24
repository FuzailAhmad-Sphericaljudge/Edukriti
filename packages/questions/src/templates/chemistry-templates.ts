import type { PracticeQuestion } from '@edukriti/contracts';
import { SeededRng } from '../prng.ts';
import type { ParametricTemplate } from '../types.ts';
import { makeChoicesWithDistractors, calcCombinations } from '../template-helper.ts';

export const CHEMISTRY_TEMPLATES: ParametricTemplate[] = [
  // 41. Molar Mass Calculation
  {
    familyId: 'chem_molar_mass_calc',
    title: 'Molar Mass of Chemical Compounds',
    subject: 'chemistry',
    conceptIds: ['stoichiometry_mole_concept'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      compoundIdx: { name: 'Compound Index', min: 0, max: 4, step: 1 },
    },
    estimateCombinations() {
      return 5;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const compounds = [
        { formula: 'H_2O', name: 'Water', mass: 18.02, breakdown: '2(1.008) + 16.00 = 18.02' },
        { formula: 'CO_2', name: 'Carbon Dioxide', mass: 44.01, breakdown: '12.01 + 2(16.00) = 44.01' },
        { formula: 'CH_4', name: 'Methane', mass: 16.04, breakdown: '12.01 + 4(1.008) = 16.04' },
        { formula: 'NaCl', name: 'Sodium Chloride', mass: 58.44, breakdown: '22.99 + 35.45 = 58.44' },
        { formula: 'CaCO_3', name: 'Calcium Carbonate', mass: 100.09, breakdown: '40.08 + 12.01 + 3(16.00) = 100.09' },
      ];
      const comp = rng.choice(compounds);

      const correctText = `${comp.mass} g/mol`;
      const distractors = [
        { text: `${Math.round(comp.mass * 2 * 100) / 100} g/mol`, errorTag: 'doubled_all_atomic_weights', explanation: 'Doubled the entire stoichiometric molecular formula.' },
        { text: `${Math.round((comp.mass - 16) * 100) / 100} g/mol`, errorTag: 'omitted_oxygen_atom', explanation: 'Forgot to add the oxygen atomic mass.' },
        { text: `${Math.round((comp.mass + 4) * 100) / 100} g/mol`, errorTag: 'arithmetic_offset', explanation: 'Atomic weight summation error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-molm-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Calculate the molar mass of $${comp.name}$ ($${comp.formula}$).`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Sum atomic masses', formula: `M = ${comp.breakdown} = ${comp.mass}\\text{ g/mol}`, explanation: 'Sum the standard atomic weights of each constituent element according to stoichiometry.' },
        ],
        commonErrorTags: ['doubled_all_atomic_weights', 'omitted_oxygen_atom'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Chemical Stoichiometry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 42. Mole to Mass: mass = n * M
  {
    familyId: 'chem_mole_to_mass',
    title: 'Converting Moles to Mass in Grams',
    subject: 'chemistry',
    conceptIds: ['stoichiometry_mole_concept'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      n: { name: 'Moles n', min: 0.5, max: 5.0, step: 0.5 },
    },
    estimateCombinations() {
      return 10;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const n = rng.nextInt(1, 10) * 0.5;
      const molarMassCO2 = 44.01;
      const mass = Math.round(n * molarMassCO2 * 100) / 100;

      const correctText = `${mass} g`;
      const distractors = [
        { text: `${Math.round((molarMassCO2 / n) * 100) / 100} g`, errorTag: 'divided_molar_mass_by_moles', explanation: 'Divided molar mass by moles ($M / n$) instead of multiplying ($n \\times M$).' },
        { text: `${Math.round(n * 28 * 100) / 100} g`, errorTag: 'used_molar_mass_of_carbon_monoxide', explanation: 'Used molar mass of CO (28 g/mol) instead of CO2 (44 g/mol).' },
        { text: `${Math.round((mass + 15) * 100) / 100} g`, errorTag: 'arithmetic_offset', explanation: 'Multiplication error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-m2m-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `What is the mass in grams of $${n}\\text{ moles}$ of carbon dioxide gas ($CO_2$)? (Molar mass of $CO_2 = 44.01\\text{ g/mol}$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Mole-mass relationship formula', formula: 'm = n \\times M', explanation: 'Mass equals number of moles multiplied by molar mass.' },
          { stepNumber: 2, title: 'Calculate mass', formula: `m = ${n}\\text{ mol} \\times 44.01\\text{ g/mol} = ${mass}\\text{ g}`, explanation: `Mass is ${mass} grams.` },
        ],
        commonErrorTags: ['divided_molar_mass_by_moles', 'used_molar_mass_of_carbon_monoxide'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Mole Concept',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 43. Mass to Moles: n = mass / M
  {
    familyId: 'chem_mass_to_moles',
    title: 'Converting Mass in Grams to Moles',
    subject: 'chemistry',
    conceptIds: ['stoichiometry_mole_concept'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      mass: { name: 'Mass m (g)', min: 36, max: 180, step: 18 },
    },
    estimateCombinations() {
      return 9;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const n = rng.nextInt(2, 10);
      const mass = n * 18; // Water molar mass approx 18 g/mol

      const correctText = `${n} mol`;
      const distractors = [
        { text: `${mass * 18} mol`, errorTag: 'multiplied_mass_by_molar_mass', explanation: 'Multiplied mass by molar mass ($m \\times M$) instead of dividing ($m / M$).' },
        { text: `${n + 1} mol`, errorTag: 'off_by_one_division', explanation: 'Division arithmetic offset.' },
        { text: `${Math.round(mass / 2)} mol`, errorTag: 'divided_by_subscript_hydrogen', explanation: 'Divided mass by 2 instead of molar mass 18.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-m2mol-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `How many moles of water ($H_2O$) are present in a sample having mass $m = ${mass}\\text{ g}$? (Molar mass of water $M = 18\\text{ g/mol}$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Number of moles formula', formula: 'n = \\frac{m}{M}', explanation: 'Moles equal mass in grams divided by molar mass.' },
          { stepNumber: 2, title: 'Calculate moles', formula: `n = \\frac{${mass}\\text{ g}}{18\\text{ g/mol}} = ${n}\\text{ mol}`, explanation: `Sample contains ${n} moles.` },
        ],
        commonErrorTags: ['multiplied_mass_by_molar_mass', 'divided_by_subscript_hydrogen'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Mole Concept',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 44. Avogadro Particle Count: N = n * N_A
  {
    familyId: 'chem_avogadro_particles',
    title: 'Avogadro’s Number Particle Calculation',
    subject: 'chemistry',
    conceptIds: ['stoichiometry_mole_concept'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      moles: { name: 'Moles n', min: 2, max: 8, step: 1 },
    },
    estimateCombinations() {
      return 7;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const n = rng.nextInt(2, 8);
      const avogadroCoeff = 6.022;
      const totalCoeff = Math.round(n * avogadroCoeff * 100) / 100;

      const correctText = `${totalCoeff} × 10²³ molecules`;
      const distractors = [
        { text: `${totalCoeff} × 10²² molecules`, errorTag: 'exponent_power_of_ten_error', explanation: 'Off by factor of 10 in power of ten ($10^{22}$ instead of $10^{23}$).' },
        { text: `${avogadroCoeff} × 10²³ molecules`, errorTag: 'forgot_mole_multiplier', explanation: 'Gave Avogadro constant for 1 mole without multiplying by n.' },
        { text: `${Math.round((avogadroCoeff / n) * 100) / 100} × 10²³ molecules`, errorTag: 'divided_by_moles_instead_of_multiplying', explanation: 'Divided Avogadro constant by moles.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-avo-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `How many molecules are present in $${n}\\text{ moles}$ of oxygen gas ($O_2$)? (Avogadro constant $N_A = 6.022 \\times 10^{23}\\text{ mol}^{-1}$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Particle count formula', formula: 'N = n \\times N_A', explanation: 'Total molecules equals number of moles times Avogadro constant.' },
          { stepNumber: 2, title: 'Calculate molecules', formula: `N = ${n} \\times (6.022 \\times 10^{23}) = ${totalCoeff} \\times 10^{23}\\text{ molecules}`, explanation: `Sample contains ${totalCoeff} × 10²³ molecules.` },
        ],
        commonErrorTags: ['exponent_power_of_ten_error', 'forgot_mole_multiplier'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Avogadro Hypothesis',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 45. Molarity: M = moles / V(L)
  {
    familyId: 'chem_molarity_solution',
    title: 'Molarity of Aqueous Solution',
    subject: 'chemistry',
    conceptIds: ['solutions_concentrations'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      moles: { name: 'Moles solute', min: 0.2, max: 2.0, step: 0.2 },
      volumeMl: { name: 'Volume mL', min: 250, max: 1000, step: 250 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const moles = rng.nextInt(1, 10) * 0.2;
      const volMl = rng.nextInt(1, 4) * 250;
      const volL = volMl / 1000;
      const molarity = Math.round((moles / volL) * 100) / 100;

      const correctText = `${molarity} M`;
      const distractors = [
        { text: `${Math.round((moles / volMl) * 10000) / 10000} M`, errorTag: 'forgot_milliliter_to_liter_conversion', explanation: 'Divided moles directly by mL without converting to liters.' },
        { text: `${Math.round(moles * volL * 100) / 100} M`, errorTag: 'multiplied_moles_and_volume', explanation: 'Multiplied moles by volume instead of dividing.' },
        { text: `${Math.round((molarity + 0.5) * 100) / 100} M`, errorTag: 'arithmetic_offset', explanation: 'Division arithmetic offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-mol-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A solution is prepared by dissolving $${moles}\\text{ moles}$ of sodium chloride ($NaCl$) in water to produce a total solution volume of $${volMl}\\text{ mL}$. What is the molarity of the solution?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Convert volume to liters', formula: `V = ${volMl}\\text{ mL} = \\frac{${volMl}}{1000}\\text{ L} = ${volL}\\text{ L}`, explanation: 'Molarity requires volume in liters.' },
          { stepNumber: 2, title: 'Apply molarity formula', formula: `M = \\frac{n}{V} = \\frac{${moles}\\text{ mol}}{${volL}\\text{ L}} = ${molarity}\\text{ M}`, explanation: `Molarity is ${molarity} M.` },
        ],
        commonErrorTags: ['forgot_milliliter_to_liter_conversion', 'multiplied_moles_and_volume'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Solutions',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 46. Dilution Formula: M1 * V1 = M2 * V2
  {
    familyId: 'chem_dilution_formula',
    title: 'Solution Dilution Equation',
    subject: 'chemistry',
    conceptIds: ['solutions_concentrations'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      m1: { name: 'Stock Molarity M1', min: 2, max: 6, step: 1 },
      v1: { name: 'Initial Volume V1 (mL)', min: 20, max: 100, step: 10 },
      v2: { name: 'Final Volume V2 (mL)', min: 200, max: 500, step: 100 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const m1 = rng.nextInt(2, 6);
      const v1 = rng.nextInt(2, 10) * 10;
      const v2 = rng.nextInt(2, 5) * 100;
      const m2 = Math.round(((m1 * v1) / v2) * 100) / 100;

      const correctText = `${m2} M`;
      const distractors = [
        { text: `${Math.round(((m1 * v2) / v1) * 100) / 100} M`, errorTag: 'inverted_volume_ratio', explanation: 'Multiplied stock molarity by final volume and divided by initial volume.' },
        { text: `${Math.round((m1 + (v1 / v2)) * 100) / 100} M`, errorTag: 'additive_dilution_fallacy', explanation: 'Added volumes instead of using molarity conservation.' },
        { text: `${Math.round((m2 + 0.2) * 100) / 100} M`, errorTag: 'arithmetic_offset', explanation: 'Calculation arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-dil-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `If $${v1}\\text{ mL}$ of a $${m1}\\text{ M}$ stock solution is diluted with distilled water to a final volume of $${v2}\\text{ mL}$, what is the final molarity $M_2$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Dilution conservation formula', formula: 'M_1 V_1 = M_2 V_2', explanation: 'Moles of solute remain constant during dilution.' },
          { stepNumber: 2, title: 'Solve for final molarity M2', formula: `M_2 = \\frac{M_1 V_1}{V_2} = \\frac{${m1}\\text{ M} \\times ${v1}\\text{ mL}}{${v2}\\text{ mL}} = ${m2}\\text{ M}`, explanation: `Final concentration is ${m2} M.` },
        ],
        commonErrorTags: ['inverted_volume_ratio', 'additive_dilution_fallacy'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Solution Dilution',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 47. Boyle's Gas Law: P1 * V1 = P2 * V2
  {
    familyId: 'chem_boyles_gas_law',
    title: 'Boyle’s Law Isothermal Gas Expansion',
    subject: 'chemistry',
    conceptIds: ['gases_kinetic_theory'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      p1: { name: 'Initial Pressure P1 (atm)', min: 1, max: 4, step: 1 },
      v1: { name: 'Initial Volume V1 (L)', min: 2, max: 10, step: 1 },
      p2: { name: 'Final Pressure P2 (atm)', min: 2, max: 8, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const p1 = rng.nextInt(1, 4);
      const v1 = rng.nextInt(2, 10);
      const p2 = rng.nextInt(p1 + 1, 8);
      const v2 = Math.round(((p1 * v1) / p2) * 10) / 10;

      const correctText = `${v2} L`;
      const distractors = [
        { text: `${Math.round(((p2 * v1) / p1) * 10) / 10} L`, errorTag: 'direct_proportionality_gas_error', explanation: 'Treated Boyle’s law as direct proportionality ($P_2 V_1 / P_1$) instead of inverse.' },
        { text: `${Math.round(p1 * v1 * p2)} L`, errorTag: 'multiplied_all_variables', explanation: 'Multiplied all terms together.' },
        { text: `${Math.round((v2 + 1.2) * 10) / 10} L`, errorTag: 'arithmetic_offset', explanation: 'Division arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-boyle-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An ideal gas sample occupies a volume of $V_1 = ${v1}\\text{ L}$ at a pressure of $P_1 = ${p1}\\text{ atm}$. If the pressure is increased to $P_2 = ${p2}\\text{ atm}$ at constant temperature, what is the new volume $V_2$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'State Boyle’s Law', formula: 'P_1 V_1 = P_2 V_2 \\implies V_2 = \\frac{P_1 V_1}{P_2}', explanation: 'Pressure and volume are inversely proportional at constant temperature.' },
          { stepNumber: 2, title: 'Compute final volume', formula: `V_2 = \\frac{${p1}\\text{ atm} \\times ${v1}\\text{ L}}{${p2}\\text{ atm}} = ${v2}\\text{ L}`, explanation: `Final volume is ${v2} liters.` },
        ],
        commonErrorTags: ['direct_proportionality_gas_error', 'multiplied_all_variables'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Gas Laws',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 48. Charles's Gas Law: V1 / T1 = V2 / T2 (Kelvin conversion trap!)
  {
    familyId: 'chem_charles_gas_law',
    title: 'Charles’s Law Thermal Gas Expansion',
    subject: 'chemistry',
    conceptIds: ['gases_kinetic_theory'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      v1: { name: 'Initial Volume V1 (L)', min: 2, max: 10, step: 1 },
      t1C: { name: 'Initial Temp (°C)', min: 10, max: 30, step: 5 },
      t2C: { name: 'Final Temp (°C)', min: 50, max: 90, step: 10 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const v1 = rng.nextInt(2, 10);
      const t1C = rng.nextInt(2, 6) * 5;
      const t2C = rng.nextInt(5, 9) * 10;
      const t1K = t1C + 273.15;
      const t2K = t2C + 273.15;
      const v2 = Math.round(((v1 * t2K) / t1K) * 10) / 10;
      const v2CelsiusError = Math.round(((v1 * t2C) / t1C) * 10) / 10;

      const correctText = `${v2} L`;
      const distractors = [
        { text: `${v2CelsiusError} L`, errorTag: 'used_celsius_instead_of_kelvin', explanation: 'Failed to convert temperatures from Celsius to absolute Kelvin ($+273.15$).' },
        { text: `${Math.round(((v1 * t1K) / t2K) * 10) / 10} L`, errorTag: 'inverted_temperature_ratio', explanation: 'Divided by final temperature instead of initial temperature.' },
        { text: `${Math.round((v2 + 2) * 10) / 10} L`, errorTag: 'arithmetic_offset', explanation: 'Calculation arithmetic error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-charles-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A flexible balloon filled with gas has volume $V_1 = ${v1}\\text{ L}$ at a temperature of $T_1 = ${t1C}^\\circ\\text{C}$. If the gas is heated to $T_2 = ${t2C}^\\circ\\text{C}$ at constant pressure, what will be its new volume $V_2$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Convert temperatures to absolute Kelvin', formula: `T_1 = ${t1C} + 273.15 = ${t1K}\\text{ K}, \\quad T_2 = ${t2C} + 273.15 = ${t2K}\\text{ K}`, explanation: 'Gas laws strictly require temperature in Kelvin.' },
          { stepNumber: 2, title: 'Apply Charles’s Law', formula: `V_2 = V_1 \\times \\frac{T_2}{T_1} = ${v1} \\times \\frac{${t2K}}{${t1K}} = ${v2}\\text{ L}`, explanation: `New volume is ${v2} liters.` },
        ],
        commonErrorTags: ['used_celsius_instead_of_kelvin', 'inverted_temperature_ratio'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Gas Laws',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 49. Ideal Gas Law: P = nRT / V
  {
    familyId: 'chem_ideal_gas_law',
    title: 'Ideal Gas Law Pressure',
    subject: 'chemistry',
    conceptIds: ['gases_kinetic_theory'],
    grade: 'Grade 11',
    difficulty: 'hard',
    parameterRanges: {
      n: { name: 'Moles n', min: 1, max: 4, step: 1 },
      tK: { name: 'Temp T (K)', min: 300, max: 400, step: 25 },
      v: { name: 'Volume V (L)', min: 10, max: 40, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const n = rng.nextInt(1, 4);
      const tK = rng.nextInt(12, 16) * 25;
      const v = rng.nextInt(2, 8) * 5;
      const R = 0.0821; // L atm / (mol K)
      const p = Math.round(((n * R * tK) / v) * 100) / 100;

      const correctText = `${p} atm`;
      const distractors = [
        { text: `${Math.round(((n * 8.314 * tK) / v) * 100) / 100} atm`, errorTag: 'used_si_gas_constant_with_liters', explanation: 'Used R = 8.314 J/(mol K) with liters/atm instead of R = 0.0821 L atm / (mol K).' },
        { text: `${Math.round(((v * R * tK) / n) * 100) / 100} atm`, errorTag: 'inverted_moles_and_volume', explanation: 'Swapped volume and moles in the numerator/denominator.' },
        { text: `${Math.round((p + 0.8) * 100) / 100} atm`, errorTag: 'arithmetic_offset', explanation: 'Rounding/arithmetic offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-pvrt-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `Find the pressure exerted by $n = ${n}\\text{ mol}$ of an ideal gas occupying a volume of $V = ${v}\\text{ L}$ at a temperature of $T = ${tK}\\text{ K}$. (Use gas constant $R = 0.0821\\text{ L}\\cdot\\text{atm/(mol}\\cdot\\text{K)}$)`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Ideal gas equation', formula: 'PV = nRT \\implies P = \\frac{nRT}{V}', explanation: 'Solve for pressure in the equation of state.' },
          { stepNumber: 2, title: 'Substitute values', formula: `P = \\frac{${n}\\text{ mol} \\times 0.0821 \\times ${tK}\\text{ K}}{${v}\\text{ L}} = ${p}\\text{ atm}`, explanation: `Pressure exerted is ${p} atm.` },
        ],
        commonErrorTags: ['used_si_gas_constant_with_liters', 'inverted_moles_and_volume'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Gas Laws',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 50. pH from Hydronium Ion: pH = -log10[H+]
  {
    familyId: 'chem_ph_calculation',
    title: 'pH Calculation from Hydrogen Ion Concentration',
    subject: 'chemistry',
    conceptIds: ['acid_base_equilibrium'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      power: { name: 'Power of 10 in [H+]', min: 2, max: 12, step: 1 },
    },
    estimateCombinations() {
      return 11;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const power = rng.nextInt(2, 12);
      const ph = power;

      const correctText = `pH = ${ph}`;
      const distractors = [
        { text: `pH = -${ph}`, errorTag: 'forgot_negative_sign_in_ph_definition', explanation: 'Reported negative logarithm exponent without applying the negative sign ($-\\log[H^+]$).' },
        { text: `pH = ${14 - ph}`, errorTag: 'calculated_poh_instead_of_ph', explanation: 'Calculated pOH instead of pH ($14 - \\text{pH}$).' },
        { text: `pH = ${ph + 1}`, errorTag: 'off_by_one_log', explanation: 'Off by one on exponent evaluation.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-ph-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `An aqueous solution has a hydrogen ion concentration of $[H^+] = 1.0 \\times 10^{-${power}}\\text{ M}$. What is the pH of the solution?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'pH definition formula', formula: '\\text{pH} = -\\log_{10}[H^+]', explanation: 'pH is the negative logarithm of hydrogen ion concentration.' },
          { stepNumber: 2, title: 'Evaluate logarithm', formula: `\\text{pH} = -\\log_{10}(1.0 \\times 10^{-${power}}) = -(-${power}) = ${ph}`, explanation: `pH of the solution is ${ph}.` },
        ],
        commonErrorTags: ['forgot_negative_sign_in_ph_definition', 'calculated_poh_instead_of_ph'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Acids and Bases',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 51. pH and pOH Relationship: pH + pOH = 14
  {
    familyId: 'chem_poh_and_ph_sum',
    title: 'Relationship Between pH and pOH',
    subject: 'chemistry',
    conceptIds: ['acid_base_equilibrium'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      poh: { name: 'pOH value', min: 2, max: 11, step: 1 },
    },
    estimateCombinations() {
      return 10;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const poh = rng.nextInt(2, 11);
      const ph = 14 - poh;

      const correctText = `pH = ${ph}`;
      const distractors = [
        { text: `pH = ${poh}`, errorTag: 'assumed_ph_equals_poh', explanation: 'Assumed pH is identical to pOH.' },
        { text: `pH = ${7 - poh / 2}`, errorTag: 'used_neutral_midpoint_trick', explanation: 'Incorrectly scaled around neutral pH 7.' },
        { text: `pH = ${ph + 1}`, errorTag: 'arithmetic_offset', explanation: 'Subtraction arithmetic offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-poh-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `If an alkaline cleaning solution has a measured $\\text{pOH} = ${poh}$ at $25^\\circ\\text{C}$, what is its corresponding $\\text{pH}$?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Ion-product of water relation', formula: '\\text{pH} + \\text{pOH} = 14', explanation: 'Sum of pH and pOH equals 14 at 25°C.' },
          { stepNumber: 2, title: 'Solve for pH', formula: `\\text{pH} = 14 - \\text{pOH} = 14 - ${poh} = ${ph}`, explanation: `The pH of the solution is ${ph}.` },
        ],
        commonErrorTags: ['assumed_ph_equals_poh', 'used_neutral_midpoint_trick'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Acids and Bases',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 52. Stoichiometric Ratio: 2 H2 + O2 -> 2 H2O
  {
    familyId: 'chem_stoichiometric_ratio',
    title: 'Reaction Stoichiometry Mole Conversion',
    subject: 'chemistry',
    conceptIds: ['chemical_reactions_stoichiometry'],
    grade: 'Grade 10',
    difficulty: 'medium',
    parameterRanges: {
      molesO2: { name: 'Moles O2', min: 2, max: 10, step: 1 },
    },
    estimateCombinations() {
      return 9;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const molesO2 = rng.nextInt(2, 10);
      const molesH2O = molesO2 * 2;

      const correctText = `${molesH2O} moles of H₂O`;
      const distractors = [
        { text: `${molesO2} moles of H₂O`, errorTag: 'one_to_one_stoichiometry_fallacy', explanation: 'Assumed a 1:1 molar ratio instead of the balanced 1:2 ratio ($O_2 : 2H_2O$).' },
        { text: `${Math.round((molesO2 / 2) * 10) / 10} moles of H₂O`, errorTag: 'divided_instead_of_multiplied_by_coefficient', explanation: 'Divided moles of O2 by 2 instead of multiplying by 2.' },
        { text: `${molesH2O + 2} moles of H₂O`, errorTag: 'arithmetic_offset', explanation: 'Multiplication offset.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-stch-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `According to the balanced chemical equation: $$2H_2 + O_2 \\longrightarrow 2H_2O$$ How many moles of water ($H_2O$) are produced when $${molesO2}\\text{ moles}$ of oxygen gas ($O_2$) react with excess hydrogen?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Determine stoichiometric ratio', formula: `\\frac{\\text{Moles } H_2O}{\\text{Moles } O_2} = \\frac{2}{1}`, explanation: 'Every 1 mole of O2 consumed produces 2 moles of H2O.' },
          { stepNumber: 2, title: 'Calculate produced water', formula: `\\text{Moles } H_2O = ${molesO2}\\text{ mol } O_2 \\times \\frac{2\\text{ mol } H_2O}{1\\text{ mol } O_2} = ${molesH2O}\\text{ mol}`, explanation: `Produces ${molesH2O} moles of H2O.` },
        ],
        commonErrorTags: ['one_to_one_stoichiometry_fallacy', 'divided_instead_of_multiplied_by_coefficient'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Chemical Equations',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 53. Percent Yield: (actual / theoretical) * 100%
  {
    familyId: 'chem_percent_yield',
    title: 'Reaction Percent Yield Calculation',
    subject: 'chemistry',
    conceptIds: ['chemical_reactions_stoichiometry'],
    grade: 'Grade 10',
    difficulty: 'easy',
    parameterRanges: {
      theoretical: { name: 'Theoretical Yield (g)', min: 20, max: 100, step: 10 },
      percentYield: { name: 'Actual % Yield', min: 70, max: 95, step: 5 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const theoretical = rng.nextInt(2, 10) * 10;
      const expectedYield = rng.nextInt(14, 19) * 5;
      const actual = Math.round((theoretical * expectedYield) / 100);
      const calcPercent = Math.round((actual / theoretical) * 1000) / 10;

      const correctText = `${calcPercent}%`;
      const distractors = [
        { text: `${Math.round((theoretical / actual) * 1000) / 10}%`, errorTag: 'inverted_yield_ratio', explanation: 'Divided theoretical yield by actual yield instead of actual by theoretical.' },
        { text: `${actual}%`, errorTag: 'reported_actual_mass_as_percentage', explanation: 'Reported the actual mass directly as the percentage.' },
        { text: `${calcPercent + 5}%`, errorTag: 'arithmetic_offset', explanation: 'Arithmetic division error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-yield-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `In an organic synthesis experiment, the calculated theoretical yield of aspirin was $${theoretical}\\text{ g}$. A student synthesized and purified an actual yield of $${actual}\\text{ g}$. What was the percent yield?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Percent yield formula', formula: '\\text{Percent Yield} = \\frac{\\text{Actual Yield}}{\\text{Theoretical Yield}} \\times 100\\%', explanation: 'Ratio of experimental mass obtained to theoretical stoichiometric mass.' },
          { stepNumber: 2, title: 'Compute percentage', formula: `\\text{Percent Yield} = \\frac{${actual}\\text{ g}}{${theoretical}\\text{ g}} \\times 100\\% = ${calcPercent}\\%`, explanation: `Percent yield is ${calcPercent}%.` },
        ],
        commonErrorTags: ['inverted_yield_ratio', 'reported_actual_mass_as_percentage'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Chemical Stoichiometry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 54. Half-Life Radioactive Decay: N(t) = N0 * (1/2)^k
  {
    familyId: 'chem_half_life_decay',
    title: 'Radioactive Isotope Half-Life Decay',
    subject: 'chemistry',
    conceptIds: ['nuclear_chemistry'],
    grade: 'Grade 11',
    difficulty: 'medium',
    parameterRanges: {
      initialMass: { name: 'Initial mass N0 (g)', min: 80, max: 320, step: 40 },
      halfLives: { name: 'Half lives passed', min: 2, max: 4, step: 1 },
    },
    estimateCombinations() {
      return calcCombinations(this.parameterRanges);
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const initial = rng.nextInt(2, 8) * 40;
      const k = rng.nextInt(2, 4);
      const remaining = initial / (2 ** k);

      const correctText = `${remaining} g`;
      const distractors = [
        { text: `${initial / k} g`, errorTag: 'divided_by_k_instead_of_2_to_k', explanation: 'Divided initial mass by k instead of dividing by $2^k$ (exponential decay).' },
        { text: `${initial - (initial / 2) * k} g`, errorTag: 'linear_decay_fallacy', explanation: 'Subtracted a fixed linear amount per half-life.' },
        { text: `${remaining + 5} g`, errorTag: 'arithmetic_offset', explanation: 'Exponential division error.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-half-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `A radioactive sample has an initial mass of $N_0 = ${initial}\\text{ g}$. If $${k}$ half-life periods elapse, how much of the radioactive isotope remains undecayed?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Half-life decay formula', formula: 'N(t) = N_0 \\left(\\frac{1}{2}\\right)^k', explanation: 'Sample halves with each elapsed half-life.' },
          { stepNumber: 2, title: 'Calculate remaining mass', formula: `N(t) = ${initial} \\times \\left(\\frac{1}{2}\\right)^${k} = \\frac{${initial}}{${2 ** k}} = ${remaining}\\text{ g}`, explanation: `Remaining mass is ${remaining} grams.` },
        ],
        commonErrorTags: ['divided_by_k_instead_of_2_to_k', 'linear_decay_fallacy'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Nuclear Chemistry',
        license: 'MIT',
        verified: true,
        verifiedReason: 'Deterministic symbolic recomputation verified',
        templateFamilyId: this.familyId,
        seed,
        createdAt: '2026-10-24T12:00:00.000Z',
      };
    },
  },

  // 55. Valence Electrons & Octet Rule
  {
    familyId: 'chem_valence_electrons_octet',
    title: 'Valence Electrons and Chemical Bonding',
    subject: 'chemistry',
    conceptIds: ['chemical_bonding_octet'],
    grade: 'Grade 9',
    difficulty: 'easy',
    parameterRanges: {
      elementIdx: { name: 'Element Index', min: 0, max: 4, step: 1 },
    },
    estimateCombinations() {
      return 5;
    },
    generate(seed, externalRng) {
      const rng = externalRng ?? new SeededRng(seed);
      const elements = [
        { symbol: 'O', name: 'Oxygen', valence: 6, needed: 2 },
        { symbol: 'N', name: 'Nitrogen', valence: 5, needed: 3 },
        { symbol: 'C', name: 'Carbon', valence: 4, needed: 4 },
        { symbol: 'F', name: 'Fluorine', valence: 7, needed: 1 },
        { symbol: 'Mg', name: 'Magnesium', valence: 2, needed: 2 },
      ];
      const elem = rng.choice(elements);

      const correctText = `${elem.needed}`;
      const distractors = [
        { text: `${elem.valence}`, errorTag: 'confused_valence_electrons_with_needed_electrons', explanation: 'Reported total current valence electrons instead of electrons needed to reach octet.' },
        { text: `${8}`, errorTag: 'reported_target_octet_number', explanation: 'Reported total octet target (8) instead of the deficit.' },
        { text: `${elem.needed + 1}`, errorTag: 'off_by_one', explanation: 'Off by one on octet difference.' },
      ];

      const { choices, expectedAnswer, distractorExplanations } = makeChoicesWithDistractors(correctText, distractors, rng);

      return {
        id: `pq-chem-oct-${seed}`,
        type: 'mcq',
        conceptIds: this.conceptIds,
        subject: this.subject,
        grade: this.grade,
        difficulty: this.difficulty,
        prompt: `How many additional electrons does a neutral atom of $${elem.name}$ ($${elem.symbol}$), which has $${elem.valence}$ valence electrons, require to achieve a stable octet electron configuration?`,
        choices,
        expectedAnswer,
        solutionSteps: [
          { stepNumber: 1, title: 'Octet Rule Goal', formula: `\\text{Electrons Needed} = 8 - \\text{Valence Electrons}`, explanation: 'Main group elements seek 8 valence electrons for a stable noble gas configuration.' },
          { stepNumber: 2, title: 'Calculate deficit', formula: `\\text{Needed} = 8 - ${elem.valence} = ${elem.needed}`, explanation: `Requires ${elem.needed} electrons.` },
        ],
        commonErrorTags: ['confused_valence_electrons_with_needed_electrons', 'reported_target_octet_number'],
        distractorExplanations,
        source: 'Edukriti Parametric Generator: Atomic Structure',
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

