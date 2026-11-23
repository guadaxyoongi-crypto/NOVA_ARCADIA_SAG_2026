/*! transiciones-visuales · fx.js  (sin dependencias)
 *
 * CAPA DECORATIVA. Reglas que cumple este archivo:
 *  - No reemplaza, envuelve ni mueve ningún nodo de tu página.
 *  - No toca src, href, onclick, ids ni clases existentes. Solo OBSERVA y dibuja encima.
 *  - Todo lo que dibuja está en #fx-root (pointer-events:none): nunca bloquea un clic.
 *  - Las animaciones usan la Web Animations API sin "fill" persistente: al terminar, tu CSS vuelve a mandar.
 *  - Respeta prefers-reduced-motion y se puede apagar con el botón ✦ FX.
 *
 * Configuración: window.FX_CONFIG (fx.config.js). Atributos opcionales en tu HTML:
 *   data-fx="off"            -> esa imagen/zona no recibe efectos
 *   data-fx-efecto="glitch"  -> fuerza el efecto de transición de esa imagen
 *   data-fx-tilt             -> inclinación 3D al mover el mouse
 *   data-fx-glitch           -> el texto hace un glitch cada tanto
 *   data-fx-aparece          -> el elemento aparece con efecto cuando se agrega
 */
(function () {
  "use strict";
  if (window.__FX) return;
  var D = document, W = window;

  /* ================= configuración ================= */
  var PRESETS = {
    futurista: { efectos: ["portal", "glitch", "scan", "warp", "pixel", "hologram", "columnas"], duracion: 900, ambiente: true, escaneo: true, vineta: true, arranque: true },
    cine:      { efectos: ["portal", "warp", "scan"], duracion: 1300, ambiente: true, escaneo: false, vineta: true, arranque: true },
    suave:     { efectos: ["warp", "columnas"], duracion: 800, ambiente: false, escaneo: false, vineta: false, arranque: false, tilt: false },
    retro:     { efectos: ["pixel", "scan", "glitch"], duracion: 800, ambiente: false, escaneo: true, vineta: true, arranque: true }
  };
  var DEF = {
    preset: "futurista", perfil: "auto",
    colores: { a: "#00d7ff", b: "#7038eb", c: "#e9a4fa" }, fondo: "#050813",
    salida: true, botones: true, tilt: true, texto: true, kenburns: true, colorEscena: true, toggle: true,
    perfiles: {}, ignorar: ""
  };
  var user = W.FX_CONFIG || {};
  var cfg = {}, k;
  for (k in DEF) cfg[k] = DEF[k];
  var pre = PRESETS[user.preset || DEF.preset] || PRESETS.futurista;
  for (k in pre) cfg[k] = pre[k];
  for (k in user) cfg[k] = user[k];
  cfg.colores = Object.assign({}, DEF.colores, user.colores || {});

  var page = (location.pathname.split("/").pop() || "index.html");
  var perfil = (cfg.perfiles && cfg.perfiles[page]) || cfg.perfil;
  if (perfil === "auto") perfil = D.querySelector("canvas") ? "ligero" : "completo";
  var RM = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (RM && perfil !== "off") perfil = "minimo";
  if (perfil === "off") return;

  var CAP = {
    completo: { trans: 1, texto: 1, stagger: 1, tilt: 1, kb: 1, amb: 1, btn: 1, pag: 1 },
    ligero:   { trans: 1, btn: 1, pag: 1 },
    minimo:   {}
  }[perfil] || {};

  var H = { img: [], ready: [], pick: null, sfx: null, decode: null };   // ganchos para fx-pro.js
  var enabled = true;
  try { enabled = localStorage.getItem("fx-off") !== "1"; } catch (e) { /* sin almacenamiento */ }
  var on = function (cap) { return enabled && CAP[cap] && true; };

  /* ================= utilidades ================= */
  var E = "cubic-bezier(.6,.05,.3,1)";
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var mk = function (cls, tag) { var e = D.createElement(tag || "div"); if (cls) e.className = cls; return e; };
  var abs = function (u) { try { return new URL(u, D.baseURI).href; } catch (e) { return String(u); } };
  var hex2rgb = function (h) {
    h = String(h).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  var state = { rgb: hex2rgb(cfg.colores.a), last: "" };
  var root;                                   // #fx-root
  var inFx = function (n) {
    var e = n && (n.nodeType === 1 ? n : n.parentElement);
    return !!(e && e.closest && (e.closest("#fx-root") || e.closest(".fx-toggle") || e.closest('[data-fx="off"]') ||
      (cfg.ignorar && e.closest(cfg.ignorar))));
  };
  var visible = function (e) {
    if (!e || !e.isConnected || e.hidden) return false;
    var r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
  };
  var animate = function (e, kf, opt) { try { return e.animate(kf, opt); } catch (x) { return null; } };
  var all = function (list) {
    return Promise.all(list.filter(Boolean).map(function (a) { return a.finished ? a.finished.catch(function () {}) : Promise.resolve(); }));
  };

  /* ================= color de la escena ================= */
  function setScene(rgb) {
    state.rgb = rgb;
    D.documentElement.style.setProperty("--fx-scene", "rgb(" + rgb.join(",") + ")");
  }
  function sceneColor(img) {
    if (!cfg.colorEscena) return;
    try {
      var c = mk("", "canvas"); c.width = c.height = 24;
      var x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0, 24, 24);
      var d = x.getImageData(0, 0, 24, 24).data, r = 0, g = 0, b = 0, w = 0;
      for (var i = 0; i < d.length; i += 4) {
        var R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        var s = mx ? (mx - mn) / mx : 0, kk = s * s * (mx > 70 ? 1 : .15);
        r += R * kk; g += G * kk; b += B * kk; w += kk;
      }
      if (w < .6) return;
      r /= w; g /= w; b /= w;
      var m = Math.max(r, g, b) || 1, f = 225 / m;         // se lleva a un neón bien visible
      setScene([Math.min(255, Math.round(r * f)), Math.min(255, Math.round(g * f)), Math.min(255, Math.round(b * f))]);
    } catch (e) { /* imagen de otro origen o file://: se queda el color base */ }
  }

  /* ================= escenario de una transición =================
     stage = ventana que recorta EXACTAMENTE lo que se ve de la imagen (respeta overflow y esquinas redondeadas
     de sus contenedores); box = el rectángulo real de la imagen (con su zoom/inclinación) dentro de esa ventana. */
  function clipInfo(el, r) {
    var cs = getComputedStyle(el);
    var rad = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
    var x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom, e = 1.5;
    for (var p = el.parentElement, i = 0; p && p !== D.body && p !== D.documentElement && i < 6; p = p.parentElement, i++) {
      var o = getComputedStyle(p);
      if (o.overflowX === "visible" && o.overflowY === "visible") continue;
      var pr = p.getBoundingClientRect();
      if (Math.abs(pr.left - x0) < e && Math.abs(pr.top - y0) < e) rad[0] = o.borderTopLeftRadius;
      if (Math.abs(pr.right - x1) < e && Math.abs(pr.top - y0) < e) rad[1] = o.borderTopRightRadius;
      if (Math.abs(pr.right - x1) < e && Math.abs(pr.bottom - y1) < e) rad[2] = o.borderBottomRightRadius;
      if (Math.abs(pr.left - x0) < e && Math.abs(pr.bottom - y1) < e) rad[3] = o.borderBottomLeftRadius;
      x0 = Math.max(x0, pr.left); y0 = Math.max(y0, pr.top); x1 = Math.min(x1, pr.right); y1 = Math.min(y1, pr.bottom);
    }
    return { l: x0, t: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0), rad: rad.join(" ") };
  }
  function placeStage(st, box, el) {
    var r = el.getBoundingClientRect(), c = clipInfo(el, r);
    st.style.left = c.l + "px"; st.style.top = c.t + "px"; st.style.width = c.w + "px"; st.style.height = c.h + "px";
    st.style.borderRadius = c.rad;
    st.style.display = (c.w <= 0 || c.h <= 0 || c.t >= innerHeight || c.l >= innerWidth || c.t + c.h <= 0 || c.l + c.w <= 0) ? "none" : "";
    if (box) { box.style.left = (r.left - c.l) + "px"; box.style.top = (r.top - c.t) + "px"; box.style.width = r.width + "px"; box.style.height = r.height + "px"; }
  }
  function follow(st, box, el) {             // la página puede estar haciendo scroll suave mientras dura el efecto
    var alive = true;
    (function loop() { if (!alive || !st.isConnected || !el.isConnected) return; placeStage(st, box, el); requestAnimationFrame(loop); })();
    return function () { alive = false; };
  }
  function newStage(img, oldSrc) {
    var cs = getComputedStyle(img), st = mk("fx-stage"), box = mk("fx-box");
    var g = new Image(); g.className = "fx-ghost"; g.alt = ""; g.decoding = "sync";
    g.style.objectFit = cs.objectFit; g.style.objectPosition = cs.objectPosition;
    g.src = oldSrc;
    box.appendChild(g); st.appendChild(box); root.appendChild(st);
    placeStage(st, box, img);
    var r = img.getBoundingClientRect();
    return { st: st, box: box, g: g, w: r.width, h: r.height };
  }

  /* ================= efectos de transición de imagen =================
     Cada uno recibe el fantasma (g) de la imagen ANTERIOR y lo hace desaparecer revelando la nueva.
     Devuelve la lista de animaciones; el escenario se limpia solo al terminar. */
  var EF = {
    portal: function (st, g, w, h, d) {
      var R = Math.hypot(w, h) / 2, ring = mk("fx-ring");
      ring.style.cssText = "left:" + (w / 2 - R) + "px;top:" + (h / 2 - R) + "px;width:" + 2 * R + "px;height:" + 2 * R + "px";
      st.appendChild(ring);
      return [
        animate(g, [{ clipPath: "circle(" + R + "px at 50% 50%)" }, { clipPath: "circle(0px at 50% 50%)" }], { duration: d, easing: E, fill: "forwards" }),
        animate(ring, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0)", opacity: .85 }], { duration: d, easing: E, fill: "forwards" })
      ];
    },
    glitch: function (st, g, w, h, d) {
      g.style.display = "none"; var out = [], n = 10, i;
      for (i = 0; i < n; i++) {
        var s = g.cloneNode(); s.style.display = "";
        s.style.clipPath = "inset(" + (i * 100 / n) + "% 0 " + (100 - (i + 1) * 100 / n) + "% 0)";
        st.appendChild(s);
        var dx = rnd(-70, 70);
        out.push(animate(s, [
          { transform: "translateX(0)", opacity: 1, filter: "none" },
          { transform: "translateX(" + dx + "px)", opacity: 1, filter: "hue-rotate(" + rnd(-120, 120) + "deg) saturate(2.4)", offset: .4 },
          { transform: "translateX(" + (-dx / 3) + "px)", opacity: .7, offset: .7 },
          { transform: "translateX(0)", opacity: 0 }
        ], { duration: d * .65, delay: rnd(0, .35) * d, easing: "steps(6,end)", fill: "both" }));
      }
      var f = mk("fx-flash"); st.appendChild(f);
      out.push(animate(f, [{ opacity: 0 }, { opacity: .35, offset: .15 }, { opacity: 0, offset: .3 }, { opacity: .22, offset: .5 }, { opacity: 0 }], { duration: d, fill: "forwards" }));
      return out;
    },
    scan: function (st, g, w, h, d) {
      var line = mk("fx-line"); st.appendChild(line);
      return [
        animate(g, [{ clipPath: "inset(0% 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], { duration: d, easing: E, fill: "forwards" }),
        animate(line, [{ transform: "translateY(0)" }, { transform: "translateY(" + h + "px)" }], { duration: d, easing: E, fill: "forwards" })
      ];
    },
    warp: function (st, g, w, h, d) {
      var rays = mk("fx-rays"); st.appendChild(rays);
      return [
        animate(g, [{ transform: "scale(1)", filter: "blur(0px) brightness(1)", opacity: 1 },
          { transform: "scale(1.9)", filter: "blur(16px) brightness(2.4)", opacity: 0 }], { duration: d, easing: "cubic-bezier(.5,0,.9,.4)", fill: "forwards" }),
        animate(rays, [{ opacity: 0, transform: "scale(.4)" }, { opacity: .9, offset: .35 }, { opacity: 0, transform: "scale(1.8)" }], { duration: d, easing: "ease-out", fill: "forwards" })
      ];
    },
    pixel: function (st, g, w, h, d) {
      g.style.opacity = 0;
      var c = mk("", "canvas"); c.width = Math.round(w); c.height = Math.round(h); c.style.cssText = "width:100%;height:100%";
      st.appendChild(c);
      var x = c.getContext("2d"), t = mk("", "canvas"), tx = t.getContext("2d"), steps = [1, 5, 10, 18, 32, 56], t0 = performance.now();
      var nw = g.naturalWidth || w, nh = g.naturalHeight || h, fit = getComputedStyle(g).objectFit;
      var s = fit === "contain" ? Math.min(w / nw, h / nh) : fit === "fill" ? 0 : Math.max(w / nw, h / nh);
      var dw = s ? nw * s : w, dh = s ? nh * s : h, dx = (w - dw) / 2, dy = (h - dh) / 2;
      var fin, p = new Promise(function (res) { fin = res; });
      (function frame(now) {
        var q = Math.max(0, Math.min(1, (now - t0) / d)), f = steps[Math.min(steps.length - 1, Math.floor(q * steps.length))];
        t.width = Math.max(2, Math.round(w / f)); t.height = Math.max(2, Math.round(h / f));
        tx.drawImage(g, dx / f, dy / f, dw / f, dh / f);
        x.clearRect(0, 0, w, h); x.imageSmoothingEnabled = false;
        x.globalAlpha = q < .7 ? 1 : 1 - (q - .7) / .3;
        x.drawImage(t, 0, 0, t.width, t.height, 0, 0, w, h);
        if (q < 1 && st.isConnected) requestAnimationFrame(frame); else fin();
      })(t0);
      return [{ finished: p }];
    },
    hologram: function (st, g, w, h, d) {
      var sc = mk("fx-holo"); st.appendChild(sc);
      return [
        animate(g, [
          { opacity: 1, filter: "hue-rotate(0deg) saturate(1)", transform: "translateX(0)" },
          { opacity: .25, filter: "hue-rotate(160deg) saturate(2) brightness(1.4)", transform: "translateX(-6px)", offset: .2 },
          { opacity: .9, filter: "hue-rotate(160deg) saturate(2) brightness(1.2)", transform: "translateX(5px)", offset: .35 },
          { opacity: .15, transform: "translateX(-3px)", offset: .55 },
          { opacity: .6, offset: .7 },
          { opacity: 0, transform: "translateX(0)" }
        ], { duration: d, easing: "linear", fill: "forwards" }),
        animate(sc, [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: d, fill: "forwards" })
      ];
    },
    columnas: function (st, g, w, h, d) {
      g.style.display = "none"; var n = Math.max(8, Math.min(22, Math.round(w / 60))), out = [], i;
      for (i = 0; i < n; i++) {
        var s = g.cloneNode(); s.style.display = "";
        s.style.clipPath = "inset(0 " + (100 - (i + 1) * 100 / n) + "% 0 " + (i * 100 / n) + "%)";
        st.appendChild(s);
        out.push(animate(s, [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(0)", opacity: 1, offset: .12 },
          { transform: "translateY(" + h * 1.05 + "px)", opacity: .9 }
        ], { duration: d * .7, delay: rnd(0, .3) * d, easing: "cubic-bezier(.6,0,.9,.5)", fill: "both" }));
      }
      return out;
    }
  };

  var running = new WeakMap(), rot = 0;
  function pickEffect(img) {
    var forced = img.getAttribute("data-fx-efecto");
    if (forced && EF[forced]) return forced;
    if (H.pick) { var q = H.pick(img); if (q && EF[q]) return q; }
    var list = (cfg.efectos || []).filter(function (n) { return EF[n]; });
    if (!list.length) list = Object.keys(EF);
    var n = list[rot++ % list.length];
    return n;
  }
  function whenReady(img) {
    return new Promise(function (res) {
      if (img.complete && img.naturalWidth) return res();
      var t = setTimeout(done, 1800);
      function done() { clearTimeout(t); img.removeEventListener("load", done); img.removeEventListener("error", done); res(); }
      img.addEventListener("load", done); img.addEventListener("error", done);
    });
  }
  function eligibleImg(img) {
    if (inFx(img) || !visible(img)) return false;
    var r = img.getBoundingClientRect();
    return r.width >= 160 && r.height >= 100;
  }
  function entrada(img, d) {                 // entrada de la imagen nueva (sin tocar su escala)
    animate(img, [{ filter: "brightness(1.7) saturate(1.5)", opacity: .55 }, { filter: "none", opacity: 1 }], { duration: d * .7, easing: "ease-out" });
  }
  function transition(img, oldSrc, forceName) {
    if (!on("trans")) return;
    var d = cfg.duracion, prev = running.get(img);
    if (prev) prev();
    if (!eligibleImg(img)) return;
    var r = img.getBoundingClientRect();
    if (!oldSrc || r.bottom < 0 || r.top > innerHeight) { whenReady(img).then(function () { sceneColor(img); H.ready.forEach(function (f) { f(img, null); }); entrada(img, d); }); return; }
    var name, S = newStage(img, oldSrc), stopFollow = follow(S.st, S.box, img), dead = false;
    var clean = function () { if (dead) return; dead = true; stopFollow(); S.st.remove(); running.delete(img); };
    running.set(img, clean);
    setTimeout(clean, d + 2600);             // seguro: jamás queda nada colgado
    whenReady(img).then(function () {
      if (dead) return;
      sceneColor(img);
      name = forceName || pickEffect(img);
      H.ready.forEach(function (f) { f(img, name); });
      if (H.sfx) H.sfx("trans:" + name);
      var w = S.box.offsetWidth || S.w, h = S.box.offsetHeight || S.h, a;
      try { a = EF[name](S.box, S.g, w, h, d); } catch (e) { a = []; }
      entrada(img, d);
      all(a).then(clean);
    });
  }

  /* ================= revelado de texto, apariciones y secciones ================= */
  var STAG = "button,a,li,[role=button],.card,.bubble,.choice,.opcion,[data-fx-aparece]";
  var addQ = [], addT = 0;
  function qAdded(n) { addQ.push(n); if (!addT) addT = requestAnimationFrame(flushAdded); }
  function flushAdded() {
    addT = 0;
    var seen = new Set(), list = [];
    addQ.splice(0).forEach(function (n) {
      if (!n.isConnected || inFx(n)) return;
      var cand = n.matches && n.matches(STAG) ? [n] : Array.prototype.slice.call(n.querySelectorAll ? n.querySelectorAll(STAG) : [], 0, 8);
      cand.forEach(function (c) { if (!seen.has(c)) { seen.add(c); list.push(c); } });
    });
    var i = 0;
    list.slice(0, 14).forEach(function (n) {
      if (!visible(n) || inFx(n)) return;
      animate(n, [{ opacity: 0, translate: "-22px 0", filter: "blur(5px)" }, { opacity: 1, translate: "0 0", filter: "blur(0px)" }],
        { duration: 480, delay: i * 85, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
      i++;
    });
  }
  function revealText(e) {
    var now = performance.now();
    if (e.__fxt && now - e.__fxt < 700) return;
    e.__fxt = now;
    var head = /^H[1-4]$/.test(e.tagName), len = (e.textContent || "").length;
    var dec = head && H.decode && H.decode(e);
    if (!dec) animate(e, [{ clipPath: "inset(0 0 100% 0)", opacity: .2 }, { clipPath: "inset(0 0 0% 0)", opacity: 1 }],
      { duration: head ? 520 : Math.min(1400, 500 + len * 3), easing: "cubic-bezier(.3,.7,.2,1)", fill: "backwards" });
    if (head) animate(e, [{ textShadow: "3px 0 var(--fx-a),-3px 0 var(--fx-c)" }, { textShadow: "-2px 0 var(--fx-a),2px 0 var(--fx-c)", offset: .3 }, { textShadow: "0 0 0 transparent" }],
      { duration: 520, easing: "steps(5,end)" });
  }
  function qText(e) {
    if (!e || inFx(e) || !visible(e) || e.getAttribute("aria-hidden") === "true") return;
    var head = /^H[1-4]$/.test(e.tagName), len = (e.textContent || "").length;
    if (e.children.length > 3 && !e.hasAttribute("data-fx-aparece")) return;
    if (head || len > 80 || e.hasAttribute("data-fx-aparece")) revealText(e);
  }
  function qShow(e) {                        // una sección pasa de oculta a visible
    requestAnimationFrame(function () {
      if (!visible(e) || inFx(e)) return;
      var r = e.getBoundingClientRect();
      if (r.width < 120 || r.height < 50) return;
      var d = cfg.duracion * .8;
      animate(e, [{ opacity: 0, clipPath: "inset(0 0 100% 0)" }, { opacity: 1, clipPath: "inset(0 0 0% 0)" }], { duration: d, easing: E, fill: "backwards" });
      if (H.sfx) H.sfx("show");
      var st = mk("fx-stage"), line = mk("fx-line"); st.appendChild(line); root.appendChild(st);
      placeStage(st, null, e); var stop = follow(st, null, e);
      var a = animate(line, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(" + Math.min(r.height, innerHeight) + "px)", opacity: 0 }], { duration: d, easing: E, fill: "forwards" });
      all([a]).then(function () { stop(); st.remove(); });
      setTimeout(function () { stop(); st.remove(); }, d + 1500);
    });
  }

  /* ================= observador de cambios ================= */
  function startObserver() {
    var textOn = !!CAP.texto || !!CAP.stagger;
    var mo = new MutationObserver(function (recs) {
      if (!enabled) return;
      recs.forEach(function (m) {
        var t = m.target;
        if (inFx(t)) return;
        if (m.type === "attributes") {
          if (m.attributeName === "src" && t.tagName === "IMG") {
            var old = m.oldValue;
            if (!old) transition(t, null);
            else if (abs(old) !== abs(t.getAttribute("src") || "")) transition(t, old);
            H.img.forEach(function (f) { f(t, old); });
          } else if (m.attributeName === "hidden" && !t.hidden && CAP.stagger) qShow(t);
        } else if (m.type === "childList" && textOn) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType === 1 && CAP.stagger) qAdded(n);
            else if (n.nodeType === 3 && CAP.texto) qText(t);
          });
        }
      });
    });
    var opts = { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["src", "hidden"] };
    if (textOn) opts.childList = true;
    mo.observe(D.documentElement, opts);
  }

  /* ================= botones: pulso, imán ================= */
  var BTN = "button,[role=button],a.primary,a.btn,.btn,.btnlink,a.card,input[type=submit]";
  var MAG = "button,[role=button],a.primary,a.btn,.btn,.btnlink,input[type=submit]";
  function pulse(x, y) {
    var p = mk("fx-pulse"), s = 18;
    p.style.cssText = "left:" + (x - s / 2) + "px;top:" + (y - s / 2) + "px;width:" + s + "px;height:" + s + "px";
    root.appendChild(p); if (H.sfx) H.sfx("click");
    var a = animate(p, [{ transform: "scale(.4)", opacity: .95 }, { transform: "scale(7)", opacity: 0 }], { duration: 560, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
    all([a]).then(function () { p.remove(); });
    setTimeout(function () { p.remove(); }, 1200);
  }
  function startButtons() {
    D.addEventListener("pointerdown", function (e) {
      if (!on("btn") || e.button > 0) return;
      var b = e.target.closest && e.target.closest(BTN);
      if (b && !b.disabled && !inFx(b)) pulse(e.clientX, e.clientY);
    }, { passive: true, capture: true });
    if (!W.matchMedia("(hover:hover)").matches || !CAP.btn || !cfg.botones) return;
    var cur = null;
    function release(b) {
      if (!b) return;
      var from = b.style.translate || "0px 0px";
      b.style.translate = "";
      animate(b, [{ translate: from }, { translate: "0px 0px" }], { duration: 280, easing: "ease-out" });
    }
    D.addEventListener("pointermove", function (e) {
      if (!enabled || e.pointerType === "touch") return;
      var b = e.target.closest && e.target.closest(MAG);
      if (b !== cur) { release(cur); cur = (b && !b.disabled && !inFx(b)) ? b : null; }
      if (!cur) return;
      var r = cur.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
      cur.style.translate = Math.max(-6, Math.min(6, dx * 10)).toFixed(1) + "px " + Math.max(-5, Math.min(5, dy * 12)).toFixed(1) + "px";
    }, { passive: true });
    D.addEventListener("pointerleave", function () { release(cur); cur = null; }, { passive: true });
  }

  /* ================= inclinación 3D (tarjetas e imágenes grandes sin recorte) ================= */
  function clippedAncestor(e) {
    for (var p = e.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) {
      var o = getComputedStyle(p).overflow;
      if (o === "hidden" || o === "clip") return true;
    }
    return false;
  }
  function tiltable(e) {
    if (e.__fxtilt) return;
    e.__fxtilt = true;
    var par = e.parentElement;
    if (par && par !== D.body && par !== D.documentElement && !par.style.perspective) par.style.perspective = "1100px";
    var raf = 0, ev = null;
    e.addEventListener("pointermove", function (x) {
      if (!on("tilt") || x.pointerType === "touch") return;
      ev = x; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = e.getBoundingClientRect(), nx = ((ev.clientX - r.left) / r.width - .5) * 2, ny = ((ev.clientY - r.top) / r.height - .5) * 2;
        var ang = Math.min(8, Math.hypot(nx, ny) * 6.5);
        e.style.rotate = (-ny).toFixed(3) + " " + nx.toFixed(3) + " 0 " + ang.toFixed(2) + "deg";
      });
    }, { passive: true });
    e.addEventListener("pointerleave", function () {
      var from = e.style.rotate; if (!from) return;
      e.style.rotate = "";
      animate(e, [{ rotate: from }, { rotate: "0 0 1 0deg" }], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
    }, { passive: true });
  }
  function scanDecor() {
    var n = 0;
    if (CAP.tilt && cfg.tilt) {
      Array.prototype.forEach.call(D.querySelectorAll("[data-fx-tilt],.card,a:has(>.art),article.card"), function (e) { if (!inFx(e) && n++ < 8) tiltable(e); });
      Array.prototype.forEach.call(D.querySelectorAll("img"), function (i) {
        if (n < 8 && eligibleImg(i) && !clippedAncestor(i) && !i.closest("a,button")) { n++; tiltable(i); }
      });
    }
    if (CAP.kb && cfg.kenburns) {
      var k = 0;
      Array.prototype.forEach.call(D.querySelectorAll("img"), function (i) {
        if (k >= 4 || i.__fxkb || !eligibleImg(i) || !clippedAncestor(i)) return;
        i.__fxkb = true; k++;
        animate(i, [{ scale: 1, translate: "0 0" }, { scale: 1.07, translate: "-1.2% -.8%" }], { duration: 22000, direction: "alternate", iterations: Infinity, easing: "ease-in-out" });
      });
    }
  }

  /* ================= ambiente: partículas, escaneo, viñeta ================= */
  function startAmbient() {
    if (cfg.ambiente === false || !CAP.amb) return;
    var c = mk("fx-ambient", "canvas"); root.appendChild(c);
    var x = c.getContext("2d"), Wd, Ht, dpr = Math.min(W.devicePixelRatio || 1, 1.5), ps = [], streak = null, last = 0;
    function spawn(any) { return { x: rnd(0, Wd), y: any ? rnd(0, Ht) : Ht + 10, r: rnd(.6, 2), v: rnd(.012, .04), dx: rnd(-.01, .01), a: rnd(.25, .7), ph: rnd(0, 6.28) }; }
    function size() {
      Wd = innerWidth; Ht = innerHeight; c.width = Wd * dpr; c.height = Ht * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(48, Math.round(Wd * Ht / 32000));
      while (ps.length < n) ps.push(spawn(true)); ps.length = Math.min(ps.length, n);
    }
    size(); W.addEventListener("resize", size, { passive: true });
    (function frame(t) {
      requestAnimationFrame(frame);
      if (!enabled || D.hidden) return;
      var dt = Math.min(50, t - last) || 16; last = t;
      x.clearRect(0, 0, Wd, Ht);
      var rgb = state.rgb.join(",");
      ps.forEach(function (p, i) {
        p.y -= p.v * dt; p.x += p.dx * dt;
        if (p.y < -10) ps[i] = spawn(false);
        var al = p.a * (.6 + .4 * Math.sin(t / 900 + p.ph));
        x.fillStyle = "rgba(" + rgb + "," + (al * .18) + ")"; x.beginPath(); x.arc(p.x, p.y, p.r * 4, 0, 6.283); x.fill();
        x.fillStyle = "rgba(" + rgb + "," + al + ")"; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
      });
      if (!streak && Math.random() < .003) streak = { y: rnd(.1, .9) * Ht, x: -260, v: rnd(.9, 1.7), len: rnd(140, 280) };
      if (streak) {
        streak.x += streak.v * dt;
        var g = x.createLinearGradient(streak.x - streak.len, 0, streak.x, 0);
        g.addColorStop(0, "rgba(" + rgb + ",0)"); g.addColorStop(1, "rgba(" + rgb + ",.55)");
        x.fillStyle = g; x.fillRect(streak.x - streak.len, streak.y, streak.len, 1.4);
        if (streak.x - streak.len > Wd) streak = null;
      }
    })(0);
  }

  /* ================= páginas: arranque, salida y llegada ================= */
  function curtain() {
    var wrap = mk("fx-bars"), n = 9, bars = [], i;
    for (i = 0; i < n; i++) {
      var b = mk("fx-bar" + (i % 2 ? " r" : "")); b.style.top = (i * 100 / n) + "%"; b.style.height = (100 / n + .6) + "%";
      wrap.appendChild(b); bars.push(b);
    }
    root.appendChild(wrap);
    return {
      wrap: wrap,
      set: function (covered) { bars.forEach(function (b, i) { b.style.transform = covered ? "translateX(0)" : "translateX(" + (i % 2 ? 101 : -101) + "%)"; }); },
      cover: function (d) { return all(bars.map(function (b, i) { return animate(b, [{ transform: "translateX(" + (i % 2 ? 101 : -101) + "%)" }, { transform: "translateX(0)" }], { duration: d, delay: i * 28, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards" }); })); },
      uncover: function (d) { return all(bars.map(function (b, i) { return animate(b, [{ transform: "translateX(0)" }, { transform: "translateX(" + (i % 2 ? -101 : 101) + "%)" }], { duration: d, delay: i * 28, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards" }); })).then(function () { wrap.remove(); }); }
    };
  }
  function startPages() {
    var de = D.documentElement, arriving = false;
    try { arriving = sessionStorage.getItem("fx-sal") === "1"; sessionStorage.removeItem("fx-sal"); } catch (e) { /* nada */ }
    if (arriving && CAP.pag && enabled) {
      var cu = curtain(); cu.set(true); de.classList.remove("fx-llegando");
      requestAnimationFrame(function () { cu.uncover(480); });
      setTimeout(function () { cu.wrap.remove(); }, 2500);
    } else {
      de.classList.remove("fx-llegando");
      var first = true;
      try { first = sessionStorage.getItem("fx-boot") !== "1"; sessionStorage.setItem("fx-boot", "1"); } catch (e) { /* nada */ }
      if (first && cfg.arranque && CAP.pag && enabled) bootScreen();
    }
    if (cfg.salida && CAP.pag) {
      D.addEventListener("click", function (e) {
        if (!on("pag") || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a || inFx(a) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
        var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
        if (!/^(https?|file):$/.test(u.protocol) || u.origin !== location.origin) return;
        if (u.pathname === location.pathname && u.search === location.search) return;     // ancla o misma página
        e.preventDefault();
        try { sessionStorage.setItem("fx-sal", "1"); } catch (x) { /* nada */ }
        var go = function () { location.href = u.href; }, cu = curtain();
        if (H.sfx) H.sfx("whoosh");
        cu.cover(380).then(go); setTimeout(go, 1300);                                      // seguro: siempre navega
      }, false);
    }
    W.addEventListener("pageshow", function (e) {                                          // volver con "atrás" (bfcache)
      if (e.persisted) { Array.prototype.forEach.call(root.querySelectorAll(".fx-bars,.fx-boot"), function (n) { n.remove(); }); de.classList.remove("fx-llegando"); }
    });
  }
  function bootScreen() {
    var t = (D.title || "").split(/[·|–—-]/)[0].trim() || "CARGANDO";
    var b = mk("fx-boot"), s = mk("", "span"), n = mk("", "b"), bar = mk("", "i");
    if (H.sfx) H.sfx("boot");
    s.textContent = "◈ INICIANDO"; n.textContent = t; b.append(s, n, bar); root.appendChild(b);
    var a = animate(b, [{ opacity: 1 }, { opacity: 1, offset: .72 }, { opacity: 0 }], { duration: 950, fill: "forwards" });
    all([a]).then(function () { b.remove(); });
    setTimeout(function () { b.remove(); }, 2200);
  }

  /* ================= botón ✦ FX ================= */
  function startToggle() {
    if (!cfg.toggle || perfil === "minimo") return;
    var b = mk("fx-toggle", "button"); b.type = "button"; b.setAttribute("data-fx", "off");
    function paint() { b.textContent = enabled ? "✦ FX" : "✧ FX"; b.setAttribute("aria-pressed", enabled ? "true" : "false"); b.title = enabled ? "Efectos visuales activados (tocá para apagarlos)" : "Efectos apagados (tocá para encenderlos)"; if (root) root.style.display = enabled ? "" : "none"; }
    b.addEventListener("click", function () {
      enabled = !enabled;
      try { localStorage.setItem("fx-off", enabled ? "0" : "1"); } catch (e) { /* nada */ }
      paint();
    });
    var pos = cfg.togglePos || "abajo-izq";            // abajo-izq | abajo-der | arriba-izq | arriba-der
    if (pos.indexOf("der") > -1) { b.style.left = "auto"; b.style.right = "12px"; }
    if (pos.indexOf("arriba") === 0) { b.style.bottom = "auto"; b.style.top = "12px"; }
    paint(); D.body.appendChild(b);
  }

  /* ================= arranque ================= */
  function init() {
    var de = D.documentElement, c = cfg.colores;
    de.style.setProperty("--fx-a", c.a); de.style.setProperty("--fx-b", c.b); de.style.setProperty("--fx-c", c.c);
    de.style.setProperty("--fx-scene", c.a); if (cfg.fondo) de.style.setProperty("--fx-bg", cfg.fondo);
    root = D.getElementById("fx-root") || mk(""); root.id = "fx-root"; root.setAttribute("aria-hidden", "true");
    D.body.appendChild(root);
    if (perfil === "completo") {
      if (cfg.escaneo) root.appendChild(mk("fx-scan"));
      if (cfg.vineta) root.appendChild(mk("fx-vig"));
    }
    startPages(); startObserver(); startButtons(); startAmbient(); startToggle();
    var first = function () { scanDecor(); var im = D.querySelector("img"); if (im && eligibleImg(im)) sceneColor(im); };
    if (D.readyState === "complete") first(); else W.addEventListener("load", first);
    setInterval(function () { if (enabled && !D.hidden) scanDecor(); }, 2500);   // imágenes que aparecen más tarde
  }

  W.__FX = W.FX = {
    version: "2.0", H: H,
    interno: function () { return { root: root, cfg: cfg, state: state, mk: mk, rnd: rnd, animate: animate, all: all, eligibleImg: eligibleImg, inFx: inFx, visible: visible, placeStage: placeStage, clipInfo: clipInfo, follow: follow, clippedAncestor: clippedAncestor, tiltable: tiltable, sceneColor: sceneColor, setScene: setScene, whenReady: whenReady, E: E, on: on, isOn: function () { return enabled; }, perfil: perfil }; }, perfil: perfil, efectos: Object.keys(EF),
    on: function () { enabled = true; try { localStorage.setItem("fx-off", "0"); } catch (e) { /* nada */ } if (root) root.style.display = ""; },
    off: function () { enabled = false; try { localStorage.setItem("fx-off", "1"); } catch (e) { /* nada */ } if (root) root.style.display = "none"; },
    /* FX.probar("glitch","#sceneImage"): reproduce un efecto sobre una imagen (útil para elegir el que más te guste) */
    probar: function (nombre, selector) {
      var img = D.querySelector(selector || "img"); if (!img) return false;
      transition(img, img.currentSrc || img.src, nombre); return true;
    }
  };

  if (D.body) init(); else D.addEventListener("DOMContentLoaded", init);
})();
