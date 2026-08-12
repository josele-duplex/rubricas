# -*- coding: utf-8 -*-
"""
Genera js/lexico.js desde data/reglas-lexicas.json.

Por qué existe: el validador vive dos veces (SDD §10) y las listas de palabras se
sincronizaban a mano. Ya habían divergido en silencio. Python lee el JSON directamente;
el navegador no puede importar JSON de forma síncrona sin complicar el arranque de la
aplicación, así que se le da un módulo generado desde el mismo archivo.

    python scripts/generar_lexico.py              escribe js/lexico.js
    python scripts/generar_lexico.py --comprobar  falla si js/lexico.js está desfasado

La comprobación corre en scripts/comprobar_todo.py y en el CI: si alguien edita
js/lexico.js a mano, o toca el JSON sin regenerar, la rama se pone roja. Es la única
manera de que "una sola fuente" sea verdad y no una intención.
"""
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_JSON = os.path.join(RAIZ, "data", "reglas-lexicas.json")
RUTA_JS = os.path.join(RAIZ, "js", "lexico.js")

CABECERA = """// ARCHIVO GENERADO — NO SE EDITA A MANO.
//
// Fuente: data/reglas-lexicas.json
// Se regenera con: python scripts/generar_lexico.py
//
// Si necesitas cambiar una palabra, cámbiala en el JSON y regenera. El CI compara
// este archivo con lo que produce el generador y falla si no coinciden: es lo que
// impide que el validador de la aplicación y el de taller vuelvan a separarse
// (SDD §10).
"""


def limpiar(valor):
    """Quita las claves `_nota`: son para quien lee el JSON, no para el código."""
    if isinstance(valor, dict):
        return {k: limpiar(v) for k, v in valor.items() if k != "_nota"}
    if isinstance(valor, list):
        return [limpiar(v) for v in valor]
    return valor


def aplanar(valor):
    """Un bloque que solo contiene `terminos` se colapsa a su lista.

    En el JSON esos bloques existen para poder llevar su `_nota` al lado de las
    palabras que explican; en el código estorban."""
    if isinstance(valor, dict):
        if set(valor) == {"terminos"}:
            return valor["terminos"]
        return {k: aplanar(v) for k, v in valor.items()}
    return valor


def generar():
    datos = aplanar(limpiar(json.load(open(RUTA_JSON, encoding="utf8"))))
    cuerpo = json.dumps(datos, ensure_ascii=False, indent=2)
    return "%s\nexport const LEXICO = %s;\n" % (CABECERA, cuerpo)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    nuevo = generar()

    if "--comprobar" in sys.argv:
        actual = open(RUTA_JS, encoding="utf8").read() if os.path.isfile(RUTA_JS) else None
        if actual == nuevo:
            print("js/lexico.js está al día con data/reglas-lexicas.json.")
            return 0
        if actual is None:
            print("ERROR: falta js/lexico.js. Ejecuta: python scripts/generar_lexico.py")
        else:
            print("ERROR: js/lexico.js no coincide con data/reglas-lexicas.json.")
            print("       El validador de la aplicación y el de taller se han separado.")
            print("       Ejecuta: python scripts/generar_lexico.py")
        return 1

    with open(RUTA_JS, "w", encoding="utf8", newline="\n") as f:
        f.write(nuevo)
    print("Escrito js/lexico.js desde data/reglas-lexicas.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
