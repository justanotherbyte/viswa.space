import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import theatre from '@theatre/core';

const state = JSON.parse(readFileSync(new URL('../../data/ascent.theatre.json', import.meta.url), 'utf8'));

test('Theatre sequence reaches the authored poses and stays finite between them', async () => {
  const project = theatre.getProject('Ascent sequence test', { state });
  await project.ready;
  const sheet = project.sheet('Ascent');
  const object = sheet.object('Vehicle', { x: 2.6, y: .1, rotationZ: -.65, rotationY: .35, scale: 1.05, cameraZ: 16, flame: 0 });
  for (const [position, x, y, flame] of [[0, 2.6, .1, 0], [4, -2.4, .1, 0], [7, 0, -.5, 1], [10, 0, 12, 1]]) {
    sheet.sequence.position = position;
    assert.equal(object.value.x, x);
    assert.equal(object.value.y, y);
    assert.equal(object.value.flame, flame);
  }
  for (let position = 0; position <= 10; position += .125) {
    sheet.sequence.position = position;
    for (const value of Object.values(object.value)) assert.ok(Number.isFinite(value));
    assert.ok(object.value.cameraZ >= 14 && object.value.cameraZ <= 18);
    assert.ok(object.value.scale > 0);
    assert.ok(object.value.flame >= 0 && object.value.flame <= 1);
  }
  sheet.sequence.position = 2;
  assert.ok(object.value.x > -2.4 && object.value.x < 2.6);
  sheet.detachObject('Vehicle');
});
