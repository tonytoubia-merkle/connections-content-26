# Tachibana Scripted In-Slide Demo — Design Spec

**Date:** 2026-05-29
**Author:** Tony Toubia (with Claude)
**Repo:** `connections-content-26` (the CNX 2026 deck)
**Related repo:** `agentforce-retail-advisor` (the real Tachibana app + Salesforce metadata)
**Talk:** Salesforce Connections 2026, Session 1787 — Merkle × Salesforce, June 4

---

## 1. Problem & Goal

The deck `cnx-2026-agentic-luxury.html` currently represents the live demo with three
static PNG mockups (`mockup-commerce.png`, `mockup-clienteling.png`, `mockup-marketing.png`).
They look simulated and do not match the real Tachibana product
(`agentforce-retail-advisor`, live at `tachibana.demo-combobulator.com`).

**Goal:** replace those mockups with a **scripted, fully-offline, in-slide demo** that is
visually identical to the real product and performs only the actions we want, on cue.

### Hard constraints

- **Primary on-stage demo.** This *is* what is presented live — not a backup, not a preview.
- **Fully simulated / offline.** No live or trusted network at the venue. Zero backend,
  zero LLM calls, zero remote assets. The agent conversation is **replayed from a script**,
  not generated.
- **Embedded directly in the slides.** No alt-tabbing to a separate app or URL. The
  browser-like demo renders *inside* the deck's existing slide framework and is driven by
  the same arrow-key navigation.
- **Step-through control.** Each arrow-key press advances exactly **one beat** of the
  scripted scene; back-arrow rewinds a beat. Pacing is in the presenter's hands, but the
  content is fully canned and repeatable.

---

## 2. Key findings that shape the design

- The real app already runs its storefront, personas, products, and campaigns on **golden
  template mocks** when no backend is configured (`src/services/demoData/demoDataService.ts`).
- A **mock mode** exists and is pervasive (`VITE_USE_MOCK_DATA`, used across
  `ConversationContext`, `CustomerContext`, `DemoContext`, etc.) with a canned
  **Mock Agent Service** (`src/services/mock/mockAgent.ts`).
- A **Scene system** already exists (`src/types/scene.ts`, `SceneContext`): the live agent
  normally emits *directives* (`{ action, payload }`) that drive scene transitions
  (layout, background, product set, checkout state). Offline, we replace the agent with a
  **scripted directive sequence**.
- **Product images are local** (0 remote URLs, ~260 local `/assets` references in the
  product mock) → offline is genuinely feasible.
- The **Salesforce side is real source**, not a black box: `agentforce-retail-advisor/salesforce/force-app/main/default/lwc/`
  contains full LWC components that map onto our scenes (see §5). We rebuild the Salesforce
  surfaces from these templates + SLDS, using screenshots as a confirmation/polish pass.

---

## 3. Architecture

Two screen **sources**, one **embedding/control** model.

### Source A — Tachibana customer-facing surfaces
The on-site storefront (Scene 2) and the customer-facing result of Marketing (Scene 3, customer side).
- A dedicated **offline "presentation build"** of `agentforce-retail-advisor`:
  `VITE_USE_MOCK_DATA` forced on; the live agent replaced by a **scripted directive player**
  that drives the existing Scene system through a fixed sequence of beats; relative base path.
- Built to static assets and committed to `connections-content-26/demo/tachibana/`.
- Scenes addressed by hash, e.g. `demo/tachibana/#scene=commerce`.
- Fidelity is exact by construction — these are the real components.

### Source B — Salesforce surfaces
The clienteling console (Scene 1) and the Marketing/journey side (Scene 3, Salesforce side).
- Static HTML/CSS **rebuilt from the real LWC templates + SLDS**, committed to
  `connections-content-26/demo/salesforce/` (e.g. `clienteling.html`, `journey.html`).
- We reproduce only the **scripted states** we need; LWC data-binding/Apex do not run
  offline and are not needed.
- Screenshots used to confirm exact look.

### Embedding & control (shared)
- Each demo slide renders a **browser-chrome frame** (window chrome + a URL bar showing
  `tachibana.demo-combobulator.com` or a Salesforce Lightning URL) wrapping an `<iframe>`
  pointed at the relevant scene.
- **Demo-bridge** (small script in the deck): while on a demo slide, ArrowRight/ArrowLeft
  send `postMessage('demo:advance' | 'demo:rewind')` into the iframe. The iframe posts back
  `demo:scene-complete` (and `demo:scene-start`) so the deck knows when to release navigation
  back to normal slide movement.
- **Shared step player:** a tiny module holding an ordered list of beats per scene; each beat
  applies one deterministic state change (type text, stream a reply token-by-token, swap
  products, write a Life Event, animate a toast). No timing depends on the network.
- Everything is served from the deck's own origin → **works on a dead venue connection.**

---

## 4. Scenes (beat-by-beat)

On-stage causal order: **Clienteling (capture) → Commerce (on-site) → Marketing (journey)**.
The deck's roadmap slide is re-sequenced and the I/II/III labels renumbered to match.
Through-line: *one event, captured in the boutique, reused on-site, orchestrated across
channels — one customer, one profile, three surfaces.*

### Scene 1 · Boutique — Agentic Clienteling — "the capture"  *(Salesforce surface)*
1. **Walk-in.** Bantō starts a walk-in with just Sarah's **email address**. → `walkInCapture`
2. **Merkury enrichment.** Identity resolves; Merkury returns a suite of data — Platinum,
   12-yr loyal, preferences, household — with **provenance badges**.
   → `profileSection360` / `customerProfilePanel` / `provenanceBadge`
3. **Personalized opening.** Now informed, the Bantō greets Sarah by name, in context.
   → `agentCopilotPanel`
4. **Event capture.** Note logged: *"Sarah mentioned she's got a wedding in Kyoto this fall"* —
   she is **attending as a guest, not the bride** — which writes a **Life Event** to the
   unified profile (provenance shown). → `consultationNoteCapture`
5. **Recompose + handoff.** Console surfaces an Upcoming Event card, inferred needs
   (**guest attire, gifting, travel** — not bridal), and a white-glove follow-up task.
   → `clientellingConsole`

### Scene 2 · On-site — Agentic Commerce — "the page is the agent"  *(Tachibana storefront)*
1. Sarah lands on Maison Tachibana — **already composed around the wedding** (from Scene 1):
   occasion-aware hero, a curated edit. *It never re-asks.*
2. Sarah asks the on-page Bantō (e.g. *"Something for the rehearsal dinner."*) → canned reply
   streams; storefront recomposes (hero/grid swaps).
3. Bantō surfaces a recommendation **with rationale tied to the captured event + her history**;
   Platinum perk noted.
4. Frictionless **add-to-bag / checkout overlay** — stored profile, no forms re-asked.

### Scene 3 · Agentic Marketing — "the journey composes itself"  *(both surfaces)*
1. **Salesforce side:** off the *same* captured event, a **journey assembles itself** — an
   orchestration canvas auto-populates channel steps (email, push, ads, clienteling follow-up);
   audience = Sarah, a segment of one.
   → `marketingConciergeHome` / `campaignPlannerPage` / `journeyFlowOverview`
2. Each touch **composes** — the personalized creative/email generated for Sarah, tied to a
   campaign/UTM. → `journeyEmailPreview` / `journeyApprovalCard`
3. **Customer side (Tachibana):** the resulting touch as Sarah experiences it (personalized
   email / continued visit).
4. Close on the through-line: *one captured event → orchestrated across surfaces, governed by
   the trust layer + one unified profile.*

---

## 5. Salesforce surface → LWC source mapping

| Scene | Salesforce LWC components (source of truth) |
|-------|---------------------------------------------|
| 1 · Clienteling | `walkInCapture`, `customerLookup`, `profileSection360`, `customerProfilePanel`, `provenanceBadge`, `agentCopilotPanel`, `consultationNoteCapture`, `clientellingConsole` |
| 3 · Marketing | `marketingConciergeHome`, `campaignPlannerPage`, `journeyFlowOverview`, `journeyEmailPreview`, `journeyApprovalCard`, `journeyApprovalDashboard`, `marketerInbox` |

Located at `agentforce-retail-advisor/salesforce/force-app/main/default/lwc/`. Each is a full
component (`.html` / `.css` / `.js`). We port the templates + styles to static HTML/CSS and
drive the scripted states with the shared step player.

---

## 6. Content & voice

- **Customer:** Sarah Chen — Platinum, 12-yr loyal, Merkury-matched. **Attending** a friend's
  wedding in Kyoto this fall (~42 days out). *Not the bride* → edit skews to guest attire,
  gifting, and travel, never bridal.
- **Agent:** the **Bantō** — Maison Tachibana's conversational concierge.
- **Bantō lines & product picks:** drafted by Claude in the Maison Tachibana voice, for Tony
  to edit. Grounded in the real luxury storefront variant (`Storefront/luxury`,
  `LuxuryCheckoutPage`) and existing mocks.

---

## 7. Offline asset strategy

- Vendor all images locally (product images are already local; copied into the build).
- Bundle fonts (Salesforce Sans, Cormorant Garamond, etc.) and SLDS CSS locally.
- Gradient fallbacks (already defined in the Scene types) for any generative backgrounds.
- Net: **zero network requests at runtime.** Verified with the network physically off.

---

## 8. Build & integration pipeline

- **Tachibana build:** a dedicated offline build config in `agentforce-retail-advisor`
  (mock mode forced, scripted player wired in, relative base path). Output copied/committed
  to `connections-content-26/demo/tachibana/` via a **documented, repeatable rebuild command**.
- **Salesforce build:** hand-ported static pages in `connections-content-26/demo/salesforce/`.
- **Deck:** new/updated demo slides in `cnx-2026-agentic-luxury.html`, each with a
  browser-chrome frame + iframe; the demo-bridge script added to the deck; roadmap slide
  re-sequenced to Clienteling → Commerce → Marketing.

---

## 9. Verification

- The demo build runs with the network physically disabled (or all fetch blocked).
- All three scenes step start→finish using only the arrow keys; back-arrow rewinds.
- Visual diff of each surface against the live site / Tony's screenshots.
- The full deck still navigates cleanly with the demo slides embedded (no regressions to
  existing slides or the existing keyboard handler).

---

## 10. Risks & trade-offs

- **Snapshot drift.** The embedded Tachibana build is a point-in-time snapshot of the real
  app, kept in sync manually via the rebuild command. Acceptable for a fixed-date talk.
- **LWC → static is not automatic.** We reproduce the rendered states we need, not full
  component logic (no Apex/data-binding offline). Acceptable since we only need scripted states.
- **First-paint backend assumptions.** Must verify the Tachibana offline build has no hard
  backend dependency on first paint (mock mode should cover it; verify explicitly).
- **Keyboard handler coupling.** The demo-bridge must cooperate with the deck's existing
  arrow-key handler without breaking normal slide navigation.

---

## 11. Open inputs from Tony (not blockers to planning)

- Screenshots of the live Salesforce clienteling console (Scene 1) and Marketing/journey
  views (Scene 3) for the confirmation/polish pass.
- Red-lines on the drafted Bantō lines and Sarah's product edit.

---

## 12. Out of scope

- Any live backend, LLM, or Salesforce connectivity during the talk.
- Reproducing full LWC/Apex behavior beyond the scripted states.
- Changes to the real `agentforce-retail-advisor` runtime (we add an isolated offline build path only).
