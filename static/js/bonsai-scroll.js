/* The Deep Learners — scroll-driven bonsai intro.
   A procedurally-grown bonsai draws itself branch by branch as you scroll
   (anime.js scrubbed timeline) while its foliage resolves from a blur into
   sharp focus — "a model learning to see." */
(function () {
  "use strict";

  var grove = document.getElementById("grove");
  var svg = document.getElementById("bonsai");
  if (!grove || !svg || !window.anime) return;
  var anime = window.anime;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SVGNS = "http://www.w3.org/2000/svg";
  var VW = 900, VH = 640;

  // -------- seeded RNG (deterministic tree) --------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(20260709);
  function rand(a, b) { return a + rng() * (b - a); }

  // -------- generate the bonsai --------
  var branches = [];   // {d, w, depth, order}
  var pads = [];       // {x, y, r}
  var MAXD = 5, order = 0;
  var bnd = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  function ext(x, y, r) { r = r || 0; if (x - r < bnd.x0) bnd.x0 = x - r; if (y - r < bnd.y0) bnd.y0 = y - r; if (x + r > bnd.x1) bnd.x1 = x + r; if (y + r > bnd.y1) bnd.y1 = y + r; }

  function grow(x, y, ang, len, w, depth) {
    var curve = rand(-0.42, 0.42);
    var midAng = ang + curve * 0.6;
    var ex = x + Math.cos(ang) * len;
    var ey = y + Math.sin(ang) * len;
    var cx = x + Math.cos(midAng) * len * 0.5;
    var cy = y + Math.sin(midAng) * len * 0.5;
    ext(x, y); ext(ex, ey); ext(cx, cy);
    branches.push({
      d: "M" + x.toFixed(1) + "," + y.toFixed(1) + " Q" + cx.toFixed(1) + "," + cy.toFixed(1) + " " + ex.toFixed(1) + "," + ey.toFixed(1),
      w: w, depth: depth, order: order++
    });

    if (depth >= MAXD || len < 20) {
      var r = 32 + (MAXD - depth) * 6 + rand(0, 16);
      pads.push({ x: ex, y: ey, r: r, depth: depth });
      ext(ex, ey, r * 1.5);
      return;
    }

    var n;
    if (depth < 2) n = 1;                       // trunk climbs before splitting
    else n = rng() < 0.4 ? 3 : 2;               // then forks
    var nextLen = len * rand(0.7, 0.82);
    var nextW = w * 0.68;
    var spread = depth < 2 ? 0.3 : rand(0.65, 1.1);

    for (var i = 0; i < n; i++) {
      var frac = n === 1 ? 0 : (i / (n - 1)) - 0.5;    // -0.5..0.5
      var na = ang + frac * spread * 2 + rand(-0.12, 0.12);
      // bonsai: outer limbs flatten toward horizontal, tips droop a touch
      if (depth >= 2) na += frac * 0.5;
      na += 0.08; // gentle overall lean
      grow(ex, ey, na, nextLen, nextW, depth + 1);
    }
  }
  // start at the mound, growing up (-PI/2)
  grow(VW / 2, 548, -Math.PI / 2 + 0.12, 100, 27, 0);
  ext(VW / 2 - 180, 505); ext(VW / 2 + 180, 606);   // include the ground mound

  // -------- build SVG --------
  var GREENS = ["#1f9e6e", "#2bb37f", "#3fd39a", "#148a5c", "#57e0a8", "#0e7a52"];

  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // defs: trunk + mound gradients
  var defs = el("defs", {});
  defs.innerHTML =
    '<linearGradient id="bark" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0" stop-color="#4b3420"/><stop offset="1" stop-color="#7c5836"/>' +
    '</linearGradient>' +
    '<linearGradient id="mound" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2f7d4f"/><stop offset="1" stop-color="#173f2a"/>' +
    '</linearGradient>';
  svg.appendChild(defs);

  // grassy mound the tree grows from (integrated with the landscape)
  var groundG = el("g", { id: "ground", opacity: "0" });
  groundG.appendChild(el("path", {
    d: "M" + (VW / 2 - 175) + ",576 Q" + (VW / 2 - 95) + ",518 " + (VW / 2) + ",522 Q" + (VW / 2 + 95) + ",518 " + (VW / 2 + 175) + ",576 Q" + (VW / 2) + ",604 " + (VW / 2 - 175) + ",576 Z",
    fill: "url(#mound)"
  }));
  svg.appendChild(groundG);

  // branches layer
  var branchG = el("g", { id: "branches", fill: "none", stroke: "url(#bark)", "stroke-linecap": "round" });
  branches.forEach(function (b) {
    var p = el("path", { d: b.d, "stroke-width": Math.max(1.4, b.w).toFixed(1) });
    b.node = p;
    branchG.appendChild(p);
  });
  svg.appendChild(branchG);

  var PINKS = ["#f9a8d4", "#f472b6", "#fbcfe8", "#f0abfc", "#fda4af"];

  function makeFlower(parent, cx, cy, r) {
    var col = PINKS[(rng() * PINKS.length) | 0];
    for (var i = 0; i < 5; i++) {
      var ang = (i / 5) * Math.PI * 2 + rand(-0.16, 0.16);
      var px = cx + Math.cos(ang) * r * 0.55;
      var py = cy + Math.sin(ang) * r * 0.55;
      parent.appendChild(el("ellipse", {
        cx: px.toFixed(1), cy: py.toFixed(1), rx: (r * 0.55).toFixed(1), ry: (r * 0.34).toFixed(1),
        transform: "rotate(" + (ang * 57.3).toFixed(0) + " " + px.toFixed(1) + " " + py.toFixed(1) + ")",
        fill: col, opacity: "0.96"
      }));
    }
    parent.appendChild(el("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: (r * 0.3).toFixed(1), fill: "#fde68a" }));
  }

  // canopy = leaves + blossoms (both resolve into focus together)
  var canopyG = el("g", { id: "canopy" });
  var foliageG = el("g", { id: "foliage" });
  var blossomG = el("g", { id: "blossoms" });

  pads.forEach(function (pad) {
    // leaves
    var g = el("g", { class: "pad" });
    g.style.transformBox = "fill-box";
    g.style.transformOrigin = "center";
    var leaves = Math.round(pad.r * 0.7);
    for (var i = 0; i < leaves; i++) {
      var a = rand(0, Math.PI * 2), rr = Math.sqrt(rng());
      var lx = pad.x + Math.cos(a) * rr * pad.r * 1.35;
      var ly = pad.y + Math.sin(a) * rr * pad.r * 0.78 - pad.r * 0.25;
      g.appendChild(el("ellipse", {
        cx: lx.toFixed(1), cy: ly.toFixed(1),
        rx: (pad.r * rand(0.26, 0.4)).toFixed(1), ry: (pad.r * rand(0.18, 0.28)).toFixed(1),
        transform: "rotate(" + rand(-40, 40).toFixed(0) + " " + lx.toFixed(1) + " " + ly.toFixed(1) + ")",
        fill: GREENS[(rng() * GREENS.length) | 0], opacity: rand(0.75, 1).toFixed(2)
      }));
    }
    pad.node = g;
    foliageG.appendChild(g);

    // pink blossoms that bloom on this pad
    var bg = el("g", { class: "bloom" });
    bg.style.transformBox = "fill-box";
    bg.style.transformOrigin = "center";
    var nb = Math.max(2, Math.round(pad.r * 0.16));
    for (var k = 0; k < nb; k++) {
      var ba = rand(0, Math.PI * 2), br = Math.sqrt(rng());
      var bx = pad.x + Math.cos(ba) * br * pad.r * 1.15;
      var by = pad.y + Math.sin(ba) * br * pad.r * 0.68 - pad.r * 0.32;
      makeFlower(bg, bx, by, rand(5, 8.5));
    }
    pad.bloom = bg;
    blossomG.appendChild(bg);
  });

  canopyG.appendChild(foliageG);
  canopyG.appendChild(blossomG);
  svg.appendChild(canopyG);

  // grass tufts on the mound, in front of the trunk base
  var grassG = el("g", { id: "grass", opacity: "0", fill: "none", "stroke-linecap": "round" });
  for (var gb = 0; gb < 18; gb++) {
    var gx = VW / 2 + rand(-150, 150);
    var gdx = gx - VW / 2;
    var gy = 528 + (gdx * gdx) / 640 + rand(-3, 3);   // follow the mound contour
    var gh = rand(12, 26);
    var gl = rand(-9, 9);
    grassG.appendChild(el("path", {
      d: "M" + gx.toFixed(1) + "," + gy.toFixed(1) +
         " Q" + (gx + gl * 0.4).toFixed(1) + "," + (gy - gh * 0.6).toFixed(1) +
         " " + (gx + gl).toFixed(1) + "," + (gy - gh).toFixed(1),
      stroke: GREENS[(rng() * GREENS.length) | 0],
      "stroke-width": rand(1.6, 2.8).toFixed(1)
    }));
  }
  svg.appendChild(grassG);

  // seed dot (start state)
  var seed = el("circle", { id: "seed", cx: VW / 2, cy: 532, r: 5, fill: "#3fd39a" });
  svg.appendChild(seed);

  // crop the viewBox tightly around the generated tree
  var vpad = 48;
  svg.setAttribute("viewBox",
    (bnd.x0 - vpad).toFixed(0) + " " + (bnd.y0 - vpad).toFixed(0) + " " +
    (bnd.x1 - bnd.x0 + vpad * 2).toFixed(0) + " " + (bnd.y1 - bnd.y0 + vpad * 2).toFixed(0));

  // -------- prep line-draw --------
  branches.forEach(function (b) {
    var L = b.node.getTotalLength();
    b.node.style.strokeDasharray = L;
    b.node.style.strokeDashoffset = L;
  });
  pads.forEach(function (pad) {
    pad.node.style.opacity = 0;
    pad.node.style.transform = "scale(0.12)";
    pad.bloom.style.opacity = 0;
    pad.bloom.style.transform = "scale(0)";
  });

  // -------- build the scrubbed growth timeline --------
  var tl = anime.timeline({ autoplay: false, easing: "easeOutSine" });
  tl.add({ targets: groundG, opacity: [0, 1], duration: 420 }, 0);
  tl.add({ targets: grassG, opacity: [0, 1], duration: 480 }, 80);
  branches.forEach(function (b) {
    tl.add({
      targets: b.node, strokeDashoffset: [b.node.style.strokeDashoffset, 0],
      duration: 560, easing: "easeOutQuad"
    }, 160 + b.depth * 360 + (b.order % 6) * 26);
  });
  var padStart = 160 + (MAXD + 1) * 360;
  pads.forEach(function (pad, i) {
    tl.add({
      targets: pad.node, opacity: [0, 1], scale: [0.12, 1],
      duration: 520, easing: "easeOutBack"
    }, padStart + i * 34);
  });
  // blossoms bloom once the tree has leafed out
  var bloomStart = padStart + pads.length * 34 + 260;
  pads.forEach(function (pad, i) {
    tl.add({
      targets: pad.bloom, opacity: [0, 1], scale: [0, 1],
      duration: 520, easing: "easeOutBack"
    }, bloomStart + i * 40);
  });
  var TREE_DUR = tl.duration;

  // -------- falling petals & leaves (CSS-animated fluff) --------
  (function petalsInit() {
    var host = document.getElementById("petals");
    if (!host || reduce) return;
    var COLORS = ["#f9a8d4", "#f472b6", "#fbcfe8", "#fda4af", "#f0abfc", "#fde68a", "#6ee7b7", "#34d399"];
    var N = window.innerWidth < 600 ? 14 : 22;
    for (var i = 0; i < N; i++) {
      var s = document.createElement("span");
      s.className = "petal";
      var col = COLORS[(Math.random() * COLORS.length) | 0];
      var size = 8 + Math.random() * 10;
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.width = size.toFixed(1) + "px";
      s.style.height = (size * 0.82).toFixed(1) + "px";
      s.style.background = "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), " + col + " 62%)";
      var dur = 9 + Math.random() * 9;
      s.style.animationDuration = dur.toFixed(1) + "s";
      s.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
      host.appendChild(s);
    }
  })();

  // -------- petals collecting at the bottom (revealed by scroll) --------
  var pilePetals = [];
  (function pileInit() {
    var host = document.getElementById("pile");
    if (!host || reduce) return;
    var COLORS = ["#f9a8d4", "#f472b6", "#fbcfe8", "#fda4af", "#f0abfc", "#fde68a", "#6ee7b7", "#34d399"];
    var N = window.innerWidth < 600 ? 20 : 34;
    for (var i = 0; i < N; i++) {
      var s = document.createElement("span");
      s.className = "pile-petal";
      var col = COLORS[(Math.random() * COLORS.length) | 0];
      var size = 9 + Math.random() * 9;
      s.style.left = (Math.random() * 98).toFixed(2) + "%";
      s.style.width = size.toFixed(1) + "px";
      s.style.height = (size * 0.8).toFixed(1) + "px";
      s.style.marginBottom = (Math.random() * 26).toFixed(1) + "px";
      s.style.background = "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5), " + col + " 62%)";
      host.appendChild(s);
      pilePetals.push({ el: s, th: 0.08 + (i / N) * 0.82, rot: (Math.random() * 60 - 30).toFixed(0) });
    }
  })();

  // -------- ambient life (anime loops) --------
  if (!reduce) {
    anime({ targets: seed, r: [4, 6.5], opacity: [0.6, 1], direction: "alternate", loop: true, duration: 900, easing: "easeInOutSine" });
    var spores = document.querySelectorAll(".spore");
    spores.forEach(function (s, i) {
      anime({
        targets: s, translateY: [rand(10, 30), rand(-70, -140)], translateX: [0, rand(-30, 30)],
        opacity: [0, 0.8, 0], loop: true, delay: i * 700, duration: rand(6000, 9000), easing: "easeInOutSine"
      });
    });
  }

  // -------- scroll → progress driver --------
  var foliageEl = canopyG;
  var scene = document.querySelector(".scene");
  var glow = document.getElementById("grow-light");
  var bloomGlow = document.getElementById("bloom-glow");
  var backdrop = document.getElementById("backdrop");

  // koi fish that leap from the river at certain scroll moments
  var kois = [];
  (function koiInit() {
    if (!backdrop) return;
    var KOI = [
      { x0: 684, x1: 734, y: 470, h: 58, a: 0.38, b: 0.50, s: 1.0,  c: "#ff8a4d" },
      { x0: 772, x1: 714, y: 540, h: 68, a: 0.58, b: 0.70, s: 1.15, c: "#ff6e59" },
      { x0: 640, x1: 700, y: 600, h: 62, a: 0.78, b: 0.88, s: 1.3,  c: "#ffa25e" }
    ];
    KOI.forEach(function (k) {
      var g = document.createElementNS(SVGNS, "g");
      g.setAttribute("opacity", "0");
      g.innerHTML =
        '<path d="M-15,0 C-10,-7 5,-7 11,-2 C13,0 13,0 11,2 C5,7 -10,7 -15,0 Z" fill="' + k.c + '"/>' +
        '<path d="M-14,0 C-21,-7 -25,-3 -22,0 C-25,3 -21,7 -14,0 Z" fill="' + k.c + '"/>' +
        '<ellipse cx="0" cy="2.4" rx="7" ry="3" fill="rgba(255,255,255,0.85)"/>' +
        '<circle cx="8.4" cy="-1.6" r="1.3" fill="#22303c"/>';
      backdrop.appendChild(g);
      k.node = g;
      kois.push(k);
    });
  })();
  var panels = Array.prototype.slice.call(document.querySelectorAll(".beat"));
  var finale = document.getElementById("finale");
  var cards = document.querySelectorAll("#finale .leaf-card");
  var cue = document.getElementById("cue");
  var railFill = document.getElementById("rail-fill");
  var hEpoch = document.getElementById("h-epoch");
  var hLoss = document.getElementById("h-loss");
  var hFocus = document.getElementById("h-focus");

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function beatOpacity(p, a, b) {
    var f = 0.05;
    var fin = a < 0.001 ? 0 : f;              // first beat is visible immediately
    if (p < a || p > b) return 0;
    if (fin > 0 && p < a + fin) return (p - a) / fin;
    if (p > b - f) return (b - p) / f;
    return 1;
  }

  function render(p) {
    // tree growth (allocate 0..0.85 of scroll)
    var pt = clamp(p / 0.85, 0, 1);
    tl.seek(TREE_DUR * pt);

    // seed hides once trunk starts
    seed.style.opacity = clamp(1 - p / 0.06, 0, 1);

    // "learning to see": foliage resolves from blur to focus
    var focus = clamp((p - 0.5) / 0.33, 0, 1);
    foliageEl.style.filter = "blur(" + ((1 - focus) * 15).toFixed(2) + "px) saturate(" + (0.35 + focus * 0.9).toFixed(2) + ")";

    // grow-light intensifies; warm bloom-glow fades in as the tree flowers
    if (glow) glow.style.opacity = clamp(p * 1.25, 0, 1);
    if (bloomGlow) bloomGlow.style.opacity = (clamp((p - 0.62) / 0.22, 0, 1) * 0.85).toFixed(3);

    // landscape backdrop resolves from a blur into focus as you scroll
    if (backdrop) {
      var bf = clamp((p - 0.06) / 0.56, 0, 1);
      backdrop.style.filter = "blur(" + ((1 - bf) * 13).toFixed(1) + "px)";
      backdrop.style.opacity = (0.38 + bf * 0.58).toFixed(3);
    }

    // koi leaping out of the river at set moments in the scroll
    for (var ki = 0; ki < kois.length; ki++) {
      var ko = kois[ki];
      var kt = (p - ko.a) / (ko.b - ko.a);
      if (kt <= 0 || kt >= 1) { ko.node.setAttribute("opacity", "0"); continue; }
      var kx = ko.x0 + (ko.x1 - ko.x0) * kt;
      var ky = ko.y - ko.h * 4 * kt * (1 - kt);        // parabolic arc
      var vx = ko.x1 - ko.x0;
      var vy = -ko.h * (4 - 8 * kt);
      var ang = Math.atan2(vy, vx) * 57.2958;
      var sx = 1;
      if (vx < 0) { sx = -1; ang = ang - 180; }        // flip artwork when swimming left
      var fade = Math.min(kt / 0.12, (1 - kt) / 0.12, 1);
      ko.node.setAttribute("opacity", fade.toFixed(2));
      ko.node.setAttribute("transform",
        "translate(" + kx.toFixed(1) + " " + ky.toFixed(1) + ") rotate(" + ang.toFixed(1) + ") scale(" + (sx * ko.s).toFixed(2) + " " + ko.s + ")");
    }

    // petals settle into a pile at the bottom as the page is scrolled
    for (var pi = 0; pi < pilePetals.length; pi++) {
      var pp = pilePetals[pi];
      var landed = p > pp.th;
      pp.el.style.opacity = landed ? "1" : "0";
      pp.el.style.transform = "translateY(" + (landed ? 0 : -46) + "px) rotate(" + pp.rot + "deg)";
    }

    // HUD
    if (hEpoch) hEpoch.textContent = String(Math.round(p * 9999)).padStart(4, "0");
    if (hLoss) hLoss.textContent = (clamp(1 - p, 0, 1) * 1).toFixed(3);
    if (hFocus) hFocus.textContent = Math.round(focus * 100) + "%";
    if (railFill) railFill.style.transform = "scaleX(" + p.toFixed(4) + ")";

    // story beats
    panels.forEach(function (el) {
      var a = parseFloat(el.dataset.start), b = parseFloat(el.dataset.end);
      var o = beatOpacity(p, a, b);
      el.style.opacity = o;
      el.style.transform = "translate(-50%, " + ((1 - o) * 22).toFixed(1) + "px)";
      el.style.pointerEvents = o > 0.5 ? "auto" : "none";
    });

    // cue fades quickly
    if (cue) cue.style.opacity = clamp(1 - p / 0.05, 0, 1);

    // finale
    // finale: fade in the container and stagger the link cards, driven by scroll
    if (finale) {
      var fp = clamp((p - 0.9) / 0.09, 0, 1);
      finale.style.opacity = clamp(fp * 1.6, 0, 1).toFixed(3);
      finale.style.pointerEvents = fp > 0.4 ? "auto" : "none";
      for (var ci = 0; ci < cards.length; ci++) {
        var cp = clamp((fp - ci * 0.1) / 0.45, 0, 1);
        var e = 1 - Math.pow(1 - cp, 3);        // easeOutCubic
        cards[ci].style.opacity = e.toFixed(3);
        cards[ci].style.transform = "translateY(" + ((1 - e) * 18).toFixed(1) + "px) scale(" + (0.82 + 0.18 * e).toFixed(3) + ")";
      }
    }
    // dim the tree behind the finale so the link cards read clearly
    if (scene) scene.style.opacity = (1 - clamp((p - 0.9) / 0.07, 0, 1) * 0.7).toFixed(3);
  }

  var ticking = false, curP = 0;
  function onScroll() {
    var rect = grove.getBoundingClientRect();
    var total = grove.offsetHeight - window.innerHeight;
    curP = clamp(-rect.top / total, 0, 1);
    if (!ticking) { ticking = true; requestAnimationFrame(function () { render(curP); ticking = false; }); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  render(0);
  // if the page loads already scrolled
  onScroll();
})();
