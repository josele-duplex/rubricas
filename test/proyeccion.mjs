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

import { primeraPersona, generarAutoevaluacion } from "../js/motor.js";
import { LEXICO } from "../js/lexico.js";
import { cargarPack as cargar, CATALOGO } from "./cargar.mjs";

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

// Límite conocido del motor, no un fallo suyo: si un descriptor usa como
// sustantivo una palabra que en el banco es verbo ("la estructura del texto",
// "un modelo de cita bibliográfica"), la reconjugación la trata como verbo y
// escribe "la estructuro del texto". Distinguirlo exigiría analizar la frase,
// que es justo lo que reconjugarSecundarios no hace. La decisión, al barrer la
// regla 1 de la decisión 15 (v1.22), fue arreglarlo en el contenido —los
// descriptores ya no usan esas palabras como nombre— y dejar aquí pinchado el
// comportamiento, para que nadie intente "arreglar" el motor y rompa de paso
// los usos legítimos ("y la explica con sus propias palabras", donde "la" es
// pronombre y no artículo, y la reconjugación sí debe ocurrir).
caso("primeraPersona: un verbo del banco usado como sustantivo se reconjuga igual (límite conocido)", () => {
  const resultado = primeraPersona(
    "Elabora un esquema previo propio con la estructura del texto.",
    "elabora",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Elaboro un esquema previo propio con la estructuro del texto.",
    "el motor no distingue el sustantivo del verbo: se arregla escribiendo el descriptor de otro modo"
  );
});

// Por qué "repite" NO está en el banco, aunque es verbo inequívoco y aparece
// cinco veces con el alumno como sujeto: en el pack argumentativo el sujeto es
// otro —"con un cierre QUE LA repite con las mismas palabras"— y el guardarraíl
// `(?<!\bque )` no lo tapa, porque delante hay "la", no "que". Declararlo
// habría escrito "que la repito con las mismas palabras" en un pack ya
// validado, que es lo que prohíbe el corolario de simetría de CLAUDE.md. Es el
// mismo caso que "sigue" en la v1.22, y por eso los cinco descriptores del oral
// y de narración se arreglaron reescribiéndolos (v1.23, decisión 16(a)).
caso("primeraPersona: 'repite' se queda en 3.ª persona porque su sujeto es el cierre, no el alumno", () => {
  const resultado = primeraPersona(
    "Formula la tesis en la introducción y desarrolla cada argumento en su propio párrafo, con un cierre que la repite con las mismas palabras.",
    "formula",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Formulo la tesis en la introducción y desarrollo cada argumento en su propio párrafo, con un cierre que la repite con las mismas palabras.",
    "declarar 'repite' en el banco rompería este descriptor del pack argumentativo"
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

// El frente (b) de la decisión 16 de §17, pinchado por las dos caras. La
// redacción de la izquierda es la que llevaban los packs hasta la v1.23 y la de
// la derecha la que se escribió al barrerla: el idioma equivalente sin posesivo
// ("por cuenta propia", "con palabras propias", el artículo en "a las notas")
// dice lo mismo y proyecta en las dos personas. No hay nada que arreglar en el
// motor —ningún verbo está mal conjugado en la versión defectuosa—, y por eso el
// caso se escribe aquí y no como una excepción de reconjugarSecundarios.
caso("primeraPersona: el posesivo del alumno imprime «él» dentro de la frase en «yo» (defecto de la decisión 16(b))", () => {
  const resultado = primeraPersona(
    "Revisa el borrador por su cuenta y corrige problemas de puntuación y de conexión entre párrafos.",
    "revisa",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Reviso el borrador por su cuenta y corrijo problemas de puntuación y de conexión entre párrafos.",
    "el motor conjuga bien los dos verbos y aun así la frase mezcla los dos sujetos: el defecto no vive en el verbo"
  );
});

caso("primeraPersona: 'por cuenta propia' dice lo mismo y proyecta sin cambiar de sujeto", () => {
  const resultado = primeraPersona(
    "Revisa el borrador por cuenta propia y corrige problemas de puntuación y de conexión entre párrafos.",
    "revisa",
    verbosPorId
  );
  assertIgual(
    resultado,
    "Reviso el borrador por cuenta propia y corrijo problemas de puntuación y de conexión entre párrafos.",
    "la reescritura del contenido es lo que arregla el frente (b), no una regla nueva del motor"
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

// Los packs sobre los que corren los dos invariantes NO son una lista escrita
// aquí: son todos los del catálogo (decisión 18 de §17). Una lista propia es
// opt-in, y un opt-in se olvida —el oral estuvo fuera sin motivo escrito hasta
// la v1.22, y el de resumen hasta la v1.29—, mientras que derivarla de
// data/catalogo.json hace que un pack nuevo entre por definición: dejar uno
// fuera exigiría borrarlo del catálogo, que es la aplicación entera.
const PACKS = CATALOGO.packs.map((p) => p.archivo.replace(/^data\//, ""));
if (PACKS.length === 0) throw new Error("data/catalogo.json no declara ningún pack: los invariantes no mirarían nada");

// Invariante fuerte: ningún nivel debe conservar un verbo del banco todavía
// en 3.ª persona. Es la comprobación que habría atrapado el fallo del "se
// dirige" antes de llegar al navegador. Recorre TODOS los cursos y tipos de
// tarea de cada pack, no solo un par de ofertas: hasta la v1.19 estaba
// cableado al expositivo y de ahí salieron los ocho verbos que faltaban en el
// banco del argumentativo (registro de cambios v1.13).
//
// QUÉ SEÑALA EN REALIDAD, que es lo que resolvió la decisión 18. Barridos los
// seis packs, los cinco restos van detrás de «que», sin una sola excepción, y
// no es casualidad: el motor sustituye toda forma del banco salvo la que sigue
// a «que» (el guardarraíl `(?<!\bque )` de reconjugarSecundarios), así que lo
// único que puede quedar en 3.ª persona es justo eso. El invariante no duplica
// el guardarraíl: vigila la ÚNICA zona donde el motor adivina sin poder
// analizar la frase. Casi siempre acierta —"una introducción QUE delimita el
// tema"—, y cuando no —"las ideas QUE selecciona del texto", con el alumno de
// sujeto— imprime «él» dentro de una frase en «yo». Por eso la salida (b) que
// la decisión sopesaba (enseñarle el guardarraíl al invariante) se descartó:
// no lo habría hecho más silencioso, lo habría dejado incapaz de fallar.
//
// Las excepciones se firman en `sujetos_ajenos` (data/reglas-lexicas.json, por
// materia) y no en este archivo, igual que los posesivos de la v1.24: cada
// entrada lleva escrito el referente, y así un pack nuevo —y con él una
// materia nueva— no obliga a tocar código (docs/diseno/anadir-una-materia.md).
// Lo que no esté firmado, para el test.
//
// Lo que este invariante NO cubre: un verbo en 3.ª persona con el alumno como
// sujeto que no esté en el banco (p. ej. "y dedica un párrafo a cada aspecto")
// pasa sin ruido, porque solo se buscan las formas del banco. Ese barrido es
// la regla 1 de la decisión 15 y se hace leyendo los descriptores proyectados:
// no da un booleano, igual que `simular_correccion.py`. Está pasado sobre los
// seis packs: el expositivo y el argumentativo en la v1.22, el oral y el de
// narración en la v1.23 (decisión 16(a)), el comentario en la v1.25 y el
// resumen en la v1.28.
//
// El frente (b) de la decisión 16 —el posesivo y el dativo de 3.ª persona, que
// no viven en un verbo— lo cubre el segundo invariante, más abajo.
//
// La frontera se escribe con `\b`, y no con `\p{L}` como la del invariante de
// posesivos, a propósito: este tiene que ver EXACTAMENTE lo que vio el motor,
// que también usa `\b`. Un resto que el motor no pudo tocar y este no viera
// sería un descriptor mal proyectado pasando en silencio.
const RE_QUE_DELANTE = /(?<!\p{L})que $/iu;

function verbosSinFirmar(texto, formas3s, ajenos) {
  const sueltos = [];
  for (const forma of formas3s) {
    for (const m of texto.matchAll(new RegExp(`\\b${forma}\\b`, "gi"))) {
      const relativa = RE_QUE_DELANTE.test(texto.slice(0, m.index));
      const firma = `que ${forma.toLowerCase()}`;
      if (!(relativa && firma in ajenos)) sueltos.push(relativa ? firma : forma);
    }
  }
  return sueltos;
}

// Auto-prueba del invariante, con las dos caras: si esto deja de dar positivo,
// el invariante ha dejado de mirar y los packs pasarían igual de limpios
// estando mal (misma idea que el --auto-prueba de verificar_derivacion.py).
caso("verbos: la firma tapa la relativa declarada y nada más", () => {
  const ajenos = LEXICO.por_materia.LCL.sujetos_ajenos;
  const formas = ["Delimita", "Selecciona", "Agrupa"];

  const firmado = "Estructuro el texto con una introducción que delimita el tema.";
  const sueltos = verbosSinFirmar(firmado, formas, ajenos);
  if (sueltos.length > 0) throw new Error(`"que delimita" está firmado y salió como [${sueltos}]`);

  // Mismo verbo, sin «que» delante: el motor lo habría reconjugado, así que si
  // aparece es que algo falló antes. La firma no lo tapa.
  const sinRelativa = verbosSinFirmar("Delimita el tema en la introducción.", formas, ajenos);
  if (!sinRelativa.includes("Delimita")) throw new Error("un verbo sin «que» delante tiene que salir siempre");

  // Y el caso que justifica que el invariante siga mirando esta zona: relativa
  // cuyo sujeto SÍ es el alumno. Va detrás de «que», el motor la deja en 3.ª
  // persona, y no está firmada porque es el defecto, no una excepción.
  const defecto = verbosSinFirmar("Redacto el resumen con las ideas que selecciona del texto.", formas, ajenos);
  if (!defecto.includes("que selecciona")) {
    throw new Error("una relativa no firmada tiene que salir: es donde el guardarraíl del motor se equivoca");
  }
});

caso("generarAutoevaluacion: ningún descriptor conserva un verbo del banco en 3.ª persona sin firmar", () => {
  for (const nombre of PACKS) {
    const p = cargar(nombre);
    const bloque = LEXICO.por_materia[p.materia];
    if (!bloque) throw new Error(`${nombre}: la materia "${p.materia}" no tiene léxico propio`);
    const ajenos = bloque.sujetos_ajenos ?? {};
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
            for (const suelto of verbosSinFirmar(texto, formas3s, ajenos)) {
              throw new Error(
                `${nombre} · ${curso} · ${d.nombre} · N${i + 1} conserva "${suelto}" en 3.ª persona: "${texto}"`
              );
            }
          }
        }
      }
    }
  }
});

// Segundo invariante: el posesivo y el dativo de 3.ª persona (decisión 16(b) de
// §17). El defecto es el mismo —«él» dentro de una frase en «yo»— y no lo toca
// ninguna de las dos reglas anteriores, porque aquí no hay ningún verbo mal
// conjugado: "Reviso el borrador por SU cuenta", "Explico con SUS propias
// palabras", "en el orden en que se LE ocurren".
//
// Se arregló en el CONTENIDO y no en `reconjugarSecundarios`, por lo mismo que
// "estructura" o "repite": el motor tendría que saber de quién es cada "su", y
// no puede. La mitad de los "su" de los packs son legítimos —"indica SU
// procedencia" habla de los datos, "a partir de SU autoría" habla de la
// fuente—, así que cualquier regla general sobre el posesivo rompería packs ya
// validados, que es lo que prohíbe el corolario de simetría de CLAUDE.md. La
// vía de motor que sí funcionaba —una entrada literal por frase en
// SUSTITUCIONES_ESPECIALES— se descartó porque obliga a editar js/motor.js cada
// vez que entra un pack, y con él una materia (docs/diseno/anadir-una-materia.md).
//
// Lo que sí se puede automatizar es la comprobación, y es fail-closed: todo
// "su"/"sus" de un descriptor proyectado tiene que estar declarado con su
// referente en `posesivos_ajenos` (data/reglas-lexicas.json, por materia); todo
// "le"/"les" es error, porque en los cuatro packs el dativo siempre apuntaba al
// alumno. Una aparición nueva no se cuela: obliga a decidir de quién es.
// Las fronteras se escriben con \p{L} y no con \b: para el motor de expresiones
// regulares de JS "á" no es un carácter de palabra, así que \bles\b casa dentro
// de "cuáles" y el invariante daba un falso positivo en el N3 de adecuación de
// 1.º Bach. Es la misma trampa que ya obligó a escribir sin \b la sustitución
// de "los encontró" en js/motor.js.
const RE_POSESIVO = /(?<!\p{L})(su|sus|le|les)(?!\p{L})(?:\s+(\p{L}+))?/giu;

function posesivosSinDeclarar(texto, ajenos) {
  const sueltos = [];
  for (const [, forma, siguiente] of texto.matchAll(RE_POSESIVO)) {
    const frase = `${forma.toLowerCase()} ${(siguiente ?? "").toLowerCase()}`.trim();
    if (!(frase in ajenos)) sueltos.push(frase);
  }
  return sueltos;
}

// Auto-prueba del invariante, con la redacción real que tenían los packs: si
// esto deja de dar positivo, el invariante ha dejado de mirar y los packs
// pasarían igual de limpios estando mal (misma idea que el --auto-prueba de
// scripts/verificar_derivacion.py).
caso("posesivos: el invariante da positivo sobre la redacción anterior al barrido", () => {
  const ajenos = LEXICO.por_materia.LCL.posesivos_ajenos;
  const casos = [
    ["Reviso el borrador por su cuenta y corrijo problemas de puntuación.", "su cuenta"],
    ["Explico con sus propias palabras los términos del tema.", "sus propias"],
    ["Dirijo la mirada casi todo el tiempo a sus notas o a la pantalla.", "sus notas"],
    ["Enumero opiniones en un bloque único, siguiendo el orden en que se le ocurren.", "le ocurren"],
  ];
  for (const [texto, esperado] of casos) {
    const sueltos = posesivosSinDeclarar(texto, ajenos);
    if (!sueltos.includes(esperado)) {
      throw new Error(`esperaba que "${esperado}" saliera sin declarar en "${texto}", obtuve [${sueltos}]`);
    }
  }
  // Y la cara contraria: un posesivo legítimo no puede dar positivo.
  const legitimo = "Selecciono información de dos o más fuentes e indico su procedencia al final del texto.";
  const sueltos = posesivosSinDeclarar(legitimo, ajenos);
  if (sueltos.length > 0) throw new Error(`"su procedencia" es legítimo y salió como [${sueltos}]`);
});

caso("generarAutoevaluacion: ningún descriptor conserva un posesivo o un dativo de 3.ª persona del alumno", () => {
  for (const nombre of PACKS) {
    const p = cargar(nombre);
    const bloque = LEXICO.por_materia[p.materia];
    if (!bloque) throw new Error(`${nombre}: la materia "${p.materia}" no tiene léxico propio`);
    const ajenos = bloque.posesivos_ajenos ?? {};
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
            for (const frase of posesivosSinDeclarar(texto, ajenos)) {
              throw new Error(
                `${nombre} · ${curso} · ${d.nombre} · N${i + 1} dice "${frase}" con el alumno como referente: "${texto}"`
              );
            }
          }
        }
      }
    }
  }
});

console.log(`\n${pasados} caso(s) correcto(s), ${fallidos} fallido(s).`);
if (fallidos > 0) process.exit(1);
