"use strict";
/* La Ciudad que Dormía · Nova Arcadia 2087
   - Escenas y decisiones: data/historia.json
   - Narración en audio: carpeta audio/ (un .mp3 por escena, ver audio/LEEME.txt)
   - VERA (chat): vera_base.js + vera.js  (config.js permite conectar Gemini más adelante)
     El chat es OPCIONAL: botón «V Asistente» (abajo a la derecha) para abrirlo; ✕ o Esc para cerrarlo.
     No se lee en voz alta: solo suena un aviso al enviar y otro cuando VERA responde.

   Narración:
   · ▶ Narrar  -> reproduce el audio de la escena y deja la narración ACTIVADA:
                  las escenas siguientes se narran solas al elegir una decisión.
   · ■ Parar   -> corta el audio y pasa a LECTURA EN SILENCIO (se recuerda en el navegador).
   Si falta el .mp3 de una escena, se usa la voz del navegador para que nada se rompa. */

const $ = id => document.getElementById(id);
let nodes = {}, current = "INICIO", trail = [], sound = false;
const imagePath = id => `imagenes/${id}.webp`;
const audioPath = (id, s) => `audio/${(s && s.audio) || id}.mp3`;
const PLAYER = $("player");

/* ---------- preferencia de narración (se recuerda; por defecto: narrar) ---------- */
const MODE_KEY = "nova2087-narracion";
let narrMode = true;               // true = narración automática; false = lectura en silencio
try { narrMode = localStorage.getItem(MODE_KEY) !== "off"; } catch (e) { /* sin almacenamiento */ }
function setMode(on) {
  narrMode = on;
  try { localStorage.setItem(MODE_KEY, on ? "on" : "off"); } catch (e) { /* nada */ }
  paintMode();
}
function paintMode() {
  $("narrMode").textContent = narrMode
    ? "🔊 Narración activada: cada escena se narra sola. Tocá ■ Parar para leer en silencio."
    : "📖 Lectura en silencio. Tocá ▶ Narrar para escuchar esta escena y las siguientes.";
}

/* ---------- sonido de clic ---------- */
function beep() {
  if (!sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 720; g.gain.value = .035;
    o.start(); o.stop(ctx.currentTime + .09); o.onended = () => ctx.close();
  } catch (e) { /* sin audio disponible */ }
}

/* ---------- reproductor de narración ---------- */
let narrToken = 0;                 // invalida callbacks de reproducciones anteriores
let playKind = null;               // "escena" | "dialogo" | null
const fmt = t => { t = Math.max(0, Math.round(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const status = msg => { $("audioStatus").textContent = msg || ""; };

function paintPlaying(on) {
  const go = $("narrate");
  go.classList.toggle("playing", on);
  go.setAttribute("aria-pressed", on ? "true" : "false");
  go.textContent = on && playKind === "escena" ? "▶ Narrando…" : "▶ Narrar";
  $("stopNarr").disabled = !on;
  if (!on) { $("nbar").style.width = "0"; $("ntime").textContent = "0:00"; }
}
/* corta todo lo que esté sonando SIN cambiar la preferencia del usuario */
function haltAudio() {
  narrToken++;
  PLAYER.onerror = PLAYER.onended = PLAYER.ontimeupdate = PLAYER.onloadedmetadata = null;
  try { PLAYER.pause(); PLAYER.removeAttribute("src"); PLAYER.load(); } catch (e) { /* nada */ }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  playKind = null;
  paintPlaying(false);
  status("");
}
function speakText(text, token, kind) {
  if (!("speechSynthesis" in window)) { playKind = null; paintPlaying(false); status("Tu navegador no tiene voz de lectura."); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR"; u.rate = .96;
  u.onend = u.onerror = () => { if (token === narrToken) { playKind = null; paintPlaying(false); } };
  playKind = kind; paintPlaying(true);
  speechSynthesis.speak(u);
}
function playNarration() {
  const s = nodes[current];
  if (!s) return;
  haltAudio();
  const token = narrToken;         // se captura DESPUÉS de haltAudio (que lo incrementa)
  let fellBack = false;
  const fallback = () => {
    if (token !== narrToken || fellBack) return;
    fellBack = true;
    status("Todavía no está el audio de esta escena: se usa la voz del navegador.");
    speakText(s.narrativa, token, "escena");
  };
  PLAYER.onerror = fallback;
  PLAYER.onended = () => { if (token === narrToken) { playKind = null; paintPlaying(false); } };
  PLAYER.onloadedmetadata = () => { if (token === narrToken) $("ntime").textContent = "0:00 / " + fmt(PLAYER.duration); };
  PLAYER.ontimeupdate = () => {
    if (token !== narrToken || !PLAYER.duration) return;
    $("nbar").style.width = Math.min(100, PLAYER.currentTime / PLAYER.duration * 100) + "%";
    $("ntime").textContent = fmt(PLAYER.currentTime) + " / " + fmt(PLAYER.duration);
  };
  PLAYER.src = audioPath(current, s);
  playKind = "escena"; paintPlaying(true);
  const p = PLAYER.play();
  if (p && p.catch) p.catch(err => {
    if (token !== narrToken) return;
    if (err && err.name === "AbortError") return;
    if (err && err.name === "NotAllowedError") {
      playKind = null; paintPlaying(false);
      status("El navegador bloqueó la reproducción automática. Tocá ▶ Narrar.");
    } else fallback();
  });
}
/* ▶ Narrar: activa la narración y reproduce esta escena desde el principio */
$("narrate").onclick = () => { setMode(true); playNarration(); };
/* ■ Parar: corta el audio y deja la lectura en silencio para las próximas escenas */
$("stopNarr").onclick = () => {
  const eraNarracion = playKind === "escena";
  haltAudio();
  if (eraNarracion) setMode(false);
};

/* precarga de los audios de las dos decisiones posibles, para que arranquen sin demora */
const precargados = new Set();
function precargar(s) {
  (s.opciones || []).forEach(o => {
    const n = nodes[o.siguiente];
    if (!n) return;
    const url = audioPath(o.siguiente, n);
    if (precargados.has(url)) return;
    precargados.add(url);
    fetch(url).catch(() => { /* sin red: no pasa nada */ });
  });
}

/* ---------- escenas ---------- */
function ctxOf() {
  const s = nodes[current];
  return { id: current, titulo: s.titulo, nivel: s.nivel, narrativa: s.narrativa, opciones: s.opciones || [] };
}
function scene(id, push = true) {
  if (!nodes[id]) { alert("No se encontró la escena " + id); return; }
  if (push) trail.push(current);
  current = id; haltAudio(); beep(); render();
  if (narrMode) playNarration();
  requestAnimationFrame(() => window.scrollTo({ top: $("game").getBoundingClientRect().top + window.scrollY - 12, behavior: "smooth" }));
}
function render() {
  const s = nodes[current];
  $("title").textContent = s.titulo;
  $("level").textContent = s.nivel;
  $("bar").style.width = Math.min(100, (Number((s.nivel.match(/\d+/) || [])[0]) || 0) / 6 * 100) + "%";
  $("narrative").textContent = s.narrativa;
  const img = $("sceneImage");
  img.src = imagePath(current); img.alt = "Escenario de " + s.titulo;
  img.onerror = () => { img.onerror = null; img.src = imagePath("INICIO"); };
  $("choices").replaceChildren();
  (s.opciones || []).forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "choice"; b.type = "button";
    const num = document.createElement("b"); num.textContent = i + 1;
    const label = document.createElement("span"); label.textContent = opt.texto;
    b.append(num, label);
    b.onclick = () => scene(opt.siguiente);
    $("choices").append(b);
  });
  $("gameCta").hidden = current !== "FINAL";
  $("back").disabled = trail.length === 0;
  if (window.VERA) {
    window.VERA.enter(ctxOf());
    setChips(window.VERA.chips(ctxOf()));
  }
  precargar(s);
}
function resetChat() {
  $("chatlog").replaceChildren();
  bubble("VERA", "Hola, Kai. Soy Vera, tu aliada en esta misión. Podés saludarme, pedirme una pista o preguntarme qué camino te conviene.");
  $("chatStatus").textContent = "VERA te va a guiar con preguntas";
}
function start() {
  trail = []; current = "INICIO"; haltAudio();
  if (window.VERA) window.VERA.reset();
  resetChat(); closeChat(false);
  $("welcome").hidden = true; $("game").hidden = false;
  render(); beep();
  if (narrMode) playNarration();   // el clic en COMENZAR cuenta como gesto del usuario: el navegador permite el audio
  requestAnimationFrame(() => setTimeout(() => $("game").scrollIntoView({ behavior: "smooth", block: "start" }), 70));
}

/* ---------- chat con VERA (panel opcional) ---------- */
const chatPanel = $("veraChat");
const chatOpen = () => !chatPanel.hidden;
function openChat() {
  chatPanel.hidden = false;
  $("openChat").setAttribute("aria-expanded", "true");
  $("openChat").hidden = true;
  chatSfxUnlock();
  $("chatlog").scrollTop = $("chatlog").scrollHeight;
  setTimeout(() => { try { $("question").focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 60);
}
function closeChat(returnFocus = true) {
  chatPanel.hidden = true;
  $("openChat").setAttribute("aria-expanded", "false");
  $("openChat").hidden = false;
  if (returnFocus && !$("game").hidden) { try { $("openChat").focus({ preventScroll: true }); } catch (e) { /* nada */ } }
}
$("openChat").onclick = openChat;
$("closeChat").onclick = () => closeChat();
document.addEventListener("keydown", e => { if (e.key === "Escape" && chatOpen()) closeChat(); });

/* ---------- sonidos del chat (sin lectura en voz alta) ----------
   · al ENVIAR un mensaje a VERA: dos notas cortas que suben
   · cuando VERA RESPONDE: un timbre suave de dos notas que bajan
   Se puede silenciar con la campanita del chat (se recuerda en el navegador). */
const CHAT_SND_KEY = "nova2087-chat-sonido";
let chatSound = true;
try { chatSound = localStorage.getItem(CHAT_SND_KEY) !== "off"; } catch (e) { /* sin almacenamiento */ }
let chatAudio = null;
function chatSfxUnlock() {            // se llama dentro de un gesto del usuario (clic / envío)
  try {
    if (!chatAudio) chatAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (chatAudio.state === "suspended") chatAudio.resume();
  } catch (e) { chatAudio = null; }
}
function tone(freq, start, dur, type, vol) {
  const t0 = chatAudio.currentTime + start, o = chatAudio.createOscillator(), g = chatAudio.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(chatAudio.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function chatSfx(kind) {
  if (!chatSound) return;
  chatSfxUnlock();
  if (!chatAudio) return;
  if (kind === "send") { tone(520, 0, 0.09, "triangle", 0.12); tone(780, 0.07, 0.13, "triangle", 0.12); }
  else                 { tone(1175, 0, 0.18, "sine", 0.13); tone(880, 0.13, 0.32, "sine", 0.13); tone(1318, 0.27, 0.4, "sine", 0.08); }
}
function paintChatSound() {
  const b = $("chatSound");
  b.textContent = chatSound ? "🔔" : "🔕";
  b.setAttribute("aria-pressed", chatSound ? "true" : "false");
  b.title = chatSound ? "Sonidos del chat: activados" : "Sonidos del chat: silenciados";
}
$("chatSound").onclick = () => {
  chatSound = !chatSound;
  try { localStorage.setItem(CHAT_SND_KEY, chatSound ? "on" : "off"); } catch (e) { /* nada */ }
  paintChatSound();
  if (chatSound) chatSfx("send");
};
paintChatSound();

function bubble(who, msg) {
  const el = document.createElement("div");
  el.className = "bubble" + (who === "KAI" ? " user" : "");
  el.textContent = who + ": " + msg;
  $("chatlog").append(el);
  $("chatlog").scrollTop = $("chatlog").scrollHeight;
}
function setChips(list) {
  const box = $("chips");
  box.replaceChildren();
  (list || []).forEach(text => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = text;
    b.onclick = () => ask(text);
    box.append(b);
  });
}
const chatHistory = [];
async function ask(q) {
  q = String(q || "").trim();
  if (!q || $("chatForm").dataset.busy === "1") return;
  $("chatForm").dataset.busy = "1";
  $("question").value = "";
  bubble("KAI", q);
  chatSfx("send");                                   // sonido 1: mensaje enviado
  setChips([]);
  $("chatStatus").textContent = "VERA está escribiendo…";
  const ctx = ctxOf();
  const local = window.VERA.reply(q, ctx);
  let text = local.text, chips = local.chips;
  if (window.VERA_API_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);
      const res = await fetch(window.VERA_API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(window.VERA.payload(q, ctx, chatHistory.slice(-8))), signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw Error("HTTP " + res.status);
      const data = await res.json();
      const remote = String(data.answer || data.response || data.text || "").trim();
      if (remote) { text = remote; $("chatStatus").textContent = "VERA conectada"; }
    } catch (err) { $("chatStatus").textContent = "Sin conexión con Gemini · VERA responde con su base de conocimientos"; }
  }
  await new Promise(r => setTimeout(r, Math.min(450 + text.length * 7, 1300)));
  bubble("VERA", text);
  if (chatOpen()) chatSfx("reply");                  // sonido 2: VERA respondió (si el chat sigue abierto)
  chatHistory.push({ role: "user", text: q }, { role: "vera", text });
  setChips(chips);
  if ($("chatStatus").textContent === "VERA está escribiendo…") $("chatStatus").textContent = "VERA te va a guiar con preguntas";
  $("chatForm").dataset.busy = "0";
}
$("chatForm").onsubmit = e => { e.preventDefault(); ask($("question").value); };

/* ---------- botones generales ---------- */
$("start").onclick = start;
$("restart").onclick = start;
$("home").onclick = () => { closeChat(false); $("game").hidden = true; $("welcome").hidden = false; haltAudio(); window.scrollTo({ top: 0, behavior: "smooth" }); };
$("back").onclick = () => { if (trail.length) scene(trail.pop(), false); };
$("sound").onclick = () => { sound = !sound; $("sound").textContent = sound ? "🔔 Clics: ON" : "🔔 Clics: OFF"; beep(); };
$("full").onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };
/* si la pestaña pasa a segundo plano, se corta la narración en vez de seguir sonando sin que se vea */
document.addEventListener("visibilitychange", () => { if (document.hidden && playKind) haltAudio(); });

/* ---------- carga de la historia ---------- */
paintMode();
paintPlaying(false);
$("start").disabled = true;
fetch("data/historia.json")
  .then(r => { if (!r.ok) throw Error("No se pudo cargar data/historia.json (" + r.status + ")"); return r.json(); })
  .then(data => { nodes = data; $("start").disabled = false; })
  .catch(err => {
    console.error(err);
    alert("Error al cargar la historia: " + err.message + "\n\nSi abriste el archivo con doble clic, probá desde GitHub Pages o con un servidor local: los navegadores bloquean la carga de datos desde file://.");
  });
