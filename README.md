# NOVA ARCADIA 2087

Un solo sitio con dos experiencias:

| Página | Qué es |
|---|---|
| `index.html` | Menú principal: elegís entre la narrativa y el juego. |
| `narrativa.html` | **La Ciudad que Dormía**: aventura interactiva de 22 escenas, con **narración en audio**, decisiones y VERA (chat). |
| `juego.html` | **Escape de Morfeo**: juego de 5 sectores con drones y acertijos, solo o multijugador (2–4). |

## Publicar en GitHub Pages
1. Creá un repositorio nuevo en GitHub.
2. Subí **todo el contenido** de esta carpeta (que `index.html` quede en la raíz, sin una carpeta contenedora extra). Incluí las carpetas `audio`, `imagenes`, `img`, `css`, `js` y `data`.
3. En **Settings → Pages** elegí *Deploy from a branch* → `main` → `/ (root)` → *Save*.
4. Esperá un minuto y abrí la URL que muestra GitHub.

> Para probarlo en tu compu no abras los archivos con doble clic: el navegador bloquea la carga de datos desde `file://`. Usá GitHub Pages o un servidor local (por ejemplo `python3 -m http.server` dentro de la carpeta y abrir `http://localhost:8000`).

## Narración en audio
En `narrativa.html`, arriba del texto de cada escena hay dos botones:

- **▶ Narrar**: reproduce el audio de la escena desde el principio y deja la narración activada: las escenas siguientes se narran solas al elegir una decisión.
- **■ Parar**: corta el audio y pasa a **lectura en silencio** (el navegador lo recuerda para la próxima vez). Para volver a escuchar, tocá ▶ Narrar.

Además hay una barra de progreso con el tiempo, y el audio de las dos decisiones posibles se precarga para que arranque sin demora. Si falta el `.mp3` de una escena, se usa la voz del navegador para que nada se rompa.

### Qué audio suena en cada escena
Cada escena de `data/historia.json` indica su audio en el campo `"audio"`. Los nombres respetan mayúsculas y minúsculas (GitHub Pages las distingue):

`INICIO, A, B, A1, A2, B1, B2, A1a, A1b, A2a, A2b, B1a, B1b, B2a, B2b, CONVERGE, alpha, beta, FINAL`

`CONVERGE.mp3` se usa en las cuatro escenas I, II, III y IV, que tienen el mismo texto. Para cambiar una narración, reemplazá el archivo de `audio/` conservando el nombre.

## VERA
- En la narrativa, el chat con VERA es **opcional**: aparece solo al tocar el botón flotante **V · Asistente** (abajo a la derecha) y se cierra con **✕** o con la tecla Esc. Solo muestra el chat, con sugerencias de preguntas y respuestas ya cargadas; no hay panel lateral ni lectura en voz alta.
- El chat **no se lee en voz alta**: suena un aviso corto al **enviar** un mensaje y otro distinto cuando **VERA responde**. La campanita 🔔 del chat los silencia (el navegador lo recuerda).
- `js/vera_base.js`: todo lo que VERA sabe y dice (se puede editar con cualquier editor de texto).
- `js/vera.js`: motor de conversación (no hace falta tocarlo).
- `js/config.js`: opcional, para conectar VERA con Gemini mediante un Worker. Pegá su URL **después de verificar que funciona**. Nunca subas claves privadas a GitHub.

Sin conexión ni claves VERA funciona con reglas y una base de conocimientos; no es un modelo de IA generativa.

## Multijugador del juego (Firebase)
El sitio usa **Realtime Database + acceso anónimo**. Pasos (una sola vez):

1. **Authentication → Método de acceso → Anónimo**: activado.
2. **Authentication → Configuración → Dominios autorizados**: agregá `TUUSUARIO.github.io` (sin esto el acceso anónimo falla fuera de localhost).
3. **Realtime Database → Reglas**: pegá el contenido de `firebase/database.rules.json` y tocá **Publicar**. Nadie puede listar las salas; solo se entra con el código.
4. En el juego, tocá **🔧 Probar conexión multijugador**: te marca con ✔/✖ cada paso (acceso anónimo, lectura, escritura) para ver qué falla.
5. (Recomendado) En Google Cloud → Credenciales, restringí la clave de API a tu dominio de GitHub Pages.

Reglas que aplican: solo usuarios autenticados; solo el anfitrión crea/cierra su sala y la inicia; no se puede entrar a una carrera ya iniciada (el límite de 4 jugadores lo controla el juego); cada jugador solo escribe su propio progreso y con valores válidos.
La config de Firebase de `js/juego.js` es pública por diseño. El modo solo no necesita Firebase.

## Estructura
```
index.html  narrativa.html  juego.html
css/   hub.css  narrativa.css  juego.css
js/    narrativa.js  vera.js  vera_base.js  config.js  juego.js
firebase/  database.rules.json  (reglas de Realtime Database)
data/  historia.json
audio/ 19 narraciones .mp3 (+ LEEME.txt)
imagenes/  22 ilustraciones de las escenas (WebP 1920×1080)
img/   portada.webp  laboratorio.webp  favicon.svg
```

## Dependencias externas
Solo las tipografías de Google Fonts (con tipografías de respaldo si no cargan) y, únicamente para el multijugador, los módulos de Firebase desde `gstatic.com`.

## Créditos
Proyecto educativo · Auxiliar en Inteligencia Artificial · 2026

## Efectos visuales (carpeta `fx/`)
Capa decorativa agregada con la habilidad *transiciones-visuales*. No modifica imágenes, audios ni scripts del proyecto.
- **Transiciones entre escenas** (portal, glitch, escaneo, hiperespacio, píxeles, holograma, columnas), elegidas según el color/clima de cada ilustración; telón neón entre páginas.
- **Profundidad 2.5D** de la ilustración (mouse o giroscopio), **HUD** con marcos y reloj 2087, títulos descifrados, **voz viva**, ciudad de neón de fondo y estela de cursor.
- **◈ MAPA**: mapa 3D de las 22 escenas. Acercate a un lugar (rueda, pellizco o ＋/−) o tocá un punto y aparece su imagen; con ‹ › recorrés los demás lugares. Cada lugar tiene su propia **tarjeta descargable** (`⬇ Tarjeta de este lugar`).
- **⛶ Pantalla completa** en el menú, el juego y la narrativa (en iPhone no existe esa función en Safari).
- **♪**: sonidos sci-fi sintetizados (apagados por defecto) · **✦ FX**: apaga o enciende todos los efectos.
- Configuración en `fx/fx.config.js` (ver `fx/LEEME-FX.txt`). Para quitarla: borrá `fx/` y los bloques entre `<!-- FX:inicio -->` y `<!-- FX:fin -->` en los tres `.html`.

## Arreglo del juego en celular
En `css/juego.css` (al final) los avisos de **nivel superado** y **misión cumplida** (con el trofeo y el botón CONTINUAR) ahora ocupan toda la pantalla en celulares y pantallas bajas, con tamaños compactos y desplazamiento si hiciera falta.
