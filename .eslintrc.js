module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.js'],
      extends: 'eslint:recommended',
      parserOptions: { ecmaVersion: 2018 },
      env: { node: true },
    },
    {
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'import'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended',
      ],
      parserOptions: {
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      rules: {
        'require-await': 'error',
        'prefer-const': 'error',
        'no-unused-expressions': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-floating-promises': ['error'],
        quotes: [
          'error',
          'single',
          {
            avoidEscape: true,
          },
        ],
      },    
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: [
        'test/**/*.ts',
      ],
      plugins: ['@typescript-eslint', 'import'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.test.json'],
      },
      rules: {
        'prefer-const': 'error',
        'require-await': 'error',
        '@typescript-eslint/no-floating-promises': ['error'],
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ]
}