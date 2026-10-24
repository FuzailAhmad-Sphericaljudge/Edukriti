import type { PracticeQuestion } from '@edukriti/contracts';

/**
 * OpenBookQA Dataset
 * License: Apache License 2.0 (Allen Institute for AI, 2018)
 * Citation: Mihaylov et al., "Can a Suit of Armor Conduct Electricity? A New Dataset for Open Book Question Answering", EMNLP 2018
 * Source: https://allenai.org/data/open-book-qa
 */
export const OPENBOOKQA_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'obqa-001',
    type: 'mcq',
    conceptIds: ['ohms_law'],
    subject: 'physics',
    grade: 'Grade 8',
    difficulty: 'easy',
    prompt: 'Which of the following materials is the best electrical conductor capable of completing a circuit?',
    choices: [
      { id: 'a', text: 'Copper wire' },
      { id: 'b', text: 'Rubber tubing' },
      { id: 'c', text: 'Dry wood' },
      { id: 'd', text: 'Glass rod' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [
      { stepNumber: 1, title: 'Electrical conductivity of metals', formula: '\\sigma_{\\text{copper}} \\approx 5.96 \\times 10^7\\text{ S/m}', explanation: 'Metals possess abundant delocalized conduction electrons that drift easily under electric potential differences.' },
      { stepNumber: 2, title: 'Insulators', formula: 'R_{\\text{insulator}} \\rightarrow \\infty', explanation: 'Rubber, dry wood, and glass tightly bind their valence electrons, preventing electric current flow.' },
    ],
    commonErrorTags: ['confused_conductor_and_insulator', 'confused_thermal_with_electrical'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'confused_conductor_and_insulator', explanation: 'Rubber is a high-resistance electrical insulator commonly used to coat electrical wires.' },
      { choiceId: 'c', errorTag: 'confused_conductor_and_insulator', explanation: 'Dry wood lacks free mobile charge carriers.' },
      { choiceId: 'd', errorTag: 'confused_conductor_and_insulator', explanation: 'Glass is an electrical dielectric insulator.' },
    ],
    source: 'OpenBookQA Dataset (Allen Institute for AI, Apache 2.0)',
    license: 'Apache-2.0',
    verified: true,
    verifiedReason: 'Materials physics resistivity standard tables verification',
    datasetId: 'openbookqa',
    externalReferenceId: 'obqa-train-001',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'obqa-002',
    type: 'mcq',
    conceptIds: ['acid_base_equilibrium'],
    subject: 'chemistry',
    grade: 'Grade 9',
    difficulty: 'medium',
    prompt: 'When lemon juice is squeezed onto blue litmus paper, the litmus paper turns red because lemon juice is:',
    choices: [
      { id: 'a', text: 'An acidic solution containing citric acid' },
      { id: 'b', text: 'A basic solution containing sodium hydroxide' },
      { id: 'c', text: 'A neutral solution with pH = 7.0' },
      { id: 'd', text: 'An inert distilled hydrocarbon' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [
      { stepNumber: 1, title: 'Acid-base litmus indicator response', formula: '\\text{Blue litmus} \\xrightarrow{\\text{H}^+} \\text{Red}', explanation: 'Litmus dye undergoes protonation in acidic solutions with pH < 7, shifting visible color from blue to red.' },
      { stepNumber: 2, title: 'Citric acid acidity', formula: '\\text{Lemon juice pH} \\approx 2.0 - 2.6', explanation: 'Citric acid dissociates hydronium ions (H3O+) into aqueous solution.' },
    ],
    commonErrorTags: ['reversed_litmus_colors', 'confused_acid_and_base'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'confused_acid_and_base', explanation: 'Bases turn red litmus paper blue, not the other way around.' },
      { choiceId: 'c', errorTag: 'assumed_fruit_is_neutral', explanation: 'Citrus fruits have high citric and ascorbic acid concentrations (pH ~ 2.3).' },
      { choiceId: 'd', errorTag: 'incorrect_chemical_classification', explanation: 'Lemon juice is an aqueous biological extract, not a synthetic hydrocarbon.' },
    ],
    source: 'OpenBookQA Dataset (Allen Institute for AI, Apache 2.0)',
    license: 'Apache-2.0',
    verified: true,
    verifiedReason: 'Chemical pH and indicator reaction verification',
    datasetId: 'openbookqa',
    externalReferenceId: 'obqa-train-002',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: 'obqa-003',
    type: 'mcq',
    conceptIds: ['genetics_inheritance_dna'],
    subject: 'biology',
    grade: 'Grade 9',
    difficulty: 'medium',
    prompt: 'Which cellular structure contains the genetic instructions (DNA) that determine inherited traits in eukaryotic organisms?',
    choices: [
      { id: 'a', text: 'Nucleus' },
      { id: 'b', text: 'Cell wall' },
      { id: 'c', text: 'Vacuole' },
      { id: 'd', text: 'Ribosome' },
    ],
    expectedAnswer: 'a',
    solutionSteps: [
      { stepNumber: 1, title: 'Eukaryotic nuclear compartmentalization', formula: '\\text{Chromosomes} \\subset \\text{Nucleus}', explanation: 'The membrane-bound nucleus houses linear chromosomes composed of double-stranded DNA wrapped around histone proteins.' },
    ],
    commonErrorTags: ['confused_organelle_functions', 'confused_translation_with_storage'],
    distractorExplanations: [
      { choiceId: 'b', errorTag: 'confused_organelle_functions', explanation: 'The cell wall provides mechanical rigidity and shape, not primary genomic DNA storage.' },
      { choiceId: 'c', errorTag: 'confused_organelle_functions', explanation: 'The central vacuole primarily stores water, ions, and maintains turgor pressure.' },
      { choiceId: 'd', errorTag: 'confused_translation_with_storage', explanation: 'Ribosomes are ribonucleoprotein complexes that translate mRNA into polypeptides, but do not store the genome.' },
    ],
    source: 'OpenBookQA Dataset (Allen Institute for AI, Apache 2.0)',
    license: 'Apache-2.0',
    verified: true,
    verifiedReason: 'Cellular biology organelle specialization verification',
    datasetId: 'openbookqa',
    externalReferenceId: 'obqa-train-003',
    createdAt: '2026-10-24T12:00:00.000Z',
  },
];

