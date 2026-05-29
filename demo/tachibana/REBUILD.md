# Tachibana — Offline Demo Build (REBUILD)

This folder holds a **fully-offline, deterministic** static build of the Tachibana
luxury storefront + on-page **Bantō** agent, with the agent conversation **replayed
from a script**. It is embedded in the conference slide deck. It makes **zero**
requests to any external host (no Salesforce, Supabase, Adobe/Firefly/Imagen, Google
Fonts, or Data Cloud beacon).

The scene now **starts on the storefront HOMEPAGE** (`#/`) with pseudonymous Merkury
personalization (the scripted persona "Sarah" is recognized via Merkury but NOT signed
in), then the first advance steps into the advisor and the scripted Bantō conversation
plays out. Embed the build at `demo/tachibana/index.html` (no `#/advisor` deep link —
the homepage is the entry scene; the harness drives the route into the advisor).

The storefront is the **luxury LEATHER/atelier catalog** (real Tachibana products
sourced from `supabase-products-response.json` → `src/mocks/luxuryProducts.ts`), NOT the
beauty mock catalog. The advisor recommends wedding-guest LEATHER pieces. The Merkury
recognition cue is a **top-right TOAST with the Merkury logo image**, and the advisor
welcome scene uses the local **wedding-kyoto.jpg** photograph as its background. The
**DemoLog debug panel + toggle button are hidden** in the mock build.

The static files here are **build output only** — do not edit them by hand (the one
exception is this `REBUILD.md`, which is hand-maintained and lives alongside the build).
The source of truth is the product repo on the `offline-demo-build` branch.

---

## Source

- **Product repo:** `agentforce-retail-advisor`
- **Branch:** `offline-demo-build` (committed locally, NOT pushed; `main` untouched)

## Rebuild commands

Run from the product repo root (`agentforce-retail-advisor`):

```bash
git checkout offline-demo-build

# Fonts are vendored via @fontsource (already in package.json / node_modules).
# Only needed if node_modules is missing them:
#   npm install

# IMPORTANT: .env.local in the product repo carries live SF/Supabase/Adobe/Data
# Cloud secrets. Vite ALWAYS loads .env.local (even with --mode offline), which
# would re-introduce the SF Personalization beacon and a Salesforce instance URL.
# Move it aside for the build so ONLY .env.offline applies, then restore it.

mv .env.local .env.local.bak
npx vite build --mode offline      # reads .env.offline → dist/
mv .env.local.bak .env.local
```

Output is `dist/` in the product repo.

## Copy command

From the product repo root (adjust the absolute path to the deck repo as needed):

```bash
DEST="../connections-content-26/demo/tachibana"
# Preserve the hand-maintained REBUILD.md (it lives in this folder, not in dist/).
cp "$DEST/REBUILD.md" /tmp/REBUILD.md.keep
rm -rf "$DEST" && mkdir -p "$DEST"
cp -r dist/. "$DEST/"
cp /tmp/REBUILD.md.keep "$DEST/REBUILD.md"   # restore the doc
# (do NOT run git in the deck repo — another process commits it. If you DID clobber
#  REBUILD.md, `git checkout -- demo/tachibana/REBUILD.md` in the deck repo restores it.)
```

`demo/tachibana/index.html` must exist and reference assets with **relative** paths
(`./assets/...`). The app uses a **hash router**. The deck embeds the **homepage**
(`index.html`, which is `#/`) — NOT `#/advisor` — because the scene now starts on the
storefront home and the harness drives the route into the advisor on the first advance.

---

## How the deck drives it

The build ships a `postMessage` harness (`src/services/demo/demoHarness.ts`, loaded only
when `VITE_USE_MOCK_DATA==='true'`). Embed the build in an iframe and post:

```js
iframe.contentWindow.postMessage({ target: 'demo-scene', type: 'demo:advance' }, '*');
iframe.contentWindow.postMessage({ target: 'demo-scene', type: 'demo:rewind'  }, '*');
iframe.contentWindow.postMessage({ target: 'demo-scene', type: 'demo:reset'   }, '*');
```

On each command it posts state back to `parent`:

```js
{ source: 'demo-scene', type: 'demo:state', index, total, complete, atStart }
// total = 3 (number of advance steps; index runs 0..3, 0 = homepage)
```

The harness drives **route navigation** (it sets `window.location.hash`) AND the scripted
advisor turns through the same `sendMessage` the chat input uses. Globals
`window.__demoAdvance()`, `window.__demoRewind()`, and `window.__demoReset()` are also
exposed for manual / keyboard driving.

### Scene sequence (deterministic) — total = 3

- **index 0** (initial / on `demo:reset`) — storefront **HOMEPAGE** (`#/`). Pseudonymous
  Merkury personalization: a subtle **"Welcome, Sarah"** in the header + home, a
  **"Wedding Ready"** occasion edit strip, a **"Maison Circle · by invitation"** white-glove
  tier chip, and a top-right **Merkury recognition TOAST** (Merkury **logo image** +
  "Recognized via Merkury · Welcome back, Sarah") that slides/fades in on entry and
  auto-dismisses after a few seconds. (Sarah is recognized via Merkury but NOT signed in.)
  The **DemoLog debug panel and its toggle button do NOT render** in this mock build.
- **Advance → index 1** — navigate to `#/advisor` AND fire the Bantō welcome:
  "Welcome back, Sarah." / "Kyoto's about six weeks out — I've pulled a few pieces for the
  occasion." Welcome scene background is the local **wedding-kyoto.jpg** photograph
  (`public/assets/backgrounds/wedding-kyoto.jpg`, white flowers on white). It is a light
  image, so `GenerativeBackground` lays a deepened dark scrim over it to keep the chat
  text/bubbles readable. Fully local; no remote image. The welcome auto-renders on advisor
  mount for the scripted persona.
- **Advance → index 2** → `SHOW_PRODUCTS` — wedding-guest LEATHER edit (sending the message
  dismisses the welcome overlay). Products (real luxury catalog ids):
  - `37027f1a-2abe-455c-b4d1-b74115a3bd10` — Hana Minaudière (evening clutch)
  - `291c09f3-272e-44dc-8b1a-5c0a7f459613` — Kinari Wrap (silk evening wrap)
  - `3276b4da-4d40-4d02-940d-f90d9f6ac2a0` — Tachibana Voyage (weekender)
- **Advance → index 3** → `INITIATE_CHECKOUT` — confirmation using the stored card + Kyoto
  hotel address (no forms).
- **`demo:rewind`** reverses one step (best-effort: resets to homepage and replays
  forward). **`demo:reset`** returns to the homepage at index 0.

---

## Product-repo files changed on `offline-demo-build`

| File | Change |
|------|--------|
| `.env.offline` (new) | `VITE_USE_MOCK_DATA=true`, `VITE_ENABLE_GENERATIVE_BACKGROUNDS=false`, `VITE_IMAGE_PROVIDER=none` |
| `src/contexts/DemoContext.tsx` | `DEFAULT_CONFIG.storefrontStyle = 'luxury_maison'` (default/no-slug path only) + `StorefrontStyle` type import |
| `src/mocks/luxuryProducts.ts` (new) | The REAL Tachibana LEATHER/atelier catalog (31 products) mapped from `supabase-products-response.json` into the `Product` type; `imageUrl` via `assetUrl('/assets/tachibana/<slug>-hero.png')` |
| `src/routes/catalogLoader.ts` | Mock short-circuit: `luxury_maison` storefront returns `LUXURY_PRODUCTS`; other mock storefronts keep `MOCK_PRODUCTS` (no network) |
| `src/services/mock/scriptedAgent.ts` | `SHOW_PRODUCTS` now recommends LEATHER pieces (Hana Minaudière / Kinari Wrap / Tachibana Voyage) from `LUXURY_PRODUCTS` by real id, with wedding-guest rationale; welcome scene `setting: 'kyoto-autumn'`, `generateBackground:false` |
| `src/contexts/SceneContext.tsx` | Welcome scene: when `setting === 'kyoto-autumn'` (offline build), background is the local `wedding-kyoto.jpg` image (via `assetUrl`) instead of the CSS gradient |
| `src/components/GenerativeBackground/GenerativeBackground.tsx` | Deepened the image readability scrim (`from-black/75 via-black/45 to-black/55`) so chat text stays legible over the LIGHT wedding photo |
| `src/components/Storefront/luxury/LuxuryMerkuryBadge.tsx` | Rewritten from a text badge into a TOAST that slides/fades in with the **Merkury logo image** (`assetUrl('/assets/merkury-logo.png')`) + "Recognized via Merkury / Welcome back, Sarah", auto-dismisses |
| `src/components/Storefront/luxury/luxury.css` | Replaced `.tk-merkury-badge` styles with `.tk-merkury-toast` (logo + slide/fade in + auto-dismiss out) |
| `src/App.tsx` | `DemoRoot`: flag-guard so the `<DemoLog>` panel AND its toggle button do NOT render when `VITE_USE_MOCK_DATA==='true'`; main column always full width in the mock build |
| `public/assets/backgrounds/wedding-kyoto.jpg` (new) | Local wedding-in-Kyoto background photo for the advisor welcome scene |
| `src/contexts/ConversationContext.tsx` | Import swap `mockAgent` → `scriptedAgent`; register `sendMessage`/`welcome`/`reset` with the harness (mock build only); `sendMessage` dismisses the welcome overlay; mock build renders the scripted welcome for the known-not-authenticated persona |
| `src/services/demo/demoHarness.ts` (new) | `postMessage` bridge — homepage-first scene sequence (total=3); drives **route navigation** (sets `window.location.hash`) + advisor turns; advance/rewind/reset + state posting + window globals |
| `src/contexts/CustomerContext.tsx` | Mock build auto-selects the `'sarah'` persona on mount (Merkury-recognized, NOT signed in) instead of `'anonymous'` |
| `src/components/Storefront/luxury/useMerkuryRecognition.ts` (new) | Flag-guarded hook: true only in the mock build when the persona is Merkury-`known` + not authenticated |
| `src/components/Storefront/luxury/LuxuryMerkuryBadge.tsx` (new) | Originally a top-right "✦ Recognized via Merkury" text badge — **now superseded** by the logo TOAST (see the change row above). |
| `src/components/Storefront/luxury/LuxuryHeader.tsx` | Recognized: subtle "Welcome, Sarah" + "Maison Circle · by invitation" white-glove chip |
| `src/components/Storefront/luxury/LuxuryHome.tsx` | Recognized: "Welcome, {first}." greeting + "Wedding Ready" Kyoto occasion edit strip |
| `src/components/Storefront/luxury/LuxuryStorefrontPage.tsx` | Mounts `LuxuryMerkuryBadge` on the home view |
| `src/components/Storefront/luxury/luxury.css` | Styles for the welcome greeting, white-glove chip, Wedding Ready strip, and Merkury badge (fade-in/settle) |
| `src/hooks/useGenerativeBackground.ts` | Added the `kyoto-autumn` warm-gradient entry to the fallback gradient map |
| `src/contexts/SceneContext.tsx` | `WELCOME_SCENE` with generation disabled but a named `setting` resolves to a local fallback gradient instead of `default.png` (the `kyoto-autumn` case is **now superseded** by the wedding-image case above). |
| `src/main.tsx` | Vendored `@fontsource` imports (Inter, Fraunces, Cormorant Garamond, Noto Serif JP); load harness when mock flag set; comment update for hash router |
| `index.html` | Removed Google Fonts `<link>` + preconnects |
| `src/components/Storefront/luxury/luxury.css` | Removed Google Fonts `@import` |
| `src/App.tsx` | `createBrowserRouter` → `createHashRouter` |
| `vite.config.ts` | Added `base: './'` |
| `package.json` / `package-lock.json` | Added `@fontsource/{inter,fraunces,cormorant-garamond,noto-serif-jp}` |

## Verified

- `dist/index.html` uses relative `./assets/...` paths; no `googleapis`/`gstatic` refs;
  no live SF/Supabase host or secret in the bundle (only the admin-UI `xxx.my.salesforce.com`
  placeholder).
- Verified the copied build **at the subpath** (`http://127.0.0.1:8080/demo/tachibana/index.html`,
  the deck-root static server — NOT `vite preview`) in a real browser:
  - Homepage: Merkury **toast with the logo image** (200), "Welcome, Sarah", "Wedding Ready";
    DemoLog panel + toggle button **absent**.
  - `demo:reset` → `demo:advance` ×3: advance 1 → advisor with the **wedding-kyoto.jpg**
    background (200, readable text over the scrim); advance 2 → **leather** recos
    (Hana Minaudière / Kinari Wrap / Tachibana Voyage) with hero images (200), no beauty
    products; advance 3 → checkout (index 3, complete).
  - `performance.getEntriesByType('resource')`: only host `127.0.0.1:8080`, **zero**
    non-localhost, **zero** 4xx/5xx; merkury logo + wedding bg + leather images all 200
    under `/demo/tachibana/assets/...`.
- `npx tsc --noEmit` is clean.
