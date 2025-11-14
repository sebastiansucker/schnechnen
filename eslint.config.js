import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'dist/**',
      '.git/**'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        location: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        AbortController: 'readonly',
        Storage: 'readonly',
        // Leaderboard/Stats globals
        Chart: 'readonly',
        LeaderboardScreen: 'readonly',
        showScreen: 'readonly',
        // Test globals
        test: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        page: 'readonly',
        devices: 'readonly',
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-constant-condition': 'warn',
      'no-empty': 'warn'
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        page: 'readonly',
        devices: 'readonly',
        Storage: 'readonly'
      }
    }
  },
  {
    files: ['server.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly'
      }
    }
  }
];

