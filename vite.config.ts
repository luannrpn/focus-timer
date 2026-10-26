import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/focus-timer/' : '/',
  test: { include: ['src/**/*.test.ts'] },
})
