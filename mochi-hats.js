// Mochi outfits, ported from Louis-CFM/coucou design/outfits/mochi-outfits.js (MIT).
import { mochiPath, proj, surf, frontArc, frontRun, capClip, pompom, fuzzyBand, lin, rad, roundRect, eyeFrames, invert, ringR } from "./mochi-base.js";

const OUTFITS = {};

// --- Beanie: knitted cap that wraps the top of the head, ribbed cuff, bouncy pompom
OUTFITS.beanie = {
  front(ctx, H, path) {
    const s = 1.035, yEdge = 0.42, yCuff = 0.58;
    const head = mochiPath(H.rx * s, H.ry * s);
    // shadow on the head under the cuff
    ctx.save(); ctx.clip(path); ctx.clip(capClip(H, yEdge - 0.12, 1));
    ctx.fillStyle = 'rgba(30,40,70,0.10)'; ctx.fill(path); ctx.restore();
    // knit body
    ctx.save(); ctx.clip(capClip(H, yCuff, s));
    ctx.fillStyle = lin(ctx, H.rx * 0.5, -H.ry * 1.1, -H.rx * 0.6, H.ry * 0.2, [[0, '#7DB6FF'], [1, '#2F6FE0']]);
    ctx.fill(head);
    // vertical knit ribs following meridians
    ctx.clip(head);
    for (let k = -6; k <= 6; k++) {
      const lon = k * 0.24; const pts = [];
      for (let i = 0; i <= 16; i++) { const y = yCuff + (1.05 - yCuff) * i / 16; const q = proj(H, surf(y, lon, s)); if (q.z > 0) pts.push(q); }
      if (pts.length < 2) continue;
      ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
      ctx.strokeStyle = 'rgba(20,50,140,0.16)'; ctx.lineWidth = H.R * 0.045; ctx.stroke();
    }
    ctx.restore();
    // cuff (folded band)
    ctx.save(); ctx.clip(capClip(H, yEdge, s * 1.04)); ctx.clip(invert(capClip(H, yCuff, s * 1.04), H));
    const cuffHead = mochiPath(H.rx * s * 1.04, H.ry * s * 1.04);
    ctx.fillStyle = lin(ctx, 0, -H.ry * 0.6, 0, -H.ry * 0.2, [[0, '#3C7BEA'], [1, '#2257C4']]);
    ctx.fill(cuffHead);
    ctx.clip(cuffHead);
    for (let k = -14; k <= 14; k++) {
      const lon = k * 0.115; const a = proj(H, surf(yEdge, lon, s * 1.04)), b = proj(H, surf(yCuff, lon, s * 1.04));
      if (a.z < 0) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = 'rgba(10,30,100,0.22)'; ctx.lineWidth = H.R * 0.035; ctx.stroke();
    }
    ctx.restore();
    // top highlight
    ctx.save(); ctx.clip(capClip(H, yCuff, s)); ctx.clip(head);
    ctx.fillStyle = rad(ctx, H.rx * 0.3, -H.ry * 0.85, 0, H.R * 0.45, [[0, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fill(head); ctx.restore();
    // pompom on a short spring
    const top = proj(H, [0, 1.08 * s, 0]);
    pompom(ctx, top.x + H.phys.dx * H.rx * 0.25, top.y - H.R * 0.12 + H.phys.dy * H.ry * 0.15, H.R * 0.24);
  }
};

// --- Santa hat: soft red bag that flops to the side, fuzzy trim, pompom at the tip
OUTFITS.santaHat = {
  front(ctx, H, path) {
    const s = 1.05, yEdge = 0.52;
    const arc = frontArc(H, yEdge, s);
    const L = arc[0], Rt = arc[arc.length - 1];
    const crown = proj(H, [0, 1.05, 0]);
    // tip: flops to the right and down, plus spring lag
    const side = 1;
    const tip = { x: crown.x + side * H.rx * (0.95 + H.phys.dx * 0.35), y: crown.y + H.ry * (0.05 + H.phys.dy * 0.2) };
    const peak = { x: crown.x + side * H.rx * 0.25, y: crown.y - H.ry * 0.62 };
    const bag = new Path2D();
    bag.moveTo(L.x, L.y);
    bag.bezierCurveTo(L.x - H.rx * 0.05, L.y - H.ry * 0.7, peak.x - H.rx * 0.55, peak.y - H.ry * 0.05, peak.x, peak.y);
    bag.quadraticCurveTo(tip.x - H.rx * 0.05, peak.y - H.ry * 0.02, tip.x, tip.y);
    bag.quadraticCurveTo(tip.x - H.rx * 0.12, tip.y - H.ry * 0.22, peak.x + H.rx * 0.18, peak.y + H.ry * 0.32);
    bag.bezierCurveTo(Rt.x + H.rx * 0.05, peak.y + H.ry * 0.45, Rt.x + H.rx * 0.08, Rt.y - H.ry * 0.35, Rt.x, Rt.y);
    for (let i = arc.length - 1; i >= 0; i--) bag.lineTo(arc[i].x, arc[i].y);
    bag.closePath();
    // shadow on head
    ctx.save(); ctx.clip(path); ctx.clip(capClip(H, yEdge - 0.14, 1)); ctx.fillStyle = 'rgba(120,10,10,0.10)'; ctx.fill(path); ctx.restore();
    ctx.fillStyle = lin(ctx, -H.rx * 0.6, -H.ry * 1.6, H.rx * 0.7, -H.ry * 0.3, [[0, '#FF6B6B'], [0.55, '#E53935'], [1, '#B71C1C']]);
    ctx.fill(bag);
    // folds: soft darker creases following the flop
    ctx.save(); ctx.clip(bag);
    ctx.lineCap = 'round';
    for (const [a, b, w] of [[0.15, 0.55, 0.10], [0.45, 0.85, 0.08]]) {
      ctx.beginPath();
      ctx.moveTo(peak.x - H.rx * 0.1 + (Rt.x - L.x) * a * 0.3, peak.y + H.ry * 0.15);
      ctx.quadraticCurveTo(peak.x + H.rx * 0.35, peak.y + H.ry * (0.05 + a * 0.3), tip.x - H.rx * (0.45 - b * 0.3), tip.y - H.ry * 0.12);
      ctx.strokeStyle = 'rgba(90,0,0,0.20)'; ctx.lineWidth = H.R * w; ctx.stroke();
    }
    ctx.fillStyle = rad(ctx, peak.x - H.rx * 0.25, peak.y + H.ry * 0.05, 0, H.R * 0.5, [[0, 'rgba(255,255,255,0.32)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fill(bag);
    ctx.restore();
    // trim + pompom
    fuzzyBand(ctx, arc, H.R * 0.3);
    pompom(ctx, tip.x, tip.y + H.R * 0.04, H.R * 0.22);
  }
};

// --- Party hat: chubby cone with rounded tip, polka dots, pompom; sits tilted on the crown
OUTFITS.partyHat = {
  front(ctx, H, path) {
    const baseY = 0.82, baseR = 0.42, lean = -0.24 + H.phys.dx * 0.12;
    // base ring on the head (front arc), apex above, leaning
    const c = proj(H, [0.16, baseY + 0.06, 0]);
    const ring = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; ring.push(proj(H, [0.16 + baseR * Math.sin(a), baseY + 0.06, baseR * Math.cos(a)])); }
    let left = ring.reduce((m, q) => q.x < m.x ? q : m), right = ring.reduce((m, q) => q.x > m.x ? q : m);
    const h = H.ry * 1.6;
    const apex = { x: c.x + Math.sin(lean) * h, y: c.y - Math.cos(lean) * h };
    const front = frontRun(ring);
    const cone = new Path2D();
    cone.moveTo(left.x, left.y);
    cone.quadraticCurveTo((left.x + apex.x) / 2 - H.rx * 0.06, (left.y + apex.y) / 2, apex.x - H.R * 0.05, apex.y + H.R * 0.06);
    cone.quadraticCurveTo(apex.x, apex.y - H.R * 0.03, apex.x + H.R * 0.05, apex.y + H.R * 0.06);
    cone.quadraticCurveTo((right.x + apex.x) / 2 + H.rx * 0.06, (right.y + apex.y) / 2, right.x, right.y);
    for (let i = front.length - 1; i >= 0; i--) cone.lineTo(front[i].x, front[i].y);
    cone.closePath();
        ctx.fillStyle = lin(ctx, left.x, apex.y, right.x, left.y, [[0, '#FF9BD0'], [0.5, '#F15BAE'], [1, '#C2187A']]);
    ctx.fill(cone);
    ctx.save(); ctx.clip(cone);
    // polka dots placed along the cone
    const dots = [[0.25, -0.35], [0.3, 0.3], [0.55, -0.05], [0.72, 0.28], [0.8, -0.3], [0.45, 0.6], [0.48, -0.65]];
    for (const [t, u] of dots) {
      const bx = left.x + (right.x - left.x) * (0.5 + u * 0.5);
      const by = left.y + (right.y - left.y) * (0.5 + u * 0.5);
      const x = bx + (apex.x - bx) * (1 - t) * 0.0 + (apex.x - bx) * (1 - t);
      const y = by + (apex.y - by) * (1 - t);
      const r = H.R * 0.075 * (0.6 + t * 0.5);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    }
    ctx.fillStyle = lin(ctx, left.x, 0, right.x, 0, [[0, 'rgba(255,255,255,0.28)'], [0.35, 'rgba(255,255,255,0)'], [1, 'rgba(80,0,40,0.18)']]);
    ctx.fill(cone);
    ctx.restore();
    // rim at the base
    ctx.beginPath(); front.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y));
    ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = H.R * 0.07; ctx.lineCap = 'round'; ctx.stroke();
    pompom(ctx, apex.x, apex.y - H.R * 0.04, H.R * 0.16, '#FFE27A', '#F2B705');
  }
};

// --- Crown: golden band AROUND the head, spikes all around (back ones behind the head)

export { OUTFITS };
