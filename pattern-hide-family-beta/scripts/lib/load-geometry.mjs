import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export async function loadGeometry() {
  const out = join(mkdtempSync(join(tmpdir(), 'phfb-geo-')), 'geo.mjs');
  await build({ entryPoints: [join(here, 'geometry-entry.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
  return import(pathToFileURL(out).href);
}
