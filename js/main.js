import {
  cargarPack,
  generarInstrumentos,
  PUERTA_APLICABILIDAD,
  normalizarPesos,
  comprobarProgresion,
  calcularComplejidad,
  generarRubricaAnalitica,
  generarListaCotejo,
  generarFichaAlumno,
} from "./motor.js";
import { poblarFormulario, actualizarCursos, renderResultado, renderSaludPack } from "./ui.js";
import { validarPack } from "./validador.js";
import { renderModoAvanzado, conectarEventosModoAvanzado } from "./modo-avanzado.js";
import { montarMicroexplicaciones } from "./microexplicaciones.js";

const els = {
  form: document.getElementById("form-expres"),
  puerta: document.getElementById("puerta"),
  tipoTarea: document.getElementById("tipo-tarea"),
  curso: document.getElementById("curso"),
  tiempo: document.getElementById("tiempo"),
  actividad: document.getElementById("actividad"),
  resultado: document.getElementById("resultado"),
  saludPack: document.getElementById("salud-pack"),
};

let pack;
let configActual = null;

async function iniciar() {
  try {
    pack = await cargarPack("data/pack-lcl-expositivo.json");
  } catch (err) {
    els.resultado.hidden = false;
    els.resultado.innerHTML = `<div class="aviso-caja">No se pudo cargar el pack de criterios: ${err.message}</div>`;
    return;
  }

  renderSaludPack(els.saludPack, validarPack(pack));

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

  if (puertaInfo.generaRubrica) {
    resultado = generarInstrumentos(pack, {
      curso: els.curso.value,
      tipoTarea: els.tipoTarea.value,
      tiempoCorreccion: els.tiempo.value,
      actividad: els.actividad.value.trim(),
      esProductoFinal: els.puerta.value === "desempeno",
    });

    // Aplicar ajustes del modo avanzado, si los hay. En vez de reconstruir
    // cada instrumento a mano, se reutilizan las mismas funciones del motor
    // que usa generarInstrumentos, para no mantener dos copias de la lógica
    // de composición (fichaAlumno, complejidad y avisos quedaron
    // desincronizados la primera vez que se hizo así).
    if (ajustesAplicados && resultado.ok) {
      let criteriosAjustados = resultado.criterios
        .map((c) => {
          const ajuste = ajustesAplicados[c.id];
          if (!ajuste) return c;
          return { ...c, desactivado: ajuste.desactivado, peso_base: ajuste.peso_editado };
        })
        .filter((c) => !c.desactivado);

      criteriosAjustados = normalizarPesos(criteriosAjustados);

      const meta = {
        actividad: resultado.rubricaAnalitica.actividad,
        curso: resultado.rubricaAnalitica.curso,
        tipoTarea: resultado.rubricaAnalitica.tipoTarea,
      };
      const esProductoFinal = els.puerta.value === "desempeno";

      resultado.criterios = criteriosAjustados;
      resultado.avisosProgresion = comprobarProgresion(criteriosAjustados);
      resultado.complejidad = calcularComplejidad(criteriosAjustados, esProductoFinal);
      resultado.rubricaAnalitica = generarRubricaAnalitica(criteriosAjustados, meta);
      resultado.listaCotejo = generarListaCotejo(criteriosAjustados);
      resultado.fichaAlumno = generarFichaAlumno(criteriosAjustados, meta);
    }
  }

  configActual = { puerta: els.puerta.value, tipoTarea: els.tipoTarea.value, curso: els.curso.value, ajustes: ajustesAplicados };

  renderResultado(els.resultado, { puertaInfo, resultado });
  els.resultado.scrollIntoView({ behavior: "smooth", block: "start" });

  // Conectar botón Ajustar si existe
  const btnAjustar = els.resultado.querySelector("#btn-ajustar");
  if (btnAjustar && resultado?.ok) {
    btnAjustar.addEventListener("click", () => {
      abrirModoAvanzado(resultado.criterios);
    });
  }
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

iniciar();
