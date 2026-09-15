# -*- coding: utf-8 -*-
"""
Marcas de cursiva en los textos de un pack (SDD §5.2). Par en Python de
js/marcas.js: la misma expresión regular y las mismas tres operaciones, y la
paridad entre los dos la exige scripts/comprobar_paridad.py.

Un descriptor menciona formas de la lengua —«los conectores y, pero y
entonces»— y sin marca la "y" conector y la "y" que enumera se confunden. La
convención es la del Markdown, *así*: se lee en el JSON crudo y los
docs/revision-*.md la pintan sin tocarla.

Una marca bien formada abre y cierra pegada a la palabra: "*y*", "*en primer
lugar*". Ni "* y*" ni "**" ni un asterisco suelto.
"""
import re

MARCA_CURSIVA = re.compile(r"\*([^*\s](?:[^*]*[^*\s])?)\*")


def sin_marcas(texto):
    """Quita los asteriscos y deja las palabras: lo que miran las reglas."""
    return MARCA_CURSIVA.sub(r"\1", texto)


def texto_plano(texto):
    """Texto para donde no hay cursiva (consola, CSV): «y», «pero»."""
    return MARCA_CURSIVA.sub("«\\1»", texto)


def error_de_marcas(texto):
    """None si las marcas están bien formadas; si no, qué queda sin cerrar."""
    resto = MARCA_CURSIVA.sub("", texto)
    if "*" not in resto:
        return None
    i = resto.index("*")
    return 'marca de cursiva mal formada cerca de "…%s…"' % resto[max(0, i - 12):i + 13]
