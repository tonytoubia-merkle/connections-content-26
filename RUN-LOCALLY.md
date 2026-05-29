# Run the CNX 2026 deck locally (offline)

The deck is **not** a single file — it loads local assets and three embedded
sub-pages (the Salesforce scenes + the full Tachibana app build). So it needs to
be **served over `http://`**, not opened by double-clicking the `.html` (browsers
block the module scripts + iframes under `file://`). Once you have this folder it
runs **100% offline** — no internet required.

## Easiest: one double-click
- **macOS:** double-click **`start.command`**
- **Windows:** double-click **`start.bat`**

It starts a tiny local server and opens the deck. Leave the window open during the
talk; close it (or press Ctrl+C) to stop. Requires **Python 3** (preinstalled on
macOS; on Windows get it from https://python.org).

> macOS note: if double-clicking `start.command` does nothing, it lost its
> executable bit (common after a ZIP download). Fix once in Terminal:
> `chmod +x start.command` — then double-click works. (You may also need to
> right-click → Open the first time to clear Gatekeeper.)

## Manual (any OS with Python or Node)
From this folder:
```
python -m http.server 8080        # or:  npx serve
```
Then open: http://127.0.0.1:8080/cnx-2026-agentic-luxury.html

## Getting this folder onto another device
GitHub → the repo → **Code ▸ Download ZIP** (or `git clone`), unzip, then use a
launcher above. (It's ~90 MB because the Tachibana storefront build is bundled.)

## Pages
If the device has internet, you can skip all of this and just open the hosted URL:
https://tonytoubia-merkle.github.io/connections-content-26/cnx-2026-agentic-luxury.html

## In the deck
Arrow keys (or a clicker), **click**, or **scroll** all advance — beats within a
demo scene, then on to the next slide. Press **F** for fullscreen.
