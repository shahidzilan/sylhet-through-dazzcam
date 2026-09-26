// Build a single shareable HTML file. Each photo is stored ONCE as a data URI
// in a JS array; the cover collage + full-bleed pages are built from it at load.
// Run: node export-standalone.mjs [--out="share/sylhet-through-dazzcam.html"]
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const photosDir = join(root, "assets", "photos");

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".bmp": "image/bmp"
};

let out = join(root, "share", "sylhet-through-dazzcam.html");
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--out=(.*)$/);
  if (m) out = join(root, m[1]);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const list = JSON.parse(await readFile(join(photosDir, "list.json"), "utf8"));
const title = list.title || "Sylhet through DazzCam";
const files = (list.photos || []).map((p) => p.file).filter(Boolean);

if (files.length === 0) {
  console.error("No photos in assets/photos/list.json — run build.mjs first.");
  process.exit(1);
}

const vendorJs = await readFile(join(root, "vendor", "page-flip.browser.js"), "utf8");
const readerCss = await readFile(join(root, "styles.css"), "utf8");
const bookCss = await readFile(join(root, "style", "book-style.css"), "utf8");

const photosJs = [];
for (const f of files) {
  // Embed the lightweight page copy when present (much smaller file,
  // identical on-screen look); fall back to the original otherwise.
  const stemName = f.replace(/\.[^.]+$/, "");
  let local = join(photosDir, f);
  try {
    await stat(join(root, "assets", "cache", "page", stemName + ".jpg"));
    local = join(root, "assets", "cache", "page", stemName + ".jpg");
  } catch {}
  const buf = await readFile(local);
  const mime = MIME[extname(local).toLowerCase()] || "application/octet-stream";
  photosJs.push(`{name:${JSON.stringify(f)},uri:"data:${mime};base64,${buf.toString("base64")}"}`);
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
${bookCss}
${readerCss}
</style>
</head>
<body>
<main class="room">
  <header class="book-header book-header--solo"><h1>${esc(title)}</h1></header>
  <section class="stage" aria-label="Interactive photo book"><div class="book-rig">
    <div id="book" class="book" data-page-width="512" data-page-height="640">
      <article class="book-page art-page cloth recto cover-collage" data-density="hard" aria-label="Front cover">
        <div class="cover-grid" id="cover-grid" aria-hidden="true"></div>
        <div class="cover-shade" aria-hidden="true"></div>
        <h2 class="cover-title">${esc(title)}</h2>
      </article>
      <span id="photo-pages"></span>
      <article class="book-page art-page cloth verso" data-density="hard" aria-label="Back cover"></article>
    </div>
  </div></section>
  <footer class="controls" aria-label="Book controls">
    <button id="previous" type="button" aria-label="Previous page">←</button>
    <div class="status" aria-live="polite"><span id="page-status">Cover</span><small>Drag or use arrow keys</small></div>
    <button id="next" type="button" aria-label="Next page">→</button>
  </footer>
</main>
<script>${vendorJs}</script>
<script>
var PHOTOS=[${photosJs.join(",")}];
(function(){
var book=document.querySelector("#book"),prev=document.querySelector("#previous"),next=document.querySelector("#next"),
st=document.querySelector("#page-status"),ori=document.querySelector("#orientation"),
flip=null,cur=0,turning=false;
// Scattered polaroid collage (seeded so it matches the live book).
var grid=document.querySelector("#cover-grid");
var cseed=20260926;
function crnd(){cseed=(cseed*1664525+1013904223)>>>0;return cseed/4294967296;}
PHOTOS.forEach(function(p,i){var im=document.createElement("img");im.src=p.uri;im.alt="";
im.style.left=(crnd()*70).toFixed(1)+"%";im.style.top=(2+crnd()*76).toFixed(1)+"%";
im.style.width=(27+crnd()*12).toFixed(1)+"%";im.style.height=(19+crnd()*7).toFixed(1)+"%";
im.style.transform="rotate("+(crnd()*22-11).toFixed(1)+"deg)";im.style.zIndex=String(i+1);
grid.appendChild(im);});
// Full-bleed photo pages, one per photo.
var slot=document.querySelector("#photo-pages"),frag=document.createDocumentFragment();
PHOTOS.forEach(function(p,i){
  var a=document.createElement("article");
  a.className="book-page art-page paper photo-full "+(i%2===0?"recto":"verso");
  a.setAttribute("aria-label","Photo "+(i+1));
  var fig=document.createElement("figure");fig.className="plate-full";
  var img=document.createElement("img");img.src=p.uri;img.alt=p.name;fig.appendChild(img);a.appendChild(fig);
  frag.appendChild(a);
});
// Closing page keeps the count even so the back cover is reachable.
if ((frag.childNodes.length + 2) % 2 === 1) {
  var closing=document.createElement("article");
  closing.className="book-page art-page paper verso";closing.setAttribute("aria-label","Closing page");
  closing.innerHTML='<div class="title-block"><h2>Sylhet, kept exactly how it felt.</h2></div>';
  frag.appendChild(closing);
}
slot.replaceWith(frag);
function upd(){var n=flip.getPageCount(),l=n-1;
book.dataset.edge=cur===0?"front":cur===l?"back":"inside";
prev.disabled=cur===0||turning;next.disabled=cur===l||turning;
st.textContent=cur===0?"Cover":cur===l?"Back cover":String(cur+1).padStart(2,"0")+" / "+String(n).padStart(2,"0");}
function o(m){book.dataset.layout=m;if(ori)ori.textContent=m==="portrait"?"Single page":"Open spread"}
var w=+book.dataset.pageWidth||512,h=+book.dataset.pageHeight||640;
document.documentElement.style.setProperty("--page-ratio",w/h);
flip=new St.PageFlip(book,{width:w,height:h,size:"stretch",minWidth:Math.round(w*.56),maxWidth:Math.round(w*1.04),
minHeight:Math.round(h*.56),maxHeight:Math.round(h*1.04),drawShadow:true,flippingTime:760,usePortrait:true,
startZIndex:10,autoSize:true,maxShadowOpacity:.42,showCover:true,mobileScrollSupport:false,clickEventForward:true,
useMouseEvents:true,swipeDistance:24,showPageCorners:true,disableFlipByClick:false});
flip.on("flip",function(e){cur=+e.data;upd()});flip.on("changeState",function(e){turning=e.data!=="read";upd()});
flip.on("init",function(e){o(e.data.mode)});flip.on("changeOrientation",function(e){o(e.data)});
flip.loadFromHTML(book.querySelectorAll(".book-page"));upd();
prev.addEventListener("click",function(){if(!turning)flip.flipPrev("bottom")});
next.addEventListener("click",function(){if(!turning)flip.flipNext("bottom")});
window.addEventListener("keydown",function(e){if(e.altKey||e.ctrlKey||e.metaKey||turning)return;
if(e.key==="ArrowLeft"){e.preventDefault();flip.flipPrev("bottom")}
if(e.key==="ArrowRight"||e.key===" "){e.preventDefault();flip.flipNext("bottom")}
if(e.key==="Home")flip.turnToPage(0);if(e.key==="End")flip.turnToPage(flip.getPageCount()-1)});
})();
</script>
</body>
</html>`;

await mkdir(dirname(out), { recursive: true });
await writeFile(out, html, "utf8");
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`Wrote ${out} (${kb} KB, ${files.length} photos stored once).`);
