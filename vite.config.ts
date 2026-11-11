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
  // webcc is linked from vendor/ (file:), so Vite would serve its CommonJS bundle as source:
  // pre-bundle it like any node_modules package.
  optimizeDeps: {
    include: ['webcc'],
  },
  build: {
    // webcc (vendor, ~2.2 MB) is the only chunk this big, and only template forms load it.
    chunkSizeWarningLimit: 2400,
  },
  test: {
    environment: 'jsdom',
    // polyfills first: shared/store reads matchMedia when it is imported
    setupFiles: ['src/test/polyfills.ts', 'src/test/setup.ts'],
    css: false,
  },
})
