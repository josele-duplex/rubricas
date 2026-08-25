// Utilidades CSV compartidas (RFC 4180) — las usan la exportación de notas
// (js/calificar.js, §17.19) y la exportación de la rúbrica para el
// importador de rúbricas de iDoceo (js/ui.js, §17.19 ampliada el
// 2026-08-26). Una sola implementación de "cómo se cita una celda", porque
// las dos exportaciones se rompen igual si una coma o un salto de línea se
// cuelan sin comillas.

export function escaparCeldaCsv(valor) {
  const texto = String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function filasACsv(filas) {
  return filas.map((fila) => fila.map(escaparCeldaCsv).join(",")).join("\r\n");
}

// El BOM UTF-8 no lo exige iDoceo (que ya espera unicode), es para que Excel
// en Windows no confunda los acentos si alguien abre el archivo a revisarlo
// antes de importarlo.
export function descargarCsv(nombreArchivo, contenido) {
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function nombreMmaaaa() {
  const fecha = new Date();
  return `${String(fecha.getMonth() + 1).padStart(2, "0")}${fecha.getFullYear()}`;
}
