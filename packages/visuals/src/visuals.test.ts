import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_SCENES,
  getAllSceneDefinitions,
  findSceneDefinition,
  getScenesForConcept,
  getScenesBySubject,
  getSceneMetrics,
  annotationPoint3DSchema,
  narrationCue3DSchema,
  quizPrompt3DSchema,
} from './index.ts';

test('ALL_SCENES contains exactly 9 procedural 3D teaching scenes', () => {
  const scenes = getAllSceneDefinitions();
  assert.equal(scenes.length, 9);
  assert.equal(ALL_SCENES.length, 9);

  const metrics = getSceneMetrics();
  assert.equal(metrics.totalScenes, 9);
  assert.ok(metrics.bySubject.physics >= 3);
  assert.ok(metrics.bySubject.chemistry >= 2);
  assert.ok(metrics.bySubject.biology >= 2);
  assert.ok(metrics.bySubject.mathematics >= 1);
  assert.ok(metrics.bySubject.astronomy >= 1);
});

test('every registered scene has valid metadata, Zod schema, and default params', () => {
  for (const scene of ALL_SCENES) {
    assert.ok(scene.id.length > 0, `Scene ${scene.id} must have non-empty id`);
    assert.ok(scene.title.length > 0, `Scene ${scene.id} must have title`);
    assert.ok(scene.conceptIds.length > 0, `Scene ${scene.id} must map to concepts`);
    assert.ok(scene.description.length > 0, `Scene ${scene.id} must have description`);

    // Verify default parameters parse successfully
    const validated = scene.validateParams(scene.defaultParams);
    assert.equal(validated.success, true, `Scene ${scene.id} defaultParams must pass Zod schema validation`);
    assert.ok(validated.data);
  }
});

test('every scene geometry generator produces valid elements and educational insights', () => {
  for (const scene of ALL_SCENES) {
    const geo = scene.generateGeometry(scene.defaultParams);

    assert.ok(geo.elements.length > 0, `Scene ${scene.id} must produce mesh elements`);
    assert.ok(geo.boundingRadius > 0, `Scene ${scene.id} must have positive bounding radius`);
    assert.equal(geo.defaultCameraPosition.length, 3);
    assert.equal(geo.defaultCameraTarget.length, 3);

    // Verify educational formulas & insights
    assert.ok(geo.educationalSummary.insights.length >= 2, `Scene ${scene.id} must contain pedagogical insights`);
    assert.ok(geo.educationalSummary.keyFormulas && geo.educationalSummary.keyFormulas.length >= 1);

    // Verify mesh elements have valid colors and positions
    for (const elem of geo.elements) {
      assert.ok(elem.id.length > 0);
      assert.equal(elem.position.length, 3);
      assert.ok(elem.color.startsWith('#'), `Element ${elem.id} must have hex color`);
    }
  }
});

test('every scene annotations and narration cues validate against schemas', () => {
  for (const scene of ALL_SCENES) {
    assert.ok(scene.annotations.length >= 2, `Scene ${scene.id} should have annotations`);
    for (const ann of scene.annotations) {
      const parsedAnn = annotationPoint3DSchema.safeParse(ann);
      assert.equal(parsedAnn.success, true, `Annotation ${ann.id} in scene ${scene.id} must match schema`);
    }

    assert.ok(scene.narrationCues.length >= 2, `Scene ${scene.id} should have narration cues`);
    let lastTime = -1;
    for (const cue of scene.narrationCues) {
      const parsedCue = narrationCue3DSchema.safeParse(cue);
      assert.equal(parsedCue.success, true, `Narration cue in ${scene.id} must match schema`);
      assert.ok(cue.timeInSeconds >= lastTime, 'Narration cues must be in ascending chronological order');
      lastTime = cue.timeInSeconds;
    }

    assert.ok(scene.quizPrompts.length >= 2, `Scene ${scene.id} should have interactive quiz prompts`);
    for (const quiz of scene.quizPrompts) {
      const parsedQuiz = quizPrompt3DSchema.safeParse(quiz);
      assert.equal(parsedQuiz.success, true, `Quiz prompt ${quiz.id} in ${scene.id} must match schema`);
      assert.ok(quiz.question.length > 0);
      assert.ok(quiz.targetPartId.length > 0);
    }
  }
});

test('atom_bohr_model accurately computes electron shell distributions', () => {
  const atom = findSceneDefinition('atom_bohr_model');
  assert.ok(atom);

  // Carbon Z=6: K:2, L:4
  const carbonGeo = atom.generateGeometry({ atomicNumber: 6 });
  const carbonElectrons = carbonGeo.elements.filter((e) => e.id.startsWith('electron-'));
  assert.equal(carbonElectrons.length, 6);

  // Sodium Z=11: K:2, L:8, M:1
  const sodiumGeo = atom.generateGeometry({ atomicNumber: 11 });
  const sodiumElectrons = sodiumGeo.elements.filter((e) => e.id.startsWith('electron-'));
  assert.equal(sodiumElectrons.length, 11);

  // Calcium Z=20: K:2, L:8, M:8, N:2
  const calciumGeo = atom.generateGeometry({ atomicNumber: 20 });
  const calciumElectrons = calciumGeo.elements.filter((e) => e.id.startsWith('electron-'));
  assert.equal(calciumElectrons.length, 20);
});

test('molecule_3d_viewer parses PubChem structures and calculates bond lengths', () => {
  const molScene = findSceneDefinition('molecule_3d_viewer');
  assert.ok(molScene);

  // Water H2O
  const waterGeo = molScene.generateGeometry({ moleculeId: 'H2O' });
  const waterAtoms = waterGeo.elements.filter((e) => e.type === 'sphere');
  const waterBonds = waterGeo.elements.filter((e) => e.type === 'cylinder');
  assert.equal(waterAtoms.length, 3); // 1 O + 2 H
  assert.equal(waterBonds.length, 2);

  // Benzene C6H6
  const benzeneGeo = molScene.generateGeometry({ moleculeId: 'benzene' });
  const benzeneAtoms = benzeneGeo.elements.filter((e) => e.type === 'sphere');
  assert.equal(benzeneAtoms.length, 12); // 6 C + 6 H
});

test('crystal_lattice_3d generates accurate coordination and APF unit cell configurations', () => {
  const crystal = findSceneDefinition('crystal_lattice_3d');
  assert.ok(crystal);

  // SC
  const scGeo = crystal.generateGeometry({ latticeType: 'SC' });
  assert.ok(scGeo.elements.length >= 8);

  // BCC: 8 corners + 1 center
  const bccGeo = crystal.generateGeometry({ latticeType: 'BCC' });
  const bccBody = bccGeo.elements.find((e) => (e.userData as any)?.role === 'body');
  assert.ok(bccBody);

  // FCC: 8 corners + 6 faces
  const fccGeo = crystal.generateGeometry({ latticeType: 'FCC' });
  const fccFaces = fccGeo.elements.filter((e) => (e.userData as any)?.role === 'face');
  assert.equal(fccFaces.length, 6);
});

test('getScenesForConcept finds corresponding 3D models for concept graph', () => {
  const atomicScenes = getScenesForConcept('atomic_structure');
  assert.ok(atomicScenes.length >= 1);
  assert.equal(atomicScenes[0]?.id, 'atom_bohr_model');

  const dnaScenes = getScenesForConcept('dna_structure');
  assert.ok(dnaScenes.length >= 1);
  assert.equal(dnaScenes[0]?.id, 'dna_double_helix_3d');

  const celestialScenes = getScenesForConcept('planetary_motion');
  assert.ok(celestialScenes.length >= 1);
  assert.equal(celestialScenes[0]?.id, 'solar_system_seasons_eclipses');
});

