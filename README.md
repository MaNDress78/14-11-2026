
# TopicGym

Aplicación web para practicar Lógica de Programación con ejercicios autocorregibles, progreso por tema, logros y un panel para docentes.

## 1. Qué es

TopicGym es una SPA Angular con API REST en Node.js/Express y PostgreSQL. El estudiante recorre semestres, asignaturas y temas, resuelve ejercicios de opción múltiple o pseudocódigo, gana puntos y logros, y consulta su progreso. El docente genera códigos de clase, vincula estudiantes y revisa el avance de cada alumno.

Funcionalidades principales:

- Registro con verificación de correo y login con JWT en cookie `httpOnly`.
- Catálogo académico por semestre, asignatura y tema, con videos y ejercicios.
- Validación de respuestas en el servidor, puntuación por intento y logros automáticos.
- Panel docente con códigos de vinculación y progreso de sus estudiantes.
- Perfil editable y consulta de códigos de clase vinculados.

La revisión de seguridad de la semana 6 está documentada en [`revision_seguridad.md`](revision_seguridad.md).

## 2. Requisitos

- Node.js 20 o superior (probado con Node.js 24).
- npm 10 o superior.
- PostgreSQL 14 o superior (probado con PostgreSQL 16 y 18).
- Puerto libre `3000` para la API y `4200` para el frontend.

## 3. Instalación

Desde la carpeta del proyecto:

```bash
# Herramientas de lint en la raíz
npm install

# Dependencias del backend y del frontend
npm run install:all

# Variables de entorno del backend
cp backend/.env.example backend/.env
```

Edita `backend/.env` con los datos de tu PostgreSQL y un secreto JWT propio:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_clave
DB_NAME=topicgym

JWT_SECRET=un_secreto_aleatorio_de_al_menos_32_caracteres
APP_BASE_URL=http://localhost:4200
```

Crea la base de datos y carga esquema, migraciones y datos demo:

```bash
createdb -U postgres topicgym
npm run seed
```

El seed aplica `database/schema.sql`, todas las migraciones `001`–`007` y los datos de `database/seed.sql`. Si necesitas reiniciar los datos, ejecuta el seed con `--reset` desde `backend/`.

## 4. Ejecución

En dos terminales:

```bash
# Terminal 1: API en http://localhost:3000
npm run dev:backend

# Terminal 2: frontend en http://localhost:4200
npm run dev:frontend
```

También puedes iniciar el backend en modo producción local con `npm --prefix backend start`.

Verifica que la API responda:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","db":true,...}
```

### Usuarios demo

| Rol        | Correo                              | Contraseña   |
|------------|-------------------------------------|--------------|
| Estudiante | estudiante.demo@institucion.edu.co | TopicGym2026 |
| Docente    | docente.demo@institucion.edu.co     | TopicGym2026 |

### API (resumen)

- `GET  /api/health`
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/verify/:token`
- `GET  /api/auth/me` · `PATCH /api/auth/me` · `POST /api/auth/logout`
- `GET  /api/semesters` · `GET /api/semesters/:id/subjects`
- `GET  /api/subjects/:id/topics` · `GET /api/topics/:id`
- `GET  /api/exercises?temaId=&nivel=`
- `POST /api/exercises/:id/validate`
- `GET  /api/progress` · `GET /api/achievements` · `GET /api/stats`
- `POST /api/teachers/codes` · `GET /api/teachers/codes` · `GET /api/teachers/students-progress`
- `POST /api/auth/link-code` · `GET /api/auth/mis-codigos`

## 5. Pruebas

Desde la raíz del repositorio:

```bash
npm test              # node:test del backend + suite de la semana 7
npm run test:semana7  # solo la suite de reglas de negocio en tests/
npm run lint          # ESLint con reglas de seguridad
npm run audit         # npm audit en backend y frontend
npm run build         # compila el frontend (TypeScript + Angular)
```

Con la base de datos sembrada y el backend en ejecución:

```bash
cd backend
node scripts/smoke.js             # humo de la API
node scripts/e2e-test.js          # flujo completo de autenticación y roles
node scripts/e2e-progress-test.js # progreso real de un estudiante
node scripts/frontend-routes-test.js
```

Las pruebas E2E crean datos temporales y los eliminan al final. Como consumen el límite de intentos de login, reinicia el backend entre corridas si ves respuestas `429`.

## 6. Estructura

```text
TopicGym_V.1.0/
├── backend/
│   ├── src/
│   │   ├── config/        # entorno y pool de PostgreSQL
│   │   ├── controllers/   # entrada HTTP
│   │   ├── middlewares/   # autenticación, validación y errores
│   │   ├── repositories/  # consultas SQL parametrizadas
│   │   ├── routes/        # rutas Express
│   │   ├── schemas/       # validación con Zod
│   │   ├── services/      # reglas de negocio
│   │   └── utils/
│   ├── scripts/           # pruebas de humo, E2E e integración
│   ├── test/              # pruebas unitarias (node:test)
│   ├── seed.js
│   └── .env.example
├── tests/                 # suite de la semana 7 con node:test
├── registro_pruebas.md    # reglas, tablas de casos y revisión de la IA
├── bitacora_ia.md
├── informe_final.md       # informe final del proyecto integrador
├── documentos/
│   └── semana4/           # documento de diseño (DOCX, PDF) y fuentes Mermaid
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/        # 001–007
├── frontend/
│   └── src/app/
│       ├── core/          # modelos, configuración y servicios
│       ├── features/      # login, registro, catálogo, progreso, perfil, docente
│       └── shared/
├── eslint.config.mjs
├── revision_seguridad.md
├── bitacora_ia.md
├── package.json
└── README.md
```

## 7. Uso de IA

El proyecto se desarrolló con apoyo de OpenCode en modo agente. La IA se usó para proponer código, ejecutar pruebas, revisar seguridad, diseñar la arquitectura y redactar borradores de documentación.

Cada hallazgo de la revisión de la semana 6 se verificó contra el código antes de corregirlo; los falsos positivos y las decisiones se registran en [`revision_seguridad.md`](revision_seguridad.md) y el detalle de prompts, aceptaciones y verificaciones está en [`bitacora_ia.md`](bitacora_ia.md). Ninguna prueba existente se modificó para que pasara: las correcciones de comportamiento incluyen pruebas nuevas o ajustes de los scripts E2E.

Los documentos de cada módulo están en el repositorio:

| Entrega | Archivo |
|---|---|
| Semana 3. Requisitos y bitácora de prompts | [`documentos/semana3/Ramos_Betancourt_S3_Requisitos.docx`](documentos/semana3/Ramos_Betancourt_S3_Requisitos.docx) (la bitácora de esa semana es su Anexo) |
| Semana 4. Documento de diseño y ADR | [`documentos/semana4/Ramos_Michael_S4_Diseno.pdf`](documentos/semana4/Ramos_Michael_S4_Diseno.pdf) · [fuentes Mermaid](documentos/semana4/fuentes_mermaid/) |
| Semana 6. Revisión de seguridad | [`revision_seguridad.md`](revision_seguridad.md) |
| Semana 7. Registro de pruebas | [`registro_pruebas.md`](registro_pruebas.md) |
| Cierre. Informe final | [`informe_final.md`](informe_final.md) |

## 8. Autor y licencia

Equipo TopicGym: Michael Ramos Betancourt.

Proyecto académico del seminario de Lógica de Programación. Licencia MIT: se permite usar, copiar, modificar y distribuir el código conservando este aviso.
