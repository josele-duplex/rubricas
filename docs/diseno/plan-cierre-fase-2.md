# Plan de cierre de la fase 2 (v1 completa)

**Estado:** plan operativo · 5 de agosto de 2026
**Redactado por:** Claude Fable 5, para ejecutar en sesiones de Opus y Sonnet
**Objetivo:** terminar la v1 completa del roadmap (SDD §16): matriz de tareas 20/20,
los flecos de código de la fase 2 y la publicación.

---

## 0. Punto de partida (verificado el 5-ago-2026, no de memoria)

- `data/pack-lcl-expositivo.json`: 30 criterios, 5 cursos (1.º–4.º ESO, 1.º Bach), validador y derivación **sin incidencias**.
- `data/pack-lcl-argumentativo.json`: 12 criterios, 3.º ESO y 1.º Bach, validador **sin incidencias**. **Sin confirmar en git.**
- Matriz §4.3: **7 de 20 celdas** con contenido (el SDD §16.1 dice 5/20 porque no cuenta el argumentativo sin confirmar).
- Los 4 tests de `test/` pasan. Ojo: `node --test test/` a secas falla en este Windows; ejecutar `node --test test/*.mjs` o archivo a archivo.
- Sin confirmar en git: pack argumentativo, `fuentes/pau/`, `docs/diseno/plan-rediseno-portada.md`, cambios en js/css/index y `docs/Que-puede-hacer-la-app.docx` (~3.500 líneas).
- Código pendiente (SDD §16.1): resto del modo avanzado, exportación `.xlsx` + config `.json` + texto del modo IA, portada (plan escrito, sin implementar), GitHub Pages.
- De la matriz digital: correcciones **C1** (nombres canónicos de nivel) y **C4** (puntero roto al SDD §17.8) pendientes en este proyecto.

## Reparto de modelos

- **Opus → contenido curricular** (packs, derivación, citas, matrices cuantitativas): es trabajo de juicio con reglas duras; las pautas de cada sesión desactivan sus trampas conocidas.
- **Sonnet → código con especificación cerrada** (portada, modo avanzado, exportaciones, motor): el SDD y los tests ya fijan el comportamiento; no hay decisión de derivación en juego.
- **Una sesión nueva por cada sesión del plan.** Ninguna depende del contexto de la anterior: todo lo que necesitan está en CLAUDE.md, el SDD y este archivo.

## Reglas transversales (van implícitas en todos los prompts)

1. Todo trabajo de pack empieza invocando el skill **`rubricas-pack`**.
2. **Batería de cierre** de toda sesión de contenido, en este orden:
   `python scripts/validar_pack.py data/<pack>.json` · `python scripts/verificar_derivacion.py` ·
   `python scripts/simular_correccion.py` sobre cada matriz nueva · regenerar `docs/revision-*.md`
   con `scripts/generar_revision.py` · `node --test test/*.mjs`.
3. Toda cita de criterio o saber se **copia de `fuentes/curriculo/`**, jamás de memoria. Lo que va entre «» debe encontrarse literalmente en la fuente (lo comprueba `verificar_derivacion.py`); el uso-mención propio va en comillas simples.
4. Si una sesión cree necesitar una **regla de derivación nueva**: se prueba contra los seis cursos y todos los packs a la vez; si invalida un pack ya validado, **la rota es la regla, no el pack** (CLAUDE.md regla 9). No se "mejora" ninguna regla de pasada.
5. Toda regla nueva de validación entra **en los dos validadores** (`scripts/validar_pack.py` y `js/validador.js`) con su caso dorado en `test/`.
6. `docs/revision-*.md` **nunca se edita a mano**: se regenera.
7. Jamás se modifica nada de `proyecto_plan_de_trabajo_lengua`.
8. Los caracteres corruptos (�) en la salida de consola de los scripts son la codificación cp1252 de la consola de Windows, **no** de los archivos: no hay nada que arreglar ahí.
9. Cada sesión termina con un commit propio (mensaje en español, estilo del historial).

---

## Mapa de sesiones

| # | Modelo | Objetivo | Depende de |
|---|---|---|---|
| S0 | Sonnet | Confirmar el trabajo a medias | — |
| S1 | Opus | Argumentativo: 2.º ESO (○) y 4.º ESO (●) | S0 |
| S2 | Opus | 2.º Bach: argumentativo (●) y expositivo (○) — resuelve §17.11 | S0 |
| S3 | Sonnet | Motor: preparar tareas orales (modalidad y detractor) | S0 |
| S4 | Opus | Pack exposición oral — ESO (4 cursos) | S3 |
| S5 | Opus | Pack exposición oral — Bachillerato (2 cursos) | S4 |
| S6 | Opus | Pack narración — 1.º, 2.º ESO (●) y 3.º ESO (○) | S0 |
| S7 | Sonnet | Rediseño de portada (ejecutar el plan ya escrito) | S0 |
| S8 | Sonnet | Modo avanzado: lo que falta de §11.2 | S0 |
| S9 | Sonnet | Exportaciones: texto IA, config `.json`, `.xlsx` iDoceo | S8 |
| S10 | Sonnet | Matriz digital: C1 y C4, y sincronizar SDD §16.1 | resto |
| S11 | Josele | Decisiones §17 y publicación | resto |

S1, S2 y S6 pueden ir en cualquier orden entre sí. S7 puede intercalarse donde convenga.
El orden propuesto prioriza lo que ya está caliente (argumentativo) y deja para el final
lo único que introduce una biblioteca externa (`.xlsx`, §16.1).

---

## S0 · Sonnet — Cerrar y confirmar el trabajo a medias

**Prompt:**

> Hay una sesión de trabajo sin confirmar en git: el pack argumentativo nuevo
> (`data/pack-lcl-argumentativo.json`, 3.º ESO y 1.º Bach), sus fuentes PAU en `fuentes/pau/`,
> el documento `docs/revision-lcl-argumentativo.md`, el plan de portada
> (`docs/diseno/plan-rediseno-portada.md`, solo propuesta, no implementarlo) y cambios en
> js/css/index. Verifica que todo está coherente y confírmalo en commits separados por tema:
> (1) ejecuta la batería completa (validador sobre los dos packs, `verificar_derivacion.py`,
> `node --test test/*.mjs`); (2) comprueba que `docs/revision-lcl-argumentativo.md` está
> regenerado con `scripts/generar_revision.py` y no editado a mano; (3) comprueba en el
> navegador (preview) que la app carga los dos packs y que el selector de tipo de tarea
> ofrece argumentativo solo en sus cursos de la matriz §4.3; (4) actualiza la fila
> «Matriz tarea × curso» del SDD §16.1 a 7 de 20 celdas y registra la versión en el
> registro de cambios del SDD; (5) commits: pack argumentativo + revisión + fuentes PAU /
> plan de portada / resto de cambios de app, con mensajes que expliquen el porqué.

**Pautas (Fable):**
- Si la app **no** tiene todavía el cableado multi-pack o el selector ofrece argumentativo en cursos vacíos de la matriz, eso es un hallazgo, no algo que arreglar en silencio: anotarlo y arreglarlo como parte del punto 3, porque §4.3 exige que la app no ofrezca celdas vacías.
- No tocar contenido de los packs en esta sesión. Si algún check falla, diagnosticar; no «reparar» descriptores sin el skill.
- `docs/Que-puede-hacer-la-app.docx` es material aportado: se confirma en `docs/` tal cual, sin procesar.

## S1 · Opus — Argumentativo: 2.º ESO (○) y 4.º ESO (●)

**Prompt:**

> Con el skill `rubricas-pack`, amplía `data/pack-lcl-argumentativo.json` con los cursos
> 2.º ESO y 4.º ESO (6 criterios por curso, mismas dimensiones que 3.º ESO). En la matriz
> §4.3 del SDD, 2.º ESO es ○ (sostenido por el criterio, no nombrado en los saberes) y
> 4.º ESO es ● (los saberes reutilizan las dos mismas fórmulas que en 3.º:
> «Secuencias textuales básicas…» y «Iniciación a la expresión de la subjetividad…» —
> verifícalo leyendo `fuentes/curriculo/curriculo-ESO-Murcia-lengua.md`). Matrices
> cuantitativas siguiendo el patrón del pack. Cierra con la batería completa, regenera la
> revisión y actualiza SDD §16.1 (9 de 20). Commit al terminar.

**Pautas (Fable):**
- **La exigencia de 2.º ESO la fija la redacción del criterio 5.1 de 2.º ESO**, no una rebaja manual desde 3.º. Copia la condición del criterio oficial de 2.º y deja que ella module los descriptores; el pack expositivo de 2.º ESO ya resolvió esto y es el espejo correcto.
- En el pack, **adecuación va sin matriz cuantitativa a propósito** (pasa en los 7 cursos existentes de los dos packs). No es un hueco que completar: replica el patrón.
- Los ids siguen el patrón existente `lcl-<bloque>-<dimension>-arg-<curso>`.
- Cuando el criterio oficial de dos cursos coincide textualmente, el modelo de datos prevé **herencia de descriptores** (SDD §5.1, v0.6): comprueba cómo la usa el expositivo entre cursos vecinos antes de redactar desde cero.
- Al escribir descriptores nuevos: cualquier verbo que no esté en el banco (34 entradas) debe entrar **con sus dos personas** (3.ª y 1.ª), y `test/proyeccion.mjs` debe seguir pasando. Evita subordinadas de relativo con «que + verbo» cuyo sujeto sea el alumno: la proyección a 1.ª persona no reconjuga el verbo que sigue a «que» (excepción documentada en SDD v1.4) y quedaría mal conjugado.
- Si una dimensión de la simulación de corrección cae dos niveles de golpe, sospecha de las penalizaciones (doble castigo, CLAUDE.md regla 7).

## S2 · Opus — 2.º Bachillerato: argumentativo (●) y expositivo (○)

**Prompt:**

> Con el skill `rubricas-pack`, añade 2.º Bach a los dos packs: 6 criterios de argumentativo
> (celda ●) en `data/pack-lcl-argumentativo.json` y 6 de expositivo (celda ○) en
> `data/pack-lcl-expositivo.json`. Antes de redactar: (1) lee la decisión abierta §17.11 del
> SDD y aplica la resolución que este plan recomienda (abajo); (2) añade el Decreto
> n.º 251/2022, de 22 de diciembre, a `normativa.autonomica` de los packs que ahora cubren
> Bachillerato (ya anotado en SDD v1.9); (3) los criterios se citan de
> `fuentes/curriculo/curriculo-Bachillerato-lengua.md`. Documenta en el SDD la resolución
> de §17.11 (marcándola resuelta con su porqué) y actualiza §16.1 (11 de 20). Batería
> completa, revisiones regeneradas, commit.

**Pautas (Fable):**
- **Resolución recomendada de §17.11** (y su porqué, para escribirlo en el SDD): 2.º Bach **reutiliza la posición de 1.º Bach en los tres ejes de progresión**. El Marco Teórico no describe ningún peldaño por encima de 1.º Bach, y definir uno sin fuente violaría la regla 2 de CLAUDE.md (la progresión la fija el currículo, no el diseñador). La diferencia real entre los dos cursos vive donde siempre: en la redacción del criterio oficial de cada curso y en la condición del descriptor. Si al ejecutar surge algo que contradiga esto, parar y consultar a Josele, no improvisar un peldaño.
- **Trampa principal de esta sesión: `fuentes/pau/`.** Existe documentación de la PAU 2026 de LCL II en el repositorio y 2.º Bach es exactamente el curso de esa prueba. **No se cita como `criterio_oficial` ni como fuente de ninguna matriz**: el SDD v1.9 ya descartó las directrices EBAU/PAU por principio — la calificación de un curso oficial se rige por el currículo, no por los criterios de corrección de una prueba externa. La PAU puede, como mucho, informar la elección de saber-vehículo o el contexto de tarea; la fuente normativa es siempre el decreto.
- Expositivo en 2.º Bach es ○: el foco de los saberes del curso está en el argumentativo. El sostén es el criterio 5.1 de 2.º Bach («textos académicos», sin género) y la descripción de la competencia 5 común a la etapa; las citas exactas ya están verificadas en SDD §4.3 — reutilízalas, no busques otras.
- Un pack que ahora cubre ESO y Bachillerato debe declarar **los dos decretos** en `normativa.autonomica`. Si el campo es hoy una cadena única, decidir el formato (lista) toca a los dos validadores y a `test/` (regla transversal 5).

## S3 · Sonnet — Motor: preparar las tareas orales

**Prompt:**

> Prepara el motor para packs de tarea oral antes de que exista el primero. Cambios:
> (1) añade al esquema de pack un campo `modalidad` (`"escrita"` | `"oral"`), con los dos
> packs existentes declarados `"escrita"`; (2) el detractor global de ortografía y
> presentación (`DETRACTOR_ESTIMACION`, SDD §6.3 y §7.7) solo aplica a packs de modalidad
> escrita: la escala de estimación analítica y la pantalla «Calificar» no deben mostrarlo
> ni aplicarlo en modalidad oral; (3) la regla entra en los dos validadores (campo
> obligatorio con valores cerrados) con casos dorados en `test/`; (4) documenta el cambio
> en el SDD (§5.1, §6.3, §7.7 y registro de cambios). Ejecuta la batería completa y los
> tests, y prueba en el navegador que nada cambia para los packs escritos. Commit.

**Pautas (Fable):**
- Este cambio existe porque, sin él, la primera escala de estimación de una exposición oral saldría impresa con un detractor de *ortografía* — el tipo de absurdo que un profesor detecta al primer vistazo y que ningún validador actual atrapa.
- No generalizar de más: no inventar un sistema de detractores configurables por pack. Un booleano de aplicabilidad por modalidad basta; los detractores siguen siendo convención de corrección declarada del instrumento, no contenido del pack (SDD v1.6).
- Revisar de paso si la ficha del alumno o el guion de clase (§7.3) contienen texto que presuponga tarea escrita («el texto», «la redacción») y parametrizarlo solo si aparece — sin rehacer plantillas.

## S4 · Opus — Pack de exposición oral, ESO (1.º–4.º)

**Prompt:**

> Con el skill `rubricas-pack`, crea `data/pack-lcl-oral.json` (modalidad `"oral"`, esquema
> con el campo `modalidad` ya en el motor) con los cursos 1.º a 4.º de ESO, 6 criterios por
> curso. La exposición oral es ● en los seis cursos de la matriz §4.3. Los criterios
> oficiales son los de producción oral del decreto de Murcia
> (`fuentes/curriculo/curriculo-ESO-Murcia-lengua.md`): confirma la numeración exacta
> curso a curso contra el texto (decisión §17.5 del SDD), no asumas que es la 3.1 en todos.
> Dimensiones como acción competencial (p. ej. planificación del discurso, estructura,
> recursos no verbales, dicción y prosodia como vehículo…), nunca el contenido como fila.
> Matrices cuantitativas donde el componente lo permita, simulando corrección. Batería
> completa, revisión regenerada (`docs/revision-lcl-oral.md`), SDD §16.1 (15 de 20), commit.

**Pautas (Fable):**
- **El primer pack de un género nuevo fija dimensiones para toda la columna.** Elegirlas mirando primero cómo el decreto describe la competencia oral en los cuatro cursos, no solo en 1.º: una dimensión que en 4.º no tenga sostén habrá que amputarla luego, y eso es rehacer, no ampliar.
- El banco de verbos va a crecer con verbos orales (pronunciar, entonar, gesticular, dirigirse…). Cada uno entra con **3.ª y 1.ª persona**, y hay que vigilar los **verbos segundos** de frases compuestas y los reflexivos: fueron exactamente los dos agujeros de la v1.4. `test/proyeccion.mjs` es el guardarraíl: su invariante debe pasar sobre el pack nuevo también — comprobar que el test recorre todos los packs y, si está cableado solo al expositivo, ampliarlo (eso es código, cabe en la sesión).
- Doble castigo en oral, versión típica: si una dimensión ya valora la fluidez, no puede haber penalización aparte por muletillas o pausas — es el mismo constructo dos veces. La simulación de corrección lo destapa: si una dimensión cae dos niveles de golpe, ahí está.
- El nivel 1 describe lo que el alumno **sí** hace de forma limitada, y en oral la tentación de negación es fuerte («no mira al público»): siempre en positivo limitado («dirige la mirada al guion y ocasionalmente al público»).

## S5 · Opus — Pack de exposición oral, Bachillerato (1.º y 2.º)

**Prompt:**

> Con el skill `rubricas-pack`, amplía `data/pack-lcl-oral.json` con 1.º y 2.º de Bachillerato
> (● ambos en la matriz §4.3), citando de
> `fuentes/curriculo/curriculo-Bachillerato-lengua.md` y confirmando numeración curso a
> curso. Aplica la resolución de §17.11 ya documentada en el SDD (2.º Bach reutiliza los
> ejes de 1.º Bach; la diferencia va en la redacción del criterio y la condición). Añade el
> Decreto n.º 251/2022 a la normativa del pack si aún no está. Batería completa, revisión,
> SDD §16.1 (17 de 20), commit.

**Pautas (Fable):**
- Misma trampa PAU que en S2: la exposición oral de 2.º Bach no se deriva de ninguna directriz de prueba externa.
- En Bachillerato el criterio 8.2 de 1.º Bach nombra «una exposición oral» como producto de proyectos de investigación (cita ya verificada en SDD §4.3): es sostén adicional, no la puerta — la puerta sigue siendo el criterio de producción oral del curso.
- Mantener las dimensiones de ESO: lo que escala es la condición que acompaña al verbo, no el catálogo de filas.

## S6 · Opus — Pack de narración (1.º, 2.º ESO ● · 3.º ESO ○)

**Prompt:**

> Con el skill `rubricas-pack`, crea `data/pack-lcl-narracion.json` (modalidad `"escrita"`)
> con 1.º, 2.º y 3.º de ESO. En la matriz §4.3, 1.º y 2.º son ● y 3.º es ○ (residual: el foco
> del curso ya se ha desplazado). **No existe en 4.º ESO ni en Bachillerato: no extender.**
> Criterios citados de `fuentes/curriculo/curriculo-ESO-Murcia-lengua.md`. Matrices
> cuantitativas con simulación. Batería completa, revisión, SDD §16.1 (20 de 20 — la matriz
> queda completa: decláralo en el registro de cambios), commit.

**Pautas (Fable):**
- Riesgo específico de la narración: convertir contenidos en filas («el narrador», «los personajes», «el diálogo»). La dimensión es la acción competencial (construye la secuencia narrativa, mantiene la coherencia temporal…); narrador y personajes van **dentro** del descriptor como saber-vehículo (CLAUDE.md regla 5).
- La decisión §17.7 preguntaba justo por esta columna (¿narración llega a 3.º?): **ratificada por Josele el 2026-08-05, sí llega, como ○** (SDD §17, decisión 7). Esta sesión no necesita repasarla de nuevo; si al leer el currículo de 3.º el criterio no la sostuviera de todos modos, **no se vacía en silencio**: se para y se consulta a Josele, porque cambiar la matriz es cambiar §4.3 y `verificar_derivacion.py` la vigila.
- Con este pack la matriz queda 20/20: buen momento para que la sesión repase que `verificar_derivacion.py` pasa sobre los cuatro packs a la vez.

## S7 · Sonnet — Rediseño de portada

**Prompt:**

> Implementa el plan de `docs/diseno/plan-rediseno-portada.md` (banda de tinta, tarjeta única
> de configuración montada, jerarquía tipográfica, menos scroll). Alcance exacto del plan:
> `index.html`, `css/styles.css`, `css/print.css` y el marcado de pestañas de `js/ui.js`;
> ningún `.json` de `data/`, ni motor, ni validador. Verifica en el navegador (preview) a
> 1080p y en móvil (375px): el botón Generar debe quedar en la primera pantalla. Comprueba
> que la impresión no cambia (print.css intacto salvo lo que el plan indique). Ejecuta
> `node --test test/*.mjs` para confirmar que no se ha tocado lógica. Commit.

**Pautas (Fable):**
- La identidad editorial (serif, grano de papel, **cero emojis e iconografía genérica** — retirados a propósito en v1.3) no se renegocia: el plan la conserva y cualquier «mejora» con iconos la rompería.
- El plan ya midió y diagnosticó; no rediagnosticar ni ampliar alcance. Si algo del plan resulta inviable al implementarlo, anotarlo en el propio documento del plan y resolver con el criterio del plan, no improvisar otra dirección.

## S8 · Sonnet — Modo avanzado: lo que falta de §11.2

**Prompt:**

> Completa el modo avanzado según SDD §11.2 y §16.1: (1) control de profundidad;
> (2) marcado de criterios obligatorios, conectado a la condición mínima de §6.2 — que por
> decisión provisional §17.1 va **desactivada por defecto**; (3) elección de instrumentos a
> generar; (4) selección de modo de calificación (cualitativo/numérico); (5) edición manual
> de descriptores con el validador (`js/validador.js`) activo en vivo, mostrando la
> microexplicación de cada regla que se incumpla. Cada control nuevo lleva su
> microexplicación en `js/microexplicaciones.js` (§11.3). Tras cualquier reajuste deben
> regenerarse **todos** los instrumentos afectados (el bug de v1.5 fue exactamente olvidar
> uno). Tests que apliquen + batería + prueba en navegador. Commit.

**Pautas (Fable):**
- La edición manual de descriptores **no** escribe en `data/*.json`: edita la configuración del profesor (SDD §5.5, localStorage), el pack es de solo lectura. Si el descriptor editado viola el validador, se avisa con la microexplicación pero decide el profesor — el validador bloquea packs, no ediciones del docente (SDD §10: la app «enseña mientras se usa», no secuestra).
- Los valores por defecto de §17.1–§17.3 (condición mínima desactivada, escala equilibrada, tope 2) están implementados como provisionales: no darlos por cerrados en el SDD; siguen siendo decisiones abiertas de Josele.
- Cuidado con el patrón de v1.8: al cambiar pesos o desactivar dimensiones con alumnos ya calificados en localStorage, la recomposición omite lo desaparecido y recalcula — no romper esa compatibilidad al añadir controles nuevos.

## S9 · Sonnet — Exportaciones

**Prompt:**

> Completa §12 en tres piezas, en este orden: (1) **texto plano del modo IA** (§7.8 y §14):
> botón de copiar y descarga `.txt` del instrumento en modo IA; (2) **configuración `.json`**:
> exportar/importar la configuración del profesor (§5.5) como archivo; (3) **`.xlsx` para
> iDoceo**: exportación de la rúbrica compatible con la importación de iDoceo. Restricción
> dura para el xlsx: la app es estática y sin llamadas externas (CLAUDE.md regla 8), así que
> la biblioteca (SheetJS o equivalente) se incorpora **vendorizada en el repositorio**, nunca
> desde CDN, y solo se carga al exportar. Prueba las tres piezas en el navegador con un
> pack real. Documenta en el SDD. Commit por pieza.

**Pautas (Fable):**
- El solapamiento con el skill `rubricas-lomloe` (decisión §17.8) **no se resuelve en esta sesión**: ese skill genera xlsx de iDoceo desde el chat con su propio script (`idoceo_rubric.py`). Lo que sí debe hacer la sesión es **mirar el formato de columnas que ese script produce** y no inventar otro incompatible: dos exportadores con dos formatos es el peor resultado posible. Si el formato del skill no es alcanzable desde la app, documentar la divergencia en §17.8 para que Josele decida.
- El import de configuración `.json` valida contra el esquema antes de aplicar: un archivo manipulado no debe romper la app (es la única entrada de datos externa que tendrá).
- No añadir la biblioteca al bundle inicial: la portada no puede pagar el peso de un exportador que se usa una vez por trimestre.

## S10 · Sonnet — Matriz digital y sincronización documental

**Prompt:**

> Tres correcciones documentales: (1) **C1 de la matriz digital**: alinear los nombres de
> nivel de este proyecto con los canónicos que fija el proyecto de Lengua — leer la matriz
> (`proyecto_plan_de_trabajo_lengua/.../Matriz-digital_tres-proyectos.md` §3) para saber
> cuáles son, y **referenciar, no copiar** (CLAUDE.md); aplicar el cambio donde este
> proyecto los nombre (SDD, js/ui.js, packs si procede — si toca packs, batería completa);
> (2) **C4**: arreglar el puntero roto al SDD §17.8 que la matriz señala; (3) repasar que
> SDD §16.1 refleja el estado real tras las sesiones anteriores (20/20, instrumentos,
> exportaciones) y que el registro de cambios está al día. Ejecutar
> `python scripts/verificar_matriz.py` **desde el repositorio de Lengua** para comprobar la
> matriz. Sin tocar ningún archivo del proyecto de Lengua. Commit.

**Pautas (Fable):**
- Si C1 obliga a renombrar niveles dentro de los packs, eso es un cambio de contenido con validador: batería completa y mucho ojo con `test/` (los casos dorados citan nombres). Si la envergadura se dispara, es legítimo partir C1 a una sesión propia de Opus — decidirlo por tamaño real, no de antemano.
- La regla de propiedad manda: los nombres canónicos los posee Lengua; este proyecto los consume. No «mejorarlos» al aplicarlos.

## S11 · Josele — Decisiones abiertas y publicación

No es una sesión de modelo: es la lista de lo que solo puede decidir el docente, con la
recomendación de este plan para cada una.

| Decisión (§17) | Recomendación del plan |
|---|---|
| 1. Condición mínima por defecto | Mantener desactivada (ya implementada así) y cerrarla en el SDD |
| 2. Escala por defecto | Equilibrada (ya implementada así) |
| 3. Tope de detractores | 2 puntos; contrastar con el departamento cuando toque, no bloquea |
| 6. Rúbrica holística | Aplazar a fase 3: el catálogo está en 7/7 y la sostenibilidad era la duda |
| 7. Revisión de la matriz §4.3 | **Narración en 3.º: ratificada (2026-08-05), sí llega, como ○.** Sigue pendiente repasar el argumentativo incipiente en 2.º ESO **antes** de ejecutar S1 |
| 8. Marco teórico (bloqueante) | Decidir dónde vive; mientras tanto las sesiones citan el del proyecto de Lengua como vigente |
| 9. Publicación | Activar GitHub Pages **después** de revisar qué contiene `fuentes/` (hay currículo transcrito y documentación PAU: revisar difusión antes de hacer público el repositorio) |
| 11. Progresión 2.º Bach | S2 la resuelve con la opción conservadora (reutilizar 1.º Bach); ratificarla o enmendarla |

**Orden recomendado de ratificación:** la 7 conviene **antes** de S1/S6 (afecta a celdas que se van a rellenar); la 9 y la 8 pueden esperar al final; el resto, cuando haya un rato.

---

## Por qué este reparto y no otro (nota de Fable)

- **Opus no debe tocar código de motor y Sonnet no debe redactar descriptores.** No por capacidad bruta, sino por perfil de error: el fallo típico de un modelo fuerte en contenido curricular es *plausibilidad* — una cita parafraseada que suena a decreto, una regla «mejorada» que invalida un pack válido, un peldaño de progresión inventado con buena prosa. Todos los guardarraíles de este repositorio (verificador de citas, regla de simetría, banco cerrado de verbos) existen porque esos errores ya ocurrieron. Los prompts de Opus llevan la comprobación mecánica **dentro** de la tarea, no después.
- **Las tres trampas más probables de todo el plan**, por si una sesión se sale del guion: citar la PAU como fuente normativa en 2.º Bach (S2/S5); un detractor de ortografía impreso en una rúbrica oral (evitado por S3); y una regla de validación nueva que rompa un pack ya validado (cualquier sesión — la respuesta es siempre: la rota es la regla).
- **Cada sesión en contexto nuevo.** Los packs y el SDD son la memoria del proyecto; arrastrar contexto entre sesiones solo añade ruido y ancla decisiones viejas.
