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
  2. Derivados  · lo generado desde data/ sigue al día: js/lexico.js, las tablas
                  §4.3 y §5.4 del SDD, y los nueve docs/revision-*.md
  3. Reglas     · el pack cumple las reglas de contenido del SDD §10
  4. Paridad    · la aplicación aplica exactamente las mismas reglas que el script
  5. Derivación · lo que el proyecto afirma del currículo lo dice el currículo
  6. Motor      · los instrumentos se generan y se calculan como dice el SDD
  7. Instalable · existe todo lo que el manifest y el Service Worker prometen

Uso:
    python scripts/comprobar_todo.py             (todo, callado)
    python scripts/comprobar_todo.py --detallado (con la salida de cada una)
    python scripts/comprobar_todo.py --rapido    (salta lo que necesita fuentes/)

CALLADO POR DEFECTO desde el 18-ago-2026. Una pasada limpia escribía 24 KB
—unos 6.000 tokens— para decir «las trece están bien», y esa orden se ejecuta
varias veces por sesión. Ahora una comprobación que pasa no dice nada; la que
falla escribe su salida entera, que es cuando de verdad hace falta leerla. Los
avisos (no son fallos, pero piden ojo) siguen apareciendo, en una línea.

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
    ("Revisiones docentes al día (data/ → docs/revision-*.md)",
     [sys.executable, "scripts/generar_revision.py", "--comprobar"], False, False),
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
    # Un icono que falta no rompe nada a la vista: la aplicación sigue
    # abriéndose y solo deja de poder instalarse, en silencio. Por eso está
    # aquí y no en la cabeza del que despliega.
    ("Instalable: existe lo que el manifest y el sw prometen",
     [sys.executable, "scripts/generar_iconos.py", "--comprobar"], False, False),
]


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    rapido = "--rapido" in sys.argv
    detallado = "--detallado" in sys.argv
    hay_node = shutil.which("node") is not None

    # Los hijos escriben acentos y «§». Sin esto, en Windows salen por cp1252 y
    # llegan rotos: cada carácter roto es un token que no dice nada.
    entorno = dict(os.environ, PYTHONIOENCODING="utf-8")

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

        if detallado:
            print("\n" + "=" * 72)
            print("· %s" % etiqueta)
            print("=" * 72)
            codigo = subprocess.call(orden, cwd=RAIZ, env=entorno)
            resultados.append(("BIEN " if codigo == 0 else "FALLA", etiqueta, ""))
            continue

        # Callado: una comprobación que pasa no tiene nada que contar. Lo que sí
        # cuenta —y entero— es la que falla.
        proceso = subprocess.run(orden, cwd=RAIZ, env=entorno,
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        salida = proceso.stdout.decode("utf-8", "replace")
        if proceso.returncode != 0:
            print("\n" + "=" * 72)
            print("FALLA · %s" % etiqueta)
            print("=" * 72)
            print(salida.rstrip())
        else:
            # Un aviso de verdad empieza la línea. Lo que solo NOMBRA la palabra
            # —«OK  niveles_indistinguibles: … dispara aviso», que es el nombre de
            # un caso de prueba que ha pasado— no es un aviso.
            avisos = []
            for l in salida.splitlines():
                l = l.strip()
                if l.lower().startswith("aviso") and l not in avisos:
                    avisos.append(l)
            for l in avisos:
                print("  %s · %s" % (etiqueta, l))
        resultados.append(("BIEN " if proceso.returncode == 0 else "FALLA", etiqueta, ""))

    if detallado:
        print("\n" + "=" * 72)
        print("RESUMEN")
        print("=" * 72)
        for estado, etiqueta, nota in resultados:
            print("  %s  %s%s" % (estado, etiqueta, (" (%s)" % nota) if nota else ""))
    else:
        for estado, etiqueta, nota in resultados:
            if estado != "BIEN ":
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
