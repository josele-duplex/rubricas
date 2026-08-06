// Casos dorados de la proyección a primera persona (SDD §7.5-§7.6): la
// autoevaluación y la coevaluación no llevan contenido propio, son la misma
// matriz con el verbo inicial re-conjugado desde el banco (§5.3). Cubre el
// caso normal, los dos descriptores reales del pack cuyo verbo lleva una
// coma pegada ("Explica,", "Contrasta,") -que destaparon que la sustitución
// no puede ser un simple split por espacio-, y el hallazgo más serio: varios
// descriptores son frases compuestas con un segundo verbo también en 3.ª
// persona ("Ajusta el texto ... y se dirige al destinatario") que, si no se
// reconjuga también, deja una autoevaluación mezclando "yo" y "él" en la
// misma frase. Se descubrió generando la pestaña de verdad en el navegador,
// no leyendo el código (CLAUDE.md, método de trabajo).

import { readFileSync } from "node:fs";
import { primeraPersona, generarAutoevaluacion } from "../js/motor.js";

function cargar(nombre) {
  return JSON.parse(readFileSync(new URL(`../data/${nombre}`, import.meta.url), "utf8"));
}

const pack = cargar("pack-lcl-expositivo.json");
const verbosPorId = Object.fromEntries(pack.verbos.map((v) => [v.id, v]));

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

function assertIgual(actual, esperado, mensaje) {
  if (actual !== esperado) throw new Error(`${mensaje} (esperado "${esperado}", obtenido "${actual}")`);
}

// --- primeraPersona -----------------------------------------------------
caso("primeraPersona: sustituye el verbo inicial, deja el resto intacto", () => {
  const resultado = primeraPersona(
    "Utiliza expresiones propias de la conversación diaria.",
    "utiliza",
    verbosPorId
  );
  assertIgual(resultado, "Utilizo expresiones propias de la conversación diaria.", "sustitución simple");
});

caso("primeraPersona: conserva la coma pegada al verbo", () => {
  const resultado = primeraPersona("Explica, con sus propias palabras, el tema.", "explica", verbosPorId);
  assertIgual(resultado, "Explico, con sus propias palabras, el tema.", "coma pegada al verbo");
});

caso("primeraPersona: verbo desconocido en el banco lanza error", () => {
  let lanzo = false;
  try {
    primeraPersona("Inventa algo.", "inventa", verbosPorId);
  } catch {
    lanzo = true;
  }
  if (!lanzo) throw new Error("debía lanzar al no encontrar el verbo en el banco");
});

caso("primeraPersona: descriptor que no empieza por el verbo declarado lanza error", () => {
  let lanzo = false;
  try {
    primeraPersona("Redacta el texto.", "utiliza", verbosPorId);
  } catch {
    lanzo = true;
  }
  if (!lanzo) throw new Error("debía lanzar al no coincidir el verbo inicial con el declarado");
});

caso("primeraPersona: reconjuga también un segundo verbo en la misma frase", () => {
  const resultado = primeraPersona(
    "Ajusta el texto al modelo de exposición trabajado en clase y se dirige al destinatario indicado en el encargo.",
    "ajusta",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Ajusto el texto al modelo de exposición trabajado en clase y me dirijo al destinatario indicado en el encargo.",
    "verbo inicial y verbo reflexivo secundario"
  );
});

caso("primeraPersona: no reconjuga un verbo del banco cuyo sujeto no es el alumno (relativa con 'que')", () => {
  const resultado = primeraPersona(
    "Estructura el texto con una introducción que delimita el tema y párrafos que avanzan de lo general a lo particular.",
    "estructura",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Estructuro el texto con una introducción que delimita el tema y párrafos que avanzan de lo general a lo particular.",
    "'que delimita' se refiere a la introducción, no al alumno, y debe quedarse en 3.ª persona"
  );
});

caso("primeraPersona: corrige el pretérito 'encontró' fuera del par presente del banco", () => {
  const resultado = primeraPersona(
    "Enumera datos sobre el tema en un bloque único, siguiendo el orden en que los encontró.",
    "enumera",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Enumero datos sobre el tema en un bloque único, siguiendo el orden en que los encontré.",
    "pretérito reconjugado por sustitución especial"
  );
});

caso("primeraPersona: reconjuga un segundo verbo no reflexivo en la misma frase", () => {
  const resultado = primeraPersona(
    "Emplea el vocabulario del tema trabajado en clase y mantiene el mismo tono a lo largo del texto.",
    "emplea",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Empleo el vocabulario del tema trabajado en clase y mantengo el mismo tono a lo largo del texto.",
    "verbo inicial y segundo verbo del banco"
  );
});

// --- generarAutoevaluacion, contra el pack real --------------------------
caso("generarAutoevaluacion: reconjuga sin excepciones los doce criterios del pack", () => {
  const meta = { actividad: "Prueba", curso: "1ESO", tipoTarea: "expositivo" };
  const criterios1eso = pack.criterios
    .filter((c) => c.curso === "1ESO" && c.tipos_tarea.includes("expositivo"))
    .map((c) => ({ ...c, peso_normalizado: c.peso_base }));
  const auto = generarAutoevaluacion(criterios1eso, pack.verbos, meta);
  if (auto.dimensiones.length !== criterios1eso.length) {
    throw new Error(`esperaba ${criterios1eso.length} dimensiones, obtuve ${auto.dimensiones.length}`);
  }
  for (const d of auto.dimensiones) {
    if (d.niveles.length !== 4) throw new Error(`la dimensión "${d.nombre}" no tiene los cuatro niveles`);
  }
});

// Invariante fuerte: ningún nivel debe conservar un verbo del banco todavía
// en 3.ª persona. Es la comprobación que habría atrapado el fallo del "se
// dirige" antes de llegar al navegador. Recorre TODOS los cursos y tipos de
// tarea de cada pack de la lista, no solo un par de ofertas: hasta la v1.19
// estaba cableado al expositivo y de ahí salieron los ocho verbos que faltaban
// en el banco del argumentativo (registro de cambios v1.13).
//
// Excepciones deliberadas: "una introducción que delimita el tema"
// (lcl-b-coherencia-expo-3eso, N3) tiene "delimita" con la introducción como
// sujeto, no el alumno, así que se queda en 3.ª persona a propósito
// (js/motor.js, reconjugarSecundarios). Si aparece una excepción no listada
// aquí, es una regresión real, no ruido del test.
//
// `data/pack-lcl-argumentativo.json` NO está todavía en la lista, y su
// ausencia es un hallazgo, no un olvido: al ampliar este invariante a los
// cuatro packs aparecieron tres restos suyos. Uno es legítimo ("la forma
// deíctica QUE ajusta la distancia", lcl-b-adecuacion-arg-4eso N4), pero los
// otros dos son el defecto real del "se dirige" otra vez, en 1.º y 2.º de
// Bachillerato: "...y explicita la respuesta personal que la lectura LE
// provoca, conectándola con la valoración que DEFIENDE"
// (lcl-c-fuentes-arg-1bach y -2bach, N4), que en la autoevaluación imprime
// "yo" y "él" en la misma frase. Se arregla reescribiendo esos dos
// descriptores, no metiéndolos en la lista de excepciones; hasta entonces el
// pack se queda fuera para que la lista no legitime un fallo.
const PACKS_CON_INVARIANTE = ["pack-lcl-expositivo.json", "pack-lcl-narracion.json"];
const EXCEPCIONES_DELIBERADAS = new Set(["lcl-b-coherencia-expo-3eso|3|Delimita"]);

caso("generarAutoevaluacion: ningún descriptor conserva un verbo del banco en 3.ª persona (salvo las excepciones documentadas)", () => {
  for (const nombre of PACKS_CON_INVARIANTE) {
    const p = cargar(nombre);
    const formas3s = p.verbos.map((v) => v["3s"]);
    const cursos = [...new Set(p.criterios.map((c) => c.curso))];
    const tipos = [...new Set(p.criterios.flatMap((c) => c.tipos_tarea))];
    for (const curso of cursos) {
      for (const tipoTarea of tipos) {
        const criterios = p.criterios
          .filter((c) => c.curso === curso && c.tipos_tarea.includes(tipoTarea))
          .map((c) => ({ ...c, peso_normalizado: c.peso_base }));
        if (criterios.length === 0) continue;
        const auto = generarAutoevaluacion(criterios, p.verbos, { actividad: "Prueba", curso, tipoTarea });
        for (const d of auto.dimensiones) {
          for (const [i, texto] of d.niveles.entries()) {
            for (const forma of formas3s) {
              const patron = new RegExp(`\\b${forma}\\b`, "i");
              if (patron.test(texto) && !EXCEPCIONES_DELIBERADAS.has(`${d.id}|${i + 1}|${forma}`)) {
                throw new Error(
                  `${nombre} · ${curso} · ${d.nombre} · N${i + 1} conserva "${forma}" en 3.ª persona: "${texto}"`
                );
              }
            }
          }
        }
      }
    }
  }
});

console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
