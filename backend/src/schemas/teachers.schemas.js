'use strict';

const { z } = require('zod');
const { idSchema } = require('../models/entidades');

const detalleAlumnoParamsSchema = z.object({
  estudianteId: z.string().uuid(),
  codigoId: idSchema,
});

const codigoIdParamsSchema = z.object({ codigoId: idSchema });

const crearCodigoBodySchema = z
  .object({
    asignaturaId: idSchema.nullable().optional(),
  })
  .strict('La solicitud contiene campos no permitidos');

const crearCodigoSchema = { body: crearCodigoBodySchema };

module.exports = {
  detalleAlumnoParamsSchema,
  codigoIdParamsSchema,
  crearCodigoSchema,
  crearCodigoBodySchema,
};
