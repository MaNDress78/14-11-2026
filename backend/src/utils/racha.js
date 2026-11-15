'use strict';

/**
 * Convierte una fecha a `YYYY-MM-DD` en UTC.
 *
 * @param {string|Date} value Fecha de entrada.
 * @returns {string} Fecha en formato ISO corto.
 */
function toISODate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

/**
 * Calcula la racha actual de días consecutivos con actividad.
 * Si hoy no hay actividad, permite que la racha empiece ayer.
 *
 * @param {(string|Date)[]} dias Días con actividad.
 * @returns {number} Días consecutivos de la racha actual.
 */
function calcularRacha(dias) {
  if (!dias.length) return 0;
  const set = new Set(dias.map(toISODate));
  const cursor = new Date();
  if (!set.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(toISODate(cursor))) return 0;
  }
  let racha = 0;
  while (set.has(toISODate(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

/**
 * Calcula la racha más larga registrada.
 *
 * @param {(string|Date)[]} dias Días con actividad.
 * @returns {number} Longitud de la racha máxima.
 */
function calcularRachaMaxima(dias) {
  const orden = [...new Set(dias.map(toISODate))].sort();
  let max = 0;
  let actual = 0;
  let anterior = null;
  for (const dia of orden) {
    if (anterior) {
      const prev = new Date(anterior);
      prev.setDate(prev.getDate() + 1);
      actual = toISODate(prev) === dia ? actual + 1 : 1;
    } else {
      actual = 1;
    }
    max = Math.max(max, actual);
    anterior = dia;
  }
  return max;
}

module.exports = { toISODate, calcularRacha, calcularRachaMaxima };
