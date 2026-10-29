// Pip: the app-facing mascot. drawMochi assembled here from the ported
// modules; controller ports Coucou MochiMood.swift behavior (blink, gaze,
// stress tint) and keeps the same createMascot() interface.
import { drawBody, drawEyes, VIEW_TILT } from "./mochi-base.js";
import { OUTFITS as OUTFITS_HATS } from "./mochi-hats.js";
import { OUTFITS as OUTFITS_FANCY } from "./mochi-fancy.js";
import { OUTFITS as OUTFITS_EXTRA } from "./mochi-extras.js";

const OUTFITS = { ...OUTFITS_HATS, ...OUTFITS_FANCY, ...OUTFITS_EXTRA };

// ---------- composite draw ----------
function drawMochi(ctx, W, opts) {
  const R = W * (opts.scale || 1) * 0.3;
  const H = { R, rx: R * 1.14, ry: R * 0.88, view: VIEW_TILT, yaw: opts.yaw || 0, pitch: opts.pitch || 0, phys: opts.phys || { dx: 0, dy: 0 }, blink: opts.blink, hot: opts.hot || 0 };
  const o = opts.outfit ? OUTFITS[opts.outfit] : null;
  ctx.save(); ctx.translate(W / 2, W / 2 + R * 0.45);
  if (opts.tilt) ctx.rotate(opts.tilt);
  if (o && o.back) o.back(ctx, H);
  const path = drawBody(ctx, H, o && o.bodyColors);
  drawEyes(ctx, H, path);
  if (o && o.front) o.front(ctx, H, path);
  ctx.restore();
}

// ---------- Pip: controller around the renderer ----------
// States map to the app's moods; blink cadence, pointer gaze and the stress
// tint are ported from Coucou's MochiMood.swift behavior. MIT, same as the
// renderer above.
const OUTFIT_CYCLE = [null, "bow", "sunglasses", "crown", "beanie", "scarf", "partyHat"];

export function createMascot(container) {
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0;
  function resize() {
    const s = Math.max(120, container.clientWidth || 160);
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = s * dpr; canvas.height = s * dpr;
    canvas.style.width = s + "px"; canvas.style.height = s + "px";
    W = s * dpr;
  }
  resize(); addEventListener("resize", resize);

  let outfitIdx = 0; // tap the mascot to change outfit
  canvas.style.cursor = "pointer";
  canvas.addEventListener("pointerdown", () => { outfitIdx = (outfitIdx + 1) % OUTFIT_CYCLE.length; });

  let yaw = 0, pitch = 0, yawT = 0, pitchT = 0;
  addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 240));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 240));
    yawT = dx * 0.55; pitchT = dy * 0.45;
  });

  let blink = 1, blinkT = -1, nextBlink = 1.5 + Math.random() * 3;
  let state = "idle", stateUntil = 0, hot = 0, hotUntil = 0, last = performance.now();

  function setState(next) {
    state = next;
    if (next === "happy") stateUntil = performance.now() + 2200;
    if (next === "alert") hotUntil = performance.now() + 2600;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;

    yaw += (yawT - yaw) * Math.min(1, dt * 6);
    pitch += (pitchT - pitch) * Math.min(1, dt * 6);
    if (Math.random() < dt * 0.03) yawT = (Math.random() * 2 - 1) * 0.28; // idle glances

    nextBlink -= dt;
    if (blinkT >= 0) {
      blinkT += dt;
      blink = blinkT < 0.06 ? 1 - blinkT / 0.06 : Math.max(0, (blinkT - 0.06) / 0.08);
      blink = Math.max(0, Math.min(1, blink));
      if (blinkT > 0.14) { blinkT = -1; blink = 1; nextBlink = 1.5 + Math.random() * 3.5; }
    } else if (nextBlink <= 0) blinkT = 0;

    const hotOn = now < hotUntil;
    hot += ((hotOn ? 1 : 0) - hot) * Math.min(1, dt * 3);
    if (state === "happy" && now > stateUntil) state = "idle";

    const breathe = Math.sin(t * (state === "working" ? 3.2 : 1.4)) * (state === "working" ? 0.05 : 0.02);
    const tilt = state === "happy" ? Math.sin(t * 9) * 0.08 : state === "working" ? Math.sin(t * 5) * 0.03 : 0;
    const scale = 1 + (state === "happy" ? Math.abs(Math.sin(t * 4.5)) * 0.06 : 0);

    ctx.clearRect(0, 0, W, W);
    drawMochi(ctx, W, {
      scale,
      yaw: yaw + (state === "alert" ? Math.sin(t * 14) * 0.04 : 0),
      pitch: pitch + breathe,
      tilt,
      outfit: OUTFIT_CYCLE[outfitIdx],
      blink,
      hot,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { setState };
}
