import { PUERTA_APLICABILIDAD, TIEMPOS_CORRECCION, tiposTareaDisponibles, cursosDisponibles } from "./motor.js";
import { comprobarRepartoPesos, REGLAS } from "./validador.js";
import { microexplicacion } from "./microexplicaciones.js";
import { calcularResultadoGuardado } from "./calificacion.js";

// Las etiquetas y el orden de los cursos vienen de data/catalogo.json, no de
// aquí: eran tres listas cableadas en este archivo y una cuarta —la de packs—
// en main.js, y una materia nueva obligaba a tocar las cuatro. main.js llama a
// fijarCatalogo() nada más cargarlo.
//
// Si algo pide una etiqueta antes de que el catálogo esté puesto, se devuelve
// la clave cruda en vez de "undefined": una interfaz con "1ESO" escrito se
// entiende y se ve; una con "undefined" parece un fallo de contenido.
let CATALOGO = { cursos: { orden: [], etiquetas: {} }, materias: {}, niveles: { nombres: {} } };

export function fijarCatalogo(catalogo) {
  CATALOGO = catalogo;
}

// Los nombres de los cuatro niveles son de Lengua (H4 de la matriz digital,
// marco teórico vigente §2.1) y viven en data/catalogo.json, no aquí: estaban
// escritos cuatro veces en js/ y por eso la app siguió imprimiendo "Conseguido"
// después de que la matriz digital diera la contradicción C1 por resuelta a
// favor de "Suficiente", que es lo que dice el material que ya está en clase.
// Sin catálogo puesto se imprime "N2" a secas, por lo mismo que un curso sin
// etiqueta imprime "1ESO": una cabecera incompleta se entiende, "undefined" no.
export function etiquetaNivel(n) {
  const nombre = CATALOGO.niveles?.nombres?.[String(n)];
  return nombre ? `N${n} · ${nombre}` : `N${n}`;
}

function etiquetaTipoTarea(tipo) {
  for (const materia of Object.values(CATALOGO.materias ?? {})) {
    const etiqueta = materia.tipos_tarea?.[tipo];
    if (etiqueta) return etiqueta;
  }
  return tipo;
}

function etiquetaCurso(curso) {
  return CATALOGO.cursos?.etiquetas?.[curso] ?? curso;
}

function ordenCursos() {
  return CATALOGO.cursos?.orden ?? [];
}

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
    .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(etiquetaTipoTarea(t))}</option>`)
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
    (a, b) => ordenCursos().indexOf(a) - ordenCursos().indexOf(b)
  );
  els.curso.innerHTML = cursos
    .map((c) => `<option value="${c}">${escapeHtml(etiquetaCurso(c))}</option>`)
    .join("");
}

function renderExplicacionPuerta(puertaInfo) {
  return `
    <div class="aviso-caja explicacion-puerta">
      <p>${escapeHtml(puertaInfo.explicacion)}</p>
    </div>
  `;
}

// La puerta de aplicabilidad no solo explica: elige la pestaña con la que se
// abre la vista previa (SDD §8). Es la diferencia entre recomendar un
// instrumento y entregarlo; si la app propone la lista de cotejo y abre la
// rúbrica analítica, el consejo se queda en letra pequeña.
const PANEL_POR_INSTRUMENTO = {
  rubrica_analitica: "rubrica",
  lista_cotejo: "cotejo",
  escala_estimacion: "estimacion",
};

function panelInicial(puertaInfo) {
  return PANEL_POR_INSTRUMENTO[puertaInfo.instrumentoRecomendado] ?? "rubrica";
}

function renderCabeceraInstrumento(meta) {
  return `
    <p class="instrumento-cabecera">
      <strong>Actividad:</strong> ${escapeHtml(meta.actividad)} ·
      <strong>Curso:</strong> ${escapeHtml(etiquetaCurso(meta.curso))} ·
      <strong>Tipo de tarea:</strong> ${escapeHtml(etiquetaTipoTarea(meta.tipoTarea))}
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
    <div class="tabla-rodante">
    <table class="rubrica">
      <thead>
        <tr>
          <th class="col-dimension">Dimensión</th>
          ${[1, 2, 3, 4].map((n) => `<th class="col-nivel nivel-${n}">${escapeHtml(etiquetaNivel(n))}</th>`).join("")}
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
    <div class="tabla-rodante">
    <table class="rubrica">
      <thead>
        <tr>
          <th class="col-dimension">Dimensión</th>
          ${[1, 2, 3, 4].map((n) => `<th class="col-nivel nivel-${n}">${escapeHtml(etiquetaNivel(n))}</th>`).join("")}
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    </div>
    ${microexplicacion(coevaluacion ? "coevaluacion" : "autoevaluacion")}
  `;
}

// §7.4 — rúbrica de un solo punto. Solo la columna central (el descriptor de
// N2, "suficiente"); las de mejora y excelencia se dejan en blanco para que el
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
    <div class="tabla-rodante">
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
    <div class="tabla-rodante">
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
        <td class="col-nivel-alcanzado">${escapeHtml(etiquetaNivel(f.nivel))}</td>
        <td class="col-puntos-alcanzados">${f.puntos.toFixed(2)} pts · aporta ${f.aporta.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="tabla-rodante">
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
      ${
        ficha.razonPeso
          ? `<p class="ayuda razon-peso"><strong>Por qué no pesan igual:</strong> ${escapeHtml(ficha.razonPeso)}</p>`
          : ""
      }
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
  const plural = (n, singular, pluralPalabra) => `${n} ${n === 1 ? singular : pluralPalabra}`;
  bloques.push(
    `<p class="instrumento-cabecera">Complejidad del instrumento
      <span class="indicador ${claseIndicador}">${plural(c.nDimensiones, "dimensión", "dimensiones")} · ${plural(c.nBloques, "bloque", "bloques")}</span>
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

  const inicial = panelInicial(puertaInfo);
  const pestanas = [
    ["rubrica", "Rúbrica analítica"],
    ["cotejo", "Lista de cotejo"],
    ["ficha", "Ficha del alumno"],
    ["unpunto", "Rúbrica de un punto"],
    ["auto", "Autoevaluación"],
    ["coeval", "Coevaluación"],
    ["estimacion", "Escala de estimación"],
  ]
    .map(
      ([id, etiqueta]) =>
        `<button class="tab-boton" data-tab="${id}" role="tab" aria-selected="${id === inicial}">${etiqueta}</button>`
    )
    .join("\n      ");

  const panel = (id, contenido) =>
    `<div class="panel-instrumento" data-panel="${id}"${id === inicial ? "" : " hidden"}>${contenido}</div>`;

  container.innerHTML = `
    <h2>Vista previa</h2>
    ${renderExplicacionPuerta(puertaInfo)}
    ${resultado.avisoPremarcado ? `<div class="aviso-caja">${escapeHtml(resultado.avisoPremarcado)}</div>` : ""}
    ${renderAvisos(resultado)}
    <div class="tabs" role="tablist">
      ${pestanas}
      <button class="tab-boton tab-boton-utilidad" id="btn-ajustar" type="button">Ajustar</button>
      <button class="tab-boton tab-boton-utilidad" id="btn-calificar" type="button">Calificar</button>
      <button class="tab-boton tab-boton-utilidad" id="btn-imprimir" type="button">Imprimir esta vista</button>
    </div>
    ${panel("rubrica", renderRubricaAnalitica(resultado.rubricaAnalitica))}
    ${panel("cotejo", renderListaCotejo(resultado.listaCotejo, resultado.fichaAlumno))}
    ${panel("ficha", renderFichaAlumno(resultado.fichaAlumno, alumnos))}
    ${panel("unpunto", renderRubricaUnPunto(resultado.rubricaUnPunto))}
    ${panel("auto", renderMatrizPersona(resultado.autoevaluacion))}
    ${panel("coeval", renderMatrizPersona(resultado.autoevaluacion, { coevaluacion: true }))}
    ${panel("estimacion", renderEscalaEstimacion(resultado.escalaEstimacion))}
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
