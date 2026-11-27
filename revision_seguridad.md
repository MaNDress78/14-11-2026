# Informe de revisión de código y seguridad

Proyecto: TopicGym V.1.0  
Estudiantes: Michael Ramos Betancourt  
Fecha: 2026-11-14  
Commit revisado: `4fb7af1` (primer commit del repositorio, https://github.com/MaNDress78/14-11-2026.git)

## 1. Herramientas y criterios

- **Linter:** ESLint `9.39.5` con `@eslint/js`, `eslint-plugin-security` `3.0.1` y `typescript-eslint` `8.46.4`. Configuración en `eslint.config.mjs`; se ejecuta con `npm run lint`. Resultado final: **0 errores y 0 avisos**.
- **Auditoría de dependencias:** `npm audit` en `backend/` y `frontend/`. Resultado final: **0 vulnerabilidades** en ambos (antes: 4 en backend y 7 en frontend).
- **Lista de revisión:** la de la semana 6 (inyección, secretos, contraseñas, control de acceso y dependencias), más revisión de errores, validación de entrada y concurrencia.
- **Control de versiones:** la entrega se preparó en una carpeta local, sin repositorio Git; por eso la columna «Commit» indica «Local» en lugar de un hash.
- **Revisión con IA:** OpenCode en modo agente (modelos Big Pickle, Claude Sonnet y DeepSeek), con el prompt de revisión de la semana. Cada hallazgo se contrastó con el código y se clasificó como real o falso positivo.

### Puntos de seguridad revisados

| Punto | ¿Aplica? | Resultado |
|---|---|---|
| Inyección (consultas con parámetros) | Sí | Sin hallazgos. Todas las consultas usan placeholders `$1…$n`; el único fragmento interpolado es un filtro estático (`ejercicios.repo.js:28`). |
| Secretos (código, historial, `.gitignore`, `.env.example`) | Sí | Sin claves en el código ni en la carpeta entregada. `.env` está en `.gitignore`; existe `backend/.env.example` con placeholders. |
| Contraseñas (scrypt, bcrypt o argon2 con sal) | Sí | `bcryptjs` con coste 12 en `auth.service.js`; nunca se guarda la contraseña en claro. |
| Control de acceso (rol verificado y prueba de abuso) | Sí | `requireAuth` consulta el usuario en BD y `requireRole` valida el rol. Los E2E cubren estudiante intentando acciones de docente (`403`) y acceso sin token (`401`). |
| Dependencias (existen, necesarias, versión fijada, sin vulnerabilidades) | Sí | `zod` 4.6.7, se eliminó `google-auth-library` (no se usaba) y se fijó `vite` 8.3.8 con `overrides`. `npm audit`: 0 vulnerabilidades. |

## 2. Tabla de hallazgos

| Id | Archivo y línea | Problema | Categoría (OWASP o tipo) | Severidad | Corrección | Commit |
|---|---|---|---|---|---|---|
| H-01 | `backend/src/services/auth.service.js:125` | El registro público aceptaba `rol: DOCENTE`, lo que permitía escalar privilegios | A01 Control de acceso | Alta | Se fuerza `ESTUDIANTE`; el esquema Zod rechaza otros roles y los docentes se aprovisionan por seed/administrador | Local |
| H-02 | `backend/src/services/auth.service.js:170` | `verifyUrl` devolvía el token de verificación al cliente en cualquier entorno | A02 Fallo criptográfico / exposición de datos | Alta | Solo se devuelve en `development`; en producción el token viaja únicamente por correo | Local |
| H-03 | `backend/src/config/env.js:36` | Secreto JWT de ejemplo o vacío aceptado como válido | A02 Fallo criptográfico | Alta | `resolveJwtSecret` aborta en producción y genera un secreto aleatorio en desarrollo | Local |
| H-04 | `backend/src/middlewares/error.js:20` | El manejador devolvía `err.message` en errores 5xx (rutas, SQL o credenciales) | A09 Registro y monitoreo insuficientes | Alta | Respuesta genérica para 5xx y detalle solo en el log del servidor | Local |
| M-01 | `backend/src/middlewares/auth.js:31` | `jwt.verify` no fijaba el algoritmo, lo que permitía confusión de algoritmos | A02 Fallo criptográfico | Media | Algoritmo fijado a `HS256` en firma y verificación | Local |
| M-02 | `backend/src/middlewares/auth.js:79` | Un token seguía siendo válido aunque el usuario estuviera desactivado | A01 Control de acceso | Media | `requireAuth` consulta el usuario en BD y exige `activo` antes de continuar | Local |
| M-03 | `backend/src/schemas/auth.schemas.js:52` | Rutas de perfil, vinculación y códigos docentes sin validación de entrada | A03 Inyección / validación | Media | Esquemas Zod y middleware `validate` en `auth`, `students` y `teachers` | Local |
| M-04 | `backend/src/services/ejercicios.service.js:79` | Dos intentos concurrentes podían registrar el mismo ejercicio y duplicar puntos | Condición de carrera | Media | `bloquearIntento` con `pg_advisory_xact_lock` dentro de la transacción | Local |
| M-05 | `backend/src/services/ejercicios.service.js:67` | Se aceptaba un `opcionId` de otro ejercicio y se podía responder con la opción correcta ajena | A04 Diseño inseguro | Media | Se valida que la opción pertenezca al ejercicio antes de calificar | Local |
| M-06 | `backend/src/services/auth.service.js:118` | El registro responde `409` cuando el correo existe y permite enumerar cuentas | A01 Control de acceso | Baja | Aceptado: el mensaje no revela datos adicionales; se prioriza la usabilidad del registro | Pendiente |
| M-07 | `frontend/src/app/core/api.config.ts:1` | Credenciales demo hardcodeadas en el frontend aunque no se usaban | Exposición de secretos | Baja | Se eliminaron `CREDENCIALES_DEMO` y el selector de rol docente del registro | Local |
| L-01 | `backend/src/middlewares/error.js:6` | El 404 reflejaba la URL solicitada y permitía inyectar contenido en la respuesta | A03 Inyección | Baja | Mensaje fijo «Recurso no encontrado.» | Local |
| L-02 | `backend/scripts/e2e-test.js:14` (y otros scripts) | Contraseña de PostgreSQL hardcodeada en scripts de prueba | Exposición de secretos | Baja | Los scripts usan `config.db` y `.env`; los e2e crean docentes directamente en BD | Local |
| L-03 | `backend/seed.js:25` | El seed solo aplicaba las migraciones 005–007 y dejaba la BD incompleta | Error funcional | Baja | Se aplican todas las migraciones `001`–`007` en orden | Local |
| L-04 | `backend/package.json:32`, `frontend/package.json:14` | `zod` con vulnerabilidad conocida, `google-auth-library` sin uso y `vite` vulnerable | Dependencias | Media/Alta | `zod` 4.6.7, eliminación de `google-auth-library`, `overrides` de `vite` 8.3.8 | Local |
| L-05 | `eslint.config.mjs:1` | No había linter ni reglas de seguridad configuradas | Calidad | Baja | ESLint flat config con `eslint-plugin-security` y `typescript-eslint` | Local |

**Severidad:** alta (permite acceder o cambiar datos sin permiso, o expone secretos), media (error probable o riesgo con condiciones), baja (estilo, mantenibilidad o riesgo acotado).

### Avisos del linter no corregidos

| Regla | Archivo y línea | Por qué se mantiene |
|---|---|---|
| `security/detect-object-injection` | `eslint.config.mjs` | Desactivada de forma global y justificada: el proyecto indexa arrays y mapas con claves internas (`req.params`, filas de BD) y la regla produce falsos positivos masivos. La validación real la hacen Zod y las consultas parametrizadas. |
| `no-console` | `eslint.config.mjs` | Desactivada porque el backend usa `console` para el log de arranque y de errores; no se registran datos sensibles. |
| `security/detect-non-literal-fs-filename` | `backend/seed.js:71`, `backend/scripts/frontend-routes-test.js:61` | Aviso puntual silenciado con comentario: las rutas se construyen solo con constantes internas del proyecto. |

## 3. Revisión con IA

**Prompt usado:** revisión de la semana 6 con criterios de inyección, secretos, contraseñas, control de acceso, dependencias, tabla de hallazgos con línea y severidad, y separación entre problemas seguros y sospechas. El detalle de la sesión está en `bitacora_ia.md`.

| Hallazgo de la IA | ¿Real o falso positivo? | Cómo lo verifiqué |
|---|---|---|
| Registro público permite crear docentes | Real | Se envió `rol: DOCENTE` al registro y respondió `201` antes de la corrección; ahora responde `400` y el E2E lo comprueba. |
| `verifyUrl` expone el token de verificación | Real | Se revisó la respuesta de `POST /auth/register`; el token aparecía en el JSON en cualquier entorno. |
| Secreto JWT de ejemplo aceptado | Real | Se arrancó con el valor de `.env.example` y el servidor no lo rechazaba. |
| Posible inyección SQL en repositorios | Falso positivo | Se revisaron todas las consultas: usan parámetros `$n`; el filtro de nivel es una cadena estática. |
| `security/detect-object-injection` en casi todo el backend | Falso positivo | Las claves provienen de parámetros validados o de filas de la BD, no de texto libre sin validar. |
| Condición de carrera al registrar intentos | Real | Se revisó la secuencia `SELECT` de intento + `INSERT`; dos solicitudes simultáneas podían leer el mismo intento. Se añadió el lock y una prueba E2E. |
| `opcionId` de otro ejercicio aceptado | Real | Se envió una opción de un ejercicio distinto y se calificó; ahora se rechaza con `400`. |
| Dependencia `google-auth-library` innecesaria | Real | No había importaciones en el código; se eliminó y `npm audit` quedó limpio. |

**Lo que la IA no encontró:** los scripts E2E e integración tenían la contraseña de PostgreSQL hardcodeada y el seed solo aplicaba las migraciones 005–007. Ambos problemas se detectaron al ejecutar las pruebas en una base limpia y se corrigieron en Local y Local. Tampoco señaló la falta de tokens CSRF: se documenta como pendiente porque la cookie usa `SameSite=Lax` y CORS tiene lista blanca, pero no sustituye a una defensa CSRF explícita.

## 4. Pendientes

| Pendiente | Por qué no se corrigió todavía | Plan |
|---|---|---|
| Enumeración de cuentas por `409` en registro | El mensaje solo confirma que el correo existe; cambiarlo a una respuesta genérica afecta la experiencia de registro | Evaluar un flujo de «reenviar verificación» sin revelar si la cuenta existe |
| Tokens CSRF explícitos | La cookie es `httpOnly` + `SameSite=Lax` y CORS está restringido; el riesgo es bajo para el alcance actual | Añadir token CSRF por sesión si se habilitan flujos cross-site |
| Verificación de correo en producción | En desarrollo el enlace se devuelve en la respuesta para poder probar; en producción depende de SMTP | Configurar SMTP real y eliminar cualquier retorno del token en producción |

**Claves expuestas:** Ninguna. El archivo `.env` real no se incluye en la entrega; solo se incluye `backend/.env.example` con valores de ejemplo. El `JWT_SECRET` de desarrollo se genera aleatoriamente y no se reutiliza en producción.
