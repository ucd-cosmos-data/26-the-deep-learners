/* The Deep Learners — interactive homepage.
   Contains a live neural-network playground (a real from-scratch MLP trained
   with backprop in the browser) plus modern UI micro-interactions. */
(function () {
  "use strict";

  /* =========================================================
     1. NEURAL NETWORK PLAYGROUND
     A 2-8-8-1 MLP, tanh hidden + sigmoid out, BCE loss, full-batch GD.
     Click the canvas to add points; watch the decision boundary learn.
     ========================================================= */
  (function playground() {
    var canvas = document.getElementById("pg-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var hint = document.getElementById("pg-hint");

    var elEpoch = document.getElementById("pg-epoch");
    var elLoss = document.getElementById("pg-loss");
    var elAcc = document.getElementById("pg-acc");

    var ARCH = [2, 8, 8, 1];
    var LR = 0.08, L2 = 1e-4, STEPS_PER_FRAME = 4, GRID = 58;

    var W = [], B = [];            // weights[k]: [out][in], biases[k]: [out]
    var points = [];               // {x,y in [-1,1], label 0|1}
    var epoch = 0, activeClass = 0;
    var size = 320, running = false, raf = null, frameNo = 0;

    // offscreen grid for the boundary heatmap
    var gcanvas = document.createElement("canvas");
    gcanvas.width = GRID; gcanvas.height = GRID;
    var gctx = gcanvas.getContext("2d");
    var gimg = gctx.createImageData(GRID, GRID);

    var COL_A = [34, 211, 238];    // class 0 (cyan)
    var COL_B = [244, 114, 182];   // class 1 (pink)

    function randn() {
      var u = 1 - Math.random(), v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v);
    }
    function initNet() {
      W = []; B = []; epoch = 0;
      for (var k = 0; k < ARCH.length - 1; k++) {
        var nin = ARCH[k], nout = ARCH[k + 1];
        var scale = Math.sqrt(1 / nin);
        var wk = [], bk = [];
        for (var j = 0; j < nout; j++) {
          var row = [];
          for (var i = 0; i < nin; i++) row.push(randn() * scale);
          wk.push(row); bk.push(0);
        }
        W.push(wk); B.push(bk);
      }
    }

    function tanh(x) { return Math.tanh(x); }
    function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

    // returns array of activations per layer; a[last] is length-1
    function forward(input) {
      var a = [input];
      for (var k = 0; k < W.length; k++) {
        var prev = a[k], out = [];
        var last = (k === W.length - 1);
        for (var j = 0; j < W[k].length; j++) {
          var s = B[k][j], row = W[k][j];
          for (var i = 0; i < row.length; i++) s += row[i] * prev[i];
          out.push(last ? sigmoid(s) : tanh(s));
        }
        a.push(out);
      }
      return a;
    }

    function trainStep() {
      if (points.length < 2) return;
      // zero grads
      var dW = [], dB = [];
      for (var k = 0; k < W.length; k++) {
        var wk = [], bk = [];
        for (var j = 0; j < W[k].length; j++) { wk.push(new Array(W[k][j].length).fill(0)); bk.push(0); }
        dW.push(wk); dB.push(bk);
      }

      var loss = 0, correct = 0, N = points.length;
      for (var p = 0; p < N; p++) {
        var pt = points[p], y = pt.label;
        var a = forward([pt.x, pt.y]);
        var L = W.length;
        var o = a[L][0];
        var eps = 1e-7;
        loss += -(y * Math.log(o + eps) + (1 - y) * Math.log(1 - o + eps));
        if ((o > 0.5 ? 1 : 0) === y) correct++;

        // delta per layer (index by activation layer 1..L)
        var delta = [];
        for (var q = 0; q <= L; q++) delta.push(null);
        delta[L] = [o - y];                        // sigmoid + BCE
        for (var k2 = L - 1; k2 >= 0; k2--) {
          // grads for W[k2] (connects a[k2] -> a[k2+1])
          for (var j2 = 0; j2 < W[k2].length; j2++) {
            var d = delta[k2 + 1][j2];
            dB[k2][j2] += d;
            var aprev = a[k2];
            for (var i2 = 0; i2 < aprev.length; i2++) dW[k2][j2][i2] += d * aprev[i2];
          }
          // delta for hidden layer k2 (skip input layer 0)
          if (k2 >= 1) {
            var dl = new Array(ARCH[k2]).fill(0);
            for (var ii = 0; ii < ARCH[k2]; ii++) {
              var acc = 0;
              for (var jj = 0; jj < W[k2].length; jj++) acc += W[k2][jj][ii] * delta[k2 + 1][jj];
              var av = a[k2][ii];
              dl[ii] = acc * (1 - av * av);          // tanh'
            }
            delta[k2] = dl;
          }
        }
      }

      // update
      for (var k3 = 0; k3 < W.length; k3++) {
        for (var j3 = 0; j3 < W[k3].length; j3++) {
          for (var i3 = 0; i3 < W[k3][j3].length; i3++) {
            W[k3][j3][i3] -= LR * (dW[k3][j3][i3] / N + L2 * W[k3][j3][i3]);
          }
          B[k3][j3] -= LR * (dB[k3][j3] / N);
        }
      }
      epoch++;
      return { loss: loss / N, acc: correct / N };
    }

    function renderBoundary() {
      var d = gimg.data, idx = 0;
      for (var gy = 0; gy < GRID; gy++) {
        var yy = (gy / (GRID - 1)) * 2 - 1;
        for (var gx = 0; gx < GRID; gx++) {
          var xx = (gx / (GRID - 1)) * 2 - 1;
          var o = forward([xx, yy]);
          var pr = o[o.length - 1][0];               // prob class 1
          d[idx++] = COL_A[0] + (COL_B[0] - COL_A[0]) * pr;
          d[idx++] = COL_A[1] + (COL_B[1] - COL_A[1]) * pr;
          d[idx++] = COL_A[2] + (COL_B[2] - COL_A[2]) * pr;
          d[idx++] = 150;
        }
      }
      gctx.putImageData(gimg, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      // heatmap
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 1;
      ctx.drawImage(gcanvas, 0, 0, size, size);
      // faint grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (var g = 1; g < 4; g++) {
        var c = (g / 4) * size;
        ctx.beginPath(); ctx.moveTo(c, 0); ctx.lineTo(c, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, c); ctx.lineTo(size, c); ctx.stroke();
      }
      // points
      for (var p = 0; p < points.length; p++) {
        var pt = points[p];
        var px = (pt.x + 1) / 2 * size, py = (pt.y + 1) / 2 * size;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, 6.2832);
        ctx.fillStyle = pt.label === 0 ? "#22d3ee" : "#f472b6";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(8,12,22,0.9)";
        ctx.stroke();
      }
    }

    function loop() {
      frameNo++;
      var stat = null;
      for (var s = 0; s < STEPS_PER_FRAME; s++) stat = trainStep();
      if (frameNo % 2 === 0) renderBoundary();
      draw();
      if (stat) {
        elEpoch.textContent = epoch.toLocaleString();
        elLoss.textContent = stat.loss.toFixed(3);
        elAcc.textContent = Math.round(stat.acc * 100) + "%";
      }
      if (running) raf = requestAnimationFrame(loop);
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      size = Math.max(240, Math.min(rect.width, rect.height || rect.width));
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * DPR);
      canvas.height = Math.round(size * DPR);
      canvas.style.height = size + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      renderBoundary();
      draw();
    }

    // ---- interaction ----
    function addPointFromEvent(ev) {
      var rect = canvas.getBoundingClientRect();
      var x = (ev.clientX - rect.left) / rect.width * 2 - 1;
      var y = (ev.clientY - rect.top) / rect.height * 2 - 1;
      var label = ev.shiftKey ? (1 - activeClass) : activeClass;
      points.push({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)), label: label });
      if (hint) hint.style.opacity = "0";
      draw();
    }
    canvas.addEventListener("pointerdown", function (ev) { ev.preventDefault(); addPointFromEvent(ev); });

    // presets
    function clear() { points = []; initNet(); if (hint) hint.style.opacity = "1"; renderBoundary(); draw(); resetStats(); }
    function resetStats() { elEpoch.textContent = "0"; elLoss.textContent = "—"; elAcc.textContent = "—"; }

    function preset(name) {
      points = []; initNet(); resetStats();
      var i, ang, r;
      if (name === "xor") {
        for (i = 0; i < 60; i++) {
          var qx = Math.random() < 0.5 ? -1 : 1, qy = Math.random() < 0.5 ? -1 : 1;
          points.push({ x: qx * (0.25 + Math.random() * 0.6), y: qy * (0.25 + Math.random() * 0.6), label: (qx * qy > 0) ? 0 : 1 });
        }
      } else if (name === "circle") {
        for (i = 0; i < 70; i++) {
          ang = Math.random() * 6.2832;
          var inner = Math.random() < 0.5;
          r = inner ? Math.random() * 0.42 : 0.6 + Math.random() * 0.35;
          points.push({ x: Math.cos(ang) * r, y: Math.sin(ang) * r, label: inner ? 1 : 0 });
        }
      } else if (name === "spiral") {
        for (var c = 0; c < 2; c++) {
          for (i = 0; i < 45; i++) {
            var tt = i / 45;
            r = tt * 0.92;
            ang = c * Math.PI + tt * 3.2 + (Math.random() - 0.5) * 0.3;
            points.push({ x: r * Math.sin(ang), y: r * Math.cos(ang), label: c });
          }
        }
      }
      if (hint) hint.style.opacity = points.length ? "0" : "1";
      renderBoundary(); draw();
    }

    document.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-preset");
        if (name === "clear") clear(); else preset(name);
      });
    });

    var segWrap = document.getElementById("pg-class");
    if (segWrap) {
      segWrap.querySelectorAll(".seg-btn").forEach(function (b) {
        b.addEventListener("click", function () {
          segWrap.querySelectorAll(".seg-btn").forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
          activeClass = parseInt(b.getAttribute("data-class"), 10);
        });
      });
    }

    // architecture mini-viz
    (function arch() {
      var svg = document.getElementById("pg-arch");
      if (!svg) return;
      var NS = "http://www.w3.org/2000/svg";
      var vw = 260, vh = 120, cols = ARCH.length;
      var xs = [];
      for (var k = 0; k < cols; k++) xs.push(26 + (vw - 52) * (k / (cols - 1)));
      var pos = [];
      for (k = 0; k < cols; k++) {
        var n = ARCH[k], arr = [];
        for (var i = 0; i < n; i++) {
          var y = n === 1 ? vh / 2 : 16 + (vh - 32) * (i / (n - 1));
          arr.push({ x: xs[k], y: y });
        }
        pos.push(arr);
      }
      var frag = "";
      for (k = 0; k < cols - 1; k++)
        for (i = 0; i < pos[k].length; i++)
          for (var j = 0; j < pos[k + 1].length; j++)
            frag += '<line x1="' + pos[k][i].x + '" y1="' + pos[k][i].y + '" x2="' + pos[k + 1][j].x + '" y2="' + pos[k + 1][j].y + '" stroke="rgba(150,170,255,0.12)" stroke-width="0.6"/>';
      for (k = 0; k < cols; k++)
        for (i = 0; i < pos[k].length; i++) {
          var fill = k === 0 ? "#22d3ee" : (k === cols - 1 ? "#f472b6" : "#818cf8");
          frag += '<circle cx="' + pos[k][i].x + '" cy="' + pos[k][i].y + '" r="3.4" fill="' + fill + '"><animate attributeName="opacity" values="0.45;1;0.45" dur="' + (2 + (i % 3) * 0.4) + 's" repeatCount="indefinite" begin="' + (k * 0.2) + 's"/></circle>';
        }
      svg.innerHTML = frag;
    })();

    // start when in view
    initNet();
    preset("spiral");
    function setRunning(on) {
      running = on;
      if (on && !raf) raf = requestAnimationFrame(loop);
      if (!on && raf) { cancelAnimationFrame(raf); raf = null; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { setRunning(e.isIntersecting); });
      }, { threshold: 0.15 }).observe(canvas);
    } else setRunning(true);

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (document.readyState === "complete") resize();
    else window.addEventListener("load", resize);
  })();

  /* =========================================================
     2. UI INTERACTIONS
     ========================================================= */

  // spotlight cards (cursor-following glow border)
  document.querySelectorAll(".spotlight").forEach(function (el) {
    el.addEventListener("pointermove", function (ev) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      el.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  });

  // magnetic buttons
  document.querySelectorAll(".magnetic").forEach(function (btn) {
    var strength = 0.35;
    btn.addEventListener("pointermove", function (ev) {
      var r = btn.getBoundingClientRect();
      var mx = ev.clientX - (r.left + r.width / 2);
      var my = ev.clientY - (r.top + r.height / 2);
      btn.style.setProperty("--tx", (mx * strength).toFixed(1) + "px");
      btn.style.setProperty("--ty", (my * strength).toFixed(1) + "px");
    });
    btn.addEventListener("pointerleave", function () {
      btn.style.setProperty("--tx", "0px");
      btn.style.setProperty("--ty", "0px");
    });
  });

  // scroll reveal
  if ("IntersectionObserver" in window) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { revObs.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  // animated counters
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var dur = 1400, t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-count]").forEach(function (el) { cObs.observe(el); });
  }

  // text scramble on the hero keyword
  (function scramble() {
    var el = document.getElementById("scramble");
    if (!el) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    var words = (el.getAttribute("data-words") || "learn").split(",");
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01<>/#*";
    var wi = 0;

    function scrambleTo(next) {
      var from = el.textContent, len = Math.max(from.length, next.length);
      var frames = [];
      for (var i = 0; i < len; i++) {
        var start = Math.floor(Math.random() * 14);
        var end = start + Math.floor(Math.random() * 14) + 8;
        frames.push({ from: from[i] || "", to: next[i] || "", start: start, end: end });
      }
      var f = 0;
      function run() {
        var out = "", done = 0;
        for (var i = 0; i < frames.length; i++) {
          var fr = frames[i];
          if (f >= fr.end) { out += fr.to; done++; }
          else if (f >= fr.start) { out += chars[Math.floor(Math.random() * chars.length)]; }
          else { out += fr.from; }
        }
        el.textContent = out;
        if (done === frames.length) { setTimeout(cycle, 1800); return; }
        f++;
        requestAnimationFrame(run);
      }
      run();
    }
    function cycle() { wi = (wi + 1) % words.length; scrambleTo(words[wi]); }
    setTimeout(cycle, 2200);
  })();

})();
