import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 1234,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
