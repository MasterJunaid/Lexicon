/**
 * Generates the PWA icon set as PNGs with no image dependencies:
 * a cream tile, an ink serif "L", and a crimson rule under it.
 *
 *   npm run icons
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const CREAM = [0xf5, 0xf1, 0xe8];
const INK = [0x17, 0x15, 0x12];
const CRIMSON = [0x9c, 0x3b, 0x2e];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels[y * size + x];
      const at = rowStart + 1 + x * 3;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Draws the mark. `inset` shrinks the artwork for maskable safe zones. */
function drawIcon(size, { inset = 0, background = CREAM } = {}) {
  const pixels = new Array(size * size).fill(background);
  const scale = 1 - inset * 2;
  const rect = (x0, y0, x1, y1, color) => {
    const px = (v) => Math.round((inset + v * scale) * size);
    const [left, top, right, bottom] = [px(x0), px(y0), px(x1), px(y1)];
    for (let y = top; y < bottom; y++) {
      if (y < 0 || y >= size) continue;
      for (let x = left; x < right; x++) {
        if (x < 0 || x >= size) continue;
        pixels[y * size + x] = color;
      }
    }
  };

  // Serif "L": top serif, stem, foot, and a terminal serif on the foot.
  rect(0.295, 0.2, 0.475, 0.232, INK);
  rect(0.345, 0.2, 0.425, 0.725, INK);
  rect(0.345, 0.645, 0.705, 0.725, INK);
  rect(0.665, 0.6, 0.705, 0.725, INK);
  // The rule.
  rect(0.295, 0.8, 0.705, 0.828, CRIMSON);

  return pixels;
}

mkdirSync(OUT, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, options: {} },
  { file: 'icon-512.png', size: 512, options: {} },
  { file: 'icon-512-maskable.png', size: 512, options: { inset: 0.12 } },
  { file: 'apple-touch-icon.png', size: 180, options: {} },
  { file: 'icon-32.png', size: 32, options: {} },
];

for (const { file, size, options } of targets) {
  writeFileSync(join(OUT, file), encodePng(size, drawIcon(size, options)));
  console.log(`wrote public/icons/${file} (${size}×${size})`);
}
