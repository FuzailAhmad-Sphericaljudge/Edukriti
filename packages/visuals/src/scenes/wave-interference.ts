import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const waveInterferenceParamsSchema = z.object({
  wavelength: z.number().min(0.5).max(3.0).default(1.2),
  sourceSeparation: z.number().min(1.0).max(6.0).default(3.0),
  amplitude: z.number().min(0.2).max(1.5).default(0.8),
  phaseDifferenceDeg: z.number().min(0).max(180).default(0),
  timeStep: z.number().min(0).max(10).default(0),
  gridResolution: z.number().int().min(10).max(40).default(20),
});

export type WaveInterferenceParams = z.infer<typeof waveInterferenceParamsSchema>;

export function generateWaveInterferenceGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = waveInterferenceParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const d = params.sourceSeparation;
  const lambda = params.wavelength;
  const k = (2 * Math.PI) / lambda;
  const phaseOffset = (params.phaseDifferenceDeg * Math.PI) / 180;
  const omega = 2 * Math.PI * 1.0;
  const t = params.timeStep;

  // Source positions (on X axis)
  const s1Pos: Point3D = [-d / 2, 0, 0];
  const s2Pos: Point3D = [d / 2, 0, 0];

  // 1. Two Coherent Wave Source Emitters
  elements.push({
    id: 'source-1',
    name: 'Coherent Wave Source S₁',
    type: 'cylinder',
    position: s1Pos,
    radius: 0.25,
    height: 1.0,
    color: '#0284c7', // sky-600
    emissive: '#0369a1',
    userData: { source: 'S1', x: -d / 2, y: 0, z: 0 },
  });

  elements.push({
    id: 'source-2',
    name: 'Coherent Wave Source S₂',
    type: 'cylinder',
    position: s2Pos,
    radius: 0.25,
    height: 1.0,
    color: '#0284c7', // sky-600
    emissive: '#0369a1',
    userData: { source: 'S2', x: d / 2, y: 0, z: 0 },
  });

  // Source Separation Marker
  elements.push({
    id: 'source-baseline',
    name: `Source Separation Baseline (d = ${d.toFixed(1)} m)`,
    type: 'cylinder',
    position: [0, 0, 0],
    rotation: [0, 0, Math.PI / 2],
    radius: 0.04,
    height: d,
    color: '#94a3b8',
  });

  // 2. 3D Wave Surface Grid (Instanced discrete point columns representing 3D wave interference amplitude)
  const range = 6.0;
  const step = (range * 2) / params.gridResolution;

  let maxConstructivePoint: Point3D = [0, 0, 0];
  let maxDestructivePoint: Point3D = [0, 0, 0];
  let maxAmp = -1;
  let minAmp = 999;

  for (let x = -range; x <= range; x += step) {
    for (let z = -range; z <= range; z += step) {
      const r1 = Math.sqrt((x - s1Pos[0]) ** 2 + z ** 2);
      const r2 = Math.sqrt((x - s2Pos[0]) ** 2 + z ** 2);

      // Superposition equation: y(x,z) = A1 sin(k r1 - wt) + A2 sin(k r2 - wt + phi)
      const y1 = params.amplitude * Math.sin(k * r1 - omega * t);
      const y2 = params.amplitude * Math.sin(k * r2 - omega * t + phaseOffset);
      const totalY = y1 + y2;

      const pathDiff = Math.abs(r1 - r2);
      const constructive = Math.abs(totalY) > maxAmp;
      if (constructive) {
        maxAmp = Math.abs(totalY);
        maxConstructivePoint = [x, totalY, z];
      }

      if (Math.abs(totalY) < minAmp && r1 > 0.5 && r2 > 0.5) {
        minAmp = Math.abs(totalY);
        maxDestructivePoint = [x, totalY, z];
      }

      // Discrete height column representing water/sound/light amplitude field
      const isAntinode = Math.abs(totalY) > params.amplitude * 1.3;
      const isNode = Math.abs(totalY) < 0.15;

      const colColor = isAntinode
        ? totalY > 0
          ? '#38bdf8' // crest (cyan)
          : '#818cf8' // trough (indigo)
        : isNode
          ? '#475569' // nodal plane (slate)
          : '#64748b';

      elements.push({
        id: `wave-pt-${x.toFixed(1)}-${z.toFixed(1)}`,
        name: `Interference Point (Δr = ${pathDiff.toFixed(2)}λ)`,
        type: 'box',
        position: [x, totalY / 2, z],
        scale: [step * 0.85, Math.max(0.06, Math.abs(totalY)), step * 0.85],
        color: colColor,
        roughness: 0.4,
        userData: {
          x,
          z,
          amplitude: totalY.toFixed(2),
          r1: r1.toFixed(2),
          r2: r2.toFixed(2),
          pathDifference: pathDiff.toFixed(2),
        },
      });
    }
  }

  return {
    elements,
    boundingRadius: range + 2,
    defaultCameraPosition: [0, 8, 11],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 's1', name: 'Source 1', position: s1Pos },
      { id: 's2', name: 'Source 2', position: s2Pos },
      { id: 'antinode-max', name: 'Maximum Constructive Fringe', position: maxConstructivePoint },
      { id: 'node-min', name: 'Destructive Nodal Line', position: maxDestructivePoint },
    ],
    educationalSummary: {
      keyFormulas: [
        '\\text{Constructive Interference: } \\Delta r = |r_1 - r_2| = n\\lambda \\quad (n \\in \\mathbb{Z})',
        '\\text{Destructive Interference: } \\Delta r = \\left(n + \\frac{1}{2}\\right)\\lambda',
        '\\text{Fringe Spacing: } \\beta = \\frac{\\lambda D}{d}',
      ],
      constants: {
        'Wavelength (λ)': `${lambda.toFixed(2)} m`,
        'Source Separation (d)': `${d.toFixed(2)} m`,
        'Phase Offset (ϕ)': `${params.phaseDifferenceDeg}°`,
      },
      insights: [
        `Constructive interference occurs along central and hyperbolic antinodal axes where waves arrive in-phase.`,
        `Destructive interference occurs where waves arrive exactly 180° out-of-phase, completely canceling net amplitude.`,
        'Widening source separation (d) increases the density of interference fringes.',
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'source_s1',
    title: 'Wave Source S₁',
    description: 'First coherent emitter producing circular expanding sinusoidal wave fronts.',
    position: [-1.5, 0, 0],
    partCategory: 'source',
  },
  {
    id: 'source_s2',
    title: 'Wave Source S₂',
    description: 'Second coherent wave emitter producing identical frequency wave fronts.',
    position: [1.5, 0, 0],
    partCategory: 'source',
  },
  {
    id: 'central_antinode',
    title: 'Central Maxima (Antinodal Line)',
    description: 'Points equidistant from S₁ and S₂ (Δr = 0) where waves always arrive in-phase, reinforcing constructive crests and troughs.',
    position: [0, 1.2, 3],
    partCategory: 'fringe',
  },
  {
    id: 'nodal_line',
    title: 'Destructive Nodal Line',
    description: 'Locus of points where path difference Δr = λ/2. Waves arrive opposite in phase, creating zero net oscillation amplitude.',
    position: [1.8, 0, 3],
    partCategory: 'fringe',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 12, 14],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to 3D Wave Interference. Two coherent sources radiate sinusoidal waves that superimpose across the 2D surface.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [0, 4, 6],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'central_antinode',
    caption: 'Along the center, path difference is zero (Δr = 0). Crest meets crest, creating maximal constructive interference.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [3, 4, 5],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'nodal_line',
    caption: 'Notice the quiet dark troughs. Here, a crest from one source meets a trough from the other, canceling out all motion into a nodal line.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-wave-1',
    question: 'Tap the central antinodal line where maximum constructive reinforcement occurs.',
    targetPartId: 'central_antinode',
    hint: 'Look right along the center dividing line between the two sources.',
    successFeedback: 'Correct! At Δr = 0, waves arrive exactly in phase, producing peak constructive oscillation.',
  },
  {
    id: 'quiz-wave-2',
    question: 'Tap one of the coherent wave source emitters.',
    targetPartId: 'source_s1',
    hint: 'Find the blue cylinder on either the left or right origin baseline.',
    successFeedback: 'Spot on! Coherent sources maintain a constant phase relationship necessary for stable interference.',
  },
];

export const waveInterferenceScene: Scene3DDefinition = {
  id: 'wave_interference_3d',
  title: '3D Wave Superposition, Interference & Diffraction',
  subject: 'physics',
  conceptIds: ['wave_motion', 'superposition_principle', 'interference', 'diffraction'],
  description: 'Interactive 3D procedural wave simulator showing constructive antinodes, destructive nodal planes, and variable source separation/wavelength.',
  paramKeys: Object.keys(waveInterferenceParamsSchema.shape),
  paramsSchema: waveInterferenceParamsSchema,
  defaultParams: waveInterferenceParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateWaveInterferenceGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = waveInterferenceParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

