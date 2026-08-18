# Por qué están escritas así las reglas del proyecto

`CLAUDE.md` se quedó con la regla; aquí está el motivo. La separación es del
18-ago-2026 y responde a una razón medible: `CLAUDE.md` entra **entero y en cada
sesión**, así que cada párrafo de justificación se paga muchas veces, mientras
que el motivo solo hace falta cuando alguien discute la regla o la va a cambiar.
Ninguna regla se ha suavizado al mudarse: siguen siendo las mismas nueve.

Léelo cuando vayas a **tocar** una regla. Para **cumplirla**, basta `CLAUDE.md`.

---

## Regla 1 · Las rúbricas se derivan, no se inventan

Un criterio sin referencia normativa no es un instrumento: es una opinión con
formato de tabla. Cuando el docente tiene que sostener una nota ante una familia
o ante una reclamación, lo único que sostiene es el texto del decreto. Si hace
falta evaluar algo que no está en ningún criterio, la salida no es inventarlo:
es buscar el criterio que sí lo sostiene.

## Regla 2 · La progresión la fija el currículo, no el diseñador

Lo que separa 1.º de 3.º de ESO **ya está escrito** en la redacción del criterio
oficial: *sencillos* y *de manera guiada* frente a *de cierta extensión* y
*progresivamente autónoma*. No se calibra afinando vocabulario ni subiendo
verbos de nivel en una taxonomía, porque eso produce una escala que solo existe
en la cabeza de quien la escribió. **El verbo lo pone el criterio; lo que escala
es la condición que lo acompaña.**

Corolario: los criterios son **por curso**, nunca por ciclo. El decreto de Murcia
los redacta curso a curso, y el 5.1 de 1.º no es el 5.1 de 2.º.

## Regla 3 · Cuatro niveles

Escala fija, no configurable. Las bandas de conversión sobre 10 —9–10 · 7–8,9 ·
5–6,9 · 0–4,9— están confirmadas por dos fuentes independientes. Los nombres
canónicos (Iniciado · Suficiente · Notable · Excelente) los manda el proyecto de
Lengua y viven **solo** en `data/catalogo.json`.

## Regla 4 · Cero adverbitis

*Bien*, *adecuadamente*, *a veces* y *bastante* no describen conducta observable:
describen la impresión del corrector. Dos profesores que usan la misma rúbrica
con esos adverbios ponen notas distintas, y entonces la rúbrica no está haciendo
su trabajo. El nivel 1 describe **lo que el alumno sí hace de forma limitada**,
nunca lo que le falta: «Utiliza conectores de adición», no «No usa conectores».
Empezar por la carencia además convierte la ficha del alumno en una lista de
reproches, que es justo lo contrario de para qué se le entrega antes de la prueba.

## Regla 5 · Los saberes son vehículo, nunca fila

La dimensión es una acción competencial, no un contenido: «Cohesión: conectores y
puntuación», no «Las oraciones subordinadas». Si la fila es un contenido, la
rúbrica evalúa temario y no competencia, y deja de poder aplicarse a la tarea
siguiente. El contenido va dentro del descriptor, como contexto.

## Regla 6 · La hoja del alumno no es opcional

Si el proyecto sostiene que el alumnado debe conocer la rúbrica antes de la
prueba, la aplicación la genera **siempre**. Una casilla que el profesor puede
olvidar marcar es una casilla que se olvida, y el día que se olvida el
instrumento deja de ser formativo sin que nadie se entere.

## Regla 7 · El doble castigo

Si el componente ya valora los errores de puntuación, no puede haber además una
penalización por párrafo sin puntos: el alumno paga dos veces por el mismo hecho
y la nota no aguanta una reclamación. En la práctica esto deja las matrices casi
sin penalizaciones, y eso es buena señal.

Esta regla **no se descubrió leyendo, se descubrió calculando**: la matriz
parecía razonable hasta que se simuló una corrección y una dimensión cayó dos
niveles de golpe. De ahí sale la obligación de simular toda matriz nueva
(`scripts/simular_correccion.py --resumen`), y de ahí sale que esa comprobación
**no** esté en `comprobar_todo.py`: pide un juicio, no da un booleano.

## Regla 8 · Ninguna llamada a IA desde la aplicación

La app genera el texto de la rúbrica en modo IA para que el profesor lo use fuera
si quiere. No ejecuta prompts, no pide claves, no envía nada. Sin servidor, sin
cuentas y sin datos personales: es software que se usa en un aula con menores.

## Regla 9 · El criterio es la puerta; los saberes, el foco

Una celda de la matriz de tareas (SDD §4.3) solo la abre o la cierra un **criterio
de evaluación**. Los saberes básicos nunca vacían una celda ni la sostienen solos:
indican dónde pone el foco cada curso (● frente a ○). La regla vale en las dos
direcciones: también la progresión se lee en la redacción del criterio, nunca se
calibra a mano (regla del techo, SDD §5.4).

Corolario de simetría: una regla de derivación solo está comprobada cuando se pasa
por los seis cursos a la vez; **si invalida un pack ya validado, la rota es la
regla, no el pack.**

Esta regla se escribió el 2026-08-05, después de que su ausencia produjera el
único error de derivación que ha llegado al docente. La regla de coherencia
vertical, además, estuvo mal formulada dos veces seguidas antes de acertar: de
ahí viene la costumbre de que, cuando el usuario corrige un planteamiento, se
revise si el mismo error está en más sitios.

---

## Por qué cada hecho vive en un solo sitio

Los errores de este proyecto han sido casi siempre el mismo: **un hecho escrito
dos veces y las dos copias separándose en silencio.** Ejemplos reales:

- el banco de verbos vivía copiado dentro de cada pack; al escribir el
  argumentativo faltaban ocho verbos que el expositivo sí tenía;
- la lista de packs estaba cableada en `js/main.js`, las etiquetas en `js/ui.js`
  y un `glob` en los scripts, y añadir un pack obligaba a acordarse de los tres;
- el validador existe dos veces (Python y JavaScript) por diseño, pero sus
  palabras salen de un archivo compartido, y `scripts/comprobar_paridad.py`
  ejecuta los dos lados sobre un corpus de trampas para que no puedan divergir.

De ahí la tabla de propiedad de `CLAUDE.md`: `data/` manda, y todo lo demás se
genera. El SDD es la excepción parcial: sus **tablas** §4.3 y §5.4 se generan,
pero la prosa que las justifica —qué sostiene cada celda, con su cita— se escribe
a mano y es lo que da sentido al dato.

## Por qué el simulador usa perfiles y no un sorteo

Sortear cada componente por separado produce alumnos que no existen (nivel 4 en
análisis y nivel 1 en interpretación) y, sobre todo, desliga el número de faltas
de la extensión del texto. Un umbral escrito en faltas absolutas no vale igual en
dos tareas de distinta longitud: así se vio que el comentario había heredado los
umbrales del expositivo, que es el doble de largo (SDD v1.27). Eso solo se ve
poniendo la extensión de la tarea al lado del umbral.

## Por qué el marco teórico vive en el proyecto de Lengua

Decisión del 13-ago-2026. El marco vigente es
`proyecto_plan_de_trabajo_lengua/…/documentos_base/marco_teorico_rubricas-LOMLOE.md`.
La copia de este repositorio (`docs/marco/…_ANTIGUO.md`) está superada y se
conserva solo como referencia histórica: corregir el alcance a 1.º ESO – 1.º BACH,
fijar las bandas sobre 10 e imponer el guardarraíl de terminología (`sintagma`,
`construcciones`, `periféricos`) se hizo allí, y aquí se referencia por ruta.

De las divergencias documentadas en la matriz digital, C1 y C4 se corrigieron aquí
el 13-ago-2026 (SDD v1.31). **La que sigue viva es C3** (hecho H11: la app y el
skill `rubricas-lomloe` se solapan en la nota /10 y en iDoceo), abierta como
decisión §17.19 del SDD y pendiente de que la decida Josele: no es una decisión
técnica y no se resuelve escribiendo código.

## Por qué 2.º de Bachillerato no es una excepción

El límite 1.º ESO – 1.º BACH es de los **materiales** que genera el proyecto de
Lengua (sus UD, guías y porfolios), no de este generador. Esta aplicación sí se
usa legítimamente en 2.º BACH, como producto de uso más amplio que el plan de aula.
Hay que mantener la capacidad de 2.º BACH del SDD sin tratarla como excepción ni
marcarla de ningún modo especial (corrección de H2, matriz §2, 4-ago-2026).
