import { mkdirSync, existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const root = process.cwd();
const logo = path.join(root, "public", "logo.png");
const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

async function squarePng(size, out, background = "#ffffff") {
  const resized = await sharp(logo)
    .resize(Math.round(size * 0.82), Math.round(size * 0.82), {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toFile(out);
}

async function main() {
  if (!existsSync(logo)) {
    throw new Error("public/logo.png missing");
  }

  await squarePng(32, path.join(iconsDir, "icon-32.png"));
  await squarePng(192, path.join(iconsDir, "icon-192.png"));
  await squarePng(512, path.join(iconsDir, "icon-512.png"));
  await squarePng(180, path.join(iconsDir, "apple-touch-icon.png"));
  await squarePng(32, path.join(root, "app", "icon.png"));
  await squarePng(180, path.join(root, "app", "apple-icon.png"));
  await squarePng(32, path.join(root, "public", "favicon.png"));

  const mark = await sharp(logo)
    .resize(220, 220, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const svg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1220"/>
          <stop offset="55%" stop-color="#1a1440"/>
          <stop offset="100%" stop-color="#6d4adb"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="120" y="300" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#ffffff">ALMANAC</text>
      <text x="120" y="370" font-family="Arial, sans-serif" font-size="34" fill="#d7d2f5">University Events Almanac</text>
      <text x="120" y="430" font-family="Arial, sans-serif" font-size="24" fill="#b7b0d9">Browse · Register · Stay notified</text>
    </svg>
  `);

  await sharp(svg)
    .composite([{ input: mark, left: 900, top: 200 }])
    .png()
    .toFile(path.join(root, "public", "og.png"));

  console.log("Regenerated brand assets from original logo.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
