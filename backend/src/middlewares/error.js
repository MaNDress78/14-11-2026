'use strict';

const { ZodError } = require('zod');

/** Ruta no encontrada. */
function notFound(_req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

/** Manejador central de errores (debe declararse al final del stack de Express). */
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos.',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }

  const status = err.status || 500;
  if (status >= 500) {
    // Los detalles internos (SQL, rutas, credenciales) solo van al log.
    console.error('[error]', err);
    return res.status(status).json({ error: 'Error interno del servidor.' });
  }
  return res.status(status).json({ error: err.message || 'Solicitud inválida.' });
}

module.exports = { notFound, errorHandler };
