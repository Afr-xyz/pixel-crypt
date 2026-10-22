// Membuat dist/pixel-crypt.html: satu file berisi CSS + JS (bisa dibuka offline dari penyimpanan HP).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => '<style>\n' + fs.readFileSync(path.join(root, href), 'utf8') + '\n</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>\n' + fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '').replace(/\s*<link rel="(icon|apple-touch-icon)"[^>]*>/g, '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/pixel-crypt.html'), html);
console.log('dist/pixel-crypt.html dibuat (' + Math.round(html.length / 1024) + ' KB)');
