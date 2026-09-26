import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2]) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const safe = normalize(join(root, rel));
    if (!safe.startsWith(root)) {
      res.writeHead(403); res.end("forbidden"); return;
    }
    const st = await stat(safe).catch(() => null);
    const file = st && st.isDirectory() ? join(safe, "index.html") : safe;
    const data = await readFile(file).catch(() => null);
    if (!data) {
      res.writeHead(404, { "content-type": "text/plain" }); res.end("not found: " + rel); return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Flipbook running at http://127.0.0.1:${port}/`);
});
