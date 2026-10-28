/**
 * Generates the Qaraq brand PNGs in assets/images (app icon, Android adaptive icon layers,
 * favicon and the transparent splash image) without any image library:
 * a white "Q" (ring + tail) drawn with signed distances, 4x4 supersampled, on black.
 *
 *   bun run scripts/generate-brand-assets.ts
 */

// Minimal typing of the Bun runtime so this file typechecks without adding
// @types/bun / @types/node to the React Native project (same approach as validate-graphql.ts).
interface BunRuntime {
  write(path: string, data: Uint8Array): Promise<number>;
  /** Raw DEFLATE (no zlib header). */
  deflateSync(data: Uint8Array, opts?: { level?: number }): Uint8Array;
}
const Bun = (globalThis as unknown as { Bun: BunRuntime }).Bun;
const scriptDir = (import.meta as unknown as { dir: string }).dir;
const OUT = `${scriptDir}/../assets/images`;

type RGBA = [number, number, number, number];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0);
  return b;
}

function ascii(s: string): Uint8Array {
  return Uint8Array.from(s, (ch) => ch.charCodeAt(0));
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const x of buf) {
    a = (a + x) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** zlib stream (header + raw deflate + adler32), as PNG IDAT requires. */
function zlib(data: Uint8Array): Uint8Array {
  return concat([new Uint8Array([0x78, 0xda]), Bun.deflateSync(data, { level: 9 }), u32(adler32(data))]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = concat([ascii(type), data]);
  return concat([u32(data.length), body, u32(crc32(body))]);
}

/** `alpha: false` writes an opaque RGB PNG (App Store icons must not have an alpha channel). */
function encodePng(size: number, alpha: boolean, pixel: (x: number, y: number) => RGBA): Uint8Array {
  const bpp = alpha ? 4 : 3;
  const raw = new Uint8Array((size * bpp + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * bpp + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = row + 1 + x * bpp;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      if (alpha) raw[o + 3] = a;
    }
  }
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(size), 0);
  ihdr.set(u32(size), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = alpha ? 6 : 2; // RGBA : RGB
  return concat([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib(raw)),
    chunk('IEND', new Uint8Array()),
  ]);
}

/** Distance from p to the segment a-b. */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Coverage of the "Q" mark at (u, v) in unit space (0..1, centered at 0.5).
 * `scale` is the glyph's outer diameter as a fraction of the canvas.
 */
function qInside(u: number, v: number, scale: number): boolean {
  const r = scale / 2;
  const stroke = r * 0.3;
  const cx = 0.5;
  const cy = 0.5 - r * 0.04;
  const d = Math.hypot(u - cx, v - cy);
  const ring = d <= r && d >= r - stroke;
  // Tail: a rounded bar crossing the ring at the lower right.
  const a = { x: cx + r * 0.28, y: cy + r * 0.28 };
  const b = { x: cx + r * 0.98, y: cy + r * 0.98 };
  const tail = segDist(u, v, a.x, a.y, b.x, b.y) <= stroke * 0.5;
  return ring || tail;
}

function render(
  size: number,
  opts: { background: RGBA | null; foreground: RGBA; scale: number | null },
): Uint8Array {
  const SS = 4;
  return encodePng(size, !opts.background, (x, y) => {
    let hits = 0;
    if (opts.scale != null) {
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (qInside((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, opts.scale)) hits++;
        }
      }
    }
    const cov = hits / (SS * SS);
    const bg = opts.background ?? [0, 0, 0, 0];
    const fg = opts.foreground;
    if (!opts.background) return [fg[0], fg[1], fg[2], Math.round(fg[3] * cov)];
    const mix = (i: number) => Math.round(bg[i] * (1 - cov) + fg[i] * cov);
    return [mix(0), mix(1), mix(2), 255];
  });
}

const BLACK: RGBA = [0, 0, 0, 255];
const WHITE: RGBA = [255, 255, 255, 255];

const files: Record<string, Uint8Array> = {
  // iOS / generic app icon: full-bleed black square (iOS applies its own mask).
  'icon.png': render(1024, { background: BLACK, foreground: WHITE, scale: 0.56 }),
  // Android adaptive icon: the mark stays inside the 66% safe zone of the foreground layer.
  'android-icon-foreground.png': render(512, { background: null, foreground: WHITE, scale: 0.4 }),
  'android-icon-background.png': render(512, { background: BLACK, foreground: BLACK, scale: null }),
  'android-icon-monochrome.png': render(432, { background: null, foreground: WHITE, scale: 0.4 }),
  'favicon.png': render(48, { background: BLACK, foreground: WHITE, scale: 0.62 }),
  // Launch screen shows no art (AniClient opens on plain black), so the splash image is empty.
  'splash-icon.png': render(64, { background: null, foreground: WHITE, scale: null }),
};

for (const [name, data] of Object.entries(files)) {
  await Bun.write(`${OUT}/${name}`, data);
  console.log(`wrote ${name} (${data.length} bytes)`);
}
