# -*- coding: utf-8 -*-
"""
Genera el documento de revisión docente de un pack.

Convierte el JSON en tablas legibles para que el profesor valide los descriptores
y las matrices sin tener que leer llaves. El JSON es la fuente; este documento
es derivado y se regenera, nunca se edita a mano.

Uso:
    python scripts/generar_revision.py data/pack-lcl-expositivo.json
"""
import json, sys, os, re, collections

NIVELES = [("n1", "N1"), ("n2", "N2"), ("n3", "N3"), ("n4", "N4")]

NOMBRE_CURSO = {
    "1ESO": "1.º de ESO", "2ESO": "2.º de ESO", "3ESO": "3.º de ESO",
    "4ESO": "4.º de ESO", "1BACH": "1.º de Bachillerato", "2BACH": "2.º de Bachillerato",
}


def generar(ruta_pack, ruta_salida):
    pack = json.load(open(ruta_pack, encoding="utf8"))
    verbos = {v["3s"]: v["1s"] for v in pack["verbos"]}
    n_matrices = sum(1 for c in pack["criterios"] if c.get("matriz_cuantitativa"))

    L = []
    w = L.append

    w("# Revisión del pack: %s\n" % pack["etiqueta"])
    w("**Pack** `%s` · versión %s · %d criterios · %d descriptores · %d matrices cuantitativas\n"
      % (os.path.basename(ruta_pack), pack["version"],
         len(pack["criterios"]), len(pack["criterios"]) * 4, n_matrices))
    w("> Documento para validación docente, generado desde el JSON. No se edita a mano.")
    w("> Al leer, mira sobre todo tres cosas: si el nivel N4 es alcanzable en ese curso,")
    w("> si los umbrales de las matrices coinciden con lo que ves en clase, y si el reparto de pesos te encaja.\n")
    w("---\n")

    por_curso = collections.OrderedDict()
    for c in pack["criterios"]:
        por_curso.setdefault(c["curso"], []).append(c)

    for curso, criterios in por_curso.items():
        w("## %s\n" % NOMBRE_CURSO.get(curso, curso))
        w("| Dimensión | Peso | Prio | Criterio oficial | Matriz |")
        w("|---|---|---|---|---|")
        for c in criterios:
            w("| **%s**%s | %d%% | %d | CE%d — %s | %s |" % (
                c["nombre"], " 🔒" if c["obligatorio"] else "", c["peso_base"], c["prioridad"],
                c["criterio_oficial"]["competencia_especifica"], c["criterio_oficial"]["codigo"],
                "sí" if c.get("matriz_cuantitativa") else "—"))
        w("")

        for c in criterios:
            w("### %s  ·  %d%%  ·  bloque %s%s\n" % (
                c["nombre"], c["peso_base"], c["bloque_lomloe"],
                "  ·  🔒 obligatorio" if c["obligatorio"] else ""))
            w("*Criterio oficial %s:* «%s»\n" % (c["criterio_oficial"]["codigo"], c["criterio_oficial"]["cita"]))
            w("*Saber-vehículo:* %s\n" % ", ".join(c["saber_vehiculo"]))

            w("| Nivel | Descriptor |")
            w("|---|---|")
            for k, etq in NIVELES:
                w("| **%s** | %s |" % (etq, c["descriptores"][k]["texto"]))
            w("")

            m = c.get("matriz_cuantitativa")
            if m:
                w("**Matriz cuantitativa** — total %d puntos. Es lo que usa el modo IA para corregir." % m["total"])
                w("")
                w("| Componente | Máx. | Bandas |")
                w("|---|---|---|")
                for comp in m["componentes"]:
                    bandas = "<br>".join("**%s** — %s" % (b["puntos"], b["condicion"]) for b in comp["bandas"])
                    w("| %s | %s | %s |" % (comp["nombre"], comp["max"], bandas))
                if m["penalizaciones"]:
                    w("")
                    for pen in m["penalizaciones"]:
                        w("*Penalización:* %s por %s (tope %s)" % (pen["puntos"], pen["por"], pen["tope"]))
            else:
                w("*Sin matriz cuantitativa: esta dimensión se juzga en conjunto, no hay nada que contar.*")
            w("")
        w("---\n")

    w("## Muestra de la versión de autoevaluación\n")
    w("Derivada del banco de verbos, sin reescribir nada a mano. Así es como la vería el alumno.\n")
    w("| Original (3.ª persona) | Autoevaluación (1.ª persona) |")
    w("|---|---|")
    for c in pack["criterios"][:3]:
        t = c["descriptores"]["n3"]["texto"]
        v = re.findall(r"\w+", t)[0]
        w("| %s | %s |" % (t, verbos[v] + t[len(v):]))

    open(ruta_salida, "w", encoding="utf8").write("\n".join(L))
    return ruta_salida, len(L)


if __name__ == "__main__":
    pack = sys.argv[1] if len(sys.argv) > 1 else "data/pack-lcl-expositivo.json"
    nombre = os.path.basename(pack).replace("pack-", "").replace(".json", "")
    salida = os.path.join("docs", "revision-%s.md" % nombre)
    ruta, n = generar(pack, salida)
    print("Escrito %s (%d líneas)" % (ruta, n))
