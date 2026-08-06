# -*- coding: utf-8 -*-
"""
Validador de packs de criterios.

Comprueba un pack contra las reglas del SDD §10: trazabilidad curricular,
banco cerrado de verbos, ausencia de adverbitis, gradación positiva del nivel 1,
y toda la aritmética de las matrices cuantitativas (§6.3), incluido el doble castigo.

Uso:
    python scripts/validar_pack.py data/pack-lcl-expositivo.json
    python scripts/validar_pack.py            (valida todos los packs de data/)

Devuelve código de salida 1 si hay errores, 0 si el pack está limpio.
"""
import json, re, sys, glob, os, collections, unicodedata

# Calificadores vagos: la "adverbitis" del marco teórico §3.
ADVERBITIS = [
    "bien", "regular", "adecuadamente", "correctamente", "frecuentemente",
    "a veces", "bastante", "suficientemente", "de forma adecuada", "normalmente",
    "casi siempre", "en general", "habitualmente", "de manera correcta",
    "puntualmente", "escasamente", "muy ",
]

# Un descriptor de nivel 1 describe lo que el alumno sí hace, de forma limitada.
NEGACIONES = ["no ", "carece", "sin lograr", "es incapaz", "nunca "]

VACIAS = {"cada", "de", "la", "el", "los", "las", "un", "una", "que", "sin",
          "por", "no", "y", "en", "su", "se", "mas", "con", "al", "del", "sea"}

TOPE_PENALIZACION = 0.35   # ninguna penalización pasa del 35% de la dimensión
TOPE_CONJUNTO = 0.50       # todas juntas, no más de la mitad
SIMILITUD_MAX = 0.75       # dos niveles contiguos no pueden parecerse más

# Cabeza del nombre de dimensión que coincide exactamente con un saber, no
# una acción competencial (paridad con js/validador.js, §3.3). Ya normalizada:
# minúsculas y sin tildes.
SABERES_PROHIBIDOS = {
    "sintaxis", "morfologia", "ortografia", "puntuacion", "acentuacion", "lexico",
    "vocabulario", "oracion", "oraciones", "subordinadas", "sintagma", "sintagmas",
    "metrica", "figuras retoricas", "generos literarios", "barroco", "romanticismo",
    "renacimiento", "siglo de oro", "literatura medieval",
}

# Modalizadores del criterio (paridad con js/validador.js, §3.4). Solo estas
# dos direcciones: las familias "sencillez" y "extensión" se descartaron
# deliberadamente (ver §5 de la especificación del validador de la app).
DISPARADORES_AYUDA = ["de manera guiada", "de forma guiada", "con ayuda de pautas y modelos", "modelos dados"]
MARCAS_ANDAMIAJE = ["guiad", "pauta", "modelo", "guion", "plantilla", "indicad", "facilitad", "profesor", "con apoyo"]
DISPARADORES_AUTONOMIA = ["progresivamente autonoma", "de manera autonoma", "de forma autonoma", "con autonomia"]
MARCAS_ANDAMIAJE_RESIDUAL = [
    "indicadas por el profesor", "indicados por el profesor", "con la pauta facilitada",
    "con la pauta dada", "con el modelo dado", "segun el guion facilitado", "de manera guiada",
]

# Fórmulas del propio decreto que sostienen que una dimensión evalúa una fase
# del proceso y no el texto terminado (paridad con js/validador.js, §5.2).
# Sin "esquema": el 6.1 usa "esquemas propios" para la reorganización mental
# de información ajena en el texto terminado, no para el esquema como fase
# previa de escritura — coinciden en la palabra, no en el referente.
FORMULAS_PROCESO = ["planificar", "planificacion", "borrador", "revisar", "revision"]


def primer_verbo(texto):
    return re.findall(r"\w+", texto.lower())[0]


def palabras(texto):
    return set(re.findall(r"\w+", texto.lower()))


def quitar_tildes(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


# Texto antes del primer ':', '(' o '—' del nombre de la dimensión (paridad
# con js/validador.js, cabezaDimension).
def cabeza_dimension(nombre):
    posiciones = [p for p in (nombre.find(sep) for sep in (":", "(", "—")) if p != -1]
    corte = min(posiciones) if posiciones else len(nombre)
    return nombre[:corte].strip()


def validar(ruta):
    pack = json.load(open(ruta, encoding="utf8"))
    verbos = {v["3s"].lower(): v for v in pack["verbos"]}
    errores, avisos = [], []
    pesos = collections.defaultdict(int)
    con_matriz = 0

    def err(cid, donde, msg): errores.append((cid, donde, msg))
    def avi(cid, donde, msg): avisos.append((cid, donde, msg))

    for c in pack["criterios"]:
        cid = c["id"]
        pesos[c["curso"]] += c["peso_base"]

        # --- Trazabilidad curricular: sin criterio oficial no hay rúbrica ---
        if not c.get("criterio_oficial", {}).get("cita"):
            err(cid, "trazabilidad", "no cita ningún criterio de evaluación oficial")

        # --- Saber como vehículo: la dimensión es una acción competencial,
        # no un contenido (CLAUDE.md regla 5); se comprueba la cabeza del
        # nombre, antes de ':', '(' o '—'. ---
        cabeza = cabeza_dimension(c["nombre"])
        if re.match(r"(?i)^(el|la|los|las|un|una|lo)\s", cabeza):
            err(cid, "saber_vehiculo",
                "el nombre de la dimensión ('%s') empieza por un artículo: nombra un contenido, no una acción competencial" % c["nombre"])
        if quitar_tildes(cabeza.lower()) in SABERES_PROHIBIDOS:
            err(cid, "saber_vehiculo",
                "'%s' es un saber, no una dimensión: los saberes son vehículo, van dentro del descriptor" % cabeza)

        # --- Modalizadores del criterio: la ayuda o autonomía que declara
        # la cita oficial debe verse en los descriptores. ---
        cita = c.get("criterio_oficial", {}).get("cita")
        if cita:
            cita_norm = quitar_tildes(cita.lower())
            codigo = c.get("criterio_oficial", {}).get("codigo")

            disparador_ayuda = next((d for d in DISPARADORES_AYUDA if d in cita_norm), None)
            if disparador_ayuda:
                texto_descriptores = quitar_tildes(
                    " ".join(c["descriptores"].get(n, {}).get("texto", "") for n in ("n1", "n2", "n3", "n4")).lower()
                )
                if not any(marca in texto_descriptores for marca in MARCAS_ANDAMIAJE):
                    avi(cid, "modalizadores",
                        "el criterio %s de %s evalúa '%s' y ningún descriptor nombra la ayuda" % (codigo, c["curso"], disparador_ayuda))

            disparador_autonomia = next((d for d in DISPARADORES_AUTONOMIA if d in cita_norm), None)
            if disparador_autonomia:
                for nivel in ("n1", "n2", "n3", "n4"):
                    d = c["descriptores"].get(nivel)
                    if not d:
                        continue
                    texto_norm = quitar_tildes(d["texto"].lower())
                    marca = next((m for m in MARCAS_ANDAMIAJE_RESIDUAL if m in texto_norm), None)
                    if marca:
                        avi(cid, "modalizadores",
                            "el criterio %s ya pide autonomía y el descriptor %s mantiene el andamiaje del curso anterior ('%s')" % (codigo, nivel, marca))

        # --- Dimensión de proceso sin respaldo: `evalua_proceso` decide qué
        # premarca la puerta de "fase de un texto" (§8), así que se sostiene
        # con la cita como todo lo demás. Solo esta dirección: deducir de la
        # cita qué dimensiones son de proceso marcaría media rúbrica, porque
        # el 5.1 sostiene también la adecuación del texto terminado. ---
        if c.get("evalua_proceso"):
            cita_proceso = quitar_tildes((c.get("criterio_oficial", {}).get("cita") or "").lower())
            if not any(f in cita_proceso for f in FORMULAS_PROCESO):
                err(cid, "proceso_sin_respaldo",
                    "se declara dimensión de proceso y el criterio %s de %s no habla de planificar, de borradores ni de revisar"
                    % (c.get("criterio_oficial", {}).get("codigo"), c["curso"]))

        # --- Descriptores ---
        for nivel, d in c["descriptores"].items():
            texto = d["texto"]
            minus = " " + texto.lower()
            verbo = primer_verbo(texto)

            if verbo not in verbos:
                err(cid, nivel, "el descriptor no empieza por un verbo del banco: '%s'" % verbo)
            elif verbos[verbo]["id"] != d["verbo"]:
                err(cid, nivel, "el verbo declarado (%s) no es el del texto (%s)" % (d["verbo"], verbo))

            for a in ADVERBITIS:
                if a in minus:
                    err(cid, nivel, "adverbitis: '%s'" % a.strip())

            if nivel == "n1":
                for n in NEGACIONES:
                    if (" " + n) in minus[:45]:
                        err(cid, nivel, "gradación negativa: el nivel 1 describe lo que sí hace, no lo que falta ('%s')" % n.strip())

        niveles = [c["descriptores"][n]["texto"] for n in ("n1", "n2", "n3", "n4")]
        for i in range(3):
            a, b = palabras(niveles[i]), palabras(niveles[i + 1])
            j = len(a & b) / len(a | b)
            if j > SIMILITUD_MAX:
                avi(cid, "n%d/n%d" % (i + 1, i + 2), "niveles casi indistinguibles (similitud %.2f)" % j)

        # --- Matriz cuantitativa (opcional por dimensión) ---
        m = c.get("matriz_cuantitativa")
        if m is None:
            continue
        con_matriz += 1

        suma = sum(x["max"] for x in m["componentes"])
        if suma != m["total"]:
            err(cid, "matriz", "los componentes suman %d y el total declarado es %d" % (suma, m["total"]))

        for comp in m["componentes"]:
            etq = "matriz · " + comp["nombre"]
            puntos = [b["puntos"] for b in comp["bandas"]]
            if puntos != sorted(puntos, reverse=True):
                err(cid, etq, "bandas desordenadas: %s" % puntos)
            if max(puntos) != comp["max"]:
                err(cid, etq, "la banda más alta vale %s pero el máximo del componente es %s" % (max(puntos), comp["max"]))
            if min(puntos) != 0:
                err(cid, etq, "falta la banda de 0 puntos")
            if len(set(puntos)) != len(puntos):
                err(cid, etq, "hay puntuaciones repetidas entre bandas")
            for b in comp["bandas"]:
                minus = " " + b["condicion"].lower()
                for a in ADVERBITIS:
                    if a in minus:
                        err(cid, etq, "adverbitis en una banda ('%s'): la matriz deja de ser contable" % a.strip())

        for pen in m["penalizaciones"]:
            clave = pen["clave"]
            if pen.get("tope") is None:
                err(cid, "matriz", "la penalización '%s' no declara tope" % clave)
            elif pen["tope"] >= 0:
                err(cid, "matriz", "el tope de '%s' debe ser negativo" % clave)
            elif pen["puntos"] >= 0:
                err(cid, "matriz", "la penalización '%s' no resta" % clave)
            elif abs(pen["tope"]) > m["total"] * TOPE_PENALIZACION:
                err(cid, "matriz", "el tope de '%s' (%s) pasa del %d%% de la dimensión"
                    % (clave, pen["tope"], TOPE_PENALIZACION * 100))

            # Doble castigo (SDD §6.3): la penalización mide algo que una banda ya mide.
            terminos = {w for w in palabras(clave + " " + pen["por"]) if len(w) > 4} - VACIAS
            for comp in m["componentes"]:
                bandas = " ".join(b["condicion"] for b in comp["bandas"]).lower()
                solapa = sorted(w for w in terminos if w in bandas)
                if len(solapa) >= 2:
                    err(cid, "matriz", "DOBLE CASTIGO: '%s' repite lo que ya mide el componente '%s' (%s)"
                        % (clave, comp["nombre"], ", ".join(solapa[:3])))

        conjunto = sum(abs(x.get("tope") or 0) for x in m["penalizaciones"])
        if conjunto > m["total"] * TOPE_CONJUNTO:
            err(cid, "matriz", "las penalizaciones juntas pueden restar %s de %s" % (conjunto, m["total"]))

    # --- Tarea aplicable al curso: el currículo no sostiene todas las
    # tareas en todos los cursos (§4.3). ---
    combos = collections.defaultdict(list)
    for c in pack["criterios"]:
        for tipo_tarea in c["tipos_tarea"]:
            combos[(c["curso"], tipo_tarea)].append(c)
    for (curso, tipo_tarea), lista in sorted(combos.items()):
        if len(lista) < 3:
            avi("(pack)", "tarea_aplicable",
                "%s · %s: la combinación se sostiene con solo %d dimensión(es)" % (curso, tipo_tarea, len(lista)))
        if not any(x["prioridad"] == 1 for x in lista):
            avi("(pack)", "tarea_aplicable",
                "%s · %s: ninguna dimensión es de prioridad 1, así que con poco tiempo de corrección el instrumento se queda vacío" % (curso, tipo_tarea))

    # --- Copia entre cursos: descriptores N2-N4 idénticos en dos cursos
    # distintos de la misma dimensión suelen ser copiar y pegar, no
    # progresión (N1 queda exento: la misma evidencia vale en cualquier curso). ---
    por_dimension = collections.defaultdict(list)
    for c in pack["criterios"]:
        por_dimension[c["dimension"]].append(c)
    for dimension, lista in por_dimension.items():
        for i in range(len(lista)):
            for j in range(i + 1, len(lista)):
                a, b = lista[i], lista[j]
                if a["curso"] == b["curso"]:
                    continue
                iguales = all(
                    a["descriptores"].get(n, {}).get("texto") == b["descriptores"].get(n, {}).get("texto")
                    for n in ("n2", "n3", "n4")
                )
                if iguales:
                    avi("%s / %s" % (a["id"], b["id"]), "copia_entre_cursos",
                        "dimensión '%s': los descriptores N2-N4 de %s y %s son idénticos" % (dimension, a["curso"], b["curso"]))

    # --- Pesos ---
    for curso, total in sorted(pesos.items()):
        if total != 100:
            avi("(pack)", "pesos", "los pesos de %s suman %d, no 100 (el motor normaliza, pero conviene cuadrarlo)" % (curso, total))

    return pack, errores, avisos, con_matriz, dict(pesos)


def main():
    rutas = sys.argv[1:] or sorted(glob.glob(os.path.join("data", "*.json")))
    if not rutas:
        print("No hay packs que validar en data/")
        return 1

    fallo = False
    for ruta in rutas:
        pack, errores, avisos, con_matriz, pesos = validar(ruta)
        print("=" * 72)
        print("%s  ·  %s  ·  v%s" % (pack["pack_id"], pack["etiqueta"], pack["version"]))
        print("%d criterios · %d con matriz cuantitativa · pesos por curso: %s"
              % (len(pack["criterios"]), con_matriz, pesos))
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
            fallo = True
            print("\n  %d error(es): el pack no se cargaría en la aplicación." % len(errores))
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
