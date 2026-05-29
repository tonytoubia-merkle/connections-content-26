# Demo Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline-safe, in-slide scripted-demo foundation — vendor Reveal.js locally, add a reusable browser-chrome iframe frame, a deterministic step-player, and an arrow-key↔postMessage bridge — proven end-to-end in `cnx-2026-agentic-luxury.html` with one stub scene.

**Architecture:** A demo slide in the Reveal.js deck embeds an `<iframe class="demo-frame">` wrapped in browser chrome. The iframe page runs a generic **scene runtime** built on a pure **step-player** (index state machine). A deck-side **bridge** intercepts arrow keys in the capture phase while on a demo slide and forwards `demo:advance`/`demo:rewind` to the iframe; the iframe posts its state back so the bridge knows when the scene is complete and lets Reveal change slides. Everything is served from the deck's own origin — zero network at runtime.

**Tech Stack:** Static HTML/CSS/JS (ES modules), Reveal.js 5.1.0 (vendored), Node's built-in test runner (`node --test`) for the pure logic modules. No new runtime dependencies.

---

## File structure

| File | Responsibility |
|------|----------------|
| `vendor/reveal/reveal.css` | Vendored Reveal core CSS (was CDN) |
| `vendor/reveal/black.css` | Vendored Reveal theme (was CDN), font `@import`s stripped |
| `vendor/reveal/reveal.js` | Vendored Reveal core JS (was CDN) |
| `vendor/reveal/notes.js` | Vendored Reveal notes plugin (was CDN) |
| `demo/package.json` | Marks `demo/` as ESM so `node --test` treats `.js` as modules |
| `demo/player.js` | Pure step-player: index state machine (`advance`/`rewind`/`reset`/`state`) |
| `demo/player.test.js` | Unit tests for the player |
| `demo/scene-runtime.js` | Iframe-side: maps parent messages → player, renders beats, posts state back |
| `demo/scene-runtime.test.js` | Unit tests for the message→player dispatch |
| `demo/bridge.js` | Deck-side: `decideKeyAction` (pure) + DOM/Reveal wiring |
| `demo/bridge.test.js` | Unit tests for `decideKeyAction` |
| `demo/demo-chrome.css` | Browser-chrome + `.demo-frame` iframe styling (loaded by the deck) |
| `demo/stub/index.html` | Throwaway 3-beat stub scene proving the pipeline |
| `cnx-2026-agentic-luxury.html` | Deck: vendored asset paths, one demo slide, bridge wiring |

---

## Task 1: Vendor Reveal.js locally (remove all CDN dependencies)

**Files:**
- Create: `vendor/reveal/reveal.css`, `vendor/reveal/black.css`, `vendor/reveal/reveal.js`, `vendor/reveal/notes.js`
- Modify: `cnx-2026-agentic-luxury.html:9-10` and `:1018-1019`

- [ ] **Step 1: Download the four Reveal assets**

Run:
```bash
mkdir -p vendor/reveal
curl -fsSL https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css        -o vendor/reveal/reveal.css
curl -fsSL https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css   -o vendor/reveal/black.css
curl -fsSL https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js         -o vendor/reveal/reveal.js
curl -fsSL https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js  -o vendor/reveal/notes.js
```
Expected: four non-empty files in `vendor/reveal/`.

- [ ] **Step 2: Strip font `@import`s from the vendored theme**

The Reveal black theme `@import`s webfonts from a CDN; remove them so there are zero network calls (the deck defines its own font stack). Open `vendor/reveal/black.css` and delete every line containing `@import`. Then verify none remain.

Run:
```bash
# remove any @import lines (portable: write filtered copy back)
grep -v "@import" vendor/reveal/black.css > vendor/reveal/black.css.tmp && mv vendor/reveal/black.css.tmp vendor/reveal/black.css
echo "remaining @import or http refs in vendored css:"
grep -n "@import\|http" vendor/reveal/reveal.css vendor/reveal/black.css || echo "NONE"
```
Expected: prints `NONE`.

- [ ] **Step 3: Point the deck at the vendored files**

In `cnx-2026-agentic-luxury.html`, replace the two head `<link>` tags (lines 9–10):
```html
<link rel="stylesheet" href="vendor/reveal/reveal.css">
<link rel="stylesheet" href="vendor/reveal/black.css" id="theme">
```
and the two `<script>` tags (lines 1018–1019):
```html
<script src="vendor/reveal/reveal.js"></script>
<script src="vendor/reveal/notes.js"></script>
```

- [ ] **Step 4: Verify no CDN/external references remain in the deck**

Run:
```bash
grep -n "cdn.jsdelivr\|https://" cnx-2026-agentic-luxury.html || echo "NO EXTERNAL REFS"
```
Expected: `NO EXTERNAL REFS`.

- [ ] **Step 5: Manually verify the deck still renders offline**

Run a local server, then in the browser **open DevTools → Network, enable "Offline"**, and hard-reload:
```bash
python -m http.server 8080 --bind 127.0.0.1
```
Open `http://127.0.0.1:8080/cnx-2026-agentic-luxury.html`. Expected: deck renders and arrow keys navigate slides with **no failed network requests** in the Network panel.

- [ ] **Step 6: Commit**

```bash
git add vendor/reveal cnx-2026-agentic-luxury.html
git commit -m "Vendor Reveal.js locally; remove CDN deps from deck"
```

---

## Task 2: Step-player module (pure index state machine)

**Files:**
- Create: `demo/package.json`, `demo/player.js`, `demo/player.test.js`

- [ ] **Step 1: Mark `demo/` as ESM**

Create `demo/package.json`:
```json
{
  "name": "cnx-demo",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 2: Write the failing test**

Create `demo/player.test.js`:
```js
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test demo/`
Expected: FAIL — cannot find module `./player.js` / `createScenePlayer` is not defined.

- [ ] **Step 4: Implement the player**

Create `demo/player.js`:
```js
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test demo/`
Expected: PASS — 5 tests passing.

- [ ] **Step 6: Commit**

```bash
git add demo/package.json demo/player.js demo/player.test.js
git commit -m "Add deterministic step-player module with tests"
```

---

## Task 3: Scene runtime (iframe side) — message dispatch

**Files:**
- Create: `demo/scene-runtime.js`, `demo/scene-runtime.test.js`

The runtime maps parent→iframe messages onto the player and renders beats. We factor the
**dispatch** into a pure function `handleSceneMessage(player, data)` so it is testable
without a DOM; the `window`/`postMessage` wiring is a thin layer verified manually in Task 6.

- [ ] **Step 1: Write the failing test**

Create `demo/scene-runtime.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test demo/`
Expected: FAIL — `handleSceneMessage` is not exported from `./scene-runtime.js`.

- [ ] **Step 3: Implement the scene runtime**

Create `demo/scene-runtime.js`:
```js
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
  window.addEventListener('message', (e) => handleSceneMessage(player, e.data));
  // Paint initial state and announce it so the bridge learns `total` immediately.
  const st = player.state();
  renderBeat(st.index, 'reset');
  post({ type: 'demo:state', index: st.index, total: st.total, complete: st.complete, atStart: st.atStart });
  return player;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test demo/`
Expected: PASS — all scene-runtime tests pass (player tests still pass too).

- [ ] **Step 5: Commit**

```bash
git add demo/scene-runtime.js demo/scene-runtime.test.js
git commit -m "Add iframe-side scene runtime with message dispatch + tests"
```

---

## Task 4: Bridge decision logic (deck side)

**Files:**
- Create: `demo/bridge.js`, `demo/bridge.test.js`

- [ ] **Step 1: Write the failing test**

Create `demo/bridge.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test demo/`
Expected: FAIL — `decideKeyAction` is not exported from `./bridge.js`.

- [ ] **Step 3: Implement the bridge**

Create `demo/bridge.js`:
```js
const FORWARD = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar']);
const BACK    = new Set(['ArrowLeft', 'PageUp']);

/**
 * Decide what a keypress should do.
 * @returns {'advance'|'rewind'|'reveal'}
 *   'advance'/'rewind' => intercept and forward to the scene iframe
 *   'reveal'           => let Reveal.js handle it (normal slide nav)
 */
export function decideKeyAction({ key, onDemoSlide, sceneState }) {
  if (!onDemoSlide) return 'reveal';
  if (FORWARD.has(key)) {
    if (!sceneState) return 'advance';          // iframe not reported yet — don't skip the scene
    return sceneState.complete ? 'reveal' : 'advance';
  }
  if (BACK.has(key)) {
    if (!sceneState) return 'rewind';
    return sceneState.atStart ? 'reveal' : 'rewind';
  }
  return 'reveal';
}

/**
 * Wire the deck to demo slides. Browser-only. Call once after Reveal.initialize().
 * A demo slide is any `<section>` containing `<iframe class="demo-frame">`.
 */
export function bindRevealDemoSlides(Reveal) {
  let onDemoSlide = false;
  let sceneState = null;
  let currentIframe = null;

  const postToScene = (type) => {
    if (currentIframe && currentIframe.contentWindow) {
      currentIframe.contentWindow.postMessage({ target: 'demo-scene', type }, '*');
    }
  };

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (d && d.source === 'demo-scene' && d.type === 'demo:state') {
      sceneState = { index: d.index, total: d.total, complete: d.complete, atStart: d.atStart };
    }
  });

  // Capture phase: runs before Reveal's document keydown handler.
  document.addEventListener('keydown', (e) => {
    if (!onDemoSlide) return;
    const action = decideKeyAction({ key: e.key, onDemoSlide, sceneState });
    if (action === 'advance' || action === 'rewind') {
      e.preventDefault();
      e.stopImmediatePropagation();
      postToScene(action === 'advance' ? 'demo:advance' : 'demo:rewind');
    }
  }, true);

  const updateSlide = () => {
    const slide = Reveal.getCurrentSlide();
    currentIframe = slide ? slide.querySelector('iframe.demo-frame') : null;
    onDemoSlide = !!currentIframe;
    sceneState = null;
    if (currentIframe) {
      // Reset to beat 0 each time we (re-)enter, so the scene is repeatable.
      const reset = () => postToScene('demo:reset');
      if (currentIframe.contentWindow) reset();
      currentIframe.addEventListener('load', reset, { once: true });
    }
  };

  Reveal.on('ready', updateSlide);
  Reveal.on('slidechanged', updateSlide);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test demo/`
Expected: PASS — all bridge tests pass (player + scene-runtime still pass).

- [ ] **Step 5: Commit**

```bash
git add demo/bridge.js demo/bridge.test.js
git commit -m "Add deck-side demo bridge: key decision logic + Reveal wiring + tests"
```

---

## Task 5: Browser-chrome styling + stub scene page

**Files:**
- Create: `demo/demo-chrome.css`, `demo/stub/index.html`

- [ ] **Step 1: Create the browser-chrome + frame CSS**

Create `demo/demo-chrome.css`:
```css
/* Browser-chrome wrapper for an embedded demo scene inside a Reveal slide. */
.demo-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: #0d0a08;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.demo-window__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #1f2330;
  flex: 0 0 auto;
}
.demo-window__dots { display: flex; gap: 7px; }
.demo-window__dot { width: 12px; height: 12px; border-radius: 50%; background: #4a5060; }
.demo-window__dot--r { background: #ff5f57; }
.demo-window__dot--y { background: #febc2e; }
.demo-window__dot--g { background: #28c840; }
.demo-window__url {
  flex: 1;
  font-family: var(--font-mono, 'SF Mono', Consolas, monospace);
  font-size: 14px;
  color: #c7ccd9;
  background: #11141d;
  border-radius: 100px;
  padding: 7px 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.demo-window__body { flex: 1 1 auto; position: relative; background: #fff; }
iframe.demo-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
```

- [ ] **Step 2: Create the stub scene page**

Create `demo/stub/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Demo Stub Scene</title>
<style>
  html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; }
  body { display: flex; align-items: center; justify-content: center; background: #f7f3ec; }
  .stage { text-align: center; }
  .beat { opacity: 0.18; font-size: 42px; margin: 18px 0; transition: opacity .25s ease; }
  .beat.on { opacity: 1; color: #8a6a3c; }
  .counter { margin-top: 32px; font: 14px monospace; color: #888; }
</style>
</head>
<body>
  <div class="stage">
    <div class="beat" data-beat="1">Beat one — walk-in</div>
    <div class="beat" data-beat="2">Beat two — enrichment</div>
    <div class="beat" data-beat="3">Beat three — capture</div>
    <div class="counter" id="counter">beat 0 / 3</div>
  </div>
  <script type="module">
    import { startSceneRuntime } from '../scene-runtime.js';
    const beats = [...document.querySelectorAll('.beat')];
    const counter = document.getElementById('counter');
    startSceneRuntime({
      total: beats.length,
      renderBeat(index) {
        beats.forEach((el, i) => el.classList.toggle('on', i < index));
        counter.textContent = `beat ${index} / ${beats.length}`;
      },
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Manually verify the stub runs standalone**

With the server from Task 1 running, open `http://127.0.0.1:8080/demo/stub/index.html` directly. Expected: page loads showing "beat 0 / 3", all three lines dimmed. (It won't advance on its own — it waits for parent messages. This step only confirms it loads without console errors.)

- [ ] **Step 4: Commit**

```bash
git add demo/demo-chrome.css demo/stub/index.html
git commit -m "Add browser-chrome CSS and stub scene page"
```

---

## Task 6: Embed a demo slide in the deck and wire the bridge

**Files:**
- Modify: `cnx-2026-agentic-luxury.html` (head: add `demo/demo-chrome.css`; add one demo `<section>`; init: call `bindRevealDemoSlides`)

- [ ] **Step 1: Link the chrome CSS in the deck head**

In `cnx-2026-agentic-luxury.html`, immediately after the vendored `black.css` link, add:
```html
<link rel="stylesheet" href="demo/demo-chrome.css">
```

- [ ] **Step 2: Add a demo slide**

Insert this `<section>` right **after** the Demo Roadmap section (the one ending near line 663, containing `mockup-commerce.png`). It embeds the stub via browser chrome:
```html
<!-- DEMO HARNESS PROOF — stub scene (temporary; replaced by real scenes in later plans) -->
<section class="slide--dark slide-vcenter" data-demo-scene="stub">
  <div class="demo-window">
    <div class="demo-window__bar">
      <div class="demo-window__dots">
        <span class="demo-window__dot demo-window__dot--r"></span>
        <span class="demo-window__dot demo-window__dot--y"></span>
        <span class="demo-window__dot demo-window__dot--g"></span>
      </div>
      <div class="demo-window__url">tachibana.demo-combobulator.com</div>
    </div>
    <div class="demo-window__body">
      <iframe class="demo-frame" src="demo/stub/index.html" title="Demo stub scene"></iframe>
    </div>
  </div>
  <aside class="notes">Harness proof: arrow-right steps through 3 beats, then advances to the next slide. Arrow-left rewinds, then leaves to the previous slide.</aside>
</section>
```

- [ ] **Step 3: Wire the bridge in the deck's init script**

In the `<script>` block, change the imports/init so `bindRevealDemoSlides` runs after init. Replace the opening of that script block:
```html
<script type="module">
  import { bindRevealDemoSlides } from './demo/bridge.js';
  Reveal.initialize({
```
…keep the existing `Reveal.initialize({ ... })` options unchanged… and immediately after the `Reveal.initialize({...});` call, add:
```js
  bindRevealDemoSlides(Reveal);
```
> Note: the logo-lockup `forEach` block stays as-is. Because the block is now `type="module"`, the global `Reveal` from the vendored `reveal.js` script tag is still available on `window`.

- [ ] **Step 4: Manually verify the full step-through flow offline**

Restart the server, set DevTools Network to **Offline**, open the deck, and navigate to the demo slide. Verify, watching the Network panel stays empty:
1. ArrowRight three times → the three stub beats light up one per press; the counter reads 1/3, 2/3, 3/3. The slide does **not** advance during these.
2. A 4th ArrowRight → Reveal advances to the next slide.
3. ArrowLeft back onto the demo slide → it resets to "beat 0 / 3".
4. ArrowRight twice (→2/3), then ArrowLeft twice → counter returns to 0/3, and a 3rd ArrowLeft leaves to the previous slide.

Expected: all four behaviors hold; zero network requests.

- [ ] **Step 5: Run the logic test suite once more**

Run: `node --test demo/`
Expected: PASS — all player/scene-runtime/bridge tests still green.

- [ ] **Step 6: Commit**

```bash
git add cnx-2026-agentic-luxury.html
git commit -m "Embed demo slide and wire arrow-key bridge end-to-end (stub scene)"
```

---

## Task 7: Document the harness for the scene plans

**Files:**
- Create: `demo/README.md`

- [ ] **Step 1: Write the harness contract**

Create `demo/README.md`:
```markdown
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
Run `node --test demo/` for the pure logic modules (player, runtime dispatch, bridge decision).
```

- [ ] **Step 2: Commit**

```bash
git add demo/README.md
git commit -m "Document the in-slide demo harness contract"
```

---

## Verification (whole plan)

- `node --test demo/` → all tests pass.
- `grep -n "cdn.jsdelivr\|https://" cnx-2026-agentic-luxury.html` → no external refs.
- With DevTools **Offline**, the deck loads and the demo slide steps through 3 beats and back with zero network requests.

## Out of scope (handled by later plans)

- Real Scene 1 (Salesforce clienteling, rebuilt from LWCs).
- Real Scene 2 (Tachibana offline app build + scripted directive player).
- Real Scene 3 (Marketing — both surfaces).
- Removing the temporary stub slide (the first scene plan replaces it).
