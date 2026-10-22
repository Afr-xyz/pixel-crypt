#!/usr/bin/env node
// Server statis tanpa dependensi untuk Pixel Crypt.
// Pakai: node server.js [port]   (default 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = parseInt(process.argv[2] || process.env.PORT || '8080', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};
const BLOCK = /^\/(node_modules|tools|test|src|server\.js|package(-lock)?\.json|tailwind\.config\.js|README\.md)(\/|$)/;

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT + path.sep) || (BLOCK.test(urlPath) && !urlPath.startsWith('/dist/'))) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 Not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  PIXEL CRYPT - server berjalan\n');
  console.log('  Di komputer ini : http://localhost:' + PORT);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) for (const n of nets[name]) {
    if (n.family === 'IPv4' && !n.internal) console.log('  Di Android (Wi-Fi sama): http://' + n.address + ':' + PORT + '   [' + name + ']');
  }
  console.log('\n  Tekan Ctrl+C untuk berhenti.\n');
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error('Port ' + PORT + ' dipakai. Coba: node server.js ' + (PORT + 1));
  else console.error(e);
  process.exit(1);
});
