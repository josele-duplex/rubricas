# Taller de Rúbricas · Generador de instrumentos de evaluación (LOMLOE)

Aplicación web para que el profesorado de Lengua Castellana y Literatura construya rúbricas
derivadas del currículo oficial de la Región de Murcia, con la hoja del alumno incluida.

Aquí está **la regla**. El **motivo** de cada regla está en
[`docs/diseno/por-que-estas-reglas.md`](docs/diseno/por-que-estas-reglas.md), y se lee cuando se
va a *tocar* una regla, no para cumplirla. El diseño completo vive en `docs/diseno/SDD.md`
—que **no se abre entero**: ver el presupuesto de contexto, aquí abajo.

**El nombre comercial es «Taller de Rúbricas»** (16-ago-2026), en la familia de «Taller de
Sintaxis». Vive en dos sitios y en ninguno más: el `<title>` y el `<h1>` de `index.html`, y
`manifest.webmanifest` (ahí se abrevia a «Rúbricas», que es lo que cabe bajo un icono de iPad).

---

## Presupuesto de contexto

Este repositorio son **~690.000 tokens**: tres veces y media una ventana de contexto. Ningún
archivo grande se lee entero, porque hacerlo tres veces agota la sesión antes de terminar el
trabajo. Compruébalo con `python scripts/ver.py coste`.

| En vez de abrir | Usa | Coste |
|---|---|---|
| `data/pack-*.json` (~39.000 tok) | `python scripts/ver.py pack <mote> [--curso 3ESO]` | ~700 |
| un criterio dentro del pack | `python scripts/ver.py criterio <id\|código>` | ~200 |
| `docs/diseno/SDD.md` (~42.000 tok) | `python scripts/ver.py sdd` · `ver.py sdd 6.3` | ~1.000 |
| `fuentes/curriculo/*.md` (~30.000 tok) | `python scripts/dossier_criterios.py --codigo 5.1` | ~500 |
| buscar una expresión por el repo | `python scripts/ver.py buscar "hiperónimos"` | ~300 |
| `docs/revision-*.md`, `js/lexico.js` | **nada**: son GENERADOS, no llevan un hecho propio | — |

Tres costumbres más, del mismo orden de magnitud:

- **Para editar no hace falta leer.** `Edit` sobre la cadena exacta que ya conoces por el índice;
  volver a leer el archivo entero «para asegurar» es pagarlo dos veces.
- **`comprobar_todo.py` es callado**: una comprobación que pasa no dice nada. Si necesitas verlo
  todo, `--detallado`.
- **No repitas lo que el script ya ha dicho.** Si la orden imprime la tabla, no la copies a la
  respuesta: basta con lo que hay que decidir.

---

## Reglas no negociables

1. **Las rúbricas se derivan, no se inventan.** Todo criterio lleva `criterio_oficial` con la cita
   textual del currículo. Un criterio sin referencia normativa no se carga.
2. **La progresión la fija el currículo, no el diseñador.** Ya está escrita en la redacción del
   criterio (*sencillos*/*de manera guiada* frente a *de cierta extensión*/*progresivamente
   autónoma*). El verbo lo pone el criterio; lo que escala es la condición que lo acompaña.
   Los criterios son **por curso**, nunca por ciclo.
3. **Cuatro niveles, siempre.** Escala fija, no configurable. Bandas sobre 10: 9–10 · 7–8,9 ·
   5–6,9 · 0–4,9. Los nombres (Iniciado · Suficiente · Notable · Excelente) viven solo en
   `data/catalogo.json`.
4. **Cero adverbitis.** Todo descriptor empieza por un verbo del banco cerrado. Nada de *bien*,
   *adecuadamente*, *a veces*, *bastante*. El nivel 1 describe lo que el alumno **sí** hace de
   forma limitada: «Utiliza conectores de adición», no «No usa conectores».
5. **Los saberes son vehículo, nunca fila.** La dimensión es una acción competencial:
   «Cohesión: conectores y puntuación», no «Las oraciones subordinadas».
6. **La hoja del alumno no es opcional.** La aplicación la genera siempre; no es una casilla.
7. **Una penalización no puede medir lo que ya mide un componente** (doble castigo). Si el
   componente ya valora los errores de puntuación, no puede haber además penalización por
   párrafo sin puntos. Deja las matrices casi sin penalizaciones, y eso es buena señal.
8. **Ninguna llamada a IA desde la aplicación.** Genera el texto en modo IA para usarlo fuera:
   no ejecuta prompts, no pide claves, no envía nada. Sin servidor ni datos personales.
9. **El criterio es la puerta; los saberes, el foco.** Una celda de la matriz §4.3 solo la abre o
   la cierra un criterio de evaluación; los saberes marcan el foco (● / ○) y nunca vacían una
   celda. Una regla de derivación solo está comprobada si se pasa por los seis cursos a la vez:
   **si invalida un pack ya validado, la rota es la regla, no el pack.**

---

## Método de trabajo

- **Una sola orden lo comprueba todo** —la misma que ejecuta el CI, así que no hay una segunda
  lista que mantener:

  ```bash
  python scripts/comprobar_todo.py
  ```

  Catorce comprobaciones: forma del pack, los tres derivados al día (`js/lexico.js`, las tablas
  §4.3 y §5.4 del SDD, y los `docs/revision-*.md`), reglas de contenido, paridad entre los dos
  validadores, las cuatro pruebas del motor, la derivación contra el currículo con su
  auto-prueba, y que exista todo lo que la instalación promete. **No se cierra un pack con
  ninguna en rojo ni con ninguna saltada.**

- **Toda matriz cuantitativa nueva se prueba simulando una corrección** antes de darla por buena:

  ```bash
  python scripts/simular_correccion.py data/pack-lcl-<tarea>.json --resumen
  ```

  `--resumen` hace lo mecánico —notas por curso y perfil, nivel de cada dimensión y las celdas
  sospechosas: saltos de dos niveles, umbrales planos, ceros, notas fuera de orden— y deja el
  juicio entero: *¿le pondrías esta nota a un alumno con este perfil?* Se simula **con los
  perfiles de alumno, no con el sorteo**. Esto no está en `comprobar_todo.py` a propósito: pide
  un juicio, no da un booleano.

- **Toda afirmación sobre lo que dice el currículo se verifica mecánicamente**
  (`scripts/verificar_derivacion.py`): citas literales de los packs y del SDD (§4.3 y §5.4),
  matriz de tareas, techo de progresión y género en `saber_vehiculo`. Convención: en §4.3 y §5.4,
  lo que va entre «» o *"..."* es cita de fuente y debe encontrarse literalmente en
  `fuentes/curriculo/` o en el Marco Teórico; el uso-mención propio va en comillas simples.

- **El JSON es la fuente; lo demás es derivado.** `docs/revision-*.md` con
  `scripts/generar_revision.py`, `js/lexico.js` con `scripts/generar_lexico.py`, y **las dos
  tablas del SDD con `scripts/generar_tablas_sdd.py`**, desde `data/derivacion-<materia>.json`.
  Ninguno se edita a mano; `comprobar_todo.py` falla si se han separado de su fuente. En el SDD
  eso afecta **solo a las dos tablas**: la prosa que las justifica se escribe a mano.

- **Los criterios oficiales se citan del texto real**, nunca de memoria ni parafraseados. La
  herramienta para leerlos por criterio, sin abrir el decreto, es
  `python scripts/dossier_criterios.py`.

- **Cuando el usuario corrija un planteamiento, revisar si el error está en más sitios.**

## Cómo escribir un descriptor

```
[verbo del banco] + [objeto o saber-vehículo] + [condición o finalidad comunicativa]
```

Ejemplo: *«Emplea conectores de causa, consecuencia y ejemplificación, y sustituye las
repeticiones mediante sinónimos, hiperónimos y pronombres.»*

El banco guarda cada verbo en 3.ª y en 1.ª persona (`Reconoce`/`Reconozco`), lo que permite
derivar la versión de autoevaluación sin errores de morfología.

**El descriptor no nombra al alumno en 3.ª persona.** El alumno es el sujeto de la frase, así que
todo lo demás que apunte a él —un segundo verbo, un posesivo, un dativo— imprime «él» dentro de
una frase en «yo» al proyectar la autoevaluación. Lo que es del alumno se escribe con `propio` o
con el artículo: «por cuenta propia», no «por su cuenta»; «con palabras propias», no «con sus
propias palabras»; «a las notas», no «a sus notas». `su` solo entra cuando el referente es otro
(«indica **su** procedencia», la de los datos), y entonces se declara en `posesivos_ajenos` de
`data/reglas-lexicas.json`, con el referente escrito al lado.

---

## Estructura

```
index.html       modo exprés y contenedores de la vista previa
manifest.webmanifest · sw.js
                 instalación en iPad/Android/escritorio y uso sin conexión
assets/icons/    iconos de la aplicación instalada — GENERADOS (scripts/generar_iconos.py)
css/             estilos de pantalla y de impresión
js/              motor, validador, microexplicaciones, interfaz, modo avanzado
                 (js/lexico.js es GENERADO — no se edita)
data/            la fuente de todo: packs, catálogo, tablas de derivación por materia,
                 léxico de reglas, banco de verbos y esquema de pack
scripts/         comprobación completa, validadores, generadores, simulador, lector (ver.py)
test/            casos dorados del validador y del motor (Node, sin dependencias)
docs/diseno/     SDD, registro de cambios, motivos de las reglas, guía para añadir una materia
                 (las tablas §4.3 y §5.4 del SDD son GENERADAS — la prosa no)
docs/marco/      marco teórico y matrices de referencia
docs/            documentos de revisión GENERADOS y resúmenes para el docente
fuentes/         currículo oficial y originales aportados (material crudo)
```

### Cada hecho, en un solo sitio

`data/` manda sobre todo lo demás. El porqué —tres copias que se separaron en silencio— está en
[`por-que-estas-reglas.md`](docs/diseno/por-que-estas-reglas.md).

| Archivo | Manda sobre | Quién lo lee |
|---|---|---|
| `data/catalogo.json` | qué packs hay, qué materias, qué tipos de tarea, cómo se llaman los cursos y los cuatro niveles | `js/main.js`, `js/ui.js` y todos los scripts |
| `data/derivacion-<materia>.json` | qué tarea sostiene el currículo en qué curso (§4.3) y hasta dónde exige cada uno (§5.4) | `verificar_derivacion.py` y, vía `generar_tablas_sdd.py`, el SDD |
| `data/reglas-lexicas.json` | las palabras y los umbrales de las reglas del validador | `validar_pack.py` y, vía `js/lexico.js`, la aplicación |
| `data/verbos.json` | el banco cerrado de verbos, con 3.ª y 1.ª persona | los packs solo pueden añadir en `verbos_extra` |
| `data/esquema-pack.json` | la forma que debe tener un pack | `validar_esquema.py`, antes que ninguna regla de contenido |

El validador vive dos veces —`scripts/validar_pack.py` y `js/validador.js`—, pero solo su
**lógica**: las palabras salen del archivo compartido. **La aplicación nunca puede dar por limpio
un pack que el script rechaza** (SDD §10), y `scripts/comprobar_paridad.py` lo exige sobre un
corpus de trampas. Toda regla nueva entra en las dos implementaciones, con su caso en `test/`.

### Antes de añadir una materia

Léete `docs/diseno/anadir-una-materia.md`. La regla corta: **dar de alta una asignatura no debe
obligar a tocar código.** Si hace falta editar un `.py` o un `.js`, es un fallo de diseño de este
proyecto y se arregla aquí, no en la materia nueva.

---

## Matriz digital: este proyecto es uno de tres

`proyecto_plan_de_trabajo_lengua` (plan de aula) · `proyecto_taller-sintaxis` (app de sintaxis) ·
este generador. Comparten terminología, alcance, filosofía evaluativa y marco de rúbricas.
Quién manda sobre qué: §2 de
`proyecto_plan_de_trabajo_lengua/Metodologías innovadores morfología y sintaxis/proyecto/documentos_base/Matriz-digital_tres-proyectos.md`.
**El que no es dueño de un hecho, lo referencia; no lo copia.**

- **Este proyecto manda sobre la derivación normativa**: cita literal del criterio, numeración por
  curso, validador de packs y modelo de cálculo de un instrumento (SDD §6).
- **Lengua manda sobre la arquitectura de rúbrica**: cuatro niveles, nombres canónicos, bandas /10,
  anti-adverbitis, principio del vehículo. También sobre la **ponderación igual por defecto**: un
  pack solo desiguala pesos si declara `razon_peso`, que la ficha imprime y el validador exige.
- **El marco teórico vigente vive allí**, no aquí (`documentos_base/marco_teorico_rubricas-LOMLOE.md`).
  La copia de `docs/marco/…ANTIGUO.md` es solo referencia histórica.
- **2.º de Bachillerato no es una excepción** en esta app, aunque los materiales de Lengua lleguen
  hasta 1.º BACH.
- **Divergencia viva: C3** (la app y el skill `rubricas-lomloe` se solapan en la nota /10 y en
  iDoceo), abierta como decisión §17.19 del SDD y **pendiente de que la decida Josele**.
- **Comprobación mecánica**, desde el repositorio de Lengua: `python scripts/verificar_matriz.py`.
- **Nunca se modifican archivos del proyecto de Lengua desde aquí.** Análisis bilateral completo en
  `docs/diseno/enlace-proyecto-lengua.md`.

## Decisiones pendientes

Al final del SDD (§17), y se leen con `python scripts/ver.py sdd 17`. La que bloquea la alineación
con Lengua es §17.19 (qué hace la app y qué hace el skill `rubricas-lomloe`): es una decisión del
docente, no de diseño técnico.
