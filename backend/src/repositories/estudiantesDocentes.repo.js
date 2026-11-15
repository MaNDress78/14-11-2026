'use strict';

const { pool } = require('../config/db');

/**
 * Vincula un estudiante con un código de clase (idempotente).
 * @param {{estudianteId: (string|number), codigoId: (string|number)}} datos
 * @returns {Promise<object|null>} Vínculo creado o `null` si ya existía.
 */
async function vincular({ estudianteId, codigoId }) {
  const { rows } = await pool.query(
    `INSERT INTO estudiantes_docentes (estudiante_id, codigo_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING estudiante_id, codigo_id, fecha_vinculacion`,
    [estudianteId, codigoId],
  );
  return rows[0] || null;
}

/**
 * Lista los códigos vinculados a un estudiante con los datos del docente.
 * @param {string|number} estudianteId
 * @returns {Promise<object[]>} Vínculos ordenados por fecha.
 */
async function listarPorEstudiante(estudianteId) {
  const { rows } = await pool.query(
    `SELECT ed.estudiante_id, ed.codigo_id, ed.fecha_vinculacion,
            cc.codigo, cc.activo, cc.asignatura_id,
            a.nombre AS asignatura_nombre,
            u.nombre AS docente_nombre, u.correo_institucional AS docente_correo
       FROM estudiantes_docentes ed
       JOIN codigos_clase cc ON cc.id = ed.codigo_id
       JOIN usuarios u       ON u.id  = cc.docente_id
       LEFT JOIN asignaturas a ON a.id = cc.asignatura_id
      WHERE ed.estudiante_id = $1
      ORDER BY ed.fecha_vinculacion ASC`,
    [estudianteId],
  );
  return rows;
}

/**
 * Comprueba si ya existe un vínculo estudiante-código.
 * @param {string|number} estudianteId
 * @param {string|number} codigoId
 * @returns {Promise<boolean>} `true` si el vínculo existe.
 */
async function existeVinculo(estudianteId, codigoId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM estudiantes_docentes WHERE estudiante_id = $1 AND codigo_id = $2`,
    [estudianteId, codigoId],
  );
  return rows.length > 0;
}

module.exports = { vincular, listarPorEstudiante, existeVinculo };
