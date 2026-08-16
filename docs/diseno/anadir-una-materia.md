# Añadir una materia al generador

Este documento existe porque el proyecto va a crecer. Si el taller de rúbricas se
acepta como proyecto de innovación, entrarán materias que no son Lengua, y el
peligro no es que sea difícil: es que **parezca fácil** y se cuelen los mismos
errores que ya se han cometido aquí una vez.

La regla que resume todo lo demás:

> **Añadir una materia no debe obligar a tocar código.** Si en algún momento hace
> falta editar un `.py` o un `.js` para dar de alta una asignatura, eso es un fallo
> de diseño de este proyecto, no una tarea de la materia nueva. Anótalo y arréglalo
> ahí, no en la materia.

---

## Antes de empezar: qué se aprendió haciendo Lengua

Los errores de este proyecto no han sido de programación. Han sido siempre de la
misma familia: **un mismo hecho escrito en dos sitios, y los dos sitios separándose
sin que nadie lo notara.** Vale la pena leer la lista antes de repetirla:

| Lo que estaba duplicado | Cómo se rompió |
|---|---|
| Las listas de palabras del validador (Python y JavaScript) | El script marcaba «bienestar» como adverbitis por contener «bien»; la aplicación no. Durante un tiempo la app dio por limpios packs que el script rechazaba, que es justo lo que el SDD §10 prohíbe |
| El banco de verbos, copiado dentro de cada pack | Al escribir el pack argumentativo faltaban ocho verbos que el expositivo sí tenía. Salió por casualidad, porque una prueba estaba cableada al expositivo |
| Las etiquetas de curso y de tipo de tarea | Escritas cuatro veces: `js/ui.js`, `js/main.js`, `scripts/generar_revision.py` y la matriz del SDD |
| La lista de packs | Cableada en `js/main.js` y, en los scripts, deducida de un `glob("data/*.json")` que se tragaba cualquier archivo nuevo |
| El orden de los packs | La auto-prueba del verificador daba por hecho que `criterios[0]` era de 2.º ESO, cosa que solo era cierta por el orden alfabético de los archivos |

Todos esos hechos viven hoy **una sola vez**, en `data/`. Mantenlo así.

---

## Los cinco archivos que se tocan

Y ninguno es código.

### 1. `data/catalogo.json` — dar de alta la materia

```json
"materias": {
  "MAT": {
    "etiqueta": "Matemáticas",
    "etiqueta_corta": "Matemáticas",
    "comunidad": "Región de Murcia",
    "tipos_tarea": {
      "resolucion_problemas": "Resolución de problemas",
      "investigacion": "Investigación matemática"
    }
  }
}
```

Las claves de `tipos_tarea` son las que escribirá el pack en su campo `tipos_tarea`;
los valores son lo que ve el profesor y lo que se busca como fila en la matriz del
SDD §4.3. **No inventes un tipo de tarea que no tenga criterios que lo sostengan en
al menos un curso**: la puerta la abre el criterio, no la costumbre didáctica
(CLAUDE.md, regla 9).

Si la materia usa cursos que aún no existen (Primaria, FP), añádelos a
`cursos.orden` y `cursos.etiquetas`. El orden manda en los desplegables.

### 2. `data/reglas-lexicas.json` — el léxico propio de la materia

```json
"por_materia": {
  "MAT": {
    "etiqueta": "Matemáticas",
    "saberes_prohibidos": { "_nota": "...", "terminos": ["ecuaciones", "fracciones", "..."] },
    "formulas_proceso":   { "_nota": "...", "terminos": ["..."] },
    "generos":            { "_nota": "...", "terminos": [] },
    "posesivos_ajenos":   { "_nota": "...", "su radio": "la circunferencia" },
    "sujetos_ajenos":     { "_nota": "...", "que corta": "la recta" }
  }
}
```

Este es el paso que más se va a querer saltar, y el que más importa.

- **`saberes_prohibidos`** son las cabezas de dimensión que nombran un contenido en
  vez de una acción competencial (CLAUDE.md, regla 5). En Lengua son «sintaxis»,
  «métrica», «Barroco». En Matemáticas serán otras, y las de Lengua no dicen
  absolutamente nada de un pack de Matemáticas. Si dejas la lista vacía, el pack
  **pasará el validador sin estar comprobado**, que es peor que fallar: nadie vuelve
  a mirarlo.
- **`formulas_proceso`** son las fórmulas del propio decreto que sostienen que una
  dimensión evalúa una fase del proceso y no el producto terminado. Se sacan
  leyendo el currículo de la materia, no por analogía con Lengua.
- **`generos`** puede quedar vacío: es una regla estrecha, propia de las materias
  donde el currículo nombra géneros textuales curso a curso.
- **`posesivos_ajenos` y `sujetos_ajenos`** son las dos listas de la proyección a
  1.ª persona (SDD §7.5), y las dos empiezan **vacías**: se llenan leyendo los
  descriptores proyectados del pack, no antes. La primera declara el `su`/`sus` cuyo
  referente **no** es el alumno; la segunda, el «que» + verbo del banco cuyo sujeto
  **no** es el alumno. Las dos son fail-closed: lo que no esté declarado, el
  invariante de `test/proyeccion.mjs` lo para. **El valor de cada entrada es el
  referente y está para leerlo**: si no sabes escribir de quién es ese `su` o quién
  hace ese verbo, no es una excepción, es un descriptor que imprime «él» dentro de
  una frase en «yo» (CLAUDE.md, «Cómo escribir un descriptor»). Los invariantes
  recorren **todos** los packs del catálogo, así que un pack nuevo entra solo: no hay
  ninguna lista de packs que actualizar en el test (SDD §17, decisión 18).

Los dos validadores dan **error** si una materia no está registrada aquí. Está hecho
a propósito.

**Cuidado con las tildes.** Todas las listas van en minúsculas y sin tildes, porque
se comparan contra texto normalizado, **salvo tres**: `comun.formulas_guiadas`, que
la compara `verificar_derivacion.py` sin quitar tildes, y `posesivos_ajenos` y
`sujetos_ajenos`, que se comparan contra el descriptor proyectado tal como está
escrito («su autoría», no «su autoria»). Cada lista lo dice en su `_nota`; léela
antes de añadir un término.

### 3. `fuentes/curriculo/` — el currículo oficial de la materia

En texto, tal cual, sin reescribir. De aquí sale toda cita, y el verificador
comprueba que cada `criterio_oficial.cita` aparece **literalmente**. Si una cita no
casa, la sospecha va primero sobre la cita, nunca sobre la fuente.

Además hay que decir **cómo se recorta el archivo por cursos**, en el bloque
`fuentes` de la materia dentro de `data/catalogo.json`:

```json
"fuentes": {
  "curriculo-MAT-Murcia.md": [
    ["Primer curso", "1ESO"],
    ["Segundo curso", "2ESO"]
  ]
}
```

Son líneas literales del archivo, **en orden**, y solo cuenta su primera aparición.
Sin esto, una cita se comprueba contra el documento entero en vez de contra el curso
al que dice pertenecer, que es exactamente como se coló la cita fabricada de 2.º ESO
(decisión 12 de §17): el género existía en el documento, pero no en ese curso.

### 4. `data/pack-<materia>-<tarea>.json` — el pack

Un pack por tipo de tarea, con la forma que declara `data/esquema-pack.json`. Lo más
rápido es copiar la cabecera de uno existente y vaciar `criterios`.

`verbos` **ya no va dentro del pack**: el banco es compartido
(`data/verbos.json`). Si la materia necesita verbos propios, van en `verbos_extra`
con la misma forma, y **no pueden redefinir uno del banco** — la forma de 1.ª persona
de un verbo no puede depender de qué pack se cargó el último, porque de ella sale la
autoevaluación.

**Si los pesos de un curso no son iguales, el pack declara `razon_peso`**: una frase
que dice qué dimensión pesa más y por qué, escrita para que la lea el alumno, porque
se imprime en su ficha. No es burocracia del validador: el marco teórico fija
ponderación igual por defecto y solo la desiguala con una razón declarada (SDD §6.2).
Un pack de pesos iguales no necesita el campo.

Para redactar los criterios, sigue el protocolo del skill `rubricas-pack`. No lo
repito aquí para no tener dos versiones del mismo procedimiento.

### 5. `data/derivacion-<materia>.json` — las dos tablas de derivación

Una por materia, declarada en `materias.<X>.derivacion` del catálogo. Lleva las dos
tablas que deciden qué se puede generar y cuánto puede exigir cada curso:

```json
"matriz_tareas": {
  "simbolos": {
    "nombrado":  { "simbolo": "●", "significa": "…" },
    "sostenido": { "simbolo": "○", "significa": "…" }
  },
  "celdas": {
    "resolucion_problemas": { "1ESO": "nombrado", "2ESO": "sostenido" }
  }
},
"ejes_progresion": {
  "columnas": [ { "nivel": 1, "cursos": ["1ESO"] }, { "nivel": 2, "cursos": ["2ESO", "3ESO"] } ],
  "ejes": [ { "id": "autonomia", "etiqueta": "Autonomía", "celdas": ["…", "…"] } ]
}
```

- **`matriz_tareas`** es la matriz §4.3. Las claves de `celdas` son las de
  `tipos_tarea` del catálogo, y las de dentro, las de `cursos.orden`. **Un curso
  ausente es celda vacía**, y una celda vacía impide que el pack declare ese curso.
  Recuerda el símbolo: ● es «el género o el saber está nombrado en los saberes del
  curso, además de sostenido por su criterio»; ○ es «sostenido por el criterio, pero
  no nombrado en los saberes». **○ no vacía la celda.** Lo único que vacía una celda
  es que no haya criterio de evaluación que la abra.
- **`ejes_progresion`** es la tabla §5.4: el nivel máximo que puede alcanzar el campo
  `progresion` de un criterio en cada curso. Los cursos que no aparezcan en ninguna
  columna quedan fuera de la comprobación y producen aviso. Si un eje no tiene peldaño
  propio en una columna, su celda se escribe
  `{ "mismo_nivel_que": "4ESO", "porque": "…" }` y sus cursos heredan ese nivel: es
  como se dice que dos cursos comparten techo **sin** igualar los tres ejes por
  uniformidad, que fue el error corregido el 2026-08-05.

**Las tablas del SDD salen de aquí, no al revés.** Se escriben con
`python scripts/generar_tablas_sdd.py` y `comprobar_todo.py` falla si el SDD se ha
separado del JSON. Lo que sí se escribe a mano en el SDD, y hay que escribir, es la
prosa de al lado: **la cita que sostiene cada celda discutible**. El JSON guarda el
dato; el SDD guarda por qué el dato es ese.

---

## Después: la orden única

```bash
python scripts/comprobar_todo.py
```

Doce comprobaciones, en el orden en que conviene leerlas. Las primeras son las que
fallan cuando algo está mal escrito o cuando un archivo generado se ha quedado atrás;
las últimas, cuando algo está mal derivado. **No cierres un pack con ninguna en rojo,
ni con ninguna saltada.**

Si hace falta ver solo lo que no depende de `fuentes/`:

```bash
python scripts/comprobar_todo.py --rapido
```

Y para regenerar los derivados, que nunca se editan a mano —los documentos de
revisión del docente y las dos tablas del SDD—:

```bash
python scripts/generar_revision.py
```

```bash
python scripts/generar_tablas_sdd.py
```

---

## El error que no detecta ninguna comprobación

Conviene decirlo claro, porque es el único que ha llegado al docente.

Las doce comprobaciones verifican que **lo que afirmas está en la fuente**. No
pueden verificar que **has elegido bien qué afirmar**. Una cita literal de un
criterio que no sostiene lo que dices que sostiene pasa todas las pruebas.

Contra eso solo hay dos cosas, y las dos son de método:

1. **Simular una corrección** con `scripts/simular_correccion.py` antes de dar por
   buena una matriz cuantitativa. Leerla no basta: la regla del doble castigo se
   descubrió calculando, no leyendo.
2. **Comprobar la regla en todos los cursos a la vez.** Si una regla de derivación
   nueva invalida un pack ya validado, **la rota es la regla, no el pack**
   (CLAUDE.md, regla 9). Esa regla se escribió después de que su ausencia produjera
   el único error de derivación que llegó al docente, y la corrección tuvo que
   hacerse dos veces porque la primera se aplicó de forma asimétrica.

---

## Deuda conocida

Se anota aquí para que quien añada la segunda materia sepa con qué se va a topar,
en vez de descubrirlo:

- ~~**La matriz §4.3 y la tabla §5.4 se leen del SDD parseando markdown.**~~
  **Saldada el 2026-08-07** (SDD v1.21), antes de que llegara la segunda materia:
  cada una lleva las suyas en `data/derivacion-<materia>.json` y las tablas del SDD
  son derivados comprobados, como los documentos de revisión. Queda como aviso de lo
  que pasa cuando no se salda: el parseo funcionaba, pero daba por hecho que había
  una sola matriz y que sus filas se buscaban por la etiqueta que ve el profesor.
- **2.º de Bachillerato queda fuera de la tabla §5.4** (decisión abierta §17.11):
  produce aviso, no error. Cualquier materia que llegue a 2.º Bach heredará ese
  aviso hasta que se cierre la decisión.
