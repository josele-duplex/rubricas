/* pwa.js — instalación de la aplicación y funcionamiento sin conexión.
 *
 * Dos responsabilidades, las dos opcionales: si el navegador no las soporta,
 * o si la página se ha abierto con doble clic (file://), esto no hace nada y
 * la aplicación funciona exactamente igual que antes.
 *
 *   1. Registrar el Service Worker (ver sw.js).
 *   2. Ofrecer «Instalar» en la portada, y solo cuando tiene sentido.
 *
 * Sobre el punto 2: Chrome y Edge avisan con `beforeinstallprompt` y dejan
 * abrir el diálogo del sistema. Safari no —ni en iPad ni en Mac—, así que
 * allí la única vía es que el docente sepa que existe «Compartir → Añadir a
 * pantalla de inicio». Un botón que lo explique no es adorno: sin él, en el
 * iPad la aplicación no se instala nunca porque nadie lo adivina.
 */

const SOPORTA_SW = "serviceWorker" in navigator;
const SERVIDA = location.protocol === "http:" || location.protocol === "https:";

export function registrarServiceWorker() {
  if (!SOPORTA_SW || !SERVIDA) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.warn("[pwa] Sin Service Worker:", err.message));
  });
}

function yaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// iPadOS 13+ se anuncia como Mac; lo que lo delata es que tiene pantalla
// táctil, cosa que ningún Mac de escritorio tiene.
function esIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// Safari es el único que no soporta `beforeinstallprompt`. Chrome y Firefox
// en iOS llevan «CriOS»/«FxiOS» en su cadena y no pueden instalar nada.
function esSafari() {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium|Android/.test(ua);
}

export function montarInstalacion(zona) {
  if (!zona || !SERVIDA || yaInstalada()) return;

  let promptDiferido = null;

  const pintar = (etiqueta, ayuda) => {
    zona.hidden = false;
    zona.innerHTML =
      `<button type="button" class="boton-instalar" id="boton-instalar">${etiqueta}</button>` +
      (ayuda ? `<p class="instalar-ayuda" id="instalar-ayuda" hidden>${ayuda}</p>` : "");
  };

  // Chrome / Edge / Android: el navegador confirma que la aplicación cumple
  // los requisitos de instalación y cede el diálogo.
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault();
    promptDiferido = ev;
    pintar("Instalar la aplicación");
    zona.querySelector("#boton-instalar").addEventListener("click", async () => {
      promptDiferido.prompt();
      const { outcome } = await promptDiferido.userChoice;
      promptDiferido = null;
      if (outcome === "accepted") zona.hidden = true;
    });
  });

  // Safari en iPad / iPhone: no hay diálogo que abrir, solo instrucciones.
  if (esIOS() && esSafari()) {
    pintar(
      "Instalar en el iPad",
      "Toca <strong>Compartir</strong> en la barra de Safari y elige " +
        "<strong>Añadir a pantalla de inicio</strong>. La aplicación se abrirá " +
        "a pantalla completa y seguirá funcionando sin conexión."
    );
    const boton = zona.querySelector("#boton-instalar");
    const ayuda = zona.querySelector("#instalar-ayuda");
    boton.setAttribute("aria-expanded", "false");
    boton.addEventListener("click", () => {
      const abierta = ayuda.hidden;
      ayuda.hidden = !abierta;
      boton.setAttribute("aria-expanded", String(abierta));
    });
  }

  window.addEventListener("appinstalled", () => {
    zona.hidden = true;
  });
}
