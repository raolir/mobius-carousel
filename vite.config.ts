import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'wordpress-plugin/dist',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        frontend: resolve(import.meta.dirname, 'src/frontend/main.tsx'),
        editor: resolve(import.meta.dirname, 'src/editor/index.tsx'),
      },
    },
  },
})
