import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Dev proxy: forward /api/* to local Express server
      proxy: {
        '/api': { target: 'http://localhost:3000', changeOrigin: true },
      },
    },
    // Inject Supabase Edge Function URL into the built HTML
    define: {
      'window.__VORTEX_API_BASE__': JSON.stringify(
        process.env.VITE_API_URL || ''
      ),
    },
  };
});
