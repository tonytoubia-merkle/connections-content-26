# Scene 2 — Agentic Commerce (Tachibana offline build) Implementation Plan

> **For agentic workers:** This plan modifies the SEPARATE product repo `agentforce-retail-advisor` on a dedicated branch (not pushed), produces a fully-offline static build, and copies the build output into the deck repo at `connections-content-26/demo/tachibana/`. Steps use `- [ ]`.

**Goal:** A fully-offline, deterministic static build of the real Tachibana **luxury storefront + on-page Bantō**, where the agent conversation is replayed from a script. Embedded in the deck for the on-site Commerce scene ("the page is the agent").

**Architecture:** Add an isolated "offline" build path to `agentforce-retail-advisor` (mock mode forced, scripted agent replacing the live one, hash routing, relative base, fonts vendored, catalog short-circuited to mocks). `vite build` → `dist/` → copied to `connections-content-26/demo/tachibana/`. The deck embeds it in an iframe; the harness bridge maps arrow keys to the scripted agent turns.

**Tech Stack:** Vite + React 19 + TS (existing), `@fontsource/*` for vendored fonts.

## Key seams (verified by exploration — file:line)
- Mock gate: `src/contexts/ConversationContext.tsx:331` — `if (getDemoConfig().featureFlags.useMockData) return generateMockResponse(content);`. Flag from `VITE_USE_MOCK_DATA` (`DemoContext.tsx:51`).
- Scripted seam: replace import in `ConversationContext.tsx:9` from `@/services/mock/mockAgent` to a new `@/services/mock/scriptedAgent` exporting `generateMockResponse(message): Promise<AgentResponse>` (same signature, `agent.ts:85`). Welcome trigger is the literal `'[WELCOME]'` (`mockAgent.ts:933`).
- Directives: `UIAction`/`UIDirective` (`types/agent.ts`); executed via `SceneContext.processUIDirective` (`SceneContext.tsx:220`). Scripted responses return `{message, uiDirective:{action,payload}, suggestedActions, confidence}`.
- Luxury variant: `StorefrontPage.tsx:36` forks on `config.storefrontStyle === 'luxury_maison'`. Set in `DEFAULT_CONFIG` (`DemoContext.tsx:29`). Bantō at route `/advisor` (`App.tsx:43`); storefront at `/`.
- Catalog network call: `routes/catalogLoader.ts` calls `/api/sf/token` even in mock mode — short-circuit when `useMockData`.
- Offline blockers: Google Fonts in `index.html:7-9` and `luxury/luxury.css:6`; generative backgrounds (disable → CSS gradient fallback `useGenerativeBackground.ts`); `createBrowserRouter` (`App.tsx:185`) → must be hash router; `vite.config.ts` has no `base` → set `base:'./'`. Product images already local (`/assets/products/*`).

## Branch & safety
- All work on branch `offline-demo-build` in `agentforce-retail-advisor`. Do NOT push. Do NOT modify `main`. Changes are additive (new files, guarded flags); existing live behavior unchanged when `VITE_USE_MOCK_DATA` is unset.

## Scripted agent content (Tony to red-line)
A short, deterministic sequence for the on-site Commerce scene. Sarah arrives already known (wedding Life Event in profile), so the page opens composed around it:
1. `'[WELCOME]'` → WELCOME_SCENE: "Welcome back, Sarah. With Kyoto about six weeks out, I've pulled a few pieces for the occasion." (luxury setting; gradient background)
2. user "Something for the rehearsal dinner" → SHOW_PRODUCTS with 2–3 luxury picks + rationale tied to the event + Platinum perk.
3. user "Add the [piece] to my bag" → INITIATE_CHECKOUT (stored profile, no forms).
Products must be luxury/atelier/travel items present in the mock catalog (verify available mock products; adapt copy to them). NOT bridal.

## Tasks
- [ ] **Task 1:** In `agentforce-retail-advisor`, create branch `offline-demo-build`. Add `.env.offline` (`VITE_USE_MOCK_DATA=true`, `VITE_ENABLE_GENERATIVE_BACKGROUNDS=false`, `VITE_IMAGE_PROVIDER=none`; SF/Supabase/Adobe vars absent). Verify `git branch` shows the new branch.
- [ ] **Task 2:** Patch `DEFAULT_CONFIG` (`DemoContext.tsx`) to add `storefrontStyle: 'luxury_maison'` (and vertical as needed). Guarded so it only matters when no Supabase slug resolves (localhost path). 
- [ ] **Task 3:** Short-circuit `catalogLoader.ts`: when `config.featureFlags.useMockData`, `return { products: MOCK_PRODUCTS }` (import from `@/mocks/products`) before any fetch. Confirm no `/api/*` fetch on first paint.
- [ ] **Task 4:** Create `src/services/mock/scriptedAgent.ts` exporting `generateMockResponse(message)` with the scripted sequence above (real product ids from the mock catalog). Change `ConversationContext.tsx:9` import to it. Keep `setMockCustomerContext` re-exported if referenced.
- [ ] **Task 5:** Vendor fonts: add `@fontsource` packages (Cormorant Garamond, Inter, Noto Serif JP, Fraunces), import in `main.tsx`, remove the Google Fonts `<link>` in `index.html` and the `@import` in `luxury/luxury.css`. Verify no `fonts.googleapis.com`/`gstatic` references remain.
- [ ] **Task 6:** Switch `createBrowserRouter` → `createHashRouter` (`App.tsx`); set `base:'./'` in `vite.config.ts`. Trim demo-path routes if convenient (keep `/` + `/advisor`).
- [ ] **Task 7:** Build offline: `npx vite build` with `.env.offline` (e.g. `vite build --mode offline` or env-file). Output `dist/`. Serve `dist/` locally and verify with the network OFF: storefront renders luxury, Bantō chat replays the scripted turns + product recompose + checkout, ZERO network requests (DevTools).
- [ ] **Task 8:** Copy `dist/` → `connections-content-26/demo/tachibana/` (committed in the deck repo on `feat/scripted-demo`). Document the rebuild command in `connections-content-26/demo/tachibana/REBUILD.md`.
- [ ] **Task 9 (integration — DEFERRED to serial deck pass):** deck `<section>` with `.demo-window` (URL `tachibana.demo-combobulator.com`) + iframe `demo/tachibana/index.html#/advisor` (or `/`). Bridge: arrow keys → scripted agent advance. Done in the serial pass; the scripted agent must expose an "advance to next turn" hook compatible with the harness `demo:advance` (see integration note below).

## Integration note (scripted agent ↔ harness)
The harness drives beats via `postMessage('demo:advance')`. Provide a tiny adapter inside the Tachibana build: a `window.addEventListener('message')` listener that, on `demo:advance`, triggers the next scripted user turn (submits the next canned message) and on `demo:reset` resets the conversation. It posts `demo:state {index,total,complete,atStart}` back so the bridge knows when the scene is done. This adapter lives in the app build (e.g. a small module mounted in mock/offline mode), so the deck's existing bridge needs no special-casing.

## Verification
- `dist/` served with network physically off: full storefront + scripted Bantō flow works; zero network requests; luxury Maison Tachibana styling; deterministic on repeat.
- After copy + integration: arrow keys step the scripted turns inside the deck slide, then release to the next slide.

## Risk / rollback
- All product-repo changes are on `offline-demo-build` (unpushed) and flag-guarded; `main` and live behavior untouched. The deck only ever consumes the static `dist/` copy.
