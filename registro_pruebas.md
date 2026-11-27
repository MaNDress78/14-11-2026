# Registro de pruebas: tabla de casos y revisión de las pruebas de IA

Proyecto: TopicGym V.1.0  
Estudiantes: Michael Ramos Betancourt  
Fecha: 2026-11-22  
Repositorio: https://github.com/MaNDress78/14-11-2026.git

## 0. Cómo se ejecutan las pruebas

El proyecto usa JavaScript y Node.js, así que la suite se escribió en ese mismo lenguaje con `node:test`, en la carpeta `tests/`. No se creó una implementación paralela de las reglas: las pruebas importan los módulos reales de `backend/src`. Los esperados están escritos a mano; no se calculan ejecutando el código. Si se rompe una función de producción, la prueba falla.

```bash
npm --prefix backend ci
npm run test:semana7   # solo la suite de la semana 7
npm test               # node:test del backend + suite de la semana 7
npm run lint
```

Resultado de la corrida final: **66/66 pruebas pasan** (`npm test` ejecuta además las 5 pruebas existentes del backend). La tarea menciona `pytest` y `pytest.approx`, pero eso cambiaría el lenguaje de la entrega; se conservó el lenguaje del repositorio y se usaron los equivalentes de Node: `assert.strictEqual` y `assert.deepStrictEqual` para esperados exactos, y `assert.throws` con `{ name, message }` para el tipo de error exacto. No se usa aproximación decimal porque ninguna de las cinco reglas seleccionadas produce decimales.

## 1. Tabla de casos

### Función 1: `toISODate`

**Regla completa (el oráculo):** «Convierte una fecha a `YYYY-MM-DD` en UTC» (`backend/src/utils/racha.js:3-12`). El esperado sale de esa definición y de la especificación de `Date.prototype.toISOString`, no de ejecutar la función.

| Técnica | Partición o límite | Entrada | Esperado | Prueba que lo cubre |
|---|---|---|---|---|
| Partición válida | Fecha UTC dentro del día | `2026-11-22T23:59:59.999Z` | `"2026-11-22"` | `toISODate devuelve fecha UTC · ultimo-instante-del-dia` |
| Valor límite | Primer instante del día siguiente | `2026-11-23T00:00:00.000Z` | `"2026-11-23"` | `toISODate devuelve fecha UTC · primer-instante-dia-siguiente` |
| Partición válida | Zona horaria negativa cruza a UTC | `2026-11-22T23:30:00-05:00` | `"2026-11-23"` | `toISODate devuelve fecha UTC · zona-horaria-convierte-a-utc` |
| Valor límite | Primer día del año | `2026-01-01T12:00:00Z` | `"2026-01-01"` | `toISODate devuelve fecha UTC · primer-dia-del-anio` |
| Valor límite | Último día del año | `2026-12-31T12:00:00Z` | `"2026-12-31"` | `toISODate devuelve fecha UTC · ultimo-dia-del-anio` |
| Partición inválida | Texto que no es fecha | `"no-es-fecha"` | `RangeError: Invalid time value` | `toISODate rechaza fecha inválida · particion-invalida-texto` |
| Partición inválida | Texto vacío | `""` | `RangeError: Invalid time value` | `toISODate rechaza fecha inválida · texto-vacio-invalido` |

**Ambigüedades encontradas:** la regla no decía qué hacer con una fecha inválida. Se decidió esperar `RangeError` con el mensaje de la especificación de JavaScript, no el valor que devolviera la implementación.

### Función 2: `calcularRacha`

**Regla completa (el oráculo):** «Calcula la racha actual de días consecutivos con actividad. Si hoy no hay actividad, permite que la racha empiece ayer» (`backend/src/utils/racha.js:14-35`). Las fechas de entrada se generan relativas a hoy para que la prueba sea estable; los esperados son fijos.

| Técnica | Partición o límite | Entrada (días con actividad) | Esperado | Prueba que lo cubre |
|---|---|---|---|---|
| Partición vacía | Sin actividad | `[]` | `0` | `calcularRacha · sin-actividad` |
| Valor límite | Actividad hoy | `[hoy]` | `1` | `calcularRacha · solo-hoy` |
| Valor límite | Actividad solo ayer | `[ayer]` | `1` | `calcularRacha · ayer-permite-empezar` |
| Valor límite | Primer día que corta la racha | `[anteayer]` | `0` | `calcularRacha · hueco-antes-de-ayer` |
| Partición válida | Tres días seguidos hasta ayer | `[ayer, -2, -3]` | `3` | `calcularRacha · tres-dias-hasta-ayer` |
| Partición válida | Tres días seguidos incluido hoy | `[hoy, ayer, -2]` | `3` | `calcularRacha · tres-dias-incluido-hoy` |
| Partición válida | Día duplicado | `[hoy, hoy, ayer]` | `2` | `calcularRacha · duplicados-no-cuentan-dos-veces` |
| Valor límite | Salto de un día en medio | `[hoy, -2]` | `1` | `calcularRacha · salto-de-un-dia-corta-la-racha` |
| Partición inválida | Solo fecha futura | `[mañana]` | `0` | `calcularRacha · solo-fecha-futura-no-inicia-racha` |
| Datos sintéticos | Tres días consecutivos del fixture | `[hoy, ayer, -2]` | `3` | `calcularRacha con datos sintéticos` |

**Ambigüedades encontradas:** la regla no decía si un día repetido contaba dos veces ni qué pasaba con fechas futuras. Se decidió deduplicar (la racha mide días, no registros) y no iniciar racha desde el futuro (el ancla es hoy o ayer).

### Función 3: `calcularRachaMaxima`

**Regla completa (el oráculo):** «Calcula la racha más larga registrada» (`backend/src/utils/racha.js:37-60`).

| Técnica | Partición o límite | Entrada (días con actividad) | Esperado | Prueba que lo cubre |
|---|---|---|---|---|
| Partición vacía | Sin actividad | `[]` | `0` | `calcularRachaMaxima · sin-actividad` |
| Valor límite | Un solo día | `[-5]` | `1` | `calcularRachaMaxima · un-solo-dia` |
| Partición válida | Tres días consecutivos | `[-5, -4, -3]` | `3` | `calcularRachaMaxima · tres-consecutivos` |
| Partición válida | Entrada desordenada | `[-1, -3, -2]` | `3` | `calcularRachaMaxima · entrada-desordenada-se-ordena` |
| Partición válida | Días duplicados | `[-1, -1, -2]` | `2` | `calcularRachaMaxima · duplicados-se-deduplican` |
| Partición válida | Días aislados | `[-5, -3, -1]` | `1` | `calcularRachaMaxima · dias-aislados` |
| Valor límite | La serie termina hoy | `[hoy, ayer, -2]` | `3` | `calcularRachaMaxima · serie-termina-hoy` |

**Ambigüedades encontradas:** «registrada» no aclaraba si el orden de llegada importaba ni si los duplicados sumaban. Se decidió ordenar y deduplicar porque una racha es una serie de días únicos.

### Función 4: `cumpleCondicion` (función con varias condiciones)

**Regla completa (el oráculo):** «Interpreta las condiciones JSONB de un logro» (`backend/src/services/ejercicios.service.js:120-165`) junto con las descripciones de logros de `database/migrations/005_nuevos_logros.sql`, por ejemplo «Acumula 100 puntos resolviendo ejercicios», «Resuelve correctamente todos los ejercicios de al menos un tema» y «Mantén una racha de actividad de siete días consecutivos». Regla completa: devuelve `true` solo si `condicion` es un objeto, el tipo corresponde a una métrica conocida y la métrica alcanza el umbral (`>=`), con estas salvedades: `dificultad_completada` compara el nivel sin importar mayúsculas; `tema_perfecto` solo exige `temas_perfectos > 0` e ignora `valor`; las filas heredadas sin `tipo` usan `aciertos_min` (`ejercicios_distintos_correctos` cuando `codigo` es `MAESTRO_LOGICA`, si no `aciertos_totales`) o `racha_dias`; cualquier condición desconocida, vacía, nula o no objeto devuelve `false`.

| Técnica | Partición o límite | Entrada | Esperado | Prueba que lo cubre |
|---|---|---|---|---|
| Valor límite | Puntos exactamente en el umbral | `{tipo:puntos_acumulados, valor:100}`, puntos `100` | `true` | `cumpleCondicion · puntos-igual-umbral` |
| Valor límite | Un punto debajo | puntos `99` | `false` | `cumpleCondicion · puntos-uno-debajo` |
| Partición válida | Un punto arriba | puntos `101` | `true` | `cumpleCondicion · puntos-uno-arriba` |
| Partición válida | `valor` numérico en texto | `valor:"100"` | `true` | `cumpleCondicion · valor-texto-numerico` |
| Valor límite | `valor` omitido (defecto 1) | sin `valor` | `true` | `cumpleCondicion · valor-omitido-por-defecto` |
| Partición válida | Nivel en minúsculas | `nivel:"dificil"` | `true` | `cumpleCondicion · nivel-insensible-a-mayusculas` |
| Partición inválida | Nivel no completado | `nivel:"MEDIO"` | `false` | `cumpleCondicion · nivel-no-completado` |
| Partición válida | `tema_perfecto` ignora `valor:0` | `temas_perfectos:1` | `true` | `cumpleCondicion · tema-perfecto-ignora-valor` |
| Valor límite | Sin tema perfecto | `temas_perfectos:0` | `false` | `cumpleCondicion · sin-tema-perfecto` |
| Valor límite / inválido | Resto de tipos en el borde y un debajo | ver ids | `true` / `false` | `cumpleCondicion · temas-igual-umbral`, `temas-debajo-umbral`, `primer-intento-igual`, `primer-intento-debajo`, `intentos-igual`, `intentos-debajo`, `dificiles-igual`, `dificiles-debajo`, `racha-igual`, `racha-debajo`, `aciertos-totales-igual`, `aciertos-totales-debajo`, `distintos-igual`, `distintos-debajo` |
| Partición inválida | Tipo desconocido, objeto vacío, `null` y texto | ver ids | `false` | `cumpleCondicion · tipo-desconocido`, `condicion-vacia`, `condicion-nula`, `condicion-no-objeto` |
| Condición heredada | `aciertos_min:12` con código `MAESTRO_LOGICA` | distintos `15` | `true` | `cumpleCondicion · heredado-maestro-distintos` |
| Condición heredada | `aciertos_min:12` con código vacío | totales `10` | `false` | `cumpleCondicion · heredado-no-maestro-totales` |
| Condición heredada | `aciertos_min:10` con código vacío | totales `10` | `true` | `cumpleCondicion · heredado-no-maestro-igual` |
| Condición heredada | `racha_dias` en el borde y un debajo | racha `7` / `8` | `true` / `false` | `cumpleCondicion · heredado-racha-igual`, `heredado-racha-debajo` |
| Datos sintéticos | Metadatos con tildes, ñ, apóstrofo y teléfono ficticio no alteran la regla | ver prueba | `true` y `false` | `cumpleCondicion ignora metadatos sintéticos` |

**Tabla de decisión** (`—` = la condición no importa, por eso se simplifica):

| Regla | C1: ¿condicion es objeto? | C2: ¿hay `tipo`? | C3: ¿hay `aciertos_min`? | C4: ¿hay `racha_dias`? | C5: ¿codigo = `MAESTRO_LOGICA`? | C6: comparación de la métrica | Resultado |
|---|---|---|---|---|---|---|---|
| R1 | No | — | — | — | — | — | `false` |
| R2a | Sí | Sí | — | — | — | métrica `>= valor` | `true` |
| R2b | Sí | Sí | — | — | — | métrica `< valor` | `false` |
| R2c | Sí | Sí (`dificultad_completada`) | — | — | — | nivel coincide ignorando mayúsculas / no coincide | `true` / `false` |
| R2d | Sí | Sí (`tema_perfecto`) | — | — | — | `temas_perfectos > 0` / `= 0` | `true` / `false` |
| R2e | Sí | Sí (desconocido) | — | — | — | — | `false` |
| R3 | Sí | No | Sí | — | Sí | `ejercicios_distintos_correctos >= valor` | `true` / `false` |
| R4 | Sí | No | Sí | — | No | `aciertos_totales >= valor` | `true` / `false` |
| R5 | Sí | No | No | Sí | — | `racha_dias >= valor` | `true` / `false` |
| R6 | Sí | No | No | No | — | — | `false` |

**Ambigüedades encontradas:** no estaba claro si `tema_perfecto` usaba `valor` (se decidió que no, porque la descripción del logro no menciona cantidad), qué significaba un `codigo` ausente (se decidió `''`, que cae en la rama no `MAESTRO_LOGICA`) y si `valor` en texto era válido (se decidió aceptarlo porque la regla lo convierte con `Number`). Ninguna decisión se ajustó para que una prueba pasara: se derivaron de la descripción del logro y del comentario de compatibilidad del código.

### Función 5: validación de registro (`registerBodySchema.safeParse`)

**Regla completa (el oráculo):** `backend/src/schemas/auth.schemas.js:7-37` y la funcionalidad «Registro con verificación de correo» del `README.md`: `nombre` es texto de 2 a 100 caracteres recortado; `correo` debe tener formato de correo, máximo 120 caracteres, se convierte a minúsculas y se recorta; `password` tiene entre 8 y 128 caracteres; `rol` solo acepta `ESTUDIANTE` y por defecto es `ESTUDIANTE`; `codigoClase` es opcional, máximo 20 caracteres y se recorta; los campos desconocidos se descartan.

| Técnica | Partición o límite | Entrada | Esperado | Prueba que lo cubre |
|---|---|---|---|---|
| Valor límite | Nombre de 2 caracteres con ñ y contraseña de 8 | `{nombre:"Ño", password:"12345678", ...}` | `success: true`, `rol:"ESTUDIANTE"` | `registro válido · limite-inferior-nombre-y-password` |
| Valor límite | Código de clase de 20 caracteres y correo en mayúsculas | `codigoClase:"PROG-ABC123ABC123ABC"` | correo normalizado a minúsculas, éxito | `registro válido · correo-se-normaliza-y-codigo-de-20-caracteres` |
| Partición válida | Tildes, ñ, apóstrofo, texto vacío y teléfono ficticio | datos del fixture | nombre recortado, correo en minúsculas, `codigoClase:""`, sin `telefono` en la salida | `registro válido con datos sintéticos` |
| Valor límite | Nombre de 1 carácter | `nombre:"A"` | `too_small` en `nombre` | `registro inválido · nombre-de-un-caracter` |
| Partición inválida | Nombre vacío | `nombre:""` | `too_small` en `nombre` | `registro inválido · nombre-vacio` |
| Valor límite | Contraseña de 7 caracteres | `password:"1234567"` | `too_small` en `password` | `registro inválido · password-de-7-caracteres` |
| Valor límite | Espacio final en el correo | `correo:"a@b.co "` | dos `invalid_format` en `correo` | `registro inválido · correo-con-espacio-final` |
| Partición inválida | Rol docente | `rol:"DOCENTE"` | `invalid_value` en `rol` | `registro inválido · rol-docente-rechazado` |
| Valor límite | Código de clase de 21 caracteres | `codigoClase:"PROG-ABC123ABC123ABCD"` | `too_big` en `codigoClase` | `registro inválido · codigo-de-21-caracteres` |

**Ambigüedades encontradas:** `codigoClase` solo tiene límite de longitud en el registro; el formato `PROG-XXXXXX` se valida en `linkCodeBodySchema`, no aquí. Se decidió no inventar una regla de formato en esta función y comprobar solo el borde de 20/21 caracteres. También se observó que Zod valida el correo antes de recortarlo, por eso el espacio final es inválido; el esperado se tomó de la regla de validación declarada, no de una corrida del código.

## 2. Pruebas de la IA descartadas o corregidas

**Prompt usado:** «A partir de estas reglas y de las tablas de casos que escribí, propón pruebas con `node:test` en la carpeta `tests`, con un array de casos y un comentario por fila, `assert.strictEqual`/`deepStrictEqual` con esperados fijos y `assert.throws` para entradas inválidas. No modifiques el código de producción. Después aplica a cada prueba: ¿el esperado sale de la regla?, ¿fallaría si rompo el código?, ¿es redundante?». Detalle en `bitacora_ia.md`, entradas 1 y 2 de la semana 7.

| Prueba generada | Decisión | Por qué | En su lugar |
|---|---|---|---|
| `test_facil_devuelve_algo`: `assert.ok(normalizarNivel('facil'))` | Descartada | La IA propuso una función que `backend/src/services/ejercicios.service.js` no exporta, y además `assert.ok` es débil: pasa con cualquier valor truthy | Se sustituyó por `toISODate devuelve fecha UTC · …`, con valores exactos sobre una función sí exportada |
| `test_puntos_limite`: esperaba `false` para 100 puntos con umbral 100 | Corregida | El esperado salía de una ejecución previa, no de la regla; la migración 005 dice «Acumula 100 puntos», es decir `>= 100` | Esperado `true` en `cumpleCondicion · puntos-igual-umbral`, más los casos de 99 y 101 para defender el borde |
| Propuesta de comprobar el registro con `assert.ok(validarRegistro(datos))` | Corregida | No comprobaba ni la normalización del correo ni el rechazo de roles; habría pasado aunque se aceptara `DOCENTE` | `registro válido con datos sintéticos` compara el objeto completo y `registro inválido · rol-docente-rechazado` exige `invalid_value` |
| Propuesta de esperar que el teléfono ficticio apareciera en los datos parseados del registro | Descartada | El esquema `z.object` descarta claves desconocidas; el esperado era inventado | `registro válido con datos sintéticos` espera el objeto sin `telefono`, comprobando además que el campo extra no rompe la validación |
| Caso duplicado de `dificultad_completada` con `"DIFICIL"` dos veces | Descartada | Redundante: cubría la misma partición que `nivel-insensible-a-mayusculas` | Se conservó solo `"dificil"` (minúsculas) y `"MEDIO"` (no completado) |

**Decisión general:** la suite entregada es el resultado de conservar los casos derivados de la regla, corregir los esperados que no salían de ella y descartar los débiles o redundantes. Ninguna prueba se modificó para que pasara: la única corrección de esperado fue para ajustarse al oráculo documentado.

## 3. Romper el código a propósito

Cada cambio se introdujo solo, se ejecutó `node --test tests/*.test.js` y se deshizo con `git restore`. La suite volvió a 66/66 después de las tres restauraciones.

| Cambio introducido | Archivo y línea | ¿Alguna prueba falló? | Qué hice |
|---|---|---|---|
| `>=` por `>` en `puntos_acumulados` | `backend/src/services/ejercicios.service.js:142` | Sí: 3 fallaron — `cumpleCondicion · puntos-igual-umbral`, `cumpleCondicion · valor-texto-numerico` y `cumpleCondicion ignora metadatos sintéticos` (63 pasaron) | Nada: la suite ya defendía el borde `>=`. Restauré con `git restore -- backend/src/services/ejercicios.service.js` |
| `racha += 1` por `racha += 0` (devuelve siempre 0) | `backend/src/utils/racha.js:31` | Sí: 7 fallaron — `calcularRacha · solo-hoy`, `ayer-permite-empezar`, `tres-dias-hasta-ayer`, `tres-dias-incluido-hoy`, `duplicados-no-cuentan-dos-veces`, `salto-de-un-dia-corta-la-racha` y `calcularRacha con datos sintéticos` (59 pasaron) | Nada: no hacía falta agregar casos. Restauré con `git restore -- backend/src/utils/racha.js` |
| `.min(8, ...)` por `.min(9, ...)` en la contraseña | `backend/src/schemas/auth.schemas.js:22` | Sí: 6 fallaron — `registro válido · limite-inferior-nombre-y-password` y cinco de `registro inválido` (60 pasaron) | Nada: el caso de 8 caracteres ya protegía el límite. Restauré con `git restore -- backend/src/schemas/auth.schemas.js` |

No fue necesario agregar casos después de romper el código porque en los tres cambios fallaron pruebas existentes. La línea exacta se verificó de nuevo tras cada restauración.

## 4. Datos de prueba

**Origen:** sintéticos generados con IA, con contexto local colombiano (`+57`, correo `@ejemplo.edu.co`). Confirmo que no hay datos de personas reales, ni míos ni de familiares; el nombre, el correo y el teléfono son ficticios. Están en la función fixture `datosSinteticos()` de `tests/reglas_negocio.test.js` y se usan en `calcularRacha con datos sintéticos`, `registro válido con datos sintéticos` y `cumpleCondicion ignora metadatos sintéticos`.

**Casos difíciles incluidos:** tildes y ñ (`Ángela María Ñuñez`, `Ño`, `María José`), apóstrofo (`O'Connor`), texto vacío (`codigoClase:""` y `nombre:""`), valor en cero (`puntos_acumulados:0`), espacios alrededor del texto y correo en mayúsculas. Los teléfonos son ficticios (`+57 300 000 0001`) y no pertenecen a nadie.

## 5. Ejecución y autoevaluación

```bash
npm run test:semana7
# 66 tests, 66 pass, 0 fail
npm test
# 5 pruebas existentes del backend + 66 de la semana 7
npm run lint
```

| Criterio | Puntos máximos | Mi puntaje estimado | ¿Qué puedo mejorar antes de entregar? |
|---|---|---|---|
| 1. Tabla de casos | 20 | 20 | Nada: cada función tiene regla, particiones inválidas y límites; la función compuesta tiene tabla de decisión |
| 2. Suite de pruebas | 20 | 20 | Nada: cinco funciones, casos con comentario por fila, asserts exactos y `assert.throws` con tipo y mensaje; 66/66 pasan |
| 3. Revisión de las pruebas de la IA | 15 | 15 | Nada: cinco pruebas corregidas o descartadas con razón y reemplazo documentados |
| 4. Romper el código | 10 | 10 | Nada: tres errores, con pruebas fallidas identificadas y restauración con `git restore` |
| 5. Datos de prueba | 10 | 10 | Nada: datos sintéticos con contexto local y casos difíciles en un fixture |
| 6. Registro de pruebas | 15 | 15 | Nada: decisiones, razones, reemplazos y ambigüedades por función |
| 7. Uso responsable y bitácora | 10 | 10 | Nada: tres entradas nuevas con prompt, resultado y verificación |
| **Total** | **100** | **100** | — |
