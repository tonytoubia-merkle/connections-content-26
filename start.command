#!/bin/bash
# ════════════════════════════════════════════════════════════════════
#  CNX 2026 — run the deck locally (fully offline). macOS / Linux.
#  Double-click this file. It starts a tiny local web server and opens
#  the deck in your browser. No internet needed.
#  Requires Python 3 (preinstalled on macOS). Leave this window open
#  during the talk; close it (or press Ctrl+C) to stop.
# ════════════════════════════════════════════════════════════════════
cd "$(dirname "$0")" || exit 1
PORT=8080
URL="http://127.0.0.1:${PORT}/cnx-2026-agentic-luxury.html"

echo ""
echo "  Serving the CNX 2026 deck at:"
echo "    $URL"
echo ""
echo "  Keep this window open during the demo."
echo "  Press Ctrl+C (or just close this window) to stop the server."
echo ""

# Open the browser shortly after the server comes up.
( sleep 1; open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true ) &

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT" --bind 127.0.0.1
else
  echo "  Python was not found."
  echo "  Install Python 3 from https://python.org — or, if you have Node, run:  npx serve"
  echo ""
  read -r -p "  Press Enter to close..."
fi
