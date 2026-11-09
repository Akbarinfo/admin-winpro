/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    // polyfills first: shared/store reads matchMedia when it is imported
    setupFiles: ['src/test/polyfills.ts', 'src/test/setup.ts'],
    css: false,
  },
})
