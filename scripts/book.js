/* ==========================================================================
   Stories — the book.

   The whole volume lives in one multi-column flow. A "page" is one column;
   the spread shows two at a time. Turning translates the flow by two columns
   and fades the page down and back up in place as it swaps.

   Below 700px this never initialises — stories.css turns the book back into
   an ordinary scroll and this script leaves it alone.
   ========================================================================== */

(function () {
  "use strict";

  var book = document.getElementById("book");
  var flow = document.getElementById("book-flow");
  if (!book || !flow) return;

  var viewport = book.querySelector(".book-viewport");
  var folio = book.querySelector(".book-folio");
  var prevBtn = book.querySelector(".book-prev");
  var nextBtn = book.querySelector(".book-next");
  var jumps = document.querySelectorAll(".book-jump");
  var railDate = document.querySelector(".book-date");

  var paged = window.matchMedia("(min-width: 701px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var PER_SPREAD = 2;
  var page = 0;         // index of the left-hand column of the spread
  var pageCount = 0;
  var colW = 0, gap = 0, step = 0, originDelta = 0;
  var turning = false;
  var markers = [];     // { id, title, date, page }
  var active = null;

  /* ---- measuring ------------------------------------------------------ */

  /* Element rects inside a multicol container are unreliable, so each story
     gets a zero-height marker whose client rect we can trust. */
  function placeMarkers() {
    markers = [];
    var stories = flow.querySelectorAll(".story");
    Array.prototype.forEach.call(stories, function (story) {
      var m = story.querySelector(".book-marker");
      if (!m) {
        m = document.createElement("span");
        m.className = "book-marker";
        m.setAttribute("aria-hidden", "true");
        m.style.cssText = "display:block;height:0;width:0;overflow:hidden;";
        story.insertBefore(m, story.firstChild);
      }
      markers.push({
        id: story.id,
        title: story.getAttribute("data-title") || story.id,
        date: story.getAttribute("data-date") || "",
        el: m,
        page: 0
      });
    });
  }

  /* An overflow:hidden box is still scrollable programmatically. A fragment
     link, a focused control or browser find will scroll a story into view and
     silently displace the whole book, which corrupts every measurement below.
     The scroll offset is never wanted here — the transform does the moving. */
  function unscroll() {
    if (viewport.scrollLeft) viewport.scrollLeft = 0;
    if (viewport.scrollTop) viewport.scrollTop = 0;
  }

  function measure() {
    if (!paged.matches) return false;
    unscroll();

    // the viewport is sized to the tallest thing a page must hold
    var avail = Math.min(920, Math.max(420, Math.round(window.innerHeight * 0.80)));
    viewport.style.height = avail + "px";

    var cs = getComputedStyle(flow);
    gap = parseFloat(cs.columnGap) || 0;
    // the flow's own content box, i.e. inside the viewport's page margins
    var inner = flow.clientWidth;
    colW = Math.floor((inner - gap) / PER_SPREAD);
    if (colW <= 0) return false;

    flow.style.setProperty("--page-w", colW + "px");
    flow.style.setProperty("--page-gap", gap + "px");

    /* The browser picks the real column width to fill the container, which is
       fractionally wider than the integer we asked for; using colW + gap as the
       pitch drifts by a few px per page. Measure the real pitch instead. */
    step = (inner - gap) / PER_SPREAD + gap;

    // neutralise the shift, then read the true geometry off the page
    flow.style.setProperty("--shift", "0px");
    var total = flow.scrollWidth;
    pageCount = Math.max(1, Math.round((total + gap) / step));

    /* Column 0 does not start at the viewport's content edge — the multicol
       box reports a left of its own. Rather than assume where it is, measure
       the offset once and fold it into every shift. */
    var base = flow.getBoundingClientRect().left;
    var vpLeft = viewport.getBoundingClientRect().left +
                 parseFloat(getComputedStyle(viewport).paddingLeft);
    originDelta = base - vpLeft;

    // where does each story begin?
    markers.forEach(function (m) {
      var rects = m.el.getClientRects();
      var r = rects.length ? rects[0] : m.el.getBoundingClientRect();
      m.page = Math.max(0, Math.round((r.left - base) / step));
    });

    return true;
  }

  /* ---- rendering ------------------------------------------------------ */

  /* Spreads always start on an even column, so an odd page count ends on a
     half-empty spread — page 31 sits alone, exactly as it would in print.
     Clamping to pageCount - PER_SPREAD instead would strand that last page. */
  function lastStart() {
    var s = Math.max(0, pageCount - 1);
    return s - (s % PER_SPREAD);
  }

  function clampPage(p) {
    if (p < 0) return 0;
    var last = lastStart();
    if (p > last) return last;
    return p - (p % PER_SPREAD);
  }

  function shiftFor(p) { return (-originDelta - p * step) + "px"; }

  function paint() {
    unscroll();
    flow.style.setProperty("--shift", shiftFor(page));

    var right = Math.min(page + PER_SPREAD, pageCount);
    folio.textContent = pageCount
      ? (page + 1) + (right > page + 1 ? "–" + right : "") + " / " + pageCount
      : "—";

    prevBtn.disabled = page <= 0;
    nextBtn.disabled = page >= lastStart();

    // which story is open? the last one that has started by this spread
    var current = null;
    markers.forEach(function (m) { if (m.page <= page + PER_SPREAD - 1) current = m; });

    // on the front matter no story is open yet, so nothing should be marked
    if (current !== active) {
      active = current;
      if (railDate) railDate.textContent = current ? (current.date || "—") : "—";
      history.replaceState(null, "",
        current ? "#" + current.id : location.pathname + location.search);
    }

    Array.prototype.forEach.call(jumps, function (b) {
      var on = active && b.getAttribute("data-story") === active.id;
      b.setAttribute("aria-current", on ? "true" : "false");
    });
  }

  /* ---- turning -------------------------------------------------------- */

  function turn(delta) {
    if (turning || !paged.matches) return;
    var target = clampPage(page + delta * PER_SPREAD);
    if (target === page) return;

    if (reduce.matches) {
      page = target;
      paint();
      return;
    }

    turning = true;

    /* The page fades down, swaps, and comes back up in place — nothing
       slides or rotates across the reader's eyeline. Cross-dissolving from a
       clone looked better on paper, but duplicating the whole multi-column
       flow on every turn costs more than a frame and the fade stuttered. */
    var OUT = 130, IN = 190;

    flow.style.transition = "opacity " + OUT + "ms ease";
    flow.style.opacity = "0";

    setTimeout(function () {
      page = target;
      paint();                                   // transform snaps while hidden
      flow.style.transition = "opacity " + IN + "ms ease";
      flow.style.opacity = "1";
      setTimeout(function () {
        flow.style.transition = "";
        turning = false;
      }, IN);
    }, OUT);
  }

  function goToStory(id) {
    var m = null;
    markers.forEach(function (x) { if (x.id === id) m = x; });
    if (!m) return;
    if (!paged.matches) {
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth" });
      return;
    }
    page = clampPage(m.page);
    paint();
  }

  /* ---- wiring --------------------------------------------------------- */

  nextBtn.addEventListener("click", function () { turn(1); });
  prevBtn.addEventListener("click", function () { turn(-1); });

  Array.prototype.forEach.call(jumps, function (b) {
    b.addEventListener("click", function () {
      goToStory(b.getAttribute("data-story"));
    });
  });

  function rebuild(keepStory) {
    if (!paged.matches) {
      viewport.style.height = "";
      flow.style.removeProperty("--shift");
      return;
    }
    if (!measure()) return;
    if (keepStory && active) {
      var m = null;
      markers.forEach(function (x) { if (x.id === active.id) m = x; });
      page = clampPage(m ? m.page : page);
    } else {
      page = clampPage(page);
    }
    paint();
  }

  // anything that scrolls the viewport is corrected on the spot
  viewport.addEventListener("scroll", unscroll, { passive: true });

  placeMarkers();
  unscroll();          // the browser may already have jumped to a #fragment
  rebuild(false);

  // pages land wrong on first paint without this — the display face loads late
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { rebuild(true); });
  }

  var t;
  function onResize() {
    clearTimeout(t);
    t = setTimeout(function () { rebuild(true); }, 160);
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(onResize).observe(viewport);
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  paged.addEventListener("change", function () { rebuild(true); });

  // stories#buck opens the book at Buck
  if (location.hash) {
    var want = location.hash.slice(1);
    setTimeout(function () { goToStory(want); }, 60);
  }
})();
