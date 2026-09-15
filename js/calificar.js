// Pantalla de registro del resultado de un alumno — SDD §6.5. Es la pieza que
// faltaba para que el modo numérico (§6.2-§6.4) sirviera de algo: hasta aquí,
// js/calificacion.js tenía las funciones de cálculo pero ningún sitio donde
// entrara un ResultadoCriterio real.
//
// Desde la v1.54 es una cuadrícula, al modo de iDoceo: la misma tabla de la
// rúbrica (dimensiones por filas, cuatro niveles por columnas), con las
// celdas de descriptor pinchables y la nota fija arriba, recalculada a cada
// clic. La versión anterior era una columna de tarjetas con desplegables y
// la nota al final: calificar exigía desplazarse dos o tres pantallas entre
// marcar y ver el resultado. En las dimensiones con matriz cuantitativa,
// «Contar» despliega dentro de la fila los componentes con sus bandas,
// también pinchables, para cuando se quiere la precisión de §6.3.
//
// Sigue el mismo patrón que modo-avanzado.js (render + conectarEventos +
// callback de cierre). Persiste en localStorage, namespaced por curso +
// tipo de tarea + actividad, para que calificar a treinta alumnos de la
// misma prueba no se pierda al cerrar el navegador. El formato guardado es
// el mismo desde la v1.5: los alumnos calificados antes de la cuadrícula se
// cargan igual.

import {
  calcularNota,
  puntosYNivelDe,
  redondear2,
  estadoFilaVacio,
  resultadoDeFila,
  estadoDeResultado,
} from "./calificacion.js";
import { DETRACTOR_ESTIMACION } from "./motor.js";
import { microexplicacion } from "./microexplicaciones.js";
import { escapeHtml, textoPack, etiquetaNivel } from "./ui.js";
import { filasACsv, descargarCsv, nombreMmaaaa } from "./csv.js";

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

// --- Exportación de notas (§17.19, ampliada el 2026-08-25) -----------------
// La app califica (esta pantalla) y también exporta: no hace falta pasar por
// el skill rubricas-lomloe. Esto es la vía de iDoceo del asistente general
// de importación de alumnos: una fila por alumno, con la nota ya calculada.
// (La otra vía de iDoceo, importar la rúbrica entera para calificar dentro
// de iDoceo, vive en js/ui.js — son dos caminos alternativos, no la misma
// exportación con otro nombre: §17.19, ampliada el 2026-08-26.)
export function csvNotas(meta) {
  const alumnos = alumnosGuardados(meta);
  const nombres = Object.keys(alumnos).sort((a, b) => a.localeCompare(b, "es"));
  const filas = [
    ["Alumno", "Nota"],
    ...nombres.map((nombre) => [nombre, alumnos[nombre].notaFinal.toFixed(2)]),
  ];
  return filasACsv(filas);
}

function nombreArchivoCsv(meta) {
  return `Notas_${meta.tipoTarea}_${meta.curso}_${nombreMmaaaa()}.csv`;
}

function descargarCsvNotas(meta) {
  descargarCsv(nombreArchivoCsv(meta), csvNotas(meta));
}

// --- Cuadrícula (§6.5, v1.54) ---------------------------------------------

function formatoPuntos(n) {
  return String(n).replace(".", ",");
}

function renderCeldaNivel(criterio, n) {
  const texto = criterio.descriptores?.[`n${n}`]?.texto ?? "";
  return `
    <td class="celda-nivel nivel-${n}" data-nivel="${n}" role="button" tabindex="0" aria-pressed="false"
        title="${escapeHtml(etiquetaNivel(n))}">
      ${textoPack(texto)}
    </td>
  `;
}

function renderComponenteContar(comp) {
  const bandas = comp.bandas
    .map(
      (b, i) => `
      <button type="button" class="celda-banda" data-idx="${i}" aria-pressed="false">
        <strong>${formatoPuntos(b.puntos)}</strong>
        <span>${textoPack(b.condicion)}</span>
      </button>
    `
    )
    .join("");
  return `
    <div class="componente-contar" data-comp="${escapeHtml(comp.nombre)}">
      <div class="componente-cabecera">${escapeHtml(comp.nombre)} <span class="peso-pill">máx. ${formatoPuntos(comp.max)}</span></div>
      <div class="bandas-contar">${bandas}</div>
    </div>
  `;
}

function renderPenalizacionContar(pen) {
  return `
    <div class="penalizacion-contar" data-clave="${escapeHtml(pen.clave)}">
      <span class="penalizacion-texto">${textoPack(pen.por)} <span class="peso-pill">${formatoPuntos(pen.puntos)} cada una, tope ${formatoPuntos(pen.tope)}</span></span>
      <span class="contador">
        <button type="button" class="paso-ocurrencia" data-paso="-1" aria-label="una menos">−</button>
        <output class="ocurrencias-valor">0</output>
        <button type="button" class="paso-ocurrencia" data-paso="1" aria-label="una más">+</button>
      </span>
    </div>
  `;
}

function renderFilaMatriz(criterio) {
  const m = criterio.matriz_cuantitativa;
  const componentes = m.componentes.map(renderComponenteContar).join("");
  const penalizaciones = m.penalizaciones ?? [];
  const bloquePenalizaciones = penalizaciones.length
    ? `<div class="penalizaciones-contar">${penalizaciones.map(renderPenalizacionContar).join("")}</div>`
    : "";
  return `
    <tr class="fila-matriz" data-criterio-id="${criterio.id}" hidden>
      <td colspan="5">
        <div class="matriz-contar">
          <p class="matriz-contar-ayuda">Marca la banda de cada componente; la fila aporta la suma de puntos (máx. ${formatoPuntos(m.total)}).</p>
          ${componentes}${bloquePenalizaciones}
        </div>
      </td>
    </tr>
  `;
}

function renderFila(criterio) {
  const conMatriz = !!criterio.matriz_cuantitativa;
  return `
    <tr class="fila-calificar" data-criterio-id="${criterio.id}">
      <td class="col-dimension">
        <span class="dimension-nombre">${escapeHtml(criterio.nombre)}${criterio.obligatorio ? ` <span class="etiqueta-obligatorio">obligatorio</span>` : ""}</span>
        <span class="dimension-meta">Peso ${criterio.peso_normalizado.toFixed(1)}%</span>
        <span class="resultado-criterio" data-resultado-criterio></span>
        ${conMatriz ? `<button type="button" class="btn-contar" aria-expanded="false">Contar</button>` : ""}
      </td>
      ${[1, 2, 3, 4].map((n) => renderCeldaNivel(criterio, n)).join("")}
    </tr>
    ${conMatriz ? renderFilaMatriz(criterio) : ""}
  `;
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
  const hayAlumnosGuardados = Object.keys(alumnosGuardados(meta)).length > 0;
  const filas = criterios.map(renderFila).join("");

  container.innerHTML = `
    <h2>Calificar</h2>
    <p class="ayuda">Pincha la celda del descriptor que alcanza el alumno; la nota se calcula sola. En las dimensiones con matriz, «Contar» abre las bandas de cada componente.</p>

    <div class="barra-calificar">
      <label class="campo-barra campo-nombre">
        <span>Alumno</span>
        <input type="text" id="nombre-alumno" placeholder="p. ej. García Ruiz, Elena" autocomplete="off" />
      </label>
      <label class="campo-barra campo-detractor" title="${escapeHtml(DETRACTOR_ESTIMACION.concepto)}: puntos a restar de la nota, tope ${DETRACTOR_ESTIMACION.tope}">
        <span>Descuento ${escapeHtml(DETRACTOR_ESTIMACION.concepto.toLowerCase())}</span>
        <input type="number" id="detractor-acumulado" min="0" max="${DETRACTOR_ESTIMACION.tope}" step="0.1" value="0" />
      </label>
      <div class="nota-viva" id="resultado-nota" aria-live="polite">
        <span class="nota-etiqueta">Nota</span>
        <strong class="nota-valor">—</strong>
        <span class="nota-detalle">Faltan ${criterios.length} dimensiones</span>
      </div>
    </div>

    <div class="tabla-rodante">
      <table class="rubrica rubrica-calificar">
        <thead>
          <tr>
            <th class="col-dimension">Dimensión</th>
            ${[1, 2, 3, 4].map((n) => `<th class="col-nivel nivel-${n}">${escapeHtml(etiquetaNivel(n))}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>

    <div class="aviso-calificar" id="aviso-calificar"></div>

    <div class="botones-modo-avanzado">
      <button id="guardar-alumno" type="button">Guardar y pasar al siguiente</button>
      <button id="reiniciar-calificacion" type="button">Borrar lo marcado</button>
      <button id="cerrar-calificacion" type="button">Volver a la vista previa</button>
    </div>

    <details class="opciones-calculo">
      <summary>Opciones de cálculo</summary>
      <div class="config-calificacion">
        <label for="escala-nivel">Valor de los niveles cuando se pincha el descriptor</label>
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
        ${microexplicacion("detractor-estimacion")}
        ${microexplicacion("modo-numerico")}
      </div>
    </details>

    <div class="alumnos-guardados-bloque">
      <h3>Alumnos calificados en esta actividad</h3>
      <button id="exportar-csv-notas" type="button" ${hayAlumnosGuardados ? "" : "disabled"}>
        Exportar CSV (Alumno + Nota)
      </button>
      <p class="ayuda">Para importar en iDoceo por el asistente general de alumnos: Alumno = datos personales, Nota = libro de calificaciones.</p>
      <div id="alumnos-guardados-contenedor">${renderListaAlumnos(meta)}</div>
    </div>
  `;
}

export function conectarEventosCalificacion(container, criterios, meta, onCerrar) {
  const porId = Object.fromEntries(criterios.map((c) => [c.id, c]));
  const resultadoNota = container.querySelector("#resultado-nota");
  const aviso = container.querySelector("#aviso-calificar");
  const escalaSelect = container.querySelector("#escala-nivel");
  const condicionCheckbox = container.querySelector("#condicion-minima");
  const detractorInput = container.querySelector("#detractor-acumulado");
  const nombreInput = container.querySelector("#nombre-alumno");

  // Estado por dimensión (EstadoFila, js/calificacion.js). Es la fuente; el
  // DOM solo lo pinta. Así una fila a medias nunca entra en la nota y
  // «Cargar» no tiene que reconstruir nada leyendo controles.
  const estados = new Map(criterios.map((c) => [c.id, estadoFilaVacio(c)]));

  // Último cálculo completo, con los ResultadoCriterio crudos por criterio:
  // es lo que "Guardar" persiste. null mientras falte algo.
  let ultimoCalculo = null;

  function filaDe(id) {
    return container.querySelector(`.fila-calificar[data-criterio-id="${id}"]`);
  }
  function filaMatrizDe(id) {
    return container.querySelector(`.fila-matriz[data-criterio-id="${id}"]`);
  }

  // Pinta una fila desde su estado: celda elegida (o calculada, si viene de
  // la matriz), bandas marcadas, contadores y el texto de puntos.
  function pintarFila(id) {
    const criterio = porId[id];
    const estado = estados.get(id);
    const fila = filaDe(id);
    const filaMatriz = filaMatrizDe(id);
    const resultado = resultadoDeFila(criterio, estado);
    const calculo = resultado ? puntosYNivelDe(criterio, resultado, escalaSelect.value) : null;

    for (const celda of fila.querySelectorAll(".celda-nivel")) {
      const n = Number(celda.dataset.nivel);
      const elegida = estado.modo === "nivel" && estado.nivel === n;
      const calculada = estado.modo === "matriz" && calculo?.nivel === n;
      celda.classList.toggle("elegida", elegida);
      celda.classList.toggle("calculada", calculada);
      celda.setAttribute("aria-pressed", elegida ? "true" : "false");
    }

    const btnContar = fila.querySelector(".btn-contar");
    if (btnContar && filaMatriz) {
      const abierta = estado.modo === "matriz";
      filaMatriz.hidden = !abierta;
      btnContar.textContent = abierta ? "Dejar de contar" : "Contar";
      btnContar.setAttribute("aria-expanded", abierta ? "true" : "false");
      if (abierta) {
        for (const comp of filaMatriz.querySelectorAll(".componente-contar")) {
          const idx = estado.bandas[comp.dataset.comp];
          for (const banda of comp.querySelectorAll(".celda-banda")) {
            const marcada = Number(banda.dataset.idx) === idx;
            banda.classList.toggle("elegida", marcada);
            banda.setAttribute("aria-pressed", marcada ? "true" : "false");
          }
        }
        for (const pen of filaMatriz.querySelectorAll(".penalizacion-contar")) {
          pen.querySelector(".ocurrencias-valor").textContent = String(estado.ocurrencias[pen.dataset.clave] ?? 0);
        }
      }
    }

    const texto = fila.querySelector("[data-resultado-criterio]");
    if (calculo) {
      const aporta = redondear2((calculo.puntos * criterio.peso_normalizado) / 100);
      texto.textContent = `${calculo.puntos.toFixed(2)} pts · ${etiquetaNivel(calculo.nivel)} · aporta ${aporta.toFixed(2)}`;
    } else if (estado.modo === "matriz") {
      const faltan = Object.values(estado.bandas).filter((v) => v === null).length;
      texto.textContent = faltan ? `Faltan ${faltan} componente${faltan === 1 ? "" : "s"}` : "";
    } else {
      texto.textContent = "";
    }
  }

  function pintarTodo() {
    for (const id of estados.keys()) pintarFila(id);
  }

  function actualizar() {
    aviso.innerHTML = "";
    const escala = escalaSelect.value;
    const entradas = [];
    const resultadosPorCriterio = {};
    let faltan = 0;

    for (const criterio of criterios) {
      const resultado = resultadoDeFila(criterio, estados.get(criterio.id));
      if (!resultado) {
        faltan++;
        continue;
      }
      resultadosPorCriterio[criterio.id] = resultado;
      entradas.push({
        peso_base: criterio.peso_normalizado,
        obligatorio: !!criterio.obligatorio,
        matrizCuantitativa: criterio.matriz_cuantitativa,
        resultado,
      });
    }

    const valor = resultadoNota.querySelector(".nota-valor");
    const detalle = resultadoNota.querySelector(".nota-detalle");

    if (faltan > 0 || entradas.length === 0) {
      valor.textContent = "—";
      detalle.textContent = `Falta${faltan === 1 ? "" : "n"} ${faltan} dimensi${faltan === 1 ? "ón" : "ones"}`;
      resultadoNota.classList.remove("completa");
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
    valor.textContent = notaFinal.toFixed(2);
    resultadoNota.classList.add("completa");
    const partes = [];
    if (detractorAcumulado > 0) partes.push(`${notaCalculada.toFixed(2)} − ${detractorAcumulado.toFixed(2)}`);
    if (disparada) partes.push(`recortada a 4,9 (era ${notaTrasDetractor.toFixed(2)})`);
    detalle.textContent = partes.join(" · ");

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
    container.querySelector("#exportar-csv-notas").disabled = Object.keys(alumnosGuardados(meta)).length === 0;
  }

  function limpiar() {
    nombreInput.value = "";
    detractorInput.value = 0;
    for (const c of criterios) estados.set(c.id, estadoFilaVacio(c));
    pintarTodo();
    actualizar();
  }

  // --- clics en la cuadrícula ------------------------------------------
  container.querySelector(".rubrica-calificar").addEventListener("click", (ev) => {
    const celda = ev.target.closest(".celda-nivel");
    if (celda) {
      const id = celda.closest(".fila-calificar").dataset.criterioId;
      const nivel = Number(celda.dataset.nivel);
      const estado = estados.get(id);
      // Volver a pinchar la celda elegida la desmarca; pinchar una celda con
      // la matriz abierta cierra la matriz: el descriptor manda.
      const mismo = estado.modo === "nivel" && estado.nivel === nivel;
      estados.set(id, { modo: "nivel", nivel: mismo ? null : nivel });
      pintarFila(id);
      actualizar();
      return;
    }

    const btnContar = ev.target.closest(".btn-contar");
    if (btnContar) {
      const id = btnContar.closest(".fila-calificar").dataset.criterioId;
      const estado = estados.get(id);
      estados.set(id, estadoFilaVacio(porId[id], estado.modo === "matriz" ? "nivel" : "matriz"));
      pintarFila(id);
      actualizar();
      return;
    }

    const banda = ev.target.closest(".celda-banda");
    if (banda) {
      const id = banda.closest(".fila-matriz").dataset.criterioId;
      const nombreComp = banda.closest(".componente-contar").dataset.comp;
      const estado = estados.get(id);
      const idx = Number(banda.dataset.idx);
      estado.bandas[nombreComp] = estado.bandas[nombreComp] === idx ? null : idx;
      pintarFila(id);
      actualizar();
      return;
    }

    const paso = ev.target.closest(".paso-ocurrencia");
    if (paso) {
      const id = paso.closest(".fila-matriz").dataset.criterioId;
      const clave = paso.closest(".penalizacion-contar").dataset.clave;
      const estado = estados.get(id);
      estado.ocurrencias[clave] = Math.max(0, (estado.ocurrencias[clave] ?? 0) + Number(paso.dataset.paso));
      pintarFila(id);
      actualizar();
    }
  });

  // Las celdas <td> no son botones nativos: Enter y espacio las activan.
  container.querySelector(".rubrica-calificar").addEventListener("keydown", (ev) => {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.classList.contains("celda-nivel")) {
      ev.preventDefault();
      ev.target.click();
    }
  });

  // Escala, condición mínima y detractor cambian la nota sin tocar las filas.
  escalaSelect.addEventListener("change", () => {
    pintarTodo();
    actualizar();
  });
  condicionCheckbox.addEventListener("change", actualizar);
  detractorInput.addEventListener("input", actualizar);

  container.querySelector("#reiniciar-calificacion").addEventListener("click", limpiar);

  container.querySelector("#guardar-alumno").addEventListener("click", () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) {
      aviso.innerHTML = `<div class="aviso-caja">Escribe el nombre del alumno antes de guardar.</div>`;
      nombreInput.focus();
      return;
    }
    if (!ultimoCalculo) {
      aviso.innerHTML = `<div class="aviso-caja">Faltan dimensiones por marcar: la nota no se guarda con huecos.</div>`;
      return;
    }
    const nota = ultimoCalculo.notaFinal.toFixed(2);
    guardarAlumno(meta, nombre, ultimoCalculo);
    refrescarListaAlumnos();
    limpiar();
    aviso.innerHTML = `<p class="guardado-ok">Guardado: <strong>${escapeHtml(nombre)}</strong> — ${nota}. Siguiente alumno.</p>`;
    // La cuadrícula vacía vuelve arriba, lista para el siguiente; el foco en
    // el nombre se pone sin desplazar, para no pelearse con el scroll suave.
    container.scrollIntoView({ behavior: "smooth", block: "start" });
    nombreInput.focus({ preventScroll: true });
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
      for (const c of criterios) {
        estados.set(c.id, estadoDeResultado(c, datos.resultadosPorCriterio[c.id]));
      }
      pintarTodo();
      actualizar();
      // Al principio de la tarjeta, no a la barra: la barra es pegajosa y ya
      // está a la vista, así que llevarla «a la vista» no desplaza nada.
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  container.querySelector("#exportar-csv-notas").addEventListener("click", () => descargarCsvNotas(meta));

  container.querySelector("#cerrar-calificacion").addEventListener("click", () => onCerrar());

  pintarTodo();
  actualizar();
}
