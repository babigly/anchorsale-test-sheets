// Writes blank test gang sheets (made-up gray boxes, no real art) into ./sheets
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
};
function png(w, h, dpi) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const row = Buffer.alloc(1 + w * 4);
  const box = Buffer.alloc(1 + w * 4);
  for (let x = Math.floor(w * 0.1); x < Math.floor(w * 0.4); x++) box.set([90, 90, 90, 255], 1 + x * 4);
  const rows = [];
  for (let y = 0; y < h; y++) rows.push((y % 1200) < 600 ? box : row);
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (dpi) { const p = Buffer.alloc(9); const ppm = Math.round(dpi / 0.0254); p.writeUInt32BE(ppm, 0); p.writeUInt32BE(ppm, 4); p[8] = 1; parts.push(chunk('pHYs', p)); }
  parts.push(chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}
mkdirSync('sheets', { recursive: true });
const make = (name, w, h, dpi) => { const b = png(w, h, dpi); writeFileSync('sheets/' + name, b); console.log(name, w + 'x' + h, dpi || 'no-dpi', b.length + ' bytes'); };
make('ok-22x12in-300dpi.png', 6600, 3600, 300);
make('ok-22x36in-300dpi.png', 6600, 10800, 300);
make('ok-22x100in-300dpi.png', 6600, 30000, 300);
make('ok-22x12in-150dpi.png', 3300, 1800, 150);
make('edge-22x12in-72dpi.png', 1584, 864, 72);
make('bad-21x12in-300dpi.png', 6300, 3600, 300);
make('bad-23x12in-300dpi.png', 6900, 3600, 300);
make('bad-22x12in-no-dpi.png', 6600, 3600, 0);
writeFileSync('sheets/bad-not-a-png.png', 'this is plain text, not a PNG\n');
console.log('bad-not-a-png.png text');
