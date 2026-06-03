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

  // Drive the scene forward/back from any input (key, click, scroll). When the
  // scene is already complete (or at its start), hand off to Reveal for the
  // next/previous slide so click/scroll can carry the whole talk.
  const navigate = (dir) => {
    if (!onDemoSlide) return;
    if (dir === 'fwd') {
      if (sceneState && sceneState.complete) Reveal.next();
      else postToScene('demo:advance');
    } else {
      if (sceneState && sceneState.atStart) Reveal.prev();
      else postToScene('demo:rewind');
    }
  };

  // Click + scroll also advance/rewind. Listeners live on the (same-origin)
  // iframe document, bound once per iframe.
  const navBound = new WeakSet();
  const attachNav = (iframe) => {
    const doc = iframe.contentDocument;
    if (!doc || navBound.has(iframe)) return;
    navBound.add(iframe);
    // The Tachibana React app momentarily scrolls its own page during route/scene
    // transitions (home → advisor → products → checkout), causing a scroll-up-then-
    // snap. Its content fits the frame and its inner panels scroll on their own, so
    // lock the app's PAGE scroll. (Only the Tachibana iframe — the Salesforce scenes
    // scroll their own document on purpose, so they're left alone.)
    if ((iframe.getAttribute('src') || '').includes('/tachibana/')) {
      try {
        const w = iframe.contentWindow;
        const s = doc.createElement('style');
        s.textContent = 'html,body,#root{overflow:hidden!important;overscroll-behavior:none;}';
        doc.head.appendChild(s);
        // The transient "scroll-up then snap" on transitions (home→advisor,
        // products reveal, checkout modal) comes from the React app scrolling an
        // element into view / focusing it. Content fits the frame, so: make
        // scrollIntoView a no-op, force focus() to not scroll, and clamp any
        // residual page scroll back to the top. (Tachibana iframe only.)
        if (w.Element && w.Element.prototype) {
          w.Element.prototype.scrollIntoView = function () {};
        }
        if (w.HTMLElement && w.HTMLElement.prototype) {
          const _focus = w.HTMLElement.prototype.focus;
          w.HTMLElement.prototype.focus = function (opts) {
            try { return _focus.call(this, Object.assign({ preventScroll: true }, opts || {})); }
            catch (_e) { return _focus.call(this); }
          };
        }
        w.addEventListener('scroll', () => { if (w.scrollY || w.scrollX) w.scrollTo(0, 0); }, true);
      } catch (_) { /* cross-origin or not ready — ignore */ }
    }
    doc.addEventListener('click', () => navigate('fwd'));
    // Arrow/space/page keys while the IFRAME has focus (e.g. after a click
    // inside it) never reach the deck's parent-document handler. Catch them
    // here too so arrows always advance — whether the deck or the iframe is focused.
    doc.addEventListener('keydown', (e) => {
      if (FORWARD.has(e.key)) { e.preventDefault(); navigate('fwd'); }
      else if (BACK.has(e.key)) { e.preventDefault(); navigate('back'); }
    });
    let lastWheel = 0;
    doc.addEventListener('wheel', (e) => {
      e.preventDefault();                       // scroll drives beats, not the page
      if (Math.abs(e.deltaY) < 6) return;
      const now = Date.now();
      if (now - lastWheel < 380) return;        // one gesture = one beat
      lastWheel = now;
      navigate(e.deltaY > 0 ? 'fwd' : 'back');
    }, { passive: false });
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
      const iframe = currentIframe;
      const onReady = () => { postToScene('demo:reset'); attachNav(iframe); };
      const loaded = iframe.contentDocument
        && iframe.contentDocument.readyState === 'complete';
      if (loaded) onReady();
      else iframe.addEventListener('load', onReady, { once: true });
    }
  };

  Reveal.on('ready', updateSlide);
  Reveal.on('slidechanged', updateSlide);
}
