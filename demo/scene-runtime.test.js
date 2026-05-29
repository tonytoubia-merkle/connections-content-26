import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenePlayer } from './player.js';
import { handleSceneMessage } from './scene-runtime.js';

function makePlayer() {
  const calls = [];
  const p = createScenePlayer({ total: 2, onChange: (e) => calls.push(e) });
  return { p, calls };
}

test('advance message advances the player', () => {
  const { p } = makePlayer();
  handleSceneMessage(p, { target: 'demo-scene', type: 'demo:advance' });
  assert.equal(p.state().index, 1);
});

test('rewind message rewinds the player', () => {
  const { p } = makePlayer();
  p.advance();
  handleSceneMessage(p, { target: 'demo-scene', type: 'demo:rewind' });
  assert.equal(p.state().index, 0);
});

test('reset message resets the player', () => {
  const { p } = makePlayer();
  p.advance(); p.advance();
  handleSceneMessage(p, { target: 'demo-scene', type: 'demo:reset' });
  assert.equal(p.state().index, 0);
});

test('ignores messages not targeted to demo-scene', () => {
  const { p } = makePlayer();
  handleSceneMessage(p, { type: 'demo:advance' });          // no target
  handleSceneMessage(p, { target: 'other', type: 'demo:advance' });
  assert.equal(p.state().index, 0);
});
