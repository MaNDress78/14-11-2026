# Bitácora de uso de IA

Proyecto: TopicGym V.1.0  
Estudiantes: Michael Ramos Betancourt  
Asistente usado: OpenCode en modo agente. En las semanas 6 y 7 se usaron los modelos Big Pickle, Claude Sonnet y DeepSeek (revisión de seguridad y suite de pruebas); en las semanas de diseño y de informe final el mismo asistente en modo agente, con acceso de lectura al repositorio y a los entregables de las semanas 3, 6 y 7.

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

## Entradas de esta semana (2026-11-27)

### Entrada 1 — Diseño de la arquitectura con apoyo de IA

- **Fecha:** 2026-11-27
- **Prompt o sugerencia:** «Actúa como arquitecto de software. Estoy diseñando el proyecto final del seminario, una plataforma web de práctica de Lógica de Programación llamada TopicGym. Lee el repositorio y, con base en lo que existe realmente en el código, propón tres alternativas de arquitectura, describe cada una en un párrafo y redacta un ADR con título, estado, contexto, decisión, alternativas descartadas, consecuencias positivas y negativas y uso de IA. No inventes requisitos que no estén en el repositorio y no propongas microservicios ni cachés que el proyecto no usa.»
- **Decisión:** Aceptada con cambios
- **Por qué:** la IA entregó el esqueleto de la entrega (las tres alternativas, la matriz ponderada, los dos diagramas C4, el modelo entidad-relación, la tabla de endpoints y el ADR), pero lo apoyó en un registro de requisitos que ella misma reconstruyó. Descarté su propuesta de separar el motor de logros en un microservicio y de añadir Redis, porque no existen en el código y contradicen el ADR-001. Cuando localicé el documento de requisitos de la semana 3 (`Ramos_Betancourt_S3_Requisitos.docx`, carpeta de entregas), rehice todo el documento sobre las identificadores reales: N-01 a N-10 con su cita, HU-01 a HU-10 con su prioridad MoSCoW y RNF-01 a RNF-06 con su característica ISO/IEC 25010.
- **Verificación:** contrasté cada tabla contra el esquema (`database/schema.sql` y las migraciones 001 a 007), contra las dependencias declaradas (`backend/package.json`) y contra las rutas reales (`backend/src/routes`). Revisé que cada historia citada en el documento de diseño exista en la matriz de trazabilidad de la semana 3.
- **Cambio local:** documento de diseño en `documentos/semana4/` con las siete secciones, ADR-001, ADR-002, diagramas C4 con su código Mermaid, modelo de datos y registro de prompts.
- **Lo que la IA no encontró:** el documento de requisitos de la semana 3 no está dentro del repositorio, así que no podía saber que existía; el error se hizo visible al cotejar los identificadores HU-01 a HU-10 del borrador con los del documento real.

### Entrada 2 — Corrección de la trazabilidad de las historias

- **Fecha:** 2026-11-27
- **Prompt o sugerencia:** «Revisa el documento de diseño y comprueba que cada HU-xx, RNF-xx y N-xx que se cita existe en el documento de requisitos de la semana 3 y que se le asigna a la historia correcta. Devuelve una tabla con la cita, el identificador y el veredicto.»
- **Decisión:** Aceptada
- **Por qué:** la revisión encontró un error real en la sección 3.1: el borrador atribuía el panel docente a HU-07 y HU-08, cuando con la numeración real el panel docente es HU-06 (código de clase y vinculación) y HU-07 (detalle del alumno), y HU-08 es el envío de pseudocódigo. El error venía de arrastrar la numeración del primer borrador, escrito antes de encontrar el documento de la semana 3.
- **Verificación:** comparé una por una las dieciocho referencias a historias de la tabla de API y las de la prosa con la matriz de trazabilidad del Anexo del documento de requisitos. Después de la corrección, las diez historias aparecen con su historia de origen y ninguna referencia apunta a una historia ajena.
- **Cambio local:** corrección en la sección 3.1 y verificación de las dieciocho filas de la tabla de API.

### Entrada 3 — Humanización del documento de diseño

- **Fecha:** 2026-11-27
- **Prompt o sugerencia:** «Revisa el texto del documento de diseño y reescríbelo para que suene a persona y no a plantilla: elimina los contrastes vacíos del tipo «no X sino Y», los guiones largos usados como conector, las tríadas forzadas, las palabras infladas y la negrita decorativa. No cambies ninguna cifra, cita, ruta de archivo ni identificador de requisito, y no toques los bloques de código.»
- **Decisión:** Aceptada con cambios
- **Por qué:** el borrador usaba muletillas («además» ocho veces, «el punto de inflection» en inglés, «el activo más valioso del proyecto») y cerraba párrafos con frases que repetían lo recién dicho. Se conservaron las cuatro etiquetas en negrita del resumen de uso de IA porque reproducen los cuatro puntos que pide la rúbrica.
- **Verificación:** leí el texto completo ya renderizado y comparé el resultado con el original, sección por sección; comprobé con una búsqueda que no quedara ningún guion largo, ningún contraste vacío ni palabras en inglés, y que las cifras de la matriz (126, 106, 102 sobre 140), las diez HU, los seis RNF y las diez N siguieran presentes.
- **Cambio local:** reescritura de la prosa en las secciones 1 a 7 y en los anexos; los bloques de código y las tablas de datos quedaron intactos.

### Entrada 4 — Reconstrucción del informe final

- **Fecha:** 2026-11-27
- **Prompt o sugerencia:** «Lee la plantilla `informe_final_integrador.md` y el repositorio, y redacta el informe final: resumen del problema y del usuario, tabla de la IA en el ciclo de vida con un enlace a la evidencia de cada módulo, tres casos concretos de error de la IA en fases distintas, estado final del sistema, reflexión ética y legal, aprendizajes y anexos. Cada afirmación debe apuntar a un archivo o a un commit del repositorio, y el texto debe sostener lo que afirma sin adornos.»
- **Decisión:** Aceptada con cambios
- **Por qué:** la IA propone la estructura del informe y los enlaces a la evidencia, pero escribe en pasado impersonal y deja los casos de error de la IA contados en lugar de explicados. Reescribí los tres casos con qué se detectaron y qué se hizo, y completé la sección 6 con los principios de la Ley 1581 de 2012 aplicados al proyecto.
- **Verificación:** cada enlace del informe apunta a un archivo que existe en el repositorio o a un commit existente, y las cifras del informe se contrastaron con `registro_pruebas.md`, `revision_seguridad.md` y el propio código.
- **Cambio local:** `informe_final.md` en la raíz del repositorio.

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas (semanas 6 y 7) | 4 |
| Aceptadas con cambios (semanas 6 y 7) | 4 |
| Aceptadas (esta semana) | 1 |
| Aceptadas con cambios (esta semana) | 3 |
| Rechazadas | 3 (inyección SQL y avisos masivos de object-injection en la semana 6; el registro de requisitos reconstruido en esta semana) |
| Pruebas de IA descartadas en la semana 7 | 2 (función no exportada y esperado inventado sobre el teléfono) |
| Elementos inventados por la IA y corregidos en esta semana | 2 (registro de requisitos reconstruido y trazabilidad de HU-07/HU-08) |

## Reflexión final

La revisión con IA sirvió sobre todo para ordenar los riesgos y proponer correcciones concretas, pero no sustituyó la verificación: dos de sus avisos eran falsos positivos y dos problemas reales (contraseñas hardcodeadas en scripts y migraciones incompletas del seed) solo aparecieron al ejecutar las pruebas en una base limpia. Aprendí que una corrección de seguridad debe venir con una prueba de abuso y con el efecto medido en el flujo normal; por eso el registro de docentes y la condición de carrera se validaron con E2E además de la revisión manual. Esta semana el mismo patrón se repitió en el diseño: la IA construyó el documento sobre un registro de requisitos inventado porque el documento de la semana 3 no estaba en el repositorio, y el error solo apareció al cotejar los identificadores HU-01 a HU-10 contra el original. La lección es que hay que leer primero las entradas anteriores del proyecto y después dejar que la IA proponga, al revés de lo que hice. Para la próxima semana mantendré la costumbre de trabajar las correcciones en copias separadas, revisar los cambios antes de integrar y anotar en la bitácora tanto lo aceptado como lo descartado.
