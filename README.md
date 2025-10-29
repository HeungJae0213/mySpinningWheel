# 돌림판 (Spinning Wheel)

토스 미니앱용 돌림판 프로젝트입니다.

## 📋 개요

React + Vite 기반의 돌림판 앱으로, 사용자가 항목을 설정하고 돌림판을 돌려 무작위로 선택할 수 있습니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값들을 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일에서 다음 값을 설정하세요:

- `VITE_APP_HOST`: 모바일 환경에서 접속할 PC의 로컬 IP 주소
- `VITE_APP_ICON`: 앱 아이콘 이미지의 공개 URL
- `VITE_REWARDED_AD_ID`: 리워드 광고 ID

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

## 📁 프로젝트 구조

```
Android_Spinning_Wheel2/
├── src/
│   ├── components/      # 공용 컴포넌트
│   ├── config/         # 설정 파일 (광고 등)
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── WelcomePage.jsx
│   │   ├── SettingPage.jsx
│   │   ├── LoadingPage.jsx
│   │   └── ResultPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── public/             # 정적 파일
├── granite.config.ts   # Granite 설정
├── vite.config.js      # Vite 설정
└── .env               # 환경 변수 (Git에 올라가지 않음)
```

## 🔧 기술 스택

- React 18
- Vite
- React Router (HashRouter)
- @apps-in-toss/web-framework
- html2canvas

## 📝 라이센스

Private

