import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function renameAdminHtmlToIndex(): Plugin {
  return {
    name: 'rename-admin-html-to-index',
    enforce: 'post',
    generateBundle(_options, bundle) {
      if (bundle['admin.html']) {
        bundle['admin.html'].fileName = 'index.html';
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), renameAdminHtmlToIndex()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist-admin',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'admin.html'),
      },
    },
  };
});
