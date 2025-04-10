import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      exclude: ['src/index.ts', 'src/nodejsServer.ts'],
      include: ['src/**/*.ts'],
      thresholds: {
        100: true,
      },
    },
  },
});
