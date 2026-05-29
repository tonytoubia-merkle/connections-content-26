import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenePlayer } from './player.js';

test('starts at index 0, not complete when total > 0', () => {
  const p = createScenePlayer({ total: 3 });
  assert.deepEqual(p.state(), { index: 0, total: 3, complete: false, atStart: true });
});

test('advance increments until total, then returns false', () => {
  const p = createScenePlayer({ total: 2 });
  assert.equal(p.advance(), true);            // 0 -> 1
  assert.equal(p.advance(), true);            // 1 -> 2
  assert.equal(p.state().complete, true);
  assert.equal(p.advance(), false);           // stays at 2
  assert.equal(p.state().index, 2);
});

test('rewind decrements until 0, then returns false', () => {
  const p = createScenePlayer({ total: 2 });
  p.advance(); p.advance();
  assert.equal(p.rewind(), true);             // 2 -> 1
  assert.equal(p.rewind(), true);             // 1 -> 0
  assert.equal(p.rewind(), false);            // stays at 0
  assert.equal(p.state().atStart, true);
});

test('onChange fires with index/total/direction', () => {
  const events = [];
  const p = createScenePlayer({ total: 1, onChange: (e) => events.push(e) });
  p.advance();
  p.reset();
  assert.equal(events[0].direction, 'forward');
  assert.equal(events[0].index, 1);
  assert.equal(events[1].direction, 'reset');
  assert.equal(events[1].index, 0);
});

test('throws on invalid total', () => {
  assert.throws(() => createScenePlayer({ total: -1 }));
  assert.throws(() => createScenePlayer({ total: 1.5 }));
});
