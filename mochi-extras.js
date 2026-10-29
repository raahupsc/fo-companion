// Mochi outfits, ported from Louis-CFM/coucou design/outfits/mochi-outfits.js (MIT).
import { mochiPath, proj, surf, frontArc, frontRun, capClip, pompom, fuzzyBand, lin, rad, roundRect, eyeFrames, invert, ringR } from "./mochi-base.js";

const OUTFITS = {};

// --- Glasses pinned to the real eye positions
function lens(ctx, e, w, h, r) { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.fx, e.fy); roundRect(ctx, -w / 2, -h / 2, w, h, r); ctx.restore(); }
OUTFITS.sunglasses = {
  frontAfterEyes: true,
  front(ctx, H, path) {
    const eyes = eyeFrames(H);
    const w = H.R * 0.62, h = H.R * 0.46;
    ctx.save(); ctx.clip(path);
    // bridge
    const [l, r] = eyes;
    if (l.visible && r.visible) {
      ctx.beginPath(); ctx.moveTo(l.x + w / 2 * l.fx * 0.9, l.y - h * 0.18); ctx.quadraticCurveTo((l.x + r.x) / 2, (l.y + r.y) / 2 - h * 0.42, r.x - w / 2 * r.fx * 0.9, r.y - h * 0.18);
      ctx.strokeStyle = '#111317'; ctx.lineWidth = H.R * 0.07; ctx.stroke();
    }
    // temples to the head edge
    for (const e of eyes) {
      if (!e.visible) continue;
      const ox = e.x + e.sd * w / 2 * e.fx;
      ctx.beginPath(); ctx.moveTo(ox, e.y - h * 0.2); ctx.lineTo(e.sd * H.rx * 1.05, e.y - h * 0.35);
      ctx.strokeStyle = '#111317'; ctx.lineWidth = H.R * 0.06; ctx.stroke();
    }
    for (const e of eyes) {
      if (!e.visible) continue;
      lens(ctx, e, w, h, h * 0.42); ctx.fillStyle = 'rgba(17,19,23,0.82)'; ctx.fill();
      ctx.lineWidth = H.R * 0.05; ctx.strokeStyle = '#0B0C0F'; ctx.stroke();
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.fx, e.fy);
      ctx.beginPath(); ctx.moveTo(-w * 0.28, -h * 0.05); ctx.lineTo(-w * 0.05, -h * 0.3);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = H.R * 0.05; ctx.lineCap = 'round'; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
};
OUTFITS.roundGlasses = {
  front(ctx, H, path) {
    const eyes = eyeFrames(H); const d = H.R * 0.56;
    ctx.save(); ctx.clip(path);
    const [l, r] = eyes;
    if (l.visible && r.visible) {
      ctx.beginPath(); ctx.moveTo(l.x + d / 2 * l.fx, l.y - d * 0.08); ctx.quadraticCurveTo((l.x + r.x) / 2, (l.y + r.y) / 2 - d * 0.3, r.x - d / 2 * r.fx, r.y - d * 0.08);
      ctx.strokeStyle = '#8A4B12'; ctx.lineWidth = H.R * 0.055; ctx.stroke();
    }
    for (const e of eyes) {
      if (!e.visible) continue;
      ctx.beginPath(); ctx.moveTo(e.x + e.sd * d / 2 * e.fx, e.y - d * 0.1); ctx.lineTo(e.sd * H.rx * 1.05, e.y - d * 0.25);
      ctx.strokeStyle = '#8A4B12'; ctx.lineWidth = H.R * 0.05; ctx.stroke();
    }
    for (const e of eyes) {
      if (!e.visible) continue;
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.fx, e.fy);
      ctx.beginPath(); ctx.arc(0, 0, d / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(190,225,255,0.18)'; ctx.fill();
      ctx.lineWidth = H.R * 0.065; ctx.strokeStyle = '#9A5A1A'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, d / 2 - H.R * 0.03, Math.PI * 1.1, Math.PI * 1.45);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = H.R * 0.03; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
};

// --- Scarf: knitted band wrapped low around the body, knot + hanging end
OUTFITS.scarf = {
  front(ctx, H, path) {
    const s = 1.05, y0 = -0.34, y1 = -0.66;
    const top = frontArc(H, y0, s), bot = frontArc(H, y1, s);
    const band = new Path2D();
    top.forEach((q, i) => i ? band.lineTo(q.x, q.y) : band.moveTo(q.x, q.y));
    for (let i = bot.length - 1; i >= 0; i--) band.lineTo(bot[i].x, bot[i].y);
    band.closePath();
    ctx.save(); ctx.clip(mochiPath(H.rx * s, H.ry * s));
    ctx.fillStyle = lin(ctx, 0, -H.ry * 0.2, 0, H.ry * 0.7, [[0, '#F87171'], [1, '#B91C1C']]); ctx.fill(band);
    ctx.clip(band);
    // stripes along meridians
    for (const lon of [-1.0, -0.45, 0.1, 0.65, 1.2]) {
      const a = proj(H, surf(y0, lon + H.yaw * 0, s)), b = proj(H, surf(y1, lon, s));
      if (a.z < 0) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y - 4); ctx.lineTo(b.x, b.y + 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = H.R * 0.09 * Math.max(0.3, a.z); ctx.stroke();
    }
    ctx.fillStyle = lin(ctx, 0, -H.ry * 0.5, 0, H.ry * 0.3, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(0,0,0,0.1)']]); ctx.fill(band);
    ctx.restore();
    // hanging end from the knot at lon -0.55
    const k = proj(H, surf((y0 + y1) / 2, -0.55, s * 1.03));
    if (k.z > 0) {
      const sw = H.phys.dx * H.rx * 0.12;
      const end = new Path2D();
      end.moveTo(k.x - H.R * 0.16, k.y);
      end.quadraticCurveTo(k.x - H.R * 0.24 + sw, k.y + H.ry * 0.35, k.x - H.R * 0.2 + sw * 1.4, k.y + H.ry * 0.62);
      end.lineTo(k.x + H.R * 0.06 + sw * 1.4, k.y + H.ry * 0.6);
      end.quadraticCurveTo(k.x + H.R * 0.02 + sw, k.y + H.ry * 0.3, k.x + H.R * 0.12, k.y);
      end.closePath();
      ctx.fillStyle = lin(ctx, 0, k.y, 0, k.y + H.ry * 0.6, [[0, '#EF4444'], [1, '#B91C1C']]); ctx.fill(end);
      ctx.save(); ctx.clip(end);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const t of [0.35, 0.7]) ctx.fillRect(k.x - H.R * 0.4 + sw, k.y + H.ry * 0.62 * t, H.R * 0.8, H.R * 0.07);
      ctx.restore();
      // fringe
      for (let i = 0; i < 4; i++) {
        const fx = k.x - H.R * 0.17 + sw * 1.4 + i * H.R * 0.075;
        ctx.beginPath(); ctx.moveTo(fx, k.y + H.ry * 0.6); ctx.lineTo(fx, k.y + H.ry * 0.72);
        ctx.strokeStyle = '#DC2626'; ctx.lineWidth = H.R * 0.035; ctx.lineCap = 'round'; ctx.stroke();
      }
      // knot
      ctx.beginPath(); ctx.ellipse(k.x, k.y, H.R * 0.17, H.R * 0.14, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = rad(ctx, k.x - H.R * 0.05, k.y - H.R * 0.05, 0, H.R * 0.2, [[0, '#F87171'], [1, '#B91C1C']]); ctx.fill();
    }
  }
};

// --- Pumpkin: body recolour + soft ribs following meridians + curly stem & leaf
OUTFITS.pumpkin = {
  bodyColors: ['#FFA94D', '#E8590C'],
  front(ctx, H, path) {
    ctx.save(); ctx.clip(path);
    for (const lon of [-1.15, -0.55, 0.0, 0.55, 1.15]) {
      const pts = [];
      for (let i = 0; i <= 30; i++) { const y = -0.98 + 1.96 * i / 30; const q = proj(H, surf(y, lon, 1)); if (q.z > 0) pts.push(q); }
      if (pts.length < 2) continue;
      ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
      const zz = pts[Math.floor(pts.length / 2)].z;
      ctx.strokeStyle = `rgba(150,50,0,${0.22 * zz})`; ctx.lineWidth = H.R * 0.12; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = `rgba(255,220,170,${0.18 * zz})`; ctx.lineWidth = H.R * 0.04; ctx.save(); ctx.translate(H.R * 0.07, 0); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    const t = proj(H, [0.02, 1.0, 0]);
    // stem
    ctx.beginPath(); ctx.moveTo(t.x - H.R * 0.09, t.y + H.R * 0.04);
    ctx.quadraticCurveTo(t.x - H.R * 0.08, t.y - H.R * 0.22, t.x + H.R * 0.08, t.y - H.R * 0.3);
    ctx.lineTo(t.x + H.R * 0.13, t.y - H.R * 0.22);
    ctx.quadraticCurveTo(t.x + H.R * 0.04, t.y - H.R * 0.15, t.x + H.R * 0.08, t.y + H.R * 0.04); ctx.closePath();
    ctx.fillStyle = lin(ctx, t.x - H.R * 0.1, 0, t.x + H.R * 0.1, 0, [[0, '#65A30D'], [1, '#3F6212']]); ctx.fill();
    // leaf
    ctx.save(); ctx.translate(t.x - H.R * 0.06, t.y - H.R * 0.02); ctx.rotate(-0.5);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-H.R * 0.18, -H.R * 0.2, -H.R * 0.38, -H.R * 0.02); ctx.quadraticCurveTo(-H.R * 0.18, H.R * 0.1, 0, 0);
    ctx.fillStyle = lin(ctx, 0, -H.R * 0.15, -H.R * 0.3, 0, [[0, '#84CC16'], [1, '#4D7C0F']]); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-H.R * 0.02, -H.R * 0.01); ctx.quadraticCurveTo(-H.R * 0.18, -H.R * 0.08, -H.R * 0.32, -H.R * 0.03); ctx.strokeStyle = 'rgba(30,60,0,0.4)'; ctx.lineWidth = H.R * 0.02; ctx.stroke();
    ctx.restore();
    // curly tendril
    ctx.beginPath(); ctx.moveTo(t.x + H.R * 0.1, t.y - H.R * 0.12);
    ctx.bezierCurveTo(t.x + H.R * 0.3, t.y - H.R * 0.25, t.x + H.R * 0.35, t.y - H.R * 0.02, t.x + H.R * 0.22, t.y - H.R * 0.06);
    ctx.strokeStyle = '#4D7C0F'; ctx.lineWidth = H.R * 0.03; ctx.lineCap = 'round'; ctx.stroke();
  }
};

// --- Bow (kept, now anchored in 3D so it turns with the head)
OUTFITS.bow = {
  front(ctx, H, path) {
    const a = proj(H, surf(0.86, 0.55, 1.02));
    if (a.z < -0.2) return;
    const s = H.R * 0.26, sq = Math.max(0.45, Math.cos(0.55 + H.yaw));
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(0.35 + H.yaw * 0.3); ctx.scale(sq, 1);
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(sd * s * 0.6, -s * 0.85, sd * s * 1.35, -s * 0.55, sd * s * 1.15, 0);
      ctx.bezierCurveTo(sd * s * 1.35, s * 0.55, sd * s * 0.6, s * 0.85, 0, 0);
      ctx.fillStyle = lin(ctx, 0, -s, 0, s, [[0, '#FF8CC6'], [1, '#DB2777']]); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sd * s * 0.25, -s * 0.05); ctx.quadraticCurveTo(sd * s * 0.7, -s * 0.15, sd * s * 0.95, -s * 0.05);
      ctx.strokeStyle = 'rgba(140,10,70,0.35)'; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.24, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = rad(ctx, -s * 0.06, -s * 0.1, 0, s * 0.35, [[0, '#FFB3D9'], [1, '#C2185B']]); ctx.fill();
    ctx.restore();
  }
};


export { OUTFITS };
