import { createScenePlayer } from './player.js';

/** Pure dispatch: apply a parent message to the player. Returns true if handled. */
export function handleSceneMessage(player, data) {
  if (!data || data.target !== 'demo-scene') return false;
  switch (data.type) {
    case 'demo:advance': player.advance(); return true;
    case 'demo:rewind':  player.rewind();  return true;
    case 'demo:reset':   player.reset();   return true;
    default: return false;
  }
}

/**
 * Wire a scene page to the parent deck. Browser-only.
 * @param {object} opts
 * @param {number} opts.total       number of beats
 * @param {(index:number, direction:string) => void} opts.renderBeat  paints the DOM for a beat
 */
export function startSceneRuntime({ total, renderBeat }) {
  const post = (msg) => parent.postMessage({ source: 'demo-scene', ...msg }, '*');
  const player = createScenePlayer({
    total,
    onChange: (st) => {
      renderBeat(st.index, st.direction);
      post({ type: 'demo:state', index: st.index, total: st.total, complete: st.complete, atStart: st.atStart });
    },
  });
  // Only accept commands from our direct parent (the deck).
  window.addEventListener('message', (e) => {
    if (e.source !== parent) return;
    handleSceneMessage(player, e.data);
  });
  // Paint initial state and announce it so the bridge learns `total` immediately.
  const st = player.state();
  renderBeat(st.index, 'reset');
  post({ type: 'demo:state', index: st.index, total: st.total, complete: st.complete, atStart: st.atStart });
  return player;
}
