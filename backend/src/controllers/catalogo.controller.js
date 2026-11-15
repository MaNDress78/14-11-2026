'use strict';

const service = require('../services/catalogo.service');

/**
 * Lista los semestres del catálogo.
 * @param {import('express').Request} _req Petición (no se usa).
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function semestres(_req, res, next) {
  try {
    res.json({ semestres: await service.semestres() });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista las asignaturas de un semestre.
 * @param {import('express').Request} req Petición con `req.params.semestreId`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function asignaturas(req, res, next) {
  try {
    const asignaturas = await service.asignaturasDeSemestre(req.params.semestreId);
    res.json({ asignaturas });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista los temas de una asignatura.
 * @param {import('express').Request} req Petición con `req.params.asignaturaId`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function temas(req, res, next) {
  try {
    const temas = await service.temasDeAsignatura(req.params.asignaturaId);
    res.json({ temas });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve el detalle de un tema con sus videos.
 * @param {import('express').Request} req Petición con `req.params.temaId`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function tema(req, res, next) {
  try {
    res.json({ tema: await service.detalleTema(req.params.temaId) });
  } catch (err) {
    next(err);
  }
}

module.exports = { semestres, asignaturas, temas, tema };
