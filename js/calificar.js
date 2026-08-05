// Pantalla de registro del resultado de un alumno — SDD §6.5. Es la pieza que
// faltaba para que el modo numérico (§6.2-§6.4) sirviera de algo: hasta aquí,
// js/calificacion.js tenía las funciones de cálculo pero ningún sitio donde
// entrara un ResultadoCriterio real.
//
// Sigue el mismo patrón que modo-avanzado.js (render + conectarEventos +
// callback de cierre). Persiste en localStorage, namespaced por curso +
// tipo de tarea + actividad, para que calificar a treinta alumnos de la
// misma prueba no se pierda al cerrar el navegador. No conecta todavía con
// la ficha impresa ni con ningún instrumento con detractor (§7.7 no existe).

import { calcularNota, puntosYNivelDe, redondear2 } from "./calificacion.js";
import { DETRACTOR_ESTIMACION } from "./motor.js";
import { microexplicacion } from "./microexplicaciones.js";
import { escapeHtml } from "./ui.js";

const ETIQUETAS_NIVEL = {
  1: "N1 · En desarrollo",
  2: "N2 · Conseguido",
  3: "N3 · Avanzado",
  4: "N4 · Excelente",
};

// --- Persistencia (§6.5) ---------------------------------------------------
// Un alumno se guarda dentro de un "instrumento" (curso + tipo de tarea +
// actividad): la misma prueba, corregida a lo largo de varias sesiones, cae
// siempre en el mismo cajón. Cambiar la actividad de sitio es intencional:
// es una prueba distinta y no debería mezclar alumnos con otra.
const CLAVE_ALMACEN = "rubricas-lomloe:calificaciones:v1";

function claveInstrumento(meta) {
  return `${meta.curso}::${meta.tipoTarea}::${meta.actividad}`;
}

function leerAlmacen() {
  try {
    const bruto = localStorage.getItem(CLAVE_ALMACEN);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

function escribirAlmacen(almacen) {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
  } catch {
    // localStorage lleno o inaccesible (modo privado): la pantalla se sigue
    // usando, solo que sin persistencia. No es motivo para romper la nota.
  }
}

export function alumnosGuardados(meta) {
  return leerAlmacen()[claveInstrumento(meta)] ?? {};
}

function guardarAlumno(meta, nombre, datos) {
  const almacen = leerAlmacen();
  const clave = claveInstrumento(meta);
  almacen[clave] = almacen[clave] ?? {};
  almacen[clave][nombre] = { ...datos, fecha: new Date().toISOString() };
  escribirAlmacen(almacen);
}

function eliminarAlumno(meta, nombre) {
  const almacen = leerAlmacen();
  const clave = claveInstrumento(meta);
  if (almacen[clave]) {
    delete almacen[clave][nombre];
    escribirAlmacen(almacen);
  }
}

function renderComponente(comp) {
  const opciones = comp.bandas
    .map((b, i) => `<option value="${i}">${b.puntos} pts — ${escapeHtml(b.condicion)}</option>`)
    .join("");
  return `
    <div class="componente-matriz">
      <label>${escapeHtml(comp.nombre)} <span class="peso-pill">máx. ${comp.max}</span></label>
      <select class="select-banda" data-comp="${escapeHtml(comp.nombre)}">
        <option value="">— selecciona la banda —</option>
        ${opciones}
      </select>
    </div>
  `;
}

function renderPenalizacion(pen) {
  return `
    <div class="penalizacion-matriz">
      <label>${escapeHtml(pen.por)} <span class="peso-pill">${pen.puntos} pts, tope ${pen.tope}</span></label>
      <input type="number" class="input-ocurrencias" data-clave="${escapeHtml(pen.clave)}" min="0" step="1" value="0" />
    </div>
  `;
}

function renderCriterioMatriz(criterio) {
  const componentes = criterio.matriz_cuantitativa.componentes.map(renderComponente).join("");
  const penalizaciones = criterio.matriz_cuantitativa.penalizaciones ?? [];
  const bloquePenalizaciones = penalizaciones.length
    ? `<div class="penalizaciones-matriz">${penalizaciones.map(renderPenalizacion).join("")}</div>`
    : "";
  return `<div class="matriz-calificar">${componentes}${bloquePenalizaciones}</div>`;
}

function renderCriterioNivel(criterio) {
  const radios = [1, 2, 3, 4]
    .map((n) => {
      const texto = criterio.descriptores?.[`n${n}`]?.texto ?? "";
      return `
        <label class="opcion-nivel">
          <input type="radio" name="nivel-${criterio.id}" value="${n}" />
          <span><strong>${ETIQUETAS_NIVEL[n]}</strong> — ${escapeHtml(texto)}</span>
        </label>
      `;
    })
    .join("");
  return `<div class="niveles-calificar">${radios}</div>`;
}

function renderListaAlumnos(meta) {
  const alumnos = alumnosGuardados(meta);
  const nombres = Object.keys(alumnos).sort((a, b) => a.localeCompare(b, "es"));

  if (!nombres.length) {
    return `<p class="mensaje-vacio">Todavía no has guardado ninguna calificación para esta actividad.</p>`;
  }

  const filas = nombres
    .map((nombre) => {
      const a = alumnos[nombre];
      return `
        <li class="alumno-guardado">
          <span class="alumno-nombre">${escapeHtml(nombre)}</span>
          <span class="alumno-nota">${a.notaFinal.toFixed(2)}</span>
          <button type="button" class="cargar-alumno" data-alumno="${escapeHtml(nombre)}">Cargar</button>
          <button type="button" class="eliminar-alumno" data-alumno="${escapeHtml(nombre)}">Eliminar</button>
        </li>
      `;
    })
    .join("");

  return `<ul class="lista-alumnos-guardados" id="lista-alumnos-guardados">${filas}</ul>`;
}

export function renderCalificacion(container, criterios, meta) {
  const filas = criterios
    .map((c) => {
      const tipo = c.matriz_cuantitativa ? "matriz" : "nivel";
      return `
        <div class="fila-calificar" data-criterio-id="${c.id}" data-tipo="${tipo}">
          <div class="fila-encabezado">
            <span class="dimension-nombre">${escapeHtml(c.nombre)}${c.obligatorio ? ` <span class="etiqueta-obligatorio">obligatorio</span>` : ""}</span>
            <span class="peso-pill">${c.peso_normalizado.toFixed(1)}%</span>
          </div>
          ${tipo === "matriz" ? renderCriterioMatriz(c) : renderCriterioNivel(c)}
          <p class="resultado-criterio" data-resultado-criterio></p>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <h2>Calificar</h2>
    ${microexplicacion("modo-numerico")}
    <p class="ayuda">Registra el resultado de un alumno concreto y guárdalo para seguir con el siguiente.</p>

    <div class="config-calificacion">
      <label for="nombre-alumno">Nombre del alumno</label>
      <input type="text" id="nombre-alumno" placeholder="p. ej. García Ruiz, Elena" autocomplete="off" />

      <label for="escala-nivel">Escala de valor de los niveles sin matriz</label>
      <select id="escala-nivel">
        <option value="equilibrada">Equilibrada (2,5 / 5 / 7,5 / 10)</option>
        <option value="exigente">Exigente (0 / 5 / 7,5 / 10)</option>
      </select>
      ${microexplicacion("escala-nivel")}

      <label class="opcion-checkbox">
        <input type="checkbox" id="condicion-minima" />
        Condición mínima: un criterio obligatorio en N1 limita la nota a 4,9
      </label>
      ${microexplicacion("condicion-minima")}

      <label for="detractor-acumulado">${escapeHtml(DETRACTOR_ESTIMACION.concepto)}: puntos a restar de la nota (0 a ${DETRACTOR_ESTIMACION.tope})</label>
      <input type="number" id="detractor-acumulado" min="0" max="${DETRACTOR_ESTIMACION.tope}" step="0.1" value="0" />
      ${microexplicacion("detractor-estimacion")}
    </div>

    <div class="criterios-calificar">${filas}</div>

    <div class="resultado-nota" id="resultado-nota">
      <p class="mensaje-vacio">Completa todos los criterios para ver la nota.</p>
    </div>

    <div class="botones-modo-avanzado">
      <button id="guardar-alumno" type="button">Guardar calificación</button>
      <button id="reiniciar-calificacion" type="button">Calificar a otro alumno</button>
      <button id="cerrar-calificacion" type="button">Volver a la vista previa</button>
    </div>

    <div class="alumnos-guardados-bloque">
      <h3>Alumnos calificados en esta actividad</h3>
      <div id="alumnos-guardados-contenedor">${renderListaAlumnos(meta)}</div>
    </div>
  `;
}

// Lee la selección de una fila. Devuelve null si todavía falta algo por
// marcar — una nota no se calcula con huecos rellenados a ciegas.
function leerResultadoFila(fila, criterio) {
  if (fila.dataset.tipo === "matriz") {
    const bandasElegidas = {};
    for (const select of fila.querySelectorAll(".select-banda")) {
      if (select.value === "") return null;
      const comp = criterio.matriz_cuantitativa.componentes.find((c) => c.nombre === select.dataset.comp);
      bandasElegidas[select.dataset.comp] = comp.bandas[Number(select.value)].puntos;
    }
    const ocurrenciasPenalizacion = {};
    for (const input of fila.querySelectorAll(".input-ocurrencias")) {
      ocurrenciasPenalizacion[input.dataset.clave] = Number(input.value) || 0;
    }
    return { tipo: "matriz", bandasElegidas, ocurrenciasPenalizacion };
  }

  const marcado = fila.querySelector(`input[name="nivel-${criterio.id}"]:checked`);
  if (!marcado) return null;
  return { tipo: "nivel", nivel: Number(marcado.value) };
}

// Rellena una fila con un ResultadoCriterio guardado, para poder recargar
// a un alumno y seguir corrigiendo o corregir un despiste sin repetirlo todo.
function aplicarResultadoAFila(fila, criterio, resultado) {
  if (fila.dataset.tipo === "matriz") {
    for (const select of fila.querySelectorAll(".select-banda")) {
      const comp = criterio.matriz_cuantitativa.componentes.find((c) => c.nombre === select.dataset.comp);
      const puntos = resultado.bandasElegidas?.[select.dataset.comp];
      const idx = comp.bandas.findIndex((b) => b.puntos === puntos);
      select.value = idx >= 0 ? String(idx) : "";
    }
    for (const input of fila.querySelectorAll(".input-ocurrencias")) {
      input.value = resultado.ocurrenciasPenalizacion?.[input.dataset.clave] ?? 0;
    }
  } else {
    const radio = fila.querySelector(`input[name="nivel-${criterio.id}"][value="${resultado.nivel}"]`);
    if (radio) radio.checked = true;
  }
}

export function conectarEventosCalificacion(container, criterios, meta, onCerrar) {
  const porId = Object.fromEntries(criterios.map((c) => [c.id, c]));
  const resultadoNota = container.querySelector("#resultado-nota");
  const escalaSelect = container.querySelector("#escala-nivel");
  const condicionCheckbox = container.querySelector("#condicion-minima");
  const detractorInput = container.querySelector("#detractor-acumulado");
  const nombreInput = container.querySelector("#nombre-alumno");

  // Último cálculo completo, con los ResultadoCriterio crudos por criterio:
  // es lo que "Guardar calificación" persiste. null mientras falte algo.
  let ultimoCalculo = null;

  function actualizar() {
    const escala = escalaSelect.value;
    const entradas = [];
    const resultadosPorCriterio = {};
    let completo = true;

    for (const fila of container.querySelectorAll(".fila-calificar")) {
      const criterio = porId[fila.dataset.criterioId];
      const resultado = leerResultadoFila(fila, criterio);
      const parrafoResultado = fila.querySelector("[data-resultado-criterio]");

      if (!resultado) {
        completo = false;
        parrafoResultado.textContent = "";
        continue;
      }

      const { puntos, nivel } = puntosYNivelDe(criterio, resultado, escala);
      const aporta = redondear2((puntos * criterio.peso_normalizado) / 100);
      parrafoResultado.textContent = `Puntos: ${puntos.toFixed(2)} · ${ETIQUETAS_NIVEL[nivel]} · aporta ${aporta.toFixed(2)} a la nota`;

      resultadosPorCriterio[criterio.id] = resultado;
      entradas.push({
        peso_base: criterio.peso_normalizado,
        obligatorio: !!criterio.obligatorio,
        matrizCuantitativa: criterio.matriz_cuantitativa,
        resultado,
      });
    }

    if (!completo || entradas.length === 0) {
      resultadoNota.innerHTML = `<p class="mensaje-vacio">Completa todos los criterios para ver la nota.</p>`;
      ultimoCalculo = null;
      return;
    }

    const condicionMinimaActiva = condicionCheckbox.checked;
    // §6.3 — el profesor introduce el valor ya acumulado (no se cuenta por
    // ocurrencias, porque el pack no declara una tarifa por falta); se acota
    // aquí porque un <input type="number"> no impide escribir fuera de
    // min/max a mano.
    const detractorAcumulado = Math.min(
      Math.max(Number(detractorInput.value) || 0, 0),
      DETRACTOR_ESTIMACION.tope
    );
    const { notaCalculada, notaTrasDetractor, notaFinal, algunObligatorioEnN1 } = calcularNota(entradas, {
      escala,
      condicionMinimaActiva,
      detractorAcumulado,
    });

    const disparada = condicionMinimaActiva && algunObligatorioEnN1;
    resultadoNota.innerHTML = `
      <p class="nota-final">Nota final: <strong>${notaFinal.toFixed(2)}</strong></p>
      ${
        detractorAcumulado > 0
          ? `<p class="ayuda">Detractor aplicado: −${detractorAcumulado.toFixed(2)} (nota antes del detractor: ${notaCalculada.toFixed(2)}; después: ${notaTrasDetractor.toFixed(2)})</p>`
          : ""
      }
      ${
        disparada
          ? `<div class="aviso-caja">Condición mínima disparada: la nota tras el detractor era ${notaTrasDetractor.toFixed(2)} y se recorta a 4,9.</div>`
          : ""
      }
    `;

    ultimoCalculo = {
      escala,
      condicionMinima: condicionMinimaActiva,
      detractorAcumulado,
      notaCalculada,
      notaFinal,
      resultadosPorCriterio,
    };
  }

  function refrescarListaAlumnos() {
    container.querySelector("#alumnos-guardados-contenedor").innerHTML = renderListaAlumnos(meta);
  }

  container.addEventListener("input", actualizar);
  container.addEventListener("change", actualizar);

  container.querySelector("#reiniciar-calificacion").addEventListener("click", () => {
    nombreInput.value = "";
    container.querySelectorAll('.fila-calificar input[type="radio"]').forEach((r) => (r.checked = false));
    container.querySelectorAll(".select-banda").forEach((s) => (s.value = ""));
    container.querySelectorAll(".input-ocurrencias").forEach((i) => (i.value = 0));
    detractorInput.value = 0;
    actualizar();
  });

  container.querySelector("#guardar-alumno").addEventListener("click", () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) {
      nombreInput.focus();
      return;
    }
    if (!ultimoCalculo) {
      resultadoNota.innerHTML = `<div class="aviso-caja">Completa todos los criterios antes de guardar.</div>`;
      return;
    }
    guardarAlumno(meta, nombre, ultimoCalculo);
    refrescarListaAlumnos();
  });

  container.querySelector("#alumnos-guardados-contenedor").addEventListener("click", (ev) => {
    const nombre = ev.target.dataset.alumno;
    if (!nombre) return;

    if (ev.target.classList.contains("eliminar-alumno")) {
      eliminarAlumno(meta, nombre);
      refrescarListaAlumnos();
      return;
    }

    if (ev.target.classList.contains("cargar-alumno")) {
      const datos = alumnosGuardados(meta)[nombre];
      if (!datos) return;
      nombreInput.value = nombre;
      escalaSelect.value = datos.escala;
      condicionCheckbox.checked = datos.condicionMinima;
      detractorInput.value = datos.detractorAcumulado ?? 0;
      for (const fila of container.querySelectorAll(".fila-calificar")) {
        const criterio = porId[fila.dataset.criterioId];
        const resultado = datos.resultadosPorCriterio[criterio.id];
        if (resultado) aplicarResultadoAFila(fila, criterio, resultado);
      }
      actualizar();
    }
  });

  container.querySelector("#cerrar-calificacion").addEventListener("click", () => onCerrar());

  actualizar();
}
