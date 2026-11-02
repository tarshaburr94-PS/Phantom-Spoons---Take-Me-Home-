import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'assets/aistudio/*'],
        manifest: {
          name: 'Phantom Spoons NFC - Things Have Homes',
          short_name: 'PhantomSpoons',
          description: 'ADHD-friendly NFC item and home locator with 3-hour med timer and phone home screen widgets.',
          theme_color: '#78350f',
          background_color: '#fafaf9',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/assets/aistudio/unnamed__5__11efe0ac.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/unnamed__5__11efe0ac.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Tap Med Ring',
              short_name: 'Med Ring',
              description: 'Log 3-hour medication dose via NFC ring',
              url: '/?action=tap-med-ring',
              icons: [
                {
                  src: '/assets/aistudio/an_isolated_standalone_whimsical_illustrated_die_cut_sticker_of_a_work_meds_355e0b79.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'NFC Scan Tag',
              short_name: 'Scan Tag',
              description: 'Scan item or home station NFC coin',
              url: '/?action=scan',
            },
            {
              name: 'Find Keys & Essentials',
              short_name: 'Find Keys',
              description: 'Quickly locate high-priority misplaced items',
              url: '/?action=find-essentials',
            },
            {
              name: 'Evening Reset Routine',
              short_name: 'Reset Routine',
              description: 'Check in items to their designated homes',
              url: '/?action=routine',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

