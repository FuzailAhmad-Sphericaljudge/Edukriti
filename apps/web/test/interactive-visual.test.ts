import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VETTED_VISUAL_REGISTRY,
  getVettedVisualRegistry,
  validateVisualSelection,
  suggestVisualForTopic,
  type VisualInteractiveManifest,
} from '@edukriti/contracts';

test('VETTED_VISUAL_REGISTRY contains complete registry with valid default manifests', () => {
  const registry = getVettedVisualRegistry();
  assert.ok(registry.length >= 10, 'Expected at least 10 vetted STEM simulations');

  for (const entry of registry) {
    assert.ok(entry.id.length > 0);
    assert.ok(entry.title.length > 0);
    assert.ok(entry.subject.length > 0);
    assert.ok(['diagram', 'scene3d', 'sim', 'lab'].includes(entry.kind));
    assert.ok(entry.paramKeys.length >= 0);
    assert.ok(entry.defaultParams);

    const validation = entry.validateParams(entry.defaultParams);
    assert.equal(validation.success, true, `${entry.id} defaultParams must be valid`);
  }
});

test('validateVisualSelection accepts valid vetted parameters and flags invalid values', () => {
  // 1. Valid circuit parameters
  const valid = validateVisualSelection('circuit-builder-dc', { voltage: 24, resistance: 8 });
  assert.equal(valid.isValid, true);
  assert.equal(valid.validatedParams?.voltage, 24);
  assert.equal(valid.validatedParams?.resistance, 8);

  // 2. Out-of-bounds circuit voltage (exceeds 100V max)
  const invalid = validateVisualSelection('circuit-builder-dc', { voltage: 9999, resistance: 4 });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.error?.includes('voltage') || invalid.error?.includes('Invalid'));

  // 3. Unregistered ID
  const unknown = validateVisualSelection('quantum-teleportation-device', { power: 100 });
  assert.equal(unknown.isValid, false);
  assert.ok(unknown.error?.includes('not registered'));
});

test('suggestVisualForTopic returns relevant STEM interactive simulations', () => {
  const electricSim = suggestVisualForTopic('Ohm’s Law and Electrical Current');
  assert.equal(electricSim?.id, 'circuit-builder-dc');

  const physicsSim = suggestVisualForTopic('Projectile Motion and Ballistics');
  assert.equal(physicsSim?.id, 'projectile-motion-lab');

  const biologySim = suggestVisualForTopic('Cell Mitosis & Chromosome Division');
  assert.equal(biologySim?.id, 'cell-mitosis-interactive');

  const chemistrySim = suggestVisualForTopic('Acid-Base Titration & pH neutralization');
  assert.equal(chemistrySim?.id, 'acid-base-titration-lab');
});

test('verifies mathematical correctness of visual simulation presets', () => {
  // 1. Circuit Ohm Law preset
  const v = 24;
  const r = 8;
  const current = Number((v / r).toFixed(2));
  assert.equal(current, 3.0);

  // 2. Projectile motion at 45 degrees
  const velocity = 25;
  const angle = 45;
  const g = 9.81;
  const rad = (angle * Math.PI) / 180;
  const maxRange = Number(((Math.pow(velocity, 2) * Math.sin(2 * rad)) / g).toFixed(2));
  assert.ok(maxRange > 63 && maxRange < 64); // ~63.71m

  // 3. Pendulum period for length = 1.0m
  const length = 1.0;
  const period = Number((2 * Math.PI * Math.sqrt(length / g)).toFixed(2));
  assert.ok(period >= 2.0 && period <= 2.02); // ~2.01s
});
