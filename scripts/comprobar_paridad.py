# -*- coding: utf-8 -*-
"""
Paridad entre los dos validadores (SDD §10).

El invariante del proyecto es: «la aplicación nunca puede dar por limpio un pack que
el script rechaza». Estaba escrito en CLAUDE.md y en el encabezado de los dos
archivos, y aun así se rompió: durante un tiempo scripts/validar_pack.py marcó
"bienestar" como adverbitis (por contener "bien") y js/validador.js no. Nadie se dio
cuenta porque no había ninguna prueba que ejecutara los dos lados sobre el mismo
texto y comparara.

Esto la hay. Sobre un corpus de trampas —palabras que CONTIENEN un calificador vago
sin serlo, y calificadores vagos flexionados que hay que cazar igual—, ejecuta la
detección de adverbitis en Python y en JavaScript y exige que coincidan término a
término. Si algún día vuelven a separarse, esta prueba se pone roja el mismo día.

El corpus vive aquí y no en data/: no es contenido curricular, son casos de prueba.

Uso:
    python scripts/comprobar_paridad.py

Código de salida 1 si los dos lados discrepan en algún caso.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validar_pack import encontrar_adverbitis   # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Cada caso es un texto y por qué está aquí. Los "no debe saltar" son los que
# rompieron la paridad; los "debe saltar" son los que la rompieron en el otro
# sentido cuando se intentó arreglar el primero a base de límites de palabra.
CORPUS = [
    # --- trampas: contienen un término vago sin serlo -----------------------
    ("Explica el bienestar del alumnado como tema del texto expositivo.",
     "'bienestar' contiene 'bien' y no es adverbitis"),
    ("Emplea un registro formal adecuado al destinatario del texto.",
     "'formal' contiene 'mal' y no es adverbitis"),
    ("Comenta el desmayo del personaje en el desenlace.",
     "'desmayo' contiene 'may'; control de vecindad"),
    ("Redacta el resumen del artículo con sus propias palabras.",
     "texto limpio de control"),
    ("Menciona la biendicha costumbre del narrador.",
     "'biendicha' empieza por 'bien' sin serlo"),
    ("Analiza el malestar que expresa la voz poética.",
     "'malestar' empieza por 'mal' sin serlo"),
    ("Selecciona información de fuentes muy diversas.",
     "'muy' como palabra sí es adverbitis"),

    # --- flexiones que sí deben saltar --------------------------------------
    ("Comete bastantes errores de puntuación entre las partes del texto.",
     "'bastantes' es flexión de 'bastante'"),
    ("Utiliza conectores regulares a lo largo del párrafo.",
     "'regulares' es flexión de 'regular'"),
    ("Ordena las ideas regularmente en el cuerpo del texto.",
     "'regularmente' es flexión de 'regular'"),
    ("Cita las fuentes adecuadamente en el cierre.",
     "'adecuadamente' por subcadena"),
    ("Enlaza las partes a  veces con conectores de adición.",
     "multipalabra con espacio doble: los espacios son flexibles"),
    ("Presenta la información de forma adecuada al destinatario.",
     "multipalabra"),
    ("Resume en general el contenido de las fuentes.",
     "multipalabra"),
    ("Escribe muy poco desarrollo en el cuerpo del texto.",
     "'muy' seguido de espacio"),
    ("Redacta un cierre bien construido.",
     "'bien' como palabra suelta sí es adverbitis"),
]

GUION_JS = r"""
import { encontrarAdverbitis } from "%s";
const casos = %s;
console.log(JSON.stringify(casos.map((t) => encontrarAdverbitis(t))));
"""


def resultados_js(textos):
    ruta = os.path.join(RAIZ, "js", "validador.js").replace("\\", "/")
    guion = GUION_JS % ("file:///" + ruta, json.dumps(textos, ensure_ascii=False))
    salida = subprocess.run(
        ["node", "--input-type=module", "-e", guion],
        cwd=RAIZ, capture_output=True, text=True, encoding="utf8",
    )
    if salida.returncode != 0:
        raise SystemExit("No se pudo ejecutar el validador de la aplicación:\n%s" % salida.stderr)
    return json.loads(salida.stdout)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    textos = [t for t, _ in CORPUS]
    js = resultados_js(textos)

    discrepancias = []
    for (texto, porque), hallado_js in zip(CORPUS, js):
        hallado_py = sorted(encontrar_adverbitis(texto))
        if hallado_py != sorted(hallado_js):
            discrepancias.append((texto, porque, hallado_py, sorted(hallado_js)))

    print("=" * 72)
    print("Paridad de adverbitis · %d casos" % len(CORPUS))
    print("=" * 72)
    for texto, porque, py, jsv in discrepancias:
        print("  DISCREPA  %s" % porque)
        print("            «%s»" % texto)
        print("            validar_pack.py : %s" % (py or "—"))
        print("            js/validador.js : %s" % (jsv or "—"))
    print("-" * 72)
    if discrepancias:
        print("%d caso(s) donde los dos validadores no dicen lo mismo." % len(discrepancias))
        print("El invariante del SDD §10 está roto: revisa data/reglas-lexicas.json y")
        print("la partición en tres grupos de coincidencia a cada lado.")
        return 1
    print("Los dos validadores coinciden en los %d casos." % len(CORPUS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
