/*! transiciones-visuales · fx-pro.js — módulos avanzados (se apoyan en fx.js; cada uno se apaga desde fx.config.js)
 *
 *  HUD cinematográfico · texto descifrado · sonidos sintetizados · clima narrativo + alerta + aberración cromática
 *  chispas y estela de cursor · título holográfico · voz viva (audio-reactivo) · profundidad 2.5D (WebGL)
 *  ciudad de neón (three.js) · mapa 3D de la historia + progreso + tarjeta de misión
 *
 * Mismas reglas que fx.js: solo se agrega DOM propio (en #fx-root o con data-fx="off"), nunca se reemplazan
 * ni se mueven nodos del proyecto, y nada captura clics salvo los botones/ventanas propios (✦ FX, ♪, ◈ MAPA).
 */
(function () {
  "use strict";
  var FX = window.__FX;
  if (!FX || !FX.interno) return;
  var D = document, W = window, I = FX.interno(), H = FX.H, root = I.root, cfg = I.cfg;
  var mk = I.mk, rnd = I.rnd, animate = I.animate, all = I.all;
  var perfil = I.perfil, full = perfil === "completo";
  if (perfil === "minimo") return;

  var P = {
    hud: true, descifrar: true, sonidos: true, voz: true, profundidad: true, fondo3d: true, mapa: false,
    clima: true, alerta: true, titulo3d: true, chispas: true, cursor: true, anio: null, climaPorEscena: {}, three: null
  };
  var k, u = cfg.pro || {};
  for (k in u) P[k] = u[k];
  var BASE = ((D.currentScript && D.currentScript.src) || "").replace(/[^\/]*$/, "");
  var enabled = function () { return I.isOn(); };
  var rgb = function () { return I.state.rgb.join(","); };
  var stem = function (s) { return String(s || "").split("?")[0].split("/").pop().replace(/\.[^.]+$/, ""); };
  var page = location.pathname.split("/").pop() || "index.html";
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function mainImg() {                         // la imagen más grande a la vista (la "escena" actual)
    var best = null, ba = 0;
    Array.prototype.forEach.call(D.images, function (i) {
      if (!I.eligibleImg(i) || (i.closest && i.closest(".fx-mapa"))) return;
      var r = i.getBoundingClientRect(), a = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) * r.width;
      if (a > ba) { ba = a; best = i; }
    });
    return best;
  }
  function slotBtn(label, title, slot) {       // botones propios, junto al ✦ FX
    var b = mk("fx-toggle", "button"); b.type = "button"; b.setAttribute("data-fx", "off");
    b.textContent = label; b.title = title;
    var pos = cfg.togglePos || "abajo-izq", off = (12 + slot * 66) + "px";
    if (pos.indexOf("der") > -1) { b.style.left = "auto"; b.style.right = off; } else b.style.left = off;
    if (pos.indexOf("arriba") === 0) { b.style.bottom = "auto"; b.style.top = "12px"; }
    D.body.appendChild(b); return b;
  }
  function loadThree(cb) {
    if (W.THREE) return cb();
    var s = D.createElement("script"); s.src = P.three || (BASE + "vendor/three.min.js");
    s.onload = cb; s.onerror = function () { /* sin three.js: esos módulos no se activan */ };
    D.head.appendChild(s);
  }

  /* ============================================================ SONIDOS (sintetizados, sin archivos) */
  var AC = null, sfxOn = false;
  try { sfxOn = localStorage.getItem("fx-sfx") === "1"; } catch (e) { /* nada */ }
  function actx() { if (!AC) { try { AC = new (W.AudioContext || W.webkitAudioContext)(); } catch (e) { return null; } } return AC; }
  function unlock() { var a = actx(); if (a && a.state === "suspended") a.resume().catch(function () {}); }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { D.addEventListener(ev, unlock, { passive: true, capture: true }); });
  function out() { var a = AC; return a && a.state === "running" ? a : null; }
  function env(g, t, vol, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tone(f0, f1, dur, type, vol, delay) {
    var a = out(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, vol || .05, dur); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, f0, f1, vol, q, delay) {
    var a = out(); if (!a) return;
    var t = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = a.createBufferSource(); s.buffer = b;
    var f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    var g = a.createGain(); env(g, t, vol || .06, dur); s.connect(f); f.connect(g); g.connect(a.destination); s.start(t);
  }
  var SFX = {
    click: function () { tone(1100, 1700, .07, "square", .022); tone(520, 260, .09, "sine", .03, .02); },
    whoosh: function () { noise(.45, 250, 3200, .08); },
    show: function () { tone(300, 900, .3, "sine", .03); },
    boot: function () { [0, 1, 2, 3].forEach(function (i) { var f = 330 * Math.pow(1.5, i % 3); tone(f, f, .12, "triangle", .035, i * .09); }); },
    alarm: function () { [0, .28, .56].forEach(function (d) { tone(740, 520, .22, "sawtooth", .04, d); }); },
    nuevo: function () { tone(880, 1320, .18, "sine", .035); tone(1320, 1760, .2, "sine", .03, .08); },
    final: function () { [0, 1, 2, 3].forEach(function (i) { var f = 440 * Math.pow(1.26, i); tone(f, f, .8, "sine", .04, i * .1); }); },
    "trans:portal": function () { tone(900, 140, .8, "sine", .05); noise(.8, 2200, 200, .05); },
    "trans:glitch": function () { for (var i = 0; i < 7; i++) noise(.07, rnd(500, 5000), rnd(300, 4000), .06, 4, i * .07); },
    "trans:scan": function () { tone(180, 2000, .85, "sawtooth", .025); },
    "trans:warp": function () { noise(.9, 200, 6000, .09); tone(120, 900, .9, "sawtooth", .03); },
    "trans:pixel": function () { for (var i = 0; i < 6; i++) tone(300 + i * 220, 300 + i * 220, .07, "square", .025, i * .1); },
    "trans:hologram": function () { tone(520, 520, .8, "sine", .04); tone(525, 525, .8, "sine", .04); noise(.7, 3000, 3000, .02, 8); },
    "trans:columnas": function () { for (var i = 0; i < 8; i++) tone(1400 - i * 130, 1300 - i * 130, .08, "triangle", .03, i * .07); }
  };
  function sfx(n) { if (!sfxOn || !enabled()) return; var f = SFX[n]; if (f) { try { f(); } catch (e) { /* nada */ } } }
  if (P.sonidos) {
    H.sfx = sfx;
    var sb = slotBtn("♪", "Sonidos sci-fi (apagados). Tocá para activarlos", 1);
    var paintS = function () { sb.setAttribute("aria-pressed", sfxOn ? "true" : "false"); sb.textContent = sfxOn ? "♪ ON" : "♪"; sb.title = sfxOn ? "Sonidos sci-fi activados (tocá para silenciarlos)" : "Sonidos sci-fi apagados (tocá para activarlos)"; };
    sb.addEventListener("click", function () {
      sfxOn = !sfxOn; try { localStorage.setItem("fx-sfx", sfxOn ? "1" : "0"); } catch (e) { /* nada */ }
      paintS(); if (sfxOn) { unlock(); setTimeout(function () { sfx("nuevo"); }, 80); }
    });
    paintS();
  }

  /* ============================================================ CLIMA NARRATIVO + ALERTA + ABERRACIÓN CROMÁTICA */
  var CLIMA_FX = { peligro: "glitch", hallazgo: "warp", vida: "portal", tecnologia: "scan", misterio: "hologram", intriga: "columnas" };
  var curClima = "";
  function hue() {
    var c = I.state.rgb, r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
    return (h * 60 + 360) % 360;
  }
  function climaDe(img) {
    var forced = img.getAttribute("data-fx-clima") || (P.climaPorEscena && P.climaPorEscena[stem(img.getAttribute("src") || img.src)]);
    if (forced) return forced;
    var h = hue();
    return (h < 22 || h > 345) ? "peligro" : h < 65 ? "hallazgo" : h < 165 ? "vida" : h < 215 ? "tecnologia" : h < 285 ? "misterio" : "intriga";
  }
  var svgCA = null;
  function ca() {
    if (svgCA) return;
    var d = D.createElement("div"); d.setAttribute("aria-hidden", "true"); d.setAttribute("data-fx", "off"); d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = '<svg width="0" height="0"><filter id="fx-ca" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/>' +
      '<feOffset in="r" dx="-6" result="r2"/><feOffset in="b" dx="6" result="b2"/>' +
      '<feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/></filter></svg>';
    D.body.appendChild(d); svgCA = d;
  }
  function aberrar(img, ms) {
    ca(); var prev = img.style.filter; img.style.filter = "url(#fx-ca)";
    setTimeout(function () { img.style.filter = prev; }, ms || 420);
  }
  function alerta(img) {
    var a = mk("fx-alerta"); root.appendChild(a);
    sfx("alarm");
    var an = animate(a, [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: .1, offset: .3 }, { opacity: .85, offset: .45 }, { opacity: .1, offset: .62 }, { opacity: .6, offset: .75 }, { opacity: 0 }], { duration: 2200, fill: "forwards" });
    all([an]).then(function () { a.remove(); }); setTimeout(function () { a.remove(); }, 3500);
    aberrar(img, 520);
    animate(img, [{ translate: "0 0" }, { translate: "-7px 3px" }, { translate: "6px -4px" }, { translate: "-4px 2px" }, { translate: "3px -1px" }, { translate: "0 0" }], { duration: 420, easing: "steps(6,end)" });
  }
  if (P.clima) {
    H.pick = function (img) { curClima = climaDe(img); return CLIMA_FX[curClima] || null; };
    H.ready.push(function (img, name) {
      if (!name) { curClima = climaDe(img); return; }
      if (curClima === "peligro" && P.alerta && enabled()) alerta(img);
      else if (name === "glitch" && enabled()) aberrar(img, 380);
    });
  }

  /* ============================================================ TEXTO DESCIFRADO (títulos) */
  var SC = "█▓▒░<>/\\[]{}=+*#%&01";
  if (P.descifrar && full) {
    H.decode = function (e) {
      if (!enabled()) return false;
      var n = e.firstChild;
      if (!n || n.nodeType !== 3 || e.childNodes.length !== 1) return false;
      var orig = n.nodeValue;
      if (orig.length > 90 || orig.trim().length < 2) return false;
      var t0 = performance.now(), dur = Math.min(900, 350 + orig.length * 22), last = null;
      (function fr(now) {
        if (!n.parentNode) return;
        if (last !== null && n.nodeValue !== last) return;            // el proyecto cambió el texto: no lo pisamos
        var q = clamp((now - t0) / dur, 0, 1), kk = Math.floor(q * orig.length), s = "", i, ch;
        for (i = 0; i < orig.length; i++) { ch = orig.charAt(i); s += (i < kk || /\s/.test(ch)) ? ch : SC.charAt(Math.floor(Math.random() * SC.length)); }
        if (q >= 1) s = orig;
        n.nodeValue = s; last = s;
        if (q < 1) requestAnimationFrame(fr);
      })(t0);
      return true;
    };
  }

  /* ============================================================ HUD: marcos, etiqueta, reloj y progreso de lectura */
  function hudInit() {
    if (!P.hud || !full) return;
    var map = new Map(), anio = P.anio || (function () { var m = (D.title + " " + ((D.querySelector("h1") || {}).textContent || "")).match(/\b(2[0-9]{3})\b/); return m ? m[1] : null; })();
    function clock() {
      var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
      return (anio || d.getFullYear()) + "." + z(d.getMonth() + 1) + "." + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
    }
    function make() {
      var h = mk("fx-hud"); h.innerHTML = '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><span class="t"></span><span class="b"></span>';
      root.appendChild(h); return { el: h, t: h.querySelector(".t"), b: h.querySelector(".b") };
    }
    function scan() {
      var seen = new Set(), n = 0;
      Array.prototype.forEach.call(D.images, function (i) {
        if (n >= 2 || !I.eligibleImg(i) || i.getBoundingClientRect().width < 300 || i.closest("a,button")) return;
        n++; seen.add(i);
        if (!map.has(i)) { var h = make(); map.set(i, h); h.t.textContent = "◈ " + ((i.alt || "ESCENA").slice(0, 46)).toUpperCase(); }
      });
      map.forEach(function (h, i) { if (!seen.has(i)) { h.el.remove(); map.delete(i); } });
    }
    (function pos() {
      requestAnimationFrame(pos);
      map.forEach(function (h, i) {
        if (!i.isConnected) return;
        var r = i.getBoundingClientRect(), c = I.clipInfo(i, r);
        h.el.style.left = c.l + "px"; h.el.style.top = c.t + "px"; h.el.style.width = c.w + "px"; h.el.style.height = c.h + "px";
        h.el.style.display = (c.w <= 0 || c.h <= 0 || c.t > innerHeight || c.t + c.h < 0 || !enabled()) ? "none" : "";
      });
    })();
    setInterval(scan, 600); setTimeout(scan, 300);
    setInterval(function () { var s = clock(); map.forEach(function (h) { h.b.textContent = s; }); }, 1000);
    H.img.push(function (img) {
      setTimeout(function () {
        var h = map.get(img); if (!h) return;
        h.t.textContent = "◈ " + ((img.alt || "ESCENA").slice(0, 46)).toUpperCase();
        animate(h.el, [{ opacity: 0, scale: "1.05" }, { opacity: 1, scale: "1" }], { duration: 500, easing: "cubic-bezier(.2,.7,.2,1)" });
      }, 60);
    });
    var bar = mk("fx-prog"); root.appendChild(bar);
    var tk = 0;
    function prog() { tk = 0; var s = D.documentElement, max = s.scrollHeight - innerHeight; bar.style.display = max > 80 ? "" : "none"; bar.style.transform = "scaleX(" + (max > 0 ? clamp(scrollY / max, 0, 1) : 0) + ")"; }
    W.addEventListener("scroll", function () { if (!tk) tk = requestAnimationFrame(prog); }, { passive: true }); prog();
  }

  /* ============================================================ CHISPAS + ESTELA DE CURSOR */
  function sparkInit() {
    if (!P.chispas && !(P.cursor && full)) return;
    var c = null, x = null, parts = [], trail = [], run = 0, fine = W.matchMedia("(hover:hover)").matches;
    function ensure() {
      if (c) return;
      c = mk("fx-spark", "canvas"); root.appendChild(c); x = c.getContext("2d");
      var sz = function () { c.width = innerWidth; c.height = innerHeight; }; sz(); W.addEventListener("resize", sz, { passive: true });
    }
    function loop(t) {
      run = 0; if (!c) return;
      x.clearRect(0, 0, c.width, c.height);
      var col = rgb(), i, p, now = performance.now();
      for (i = trail.length - 1; i >= 0; i--) if (now - trail[i].t > 520) trail.splice(i, 1);
      if (trail.length > 1) {
        x.lineCap = "round";
        for (i = 1; i < trail.length; i++) {
          var al = 1 - (now - trail[i].t) / 520;
          x.strokeStyle = "rgba(" + col + "," + (al * .55) + ")"; x.lineWidth = 1 + al * 3;
          x.beginPath(); x.moveTo(trail[i - 1].x, trail[i - 1].y); x.lineTo(trail[i].x, trail[i].y); x.stroke();
        }
        var h = trail[trail.length - 1];
        if (now - h.t < 200) { x.fillStyle = "rgba(" + col + ",.9)"; x.beginPath(); x.arc(h.x, h.y, 3, 0, 6.283); x.fill(); x.fillStyle = "rgba(" + col + ",.15)"; x.beginPath(); x.arc(h.x, h.y, 14, 0, 6.283); x.fill(); }
      }
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; var a = 1 - (now - p.t0) / p.life;
        if (a <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; p.vy += .06; p.vx *= .98;
        x.fillStyle = "rgba(" + col + "," + a + ")"; x.fillRect(p.x, p.y, p.s, p.s);
      }
      if (parts.length || trail.length) run = requestAnimationFrame(loop);
    }
    function go() { if (!run) run = requestAnimationFrame(loop); }
    if (P.chispas) D.addEventListener("pointerdown", function (e) {
      if (!enabled() || e.button > 0) return; ensure();
      for (var i = 0; i < 18; i++) { var a = rnd(0, 6.283), v = rnd(1.2, 5); parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, s: rnd(1.5, 3.2), t0: performance.now(), life: rnd(450, 800) }); }
      go();
    }, { passive: true, capture: true });
    if (P.cursor && full && fine) D.addEventListener("pointermove", function (e) {
      if (!enabled() || e.pointerType === "touch") return; ensure();
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (trail.length > 22) trail.shift(); go();
    }, { passive: true });
  }

  /* ============================================================ TÍTULO HOLOGRÁFICO (h1 grande) */
  function tituloInit() {
    if (!P.titulo3d || !full) return;
    setTimeout(function () {
      var h = D.querySelector("h1");
      if (!h || I.inFx(h) || !I.visible(h) || parseFloat(getComputedStyle(h).fontSize) < 36) return;
      var b = cfg.colores.b, a = cfg.colores.a, hx = function (c, al) { var n = parseInt(c.replace("#", ""), 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + al + ")"; };
      h.style.filter = "drop-shadow(1px 1px 0 " + hx(b, .95) + ") drop-shadow(2px 2px 0 " + hx(b, .8) + ") drop-shadow(3px 3px 0 " + hx(b, .62) + ") drop-shadow(4px 4px 0 " + hx(b, .45) + ") drop-shadow(0 0 24px " + hx(a, .45) + ")";
      h.setAttribute("data-fx-glitch", "");
      I.tiltable(h);
    }, 900);
  }

  /* ============================================================ VOZ VIVA: orbe + ecualizador con la narración */
  function vozInit() {
    if (!P.voz || !full) return;
    var w = mk("fx-voz"), c = mk("", "canvas"); c.width = 300; c.height = 76; w.appendChild(c); root.appendChild(w); w.style.display = "none";
    var x = c.getContext("2d"), an = null, data = null, srcNode = null, playing = null, raf = 0, amp = 0;
    function attach(a) {
      var ac = actx(); if (!ac) return;
      try {
        var st = a.captureStream ? a.captureStream() : (a.mozCaptureStream ? a.mozCaptureStream() : null);
        if (!st || !st.getAudioTracks().length) return;
        if (srcNode) { try { srcNode.disconnect(); } catch (e) { /* nada */ } }
        srcNode = ac.createMediaStreamSource(st); an = ac.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = .78;
        srcNode.connect(an); data = new Uint8Array(an.frequencyBinCount);     // el analizador NO se conecta a la salida: el audio sigue su camino normal
      } catch (e) { an = null; }
    }
    function frame(t) {
      raf = 0; if (!playing) return;
      var bars = 30, lv = [], i, real = an && AC && AC.state === "running";
      if (real) { an.getByteFrequencyData(data); var s = 0; for (i = 0; i < bars; i++) { lv.push(data[i + 1] / 255); s += lv[i]; } real = s > .05; }
      if (!real) for (i = 0; i < bars; i++) lv.push(.18 + .5 * Math.abs(Math.sin(t / 170 + i * .55) * Math.sin(t / 430 + i * .21)));   // sin datos reales: pulso simulado
      var sum = 0; lv.forEach(function (v) { sum += v; }); amp += (sum / bars - amp) * .3;
      var col = rgb(); x.clearRect(0, 0, 300, 76);
      var g = x.createRadialGradient(38, 38, 2, 38, 38, 30 + amp * 22);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.25, "rgba(" + col + ",.85)"); g.addColorStop(1, "rgba(" + col + ",0)");
      x.fillStyle = g; x.beginPath(); x.arc(38, 38, 32 + amp * 22, 0, 6.283); x.fill();
      x.strokeStyle = "rgba(" + col + ",.8)"; x.lineWidth = 1.5;
      for (i = 0; i < 2; i++) { x.beginPath(); x.arc(38, 38, 24 + amp * 16 + i * 8 + Math.sin(t / 260 + i) * 2, 0, 6.283); x.globalAlpha = .6 - i * .3; x.stroke(); x.globalAlpha = 1; }
      for (i = 0; i < bars; i++) {
        var h = 4 + lv[i] * 56, bx = 84 + i * 7.1;
        x.fillStyle = "rgba(" + col + "," + (.45 + lv[i] * .5) + ")"; x.fillRect(bx, 38 - h / 2, 4, h);
      }
      raf = requestAnimationFrame(frame);
    }
    D.addEventListener("playing", function (e) {
      var a = e.target; if (!a || (a.tagName !== "AUDIO" && a.tagName !== "VIDEO") || a.muted || a.volume === 0 || !enabled()) return;
      playing = a; an = null; attach(a); w.style.display = "";
      animate(w, [{ opacity: 0, transform: "translateY(-12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
      if (!raf) raf = requestAnimationFrame(frame);
    }, true);
    ["pause", "ended", "emptied"].forEach(function (ev) {
      D.addEventListener(ev, function (e) { if (e.target === playing) { playing = null; setTimeout(function () { if (!playing) w.style.display = "none"; }, 450); } }, true);
    });
  }

  /* ============================================================ PROFUNDIDAD 2.5D (WebGL): la ilustración "respira" con el mouse / giroscopio */
  var depthCur = null;
  function Depth(img) {
    var st = mk("fx-stage"), box = mk("fx-box"), c = mk("", "canvas"), gl, prog, tex = null, dead = false, raf = 0;
    c.style.cssText = "width:100%;height:100%;display:block";
    box.appendChild(c); st.appendChild(box); root.appendChild(st);
    gl = c.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    if (!gl) { st.remove(); return null; }
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var vs = "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
    var fs = "precision mediump float;uniform sampler2D t;uniform vec2 m;uniform vec4 f;varying vec2 uv;" +
      "float dp(vec2 q){vec3 c=texture2D(t,q).rgb;float mx=max(c.r,max(c.g,c.b));float mn=min(c.r,min(c.g,c.b));return clamp(dot(c,vec3(.299,.587,.114))*.7+(mx-mn)*.3,0.,1.);}" +
      "void main(){vec2 q=f.xy+uv*f.zw;float d=dp(q);vec2 o=m*(d-.4)*.05;q=clamp(q+o*f.zw,f.xy,f.xy+f.zw);gl_FragColor=texture2D(t,q);}";
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { st.remove(); return null; }
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uM = gl.getUniformLocation(prog, "m"), uF = gl.getUniformLocation(prog, "f");
    var mx = 0, my = 0, tx = 0, ty = 0, lastIn = 0, ok = false, fitF = [0, 0, 1, 1];
    function upload() {
      try {
        if (!img.complete || !img.naturalWidth) return false;
        if (tex) gl.deleteTexture(tex);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        ok = true; return true;
      } catch (e) { ok = false; return false; }          // imagen de otro origen / file://: no se puede leer
    }
    function layout() {
      var r = img.getBoundingClientRect(), nw = img.naturalWidth, nh = img.naturalHeight, fit = getComputedStyle(img).objectFit;
      var dpr = Math.min(W.devicePixelRatio || 1, 1.25), sc = Math.min(1, 1500 / Math.max(1, r.width * dpr));
      var cw = Math.max(2, Math.round(r.width * dpr * sc)), ch = Math.max(2, Math.round(r.height * dpr * sc));
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      if (fit === "fill") fitF = [0, 0, 1, 1];
      else { var s = Math.max(r.width / nw, r.height / nh), fw = r.width / (nw * s), fh = r.height / (nh * s); fitF = [(1 - fw) / 2, (1 - fh) / 2, fw, fh]; }
      gl.viewport(0, 0, c.width, c.height);
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      if (D.hidden || !enabled() || !ok) { st.style.visibility = "hidden"; return; }
      var r = img.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width < 50) return;
      st.style.visibility = ""; I.placeStage(st, box, img); layout();
      var idle = performance.now() - lastIn > 2500, k = .08;
      var gx = idle ? Math.sin(t / 2600) * .7 : tx, gy = idle ? Math.cos(t / 3400) * .45 : ty;
      mx += (gx - mx) * k; my += (gy - my) * k;
      gl.uniform2f(uM, mx, my); gl.uniform4f(uF, fitF[0], fitF[1], fitF[2], fitF[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function onMove(e) { tx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1); ty = clamp(e.clientY / innerHeight * 2 - 1, -1, 1); lastIn = performance.now(); }
    function onTilt(e) { if (e.gamma == null) return; tx = clamp(e.gamma / 25, -1, 1); ty = clamp((e.beta - 45) / 25, -1, 1); lastIn = performance.now(); }
    W.addEventListener("pointermove", onMove, { passive: true }); W.addEventListener("deviceorientation", onTilt, { passive: true });
    st.style.visibility = "hidden";
    if (upload()) { layout(); }
    raf = requestAnimationFrame(frame);
    return {
      img: img,
      reload: function () { st.style.visibility = "hidden"; ok = false; I.whenReady(img).then(function () { if (!dead && upload()) layout(); }); },
      hide: function () { ok = false; st.style.visibility = "hidden"; },
      destroy: function () { dead = true; cancelAnimationFrame(raf); W.removeEventListener("pointermove", onMove); W.removeEventListener("deviceorientation", onTilt); st.remove(); }
    };
  }
  function depthInit() {
    if (!P.profundidad || !full) return;
    function pick() {
      if (!enabled()) return;
      var i = mainImg();
      if (!i || !I.clippedAncestor(i) || i.closest("a,button") || getComputedStyle(i).objectFit === "contain" || i.hasAttribute("data-fx-profundidad-off")) { return; }
      if (depthCur && depthCur.img === i) return;
      if (depthCur) depthCur.destroy();
      i.__fxkb = true;                                              // el zoom lento y la profundidad no conviven
      i.getAnimations().forEach(function (a) { if (a.effect && a.effect.getTiming().iterations === Infinity) a.cancel(); });
      depthCur = Depth(i);
    }
    setInterval(pick, 1000); setTimeout(pick, 600);
    H.img.push(function (img) { if (depthCur && depthCur.img === img) depthCur.hide(); });
    H.ready.push(function (img) { if (depthCur && depthCur.img === img) depthCur.reload(); });
  }

  /* ============================================================ CIUDAD DE NEÓN (three.js) detrás de la página */
  function ciudadInit() {
    if (!P.fondo3d || !full) return;
    var hb = getComputedStyle(D.documentElement).backgroundColor, m = hb.match(/rgba?\(([^)]+)\)/), pr = m && m[1].split(",");
    if (pr && (pr.length < 4 || parseFloat(pr[3]) > 0)) return;     // el <html> tiene fondo propio: la ciudad quedaría tapada
    loadThree(function () {
      var T = W.THREE; if (!T) return;
      var c = mk("fx-city", "canvas"); c.setAttribute("data-fx", "off"); c.setAttribute("aria-hidden", "true"); D.body.insertBefore(c, D.body.firstChild);
      var renderer;
      try { renderer = new T.WebGLRenderer({ canvas: c, antialias: false, alpha: false, powerPreference: "low-power" }); } catch (e) { c.remove(); return; }
      renderer.setPixelRatio(1);
      var bg = new T.Color(cfg.fondo || "#050813"), scene = new T.Scene(); scene.background = bg; scene.fog = new T.FogExp2(bg, .011);
      var cam = new T.PerspectiveCamera(70, 1, .1, 240); cam.position.set(0, 15, 0); scene.add(cam);
      var pal = [new T.Color(cfg.colores.a), new T.Color(cfg.colores.b), new T.Color(cfg.colores.c)], L = 126, cell = 4.6, rows = [];
      var x, z;
      for (x = -26; x <= 26; x += cell) { if (Math.abs(x) < 5.5) continue; for (z = 0; z > -L; z -= cell) rows.push([x + rnd(-.5, .5), z + rnd(-.5, .5)]); }
      var N = rows.length, inst = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0x070b18 }), N);
      var pos = [], col = [], wp = [], wc = [], mt = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3();
      var corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      var edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      rows.forEach(function (rw, n) {
        var w = rnd(2, 3.4), d = rnd(2, 3.4), h = rnd(5, 34) * (1 / (1 + Math.abs(rw[0]) / 22)) + 3, cc = pal[Math.floor(rnd(0, 3))];
        ps.set(rw[0], h / 2, rw[1]); sc.set(w, h, d); mt.compose(ps, q, sc); inst.setMatrixAt(n, mt);
        edges.forEach(function (e) {
          [e[0], e[1]].forEach(function (ci) { var cr = corners[ci]; pos.push(rw[0] + cr[0] * w / 2, h / 2 + cr[1] * h / 2, rw[1] + cr[2] * d / 2); col.push(Math.min(1, cc.r * 1.5), Math.min(1, cc.g * 1.5), Math.min(1, cc.b * 1.5)); });
        });
        for (var j = 0; j < 12; j++) {
          var fx = Math.random() < .5 ? (Math.random() < .5 ? -1 : 1) * w / 2 : rnd(-w / 2, w / 2), fz = Math.abs(fx) === w / 2 ? rnd(-d / 2, d / 2) : (Math.random() < .5 ? -1 : 1) * d / 2;
          wp.push(rw[0] + fx, rnd(1, h - .5), rw[1] + fz); var wcol = Math.random() < .7 ? cc : new T.Color(1, .92, .7); wc.push(wcol.r, wcol.g, wcol.b);
        }
      });
      var dc = mk("", "canvas"); dc.width = dc.height = 32; var dx = dc.getContext("2d"), dg = dx.createRadialGradient(16, 16, 0, 16, 16, 16);
      dg.addColorStop(0, "rgba(255,255,255,1)"); dg.addColorStop(.35, "rgba(255,255,255,.7)"); dg.addColorStop(1, "rgba(255,255,255,0)"); dx.fillStyle = dg; dx.fillRect(0, 0, 32, 32);
      var dot = new T.CanvasTexture(dc);
      var gp = [], gx2, gz2;                                         // grilla neón en el suelo
      for (gx2 = -28; gx2 <= 28; gx2 += cell) gp.push(gx2, 0, 0, gx2, 0, -L);
      for (gz2 = 0; gz2 >= -L; gz2 -= cell) gp.push(-28, 0, gz2, 28, 0, gz2);
      var gg = new T.BufferGeometry(); gg.setAttribute("position", new T.Float32BufferAttribute(gp, 3));
      var city = new T.Group(), eg = new T.BufferGeometry();
      city.add(new T.LineSegments(gg, new T.LineBasicMaterial({ color: pal[0], transparent: true, opacity: .45 })));
      eg.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); eg.setAttribute("color", new T.Float32BufferAttribute(col, 3));
      var wg = new T.BufferGeometry(); wg.setAttribute("position", new T.Float32BufferAttribute(wp, 3)); wg.setAttribute("color", new T.Float32BufferAttribute(wc, 3));
      city.add(inst, new T.LineSegments(eg, new T.LineBasicMaterial({ vertexColors: true })),
        new T.Points(wg, new T.PointsMaterial({ size: .32, map: dot, alphaTest: .02, vertexColors: true, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false })));
      var city2 = city.clone(); city2.position.z = -L; scene.add(city, city2);
      var glow = new T.Mesh(new T.PlaneGeometry(230, 90), new T.MeshBasicMaterial({ color: pal[0], transparent: true, opacity: .34, blending: T.AdditiveBlending, fog: false, depthWrite: false }));
      glow.position.set(0, 8, -170); cam.add(glow);
      var RN = 520, rp = new Float32Array(RN * 6), ro = [], i;
      for (i = 0; i < RN; i++) ro.push([rnd(-34, 34), rnd(0, 40), rnd(-90, 6), rnd(24, 46)]);
      var rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3));
      var rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: pal[0], transparent: true, opacity: .22, fog: true })); rain.frustumCulled = false; scene.add(rain);
      var mxp = 0, myp = 0, tx = 0, ty = 0, last = 0, camZ = 0, target = new T.Color(pal[0]);
      W.addEventListener("pointermove", function (e) { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
      function size() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / Math.max(1, innerHeight); cam.updateProjectionMatrix(); }
      size(); W.addEventListener("resize", size, { passive: true });
      (function loop(t) {
        requestAnimationFrame(loop);
        var on = enabled(); c.style.display = on ? "" : "none";
        if (!on || D.hidden || t - last < 33) return;
        var dt = Math.min(.1, (t - last) / 1000); last = t;
        camZ -= dt * 3.4; if (camZ < -L) camZ += L;
        mxp += (tx - mxp) * .04; myp += (ty - myp) * .04;
        cam.position.set(Math.sin(t / 5200) * 2 + mxp * 3, 15 + Math.sin(t / 4100) * .8 - myp * 1.5, camZ);
        cam.rotation.set(-.2 - myp * .06, -mxp * .14, Math.sin(t / 6000) * .02);
        target.setRGB(I.state.rgb[0] / 255, I.state.rgb[1] / 255, I.state.rgb[2] / 255);
        glow.material.color.lerp(target, .03); rain.material.color.lerp(target, .03);
        for (i = 0; i < RN; i++) {
          var o = ro[i]; o[1] -= o[3] * dt; if (o[1] < 0) o[1] = 40;
          var px = cam.position.x + o[0], pz = camZ + o[2];
          rp[i * 6] = px; rp[i * 6 + 1] = o[1]; rp[i * 6 + 2] = pz; rp[i * 6 + 3] = px; rp[i * 6 + 4] = o[1] + 1.3; rp[i * 6 + 5] = pz;
        }
        rg.attributes.position.needsUpdate = true;
        renderer.render(scene, cam);
      })(0);
    });
  }

  /* ============================================================ MAPA 3D de la historia + progreso + tarjeta de misión */
  function mapaInit() {
    var M = P.mapa;
    if (!M || !full || (M.paginas && M.paginas.indexOf(page) < 0)) return;
    var key = "fx-mapa:" + location.pathname.replace(/[^\/]*$/, ""), nodes = null, ids = [], vis = {}, edg = {}, prev = null, finales = [];
    try { var sv = JSON.parse(localStorage.getItem(key) || "{}"); vis = sv.v || {}; edg = sv.e || {}; } catch (e) { /* nada */ }
    function save() { try { localStorage.setItem(key, JSON.stringify({ v: vis, e: edg })); } catch (e) { /* nada */ } }
    function cur() {
      if (typeof M.idFn === "function") { try { return M.idFn(); } catch (e) { return null; } }
      var i = mainImg(); return i ? stem(i.getAttribute("src") || i.src) : null;
    }
    function dest(n) { return ((n[M.opciones || "opciones"] || []).map(function (o) { return o[M.destino || "siguiente"]; })).filter(function (d) { return d && nodes[d]; }); }
    var toast = null;
    function say(txt, big) {
      if (toast) toast.remove();
      toast = mk("fx-toast" + (big ? " big" : "")); toast.textContent = txt; root.appendChild(toast);
      var a = animate(toast, [{ opacity: 0, transform: "translate(-50%,16px)" }, { opacity: 1, transform: "translate(-50%,0)", offset: .12 }, { opacity: 1, transform: "translate(-50%,0)", offset: .8 }, { opacity: 0, transform: "translate(-50%,-8px)" }], { duration: big ? 3400 : 2200, fill: "forwards" });
      var t = toast; all([a]).then(function () { t.remove(); });
    }
    function track() {
      if (!nodes) return;
      capturaBase(); var id = cur(); if (!id || !nodes[id] || id === prev) return;
      var nuevo = !vis[id]; vis[id] = 1;
      if (prev && nodes[prev]) edg[prev + ">" + id] = 1;
      prev = id; save(); if (!enabled()) return;
      var n = Object.keys(vis).length;
      if (finales.indexOf(id) > -1 && nuevo) { sfx("final"); say("✦ FINAL ALCANZADO · " + n + "/" + ids.length + " escenas", true); }
      else if (nuevo) { sfx("nuevo"); say("◈ ESCENA DESCUBIERTA · " + n + "/" + ids.length); }
    }
    fetch(M.fuente).then(function (r) { return r.json(); }).then(function (j) {
      nodes = M.raiz ? j[M.raiz] : j; ids = Object.keys(nodes);
      var start = M.inicio && nodes[M.inicio] ? M.inicio : ids[0];
      finales = ids.filter(function (i) { return dest(nodes[i]).filter(function (d) { return d !== start; }).length === 0; });
      M._start = start; track();
      H.img.push(function () { setTimeout(track, 80); }); H.ready.push(function () { track(); });
      setInterval(track, 1200);
    }).catch(function () { /* sin historia: el mapa no se muestra */ });

    var btn = slotBtn("◈ MAPA", "Mapa 3D de la historia", 2), ov = null, three = null;
    function build() {
      ov = mk("fx-mapa"); ov.setAttribute("data-fx", "off"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Mapa de la historia");
      ov.innerHTML = '<canvas></canvas><div class="p"><b>◈ MAPA DE LA HISTORIA</b><span class="n"></span><div class="bar"><i></i></div><small>Arrastrá para girar · pellizco o rueda para acercarte a un lugar · tocá un punto o usá ‹ › para recorrer · Esc cierra</small><div class="bt"><button type="button" class="x">✕ Cerrar</button></div></div>' +
        '<div class="zm"><button type="button" class="zi" aria-label="Acercar">＋</button><button type="button" class="zo" aria-label="Alejar">−</button></div>' +
        '<div class="pl" aria-live="polite"><div class="im"><img alt=""><span class="lk">SIN EXPLORAR</span></div><div class="tx"><small class="k"></small><b class="t"></b></div>' +
        '<div class="nv"><button type="button" class="pv" aria-label="Lugar anterior">‹</button><button type="button" class="dl">⬇ Tarjeta de este lugar</button><button type="button" class="nx" aria-label="Lugar siguiente">›</button></div></div>';
      D.body.appendChild(ov);
      ov.querySelector(".x").addEventListener("click", close);
      ov.querySelector(".dl").addEventListener("click", function () { if (sel) tarjeta(sel); });
      ov.querySelector(".im").addEventListener("click", function () { ov.querySelector(".pl").classList.toggle("big"); });
      ov.querySelector(".pv").addEventListener("click", function () { recorrer(-1); });
      ov.querySelector(".nx").addEventListener("click", function () { recorrer(1); });
      ov.querySelector(".zi").addEventListener("click", function () { if (M3) M3.zoom(.7); });
      ov.querySelector(".zo").addEventListener("click", function () { if (M3) M3.zoom(1.4); });
      D.addEventListener("keydown", function (e) {
        if (!ov.classList.contains("on")) return;
        if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") recorrer(-1); else if (e.key === "ArrowRight") recorrer(1);
      });
    }
    /* ---- lugares: imagen de cada escena, recorrido y tarjeta propia ---- */
    var sel = null, M3 = null, base = null, imgs = {};
    function todos() { return M.lugares !== "descubiertos"; }
    function visible(i) { return todos() || !!vis[i]; }
    function nombre(i) { var t = String(nodes[i][M.titulo || "titulo"] || i); return t; }
    function tituloDe(i) { var t = nombre(i); return ids.filter(function (j) { return nombre(j) === t; }).length > 1 ? t + " · " + i : t; }
    function capturaBase() {
      var i = mainImg(); if (!i) return;
      var m = String(i.currentSrc || i.src || "").match(/^(.*\/)([^\/?#]+?)(\.[A-Za-z0-9]+)(?:[?#].*)?$/); if (m) base = { d: m[1], e: m[3] };
    }
    function imgDe(id) {
      if (typeof M.imagenFn === "function") { try { return M.imagenFn(id); } catch (e) { return null; } }
      if (M.imagen) return String(M.imagen).replace("{id}", id);
      return base ? base.d + id + base.e : null;
    }
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function selecciona(id, volar) {
      if (!nodes || !nodes[id] || !ov) return;
      sel = id; var pl = ov.querySelector(".pl"), im = pl.querySelector("img"), ok = visible(id), u = imgDe(id);
      pl.classList.add("on"); pl.classList.toggle("lock", !ok);
      pl.querySelector(".t").textContent = ok ? tituloDe(id) : "• • •";
      pl.querySelector(".k").textContent = "LUGAR " + pad(ids.indexOf(id) + 1) + " / " + pad(ids.length) + (vis[id] ? " · EXPLORADO" : " · SIN EXPLORAR");
      if (u && ok) { if (im.getAttribute("src") !== u) im.setAttribute("src", u); im.style.visibility = "visible"; } else { im.removeAttribute("src"); im.style.visibility = "hidden"; }
      pl.querySelector(".dl").disabled = !ok;
      if (M3) { M3.mark(id); if (volar) M3.fly(id); }
    }
    function recorrer(d) {
      if (!ids.length) return; var i = ids.indexOf(sel); i = (i + d + ids.length * 2) % ids.length;
      sfx("whoosh"); selecciona(ids[i], true);
    }
    function stats() {
      var n = Object.keys(vis).length, t = ids.length;
      ov.querySelector(".n").textContent = n + " / " + t + " escenas descubiertas · " + (finales.some(function (f) { return vis[f]; }) ? "final alcanzado ✦" : "final por descubrir");
      ov.querySelector(".bar i").style.width = (t ? n / t * 100 : 0) + "%";
    }
    function open() {
      if (!nodes) { say("◈ El mapa se está cargando…"); return; }
      if (!ov) build();
      capturaBase(); stats(); ov.classList.add("on"); sfx("whoosh");
      selecciona(sel || (nodes[cur()] ? cur() : M._start), false);
      loadThree(function () { if (ov.classList.contains("on")) scene3d(); });
    }
    function close() { ov.classList.remove("on"); if (three) three.stop(); M3 = null; }
    btn.addEventListener("click", function () { if (ov && ov.classList.contains("on")) close(); else open(); });

    function label(T, text, vis_) {
      var c = mk("", "canvas"); c.width = 512; c.height = 64; var x = c.getContext("2d");
      var fs = 28; x.font = "700 " + fs + "px system-ui,sans-serif";
      while (x.measureText(text).width > 480 && fs > 14) { fs -= 2; x.font = "700 " + fs + "px system-ui,sans-serif"; }
      x.textAlign = "center"; x.textBaseline = "middle";
      x.shadowColor = vis_ ? "rgba(0,215,255,.9)" : "transparent"; x.shadowBlur = 10;
      x.fillStyle = vis_ ? "#fff" : (text === "• • •" ? "rgba(150,165,200,.55)" : "rgba(185,200,235,.82)"); x.fillText(text, 256, 34);
      var tx = new T.CanvasTexture(c), s = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false }));
      s.scale.set(6.4, .8, 1); return s;
    }
    function scene3d() {
      var T = W.THREE; if (!T) return;
      if (three) three.stop();
      var cv = ov.querySelector("canvas"), rend = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      rend.setPixelRatio(Math.min(W.devicePixelRatio || 1, 1.5));
      var sc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, .1, 400), grp = new T.Group(); sc.add(grp);
      var start = M._start, lvl = {}, order = [start], qd = [start]; lvl[start] = 0;
      while (qd.length) { var a = qd.shift(); dest(nodes[a]).forEach(function (d) { if (lvl[d] == null) { lvl[d] = lvl[a] + 1; order.push(d); qd.push(d); } }); }
      ids.forEach(function (i) { if (lvl[i] == null) { lvl[i] = 0; order.push(i); } });
      var by = {}, K = 0; order.forEach(function (i) { (by[lvl[i]] = by[lvl[i]] || []).push(i); K = Math.max(K, lvl[i]); });
      var P3 = {}; Object.keys(by).forEach(function (k) { var l = by[k]; l.forEach(function (i, n) { P3[i] = new T.Vector3((n - (l.length - 1) / 2) * 3.4, Math.sin(k * 1.3 + n) * 1.2, -(k - K / 2) * 3.8); }); });
      var colS = new T.Color("rgb(" + rgb() + ")"), colD = new T.Color(0x2b3a66), gold = new T.Color(0xffcf5a), now = cur(), halos = [], pk = [];
      var ev = [], ed = [];
      ids.forEach(function (i) { dest(nodes[i]).forEach(function (d) { var on_ = edg[i + ">" + d]; (on_ ? ev : ed).push(P3[i], P3[d]); if (on_) pk.push([P3[i], P3[d], Math.random()]); }); });
      function lines(list, color, op) { var g = new T.BufferGeometry().setFromPoints(list); return new T.LineSegments(g, new T.LineBasicMaterial({ color: color, transparent: true, opacity: op })); }
      if (ed.length) grp.add(lines(ed, 0x3a4a7a, .28)); if (ev.length) grp.add(lines(ev, colS, .95));
      ids.forEach(function (i) {
        var isF = finales.indexOf(i) > -1, v = !!vis[i], geo = isF ? new T.OctahedronGeometry(.5) : new T.SphereGeometry(.32, 20, 16);
        var m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: v ? (isF ? gold : colS) : (isF ? 0x6b5a2a : colD), transparent: !v, opacity: v ? 1 : .6 }));
        m.position.copy(P3[i]); grp.add(m);
        var lb = label(T, visible(i) ? tituloDe(i).slice(0, 26) : "• • •", v); lb.position.copy(P3[i]).add(new T.Vector3(0, .85, 0)); grp.add(lb);
        if (i === now) {
          var hc = mk("", "canvas"); hc.width = hc.height = 128; var hx = hc.getContext("2d"), gr = hx.createRadialGradient(64, 64, 4, 64, 64, 62);
          gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.3, "rgba(" + rgb() + ",.55)"); gr.addColorStop(1, "rgba(" + rgb() + ",0)"); hx.fillStyle = gr; hx.fillRect(0, 0, 128, 128);
          var h = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(hc), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); h.scale.set(2.8, 2.8, 1); h.position.copy(P3[i]); grp.add(h); halos.push(h);
        }
      });
      var pg = new T.BufferGeometry(), pa = new Float32Array(pk.length * 3); pg.setAttribute("position", new T.BufferAttribute(pa, 3));
      var pts = new T.Points(pg, new T.PointsMaterial({ color: 0xffffff, size: .22, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; grp.add(pts);
      var sp = [], s; for (s = 0; s < 360; s++) { var v3 = new T.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(30, 70)); sp.push(v3.x, v3.y, v3.z); }
      var sg = new T.BufferGeometry(); sg.setAttribute("position", new T.Float32BufferAttribute(sp, 3)); sc.add(new T.Points(sg, new T.PointsMaterial({ color: 0x9fb4ff, size: .18, transparent: true, opacity: .6 })));
      var th = .7, ph = 1.15, rad = 24 + K * 1.2, drag = false, lx = 0, ly = 0, auto = true, raf = 0, autoT = 0;
      var tg = new T.Vector3(), tgT = new T.Vector3(), radT = rad, flyUntil = 0, near = false, manual = false, last = 0, ptr = {}, np = 0, pd = 0, mv0 = 0, fr = 0;
      function mkHalo(c) {
        var hc = mk("", "canvas"); hc.width = hc.height = 128; var hx = hc.getContext("2d"), gr = hx.createRadialGradient(64, 64, 4, 64, 64, 62);
        gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.3, "rgba(" + c + ",.55)"); gr.addColorStop(1, "rgba(" + c + ",0)"); hx.fillStyle = gr; hx.fillRect(0, 0, 128, 128);
        var h = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(hc), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); h.scale.set(2.2, 2.2, 1); return h;
      }
      var selH = mkHalo("255,207,90"); selH.visible = false; grp.add(selH);
      function size() { var r = cv.getBoundingClientRect(); rend.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix(); }
      size(); var rs = function () { size(); }; W.addEventListener("resize", rs);
      function pause() { auto = false; clearTimeout(autoT); autoT = setTimeout(function () { auto = true; }, 3500); }
      function zoom(f) { rad = radT = clamp(rad * f, 4.5, 70); flyUntil = 0; manual = true; pause(); }
      function nearestScreen(px, py, maxPx) {          // el lugar cuyo punto está más cerca (en pantalla) de (px,py)
        var r = cv.getBoundingClientRect(), best = null, bd = maxPx;
        ids.forEach(function (i) {
          var v = P3[i].clone().project(cam); if (v.z > 1) return;
          var d = Math.hypot((v.x * .5 + .5) * r.width - px, (-v.y * .5 + .5) * r.height - py); if (d < bd) { bd = d; best = i; }
        });
        return best;
      }
      function pts2() { return Object.keys(ptr).map(function (k) { return ptr[k]; }); }
      var dn = function (e) {
        ptr[e.pointerId] = [e.clientX, e.clientY]; np = Object.keys(ptr).length; pause();
        if (np === 1) { drag = true; lx = e.clientX; ly = e.clientY; mv0 = 0; }
        else if (np === 2) { var a2 = pts2(); pd = Math.hypot(a2[0][0] - a2[1][0], a2[0][1] - a2[1][1]); mv0 = 99; }
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* nada */ }
      };
      var mv = function (e) {
        if (!ptr[e.pointerId]) return; ptr[e.pointerId] = [e.clientX, e.clientY];
        if (np >= 2) { var a2 = pts2(), d = Math.hypot(a2[0][0] - a2[1][0], a2[0][1] - a2[1][1]); if (pd && d) zoom(pd / d); pd = d; return; }
        if (!drag) return; mv0 += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly); if (mv0 > 8) manual = true;
        th -= (e.clientX - lx) * .008; ph = clamp(ph - (e.clientY - ly) * .008, .25, 2.4); lx = e.clientX; ly = e.clientY;
      };
      var up = function (e) {
        var tap = np === 1 && mv0 < 8 && e.type === "pointerup"; delete ptr[e.pointerId]; np = Object.keys(ptr).length; pause();
        if (np === 1) { var r1 = pts2()[0]; drag = true; lx = r1[0]; ly = r1[1]; mv0 = 99; } else drag = false;
        if (tap) { var r = cv.getBoundingClientRect(), id = nearestScreen(e.clientX - r.left, e.clientY - r.top, 36); if (id) { sfx("click"); selecciona(id, true); } }
      };
      var wh = function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); };
      cv.addEventListener("pointerdown", dn); cv.addEventListener("pointermove", mv); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("wheel", wh, { passive: false });
      var stopped = false;
      M3 = {
        zoom: zoom,
        mark: function (id) { selH.visible = true; selH.position.copy(P3[id]); },
        fly: function (id) { tgT.copy(P3[id]); radT = 9; flyUntil = performance.now() + 1600; near = true; manual = false; pause(); }
      };
      if (sel && P3[sel]) M3.mark(sel);
      (function loop(t) {
        if (stopped) return; raf = requestAnimationFrame(loop);
        if (auto) th += .0016;
        var flying = t < flyUntil;
        if (flying) rad += (radT - rad) * (1 - Math.exp(-Math.min(.1, Math.max(0, (t - last) / 1000)) * 5));
        else if (manual && ++fr % 6 === 0) {                  // cerca de un lugar → se centra y aparece su imagen; lejos → vista general
          if (rad < 15) near = true; else if (rad > 21) near = false;
          if (near) { var nid = nearestScreen(cv.clientWidth / 2, cv.clientHeight / 2, Math.max(70, Math.min(cv.clientWidth, cv.clientHeight) * .4)); if (nid) { tgT.copy(P3[nid]); if (nid !== sel) selecciona(nid, false); } }
          else tgT.set(0, 0, 0);
        }
        var dt = Math.min(.1, Math.max(0, (t - last) / 1000)); last = t; tg.lerp(tgT, 1 - Math.exp(-dt * 6));
        cam.position.set(tg.x + rad * Math.sin(ph) * Math.sin(th), tg.y + rad * Math.cos(ph), tg.z + rad * Math.sin(ph) * Math.cos(th)); cam.lookAt(tg);
        halos.forEach(function (h) { var k = 2.6 + Math.sin(t / 300) * .5; h.scale.set(k, k, 1); });
        var ks = 2.2 + Math.sin(t / 240) * .35; selH.scale.set(ks, ks, 1);
        pk.forEach(function (p, i) { var q = (t / 1800 + p[2]) % 1; pa[i * 3] = p[0].x + (p[1].x - p[0].x) * q; pa[i * 3 + 1] = p[0].y + (p[1].y - p[0].y) * q; pa[i * 3 + 2] = p[0].z + (p[1].z - p[0].z) * q; });
        pg.attributes.position.needsUpdate = true;
        rend.render(sc, cam);
      })(0);
      three = {
        stop: function () {
          stopped = true; cancelAnimationFrame(raf); clearTimeout(autoT); W.removeEventListener("resize", rs);
          cv.removeEventListener("pointerdown", dn); cv.removeEventListener("pointermove", mv); cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", up); cv.removeEventListener("wheel", wh);
          rend.dispose(); three = null; M3 = null;
        }
      };
    }
    function tarjeta(id) {                         // una tarjeta PNG por lugar (1200×630)
      if (!nodes || !nodes[id]) return;
      var u = imgDe(id), im = new Image(), done = false;
      function dibuja() {
        if (done) return; done = true;
        var c = mk("", "canvas"); c.width = 1200; c.height = 630; var x = c.getContext("2d"), col = "rgb(" + rgb() + ")";
        var g = x.createLinearGradient(0, 0, 1200, 630); g.addColorStop(0, cfg.fondo || "#050813"); g.addColorStop(1, cfg.colores.b); x.fillStyle = g; x.fillRect(0, 0, 1200, 630);
        try { if (im.naturalWidth) { var k = Math.max(1200 / im.naturalWidth, 630 / im.naturalHeight); x.drawImage(im, (1200 - im.naturalWidth * k) / 2, (630 - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k); } } catch (e) { /* imagen no legible: queda el degradado */ }
        var o = x.createLinearGradient(0, 120, 0, 630); o.addColorStop(0, "rgba(5,8,19,0)"); o.addColorStop(1, "rgba(5,8,19,.94)"); x.fillStyle = o; x.fillRect(0, 0, 1200, 630);
        var o2 = x.createLinearGradient(0, 0, 0, 130); o2.addColorStop(0, "rgba(5,8,19,.8)"); o2.addColorStop(1, "rgba(5,8,19,0)"); x.fillStyle = o2; x.fillRect(0, 0, 1200, 130);
        x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(18, 18, 1164, 594);
        var n = Object.keys(vis).length, t = tituloDe(id), idx = ids.indexOf(id) + 1, game = String(M.nombre || (D.title.split(/[·|–—]/)[0] || "")).trim().toUpperCase();
        x.fillStyle = col; x.font = "700 26px ui-monospace,Consolas,monospace"; x.fillText("◈ TARJETA DE LUGAR · " + game, 52, 70);
        x.textAlign = "right"; x.fillText("LUGAR " + pad(idx) + " / " + pad(ids.length), 1148, 70); x.textAlign = "left";
        var fs = 68; x.font = "800 " + fs + "px system-ui,sans-serif"; while (x.measureText(t).width > 1090 && fs > 30) { fs -= 4; x.font = "800 " + fs + "px system-ui,sans-serif"; }
        x.fillStyle = "#fff"; x.fillText(t, 52, 540);
        x.fillStyle = "rgba(220,230,255,.85)"; x.font = "600 28px system-ui,sans-serif";
        x.fillText((vis[id] ? "✦ Lugar explorado" : "◇ Lugar sin explorar") + " · " + n + " / " + ids.length + " explorados" + (finales.indexOf(id) > -1 ? " · FINAL" : ""), 52, 586);
        try {
          c.toBlob(function (bl) {
            if (!bl) return; var a = mk("", "a"); a.href = URL.createObjectURL(bl);
            a.download = "tarjeta-" + pad(idx) + "-" + t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
            a.setAttribute("data-fx", "off"); D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
            sfx("nuevo"); say("⬇ Tarjeta guardada · " + t);
          }, "image/png");
        } catch (e) { say("◈ No se pudo generar la tarjeta (la imagen no permite lectura)"); }
      }
      im.onload = dibuja; im.onerror = dibuja; setTimeout(dibuja, 4000);
      if (u) im.src = u; else dibuja();
    }
    FX.mapa = { abrir: open, lugar: function (id) { if (!ov) { if (!nodes) return; build(); } selecciona(id, true); }, tarjeta: tarjeta, cerrar: function () { if (ov) close(); }, vistas: function () { return Object.keys(vis); }, reiniciar: function () { vis = {}; edg = {}; save(); } };
  }

  /* ============================================================ PANTALLA COMPLETA (⛶) */
  function pantallaInit() {
    var PC = P.pantallaCompleta; if (PC === false) return;
    PC = PC || {};
    var el = D.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!req) return;                                   // iPhone/iPad (Safari): no existe la API; no se muestra un botón que no hace nada
    if (D.getElementById("full") || D.querySelector("[data-fx-pantalla]")) return;   // el proyecto ya trae el suyo
    var M = P.mapa, conMapa = !!(M && full && (!M.paginas || M.paginas.indexOf(page) > -1));
    var b = slotBtn("⛶", "Pantalla completa", conMapa ? 3 : 2); b.classList.add("fx-fs");
    var isFs = function () { return !!(D.fullscreenElement || D.webkitFullscreenElement); };
    var juego = !!D.querySelector("canvas") && !D.querySelector("canvas[data-fx]");
    function paint() { var on = isFs(); b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = on ? "⛶ SALIR" : "⛶"; b.title = on ? "Salir de pantalla completa (Esc)" : "Pantalla completa"; }
    b.addEventListener("click", function () {
      try {
        if (isFs()) { (D.exitFullscreen || D.webkitExitFullscreen).call(D); try { screen.orientation.unlock(); } catch (e) { /* nada */ } return; }
        var p = req.call(el); if (p && p.catch) p.catch(function () { /* el navegador lo rechazó */ });
        if (PC.orientar !== false && juego && screen.orientation && screen.orientation.lock && (matchMedia("(pointer:coarse)").matches)) {
          setTimeout(function () { screen.orientation.lock("landscape").catch(function () { /* no soportado */ }); }, 150);
        }
      } catch (e) { /* nada */ }
    });
    D.addEventListener("fullscreenchange", paint); D.addEventListener("webkitfullscreenchange", paint);
    paint(); FX.pantalla = { alternar: function () { b.click(); } };
  }

  /* ============================================================ arranque de módulos */
  function start() {
    try { hudInit(); } catch (e) { /* un módulo roto no frena a los demás */ }
    try { sparkInit(); } catch (e) { /* nada */ }
    try { tituloInit(); } catch (e) { /* nada */ }
    try { vozInit(); } catch (e) { /* nada */ }
    try { depthInit(); } catch (e) { /* nada */ }
    try { ciudadInit(); } catch (e) { /* nada */ }
    try { pantallaInit(); } catch (e) { /* nada */ }
    try { mapaInit(); } catch (e) { /* nada */ }
  }
  FX.pro = { version: "1.0", modulos: P };
  if (D.readyState === "complete") start(); else W.addEventListener("load", start);
})();
