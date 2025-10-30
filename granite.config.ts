import { defineConfig } from '@apps-in-toss/web-framework/config';
import dotenv from 'dotenv';

// .env 파일 로드 (granite.config.ts에서 process.env 사용을 위해)
// 웹 프레임워크에서는 Vite가 자동으로 .env 파일을 처리하므로
// 코드에서는 import.meta.env.VITE_* 로 접근 가능
// 참고: @granite-js/plugin-env는 React Native 전용 (웹 프레임워크에서는 불필요)
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
  permissions: [],
  outdir: 'dist',
});
