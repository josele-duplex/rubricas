# -*- coding: utf-8 -*-
"""
Genera los iconos de la aplicación instalable (PWA) en `assets/icons/`.

Los iconos son DERIVADOS, como `js/lexico.js` o las tablas del SDD: no se
editan a mano. Su geometría y sus colores se describen aquí una sola vez y de
ahí salen los nueve archivos que piden el navegador, Android e iOS.

Los colores NO se escriben en este archivo: se leen del bloque `:root` de
`css/styles.css`, que es donde vive la identidad visual del proyecto. Si la
banda de tinta o los cuatro niveles de logro cambian de color, los iconos
cambian con ellos y no hay dos paletas separándose en silencio.

El dibujo es la propia rúbrica: una rejilla de cuatro columnas —los cuatro
niveles de logro, con su color— sobre la banda de tinta de la portada.

Uso:
    python scripts/generar_iconos.py              (escribe los iconos)
    python scripts/generar_iconos.py --comprobar  (falla si falta alguno)

DIBUJAR los iconos necesita Pillow; COMPROBARLOS, no. La distinción no es
casual: el proyecto no tiene dependencias externas y el CI ejecuta la
comprobación completa, así que `--comprobar` se apaña con la biblioteca
estándar y no lee un solo píxel. Lo que comprueba es el invariante que de
verdad importa —que exista todo lo que la instalación promete: los iconos del
manifest, los del <head>, la portada y el casco del Service Worker—, porque
un icono que falta no rompe nada a la vista: solo hace que la aplicación deje
de poder instalarse, en silencio.
"""
import io
import json
import os
import re
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:  # solo hace falta para dibujar, no para comprobar
    Image = ImageDraw = None

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(RAIZ, "css", "styles.css")
DESTINO = os.path.join(RAIZ, "assets", "icons")

# Supermuestreo: se dibuja a 8x y se reduce, que es la forma barata de tener
# bordes suaves sin depender de un motor de dibujo con antialias.
ESCALA = 8

# Qué parte del lienzo ocupa la rejilla. El icono «maskable» de Android puede
# recortarse hasta un círculo del 80 % del ancho, así que su dibujo se encoge
# para caber en la zona segura; el resto es banda de tinta, que aguanta
# cualquier recorte.
PROPORCION_NORMAL = 0.62
PROPORCION_MASKABLE = 0.56

# Radio de las esquinas, en proporción al lado. Los iconos «any» llevan la
# esquina redondeada (Android los pinta tal cual); los de iOS y los maskable
# van a sangre, porque el sistema aplica su propia máscara encima y un margen
# transparente se vería como un icono pequeño dentro de un cuadro blanco.
RADIO_ANY = 0.22


def leer_colores():
    """Extrae del `:root` de css/styles.css los colores que usa el icono."""
    with io.open(CSS, encoding="utf-8") as f:
        css = f.read()
    bloque = css[: css.index("@media")] if "@media" in css else css

    necesarios = [
        "--tinta-banda-1", "--tinta-banda-2",
        "--nivel-1-bg", "--nivel-2-bg", "--nivel-3-bg", "--nivel-4-bg",
        "--col-dimension-bg",
    ]
    colores = {}
    for nombre in necesarios:
        m = re.search(re.escape(nombre) + r"\s*:\s*(#[0-9a-fA-F]{6})", bloque)
        if not m:
            raise SystemExit(
                "No se encontró %s en el :root de css/styles.css. Los iconos "
                "leen la identidad visual de ahí: si el token ha cambiado de "
                "nombre, actualiza esta lista." % nombre
            )
        colores[nombre] = hex_a_rgb(m.group(1))
    return colores


def hex_a_rgb(texto):
    texto = texto.lstrip("#")
    return tuple(int(texto[i:i + 2], 16) for i in (0, 2, 4))


def fondo_banda(lado, c1, c2):
    """La banda de tinta de la portada, en diagonal, como en `.banda`."""
    img = Image.new("RGB", (lado, lado))
    pix = img.load()
    for y in range(lado):
        for x in range(lado):
            # Diagonal descendente equivalente al linear-gradient(118deg…):
            # arranca en la tinta y termina en el acento profundo.
            t = (x * 0.72 + y * 0.28) / max(lado - 1, 1)
            t = 0.0 if t < 0.30 else min((t - 0.30) / 0.70, 1.0)
            pix[x, y] = (
                int(c1[0] + (c2[0] - c1[0]) * t),
                int(c1[1] + (c2[1] - c1[1]) * t),
                int(c1[2] + (c2[2] - c1[2]) * t),
            )
    return img


def celdas_rejilla(lado, proporcion):
    """Geometría del dibujo: 4×4 celdas, y qué color lleva cada una.

    El dibujo es a la vez una rúbrica y su escala: la columna i se llena hasta
    la altura i, así que las cuatro columnas forman la escalera de los cuatro
    niveles de logro. Las celdas vacías quedan como huella tenue de la rejilla,
    que es lo que hace que se lea como tabla y no como gráfico de barras.

    Devuelve tuplas (x0, y0, x1, y1, indice_nivel_o_None, radio).
    """
    ancho = lado * proporcion
    x0 = (lado - ancho) / 2
    y0 = (lado - ancho) / 2

    hueco = ancho * 0.055
    paso = (ancho - hueco * 3) / 4
    radio = paso * 0.16

    fuera = []
    for i in range(4):
        x = x0 + i * (paso + hueco)
        for j in range(4):
            # j = 0 es la fila de abajo; la columna i se llena hasta j = i.
            y = y0 + (3 - j) * (paso + hueco)
            fuera.append((x, y, x + paso, y + paso, i if j <= i else None, radio))
    return fuera


def dibujar_rejilla(img, proporcion, colores):
    lado = img.size[0]
    d = ImageDraw.Draw(img, "RGBA")
    niveles = [colores["--nivel-%d-bg" % n] for n in (1, 2, 3, 4)]
    papel = colores["--col-dimension-bg"]

    for x0, y0, x1, y1, nivel, radio in celdas_rejilla(lado, proporcion):
        color = niveles[nivel] + (255,) if nivel is not None else papel + (34,)
        d.rounded_rectangle([x0, y0, x1, y1], radius=radio, fill=color)
    return img


def redondear(img, radio_rel):
    """Devuelve el icono con esquinas redondeadas y fuera transparente."""
    lado = img.size[0]
    mascara = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(
        [0, 0, lado - 1, lado - 1], radius=int(lado * radio_rel), fill=255
    )
    salida = img.convert("RGBA")
    salida.putalpha(mascara)
    return salida


def componer(lado, proporcion, radio_rel, colores):
    grande = lado * ESCALA
    # El degradado se calcula píxel a píxel, así que se genera pequeño y se
    # amplía: una rampa lineal se interpola sin pérdida visible, y calcular
    # 4096×4096 en Python puro tardaba más que todo lo demás junto.
    base = fondo_banda(min(grande, 384), colores["--tinta-banda-1"], colores["--tinta-banda-2"])
    img = base.resize((grande, grande), Image.BICUBIC)
    dibujar_rejilla(img, proporcion, colores)
    if radio_rel:
        img = redondear(img, radio_rel)
    else:
        img = img.convert("RGBA")
    return img.resize((lado, lado), Image.LANCZOS)


def svg(colores):
    """Favicon vectorial, con la misma geometría que los PNG."""
    c1 = "#%02x%02x%02x" % colores["--tinta-banda-1"]
    c2 = "#%02x%02x%02x" % colores["--tinta-banda-2"]
    papel = "#%02x%02x%02x" % colores["--col-dimension-bg"]
    niveles = ["#%02x%02x%02x" % colores["--nivel-%d-bg" % n] for n in (1, 2, 3, 4)]

    celdas = []
    for x0, y0, x1, y1, nivel, radio in celdas_rejilla(64.0, PROPORCION_NORMAL):
        relleno = niveles[nivel] if nivel is not None else papel
        opacidad = "" if nivel is not None else ' fill-opacity="0.13"'
        celdas.append(
            '  <rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" rx="%.2f" fill="%s"%s/>'
            % (x0, y0, x1 - x0, y1 - y0, radio, relleno, opacidad)
        )

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        "  <!-- GENERADO por scripts/generar_iconos.py — no se edita a mano. -->\n"
        '  <defs><linearGradient id="banda" x1="0" y1="0" x2="1" y2="0.78">\n'
        '    <stop offset="0.30" stop-color="%s"/><stop offset="1" stop-color="%s"/>\n'
        "  </linearGradient></defs>\n"
        '  <rect width="64" height="64" rx="14" fill="url(#banda)"/>\n'
        "%s\n</svg>\n" % (c1, c2, "\n".join(celdas))
    )


def salidas(colores):
    """{ruta relativa: bytes}. Un solo sitio donde está la lista de archivos."""
    fuera = {}

    def png(img, nombre):
        buf = io.BytesIO()
        img.save(buf, "PNG", optimize=True)
        fuera[nombre] = buf.getvalue()

    # Instalación (manifest): «any» con esquina redondeada.
    for lado in (192, 512):
        png(componer(lado, PROPORCION_NORMAL, RADIO_ANY, colores), "icon-%d.png" % lado)
    # Instalación en Android: «maskable», a sangre y con zona segura.
    for lado in (192, 512):
        png(componer(lado, PROPORCION_MASKABLE, None, colores), "icon-maskable-%d.png" % lado)
    # iOS: a sangre y sin transparencia — el sistema recorta por su cuenta.
    ios = componer(180, PROPORCION_NORMAL, None, colores).convert("RGB")
    png(ios, "apple-touch-icon.png")
    # Pestaña del navegador.
    for lado in (16, 32, 48):
        png(componer(lado, PROPORCION_NORMAL, RADIO_ANY, colores), "favicon-%d.png" % lado)

    ico = componer(48, PROPORCION_NORMAL, RADIO_ANY, colores)
    buf = io.BytesIO()
    ico.save(buf, "ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    fuera["favicon.ico"] = buf.getvalue()

    fuera["favicon.svg"] = svg(colores).encode("utf-8")
    return fuera


def archivos_prometidos():
    """Qué archivos promete la instalación, leídos de quien los promete.

    No hay aquí ninguna lista de iconos: se sacan del manifest, del <head> de
    index.html y del casco de sw.js, que son los tres sitios donde alguien
    dice «este archivo existe». Así no puede haber una cuarta lista que se
    separe de las otras tres.

    Devuelve [(ruta relativa a la raíz, quién lo promete)].
    """
    fuera = []

    with io.open(os.path.join(RAIZ, "manifest.webmanifest"), encoding="utf-8") as f:
        manifest = json.load(f)
    fuera.append((manifest["start_url"], "manifest.webmanifest (start_url)"))
    for icono in manifest["icons"]:
        fuera.append((icono["src"], "manifest.webmanifest (icons)"))

    with io.open(os.path.join(RAIZ, "index.html"), encoding="utf-8") as f:
        html = f.read()
    for etiqueta in re.findall(r"<link\b[^>]*>", html):
        if not re.search(r'rel="(?:[^"]*\b)?(?:icon|apple-touch-icon|manifest)\b', etiqueta):
            continue
        href = re.search(r'href="([^"]+)"', etiqueta)
        if href:
            fuera.append((href.group(1), "index.html (<head>)"))

    with io.open(os.path.join(RAIZ, "sw.js"), encoding="utf-8") as f:
        sw = f.read()
    casco = re.search(r"const CASCO = \[(.*?)\];", sw, re.S)
    if not casco:
        raise SystemExit("sw.js ya no declara `const CASCO = [...]`: revisa esta comprobación.")
    for ruta in re.findall(r"'([^']+)'", casco.group(1)):
        fuera.append((ruta, "sw.js (CASCO)"))

    return fuera


def comprobar_instalacion():
    """Todo lo que la instalación promete tiene que existir en el disco."""
    faltan = []
    for ruta, quien in archivos_prometidos():
        limpia = ruta.lstrip("./")
        if limpia in ("", "index.html") and not ruta.endswith(".html"):
            limpia = "index.html"  # './' es la portada
        destino = os.path.join(RAIZ, limpia.replace("/", os.sep))
        if not os.path.isfile(destino):
            faltan.append("  %-42s prometido por %s" % (ruta, quien))

    if faltan:
        print("La aplicación no se podría instalar: faltan archivos.\n")
        print("\n".join(sorted(set(faltan))))
        print("\nSi son iconos: python scripts/generar_iconos.py")
        return 1

    total = len(set(r for r, _ in archivos_prometidos()))
    print("Instalable: existen los %d archivos que prometen el manifest, "
          "el <head> y el Service Worker." % total)
    return 0


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    if "--comprobar" in sys.argv:
        return comprobar_instalacion()

    if Image is None:
        print("Dibujar los iconos necesita Pillow:  python -m pip install Pillow")
        print("(Comprobarlos no: `--comprobar` va con la biblioteca estándar.)")
        return 1

    esperado = salidas(leer_colores())
    if not os.path.isdir(DESTINO):
        os.makedirs(DESTINO)
    for nombre, datos in sorted(esperado.items()):
        with open(os.path.join(DESTINO, nombre), "wb") as f:
            f.write(datos)
        print("  escrito  assets/icons/%s  (%d bytes)" % (nombre, len(datos)))
    print("%d iconos generados desde la paleta de css/styles.css." % len(esperado))
    return 0


if __name__ == "__main__":
    sys.exit(main())
