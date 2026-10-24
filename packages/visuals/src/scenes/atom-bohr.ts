import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D } from '../types.ts';

export const atomBohrParamsSchema = z.object({
  atomicNumber: z.number().int().min(1).max(20).default(6),
  electronSpeed: z.number().min(0).max(3).default(1),
  showShellLabels: z.boolean().default(true),
  showEnergyLevels: z.boolean().default(true),
  explodedView: z.number().min(0).max(1).default(0),
});

export type AtomBohrParams = z.infer<typeof atomBohrParamsSchema>;

const ELEMENT_DATA: Record<number, { symbol: string; name: string; massNumber: number }> = {
  1: { symbol: 'H', name: 'Hydrogen', massNumber: 1 },
  2: { symbol: 'He', name: 'Helium', massNumber: 4 },
  3: { symbol: 'Li', name: 'Lithium', massNumber: 7 },
  4: { symbol: 'Be', name: 'Beryllium', massNumber: 9 },
  5: { symbol: 'B', name: 'Boron', massNumber: 11 },
  6: { symbol: 'C', name: 'Carbon', massNumber: 12 },
  7: { symbol: 'N', name: 'Nitrogen', massNumber: 14 },
  8: { symbol: 'O', name: 'Oxygen', massNumber: 16 },
  9: { symbol: 'F', name: 'Fluorine', massNumber: 19 },
  10: { symbol: 'Ne', name: 'Neon', massNumber: 20 },
  11: { symbol: 'Na', name: 'Sodium', massNumber: 23 },
  12: { symbol: 'Mg', name: 'Magnesium', massNumber: 24 },
  13: { symbol: 'Al', name: 'Aluminium', massNumber: 27 },
  14: { symbol: 'Si', name: 'Silicon', massNumber: 28 },
  15: { symbol: 'P', name: 'Phosphorus', massNumber: 31 },
  16: { symbol: 'S', name: 'Sulfur', massNumber: 32 },
  17: { symbol: 'Cl', name: 'Chlorine', massNumber: 35 },
  18: { symbol: 'Ar', name: 'Argon', massNumber: 40 },
  19: { symbol: 'K', name: 'Potassium', massNumber: 39 },
  20: { symbol: 'Ca', name: 'Calcium', massNumber: 40 },
};

export function getShellElectronCounts(zNum: number): number[] {
  const capacities = [2, 8, 8, 2];
  const counts: number[] = [];
  let remaining = zNum;
  for (const cap of capacities) {
    if (remaining <= 0) break;
    const inShell = Math.min(remaining, cap);
    counts.push(inShell);
    remaining -= inShell;
  }
  return counts;
}

export function generateAtomBohrGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = atomBohrParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const zNum = params.atomicNumber;
  const element = ELEMENT_DATA[zNum] ?? { symbol: 'X', name: 'Element', massNumber: zNum * 2 };
  const numProtons = zNum;
  const numNeutrons = Math.max(0, element.massNumber - numProtons);
  const shellCounts = getShellElectronCounts(zNum);
  const explodeFactor = 1 + params.explodedView * 1.5;

  // 1. Central Nucleus Cluster
  elements.push({
    id: 'nucleus',
    name: `${element.name} Nucleus (${numProtons}p, ${numNeutrons}n)`,
    type: 'sphere',
    position: [0, 0, 0],
    radius: 0.8,
    color: '#e11d48', // rose-600
    emissive: '#881337',
    roughness: 0.3,
    metalness: 0.1,
    userData: {
      protons: numProtons,
      neutrons: numNeutrons,
      symbol: element.symbol,
      atomicNumber: zNum,
    },
  });

  // Individual nucleon spheres inside cluster for tactile visual
  const totalNucleons = Math.min(18, numProtons + numNeutrons);
  for (let i = 0; i < totalNucleons; i++) {
    const phi = Math.acos(-1 + (2 * i) / totalNucleons);
    const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
    const r = 0.5;
    const isProton = i % 2 === 0;
    elements.push({
      id: `nucleon-${i}`,
      name: isProton ? 'Proton (+1)' : 'Neutron (0)',
      type: 'sphere',
      position: [
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ],
      radius: 0.22,
      color: isProton ? '#ef4444' : '#94a3b8',
      roughness: 0.4,
    });
  }

  // 2. Concentric Electron Shells & Orbiting Electrons
  const shellRadii = [2.2, 3.8, 5.4, 7.0];
  const shellNames = ['K Shell (n=1)', 'L Shell (n=2)', 'M Shell (n=3)', 'N Shell (n=4)'];
  const energyLevels = ['-13.60 eV', '-3.40 eV', '-1.51 eV', '-0.85 eV'];

  let valenceElectronId = 'electron-0-0';

  shellCounts.forEach((count, sIdx) => {
    const baseRadius = shellRadii[sIdx] ?? 2.2 + sIdx * 1.6;
    const r = baseRadius * explodeFactor;
    const isValenceShell = sIdx === shellCounts.length - 1;

    // Shell orbit ring
    elements.push({
      id: `shell-ring-${sIdx}`,
      name: shellNames[sIdx] ?? `Shell ${sIdx + 1}`,
      type: 'ring',
      position: [0, 0, 0],
      rotation: [Math.PI / 2, 0, 0],
      radius: r,
      color: isValenceShell ? '#38bdf8' : '#0284c7',
      opacity: 0.6,
      wireframe: true,
      userData: {
        shellIndex: sIdx + 1,
        capacity: sIdx === 0 ? 2 : 8,
        electronCount: count,
        energyLevel: energyLevels[sIdx],
      },
    });

    // Electrons evenly distributed on this shell
    for (let eIdx = 0; eIdx < count; eIdx++) {
      const angle = (2 * Math.PI * eIdx) / count;
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const eId = `electron-${sIdx}-${eIdx}`;

      if (isValenceShell && eIdx === 0) {
        valenceElectronId = eId;
      }

      elements.push({
        id: eId,
        name: isValenceShell ? 'Valence Electron (-1e)' : 'Core Electron (-1e)',
        type: 'sphere',
        position: [x, 0, z],
        radius: 0.16,
        color: isValenceShell ? '#38bdf8' : '#0ea5e9',
        emissive: '#0369a1',
        roughness: 0.2,
        userData: {
          shell: sIdx + 1,
          isValence: isValenceShell,
          charge: -1,
        },
      });
    }
  });

  const maxR = (shellRadii[shellCounts.length - 1] ?? 5.4) * explodeFactor;

  return {
    elements,
    boundingRadius: maxR + 1.5,
    defaultCameraPosition: [0, maxR * 0.9, maxR * 1.6],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 'nucleus', name: 'Nucleus Center', position: [0, 0, 0] },
      { id: 'k-shell-pt', name: 'K Shell Boundary', position: [2.2, 0, 0] },
      { id: 'valence-pt', name: 'Outer Valence Radius', position: [maxR, 0, 0] },
    ],
    educationalSummary: {
      keyFormulas: [
        'E_n = -\\frac{13.6 \\text{ eV}}{n^2}',
        'r_n = n^2 a_0 \\quad (a_0 = 0.529 \\text{ Å})',
        '\\text{Max Electrons} = 2n^2',
      ],
      constants: {
        'Bohr Radius (a₀)': '0.529 Å (0.0529 nm)',
        'Rydberg Constant (R_H)': '1.097 × 10⁷ m⁻¹',
        'Electron Charge (e)': '1.602 × 10⁻¹⁹ C',
      },
      insights: [
        `Element: ${element.name} (${element.symbol}), Atomic Number Z = ${zNum}.`,
        `Electron Configuration: ${shellCounts.map((c, i) => `${shellNames[i]?.slice(0, 1)}:${c}`).join(' ')}.`,
        `Outermost shell contains ${shellCounts[shellCounts.length - 1]} valence electrons governing bonding.`,
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'nucleus',
    title: 'Atomic Nucleus',
    description: 'Dense core containing positively charged protons and neutral neutrons held together by the strong nuclear force.',
    position: [0, 0, 0],
    partCategory: 'core',
  },
  {
    id: 'k_shell',
    title: 'K Shell (n = 1)',
    description: 'Ground state energy level closest to the nucleus (capacity: 2 electrons, energy: -13.6 eV).',
    position: [2.2, 0, 0],
    partCategory: 'orbital',
  },
  {
    id: 'valence_electrons',
    title: 'Valence Electrons',
    description: 'Electrons residing in the highest energy occupied orbital that determine chemical valence, electronegativity, and reactions.',
    position: [3.8, 0, 0],
    partCategory: 'electron',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 6, 12],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Bohr Atomic Model. Atoms consist of a central nucleus orbited by quantized electron shells.',
    action: 'orbit',
  },
  {
    timeInSeconds: 4,
    cameraPosition: [0, 1.5, 3.5],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'nucleus',
    caption: 'At the center lies the dense nucleus composed of positive protons and neutral neutrons packed together.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 9,
    cameraPosition: [0, 4, 8],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'k_shell',
    caption: 'Electrons occupy discrete energy levels n=1, 2, 3... They cannot orbit at arbitrary distances between shells.',
    action: 'highlight',
  },
  {
    timeInSeconds: 14,
    cameraPosition: [0, 8, 12],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'valence_electrons',
    caption: 'The valence electrons in the outermost shell govern how this atom forms chemical bonds with other elements.',
    action: 'orbit',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-atom-1',
    question: 'Tap the central atomic nucleus containing protons and neutrons.',
    targetPartId: 'nucleus',
    hint: 'Look right in the center of all the orbiting rings.',
    successFeedback: 'Correct! The nucleus contains almost all of the atom’s mass in an extremely compact volume.',
  },
  {
    id: 'quiz-atom-2',
    question: 'Tap an electron in the outermost valence shell.',
    targetPartId: 'valence_electrons',
    hint: 'Find an electron on the outermost blue circular ring.',
    successFeedback: 'Spot on! Valence electrons dictate chemical reactivity and bond formation.',
  },
];

export const atomBohrScene: Scene3DDefinition = {
  id: 'atom_bohr_model',
  title: 'Bohr Atomic Model & Quantized Electron Shells',
  subject: 'physics',
  conceptIds: ['atomic_structure', 'bohr_model', 'electron_configuration'],
  description: 'Interactive 3D procedural Bohr atom demonstrating nucleus nucleons, quantized concentric electron shells (K, L, M, N), and element valence.',
  paramKeys: Object.keys(atomBohrParamsSchema.shape),
  paramsSchema: atomBohrParamsSchema,
  defaultParams: atomBohrParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateAtomBohrGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = atomBohrParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

