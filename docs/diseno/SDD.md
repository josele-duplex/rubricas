# Documento de Diseño de Software (SDD)

## Generador de Instrumentos de Evaluación — Lengua Castellana y Literatura (LOMLOE)

**Versión 1.2** · Documento de trabajo · Julio 2026
Autor: Josele · Diseño técnico: Claude

---

## 0. Registro de cambios

| Versión | Cambios |
|---|---|
| 0.1 | Alcance de tipos de tarea, arquitectura sin backend/sin IA, motor de reglas, exportación a Word, roadmap por fases. |
| 0.2 | Doble salida por tarea (rúbrica estándar + modo IA). Exportación a Excel (.xlsx) compatible con iDoceo. Marco LOMLOE y matrices cuantitativas como fuente de criterios. |
| 0.3 | Constructor guiado: dimensiones por checkboxes, profundidad, pesos visuales y 5 instrumentos generables. |
| 0.4 | Fusión de profundidad con "tiempo disponible para corregir". Campo libre de actividad, guardar/cargar en localStorage, criterios obligatorios, barra de reparto de pesos, indicador de complejidad. Biblioteca organizada por bloques LOMLOE (A-D). |
| **1.2** | Se cierran las reglas exactas de §6.2 y §6.3, hasta ahora escritas en prosa con ambigüedades reales de implementación. **Una dimensión con matriz aporta a la nota sus puntos continuos, no el valor de su nivel**, y las bandas de §6.4 sirven para mostrar y para comprobar la condición mínima, no para calcular: lo confirman `Rúbricas documentación.md` y `scripts/simular_correccion.py`, y lo exige el hecho de que colapsar puntos a nivel haría que una décima valiese 2,5 puntos de nota en el corte del 9. Además: las penalizaciones aplicadas son negativas y **se suman**; la puntuación de una dimensión nunca baja de 0; la condición mínima es un techo no acumulativo que no actúa sin criterios obligatorios en el instrumento; **el detractor global se aplica antes que ese techo**, porque el orden entre ambos cambia la nota; las bandas se cierran por umbrales (`>=9`, `>=7`, `>=5`) para no dejar hueco entre "8,9" y "9,0"; y se fija la regla de redondeo con su alcance real. Se documenta el invariante `total = 10`, todavía sin comprobar en el validador, y la discrepancia de escala entre §6.2 y el simulador. Se añade §6.5, que separa el cálculo (implementable ya, como funciones puras) de la pantalla de entrada de resultados por alumno, que no existe. Las tres decisiones de producto pendientes (§17.1-§17.3) se implementan con el valor que el propio SDD proponía por defecto, sin darlas por cerradas. |
| **1.1** | Se ajusta el roadmap a lo que hay construido: la fase 1 queda cerrada y la fase 2 se abre por piezas con su estado real (§16.1), contrastado con el código en vez de con la intención. Se añade la publicación como decisión abierta (§17.9). El proyecto pasa a repositorio con `README.md` y validación automática en cada empujón. |
| **1.0** | El validador de §10 pasa a estar completo **dentro de la aplicación** (`js/validador.js`), con las quince reglas y en paridad comprobada con `scripts/validar_pack.py`: la app no puede dar por limpio lo que el script rechaza. La regla de **modalizadores del criterio** se reformula en dos direcciones (ayuda declarada que no aparece en la rúbrica; andamiaje que sobrevive a la autonomía) y se descartan las familias de sencillez y extensión, que marcaban criterios correctos (§10, nota). Cada regla lleva su microexplicación y el panel de salud del pack agrupa por regla. Las microexplicaciones de §11.3 se centralizan en `js/microexplicaciones.js` y cubren todos los controles del modo exprés, la vista previa y el modo avanzado. |
| **0.9** | Se sustituye `evidencias_observables` por `matriz_cuantitativa` (§5.2, §7.8): cada componente de una dimensión pasa a tener puntos exactos por banda, con penalizaciones contables propias del componente. Es la pieza que faltaba para que el modo IA (7.8) corrija con precisión y no por impresión. Fuente: `Rúbricas documentación.md`, matrices de coherencia y cohesión del texto argumentativo. Se reescribe §6.2 para separar los dos mecanismos de descuento, que hasta ahora chocaban. |
| 0.8 | Se retira del validador toda comparación basada en el nivel cognitivo del verbo: producía falsos positivos y partía de una premisa equivocada. La progresión entre cursos la fija la redacción del criterio oficial, no el diseñador. Entra la regla de **modalizadores del criterio** y se rebaja la comparación entre cursos a detector de copiar y pegar (§10). Se explicita en §11.2 la libertad de reparto de pesos. |
| 0.7 | Primera corrección de la regla de coherencia vertical del validador tras contrastarla con el primer pack. Superada por la 0.8. |
| 0.6 | **Se incorpora 1.º de ESO y, con él, una corrección de fondo: el currículo de Murcia fija criterios curso a curso, no por ciclo.** El campo `tramo` se sustituye por `curso` (seis cursos), con herencia de descriptores entre cursos cuyo criterio oficial coincide. Se añade la matriz de tipos de tarea aplicables por curso (§4.3), porque no toda tarea existe en todo curso. Los ejes de progresión se extienden hacia abajo hasta 1.º de ESO, que el marco teórico no cubría. |
| 0.5 | **Se cierra la cuestión del alumno: no hay versión de alumno como aplicación; el canal es el profesor.** Se elimina cualquier login, correo o dato personal. Se incorpora el `Marco_Teorico_Rubricas_LOMLOE.md` como fuente normativa del diseño: trazabilidad curricular obligatoria, banco cerrado de verbos, ejes de progresión vertical, validador de calidad de descriptores y puerta de aplicabilidad. Se define por primera vez el **modelo de calificación**. Se añaden dos instrumentos (ficha del alumno con guion de clase, escala de estimación analítica) y se reestructura `variante_ia` como proyección en lugar de contenido paralelo. Alcance v1 restringido a LCL. |

---

## 1. Resumen ejecutivo

La aplicación es un **constructor de instrumentos de evaluación** para profesorado de Lengua Castellana y Literatura de ESO y Bachillerato. No es un repositorio de rúbricas hechas: el profesor declara qué tarea va a evaluar, en qué curso y de cuánto tiempo de corrección dispone, y la app ensambla los instrumentos a partir de una biblioteca de criterios derivados del currículo oficial vigente en la Región de Murcia.

Tres rasgos la definen frente a lo que ya existe:

1. **Deriva, no inventa.** Cada dimensión de cada rúbrica lleva detrás un criterio de evaluación oficial citable. Sin esa trazabilidad, una fila de rúbrica no es un instrumento: es una opinión del profesor con formato de tabla.
2. **Enseña mientras se usa.** El objetivo del proyecto no es que existan más rúbricas, sino que profesores y alumnos sepan usarlas. La app incorpora un validador de calidad de descriptores y microexplicaciones en el punto exacto en que el profesor toma cada decisión.
3. **La transparencia es una salida, no una recomendación.** Toda rúbrica genera automáticamente su ficha del alumno y un guion de presentación en clase. La entrega de la rúbrica antes de la prueba deja de depender de que el profesor se acuerde.

Es una aplicación estática: sin servidor, sin cuentas, sin datos personales, sin llamadas a ninguna API de inteligencia artificial.

---

## 2. Decisiones de producto cerradas

Estas decisiones están tomadas y el resto del documento las presupone.

### 2.1 No hay "versión de alumno" como aplicación

El canal de distribución de la rúbrica es **el profesor**, que la entrega y la explica en clase antes de la prueba. La app produce el material que el profesor reparte; no produce una aplicación paralela donde el alumno entre.

Consecuencias, todas favorables:

- **No hay login, ni correo, ni cuentas, ni roles.** Un login validado en el navegador no es seguridad, es decoración: cualquier alumno lo salta abriendo el inspector.
- **No hay tratamiento de datos personales de menores**, con lo que la app queda fuera del ámbito de obligaciones de RGPD que arrastraría pedir correos en un centro educativo.
- **No hay nada que ocultar.** El proyecto sostiene que el alumnado debe conocer la rúbrica *antes* de la tarea (Marco Teórico §7.1, Sanmartí). Poner una puerta a las rúbricas contradiría la tesis del propio proyecto.

### 2.2 Una sola materia en la v1

Solo Lengua Castellana y Literatura. El esquema de datos es agnóstico de materia desde el primer día (campo `materia` en cada pack), porque añadirlo ahora cuesta cero y añadirlo después obliga a reescribir el motor; pero no se redacta contenido de ninguna otra materia en la v1.

### 2.3 La app no llama a ninguna IA

La app genera el texto de una rúbrica preparada para que una IA evalúe con ella, y ese texto se copia o se exporta. La app no ejecuta el prompt, no pide claves de API, no envía nada a ningún servidor. Ver §14 para el protocolo de uso.

### 2.4 Prioridad: prototipo funcional pronto

Ante la duda entre alcance y velocidad, gana la velocidad, con una excepción: la calidad de los descriptores no se sacrifica. Es preferible un prototipo con tres tipos de tarea bien redactados que uno con doce redactados a medias.

---

## 3. Principios de diseño heredados del marco teórico

Todo el diseño técnico que sigue está subordinado a estos principios, tomados de `Marco_Teorico_Rubricas_LOMLOE.md`. Se indica entre paréntesis el apartado de origen y, en negrita, la consecuencia técnica concreta.

| Principio | Consecuencia técnica |
|---|---|
| Las rúbricas se derivan de criterios oficiales, no se inventan (§1.2) | **Campo `criterio_oficial` obligatorio en cada criterio.** Un criterio sin referencia normativa no supera la validación del pack y no se carga. |
| Los saberes básicos son vehículo, nunca fila (§2.2) | **Campo `saber_vehiculo` separado de `dimension`.** El validador rechaza nombres de dimensión que sean un contenido ("las subordinadas") en lugar de una acción competencial. |
| Cuatro niveles, nunca tres ni cinco (§2.1) | Escala fija de 4 niveles en todo el sistema. No es configurable. |
| Cero adverbitis; verbo observable + objeto + condición (§3, §9) | **Banco cerrado de verbos** (§5.3) y validador que bloquea calificadores vagos. |
| Gradación positiva incluso en el nivel bajo (§9) | El validador marca todo descriptor de nivel 1 que empiece por negación ("No utiliza…"). |
| La exigencia escala por tres ejes a lo largo de la etapa (§8) | **Campo `progresion`** con la posición del criterio en los ejes de autonomía, complejidad y metalingüístico, extendidos hasta 1.º de ESO (§5.4). |
| Los criterios de evaluación son los del curso, y el decreto los redacta curso a curso | **Campo `curso`**, no ciclo, y matriz de tareas aplicables por curso (§4.3). |
| La rúbrica no sirve para todo (§5) | **Puerta de aplicabilidad** (§8 de este documento) antes de generar nada. |
| Transparencia: la rúbrica se entrega y se analiza antes (§7.1) | Ficha del alumno y guion de clase son salidas obligatorias, no opcionales. |
| Sostenibilidad: más de 5 dimensiones solo en productos finales (§7.2) | Indicador de complejidad y aviso activo al superar 5 dimensiones. |
| Ponderación: el número solo cuando la administración lo exige (§7.3) | **Modo cualitativo**: la app puede generar instrumentos sin conversión numérica. |
| Autoevaluación en lenguaje de "yo" (§7.4) | Derivación exacta a primera persona vía banco de verbos (§5.3). |

---

## 4. Alcance

### 4.1 Dentro de la versión 1

- Puerta de aplicabilidad: la app decide si la rúbrica es el instrumento adecuado.
- Modo exprés (tres decisiones) como entrada por defecto, y modo avanzado detrás.
- Tipos de tarea de la v1: **texto argumentativo, texto expositivo, exposición oral y narración**, cada uno en los cursos en que el currículo lo sostiene (§4.3).
- Seis cursos: **1.º, 2.º, 3.º y 4.º de ESO, 1.º y 2.º de Bachillerato**.
- Siete instrumentos generables (§7).
- Validador de calidad de descriptores (§10).
- Modelo de calificación con modo cualitativo y modo numérico (§6).
- Exportación a `.xlsx` compatible con iDoceo, impresión/PDF, y configuración en archivo `.json`.
- Motor 100% local, sitio estático.

### 4.2 Fuera de la versión 1

- Cualquier otra materia distinta de LCL.
- Cualquier llamada de la app a una API de IA.
- Enlace compartible y código QR de la rúbrica (queda como extra posterior; el canal v1 es el papel y la proyección).
- Recogida de autoevaluaciones del alumnado (implicaría servidor y datos de menores).
- Versión adaptada a NEAE.
- Banco de criterios favoritos y calculadora de carga de corrección.

### 4.3 Matriz de tipos de tarea por curso

El currículo no sostiene todas las tareas en todos los cursos. Producir una rúbrica de texto argumentativo para 1.º de ESO sería inventar un criterio inexistente, precisamente lo que el marco teórico proscribe. La matriz es **dispersa**, y eso abarata el contenido: seis cursos no significan seis veces el trabajo.

| Tipo de tarea | 1.º ESO | 2.º ESO | 3.º ESO | 4.º ESO | 1.º Bach | 2.º Bach |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Narración | ● | ● | ○ | | | |
| Texto expositivo | ● | ● | ● | ● | ● | ● |
| Exposición oral | ● | ● | ● | ● | ● | ● |
| Texto argumentativo | | ○ | ● | ● | ● | ● |

● tarea plenamente sostenida por los criterios del curso · ○ presente de forma incipiente o guiada

La aplicación **no ofrece** un tipo de tarea en un curso donde la matriz esté vacía. Si el profesor lo busca, la app explica qué dice el currículo de ese curso y le propone la tarea equivalente que sí procede. Es otra forma del mismo principio de la puerta de aplicabilidad (§8): la herramienta educa sobre el currículo en lugar de dejar que el profesor se salte lo que no conoce.

---

## 5. Modelo de datos

### 5.1 Pack de criterios

La unidad de distribución del contenido es el **pack**, un `.json` versionado. Separar el contenido del código permite corregir descriptores o adaptarse a un cambio normativo sin tocar la aplicación.

```json
{
  "pack_id": "lcl-murcia-eso-bach",
  "materia": "LCL",
  "etiqueta": "Lengua Castellana y Literatura — Región de Murcia",
  "version": "1.0.0",
  "normativa": {
    "estatal": ["RD 217/2022 (ESO)", "RD 243/2022 (Bachillerato)"],
    "autonomica": "Decreto de currículo de la Región de Murcia (BORM, diciembre 2022)",
    "vigencia_desde": "2022-2023",
    "revisado": "2026-07"
  },
  "verbos": [ ... ],
  "criterios": [ ... ]
}
```

El campo `normativa` no es decorativo: los decretos se modifican, y un pack sin declaración de vigencia se convierte en una rúbrica desactualizada que nadie sabe que lo está.

### 5.2 Criterio

```json
{
  "id": "lcl-b-cohesion-3eso",
  "bloque_lomloe": "B",
  "dimension": "cohesion",
  "nombre": "Cohesión: conectores y puntuación",
  "curso": "3ESO",
  "hereda_de": null,

  "criterio_oficial": {
    "competencia_especifica": 5,
    "codigo": "5.2",
    "cita": "Producir textos escritos y multimodales coherentes, cohesionados, adecuados y correctos...",
    "perfil_salida": ["CCL1", "CCL3", "CCL5"]
  },

  "saber_vehiculo": ["texto argumentativo", "marcadores discursivos"],

  "progresion": { "autonomia": 2, "complejidad": 2, "metalinguistico": 1 },

  "tipos_tarea": ["argumentativo", "expositivo"],
  "obligatorio": false,
  "prioridad": 1,
  "peso_base": 20,

  "descriptores": {
    "n1": { "verbo": "utiliza", "texto": "Utiliza conectores de adición de forma repetitiva, lo que produce saltos entre las ideas del texto." },
    "n2": { "verbo": "utiliza", "texto": "Utiliza conectores básicos de causa y oposición para enlazar las ideas principales del texto." },
    "n3": { "verbo": "emplea", "texto": "Emplea conectores de causa, consecuencia y oposición, y delimita con la puntuación los incisos de cada argumento." },
    "n4": { "verbo": "articula", "texto": "Articula la lógica argumentativa mediante marcadores del discurso variados y sostiene la cohesión con anáforas sin ambigüedad." }
  },

  "matriz_cuantitativa": {
    "total": 10,
    "componentes": [
      {
        "nombre": "Variedad y uso de conectores",
        "max": 3,
        "bandas": [
          { "puntos": 3, "condicion": "Emplea 4 o más tipos distintos de marcador (oposición, consecuencia, ordenación, reformulación)" },
          { "puntos": 2, "condicion": "Emplea 2 o 3 tipos de conector" },
          { "puntos": 1, "condicion": "Se limita a conectores de adición (y, también) o repite el mismo marcador" },
          { "puntos": 0, "condicion": "No hay nexos entre oraciones ni entre párrafos" }
        ]
      },
      {
        "nombre": "Referencia y anáforas",
        "max": 2,
        "bandas": [
          { "puntos": 2, "condicion": "Ninguna anáfora ambigua: el referente de cada pronombre es recuperable" },
          { "puntos": 1, "condicion": "1 o 2 anáforas ambiguas" },
          { "puntos": 0, "condicion": "Repite el sustantivo en lugar de sustituirlo" }
        ]
      }
    ],
    "penalizaciones": [
      { "clave": "anafora_ambigua", "puntos": -0.5, "por": "cada anáfora sin referente recuperable", "tope": -1.5 }
    ]
  },

  "descriptor_cotejo": null,
  "descriptor_un_punto": null
}
```

**Notas sobre campos concretos:**

- `curso` es un curso concreto, no un ciclo. Los criterios de evaluación del decreto de Murcia están redactados curso a curso: el 5.1 de 1.º de ESO y el 5.1 de 2.º de ESO son textos distintos con exigencias distintas. Agrupar por ciclos haría imposible la cita exacta que exige `criterio_oficial`, así que la unidad es el curso.
- `hereda_de` evita que el curso a curso multiplique el trabajo de redacción. Cuando el criterio oficial de dos cursos consecutivos es equivalente, el criterio del curso superior apunta al inferior y solo sobrescribe los descriptores que cambian. La cita oficial, en cambio, **nunca se hereda**: siempre es la del curso propio.
- `criterio_oficial` es obligatorio. Es lo que permite defender el instrumento ante una reclamación o ante inspección, y es la regla que distingue este proyecto de un generador de tablas bonitas.
- `progresion` sitúa el criterio en los tres ejes del Marco Teórico §8, con valores 1 a 4 (§5.4). Sirve para dos cosas: verificar que el mismo criterio en 1.º de ESO y en Bachillerato no está redactado igual, y avisar cuando una rúbrica mezcla criterios de exigencia incoherente.
- `matriz_cuantitativa` es la pieza que permite corregir con precisión, y muy especialmente con IA. Descompone la dimensión en **componentes con puntos exactos** y bandas contables, más penalizaciones propias del componente. Sustituye a la antigua `variante_ia` de la versión 0.4 sin recuperar su defecto: aquella era una redacción paralela de los descriptores, con dos árboles de contenido que se desincronizaban; esta no redacta nada nuevo, solo **cuantifica** los mismos descriptores. Sigue habiendo una sola fuente de verdad.
- La matriz es **opcional por dimensión**. Tiene sentido donde hay algo que contar (conectores, anáforas, argumentos, fuentes) y no lo tiene donde el juicio es necesariamente global. Una dimensión sin matriz se corrige por nivel, como siempre; sencillamente no estará disponible para corrección asistida con la misma precisión, y la app lo advierte.
- **La matriz nunca sustituye al descriptor cualitativo.** Es su traducción operativa. Si al aplicar la matriz sale un nivel distinto del que el profesor habría puesto leyendo el descriptor, el problema está en la matriz y hay que ajustarla, no al revés. Esto es la regla del marco teórico: el descriptor manda, el número es su traducción.
- `descriptor_cotejo` y `descriptor_un_punto` valen `null` por defecto y se derivan del nivel 2 (§7.2). Solo se rellenan cuando la derivación automática no produzca una frase natural.

### 5.3 Banco cerrado de verbos

Todo descriptor debe empezar por un verbo del banco. La restricción parece severa y es, en realidad, la pieza que sostiene tres funciones a la vez:

1. **Valida** la ausencia de adverbitis: si el descriptor no arranca con verbo observable del banco, no pasa.
2. **Escala verticalmente**: el nivel cognitivo del verbo debe ser coherente con el curso y con `progresion` (§5.4).
3. **Deriva la primera persona sin errores**: el banco guarda las dos formas, con lo que la versión de autoevaluación es exacta y no depende de transformar morfología en tiempo de ejecución (que en español falla con los irregulares: *reconoce → reconozco*, *traduce → traduzco*).

```json
{ "id": "justifica", "3s": "Justifica", "1s": "Justifico", "nivel_cognitivo": 4 }
```

| Nivel cognitivo | Verbos (3.ª persona / 1.ª persona) |
|---|---|
| 1 — Recuerdo, localización | Localiza/Localizo · Identifica/Identifico · Enumera/Enumero · Reconoce/**Reconozco** |
| 2 — Comprensión | Explica/Explico · Resume/Resumo · Relaciona/Relaciono · Parafrasea/Parafraseo |
| 3 — Aplicación | Utiliza/Utilizo · Aplica/Aplico · Redacta/Redacto · Estructura/Estructuro · Emplea/Empleo |
| 4 — Análisis | Analiza/Analizo · Diferencia/Diferencio · Justifica/Justifico · Contrasta/Contrasto · Articula/Articulo |
| 5 — Síntesis, creación | Reelabora/Reelaboro · Transforma/Transformo · Recrea/Recreo · Integra/Integro |
| 6 — Evaluación, metacognición | Argumenta/Argumento · Valora/Valoro · Revisa/Reviso · Enmienda/Enmiendo |

El banco es ampliable dentro del pack, nunca desde la interfaz.

### 5.4 Ejes de progresión, extendidos a 1.º de ESO

El Marco Teórico §8 define el escalado vertical desde 2.º de ESO. Al incorporar 1.º, el eje necesita un peldaño más por debajo, que el propio currículo proporciona: los criterios de 1.º están redactados con las fórmulas *"de manera guiada"*, *"con ayuda de pautas y modelos"* y *"sencillos"*. Ese es el nivel 1 de cada eje.

| Eje | 1 — 1.º ESO | 2 — 2.º/3.º ESO | 3 — 4.º ESO / 1.º Bach | 4 — 2.º Bach |
|---|---|---|---|---|
| **Autonomía** | Tarea guiada con pauta y modelo a la vista | Tarea acompañada, con modelo retirado en la revisión | Planificación autónoma con revisión entre iguales | Planificación y autorregulación completas |
| **Complejidad textual** | Texto sencillo, un solo propósito, estructura dada | Texto de estructura propia, un propósito dominante | Texto con matización y contraargumento | Texto híbrido, gestión de la refutación |
| **Metalingüístico** | Detección guiada del fenómeno sobre el modelo | Detección autónoma en el propio borrador | Justificación de la elección lingüística | Justificación teórica y estilística autónoma |

Al redactar los descriptores de un criterio, el nivel cognitivo del verbo (§5.3) debe ser coherente con la posición del criterio en estos ejes. Un descriptor de 1.º de ESO que arranque con *Argumenta* o *Valora* (niveles cognitivos 6) es una señal de que la exigencia se ha colado desde arriba.

### 5.5 Configuración del profesor

Lo que el profesor construye en una sesión. Se guarda en `localStorage` y se puede exportar como archivo `.json` (imprescindible: sin exportación, cambiar de ordenador significa perderlo todo).

```json
{
  "esquema": "config-1",
  "tipo_tarea": "argumentativo",
  "curso": "3ESO",
  "actividad": "Artículo de opinión sobre el uso del móvil en el centro",
  "tiempo_correccion": "2-5min",
  "criterios": [ { "id": "lcl-b-cohesion-3eso", "peso": 20 } ],
  "instrumentos": ["rubrica_analitica", "ficha_alumno", "cotejo"],
  "calificacion": { "modo": "numerico", "escala": "equilibrada", "obligatorios_limitan": false }
}
```

---

## 6. Modelo de calificación

Ausente por completo en la versión 0.4 y necesario: una calificación tiene que poder explicarse a una familia y sostenerse en una reclamación.

### 6.1 Modo cualitativo (por defecto en tareas de proceso)

No se produce ningún número. El instrumento devuelve el nivel alcanzado en cada dimensión y el texto del descriptor correspondiente. Es lo que el Marco Teórico §7.3 llama principio de ponderación: el número solo cuando la administración lo exige.

### 6.2 Modo numérico

**Valor de cada nivel**, con dos escalas seleccionables:

| Escala | N1 En desarrollo | N2 Conseguido | N3 Avanzado | N4 Excelente |
|---|---|---|---|---|
| **Equilibrada** (por defecto) | 2,5 | 5 | 7,5 | 10 |
| **Exigente** | 0 | 5 | 7,5 | 10 |

La escala equilibrada evita que un alumno que ha producido algo, aunque flojo, obtenga un cero en una dimensión; la exigente reserva el cero para el trabajo no realizado o ininteligible. La elección se declara en la ficha del alumno, no se oculta.

**Cálculo:** nota = Σ (valor_nivel_i × peso_i) / 100. Los pesos se normalizan siempre a 100 antes de calcular. Redondeo a la centésima en el cálculo interno y presentación con dos decimales; la conversión a nota entera de acta la hace el profesor según los criterios de su centro, no la app.

**Qué es exactamente `valor_nivel_i`, porque la fórmula sola no lo dice.** Toda dimensión aporta a la suma un número de 0 a 10, pero ese número se obtiene de dos maneras según cómo se haya corregido la dimensión:

| Cómo se corrige la dimensión | Qué entra en la suma |
|---|---|
| **Con `matriz_cuantitativa`** | Sus **puntos brutos** (0–10), tal cual: la suma de componentes menos las penalizaciones (§6.3) |
| **Sin matriz**, eligiendo nivel por descriptor | El **valor del nivel** según la escala de la tabla de arriba (2,5 / 5 / 7,5 / 10) |

Y **las bandas de §6.4 no intervienen en el cálculo de la nota**: traducen un número de 0 a 10 al nombre de su nivel, que es lo que ve el alumno en la rúbrica y lo que necesita la condición mínima para saber si un criterio obligatorio está en N1. La nota se calcula con el número; el nivel es su etiqueta.

Esto es lo que sostienen las dos fuentes del modelo, y conviene dejarlo escrito porque la primera redacción de esta sección afirmó lo contrario. `Rúbricas documentación.md` reparte los diez puntos por dimensión —«Adecuación 25% → 2,5 pts; Coherencia 30% → 3,0 pts»—, que es exactamente `puntos × peso / 100` sobre la puntuación continua; y `scripts/simular_correccion.py`, que es la implementación de referencia con la que se prueba toda matriz nueva (§15), hace `aporta = puntos * peso / 100` desde antes de que esta sección existiera.

**Por qué importa, más allá de la fidelidad a las fuentes.** Si los puntos de una matriz se colapsaran a su nivel antes de ponderar, un alumno con 8,9 aportaría 7,5 y otro con 9,0 aportaría 10: **una décima de desempeño valdría 2,5 puntos de nota**. Un escalón así es indefendible en una reclamación, y este modelo existe precisamente para sostenerse en una (§6, primera línea). Con puntos continuos, 8,9 aporta 8,9 y la matriz conserva la precisión que justifica su existencia (§5.2).

**Redondeo.** Se define `redondear2(x) = Math.round((x + Number.EPSILON) * 100) / 100`: mitad hacia
arriba, no *banker's rounding*. El `Number.EPSILON` corrige los casos en que el número decimal no
tiene representación binaria exacta y cae un pelo por debajo del medio — `1.005 * 100` da
`100.49999999999999`, que sin la corrección redondea a 1,00 en vez de a 1,01.

No es una defensa completa y conviene no venderla como tal: `8.995` se almacena como `8.99499…`, un
error mayor que `EPSILON`, y sigue redondeando a 8,99. Se acepta, porque para que eso importe haría
falta un tercer decimal que estas matrices no producen: las bandas del pack puntúan con enteros y
medios puntos, y las penalizaciones también, así que las sumas caen en valores exactos en binario.
El `EPSILON` está por lo que pueda venir en packs futuros, no por lo que hay hoy.

Se aplica en dos momentos, y solo en esos dos:

1. A la puntuación de cada dimensión, **antes** de ponderarla y antes de convertirla a nivel
   (§6.4) — así el número que ve el alumno en el desglose es exactamente el que se usó para
   calcular, y no uno que difiera en el último decimal.
2. A la nota final, una sola vez, al terminar la suma ponderada — no en cada término
   `valor_i × peso_i` por separado, porque redondear términos intermedios acumula error y
   contradice que sea "el cálculo interno" el que se redondea, no cada paso de él.

**Criterios obligatorios.** Por defecto un criterio obligatorio pesa como cualquier otro y no limita la nota. Existe una opción, desactivada por defecto, de *condición mínima*: si un criterio obligatorio se sitúa en N1, la nota final se limita a 4,9. Se deja desactivada porque una condición mínima que no se ha anunciado al alumnado antes de la prueba es difícil de sostener; si se activa, la app la imprime obligatoriamente en la ficha del alumno.

**Regla exacta de la condición mínima**, porque «se limita a 4,9» admite más de una lectura:

- Es un **techo**, no un valor fijo: `notaFinal = condicionMinimaActiva && algúnObligatorioEnN1 ? Math.min(notaCalculada, 4.9) : notaCalculada`. Si la nota calculada ya era 3,2, se queda en 3,2; la condición mínima nunca sube una nota.
- Dispara con que **uno solo** de los criterios obligatorios esté en N1 — no hace falta que lo estén todos, y tener varios en N1 a la vez no baja el techo por debajo de 4,9: no es acumulativa, es un disparador binario.
- Si el instrumento no tiene ningún criterio obligatorio entre los seleccionados (por ejemplo, porque el profesor lo desmarcó en modo avanzado), la condición mínima no tiene nada que comprobar y no actúa, aunque esté activada.
- El nivel de un criterio obligatorio se determina exactamente igual que el de cualquier otro (§6.4 si tiene matriz, selección directa si no la tiene); la condición mínima no usa una vara distinta.

### 6.3 Los dos mecanismos de descuento, que no son el mismo

El sistema tiene dos formas de restar puntos y conviene no confundirlas, porque responden a lógicas distintas y se aplican en sitios distintos.

| | **Penalización de componente** | **Detractor global** |
|---|---|---|
| Dónde vive | Dentro de la `matriz_cuantitativa` de una dimensión (§5.2) | En la escala de estimación analítica (§7.7) |
| Qué penaliza | Un fenómeno lingüístico concreto de esa dimensión: una anáfora ambigua, una falacia, un párrafo de diez líneas sin un punto | La ortografía y la presentación, transversales a todo el texto |
| Sobre qué resta | Sobre los 10 puntos de **esa dimensión** | Sobre la **nota final** |
| Tope | Propio de cada penalización, declarado en la matriz | 2 puntos sobre 10 |
| Dónde aparece | En la rúbrica en modo IA y en la corrección detallada | Impreso en la ficha del alumno |

**Los topes no son opcionales.** Sin ellos, un texto flojo acumula descuentos hasta un negativo, y una dimensión puede acabar restando de otras. Cada penalización declara el suyo y la app rechaza la matriz que no lo traiga.

**Fórmula exacta de una penalización de componente, para un alumno concreto.** El profesor cuenta
ocurrencias del fenómeno (por ejemplo, «3 digresiones»); la penalización aplicada es
`Math.max(ocurrencias * pen.puntos, pen.tope)`. Se usa `Math.max` y no `Math.min` a propósito:
`pen.puntos` y `pen.tope` son negativos, así que el valor "más grande" (menos negativo) es el que
respeta el tope, y `Math.max` es el que se queda con él en cuanto las ocurrencias lo superan.

**Las penalizaciones aplicadas son números negativos y por tanto se SUMAN, no se restan.** Es la
trampa de signo evidente en cuanto se escribe y fácil de pasar por alto al leer: `pen.puntos` y
`pen.tope` son negativos en el pack, luego el resultado de la fórmula anterior también lo es, y
restarlo subiría la nota en vez de bajarla. La implementación de referencia lo hace bien
(`scripts/simular_correccion.py`: `puntos = max(0.0, bruto + descuento)`), y esta especificación
dijo lo contrario en su primera redacción.

**La puntuación bruta de una dimensión con matriz nunca es negativa.** Los componentes solo pueden
sumar entre 0 (todas las bandas mínimas) y `total`; las penalizaciones solo restan. El validador ya
garantiza que la suma de topes no pase de la mitad de `total` (§10, `penalizacion_sin_tope`), pero
en el caso límite —todos los componentes en su banda de 0 y todas las penalizaciones a tope— la
suma daría un número negativo. Por eso el cálculo completo es:

```
puntosDimension = Math.max(0, sumaComponentes + sumaPenalizacionesAplicadas)
```

La matriz puede llegar a 0, nunca a menos que 0.

**Regla del doble castigo: una penalización no puede medir lo que ya mide un componente.** Es el error más fácil de cometer al escribir una matriz, y salió en la primera que redactamos: el componente *"Puntuación al servicio de la estructura"* ya valoraba los errores de puntuación, y encima había una penalización por párrafo largo sin puntos. El alumno pagaba dos veces por el mismo fenómeno.

Se detectó simulando una corrección completa, no leyendo la matriz: la dimensión bajaba dos niveles de golpe, de Suficiente a Iniciado, y la nota final caía siete décimas. Una rúbrica así no se sostiene ante una reclamación, porque el alumno puede señalar exactamente dónde se le ha restado dos veces.

De aquí salen dos consecuencias que el diseño adopta:

- **Las penalizaciones se reservan para fenómenos que ningún componente recoge.** Si el fenómeno merece medirse, casi siempre lo correcto es que sea un componente con su banda, no una penalización. En la práctica esto deja las matrices con pocas penalizaciones o con ninguna, y eso es buena señal.
- **Toda matriz nueva se prueba simulando una corrección** antes de darla por buena (§15). Leerla no basta: los efectos de las penalizaciones sobre el nivel resultante no se ven hasta que se calculan.

Ambos mecanismos son coherentes con el principio de enmienda del Marco Teórico §1.4: el error no resta en términos absolutos, resta acotado y con la vía de mejora señalada al lado.

**Fórmula exacta del detractor global**, para cuando exista un instrumento que lo produzca (§7.7).
A diferencia de las penalizaciones de componente, `detractorAcumulado` se maneja como una cantidad
**positiva** que se resta (es lo que hacen las fuentes al decir «restar 1,0 punto por falacia»), y
su tope es común a todos: 2 puntos sobre 10.

```
notaTrasDetractor = Math.max(0, notaCalculada - Math.min(detractorAcumulado, 2))
```

**El orden respecto a la condición mínima sí importa, y se fija aquí: primero el detractor, después
el techo.** La primera redacción de esta sección afirmó que daba igual porque ninguno de los dos
puede subir la nota; es falso, y basta un caso para verlo. Con una nota calculada de 8, detractor de
2 y la condición mínima disparada: aplicando el techo primero se obtiene `min(8; 4,9) = 4,9` y luego
`4,9 − 2 = 2,9`; aplicando el detractor primero, `8 − 2 = 6` y luego `min(6; 4,9) = 4,9`. Dos notas
distintas para el mismo alumno.

Se elige el segundo orden por lo que significa cada mecanismo: el detractor forma parte de calcular
la nota, y la condición mínima es un límite sobre **la nota final**, que es lo que dice §6.2 con esas
mismas palabras. Un techo que se aplica antes de terminar el cálculo deja de ser un techo.

```
notaFinal = condicionMinimaActiva && algúnObligatorioEnN1
  ? Math.min(notaTrasDetractor, 4.9)
  : notaTrasDetractor
```

**Hoy no está conectado a ningún instrumento**: la escala de estimación analítica (§7.7) todavía no
existe (§16.1), así que esta parte queda escrita para cuando se construya, no para usarse ya.

### 6.4 De puntos a nivel

Un número de 0 a 10 se traduce al nombre de su nivel con estas bandas. Se aplican tanto a los puntos de una dimensión con matriz como a la nota final del instrumento — son la misma escala, que es lo que permite decirle al alumno «tu texto está en Avanzado» sin cambiar de sistema. **Traducen para mostrar y para comprobar la condición mínima (§6.2); no intervienen en el cálculo de la nota.**

| Puntos de la dimensión | Nivel |
|---|---|
| 9,0 – 10 | 4 · Excelente |
| 7,0 – 8,9 | 3 |
| 5,0 – 6,9 | 2 |
| 0 – 4,9 | 1 |

**Estas bandas están confirmadas por dos fuentes independientes**, lo que las convierte en la parte más sólida del modelo de calificación: `Rúbricas documentación.md` las propone para la corrección con IA, y el marco teórico vigente del proyecto de Lengua las fija como regla no negociable. Coinciden exactamente.

**Cierre del hueco entre bandas.** Escritas con un decimal, "7,0–8,9" y "9,0–10" dejan sin cubrir
el intervalo (8,9; 9,0) — un 8,95 no cae en ninguna fila de la tabla tal y como está redactada. Los
cortes reales son continuos y valen 9, 7 y 5; "8,9" y "6,9" y "4,9" son el límite superior *ya
redondeado a un decimal para la tabla*, no el punto de corte. La comparación cerrada, la que hay
que implementar, es por umbrales con `>=` y sin huecos:

```
nivel = puntos >= 9 ? 4
      : puntos >= 7 ? 3
      : puntos >= 5 ? 2
      : 1
```

El número que entra aquí viene **ya pasado por `redondear2` (§6.2)**, para que un valor que en
realidad es 9,00 pero se almacena como 8,99999… no caiga al lado equivocado del corte por azar de
representación binaria.

**Invariante: `matriz_cuantitativa.total` es siempre 10.** Estas bandas están escritas en puntos
absolutos, no en porcentaje, y solo tienen sentido si toda matriz está construida sobre 10 — como
lo están, hoy, las diez del pack. Ni `scripts/validar_pack.py` ni `js/validador.js` lo comprueban
todavía: aceptan cualquier `total` mientras los componentes sumen ese total (regla `matriz_cuadrada`,
§10). Si algún día una matriz se declarara con un total distinto de 10, estas bandas no tendrían
una lectura definida —no está decidido si habría que escalarlas proporcionalmente o prohibir el
caso— así que, hasta que se decida, se trata como error de contenido a impedir en el validador, no
como una variación que el motor de cálculo tenga que soportar. Queda anotado como tarea pendiente
del validador, no como parte de esta especificación de cálculo.

Lo único que no coincide entre ambas fuentes son los **nombres** de los niveles 1 a 3 (*En desarrollo / Conseguido / Avanzado* frente a *Iniciado / Suficiente / Notable*), y esa es una de las decisiones abiertas de §17. Los números no dependen de cómo se resuelva.

Así, una dimensión corregida con matriz y otra corregida por descriptor conviven en la misma rúbrica y en la misma nota final, sin que el alumno vea dos sistemas distintos: las dos aportan un número de 0 a 10 y las dos se leen con esta misma tabla.

**Discrepancia pendiente con la implementación de referencia.** `scripts/simular_correccion.py` valora las dimensiones **sin** matriz con `{1: 2,5 · 2: 6,0 · 3: 8,0 · 4: 9,5}` —los puntos medios de cada banda— y no con la escala equilibrada de §6.2 (2,5 / 5 / 7,5 / 10). Ambas escalas son internamente coherentes (las dos, releídas con esta tabla, devuelven el nivel del que salieron), pero no son la misma y hoy el proyecto sostiene las dos a la vez. La de §6.2 es la que tiene respaldo documental —se corresponde con los porcentajes por componente de `Rúbricas documentación.md`: 100 % / 75 % / 50 % / 25 %—, así que es la que debe prevalecer y el script el que hay que ajustar. No se ha tocado todavía porque cambiar esos valores cambia el resultado de las simulaciones con las que se validaron las matrices existentes, y eso pide rehacerlas, no editarlas de paso.

**Bonificaciones:** no existen. Un desempeño excepcional se recoge subiendo de nivel, no sumando puntos fuera de la matriz.

### 6.5 Lo que le falta al motor para poder calcular una nota

Esta especificación cierra la aritmética, pero hay que decir con quién habla: **hoy no existe en la
aplicación ninguna pantalla ni estructura de datos para registrar el resultado de un alumno
concreto.** `js/motor.js` genera el instrumento —la rúbrica en blanco, con sus dimensiones, pesos y
descriptores— y ahí se detiene; no hay dónde marcar "este alumno sacó N3 en cohesión" ni dónde
contar ocurrencias de una penalización. Implementar §6.2 y §6.3 en código no es solo escribir las
funciones de cálculo de más arriba: hace falta antes decidir cómo entra el resultado de un alumno,
lo cual es una pantalla nueva, no un ajuste de la existente.

Las funciones de cálculo de esta sección, en cambio, sí se pueden escribir y probar ya, como
funciones puras, sin esa pantalla: toman como entrada la forma mínima de un "resultado de
criterio" y no necesitan saber de dónde salió.

```
ResultadoCriterio =
  | { tipo: "nivel", nivel: 1 | 2 | 3 | 4 }
  | { tipo: "matriz",
      bandasElegidas: { [nombreComponente]: puntos },   // un valor de comp.bandas[].puntos por componente
      ocurrenciasPenalizacion: { [clave]: number } }     // recuento por penalización disparada; ausente = 0
```

Un criterio sin `matriz_cuantitativa` solo puede producir `{ tipo: "nivel" }` (selección directa del
descriptor), y aporta el valor de ese nivel según la escala de §6.2. Un criterio con matriz siempre
produce `{ tipo: "matriz" }`, del que salen sus puntos por §6.3, y son esos puntos los que aportan;
su nivel se calcula aparte, por §6.4, para mostrarlo y para la condición mínima.

`bandasElegidas` se indexa por nombre de componente, que es único dentro de cada matriz del pack
—comprobado, aunque el validador no lo exige todavía—; si alguna vez dejara de serlo, la clave pasa
a ser el índice del componente.

Con esta forma de entrada cerrada, el orden de trabajo queda: (1) las funciones puras de cálculo de
§6.2–§6.4, con sus casos dorados de §15, incluidos los bordes que esta revisión destapó —el signo de
las penalizaciones, el orden entre detractor y techo, y los cortes 5 / 7 / 9 con valores justo por
debajo—; (2) la pantalla o el flujo que produce un `ResultadoCriterio` por alumno y por dimensión,
que es trabajo de interfaz nuevo y no está todavía diseñado en §11.

---

## 7. Catálogo de instrumentos

Siete instrumentos, todos generados a partir del mismo conjunto de criterios filtrados. Los marcados como **básico** vienen seleccionados por defecto.

| # | Instrumento | Tipo | Cuándo |
|---|---|---|---|
| 7.1 | Rúbrica analítica | básico | Producto final integrador |
| 7.2 | Lista de cotejo | básico | Tarea diaria o intermedia |
| 7.3 | Ficha del alumno + guion de clase | **obligatorio** | Siempre |
| 7.4 | Rúbrica de un solo punto | básico | Borradores y tareas de proceso |
| 7.5 | Versión de autoevaluación | avanzado | Durante el proceso |
| 7.6 | Versión de coevaluación | avanzado | Trabajo entre iguales |
| 7.7 | Escala de estimación analítica | avanzado | Desarrollo largo, comentario, EBAU |
| 7.8 | Rúbrica en modo IA | avanzado | Corrección asistida, con supervisión |

### 7.1 Rúbrica analítica

La matriz completa: dimensiones en filas, cuatro niveles en columnas, peso por dimensión. Cabecera con la actividad, el curso, el tipo de tarea y los criterios oficiales de referencia.

### 7.2 Lista de cotejo — regla de derivación

Se deriva del descriptor de **N2 (Conseguido)**, convertido en afirmación verificable con casilla de sí/no. Se usa `descriptor_cotejo` solo si está relleno explícitamente. Máximo recomendado: 8 ítems.

### 7.3 Ficha del alumno y guion de clase — obligatorio

Es la pieza que materializa el objetivo del proyecto y **no se puede desmarcar**. Contiene:

- **Qué se te pide**: la actividad, redactada tal y como la escribió el profesor.
- **Qué se valora**: cada dimensión con su peso, en lenguaje directo.
- **Cómo se llega al nivel excelente**: para cada dimensión, el descriptor de N4 traducido a instrucción accionable en segunda persona.
- **Cómo se calcula la nota**: la escala elegida y, si están activados, la condición mínima y los detractores. Sin letra pequeña.
- **Guion de presentación en clase** (media página, para el profesor): apertura, recorrido dimensión a dimensión, un ejemplo contrastado de N2 frente a N4, y dos preguntas de comprobación para lanzar al grupo. Pensado para una sesión de 5 a 10 minutos.

El registro lingüístico se ajusta al curso: la ficha de 1.º de ESO y la de 2.º de Bachillerato no se le hablan igual al alumno. Diseño pensado para imprimirse en un A4 y para proyectarse.

### 7.4 Rúbrica de un solo punto

Columna central con el descriptor de N2 y dos columnas en blanco: *evidencias de mejora* y *evidencias de excelencia*. Máximo 2 dimensiones (Marco Teórico §10).

### 7.5 y 7.6 Autoevaluación y coevaluación

La misma matriz con los descriptores en primera persona, derivados de forma exacta mediante el banco de verbos (§5.3). La coevaluación añade la fórmula de referencia al compañero y un campo de comentario obligatorio por dimensión: sin justificación escrita, la coevaluación degenera en reparto de notas entre amigos.

### 7.7 Escala de estimación analítica

Para lo que el Marco Teórico §5 llama desarrollo largo y pruebas tipo EBAU. Es una rúbrica simplificada con puntuación directa por apartado, más el bloque de detractores declarados (§6.2). En Bachillerato, la cabecera admite una referencia a las directrices EBAU de la Región de Murcia para que no haya disonancia entre lo que se evalúa en el aula y lo que se exige en la prueba externa.

### 7.8 Rúbrica en modo IA

Es el instrumento donde la precisión importa más, porque quien corrige no puede preguntar. Un profesor que lee *"emplea conectores variados"* sabe a qué se refiere; un modelo de lenguaje, ante esa frase, produce una impresión razonable y la viste de nota. La diferencia entre una corrección asistida útil y una arbitraria está exactamente aquí.

Por eso el modo IA **no exporta los descriptores cualitativos como criterio de puntuación**, sino la `matriz_cuantitativa` de cada dimensión que la tenga. El texto copiable contiene:

1. **La matriz operativa**: cada componente con su puntuación máxima y las bandas, en términos contables. *"3,0 si emplea 4 o más tipos distintos de marcador; 2,0 si emplea 2 o 3"* es verificable; *"emplea conectores variados"* no lo es.
2. **Las penalizaciones contables**, con su tope. Sin tope, un texto flojo acumula descuentos hasta un negativo absurdo.
3. **La conversión de puntos a nivel**, para que la salida encaje con la rúbrica del profesor y con el resto de instrumentos.
4. **El informe de evidencias obligatorio**: por cada punto otorgado o restado, la localización en el texto. *"Se han detectado 3 tipos de marcador: oposición (línea 4), consecuencia (línea 9), ordenación (línea 12)"*. Un componente puntuado sin inventario se descarta.
5. **La retroalimentación accionable** por dimensión no excelente: qué falta exactamente para subir de banda, en términos de lo que hay que añadir o cambiar.

Va acompañado del protocolo de §14, que no es opcional ni se puede ocultar.

**Aviso que la app imprime junto al texto.** Que la matriz sea contable no significa que el recuento sea correcto. Un modelo de lenguaje cuenta mal con frecuencia, y detectar una anáfora ambigua es un juicio lingüístico, no una búsqueda. El inventario de evidencias del punto 4 existe precisamente para eso: no es burocracia, es lo que te permite comprobar el recuento en diez segundos y descartarlo si está inflado.

---

## 8. Puerta de aplicabilidad

Antes de generar nada, la app pregunta qué se va a evaluar y actúa según el Marco Teórico §5. Es una decisión de producto deliberada: una herramienta que genera rúbricas para todo enseña a los profesores exactamente lo contrario de lo que el proyecto pretende enseñarles.

| Respuesta del profesor | Comportamiento de la app |
|---|---|
| Prueba objetiva: test, huecos, dictado, preguntas factuales | **No genera rúbrica.** Explica por qué (no hay gradación de calidad, solo acierto o error) y ofrece una plantilla de corrección con puntuación directa. |
| Desarrollo largo, comentario de texto, EBAU | Propone la **escala de estimación analítica** (7.7) en lugar de la rúbrica analítica completa. |
| Tarea de desempeño o proyecto | Terreno natural: **rúbrica analítica** completa. |
| Tarea diaria, borrador, ejercicio de proceso | Propone **lista de cotejo** o **rúbrica de un solo punto**, y desaconseja la rúbrica completa. |

La app propone y explica; el profesor puede seguir adelante con otra elección. Educa, no impone.

---

## 9. Motor de generación

1. Puerta de aplicabilidad (§8) → familia de instrumento recomendada.
2. Comprobar la matriz de tarea × curso (§4.3): si la combinación no existe, explicarlo y proponer la alternativa del curso.
3. Filtrar criterios del pack por `curso` y por `tipos_tarea`, resolviendo las herencias (`hereda_de`).
4. Premarcar dimensiones, agrupadas por bloque LOMLOE (A-D).
5. Aplicar profundidad según el tiempo de corrección declarado: menos de 2 min → `prioridad` 1; de 2 a 5 min → 1 y 2; más de 5 min → 1, 2 y 3.
6. Aplicar los pesos y normalizar a 100.
7. Comprobar coherencia de `progresion`: avisar si se mezclan criterios con más de un nivel de diferencia en el mismo eje.
8. Calcular el indicador de complejidad (🟢🟡🔴) por número de dimensiones, bloques implicados y profundidad. Aviso activo por encima de 5 dimensiones si el instrumento no es un producto final integrador.
9. Ejecutar el validador de calidad (§10) sobre el conjunto resultante.
10. Renderizar cada instrumento marcado, más la ficha del alumno, que siempre se genera.
11. Vista previa editable; los textos editados a mano se vuelven a pasar por el validador.
12. Exportar (§12).

---

## 10. Validador de calidad de descriptores

Traducción directa del checklist del Marco Teórico §9. Se ejecuta sobre los descriptores del pack (en tiempo de construcción del contenido) y sobre los que el profesor edite a mano (en tiempo de uso). Cada aviso explica la regla: es el principal mecanismo por el que la app forma al profesorado.

| Regla | Qué detecta | Severidad |
|---|---|---|
| **Adverbitis** | Calificadores vagos sin anclaje: *bien, regular, mal, adecuadamente, correctamente, frecuentemente, a veces, bastante, suficientemente, de forma adecuada* | Error |
| **Verbo observable** | El descriptor no empieza por un verbo del banco (§5.3) | Error |
| **Gradación positiva** | Un descriptor de N1 formulado en negativo ("No utiliza…", "Carece de…") en lugar de describir lo que sí hace de forma limitada | Error |
| **Saber como vehículo** | El nombre de la dimensión es un contenido ("las subordinadas", "el Barroco") en vez de una acción competencial | Error |
| **Niveles indistinguibles** | Dos niveles contiguos con similitud léxica muy alta o que solo se diferencian por un adverbio | Aviso |
| **Trazabilidad** | Criterio sin `criterio_oficial` relleno | Error de pack: no carga |
| **Modalizadores del criterio** | Dos direcciones. **A:** el criterio impone una ayuda (*de manera guiada*, *con ayuda de pautas y modelos*) y ningún descriptor la nombra. **B:** el criterio ya pide autonomía (*progresivamente autónoma*) y algún descriptor conserva el andamiaje del curso anterior (*indicadas por el profesor*, *con la pauta facilitada*) | Aviso |
| **Copia entre cursos** | Los descriptores de N2 a N4 de la misma dimensión son textualmente idénticos en dos cursos distintos. **N1 queda exento** (ver nota) | Aviso |
| **Tarea aplicable al curso** | El tipo de tarea no está sostenido por los criterios de ese curso (§4.3) | Error |
| **Matriz cuadrada** | Los componentes de una `matriz_cuantitativa` no suman el total declarado; una banda alta no coincide con el máximo del componente; faltan las bandas de 0; hay puntuaciones repetidas | Error |
| **Penalización sin tope** | Una penalización sin tope declarado, con tope positivo, o cuyo tope pasa del 35% de la dimensión. También si todas juntas pueden restar más de la mitad | Error |
| **Doble castigo** | Una penalización mide un fenómeno que un componente de la misma matriz ya recoge en sus bandas (§6.3) | Error |
| **Adverbitis en banda** | Una condición de banda usa calificadores vagos en lugar de algo contable. Es el fallo que inutiliza la matriz para corrección asistida | Error |
| **Reparto de pesos** | Una dimensión por encima del 40%, o alguna por debajo del 5% | Aviso |
| **Sostenibilidad** | Más de 5 dimensiones en un instrumento que no es producto final | Aviso |

Los errores bloquean la carga de un pack; en edición manual del profesor, avisan y explican, pero no impiden continuar.

**Dos implementaciones, un solo conjunto de reglas.** El validador vive dos veces: en `scripts/validar_pack.py`, que se ejecuta al construir el contenido, y en `js/validador.js`, que se ejecuta al cargar el pack en la aplicación y pinta el panel de salud del pack. Son dos programas, no dos criterios: **la aplicación nunca puede informar de un pack más limpio que el script**. Cualquier regla nueva entra en los dos, con el mismo umbral y la misma semántica.

La única divergencia admitida es que el script sea *más* estricto por su forma de buscar. Busca los calificadores vagos por subcadena, y eso le hace marcar *bienestar* por contener *bien*; la aplicación exige palabra completa en los términos de seis caracteres o menos —`bien`, `mal`, `muy`— para no marcar *formal* ni *bienestar*, y mantiene la búsqueda por subcadena en los largos, que es la que atrapa *bastantes* y *regularmente*. La divergencia va en la dirección segura y está documentada en el código de ambos.

Cada regla lleva en `js/validador.js` su **microexplicación**: el aviso dice qué está mal y el desplegable de al lado dice por qué la regla existe. Es la forma que toma en la interfaz el principio de §3 —la herramienta enseña mientras se usa— y el motivo por el que el panel de salud del pack agrupa los avisos por regla en lugar de listarlos sueltos.

**Nota sobre la progresión entre cursos.** Este apartado ha pasado por dos formulaciones equivocadas antes de llegar a la actual, y conviene dejar constancia para no repetirlas.

La primera ponía un techo al nivel cognitivo del verbo según el curso: en 1.º de ESO no se admitirían verbos como *Revisa* o *Valora*. Marcó como error tres descriptores correctos, porque el criterio oficial 9.1 de 1.º de ESO dice literalmente *"Revisar los textos propios de manera guiada"*. El verbo lo pone el currículo.

La segunda comparaba el nivel cognitivo del verbo entre cursos y exigía que subiera. Produjo dos falsos positivos porque la clasificación cognitiva de un verbo aislado no mide la exigencia real de un descriptor: *Sustituye* aparecía por encima de *Articula*, cuando sustituir una palabra por un sinónimo es más sencillo que articular un discurso.

**El principio correcto es que la progresión no se diseña: se lee.** Está escrita en la redacción del criterio oficial de cada curso — *sencillos* y *de manera guiada* en 1.º, *de cierta extensión* y *progresivamente autónoma* en 3.º. Por eso la regla que queda comprueba que el descriptor recoja esos modalizadores, y no que el redactor haya conseguido subir de escalón en una taxonomía. La comparación entre cursos se mantiene únicamente como detector de copiar y pegar, y N1 queda exento: el nivel de partida converge de forma legítima, porque un texto entregado sin revisar es la misma evidencia en 1.º de ESO que en 2.º de Bachillerato.

**Tercera corrección, al implementar la regla en la aplicación.** La formulación anterior pedía que el descriptor recogiera *cualquier* modalizador de la cita, incluidos los de sencillez y extensión (*textos sencillos* en 1.º, *de cierta extensión* en 3.º). Calibrada contra el pack de texto expositivo, marcaba cinco criterios correctos: esos modalizadores califican **el objeto que se pide**, no la condición de desempeño de cada dimensión, y ya viven en `progresion.complejidad` y en `saber_vehiculo`. Exigirlos en la redacción solo produce descriptores rellenos de adjetivos, que es la adverbitis entrando por otra puerta. Se descartó también *con ayuda* como disparador: aparece en el criterio 5.1 —*«revisarlos con ayuda del diálogo entre iguales»*— referido a la revisión, y disparaba sobre dimensiones que no evalúan revisión. Quedan las dos direcciones de la tabla, con disparadores de frase completa, y sobre el pack actual no producen ningún aviso.

---

## 11. Interfaz

### 11.1 Modo exprés (entrada por defecto)

Tres decisiones y una rúbrica lista:

1. **¿Qué vas a evaluar?** (puerta de aplicabilidad + tipo de tarea)
2. **¿Qué curso?**
3. **¿Cuánto tiempo tienes por alumno?**

De ahí sale directamente la vista previa con la rúbrica analítica, la lista de cotejo y la ficha del alumno. Este es el camino pensado para el profesor sin experiencia previa en rúbricas, que es explícitamente el público del proyecto.

### 11.2 Modo avanzado

Desde la vista previa, "Ajustar": marcar y desmarcar dimensiones agrupadas por bloque LOMLOE, deslizadores de peso con barra de reparto, profundidad, criterios obligatorios, elección de instrumentos, modo de calificación y edición manual de descriptores con el validador activo.

**Los pesos son libres.** El `peso_base` que trae cada criterio en el pack es solo un punto de partida razonable, no una prescripción:

- El deslizador de cada dimensión se mueve entre 0 y 100 sin restricciones.
- Al soltar, el sistema **normaliza el conjunto a 100** y la barra de reparto muestra el resultado, para que el profesor vea de un vistazo si una dimensión se ha comido el instrumento.
- Los avisos de reparto (§10) **nunca bloquean**: si un profesor decide que la ortografía vale el 50% en una tarea concreta, la app se lo advierte una vez y le deja hacerlo. La decisión de calificación es suya, no de la herramienta.
- Un criterio obligatorio conserva el peso ajustable; lo único que no permite es desmarcarlo mientras el ajuste esté activo.
- El reparto elegido se guarda en la configuración y **se imprime en la ficha del alumno**, que es donde de verdad importa que sea explícito.

### 11.3 Microexplicaciones

Cada control lleva un "¿por qué?" desplegable de dos o tres líneas, extraído del marco teórico. Es el andamiaje pedagógico del que carecía la versión 0.4: el profesor aprende qué es una dimensión, por qué los saberes no abren fila o por qué cuatro niveles y no tres, en el momento exacto en que la decisión le afecta.

Los textos viven en un catálogo único, `js/microexplicaciones.js`, y no en el marcado: el mismo texto se usa en el formulario, en la vista previa y en el modo avanzado, y se corrigen leyéndolos seguidos en vez de persiguiéndolos por tres archivos. El marcado estático solo pone anclas `data-micro`. Las microexplicaciones **no se imprimen**: el instrumento impreso es para el aula, no para el profesor que está aprendiendo a construirlo.

---

## 12. Exportaciones

| Formato | Contenido |
|---|---|
| `.xlsx` | Una hoja por instrumento, compatible con la importación guiada de iDoceo. Nombre automático: `Rubrica_{tipo}_{curso}_{mmaaaa}.xlsx` |
| Impresión / PDF | Vía CSS de impresión, A4, sin cortes de tabla a mitad de fila. Aplicable a todos los instrumentos, y muy especialmente a la ficha del alumno |
| `.json` | Configuración completa, para reutilizar o compartir con un compañero de departamento |
| Texto plano | Rúbrica en modo IA, copiable al portapapeles con su protocolo |

---

## 13. Arquitectura técnica

Sitio **estático**, sin backend, sin proceso de construcción en la fase inicial.

```
/
├── index.html
├── css/         estilos + print.css
├── js/          modulos ES: motor, validador, instrumentos, exportadores, ui
├── data/        packs de criterios (.json)
├── vendor/      libreria de escritura xlsx
└── test/        casos dorados del motor
```

- **Sin framework.** El estado de la aplicación es una configuración pequeña y un pack de datos; no justifica una dependencia.
- **Publicación** en GitHub Pages. Gratis, versionado y con URL estable que el profesor puede guardar en marcadores.
- **Empaquetado en archivo único** al final del desarrollo, para quien lo quiera en local o en un USB, mediante una construcción que integra todo en un `.html` autocontenido. El archivo único es un formato de distribución, no de código fuente: mantener 5.000 líneas en un solo archivo se vuelve inviable con este alcance.
- **Sin red en tiempo de ejecución.** La app funciona sin conexión una vez cargada.

---

## 14. Protocolo de uso de la rúbrica en modo IA

El aviso de responsabilidad no es un banner que se acepta y se olvida: es un protocolo que acompaña siempre al texto exportado.

1. **Protección de datos.** No pegues en un servicio de IA de terceros textos que identifiquen a un menor. Retira nombre, apellidos, grupo y cualquier dato personal antes de nada. Esta no es una recomendación de buenas prácticas: es una obligación.
2. **Calibración previa.** Antes de fiarte del resultado, corrige tú dos o tres muestras y compáralas con las que dé la IA. Si no coinciden, el problema está casi siempre en los descriptores, no en la máquina; ese desacuerdo es información valiosa sobre tu rúbrica.
3. **Evidencia obligatoria.** La IA debe citar el fragmento del texto que justifica cada nivel que asigna. Un nivel sin evidencia citada se descarta.
4. **La nota la firma el profesor.** La salida de la IA es un borrador de corrección y una fuente de retroalimentación, nunca una calificación. La responsabilidad de la nota es del docente, y así se lo debe comunicar al alumnado.
5. **Transparencia con el alumnado.** Si en la corrección de una tarea ha intervenido una IA, los alumnos deben saberlo.

---

## 15. Pruebas y criterios de aceptación

Un motor de reglas sin pruebas se degrada en cuanto se toca. Con un puñado de casos dorados basta:

- **Casos dorados del motor:** para cada celda ocupada de la matriz tarea × curso (§4.3), una configuración de entrada y el conjunto de criterios esperado a la salida. Detecta regresiones al editar packs.
- **Casos del validador:** una batería de descriptores correctos e incorrectos, uno por regla de §10.
- **Casos de calificación:** configuraciones con nota conocida a mano, incluyendo normalización de pesos, condición mínima activada y detractores en el tope.
- **Simulación de corrección por matriz (obligatoria para toda matriz nueva):** se elige una banda por componente, se aplican las penalizaciones y se comprueba que el nivel resultante y la nota final son los que un profesor pondría a ese perfil de alumno. Es la prueba que destapó la regla del doble castigo (§6.3), y ninguna lectura de la matriz la habría encontrado.
- **Validación de packs:** todo pack debe cargar sin errores de validación; si no, la app no lo carga y lo dice.

**Criterio de aceptación del prototipo:** un profesor que nunca ha usado la app genera, en menos de tres minutos y sin ayuda, una rúbrica de texto argumentativo para 3.º de ESO con su ficha del alumno lista para imprimir.

---

## 16. Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| **Fase 1 — Prototipo** | Motor, modo exprés, rúbrica analítica, lista de cotejo, ficha del alumno, impresión. Pack de **texto expositivo en 1.º de ESO y en 3.º de ESO**: misma tarea en dos cursos distantes, para poner a prueba los ejes de progresión desde el primer día | **Terminada** |
| **Fase 2 — v1 completa** | La matriz completa de tarea × curso (§4.3), los siete instrumentos, modo avanzado, validador, exportación `.xlsx`, publicación | **En curso** (ver desglose) |
| **Fase 3** | Reacción a noticia, redacción de noticia, resumen, comentario de texto literario. Banco de criterios favoritos | Pendiente |
| **Fase 4** | Lectura en voz alta, podcast, línea de tiempo, trabajo grupal. Calculadora de carga de corrección | Pendiente |
| **Fase 5 (opcional)** | Enlace compartible y QR · adaptación NEAE · packs de otras materias · integración con iDoceo Connect | Pendiente |

### 16.1 Desglose de la fase 2

La fase 2 se cerró en el papel como un bloque único y en la práctica se está abriendo por piezas.
Este es el estado real, contrastado con el código:

| Pieza | Estado | Qué falta |
|---|---|---|
| **Validador de calidad (§10)** | Terminado | Nada. Las quince reglas están en `js/validador.js`, en paridad comprobada con `scripts/validar_pack.py`, con una batería de casos en `test/` |
| **Microexplicaciones (§11.3)** | Terminado | Nada. Catálogo único en `js/microexplicaciones.js`, más un «¿por qué esta regla?» por cada regla del validador |
| **Modo avanzado (§11.2)** | Parcial | Están los pesos libres con normalización a 100 y la selección de dimensiones por bloque. Faltan profundidad, criterios obligatorios, elección de instrumentos, modo de calificación y edición manual de descriptores con el validador activo |
| **Catálogo de instrumentos (§7)** | 3 de 7 | Hechos 7.1, 7.2 y 7.3. Faltan rúbrica de un solo punto, autoevaluación, coevaluación, escala de estimación analítica y modo IA. La autoevaluación y la coevaluación son proyección pura —los 26 verbos del banco ya guardan su forma en 1.ª persona—; la rúbrica de un solo punto necesita además contenido, porque `descriptor_un_punto` está vacío en los doce criterios del pack |
| **Modelo de calificación (§6)** | Parcial | Funciona el modo cualitativo. El numérico está diseñado y los datos existen (`matriz_cuantitativa` en diez criterios), pero el motor todavía no convierte puntos en nota ni aplica penalizaciones |
| **Matriz tarea × curso (§4.3)** | 2 de 20 celdas | Solo texto expositivo en 1.º y 3.º de ESO. Cada celda nueva es contenido curricular, no código: pasa por el protocolo del skill `rubricas-pack` |
| **Exportación (§12)** | Parcial | Impresión y PDF funcionan. Faltan `.xlsx` para iDoceo, configuración `.json` y el texto plano del modo IA |
| **Publicación** | Parcial | Repositorio creado y validación automática en cada empujón. Falta activar GitHub Pages y decidir la URL estable |

**Orden sugerido para seguir.** Primero el modo numérico (§6.2), porque diez criterios ya tienen la
matriz cargada y sin él ese contenido no se usa. Después la autoevaluación y la coevaluación, que
son proyección del contenido existente y no piden pack nuevo: coste bajo y valor alto en el aula.
La ampliación de la matriz tarea × curso puede avanzar en paralelo, porque no toca código. La
exportación `.xlsx` se deja para el final del bloque: es la única pieza que introduce una
biblioteca externa (§13) y conviene decidirla junto con el solapamiento con el skill
`rubricas-lomloe`, que sigue abierto (§17.8).

---

## 17. Decisiones abiertas

1. **Condición mínima de los criterios obligatorios** (§6.2). Propuesta: desactivada por defecto. Pendiente de tu confirmación, porque afecta a cómo se defiende una calificación.
2. **Escala por defecto** (§6.2): equilibrada o exigente. Propuesta: equilibrada.
3. **Tope de los detractores** (§6.2): 2 puntos sobre 10. Pendiente de contrastar con lo que hace el departamento y con las directrices EBAU de Murcia.
4. **Número exacto del decreto autonómico** de currículo de ESO de la Región de Murcia, para citarlo con precisión en el pack. No consta en el volcado disponible.
5. **Códigos de criterio de evaluación**: confirmar la numeración exacta por curso y competencia específica al construir el pack, contra el texto del BORM.
6. **Rúbrica holística** (Marco Teórico §6.1): admisible para tareas muy acotadas. Pendiente de decidir si entra como octavo instrumento o se descarta por sostenibilidad.
7. **Matriz de tarea × curso** (§4.3): la he construido leyendo los criterios del decreto, pero es una lectura mía y tú das clase. Repásala, sobre todo la narración (¿llega a 3.º?) y el argumentativo incipiente en 2.º de ESO.
8. **Marco teórico superado (bloqueante).** El SDD se ha diseñado contra `Marco_Teorico_Rubricas_LOMLOE.md`, que es una versión anterior. La vigente vive en el proyecto de lengua (`documentos_base/marco_teorico_rubricas-LOMLOE.md`) y corrige el alcance a 1.º ESO – 1.º BACH, fija bandas de calificación sobre 10, impone un guardarraíl de terminología y remite al skill `rubricas-lomloe`. Afecta a §4.1, §6.2 y §7.7. Análisis completo y propuestas en `ENLACE_con_proyecto_lengua.md`.
9. **Publicación** (§16.1): el repositorio existe (`josele-duplex/rubricas`) y la validación se ejecuta en cada empujón, pero falta decidir si la aplicación se publica en GitHub Pages con URL estable y si el repositorio se hace público. Afecta a lo que puede contener `fuentes/`, que hoy guarda material aportado sin revisar para difusión.
10. **Ampliación del marco teórico a 1.º de ESO**: el `Marco_Teorico_Rubricas_LOMLOE.md` describe la progresión desde 2.º de ESO. Los ejes extendidos de §5.4 cubren el hueco dentro de este SDD; conviene reflejarlo también en el marco para que ambos documentos digan lo mismo.

---

## 18. Fuentes del diseño

- `Marco_Teorico_Rubricas_LOMLOE.md` — fuente normativa de todo el diseño pedagógico de este SDD.
- `Rúbricas documentación.md` — matrices cuantitativas y ejemplos de descriptores operativos.
- `Lomloe ESO Murcia Lengua (1).md` — currículo de ESO, competencias específicas y criterios de evaluación.
- `Criterios curriculum bachillerato lengua (1).md` — currículo de Bachillerato.
- LOMLOE (Ley Orgánica 3/2020, art. 20) · RD 217/2022 (ESO) · RD 243/2022 (Bachillerato).
