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
//
// `premarca` gobierna el paso 4 del motor (§9): "todas" marca cuanto
// sobreviva al filtro de profundidad, que es el comportamiento de siempre;
// "proceso" marca solo las dimensiones que el pack declara de proceso
// (`evalua_proceso`, §5.2). `instrumentoRecomendado` no es decorativo: es la
// pestaña con la que se abre la vista previa (js/ui.js).
export const PUERTA_APLICABILIDAD = {
  objetiva: {
    etiqueta: "Prueba objetiva (test, huecos, dictado, preguntas factuales)",
    generaRubrica: false,
    instrumentoRecomendado: null,
    premarca: "todas",
    explicacion:
      "Una prueba objetiva no tiene gradación de calidad, solo acierto o error. " +
      "No se genera rúbrica: lo que corresponde es una plantilla de corrección con puntuación directa.",
  },
  desarrollo_largo: {
    etiqueta: "Desarrollo largo, comentario de texto, EBAU",
    generaRubrica: true,
    instrumentoRecomendado: "escala_estimacion",
    premarca: "todas",
    explicacion:
      "Para desarrollo largo o pruebas tipo EBAU se recomienda la escala de estimación analítica " +
      "en lugar de la rúbrica completa: puntuación directa por apartado, sin elegir entre cuatro niveles.",
  },
  desempeno: {
    etiqueta: "Tarea de desempeño o proyecto",
    generaRubrica: true,
    instrumentoRecomendado: "rubrica_analitica",
    premarca: "todas",
    explicacion: "Terreno natural de la rúbrica analítica completa.",
  },
  proceso: {
    etiqueta: "Tarea diaria, borrador, ejercicio de proceso",
    generaRubrica: true,
    instrumentoRecomendado: "lista_cotejo",
    premarca: "todas",
    explicacion:
      "Se recomienda la lista de cotejo (o la rúbrica de un solo punto) y se desaconseja la rúbrica completa " +
      "para no sobrecargar una tarea de proceso.",
  },
  fase_texto: {
    etiqueta: "Fase de un texto (esquema, borrador, revisión, párrafo suelto)",
    generaRubrica: true,
    instrumentoRecomendado: "lista_cotejo",
    premarca: "proceso",
    explicacion:
      "Lo que se entrega es una fase del proceso de escritura, no el texto terminado: se premarcan solo " +
      "las dimensiones que el pack declara de proceso —planificación, borrador y revisión— y se abre la " +
      "lista de cotejo. Las demás siguen disponibles en «Ajustar», sin marcar: no se pueden observar en " +
      "un esquema porque el texto que evalúan todavía no está escrito.",
  },
};

export async function cargarPack(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar el pack: ${res.status}`);
  return res.json();
}

// Combina varios packs (uno por tipo de tarea) en el pack operativo que usa
// el resto del motor: concatena criterios y une el banco de verbos por id.
// Cada pack sigue validándose por separado (SDD §10); esto solo hace visible
// a la vez cada combinación curso × tipo de tarea que ya trae cada pack.
export function fusionarPacks(packs) {
  const verbosPorId = new Map();
  for (const p of packs) {
    for (const v of p.verbos) verbosPorId.set(v.id, v);
  }
  return {
    criterios: packs.flatMap((p) => p.criterios),
    verbos: [...verbosPorId.values()],
  };
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

// §9 paso 4 — premarcado de dimensiones. Devuelve las que arrancan marcadas,
// las que quedan disponibles sin marcar y el aviso que explica por qué, que
// es la parte que enseña: el profesor tiene que entender qué ha decidido la
// app por él y dónde encontrar lo demás (§3, §8).
//
// La puerta de "fase de un texto" premarca solo lo que el pack declara de
// proceso (`evalua_proceso`, §5.2). No cierra nada: las demás dimensiones
// siguen en la lista de "Ajustar", desmarcadas.
//
// Dos casos de borde, los dos con la misma regla de fondo — el premarcado
// nunca deja el instrumento vacío:
//
//  1. La dimensión de proceso existe pero el filtro de profundidad la ha
//     dejado fuera por prioridad. Se rescata: un instrumento de fase sin la
//     dimensión de proceso no evalúa la fase, y el filtro de tiempo mide el
//     coste de corregir un texto entero, que es justo lo que aquí no hay.
//  2. El tipo de tarea no declara ninguna dimensión de proceso —la exposición
//     oral, por ejemplo, se evalúa sobre el discurso realizado—. Entonces se
//     mantienen todas premarcadas y se explica por qué; la app propone y
//     explica, no impone (§8).
export function premarcarDimensiones(profundos, filtrados, puerta) {
  const conf = PUERTA_APLICABILIDAD[puerta];
  const todas = { premarcados: profundos, noPremarcados: [], avisoPremarcado: null };
  if (conf?.premarca !== "proceso") return todas;

  const desmarcar = (criterios) => criterios.map((c) => ({ ...c, desactivado: true, peso_normalizado: 0 }));

  const proceso = profundos.filter((c) => c.evalua_proceso);
  if (proceso.length > 0) {
    return {
      premarcados: proceso,
      noPremarcados: desmarcar(profundos.filter((c) => !c.evalua_proceso)),
      avisoPremarcado:
        `Se ha premarcado solo lo que se puede observar en una fase del texto: ` +
        `${proceso.map((c) => `"${c.nombre}"`).join(", ")}. ` +
        "El resto de dimensiones sigue disponible sin marcar en «Ajustar».",
    };
  }

  const rescatados = filtrados.filter((c) => c.evalua_proceso);
  if (rescatados.length > 0) {
    return {
      premarcados: rescatados,
      noPremarcados: desmarcar(profundos),
      avisoPremarcado:
        `El tiempo de corrección declarado dejaba fuera ${rescatados.map((c) => `"${c.nombre}"`).join(", ")}, ` +
        "que es la dimensión de proceso de este curso. Se mantiene premarcada: sin ella no se evalúa la " +
        "fase, y el filtro de tiempo mide el coste de corregir un texto entero, que aquí no lo hay.",
    };
  }

  return {
    ...todas,
    avisoPremarcado:
      "Este tipo de tarea no tiene ninguna dimensión de proceso en el pack: sus criterios evalúan la " +
      "producción realizada, no una fase previa. Se mantienen premarcadas todas las dimensiones; si vas a " +
      "evaluar un guion o un ensayo previo, desmarca en «Ajustar» lo que todavía no se puede observar.",
  };
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

// §7.4 — rúbrica de un solo punto: solo la columna central con el descriptor
// de N2 ("conseguido"); las columnas de evidencias de mejora y de excelencia
// van en blanco, para que el profesor anote a mano. Se usa descriptor_un_punto
// si está relleno, y si no el propio N2 (misma regla que descriptor_cotejo,
// §5.2). Marco Teórico §10 reserva este instrumento a tareas de proceso y lo
// limita a 1-2 dimensiones: por encima de eso deja de ser "un punto" y hay que
// usar la rúbrica analítica. Se toman las de mayor prioridad, como en la lista
// de cotejo.
const MAX_DIMENSIONES_UN_PUNTO = 2;

export function generarRubricaUnPunto(criterios, meta) {
  const dimensiones = porPrioridad(criterios)
    .slice(0, MAX_DIMENSIONES_UN_PUNTO)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      bloque: c.bloque_lomloe,
      obligatorio: c.obligatorio,
      descriptor: c.descriptor_un_punto ?? c.descriptores.n2.texto,
    }));
  return {
    actividad: meta.actividad,
    curso: meta.curso,
    tipoTarea: meta.tipoTarea,
    dimensiones,
    truncado: criterios.length > MAX_DIMENSIONES_UN_PUNTO,
  };
}

// §7.7 — escala de estimación analítica: puntuación directa por apartado, sin
// elegir entre los cuatro niveles cualitativos, más el bloque de detractores
// globales de §6.3 (ortografía y presentación, transversales a todo el texto,
// con tope de 2 puntos sobre 10 — §17.3, pendiente de contrastar con el
// departamento). Pensada para desarrollo largo y pruebas tipo EBAU (Marco
// Teórico §5), donde puntuar de un vistazo pesa más que graduar cuatro
// niveles. El detractor es un mecanismo del modelo de calificación (§6.2-§6.4),
// no contenido curricular del pack, así que vive aquí como constante y no en
// el JSON: no necesita `criterio_oficial` porque no es un criterio de
// evaluación, es una convención de corrección transversal a cualquier texto.
export const DETRACTOR_ESTIMACION = {
  concepto: "Ortografía y presentación",
  tope: 2,
};

export function generarEscalaEstimacion(criterios, meta) {
  return {
    actividad: meta.actividad,
    curso: meta.curso,
    tipoTarea: meta.tipoTarea,
    apartados: porPrioridad(criterios).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      bloque: c.bloque_lomloe,
      obligatorio: c.obligatorio,
      criterioOficial: `${c.criterio_oficial.codigo} — «${c.criterio_oficial.cita}»`,
      maxPuntos: Math.round((c.peso_normalizado / 10) * 100) / 100,
    })),
    detractor: DETRACTOR_ESTIMACION,
  };
}

// Sustituciones de un caso: no encajan en "reemplaza el verbo del banco que
// aparezca" porque cambian algo más que el verbo, o porque el verbo no está
// en tiempo presente. "Se dirige" cambia también el pronombre (se -> me);
// "los encontró" está en pretérito, fuera del par 3.ª/1.ª que guarda el
// banco (§5.3). Las dos son casos reales del pack, no hipótesis.
// Sin \b de cierre: \b exige un carácter \w a un lado de la frontera y "ó"
// no cuenta como \w para el motor de expresiones regulares de JS, así que
// "encontró." nunca casaría con \bencontró\b. Son frases literales y
// específicas, no un patrón general, así que el riesgo de casar una
// palabra más larga por accidente es nulo en este pack.
const SUSTITUCIONES_ESPECIALES = [
  { patron: /se dirige/g, reemplazo: "me dirijo" },
  { patron: /los encontró/g, reemplazo: "los encontré" },
];

function minuscula(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// Muchos descriptores son una frase compuesta con un segundo verbo, también
// en 3.ª persona, que no es el que el criterio declara como inicial (p. ej.
// "Ajusta el texto ... y se dirige al destinatario"). Si solo se reconjuga
// el primero, la autoevaluación mezcla "yo" y "él" en la misma frase.
//
// No todo verbo del banco que aparece después del inicial es del alumno:
// "una introducción QUE delimita el tema" habla de la introducción, no de
// quien escribe, y reconjugarlo produce "que delimito", que dice otra cosa.
// La señal para distinguirlo, comprobada contra los cuarenta y ocho
// descriptores del pack, es "que": el único caso de sujeto distinto de este
// pack es justo esa relativa, y en ningún otro sitio "que" precede a un
// verbo del banco con el alumno como sujeto. Por eso se excluye ese caso en
// vez de intentar distinguir sujetos en general, que exigiría analizar la
// frase de verdad.
function reconjugarSecundarios(texto, verbosPorId) {
  let resultado = texto;
  for (const { patron, reemplazo } of SUSTITUCIONES_ESPECIALES) {
    resultado = resultado.replace(patron, reemplazo);
  }
  for (const verbo of Object.values(verbosPorId)) {
    const patron = new RegExp(`(?<!\\bque )\\b${verbo["3s"]}\\b`, "gi");
    resultado = resultado.replace(patron, (coincidencia) =>
      coincidencia[0] === coincidencia[0].toUpperCase() ? verbo["1s"] : minuscula(verbo["1s"])
    );
  }
  return resultado;
}

// §7.5-§7.6 — proyección a primera persona. Sustituye la palabra inicial (el
// verbo en 3.ª persona) por su forma en 1.ª del banco de verbos (§5.3):
// "Utiliza expresiones..." -> "Utilizo expresiones...". Conserva cualquier
// signo pegado al verbo (p. ej. la coma de "Explica, ...") y comprueba que el
// descriptor empieza de verdad por el verbo que declara, porque una
// autoevaluación mal conjugada es peor que ninguna. Después repasa el resto
// de la frase por si hay un segundo verbo que reconjugar (§ reconjugarSecundarios).
export function primeraPersona(texto, verboId, verbosPorId) {
  const verbo = verbosPorId[verboId];
  if (!verbo) throw new Error(`verbo desconocido en el banco: "${verboId}"`);

  const m = texto.match(/^(\p{L}+)([^\s]*)(\s[\s\S]*)?$/u);
  if (!m) throw new Error(`no se pudo aislar el verbo inicial de: "${texto}"`);
  const [, palabraInicial, cola, resto] = m;
  if (palabraInicial !== verbo["3s"]) {
    throw new Error(
      `el descriptor no empieza por el verbo que declara: esperaba "${verbo["3s"]}", encontré "${palabraInicial}" en "${texto}"`
    );
  }

  const proyectado = `${verbo["1s"]}${cola}${resto ?? ""}`;
  return reconjugarSecundarios(proyectado, verbosPorId);
}

// §7.5 — autoevaluación: la misma matriz de la rúbrica analítica, con los
// cuatro niveles conjugados en 1.ª persona. §7.6 (coevaluación) reutiliza
// esta misma proyección; lo que cambia entre ambas es solo la interfaz (la
// coevaluación añade la referencia al compañero y el comentario obligatorio),
// no el contenido.
export function generarAutoevaluacion(criterios, verbosPack, meta) {
  const verbosPorId = Object.fromEntries(verbosPack.map((v) => [v.id, v]));
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
      niveles: [1, 2, 3, 4].map((n) => {
        const d = c.descriptores[`n${n}`];
        return primeraPersona(d.texto, d.verbo, verbosPorId);
      }),
    })),
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
  const { curso, tipoTarea, tiempoCorreccion, actividad, esProductoFinal, puerta } = config;

  const filtrados = filtrarCriterios(pack, { curso, tipoTarea });
  if (filtrados.length === 0) {
    return {
      ok: false,
      motivo: `No hay criterios de "${tipoTarea}" para ${curso} en este pack todavía.`,
    };
  }

  const profundos = aplicarProfundidad(filtrados, tiempoCorreccion);
  const { premarcados, noPremarcados, avisoPremarcado } = premarcarDimensiones(profundos, filtrados, puerta);
  const ponderados = normalizarPesos(premarcados);
  const avisosProgresion = comprobarProgresion(ponderados);
  const complejidad = calcularComplejidad(ponderados, esProductoFinal);

  const meta = { actividad, curso, tipoTarea };

  return {
    ok: true,
    criterios: ponderados,
    noPremarcados,
    avisoPremarcado,
    avisosProgresion,
    complejidad,
    rubricaAnalitica: generarRubricaAnalitica(ponderados, meta),
    listaCotejo: generarListaCotejo(ponderados),
    fichaAlumno: generarFichaAlumno(ponderados, meta),
    rubricaUnPunto: generarRubricaUnPunto(ponderados, meta),
    autoevaluacion: generarAutoevaluacion(ponderados, pack.verbos, meta),
    escalaEstimacion: generarEscalaEstimacion(ponderados, meta),
  };
}
