import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@alphabette/shell/style.css': path.resolve('src/shell/shell.css'),
      '@alphabette/shell': path.resolve('src/shell/index.ts'),
    },
  },
  // La base commune est compilée comme du code du projet.
  optimizeDeps: {
    exclude: ['@alphabette/shell'],
  },
  server: {
    port: 5173,
    // En développement, le registre des applications (et le reste de l'API)
    // vit dans le hub local : on le relaie pour éviter tout problème de CORS.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
