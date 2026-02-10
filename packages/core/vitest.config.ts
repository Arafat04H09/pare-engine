import { defineConfig } from 'vitest/config';

export const config = defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});

export default config;
