# /videos

Drop demo MP4s here using these exact filenames:

- `agentic-commerce.mp4` → slide T3
- `agentic-clienteling.mp4` → slide T4
- `agentic-marketing.mp4` → slide T5

## Encoding recommendation

- **Codec:** H.264 video, AAC audio
- **Container:** MP4
- **Resolution:** 1280×720 or 1920×1080
- **Bitrate:** 3–5 Mbps is plenty for stage playback
- **File size:** Keep each under ~50 MB if possible. GitHub has a 100 MB hard limit per file; anything over that needs to be hosted elsewhere.

## Quick re-encode

HandBrake preset: **Web → Web Optimized 1080p30 (or 720p30)**. Bitrate around 4000 kbps. Web optimized = "moov atom" at the start, which makes the video begin playing immediately instead of buffering the whole file first.

ffmpeg one-liner if you prefer:

```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -movflags +faststart agentic-commerce.mp4
```

## If you need to host videos elsewhere

If your videos are too large for the repo (or you want them on a CDN), update the `<source src="...">` lines in `video.html` to point at the absolute URL — e.g. `<source src="https://your-cdn.com/agentic-commerce.mp4" type="video/mp4">`. Everything else still works.
