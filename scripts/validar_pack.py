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
import json, re, sys, glob, os, collections

# Calificadores vagos: la "adverbitis" del marco teórico §3.
ADVERBITIS = [
    "bien", "regular", "adecuadamente", "correctamente", "frecuentemente",
    "a veces", "bastante", "suficientemente", "de forma adecuada", "normalmente",
    "casi siempre", "en general", "habitualmente", "de manera correcta",
    "puntualmente", "escasamente", "muy ",
]

# Un descriptor de nivel 1 describe lo que el alumno sí hace, de forma limitada.
NEGACIONES = ["no ", "carece", "sin lograr", "es incapaz", "nunca "]

VACIAS = {"cada", "de", "la", "el", "los", "las", "un", "una", "que", "sin",
          "por", "no", "y", "en", "su", "se", "mas", "con", "al", "del", "sea"}

TOPE_PENALIZACION = 0.35   # ninguna penalización pasa del 35% de la dimensión
TOPE_CONJUNTO = 0.50       # todas juntas, no más de la mitad
SIMILITUD_MAX = 0.75       # dos niveles contiguos no pueden parecerse más


def primer_verbo(texto):
    return re.findall(r"\w+", texto.lower())[0]


def palabras(texto):
    return set(re.findall(r"\w+", texto.lower()))


def validar(ruta):
    pack = json.load(open(ruta, encoding="utf8"))
    verbos = {v["3s"].lower(): v for v in pack["verbos"]}
    errores, avisos = [], []
    pesos = collections.defaultdict(int)
    con_matriz = 0

    def err(cid, donde, msg): errores.append((cid, donde, msg))
    def avi(cid, donde, msg): avisos.append((cid, donde, msg))

    for c in pack["criterios"]:
        cid = c["id"]
        pesos[c["curso"]] += c["peso_base"]

        # --- Trazabilidad curricular: sin criterio oficial no hay rúbrica ---
        if not c.get("criterio_oficial", {}).get("cita"):
            err(cid, "trazabilidad", "no cita ningún criterio de evaluación oficial")

        # --- Descriptores ---
        for nivel, d in c["descriptores"].items():
            texto = d["texto"]
            minus = " " + texto.lower()
            verbo = primer_verbo(texto)

            if verbo not in verbos:
                err(cid, nivel, "el descriptor no empieza por un verbo del banco: '%s'" % verbo)
            elif verbos[verbo]["id"] != d["verbo"]:
                err(cid, nivel, "el verbo declarado (%s) no es el del texto (%s)" % (d["verbo"], verbo))

            for a in ADVERBITIS:
                if a in minus:
                    err(cid, nivel, "adverbitis: '%s'" % a.strip())

            if nivel == "n1":
                for n in NEGACIONES:
                    if (" " + n) in minus[:45]:
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
                minus = " " + b["condicion"].lower()
                for a in ADVERBITIS:
                    if a in minus:
                        err(cid, etq, "adverbitis en una banda ('%s'): la matriz deja de ser contable" % a.strip())

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

    # --- Pesos ---
    for curso, total in sorted(pesos.items()):
        if total != 100:
            avi("(pack)", "pesos", "los pesos de %s suman %d, no 100 (el motor normaliza, pero conviene cuadrarlo)" % (curso, total))

    return pack, errores, avisos, con_matriz, dict(pesos)


def main():
    rutas = sys.argv[1:] or sorted(glob.glob(os.path.join("data", "*.json")))
    if not rutas:
        print("No hay packs que validar en data/")
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
