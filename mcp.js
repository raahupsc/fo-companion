// Minimal MCP client (Streamable HTTP / JSON-RPC) for Wajo's Fo server.
import { accessToken, refresh } from "./auth.js";

const ISSUER = "https://mcp.api.wajo.ai";
const DIRECT = ISSUER + "/fo";
const PROXY = "/api";
let endpoint = null;
async function pickEndpoint() {
  if (endpoint) return endpoint;
  try { if ((await fetch(PROXY + "/ping")).ok) { endpoint = PROXY + "/fo"; return endpoint; } } catch {}
  endpoint = DIRECT;
  return endpoint;
}
let sessionId = null;
let nextId = 1;

async function rpc(method, params, isNotification = false) {
  const token = await accessToken();
  const body = { jsonrpc: "2.0", method };
  if (!isNotification) body.id = nextId++;
  if (params) body.params = params;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: "Bearer " + token,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(await pickEndpoint(), { method: "POST", headers, body: JSON.stringify(body) });

  if (res.status === 401) {
    await refresh(); // one retry with a fresh token
    return rpc(method, params, isNotification);
  }
  if (res.headers.get("mcp-session-id")) sessionId = res.headers.get("mcp-session-id");
  if (res.status === 202 || isNotification) return null;

  const type = res.headers.get("content-type") || "";
  let payload;
  if (type.includes("text/event-stream")) {
    payload = await readSse(res);
  } else {
    payload = await res.json();
  }
  if (!res.ok && !payload) throw new Error("MCP call failed (" + res.status + ")");
  if (payload && payload.error) throw new Error(payload.error.message || JSON.stringify(payload.error));
  return payload ? payload.result : null;
}

// Server may answer with Server-Sent Events; the useful frame is data: {...}
async function readSse(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
  }
  for (const line of buf.split("\n")) {
    if (line.startsWith("data:")) {
      try { return JSON.parse(line.slice(5).trim()); } catch {}
    }
  }
  throw new Error("Could not read the server's streamed reply");
}

export async function ensureSession() {
  await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "fo-companion", version: "1.0.0" },
  });
  await rpc("notifications/initialized", undefined, true);
}

export async function listTools() {
  const r = await rpc("tools/list", {});
  return (r && r.tools) || [];
}

export async function callTool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args || {} });
  const parts = (r && r.content) || [];
  const text = parts.filter(p => p.type === "text").map(p => p.text).join("\n");
  return text || JSON.stringify(r);
}
