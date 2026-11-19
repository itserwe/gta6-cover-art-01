// Neon Shore editor: wires the controls to the cover engine. Photos are
// read with FileReader on this machine and never leave the browser; the two
// sample photos ship under app/samples/ and load as the defaults.

import { LAYOUTS, GRADES, drawCover, lastPanelRects } from './cover.js';
import { shotPreset, fitCoverShotCanvas } from './shots.js';

const SIZES = {
  '1080x1080': { w: 1080, h: 1080, preview: [880, 880], label: '1080 × 1080 (Feed)' },
  '1080x1350': { w: 1080, h: 1350, preview: [704, 880], label: '1080 × 1350 (Portrait)' },
  '1920x1080': { w: 1920, h: 1080, preview: [880, 495], label: '1920 × 1080 (Landscape)' },
};

const SAMPLES = [
  { src: 'samples/boulevard.jpg', label: 'Contoh 1 · Boulevard' },
  { src: 'samples/pier.jpg', label: 'Contoh 2 · Dermaga' },
];

function defaultPanels() {
  // Default offsets lean toward the top of each photo, so faces survive
  // the cover-fit crop in wide panels; the user can still drag any panel.
  const base = [
    { photo: 0, zoom: 1.05, ox: 0, oy: 0.8 },
    { photo: 1, zoom: 1.0, ox: 0, oy: 0.6 },
    { photo: 0, zoom: 1.1, ox: 0.1, oy: 0.5 },
    { photo: 1, zoom: 1.1, ox: -0.1, oy: 0.5 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0.5 },
    { photo: 1, zoom: 1.15, ox: 0, oy: 0.5 },
    { photo: 0, zoom: 1.2, ox: 0, oy: 0.5 },
    { photo: 1, zoom: 1.2, ox: 0, oy: 0.5 },
    { photo: 0, zoom: 1.15, ox: 0, oy: 0.5 },
  ];
  return base;
}

const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'NEON SHORE',
  subtitle: 'Golden hour on the boulevard',
  titleSize: 1,
  titlePos: 'bottom',
  sizeKey: '1080x1080',
  grain: true,
  grainAmount: 0.7,
  vignette: true,
  selected: 0,
  panels: defaultPanels(),
};

const photos = [];
let undoStack = [];
let redoStack = [];
let isCoverShot = false;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function snapshotState() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, titleSize: state.titleSize, titlePos: state.titlePos,
    sizeKey: state.sizeKey, grain: state.grain, grainAmount: state.grainAmount,
    vignette: state.vignette, panels: state.panels,
  });
}

function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  render();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  applySnapshot(undoStack.pop());
  updateUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  applySnapshot(redoStack.pop());
  updateUndoButtons();
}

function updateUndoButtons() {
  const u = $('undoBtn');
  const r = $('redoBtn');
  if (u) u.disabled = undoStack.length === 0;
  if (r) r.disabled = redoStack.length === 0;
}

function previewSize() {
  const s = SIZES[state.sizeKey] || SIZES['1080x1080'];
  return s.preview;
}

function render() {
  if (isCoverShot) {
    drawCover(preview, state, photos.map((p) => p.img));
    return;
  }
  const [pw, ph] = previewSize();
  if (preview.width !== pw || preview.height !== ph) {
    preview.width = pw;
    preview.height = ph;
  }
  drawCover(preview, state, photos.map((p) => p.img));
  const sel = $('selectedPanel');
  if (sel) sel.textContent = `Panel ${state.selected + 1} dari ${LAYOUTS[state.layout].panels}`;
  const zoom = $('zoomRange');
  if (zoom) zoom.value = String(state.panels[state.selected].zoom || 1);
  const zoomVal = $('zoomVal');
  if (zoomVal) zoomVal.textContent = `${Math.round((state.panels[state.selected].zoom || 1) * 100)}%`;
}

function loadSamples() {
  SAMPLES.forEach((sample, i) => {
    const img = new Image();
    img.onload = () => {
      photos[i] = { img, label: sample.label };
      buildPhotoSlots();
      render();
    };
    img.onerror = () => setStatus(`Foto contoh ${i + 1} gagal dimuat.`);
    img.src = sample.src;
  });
}

function buildPhotoSlots() {
  const box = $('photoSlots');
  if (!box) return;
  box.innerHTML = '';
  photos.forEach((photo, i) => {
    if (!photo) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = photo.label;
    btn.title = `Pakai foto ini di panel ${state.selected + 1}`;
    btn.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected].photo = i;
      setStatus(`${photo.label} dipakai di panel ${state.selected + 1}.`);
      render();
    });
    box.appendChild(btn);
  });
  const hint = document.createElement('p');
  hint.className = 'mini-hint';
  hint.textContent = 'Klik foto untuk memakainya di panel yang dipilih.';
  box.appendChild(hint);
}

function buildLayoutButtons() {
  const box = $('layoutBtns');
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.dataset.layout = key;
    btn.textContent = layout.name;
    btn.addEventListener('click', () => {
      if (state.layout === key) return;
      pushHistory();
      state.layout = key;
      if (state.selected >= layout.panels) state.selected = 0;
      setStatus(`Layout: ${layout.name}.`);
      syncControls();
      render();
    });
    box.appendChild(btn);
  });
}

function buildGradeButtons() {
  const box = $('gradeBtns');
  Object.entries(GRADES).forEach(([key, grade]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn';
    btn.dataset.grade = key;
    btn.style.background = `linear-gradient(135deg, ${grade.band[1]}, ${grade.band[2]})`;
    btn.textContent = grade.name;
    btn.addEventListener('click', () => {
      if (state.grade === key) return;
      pushHistory();
      state.grade = key;
      setStatus(`Grade warna: ${grade.name}.`);
      syncControls();
      render();
    });
    box.appendChild(btn);
  });
}

function buildSizeButtons() {
  const box = $('sizeBtns');
  Object.entries(SIZES).forEach(([key, size]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.dataset.size = key;
    btn.textContent = size.label;
    btn.addEventListener('click', () => {
      if (state.sizeKey === key) return;
      pushHistory();
      state.sizeKey = key;
      setStatus(`Ukuran ekspor: ${size.label}.`);
      syncControls();
      render();
    });
    box.appendChild(btn);
  });
}

function syncControls() {
  document.querySelectorAll('#layoutBtns .chip-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeBtns .grade-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeBtns .chip-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.sizeKey);
  });
  const title = $('titleInput');
  if (title && title.value !== state.title) title.value = state.title;
  const sub = $('subtitleInput');
  if (sub && sub.value !== state.subtitle) sub.value = state.subtitle;
  const ts = $('titleSizeRange');
  if (ts) ts.value = String(state.titleSize);
  const tp = $('titlePosSelect');
  if (tp) tp.value = state.titlePos;
  const grain = $('grainCheck');
  if (grain) grain.checked = state.grain !== false;
  const vig = $('vignetteCheck');
  if (vig) vig.checked = state.vignette !== false;
}

// ---- Uploads: FileReader keeps every photo on this machine. ----
function handleFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) {
    setStatus('Pilih file gambar (JPG/PNG).');
    return;
  }
  pushHistory();
  list.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        photos.push({ img, label: `Unggahan · ${file.name.slice(0, 18)}` });
        state.panels[state.selected].photo = photos.length - 1;
        buildPhotoSlots();
        setStatus(`Foto "${file.name}" dimuat ke panel ${state.selected + 1}.`);
        render();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// ---- Export: render the cover at full post size and download the PNG. ----
function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('Ekspor gagal, coba lagi.');
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(true);
    }, 'image/png');
  });
}

async function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  if (!size) return;
  setStatus(`Mengekspor ${size.label}…`);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state, photos.map((p) => p.img));
  const ok = await downloadCanvas(off, `neon-shore-${size.w}x${size.h}.png`);
  if (ok) setStatus(`PNG ${size.w}×${size.h} terunduh. Siap dibagikan.`);
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    await exportCover(key);
    await new Promise((r) => setTimeout(r, 250));
  }
  setStatus('Ketiga ukuran PNG terunduh.');
}

// ---- Panel picking, drag to pan, wheel to zoom. ----
function canvasPoint(ev) {
  const r = preview.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * preview.width,
    y: ((ev.clientY - r.top) / r.height) * preview.height,
  };
}

function panelAt(x, y) {
  for (let i = lastPanelRects.length - 1; i >= 0; i--) {
    const rect = lastPanelRects[i];
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return i;
  }
  return -1;
}

let dragging = null;

function bindCanvas() {
  preview.addEventListener('pointerdown', (ev) => {
    const p = canvasPoint(ev);
    const hit = panelAt(p.x, p.y);
    if (hit < 0) return;
    state.selected = hit;
    dragging = { x: p.x, y: p.y, moved: false };
    preview.setPointerCapture(ev.pointerId);
    render();
  });
  preview.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const p = canvasPoint(ev);
    const panel = state.panels[state.selected];
    const rect = lastPanelRects[state.selected];
    if (!panel || !rect) return;
    const dx = (p.x - dragging.x) / rect.w;
    const dy = (p.y - dragging.y) / rect.h;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) dragging.moved = true;
    panel.ox = Math.max(-1, Math.min(1, panel.ox + dx * 1.6));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + dy * 1.6));
    dragging.x = p.x;
    dragging.y = p.y;
    render();
  });
  const endDrag = () => {
    if (dragging && dragging.moved) pushHistory();
    dragging = null;
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
  preview.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = Math.max(1, Math.min(2.5, panel.zoom - Math.sign(ev.deltaY) * 0.08));
    render();
  }, { passive: false });
}

function bindControls() {
  const fileInput = $('fileInput');
  $('uploadBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });
  $('sampleA').addEventListener('click', () => {
    pushHistory();
    state.panels[state.selected].photo = 0;
    setStatus('Foto contoh Boulevard dipakai di panel terpilih.');
    render();
  });
  $('sampleB').addEventListener('click', () => {
    pushHistory();
    state.panels[state.selected].photo = 1;
    setStatus('Foto contoh Dermaga dipakai di panel terpilih.');
    render();
  });
  $('fillAllBtn').addEventListener('click', () => {
    pushHistory();
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    setStatus('Satu foto dipakai di semua panel.');
    render();
  });
  $('shuffleBtn').addEventListener('click', () => {
    pushHistory();
    const count = LAYOUTS[state.layout].panels;
    for (let i = 0; i < count; i++) {
      state.panels[i].photo = Math.floor(Math.random() * Math.max(1, photos.length));
      state.panels[i].zoom = 1.1 + Math.random() * 0.4;
      state.panels[i].ox = (Math.random() - 0.5) * 0.4;
      state.panels[i].oy = (Math.random() - 0.5) * 0.4;
    }
    setStatus('Panel diacak — klik ekspor kalau sudah suka.');
    render();
  });
  $('titleInput').addEventListener('input', (ev) => {
    state.title = ev.target.value;
    render();
  });
  $('titleInput').addEventListener('change', () => pushHistory());
  $('subtitleInput').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    render();
  });
  $('subtitleInput').addEventListener('change', () => pushHistory());
  $('titleSizeRange').addEventListener('input', (ev) => {
    state.titleSize = Number(ev.target.value);
    render();
  });
  $('titleSizeRange').addEventListener('change', () => pushHistory());
  $('titlePosSelect').addEventListener('change', (ev) => {
    pushHistory();
    state.titlePos = ev.target.value;
    render();
  });
  $('zoomRange').addEventListener('input', (ev) => {
    state.panels[state.selected].zoom = Number(ev.target.value);
    render();
  });
  $('zoomRange').addEventListener('change', () => pushHistory());
  $('grainCheck').addEventListener('change', (ev) => {
    pushHistory();
    state.grain = ev.target.checked;
    render();
  });
  $('vignetteCheck').addEventListener('change', (ev) => {
    pushHistory();
    state.vignette = ev.target.checked;
    render();
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      undo();
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) {
      ev.preventDefault();
      redo();
    }
  });
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => exportCover(btn.dataset.export));
  });
  $('exportAllBtn').addEventListener('click', exportAll);
}

// ---- Boot: apply a shot preset when the URL asks for one, else the editor.
function boot() {
  buildLayoutButtons();
  buildGradeButtons();
  buildSizeButtons();
  bindControls();
  bindCanvas();
  loadSamples();
  const preset = shotPreset();
  if (preset) {
    if (LAYOUTS[preset.layout]) state.layout = preset.layout;
    if (GRADES[preset.grade]) state.grade = preset.grade;
    state.title = preset.title;
    state.subtitle = preset.subtitle;
    if (SIZES[preset.size]) state.sizeKey = preset.size;
    if (preset.mode === 'cover') {
      isCoverShot = true;
      fitCoverShotCanvas(preview);
      window.addEventListener('resize', render);
    }
  }
  syncControls();
  updateUndoButtons();
  render();
  setStatus('Dua foto contoh sudah dimuat. Klik panel untuk memilih, seret untuk menggeser foto.');
}

boot();
