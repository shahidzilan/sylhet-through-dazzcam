// My Flipbook app: builds pages from assets/photos/list.json (created by build.mjs)
// or from files the user picks. Vanilla JS, no dependencies.
(function () {
  var bookElement = document.querySelector("#book");
  var previousButton = document.querySelector("#previous");
  var nextButton = document.querySelector("#next");
  var pageStatus = document.querySelector("#page-status");
  var orientationStatus = document.querySelector("#orientation");
  var fileInput = document.querySelector("#file-input");
  var titleInput = document.querySelector("#title-input");
  var heading = document.querySelector("#book-title-heading");
  var countNote = document.querySelector("#photo-count");
  var shuffleBtn = document.querySelector("#shuffle");
  var pageFlip = null;
  var currentPage = 0;
  var isTurning = false;
  var photoURLs = [];
  var layoutSeed = 0;

  // The authoring toolbar (photo picker, title field) stays hidden unless
  // ?edit=1 is in the URL — friends opening the plain link just see the book.
  if (!/[?#]edit=1/.test(location.search + location.hash)) {
    var toolbar = document.querySelector(".toolbar");
    if (toolbar) toolbar.style.display = "none";
  }

  function pageSize() {
    return {
      w: Number(bookElement.dataset.pageWidth) || 512,
      h: Number(bookElement.dataset.pageHeight) || 640
    };
  }

  function destroyFlip() {
    if (pageFlip && typeof pageFlip.destroy === "function") {
      try { pageFlip.destroy(); } catch (e) { /* older vendor without destroy */ }
    }
    pageFlip = null;
  }

  function updateControls() {
    if (!pageFlip) return;
    var pageCount = pageFlip.getPageCount();
    var lastPage = pageCount - 1;
    bookElement.dataset.edge = currentPage === 0 ? "front" : currentPage === lastPage ? "back" : "inside";
    previousButton.disabled = currentPage === 0 || isTurning;
    nextButton.disabled = currentPage === lastPage || isTurning;
    if (currentPage === 0) pageStatus.textContent = "Cover";
    else if (currentPage === lastPage) pageStatus.textContent = "Back cover";
    else pageStatus.textContent = String(currentPage + 1).padStart(2, "0") + " / " + String(pageCount).padStart(2, "0");
  }

  function updateOrientation(orientation) {
    bookElement.dataset.layout = orientation;
    if (orientationStatus) orientationStatus.textContent = orientation === "portrait" ? "Single page" : "Open spread";
  }

  function initFlip() {
    var size = pageSize();
    document.documentElement.style.setProperty("--page-ratio", size.w / size.h);
    destroyFlip();
    var pages = bookElement.querySelectorAll(".book-page");
    // eslint-disable-next-line no-undef
    pageFlip = new St.PageFlip(bookElement, {
      width: size.w,
      height: size.h,
      size: "stretch",
      minWidth: Math.max(1, Math.round(size.w * 0.56)),
      maxWidth: Math.max(1, Math.round(size.w * 1.04)),
      minHeight: Math.max(1, Math.round(size.h * 0.56)),
      maxHeight: Math.max(1, Math.round(size.h * 1.04)),
      drawShadow: true,
      flippingTime: 760,
      usePortrait: true,
      startZIndex: 10,
      autoSize: true,
      maxShadowOpacity: 0.42,
      showCover: true,
      mobileScrollSupport: false,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 24,
      showPageCorners: true,
      disableFlipByClick: false
    });
    currentPage = 0;
    isTurning = false;
    pageFlip.on("flip", function (event) { currentPage = Number(event.data); updateControls(); });
    pageFlip.on("changeState", function (event) { isTurning = event.data !== "read"; updateControls(); });
    pageFlip.on("init", function (event) { updateOrientation(event.data.mode); });
    pageFlip.on("changeOrientation", function (event) { updateOrientation(event.data); });
    pageFlip.loadFromHTML(pages);
    updateControls();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function plateClass(i) {
    // Rotate through pleasant sizes so spreads have rhythm.
    var kinds = ["large", "medium", "portrait", "small", "medium"];
    var pos = ["", "high", "low", ""];
    var k = kinds[(i + layoutSeed) % kinds.length];
    var p = pos[(i + layoutSeed) % pos.length];
    return "plate " + k + (p ? " " + p : "");
  }

  function photoPage(src, alt, n) {
    // Full-bleed: photo covers the whole page.
    var a = document.createElement("article");
    a.className = "book-page art-page paper photo-full " + (n % 2 === 0 ? "recto" : "verso");
    a.setAttribute("aria-label", "Photo " + (n + 1));
    var fig = document.createElement("figure");
    fig.className = "plate-full";
    var img = document.createElement("img");
    img.src = src;
    img.alt = alt || ("Photo " + (n + 1));
    img.loading = "lazy";
    img.decoding = "async";
    fig.appendChild(img);
    a.appendChild(fig);
    return a;
  }

  function blankPage(side) {
    var a = document.createElement("article");
    a.className = "book-page art-page paper " + side;
    a.setAttribute("aria-label", "Blank page");
    return a;
  }

  function rebuildBook(title, photos) {
    // Keep first (front cover, hard) and last (back cover, hard); rebuild middle.
    var pages = Array.prototype.slice.call(bookElement.querySelectorAll(".book-page"));
    if (pages.length < 2) return;
    var first = pages[0];
    var last = pages[pages.length - 1];
    first.querySelector(".cover-title").textContent = title;
    var coverGrid = first.querySelector("#cover-grid");
    if (coverGrid) {
      // Scattered polaroid collage: tilted, overlapping prints.
      // Seeded random so the cover looks identical on every load.
      coverGrid.textContent = "";
      var seed = 20260926;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      photos.forEach(function (ph, i) {
        var im = document.createElement("img");
        im.src = ph.thumb || ph.src;
        im.alt = "";
        im.loading = "eager";
        im.decoding = "async";
        im.style.left = (rnd() * 70).toFixed(1) + "%";
        im.style.top = (2 + rnd() * 76).toFixed(1) + "%";
        im.style.width = (27 + rnd() * 12).toFixed(1) + "%";
        im.style.height = (19 + rnd() * 7).toFixed(1) + "%";
        im.style.transform = "rotate(" + (rnd() * 22 - 11).toFixed(1) + "deg)";
        im.style.zIndex = String(i + 1);
        coverGrid.appendChild(im);
      });
    }
    var coverSub = first.querySelector(".cover-subtitle");
    if (coverSub) coverSub.textContent = "";
    var backMark = last.querySelector(".back-mark");
    if (backMark) backMark.textContent = title;

    // Remove middle pages.
    pages.slice(1, -1).forEach(function (p) { p.remove(); });

    var frag = document.createDocumentFragment();

    if (photos.length === 0) {
      var empty = document.createElement("article");
      empty.className = "book-page art-page paper verso";
      empty.setAttribute("aria-label", "Help page");
      empty.innerHTML = '<div class="colophon"><p>No photos yet</p><p class="small-print">Pick files above, or drop images into assets/photos and refresh.</p></div>';
      frag.appendChild(empty);
      var empty2 = blankPage("recto");
      frag.appendChild(empty2);
    } else {
      // One photo per page, back to back — no blank filler pages.
      // Uses the lightweight page copy when the list provides one.
      photos.forEach(function (ph, i) {
        frag.appendChild(photoPage(ph.page || ph.src, ph.alt, i));
      });
    }

    // One closing page after the last photo, nothing else — then the back
    // cover. It also keeps the total page count even (cover + back are
    // fixed) so the flip engine can reach the last page.
    if (photos.length > 0 && (frag.childNodes.length + 2) % 2 === 1) {
      var closing = document.createElement("article");
      closing.className = "book-page art-page paper verso";
      closing.setAttribute("aria-label", "Closing page");
      closing.innerHTML = '<div class="title-block"><h2>Sylhet, kept exactly how it felt.</h2></div>';
      frag.appendChild(closing);
    }

    last.before(frag);
    heading.textContent = title;
    document.title = title;
    countNote.textContent = photos.length === 0
      ? "No photos loaded yet — pick files above, or drop them into assets/photos and refresh."
      : photos.length + (photos.length === 1 ? " photo" : " photos") + " in this book. Drag a corner, swipe, or use arrow keys.";
    initFlip();
  }

  function applyTitle() {
    var t = (titleInput.value || "").trim() || "My Photo Flipbook";
    rebuildBook(t, photoURLs.map(function (p) { return { src: p.src, page: p.page, thumb: p.thumb, alt: p.alt }; }));
  }

  titleInput.addEventListener("change", applyTitle);
  shuffleBtn.addEventListener("click", function () {
    layoutSeed += 1;
    applyTitle();
  });

  fileInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(fileInput.files || []).filter(function (f) {
      return f.type.indexOf("image/") === 0;
    });
    // Revoke old object URLs.
    photoURLs.forEach(function (p) { if (p.objectURL) URL.revokeObjectURL(p.src); });
    photoURLs = files.map(function (f) {
      return { src: URL.createObjectURL(f), alt: f.name, objectURL: true };
    });
    applyTitle();
    fileInput.value = "";
  });

  previousButton.addEventListener("click", function () { if (pageFlip && !isTurning) pageFlip.flipPrev("bottom"); });
  nextButton.addEventListener("click", function () { if (pageFlip && !isTurning) pageFlip.flipNext("bottom"); });
  window.addEventListener("keydown", function (event) {
    if (!pageFlip || event.altKey || event.ctrlKey || event.metaKey || isTurning) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); pageFlip.flipPrev("bottom"); }
    if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); pageFlip.flipNext("bottom"); }
    if (event.key === "Home") pageFlip.turnToPage(0);
    if (event.key === "End") pageFlip.turnToPage(pageFlip.getPageCount() - 1);
  });

  // Try folder-based list first (works over http). Falls back to empty book
  // (file-picker still works over file://).
  fetch("assets/photos/list.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("no list"); return r.json(); })
    .then(function (data) {
      var title = data.title || "My Photo Flipbook";
      titleInput.value = title;
      photoURLs = (data.photos || []).map(function (p) {
        return { src: p.src, page: p.page, thumb: p.thumb, alt: p.alt || p.src };
      });
      rebuildBook(title, photoURLs);
    })
    .catch(function () {
      rebuildBook((titleInput.value || "").trim() || "My Photo Flipbook", []);
    });
})();
