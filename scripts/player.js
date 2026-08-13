/* ==========================================================================
   Music — replaces the native audio controls with a hairline player.
   Progressive enhancement: the markup ships with working native controls
   and this only takes over once it has run. Playing one track stops the rest.
   ========================================================================== */

(function () {
  "use strict";

  var tracks = document.querySelectorAll(".track");
  if (!tracks.length) return;

  document.documentElement.classList.add("js");

  var PLAY = '<svg class="icon-play" viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>';
  var PAUSE = '<svg class="icon-pause" viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0h4v14H0zM8 0h4v14H8z"/></svg>';

  function clock(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  var players = [];

  Array.prototype.forEach.call(tracks, function (track) {
    var audio = track.querySelector("audio");
    var mount = track.querySelector(".player-custom");
    if (!audio || !mount) return;

    audio.removeAttribute("controls");
    audio.preload = "metadata";

    var name = (track.querySelector(".track-title") || {}).textContent || "track";
    name = name.trim();

    mount.innerHTML =
      '<button class="player-toggle" type="button" aria-label="Play ' + name + '">' +
        PLAY + PAUSE +
      '</button>' +
      '<button class="player-scrub" type="button" aria-label="Seek within ' + name + '">' +
        '<span class="player-fill"></span>' +
      '</button>' +
      '<span class="player-time">0:00</span>';

    var toggle = mount.querySelector(".player-toggle");
    var scrub = mount.querySelector(".player-scrub");
    var fill = mount.querySelector(".player-fill");
    var time = mount.querySelector(".player-time");

    function paint() {
      var d = audio.duration;
      var pct = isFinite(d) && d > 0 ? (audio.currentTime / d) * 100 : 0;
      fill.style.width = pct + "%";
      time.textContent = clock(audio.currentTime) +
        (isFinite(d) ? " / " + clock(d) : "");
    }

    function seek(e) {
      var d = audio.duration;
      if (!isFinite(d) || d <= 0) return;
      var box = scrub.getBoundingClientRect();
      var ratio = (e.clientX - box.left) / box.width;
      ratio = Math.min(1, Math.max(0, ratio));
      audio.currentTime = ratio * d;
      paint();
    }

    toggle.addEventListener("click", function () {
      if (audio.paused) {
        players.forEach(function (other) { if (other !== audio) other.pause(); });
        audio.play().catch(function () {});
      } else {
        audio.pause();
      }
    });

    scrub.addEventListener("click", seek);

    scrub.addEventListener("keydown", function (e) {
      var d = audio.duration;
      if (!isFinite(d)) return;
      if (e.key === "ArrowRight") {
        audio.currentTime = Math.min(d, audio.currentTime + 5);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
        e.preventDefault();
      }
    });

    audio.addEventListener("play", function () {
      track.classList.add("is-playing");
      toggle.setAttribute("aria-label", "Pause " + name);
    });
    audio.addEventListener("pause", function () {
      track.classList.remove("is-playing");
      toggle.setAttribute("aria-label", "Play " + name);
    });
    audio.addEventListener("ended", function () {
      track.classList.remove("is-playing");
      audio.currentTime = 0;
      paint();
    });
    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("loadedmetadata", paint);

    players.push(audio);
    paint();
  });
})();
