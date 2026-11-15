'use strict';

// Lectura centralizada de variables de entorno.
// No importar process.env directamente en otros módulos: usar este archivo.

const { randomBytes } = require('crypto');
const path = require('path');

// Ruta explícita para que funcione igual desde backend/, la raíz o scripts/.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const SECRETOS_INSEGUROS = new Set([
  '',
  'cambia_este_secreto_largo_y_aleatorio',
  'secreto-de-desarrollo-no-usar-en-produccion',
]);
const JWT_SECRET_MIN_LENGTH = 32;

/**
 * Convierte una variable de entorno numérica.
 *
 * @param {string|undefined} value Valor leído de `process.env`.
 * @param {number} fallback Valor por defecto si no es un número válido.
 * @returns {number} Entero configurado o el valor por defecto.
 */
function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * Obtiene el secreto JWT validando que no sea el valor de ejemplo.
 * En producción aborta el arranque; en desarrollo genera uno aleatorio por
 * proceso para no aceptar tokens firmados con un secreto público conocido.
 */
function resolveJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  const esSeguro = !SECRETOS_INSEGUROS.has(secret) && secret.length >= JWT_SECRET_MIN_LENGTH;
  if (esSeguro) return secret;

  if ((process.env.NODE_ENV || 'development') === 'production') {
    throw new Error(
      `JWT_SECRET no configurado o inseguro. Define un valor aleatorio de al menos ${JWT_SECRET_MIN_LENGTH} caracteres.`,
    );
  }

  console.warn(
    '[config] JWT_SECRET ausente o inseguro: se genera uno aleatorio para este proceso de desarrollo.',
  );
  return randomBytes(32).toString('hex');
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'topicgym',
    max: toInt(process.env.DB_POOL_MAX, 10),
  },

  jwt: {
    secret: resolveJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200,http://localhost:5500,http://127.0.0.1:5500')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  rateLimit: {
    apiMax: toInt(process.env.API_RATE_MAX, 300),
    apiWindowMs: toInt(process.env.API_RATE_WINDOW_MS, 600000),
    authMax: toInt(process.env.AUTH_RATE_MAX, 10),
    authWindowMs: toInt(process.env.AUTH_RATE_WINDOW_MS, 600000),
  },

  // Envío de correo (verificación de registro). Ethereal/Mailtrap en desarrollo.
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: toInt(process.env.EMAIL_PORT, 587),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'TopicGym <no-reply@topicgym.local>',
  },

  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:4200',
  },

};

module.exports = config;
