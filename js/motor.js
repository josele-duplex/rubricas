// Motor de generación — SDD §9.
// Toma un pack de criterios y una configuración del profesor y produce los
// instrumentos de evaluación. No redacta contenido: solo filtra, pondera y compone
// lo que ya está en el pack.

import { comprobarSostenibilidad, UMBRAL_DIMENSIONES } from "./validador.js";

export const TIEMPOS_CORRECCION = {
  menos2: { etiqueta: "Menos de 2 min por alumno", prioridades: [1] },
  "2a5": { etiqueta: "De 2 a 5 min por alumno", prioridades: [1, 2] },
  mas5: { etiqueta: "Más de 5 min por alumno", prioridades: [1, 2, 3] },
};

// SDD §8 — puerta de aplicabilidad. La app decide si la rúbrica es el
// instrumento adecuado antes de generar nada.
export const PUERTA_APLICABILIDAD = {
  objetiva: {
    etiqueta: "Prueba objetiva (test, huecos, dictado, preguntas factuales)",
    generaRubrica: false,
    instrumentoRecomendado: null,
    explicacion:
      "Una prueba objetiva no tiene gradación de calidad, solo acierto o error. " +
      "No se genera rúbrica: lo que corresponde es una plantilla de corrección con puntuación directa.",
  },
  desarrollo_largo: {
    etiqueta: "Desarrollo largo, comentario de texto, EBAU",
    generaRubrica: true,
    instrumentoRecomendado: "escala_estimacion",
    explicacion:
      "Para desarrollo largo o pruebas tipo EBAU se recomienda la escala de estimación analítica " +
      "en lugar de la rúbrica completa. Ese instrumento aún no está disponible en este prototipo; " +
      "se genera la rúbrica analítica como alternativa más cercana.",
  },
  desempeno: {
    etiqueta: "Tarea de desempeño o proyecto",
    generaRubrica: true,
    instrumentoRecomendado: "rubrica_analitica",
    explicacion: "Terreno natural de la rúbrica analítica completa.",
  },
  proceso: {
    etiqueta: "Tarea diaria, borrador, ejercicio de proceso",
    generaRubrica: true,
    instrumentoRecomendado: "lista_cotejo",
    explicacion:
      "Se recomienda la lista de cotejo (o la rúbrica de un solo punto) y se desaconseja la rúbrica completa " +
      "para no sobrecargar una tarea de proceso.",
  },
};

export async function cargarPack(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar el pack: ${res.status}`);
  return res.json();
}

// hereda_de: el criterio del curso superior parte del inferior y solo
// sobrescribe lo que cambia. criterio_oficial nunca se hereda (§5.2).
export function resolverCriterio(criterio, porId) {
  if (!criterio.hereda_de) return criterio;
  const base = resolverCriterio(porId[criterio.hereda_de], porId);
  return {
    ...base,
    ...criterio,
    descriptores: { ...base.descriptores, ...criterio.descriptores },
    criterio_oficial: criterio.criterio_oficial,
  };
}

export function tiposTareaDisponibles(pack) {
  return [...new Set(pack.criterios.flatMap((c) => c.tipos_tarea))];
}

export function cursosDisponibles(pack, tipoTarea) {
  return [
    ...new Set(
      pack.criterios
        .filter((c) => c.tipos_tarea.includes(tipoTarea))
        .map((c) => c.curso)
    ),
  ];
}

// Motor §9 pasos 3-6.
export function filtrarCriterios(pack, { curso, tipoTarea }) {
  const porId = Object.fromEntries(pack.criterios.map((c) => [c.id, c]));
  return pack.criterios
    .filter((c) => c.curso === curso && c.tipos_tarea.includes(tipoTarea))
    .map((c) => resolverCriterio(c, porId));
}

export function aplicarProfundidad(criterios, tiempoCorreccion) {
  const conf = TIEMPOS_CORRECCION[tiempoCorreccion];
  if (!conf) throw new Error(`Tiempo de corrección desconocido: ${tiempoCorreccion}`);
  return criterios.filter((c) => conf.prioridades.includes(c.prioridad));
}

// Normaliza peso_base a 100 entre los criterios que sobreviven al filtro de
// profundidad. Ajusta el redondeo sobre la dimensión de mayor peso para que
// el total cuadre exactamente en 100.0.
export function normalizarPesos(criterios) {
  const total = criterios.reduce((s, c) => s + c.peso_base, 0);
  if (total === 0) return criterios.map((c) => ({ ...c, peso_normalizado: 0 }));

  const conPeso = criterios.map((c) => ({
    ...c,
    peso_normalizado: Math.round((c.peso_base / total) * 1000) / 10,
  }));

  const suma = conPeso.reduce((s, c) => s + c.peso_normalizado, 0);
  const resto = Math.round((100 - suma) * 10) / 10;
  if (resto !== 0 && conPeso.length > 0) {
    const mayor = conPeso.reduce((a, b) => (b.peso_normalizado > a.peso_normalizado ? b : a));
    mayor.peso_normalizado = Math.round((mayor.peso_normalizado + resto) * 10) / 10;
  }
  return conPeso;
}

// §9 paso 7 — avisa si el mismo instrumento mezcla criterios con más de un
// nivel de diferencia en el mismo eje de progresión (§5.4).
export function comprobarProgresion(criterios) {
  const ejes = ["autonomia", "complejidad", "metalinguistico"];
  const avisos = [];
  for (const eje of ejes) {
    const valores = criterios.map((c) => c.progresion?.[eje]).filter((v) => v != null);
    if (valores.length < 2) continue;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    if (max - min > 1) {
      avisos.push(
        `El eje "${eje}" mezcla criterios con ${max - min} niveles de diferencia (de ${min} a ${max} sobre 4). ` +
          "Revisa si la combinación de dimensiones tiene sentido pedagógico en este curso."
      );
    }
  }
  return avisos;
}

// §9 paso 8 — indicador de complejidad. El umbral y el texto del aviso de
// sostenibilidad viven una sola vez en validador.js (regla del §10); aquí
// solo se compone el indicador visual (SDD, especificación del validador de
// la app, §3.7). validador.js no puede importar este módulo (dependencia
// circular), así que la dirección de importación va siempre en este sentido.
export function calcularComplejidad(criterios, esProductoFinal) {
  const nDimensiones = criterios.length;
  const nBloques = new Set(criterios.map((c) => c.bloque_lomloe)).size;
  let nivel = "verde";
  if (nDimensiones > UMBRAL_DIMENSIONES) nivel = "rojo";
  else if (nDimensiones >= 4) nivel = "amarillo";
  const aviso = comprobarSostenibilidad(criterios, esProductoFinal);
  return { nivel, nDimensiones, nBloques, aviso };
}

function porPrioridad(criterios) {
  return [...criterios].sort((a, b) => a.prioridad - b.prioridad);
}

// §7.1 — rúbrica analítica.
export function generarRubricaAnalitica(criterios, meta) {
  return {
    actividad: meta.actividad,
    curso: meta.curso,
    tipoTarea: meta.tipoTarea,
    dimensiones: porPrioridad(criterios).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      bloque: c.bloque_lomloe,
      peso: c.peso_normalizado,
      obligatorio: c.obligatorio,
      criterioOficial: `${c.criterio_oficial.codigo} — «${c.criterio_oficial.cita}»`,
      niveles: [1, 2, 3, 4].map((n) => c.descriptores[`n${n}`].texto),
    })),
  };
}

// §7.2 — lista de cotejo, derivada del descriptor de N2. Se usa
// descriptor_cotejo si está relleno; si no, el propio N2 ya es una
// afirmación verificable. Máximo 8 ítems, priorizando prioridad 1 y 2.
export function generarListaCotejo(criterios) {
  const items = porPrioridad(criterios)
    .slice(0, 8)
    .map((c) => ({
      dimension: c.nombre,
      item: c.descriptor_cotejo ?? c.descriptores.n2.texto,
    }));
  return {
    items,
    truncado: criterios.length > 8,
  };
}

// §7.3 — ficha del alumno y guion de clase. Obligatoria, siempre se genera.
export function generarFichaAlumno(criterios, meta) {
  const ordenadas = porPrioridad(criterios);
  return {
    actividad: meta.actividad,
    curso: meta.curso,
    tipoTarea: meta.tipoTarea,
    queSeValora: ordenadas.map((c) => ({ nombre: c.nombre, peso: c.peso_normalizado })),
    comoLlegarAExcelente: ordenadas.map((c) => ({ nombre: c.nombre, texto: c.descriptores.n4.texto })),
    calculo: {
      modo: "cualitativo",
      texto:
        "No se calcula una nota numérica: se valora el nivel alcanzado en cada dimensión mediante su descriptor.",
    },
  };
}

// Orquesta el pipeline completo del motor (§9, pasos 3-10, sin validador ni exportación).
export function generarInstrumentos(pack, config) {
  const { curso, tipoTarea, tiempoCorreccion, actividad, esProductoFinal } = config;

  const filtrados = filtrarCriterios(pack, { curso, tipoTarea });
  if (filtrados.length === 0) {
    return {
      ok: false,
      motivo: `No hay criterios de "${tipoTarea}" para ${curso} en este pack todavía.`,
    };
  }

  const profundos = aplicarProfundidad(filtrados, tiempoCorreccion);
  const ponderados = normalizarPesos(profundos);
  const avisosProgresion = comprobarProgresion(ponderados);
  const complejidad = calcularComplejidad(ponderados, esProductoFinal);

  const meta = { actividad, curso, tipoTarea };

  return {
    ok: true,
    criterios: ponderados,
    avisosProgresion,
    complejidad,
    rubricaAnalitica: generarRubricaAnalitica(ponderados, meta),
    listaCotejo: generarListaCotejo(ponderados),
    fichaAlumno: generarFichaAlumno(ponderados, meta),
  };
}
