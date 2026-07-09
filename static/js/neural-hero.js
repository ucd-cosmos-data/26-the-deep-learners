/* Mouse-reactive feed-forward neural network for The Deep Learners hero.
   Nodes are arranged in layers; glowing activation pulses flow left to right.
   The network reacts to the cursor: nearby nodes brighten, a spotlight follows
   the pointer, and clicking fires a burst of activations. */
(function () {
  "use strict";

  var canvas = document.getElementById("nn-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var hero = document.getElementById("hero") || canvas.parentElement;
  var spot = document.getElementById("hero-spot");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PALETTE = ["#22d3ee", "#818cf8", "#f472b6", "#38bdf8", "#c084fc"];
  var W = 0, H = 0, DPR = 1;
  var layers = [], edges = [], pulses = [];
  var raf = null, running = false;
  var mouse = { x: -1e4, y: -1e4, active: false };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function resize() {
    var rect = hero.getBoundingClientRect();
    W = Math.max(rect.width, 1);
    H = Math.max(rect.height, 1);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    var sizes = W < 700 ? [3, 5, 6, 4, 2] : [4, 7, 9, 6, 3];
    layers = [];
    var padX = W * 0.12;
    var gapX = (W - padX * 2) / (sizes.length - 1);
    var padY = H * 0.14;
    var usableH = H - padY * 2;

    for (var li = 0; li < sizes.length; li++) {
      var n = sizes[li];
      var colX = padX + gapX * li;
      var layer = [];
      for (var i = 0; i < n; i++) {
        var y = n === 1 ? H / 2 : padY + usableH * (i / (n - 1));
        layer.push({ x: colX, y: y, bx: colX, by: y, r: rand(2.8, 5), phase: rand(0, 6.28), li: li, out: [], boost: 0 });
      }
      layers.push(layer);
    }

    edges = [];
    for (var l = 0; l < layers.length - 1; l++) {
      for (var a = 0; a < layers[l].length; a++) {
        for (var b = 0; b < layers[l + 1].length; b++) {
          var e = { a: layers[l][a], b: layers[l + 1][b] };
          edges.push(e);
          layers[l][a].out.push(e);
        }
      }
    }

    pulses = [];
    var seed = Math.min(32, Math.round(edges.length * 0.2));
    for (var s = 0; s < seed; s++) spawnStart(Math.random());
  }

  function spawnStart(t) {
    var starts = [];
    for (var i = 0; i < edges.length; i++) if (edges[i].a.li === 0) starts.push(edges[i]);
    if (starts.length) pulses.push({ e: pick(starts), t: t || 0, speed: rand(0.004, 0.010), color: pick(PALETTE) });
  }

  function burst(node) {
    for (var i = 0; i < node.out.length; i++) {
      pulses.push({ e: node.out[i], t: 0, speed: rand(0.012, 0.022), color: pick(PALETTE) });
    }
    node.boost = 1;
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    var t = now * 0.001;
    var MR = 150; // mouse influence radius

    // edges
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      var near = mouse.active && (Math.min(
        Math.hypot(e.a.x - mouse.x, e.a.y - mouse.y),
        Math.hypot(e.b.x - mouse.x, e.b.y - mouse.y)) < MR);
      ctx.strokeStyle = near ? "rgba(150,175,255,0.22)" : "rgba(140,158,220,0.07)";
      ctx.lineWidth = near ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }

    // nodes
    for (var l = 0; l < layers.length; l++) {
      for (var k = 0; k < layers[l].length; k++) {
        var nd = layers[l][k];
        var glow = 0.5 + 0.5 * Math.sin(t * 1.4 + nd.phase);
        var m = 0;
        if (mouse.active) {
          var d = Math.hypot(nd.bx - mouse.x, nd.by - mouse.y);
          if (d < MR) m = (1 - d / MR);
        }
        // gentle attraction toward cursor
        nd.x = nd.bx + (mouse.active ? (mouse.x - nd.bx) * 0.05 * m : 0);
        nd.y = nd.by + (mouse.active ? (mouse.y - nd.by) * 0.05 * m : 0);
        if (nd.boost > 0) nd.boost *= 0.92;

        var r = nd.r + glow * 1.2 + m * 4 + nd.boost * 4;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, r, 0, 6.2832);
        ctx.fillStyle = "rgba(226,232,255," + (0.3 + glow * 0.35 + m * 0.4) + ")";
        ctx.shadowColor = m > 0.05 ? "rgba(120,190,255,0.95)" : "rgba(129,140,248,0.8)";
        ctx.shadowBlur = 8 + glow * 10 + m * 22;
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // pulses
    for (var p = pulses.length - 1; p >= 0; p--) {
      var pu = pulses[p];
      if (!reduce) pu.t += pu.speed;
      if (pu.t >= 1) {
        var outs = pu.e.b.out;
        if (outs.length && pu.speed < 0.012) { pu.e = pick(outs); pu.t -= 1; }
        else { pulses.splice(p, 1); if (pulses.length < 40 && Math.random() < 0.6) spawnStart(0); continue; }
      }
      var x = lerp(pu.e.a.x, pu.e.b.x, pu.t);
      var y = lerp(pu.e.a.y, pu.e.b.y, pu.t);
      var bt = pu.t - 0.14 < 0 ? 0 : pu.t - 0.14;
      var tx = lerp(pu.e.a.x, pu.e.b.x, bt);
      var ty = lerp(pu.e.a.y, pu.e.b.y, bt);

      var grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, pu.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, 6.2832);
      ctx.fillStyle = pu.color;
      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (!reduce && running) raf = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    canvas.classList.add("ready");
    running = true;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  // pointer interaction
  hero.addEventListener("pointermove", function (ev) {
    var rect = hero.getBoundingClientRect();
    mouse.x = ev.clientX - rect.left;
    mouse.y = ev.clientY - rect.top;
    mouse.active = true;
    hero.classList.add("spot-on");
    if (spot) {
      spot.style.setProperty("--sx", mouse.x + "px");
      spot.style.setProperty("--sy", mouse.y + "px");
    }
  });
  hero.addEventListener("pointerleave", function () {
    mouse.active = false;
    hero.classList.remove("spot-on");
  });
  hero.addEventListener("pointerdown", function () {
    if (!mouse.active) return;
    // burst from nearest non-final node
    var best = null, bd = 1e9;
    for (var l = 0; l < layers.length - 1; l++) {
      for (var k = 0; k < layers[l].length; k++) {
        var nd = layers[l][k];
        var d = Math.hypot(nd.bx - mouse.x, nd.by - mouse.y);
        if (d < bd) { bd = d; best = nd; }
      }
    }
    if (best && bd < 220) burst(best);
  });

  // pause when out of view
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!running) { running = true; if (!raf) raf = requestAnimationFrame(frame); } }
        else { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }
      });
    }, { threshold: 0.02 }).observe(hero);
  }

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 180); });

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
