# Documento de Diseño de Software (SDD)

## Generador de Instrumentos de Evaluación — Lengua Castellana y Literatura (LOMLOE)

**Versión 1.27** · Documento de trabajo · Agosto 2026
Autor: Josele · Diseño técnico: Claude

---

## 0. Registro de cambios

| Versión | Cambios |
|---|---|
| **1.27** | **Los umbrales de faltas del comentario dejan de ser los del texto expositivo: se recalibran a la extensión de la tarea** (`data/pack-lcl-comentario.json` v0.2.1, componente de ortografía de los cinco cursos). La v1.26 los copió tal cual y lo dejó escrito —«con los mismos umbrales de faltas que los otros packs»—, y con eso se desmontaba a sí misma: esa misma entrada mantiene el 15 % de la corrección idéntico en los cinco packs **«para que una falta de ortografía no valga distinto según la tarea»**, y un umbral escrito en faltas absolutas hace justo lo contrario en cuanto los textos no miden lo mismo. **Se ve calculando, no leyendo** (§15). Mismo alumno de 4.º ESO, tres faltas por cada cien palabras: en el texto expositivo (~400 palabras) comete 12 faltas y se lleva 0 de 4 en el componente; en el comentario (~200 palabras) comete 6 y se lleva 2 de 4. No es un alumno mejor: es el mismo alumno midiéndose contra un umbral pensado para el doble de texto. Los umbrales pasan de `hasta 2 / 3-5 / 6-9 / 10 o más` a **`hasta 1 / 2-3 / 4-5 / 6 o más`**, que es la misma densidad de faltas de los otros packs traducida a la extensión del comentario, con los cortes redondeados hacia arriba para no adelantar la banda de 0. Efecto lateral buscado: la banda alta se endurece en densidad conforme crece el texto —0,8 % en 1.º de ESO y 0,36 % en 2.º de Bachillerato—, que es la dirección del techo de progresión (§5.4) y no hubo que calibrarla, sale de que el comentario se alarga curso a curso. **`scripts/simular_correccion.py` gana perfiles de alumno** (`--perfil`, `--todos`): cuatro alumnos coherentes —solvente, medio, justo, en riesgo— en lugar de sortear cada componente por separado, que producía alumnos que no existen y, sobre todo, desligaba el número de faltas de la extensión del texto, que es exactamente lo que había que mirar. Los umbrales no se copian al script: se leen de la condición de cada banda del pack, y un componente cuya última banda es un juicio del corrector («errores sistemáticos que obligan a reconstruir el sentido») se declara no contable y se resuelve por el nivel del perfil, sin fingir que se alcanza con un número. La extensión orientativa de cada tarea vive en el script y no en el pack, porque no se deriva de ninguna fuente: el decreto no cuenta palabras. Los otros cuatro packs se pasaron por los mismos perfiles sin tocarlos, y ninguno mueve un umbral. Batería de cierre completa, 12 de 12. Queda abierta la decisión 17. |
| **1.26** | **El comentario de texto literario incorpora la corrección normativa, la dimensión que la v1.25 dejó fuera a propósito** (`data/pack-lcl-comentario.json` v0.2.0, 29 criterios: cinco nuevos, uno por curso). El motivo de entonces era bueno a medias: la puerta del comentario es el 8.1 y esta dimensión no cuelga del 8.1. Cuelga del **5.2**, que está redactado en los cinco cursos del pack y **escala solo en el modalizador**, como todo lo demás: *"Incorporar procedimientos básicos para enriquecer los textos propios"* (1.º ESO) → *"Incorporar progresivamente procedimientos para enriquecer los textos"* (3.º) → *"Incorporar procedimientos para enriquecer los textos"* a secas (4.º ESO y los dos de Bachillerato). Que una tarea reúna dimensiones de dos criterios distintos no es una excepción: es lo que ya hacían los otros cuatro packs, donde el 9.1 sostiene la planificación y el 5.1 el resto. La `progresion` sale de ahí sin calibrar nada: 1-1-1 en 1.º ESO por *"básicos"*, 2-2-2 en 3.º, 3-3-3 en 4.º y 3-4-4 en Bachillerato, todos en el techo de su curso (§5.4). **Lo que la dimensión mide es del comentario y no una copia del expositivo**: el presente con que se habla del texto y la correlación temporal del estilo indirecto al recoger lo que el texto dice —a partir de 4.º ESO, que es donde el saber lo nombra: «Uso coherente de las formas verbales en los textos. Correlación temporal en la coordinación y subordinación de oraciones, y en el discurso relatado»—, y en Bachillerato la norma tipográfica de títulos y nombres propios. **Lo que NO mide, y es deliberado, es la marca de la cita** (comillas y referencia de verso o línea): ya la mide el componente homónimo de `evidencia_textual`, y contarla dos veces es la regla 7 de `CLAUDE.md` leída entre dimensiones y no entre penalización y componente. Cinco matrices cuantitativas nuevas, ninguna con penalizaciones, con los mismos umbrales de faltas que los otros packs. **Reajuste de pesos en los cinco cursos:** el 15 % de la corrección —el mismo en los cinco packs, para que una falta de ortografía no valga distinto según la tarea— sale de las dimensiones auxiliares (evidencia, contexto, estructura, metalenguaje) y no del núcleo, que sigue siendo análisis + interpretación en todos los cursos. Efecto colateral que el docente debe ver: 1.º Bach y 2.º Bach pasan a **siete dimensiones**, por encima del umbral de sostenibilidad de cinco (§7), así que el instrumento completo solo se sostiene marcado como producto final integrador. Batería de cierre completa, 12 de 12. |
| **1.25** | **Primer tipo de tarea de la fase 3: comentario de texto literario** (`data/pack-lcl-comentario.json`, v0.1.0, 24 criterios), dado de alta en `data/catalogo.json` y en `data/derivacion-lcl.json` sin tocar una línea de código, que es lo que `docs/diseno/anadir-una-materia.md` exigía. **La puerta es el 8.1, y el 8.1 obliga a leerlo curso a curso**: la fila no se escribe en los tres cursos pedidos (3.º ESO, 4.º ESO, 1.º Bach) sino en **cinco**, porque el criterio también la sostiene en 1.º ESO y en 2.º Bach — y **deja vacía 2.º ESO**, que es el hallazgo de esta versión. En 2.º ESO el 8.1 **es otro criterio**, el de los vínculos intertextuales (*"Establecer de manera guiada vínculos argumentados entre los textos leídos y otros textos escritos, orales o multimodales"*), así que ningún criterio del curso pide explicar una obra a partir del análisis de sus elementos. Es **la regla 9 de CLAUDE.md leída al revés y por primera vez**: los saberes de 2.º ESO sí nombran la tarea (*"Expresión, a través de procesos y soportes diversificados, de la interpretación y valoración personal de obras y fragmentos literarios"*), pero un saber no abre una celda. Donde las otras tres filas de 2.º ESO están en ○ por «criterio sí, saber no», esta queda vacía por «saber sí, criterio no», y es el primer hueco intermedio de la matriz §4.3. **La progresión está escrita y no se calibra**: 1.º ESO trae el andamiaje dentro del criterio (*"con la ayuda de pautas y modelos"*) y ni contexto ni tradición, por lo que el curso tiene **tres dimensiones y no cinco**; 3.º ESO añade el contexto sociohistórico conservando *"de manera guiada"*; 4.º ESO es el mismo criterio **sin** ese modalizador; y 1.º y 2.º Bach añaden las tres piezas que no existen en ESO —*"con la tradición literaria"*, *"utilizando un metalenguaje específico"* e *"incorporando juicios de valor vinculados a la apreciación estética"*—. **La decisión de diseño de esta versión es que «estructura del comentario» NO es dimensión en 3.º ESO**, y se resuelve con la regla 7 (doble castigo) en su versión entre instrumento y alumno: si el comentario es guiado por preguntas, la pauta ya trae el orden puesto, así que puntuar la organización mide el guion del profesor y no al alumno —el que responde en el orden impreso cobra por una decisión que no tomó, y el que reorganiza paga por tomarla—. Entra en 4.º ESO, donde el criterio retira *"de manera guiada"* y el alumno tiene que ordenar, y en los dos de Bachillerato. La misma decisión deja su huella mecánica en `progresion`: los criterios de 3.º ESO llevan **autonomía 1** bajo el techo 2 de su curso, que es justo lo que la regla del techo (§5.4) permite cuando la cita lo justifica. **Doce matrices cuantitativas, ninguna con penalizaciones**, y solo donde hay algo que contar —fragmentos citados y marcados, recursos localizados y relacionados con el sentido, términos del metalenguaje empleados con propiedad—; las cuatro dimensiones de juicio global (interpretación, contextualización, estructura y, dentro de la interpretación, el juicio estético) llevan `matriz_cuantitativa: null` a propósito. Simulado en los cinco cursos: excelente 10,00 exacto, notable 7,18-7,30, y el perfil clásico del comentario —cita bien, analiza a medias, interpreta poco— da 6,25-6,55; ninguna dimensión cae dos niveles por un solo escalón de banda. `test/proyeccion.mjs` incorpora el pack a `PACKS_CON_INVARIANTE` (los dos invariantes pasan sin excepciones nuevas) y el **barrido manual de la regla 1 sobre los 96 descriptores proyectados encontró cinco defectos que ningún invariante ve**: tres verbos en 3.ª persona fuera del banco con el alumno como sujeto (`comenta`, `reproduce`, `reserva`), un `abre` del banco reconjugado con «el texto» como sujeto, y **una repetición de la trampa del `\b` con letras acentuadas** — *"una frase de transición **explícita**"* imprimía «explícito», porque para el motor de expresiones regulares de JS la «í» no es carácter de palabra y `\bcita\b` casa dentro de expl-**ícita**; es el mismo defecto que ya obligó a escribir sin `\b` la sustitución de *"los encontró"* en `js/motor.js` y a escribir con `\p{L}` el invariante de posesivos en la v1.24. Se arregla en el contenido, como siempre. La leyenda de §4.3 pasa a decir «género **o tarea**» porque en esta fila lo que los saberes nombran no es un género textual sino la operación interpretativa. Batería de cierre completa, 12 de 12. **Lo que este pack no trae, y es deliberado: no hay dimensión de corrección normativa**, porque la puerta es el 8.1 y esa dimensión entra por el 5.2 — queda anotado para el docente por si la quiere. |
| **1.24** | **Cierra el frente (b) de la decisión 16 de §17, y con él la decisión entera: el posesivo y el dativo de 3.ª persona quedan barridos en los cuatro packs.** Lo primero era decidir dónde vive el arreglo, porque este defecto no está en un verbo y `reconjugarSecundarios` no tiene forma de saber de quién es un `su`. **Manda el contenido, y no por descarte:** la mitad larga de los `su` de los packs es legítima —*"indica **su** procedencia"* habla de los datos, *"a partir de **su** autoría, **su** fecha y **su** propósito"* habla de la fuente, *"cada argumento en **su** propio párrafo"* habla del argumento—, así que cualquier regla general sobre el posesivo rompería packs ya validados, que es lo que prohíbe el corolario de simetría de CLAUDE.md. La única vía de motor que funcionaba —una entrada literal por frase en `SUSTITUCIONES_ESPECIALES`— resolvía las dos bolsas grandes con dos líneas y dejaba 19 apariciones sueltas pidiendo una entrada cada una: el motor pasaría a guardar el inventario del contenido y **cada pack nuevo obligaría a editar `js/motor.js`**, justo lo que `docs/diseno/anadir-una-materia.md` prohíbe. Es además la misma respuesta que ya se dio con «que delimita» (v1.4), «a quien defiende» (v1.13), «estructura»/«cita» y «sigue» (v1.22) y «repite» (v1.23): cuando el motor tendría que analizar la frase, se arregla escribiendo el descriptor de otro modo. **La medición vuelve a corregir al alza la que traía la decisión: son 35 apariciones en los descriptores proyectados, no 26.** Las dos bolsas grandes salen exactas (10 *"por su cuenta"*, 6 *"con sus propias palabras"*), así que el hueco estaba entero en las "sueltas" —20, no 11— y es **una bolsa que la primera lectura no vio: los 9 *"sus notas"* del pack oral**, que imprimían «Dirijo la mirada a sus notas». **46 sustituciones en total**: las 35 de los descriptores, 8 en los gemelos `descriptor_un_punto` y 3 en condiciones de banda de la matriz cuantitativa que decían lo mismo. La reescritura no inventa nada, usa el equivalente castellano sin posesivo, que dice lo mismo y proyecta en las dos personas: **`por su cuenta` → `por cuenta propia`**, **`con sus propias palabras` → `con palabras propias`**, **`sus notas` → `las notas`**, y diez sueltas por su cuenta —*"la postura propia"*, *"las afirmaciones propias"*, *"las fuentes consultadas"*, *"el orden en que van surgiendo"* para los dos dativos—. Ninguna toca el verbo inicial ni ninguna matriz cuantitativa: la aritmética de `simular_correccion.py` es idéntica antes y después. **Y esta vez el barrido deja guardia**, porque lo que no se puede automatizar es la reescritura, no la comprobación: `test/proyeccion.mjs` gana un **segundo invariante fail-closed** —todo `su`/`sus` de un descriptor proyectado debe estar declarado **con su referente** en `posesivos_ajenos`, y todo `le`/`les` es error, porque en los cuatro packs el dativo siempre apuntaba al alumno—. La lista de referentes (18 frases) vive en `data/reglas-lexicas.json` **por materia**, no en el test, para que la materia siguiente añada las suyas sin tocar código; `reglas-lexicas.json` pasa a v1.1.0 y `js/lexico.js` se regenera. El test pasa de 12 a 16 casos: los dos frentes del defecto pinchados uno frente al otro (la redacción vieja y la nueva sobre la misma frase, para que se vea que ningún verbo estaba mal conjugado) y una auto-prueba que exige que el invariante dé positivo sobre la redacción anterior al barrido y negativo sobre *"indica su procedencia"*. **Un hallazgo de paso**: las fronteras del invariante se escriben con `\p{L}` y no con `\b`, porque para el motor de expresiones regulares de JS «á» no es carácter de palabra y `\bles\b` casa dentro de **cuá·les** —falso positivo en el N3 de adecuación de 1.º Bach—; es la misma trampa que ya obligó a escribir sin `\b` la sustitución de *"los encontró"* en `js/motor.js`. Batería de cierre completa, 12 de 12, `validar_pack.py` sin incidencias ni avisos en los cuatro packs y `docs/revision-*.md` regenerado. Quedan **46 posesivos legítimos** en los descriptores, todos con su referente escrito. |
| **1.23** | **Cierra el frente (a) de la decisión 16 de §17: la regla 1 queda barrida en los cuatro packs.** Barrido leyendo los **192 descriptores proyectados** del pack oral y del de narración —el JSON no enseña el defecto, porque lo fabrica la proyección—, con la misma red de seguridad de la v1.22 y una segunda pasada mecánica sobre la palabra que abre cada segunda cláusula, para no fiarse de haber leído bien 192 frases. **La medición corrige al alza la que traía la decisión, que hablaba de 16 descriptores en el oral y 2 en narración: son 22 y 3.** La diferencia no es ruido, son tres bolsas que la primera lectura no vio: el verbo detrás de «que» (*"el conocimiento previo que **atribuye** al público"*, *"gestos que no acompañan lo que **dice**"*), la enumeración entre paréntesis (*"(**repite** o **aclara** si **detecta** que no le siguen)"*, tres verbos en un solo descriptor) y **un caso que no es un verbo conjugado y hace el mismo daño**: el infinitivo con pronombre reflexivo de 3.ª persona —*"sin **apoyarse** en la lectura literal de las notas"*, tres veces, que imprime «Regulo el ritmo… sin apoyarse»—. Se arregla en las dos direcciones de la v1.22 (6 altas en el banco, 19 descriptores reescritos). **(a) Verbo inequívoco → se declara** (`data/verbos.json` pasa a 80 entradas y a v1.2.0): `añade`, `anuncia`, `deja`, `enlaza`, `piensa` y `vuelve`. **(b) Palabra ambigua, verbo detrás de «que» o pronombre → se reescribe el descriptor**: `mezcla` y `cuenta` son los dos que la propia decisión señalaba —*"por **su** cuenta"* aparece 10 veces en los cuatro packs y declarar `cuenta` habría escrito «por su cuento»—, y `marca` ya estaba en esa lista desde la v1.22. **`repite` es el `sigue` de esta versión:** verbo inequívoco, cinco descriptores con el alumno como sujeto, y aun así fuera del banco, porque `pack-lcl-argumentativo.json` dice *"con un cierre que **la** repite con las mismas palabras"* —sujeto «un cierre», y el guardarraíl `(?<!\bque )` no lo tapa porque delante hay «la», no «que»—; declararlo habría roto un pack ya validado, que es lo que prohíbe el corolario de simetría de CLAUDE.md. Queda pinchado como caso dorado en `test/proyeccion.mjs`, que pasa de 11 a 12 casos. Ningún cambio de código ni de matriz cuantitativa: la aritmética de `simular_correccion.py` es la misma antes y después. Batería de cierre completa, 12 de 12, `validar_pack.py` sin incidencias ni avisos en los dos packs, y `docs/revision-*.md` regenerado. **Queda abierto el frente (b) de la decisión 16**, que es el que pide una decisión de diseño y no un barrido: los posesivos y el dativo de 3.ª persona. Su recuento baja de 27 a **26 apariciones**: solo una se ha ido de rebote, el *"que no **le** siguen"* que vivía dentro de un descriptor reescrito por (a). Las dos bolsas grandes siguen intactas y medidas —10 *"por su cuenta"* y 6 *"con sus propias palabras"*—, que es justo lo que la decisión anticipaba: (b) no se arregla barriendo, porque `su` es legítimo cuando el referente no es el alumno. |
| **1.22** | **Cierra la decisión 15 de §17, y la cierra entera: no solo los dos descriptores que la abrieron, sino la clase de defecto a la que pertenecían.** El invariante de `test/proyeccion.mjs` solo mira las formas del **banco**, así que un verbo en 3.ª persona con el alumno como sujeto que no esté declarado pasa sin ruido: «…y **dedica** un párrafo a cada aspecto» imprimía en la autoevaluación «Estructuro el texto… y dedica un párrafo», el mismo «yo» y «él» del *"se dirige"* de la v1.4. Barrido **leyendo los 264 descriptores proyectados** de los packs expositivo y argumentativo, no el JSON —el JSON no enseña el defecto, porque el defecto lo fabrica la proyección—, **43 salían mal**, y se arreglan en dos direcciones según lo que sea la palabra (23 por la primera, 24 por la segunda, 4 por las dos). **(a) Verbo inequívoco → se declara** (15 entradas nuevas en `data/verbos.json`, que pasa a 74 y a v1.1.0): `abre`, `afirma`, `cambia`, `combina`, `dedica`, `documenta`, `encadena`, `gradúa`, `organiza`, `pone`, `recurre`, `respeta`, `señala`, `usa` y `verifica`. **(b) Palabra que puede leerse como sustantivo, o verbo detrás de «que» → se reescribe el descriptor** (22 sustituciones de texto, que alcanzan también a los `descriptor_un_punto` gemelos): `marca`, `mezcla`, `reserva` y `alterna` son nombres tan corrientes como verbos, y declararlos habría roto *"sin ninguna marca que las distinga"*. **`sigue` es el caso que fija la regla:** es verbo inequívoco y aun así no se declara, porque `data/pack-lcl-narracion.json` dice *"un final que se sigue de lo contado"* —sujeto «un final», y el guardarraíl `(?<!\bque )` no lo tapa porque delante hay «se», no «que»— y declararlo habría escrito «que se sigo». Corolario de simetría de CLAUDE.md: **la regla que invalida un pack ya validado es la rota**; el banco es compartido y cada alta se comprobó contra los cuatro packs antes de escribirla. **El daño ya estaba impreso en la dirección contraria:** `estructura` y `cita` son verbos del banco que seis descriptores usaban como **sustantivo**, y la autoevaluación llevaba meses diciendo «Elaboro un esquema previo propio con **la estructuro** del texto» y «el aparato de **cito**, notas y bibliografía». Se arregla en el contenido y no en el motor —distinguir el artículo del pronombre en *"y **la** explica con sus propias palabras"* exigiría analizar la frase—, y el límite queda pinchado como caso dorado para que nadie lo "arregle" en `reconjugarSecundarios`. **`PACKS_CON_INVARIANTE` pasa de dos packs a los cuatro**: entra el argumentativo, que era el motivo de la decisión 15, y entra el oral, que estaba fuera **sin motivo escrito** —la misma forma de agujero que la v1.19 destapó en el expositivo—. Las excepciones deliberadas suben a dos, las dos con el sujeto en el sintagma anterior: `delimita` (introducción) y `ajusta` (forma deíctica). Batería de cierre completa, 12 de 12, y `docs/revision-*.md` regenerado. **Queda abierta la decisión 16**: el barrido de la regla 1 no se ha pasado al pack oral, y el mismo defecto tiene un segundo frente que este barrido no toca —los posesivos y el dativo de 3.ª persona (*"con **sus** propias palabras"*, *"por **su** cuenta"*, *"en que se **le** ocurren"*)—, que imprimen «él» en una frase en «yo» sin que ningún verbo esté mal conjugado. |
| **1.21** | **La matriz §4.3 y la tabla §5.4 se mudan a `data/`, una por materia, y las tablas de este documento pasan a ser derivados comprobados.** Nace `data/derivacion-lcl.json`, declarado en `materias.LCL.derivacion` del catálogo, con `matriz_tareas` (símbolos, y una celda por tipo de tarea × curso) y `ejes_progresion` (columnas nivel × cursos, y los tres ejes). `scripts/generar_tablas_sdd.py` escribe desde ahí las dos tablas de este SDD, entre marcadores `<!-- TABLA GENERADA -->`, y su `--comprobar` entra en `comprobar_todo.py` y en el CI, que pasan de once comprobaciones a doce: el SDD ya no puede separarse de su fuente en silencio, igual que no pueden `js/lexico.js` ni `docs/revision-*.md`. **La prosa no se toca**: qué sostiene cada celda discutida, con su cita literal, sigue escrita a mano aquí, que es donde tiene sentido — el JSON guarda el dato y el SDD guarda por qué el dato es ese, y la comprobación 2 del verificador sigue exigiendo que todo lo entrecomillado en §4.3 y §5.4 aparezca literalmente en su fuente. **`scripts/verificar_derivacion.py` deja de parsear markdown**: sus comprobaciones 3 y 4 leen las tablas de `data/` por la materia del pack, con lo que desaparecen `parsear_matriz_tareas`, `parsear_tabla_progresion`, `celdas` y `curso_de_celda`. De paso se cierra una duplicación que el parseo obligaba a mantener: las filas de la matriz se buscaban por la **etiqueta visible** del tipo de tarea («Texto expositivo»), así que un tipo de tarea vivía con dos redacciones que tenían que coincidir; ahora la clave es la del catálogo (`expositivo`). El agrupamiento de la última columna de §5.4 —autonomía comparte peldaño con 4.º ESO, complejidad y metalingüístico no— se escribe como `{"mismo_nivel_que": "4ESO"}` en vez de repetir el número, que es la forma explícita de lo que el 2026-08-05 se corrigió: igualar los tres ejes por uniformidad de implementación. Esto **salda la deuda anotada en `docs/diseno/anadir-una-materia.md`** antes de que llegara la segunda materia, que era su plazo: con dos materias el SDD habría tenido dos matrices y un solo parseo. Sin cambios en la aplicación ni en los packs: la salida de `verificar_derivacion.py` es idéntica antes y después, avisos incluidos, y las doce comprobaciones quedan en verde. Se añaden `cursos.etiquetas_cortas` al catálogo (lo que cabe en la cabecera de una tabla, frente a lo que ve el profesor) y `derivacion(materia)` a `scripts/catalogo.py`. |
| **1.20** | **La matriz §4.3 queda completa, 20 de 20 celdas.** `data/pack-lcl-narracion.json` (v0.1.0, 18 criterios) añade el cuarto y último tipo de tarea de la v1 en 1.º, 2.º y 3.º de ESO, y `js/main.js` lo suma a `PACKS_URLS`. **Seis dimensiones por curso, dos de ellas propias del género**: la construcción de la secuencia narrativa (planteamiento, nudo, desenlace y selección de los hechos que hacen avanzar la historia, dentro de `coherencia`) y la recreación con intención literaria, que entra por el criterio **8.2** —la única puerta de los cuatro packs que no es el 5.1, el 5.2, el 9.1 ni el 6.1— y cuya progresión está escrita en el decreto y no calibrada a mano: *"Crear textos personales o colectivos sencillos…"* (1.º y 2.º) pasa a *"Crear con progresiva autonomía textos personales o colectivos…"* (3.º), y el saber correspondiente pasa de *"Iniciación en la creación de textos sencillos…"* a *"Creación de textos a partir de la apropiación de las convenciones del lenguaje literario"*. **El hilo temporal no es fila**: conectores temporales, correlación de los tiempos de pretérito y referencia a los personajes viven dentro de `cohesion`, porque son un solo constructo y separarlos habría medido dos veces lo mismo — la versión de la regla del doble castigo que se aplica entre dimensiones, no dentro de una matriz. Se evita también la trampa propia del género que anotaba el plan de cierre: narrador, personajes y diálogo van **dentro** del descriptor como saber-vehículo, nunca como nombre de dimensión (CLAUDE.md regla 5). Quince matrices cuantitativas, **ninguna con penalizaciones**; simulado en los tres cursos, con la misma aritmética que el pack expositivo (excelente 10, notable 7,4-7,5, suficiente 5,85) y sin ninguna dimensión que caiga dos niveles de golpe. **Se corrige de paso la fila de narración en §4.3: 2.º ESO pasa de ● a ○** (decisión **14** de §17), tercera aplicación de la misma regla de las decisiones 7 y 12 — "narrativ-" aparece 1 vez en 1.º ESO y 0 en 2.º y 3.º, y el único "narraciones" de 2.º es el criterio 3.1, que es **oral** y sostiene otra fila. **`test/proyeccion.mjs` deja de estar cableado al pack expositivo** y recorre todos los cursos y tipos de tarea de los packs de su lista, hueco que la v1.13 ya había dejado anotado; al ampliarlo aparece la **decisión 15**, dos descriptores del pack argumentativo (N4 de `lcl-c-fuentes-arg-1bach` y `-2bach`) que imprimen la autoevaluación mezclando «yo» y «él», por lo que ese pack se queda fuera de la lista con el motivo escrito en el test en vez de tapado en la lista de excepciones. Batería completa sin incidencias: `validar_pack.py` (0 errores, 0 avisos), `verificar_derivacion.py` (los cuatro packs y las citas nuevas de §4.3), `simular_correccion.py` y `node --test test/*.mjs`. |
| **1.19** | Cierra la decisión 13 de §17: se añade la **comprobación 5** a `scripts/verificar_derivacion.py` (`comprobar_genero_saber_vehiculo`), que exige que un género nombrado en `saber_vehiculo` (expositivo, argumentativo, narrativo) aparezca en el segmento de fuente de ese curso concreto, segmentado por sus propias cabeceras ("Primer/Segundo/Tercer/Cuarto curso" en ESO, "Lengua Castellana y Literatura I/II" en Bachillerato). Es una regla estrecha a propósito: medir un contraste literal de las 221 entradas de `saber_vehiculo` de los tres packs contra la fuente completa da un 42,5% de "fallos" que resultan ser parafraseos y descomposiciones legítimas (confirmado por solapamiento léxico, no solo por subcadena), así que la regla no se extiende a todo el campo — invalidaría contenido ya validado, lo que el corolario de simetría de CLAUDE.md prohíbe. Caso dorado en `--auto-prueba` que reproduce la corrupción exacta de la decisión 12. Los tres packs pasan sin incidencias. |
| **1.18** | Una corrección de contenido curricular, con el skill `rubricas-pack`. **Se cierra la decisión 12 de §17**: texto expositivo en 2.º de ESO pasa de ● a ○ en §4.3, y los tres criterios de bloque B de ese curso en `data/pack-lcl-expositivo.json` dejan de citar `saber_vehiculo: "secuencias textuales expositivas"`, que **no existe en los saberes de 2.º ESO**: era la redacción de 1.º, 3.º y 4.º trasladada a un curso que no la tiene. Comprobado en los cuatro cursos de ESO a la vez, como exige el corolario de simetría de CLAUDE.md — "secuencias textuales" y "expositiv-" aparecen en 1.º, 3.º y 4.º, y cero veces en 2.º, igual que "argumentativ-". **2.º ESO es el único curso de ESO cuyos saberes no nombran ningún género**, y por eso es el único con las dos celdas de texto en ○; el error era además una asimetría, porque la celda gemela (argumentativo en 2.º ESO) ya estaba en ○ desde la decisión 7 por esta misma razón. Los saberes que sustituyen a la cita fabricada son los reales del bloque de 2.º: *"Géneros discursivos propios del ámbito educativo"*, *"grado de formalidad de la situación"* y los mecanismos de cohesión del punto 4. Marcar ○ **no vacía la celda**: el pack sigue completo y en uso. Se abre la **decisión 13** con el agujero de fondo que lo permitió — `verificar_derivacion.py` no contrasta `saber_vehiculo` contra la fuente literal. |
| **1.17** | Quinta opción de la puerta de aplicabilidad (§8): **fase de un texto (esquema, borrador, revisión, párrafo suelto)**, que premarca solo las dimensiones de proceso y abre la vista previa por la lista de cotejo. Trae tres piezas. **(a) Campo `evalua_proceso` en el pack** (§5.2): la declaración es del contenido, no del motor, porque no se puede deducir de la cita — el 5.1 de Murcia dice *"Planificar la redacción… redactar borradores y revisarlos"* y sostiene a la vez la adecuación y la cohesión del texto terminado, así que un premarcado deducido de la cita marcaría media rúbrica. Se marca la dimensión de planificación y revisión en los seis cursos de expositivo y en los cinco de argumentativo (11 criterios); el pack oral no marca ninguna, y esa ausencia también es contenido: sus criterios evalúan el discurso realizado. **(b) Regla `proceso_sin_respaldo`** en las dos implementaciones del validador (§10): una dimensión declarada de proceso cuyo criterio oficial no hable de planificar, de borradores ni de revisar no carga. Solo esa dirección, por lo dicho en (a). **(c) `premarcarDimensiones` en `js/motor.js`** (§9 paso 4), con el invariante de que el premarcado nunca vacía el instrumento: si el filtro de tiempo se lleva la dimensión de proceso, se rescata (el filtro mide el coste de corregir un texto entero, que en una fase no existe); si la tarea no tiene ninguna, se mantienen todas y se explica por qué. `instrumentoRecomendado` deja de ser decorativo y elige la pestaña inicial, lo que de paso hace que las otras cuatro puertas abran por lo que ya recomendaban. De la misma pieza sale una corrección: una dimensión desmarcada en «Ajustar» ya no desaparece para siempre — sigue en la lista, sin marcar, con su `peso_base` en el deslizador. Siete casos nuevos en `test/premarcado.mjs` y dos en `test/validar-reglas.mjs`; `validar_pack.py` y `verificar_derivacion.py` sin incidencias nuevas sobre los tres packs. |
| **1.16** | `data/pack-lcl-expositivo.json` (de 30 a 36 criterios) añade 2.º de Bachillerato, la última celda de la decisión 11 de §17: los tres packs de texto (oral, argumentativo, expositivo) quedan completos en los seis cursos. A diferencia de argumentativo, esta celda está marcada ○, no ●, en §4.3: los saberes propios de *Lengua II* nombran "textos argumentativos", no expositivos, así que `saber_vehiculo` se apoya en la descripción compartida de la competencia 5 (*"procurar mantener una adecuada claridad expositiva"*) en vez de en un saber que nombre el género. La diferencia real de contenido frente a 1.º Bach vive en el criterio **6.1** (tratamiento de la información): el de 2.º Bach añade *"con especial atención a la gestión de su almacenamiento y recuperación"*, ausente en el de 1.º Bach, que se refleja en el componente de bibliografía de la matriz. Progresión idéntica a 1.º Bach en los tres ejes, como en los otros dos packs. Validado con `validar_pack.py` (sin incidencias, sin avisos de `copia_entre_cursos` desde la primera redacción), `simular_correccion.py` (misma aritmética que 1.º Bach, sin caídas de dos niveles) y `verificar_derivacion.py` (sin errores). Probado en el navegador generando la rúbrica completa de 2.º de Bachillerato / texto expositivo (6 dimensiones, pesos correctos); de paso se confirmó que un aviso inicial de «2.º Bach no aparece en el curso» era caché del navegador de la sesión de previsualización, no un defecto de `cursosDisponibles` — se verificó forzando una recarga sin caché. |
| **1.15** | `data/pack-lcl-argumentativo.json` (v0.2.0, de 24 a 30 criterios) añade 2.º de Bachillerato, cerrando la última celda de texto argumentativo. Aplica el mismo criterio que la decisión 11 de §17: progresión idéntica a 1.º Bach en los tres ejes (autonomía 3, complejidad 4, metalingüístico 4); la diferencia real vive en la redacción del criterio oficial y del descriptor — el 5.1 de *Lengua II* exige revisión *"entre iguales o utilizando otros instrumentos de consulta"*, sin la opción individual del 5.1 de 1.º Bach, y el 8.2 cambia el corpus de lectura guiada de «los clásicos» genéricos a literatura española e hispanoamericana del último cuarto del XIX al XXI, en tres ejes. Se documenta en §4.3 la celda «Argumentativo en 2.º Bach (●)», que la matriz ya marcaba pero que no tenía cita propia en la lista de celdas discutidas. §16.1 pasa a 16 de 20 celdas. **Se corrigen dos avisos de `copia_entre_cursos`** en `validar_pack.py`: los descriptores N2-N4 de cohesión y de corrección normativa se habían escrito calcando literalmente los de 1.º Bach; se reformulan sin cambiar la exigencia. Validado con `validar_pack.py` (sin incidencias), `simular_correccion.py` (nota 7,20, perfil de nivel medio verosímil) y `verificar_derivacion.py` (sin errores); probado en el navegador generando la rúbrica completa de 2.º de Bachillerato / texto argumentativo (6 dimensiones, pesos correctos). |
| **1.14** | El pack de exposición oral queda completo en los seis cursos: `data/pack-lcl-oral.json` (v0.3.0, 30 criterios) añade 2.º de Bachillerato, resolviendo la decisión abierta 11 de §17 — mismo peldaño de progresión que 1.º Bach en los tres ejes, porque el Marco Teórico no describe ninguno por encima; la diferencia real vive en la redacción del criterio 3.1 de *Lengua II* (*"extensas en las que se recojan diferentes puntos de vista"*, ausente en 1.º Bach) y en los descriptores. `js/main.js` añade el pack a `PACKS_URLS`. §4.3 pasa a 15 de 20 celdas. **Se corrige `scripts/verificar_derivacion.py`**: el criterio 3.1 de 2.º Bach cruza en la fuente un salto de página del BORM (`NPE: A-241222-6755` y el pie «Número 296 Sábado, 24 de diciembre de 2022 Página 46733» caen en mitad de la frase citada), y `normalizar()` no los descartaba, lo que producía 5 falsos errores de cita. Se añaden dos patrones a `normalizar()` para ignorar cabecera y pie de página del BORM; la auto-prueba del verificador (`--auto-prueba`) sigue detectando toda corrupción deliberada, y el pack pasa a 0 errores. |
| **1.13** | Sesión S1 del plan de cierre de fase 2: **el pack argumentativo se amplía a 2.º y 4.º de ESO** (`data/pack-lcl-argumentativo.json` v0.2.0, de 12 a 24 criterios), con lo que §16.1 pasa a 9 de 20 celdas. Ningún cambio de código: la app ya carga los cursos nuevos por el cableado multi-pack de la v1.10. Se documenta en §4.3 qué sostiene cada una de las dos celdas, con la cita literal. **La progresión 3.º → 4.º no se calibró a mano**: está escrita en el decreto, que retira los andamiajes uno a uno —*"Iniciación a la expresión de la subjetividad…"* (3.º) pasa a «La expresión de la subjetividad…» (4.º); *"progresivamente autónoma"* del 9.1 y el 6.1 pasa a *"de manera autónoma"*; *"Incorporar progresivamente procedimientos"* del 5.2 pasa a *"Incorporar procedimientos"*—, y en el techo de §5.4, que sitúa la gestión del contraargumento en 1.º Bach y deja a 4.º ESO en la matización incipiente: por eso el N4 de coherencia de 4.º ESO expone una objeción y la delimita, mientras que el de 1.º Bach integra concesión y refutación graduadas. En 2.º ESO manda la redacción del 5.1 de ese curso (*"sencillos"*), no una rebaja desde 3.º, y la lista de conectores de sus saberes (temporales, explicativos, de orden y de contraste, todavía sin causa ni consecuencia) es lo que fija la banda alta de su matriz de cohesión. **Se corrige el defecto de contenido que la v1.10 dejó anotado**: `lcl-c-fuentes-arg-1bach` pasa a llamarse «Tratamiento de las lecturas: vínculos argumentados» y el pack argumentativo vuelve a pasar los dos validadores (script y app, 0 errores y 0 avisos en paridad). **El banco de verbos del pack pasa de 23 a 37 entradas**, y no solo por los descriptores nuevos: ocho verbos (`entrega`, `indica`, `traslada`, `explica`, `apoya`, `cita`…) ya aparecían como segundo verbo de la frase en los criterios de 3.º y 1.º Bach sin estar en el banco, de modo que la autoevaluación imprimía frases con los dos sujetos mezclados («Redacto el texto en una sola pasada y **entrega** la primera versión»). El invariante de `test/proyeccion.mjs` no lo atrapó porque solo recorre el pack expositivo; se comprobó ejecutando `generarAutoevaluacion` sobre los cuatro cursos del pack argumentativo, y de paso destapó la trampa inversa: «a quien **defiende** lo contrario» se reconjugaba a «defiendo» porque la excepción de `reconjugarSecundarios` solo mira «que», no «quien» — se resolvió reescribiendo el descriptor, no ampliando la excepción. |
| **1.12** | Se cierra la decisión §17.7: **argumentativo en 2.º de ESO también se ratifica como ○**. El criterio 5.1 de 2.º ESO no nombra género (igual que en 1.º, 3.º y 4.º) y los saberes de 2.º ESO no nombran "expositivas" ni "argumentativas" (a diferencia de 3.º/4.º, que sí las nombran), así que el criterio abre la puerta y los saberes no enfocan ningún género en particular — lectura simétrica correcta. Al leer el decreto para esta ratificación sale un **hallazgo nuevo, sin resolver** (§17, decisión 12): la celda de texto expositivo en 2.º ESO está marcada ● pero no se le encuentra respaldo textual literal en el bloque de saberes de "Segundo curso"; no se toca el pack ya confirmado, queda anotado para revisar con el skill `rubricas-pack`. |
| **1.11** | Una corrección puntual, sin cambio de código. **Se ratifica la mitad de la decisión §17.7**: narración sí llega a 3.º de ESO, como ○ (residual: el foco del curso ya se ha desplazado). Queda pendiente la otra mitad, el argumentativo incipiente en 2.º de ESO, a repasar antes de ejecutar S1 del plan de cierre de fase 2. |
| **1.10** | Cierre de la sesión S0 del plan de cierre de fase 2 (`docs/diseno/plan-cierre-fase-2.md`): confirma en git el trabajo que llevaba sin commitear desde la sesión anterior. **Cableado multi-pack** (§5.1): `js/main.js` cargaba solo `pack-lcl-expositivo.json`; ahora carga todos los packs de `data/` declarados en `PACKS_URLS` y los combina con `fusionarPacks` (nuevo en `js/motor.js`, concatena `criterios` y une `verbos` por id) para que el motor y el formulario vean todas las combinaciones curso × tipo de tarea a la vez. La salud del pack (§10) se sigue informando por pack por separado —`validarPack(p)` para cada `p` original, informes fusionados solo para pintarlos juntos— porque `comprobarPesosCurso` suma por curso sin distinguir tipo de tarea, y fusionar antes de validar habría disparado avisos de pesos falsos en cualquier curso compartido por dos packs. Probado en el navegador: el selector de tipo de tarea ya ofrece «Texto argumentativo» y, al elegirlo, el selector de curso se limita a 3.º ESO y 1.º Bachillerato (las únicas celdas ● que tiene ese pack en §4.3, sin ofrecer cursos vacíos); se generó una rúbrica completa de 3.º ESO argumentativo con las siete pestañas, incluida la autoevaluación en 1.ª persona con el banco de verbos fusionado. **Se confirma `data/pack-lcl-argumentativo.json`** (12 criterios, 3.º ESO y 1.º Bach) y se actualiza la fila «Matriz tarea × curso» de §16.1 a 7 de 20 celdas. **Se corrige una brecha de paridad del validador** (§10): `scripts/validar_pack.py` no implementaba las reglas `saber_vehiculo`, `modalizadores`, `tarea_aplicable` y `copia_entre_cursos`, que sí existían en `js/validador.js` — el script de cierre podía dar «sin incidencias» sobre un pack que la app, al cargarlo de verdad, marcaba con error. Se detectó exactamente así: la batería de cierre (`validar_pack.py`, `verificar_derivacion.py`, `node --test`) daba limpio, pero la comprobación en el navegador (paso 3 del prompt de S0) mostró «Salud del pack: 1 error» en el pack argumentativo. Las cuatro reglas se portan a Python con la misma semántica y umbrales (`SABERES_PROHIBIDOS`, `DISPARADORES_AYUDA`/`AUTONOMIA`, `MARCAS_ANDAMIAJE`, ventana de combinaciones curso × tipo de tarea), verificadas contra los dos packs reales (mismo resultado que `js/validador.js`: 0 incidencias en expositivo, 1 error en argumentativo) y contra seis casos corruptos manuales, uno por dirección de cada regla nueva. **Queda pendiente de contenido, no de código**: `lcl-c-fuentes-arg-1bach` (dimensión «El ensayo sobre las lecturas: vínculos argumentados») dispara `saber_vehiculo` porque el nombre empieza por un artículo y nombra un contenido en vez de una acción competencial (CLAUDE.md regla 5); se confirma el pack tal cual porque arreglar la redacción es trabajo de contenido curricular con el skill `rubricas-pack`, fuera del alcance de esta sesión de código — queda anotado aquí para la próxima sesión de pack que toque el argumentativo (S1 del plan de cierre). Además se confirman `fuentes/pau/` (documentación de la PAU 2026 de LCL II, material aportado, no citado como fuente normativa — ver trampa documentada en S2 del plan de cierre), `docs/diseno/plan-rediseno-portada.md` (propuesta, sin implementar) y `docs/Que-puede-hacer-la-app.docx` (material aportado, sin procesar). |
| **1.9** | Dos correcciones puntuales, sin cambio de código. **Se resuelve el número exacto del decreto autonómico de ESO** (§17, decisión 4): Decreto n.º 235/2022, de 7 de diciembre, localizado en `fuentes/curriculo/Decreto-158-2024_modificacion-ESO_BORM-181-05-08-2024.md` y escrito ya en `normativa.autonomica` de `data/pack-lcl-expositivo.json`. De paso se anota el decreto equivalente de Bachillerato (n.º 251/2022, de 22 de diciembre), sin uso todavía porque no hay pack de esa etapa. **Se descarta la referencia a las directrices EBAU de la Región de Murcia en la escala de estimación analítica** (§7.7, §16.1, §17 decisión 3), que quedaba como pendiente de contenido desde la v1.6: no es un hueco de fuente sin localizar, es una fuente que no correspondía citar. La calificación de un curso oficial se rige por los criterios de evaluación del currículo LOMLOE, no por los criterios de corrección de la EBAU, que fija la comisión organizadora de esa prueba concreta; citarlos en la cabecera de un instrumento de calificación de aula habría violado la regla #1 de `CLAUDE.md` (todo criterio necesita `criterio_oficial` del decreto, no una fuente afín). |
| **1.8** | Se conecta «Calificar» con la ficha del alumno (§6.5), cerrando el último hueco pendiente del roadmap §16.1. No es un instrumento nuevo del catálogo (§7, cerrado en 7/7): la ficha (§7.3) gana un desplegable de «Resultado de un alumno calificado» (por defecto, vista en blanco para repartir en clase) que muestra el nivel y los puntos alcanzados por dimensión y la nota final de quien se elija. Se extrae `puntosYNivelDe` de `js/calificar.js` a `js/calificacion.js` (pura, sin cambio de comportamiento) y se añade `calcularResultadoGuardado(criterios, datos)`, que reutiliza `calcularNota` para recomponer el desglose de un alumno ya guardado contra el instrumento **actual** — igual que ya hacía «Cargar» en Calificar: si el profesor reajustó pesos o desactivó una dimensión después de calificar, el criterio desaparecido se omite en vez de romper, y la nota se recalcula con lo que queda activo (probado a mano: tras desactivar una dimensión, la nota de una alumna pasó de 9,45 a 10,00 usando solo las cuatro restantes, sin error). El cableado de `js/main.js` evita rehacer toda la vista previa al elegir alumno o al cerrar Calificar: solo repuebla el desplegable y recalcula el bloque de resultado. Cuatro casos dorados nuevos en `test/calificacion.mjs` para `puntosYNivelDe` y `calcularResultadoGuardado`, incluida la compatibilidad con calificaciones guardadas antes de la v1.7 (sin `detractorAcumulado`). |
| **1.7** | Se conecta el detractor a la pantalla de «Calificar» (§6.3, §7.7): `js/calificar.js` añade un campo numérico (0 a `DETRACTOR_ESTIMACION.tope`, importado de `js/motor.js`) que se acota en el cliente antes de pasarlo a `calcularNota` como `detractorAcumulado` — necesario porque `calcularNota` solo acota el tope superior (`Math.min(detractorAcumulado, 2)`) y un valor negativo escrito a mano subiría la nota en vez de bajarla. Se persiste junto al resto del `ResultadoCriterio` en `localStorage` y se recupera al cargar un alumno guardado (con `?? 0` para los registros previos a este cambio, que no tenían el campo). Probado a mano en el navegador: nota base 9,45, detractor de 1,5 → 7,95; detractor de 5 (fuera de rango) se acota a 2 → 7,45; guardar y recargar al alumno restaura el detractor exacto. No se añade caso dorado nuevo a `test/calificacion.mjs` porque la aritmética del detractor en `calcularNota` (orden respecto a la condición mínima, tope, suelo en 0) ya estaba cubierta desde la v1.2; lo nuevo es solo el cableado a la interfaz, sin arnés de pruebas de DOM en este proyecto. |
| **1.6** | Escala de estimación analítica (§7.7): `generarEscalaEstimacion` en `js/motor.js` reparte el peso normalizado de cada dimensión en puntos directos sobre 10 (`peso_normalizado / 10`) y añade el detractor global de ortografía y presentación (`DETRACTOR_ESTIMACION`, tope 2 puntos, §6.3) como campo declarado del instrumento, no del pack: no cita `criterio_oficial` porque no es un criterio de evaluación, es una convención de corrección transversal. Cierra el catálogo de instrumentos (§7) a 7 de 7. El detractor queda solo impreso en blanco (igual que las columnas de §7.4): la pantalla de «Calificar» todavía no captura `detractorAcumulado` para pasarlo a `calcularNota` (§6.3, nota actualizada). Queda fuera de esta versión, a falta de fuente citable, la referencia a las directrices EBAU de la Región de Murcia en la cabecera de Bachillerato que menciona §7.7: el pack todavía no tiene contenido de Bachillerato y no hay texto de esas directrices en `fuentes/` para citar sin inventarlo. |
| **1.5** | Rúbrica de un solo punto (§7.4): `generarRubricaUnPunto` en `js/motor.js` toma la columna central del descriptor de N2 (`descriptor_un_punto` si está relleno, si no el propio N2 — misma regla que `descriptor_cotejo`) y dos columnas en blanco para que el profesor anote a mano. Marco Teórico §10 la limita a 1-2 dimensiones: se toman las de mayor prioridad y se avisa cuando se recorta el resto. Se rellena `descriptor_un_punto` en los doce criterios del pack, hasta ahora vacío (§16.1). De paso se corrige una pestaña de más: al conectar el instrumento se encontró que la nota de "instrumentos que llegarán en una fase posterior" seguía apareciendo para la lista de cotejo aun cuando autoevaluación y coevaluación (v1.4) ya estaban implementadas, y que el modo avanzado ("Ajustar") recalculaba `fichaAlumno` y `autoevaluacion` tras un reajuste de pesos pero no el instrumento nuevo; las dos quedan corregidas en `js/ui.js` y `js/main.js`. |
| **1.4** | Autoevaluación y coevaluación (§7.5-§7.6): `generarAutoevaluacion` en `js/motor.js` reconjuga la matriz completa a 1.ª persona. La primera versión solo tocaba el verbo inicial de cada descriptor y se probó leyendo el JSON; generarla de verdad en el navegador (CLAUDE.md, método de trabajo) destapó que media matriz son frases compuestas con un segundo verbo, también en 3.ª persona ("Ajusta el texto ... y **se dirige** al destinatario"), que quedaba sin reconjugar y mezclaba "yo" y "él" en la misma frase. La solución ingenua de reconjugar cualquier verbo del banco que apareciera en el texto introdujo el problema contrario: "una introducción **que delimita** el tema" pasó a "que delimito", cambiando de sujeto la introducción por el alumno. Se resuelve reconjugando todo verbo del banco salvo el que sigue inmediatamente a "que" (la única relativa de sujeto distinto en las cuarenta y ocho descriptores del pack), más dos sustituciones literales para los dos casos fuera del par presente 3.ª/1.ª persona del banco (un reflexivo, un pretérito). El banco de verbos crece de 26 a 34 entradas. `test/proyeccion.mjs` fija un invariante sobre el pack completo —ningún verbo del banco debe quedar en 3.ª persona, salvo la excepción documentada— para que una regresión de este tipo no vuelva a llegar al navegador sin que un test la atrape antes. |
| **1.3** | El modo numérico (§6.5) pasa de calcular-y-olvidar a persistir: `js/calificar.js` guarda el resultado de cada alumno en `localStorage`, namespaced por curso + tipo de tarea + actividad, con lista de alumnos ya calificados, recarga de sus respuestas y borrado. Sigue sin conectar con la ficha impresa ni con ningún instrumento con detractor (§7.7 no existe). Rediseño visual completo de `css/styles.css`: tipografía unificada en una sola familia serif (sin la mezcla con `system-ui` de antes), pastillas de 999px sustituidas por etiquetas rectangulares, pestañas del instrumento con forma de separador de carpeta en vez de píldora, y textura de grano de papel muy sutil en el fondo. Se retira todo emoji decorativo (🔒⚙️🖨️🧮✅❌⚠️🟢🟡🔴) de `js/ui.js`, `js/calificar.js` y `js/modo-avanzado.js`, sustituido por marcas tipográficas o de color con la misma información. |
| 0.1 | Alcance de tipos de tarea, arquitectura sin backend/sin IA, motor de reglas, exportación a Word, roadmap por fases. |
| 0.2 | Doble salida por tarea (rúbrica estándar + modo IA). Exportación a Excel (.xlsx) compatible con iDoceo. Marco LOMLOE y matrices cuantitativas como fuente de criterios. |
| 0.3 | Constructor guiado: dimensiones por checkboxes, profundidad, pesos visuales y 5 instrumentos generables. |
| 0.4 | Fusión de profundidad con "tiempo disponible para corregir". Campo libre de actividad, guardar/cargar en localStorage, criterios obligatorios, barra de reparto de pesos, indicador de complejidad. Biblioteca organizada por bloques LOMLOE (A-D). |
| **1.2** | Se cierran las reglas exactas de §6.2 y §6.3, hasta ahora escritas en prosa con ambigüedades reales de implementación. **Una dimensión con matriz aporta a la nota sus puntos continuos, no el valor de su nivel**, y las bandas de §6.4 sirven para mostrar y para comprobar la condición mínima, no para calcular: lo confirman `Rúbricas documentación.md` y `scripts/simular_correccion.py`, y lo exige el hecho de que colapsar puntos a nivel haría que una décima valiese 2,5 puntos de nota en el corte del 9. Además: las penalizaciones aplicadas son negativas y **se suman**; la puntuación de una dimensión nunca baja de 0; la condición mínima es un techo no acumulativo que no actúa sin criterios obligatorios en el instrumento; **el detractor global se aplica antes que ese techo**, porque el orden entre ambos cambia la nota; las bandas se cierran por umbrales (`>=9`, `>=7`, `>=5`) para no dejar hueco entre "8,9" y "9,0"; y se fija la regla de redondeo con su alcance real. Se documenta el invariante `total = 10`, todavía sin comprobar en el validador, y se resuelve la discrepancia de escala entre §6.2 y `scripts/simular_correccion.py`, que valoraba las dimensiones sin matriz con los puntos medios de banda: sobre el mismo perfil simulado, una escala aprobaba y la otra suspendía. Manda la de §6.2, por ser la que se imprime en la ficha del alumno y la que se corresponde con suficiente/notable/sobresaliente. Se añade §6.5, que separa el cálculo (implementable ya, como funciones puras) de la pantalla de entrada de resultados por alumno, que no existe. Las tres decisiones de producto pendientes (§17.1-§17.3) se implementan con el valor que el propio SDD proponía por defecto, sin darlas por cerradas. |
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

> **La tabla no se edita aquí.** Vive en `data/derivacion-<materia>.json`, una por materia, y este documento la imprime con `scripts/generar_tablas_sdd.py`; si las dos se separan, `comprobar_todo.py` se pone en rojo. Lo que sí se escribe a mano es todo lo demás de esta sección: **qué sostiene cada celda, con su cita literal**. El JSON guarda el dato; el SDD, por qué el dato es ese.

<!-- TABLA GENERADA: matriz-tareas · fuente: data/derivacion-<materia>.json · se reescribe con: python scripts/generar_tablas_sdd.py -->
| Tipo de tarea | 1.º ESO | 2.º ESO | 3.º ESO | 4.º ESO | 1.º Bach | 2.º Bach |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Narración | ● | ○ | ○ |  |  |  |
| Texto expositivo | ● | ○ | ● | ● | ● | ○ |
| Exposición oral | ● | ● | ● | ● | ● | ● |
| Texto argumentativo |  | ○ | ● | ● | ● | ● |
| Comentario de texto literario | ● |  | ● | ● | ● | ● |
| Resumen de un texto | ● |  | ● |  | ○ | ○ |

● **género o tarea nombrados en los saberes del curso**, además de sostenido por su criterio de evaluación · ○ **sostenido por el criterio de evaluación del curso, pero no nombrado en sus saberes**: incipiente al principio de la secuencia (argumentativo en 2.º ESO), residual al final, cuando el foco del curso se ha desplazado al otro género (expositivo en 2.º Bach), o simplemente ausente del bloque de saberes de ese curso concreto (los tres géneros en 2.º ESO)
<!-- FIN TABLA GENERADA -->

**Ningún género queda interrumpido una vez empezado, y eso no es una concesión pedagógica: es lo que dice el criterio.** El criterio de evaluación 5.1 está redactado en todos los cursos sin nombrar género — *"textos escritos y multimodales sencillos"* en ESO, *"textos académicos"* en Bachillerato. Quien nombra un género es el bloque de saberes, y el saber es vehículo, nunca fila (CLAUDE.md, regla 5). Por eso **el género de los saberes no puede vaciar una celda**: solo indica dónde pone el foco ese curso.

*Corrección del 2026-08-05 (segunda pasada, a raíz de una objeción del docente).* En una primera pasada rebajé texto expositivo en 2.º Bach de ● a ○ razonando que, como los saberes de Lengua II dicen *"Producción de textos **argumentativos** escritos del ámbito académico"* y los de Lengua I dicen *"Producción de textos **expositivos**"*, el currículo asignaba un género excluyente por curso. Ese razonamiento era **metodológicamente erróneo y además se aplicó de forma asimétrica**: si valiera, obligaría a vaciar también texto argumentativo en 1.º Bach, dejando un hueco entre 4.º ESO y 2.º Bach —justo el corte que el docente detectó—, y obligaría a vaciar texto expositivo en **2.º ESO**, cuyos saberes no nombran ninguno de los dos géneros y que sin embargo tiene un pack completo, validado y en uso. Un test que invalida contenido ya verificado es un test defectuoso. Se restituye el criterio como única puerta, y el símbolo ○ pasa a significar lo que se lee arriba.

**Dos filas no pertenecen a esa familia, y por eso son las dos únicas con huecos en medio: el comentario de texto literario y el resumen.** Las cuatro filas de arriba las abre el 5.1 (o el 3.1 en la oral), que existe redactado en los seis cursos; lo que varía de curso a curso es el foco de los saberes, nunca la existencia de la puerta. El comentario lo abre el **8.1**, y el resumen el **4.1**, y ninguno de los dos es el mismo criterio en todos los cursos. El comentario, porque el 8.1 no es el mismo criterio en todos los cursos: en 1.º, 3.º y 4.º de ESO y en los dos de Bachillerato dice *"la interpretación de las obras leídas"* a partir del análisis de sus elementos, mientras que en **2.º de ESO el 8.1 es otro criterio**, el de los vínculos intertextuales. La celda vacía de 2.º ESO no es un olvido ni una decisión de alcance: es que ese año el currículo no pide esta tarea. También cambia el sentido de ●: en esta fila lo que los saberes nombran no es un género textual, sino la operación interpretativa misma, y por eso la leyenda de la tabla habla de género 'o tarea'.

**La fila del resumen es la más dispersa de la matriz, y por la misma razón llevada al extremo: el 4.1 alterna de curso en curso entre dos criterios distintos.** En los cursos impares de ESO el 4.1 es un criterio de **comprensión** —*"Comprender e interpretar el sentido global, la estructura, la información más relevante y la intención del emisor"*— y en los pares es un criterio de **valoración crítica**: *"Valorar la forma y el contenido de textos escritos y multimodales sencillos evaluando su calidad, su fiabilidad y la idoneidad del canal utilizado"* en 2.º, *"Valorar críticamente el contenido y la forma de textos escritos y multimodales de cierta complejidad"* en 4.º. Valorar un texto presupone haberlo entendido, pero no es la operación que un resumen evalúa: lo propio del resumen —reconstruir el sentido global, jerarquizar las ideas y ser fiel a lo que el texto dice— solo lo sostiene la redacción de comprensión. En Bachillerato la alternancia se acaba porque la competencia 4 tiene **dos criterios** en vez de uno, y el 4.1 de los dos cursos es el de comprensión (*"Identificar el sentido global, la estructura, la información relevante y la intención del emisor de textos escritos y multimodales especializados"*), quedando la valoración en el 4.2. De ahí el dibujo de la fila: ● ▸ vacía ▸ ● ▸ vacía ▸ ○ ▸ ○.

**Qué sostiene cada celda discutida, con la cita:**

- **Narración en 1.º ESO (●):** es la única celda ● de la fila y la única de toda la matriz que tiene el género nombrado **dos veces** en los saberes del curso: *"Secuencias textuales básicas, con especial atención a las narrativas, descriptivas, dialogadas y expositivas"* y, en el punto 5 del bloque B, *"Uso coherente de las formas verbales en los textos. Los tiempos de pretérito en la narración. Correlación temporal en el discurso relatado"*. La puerta es el 5.1 del curso, sin género (*"Planificar la redacción de textos escritos y multimodales sencillos"*), y el 8.2 la refuerza para el relato con intención literaria: *"Crear textos personales o colectivos sencillos con intención literaria y conciencia de estilo"*.
- **Narración en 2.º ESO (○):** *corregido el 2026-08-07 (decisión 14 de §17), donde estuvo marcado ● sin cita que lo sostuviera.* Es la **tercera** celda gemela de 2.º ESO y se resuelve como las otras dos: el criterio 5.1 la abre sin nombrar género y el bloque de saberes del curso no nombra el suyo. Medido curso a curso, "narrativ-" aparece **una vez en 1.º ESO y cero veces en 2.º y en 3.º**, igual que "expositiv-" y "argumentativ-". Lo único que dice "narraciones" en 2.º ESO es el criterio **3.1**, que es de producción **oral** (*"Realizar narraciones y exposiciones orales sencillas con diferente grado de planificación"*) y sostiene la fila de exposición oral, no la de narración escrita: un criterio oral no abre una celda de texto escrito. Los vehículos reales del curso son sin género — *"Análisis de las propiedades textuales: coherencia, cohesión y adecuación"*, *"Recursos lingüísticos para mostrar la implicación del emisor en los textos"* — más el saber de creación literaria de su bloque C, *"Creación de textos sencillos a partir de la apropiación de las convenciones del lenguaje literario"*, y así los cita `data/pack-lcl-narracion.json`. **Con esto, las tres celdas de texto de 2.º ESO son ○ y la frase de la decisión 12 se cumple entera**: 2.º ESO es el único curso de ESO cuyos saberes no nombran ningún género. Marcar ○ no vacía la celda: el pack está completo y validado en los seis criterios del curso.
- **Narración en 3.º ESO (○):** ratificado por el docente el 2026-08-05 (decisión 7 de §17) y confirmado al escribir el pack. Es el caso **residual** del símbolo: la puerta sigue abierta con el 5.1 del curso, ahora *"Planificar la redacción de textos escritos y multimodales de cierta extensión"*, y el 8.2 retira el andamiaje (*"Crear con progresiva autonomía textos personales o colectivos con intención literaria y conciencia de estilo"*), pero el foco de los saberes ya se ha desplazado: donde 1.º atendía a las secuencias *"narrativas, descriptivas, dialogadas y expositivas"*, 3.º atiende *"a las expositivas y argumentativas"*. Lo que sí conserva 3.º, y es lo que sostiene la celda como vehículo, es el saber de creación de su bloque C: *"Creación de textos a partir de la apropiación de las convenciones del lenguaje literario"*. **La fila se acaba en 3.º ESO**: 4.º ESO y los dos cursos de Bachillerato no tienen celda, y la app no ofrece ahí la narración.
- **Argumentativo en 3.º ESO (●):** los saberes lo nombran dos veces — *"Secuencias textuales básicas, con especial atención a las expositivas y argumentativas"* y *"Iniciación a la expresión de la subjetividad en textos de carácter expositivo y argumentativo"*. En 4.º ESO reaparecen las dos mismas fórmulas. **En ESO los dos géneros viajan siempre juntos en los saberes, nunca separados.**
- **Argumentativo en 2.º ESO (○):** el criterio 5.1 lo sostiene sin nombrar género (*"textos escritos y multimodales sencillos"*) y los saberes del curso no nombran ninguno de los dos: donde 3.º y 4.º hablan de las secuencias *"expositivas y argumentativas"*, 2.º se queda en *"Análisis de las propiedades textuales: coherencia, cohesión y adecuación"*. Lo que el curso sí aporta como vehículo —y lo que hace que la celda esté abierta y no vacía— es *"Recursos lingüísticos para mostrar la implicación del emisor en los textos: formas de deixis (personal, temporal y espacial) y procedimientos de modalización"*: con eso se evalúa cómo el alumno expresa y gradúa su opinión sin necesidad de que el decreto nombre el género.
- **Expositivo en 2.º ESO (○):** *corregido el 2026-08-06 (decisión 12 de §17), donde estuvo marcado ● sin cita que lo sostuviera.* Es la celda gemela de la anterior y se resuelve igual, porque la pregunta y la respuesta son las mismas: el criterio 5.1 la abre sin nombrar género (*"textos escritos y multimodales sencillos"*) y los saberes de 2.º ESO no nombran **ninguno de los dos**. Donde 1.º dice *"Secuencias textuales básicas, con especial atención a las narrativas, descriptivas, dialogadas y expositivas"* y 3.º dice *"Secuencias textuales básicas, con especial atención a las expositivas y argumentativas"*, el bloque de 2.º no contiene la fórmula: **2.º ESO es el único curso de ESO cuyos saberes no nombran ningún género**, y por eso es el único donde las tres celdas de texto son ○ (la de narración, desde la decisión 14). Lo que el curso sí aporta como vehículo son saberes sin género: *"Análisis de las propiedades textuales: coherencia, cohesión y adecuación"*, *"Géneros discursivos propios del ámbito educativo"* y, para la adecuación, *"grado de formalidad de la situación"*. `data/pack-lcl-expositivo.json` citaba en su lugar 'secuencias textuales expositivas', que es la redacción de 1.º, 3.º y 4.º trasladada a un curso que no la tiene; los tres criterios de bloque B pasan a citar los saberes reales de 2.º. **Marcar ○ no vacía la celda ni contradice la corrección de arriba**: el pack sigue completo, validado y en uso, que es exactamente lo que ○ significa.
- **Argumentativo en 4.º ESO (●):** los saberes lo nombran también dos veces, y con el andamiaje ya retirado. Donde 3.º dice *"Iniciación a la expresión de la subjetividad en textos de carácter expositivo y argumentativo"*, 4.º dice *"La expresión de la subjetividad en textos de carácter expositivo y argumentativo"*; y donde 3.º enuncia *"Secuencias textuales básicas, con especial atención a las expositivas y argumentativas"*, 4.º escribe *"Desarrollo de secuencias textuales básicas, con especial atención a las expositivas y argumentativas"*. **La progresión entre los dos cursos vive en esas dos palabras que aparecen y desaparecen**, no en una calibración del diseñador (CLAUDE.md, regla 2).
- **Argumentativo en 1.º Bach (●):** lo sostienen tres cosas. El criterio 5.1 (*"Elaborar textos académicos"*, sin género). La descripción de la competencia específica 5, **común a los dos cursos de Bachillerato**, que nombra *"los géneros académicos (disertaciones, ensayos, informes o comentarios críticos, entre otros)"* y exige *"manejar con soltura la alternancia de información y opinión"*. Y el criterio **8.2 de 1.º Bach**, que nombra un producto argumentativo de forma explícita: *"Desarrollar proyectos de investigación que se concreten en una exposición oral, **un ensayo** o una presentación multimodal, estableciendo vínculos argumentados"*.
- **Argumentativo en 2.º Bach (●):** más directo todavía que en 1.º Bach. El criterio 5.1 de *Lengua Castellana y Literatura II* lo sostiene sin género, igual que en 1.º Bach, pero aquí el saber **nombra el género de forma explícita** — algo que en 1.º Bach no ocurre: el bloque de saberes de *Lengua I* dice *"Producción de textos expositivos"*, mientras que el de *Lengua II* dice *"Producción de textos argumentativos escritos del ámbito académico"*. El criterio **8.2 de 2.º Bach** también nombra un producto argumentativo, con un corpus de lectura guiada propio del curso: *"estableciendo vínculos argumentados entre las obras de la literatura española o hispánica del último cuarto del siglo XIX y de los siglos XX y XXI objeto de lectura guiada"*, organizado en tres ejes (Edad de Plata, guerra civil y exilio, literatura contemporánea), frente a «los clásicos» sin más precisión de 1.º Bach. **La diferencia entre los dos cursos vive en esas dos redacciones, no en el número de `progresion`** (decisión 11 de §17, `data/pack-lcl-argumentativo.json`).
- **Expositivo en 2.º Bach (○):** el criterio 5.1 lo sostiene (sin género) y la misma descripción común de la competencia 5 pide *"procurar mantener una adecuada claridad expositiva"*. Lo que cambia en 2.º Bach es el foco de los saberes, que se desplaza al argumentativo — el bloque de saberes de *Lengua II* dice *"Producción de textos argumentativos escritos del ámbito académico"*, sin nombrar el expositivo. Marcarlo ○ informa al profesor de ese desplazamiento sin cerrarle la puerta. `data/pack-lcl-expositivo.json` construye `saber_vehiculo` apoyándose en la descripción compartida de la competencia 5 —los saberes propios del curso no nombran el género— y en el criterio **6.1 de 2.º Bach**, que añade *"con especial atención a la gestión de su almacenamiento y recuperación"* frente al 6.1 de 1.º Bach: la única diferencia real de contenido entre los dos cursos en esta celda.

- **Comentario en 1.º ESO (●):** el criterio 8.1 del curso abre la puerta con el andamiaje escrito dentro — *"Explicar y argumentar, con la ayuda de pautas y modelos, la interpretación de las obras leídas a partir del análisis de las relaciones internas de sus elementos constitutivos con el sentido de la obra"* — y **sin** las dos relaciones externas que aparecerán después: ni contexto sociohistórico ni tradición literaria. Los saberes del bloque C nombran la tarea dos veces, y una de ellas repite el modalizador: *"Expresión pautada, a través de procesos y soportes diversificados, de la interpretación y valoración personal de obras y fragmentos literarios"* y *"Relación entre los elementos constitutivos del género literario y la construcción del sentido de la obra"*. Por eso el pack tiene aquí **tres dimensiones y no cinco**: lo que el curso no sostiene, no se escribe.
- **Comentario en 2.º ESO (celda vacía):** *no hay criterio que abra la puerta.* El 8.1 de 2.º ESO es otro criterio — *"Establecer de manera guiada vínculos argumentados entre los textos leídos y otros textos escritos, orales o multimodales"* —, que es el que en 4.º ESO pasa a ser el 8.2 y en 1.º Bach el 8.2 de los proyectos de investigación: pide relacionar obras entre sí, no explicar una a partir del análisis de sus elementos. El 8.2 de 2.º ESO es el de creación literaria. **Y es un caso de manual de la regla 9 de CLAUDE.md leída al revés**: los saberes del curso *sí* nombran la tarea —*"Expresión, a través de procesos y soportes diversificados, de la interpretación y valoración personal de obras y fragmentos literarios"*—, pero un saber no abre una celda, solo enfoca la que un criterio ya ha abierto. Donde en 2.º ESO las otras tres filas quedaron en ○ (criterio sí, saber no), esta queda vacía por la razón contraria y exacta: saber sí, criterio no.
- **Comentario en 3.º ESO (●):** el 8.1 conserva el andamiaje en una sola palabra —*"Explicar y argumentar de manera guiada la interpretación de las obras leídas"*— y añade lo que 1.º no tenía: las *"relaciones externas del texto con su contexto sociohistórico"* y la *"evolución de los géneros y subgéneros literarios"*. Los saberes acompañan con el mismo *básicas* del criterio: *"Estrategias básicas para interpretar obras y fragmentos literarios a partir de la integración de los diferentes aspectos analizados"* y *"Estrategias básicas de utilización de información sociohistórica, cultural y artística básica para construir la interpretación de las obras literarias"*. De ahí la cuarta dimensión del curso, contextualización, y de ahí también que su `progresion` de autonomía quede en 1 y no en 2 (§5.4, regla del techo).
- **Comentario en 4.º ESO (●):** **la progresión 3.º → 4.º es una palabra que desaparece y ninguna que llega.** El criterio es literalmente el mismo salvo el modalizador: *"Explicar y argumentar la interpretación de las obras leídas a partir del análisis de las relaciones internas"*, sin *"de manera guiada"*. Los saberes hacen el mismo movimiento en las mismas dos fórmulas: donde 3.º dice *"Estrategias básicas para interpretar obras y fragmentos literarios a partir de la integración de los diferentes aspectos analizados"*, 4.º dice *"Estrategias para interpretar obras y fragmentos literarios a partir de la integración de los diferentes aspectos analizados"*; y donde 3.º dice *"Relación entre los elementos constitutivos del género literario y la construcción del sentido de la obra"*, 4.º dice *"Análisis y relación entre los elementos constitutivos del género literario y la construcción del sentido de la obra"*. Eso, y no una calibración, es lo que hace que la estructura del comentario sea dimensión aquí y no en 3.º.
- **Comentario en 1.º Bach (●):** el criterio añade **tres cosas que no están en ningún curso de ESO**, y las tres se leen en la misma frase: las relaciones externas del texto ya no son solo con el contexto sino también *"con la tradición literaria"*, el análisis se hace *"utilizando un metalenguaje específico"* y la interpretación va *"incorporando juicios de valor vinculados a la apreciación estética de las obras"*. Las tres tienen su correlato en los saberes de *Lengua I*: *"Interpretación crítica de fragmentos u obras significativas desde la Edad Media hasta el Romanticismo"*, *"Comunicación de la experiencia lectora utilizando un metalenguaje específico"* y *"Expresión argumentada de la interpretación de los textos, integrando los diferentes aspectos analizados"*. De las tres, solo el metalenguaje se convierte en dimensión propia; el juicio estético entra **dentro** de la interpretación, porque el criterio no lo pide como tarea aparte sino *incorporado* a ella.
- **Comentario en 2.º Bach (●):** el criterio es el de 1.º Bach palabra por palabra salvo el giro inicial —*"Explicar y argumentar la interpretación de las obras leídas a partir del análisis de las"*, donde 1.º Bach dice *"mediante el análisis de las"*—, así que **la diferencia entre los dos cursos no vive en el criterio sino en el corpus de los saberes**, igual que en el pack argumentativo (decisión 11 de §17): donde *Lengua I* dice *"Interpretación crítica de fragmentos u obras significativas desde la Edad Media hasta el Romanticismo"*, *Lengua II* dice *"Interpretación crítica de fragmentos u obras significativas del último cuarto del siglo XIX y de los siglos XX y XXI"*, organizados en los tres ejes del curso. Los descriptores de 2.º Bach recogen ese corpus; la `progresion` es la misma que la de 1.º Bach en los tres ejes.

- **Resumen en 1.º ESO (●):** la puerta es el 4.1 del curso, *"Comprender e interpretar el sentido global, la estructura, la información más relevante y la intención del emisor en textos escritos y multimodales sencillos"*, y los saberes nombran la tarea con todas las letras: *"Usos básicos de la escritura para la organización del pensamiento: toma de notas, esquemas, mapas conceptuales, definiciones, resúmenes, etc."*. El resumen es la única tarea de la matriz cuya puerta **no** la abre el 5.1: el 5.1 y el 5.2 sostienen aquí lo que el alumno escribe —la redacción y la corrección— pero no lo que distingue a esta tarea de cualquier otro texto propio, que es la dependencia de un texto de partida.
- **Resumen en 2.º ESO (celda vacía):** *no hay criterio que abra la puerta.* El 4.1 del curso es el de valoración crítica y en 2.º ESO la competencia 4 **no tiene ningún otro criterio**: no queda en todo el curso una redacción que pida reconstruir el sentido global de un texto escrito. Es la situación inversa a la del comentario en 2.º ESO —allí el saber nombraba la tarea y faltaba el criterio—; aquí faltan los dos, porque el bloque de producción escrita de 2.º ESO tampoco repite la fórmula de 'resúmenes' que sí tienen 1.º, 3.º y 4.º.
- **Resumen en 3.º ESO (●):** el 4.1 vuelve a ser el de comprensión, ahora sobre *"textos escritos y multimodales de cierta complejidad"*, y el saber recupera la fórmula con el escalón escrito dentro: donde 1.º dice *"Usos básicos de la escritura para la organización del pensamiento"*, 3.º dice *"Profundización en los usos de la escritura para la organización del pensamiento: toma de notas, esquemas, mapas conceptuales, definiciones, resúmenes, etc."*. **La progresión entre los dos cursos vive en esa palabra que aparece y en el 'de cierta complejidad' del criterio**, no en una calibración del diseñador (CLAUDE.md, regla 2).
- **Resumen en 4.º ESO (celda vacía):** es la celda más incómoda de toda la matriz y la que más claramente obliga a aplicar la regla 9. Los saberes de 4.º ESO **sí nombran la tarea** —*"Desarrollo de usos de la escritura para la organización del pensamiento: toma de notas, esquemas, mapas conceptuales, definiciones, resúmenes, etc."*—, pero su 4.1 es el de valoración crítica y la competencia 4 no tiene otro criterio en el curso. **Un saber no abre una celda**, y el candidato más cercano, el 6.1, no sirve: pide *"Localizar, seleccionar y contrastar información de manera autónoma procedente de diferentes fuentes"*, que es investigación documental sobre varias fuentes, no la reconstrucción fiel de un texto único. Que el 4.º curso de ESO se quede sin rúbrica de resumen mientras sus saberes lo nombran es un resultado desagradable, y es exactamente el resultado que la regla 9 obliga a aceptar: la alternativa —abrir la celda con el saber— es la que produjo el único error de derivación que llegó al docente.
- **Resumen en 1.º y 2.º Bach (○):** el 4.1 de los dos cursos es el mismo y es el de comprensión (*"Identificar el sentido global, la estructura, la información relevante y la intención del emisor de textos escritos y multimodales especializados"*), así que la puerta está abierta en ambos; lo que ya no aparece en ningún sitio es la palabra 'resúmenes', que en Bachillerato desaparece de los saberes. El vehículo es otro: *"Comprensión lectora: sentido global del texto y relación entre sus partes. La intención del emisor"* y, para la operación de condensar, *"análisis, valoración, reorganización y síntesis de la información en esquemas propios y transformación en conocimiento"*. Eso es ○ en su acepción de 'ausente del bloque de saberes de ese curso concreto'. **La diferencia entre los dos cursos de Bachillerato no está en el criterio, que es idéntico palabra por palabra, sino en el corpus de los saberes**, igual que en el argumentativo y en el comentario: *Lengua I* dice *"Producción de textos expositivos escritos del ámbito académico"* y *Lengua II* dice *"Producción de textos argumentativos escritos del ámbito académico"*, y por eso el pack resume en 1.º Bach la línea de un razonamiento y en 2.º Bach la tesis y los argumentos que la sostienen.

La correspondencia entre esta matriz y los packs se comprueba mecánicamente (`scripts/verificar_derivacion.py`), que la lee de `data/`: un criterio cuyo curso tenga la celda vacía no pasa, y toda cita entrecomillada de esta sección debe encontrarse literalmente en su fuente.

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
  "evalua_proceso": false,
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
- `evalua_proceso` es opcional y vale `false` si no aparece: la dimensión evalúa el texto terminado. Se pone a `true` cuando lo que describen sus descriptores es una fase del proceso —el esquema, el borrador, las marcas de revisión— y no el producto, que es lo que premarca la puerta de *fase de un texto* (§8.1). Es una declaración de contenido, no una etiqueta libre: el validador rechaza el `true` que la cita del criterio no sostenga (§10). Hoy lo llevan las dimensiones de planificación y revisión de los packs de texto; el de exposición oral no marca ninguna, porque sus criterios evalúan el discurso realizado.
- `FORMULAS_PROCESO` (§10) no incluye la palabra "esquema": el 6.1 de tratamiento de la información usa "organizarla e integrarla en **esquemas propios**" para la reorganización mental de información ajena dentro del texto terminado, no para el esquema como fase previa de escritura. Coinciden en la palabra, no en el referente. Comprobado curso a curso: los descriptores de `tratamiento_informacion` en los seis cursos de los dos packs de texto describen siempre marcas sobre el texto acabado (citar la fuente, contrastarla, documentarla), nunca algo observable en un esquema o un borrador —regla de simetría, ausente en cinco de los seis cursos que sí llevarían la cita si se buscara solo la subcadena—. Decisión del 2026-08-06.

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

El Marco Teórico §8 define el escalado vertical desde 2.º de ESO. Al incorporar 1.º, el eje necesita un peldaño más por debajo, que el propio currículo proporciona: los criterios de 1.º están redactados con las fórmulas *"de manera guiada"*, *"con la ayuda de pautas y modelos"* y *"sencillos"*. Ese es el nivel 1 de cada eje.

**Los tres ejes no avanzan en pareja entre 4.º ESO y 1.º Bach.** El Marco Teórico §8 describe cada eje con solo dos polos (inicio y culminación), y el polo alto no es el mismo tramo en los tres:

- *Autonomía*: culmina en **"4.º ESO – 1.º BACH"** juntos («planificación autónoma y autorregulada»).
- *Complejidad textual*: culmina en **"1.º BACH"** en solitario («textos híbridos con matización argumentativa y gestión del contraargumento»); 4.º ESO no aparece emparejado en esta cita.
- *Metalingüístico*: culmina también en **"1.º BACH"** en solitario («justificación teórica y estilística autónoma de las elecciones propias»).

Una versión anterior de esta tabla aplicó el mismo agrupamiento '4.º ESO / 1.º Bach' a los tres ejes por uniformidad de implementación (el campo `progresion` se rellenaba con el mismo número en los tres ejes dentro de un curso). Eso contradice la fuente: en complejidad y metalingüístico, 1.º Bach es un peldaño propio por encima de 4.º ESO, no el mismo peldaño. Corregido el 2026-08-05 (detectado por el docente al revisar el pack de 1.º Bach).

> **Como la matriz de §4.3, esta tabla tampoco se edita aquí**: vive en `data/derivacion-<materia>.json` y este documento la imprime. Que autonomía comparta peldaño en la última columna se escribe allí como `mismo_nivel_que`, no repitiendo el número: era justo la uniformidad que produjo el error de arriba.

<!-- TABLA GENERADA: ejes-progresion · fuente: data/derivacion-<materia>.json · se reescribe con: python scripts/generar_tablas_sdd.py -->
| Eje | 1 — 1.º ESO | 2 — 2.º/3.º ESO | 3 — 4.º ESO | 4 — 1.º Bach |
|---|---|---|---|---|
| **Autonomía** | Tarea guiada con pauta y modelo a la vista | Tarea acompañada, con modelo retirado en la revisión | Planificación autónoma con revisión entre iguales | *(mismo nivel que 4.º ESO — el Marco Teórico los empareja)* |
| **Complejidad textual** | Texto sencillo, un solo propósito, estructura dada | Texto de estructura propia, un propósito dominante | Texto con matización incipiente | Texto híbrido, con matización argumentativa y gestión del contraargumento |
| **Metalingüístico** | Detección guiada del fenómeno sobre el modelo | Detección autónoma en el propio borrador | Justificación de la elección lingüística | Justificación teórica y estilística autónoma de las elecciones propias |
<!-- FIN TABLA GENERADA -->

Para autonomía, 4.º ESO y 1.º Bach comparten el nivel 3 (no hay nivel 4 distinto: el Marco Teórico no describe un peldaño de autonomía superior al de 1.º Bach dentro de su alcance). Para complejidad y metalingüístico, 4.º ESO ocupa el nivel 3 y 1.º Bach el nivel 4, que es también el techo que define el Marco Teórico — el proyecto de Lengua no llega a 2.º Bach.

**2.º Bach queda fuera de lo que define el Marco Teórico en los tres ejes, no solo en dos.** La revisión del 2026-08-05 corrigió complejidad y metalingüístico pero dejó intacto el nivel 4 de autonomía para 2.º Bach como si estuviera fundamentado; no lo está. La cita de autonomía también culmina en *"4.º ESO – 1.º BACH"* sin mencionar 2.º Bach, igual que las otras dos. El Marco Teórico no define ningún peldaño de ningún eje por encima de 1.º Bach, porque el proyecto de Lengua no llega ahí. Esta app sí cubre 2.º Bach legítimamente (CLAUDE.md), pero su posición exacta en `progresion`, en los tres ejes sin excepción, es una extrapolación de este SDD, no una lectura de la fuente — ver decisión abierta §17.11.

**Regla del techo (2026-08-05).** El campo `progresion` de un criterio nunca supera el nivel que esta tabla asigna a su curso: una progresión por encima es exigencia colada desde arriba y no se carga. Puede quedar **por debajo** únicamente cuando la redacción del criterio oficial lo justifica con una fórmula de rebaja del propio decreto — *"de manera guiada"*, *"sencillos"*, *"con la ayuda de pautas y modelos"*, *"procedimientos básicos"* —, porque el criterio es la puerta también hacia abajo: el decreto escala el 5.2 de *"procedimientos básicos"* (1.º-2.º ESO) a *"Incorporar progresivamente procedimientos"* (3.º) y a *"procedimientos"* a secas (4.º), y esa rebaja redactada vale más que la fila de esta tabla, que resume el caso general del curso. La comprobación es mecánica: `scripts/verificar_derivacion.py`, que también verifica que todo lo entrecomillado en esta sección y en §4.3 sea cita literal del currículo o del Marco Teórico.

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

**Conectado.** La escala de estimación analítica (§7.7) declara el detractor
(`DETRACTOR_ESTIMACION` en `js/motor.js`) y lo imprime con su tope. La pantalla de «Calificar»
(§6.5, `js/calificar.js`) tiene un campo numérico que captura `detractorAcumulado` — acotado en el
cliente entre 0 y el tope antes de llamar a `calcularNota`, porque esta función solo acota el tope
superior y un valor negativo escrito a mano subiría la nota en vez de bajarla — y persiste junto al
resto del `ResultadoCriterio` guardado por alumno.

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

**Una dimensión sin matriz vale el nivel entero, y solo hay una escala.** Durante un tiempo el proyecto sostuvo dos a la vez sin que se notara: `scripts/simular_correccion.py` valoraba las dimensiones sin matriz con los puntos medios de cada banda `{1: 2,5 · 2: 6,0 · 3: 8,0 · 4: 9,5}`, y §6.2 con la escala equilibrada `2,5 / 5 / 7,5 / 10`. Las dos son internamente coherentes —releídas con esta tabla, ambas devuelven el nivel del que salieron— pero no dan la misma nota: sobre el mismo perfil simulado de 1.º de ESO, una daba 5,10 y la otra 4,90. El mismo texto aprobaba o suspendía según qué archivo del proyecto se mirase.

Manda la escala de §6.2 y el script se ajustó a ella. La razón de fondo no es su respaldo documental —que lo tiene: 5 es lo que sacaría la dimensión si todos sus componentes estuvieran en Conseguido, el 50 % de la fuente— sino que es la que se imprime en la ficha del alumno y la que se corresponde con el vocabulario que la familia ya entiende: **Conseguido 5 (suficiente), Avanzado 7,5 (notable), Excelente 10 (sobresaliente)**. Una calificación tiene que poder explicarse sin enseñar la estadística de una franja.

Queda a cambio una asimetría conocida, que conviene tener prevista porque un alumno la puede preguntar: un Conseguido juzgado por descriptor vale 5,0, mientras que un Conseguido medido con matriz puede valer 6,5. La diferencia viene de que la matriz mide con más precisión, que es exactamente su razón de ser (§5.2), y se responde enseñando la matriz.

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
| 7.7 | Escala de estimación analítica | avanzado | Desarrollo largo, comentario de texto |
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

Para lo que el Marco Teórico §5 llama desarrollo largo y pruebas de formato extenso (comentario de texto, redacción larga). Es una rúbrica simplificada con puntuación directa por apartado, más el bloque de detractores declarados (§6.2).

**No cita las directrices EBAU de la Región de Murcia**, ni en Bachillerato ni en ningún otro curso. Se descartó como decisión de diseño, no como hueco de contenido pendiente: la calificación de un curso oficial de 2.º de Bachillerato se rige por los criterios de evaluación del currículo LOMLOE, no por los criterios de corrección de la prueba de acceso a la universidad, que fija y aplica la comisión organizadora de la EBAU para esa prueba concreta. Importar esas directrices a la cabecera de un instrumento de calificación de aula sería exactamente lo que la regla #1 de `CLAUDE.md` prohíbe: un criterio sin `criterio_oficial` citable del decreto. Que el formato de la prueba (desarrollo largo, comentario de texto) se parezca al de la EBAU es una razón para elegir este instrumento, no una fuente normativa para su contenido.

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
| Desarrollo largo, comentario de texto | Propone la **escala de estimación analítica** (7.7) en lugar de la rúbrica analítica completa. |
| Tarea de desempeño o proyecto | Terreno natural: **rúbrica analítica** completa. |
| Tarea diaria, borrador, ejercicio de proceso | Propone **lista de cotejo** o **rúbrica de un solo punto**, y desaconseja la rúbrica completa. |
| Fase de un texto: esquema, borrador, revisión, párrafo suelto | **Premarca solo las dimensiones de proceso** (§8.1) y abre la **lista de cotejo**. |

La app propone y explica; el profesor puede seguir adelante con otra elección. Educa, no impone. Lo que la puerta recomienda es también lo que entrega: `instrumentoRecomendado` elige la pestaña con la que se abre la vista previa. Un consejo que hay que ir a buscar a otra pestaña no es un consejo, es letra pequeña.

### 8.1 Fase de un texto: qué se premarca y por qué

Las otras cuatro respuestas eligen instrumento; esta elige además **qué dimensiones vienen marcadas**, porque lo que se entrega no es el texto. En un esquema no hay cohesión que observar y en un borrador la corrección normativa aún no se juzga: lo evaluable es el trabajo de planificación y de revisión.

Cuáles son esas dimensiones **lo declara el pack**, en el campo `evalua_proceso` (§5.2), y no lo deduce el motor. La razón es que de la cita no se deduce: el 5.1 de Murcia dice *"Planificar la redacción de textos escritos y multimodales sencillos… redactar borradores y revisarlos"* y es a la vez el criterio que sostiene la adecuación, la coherencia y la cohesión del texto terminado. Un premarcado leído de la cita marcaría media rúbrica — el mismo error que las familias de modalizadores descartadas en la nota de §10. Lo que sí se comprueba mecánicamente es la dirección que la cita puede sostener: una dimensión declarada de proceso cuyo criterio oficial no hable de planificar, de borradores ni de revisar no carga (regla `proceso_sin_respaldo`, §10).

**El premarcado nunca vacía el instrumento.** Dos casos de borde, con la misma salida:

- *La dimensión de proceso no sobrevive al filtro de tiempo* (es de prioridad 2 en los packs actuales). Se rescata y se avisa: el filtro de profundidad mide el coste de corregir un texto entero, que es justo lo que aquí no se está corrigiendo.
- *La tarea no tiene ninguna dimensión de proceso.* Es el caso de la exposición oral, cuyos criterios evalúan el discurso realizado. Se mantienen todas premarcadas y se explica por qué, con la invitación a desmarcar en «Ajustar» lo que todavía no se puede observar.

Nada se cierra: las dimensiones no premarcadas siguen en «Ajustar», sin marcar y con su `peso_base` de partida en el deslizador. La puerta premarca, no decide.

---

## 9. Motor de generación

1. Puerta de aplicabilidad (§8) → familia de instrumento recomendada.
2. Comprobar la matriz de tarea × curso (§4.3): si la combinación no existe, explicarlo y proponer la alternativa del curso.
3. Filtrar criterios del pack por `curso` y por `tipos_tarea`, resolviendo las herencias (`hereda_de`).
4. Premarcar dimensiones, agrupadas por bloque LOMLOE (A-D). Lo normal es marcarlas todas; la puerta de *fase de un texto* marca solo las de proceso (§8.1). Lo no premarcado no se descarta: queda sin marcar en el modo avanzado (§11.2).
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
| **Dimensión de proceso sin respaldo** | Un criterio declara `evalua_proceso: true` y su cita oficial no habla de planificar, de borradores ni de revisar. Solo esta dirección: la contraria —deducir de la cita qué dimensiones son de proceso— marcaría media rúbrica (§8.1) | Error |
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
├── data/        packs de criterios, catálogo y tablas de derivación (.json)
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
| **Fase 3** | Reacción a noticia, redacción de noticia, resumen, comentario de texto literario. Banco de criterios favoritos | **Abierta** — el **comentario de texto literario** está escrito (`data/pack-lcl-comentario.json` v0.2.0, 5 cursos, 29 criterios, con la corrección normativa del 5.2 incorporada en la v1.26). Faltan reacción a noticia, redacción de noticia, resumen y el banco de favoritos |
| **Fase 4** | Lectura en voz alta, podcast, línea de tiempo, trabajo grupal. Calculadora de carga de corrección | Pendiente |
| **Fase 5 (opcional)** | Enlace compartible y QR · adaptación NEAE · packs de otras materias · integración con iDoceo Connect | Pendiente |

### 16.1 Desglose de la fase 2

La fase 2 se cerró en el papel como un bloque único y en la práctica se está abriendo por piezas.
Este es el estado real, contrastado con el código:

| Pieza | Estado | Qué falta |
|---|---|---|
| **Validador de calidad (§10)** | Terminado | Nada. Las dieciséis reglas están en `js/validador.js`, en paridad comprobada con `scripts/validar_pack.py` (restaurada en v1.10: cuatro reglas —`saber_vehiculo`, `modalizadores`, `tarea_aplicable`, `copia_entre_cursos`— faltaban en el script y dejaban pasar packs que la app sí rechazaba), con una batería de casos en `test/` |
| **Microexplicaciones (§11.3)** | Terminado | Nada. Catálogo único en `js/microexplicaciones.js`, más un «¿por qué esta regla?» por cada regla del validador |
| **Modo avanzado (§11.2)** | Parcial | Están los pesos libres con normalización a 100 y la selección de dimensiones por bloque. Faltan profundidad, criterios obligatorios, elección de instrumentos, modo de calificación y edición manual de descriptores con el validador activo |
| **Catálogo de instrumentos (§7)** | 7 de 7 | Los siete instrumentos están hechos. Autoevaluación y coevaluación (`generarAutoevaluacion` en `js/motor.js`) reconjugan la matriz completa a 1.ª persona a partir del banco de verbos (ahora 34, tras sumar ocho que solo aparecían como segundo verbo de la frase); casos dorados y un invariante de todo el pack en `test/proyeccion.mjs`. La rúbrica de un solo punto (`generarRubricaUnPunto`) toma `descriptor_un_punto`, relleno en los dieciocho criterios del pack, y se limita a 1-2 dimensiones (Marco Teórico §10). La escala de estimación analítica (`generarEscalaEstimacion`) reparte el peso en puntos directos y declara el detractor de ortografía y presentación (`DETRACTOR_ESTIMACION`), ya capturado en la pantalla de «Calificar» (§6.3). No cita las directrices EBAU de Murcia: descartado por principio, no pendiente por falta de fuente (§7.7) |
| **Modelo de calificación (§6)** | Parcial | Funciona el modo cualitativo. El numérico está completo: funciones puras en `js/calificacion.js` (redondeo, valor de nivel, puntos de matriz, condición mínima, detractor) con casos dorados en `test/calificacion.mjs`, y la pantalla de registro por alumno de §6.5 en `js/calificar.js` (botón «Calificar» en la vista previa), que ahora persiste en `localStorage` por instrumento (curso + tipo de tarea + actividad): guardar, recargar y borrar el resultado de un alumno, incluido el detractor de la escala de estimación (§7.7). Ya conecta con la ficha del alumno (§7.3): un desplegable muestra el nivel y los puntos por dimensión y la nota final de cualquier alumno guardado |
| **Matriz tarea × curso (§4.3)** | **20 de 20 celdas — la matriz de la fase 2 queda completa** (la tabla de §4.3 muestra hoy 25 celdas: las 5 de más son la fila de comentario de texto literario, que es **fase 3**, no un hueco de esta) | **Narración en 1.º, 2.º y 3.º de ESO** (`data/pack-lcl-narracion.json` v0.1.0, 18 criterios), el último tipo de tarea de la v1: cierra la matriz y con ella el contenido curricular de §4.1. Seis dimensiones por curso, de las cuales dos son propias del género y no aparecen en los otros packs: la construcción de la secuencia narrativa (bajo `coherencia`) y la recreación con intención literaria (bloque C, criterio 8.2, la única puerta de los cuatro packs que no es 5.1/5.2/9.1/6.1). El hilo temporal —conectores, correlación de los tiempos de pretérito y referencia a los personajes— va **dentro de `cohesion`**, no como fila propia: son un solo constructo y separarlos habría medido dos veces lo mismo. **Texto expositivo completo en los seis cursos** (`data/pack-lcl-expositivo.json`, 36 criterios); **exposición oral completa en los seis cursos** (`data/pack-lcl-oral.json`, v0.3.0, 30 criterios: cinco dimensiones —adecuación, coherencia, cohesión, fluidez de la oralidad formal y elementos no verbales— por curso, con la matriz de fluidez recalibrada tras el primer pase por ser más exigente de lo razonable para el aula); **texto argumentativo completo en 2.º, 3.º y 4.º de ESO y en los dos cursos de Bachillerato** (`data/pack-lcl-argumentativo.json` v0.2.0, 30 criterios). Los tres packs resuelven la decisión abierta 11 de §17 reutilizando en 2.º Bach el mismo peldaño de progresión que 1.º Bach en los tres ejes: la diferencia real entre los dos cursos vive en la redacción del criterio oficial y del descriptor, no en el número de `progresion`. No falta ninguna celda: los cuatro tipos de tarea de §4.1 están escritos en todos los cursos donde el currículo los sostiene |
| **Exportación (§12)** | Parcial | Impresión y PDF funcionan. Faltan `.xlsx` para iDoceo, configuración `.json` y el texto plano del modo IA |
| **Publicación** | Parcial | Repositorio creado y validación automática en cada empujón. Falta activar GitHub Pages y decidir la URL estable |

**Orden sugerido para seguir.** Primero el modo numérico (§6.2), porque diez criterios ya tienen la
matriz cargada y sin él ese contenido no se usa. Después la autoevaluación y la coevaluación, que
son proyección del contenido existente y no piden pack nuevo: coste bajo y valor alto en el aula.
La ampliación de la matriz tarea × curso puede avanzar en paralelo, porque no toca código. La
exportación `.xlsx` se deja para el final del bloque: es la única pieza que introduce una
biblioteca externa (§13) y conviene decidirla junto con el solapamiento con el skill
`rubricas-lomloe`, que sigue abierto (§17.8).

**La fase 3 se ha abierto por delante de las piezas que le quedan a la fase 2**, y a propósito:
el comentario de texto literario es material de aula del curso que viene y no toca código —el pack,
la entrada del catálogo y las celdas de `data/derivacion-lcl.json`, nada más—, así que no compite con
lo que falta aquí. De su escritura salen dos cosas que no son del pack sino del proyecto. **Una, la
primera celda vacía en medio de una fila** (2.º ESO), que obligó a comprobar que la regla 9 de
CLAUDE.md se sostiene también en la dirección contraria: un saber que nombra la tarea no abre la
celda si ningún criterio del curso la pide. **Y dos, que el barrido manual de la regla 1 sigue
encontrando lo que ningún invariante ve** —cinco defectos en 96 descriptores proyectados, uno de
ellos una reaparición de la trampa del `\b` con letras acentuadas (`\bcita\b` casando dentro de
expl-*ícita*)—: es la tercera versión seguida en que la lectura de los proyectados aporta algo que
`comprobar_todo.py` no puede aportar, y confirma que ese paso no debe automatizarse a la ligera.

---

## 17. Decisiones abiertas

1. **Condición mínima de los criterios obligatorios** (§6.2). Propuesta: desactivada por defecto. Pendiente de tu confirmación, porque afecta a cómo se defiende una calificación.
2. **Escala por defecto** (§6.2): equilibrada o exigente. Propuesta: equilibrada.
3. **Tope de los detractores** (§6.2): 2 puntos sobre 10. Pendiente de contrastar con lo que hace el departamento. No se contrasta con las directrices EBAU de Murcia: la calificación de un curso oficial se rige por el currículo, no por los criterios de corrección de una prueba externa (§7.7).
4. ~~**Número exacto del decreto autonómico** de currículo de ESO de la Región de Murcia~~ — **Resuelto.** Decreto n.º 235/2022, de 7 de diciembre, localizado en `fuentes/curriculo/Decreto-158-2024_modificacion-ESO_BORM-181-05-08-2024.md` (que lo cita al modificarlo) y ya escrito en `normativa.autonomica` de `data/pack-lcl-expositivo.json`. El decreto equivalente de Bachillerato es el n.º 251/2022, de 22 de diciembre, todavía sin uso porque no existe pack de Bachillerato.
5. **Códigos de criterio de evaluación**: confirmar la numeración exacta por curso y competencia específica al construir el pack, contra el texto del BORM.
6. **Rúbrica holística** (Marco Teórico §6.1): admisible para tareas muy acotadas. Pendiente de decidir si entra como octavo instrumento o se descarta por sostenibilidad.
7. ~~**Matriz de tarea × curso**~~ (§4.3) — **Resuelto el 2026-08-05.** La he construido leyendo los criterios del decreto, pero era una lectura mía y quien da clase es Josele. Las dos celdas discutidas quedan ratificadas:
   - **Narración en 3.º ESO: sí llega, como ○** (residual: el foco del curso ya se ha desplazado al expositivo/argumentativo). Confirmado para S6 del plan de cierre de fase 2, que puede escribir el pack de narración sin pararse a consultarla de nuevo. *Comprobado al escribir el pack el 2026-08-07: el 5.1 y el 8.2 de 3.º ESO sostienen la celda y ningún saber del curso nombra el género, que es exactamente lo que ○ significa.*
   - **Argumentativo en 2.º ESO: sí se sostiene, como ○.** El criterio 5.1 de 2.º ESO no nombra género (*"Planificar la redacción de textos escritos y multimodales sencillos..."*, igual que en 1.º, 3.º y 4.º), y los saberes básicos de 2.º ESO (bloque B, punto 2) tampoco nombran ni "expositivas" ni "argumentativas" — a diferencia de 3.º y 4.º, que sí dicen *"con especial atención a las expositivas y argumentativas"*. El criterio abre la puerta; los saberes, silenciosos en 2.º, no enfocan ningún género, así que ○ es la lectura simétrica correcta. Confirmado para S1 del plan de cierre de fase 2.
8. **Marco teórico superado (bloqueante).** El SDD se ha diseñado contra `Marco_Teorico_Rubricas_LOMLOE.md`, que es una versión anterior. La vigente vive en el proyecto de lengua (`documentos_base/marco_teorico_rubricas-LOMLOE.md`) y corrige el alcance a 1.º ESO – 1.º BACH, fija bandas de calificación sobre 10, impone un guardarraíl de terminología y remite al skill `rubricas-lomloe`. Afecta a §4.1, §6.2 y §7.7. Análisis completo y propuestas en `ENLACE_con_proyecto_lengua.md`.
9. **Publicación** (§16.1): el repositorio existe (`josele-duplex/rubricas`) y la validación se ejecuta en cada empujón, pero falta decidir si la aplicación se publica en GitHub Pages con URL estable y si el repositorio se hace público. Afecta a lo que puede contener `fuentes/`, que hoy guarda material aportado sin revisar para difusión.
10. **Ampliación del marco teórico a 1.º de ESO**: el `Marco_Teorico_Rubricas_LOMLOE.md` describe la progresión desde 2.º de ESO. Los ejes extendidos de §5.4 cubren el hueco dentro de este SDD; conviene reflejarlo también en el marco para que ambos documentos digan lo mismo.
11. ~~**Posición de 2.º Bach en los tres ejes de progresión**~~ (§5.4) — **Resuelta el 2026-08-06**, al escribir `lcl-b-*-oral-2bach` en `data/pack-lcl-oral.json`: primer pack con criterios de 2.º Bach. Se optó por **reutilizar el mismo peldaño que 1.º Bach** en los tres ejes (autonomía 3, complejidad 4, metalingüístico 4) porque es la única opción con respaldo en el Marco Teórico, que no describe ningún peldaño por encima de 1.º Bach. La diferencia real entre los dos cursos vive en la redacción del criterio oficial y del descriptor —«extensas en las que se recojan diferentes puntos de vista» frente a la versión de 1.º Bach sin ese matiz—, no en el número de `progresion`. **Aplicada también en el pack argumentativo (registro de cambios v1.15) y en el expositivo (v1.16, `lcl-b-*-expo-2bach`), que cierra los tres packs de texto escrito y oral en 2.º Bach.**
12. ~~**Posible desajuste en texto expositivo, 2.º ESO (§4.3)**~~ — abierta el 2026-08-05 al ratificar la decisión 7, **resuelta el 2026-08-06 con el skill `rubricas-pack`: la celda pasa a ○ y el pack deja de citar un saber que 2.º ESO no tiene.** La sospecha se confirma y la revisión la amplía en dos direcciones. **(a) La cita no existe:** barridos los cuatro cursos de ESO, "secuencias textuales" y "expositiv-" aparecen en los saberes de 1.º (*"…narrativas, descriptivas, dialogadas y expositivas"*), 3.º y 4.º, y **cero veces en 2.º**; tampoco "argumentativ-". El `saber_vehiculo: ["secuencias textuales expositivas", ...]` de los tres criterios de bloque B de 2.º era la redacción de los cursos vecinos trasladada a un curso que no la tiene, y se sustituye por saberes reales del bloque de 2.º (§4.3). **(b) Había además una asimetría**, que es lo que convierte esto en un error y no en una elección: la celda gemela —argumentativo en 2.º ESO— ya estaba marcada ○ desde la decisión 7 por esta misma razón, con la misma respuesta a la misma pregunta. Mismo criterio 5.1 sin género y mismos saberes sin género producían dos símbolos distintos. **Sigue abierto el agujero de fondo que lo permitió:** `scripts/verificar_derivacion.py` contrasta `criterio_oficial.cita` contra la fuente literal, pero no `saber_vehiculo`, así que ni el validador ni el verificador lo habrían atrapado — ver decisión 13.
13. ~~**`saber_vehiculo` no se verifica contra la fuente**~~ — abierta el 2026-08-06 al resolver la 12, **resuelta el 2026-08-07 tras medir sobre los tres packs.** **La medición descarta la comprobación literal completa:** de las 221 entradas de `saber_vehiculo` en los tres packs, solo el 57,5% coincide como subcadena exacta con `fuentes/curriculo/`; el 42,5% restante son parafraseos y descomposiciones legítimas de una cita real (*"Análisis de las propiedades textuales: coherencia, cohesión y adecuación"* se trocea en tres entradas), no citas fabricadas. Confirmado con un contraste más fino por solapamiento de palabras: de esas 94 entradas "no literales", 91 comparten al menos el 40% de su léxico con algún punto de la fuente —parafraseo real—, y las 3 restantes (*"marcadores de concesión y refutación"*, *"subordinación causal y concesiva"*) son etiquetas conceptuales del redactor, no afirmaciones de cita. Escribir una regla literal sobre todo el campo habría marcado como error casi la mitad de un contenido ya validado y en uso — exactamente lo que el corolario de simetría de CLAUDE.md prohíbe. **Se implementa en su lugar una regla estrecha** (`comprobar_genero_saber_vehiculo`, comprobación 5 de `verificar_derivacion.py`): de las 221 entradas, solo 27 nombran un género (expositivo, argumentativo, narrativo) — es lo único de `saber_vehiculo` con una respuesta binaria verificable, y es exactamente el campo que falló en la decisión 12. La regla exige que el género nombrado aparezca en el segmento de fuente de **ese curso concreto** (cabeceras "Primer/Segundo/Tercer/Cuarto curso" en ESO, "Lengua Castellana y Literatura I/II" en Bachillerato, con el preámbulo de cada archivo —donde vive la descripción compartida de competencia que sostiene la celda de 2.º Bach— añadido a todos los cursos de su archivo). Con esta regla, los tres packs pasan sin incidencias y el caso dorado que reproduce la corrupción exacta de la decisión 12 (`secuencias textuales expositivas` puesto en un criterio de 2.º ESO) se detecta en `--auto-prueba`.

14. ~~**Narración en 2.º ESO estaba marcada ● sin cita que lo sostuviera (§4.3)**~~ — abierta y **resuelta el 2026-08-07**, al escribir `data/pack-lcl-narracion.json` con el skill `rubricas-pack`. **La celda pasa a ○.** No es una decisión nueva: es la tercera aplicación de la misma regla que ya resolvió la 7 (argumentativo en 2.º ESO) y la 12 (expositivo en 2.º ESO), y el propio SDD la tenía escrita desde la 12 —*"2.º ESO es el único curso de ESO cuyos saberes no nombran ningún género"*— mientras la fila de narración seguía diciendo ● en la tabla de al lado. **La medición, curso a curso sobre el bloque de Lengua Castellana y Literatura del decreto:** "narrativ-" aparece **1 vez en 1.º ESO** (*"…con especial atención a las narrativas, descriptivas, dialogadas y expositivas"*) y **0 veces en 2.º y en 3.º**. Lo único que dice "narraciones" en 2.º ESO es el criterio **3.1**, de producción **oral**, que es la puerta de la fila de exposición oral: no abre una celda de texto escrito, igual que el 5.1 no abre una celda de oral. **La corrección no vacía nada** —el pack tiene sus seis criterios de 2.º ESO, validados— y respeta el corolario de simetría de CLAUDE.md en las dos direcciones: no invalida ningún pack ya validado y deja las tres celdas de texto de 2.º ESO con el mismo símbolo por la misma razón. Comprobado además que la regla no rompe la fila entera: 1.º ESO sigue siendo ● con dos citas, y 3.º ESO sigue siendo ○ como ratificó el docente en la decisión 7.
15. ~~**Dos descriptores del pack argumentativo imprimen la autoevaluación con los dos sujetos mezclados.**~~ — abierta y **resuelta el 2026-08-07 (v1.22), y resuelta más ancha de lo que se abrió.** Los dos descriptores están reescritos —*"…y **formula** la respuesta personal a la lectura en conexión con la valoración defendida"*—, `pack-lcl-argumentativo.json` entra en `PACKS_CON_INVARIANTE`, y el resto legítimo de *"la forma deíctica … que ajusta la distancia"* pasa a `EXCEPCIONES_DELIBERADAS` con su motivo. **Lo que la decisión no veía es que esos dos descriptores no eran dos casos, sino la punta de una clase**: el invariante solo compara contra las formas del **banco**, así que un verbo en 3.ª persona con el alumno como sujeto que no esté declarado —«y **dedica** un párrafo a cada aspecto», «y **recurre** a la aposición», «y **documenta** todas las fuentes»— produce exactamente el mismo «yo» y «él» y no dispara nada. Barrida esa clase sobre los descriptores **proyectados** (regla 1), 43 de los 264 del expositivo y el argumentativo salían mal; ver el registro de la v1.22 para el reparto entre declarar el verbo y reescribir el descriptor, y para el caso `sigue`, que es verbo inequívoco y aun así no se declara porque habría roto el pack de narración. **Lo que queda abierto es la decisión 16**, no esta. *Texto original de la decisión:* abierta el 2026-08-07 al ampliar el invariante de `test/proyeccion.mjs` a los cuatro packs (hasta entonces solo recorría el expositivo, exactamente el hueco que la v1.13 ya dejó anotado). El N4 de `lcl-c-fuentes-arg-1bach` y el de `lcl-c-fuentes-arg-2bach` terminan en *"…y explicita la respuesta personal que la lectura **le** provoca, conectándola con la valoración que **defiende**"*: proyectado a 1.ª persona sale «Integro los vínculos… y explicita… que le provoca… que defiende», que es el mismo defecto del "se dirige" de la v1.4. Es de contenido, no de motor: **se arregla reescribiendo los dos descriptores, no ampliando la excepción de `reconjugarSecundarios`** (lo mismo que se decidió en la v1.13 con «a quien defiende lo contrario»). Hasta entonces, `pack-lcl-argumentativo.json` se queda fuera de la lista `PACKS_CON_INVARIANTE` del test, con el motivo escrito allí, para que la lista de excepciones no legitime un fallo. El tercer resto que aparece en ese pack —*"la forma deíctica … que ajusta la distancia"*, `lcl-b-adecuacion-arg-4eso` N4— sí es legítimo: el sujeto es la forma deíctica, no el alumno.
16. ~~**La autoevaluación sigue mezclando los dos sujetos en los otros dos packs y por una segunda vía.**~~ Abierta el 2026-08-07 al cerrar la 15, y abierta con la medición hecha, no como sospecha. **Resuelta entera el 2026-08-11: el frente (a) en la v1.23 y el (b) en la v1.24.**

    **(a) ~~La regla 1 no se ha pasado al oral ni a la narración~~ — Resuelto.** Barridos los 192 descriptores proyectados de los dos packs, el defecto sale **más ancho que la medición que abrió la decisión: 22 descriptores del oral y 3 del de narración**, no 16 y 2. Las tres bolsas que la primera lectura no vio son el verbo detrás de «que» (*"el conocimiento previo que **atribuye** al público"*), la enumeración entre paréntesis —*"(**repite** o **aclara** si **detecta** que no le siguen)"*, tres verbos en un solo descriptor— y el infinitivo con pronombre reflexivo de 3.ª persona, *"sin **apoyarse** en la lectura literal de las notas"*, que no es un verbo conjugado y hace exactamente el mismo daño («Regulo el ritmo… sin apoyarse»), tres veces. Arreglado con las dos direcciones de la v1.22: **6 altas en el banco** (`añade`, `anuncia`, `deja`, `enlaza`, `piensa`, `vuelve`) y **19 descriptores reescritos**. Los dos avisos de la propia decisión se confirman: `cuenta` y `mezcla` van por reescritura, no por alta. Y aparece un tercero que la decisión no preveía: **`repite` tampoco puede declararse**, aunque es verbo inequívoco y suma cinco descriptores con el alumno como sujeto, porque `pack-lcl-argumentativo.json` dice *"con un cierre que **la** repite con las mismas palabras"* —sujeto «un cierre», y el guardarraíl `(?<!\bque )` no lo tapa porque delante hay «la», no «que»—: declararlo habría roto un pack ya validado. Es el `sigue` de esta versión, y queda pinchado como caso dorado en `test/proyeccion.mjs`. *Texto original:* 16 descriptores proyectados del pack oral y 2 del de narración llevan un verbo en 3.ª persona con el alumno como sujeto y fuera del banco —*"y **anuncia** el tema al empezar"*, *"y **repite** muletillas"*, *"**deja** tiempo para la conclusión"*, *"aunque **mezcla** alguna expresión coloquial"*, *"gestos que refuerzan lo que **dice**"*—. Se barren igual que el expositivo y el argumentativo: leyendo los proyectados, declarando el verbo inequívoco y reescribiendo el resto. Ojo con dos de ellos: `cuenta` es el ejemplo de libro de por qué no se declara a ciegas —*"**cuenta** con los dedos"* es verbo, pero *"por su **cuenta**"* aparece 10 veces en los cuatro packs y declararlo escribiría «por su cuento»—, y `mezcla` está en el mismo caso.

    **(b) ~~Hay un segundo frente que la regla 1 no toca: los posesivos y el dativo de 3.ª persona.~~ — Resuelto el 2026-08-11 (v1.24).** La decisión que pedía —contenido o motor— **se resuelve en el contenido, y por una razón que no es la de las veces anteriores.** Las otras veces el motor no podía porque habría que analizar la frase; aquí eso también es cierto —la mitad larga de los `su` de los packs es legítima y ninguna regla general los distingue—, pero además había una vía de motor que **sí** funcionaba: dos entradas literales en `SUSTITUCIONES_ESPECIALES` se llevaban las dos bolsas grandes. Se descarta igualmente porque deja 19 apariciones sueltas pidiendo una entrada cada una, y eso convierte a `js/motor.js` en el inventario del contenido: **cada pack nuevo, y con él cada materia nueva, obligaría a editar código**, que es lo que `docs/diseno/anadir-una-materia.md` declara fallo de diseño. La reescritura, además, no es un apaño: el castellano tiene el equivalente sin posesivo —«por cuenta propia», «con palabras propias», «a las notas»—, que dice lo mismo y **proyecta bien en las dos personas por construcción**. **La medición volvió a salir al alza: 35 apariciones, no 26.** Las dos bolsas grandes salieron exactas (10 y 6), así que el error estaba entero en las "sueltas" —20, no 11— y era una bolsa completa que la primera lectura no vio: los **9 *"sus notas"* del pack oral**. **Lo que no se automatiza es la reescritura, no la comprobación**, y esa distinción es el resultado duradero de la decisión: `test/proyeccion.mjs` lleva ahora un segundo invariante fail-closed —todo `su`/`sus` de un descriptor proyectado debe estar declarado con su referente, todo `le`/`les` es error— con la lista de referentes en `data/reglas-lexicas.json` **por materia**, no en el test. Quedan 46 posesivos legítimos, cada uno con el suyo escrito al lado. *Texto original:* *"Explico con **sus** propias palabras"*, *"Reviso el borrador por **su** cuenta"*, *"siguiendo el orden en que se **le** ocurren"*: ningún verbo está mal conjugado y aun así la frase imprime «él» dentro de una frase en «yo». Eran **27 apariciones inequívocas** en los cuatro packs —10 de *"por su cuenta"*, 6 de *"con sus propias palabras"* y 11 sueltas—; el barrido de (a) se llevó **una** de rebote, el *"que no **le** siguen"* que vivía dentro de un descriptor reescrito, así que **quedan 26** y las dos bolsas grandes intactas. No se pueden barrer con la misma herramienta, porque `su` es legítimo cuando el referente no es el alumno (*"cita **su** procedencia"* habla de la información, *"la fiabilidad de cada fuente a partir de **su** autoría"* habla de la fuente). Es decir: se lee, no se automatiza. **Lo que sí conviene decidir antes de barrer** es si esto se arregla en el contenido, como la 15, o si la proyección debe encargarse también de los posesivos: es la primera vez que el defecto no vive en un verbo, y `reconjugarSecundarios` no tiene hoy ningún criterio para saber de quién es un `su`.

17. **Dos números del comentario que necesitan el criterio de quien da clase**, abierta el 2026-08-11 al recalibrar los umbrales de faltas (v1.27). Los dos salieron de la misma simulación por perfiles y ninguno se puede cerrar desde el repositorio.

    **(a) La extensión orientativa del comentario.** Todo el recálculo se apoya en que el comentario escolar ronda las 120 palabras en 1.º de ESO y las 280 en 2.º de Bachillerato, más o menos la mitad de un expositivo del mismo curso. **Eso no está en el currículo**: el decreto no cuenta palabras en ningún curso. La referencia externa más cercana es la PAU 2026 de LCL II de la Región de Murcia (`fuentes/pau/`, material aportado, no fuente normativa), que acota por líneas —20-25 el texto argumentativo, 15-25 cada una de las tres preguntas del comentario literario, que en el aula se pide de una pieza—. Si en clase el comentario es más largo de lo estimado, los umbrales nuevos aprietan de más y hay que reabrirlos: el dato que hay que confirmar es la extensión, no el umbral.

    **(b) El componente de concordancia de 1.º de ESO es más blando que el del expositivo, y no por copia.** Tiene cuatro bandas (`0 / 1-2 / 3-4 / 5 o más`) donde el expositivo tiene tres (`0 / 1-2 / 3 o más`), así que da 1 punto donde el expositivo da 0, y encima sobre un texto de la mitad de extensión. Se ve en la simulación: el alumno «en riesgo» de 1.º de ESO se queda en 2,0 puntos de la dimensión en el comentario y en 0,0 en el expositivo, y ese resto es todo suyo. **No se ha tocado**, porque a diferencia de los umbrales de faltas no es un número copiado sino una escala más fina escrita a propósito para este pack, y afinar o no la concordancia en 1.º de ESO es una postura didáctica, no una corrección de derivación.

---

## 18. Fuentes del diseño

- `Marco_Teorico_Rubricas_LOMLOE.md` — fuente normativa de todo el diseño pedagógico de este SDD.
- `Rúbricas documentación.md` — matrices cuantitativas y ejemplos de descriptores operativos.
- `Lomloe ESO Murcia Lengua (1).md` — currículo de ESO, competencias específicas y criterios de evaluación.
- `Criterios curriculum bachillerato lengua (1).md` — currículo de Bachillerato.
- LOMLOE (Ley Orgánica 3/2020, art. 20) · RD 217/2022 (ESO) · RD 243/2022 (Bachillerato).
