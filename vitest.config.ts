import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    reporters: ['verbose', 'json'],
    outputFile: 'test-results.json',
    passWithNoTests: true,
  },
});
