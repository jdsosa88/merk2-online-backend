const sharp = require('sharp');
const { encode } = require('blurhash');
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/test-image-optimize.js <imagePath>');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'uploads', '_test-opt');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'test.webp');

(async () => {
  const original = fs.statSync(src).size;
  const resized = sharp(src)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });

  const [webp, blurhash] = await Promise.all([
    resized.clone().webp({ quality: 80, effort: 4 }).toBuffer({ resolveWithObject: true }),
    (async () => {
      const { data, info } = await resized
        .clone()
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });
      return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    })(),
  ]);

  fs.writeFileSync(out, webp.data);

  console.log(
    JSON.stringify(
      {
        originalBytes: original,
        originalKB: +(original / 1024).toFixed(2),
        webpBytes: webp.info.size,
        webpKB: +(webp.info.size / 1024).toFixed(2),
        reductionPct: +(((original - webp.info.size) / original) * 100).toFixed(1),
        width: webp.info.width,
        height: webp.info.height,
        blurhash,
        out,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
