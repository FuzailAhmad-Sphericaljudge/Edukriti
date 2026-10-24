import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const geometrySolidsParamsSchema = z.object({
  solidType: z.enum(['cube', 'cylinder', 'sphere', 'cone', 'pyramid', 'rectangular_prism']).default('cylinder'),
  dimensionA: z.number().min(1).max(5).default(2.5), // radius or side
  dimensionB: z.number().min(1).max(6).default(3.5), // height or second side
  crossSectionPlane: z.enum(['none', 'horizontal', 'vertical', 'diagonal']).default('horizontal'),
  sliceOffset: z.number().min(-2).max(2).default(0),
  explodedView: z.number().min(0).max(1).default(0),
});

export type GeometrySolidsParams = z.infer<typeof geometrySolidsParamsSchema>;

export function generateGeometrySolids(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = geometrySolidsParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const a = params.dimensionA;
  const h = params.dimensionB;
  const explode = params.explodedView * 1.5;

  let volume = 0;
  let surfaceArea = 0;
  let volumeFormula = '';
  let areaFormula = '';
  let crossSectionShape = 'None';

  if (params.solidType === 'cube') {
    volume = a ** 3;
    surfaceArea = 6 * a ** 2;
    volumeFormula = 'V = s^3';
    areaFormula = 'A = 6s^2';
    crossSectionShape = params.crossSectionPlane === 'horizontal' ? 'Square' : params.crossSectionPlane === 'diagonal' ? 'Rectangle or Hexagon' : 'Square';

    // 6 Faces with exploded view offset
    const faceOffsets: Array<{ name: string; pos: Point3D; scale: Point3D; color: string }> = [
      { name: 'Top Face (+Y)', pos: [0, (a / 2) + explode, 0], scale: [a, 0.04, a], color: '#38bdf8' },
      { name: 'Bottom Face (-Y)', pos: [0, -(a / 2) - explode, 0], scale: [a, 0.04, a], color: '#0284c7' },
      { name: 'Front Face (+Z)', pos: [0, 0, (a / 2) + explode], scale: [a, a, 0.04], color: '#60a5fa' },
      { name: 'Back Face (-Z)', pos: [0, 0, -(a / 2) - explode], scale: [a, a, 0.04], color: '#2563eb' },
      { name: 'Right Face (+X)', pos: [(a / 2) + explode, 0, 0], scale: [0.04, a, a], color: '#818cf8' },
      { name: 'Left Face (-X)', pos: [-(a / 2) - explode, 0, 0], scale: [0.04, a, a], color: '#4f46e5' },
    ];

    faceOffsets.forEach((face, idx) => {
      elements.push({
        id: `cube-face-${idx}`,
        name: face.name,
        type: 'box',
        position: face.pos,
        scale: face.scale,
        color: face.color,
        roughness: 0.3,
      });
    });
  } else if (params.solidType === 'cylinder') {
    volume = Math.PI * a * a * h;
    surfaceArea = 2 * Math.PI * a * (a + h);
    volumeFormula = 'V = \\pi r^2 h';
    areaFormula = 'A = 2\\pi r(r + h)';
    crossSectionShape = params.crossSectionPlane === 'horizontal' ? 'Circle (radius r)' : params.crossSectionPlane === 'vertical' ? 'Rectangle (2r × h)' : 'Ellipse';

    // Top Base Cap
    elements.push({
      id: 'cylinder-top-cap',
      name: 'Top Circular Base Cap (πr²)',
      type: 'cylinder',
      position: [0, (h / 2) + explode, 0],
      radius: a,
      height: 0.08,
      color: '#38bdf8',
    });

    // Lateral Surface Body
    elements.push({
      id: 'cylinder-lateral',
      name: 'Lateral Surface Area (2πrh)',
      type: 'cylinder',
      position: [0, 0, 0],
      radius: a,
      height: h,
      color: '#0284c7',
      opacity: 0.85,
      roughness: 0.3,
    });

    // Bottom Base Cap
    elements.push({
      id: 'cylinder-bottom-cap',
      name: 'Bottom Circular Base Cap (πr²)',
      type: 'cylinder',
      position: [0, -(h / 2) - explode, 0],
      radius: a,
      height: 0.08,
      color: '#0369a1',
    });
  } else if (params.solidType === 'sphere') {
    volume = (4 / 3) * Math.PI * (a ** 3);
    surfaceArea = 4 * Math.PI * (a ** 2);
    volumeFormula = 'V = \\frac{4}{3}\\pi r^3';
    areaFormula = 'A = 4\\pi r^2';
    crossSectionShape = 'Circle (radius ≤ r)';

    // Northern & Southern Hemispheres for exploded view
    elements.push({
      id: 'sphere-north',
      name: 'Northern Hemisphere',
      type: 'sphere',
      position: [0, explode, 0],
      radius: a,
      color: '#38bdf8',
      roughness: 0.25,
      metalness: 0.1,
    });

    if (explode > 0.05) {
      elements.push({
        id: 'sphere-equatorial-slice',
        name: 'Great Circle Equatorial Cross Section (πr²)',
        type: 'ring',
        position: [0, 0, 0],
        rotation: [Math.PI / 2, 0, 0],
        radius: a,
        color: '#fbbf24',
        wireframe: true,
      });
    }
  } else if (params.solidType === 'cone') {
    volume = (1 / 3) * Math.PI * a * a * h;
    const l = Math.sqrt(a * a + h * h);
    surfaceArea = Math.PI * a * (a + l);
    volumeFormula = 'V = \\frac{1}{3}\\pi r^2 h';
    areaFormula = 'A = \\pi r(r + l) \\quad (l = \\sqrt{r^2 + h^2})';
    crossSectionShape = params.crossSectionPlane === 'horizontal' ? 'Circle' : params.crossSectionPlane === 'vertical' ? 'Isosceles Triangle' : 'Parabola / Ellipse';

    elements.push({
      id: 'cone-body',
      name: 'Conical Taper Body',
      type: 'cone',
      position: [0, explode / 2, 0],
      radius: a,
      height: h,
      color: '#6366f1', // indigo-500
      roughness: 0.35,
    });

    elements.push({
      id: 'cone-base',
      name: 'Circular Base Cap (πr²)',
      type: 'cylinder',
      position: [0, -(h / 2) - explode, 0],
      radius: a,
      height: 0.08,
      color: '#4338ca',
    });
  } else if (params.solidType === 'pyramid') {
    volume = (1 / 3) * a * a * h;
    const slantH = Math.sqrt((a / 2) ** 2 + h ** 2);
    surfaceArea = a * a + 2 * a * slantH;
    volumeFormula = 'V = \\frac{1}{3}s^2 h';
    areaFormula = 'A = s^2 + 2s l';
    crossSectionShape = params.crossSectionPlane === 'horizontal' ? 'Square' : 'Triangle';

    elements.push({
      id: 'pyramid-body',
      name: 'Square Pyramid',
      type: 'cone',
      position: [0, 0, 0],
      radius: a * 0.7,
      height: h,
      radialSegments: 4,
      color: '#f59e0b', // amber-500
      roughness: 0.4,
    });
  } else {
    // Rectangular prism
    const b = a * 1.5;
    volume = a * b * h;
    surfaceArea = 2 * (a * b + b * h + a * h);
    volumeFormula = 'V = l \\cdot w \\cdot h';
    areaFormula = 'A = 2(lw + wh + lh)';
    crossSectionShape = 'Rectangle';

    elements.push({
      id: 'prism-body',
      name: 'Rectangular Prism',
      type: 'box',
      position: [0, 0, 0],
      scale: [a, h, b],
      color: '#0d9488', // teal-600
      roughness: 0.3,
    });
  }

  // Slicing Cross-Section Plane
  if (params.crossSectionPlane !== 'none') {
    const planeSize = Math.max(a, h) * 2.2;
    let planeRot: Point3D = [0, 0, 0];
    let planePos: Point3D = [0, params.sliceOffset, 0];

    if (params.crossSectionPlane === 'horizontal') {
      planeRot = [Math.PI / 2, 0, 0];
      planePos = [0, params.sliceOffset, 0];
    } else if (params.crossSectionPlane === 'vertical') {
      planeRot = [0, 0, 0];
      planePos = [0, 0, params.sliceOffset];
    } else {
      planeRot = [Math.PI / 4, 0, 0];
      planePos = [0, params.sliceOffset, 0];
    }

    elements.push({
      id: 'cross-section-plane',
      name: `Slicing Plane (Yields ${crossSectionShape})`,
      type: 'box',
      position: planePos,
      rotation: planeRot,
      scale: [planeSize, 0.02, planeSize],
      color: '#f43f5e', // rose-500
      opacity: 0.55,
      wireframe: false,
    });
  }

  const maxExtent = Math.max(a, h) + explode + 1.5;

  return {
    elements,
    boundingRadius: maxExtent,
    defaultCameraPosition: [maxExtent * 0.9, maxExtent * 0.8, maxExtent * 1.2],
    defaultCameraTarget: [0, 0, 0],
    suggestedMeasurementPoints: [
      { id: 'origin', name: 'Base Center', position: [0, -h / 2, 0] },
      { id: 'apex', name: 'Apex / Top Center', position: [0, h / 2, 0] },
      { id: 'radius-pt', name: 'Outer Perimeter Radius', position: [a, 0, 0] },
    ],
    educationalSummary: {
      keyFormulas: [
        `\\text{Volume: } ${volumeFormula} = ${volume.toFixed(2)} \\text{ units}^3`,
        `\\text{Surface Area: } ${areaFormula} = ${surfaceArea.toFixed(2)} \\text{ units}^2`,
        `\\text{Cross Section Shape: } \\text{${crossSectionShape}}`,
      ],
      constants: {
        'Dimension A': `${a.toFixed(2)} units`,
        'Dimension B (Height)': `${h.toFixed(2)} units`,
        'Calculated Volume': `${volume.toFixed(2)} units³`,
        'Total Surface Area': `${surfaceArea.toFixed(2)} units²`,
      },
      insights: [
        `Cross-section through a 3D solid produces 2D geometric cuts: slicing this ${params.solidType} produces a ${crossSectionShape}.`,
        'Exploded view reveals the net of 2D shapes required to fold the 3D surface area boundary.',
        `Volume measures total cubic packing capacity (${volume.toFixed(2)} u³).`,
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'base_cap',
    title: 'Solid Base',
    description: 'The foundation boundary polygon or circle providing the base area B in standard prism and cylinder formulas V = B · h.',
    position: [0, -1.5, 0],
    partCategory: 'base',
  },
  {
    id: 'lateral_surface',
    title: 'Lateral Surface Area',
    description: 'The curved or polygonal boundary faces connecting the bases. Unfolds into a 2D net rectangle or triangle sector.',
    position: [1.5, 0, 0],
    partCategory: 'lateral',
  },
  {
    id: 'slicing_plane',
    title: 'Cross-Section Plane',
    description: 'A 2D Euclidean cutting plane intersecting the solid. The intersection boundary demonstrates conic sections and geometric cuts.',
    position: [0, 0, 0],
    partCategory: 'cross_section',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [4, 4, 6],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to 3D Geometric Solids. Explore volume capacity, surface nets, and 2D cross-sectional slices.',
    action: 'orbit',
  },
  {
    timeInSeconds: 4,
    cameraPosition: [0, -2, 4],
    cameraTarget: [0, -1.5, 0],
    highlightPartId: 'base_cap',
    caption: 'Every prism and cylinder starts with a base area B. Multiplying base area by height h gives the total volume.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 9,
    cameraPosition: [3, 2, 4],
    cameraTarget: [0, 0, 0],
    highlightPartId: 'slicing_plane',
    caption: 'Notice how slicing the solid with a flat plane reveals 2D shapes: circles, ellipses, triangles, and polygons.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-geom-1',
    question: 'Tap the base of this 3D geometric solid.',
    targetPartId: 'base_cap',
    hint: 'Look for the circular or polygonal bottom cap.',
    successFeedback: 'Correct! The base area determines the cross-sectional foundation of the solid.',
  },
  {
    id: 'quiz-geom-2',
    question: 'Tap the slicing cross-section plane intersecting the solid.',
    targetPartId: 'slicing_plane',
    hint: 'Look for the semi-transparent red cutting sheet.',
    successFeedback: 'Spot on! Cross-sections link 3D objects to 2D geometry.',
  },
];

export const geometrySolidsScene: Scene3DDefinition = {
  id: 'geometry_solids_3d',
  title: '3D Geometry Solids, Cross-Sections & Volume',
  subject: 'mathematics',
  conceptIds: ['geometry_solids', 'cross_sections', 'volume_surface_area', 'conic_sections'],
  description: 'Interactive 3D procedural solids (cube, cylinder, sphere, cone, pyramid) with dynamic cross-section slicing planes, exploded views, and volume formulas.',
  paramKeys: Object.keys(geometrySolidsParamsSchema.shape),
  paramsSchema: geometrySolidsParamsSchema,
  defaultParams: geometrySolidsParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateGeometrySolids,
  validateParams: (params: Record<string, unknown>) => {
    const res = geometrySolidsParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

