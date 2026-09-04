import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SRC = 'C:/Users/Ilse.Slater/.cursor/projects/c-Lekki/assets';
const OUT = 'c:/Lekki/apps/web/public/brand/hills';
fs.mkdirSync(OUT, { recursive: true });

const files = [
  { in: 'hill-back.png', out: 'back.png' },
  { in: 'hill-mid.png', out: 'mid.png' },
  { in: 'hill-front.png', out: 'front.png' },
];

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(type, row, prev, out, bpp) {
  for (let i = 0; i < row.length; i++) {
    const a = i >= bpp ? out[i - bpp] : 0;
    const b = prev[i];
    const c = i >= bpp ? prev[i - bpp] : 0;
    let v = row[i];
    if (type === 1) v += a;
    else if (type === 2) v += b;
    else if (type === 3) v += Math.floor((a + b) / 2);
    else if (type === 4) v += paeth(a, b, c);
    out[i] = v & 255;
  }
}

function decodePng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('not a PNG');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 2;
  const idats = [];
  while (offset + 12 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null;
  if (!channels) throw new Error(`unsupported color type ${colorType}`);
  const inflated = zlib.inflateSync(Buffer.concat(idats));
  const bpp = channels;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);
  let src = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    const row = inflated.subarray(src, src + stride);
    src += stride;
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    unfilter(filter, row, prev, out, bpp);
    prev = Buffer.from(out);
  }
  return { width, height, colorType, channels, pixels };
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(crcInput) >>> 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePngRGBA(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chromaKey({ width, height, channels, pixels }) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    let r = pixels[p];
    let g = channels === 1 ? pixels[p] : pixels[p + 1];
    let b = channels === 1 ? pixels[p] : pixels[p + 2];
    const a = channels === 4 ? pixels[p + 3] : 255;
    const o = i * 4;

    const magenta = Math.min(r, b) - g;
    const isFlatKey = r > 200 && b > 200 && g < 90;
    const isHotPink = r > 190 && b > 150 && g < 110 && Math.abs(r - b) < 90;
    let alpha = a;
    if (isFlatKey || isHotPink || magenta > 90) {
      alpha = 0;
    } else if (magenta > 28 && g < 180) {
      alpha = Math.round(a * (1 - Math.min(1, (magenta - 28) / 70)));
    }

    if (alpha === 0) {
      r = 0;
      g = 0;
      b = 0;
    } else if (alpha < 255) {
      const spill = Math.max(0, Math.min(r, b) - g);
      r = Math.max(0, r - spill);
      b = Math.max(0, b - spill);
    }

    rgba[o] = r;
    rgba[o + 1] = g;
    rgba[o + 2] = b;
    rgba[o + 3] = alpha;
  }
  return rgba;
}

function cropTransparentTop(width, height, rgba) {
  const stride = width * 4;
  let top = 0;
  for (let y = 0; y < height; y++) {
    let solid = false;
    for (let x = 0; x < width; x++) {
      if (rgba[y * stride + x * 4 + 3] > 10) {
        solid = true;
        break;
      }
    }
    if (solid) {
      top = Math.max(0, y - 6);
      break;
    }
  }
  const newH = height - top;
  if (top === 0) return { width, height, rgba };
  const out = Buffer.alloc(width * newH * 4);
  rgba.copy(out, 0, top * stride);
  return { width, height: newH, rgba: out };
}

for (const f of files) {
  const src = path.join(SRC, f.in);
  const decoded = decodePng(fs.readFileSync(src));
  const keyed = chromaKey(decoded);
  const cropped = cropTransparentTop(decoded.width, decoded.height, keyed);
  const png = encodePngRGBA(cropped.width, cropped.height, cropped.rgba);
  const dest = path.join(OUT, f.out);
  fs.writeFileSync(dest, png);
  console.log(
    `wrote ${f.out} ${cropped.width}x${cropped.height} colorType=${decoded.colorType} ${png.length} bytes`,
  );
}
