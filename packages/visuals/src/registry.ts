import type { Scene3DDefinition } from './types.ts';
import { atomBohrScene } from './scenes/atom-bohr.ts';
import { moleculeViewerScene } from './scenes/molecule-viewer.ts';
import { solarSystemScene } from './scenes/solar-system-seasons.ts';
import { waveInterferenceScene } from './scenes/wave-interference.ts';
import { geometrySolidsScene } from './scenes/geometry-solids.ts';
import { vectorsProjectileScene } from './scenes/vectors-projectile.ts';
import { dnaDoubleHelixScene } from './scenes/dna-double-helix.ts';
import { crystalLatticeScene } from './scenes/crystal-lattice.ts';
import { cellBiologyScene } from './scenes/cell-biology.ts';

export const SCENE_REGISTRY: Record<string, Scene3DDefinition> = {
  [atomBohrScene.id]: atomBohrScene,
  [moleculeViewerScene.id]: moleculeViewerScene,
  [solarSystemScene.id]: solarSystemScene,
  [waveInterferenceScene.id]: waveInterferenceScene,
  [geometrySolidsScene.id]: geometrySolidsScene,
  [vectorsProjectileScene.id]: vectorsProjectileScene,
  [dnaDoubleHelixScene.id]: dnaDoubleHelixScene,
  [crystalLatticeScene.id]: crystalLatticeScene,
  [cellBiologyScene.id]: cellBiologyScene,
};

export const ALL_SCENES: Scene3DDefinition[] = Object.values(SCENE_REGISTRY);

export function getAllSceneDefinitions(): Scene3DDefinition[] {
  return ALL_SCENES;
}

export function findSceneDefinition(id: string): Scene3DDefinition | undefined {
  return SCENE_REGISTRY[id];
}

export function getScenesForConcept(conceptId: string): Scene3DDefinition[] {
  return ALL_SCENES.filter((s) => s.conceptIds.includes(conceptId));
}

export function getScenesBySubject(subject: string): Scene3DDefinition[] {
  return ALL_SCENES.filter((s) => s.subject === subject);
}

export function getSceneMetrics(): {
  totalScenes: number;
  bySubject: Record<string, number>;
  sceneIds: string[];
} {
  const bySubject: Record<string, number> = {};
  for (const s of ALL_SCENES) {
    bySubject[s.subject] = (bySubject[s.subject] ?? 0) + 1;
  }
  return {
    totalScenes: ALL_SCENES.length,
    bySubject,
    sceneIds: ALL_SCENES.map((s) => s.id),
  };
}

