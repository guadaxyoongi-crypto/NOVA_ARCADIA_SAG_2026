/* ============================================================
   MOTOR DE CONVERSACIÓN DE VERA
   Usa la base de conocimientos de vera_base.js. No necesita internet
   ni claves. Si más adelante conectás Gemini (config.js), este motor
   queda como respaldo cuando no haya conexión.
   ============================================================ */
(function () {
  "use strict";
  var B = window.VERA_BASE;
  if (!B) { console.error("Falta vera_base.js"); return; }
  var C = B.conversacion;

  /* ---------- estado de la charla ---------- */
  var S, skipRep = false;
  function reset() {
    S = { used: {}, turns: 0, pending: null, lastNorm: "", visited: {}, hintIdx: {}, askedQ: {}, lastChips: [], shown: {} };
  }
  reset();

  /* ---------- utilidades ---------- */
  var cache = {};
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function pat(p) { return cache[p] || (cache[p] = norm(p) + (p.slice(-1) === "*" ? "*" : "")); }
  function has(n, tokens, raw) {
    var p = pat(raw);
    if (p.slice(-1) === "*") { var st = p.slice(0, -1).trim(); return tokens.some(function (t) { return t.indexOf(st) === 0; }); }
    return (" " + n + " ").indexOf(" " + p + " ") > -1;
  }
  function score(n, tokens, list) {
    var s = 0;
    list.forEach(function (raw) { if (has(n, tokens, raw)) s += Math.max(1, norm(raw).split(" ").length); });
    return s;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* elige una variante que no se haya usado recientemente */
  function pick(key, arr) {
    if (!arr || !arr.length) return "";
    var u = S.used[key] || (S.used[key] = []);
    var idx = [];
    for (var i = 0; i < arr.length; i++) if (u.indexOf(i) < 0) idx.push(i);
    if (!idx.length) {
      var last = u[u.length - 1]; u.length = 0;
      for (var j = 0; j < arr.length; j++) if (j !== last) idx.push(j);
      if (!idx.length) idx = [0];
    }
    var chosen = idx[rnd(idx.length)];
    u.push(chosen);
    return arr[chosen];
  }

  function baseId(id) { return ["I", "II", "III", "IV"].indexOf(id) > -1 ? "CONVERGE" : id; }
  function sc(ctx) { return B.escenas[baseId(ctx.id)] || { resumen: "", hint: "", preguntas: [], pistas: [] }; }
  function clean(label) { return String(label || "").replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡"]+/, "").replace(/\s*\([^)]*\)/g, "").trim(); }
  function opLabel(ctx, i) { return ctx.opciones && ctx.opciones[i] ? clean(ctx.opciones[i].texto) : ""; }
  function hasDecision(ctx) { var s = sc(ctx); return !s.sinDecision && ctx.opciones && ctx.opciones.length >= 2 && !!s.guia; }
  function fill(t, ctx, extra) {
    var o = extra || {};
    return String(t)
      .replace(/\{escena\}/g, ctx.titulo || "")
      .replace(/\{op1\}/g, opLabel(ctx, 0))
      .replace(/\{op2\}/g, opLabel(ctx, 1))
      .replace(/\{op\}/g, o.op || "")
      .replace(/\{porque\}/g, o.porque || "");
  }
  function visitedAny(list) { return (list || []).some(function (id) { return S.visited[id]; }); }
  function question(ctx) {
    var s = sc(ctx), arr = s.preguntas || [];
    if (!arr.length) return "";
    return pick("q:" + baseId(ctx.id), arr);
  }
  function join(a, b) { return b ? a + " " + b : a; }

  /* ---------- chips (respuestas sugeridas) ---------- */
  function chipsFor(ctx) {
    if (S.pending && S.pending.tipo === "guia") {
      var g = sc(ctx).guia; if (g && g.chips) return g.chips.slice();
    }
    if (S.pending && S.pending.tipo === "opcion") return ["Sí, me animo", "Comparemos con la otra"];
    var pool = C.chipsBase.slice();
    var nodec = !hasDecision(ctx);
    pool = pool.filter(function (c) { return !(nodec && (c === "¿Qué camino me conviene?" || c === "¿Qué opciones tengo?")); });
    if (nodec) pool.unshift("¿Qué significa esto?");
    if (S.turns === 0) pool.unshift("Hola Vera");
    var out = [];
    pool.forEach(function (c) { if (out.length < 4 && S.lastChips.indexOf(c) < 0) out.push(c); });
    if (out.length < 3) pool.forEach(function (c) { if (out.length < 4 && out.indexOf(c) < 0) out.push(c); });
    S.lastChips = out.slice();
    return out;
  }

  /* ---------- guía de decisión ---------- */
  function startGuia(ctx) {
    var s = sc(ctx);
    if (!hasDecision(ctx)) return { text: pick("sd", C.sinDecision) + " " + question(ctx) };
    S.pending = { tipo: "guia", scene: baseId(ctx.id), asks: 0 };
    return { text: s.guia.pregunta };
  }
  function recomendar(ctx, idx, delegado) {
    var g = sc(ctx).guia;
    var tpl = delegado ? C.fraseDelegar : C.fraseRecomendacion;
    var t = fill(pick(delegado ? "fd" : "fr", tpl), ctx, { op: opLabel(ctx, idx), porque: g.porque[idx] });
    S.pending = { tipo: "opcion", scene: baseId(ctx.id), idx: idx };
    return t + " " + pick("co", C.cierreOpcion);
  }
  var DELEGAR = ["decime vos", "decidi vos", "vos que harias", "que harias", "elegi vos", "elegi por mi", "no se", "ni idea", "no tengo idea",
    "cualquiera", "me da igual", "lo que digas", "lo que vos digas", "vos decidis", "sorprendeme", "no estoy seguro", "estoy indeciso", "indeciso",
    "recomenda", "recomendame", "que me recomendas", "no sabria", "ayudame"];
  function uniq(list) { var seen = {}, out = []; list.forEach(function (x) { var k = norm(x); if (!seen[k]) { seen[k] = 1; out.push(x); } }); return out; }
  function resolveGuia(n, tokens, ctx) {
    var s = sc(ctx), g = s.guia;
    if (!g) { S.pending = null; return null; }
    var a = score(n, tokens, uniq(g.claves[0].concat((s.opciones && s.opciones[0] && s.opciones[0].claves) || [])));
    var b = score(n, tokens, uniq(g.claves[1].concat((s.opciones && s.opciones[1] && s.opciones[1].claves) || [])));
    if (a > b) return recomendar(ctx, 0, false);
    if (b > a) return recomendar(ctx, 1, false);
    if (a > 0 && a === b) { S.pending.asks++; return pick("emp", C.empate); }
    if (score(n, tokens, DELEGAR) > 0) return recomendar(ctx, g.recomendada, true);
    return null;
  }
  function analizarOpcion(ctx, idx) {
    var s = sc(ctx), g = s.guia;
    var t = s.opciones[idx].analisis;
    S.pending = { tipo: "opcion", scene: baseId(ctx.id), idx: idx };
    return t + " " + pick("co", C.cierreOpcion);
  }
  function opcionMencionada(n, tokens, ctx) {
    var s = sc(ctx); if (!hasDecision(ctx) || !s.opciones) return -1;
    var a = score(n, tokens, s.opciones[0].claves), b = score(n, tokens, s.opciones[1].claves);
    if (a === 0 && b === 0) return -1;
    return a >= b ? 0 : 1;
  }

  /* ---------- pistas ---------- */
  function pista(ctx) {
    var s = sc(ctx), arr = s.pistas || [], k = baseId(ctx.id);
    var i = S.hintIdx[k] || 0;
    if (i >= arr.length) return pick("sp", C.sinPistas);
    S.hintIdx[k] = i + 1;
    var t = arr[i];
    return i === arr.length - 1 && hasDecision(ctx) ? t + " ¿Querés que te aconseje entre las dos opciones?" : t;
  }

  /* ---------- temas ---------- */
  function tema(n, tokens) {
    var best = null, bs = 0;
    B.temas.forEach(function (t) { var sc_ = score(n, tokens, t.claves); if (sc_ > bs) { bs = sc_; best = t; } });
    return best ? { t: best, s: bs } : null;
  }
  function respTema(t) {
    if (t.requiere && !visitedAny(t.requiere)) return t.aun || "Todavía no tengo información sobre eso, Kai. A medida que avancemos, te cuento.";
    var txt = pick("t:" + t.id, t.resp);
    (t.extra || []).forEach(function (e) { if (visitedAny(e.si)) txt += " " + e.txt; });
    return txt;
  }

  /* ---------- intenciones ---------- */
  var INTENTS = [
    { id: "saludo", w: 1, p: ["hola*", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "hey", "ey", "que tal", "como va", "holi", "saludos", "buen dia vera"] },
    { id: "despedida", w: 2, p: ["chau", "chao", "adios", "hasta luego", "nos vemos", "me voy", "hasta pronto", "hasta manana", "bye"] },
    { id: "gracias", w: 2, p: ["gracias*", "te agradezco", "muy amable"] },
    { id: "estado", w: 3, p: ["como estas", "como andas", "como te sentis", "como te va", "todo bien", "como te encontras", "que tal estas"] },
    { id: "quien", w: 3, p: ["quien sos", "quien eres", "que sos", "presentate", "contame de vos", "quien es vera", "que haces", "que eres", "como te llamas", "cual es tu nombre"] },
    { id: "realia", w: 3, p: ["sos real", "sos humana", "sos una ia", "sos un robot", "sos persona", "estas viva", "tenes sentimientos", "sentis", "sos de verdad", "sos una persona", "sos un programa", "sos humano", "sos una maquina"] },
    { id: "queia", w: 3, p: ["que es una ia", "que es la ia", "que es la inteligencia artificial", "que es una inteligencia artificial", "como funciona una ia", "como aprendes", "como pensas", "como funcionas", "como te programaron", "que es la ia", "para que sirve una ia"] },
    { id: "comofunciona", w: 3, p: ["como funciona este chat", "sos chatgpt", "sos gemini", "que modelo sos", "como funciona el chat", "como respondes", "como me respondes", "quien te programo", "con que funcionas"] },
    { id: "consejo", w: 2, p: ["que camino", "cual camino", "que me conviene", "me conviene", "que elijo", "cual elijo", "que hago", "que hacemos", "que opinas", "que recomendas", "consejo*", "ayudame a elegir", "por donde voy", "por donde empiezo", "cual es mejor", "a donde voy", "adonde voy", "no se que elegir", "estoy indeciso", "cual conviene", "que opcion", "que opcion elijo", "cual opcion", "que eleccion", "cual me aconsejas", "cual me aconsejas", "que decision"] },
    { id: "delegar", w: 4, p: ["recomendame", "que me recomendas", "que harias", "vos que harias", "decime vos", "elegi vos", "elegi por mi", "cual me recomendas", "cual me aconsejas", "que me aconsejas", "aconsejame", "decidi vos", "vos decidis", "que elegirias"] },
    { id: "pista", w: 2, p: ["pista*", "dame una pista", "estoy perdido", "no entiendo", "me trabe", "estoy trabado", "un empujon", "orientame", "ayuda", "dame ayuda", "no se por donde seguir", "estoy atascado", "una ayudita"] },
    { id: "opciones", w: 3, p: ["que opciones tengo", "que puedo hacer", "que alternativas", "cuales son las opciones", "opciones", "que alternativas tengo", "que caminos hay", "que caminos tengo", "cuales son mis opciones"] },
    { id: "donde", w: 2, p: ["donde estamos", "donde estoy", "que lugar es", "que es este lugar", "que pasa aca", "que esta pasando", "que vemos", "que hay aca", "describi", "descripcion", "que detectas", "que detecta", "que ves", "que hay aqui", "que escena es"] },
    { id: "historia", w: 2, p: ["que paso", "resumen", "resumime", "recapitulemos", "contame la historia", "de que trata", "de que se trata", "cual es la mision", "mision", "objetivo", "contame que paso", "recapitula", "que significa esto", "explicame"] },
    { id: "emocion", w: 3, p: ["miedo", "asustado", "asustada", "nervioso", "nerviosa", "ansioso", "preocupado", "preocupada", "me da miedo", "tengo miedo", "estresado", "estresada", "me da nervios", "tengo nervios", "no puedo", "me siento mal", "estoy mal"] },
    { id: "aburrido", w: 3, p: ["aburrido", "aburrida", "me aburro", "es lento", "es largo", "pesado"] },
    { id: "humor", w: 2, p: ["chiste", "jaja*", "jeje*", "jajaja", "gracioso", "me rei", "divertido", "risa"] },
    { id: "elogio", w: 2, p: ["genial", "buenisimo", "sos la mejor", "crack", "increible", "me encanta", "copado", "excelente", "bien hecho", "me ayudaste", "que bueno", "estupendo", "capa", "te quiero"] },
    { id: "insulto", w: 3, p: ["tonta", "inutil", "estupida", "no servis", "no sirves", "mala", "pesima", "horrible", "no me ayudas", "no ayudas", "sos mala", "basura"] },
    { id: "ayudauso", w: 2, p: ["como juego", "como se juega", "como uso", "botones", "que puedo preguntarte", "que puedo decirte", "que sabes", "que sabes hacer", "que puedo preguntar", "para que servis", "como funciona el juego", "instrucciones", "ayuda del juego", "que puedes hacer", "que podes hacer"] },
    { id: "audio", w: 2, p: ["audio", "sonido", "voz", "escuchar", "narrar", "narracion", "no escucho", "no se escucha", "leer en voz alta", "volumen"] },
    { id: "repetir", w: 3, p: ["repetime", "repeti", "otra vez", "de nuevo", "no escuche", "no entendi", "otra respuesta", "dilo de otra forma", "decilo de otra manera", "explicalo de otra manera", "otra forma"] },
    { id: "afirma", w: 1, p: ["si", "dale", "ok", "okey", "okay", "bueno", "claro", "perfecto", "listo", "de acuerdo", "obvio", "por supuesto", "vamos"] },
    { id: "niega", w: 1, p: ["no", "nop", "nada", "mejor no", "nunca", "para nada"] }
  ];

  function matchIntents(n, tokens) {
    var res = [];
    INTENTS.forEach(function (it) {
      var sc_ = score(n, tokens, it.p);
      if (sc_ > 0) res.push({ id: it.id, s: sc_ * it.w });
    });
    res.sort(function (x, y) { return y.s - x.s; });
    return res;
  }

  /* ---------- respuesta principal ---------- */
  function reply(text, ctx) {
    var n = norm(text), tokens = n.split(" ").filter(Boolean);
    S.turns++;
    var repeated = n === S.lastNorm && n.length > 0;
    S.lastNorm = n;
    skipRep = false;
    var out = respond(n, tokens, ctx, repeated);
    if (repeated && !skipRep) out = pick("rep", C.repetido) + " " + out;
    return { text: out.trim(), chips: chipsFor(ctx) };
  }

  function respond(n, tokens, ctx, repeated) {
    var s = sc(ctx);
    var intents = matchIntents(n, tokens);
    var top = intents[0] ? intents[0].id : null;
    var hasSaludo = intents.some(function (i) { return i.id === "saludo"; });
    var pre = "";

    /* 1) respuestas esperadas a una pregunta pendiente */
    if (S.pending) {
      var pnd = S.pending;
      if (pnd.scene !== baseId(ctx.id)) { S.pending = null; }
      else if (pnd.tipo === "guia" && top !== "despedida" && top !== "gracias") {
        var r = resolveGuia(n, tokens, ctx);
        if (r) return r;
        if (!top || top === "afirma" || top === "niega") {
          pnd.asks++;
          if (pnd.asks > 2) { S.pending = null; return pick("ru", C.fueraDeTema) + " " + question(ctx); }
          return fill(pick("ra", C.reAsk), ctx);
        }
      } else if (pnd.tipo === "opcion") {
        var yes = score(n, tokens, ["si", "me animo", "dale", "vamos", "ok", "esa", "esa misma", "perfecto", "listo", "me convence", "la tomo", "voy con esa", "me quedo", "la elijo", "vamos con esa"]);
        var no = score(n, tokens, ["comparemos", "la otra", "otra", "compara", "no", "mejor la otra", "probemos la otra", "analicemos la otra", "no me convence"]);
        if (yes > 0 && yes >= no) {
          S.pending = null;
          return fill(pick("cf", C.confirmarOpcion), ctx, { op: opLabel(ctx, pnd.idx) });
        }
        if (no > 0 && hasDecision(ctx)) return analizarOpcion(ctx, pnd.idx === 0 ? 1 : 0);
      }
    }
    if (S.pending && top && top !== "afirma" && top !== "niega") S.pending = null;

    /* 2) mención de una opción concreta */
    var om = opcionMencionada(n, tokens, ctx);
    var tm = tema(n, tokens);
    if (om > -1 && (!top || top === "consejo" || top === "opciones" || top === "donde" || top === "pista" || top === "afirma" || top === "niega")) {
      return (hasSaludo ? pick("sc", C.saludosCortos) + " " : "") + analizarOpcion(ctx, om);
    }

    /* 3) un tema de la historia con más peso que la intención */
    if (tm && (!top || tm.s >= (intents[0] ? intents[0].s : 0) || top === "afirma" || top === "niega" || top === "saludo")) {
      var t = respTema(tm.t);
      return (hasSaludo && top !== "saludo" ? pick("sc", C.saludosCortos) + " " : "") + join(t, question(ctx));
    }

    if (hasSaludo && top !== "saludo") pre = pick("sc", C.saludosCortos) + " ";
    if (["pista", "saludo", "afirma", "niega", "gracias", "despedida", "elogio", "humor"].indexOf(top) > -1) skipRep = true;

    switch (top) {
      case "saludo":
        var again = S.turns > 1 && S.shown.saludo;
        S.shown.saludo = true;
        return (again ? pick("sr", C.saludoRepetido) + " " : pick("sal", C.saludos) + " ") + question(ctx);
      case "despedida": return pick("de", C.despedidas);
      case "gracias": return pick("gr", C.gracias) + " " + question(ctx);
      case "estado": return pick("es", C.estado) + " " + question(ctx);
      case "quien": return pick("qu", C.quien) + " " + question(ctx);
      case "realia": return pick("ri", C.realIA) + " " + pick("qip", C.queEsIAPregunta);
      case "queia": return pick("qi", C.queEsIA) + " " + pick("qip", C.queEsIAPregunta);
      case "comofunciona": return pick("cf2", C.comoFunciona) + " " + question(ctx);
      case "consejo": return pre + startGuia(ctx).text;
      case "delegar":
        if (!hasDecision(ctx)) return pick("sd", C.sinDecision) + " " + question(ctx);
        return pre + recomendar(ctx, sc(ctx).guia.recomendada, true);
      case "pista": return pre + pista(ctx);
      case "opciones":
        if (!hasDecision(ctx)) return pick("sd", C.sinDecision) + " " + question(ctx);
        return pre + "Tenemos dos caminos: A) «" + opLabel(ctx, 0) + "» o B) «" + opLabel(ctx, 1) + "». ¿Querés que te los explique o que te aconseje?";
      case "donde": return pre + join(s.resumen, question(ctx));
      case "historia": return pre + join(s.resumen, question(ctx));
      case "emocion": return pick("em", C.emocion) + " " + question(ctx);
      case "aburrido": return pick("ab", C.aburrido) + " " + question(ctx);
      case "humor": return pick("hu", C.humor) + " " + question(ctx);
      case "elogio": return pick("el", C.elogio) + " " + question(ctx);
      case "insulto": return pick("in", C.insulto);
      case "ayudauso": return pick("au", C.ayudaUso);
      case "audio": return pick("ad", C.audio);
      case "repetir": return join(s.resumen, hasDecision(ctx) ? "¿Querés que te aconseje entre las opciones?" : "");
      case "afirma": return pick("af", C.afirmacion) + " " + question(ctx);
      case "niega": return pick("ng", C.negacion);
    }
    /* 4) nada reconocido: se mantiene en personaje y guía */
    return pick("fb", C.fueraDeTema) + " " + question(ctx);
  }

  /* ---------- API pública ---------- */
  window.VERA = {
    reset: reset,
    enter: function (ctx) { S.visited[ctx.id] = true; S.visited[baseId(ctx.id)] = true; S.pending = null; S.lastNorm = ""; },
    hint: function (ctx) { return sc(ctx).hint || ""; },
    chips: function (ctx) { return chipsFor(ctx); },
    reply: reply,
    payload: function (text, ctx, hist) {
      var s = sc(ctx);
      return {
        message: text, question: text, scene: ctx.id, sceneTitle: ctx.titulo,
        context: String(ctx.narrativa || "").slice(0, 900),
        options: (ctx.opciones || []).map(function (o) { return clean(o.texto); }),
        sceneSummary: s.resumen || "", hints: s.pistas || [],
        visited: Object.keys(S.visited),
        system: B.persona,
        history: hist || []
      };
    }
  };
})();
