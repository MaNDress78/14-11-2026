'use strict';

const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const usuariosRepo = require('../repositories/usuarios.repo');
const codigosRepo = require('../repositories/codigos.repo');
const estudiantesDocentesRepo = require('../repositories/estudiantesDocentes.repo');
const emailService = require('./email.service');
const { signToken } = require('../middlewares/auth');
const config = require('../config/env');

/**
 * Genera un token de verificación de correo criptográficamente aleatorio.
 *
 * @returns {string} Token hexadecimal de 64 caracteres.
 */
function generarTokenVerificacion() {
  return randomBytes(32).toString('hex');
}

/**
 * Firma el JWT de sesión con los datos mínimos del usuario.
 *
 * @param {object} usuario Usuario con `id`, `rol`, `rol_id` y `correo_institucional`.
 * @returns {string} JWT firmado con el secreto y la expiración configurados.
 */
function signTokenLocal(usuario) {
  return signToken({
    sub: usuario.id,
    rol: usuario.rol_codigo || usuario.rol,
    rol_id: usuario.rol_id,
    correo: usuario.correo_institucional,
  });
}

/**
 * Inicia sesión con correo institucional y contraseña.
 *
 * @param {string} correo Correo institucional del usuario.
 * @param {string} password Contraseña en texto plano recibida por la API.
 * @returns {Promise<{token: string, usuario: object}>} Token JWT y usuario público.
 * @throws {Error} 401 si las credenciales son inválidas; 403 si el correo no está
 *   verificado; 400 si la cuenta no tiene contraseña local.
 */
async function login(correo, password) {
  const usuario = await usuariosRepo.findByCorreo(correo);
  if (!usuario || !usuario.activo) {
    const err = new Error('Credenciales inválidas.');
    err.status = 401;
    throw err;
  }
  if (usuario.email_verificado === false) {
    const err = new Error('Debes verificar tu correo electrónico antes de iniciar sesión');
    err.status = 403;
    throw err;
  }
  if (!usuario.password_hash) {
    const err = new Error('Esta cuenta usa SSO (Google/GitHub); no tiene contraseña local.');
    err.status = 400;
    throw err;
  }

  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    const err = new Error('Credenciales inválidas.');
    err.status = 401;
    throw err;
  }

  const token = signTokenLocal(usuario);
  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo_institucional,
      rol: usuario.rol_codigo || usuario.rol,
      rol_id: usuario.rol_id,
      email_verificado: usuario.email_verificado,
    },
  };
}

/**
 * Devuelve el perfil público del usuario autenticado.
 *
 * @param {string|number} usuarioId Identificador del usuario.
 * @returns {Promise<object>} Usuario con los campos normalizados de la API.
 * @throws {Error} 404 si el usuario no existe.
 */
async function perfil(usuarioId) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  // Normaliza el nombre de campo para que coincida con el contrato de la API
  return { ...usuario, correo: usuario.correo_institucional, rol: usuario.rol_codigo || usuario.rol };
}

/**
 * Registra una cuenta pública de estudiante y envía el correo de verificación.
 *
 * @param {object} datos Datos validados por Zod.
 * @param {string} datos.nombre Nombre completo.
 * @param {string} datos.correo Correo institucional.
 * @param {string} datos.password Contraseña en texto plano.
 * @param {string} [datos.rol] Solo se admite `ESTUDIANTE`.
 * @param {string} [datos.codigoClase] Código docente opcional para vincularse.
 * @returns {Promise<object>} Mensaje, usuario creado y `verifyUrl` solo en desarrollo.
 * @throws {Error} 409 si el correo ya existe; 403 si se intenta otro rol.
 */
async function register({ nombre, correo, password, rol, codigoClase }) {
  const correoLower = correo.toLowerCase().trim();
  const existente = await usuariosRepo.findByCorreo(correoLower);
  if (existente) {
    const err = new Error('El correo ya se encuentra registrado');
    err.status = 409;
    throw err;
  }

  // El registro público solo puede crear estudiantes. Los docentes se
  // aprovisionan con el seed o por un administrador.
  if (rol && rol !== 'ESTUDIANTE') {
    const err = new Error('El registro público solo permite cuentas de estudiante.');
    err.status = 403;
    throw err;
  }

  const rolId = await usuariosRepo.findRoleIdByCodigo('ESTUDIANTE');
  if (!rolId) {
    const err = new Error('Rol inválido');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const tokenVerificacion = generarTokenVerificacion();

  const usuario = await usuariosRepo.createUsuario({
    rolId,
    nombre: nombre.trim(),
    correoInstitucional: correoLower,
    passwordHash,
    tokenVerificacion,
  });

  if (codigoClase && codigoClase.trim() !== '') {
    const codigo = await codigosRepo.findActiveByCodigo(codigoClase.trim());
    if (codigo) {
      try {
        await estudiantesDocentesRepo.vincular({
          estudianteId: usuario.id,
          codigoId: codigo.id,
        });
      } catch (_e) {
        // El vínculo por código es best-effort durante el registro.
      }
    }
  }

  try {
    await emailService.sendVerificationEmail(usuario.correo_institucional, tokenVerificacion);
  } catch (_e) {
    // El correo es best-effort; la cuenta queda pendiente de verificación.
  }
  // El token de verificación nunca debe viajar al cliente en producción:
  // quien lo reciba podría verificar una cuenta ajena sin acceso al correo.
  const verifyUrl =
    config.nodeEnv === 'development'
      ? `${config.app.baseUrl}/auth/verify/${tokenVerificacion}`
      : null;

  return {
    ok: true,
    mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    verifyUrl,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo_institucional,
      rol_id: usuario.rol_id,
      email_verificado: usuario.email_verificado,
    },
  };
}

/**
 * Actualiza los datos editables del perfil.
 *
 * @param {string|number} usuarioId Identificador del usuario autenticado.
 * @param {{nombre?: string, telefono?: string, direccion?: string, ciudad?: string}} datos
 *   Campos opcionales ya validados por Zod.
 * @returns {Promise<object>} Perfil actualizado con los campos normalizados.
 * @throws {Error} 404 si el usuario no existe.
 */
async function updateProfile(usuarioId, datos) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  const actualizado = await usuariosRepo.updateProfile(usuarioId, {
    nombre: datos?.nombre,
    telefono: datos?.telefono ?? null,
    direccion: datos?.direccion ?? null,
    ciudad: datos?.ciudad ?? null,
  });
  return {
    ok: true,
    mensaje: 'Perfil actualizado correctamente.',
    usuario: {
      ...actualizado,
      correo: actualizado.correo_institucional,
      rol: usuario.rol_codigo,
    },
  };
}

/**
 * Vincula a un estudiante con un código de clase activo.
 *
 * @param {string|number} usuarioId Identificador del estudiante autenticado.
 * @param {string} codigo Código de clase (por ejemplo `PROG-ABC123`).
 * @returns {Promise<object>} Confirmación y datos del código vinculado.
 * @throws {Error} 404 si el usuario no existe; 403 si no es estudiante;
 *   400 si el código no existe o está inactivo; 409 si ya estaba vinculado.
 */
async function linkCode(usuarioId, codigo) {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    const err = new Error('Usuario no encontrado.');
    err.status = 404;
    throw err;
  }
  if (usuario.rol_codigo !== 'ESTUDIANTE') {
    const err = new Error('Solo los estudiantes pueden vincularse a códigos.');
    err.status = 403;
    throw err;
  }
  const codigoInfo = await codigosRepo.findActiveByCodigo(codigo);
  if (!codigoInfo) {
    const err = new Error('Código de clase inválido o inactivo.');
    err.status = 400;
    throw err;
  }
  const yaExiste = await estudiantesDocentesRepo.existeVinculo(usuarioId, codigoInfo.id);
  if (yaExiste) {
    const err = new Error('Ya te encuentras vinculado a este código.');
    err.status = 409;
    throw err;
  }
  await estudiantesDocentesRepo.vincular({ estudianteId: usuarioId, codigoId: codigoInfo.id });
  return {
    ok: true,
    mensaje: 'Te has vinculado correctamente al grupo.',
    codigo: {
      codigo: codigoInfo.codigo,
      asignatura: codigoInfo.asignatura_nombre,
    },
  };
}

/**
 * Lista los códigos de clase a los que está vinculado un estudiante.
 *
 * @param {string|number} usuarioId Identificador del estudiante.
 * @returns {Promise<{codigos: object[]}>} Códigos con datos del docente y asignatura.
 */
async function misCodigos(usuarioId) {
  const codigos = await estudiantesDocentesRepo.listarPorEstudiante(usuarioId);
  return { codigos };
}

/**
 * Verifica el correo de una cuenta a partir del token enviado por email.
 *
 * @param {string} token Token de verificación.
 * @returns {Promise<object>} Confirmación e identificador del usuario verificado.
 * @throws {Error} 400 si el token falta, es inválido o ya fue consumido.
 */
async function verifyEmail(token) {
  if (!token) {
    const err = new Error('Token de verificación requerido');
    err.status = 400;
    throw err;
  }
  const usuario = await usuariosRepo.findByVerificationToken(token);
  if (!usuario) {
    const err = new Error('Token de verificación inválido o ya utilizado');
    err.status = 400;
    throw err;
  }
  if (usuario.email_verificado) {
    return {
      ok: true,
      mensaje: 'Tu correo ya fue verificado anteriormente.',
      usuario: {
        id: usuario.id,
        correo: usuario.correo_institucional,
        rol_codigo: usuario.rol_codigo,
      },
    };
  }
  const verificado = await usuariosRepo.verifyEmail(usuario.id);
  if (!verificado) {
    const err = new Error('No fue posible verificar el correo');
    err.status = 400;
    throw err;
  }
  return {
    ok: true,
    mensaje: 'Correo verificado correctamente. Ya puedes iniciar sesión.',
    usuario: {
      id: verificado.id,
      correo: verificado.correo_institucional,
      rol_codigo: usuario.rol_codigo,
    },
  };
}

module.exports = { login, perfil, register, verifyEmail, updateProfile, linkCode, misCodigos };
