import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR and file watching are disabled to prevent websocket connection errors and flickering during agent edits.
      hmr: false,
      watch: null,
    },
    optimizeDeps: {
      exclude: ['maplibre-gl']
    },
  };
});
