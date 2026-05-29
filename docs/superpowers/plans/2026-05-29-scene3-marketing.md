# Scene 3 — Agentic Marketing (journey composes itself) Implementation Plan

> **For agentic workers:** built on the demo harness (Plan 1). Scene pages call `startSceneRuntime({ total, renderBeat })` from the shared runtime. Steps use `- [ ]`.

**Goal:** A self-contained, offline, step-through static replica of the Salesforce **Agentic Marketing / journey** side (rebuilt from the real LWCs), playing the "journey composes itself" scene for Sarah Chen's captured Kyoto-wedding Life Event, plus the customer-facing personalized email it produces.

**Architecture:** One static page `demo/salesforce/journey/index.html` (+ CSS), rebuilt from `journeyFlowOverview`, `journeyEmailPreview`, `marketerInbox`/`journeyApprovalCard`. Imports shared `scene-runtime.js`; `renderBeat(index)` reveals each beat. The customer-facing email preview is part of this page (the "both surfaces" requirement) — it does not need the Tachibana React build.

**Tech Stack:** Static HTML/CSS/JS (ESM), shared harness.

## Fidelity anchors (from real LWC source)
- Page bg `#f4f6f9`. Core palette: brand blue `#0176d3` / light `#1b96ff`; rose CTA `#f43f5e`; avatar/push gradient `linear-gradient(135deg,#fb7185,#a855f7)`; approved green `#2e844a`; Merkury media orange `#e65100`; text navy `#16325c`; border `#d8dde6`/`#e5e5e5`.
- **journeyFlowOverview:** white card radius 12px, shadow `0 4px 16px`; header with 48px avatar circle (pink→purple gradient, initials "SC"); contact name 18px/600; status badge "Pending Review"; event banner `linear-gradient(90deg,#fef3f2,#fdf2f8)` with countdown text `#f43f5e`.
- **Timeline (horizontal):** step nodes min-width 90px, border `2px solid #d8dde6` radius 12px; selected → border `#0176d3` + `box-shadow 0 0 0 3px rgba(1,118,211,.2)`; approved → border `#2e844a` bg `linear-gradient(#f0fdf4,#fff)`. Channel icon circles 40px: email `#1589ee→#0070d2`, push `#9050e9→#7526c2`, media `#e65100→#ff6d00`, sms `#04844b→#027e46`. Connectors: 3px line `#d8dde6→#0176d3`, 80px, with "+N days" delay label. End node "Complete" `#2e844a`.
- **journeyEmailPreview (email):** mock inbox header (brand "Maison Tachibana", To: Sarah…, bold subject); hero image with overlay (`linear-gradient(to bottom, rgba(0,0,0,.5)…transparent)`), hero headline serif 28px white, CTA `#f43f5e` (uppercase, letter-spacing 2px, radius 2px, "Shop Now"); letter body serif 15px/1.7 `#333`; inline product cards (80×80 img); signature "With love, / The Maison Tachibana Team" (brand color); dark footer `#2d2d2d` `#999`. (Re-brand the explorer's "BEAUTÉ" to **Maison Tachibana**.)
- **Push notification widget:** 360px white card radius 16px shadow; 44px icon (pink→purple gradient, "信" or "M"); app name uppercase `#999`; title 14px/600; body 13px `#666`.
- **marketerInbox row / journeyApprovalCard:** tier bar (left, 40px) Review-Required `linear-gradient(180deg,#1b96ff,#0070d2)`; contact name navy `#16325c`; urgency badge "This Month" (SLDS warning); steps badge `#0070d2` white; AI confidence badge `#eef4ff/#0070d2`; progress bar `linear-gradient(to right,#0176d3,#1b96ff)`; footer buttons Decline / Approve / Approve & Send (`#2e844a`).
- Font: load a serif for the email hero locally (e.g. Cormorant Garamond, already vendored in deck assets) — NO remote font fetch.

## Content (Sarah Chen, Kyoto wedding — Tony to red-line)
- Event banner: "Wedding — Kyoto, Japan · attending as guest" · date "this fall" · countdown "in 128 days".
- Audience callout: "Audience: Sarah Chen (1:1 segment) · Loyalty: Platinum".
- 4 steps: 1 Email (+0d) → 2 Push (+3d) → 3 Media/Ads (+7d) → 4 SMS clienteling follow-up (+14d).
- Email subject: "Sarah — your Kyoto edit, curated." Hero headline: "An occasion in Kyoto." Subheadline: "Pieces for the guest list, the gift, and the journey." Body references attending a friend's wedding; product cards = leather/atelier/travel pieces (luxury, not bridal/beauty).
- Approval: AI confidence e.g. 91%; "Approve All Steps" → all nodes green → "Send to Marketing Flow".

## Beats (renderBeat index)
- **0 initial:** journeyFlowOverview header + event banner; empty timeline track.
- **1 journey assembles:** the 4 channel nodes appear left→right (staggered) with connectors + delay labels; status "Pending Review"; audience 1:1 callout.
- **2 email composes:** step 1 selected; the journeyEmailPreview (full Maison Tachibana email with hero + products) renders in a preview area.
- **3 push/ads compose:** channel switch shows push notification widget (and a brief Merkury media/ads panel, orange).
- **4 approval handoff:** marketerInbox row / approval card with progress bar at 25%, "Approve All Steps" + "Approve & Send" footer.
- **5 sent:** all 4 nodes turn green (approved), status "Ready to Send" → "Send to Marketing Flow"; progress bar 100%; close on through-line caption "One captured event → orchestrated across channels."

`total = 5`. Beats are cumulative + reversible by index.

## File structure
| File | Responsibility |
|------|----------------|
| `demo/salesforce/journey/index.html` | All beat states + `renderBeat` wiring |
| `demo/salesforce/journey/journey.css` | Faithful styling per fidelity anchors |
| (reuses) `demo/salesforce/_shared/slds-lite.css` if created by Scene 1 |

## Tasks
- [ ] **Task 1:** Build journeyFlowOverview shell + timeline + event banner CSS, with the 4 nodes present (hidden until beat 1). Verify offline, no errors/network.
- [ ] **Task 2:** Build the journeyEmailPreview email block (hero, body, products, footer) + push widget + approval card/progress, all hidden behind beats. Re-brand to Maison Tachibana; vendor/serve serif font locally.
- [ ] **Task 3:** Wire `startSceneRuntime({ total: 5, renderBeat })`; renderBeat reveals cumulative beat state and animates node assembly/approval. Verify `renderBeat(0..5)` states in console.
- [ ] **Task 4 (integration — DEFERRED to serial deck pass):** add deck `<section>` (URL bar "Maison Tachibana — Marketing Cloud") + iframe. Not done here (avoids deck-file conflict).

## Verification
- Served offline: steps through 6 states; zero network; visuals match anchors; email reads as Maison Tachibana (no leftover "BEAUTÉ"/beauty copy).
- Embedded later in the serial pass (Playwright arrow-key validation).
