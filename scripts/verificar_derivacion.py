# -*- coding: utf-8 -*-
"""
Verificador de derivación curricular.

El validador (validar_pack.py) comprueba la forma de un pack; este script comprueba
la procedencia: que todo lo que el proyecto afirma que dice el currículo lo diga de
verdad, y que los packs cuadren con las tablas de derivación del SDD. Nació del
diagnóstico del 2026-08-05: los tres errores de esa fecha vivían en el SDD, no en
los packs, porque el SDD no tenía ninguna prueba.

Cuatro comprobaciones:

 1. CITAS DE PACK. Toda `criterio_oficial.cita` de data/*.json aparece literalmente
    en fuentes/curriculo/ tras normalizar (espacios, saltos de línea, énfasis).
 2. CITAS DEL SDD. Todo texto entre «» o *"..."* en SDD §4.3 y §5.4 aparece
    literalmente en fuentes/curriculo/ o en el Marco Teórico del proyecto de Lengua
    (que se lee, nunca se modifica). Convención: esas comillas significan «esto lo
    dice una fuente»; para uso-mención propio se usan comillas simples, que el
    verificador no examina.
 3. MATRIZ §4.3. Cada pareja curso × tipo de tarea de un pack tiene celda ● u ○ en
    la matriz de tipos de tarea del SDD, que se parsea del propio documento.
 4. TECHO DE PROGRESIÓN §5.4 (regla decidida el 2026-08-05). El campo `progresion`
    de un criterio nunca supera el nivel que la tabla §5.4 asigna a su curso
    (exigencia colada desde arriba = error). Puede quedar por debajo únicamente si
    la redacción del criterio oficial lo justifica con una fórmula guiada («de
    manera guiada», «sencillos», «con ayuda», «pautas y modelos»). Los cursos que
    la tabla no define (2.º Bach, decisión abierta §17.11) generan aviso, no error.

Las tablas §4.3 y §5.4 se leen del SDD en cada ejecución: el SDD sigue siendo la
fuente única y este script se rompe en voz alta si su formato cambia, en lugar de
quedarse obsoleto en silencio.

Es un verificador de taller: necesita fuentes/ y el repositorio de Lengua, que no
viajan con la aplicación, así que vive solo en scripts/ y no tiene gemelo en js/
(a diferencia del validador, SDD §10).

Uso:
    python scripts/verificar_derivacion.py                 (todos los packs de data/)
    python scripts/verificar_derivacion.py data/pack.json
    python scripts/verificar_derivacion.py --auto-prueba   (casos dorados: lo corrupto debe fallar)

Código de salida 1 si hay errores, 0 si todo está limpio.
"""
import copy
import glob
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_FUENTES = os.path.join(RAIZ, "fuentes", "curriculo")
RUTA_SDD = os.path.join(RAIZ, "docs", "diseno", "SDD.md")
RUTA_MARCO = os.path.join(
    "C:\\Users\\Usuario\\Proyectos\\proyecto_plan_de_trabajo_lengua",
    "Metodologías innovadores morfología y sintaxis", "proyecto",
    "documentos_base", "marco_teorico_rubricas-LOMLOE.md")

# Fórmulas con las que el currículo de Murcia rebaja la exigencia de un criterio.
# Si la cita oficial contiene una, el criterio puede quedar por debajo del nivel
# que la tabla §5.4 asigna a su curso. «básico» está aquí porque el propio decreto
# escala así el 5.2: «procedimientos básicos» (1.º-2.º ESO) → «progresivamente
# procedimientos» (3.º) → «procedimientos» a secas (4.º).
FORMULAS_GUIADAS = [
    "de manera guiada", "de forma guiada", "sencillo", "con ayuda",
    "con la ayuda", "pautas", "modelos", "básico",
]

# Fila de la matriz §4.3 que corresponde a cada valor de `tipos_tarea` de un pack.
FILA_POR_TIPO = {
    "narracion": "narración",
    "expositivo": "texto expositivo",
    "oral": "exposición oral",
    "argumentativo": "texto argumentativo",
}


def normalizar(texto):
    """Deja solo lo que sobrevive a un copiado fiel: ni maquetación ni mayúsculas."""
    texto = texto.replace("\\", "")            # el md del BORM escapa puntos: "1\."
    texto = re.sub(r"[*_`«»\"\u201c\u201d]", "", texto)
    # cabecera/pie de pagina del BORM, que a veces cae en mitad de una frase citada
    texto = re.sub(r"NPE:\s*[A-Za-z0-9\-]+", " ", texto)
    texto = re.sub(
        r"Número\s+\d+\s+\w+,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\s+Página\s+\d+",
        " ",
        texto,
    )
    texto = re.sub(r"\s+", " ", texto)         # saltos de línea y dobles espacios
    return texto.strip().lower()


def cargar_fuentes():
    rutas = sorted(glob.glob(os.path.join(DIR_FUENTES, "*.md")))
    if not rutas:
        raise SystemExit("No hay fuentes en %s" % DIR_FUENTES)
    return " ".join(normalizar(open(r, encoding="utf8").read()) for r in rutas)


def cargar_marco():
    if not os.path.isfile(RUTA_MARCO):
        return None
    return normalizar(open(RUTA_MARCO, encoding="utf8").read())


def seccion(texto, inicio, fin):
    i = texto.index(inicio)
    return texto[i:texto.index(fin, i)]


# ---------------------------------------------------------------- comprobación 1

def comprobar_citas_pack(pack, fuentes, err):
    for c in pack["criterios"]:
        cita = c.get("criterio_oficial", {}).get("cita", "")
        if cita and normalizar(cita) not in fuentes:
            err(c["id"], "cita", "la cita no aparece literalmente en fuentes/curriculo/: "
                "«%s…»" % cita[:80])


# ---------------------------------------------------------------- comprobación 2

def citas_del_sdd(sdd):
    """Extrae (sección, cita) de todo lo entrecomillado como fuente en §4.3 y §5.4."""
    pares = []
    tramos = [("§4.3", seccion(sdd, "### 4.3", "## 5.")),
              ("§5.4", seccion(sdd, "### 5.4", "### 5.5"))]
    patrones = [re.compile(r"«([^»]+)»"),
                re.compile(r"\u201c([^\u201d]+)\u201d"),
                re.compile(r'\*"([^"]+)"\*')]
    for donde, tramo in tramos:
        for patron in patrones:
            for m in patron.finditer(tramo):
                pares.append((donde, m.group(1)))
    return pares


def comprobar_citas_sdd(sdd, fuentes, marco, err, avi):
    if marco is None:
        avi("SDD", "marco", "Marco Teórico no accesible en el repositorio de Lengua; "
            "la procedencia de §5.4 solo se comprueba contra fuentes/curriculo/")
    for donde, cita in citas_del_sdd(sdd):
        c = normalizar(cita)
        if c in fuentes or (marco is not None and c in marco):
            continue
        err("SDD", donde, "cita sin fuente literal (ni currículo ni Marco Teórico): "
            "«%s»" % cita[:90])


# ---------------------------------------------------------------- comprobación 3

def parsear_matriz_tareas(sdd):
    """Devuelve {fila_normalizada: {curso: '●'|'○'}} desde la tabla de §4.3."""
    tramo = seccion(sdd, "### 4.3", "## 5.")
    lineas = [l for l in tramo.splitlines() if l.strip().startswith("|")]
    if not lineas:
        raise SystemExit("No encuentro la tabla de tipos de tarea en SDD §4.3")
    cursos = [curso_de_celda(c)[0] for c in celdas(lineas[0])[1:]]
    matriz = {}
    for linea in lineas[2:]:
        partes = celdas(linea)
        fila = normalizar(partes[0])
        matriz[fila] = {curso: v.strip() for curso, v in zip(cursos, partes[1:])
                        if v.strip() in ("●", "○")}
    return matriz


def comprobar_matriz_tareas(pack, matriz, err, avi):
    for c in pack["criterios"]:
        for tipo in c.get("tipos_tarea", []):
            fila = FILA_POR_TIPO.get(tipo)
            if fila is None or fila not in matriz:
                avi(c["id"], "matriz §4.3", "tipo de tarea sin fila en la matriz: '%s'" % tipo)
            elif c["curso"] not in matriz[fila]:
                err(c["id"], "matriz §4.3", "la matriz no sostiene '%s' en %s: "
                    "celda vacía, no hay criterio que abra esa puerta" % (tipo, c["curso"]))


# ---------------------------------------------------------------- comprobación 4

def celdas(linea):
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def curso_de_celda(celda):
    etapa = "BACH" if re.search(r"bach", celda, re.I) else "ESO"
    return ["%s%s" % (n, etapa) for n in re.findall(r"(\d)\.º", celda)]


def parsear_tabla_progresion(sdd):
    """Devuelve {curso: {eje: nivel}} desde la tabla de ejes de §5.4."""
    tramo = seccion(sdd, "### 5.4", "### 5.5")
    lineas = [l for l in tramo.splitlines()
              if l.strip().startswith("|") and "---" not in l]
    cabecera = next(l for l in lineas if normalizar(celdas(l)[0]) == "eje")
    columnas = []                     # [(nivel, [cursos])]
    for celda in celdas(cabecera)[1:]:
        nivel = int(re.match(r"(\d)", celda).group(1))
        columnas.append((nivel, curso_de_celda(celda)))

    tabla = {}
    filas = lineas[lineas.index(cabecera) + 1:]
    ejes = {"autonomía": "autonomia", "complejidad textual": "complejidad",
            "metalingüístico": "metalinguistico"}
    for linea in filas:
        partes = celdas(linea)
        eje = ejes.get(normalizar(partes[0]))
        if eje is None:
            continue
        for (nivel, cursos), celda in zip(columnas, partes[1:]):
            # «(mismo nivel que 4.º ESO …)»: la celda remite a otra columna.
            remite = re.search(r"mismo nivel que (\d)\.º\s*(ESO|Bach)", celda, re.I)
            if remite:
                nivel = tabla["%s%s" % (remite.group(1), remite.group(2).upper())][eje]
            for curso in cursos:
                tabla.setdefault(curso, {})[eje] = nivel
    if not tabla:
        raise SystemExit("No encuentro la tabla de ejes de progresión en SDD §5.4")
    return tabla


def comprobar_progresion(pack, tabla, err, avi):
    fuera_de_tabla = set()
    for c in pack["criterios"]:
        curso = c["curso"]
        if curso not in tabla:
            fuera_de_tabla.add(curso)
            continue
        cita = normalizar(c.get("criterio_oficial", {}).get("cita", ""))
        guiado = any(f in cita for f in FORMULAS_GUIADAS)
        for eje, valor in c.get("progresion", {}).items():
            techo = tabla[curso].get(eje)
            if techo is None:
                avi(c["id"], "progresión", "eje desconocido para la tabla §5.4: '%s'" % eje)
            elif valor > techo:
                err(c["id"], "progresión", "%s=%d supera el techo %d de %s: "
                    "exigencia colada desde arriba (§5.4)" % (eje, valor, techo, curso))
            elif valor < techo and not guiado:
                err(c["id"], "progresión", "%s=%d por debajo del nivel %d de %s sin que "
                    "la cita oficial contenga una fórmula guiada que lo justifique"
                    % (eje, valor, techo, curso))
    for curso in sorted(fuera_de_tabla):
        avi("(pack)", "progresión", "%s queda fuera de la tabla §5.4: extrapolación "
            "pendiente de la decisión §17.11, sin comprobar" % curso)


# ------------------------------------------------------------------- ejecución

def verificar_pack(ruta, fuentes, matriz, tabla):
    pack = json.load(open(ruta, encoding="utf8"))
    errores, avisos = [], []
    err = lambda cid, donde, msg: errores.append((cid, donde, msg))
    avi = lambda cid, donde, msg: avisos.append((cid, donde, msg))
    comprobar_citas_pack(pack, fuentes, err)
    comprobar_matriz_tareas(pack, matriz, err, avi)
    comprobar_progresion(pack, tabla, err, avi)
    return pack, errores, avisos


def informar(titulo, errores, avisos):
    print("=" * 72)
    print(titulo)
    print("-" * 72)
    for cid, donde, msg in errores:
        print("  ERROR   %s · %s\n          %s" % (cid, donde, msg))
    for cid, donde, msg in avisos:
        print("  aviso   %s · %s\n          %s" % (cid, donde, msg))
    if not errores and not avisos:
        print("  Sin incidencias.")
    elif not errores:
        print("\n  Sin errores. %d aviso(s) para revisar." % len(avisos))
    else:
        print("\n  %d error(es): la derivación no se sostiene." % len(errores))
    return bool(errores)


def auto_prueba(fuentes, matriz, tabla, sdd, marco):
    """Casos dorados: cada corrupción deliberada tiene que producir su error."""
    ruta = sorted(glob.glob(os.path.join(RAIZ, "data", "*.json")))[0]
    limpio = json.load(open(ruta, encoding="utf8"))
    fallos = []

    def caso(nombre, mutar, comprobar):
        pack = copy.deepcopy(limpio)
        mutar(pack)
        errores = []
        err = lambda cid, donde, msg: errores.append(msg)
        avi = lambda cid, donde, msg: None
        comprobar(pack, err, avi)
        if not errores:
            fallos.append(nombre)
        print("  %s  %s" % ("PASA " if errores else "FALLA", nombre))

    caso("una cita corrupta debe detectarse",
         lambda p: p["criterios"][0]["criterio_oficial"].update(
             cita=p["criterios"][0]["criterio_oficial"]["cita"].replace("a", "x", 3)),
         lambda p, err, avi: comprobar_citas_pack(p, fuentes, err))
    caso("progresión por encima del techo debe detectarse",
         lambda p: p["criterios"][0]["progresion"].update(complejidad=4),
         lambda p, err, avi: comprobar_progresion(p, tabla, err, avi))
    caso("progresión por debajo sin fórmula guiada debe detectarse",
         lambda p: (p["criterios"][0]["progresion"].update(autonomia=0),
                    p["criterios"][0]["criterio_oficial"].update(
                        cita="Producir textos escritos y multimodales coherentes.")),
         lambda p, err, avi: comprobar_progresion(p, tabla, err, avi))
    caso("un curso sin celda en la matriz §4.3 debe detectarse",
         lambda p: p["criterios"][0].update(curso="4ESO", tipos_tarea=["narracion"],
                                            progresion=tabla["4ESO"].copy()),
         lambda p, err, avi: comprobar_matriz_tareas(p, matriz, err, avi))

    # Y una cita corrupta del SDD también.
    sdd_corrupto = sdd.replace('*"de manera guiada"*', '*"de manera guiada e inventada"*')
    if sdd_corrupto == sdd:
        raise SystemExit("auto-prueba mal montada: no encontré la cita que corromper en el SDD")
    errores = []
    comprobar_citas_sdd(sdd_corrupto, fuentes, marco,
                        lambda cid, donde, msg: errores.append(msg),
                        lambda cid, donde, msg: None)
    ok = any("inventada" in e for e in errores)
    if not ok:
        fallos.append("cita corrupta del SDD")
    print("  %s  una cita corrupta en el SDD debe detectarse" % ("PASA " if ok else "FALLA"))

    print("-" * 72)
    if fallos:
        print("AUTO-PRUEBA FALLIDA: el verificador no detecta: %s" % ", ".join(fallos))
        return 1
    print("Auto-prueba superada: toda corrupción deliberada fue detectada.")
    return 0


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    fuentes = cargar_fuentes()
    marco = cargar_marco()
    sdd = open(RUTA_SDD, encoding="utf8").read()
    matriz = parsear_matriz_tareas(sdd)
    tabla = parsear_tabla_progresion(sdd)

    if "--auto-prueba" in sys.argv:
        return auto_prueba(fuentes, matriz, tabla, sdd, marco)

    fallo = False

    # El SDD se comprueba siempre, se pida el pack que se pida.
    errores, avisos = [], []
    comprobar_citas_sdd(sdd, fuentes, marco,
                        lambda cid, donde, msg: errores.append((cid, donde, msg)),
                        lambda cid, donde, msg: avisos.append((cid, donde, msg)))
    fallo |= informar("SDD §4.3 y §5.4 · procedencia de las citas", errores, avisos)

    rutas = [a for a in sys.argv[1:] if not a.startswith("--")]
    rutas = rutas or sorted(glob.glob(os.path.join(RAIZ, "data", "*.json")))
    for ruta in rutas:
        pack, errores, avisos = verificar_pack(ruta, fuentes, matriz, tabla)
        fallo |= informar("%s · derivación contra fuentes y SDD" % pack["pack_id"],
                          errores, avisos)
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
