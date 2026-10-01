// Generates web-optimised derivatives of the source artwork kept in /legacy.
// Run with `npm run assets` after replacing or adding source files.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/assets";
const jobs = [
  { src: "legacy/la-capital.png", out: "capital", widths: [1200, 2400] },
  { src: "legacy/avance-ferrosomas1.png", out: "ferrosoma-scout", widths: [800, 1200] },
  { src: "legacy/boceto.png", out: "ferrosoma-scout-sketch", widths: [800, 1200] },
  { src: "legacy/chris-despertando.png", out: "chris-holloway", widths: [800, 1200] },
];

await mkdir(OUT, { recursive: true });
for (const job of jobs) {
  for (const w of job.widths) {
    const file = `${OUT}/${job.out}-${w}.webp`;
    await sharp(job.src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(file);
    console.log("wrote", file);
  }
}
