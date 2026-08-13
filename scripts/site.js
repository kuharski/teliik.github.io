/* ==========================================================================
   TELiiK — shared behaviour
   Theme, nav, scroll reveals, footer. Loaded on every page.
   ========================================================================== */

(function () {
  "use strict";

  /* ---- theme ----------------------------------------------------------
     Dark is the site's default, set in the CSS itself. The system setting is
     not consulted at all — only the visitor's own choice, which persists. */
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

  /* ---- footer wordmark scrolls home ---------------------------------- */
  var footMark = document.querySelector(".footer-mark");
  if (footMark) {
    footMark.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }
})();
