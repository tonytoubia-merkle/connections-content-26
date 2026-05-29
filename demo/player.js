/**
 * Deterministic scene step-player. Tracks a beat index in [0, total].
 * index 0 = initial state (before any beat); index === total = scene complete.
 * Pure logic — no DOM, no timers, no network. Safe to unit-test under node.
 */
export function createScenePlayer({ total, onChange } = {}) {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error('createScenePlayer: total must be a non-negative integer');
  }
  let index = 0;
  const state = () => ({
    index,
    total,
    complete: index >= total,
    atStart: index === 0,
  });
  const emit = (direction) => { if (onChange) onChange({ ...state(), direction }); };
  return {
    advance() { if (index >= total) return false; index += 1; emit('forward'); return true; },
    rewind()  { if (index <= 0) return false; index -= 1; emit('back'); return true; },
    reset()   { index = 0; emit('reset'); },
    state,
  };
}
