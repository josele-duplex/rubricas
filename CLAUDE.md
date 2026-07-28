# Proyecto · Generador de instrumentos de evaluación (rúbricas LOMLOE)

Aplicación web para que el profesorado de Lengua Castellana y Literatura construya rúbricas
derivadas del currículo oficial de la Región de Murcia, con la hoja del alumno incluida.
Este archivo recoge las **reglas no negociables**. El diseño completo vive en `docs/diseno/SDD.md`.

> **Antes de tocar contenido curricular, lee `docs/diseno/SDD.md`.** Es la única fuente de verdad
> sobre el modelo de datos, el modelo de calificación y las reglas del validador. Este archivo
> solo recoge lo que no se puede negociar y lo que se ha aprendido a base de equivocarse.

---

## Reglas no negociables

### 1. Las rúbricas se derivan, no se inventan

Todo criterio lleva `criterio_oficial` con la cita textual del currículo. Un criterio sin
referencia normativa no se carga: no es un instrumento, es una opinión con formato de tabla.
Si hace falta evaluar algo que no está en ningún criterio, la respuesta no es inventarlo,
es buscar el criterio que sí lo sostiene.

### 2. La progresión entre cursos la fija el currículo, no el diseñador

Lo que separa 1.º de 3.º de ESO ya está escrito en la redacción del criterio oficial:
*sencillos* y *de manera guiada* frente a *de cierta extensión* y *progresivamente autónoma*.
No se calibra afinando vocabulario ni subiendo verbos de nivel en una taxonomía.
**El verbo lo pone el criterio; lo que escala es la condición que lo acompaña.**

Corolario: los criterios son **por curso**, nunca por ciclo. El decreto de Murcia los redacta
curso a curso y el 5.1 de 1.º no es el 5.1 de 2.º.

### 3. Cuatro niveles, siempre

Escala fija. No es configurable. Bandas de conversión sobre 10 (confirmadas por dos fuentes
independientes): 9–10 · 7–8,9 · 5–6,9 · 0–4,9.

### 4. Cero adverbitis

Todo descriptor empieza por un verbo del banco cerrado del pack. Nada de *bien*, *adecuadamente*,
*a veces*, *bastante*. El nivel 1 describe **lo que el alumno sí hace de forma limitada**,
nunca lo que le falta: «Utiliza conectores de adición», no «No usa conectores».

### 5. Los saberes son vehículo, nunca fila

La dimensión es una acción competencial, no un contenido. «Cohesión: conectores y puntuación»,
no «Las oraciones subordinadas». El contenido va dentro del descriptor, como contexto.

### 6. La hoja del alumno no es opcional

Si el proyecto sostiene que el alumnado debe conocer la rúbrica antes de la prueba, la aplicación
la genera siempre. No es una casilla que el profesor pueda olvidar marcar.

### 7. Una penalización no puede medir lo que ya mide un componente

Regla del **doble castigo**. Si el componente ya valora los errores de puntuación, no puede
haber además una penalización por párrafo sin puntos: el alumno paga dos veces y la nota no
aguanta una reclamación. En la práctica esto deja las matrices casi sin penalizaciones,
y eso es buena señal.

### 8. Ninguna llamada a IA desde la aplicación

La app genera el texto de la rúbrica en modo IA para que el profesor lo use fuera si quiere.
No ejecuta prompts, no pide claves, no envía nada. Sin servidor, sin cuentas, sin datos personales.

---

## Método de trabajo

- **Toda matriz cuantitativa nueva se prueba simulando una corrección** antes de darla por buena
  (`scripts/simular_correccion.py`). Leerla no basta: la regla del doble castigo se descubrió
  calculando, no leyendo. Si una dimensión cae dos niveles de golpe, sospecha de las penalizaciones.
- **Todo pack pasa el validador antes de darse por cerrado** (`scripts/validar_pack.py`).
- **El JSON es la fuente; los documentos de revisión son derivados.** `docs/revision-*.md` se
  regenera con `scripts/generar_revision.py`, nunca se edita a mano.
- **Los criterios oficiales se citan del texto real**, leyéndolo en `fuentes/curriculo/`.
  Nunca de memoria ni parafraseados.
- **Cuando el usuario corrija un planteamiento, revisar si el error está en más sitios.**
  La regla de coherencia vertical estuvo mal formulada dos veces seguidas antes de acertar.

## Cómo escribir un descriptor

```
[verbo del banco] + [objeto o saber-vehículo] + [condición o finalidad comunicativa]
```

Ejemplo: *«Emplea conectores de causa, consecuencia y ejemplificación, y sustituye las
repeticiones mediante sinónimos, hiperónimos y pronombres.»*

El banco guarda cada verbo en 3.ª y en 1.ª persona (`Reconoce`/`Reconozco`), lo que permite
derivar la versión de autoevaluación sin errores de morfología.

---

## Relación con el proyecto de Lengua

`C:\Users\Usuario\Proyectos\proyecto_plan_de_trabajo_lengua` es el plan de trabajo del docente.
Análisis completo de puntos de contacto en `docs/diseno/enlace-proyecto-lengua.md`.

**Aviso importante:** el marco teórico vigente vive **allí**
(`documentos_base/marco_teorico_rubricas-LOMLOE.md`), no aquí. La copia de este proyecto
(`docs/marco/...ANTIGUO.md`) está superada y se conserva solo como referencia histórica.
El marco vigente corrige el alcance a 1.º ESO – 1.º BACH, fija las bandas sobre 10 e impone
un guardarraíl de terminología (`sintagma`, `construcciones`, `periféricos`).

Nunca se modifican archivos del proyecto de Lengua desde aquí.

---

## Estructura

```
data/            packs de criterios (.json) — la fuente de todo el contenido
scripts/         validador, generador de revisiones, simulador de corrección
docs/diseno/     SDD y análisis de enlace
docs/marco/      marco teórico y matrices de referencia
docs/            documentos de revisión generados y resúmenes para el docente
fuentes/         currículo oficial y originales aportados (material crudo)
```

## Decisiones pendientes

Están al final del SDD (§17). Las dos que bloquean la alineación con el proyecto de Lengua:
dónde vive el marco teórico, y qué hace la app frente al skill `rubricas-lomloe`
(hoy se solapan en la conversión a 10 y en la exportación a iDoceo).
