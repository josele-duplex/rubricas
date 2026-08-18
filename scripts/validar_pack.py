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
import json, re, sys, os, collections, unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import lexico as cargar_lexico, rutas_de_packs, cargar_pack   # noqa: E402

# Las palabras de las reglas viven en un solo sitio (data/reglas-lexicas.json) y
# js/validador.js las recibe generadas desde ese mismo archivo. Antes estaban
# escritas dos veces y ya habían divergido: este script marcaba "bienestar" como
# adverbitis por contener "bien" y la aplicación no, de modo que la app daba por
# limpio un pack que este script rechazaba — justo lo que el SDD §10 prohíbe.
LEXICO = cargar_lexico()
COMUN = LEXICO["comun"]

ADVERBITIS_SUBCADENA = COMUN["adverbitis"]["subcadena"]
ADVERBITIS_PALABRA_COMPLETA = COMUN["adverbitis"]["palabra_completa"]
ADVERBITIS_MULTIPALABRA = COMUN["adverbitis"]["multipalabra"]
NEGACIONES = COMUN["negaciones"]
VACIAS = set(COMUN["palabras_vacias"])
MODALIZADORES = COMUN["modalizadores"]
DISPARADORES_AYUDA = MODALIZADORES["disparadores_ayuda"]
MARCAS_ANDAMIAJE = MODALIZADORES["marcas_andamiaje"]
DISPARADORES_AUTONOMIA = MODALIZADORES["disparadores_autonomia"]
MARCAS_ANDAMIAJE_RESIDUAL = MODALIZADORES["marcas_andamiaje_residual"]

RECUENTO = COMUN["recuento_bandas"]
NUMERALES = RECUENTO["numerales"]

UMBRALES = COMUN["umbrales"]
TOPE_PENALIZACION = UMBRALES["tope_penalizacion"]              # por penalización
TOPE_CONJUNTO = UMBRALES["tope_conjunto_penalizaciones"]        # todas juntas
SIMILITUD_MAX = UMBRALES["similitud_maxima_entre_niveles"]
VENTANA_NEGACION = UMBRALES["ventana_negacion_n1"]
MINIMO_DIMENSIONES = UMBRALES["minimo_dimensiones_por_combinacion"]


# --- Recuentos escritos en una banda de matriz ---------------------------------
# "Hasta 2 faltas", "De 3 a 5 faltas", "8 o más faltas", "1 o 2 errores",
# "Sin errores de concordancia": cada forma se traduce a un intervalo de recuentos
# (desde, hasta), con `hasta = None` para la banda abierta. Las PALABRAS que abren
# cada forma salen de data/reglas-lexicas.json; la lógica está escrita también en
# js/validador.js, con la misma partición y el mismo resultado.
def _fichas(texto):
    return re.findall(r"[^\W\d_]+|\d+", quitar_tildes(texto.lower()), re.UNICODE)


def _numero(ficha):
    if ficha is None:
        return None
    if ficha.isdigit():
        return int(ficha)
    return NUMERALES.get(ficha)


def _casa(fichas, i, frase):
    """Longitud en fichas de `frase` si empieza en la posición i; 0 si no casa."""
    partes = frase.split()
    return len(partes) if fichas[i:i + len(partes)] == partes else 0


def _raiz(palabra):
    """Singular aproximado, para casar "error" con "errores" y "frase" con
    "frases": se quita la -s final y después la -e. No acierta con "vez/veces",
    y el fallo va en la dirección segura — dos raíces distintas no forman escala,
    así que la regla calla en vez de inventarse un hueco."""
    if palabra.endswith("s"):
        palabra = palabra[:-1]
    if palabra.endswith("e"):
        palabra = palabra[:-1]
    return palabra


def _cosa_contada(fichas, i):
    """Lo que se cuenta, saltando artículos, preposiciones y otros números: en
    «1 de los tres procedimientos falla» lo contado son procedimientos."""
    saltos = 0
    while (i < len(fichas) and saltos < 4
           and (fichas[i] in RECUENTO["palabras_no_contables"]
                or _numero(fichas[i]) is not None)):
        i += 1
        saltos += 1
    return _raiz(fichas[i]) if i < len(fichas) else None


def recuentos_de_banda(condicion):
    """{cosa contada: (desde, hasta)} de una condición. `hasta` None es «o más».

    De cada cosa se queda el PRIMER recuento: si una banda la cuenta dos veces,
    manda el que se lee antes, que es el que da nombre a la banda."""
    fichas, hallados = _fichas(condicion), {}

    def anotar(j, desde, hasta):
        cosa = _cosa_contada(fichas, j)
        if cosa and cosa not in hallados:
            hallados[cosa] = (desde, hasta)

    i = 0
    while i < len(fichas):
        n = _numero(fichas[i])
        paso = 0

        for inicio, fin in RECUENTO["rangos"]:                 # "de 3 a 5 faltas"
            if (fichas[i] == inicio
                    and _numero(fichas[i + 1] if i + 1 < len(fichas) else None) is not None
                    and i + 2 < len(fichas) and fichas[i + 2] == fin
                    and _numero(fichas[i + 3] if i + 3 < len(fichas) else None) is not None):
                anotar(i + 4, _numero(fichas[i + 1]), _numero(fichas[i + 3]))
                paso = 4
                break

        for clave, tramo in (("hasta", lambda v: (0, v)),          # "hasta 2 faltas"
                             ("mas_de", lambda v: (v + 1, None)),  # "más de 2 faltas"
                             ("al_menos", lambda v: (v, None))):   # "al menos 2 faltas"
            if paso:
                break
            for termino in RECUENTO[clave]:
                k = _casa(fichas, i, termino)
                valor = _numero(fichas[i + k] if k and i + k < len(fichas) else None)
                if k and valor is not None:
                    anotar(i + k + 1, *tramo(valor))
                    paso = k + 1
                    break

        if not paso and n is not None:                         # "8 o más faltas"
            for termino in RECUENTO["o_mas"]:
                k = _casa(fichas, i + 1, termino)
                if k:
                    anotar(i + 1 + k, n, None)
                    paso = 1 + k
                    break

        if not paso and n is not None:                         # "2 o 3 errores"
            for termino in RECUENTO["alternativa"]:
                k = _casa(fichas, i + 1, termino)
                segundo = _numero(fichas[i + 1 + k] if k and i + 1 + k < len(fichas) else None)
                if k and segundo is not None:
                    anotar(i + 2 + k, n, segundo)
                    paso = 2 + k
                    break

        if not paso:                                           # "sin errores de..."
            for termino in RECUENTO["ninguno"]:
                k = _casa(fichas, i, termino)
                if k:
                    anotar(i + k, 0, 0)
                    paso = k
                    break

        if not paso and n is not None:                         # "2 faltas"
            anotar(i + 1, n, n)
            paso = 1

        i += paso or 1

    return hallados


def escalas_de_incidencia(componente):
    """Lo que el componente cuenta COMO INCIDENCIA, con sus tramos.

    Ningún pack declara si un componente cuenta incidencias o logros: se lee de
    la propia matriz. Si la cuenta SUBE según BAJAN los puntos, lo contado es una
    incidencia (faltas, errores, datos ajenos al tema). Si baja, es un logro
    (fuentes reunidas, apartados desarrollados, recursos localizados) y la
    continuidad no significa nada ahí: «4 o más fuentes / 3 / 2 / 1» no deja
    ningún hueco por no decir qué pasa con 5.

    Se lee en el orden en que están escritas las bandas, que es el de puntos
    descendentes porque `matriz_cuadrada` ya lo exige: si estuvieran desordenadas,
    el pack falla antes por esa regla.

    Devuelve [(cosa, [(índice de banda, desde, hasta), ...]), ...]."""
    candidatas = {}
    for indice, banda in enumerate(componente["bandas"]):
        for cosa, (desde, hasta) in recuentos_de_banda(banda["condicion"]).items():
            candidatas.setdefault(cosa, []).append((indice, desde, hasta))

    escalas = []
    for cosa, tramos in sorted(candidatas.items()):
        if len(tramos) < 2:
            continue
        desdes = [d for _, d, _ in tramos]
        if any(desdes[k] > desdes[k + 1] for k in range(len(desdes) - 1)):
            continue                  # la cuenta baja: es un logro, no una incidencia
        if desdes[-1] <= desdes[0]:
            continue                  # no sube nunca: no hay escala que comprobar
        escalas.append((cosa, tramos))
    return escalas


def huecos_de_escala(componente, tramos):
    """Recuentos que ninguna banda recoge. Tres maneras de dejar uno fuera: entre
    dos bandas seguidas, por debajo de la primera y por encima de la última.

    Una banda SIN recuento no es un hueco: es la casilla de recogida del corrector
    («Errores sistemáticos que obligan a reconstruir el sentido») y cubre lo que la
    escala no nombra. Por eso el arranque solo se exige si la escala empieza en la
    primera banda, y el cierre solo si termina en la última."""
    huecos = []
    for k in range(len(tramos) - 1):
        (indice_a, _, hasta_a), (indice_b, desde_b, _) = tramos[k], tramos[k + 1]
        if indice_b == indice_a + 1 and hasta_a is not None and desde_b > hasta_a + 1:
            huecos.append((hasta_a + 1, desde_b - 1))
    if tramos[0][0] == 0 and tramos[0][1] > 0:
        huecos.append((0, tramos[0][1] - 1))
    if tramos[-1][0] == len(componente["bandas"]) - 1 and tramos[-1][2] is not None:
        huecos.append((tramos[-1][2] + 1, None))
    return huecos


def texto_de_hueco(desde, hasta):
    if hasta is None:
        return "%d o más" % desde
    return str(desde) if desde == hasta else "de %d a %d" % (desde, hasta)


def lexico_de_materia(materia):
    """El bloque de la materia del pack. Si no existe, no se valida a medias:
    una materia sin léxico propio solo PARECE validada (los saberes prohibidos
    de Lengua no dicen nada de un pack de Matemáticas)."""
    bloque = LEXICO["por_materia"].get(materia)
    if bloque is None:
        raise SystemExit(
            "La materia '%s' no tiene bloque en data/reglas-lexicas.json.\n"
            "Añádelo antes de validar: sin saberes prohibidos ni fórmulas de proceso\n"
            "propios, el pack pasaría el validador sin estar comprobado.\n"
            "Materias registradas: %s"
            % (materia, ", ".join(LEXICO["por_materia"])))
    return bloque


# --- Adverbitis: tres modos de coincidencia, no uno ---------------------------
# El grupo 1 casa por subcadena a propósito (flexiones: "regulares" contiene
# "regular"). Los grupos 2 y 3 exigen límite de palabra A LOS DOS LADOS: sin él
# "bienestar" era "bien" y "el ord|en general| de la información" era
# "en general" (defecto corregido el 17-ago-2026, que los dos validadores
# compartían). Dentro del término los espacios siguen siendo flexibles, que es
# lo único que distingue a los de varias palabras. El límite no puede
# escribirse con \b: en JavaScript las letras acentuadas no son carácter de
# palabra y \b casaría dentro de "explícita". Misma partición y mismo resultado
# que js/validador.js.
_LETRA = r"[^\W\d_]"


def _regex_termino(termino):
    return re.compile(r"(?<!%s)%s(?!%s)" % (_LETRA, re.escape(termino).replace(r"\ ", r"\s+"), _LETRA),
                      re.IGNORECASE | re.UNICODE)


_PALABRA_COMPILADA = {t: _regex_termino(t) for t in ADVERBITIS_PALABRA_COMPLETA}
_MULTI_COMPILADA = {t: _regex_termino(t) for t in ADVERBITIS_MULTIPALABRA}


def encontrar_adverbitis(texto):
    minus = texto.lower()
    hallados = [t for t in ADVERBITIS_SUBCADENA if t in minus]
    hallados += [t for t, r in _PALABRA_COMPILADA.items() if r.search(texto)]
    hallados += [t for t, r in _MULTI_COMPILADA.items() if r.search(texto)]
    return hallados


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
    pack = cargar_pack(ruta)
    materia = lexico_de_materia(pack["materia"])
    saberes_prohibidos = set(materia["saberes_prohibidos"])
    formulas_proceso = materia["formulas_proceso"]
    dimensiones_con_respaldo = materia.get("dimensiones_con_respaldo", {})
    verbos = {v["3s"].lower(): v for v in pack["verbos"]}
    errores, avisos = [], []
    pesos = collections.defaultdict(int)
    pesos_por_curso = collections.defaultdict(list)
    con_matriz = 0

    def err(cid, donde, msg): errores.append((cid, donde, msg))
    def avi(cid, donde, msg): avisos.append((cid, donde, msg))

    for c in pack["criterios"]:
        cid = c["id"]
        pesos[c["curso"]] += c["peso_base"]
        pesos_por_curso[c["curso"]].append(c["peso_base"])

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
        if quitar_tildes(cabeza.lower()) in saberes_prohibidos:
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
            if not any(f in cita_proceso for f in formulas_proceso):
                err(cid, "proceso_sin_respaldo",
                    "se declara dimensión de proceso y el criterio %s de %s no habla de planificar, de borradores ni de revisar"
                    % (c.get("criterio_oficial", {}).get("codigo"), c["curso"]))

        # --- Dimensión cuyo objeto el criterio no nombra: misma forma que
        # `proceso_sin_respaldo`, y por la misma razón. Lo escribió la fila de
        # reacción a una noticia: la competencia 4 evalúa el canal en 2.º ESO y
        # en 1.º Bach y no lo evalúa en 4.º ESO ni en 2.º Bach, y sin esto una
        # dimensión de canal en esos dos cursos pasaba limpia. ---
        exigidos = dimensiones_con_respaldo.get(c["dimension"])
        if exigidos:
            cita_dim = quitar_tildes((c.get("criterio_oficial", {}).get("cita") or "").lower())
            if not any(t in cita_dim for t in exigidos):
                err(cid, "dimension_sin_respaldo",
                    "la dimensión '%s' evalúa algo que el criterio %s de %s no nombra "
                    "(ninguno de: %s)"
                    % (c["dimension"], c.get("criterio_oficial", {}).get("codigo"),
                       c["curso"], ", ".join(exigidos)))

        # --- Descriptores ---
        for nivel, d in c["descriptores"].items():
            texto = d["texto"]
            minus = " " + texto.lower()
            verbo = primer_verbo(texto)

            if verbo not in verbos:
                err(cid, nivel, "el descriptor no empieza por un verbo del banco: '%s'" % verbo)
            elif verbos[verbo]["id"] != d["verbo"]:
                err(cid, nivel, "el verbo declarado (%s) no es el del texto (%s)" % (d["verbo"], verbo))

            for a in encontrar_adverbitis(texto):
                err(cid, nivel, "adverbitis: '%s'" % a.strip())

            if nivel == "n1":
                for n in NEGACIONES:
                    if (" " + n) in minus[:VENTANA_NEGACION]:
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
                for a in encontrar_adverbitis(b["condicion"]):
                    err(cid, etq, "adverbitis en una banda ('%s'): la matriz deja de ser contable" % a.strip())

            # --- Continuidad de bandas: si el componente cuenta incidencias, sus
            # bandas cubren todos los recuentos. Un hueco deja al corrector sin
            # banda que aplicar justo donde la matriz prometía aritmética. ---
            for cosa, tramos in escalas_de_incidencia(comp):
                huecos = huecos_de_escala(comp, tramos)
                if huecos:
                    err(cid, "continuidad_bandas",
                        "el componente '%s' cuenta %s y sus bandas dejan fuera %s: "
                        "con ese recuento no hay banda que aplicar"
                        % (comp["nombre"], cosa,
                           " y ".join(texto_de_hueco(d, h) for d, h in huecos)))

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
        if len(lista) < MINIMO_DIMENSIONES:
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

    # --- Reparto desigual sin razon declarada (Marco Teorico §2.3) ---
    # El marco vigente del proyecto de Lengua fija ponderacion igual por defecto
    # y solo admite desigualarla con una razon escrita. Los seis packs desiguales
    # la traen en `razon_peso`, y la ficha del alumno la imprime al lado del
    # reparto: la transparencia no era el problema, lo era que nadie habia
    # escrito el porque.
    if not pack.get("razon_peso"):
        desiguales = [curso for curso, ps in sorted(pesos_por_curso.items())
                      if len(ps) > 1 and len(set(ps)) > 1]
        if desiguales:
            avi("(pack)", "razon_peso",
                "el reparto de pesos no es igual (%s) y el pack no declara `razon_peso`: "
                "el marco teorico pide ponderacion igual por defecto y razon escrita para "
                "desigualarla" % ", ".join(desiguales))

    return pack, errores, avisos, con_matriz, dict(pesos)


def main():
    rutas = rutas_de_packs(sys.argv[1:])
    if not rutas:
        print("El catálogo (data/catalogo.json) no declara ningún pack.")
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
