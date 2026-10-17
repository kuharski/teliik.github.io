/* ==========================================================================
   TELiiK — shared behaviour
   Theme, nav, scroll reveals, footer. Loaded on every page.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- theme ----------------------------------------------------------
     The system setting decides on its own, every visit, until the visitor
     presses the toggle; that choice is stored and from then on it is the only
     thing consulted. Resolved in each page's head, before first paint — this
     file only handles the pressing and the colour of the browser chrome. */
  var root = document.documentElement;
  var BAR = { dark: "#12141A", light: "#FAF7F0" };

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function reflect(btn, theme) {
    var next = theme === "dark" ? "light" : "dark";
    if (btn) btn.setAttribute("aria-label", "Switch to " + next + " theme");
    // keep the mobile browser chrome in step with the page
    var bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.setAttribute("content", BAR[theme]);
  }

  var toggle = document.querySelector(".theme-toggle");
  reflect(toggle, currentTheme());

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("teliik-theme", next); } catch (e) {}
      reflect(toggle, next);
    });
  }

  /* ---- nav ---------------------------------------------------------- */
  var nav = document.querySelector(".nav");
  var burger = document.querySelector(".nav-burger");
  var links = document.querySelector(".nav-links");

  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      links.setAttribute("data-open", String(!open));
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        links.setAttribute("data-open", "false");
      }
    });
  }

  /* hide the nav on the way down, bring it back on the way up */
  if (nav) {
    var last = window.scrollY;
    var ticking = false;

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        var menuOpen = links && links.getAttribute("data-open") === "true";

        if (y <= 0 || menuOpen) {
          nav.setAttribute("data-hidden", "false");
        } else if (y > last + 4) {
          nav.setAttribute("data-hidden", "true");
        } else if (y < last - 4) {
          nav.setAttribute("data-hidden", "false");
        }

        last = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- reveals ------------------------------------------------------- */
  var targets = document.querySelectorAll(".reveal, .draw");

  if (!("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---- verse fits the screen ----------------------------------------
     On a phone a wrapped line reads as one the poet never wrote. Hold every
     line whole, then scale the poem's type down until its longest line fits.
     One size per poem, so its stanzas stay matched. Below MIN_PX the type
     would be unreadable, so the poem is let go and wraps as before. */
  var poems = document.querySelectorAll(".poem-body");
  var narrow = window.matchMedia("(max-width: 620px)");
  var MIN_PX = 12;

  function fitPoem(body) {
    body.style.removeProperty("--fit");
    body.classList.remove("is-fitted");
    if (!narrow.matches) return;

    var stanzas = body.querySelectorAll(".stanza");
    if (!stanzas.length) return;

    body.classList.add("is-fitted");
    var base = parseFloat(getComputedStyle(stanzas[0]).fontSize);
    var ratio = 1;
    Array.prototype.forEach.call(stanzas, function (s) {
      if (s.scrollWidth > s.clientWidth) {
        ratio = Math.min(ratio, s.clientWidth / s.scrollWidth);
      }
    });
    if (ratio === 1) return;

    // a hair under the exact fit, so rounding never tips a line over
    var size = Math.floor(base * ratio * 0.98 * 10) / 10;
    if (size < MIN_PX) {
      body.classList.remove("is-fitted");
      return;
    }
    body.style.setProperty("--fit", size + "px");
  }

  function fitAll() {
    Array.prototype.forEach.call(poems, fitPoem);
  }

  if (poems.length) {
    fitAll();
    // the webfont changes every line's width once it lands
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

    // only refit when the width changes, not when a phone's URL bar slides
    var lastW = window.innerWidth;
    var fitTimer;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitAll, 120);
    });
  }

  /* ---- footer wordmark scrolls home ---------------------------------- */
  var footMark = document.querySelector(".footer-mark");
  if (footMark) {
    footMark.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }
})();
