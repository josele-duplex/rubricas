# Plan de rediseño de la portada

**Estado:** propuesta, sin implementar · 4 de agosto de 2026
**Alcance:** `index.html`, `css/styles.css`, `css/print.css`, y el marcado que emite `js/ui.js` para la barra de pestañas.
**Fuera de alcance:** contenido curricular, motor, validador, calificación. Este plan no toca ningún `.json` de `data/`.

---

## 1. Diagnóstico

El encargo se resume en tres quejas, y las tres tienen causa localizable en el CSS actual.

### 1.1 «Demasiado blanco y muy poco contraste»

No es una impresión: es aritmética del `:root`.

| Token | Valor | Papel |
|---|---|---|
| `--papel` | `#ffffff` | fondo de todas las tarjetas |
| `--fondo` | `#f4f2ee` | fondo de página |
| `--linea` | `#d8d3ca` | todos los bordes |

Toda la mitad superior de la pantalla se pinta con esos tres valores, que están dentro de un margen de luminancia del 6 %. El único color saturado del sistema —`--acento: #7a3b2e`— aparece **una sola vez por encima del pliegue**, en el `summary` de las microexplicaciones, y en el botón *Generar*, que queda por debajo. Los cuatro colores de bloque LOMLOE (`--bloque-a` a `--bloque-d`) existen, están bien elegidos y **no se usan en la portada en absoluto**: entran solo cuando ya se ha generado la rúbrica. De ahí la sensación exacta que describe el encargo: el interior tiene color, la portada no.

### 1.2 «Parece un documento de Google o el formulario de un ayuntamiento»

También es identificable, y no es cuestión de gusto sino de gramática visual:

- **Cabecera centrada** con título y subtítulo en versalitas espaciadas sobre blanco, separada por una regla horizontal. Ese es literalmente el encabezado de un certificado administrativo. El centrado es la marca del documento; las aplicaciones alinean a la izquierda.
- **Tres `<fieldset>` apilados** con `legend` en gris, mayúsculas y numerada («1.», «2.», «3.»), cada uno con `label` gris encima de un `select` a todo el ancho. Esa pila es el formulario de sede electrónica.
- **Cuatro desplegables y un campo de texto**, todos idénticos, todos del mismo alto, todos del mismo color. Un formulario tiene desplegables; una aplicación tiene controles.
- **Cero jerarquía de tamaño.** El título va a `1.5rem` y el `h2` de la tarjeta a `1.2rem`: nada domina, así que la vista no tiene dónde entrar.

La identidad editorial de papel (commit `4b64e98`) es buena y **no se tira**. El problema no es que sea sobria: es que la sobriedad se está aplicando al 100 % del lienzo, y una portada necesita un punto de anclaje.

### 1.3 «Demasiado scroll vertical»

Medido sobre el marcado actual, a 1080p: la cabecera ocupa ~140 px, y luego vienen cuatro `fieldset` a ancho completo dentro de una columna de 900 px. Cada uno gasta una fila entera para un control de 40 px de alto. El botón *Generar* cae alrededor de los 900-1000 px, es decir, **fuera de la primera pantalla**. Y una vez generada la rúbrica, el formulario entero sigue ahí ocupando su pantalla: hay que atravesarlo cada vez para volver al resultado.

---

## 2. Dirección de diseño: «mesa de trabajo»

Una banda de tinta a sangre arriba, y sobre ella, montada, una única tarjeta de configuración compacta. Es el gesto que separa una aplicación académica moderna de un documento: **el documento es todo papel; la aplicación tiene una superficie de trabajo y encima el papel.**

La identidad se conserva —serif editorial, sin iconografía genérica, grano de papel— pero pasa a tener dos registros en vez de uno: **tinta** (la banda, el cromo de la app) y **papel** (las tarjetas, el instrumento). Eso resuelve además la coherencia con el interior: la rúbrica sigue siendo papel blanco, y ahora el marco que la rodea sabe que es una app.

### 2.1 Banda de tinta

- Franja a sangre, ~200 px, en degradado de `--tinta` (`#1c1f26`) hacia una versión profunda de `--acento`, con el ruido SVG que ya existe en `body::before` aplicado encima. Coste cero en peso: la textura ya está escrita.
- Título **alineado a la izquierda**, en serif grande (~2.4rem), blanco. El subtítulo pierde las versalitas espaciadas y pasa a una línea normal en blanco al 70 %.
- A la derecha, tres datos cortos en columna que además explican la app a quien la abre por primera vez: `LOMLOE · Región de Murcia` · `4 niveles de logro` · `7 instrumentos por tarea`. No son adorno: son la respuesta a «¿qué es esto?».
- **El primer cambio y el más rentable.** Los primeros 200 px pasan de un rango de contraste del 6 % al máximo posible.

### 2.2 Una sola tarjeta de configuración, montada sobre la banda

Desaparecen los tres `<fieldset>` apilados. Queda una tarjeta con `margin-top` negativo (~-40 px) que invade la banda, con sombra suave. Dentro:

- **Fila superior de tres columnas** (grid, `1fr 1fr 1fr`): las tres decisiones del modo exprés, una al lado de otra. En móvil, `grid-template-columns: 1fr` y se apilan.
- **Fila inferior a ancho completo**: el campo de actividad, que es el único que necesita el ancho de verdad.
- El botón *Generar* al final de la tarjeta, alineado a la derecha.

Solo con esto, el formulario baja de ~1000 px a ~280 px.

### 2.3 Controles segmentados donde el desplegable sobra

- `tiempo` (3 opciones) y `puerta` (4 opciones) pasan a **grupos de botones segmentados**: se ven todas las opciones sin desplegar nada, no hay clic a ciegas, y aportan ritmo visual y color.
- `curso` (6) y `tipo-tarea` (variable según el pack) siguen siendo `<select>`, pero restilizados con fondo propio y borde más marcado.
- Accesibilidad: los segmentados se implementan como `<input type="radio">` con `<label>`, no como `<button>`, para conservar navegación por teclado, `:focus-visible` y el `required` nativo. El `name` se mantiene, así que `js/main.js` sigue leyendo lo mismo — cambia el selector, no el modelo de datos.

Este es el punto que de verdad quita el aire de formulario. Los formularios tienen desplegables; las aplicaciones tienen controles.

### 2.4 El color de bloque sube a la portada

Los cuatro colores de bloque LOMLOE ya existen y están bien. Se usan como acento del numeral de cada paso (1 · 2 · 3) en la tarjeta de configuración. La portada y el interior dejan de ser dos paletas: pasan a ser la misma, vista antes y después de generar.

### 2.5 Retoque de tokens

- `--fondo` se calienta y se oscurece un punto (de `#f4f2ee` a algo en torno a `#ebe7e0`) para que las tarjetas blancas se despeguen de verdad.
- `--linea` gana contraste para bordes de control (un token nuevo, `--linea-fuerte`), manteniendo `--linea` para las líneas finas de tabla, que en impresión deben seguir siendo suaves.
- Se añaden `--tinta-banda-1` y `--tinta-banda-2` para el degradado, con sus valores de modo oscuro.

### 2.6 Coherencia del interior

- **Barra de pestañas**: pasa a fondo de tinta con la pestaña activa en papel, en vez de gris sobre gris. Mantiene la forma de separador de carpeta, que funciona.
- **Cabecera de tabla de rúbrica**: hoy es prácticamente blanca; pasa a la tinta suave de la banda, para que la rúbrica en pantalla y el marco de la app se reconozcan.
- El resto del interior (colores de nivel N1-N4, avisos, indicadores) **no se toca**: ya tiene el contraste que la portada necesitaba.

---

## 3. El scroll, después de generar

La queja de scroll tiene dos mitades. La primera —el formulario largo— la resuelven §2.2 y §2.3. La segunda no tenía propuesta en el encargo, y es la que más molesta en uso real:

> Una vez generada la rúbrica, el formulario sigue ocupando una pantalla entera por encima del resultado.

**Propuesta: la tarjeta de configuración se colapsa al generar.** Al enviar el formulario, la tarjeta se sustituye por una barra de una línea con el resumen de lo elegido y un botón para reabrirla:

```
Texto expositivo · 3.º ESO · de 2 a 5 min · «El reciclaje en el instituto»        [ Cambiar ]
```

El resultado sube a la primera pantalla. Reabrir devuelve la tarjeta con los valores puestos. Implementación: un `hidden` sobre la tarjeta y un `<section>` de resumen, cableado en `js/main.js` en el mismo punto donde hoy se pinta `#resultado`. No requiere estado nuevo: `configActual` ya guarda las cuatro decisiones.

Opcional, si en revisión se ve necesario: hacer la barra `position: sticky` en el borde superior, de modo que siga visible al recorrer una rúbrica larga.

---

## 4. Riesgos y guardarraíles

| Riesgo | Guardarraíl |
|---|---|
| La banda de tinta se imprime y gasta tóner | `print.css` ya fuerza fondos a blanco; hay que añadir explícitamente `display: none` sobre la banda y sobre la barra de resumen. **Comprobar imprimiendo, no leyendo.** |
| El modo oscuro se rompe | Todo token nuevo se declara también en `@media (prefers-color-scheme: dark)`. En oscuro la banda no puede ser más oscura que el fondo: se invierte a un tono de acento profundo. |
| Reintroducir iconografía genérica | El commit `4b64e98` retiró todos los emojis a propósito. Los segmentados y la banda se resuelven con tipografía y color; **ningún icono, ningún emoji.** |
| Romper el cableado de `js/main.js` | Se conservan los `id` y `name` de los cinco controles. Si un `<select>` pasa a radios, `main.js` debe leer con `form.elements.<name>.value`, no con `getElementById(...).value` — es el único punto de código a revisar. |
| Regresión de accesibilidad | Contraste AA en la banda (texto blanco sobre tinta lo cumple de sobra), `:focus-visible` visible sobre fondo oscuro, y los segmentados navegables con flechas por ser radios de un mismo `name`. |
| Divergencia con el SDD | §11.1 describe el modo exprés como «tres decisiones». La estructura no cambia, solo su presentación; basta una nota en §11.1 y una entrada de versión en §0. |

---

## 5. Orden de ejecución

1. **Tokens** (`:root` y su bloque oscuro): banda, `--linea-fuerte`, `--fondo` recalibrado. Sin tocar marcado. Verificar que el interior no se degrada.
2. **Banda de tinta** en `index.html` + `css/styles.css`. Captura antes/después.
3. **Tarjeta de configuración**: grid de tres columnas, montaje sobre la banda, botón a la derecha.
4. **Controles segmentados** para `puerta` y `tiempo`, con el ajuste de lectura en `js/main.js`.
5. **Colapso al generar** + barra de resumen (§3).
6. **Coherencia del interior**: pestañas y cabecera de tabla.
7. **`print.css`**: ocultar banda y barra de resumen. Imprimir una rúbrica y una ficha del alumno y mirarlas.
8. **Modo oscuro**: recorrer las siete pestañas.

Los pasos 1-3 ya cambian la primera impresión por completo; si hubiera que parar, es un punto de parada válido.

---

## 6. Modelo y sesión

**Modelo: Opus 5.** Es una tarea de criterio visual, no de volumen: hay que decidir cuánto contraste es «moderno» sin dejar de ser editorial, y mantener coherencia entre `styles.css` (698 líneas), `index.html`, `print.css` y el marcado que emite `js/ui.js`. Sonnet 5 bastaría para los pasos 1 y 7 (mecánicos), pero el juicio de «esto ya no parece un formulario» es el 80 % del encargo.

**Sesión nueva: sí, conviene.** La sesión actual tiene el contexto cargado de currículo, packs y SDD —material que no interviene aquí— y el trabajo de diseño necesita sitio para el CSS completo y para las capturas de cada iteración.

**Cómo abrir la sesión nueva.** Con el servidor de vista previa arriba desde el primer momento, mirando la pantalla antes de tocar nada. Un rediseño visual no se valida leyendo CSS. Conviene además cargar la skill `frontend-design` al empezar.

Prompt sugerido para abrirla:

> Rediseño visual de la portada de la app de rúbricas, según `docs/diseno/plan-rediseno-portada.md`. Abre primero la vista previa y hazme una captura del estado actual. Luego ejecuta los pasos 1 a 3 del plan (tokens, banda de tinta y tarjeta de configuración) y enséñame el resultado antes de seguir con los segmentados.
