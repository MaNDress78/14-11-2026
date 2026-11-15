'use strict';

const repo = require('../repositories/catalogo.repo');

/**
 * Construye un error 404 reutilizable para el catálogo.
 *
 * @param {string} msg Mensaje visible al cliente.
 * @returns {Error} Error con `status = 404`.
 */
function noEncontrado(msg) {
  const err = new Error(msg);
  err.status = 404;
  return err;
}

/**
 * Lista todos los semestres del catálogo.
 *
 * @returns {Promise<object[]>} Semestres ordenados.
 */
async function semestres() {
  return repo.listSemesters();
}

/**
 * Lista las asignaturas de un semestre.
 *
 * @param {number} semestreId Identificador del semestre.
 * @returns {Promise<object[]>} Asignaturas ordenadas.
 */
async function asignaturasDeSemestre(semestreId) {
  return repo.listSubjectsBySemester(semestreId);
}

/**
 * Lista los temas de una asignatura.
 *
 * @param {number} asignaturaId Identificador de la asignatura.
 * @returns {Promise<object[]>} Temas ordenados.
 */
async function temasDeAsignatura(asignaturaId) {
  return repo.listTopicsBySubject(asignaturaId);
}

/**
 * Devuelve el detalle de un tema con sus videos.
 *
 * @param {number} temaId Identificador del tema.
 * @returns {Promise<object>} Tema con asignatura, semestre y videos.
 * @throws {Error} 404 si el tema no existe.
 */
async function detalleTema(temaId) {
  const tema = await repo.getTopicWithVideos(temaId);
  if (!tema) throw noEncontrado(`Tema ${temaId} no encontrado.`);
  return tema;
}

module.exports = { semestres, asignaturasDeSemestre, temasDeAsignatura, detalleTema };
