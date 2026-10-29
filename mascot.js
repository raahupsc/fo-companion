// Pip: a small squircle companion with big eyes, living in the corner.
// States: idle | working | alert | happy
export function createMascot(container) {
  container.innerHTML = `
  <svg id="pip" width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="Pip, your Fo companion">
    <defs>
      <radialGradient id="pipbody" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#3b475c"/><stop offset="100%" stop-color="#232b3a"/>
      </radialGradient>
    </defs>
    <g id="pip-bob">
      <rect x="10" y="10" width="52" height="52" rx="18" fill="url(#pipbody)" stroke-width="0"/>
      <rect x="10" y="10" width="52" height="52" rx="18" fill="none" stroke="var(--acc)" stroke-width="0" id="pip-ring"/>
      <g id="pip-eyeL">
        <circle cx="28" cy="36" r="9" fill="#eef2f8"/>
        <circle cx="28" cy="36" r="4.5" fill="#101520" class="pupil"/>
        <rect x="19" y="27" width="18" height="0" fill="#232b3a" class="lid"/>
      </g>
      <g id="pip-eyeR">
        <circle cx="44" cy="36" r="9" fill="#eef2f8"/>
        <circle cx="44" cy="36" r="4.5" fill="#101520" class="pupil"/>
        <rect x="35" y="27" width="18" height="0" fill="#232b3a" class="lid"/>
      </g>
      <path id="pip-mouth" d="M30 50 Q36 54 42 50" stroke="#eef2f8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>
  </svg>`;
  const svg = container.querySelector("#pip");
  const pupils = [...container.querySelectorAll(".pupil")];
  const lids = [...container.querySelectorAll(".lid")];
  const mouth = container.querySelector("#pip-mouth");
  const ring = container.querySelector("#pip-ring");
  const bob = container.querySelector("#pip-bob");
  let state = "idle";

  // Eyes follow pointer or last touch
  addEventListener("pointermove", e => {
    if (state !== "idle") return;
    const r = svg.getBoundingClientRect();
    const dx = Math.max(-3, Math.min(3, (e.clientX - (r.x + 36)) / 60));
    const dy = Math.max(-3, Math.min(3, (e.clientY - (r.y + 36)) / 60));
    pupils.forEach(p => p.setAttribute("transform", `translate(${dx},${dy})`));
  }, { passive: true });

  // Blink
  setInterval(() => {
    if (state === "working") return;
    lids.forEach(l => l.setAttribute("height", "9"));
    setTimeout(() => lids.forEach(l => l.setAttribute("height", "0")), 140);
  }, 3800 + Math.random() * 2200);

  function setState(next) {
    state = next;
    bob.style.transition = "transform .3s";
    svg.style.filter = "";
    ring.setAttribute("stroke-width", "0");
    if (next === "idle") { bob.style.transform = "translateY(0)"; mouth.setAttribute("d", "M30 50 Q36 54 42 50"); }
    if (next === "working") {
      mouth.setAttribute("d", "M30 52 Q36 49 42 52");
      svg.style.filter = "drop-shadow(0 0 8px var(--acc))";
      bob.style.transform = "translateY(-3px)";
    }
    if (next === "alert") {
      ring.setAttribute("stroke-width", "2.5");
      bob.style.transform = "translateY(-5px)";
    }
    if (next === "happy") {
      mouth.setAttribute("d", "M29 48 Q36 55 43 48");
      bob.style.transform = "translateY(-2px) rotate(4deg)";
      setTimeout(() => setState("idle"), 2200);
    }
  }
  return { setState };
}
