import { defineConfig } from '@apps-in-toss/web-framework/config';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

export default defineConfig({
  appName: 'my-spinning-wheel',
  brand: {
    displayName: '돌림판', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: process.env.VITE_APP_ICON || '',
    bridgeColorMode: 'basic',
  },
  web: {
    host: process.env.VITE_APP_HOST || '192.168.0.10', // 모바일 환경에서 접속하려면 PC의 로컬 IP 주소 사용
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  cors: {
    allowedOrigins: [
      'https://my-spinning-wheel.apps.tossmini.com',
      'https://my-spinning-wheel.private-apps.tossmini.com',
    ],
  },
  permissions: [],
  outdir: 'dist',
});
