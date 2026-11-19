import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/app.js',
        'src/Commons/config.js',
      ],
    },
  },
});
