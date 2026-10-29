import { connect, connected, handleCallback, clearTokens, getTokens } from "./auth.js";
import { ensureSession, listTools, callTool } from "./mcp.js";
import { createMascot } from "./mascot.js";

const $ = sel => document.querySelector(sel);
let mascot, tools = [], tab = "chat", pollTimer = null, lastTaskKey = "";

const routes = {
  chat: renderChat, tasks: renderTasks, tools: renderTools, settings: renderSettings,
};

function boot() {
  const params = new URLSearchParams(location.search);
  if (location.pathname.endsWith("/oauth/callback") || params.get("code")) {
    handleCallback(params)
      .then(() => { history.replaceState(null, "", "/"); route("chat"); })
      .catch(err => {
        document.body.innerHTML = `<div class="center card" style="margin:40px auto;max-width:480px">
          <h2>Connection failed</h2><p class="dim">${err.message}</p>
          <button class="primary" onclick="location.replace('/')">Try again</button></div>`;
      });
    return;
  }
  mascot = createMascot($("#pip-wrap"));
  if (connected()) { ensureSession().then(loadTools).catch(()=>{}); route("chat"); startPolling(); }
  else renderConnect();
}

function renderConnect() {
  $("#view").innerHTML = `<div class="center">
    <p style="font-size:40px;margin:0">🫧</p>
    <h2>Pip, a little mochi companion for Fo</h2>
    <p class="dim" style="max-width:340px">Installable on your phone or desktop. Talks to Fo through Wajo's official MCP connection: chat, tasks, notifications, and every Fo tool.</p>
    <button class="primary" id="connect">Connect to Fo</button>
    <p class="dim">Uses Wajo's OAuth. Your tokens stay in this browser.</p>
  </div>`;
  $("#connect").onclick = () => connect().catch(e => toast(e.message));
}

async function loadTools() {
  tools = await listTools();
  renderToolList();
}

/* ---------- routing ---------- */
function route(name) {
  tab = name;
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  (routes[name] || renderChat)();
}
document.querySelectorAll("nav button").forEach(b => b.onclick = () => route(b.dataset.tab));

/* ---------- chat ---------- */
let chatLog = JSON.parse(localStorage.getItem("fo-chat") || "[]");
function renderChat() {
  $("#view").innerHTML = `
    <div class="chat" id="chat">${chatLog.map(m => `<div class="msg ${m.role}">${esc(m.text)}</div>`).join("")}</div>
    <div class="chatbar"><textarea id="say" placeholder="Ask Fo anything…"></textarea>
      <button class="primary" id="send">Send</button></div>`;
  $("#send").onclick = sendChat;
  $("#say").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  const c = $("#chat"); c.scrollTop = c.scrollHeight;
}

function findTool(re) { return tools.find(t => re.test(t.name)); }

async function sendChat() {
  const text = $("#say").value.trim();
  if (!text) return;
  chatLog.push({ role: "you", text }); saveChat(); renderChat();
  mascot && mascot.setState("working");
  try {
    if (!tools.length) tools = await listTools();
    const ask = findTool(/ask_fo/) || tools[0];
    let reply = await callTool(ask.name, guessArgs(ask, text));
    // Long Fo turns may return "working": poll the reply tool if one exists.
    if (/status.*working|still working/i.test(reply)) {
      const get = findTool(/get_fo_reply|reply/);
      if (get) for (let i = 0; i < 40; i++) {
        await sleep(3000);
        reply = await callTool(get.name, guessArgs(get, text));
        if (!/status.*working|still working/i.test(reply)) break;
      }
    }
    chatLog.push({ role: "fo", text: reply }); saveChat();
    mascot && mascot.setState("happy");
  } catch (e) {
    chatLog.push({ role: "fo", text: "⚠️ " + e.message }); saveChat();
    mascot && mascot.setState("alert");
  }
  renderChat();
}
function guessArgs(tool, text) {
  const props = tool.inputSchema && tool.inputSchema.properties || {};
  if (props.message) return { message: text };
  if (props.prompt) return { prompt: text };
  if (props.query) return { query: text };
  return { [Object.keys(props)[0] || "message"]: text };
}
function saveChat() { localStorage.setItem("fo-chat", JSON.stringify(chatLog.slice(-60))); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- tasks ---------- */
async function renderTasks() {
  $("#view").innerHTML = `<div class="card"><span class="dim">Loading tasks…</span></div>`;
  try {
    if (!tools.length) tools = await listTools();
    const t = findTool(/list_tasks/);
    if (!t) { $("#view").innerHTML = `<div class="card">No task tool found on Fo's MCP server yet.</div>`; return; }
    const raw = await callTool(t.name, {});
    $("#view").innerHTML = `<div class="card"><h3 style="margin:0 0 8px">Your tasks</h3>${renderTaskList(raw)}</div>`;
  } catch (e) { $("#view").innerHTML = `<div class="card">⚠️ ${esc(e.message)}</div>`; }
}
function renderTaskList(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw.replace(/^[^[]*(?=\[|\{)/, "")) : raw;
    const rows = Array.isArray(parsed) ? parsed : parsed.tasks || parsed.goals || [];
    if (!rows.length) return `<p class="dim">Nothing open. Pip approves.</p>`;
    return rows.map(r => `<div class="task"><b>${esc(r.title || r.name || "Task")}</b>
      ${r.status_line ? `<div class="dim">${esc(r.status_line)}</div>` : ""}
      ${r.due ? `<span class="badge">due ${esc(String(r.due))}</span>` : ""}</div>`).join("");
  } catch { return `<pre class="json">${esc(raw)}</pre>`; }
}

/* ---------- tools ---------- */
async function renderTools() {
  if (!tools.length) { $("#view").innerHTML = `<div class="card"><span class="dim">Loading tools…</span></div>`; tools = await listTools().catch(()=>[]); }
  $("#view").innerHTML = `
    <div class="card"><h3 style="margin:0 0 4px">Every tool Fo exposes (${tools.length})</h3>
      <p class="dim">Call any of them directly. Arguments as JSON.</p></div>
    <div id="tool-list">${tools.map((t, i) => `
      <div class="card"><b>${esc(t.name)}</b>
        <div class="dim">${esc(t.description || "").slice(0, 200)}</div>
        <details><summary class="dim">run it</summary>
          <textarea id="args-${i}" placeholder="{}">${JSON.stringify(sampleArgs(t))}</textarea>
          <button class="ghost" data-run="${i}">Run</button>
          <pre class="json" id="out-${i}"></pre></details></div>`).join("")}</div>`;
  document.querySelectorAll("[data-run]").forEach(b => b.onclick = async () => {
    const i = b.dataset.run, out = $("#out-" + i);
    out.textContent = "running…"; mascot && mascot.setState("working");
    try {
      let args = {}; try { args = JSON.parse($("#args-" + i).value || "{}"); } catch {}
      out.textContent = await callTool(tools[i].name, args);
      mascot && mascot.setState("happy");
    } catch (e) { out.textContent = "⚠️ " + e.message; mascot && mascot.setState("alert"); }
  });
}
function sampleArgs(t) {
  const props = t.inputSchema && t.inputSchema.properties || {};
  const s = {};
  for (const [k, v] of Object.entries(props)) {
    if (v.type === "string") s[k] = v.default || "";
    else if (v.type === "number" || v.type === "integer") s[k] = v.default ?? 0;
    else if (v.type === "boolean") s[k] = v.default ?? false;
    else if (v.type === "array") s[k] = [];
    else if (v.type === "object") s[k] = {};
  }
  return s;
}

/* ---------- settings + notifications ---------- */
function renderSettings() {
  const t = getTokens();
  $("#view").innerHTML = `
    <div class="card"><h3 style="margin:0 0 8px">Connection</h3>
      <p class="dim">Connected to Wajo's Fo MCP server. Access token${t ? "" : " none"} expires ${t ? new Date(t.expires_at).toLocaleString() : "-"}. Refresh token rotates automatically.</p>
      <button class="ghost" id="forget">Disconnect</button></div>
    <div class="card"><h3 style="margin:0 0 8px">Notifications</h3>
      <p class="dim">While the app is open, Pip checks your tasks every minute and pings you on anything new.</p>
      <button class="primary" id="notify">Enable notifications</button></div>
    <div class="card"><h3 style="margin:0 0 8px">Install</h3>
      <p class="dim">On your phone: browser menu → "Add to Home screen". On desktop: install icon in the address bar. It then runs like a native app.</p></div>`;
  $("#forget").onclick = () => { clearTokens(); location.reload(); };
  $("#notify").onclick = () => Notification.requestPermission().then(p => toast("Notifications " + p));
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    if (!connected() || document.hidden) return;
    try {
      if (!tools.length) tools = await listTools();
      const t = findTool(/list_tasks/);
      if (!t) return;
      const raw = await callTool(t.name, {});
      const key = raw.slice(0, 2000);
      if (lastTaskKey && key !== lastTaskKey) {
        toast("Fo: your tasks changed");
        mascot && mascot.setState("alert");
        if (Notification.permission === "granted") new Notification("Fo Companion", { body: "Your tasks changed. Tap to check." });
        if (navigator.setAppBadge) navigator.setAppBadge();
      }
      lastTaskKey = key;
    } catch {}
  }, 60000);
}

function toast(text) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
boot();
