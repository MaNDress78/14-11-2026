'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const usuariosRepo = require('../repositories/usuarios.repo');

const COOKIE_NAME = 'token';
const JWT_ALGORITHM = 'HS256';

/**
 * Extrae el JWT de la cookie `token` o de la cabecera `Authorization`.
 *
 * @param {import('express').Request} req Petición HTTP.
 * @returns {string|null} Token encontrado o `null`.
 */
function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Verifica un JWT fijando el algoritmo esperado para evitar confusión de algoritmos.
 *
 * @param {string} token JWT recibido.
 * @returns {object} Payload verificado.
 * @throws {Error} Si el token es inválido, expiró o usa otro algoritmo.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
}

/**
 * Adjunta `req.usuario` si hay un token válido; no bloquea la petición.
 *
 * @param {import('express').Request} req Petición HTTP.
 * @param {import('express').Response} _res Respuesta HTTP (no se usa).
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {void}
 */
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.usuario = verifyToken(token);
    } catch (_e) {
      /* token inválido: se ignora en modo opcional */
    }
  }
  next();
}

/**
 * Exige un token válido y que la cuenta siga activa.
 * El rol se refresca desde la base de datos para que una desactivación o un
 * cambio de rol surta efecto sin esperar a que expire el token.
 *
 * @param {import('express').Request} req Petición HTTP.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado: falta el token.' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (_e) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  try {
    const usuario = await usuariosRepo.findById(payload.sub);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Sesión inválida o cuenta desactivada.' });
    }
    req.usuario = { ...payload, rol: usuario.rol_codigo, rol_id: usuario.rol_id };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Restringe el acceso a los roles indicados.
 * Uso: `requireRole('DOCENTE', 'ADMIN')`.
 *
 * @param {...string} roles Roles autorizados.
 * @returns {import('express').RequestHandler} Middleware que responde 401/403.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado.' });
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No autorizado para este recurso.' });
    }
    return next();
  };
}

/**
 * Firma un JWT con el algoritmo y la expiración configurados.
 *
 * @param {object} payload Datos del usuario que viajan en el token.
 * @returns {string} JWT firmado.
 */
function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.jwt.expiresIn,
  });
}

module.exports = { optionalAuth, requireAuth, requireRole, signToken, COOKIE_NAME };
