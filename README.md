# gta6-cover-art-01
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/itserwe/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/itserwe/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Shore — aplikasi web offline yang mengubah foto dan caption menjadi cover art gaya poster multi-panel, gradasi sunset/neon Vice City, huruf judul tebal, ekspor PNG 1080x1080, 1080x1350, dan 1920x1080. Dibangun untuk bounty make.fun gta6-cover-art-01.

## Fitur

- 5 layout multi-panel, 5 grade warna, grain film dan vignette.
- Crop dan posisi per panel (drag + zoom + slider), satu foto atau beberapa
  foto, satu foto di semua panel, dan acak panel.
- Caption bisa diedit: teks, ukuran, dan posisi judul; subjudul neon dengan
  efek glow; matahari synthwave dan bingkai poster digambar oleh aplikasi.
- Undo/redo (Ctrl+Z / Ctrl+Y).
- Sepenuhnya offline: tanpa request jaringan, tanpa font atau library dari
  luar. Huruf memakai font sistem tebal (Arial Black / Impact).
- Semua karya visual asli — tanpa logo, artwork, atau font dari game mana pun.

## Struktur

- `app/index.html` — halaman editor.
- `app/style.css` — tema editor.
- `app/src/cover.js` — mesin gambar cover (layout, grade, caption, grain).
- `app/src/main.js` — logika editor (unggah, panel, ekspor, undo/redo).
- `app/src/shots.js` — preset adegan `?shot=` untuk screenshot.
- `app/samples/` — dua foto contoh bebas pakai.
- `main.ts` — menyerahkan app dan screenshot ke `/output` + `dossier.json`.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---
<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
