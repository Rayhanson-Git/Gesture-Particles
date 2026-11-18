// Draws the README artwork for Gesture Particles into ../assets.
// Run from design/: npm install && npm run build
import { C, F, text, paragraph, label, svg, frame, arrow, key, write, r2, measure, REDUCED } from './lib.mjs';

let seed = 5;
const rand = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + ((seed - 1) / 2147483646) * (b - a); };

// The open hand from src/gestures/fixtures.ts (MediaPipe's 21 landmarks).
const OPEN = [[0.5, 0.8], [0.42, 0.74], [0.36, 0.66], [0.31, 0.59], [0.27, 0.53], [0.44, 0.58], [0.42, 0.47], [0.41, 0.4], [0.4, 0.34],
  [0.5, 0.56], [0.5, 0.44], [0.5, 0.36], [0.5, 0.3], [0.56, 0.58], [0.58, 0.47], [0.59, 0.4], [0.6, 0.35], [0.61, 0.62], [0.65, 0.54], [0.68, 0.49], [0.7, 0.45]];
const PINCH = OPEN.map((p, i) => (i === 8 ? [0.29, 0.52] : i === 4 ? [0.27, 0.53] : i === 7 ? [0.33, 0.47] : p));
const TILT = OPEN.map(([x, y]) => { const a = -0.55, dx = x - 0.5, dy = y - 0.8; return [0.5 + dx * Math.cos(a) - dy * Math.sin(a), 0.8 + dx * Math.sin(a) + dy * Math.cos(a)]; });
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]];

/** A hand skeleton, centred on cx, with its fingertips near y = top, s units across. `hi` lists landmarks to highlight. */
function hand(pts, cx, top, s, { mirror = false, hi = [], hiColor = C.accent2, ink = C.ice } = {}) {
  const P = pts.map(([px, py]) => [cx + ((mirror ? 1 - px : px) - 0.5) * s, top + (py - 0.28) * s]);
  let out = BONES.map(([a, b]) => `<path d="M${r2(P[a][0])} ${r2(P[a][1])}L${r2(P[b][0])} ${r2(P[b][1])}" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`).join('');
  out += P.map(([px, py], i) => `<circle cx="${r2(px)}" cy="${r2(py)}" r="${hi.includes(i) ? 5 : 2.6}" fill="${hi.includes(i) ? hiColor : C.ink}"/>`).join('');
  return { svg: out, P };
}

/** A dot sphere (Fibonacci lattice), drawn in the card's palette. */
function dotSphere(cx, cy, R, n, { tilt = 0.35 } = {}) {
  let out = '';
  const ga = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
    let x = Math.cos(th) * r, z = Math.sin(th) * r;
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt); z = y * Math.sin(tilt) + z * Math.cos(tilt);
    pts.push([x, y2, z]);
  }
  pts.sort((a, b) => a[2] - b[2]);
  for (const [x, y, z] of pts) {
    const depth = (z + 1) / 2;
    const col = rand() < 0.08 ? C.accent2 : rand() < 0.45 ? C.ice : C.ink;
    const d = r2(rand(0, 4));
    out += `<circle class="tw" style="animation-delay:-${d}s" cx="${r2(cx + x * R)}" cy="${r2(cy + y * R)}" r="${r2(0.8 + depth * 2.2)}" fill="${col}" opacity="${r2(0.15 + depth * 0.8)}"/>`;
  }
  return out;
}

// ------------------------------------------------------------------ hero
function hero(H = 440, file = 'assets/hero.svg') {
  const W = 1280, dy = (H - 440) / 2;
  seed = 5;
  const style = `.tw{animation:tw 4s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
.breathe{transform-box:fill-box;transform-origin:center;animation:br 6s ease-in-out infinite}@keyframes br{0%,100%{transform:scale(.96)}50%{transform:scale(1.04)}}
.flow{stroke-dasharray:4 10;animation:fl 1.6s linear infinite}@keyframes fl{to{stroke-dashoffset:-28}}${REDUCED}`;
  const h = hand(OPEN, 790, 95 + dy, 420, { hi: [4, 8], hiColor: C.accent2 });
  let b = frame(W, H);
  b += `<g class="breathe">${dotSphere(1080, 220 + dy, 140, 520)}</g>`;
  b += h.svg;
  b += `<path class="flow" d="M${r2(h.P[8][0] + 12)} ${r2(h.P[8][1] - 6)}C 880 ${70 + dy} 930 ${80 + dy} 975 ${120 + dy}" stroke="${C.accent2}" stroke-width="1.6" stroke-linecap="round"/>`;
  b += label('Computer vision · Three.js · 2026', { x: 64, y: 118 + dy });
  b += text('Gesture Particles', { font: F.display, size: 62, x: 62, y: 190 + dy, fill: C.ink });
  b += paragraph('A field of light you shape with your hands. Webcam hand tracking grows, turns, recolours and pushes up to 100,000 particles, right in the browser.', { x: 64, y: 240 + dy, width: 560, size: 19 }).svg;
  b += label('Spread · Pinch · Tilt · Open palm', { x: 64, y: 360 + dy, fill: C.accent2 });
  write(file, svg(W, H, b, {
    title: 'Gesture Particles',
    desc: 'Computer vision and Three.js. A hand skeleton reaches towards a sphere made of glowing dots.',
    style,
  }));
}

// -------------------------------------------------------------- gestures
function gestures() {
  const W = 1280, H = 700;
  let b = frame(W, H);
  b += label('The gesture map', { x: 56, y: 64 });
  b += text('Two hands, five gestures', { font: F.display, size: 30, x: 56, y: 104, fill: C.ink });
  const cards = [
    { title: 'Right hand · spread', pts: OPEN, hi: [0, 4, 8, 12, 16, 20], col: C.ice, rule: 'Grow', body: 'Scale = openness × 6. Openness is the summed wrist-to-fingertip distance ÷ 2.5 − 0.3, from 0 to 1.', mouse: 'Scroll, or pinch two fingers' },
    { title: 'Right hand · pinch', pts: PINCH, hi: [4, 8], col: C.accent2, rule: 'Shrink', body: 'Thumb and index tips closer than 0.05: scale = 0.1 + gap ÷ 0.15 × 0.4, so 0.1 to 0.5.', mouse: 'Scroll down' },
    { title: 'Right hand · open palm', pts: OPEN, hi: [0, 5, 9, 13, 17], col: '#9be7ff', rule: 'Push', body: 'With the force field on, an open palm (openness over 0.5) pushes away particles within 1.1 scene units of the palm.', mouse: 'Hover the pointer' },
    { title: 'Left hand · tilt', pts: TILT, hi: [0, 5, 9, 17], col: C.ink, rule: 'Turn', body: 'The wrist-to-middle-knuckle line sets x and y; the knuckle line sets z. The shape eases a tenth of the way each frame.', mouse: 'Drag' },
    { title: 'Left hand · pinch', pts: PINCH, hi: [4, 8], col: '#ff6b35', rule: 'Recolour', body: 'Each new pinch moves to the next of the nine colour presets, the same cycle as before.', mouse: 'Click or tap, or press C' },
  ];
  const cw = (W - 112 - 4 * 16) / 5;
  cards.forEach((c, i) => {
    const x = 56 + i * (cw + 16), y = 140;
    b += `<rect x="${r2(x)}" y="${y}" width="${r2(cw)}" height="512" rx="16" fill="${C.paper2}" stroke="${C.rule}"/>`;
    const mirror = c.title.startsWith('Left');
    const tilt = c.rule === 'Turn';
    const hd = hand(c.pts, x + cw / 2 - (tilt ? 36 : 0), y + (tilt ? 70 : 40), tilt ? 300 : 360, { hi: c.hi, hiColor: c.col, mirror });
    if (c.rule === 'Push') { const [px, py] = [(hd.P[5][0] + hd.P[17][0] + hd.P[0][0]) / 3, (hd.P[5][1] + hd.P[17][1] + hd.P[0][1]) / 3]; b += `<circle cx="${r2(px)}" cy="${r2(py)}" r="62" stroke="${c.col}" stroke-dasharray="3 5" opacity=".6"/><circle cx="${r2(px)}" cy="${r2(py)}" r="90" stroke="${c.col}" stroke-dasharray="2 7" opacity=".3"/>`; }
    b += hd.svg;
    b += label(c.title, { x: x + 18, y: y + 290, size: 10.5 });
    b += text(c.rule, { font: F.display, size: 26, x: x + 18, y: y + 326, fill: c.col });
    b += paragraph(c.body, { x: x + 18, y: y + 356, width: cw - 36, size: 13.5, lineHeight: 1.45 }).svg;
    b += `<path d="M${r2(x + 18)} ${y + 462}H${r2(x + cw - 18)}" stroke="${C.rule}"/>`;
    b += label('Without a camera', { x: x + 18, y: y + 482, size: 9.5, fill: C.muted });
    b += text(c.mouse, { font: F.bodyMedium, size: 13, x: x + 18, y: y + 501, fill: C.ink2 });
  });
  write('assets/gestures.svg', svg(W, H, b, {
    title: 'The gesture map',
    desc: 'Right hand spread grows the shape; right hand pinch shrinks it; an open right palm pushes particles with the force field; tilting the left wrist turns the shape; a left-hand pinch moves to the next colour. Each has a mouse equivalent: scroll, hover, drag and click.',
  }));
}

// ---------------------------------------------------------- architecture
function architecture() {
  const W = 1280, H = 600;
  let b = frame(W, H);
  b += label('How it works', { x: 56, y: 64 });
  b += text('From a webcam frame to 100,000 points of light', { font: F.display, size: 30, x: 56, y: 104, fill: C.ink });
  const box = (x, y, w, h, title, lines, { accent = C.haze, tag } = {}) => {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${C.paper2}" stroke="${accent}"/>`;
    if (tag) s += label(tag, { x: x + 16, y: y + 24, size: 9.5, fill: C.muted });
    s += text(title, { font: F.bodyMedium, size: 16, x: x + 16, y: y + (tag ? 48 : 30), fill: C.ink });
    lines.forEach((l, i) => { s += text(l, { font: F.body, size: 13, x: x + 16, y: y + (tag ? 72 : 54) + i * 19, fill: C.ink2 }); });
    return s;
  };
  const row = 160, bh = 150;
  b += box(56, row, 190, bh, 'Webcam', ['640 × 480 frames', 'never leave the', 'browser'], { tag: 'Input' });
  b += box(286, row, 210, bh, 'MediaPipe Hands', ['in-browser WebAssembly', 'up to 2 hands ×', '21 landmarks'], { tag: 'Tracking' });
  b += box(536, row, 210, bh, 'Gesture maths', ['openness · pinch', 'wrist rotation · palm', 'src/gestures, tested'], { tag: 'Pure functions', accent: C.ice });
  b += box(786, row, 200, bh, 'Scene targets', ['scale (0 to 8)', 'rotation · colour', 'force position'], { tag: 'React + refs' });
  b += box(1026, row, 198, bh, 'GPU particles', ['morph · jitter', 'twinkle · gradient', 'force field'], { tag: 'Vertex shader', accent: C.accent2 });
  for (const [x1, x2] of [[246, 286], [496, 536], [746, 786], [986, 1026]]) b += arrow(x1 + 4, row + 75, x2 - 4, row + 75, { stroke: C.ice, width: 1.6 });
  // second row
  const r2y = 380;
  b += box(536, r2y, 210, 120, 'Mouse, touch, keys', ['drag · scroll · pinch', 'click · hover · 12 keys'], { tag: 'No camera needed' });
  b += `<path d="M641 ${r2y - 4}V${r2y - 40}H850" stroke="${C.haze}" stroke-width="1.5" stroke-dasharray="4 5"/>` + arrow(850, r2y - 40, 850, row + bh + 6, { stroke: C.haze, width: 1.5, dash: '4 5' });
  b += box(786, r2y, 200, 120, 'Settings', ['saved in localStorage', 'checked on load'], { tag: 'Remembered' });
  b += arrow(930, r2y - 4, 930, row + bh + 6, { stroke: C.haze, width: 1.5, dash: '4 5' });
  b += box(1026, r2y, 198, 120, 'Bloom', ['UnrealBloomPass', '0 to 3 strength'], { tag: 'Post-processing' });
  b += arrow(1125, row + bh + 4, 1125, r2y - 4, { stroke: C.accent2, width: 1.6 });
  b += box(56, r2y, 440, 120, 'Shapes', ['12 templates, each a list of x, y, z positions', 'made on the CPU once per change, then uploaded'], { tag: 'src/particles/templates.ts' });
  b += `<path d="M276 ${r2y + 124}V${r2y + 150}H1248V${row + 40}" stroke="${C.haze}" stroke-width="1.2" stroke-dasharray="2 6"/>` + arrow(1248, row + 40, 1228, row + 40, { stroke: C.haze, width: 1.2 });
  write('assets/architecture.svg', svg(W, H, b, {
    title: 'How Gesture Particles works',
    desc: 'Webcam frames go to MediaPipe Hands in the browser, which finds up to two hands of 21 landmarks. Pure gesture functions turn them into scale, rotation, colour and force targets. A vertex shader moves up to 100,000 particles, and a bloom pass makes them glow. Mouse, touch and keyboard drive the same targets, and settings are saved in localStorage.',
  }));
}

hero(); hero(640, 'design/social.svg'); gestures(); architecture();
