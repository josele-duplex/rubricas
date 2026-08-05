// Modo numérico — SDD §6.2-§6.4. Funciones puras de cálculo de nota: toman como
// entrada la forma mínima de "resultado de criterio" que define §6.5 y no saben
// de dónde salió (no hay todavía pantalla que registre el resultado de un
// alumno; ver §6.5). No se toca la interfaz aquí.

import { normalizarPesos } from "./motor.js";

// §6.2 — valor de cada nivel según la escala elegida. La equilibrada es la que
// se imprime en la ficha del alumno (Conseguido 5, Avanzado 7,5, Excelente 10).
export const ESCALAS_NIVEL = {
  equilibrada: { 1: 2.5, 2: 5, 3: 7.5, 4: 10 },
  exigente: { 1: 0, 2: 5, 3: 7.5, 4: 10 },
};

// §6.2 — redondeo a la centésima, mitad hacia arriba (no banker's rounding).
// El EPSILON corrige los casos en que el decimal no tiene representación binaria
// exacta (1.005 cae a 100.4999... sin él). No cubre errores mayores que EPSILON
// (8.995 se almacena como 8.99499... y sigue redondeando a 8,99): se acepta,
// porque estas matrices puntúan con enteros y medios puntos.
export function redondear2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

// §6.2 — valor de un nivel 1-4 según la escala. Es lo que aporta a la nota una
// dimensión sin matriz, corregida por selección directa de descriptor.
export function valorNivel(nivel, escala = "equilibrada") {
  const tabla = ESCALAS_NIVEL[escala];
  if (!tabla) throw new Error(`escala de calificación desconocida: "${escala}"`);
  const valor = tabla[nivel];
  if (valor === undefined) throw new Error(`nivel fuera de rango (1-4): ${nivel}`);
  return valor;
}

// §6.4 — traduce puntos (0-10) al nivel cuyo nombre ve el alumno. Por umbrales
// cerrados con >=, sin hueco entre bandas. El valor de entrada debe venir ya
// pasado por redondear2, para que un 9,00 almacenado como 8,99999... no caiga
// al lado equivocado del corte.
export function nivelDe(puntos) {
  if (puntos >= 9) return 4;
  if (puntos >= 7) return 3;
  if (puntos >= 5) return 2;
  return 1;
}

// §6.3 — puntos brutos de un criterio con matriz_cuantitativa: suma de las
// bandas elegidas por componente, más las penalizaciones aplicadas (negativas,
// así que se SUMAN), con suelo en 0. Nunca negativo, aunque todos los
// componentes estén en su banda de 0 y todas las penalizaciones a tope.
export function puntosDeMatriz(matriz, bandasElegidas, ocurrenciasPenalizacion = {}) {
  const sumaComponentes = matriz.componentes.reduce((suma, comp) => {
    const puntos = bandasElegidas[comp.nombre];
    if (puntos === undefined) {
      throw new Error(`falta la banda elegida para el componente "${comp.nombre}"`);
    }
    return suma + puntos;
  }, 0);

  const sumaPenalizaciones = (matriz.penalizaciones ?? []).reduce((suma, pen) => {
    const ocurrencias = ocurrenciasPenalizacion[pen.clave] ?? 0;
    if (!ocurrencias) return suma;
    // pen.puntos y pen.tope son negativos: Math.max se queda con el valor menos
    // negativo, que es el que respeta el tope en cuanto las ocurrencias lo superan.
    return suma + Math.max(ocurrencias * pen.puntos, pen.tope);
  }, 0);

  return Math.max(0, sumaComponentes + sumaPenalizaciones);
}

// §6.2-§6.3 — compone la nota final de un instrumento a partir de los
// resultados de sus criterios.
//
// entradas: array de
//   {
//     peso_base: number,
//     obligatorio: boolean,
//     resultado: { tipo: "nivel", nivel: 1|2|3|4 }
//              | { tipo: "matriz", bandasElegidas, ocurrenciasPenalizacion },
//     matrizCuantitativa: objeto matriz_cuantitativa del criterio
//                         (requerido si resultado.tipo === "matriz"),
//   }
// opciones: { escala, condicionMinimaActiva, detractorAcumulado }
export function calcularNota(entradas, opciones = {}) {
  const { escala = "equilibrada", condicionMinimaActiva = false, detractorAcumulado = 0 } = opciones;

  const conPeso = normalizarPesos(entradas);

  let algunObligatorioEnN1 = false;
  let notaCalculada = 0;

  for (const entrada of conPeso) {
    const { resultado, matrizCuantitativa, obligatorio, peso_normalizado } = entrada;
    let puntos;
    let nivel;

    if (resultado.tipo === "matriz") {
      if (!matrizCuantitativa) {
        throw new Error("falta matrizCuantitativa para un resultado de tipo \"matriz\"");
      }
      puntos = redondear2(
        puntosDeMatriz(matrizCuantitativa, resultado.bandasElegidas, resultado.ocurrenciasPenalizacion)
      );
      // El nivel de un criterio con matriz se calcula aparte, por §6.4, para
      // mostrarlo y para la condición mínima; no es lo que aporta a la nota.
      nivel = nivelDe(puntos);
    } else if (resultado.tipo === "nivel") {
      puntos = redondear2(valorNivel(resultado.nivel, escala));
      nivel = resultado.nivel;
    } else {
      throw new Error(`tipo de resultado de criterio desconocido: "${resultado.tipo}"`);
    }

    if (obligatorio && nivel === 1) algunObligatorioEnN1 = true;
    notaCalculada += (puntos * peso_normalizado) / 100;
  }

  // Redondeo a la nota final, una sola vez al terminar la suma ponderada
  // (§6.2): no en cada término, para no acumular error.
  notaCalculada = redondear2(notaCalculada);

  // §6.3 — el detractor forma parte de calcular la nota; se aplica antes que
  // la condición mínima, que es un límite sobre la nota ya calculada.
  const notaTrasDetractor = Math.max(0, notaCalculada - Math.min(detractorAcumulado, 2));

  const notaFinal =
    condicionMinimaActiva && algunObligatorioEnN1 ? Math.min(notaTrasDetractor, 4.9) : notaTrasDetractor;

  return { notaCalculada, notaTrasDetractor, notaFinal, algunObligatorioEnN1 };
}

// §6.5 — puntos y nivel de un criterio a partir de su ResultadoCriterio ya
// registrado. La usan tanto la pantalla de Calificar (elegir banda o nivel en
// vivo) como la ficha del alumno (mostrar un resultado ya guardado): es el
// mismo cálculo, no dos implementaciones que puedan desincronizarse.
export function puntosYNivelDe(criterio, resultado, escala) {
  if (resultado.tipo === "matriz") {
    const puntos = redondear2(
      puntosDeMatriz(criterio.matriz_cuantitativa, resultado.bandasElegidas, resultado.ocurrenciasPenalizacion)
    );
    return { puntos, nivel: nivelDe(puntos) };
  }
  return { puntos: redondear2(valorNivel(resultado.nivel, escala)), nivel: resultado.nivel };
}

// §6.5 — recompone el desglose por dimensión y la nota de un alumno ya
// guardado (`datos` es lo que persiste `js/calificar.js` en localStorage: ver
// su forma en `conectarEventosCalificacion`), contra los criterios activos
// del instrumento en su estado actual. Si el profesor reajustó pesos o
// dimensiones después de calificar, el desglose se recalcula con el
// instrumento de ahora — igual que ya hace "Cargar" en Calificar (§6.5): no
// se archiva un número congelado, se recalcula. Un criterio del alumno
// guardado que ya no esté en `criterios` (por ejemplo, si se desactivó en
// modo avanzado) se omite del desglose y de la nota, en vez de romper.
export function calcularResultadoGuardado(criterios, datos) {
  const filas = [];
  const entradas = [];

  for (const criterio of criterios) {
    const resultado = datos.resultadosPorCriterio[criterio.id];
    if (!resultado) continue;

    const { puntos, nivel } = puntosYNivelDe(criterio, resultado, datos.escala);
    const aporta = redondear2((puntos * criterio.peso_normalizado) / 100);
    filas.push({ criterio, puntos, nivel, aporta });
    entradas.push({
      peso_base: criterio.peso_normalizado,
      obligatorio: !!criterio.obligatorio,
      matrizCuantitativa: criterio.matriz_cuantitativa,
      resultado,
    });
  }

  const detractorAcumulado = datos.detractorAcumulado ?? 0;
  const { notaCalculada, notaTrasDetractor, notaFinal, algunObligatorioEnN1 } = calcularNota(entradas, {
    escala: datos.escala,
    condicionMinimaActiva: datos.condicionMinima,
    detractorAcumulado,
  });

  return {
    filas,
    notaCalculada,
    notaTrasDetractor,
    notaFinal,
    detractorAcumulado,
    disparada: !!datos.condicionMinima && algunObligatorioEnN1,
  };
}
