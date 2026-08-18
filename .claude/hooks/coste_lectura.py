# -*- coding: utf-8 -*-
"""
Freno de mano para las lecturas caras. Se engancha en PreToolUse sobre Read.

POR QUÉ
-------
En este proyecto los archivos grandes no son grandes por accidente: un pack son
39.000 tokens, el SDD 42.000 y el decreto 30.000. Abrir uno entero para mirar un
descriptor gasta un quinto de la ventana de contexto en texto que no se usa, y
esa es la razón por la que una sesión se agota antes de terminar el trabajo.

El hábito no se corrige con una nota en CLAUDE.md: se corrige donde se comete.
Este hook no prohíbe leer nada —solo dice que hay una forma más barata de leer
exactamente lo mismo— y siempre nombra la orden concreta que la sustituye.

Las salidas de emergencia, a propósito:
  · una lectura parcial (Read con `limit` de 400 líneas o menos) pasa siempre;
  · `sed -n '100,180p' archivo` por Bash pasa siempre, y es lo que hay que usar
    cuando de verdad hace falta un trozo que ninguna herramienta recorta.

Los derivados (docs/revision-*.md, js/lexico.js) no tienen salida barata porque
no tienen ni un hecho propio: todo lo que dicen está en data/.
"""
import json
import os
import re
import sys

LIMITE_PARCIAL = 400  # líneas: por debajo de esto, una lectura parcial es barata

# (patrón de ruta, qué usar en su lugar)
CAROS = [
    (re.compile(r"data[/\\]pack-[\w-]+\.json$"),
     "Un pack son ~39.000 tokens y casi ninguno se usa.\n"
     "  python scripts/ver.py pack <mote>                     índice, ~700 tokens\n"
     "  python scripts/ver.py pack <mote> --curso 3ESO        solo ese curso\n"
     "  python scripts/ver.py criterio <id>                   un criterio entero\n"
     "  python scripts/ver.py buscar \"<texto>\"                dónde se dice algo\n"
     "Para EDITARLO no hace falta leerlo entero: Edit sobre la cadena exacta."),

    (re.compile(r"docs[/\\]diseno[/\\]SDD\.md$"),
     "El SDD son ~42.000 tokens y nunca se necesita entero.\n"
     "  python scripts/ver.py sdd                             índice con el coste de cada §\n"
     "  python scripts/ver.py sdd 6.3                         solo esa sección"),

    (re.compile(r"docs[/\\]diseno[/\\]SDD-cambios\.md$"),
     "El registro de cambios son ~18.000 tokens de historia.\n"
     "  python scripts/ver.py doc docs/diseno/SDD-cambios.md  índice\n"
     "  grep -n 'v1.3' docs/diseno/SDD-cambios.md             la entrada que buscas"),

    (re.compile(r"fuentes[/\\]curriculo[/\\].*\.md$"),
     "El decreto son ~30.000 tokens. Las citas se siguen sacando de él, pero por criterio:\n"
     "  python scripts/dossier_criterios.py --codigo 5.1      ese criterio, curso a curso\n"
     "  python scripts/dossier_criterios.py --curso 3ESO --breve\n"
     "  python scripts/dossier_criterios.py --saber publicidad"),

    (re.compile(r"docs[/\\]revision-[\w-]+\.md$"),
     "GENERADO desde data/ por scripts/generar_revision.py: no lleva ni un hecho propio,\n"
     "y leerlo es pagar dos veces por el mismo pack.\n"
     "  python scripts/ver.py pack <mote>                     la misma información, 50 veces más barata"),

    (re.compile(r"js[/\\]lexico\.js$"),
     "GENERADO desde data/reglas-lexicas.json por scripts/generar_lexico.py.\n"
     "  python scripts/ver.py doc data/reglas-lexicas.json    o lee el JSON, que es la fuente"),
]


def main():
    try:
        entrada = json.load(sys.stdin)
    except Exception:
        return 0

    razon = _veredicto(entrada)
    if razon:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": razon,
            }
        }, ensure_ascii=False))
    return 0


def prueba():
    """`python .claude/hooks/coste_lectura.py --prueba` — comprueba el hook sin
    enchufarlo. Si esto imprime «13/13», el hook hace lo que dice."""
    casos = [
        ("data/pack-lcl-expositivo.json", None, True),
        ("C:/x/Proyecto_rubricas/data/pack-lcl-oral.json", None, True),
        ("data\\pack-lcl-oral.json", None, True),
        ("docs/diseno/SDD.md", None, True),
        ("docs/diseno/SDD-cambios.md", None, True),
        ("fuentes/curriculo/curriculo-ESO-Murcia-lengua.md", None, True),
        ("docs/revision-lcl-expositivo.md", None, True),
        ("js/lexico.js", None, True),
        # Salidas de emergencia y archivos normales: tienen que pasar.
        ("data/pack-lcl-expositivo.json", 80, False),
        ("docs/diseno/SDD.md", 400, False),
        ("js/motor.js", None, False),
        ("data/catalogo.json", None, False),
        ("CLAUDE.md", None, False),
    ]
    bien = 0
    for ruta, limite, debe_frenar in casos:
        tool = {"file_path": ruta}
        if limite:
            tool["limit"] = limite
        frena = bool(_veredicto({"tool_name": "Read", "tool_input": tool}))
        ok = frena == debe_frenar
        bien += ok
        print("  %s  %-52s %s" % ("OK  " if ok else "FALLO", ruta,
                                  "frena" if frena else "pasa"))
    print("%d/%d" % (bien, len(casos)))
    return 0 if bien == len(casos) else 1


def _veredicto(entrada):
    """La decisión, separada de la entrada/salida para poder probarla."""
    if entrada.get("tool_name") != "Read":
        return None
    tool = entrada.get("tool_input") or {}
    ruta = (tool.get("file_path") or "").replace("\\", "/")
    if not ruta:
        return None
    limite = tool.get("limit")
    if isinstance(limite, int) and 0 < limite <= LIMITE_PARCIAL:
        return None
    for patron, consejo in CAROS:
        if patron.search(ruta):
            return ("%s no se lee entero en este proyecto.\n\n%s\n\n"
                    "Si de verdad hace falta un trozo concreto: Read con `limit` de %d "
                    "líneas o menos, o `sed -n 'INI,FINp' %s` por Bash."
                    % (os.path.basename(ruta), consejo, LIMITE_PARCIAL, ruta))
    return None


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass
    if "--prueba" in sys.argv:
        sys.exit(prueba())
    # Ante cualquier imprevisto, el hook DEJA PASAR. Un freno de contexto que
    # rompe una sesión cuesta muchísimo más de lo que ahorra.
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
