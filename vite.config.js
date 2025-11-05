import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      // CORS 설정: 실제 서비스 환경 및 콘솔 QR 테스트 환경 모두 허용
      // 동적 Origin 허용을 위해 cors 설정과 중복되지만, 명시적으로 설정
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
      // Note: Access-Control-Allow-Origin은 cors 설정에서 동적으로 처리됨
      // 실제 배포 환경에서는 백엔드 서버에서도 아래 도메인들을 Origin 허용 목록에 등록해야 함
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})


