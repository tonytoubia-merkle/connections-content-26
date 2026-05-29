import test from 'node:test';
import assert from 'node:assert/strict';
import { decideKeyAction } from './bridge.js';

const mid   = { index: 1, total: 3, complete: false, atStart: false };
const done  = { index: 3, total: 3, complete: true,  atStart: false };
const start = { index: 0, total: 3, complete: false, atStart: true  };

test('off a demo slide, always defer to reveal', () => {
  assert.equal(decideKeyAction({ key: 'ArrowRight', onDemoSlide: false, sceneState: mid }), 'reveal');
  assert.equal(decideKeyAction({ key: 'ArrowLeft',  onDemoSlide: false, sceneState: mid }), 'reveal');
});

test('forward keys advance the scene until complete, then defer to reveal', () => {
  for (const key of ['ArrowRight', 'PageDown', ' ']) {
    assert.equal(decideKeyAction({ key, onDemoSlide: true, sceneState: mid }),  'advance');
    assert.equal(decideKeyAction({ key, onDemoSlide: true, sceneState: done }), 'reveal');
  }
});

test('back keys rewind the scene until atStart, then defer to reveal', () => {
  for (const key of ['ArrowLeft', 'PageUp']) {
    assert.equal(decideKeyAction({ key, onDemoSlide: true, sceneState: mid }),   'rewind');
    assert.equal(decideKeyAction({ key, onDemoSlide: true, sceneState: start }), 'reveal');
  }
});

test('unknown scene state (iframe not yet reported): drive the scene, do not skip it', () => {
  assert.equal(decideKeyAction({ key: 'ArrowRight', onDemoSlide: true, sceneState: null }), 'advance');
  assert.equal(decideKeyAction({ key: 'ArrowLeft',  onDemoSlide: true, sceneState: null }), 'rewind');
});

test('non-navigation keys defer to reveal', () => {
  assert.equal(decideKeyAction({ key: 'Escape', onDemoSlide: true, sceneState: mid }), 'reveal');
});
