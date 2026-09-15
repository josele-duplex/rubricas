// Marcas de cursiva en los textos de un pack (SDD §5.2).
//
// Un descriptor menciona formas de la lengua —«los conectores y, pero y
// entonces»— y sin marca la "y" conector y la "y" que enumera se confunden.
// La convención es la del Markdown, *así*, por tres razones: se lee en el
// JSON crudo, los docs/revision-*.md la pintan sin tocarla, y no es un
// carácter que ningún descriptor necesite para otra cosa.
//
// Este módulo es el único sitio que sabe qué es una marca. Lo importan la
// interfaz (que la convierte en <em>), el motor (que no reconjuga lo que
// va en cursiva: es lengua citada, no una acción del alumno) y el validador
// (que aplica sus reglas a las palabras, no a los asteriscos, y da error si
// una marca queda abierta). scripts/marcas.py es su par en Python, y la
// paridad entre los dos la exige scripts/comprobar_paridad.py.
//
// Una marca bien formada abre y cierra pegada a la palabra: "*y*",
// "*en primer lugar*". Ni "* y*" ni "**" ni un asterisco suelto.
const INTERIOR = String.raw`[^*\s](?:[^*]*[^*\s])?`;

export const MARCA_CURSIVA = new RegExp(String.raw`\*(${INTERIOR})\*`, "g");

// Para partir un texto en trozos "fuera de cursiva" (índices pares) y
// "en cursiva" (impares): texto.split(PARTES_CURSIVA). Un solo grupo de
// captura, el de la marca entera: split devuelve también lo capturado.
export const PARTES_CURSIVA = new RegExp(String.raw`(\*${INTERIOR}\*)`);

// Quita los asteriscos y deja las palabras: lo que miran las reglas.
export function sinMarcas(texto) {
  return String(texto).replace(MARCA_CURSIVA, "$1");
}

// Texto plano para donde no hay cursiva (CSV, <option>): «y», «pero».
export function textoPlano(texto) {
  return String(texto).replace(MARCA_CURSIVA, "«$1»");
}

// Sobre HTML ya escapado: escapeHtml no toca el asterisco, así que se
// puede marcar después de escapar sin que nada del texto abra una etiqueta.
export function conCursiva(htmlEscapado) {
  return String(htmlEscapado).replace(MARCA_CURSIVA, "<em>$1</em>");
}

// null si las marcas están bien formadas; si no, qué queda sin cerrar.
export function errorDeMarcas(texto) {
  const resto = String(texto).replace(MARCA_CURSIVA, "");
  if (!resto.includes("*")) return null;
  const i = resto.indexOf("*");
  return `marca de cursiva mal formada cerca de "…${resto.slice(Math.max(0, i - 12), i + 13)}…"`;
}
