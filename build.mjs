import { readdir, writeFile, readFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const photosDir = join(root, "assets", "photos");
const outFile = join(photosDir, "list.json");

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp"]);

function titleFromName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || name;
}

let title = null;
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--title=(.*)$/);
  if (m) title = m[1];
}
if (title === null) {
  // Preserve the existing title so start.bat never resets it.
  try {
    const prev = JSON.parse(await readFile(outFile, "utf8"));
    if (prev.title) title = prev.title;
  } catch {}
  if (title === null) title = "Sylhet through DazzCam";
}

let entries = [];
try {
  entries = await readdir(photosDir, { withFileTypes: true });
} catch (e) {
  console.error("Photos folder not found: " + photosDir);
  process.exit(1);
}

const names = entries
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((n) => !n.startsWith(".") && n !== "list.json")
  .filter((n) => IMG.has(n.slice(n.lastIndexOf(".")).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

// Prefer lightweight cache copies (made by make-thumbs.mjs) when present;
// fall back to the original file otherwise.
const cached = async (sub, stemName) => {
  try {
    await stat(join(root, "assets", "cache", sub, stemName + ".jpg"));
    return true;
  } catch { return false; }
};

const photos = [];
for (const n of names) {
  const stemName = n.replace(/\.[^.]+$/, "");
  const useCache = await cached("page", stemName);
  const orig = "assets/photos/" + encodeURIComponent(n);
  photos.push({
    src: useCache ? "assets/cache/page/" + encodeURIComponent(stemName + ".jpg") : orig,
    thumb: useCache ? "assets/cache/cover/" + encodeURIComponent(stemName + ".jpg") : orig,
    alt: titleFromName(n),
    file: n
  });
}

await writeFile(outFile, JSON.stringify({ title, photos }, null, 2) + "\n", "utf8");
console.log(`Found ${photos.length} photo(s). Wrote ${outFile}`);
if (photos.length === 0) console.log("Tip: copy JPG/PNG files into assets/photos, then re-run. Or open index.html and use 'Add your photos'.");
