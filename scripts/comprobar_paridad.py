# -*- coding: utf-8 -*-
"""
Paridad entre los dos validadores (SDD §10).

El invariante del proyecto es: «la aplicación nunca puede dar por limpio un pack que
el script rechaza». Estaba escrito en CLAUDE.md y en el encabezado de los dos
archivos, y aun así se rompió: durante un tiempo scripts/validar_pack.py marcó
"bienestar" como adverbitis (por contener "bien") y js/validador.js no. Nadie se dio
cuenta porque no había ninguna prueba que ejecutara los dos lados sobre el mismo
texto y comparara.

Esto la hay, y en cuatro partes, porque la primera sola no basta:

  1. COINCIDENCIA · sobre un corpus de trampas —palabras que CONTIENEN un
     calificador vago sin serlo, y calificadores vagos flexionados que hay que cazar
     igual—, ejecuta la detección de adverbitis en Python y en JavaScript y exige que
     coincidan término a término.
  2. ACIERTO · cada caso del corpus lleva escrito su resultado esperado. Sin esta
     parte la prueba solo garantiza que las dos implementaciones se PARECEN, y eso
     deja pasar los defectos que comparten: «Explica el ord|en general| de la
     información» saltaba como "en general" en los dos lados a la vez, y por eso
     ninguna prueba lo veía (corregido el 17-ago-2026 poniendo límite de palabra a
     los dos lados del término multipalabra).
  3. RECUENTOS · la regla de continuidad de bandas se apoya en un lector de recuentos
     ("hasta 2 faltas", "de 3 a 5", "8 o más", "sin errores"), que es otra función suelta
     escrita dos veces y por tanto otro sitio por donde separarse. Se ejecuta en los dos
     lados sobre un corpus de condiciones y se exige coincidencia Y acierto, igual que
     con la adverbitis: si los dos leyeran mal el mismo "1 de los tres procedimientos",
     la regla callaría en los dos a la vez y ninguna prueba lo vería.
  4. PACKS · las tres partes anteriores solo miran funciones sueltas. La última
     ejecuta la validación ENTERA —validar() aquí, validarPack() allí— sobre los
     mismos packs trampa y compara qué reglas emite cada lado. Se comparan las
     CLAVES de regla, nunca los mensajes: el script imprime el id del criterio en su
     propia columna y la aplicación lo lleva dentro del mensaje, y esa diferencia es
     deliberada.

Deuda declarada de la parte 4: solo se comparan las claves de regla que los dos
lados nombran igual (CLAVES_COMPARABLES). El script agrupa varias reglas bajo un
`donde` más grueso —"matriz" cubre matriz_cuadrada, penalizacion_sin_tope y
doble_castigo; "pesos" cubre reparto_pesos y pesos_curso— y para la adverbitis usa
como `donde` el nivel del descriptor. Mientras validar_pack.py no emita las mismas
claves que js/validador.js, esas reglas se comparan por las otras vías (los packs
reales pasan por los dos lados en comprobar_todo.py) y no aquí.

El corpus vive aquí y no en data/: no es contenido curricular, son casos de prueba.

Uso:
    python scripts/comprobar_paridad.py

Código de salida 1 si los dos lados discrepan, si coinciden en un resultado
equivocado, o si un pack trampa no produce las reglas que debe.
"""
import copy
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validar_pack import encontrar_adverbitis, recuentos_de_banda, validar   # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Cada caso es un texto, por qué está aquí y qué debe salir. Los "no debe saltar"
# ([]) son los que rompieron la paridad; los "debe saltar" son los que la rompieron
# en el otro sentido cuando se intentó arreglar el primero a base de límites de
# palabra.
CORPUS = [
    # --- trampas: contienen un término vago sin serlo -----------------------
    ("Explica el bienestar del alumnado como tema del texto expositivo.",
     "'bienestar' contiene 'bien' y no es adverbitis", []),
    ("Emplea un registro formal adecuado al destinatario del texto.",
     "'formal' contiene 'mal' y no es adverbitis", []),
    ("Comenta el desmayo del personaje en el desenlace.",
     "'desmayo' contiene 'may'; control de vecindad", []),
    ("Redacta el resumen del artículo con sus propias palabras.",
     "texto limpio de control", []),
    ("Menciona la biendicha costumbre del narrador.",
     "'biendicha' empieza por 'bien' sin serlo", []),
    ("Analiza el malestar que expresa la voz poética.",
     "'malestar' empieza por 'mal' sin serlo", []),
    ("Selecciona información de fuentes muy diversas.",
     "'muy' como palabra sí es adverbitis", ["muy"]),

    # --- trampas de los términos de varias palabras -------------------------
    ("Explica el orden general de la información en la noticia.",
     "'orden general' contiene 'en general' sin serlo", []),
    ("Distingue el margen general del texto.",
     "'margen general' contiene 'en general' sin serlo", []),
    ("Valora críticamente la fiabilidad de la noticia.",
     "'críticamente' termina en -mente y no es adverbitis", []),
    ("Apoya el juicio en dos ejemplos citados literalmente.",
     "'literalmente' termina en -mente y no es adverbitis", []),
    ("Reconoce la línea editorial del medio.",
     "texto limpio de control, vocabulario del pack de reacción", []),

    # --- flexiones que sí deben saltar --------------------------------------
    ("Comete bastantes errores de puntuación entre las partes del texto.",
     "'bastantes' es flexión de 'bastante'", ["bastante"]),
    ("Utiliza conectores regulares a lo largo del párrafo.",
     "'regulares' es flexión de 'regular'", ["regular"]),
    ("Ordena las ideas regularmente en el cuerpo del texto.",
     "'regularmente' es flexión de 'regular'", ["regular"]),
    ("Cita las fuentes adecuadamente en el cierre.",
     "'adecuadamente' por subcadena", ["adecuadamente"]),
    ("Enlaza las partes a  veces con conectores de adición.",
     "multipalabra con espacio doble: los espacios son flexibles", ["a veces"]),
    ("Presenta la información de forma adecuada al destinatario.",
     "multipalabra", ["de forma adecuada"]),
    ("Resume en general el contenido de las fuentes.",
     "multipalabra", ["en general"]),
    ("Escribe muy poco desarrollo en el cuerpo del texto.",
     "'muy' seguido de espacio", ["muy"]),
    ("Redacta un cierre bien construido.",
     "'bien' como palabra suelta sí es adverbitis", ["bien"]),
]

# Cada caso es una condición de banda, por qué está aquí y qué recuentos debe leerse.
# `None` como tope es la banda abierta ("8 o más"). Los casos de {} son los que la
# regla NO debe leer como recuento: ahí está el falso positivo que se evita.
CORPUS_RECUENTOS = [
    ("Hasta 2 faltas en todo el texto",
     "forma canónica del tope: la banda alta empieza en 0", {"falta": [0, 2]}),
    ("De 3 a 5 faltas",
     "rango cerrado", {"falta": [3, 5]}),
    ("Entre 4 y 6 errores de concordancia",
     "el otro rango, con 'entre … y'", {"error": [4, 6]}),
    ("10 o más faltas",
     "banda abierta: sin ella la escala deja fuera los recuentos altos", {"falta": [10, None]}),
    ("Comete más de 3 faltas de acentuación",
     "'más de 3' empieza en 4, no en 3", {"falta": [4, None]}),
    ("Presenta al menos 2 incisos seguidos",
     "'al menos' sí empieza en el número que nombra", {"inciso": [2, None]}),
    ("Como máximo 1 dato ajeno al tema",
     "sinónimo de 'hasta'", {"dato": [0, 1]}),
    ("Sin errores de concordancia de género, número o persona",
     "la banda de cero incidencias no lleva número", {"error": [0, 0]}),
    ("1 o 2 errores que no impiden la comprensión",
     "dos cifras unidas por 'o' son un rango", {"error": [1, 2]}),
    ("1 de los tres procedimientos falla",
     "lo contado son procedimientos, no 'de': se saltan artículos, preposiciones y "
     "el número que va en medio", {"procedimiento": [1, 1]}),
    ("Ninguna frase del resumen reproduce literalmente una frase del original",
     "'ninguna' también marca el cero, y 'frase'/'frases' comparten raíz", {"fras": [0, 0]}),
    ("2 frases literales del original",
     "la misma raíz desde el plural: sin esto la escala se parte en dos", {"fras": [2, 2]}),
    ("Trae 4 o más fragmentos distintos del texto",
     "un recuento de logro se lee igual; lo que decide es la escala, no la banda",
     {"fragmento": [4, None]}),
    ("Deja 1 dato sin fuente nombrada",
     "dos recuentos en la misma banda, cada uno de lo suyo",
     {"dato": [1, 1], "fuent": [0, 0]}),

    # --- trampas: aquí no hay ningún recuento -------------------------------
    ("El texto presenta una sola idea principal identificable",
     "'una' es artículo, no número: leerla inventaba escalas donde no las hay", {}),
    ("Errores sistemáticos que obligan a reconstruir el sentido",
     "la banda cualitativa de cierre no cuenta nada, y por eso puede recoger "
     "lo que la escala no nombra", {}),
    ("Cada párrafo desarrolla una sola idea principal identificable",
     "'cada' y 'una sola' no son recuentos", {}),
]

# Reglas que los dos lados nombran igual. Ver la deuda declarada del encabezado.
CLAVES_COMPARABLES = frozenset([
    "trazabilidad",
    "saber_vehiculo",
    "modalizadores",
    "copia_entre_cursos",
    "proceso_sin_respaldo",
    "dimension_sin_respaldo",
    "continuidad_bandas",
    "tarea_aplicable",
    "razon_peso",
])

GUION_ADVERBITIS = r"""
import { encontrarAdverbitis } from "%s";
const casos = %s;
console.log(JSON.stringify(casos.map((t) => encontrarAdverbitis(t))));
"""

GUION_RECUENTOS = r"""
import { recuentosDeBanda } from "%s";
const casos = %s;
console.log(JSON.stringify(casos.map((t) => Object.fromEntries(recuentosDeBanda(t)))));
"""

GUION_PACK = r"""
import { readFileSync } from "node:fs";
import { componerPack } from "%s";
import { validarPack } from "%s";
const banco = JSON.parse(readFileSync(%s, "utf8")).verbos;
const pack = componerPack(JSON.parse(readFileSync(%s, "utf8")), banco);
console.log(JSON.stringify(validarPack(pack).avisos.map((a) => [a.severidad, a.regla])));
"""


def _url(*partes):
    return "file:///" + os.path.join(RAIZ, *partes).replace("\\", "/")


def _node(guion):
    salida = subprocess.run(
        ["node", "--input-type=module", "-e", guion],
        cwd=RAIZ, capture_output=True, text=True, encoding="utf8",
    )
    if salida.returncode != 0:
        raise SystemExit("No se pudo ejecutar el validador de la aplicación:\n%s" % salida.stderr)
    return json.loads(salida.stdout)


def adverbitis_js(textos):
    return _node(GUION_ADVERBITIS % (_url("js", "validador.js"),
                                     json.dumps(textos, ensure_ascii=False)))


def recuentos_js(condiciones):
    return _node(GUION_RECUENTOS % (_url("js", "validador.js"),
                                    json.dumps(condiciones, ensure_ascii=False)))


def claves_js(ruta_pack):
    """Claves de regla que emite js/validador.js sobre un pack, por severidad."""
    guion = GUION_PACK % (
        _url("js", "motor.js"), _url("js", "validador.js"),
        json.dumps(os.path.join(RAIZ, "data", "verbos.json")),
        json.dumps(ruta_pack),
    )
    return {(sev, regla) for sev, regla in _node(guion) if regla in CLAVES_COMPARABLES}


def claves_py(ruta_pack):
    """Lo mismo desde scripts/validar_pack.py. `donde` es su clave de regla."""
    _, errores, avisos, _, _ = validar(ruta_pack)
    return ({("error", donde) for _, donde, _ in errores if donde in CLAVES_COMPARABLES}
            | {("aviso", donde) for _, donde, _ in avisos if donde in CLAVES_COMPARABLES})


# --- Packs trampa: un solo defecto sobre una copia del pack real --------------
# Regla de oro del repositorio: un caso de prueba nunca obliga a tocar un pack de
# data/. Si para que un caso pase hubiera que editar el pack, la regla está mal
# escrita, no el pack.
def _pack(nombre):
    with open(os.path.join(RAIZ, "data", nombre), encoding="utf8") as f:
        return json.load(f)


def _criterio(pack, cid):
    for c in pack["criterios"]:
        if c["id"] == cid:
            return c
    raise SystemExit("criterio no encontrado en el pack de pruebas: %s" % cid)


def trampa_dimension_sin_respaldo():
    """Dimensión de canal en 4.º ESO, cuyo criterio 4.1 no nombra el canal.

    No es un descriptor mal escrito: es un criterio movido de curso. Dispara
    además `copia_entre_cursos`, porque los N2-N4 son los de 2.º ESO — es
    correcto y va en el resultado esperado."""
    pack = _pack("pack-lcl-reaccion.json")
    clon = copy.deepcopy(_criterio(pack, "lcl-b-valcanal-rea-2eso"))
    clon["id"] = "lcl-b-valcanal-rea-4eso"
    clon["curso"] = "4ESO"
    clon["criterio_oficial"] = copy.deepcopy(
        _criterio(pack, "lcl-b-valcontenido-rea-4eso")["criterio_oficial"])
    clon["progresion"] = {"autonomia": 3, "complejidad": 3, "metalinguistico": 3}
    clon["peso_base"] = 0   # no descuadrar los pesos de 4ESO
    pack["criterios"].append(clon)
    return pack


def trampa_proceso_sin_respaldo():
    """Dimensión declarada de proceso cuya cita no habla de planificar,
    de borradores ni de revisar: el 5.2 de 1.º ESO no lo sostiene."""
    pack = _pack("pack-lcl-expositivo.json")
    _criterio(pack, "lcl-d-correccion-expo-1eso")["evalua_proceso"] = True
    return pack


def trampa_continuidad_bandas():
    """Escala de faltas con un recuento que ninguna banda recoge.

    La banda de 3 a 5 faltas pasa a cubrir solo el 5: el texto con 3 o con 4
    faltas se queda sin banda que aplicar, y esa es exactamente la corrección que
    el profesor tiene que resolver a ojo. Se toca una condición y nada más: el
    componente sigue sumando lo mismo y las bandas siguen ordenadas, así que
    `matriz_cuadrada` no dice nada — el hueco solo lo ve esta regla."""
    pack = _pack("pack-lcl-expositivo.json")
    criterio = _criterio(pack, "lcl-d-correccion-expo-1eso")
    for comp in criterio["matriz_cuantitativa"]["componentes"]:
        if comp["nombre"].lower().startswith("ortograf"):
            comp["bandas"][1]["condicion"] = "De 5 a 5 faltas"
            return pack
    raise SystemExit("no se encontró el componente de ortografía en el pack de pruebas")


def pack_limpio():
    """Control: el pack real de reacción, sin tocar. Los dos lados deben
    coincidir en no emitir ningún error."""
    return _pack("pack-lcl-reaccion.json")


PACKS_TRAMPA = [
    ("dimensión de canal en un curso que no nombra el canal",
     trampa_dimension_sin_respaldo,
     {("error", "dimension_sin_respaldo"), ("aviso", "copia_entre_cursos")}),
    ("dimensión de proceso que la cita no sostiene",
     trampa_proceso_sin_respaldo,
     {("error", "proceso_sin_respaldo")}),
    ("escala de faltas con un recuento sin banda",
     trampa_continuidad_bandas,
     {("error", "continuidad_bandas")}),
    ("pack de reacción real, sin tocar",
     pack_limpio,
     set()),
]


def comprobar_adverbitis():
    textos = [t for t, _, _ in CORPUS]
    js = adverbitis_js(textos)

    discrepancias, equivocaciones = [], []
    for (texto, porque, esperado), hallado_js in zip(CORPUS, js):
        py = sorted(encontrar_adverbitis(texto))
        jsv = sorted(hallado_js)
        if py != jsv:
            discrepancias.append((texto, porque, py, jsv))
        elif py != sorted(esperado):
            equivocaciones.append((texto, porque, sorted(esperado), py))

    print("=" * 72)
    print("Paridad de adverbitis · %d casos" % len(CORPUS))
    print("=" * 72)
    for texto, porque, py, jsv in discrepancias:
        print("  DISCREPA  %s" % porque)
        print("            «%s»" % texto)
        print("            validar_pack.py : %s" % (py or "—"))
        print("            js/validador.js : %s" % (jsv or "—"))
    for texto, porque, esperado, hallado in equivocaciones:
        print("  LOS DOS SE EQUIVOCAN IGUAL: «%s»" % texto)
        print("            %s" % porque)
        print("            esperaba %s y los dos dan %s" % (esperado, hallado))
    print("-" * 72)
    if discrepancias:
        print("%d caso(s) donde los dos validadores no dicen lo mismo." % len(discrepancias))
        print("El invariante del SDD §10 está roto: revisa data/reglas-lexicas.json y")
        print("la partición en tres grupos de coincidencia a cada lado.")
    if equivocaciones:
        print("%d caso(s) donde coinciden en un resultado equivocado." % len(equivocaciones))
        print("La paridad está intacta y la corrección no: el arreglo va en la lógica")
        print("de coincidencia de los dos lados, no en el corpus.")
    if not discrepancias and not equivocaciones:
        print("Los dos validadores coinciden y aciertan en los %d casos." % len(CORPUS))
    return not (discrepancias or equivocaciones)


def comprobar_recuentos():
    condiciones = [c for c, _, _ in CORPUS_RECUENTOS]
    js = recuentos_js(condiciones)

    discrepancias, equivocaciones = [], []
    for (condicion, porque, esperado), hallado_js in zip(CORPUS_RECUENTOS, js):
        py = {k: list(v) for k, v in recuentos_de_banda(condicion).items()}
        jsv = {k: list(v) for k, v in hallado_js.items()}
        if py != jsv:
            discrepancias.append((condicion, porque, py, jsv))
        elif py != esperado:
            equivocaciones.append((condicion, porque, esperado, py))

    print()
    print("=" * 72)
    print("Paridad del lector de recuentos · %d casos" % len(CORPUS_RECUENTOS))
    print("=" * 72)
    for condicion, porque, py, jsv in discrepancias:
        print("  DISCREPA  %s" % porque)
        print("            «%s»" % condicion)
        print("            validar_pack.py : %s" % (py or "—"))
        print("            js/validador.js : %s" % (jsv or "—"))
    for condicion, porque, esperado, hallado in equivocaciones:
        print("  LOS DOS SE EQUIVOCAN IGUAL: «%s»" % condicion)
        print("            %s" % porque)
        print("            esperaba %s y los dos dan %s" % (esperado or "ningún recuento",
                                                            hallado or "ningún recuento"))
    print("-" * 72)
    if discrepancias:
        print("%d caso(s) donde los dos lectores no leen lo mismo." % len(discrepancias))
        print("La regla de continuidad de bandas puede marcar en un lado y callar en el otro:")
        print("revisa `recuento_bandas` en data/reglas-lexicas.json y el orden de las formas.")
    if equivocaciones:
        print("%d caso(s) donde coinciden en un resultado equivocado." % len(equivocaciones))
        print("La paridad está intacta y la lectura no: el arreglo va en la lógica de los")
        print("dos lados, no en el corpus.")
    if not discrepancias and not equivocaciones:
        print("Los dos lectores coinciden y aciertan en los %d casos." % len(CORPUS_RECUENTOS))
    return not (discrepancias or equivocaciones)


def comprobar_packs():
    print()
    print("=" * 72)
    print("Paridad de la validación completa · %d packs trampa" % len(PACKS_TRAMPA))
    print("=" * 72)
    bien = True
    for etiqueta, construir, esperado in PACKS_TRAMPA:
        with tempfile.NamedTemporaryFile("w", suffix=".json", encoding="utf8",
                                         delete=False) as f:
            json.dump(construir(), f, ensure_ascii=False)
            ruta = f.name
        try:
            py, jsv = claves_py(ruta), claves_js(ruta)
        finally:
            os.unlink(ruta)

        if py != jsv:
            bien = False
            print("  DISCREPA  %s" % etiqueta)
            print("            solo validar_pack.py : %s" % (sorted(py - jsv) or "—"))
            print("            solo js/validador.js : %s" % (sorted(jsv - py) or "—"))
        elif py != esperado:
            bien = False
            print("  LOS DOS SE EQUIVOCAN IGUAL: %s" % etiqueta)
            print("            esperaba %s" % (sorted(esperado) or "ninguna regla"))
            print("            los dos dan %s" % (sorted(py) or "ninguna regla"))
        else:
            print("  OK        %s → %s" % (etiqueta, sorted(esperado) or "ninguna regla"))
    print("-" * 72)
    if bien:
        print("Los dos validadores emiten las mismas reglas en los %d packs."
              % len(PACKS_TRAMPA))
    else:
        print("Las claves comparables no coinciden. Toda regla nueva entra en las dos")
        print("implementaciones (CLAUDE.md, «cada hecho en un solo sitio»).")
    return bien


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    ok_textos = comprobar_adverbitis()
    ok_recuentos = comprobar_recuentos()
    ok_packs = comprobar_packs()
    return 0 if (ok_textos and ok_recuentos and ok_packs) else 1


if __name__ == "__main__":
    sys.exit(main())
