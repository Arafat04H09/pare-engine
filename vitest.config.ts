import { defineConfig } from 'vitest/config';

export const config = defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
  },
});

export default config;
