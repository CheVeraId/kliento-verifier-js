import baseConfig from '@relaycorp/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    ...baseConfig,
    {
        ignores: ['build/**', 'coverage/**'],
    },
    {
        rules: {
            'n/no-unsupported-features/node-builtins': 'off',
        },
    },
]);
