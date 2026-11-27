# Entrevista del módulo 2: necesidades con cita del cliente

**Cliente:** Franchesco Virgoi, estudiante que actuó como cliente simulado
**Fecha de la entrevista:** 10/11/2026 (15 minutos)
**Autorización:** el cliente autorizó grabar la sesión y pasar la transcripción por una
herramienta de IA. Los nombres, correos y teléfonos que aparecen en los documentos son
ficticios.

Este archivo es la evidencia del módulo 2 (entrevista). Contiene las diez necesidades con la
cita textual del cliente que las respalda, tal como quedaron en la sección 3 del documento de
requisitos de la semana 3. La transcripción completa no se versiona: lo que se conserva aquí
son las citas verificadas durante la revisión.

---

## Las diez necesidades con cita

| Id | Necesidad | Cita del cliente | Tipo |
|---|---|---|---|
| N-01 | Nivelar los conceptos de programación al iniciar primer semestre | «No tengo claros los conceptos de programación cuando llego a primer semestre» | Funcional |
| N-02 | Encontrar material de estudio gratuito y ordenado por tema | «No sé cómo estudiar ni dónde encontrar información útil; quiero cursos gratuitos organizados» | Funcional |
| N-03 | Practicar ejercicios con retroalimentación inmediata | «Quiero practicar ejercicios y que me digan de una vez si acerté» | Funcional |
| N-04 | Consultar el avance por tema sin presión | «Quiero ver cómo voy avanzando en cada tema, pero sin sentir presión» | Funcional |
| N-05 | Ver puntos y logros que incentiven la práctica | «Me motiva ver mis puntos y mis logros para seguir practicando» | Funcional |
| N-06 | Registrarse con correo institucional y verificar la cuenta | «Quiero entrar con mi correo institucional y verificar mi cuenta antes de usar la plataforma» | Funcional |
| N-07 | Permitir que el docente vincule alumnos con un código y revise su avance | «Como maestro quiero dar un código a mis estudiantes y revisar su avance» | Funcional |
| N-08 | Evitar el acceso de cuentas no verificadas | «No quiero que cualquiera pueda entrar con un correo cualquiera» | No funcional |
| N-09 | Tener los videos de apoyo a la mano desde cada tema | «Quiero tener los videos del tema a la mano para repasar» | Funcional |
| N-10 | Practicar pseudocódigo con PSeInt | «Quiero practicar pseudocódigo con PSeInt» | Funcional |

## De la cita al diseño

Cada necesidad se convirtió en una historia de usuario con su prioridad y su prueba prevista,
y de ahí salió el peso de cada atributo de calidad del documento de diseño.

| Necesidad | Historia | Prioridad | Dónde aparece en el diseño |
|---|---|---|---|
| N-01, N-02 | HU-01 catálogo por semestre, asignatura y tema | Must | Atributo «cobertura del catálogo», peso 4 |
| N-03 | HU-03 ejercicio con retroalimentación inmediata | Must | Atributo «fiabilidad de la corrección», peso 5; ADR-002 |
| N-04 | HU-04 progreso por tema | Must | Atributo «avance visible y sin presión», peso 4 |
| N-05 | HU-05 puntos y logros | Must | Atributos «fiabilidad» y «avance visible» |
| N-06, N-08 | HU-02 registro con verificación | Must | Atributo «seguridad de la sesión», peso 5; RNF-02 |
| N-07 | HU-06 código de clase, HU-07 detalle del alumno, HU-09 códigos vinculados | Must / Should / Should | Diagrama de contenedores: actor «Docente» |
| N-09 | HU-10 videos de apoyo | Could | Diagrama de contexto: sistema externo «YouTube» |
| N-10 | HU-08 envío de pseudocódigo | Should | Modelo de datos: `ejercicios.tipo = PSEUDOCODIGO` |

## Preguntas que la entrevista dejó abiertas

| Id | Pregunta | Estado |
|---|---|---|
| P-01 | ¿Con cuántos ejercicios por tema se da el tema por terminado: con los 3 actuales o con los 5 de la barra del dashboard? | Abierta |
| P-02 | ¿Los videos deben incrustarse en la plataforma o basta con el enlace a YouTube? | Abierta: hoy basta el enlace |
| P-03 | ¿Quién revisa las respuestas de pseudocódigo y en cuánto tiempo debe responder? | Abierta: hoy la revisión es manual |
| P-04 | ¿Se requiere un modo de calificación con notas y pesos por asignatura? | Abierta: fuera de alcance |
| P-05 | ¿Confirma que las frases de la sección 3 son literales de la grabación del 10/11/2026? | Abierta: las citas se reconstruyeron desde mis notas |
| P-06 | ¿Qué dominio de correo institucional se debe aceptar en el registro? | Abierta: hoy se acepta el patrón institucional genérico |

El documento de diseño de la semana 4 añade una séptima pregunta, **P-07**: *¿quién se
encarga del mantenimiento del servidor, con cuántas horas por semana y con qué respaldo de la
institución?*, porque de ella depende la decisión de arquitectura.

## Documentos relacionados

- [Propuesta del módulo 1](modulo1_propuesta.md)
- [Documento de requisitos de la semana 3](semana3/Ramos_Betancourt_S3_Requisitos.docx)
- [Documento de diseño de la semana 4](semana4/Ramos_Michael_S4_Diseno.pdf)
- [Informe final del proyecto integrador](../informe_final.md)
