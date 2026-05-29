# Tachibana — Offline Demo Build (REBUILD)

This folder holds a **fully-offline, deterministic** static build of the Tachibana
luxury storefront + on-page **Bantō** agent, with the agent conversation **replayed
from a script**. It is embedded in the conference slide deck. It makes **zero**
requests to any external host (no Salesforce, Supabase, Adobe/Firefly/Imagen, Google
Fonts, or Data Cloud beacon).

The static files here are **build output only** — do not edit them by hand. The source
of truth is the product repo on the `offline-demo-build` branch.

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
rm -rf "$DEST" && mkdir -p "$DEST"
cp -r dist/. "$DEST/"
# (do NOT run git in the deck repo — another process commits it)
```

`demo/tachibana/index.html` must exist and reference assets with **relative** paths
(`./assets/...`). The app uses a **hash router**, so deep links are `index.html#/advisor`.

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
// total = 2 (number of scripted USER turns)
```

`demo:advance` submits the next scripted user line through the same `sendMessage` the
chat input uses. Globals `window.__demoAdvance()` and `window.__demoReset()` are also
exposed for manual / keyboard driving.

### Scripted conversation (deterministic)

1. **Welcome** (`[WELCOME]`) → `WELCOME_SCENE`
   - "Welcome back, Sarah." / "Kyoto's about six weeks out — I've pulled a few pieces
     for the occasion." (Only auto-fires when a known persona is loaded; the deck can
     also reset to it via `demo:reset`.)
2. **Advance #1** → `SHOW_PRODUCTS` — Kyoto wedding-guest picks + Platinum perk. Products:
   - `fragrance-floral` — Jardin de Nuit Eau de Parfum
   - `fragrance-woody` — Bois Sauvage Eau de Toilette
   - `travel-kit-hydration` — Hydration Hero Travel Set
3. **Advance #2** → `INITIATE_CHECKOUT` — confirmation using the stored card + Kyoto hotel
   address (no forms).

---

## Product-repo files changed on `offline-demo-build`

| File | Change |
|------|--------|
| `.env.offline` (new) | `VITE_USE_MOCK_DATA=true`, `VITE_ENABLE_GENERATIVE_BACKGROUNDS=false`, `VITE_IMAGE_PROVIDER=none` |
| `src/contexts/DemoContext.tsx` | `DEFAULT_CONFIG.storefrontStyle = 'luxury_maison'` (default/no-slug path only) + `StorefrontStyle` type import |
| `src/routes/catalogLoader.ts` | Short-circuit to bundled `MOCK_PRODUCTS` when `featureFlags.useMockData` (no network) |
| `src/services/mock/scriptedAgent.ts` (new) | Deterministic scripted `generateMockResponse` + re-exported mockAgent API surface + `resetScriptedAgent` / `SCRIPTED_TURN_COUNT` |
| `src/contexts/ConversationContext.tsx` | Import swap `mockAgent` → `scriptedAgent`; register live `sendMessage`/reset with the harness (mock build only) |
| `src/services/demo/demoHarness.ts` (new) | `postMessage` bridge (advance/rewind/reset) + state posting + window globals |
| `src/main.tsx` | Vendored `@fontsource` imports (Inter, Fraunces, Cormorant Garamond, Noto Serif JP); load harness when mock flag set; comment update for hash router |
| `index.html` | Removed Google Fonts `<link>` + preconnects |
| `src/components/Storefront/luxury/luxury.css` | Removed Google Fonts `@import` |
| `src/App.tsx` | `createBrowserRouter` → `createHashRouter` |
| `vite.config.ts` | Added `base: './'` |
| `package.json` / `package-lock.json` | Added `@fontsource/{inter,fraunces,cormorant-garamond,noto-serif-jp}` |

## Verified

- `dist/index.html` uses relative `./assets/...` paths; no `googleapis`/`gstatic` refs.
- Served `dist/` via `vite preview` and drove the full flow in a real browser:
  storefront (luxury Tachibana variant) + `#/advisor` (Bantō chat) + both scripted
  turns — **zero** non-localhost network requests, **zero** console errors.
- `npx tsc --noEmit` is clean.
