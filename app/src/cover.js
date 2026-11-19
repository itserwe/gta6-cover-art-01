// Neon Shore cover engine: draws a multi-panel GTA-poster-style cover on any
// 2D canvas. Everything here is original vector art drawn in code: panel
// rectangles, a striped synthwave sun, gradient caption lettering, grain and
// vignette. No external image, font file or logo is used anywhere.

export const LAYOUTS = {
  grid4: { name: 'Grid 4 Panel', panels: 4 },
  hero3: { name: 'Hero + 3 Panel', panels: 4 },
  fullbleed: { name: 'Full-Bleed', panels: 1 },
  trio: { name: 'Trio Vertikal', panels: 3 },
  nine: { name: 'Grid 9 Panel', panels: 9 },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.45) contrast(1.1) brightness(1.03) sepia(0.18)',
    wash: ['rgba(255, 122, 26, 0.20)', 'rgba(255, 45, 120, 0.22)'],
    title: ['#fff7d6', '#ffb347', '#ff2e7e'],
    accent: '#ff2e7e',
    band: ['#2b0a4a', '#7a1042', '#ff7a1a'],
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.6) contrast(1.12) brightness(1.0) hue-rotate(-12deg)',
    wash: ['rgba(0, 229, 255, 0.18)', 'rgba(255, 0, 153, 0.24)'],
    title: ['#eaffff', '#37f6ff', '#ff00a8'],
    accent: '#00e5ff',
    band: ['#050b2e', '#3b0a6e', '#ff00a8'],
  },
  vice: {
    name: 'Vice Gold',
    filter: 'saturate(1.35) contrast(1.06) brightness(1.05) sepia(0.28)',
    wash: ['rgba(255, 190, 60, 0.20)', 'rgba(0, 160, 150, 0.16)'],
    title: ['#fffbe8', '#ffd166', '#ff7a1a'],
    accent: '#ffd166',
    band: ['#062a2a', '#0f5e52', '#ffb347'],
  },
  noir: {
    name: 'Noir',
    filter: 'saturate(0.25) contrast(1.28) brightness(1.02)',
    wash: ['rgba(20, 20, 40, 0.28)', 'rgba(255, 120, 40, 0.10)'],
    title: ['#ffffff', '#e8e8e8', '#ff5a3c'],
    accent: '#ff5a3c',
    band: ['#0d0d12', '#23232e', '#3a3a48'],
  },
  candy: {
    name: 'Candy Pop',
    filter: 'saturate(1.7) contrast(1.08) brightness(1.06) hue-rotate(18deg)',
    wash: ['rgba(255, 110, 199, 0.20)', 'rgba(140, 90, 255, 0.22)'],
    title: ['#fff0fb', '#ff9de2', '#8b5cf6'],
    accent: '#ff6ec7',
    band: ['#2a0a4e', '#7a1e8f', '#ff6ec7'],
  },
};

// The panel rectangles the last drawCover call produced, for hit-testing
// clicks and drags in the editor. Filled in by layoutRects.
export const lastPanelRects = [];

// Split the art area into panel rectangles for one layout. The title band
// is left out of the art area, except for full-bleed where the photo covers
// the whole canvas and the caption floats over a scrim instead.
export function layoutRects(layout, width, height, bandHeight) {
  const pad = Math.round(width * 0.02);
  const gut = Math.round(width * 0.012);
  const art = {
    x: pad,
    y: pad,
    w: width - pad * 2,
    h: height - bandHeight - pad * 2,
  };
  const rects = [];
  if (layout === 'fullbleed') {
    rects.push({ x: 0, y: 0, w: width, h: height });
    return rects;
  }
  if (layout === 'grid4') {
    const cw = (art.w - gut) / 2;
    const ch = (art.h - gut) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        rects.push({ x: art.x + c * (cw + gut), y: art.y + r * (ch + gut), w: cw, h: ch });
      }
    }
    return rects;
  }
  if (layout === 'hero3') {
    const heroW = art.w * 0.6;
    const sideW = art.w - heroW - gut;
    const sideH = (art.h - gut * 2) / 3;
    rects.push({ x: art.x, y: art.y, w: heroW, h: art.h });
    for (let i = 0; i < 3; i++) {
      rects.push({ x: art.x + heroW + gut, y: art.y + i * (sideH + gut), w: sideW, h: sideH });
    }
    return rects;
  }
  if (layout === 'trio') {
    const cw = (art.w - gut * 2) / 3;
    for (let i = 0; i < 3; i++) {
      rects.push({ x: art.x + i * (cw + gut), y: art.y, w: cw, h: art.h });
    }
    return rects;
  }
  // nine: a 3 by 3 contact-sheet grid.
  const cw = (art.w - gut * 2) / 3;
  const ch = (art.h - gut * 2) / 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      rects.push({ x: art.x + c * (cw + gut), y: art.y + r * (ch + gut), w: cw, h: ch });
    }
  }
  return rects;
}

// Draw one photo into a panel rect, cover-fit, with the panel's zoom and
// pan offsets. Offsets are fractions of the panel size, -1 to 1.
export function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  if (!img || !img.naturalWidth) return false;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  let dx = rect.x + (rect.w - dw) / 2 + ox * rect.w * 0.4;
  let dy = rect.y + (rect.h - dh) / 2 + oy * rect.h * 0.4;
  // Never pan so far that the panel shows empty background behind the photo.
  dx = Math.max(rect.x + rect.w - dw, Math.min(rect.x, dx));
  dy = Math.max(rect.y + rect.h - dh, Math.min(rect.y, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
}

// Wash a panel with the grade's sunset or neon colours, blended over the photo.
export function applyGradeOverlay(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, grade.wash[0]);
  g.addColorStop(1, grade.wash[1]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.wash[1];
  ctx.globalAlpha = 0.35;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// A striped synthwave sun: a gradient disc with the lower half cut by
// horizontal gaps, drawn in code. Used in the title band.
export function drawSynthwaveSun(ctx, cx, cy, r, topColor, bottomColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(43, 10, 74, 0.9)';
  let y = cy + r * 0.05;
  let gap = r * 0.06;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap *= 1.35;
  }
  ctx.restore();
}

// One small noise tile, reused as a repeating pattern for the grain.
let noiseTileCache = null;
export function makeNoiseTile(size) {
  if (noiseTileCache) return noiseTileCache;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  noiseTileCache = tile;
  return tile;
}

export function drawGrainOverlay(ctx, width, height, amount) {
  if (amount <= 0) return;
  const tile = makeNoiseTile(140);
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.09 * amount;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawVignette(ctx, width, height) {
  const g = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 0, 20, 0.38)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Fit a bold poster title into a band: shrink the font until the text fits,
// then paint it with a vertical gradient, a dark outline and a hard offset
// shadow, slightly sheared for a poster slant.
export function drawCaptionText(ctx, title, subtitle, band, grade, titleScale, titlePos) {
  const bandX = band.x;
  const bandY = band.y;
  const bandW = band.w;
  const bandH = band.h;
  const sunR = bandH * 0.42;
  const sunX = bandX + bandW - sunR * 1.15;
  const sunY = bandY + bandH * 0.52;
  drawSynthwaveSun(ctx, sunX, sunY, sunR, grade.title[1], grade.accent);

  const textW = bandW - sunR * 2.1;
  const textX = bandX + bandW * 0.045;
  const lines = String(title || 'NEON SHORE').toUpperCase().split('\n').slice(0, 2);
  let size = bandH * 0.40 * titleScale;
  const family = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif';
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`;
  const measure = (s) => {
    ctx.font = `900 ${s}px ${family}`;
    return Math.max(...lines.map((line) => ctx.measureText(line).width));
  };
  while (size > bandH * 0.14 && measure(size) > textW) size *= 0.92;
  const titleY = titlePos === 'top'
    ? bandY + bandH * 0.38
    : bandY + bandH * (lines.length > 1 ? 0.42 : 0.46);
  ctx.translate(textX, titleY);
  ctx.transform(1, 0, -0.05, 1, 0, 0);
  ctx.font = `900 ${size}px ${family}`;
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(0.55, grade.title[1]);
  grad.addColorStop(1, grade.title[2]);
  const lineGap = size * 1.04;
  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * lineGap;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#160a2e';
    ctx.strokeText(line, 0, y);
    ctx.fillStyle = grad;
    ctx.fillText(line, 0, y);
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, 0, y - size * 0.05);
    ctx.restore();
  });
  ctx.restore();

  // Neon script subtitle under the title, with a soft glow.
  const sub = String(subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(12, bandH * 0.13 * titleScale);
    ctx.save();
    ctx.font = `italic 700 ${subSize}px "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = bandH * 0.10;
    ctx.fillStyle = grade.accent;
    const subY = titlePos === 'top'
      ? bandY + bandH * 0.38 + size * 0.85
      : bandY + bandH * 0.82;
    ctx.fillText(sub, textX, subY);
    ctx.restore();
  }

  // Tiny badge line: three stars and the year, letterspaced, top of the band.
  ctx.save();
  const badgeSize = Math.max(10, bandH * 0.09);
  ctx.font = `700 ${badgeSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${badgeSize * 0.22}px`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('★ ★ ★   EST. 2026', textX, bandY + bandH * 0.13);
  ctx.restore();
}

// Paint the whole cover: background, panels with grade, title band, grain
// and vignette. `state` carries layout, grade, photos, panels, caption and
// effect toggles; `photos` is the array of loaded Image objects.
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const bandH = state.layout === 'fullbleed' ? 0 : Math.round(H * (H >= W ? 0.26 : 0.30));
  const band = { x: 0, y: H - bandH, w: W, h: bandH };

  // Deep sunset backdrop behind the panels.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, grade.band[0]);
  bg.addColorStop(0.55, grade.band[1]);
  bg.addColorStop(1, grade.band[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, W, H, bandH);
  lastPanelRects.length = 0;
  rects.forEach((rect) => lastPanelRects.push({ ...rect }));

  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = photos[panel.photo] || null;
    ctx.save();
    const radius = Math.round(Math.min(rect.w, rect.h) * 0.02);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    else ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      ctx.filter = grade.filter;
      const ok = drawPhotoCover(ctx, img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
      ctx.filter = 'none';
      if (ok) applyGradeOverlay(ctx, rect, grade);
    } else {
      ctx.fillStyle = '#3a2350';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    // Crisp white poster frame around every panel.
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    else ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.stroke();
    ctx.restore();
  });

  // Outer poster frame.
  ctx.save();
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.restore();

  if (state.layout === 'fullbleed') {
    // Scrim so the caption stays readable over the photo.
    const scrim = ctx.createLinearGradient(0, H * 0.55, 0, H);
    scrim.addColorStop(0, 'rgba(20, 4, 40, 0)');
    scrim.addColorStop(1, 'rgba(20, 4, 40, 0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    const floatBand = { x: 0, y: H - Math.round(H * 0.30), w: W, h: Math.round(H * 0.30) };
    drawCaptionText(ctx, state.title, state.subtitle, floatBand, grade, state.titleSize || 1, state.titlePos || 'bottom');
  } else {
    const bandGrad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    bandGrad.addColorStop(0, grade.band[0]);
    bandGrad.addColorStop(0.6, grade.band[1]);
    bandGrad.addColorStop(1, grade.band[2]);
    ctx.fillStyle = bandGrad;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(band.x, band.y, band.w, Math.max(2, H * 0.004));
    drawCaptionText(ctx, state.title, state.subtitle, band, grade, state.titleSize || 1, state.titlePos || 'bottom');
  }

  if (state.grain !== false) drawGrainOverlay(ctx, W, H, state.grainAmount || 0.7);
  if (state.vignette !== false) drawVignette(ctx, W, H);
}
