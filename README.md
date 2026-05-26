# Tachibana — AI Retail Advisor

Tony Toubia's section of the joint Merkle × Salesforce session at **Connections 2026** (Session 1787, June 4, 1:00 PM CT).

Two editions of the same six-slide deck:

- **`mockup.html`** — static editorial mockups for T3, T4, T5 (storefront, clienteling console, journey timeline). Safe to present anywhere, no dependencies.
- **`video.html`** — same deck, but T3, T4, T5 are 16:9 video stages. Drop MP4s into `/videos` and they swap in automatically.
- **`index.html`** — a simple landing page that lets you share one URL and pick which edition to open.

## Local use

Either HTML file works as a standalone static page. Open it in Chrome/Safari/Firefox; press **F** for fullscreen; use **← / →** (or PageUp/PageDown, common with stage clickers) to navigate.

## Adding demo videos (video edition only)

1. Encode your demos as **H.264 MP4**, ideally 1280×720 or 1920×1080, under ~50 MB each for fast local playback.
2. Place them in the `videos/` folder with these exact names:
   - `videos/agentic-commerce.mp4` → slide T3
   - `videos/agentic-clienteling.mp4` → slide T4
   - `videos/agentic-marketing.mp4` → slide T5
3. Open `video.html`. The placeholders are now replaced by your videos.

If a file is missing or the path is wrong, the elegant placeholder reappears automatically — the slide will still look intentional on stage.

## Deploy to GitHub Pages

### Quickest path (web UI)

1. Sign in to GitHub.
2. Click **New repository** → name it whatever you want (e.g. `cnx-2026-tachibana`). **Public.** No need to add README/.gitignore (this folder already has them).
3. On the empty-repo screen, click **uploading an existing file** in the helper line.
4. Drag the **contents of this folder** (not the folder itself) into the upload area. Commit.
5. Go to **Settings → Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **`main`** / `/ (root)`. Save.
6. Wait ~30 seconds. Your URL will be `https://<your-username>.github.io/<repo-name>/`.

Share that URL — visitors land on `index.html` and can pick the mockup or video edition.

### CLI path

```bash
# from inside this folder
git init
git add .
git commit -m "Tachibana deck — Connections 2026"
git branch -M main
git remote add origin git@github.com:<your-username>/<repo-name>.git
git push -u origin main
```

Then enable Pages in **Settings → Pages** as above.

### After videos are added

```bash
git add videos/
git commit -m "Add demo videos"
git push
```

Pages will redeploy within a minute. **Important caveat:** GitHub has a soft 100 MB file size limit and the recommended repo total is under 1 GB. If your MP4s push you near that, either compress them harder (HandBrake → Web Optimized → ~3–5 Mbps is plenty for a stage demo) or host the videos elsewhere (S3, Cloudflare R2, Vimeo) and update the `<source src="...">` paths in `video.html` to point at those URLs.

## Stage day loadout

- **Primary**: open the GitHub Pages URL on your laptop, press F for fullscreen.
- **Backup**: keep `mockup.html` on a USB drive — it will always look polished, no network needed.
- **Worst case mid-session**: if a video fails to load, the placeholder reappears (defensive fallback is built in) and the slide still reads as designed.

## File tree

```
.
├── index.html         # landing chooser
├── mockup.html        # v1 (static mockups)
├── video.html         # v2 (video stages)
├── videos/            # MP4s go here (video edition only)
│   └── README.md
├── .nojekyll          # tells GitHub Pages to skip Jekyll
├── .gitignore
└── README.md          # this file
```

## Match Chris Serger's deck

Chris's deck is at `chrisserger.github.io/cnx-prep-38b6ac55/`. You can host yours the same way — a single `https://<your-username>.github.io/<repo-name>/` URL — and the two pieces will read as siblings, same dark editorial aesthetic, same scroll-to-snap navigation.
