/* The Deep Learners — subtle drifting petals on inner pages.
   The homepage has its own richer petal system, so it is skipped here. */
(function () {
  "use strict";
  if (document.querySelector(".dl")) return; // homepage handles its own petals
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var host = document.createElement("div");
  host.className = "garden-petals";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  var COLORS = ["#f9a8d4", "#f472b6", "#fbcfe8", "#fda4af", "#6ee7b7"];
  var N = 8; // just a few — inner pages stay readable
  for (var i = 0; i < N; i++) {
    var s = document.createElement("span");
    s.className = "garden-petal";
    var col = COLORS[(Math.random() * COLORS.length) | 0];
    var size = 8 + Math.random() * 8;
    s.style.left = (Math.random() * 100).toFixed(2) + "%";
    s.style.width = size.toFixed(1) + "px";
    s.style.height = (size * 0.8).toFixed(1) + "px";
    s.style.background = "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5), " + col + " 62%)";
    var dur = 14 + Math.random() * 10; // slow drift
    s.style.animationDuration = dur.toFixed(1) + "s";
    s.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
    host.appendChild(s);
  }
})();
