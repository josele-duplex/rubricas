# -*- coding: utf-8 -*-
"""
Simula la corrección de un alumno para probar una matriz cuantitativa.

Obligatorio para toda matriz nueva (SDD §15). Leer una matriz no basta: los efectos
de las bandas y las penalizaciones sobre el nivel resultante no se ven hasta que se
calculan. Esta prueba fue la que destapó la regla del doble castigo (SDD §6.3).

Uso:
    python scripts/simular_correccion.py data/pack-lcl-expositivo.json 3ESO
    python scripts/simular_correccion.py data/pack-lcl-comentario.json --todos
    python scripts/simular_correccion.py data/pack-lcl-comentario.json 4ESO --perfil justo

Sin `--perfil` ni `--todos` se usa un perfil aleatorio reproducible, que sirve para
ver la mecánica pero no para juzgar umbrales: sortear cada componente por separado
produce alumnos que no existen (nivel 4 en análisis y nivel 1 en interpretación), y
sobre todo desliga el número de faltas de la extensión del texto, que es justo lo
que hay que mirar cuando se compara una tarea con otra.

Los PERFILES son alumnos coherentes: un solo modo de trabajar que se refleja a la
vez en todas las dimensiones, y una **densidad de faltas** —faltas por cada cien
palabras— en vez de un número suelto. Es la diferencia que importa: un umbral
escrito en faltas absolutas exige el doble al alumno cuando el texto es el doble de
largo, y ese sesgo solo se ve poniendo la extensión de la tarea al lado del umbral.
"""
import json, os, re, sys, random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import cargar_pack   # noqa: E402

# Bandas de conversión de puntos a nivel (SDD §6.4), confirmadas por dos fuentes.
def nivel_de(puntos):
    if puntos >= 9: return 4
    if puntos >= 7: return 3
    if puntos >= 5: return 2
    return 1

# Valor de una dimensión sin matriz: escala equilibrada del SDD §6.2.
# Fue el punto medio de cada banda {1: 2.5, 2: 6.0, 3: 8.0, 4: 9.5} hasta que se
# vio que el proyecto sostenía dos escalas a la vez y que la diferencia decidía
# aprobados: el mismo perfil daba 5,10 con los puntos medios y 4,90 con esta.
# Manda esta porque es la que se imprime en la ficha del alumno y la que se
# corresponde con el vocabulario de siempre: Suficiente 5, Notable 7,5,
# Excelente 10 (sobresaliente).
VALOR_NIVEL = {1: 2.5, 2: 5.0, 3: 7.5, 4: 10.0}

# ---------------------------------------------------------------------------
# Extensión orientativa de cada tarea, en palabras del texto entregado.
#
# No sale del currículo: el decreto no cuenta palabras en ningún curso, así que
# esto es un dato de aula y se declara aquí, en la herramienta de juicio, y NO en
# el pack, que solo guarda lo que se deriva de una fuente. La referencia externa
# más cercana es la PAU 2026 de LCL II de la Región de Murcia (`fuentes/pau/`,
# material aportado, no fuente normativa), que acota por líneas cada pregunta:
# 20-25 líneas el texto argumentativo y 15-25 líneas cada una de las tres
# preguntas del comentario literario, que en el aula se pide de una pieza y sin
# las tres partes de examen. Contando unas diez palabras por línea manuscrita,
# el comentario escolar se mueve alrededor de la mitad de un texto expositivo o
# argumentativo del mismo curso. Es una estimación, y como tal se imprime.
PALABRAS_POR_TAREA = {
    "comentario":    {"1ESO": 120, "2ESO": 150, "3ESO": 180, "4ESO": 200, "1BACH": 250, "2BACH": 280},
    "expositivo":    {"1ESO": 200, "2ESO": 250, "3ESO": 350, "4ESO": 400, "1BACH": 500, "2BACH": 550},
    "argumentativo": {"1ESO": 200, "2ESO": 250, "3ESO": 350, "4ESO": 400, "1BACH": 500, "2BACH": 550},
    "narracion":     {"1ESO": 200, "2ESO": 250, "3ESO": 350, "4ESO": 400, "1BACH": 500, "2BACH": 550},
    "oral":          {"1ESO": 300, "2ESO": 350, "3ESO": 450, "4ESO": 500, "1BACH": 600, "2BACH": 650},
    # El resumen es la única tarea cuya extensión no la fija el encargo sino el
    # texto de partida: la matriz pide entre un cuarto (1.º ESO) y un sexto
    # (2.º Bach) del original, así que lo que el alumno entrega es corto incluso
    # en Bachillerato. Por eso sus umbrales de faltas NO pueden heredarse del
    # expositivo, que es de tres a cuatro veces más largo en el mismo curso:
    # «hasta 2 faltas» significa una cosa en 350 palabras y otra en 90.
    "resumen":       {"1ESO": 60, "3ESO": 90, "1BACH": 120, "2BACH": 130},
    # La reacción a una noticia es un texto de valoración, no de desarrollo: el
    # alumno presenta la noticia en dos líneas y lo demás lo dedica a juzgarla.
    # Por eso se parece al comentario y no al expositivo del mismo curso, y por
    # eso sus umbrales de faltas se escriben contra ESTA columna. No arranca en
    # 1.º ni en 3.º de ESO porque la fila no existe ahí (§4.3): en esos cursos la
    # competencia 4 solo tiene criterio de comprensión, no de valoración.
    "reaccion":      {"2ESO": 150, "4ESO": 220, "1BACH": 280, "2BACH": 320},
    # La noticia la comprime el propio género: la pirámide invertida obliga a
    # decir lo esencial arriba y el texto se corta por donde el soporte manda,
    # así que crece mucho menos que un expositivo del mismo curso. Queda entre
    # el comentario y el expositivo, y por eso sus umbrales de faltas tampoco se
    # heredan de nadie. Sin 2.º de ESO porque la fila no existe ahí (§4.3): la
    # competencia 6 de ese curso no tiene el criterio de localizar, seleccionar
    # y contrastar información, que es el que abre esta tarea.
    "noticia":       {"1ESO": 150, "3ESO": 250, "4ESO": 300, "1BACH": 400, "2BACH": 450},
    # El trabajo de investigación multimodal es el único cuyo texto no va seguido:
    # la línea de tiempo, la infografía y la presentación lo reparten en pantallas
    # y el resto del contenido lo llevan la imagen y el dato. Lo que el alumno
    # escribe es menos que en cualquier texto del mismo curso, y encima se proyecta,
    # así que los tramos de faltas de su matriz se escriben contra ESTA columna y no
    # se heredan de nadie. Sin 1.º de ESO porque la fila no existe ahí (§4.3): la
    # competencia 6 de ese curso no tiene el criterio de elaborar trabajos de
    # investigación, que es el que abre esta tarea.
    "investigacion": {"2ESO": 180, "3ESO": 220, "4ESO": 260, "1BACH": 320, "2BACH": 360},
}

# ---------------------------------------------------------------------------
# Cuatro alumnos que el docente reconoce, no cuatro sorteos.
#
# `nivel` es el modo de trabajar del alumno: se aplica a toda dimensión que se
# corrige por descriptor y a todo componente cuya banda no se puede contar (el
# ajuste del registro, la vocación de estilo). `faltas_por_100` y
# `errores_gram_por_100` son densidades: el número absoluto sale de multiplicar
# por la extensión de la tarea, que es lo que convierte este script en una prueba
# de los umbrales y no solo del reparto de pesos.
PERFILES = {
    "solvente": {
        "etiqueta": "Solvente · trabaja el texto y revisa antes de entregar",
        "nivel": 4,
        "faltas_por_100": 0.5,
        "errores_gram_por_100": 0.0,
        "incidencias_penalizadas": 0,
    },
    "medio": {
        "etiqueta": "Medio · cumple la tarea, con descuidos de forma",
        "nivel": 3,
        "faltas_por_100": 1.5,
        "errores_gram_por_100": 0.5,
        "incidencias_penalizadas": 0,
    },
    "justo": {
        "etiqueta": "Justo · llega al aprobado, la forma le pesa",
        "nivel": 2,
        "faltas_por_100": 3.0,
        "errores_gram_por_100": 1.0,
        "incidencias_penalizadas": 1,
    },
    "en-riesgo": {
        "etiqueta": "En riesgo · entrega sin revisar y la lectura se atasca",
        "nivel": 1,
        "faltas_por_100": 6.0,
        "errores_gram_por_100": 2.0,
        "incidencias_penalizadas": 2,
    },
}
ORDEN_PERFILES = ["solvente", "medio", "justo", "en-riesgo"]

# Qué componente lee qué densidad. Se decide por el nombre del componente porque
# es lo único que el pack declara; si no encaja en ninguno, el componente se
# resuelve por el nivel del perfil.
DENSIDAD_DE_COMPONENTE = [
    (re.compile(r"ortograf", re.I), "faltas_por_100"),
    (re.compile(r"concordancia|gramatical|construcci|tiempo verbal|formas verbales", re.I), "errores_gram_por_100"),
]

# ---------------------------------------------------------------------------
# Lectura de los umbrales que ya están escritos en la condición de cada banda.
#
# No se copian a ningún sitio: el número vive una sola vez, en el pack, y aquí se
# lee. Las condiciones de los packs siguen cuatro formas fijas.
_FORMAS = [
    (re.compile(r"^\s*sin\s+(faltas|errores)", re.I), lambda m: 0),
    (re.compile(r"^\s*hasta\s+(\d+)", re.I), lambda m: int(m.group(1))),
    (re.compile(r"\bde\s+(\d+)\s+a\s+(\d+)\b", re.I), lambda m: int(m.group(2))),
    (re.compile(r"\b(\d+)\s+o\s+(\d+)\b", re.I), lambda m: int(m.group(2))),
    (re.compile(r"\b(\d+)\s+o\s+m[áa]s\b", re.I), lambda m: float("inf")),
]


def techo_de_banda(condicion):
    """Cuántas incidencias admite como máximo esta banda, o None si no se cuenta."""
    for patron, leer in _FORMAS:
        m = patron.search(condicion)
        if m:
            return leer(m)
    return None


def techos_de_componente(comp):
    """Los techos de un componente contable, o None si alguna banda no lo es.

    Se exige que **todas** las bandas se dejen contar. Un componente donde la
    última banda dice «Errores sistemáticos que obligan a reconstruir el sentido»
    no es contable: esa banda es un juicio del corrector, y fingir que se alcanza
    con un número inventaría la parte de la matriz que precisamente no lo es."""
    techos = [techo_de_banda(b["condicion"]) for b in comp["bandas"]]
    if any(t is None for t in techos):
        return None
    return techos


def banda_por_recuento(comp, techos, cuenta):
    """La primera banda (van de mejor a peor) cuyo techo admite ese recuento."""
    for banda, techo in zip(comp["bandas"], techos):
        if cuenta <= techo:
            return banda
    return comp["bandas"][-1]


def nota_de_banda(comp, banda):
    """Lo que vale esa banda sobre 10, dentro de su componente.

    Cada componente se corrige por separado y su banda superior es su máximo, así
    que la nota de la banda es su parte de ese máximo. La suma de los máximos de
    los componentes es el total de la dimensión: si todos los componentes pagan la
    misma fracción, la dimensión da exactamente esa nota. Es lo que permite
    comparar una banda con la escala del SDD §6.2 sin salir del componente."""
    techo = max(b["puntos"] for b in comp["bandas"])
    return banda["puntos"] / techo * 10 if techo else 0.0


def banda_por_nivel(comp, nivel):
    """Banda que corresponde al modo de trabajar del alumno, sin contar nada.

    NO se elige por posición. Durante un tiempo se hizo así —la banda n-ésima para
    el nivel n, repartiendo proporcionalmente cuando había menos de cuatro— y eso
    daba por hecho que el número de bandas era el número de niveles. No lo es: el
    esquema solo pide dos bandas y nada fija dónde cae la intermedia, así que lo
    que cobraba el alumno de nivel 2 dependía de cuántas bandas hubiera escrito el
    redactor: 67 % del componente con tres bandas 3·2·0, 33 % con cuatro 3·2·1·0 y
    25 % con cinco 4·3·2·1·0. Peor que el pago: cambiaba el alumno descrito. En
    «Postura reconocible» de argumentativo 2.º ESO, la posición le daba al que
    aprueba «El texto sostiene una postura distinta en cada parte», que es un texto
    que se contradice y que ningún profesor llamaría aprobado.

    Se elige por VALOR. Cada banda ya dice lo que vale —sus puntos sobre el máximo
    del componente, `nota_de_banda`—, y el proyecto ya tiene la escala de nivel a
    nota: VALOR_NIVEL (SDD §6.2), 10 · 7,5 · 5 · 2,5. Al alumno de nivel n le toca
    la banda que un corrector puntuaría en ese nivel; es decir, la banda cuya nota
    cae en el tramo del nivel n (`nivel_de`, SDD §6.4) y, de haber varias, la más
    cercana a VALOR_NIVEL[n].

    Si el componente no escribió ninguna banda en ese tramo, se coge la más cercana
    en valor, y el empate lo gana la banda de arriba. El empate solo aparece cuando
    ninguna de las dos candidatas está en el tramo (bandas 2·1·0 en el nivel 3:
    10 y 5, y el 7,5 no existe), y entonces se prefiere describir de más: la banda
    de abajo vale menos que el nivel del alumno por definición, y bajarlo es
    repetir el error que se está corrigiendo.

    Con esta regla las bandas 4·3·2·0 y 4·3·2·1·0 caen exactamente en la escala
    canónica (10 · 7,5 · 5 · 2,5) y los componentes de cinco bandas dejan de
    castigar: el nivel 2 de «Razones que apoyan la postura» pasa de «1 razón
    desarrollada» a «2 razones enunciadas en una sola oración cada una»."""
    bandas = comp["bandas"]
    objetivo = VALOR_NIVEL[nivel]
    del_tramo = [b for b in bandas if nivel_de(nota_de_banda(comp, b)) == nivel]
    candidatas = del_tramo or bandas
    return min(candidatas, key=lambda b: abs(nota_de_banda(comp, b) - objetivo))


def densidad_de(comp):
    for patron, clave in DENSIDAD_DE_COMPONENTE:
        if patron.search(comp["nombre"]):
            return clave
    return None


# ---------------------------------------------------------------------------

def simular(pack, curso, perfil=None, semilla=None, palabras=None):
    """Devuelve (filas, nota). `perfil` es una entrada de PERFILES, o None para sorteo."""
    criterios = [c for c in pack["criterios"] if c["curso"] == curso]
    if not criterios:
        raise SystemExit("El pack no tiene criterios para el curso %s" % curso)
    rnd = random.Random(semilla if semilla is not None else 7)

    filas, total = [], 0.0
    for c in criterios:
        m = c.get("matriz_cuantitativa")
        if m is None:
            n = perfil["nivel"] if perfil else rnd.randint(1, 4)
            puntos, detalle = VALOR_NIVEL[n], "por descriptor (nivel %d)" % n
        else:
            elegidas, notas = [], []
            for comp in m["componentes"]:
                if perfil:
                    banda, apunte = _banda_del_perfil(comp, perfil, palabras)
                    if apunte:
                        notas.append(apunte)
                else:
                    banda = rnd.choice(comp["bandas"])
                elegidas.append((comp["nombre"], banda["puntos"]))
            bruto = sum(p for _, p in elegidas)
            descuento = 0.0
            for pen in m["penalizaciones"]:
                veces = perfil["incidencias_penalizadas"] if perfil else rnd.randint(0, 3)
                if veces:
                    descuento += max(pen["puntos"] * veces, pen["tope"])
            puntos = max(0.0, bruto + descuento)
            detalle = "bruto %g" % bruto + (", penaliz. %g" % descuento if descuento else "")
            if notas:
                detalle += " · " + "; ".join(notas)
        nivel = nivel_de(puntos)
        aporta = puntos * c["peso_base"] / 100
        total += aporta
        filas.append((c["nombre"], c["peso_base"], puntos, nivel, aporta, detalle))
    return filas, total


def _banda_del_perfil(comp, perfil, palabras):
    """Banda que le toca a este alumno en este componente, y qué se ha contado."""
    techos = techos_de_componente(comp)
    clave = densidad_de(comp)
    if techos is not None and clave and palabras:
        cuenta = int(round(perfil[clave] * palabras / 100.0))
        banda = banda_por_recuento(comp, techos, cuenta)
        etiqueta = "faltas" if clave == "faltas_por_100" else "err. gram."
        return banda, "%d %s" % (cuenta, etiqueta)
    return banda_por_nivel(comp, perfil["nivel"]), None


def tipo_de_tarea(pack):
    tipos = {t for c in pack["criterios"] for t in c["tipos_tarea"]}
    return sorted(tipos)[0] if len(tipos) == 1 else None


def palabras_de(pack, curso):
    tipo = tipo_de_tarea(pack)
    return (PALABRAS_POR_TAREA.get(tipo) or {}).get(curso)


def imprimir(pack, curso, perfil_id, filas, total, palabras):
    cabecera = "Simulación de corrección · %s · %s" % (pack["etiqueta"], curso)
    if perfil_id:
        cabecera += " · perfil «%s»" % perfil_id
    print(cabecera)
    if perfil_id:
        p = PERFILES[perfil_id]
        print("  %s" % p["etiqueta"])
        if palabras:
            print("  Texto de ~%d palabras · %.1f faltas por cada 100: %d faltas contadas"
                  % (palabras, p["faltas_por_100"], round(p["faltas_por_100"] * palabras / 100.0)))
    print("=" * 78)
    print("%-38s %5s %7s %6s %7s" % ("DIMENSIÓN", "PESO", "PUNTOS", "NIVEL", "APORTA"))
    print("-" * 78)
    for nombre, peso, puntos, nivel, aporta, detalle in filas:
        print("%-38s %4d%% %7.1f %6d %7.2f   %s" % (nombre[:38], peso, puntos, nivel, aporta, detalle))
    print("-" * 78)
    print("%-38s %4d%% %7s %6s %7.2f" % ("NOTA FINAL", sum(f[1] for f in filas), "", "", total))
    print()


def cursos_del_pack(pack):
    vistos = []
    for c in pack["criterios"]:
        if c["curso"] not in vistos:
            vistos.append(c["curso"])
    return vistos


def main():
    args = sys.argv[1:]
    banderas = {a for a in args if a.startswith("--")}
    sueltos = [a for a in args if not a.startswith("--")]

    perfil_id = None
    for a in args:
        if a.startswith("--perfil="):
            perfil_id = a.split("=", 1)[1]
    if "--perfil" in args:
        perfil_id = args[args.index("--perfil") + 1]
        sueltos = [s for s in sueltos if s != perfil_id]

    ruta = sueltos[0] if sueltos else "data/pack-lcl-expositivo.json"
    pack = cargar_pack(ruta)

    resumido = "--resumen" in banderas
    todos_perfiles = "--todos" in banderas or "--perfiles" in banderas or resumido
    if perfil_id and perfil_id not in PERFILES:
        raise SystemExit("Perfil desconocido: %s. Hay %s." % (perfil_id, ", ".join(ORDEN_PERFILES)))

    cursos = [sueltos[1]] if len(sueltos) > 1 else (
        cursos_del_pack(pack) if todos_perfiles else ["3ESO"])
    semilla = int(sueltos[2]) if len(sueltos) > 2 else None
    perfiles = ORDEN_PERFILES if todos_perfiles else ([perfil_id] if perfil_id else [None])

    resumen = []
    for curso in cursos:
        palabras = palabras_de(pack, curso)
        for pid in perfiles:
            filas, total = simular(pack, curso, PERFILES[pid] if pid else None,
                                   semilla=semilla, palabras=palabras)
            if not resumido:
                imprimir(pack, curso, pid, filas, total, palabras)
            resumen.append((curso, pid, palabras, filas, total))

    if resumido:
        _resumen_compacto(pack, resumen)
        return

    if todos_perfiles:
        _tabla_resumen(resumen)

    print("Comprueba: ¿le pondrías esta nota a un alumno con este perfil?")
    print("Si una dimensión cae dos niveles de golpe, sospecha de las penalizaciones.")


# ---------------------------------------------------------------------------
# Modo --resumen: lo mecánico lo hace el código; el juicio se queda entero
#
# La simulación completa de un pack son 28 KB de tablas, y leerlas consiste en
# recorrerlas buscando siempre los mismos cinco patrones. Buscar patrones en una
# tabla es exactamente lo que no hay que hacer a mano: se hace mal y cuesta caro.
#
# Esto NO decide nada —sigue sin haber un booleano y sigue sin entrar en
# comprobar_todo.py— pero deja sobre la mesa solo las celdas sospechosas, que es
# donde el juicio del docente vale algo. Lo que el código puede ver:
#
#   1. una dimensión que cae dos niveles de golpe entre dos perfiles seguidos
#      (la firma del doble castigo, SDD §6.3);
#   2. una dimensión donde los cuatro alumnos caen en el mismo nivel: el umbral
#      no está midiendo, está decorando;
#   3. una dimensión que llega a 0 puntos, que en 1.º de ESO no debe pasar nunca;
#   4. una nota final que no respeta el orden de los perfiles (el «justo» por
#      encima del «medio» significa que las bandas se pisan);
#   5. una dimensión inalcanzable para el alumno solvente o regalada al de riesgo.
# ---------------------------------------------------------------------------

def _celdas(resumen, curso):
    """{dimensión: {perfil: (puntos, nivel, detalle)}} de un curso."""
    tabla = {}
    for c, pid, palabras, filas, total in resumen:
        if c != curso:
            continue
        for nombre, peso, puntos, nivel, aporta, detalle in filas:
            tabla.setdefault(nombre, {})[pid] = (puntos, nivel, detalle)
    return tabla


def _sospechas(pack, resumen, curso):
    """[(dimensión, [motivos])] de un curso. Una línea por dimensión, no por motivo:
    la misma banda mal puesta dispara tres reglas a la vez y no son tres hallazgos.

    Los perfiles están a un nivel de distancia exacta (4-3-2-1), así que la caída
    esperada entre dos seguidos es de UN nivel. Dos es la firma que el SDD §6.3
    manda mirar."""
    salida = []
    tabla = _celdas(resumen, curso)
    for dimension, por_perfil in tabla.items():
        presentes = [p for p in ORDEN_PERFILES if p in por_perfil]
        niveles = [por_perfil[p][1] for p in presentes]
        puntos = [por_perfil[p][0] for p in presentes]
        if len(niveles) < 2:
            continue
        motivos = []
        saltos = [(niveles[i] - niveles[i + 1], i) for i in range(len(niveles) - 1)]
        peor, donde = max(saltos)
        if peor >= 2:
            motivos.append("cae %d niveles de «%s» a «%s» (%.1f→%.1f)"
                           % (peor, presentes[donde], presentes[donde + 1],
                              puntos[donde], puntos[donde + 1]))
        if len(set(niveles)) == 1:
            motivos.append("los cuatro perfiles en el nivel %d: el umbral no mide" % niveles[0])
        # Un cero absoluto solo llama la atención donde no se espera: en el alumno
        # que aprueba, o en 1.º de ESO, donde el esfuerzo va por delante del
        # resultado y una dimensión no debe caer a cero de una vez.
        for p, pt in zip(presentes, puntos):
            if pt == 0 and (p != "en-riesgo" or curso == "1ESO"):
                motivos.append("el perfil «%s» llega a 0 puntos" % p)
                break
        if "justo" in por_perfil and por_perfil["justo"][1] == 1:
            motivos.append("el alumno que aprueba se queda en nivel 1")
        if niveles[0] < 3:
            motivos.append("ni el perfil solvente pasa del nivel %d: inalcanzable" % niveles[0])
        if niveles[-1] == 4:
            motivos.append("hasta el perfil en riesgo saca nivel 4: regalada")
        if motivos:
            salida.append((dimension, motivos))
    notas = [t for c, pid, pal, filas, t in resumen if c == curso]
    if notas != sorted(notas, reverse=True):
        salida.append(("(nota final)", ["no sigue el orden de los perfiles: %s"
                                        % ", ".join("%.2f" % n for n in notas)]))
    return salida


def _resumen_compacto(pack, resumen):
    cursos = []
    for c, _, _, _, _ in resumen:
        if c not in cursos:
            cursos.append(c)
    print("%s · %d cursos × %d perfiles = %d correcciones simuladas"
          % (pack["etiqueta"], len(cursos), len(ORDEN_PERFILES), len(resumen)))
    print("")
    print("%-8s %9s  %s" % ("CURSO", "PALABRAS",
                            " ".join("%9s" % p for p in ORDEN_PERFILES)))
    for curso in cursos:
        fila = []
        palabras = None
        for pid in ORDEN_PERFILES:
            r = next((x for x in resumen if x[0] == curso and x[1] == pid), None)
            if r:
                palabras = r[2]
                fila.append("%9.2f" % r[4])
        print("%-8s %9s  %s" % (curso, palabras or "?", " ".join(fila)))
    print("")
    print("NIVEL POR DIMENSIÓN (solvente/medio/justo/en-riesgo)")
    for curso in cursos:
        tabla = _celdas(resumen, curso)
        for dimension, por_perfil in tabla.items():
            niveles = "/".join(str(por_perfil[p][1]) for p in ORDEN_PERFILES if p in por_perfil)
            print("  %-6s %-42s %s" % (curso, dimension[:42], niveles))
    print("")
    total = 0
    for curso in cursos:
        for dimension, motivos in _sospechas(pack, resumen, curso):
            total += 1
            print("  REVISAR %-6s %-42s %s" % (curso, dimension[:42], "; ".join(motivos)))
    if not total:
        print("  Sin nada mecánicamente sospechoso: ningún salto de dos niveles, ningún")
        print("  umbral plano, ningún cero y las notas van en el orden de los perfiles.")
    print("")
    print("Lo que queda es juicio, y no lo hace un script: ¿le pondrías esta nota a un")
    print("alumno con este perfil? Para ver una corrección entera, sin --resumen.")


def _tabla_resumen(resumen):
    """La lectura que importa: qué le pasa a la corrección normativa curso a curso.

    Una columna por perfil. Si los cuatro alumnos caen en la misma banda, el
    umbral no está midiendo: está decorando."""
    print("=" * 78)
    print("RESUMEN · dimensión de corrección normativa (puntos de la dimensión)")
    print("=" * 78)
    print("%-8s %8s  %s" % ("CURSO", "PALABRAS",
                            " ".join("%-16s" % p for p in ORDEN_PERFILES)))
    for curso in sorted({r[0] for r in resumen}, key=lambda c: [r[0] for r in resumen].index(c)):
        celdas = []
        palabras = None
        for pid in ORDEN_PERFILES:
            fila = next((r for r in resumen if r[0] == curso and r[1] == pid), None)
            if not fila:
                continue
            palabras = fila[2]
            correc = next((f for f in fila[3] if "orrecci" in f[0]), None)
            if correc:
                cuenta = correc[5].split("·")[-1].strip() if "·" in correc[5] else ""
                celdas.append("%-16s" % ("%.1f (N%d) %s" % (correc[2], correc[3], cuenta.split(";")[0])))
        print("%-8s %8s  %s" % (curso, palabras or "?", " ".join(celdas)))
    print()
    print("NOTA FINAL del instrumento, por perfil:")
    for curso in sorted({r[0] for r in resumen}, key=lambda c: [r[0] for r in resumen].index(c)):
        notas = []
        for pid in ORDEN_PERFILES:
            fila = next((r for r in resumen if r[0] == curso and r[1] == pid), None)
            if fila:
                notas.append("%-16s" % ("%s %.2f" % (pid, fila[4])))
        print("%-8s %8s  %s" % (curso, "", " ".join(notas)))
    print()


if __name__ == "__main__":
    main()
