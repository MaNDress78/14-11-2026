'use strict';

const service = require('../services/ejercicios.service');

/**
 * Lista los ejercicios de un tema, con filtro opcional por nivel.
 * @param {import('express').Request} req Petición con `req.query.temaId` y `nivel`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function listar(req, res, next) {
  try {
    const { temaId, nivel } = req.query;
    res.json({ ejercicios: await service.listar(temaId, nivel) });
  } catch (err) {
    next(err);
  }
}

/**
 * Valida la respuesta de un ejercicio para el estudiante autenticado.
 * @param {import('express').Request} req Petición autenticada y validada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function validar(req, res, next) {
  try {
    const { opcionId, textoRespuesta } = req.body;
    const resultado = await service.validar({
      usuarioId: req.usuario.sub,
      ejercicioId: req.params.ejercicioId,
      opcionId,
      textoRespuesta,
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve el progreso por tema del estudiante autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function progreso(req, res, next) {
  try {
    res.json({ progreso: await service.progreso(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve los logros del estudiante autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function logros(req, res, next) {
  try {
    res.json({ logros: await service.logros(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve las estadísticas del estudiante autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function stats(req, res, next) {
  try {
    res.json({ stats: await service.stats(req.usuario.sub) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, validar, progreso, logros, stats };
