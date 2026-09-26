// Generate lightweight copies of the originals for fast page turns:
// - assets/cache/page/*.jpg  (max 1280px, for full-bleed pages)
// - assets/cache/cover/*.jpg (max 400px, for the cover collage)
// Originals are never modified. Skips files already up to date.
// Run: node make-thumbs.mjs (needs: npm install sharp)
import { readdir, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = dirname(fileURLToPath(import.meta.url));
const photosDir = join(root, "assets", "photos");
const pageDir = join(root, "assets", "cache", "page");
const coverDir = join(root, "assets", "cache", "cover");

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp"]);
const stem = (n) => n.replace(/\.[^.]+$/, "");

await mkdir(pageDir, { recursive: true });
await mkdir(coverDir, { recursive: true });

const entries = await readdir(photosDir, { withFileTypes: true });
const names = entries
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((n) => !n.startsWith(".") && n !== "list.json")
  .filter((n) => IMG.has(n.slice(n.lastIndexOf(".")).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

let done = 0, skipped = 0;
for (const n of names) {
  const src = join(photosDir, n);
  const pageOut = join(pageDir, stem(n) + ".jpg");
  const coverOut = join(coverDir, stem(n) + ".jpg");
  const srcStat = await stat(src);
  let fresh = false;
  try {
    const p = await stat(pageOut);
    const c = await stat(coverOut);
    fresh = p.mtimeMs >= srcStat.mtimeMs && c.mtimeMs >= srcStat.mtimeMs;
  } catch { fresh = false; }
  if (fresh) { skipped++; continue; }
  const base = sharp(src).rotate();
  await base.clone().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(pageOut);
  await base.clone().resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(coverOut);
  done++;
  console.log(`resized ${done}/${names.length}: ${n}`);
}
console.log(`Done. ${done} resized, ${skipped} already up to date.`);
