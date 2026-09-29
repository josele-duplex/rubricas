"""Genera la guía del docente en .docx.

    python scripts/generar_manual.py

Salida: docs/Taller-de-Rubricas_Guia-para-empezar.docx

Por qué existe este script y no se edita el .docx a mano: la primera versión de
la guía se escribió en Word y envejeció en silencio. Siete versiones del
proyecto después prometía seis tipos de tarea (ya había nueve), 163 criterios
(había 232), diecinueve reglas de validación (había veintiuna) y una
exportación a iDoceo «diseñada, no implementada» que llevaba dos días
funcionando. Todos esos son hechos que ya viven en data/ y en el código, así
que aquí no se escriben: se leen. Lo que se escribe a mano es la prosa, igual
que en el SDD, donde las dos tablas son generadas y la justificación que las
rodea no.

Fuentes de los datos volátiles:
  - data/catalogo.json ......... cursos, nombres de los cuatro niveles, tipos de tarea
  - data/derivacion-lcl.json ... la matriz tarea x curso del apartado «contenido» (SDD §4.3)
  - data/pack-lcl-*.json ....... recuentos de criterios y matrices, cobertura del
    lenguaje sencillo, condiciones «para poder evaluarla» y los ejemplos que se
    citan (un descriptor en sus dos versiones, una escala contable, los tramos
    de ortografía)
  - data/reglas-lexicas.json ... el umbral de dimensiones sostenibles
  - data/verbos.json ........... el banco, para la proyección a 1.ª persona
  - js/validador.js ............ cuántas reglas vigila (SDD §10) y los umbrales de peso
  - js/motor.js ................ puerta de aplicabilidad (SDD §8), tiempos de
    corrección, tope de la lista de cotejo y del descuento, y primeraPersona()
  - js/ui.js, js/calificar.js, js/modo-avanzado.js ... el nombre de cada pestaña
    y de cada botón, tal como lo ve el docente

La autoevaluación del ejemplo del lenguaje sencillo no se escribe a mano: la
conjuga primeraPersona() de js/motor.js, ejecutada con Node (el mismo que corre
test/). Así la guía enseña lo que imprime la app y no lo que alguien cree que
imprime.

Las remisiones entre apartados («apartado 9») se resuelven por clave
(SECCIONES), no por número: añadir un apartado no deja referencias viejas.

El estilo de la prosa sigue el análisis de voz humana del proyecto de Lengua
(skill `comentar-redaccion`, `proyecto/documentos_base/Analisis-estilo_
comentarios-de-correccion.md`): el ejemplo antes que la regla, tú e
imperativo, palabras exactas y no de prestigio, sin fórmulas de cierre, y la
duda escrita donde la hay.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))
from huella import huella_fnv1a  # noqa: E402

SALIDA = RAIZ / "docs" / "Taller-de-Rubricas_Guia-para-empezar.docx"
URL_APP = "https://josele-duplex.github.io/rubricas/"
FECHA = "28 de septiembre de 2026"
TITULO = "Guía para empezar"

# Paleta y tipografía: las mismas de css/styles.css, para que el papel y la
# pantalla no parezcan dos productos distintos.
FUENTE = "Palatino Linotype"
TINTA = RGBColor(0x1C, 0x1F, 0x26)
TINTA_SUAVE = RGBColor(0x4A, 0x4F, 0x5A)
ACENTO = RGBColor(0x7A, 0x3B, 0x2E)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)
PAPEL_CAJA = "F1E4D9"
PAPEL_TABLA = "F4F2EE"
LINEA = "D8D3CA"
ANCHO_TEXTO = 16.6  # cm: A4 menos los dos márgenes de 2,2

# Los ejemplos que la guía cita. Si alguno desaparece del pack, el script
# falla aquí en vez de imprimir un ejemplo que la app ya no tiene.
EJEMPLO_SENCILLO = "lcl-b-coherencia-arg-4eso"
EJEMPLO_MATRIZ = ("lcl-b-cohesion-arg-4eso", "Variedad y matización de los conectores")
EJEMPLO_EVIDENCIA = "lcl-b-preguntas-oral-4eso"

# Orden de los apartados. La guía remite a ellos por clave (n("calificar")).
SECCIONES = [
    "primero", "decisiones", "instrumentos", "ficha", "sencillo", "vigila", "ajustar",
    "calificar", "exportar", "contenido", "limites", "casos", "dudas", "glosario",
]


def n(clave: str) -> str:
    return str(SECCIONES.index(clave) + 1)


# ------------------------------------------------------------------- datos

def _leer(ruta: str) -> str:
    return (RAIZ / ruta).read_text(encoding="utf-8")


def _json(ruta: str):
    return json.loads(_leer(ruta))


def _bloque(texto: str, arranque: str, fin: str = "\n};") -> str:
    inicio = texto.index(arranque)
    return texto[inicio: texto.index(fin, inicio)]


def leer_packs() -> dict:
    """mote -> lista de criterios, para todos los packs de LCL."""
    packs = {}
    for ruta in sorted((RAIZ / "data").glob("pack-lcl-*.json")):
        mote = ruta.stem.removeprefix("pack-lcl-")
        packs[mote] = json.loads(ruta.read_text(encoding="utf-8"))
    return packs


def sencillo_vigente(descriptor: dict) -> bool:
    """La misma condición que descriptorParaAlumno() en js/motor.js."""
    alumno = descriptor.get("alumno")
    return bool(alumno) and alumno.get("origen") == huella_fnv1a(descriptor["texto"])


def buscar_criterio(packs: dict, id_criterio: str) -> dict:
    for pack in packs.values():
        for c in pack["criterios"]:
            if c["id"] == id_criterio:
                return c
    raise SystemExit("generar_manual: el ejemplo " + id_criterio + " ya no está en ningún pack")


def cobertura_sencilla(packs: dict) -> dict:
    """(mote, curso) -> «completa» o «parcial», según cuántos descriptores
    tienen versión sencilla vigente."""
    cobertura = {}
    for mote, pack in packs.items():
        por_curso = {}
        for c in pack["criterios"]:
            vigentes = [sencillo_vigente(c["descriptores"]["n" + str(i)]) for i in range(1, 5)]
            por_curso.setdefault(c["curso"], []).extend(vigentes)
        for curso, marcas in por_curso.items():
            if all(marcas):
                cobertura[(mote, curso)] = "completa"
            elif any(marcas):
                cobertura[(mote, curso)] = "parcial"
    return cobertura


def primera_persona(pares: list) -> list:
    """Conjuga en 1.ª persona con primeraPersona() de js/motor.js."""
    script = (
        'import { readFileSync } from "node:fs";'
        'import { pathToFileURL } from "node:url";'
        "const raiz = process.env.RUBRICAS_RAIZ;"
        'const { primeraPersona } = await import(pathToFileURL(raiz + "/js/motor.js").href);'
        'const verbos = JSON.parse(readFileSync(raiz + "/data/verbos.json", "utf8")).verbos;'
        "const porId = Object.fromEntries(verbos.map((v) => [v.id, v]));"
        'const pares = JSON.parse(readFileSync(0, "utf8"));'
        "console.log(JSON.stringify(pares.map(([t, v]) => primeraPersona(t, v, porId))));"
    )
    salida = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        input=json.dumps(pares, ensure_ascii=False), capture_output=True, text=True,
        encoding="utf-8", env={**os.environ, "RUBRICAS_RAIZ": str(RAIZ)}, check=True,
    )
    return json.loads(salida.stdout)


def leer_codigo() -> dict:
    motor = _leer("js/motor.js")
    validador = _leer("js/validador.js")
    ui = _leer("js/ui.js")
    calificar = _leer("js/calificar.js")
    avanzado = _leer("js/modo-avanzado.js")

    bloque = _bloque(motor, "export const PUERTA_APLICABILIDAD")
    puertas = dict(zip(re.findall(r"^  (\w+): \{", bloque, re.M),
                       re.findall(r'etiqueta:\s*"([^"]+)"', bloque)))

    tiempos = re.findall(r'etiqueta:\s*"([^"]+)",\s*prioridades:\s*\[([^\]]*)\]',
                         _bloque(motor, "export const TIEMPOS_CORRECCION"))

    detractor = _bloque(motor, "export const DETRACTOR_ESTIMACION")
    cotejo = _bloque(motor, "export function generarListaCotejo", "\n}\n")

    botones = dict(re.findall(r'id="(btn-[\w-]+)" type="button">([^<]+)</button>', ui))
    for fuente in (calificar, avanzado):
        botones.update(re.findall(r'<button id="([\w-]+)" type="button"[^>]*>\s*([^<]+?)\s*</button>',
                                  fuente))

    return {
        "reglas": len(re.findall(r"^  ([a-z_]+):", _bloque(validador, "export const REGLAS"), re.M)),
        "peso_max": int(re.search(r"peso_normalizado > (\d+)", validador).group(1)),
        "peso_min": int(re.search(r"peso_normalizado < (\d+)", validador).group(1)),
        "puertas": puertas,
        "tiempos": [(etiqueta, [int(p) for p in prioridades.split(",")]) for etiqueta, prioridades in tiempos],
        "detractor": {
            "concepto": re.search(r'concepto:\s*"([^"]+)"', detractor).group(1),
            "tope": int(re.search(r"tope:\s*(\d+)", detractor).group(1)),
        },
        "max_cotejo": int(re.search(r"\.slice\(0, (\d+)\)", cotejo).group(1)),
        "pestanas": re.findall(r'\["\w+", "([^"]+)"\]', _bloque(ui, "const pestanas = [", "\n  ]")),
        "botones": botones,
    }


def leer_datos() -> dict:
    catalogo = _json("data/catalogo.json")
    lcl = catalogo["materias"]["LCL"]
    derivacion = _json(lcl["derivacion"])
    packs = leer_packs()

    criterios = [c for pack in packs.values() for c in pack["criterios"]]

    ortografia = {}
    for mote in ("resumen", "expositivo"):
        for c in packs[mote]["criterios"]:
            if c["curso"] != "4ESO":
                continue
            for comp in (c.get("matriz_cuantitativa") or {}).get("componentes", []):
                if comp["nombre"].startswith("Ortografía"):
                    ultimo = comp["bandas"][-1]["condicion"]
                    ortografia[mote] = (len(comp["bandas"]), int(re.match(r"(\d+)", ultimo).group(1)))

    con_evidencia = [(mote, c) for mote, pack in packs.items()
                     for c in pack["criterios"] if c.get("condicion_de_evidencia")]

    return {
        "cursos": catalogo["cursos"],
        "niveles": catalogo["niveles"],
        "tipos_tarea": lcl["tipos_tarea"],
        "matriz": derivacion["matriz_tareas"],
        "packs": packs,
        "criterios": len(criterios),
        "matrices": sum(1 for c in criterios if c.get("matriz_cuantitativa")),
        "umbral_dimensiones": _json("data/reglas-lexicas.json")["comun"]["umbrales"]["dimensiones_sostenibles"],
        "cobertura": cobertura_sencilla(packs),
        "ortografia": ortografia,
        "con_evidencia": con_evidencia,
        **leer_codigo(),
    }


UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
            "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
            "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
            "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho",
            "veintinueve", "treinta"]


def palabra(numero: int, genero: str = "m") -> str:
    """El número en letra delante de un sustantivo: «veintiún tipos», «veintiuna reglas»."""
    if numero >= len(UNIDADES):
        return str(numero)
    texto = UNIDADES[numero]
    if texto.endswith("uno"):
        texto = texto[:-3] + ("una" if genero == "f" else ("ún" if numero > 1 else "un"))
    return texto


def enumerar(items: list) -> str:
    items = list(items)
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " y " + items[-1]


def minuscula_inicial(texto: str) -> str:
    return texto[:1].lower() + texto[1:]


# -------------------------------------------------------------- utilidades docx

def sombrear(celda, color_hex: str) -> None:
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), color_hex)
    celda._tc.get_or_add_tcPr().append(shd)


def bordes(tabla, color_hex: str = LINEA, solo_horizontales: bool = True) -> None:
    borders = OxmlElement("w:tblBorders")
    dibujados = ["top", "bottom", "insideH"] if solo_horizontales else [
        "top", "left", "bottom", "right", "insideH", "insideV"]
    apagados = ["left", "right", "insideV"] if solo_horizontales else []
    for lado in dibujados:
        el = OxmlElement("w:" + lado)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "6")
        el.set(qn("w:color"), color_hex)
        borders.append(el)
    for lado in apagados:
        el = OxmlElement("w:" + lado)
        el.set(qn("w:val"), "none")
        borders.append(el)
    tabla._tbl.tblPr.append(borders)


def _fuente(rpr) -> None:
    """Fija la fuente y quita las de tema, que en los estilos de título de la
    plantilla por defecto mandan sobre w:ascii."""
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in list(rfonts.attrib):
        if "theme" in attr.lower():
            del rfonts.attrib[attr]
    for attr in ("w:ascii", "w:hAnsi", "w:cs"):
        rfonts.set(qn(attr), FUENTE)


def pintar(run, *, size=10.5, bold=False, italic=False, color=TINTA):
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color
    _fuente(run._element.get_or_add_rPr())
    return run


def escribir(parrafo, texto: str, *, size=10.5, color=TINTA, italic=False, bold=False):
    """Marcado mínimo dentro del texto: **negrita** y *cursiva*. La cursiva es
    la misma marca de los packs para las formas citadas (*aunque*, *esta
    medida*), así que un descriptor se copia tal cual y sale como en la app."""
    for trozo in re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*)", texto):
        if not trozo:
            continue
        if trozo.startswith("**") and trozo.endswith("**"):
            pintar(parrafo.add_run(trozo[2:-2]), size=size, bold=True, color=color, italic=italic)
        elif trozo.startswith("*") and trozo.endswith("*") and len(trozo) > 1:
            pintar(parrafo.add_run(trozo[1:-1]), size=size, bold=bold, color=color, italic=not italic)
        else:
            pintar(parrafo.add_run(trozo), size=size, bold=bold, color=color, italic=italic)
    return parrafo


def campo_pagina(parrafo, size=8.5) -> None:
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    tam = OxmlElement("w:sz")
    tam.set(qn("w:val"), str(int(size * 2)))
    rpr.append(tam)
    run.append(rpr)
    t = OxmlElement("w:t")
    t.text = "1"
    run.append(t)
    fld.append(run)
    parrafo._p.append(fld)


class Guia:
    def __init__(self):
        self.doc = Document()
        self.seccion_actual = 0
        seccion = self.doc.sections[0]
        seccion.page_width, seccion.page_height = Cm(21), Cm(29.7)
        seccion.left_margin = seccion.right_margin = Cm(2.2)
        seccion.top_margin = seccion.bottom_margin = Cm(2.0)

        normal = self.doc.styles["Normal"]
        normal.font.name = FUENTE
        normal.font.size = Pt(10.5)
        normal.font.color.rgb = TINTA
        normal.paragraph_format.space_after = Pt(6)
        normal.paragraph_format.line_spacing = 1.12
        _fuente(normal.element.get_or_add_rPr())

        # Títulos con los estilos de Word, no con párrafos pintados a mano:
        # así aparecen en el panel de navegación y se puede sacar un índice.
        for nombre, tam, color in (("Heading 1", 15, ACENTO), ("Heading 2", 11.5, TINTA)):
            estilo = self.doc.styles[nombre]
            estilo.font.size = Pt(tam)
            estilo.font.bold = True
            estilo.font.italic = False
            estilo.font.color.rgb = color
            _fuente(estilo.element.get_or_add_rPr())

        # Español para el corrector de Word; la plantilla trae inglés.
        for lang in self.doc.styles.element.iter(qn("w:lang")):
            lang.set(qn("w:val"), "es-ES")

        propiedades = self.doc.core_properties
        propiedades.title = "Taller de Rúbricas · " + TITULO
        propiedades.subject = "Guía del docente"
        propiedades.author = "Taller de Rúbricas"
        propiedades.last_modified_by = "scripts/generar_manual.py"
        propiedades.language = "es-ES"
        propiedades.keywords = "rúbricas, LOMLOE, Lengua Castellana y Literatura, Región de Murcia"

        # Pie con número de página, salvo en la portada.
        # El estilo «Footer» de la plantilla trae tabulaciones para carta
        # (centro y derecha a 8,25 y 16,5 cm): se quitan para que el número
        # quede en el margen derecho de un A4.
        seccion.different_first_page_header_footer = True
        self.doc.styles["Footer"].paragraph_format.tab_stops.clear_all()
        pie = seccion.footer.paragraphs[0]
        pie.paragraph_format.tab_stops.add_tab_stop(Cm(ANCHO_TEXTO), WD_TAB_ALIGNMENT.RIGHT)
        pintar(pie.add_run("Taller de Rúbricas · " + TITULO + "\t"), size=8.5, color=TINTA_SUAVE)
        campo_pagina(pie)

    def portada(self, titulo, subtitulo, claim):
        tabla = self.doc.add_table(rows=1, cols=1)
        tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
        celda = tabla.cell(0, 0)
        sombrear(celda, "1C1F26")
        primero = celda.paragraphs[0]
        primero.paragraph_format.space_before = Pt(12)
        primero.paragraph_format.space_after = Pt(2)
        pintar(primero.add_run(titulo), size=26, bold=True, color=BLANCO)
        p = celda.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        pintar(p.add_run(subtitulo), size=13, color=RGBColor(0xE0, 0xA7, 0x93))
        p = celda.add_paragraph()
        p.paragraph_format.space_after = Pt(14)
        pintar(p.add_run(claim), size=10.5, italic=True, color=RGBColor(0xD8, 0xD3, 0xCA))
        self.doc.add_paragraph().paragraph_format.space_after = Pt(0)

    def linea(self, texto, *, size=9.5, color=TINTA_SUAVE, italic=False):
        return escribir(self.doc.add_paragraph(), texto, size=size, color=color, italic=italic)

    def h1(self, clave, texto):
        # El orden de construir() tiene que ser el de SECCIONES; si no, las
        # remisiones «apartado N» apuntarían a otro sitio.
        esperada = SECCIONES[self.seccion_actual]
        if clave != esperada:
            raise SystemExit("generar_manual: el apartado «" + clave + "» llega donde tocaba «"
                             + esperada + "»")
        self.seccion_actual += 1
        p = self.doc.add_paragraph(style="Heading 1")
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        pintar(p.add_run(n(clave) + " · " + texto), size=15, bold=True, color=ACENTO)
        return p

    def h2(self, texto):
        p = self.doc.add_paragraph(style="Heading 2")
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        escribir(p, texto, size=11.5, bold=True)
        return p

    def p(self, texto, **kw):
        return escribir(self.doc.add_paragraph(), texto, **kw)

    def puntos(self, items):
        for item in items:
            p = self.doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(3)
            escribir(p, item)

    def cita(self, texto):
        """Un texto de la app copiado tal cual: sangrado y con filete a la izquierda."""
        p = self.doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(8)
        borde = OxmlElement("w:pBdr")
        izquierda = OxmlElement("w:left")
        for attr, valor in (("w:val", "single"), ("w:sz", "18"), ("w:space", "8"), ("w:color", "7A3B2E")):
            izquierda.set(qn(attr), valor)
        borde.append(izquierda)
        p._p.get_or_add_pPr().append(borde)
        escribir(p, texto, size=10, color=TINTA_SUAVE)
        return p

    def caja(self, titulo, texto):
        tabla = self.doc.add_table(rows=1, cols=1)
        celda = tabla.cell(0, 0)
        sombrear(celda, PAPEL_CAJA)
        bordes(tabla, color_hex="E0C9B8", solo_horizontales=False)
        destino = celda.paragraphs[0]
        destino.paragraph_format.space_before = Pt(5)
        if titulo:
            destino.paragraph_format.space_after = Pt(2)
            pintar(destino.add_run(titulo), size=10, bold=True, color=ACENTO)
            destino = celda.add_paragraph()
        destino.paragraph_format.space_after = Pt(5)
        escribir(destino, texto, size=10)
        # Una caja no se parte entre dos páginas: el título sin su texto no dice nada.
        tabla.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
        self.doc.add_paragraph().paragraph_format.space_after = Pt(0)

    def tabla(self, cabecera, filas, anchos=None, centrar_desde=None):
        t = self.doc.add_table(rows=1, cols=len(cabecera))
        bordes(t)
        t.autofit = anchos is None
        for i, texto in enumerate(cabecera):
            celda = t.rows[0].cells[i]
            sombrear(celda, PAPEL_TABLA)
            par = celda.paragraphs[0]
            par.paragraph_format.space_before = Pt(3)
            par.paragraph_format.space_after = Pt(3)
            if centrar_desde is not None and i >= centrar_desde:
                par.alignment = WD_ALIGN_PARAGRAPH.CENTER
            escribir(par, texto, size=9.5, bold=True)
        for fila in filas:
            celdas = t.add_row().cells
            for i, texto in enumerate(fila):
                lineas = texto.split("\n")
                par = celdas[i].paragraphs[0]
                for j, linea in enumerate(lineas):
                    if j:
                        par = celdas[i].add_paragraph()
                    par.paragraph_format.space_before = Pt(3 if j == 0 else 0)
                    par.paragraph_format.space_after = Pt(3)
                    if centrar_desde is not None and i >= centrar_desde:
                        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    escribir(par, linea, size=9.5 if j == 0 else 8.5,
                             color=TINTA if j == 0 else TINTA_SUAVE)
        # La cabecera se repite si la tabla salta de página, y ninguna fila
        # se parte entre dos páginas.
        for k, fila in enumerate(t.rows):
            trpr = fila._tr.get_or_add_trPr()
            if k == 0:
                cabeza = OxmlElement("w:tblHeader")
                cabeza.set(qn("w:val"), "true")
                trpr.append(cabeza)
            trpr.append(OxmlElement("w:cantSplit"))
        if anchos:
            for fila in t.rows:
                for i, ancho in enumerate(anchos):
                    fila.cells[i].width = Cm(ancho)
            for i, columna in enumerate(t._tbl.tblGrid.findall(qn("w:gridCol"))):
                columna.set(qn("w:w"), str(Cm(anchos[i]).twips))
        self.doc.add_paragraph().paragraph_format.space_after = Pt(0)
        return t

    def salto(self):
        self.doc.add_page_break()


# ------------------------------------------------------------------ el texto

def construir(d: dict) -> Guia:
    g = Guia()
    tareas = d["tipos_tarea"]
    cursos = d["cursos"]
    corto = cursos["etiquetas_cortas"]
    niveles = d["niveles"]
    nombre_nivel = {int(k): v for k, v in niveles["nombres"].items()}
    n_tareas = len(tareas)
    celdas = d["matriz"]["celdas"]
    n_celdas = sum(len(v) for v in celdas.values())
    puertas = d["puertas"]
    botones = d["botones"]
    detractor = d["detractor"]
    packs = d["packs"]

    def boton(id_boton):
        if id_boton not in botones:
            raise SystemExit("generar_manual: el botón «" + id_boton + "» ya no está en la interfaz")
        return "«" + botones[id_boton] + "»"

    def combinacion(tarea, curso):
        """Los criterios de una tarea en un curso; falla si la guía cita una
        combinación que el currículo no abre."""
        if curso not in celdas.get(tarea, {}):
            raise SystemExit("generar_manual: un caso cita " + tarea + " en " + curso
                             + ", que la matriz no abre")
        return [c for c in packs[tarea]["criterios"] if c["curso"] == curso]

    cobertura = d["cobertura"]
    orden_cursos = cursos["orden"]
    cursos_sencillo = [c for c in orden_cursos if any(k[1] == c for k in cobertura)]
    cursos_sencillo_txt = enumerar([corto[c] for c in cursos_sencillo]) if cursos_sencillo else ""

    g.portada("Taller de Rúbricas", TITULO,
              "Cómo se usa en clase, pantalla a pantalla, y por qué hace lo que hace.")
    g.linea("Lengua Castellana y Literatura · LOMLOE · Región de Murcia")
    g.linea("Funciona en el navegador, sin cuentas y sin conexión, y se instala en el iPad, en "
            "Android o en el ordenador. Contenido a " + FECHA + ".")
    g.linea(URL_APP, color=ACENTO)

    g.caja("Si nunca has hecho una rúbrica, esta guía empieza por ti",
           "No vas a redactar descriptores ni a decidir cuántos niveles poner, porque eso ya está "
           "escrito y sale del decreto: tú dices qué vas a evaluar, en qué curso y cuánto tiempo "
           "tienes para corregir, y la app monta el instrumento y la hoja que se lleva el alumno. "
           "La primera vez deberían bastarte tres minutos.")

    g.h2("Por dónde empezar")
    g.tabla(["Si…", "Lee"], [
        ["vas a usarla mañana por primera vez",
         "los apartados " + n("decisiones") + ", " + n("instrumentos") + " y " + n("ficha")],
        ["tus alumnos no entienden las rúbricas", "el " + n("sencillo")],
        ["tienes que poner nota", "el " + n("calificar")],
        ["llevas el curso en iDoceo", "el " + n("exportar")],
        ["quieres ver un caso parecido al tuyo", "el " + n("casos")],
    ], anchos=[10.6, 6.0])

    # ----------------------------------------------------------------------
    g.h1("primero", "Antes de nada: lo que no hace falta")
    g.p("Lo que suele preguntarse antes de abrirla por primera vez:")
    g.puntos([
        "**No hay que registrarse.** No pide correo ni contraseña, ni el nombre de ningún alumno "
        "para funcionar.",
        "**No sale nada de tu equipo.** Todo ocurre en el navegador. Si la instalas en el iPad, en "
        "Android o en el ordenador, funciona también sin internet.",
        "**Equivocarse no cuesta nada.** Si eliges mal, cambias el desplegable y generas otra vez.",
        "**Nada está inventado.** Cada fila de la rúbrica lleva debajo, copiado literalmente, el "
        "criterio de evaluación del decreto del que sale. Si un curso no sostiene una tarea, la app "
        "no te la ofrece.",
        "**Se aprende usándola.** Casi todos los controles tienen al lado un «¿por qué?» que se "
        "despliega en dos o tres líneas. No se imprime: es para ti.",
        "**Lo que haces se lleva a otra parte.** Se imprime, se guarda en PDF o sale en «.csv» "
        "para una hoja de cálculo o para iDoceo (apartado " + n("exportar") + ").",
    ])

    # ----------------------------------------------------------------------
    g.h1("decisiones", "La app en tres decisiones")
    g.p("La pantalla de inicio se llama «modo exprés». Tiene tres preguntas numeradas y una línea "
        "para escribir la actividad; cuando las rellenas, pulsas «Generar».")
    tiempos = d["tiempos"]
    corto_t, largo_t = tiempos[0], tiempos[-1]
    g.tabla(["Lo que te pregunta", "Qué significa"], [
        ["1 · ¿Qué vas a evaluar?",
         "Dos desplegables. El **tipo de prueba** decide si una rúbrica tiene sentido (la tabla "
         "de abajo dice qué hace la app con cada respuesta). El **tipo de tarea** es lo que has "
         "mandado; hoy hay " + palabra(n_tareas) + ": " + enumerar(
             [t[:1].lower() + t[1:] for t in tareas.values()]) + "."],
        ["2 · ¿Qué curso?",
         "Solo salen los cursos en los que el currículo sostiene esa tarea. Si falta el tuyo, no "
         "es un olvido: el decreto no pide esa tarea en ese curso."],
        ["3 · ¿Cuánto tiempo tienes?",
         palabra(len(tiempos), "f").capitalize() + " opciones, de «" + corto_t[0] + "» a «"
         + largo_t[0] + "». De la respuesta depende cuántas dimensiones entran: con poco tiempo, "
         "solo las de primera prioridad; con el más largo, también las de segunda y tercera. Así "
         "no acabas con una rúbrica de doce filas que nadie corrige dos veces."],
        ["La actividad",
         "La escribes con tus palabras, por ejemplo «Texto expositivo sobre el reciclaje en el "
         "instituto». Sale en la cabecera de cada instrumento y en la ficha, que es donde la lee el "
         "alumno."],
    ], anchos=[4.4, 12.2])
    if corto_t[1] != [1] or largo_t[1] != [1, 2, 3]:
        raise SystemExit("generar_manual: los tiempos de corrección ya no reparten las "
                         "prioridades como dice el apartado 2")

    g.h2("La primera pregunta también puede decirte que no")
    g.p("Una rúbrica sirve para graduar la calidad de algo, y hay pruebas en las que no hay calidad "
        "que graduar. Por eso la app mira el tipo de prueba antes de generar nada:")
    g.tabla(["Si respondes…", "La app hace esto"], [
        [puertas["objetiva"],
         "**No genera rúbrica** y explica por qué: en un test hay aciertos y errores, no grados."],
        [puertas["desarrollo_largo"],
         "Abre la **escala de estimación**: cada apartado se puntúa con un número, hasta su "
         "máximo, sin elegir entre cuatro descriptores."],
        [puertas["desempeno"],
         "Abre la **rúbrica analítica** completa. Es el caso para el que está pensada. Al "
         "elegirla, la app explica qué cuenta como actividad competencial: lo mismo un resumen o "
         "un comentario que un podcast o un folleto."],
        [puertas["proceso"],
         "Propone la **lista de cotejo** o la rúbrica de un solo punto. Corregir un ejercicio "
         "diario con la rúbrica completa cuesta más de lo que devuelve."],
        [puertas["fase_texto"],
         "Marca solo las dimensiones de proceso (planificar, redactar el borrador, revisar) y abre "
         "la lista de cotejo. En un esquema todavía no hay cohesión que mirar."],
    ], anchos=[6.2, 10.4])
    g.caja("", "Es una propuesta, no un bloqueo. Si prefieres otro instrumento, pinchas otra pestaña "
               "y sigues.")

    # ----------------------------------------------------------------------
    pestanas = d["pestanas"]
    g.h1("instrumentos", "Lo que te entrega: " + palabra(len(pestanas)) + " instrumentos")
    g.p("Al pulsar «Generar» aparece la vista previa con " + palabra(len(pestanas), "f")
        + " pestañas, y se abre sola la que mejor encaja con lo que respondiste en el modo exprés, "
        "aunque las demás siguen a un clic por si quieres comparar o imprimir otra. No hace falta "
        "usarlas todas.")
    descripcion = {
        "Rúbrica analítica": (
            "La tabla completa: una fila por dimensión, los cuatro niveles en columnas, el peso de "
            "cada fila y, bajo el nombre, el criterio oficial citado. Algunas filas añaden «Para "
            "poder evaluarla» (lo ves más abajo).",
            "Producto final: el texto entregado, la exposición hecha."),
        "Lista de cotejo": (
            "Los mismos contenidos en frases de sí o no, cada una con su casilla. Como mucho, "
            + palabra(d["max_cotejo"], "f") + ".",
            "Tarea diaria o intermedia, cuando corregir con la rúbrica completa no compensa."),
        "Ficha del alumno": (
            "La hoja que repartes antes de la prueba. Se genera siempre (apartado " + n("ficha")
            + ") y, si el curso la tiene, en versión sencilla (apartado " + n("sencillo") + ").",
            "Siempre. Se reparte y se comenta antes de que empiecen."),
        "Rúbrica de un punto": (
            "Solo la columna de lo esperado, con dos columnas en blanco para anotar evidencias de "
            "mejora y de excelencia. Una o dos dimensiones.",
            "Borradores y comentarios personalizados."),
        "Autoevaluación": (
            "La misma matriz en primera persona («Utilizo…», «Reconozco…»). La conjuga el motor "
            "con el banco de verbos, sin errores de concordancia, y en versión sencilla si el curso "
            "la tiene.",
            "Durante el proceso, para que el alumno se sitúe antes de entregar."),
        "Coevaluación": (
            "La autoevaluación con el nombre del compañero evaluado y un comentario obligatorio "
            "por dimensión.",
            "Trabajo entre iguales. Sin comentario escrito, la coevaluación acaba en un reparto de "
            "notas entre amigos."),
        "Escala de estimación": (
            "Puntuación directa por apartado, con el máximo de cada uno y los puntos desde los "
            "que empieza cada nivel. El descuento por " + detractor["concepto"].lower()
            + " (tope −" + str(detractor["tope"]) + ") solo aparece si la ortografía no tiene "
            "apartado propio.",
            "Desarrollo largo, comentario de texto, exámenes."),
    }
    faltan = [p for p in pestanas if p not in descripcion]
    if faltan:
        raise SystemExit("generar_manual: la guía no describe la pestaña «" + faltan[0] + "»")
    g.tabla(["Instrumento", "Qué es", "Cuándo lo usas"],
            [[p, *descripcion[p]] for p in pestanas], anchos=[3.4, 7.2, 6.0])

    g.p("Junto a las pestañas hay cinco botones más: " + boton("btn-ajustar") + " (apartado "
        + n("ajustar") + "), " + boton("btn-calificar") + " (apartado " + n("calificar") + "), "
        + boton("btn-exportar-idoceo") + " (apartado " + n("exportar") + "), "
        + boton("btn-imprimir") + " y " + boton("btn-imprimir-breve") + ". El de imprimir manda a "
        "la impresora, o a «Guardar como PDF», la pestaña que tengas delante. Sin los «¿por qué?»: "
        "en el papel del aula sobran.")
    g.caja("La hoja que el alumno tiene en la mesa",
           boton("btn-imprimir-breve") + " saca en una hoja la tabla de los cuatro niveles de la "
           "ficha y nada más, tengas abierta la pestaña que tengas. Es la que conviene que el "
           "alumno tenga delante mientras escribe.")

    ejemplo_ev = buscar_criterio(packs, EJEMPLO_EVIDENCIA)
    motes_ev = {mote for mote, _ in d["con_evidencia"]}
    tareas_ev = ["«" + etiqueta + "»" for mote, etiqueta in tareas.items() if mote in motes_ev]
    g.h2("«Para poder evaluarla»: lo que tienes que preparar tú")
    g.p("Hay filas que solo se pueden puntuar si la tarea les deja sitio. En la exposición oral de "
        + corto[ejemplo_ev["curso"]] + ", la dimensión «" + ejemplo_ev["nombre"] + "» lleva "
        "debajo esta línea:")
    g.cita(ejemplo_ev["condicion_de_evidencia"])
    g.p("Si no reservas ese turno, la fila se califica igual y nada te avisa, así que estas "
        "líneas se leen al preparar la tarea, cuando todavía puedes hacerle sitio en la sesión, y "
        "no al corregirla, cuando ya no tiene arreglo. Solo salen en la rúbrica analítica, porque "
        "son para quien evalúa. Hoy las llevan " + str(len(d["con_evidencia"]))
        + " filas de " + palabra(len(tareas_ev), "f") + " tareas: " + enumerar(tareas_ev) + ".")

    # ----------------------------------------------------------------------
    g.h1("ficha", "La ficha del alumno se genera siempre")
    g.p("Si el alumno tiene que conocer la rúbrica antes de la prueba, eso no puede depender de "
        "que te acuerdes de marcar una casilla. Por eso la ficha no se puede quitar. Tiene seis "
        "bloques:")
    g.puntos([
        "**Qué se te pide**: la actividad, tal como la escribiste.",
        "**Qué se valora**: cada dimensión con su peso. Si los pesos no son iguales, una frase "
        "explica por qué, escrita para que la entienda el alumno. Si hay descuento por "
        + detractor["concepto"].lower() + ", también se anuncia aquí, con su tope.",
        "**Cómo llegar al nivel excelente**: el descriptor más alto de cada dimensión. Se lee "
        "como una instrucción, porque empieza por un verbo y dice qué hacer y con qué condición.",
        "**La rúbrica completa, en breve**: los cuatro niveles de cada dimensión, con su nombre y "
        "su peso. No lleva el criterio oficial ni la letra del bloque, que son datos para ti. No "
        "se recorta ningún descriptor, y tiene su propio botón de impresión.",
        "**Resultado de un alumno calificado**: un desplegable. En blanco, la ficha sirve para "
        "repartirla en clase; si eliges a un alumno que ya guardaste en «Calificar», enseña su "
        "nivel y sus puntos en cada dimensión y la nota final, para la devolución individual.",
        "**Cómo se calcula la nota**: una frase. Las cuentas, si las hay, están en «Calificar».",
    ])
    g.p("«Qué se valora», «Cómo llegar al nivel excelente» y la rúbrica breve salen en lenguaje "
        "sencillo cuando el curso lo tiene (apartado " + n("sencillo") + "). Falta una cosa. El "
        "guion para presentarla en clase está diseñado, pero todavía no está programado (apartado "
        + n("limites") + ").")

    # ----------------------------------------------------------------------
    g.h1("sencillo", "Dos redacciones del mismo descriptor: la tuya y la del alumno")
    ej = buscar_criterio(packs, EJEMPLO_SENCILLO)
    desc = ej["descriptores"]
    if not (sencillo_vigente(desc["n1"]) and sencillo_vigente(desc["n4"])):
        raise SystemExit("generar_manual: el ejemplo " + EJEMPLO_SENCILLO
                         + " ya no tiene versión sencilla vigente")
    auto_n1, auto_n4 = primera_persona([
        [desc["n1"]["alumno"]["texto"], desc["n1"]["alumno"]["verbo"]],
        [desc["n4"]["alumno"]["texto"], desc["n4"]["alumno"]["verbo"]],
    ])
    tarea_ej = next(m for m, p in packs.items() if ej in p["criterios"])
    g.p("Así se ve una misma dimensión del " + minuscula_inicial(tareas[tarea_ej]) + " de "
        + corto[ej["curso"]] + " en tres pestañas distintas:")
    g.tabla(["", "Rúbrica analítica · la lees tú", "Ficha · la lee el alumno",
             "Autoevaluación · en primera persona"], [
        ["Nombre", ej["nombre"], ej.get("nombre_alumno", ej["nombre"]),
         ej.get("nombre_alumno", ej["nombre"])],
        [nombre_nivel[1], desc["n1"]["texto"], desc["n1"]["alumno"]["texto"], auto_n1],
        [nombre_nivel[4], desc["n4"]["texto"], desc["n4"]["alumno"]["texto"], auto_n4],
    ], anchos=[2.2, 4.8, 4.8, 4.8])
    g.p("Las tres piden lo mismo. La del alumno cambia las palabras que en ese curso todavía no se "
        "manejan y deja el término técnico entre paréntesis, porque el currículo pide que el alumno "
        "lo vaya aprendiendo: en Bachillerato quedan más términos, en 1.º de ESO menos. La "
        "autoevaluación, pues, no se redacta aparte. La conjuga el motor.")

    g.h2("Cómo funciona")
    g.puntos([
        "**No hay que activar nada.** Si la tarea y el curso tienen versión sencilla, sale sola. "
        "Si no la tienen, el alumno lee la técnica, como hasta ahora.",
        "**Solo cambia lo que lee el alumno**: «Qué se valora», «Cómo llegar al nivel excelente», "
        "la rúbrica breve, la autoevaluación y la coevaluación. La rúbrica analítica, la lista de "
        "cotejo, la rúbrica de un punto, la escala de estimación y «Calificar» siguen en versión "
        "técnica, porque con ella calificas tú y es la que sale del currículo.",
        "**Si el técnico cambia, la sencilla se aparta.** Cada versión sencilla guarda una huella "
        "del texto técnico del que salió. Si ese texto se corrige, la huella deja de coincidir y "
        "la app vuelve a enseñar el técnico hasta que alguien redacte la sencilla nueva. El alumno "
        "nunca lee la traducción de algo que ya no se evalúa.",
        "**Pasa el mismo filtro.** Empieza por un verbo del banco, no admite *bien*, "
        "*adecuadamente* ni *bastante*, y la revisa el mismo validador que al técnico.",
    ])

    g.h2("En qué cursos está")
    combos = sorted(cobertura, key=lambda k: (orden_cursos.index(k[1]), list(tareas).index(k[0])))
    g.p("Se escribe bajo demanda, cuando un curso la va a usar en clase, y no antes. Por eso hoy "
        "cubre " + str(len(cobertura)) + " de las " + str(n_celdas) + " combinaciones de tarea y "
        "curso:")
    filas_cob = []
    for curso in cursos_sencillo:
        nombres = []
        for mote, c in combos:
            if c == curso:
                nombre = minuscula_inicial(tareas[mote])
                nombres.append(nombre + (" (en parte)" if cobertura[(mote, c)] == "parcial" else ""))
        filas_cob.append([corto[curso], enumerar(nombres).capitalize() + "."])
    g.tabla(["Curso", "Tareas con versión sencilla"], filas_cob, anchos=[2.6, 14.0])
    g.p("Queda una pregunta que solo se contesta en el aula: si el alumno entiende la ficha sin que "
        "se la expliques. No lo sabemos todavía. La forma rápida de mirarlo es poner al lado su "
        "autoevaluación y la nota que le pones, porque si en una dimensión las dos se separan en "
        "medio grupo, esa casilla de la versión sencilla no se está entendiendo y se puede "
        "reescribir sin tocar la técnica.")

    # ----------------------------------------------------------------------
    g.h1("vigila", "Mientras decides, la app vigila")
    g.p("Esto ocurre sin que lo pidas:")
    g.tabla(["Qué vigila", "Qué te dice"], [
        ["Salud del contenido",
         "Un validador con **" + palabra(d["reglas"], "f") + " reglas** revisa el pack al "
         "arrancar: que ningún descriptor diga «adecuadamente» o «bastante bien», que todos "
         "empiecen por un verbo observable, que el nivel más bajo describa lo que el alumno sí "
         "hace y no lo que le falta, y que ninguna penalización castigue dos veces lo mismo. Si "
         "todo está en orden, verás una sola línea: «Salud del pack: sin incidencias»."],
        ["Progresión dentro de la rúbrica",
         "Avisa si mezcla dimensiones con más de un nivel de diferencia en autonomía, complejidad "
         "o metalenguaje. Es una señal para revisar la combinación, no un error."],
        ["Reparto de pesos",
         "Avisa si una dimensión pasa del " + str(d["peso_max"]) + " % o baja del "
         + str(d["peso_min"]) + " %. Avisa y te deja seguir."],
        ["Complejidad",
         "Un indicador en verde, amarillo o rojo cuenta dimensiones y bloques. Si pasas de "
         + palabra(d["umbral_dimensiones"], "f") + " dimensiones en algo que no es un producto "
         "final, te avisa: más filas no dan más rigor, dan más horas de corrección."],
        ["Microexplicaciones",
         "Cada control lleva su «¿por qué?» desplegable. No se imprimen."],
    ], anchos=[4.2, 12.4])

    # ----------------------------------------------------------------------
    g.h1("ajustar", "«Ajustar»: cuando quieres cambiar algo")
    g.p("Desde la vista previa, " + boton("btn-ajustar") + " abre el modo avanzado. Hoy permite dos "
        "cosas:")
    g.puntos([
        "**Quitar o volver a poner dimensiones**, agrupadas por bloque del currículo (A, B, C y D). "
        "Si en esta tarea no vas a valorar la corrección normativa, la desmarcas.",
        "**Mover los pesos** con un deslizador de 0 a 100 por dimensión. Al soltarlo, el total se "
        "reparte otra vez hasta sumar 100 y una barra enseña el reparto. Si decides que la "
        "ortografía vale la mitad de la nota en esta tarea, la app te avisa y te deja: la decisión "
        "de calificar es tuya.",
    ])
    g.p(boton("guardar-ajuste") + " te devuelve a la vista previa con los cambios. Lo que trae el "
        "pack es un punto de partida, y lo que cambies se imprime en la ficha, así que el alumno "
        "sabrá con qué pesos se le corrige.")

    # ----------------------------------------------------------------------
    g.h1("calificar", "«Calificar»: de la rúbrica a la nota")
    g.p("No estás obligado a poner número. La app funciona entera en modo cualitativo, con el "
        "nivel alcanzado y su descriptor, que es lo que sirve para devolver un borrador; y cuando "
        "necesites la nota, porque llega la evaluación o porque la prueba la pide, "
        + boton("btn-calificar") + " la calcula y enseña de dónde sale cada punto.")
    g.h2("Los cuatro niveles y sus bandas")
    g.p("Cuatro niveles siempre, sin opción a cambiarlo. Los nombres y las bandas son los del "
        "material que ya se usa en clase, para que el alumno y su familia lean la misma palabra en "
        "todas partes.")
    orden = niveles["orden"]
    bandas = {1: "0 – 4,9", 2: "5 – 6,9", 3: "7 – 8,9", 4: "9 – 10"}
    g.tabla(["N" + str(k) + " · " + nombre_nivel[k] for k in orden],
            [[bandas[k] for k in orden]], centrar_desde=0)

    g.h2("La pantalla")
    g.p("Es la tabla de la rúbrica, como en iDoceo. En cada fila pinchas la casilla del "
        "descriptor que ha alcanzado el alumno (si te equivocas, la vuelves a pinchar y se "
        "desmarca), y la nota se recalcula a cada clic en una barra fija arriba, junto al nombre "
        "del alumno —y al descuento por " + detractor["concepto"].lower() + ", cuando lo hay—, "
        "de modo que nunca tienes que desplazarte para verla.")

    crit_m = buscar_criterio(packs, EJEMPLO_MATRIZ[0])
    comp = next((c for c in crit_m["matriz_cuantitativa"]["componentes"]
                 if c["nombre"] == EJEMPLO_MATRIZ[1]), None)
    if comp is None:
        raise SystemExit("generar_manual: el componente de ejemplo «" + EJEMPLO_MATRIZ[1]
                         + "» ya no existe")
    tarea_m = next(m for m, p in packs.items() if crit_m in p["criterios"])

    def puntos_txt(x):
        return (str(int(x)) if float(x).is_integer() else str(x).replace(".", ",")) + " pt"

    g.h2("Cuando la nota tiene que ser fina: «Contar»")
    g.p("Algunas dimensiones traen una matriz contable. Pulsas «Contar» y la fila se abre en "
        "componentes, cada uno con sus bandas. Este es el primero de la cohesión en el "
        + minuscula_inicial(tareas[tarea_m]) + " de " + corto[crit_m["curso"]] + ", «"
        + comp["nombre"] + "»:")
    g.tabla(["Puntos", "Lo que se cuenta"],
            [[puntos_txt(b["puntos"]), b["condicion"]] for b in comp["bandas"]],
            anchos=[2.0, 14.6], centrar_desde=None)
    g.p("Eso se cuenta, no se estima. Las dos vías valen: cuenta cuando la nota importa y pincha "
        "el descriptor cuando te basta con el nivel. Si pinchas un descriptor con la matriz "
        "abierta, la matriz se cierra.")

    tramos, ultimo_res = d["ortografia"]["resumen"]
    _, ultimo_exp = d["ortografia"]["expositivo"]
    g.h2("Lo demás que se hace en esa pantalla")
    g.puntos([
        "**Faltas por tramos.** Las bandas de ortografía no cuentan faltas a secas: se ajustan a "
        "la longitud esperada del texto, así que seis faltas no pesan lo mismo en un resumen que "
        "en un expositivo largo. Son " + palabra(tramos) + " tramos y cada tarea y curso tiene los "
        "suyos; en 4.º de ESO, el último empieza en " + str(ultimo_res) + " faltas en el resumen "
        "y en " + str(ultimo_exp) + " en el expositivo.",
        "**Penalizaciones con tope.** Cada una tiene el suyo declarado, y ninguna puede dejar una "
        "dimensión en negativo.",
        "**Descuento de " + detractor["concepto"].lower() + "**, en la barra de arriba, solo "
        "cuando la rúbrica no tiene la dimensión de corrección: si la tiene, las faltas ya "
        "cuentan en ella y restarlas otra vez sería castigarlas dos veces. Se resta de la nota ya "
        "calculada, hasta " + palabra(detractor["tope"]) + " puntos sobre 10 como mucho. En las "
        "tareas orales no aparece nunca.",
        "**Opciones de cálculo**, plegadas debajo de los botones. Ahí eliges la escala: la "
        "**equilibrada** (2,5 · 5 · 7,5 · 10), que viene de serie y no deja en cero a quien ha "
        "entregado algo, aunque sea flojo, o la **exigente** (0 · 5 · 7,5 · 10), que reserva el "
        "cero para el trabajo no hecho. Ahí está también la **condición mínima**, apagada de "
        "serie: si la activas, basta una dimensión marcada «obligatorio» en " + nombre_nivel[1]
        + " para que la nota no pase de 4,9. Actívala solo si lo anunciaste antes de la prueba.",
        "**Alumno por alumno.** " + boton("guardar-alumno") + " archiva la nota, vacía la tabla y "
        "deja el cursor en el nombre del siguiente. Si queda alguna dimensión sin marcar, no "
        "guarda. Las notas se quedan en tu equipo, agrupadas por actividad: puedes corregir "
        "treinta exámenes en tres tardes, recuperar a uno para retocarlo y borrarlas cuando "
        "quieras.",
        "**Exportar las notas** con " + boton("exportar-csv-notas") + ", junto a la lista de "
        "alumnos calificados (apartado " + n("exportar") + ").",
    ])
    g.caja("Por qué esta nota aguanta una reclamación",
           "Cada punto sale de un sitio que se puede enseñar: la dimensión, el criterio oficial "
           "citado, la banda que marcaste y el peso que el alumno leyó en su ficha antes de la "
           "prueba. Y ninguna penalización castiga lo que ya mide un componente: esa regla, la del "
           "doble castigo, está comprobada en todas las matrices del contenido, una por una.")

    # ----------------------------------------------------------------------
    g.h1("exportar", "Exportar la rúbrica o las notas, también a iDoceo")
    g.p("Los dos botones de exportación sacan un «.csv», que abre cualquier hoja de cálculo sin "
        "necesidad de conexión, y si usas iDoceo cada uno entra por uno de sus dos importadores, "
        "el de rúbricas o el de alumnos. Son caminos alternativos. Eliges uno por instrumento.")
    g.tabla(["El botón", "Qué exporta", "Qué pasa después"], [
        ["**" + botones["btn-exportar-idoceo"] + "**\nen la vista previa",
         "La rúbrica analítica en blanco, tengas abierta la pestaña que tengas: criterios por "
         "filas y niveles por columnas, con el peso de cada fila y el valor de cada nivel. "
         "Archivo «Rubrica_….csv».",
         "En iDoceo entra por el importador de rúbricas y calificas allí, tocando cada celda; la "
         "pantalla «Calificar» de esta app deja de usarse para ese instrumento. Sin iDoceo, tienes "
         "la matriz en Excel, Sheets o Calc."],
        ["**" + botones["exportar-csv-notas"] + "**\nen «Calificar»",
         "Una fila por alumno con la nota final del instrumento. Archivo «Notas_….csv».",
         "Sigues calificando aquí e iDoceo recibe solo el número, por su asistente general de "
         "importación de alumnos: la columna Alumno va a datos personales y la de Nota, al libro "
         "de calificaciones."],
    ], anchos=[4.2, 6.0, 6.4])
    g.caja("Por los dos caminos sale el mismo número",
           "Los valores de nivel que viajan en la rúbrica exportada son los de la escala "
           "equilibrada que usa «Calificar». Si calificas pinchando niveles, la nota coincide por "
           "las dos vías. Lo que iDoceo no tiene son las matrices contables: si quieres contar, "
           "califica aquí.")

    # ----------------------------------------------------------------------
    g.h1("contenido", "Qué contenido hay cargado hoy")
    g.p(palabra(n_tareas).capitalize() + " tipos de tarea, escritos curso a curso donde el "
        "currículo los sostiene: **" + str(n_celdas) + " combinaciones de tarea y curso**, con **"
        + str(d["criterios"]) + " criterios oficiales**, " + str(d["matrices"]) + " de ellos con "
        "matriz contable. La tabla tiene huecos a propósito. Una casilla vacía quiere decir que el "
        "decreto no pide esa tarea en ese curso.")
    simbolos = {k: v["simbolo"] for k, v in d["matriz"]["simbolos"].items()}
    filas = []
    for clave, etiqueta in tareas.items():
        fila = [etiqueta]
        for curso in orden_cursos:
            fila.append(simbolos.get(celdas.get(clave, {}).get(curso), ""))
        filas.append(fila)
    g.tabla(["Tipo de tarea"] + [corto[c] for c in orden_cursos],
            filas, anchos=[5.2] + [1.9] * len(orden_cursos), centrar_desde=1)
    g.p("**●**  la tarea o el género aparecen nombrados en los saberes de ese curso, además de "
        "estar sostenidos por su criterio de evaluación.    **○**  lo sostiene el criterio del "
        "curso, pero los saberes no lo nombran: la tarea es legítima y el foco del curso está en "
        "otro sitio. En los dos casos la rúbrica se genera igual.", size=9.5, color=TINTA_SUAVE)
    g.caja("", "Si buscas una tarea en una casilla vacía, la app no te la ofrece. Abrir esa casilla "
               "obligaría a inventar un criterio que el decreto no tiene.")

    # ----------------------------------------------------------------------
    g.h1("limites", "Lo que la app no hace")
    g.h2("Por decisión")
    g.puntos([
        "**No llama a ninguna inteligencia artificial.** No ejecuta prompts, no pide claves y no "
        "envía nada.",
        "**No pide cuentas, correos ni datos de menores.** No hay una versión en la que entre el "
        "alumno: el canal eres tú, que repartes la ficha.",
        "**No genera rúbrica para una prueba objetiva**, no ofrece una tarea en un curso que el "
        "currículo no sostiene y no admite tres ni cinco niveles.",
        "**No pone un criterio sin su cita del decreto.**",
    ])
    g.h2("Todavía no, pero está previsto")
    g.tabla(["Pieza pendiente", "Estado"], [
        ["Guion para presentar la ficha en clase",
         "Media página para ti: cómo abrir, un recorrido por las dimensiones, un "
         + nombre_nivel[2] + " frente a un " + nombre_nivel[4] + " y dos preguntas para el grupo. "
         "Diseñado, sin programar."],
        ["Guardar la configuración en «.json»",
         "Para reutilizar un montaje o pasárselo a un compañero de departamento. Diseñado, sin "
         "programar."],
        ["Rúbrica en «modo IA»",
         "El texto de la rúbrica preparado para corregir fuera con una IA, con su protocolo: "
         "anonimizar, exigir evidencias y firmar tú la nota. Diseñado, sin programar."],
        ["Más cosas en «Ajustar»",
         "Cambiar la profundidad sin volver atrás, marcar criterios obligatorios, elegir qué "
         "instrumentos se generan, cambiar de modo de calificación y editar descriptores con el "
         "validador delante."],
        ["Lenguaje sencillo en más cursos",
         ("Hoy está en " + cursos_sencillo_txt + ". " if cursos_sencillo else "")
         + "Los demás se redactan cuando un curso los vaya a usar."],
        ["Lenguaje sencillo en la lista de cotejo y la rúbrica de un punto",
         "Solo si se empiezan a repartir al alumno. Hoy son instrumentos del profesor."],
        ["Más tipos de tarea",
         "Lectura en voz alta, podcast, línea de tiempo y trabajo en grupo."],
        ["Banco de criterios favoritos",
         "Y una calculadora de carga de corrección. Pendientes."],
        ["Otras materias",
         "El diseño las admite sin tocar código, pero hoy solo hay contenido de Lengua Castellana "
         "y Literatura."],
        ["Enlace compartible y QR · adaptación NEAE",
         "Fuera de esta versión."],
        ["Recoger las autoevaluaciones del alumnado",
         "Descartado por ahora: exigiría un servidor y tratar datos de menores."],
    ], anchos=[5.6, 11.0])

    # ----------------------------------------------------------------------
    oral_1eso = combinacion("oral", "1ESO")
    if not any(c.get("condicion_de_evidencia") for c in oral_1eso):
        raise SystemExit("generar_manual: el caso 3 cuenta con el turno de preguntas del oral de 1.º ESO")
    inv_4eso = combinacion("investigacion", "4ESO")
    if not any(c.get("condicion_de_evidencia") for c in inv_4eso) or not packs["investigacion"].get("razon_peso"):
        raise SystemExit("generar_manual: el caso 5 cuenta con el soporte y la razón de peso de investigación")
    narr_2eso = combinacion("narracion", "2ESO")
    if cobertura.get(("narracion", "2ESO")) != "completa":
        raise SystemExit("generar_manual: el caso 7 necesita la narración de 2.º ESO en versión sencilla")
    correccion = next(c for c in narr_2eso if "propiedad léxica" in c["nombre"])
    comentario_2bach = combinacion("comentario", "2BACH")
    if not any(c.get("matriz_cuantitativa") for c in comentario_2bach):
        raise SystemExit("generar_manual: el caso 4 cuenta con matrices en el comentario de 2.º Bach")
    combinacion("expositivo", "3ESO")
    combinacion("argumentativo", "4ESO")

    casos = [
        ("Noventa textos expositivos de 3.º de ESO y el fin de semana encima",
         "Has mandado un texto expositivo sobre un tema de clase a tres grupos. Quieres corregir "
         "rápido sin perder el criterio.",
         ["Tipo de prueba, «" + puertas["desempeno"] + "»; tipo de tarea, «"
          + tareas["expositivo"] + "»; curso, 3.º de ESO.",
          "Tiempo, «" + corto_t[0] + "». La rúbrica se queda con las dimensiones de primera "
          "prioridad.",
          "Escribes la actividad y pulsas «Generar».",
          "Imprimes la ficha y la repartes el día que mandas el texto, no el día que devuelves la "
          "nota."],
         "Una rúbrica corta que se aplica en dos minutos, la lista de cotejo por si prefieres "
         "marcar casillas y una hoja que tus alumnos leyeron antes de escribir. La nota ya no les "
         "pilla por sorpresa."),
        ("Quieres corregir el borrador, no el texto",
         "En 4.º de ESO trabajas el texto argumentativo por fases. Esta semana solo has recogido "
         "el esquema y el primer borrador.",
         ["Tipo de prueba, «" + puertas["fase_texto"] + "».",
          "La app marca las dimensiones de planificación y revisión y deja fuera las que todavía "
          "no se pueden observar.",
          "Se abre la lista de cotejo. Marcas sí o no y devuelves en la misma sesión."],
         "Media página con hasta " + palabra(d["max_cotejo"], "f") + " comprobaciones. El alumno "
         "ve lo que le falta cuando todavía puede arreglarlo."),
        ("Exposiciones orales en 1.º de ESO y un público que mira el reloj",
         "Cada alumno expone tres minutos y el resto de la clase espera su turno sin escuchar.",
         ["Tipo de tarea, «" + tareas["oral"] + "»; curso, 1.º de ESO.",
          "Repartes la autoevaluación antes de que preparen la exposición.",
          "El día de las exposiciones imprimes la coevaluación: cada oyente valora a un compañero "
          "y escribe un comentario por dimensión.",
          "Reservas el turno de preguntas. La rúbrica analítica lo pide en «Para poder "
          "evaluarla», y si nadie pregunta, preguntas tú."],
         "Una clase que escucha con algo que hacer, y un compañero que recibe varias lecturas "
         "además de la tuya."),
        ("Comentario de texto en 2.º de Bachillerato y una nota que hay que explicar",
         "Es una prueba larga, pesa en la nota y sabes que alguien va a preguntar por qué tiene "
         "un 6,4 y no un 7.",
         ["Tipo de prueba, «" + puertas["desarrollo_largo"] + "». La app abre la escala de "
          "estimación.",
          "Corriges apartado por apartado con la puntuación máxima delante y, al lado, los "
          "puntos desde los que empieza cada nivel. La ortografía "
          "cuenta en su apartado de corrección, así que no hay descuento aparte: si quitas ese "
          "apartado en «Ajustar», el descuento aparece, con tope de " + palabra(detractor["tope"])
          + " puntos, y la ficha del alumno lo anuncia.",
          "En «Calificar», abres «Contar» en las dimensiones con matriz, marcas la banda de cada "
          "componente y guardas al alumno con su nombre."],
         "Una nota sobre 10 con su desglose: el nivel de cada dimensión, cuántos puntos aporta y "
         "qué se descontó. Se explica en dos minutos, con la ficha en la mano."),
        ("Un trabajo de investigación en 4.º de ESO que termina en iDoceo",
         "Han preparado en grupo una presentación con fuentes. Quieres la nota en tu cuaderno de "
         "iDoceo, no en una hoja suelta.",
         ["Tipo de tarea, «" + tareas["investigacion"] + "»; curso, 4.º de ESO. La rúbrica trae "
          "dimensiones que no salen en un texto normal: la selección y el contraste de fuentes, "
          "la atribución del material ajeno y el reparto entre texto, imagen y línea temporal.",
          "Antes de empezar, lees la línea «Para poder evaluarla» del soporte: el formato de "
          "pantallas se decide antes de redactar.",
          "Los pesos no son iguales en esta tarea, y la ficha explica por qué. Léela con ellos el "
          "primer día.",
          "Al terminar, eliges camino (apartado " + n("exportar") + "): "
          + boton("btn-exportar-idoceo") + " para calificar dentro de iDoceo, o «Calificar» aquí "
          "y después " + boton("exportar-csv-notas") + "."],
         "La nota donde llevas el curso, sin copiarla a mano."),
        ("Un test de literatura",
         "Veinte preguntas de respuesta corta sobre el Romanticismo, y la tentación de hacerles "
         "una rúbrica.",
         ["Tipo de prueba, «" + puertas["objetiva"] + "».",
          "La app no genera rúbrica y explica por qué: en un test no hay grados de calidad que "
          "describir, hay aciertos y errores. Lo que toca es una plantilla de corrección con "
          "puntuación directa."],
         "Diez segundos, y una rúbrica que no hacía falta."),
        ("Una narración en 2.º de ESO y un grupo que no entiende la rúbrica",
         "La última vez repartiste la rúbrica y volvió sin leer. Los pocos que la leyeron te "
         "preguntaron qué quiere decir «propiedad léxica».",
         ["Tipo de tarea, «" + tareas["narracion"] + "»; curso, 2.º de ESO. No hay nada que "
          "activar: la ficha sale en versión sencilla.",
          "En la ficha, esa dimensión se llama «" + correccion["nombre_alumno"] + "». Tú la sigues "
          "viendo como «" + correccion["nombre"] + "» en la rúbrica analítica, que es con la que "
          "corriges.",
          "Repartes la ficha y la autoevaluación el día que mandas el texto.",
          "Al recoger, pones al lado la autoevaluación de cada alumno y tu nota. Si en una "
          "dimensión se separan en medio grupo, esa casilla no se está entendiendo."],
         "Una hoja que el alumno lee sin ti y una manera rápida de comprobar que la ha entendido."),
    ]
    g.h1("casos", palabra(len(casos)).capitalize() + " casos prácticos")
    for i, (titulo, situacion, pasos, llevas) in enumerate(casos, 1):
        g.h2("Caso " + str(i) + " · " + titulo)
        g.p("**La situación.** " + situacion)
        g.p("**Qué haces.**")
        g.puntos(pasos)
        g.p("**Qué te llevas.** " + llevas)

    # ----------------------------------------------------------------------
    g.h1("dudas", "Las dudas de siempre")
    dudas = [
        ["«No sé lo suficiente de rúbricas para usar esto.»",
         "No hace falta. Está pensada para quien no ha hecho nunca una: tres desplegables y un "
         "botón. De rúbricas se aprende por el camino, porque cada control explica en dos líneas "
         "por qué está ahí."],
        ["«Me van a reclamar la nota.»",
         "Para eso está hecha. Cada dimensión cita el criterio oficial, cada peso está en la hoja "
         "que el alumno recibió antes de la prueba y ninguna penalización castiga dos veces el "
         "mismo error. Una reclamación se contesta con la ficha delante."],
        ["«Esto me va a llevar más tiempo del que tengo.»",
         "Generar cuesta un minuto. Y la pregunta del tiempo de corrección está para que la "
         "rúbrica se ajuste a ti: si dices que tienes dos minutos por alumno, no te da una tabla "
         "de doce filas."],
        ["«Mis alumnos no la van a leer.»",
         "Por eso la ficha no es solo la tabla. Dice qué se pide, qué se valora, por qué unas "
         "cosas pesan más y cómo se llega a " + nombre_nivel[4] + ", y deja la tabla al final, en "
         "breve, para tenerla en la mesa mientras escriben."],
    ]
    if cursos_sencillo:
        dudas.append(
            ["«La rúbrica está escrita para profesores y mis alumnos no la entienden.»",
             "En " + cursos_sencillo_txt + " ya hay versión sencilla para buena parte de las "
             "tareas: la ficha, la autoevaluación y la coevaluación salen en palabras del curso, "
             "con el término técnico entre paréntesis (apartado " + n("sencillo") + "). En los "
             "demás cursos, de momento, el alumno lee la técnica."])
    dudas += [
        ["«Ya llevo el curso en iDoceo; no quiero otro sitio más.»",
         "La rúbrica o las notas entran en tu cuaderno en un «.csv», por cualquiera de los dos "
         "importadores de iDoceo (apartado " + n("exportar") + "). Eliges tú cuál."],
        ["«¿Y si me equivoco al elegir?»",
         "Cambias el desplegable y generas otra vez. No se publica ni se envía nada."],
        ["«¿Y si cambia el currículo?»",
         "Cada pack declara la normativa de la que sale y desde cuándo está vigente. Actualizarlo "
         "es cambiar contenido, no reprogramar la aplicación."],
        ["«¿Y mis datos? ¿Y los de mis alumnos?»",
         "No salen de tu dispositivo. Las notas que guardes viven en tu navegador y las borras "
         "cuando quieras. La app no tiene servidor al que mandarlas."],
    ]
    g.tabla(["La duda", "La respuesta"], dudas, anchos=[5.0, 11.6])

    # ----------------------------------------------------------------------
    g.h1("glosario", "Glosario de bolsillo")
    g.tabla(["Término", "Qué es, en una línea"], [
        ["Dimensión",
         "Cada fila de la rúbrica. Siempre es una acción («Cohesión: conectores y puntuación»), "
         "nunca un contenido («Las subordinadas»)."],
        ["Descriptor",
         "Lo que hay escrito en cada casilla: qué hace el alumno en ese nivel. Empieza por un "
         "verbo observable y no dice «bastante bien»."],
        ["Nivel de logro",
         "Cada una de las cuatro columnas: " + enumerar([nombre_nivel[k] for k in orden]) + "."],
        ["Criterio de evaluación",
         "El texto del decreto que sostiene esa fila. Va citado literalmente bajo el nombre de la "
         "dimensión."],
        ["Saber básico",
         "El contenido del currículo. Aquí es vehículo, es decir, aparece dentro del descriptor, y "
         "nunca es una fila por sí mismo."],
        ["Bloque LOMLOE",
         "Las letras A, B, C y D que agrupan las dimensiones por bloque del currículo. Sirven para "
         "ver de un vistazo si tu rúbrica se ha ido toda a un lado."],
        ["Puerta de aplicabilidad",
         "La primera pregunta del modo exprés. Decide si la rúbrica es el instrumento adecuado, y "
         "a veces decide que no, antes de generar nada."],
        ["Versión sencilla",
         "La segunda redacción de un descriptor, en palabras del curso, para lo que lee el "
         "alumno. Pide lo mismo que la técnica, que es con la que se califica."],
        ["Para poder evaluarla",
         "Lo que la tarea tiene que incluir para que una fila se pueda puntuar, como el turno de "
         "preguntas de una exposición. Solo sale en la rúbrica analítica."],
        ["Matriz contable",
         "El desglose de una dimensión en componentes que se cuentan («4 o más tipos distintos de "
         "conector») en vez de estimarse. La usa «Calificar»."],
        ["Detractor",
         "Descuento sobre la nota final por algo transversal, como la ortografía y la "
         "presentación, siempre con tope declarado."],
        ["Condición mínima",
         "Opción de «Calificar», apagada de serie: una dimensión obligatoria en " + nombre_nivel[1]
         + " limita la nota a 4,9."],
        ["Ponderación",
         "El peso de cada dimensión. Por defecto todas pesan igual; si no, hay que decir por qué, "
         "y ese porqué se imprime en la ficha del alumno."],
    ], anchos=[4.0, 12.6])
    g.p("El glosario completo está en la «Guía de terminología de rúbricas (LOMLOE)», enlazada al "
        "pie de la aplicación.", size=9.5, color=TINTA_SUAVE)

    colofon = g.linea("Taller de Rúbricas · Lengua Castellana y Literatura · " + FECHA + " · "
                      + URL_APP, italic=True)
    colofon.paragraph_format.space_before = Pt(10)
    if g.seccion_actual != len(SECCIONES):
        raise SystemExit("generar_manual: faltan apartados: " + ", ".join(SECCIONES[g.seccion_actual:]))
    return g


def main() -> int:
    datos = leer_datos()
    guia = construir(datos)
    guia.doc.save(SALIDA)
    print("Escrito " + str(SALIDA.relative_to(RAIZ)) + " · " + palabra(len(datos["tipos_tarea"]))
          + " tipos de tarea · " + str(datos["criterios"]) + " criterios · "
          + palabra(datos["reglas"], "f") + " reglas del validador · "
          + str(len(datos["cobertura"])) + " combinaciones en lenguaje sencillo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
