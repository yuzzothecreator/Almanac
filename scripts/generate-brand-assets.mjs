import { mkdirSync } from "fs";
import path from "path";
import sharp from "sharp";

const root = process.cwd();
const logo = path.join(root, "public", "logo.png");
const iconsDir = path.join(root, "public", "icons");

mkdirSync(iconsDir, { recursive: true });

async function squarePng(size, out, background = "#6d4adb") {
  const resized = await sharp(logo)
    .resize(Math.round(size * 0.78), Math.round(size * 0.78), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
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
  await squarePng(32, path.join(iconsDir, "icon-32.png"));
  await squarePng(192, path.join(iconsDir, "icon-192.png"));
  await squarePng(512, path.join(iconsDir, "icon-512.png"));
  await squarePng(180, path.join(iconsDir, "apple-touch-icon.png"));

  await squarePng(32, path.join(root, "app", "icon.png"));
  await squarePng(180, path.join(root, "app", "apple-icon.png"));

  // Browser favicon (PNG bytes with .ico name is widely accepted; also keep PNG icons)
  await sharp(path.join(iconsDir, "icon-32.png"))
    .resize(32, 32)
    .png()
    .toFile(path.join(root, "public", "favicon.png"));

  const ogLogo = await sharp(logo)
    .resize(220, 220, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1220"/>
          <stop offset="55%" stop-color="#1a1440"/>
          <stop offset="100%" stop-color="#6d4adb"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <circle cx="1040" cy="90" r="180" fill="#ffffff" fill-opacity="0.06"/>
      <circle cx="120" cy="540" r="220" fill="#ffffff" fill-opacity="0.05"/>
      <text x="120" y="300" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#ffffff">ALMANAC</text>
      <text x="120" y="370" font-family="Arial, sans-serif" font-size="34" fill="#d7d2f5">University Events Almanac</text>
      <text x="120" y="430" font-family="Arial, sans-serif" font-size="24" fill="#b7b0d9">Browse · Register · Stay notified</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .composite([{ input: ogLogo, left: 900, top: 200 }])
    .png()
    .toFile(path.join(root, "public", "og.png"));

  console.log("Generated favicons, apple icon, and og.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
