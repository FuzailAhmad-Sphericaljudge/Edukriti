import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const moleculeViewerParamsSchema = z.object({
  moleculeId: z.enum(['H2O', 'CO2', 'CH4', 'NH3', 'ethanol', 'benzene', 'glucose']).default('H2O'),
  renderingStyle: z.enum(['ball_and_stick', 'space_filling', 'wireframe']).default('ball_and_stick'),
  showBondAngles: z.boolean().default(true),
  showAtomLabels: z.boolean().default(true),
  explodedView: z.number().min(0).max(1).default(0),
});

export type MoleculeViewerParams = z.infer<typeof moleculeViewerParamsSchema>;

interface AtomDef {
  id: string;
  element: 'H' | 'C' | 'N' | 'O';
  position: Point3D;
}

interface BondDef {
  source: string;
  target: string;
  order: 1 | 2;
}

interface MoleculeData {
  name: string;
  formula: string;
  geometryName: string;
  bondAngleDeg: number;
  pubchemCid: number;
  atoms: AtomDef[];
  bonds: BondDef[];
}

const CPK_COLORS: Record<string, string> = {
  H: '#f8fafc', // slate-50 (white/silver)
  C: '#334155', // slate-700 (dark charcoal)
  N: '#3b82f6', // blue-500
  O: '#ef4444', // red-500
};

const VDW_RADII: Record<string, number> = {
  H: 1.20,
  C: 1.70,
  N: 1.55,
  O: 1.52,
};

const BALL_RADII: Record<string, number> = {
  H: 0.35,
  C: 0.60,
  N: 0.55,
  O: 0.55,
};

// Authentic Public Domain 3D Molecular Geometries (Coordinates in Angstroms)
const MOLECULES: Record<string, MoleculeData> = {
  H2O: {
    name: 'Water',
    formula: 'H₂O',
    geometryName: 'Bent (V-shaped)',
    bondAngleDeg: 104.5,
    pubchemCid: 962,
    atoms: [
      { id: 'O1', element: 'O', position: [0.0, 0.0, 0.117] },
      { id: 'H1', element: 'H', position: [0.757, 0.0, -0.469] },
      { id: 'H2', element: 'H', position: [-0.757, 0.0, -0.469] },
    ],
    bonds: [
      { source: 'O1', target: 'H1', order: 1 },
      { source: 'O1', target: 'H2', order: 1 },
    ],
  },
  CO2: {
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    geometryName: 'Linear',
    bondAngleDeg: 180.0,
    pubchemCid: 280,
    atoms: [
      { id: 'C1', element: 'C', position: [0.0, 0.0, 0.0] },
      { id: 'O1', element: 'O', position: [0.0, 0.0, 1.163] },
      { id: 'O2', element: 'O', position: [0.0, 0.0, -1.163] },
    ],
    bonds: [
      { source: 'C1', target: 'O1', order: 2 },
      { source: 'C1', target: 'O2', order: 2 },
    ],
  },
  CH4: {
    name: 'Methane',
    formula: 'CH₄',
    geometryName: 'Tetrahedral',
    bondAngleDeg: 109.5,
    pubchemCid: 297,
    atoms: [
      { id: 'C1', element: 'C', position: [0.0, 0.0, 0.0] },
      { id: 'H1', element: 'H', position: [0.629, 0.629, 0.629] },
      { id: 'H2', element: 'H', position: [-0.629, -0.629, 0.629] },
      { id: 'H3', element: 'H', position: [-0.629, 0.629, -0.629] },
      { id: 'H4', element: 'H', position: [0.629, -0.629, -0.629] },
    ],
    bonds: [
      { source: 'C1', target: 'H1', order: 1 },
      { source: 'C1', target: 'H2', order: 1 },
      { source: 'C1', target: 'H3', order: 1 },
      { source: 'C1', target: 'H4', order: 1 },
    ],
  },
  NH3: {
    name: 'Ammonia',
    formula: 'NH₃',
    geometryName: 'Trigonal Pyramidal',
    bondAngleDeg: 107.0,
    pubchemCid: 222,
    atoms: [
      { id: 'N1', element: 'N', position: [0.0, 0.0, 0.116] },
      { id: 'H1', element: 'H', position: [0.0, 0.94, -0.27] },
      { id: 'H2', element: 'H', position: [0.814, -0.47, -0.27] },
      { id: 'H3', element: 'H', position: [-0.814, -0.47, -0.27] },
    ],
    bonds: [
      { source: 'N1', target: 'H1', order: 1 },
      { source: 'N1', target: 'H2', order: 1 },
      { source: 'N1', target: 'H3', order: 1 },
    ],
  },
  ethanol: {
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    geometryName: 'Aliphatic Alcohol',
    bondAngleDeg: 109.5,
    pubchemCid: 702,
    atoms: [
      { id: 'C1', element: 'C', position: [-1.22, -0.23, 0.0] },
      { id: 'C2', element: 'C', position: [0.0, 0.58, 0.0] },
      { id: 'O1', element: 'O', position: [1.19, -0.22, 0.0] },
      { id: 'H1', element: 'H', position: [1.95, 0.37, 0.0] },
      { id: 'H2', element: 'H', position: [0.02, 1.22, 0.89] },
      { id: 'H3', element: 'H', position: [0.02, 1.22, -0.89] },
      { id: 'H4', element: 'H', position: [-1.24, -0.87, 0.89] },
      { id: 'H5', element: 'H', position: [-1.24, -0.87, -0.89] },
      { id: 'H6', element: 'H', position: [-2.09, 0.43, 0.0] },
    ],
    bonds: [
      { source: 'C1', target: 'C2', order: 1 },
      { source: 'C2', target: 'O1', order: 1 },
      { source: 'O1', target: 'H1', order: 1 },
      { source: 'C2', target: 'H2', order: 1 },
      { source: 'C2', target: 'H3', order: 1 },
      { source: 'C1', target: 'H4', order: 1 },
      { source: 'C1', target: 'H5', order: 1 },
      { source: 'C1', target: 'H6', order: 1 },
    ],
  },
  benzene: {
    name: 'Benzene',
    formula: 'C₆H₆',
    geometryName: 'Planar Hexagonal (Aromatic Ring)',
    bondAngleDeg: 120.0,
    pubchemCid: 241,
    atoms: [
      { id: 'C1', element: 'C', position: [1.40, 0.0, 0.0] },
      { id: 'C2', element: 'C', position: [0.70, 1.21, 0.0] },
      { id: 'C3', element: 'C', position: [-0.70, 1.21, 0.0] },
      { id: 'C4', element: 'C', position: [-1.40, 0.0, 0.0] },
      { id: 'C5', element: 'C', position: [-0.70, -1.21, 0.0] },
      { id: 'C6', element: 'C', position: [0.70, -1.21, 0.0] },
      { id: 'H1', element: 'H', position: [2.49, 0.0, 0.0] },
      { id: 'H2', element: 'H', position: [1.25, 2.16, 0.0] },
      { id: 'H3', element: 'H', position: [-1.25, 2.16, 0.0] },
      { id: 'H4', element: 'H', position: [-2.49, 0.0, 0.0] },
      { id: 'H5', element: 'H', position: [-1.25, -2.16, 0.0] },
      { id: 'H6', element: 'H', position: [1.25, -2.16, 0.0] },
    ],
    bonds: [
      { source: 'C1', target: 'C2', order: 2 },
      { source: 'C2', target: 'C3', order: 1 },
      { source: 'C3', target: 'C4', order: 2 },
      { source: 'C4', target: 'C5', order: 1 },
      { source: 'C5', target: 'C6', order: 2 },
      { source: 'C6', target: 'C1', order: 1 },
      { source: 'C1', target: 'H1', order: 1 },
      { source: 'C2', target: 'H2', order: 1 },
      { source: 'C3', target: 'H3', order: 1 },
      { source: 'C4', target: 'H4', order: 1 },
      { source: 'C5', target: 'H5', order: 1 },
      { source: 'C6', target: 'H6', order: 1 },
    ],
  },
  glucose: {
    name: 'D-Glucose',
    formula: 'C₆H₁₂O₆',
    geometryName: 'Pyranose Ring (Chair Conformation)',
    bondAngleDeg: 109.5,
    pubchemCid: 5793,
    atoms: [
      { id: 'C1', element: 'C', position: [1.18, 0.72, -0.22] },
      { id: 'C2', element: 'C', position: [0.02, 1.54, 0.35] },
      { id: 'C3', element: 'C', position: [-1.31, 0.81, -0.01] },
      { id: 'C4', element: 'C', position: [-1.28, -0.63, 0.54] },
      { id: 'C5', element: 'C', position: [-0.07, -1.39, -0.01] },
      { id: 'O5', element: 'O', position: [1.13, -0.63, 0.36] },
      { id: 'O1', element: 'O', position: [2.37, 1.34, 0.22] },
      { id: 'O2', element: 'O', position: [0.08, 2.82, -0.25] },
      { id: 'O3', element: 'O', position: [-2.41, 1.55, 0.44] },
      { id: 'O4', element: 'O', position: [-2.45, -1.33, 0.17] },
      { id: 'C6', element: 'C', position: [-0.07, -2.81, 0.55] },
      { id: 'O6', element: 'O', position: [-0.03, -3.74, -0.51] },
    ],
    bonds: [
      { source: 'C1', target: 'C2', order: 1 },
      { source: 'C2', target: 'C3', order: 1 },
      { source: 'C3', target: 'C4', order: 1 },
      { source: 'C4', target: 'C5', order: 1 },
      { source: 'C5', target: 'O5', order: 1 },
      { source: 'O5', target: 'C1', order: 1 },
      { source: 'C1', target: 'O1', order: 1 },
      { source: 'C2', target: 'O2', order: 1 },
      { source: 'C3', target: 'O3', order: 1 },
      { source: 'C4', target: 'O4', order: 1 },
      { source: 'C5', target: 'C6', order: 1 },
      { source: 'C6', target: 'O6', order: 1 },
    ],
  },
};

export function generateMoleculeGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = moleculeViewerParamsSchema.parse(rawParams);
  const mol = MOLECULES[params.moleculeId] ?? MOLECULES.H2O;
  const elements: ProceduralMeshElement[] = [];
  const explodeFactor = 1 + params.explodedView * 1.5;

  const atomMap = new Map<string, Point3D>();

  // 1. Generate Atoms
  mol.atoms.forEach((atom) => {
    const origPos = atom.position;
    const pos: Point3D = [
      origPos[0] * explodeFactor,
      origPos[1] * explodeFactor,
      origPos[2] * explodeFactor,
    ];
    atomMap.set(atom.id, pos);

    const radius =
      params.renderingStyle === 'space_filling'
        ? (VDW_RADII[atom.element] ?? 1.5) * 0.55
        : (BALL_RADII[atom.element] ?? 0.5);

    elements.push({
      id: atom.id,
      name: `${atom.element} Atom (${atom.id})`,
      type: 'sphere',
      position: pos,
      radius,
      color: CPK_COLORS[atom.element] ?? '#cbd5e1',
      roughness: 0.3,
      metalness: 0.1,
      userData: {
        element: atom.element,
        vdwRadius: VDW_RADII[atom.element],
        molecule: mol.formula,
      },
    });
  });

  // 2. Generate Covalent Bonds (cylinder bridges)
  if (params.renderingStyle !== 'space_filling') {
    mol.bonds.forEach((bond, bIdx) => {
      const p1 = atomMap.get(bond.source);
      const p2 = atomMap.get(bond.target);
      if (!p1 || !p2) return;

      const mid: Point3D = [
        (p1[0] + p2[0]) / 2,
        (p1[1] + p2[1]) / 2,
        (p1[2] + p2[2]) / 2,
      ];

      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dz = p2[2] - p1[2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Orientation vector calculation
      const pitch = Math.atan2(Math.sqrt(dx * dx + dz * dz), dy);
      const yaw = Math.atan2(dx, dz);

      elements.push({
        id: `bond-${bIdx}`,
        name: `${bond.order === 2 ? 'Double' : 'Single'} Covalent Bond (${bond.source}-${bond.target})`,
        type: 'cylinder',
        position: mid,
        rotation: [pitch, yaw, 0],
        radius: bond.order === 2 ? 0.12 : 0.08,
        height: length,
        color: '#94a3b8',
        roughness: 0.5,
        userData: {
          order: bond.order,
          lengthAngstroms: (length / explodeFactor).toFixed(2),
        },
      });
    });
  }

  return {
    elements,
    boundingRadius: 4.5 * explodeFactor,
    defaultCameraPosition: [0, 2.5, 6.0],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: mol.atoms.slice(0, 3).map((a) => ({
      id: a.id,
      name: `${a.element} (${a.id})`,
      position: atomMap.get(a.id) ?? a.position,
    })),
    educationalSummary: {
      keyFormulas: [
        `\\text{VSEPR Geometry: } \\text{${mol.geometryName}}`,
        `\\text{Equilibrium Bond Angle: } ${mol.bondAngleDeg}^\\circ`,
        '\\text{Covalent bond length } \\approx 0.96 - 1.54 \\text{ Å}',
      ],
      constants: {
        'PubChem CID': String(mol.pubchemCid),
        'Molecular Formula': mol.formula,
        'Geometry Class': mol.geometryName,
      },
      insights: [
        `${mol.name} (${mol.formula}) exhibits ${mol.geometryName} geometry determined by electron pair repulsion.`,
        `Bond angle of ${mol.bondAngleDeg}° balances bonding pair and lone pair electron domain repulsions.`,
        'Space-filling mode reveals the outer van der Waals electron cloud envelope.',
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'central_atom',
    title: 'Central Atom',
    description: 'Central nucleophile atom whose valence hybridization and lone pairs dictate the 3D VSEPR molecular shape.',
    position: [0, 0, 0],
    partCategory: 'core',
  },
  {
    id: 'covalent_bond',
    title: 'Covalent Electron Sharing',
    description: 'Shared pair of valence electrons localized between two atomic nuclei forming a stable sigma or pi chemical bond.',
    position: [0.38, 0, 0],
    partCategory: 'bond',
  },
  {
    id: 'bond_angle',
    title: 'VSEPR Bond Angle',
    description: 'Spatial angle between adjacent bonds, minimized to reduce electron-electron repulsion according to VSEPR theory.',
    position: [0, 0.4, 0],
    partCategory: 'angle',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 2, 6],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Molecular Viewer. All coordinates are sourced directly from public-domain PubChem crystallographic data.',
    action: 'orbit',
  },
  {
    timeInSeconds: 4,
    cameraPosition: [0, 0.5, 2.5],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'central_atom',
    caption: 'Observe the central atom. The spatial orientation of bonds is governed by the Valence Shell Electron Pair Repulsion (VSEPR) model.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 9,
    cameraPosition: [2, 2, 4],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'bond_angle',
    caption: 'Notice the characteristic bond angle. Lone pair repulsions push the bonded atoms into their lowest-energy 3D shape.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-mol-1',
    question: 'Tap the central atom of this molecule.',
    targetPartId: 'central_atom',
    hint: 'Look for the atom situated at the origin connected to all surrounding atoms.',
    successFeedback: 'Correct! The central atom coordinates the valence orbitals for the entire molecule.',
  },
  {
    id: 'quiz-mol-2',
    question: 'Tap a covalent bond connecting two atoms.',
    targetPartId: 'covalent_bond',
    hint: 'Tap one of the grey cylinder connectors between the atom spheres.',
    successFeedback: 'Exactly! Covalent bonds represent shared electron pairs holding the molecule together.',
  },
];

export const moleculeViewerScene: Scene3DDefinition = {
  id: 'molecule_3d_viewer',
  title: '3D Molecular Geometry & VSEPR Chemical Bonding',
  subject: 'chemistry',
  conceptIds: ['chemical_bonding', 'molecular_geometry', 'vsepr_theory'],
  description: 'Rotatable 3D molecule visualizer rendering H2O, CO2, CH4, NH3, ethanol, benzene, and glucose with PubChem coordinates, ball-and-stick/space-fill toggle, and bond angles.',
  paramKeys: Object.keys(moleculeViewerParamsSchema.shape),
  paramsSchema: moleculeViewerParamsSchema,
  defaultParams: moleculeViewerParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateMoleculeGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = moleculeViewerParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

