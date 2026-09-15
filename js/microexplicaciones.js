// Microexplicaciones (SDD §11.3 para quien edite este archivo; el texto que
// sigue no cita el SDD porque lo lee el profesorado que usa la app, no quien
// la mantiene).
//
// Catálogo único de los "¿por qué?" desplegables. Vive aparte del marcado
// porque el mismo texto se usa en index.html (anclas [data-micro]), en la
// vista previa y en el modo avanzado, y porque son contenido pedagógico:
// se corrigen leyéndolos seguidos, no persiguiéndolos por tres archivos.
//
// Regla de redacción, la misma que se exige a los descriptores: dos o tres
// líneas, sin adverbios de relleno. Cuando la afirmación necesita respaldo
// citable por quien la lee, la referencia es al Marco Teórico (documento que
// el profesorado puede consultar), nunca al SDD (diseño interno de la app,
// ruido para quien no la mantiene). Si una microexplicación no puede
// sostenerse sin citar el SDD, se reformula o se quita.

export const MICROEXPLICACIONES = {
  // --- Modo exprés (index.html) ---
  puerta: {
    titulo: "¿por qué se pregunta esto?",
    texto:
      "No toda evaluación necesita una rúbrica. Una prueba objetiva se corrige por acierto o error; " +
      "un desarrollo largo pide otro instrumento. La app decide contigo antes de generar nada " +
      "(Marco Teórico §5), para no enseñar que la rúbrica sirve para todo. Si lo que entregas es una " +
      "fase —un esquema, un borrador, una revisión—, se premarcan solo las dimensiones de proceso y se " +
      "abre la lista de cotejo: en un esquema todavía no hay texto que juzgar.",
  },

  "tipo-tarea": {
    titulo: "¿por qué cambia el curso al elegir la tarea?",
    texto:
      "El tipo de tarea decide qué criterios oficiales la sostienen, y el currículo no ampara todas " +
      "las tareas en todos los cursos: no hay texto argumentativo en 1.º de ESO. La app no ofrece lo " +
      "que el decreto no escribe, así que el desplegable de curso se recalcula con cada tarea.",
  },

  curso: {
    titulo: "¿por qué el curso y no el ciclo?",
    texto:
      "El decreto de Murcia redacta los criterios curso a curso: el 5.1 de 1.º no es el 5.1 de 3.º. " +
      "La diferencia de exigencia ya está escrita en el propio criterio —«sencillos» y «de manera guiada» " +
      "frente a «de cierta extensión» y «progresivamente autónoma»—, de modo que la progresión no se " +
      "calibra a mano: se lee.",
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
      "alumno sí hace de forma limitada, nunca lo que le falta, y el N2 (Suficiente) marca el desempeño " +
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
      "verificable. Sirve para borradores y tareas de proceso, donde graduar cuatro niveles " +
      "cuesta más de lo que aporta. Se limita a ocho ítems por sostenibilidad.",
  },

  "ficha-alumno": {
    titulo: "¿por qué se genera siempre?",
    texto:
      "Si el alumnado no conoce la rúbrica antes de la prueba, la rúbrica califica pero no enseña " +
      "(Marco Teórico §7.1). Por eso la ficha no es una casilla que se pueda olvidar marcar: la app la " +
      "genera siempre, con qué se te pide, qué se valora y cómo llegar al nivel excelente.",
  },

  "un-punto": {
    titulo: "¿por qué solo una columna y no las cuatro?",
    texto:
      "Para un borrador o una tarea de proceso, graduar cuatro niveles cuesta más de lo que aporta: basta con " +
      "describir el desempeño esperado y anotar a mano en qué se queda corto o en qué destaca ese alumno " +
      "concreto (Marco Teórico §10). Por eso se limita a 1-2 dimensiones: con más deja de ser " +
      "«un punto» y toca usar la rúbrica analítica.",
  },

  "escala-estimacion": {
    titulo: "¿por qué puntos directos y no los cuatro niveles?",
    texto:
      "En un desarrollo largo o un comentario de texto, corregir de un vistazo pesa más que graduar cuatro " +
      "descriptores por apartado (Marco Teórico §5). Cada apartado reparte su peso en puntos " +
      "sobre 10; el detractor de ortografía y presentación es transversal a todo el texto y resta al " +
      "final, con un tope de 2 puntos que no se puede superar aunque el texto acumule muchos fallos.",
  },

  "autoevaluacion": {
    titulo: "¿por qué es la misma matriz y no un texto nuevo?",
    texto:
      "No hay contenido propio que redactar: cada descriptor cambia solo el verbo inicial, de 3.ª a 1.ª " +
      "persona, con la forma que ya guarda el banco de verbos. Es proyección, no " +
      "reinterpretación — si el alumno se reconoce en un nivel distinto al que marcarías tú, esa " +
      "diferencia es justo lo que conviene hablar antes de la nota.",
  },

  "coevaluacion": {
    titulo: "¿por qué el comentario es obligatorio?",
    texto:
      "Sin justificación escrita, la coevaluación degenera en reparto de notas entre amigos. " +
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
      "etapa. Si un mismo instrumento mezcla criterios separados por más de un nivel en el " +
      "mismo eje, la tarea pide a la vez dos cosas de exigencia distinta y conviene revisar la combinación.",
  },

  "salud-pack": {
    titulo: "¿qué comprueba el validador y qué no?",
    texto:
      "Al cargar se comprueba lo que no exige juicio pedagógico: la cita del criterio, el verbo del banco, " +
      "la gradación positiva del N1, los calificadores vagos y la aritmética de las matrices. El validador " +
      "no decide si un descriptor es bueno; eso aparece simulando una corrección, que es como se " +
      "descubrió la regla del doble castigo.",
  },

  // --- Modo avanzado ---
  "pesos-libres": {
    titulo: "¿hasta dónde puedo mover un peso?",
    texto:
      "Los deslizadores no tienen tope. Si decides que la corrección normativa vale el 50% en esta tarea, " +
      "la app te lo advierte una vez y te deja hacerlo: la decisión de calificación es tuya. " +
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
    titulo: "¿pinchar el descriptor o contar con la matriz?",
    texto:
      "Las dos valen. Pinchar el descriptor es un clic por fila y la dimensión aporta el valor de su nivel " +
      "según la escala (2,5 / 5 / 7,5 / 10). «Contar» abre la matriz de la dimensión y entonces aporta sus " +
      "puntos brutos, sin colapsar a nivel: colapsar haría que una décima de desempeño valiese hasta 2,5 " +
      "puntos en el corte del 9. Cuenta cuando la nota importe —una prueba, una entrega final— y " +
      "pincha cuando baste el nivel. Lo que guardes se conserva en este navegador, por actividad.",
  },

  "escala-nivel": {
    titulo: "¿equilibrada o exigente?",
    texto:
      "La equilibrada evita que un alumno que ha producido algo, aunque flojo, saque un cero en una dimensión " +
      "sin matriz; la exigente reserva el cero para el trabajo no realizado o ininteligible. Se " +
      "declara aquí porque cambia la nota, no es un detalle técnico.",
  },

  "detractor-estimacion": {
    titulo: "¿por qué se resta al final y no dentro de una dimensión?",
    texto:
      "La ortografía y la presentación son transversales a todo el texto, no de una dimensión concreta, " +
      "así que se restan de la nota ya calculada, con un tope de 2 puntos que no se puede superar " +
      "aunque el texto acumule muchos fallos. Se aplica antes que la condición mínima: si esta se dispara, " +
      "lo hace sobre la nota ya descontada, no al revés (orden fijado tras comprobar que da " +
      "notas distintas según el orden elegido).",
  },

  "condicion-minima": {
    titulo: "¿qué hace exactamente este límite?",
    texto:
      "Si se activa, un solo criterio obligatorio en N1 recorta la nota final a un techo de 4,9; no baja más " +
      "aunque haya varios en N1, y nunca sube una nota que ya era más baja. Actívala solo si " +
      "se lo anunciaste al alumnado antes de la prueba: una condición mínima no anunciada es difícil de sostener.",
  },

  "exportar-idoceo": {
    titulo: "¿esto sustituye a «Calificar»?",
    texto:
      "Este botón exporta la matriz en blanco —criterio por fila, nivel por columna— en un CSV que abre " +
      "cualquier hoja de cálculo, no solo iDoceo: sirve igual si lo que quieres es la matriz en Excel, Sheets " +
      "o Calc por otro motivo. Si vas a llevarla a iDoceo, sí sustituye a «Calificar» y no se suman los dos: " +
      "es el formato de su importador de rúbricas, calificarías tocando cada celda allí —igual que " +
      "en la pantalla «Calificar» de esta app, pero sin las matrices contables—, y la " +
      "pantalla «Calificar» de esta app dejaría de usarse para ese instrumento. Si prefieres seguir " +
      "calificando aquí, usa «Calificar» y, si necesitas la nota en iDoceo, el botón «Exportar CSV» de esa " +
      "pantalla — ese es el otro importador de iDoceo, el de alumnos, no el de rúbricas.",
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
