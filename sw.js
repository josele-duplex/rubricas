/* sw.js — Service Worker del Taller de Rúbricas.

   Hace dos cosas, y solo dos:
     1. que el navegador ofrezca instalar la aplicación (iPad con Safari,
        Android y escritorio con Chrome);
     2. que, una vez visitada, siga abriendo y generando instrumentos sin
        conexión — que es el caso real del aula: se prepara la rúbrica en
        casa y se usa en clase con la wifi del centro caída.

   No cambia nada del modelo de privacidad: la aplicación sigue sin servidor,
   sin cuentas y sin enviar datos (regla no negociable 8). Un Service Worker
   solo intercepta peticiones al PROPIO origen; aquí, además, se rechaza
   explícitamente todo lo que no lo sea.

   ── Estrategia: red primero, caché de respaldo ──────────────────────────
   Con conexión manda SIEMPRE la red, y de paso se guarda la respuesta; sin
   conexión se sirve la copia guardada. Lo contrario ("caché primero", o
   stale-while-revalidate) es tentador por lo rápido que arranca, pero en una
   aplicación sin proceso de construcción ni nombres con hash provoca dos
   fallos difíciles de ver, ya sufridos en el Taller de Sintaxis en julio de
   2026: tras cada despliegue la primera carga muestra la versión anterior y,
   peor, puede mezclar versiones (index.html nuevo con js/motor.js viejo).
   Un pack de criterios servido junto a un motor de otra versión es
   exactamente el tipo de error que este proyecto no se puede permitir.

   ── Qué se precarga: casi nada, a propósito ─────────────────────────────
   La lista de archivos NO se escribe aquí. Enumerar los módulos de js/ y los
   packs de data/ sería un cuarto sitio donde vive «qué packs hay», y este
   proyecto ya sabe cómo acaba eso: dos copias separándose en silencio
   (CLAUDE.md, «Cada hecho, en un solo sitio»). No hace falta: para instalar
   la aplicación hay que haberla abierto antes, y al abrirla se descargan el
   catálogo, los seis packs, el banco de verbos y todos los módulos. El
   manejador de `fetch` los guarda al pasar. Lo único que se precarga es el
   casco mínimo que puede no haberse pedido nunca con la URL exacta con la
   que arranca la aplicación instalada.

   Para forzar que los dispositivos ya instalados recojan un cambio grande de
   golpe, sube el número de VERSION. */
const VERSION = 'v1';
const CACHE = `taller-rubricas-${VERSION}`;

/* Solo entradas estables. `./` e `./index.html` son la misma página, pero el
   navegador las guarda como claves distintas: la aplicación instalada arranca
   en `./index.html` (start_url del manifest) y quien la visitó por primera
   vez pudo hacerlo en `./`. Los iconos no los pide el documento —el de iOS
   no lo pide nadie— así que sin precarga no estarían nunca en la caché. */
const CASCO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

/* Precarga tolerante a fallos.

   NUNCA usar cache.addAll(): si un solo archivo devuelve 404, la promesa se
   rechaza, la instalación entera falla y —esto es lo grave— el Service Worker
   anterior sigue mandando indefinidamente con su caché vieja. Con put() uno a
   uno, lo que falte se avisa por consola y el resto se guarda igual. */
async function precargarCasco() {
  const cache = await caches.open(CACHE);
  const fallos = [];
  await Promise.all(CASCO.map(async (url) => {
    try {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) { fallos.push(`${url} → HTTP ${res.status}`); return; }
      await cache.put(url, res);
    } catch (err) {
      fallos.push(`${url} → ${err.message}`);
    }
  }));
  if (fallos.length) console.warn('[sw] Sin precargar:', fallos);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precargarCasco().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Las respuestas parciales (206) y las opacas no se pueden guardar:
        // meterlas en la caché rompe la entrada entera.
        if (res && res.ok && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return res;
      })
      .catch(async () => {
        const guardada = await caches.match(req);
        if (guardada) return guardada;
        // Sin conexión y sin copia de ESTA url: si lo que se pedía era una
        // página, se devuelve la portada guardada. Así una URL con parámetros
        // o un enlace directo no acaban en la pantalla de dinosaurio.
        if (req.mode === 'navigate') {
          const portada = await caches.match('./index.html');
          if (portada) return portada;
        }
        return Response.error();
      })
  );
});
