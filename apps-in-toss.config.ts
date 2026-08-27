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
    // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    primaryColor: '#3182F6'
  },

  permissions: [],
  webBundleDir: 'dist'
});
