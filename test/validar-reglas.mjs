// Casos del validador (SDD §15): "una batería de descriptores correctos e
// incorrectos, uno por regla de §10". Cada caso parte de una copia profunda
// del pack real, introduce un único defecto y comprueba que la regla que le
// corresponde lo detecta — nunca al revés: si un caso obligara a tocar
// data/pack-lcl-expositivo.json, la regla está mal escrita, no el pack
// (CLAUDE.md, método de trabajo).
//
// Incluye también los controles de falso positivo del invariante de
// paridad de §10 con scripts/validar_pack.py: "formal" y "bienestar" no son
// adverbitis (ahí la app es deliberadamente más estricta que el script, en
// la única dirección admisible), y "bastantes"/"regularmente" sí lo son
// (ahí replica la búsqueda por subcadena del script).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validarPack, comprobarRepartoPesos, comprobarSostenibilidad } from "../js/validador.js";

const rutaPack = fileURLToPath(new URL("../data/pack-lcl-expositivo.json", import.meta.url));
const packOriginal = JSON.parse(readFileSync(rutaPack, "utf8"));

function clonarPack() {
  return JSON.parse(JSON.stringify(packOriginal));
}

function criterio(pack, id) {
  const c = pack.criterios.find((x) => x.id === id);
  if (!c) throw new Error(`criterio no encontrado en el pack de pruebas: ${id}`);
  return c;
}

function avisosDeRegla(informe, regla) {
  return informe.avisos.filter((a) => a.regla === regla);
}

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

// --- 1. trazabilidad ---------------------------------------------------
caso("trazabilidad: criterio sin cita dispara error", () => {
  const pack = clonarPack();
  criterio(pack, "lcl-b-adecuacion-expo-1eso").criterio_oficial.cita = "";
  const informe = validarPack(pack);
  assert(avisosDeRegla(informe, "trazabilidad").length === 1, "no se detectó la falta de cita");
});

// --- 2. verbo_observable -------------------------------------------------
caso("verbo_observable: primera palabra fuera del banco dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n2.texto = "Redacta el texto siguiendo el modelo trabajado en clase.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "verbo_observable").some((a) => a.criterioId === c.id),
    "no se detectó el verbo fuera del banco"
  );
});

caso("verbo_observable: verbo declarado incoherente con el texto dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n2.verbo = "explica"; // el texto sigue empezando por "Ajusta"
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "verbo_observable").some((a) => a.mensaje.includes("no es el del texto")),
    "no se detectó la incoherencia entre verbo declarado y texto"
  );
});

// --- 3. adverbitis (§10, paridad con validar_pack.py) --------------------
caso("adverbitis: término largo por subcadena — 'bastantes' dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Emplea bastantes conectores de causa a lo largo del texto.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id && a.mensaje.includes("bastante")),
    "no se detectó 'bastantes' (forma flexionada de 'bastante')"
  );
});

caso("adverbitis: término largo por subcadena — 'regularmente' dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Emplea conectores de causa regularmente a lo largo del texto.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id && a.mensaje.includes("regular")),
    "no se detectó 'regularmente' (forma flexionada de 'regular')"
  );
});

caso("adverbitis: término corto por palabra completa — 'mal' dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Emplea mal los conectores de causa a lo largo del texto.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id),
    "no se detectó 'mal' como palabra completa"
  );
});

caso("adverbitis: control de falso positivo — 'formal' no contiene 'mal'", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Emplea un registro formal adecuado al destinatario del texto.";
  const informe = validarPack(pack);
  assert(
    !avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id),
    "'formal' disparó adverbitis por 'mal': el límite de palabra completa no funciona"
  );
});

caso("adverbitis: control de falso positivo — 'bienestar' no contiene 'bien'", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Explica el bienestar del alumnado como tema del texto expositivo.";
  const informe = validarPack(pack);
  assert(
    !avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id),
    "'bienestar' disparó adverbitis por 'bien': el límite de palabra completa no funciona"
  );
});

// --- 4. adverbitis_banda ---------------------------------------------------
caso("adverbitis_banda: condición de banda no contable dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-1eso");
  c.matriz_cuantitativa.componentes[0].bandas[1].condicion =
    "Comete bastantes errores de puntuación entre las partes del texto";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "adverbitis_banda").some((a) => a.criterioId === c.id),
    "no se detectó el calificador vago en la banda"
  );
});

// --- 5. gradacion_positiva -------------------------------------------------
caso("gradacion_positiva: N1 redactado en negativo dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-cohesion-expo-1eso");
  c.descriptores.n1.verbo = "utiliza";
  c.descriptores.n1.texto = "No utiliza conectores de adición ni de causa en el texto.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "gradacion_positiva").some((a) => a.criterioId === c.id),
    "no se detectó el N1 en negativo"
  );
});

// --- 6. saber_vehiculo ------------------------------------------------------
caso("saber_vehiculo: nombre de dimensión empieza por artículo dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-cohesion-expo-1eso");
  c.nombre = "Las oraciones subordinadas";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "saber_vehiculo").some((a) => a.criterioId === c.id && a.mensaje.includes("artículo")),
    "no se detectó el nombre de dimensión con artículo inicial"
  );
});

caso("saber_vehiculo: cabeza del nombre coincide con un saber prohibido", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-cohesion-expo-1eso");
  c.nombre = "Puntuación: uso de comas y punto y seguido";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "saber_vehiculo").some((a) => a.criterioId === c.id && a.mensaje.includes("es un saber")),
    "no se detectó la cabeza de dimensión coincidente con un saber"
  );
});

caso("saber_vehiculo: control de falso positivo — el pack real no dispara nada", () => {
  const informe = validarPack(clonarPack());
  assert(avisosDeRegla(informe, "saber_vehiculo").length === 0, "el pack real no debería disparar saber_vehiculo");
});

// --- 7. niveles_indistinguibles ---------------------------------------------
caso("niveles_indistinguibles: dos niveles casi idénticos disparan aviso", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n2.texto = "Ajusta el texto al modelo de exposición trabajado en clase y se dirige al lector indicado.";
  c.descriptores.n3.texto = "Ajusta el texto al modelo de exposición trabajado en clase y se dirige bien al lector indicado.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "niveles_indistinguibles").some((a) => a.criterioId === c.id),
    "no se detectaron dos niveles casi idénticos"
  );
});

// --- 8. modalizadores (dos direcciones) -------------------------------------
caso("modalizadores A: criterio con 'de manera guiada' sin ninguna marca de ayuda en los descriptores", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso"); // cita: "...con ayuda de..." no dispara A; usamos otro
  c.criterio_oficial.cita = "Redactar textos expositivos sencillos de manera guiada, atendiendo al destinatario.";
  for (const n of ["n1", "n2", "n3", "n4"]) {
    c.descriptores[n].texto = c.descriptores[n].texto
      .replace(/model[oa]s?/gi, "esquema")
      .replace(/indicad[oa]s?/gi, "propuesto")
      .replace(/pauta/gi, "esquema")
      .replace(/encargo/gi, "esquema");
  }
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "modalizadores").some((a) => a.criterioId === c.id && a.mensaje.includes("ningún descriptor nombra la ayuda")),
    "no se detectó la ausencia de andamiaje pese a 'de manera guiada' en la cita"
  );
});

caso("modalizadores B: criterio 'progresivamente autónoma' con andamiaje residual en un descriptor", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-d-planificacion-expo-3eso"); // cita real con "progresivamente autónoma"
  c.descriptores.n3.texto = "Revisa el borrador con la pauta facilitada y corrige problemas de puntuación.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "modalizadores").some((a) => a.criterioId === c.id && a.mensaje.includes("mantiene el andamiaje")),
    "no se detectó el andamiaje residual pese a 'progresivamente autónoma' en la cita"
  );
});

caso("modalizadores: control de falso positivo — el pack real no dispara nada", () => {
  const informe = validarPack(clonarPack());
  assert(avisosDeRegla(informe, "modalizadores").length === 0, "el pack real no debería disparar modalizadores");
});

// --- 9. copia_entre_cursos ---------------------------------------------------
caso("copia_entre_cursos: N2-N4 idénticos entre 1º y 3º disparan aviso", () => {
  const pack = clonarPack();
  const c1 = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  const c3 = criterio(pack, "lcl-b-adecuacion-expo-3eso");
  for (const n of ["n2", "n3", "n4"]) {
    c3.descriptores[n].texto = c1.descriptores[n].texto;
    c3.descriptores[n].verbo = c1.descriptores[n].verbo;
  }
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "copia_entre_cursos").length === 1,
    "no se detectó la copia de N2-N4 entre cursos distintos"
  );
});

// --- 10. tarea_aplicable (nivel de pack) -------------------------------------
caso("tarea_aplicable: combinación con menos de 3 dimensiones dispara aviso", () => {
  const pack = clonarPack();
  pack.criterios = pack.criterios.filter(
    (c) => c.curso !== "1ESO" || ["lcl-b-adecuacion-expo-1eso", "lcl-b-coherencia-expo-1eso"].includes(c.id)
  );
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "tarea_aplicable").some((a) => a.mensaje.includes("1ESO") && a.mensaje.includes("solo 2")),
    "no se detectó la combinación con menos de 3 dimensiones"
  );
});

// --- 11. matriz_cuadrada ------------------------------------------------------
caso("matriz_cuadrada: componentes que no suman el total disparan error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-1eso");
  c.matriz_cuantitativa.total = c.matriz_cuantitativa.total + 1;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "matriz_cuadrada").some((a) => a.criterioId === c.id && a.mensaje.includes("componentes suman")),
    "no se detectó el descuadre entre componentes y total"
  );
});

caso("matriz_cuadrada: bandas desordenadas disparan error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-1eso");
  const bandas = c.matriz_cuantitativa.componentes[0].bandas;
  [bandas[0].puntos, bandas[1].puntos] = [bandas[1].puntos, bandas[0].puntos];
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "matriz_cuadrada").some((a) => a.criterioId === c.id && a.mensaje.includes("no van de más a menos")),
    "no se detectaron las bandas desordenadas"
  );
});

caso("matriz_cuadrada: falta la banda de 0 puntos dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-1eso");
  const comp = c.matriz_cuantitativa.componentes[0];
  comp.bandas = comp.bandas.filter((b) => b.puntos !== 0);
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "matriz_cuadrada").some((a) => a.criterioId === c.id && a.mensaje.includes("falta la banda de 0")),
    "no se detectó la ausencia de la banda de 0 puntos"
  );
});

// --- 12. penalizacion_sin_tope -----------------------------------------------
caso("penalizacion_sin_tope: penalización sin tope declarado dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-3eso");
  delete c.matriz_cuantitativa.penalizaciones[0].tope;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "penalizacion_sin_tope").some((a) => a.criterioId === c.id && a.mensaje.includes("no declara tope")),
    "no se detectó la penalización sin tope"
  );
});

caso("penalizacion_sin_tope: tope que pasa del 35% de la dimensión dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-3eso");
  c.matriz_cuantitativa.penalizaciones[0].tope = -(c.matriz_cuantitativa.total * 0.5);
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "penalizacion_sin_tope").some((a) => a.criterioId === c.id && a.mensaje.includes("supera el 35%")),
    "no se detectó el tope por encima del 35%"
  );
});

// --- 13. doble_castigo --------------------------------------------------------
caso("doble_castigo: penalización que repite lo que ya mide un componente dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-3eso");
  // el componente 0 ya mide "partes"/"introducción"; una penalización sobre
  // ese mismo fenómeno es el doble castigo que describe el SDD §6.3.
  const nombreComp = c.matriz_cuantitativa.componentes[0].nombre.toLowerCase();
  assert(nombreComp.length > 0, "fixture inválida: el componente 0 no tiene nombre");
  c.matriz_cuantitativa.penalizaciones.push({
    clave: "partes_confusas",
    puntos: -0.5,
    por: `cada vez que las partes del texto y la introducción no se distinguen`,
    tope: -1,
  });
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "doble_castigo").some((a) => a.criterioId === c.id),
    "no se detectó el doble castigo entre la nueva penalización y el componente"
  );
});

// --- 14. pesos_curso (nivel de pack) ------------------------------------------
caso("pesos_curso: pesos de un curso que no suman 100 disparan aviso", () => {
  const pack = clonarPack();
  criterio(pack, "lcl-b-adecuacion-expo-1eso").peso_base += 5;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "pesos_curso").some((a) => a.mensaje.includes("1ESO")),
    "no se detectó el descuadre de pesos en 1ESO"
  );
});

// --- 15. reparto_pesos (no forma parte de validarPack: opera sobre un
// instrumento ya normalizado, según documenta el propio validador.js) -------
caso("reparto_pesos: dimensión por encima del 40% dispara aviso", () => {
  const avisos = comprobarRepartoPesos([
    { nombre: "Coherencia", peso_normalizado: 45 },
    { nombre: "Cohesión", peso_normalizado: 30 },
    { nombre: "Adecuación", peso_normalizado: 25 },
  ]);
  assert(avisos.some((a) => a.includes("Coherencia") && a.includes("40%")), "no se detectó la dimensión sobrerrepresentada");
});

caso("reparto_pesos: dimensión por debajo del 5% dispara aviso", () => {
  const avisos = comprobarRepartoPesos([
    { nombre: "Coherencia", peso_normalizado: 40 },
    { nombre: "Cohesión", peso_normalizado: 57 },
    { nombre: "Adecuación", peso_normalizado: 3 },
  ]);
  assert(avisos.some((a) => a.includes("Adecuación") && a.includes("5%")), "no se detectó la dimensión infrarrepresentada");
});

// --- 16. sostenibilidad (tampoco forma parte de validarPack: única
// implementación compartida con motor.js, §10 nota de la especificación) ----
caso("sostenibilidad: más de 5 dimensiones en tarea que no es producto final dispara aviso", () => {
  const seis = Array.from({ length: 6 }, (_, i) => ({ id: `dim-${i}` }));
  const aviso = comprobarSostenibilidad(seis, false);
  assert(aviso !== null && aviso.includes("5 dimensiones"), "no se detectó el exceso de dimensiones");
});

caso("sostenibilidad: control de falso positivo — producto final integrador no dispara nada", () => {
  const seis = Array.from({ length: 6 }, (_, i) => ({ id: `dim-${i}` }));
  const aviso = comprobarSostenibilidad(seis, true);
  assert(aviso === null, "el producto final integrador no debería disparar el aviso de sostenibilidad");
});

// --- resumen -------------------------------------------------------------
console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
