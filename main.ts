// Neon Shore entry point (Node 22, standard library only). It hands the
// offline cover-maker app in: copy app/ and screenshots/ from this repo
// into the output directory, then write dossier.json there with the
// vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const repoShots = join(repoRoot, 'screenshots');
if (existsSync(repoShots)) {
  cpSync(repoShots, shotsDir, { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes;
// the rest refuse an entry the scorer would refuse (too many screenshots
// or one over 256 KiB; app/ over 993 files or 48 MiB; a path over 1000 bytes).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const shotNames = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shotNames.length === 0) {
  console.log('Neon Shore handed in with no screenshots yet: add 3 or 4 to screenshots/ before submitting.');
}
console.log(`Neon Shore handed in: ${shotNames.length} screenshot(s), dossier.json ${dossier.length} bytes.`);
