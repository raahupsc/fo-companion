// Mochi renderer core, ported from Louis-CFM/coucou design/outfits/mochi-outfits.js
// (MIT; see that repo's LICENSE and LICENSE-ASSETS.md for the Mochi artwork).
// Blink and stress-tint support added here, adapted from its MochiMood.swift.
// Mochi outfit reference renderer (Canvas 2D).
// Coordinates mirror BotEngine.draw(): origin at body centre, y down on screen,
// R = W*0.3, rx = 1.14R, ry = 0.88R. Head "3D" model: superellipsoid whose
// horizontal radius at height y (y up, -1..1) is r(y) = (1-|y|^2.7)^(1/2.7),
// so that its silhouette matches mochiPath at yaw = pitch = 0.

const EXP = 2.7;
// Accessories are seen slightly from above (and hats sit tipped forward): rings show as ellipses.
const VIEW_TILT = -0.30;
const ACC_PITCH = 0.4;
const EYE_W = 0.25, EYE_H = 0.27, EYE_SP = 0.37, EYE_P = -0.12;

function ringR(y) { const a = Math.min(1, Math.abs(y)); return Math.pow(1 - Math.pow(a, EXP), 1 / EXP); }

// rotate a head-local point (x right, y up, z toward viewer) by yaw then pitch
function rot(p, yaw, pitch) {
  let [x, y, z] = p;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  let y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp;
  return [x1, y2, z2];
}
// head-local -> screen (body space). returns {x, y, z}
function proj(H, p) {
  // accessories follow the head pitch only partly, so hats never flip to a top-down view
  const r = rot(p, H.yaw, (H.view || 0) + H.pitch * ACC_PITCH);
  return { x: r[0] * H.rx, y: -r[1] * H.ry, z: r[2] };
}
// point on the head surface at height y, longitude lon (0 = facing viewer), scaled by s
function surf(y, lon, s = 1) { const r = ringR(y) * s; return [r * Math.sin(lon), y, r * Math.cos(lon)]; }

function mochiPath(rx, ry) {
  const p = new Path2D(); const n = 96, e = 2 / EXP;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const x = rx * Math.sign(ca) * Math.pow(Math.abs(ca), e);
    const y = ry * Math.sign(sa) * Math.pow(Math.abs(sa), e);
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath(); return p;
}

function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
}
function rad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c)); return g;
}

// ---------- Body + eyes (faithful to BotEngine) ----------
function drawBody(ctx, H, colors) {
  const { rx, ry, R } = H; const path = mochiPath(rx, ry);
  const top = colors ? colors[0] : '#EDEDEF', bot = colors ? colors[1] : '#C4C5CA';
  ctx.fillStyle = lin(ctx, rx * 0.7, -ry * 0.85, -rx * 0.8, ry * 0.9, [[0, top], [1, bot]]);
  ctx.fill(path);
  ctx.fillStyle = rad(ctx, 0, 0, R * 0.15, R * 1.25, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.2)']]);
  ctx.fill(path);
  ctx.fillStyle = rad(ctx, rx * 0.34, -ry * 0.46, 0, R * 0.42, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fill(path);
  if (H.hot > 0.01) { // stress tint, ported from MochiMood.drawMoodTint
    ctx.fillStyle = lin(ctx, 0, ry, 0, -ry * 0.6, [[0, `rgba(255,92,61,${(0.42 * H.hot).toFixed(3)})`], [1, 'rgba(255,92,61,0)']]);
    ctx.fill(path);
  }
  return path;
}

// Same formula as drawEyes(): spherical addition, NOT the rotation used for accessories.
function eyeFrames(H) {
  const out = [];
  for (const sd of [-1, 1]) {
    const eyeYaw = sd * EYE_SP + H.yaw;
    let eyePitch = EYE_P + H.pitch;
    const cp = Math.cos(eyePitch);
    const visible = Math.cos(eyeYaw) * cp > 0.04;
    out.push({
      sd, visible,
      x: Math.sin(eyeYaw) * cp * H.rx,
      y: -Math.sin(eyePitch) * H.ry,
      fx: Math.max(0.18, Math.cos(eyeYaw)),
      fy: Math.max(0.18, cp),
      w: H.R * EYE_W, h: H.R * EYE_H,
    });
  }
  return out;
}
function drawEyes(ctx, H, path, alpha = 1) {
  ctx.save(); ctx.clip(path);
  for (const e of eyeFrames(H)) {
    if (!e.visible) continue;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.fx, e.fy);
    const w = e.w, hh = e.h * (H.blink === undefined ? 1 : Math.max(0.04, H.blink));
    ctx.fillStyle = `rgba(26,20,18,${alpha})`;
    roundRect(ctx, -w / 2, -hh / 2, w, hh, Math.min(w, hh) / 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- helpers for "wrapped" items ----------
// Front arc of a ring (height y, scale s) projected, from left extreme to right extreme (z >= 0 side).
function ringPoints(H, y, s, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const lon = -Math.PI + i / n * 2 * Math.PI; pts.push({ lon, ...proj(H, surf(y, lon, s)) }); }
  return pts;
}
function frontArc(H, y, s) {
  // walk the ring, keep the contiguous z>=0 part ordered by screen x
  const pts = ringPoints(H, y, s, 120).filter(p => p.z >= -0.02);
  pts.sort((a, b) => a.x - b.x); return pts;
}
// region of the inflated head ABOVE the front arc of ring y (the part a cap covers)
function capClip(H, y, s, extraTop = 3) {
  const arc = frontArc(H, y, s);
  const p = new Path2D();
  p.moveTo(arc[0].x - H.rx, arc[0].y);
  for (const q of arc) p.lineTo(q.x, q.y);
  p.lineTo(arc[arc.length - 1].x + H.rx, arc[arc.length - 1].y);
  p.lineTo(H.rx * 2, -H.ry * extraTop); p.lineTo(-H.rx * 2, -H.ry * extraTop); p.closePath();
  return p;
}
// contiguous visible (z>=0) run of a closed ring, ordered left->right
function frontRun(ring) {
  const n = ring.length - 1; let start = -1;
  for (let i = 0; i < n; i++) if (ring[i].z >= 0 && ring[(i - 1 + n) % n].z < 0) { start = i; break; }
  if (start < 0) { // whole ring visible (seen from above): use its lower half
    const my = ring.reduce((s, q) => s + q.y, 0) / ring.length;
    return ring.filter(q => q.y >= my).sort((a, b) => a.x - b.x);
  }
  const out = []; for (let k = 0; k < n; k++) { const q = ring[(start + k) % n]; if (q.z < 0) break; out.push(q); }
  if (out.length > 1 && out[0].x > out[out.length - 1].x) out.reverse();
  return out;
}
function strokeArc(ctx, arc) { ctx.beginPath(); arc.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); }

// soft round "pompom" made of overlapping puffs
function pompom(ctx, x, y, r, base = '#FFFFFF', shade = '#D5D9E2') {
  ctx.save(); ctx.translate(x, y);
  // fluffy rim bumps
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, br = r * (0.34 + 0.06 * Math.sin(i * 2.3));
    const bx = Math.cos(a) * r * 0.78, by = Math.sin(a) * r * 0.78;
    ctx.fillStyle = rad(ctx, bx - br * 0.4, by - br * 0.5, 0, br * 1.3, [[0, base], [1, shade]]);
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = rad(ctx, -r * 0.3, -r * 0.35, 0, r * 1.05, [[0, base], [0.7, base], [1, shade]]);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// fuzzy band along a polyline (santa trim)
function fuzzyBand(ctx, arc, thick, base = '#FFFFFF', shade = '#DADDE4') {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  strokeArc(ctx, arc); ctx.strokeStyle = shade; ctx.lineWidth = thick; ctx.stroke();
  strokeArc(ctx, arc); ctx.strokeStyle = base; ctx.lineWidth = thick * 0.78; ctx.stroke();
  // bumps along the edges
  const step = Math.max(2, Math.floor(arc.length / 16));
  for (let i = 0; i < arc.length; i += step) {
    const q = arc[i]; const r = thick * (0.32 + 0.1 * Math.sin(i * 1.7));
    ctx.fillStyle = rad(ctx, q.x - r * 0.3, q.y - thick * 0.35 - r * 0.3, 0, r * 1.2, [[0, base], [1, shade]]);
    ctx.beginPath(); ctx.arc(q.x, q.y - thick * 0.32, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// quadratic bezier helpers for tubes
function qb(p0, p1, p2, t) { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y }; }
function qbd(p0, p1, p2, t) { const u = 1 - t; return { x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x), y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y) }; }

// region complement helper (big rect minus path) using evenodd
function invert(p, H) {
  const q = new Path2D(); q.rect(-H.rx * 4, -H.ry * 4, H.rx * 8, H.ry * 8); q.addPath(p); q.__evenodd = true; return q;
}
// patch ctx.clip to honour evenodd paths
const _clip = CanvasRenderingContext2D.prototype.clip;
CanvasRenderingContext2D.prototype.clip = function (p, rule) { if (p && p.__evenodd) return _clip.call(this, p, 'evenodd'); return p ? _clip.call(this, p, rule) : _clip.call(this); };

export { mochiPath, proj, surf, frontArc, frontRun, capClip, pompom, fuzzyBand, lin, rad, roundRect, eyeFrames, drawBody, drawEyes, VIEW_TILT, ringR, qb, qbd, invert };
