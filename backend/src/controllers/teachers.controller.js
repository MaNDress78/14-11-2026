'use strict';

const service = require('../services/teachers.service');

/**
 * Crea un código de clase para el docente autenticado.
 * @param {import('express').Request} req Petición autenticada y validada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function crearCodigo(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { asignaturaId } = req.body || {};
    const codigo = await service.generarCodigo(docenteId, asignaturaId || null);
    res.status(201).json({ codigo });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista los códigos de clase del docente autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function listarCodigos(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const codigos = await service.listarCodigos(docenteId);
    res.json({ codigos });
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un código de clase del docente autenticado.
 * @param {import('express').Request} req Petición con `req.params.codigoId`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function eliminarCodigo(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { codigoId } = req.params;
    const resultado = await service.eliminarCodigo(docenteId, codigoId);
    res.json({ ok: true, ...resultado });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista las asignaturas disponibles para asociar a un código.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function listarAsignaturas(req, res, next) {
  try {
    const asignaturas = await service.listarAsignaturas();
    res.json({ asignaturas });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve el progreso de los alumnos vinculados al docente.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function progresoEstudiantes(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const alumnos = await service.obtenerProgresoEstudiantes(docenteId);
    res.json({ alumnos });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve el detalle de un alumno en un código del docente.
 * @param {import('express').Request} req Petición con parámetros de alumno y código.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function detalleAlumno(req, res, next) {
  try {
    const docenteId = req.usuario.sub;
    const { estudianteId, codigoId } = req.params;
    const detalle = await service.obtenerDetalleAlumno(docenteId, estudianteId, codigoId);
    res.json(detalle);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearCodigo,
  listarCodigos,
  eliminarCodigo,
  listarAsignaturas,
  progresoEstudiantes,
  detalleAlumno,
};
