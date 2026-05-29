# Scene 1 — Agentic Clienteling (capture) Implementation Plan

> **For agentic workers:** built on the demo harness (Plan 1). Scene pages call `startSceneRuntime({ total, renderBeat })` from `../../scene-runtime.js` and are driven by the deck's arrow-key bridge. Steps use `- [ ]`.

**Goal:** A self-contained, offline, step-through static replica of the real Salesforce **clienteling console** that plays the 5-beat "capture" scene (walk-in → Merkury enrichment → Bantō greeting → wedding event capture → recompose + white-glove task), embedded in the deck.

**Architecture:** One static page `demo/salesforce/clienteling/index.html` (+ its own CSS), rebuilt faithfully from the real LWCs (`clientellingConsole`, `walkInCapture`, `profileSection360`, `customerProfilePanel`, `provenanceBadge`, `agentCopilotPanel`, `consultationNoteCapture`). It imports the shared `scene-runtime.js`; `renderBeat(index)` toggles which scripted state is shown. No Salesforce runtime, no network.

**Tech Stack:** Static HTML/CSS/JS (ESM), shared harness.

## Fidelity anchors (from the real LWC source — must match)
- Console shell: full-height, page bg `#f4f6f9`; **header bg `#1a1a2e`** (near-black navy), white title "Maison Tachibana · Clienteling", 14px/700; global search box (width ~280px) top-right.
- 3-column body: left appointment sidebar **25%** (min 260px, bg `#fff`), center profile panel **flex:1** (border-left/right `1px solid #e5e5e5`), right co-pilot **25%** (min 280px).
- **Co-pilot header gradient `linear-gradient(135deg,#667eea 0%,#764ba2 100%)`**, white "AI Co-pilot" + "Active" pill `rgba(255,255,255,0.25)`.
- Chat bubbles: user `#1565c0` white (bottom-right radius 4px); agent `#f5f5f5` `#333` (bottom-left radius 4px); 12px radius, max-width 85%, 13px.
- Provenance badges (pill, 11px/500, radius 12px): stated `#e8f5e9/#2e7d32/border #a5d6a7`; declared `#e3f2fd/#1565c0/#90caf9`; observed `#e0f2f1/#00695c/#80cbc4`; inferred `#f5f5f5/#616161/#bdbdbd`; agent `#f3e5f5/#7b1fa2/#ce93d8`.
- Section-card accordion: header bg `#fafafa`, border `1px solid #e5e5e5`, padding `7px 10px`, title 13px/600 `#333`.
- Identity badge "known": `#e8f5e9/#2e7d32`. Clienteling tier pill: `#e8eaf6/#283593`. Loyalty stat row: three stats, value 16px/600, `gap:24px`.
- Event-type badge `#e3f2fd/#1565c0`; note-type badge `#f3e5f5/#7b1fa2`; capture ✓ checkmarks `#2e7d32`.
- Walk-in widget: dashed border `1px dashed #ccc`, bg `#fafafa`, radius 8px; email input + "Search CRM" button `#0176d3`.

## Content (luxury-adapted; Tony to red-line)
- Customer: **Sarah Chen** — identity "known", **Platinum**, member since 2012 (~12 yrs), points e.g. 48,200.
- Walk-in email: `sarah.chen@email.com` (first/last empty initially).
- Bantō greeting (agent bubble): "Welcome back, Sarah — wonderful to see you at the maison again. Twelve years with Maison Tachibana; thank you. How can I help today?"
- Consultation note (type "Observation"): **"Sarah mentioned she's got a wedding in Kyoto this fall — she's attending as a guest, not the bride."**
- Life Event card (stated): "Wedding — Kyoto · this fall" + inferred needs italic: "guest attire, gifting, travel essentials" (NOT bridal).
- Co-pilot recompose bubble + capture notifications: "✓ Life Event written to profile", "✓ Follow-up task created: white-glove check-in before the event"; suggestion chips: "Show gift edit", "Build travel kit", "Schedule follow-up".

## Beats (renderBeat index → visible state)
- **0 (initial):** console shell + walk-in widget in center (email field focused), empty right co-pilot ("Select a customer to start"), no active-customer pill, no action bar.
- **1 walk-in:** email `sarah.chen@email.com` filled; "Search CRM" shown pressed → brief "Resolving identity…" state.
- **2 Merkury enrichment:** walk-in widget replaced by compact profile header (name + "known" + "Platinum") and profileSection360 with Loyalty section expanded + provenance badges; header center shows active-customer pill "Sarah Chen"; action bar appears.
- **3 Bantō greeting:** co-pilot session goes "Active" (gradient header), quick-action chips appear, greeting agent bubble streams in.
- **4 capture:** Quick Note widget shows the wedding note text + type "Observation"; "Add" pressed → note appears in profileSection360 Consultation Notes with purple note badge + timestamp.
- **5 recompose:** Meaningful Events gains the Life Event card (stated badge) + inferred needs; Staff Picks recomposes (guest attire / gift curation / travel kit); co-pilot posts recompose bubble with two ✓ capture notifications + suggestion chips.

`total = 5`. Back-arrow rewinds each beat (state is recomputed from index, not mutated forward-only).

## File structure
| File | Responsibility |
|------|----------------|
| `demo/salesforce/clienteling/index.html` | Markup for all 5 beat states + `renderBeat` wiring |
| `demo/salesforce/clienteling/clienteling.css` | Faithful SLDS-like styling per fidelity anchors |
| `demo/salesforce/_shared/slds-lite.css` (optional) | Shared tokens/util classes reused by Scene 3 |

## Tasks
- [ ] **Task 1:** Build the static console shell + CSS (header `#1a1a2e`, 3 columns, co-pilot gradient) with all beat-state DOM present but hidden via `data-beat` visibility classes. Verify structurally (open in browser via local server, no console errors, no network).
- [ ] **Task 2:** Implement `renderBeat(index)` to drive beat visibility/streaming using `startSceneRuntime({ total: 5, renderBeat })`. Each beat shows the cumulative state for that index; rewinding to a lower index hides later additions. Verify the page loads and `renderBeat(0..5)` produce the right visible states (manually call in console).
- [ ] **Task 3 (integration — DEFERRED to the serial deck pass):** add the demo `<section>` with `.demo-window` (URL bar `tachibana.lightning.force.com` / "Maison Tachibana — Clienteling") + iframe `demo/salesforce/clienteling/index.html`. NOT done in this plan to avoid deck-file conflicts with parallel scene builds.

## Verification
- Served offline, the page steps through 6 states (0..5) via `renderBeat`; zero network requests; visuals match the fidelity anchors.
- Embedded later: arrow-keys step the 5 beats then release to the next slide (validated in the serial integration pass with Playwright).
