# Fo Companion (Pip)

A tiny, installable companion app for [Fo](https://wajo.ai), the Wajo AI
assistant: a Coucou-style mascot plus chat, tasks and notifications, talking
to Fo through Wajo's official MCP server (`https://mcp.api.wajo.ai/fo`) with
OAuth (PKCE, dynamic client registration, rotating refresh tokens). No build
step. Your tokens live in your browser.

## Run it locally

```
python3 serve.py          # http://localhost:8000
```

`serve.py` also proxies `/api/*` to Wajo, because browsers refuse direct
cross-origin calls to Wajo's API (it sends no CORS headers). Open
http://localhost:8000, click **Connect to Fo**, approve in your Wajo account.

## Deploy hosted (phone install)

Use Vercel - `npx vercel` from this folder, done. The `api/mcp.js` edge
function in this repo is the same-origin helper; zero extra config. Then open
the URL on your phone and "Add to Home screen".

GitHub Pages can host the code but **not** Connect (it is static-only and
cannot serve the proxy), so use Vercel or the local server for actually
running the app.

## What's inside

- **Chat** with Fo (`ask_fo`, polling long turns automatically)
- **Tasks**: live list from Fo's task store
- **Tools**: call *any* tool Fo's MCP server exposes, with generated sample args
- **Pip**, the mascot: eyes follow your pointer, blinks, changes state
  (working / alert / happy)
- **Notifications**: while the app is open it checks tasks every minute,
  desktop notification + app badge on change
- OAuth handled entirely in the browser; disconnect any time in Settings

## Notes

- The OAuth redirect must be `https://` (your deployed URL) or a loopback
  (`http://localhost`). A LAN address is refused by Wajo.
- The Fo MCP server may require a Wajo account tier with MCP access; if the
  consent screen refuses, that gate is on Wajo's side.

MIT licensed.
