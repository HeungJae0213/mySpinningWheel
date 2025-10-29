// 광고 설정
// 테스트용 광고 ID - 개발 테스트 시 반드시 사용해야 함
// 실제 광고 ID로 테스트하면 불이익을 받을 수 있음

export const AD_CONFIG = {
  // 테스트용 광고 ID (환경 변수에서 가져오거나 기본값 사용)
  TEST_REWARDED_AD_ID: import.meta.env.VITE_REWARDED_AD_ID || 'ait-ad-test-rewarded-id', // 리워드 광고
  
  // 광고 설정
  AD_DURATION: 3000, // 3초 광고 시뮬레이션
  MAX_LOAD_ATTEMPTS: 3, // 최대 로드 재시도 횟수
  LOAD_RETRY_DELAY: 1000, // 재시도 대기 시간 (1초)
  REWARD_SPINS: 5, // 광고 시청 시 부여할 스핀 횟수
};

// 환경별 광고 사용 여부
export const isAdSupported = () => {
  // 실제 토스 앱 환경에서만 광고 활성화
  // 로컬 개발 환경에서는 시뮬레이션만 사용
  const hostname = window.location.hostname;
  return (
    hostname.includes('tossmini.com') ||
    hostname.includes('toss.im')
  );
};

// 실제 광고 또는 시뮬레이션 여부
export const shouldUseRealAd = () => {
  return isAdSupported();
};
