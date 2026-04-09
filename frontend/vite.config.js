import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['dev-platform.uz', 'localhost', '127.0.0.1'],
    hmr: {
      host: 'dev-platform.uz',
      protocol: 'wss',
      clientPort: 443,
    },
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/payme': { target: 'http://localhost:8000', changeOrigin: true },
    }
  },
  build: {
    outDir: 'dist',
  }
})
