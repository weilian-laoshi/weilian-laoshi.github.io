import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Vital for GitHub Pages deployment under any repository subpath
  server: {
    proxy: {
      '/api/tts': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/translate_tts'),
        headers: {
          Referer: '',
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '微联老师 · 莱特纳英语学习 (Weilian Laoshi Leitner English)',
        short_name: '微联英语',
        description: '专为母语为中文者打造的极简主义莱特纳间隔重复记忆英语卡片系统。',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,ttf,eot}'],
      },
    }),
  ],
});
