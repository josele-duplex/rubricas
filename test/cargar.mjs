// Cargador común de las pruebas.
//
// Existe para que las pruebas compongan el pack EXACTAMENTE como lo compone la
// aplicación. Cada prueba hacía su propio JSON.parse del .json del pack, y
// mientras el banco de verbos vivía dentro de cada pack eso bastaba. Ya no: el
// banco es compartido (data/verbos.json) y una prueba que se lo salte estaría
// probando un pack que no existe en ninguna parte.
//
// Es la misma razón por la que componerPack vive en js/motor.js y no aquí: la
// composición es de la aplicación; esto solo la usa.

import { readFileSync } from "node:fs";
import { componerPack } from "../js/motor.js";

function leer(ruta) {
  return JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
}

export const CATALOGO = leer("../data/catalogo.json");
export const BANCO_VERBOS = leer("../data/verbos.json").verbos;

export function cargarPack(nombre) {
  return componerPack(leer(`../data/${nombre}`), BANCO_VERBOS);
}
