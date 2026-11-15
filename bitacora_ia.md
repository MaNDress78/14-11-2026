# Bitácora de uso de IA

Proyecto: TopicGym V.1.0  
Estudiantes: Michael Ramos Betancourt, Eduardo Tovar Roa, Óscar Pérez y José David García Calderón  
Asistente usado: OpenCode en modo agente (modelos Big Pickle, Claude Sonnet y DeepSeek), con el prompt de revisión de la semana 6.

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

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 3 |
| Aceptadas con cambios | 2 |
| Rechazadas | 2 (inyección SQL y avisos masivos de object-injection, ambos falsos positivos) |

## Reflexión final

La revisión con IA sirvió sobre todo para ordenar los riesgos y proponer correcciones concretas, pero no sustituyó la verificación: dos de sus avisos eran falsos positivos y dos problemas reales (contraseñas hardcodeadas en scripts y migraciones incompletas del seed) solo aparecieron al ejecutar las pruebas en una base limpia. Aprendí que una corrección de seguridad debe venir con una prueba de abuso y con el efecto medido en el flujo normal; por eso el registro de docentes y la condición de carrera se validaron con E2E además de la revisión manual. Para la próxima semana mantendré la costumbre de trabajar las correcciones en copias separadas, revisar los cambios antes de integrar y anotar en la bitácora tanto lo aceptado como lo descartado.
