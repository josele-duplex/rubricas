# Enlace entre el generador de rúbricas y el plan de trabajo de Lengua

**Julio 2026** · Análisis de los dos proyectos y propuestas de conexión
Proyecto analizado: `C:\Users\Usuario\Proyectos\proyecto_plan_de_trabajo_lengua`

> **Alcance de este documento.** No propone convertir el generador en una pieza del plan de trabajo ni al revés. Propone puntos concretos de contacto, la mayoría de uso personal, para que el trabajo hecho en un proyecto rinda en el otro. Ninguna de las propuestas modifica el proyecto de lengua: son cosas a decidir antes de tocar nada.

---

## 1. Lo primero: el marco teórico con el que hemos trabajado está superado

`Marco_Teorico_Rubricas_LOMLOE.md` (este proyecto) y `documentos_base/marco_teorico_rubricas-LOMLOE.md` (proyecto de lengua) son el mismo documento en dos estados. El del proyecto de lengua es **posterior**, es más largo, y lleva una cabecera de procedencia que declara cuatro correcciones hechas al integrarlo:

1. **Alcance corregido a 1.º ESO – 1.º BACH.** El original hablaba de "2.º ESO → 2.º Bachillerato". El proyecto de lengua no genera material de 2.º BACH porque PAU/EBAU es responsabilidad colectiva del departamento. La EBAU aparece solo como horizonte que prepara la senda del comentario de 4.º ESO a 1.º BACH, nunca como diana de rúbricas propias.
2. **Anclaje a la calificación sobre 10** como regla no negociable, con bandas por nivel.
3. **Guardarraíl de terminología**: `sintagma` nunca «grupo», `construcciones` nunca «subordinadas adverbiales», `periféricos`, y entrada a todo concepto por el significado.
4. **Enlace con infraestructura ya existente**: el skill `rubricas-lomloe`, que ya hace la conversión a 10 y la exportación a iDoceo.

**Consecuencia para nosotros:** el SDD del generador se ha diseñado contra la versión antigua, y por eso arrastra tres cosas que chocan con el proyecto de lengua. Están en el apartado 2.

**Recomendación:** que el marco viva en **un solo sitio**. El proyecto de lengua es el candidato natural, porque allí ya está integrado con `CLAUDE.md` y con los catálogos. Este proyecto lo referencia por ruta en lugar de guardar una copia. Dos copias divergentes de un documento normativo es exactamente el problema que ya resolviste con `paletas.json` para los colores de Word.

---

## 2. Tres divergencias que hay que resolver antes de enlazar nada

### 2.1 La escala de niveles no coincide

| | Proyecto de lengua (norma vigente) | SDD del generador (v0.8) |
|---|---|---|
| Nombres | Iniciado · Suficiente · Notable · Excelente | En desarrollo · Conseguido · Avanzado · Excelente |
| Conversión | Bandas: 1–4,9 / 5–6,9 / 7–8,9 / 9–10 | Puntos fijos: 2,5 / 5 / 7,5 / 10 |
| Quién convierte | El skill `rubricas-lomloe`, como último paso | El motor de la app |

No es un detalle cosmético: **la misma producción calificada con los dos sistemas da notas distintas**. Un alumno en Notable saca 7,5 con mi escala y entre 7 y 8,9 con la tuya, que además deja al profesor decidir dentro de la banda. Tu modelo es mejor para uso docente, porque conserva el margen de juicio dentro del nivel; el mío estaba pensado para producir un número cerrado.

**Propuesta:** el generador adopta tus nombres y tus bandas. La escala "equilibrada/exigente" del SDD §6.2 se sustituye por el modelo de bandas, con el punto medio como valor sugerido y el profesor pudiendo moverse dentro. Se pierde automatismo y se gana compatibilidad con todo lo que ya tienes.

### 2.2 La ponderación por defecto

Tu marco dice: **ponderación igual por defecto**, y solo se desiguala si hay una razón declarada. El pack que hemos construido reparte 25/20/20/15/10/10.

Las dos posturas son defendibles, pero la tuya es más honesta: si no sabes justificar por qué la coherencia vale más que la cohesión, no debería valer más. **Propuesta:** el pack trae los pesos iguales por defecto, y el reparto diferenciado pasa a ser un *preajuste sugerido* que la app ofrece con su razón escrita al lado, para que aceptarlo sea una decisión consciente.

### 2.3 2.º de Bachillerato

El SDD incluye 2.º BACH y un instrumento de escala de estimación tipo EBAU. Tu proyecto lo excluye deliberadamente.

**Propuesta:** el generador **mantiene** la capacidad técnica (es un producto que otros profesores usarán, y el departamento existe), pero tus packs personales llegan hasta 1.º BACH, y el instrumento EBAU se etiqueta como *horizonte*, no como diana. Es la misma distinción que ya hiciste al integrar el marco.

---

## 3. Los enlaces, por orden de valor

### 3.1 La plantilla de prueba por bloque **ya es** una escala de estimación analítica

`documentos_base/plantillas/Plantilla_prueba-por-bloque.md` tiene estructura fija de cuatro partes sobre 10, pesos orientativos (4/3/3), variantes por bloque, y una regla de ponderación explícita: *"una respuesta sin prueba vale la mitad"*. Eso es, punto por punto, el instrumento 7.7 del SDD.

**Enlace:** que el generador, cuando la puerta de aplicabilidad detecte "prueba de bloque", no produzca una tabla genérica sino **tu plantilla ya rellena** con las dimensiones del bloque y del curso elegidos, lista para pegar. Pasas de 20-30 minutos de relleno a revisar un borrador.

Es el enlace de mayor valor y el más barato de implementar, porque el formato de salida ya está escrito y estabilizado.

### 3.2 Los checklists del alumno son el puente natural con la rúbrica

Las guías de corrección remiten una y otra vez al checklist: *"lo pide el checklist"*, *"el checklist pide dos mecanismos distintos"*. Y el SDD deriva la lista de cotejo del descriptor de nivel Suficiente.

Son la misma cosa vista desde los dos lados. **Enlace:** el generador funciona en las dos direcciones.

- *Hacia adelante*: de la rúbrica sale el checklist del alumno, ya alineado.
- *Hacia atrás*: de un checklist que ya existe en una UD, se reconstruye la rúbrica, porque cada ítem del checklist es un descriptor de nivel Suficiente esperando a que le escriban los otros tres niveles.

La segunda dirección es la que te sirve para el material que ya tienes hecho, que es mucho.

### 3.3 «Se pregunta la prueba, no la etiqueta» debe ser una dimensión

Es la posición evaluativa central de tu proyecto, está en `CLAUDE.md`, en la plantilla de pruebas (regla 3) y en todas las guías de corrección. Y no existe como dimensión en el pack que hemos construido.

Comprobado que **es derivable de criterio oficial**, así que entra sin romper la regla de trazabilidad: el criterio 9.1 de 1.º de ESO pide *"hacer propuestas de mejora argumentando los cambios"*, y el 8.1 pide *"explicar y argumentar […] la interpretación de las obras leídas"*. La justificación razonada está en el currículo.

**Enlace:** una dimensión `justificacion_con_evidencia` disponible en todos los tipos de tarea, con descriptores que gradúan desde *"nombra el fenómeno"* hasta *"cita el fragmento exacto que lo demuestra y explica por qué"*. En tus packs vendría premarcada; en el producto general, como opción.

### 3.4 Tus talleres son los tipos de tarea

| Taller del proyecto de lengua | Tipo de tarea del generador |
|---|---|
| `Taller_Arquitectura-Textual_Coherencia-y-Cohesion` | Texto expositivo (las dimensiones coinciden casi una a una con el pack que ya tenemos) |
| `Taller_Argumentacion_Las_Voces_del_Debate` | Texto argumentativo · debate |
| `Taller_Escritura_Creativa_Las_Voces_del_Lenguaje` | Creación con intención literaria |
| `Antologia_lectura-en-voz-alta` | Lectura en voz alta / expresiva |

**Enlace:** que cada criterio del pack pueda declarar un campo `taller_asociado`, y que el generador, al construir una rúbrica, indique de qué taller salen los saberes-vehículo. La rúbrica deja de ser un instrumento suelto y pasa a señalar el recorrido que la sostiene, que es justo lo que exige tu regla T14.

### 3.5 Las guías de corrección ya aplican la puerta de aplicabilidad

Tus guías distinguen **⚙** (clasificación, corregible por muestreo con clave) de **✎** (respuesta abierta razonada, hay que leer la justificación), y remiten las de creación a la rúbrica de la UD. Eso es exactamente la matriz de aplicabilidad del §5 del marco y la puerta del §8 del SDD, funcionando ya en tu práctica.

**Enlace:** el generador adopta tu notación ⚙/✎ en la salida, en lugar de inventar la suya. Y el tercer caso —*"las de creación van con la rúbrica de la UD"*— identifica exactamente qué rúbricas hay que generar: las de las actividades de creación de cada porfolio.

### 3.6 Referenciar por identificador, nunca copiar

El proyecto de lengua ya tiene resuelto este problema con `bancos_ejercicios/pares_minimos/`: las UD citan el ID del ejercicio, nunca lo copian.

**Enlace:** que las UD referencien `criterio_id` del pack en lugar de pegar la tabla de la rúbrica. Corriges un descriptor en el pack y queda corregido en todas las unidades que lo usan. Sin esto, la primera vez que mejores un descriptor tendrás que perseguirlo por cinco cursos.

---

## 4. Sobre el diseño inverso, que es lo que preguntabas

La formulación fuerte de Wiggins y McTighe —escribir la rúbrica antes de diseñar la tarea— es inaplicable a un curso que ya está diseñado, y forzarla ahora te obligaría a rehacer material que funciona. No la recomiendo.

Pero hay una versión débil que no cuesta nada y da casi todo el beneficio, y **ya la estás aplicando sin llamarla así**: tu regla T14 de la plantilla de pruebas dice *"nada respondible sin el recorrido"* — si un alumno que no ha hecho las fichas puede acertar buscándolo en el libro, la pregunta está mal formulada. Eso es diseño inverso puro, aplicado a las pruebas.

Lo que propongo es extender esa misma comprobación de las pruebas a las tareas, y hacerlo como **contraste entre dos documentos que ya existen**, no como método nuevo:

> Antes de dar por cerrada una tarea, comprobar que todo lo que vas a calificar aparece en el checklist del alumno, y que todo lo que hay en el checklist es algo que de verdad vas a calificar.

Las dos direcciones cazan cosas distintas. Lo que calificas y no está en el checklist es una exigencia oculta, y el alumno tiene derecho a conocerla antes. Lo que está en el checklist y no calificas es ruido que le hace perder tiempo. Es una revisión de cinco minutos por tarea, y encaja con el principio de transparencia del marco sin obligarte a rehacer nada.

Si el generador acaba haciendo la derivación en las dos direcciones (3.2), esa comprobación se vuelve automática: la app enseña las dos listas enfrentadas y marca lo que sobra y lo que falta.

---

## 5. Qué propongo hacer y qué no

**Hacer ahora, en este proyecto:**

- Alinear el SDD con el marco vigente: nombres de nivel, bandas sobre 10, ponderación igual por defecto, 2.º BACH como capacidad y no como diana.
- Añadir la dimensión `justificacion_con_evidencia` y el campo `taller_asociado` al modelo de datos.
- Añadir la generación de la plantilla de prueba por bloque como formato de salida.

**Decidir antes de tocar nada:**

- Dónde vive el marco teórico y cuál de las dos copias desaparece.
- Qué hace el skill `rubricas-lomloe` y qué hace la app, porque hoy se solapan en la conversión a 10 y en la exportación a iDoceo. La división más limpia es que la app construya el instrumento y el skill califique con él, pero es tu decisión.

**No tocar:** el proyecto de lengua. Todo lo anterior son propuestas; ningún archivo suyo se ha modificado.
