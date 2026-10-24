import { z } from 'zod';
import type { Scene3DDefinition, SceneGeometryData, ProceduralMeshElement, AnnotationPoint3D, NarrationCue3D, QuizPrompt3D, Point3D } from '../types.ts';

export const solarSystemParamsSchema = z.object({
  currentSeason: z.enum(['free_orbit', 'june_solstice', 'december_solstice', 'march_equinox', 'september_equinox']).default('june_solstice'),
  axialTiltDeg: z.number().min(0).max(45).default(23.5),
  orbitSpeed: z.number().min(0).max(3).default(1),
  showOrbitRings: z.boolean().default(true),
  showLightRays: z.boolean().default(true),
  eclipseMode: z.enum(['none', 'solar_eclipse', 'lunar_eclipse']).default('none'),
});

export type SolarSystemParams = z.infer<typeof solarSystemParamsSchema>;

export function generateSolarSystemGeometry(rawParams: Record<string, unknown> = {}): SceneGeometryData {
  const params = solarSystemParamsSchema.parse(rawParams);
  const elements: ProceduralMeshElement[] = [];

  const sunRadius = 1.4;
  const earthOrbitRadius = 8.0;
  const earthRadius = 0.65;
  const moonOrbitRadius = 1.8;
  const moonRadius = 0.22;

  // 1. Central Sun
  elements.push({
    id: 'sun',
    name: 'The Sun (G-type Main-Sequence Star)',
    type: 'sphere',
    position: [0, 0, 0],
    radius: sunRadius,
    color: '#fbbf24', // amber-400
    emissive: '#f59e0b',
    roughness: 0.1,
    metalness: 0.0,
    userData: {
      type: 'star',
      surfaceTemp: '5778 K',
      mass: '1.989 × 10³⁰ kg',
    },
  });

  // Sun Corona Glow Ring
  elements.push({
    id: 'sun-corona',
    name: 'Solar Corona',
    type: 'ring',
    position: [0, 0, 0],
    rotation: [Math.PI / 2, 0, 0],
    radius: sunRadius * 1.5,
    color: '#fef08a',
    opacity: 0.35,
    wireframe: true,
  });

  // 2. Earth Orbital Path Ring
  if (params.showOrbitRings) {
    elements.push({
      id: 'earth-orbit-ring',
      name: 'Earth Ecliptic Orbit (1 AU)',
      type: 'ring',
      position: [0, 0, 0],
      rotation: [Math.PI / 2, 0, 0],
      radius: earthOrbitRadius,
      color: '#38bdf8',
      opacity: 0.4,
      wireframe: true,
    });
  }

  // Determine Earth position according to season
  let earthAngle = 0; // June solstice: x = +R, Northern hemisphere tilted toward Sun
  if (params.currentSeason === 'december_solstice') {
    earthAngle = Math.PI; // x = -R, Northern tilted away
  } else if (params.currentSeason === 'march_equinox') {
    earthAngle = Math.PI / 2; // z = +R, both hemispheres get equal sunlight
  } else if (params.currentSeason === 'september_equinox') {
    earthAngle = (3 * Math.PI) / 2; // z = -R
  }

  if (params.eclipseMode === 'solar_eclipse') {
    earthAngle = 0;
  } else if (params.eclipseMode === 'lunar_eclipse') {
    earthAngle = 0;
  }

  const earthX = earthOrbitRadius * Math.cos(earthAngle);
  const earthZ = earthOrbitRadius * Math.sin(earthAngle);
  const earthPos: Point3D = [earthX, 0, earthZ];

  const tiltRad = (params.axialTiltDeg * Math.PI) / 180;

  // 3. Earth Globe
  elements.push({
    id: 'earth',
    name: 'Planet Earth',
    type: 'sphere',
    position: earthPos,
    rotation: [0, 0, tiltRad], // Axial tilt
    radius: earthRadius,
    color: '#0284c7', // sky-600 ocean
    roughness: 0.5,
    metalness: 0.1,
    userData: {
      axialTilt: `${params.axialTiltDeg}°`,
      season: params.currentSeason,
      orbitalPeriod: '365.25 days',
    },
  });

  // Earth Rotation Axis Pin
  elements.push({
    id: 'earth-axis',
    name: `Earth Rotational Axis (${params.axialTiltDeg}° Tilt)`,
    type: 'cylinder',
    position: earthPos,
    rotation: [0, 0, tiltRad],
    radius: 0.04,
    height: earthRadius * 3.2,
    color: '#f43f5e', // rose-500
    emissive: '#e11d48',
  });

  // Earth Equator Ring
  elements.push({
    id: 'earth-equator',
    name: 'Earth Equator (0° Latitude)',
    type: 'ring',
    position: earthPos,
    rotation: [Math.PI / 2, 0, tiltRad],
    radius: earthRadius * 1.05,
    color: '#e2e8f0',
    opacity: 0.8,
    wireframe: true,
  });

  // 4. Moon and Orbit
  let moonAngle = Math.PI / 3;
  if (params.eclipseMode === 'solar_eclipse') {
    // Moon exactly between Earth and Sun (towards origin)
    moonAngle = Math.PI; // Points toward (0,0,0) from Earth
  } else if (params.eclipseMode === 'lunar_eclipse') {
    // Moon exactly in Earth's shadow (away from Sun)
    moonAngle = 0; // Points away from (0,0,0)
  }

  const moonX = earthPos[0] - moonOrbitRadius * Math.cos(earthAngle) * (params.eclipseMode === 'solar_eclipse' ? 1 : Math.cos(moonAngle));
  const moonZ = earthPos[2] - moonOrbitRadius * Math.sin(earthAngle) * (params.eclipseMode === 'solar_eclipse' ? 1 : Math.sin(moonAngle));
  const moonPos: Point3D = [moonX, 0.2, moonZ];

  // Moon Orbit Ring
  if (params.showOrbitRings) {
    elements.push({
      id: 'moon-orbit-ring',
      name: 'Lunar Orbit around Earth',
      type: 'ring',
      position: earthPos,
      rotation: [Math.PI / 2, 0, 0.09], // ~5° inclination
      radius: moonOrbitRadius,
      color: '#cbd5e1',
      opacity: 0.5,
      wireframe: true,
    });
  }

  // Moon Globe
  elements.push({
    id: 'moon',
    name: 'The Moon (Natural Satellite)',
    type: 'sphere',
    position: moonPos,
    radius: moonRadius,
    color: '#94a3b8', // slate-400
    roughness: 0.8,
    metalness: 0.0,
    userData: {
      phase:
        params.eclipseMode === 'solar_eclipse'
          ? 'New Moon (Solar Eclipse Alignment)'
          : params.eclipseMode === 'lunar_eclipse'
            ? 'Full Moon (Lunar Eclipse Alignment)'
            : 'Crescent / Quarter Phase',
      orbitalPeriod: '27.3 days',
    },
  });

  // 5. Sunlight Rays
  if (params.showLightRays) {
    elements.push({
      id: 'sunlight-beam',
      name: 'Incoming Direct Solar Radiation',
      type: 'cylinder',
      position: [earthPos[0] / 2, 0, earthPos[2] / 2],
      rotation: [0, Math.atan2(earthPos[0], earthPos[2]), Math.PI / 2],
      radius: 0.06,
      height: earthOrbitRadius * 0.9,
      color: '#fde047',
      opacity: 0.45,
    });
  }

  return {
    elements,
    boundingRadius: earthOrbitRadius + 2.5,
    defaultCameraPosition: [earthPos[0] + 3.0, 4.0, earthPos[2] + 5.0],
    defaultCameraTarget: earthPos,
    suggestedMeasurementPoints: [
      { id: 'sun-pt', name: 'Sun Center', position: [0, 0, 0] },
      { id: 'earth-pt', name: 'Earth Center', position: earthPos },
      { id: 'moon-pt', name: 'Moon Center', position: moonPos },
    ],
    educationalSummary: {
      keyFormulas: [
        '\\text{Earth Axial Tilt } = 23.44^\\circ',
        '\\text{Orbital Period } T = 1 \\text{ year } (365.24 \\text{ days})',
        '\\text{Solar Constant } S_0 \\approx 1361 \\text{ W/m}^2',
      ],
      constants: {
        'Axial Obliquity': '23.44° to ecliptic normal',
        '1 Astronomical Unit (AU)': '1.496 × 10⁸ km',
        'Moon Orbit Inclination': '5.14° to ecliptic',
      },
      insights: [
        `Seasons are caused by Earth's ${params.axialTiltDeg}° axial tilt, NOT distance from the Sun.`,
        'During the June Solstice, the Northern Hemisphere is tilted toward the Sun receiving higher solar irradiance and longer daylight.',
        params.eclipseMode === 'solar_eclipse'
          ? 'Solar Eclipse occurs when the Moon directly obstructs the Sun casting an umbral shadow on Earth.'
          : params.eclipseMode === 'lunar_eclipse'
            ? 'Lunar Eclipse occurs when the Earth passes directly between the Sun and Moon, casting Earth’s shadow onto the Moon.'
            : 'Lunar phases cycle every 29.5 synodic days as the illuminated half of the Moon is viewed from varying angles.',
      ],
    },
  };
}

const annotations: AnnotationPoint3D[] = [
  {
    id: 'sun_core',
    title: 'The Sun (Solar Radiation Source)',
    description: 'Nuclear fusion source emitting isotropic light rays providing the thermal energy that powers Earth’s climate and seasons.',
    position: [0, 0, 0],
    partCategory: 'star',
  },
  {
    id: 'earth_axial_tilt',
    title: 'Earth Axial Tilt (23.5°)',
    description: 'Earth’s rotational axis remains fixed in space (pointing toward Polaris). As Earth orbits the Sun, varying hemispheres tilt toward or away from direct sunlight.',
    position: [8.0, 0, 0],
    partCategory: 'planet',
  },
  {
    id: 'moon_position',
    title: 'The Moon (Phases & Eclipse)',
    description: 'Natural satellite orbiting Earth. When aligned along the Sun-Earth node line, it produces total or annular solar eclipses.',
    position: [6.2, 0, 0],
    partCategory: 'moon',
  },
];

const narrationCues: NarrationCue3D[] = [
  {
    timeInSeconds: 0,
    cameraPosition: [0, 16, 22],
    cameraTarget: [0, 0, 0],
    caption: 'Welcome to the 3D Celestial Mechanics Simulator. Explore how Earth’s axial tilt produces seasons and how orbital alignments cause eclipses.',
    action: 'orbit',
  },
  {
    timeInSeconds: 5,
    cameraPosition: [8, 3, 4],
    cameraTarget: [8, 0, 0],
    highlightPartId: 'earth_axial_tilt',
    caption: 'Notice Earth’s 23.5° axial tilt. It does not wobble month-to-month; it stays pointing in the same direction in space.',
    action: 'zoom_in',
  },
  {
    timeInSeconds: 10,
    cameraPosition: [7, 2, 2],
    cameraTarget: [8, 0, 0],
    highlightPartId: 'moon_position',
    caption: 'Watch the Moon’s orbit. When the Moon passes directly between the Earth and the Sun, a solar eclipse casts an umbral shadow across Earth.',
    action: 'highlight',
  },
];

const quizPrompts: QuizPrompt3D[] = [
  {
    id: 'quiz-solar-1',
    question: 'Tap Earth’s tilted rotational axis.',
    targetPartId: 'earth_axial_tilt',
    hint: 'Look for the red pin passing straight through the poles of Earth.',
    successFeedback: 'Spot on! This 23.5° tilt is the fundamental cause of summer, winter, and daylight variation across the globe.',
  },
  {
    id: 'quiz-solar-2',
    question: 'Tap the Moon in its orbit around Earth.',
    targetPartId: 'moon_position',
    hint: 'Look for the smaller gray sphere near planet Earth.',
    successFeedback: 'Correct! The Moon orbits Earth once every 27.3 days, reflecting sunlight to produce changing phases.',
  },
];

export const solarSystemScene: Scene3DDefinition = {
  id: 'solar_system_seasons_eclipses',
  title: 'Solar System, Earth Seasons & Moon Eclipses',
  subject: 'astronomy',
  conceptIds: ['gravitation', 'planetary_motion', 'earth_seasons', 'lunar_phases', 'eclipses'],
  description: 'Interactive 3D procedural celestial simulator displaying the Sun, Earth with realistic 23.5° axial tilt, seasonal solstices/equinoxes, and Moon phase eclipse alignments.',
  paramKeys: Object.keys(solarSystemParamsSchema.shape),
  paramsSchema: solarSystemParamsSchema,
  defaultParams: solarSystemParamsSchema.parse({}),
  annotations,
  narrationCues,
  quizPrompts,
  generateGeometry: generateSolarSystemGeometry,
  validateParams: (params: Record<string, unknown>) => {
    const res = solarSystemParamsSchema.safeParse(params);
    return res.success ? { success: true, data: res.data } : { success: false, error: res.error.message };
  },
};

