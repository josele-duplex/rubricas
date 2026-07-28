// Casos del validador (SDD §15) — el pack real debe seguir cargando limpio.
//
// Es el primer contrato: si esto falla, no importa lo que digan los casos
// negativos de validador-reglas.mjs, porque el pack con el que trabaja el
// profesorado ya no pasaría el validador de la aplicación.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validarPack } from "../js/validador.js";

const rutaPack = fileURLToPath(new URL("../data/pack-lcl-expositivo.json", import.meta.url));
const pack = JSON.parse(readFileSync(rutaPack, "utf8"));

const informe = validarPack(pack);

if (informe.nErrores === 0 && informe.nAvisos === 0) {
  console.log(`OK: ${pack.pack_id} (${pack.criterios.length} criterios) — sin incidencias.`);
  process.exit(0);
}

console.error(`FALLO: ${informe.nErrores} error(es), ${informe.nAvisos} aviso(s) sobre el pack real.`);
for (const a of informe.avisos) {
  console.error(`  ${a.severidad} · ${a.regla} · ${a.criterioId}: ${a.mensaje}`);
}
console.error(
  "\nUn aviso aquí es un defecto de la regla, no del pack (CLAUDE.md, regla 1: las rúbricas se " +
    "derivan, no se inventan; y SDD §10, invariante de paridad). Se corrige el código de la regla."
);
process.exit(1);
