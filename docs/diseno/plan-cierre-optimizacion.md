# Plan de cierre de la optimización de contexto

**18-ago-2026.** Lo que quedó pendiente en [`auditoria-contexto.md`](auditoria-contexto.md),
con la investigación hecha y las órdenes exactas. Tres pasos independientes: se
pueden hacer en tres días distintos y en este orden, que va de lo barato y
reversible a lo que pide una decisión.

| Paso | Qué es | Riesgo | Tiempo |
|---|---|---|---|
| 1 · Enchufar el hook | escribir `.claude/settings.json` | ninguno: se desenchufa borrando el bloque | 2 min |
| 2 · Quitar los worktrees | archivar y borrar tres copias del repo | ninguno **si se archiva antes** | 10 min |
| 3 · Decidir los `docs/revision-*.md` | versionarlos bien, o dejar de versionarlos | decisión, no técnica | 5 min |

---

## Paso 1 · Enchufar el freno de lectura

### Qué está ya hecho

`.claude/hooks/coste_lectura.py` está escrito, probado y **falla abierto**: ante
cualquier imprevisto deja pasar la lectura, porque un freno de contexto que rompe
una sesión cuesta mucho más de lo que ahorra.

Compruébalo sin enchufar nada:

```bash
python .claude/hooks/coste_lectura.py --prueba
```

Tiene que imprimir `13/13`: ocho lecturas caras que frena (los nueve packs, el SDD,
su registro de cambios, el decreto, los `docs/revision-*.md` y `js/lexico.js`) y
cinco que pasan (una lectura parcial de ≤400 líneas, un `.js` normal, el catálogo,
el propio `CLAUDE.md`).

### Qué falta

Solo declararlo. **No lo puede hacer el agente**: un hook es código que se ejecuta
solo en cada llamada a una herramienta, y eso lo autoriza una persona. Por eso el
clasificador bloqueó la escritura de `.claude/settings.json`, y está bien que lo
hiciera.

No hay `.claude/settings.json` en el proyecto, así que no hay nada que fusionar: se
crea con este contenido exacto.

```json
{
  "permissions": {
    "allow": [
      "Bash(python scripts/ver.py:*)",
      "Bash(python scripts/dossier_criterios.py:*)",
      "Bash(python scripts/comprobar_todo.py:*)",
      "Bash(python scripts/validar_pack.py:*)",
      "Bash(python scripts/validar_esquema.py:*)",
      "Bash(python scripts/comprobar_paridad.py:*)",
      "Bash(python scripts/verificar_derivacion.py:*)",
      "Bash(python scripts/simular_correccion.py:*)",
      "Bash(node test/:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ]
  },
  "env": {
    "PYTHONIOENCODING": "utf-8"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "python \"$CLAUDE_PROJECT_DIR/.claude/hooks/coste_lectura.py\""
          }
        ]
      }
    ]
  }
}
```

Tres bloques, tres motivos:

- **`hooks`** — el freno. `$CLAUDE_PROJECT_DIR` en vez de una ruta relativa para que
  funcione aunque la sesión arranque desde otra carpeta.
- **`permissions.allow`** — quita el permiso de las órdenes que solo **leen**. Cada
  permiso preguntado es una vuelta entera de conversación —la pregunta, la respuesta
  y el contexto que las rodea— para decir «sí» a un script que no escribe nada.
- **`env`** — los scripts imprimen «§» y acentos; sin esto, en Windows salen rotos, y
  cada carácter roto es un token que no dice nada.

### Cómo escribirlo

En una sesión interactiva de Claude Code, lo más seguro es:

```
/update-config
```

y pedirle que cree `.claude/settings.json` con ese contenido. También vale crear el
archivo a mano con el editor: es JSON normal y no hay nada más que hacer.

Si prefieres que la configuración **no** viaje en el repositorio, el mismo contenido
en `.claude/settings.local.json` y añadir esa ruta a `.gitignore`. Mi recomendación
es que sí viaje: el freno forma parte del método de trabajo del proyecto, igual que
`comprobar_todo.py`.

### Cómo saber que funciona

Después de reiniciar la sesión, pide leer entero un pack. Debe responder con la
orden equivalente barata en vez de con 39.000 tokens. Para desactivarlo, borra el
bloque `hooks` del JSON: el resto sigue siendo útil.

---

## Paso 2 · Los tres worktrees

### Lo que dicen los datos

```
.claude/worktrees/exciting-montalcini-e9bda5   rama claude/exciting-montalcini-e9bda5
.claude/worktrees/festive-chaum-d02387         DETACHED en b7f0ce8
.claude/worktrees/great-curie-e70da5           rama claude/xenodochial-shannon-fb2a5a
```

| Worktree | ¿Commits que master no tenga? | ¿Cambios sin guardar? |
|---|---|---|
| `exciting-montalcini` | **0** (su HEAD `d36098a` ya está en master) | **sí**: 3 archivos, +131 líneas |
| `festive-chaum` | **1**: `b7f0ce8`, y **no está en master** | no, limpio |
| `great-curie` | **0** (su HEAD `9e7f644` ya está en master) | **sí**: 3 archivos, +516 líneas |

**Conclusión: no se pueden borrar tal cual.** Los tres guardan trabajo que no está
en ninguna rama de master:

- `b7f0ce8` («La proyección a 1.ª persona queda cerrada en los cuatro packs», 8
  archivos) cuelga **solo** del HEAD suelto de su worktree. Al quitar el worktree
  deja de estar referenciado y el recolector de basura de git se lo lleva.
- Los cambios sin guardar de los otros dos tocan `test/proyeccion.mjs`, y ahí hay
  casos de prueba cuyo nombre **no aparece en master**: diez en `great-curie`
  (`verbo secundario: lo caza en yuxtaposición…`, `verbo del banco: un sustantivo
  tras preposición y determinante se caza`…) y cinco en `exciting`
  (`primeraPersona: 'aparato de referencias' no reintroduce 'cita' como sustantivo`…).

Master tiene 17 casos y cubre los mismos **conceptos** con otros nombres, así que
lo más probable es que ese trabajo se rehiciera después y esté superado. **Pero
«lo más probable» no es una base para borrar pruebas**, y compararlas una a una
cuesta más que archivarlas.

### El procedimiento: archivar y luego borrar

Convierte lo suelto en algo referenciado —una rama y una etiqueta— y entonces
borrar el worktree ya no puede perder nada. Ejecuta desde la raíz del proyecto.

**2.1 · Salvar el commit huérfano** (es lo único que git podría recoger como basura):

```bash
git tag archivo/proyeccion-primera-persona b7f0ce8
```

**2.2 · Salvar los cambios sin guardar de los otros dos**, cada uno en un commit
sobre su propia rama:

```bash
git -C .claude/worktrees/great-curie-e70da5 add -A
git -C .claude/worktrees/great-curie-e70da5 commit -m "Archivo: trabajo sin cerrar del worktree great-curie"
```

```bash
git -C .claude/worktrees/exciting-montalcini-e9bda5 add -A
git -C .claude/worktrees/exciting-montalcini-e9bda5 commit -m "Archivo: trabajo sin cerrar del worktree exciting-montalcini"
```

**2.3 · Comprobar que no queda nada suelto** antes de borrar:

```bash
git -C .claude/worktrees/great-curie-e70da5 status --porcelain
git -C .claude/worktrees/exciting-montalcini-e9bda5 status --porcelain
git -C .claude/worktrees/festive-chaum-d02387 status --porcelain
```

Las tres órdenes deben imprimir **nada**. Si alguna imprime algo, no sigas.

**2.4 · Quitar los worktrees:**

```bash
git worktree remove .claude/worktrees/great-curie-e70da5
git worktree remove .claude/worktrees/exciting-montalcini-e9bda5
git worktree remove .claude/worktrees/festive-chaum-d02387
git worktree prune
```

**2.5 · Comprobar que se recuperan 7,6 MB y que no se ha perdido nada:**

```bash
git worktree list
git branch --list "claude/*"
git tag --list "archivo/*"
```

Debe quedar un solo worktree (el proyecto), las dos ramas `claude/*` con el trabajo
archivado y la etiqueta `archivo/proyeccion-primera-persona`.

### Después

Las ramas y la etiqueta ocupan unos kilobytes y ya no molestan a ninguna búsqueda.
Cuando compruebes que ese trabajo está de verdad superado —lo natural es mirarlo la
próxima vez que toques `test/proyeccion.mjs`—, se borran así:

```bash
git branch -D claude/xenodochial-shannon-fb2a5a claude/exciting-montalcini-e9bda5
git tag -d archivo/proyeccion-primera-persona
```

**Ese paso sí es irreversible.** No hay ninguna prisa por darlo.

---

## Paso 3 · Los `docs/revision-*.md`

### Lo que dicen los datos

- **Están versionados a medias.** Seis de los nueve están en git; los tres nuevos
  —`investigacion`, `noticia`, `reaccion`— no. Hoy el repositorio ya es incoherente
  consigo mismo.
- **Hoy están al día.** Los regeneré con `python scripts/generar_revision.py` y git
  no detectó ni un cambio en los seis versionados.
- **Nadie comprueba que sigan al día.** `generar_revision.py` no tiene `--comprobar`
  y no está en `comprobar_todo.py`. Son un derivado versionado sin vigilancia: la
  forma exacta de fallo que `CLAUDE.md` nombra —*un hecho escrito dos veces y las
  dos copias separándose en silencio*—. Que hoy coincidan es suerte, no diseño.
- **Tienen un lector de verdad.** `.claude/skills/rubricas-pack/SKILL.md` dice que
  `docs/revision-<pack>.md` es «lo que se le pasa al docente para validar». No son
  chatarra generada: son el entregable de revisión.

### Lo importante: el ahorro ya está cobrado

Los 125.146 tokens que costaban ya no entran en contexto: el `.ignore` los sacó de
todas las búsquedas y el hook del paso 1 impide abrirlos. **Borrarlos de git ya no
ahorra tokens.** Lo que queda es higiene del repositorio, y por eso es tu decisión
y no la mía.

### Opción A — versionarlos bien (recomendada)

Tienen lector, así que que estén en GitHub es una ventaja. Lo que hay que arreglar
no es que estén: es que nadie los vigila.

1. Añadir los tres que faltan:

   ```bash
   git add docs/revision-lcl-investigacion.md docs/revision-lcl-noticia.md docs/revision-lcl-reaccion.md
   ```

2. Darle a `generar_revision.py` un `--comprobar` que regenere en memoria y compare,
   como ya hacen `generar_lexico.py` y `generar_tablas_sdd.py`, y meterlo en
   `comprobar_todo.py` como comprobación catorce. Son unas quince líneas y el patrón
   ya existe dos veces en el proyecto: **pídemelo y lo hago.**

Resultado: los nueve versionados y **imposible** que se separen de `data/` sin que
el CI lo diga.

### Opción B — dejar de versionarlos

Coherente con «el JSON es la fuente; lo demás es derivado», y el proyecto ya trata
así a `assets/icons/`. El precio es que el docente deja de poder leerlos desde
GitHub y hay que regenerarlos antes de pasárselos.

```bash
git rm --cached docs/revision-lcl-*.md
printf '\n# Revisiones GENERADAS: se rehacen con scripts/generar_revision.py\ndocs/revision-*.md\n' >> .gitignore
git add .gitignore
git commit -m "Dejar de versionar las revisiones generadas: se rehacen con una orden"
```

`git rm --cached` **no borra los archivos del disco**, solo los saca del índice.
Siguen ahí y se rehacen en cualquier momento con:

```bash
python scripts/generar_revision.py
```

Si además quieres borrarlos del disco: `rm docs/revision-lcl-*.md`, y a regenerar
cuando hagan falta.

### Lo que no hay que hacer en ninguna de las dos

Editarlos a mano. Eso ya está escrito en `CLAUDE.md` y sigue igual de vigente.

---

## Comprobación final, valga la opción que valga

```bash
python scripts/comprobar_todo.py
python scripts/ver.py coste
```

La primera tiene que imprimir 196 bytes y «las trece comprobaciones están limpias»
(catorce, si haces la opción A). La segunda dice si alguna zona ha vuelto a crecer
sin que nadie se diera cuenta.
