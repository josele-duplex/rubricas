# -*- coding: utf-8 -*-
"""
Huella FNV-1a de 32 bits de un texto, usada para detectar cuándo un
descriptor sencillo (`alumno.texto`, data/esquema-pack.json) se redactó
sobre otra versión del técnico (campo `origen`; SDD §17, decisión 22).

No es un hash criptográfico: tiene que calcularse igual, de forma síncrona,
aquí y en js/huella.js. FNV-1a sobre los bytes UTF-8 del texto tal cual es
la elección más simple que cumple eso. Paridad comprobada en
scripts/comprobar_paridad.py.
"""


def huella_fnv1a(texto):
    h = 0x811C9DC5
    for b in texto.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return "%08x" % h
