import { mkdirSync, copyFileSync } from "fs";
import path from "path";
import sharp from "sharp";

const root = process.cwd();
const src = path.join(root, "public", "crest.png");
const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

async function make(size, out, pad = 0.12) {
  const inner = Math.round(size * (1 - pad * 2));
  const resized = await sharp(src)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function main() {
  await make(32, path.join(iconsDir, "icon-32.png"), 0.06);
  await make(192, path.join(iconsDir, "icon-192.png"));
  await make(512, path.join(iconsDir, "icon-512.png"));
  await make(180, path.join(iconsDir, "apple-touch-icon.png"));
  await make(32, path.join(root, "app", "icon.png"), 0.06);
  await make(180, path.join(root, "app", "apple-icon.png"));
  await make(32, path.join(root, "public", "favicon.png"), 0.06);

  await sharp(src)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(path.join(root, "public", "logo-crest.png"));

  const crest = await sharp(src)
    .resize(280, 280, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const svg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#0b0d12"/>
      <text x="420" y="300" font-family="Georgia, serif" font-size="86" font-weight="700" fill="#ffffff">ALMANAC</text>
      <text x="420" y="360" font-family="Arial, sans-serif" font-size="28" fill="#b8c0d0">University Events Almanac</text>
    </svg>
  `);

  await sharp(svg)
    .composite([{ input: crest, left: 90, top: 175 }])
    .png()
    .toFile(path.join(root, "public", "og.png"));

  console.log("ALMANAC crest favicons + OG updated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
