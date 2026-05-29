# In-slide demo harness

Scenes are pages embedded in deck slides via `<iframe class="demo-frame">` inside a
`.demo-window` browser-chrome wrapper. Each scene page calls `startSceneRuntime({ total, renderBeat })`.

## Contract
- The deck bridge (`bridge.js`) intercepts arrow keys on demo slides and posts
  `{ target: 'demo-scene', type: 'demo:advance'|'demo:rewind'|'demo:reset' }` to the iframe.
- The scene posts back `{ source: 'demo-scene', type: 'demo:state', index, total, complete, atStart }`
  on every change and once on load.
- index 0 = initial state; index === total = complete. When complete, the next forward key
  advances the slide; when atStart, the next back key leaves to the previous slide.

## Adding a scene
1. Create `demo/<scene>/index.html`.
2. `import { startSceneRuntime } from '../scene-runtime.js'` and implement `renderBeat(index, direction)`.
3. Add a deck `<section>` with a `.demo-window` + `<iframe class="demo-frame" src="demo/<scene>/index.html">`.

## Tests
Run `node --test "demo/*.test.js"` for the pure logic modules (player, runtime dispatch, bridge decision).
(Note: the bare `node --test demo/` form does not work on Node v24 — use the glob form above.)
