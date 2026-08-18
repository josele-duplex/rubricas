# -*- coding: utf-8 -*-
"""
Lector quirúrgico del proyecto: enseña el trozo que se necesita, no el archivo.

POR QUÉ EXISTE
--------------
Este proyecto tiene los hechos en archivos muy grandes: un pack son 75-158 KB de
JSON, el SDD son 246 KB de Markdown y el decreto son 177 KB. Abrir uno entero
para tocar un descriptor cuesta entre 20.000 y 60.000 tokens, y el 99 % de lo que
entra no se usa. Hecho tres o cuatro veces, eso es la sesión.

La regla del proyecto no cambia —el JSON manda, las citas se leen del texto real—;
lo que cambia es cuánto hay que traerse para cumplirla:

    índice de un pack (36 criterios) ......  ~2 KB   frente a 157 KB
    un criterio con su cita ...............  ~0,5 KB frente a 157 KB
    una sección del SDD ...................  ~3 KB   frente a 246 KB

NO valida, NO corrige y NO decide: solo recorta. Quien dice si algo está bien
sigue siendo scripts/comprobar_todo.py.

USO
---
    python scripts/ver.py packs                          qué packs hay y cuánto pesan
    python scripts/ver.py pack expositivo                índice: una línea por criterio
    python scripts/ver.py pack expositivo --curso 3ESO   solo ese curso
    python scripts/ver.py criterio lcl-b-cohesion-expo-3eso
    python scripts/ver.py criterio --pack expositivo --curso 3ESO --dimension cohesion
    python scripts/ver.py sdd                            índice del SDD, con su coste
    python scripts/ver.py sdd 6.3                        solo esa sección
    python scripts/ver.py doc docs/diseno/anadir-una-materia.md
    python scripts/ver.py buscar "hiperónimos"           dónde se dice eso, en una línea
    python scripts/ver.py coste                          qué cuesta leer cada cosa

`pack` y `criterio` aceptan --json para encadenarlos con otro script.
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import RAIZ, catalogo, cargar_json  # noqa: E402

SDD = os.path.join(RAIZ, "docs", "diseno", "SDD.md")


def utf8():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def tokens(texto):
    """Estimación, no medida: ~4 caracteres por token en español."""
    return max(1, len(texto) // 4)


def coste(ruta):
    with open(ruta, encoding="utf8") as f:
        return tokens(f.read())


def mote_de(ruta):
    return os.path.basename(ruta).replace("pack-lcl-", "").replace(".json", "")


# ---------------------------------------------------------------------------
# Packs
# ---------------------------------------------------------------------------

def ruta_de_pack(nombre):
    """Acepta «expositivo», el pack_id, el nombre del archivo o la ruta."""
    cat = catalogo()
    for p in cat["packs"]:
        arch = os.path.basename(p["archivo"])
        if nombre in (p["id"], arch, mote_de(arch), p["archivo"]):
            return os.path.join(RAIZ, p["archivo"])
    if os.path.isfile(nombre):
        return nombre
    disponibles = ", ".join(mote_de(p["archivo"]) for p in cat["packs"])
    raise SystemExit("No hay ningún pack «%s». Hay: %s." % (nombre, disponibles))


def rutas_de_todos_los_packs():
    return [os.path.join(RAIZ, p["archivo"]) for p in catalogo()["packs"]]


def indice_de_pack(pack, curso=None, dimension=None):
    """Una línea por criterio: lo justo para saber cuál hay que abrir."""
    filas = []
    for c in pack["criterios"]:
        if curso and c["curso"] != curso:
            continue
        if dimension and dimension not in (c.get("dimension") or ""):
            continue
        filas.append({
            "curso": c["curso"],
            "codigo": c["criterio_oficial"]["codigo"],
            "dimension": c.get("dimension") or "",
            "peso": c.get("peso_base"),
            "id": c["id"],
            "matriz": bool(c.get("matriz_cuantitativa")),
            "hereda": c.get("hereda_de") or "",
            "nombre": c.get("nombre") or "",
        })
    orden = catalogo()["cursos"]["orden"]
    filas.sort(key=lambda f: (orden.index(f["curso"]) if f["curso"] in orden else 99,
                              f["dimension"]))
    return filas


def imprimir_indice(pack, filas, ruta):
    print("%s · %s · v%s" % (pack["pack_id"], pack["etiqueta"], pack["version"]))
    print("%s · %d criterios · leerlo entero costaría ~%d tokens"
          % (os.path.relpath(ruta, RAIZ).replace("\\", "/"),
             len(pack["criterios"]), coste(ruta)))
    curso_actual = None
    for f in filas:
        if f["curso"] != curso_actual:
            curso_actual = f["curso"]
            print("")
            print("· %s" % curso_actual)
        print("  %-5s %3s%%  %-30s %s%s"
              % (f["codigo"], f["peso"],
                 f["dimension"] + ("[Q]" if f["matriz"] else ""),
                 f["id"], ("  hereda<-" + f["hereda"]) if f["hereda"] else ""))
    print("")
    print("[Q] = lleva matriz cuantitativa.  Un criterio entero: "
          "python scripts/ver.py criterio <id>")


def criterios_que_encajan(pack, ident=None, curso=None, dimension=None):
    salida = []
    for c in pack["criterios"]:
        if ident and ident not in (c["id"], c["criterio_oficial"]["codigo"]):
            continue
        if curso and c["curso"] != curso:
            continue
        if dimension and dimension not in (c.get("dimension") or ""):
            continue
        salida.append(c)
    return salida


def imprimir_criterio(c, pack_mote=""):
    """Lo que hace falta para juzgar el criterio y nada más: sin nulos, sin listas
    vacías y sin `perfil_salida`, que no se usa al redactar un descriptor."""
    of = c["criterio_oficial"]
    print("-- %s · %s · %s%s" % (c["id"], c["curso"], c.get("dimension") or "",
                                 ("  (%s)" % pack_mote) if pack_mote else ""))
    print("   nombre     %s" % c.get("nombre", ""))
    print("   criterio   %s (CE%s)" % (of["codigo"], of["competencia_especifica"]))
    print("   cita       %s" % of["cita"])
    if c.get("saber_vehiculo"):
        print("   vehiculo   %s" % "; ".join(c["saber_vehiculo"]))
    pr = c.get("progresion") or {}
    if pr:
        print("   progresion %s" % ", ".join("%s=%s" % (k, v) for k, v in pr.items()))
    print("   peso %s%% · prioridad %s · %s%s"
          % (c.get("peso_base"), c.get("prioridad"),
             "obligatorio" if c.get("obligatorio") else "opcional",
             (" · hereda de %s" % c["hereda_de"]) if c.get("hereda_de") else ""))
    for n in ("n1", "n2", "n3", "n4"):
        d = (c.get("descriptores") or {}).get(n)
        if d:
            print("   %s [%s] %s" % (n.upper(), d.get("verbo", ""), d.get("texto", "")))
    if c.get("descriptor_un_punto"):
        print("   1punto     %s" % c["descriptor_un_punto"])
    if c.get("descriptor_cotejo"):
        print("   cotejo     %s" % c["descriptor_cotejo"])
    if c.get("matriz_cuantitativa"):
        print("   matriz     %s" % json.dumps(c["matriz_cuantitativa"], ensure_ascii=False))
    print("")


# ---------------------------------------------------------------------------
# Documentos largos, por secciones
# ---------------------------------------------------------------------------

ENCABEZADO = re.compile(r"^(#{1,4})\s+(.*)$")


def secciones(ruta):
    """[(nivel, título, primera_línea, última_línea, texto)] de un Markdown."""
    with open(ruta, encoding="utf8") as f:
        lineas = f.read().splitlines()
    marcas = []
    dentro_de_codigo = False
    for i, l in enumerate(lineas):
        if l.startswith("```"):
            dentro_de_codigo = not dentro_de_codigo
        if dentro_de_codigo:
            continue
        m = ENCABEZADO.match(l)
        if m:
            marcas.append((i, len(m.group(1)), m.group(2).strip()))
    salida = []
    for k, (i, nivel, titulo) in enumerate(marcas):
        fin = marcas[k + 1][0] if k + 1 < len(marcas) else len(lineas)
        salida.append((nivel, titulo, i + 1, fin, "\n".join(lineas[i:fin])))
    return salida


def imprimir_indice_doc(ruta):
    print("%s · ~%d tokens en total"
          % (os.path.relpath(ruta, RAIZ).replace("\\", "/"), coste(ruta)))
    print("Pide solo la sección: python scripts/ver.py doc <ruta> --seccion <nº o texto>")
    print("")
    for nivel, titulo, ini, fin, texto in secciones(ruta):
        if nivel > 3:
            continue
        print("%s%-56s L%-5d ~%d tok"
              % ("  " * (nivel - 1), titulo[:56], ini, tokens(texto)))


def buscar_seccion(ruta, aguja):
    """La sección cuyo título empieza por ese número o contiene ese texto.

    Trae también lo que cuelga de ella: pedir «6» trae 6.1, 6.2 y 6.3; pedir
    «6.3» trae solo esa."""
    secs = secciones(ruta)
    aguja_l = aguja.lower().strip()
    elegida = None
    for k, (nivel, titulo, ini, fin, texto) in enumerate(secs):
        t = titulo.lower()
        if t.startswith(aguja_l + " ") or t.startswith(aguja_l + "."):
            elegida = k
            break
    if elegida is None:
        for k, (nivel, titulo, ini, fin, texto) in enumerate(secs):
            if aguja_l in titulo.lower():
                elegida = k
                break
    if elegida is None:
        return None
    nivel = secs[elegida][0]
    trozos = [secs[elegida][4]]
    for j in range(elegida + 1, len(secs)):
        if secs[j][0] <= nivel:
            break
        trozos.append(secs[j][4])
    return "\n".join(trozos)


# ---------------------------------------------------------------------------
# Buscar sin volcar archivos
# ---------------------------------------------------------------------------

def buscar(aguja, donde):
    """Dónde se dice eso, con una línea por acierto. Nunca vuelca un archivo."""
    aguja_l = aguja.lower()
    aciertos = []
    if donde in ("todo", "packs"):
        for ruta in rutas_de_todos_los_packs():
            pack = cargar_json(ruta)
            mote = mote_de(ruta)
            for c in pack["criterios"]:
                campos = [(n.upper(), (c.get("descriptores") or {}).get(n, {}).get("texto", ""))
                          for n in ("n1", "n2", "n3", "n4")]
                campos += [("CITA", c["criterio_oficial"]["cita"]),
                           ("NOMBRE", c.get("nombre") or ""),
                           ("1PUNTO", c.get("descriptor_un_punto") or "")]
                for etiqueta, texto in campos:
                    if texto and aguja_l in texto.lower():
                        aciertos.append(("%s/%s/%s" % (mote, c["curso"], c["id"]),
                                         etiqueta, texto))
    if donde in ("todo", "sdd"):
        for nivel, titulo, ini, fin, texto in secciones(SDD):
            for n, l in enumerate(texto.splitlines()):
                if aguja_l in l.lower():
                    aciertos.append(("SDD §%s" % titulo.split(" ")[0], "L%d" % (ini + n),
                                     l.strip()))
    return aciertos


# ---------------------------------------------------------------------------
# Coste
# ---------------------------------------------------------------------------

def _archivos(carpeta, ext, prefijo=""):
    salida = []
    if not os.path.isdir(carpeta):
        return salida
    for base, _, archivos in os.walk(carpeta):
        for a in archivos:
            if a.endswith(ext) and a.startswith(prefijo):
                salida.append(os.path.join(base, a))
    return salida


def tabla_de_coste():
    grupos = [
        ("packs (data/pack-*.json)", rutas_de_todos_los_packs()),
        ("SDD (docs/diseno/SDD.md)", [SDD]),
        ("currículo y fuentes (fuentes/**.md)", _archivos(os.path.join(RAIZ, "fuentes"), ".md")),
        ("revisiones GENERADAS (docs/revision-*.md)",
         _archivos(os.path.join(RAIZ, "docs"), ".md", "revision-")),
        ("resto de docs/", [r for r in _archivos(os.path.join(RAIZ, "docs"), ".md")
                            if not os.path.basename(r).startswith("revision-")]),
        ("aplicación (js/*.js)", _archivos(os.path.join(RAIZ, "js"), ".js")),
        ("herramientas (scripts/*.py)", _archivos(os.path.join(RAIZ, "scripts"), ".py")),
        ("instrucciones fijas (CLAUDE.md, README.md)",
         [os.path.join(RAIZ, "CLAUDE.md"), os.path.join(RAIZ, "README.md")]),
    ]
    print("%-44s %8s %10s" % ("ZONA", "ARCHIVOS", "~TOKENS"))
    print("-" * 66)
    total = 0
    for nombre, rutas in grupos:
        rutas = [r for r in rutas if os.path.isfile(r)]
        t = sum(coste(r) for r in rutas)
        total += t
        print("%-44s %8d %10d" % (nombre, len(rutas), t))
    print("-" * 66)
    print("%-44s %8s %10d" % ("TODO", "", total))
    print("")
    print("Una ventana de 200.000 tokens cabe %.1f veces aquí dentro." % (total / 200000.0))
    print("Por eso nada de esto se lee entero: ver.py pack / criterio / sdd / doc.")


# ---------------------------------------------------------------------------

def main():
    utf8()
    p = argparse.ArgumentParser(description="Enseña el trozo, no el archivo.")
    sub = p.add_subparsers(dest="orden")

    sub.add_parser("packs", help="qué packs hay y cuánto costaría leerlos")
    sub.add_parser("coste", help="qué cuesta en tokens cada zona del proyecto")

    a = sub.add_parser("pack", help="índice de un pack: una línea por criterio")
    a.add_argument("nombre")
    a.add_argument("--curso")
    a.add_argument("--dimension")
    a.add_argument("--json", action="store_true")

    b = sub.add_parser("criterio", help="un criterio completo, sin el resto del pack")
    b.add_argument("ident", nargs="?", help="id del criterio o código oficial (5.1)")
    b.add_argument("--pack", help="si no se da, busca en todos")
    b.add_argument("--curso")
    b.add_argument("--dimension")
    b.add_argument("--json", action="store_true")

    c = sub.add_parser("sdd", help="índice del SDD, o una sección suelta")
    c.add_argument("seccion", nargs="?")

    d = sub.add_parser("doc", help="cualquier Markdown largo, por secciones")
    d.add_argument("ruta")
    d.add_argument("--seccion")

    e = sub.add_parser("buscar", help="dónde se dice algo, una línea por acierto")
    e.add_argument("aguja")
    e.add_argument("--en", default="todo", choices=["todo", "packs", "sdd"])

    args = p.parse_args()

    if args.orden in (None, "packs"):
        print("%-16s %-42s %8s" % ("PACK", "ETIQUETA", "~TOKENS"))
        for ruta in rutas_de_todos_los_packs():
            pack = cargar_json(ruta)
            print("%-16s %-42s %8d" % (mote_de(ruta), pack["etiqueta"][:42], coste(ruta)))
        print("")
        print("Índice de uno: python scripts/ver.py pack <mote>")
        return 0

    if args.orden == "coste":
        tabla_de_coste()
        return 0

    if args.orden == "pack":
        ruta = ruta_de_pack(args.nombre)
        pack = cargar_json(ruta)
        filas = indice_de_pack(pack, args.curso, args.dimension)
        if args.json:
            print(json.dumps(filas, ensure_ascii=False, indent=1))
        else:
            imprimir_indice(pack, filas, ruta)
        return 0

    if args.orden == "criterio":
        rutas = [ruta_de_pack(args.pack)] if args.pack else rutas_de_todos_los_packs()
        encontrados = []
        for ruta in rutas:
            pack = cargar_json(ruta)
            for c in criterios_que_encajan(pack, args.ident, args.curso, args.dimension):
                encontrados.append((mote_de(ruta), c))
        if not encontrados:
            print("Ningún criterio encaja. Prueba: python scripts/ver.py pack <mote> --curso <curso>")
            return 1
        if args.json:
            print(json.dumps([c for _, c in encontrados], ensure_ascii=False, indent=1))
        else:
            for mote, c in encontrados:
                imprimir_criterio(c, mote)
            print("%d criterio(s)." % len(encontrados))
        return 0

    if args.orden == "sdd":
        if not args.seccion:
            imprimir_indice_doc(SDD)
            return 0
        texto = buscar_seccion(SDD, args.seccion)
        if texto is None:
            print("No hay ninguna sección «%s». Índice: python scripts/ver.py sdd" % args.seccion)
            return 1
        print(texto)
        return 0

    if args.orden == "doc":
        ruta = args.ruta if os.path.isabs(args.ruta) else os.path.join(RAIZ, args.ruta)
        if not os.path.isfile(ruta):
            print("No existe %s" % args.ruta)
            return 1
        if args.seccion:
            texto = buscar_seccion(ruta, args.seccion)
            if texto is None:
                print("No hay ninguna sección «%s» en ese documento." % args.seccion)
                return 1
            print(texto)
        else:
            imprimir_indice_doc(ruta)
        return 0

    if args.orden == "buscar":
        aciertos = buscar(args.aguja, args.en)
        for donde, etiqueta, texto in aciertos:
            print("%-44s %-7s %s" % (donde, etiqueta, texto.strip()[:120]))
        print("")
        print("%d acierto(s). Para ver uno entero: python scripts/ver.py criterio <id>"
              % len(aciertos))
        return 0

    p.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
