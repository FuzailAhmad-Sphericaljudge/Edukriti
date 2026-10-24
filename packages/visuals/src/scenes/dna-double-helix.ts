import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const dnaDoubleHelixParamsSchema = z.object({
  numberOfTurns: z.number().min(1).max(4).default(2),
  unwindSeparation: z.number().min(0).max(2).default(0),
  showHydrogenBonds: z.boolean().default(true),
  showBasePairColors: z.boolean().default(true),
  rotationSpeed: z.number().min(0).max(3).default(1),
});

export type DnaDoubleHelixParams = z.infer<typeof dnaDoubleHelixParamsSchema>;

type Nucleotide = 'A' | 'T' | 'G' | 'C';

const BASE_COLORS: Record<Nucleotide, string> = {
  A: '#22c55e', // green-500 (Adenine)
  T: '#ef4444', // red-500 (Thymine)
  G: '#eab308', // yellow-500 (Guanine)
  C: '#3b82f6', // blue-500 (Cytosine)
};

export function generateDnaGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = dnaDoubleHelixParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const helixRadius = 1.4;
  const risePerPair = 0.45; // ~3.4 Angstroms scaled
  const twistPerPair = (2 * Math.PI) / 10.5; // ~36° per base pair (10.5 pairs per complete 360° turn)
  const totalPairs = Math.round(params.numberOfTurns * 10.5);

  const baseSequence: Array<[Nucleotide, Nucleotide]> = [
    ['A', 'T'],
    ['G', 'C'],
    ['T', 'A'],
    ['C', 'G'],
    ['A', 'T'],
    ['G', 'C'],
    ['C', 'G'],
    ['T', 'A'],
    ['A', 'T'],
    ['G', 'C'],
  ];

  let majorGroovePt: Point3D = [0, 0, 0];
  let minorGroovePt: Point3D = [0, 0, 0];
  let hBondPt: Point3D = [0, 0, 0];

  for (let i = 0; i < totalPairs; i++) {
    const angle = i * twistPerPair;
    const y = (i - totalPairs / 2) * risePerPair;

    // Unwinding separation in the middle (replication fork demo)
    const isMidSegment = Math.abs(i - totalPairs / 2) < 4;
    const unwind = isMidSegment ? params.unwindSeparation * 1.2 : 0;

    // Strand 1 (5' -> 3')
    const x1 = (helixRadius + unwind) * Math.cos(angle);
    const z1 = (helixRadius + unwind) * Math.sin(angle);
    const p1: Point3D = [x1, y, z1];

    // Strand 2 (antiparallel 3' -> 5', phase shifted by ~140° for realistic major/minor grooves)
    const angle2 = angle + (140 * Math.PI) / 180;
    const x2 = (helixRadius + unwind) * Math.cos(angle2);
    const z2 = (helixRadius + unwind) * Math.sin(angle2);
    const p2: Point3D = [x2, y, z2];

    // Sugar-phosphate backbone bead Strand 1
    elements.push({
      id: `backbone-1-${i}`,
      name: `5'->3' Sugar-Phosphate Strand (Residue ${i + 1})`,
      type: 'sphere',
      position: p1,
      radius: 0.22,
      color: '#38bdf8', // sky-400
      roughness: 0.3,
    });

    // Sugar-phosphate backbone bead Strand 2
    elements.push({
      id: `backbone-2-${i}`,
      name: `3'->5' Complementary Backbone (Residue ${i + 1})`,
      type: 'sphere',
      position: p2,
      radius: 0.22,
      color: '#818cf8', // indigo-400
      roughness: 0.3,
    });

    // Base pair nucleotides
    const pair = baseSequence[i % baseSequence.length] ?? ['A', 'T'];
    const b1 = pair[0];
    const b2 = pair[1];
    const hBondsCount = b1 === 'G' || b1 === 'C' ? 3 : 2;

    const midPt: Point3D = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
    if (i === Math.floor(totalPairs / 2)) {
      hBondPt = midPt;
    }

    if (i === 3) {
      minorGroovePt = [(p1[0] + p2[0]) / 2 + 0.8, y, (p1[1] + p2[1]) / 2];
    } else if (i === 8) {
      majorGroovePt = [(p1[0] + p2[0]) / 2 - 1.2, y, (p1[1] + p2[1]) / 2];
    }

    // Nucleotide 1 bar (from p1 toward center)
    const b1End: Point3D = [p1[0] * 0.25, y, p1[2] * 0.25];
    elements.push({
      id: `base-${b1}-${i}`,
      name: `${b1 === 'A' ? 'Adenine' : b1 === 'T' ? 'Thymine' : b1 === 'G' ? 'Guanine' : 'Cytosine'} Base`,
      type: 'cylinder',
      position: [(p1[0] + b1End[0]) / 2, y, (p1[2] + b1End[2]) / 2],
      rotation: [Math.PI / 2, -angle, 0],
      radius: 0.08,
      height: Math.sqrt((p1[0] - b1End[0]) ** 2 + (p1[2] - b1End[2]) ** 2),
      color: BASE_COLORS[b1],
      userData: { base: b1, pairWith: b2, hBonds: hBondsCount },
    });

    // Nucleotide 2 bar (from p2 toward center)
    const b2End: Point3D = [p2[0] * 0.25, y, p2[2] * 0.25];
    elements.push({
      id: `base-${b2}-${i}`,
      name: `${b2 === 'A' ? 'Adenine' : b2 === 'T' ? 'Thymine' : b2 === 'G' ? 'Guanine' : 'Cytosine'} Base`,
      type: 'cylinder',
      position: [(p2[0] + b2End[0]) / 2, y, (p2[2] + b2End[2]) / 2],
      rotation: [Math.PI / 2, -angle2, 0],
      radius: 0.08,
      height: Math.sqrt((p2[0] - b2End[0]) ** 2 + (p2[2] - b2End[2]) ** 2),
      color: BASE_COLORS[b2],
      userData: { base: b2, pairWith: b1, hBonds: hBondsCount },
    });

    // Hydrogen bond bridges in center
    if (params.showHydrogenBonds && unwind < 0.2) {
      elements.push({
        id: `h-bond-${i}`,
        name: `${hBondsCount} Hydrogen Bonds (${b1}···${b2})`,
        type: 'sphere',
        position: midPt,
        radius: 0.09,
        color: '#f8fafc',
        emissive: '#e2e8f0',
        userData: {
          bonds: hBondsCount,
          pairing: `${b1}-${b2}`,
        },
      });
    }
  }

  const totalHeight = totalPairs * risePerPair;

  return {
    elements,
    boundingRadius: helixRadius + 3.0,
    defaultCameraPosition: [0, 1.5, 6.5],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 'helix-diameter', name: 'DNA Helix Diameter (20 Å)', position: [helixRadius, 0, 0] },
      { id: 'h-bond-center', name: 'Base Pair Center', position: hBondPt },
      { id: 'major-groove', name: 'Major Groove (22 Å)', position: majorGroovePt },
    ],
    educationalSummary: {
      keyFormulas: [
        '\\text{Base Pairs per Turn: } 10.5 \\text{ bp}',
        '\\text{Pitch of Helix: } 34 \\text{ Å (3.4 nm)}',
        '\\text{Diameter: } 20 \\text{ Å (2.0 nm)}',
        '\\text{A = T (2 H-bonds)}, \\quad \\text{G } \\equiv \\text{ C (3 H-bonds)}',
      ],
      constants: {
        'Rise per Base Pair': '3.4 Å',
        'Helical Twist per Base Pair': '34.3°',
        'Major Groove Width': '22 Å',
        'Minor Groove Width': '12 Å',
      },
      insights: [
        'Antiparallel strands run in opposite 5′-to-3′ directions, allowing complementary hydrogen bonding between purines and pyrimidines.',
        'G-C pairs have 3 hydrogen bonds making them thermally more stable than A-T pairs with 2 hydrogen bonds.',
        'Major and minor grooves provide sequence-specific binding sites for transcription factors and polymerases.',
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'sugar_phosphate_backbone',
    title: 'Sugar-Phosphate Backbone',
    description: 'Alternating deoxyribose sugar and phosphate groups linked by phosphodiester bonds forming the outer hydrophilic structural scaffold.',
    position: [1.4, 0, 0],
    partCategory: 'backbone',
  },
  {
    id: 'complementary_base_pairs',
    title: 'Complementary Base Pairing',
    description: 'Purines (A, G) pair exclusively with pyrimidines (T, C). Adenine pairs with Thymine (2 H-bonds), Guanine pairs with Cytosine (3 H-bonds).',
    position: [0, 0, 0],
    partCategory: 'base_pair',
  },
  {
    id: 'major_groove',
    title: 'Major Groove (22 Å)',
    description: 'Wider spiral indentation where nitrogenous base edge atoms are accessible for sequence-specific recognition by regulatory proteins.',
    position: [-1.2, 1.5, 0],
    partCategory: 'groove',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 3, 7],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Watson-Crick DNA Double Helix. Two antiparallel strands wind into a right-handed spiral.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [2, 1, 3],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'complementary_base_pairs',
    caption: 'At the core, bases pair strictly: Adenine with Thymine via 2 hydrogen bonds, and Guanine with Cytosine via 3 hydrogen bonds.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [-2, 2, 4],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'major_groove',
    caption: 'The unequal spacing of backbones creates alternating major and minor grooves, essential for gene expression and protein binding.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-dna-1',
    question: 'Tap the hydrogen-bonded base pairs at the center of the helix.',
    targetPartId: 'complementary_base_pairs',
    hint: 'Look for the colored rungs inside the spiral.',
    successFeedback: 'Correct! The interior base pairs encode genetic information while hydrogen bonds stabilize the two strands.',
  },
  {
    id: 'quiz-dna-2',
    question: 'Tap the outer sugar-phosphate structural backbone.',
    targetPartId: 'sugar_phosphate_backbone',
    hint: 'Tap the outer blue or indigo spiral rail.',
    successFeedback: 'Spot on! Phosphodiester bonds form the repeating sugar-phosphate backbone.',
  },
];

export const dnaDoubleHelixScene: Scene3DDefinition = {
  id: 'dna_double_helix_3d',
  title: '3D Watson-Crick DNA Double Helix & Base Pairing',
  subject: 'biology',
  conceptIds: ['dna_structure', 'nucleic_acids', 'base_pairing', 'molecular_genetics'],
  description: 'Interactive 3D Watson-Crick double helix with complementary base pairs (A-T 2 H-bonds, G-C 3 H-bonds), major/minor grooves, and transcription unwinding mode.',
  paramKeys: Object.keys(dnaDoubleHelixParamsSchema.shape),
  paramsSchema: dnaDoubleHelixParamsSchema,
  defaultParams: dnaDoubleHelixParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateDnaGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = dnaDoubleHelixParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

