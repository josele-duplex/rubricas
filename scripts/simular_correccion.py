# -*- coding: utf-8 -*-
"""
Simula la corrección de un alumno para probar una matriz cuantitativa.

Obligatorio para toda matriz nueva (SDD §15). Leer una matriz no basta: los efectos
de las bandas y las penalizaciones sobre el nivel resultante no se ven hasta que se
calculan. Esta prueba fue la que destapó la regla del doble castigo (SDD §6.3).

Uso:
    python scripts/simular_correccion.py data/pack-lcl-expositivo.json 3ESO

Con un perfil aleatorio reproducible, o editando PERFILES para un caso concreto.
"""
import json, sys, random

# Bandas de conversión de puntos a nivel (SDD §6.4), confirmadas por dos fuentes.
def nivel_de(puntos):
    if puntos >= 9: return 4
    if puntos >= 7: return 3
    if puntos >= 5: return 2
    return 1

# Valor de una dimensión sin matriz: escala equilibrada del SDD §6.2.
# Fue el punto medio de cada banda {1: 2.5, 2: 6.0, 3: 8.0, 4: 9.5} hasta que se
# vio que el proyecto sostenía dos escalas a la vez y que la diferencia decidía
# aprobados: el mismo perfil daba 5,10 con los puntos medios y 4,90 con esta.
# Manda esta porque es la que se imprime en la ficha del alumno y la que se
# corresponde con el vocabulario de siempre: Conseguido 5 (suficiente),
# Avanzado 7,5 (notable), Excelente 10 (sobresaliente).
VALOR_NIVEL = {1: 2.5, 2: 5.0, 3: 7.5, 4: 10.0}


def simular(pack, curso, perfil=None, semilla=None):
    criterios = [c for c in pack["criterios"] if c["curso"] == curso]
    if not criterios:
        raise SystemExit("El pack no tiene criterios para el curso %s" % curso)
    rnd = random.Random(semilla if semilla is not None else 7)

    filas, total = [], 0.0
    for c in criterios:
        m = c.get("matriz_cuantitativa")
        if m is None:
            n = (perfil or {}).get(c["id"], rnd.randint(1, 4))
            puntos, detalle = VALOR_NIVEL[n], "por descriptor (nivel %d)" % n
        else:
            elegidas = []
            for comp in m["componentes"]:
                banda = rnd.choice(comp["bandas"])
                elegidas.append((comp["nombre"], banda["puntos"]))
            bruto = sum(p for _, p in elegidas)
            descuento = 0.0
            for pen in m["penalizaciones"]:
                veces = rnd.randint(0, 3)
                if veces:
                    descuento += max(pen["puntos"] * veces, pen["tope"])
            puntos = max(0.0, bruto + descuento)
            detalle = "bruto %g" % bruto + (", penaliz. %g" % descuento if descuento else "")
        nivel = nivel_de(puntos)
        aporta = puntos * c["peso_base"] / 100
        total += aporta
        filas.append((c["nombre"], c["peso_base"], puntos, nivel, aporta, detalle))
    return filas, total


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else "data/pack-lcl-expositivo.json"
    curso = sys.argv[2] if len(sys.argv) > 2 else "3ESO"
    semilla = int(sys.argv[3]) if len(sys.argv) > 3 else None
    pack = json.load(open(ruta, encoding="utf8"))

    filas, total = simular(pack, curso, semilla=semilla)
    print("Simulación de corrección · %s · %s" % (pack["etiqueta"], curso))
    print("=" * 78)
    print("%-38s %5s %7s %6s %7s" % ("DIMENSIÓN", "PESO", "PUNTOS", "NIVEL", "APORTA"))
    print("-" * 78)
    for nombre, peso, puntos, nivel, aporta, detalle in filas:
        print("%-38s %4d%% %7.1f %6d %7.2f   %s" % (nombre[:38], peso, puntos, nivel, aporta, detalle))
    print("-" * 78)
    print("%-38s %4d%% %7s %6s %7.2f" % ("NOTA FINAL", sum(f[1] for f in filas), "", "", total))
    print()
    print("Comprueba: ¿le pondrías esta nota a un alumno con este perfil?")
    print("Si una dimensión cae dos niveles de golpe, sospecha de las penalizaciones.")


if __name__ == "__main__":
    main()
