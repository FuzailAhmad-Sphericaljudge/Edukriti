import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const crystalLatticeParamsSchema = z.object({
  latticeType: z.enum(['SC', 'BCC', 'FCC', 'diamond']).default('FCC'),
  supercellReplication: z.enum(['1x1x1', '2x2x2']).default('1x1x1'),
  atomRadiusMode: z.enum(['ball_and_stick', 'hard_sphere']).default('ball_and_stick'),
  latticeConstant: z.number().min(2.5).max(5.0).default(3.6),
  explodedView: z.number().min(0).max(1).default(0),
});

export type CrystalLatticeParams = z.infer<typeof crystalLatticeParamsSchema>;

interface LatticeProperties {
  name: string;
  atomsPerCell: number;
  coordinationNumber: number;
  apf: number;
  apfFormula: string;
  relationFormula: string;
  examples: string[];
}

const LATTICE_PROPS: Record<string, LatticeProperties> = {
  SC: {
    name: 'Simple Cubic (SC)',
    atomsPerCell: 1,
    coordinationNumber: 6,
    apf: 0.524,
    apfFormula: '\\text{APF} = \\frac{\\pi}{6} \\approx 0.52',
    relationFormula: 'a = 2R',
    examples: ['Polonium (α-Po)'],
  },
  BCC: {
    name: 'Body-Centered Cubic (BCC)',
    atomsPerCell: 2,
    coordinationNumber: 8,
    apf: 0.680,
    apfFormula: '\\text{APF} = \\frac{\\sqrt{3}\\pi}{8} \\approx 0.68',
    relationFormula: 'a = \\frac{4R}{\\sqrt{3}}',
    examples: ['Iron (α-Fe)', 'Chromium', 'Tungsten', 'Sodium'],
  },
  FCC: {
    name: 'Face-Centered Cubic (FCC / CCP)',
    atomsPerCell: 4,
    coordinationNumber: 12,
    apf: 0.740,
    apfFormula: '\\text{APF} = \\frac{\\pi}{3\\sqrt{2}} \\approx 0.74',
    relationFormula: 'a = 2\\sqrt{2}R',
    examples: ['Copper', 'Gold', 'Silver', 'Aluminium', 'Nickel'],
  },
  diamond: {
    name: 'Diamond Cubic',
    atomsPerCell: 8,
    coordinationNumber: 4,
    apf: 0.340,
    apfFormula: '\\text{APF} = \\frac{\\sqrt{3}\\pi}{16} \\approx 0.34',
    relationFormula: 'a = \\frac{8R}{\\sqrt{3}}',
    examples: ['Carbon (Diamond)', 'Silicon', 'Germanium'],
  },
};

export function generateCrystalLatticeGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = crystalLatticeParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const a = params.latticeConstant;
  const props = LATTICE_PROPS[params.latticeType] ?? LATTICE_PROPS.FCC;
  const is2x2 = params.supercellReplication === '2x2x2';
  const explodeFactor = 1 + params.explodedView * 0.8;

  // Determine base atom radius
  let baseR = 0.35;
  if (params.atomRadiusMode === 'hard_sphere') {
    if (params.latticeType === 'SC') baseR = (a / 2) * 0.95;
    else if (params.latticeType === 'BCC') baseR = ((Math.sqrt(3) * a) / 4) * 0.95;
    else if (params.latticeType === 'FCC') baseR = (a / (2 * Math.sqrt(2))) * 0.95;
    else baseR = ((Math.sqrt(3) * a) / 8) * 0.95;
  }

  const cells = is2x2 ? [0, 1] : [0];

  const addedAtoms = new Set<string>();

  const addAtom = (
    pos: Point3D,
    role: 'corner' | 'body' | 'face' | 'tetrahedral',
    label: string,
  ) => {
    const key = `${pos[0].toFixed(2)},${pos[1].toFixed(2)},${pos[2].toFixed(2)}`;
    if (addedAtoms.has(key)) return;
    addedAtoms.add(key);

    const color =
      role === 'corner'
        ? '#38bdf8' // sky-400 (corners)
        : role === 'body'
          ? '#fbbf24' // amber-400 (central body atom)
          : role === 'face'
            ? '#ec4899' // pink-500 (face atoms)
            : '#a855f7'; // purple-500 (interstitial diamond atoms)

    elements.push({
      id: `atom-${key}`,
      name: `${label} (${role})`,
      type: 'sphere',
      position: [pos[0] * explodeFactor, pos[1] * explodeFactor, pos[2] * explodeFactor],
      radius: baseR,
      color,
      roughness: 0.3,
      metalness: 0.2,
      userData: { role, lattice: params.latticeType },
    });
  };

  cells.forEach((cx) => {
    cells.forEach((cy) => {
      cells.forEach((cz) => {
        const ox = (cx - (is2x2 ? 0.5 : 0)) * a;
        const oy = (cy - (is2x2 ? 0.5 : 0)) * a;
        const oz = (cz - (is2x2 ? 0.5 : 0)) * a;

        // 8 Corner Atoms of this unit cell
        const corners: Point3D[] = [
          [ox - a / 2, oy - a / 2, oz - a / 2],
          [ox + a / 2, oy - a / 2, oz - a / 2],
          [ox - a / 2, oy + a / 2, oz - a / 2],
          [ox + a / 2, oy + a / 2, oz - a / 2],
          [ox - a / 2, oy - a / 2, oz + a / 2],
          [ox + a / 2, oy - a / 2, oz + a / 2],
          [ox - a / 2, oy + a / 2, oz + a / 2],
          [ox + a / 2, oy + a / 2, oz + a / 2],
        ];

        corners.forEach((c) => addAtom(c, 'corner', 'Corner Lattice Atom'));

        // Unit Cell Wireframe Box
        elements.push({
          id: `cell-wireframe-${cx}-${cy}-${cz}`,
          name: `Unit Cell Edge Boundary (a = ${a.toFixed(2)} Å)`,
          type: 'box',
          position: [ox * explodeFactor, oy * explodeFactor, oz * explodeFactor],
          scale: [a * explodeFactor, a * explodeFactor, a * explodeFactor],
          color: '#cbd5e1',
          wireframe: true,
          opacity: 0.4,
        });

        // Body-Centered atom
        if (params.latticeType === 'BCC') {
          addAtom([ox, oy, oz], 'body', 'Central Body Atom (1/1)');
        }

        // Face-Centered atoms
        if (params.latticeType === 'FCC' || params.latticeType === 'diamond') {
          const faces: Point3D[] = [
            [ox, oy + a / 2, oz], // top face
            [ox, oy - a / 2, oz], // bottom face
            [ox, oy, oz + a / 2], // front face
            [ox, oy, oz - a / 2], // back face
            [ox + a / 2, oy, oz], // right face
            [ox - a / 2, oy, oz], // left face
          ];
          faces.forEach((f) => addAtom(f, 'face', 'Face-Centered Atom (1/2)'));
        }

        // Diamond tetrahedral interstitial sites (4 per unit cell)
        if (params.latticeType === 'diamond') {
          const tetra: Point3D[] = [
            [ox - a / 4, oy - a / 4, oz - a / 4],
            [ox + a / 4, oy + a / 4, oz - a / 4],
            [ox + a / 4, oy - a / 4, oz + a / 4],
            [ox - a / 4, oy + a / 4, oz + a / 4],
          ];
          tetra.forEach((t) => addAtom(t, 'tetrahedral', 'Tetrahedral Interstitial Atom'));
        }
      });
    });
  });

  const span = (is2x2 ? a * 2 : a) * explodeFactor;

  return {
    elements,
    boundingRadius: span * 1.5,
    defaultCameraPosition: [span * 1.1, span * 0.9, span * 1.4],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 'origin', name: 'Corner (0,0,0)', position: [-a / 2, -a / 2, -a / 2] },
      { id: 'edge-pt', name: 'Lattice Constant Edge (a)', position: [a / 2, -a / 2, -a / 2] },
      { id: 'center-pt', name: 'Body Center', position: [0, 0, 0] },
    ],
    educationalSummary: {
      keyFormulas: [
        `\\text{Unit Cell: } \\text{${props.name}}`,
        `\\text{Atoms per Unit Cell: } ${props.atomsPerCell}`,
        `\\text{Coordination Number: } ${props.coordinationNumber}`,
        `\\text{Atomic Packing Factor (APF): } ${props.apfFormula}`,
        `\\text{Lattice-Radius Relation: } ${props.relationFormula}`,
      ],
      constants: {
        'Lattice Type': props.name,
        'Lattice Constant (a)': `${a.toFixed(2)} Å`,
        'Coordination Number': String(props.coordinationNumber),
        'Packing Efficiency': `${(props.apf * 100).toFixed(1)}%`,
        'Typical Materials': props.examples.join(', '),
      },
      insights: [
        `${props.name} packs ${(props.apf * 100).toFixed(1)}% of unit cell volume with hard spheres; remaining space is interstitial void.`,
        `Each atom is in direct touch with ${props.coordinationNumber} nearest neighbors (coordination number).`,
        `Corner atoms are shared among 8 adjacent unit cells contribute only 1/8 to each individual cell.`,
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'corner_atoms',
    title: 'Corner Lattice Sites (1/8 each)',
    description: 'Each corner atom is shared among 8 neighboring unit cells in a 3D repeating crystal lattice, contributing exactly 1/8 atom per unit cell.',
    position: [-1.8, -1.8, -1.8],
    partCategory: 'site',
  },
  {
    id: 'unit_cell_edge',
    title: 'Lattice Parameter (a)',
    description: 'Fundamental repeat distance along the unit cell edges. In cubic systems, a = b = c and α = β = γ = 90°.',
    position: [0, -1.8, -1.8],
    partCategory: 'parameter',
  },
  {
    id: 'coordination_center',
    title: 'Central / Face Atom Sites',
    description: 'Body-centered or face-centered atomic positions maximizing packing density up to the Kepler conjecture limit (74.05% for FCC/HCP).',
    position: [0, 0, 0],
    partCategory: 'site',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [4, 4, 6],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Solid State Crystal Lattice Viewer. Unit cells repeat in 3D translational symmetry to build macroscale crystals.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [-2, -2, -1],
    cameraTarget: [-1.8, -1.8, -1.8],
    highlightPartId: 'corner_atoms',
    caption: 'Observe the corner atoms: because 8 cubes share each corner point in space, only 1/8 of each corner atom belongs to this single cell.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [2, 2, 4],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'coordination_center',
    caption: 'Notice the coordination number: in FCC metals like gold or copper, each atom touches 12 nearest neighbors, packing 74% of available space.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-cryst-1',
    question: 'Tap a corner atom shared among 8 adjoining unit cells.',
    targetPartId: 'corner_atoms',
    hint: 'Look at any of the 8 vertices of the cubic wireframe box.',
    successFeedback: 'Correct! 8 corners × 1/8 = 1 whole atom contribution from corners.',
  },
  {
    id: 'quiz-cryst-2',
    question: 'Tap the center or face atomic position of the unit cell.',
    targetPartId: 'coordination_center',
    hint: 'Look inside the cube center or on the flat outer faces.',
    successFeedback: 'Spot on! Body and face atoms elevate packing efficiency and mechanical ductility in metals.',
  },
];

export const crystalLatticeScene: Scene3DDefinition = {
  id: 'crystal_lattice_3d',
  title: 'Solid-State Crystal Lattices & Unit Cells (SC, BCC, FCC)',
  subject: 'chemistry',
  conceptIds: ['solid_state', 'crystal_lattice', 'unit_cell', 'atomic_packing_factor'],
  description: 'Interactive 3D solid-state chemistry lattice viewer demonstrating Simple Cubic, BCC, FCC, and Diamond unit cells with atomic packing factor and coordination numbers.',
  paramKeys: Object.keys(crystalLatticeParamsSchema.shape),
  paramsSchema: crystalLatticeParamsSchema,
  defaultParams: crystalLatticeParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateCrystalLatticeGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = crystalLatticeParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

