import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('maplibre-gl') || id.includes('terra-draw')) {
              return 'vendor-maplibre'
            }
            if (id.includes('jspdf') || id.includes('html-to-image') || id.includes('html2canvas') || id.includes('dompurify') || id.includes('purify')) {
              return 'vendor-pdf'
            }
            if (id.includes('@turf')) {
              return 'vendor-turf'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react'
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

