# Fo Companion (Pip)

A tiny, installable companion app for [Fo](https://wajo.ai), the Wajo AI
assistant: a Coucou-style mascot plus chat, tasks and notifications, talking
to Fo through Wajo's official MCP server (`https://mcp.api.wajo.ai/fo`) with
OAuth (PKCE, dynamic client registration, rotating refresh tokens). No build
step, no backend, no server: plain HTML/JS. Your tokens live in your browser.

## Run it locally

```
python3 serve.py          # http://localhost:8000  (loopback redirects are allowed)
```

Open http://localhost:8000, click **Connect to Fo**, approve in your Wajo
account, done.

## Deploy (phone + anywhere)

Any static host works. Vercel, for example:

```
npx vercel            # link once, then deploy
npx vercel --prod
```

On your phone, open the deployed URL, then "Add to Home screen" - it installs
like a native app (manifest, service worker, app badge included).

## GitHub Pages

1. Repo Settings > General > Danger Zone > Change visibility > **Public**
   (Pages needs a public repo on a free plan).
2. Settings > Pages > Source: **Deploy from a branch**, Branch `main`, folder `/ (root)`, Save.
3. Live at `https://<owner>.github.io/fo-companion/` - open it and "Add to Home screen".

The app registers its OAuth redirect against whatever URL it is served from,
so Pages subpaths work with no configuration.

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
