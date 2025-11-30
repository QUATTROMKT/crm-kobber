import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando você sobe versão nova
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kobber CRM',
        short_name: 'Kobber',
        description: 'Sistema de Gestão de Vendas Kobber',
        theme_color: '#1e3a8a', // Aquele Azul Escuro do Header
        background_color: '#ffffff',
        display: 'standalone', // Faz parecer app nativo (sem barra de navegador)
        orientation: 'portrait', // Trava em pé (opcional, se quiser liberar tire essa linha)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})