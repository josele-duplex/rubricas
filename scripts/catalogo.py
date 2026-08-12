# -*- coding: utf-8 -*-
"""
Acceso común al catálogo y al léxico. Lo usan todos los scripts de taller.

Antes cada script hacía su propio `glob("data/*.json")` y daba por hecho que todo
lo que hubiera ahí era un pack. En cuanto data/ tuvo un archivo de configuración,
el validador intentó validarlo como si fuera un pack. Un catálogo explícito no
tiene ese problema, y además es donde una materia nueva se declara una sola vez.
"""
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_CATALOGO = os.path.join(RAIZ, "data", "catalogo.json")
RUTA_LEXICO = os.path.join(RAIZ, "data", "reglas-lexicas.json")
RUTA_VERBOS = os.path.join(RAIZ, "data", "verbos.json")


def sin_notas(valor):
    """Quita las claves `_nota` y colapsa los bloques que solo llevan `terminos`.

    En los JSON esas claves existen para que la explicación viaje pegada al dato;
    el código no las quiere. Es la misma limpieza que hace scripts/generar_lexico.py
    antes de escribir el módulo de la aplicación, para que ambos lados vean
    exactamente la misma estructura."""
    if isinstance(valor, dict):
        d = {k: sin_notas(v) for k, v in valor.items() if k != "_nota"}
        return d["terminos"] if set(d) == {"terminos"} else d
    if isinstance(valor, list):
        return [sin_notas(v) for v in valor]
    return valor


def cargar_json(ruta):
    with open(ruta, encoding="utf8") as f:
        return json.load(f)


def catalogo():
    return sin_notas(cargar_json(RUTA_CATALOGO))


def lexico():
    return sin_notas(cargar_json(RUTA_LEXICO))


def derivacion(materia):
    """Las dos tablas de derivación de una materia: matriz §4.3 y ejes §5.4.

    Viven en data/derivacion-<materia>.json, declarado en `materias.<X>.derivacion`.
    Antes se leían del SDD parseando markdown, lo que funcionaba con una sola materia
    y se quedaba corto con dos; ahora el SDD las imprime desde aquí."""
    entrada = catalogo()["materias"].get(materia, {}).get("derivacion")
    if not entrada:
        raise SystemExit(
            "La materia %s no declara `derivacion` en data/catalogo.json.\n"
            "Toda materia necesita su data/derivacion-<materia>.json con la matriz "
            "de tareas (§4.3) y los ejes de progresión (§5.4)." % materia)
    return sin_notas(cargar_json(os.path.join(RAIZ, entrada)))


def materias():
    """(clave, bloque) de cada materia del catálogo, en el orden en que está escrita."""
    return list(catalogo()["materias"].items())


def rutas_de_packs(argumentos=None):
    """Rutas de los packs a procesar: las que pida la línea de órdenes, o todas
    las del catálogo en su orden. Nunca un glob de data/."""
    explicitas = [a for a in (argumentos or []) if not a.startswith("--")]
    if explicitas:
        return [a if os.path.isabs(a) else os.path.join(RAIZ, a) for a in explicitas]
    return [os.path.join(RAIZ, p["archivo"]) for p in catalogo()["packs"]]


def banco_de_verbos():
    return sin_notas(cargar_json(RUTA_VERBOS))["verbos"]


def cargar_pack(ruta):
    """Un pack tal y como lo ve el motor: con el banco de verbos ya puesto.

    El banco vivía copiado dentro de cada pack y las copias se separaron —al
    escribir el argumentativo faltaban ocho verbos que el expositivo sí tenía—.
    Ahora vive una vez en data/verbos.json y un pack solo puede AÑADIR los suyos
    en `verbos_extra`; redefinir uno del banco es error, porque la forma de 1.ª
    persona de un verbo no puede depender de qué pack se cargó el último."""
    pack = cargar_json(ruta)
    banco = banco_de_verbos()
    por_id = {v["id"]: v for v in banco}

    choques = [v["id"] for v in pack.get("verbos_extra", []) if v["id"] in por_id]
    if choques:
        raise SystemExit(
            "%s redefine en `verbos_extra` verbos que ya están en data/verbos.json: %s.\n"
            "Si hay que cambiarlos, se cambian en el banco; si son otros, cámbiales el id."
            % (os.path.basename(ruta), ", ".join(sorted(choques))))

    pack["verbos"] = banco + pack.get("verbos_extra", [])
    return pack


def entrada_de_pack(pack_id):
    for p in catalogo()["packs"]:
        if p["id"] == pack_id:
            return p
    return None
