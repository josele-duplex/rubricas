// Huella FNV-1a de 32 bits de un texto, usada para detectar cuándo un
// descriptor sencillo (`alumno.texto`, data/esquema-pack.json) se redactó
// sobre otra versión del técnico (campo `origen`; SDD §17, decisión 22).
//
// No es un hash criptográfico: tiene que calcularse igual, de forma
// síncrona, aquí y en scripts/huella.py. FNV-1a sobre los bytes UTF-8 del
// texto tal cual es la elección más simple que cumple eso.
export function huellaFnv1a(texto) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(texto)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
