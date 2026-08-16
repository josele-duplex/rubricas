import {
  cargarPack,
  cargarJson,
  fusionarPacks,
  generarInstrumentos,
  PUERTA_APLICABILIDAD,
  normalizarPesos,
  comprobarProgresion,
  calcularComplejidad,
  generarRubricaAnalitica,
  generarListaCotejo,
  generarFichaAlumno,
  generarRubricaUnPunto,
  generarAutoevaluacion,
  generarEscalaEstimacion,
} from "./motor.js";
import { poblarFormulario, actualizarCursos, renderResultado, renderSaludPack, renderResultadoAlumnoFicha, escapeHtml, fijarCatalogo } from "./ui.js";
import { validarPack } from "./validador.js";
import { renderModoAvanzado, conectarEventosModoAvanzado } from "./modo-avanzado.js";
import { renderCalificacion, conectarEventosCalificacion, alumnosGuardados } from "./calificar.js";
import { calcularResultadoGuardado } from "./calificacion.js";
import { montarMicroexplicaciones } from "./microexplicaciones.js";
import { registrarServiceWorker, montarInstalacion } from "./pwa.js";

const els = {
  form: document.getElementById("form-expres"),
  puerta: document.getElementById("puerta"),
  tipoTarea: document.getElementById("tipo-tarea"),
  curso: document.getElementById("curso"),
  tiempo: document.getElementById("tiempo"),
  actividad: document.getElementById("actividad"),
  resultado: document.getElementById("resultado"),
  saludPack: document.getElementById("salud-pack"),
  zonaInstalar: document.getElementById("zona-instalar"),
};

// Instalación y modo sin conexión. Va antes de `iniciar()` y fuera de su
// try/catch a propósito: no depende de que el pack cargue, y si algo fallara
// aquí no puede impedir que la aplicación arranque.
registrarServiceWorker();
montarInstalacion(els.zonaInstalar);

// Qué packs existen, cómo se llaman las cosas en pantalla y qué verbos hay:
// todo sale de data/. Esta lista estaba cableada aquí y las etiquetas en
// ui.js, así que añadir un pack obligaba a acordarse de dos archivos de
// código; ahora se añade una línea en data/catalogo.json.
const URL_CATALOGO = "data/catalogo.json";
const URL_VERBOS = "data/verbos.json";

let pack;
let configActual = null;

async function iniciar() {
  let packsOriginales;
  let catalogo;
  try {
    const [cat, bancoJson] = await Promise.all([
      cargarJson(URL_CATALOGO),
      cargarJson(URL_VERBOS),
    ]);
    catalogo = cat;
    packsOriginales = await Promise.all(
      catalogo.packs.map((p) => cargarPack(p.archivo, bancoJson.verbos))
    );
  } catch (err) {
    els.resultado.hidden = false;
    els.resultado.innerHTML = `<div class="aviso-caja">No se pudo cargar el pack de criterios: ${err.message}</div>`;
    return;
  }
  fijarCatalogo(catalogo);
  pack = fusionarPacks(packsOriginales);

  const informes = packsOriginales.map((p) => validarPack(p));
  renderSaludPack(els.saludPack, {
    avisos: informes.flatMap((i) => i.avisos),
    nErrores: informes.reduce((total, i) => total + i.nErrores, 0),
    nAvisos: informes.reduce((total, i) => total + i.nAvisos, 0),
  });

  montarMicroexplicaciones();
  poblarFormulario(pack, els);
  els.tipoTarea.addEventListener("change", () => actualizarCursos(pack, els));

  els.form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    generarYMostrar();
  });
}

function generarYMostrar(ajustesAplicados = null) {
  const puertaInfo = PUERTA_APLICABILIDAD[els.puerta.value];
  let resultado = null;
  let meta = null;

  if (puertaInfo.generaRubrica) {
    resultado = generarInstrumentos(pack, {
      curso: els.curso.value,
      tipoTarea: els.tipoTarea.value,
      tiempoCorreccion: els.tiempo.value,
      actividad: els.actividad.value.trim(),
      esProductoFinal: els.puerta.value === "desempeno",
      puerta: els.puerta.value,
    });

    if (resultado.ok) {
      meta = {
        actividad: resultado.rubricaAnalitica.actividad,
        curso: resultado.rubricaAnalitica.curso,
        tipoTarea: resultado.rubricaAnalitica.tipoTarea,
      };
    }

    // Aplicar ajustes del modo avanzado, si los hay. En vez de reconstruir
    // cada instrumento a mano, se reutilizan las mismas funciones del motor
    // que usa generarInstrumentos, para no mantener dos copias de la lógica
    // de composición (fichaAlumno, complejidad y avisos quedaron
    // desincronizados la primera vez que se hizo así).
    if (ajustesAplicados && resultado.ok) {
      // Se parte de todas las dimensiones que el profesor vio en "Ajustar",
      // premarcadas o no (§9 paso 4): si solo se recorriesen las activas, una
      // dimensión desmarcada no podría volver a marcarse nunca.
      const conAjuste = [...resultado.criterios, ...resultado.noPremarcados].map((c) => {
        const ajuste = ajustesAplicados[c.id];
        if (!ajuste) return c;
        return { ...c, desactivado: ajuste.desactivado, peso_base: ajuste.peso_editado };
      });

      const criteriosAjustados = normalizarPesos(conAjuste.filter((c) => !c.desactivado));

      const esProductoFinal = els.puerta.value === "desempeno";

      resultado.criterios = criteriosAjustados;
      resultado.noPremarcados = conAjuste
        .filter((c) => c.desactivado)
        .map((c) => ({ ...c, peso_normalizado: 0 }));
      resultado.avisosProgresion = comprobarProgresion(criteriosAjustados);
      resultado.complejidad = calcularComplejidad(criteriosAjustados, esProductoFinal);
      resultado.rubricaAnalitica = generarRubricaAnalitica(criteriosAjustados, meta);
      resultado.listaCotejo = generarListaCotejo(criteriosAjustados);
      resultado.fichaAlumno = generarFichaAlumno(criteriosAjustados, meta);
      resultado.rubricaUnPunto = generarRubricaUnPunto(criteriosAjustados, meta);
      resultado.autoevaluacion = generarAutoevaluacion(criteriosAjustados, pack.verbos, meta);
      resultado.escalaEstimacion = generarEscalaEstimacion(criteriosAjustados, meta);
    }
  }

  configActual = { puerta: els.puerta.value, tipoTarea: els.tipoTarea.value, curso: els.curso.value, ajustes: ajustesAplicados };

  const alumnos = meta ? alumnosGuardados(meta) : {};
  renderResultado(els.resultado, { puertaInfo, resultado, alumnos });
  els.resultado.scrollIntoView({ behavior: "smooth", block: "start" });

  // Conectar botón Ajustar si existe
  const btnAjustar = els.resultado.querySelector("#btn-ajustar");
  if (btnAjustar && resultado?.ok) {
    btnAjustar.addEventListener("click", () => {
      abrirModoAvanzado([...resultado.criterios, ...resultado.noPremarcados]);
    });
  }

  const btnCalificar = els.resultado.querySelector("#btn-calificar");
  if (btnCalificar && resultado?.ok) {
    btnCalificar.addEventListener("click", () => {
      abrirCalificacion(resultado.criterios, meta);
    });
  }

  conectarSelectorFicha(resultado, meta);
}

// §6.5 — desplegable de "Resultado de un alumno calificado" en la ficha del
// alumno. No es un instrumento nuevo (§7): reutiliza calcularResultadoGuardado
// (js/calificacion.js) sobre los criterios activos ahora mismo, igual que
// "Cargar" en Calificar. Se conecta aquí y no en ui.js porque implica leer
// localStorage (vía alumnosGuardados), que es responsabilidad de esta capa,
// no del renderizado puro.
function conectarSelectorFicha(resultado, meta) {
  const selector = els.resultado.querySelector("#selector-alumno-ficha");
  if (!selector || !resultado?.ok || !meta) return;

  selector.addEventListener("change", () => {
    const contenedorResultado = els.resultado.querySelector("#resultado-alumno-ficha");
    const nombre = selector.value;
    if (!nombre) {
      contenedorResultado.innerHTML = renderResultadoAlumnoFicha(null);
      return;
    }
    const datos = alumnosGuardados(meta)[nombre];
    contenedorResultado.innerHTML = renderResultadoAlumnoFicha(
      datos ? calcularResultadoGuardado(resultado.criterios, datos) : null
    );
  });
}

// Tras cerrar "Calificar" puede haber un alumno nuevo (o borrado): se
// repuebla el desplegable sin rehacer toda la vista previa, para no perder
// la pestaña que el profesor tenía abierta.
function refrescarSelectorFicha(meta) {
  const selector = els.resultado.querySelector("#selector-alumno-ficha");
  if (!selector || !meta) return;

  const valorPrevio = selector.value;
  const nombres = Object.keys(alumnosGuardados(meta)).sort((a, b) => a.localeCompare(b, "es"));
  selector.innerHTML =
    `<option value="">— vista en blanco, para repartir en clase —</option>` +
    nombres.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
  selector.value = nombres.includes(valorPrevio) ? valorPrevio : "";
  selector.dispatchEvent(new Event("change"));
}

function abrirModoAvanzado(criterios) {
  // Crear contenedor temporal para el modo avanzado
  const contenedor = document.createElement("div");
  contenedor.id = "modo-avanzado-contenedor";
  contenedor.className = "tarjeta";
  document.querySelector("main").insertBefore(contenedor, els.resultado);

  renderModoAvanzado(contenedor, criterios);

  conectarEventosModoAvanzado(contenedor, criterios, (ajustes) => {
    contenedor.remove();
    if (ajustes) {
      generarYMostrar(ajustes);
    } else {
      els.resultado.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  contenedor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function abrirCalificacion(criterios, meta) {
  const contenedor = document.createElement("div");
  contenedor.id = "calificacion-contenedor";
  contenedor.className = "tarjeta";
  document.querySelector("main").insertBefore(contenedor, els.resultado);

  renderCalificacion(contenedor, criterios, meta);

  conectarEventosCalificacion(contenedor, criterios, meta, () => {
    contenedor.remove();
    refrescarSelectorFicha(meta);
    els.resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  contenedor.scrollIntoView({ behavior: "smooth", block: "start" });
}

iniciar();
