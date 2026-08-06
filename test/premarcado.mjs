// Premarcado de dimensiones — SDD §8 (puerta de aplicabilidad) y §9 paso 4.
//
// La puerta de "fase de un texto" es la única que no premarca todo lo que
// sobrevive al filtro de profundidad: marca solo las dimensiones que el pack
// declara de proceso. Estas pruebas fijan las tres situaciones en que eso
// puede salir mal —que no haya dimensión de proceso, que el filtro de tiempo
// se la lleve por delante, y que el premarcado deje el instrumento vacío— y
// el invariante que las une: el premarcado nunca vacía el instrumento.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generarInstrumentos, PUERTA_APLICABILIDAD } from "../js/motor.js";

function cargar(nombre) {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../data/${nombre}`, import.meta.url)), "utf8"));
}

const expositivo = cargar("pack-lcl-expositivo.json");
const oral = cargar("pack-lcl-oral.json");

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

// --- resumen ---------------------------------------------------------------
console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
