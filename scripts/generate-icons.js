import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal standard PNG generator in pure Node without external dependencies
function createPng(width, height, renderPixel) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines: filter byte (0) + width * 4 bytes RGBA
  const rawScanlines = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Pixel rendering logic for Mechatronics Circuit Lab Brand Icon
function renderBrandIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background dark gradient (#020617 to #0f172a / #022c22)
  const normY = y / h;
  let bgR = Math.round(2 + normY * 13);
  let bgG = Math.round(6 + normY * 30);
  let bgB = Math.round(23 + normY * 10);

  // Outer circle track (emerald/cyan glow)
  const ringR = w * 0.40;
  if (Math.abs(dist - ringR) < w * 0.015) {
    return [16, 185, 129, 255]; // Emerald
  }

  // Inner chip box
  const chipHalf = w * (isMaskable ? 0.24 : 0.27);
  const inChip = Math.abs(dx) <= chipHalf && Math.abs(dy) <= chipHalf;
  const chipBorder = Math.abs(Math.max(Math.abs(dx), Math.abs(dy)) - chipHalf) < w * 0.02;

  if (chipBorder) {
    return [52, 211, 153, 255]; // Bright emerald border
  }

  if (inChip) {
    // Inside chip - dark slate
    let cR = 9, cG = 13, cB = 22;

    // Golden lightning bolt shape in center
    // Approximate lightning bolt
    const boltSlope1 = dx * 1.5 - dy;
    const isBolt = (dx > -w * 0.06 && dx < w * 0.06 && Math.abs(dy) < w * 0.14) ||
                   (Math.abs(dx * 1.4 + dy) < w * 0.04 && Math.abs(dy) < w * 0.16);

    if (isBolt) {
      return [251, 191, 36, 255]; // Amber gold zap
    }

    // Central small glow
    if (dist < w * 0.05) {
      return [254, 240, 138, 255];
    }

    return [cR, cG, cB, 255];
  }

  // Circuit trace pins radiating out
  if (Math.abs(dx) < w * 0.015 && dist < w * 0.44 && dist > chipHalf) {
    return [16, 185, 129, 255];
  }
  if (Math.abs(dy) < w * 0.015 && dist < w * 0.44 && dist > chipHalf) {
    return [2, 132, 199, 255];
  }
  if (Math.abs(dx - dy) < w * 0.02 && dist < w * 0.42 && dist > chipHalf) {
    return [251, 191, 36, 255];
  }
  if (Math.abs(dx + dy) < w * 0.02 && dist < w * 0.42 && dist > chipHalf) {
    return [56, 189, 248, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192
console.log('Generating pwa-192x192.png...');
const pwa192 = createPng(192, 192, (x, y, w, h) => renderBrandIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 2. Generate 512x512
console.log('Generating pwa-512x512.png...');
const pwa512 = createPng(512, 512, (x, y, w, h) => renderBrandIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 3. Generate maskable 512x512 (with safe zone margins)
console.log('Generating pwa-maskable-512x512.png...');
const pwaMaskable = createPng(512, 512, (x, y, w, h) => renderBrandIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// 4. Generate apple-touch-icon.png (180x180)
console.log('Generating apple-touch-icon.png...');
const appleIcon = createPng(180, 180, (x, y, w, h) => renderBrandIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// 5. Generate favicon.ico (copy / write 192 as favicon.png or fallback)
fs.writeFileSync(path.join(publicDir, 'favicon.png'), pwa192);

console.log('All PWA PNG icons generated successfully in /public!');
