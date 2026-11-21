// Key Largo editor: three steps from a photo to an exported PNG.
// Step 1 Add photos, step 2 Caption, step 3 Export PNG. The live preview is the
// same renderCover the export uses, so what you see is what the PNG holds.

import { renderCover, defaultState, GRADES, SIZES } from './cover.js';

const SAMPLES = [
  { src: 'samples/hero.jpg', label: 'Speedboat hero' },
  { src: 'samples/driver.jpg', label: 'Driver, red car' },
  { src: 'samples/fixer.jpg', label: 'Fixer at the marina' },
  { src: 'samples/lookout.jpg', label: 'Lookout, night city' },
  { src: 'samples/runner.jpg', label: 'Runner on the beach' },
  { src: 'samples/queen.jpg', label: 'Queen on the pier' },
  { src: 'samples/boulevard.jpg', label: 'Boulevard sunset' },
];

const state = defaultState();
const images = {};
let selected = 0;
let undoStack = [];
let redoStack = [];
let step = 1;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function ensureImages() {
  const needed = new Set(state.panels.map((p) => p.src));
  needed.add('samples/boulevard.jpg');
  for (const src of needed) {
    if (!images[src]) {
      try {
        images[src] = await loadImage(src);
      } catch (e) {
        console.warn(e.message);
      }
    }
  }
}

async function render() {
  await ensureImages();
  renderCover(preview, state, images, selected);
}

function snapshot() {
  return JSON.stringify(state);
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function restore(json) {
  const next = JSON.parse(json);
  state.title = next.title;
  state.script = next.script;
  state.tagline = next.tagline;
  state.quote = next.quote;
  state.outlet = next.outlet;
  state.billing = next.billing;
  state.seal = next.seal;
  state.edition = next.edition;
  state.grade = next.grade;
  state.size = next.size;
  state.panels = next.panels;
  syncFields();
  render();
}

function updateUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// --- field wiring: every text field edits the live cover at once. ---
const FIELD_IDS = ['title', 'script', 'tagline', 'quote', 'outlet', 'billing', 'seal', 'edition'];
function syncFields() {
  for (const id of FIELD_IDS) $(`field-${id}`).value = state[id];
  document.querySelectorAll('#grade-chips button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#size-tabs button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  renderPanelList();
}

function bindFields() {
  for (const id of FIELD_IDS) {
    $(`field-${id}`).addEventListener('input', (e) => {
      state[id] = e.target.value;
      render();
    });
    $(`field-${id}`).addEventListener('change', pushHistory);
  }
  document.querySelectorAll('#grade-chips button').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = b.dataset.grade;
      syncFields();
      render();
    });
  });
  document.querySelectorAll('#size-tabs button').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.size = b.dataset.size;
      syncFields();
      render();
    });
  });
}

// --- panel list + per-panel controls (zoom, flip, swap, reset). ---
function renderPanelList() {
  const list = $('panel-list');
  list.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `panel-chip${i === selected ? ' selected' : ''}`;
    btn.textContent = `${i + 1} · ${panel.role}`;
    btn.addEventListener('click', () => {
      selected = i;
      syncPanelControls();
      render();
    });
    list.appendChild(btn);
  });
}

function syncPanelControls() {
  const panel = state.panels[selected];
  $('panel-name').textContent = `Panel ${selected + 1} — ${panel.role}`;
  $('panel-sub').value = panel.sub;
  $('panel-zoom').value = String(panel.zoom);
  $('panel-flip').textContent = panel.flip ? 'Unflip' : 'Flip';
  renderPanelList();
}

function bindPanelControls() {
  $('panel-sub').addEventListener('input', (e) => {
    state.panels[selected].sub = e.target.value;
    render();
  });
  $('panel-sub').addEventListener('change', pushHistory);
  $('panel-zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    render();
  });
  $('panel-zoom').addEventListener('change', pushHistory);
  $('panel-flip').addEventListener('click', () => {
    pushHistory();
    state.panels[selected].flip = !state.panels[selected].flip;
    syncPanelControls();
    render();
  });
  $('panel-swap').addEventListener('click', () => {
    pushHistory();
    const next = (selected + 1) % state.panels.length;
    const tmp = state.panels[selected];
    state.panels[selected] = state.panels[next];
    state.panels[next] = tmp;
    selected = next;
    syncPanelControls();
    render();
  });
  $('panel-reset').addEventListener('click', () => {
    pushHistory();
    const p = state.panels[selected];
    p.zoom = 1;
    p.ox = 0;
    p.oy = 0;
    p.flip = false;
    syncPanelControls();
    render();
  });
  // Drag on the preview pans the selected panel's photo.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const p = state.panels[selected];
    p.ox += ((e.clientX - lastX) / rect.width) * 2;
    p.oy += ((e.clientY - lastY) / rect.height) * 2;
    p.ox = Math.max(-1, Math.min(1, p.ox));
    p.oy = Math.max(-1, Math.min(1, p.oy));
    lastX = e.clientX;
    lastY = e.clientY;
    render();
  });
  preview.addEventListener('pointerup', () => {
    if (dragging) pushHistory();
    dragging = false;
  });
}

// --- photos: user uploads and the seven fresh sample photos. ---
function bindPhotos() {
  $('photo-input').addEventListener('change', (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    pushHistory();
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          images[reader.result] = img;
          const panel = state.panels[selected];
          panel.src = reader.result;
          panel.zoom = 1;
          panel.ox = 0;
          panel.oy = 0;
          panel.flip = false;
          selected = (selected + 1) % state.panels.length;
          syncPanelControls();
          render();
          setStatus(`Loaded ${file.name} into a panel. Photos never leave your device.`);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });
  const tray = $('sample-tray');
  SAMPLES.forEach((sample) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sample-thumb';
    const img = document.createElement('img');
    img.src = sample.src;
    img.alt = sample.label;
    img.loading = 'lazy';
    btn.appendChild(img);
    const cap = document.createElement('span');
    cap.textContent = sample.label;
    btn.appendChild(cap);
    btn.addEventListener('click', () => {
      pushHistory();
      const panel = state.panels[selected];
      panel.src = sample.src;
      panel.zoom = 1;
      panel.ox = 0;
      panel.oy = 0;
      panel.flip = false;
      selected = (selected + 1) % state.panels.length;
      syncPanelControls();
      render();
      setStatus(`Sample photo “${sample.label}” placed in panel ${selected + 1}.`);
    });
    tray.appendChild(btn);
  });
}

// --- steps, undo/redo, export. ---
function setStep(n) {
  step = n;
  document.querySelectorAll('.step').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.step) === n);
  });
  document.querySelectorAll('.step-panel').forEach((el) => {
    el.hidden = Number(el.dataset.step) !== n;
  });
}

function bindSteps() {
  document.querySelectorAll('.step').forEach((el) => {
    el.addEventListener('click', () => setStep(Number(el.dataset.step)));
  });
  $('to-step-2').addEventListener('click', () => setStep(2));
  $('to-step-3').addEventListener('click', () => setStep(3));
  $('back-to-1').addEventListener('click', () => setStep(1));
  $('back-to-2').addEventListener('click', () => setStep(2));
}

function bindUndoRedo() {
  $('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    updateUndoButtons();
  });
  $('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    updateUndoButtons();
  });
}

function exportPng(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  const keep = state.size;
  state.size = sizeKey;
  renderCover(off, state, images, -1);
  state.size = keep;
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `key-largo-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

function bindExport() {
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', async () => {
      setStatus(`Exporting ${SIZES[b.dataset.export].label}…`);
      await exportPng(b.dataset.export);
      setStatus(`Exported key-largo-${SIZES[b.dataset.export].w}x${SIZES[b.dataset.export].h}.png — share it anywhere.`);
    });
  });
  $('export-all').addEventListener('click', async () => {
    setStatus('Exporting all three sizes…');
    for (const key of Object.keys(SIZES)) {
      // eslint-disable-next-line no-await-in-loop
      await exportPng(key);
    }
    setStatus('Exported 1080 x 1080, 1080 x 1350 and 1920 x 1080. Done.');
  });
}

// --- boot: wait for the poster fonts, then draw the cover. ---
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('52px Pacifico'),
      document.fonts.load('700 30px Oswald'),
      document.fonts.load('500 21px Oswald'),
    ]);
  } catch (e) {
    console.warn('font preload failed, using fallbacks', e);
  }
  bindFields();
  bindPanelControls();
  bindPhotos();
  bindSteps();
  bindUndoRedo();
  bindExport();
  syncFields();
  syncPanelControls();
  setStep(1);
  updateUndoButtons();
  await render();
  setStatus('Cover ready. Add your own photos, caption the crew, export the PNG.');
}

boot();
