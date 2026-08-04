// Modo avanzado — SDD §11.2. Ajuste de pesos y selección de dimensiones.

import { comprobarRepartoPesos } from "./validador.js";
import { microexplicacion } from "./microexplicaciones.js";

export function agruparPorBloque(criterios) {
  const bloques = new Map();
  for (const c of criterios) {
    if (!bloques.has(c.bloque_lomloe)) bloques.set(c.bloque_lomloe, []);
    bloques.get(c.bloque_lomloe).push(c);
  }
  return bloques;
}

function renderFila(criterio) {
  const min = 0, max = 100;
  return `
    <div class="fila-ajuste" data-criterio-id="${criterio.id}">
      <div class="fila-encabezado">
        <input type="checkbox" class="checkbox-dimension" ${!criterio.desactivado ? "checked" : ""} />
        <label class="etiqueta-dimension">${criterio.nombre}</label>
      </div>
      <div class="fila-deslizador">
        <input type="range" class="slider-peso" min="${min}" max="${max}" value="${criterio.peso_normalizado}" />
        <span class="peso-valor">${criterio.peso_normalizado.toFixed(1)}%</span>
      </div>
      <div class="barra-reparto-item" style="width: ${criterio.peso_normalizado}%; opacity: 0.5;"></div>
    </div>
  `;
}

export function renderModoAvanzado(container, criterios) {
  const bloques = agruparPorBloque(criterios);
  const orderedBloques = ["A", "B", "C", "D"].filter(b => bloques.has(b));
  const bloquesHtml = orderedBloques
    .map((bloque, indice) => {
      const criteriosBloqueHtml = bloques.get(bloque).map(c => renderFila(c)).join("");
      return `
        <fieldset class="bloque-fieldset">
          <legend>Bloque ${bloque}</legend>
          ${indice === 0 ? microexplicacion("desactivar-dimension") : ""}
          ${criteriosBloqueHtml}
        </fieldset>
      `;
    })
    .join("");

  container.innerHTML = `
    <h2>Ajustar rúbrica</h2>
    ${microexplicacion("bloques-lomloe")}
    <p class="ayuda">Modifica pesos, marca dimensiones, o vuelve a la vista previa.</p>

    <div class="contenedor-ajuste">
      ${bloquesHtml}
      <div class="seccion-reparto">
        <h3>Reparto de pesos (total debe ser 100%)</h3>
        ${microexplicacion("pesos-libres")}
        <div class="barra-reparto-contenedor">
          <div class="barra-reparto" id="barra-reparto"></div>
        </div>
        <div id="avisos-reparto"></div>
      </div>
    </div>

    <div class="botones-modo-avanzado">
      <button id="guardar-ajuste" type="button">Guardar ajustes</button>
      <button id="cancelar-ajuste" type="button">Cancelar</button>
    </div>
  `;
}

export function conectarEventosModoAvanzado(container, criterios, onGuardar) {
  const sliders = container.querySelectorAll(".slider-peso");
  const checkboxes = container.querySelectorAll(".checkbox-dimension");
  const barraMedidor = container.querySelector("#barra-reparto");
  const avisosCaja = container.querySelector("#avisos-reparto");
  const btnGuardar = container.querySelector("#guardar-ajuste");
  const btnCancelar = container.querySelector("#cancelar-ajuste");

  function actualizarVisualización() {
    const pesos = Array.from(sliders).map((s) => ({
      id: s.closest(".fila-ajuste").dataset.criterioId,
      valor: parseFloat(s.value),
      checked: s.closest(".fila-ajuste").querySelector(".checkbox-dimension").checked,
    }));

    // Normalizar solo los checked
    const pesosChequeados = pesos.filter(p => p.checked).map(p => p.valor);
    const suma = pesosChequeados.reduce((a, b) => a + b, 0);
    const resto = suma > 0 ? 100 / suma : 0;

    sliders.forEach((s) => {
      const id = s.closest(".fila-ajuste").dataset.criterioId;
      const fila = s.closest(".fila-ajuste");
      const cb = fila.querySelector(".checkbox-dimension");
      const valor = parseFloat(s.value);
      const normalizado = cb.checked && suma > 0 ? Math.round((valor * resto) * 10) / 10 : 0;
      fila.querySelector(".peso-valor").textContent = `${normalizado.toFixed(1)}%`;
      fila.querySelector(".barra-reparto-item").style.width = `${normalizado}%`;
    });

    // Actualizar barra de reparto total
    const items = Array.from(container.querySelectorAll(".barra-reparto-item"));
    const total = items.reduce((s, el) => s + parseFloat(el.style.width || 0), 0);
    barraMedidor.style.width = `${Math.min(total, 100)}%`;

    // Avisos de reparto
    const criteriosAjustados = criterios.map((c) => {
      const fila = container.querySelector(`[data-criterio-id="${c.id}"]`);
      const cb = fila.querySelector(".checkbox-dimension");
      if (!cb.checked) return { ...c, desactivado: true, peso_normalizado: 0 };
      const slider = fila.querySelector(".slider-peso");
      const valor = parseFloat(slider.value);
      const normalizado = suma > 0 ? Math.round((valor * resto) * 10) / 10 : 0;
      return { ...c, peso_normalizado: normalizado, desactivado: false };
    });

    const avisos = comprobarRepartoPesos(criteriosAjustados.filter(c => !c.desactivado));
    avisosCaja.innerHTML = avisos
      .map((a) => `<div class="aviso-caja">${a}</div>`)
      .join("");
  }

  sliders.forEach((s) => {
    s.addEventListener("input", actualizarVisualización);
  });
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", actualizarVisualización);
  });

  btnGuardar.addEventListener("click", () => {
    const ajustes = {};
    sliders.forEach((s) => {
      const fila = s.closest(".fila-ajuste");
      const id = fila.dataset.criterioId;
      const cb = fila.querySelector(".checkbox-dimension");
      const valor = parseFloat(s.value);
      ajustes[id] = { peso_editado: valor, desactivado: !cb.checked };
    });
    onGuardar(ajustes);
  });

  btnCancelar.addEventListener("click", () => onGuardar(null));

  actualizarVisualización();
}
