# 배포 전 체크리스트

## 1. 메모리 및 리소스 최적화 ✅

### 완료된 최적화 사항:
- ✅ html2canvas scale을 2 → 1.5로 감소 (메모리 사용량 44% 감소)
- ✅ Canvas 메모리 정리 추가 (사용 후 width/height를 0으로 설정)
- ✅ PNG 대신 JPEG 90% 품질 사용 (파일 크기 및 메모리 감소)
- ✅ 폭죽 효과 요소를 50개 → 30개로 감소 (메모리 40% 감소)
- ✅ 모든 타이머를 ref로 관리하여 정리 가능하도록 개선
- ✅ 컴포넌트 언마운트 시 모든 타이머 정리

### 추가 권장 사항:
- 결과 페이지에서 이전 결과 데이터 정리
- 큰 이미지 리소스는 lazy loading 고려

## 2. CORS 설정 ✅

### vite.config.js 설정 완료:
```javascript
cors: {
  origin: [
    'https://my-spinning-wheel.apps.tossmini.com',        // 실제 서비스 환경
    'https://my-spinning-wheel.private-apps.tossmini.com', // 콘솔 QR 테스트 환경
  ],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
}
```

### 주의사항:
- 실제 배포 환경(프로덕션 서버)에서는 백엔드 서버에서도 다음 도메인들을 Origin 허용 목록에 등록해야 합니다:
  - `https://my-spinning-wheel.apps.tossmini.com` (실제 서비스 환경)
  - `https://my-spinning-wheel.private-apps.tossmini.com` (콘솔 QR 테스트 환경)

## 3. ATS (App Transport Security) - HTTPS 확인 ✅

### 확인 완료:
- ✅ 외부 HTTP 요청 없음 - 모든 통신은 HTTPS 또는 Apps in Toss API 사용
- ✅ `@apps-in-toss/web-framework` 사용 - 토스 공식 API (HTTPS 보장)
- ✅ html2canvas의 `useCORS: true` 설정 - CORS 요청 시 HTTPS 필수

### 주의사항:
- 샌드박스 환경에서는 HTTP 통신이 가능하지만, 실제 서비스 환경에서는 **HTTPS만 허용**됩니다.
- HTTP 요청은 샌드박스에서만 정상 작동하며, 서비스 환경에서는 차단됩니다.
- 현재 코드에는 외부 HTTP 요청이 없으므로 문제없습니다.

## 4. iOS 서드파티 쿠키 차단 정책 확인 ✅

### 확인 완료:
- ✅ 쿠키 사용 없음 - `document.cookie` 사용 코드 없음
- ✅ 토큰 기반 인증 방식 사용 - Apps in Toss API는 토큰 기반 인증
- ✅ 외부 도메인 쿠키 의존성 없음

### 주의사항:
- iOS/iPadOS 13.4 이상에서는 서드파티 쿠키가 완전히 차단됩니다.
- 앱인토스 도메인이 아닌 파트너사 도메인에서 쿠키 기반 로그인을 구현하면 정상 동작하지 않습니다.
- 현재 코드는 쿠키를 사용하지 않으므로 문제없습니다.

## 5. 추가 확인 사항

### 성능 최적화:
- [ ] 실제 토스앱 환경에서 메모리 프로파일링 테스트 권장
- [ ] 결과 페이지에서 불필요한 리렌더링 최소화
- [ ] 이미지 리소스 최적화 (WebP 포맷 고려)

### 테스트 환경:
- [ ] 샌드박스 환경에서 테스트 완료
- [ ] 실제 서비스 환경에서 테스트 완료
- [ ] iOS 및 Android 양쪽 환경 테스트 완료

### 에러 처리:
- [ ] 네트워크 오류 처리
- [ ] 메모리 부족 시 대체 처리
- [ ] 사용자에게 명확한 에러 메시지 제공
