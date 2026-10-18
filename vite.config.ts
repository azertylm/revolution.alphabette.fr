import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // La base commune est compilée comme du code du projet.
  optimizeDeps: {
    exclude: ['@alphabette/shell'],
  },
});
