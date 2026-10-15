import { build } from 'esbuild';
import { readFile, mkdir } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/homeassistant-vacuum-card.js'], outfile: 'dist/homeassistant-vacuum-card.js', bundle: true, format: 'esm', target: 'es2022', minify: true, legalComments: 'eof', define: { __VERSION__: JSON.stringify(version) } });
