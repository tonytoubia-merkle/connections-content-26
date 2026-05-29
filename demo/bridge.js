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
    // Only trust state from the iframe of the slide we're currently on.
    if (!currentIframe || e.source !== currentIframe.contentWindow) return;
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
      const loaded = currentIframe.contentDocument
        && currentIframe.contentDocument.readyState === 'complete';
      if (loaded) reset();
      else currentIframe.addEventListener('load', reset, { once: true });
    }
  };

  Reveal.on('ready', updateSlide);
  Reveal.on('slidechanged', updateSlide);
}
