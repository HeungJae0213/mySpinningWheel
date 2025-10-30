import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // CORS 설정 (로컬 개발 시 토스 미니앱 도메인에서 접근 허용)
    cors: {
      origin: [
        'https://my-spinning-wheel.apps.tossmini.com',
        'https://my-spinning-wheel.private-apps.tossmini.com',
      ],
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
      credentials: true,
      preflightContinue: false,
    },
    headers: {
      'Access-Control-Allow-Origin': 'https://my-spinning-wheel.apps.tossmini.com',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})


