import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler rules added in eslint-plugin-react-hooks v7 (via eslint-config-next 16).
    // Existing components trip them; keep as warnings until they are refactored.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    settings: {
      next: { rootDir: ['apps/cms/'] },
    },
  },
  globalIgnores([
    '**/.next/',
    '**/out/',
    '**/build/',
    '**/next-env.d.ts',
    // Astro build output and generated types (apps/web)
    '**/dist/',
    '**/.vercel/',
    '**/.astro/',
  ]),
])

export default eslintConfig
