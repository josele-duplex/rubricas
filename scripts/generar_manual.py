"""Genera la guía del docente en .docx.

    python scripts/generar_manual.py

Salida: docs/Taller-de-Rubricas_Guia-para-empezar.docx

Por qué existe este script y no se edita el .docx a mano: la primera versión de
la guía se escribió en Word y envejeció en silencio. Siete versiones del
proyecto después prometía seis tipos de tarea (hay nueve), 163 criterios (hay
232), diecinueve reglas de validación (hay veintiuna) y una exportación a
iDoceo «diseñada, no implementada» que llevaba dos días funcionando. Todos esos
son hechos que ya viven en data/ y en el código, así que aquí no se escriben:
se leen. Lo que se escribe a mano es la prosa, igual que en el SDD, donde las
dos tablas son generadas y la justificación que las rodea no.

Fuentes de los datos volátiles:
  - data/catalogo.json ......... cursos, nombres de los cuatro niveles, tipos de tarea
  - data/derivacion-lcl.json ... la matriz tarea x curso del apartado 9 (SDD §4.3)
  - data/pack-lcl-*.json ....... recuento de criterios y de matrices cuantitativas
  - js/validador.js ............ cuántas reglas vigila el validador (SDD §10)
  - js/motor.js ................ etiquetas de la puerta de aplicabilidad (SDD §8)
    y del tiempo de corrección
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "docs" / "Taller-de-Rubricas_Guia-para-empezar.docx"
URL_APP = "https://josele-duplex.github.io/rubricas/"
FECHA = "26 de agosto de 2026"

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


# ------------------------------------------------------------------- datos

def leer_datos() -> dict:
    catalogo = json.loads((RAIZ / "data" / "catalogo.json").read_text(encoding="utf-8"))
    lcl = catalogo["materias"]["LCL"]
    derivacion = json.loads((RAIZ / lcl["derivacion"]).read_text(encoding="utf-8"))

    criterios = matrices = 0
    for ruta in sorted((RAIZ / "data").glob("pack-lcl-*.json")):
        pack = json.loads(ruta.read_text(encoding="utf-8"))
        for criterio in pack.get("criterios", []):
            criterios += 1
            if criterio.get("matriz_cuantitativa"):
                matrices += 1

    return {
        "cursos": catalogo["cursos"],
        "niveles": catalogo["niveles"],
        "tipos_tarea": lcl["tipos_tarea"],
        "matriz": derivacion["matriz_tareas"],
        "criterios": criterios,
        "matrices": matrices,
        "reglas": contar_reglas(),
        "puertas": leer_puertas(),
        "tiempos": leer_tiempos(),
    }


def _bloque(texto: str, arranque: str) -> str:
    inicio = texto.index(arranque)
    return texto[inicio: texto.index("\n};", inicio)]


def contar_reglas() -> int:
    js = (RAIZ / "js" / "validador.js").read_text(encoding="utf-8")
    return len(re.findall(r"^  ([a-z_]+):", _bloque(js, "export const REGLAS"), re.M))


def leer_puertas() -> dict:
    js = (RAIZ / "js" / "motor.js").read_text(encoding="utf-8")
    bloque = _bloque(js, "export const PUERTA_APLICABILIDAD")
    claves = re.findall(r"^  (\w+): \{", bloque, re.M)
    etiquetas = re.findall(r'etiqueta:\s*"([^"]+)"', bloque)
    return dict(zip(claves, etiquetas))


def leer_tiempos() -> list:
    js = (RAIZ / "js" / "motor.js").read_text(encoding="utf-8")
    bloque = _bloque(js, "export const TIEMPOS_CORRECCION")
    return re.findall(r'etiqueta:\s*"([^"]+)"', bloque)


NUMERO = {4: "cuatro", 5: "cinco", 6: "seis", 7: "siete", 8: "ocho", 9: "nueve",
          19: "diecinueve", 20: "veinte", 21: "veintiuna", 22: "veintidós"}


def palabra(n: int) -> str:
    return NUMERO.get(n, str(n))


def enumerar(items: list) -> str:
    return ", ".join(items[:-1]) + " y " + items[-1]


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


def pintar(run, *, size=10.5, bold=False, italic=False, color=TINTA):
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs"):
        rfonts.set(qn(attr), FUENTE)
    return run


def escribir(parrafo, texto: str, *, size=10.5, color=TINTA, italic=False):
    """Marcado mínimo dentro del texto: **negrita**."""
    for trozo in re.split(r"(\*\*[^*]+\*\*)", texto):
        if not trozo:
            continue
        if trozo.startswith("**") and trozo.endswith("**"):
            pintar(parrafo.add_run(trozo[2:-2]), size=size, bold=True, color=color, italic=italic)
        else:
            pintar(parrafo.add_run(trozo), size=size, color=color, italic=italic)
    return parrafo


class Guia:
    def __init__(self):
        self.doc = Document()
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
        rpr = normal.element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)
        for attr in ("w:ascii", "w:hAnsi", "w:cs"):
            rfonts.set(qn(attr), FUENTE)

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

    def h1(self, texto):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        pintar(p.add_run(texto), size=15, bold=True, color=ACENTO)
        return p

    def h2(self, texto):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        pintar(p.add_run(texto), size=11.5, bold=True, color=TINTA)
        return p

    def p(self, texto, **kw):
        return escribir(self.doc.add_paragraph(), texto, **kw)

    def puntos(self, items):
        for item in items:
            p = self.doc.add_paragraph(style="List Bullet")
            p.paragraph_format.space_after = Pt(3)
            escribir(p, item)

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
            pintar(par.add_run(texto), size=9.5, bold=True, color=TINTA)
        for fila in filas:
            celdas = t.add_row().cells
            for i, texto in enumerate(fila):
                par = celdas[i].paragraphs[0]
                par.paragraph_format.space_before = Pt(3)
                par.paragraph_format.space_after = Pt(3)
                if centrar_desde is not None and i >= centrar_desde:
                    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
                escribir(par, texto, size=9.5)
        if anchos:
            for fila in t.rows:
                for i, ancho in enumerate(anchos):
                    fila.cells[i].width = Cm(ancho)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(0)
        return t

    def salto(self):
        self.doc.add_page_break()


# ------------------------------------------------------------------ el texto

def construir(d: dict) -> Guia:
    g = Guia()
    tareas = d["tipos_tarea"]
    cursos = d["cursos"]
    niveles = d["niveles"]
    n_tareas = len(tareas)
    n_celdas = sum(len(v) for v in d["matriz"]["celdas"].values())

    g.portada("Taller de Rúbricas", "Guía para empezar",
              "Qué hace la aplicación, para qué sirve cada cosa y cómo se usa en clase.")
    g.linea("Lengua Castellana y Literatura · LOMLOE · Región de Murcia")
    g.linea("Funciona en el navegador, sin cuentas y sin conexión. Se instala en el iPad, en "
            "Android y en el ordenador. Estado del contenido: " + FECHA + ".")
    g.linea(URL_APP, color=ACENTO)

    g.caja("Si nunca has trabajado con rúbricas, esta aplicación es exactamente para ti.",
           "No te pide que redactes descriptores, ni que inventes criterios, ni que decidas "
           "cuántos niveles poner. Todo eso ya está escrito y sacado del currículo oficial. Tú "
           "dices qué vas a evaluar, en qué curso y de cuánto tiempo dispones para corregir; la "
           "app monta el instrumento y te lo da listo para imprimir.")

    # 1
    g.h1("1 · Lo primero: lo que no necesitas saber")
    g.puntos([
        "**No hay que registrarse.** No pide correo, ni contraseña, ni el nombre de ningún "
        "alumno para funcionar.",
        "**No se envía nada a ninguna parte.** Todo ocurre en tu propio navegador. Se puede "
        "instalar en el iPad, en Android o en el ordenador, y después funciona sin internet.",
        "**No hay nada que romper.** Si eliges mal, cambias el desplegable y vuelves a generar. "
        "Nada se publica, nada se pierde.",
        "**No inventa nada.** Cada fila de la rúbrica lleva citado el criterio de evaluación "
        "oficial del que sale. Si un curso no sostiene una tarea, la app no te la ofrece y te "
        "explica por qué.",
        "**No te deja solo.** Cada decisión lleva al lado un «¿por qué?» de dos o tres líneas: "
        "aprendes de rúbricas mientras la usas, no antes de usarla.",
        "**No te encierra dentro.** Lo que generas sale en papel, en PDF y en «.csv» para "
        "iDoceo, por las dos vías que iDoceo admite (apartado 8).",
        "**Tres minutos.** Ese es el objetivo declarado del proyecto: que un profesor que nunca "
        "la ha abierto salga con la rúbrica y la ficha del alumno impresas.",
    ])

    # 2
    g.h1("2 · La app en tres decisiones")
    g.p("La pantalla de inicio —el «modo exprés»— tiene tres desplegables y una línea de texto. "
        "No hay más.")
    g.tabla(["Lo que te pregunta", "Qué significa y por qué importa"], [
        ["1 · ¿Qué vas a evaluar?",
         "Dos cosas: qué **tipo de prueba** es (ver más abajo) y qué **tipo de tarea** has "
         "mandado. Hoy hay " + palabra(n_tareas) + ": " + enumerar(
             [t.lower() for t in tareas.values()]) + "."],
        ["2 · ¿Qué curso?",
         "Solo aparecen los cursos en los que el currículo sostiene esa tarea. Si el desplegable "
         "no ofrece un curso, no es un olvido: es que el decreto no pide eso ahí."],
        ["3 · ¿Cuánto tiempo tienes?",
         "; ".join(t.replace(" por alumno", "").lower() for t in d["tiempos"]) +
         ", por alumno. Esto decide cuántas dimensiones entran en la rúbrica. Es lo que evita la "
         "rúbrica de doce filas que nadie corrige dos veces."],
        ["La actividad",
         "La escribes tú, con tus palabras («Texto expositivo sobre el reciclaje en el "
         "instituto»). Aparece en la cabecera de todos los instrumentos y en la ficha del alumno."],
    ], anchos=[4.6, 12.0])

    g.h2("La primera pregunta también sirve para decirte que no")
    g.p("La rúbrica no vale para todo, y la app está hecha para decírtelo antes de generar nada. "
        "Según lo que respondas, cambia lo que te entrega:")
    puertas = d["puertas"]
    g.tabla(["Si respondes…", "La app hace esto"], [
        [puertas["objetiva"],
         "**No genera rúbrica.** Te explica por qué: ahí no hay gradación de calidad, solo "
         "acierto o error."],
        [puertas["desarrollo_largo"],
         "Te abre la **escala de estimación analítica**: puntuación directa por apartado, sin "
         "elegir entre cuatro niveles."],
        [puertas["desempeno"],
         "Terreno natural de la **rúbrica analítica** completa. Te la abre directamente."],
        [puertas["proceso"],
         "Te propone la **lista de cotejo** o la rúbrica de un solo punto, y te desaconseja la "
         "rúbrica completa."],
        [puertas["fase_texto"],
         "Marca solo las dimensiones de proceso —planificar, redactar el borrador, revisar— y "
         "abre la lista de cotejo. En un esquema no hay cohesión que observar todavía."],
    ], anchos=[6.2, 10.4])
    g.caja("", "La app propone y explica; nunca te impide seguir con otra elección. **Educa, no "
               "impone.**")

    # 3
    g.h1("3 · Lo que te entrega: siete instrumentos")
    g.p("Al pulsar «Generar» aparece la vista previa con siete pestañas. No tienes que usarlas "
        "todas: la primera que se abre es la que la app te recomienda por lo que respondiste.")
    g.tabla(["Instrumento", "Qué es", "Cuándo lo usas"], [
        ["Rúbrica analítica",
         "La tabla completa: cada dimensión en una fila, los cuatro niveles en columnas, el peso "
         "de cada una y el criterio oficial citado debajo.",
         "Producto final: el texto entregado, la exposición hecha."],
        ["Lista de cotejo",
         "Los mismos contenidos convertidos en afirmaciones de sí/no, con casilla. Máximo ocho.",
         "Tarea diaria o intermedia, cuando corregir con rúbrica completa no compensa."],
        ["Ficha del alumno",
         "La hoja que repartes en clase antes de la prueba. Se genera siempre y no se puede "
         "desmarcar.",
         "Siempre. Se entrega y se explica antes de que escriban."],
        ["Rúbrica de un solo punto",
         "Solo la columna de lo esperado, con dos columnas en blanco: evidencias de mejora y de "
         "excelencia. Una o dos dimensiones.",
         "Borradores y comentarios personalizados."],
        ["Autoevaluación",
         "La misma matriz reescrita en primera persona («Utilizo…», «Reconozco…»), derivada sin "
         "errores de morfología.",
         "Durante el proceso, para que el alumno se sitúe antes de entregar."],
        ["Coevaluación",
         "La versión en primera persona, más el nombre del compañero evaluado y un comentario "
         "obligatorio por dimensión.",
         "Trabajo entre iguales. El comentario obligatorio evita el reparto de notas entre amigos."],
        ["Escala de estimación",
         "Puntuación directa por apartado, con el máximo de cada uno y el descuento por "
         "ortografía y presentación declarado (tope −2).",
         "Desarrollo largo, comentario de texto, exámenes."],
    ], anchos=[3.4, 7.0, 6.2])
    g.p("Además de las siete pestañas hay cuatro botones: **Ajustar** (apartado 6), **Calificar** "
        "(apartado 7), **Exportar rúbrica (iDoceo)** (apartado 8) e **Imprimir esta vista** — que "
        "manda a la impresora o a «Guardar como PDF» exactamente la pestaña que tengas delante, "
        "con los «¿por qué?» ocultos, porque el papel es para el aula.")
    g.caja("Un detalle que cambia mucho en clase",
           "El registro lingüístico se ajusta al curso: la ficha de 1.º de ESO y la de 2.º de "
           "Bachillerato no le hablan igual al alumno. Está pensada para caber en un A4 y para "
           "proyectarse.")

    # 4
    g.h1("4 · La ficha del alumno no se puede desmarcar")
    g.p("Es la pieza que da sentido al resto. Si sostenemos que el alumnado debe conocer la "
        "rúbrica antes de la prueba, eso no puede depender de que el profesor se acuerde de "
        "marcar una casilla. La app la genera siempre, y contiene:")
    g.puntos([
        "**Qué se te pide** — la actividad, tal y como la escribiste.",
        "**Qué se valora** — cada dimensión con su peso en porcentaje y, cuando los pesos no son "
        "iguales, por qué no lo son, en una frase escrita para que la lea el alumno.",
        "**Cómo llegar al nivel excelente** — el descriptor más alto de cada dimensión, "
        "convertido en instrucción accionable.",
        "**Cómo se calcula la nota** — la escala elegida, sin letra pequeña.",
        "**Un guion para presentarla en clase** — media página para ti: apertura, recorrido "
        "dimensión a dimensión, un ejemplo contrastado de N2 frente a N4 y dos preguntas para "
        "lanzar al grupo. Pensado para cinco o diez minutos.",
        "**El resultado de un alumno concreto** — si ya has calificado, un desplegable muestra su "
        "nivel y sus puntos por dimensión y la nota final. Para la entrega individual.",
    ])

    # 5
    g.h1("5 · Mientras tú decides, la app vigila")
    g.p("Esto ocurre solo, sin que tengas que pedirlo, y es lo que distingue a la aplicación de "
        "una plantilla en blanco:")
    g.tabla(["Qué vigila", "Qué te dice"], [
        ["Salud del contenido",
         "Un validador con **" + palabra(d["reglas"]) + " reglas** comprueba los descriptores: "
         "que ninguno diga «adecuadamente» o «bastante bien», que todos empiecen por un verbo "
         "observable, que el nivel más bajo describa lo que el alumno sí hace y no lo que le "
         "falta, que ninguna penalización castigue dos veces lo mismo. Si algo no pasa, lo dice "
         "arriba del todo — y explica la regla."],
        ["Progresión entre cursos",
         "Avisa si se mezclan dimensiones con exigencia muy dispar."],
        ["Reparto de pesos",
         "Avisa si una dimensión pasa del 40 % o se queda por debajo del 5 %. Avisa, no bloquea."],
        ["Complejidad",
         "Un indicador cuenta dimensiones y bloques, y te avisa activamente si pasas de cinco "
         "dimensiones en algo que no es un producto final. Más filas no es más rigor: es más "
         "corrección."],
        ["Microexplicaciones",
         "Cada control lleva un «¿por qué?» desplegable. No se imprimen: son para ti mientras "
         "aprendes, no para la hoja del aula."],
    ], anchos=[4.2, 12.4])

    # 6
    g.h1("6 · «Ajustar»: cuando quieres tocar algo")
    g.p("Desde la vista previa, el botón «Ajustar» abre el modo avanzado. Hoy hace dos cosas, y "
        "las dos importan:")
    g.puntos([
        "**Marcar y desmarcar dimensiones**, agrupadas por bloque del currículo (A, B, C y D). Si "
        "en esta tarea no vas a valorar la corrección normativa, la quitas.",
        "**Mover los pesos** con un deslizador de 0 a 100 por dimensión. Al soltar, el conjunto se "
        "normaliza a 100 y una barra te enseña el reparto de un vistazo. Si decides que la "
        "ortografía vale el 50 % en esta tarea concreta, la app te lo advierte una vez y te deja "
        "hacerlo: la decisión de calificación es tuya.",
    ])
    g.caja("", "Lo que trae el pack es un punto de partida razonable, no una prescripción. Y lo "
               "que decidas se imprime en la ficha del alumno, que es donde de verdad importa que "
               "sea explícito.")

    # 7
    g.h1("7 · «Calificar»: de la rúbrica a la nota")
    g.p("No estás obligado a poner número. La app funciona entera en modo cualitativo: nivel "
        "alcanzado y descriptor, que es lo que sirve para dar retroalimentación durante el "
        "proceso. Pero cuando hace falta la nota, el botón «Calificar» la calcula y la explica.")
    g.h2("Los cuatro niveles y sus bandas")
    g.p("Cuatro niveles siempre; no es configurable. Los nombres y las bandas son los mismos que "
        "usa el material que ya está en clase, para que el alumno y su familia no reciban una "
        "palabra distinta según la herramienta.")
    orden = niveles["orden"]
    bandas = {1: "0 – 4,9", 2: "5 – 6,9", 3: "7 – 8,9", 4: "9 – 10"}
    g.tabla(["N" + str(n) + " · " + niveles["nombres"][str(n)] for n in orden],
            [[bandas[n] for n in orden]], centrar_desde=0)
    g.h2("Qué puedes hacer en esa pantalla")
    g.puntos([
        "**Elegir el nivel de cada dimensión** leyendo su descriptor, o —en las dimensiones que "
        "traen matriz contable— marcar directamente la banda de cada componente: «3,0 puntos si "
        "emplea cuatro o más tipos de marcador; 2,0 si emplea dos o tres». Eso se cuenta, no se "
        "estima.",
        "**Marcar las faltas por tramos.** Las bandas de ortografía no están escritas en faltas "
        "absolutas: se recortan contra la longitud esperada del texto, así que las mismas seis "
        "faltas no pesan igual en un resumen breve que en un texto largo. Son cinco tramos, y "
        "cada tarea y cada curso tienen los suyos: en el resumen el último empieza en ocho "
        "faltas; en el texto expositivo de 4.º de ESO, en diecinueve.",
        "**Contar penalizaciones**, cada una con su tope declarado: nunca pueden dejar una "
        "dimensión en negativo.",
        "**Aplicar el descuento global** de ortografía y presentación de la escala de estimación, "
        "con tope de −2 puntos sobre 10.",
        "**Elegir escala**: equilibrada (2,5 · 5 · 7,5 · 10), que es la de por defecto y evita el "
        "cero a quien ha producido algo aunque sea flojo, o exigente (0 · 5 · 7,5 · 10), que "
        "reserva el cero al trabajo no hecho.",
        "**Guardar alumno por alumno.** Las calificaciones se quedan en tu propio equipo, "
        "agrupadas por actividad: puedes corregir treinta exámenes en tres tardes sin perder "
        "nada, y borrarlas cuando quieras.",
        "**Exportar las notas en «.csv»** con el botón que hay junto a la lista de alumnos "
        "guardados (apartado 8).",
    ])
    g.caja("Por qué esta nota aguanta una reclamación",
           "Porque cada punto tiene un sitio del que sale: la dimensión, el criterio oficial "
           "citado, la banda que se marcó y el peso que el alumno leyó en su ficha antes de la "
           "prueba. Y porque ninguna penalización puede castigar lo que un componente ya está "
           "midiendo — esa regla («doble castigo») está comprobada en todas las matrices del "
           "contenido.")

    # 8
    g.h1("8 · Llevar el trabajo a iDoceo")
    g.p("iDoceo tiene **dos importadores distintos**, y la app escribe para los dos. No son "
        "complementarios: son **dos caminos alternativos**, y eliges tú, instrumento a "
        "instrumento. Los dos archivos son «.csv», el formato que los dos importadores aceptan, "
        "así que la exportación no necesita nada instalado y sigue funcionando sin conexión.")
    g.tabla(["El camino", "Qué exportas", "Qué pasa después"], [
        ["**Exportar rúbrica (iDoceo)**\nBotón de la vista previa",
         "La matriz en blanco: criterios × niveles, con el peso de cada fila y el valor de cada "
         "nivel. Archivo «Rubrica_…csv».",
         "Calificas **dentro de iDoceo**, tocando cada celda. La pantalla «Calificar» de esta app "
         "deja de usarse para ese instrumento."],
        ["**Exportar CSV**\nBotón de la pantalla «Calificar»",
         "Una fila por alumno con su nota final del instrumento activo. Archivo «Notas_…csv».",
         "Sigues calificando **aquí** y iDoceo recibe solo el número, por su asistente general de "
         "importación de alumnos."],
    ], anchos=[4.4, 6.0, 6.2])
    g.caja("Los dos caminos dan la misma aritmética",
           "Los valores de nivel que viajan dentro de la rúbrica exportada son los mismos de la "
           "escala equilibrada que usa «Calificar». Si algún día comparas las dos vías sobre el "
           "mismo alumno, el número coincide: no hay un modelo de cálculo para la app y otro para "
           "iDoceo.")

    # 9
    g.h1("9 · Qué contenido hay cargado hoy")
    g.p(palabra(n_tareas).capitalize() + " tipos de tarea, escritos curso a curso donde el "
        "currículo los sostiene: **" + str(n_celdas) + " combinaciones de tarea y curso**, con **"
        + str(d["criterios"]) + " criterios oficiales**, " + str(d["matrices"]) + " de ellos con "
        "matriz contable. La tabla es dispersa a propósito — una casilla vacía significa que el "
        "decreto no pide esa tarea en ese curso.")
    orden_cursos = cursos["orden"]
    celdas = d["matriz"]["celdas"]
    simbolos = {k: v["simbolo"] for k, v in d["matriz"]["simbolos"].items()}
    filas = []
    for clave, etiqueta in tareas.items():
        fila = [etiqueta]
        for curso in orden_cursos:
            fila.append(simbolos.get(celdas.get(clave, {}).get(curso), ""))
        filas.append(fila)
    g.tabla(["Tipo de tarea"] + [cursos["etiquetas_cortas"][c] for c in orden_cursos],
            filas, anchos=[5.2] + [1.9] * len(orden_cursos), centrar_desde=1)
    g.p("**●**  el género o la tarea aparecen nombrados en los saberes de ese curso, además de "
        "estar sostenidos por su criterio de evaluación.    **○**  lo sostiene el criterio del "
        "curso, pero los saberes no lo nombran: la tarea es legítima y el foco del curso está en "
        "otro sitio. En los dos casos la rúbrica se genera igual.", size=9.5, color=TINTA_SUAVE)
    g.caja("", "Si buscas una tarea en un curso donde la casilla está vacía, la app no te la "
               "ofrece. No es una limitación técnica: es que abrir esa celda obligaría a inventar "
               "un criterio que el decreto no tiene.")

    # 10
    g.h1("10 · Lo que la app no hace")
    g.h2("Por decisión, y no va a cambiar")
    g.puntos([
        "**No llama a ninguna inteligencia artificial.** No ejecuta prompts, no pide claves y no "
        "envía nada.",
        "**No pide cuentas, ni correos, ni datos personales de menores.** No hay «versión de "
        "alumno» donde nadie entre: el canal eres tú, que repartes la ficha.",
        "**No genera rúbrica para una prueba objetiva**, ni ofrece una tarea en un curso que el "
        "currículo no sostiene, ni admite tres o cinco niveles.",
        "**No pone criterios sin cita del decreto.**",
    ])
    g.h2("Todavía no, pero está previsto")
    g.tabla(["Pieza pendiente", "Estado"], [
        ["Guardar la configuración en «.json»",
         "Para reutilizar un montaje o pasárselo a un compañero de departamento. Diseñado, no "
         "implementado."],
        ["Rúbrica en «modo IA»",
         "El texto de la rúbrica preparado para que corrijas fuera con una IA, con su protocolo "
         "(anonimizar, exigir evidencias, firmar tú la nota). Diseñado, no implementado."],
        ["Más cosas en «Ajustar»",
         "Faltan: cambiar la profundidad sin volver atrás, marcar criterios obligatorios, elegir "
         "qué instrumentos se generan, cambiar de modo de calificación y editar descriptores a "
         "mano con el validador delante."],
        ["Más tipos de tarea",
         "Lectura en voz alta, podcast, línea de tiempo y trabajo grupal. (Reacción a una "
         "noticia, redacción de una noticia y trabajo de investigación multimodal ya están "
         "dentro, desde agosto de 2026.)"],
        ["Banco de criterios favoritos",
         "Y una calculadora de carga de corrección. Pendientes."],
        ["Otras materias",
         "El diseño ya lo admite sin tocar código, pero hoy solo hay contenido de Lengua "
         "Castellana y Literatura."],
        ["Enlace compartible y QR · adaptación NEAE",
         "Fuera de esta versión."],
        ["Recoger las autoevaluaciones del alumnado",
         "Descartado por ahora: exigiría un servidor y tratamiento de datos de menores."],
    ], anchos=[5.0, 11.6])

    # 11
    g.h1("11 · Seis casos prácticos")
    casos = [
        ("Caso 1 · Noventa textos expositivos de 3.º de ESO y el fin de semana encima",
         "Has mandado un texto expositivo sobre un tema del aula. Son tres grupos y quieres "
         "corregir rápido sin perder criterio.",
         ["Tipo de prueba: «Tarea de desempeño o proyecto». Tipo de tarea: «Texto expositivo». "
          "Curso: 3.º de ESO.",
          "Tiempo: «Menos de 2 min por alumno». La rúbrica se queda con las dimensiones "
          "esenciales en vez de con todas.",
          "Escribes la actividad y pulsas Generar.",
          "Imprimes la ficha del alumno y la repartes el día que mandas el texto, no el día que "
          "devuelves la nota."],
         "Una rúbrica corta que puedes aplicar en dos minutos, la lista de cotejo por si "
         "prefieres marcar casillas, y la hoja que tus alumnos ya han leído antes de escribir — "
         "que es lo que hace que la corrección deje de ser una sorpresa."),
        ("Caso 2 · Quieres corregir el borrador, no el texto",
         "En 4.º de ESO estás trabajando el texto argumentativo por fases. Esta semana solo has "
         "recogido el esquema y el primer borrador.",
         ["Tipo de prueba: «Fase de un texto (esquema, borrador, revisión, párrafo suelto)».",
          "La app marca sola las dimensiones de planificación y revisión, y deja sin marcar las "
          "que aún no se pueden observar: en un esquema no hay cohesión que juzgar.",
          "Se abre la lista de cotejo. Marcas sí o no y devuelves en la misma sesión."],
         "Una hoja de media página con seis u ocho comprobaciones. El alumno ve qué le falta "
         "cuando todavía puede arreglarlo, que es cuando sirve."),
        ("Caso 3 · Exposiciones orales en 1.º de ESO y quieres que se escuchen entre ellos",
         "Cada alumno expone tres minutos y el resto de la clase se aburre mirando.",
         ["Tipo de tarea: «Exposición oral». Curso: 1.º de ESO.",
          "Imprimes la pestaña de coevaluación: cada oyente valora a un compañero y tiene que "
          "escribir un comentario por dimensión — sin justificación escrita, la coevaluación "
          "degenera en repartir notas entre amigos.",
          "La pestaña de autoevaluación, en primera persona, la reparten antes de preparar la "
          "exposición."],
         "La clase escucha con una tarea concreta, el que expone recibe cinco lecturas además de "
         "la tuya, y todos han leído los criterios antes de subir a hablar."),
        ("Caso 4 · Comentario de texto en 2.º de Bachillerato y una nota que tiene que sostenerse",
         "Es una prueba larga, la nota pesa y sabes que alguien va a preguntar por qué tiene un "
         "6,4 y no un 7.",
         ["Tipo de prueba: «Desarrollo largo o comentario de texto». La app abre la escala de "
          "estimación analítica.",
          "Corriges apartado por apartado con su puntuación máxima delante, y aplicas —si "
          "procede— el descuento de ortografía y presentación, que tiene tope de 2 puntos y está "
          "impreso en la ficha.",
          "Pulsas «Calificar», marcas las bandas contables de cada componente y guardas al alumno "
          "por su nombre."],
         "Una nota sobre 10 con su desglose: qué nivel en cada dimensión, cuántos puntos aporta "
         "cada una y qué se descontó. Todo lo que necesitas para explicarla en dos minutos."),
        ("Caso 5 · Un trabajo de investigación en 4.º de ESO que acaba en tu cuaderno de iDoceo",
         "Han preparado en grupo una presentación multimodal con fuentes. Quieres que la nota "
         "viva en iDoceo, con tu cuaderno, y no en una hoja suelta.",
         ["Tipo de tarea: «Trabajo de investigación multimodal». Curso: 4.º de ESO. La rúbrica "
          "trae dimensiones que no aparecen en un texto normal: contraste de fuentes, atribución "
          "de la propiedad intelectual y soporte multimodal.",
          "Los pesos no son iguales aquí, y la ficha del alumno imprime por qué no lo son: eso es "
          "lo que se lee en clase antes de empezar el trabajo.",
          "Al terminar, eliges camino (apartado 8). Si quieres calificar dentro de iDoceo, "
          "«Exportar rúbrica (iDoceo)» y la importas allí. Si prefieres calificar aquí, usas "
          "«Calificar» y luego «Exportar CSV» con las notas."],
         "El instrumento en el sitio donde llevas el curso, sin copiar notas a mano y sin dos "
         "aritméticas distintas."),
        ("Caso 6 · Un test de literatura",
         "Veinte preguntas de respuesta corta sobre el Romanticismo y piensas en hacerles una "
         "rúbrica.",
         ["Tipo de prueba: «Prueba objetiva».",
          "La app no genera rúbrica y te dice por qué: ahí no hay gradación de calidad que "
          "describir, solo acierto o error. Lo que corresponde es una plantilla de corrección con "
          "puntuación directa."],
         "Diez segundos y una idea clara. Este caso está aquí porque es tan útil como los otros "
         "cinco: saber cuándo la rúbrica no toca es parte de saber usarla."),
    ]
    for titulo, situacion, pasos, llevas in casos:
        g.h2(titulo)
        g.p("**La situación.** " + situacion)
        g.p("**Qué haces.**")
        g.puntos(pasos)
        g.p("**Qué te llevas.** " + llevas)

    # 12
    g.h1("12 · Los miedos de siempre, respondidos")
    g.tabla(["Lo que piensas", "Lo que pasa de verdad"], [
        ["«No sé lo suficiente de rúbricas para usar esto.»",
         "No hace falta. La aplicación está hecha explícitamente para el profesor sin experiencia "
         "previa: tres desplegables y un botón. Lo que sí vas a aprender es de rúbricas, porque "
         "cada control te explica en dos líneas por qué está ahí."],
        ["«Me van a reclamar la nota.»",
         "Es justo el escenario para el que está diseñada. Cada dimensión cita el criterio "
         "oficial, cada peso está impreso en la hoja que el alumno recibió antes, y ninguna "
         "penalización castiga dos veces el mismo error. Una reclamación se responde enseñando la "
         "ficha."],
        ["«Esto me va a llevar más tiempo del que tengo.»",
         "Generar cuesta un minuto. Y la pregunta del tiempo de corrección existe precisamente "
         "para que la rúbrica se ajuste a tu realidad y no al revés: si dices que tienes dos "
         "minutos por alumno, no te entrega una tabla de doce filas."],
        ["«Mis alumnos no la van a leer.»",
         "Por eso la ficha no es una tabla: es una hoja que dice qué se te pide, qué se valora, "
         "por qué unas cosas pesan más y cómo se llega al nivel excelente. Y viene con un guion "
         "de cinco a diez minutos para presentarla en clase."],
        ["«Ya llevo el curso en iDoceo, no quiero otro sitio más.»",
         "No es otro sitio: la rúbrica o las notas se van a tu cuaderno en un «.csv», por "
         "cualquiera de los dos importadores de iDoceo (apartado 8). Eliges tú cuál, y la "
         "aritmética es la misma por los dos caminos."],
        ["«¿Y si me equivoco al elegir?»",
         "No pasa nada. Cambias el desplegable y generas otra vez. Nada se publica y nada se "
         "envía."],
        ["«¿Y si cambia el currículo?»",
         "Cada pack de contenido declara la normativa de la que sale y desde cuándo está vigente. "
         "Actualizarlo es cambiar contenido, no reprogramar la aplicación."],
        ["«¿Y mis datos? ¿Y los de mis alumnos?»",
         "No salen de tu dispositivo. Las calificaciones que guardes viven en tu propio navegador "
         "y las borras cuando quieras. La app no tiene servidor al que mandarlas."],
    ], anchos=[5.0, 11.6])

    # 13
    g.h1("13 · Glosario de bolsillo")
    g.tabla(["Término", "Qué es, en una línea"], [
        ["Dimensión",
         "Cada fila de la rúbrica. Siempre es una acción («Cohesión: conectores y puntuación»), "
         "nunca un contenido («Las subordinadas»)."],
        ["Descriptor",
         "Lo que hay escrito en cada casilla: qué hace el alumno en ese nivel. Empieza por un "
         "verbo observable y no dice «bastante bien»."],
        ["Nivel de logro",
         "Cada una de las cuatro columnas: " + enumerar(
             [niveles["nombres"][str(n)] for n in orden]) + "."],
        ["Criterio de evaluación",
         "El texto del decreto que sostiene esa fila. Va citado literalmente debajo del nombre de "
         "la dimensión."],
        ["Saber básico",
         "El contenido del currículo. Aquí es vehículo —aparece dentro del descriptor— y nunca es "
         "una fila por sí mismo."],
        ["Bloque LOMLOE",
         "Las letras A, B, C y D que agrupan las dimensiones por bloque del currículo. Sirven "
         "para ver de un vistazo si tu rúbrica se ha ido toda a un lado."],
        ["Puerta de aplicabilidad",
         "La primera pregunta del modo exprés. Decide si la rúbrica es el instrumento adecuado "
         "—y a veces decide que no— antes de generar nada."],
        ["Matriz contable",
         "El desglose de una dimensión en componentes que se cuentan («cuatro o más tipos de "
         "marcador»), en vez de estimarse. La usa la pantalla de calificar."],
        ["Detractor",
         "Descuento sobre la nota final por algo transversal —ortografía y presentación—, siempre "
         "con tope declarado."],
        ["Ponderación",
         "El peso de cada dimensión. Por defecto todas pesan igual; si no pesan igual, hay que "
         "decir por qué, y ese porqué se imprime en la ficha del alumno."],
    ], anchos=[4.0, 12.6])

    g.doc.add_paragraph()
    g.linea("Taller de Rúbricas · Lengua Castellana y Literatura · " + FECHA)
    g.linea("Del criterio oficial a la rúbrica, la ficha del alumno y la nota.  ·  " + URL_APP,
            italic=True)
    return g


def main() -> int:
    datos = leer_datos()
    guia = construir(datos)
    guia.doc.save(SALIDA)
    print("Escrito " + str(SALIDA.relative_to(RAIZ)) + " · " + palabra(len(datos["tipos_tarea"]))
          + " tipos de tarea · " + str(datos["criterios"]) + " criterios · "
          + palabra(datos["reglas"]) + " reglas del validador")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
