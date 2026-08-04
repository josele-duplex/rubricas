// Microexplicaciones — SDD §11.3.
//
// Catálogo único de los "¿por qué?" desplegables. Vive aparte del marcado
// porque el mismo texto se usa en index.html (anclas [data-micro]), en la
// vista previa y en el modo avanzado, y porque son contenido pedagógico:
// se corrigen leyéndolos seguidos, no persiguiéndolos por tres archivos.
//
// Regla de redacción, la misma que se exige a los descriptores: dos o tres
// líneas, sin adverbios de relleno y con la referencia al marco o al SDD que
// sostiene la afirmación. Si una microexplicación no puede citar de dónde
// sale, sobra.

export const MICROEXPLICACIONES = {
  // --- Modo exprés (index.html) ---
  puerta: {
    titulo: "¿por qué se pregunta esto?",
    texto:
      "No toda evaluación necesita una rúbrica. Una prueba objetiva se corrige por acierto o error; " +
      "un desarrollo largo pide otro instrumento. La app decide contigo antes de generar nada " +
      "(Marco Teórico §5), para no enseñar que la rúbrica sirve para todo.",
  },

  "tipo-tarea": {
    titulo: "¿por qué cambia el curso al elegir la tarea?",
    texto:
      "El tipo de tarea decide qué criterios oficiales la sostienen, y el currículo no ampara todas " +
      "las tareas en todos los cursos: no hay texto argumentativo en 1.º de ESO. La app no ofrece lo " +
      "que el decreto no escribe (SDD §4.3), así que el desplegable de curso se recalcula con cada tarea.",
  },

  curso: {
    titulo: "¿por qué el curso y no el ciclo?",
    texto:
      "El decreto de Murcia redacta los criterios curso a curso: el 5.1 de 1.º no es el 5.1 de 3.º. " +
      "La diferencia de exigencia ya está escrita en el propio criterio —«sencillos» y «de manera guiada» " +
      "frente a «de cierta extensión» y «progresivamente autónoma»—, de modo que la progresión no se " +
      "calibra a mano: se lee (SDD §10).",
  },

  tiempo: {
    titulo: "¿por qué?",
    texto:
      "Menos tiempo significa menos dimensiones: la app se queda solo con los criterios de prioridad 1. " +
      "Más tiempo permite incorporar los de prioridad 2 y 3. El peso de cada dimensión se recalcula " +
      "siempre sobre 100 para lo que quede seleccionado.",
  },

  actividad: {
    titulo: "¿para qué sirve escribir la actividad?",
    texto:
      "La rúbrica evalúa el criterio; la actividad es el encargo concreto en el que se observa. " +
      "Escribirla no cambia las dimensiones: encabeza los tres instrumentos y abre la ficha del alumno, " +
      "que es donde el alumnado lee qué se le pide.",
  },

  // --- Vista previa ---
  niveles: {
    titulo: "¿por qué cuatro niveles?",
    texto:
      "Cuatro niveles, siempre: no es configurable (Marco Teórico §2.1). Con tres se colapsa el centro " +
      "y con cinco se inventa una diferencia que después nadie sabe defender. El N1 describe lo que el " +
      "alumno sí hace de forma limitada, nunca lo que le falta, y el N2 marca el desempeño conseguido " +
      "del que se deriva la lista de cotejo.",
  },

  pesos: {
    titulo: "¿de dónde salen estos pesos?",
    texto:
      "El peso que trae cada dimensión en el pack es un punto de partida razonable, no una prescripción. " +
      "Al filtrar por tiempo de corrección desaparecen dimensiones, así que el reparto se normaliza a 100 " +
      "sobre las que quedan. Puedes cambiarlo en «Ajustar»; el peso final se imprime en la ficha del alumno.",
  },

  "criterio-oficial": {
    titulo: "¿por qué cada fila cita un criterio?",
    texto:
      "Una rúbrica se deriva del currículo, no se inventa (Marco Teórico §1.2). Sin la cita del criterio " +
      "de evaluación del curso, la fila es una opinión con formato de tabla y no se sostiene ante una " +
      "reclamación de notas.",
  },

  "lista-cotejo": {
    titulo: "¿por qué esta lista y no otra rúbrica?",
    texto:
      "La lista de cotejo no es una rúbrica abreviada: es el descriptor de N2 convertido en afirmación " +
      "verificable (SDD §7.2). Sirve para borradores y tareas de proceso, donde graduar cuatro niveles " +
      "cuesta más de lo que aporta. Se limita a ocho ítems por sostenibilidad.",
  },

  "ficha-alumno": {
    titulo: "¿por qué se genera siempre?",
    texto:
      "Si el alumnado no conoce la rúbrica antes de la prueba, la rúbrica califica pero no enseña " +
      "(Marco Teórico §7.1). Por eso la ficha no es una casilla que se pueda olvidar marcar: la app la " +
      "genera siempre, con qué se te pide, qué se valora y cómo llegar al nivel excelente.",
  },

  "autoevaluacion": {
    titulo: "¿por qué es la misma matriz y no un texto nuevo?",
    texto:
      "No hay contenido propio que redactar: cada descriptor cambia solo el verbo inicial, de 3.ª a 1.ª " +
      "persona, con la forma que ya guarda el banco de verbos (SDD §5.3, §7.5). Es proyección, no " +
      "reinterpretación — si el alumno se reconoce en un nivel distinto al que marcarías tú, esa " +
      "diferencia es justo lo que conviene hablar antes de la nota.",
  },

  "coevaluacion": {
    titulo: "¿por qué el comentario es obligatorio?",
    texto:
      "Sin justificación escrita, la coevaluación degenera en reparto de notas entre amigos (SDD §7.6). " +
      "El comentario no es opcional: se pide uno por dimensión, aunque el nivel marcado coincida con el " +
      "de la rúbrica del profesor.",
  },

  complejidad: {
    titulo: "¿qué mide este indicador?",
    texto:
      "Más de cinco dimensiones solo se sostiene en un producto final integrador (Marco Teórico §7.2). " +
      "Por encima de ahí la corrección se alarga y las dimensiones dejan de discriminar: el profesor " +
      "acaba repartiendo en filas una impresión global.",
  },

  progresion: {
    titulo: "¿qué significa este aviso?",
    texto:
      "Los ejes de autonomía, complejidad y reflexión metalingüística sitúan cada criterio dentro de la " +
      "etapa (SDD §5.4). Si un mismo instrumento mezcla criterios separados por más de un nivel en el " +
      "mismo eje, la tarea pide a la vez dos cosas de exigencia distinta y conviene revisar la combinación.",
  },

  "salud-pack": {
    titulo: "¿qué comprueba el validador y qué no?",
    texto:
      "Al cargar se comprueba lo que no exige juicio pedagógico: la cita del criterio, el verbo del banco, " +
      "la gradación positiva del N1, los calificadores vagos y la aritmética de las matrices. El validador " +
      "no decide si un descriptor es bueno; eso aparece simulando una corrección (SDD §15), que es como se " +
      "descubrió la regla del doble castigo.",
  },

  // --- Modo avanzado ---
  "pesos-libres": {
    titulo: "¿hasta dónde puedo mover un peso?",
    texto:
      "Los deslizadores no tienen tope. Si decides que la corrección normativa vale el 50% en esta tarea, " +
      "la app te lo advierte una vez y te deja hacerlo: la decisión de calificación es tuya (SDD §11.2). " +
      "Al soltar, el conjunto se normaliza a 100 para que veas si una dimensión se ha comido el instrumento.",
  },

  "desactivar-dimension": {
    titulo: "¿qué pasa si quito una dimensión?",
    texto:
      "Quitarla no la penaliza: reparte su peso entre las que quedan al normalizar a 100. Menos dimensiones " +
      "significa una corrección más rápida y un instrumento que discrimina mejor lo poco que mide.",
  },

  "bloques-lomloe": {
    titulo: "¿por qué agrupadas por bloque?",
    texto:
      "Cada dimensión procede de un bloque de saberes del currículo. Un instrumento que solo toca un bloque " +
      "evalúa una franja estrecha de la competencia; verlas agrupadas ayuda a detectar el hueco antes de imprimir.",
  },

  // --- Calificar ---
  "modo-numerico": {
    titulo: "¿por qué puntos y no solo el nivel?",
    texto:
      "Una dimensión con matriz aporta a la nota sus puntos brutos, no el valor de su nivel: colapsar a nivel " +
      "haría que una décima de desempeño valiese hasta 2,5 puntos en el corte del 9 (SDD §6.2). Esta pantalla " +
      "calcula, no archiva: nada de lo que registres aquí se guarda al cerrarla.",
  },

  "escala-nivel": {
    titulo: "¿equilibrada o exigente?",
    texto:
      "La equilibrada evita que un alumno que ha producido algo, aunque flojo, saque un cero en una dimensión " +
      "sin matriz; la exigente reserva el cero para el trabajo no realizado o ininteligible (SDD §6.2). Se " +
      "declara aquí porque cambia la nota, no es un detalle técnico.",
  },

  "condicion-minima": {
    titulo: "¿qué hace exactamente este límite?",
    texto:
      "Si se activa, un solo criterio obligatorio en N1 recorta la nota final a un techo de 4,9; no baja más " +
      "aunque haya varios en N1, y nunca sube una nota que ya era más baja (SDD §6.2-§6.3). Actívala solo si " +
      "se lo anunciaste al alumnado antes de la prueba: una condición mínima no anunciada es difícil de sostener.",
  },
};

function escapar(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Devuelve el <details> listo para insertar. Si el id no existe, devuelve
// cadena vacía en vez de romper la vista: una microexplicación que falta es
// un defecto de contenido, no un error de ejecución.
export function microexplicacion(id) {
  const m = MICROEXPLICACIONES[id];
  if (!m) return "";
  return `
    <details class="microexplicacion" data-micro-id="${id}">
      <summary>${escapar(m.titulo)}</summary>
      <p>${escapar(m.texto)}</p>
    </details>
  `;
}

// Rellena las anclas <div data-micro="id"> del marcado estático.
export function montarMicroexplicaciones(raiz = document) {
  for (const ancla of raiz.querySelectorAll("[data-micro]")) {
    ancla.outerHTML = microexplicacion(ancla.dataset.micro);
  }
}
