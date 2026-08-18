# Auditoría de consumo de contexto

**18-ago-2026.** Por qué una sesión de trabajo con un asistente se agotaba antes de
terminar el arreglo, y qué se ha cambiado para que deje de pasar.

El diagnóstico no es una impresión: todo lo que sigue está medido, y se vuelve a
medir con una orden.

```bash
python scripts/ver.py coste
```

---

## El tamaño del problema

| Zona | Archivos | ~Tokens |
|---|---:|---:|
| packs (`data/pack-*.json`) | 9 | 243.226 |
| SDD | 1 | 42.158 |
| currículo y fuentes | 4 | 77.090 |
| revisiones **generadas** (`docs/revision-*.md`) | 9 | 125.146 |
| resto de `docs/` | 8 | 98.111 |
| aplicación (`js/`) | 10 | 38.510 |
| herramientas (`scripts/`) | 14 | 39.684 |
| instrucciones fijas (`CLAUDE.md`, `README.md`) | 2 | 4.996 |
| **total** | | **~675.000** |

Una ventana de contexto son 200.000 tokens. **El repositorio cabe 3,4 veces dentro
de él, no al revés.** Cualquier método de trabajo que consista en «abrir el archivo
y mirar» está garantizando que la sesión se agote: tres lecturas de un pack y media
del SDD ya son la sesión entera, sin haber escrito una línea.

---

## Las tres fugas

### 1. Se abrían enteros archivos de los que se necesitaba el 1 %

Es, con diferencia, la mayor. Tocar un descriptor obligaba a cargar el pack
completo (39.000 tokens) porque no había forma de pedir menos; comprobar una regla
del validador obligaba a cargar el SDD (60.000); citar un criterio obligaba a
cargar el decreto (30.000). El propio `CLAUDE.md` lo pedía: *«antes de tocar
contenido curricular, lee `docs/diseno/SDD.md`»* — una instrucción de 60.000 tokens
escrita en once palabras.

Agravante: **un tercio del SDD era su registro de cambios**, 20.221 tokens de
historia colocados en la cabecera. Cualquier lectura parcial del documento —las
primeras N líneas— traía el pasado en lugar del diseño.

Segundo agravante: `docs/revision-*.md` son 125.146 tokens **generados desde los
packs**. No contienen un solo hecho que no esté en `data/`. Cada vez que uno de
ellos entraba en contexto se pagaba dos veces por la misma información.

### 2. Cada búsqueda devolvía el proyecto cuatro veces

`.claude/worktrees/` guarda tres copias completas del repositorio: 7,6 MB, más que
el proyecto entero. No estaban excluidas de nada, así que `grep`, `find` y las
herramientas de búsqueda descendían a ellas.

Medido: `grep -rl "conectores"` devolvía **64 archivos, y 43 eran copias** — dos de
cada tres resultados eran el mismo texto repetido, que además había que leer para
descubrir que era el mismo. Y son copias *viejas*: contienen versiones anteriores
de los packs y del SDD, así que el ruido no era solo caro, era **contradictorio**.
Esa es la vía por la que una sesión «arregla» algo que ya estaba arreglado.

### 3. Las herramientas hablaban igual cuando todo iba bien

`comprobar_todo.py` escribía **24.459 bytes (~6.000 tokens) en una pasada limpia**,
para comunicar un hecho que cabe en una línea: las trece están bien. Es la orden
que más veces se ejecuta en una sesión.

Y la parte mecánica del juicio la hacía el modelo: `simular_correccion.py --todos`
imprimía 28.872 bytes de tablas, y leerlas consistía en recorrerlas buscando
siempre los mismos cinco patrones —un salto de dos niveles, un umbral plano, un
cero, una nota fuera de orden—. Buscar patrones en una tabla numérica es
exactamente lo que no debe hacer un modelo de lenguaje: sale caro y sale mal.

---

## Lo que se ha cambiado

### Arquitectura de lectura: `scripts/ver.py`

Un lector quirúrgico. No valida, no corrige y no decide: recorta.

```bash
python scripts/ver.py packs                        qué packs hay y qué cuestan
python scripts/ver.py pack expositivo              índice: una línea por criterio
python scripts/ver.py pack expositivo --curso 3ESO
python scripts/ver.py criterio <id|código>         un criterio con su cita
python scripts/ver.py sdd                          índice del SDD, con el coste de cada §
python scripts/ver.py sdd 6.3                      solo esa sección
python scripts/ver.py doc <ruta.md> --seccion X    cualquier Markdown largo
python scripts/ver.py buscar "hiperónimos"         una línea por acierto
python scripts/ver.py coste                        la tabla de arriba, al día
```

| Lo que se necesita | Antes | Ahora | Factor |
|---|---:|---:|---:|
| ver los criterios de un pack | 39.040 tok | 746 tok | **52×** |
| ver un criterio con su cita | 39.040 tok | ~200 tok | **195×** |
| leer el modelo de descuentos (§6.3) | 60.080 tok | 1.560 tok | **38×** |
| localizar dónde se dice algo | pack entero | ~300 tok | — |

Lo que **no** cambia: el JSON sigue siendo la fuente, las citas se siguen sacando
del texto real del decreto (con `scripts/dossier_criterios.py`, que ya existía y
hace exactamente esto para el currículo) y ninguna regla se ha relajado.

### El SDD adelgaza un 30 %

El registro de cambios se ha mudado a `docs/diseno/SDD-cambios.md` sin tocar ni una
línea de su contenido; el SDD conserva en la cabecera las tres entradas más
recientes y el puntero. **60.080 → 42.158 tokens.** Todo cambio de diseño se sigue
anotando, y ahora el principio del documento es el diseño y no la historia.

### Las búsquedas dejan de ver las copias

Un archivo `.ignore` en la raíz (y `.claude/worktrees/` en `.gitignore`) saca de
toda búsqueda las tres copias del repositorio, los derivados y los binarios.
Medido: **64 → 17 archivos**, y ninguno es ya un `docs/revision-*.md`.

Las copias siguen en el disco y se pueden leer a propósito con una ruta explícita.
Lo que ya no pueden es aparecer solas.

### Las herramientas se callan cuando aciertan

`comprobar_todo.py` es callado por defecto: la comprobación que pasa no dice nada,
la que falla escribe su salida entera, y los avisos salen en una línea. Con
`--detallado` vuelve el comportamiento anterior. Además fija `PYTHONIOENCODING` en
los procesos hijos, porque los acentos y el «§» salían rotos en Windows y cada
carácter roto es un token que no dice nada.

**24.459 → 196 bytes en una pasada limpia (−99,2 %).** El CI no cambia: sigue
ejecutando la misma orden, y si algo falla lo cuenta entero.

### El cálculo mecánico se delega al código

`simular_correccion.py --resumen` calcula lo que se recorría a ojo y deja sobre la
mesa solo las celdas sospechosas:

- una dimensión que **cae dos niveles de golpe** entre dos perfiles seguidos —los
  perfiles están a un nivel exacto de distancia, así que dos es la firma del doble
  castigo (SDD §6.3);
- una dimensión donde **los cuatro alumnos caen en el mismo nivel**: el umbral no
  mide, decora;
- una dimensión que **llega a 0** en un alumno que aprueba, o en 1.º de ESO;
- una **nota final fuera del orden** de los perfiles;
- una dimensión **inalcanzable** para el alumno solvente o **regalada** al de riesgo.

**28.872 → 5.617 bytes**, y el juicio sigue entero: la última línea sigue siendo
*¿le pondrías esta nota a un alumno con este perfil?* Sigue **sin** entrar en
`comprobar_todo.py`, porque sigue sin devolver un booleano.

> **Hallazgo de la primera ejecución.** En `pack-lcl-narracion.json` el modo
> `--resumen` marca 13 dimensiones en 3 cursos, y casi todas por el mismo motivo:
> el perfil «justo» —el alumno que aprueba— aterriza en el **nivel 1**. Puede ser
> la banda 2 de las matrices o el mapa perfil→banda del simulador; es exactamente
> la clase de cosa que hay que mirar con criterio docente, y por eso el script la
> señala en lugar de decidirla.

### Las instrucciones fijas dicen la regla, no la historia

`CLAUDE.md` entra **entero y en cada sesión**. Se ha quedado con las nueve reglas y
con lo operativo; los motivos —que solo hacen falta cuando se va a *cambiar* una
regla— están en `docs/diseno/por-que-estas-reglas.md`. Ninguna regla se ha
suavizado: siguen siendo las mismas nueve, palabra por palabra en lo que obligan.

A cambio, `CLAUDE.md` gana la sección **«Presupuesto de contexto»**, que es la que
de verdad cambia el comportamiento: una tabla de «en vez de abrir esto, ejecuta
esto», con el coste al lado.

---

## Lo que falta, y no lo puede hacer el agente

### 1. Enganchar el freno de lectura (2 minutos, decisión tuya)

Está escrito y probado: `.claude/hooks/coste_lectura.py`. Cuando algo intenta abrir
entero un pack, el SDD, el decreto o un derivado, responde con la orden concreta
que trae lo mismo por una fracción del coste. No prohíbe nada: una lectura parcial
(≤400 líneas) y `sed -n 'INI,FINp'` siguen pasando.

No está activo porque activarlo es escribir `.claude/settings.json`, y un hook es
código que se ejecuta solo: eso lo autoriza una persona, no un agente. Para
activarlo, en una sesión interactiva:

```
/update-config
```

y pídele que añada el hook `PreToolUse` sobre `Read` con la orden
`python .claude/hooks/coste_lectura.py`, más `PYTHONIOENCODING=utf-8` en `env` y
los `scripts/*.py` de solo lectura en `permissions.allow` (cada permiso preguntado
es una vuelta entera de conversación para decir «sí» a un script que no escribe
nada).

### 2. Quitar los tres worktrees (decisión tuya: hay trabajo dentro)

`.claude/worktrees/` son 7,6 MB en tres copias, una de ellas en *detached HEAD*.
Excluirlas de las búsquedas ya resuelve el coste; borrarlas resuelve también la
confusión de tener versiones viejas de los packs en el disco. **Comprueba antes que
no queda nada sin guardar en ellas**, y entonces:

```bash
git worktree list
git worktree remove .claude/worktrees/great-curie-e70da5
git worktree remove .claude/worktrees/festive-chaum-d02387
git worktree remove .claude/worktrees/exciting-montalcini-e9bda5
git worktree prune
```

### 3. Dos cosas que se han medido y se dejan como están

- **La tabla §4.3 del SDD son 10.805 tokens** —una cuarta parte de lo que queda del
  documento— y es **generada**. Podría vivir en su propio archivo, como el registro
  de cambios. No se ha tocado porque la prosa que la justifica está entrelazada con
  ella y separarlas es una decisión de diseño del documento, no de coste.
- **`docs/revision-*.md` (125.146 tokens) podrían no estar versionados**, ya que se
  regeneran con una orden. Se han sacado de las búsquedas, que es el 90 % del
  beneficio; borrarlos del repositorio cambia cómo se lee el proyecto desde GitHub
  y eso no es una decisión de contexto.

---

## Cómo saber si esto sigue funcionando

```bash
python scripts/ver.py coste          # ¿ha crecido alguna zona sin darse cuenta?
python scripts/comprobar_todo.py     # ¿sigue todo limpio? (196 bytes si sí)
```

Y la regla corta, que es la que hay que recordar: **si una orden escribe más de
media pantalla cuando todo va bien, la orden está mal escrita.**
