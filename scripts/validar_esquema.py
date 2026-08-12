# -*- coding: utf-8 -*-
"""
Comprueba la FORMA de los packs contra data/esquema-pack.json.

Va antes que validar_pack.py, que comprueba el contenido. La diferencia importa:
validar_pack.py da por hecho que el pack tiene la forma que espera, y cuando no la
tiene se rompe con un KeyError en mitad de una regla —o, peor, no se rompe, porque
buena parte del código lee con .get() y un campo que falta se lee como "no aplica".
Un criterio sin `progresion` no daba error: dejaba de comprobarse el techo de §5.4.

Con cuatro packs escritos por la misma persona esto casi no se nota. Con packs
escritos por el profesorado de otra materia es la primera línea de defensa, y la
única que da un mensaje que se puede seguir: la ruta exacta del campo.

Uso:
    python scripts/validar_esquema.py                      (los packs del catálogo)
    python scripts/validar_esquema.py data/pack-x.json

Código de salida 1 si algún pack no tiene la forma declarada.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo import RAIZ, catalogo, cargar_json, rutas_de_packs, sin_notas   # noqa: E402

RUTA_ESQUEMA = os.path.join(RAIZ, "data", "esquema-pack.json")

COMPROBACION_TIPO = {
    "texto": lambda v: isinstance(v, str),
    "entero": lambda v: isinstance(v, int) and not isinstance(v, bool),
    "decimal": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
    "booleano": lambda v: isinstance(v, bool),
    "lista": lambda v: isinstance(v, list),
    "objeto": lambda v: isinstance(v, dict),
    "nulo": lambda v: v is None,
}


class Validador:
    def __init__(self, esquema, cat):
        self.formas = esquema["formas"]
        self.raiz = esquema["raiz"]
        # Valores que el catálogo da de alta. Si un pack nombra un curso o una
        # materia que no existe ahí, el fallo se ve aquí y no dos pasos después
        # como "no hay criterios para ese curso".
        self.del_catalogo = {
            "materias": set(cat["materias"]),
            "cursos": set(cat["cursos"]["orden"]),
        }
        self.errores = []

    def err(self, ruta, mensaje):
        self.errores.append((ruta, mensaje))

    def validar(self, valor):
        self.errores = []
        self.objeto(valor, self.raiz, "")
        return self.errores

    def objeto(self, valor, nombre_forma, ruta):
        forma = self.formas[nombre_forma]
        campos = {k: v for k, v in forma.items() if k != "_nota"}

        sobrantes = set(valor) - set(campos)
        if sobrantes:
            self.err(ruta or "(raíz)", "campos que el esquema no conoce: %s"
                     % ", ".join(sorted(sobrantes)))

        for clave, regla in campos.items():
            sub = "%s.%s" % (ruta, clave) if ruta else clave
            if clave not in valor:
                if regla.get("obligatorio"):
                    self.err(sub, "falta un campo obligatorio")
                continue
            self.campo(valor[clave], regla, sub)

    def campo(self, valor, regla, ruta):
        tipos = regla["tipo"].split("|")
        if not any(COMPROBACION_TIPO[t](valor) for t in tipos):
            self.err(ruta, "se esperaba %s y hay %s"
                     % (" o ".join(tipos), type(valor).__name__))
            return

        if valor is None:
            return

        if "valores" in regla and valor not in regla["valores"]:
            self.err(ruta, "valor '%s' fuera de la lista admitida: %s"
                     % (valor, ", ".join(map(str, regla["valores"]))))

        if "del_catalogo" in regla:
            admitidos = self.del_catalogo[regla["del_catalogo"]]
            if valor not in admitidos:
                self.err(ruta, "'%s' no está dado de alta en data/catalogo.json (%s). "
                         "Admitidos: %s" % (valor, regla["del_catalogo"],
                                            ", ".join(sorted(admitidos))))

        if isinstance(valor, (int, float)) and not isinstance(valor, bool):
            if "minimo" in regla and valor < regla["minimo"]:
                self.err(ruta, "%s es menor que el mínimo %s" % (valor, regla["minimo"]))
            if "maximo" in regla and valor > regla["maximo"]:
                self.err(ruta, "%s es mayor que el máximo %s" % (valor, regla["maximo"]))

        if isinstance(valor, list):
            if len(valor) < regla.get("min_elementos", 0):
                self.err(ruta, "tiene %d elemento(s) y hacen falta al menos %d"
                         % (len(valor), regla["min_elementos"]))
            for i, elemento in enumerate(valor):
                self.elemento(elemento, regla.get("de"), "%s[%d]" % (ruta, i))

        elif isinstance(valor, dict) and regla.get("de"):
            self.objeto(valor, regla["de"], ruta)

    def elemento(self, valor, nombre_forma, ruta):
        if nombre_forma is None:
            return
        forma = self.formas[nombre_forma]
        primitiva = forma.get("_primitiva")
        if primitiva:
            if not COMPROBACION_TIPO[primitiva](valor):
                self.err(ruta, "se esperaba %s y hay %s" % (primitiva, type(valor).__name__))
            return
        if not isinstance(valor, dict):
            self.err(ruta, "se esperaba un objeto '%s' y hay %s" % (nombre_forma, type(valor).__name__))
            return
        self.objeto(valor, nombre_forma, ruta)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    esquema = sin_notas(cargar_json(RUTA_ESQUEMA))
    # `sin_notas` colapsa los bloques que solo llevan `terminos`; el esquema no
    # tiene ninguno, pero sí `_nota` dentro de cada forma, y ahí sí estorban.
    validador = Validador(esquema, catalogo())

    fallo = False
    for ruta in rutas_de_packs(sys.argv[1:]):
        # A propósito el .json CRUDO, sin componer con el banco de verbos: lo que
        # se comprueba aquí es lo que hay escrito en el archivo, que es lo que
        # alguien va a editar a mano.
        pack = cargar_json(ruta)
        errores = validador.validar(pack)
        nombre = os.path.basename(ruta)
        print("=" * 72)
        print("%s · forma" % nombre)
        print("-" * 72)
        if not errores:
            print("  Sin incidencias. %d criterios." % len(pack.get("criterios", [])))
            continue
        fallo = True
        for ruta_campo, mensaje in errores[:60]:
            print("  ERROR   %s\n          %s" % (ruta_campo, mensaje))
        if len(errores) > 60:
            print("  ... y %d error(es) más." % (len(errores) - 60))
        print("\n  %d error(es) de forma: el pack no se puede validar por contenido "
              "hasta que la forma cuadre." % len(errores))
    return 1 if fallo else 0


if __name__ == "__main__":
    sys.exit(main())
