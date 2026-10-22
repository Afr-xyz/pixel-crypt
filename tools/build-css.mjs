// Build css/tailwind.css dengan API compile() Tailwind v4 (tanpa CLI terpisah).
// Pemindai: ambil semua token mirip kelas dari index.html dan js/*.js.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);
let twDir;
for (const p of [root, '/opt/npm-tools']) {
  try { twDir = path.dirname(require.resolve('tailwindcss/package.json', { paths: [p] })); break; } catch {}
}
if (!twDir) { console.error('tailwindcss tidak ditemukan. Jalankan: npm install'); process.exit(1); }
const { compile } = await import(pathToFileURL(path.join(twDir, 'dist/lib.mjs')).href);

const input = fs.readFileSync(path.join(root, 'src/input.css'), 'utf8');
const compiler = await compile(input, {
  base: root,
  loadStylesheet: async (id, base) => {
    let file;
    if (id === 'tailwindcss') file = path.join(twDir, 'index.css');
    else if (id.startsWith('tailwindcss/')) file = path.join(twDir, id.slice('tailwindcss/'.length) + (id.endsWith('.css') ? '' : '.css'));
    else file = path.resolve(base, id);
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
  },
});

const files = ['index.html', ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)];
const cand = new Set();
for (const f of files) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) continue;
  for (const m of fs.readFileSync(fp, 'utf8').matchAll(/[^\s"'`<>=;{}]+/g)) cand.add(m[0]);
}
const out = compiler.build([...cand]);
fs.mkdirSync(path.join(root, 'css'), { recursive: true });
fs.writeFileSync(path.join(root, 'css/tailwind.css'), out);
console.log('css/tailwind.css ditulis:', out.length, 'byte dari', cand.size, 'kandidat');
