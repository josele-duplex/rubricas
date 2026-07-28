# Generador de instrumentos de evaluación · Rúbricas LOMLOE

Aplicación web para que el profesorado de **Lengua Castellana y Literatura** construya rúbricas
derivadas del currículo oficial de la Región de Murcia, con la hoja del alumno incluida.

Funciona en el navegador, sin servidor, sin cuentas y sin enviar nada a ninguna parte.

---

## La idea

El objetivo del proyecto **no es que existan más rúbricas, sino que profesores y alumnos sepan
usarlas**. De ahí las tres decisiones que explican todo lo demás:

1. **Las rúbricas se derivan, no se inventan.** Cada dimensión cita textualmente el criterio de
   evaluación oficial del que procede. Un criterio sin referencia normativa no se carga: no es un
   instrumento, es una opinión con formato de tabla.
2. **La aplicación enseña mientras se usa.** Cada control lleva un «¿por qué?» desplegable, y el
   validador no se limita a marcar un fallo: explica la regla que lo sostiene.
3. **La hoja del alumno no es opcional.** Si el alumnado debe conocer la rúbrica antes de la
   prueba, la aplicación la genera siempre.

Las reglas no negociables están en [`CLAUDE.md`](CLAUDE.md). El diseño completo —modelo de datos,
modelo de calificación, catálogo de instrumentos y reglas del validador— vive en
[`docs/diseno/SDD.md`](docs/diseno/SDD.md), que es la única fuente de verdad.

---

## Cómo se usa

Es un sitio estático: basta con servirlo desde cualquier servidor local, porque los módulos ES y la
carga del pack por `fetch` no funcionan abriendo el archivo con doble clic.

```bash
python -m http.server 5173
```

Después, abrir <http://localhost:5173> y seguir el modo exprés: tipo de prueba, curso y tiempo
disponible por alumno. De ahí salen la rúbrica analítica, la lista de cotejo y la ficha del alumno,
listas para imprimir.

---

## Cómo se comprueba el contenido

El contenido curricular se valida con dos programas que aplican **las mismas reglas** (SDD §10):
uno se ejecuta al construir el pack y otro dentro de la propia aplicación. El invariante es que la
aplicación nunca puede dar por limpio un pack que el script rechaza.

```bash
python scripts/validar_pack.py
```

```bash
node test/validar-pack-real.mjs
```

```bash
node test/validar-reglas.mjs
```

El último es la batería de casos del validador: introduce un defecto por regla sobre una copia en
memoria del pack y comprueba que la regla lo detecta. **Si un caso obliga a cambiar el pack, la
regla está mal escrita, no el contenido.**

Además, toda matriz cuantitativa nueva se prueba simulando una corrección antes de darla por buena
(`scripts/simular_correccion.py`). Leerla no basta: la regla del doble castigo se descubrió
calculando, no leyendo.

---

## Estructura

```
index.html          modo exprés y contenedores de la vista previa
css/                estilos de pantalla y de impresión
js/                 motor, validador, microexplicaciones, interfaz, modo avanzado
data/               packs de criterios (.json) — la fuente de todo el contenido
scripts/            validador, generador de revisiones, simulador de corrección
test/               casos dorados del validador (Node, sin dependencias)
docs/diseno/        SDD y análisis de enlace con el proyecto de Lengua
docs/marco/         marco teórico y matrices de referencia
fuentes/            currículo oficial y originales aportados (material crudo)
```

**Sin dependencias y sin proceso de construcción.** Ni framework ni gestor de paquetes: el estado
de la aplicación es una configuración pequeña y un pack de datos, y eso no justifica una
dependencia. Para ejecutar las pruebas basta con Node 18 o superior; para los scripts de contenido,
Python 3.

---

## Estado

| Pieza | Estado |
|---|---|
| Motor de generación y puerta de aplicabilidad | Completo |
| Modo exprés | Completo |
| Modo avanzado | Parcial: pesos y selección de dimensiones |
| Instrumentos | 3 de 7: rúbrica analítica, lista de cotejo y ficha del alumno |
| Validador de calidad (§10) | Completo, 15 reglas, con microexplicación por regla |
| Modelo de calificación | Solo modo cualitativo; el numérico está diseñado, no implementado |
| Exportación | Impresión y PDF; faltan `.xlsx`, configuración `.json` y modo IA |
| Contenido | Texto expositivo en 1.º y 3.º de ESO (2 de las 20 celdas de la matriz §4.3) |

El roadmap por fases está en [`docs/diseno/SDD.md`](docs/diseno/SDD.md) §16, y las decisiones que
siguen abiertas, en §17.

---

## Aviso sobre la IA

La aplicación **no llama a ninguna IA**. Genera el texto de la rúbrica en modo IA para que el
profesor lo use fuera si quiere: no ejecuta prompts, no pide claves y no envía datos.
