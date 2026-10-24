import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const vectorsProjectileParamsSchema = z.object({
  launchSpeed: z.number().min(5).max(30).default(18),
  pitchAngleDeg: z.number().min(5).max(85).default(45),
  yawAngleDeg: z.number().min(-60).max(60).default(20),
  gravity: z.number().min(1).max(25).default(9.8),
  airDrag: z.number().min(0).max(0.15).default(0.02),
  showComponentVectors: z.boolean().default(true),
  showTrajectoryTrail: z.boolean().default(true),
});

export type VectorsProjectileParams = z.infer<typeof vectorsProjectileParamsSchema>;

export function generateVectorsProjectileGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = vectorsProjectileParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const v0 = params.launchSpeed;
  const pitchRad = (params.pitchAngleDeg * Math.PI) / 180;
  const yawRad = (params.yawAngleDeg * Math.PI) / 180;
  const g = params.gravity;
  const kDrag = params.airDrag;

  // Initial velocity components
  const v0y = v0 * Math.sin(pitchRad);
  const v0Horiz = v0 * Math.cos(pitchRad);
  const v0x = v0Horiz * Math.cos(yawRad);
  const v0z = v0Horiz * Math.sin(yawRad);

  // Ideal physics quantities without drag
  const tFlightIdeal = (2 * v0y) / g;
  const hMaxIdeal = (v0y ** 2) / (2 * g);
  const rangeIdeal = v0Horiz * tFlightIdeal;

  // 1. Ground Plane Grid Reference
  elements.push({
    id: 'ground-plane',
    name: 'Horizontal Reference Ground (Y = 0)',
    type: 'box',
    position: [rangeIdeal / 2, -0.05, 0],
    scale: [Math.max(15, rangeIdeal + 6), 0.05, 12],
    color: '#334155', // slate-700
    roughness: 0.8,
  });

  // Launch Origin Marker
  elements.push({
    id: 'launch-pad',
    name: 'Launch Cannon Origin (0,0,0)',
    type: 'cylinder',
    position: [0, 0.1, 0],
    radius: 0.4,
    height: 0.2,
    color: '#e11d48', // rose-600
  });

  // 2. Trajectory Points (Numerical Runge-Kutta / Euler integration with quadratic air drag)
  const dt = 0.04;
  let px = 0;
  let py = 0;
  let pz = 0;
  let vx = v0x;
  let vy = v0y;
  let vz = v0z;
  let time = 0;

  const trajectoryPoints: Point3D[] = [];
  let apexPoint: Point3D = [0, 0, 0];
  let maxAltitude = -1;

  while (py >= 0 && time < 10) {
    trajectoryPoints.push([px, py, pz]);
    if (py > maxAltitude) {
      maxAltitude = py;
      apexPoint = [px, py, pz];
    }

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const ax = -kDrag * speed * vx;
    const ay = -g - kDrag * speed * vy;
    const az = -kDrag * speed * vz;

    px += vx * dt;
    py += vy * dt;
    pz += vz * dt;

    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;

    time += dt;
  }

  // Trajectory Bead Trail
  const stepInterval = Math.max(1, Math.floor(trajectoryPoints.length / 32));
  for (let i = 0; i < trajectoryPoints.length; i += stepInterval) {
    const pt = trajectoryPoints[i];
    if (!pt) continue;
    elements.push({
      id: `trail-bead-${i}`,
      name: `Trajectory Trail Pt (t = ${(i * dt).toFixed(2)}s)`,
      type: 'sphere',
      position: pt,
      radius: 0.12,
      color: '#38bdf8', // sky-400
      emissive: '#0284c7',
    });
  }

  // Apex (Maximum Height) Marker
  elements.push({
    id: 'apex-marker',
    name: `Trajectory Apex (H_max = ${maxAltitude.toFixed(2)} m)`,
    type: 'sphere',
    position: apexPoint,
    radius: 0.26,
    color: '#fbbf24', // amber-400
    emissive: '#d97706',
    userData: {
      maxHeight: `${maxAltitude.toFixed(2)} m`,
      vy: '0 m/s at apex',
    },
  });

  // Drop line from Apex to ground
  elements.push({
    id: 'apex-dropline',
    name: 'Apex Altitude Drop Line',
    type: 'cylinder',
    position: [apexPoint[0], apexPoint[1] / 2, apexPoint[2]],
    radius: 0.02,
    height: apexPoint[1],
    color: '#fef08a',
    opacity: 0.6,
  });

  // Impact Point Marker
  const landingPt = trajectoryPoints[trajectoryPoints.length - 1] ?? [rangeIdeal, 0, 0];
  elements.push({
    id: 'impact-target',
    name: `Landing Target (Range = ${Math.sqrt(landingPt[0] ** 2 + landingPt[2] ** 2).toFixed(2)} m)`,
    type: 'ring',
    position: [landingPt[0], 0.02, landingPt[2]],
    rotation: [Math.PI / 2, 0, 0],
    radius: 0.6,
    color: '#ef4444',
  });

  // 3. 3D Vector Decomposition Arrows at Origin
  if (params.showComponentVectors) {
    const scale = 0.2;

    // Resultant Velocity Vector (v0)
    elements.push({
      id: 'vector-v0',
      name: `Initial Velocity v₀ = ${v0.toFixed(1)} m/s`,
      type: 'cylinder',
      position: [v0x * scale * 0.5, v0y * scale * 0.5, v0z * scale * 0.5],
      rotation: [pitchRad, yawRad, 0],
      radius: 0.06,
      height: v0 * scale,
      color: '#10b981', // emerald-500
      emissive: '#059669',
    });

    // Horizontal Vx vector (X axis)
    elements.push({
      id: 'vector-vx',
      name: `Horizontal Component v_x = ${v0x.toFixed(1)} m/s`,
      type: 'cylinder',
      position: [v0x * scale * 0.5, 0.04, 0],
      rotation: [0, 0, Math.PI / 2],
      radius: 0.04,
      height: Math.abs(v0x) * scale,
      color: '#3b82f6', // blue-500
    });

    // Vertical Vy vector (Y axis)
    elements.push({
      id: 'vector-vy',
      name: `Vertical Component v_y = ${v0y.toFixed(1)} m/s`,
      type: 'cylinder',
      position: [0, v0y * scale * 0.5, 0],
      radius: 0.04,
      height: v0y * scale,
      color: '#f43f5e', // rose-500
    });
  }

  const maxDimension = Math.max(landingPt[0], maxAltitude) + 4;

  return {
    elements,
    boundingRadius: maxDimension,
    defaultCameraPosition: [landingPt[0] * 0.5, maxAltitude * 1.2, maxAltitude * 2.2],
    defaultCameraTarget: [landingPt[0] * 0.5, maxAltitude * 0.4, 0],
    suggestedMeasurementPoints: [
      { id: 'launch', name: 'Launch Origin (0,0,0)', position: [0, 0, 0] },
      { id: 'apex', name: 'Apex Peak', position: apexPoint },
      { id: 'impact', name: 'Landing Impact', position: landingPt },
    ],
    educationalSummary: {
      keyFormulas: [
        `v_x = v_0 \\cos\\theta \\cos\\phi = ${v0x.toFixed(2)} \\text{ m/s}`,
        `v_y = v_0 \\sin\\theta = ${v0y.toFixed(2)} \\text{ m/s}`,
        `H_{\\max} = \\frac{v_y^2}{2g} = ${hMaxIdeal.toFixed(2)} \\text{ m (ideal)}`,
        `R = \\frac{v_0^2 \\sin 2\\theta}{g} = ${rangeIdeal.toFixed(2)} \\text{ m (ideal)}`,
      ],
      constants: {
        'Launch Speed (v₀)': `${v0} m/s`,
        'Elevation Angle (θ)': `${params.pitchAngleDeg}°`,
        'Azimuth Heading (ϕ)': `${params.yawAngleDeg}°`,
        'Gravity (g)': `${g} m/s²`,
        'Observed Max Height': `${maxAltitude.toFixed(2)} m`,
      },
      insights: [
        'Horizontal and vertical motions are independent: gravity accelerates only the vertical component v_y.',
        'At the apex, vertical velocity v_y momentarily drops to 0, while horizontal velocity v_x continues unimpeded.',
        `45° launch angle maximizes horizontal range in vacuum; air resistance (${params.airDrag}) lowers the optimum angle to ~38-42°.`,
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'launch_velocity_vector',
    title: '3D Launch Vector (v₀)',
    description: 'Initial 3D velocity vector resolved into orthogonal components v_x (forward), v_y (vertical against gravity), and v_z (lateral).',
    position: [0.5, 0.5, 0],
    partCategory: 'vector',
  },
  {
    id: 'trajectory_apex',
    title: 'Trajectory Apex (H_max)',
    description: 'The highest point along the arc where upward kinetic energy is completely converted to gravitational potential energy (v_y = 0).',
    position: [6, 4, 1],
    partCategory: 'peak',
  },
  {
    id: 'landing_point',
    title: 'Impact Range (R)',
    description: 'Landing coordinate on the horizontal ground plane representing total projectile range.',
    position: [12, 0, 2],
    partCategory: 'landing',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [8, 8, 14],
    cameraTarget: [6, 2, 0],
    caption: 'Welcome to 3D Projectile Motion & Vectors. Watch how 3D initial velocity resolves into independent orthogonal components.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [1, 2, 4],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'launch_velocity_vector',
    caption: 'Look at the launch vector: the green arrow decomposes into blue horizontal v_x and pink vertical v_y vectors.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [6, 6, 8],
    cameraTarget: [6, 4, 0],
    highlightPartId: 'trajectory_apex',
    caption: 'At the apex, vertical velocity vanishes momentarily (v_y = 0), before gravity accelerates the projectile downward.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-proj-1',
    question: 'Tap the trajectory apex where vertical velocity v_y equals 0.',
    targetPartId: 'trajectory_apex',
    hint: 'Look for the golden sphere at the very top of the parabolic flight path.',
    successFeedback: 'Correct! At maximum height, vertical kinetic energy is zero and potential energy is at maximum.',
  },
  {
    id: 'quiz-proj-2',
    question: 'Tap the initial 3D velocity vector arrow at the launch pad.',
    targetPartId: 'launch_velocity_vector',
    hint: 'Find the green arrow originating from the red cannon base.',
    successFeedback: 'Spot on! The green vector dictates the initial direction and magnitude for the flight.',
  },
];

export const vectorsProjectileScene: Scene3DDefinition = {
  id: 'vectors_projectile_3d',
  title: '3D Vector Decomposition & Projectile Kinematics',
  subject: 'physics',
  conceptIds: ['kinematics', 'vectors_3d', 'projectile_motion', 'gravitation'],
  description: 'Interactive 3D procedural projectile trajectory with 3D vector decomposition (vx, vy, vz), air drag, apex marker, and range calculation.',
  paramKeys: Object.keys(vectorsProjectileParamsSchema.shape),
  paramsSchema: vectorsProjectileParamsSchema,
  defaultParams: vectorsProjectileParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateVectorsProjectileGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = vectorsProjectileParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

