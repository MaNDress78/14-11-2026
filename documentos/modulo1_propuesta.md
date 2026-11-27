# Propuesta del módulo 1: TopicGym

**Proyecto:** TopicGym
**Autor:** Michael Ramos Betancourt
**Fecha:** 26/11/2026
**Repositorio:** https://github.com/MaNDress78/14-11-2026

Este archivo es la evidencia del módulo 1 (fundamentos y propuesta). El texto del apartado
siguiente se conserva **tal como se redactó**, con su ortografía original, porque es el
documento de partida del proyecto y las correcciones de estilo se hicieron después, en el
documento de requisitos de la semana 3.

---

## Propuesta original

> hay estudiantes de primer semestre de la carrera ingenieria de software que no tienen claros los conceptos de programacios , no saben como estudiar o donde encontrar infomacion util para estudiar, la ida era crear una pagina wed donde los estudiantes puedan nivelar su conocimiento risiviendo cursos gratuitos que se sacan de interned , se organizan y se presentan de una forma ordenada y cronologica para el tema que se esta biendo , aqui podran estudiar y nivelarse sin sentirse precionados , todos los recursos que usarian en la pagina serian gratuitos videos de youtube cursos , todo organizado pensando en amento progresivo de el conocimiento del estudiante.

## Qué se extrajo de esa propuesta

| Idea de la propuesta original | Cómo se resolvió en el proyecto | Evidencia |
|---|---|---|
| «no tienen claros los conceptos de programación» | Catálogo por semestre, asignatura y tema con 50 temas y 140 ejercicios de práctica autocorregible | [documento de diseño, sección 5](semana4/Ramos_Michael_S4_Diseno.pdf) |
| «no sé cómo estudiar ni dónde encontrar información útil» | Videos de apoyo por tema y ejercicios de tres niveles de dificultad (10, 25 y 50 puntos) | [`database/seed.sql`](../database/seed.sql) |
| «cursos gratuitos organizados» | Todo el contenido es gratuito y vive en la base de datos del proyecto, sin servicios de pago | [`README.md`](../README.md) |
| «de una forma ordenada y cronológica» | El orden curricular es el del programa: 4 semestres, 34 asignaturas y `orden` explícito en cada nivel | [`database/migrations/006_catalogo_semestres_1_4.sql`](../database/migrations/006_catalogo_semestres_1_4.sql) |
| «sin sentirse presionados» | Puntos, logros y racha como refuerzo; sin notas, sin comparación entre estudiantes y sin modo de calificación | [informe final, sección 6](../informe_final.md) |
| «pensando en aumento progresivo del conocimiento» | Progreso por tema y logro `TEMA_DOMINADO` cuando se completa un tema | [`backend/src/services/ejercicios.service.js`](../backend/src/services/ejercicios.service.js) |

## Documentos relacionados

- [Informe final del proyecto integrador](../informe_final.md)
- [Documento de requisitos de la semana 3](semana3/Ramos_Betancourt_S3_Requisitos.docx)
- [Documento de diseño de la semana 4](semana4/Ramos_Michael_S4_Diseno.pdf)
