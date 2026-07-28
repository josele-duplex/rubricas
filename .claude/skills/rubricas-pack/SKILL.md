---
name: rubricas-pack
description: Protocolo para redactar o modificar un pack de criterios de evaluación de este proyecto (data/*.json). Úsalo siempre que haya que añadir un tipo de tarea, un curso nuevo, una dimensión, descriptores o una matriz cuantitativa; y también al revisar un pack existente. Cubre la trazabilidad al currículo, el banco de verbos, la redacción de los cuatro niveles, las matrices cuantitativas y las dos pruebas obligatorias antes de cerrar.
---

# Redactar un pack de criterios

Un pack es un `.json` en `data/` con el contenido curricular de un tipo de tarea. Es la fuente
de todo lo que la aplicación produce. El código se puede reescribir; un pack mal redactado
contamina todas las rúbricas que salgan de él.

Antes de empezar, lee `docs/diseno/SDD.md` §5 (modelo de datos) y §6 (calificación).

## Paso 1 · Localizar el criterio oficial, leyéndolo

Abre `fuentes/curriculo/curriculo-ESO-Murcia-lengua.md` (o el de Bachillerato) y busca los
criterios **del curso concreto**, no del ciclo. Los criterios están agrupados por curso
(«Primer curso», «Segundo curso»…) y dentro por competencia específica.

Copia la cita **literal**. Nunca de memoria, nunca parafraseada. Si no encuentras un criterio
que sostenga lo que quieres evaluar, la conclusión es que en ese curso no se evalúa eso:
comprueba la matriz de tarea × curso del SDD §4.3 antes de seguir.

Rellena también `perfil_salida` con los descriptores del Perfil de salida que el currículo
asocia a esa competencia específica (aparecen tras la descripción de cada una).

## Paso 2 · Situar el criterio en los ejes de progresión

`progresion` tiene tres ejes (autonomía, complejidad, metalingüístico) con valores 1 a 4
(SDD §5.4). No los inventes: **léelos en la redacción del criterio**.

| Lo que dice el criterio | Lo que significa |
|---|---|
| «sencillos», «de manera guiada», «con ayuda de pautas y modelos» | eje en 1 |
| «de cierta extensión», «progresivamente autónoma» | eje en 2 |

La exigencia entre cursos la fija el currículo. Tu trabajo es reflejarla, no calibrarla.

## Paso 3 · Redactar los cuatro descriptores

Fórmula: `[verbo del banco] + [objeto o saber-vehículo] + [condición o finalidad]`.

- **El verbo debe estar en el banco del pack.** Si falta, añádelo con sus dos formas
  (3.ª y 1.ª persona) — cuidado con los irregulares: *Reconoce/Reconozco*, *Corrige/Corrijo*.
- **El nivel 1 describe lo que el alumno sí hace**, de forma limitada. Nunca «No utiliza…».
- **Los modalizadores del criterio deben aparecer** en los descriptores del curso:
  si el criterio dice «de manera guiada», el descriptor dice «con la pauta facilitada».
- **Nada de adverbitis**: *bien*, *adecuadamente*, *a veces*, *bastante*, *frecuentemente*.
- **El saber es vehículo**: va dentro del descriptor, no en el nombre de la dimensión.

Cuidado especial con el **N4 de los cursos bajos**: es donde más fácil es pasarse. Pregúntate
si un alumno bueno de ese curso hace eso de verdad. Pero si el criterio oficial lo pide
(el 9.1 de 1.º ESO ya exige «argumentar los cambios»), no lo rebajes: bajarlo dejaría la
rúbrica por debajo de lo que la ley exige.

## Paso 4 · Escribir la matriz cuantitativa, si procede

Solo donde hay **algo que contar**: conectores, faltas, fuentes, párrafos, argumentos.
Donde el juicio es necesariamente global (el ajuste del registro, por ejemplo),
`matriz_cuantitativa` vale `null`, y eso es una decisión correcta, no una carencia.

Reglas aritméticas:

- Los componentes suman exactamente `total` (10).
- Cada componente tiene bandas descendentes, la más alta igual a su `max`, y una banda de 0.
- Las condiciones son **contables**: «4 o más tipos distintos de marcador», no «conectores variados».
- Toda penalización declara `tope` negativo, y no pasa del 35% de la dimensión.
- **Regla del doble castigo:** una penalización no puede medir lo que ya mide un componente.
  Si el fenómeno merece medirse, casi siempre debe ser un componente con su banda.

La matriz es la traducción operativa del descriptor, **nunca lo sustituye**. Si al aplicarla
sale un nivel distinto del que pondría el profesor leyendo el descriptor, se ajusta la matriz.

## Paso 5 · Las dos pruebas obligatorias

Ninguna de las dos es opcional y ninguna se sustituye por releer el pack.

```bash
python scripts/validar_pack.py data/<pack>.json
```

Debe salir sin errores. Los avisos se leen y se decide, pero no bloquean.

```bash
python scripts/simular_correccion.py data/<pack>.json <CURSO>
```

Mira el resultado y pregúntate si le pondrías esa nota a un alumno con ese perfil.
**Si una dimensión cae dos niveles de golpe, sospecha de las penalizaciones**: así se
descubrió el doble castigo, calculando y no leyendo.

## Paso 6 · Regenerar la revisión docente

```bash
python scripts/generar_revision.py data/<pack>.json
```

Escribe `docs/revision-<pack>.md`, que es lo que se le pasa al docente para validar.
Es un derivado: no se edita a mano, se regenera.

## Al presentar el trabajo al docente

Señala explícitamente estas tres cosas, que son las que de verdad necesitan su criterio:

1. **El N4 de los cursos bajos** — si es alcanzable en el aula real.
2. **Los umbrales numéricos de las matrices** — cuántos conectores, cuántas faltas.
   Son los números que más van a chirriar si no coinciden con lo que ve en clase.
3. **El reparto de pesos** — es una postura, no un dato.
