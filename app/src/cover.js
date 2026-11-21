// Key Largo cover renderer: draws the full GTA-style poster cover onto a canvas.
// One pure function, renderCover, shared by the live preview and the PNG export,
// so the exported PNG is exactly the cover the editor shows.
// All drawing is local: photos are files under app/ or data: URIs the user loaded.

export const GRADES = {
  sunset: { name: 'Sunset', filter: 'saturate(1.32) contrast(1.06)', top: 'rgba(255,122,26,0.16)', bottom: 'rgba(255,0,110,0.20)' },
  golden: { name: 'Golden Hour', filter: 'saturate(1.18) contrast(1.04)', top: 'rgba(255,190,60,0.20)', bottom: 'rgba(255,110,20,0.16)' },
  neon: { name: 'Neon Night', filter: 'saturate(1.38) contrast(1.08)', top: 'rgba(120,40,255,0.16)', bottom: 'rgba(255,0,140,0.24)' },
  vice: { name: 'Vice Pink', filter: 'saturate(1.30) contrast(1.05)', top: 'rgba(255,90,160,0.20)', bottom: 'rgba(190,0,120,0.20)' },
};

export const SIZES = {
  '16:9': { w: 1920, h: 1080, label: '1920 x 1080' },
  '1:1': { w: 1080, h: 1080, label: '1080 x 1080' },
  '4:5': { w: 1080, h: 1350, label: '1080 x 1350' },
};

// Panel order: index 0 is the dominant hero, the rest fill the tight grid.
export const DEFAULT_PANELS = [
  { src: 'samples/hero.jpg', role: 'THE CAPTAIN', sub: 'MARINA DEL SOL · 6:40 PM · OWNS THE BOAT', zoom: 1, ox: 0, oy: 0, flip: false },
  { src: 'samples/boulevard.jpg', role: 'THE WILDCARD', sub: 'OCEAN TERRACE · 6:00 PM · ALWAYS BETS BIG', zoom: 1, ox: 0, oy: 0, flip: false },
  { src: 'samples/fixer.jpg', role: 'THE FIXER', sub: 'CHARTER DOCK · 5:55 PM · KNOWS EVERYONE', zoom: 1, ox: 0, oy: 0.7, flip: false },
  { src: 'samples/driver.jpg', role: 'THE DRIVER', sub: 'OCEAN DRIVE · 7:15 PM · NEVER WALKS', zoom: 1, ox: 0, oy: 0, flip: false },
  { src: 'samples/runner.jpg', role: 'THE RUNNER', sub: 'SOUTH BEACH · 6:05 PM · ALWAYS FIRST OUT', zoom: 1, ox: 0, oy: 0, flip: false },
  { src: 'samples/queen.jpg', role: 'THE QUEEN', sub: 'SUNSET PIER · 6:20 PM · RUNS THE CREW', zoom: 1, ox: 0, oy: 0, flip: false },
  { src: 'samples/lookout.jpg', role: 'THE LOOKOUT', sub: 'ROOFTOP BAR · 8:05 PM · SEES EVERYTHING', zoom: 1, ox: 0, oy: 0.5, flip: false },
];

export function defaultState() {
  return {
    title: 'KEY LARGO',
    script: 'one last summer in the Keys',
    tagline: 'SIX SNAPS · ONE SUMMER · NO REGRETS',
    quote: 'PURE GOLDEN-HOUR MAYHEM',
    outlet: 'THE KEYS LEDGER',
    billing: 'KEY LARGO COVER STUDIO  •  A CREW OF SEVEN  •  SHOT ON THE KEYS',
    seal: 'BEST CREW',
    edition: 'VOL. 02',
    grade: 'sunset',
    size: '16:9',
    panels: DEFAULT_PANELS.map((p) => ({ ...p })),
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCoverFit(ctx, img, x, y, w, h, zoom, ox, oy, flip) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * (zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // Pan maps [-1, 1] across the full hidden overflow, so a portrait photo in a
  // wide panel can still show its subject's face instead of its middle.
  const dx = x + (w - dw) / 2 + (ox || 0) * Math.max(0, (dw - w) / 2);
  const dy = y + (h - dh) / 2 + (oy || 0) * Math.max(0, (dh - h) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (flip) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPolaroid(ctx, img, panel, rect, rot, grade, selected) {
  const { x, y, w, h, capH } = rect;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#fdfcf8';
  roundRect(ctx, -w / 2, -h / 2, w, h, 6);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  const px = -w / 2 + 14;
  const py = -h / 2 + 14;
  const pw = w - 28;
  const ph = h - capH - 28;
  ctx.save();
  ctx.filter = grade.filter;
  drawCoverFit(ctx, img, px, py, pw, ph, panel.zoom, panel.ox, panel.oy, panel.flip);
  ctx.restore();
  // Role tag chip pinned to the photo's top-left corner, clear of the
  // giant title that overlaps the panels' lower half.
  ctx.font = `700 ${Math.round(capH * 0.42)}px Oswald, sans-serif`;
  const label = panel.role;
  const tw = ctx.measureText(label).width;
  const chipH = capH * 0.52;
  const chipW = tw + capH * 0.55;
  const chipX = px + 10;
  const chipY = py + 10;
  ctx.fillStyle = 'rgba(12,8,20,0.92)';
  roundRect(ctx, chipX, chipY, chipW, chipH, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(label, chipX + capH * 0.28, chipY + chipH / 2 + 1);
  // Caption strip: the sub-line (place · time · quip).
  ctx.fillStyle = '#3a3340';
  ctx.font = `500 ${Math.round(capH * 0.30)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(panel.sub, 0, h / 2 - capH / 2 + 1, w - 20);
  if (selected) {
    ctx.strokeStyle = '#ff2e9a';
    ctx.lineWidth = 5;
    roundRect(ctx, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStarburst(ctx, cx, cy, r, text) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i += 1) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#f5b90d';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#7a4d00';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#3d2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(r * 0.30)}px Oswald, sans-serif`;
  ctx.fillText('★', 0, -r * 0.28);
  ctx.font = `700 ${Math.round(r * 0.22)}px Oswald, sans-serif`;
  const words = text.split(' ');
  ctx.fillText(words.join(' '), 0, r * 0.12);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#111';
  let bx = x;
  let seed = 7;
  while (bx < x + w - 4) {
    seed = (seed * 16807) % 2147483647;
    const bw = 2 + (seed % 5);
    if (seed % 3 !== 0) ctx.fillRect(bx, y, bw, h);
    bx += bw + 2;
  }
  ctx.restore();
}

// Layout for one cover size. Landscape keeps the hero big at bottom-left with a
// tight 2x3 grid on the right; square and portrait stack the hero on top of a
// 3x2 grid. The giant title always sits in the middle, overlapping the panels.
function layoutFor(W, H) {
  const landscape = W / H > 1.3;
  if (landscape) {
    const s = W / 1920;
    const hero = { x: 56, y: 330, w: 880, h: 690, capH: 134 };
    const grid = [];
    const xs = [972, 1420];
    const ys = [128, 438, 748];
    const rots = [-1.1, 1.2, 1.0, -0.9, -1.2, 0.9];
    let i = 0;
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 2; c += 1) {
        grid.push({ x: xs[c], y: ys[r], w: 424, h: 280, capH: 62, rot: (rots[i] * Math.PI) / 180 });
        i += 1;
      }
    }
    return {
      s, landscape,
      hero: { ...hero, rot: (-1.5 * Math.PI) / 180 },
      grid,
      title: { cx: 990, size: 168, baselineY: 350 },
      scriptY: 440,
      ribbon: { cx: 990, y: 486, w: 780, h: 52 },
      topBarY: 62,
      bottomBarY: 1046,
      billingMax: 0.52,
      comingCx: 0.66,
      comingSize: 30,
      seal: { x: 880, y: 830, r: 52 },
      barcode: { x: 1690, y: 1022, w: 110, h: 40 },
    };
  }
  const u = W / 1080;
  const heroH = H * 0.36;
  const hero = { x: 44 * u, y: H * 0.17, w: W - 88 * u, h: heroH, capH: heroH * 0.19 };
  const grid = [];
  const gw = (W - 88 * u - 32 * u) / 3;
  const gh = H * 0.135;
  const gy0 = H * 0.17 + heroH + 26 * u;
  const rots = [-1.0, 1.1, -0.8, 0.9, -1.1, 0.8];
  let i = 0;
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      grid.push({
        x: 44 * u + c * (gw + 16 * u), y: gy0 + r * (gh + 16 * u),
        w: gw, h: gh, capH: gh * 0.30, rot: (rots[i] * Math.PI) / 180,
      });
      i += 1;
    }
  }
  return {
    s: u, landscape,
    hero: { ...hero, rot: (-1.2 * Math.PI) / 180 },
    grid,
    title: { cx: W / 2, size: 150 * u, baselineY: H * 0.17 + heroH * 0.55 },
    scriptY: H * 0.17 + heroH * 0.55 + 54 * u,
    ribbon: { cx: W / 2, y: H * 0.17 + heroH * 0.55 + 74 * u, w: 640 * u, h: 46 * u },
    topBarY: 58 * u,
    bottomBarY: H - 34 * u,
    billingMax: 0.58,
    comingCx: 0.72,
    comingSize: 24,
    seal: { x: W - 120 * u, y: H * 0.17 + heroH * 0.75, r: 48 * u },
    barcode: { x: W - 200 * u, y: H - 48 * u, w: 84 * u, h: 32 * u },
  };
}

export function renderCover(canvas, state, images, selectedIndex = -1) {
  const size = SIZES[state.size] || SIZES['16:9'];
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const L = layoutFor(W, H);
  const u = L.s;

  // Full-bleed sunset boulevard background.
  const bg = images['samples/boulevard.jpg'];
  if (bg) {
    ctx.save();
    ctx.filter = grade.filter;
    drawCoverFit(ctx, bg, 0, 0, W, H, 1.05, 0, 0, false);
    ctx.restore();
  } else {
    const g0 = ctx.createLinearGradient(0, 0, 0, H);
    g0.addColorStop(0, '#ff9a3d');
    g0.addColorStop(1, '#c2189b');
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);
  }
  const tint = ctx.createLinearGradient(0, 0, 0, H);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  // Vignette so the polaroids sit on a darker edge.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  vig.addColorStop(0, 'rgba(20,0,30,0)');
  vig.addColorStop(1, 'rgba(20,0,30,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Top bar: five gold stars, press quote, outlet — and the edition box.
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.round(34 * u)}px Oswald, sans-serif`;
  ctx.fillStyle = '#ffd76a';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText('★★★★★', 64 * u, L.topBarY);
  const starsW = ctx.measureText('★★★★★').width;
  ctx.fillStyle = '#fff';
  ctx.font = `italic 600 ${Math.round(30 * u)}px Oswald, sans-serif`;
  ctx.fillText(`“${state.quote}”`, 64 * u + starsW + 22 * u, L.topBarY);
  const quoteW = ctx.measureText(`“${state.quote}”`).width;
  ctx.fillStyle = '#ffd76a';
  ctx.font = `700 ${Math.round(26 * u)}px Oswald, sans-serif`;
  ctx.fillText(`— ${state.outlet}`, 64 * u + starsW + 22 * u + quoteW + 18 * u, L.topBarY);
  ctx.restore();
  ctx.save();
  ctx.font = `700 ${Math.round(28 * u)}px Oswald, sans-serif`;
  const edW = ctx.measureText(state.edition).width + 44 * u;
  ctx.fillStyle = 'rgba(12,8,20,0.85)';
  roundRect(ctx, W - 64 * u - edW, L.topBarY - 26 * u, edW, 52 * u, 6);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.edition, W - 64 * u - edW / 2, L.topBarY + 1);
  ctx.restore();

  // The seven polaroids: one dominant hero, six in a tight grid.
  const heroImg = images[state.panels[0].src];
  if (heroImg) drawPolaroid(ctx, heroImg, state.panels[0], L.hero, L.hero.rot, grade, selectedIndex === 0);
  state.panels.slice(1).forEach((panel, i) => {
    const img = images[panel.src];
    if (img) drawPolaroid(ctx, img, panel, L.grid[i], L.grid[i].rot, grade, selectedIndex === i + 1);
  });

  // Giant striped title across the middle, overlapping the panels.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${Math.round(L.title.size)}px Anton, sans-serif`;
  const titleW = ctx.measureText(state.title).width;
  const grad = ctx.createLinearGradient(L.title.cx - titleW / 2, 0, L.title.cx + titleW / 2, 0);
  grad.addColorStop(0, '#fff3d6');
  grad.addColorStop(0.25, '#ffd76a');
  grad.addColorStop(0.45, '#ff9a3d');
  grad.addColorStop(0.65, '#ff5e8a');
  grad.addColorStop(0.85, '#e93aa8');
  grad.addColorStop(1, '#c2189b');
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.round(11 * u);
  ctx.strokeText(state.title, L.title.cx, L.title.baselineY);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, L.title.cx, L.title.baselineY);
  ctx.restore();

  // Pink neon script subtitle, right under the title.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(52 * u)}px Pacifico, cursive`;
  ctx.fillStyle = '#ff5ec4';
  ctx.shadowColor = '#ff2e9a';
  ctx.shadowBlur = 22;
  ctx.fillText(state.script, L.title.cx, L.scriptY);
  ctx.restore();

  // Ribbon slogan pill.
  ctx.save();
  ctx.font = `700 ${Math.round(27 * u)}px Oswald, sans-serif`;
  const tagW = Math.max(ctx.measureText(state.tagline).width + 56 * u, L.ribbon.w);
  ctx.fillStyle = 'rgba(12,8,20,0.92)';
  roundRect(ctx, L.ribbon.cx - tagW / 2, L.ribbon.y, tagW, L.ribbon.h, L.ribbon.h / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '3px'; } catch (e) { /* older canvas: no letter spacing */ }
  ctx.fillText(state.tagline, L.ribbon.cx, L.ribbon.y + L.ribbon.h / 2 + 1);
  ctx.restore();

  // Bottom bar: billing block, COMING SOON, barcode, gold seal.
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `500 ${Math.round(21 * u)}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 5;
  ctx.fillText(state.billing, 64 * u, L.bottomBarY, W * L.billingMax);
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(L.comingSize * u)}px Oswald, sans-serif`;
  ctx.fillStyle = '#ffd76a';
  ctx.fillText('COMING SOON', W * L.comingCx, L.bottomBarY);
  ctx.restore();
  drawBarcode(ctx, L.barcode.x, L.barcode.y, L.barcode.w, L.barcode.h);
  drawStarburst(ctx, L.seal.x, L.seal.y, L.seal.r, state.seal);

  // Thin gold inner frame to finish the poster.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,106,0.55)';
  ctx.lineWidth = 3 * u;
  ctx.strokeRect(14 * u, 14 * u, W - 28 * u, H - 28 * u);
  ctx.restore();
}
