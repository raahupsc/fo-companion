// Vercel Edge Function: same-origin proxy to Wajo's Fo MCP server.
// Browsers block direct cross-origin calls to the API (no CORS headers),
// so a hosted deployment needs this helper on its own origin.
export const config = { runtime: "edge" };

const UPSTREAM = "https://mcp.api.wajo.ai";

export default async function handler(req) {
  const url = new URL(req.url);
  if (url.pathname === "/api/ping") {
    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  }
  const path = url.pathname.replace(/^\/api/, "") + url.search;
  const headers = new Headers(req.headers);
  headers.delete("host");
  const res = await fetch(UPSTREAM + path, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    // @ts-ignore
    duplex: "half",
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
}
