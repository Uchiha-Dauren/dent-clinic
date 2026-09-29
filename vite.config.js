import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { bookingApi } from './server/vite-plugin.js';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss(), bookingApi()],
  server: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
  build: { outDir: 'dist/client', chunkSizeWarningLimit: 650 },
  test: { environment: 'node' },
});
