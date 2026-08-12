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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import catalogo, cargar_pack, rutas_de_packs   # noqa: E402

NIVELES = [("n1", "N1"), ("n2", "N2"), ("n3", "N3"), ("n4", "N4")]

# Los nombres de curso salen del catálogo: eran la cuarta copia de la misma
# tabla (js/ui.js, data/catalogo.json y aquí).
NOMBRE_CURSO = catalogo()["cursos"]["etiquetas"]


def generar(ruta_pack, ruta_salida):
    pack = cargar_pack(ruta_pack)
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
    # Sin argumentos regenera TODOS los documentos de revisión: eran derivados
    # que había que acordarse de regenerar uno a uno, y por eso se quedaban
    # atrás cuando se corregía un pack.
    for ruta_pack in rutas_de_packs(sys.argv[1:]):
        nombre = os.path.basename(ruta_pack).replace("pack-", "").replace(".json", "")
        salida = os.path.join("docs", "revision-%s.md" % nombre)
        ruta, n = generar(ruta_pack, salida)
        print("Escrito %s (%d líneas)" % (ruta, n))
