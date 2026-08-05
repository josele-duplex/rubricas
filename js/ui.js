import { PUERTA_APLICABILIDAD, TIEMPOS_CORRECCION, tiposTareaDisponibles, cursosDisponibles } from "./motor.js";
import { comprobarRepartoPesos, REGLAS } from "./validador.js";
import { microexplicacion } from "./microexplicaciones.js";
import { calcularResultadoGuardado } from "./calificacion.js";

export const ETIQUETAS_TIPO_TAREA = {
  narracion: "Narración",
  expositivo: "Texto expositivo",
  oral: "Exposición oral",
  argumentativo: "Texto argumentativo",
};

export const ETIQUETAS_CURSO = {
  "1ESO": "1.º de ESO",
  "2ESO": "2.º de ESO",
  "3ESO": "3.º de ESO",
  "4ESO": "4.º de ESO",
  "1BACH": "1.º de Bachillerato",
  "2BACH": "2.º de Bachillerato",
};

const ORDEN_CURSOS = ["1ESO", "2ESO", "3ESO", "4ESO", "1BACH", "2BACH"];

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function poblarFormulario(pack, els) {
  els.puerta.innerHTML = Object.entries(PUERTA_APLICABILIDAD)
    .map(([id, p]) => `<option value="${id}">${escapeHtml(p.etiqueta)}</option>`)
    .join("");
  els.puerta.value = "desempeno";

  const tipos = tiposTareaDisponibles(pack);
  els.tipoTarea.innerHTML = tipos
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(ETIQUETAS_TIPO_TAREA[t] ?? t)}</option>`)
    .join("");

  els.tiempo.innerHTML = Object.entries(TIEMPOS_CORRECCION)
    .map(([id, t]) => `<option value="${id}">${escapeHtml(t.etiqueta)}</option>`)
    .join("");
  els.tiempo.value = "2a5";

  actualizarCursos(pack, els);
}

export function actualizarCursos(pack, els) {
  const tipoTarea = els.tipoTarea.value;
  const cursos = cursosDisponibles(pack, tipoTarea).sort(
    (a, b) => ORDEN_CURSOS.indexOf(a) - ORDEN_CURSOS.indexOf(b)
  );
  els.curso.innerHTML = cursos
    .map((c) => `<option value="${c}">${escapeHtml(ETIQUETAS_CURSO[c] ?? c)}</option>`)
    .join("");
}

function renderExplicacionPuerta(puertaInfo) {
  return `
    <div class="aviso-caja explicacion-puerta">
      <p>${escapeHtml(puertaInfo.explicacion)}</p>
    </div>
  `;
}

function renderCabeceraInstrumento(meta) {
  return `
    <p class="instrumento-cabecera">
      <strong>Actividad:</strong> ${escapeHtml(meta.actividad)} ·
      <strong>Curso:</strong> ${escapeHtml(ETIQUETAS_CURSO[meta.curso] ?? meta.curso)} ·
      <strong>Tipo de tarea:</strong> ${escapeHtml(ETIQUETAS_TIPO_TAREA[meta.tipoTarea] ?? meta.tipoTarea)}
    </p>
  `;
}

function renderRubricaAnalitica(rubrica) {
  const filas = rubrica.dimensiones
    .map(
      (d) => `
      <tr>
        <td class="col-dimension">
          <span class="bloque-etiqueta bloque-${d.bloque}" title="Bloque LOMLOE ${d.bloque}">${d.bloque}</span>
          <span class="dimension-nombre">${escapeHtml(d.nombre)}${d.obligatorio ? ' <span class="etiqueta-obligatorio">obligatorio</span>' : ""}</span>
          <span class="dimension-meta">Peso ${d.peso}% · ${escapeHtml(d.criterioOficial)}</span>
        </td>
        ${d.niveles.map((n) => `<td>${escapeHtml(n)}</td>`).join("")}
      </tr>
    `
    )
    .join("");

  return `
    ${renderCabeceraInstrumento(rubrica)}
    <div style="overflow-x:auto">
    <table class="rubrica">
      <thead>
        <tr>
          <th class="col-dimension">Dimensión</th>
          <th class="col-nivel nivel-1">N1 · En desarrollo</th>
          <th class="col-nivel nivel-2">N2 · Conseguido</th>
          <th class="col-nivel nivel-3">N3 · Avanzado</th>
          <th class="col-nivel nivel-4">N4 · Excelente</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    </div>
    ${microexplicacion("niveles")}
    ${microexplicacion("criterio-oficial")}
  `;
}

// §7.5-§7.6 — autoevaluación y coevaluación comparten la misma matriz en
// primera persona (js/motor.js, generarAutoevaluacion); lo único que cambia
// entre ellas es la interfaz: la coevaluación añade la referencia a quién
// se evalúa y un comentario por dimensión (§7.6, regla del comentario
// obligatorio para que no degenere en reparto de notas entre amigos).
function renderMatrizPersona(auto, { coevaluacion } = {}) {
  const filas = auto.dimensiones
    .map((d) => {
      const filaPrincipal = `
      <tr>
        <td class="col-dimension">
          <span class="bloque-etiqueta bloque-${d.bloque}" title="Bloque LOMLOE ${d.bloque}">${d.bloque}</span>
          <span class="dimension-nombre">${escapeHtml(d.nombre)}${d.obligatorio ? ' <span class="etiqueta-obligatorio">obligatorio</span>' : ""}</span>
          <span class="dimension-meta">Peso ${d.peso}%</span>
        </td>
        ${d.niveles.map((n) => `<td>${escapeHtml(n)}</td>`).join("")}
      </tr>
    `;
      const filaComentario = coevaluacion
        ? `
      <tr class="fila-comentario">
        <td colspan="5">
          <span class="etiqueta-comentario">Comentario en «${escapeHtml(d.nombre)}»:</span>
          <div class="linea-comentario"></div>
        </td>
      </tr>
    `
        : "";
      return filaPrincipal + filaComentario;
    })
    .join("");

  return `
    ${renderCabeceraInstrumento(auto)}
    ${
      coevaluacion
        ? `<p class="ayuda">Estoy evaluando el trabajo de: <span class="linea-nombre"></span></p>`
        : ""
    }
    <div style="overflow-x:auto">
    <table class="rubrica">
      <thead>
        <tr>
          <th class="col-dimension">Dimensión</th>
          <th class="col-nivel nivel-1">N1 · En desarrollo</th>
          <th class="col-nivel nivel-2">N2 · Conseguido</th>
          <th class="col-nivel nivel-3">N3 · Avanzado</th>
          <th class="col-nivel nivel-4">N4 · Excelente</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    </div>
    ${microexplicacion(coevaluacion ? "coevaluacion" : "autoevaluacion")}
  `;
}

// §7.4 — rúbrica de un solo punto. Solo la columna central (el descriptor de
// "conseguido"); las de mejora y excelencia se dejan en blanco para que el
// profesor anote a mano lo que observa en ese alumno concreto.
function renderRubricaUnPunto(unPunto) {
  const filas = unPunto.dimensiones
    .map(
      (d) => `
      <tr>
        <td class="col-mejora"><div class="linea-comentario"></div></td>
        <td class="col-dimension">
          <span class="bloque-etiqueta bloque-${d.bloque}" title="Bloque LOMLOE ${d.bloque}">${d.bloque}</span>
          <span class="dimension-nombre">${escapeHtml(d.nombre)}${d.obligatorio ? ' <span class="etiqueta-obligatorio">obligatorio</span>' : ""}</span>
          <p>${escapeHtml(d.descriptor)}</p>
        </td>
        <td class="col-excelencia"><div class="linea-comentario"></div></td>
      </tr>
    `
    )
    .join("");

  return `
    ${renderCabeceraInstrumento(unPunto)}
    <div style="overflow-x:auto">
    <table class="rubrica rubrica-un-punto">
      <thead>
        <tr>
          <th class="col-mejora">Evidencias de mejora</th>
          <th class="col-dimension">Lo esperado</th>
          <th class="col-excelencia">Evidencias de excelencia</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    </div>
    ${unPunto.truncado ? `<p class="mensaje-vacio">Se muestran las ${unPunto.dimensiones.length} dimensiones de mayor prioridad; el resto queda fuera por el máximo de la rúbrica de un solo punto (SDD §7.4, Marco Teórico §10).</p>` : ""}
    ${microexplicacion("un-punto")}
  `;
}

// §7.7 — escala de estimación analítica. Puntuación directa por apartado (sin
// elegir entre los cuatro niveles) más el bloque de detractores globales y la
// línea de nota final, todo en blanco para rellenar a mano o al corregir.
function renderEscalaEstimacion(escala) {
  const filas = escala.apartados
    .map(
      (a) => `
      <tr>
        <td class="col-dimension">
          <span class="bloque-etiqueta bloque-${a.bloque}" title="Bloque LOMLOE ${a.bloque}">${a.bloque}</span>
          <span class="dimension-nombre">${escapeHtml(a.nombre)}${a.obligatorio ? ' <span class="etiqueta-obligatorio">obligatorio</span>' : ""}</span>
          <span class="dimension-meta">${escapeHtml(a.criterioOficial)}</span>
        </td>
        <td class="col-max-puntos">${a.maxPuntos.toLocaleString("es-ES", { maximumFractionDigits: 2 })} pts</td>
        <td class="col-puntuacion"><div class="linea-comentario"></div></td>
      </tr>
    `
    )
    .join("");

  return `
    ${renderCabeceraInstrumento(escala)}
    <div style="overflow-x:auto">
    <table class="rubrica rubrica-estimacion">
      <thead>
        <tr>
          <th class="col-dimension">Apartado</th>
          <th class="col-max-puntos">Máx.</th>
          <th class="col-puntuacion">Puntuación otorgada</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    </div>
    <div class="bloque-detractor">
      <span class="dimension-nombre">${escapeHtml(escala.detractor.concepto)}</span>
      <span class="dimension-meta">Transversal a todo el texto, tope −${escala.detractor.tope} puntos</span>
      <div class="linea-comentario"></div>
    </div>
    <p class="nota-final-estimacion">Nota final: <span class="linea-nombre"></span></p>
    ${microexplicacion("escala-estimacion")}
  `;
}

function renderListaCotejo(cotejo, meta) {
  const items = cotejo.items
    .map(
      (it) => `
      <li>
        <input type="checkbox" />
        <span>
          ${escapeHtml(it.item)}
          <span class="cotejo-dimension">${escapeHtml(it.dimension)}</span>
        </span>
      </li>
    `
    )
    .join("");

  return `
    ${renderCabeceraInstrumento(meta)}
    <ul class="lista-cotejo">${items}</ul>
    ${cotejo.truncado ? `<p class="mensaje-vacio">Se muestran los 8 ítems de mayor prioridad; el resto queda fuera por el máximo recomendado (§7.2).</p>` : ""}
    ${microexplicacion("lista-cotejo")}
  `;
}

const ETIQUETAS_NIVEL_FICHA = {
  1: "N1 · En desarrollo",
  2: "N2 · Conseguido",
  3: "N3 · Avanzado",
  4: "N4 · Excelente",
};

// §6.5 — el bloque de resultado dentro de la ficha del alumno, no un
// instrumento nuevo del catálogo (§7): mismo cálculo que "Calificar"
// (calcularResultadoGuardado, js/calificacion.js), aplicado a un alumno ya
// guardado. Se exporta para poder re-renderizar solo este bloque cuando el
// profesor cambia de alumno en el desplegable, sin rehacer toda la ficha.
export function renderResultadoAlumnoFicha(resultadoCalculado) {
  if (!resultadoCalculado) {
    return `<p class="mensaje-vacio">Elige un alumno calificado para ver su resultado, o deja esta vista en blanco para repartirla en clase.</p>`;
  }

  const { filas, notaFinal, notaCalculada, notaTrasDetractor, detractorAcumulado, disparada } = resultadoCalculado;

  const filasHtml = filas
    .map(
      (f) => `
      <tr>
        <td class="col-dimension">
          <span class="bloque-etiqueta bloque-${f.criterio.bloque_lomloe}" title="Bloque LOMLOE ${f.criterio.bloque_lomloe}">${f.criterio.bloque_lomloe}</span>
          <span class="dimension-nombre">${escapeHtml(f.criterio.nombre)}</span>
        </td>
        <td class="col-nivel-alcanzado">${ETIQUETAS_NIVEL_FICHA[f.nivel]}</td>
        <td class="col-puntos-alcanzados">${f.puntos.toFixed(2)} pts · aporta ${f.aporta.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="overflow-x:auto">
    <table class="rubrica rubrica-resultado-alumno">
      <thead>
        <tr>
          <th class="col-dimension">Dimensión</th>
          <th class="col-nivel-alcanzado">Nivel alcanzado</th>
          <th class="col-puntos-alcanzados">Puntos</th>
        </tr>
      </thead>
      <tbody>${filasHtml}</tbody>
    </table>
    </div>
    ${
      detractorAcumulado > 0
        ? `<p class="ayuda">Detractor aplicado: −${detractorAcumulado.toFixed(2)} (nota antes del detractor: ${notaCalculada.toFixed(2)}; después: ${notaTrasDetractor.toFixed(2)})</p>`
        : ""
    }
    ${
      disparada
        ? `<div class="aviso-caja">Condición mínima disparada: la nota se recorta a 4,9.</div>`
        : ""
    }
    <p class="nota-final-estimacion">Nota final: <strong>${notaFinal.toFixed(2)}</strong></p>
  `;
}

function renderFichaAlumno(ficha, alumnos) {
  const valora = ficha.queSeValora
    .map((d) => `<li>${escapeHtml(d.nombre)} <span class="peso-pill">${d.peso}%</span></li>`)
    .join("");
  const excelente = ficha.comoLlegarAExcelente
    .map((d) => `<li><strong>${escapeHtml(d.nombre)}:</strong> ${escapeHtml(d.texto)}</li>`)
    .join("");

  const nombres = Object.keys(alumnos).sort((a, b) => a.localeCompare(b, "es"));
  const opcionesAlumno = nombres.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

  return `
    ${renderCabeceraInstrumento(ficha)}
    ${microexplicacion("ficha-alumno")}
    <div class="ficha-bloque">
      <h3>Qué se te pide</h3>
      <p>${escapeHtml(ficha.actividad)}</p>
    </div>
    <div class="ficha-bloque">
      <h3>Qué se valora</h3>
      <ul>${valora}</ul>
    </div>
    <div class="ficha-bloque">
      <h3>Cómo llegar al nivel excelente</h3>
      <ul>${excelente}</ul>
    </div>
    <div class="ficha-bloque">
      <h3>Resultado de un alumno calificado</h3>
      <label for="selector-alumno-ficha">Alumno</label>
      <select id="selector-alumno-ficha">
        <option value="">— vista en blanco, para repartir en clase —</option>
        ${opcionesAlumno}
      </select>
      <div id="resultado-alumno-ficha">${renderResultadoAlumnoFicha(null)}</div>
    </div>
    <div class="ficha-bloque">
      <h3>Cómo se calcula la nota</h3>
      <p>${escapeHtml(ficha.calculo.texto)}</p>
    </div>
  `;
}

function renderAvisos(resultado) {
  const bloques = [];
  if (resultado.avisosProgresion.length) {
    bloques.push(
      resultado.avisosProgresion
        .map((a) => `<div class="aviso-caja">${escapeHtml(a)}</div>`)
        .join("")
    );
    bloques.push(microexplicacion("progresion"));
  }
  const avisosPesos = comprobarRepartoPesos(resultado.criterios);
  if (avisosPesos.length) {
    bloques.push(
      avisosPesos.map((a) => `<div class="aviso-caja">${escapeHtml(a)}</div>`).join("")
    );
  }
  const c = resultado.complejidad;
  const claseIndicador = { verde: "indicador-verde", amarillo: "indicador-amarillo", rojo: "indicador-rojo" }[c.nivel];
  bloques.push(
    `<p class="instrumento-cabecera">Complejidad del instrumento
      <span class="indicador ${claseIndicador}">${c.nDimensiones} dimensiones · ${c.nBloques} bloques</span>
    </p>`
  );
  bloques.push(microexplicacion("pesos"));
  bloques.push(microexplicacion("complejidad"));
  if (c.aviso) bloques.push(`<div class="aviso-caja">${escapeHtml(c.aviso)}</div>`);
  return bloques.join("");
}

export function renderResultado(container, { puertaInfo, resultado, alumnos = {} }) {
  if (!puertaInfo.generaRubrica) {
    container.innerHTML = `<h2>No se genera rúbrica</h2>${renderExplicacionPuerta(puertaInfo)}`;
    container.hidden = false;
    return;
  }

  if (!resultado.ok) {
    container.innerHTML = `
      <h2>Esta combinación aún no está en el pack</h2>
      <div class="aviso-caja">${escapeHtml(resultado.motivo)}</div>
      <p class="mensaje-vacio">La app no inventa un criterio inexistente: prueba con otro curso o tipo de tarea de los que ya están cargados.</p>
      ${renderPorQueRegla("tarea_aplicable")}
    `;
    container.hidden = false;
    return;
  }

  container.innerHTML = `
    <h2>Vista previa</h2>
    ${renderExplicacionPuerta(puertaInfo)}
    ${renderAvisos(resultado)}
    <div class="tabs" role="tablist">
      <button class="tab-boton" data-tab="rubrica" role="tab" aria-selected="true">Rúbrica analítica</button>
      <button class="tab-boton" data-tab="cotejo" role="tab" aria-selected="false">Lista de cotejo</button>
      <button class="tab-boton" data-tab="ficha" role="tab" aria-selected="false">Ficha del alumno</button>
      <button class="tab-boton" data-tab="unpunto" role="tab" aria-selected="false">Rúbrica de un punto</button>
      <button class="tab-boton" data-tab="auto" role="tab" aria-selected="false">Autoevaluación</button>
      <button class="tab-boton" data-tab="coeval" role="tab" aria-selected="false">Coevaluación</button>
      <button class="tab-boton" data-tab="estimacion" role="tab" aria-selected="false">Escala de estimación</button>
      <button class="tab-boton tab-boton-utilidad" id="btn-ajustar" type="button">Ajustar</button>
      <button class="tab-boton tab-boton-utilidad" id="btn-calificar" type="button">Calificar</button>
      <button class="tab-boton tab-boton-utilidad" id="btn-imprimir" type="button">Imprimir esta vista</button>
    </div>
    <div class="panel-instrumento" data-panel="rubrica">${renderRubricaAnalitica(resultado.rubricaAnalitica)}</div>
    <div class="panel-instrumento" data-panel="cotejo" hidden>${renderListaCotejo(resultado.listaCotejo, resultado.fichaAlumno)}</div>
    <div class="panel-instrumento" data-panel="ficha" hidden>${renderFichaAlumno(resultado.fichaAlumno, alumnos)}</div>
    <div class="panel-instrumento" data-panel="unpunto" hidden>${renderRubricaUnPunto(resultado.rubricaUnPunto)}</div>
    <div class="panel-instrumento" data-panel="auto" hidden>${renderMatrizPersona(resultado.autoevaluacion)}</div>
    <div class="panel-instrumento" data-panel="coeval" hidden>${renderMatrizPersona(resultado.autoevaluacion, { coevaluacion: true })}</div>
    <div class="panel-instrumento" data-panel="estimacion" hidden>${renderEscalaEstimacion(resultado.escalaEstimacion)}</div>
  `;
  container.hidden = false;

  container.querySelectorAll(".tab-boton[data-tab]").forEach((boton) => {
    boton.addEventListener("click", () => {
      container.querySelectorAll(".tab-boton[data-tab]").forEach((b) => b.setAttribute("aria-selected", "false"));
      boton.setAttribute("aria-selected", "true");
      const objetivo = boton.dataset.tab;
      container.querySelectorAll(".panel-instrumento").forEach((p) => {
        p.hidden = p.dataset.panel !== objetivo;
      });
    });
  });

  container.querySelector("#btn-imprimir").addEventListener("click", () => window.print());
}

// "¿Por qué esta regla?" a partir del catálogo REGLAS de validador.js — no
// del catálogo MICROEXPLICACIONES, que es otro conjunto de textos. Se marca
// con la misma clase que una microexplicación normal (se oculta igual en
// impresión) aunque venga de un catálogo distinto (§10, §11.3).
function renderPorQueRegla(idRegla) {
  const meta = REGLAS[idRegla];
  if (!meta) return "";
  return `
    <details class="microexplicacion">
      <summary>¿por qué esta regla?</summary>
      <p>${escapeHtml(meta.porQue)}</p>
    </details>
  `;
}

// Diagnóstico de calidad del pack cargado (§10). Se ejecuta una vez al
// arrancar la app: no es un control por instrumento, es la garantía de que
// el contenido con el que se está trabajando pasa las reglas del validador.
export function renderSaludPack(container, informe) {
  if (informe.nErrores === 0 && informe.nAvisos === 0) {
    container.innerHTML = `
      <details>
        <summary class="marca-ok">Salud del pack: sin incidencias (validador §10)</summary>
        <p class="mensaje-vacio">Los descriptores, matrices y penalizaciones del pack cargado pasan las reglas automatizables del validador.</p>
        ${microexplicacion("salud-pack")}
      </details>
    `;
    container.hidden = false;
    return;
  }

  // Agrupados por regla: la explicación aparece una sola vez, no una por
  // aviso (§4.3 de la especificación del validador de la app).
  const porRegla = new Map();
  for (const a of informe.avisos) {
    const lista = porRegla.get(a.regla) ?? [];
    lista.push(a);
    porRegla.set(a.regla, lista);
  }

  const grupos = [...porRegla.entries()]
    .map(([regla, avisosRegla]) => {
      const meta = REGLAS[regla];
      const items = avisosRegla
        .map(
          (a) => `
          <li>
            <strong class="marca-severidad marca-${a.severidad}">${a.severidad === "error" ? "Error" : "Aviso"}</strong>
            ${escapeHtml(a.mensaje)}
          </li>
        `
        )
        .join("");
      return `
        <li class="grupo-regla">
          <strong>${escapeHtml(meta?.etiqueta ?? regla)}</strong>
          <ul>${items}</ul>
          ${renderPorQueRegla(regla)}
        </li>
      `;
    })
    .join("");

  container.innerHTML = `
    <details open>
      <summary class="marca-aviso-resumen">Salud del pack: ${informe.nErrores} error(es), ${informe.nAvisos} aviso(s)</summary>
      <ul class="mensaje-vacio">${grupos}</ul>
    </details>
  `;
  container.hidden = false;
}
