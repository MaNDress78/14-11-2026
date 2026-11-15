'use strict';

const repo = require('../repositories/ejercicios.repo');
const { withTransaction } = require('../config/db');
const { calcularRacha, calcularRachaMaxima } = require('../utils/racha');

const NIVELES = ['FACIL', 'MEDIO', 'DIFICIL'];

/**
 * Normaliza y valida un nivel recibido por query string.
 *
 * @param {string} [nivel] Nivel solicitado (`FACIL`, `MEDIO` o `DIFICIL`).
 * @returns {string|null} Nivel en mayúsculas o `null` si no es válido.
 */
function normalizarNivel(nivel) {
  if (!nivel) return null;
  const v = String(nivel).toUpperCase();
  return NIVELES.includes(v) ? v : null;
}

/**
 * Lista los ejercicios de un tema sin revelar cuál opción es correcta.
 *
 * @param {number} temaId Identificador del tema.
 * @param {string} [nivel] Filtro opcional por nivel.
 * @returns {Promise<object[]>} Ejercicios con sus opciones públicas.
 */
async function listar(temaId, nivel) {
  return repo.listByTopic(temaId, normalizarNivel(nivel));
}

/**
 * Valida la respuesta de un ejercicio y registra el intento.
 * Los puntos se otorgan solo en el primer intento correcto.
 *
 * @param {object} datos Respuesta validada por Zod.
 * @param {string|number} datos.usuarioId Usuario autenticado.
 * @param {number} datos.ejercicioId Ejercicio respondido.
 * @param {number} [datos.opcionId] Opción elegida en preguntas de opción múltiple.
 * @param {string} [datos.textoRespuesta] Respuesta de pseudocódigo.
 * @returns {Promise<object>} Resultado, puntos, explicación y logros nuevos.
 * @throws {Error} 404 si el ejercicio no existe; 400 si falta la opción o no
 *   pertenece al ejercicio.
 */
async function validar({ usuarioId, ejercicioId, opcionId, textoRespuesta }) {
  const ejercicio = await repo.findWithOpciones(ejercicioId);
  if (!ejercicio) {
    const err = new Error(`Ejercicio ${ejercicioId} no encontrado.`);
    err.status = 404;
    throw err;
  }

  const esOpcionMultiple = ejercicio.tipo === 'OPCION_MULTIPLE';
  let correcta = false;
  let opcionCorrecta = null;
  let opcionSeleccionada = null;

  if (esOpcionMultiple) {
    if (!opcionId) {
      const err = new Error('Debes seleccionar una opción de respuesta.');
      err.status = 400;
      throw err;
    }
    opcionCorrecta = ejercicio.opciones.find((o) => o.es_correcta) || null;
    opcionSeleccionada = ejercicio.opciones.find((o) => o.id === Number(opcionId)) || null;
    if (!opcionSeleccionada) {
      const err = new Error('La opción enviada no pertenece al ejercicio.');
      err.status = 400;
      throw err;
    }
    correcta = Boolean(opcionCorrecta) && opcionCorrecta.id === opcionSeleccionada.id;
  }
  // tipo PSEUDOCODIGO: se almacena para revisión manual; no se autocalifica en el piloto.

  const resultado = await withTransaction(async (client) => {
    // Serializa intentos concurrentes del mismo usuario/ejercicio: sin este
    // bloqueo dos solicitudes simultáneas podrían contar 0 intentos y ambas
    // otorgar puntos por el "primer" intento.
    await repo.bloquearIntento(client, usuarioId, ejercicioId);
    const intentosPrevios = await repo.contarIntentos(client, usuarioId, ejercicioId);
    const intento = intentosPrevios + 1;
    const esPrimerIntento = intento === 1;
    const puntos = correcta && esPrimerIntento ? ejercicio.puntos_ponderados : 0;

    await repo.registrarRespuesta(client, {
      usuarioId,
      ejercicioId,
      opcionId: opcionId || null,
      textoRespuesta: textoRespuesta || null,
      correcta,
      intento,
    });

    if (puntos > 0) {
      await repo.sumarProgreso(client, {
        usuarioId,
        temaId: ejercicio.tema_id,
        resuelto: true,
        puntos,
      });
    }

    return { intento, esPrimerIntento, puntos };
  });

  const logrosOtorgados = await evaluarLogros(usuarioId);

  return {
    correcta,
    puntos: resultado.puntos,
    intento: resultado.intento,
    primerIntento: resultado.esPrimerIntento,
    explicacion: ejercicio.explicacion,
    retroalimentacionOpcion: opcionSeleccionada?.explicacion || null,
    opcionCorrectaId: opcionCorrecta ? opcionCorrecta.id : null,
    logros: logrosOtorgados,
  };
}

/**
 * Interpreta las condiciones JSONB de un logro.
 *
 * @param {object} condicion Condición almacenada en la base de datos.
 * @param {object} metricas Métricas calculadas del estudiante.
 * @param {string} [codigo] Código del logro (compatibilidad con filas antiguas).
 * @returns {boolean} `true` si el estudiante cumple la condición.
 */
function cumpleCondicion(condicion, metricas, codigo = '') {
  if (!condicion || typeof condicion !== 'object') return false;

  // Compatibilidad temporal con filas antiguas que aún no hayan pasado por la migración.
  let tipo = condicion.tipo;
  if (!tipo && Object.hasOwn(condicion, 'aciertos_min')) {
    tipo = codigo === 'MAESTRO_LOGICA' ? 'ejercicios_distintos_correctos' : 'aciertos_totales';
  } else if (!tipo && Object.hasOwn(condicion, 'racha_dias')) {
    tipo = 'racha_dias';
  }
  const valor = Number(condicion.valor ?? condicion.aciertos_min ?? condicion.racha_dias ?? 1);

  switch (tipo) {
    case 'puntos_acumulados':
      return metricas.puntos_acumulados >= valor;
    case 'dificultad_completada':
      return Array.isArray(metricas.niveles_completados) &&
        metricas.niveles_completados.includes(String(condicion.nivel || '').toUpperCase());
    case 'tema_perfecto':
      return metricas.temas_perfectos > 0;
    case 'temas_explorados':
      return metricas.temas_explorados >= valor;
    case 'aciertos_primer_intento':
      return metricas.aciertos_primer_intento >= valor;
    case 'intentos_totales':
      return metricas.intentos_totales >= valor;
    case 'ejercicios_dificiles':
      return metricas.ejercicios_dificiles >= valor;
    case 'racha_dias':
      return metricas.racha_dias >= valor;
    case 'aciertos_totales':
      return metricas.aciertos_totales >= valor;
    case 'ejercicios_distintos_correctos':
      return metricas.ejercicios_distintos_correctos >= valor;
    default:
      return false;
  }
}

/**
 * Evalúa y otorga los logros desbloqueados por la actividad del estudiante.
 *
 * @param {string|number} usuarioId Identificador del estudiante.
 * @returns {Promise<object[]>} Logros nuevos con `codigo`, `nombre` y `puntos`.
 */
async function evaluarLogros(usuarioId) {
  const [metricas, dias, logros] = await Promise.all([
    repo.getMetricasLogros(usuarioId),
    repo.listDiasActivos(usuarioId),
    repo.listLogrosEvaluables(),
  ]);
  metricas.racha_dias = calcularRacha(dias);

  const candidatos = logros.filter((logro) => cumpleCondicion(logro.condicion, metricas, logro.codigo));
  if (candidatos.length === 0) return [];

  // Una única transacción pequeña tras la transacción principal; el índice único
  // de logros_obtenidos resuelve de forma segura respuestas concurrentes.
  const nuevosIds = new Set(
    await withTransaction((client) =>
      repo.otorgarLogros(client, usuarioId, candidatos.map((logro) => logro.id)),
    ),
  );
  return candidatos
    .filter((logro) => nuevosIds.has(logro.id))
    .map(({ codigo, nombre, puntos }) => ({ codigo, nombre, puntos }));
}

/**
 * Devuelve el progreso agregado por tema del estudiante.
 *
 * @param {string|number} usuarioId Identificador del estudiante.
 * @returns {Promise<object[]>} Progreso por tema.
 */
async function progreso(usuarioId) {
  return repo.getProgreso(usuarioId);
}

/**
 * Devuelve todos los logros con el estado obtenido del estudiante.
 *
 * @param {string|number} usuarioId Identificador del estudiante.
 * @returns {Promise<object[]>} Logros y fechas de obtención.
 */
async function logros(usuarioId) {
  return repo.listLogros(usuarioId);
}

/**
 * Calcula el resumen de estadísticas del estudiante.
 *
 * @param {string|number} usuarioId Identificador del estudiante.
 * @returns {Promise<object>} Puntos, aciertos, intentos, rachas y días activos.
 */
async function stats(usuarioId) {
  const resumen = await repo.getResumen(usuarioId);
  const dias = await repo.listDiasActivos(usuarioId);
  return {
    puntos_totales: resumen.puntos_totales,
    aciertos: resumen.aciertos,
    intentos: resumen.intentos,
    racha_actual: calcularRacha(dias),
    racha_maxima: calcularRachaMaxima(dias),
    dias_activos: dias.length,
  };
}

module.exports = { listar, validar, progreso, logros, stats, cumpleCondicion };
