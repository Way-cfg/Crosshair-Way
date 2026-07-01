# Crosshair Way — Agent Guide

Windows-only Electron app providing a customizable transparent crosshair overlay for gamers.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Launch app (electron .) |
| `npm run dev` | Launch with `--dev` flag |
| `npm run build` | Package to `dist/` as NSIS + MSI via electron-builder |
| `npm run dist` | Build without publishing |

No test, lint, typecheck, or formatter scripts exist.

## Architecture

- **Main process**: `main.js` — Electron entrypoint, creates 2 `BrowserWindow`s + tray
- **Control panel**: `dashboard.html` + `dashboard.js` + `dashboard.css` — settings UI
- **Overlay**: `overlay.html` + `overlay.js` + `overlay.css` — transparent always-on-top crosshair (ignore mouse events)
- **IPC bridge**: `preload.js` — exposes `window.crosshairAPI` via contextBridge
- **Persistence**: `electron-store` (JSON, no DB)
- **Mouse hook**: `mouse-hook-child.ps1` — spawned PowerShell process running C# low-level mouse hook for zoom mode
- **No bundler/transpiler** — vanilla HTML, CSS, JS loaded directly by Electron

## Important Gotchas

- **`.gitignore` has `*.md`** — any Markdown files (including this one) are git-ignored. Use `git add -f AGENTS.md` to commit.
- **Two build systems coexist**: `electron-builder` (wired to all npm scripts) and `@electron-forge` (`forge.config.js` configured but unused). Prefer electron-builder.
- **Windows-only** (`win32`/`x64`). References `powershell.exe` and Win32 P/Invoke.
- **No CI/CD**, no tests, no linting.
- `dist/` and `dist_locked/` are build output dirs (gitignored).
- The "Default" profile cannot be deleted (enforced in both IPC handler and UI).
- Zoom mode uses a separate crosshair profile (`zoomProfileSettings`) — when entering zoom config mode, the UI switches to editing those settings and reverts on exit.
- Electron `contextIsolation: true`, `nodeIntegration: false` in both windows.
