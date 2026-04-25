import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/components/**/*.test.tsx',
      'tests/mocks/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      exclude: [
        'src/mocks/**',
        'src/copy.ts',
        '.storybook/**',
        '**/*.stories.tsx',
        'tests/**',
        'scripts/**',
        'src/app/**',
        'next.config.mjs',
        'postcss.config.js',
        'tailwind.config.ts',
        'vitest*.config.ts',
        'playwright.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
