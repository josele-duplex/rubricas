// Premarcado de dimensiones y puerta de aplicabilidad — SDD §8 y §9 paso 4.
//
// La puerta de "fase de un texto" es la única que no premarca todo lo que
// sobrevive al filtro de profundidad: marca solo las dimensiones que el pack
// declara de proceso. Estas pruebas fijan las tres situaciones en que eso
// puede salir mal —que no haya dimensión de proceso, que el filtro de tiempo
// se la lleve por delante, y que el premarcado deje el instrumento vacío— y
// el invariante que las une: el premarcado nunca vacía el instrumento.
//
// La segunda mitad del archivo (§6 en adelante) prueba la aplicabilidad de una
// fila de la matriz §4.3 sobre el pack de reacción a una noticia: qué cursos
// abre, cuáles rechaza y por qué.

import { generarInstrumentos, cursosDisponibles, PUERTA_APLICABILIDAD } from "../js/motor.js";
import { UMBRAL_DIMENSIONES } from "../js/validador.js";
import { cargarPack as cargar, CATALOGO } from "./cargar.mjs";

const expositivo = cargar("pack-lcl-expositivo.json");
const oral = cargar("pack-lcl-oral.json");
const reaccion = cargar("pack-lcl-reaccion.json");

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

function generar(pack, extra) {
  return generarInstrumentos(pack, {
    curso: "3ESO",
    tipoTarea: "expositivo",
    tiempoCorreccion: "mas5",
    actividad: "Borrador de un texto expositivo sobre el reciclaje",
    esProductoFinal: false,
    ...extra,
  });
}

// --- 1. la puerta nueva existe y recomienda la lista de cotejo -------------
caso("fase_texto: la puerta declara premarcado de proceso y lista de cotejo", () => {
  const p = PUERTA_APLICABILIDAD.fase_texto;
  assert(p !== undefined, "no existe la opción fase_texto en la puerta de aplicabilidad");
  assert(p.generaRubrica === true, "la fase de un texto sí genera instrumento");
  assert(p.premarca === "proceso", "la fase de un texto premarca solo las dimensiones de proceso");
  assert(p.instrumentoRecomendado === "lista_cotejo", "el instrumento por defecto es la lista de cotejo");
});

// --- 2. premarcado efectivo ------------------------------------------------
caso("fase_texto: premarca solo la dimensión de proceso y deja el resto disponible", () => {
  const r = generar(expositivo, { puerta: "fase_texto" });
  assert(r.ok, `no se generó el instrumento: ${r.motivo}`);
  assert(
    r.criterios.every((c) => c.evalua_proceso === true),
    `se premarcó algo que no es de proceso: ${r.criterios.map((c) => c.id).join(", ")}`
  );
  assert(r.criterios.length > 0, "el premarcado dejó el instrumento vacío");
  assert(r.noPremarcados.length > 0, "las dimensiones no premarcadas deben seguir disponibles");
  assert(
    r.noPremarcados.every((c) => c.desactivado === true && c.peso_normalizado === 0),
    "una dimensión no premarcada llega marcada o con peso"
  );
  assert(r.avisoPremarcado?.includes("Ajustar"), "el aviso debe decir dónde está el resto de dimensiones");
});

caso("fase_texto: los pesos se normalizan sobre lo premarcado, no sobre todo", () => {
  const r = generar(expositivo, { puerta: "fase_texto" });
  const suma = r.criterios.reduce((s, c) => s + c.peso_normalizado, 0);
  assert(Math.abs(suma - 100) < 0.05, `los pesos premarcados suman ${suma}, no 100`);
});

caso("fase_texto: la lista de cotejo sale del N2 de la dimensión de proceso", () => {
  const r = generar(expositivo, { puerta: "fase_texto" });
  assert(r.listaCotejo.items.length === r.criterios.length, "la lista de cotejo no coincide con lo premarcado");
  const proceso = r.criterios[0];
  assert(
    r.listaCotejo.items[0].item === (proceso.descriptor_cotejo ?? proceso.descriptores.n2.texto),
    "el ítem de cotejo no es el descriptor de N2 de la dimensión premarcada"
  );
});

// --- 3. el filtro de tiempo no puede llevarse la dimensión de proceso -------
caso("fase_texto: rescata la dimensión de proceso que el filtro de tiempo dejaba fuera", () => {
  const r = generar(expositivo, { puerta: "fase_texto", tiempoCorreccion: "menos2" });
  assert(r.ok, `no se generó el instrumento: ${r.motivo}`);
  assert(
    r.criterios.every((c) => c.evalua_proceso === true) && r.criterios.length > 0,
    "la dimensión de proceso es de prioridad 2 y el filtro de tiempo la ha perdido"
  );
  assert(r.avisoPremarcado?.includes("tiempo de corrección"), "el rescate debe explicarse al profesor");
});

// --- 4. tarea sin ninguna dimensión de proceso -----------------------------
caso("fase_texto: sin dimensiones de proceso mantiene todas premarcadas y lo explica", () => {
  const r = generarInstrumentos(oral, {
    curso: "3ESO",
    tipoTarea: "oral",
    tiempoCorreccion: "mas5",
    actividad: "Guion de una exposición oral",
    esProductoFinal: false,
    puerta: "fase_texto",
  });
  assert(r.ok, `no se generó el instrumento: ${r.motivo}`);
  assert(r.criterios.length > 0, "el instrumento no puede quedarse vacío");
  assert(r.noPremarcados.length === 0, "sin dimensión de proceso no se desmarca nada");
  assert(
    r.avisoPremarcado?.includes("ninguna dimensión de proceso"),
    "el profesor tiene que saber por qué no ha cambiado el premarcado"
  );
});

// --- 5. las demás puertas siguen igual --------------------------------------
caso("desempeno: el premarcado de siempre no cambia", () => {
  const conPuerta = generar(expositivo, { puerta: "desempeno", esProductoFinal: true });
  const sinPuerta = generar(expositivo, { esProductoFinal: true });
  assert(conPuerta.noPremarcados.length === 0, "la puerta de desempeño no desmarca nada");
  assert(conPuerta.avisoPremarcado === null, "la puerta de desempeño no tiene nada que explicar");
  assert(
    conPuerta.criterios.map((c) => c.id).join() === sinPuerta.criterios.map((c) => c.id).join(),
    "el motor sin puerta declarada debe comportarse como el premarcado de siempre"
  );
});

// === Fila «reacción a una noticia» de la matriz §4.3 =======================
// Casos dorados de la celda: dónde existe la tarea, dónde el currículo no la
// sostiene, y qué sobrevive a cada filtro.

function generarReaccion(extra) {
  return generarInstrumentos(reaccion, {
    tipoTarea: "reaccion",
    tiempoCorreccion: "mas5",
    puerta: "desempeno",
    actividad: "Reacción a una noticia sobre el transporte escolar",
    esProductoFinal: false,
    ...extra,
  });
}

function dimensiones(r) {
  return r.criterios.map((c) => c.dimension);
}

// --- 6. la fila existe donde la matriz §4.3 la sostiene, y solo ahí ---------
caso("reaccion: los cursos disponibles son los cuatro de la matriz §4.3, en el orden del catálogo", () => {
  const cursos = cursosDisponibles(reaccion, "reaccion");
  assert(
    cursos.join() === ["2ESO", "4ESO", "1BACH", "2BACH"].join(),
    `cursos inesperados para la reacción: ${cursos.join(", ")}`
  );
  const orden = CATALOGO.cursos.orden;
  assert(
    cursos.every((c, i) => i === 0 || orden.indexOf(cursos[i - 1]) < orden.indexOf(c)),
    "los cursos no salen en el orden de cursos.orden del catálogo"
  );
});

// --- 7. celda vacía: 1.º y 3.º de ESO se rechazan ---------------------------
// No es que el pack esté incompleto: en 1.º y 3.º de ESO la competencia
// específica 4 solo tiene criterio de COMPRENSIÓN (el 4.1 que ya usa el
// resumen) y ninguno de VALORACIÓN. Los saberes de esos cursos sí nombran el
// objeto de la tarea, así que es un caso de «saber sí, criterio no», y un saber
// no abre una celda (CLAUDE.md, regla 9). Si alguien «arregla» este caso
// añadiendo criterios de reacción a 1.º ESO, ha reintroducido el único error de
// derivación que ha llegado al docente.
for (const curso of ["1ESO", "3ESO"]) {
  caso(`reaccion: ${curso} no tiene celda y el motor lo dice, no la inventa`, () => {
    const r = generarReaccion({ curso });
    assert(r.ok === false, `${curso} no debería generar instrumento`);
    assert(
      r.motivo === `No hay criterios de "reaccion" para ${curso} en este pack todavía.`,
      `motivo inesperado: ${r.motivo}`
    );
  });
}

// --- 8. asimetría de dimensiones entre cursos: pares 5, impares 4 -----------
// La ausencia de `valoracion_canal` en 4.º ESO y 2.º Bach no es un olvido: el
// criterio oficial de esos dos cursos no nombra el canal —se queda en «su
// calidad y fiabilidad»— mientras que el de 2.º ESO y 1.º Bach habla de «la
// idoneidad del canal utilizado». Es la misma asimetría que sostiene la regla
// `dimension_sin_respaldo` del validador.
const DIMENSIONES_CON_CANAL = [
  "valoracion_contenido", "valoracion_canal", "valoracion_forma",
  "redaccion_reaccion", "correccion_lexico",
];
const DIMENSIONES_SIN_CANAL = [
  "valoracion_contenido", "valoracion_forma", "redaccion_reaccion", "correccion_lexico",
];

for (const [curso, esperadas] of [
  ["2ESO", DIMENSIONES_CON_CANAL],
  ["4ESO", DIMENSIONES_SIN_CANAL],
  ["1BACH", DIMENSIONES_CON_CANAL],
  ["2BACH", DIMENSIONES_SIN_CANAL],
]) {
  caso(`reaccion: ${curso} genera ${esperadas.length} dimensiones, en su orden`, () => {
    const r = generarReaccion({ curso });
    assert(r.ok, `no se generó el instrumento: ${r.motivo}`);
    assert(
      dimensiones(r).join() === esperadas.join(),
      `dimensiones inesperadas en ${curso}: ${dimensiones(r).join(", ")}`
    );
  });
}

for (const curso of ["4ESO", "2BACH"]) {
  caso(`reaccion: ${curso} no evalúa el canal porque su criterio no lo nombra`, () => {
    const r = generarReaccion({ curso });
    assert(
      !r.criterios.some((c) => c.dimension === "valoracion_canal"),
      `${curso} no puede evaluar el canal: su criterio oficial no lo nombra`
    );
  });
}

// --- 9. filtro de tiempo de corrección ---------------------------------------
caso("reaccion: con menos de 2 minutos sobreviven las dos dimensiones de prioridad 1", () => {
  for (const curso of ["2ESO", "4ESO"]) {
    const r = generarReaccion({ curso, tiempoCorreccion: "menos2" });
    assert(r.ok, `no se generó el instrumento de ${curso}: ${r.motivo}`);
    assert(
      dimensiones(r).join() === ["valoracion_contenido", "valoracion_forma"].join(),
      `en ${curso} el filtro de tiempo deja ${dimensiones(r).join(", ")}`
    );
  }
});

// --- 10. puerta fase_texto sobre un pack sin ninguna dimensión de proceso ----
// Ningún criterio de este pack declara `evalua_proceso`, y es deliberado: las
// cinco dimensiones evalúan el texto entregado, no una fase de su elaboración,
// y `proceso_sin_respaldo` impide declararlo sin que la cita lo sostenga. Es el
// primer pack de la casa que recorre esa rama, así que hasta ahora estaba sin
// probar con la fila entera.
caso("reaccion: fase_texto no vacía el instrumento en un pack sin dimensiones de proceso", () => {
  assert(
    !reaccion.criterios.some((c) => c.evalua_proceso),
    "fixture inválida: el pack de reacción no debería declarar ninguna dimensión de proceso"
  );
  const r = generarReaccion({ curso: "2ESO", puerta: "fase_texto" });
  assert(r.ok, `no se generó el instrumento: ${r.motivo}`);
  assert(r.criterios.length === 5, `el premarcado dejó ${r.criterios.length} dimensiones, no 5`);
  assert(r.noPremarcados.length === 0, "sin dimensión de proceso no se desmarca nada");
  assert(
    r.avisoPremarcado?.includes("ninguna dimensión de proceso"),
    "el profesor tiene que saber por qué no ha cambiado el premarcado"
  );
});

// --- 11. sostenibilidad en el límite exacto ---------------------------------
// 2.º ESO y 1.º Bach tienen 5 dimensiones, que es exactamente el umbral. La
// regla avisa por ENCIMA de 5: un `>` que se convirtiera en `>=` rompería esto
// sin que nada más se enterase.
caso("reaccion: 5 dimensiones es el umbral exacto y no dispara el aviso de sostenibilidad", () => {
  assert(UMBRAL_DIMENSIONES === 5, `el umbral de dimensiones sostenibles ya no es 5: ${UMBRAL_DIMENSIONES}`);
  for (const curso of ["2ESO", "4ESO", "1BACH", "2BACH"]) {
    const r = generarReaccion({ curso });
    assert(r.criterios.length <= UMBRAL_DIMENSIONES, `${curso} pasa del umbral: ${r.criterios.length}`);
    assert(
      r.complejidad.aviso === null,
      `${curso} avisa de sostenibilidad con ${r.criterios.length} dimensiones y el umbral es ${UMBRAL_DIMENSIONES}`
    );
  }
});

// --- resumen ---------------------------------------------------------------
console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
