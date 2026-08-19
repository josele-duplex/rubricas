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

import { validarPack, comprobarRepartoPesos, comprobarSostenibilidad } from "../js/validador.js";
import { cargarPack } from "./cargar.mjs";

const packOriginal = cargarPack("pack-lcl-expositivo.json");

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

// Los términos de varias palabras necesitan el mismo límite que los de una.
// Hasta el 17-ago-2026 se buscaban por subcadena pelada y "el ord|en general|
// de la información" saltaba como "en general". Los dos validadores se
// equivocaban igual, así que la paridad estaba intacta y la corrección no:
// ninguna prueba lo veía.
caso("adverbitis: control de falso positivo — 'orden general' no contiene 'en general'", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Explica el orden general de la información en el texto expositivo.";
  const informe = validarPack(pack);
  assert(
    !avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id),
    "'orden general' disparó adverbitis por 'en general': el multipalabra busca por subcadena pelada"
  );
});

caso("adverbitis: 'en general' como locución sí dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-adecuacion-expo-1eso");
  c.descriptores.n3.texto = "Resume en general el contenido de las fuentes del texto.";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "adverbitis").some((a) => a.criterioId === c.id && a.mensaje.includes("en general")),
    "'en general' dejó de detectarse: el límite de palabra se ha pasado de estricto"
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

// --- 11 bis. continuidad_bandas ----------------------------------------------
// El componente de ortografía de 1.º de ESO cuenta faltas en cinco bandas
// —"Hasta 2 faltas" · "De 3 a 5" · "De 6 a 9" · "Deja de 10 a 13 sin corregir" ·
// "14 o más"—, que es la forma canónica de una escala de incidencias: empieza en
// 0, no salta ningún recuento y termina abierta. Cada caso rompe una de esas tres
// cosas. La última banda se toma por posición relativa, NUNCA por índice fijo:
// estas escalas pasaron de cuatro bandas a cinco y tres casos se rompieron por
// tener escrito el 3.
function componenteDeFaltas(pack) {
  const c = criterio(pack, "lcl-d-correccion-expo-1eso");
  const comp = c.matriz_cuantitativa.componentes.find((x) => /Ortograf/i.test(x.nombre));
  if (!comp) throw new Error("no se encontró el componente de ortografía en el pack de pruebas");
  return { c, comp, ultima: comp.bandas[comp.bandas.length - 1] };
}

caso("continuidad_bandas: un recuento que ninguna banda recoge dispara error", () => {
  const pack = clonarPack();
  const { c, comp } = componenteDeFaltas(pack);
  comp.bandas[1].condicion = "De 5 a 5 faltas"; // 3 y 4 faltas se quedan sin banda
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "continuidad_bandas").some(
      (a) => a.criterioId === c.id && a.mensaje.includes("de 3 a 4")
    ),
    "no se detectó el hueco entre dos bandas seguidas"
  );
});

caso("continuidad_bandas: la última banda cerrada deja fuera los recuentos altos", () => {
  const pack = clonarPack();
  const { c, ultima } = componenteDeFaltas(pack);
  ultima.condicion = "De 14 a 16 faltas"; // ¿y con 17?
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "continuidad_bandas").some(
      (a) => a.criterioId === c.id && a.mensaje.includes("17 o más")
    ),
    "no se detectó la escala sin banda abierta al final"
  );
});

caso("continuidad_bandas: la primera banda por encima de 0 deja fuera el texto limpio", () => {
  const pack = clonarPack();
  const { c, comp } = componenteDeFaltas(pack);
  comp.bandas[0].condicion = "De 1 a 2 faltas en todo el texto"; // el texto sin faltas no puntúa
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "continuidad_bandas").some(
      (a) => a.criterioId === c.id && a.mensaje.includes("0")
    ),
    "no se detectó el hueco por debajo de la primera banda"
  );
});

caso("continuidad_bandas: control de falso positivo — la escala real de faltas no dispara nada", () => {
  const informe = validarPack(clonarPack());
  assert(
    avisosDeRegla(informe, "continuidad_bandas").length === 0,
    "las matrices del pack real cubren todos los recuentos: no deben disparar la regla"
  );
});

caso("continuidad_bandas: control de falso positivo — un componente que cuenta logros no es una escala de incidencias", () => {
  const pack = clonarPack();
  const { c, comp } = componenteDeFaltas(pack);
  // Mismo componente, contando al revés: fuentes reunidas, no faltas cometidas.
  // Salta de 4 a 2 sin pasar por 3, y eso no es un hueco: nadie corrige "3
  // fuentes" con una banda de recuento, porque la escala baja según baja la nota.
  const textos = ["Reúne 4 o más fuentes de tipos distintos", "Reúne 3 fuentes",
                  "Reúne 2 fuentes", "Reúne 1 fuente",
                  "Escribe el texto sin consultar ninguna fuente"];
  comp.bandas.forEach((b, i) => { b.condicion = textos[i] ?? textos[textos.length - 1]; });
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "continuidad_bandas").filter((a) => a.criterioId === c.id).length === 0,
    "los componentes que cuentan logros no siguen la lógica de continuidad y no deben dar falso positivo"
  );
});

caso("continuidad_bandas: control de falso positivo — una banda final sin recuento recoge lo que la escala no nombra", () => {
  const pack = clonarPack();
  const { c, ultima } = componenteDeFaltas(pack);
  ultima.condicion = "Comete faltas de forma sistemática en todo el texto";
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "continuidad_bandas").filter((a) => a.criterioId === c.id).length === 0,
    "una banda cualitativa de cierre es la casilla de recogida del corrector, no un hueco"
  );
});

// --- 12. penalizacion_sin_tope -----------------------------------------------
caso("penalizacion_sin_tope: penalización sin tope declarado dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-3eso");
  // La trampa se escribe aquí y no se toma prestada del pack: desde la v1.40 no
  // queda ninguna penalización en el repositorio, y un caso que dependa de que
  // exista alguna se rompe el día que la última desaparece.
  c.matriz_cuantitativa.penalizaciones = [
    { clave: "digresion", puntos: -0.5, por: "cada bloque ajeno al tema anunciado" },
  ];
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "penalizacion_sin_tope").some((a) => a.criterioId === c.id && a.mensaje.includes("no declara tope")),
    "no se detectó la penalización sin tope"
  );
});

caso("penalizacion_sin_tope: tope que pasa del 35% de la dimensión dispara error", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-coherencia-expo-3eso");
  c.matriz_cuantitativa.penalizaciones = [
    {
      clave: "digresion",
      puntos: -0.5,
      por: "cada bloque ajeno al tema anunciado",
      tope: -(c.matriz_cuantitativa.total * 0.5),
    },
  ];
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

// --- 14. proceso_sin_respaldo -------------------------------------------------
caso("proceso_sin_respaldo: dimensión de proceso cuya cita no la sostiene dispara error", () => {
  const pack = clonarPack();
  // 5.2 ("Incorporar procedimientos básicos para enriquecer los textos…") no
  // habla de planificar, de borradores ni de revisar.
  const c = criterio(pack, "lcl-d-correccion-expo-1eso");
  c.evalua_proceso = true;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "proceso_sin_respaldo").some((a) => a.criterioId === c.id),
    "no se detectó la dimensión de proceso sin respaldo en la cita"
  );
});

caso("proceso_sin_respaldo: 'esquemas propios' del 6.1 no sostiene la bandera de proceso", () => {
  // El 6.1 de 3º ESO dice "...organizarla e integrarla en esquemas propios...":
  // esa frase describe la reorganización mental de información ajena en el
  // texto terminado, no un esquema como fase previa de escritura. Coinciden
  // en la palabra, no en el referente (SDD §5.2) — FORMULAS_PROCESO no debe
  // dejarse arrastrar por la subcadena "esquema".
  const pack = clonarPack();
  const c = criterio(pack, "lcl-b-informacion-expo-3eso");
  assert(c.criterio_oficial.cita.includes("esquemas propios"), "fixture inválida: el 6.1 de 3ESO debería citar 'esquemas propios'");
  c.evalua_proceso = true;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "proceso_sin_respaldo").some((a) => a.criterioId === c.id),
    "'esquemas propios' no debería sostener evalua_proceso: true"
  );
});

caso("proceso_sin_respaldo: control de falso positivo — la dimensión de planificación del pack real no dispara nada", () => {
  const pack = clonarPack();
  const c = criterio(pack, "lcl-d-planificacion-expo-1eso");
  assert(c.evalua_proceso === true, "fixture inválida: la dimensión de planificación debería venir marcada de proceso");
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "proceso_sin_respaldo").length === 0,
    "el criterio 9.1 ('Revisar los textos propios…') sí sostiene la dimensión de proceso"
  );
});

// --- 14 bis. dimension_sin_respaldo -------------------------------------------
// Regla hermana de la anterior y por la misma razón: si el criterio oficial no
// nombra lo que la dimensión mide, la dimensión no está derivada del currículo
// (CLAUDE.md, regla 1) y la cita literal no la salva.
//
// Lo que la motivó es un hecho del decreto: la competencia específica 4 evalúa
// el canal en unos cursos y no en otros. 2.º ESO (4.1) y 1.º Bach (4.2) dicen
// «la idoneidad del canal utilizado»; 4.º ESO (4.1) y 2.º Bach (4.2) no lo
// nombran, se quedan en «su calidad y fiabilidad». Antes de esta regla, una
// dimensión de canal en 4.º ESO pasaba limpia: la cita seguía siendo literal y
// del curso correcto.
//
// Los términos exigidos viven en data/reglas-lexicas.json
// (por_materia.LCL.dimensiones_con_respaldo), no en el código: dar de alta una
// materia no obliga a tocar ni Python ni JavaScript.
const packReaccionOriginal = cargarPack("pack-lcl-reaccion.json");

function clonarReaccion() {
  return JSON.parse(JSON.stringify(packReaccionOriginal));
}

caso("dimension_sin_respaldo: dimensión de canal en un curso cuyo criterio no nombra el canal dispara error", () => {
  // El defecto no es un descriptor mal escrito: es un criterio movido de curso.
  // Se clona la dimensión de canal de 2.º ESO y se le pone la cita de 4.º ESO,
  // que es la que no habla del canal.
  const pack = clonarReaccion();
  const canal = criterio(pack, "lcl-b-valcanal-rea-2eso");
  const contenido4eso = criterio(pack, "lcl-b-valcontenido-rea-4eso");
  assert(
    !contenido4eso.criterio_oficial.cita.toLowerCase().includes("canal"),
    "fixture inválida: el 4.1 de 4ESO no debería nombrar el canal"
  );

  const clon = JSON.parse(JSON.stringify(canal));
  clon.id = "lcl-b-valcanal-rea-4eso";
  clon.curso = "4ESO";
  clon.criterio_oficial = JSON.parse(JSON.stringify(contenido4eso.criterio_oficial));
  clon.progresion = { autonomia: 3, complejidad: 3, metalinguistico: 3 };
  clon.peso_base = 0; // para no descuadrar los pesos de 4ESO y no arrastrar un aviso que enturbie el caso
  pack.criterios.push(clon);

  // El clon dispara además `copia_entre_cursos` —sus N2-N4 son los de 2.º ESO,
  // que es justo lo que la otra regla busca—, así que el informe NO tiene un
  // solo aviso: se filtra por regla.
  const informe = validarPack(pack);
  const avisos = avisosDeRegla(informe, "dimension_sin_respaldo");
  assert(avisos.length === 1, `se esperaba un solo aviso de la regla y hubo ${avisos.length}`);
  assert(avisos[0].criterioId === clon.id, "el aviso no señala al criterio trampa");
  assert(avisos[0].severidad === "error", "la dimensión sin respaldo es error, no aviso");
  assert(
    avisos[0].mensaje ===
      "lcl-b-valcanal-rea-4eso: la dimensión 'valoracion_canal' evalúa algo que el criterio 4.1 de 4ESO no nombra (ninguno de: canal, soporte).",
    `mensaje inesperado: ${avisos[0].mensaje}`
  );
});

caso("dimension_sin_respaldo: control de falso positivo — las dimensiones de canal del pack real no disparan nada", () => {
  // Las dos que el pack sí tiene (2.º ESO y 1.º Bach) citan criterios que sí
  // dicen «canal». Este control es el que impide «arreglar» la regla dejándola
  // siempre activa.
  const informe = validarPack(clonarReaccion());
  assert(
    avisosDeRegla(informe, "dimension_sin_respaldo").length === 0,
    "el pack real de reacción no debería tener ninguna dimensión sin respaldo"
  );
});

caso("dimension_sin_respaldo: control de alcance — la regla no opina sobre un pack sin dimensiones listadas", () => {
  // La regla se aplica POR DIMENSIÓN listada en `dimensiones_con_respaldo`, no
  // a todas las dimensiones de todos los packs: ninguna del expositivo se llama
  // `valoracion_canal`, así que no tiene nada que decir.
  const pack = clonarPack();
  assert(
    !pack.criterios.some((c) => c.dimension === "valoracion_canal"),
    "fixture inválida: el expositivo no debería tener dimensión de canal"
  );
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "dimension_sin_respaldo").length === 0,
    "la regla se está aplicando a dimensiones que no están en dimensiones_con_respaldo"
  );
});

// --- 15. pesos_curso (nivel de pack) ------------------------------------------
caso("pesos_curso: pesos de un curso que no suman 100 disparan aviso", () => {
  const pack = clonarPack();
  criterio(pack, "lcl-b-adecuacion-expo-1eso").peso_base += 5;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "pesos_curso").some((a) => a.mensaje.includes("1ESO")),
    "no se detectó el descuadre de pesos en 1ESO"
  );
});

// --- 15 bis. razon_peso (nivel de pack) ---------------------------------------
// El defecto se introduce QUITANDO la razón, no desigualando los pesos: los
// packs reales ya son desiguales y esa es exactamente la situación que el marco
// teórico admite mientras la razón esté escrita (§2.3).
caso("razon_peso: reparto desigual sin razón declarada dispara aviso", () => {
  const pack = clonarPack();
  delete pack.razon_peso;
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "razon_peso").length === 1,
    "no se detectó el reparto desigual sin razón declarada"
  );
});

caso("razon_peso: control de falso positivo — el pack real, con su razón, no dispara nada", () => {
  const informe = validarPack(clonarPack());
  assert(
    avisosDeRegla(informe, "razon_peso").length === 0,
    "un pack desigual CON razón declarada es lo que el marco admite; no debe avisar"
  );
});

caso("razon_peso: control de falso positivo — pesos iguales sin razón no disparan nada", () => {
  const pack = clonarPack();
  delete pack.razon_peso;
  const de1eso = pack.criterios.filter((c) => c.curso === "1ESO");
  pack.criterios = de1eso.map((c) => ({ ...c, peso_base: 100 / de1eso.length }));
  const informe = validarPack(pack);
  assert(
    avisosDeRegla(informe, "razon_peso").length === 0,
    "la ponderación igual es el valor por defecto del marco: no necesita razón"
  );
});

// --- 16. reparto_pesos (no forma parte de validarPack: opera sobre un
// instrumento ya normalizado, según documenta el propio validador.js) -------
caso("reparto_pesos: dimensión por encima del 40% dispara aviso", () => {
  const avisos = comprobarRepartoPesos([
    { nombre: "Coherencia", peso_normalizado: 45 },
    { nombre: "Cohesión", peso_normalizado: 30 },
    { nombre: "Adecuación", peso_normalizado: 25 },
  ]);
  assert(avisos.some((a) => a.includes("Coherencia") && a.includes("40%")), "no se detectó la dimensión sobrerrepresentada");
});

caso("reparto_pesos: control de falso positivo — una sola dimensión no dispara aviso", () => {
  const avisos = comprobarRepartoPesos([{ nombre: "Planificación y revisión del propio texto", peso_normalizado: 100 }]);
  assert(avisos.length === 0, "con una sola dimensión el 100% es aritmética, no un reparto discutible");
});

caso("reparto_pesos: dimensión por debajo del 5% dispara aviso", () => {
  const avisos = comprobarRepartoPesos([
    { nombre: "Coherencia", peso_normalizado: 40 },
    { nombre: "Cohesión", peso_normalizado: 57 },
    { nombre: "Adecuación", peso_normalizado: 3 },
  ]);
  assert(avisos.some((a) => a.includes("Adecuación") && a.includes("5%")), "no se detectó la dimensión infrarrepresentada");
});

// --- 17. sostenibilidad (tampoco forma parte de validarPack: única
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
