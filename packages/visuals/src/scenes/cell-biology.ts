import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const cellBiologyParamsSchema = z.object({
  cellType: z.enum(['animal', 'plant']).default('animal'),
  cutawayView: z.boolean().default(true),
  showOrganelleLabels: z.boolean().default(true),
  explodedView: z.number().min(0).max(1).default(0),
});

export type CellBiologyParams = z.infer<typeof cellBiologyParamsSchema>;

export function generateCellBiologyGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = cellBiologyParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const isPlant = params.cellType === 'plant';
  const explodeFactor = 1 + params.explodedView * 1.5;

  // 1. Outer Boundary (Cell Membrane / Cell Wall)
  if (isPlant) {
    // Rigid outer cell wall (greenish-tinted box)
    elements.push({
      id: 'cell-wall',
      name: 'Rigid Cellulose Cell Wall',
      type: 'box',
      position: [0, 0, 0],
      scale: [6.4 * explodeFactor, 4.4 * explodeFactor, 4.4 * explodeFactor],
      color: '#15803d', // green-700
      opacity: params.cutawayView ? 0.25 : 0.6,
      wireframe: true,
      userData: { composition: 'Cellulose & Pectin', function: 'Structural rigidity & turgor pressure' },
    });
  }

  // Plasma Membrane & Cytoplasm Envelope
  elements.push({
    id: 'plasma-membrane',
    name: 'Plasma Membrane (Phospholipid Bilayer)',
    type: isPlant ? 'box' : 'sphere',
    position: [0, 0, 0],
    scale: isPlant ? [6.0 * explodeFactor, 4.0 * explodeFactor, 4.0 * explodeFactor] : [3.0 * explodeFactor, 2.5 * explodeFactor, 2.5 * explodeFactor],
    radius: 2.8 * explodeFactor,
    color: '#06b6d4', // cyan-500
    opacity: params.cutawayView ? 0.2 : 0.5,
    roughness: 0.7,
    userData: { function: 'Selective permeability & transport' },
  });

  // 2. Central Nucleus & Nucleolus
  const nucleusPos: Point3D = [-0.6 * explodeFactor, 0.2 * explodeFactor, 0];
  elements.push({
    id: 'nucleus',
    name: 'Cell Nucleus (Nuclear Envelope & Chromatin)',
    type: 'sphere',
    position: nucleusPos,
    radius: 0.9,
    color: '#8b5cf6', // purple-500
    emissive: '#6d28d9',
    roughness: 0.4,
    userData: {
      organelle: 'Nucleus',
      contents: 'DNA Chromatin, Nuclear Pores, Nucleolus',
      function: 'Master control center of cell transcription & replication',
    },
  });

  // Dense Nucleolus inside Nucleus
  elements.push({
    id: 'nucleolus',
    name: 'Dense Nucleolus (Ribosomal RNA Synthesis)',
    type: 'sphere',
    position: [nucleusPos[0] + 0.2, nucleusPos[1] + 0.1, nucleusPos[2] + 0.1],
    radius: 0.35,
    color: '#c084fc', // purple-400
    emissive: '#9333ea',
    userData: { function: 'Ribosome biogenesis & rRNA synthesis' },
  });

  // 3. Mitochondria ("Powerhouses of the Cell")
  const mitoPositions: Array<{ pos: Point3D; rot: Point3D }> = [
    { pos: [1.6 * explodeFactor, 0.8 * explodeFactor, 0.5], rot: [0.3, 0.5, 0] },
    { pos: [1.2 * explodeFactor, -0.9 * explodeFactor, -0.4], rot: [-0.4, 0.2, 0.3] },
    { pos: [-1.8 * explodeFactor, -0.7 * explodeFactor, 0.6], rot: [0.1, -0.6, 0.4] },
  ];

  mitoPositions.forEach((m, idx) => {
    elements.push({
      id: `mitochondrion-${idx}`,
      name: `Mitochondrion #${idx + 1} (ATP Cellular Respiration)`,
      type: 'cylinder',
      position: m.pos,
      rotation: m.rot,
      radius: 0.32,
      height: 0.9,
      color: '#f97316', // orange-500
      emissive: '#c2410c',
      userData: {
        organelle: 'Mitochondria',
        function: 'Aerobic cellular respiration (Krebs cycle & oxidative phosphorylation ATP)',
      },
    });
  });

  // 4. Chloroplasts (Plant cell exclusive)
  if (isPlant) {
    const chloroPositions: Array<{ pos: Point3D; rot: Point3D }> = [
      { pos: [1.8 * explodeFactor, 1.2 * explodeFactor, -0.8], rot: [0.2, 0.4, 0] },
      { pos: [-1.9 * explodeFactor, 1.1 * explodeFactor, -0.6], rot: [-0.3, 0.2, 0] },
      { pos: [2.0 * explodeFactor, -1.0 * explodeFactor, 0.7], rot: [0.1, -0.3, 0.2] },
    ];

    chloroPositions.forEach((c, idx) => {
      elements.push({
        id: `chloroplast-${idx}`,
        name: `Chloroplast #${idx + 1} (Photosynthesis Thylakoids)`,
        type: 'sphere',
        position: c.pos,
        radius: 0.42,
        color: '#22c55e', // green-500
        emissive: '#15803d',
        userData: {
          organelle: 'Chloroplast',
          function: 'Photosynthesis: light reactions in thylakoid grana & Calvin cycle in stroma',
        },
      });
    });

    // Large Central Vacuole (Plant cell)
    elements.push({
      id: 'central-vacuole',
      name: 'Large Central Vacuole (Cell Sap & Turgor Pressure)',
      type: 'sphere',
      position: [0.8 * explodeFactor, -0.2 * explodeFactor, 0],
      radius: 1.1,
      color: '#38bdf8', // sky-400
      opacity: 0.55,
      roughness: 0.2,
      userData: { function: 'Hydraulic turgor pressure maintenance & waste storage' },
    });
  }

  // 5. Endoplasmic Reticulum (Curved cisternal shells surrounding nucleus)
  elements.push({
    id: 'rough-er',
    name: 'Rough Endoplasmic Reticulum (Studded with Ribosomes)',
    type: 'ring',
    position: nucleusPos,
    rotation: [Math.PI / 3, 0, 0],
    radius: 1.25,
    color: '#ec4899', // pink-500
    wireframe: true,
    userData: { function: 'Protein translation, folding, and post-translational modification' },
  });

  // 6. Golgi Apparatus (Stacked disc vesicles)
  const golgiPos: Point3D = [0.4 * explodeFactor, 1.2 * explodeFactor, 0.8];
  for (let g = 0; g < 4; g++) {
    elements.push({
      id: `golgi-cisterna-${g}`,
      name: 'Golgi Apparatus Cisterna',
      type: 'box',
      position: [golgiPos[0], golgiPos[1] + g * 0.12, golgiPos[2]],
      scale: [0.9, 0.06, 0.5],
      color: '#eab308', // yellow-500
      roughness: 0.4,
      userData: { function: 'Packaging, sorting, and vesicle export of macromolecules' },
    });
  }

  const boundR = isPlant ? 4.5 * explodeFactor : 3.5 * explodeFactor;

  return {
    elements,
    boundingRadius: boundR,
    defaultCameraPosition: [0, 2.5, boundR * 1.3],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 'nucleus-center', name: 'Nucleus Center', position: nucleusPos },
      { id: 'mito-pt', name: 'Mitochondrion', position: mitoPositions[0]?.pos ?? [0, 0, 0] },
      { id: 'membrane-edge', name: 'Outer Membrane Edge', position: [boundR * 0.7, 0, 0] },
    ],
    educationalSummary: {
      keyFormulas: [
        '\\text{Cellular Respiration: } \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\to 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + 36\\text{ ATP}',
        isPlant
          ? '\\text{Photosynthesis: } 6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{h\\nu} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2'
          : '\\text{Animal Cell: Flexible boundary without cell wall or chloroplasts}',
        '\\text{Organelles compartmentalize biochemical metabolic reactions}',
      ],
      constants: {
        'Cell Type': isPlant ? 'Eukaryotic Plant Cell' : 'Eukaryotic Animal Cell',
        'Nucleus Diameter': '~5-10 µm',
        'Mitochondria Count': '~1,000-2,000 per active cell',
        'Distinctive Structures': isPlant ? 'Cell wall, chloroplasts, central vacuole' : 'Flexible membrane, centrioles, lysosomes',
      },
      insights: [
        'Membrane-bound organelles partition incompatible biochemical environments (e.g. acidic lysosomes vs neutral cytoplasm).',
        'Mitochondria and chloroplasts contain their own circular DNA and 70S ribosomes (endosymbiotic origin).',
        isPlant
          ? 'Plant cells maintain turgor pressure via the central vacuole pushing outward against the rigid cellulose cell wall.'
          : 'Animal cells maintain an isotonic osmolarity to avoid osmotic swelling and lysis.',
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'nucleus_organelle',
    title: 'Cell Nucleus',
    description: 'Enclosed in a double-membrane envelope with nuclear pores; houses genomic DNA chromatin and directs gene transcription.',
    position: [-0.6, 0.2, 0],
    partCategory: 'nucleus',
  },
  {
    id: 'mitochondria_organelle',
    title: 'Mitochondria (ATP Powerhouse)',
    description: 'Double-membrane organelle with internal folded cristae executing oxidative phosphorylation to produce cellular ATP energy currency.',
    position: [1.6, 0.8, 0.5],
    partCategory: 'energy',
  },
  {
    id: 'golgi_organelle',
    title: 'Golgi Apparatus',
    description: 'Flattened cisternae stacks that modify, package, sort, and tag proteins and lipids into secretory vesicles.',
    position: [0.4, 1.2, 0.8],
    partCategory: 'transport',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 4, 8],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Eukaryotic Cell Model. Explore the compartmentalized organelles that coordinate life at the microscale.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [-0.6, 1.0, 2.5],
    cameraTarget: [-0.6, 0.2, 0],
    highlightPartId: 'nucleus_organelle',
    caption: 'Here is the nucleus, surrounded by a porous double membrane. Inside, chromatin contains the genetic code.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [1.6, 1.4, 2.2],
    cameraTarget: [1.6, 0.8, 0.5],
    highlightPartId: 'mitochondria_organelle',
    caption: 'The orange mitochondria are the powerhouses of the cell, converting glucose into adenosine triphosphate (ATP).',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-cell-1',
    question: 'Tap the nucleus containing the cell’s genetic chromatin.',
    targetPartId: 'nucleus_organelle',
    hint: 'Look for the large purple spherical organelle near the center.',
    successFeedback: 'Correct! The nucleus stores DNA and directs protein synthesis.',
  },
  {
    id: 'quiz-cell-2',
    question: 'Tap a mitochondrion responsible for ATP cellular respiration.',
    targetPartId: 'mitochondria_organelle',
    hint: 'Look for the orange capsule-shaped organelle with inner folded membranes.',
    successFeedback: 'Spot on! Mitochondria generate cellular energy via oxidative phosphorylation.',
  },
];

export const cellBiologyScene: Scene3DDefinition = {
  id: 'cell_biology_stylized',
  title: 'Eukaryotic Cell Anatomy & Organelle Physiology',
  subject: 'biology',
  conceptIds: ['cell_structure', 'organelles', 'cellular_respiration', 'photosynthesis'],
  description: 'Interactive 3D procedural eukaryotic animal and plant cell demonstrating nucleus, mitochondria, chloroplasts, Golgi apparatus, and turgor cell wall.',
  paramKeys: Object.keys(cellBiologyParamsSchema.shape),
  paramsSchema: cellBiologyParamsSchema,
  defaultParams: cellBiologyParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateCellBiologyGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = cellBiologyParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

