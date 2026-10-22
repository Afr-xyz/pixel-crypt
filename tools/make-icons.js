// Membuat ikon PNG (pixel art pedang + tengkorak) tanpa dependensi.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const MAP = [
'................','......hhhh......','.....hHHHHh.....','.....hHWWHh.....','.....hHWWHh.....','.....hHWWHh.....','.....hHWWHh.....','.....hHWWHh.....',
'.....hHWWHh.....','.....hHWWHh.....','..ggggGGGGgggg..','..gggg.GG.gggg..','......bBBb......','......bBBb......','.....yYYYYy.....','.....yyyyyy.....'];
const PAL = { h: [90,100,130], H: [200,208,224], W: [240,246,255], g: [184,134,42], G: [243,197,60], b: [90,58,31], B: [138,90,43], y: [184,134,42], Y: [243,197,60] };
const BG = [16, 14, 32];
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size, pad) {
  const inner = size - pad * 2, cell = inner / 16;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let col = BG;
      const gx = Math.floor((x - pad) / cell), gy = Math.floor((y - pad) / cell);
      if (gx >= 0 && gx < 16 && gy >= 0 && gy < 16) { const ch = MAP[gy][gx]; if (PAL[ch]) col = PAL[ch]; }
      const o = y * (size * 3 + 1) + 1 + x * 3; raw[o] = col[0]; raw[o + 1] = col[1]; raw[o + 2] = col[2];
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const dir = path.join(__dirname, '..', 'icons'); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'icon-192.png'), png(192, 12));
fs.writeFileSync(path.join(dir, 'icon-512.png'), png(512, 32));
fs.writeFileSync(path.join(dir, 'icon-maskable-512.png'), png(512, 96));
console.log('Ikon dibuat di icons/');
