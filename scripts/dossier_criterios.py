# -*- coding: utf-8 -*-
"""
Dossier de criterios: qué criterio de evaluación existe en qué curso, con su cita
literal, y qué pack lo reclama hoy.

Existe para no releer 177 KB de decreto cada vez que se estudia un tipo de tarea
nuevo. Antes de escribir un pack hay que responder siempre a las mismas tres
preguntas —qué criterio abre la celda de este curso, cómo está redactado, y si ya
lo usa otro pack— y responderlas a mano sale caro y sale mal, porque la numeración
de una misma competencia BAILA entre cursos:

  · el criterio de trabajos de investigación es 6.1 en 2.º ESO y 6.2 en 3.º;
  · la competencia 4 alterna «comprender e interpretar» (1.º y 3.º ESO) y
    «valorar» (2.º y 4.º ESO), y en Bachillerato las tiene las dos, como 4.1 y 4.2;
  · el 9.1 de 2.º ESO («propósito comunicativo») no es el 9.1 de los demás cursos,
    que es «revisar los textos propios».

Esa es justo la clase de detalle que se da por sabido y se falla. La regla 9 de
CLAUDE.md pide comprobar toda regla de derivación en los seis cursos a la vez;
esto es la herramienta que lo hace barato.

NO es una comprobación: no dice si algo está bien o mal, solo enseña la fuente
ordenada y deja el juicio donde tiene que estar. Por eso no entra en
scripts/comprobar_todo.py, igual que scripts/simular_correccion.py tampoco entra.
Quien verifica las citas sigue siendo scripts/verificar_derivacion.py.

El recorte de las fuentes por cursos no se reimplementa aquí: se importa de
verificar_derivacion, que a su vez lo saca de `materias.<X>.fuentes` de
data/catalogo.json. Este script no sabe dónde empieza 3.º de ESO, y es a propósito.

Uso:
    python scripts/dossier_criterios.py                     todos los cursos
    python scripts/dossier_criterios.py --curso 2ESO,4ESO   solo esos
    python scripts/dossier_criterios.py --codigo 4.1        ese código, curso a curso
    python scripts/dossier_criterios.py --libres            los que no usa ningún pack
    python scripts/dossier_criterios.py --breve             una línea por criterio
    python scripts/dossier_criterios.py --saber publicidad  busca en los saberes básicos
"""
import argparse
import os
import re
import sys
import textwrap

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from catalogo import catalogo, cargar_json, RAIZ
from verificar_derivacion import bloques_por_curso, limpiar

# Un criterio empieza por su código y sigue hasta el siguiente código, una cabecera
# o una línea en blanco. Los dos decretos NO están maquetados igual y hay que
# aguantar las dos formas: el de ESO separa los criterios con línea en blanco y
# escribe "4.1.", con punto final; el de Bachillerato los pone seguidos y escribe
# "4.1", sin él. Además el md del BORM escapa los puntos a veces: "4\.1\.".
CODIGO = re.compile(r"^(\d{1,2})\.(\d{1,2})\.?\s+(\S.*)$")
CABECERA = re.compile(r"^(Competencia específica|Saberes básicos|"
                      r"Criterios de evaluación|```)")
ANCHO = 94


def bloque_de_criterios(bloque):
    """El trozo del curso que va de «Criterios de evaluación» a «Saberes básicos».

    Se toma la PRIMERA aparición de cada marca. Importa en 4.º de ESO: su bloque
    llega hasta que una cabecera de curso se repite para otra materia (lengua de
    signos), así que arrastra detrás material que no es de Lengua Castellana."""
    i = bloque.find("Criterios de evaluación")
    if i < 0:
        return bloque
    j = bloque.find("Saberes básicos", i)
    return bloque[i:j if j > 0 else len(bloque)]


def bloque_de_saberes(bloque):
    """De «Saberes básicos» hasta que vuelvan a empezar unos criterios (o el final)."""
    i = bloque.find("Saberes básicos")
    if i < 0:
        return ""
    j = bloque.find("Criterios de evaluación", i)
    return bloque[i:j if j > 0 else len(bloque)]


def criterios_de(bloque):
    """[(codigo, cita)] de un bloque de curso, en el orden del decreto."""
    encontrados = []
    codigo, partes = None, []

    def cerrar():
        if codigo:
            encontrados.append((codigo, limpiar(" ".join(partes))))

    for linea in bloque_de_criterios(bloque).splitlines():
        s = limpiar(linea)
        # Un criterio se corta SOLO ante otro código o una cabecera de verdad.
        # Lo que se salta sin cerrarlo nada: líneas en blanco, vallas ``` y las
        # cabeceras de página del BORM, porque las tres caen a mitad de una frase
        # citada y las tres llegaron a partir en dos una cita (3.º ESO 6.1 por una
        # valla, 2.º Bach 3.1 por un "NPE: …"). limpiar() ya deja esas cabeceras
        # en nada, así que aquí basta con no darlas por fin de párrafo.
        if not s or s.startswith("```"):
            continue
        m = CODIGO.match(s)
        if m:
            cerrar()
            codigo, partes = "%s.%s" % (m.group(1), m.group(2)), [m.group(3)]
        elif CABECERA.match(s):
            cerrar()
            codigo, partes = None, []
        elif codigo:
            partes.append(s)
    cerrar()
    return encontrados


def mote(pack_id):
    """`lcl-murcia-argumentativo` → `argumentativo`: lo que se lee de un vistazo."""
    return pack_id.rsplit("-", 1)[-1]


def uso_de_los_packs(materia):
    """{(curso, codigo): [(mote, id_criterio, [tipos de tarea])]} según los packs.

    Se recorre `packs` del catálogo, nunca un glob de data/: un archivo suelto ahí
    no es un pack (esa confusión ya costó un fallo, ver scripts/catalogo.py)."""
    uso = {}
    for entrada in catalogo()["packs"]:
        if entrada.get("materia") != materia:
            continue
        pack = cargar_json(os.path.join(RAIZ, entrada["archivo"]))
        for c in pack["criterios"]:
            clave = (c["curso"], c["criterio_oficial"]["codigo"])
            uso.setdefault(clave, []).append(
                (mote(pack["pack_id"]), c["id"], c.get("tipos_tarea", [])))
    return uso


def imprimir_criterio(codigo, cita, usos, breve):
    if usos:
        quien = ", ".join(sorted({m for m, _, _ in usos}))
        cabeza = "  %-5s usan: %s" % (codigo, quien)
    else:
        cabeza = "  %-5s LIBRE" % codigo
    print(cabeza)
    if breve:
        return
    for linea in textwrap.wrap(cita, ANCHO - 8):
        print("        " + linea)
    print("")


def informe(args):
    cat = catalogo()
    etiquetas = cat["cursos"]["etiquetas"]
    orden = cat["cursos"]["orden"]
    bloques = bloques_por_curso()
    uso = uso_de_los_packs(args.materia)

    cursos = [c for c in orden if c in bloques]
    if args.curso:
        pedidos = [c.strip() for c in args.curso.split(",") if c.strip()]
        desconocidos = [c for c in pedidos if c not in cursos]
        if desconocidos:
            raise SystemExit(
                "Curso desconocido: %s. Los que hay en las fuentes son: %s"
                % (", ".join(desconocidos), ", ".join(cursos)))
        cursos = [c for c in cursos if c in pedidos]

    for curso in cursos:
        _, bloque = bloques[curso]

        if args.saber:
            # Sobre el texto ya corrido, no línea a línea: el decreto parte las
            # frases con saltos y un término de dos palabras se perdería justo
            # en el corte, que es donde más falta hace encontrarlo.
            texto = limpiar(bloque_de_saberes(bloque))
            hallazgos = []
            for m in re.finditer(re.escape(args.saber), texto, re.I):
                ini, fin = max(0, m.start() - 90), min(len(texto), m.end() + 90)
                hallazgos.append("%s%s%s" % ("…" if ini else "",
                                             texto[ini:fin],
                                             "…" if fin < len(texto) else ""))
            print("=" * ANCHO)
            print("%s — saberes básicos que nombran «%s»: %d"
                  % (etiquetas.get(curso, curso), args.saber, len(hallazgos)))
            print("=" * ANCHO)
            for h in hallazgos:
                for i, linea in enumerate(textwrap.wrap(h, ANCHO - 6)):
                    print(("  · " if i == 0 else "    ") + linea)
            if not hallazgos:
                print("  (ninguno: si el criterio lo sostiene, la celda es ○, no ●)")
            print("")
            continue

        filas = criterios_de(bloque)
        if args.codigo:
            filas = [f for f in filas if f[0] == args.codigo]
        if args.libres:
            filas = [f for f in filas if not uso.get((curso, f[0]))]
        if not filas:
            continue

        print("=" * ANCHO)
        print(etiquetas.get(curso, curso))
        print("=" * ANCHO)
        for codigo, cita in filas:
            imprimir_criterio(codigo, cita, uso.get((curso, codigo), []), args.breve)
        if args.breve:
            print("")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    p = argparse.ArgumentParser(
        description="Criterios de evaluación por curso, con su cita literal y "
                    "qué pack los usa hoy. Solo enseña la fuente; no valida nada.")
    p.add_argument("--materia", default="LCL",
                   help="clave de materia en data/catalogo.json (por defecto: LCL)")
    p.add_argument("--curso", help="uno o varios, separados por comas: 2ESO,4ESO")
    p.add_argument("--codigo", help="un solo código, para verlo curso a curso: 4.1")
    p.add_argument("--libres", action="store_true",
                   help="solo los criterios que no reclama ningún pack")
    p.add_argument("--breve", action="store_true",
                   help="una línea por criterio, sin la cita")
    p.add_argument("--saber",
                   help="busca un término en los saberes básicos de cada curso; "
                        "es lo que distingue ● (nombrado) de ○ (solo sostenido)")
    args = p.parse_args()

    if args.materia not in catalogo()["materias"]:
        raise SystemExit("La materia %s no está en data/catalogo.json." % args.materia)

    informe(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
