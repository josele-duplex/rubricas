// Carga un borrador de lenguaje sencillo en un pack (docs/diseno/plan-lenguaje-sencillo.md,
// sesión L1). Una orden por actividad: toma el JSON con el formato descrito
// más abajo (el primero fue el argumentativo de 4.º ESO, cargado en L2 y
// borrado después: la fuente es el pack), escribe `alumno` en
// cada descriptor y `nombre_alumno` en el criterio, calcula `origen` con la
// misma huella que comprueban los dos validadores (js/huella.js,
// scripts/huella.py), valida el pack resultante, proyecta cada texto sencillo
// a 1.ª persona con el motor real (nunca con una segunda implementación) e
// imprime lo que falle. No escribe nada si algo falla: se corrige el borrador
// y se vuelve a ejecutar.
//
// Uso:
//   node scripts/cargar_sencillo.mjs <borrador.json>
//
// El borrador declara su propio pack de destino (`"pack": "data/pack-…json"`)
// y el curso (`"curso"`), así que no hace falta pasarlos aparte.
//
// Formato del borrador:
//   {
//     "pack": "data/pack-lcl-<tarea>.json",
//     "curso": "<curso del catálogo, p.ej. 4ESO>",
//     "dimensiones": [
//       {
//         "dimension": "<id de dimensión del pack>",
//         "nombre_alumno_propuesto": "<nombre_alumno, opcional>",
//         "niveles": [ {"verbo": "...", "texto": "..."} × 4, en orden N1→N4 ]
//       }
//     ]
//   }

import { readFileSync, writeFileSync } from "node:fs";
import { componerPack, primeraPersona } from "../js/motor.js";
import { validarPack } from "../js/validador.js";
import { huellaFnv1a } from "../js/huella.js";

function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, "utf8"));
}

function main() {
  const rutaBorrador = process.argv[2];
  if (!rutaBorrador) {
    console.error("Uso: node scripts/cargar_sencillo.mjs <borrador.json>");
    process.exit(1);
  }

  const borrador = leerJson(rutaBorrador);
  const rutaPack = borrador.pack;
  if (!rutaPack) {
    console.error(`${rutaBorrador}: falta "pack" (la ruta del pack de destino).`);
    process.exit(1);
  }
  if (!borrador.curso) {
    console.error(`${rutaBorrador}: falta "curso".`);
    process.exit(1);
  }

  const packCrudo = leerJson(rutaPack);
  const porId = new Map(packCrudo.criterios.map((c) => [c.id, c]));

  const fallos = [];
  const tocados = [];

  for (const entrada of borrador.dimensiones ?? []) {
    const candidatos = packCrudo.criterios.filter(
      (c) => c.dimension === entrada.dimension && c.curso === borrador.curso
    );
    if (candidatos.length === 0) {
      fallos.push(`dimensión "${entrada.dimension}" en ${borrador.curso}: no hay ningún criterio en ${rutaPack}.`);
      continue;
    }
    if (candidatos.length > 1) {
      fallos.push(
        `dimensión "${entrada.dimension}" en ${borrador.curso}: hay ${candidatos.length} criterios (${candidatos
          .map((c) => c.id)
          .join(", ")}); el borrador no sabe a cuál escribir.`
      );
      continue;
    }
    const criterio = candidatos[0];

    if (entrada.nombre_alumno_propuesto) {
      criterio.nombre_alumno = entrada.nombre_alumno_propuesto;
    }

    const niveles = ["n1", "n2", "n3", "n4"];
    if ((entrada.niveles ?? []).length !== 4) {
      fallos.push(
        `${criterio.id}: el borrador trae ${entrada.niveles?.length ?? 0} nivel(es) y hacen falta 4, en orden N1→N4.`
      );
      continue;
    }

    niveles.forEach((nivel, i) => {
      const propuesto = entrada.niveles[i];
      const tecnico = criterio.descriptores[nivel];
      tecnico.alumno = {
        verbo: propuesto.verbo,
        texto: propuesto.texto,
        origen: huellaFnv1a(tecnico.texto),
      };
    });
    tocados.push(criterio.id);
  }

  if (fallos.length) {
    console.error("No se ha escrito nada. Antes de cargar:");
    for (const f of fallos) console.error(`  - ${f}`);
    process.exit(1);
  }

  if (tocados.length === 0) {
    console.error(`${rutaBorrador}: no declara ninguna dimensión ("dimensiones" vacío o ausente). No se ha escrito nada.`);
    process.exit(1);
  }

  // Validación sobre el pack YA compuesto con el banco de verbos, exactamente
  // como lo ve la aplicación (SDD §10) — no sobre el crudo.
  const banco = leerJson("data/verbos.json").verbos;
  const pack = componerPack(packCrudo, banco);
  const informe = validarPack(pack);
  const propios = informe.avisos.filter((a) => tocados.includes(a.criterioId));
  const errores = propios.filter((a) => a.severidad === "error");
  const avisos = propios.filter((a) => a.severidad === "aviso");

  if (errores.length) {
    console.error(`No se ha escrito nada: ${errores.length} error(es) de validación en lo que se iba a cargar.`);
    for (const a of errores) console.error(`  ERROR   ${a.criterioId} · ${a.regla}\n          ${a.mensaje}`);
    process.exit(1);
  }

  // Proyección a 1.ª persona: si un texto sencillo no empieza por el verbo
  // que declara, o el verbo no está en el banco, primeraPersona() lanza — se
  // atrapa aquí para que el mensaje señale qué descriptor y no tire toda la
  // carga con una traza de Node.
  const verbosPorId = Object.fromEntries(pack.verbos.map((v) => [v.id, v]));
  const proyecciones = [];
  for (const cid of tocados) {
    const criterio = pack.criterios.find((c) => c.id === cid);
    for (const nivel of ["n1", "n2", "n3", "n4"]) {
      const d = criterio.descriptores[nivel];
      try {
        proyecciones.push({
          criterioId: cid,
          nivel,
          tecnico: d.texto,
          sencillo: d.alumno.texto,
          autoevaluacion: primeraPersona(d.alumno.texto, d.alumno.verbo, verbosPorId),
        });
      } catch (err) {
        fallos.push(`${cid} (${nivel}): ${err.message}`);
      }
    }
  }

  if (fallos.length) {
    console.error("No se ha escrito nada. La proyección a 1.ª persona ha fallado:");
    for (const f of fallos) console.error(`  - ${f}`);
    process.exit(1);
  }

  writeFileSync(rutaPack, JSON.stringify(packCrudo, null, 2) + "\n", "utf8");

  console.log(`Escrito ${rutaPack}: ${tocados.length} dimensión(es) de ${borrador.curso} con lenguaje sencillo.`);
  console.log("");
  console.log("Técnico · Sencillo · Sencillo (autoevaluación)");
  for (const p of proyecciones) {
    console.log(`\n${p.criterioId} (${p.nivel})`);
    console.log(`  técnico       ${p.tecnico}`);
    console.log(`  sencillo      ${p.sencillo}`);
    console.log(`  autoeval.     ${p.autoevaluacion}`);
  }
  if (avisos.length) {
    console.log(`\n${avisos.length} aviso(s) a revisar (no bloquean):`);
    for (const a of avisos) console.log(`  aviso   ${a.criterioId} · ${a.regla}\n          ${a.mensaje}`);
  }
  console.log(`\nRevisa el significado (no lo comprueba ninguna máquina: regla 10 de la sección 2 del plan)`);
  console.log(`y luego: python scripts/generar_revision.py ${rutaPack}`);
}

main();
