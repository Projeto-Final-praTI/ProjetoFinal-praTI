import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Vídeos de fundo são grandes e ficam no OneDrive, que às vezes trava o
    // arquivo (EBUSY) enquanto o Vite tenta observá-lo. Não precisamos de HMR
    // em arquivos estáticos de `public/`, então ignoramos a pasta.
    watch: {
      ignored: ['**/public/video/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
