'use strict';

const codigosRepo = require('../repositories/codigos.repo');
const teachersRepo = require('../repositories/teachers.repo');
const { withTransaction } = require('../config/db');
const { calcularRacha } = require('../utils/racha');
const { randomBytes } = require('crypto');

const DIAS_SIN_ACTIVIDAD = 7;
const RACHA_MINIMA = 3;
const MS_POR_DIA = 86400000;
const HISTORIAL_LIMITE = 25;

/**
 * Genera un código de clase legible con 24 bits aleatorios.
 *
 * @returns {string} Código con formato `PROG-XXXXXX`.
 */
function generarCodigoRandom() {
  const hex = randomBytes(3).toString('hex').toUpperCase();
  return `PROG-${hex}`;
}

/**
 * Crea un código de clase único para un docente.
 *
 * @param {string|number} docenteId Docente propietario del código.
 * @param {number|null} [asignaturaId] Asignatura asociada (opcional).
 * @returns {Promise<object>} Código creado.
 */
async function generarCodigo(docenteId, asignaturaId = null) {
  let codigo;
  let intentos = 0;
  do {
    codigo = generarCodigoRandom();
    const existente = await codigosRepo.findActiveByCodigo(codigo);
    if (!existente) break;
    intentos += 1;
  } while (intentos < 10);
  const creado = await codigosRepo.crear({ docenteId, codigo, asignaturaId });
  return creado;
}

/**
 * Lista los códigos de clase de un docente.
 *
 * @param {string|number} docenteId Identificador del docente.
 * @returns {Promise<object[]>} Códigos con estado y asignatura.
 */
async function listarCodigos(docenteId) {
  return codigosRepo.listarPorDocente(docenteId);
}

/**
 * Elimina un código de clase solo si pertenece al docente.
 *
 * @param {string|number} docenteId Docente autenticado.
 * @param {string|number} codigoId Código a eliminar.
 * @returns {Promise<object>} Resultado de la eliminación.
 * @throws {Error} 404 si el código no existe o no pertenece al docente.
 */
async function eliminarCodigo(docenteId, codigoId) {
  const resultado = await withTransaction((client) =>
    codigosRepo.eliminarPorDocente(client, { docenteId, codigoId }),
  );
  if (!resultado) {
    const err = new Error('Código de clase no encontrado.');
    err.status = 404;
    throw err;
  }
  return resultado;
}

/**
 * Lista las asignaturas que un docente puede asociar a un código.
 *
 * @returns {Promise<object[]>} Asignaturas disponibles.
 */
async function listarAsignaturas() {
  return codigosRepo.listarAsignaturas();
}

/**
 * Clasifica la actividad reciente de un alumno para el panel docente.
 *
 * @param {string|Date|null} ultimaActividad Fecha del último intento.
 * @param {number} racha Días consecutivos de actividad.
 * @returns {'INACTIVO'|'ACTIVO'|'RACHA'} Estado calculado.
 */
function clasificarActividad(ultimaActividad, racha) {
  if (!ultimaActividad) return 'INACTIVO';
  const diasDesdeUltima = (Date.now() - new Date(ultimaActividad).getTime()) / MS_POR_DIA;
  if (diasDesdeUltima > DIAS_SIN_ACTIVIDAD) return 'INACTIVO';
  return racha >= RACHA_MINIMA ? 'RACHA' : 'ACTIVO';
}

/**
 * Devuelve el progreso de los estudiantes vinculados a los códigos del docente.
 *
 * @param {string|number} docenteId Identificador del docente.
 * @returns {Promise<object[]>} Alumnos con puntos, ejercicios, racha y estado.
 */
async function obtenerProgresoEstudiantes(docenteId) {
  const alumnos = await teachersRepo.getStudentsProgressByDocente(docenteId);
  const ids = [...new Set(alumnos.map((alumno) => alumno.id))];
  const diasPorUsuario = await teachersRepo.listDiasActivosDeUsuarios(ids);

  return alumnos.map((alumno) => {
    const racha = calcularRacha(diasPorUsuario.get(alumno.id) || []);
    return {
      ...alumno,
      racha_dias: racha,
      estado_actividad: clasificarActividad(alumno.ultima_actividad, racha),
    };
  });
}

/**
 * Devuelve el detalle de un alumno dentro de un código del docente.
 *
 * @param {string|number} docenteId Docente autenticado.
 * @param {string|number} estudianteId Alumno consultado.
 * @param {string|number} codigoId Código que los vincula.
 * @returns {Promise<object>} Alumno, progreso por tema e historial reciente.
 * @throws {Error} 404 si el alumno no está vinculado a un código del docente.
 */
async function obtenerDetalleAlumno(docenteId, estudianteId, codigoId) {
  const alumno = await teachersRepo.getAlumnoCodigoDocente(docenteId, estudianteId, codigoId);
  if (!alumno) {
    const err = new Error('Alumno no encontrado en tus códigos de clase.');
    err.status = 404;
    throw err;
  }

  const [temas, historial] = await Promise.all([
    teachersRepo.getTemasProgreso(estudianteId, alumno.asignatura_id),
    teachersRepo.listHistorialAlumno(estudianteId, alumno.asignatura_id, HISTORIAL_LIMITE),
  ]);

  return {
    alumno,
    temas: temas.map((tema) => ({
      ...tema,
      porcentaje: tema.total_ejercicios > 0 ? Math.round((tema.resueltos / tema.total_ejercicios) * 100) : 0,
    })),
    historial,
  };
}

module.exports = {
  generarCodigo,
  listarCodigos,
  eliminarCodigo,
  listarAsignaturas,
  obtenerProgresoEstudiantes,
  obtenerDetalleAlumno,
};
