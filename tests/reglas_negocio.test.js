'use strict';

process.env.JWT_SECRET = 'pruebas_semana_7_no_produccion_000000';

const assert = require('node:assert/strict');
const test = require('node:test');

const { registerBodySchema } = require('../backend/src/schemas/auth.schemas');
const { cumpleCondicion } = require('../backend/src/services/ejercicios.service');
const { calcularRacha, calcularRachaMaxima, toISODate } = require('../backend/src/utils/racha');

const METRICAS_BASE = {
  puntos_acumulados: 100,
  niveles_completados: ['DIFICIL'],
  temas_perfectos: 1,
  temas_explorados: 5,
  aciertos_primer_intento: 10,
  intentos_totales: 30,
  ejercicios_dificiles: 5,
  racha_dias: 7,
  aciertos_totales: 10,
  ejercicios_distintos_correctos: 15,
};

function metricas(cambios = {}) {
  return { ...METRICAS_BASE, ...cambios };
}

function diaRelativo(desplazamiento) {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + desplazamiento);
  return fecha.toISOString().slice(0, 10);
}

function datosSinteticos() {
  return {
    estudiante: "Ángela María Ñuñez O'Connor",
    correo: 'angela.nunez@ejemplo.edu.co',
    telefono: '+57 300 000 0001',
    textoVacio: '',
    cero: 0,
    diasActivos: [diaRelativo(0), diaRelativo(-1), diaRelativo(-2)],
  };
}

function validarRegistro(datos) {
  const resultado = registerBodySchema.safeParse(datos);
  if (resultado.success) return { success: true, data: resultado.data };
  return {
    success: false,
    issues: resultado.error.issues.map(({ path, code, message }) => ({
      path: path.join('.'),
      code,
      message,
    })),
  };
}

function issue(path, code, message) {
  return { path, code, message };
}

const casosIso = [
  ['ultimo-instante-del-dia', '2026-11-22T23:59:59.999Z', '2026-11-22'], // límite inferior del día
  ['primer-instante-dia-siguiente', '2026-11-23T00:00:00.000Z', '2026-11-23'], // límite del día siguiente
  ['zona-horaria-convierte-a-utc', '2026-11-22T23:30:00-05:00', '2026-11-23'], // partición con offset
  ['primer-dia-del-anio', '2026-01-01T12:00:00Z', '2026-01-01'], // límite de año
  ['ultimo-dia-del-anio', '2026-12-31T12:00:00Z', '2026-12-31'], // límite de año
];

for (const [id, entrada, esperado] of casosIso) {
  test(`toISODate devuelve fecha UTC · ${id}`, () => {
    assert.strictEqual(toISODate(entrada), esperado);
  });
}

const casosIsoInvalidos = [
  ['particion-invalida-texto', 'no-es-fecha'], // partición inválida
  ['texto-vacio-invalido', ''], // texto vacío
];

for (const [id, entrada] of casosIsoInvalidos) {
  test(`toISODate rechaza fecha inválida · ${id}`, () => {
    assert.throws(() => toISODate(entrada), {
      name: 'RangeError',
      message: 'Invalid time value',
    });
  });
}

const casosRacha = [
  ['sin-actividad', [], 0], // partición vacía
  ['solo-hoy', [0], 1], // límite: actividad hoy
  ['ayer-permite-empezar', [-1], 1], // límite: actividad ayer
  ['hueco-antes-de-ayer', [-2], 0], // límite: primer día fuera
  ['tres-dias-hasta-ayer', [-1, -2, -3], 3], // partición válida
  ['tres-dias-incluido-hoy', [0, -1, -2], 3], // partición válida
  ['duplicados-no-cuentan-dos-veces', [0, 0, -1], 2], // día repetido
  ['salto-de-un-dia-corta-la-racha', [0, -2], 1], // límite con hueco
  ['solo-fecha-futura-no-inicia-racha', [1], 0], // partición inválida
];

for (const [id, desplazamientos, esperado] of casosRacha) {
  test(`calcularRacha · ${id}`, () => {
    const dias = desplazamientos.map((desplazamiento) => diaRelativo(desplazamiento));
    assert.strictEqual(calcularRacha(dias), esperado);
  });
}

test('calcularRacha con datos sintéticos', () => {
  assert.strictEqual(calcularRacha(datosSinteticos().diasActivos), 3);
});

const casosRachaMaxima = [
  ['sin-actividad', [], 0], // límite inferior
  ['un-solo-dia', [-5], 1], // partición de un día
  ['tres-consecutivos', [-5, -4, -3], 3], // partición válida
  ['entrada-desordenada-se-ordena', [-1, -3, -2], 3], // orden arbitrario
  ['duplicados-se-deduplican', [-1, -1, -2], 2], // días repetidos
  ['dias-aislados', [-5, -3, -1], 1], // partición sin continuidad
  ['serie-termina-hoy', [0, -1, -2], 3], // límite superior
];

for (const [id, desplazamientos, esperado] of casosRachaMaxima) {
  test(`calcularRachaMaxima · ${id}`, () => {
    const dias = desplazamientos.map((desplazamiento) => diaRelativo(desplazamiento));
    assert.strictEqual(calcularRachaMaxima(dias), esperado);
  });
}

const casosCondicion = [
  ['puntos-igual-umbral', { tipo: 'puntos_acumulados', valor: 100 }, metricas(), '', true], // límite >=
  ['puntos-uno-debajo', { tipo: 'puntos_acumulados', valor: 100 }, metricas({ puntos_acumulados: 99 }), '', false], // justo debajo
  ['puntos-uno-arriba', { tipo: 'puntos_acumulados', valor: 100 }, metricas({ puntos_acumulados: 101 }), '', true], // justo arriba
  ['valor-texto-numerico', { tipo: 'puntos_acumulados', valor: '100' }, metricas(), '', true], // conversión de valor
  ['valor-omitido-por-defecto', { tipo: 'puntos_acumulados' }, metricas(), '', true], // valor por defecto
  ['nivel-insensible-a-mayusculas', { tipo: 'dificultad_completada', nivel: 'dificil' }, metricas(), '', true], // minúsculas válidas
  ['nivel-no-completado', { tipo: 'dificultad_completada', nivel: 'MEDIO' }, metricas(), '', false], // nivel ajeno
  ['tema-perfecto-ignora-valor', { tipo: 'tema_perfecto', valor: 0 }, metricas(), '', true], // valor irrelevante
  ['sin-tema-perfecto', { tipo: 'tema_perfecto' }, metricas({ temas_perfectos: 0 }), '', false], // límite inferior
  ['temas-igual-umbral', { tipo: 'temas_explorados', valor: 5 }, metricas(), '', true], // límite >=
  ['temas-debajo-umbral', { tipo: 'temas_explorados', valor: 6 }, metricas(), '', false], // justo debajo
  ['primer-intento-igual', { tipo: 'aciertos_primer_intento', valor: 10 }, metricas(), '', true], // límite >=
  ['primer-intento-debajo', { tipo: 'aciertos_primer_intento', valor: 11 }, metricas(), '', false], // justo debajo
  ['intentos-igual', { tipo: 'intentos_totales', valor: 30 }, metricas(), '', true], // límite >=
  ['intentos-debajo', { tipo: 'intentos_totales', valor: 31 }, metricas(), '', false], // justo debajo
  ['dificiles-igual', { tipo: 'ejercicios_dificiles', valor: 5 }, metricas(), '', true], // límite >=
  ['dificiles-debajo', { tipo: 'ejercicios_dificiles', valor: 6 }, metricas(), '', false], // justo debajo
  ['racha-igual', { tipo: 'racha_dias', valor: 7 }, metricas(), '', true], // límite >=
  ['racha-debajo', { tipo: 'racha_dias', valor: 8 }, metricas(), '', false], // justo debajo
  ['aciertos-totales-igual', { tipo: 'aciertos_totales', valor: 10 }, metricas(), '', true], // límite >=
  ['aciertos-totales-debajo', { tipo: 'aciertos_totales', valor: 11 }, metricas(), '', false], // justo debajo
  ['distintos-igual', { tipo: 'ejercicios_distintos_correctos', valor: 15 }, metricas(), '', true], // límite >=
  ['distintos-debajo', { tipo: 'ejercicios_distintos_correctos', valor: 16 }, metricas(), '', false], // justo debajo
  ['tipo-desconocido', { tipo: 'condicion_inexistente', valor: 1 }, metricas(), '', false], // partición inválida
  ['condicion-vacia', {}, metricas(), '', false], // objeto sin tipo
  ['condicion-nula', null, metricas(), '', false], // entrada nula
  ['condicion-no-objeto', 'texto', metricas(), '', false], // tipo primitivo
  ['heredado-maestro-distintos', { aciertos_min: 12 }, metricas(), 'MAESTRO_LOGICA', true], // legado con código
  ['heredado-no-maestro-totales', { aciertos_min: 12 }, metricas(), '', false], // legado sin código
  ['heredado-no-maestro-igual', { aciertos_min: 10 }, metricas(), '', true], // legado en el borde
  ['heredado-racha-igual', { racha_dias: 7 }, metricas(), '', true], // legado de racha en el borde
  ['heredado-racha-debajo', { racha_dias: 8 }, metricas(), '', false], // legado de racha debajo
];

for (const [id, condicion, metricasUsadas, codigo, esperado] of casosCondicion) {
  test(`cumpleCondicion · ${id}`, () => {
    assert.strictEqual(cumpleCondicion(condicion, metricasUsadas, codigo), esperado);
  });
}

test('cumpleCondicion ignora metadatos sintéticos', () => {
  const datos = datosSinteticos();
  const conMetadata = metricas({
    nombre: datos.estudiante,
    telefono: datos.telefono,
    textoVacio: datos.textoVacio,
  });
  assert.strictEqual(cumpleCondicion({ tipo: 'puntos_acumulados', valor: 100 }, conMetadata), true);
  const enCero = metricas({ puntos_acumulados: datos.cero });
  assert.strictEqual(cumpleCondicion({ tipo: 'puntos_acumulados', valor: 1 }, enCero), false);
});

const casosRegistroValidos = [
  [
    'limite-inferior-nombre-y-password',
    { nombre: 'Ño', correo: 'a@b.co', password: '12345678' },
    { nombre: 'Ño', correo: 'a@b.co', password: '12345678', rol: 'ESTUDIANTE' },
  ], // límite inferior de nombre y contraseña
  [
    'correo-se-normaliza-y-codigo-de-20-caracteres',
    {
      nombre: 'María José',
      correo: 'MARIA.JOSE@EJEMPLO.EDU.CO',
      password: 'ClaveLarga123',
      rol: 'ESTUDIANTE',
      codigoClase: 'PROG-ABC123ABC123ABC',
    },
    {
      nombre: 'María José',
      correo: 'maria.jose@ejemplo.edu.co',
      password: 'ClaveLarga123',
      rol: 'ESTUDIANTE',
      codigoClase: 'PROG-ABC123ABC123ABC',
    },
  ], // correo normalizado y código de 20 caracteres
];

for (const [id, datos, esperado] of casosRegistroValidos) {
  test(`registro válido · ${id}`, () => {
    assert.deepStrictEqual(validarRegistro(datos), { success: true, data: esperado });
  });
}

test('registro válido con datos sintéticos', () => {
  const datos = datosSinteticos();
  const entrada = {
    nombre: ` ${datos.estudiante} `,
    correo: datos.correo.toUpperCase(),
    password: 'ClaveLarga123',
    codigoClase: datos.textoVacio,
    telefono: datos.telefono,
  };
  const esperado = {
    nombre: datos.estudiante,
    correo: datos.correo,
    password: 'ClaveLarga123',
    rol: 'ESTUDIANTE',
    codigoClase: '',
  };
  assert.deepStrictEqual(validarRegistro(entrada), { success: true, data: esperado });
});

const casosRegistroInvalidos = [
  [
    'nombre-de-un-caracter',
    { nombre: 'A', correo: 'a@b.co', password: '12345678' },
    [issue('nombre', 'too_small', 'El nombre debe tener al menos 2 caracteres')],
  ], // nombre de un carácter
  [
    'nombre-vacio',
    { nombre: '', correo: 'a@b.co', password: '12345678' },
    [issue('nombre', 'too_small', 'El nombre debe tener al menos 2 caracteres')],
  ], // texto vacío
  [
    'password-de-7-caracteres',
    { nombre: 'Ño', correo: 'a@b.co', password: '1234567' },
    [issue('password', 'too_small', 'La contraseña debe tener al menos 8 caracteres')],
  ], // contraseña de 7 caracteres
  [
    'correo-con-espacio-final',
    { nombre: 'Ño', correo: 'a@b.co ', password: '12345678' },
    [
      issue('correo', 'invalid_format', 'Formato de correo inválido'),
      issue('correo', 'invalid_format', 'Debe ser un correo válido'),
    ],
  ], // correo con espacio final
  [
    'rol-docente-rechazado',
    { nombre: 'Ño', correo: 'a@b.co', password: '12345678', rol: 'DOCENTE' },
    [issue('rol', 'invalid_value', 'Invalid input: expected "ESTUDIANTE"')],
  ], // rol docente rechazado
  [
    'codigo-de-21-caracteres',
    {
      nombre: 'Ño',
      correo: 'a@b.co',
      password: '12345678',
      codigoClase: 'PROG-ABC123ABC123ABCD',
    },
    [issue('codigoClase', 'too_big', 'El código de clase no puede exceder 20 caracteres')],
  ], // código de 21 caracteres
];

for (const [id, datos, esperado] of casosRegistroInvalidos) {
  test(`registro inválido · ${id}`, () => {
    assert.deepStrictEqual(validarRegistro(datos), { success: false, issues: esperado });
  });
}
