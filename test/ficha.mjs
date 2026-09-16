// Ficha del alumno · bloque «La rúbrica completa, en breve» (js/motor.js,
// generarFichaAlumno). Es la misma matriz que la rúbrica analítica
// (generarRubricaAnalitica) pero sin lo que ahí es información de quien
// evalúa, no del alumno: criterio oficial, etiqueta de bloque LOMLOE y
// condición de evidencia. Estos casos fijan la forma exacta del dato que la
// vista solo pinta sin recalcular (js/ui.js, renderRubricaBreve): ni más
// campos de los que pide CLAUDE.md, ni menos dimensiones o niveles que la
// rúbrica analítica de la que se deriva.

import { generarInstrumentos } from "../js/motor.js";
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

console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
