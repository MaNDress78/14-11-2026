# Bitácora de uso de IA

Proyecto: TopicGym V.1.0  
Estudiantes: Michael Ramos Betancourt, Eduardo Tovar Roa, Óscar Pérez y José David García Calderón  
Asistente usado: OpenCode en modo agente (modelos Big Pickle, Claude Sonnet y DeepSeek), con los prompts de revisión de la semana 6 y de pruebas de la semana 7.

## Entradas de la semana 6

### Entrada 1 — Revisión de seguridad con IA

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Revisa el código de TopicGym con los criterios de la semana 6: inyección, secretos, contraseñas, control de acceso y dependencias. Devuelve una tabla con archivo, línea, problema, categoría, severidad y corrección propuesta. Separa los problemas seguros de las sospechas y no modifiques nada todavía».
- **Decisión:** Aceptada con cambios
- **Por qué:** La IA encontró los problemas reales de registro público de docentes, exposición de `verifyUrl`, secreto JWT de ejemplo, algoritmo JWT sin fijar, usuario desactivado con token válido y condición de carrera en los intentos. Descarté sus avisos de inyección SQL porque todas las consultas usan parámetros; también descarté los avisos masivos de `security/detect-object-injection` porque las claves vienen de Zod o de filas de la BD.
- **Verificación:** Reproduje cada hallazgo con una solicitud HTTP o con una lectura del código antes de aceptarlo. El registro con `rol: DOCENTE` respondía `201`; el `verifyUrl` aparecía en la respuesta; el JWT de ejemplo era aceptado. Los tres se confirmaron y se corrigieron.
- **Cambio local:** endurecimiento de JWT, registro y validación de perfil.
- **Lo que la IA no encontró:** la contraseña de PostgreSQL hardcodeada en los scripts E2E y que `seed.js` solo aplicaba las migraciones 005–007. Lo detecté al ejecutar las pruebas en una base limpia.

### Entrada 2 — Corrección del registro público y del enlace de verificación

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Corrige H-01 y H-02: el registro público solo debe crear estudiantes y el `verifyUrl` solo debe devolverse en desarrollo. Agrega o ajusta pruebas de abuso sin modificar las pruebas existentes para que pasen».
- **Decisión:** Aceptada
- **Por qué:** El registro público no debe permitir crear docentes; los docentes se aprovisionan con el seed o por un administrador. El token de verificación no debe viajar al cliente en producción porque quien lo reciba podría verificar una cuenta ajena sin acceso al correo.
- **Verificación:** El E2E envía `rol: DOCENTE` y ahora recibe `400`; el flujo de estudiante sigue recibiendo `201` y el token se lee desde la BD para verificar la cuenta. `npm test` (5/5) y `node scripts/e2e-test.js` (34 OK) pasaron sin modificar pruebas existentes.
- **Cambio local:** corrección aplicada en la copia local

### Entrada 3 — Corrección de la condición de carrera en los intentos

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Revisa si dos solicitudes simultáneas de `POST /api/exercises/:id/validate` pueden registrar el mismo intento y duplicar puntos. Si es así, corrige con una transacción y una prueba que lo demuestre».
- **Decisión:** Aceptada
- **Por qué:** La secuencia era `SELECT` del último intento + `INSERT` de la respuesta. Dos solicitudes concurrentes podían leer el mismo número de intento y ambas insertar, duplicando puntos y logros. Se añadió `pg_advisory_xact_lock` sobre `usuarioId:ejercicioId` dentro de la transacción.
- **Verificación:** Se ejecutó `node scripts/e2e-progress-test.js` con el backend y la BD reales: 15/15 comprobaciones, incluidos puntos, logros y aislamiento entre docentes. También se verificó que una opción de otro ejercicio se rechaza con `400`.
- **Cambio local:** validación de códigos docentes y pertenencia de opciones.

### Entrada 4 — Linter, dependencias y documentación

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Configura ESLint con reglas de seguridad, ejecútalo y corrige todos los avisos. Después audita las dependencias, actualiza el README con las ocho secciones y redacta los docstrings de las funciones principales».
- **Decisión:** Aceptada con cambios
- **Por qué:** Se configuró ESLint flat config con `eslint-plugin-security` y `typescript-eslint`. Se desactivaron `security/detect-object-injection` y `no-console` con justificación en el informe, y se silenció `security/detect-non-literal-fs-filename` solo en dos lecturas de archivos internos. Se actualizó `zod` a 4.6.7, se eliminó `google-auth-library` y se fijó `vite` 8.3.8 con `overrides`.
- **Verificación:** `npx eslint .` terminó con 0 errores y 0 avisos; `npm audit` en backend y frontend terminó con 0 vulnerabilidades; `npm run build` compiló el frontend; `npm test` y los scripts E2E siguieron pasando. El README se contrastó con los comandos ejecutados y los docstrings se revisaron contra cada función.
- **Cambio local:** configuración de ESLint, actualización de dependencias y documentación.

### Entrada 5 — Trabajo del agente en copia local

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Prepara la documentación de la semana 6 (`README.md`, `revision_seguridad.md`, `bitacora_ia.md`) y los docstrings de las funciones principales en una copia local. No cambies el comportamiento; muéstrame los archivos antes de integrarlos».
- **Decisión:** Aceptada con cambios
- **Por qué:** La entrega es local y sin repositorio Git, así que el agente trabajó sobre una copia separada de la carpeta. Revisé los archivos antes de integrarlos y ajusté el README para que los comandos coincidieran con los que realmente se ejecutaron (incluido el puerto de PostgreSQL y el orden de las migraciones).
- **Verificación:** Comparé la copia con la carpeta original y solo había cambios en documentación y comentarios JSDoc; no se tocó lógica ni pruebas. Después de integrar se repitieron `npm run lint`, `npm test` y `npm run build` con resultado correcto.
- **Cambio local:** documentación y docstrings integrados en la carpeta del proyecto.

## Entradas de la semana 7

### Entrada 1 — Diseño de casos con IA

- **Fecha:** 2026-11-22
- **Prompt o sugerencia:** «Toma las reglas documentadas de `calcularRacha`, `calcularRachaMaxima`, `toISODate`, `cumpleCondicion` y del esquema de registro. Propón casos con particiones de equivalencia, valores límite y una tabla de decisión para `cumpleCondicion`. No escribas pruebas todavía y no ejecutes el código para sacar los esperados».
- **Decisión:** Aceptada con cambios
- **Por qué:** La propuesta sirvió para ordenar los bordes (100 puntos, 99 y 101; ayer y anteayer; 8 y 7 caracteres de contraseña), pero incluía `normalizarNivel`, que no está exportado por `ejercicios.service.js`, y dejaba sin resolver tres ambigüedades: duplicados en la racha, fechas futuras y el papel de `valor` en `tema_perfecto`.
- **Verificación:** Contrasté cada regla con el docstring correspondiente y con `database/migrations/005_nuevos_logros.sql`. Escribí las decisiones sobre las ambigüedades en `registro_pruebas.md` y sustituí `normalizarNivel` por `toISODate`, que sí está expuesta. La tabla de decisión quedó con diez reglas y las condiciones irrelevantes marcadas como «—».

### Entrada 2 — Generación y revisión de la suite con `node:test`

- **Fecha:** 2026-11-22
- **Prompt o sugerencia:** «Escribe pruebas con `node:test` en la carpeta `tests`, usando el mismo lenguaje del repositorio. Para cada regla usa un array de casos con un comentario por fila, `assert.strictEqual`/`deepStrictEqual` con esperados fijos y `assert.throws` con el tipo y mensaje exactos. No modifiques el código de producción. Luego aplica las tres preguntas de revisión: ¿el esperado sale de la regla?, ¿fallaría si rompo el código?, ¿es redundante?».
- **Decisión:** Aceptada con cambios
- **Por qué:** El borrador tenía dos defectos reales: un `assert.ok(...)` que no comprobaba nada concreto y un esperado `false` para 100 puntos con umbral 100, sacado de una ejecución anterior en vez de la regla `>= 100`. La IA propuso además `pytest`, lo cual habría cambiado el lenguaje de la entrega; se descartó y se mantuvo JavaScript, importando directamente los módulos originales desde `tests/reglas_negocio.test.js`.
- **Verificación:** Corregí los dos casos, descarté un caso redundante y uno con esperado inventado sobre el teléfono, y anoté las cinco decisiones en la sección 2 de `registro_pruebas.md`. Ejecuté `node --test tests/*.test.js`: 66/66 pasan. Después introduje tres errores a propósito (`>=` por `>`, `racha += 0` y `.min(8)` por `.min(9)`): fallaron 3, 7 y 6 pruebas respectivamente; restauré cada archivo con `git restore` y la suite volvió a 66/66. El código de producción quedó sin cambios.

### Entrada 3 — Generación de datos sintéticos

- **Fecha:** 2026-11-22
- **Prompt o sugerencia:** «Genera datos de prueba sintéticos con contexto local colombiano, sin personas reales, con teléfonos ficticios y casos difíciles: tildes, ñ, apóstrofo, texto vacío y valores en cero. Entrégalos como una función fixture en JavaScript y dime dónde se usan».
- **Decisión:** Aceptada
- **Por qué:** Los datos permiten comprobar que la normalización del registro y el evaluador de logros no se rompen con caracteres propios del español ni con campos vacíos o en cero.
- **Verificación:** Revisé que el nombre, el correo y el teléfono fueran inventados (`+57 300 000 0001`, `@ejemplo.edu.co`) y confirmé que el fixture `datosSinteticos()` se usa en tres pruebas: la racha, el registro y la inmunidad del evaluador a metadatos extra. La suite sigue en 66/66.

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas (semanas 6 y 7) | 4 |
| Aceptadas con cambios | 4 |
| Rechazadas | 2 (inyección SQL y avisos masivos de object-injection, ambos falsos positivos de la semana 6) |
| Pruebas de IA descartadas en la semana 7 | 2 (función no exportada y esperado inventado sobre el teléfono) |

## Reflexión final

La revisión con IA sirvió sobre todo para ordenar los riesgos y proponer correcciones concretas, pero no sustituyó la verificación: dos de sus avisos eran falsos positivos y dos problemas reales (contraseñas hardcodeadas en scripts y migraciones incompletas del seed) solo aparecieron al ejecutar las pruebas en una base limpia. Aprendí que una corrección de seguridad debe venir con una prueba de abuso y con el efecto medido en el flujo normal; por eso el registro de docentes y la condición de carrera se validaron con E2E además de la revisión manual. Para la próxima semana mantendré la costumbre de trabajar las correcciones en copias separadas, revisar los cambios antes de integrar y anotar en la bitácora tanto lo aceptado como lo descartado.
