# Plan del lenguaje sencillo para el alumnado

**Estado:** plan operativo · 25 de septiembre de 2026
**Redactado por:** Claude Opus 5.5, para ejecutar en sesiones de Opus y Sonnet
**Objetivo:** que todo lo que lee el alumno —ficha, rúbrica breve, autoevaluación y
coevaluación— esté escrito en un lenguaje que entienda cualquier alumno del curso,
incluido el de nivel medio-bajo, **sin tocar la versión técnica** con la que califica el
profesor. Hacerlo de forma **eficaz** (sin errores que lleguen al alumno) y **económica**
(sin redactar lo que nadie va a usar).

---

## 0. Punto de partida (verificado el 25-sep-2026, no de memoria)

- 10 packs · 259 criterios · **1.036 descriptores** (~19.600 palabras). ESO: 672; Bachillerato: 364.
- Todo lo que ve el alumno sale hoy del texto técnico: `generarFichaAlumno` (qué se valora,
  cómo llegar a Excelente, rúbrica breve) y `generarAutoevaluacion` (`js/motor.js`), que
  proyecta el descriptor a 1.ª persona con `primeraPersona()`.
- **Prueba hecha:** los 20 descriptores del argumentativo de 4.º ESO (cinco dimensiones, sin
  tratamiento de la información) reescritos en lenguaje sencillo, en 3.ª persona y con el
  término técnico entre paréntesis. Pasados por `validar_pack.py` sobre una copia del pack
  (un error, *mal*, corregido → sin incidencias) y por `primeraPersona()`: los 20 salen en
  1.ª persona sin mezclar «yo» y «él». Se guardaron en un borrador que L2 cargó en el pack y
  borró después: hoy viven en `data/pack-lcl-argumentativo.json`.
- Conclusión de la prueba: **el lenguaje sencillo cabe en la maquinaria que ya existe**
  (banco de verbos, reglas del validador, proyección). No hace falta un sistema nuevo.

## 1. Decisiones que fija este plan

1. **Dos versiones, no una.** La técnica sigue siendo la fuente para calificar y la que está
   derivada del currículo. La sencilla es una segunda redacción del mismo descriptor, solo
   para lo que lee el alumno. Si no existe, el alumno ve la técnica: nada se rompe.
2. **Bajo demanda.** No se reescriben los 1.036 de golpe. Se escribe la versión sencilla del
   pack y curso que el docente va a usar en una actividad, cuando la prepara. Queda en el
   pack para siempre; lo que no se usa no cuesta nada.
3. **Reglas nuevas del validador, ninguna por ahora.** El texto sencillo pasa las mismas reglas
   que el técnico. Solo se añade una regla (tecnicismos fuera de paréntesis, límite de
   palabras…) si el mismo error aparece en **dos actividades distintas**.
4. **El término técnico se conserva entre paréntesis**: el currículo pide que el alumno vaya
   adquiriendo el metalenguaje (en 4.º, *tesis*, *objeción*, *conector*). Más metalenguaje
   en Bachillerato que en 1.º de ESO.
5. **Ejemplos neutros.** Un pack sirve para cualquier tema: nada de ejemplos atados a una
   actividad (*Cadalso*, *la Ilustración*). Lo vivo lo pone el docente en el enunciado.
6. **Orden de cursos: primero 2.º y 4.º de ESO.** Son los cursos en los que Josele da clase
   este año, así que son los que van a usarse de verdad. Dentro de ellos, el pack y la
   actividad que toque según el calendario de aula (regla 2, «bajo demanda»); entre los dos
   cursos, cualquier orden. 1.º y 3.º de ESO y los dos de Bachillerato **no se tocan** hasta
   agotar lo pendiente en 2.º y 4.º, salvo que una actividad concreta de esos cursos lo pida
   (sección 8).

## 2. Reglas de redacción del texto sencillo

Viven en un solo sitio desde la sesión L1: **paso 7 del skill `rubricas-pack`**
(`.claude/skills/rubricas-pack/SKILL.md`). Toda sesión Ln invoca ese skill (regla 3 de la
sección 4), así que las lee ahí, no aquí.

## 3. Reparto de modelos

Sigue el reparto de [`plan-cierre-fase-2.md`](plan-cierre-fase-2.md):

- **Opus 5.5 (`claude-opus-5-5`) → redacción de descriptores.** Es contenido curricular:
  juicio sobre el significado y la progresión con reglas duras.
- **Sonnet 5 (`claude-sonnet-5`) → código.** La especificación está cerrada en la sesión L1:
  no hay decisión de derivación en juego.
- **Haiku no se usa:** no hay en este plan ninguna tarea puramente mecánica que no cubran ya
  los scripts.
- **Prueba de ahorro.** Si **dos sesiones Ln seguidas** salen sin ninguna corrección de
  significado por parte del docente, la siguiente se hace con Sonnet 5 y se compara. Si
  Sonnet necesita correcciones, se vuelve a Opus y se anota aquí.

## 4. Reglas transversales (van implícitas en todos los prompts)

1. **Al empezar**, la sesión lee la sección **«Próxima sesión»** de este documento y hace lo que
   dice. No necesita el contexto de ninguna sesión anterior.
2. **Al terminar**, la sesión **reescribe «Próxima sesión»** con el prompt exacto de la
   siguiente y el modelo de Claude más adecuado, con una línea de motivo (sección 3). Y
   actualiza el **registro de cobertura** (sección 7).
3. Todo trabajo de pack empieza invocando el skill **`rubricas-pack`**.
4. Presupuesto de contexto de CLAUDE.md: los packs se leen con `ver.py pack <mote> --curso X`
   y `ver.py criterio <id>`, nunca enteros.
5. Toda regla de validación que se toque entra **en los dos validadores** con su caso en
   `test/` y en el corpus de paridad.
6. `docs/revision-*.md` y `js/lexico.js` **nunca se editan a mano**: se regeneran.
7. **Jamás se modifica nada de `proyecto_plan_de_trabajo_lengua`.**
8. En este Windows, `python` abre la Microsoft Store: las órdenes se lanzan con **`py`**.
   Los tests: `node --test test/*.mjs`.
9. **Batería de cierre** de toda sesión: `py scripts/comprobar_todo.py` en verde, sin ninguna
   comprobación saltada.
10. Cada sesión termina con un commit propio (mensaje en español, estilo del historial).

---

## 5. Mapa de sesiones

| # | Quién / modelo | Objetivo | Depende de |
|---|---|---|---|
| L0 ✅ | Josele | Decisión en el marco teórico de Lengua — **hecha el 26-sep-2026: §2.4 del marco** | — |
| L1 ✅ | Sonnet 5 | Infraestructura: campo, validadores, motor, revisión, script de carga — **hecha el 25-sep-2026 (v1.63)** | — |
| L2 ✅ | Opus 5.5 | Argumentativo 4.º ESO: cargar el borrador y completar lo que falta — **hecha el 25-sep-2026 (v1.64)** | L1 |
| Ln | Opus 5.5 | Una actividad nueva: pack y curso que diga el docente | L1 |

L0 va en paralelo: no bloquea nada técnico, pero la decisión tiene que constar antes de dar
por cerrado el plan.

---

## L0 · Josele — La decisión, en el sitio que le corresponde ✅ hecha el 26-sep-2026

Añadir una versión para el alumno es arquitectura de rúbrica, y ese hecho es de Lengua
(matriz digital, §2). Un párrafo en `proyecto/documentos_base/marco_teorico_rubricas-LOMLOE.md`:
*cada descriptor tiene una versión técnica para calificar y una sencilla para el alumno, con
el término técnico entre paréntesis; la sencilla dice lo mismo, ni más ni menos*. Desde aquí
solo se referencia (lo hace L1 en el §17 del SDD).

## L1 · Sonnet 5 — Infraestructura ✅ hecha el 25-sep-2026 (v1.63)

**Prompt:**

> Ejecuta la sesión L1 de `docs/diseno/plan-lenguaje-sencillo.md`: la infraestructura del
> lenguaje sencillo para el alumnado. Lee antes las secciones 1 a 4 del plan. Nada de
> contenido: no se escribe ningún descriptor sencillo en esta sesión.
>
> 1. **Esquema** (`data/esquema-pack.json`): cada descriptor `nX` admite un campo opcional
>    `alumno: {verbo, texto, origen}`; cada criterio, un `nombre_alumno` opcional.
>    `origen` es la huella del `texto` técnico del que salió el sencillo: FNV-1a de 32 bits
>    en hexadecimal, sobre el texto tal cual, implementada **igual** en Python y en JS.
> 2. **Validadores** (`scripts/validar_pack.py` y `js/validador.js`): al `alumno.texto` se le
>    aplican las mismas reglas que al técnico (verbo inicial declarado y del banco, adverbitis,
>    marcas de cursiva, posesivos) y, además, un **error de desfase** si `origen` no coincide
>    con la huella del `texto` técnico actual. Casos en `test/` y en el corpus de
>    `comprobar_paridad.py`.
> 3. **Motor** (`js/motor.js`): `generarFichaAlumno` (qué se valora, cómo llegar a Excelente,
>    rúbrica breve) y `generarAutoevaluacion` usan `alumno` y `nombre_alumno` cuando existen
>    **y** su `origen` coincide; si no, el técnico. Así, si el docente edita un descriptor en
>    el modo avanzado, el alumno ve el técnico editado, nunca un sencillo que ya no le
>    corresponde. Los instrumentos del profesor no cambian. Test en `test/`.
> 4. **Revisión** (`scripts/generar_revision.py`): para cada descriptor con versión sencilla,
>    tres columnas: técnico · sencillo · sencillo en 1.ª persona. La 1.ª persona tiene que
>    salir de `primeraPersona()` de `js/motor.js`, no de una segunda implementación.
> 5. **Script de carga** (`scripts/cargar_sencillo.mjs` o `.py`): toma un JSON con el formato
>    de `docs/diseno/borrador-sencillo-argumentativo-4ESO.json`, escribe `alumno` y
>    `nombre_alumno` en el pack, calcula `origen`, valida, proyecta a 1.ª persona e imprime
>    lo que falle. Una orden por actividad.
> 6. **Skill**: copia la sección 2 del plan al skill `rubricas-pack` y deja en el plan un
>    puntero en su lugar.
> 7. **SDD**: decisión nueva en el §17 que remita a L0, y entrada en el registro de cambios.
>    Actualiza en `CLAUDE.md` la cuenta de comprobaciones si cambia.
> 8. Cierra con `py scripts/comprobar_todo.py` en verde, reescribe «Próxima sesión» y el
>    registro de cobertura del plan, y commit.

**Pautas:**
- Sin contenido en los packs: `comprobar_todo.py` tiene que dar lo mismo antes y después,
  salvo las comprobaciones nuevas.
- La huella es FNV-1a y no un hash criptográfico porque tiene que calcularse igual, y de forma
  síncrona, en el navegador y en Python.
- Si `generar_revision.py` no puede usar `primeraPersona()` sin duplicarla, la opción
  preferida es que invoque un script Node mínimo. Duplicar la proyección exige un caso de
  paridad en `test/`.
- Si al hacerlo aparece la necesidad de una regla que el plan no prevé, se anota en la
  sección 8 del plan, no se implementa de pasada.

## L2 · Opus 5.5 — Argumentativo de 4.º ESO ✅ hecha el 25-sep-2026 (v1.64)

**Prompt:**

> Ejecuta la sesión L2 de `docs/diseno/plan-lenguaje-sencillo.md`. Invoca el skill
> `rubricas-pack`. Carga en `data/pack-lcl-argumentativo.json` el borrador
> `docs/diseno/borrador-sencillo-argumentativo-4ESO.json` con el script de carga. Después
> completa lo que falta en 4.º ESO: los cuatro niveles sencillos de `tratamiento_informacion`
> y el `nombre_alumno` de las seis dimensiones (el borrador trae propuestas). Lee los
> técnicos con `py scripts/ver.py pack argumentativo --curso 4ESO` y
> `py scripts/ver.py criterio <id>`. Validación y proyección en limpio, `generar_revision.py`,
> y enséñame en una tabla técnico · sencillo de lo nuevo para que revise el significado.
> Cuando lo apruebe: borra el borrador, `comprobar_todo.py` en verde, actualiza el plan
> («Próxima sesión» y registro de cobertura) y commit.

**Pautas:**
- El borrador ya está validado: no se reescribe salvo que el docente lo pida.
- El docente solo revisa el **significado**. Lo que sea de forma se arregla antes de enseñárselo.

## Ln · Opus 5.5 — Plantilla para cada actividad nueva

**Prompt (se rellena `<pack>` y `<curso>`):**

> Ejecuta una sesión Ln de `docs/diseno/plan-lenguaje-sencillo.md` para `<pack>` en `<curso>`.
> `<curso>` tiene que ser 2.º o 4.º de ESO (sección 1, punto 6); si no lo es, confirma con el
> docente antes de seguir. Invoca el skill `rubricas-pack`. Lee solo ese curso (`ver.py pack <pack> --curso <curso>`),
> y para comprobar la progresión, las mismas dimensiones del curso anterior y del siguiente
> si ya tienen versión sencilla. Escribe los descriptores sencillos y los `nombre_alumno` en
> un JSON, cárgalo con el script de carga, deja validación y proyección en limpio, regenera
> la revisión y enséñame la tabla técnico · sencillo para que revise el significado. Cuando
> lo apruebe: `comprobar_todo.py` en verde, actualiza el plan y commit.

**Pautas:**
- Si el docente agrupa varias actividades de un trimestre, se hacen en la misma sesión: se
  ahorra la lectura inicial.
- Si una corrección del docente revela un error que puede repetirse, se añade a la sección 2
  (o al skill, tras L1) en la misma sesión.

---

## 6. Próxima sesión

**4.º ESO, completo.** Ln-a (`expositivo`, `resumen`, `noticia`) y Ln-b (`investigacion`,
`oral`, en 4.º y de paso en 2.º) volvieron el 28-sep-2026 **sin ninguna corrección de
significado** del docente. Con el argumentativo (prueba + L2), los seis packs que el docente
pidió para 4.º ESO el 26-sep-2026 están hechos.

**Prueba de ahorro de la sección 3.** Dos sesiones Ln seguidas —Ln-a y Ln-b— vuelven sin
corrección: toca la prueba. **Ln-c se hace con Sonnet 5** (`claude-sonnet-5`), comparando el
resultado con Ln-a/Ln-b. Si necesita correcciones de significado, se vuelve a Opus 5.5 para
Ln-d y se anota en la sección 3; si no, Sonnet 5 sigue siendo el modelo de redacción para lo
que quede de 2.º ESO.

**Nueva sesión, no esta misma.** Cada Ln arranca leyendo solo esta sección (regla 1 de la
sección 4) y los packs con `ver.py`, sin el historial de exploración de la sesión que cierra
este documento — así se mantiene el presupuesto de contexto de `CLAUDE.md`.

Queda **2.º ESO**: de los seis packs que fijó el docente el 26-sep-2026
(`argumentativo`, `expositivo`, `narracion`, `resumen`, `oral`, `investigacion`), `oral` e
`investigacion` ya están hechos (Ln-b). Quedan `argumentativo`, `expositivo`, `narracion` y
`resumen`: 23 dimensiones, 92 descriptores. Van en dos sesiones, agrupadas como en Ln-a/Ln-b
por la referencia disponible:

- **Ln-c** · `argumentativo`, `expositivo` — mismas seis dimensiones en los dos packs
  (`adecuacion`, `coherencia`, `cohesion`, `correccion_lexico`, `planificacion_revision`,
  `tratamiento_informacion`), con su versión sencilla de 4.º ya cargada como referencia de
  tono, más `oral` e `investigacion` de 2.º para las dimensiones que comparten nombre.
- **Ln-d** · `narracion`, `resumen` — `resumen` tiene referencia de 4.º (Ln-a); `narracion`
  no tiene pack en 4.º y comparte cuatro de sus seis dimensiones con los ya hechos
  (`adecuacion`, `coherencia`, `cohesion`, `correccion_lexico`, `planificacion_revision`);
  solo `intencion_literaria` es nueva.

**Prompt de Ln-c:**

> Ejecuta una sesión Ln de `docs/diseno/plan-lenguaje-sencillo.md`: la Ln-c, para
> `argumentativo` y `expositivo` en 2ESO (sección 6). Invoca el skill `rubricas-pack`. Es la
> prueba de ahorro de la sección 3: Ln-a y Ln-b volvieron sin ninguna corrección de
> significado, así que esta se hace con Sonnet 5, comparando el resultado; si necesita
> correcciones, se vuelve a Opus 5.5 y se anota en la sección 3.
>
> - Lee solo 2.º de esos dos packs, sin las matrices. Como referencia de tono y de
>   `nombre_alumno`, usa las versiones sencillas ya cargadas del argumentativo y el
>   expositivo de 4.º, y las de `oral` e `investigacion` de 2.º para las dimensiones que
>   comparten nombre (`adecuacion`, `coherencia`, `cohesion`, `correccion_lexico`,
>   `planificacion_revision`, `tratamiento_informacion`).
> - Escribe un JSON por pack en el directorio temporal de la sesión. Cárgalos con
>   `node scripts/cargar_sencillo.mjs`, deja validación y proyección en limpio y lee la
>   columna de autoevaluación entera (el validador no detecta los sustantivos homógrafos de
>   un verbo del banco, regla 3 del paso 7 del skill). Regenera las revisiones y pasa
>   `py scripts/comprobar_todo.py`.
> - Para mi revisión de significado, dame un Word (A4 apaisado; columnas N · Técnico ·
>   Sencillo; una fila gris por dimensión con el nombre técnico y el `nombre_alumno`), una
>   sección por pack, generado desde los packs y no copiado a mano. En la primera página, las
>   dudas de significado que tengas.
> - Cuando te devuelva las correcciones: vuelve a cargar, `comprobar_todo.py` en verde,
>   actualiza el plan (sección 6 con el prompt de Ln-d: `narracion` y `resumen` en 2ESO, y
>   tus filas en el registro de cobertura de la sección 7) y haz un commit.

Cuando Ln-d termine, 2.º y 4.º de ESO quedan agotados (regla 6 de la sección 1): la siguiente
decisión —qué curso sigue, 1.º, 3.º o Bachillerato— es del docente, no de este plan.

## 7. Registro de cobertura

| Pack | Curso | Estado | Sesión | Fecha |
|---|---|---|---|---|
| argumentativo | 4ESO | Completo: 6 dimensiones × 4 niveles y 6 `nombre_alumno` | prueba + L2 | 25-sep-2026 |
| expositivo | 4ESO | Completo: 6 dimensiones × 4 niveles y 6 `nombre_alumno` | Ln-a | 28-sep-2026 |
| resumen | 4ESO | Completo: 5 dimensiones × 4 niveles y 5 `nombre_alumno` | Ln-a | 28-sep-2026 |
| noticia | 4ESO | Completo: 5 dimensiones × 4 niveles y 5 `nombre_alumno` | Ln-a | 28-sep-2026 |
| oral | 4ESO | Completo: 6 dimensiones × 4 niveles y 5 `nombre_alumno` | Ln-b | 28-sep-2026 |
| oral | 2ESO | Completo: 6 dimensiones × 4 niveles y 5 `nombre_alumno` | Ln-b | 28-sep-2026 |
| investigacion | 4ESO | Completo: 6 dimensiones × 4 niveles y 6 `nombre_alumno` | Ln-b | 28-sep-2026 |
| investigacion | 2ESO | Completo: 4 dimensiones × 4 niveles y 4 `nombre_alumno` | Ln-b | 28-sep-2026 |

## 8. Lo que no se hace, a propósito, y cuándo se reconsidera

| No se hace | Se reconsidera si… |
|---|---|
| Reescribir por adelantado los packs que no se usan | el departamento adopta la app entera para un curso |
| Tocar 1.º, 3.º de ESO o Bachillerato | se agota lo pendiente en 2.º y 4.º de ESO, o una actividad puntual de otro curso lo pide |
| Regla de tecnicismos fuera de paréntesis | el mismo tecnicismo se cuela en dos actividades |
| Límite de palabras por descriptor | los alumnos del piloto se pierden en los descriptores largos |
| Versión sencilla de la lista de cotejo y la rúbrica de un solo punto | el docente las reparte al alumno |
| Piloto formal | — basta con observar al repartir la rúbrica de Cadalso: ¿la entienden sin explicación? ¿su autoevaluación se acerca a la nota? |
