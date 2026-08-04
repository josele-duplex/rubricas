// Casos dorados del modo numérico (SDD §6.2-§6.5, §15: "configuraciones con
// nota conocida a mano, incluyendo normalización de pesos, condición mínima
// activada y detractores en el tope"). Cubre además los bordes que la propia
// especificación destapó al escribirse: el signo de las penalizaciones, el
// orden entre detractor y techo, el suelo en 0, y los cortes 5/7/9 con
// valores justo por debajo.

import {
  redondear2,
  valorNivel,
  nivelDe,
  puntosDeMatriz,
  calcularNota,
} from "../js/calificacion.js";

let pasados = 0;
let fallidos = 0;

function caso(nombre, fn) {
  try {
    fn();
    console.log(`  OK   ${nombre}`);
    pasados++;
  } catch (err) {
    console.error(`  FALLO ${nombre}`);
    console.error(`        ${err.message}`);
    fallidos++;
  }
}

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

function assertIgual(actual, esperado, mensaje) {
  assert(actual === esperado, `${mensaje} (esperado ${esperado}, obtenido ${actual})`);
}

// --- redondear2 --------------------------------------------------------
caso("redondear2: corrige el caso 1.005 que sin EPSILON cae a 1,00", () => {
  assertIgual(redondear2(1.005), 1.01, "1,005 no redondeó a 1,01");
});

caso("redondear2: mitad hacia arriba en un caso simple", () => {
  assertIgual(redondear2(6.665), 6.67, "6,665 no redondeó a 6,67");
});

caso("redondear2: limitación documentada — 8.995 se queda en 8,99, no en 9,00", () => {
  assertIgual(redondear2(8.995), 8.99, "8,995 debería seguir redondeando a 8,99 (imprecisión binaria aceptada)");
});

caso("redondear2: no toca un valor ya exacto", () => {
  assertIgual(redondear2(7.5), 7.5, "7,5 cambió al redondear");
});

// --- valorNivel ----------------------------------------------------------
caso("valorNivel: escala equilibrada, los cuatro niveles", () => {
  assertIgual(valorNivel(1), 2.5, "N1 equilibrada");
  assertIgual(valorNivel(2), 5, "N2 equilibrada");
  assertIgual(valorNivel(3), 7.5, "N3 equilibrada");
  assertIgual(valorNivel(4), 10, "N4 equilibrada");
});

caso("valorNivel: escala exigente reserva el 0 para N1", () => {
  assertIgual(valorNivel(1, "exigente"), 0, "N1 exigente");
  assertIgual(valorNivel(2, "exigente"), 5, "N2 exigente");
  assertIgual(valorNivel(3, "exigente"), 7.5, "N3 exigente");
  assertIgual(valorNivel(4, "exigente"), 10, "N4 exigente");
});

caso("valorNivel: escala desconocida lanza error", () => {
  let lanzo = false;
  try {
    valorNivel(2, "inventada");
  } catch {
    lanzo = true;
  }
  assert(lanzo, "no lanzó error con una escala desconocida");
});

// --- nivelDe (§6.4, cortes 5/7/9 con valores justo por debajo) -----------
caso("nivelDe: cortes exactos caen en el nivel de arriba (umbrales >=)", () => {
  assertIgual(nivelDe(9), 4, "9,0 debería ser N4");
  assertIgual(nivelDe(7), 3, "7,0 debería ser N3");
  assertIgual(nivelDe(5), 2, "5,0 debería ser N2");
});

caso("nivelDe: justo por debajo del corte cae al nivel de abajo", () => {
  assertIgual(nivelDe(8.9), 3, "8,9 debería ser N3, no N4");
  assertIgual(nivelDe(6.9), 2, "6,9 debería ser N2, no N3");
  assertIgual(nivelDe(4.9), 1, "4,9 debería ser N1, no N2");
});

caso("nivelDe: extremos de la escala", () => {
  assertIgual(nivelDe(10), 4, "10 debería ser N4");
  assertIgual(nivelDe(0), 1, "0 debería ser N1");
});

// --- puntosDeMatriz --------------------------------------------------------
const matrizSimple = {
  total: 10,
  componentes: [
    { nombre: "A", max: 6, bandas: [{ puntos: 6 }, { puntos: 3 }, { puntos: 0 }] },
    { nombre: "B", max: 4, bandas: [{ puntos: 4 }, { puntos: 2 }, { puntos: 0 }] },
  ],
  penalizaciones: [{ clave: "p1", puntos: -0.5, tope: -1 }],
};

caso("puntosDeMatriz: suma de componentes sin penalizaciones", () => {
  const puntos = puntosDeMatriz(matrizSimple, { A: 6, B: 4 });
  assertIgual(puntos, 10, "6+4 sin penalización debería dar 10");
});

caso("puntosDeMatriz: la penalización aplicada resta (se suma como negativa)", () => {
  const puntos = puntosDeMatriz(matrizSimple, { A: 6, B: 4 }, { p1: 1 });
  assertIgual(puntos, 9.5, "una ocurrencia de p1 (-0,5) debería dejar 9,5, no 10,5");
});

caso("puntosDeMatriz: Math.max respeta el tope, no lo desborda", () => {
  // 3 ocurrencias × -0,5 = -1,5, pero el tope es -1: debe quedarse en -1.
  const puntos = puntosDeMatriz(matrizSimple, { A: 6, B: 4 }, { p1: 3 });
  assertIgual(puntos, 9, "3 ocurrencias de p1 deberían quedar acotadas por el tope en -1 (10 - 1 = 9)");
});

caso("puntosDeMatriz: suelo en 0, nunca negativo", () => {
  // Componentes en su banda mínima (0) y penalización a tope (-1): el bruto ya
  // es 0, así que con la penalización debería quedar en 0, no en -1.
  const puntos = puntosDeMatriz(matrizSimple, { A: 0, B: 0 }, { p1: 5 });
  assertIgual(puntos, 0, "el suelo de la matriz debería impedir un resultado negativo");
});

caso("puntosDeMatriz: ausencia de la clave de penalización cuenta como 0 ocurrencias", () => {
  const puntos = puntosDeMatriz(matrizSimple, { A: 6, B: 4 }, {});
  assertIgual(puntos, 10, "sin ocurrencias registradas no debería aplicarse descuento");
});

caso("puntosDeMatriz: falta una banda elegida lanza error", () => {
  let lanzo = false;
  try {
    puntosDeMatriz(matrizSimple, { A: 6 });
  } catch {
    lanzo = true;
  }
  assert(lanzo, "no lanzó error al faltar la banda del componente B");
});

// --- calcularNota ------------------------------------------------------

function matrizConstante(puntos) {
  return {
    total: 10,
    componentes: [{ nombre: "unico", max: 10, bandas: [{ puntos }] }],
    penalizaciones: [],
  };
}

function entradaMatriz({ peso_base, obligatorio = false, puntos }) {
  return {
    peso_base,
    obligatorio,
    matrizCuantitativa: matrizConstante(puntos),
    resultado: { tipo: "matriz", bandasElegidas: { unico: puntos } },
  };
}

caso("calcularNota: dimensión sin matriz aporta el valor de su nivel (escala equilibrada)", () => {
  const { notaFinal } = calcularNota([
    { peso_base: 100, obligatorio: false, resultado: { tipo: "nivel", nivel: 2 } },
  ]);
  assertIgual(notaFinal, 5, "un único criterio en N2 sin matriz debería dar nota 5");
});

caso("calcularNota: dimensión con matriz aporta sus puntos brutos, no el valor de su nivel", () => {
  // 8,9 puntos cae en N3 por §6.4, pero lo que aporta a la nota es 8,9, no 7,5:
  // es la razón de ser de §6.2 (colapsar a nivel valdría 2,5 puntos por una décima).
  const { notaFinal } = calcularNota([entradaMatriz({ peso_base: 100, puntos: 8.9 })]);
  assertIgual(notaFinal, 8.9, "una dimensión con matriz en 8,9 debería aportar 8,9 a la nota");
});

caso("calcularNota: normaliza los pesos a 100 antes de calcular", () => {
  // Dos criterios con el mismo peso relativo (1 y 1) deben pesar igual que
  // 50/50, sin importar la escala absoluta de peso_base.
  const { notaFinal } = calcularNota([
    entradaMatriz({ peso_base: 1, puntos: 4 }),
    entradaMatriz({ peso_base: 1, puntos: 6 }),
  ]);
  assertIgual(notaFinal, 5, "pesos 1/1 deberían normalizarse a 50/50 y dar la media (4+6)/2=5");
});

caso("calcularNota: condición mínima desactivada no limita la nota aunque haya un obligatorio en N1", () => {
  const { notaFinal } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1
      entradaMatriz({ peso_base: 80, puntos: 10 }),
    ],
    { condicionMinimaActiva: false }
  );
  assertIgual(notaFinal, 8, "sin condición mínima activa, la nota no debe recortarse a 4,9");
});

caso("calcularNota: condición mínima activa pero sin ningún obligatorio en N1 no dispara el techo", () => {
  const { notaFinal, algunObligatorioEnN1 } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 5 }), // N2, no N1
      entradaMatriz({ peso_base: 80, puntos: 10 }),
    ],
    { condicionMinimaActiva: true }
  );
  assertIgual(algunObligatorioEnN1, false, "ningún obligatorio está en N1");
  assertIgual(notaFinal, 9, "la nota no debería recortarse si ningún obligatorio está en N1");
});

caso("calcularNota: condición mínima activa y disparada limita la nota a 4,9 (techo, no valor fijo)", () => {
  const { notaFinal } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1
      entradaMatriz({ peso_base: 80, puntos: 10 }),
    ],
    { condicionMinimaActiva: true }
  );
  // nota calculada = 0*0.2 + 10*0.8 = 8 > 4,9: debe recortarse a 4,9.
  assertIgual(notaFinal, 4.9, "la condición mínima disparada debería recortar la nota a 4,9");
});

caso("calcularNota: la condición mínima nunca sube una nota ya por debajo de 4,9", () => {
  const { notaFinal } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1
      entradaMatriz({ peso_base: 80, puntos: 3 }),
    ],
    { condicionMinimaActiva: true }
  );
  // nota calculada = 0*0.2 + 3*0.8 = 2,4, ya por debajo de 4,9: debe quedarse igual.
  assertIgual(notaFinal, 2.4, "una nota ya baja no debería subir hasta 4,9");
});

caso("calcularNota: un solo obligatorio en N1 basta para disparar el techo (no es acumulativo)", () => {
  const { notaFinal } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1 también
      entradaMatriz({ peso_base: 60, puntos: 10 }),
    ],
    { condicionMinimaActiva: true }
  );
  // nota calculada = 0 + 0 + 10*0.6 = 6 > 4,9: el techo sigue siendo 4,9, no baja más
  // por tener dos obligatorios en N1 en vez de uno.
  assertIgual(notaFinal, 4.9, "dos obligatorios en N1 no deberían bajar el techo por debajo de 4,9");
});

caso("calcularNota: detractor se aplica antes que la condición mínima, no al revés (§6.3)", () => {
  // Caso documentado en el SDD: nota calculada 8, detractor 2, condición mínima
  // disparada. Aplicando el techo primero saldría 4,9-2=2,9; el orden correcto
  // (detractor primero) da 8-2=6, min(6,4.9)=4,9.
  const { notaCalculada, notaTrasDetractor, notaFinal } = calcularNota(
    [
      entradaMatriz({ peso_base: 20, obligatorio: true, puntos: 0 }), // N1
      entradaMatriz({ peso_base: 80, puntos: 10 }),
    ],
    { condicionMinimaActiva: true, detractorAcumulado: 2 }
  );
  assertIgual(notaCalculada, 8, "la nota calculada antes de detractor y techo debería ser 8");
  assertIgual(notaTrasDetractor, 6, "tras el detractor de 2 la nota debería ser 6");
  assertIgual(notaFinal, 4.9, "el orden correcto (detractor, luego techo) debería dar 4,9, no 2,9");
});

caso("calcularNota: el detractor se acota a su tope de 2 puntos", () => {
  const { notaFinal } = calcularNota([entradaMatriz({ peso_base: 100, puntos: 10 })], {
    detractorAcumulado: 5,
  });
  assertIgual(notaFinal, 8, "un detractor de 5 debería acotarse a 2 (10 - 2 = 8), no restar 5");
});

caso("calcularNota: el detractor no puede bajar la nota de 0", () => {
  const { notaFinal } = calcularNota([entradaMatriz({ peso_base: 100, puntos: 1 })], {
    detractorAcumulado: 2,
  });
  assertIgual(notaFinal, 0, "1 - 2 debería quedar en 0, no en negativo");
});

caso("calcularNota: mezcla de dimensión con matriz y dimensión sin matriz en el mismo instrumento", () => {
  const { notaFinal } = calcularNota([
    entradaMatriz({ peso_base: 50, puntos: 8 }),
    { peso_base: 50, obligatorio: false, resultado: { tipo: "nivel", nivel: 2 } }, // vale 5
  ]);
  assertIgual(notaFinal, 6.5, "(8+5)/2 = 6,5 combinando matriz y descriptor en el mismo instrumento");
});

// --- resumen -------------------------------------------------------------
console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
