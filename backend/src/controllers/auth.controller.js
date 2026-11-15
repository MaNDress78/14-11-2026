'use strict';

const service = require('../services/auth.service');
const { COOKIE_NAME } = require('../middlewares/auth');
const config = require('../config/env');

/**
 * Inicia sesión y deja el JWT en una cookie httpOnly.
 * @param {import('express').Request} req Petición con `correo` y `password`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const { token, usuario } = await service.login(correo, password);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    });
    res.json({ usuario, token });
  } catch (err) {
    next(err);
  }
}

/**
 * Devuelve el perfil del usuario autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function me(req, res, next) {
  try {
    const usuario = await service.perfil(req.usuario.sub);
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina la cookie de sesión.
 * @param {import('express').Request} _req Petición (no se usa).
 * @param {import('express').Response} res Respuesta HTTP.
 * @returns {void}
 */
function logout(_req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

/**
 * Registra una cuenta pública de estudiante.
 * @param {import('express').Request} req Petición con los datos validados.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function register(req, res, next) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Verifica el correo de una cuenta con el token recibido.
 * @param {import('express').Request} req Petición con `req.params.token`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function verify(req, res, next) {
  try {
    const { token } = req.params;
    const result = await service.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Actualiza el perfil del usuario autenticado.
 * @param {import('express').Request} req Petición autenticada y validada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function updateMe(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const resultado = await service.updateProfile(usuarioId, req.body || {});
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/**
 * Vincula al estudiante autenticado con un código de clase.
 * @param {import('express').Request} req Petición con `req.body.codigo`.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function vincularCodigo(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const { codigo } = req.body || {};
    const resultado = await service.linkCode(usuarioId, codigo);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/**
 * Lista los códigos de clase vinculados al estudiante autenticado.
 * @param {import('express').Request} req Petición autenticada.
 * @param {import('express').Response} res Respuesta HTTP.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {Promise<void>}
 */
async function listarMisCodigos(req, res, next) {
  try {
    const usuarioId = req.usuario.sub;
    const resultado = await service.misCodigos(usuarioId);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, logout, register, verify, updateMe, vincularCodigo, listarMisCodigos };
