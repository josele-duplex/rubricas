# -*- coding: utf-8 -*-
"""
Escribe en el SDD las dos tablas de derivación desde data/derivacion-<materia>.json.

Por qué existe: la matriz de tipos de tarea (§4.3) y la tabla de ejes de progresión
(§5.4) estaban escritas a mano en el SDD, y `verificar_derivacion.py` las leía
parseando markdown. Funcionaba con una materia; con dos, el SDD tendría varias
matrices y ese parseo se quedaba corto (deuda anotada en
`docs/diseno/anadir-una-materia.md`). Ahora manda `data/`, y las tablas del SDD son
derivadas y comprobadas, como docs/revision-*.md y js/lexico.js.

Lo que este generador NO toca es la prosa. Solo reescribe lo que hay entre los dos
marcadores de cada sección; el razonamiento, las citas que sostienen cada celda y la
regla del techo siguen escritos a mano en el SDD, que es donde tienen sentido. Este
archivo escribe el dato; el SDD dice por qué el dato es ese.

    python scripts/generar_tablas_sdd.py              reescribe las tablas del SDD
    python scripts/generar_tablas_sdd.py --comprobar  falla si el SDD está desfasado

La comprobación corre en scripts/comprobar_todo.py y en el CI.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import catalogo, derivacion, materias   # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_SDD = os.path.join(RAIZ, "docs", "diseno", "SDD.md")

ABRE = ("<!-- TABLA GENERADA: %s · fuente: data/derivacion-<materia>.json · "
        "se reescribe con: python scripts/generar_tablas_sdd.py -->")
CIERRA = "<!-- FIN TABLA GENERADA -->"


def etiqueta_corta(curso):
    cursos = catalogo()["cursos"]
    return cursos["etiquetas_cortas"].get(curso, cursos["etiquetas"].get(curso, curso))


def etiqueta_de_columna(cursos):
    """«2.º ESO» y «3.º ESO» juntos se leen «2.º/3.º ESO».

    Se calcula, no se escribe en el JSON: la lista de cursos es el dato y la etiqueta
    de la cabecera es su presentación, y dos copias de lo mismo acaban separándose.
    Si las etiquetas no comparten la última palabra —una columna que mezcle etapas—,
    se listan enteras, que es feo pero nunca es mentira."""
    etiquetas = [etiqueta_corta(c) for c in cursos]
    if len(etiquetas) == 1:
        return etiquetas[0]
    colas = {e.rsplit(" ", 1)[-1] for e in etiquetas}
    if len(colas) == 1 and all(" " in e for e in etiquetas):
        cola = colas.pop()
        return "/".join(e.rsplit(" ", 1)[0] for e in etiquetas) + " " + cola
    return " / ".join(etiquetas)


def rotulo_de_materia(etiqueta, cuantas):
    """Con una sola materia la tabla va sola, como estaba escrita a mano. En cuanto
    hay dos, cada una necesita decir de quién es."""
    return ["**%s**" % etiqueta, ""] if cuantas > 1 else []


# ------------------------------------------------------------------ §4.3

def tabla_matriz_tareas(clave, materia, cuantas):
    datos = derivacion(clave)["matriz_tareas"]
    cursos = catalogo()["cursos"]["orden"]
    simbolos = datos["simbolos"]
    celdas = datos["celdas"]

    L = rotulo_de_materia(materia["etiqueta"], cuantas)
    L.append("| Tipo de tarea | %s |" % " | ".join(etiqueta_corta(c) for c in cursos))
    L.append("|---|%s" % (":---:|" * len(cursos)))
    for tipo, nombre in materia["tipos_tarea"].items():
        fila = celdas.get(tipo, {})
        marcas = []
        for curso in cursos:
            clave_celda = fila.get(curso)
            if clave_celda is None:
                marcas.append("")
            elif clave_celda not in simbolos:
                raise SystemExit(
                    "data/derivacion-%s.json: la celda %s × %s usa el símbolo '%s', que no "
                    "está en `simbolos`." % (clave.lower(), tipo, curso, clave_celda))
            else:
                marcas.append(simbolos[clave_celda]["simbolo"])
        L.append("| %s | %s |" % (nombre, " | ".join(marcas)))
    sobran = set(celdas) - set(materia["tipos_tarea"])
    if sobran:
        raise SystemExit(
            "data/derivacion-%s.json tiene celdas de tipos de tarea que la materia no "
            "declara en data/catalogo.json: %s" % (clave.lower(), ", ".join(sorted(sobran))))
    L.append("")
    L.append(" · ".join("%s %s" % (s["simbolo"], s["significa"]) for s in simbolos.values()))
    return L


# ------------------------------------------------------------------ §5.4

def tabla_ejes(clave, materia, cuantas):
    datos = derivacion(clave)["ejes_progresion"]
    columnas = datos["columnas"]

    L = rotulo_de_materia(materia["etiqueta"], cuantas)
    L.append("| Eje | %s |" % " | ".join(
        "%d — %s" % (c["nivel"], etiqueta_de_columna(c["cursos"])) for c in columnas))
    L.append("|---|%s" % ("---|" * len(columnas)))
    for eje in datos["ejes"]:
        if len(eje["celdas"]) != len(columnas):
            raise SystemExit(
                "data/derivacion-%s.json: el eje '%s' tiene %d celdas y la tabla tiene %d "
                "columnas." % (clave.lower(), eje["id"], len(eje["celdas"]), len(columnas)))
        textos = []
        for celda in eje["celdas"]:
            if isinstance(celda, dict):
                textos.append("*(mismo nivel que %s — %s)*"
                              % (etiqueta_corta(celda["mismo_nivel_que"]), celda["porque"]))
            else:
                textos.append(celda)
        L.append("| **%s** | %s |" % (eje["etiqueta"], " | ".join(textos)))
    return L


# ------------------------------------------------------------------ escritura

def bloque(nombre, generar_tabla):
    L = [ABRE % nombre]
    lista = materias()
    for i, (clave, materia) in enumerate(lista):
        if i:
            L.append("")
        L.extend(generar_tabla(clave, materia, len(lista)))
    L.append(CIERRA)
    return "\n".join(L)


def sustituir(sdd, nombre, contenido):
    patron = re.compile(
        r"<!-- TABLA GENERADA: %s\b.*?-->.*?%s" % (re.escape(nombre), re.escape(CIERRA)),
        re.S)
    nuevo, n = patron.subn(lambda _: contenido, sdd)
    if n != 1:
        raise SystemExit(
            "No encuentro exactamente un bloque '%s' en docs/diseno/SDD.md (encontré %d).\n"
            "Los marcadores son:\n  %s\n  %s" % (nombre, n, ABRE % nombre, CIERRA))
    return nuevo


def generar():
    sdd = open(RUTA_SDD, encoding="utf8").read()
    sdd = sustituir(sdd, "matriz-tareas", bloque("matriz-tareas", tabla_matriz_tareas))
    sdd = sustituir(sdd, "ejes-progresion", bloque("ejes-progresion", tabla_ejes))
    return sdd


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    nuevo = generar()
    actual = open(RUTA_SDD, encoding="utf8").read()

    if "--comprobar" in sys.argv:
        if actual == nuevo:
            print("Las tablas §4.3 y §5.4 del SDD están al día con data/derivacion-*.json.")
            return 0
        print("ERROR: las tablas §4.3 o §5.4 del SDD no coinciden con data/derivacion-*.json.")
        print("       El SDD y la fuente de la derivación se han separado.")
        print("       Si el cambio es correcto, hazlo en data/ y ejecuta:")
        print("       python scripts/generar_tablas_sdd.py")
        return 1

    if actual == nuevo:
        print("Las tablas §4.3 y §5.4 del SDD ya estaban al día.")
        return 0
    with open(RUTA_SDD, "w", encoding="utf8", newline="\n") as f:
        f.write(nuevo)
    print("Reescritas las tablas §4.3 y §5.4 de docs/diseno/SDD.md desde data/derivacion-*.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
