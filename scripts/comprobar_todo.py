# -*- coding: utf-8 -*-
"""
Comprobación completa del proyecto: una sola orden.

Antes existían ocho comprobaciones repartidas entre `scripts/` y `test/`, y el
método de trabajo pedía recordarlas de memoria. En la práctica se ejecutaban las
que uno recordaba, y el CI solo corría tres de las ocho: precisamente las de
forma, no las de procedencia — que son las que habrían detenido el error de
derivación del 2026-08-05 antes de llegar al docente.

Esto ejecuta todas, en el orden en que conviene leerlas:

  1. Forma      · el pack tiene la estructura que el motor espera
  2. Derivados  · lo generado desde data/ sigue al día: js/lexico.js y las tablas
                  §4.3 y §5.4 del SDD
  3. Reglas     · el pack cumple las reglas de contenido del SDD §10
  4. Paridad    · la aplicación aplica exactamente las mismas reglas que el script
  5. Derivación · lo que el proyecto afirma del currículo lo dice el currículo
  6. Motor      · los instrumentos se generan y se calculan como dice el SDD

Uso:
    python scripts/comprobar_todo.py            (todo)
    python scripts/comprobar_todo.py --rapido   (salta lo que necesita fuentes/)

Código de salida 1 si algo falla.
"""
import os
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (etiqueta, orden, necesita_node, necesita_fuentes)
COMPROBACIONES = [
    ("Forma de los packs (esquema)",
     [sys.executable, "scripts/validar_esquema.py"], False, False),
    ("Léxico de reglas al día (data/ → js/lexico.js)",
     [sys.executable, "scripts/generar_lexico.py", "--comprobar"], False, False),
    ("Tablas §4.3 y §5.4 al día (data/ → docs/diseno/SDD.md)",
     [sys.executable, "scripts/generar_tablas_sdd.py", "--comprobar"], False, False),
    ("Reglas de contenido (validador de taller)",
     [sys.executable, "scripts/validar_pack.py"], False, False),
    ("Paridad: los dos validadores dicen lo mismo",
     [sys.executable, "scripts/comprobar_paridad.py"], True, False),
    ("Paridad: el pack real carga limpio en la aplicación",
     ["node", "test/validar-pack-real.mjs"], True, False),
    ("Casos del validador, uno por regla",
     ["node", "test/validar-reglas.mjs"], True, False),
    ("Motor: premarcado y puertas de aplicabilidad",
     ["node", "test/premarcado.mjs"], True, False),
    ("Motor: proyección a primera persona",
     ["node", "test/proyeccion.mjs"], True, False),
    ("Motor: modelo de calificación",
     ["node", "test/calificacion.mjs"], True, False),
    ("Derivación: citas, matriz §4.3 y techo §5.4",
     [sys.executable, "scripts/verificar_derivacion.py"], False, True),
    ("Derivación: auto-prueba (lo corrupto debe fallar)",
     [sys.executable, "scripts/verificar_derivacion.py", "--auto-prueba"], False, True),
]


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    rapido = "--rapido" in sys.argv
    hay_node = shutil.which("node") is not None

    resultados = []
    for etiqueta, orden, necesita_node, necesita_fuentes in COMPROBACIONES:
        if necesita_node and not hay_node:
            resultados.append(("SALTA", etiqueta, "node no está instalado"))
            continue
        if necesita_fuentes and rapido:
            resultados.append(("SALTA", etiqueta, "--rapido"))
            continue
        if not os.path.isfile(os.path.join(RAIZ, orden[1])):
            resultados.append(("SALTA", etiqueta, "%s no existe todavía" % orden[1]))
            continue

        print("\n" + "=" * 72)
        print("· %s" % etiqueta)
        print("=" * 72)
        codigo = subprocess.call(orden, cwd=RAIZ)
        resultados.append(("BIEN " if codigo == 0 else "FALLA", etiqueta, ""))

    print("\n" + "=" * 72)
    print("RESUMEN")
    print("=" * 72)
    for estado, etiqueta, nota in resultados:
        print("  %s  %s%s" % (estado, etiqueta, (" (%s)" % nota) if nota else ""))

    fallos = [e for estado, e, _ in resultados if estado == "FALLA"]
    saltadas = [e for estado, e, _ in resultados if estado == "SALTA"]
    print("-" * 72)
    if fallos:
        print("%d comprobación(es) fallida(s). El proyecto no está para cerrar." % len(fallos))
        return 1
    if saltadas:
        print("Todo lo ejecutado está limpio, pero %d comprobación(es) se saltaron: "
              "no cierres un pack sin ejecutarlas." % len(saltadas))
        return 0
    print("Las %d comprobaciones están limpias." % len(resultados))
    return 0


if __name__ == "__main__":
    sys.exit(main())
