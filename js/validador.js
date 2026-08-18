import { LEXICO } from "./lexico.js";

// Validador de calidad de descriptores — SDD §10.
//
// Paridad con scripts/validar_pack.py: toda regla del script hermano vive
// aquí, con el mismo umbral y la misma semántica. La LÓGICA está escrita dos
// veces a propósito (es corta y conviene poder leerla en cada lenguaje); las
// PALABRAS y los umbrales, no: vienen de data/reglas-lexicas.json a través de
// js/lexico.js, que es un archivo generado. Mientras se sincronizaban a mano
// ya se separaron en silencio —este validador no marcaba "bienestar" y el
// script sí—, que es la forma exacta de romper el invariante de abajo sin
// que nadie se entere.
//
// Donde una regla usa una
// heurística léxica —doble castigo, niveles indistinguibles, modalizadores
// del criterio—, la regla avisa y explica, pero no sustituye a la
// simulación de corrección (SDD §15): eso sigue siendo trabajo de
// scripts/simular_correccion.py. Invariante que debe quedar cierto siempre:
// la app nunca informa de un pack más limpio que scripts/validar_pack.py.

// Catálogo único de reglas (§10): de aquí sale la etiqueta que pinta la
// interfaz y el "porQué" que acompaña a cada aviso — el principal mecanismo
// por el que la app forma al profesorado. La severidad de un aviso concreto
// es siempre la que declara aquí su regla; no hay reglas que emitan a veces
// error y a veces aviso.
export const REGLAS = {
  trazabilidad: {
    etiqueta: "Trazabilidad",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una rúbrica se deriva del currículo, no se inventa. Un criterio sin la cita del criterio " +
      "oficial de ese curso no es un instrumento evaluable: es una opinión con formato de tabla, " +
      "y no se sostiene ante una reclamación.",
  },
  verbo_observable: {
    etiqueta: "Verbo observable",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "El descriptor describe una conducta que se puede ver en la producción del alumno. El banco " +
      "cerrado de verbos garantiza además la derivación exacta a primera persona para la " +
      "autoevaluación: Reconoce/Reconozco.",
  },
  adverbitis: {
    etiqueta: "Adverbitis",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "\"Adecuadamente\" o \"a veces\" no describen nada observable: trasladan la decisión al ojo " +
      "del corrector y hacen la rúbrica indefendible. El nivel se marca con el objeto y la " +
      "condición, no con el adverbio.",
  },
  adverbitis_banda: {
    etiqueta: "Adverbitis en banda",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una banda de matriz existe para contarse. Si la condición dice \"bastantes errores\" en vez " +
      "de \"de 3 a 5 errores\", la matriz deja de servir para corregir y solo aparenta precisión.",
  },
  gradacion_positiva: {
    etiqueta: "Gradación positiva",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "El nivel 1 describe lo que el alumno sí hace de forma limitada, nunca lo que le falta. Un " +
      "descriptor en negativo no le dice al alumno qué hacer para pasar de nivel, que es lo único " +
      "que justifica entregarle la rúbrica.",
  },
  saber_vehiculo: {
    etiqueta: "Saber como vehículo",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "La dimensión es una acción competencial, no un contenido. \"Las oraciones subordinadas\" es " +
      "un saber, y los saberes son vehículo: van dentro del descriptor como contexto, no abren fila.",
  },
  niveles_indistinguibles: {
    etiqueta: "Niveles indistinguibles",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "Si dos niveles contiguos solo se diferencian en un adverbio, no hay cuatro niveles: hay dos " +
      "con adorno. La distancia entre niveles se construye con el objeto y la condición, y tiene " +
      "que poder explicarse al alumno en una frase.",
  },
  modalizadores: {
    etiqueta: "Modalizadores del criterio",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "La progresión entre cursos no se diseña: está escrita en el criterio oficial. Si el criterio " +
      "dice \"de manera guiada\", la ayuda es parte de la condición de desempeño y tiene que verse " +
      "en el descriptor; si dice \"progresivamente autónoma\", el andamiaje del curso anterior ya no " +
      "puede seguir ahí.",
  },
  copia_entre_cursos: {
    etiqueta: "Copia entre cursos",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "Descriptores idénticos en dos cursos distintos suelen ser copiar y pegar, no progresión. El " +
      "N1 queda exento: un texto entregado sin revisar es la misma evidencia en 1.º de ESO que en " +
      "2.º de Bachillerato.",
  },
  proceso_sin_respaldo: {
    etiqueta: "Dimensión de proceso sin respaldo",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una dimensión solo se declara de proceso si su criterio oficial habla de planificar, de " +
      "borradores o de revisar. Marcarla sin ese respaldo convierte el premarcado de la puerta de " +
      "\"fase de un texto\" en una preferencia del redactor del pack, y la rúbrica se deriva del " +
      "currículo, no se inventa.",
  },
  dimension_sin_respaldo: {
    etiqueta: "Dimensión que el criterio no nombra",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una dimensión mide lo que su criterio oficial pide medir, y solo eso. El currículo " +
      "evalúa el canal en unos cursos y en otros no —la competencia 4 lo nombra en 2.º de ESO " +
      "y lo retira en 4.º—, así que una fila de canal donde el criterio no lo menciona no está " +
      "derivada: está inventada, y la cita literal no la salva.",
  },
  tarea_aplicable: {
    etiqueta: "Tarea aplicable al curso",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "El currículo no sostiene todas las tareas en todos los cursos. Generar una rúbrica donde el " +
      "decreto no escribe criterios es inventarlos, que es justo lo que el marco teórico proscribe.",
  },
  matriz_cuadrada: {
    etiqueta: "Matriz cuadrada",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una matriz cuantitativa se defiende con aritmética. Si los componentes no suman el total, o " +
      "falta la banda de 0, la nota que sale de ahí no se puede reconstruir delante de una familia.",
  },
  continuidad_bandas: {
    etiqueta: "Continuidad de bandas",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Si un componente cuenta incidencias, sus bandas tienen que cubrir todos los recuentos. " +
      "Cuando \"hasta 2 faltas\" salta a \"de 5 a 7\", el alumno con 3 faltas no tiene banda y el " +
      "corrector decide a ojo justo donde la matriz prometía aritmética: dos correctores dan dos " +
      "notas y ninguna se puede reconstruir. Los componentes que cuentan logros —fuentes reunidas, " +
      "apartados desarrollados— no siguen esa lógica y la regla no los mira.",
  },
  penalizacion_sin_tope: {
    etiqueta: "Penalización sin tope",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Una penalización sin tope convierte un fallo repetido en un suspenso automático y borra todo " +
      "lo que el alumno sí sabe hacer. El tope existe para que el instrumento siga midiendo la " +
      "competencia y no solo el descuido.",
  },
  doble_castigo: {
    etiqueta: "Doble castigo",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Si un componente ya valora un fenómeno, penalizarlo otra vez cobra dos veces por el mismo " +
      "error. Es el fallo que apareció simulando una corrección, no leyendo la matriz: por eso deja " +
      "las matrices casi sin penalizaciones, y eso es buena señal.",
  },
  reparto_pesos: {
    etiqueta: "Reparto de pesos",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "Una dimensión por encima del 40% decide sola la nota; por debajo del 5% no cambia nada y " +
      "solo alarga la corrección. El aviso no bloquea: el reparto lo decide el profesor.",
  },
  sostenibilidad: {
    etiqueta: "Sostenibilidad",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "Más de cinco dimensiones solo se sostiene en un producto final integrador. Por encima de ahí " +
      "la corrección se alarga y las dimensiones dejan de discriminar.",
  },
  pesos_curso: {
    etiqueta: "Pesos por curso",
    severidad: "aviso",
    fuente: "SDD §10",
    porQue:
      "Los pesos de un curso que no suman 100 en el pack funcionan igual, porque el motor " +
      "normaliza, pero esconden un descuadre al editar el contenido.",
  },
  razon_peso: {
    etiqueta: "Reparto desigual sin razón declarada",
    severidad: "aviso",
    fuente: "Marco Teórico §2.3",
    porQue:
      "El marco vigente fija ponderación igual por defecto: solo se desiguala si hay una razón " +
      "declarada. Un reparto desigual del que nadie sabe decir por qué es la mitad de una " +
      "reclamación ya escrita, y el alumno lo lee en la ficha antes de la prueba.",
  },
  materia_sin_lexico: {
    etiqueta: "Materia sin léxico propio",
    severidad: "error",
    fuente: "SDD §10",
    porQue:
      "Las reglas que dependen de la materia —qué nombres de dimensión son un saber y no una " +
      "acción, qué fórmulas del decreto sostienen una dimensión de proceso— solo existen para " +
      "las materias registradas. Un pack de una materia sin registrar no está validado: lo " +
      "parece, que es peor, porque nadie vuelve a mirarlo.",
  },
};

// Calificadores vagos, negaciones, modalizadores, umbrales: todo viene de
// data/reglas-lexicas.json. Aquí solo queda la LÓGICA.
//
// La adverbitis se busca en tres grupos según el MODO de coincidencia, y la
// distinción no es cosmética:
//
//   1) `subcadena` → término largo, buscado como subcadena. Así entran las
//      formas flexionadas: "bastantes", "regulares", "regularmente".
//   2) `palabra_completa` → término corto, con límites de palabra Unicode.
//      Buscarlos como subcadena daría falsos positivos: "mal" dentro de
//      "formal", "bien" dentro de "bienestar".
//   3) `multipalabra` → subcadena con espacios flexibles (\s+).
//
// scripts/validar_pack.py hace exactamente la misma partición sobre las
// mismas listas. Cuando cada lado tenía su copia, no la hacía: el script
// marcaba "bienestar" y la app no.
const ADVERBITIS_SUBCADENA = LEXICO.comun.adverbitis.subcadena;
const ADVERBITIS_PALABRA_COMPLETA = LEXICO.comun.adverbitis.palabra_completa;
const ADVERBITIS_MULTIPALABRA = LEXICO.comun.adverbitis.multipalabra;

// Un descriptor de nivel 1 describe lo que el alumno sí hace, de forma limitada.
const NEGACIONES = LEXICO.comun.negaciones;

// Palabras vacías del algoritmo de doble castigo.
const VACIAS = new Set(LEXICO.comun.palabras_vacias);

// Modalizadores del criterio (§3.4). Solo estas dos direcciones: las
// familias "sencillez" y "extensión" se descartaron deliberadamente (ver §5
// de la especificación del validador de la app antes de reintroducirlas).
const DISPARADORES_AYUDA = LEXICO.comun.modalizadores.disparadores_ayuda;
const MARCAS_ANDAMIAJE = LEXICO.comun.modalizadores.marcas_andamiaje;
const DISPARADORES_AUTONOMIA = LEXICO.comun.modalizadores.disparadores_autonomia;
const MARCAS_ANDAMIAJE_RESIDUAL = LEXICO.comun.modalizadores.marcas_andamiaje_residual;

// Cómo se lee un recuento escrito en la condición de una banda ("hasta 2
// faltas", "de 3 a 5 faltas", "8 o más faltas"). Las palabras vienen del JSON;
// la lógica de abajo es el puerto exacto de la de scripts/validar_pack.py.
const RECUENTO = LEXICO.comun.recuento_bandas;
const NUMERALES = RECUENTO.numerales;

const UMBRAL_SIMILITUD = LEXICO.comun.umbrales.similitud_maxima_entre_niveles;
const VENTANA_NEGACION = LEXICO.comun.umbrales.ventana_negacion_n1;
const TOPE_PENALIZACION = LEXICO.comun.umbrales.tope_penalizacion;

export const UMBRAL_DIMENSIONES = LEXICO.comun.umbrales.dimensiones_sostenibles;

// Léxico propio de la materia del pack. Si la materia no está registrada, el
// validador lo dice en vez de callarse: un pack de Matemáticas comprobado
// contra los saberes prohibidos de Lengua no está comprobado, solo lo parece.
function lexicoDeMateria(pack) {
  const bloque = LEXICO.por_materia[pack?.materia];
  if (bloque) return bloque;
  return {
    desconocida: true,
    saberes_prohibidos: [],
    formulas_proceso: [],
    generos: [],
  };
}

function primeraPalabra(texto) {
  const m = texto.trim().match(/^[¡¿]?([A-Za-zÁÉÍÓÚÑáéíóúñ]+)/);
  return m ? m[1] : "";
}

function escaparRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Límites de palabra con clase de letra Unicode: \b de JavaScript no separa
// bien con letras acentuadas (especificación del validador de la app, §2.1).
// Vale para los grupos 2 y 3: los términos de varias palabras necesitan el
// límite igual que los de una. Sin él, "el ord|en general| de la información"
// saltaba como "en general" (defecto corregido el 17-ago-2026). Lo único
// propio del grupo 3 son los espacios interiores flexibles.
function construirRegexTermino(termino) {
  const escapado = escaparRegex(termino).replace(/ /g, "\\s+");
  return new RegExp(`(?<![\\p{L}\\p{M}])${escapado}(?![\\p{L}\\p{M}])`, "iu");
}

// Se exporta solo para que scripts/comprobar_paridad.py pueda contrastarla,
// término a término, con la de validar_pack.py sobre un corpus de trampas.
// Es la función donde los dos validadores se separaron sin que nadie lo viera.
export function encontrarAdverbitis(texto) {
  const minus = texto.toLowerCase();
  const porSubcadena = ADVERBITIS_SUBCADENA.filter((termino) => minus.includes(termino));
  const porPalabraCompleta = ADVERBITIS_PALABRA_COMPLETA.filter((termino) =>
    construirRegexTermino(termino).test(texto)
  );
  const porMultipalabra = ADVERBITIS_MULTIPALABRA.filter((termino) =>
    construirRegexTermino(termino).test(texto)
  );
  return [...porSubcadena, ...porPalabraCompleta, ...porMultipalabra];
}

// Ventana de los primeros 45 caracteres, igual que validar_pack.py: no es
// "empieza por negación", es "la negación aparece cerca del principio".
function negacionEncontrada(texto) {
  const minus = " " + texto.toLowerCase();
  const ventana = minus.slice(0, VENTANA_NEGACION);
  for (const n of NEGACIONES) {
    if (ventana.includes(" " + n)) return n.trim();
  }
  return null;
}

// Palabras "\w" en sentido Unicode (letras, dígitos y guion bajo), igual que
// el re.findall(r"\w+", ...) de Python, que sí trata las tildes como letra.
function palabrasUnicode(texto) {
  const m = texto.toLowerCase().match(/[\p{L}\p{N}_]+/gu);
  return m ? new Set(m) : new Set();
}

// Rango Unicode de marcas diacríticas combinantes, construido a partir de
// los códigos de punto (0x0300-0x036f) para no incrustar el propio
// carácter combinante, invisible y frágil, dentro del código fuente.
const REGEX_DIACRITICOS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

function quitarTildes(str) {
  return str.normalize("NFD").replace(REGEX_DIACRITICOS, "");
}

// Texto antes del primer ':', '(' o '—' del nombre de la dimensión.
function cabezaDimension(nombre) {
  const posiciones = [":", "(", "—"]
    .map((sep) => nombre.indexOf(sep))
    .filter((i) => i !== -1);
  const corte = posiciones.length ? Math.min(...posiciones) : nombre.length;
  return nombre.slice(0, corte).trim();
}

// Regla: trazabilidad — criterio_oficial obligatorio (§5.2). Es "error de
// pack: no carga", así que se comprueba antes que ninguna otra.
function comprobarTrazabilidad(criterio) {
  const avisos = [];
  if (!criterio.criterio_oficial?.cita?.trim()) {
    avisos.push({
      regla: "trazabilidad",
      severidad: REGLAS.trazabilidad.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id}: no tiene criterio_oficial.cita. Un criterio sin referencia normativa no se carga.`,
    });
  }
  return avisos;
}

// Regla: verbo observable — el descriptor debe empezar por un verbo del
// banco (§5.3) y el campo `verbo` declarado debe ser el mismo que ese verbo
// (especificación del validador de la app, §2.2; paridad con validar_pack.py).
function comprobarVerboObservable(criterio, verbosPorForma) {
  const avisos = [];
  for (const nivel of ["n1", "n2", "n3", "n4"]) {
    const d = criterio.descriptores[nivel];
    if (!d) continue;
    const palabra = primeraPalabra(d.texto).toLowerCase();
    const verbo = verbosPorForma.get(palabra);
    if (!verbo) {
      avisos.push({
        regla: "verbo_observable",
        severidad: REGLAS.verbo_observable.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} (${nivel}): "${primeraPalabra(d.texto)}" no está en el banco cerrado de verbos.`,
      });
    } else if (verbo.id !== d.verbo) {
      avisos.push({
        regla: "verbo_observable",
        severidad: REGLAS.verbo_observable.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} (${nivel}): el verbo declarado ("${d.verbo}") no es el del texto ("${palabra}").`,
      });
    }
  }
  return avisos;
}

// Regla: gradación positiva — N1 no puede redactarse en negativo (§10, nota).
function comprobarGradacionPositiva(criterio) {
  const n1 = criterio.descriptores.n1;
  if (n1 && negacionEncontrada(n1.texto)) {
    return [{
      regla: "gradacion_positiva",
      severidad: REGLAS.gradacion_positiva.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id} (n1): describe lo que falta ("${n1.texto}") en vez de lo que el alumno sí hace de forma limitada.`,
    }];
  }
  return [];
}

// Regla: adverbitis — calificadores vagos sin anclaje, en cualquier nivel.
function comprobarAdverbitis(criterio) {
  const avisos = [];
  for (const nivel of ["n1", "n2", "n3", "n4"]) {
    const d = criterio.descriptores[nivel];
    if (!d) continue;
    const encontrados = encontrarAdverbitis(d.texto);
    if (encontrados.length) {
      avisos.push({
        regla: "adverbitis",
        severidad: REGLAS.adverbitis.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} (${nivel}): contiene calificador vago (${encontrados.join(", ")}) sin anclaje observable.`,
      });
    }
  }
  return avisos;
}

// Regla: adverbitis en banda — una condición de matriz debe ser contable,
// no una impresión (§10; especificación del validador de la app, §2.1).
function comprobarAdverbitisBanda(criterio) {
  const m = criterio.matriz_cuantitativa;
  if (!m) return [];
  const avisos = [];
  for (const comp of m.componentes) {
    for (const banda of comp.bandas) {
      const encontrados = encontrarAdverbitis(banda.condicion);
      if (encontrados.length) {
        avisos.push({
          regla: "adverbitis_banda",
          severidad: REGLAS.adverbitis_banda.severidad,
          criterioId: criterio.id,
          mensaje: `${criterio.id} / "${comp.nombre}": la condición de banda contiene un calificador vago (${encontrados.join(", ")}); la matriz deja de ser contable.`,
        });
      }
    }
  }
  return avisos;
}

// Regla: copia entre cursos — N2 a N4 textualmente idénticos en la misma
// dimensión entre dos cursos distintos. N1 queda exento (§10, nota).
function comprobarCopiaEntreCursos(criterios) {
  const avisos = [];
  const porDimension = new Map();
  for (const c of criterios) {
    const lista = porDimension.get(c.dimension) ?? [];
    lista.push(c);
    porDimension.set(c.dimension, lista);
  }
  for (const [dimension, lista] of porDimension) {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i], b = lista[j];
        if (a.curso === b.curso) continue;
        const iguales = ["n2", "n3", "n4"].every(
          (n) => a.descriptores[n]?.texto === b.descriptores[n]?.texto
        );
        if (iguales) {
          avisos.push({
            regla: "copia_entre_cursos",
            severidad: REGLAS.copia_entre_cursos.severidad,
            criterioId: `${a.id} / ${b.id}`,
            mensaje: `Dimensión "${dimension}": los descriptores N2-N4 de ${a.curso} y ${b.curso} son idénticos. Revisa si la progresión está realmente escalando.`,
          });
        }
      }
    }
  }
  return avisos;
}

// --- Recuentos escritos en una banda de matriz -----------------------------
// Puerto exacto del lector de scripts/validar_pack.py: mismas formas, mismo
// orden de reconocimiento y mismo resultado. Cada forma se traduce a un
// intervalo (desde, hasta), con hasta === null para la banda abierta.
function fichasDeCondicion(texto) {
  return quitarTildes(texto.toLowerCase()).match(/[\p{L}]+|\d+/gu) ?? [];
}

function numeroDeFicha(ficha) {
  if (ficha === undefined || ficha === null) return null;
  if (/^\d+$/.test(ficha)) return Number(ficha);
  return NUMERALES[ficha] ?? null;
}

// Longitud en fichas de `frase` si empieza en la posición i; 0 si no casa.
function casaFrase(fichas, i, frase) {
  const partes = frase.split(" ");
  return partes.every((p, k) => fichas[i + k] === p) ? partes.length : 0;
}

// Singular aproximado, para casar "error" con "errores" y "frase" con "frases":
// se quita la -s final y después la -e. No acierta con "vez/veces", y el fallo
// va en la dirección segura — dos raíces distintas no forman escala, así que la
// regla calla en vez de inventarse un hueco.
function raizDeCosa(palabra) {
  let p = palabra;
  if (p.endsWith("s")) p = p.slice(0, -1);
  if (p.endsWith("e")) p = p.slice(0, -1);
  return p;
}

// Lo que se cuenta, saltando artículos, preposiciones y otros números: en
// "1 de los tres procedimientos falla" lo contado son procedimientos.
function cosaContada(fichas, i) {
  let j = i;
  let saltos = 0;
  while (
    j < fichas.length && saltos < 4 &&
    (RECUENTO.palabras_no_contables.includes(fichas[j]) || numeroDeFicha(fichas[j]) !== null)
  ) {
    j++;
    saltos++;
  }
  return j < fichas.length ? raizDeCosa(fichas[j]) : null;
}

// Map de cosa contada → [desde, hasta]. De cada cosa se queda el PRIMER
// recuento: si una banda la cuenta dos veces, manda el que se lee antes, que es
// el que da nombre a la banda.
export function recuentosDeBanda(condicion) {
  const fichas = fichasDeCondicion(condicion);
  const hallados = new Map();
  const anotar = (j, desde, hasta) => {
    const cosa = cosaContada(fichas, j);
    if (cosa && !hallados.has(cosa)) hallados.set(cosa, [desde, hasta]);
  };

  let i = 0;
  while (i < fichas.length) {
    const n = numeroDeFicha(fichas[i]);
    let paso = 0;

    for (const [inicio, fin] of RECUENTO.rangos) {            // "de 3 a 5 faltas"
      if (fichas[i] === inicio && numeroDeFicha(fichas[i + 1]) !== null &&
          fichas[i + 2] === fin && numeroDeFicha(fichas[i + 3]) !== null) {
        anotar(i + 4, numeroDeFicha(fichas[i + 1]), numeroDeFicha(fichas[i + 3]));
        paso = 4;
        break;
      }
    }

    const antepuestos = [
      ["hasta", (v) => [0, v]],            // "hasta 2 faltas"
      ["mas_de", (v) => [v + 1, null]],    // "más de 2 faltas"
      ["al_menos", (v) => [v, null]],      // "al menos 2 faltas"
    ];
    for (const [clave, tramo] of antepuestos) {
      if (paso) break;
      for (const termino of RECUENTO[clave]) {
        const k = casaFrase(fichas, i, termino);
        const valor = k ? numeroDeFicha(fichas[i + k]) : null;
        if (k && valor !== null) {
          anotar(i + k + 1, ...tramo(valor));
          paso = k + 1;
          break;
        }
      }
    }

    if (!paso && n !== null) {                                // "8 o más faltas"
      for (const termino of RECUENTO.o_mas) {
        const k = casaFrase(fichas, i + 1, termino);
        if (k) {
          anotar(i + 1 + k, n, null);
          paso = 1 + k;
          break;
        }
      }
    }

    if (!paso && n !== null) {                                // "2 o 3 errores"
      for (const termino of RECUENTO.alternativa) {
        const k = casaFrase(fichas, i + 1, termino);
        const segundo = k ? numeroDeFicha(fichas[i + 1 + k]) : null;
        if (k && segundo !== null) {
          anotar(i + 2 + k, n, segundo);
          paso = 2 + k;
          break;
        }
      }
    }

    if (!paso) {                                              // "sin errores de..."
      for (const termino of RECUENTO.ninguno) {
        const k = casaFrase(fichas, i, termino);
        if (k) {
          anotar(i + k, 0, 0);
          paso = k;
          break;
        }
      }
    }

    if (!paso && n !== null) {                                // "2 faltas"
      anotar(i + 1, n, n);
      paso = 1;
    }

    i += paso || 1;
  }

  return hallados;
}

// Lo que el componente cuenta COMO INCIDENCIA, con sus tramos.
//
// Ningún pack declara si un componente cuenta incidencias o logros: se lee de la
// propia matriz. Si la cuenta SUBE según BAJAN los puntos, lo contado es una
// incidencia (faltas, errores, datos ajenos al tema). Si baja, es un logro
// (fuentes reunidas, apartados desarrollados, recursos localizados) y la
// continuidad no significa nada ahí: "4 o más fuentes / 3 / 2 / 1" no deja
// ningún hueco por no decir qué pasa con 5.
//
// Se lee en el orden en que están escritas las bandas, que es el de puntos
// descendentes porque matriz_cuadrada ya lo exige: si estuvieran desordenadas, el
// pack falla antes por esa regla.
function escalasDeIncidencia(componente) {
  const candidatas = new Map();
  componente.bandas.forEach((banda, indice) => {
    for (const [cosa, [desde, hasta]] of recuentosDeBanda(banda.condicion)) {
      if (!candidatas.has(cosa)) candidatas.set(cosa, []);
      candidatas.get(cosa).push([indice, desde, hasta]);
    }
  });

  const escalas = [];
  for (const cosa of [...candidatas.keys()].sort()) {
    const tramos = candidatas.get(cosa);
    if (tramos.length < 2) continue;
    const desdes = tramos.map(([, desde]) => desde);
    // La cuenta baja: es un logro, no una incidencia.
    if (desdes.some((d, k) => k < desdes.length - 1 && d > desdes[k + 1])) continue;
    // No sube nunca: no hay escala que comprobar.
    if (desdes[desdes.length - 1] <= desdes[0]) continue;
    escalas.push([cosa, tramos]);
  }
  return escalas;
}

// Recuentos que ninguna banda recoge. Tres maneras de dejar uno fuera: entre dos
// bandas seguidas, por debajo de la primera y por encima de la última.
//
// Una banda SIN recuento no es un hueco: es la casilla de recogida del corrector
// ("Errores sistemáticos que obligan a reconstruir el sentido") y cubre lo que la
// escala no nombra. Por eso el arranque solo se exige si la escala empieza en la
// primera banda, y el cierre solo si termina en la última.
function huecosDeEscala(componente, tramos) {
  const huecos = [];
  for (let k = 0; k < tramos.length - 1; k++) {
    const [indiceA, , hastaA] = tramos[k];
    const [indiceB, desdeB] = tramos[k + 1];
    if (indiceB === indiceA + 1 && hastaA !== null && desdeB > hastaA + 1) {
      huecos.push([hastaA + 1, desdeB - 1]);
    }
  }
  const primero = tramos[0];
  const ultimo = tramos[tramos.length - 1];
  if (primero[0] === 0 && primero[1] > 0) huecos.push([0, primero[1] - 1]);
  if (ultimo[0] === componente.bandas.length - 1 && ultimo[2] !== null) {
    huecos.push([ultimo[2] + 1, null]);
  }
  return huecos;
}

function textoDeHueco([desde, hasta]) {
  if (hasta === null) return `${desde} o más`;
  return desde === hasta ? `${desde}` : `de ${desde} a ${hasta}`;
}

// Regla: continuidad de bandas (§10, §6.3). Un componente que cuenta incidencias
// cubre todos los recuentos posibles; si deja uno fuera, el corrector se queda
// sin banda que aplicar justo donde la matriz prometía aritmética.
function comprobarContinuidadBandas(criterio) {
  const m = criterio.matriz_cuantitativa;
  if (!m) return [];
  const avisos = [];
  for (const comp of m.componentes) {
    for (const [cosa, tramos] of escalasDeIncidencia(comp)) {
      const huecos = huecosDeEscala(comp, tramos);
      if (!huecos.length) continue;
      avisos.push({
        regla: "continuidad_bandas",
        severidad: REGLAS.continuidad_bandas.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} / "${comp.nombre}": el componente cuenta ${cosa} y sus bandas dejan fuera ${huecos.map(textoDeHueco).join(" y ")}; con ese recuento no hay banda que aplicar.`,
      });
    }
  }
  return avisos;
}

// Regla: matriz cuadrada (§10): componentes que no suman el total, bandas
// desordenadas, banda máxima que no coincide con el máximo del componente,
// falta de la banda de 0 y puntuaciones repetidas.
function comprobarMatrizCuadrada(criterio) {
  const m = criterio.matriz_cuantitativa;
  if (!m) return [];
  const avisos = [];
  const sumaMax = m.componentes.reduce((s, c) => s + c.max, 0);
  if (sumaMax !== m.total) {
    avisos.push({
      regla: "matriz_cuadrada",
      severidad: REGLAS.matriz_cuadrada.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id}: los componentes suman ${sumaMax} y el total declarado es ${m.total}.`,
    });
  }
  for (const comp of m.componentes) {
    const puntos = comp.bandas.map((b) => b.puntos);

    // Bandas desordenadas (especificación del validador de la app, §2.4).
    const ordenDescendente = [...puntos].sort((a, b) => b - a);
    if (puntos.some((p, i) => p !== ordenDescendente[i])) {
      avisos.push({
        regla: "matriz_cuadrada",
        severidad: REGLAS.matriz_cuadrada.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} / "${comp.nombre}": las bandas no van de más a menos puntos ([${puntos.join(", ")}]).`,
      });
    }

    const maxBanda = Math.max(...puntos);
    if (maxBanda !== comp.max) {
      avisos.push({
        regla: "matriz_cuadrada",
        severidad: REGLAS.matriz_cuadrada.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} / "${comp.nombre}": la banda más alta vale ${maxBanda} y el máximo del componente es ${comp.max}.`,
      });
    }
    if (!puntos.includes(0)) {
      avisos.push({
        regla: "matriz_cuadrada",
        severidad: REGLAS.matriz_cuadrada.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} / "${comp.nombre}": falta la banda de 0 puntos.`,
      });
    }
    const repetidos = puntos.filter((p, i) => puntos.indexOf(p) !== i);
    if (repetidos.length) {
      avisos.push({
        regla: "matriz_cuadrada",
        severidad: REGLAS.matriz_cuadrada.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} / "${comp.nombre}": puntuaciones repetidas entre bandas (${[...new Set(repetidos)].join(", ")}).`,
      });
    }
  }
  return avisos;
}

// Regla: penalización sin tope (§10, §6.3).
function comprobarPenalizacionSinTope(criterio) {
  const m = criterio.matriz_cuantitativa;
  if (!m?.penalizaciones?.length) return [];
  const avisos = [];
  let sumaTopesAbs = 0;
  for (const pen of m.penalizaciones) {
    if (typeof pen.tope !== "number") {
      avisos.push({
        regla: "penalizacion_sin_tope",
        severidad: REGLAS.penalizacion_sin_tope.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id}: la penalización "${pen.clave}" no declara tope.`,
      });
      continue;
    }
    if (pen.tope > 0) {
      avisos.push({
        regla: "penalizacion_sin_tope",
        severidad: REGLAS.penalizacion_sin_tope.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id}: la penalización "${pen.clave}" tiene tope positivo (${pen.tope}); debe ser negativo.`,
      });
      continue;
    }
    const limiteTope = m.total * TOPE_PENALIZACION;
    if (Math.abs(pen.tope) > limiteTope) {
      avisos.push({
        regla: "penalizacion_sin_tope",
        severidad: REGLAS.penalizacion_sin_tope.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id}: el tope de "${pen.clave}" (${pen.tope}) supera el ${Math.round(TOPE_PENALIZACION * 100)}% de la dimensión (máx. ${-limiteTope.toFixed(1)}).`,
      });
    }
    sumaTopesAbs += Math.abs(pen.tope);
  }
  if (sumaTopesAbs > m.total / 2) {
    avisos.push({
      regla: "penalizacion_sin_tope",
      severidad: REGLAS.penalizacion_sin_tope.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id}: la suma de topes de penalización (${sumaTopesAbs.toFixed(1)}) puede restar más de la mitad de la dimensión.`,
    });
  }
  return avisos;
}

// Regla: doble castigo (§6.3; especificación del validador de la app, §3.1).
// Puerto exacto del algoritmo de validar_pack.py: el solape se busca como
// subcadena, no como palabra completa, para que "puntuación" case con
// "puntuacional" y con las formas flexionadas.
function comprobarDobleCastigo(criterio) {
  const m = criterio.matriz_cuantitativa;
  if (!m?.penalizaciones?.length) return [];
  const avisos = [];
  for (const pen of m.penalizaciones) {
    const terminos = [...palabrasUnicode(`${pen.clave} ${pen.por}`)].filter(
      (w) => w.length > 4 && !VACIAS.has(w)
    );
    for (const comp of m.componentes) {
      const bandas = comp.bandas.map((b) => b.condicion).join(" ").toLowerCase();
      const solapa = terminos.filter((t) => bandas.includes(t)).sort();
      if (solapa.length >= 2) {
        avisos.push({
          regla: "doble_castigo",
          severidad: REGLAS.doble_castigo.severidad,
          criterioId: criterio.id,
          mensaje: `${criterio.id}: DOBLE CASTIGO — la penalización "${pen.clave}" repite lo que ya mide el componente "${comp.nombre}" (${solapa.slice(0, 3).join(", ")}).`,
        });
      }
    }
  }
  return avisos;
}

// Regla: niveles indistinguibles (§10; especificación del validador de la
// app, §3.2). Índice de Jaccard sobre el vocabulario de cada par de niveles
// contiguos; por encima de 0,75 dos niveles solo se diferencian en un
// adorno, no en el objeto ni en la condición.
function comprobarNivelesIndistinguibles(criterio) {
  const niveles = ["n1", "n2", "n3", "n4"].map((n) => criterio.descriptores[n]?.texto ?? "");
  const avisos = [];
  for (let i = 0; i < 3; i++) {
    const a = palabrasUnicode(niveles[i]);
    const b = palabrasUnicode(niveles[i + 1]);
    const union = new Set([...a, ...b]);
    if (union.size === 0) continue;
    const interseccion = [...a].filter((w) => b.has(w)).length;
    const jaccard = interseccion / union.size;
    if (jaccard > UMBRAL_SIMILITUD) {
      avisos.push({
        regla: "niveles_indistinguibles",
        severidad: REGLAS.niveles_indistinguibles.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id} (n${i + 1}/n${i + 2}): los dos niveles comparten el ${Math.round(jaccard * 100)}% del vocabulario; revisa qué los distingue además del adverbio.`,
      });
    }
  }
  return avisos;
}

// Regla: saber como vehículo (§10; especificación del validador de la app,
// §3.3). La dimensión es una acción competencial, no un contenido: se
// comprueba la cabeza del nombre (antes de ":", "(" o "—").
function comprobarSaberVehiculo(criterio, materia) {
  const cabeza = cabezaDimension(criterio.nombre);
  const avisos = [];

  if (/^(el|la|los|las|un|una|lo)\s/i.test(cabeza)) {
    avisos.push({
      regla: "saber_vehiculo",
      severidad: REGLAS.saber_vehiculo.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id}: el nombre de la dimensión ("${criterio.nombre}") empieza por un artículo: nombra un contenido, no una acción competencial.`,
    });
  }

  if (materia.saberes_prohibidos.includes(quitarTildes(cabeza.toLowerCase()))) {
    avisos.push({
      regla: "saber_vehiculo",
      severidad: REGLAS.saber_vehiculo.severidad,
      criterioId: criterio.id,
      mensaje: `${criterio.id}: "${cabeza}" es un saber, no una dimensión. Los saberes son vehículo: van dentro del descriptor, no abren fila.`,
    });
  }

  return avisos;
}

// Regla: modalizadores del criterio (§10; especificación del validador de la
// app, §3.4). Dos direcciones y nada más: la ayuda declarada en la cita debe
// aparecer en la rúbrica (dirección A) y el andamiaje del curso anterior no
// puede sobrevivir a un criterio que ya pide autonomía (dirección B).
function comprobarModalizadores(criterio) {
  const cita = criterio.criterio_oficial?.cita;
  if (!cita) return [];
  const avisos = [];
  const citaNorm = quitarTildes(cita.toLowerCase());

  const disparadorAyuda = DISPARADORES_AYUDA.find((d) => citaNorm.includes(d));
  if (disparadorAyuda) {
    const textoDescriptores = quitarTildes(
      ["n1", "n2", "n3", "n4"]
        .map((n) => criterio.descriptores[n]?.texto ?? "")
        .join(" ")
        .toLowerCase()
    );
    const tieneAndamiaje = MARCAS_ANDAMIAJE.some((marca) => textoDescriptores.includes(marca));
    if (!tieneAndamiaje) {
      avisos.push({
        regla: "modalizadores",
        severidad: REGLAS.modalizadores.severidad,
        criterioId: criterio.id,
        mensaje: `${criterio.id}: el criterio ${criterio.criterio_oficial.codigo} de ${criterio.curso} evalúa "${disparadorAyuda}" y ningún descriptor nombra la ayuda. Si la pauta forma parte de la condición de desempeño, el alumno tiene que leerla en la rúbrica.`,
      });
    }
  }

  const disparadorAutonomia = DISPARADORES_AUTONOMIA.find((d) => citaNorm.includes(d));
  if (disparadorAutonomia) {
    for (const nivel of ["n1", "n2", "n3", "n4"]) {
      const d = criterio.descriptores[nivel];
      if (!d) continue;
      const textoNorm = quitarTildes(d.texto.toLowerCase());
      const marca = MARCAS_ANDAMIAJE_RESIDUAL.find((m) => textoNorm.includes(m));
      if (marca) {
        avisos.push({
          regla: "modalizadores",
          severidad: REGLAS.modalizadores.severidad,
          criterioId: criterio.id,
          mensaje: `${criterio.id}: el criterio ${criterio.criterio_oficial.codigo} ya pide autonomía y el descriptor ${nivel} mantiene el andamiaje del curso anterior ("${marca}").`,
        });
      }
    }
  }

  return avisos;
}

// Regla: dimensión de proceso sin respaldo (§10). `evalua_proceso` decide
// qué se premarca en la puerta de "fase de un texto" (§8), así que responde
// a la misma exigencia que todo lo demás: el criterio es la puerta. Se
// comprueba en una sola dirección, la que se puede sostener con la cita —
// que lo declarado de proceso lo esté por escrito.
//
// La dirección contraria (una dimensión de proceso sin declarar) no es
// automatizable y por eso no se intenta: el 5.1 de Murcia habla de
// planificar y de borradores, pero sostiene también la adecuación y la
// cohesión del texto terminado. Deducir de la cita qué dimensiones son de
// proceso marcaría media rúbrica, que es el mismo error de los
// modalizadores de sencillez descartados en la nota de §10.
function comprobarProcesoRespaldado(criterio, materia) {
  if (!criterio.evalua_proceso) return [];
  const citaNorm = quitarTildes((criterio.criterio_oficial?.cita ?? "").toLowerCase());
  if (materia.formulas_proceso.some((f) => citaNorm.includes(f))) return [];
  return [{
    regla: "proceso_sin_respaldo",
    severidad: REGLAS.proceso_sin_respaldo.severidad,
    criterioId: criterio.id,
    mensaje: `${criterio.id}: se declara dimensión de proceso y el criterio ${criterio.criterio_oficial?.codigo} de ${criterio.curso} no habla de planificar, de borradores ni de revisar.`,
  }];
}

// Regla: dimensión cuyo objeto el criterio no nombra (§10). Misma forma que
// `proceso_sin_respaldo` y por la misma razón: si el criterio oficial no pide
// eso, la dimensión no se deriva del currículo, se inventa.
//
// Qué dimensiones y con qué términos sale de data/reglas-lexicas.json, no de
// aquí: es vocabulario de la materia, y dar de alta una materia no debe obligar
// a tocar código. Lo escribió la fila de reacción a una noticia: la competencia
// 4 evalúa "la idoneidad del canal utilizado" en 2.º ESO y en 1.º Bach y lo deja
// fuera en 4.º ESO y en 2.º Bach, y sin esta regla una dimensión de canal en
// esos dos cursos pasaba limpia, con su cita literal y del curso correcto.
function comprobarDimensionRespaldada(criterio, materia) {
  const exigidos = (materia.dimensiones_con_respaldo ?? {})[criterio.dimension];
  if (!exigidos) return [];
  const citaNorm = quitarTildes((criterio.criterio_oficial?.cita ?? "").toLowerCase());
  if (exigidos.some((t) => citaNorm.includes(t))) return [];
  return [{
    regla: "dimension_sin_respaldo",
    severidad: REGLAS.dimension_sin_respaldo.severidad,
    criterioId: criterio.id,
    mensaje: `${criterio.id}: la dimensión '${criterio.dimension}' evalúa algo que el criterio ${criterio.criterio_oficial?.codigo} de ${criterio.curso} no nombra (ninguno de: ${exigidos.join(", ")}).`,
  }];
}

// Regla: tarea aplicable al curso (§10; especificación del validador de la
// app, §3.5), a nivel de pack. El caso de 0 criterios ya lo cubre el motor
// devolviendo ok:false; aquí se avisa de las combinaciones que sobreviven
// con muy poco sostén curricular.
function comprobarTareaAplicable(criterios) {
  const combos = new Map();
  for (const c of criterios) {
    for (const tipoTarea of c.tipos_tarea) {
      const clave = `${c.curso}|${tipoTarea}`;
      if (!combos.has(clave)) combos.set(clave, { curso: c.curso, tipoTarea, lista: [] });
      combos.get(clave).lista.push(c);
    }
  }
  const avisos = [];
  for (const { curso, tipoTarea, lista } of combos.values()) {
    if (lista.length < 3) {
      avisos.push({
        regla: "tarea_aplicable",
        severidad: REGLAS.tarea_aplicable.severidad,
        criterioId: "(pack)",
        mensaje: `${curso} · ${tipoTarea}: la combinación se sostiene con solo ${lista.length} dimensión(es). §4.3 la marcaría como incipiente: comprueba que el currículo del curso la ampara.`,
      });
    }
    if (!lista.some((c) => c.prioridad === 1)) {
      avisos.push({
        regla: "tarea_aplicable",
        severidad: REGLAS.tarea_aplicable.severidad,
        criterioId: "(pack)",
        mensaje: `${curso} · ${tipoTarea}: ninguna dimensión es de prioridad 1, así que con poco tiempo de corrección el instrumento se queda vacío.`,
      });
    }
  }
  return avisos;
}

// Regla: pesos por curso (§10; especificación del validador de la app, §3.6),
// a nivel de pack.
function comprobarPesosCurso(criterios) {
  const pesos = new Map();
  for (const c of criterios) {
    pesos.set(c.curso, (pesos.get(c.curso) ?? 0) + c.peso_base);
  }
  const avisos = [];
  for (const [curso, total] of pesos) {
    if (total !== 100) {
      avisos.push({
        regla: "pesos_curso",
        severidad: REGLAS.pesos_curso.severidad,
        criterioId: "(pack)",
        mensaje: `los pesos de ${curso} suman ${total}, no 100 (el motor normaliza, pero conviene cuadrarlo)`,
      });
    }
  }
  return avisos;
}

// Regla: reparto desigual sin razón declarada (Marco Teórico §2.3), a nivel de
// pack. Se mira por curso porque es donde el reparto tiene sentido —cada curso
// arma su instrumento con sus dimensiones—, pero se avisa una sola vez: el
// contenido que falta es uno, `razon_peso`, no uno por curso.
function comprobarRazonPeso(pack) {
  if (pack.razon_peso) return [];

  const porCurso = new Map();
  for (const c of pack.criterios) {
    if (!porCurso.has(c.curso)) porCurso.set(c.curso, []);
    porCurso.get(c.curso).push(c.peso_base);
  }

  const desiguales = [...porCurso.entries()]
    .filter(([, pesos]) => pesos.length > 1 && new Set(pesos).size > 1)
    .map(([curso]) => curso);

  if (desiguales.length === 0) return [];

  return [
    {
      regla: "razon_peso",
      severidad: REGLAS.razon_peso.severidad,
      criterioId: "(pack)",
      mensaje:
        `el reparto de pesos no es igual (${desiguales.join(", ")}) y el pack no declara ` +
        "`razon_peso`: el marco teórico pide ponderación igual por defecto y razón escrita para desigualarla",
    },
  ];
}

// Recorre todo el pack (todas las combinaciones curso × tipo de tarea que
// contenga) y devuelve el informe completo. Pensado para ejecutarse una vez
// al cargar el pack, como diagnóstico de salud del contenido.
export function validarPack(pack) {
  const verbosPorForma = new Map(pack.verbos.map((v) => [v["3s"].toLowerCase(), v]));
  const materia = lexicoDeMateria(pack);
  const avisos = [];

  // Una materia sin bloque en data/reglas-lexicas.json se avisa en la propia
  // vista de salud del pack, no se ignora: sus reglas dependientes de materia
  // —saberes prohibidos, fórmulas de proceso— no se han podido aplicar.
  if (materia.desconocida) {
    avisos.push({
      regla: "materia_sin_lexico",
      severidad: REGLAS.materia_sin_lexico.severidad,
      criterioId: "(pack)",
      mensaje: `La materia "${pack.materia}" no está registrada en data/reglas-lexicas.json: las reglas que dependen de la materia no se han comprobado en este pack.`,
    });
  }

  for (const criterio of pack.criterios) {
    avisos.push(...comprobarTrazabilidad(criterio));
    if (criterio.criterio_oficial?.cita) {
      avisos.push(...comprobarVerboObservable(criterio, verbosPorForma));
      avisos.push(...comprobarGradacionPositiva(criterio));
      avisos.push(...comprobarAdverbitis(criterio));
      avisos.push(...comprobarAdverbitisBanda(criterio));
      avisos.push(...comprobarMatrizCuadrada(criterio));
      avisos.push(...comprobarContinuidadBandas(criterio));
      avisos.push(...comprobarPenalizacionSinTope(criterio));
      avisos.push(...comprobarDobleCastigo(criterio));
      avisos.push(...comprobarNivelesIndistinguibles(criterio));
      avisos.push(...comprobarSaberVehiculo(criterio, materia));
      avisos.push(...comprobarModalizadores(criterio));
      avisos.push(...comprobarProcesoRespaldado(criterio, materia));
      avisos.push(...comprobarDimensionRespaldada(criterio, materia));
    }
  }
  avisos.push(...comprobarCopiaEntreCursos(pack.criterios));
  avisos.push(...comprobarTareaAplicable(pack.criterios));
  avisos.push(...comprobarPesosCurso(pack.criterios));
  avisos.push(...comprobarRazonPeso(pack));

  return {
    avisos,
    nErrores: avisos.filter((a) => a.severidad === "error").length,
    nAvisos: avisos.filter((a) => a.severidad === "aviso").length,
  };
}

// Regla: reparto de pesos (§10) — se comprueba sobre los pesos ya
// normalizados de un instrumento concreto, no sobre el pack entero, porque
// el reparto depende de qué dimensiones sobrevivan al filtro de profundidad.
export function comprobarRepartoPesos(criteriosPonderados) {
  const avisos = [];
  // Con una sola dimensión no hay reparto que valorar: el 100% no es una
  // decisión discutible del profesor, es aritmética. Avisar ahí convierte la
  // regla en ruido justo en el instrumento donde una dimensión sola es lo
  // esperado — la fase de un texto (§8.1).
  if (criteriosPonderados.length < 2) return avisos;
  for (const c of criteriosPonderados) {
    if (c.peso_normalizado > 40) {
      avisos.push(`"${c.nombre}" concentra el ${c.peso_normalizado}% del instrumento (por encima del 40%).`);
    } else if (c.peso_normalizado < 5) {
      avisos.push(`"${c.nombre}" pesa solo el ${c.peso_normalizado}% (por debajo del 5%).`);
    }
  }
  return avisos;
}

// Regla: sostenibilidad (§10; especificación del validador de la app, §3.7).
// Única implementación del umbral y del texto: motor.js la importa para
// componer el indicador de complejidad en vez de duplicarlos (validador.js
// no puede importar motor.js: sería dependencia circular).
export function comprobarSostenibilidad(criterios, esProductoFinal) {
  if (criterios.length > UMBRAL_DIMENSIONES && !esProductoFinal) {
    return "Este instrumento supera las 5 dimensiones recomendadas y la tarea no es un producto final integrador. Considera reducir el alcance o dividir la evaluación.";
  }
  return null;
}
