// Mochi outfits, ported from Louis-CFM/coucou design/outfits/mochi-outfits.js (MIT).
import { mochiPath, proj, surf, frontArc, frontRun, capClip, pompom, fuzzyBand, lin, rad, roundRect, eyeFrames, invert, ringR } from "./mochi-base.js";

const OUTFITS = {};

function crownGeom(H) {
  const s = 1.06, yb = 0.46, yt = 0.66, n = 8;
  return { s, yb, yt, n, spikeH: 0.42 };
}
function crownPart(ctx, H, side) { // side: -1 back half, +1 front half
  const { s, yb, yt, n, spikeH } = crownGeom(H);
  const N = 120; const seg = [];
  for (let i = 0; i <= N; i++) {
    const lon = -Math.PI + i / N * 2 * Math.PI;
    const b = proj(H, surf(yb, lon, s)), t = proj(H, surf(yt, lon, s));
    const phase = ((lon + Math.PI) / (2 * Math.PI)) * n; const f = phase - Math.floor(phase);
    const spike = Math.pow(Math.max(0, 1 - Math.abs(f - 0.5) * 2), 1.6); // 0..1 peak at middle
    const topY = yt + spikeH * spike;
    const tt = proj(H, [surf(yt, lon, s)[0] * (1 - 0.08 * spike), topY, surf(yt, lon, s)[2] * (1 - 0.08 * spike)]);
    seg.push({ lon, b, t, tt, z: b.z, spike });
  }
  const keep = seg.filter(q => side > 0 ? q.z >= 0 : q.z < 0.02);
  if (keep.length < 2) return;
  keep.sort((a, b) => a.b.x - b.b.x);
  const shape = new Path2D();
  keep.forEach((q, i) => i ? shape.lineTo(q.tt.x, q.tt.y) : shape.moveTo(q.tt.x, q.tt.y));
  for (let i = keep.length - 1; i >= 0; i--) shape.lineTo(keep[i].b.x, keep[i].b.y);
  shape.closePath();
  const dark = side < 0;
  ctx.fillStyle = lin(ctx, 0, -H.ry * 1.05, 0, -H.ry * 0.45, dark ? [[0, '#C98A12'], [1, '#8A5A06']] : [[0, '#FFE58A'], [0.5, '#FBBF24'], [1, '#D08A0B']]);
  ctx.fill(shape);
  if (!dark) {
    // band highlight + gems + ball tips on front spikes
    ctx.save(); ctx.clip(shape);
    ctx.fillStyle = lin(ctx, -H.rx, 0, H.rx, 0, [[0, 'rgba(120,70,0,0.25)'], [0.45, 'rgba(255,255,255,0.0)'], [0.62, 'rgba(255,255,255,0.35)'], [1, 'rgba(120,70,0,0.25)']]);
    ctx.fill(shape); ctx.restore();
    const gems = ['#EF4444', '#3B82F6', '#22C55E', '#A855F7'];
    for (let k = 0; k < n; k++) {
      const lon = -Math.PI + (k + 0.5) / n * 2 * Math.PI;
      const sp = surf(yt, lon, s);
      const tipP = proj(H, [sp[0] * 0.92, yt + spikeH, sp[2] * 0.92]);
      const mid = proj(H, surf((yb + yt) / 2, lon, s * 1.01));
      if (mid.z <= 0.12) continue;
      const r = H.R * 0.055;
      ctx.beginPath(); ctx.arc(tipP.x, tipP.y - r * 0.5, r, 0, Math.PI * 2);
      ctx.fillStyle = rad(ctx, tipP.x - r * 0.3, tipP.y - r, 0, r * 1.2, [[0, '#FFF6CC'], [1, '#E0A21A']]); ctx.fill();
      const gr = H.R * 0.075;
      ctx.beginPath(); ctx.ellipse(mid.x, mid.y, gr * Math.max(0.35, mid.z), gr, 0, 0, Math.PI * 2);
      ctx.fillStyle = gems[k % gems.length]; ctx.fill();
      ctx.beginPath(); ctx.arc(mid.x - gr * 0.25 * mid.z, mid.y - gr * 0.35, gr * 0.28, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    }
  }
}
OUTFITS.crown = {
  back(ctx, H) { crownPart(ctx, H, -1); },
  front(ctx, H, path) {
    ctx.save(); ctx.clip(path); ctx.clip(capClip(H, crownGeom(H).yb - 0.1, 1)); ctx.clip(invert(capClip(H, crownGeom(H).yb, 1), H));
    ctx.fillStyle = 'rgba(80,50,0,0.12)'; ctx.fill(path); ctx.restore();
    crownPart(ctx, H, 1);
  }
};

// --- Witch hat: wide floppy brim around the head, tall cone with a bent tip, orange band + gold buckle
function witchBrimPts(H) {
  const y = 0.70, rr = 1.42, pts = [];
  for (let i = 0; i <= 120; i++) {
    const a = -Math.PI + i / 120 * 2 * Math.PI;
    const wob = 1 + 0.035 * Math.sin(a * 3 + 0.6);
    const droop = -0.10 * Math.pow(Math.abs(Math.sin(a)), 2); // brim edges droop a little
    pts.push({ a, ...proj(H, [rr * wob * Math.sin(a), y + droop, rr * wob * Math.cos(a)]) });
  }
  return pts;
}
OUTFITS.witchHat = {
  back(ctx, H) {
    const pts = witchBrimPts(H).filter(p => p.z < 0.05).sort((a, b) => a.x - b.x);
    const ell = new Path2D(); witchBrimPts(H).forEach((q, i) => i ? ell.lineTo(q.x, q.y) : ell.moveTo(q.x, q.y)); ell.closePath();
    ctx.fillStyle = lin(ctx, 0, -H.ry * 1.0, 0, -H.ry * 0.4, [[0, '#2A0A4F'], [1, '#3B0F6B']]);
    ctx.fill(ell); // whole brim behind the head; front part is redrawn in front()
  },
  front(ctx, H, path) {
    const all = witchBrimPts(H);
    const brim = new Path2D(); all.forEach((q, i) => i ? brim.lineTo(q.x, q.y) : brim.moveTo(q.x, q.y)); brim.closePath();
    const fr = all.filter(p => p.z >= 0).sort((a, b) => a.x - b.x);
    // shadow of brim on head
    ctx.save(); ctx.clip(path); ctx.clip(capClip(H, 0.50, 1)); ctx.fillStyle = 'rgba(40,0,70,0.10)'; ctx.fill(path); ctx.restore();
    ctx.fillStyle = lin(ctx, 0, -H.ry * 0.9, 0, -H.ry * 0.3, [[0, '#5B21B6'], [1, '#3B0764']]);
    ctx.fill(brim);
    ctx.beginPath(); fr.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
    ctx.strokeStyle = 'rgba(190,150,255,0.35)'; ctx.lineWidth = H.R * 0.035; ctx.stroke();
    // cone: base ring r=0.62 at y=0.72, apex high, tip bends over
    const baseR = 0.62, by = 0.74;
    const bl = proj(H, [-baseR, by, 0]), br = proj(H, [baseR, by, 0]);
    const c = proj(H, [0, by, 0]);
    const lean = 0.10 + H.phys.dx * 0.15;
    const top = { x: c.x + H.rx * 0.18 + Math.sin(lean) * H.ry * 0.3, y: c.y - H.ry * 1.25 };
    const tip = { x: top.x + H.rx * (0.45 + H.phys.dx * 0.25), y: top.y + H.ry * (0.22 + H.phys.dy * 0.1) };
    const cone = new Path2D();
    cone.moveTo(bl.x, bl.y);
    cone.bezierCurveTo(bl.x + H.rx * 0.12, bl.y - H.ry * 0.5, top.x - H.rx * 0.28, top.y + H.ry * 0.25, top.x - H.rx * 0.02, top.y - H.ry * 0.02);
    cone.quadraticCurveTo(top.x + H.rx * 0.25, top.y - H.ry * 0.08, tip.x, tip.y);
    cone.quadraticCurveTo(top.x + H.rx * 0.22, top.y + H.ry * 0.08, top.x + H.rx * 0.14, top.y + H.ry * 0.22);
    cone.bezierCurveTo(br.x - H.rx * 0.18, c.y - H.ry * 0.45, br.x - H.rx * 0.02, br.y - H.ry * 0.2, br.x, br.y);
    const capFront = frontArc(H, by, baseR / ringR(by)).filter(q => q.x >= bl.x - 1 && q.x <= br.x + 1);
    for (let i = capFront.length - 1; i >= 0; i--) cone.lineTo(capFront[i].x, capFront[i].y + H.ry * 0.0);
    cone.closePath();
    ctx.fillStyle = lin(ctx, bl.x, top.y, br.x, bl.y, [[0, '#7C3AED'], [0.55, '#4C1D95'], [1, '#2E1065']]);
    ctx.fill(cone);
    ctx.save(); ctx.clip(cone);
    ctx.fillStyle = lin(ctx, bl.x, 0, br.x, 0, [[0, 'rgba(255,255,255,0.22)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.15)']]);
    ctx.fill(cone);
    // crease where the tip bends
    ctx.beginPath(); ctx.moveTo(top.x - H.rx * 0.05, top.y + H.ry * 0.05); ctx.quadraticCurveTo(top.x + H.rx * 0.1, top.y + H.ry * 0.12, top.x + H.rx * 0.2, top.y + H.ry * 0.06);
    ctx.strokeStyle = 'rgba(20,0,40,0.35)'; ctx.lineWidth = H.R * 0.05; ctx.lineCap = 'round'; ctx.stroke();
    // orange band: gentle curve across the cone just above its base
    const fc = proj(H, [0, by, baseR]);
    const lift = H.ry * 0.11;
    ctx.beginPath();
    ctx.moveTo(bl.x - 2, bl.y - lift);
    ctx.quadraticCurveTo(fc.x, 2 * (fc.y - lift) - (bl.y + br.y) / 2 + lift * 0.0, br.x + 2, br.y - lift);
    ctx.strokeStyle = '#F97316'; ctx.lineWidth = H.ry * 0.17; ctx.lineCap = 'butt'; ctx.stroke();
    ctx.restore();
    // buckle
    const bk0 = proj(H, [0, by, baseR]); const bk = { x: bk0.x, y: bk0.y - H.ry * 0.11 };
    const bw = H.R * 0.2, bh = H.R * 0.16;
    ctx.save(); ctx.translate(bk.x, bk.y - H.ry * 0.0);
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh * 0.25); ctx.fillStyle = '#FCD34D'; ctx.fill();
    roundRect(ctx, -bw / 2 + bw * 0.24, -bh / 2 + bh * 0.28, bw * 0.52, bh * 0.44, bh * 0.1); ctx.fillStyle = '#C2410C'; ctx.fill();
    ctx.restore();
  }
};


export { OUTFITS };
