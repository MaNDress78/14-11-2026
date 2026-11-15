'use strict';

const { z } = require('zod');

const emailInstitucionalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerBodySchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Formato de correo inválido')
    .regex(emailInstitucionalRegex, 'Debe ser un correo válido')
    .max(120, 'El correo no puede exceder 120 caracteres')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  // El registro público solo crea estudiantes. Los docentes se aprovisionan
  // con el seed o por un administrador para evitar escalada de privilegios.
  rol: z
    .enum(['ESTUDIANTE'], {
      invalid_type_error: 'Rol inválido. El registro público solo admite ESTUDIANTE.',
    })
    .default('ESTUDIANTE'),
  codigoClase: z
    .string()
    .max(20, 'El código de clase no puede exceder 20 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
});

const loginBodySchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .email('Formato de correo inválido')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'La contraseña es obligatoria' }),
});

const verifyParamsSchema = z.object({
  token: z.string({ required_error: 'Token requerido' }).min(10, 'Token inválido'),
});

const updateProfileBodySchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).optional(),
    telefono: z
      .string()
      .trim()
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .regex(/^[0-9+()\-\s]*$/, 'El teléfono contiene caracteres inválidos')
      .optional(),
    direccion: z.string().trim().max(150, 'La dirección no puede exceder 150 caracteres').optional(),
    ciudad: z.string().trim().max(80, 'La ciudad no puede exceder 80 caracteres').optional(),
  })
  .strict('El perfil contiene campos no permitidos');

const linkCodeBodySchema = z.object({
  codigo: z
    .string({ required_error: 'El código es obligatorio' })
    .trim()
    .min(3, 'Código inválido')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Za-z]{2,12}-[A-Za-z0-9]{4,12}$/, 'Formato de código inválido'),
});

const registerSchema = { body: registerBodySchema };
const loginSchema = { body: loginBodySchema };
const verifyTokenSchema = { params: verifyParamsSchema };
const updateProfileSchema = { body: updateProfileBodySchema };
const linkCodeSchema = { body: linkCodeBodySchema };

module.exports = {
  registerSchema,
  loginSchema,
  verifyTokenSchema,
  updateProfileSchema,
  linkCodeSchema,
  registerBodySchema,
  loginBodySchema,
  verifyParamsSchema,
  updateProfileBodySchema,
  linkCodeBodySchema,
};
