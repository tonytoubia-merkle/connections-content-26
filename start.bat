@echo off
REM ====================================================================
REM   CNX 2026 - run the deck locally (fully offline). Windows.
REM   Double-click this file. It starts a tiny local web server and
REM   opens the deck in your browser. No internet needed.
REM   Requires Python 3 (get it from python.org). Keep this window open
REM   during the talk; close it (or press Ctrl+C) to stop.
REM ====================================================================
cd /d "%~dp0"
set PORT=8080
set URL=http://127.0.0.1:%PORT%/cnx-2026-agentic-luxury.html

echo.
echo   Serving the CNX 2026 deck at:
echo     %URL%
echo.
echo   Keep this window open during the demo.
echo   Press Ctrl+C (or close this window) to stop the server.
echo.

REM Open the browser a couple seconds after the server comes up.
start "" cmd /c "timeout /t 2 >nul & start """" %URL%"

REM Start the static server (try the py launcher, then python).
py -m http.server %PORT% --bind 127.0.0.1 2>nul
if errorlevel 1 python -m http.server %PORT% --bind 127.0.0.1 2>nul
if errorlevel 1 (
  echo.
  echo   Python was not found.
  echo   Install Python 3 from https://python.org - or, if you have Node, run:  npx serve
  echo.
  pause
)
