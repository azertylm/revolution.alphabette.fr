import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // La base commune est compilée comme du code du projet.
  optimizeDeps: {
    exclude: ['@alphabette/shell'],
  },
});
