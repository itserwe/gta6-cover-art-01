// Shot presets: the URL query drives the app into a fixed scene so its
// screenshots are real renders of the running app. ?shot=cover draws one
// exported-style cover full-frame; ?shot=editor opens the editor with a
// preset cover loaded. Params: layout, grade, title, subtitle, size.

export function shotPreset() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot') || '';
  if (!shot) return null;
  const preset = {
    mode: shot,
    layout: q.get('layout') || 'hero3',
    grade: q.get('grade') || 'sunset',
    title: q.get('title') || 'NEON SHORE',
    subtitle: q.get('subtitle') || 'Golden hour on the boulevard',
    size: q.get('size') || '1080x1080',
  };
  return preset;
}

// Size the cover canvas to the whole window for a full-frame cover shot.
export function fitCoverShotCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.maxWidth = 'none';
  canvas.style.maxHeight = 'none';
  document.body.classList.add('shot-cover');
}
