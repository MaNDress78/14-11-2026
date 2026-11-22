import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

const IGNORADOS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.angular/**',
  '**/coverage/**',
  '**/*.min.js',
];

// Reglas de seguridad comunes. detect-object-injection se desactiva porque el
// proyecto accede a propiedades con claves controladas (req.body, metricas) y
// la regla produce falsos positivos masivos; las consultas SQL ya son
// parametrizadas. Se justifica en revision_seguridad.md.
const reglasSeguridad = {
  ...security.configs.recommended.rules,
  'security/detect-object-injection': 'off',
};

const tsRecomendado = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ['frontend/src/**/*.ts'],
}));

export default tseslint.config(
  {
    ignores: IGNORADOS,
  },
  js.configs.recommended,
  ...tsRecomendado,
  {
    files: ['backend/**/*.js', 'tests/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      security,
    },
    rules: {
      ...reglasSeguridad,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['frontend/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      security,
    },
    rules: {
      ...reglasSeguridad,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
