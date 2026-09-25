// Ficha del alumno · bloque «La rúbrica completa, en breve» (js/motor.js,
// generarFichaAlumno). Es la misma matriz que la rúbrica analítica
// (generarRubricaAnalitica) pero sin lo que ahí es información de quien
// evalúa, no del alumno: criterio oficial, etiqueta de bloque LOMLOE y
// condición de evidencia. Estos casos fijan la forma exacta del dato que la
// vista solo pinta sin recalcular (js/ui.js, renderRubricaBreve): ni más
// campos de los que pide CLAUDE.md, ni menos dimensiones o niveles que la
// rúbrica analítica de la que se deriva.

import { generarInstrumentos, generarFichaAlumno, generarRubricaAnalitica } from "../js/motor.js";
import { huellaFnv1a } from "../js/huella.js";
import { cargarPack as cargar } from "./cargar.mjs";

const pack = cargar("pack-lcl-expositivo.json");

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
  if (actual !== esperado) throw new Error(`${mensaje} (esperado "${esperado}", obtenido "${actual}")`);
}

const resultado = generarInstrumentos(pack, {
  curso: "3ESO",
  tipoTarea: "expositivo",
  tiempoCorreccion: "mas5",
  actividad: "Borrador de un texto expositivo sobre el reciclaje",
  esProductoFinal: false,
});
assert(resultado.ok, "el pack de expositivo en 3ESO tenía que generar instrumentos para poder probar la ficha");

const { rubricaBreve } = resultado.fichaAlumno;
const { dimensiones: dimensionesAnalitica } = resultado.rubricaAnalitica;

caso("rubricaBreve: existe y trae al menos una dimensión", () => {
  assert(rubricaBreve !== undefined, "generarFichaAlumno no devolvió rubricaBreve");
  assert(rubricaBreve.dimensiones.length > 0, "rubricaBreve no trae ninguna dimensión");
});

caso("rubricaBreve: mismas dimensiones, mismo orden y mismo peso que la rúbrica analítica", () => {
  assertIgual(rubricaBreve.dimensiones.length, dimensionesAnalitica.length, "número de dimensiones");
  rubricaBreve.dimensiones.forEach((d, i) => {
    assertIgual(d.nombre, dimensionesAnalitica[i].nombre, `dimensión ${i}: mismo nombre y orden que la analítica`);
    assertIgual(d.peso, dimensionesAnalitica[i].peso, `dimensión "${d.nombre}": mismo peso que la analítica`);
  });
});

caso("rubricaBreve: los cuatro niveles son el texto literal del descriptor, sin truncar", () => {
  rubricaBreve.dimensiones.forEach((d, i) => {
    assertIgual(d.niveles.length, 4, `dimensión "${d.nombre}" no tiene los cuatro niveles`);
    d.niveles.forEach((texto, n) => {
      assertIgual(
        texto,
        dimensionesAnalitica[i].niveles[n],
        `dimensión "${d.nombre}" N${n + 1}: mismo texto que la rúbrica analítica, sin truncar`
      );
    });
  });
});

caso("rubricaBreve: no lleva criterio oficial, bloque LOMLOE ni condición de evidencia", () => {
  const esperadas = ["nombre", "peso", "niveles"].sort().join(",");
  for (const d of rubricaBreve.dimensiones) {
    const claves = Object.keys(d).sort().join(",");
    assertIgual(
      claves,
      esperadas,
      `"${d.nombre}": la ficha breve solo lleva nombre, peso y niveles, encontré [${Object.keys(d)}]`
    );
  }
});

// --- Lenguaje sencillo (docs/diseno/plan-lenguaje-sencillo.md, SDD §17
// decisión 22): generarFichaAlumno usa `alumno`/`nombre_alumno` cuando
// existen y `origen` sigue siendo la huella del técnico actual; si no, el
// técnico. Se construye un criterio sintético y no uno del catálogo real,
// porque ningún pack lleva todavía lenguaje sencillo (L1 es infraestructura,
// sin contenido).
const N1_TECNICO = "Utiliza conectores de causa y de consecuencia entre las ideas.";
const N2_TECNICO = "Utiliza conectores de causa, consecuencia y ejemplificación de forma variada.";
const N3_TECNICO = "Utiliza una variedad amplia de conectores con precisión.";
const N4_TECNICO = "Utiliza conectores variados y los combina con puntuación experta.";

function criterioSintetico(nombreAlumno) {
  return {
    id: "trampa-sencillo",
    nombre: "Cohesión: conectores y puntuación",
    ...(nombreAlumno !== undefined ? { nombre_alumno: nombreAlumno } : {}),
    bloque_lomloe: "B",
    obligatorio: true,
    prioridad: 1,
    peso_normalizado: 100,
    criterio_oficial: { codigo: "5.2", cita: "cita de prueba", competencia_especifica: 5 },
    descriptores: {
      n1: {
        verbo: "utiliza",
        texto: N1_TECNICO,
        // origen al día: el motor debe preferir esta versión sencilla.
        alumno: { verbo: "usa", texto: "Usa palabras de enlace (*porque*, *por eso*).", origen: huellaFnv1a(N1_TECNICO) },
      },
      n2: {
        verbo: "utiliza",
        texto: N2_TECNICO,
        // origen desfasado a propósito: el técnico se editó y nadie revisó el sencillo.
        alumno: { verbo: "usa", texto: "Usa varias palabras de enlace distintas.", origen: "00000000" },
      },
      n3: { verbo: "utiliza", texto: N3_TECNICO }, // sin versión sencilla
      n4: { verbo: "utiliza", texto: N4_TECNICO },
    },
  };
}

caso("lenguaje sencillo: generarFichaAlumno usa el texto sencillo cuando el origen está al día", () => {
  const ficha = generarFichaAlumno([criterioSintetico("Cómo se unen las ideas")], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(ficha.rubricaBreve.dimensiones[0].niveles[0], "Usa palabras de enlace (*porque*, *por eso*).",
    "el N1 debía usar el texto sencillo, cuyo origen coincide con la huella del técnico");
});

caso("lenguaje sencillo: generarFichaAlumno cae al técnico cuando el origen está desfasado", () => {
  const ficha = generarFichaAlumno([criterioSintetico("Cómo se unen las ideas")], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(ficha.rubricaBreve.dimensiones[0].niveles[1], N2_TECNICO,
    "el N2 tiene un `alumno.origen` que ya no es la huella del técnico: debía caer al técnico");
});

caso("lenguaje sencillo: generarFichaAlumno cae al técnico cuando ese nivel no tiene versión sencilla", () => {
  const ficha = generarFichaAlumno([criterioSintetico("Cómo se unen las ideas")], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(ficha.rubricaBreve.dimensiones[0].niveles[2], N3_TECNICO, "el N3 no tiene `alumno`: debía quedarse en el técnico");
  assertIgual(ficha.comoLlegarAExcelente[0].texto, N4_TECNICO, "el N4 no tiene `alumno`: «cómo llegar a Excelente» debía quedarse en el técnico");
});

caso("lenguaje sencillo: generarFichaAlumno usa nombre_alumno cuando existe", () => {
  const ficha = generarFichaAlumno([criterioSintetico("Cómo se unen las ideas")], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(ficha.queSeValora[0].nombre, "Cómo se unen las ideas", "queSeValora debía usar nombre_alumno");
  assertIgual(ficha.rubricaBreve.dimensiones[0].nombre, "Cómo se unen las ideas", "rubricaBreve debía usar nombre_alumno");
});

caso("lenguaje sencillo: generarFichaAlumno usa el nombre técnico cuando no hay nombre_alumno", () => {
  const ficha = generarFichaAlumno([criterioSintetico(undefined)], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(ficha.queSeValora[0].nombre, "Cohesión: conectores y puntuación", "sin nombre_alumno, queSeValora debía usar el nombre técnico");
});

caso("lenguaje sencillo: los instrumentos del profesor no usan alumno ni nombre_alumno", () => {
  const analitica = generarRubricaAnalitica([criterioSintetico("Cómo se unen las ideas")], { actividad: "a", curso: "1ESO", tipoTarea: "expositivo" });
  assertIgual(analitica.dimensiones[0].nombre, "Cohesión: conectores y puntuación", "la rúbrica analítica debía seguir usando el nombre técnico");
  assertIgual(analitica.dimensiones[0].niveles[0], N1_TECNICO, "la rúbrica analítica debía seguir usando el texto técnico, no el sencillo");
});

console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
