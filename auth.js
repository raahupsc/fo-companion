// OAuth (PKCE + dynamic client registration) against Wajo's Fo MCP server.
const ISSUER = "https://mcp.api.wajo.ai";
const LS_KEY = "fo-companion-tokens";
const LS_CLIENT = "fo-companion-client";

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkcePair() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(digest) };
}

export function getTokens() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; }
}
export function saveTokens(t) { localStorage.setItem(LS_KEY, JSON.stringify(t)); }
export function clearTokens() { localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_CLIENT); }
export function connected() { const t = getTokens(); return !!(t && t.access_token && Date.now() < (t.expires_at || 0) - 10000); }

export function clientId() { return localStorage.getItem(LS_CLIENT) || null; }

async function serverMeta() {
  const res = await fetch(ISSUER + "/.well-known/oauth-authorization-server");
  if (!res.ok) throw new Error("Could not read Wajo's OAuth metadata (" + res.status + ")");
  return res.json();
}

// Register this app as a client on the fly, once per browser.
async function registerClient() {
  const meta = await serverMeta();
  // The redirect lands back on this app's own URL (works at a subpath, e.g. GitHub Pages).
  const base = location.pathname.endsWith("/") ? location.pathname : location.pathname.replace(/[^/]*$/, "") + "/";
  const redirect = location.origin + base;
  sessionStorage.setItem("fo-redirect", redirect);
  const res = await fetch(meta.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Fo Companion",
      redirect_uris: [redirect],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp",
    }),
  });
  if (!res.ok) throw new Error("Client registration failed (" + res.status + ")");
  const body = await res.json();
  if (!body.client_id) throw new Error("Registration returned no client_id");
  localStorage.setItem(LS_CLIENT, body.client_id);
  return { meta, redirect };
}

// Start the browser dance: register, then bounce to Wajo's consent screen.
export async function connect() {
  const { meta, redirect } = await registerClient();
  const { verifier, challenge } = await pkcePair();
  sessionStorage.setItem("fo-pkce", verifier);
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem("fo-state", state);
  const url = new URL(meta.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: redirect,
    scope: "mcp",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  location.assign(url.toString());
}

// Called when the app loads with ?code=&state= back from Wajo.
export async function handleCallback(params) {
  const code = params.get("code");
  const state = params.get("state");
  const expected = sessionStorage.getItem("fo-state");
  if (!code || !state || state !== expected) throw new Error("Bad OAuth callback (state mismatch)");
  const verifier = sessionStorage.getItem("fo-pkce");
  const meta = await serverMeta();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: sessionStorage.getItem("fo-redirect") || location.origin + "/",
    client_id: clientId(),
    code_verifier: verifier,
  });
  const res = await fetch(meta.token_endpoint, { method: "POST", body });
  if (!res.ok) throw new Error("Token exchange failed (" + res.status + "): " + (await res.text()).slice(0, 200));
  const tok = await res.json();
  persist(tok);
  sessionStorage.removeItem("fo-pkce");
  sessionStorage.removeItem("fo-redirect");
  sessionStorage.removeItem("fo-state");
  return tok;
}

function persist(tok) {
  saveTokens({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: Date.now() + (tok.expires_in || 3600) * 1000,
  });
}

export async function refresh() {
  const t = getTokens();
  if (!t || !t.refresh_token) throw new Error("not-connected");
  const meta = await serverMeta();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: t.refresh_token,
    client_id: clientId(),
  });
  const res = await fetch(meta.token_endpoint, { method: "POST", body });
  if (!res.ok) { clearTokens(); throw new Error("refresh-failed"); }
  const tok = await res.json();
  persist(tok); // refresh token rotates: store the new one
  return tok;
}

// Valid bearer token, refreshing when close to expiry.
export async function accessToken() {
  let t = getTokens();
  if (!t) throw new Error("not-connected");
  if (Date.now() < t.expires_at - 30000) return t.access_token;
  t = await refresh();
  return t.access_token;
}
