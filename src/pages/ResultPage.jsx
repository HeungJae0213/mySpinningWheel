import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import './ResultPage.css';
import { AD_CONFIG } from '../config/adConfig';
import { GoogleAdMob, saveBase64Data } from '@apps-in-toss/web-framework';

export default function ResultPage({ items, onBack }) {
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [canSave, setCanSave] = useState(false);
  const [saveToast, setSaveToast] = useState({ show: false, message: '' });
  
  // 광고 및 스핀 횟수 관리
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adWatching, setAdWatching] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  
  // 광고 상태 (ProfilePage.tsx 스타일 - 단순화)
  const [adLoaded, setAdLoaded] = useState(false);
  const [adShowing, setAdShowing] = useState(false);
  const [adType, setAdType] = useState('rewarded'); // 'rewarded' | 'interstitial'
  const [adLoading, setAdLoading] = useState(false); // 모달 열릴 때는 false, 광고 보기 버튼 클릭 시 true로 변경
  
  // Refs (ProfilePage.tsx 스타일)
  const cleanupRef = useRef(undefined);
  const rewardEarnedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(undefined);
  const adWaitTimeoutRef = useRef(undefined); // 광고 로드 대기 타임아웃
  // const spinAdTimeoutRef = useRef(undefined); // 스핀 시 광고 대기 타임아웃(3초) (원복: 사용 안 함)
  const adSkippedRef = useRef(false); // 광고 건너뛰기 여부
  const loadAdRef = useRef(undefined); // loadAd 안전 호출용 ref

  /**
   * 광고 표시 함수 (위로 올려 훅들이 참조 전 초기화)
   */
  /* moved above */ const __unused_showAd = useCallback(() => {
    try {
      // 광고 타입에 따라 다른 ID 사용
      const adGroupId = adType === 'rewarded' ? AD_CONFIG.TEST_REWARDED_AD_ID : AD_CONFIG.TEST_INTERSTITIAL_AD_ID;
      const adTypeName = adType === 'rewarded' ? '보상형' : '전면형';

      console.log(`✅ [${adTypeName}] 광고 표시 시작`);
      console.log('📞 GoogleAdMob.showAppsInTossAdMob 호출:', {
        adGroupId,
        adType: adType,
        adLoaded: adLoaded
      });
      
      // 네이티브 광고 표시 준비 - 상태 먼저 업데이트
      setAdShowing(true);
      setAdWatching(true);
      rewardEarnedRef.current = false;
      adSkippedRef.current = false; // 건너뛰기 플래그 초기화
      
      // 모달을 숨기지 않고 유지 (네이티브 광고가 위에 오버레이됨)
      // 단, adShowing이 true가 되면 모달은 조건부 렌더링으로 숨김
      
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId }, // ES6 shorthand 사용
        onEvent: (event) => {
          switch (event.type) {
            case 'requested':
              console.log(`✅ [${adTypeName}] 광고 표시 요청 완료`);
              break;

            case 'show':
              console.log(`✅ [${adTypeName}] 광고 컨텐츠 표시 시작 - 네이티브 레이어에 표시됨`);
              break;

            case 'impression':
              console.log(`✅ [${adTypeName}] 광고 노출 완료`);
              break;

            case 'clicked':
              console.log(`✅ [${adTypeName}] 광고 클릭됨`);
              break;

            case 'userEarnedReward':
              // 보상형 광고만 해당
              console.log('🎁 보상 획득!', event.data);
              rewardEarnedRef.current = true;
              break;

            case 'dismissed':
              console.log(`[${adTypeName}] 광고 닫힘`);

              if (adType === 'rewarded') {
                // 보상형: 보상 획득 여부 확인
                if (rewardEarnedRef.current) {
                  console.log('✅ 보상형 광고 완료 - 스핀 횟수 지급');
                  setRemainingSpins(prev => prev + AD_CONFIG.REWARD_SPINS);
                  setSaveToast({ show: true, message: `🎁 ${AD_CONFIG.REWARD_SPINS}번의 기회를 획득했습니다!` });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                } else {
                  console.warn('⚠️ 보상형 광고 중도 종료 - 보상 지급하지 않음');
                  setSaveToast({ show: true, message: '광고를 끝까지 시청해주세요' });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                }
              } else {
                // 전면형: dismissed 시 보상 지급 (단, 중간에 건너뛰면 지급 안 함)
                if (adSkippedRef.current) {
                  console.warn('⚠️ 전면형 광고 건너뛰기 - 보상 지급하지 않음');
                } else {
                  console.log('✅ 전면형 광고 닫힘 - 스핀 횟수 지급');
                  setRemainingSpins(prev => prev + AD_CONFIG.REWARD_SPINS);
                  setSaveToast({ show: true, message: `🎁 ${AD_CONFIG.REWARD_SPINS}번의 기회를 획득했습니다!` });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                }
              }

              // 상태 정리 및 다음 광고 로드
              setAdShowing(false);
              setAdWatching(false);
              setShowAdModal(false);
              setAdProgress(0);
              loadAdRef.current?.('rewarded'); // 다음엔 보상형부터 다시 시도
              break;

            case 'failedToShow':
              console.warn(`⚠️ [${adTypeName}] 광고 표시 실패 - 광고 없이 진행:`, event.data);
              setAdShowing(false);
              setAdWatching(false);
              setShowAdModal(false);
              loadAdRef.current?.('rewarded');
              break;
          }
        },
        onError: (showError) => {
          console.error(`❌ [${adTypeName}] 광고 표시 에러:`, showError);
          setAdShowing(false);
          setAdWatching(false);
          setShowAdModal(false);
          console.warn('⚠️ 광고 표시 에러 발생 - 광고 없이 진행');
          loadAdRef.current?.('rewarded');
        }
      });
    } catch (error) {
      console.error('❌ 광고 표시 중 예외 발생:', error);
      setAdShowing(false);
      setAdWatching(false);
      setShowAdModal(false);
      loadAdRef.current?.('rewarded');
    }
  }, [adType, adLoaded]);

  // count를 반영하여 섹션 생성
  const wheelSections = useMemo(() => {
    const sections = [];
    items.forEach(item => {
      const count = parseInt(item.count) || 1;
      for (let i = 0; i < count; i++) {
        sections.push({
          text: item.text,
          color: item.color,
          originalItem: item
        });
      }
    });
    return sections;
  }, [items]);
  
  const totalSections = wheelSections.length;

  /**
   * 타임아웃 및 cleanup 정리 유틸리티
   */
  const clearAllTimers = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    if (adWaitTimeoutRef.current) {
      clearTimeout(adWaitTimeoutRef.current);
      adWaitTimeoutRef.current = undefined;
    }
  };

  /**
   * 광고 실패 시 위로 1회 제공
   */
  const grantConsolationSpin = (message) => {
    setRemainingSpins(prev => prev + 1);
    if (message) {
      setSaveToast({ show: true, message });
      setTimeout(() => {
        setSaveToast({ show: false, message: '' });
      }, 2000);
    }
  };

  // 원복: 스핀 시 광고 흐름을 자동 진행하지 않음

  /**
   * 광고를 로드합니다. (ProfilePage.tsx 스타일)
   * @param type 로드할 광고 타입 ('rewarded' 또는 'interstitial')
   * 
   * 동작 방식:
   * 1. 광고 지원 여부 확인
   * 2. 광고 로드 시도
   * 3. 실패 시 재시도 (최대 3회)
   * 4. 보상형 실패 시 전면형으로 전환
   */
  const loadAd = useCallback((type) => {
    try {
      const currentRetry = retryCountRef.current;
      const adGroupId = type === 'rewarded' ? AD_CONFIG.TEST_REWARDED_AD_ID : AD_CONFIG.TEST_INTERSTITIAL_AD_ID;
      const adTypeName = type === 'rewarded' ? '보상형' : '전면형';

      console.log(`\n📥 [${adTypeName}] 광고 로드 시도 ${currentRetry + 1}회`);
      console.log(`🔑 사용할 광고 ID: ${adGroupId}`);
      console.log(`📦 AD_CONFIG.TEST_REWARDED_AD_ID: ${AD_CONFIG.TEST_REWARDED_AD_ID}`);
      console.log(`📦 AD_CONFIG.TEST_INTERSTITIAL_AD_ID: ${AD_CONFIG.TEST_INTERSTITIAL_AD_ID}`);

      // 광고 기능 지원 여부 확인
      const isSupported = GoogleAdMob.loadAppsInTossAdMob.isSupported?.();
      console.log('🔍 loadAppsInTossAdMob.isSupported():', isSupported);
      console.log('🔍 GoogleAdMob:', GoogleAdMob);
      console.log('🔍 GoogleAdMob.loadAppsInTossAdMob:', GoogleAdMob.loadAppsInTossAdMob);

      if (isSupported !== true) {
        console.warn(`❌ ${adTypeName} 광고 기능 미지원. isSupported:`, isSupported);
        setAdLoading(false);
        if (type === 'rewarded') {
          console.log('🔄 전면형 광고로 전환 (미지원)');
          setAdType('interstitial');
          loadAd('interstitial');
          } else {
            if (showAdModal) setShowAdModal(false);
            grantConsolationSpin('광고 기능이 지원되지 않아요. 1회 기회를 드립니다.');
          }
        return;
      }

      // 기존 cleanup 함수 실행
      cleanupRef.current?.();
      cleanupRef.current = undefined;

      setAdLoaded(false);
      setAdLoading(true); // with-rewarded-ad 스타일
      console.log(`🔄 ${adTypeName} 광고 로드 시작... (adGroupId: ${adGroupId})`);

      // 광고 로드 (with-rewarded-ad 스타일)
      console.log('📞 GoogleAdMob.loadAppsInTossAdMob 호출:', {
        adGroupId,
        type,
        retryCount: currentRetry
      });
      
      const cleanup = GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId }, // ES6 shorthand 사용
        onEvent: (event) => {
          if (event.type === 'loaded') {
            console.log(`✅ ${adTypeName} 광고 로드 완료:`, event.data);
            console.log(`📌 load 완료 - 이제 show를 호출해야 함 (토스 가이드 준수)`);
            setAdLoaded(true);
            setAdType(type);
            setAdLoading(false); // with-rewarded-ad 스타일
            retryCountRef.current = 0;
            // 광고 로드 완료 시 타임아웃 정리
            if (adWaitTimeoutRef.current) {
              clearTimeout(adWaitTimeoutRef.current);
              adWaitTimeoutRef.current = undefined;
            }
            // 다크패턴 방지: 모달이 열려있어도 자동으로 광고 표시하지 않음
            // 사용자가 명시적으로 "광고 보기" 버튼을 클릭했을 때만 광고 표시
          }
        },
        onError: (loadError) => {
          console.error(`\n❌❌❌ [${adTypeName}] 광고 로드 실패 ❌❌❌`);
          console.error(`❌ 에러 원본:`, loadError);
          console.error(`❌ 에러 타입:`, typeof loadError);
          console.error(`❌ 에러 메시지:`, loadError?.message);
          console.error(`❌ 에러 코드:`, loadError?.code);
          console.error(`❌ 에러 전체 객체:`, JSON.stringify(loadError, null, 2));
          console.error(`❌ 사용한 광고 ID: ${adGroupId}`);
          console.error(`❌ 현재 재시도 횟수: ${retryCountRef.current}`);
          
          setAdLoaded(false);
          setAdLoading(false);

          // 단순 정책: 보상형 실패 → 전면형 1회 시도, 전면형 실패 → 즉시 1회 지급
          if (type === 'rewarded') {
            console.warn('⚠️ 보상형 로드 실패 - 전면형으로 전환');
            setAdType('interstitial');
            loadAd('interstitial');
          } else {
            console.warn('⚠️ 전면형 로드 실패 - 1회 지급 후 종료');
            if (showAdModal) setShowAdModal(false);
            grantConsolationSpin('광고 로딩에 실패했어요. 1회 기회를 드립니다.');
          }
        },
      });

      cleanupRef.current = cleanup;
    } catch (loadError) {
      console.error(`⚠️ ${type === 'rewarded' ? '보상형' : '전면형'} 광고 로드 예외:`, loadError);
      setAdLoaded(false);
      setAdLoading(false);

      // 보상형 실패 시 전면형으로 전환
      if (type === 'rewarded') {
        console.warn('⚠️ 전면형 광고로 전환');
        setAdType('interstitial');
        retryCountRef.current = 0;
        loadAd('interstitial');
      } else {
        console.warn('⚠️ 광고 없이 진행');
        // 모달이 열려있으면 닫고 1회 제공
        if (showAdModal) {
          setShowAdModal(false);
          grantConsolationSpin('광고 로딩에 실패했어요. 1회 기회를 드립니다.');
        }
      }
    }
  }, [showAdModal]);

  // ref에 연결하여 상단에서 안전하게 호출 가능하도록 설정
  useEffect(() => {
    loadAdRef.current = loadAd;
    return () => {
      loadAdRef.current = undefined;
    };
  }, [loadAd]);

  /**
   * 광고를 표시합니다. (ProfilePage.tsx 스타일)
   * - 보상형: 보상 획득 여부에 따라 스핀 횟수 지급
   * - 전면형: dismissed 시 스핀 횟수 지급 (단, 중간에 건너뛰면 지급 안 함)
   */
  const showAd = useCallback(() => {
    try {
      // 광고 타입에 따라 다른 ID 사용
      const adGroupId = adType === 'rewarded' ? AD_CONFIG.TEST_REWARDED_AD_ID : AD_CONFIG.TEST_INTERSTITIAL_AD_ID;
      const adTypeName = adType === 'rewarded' ? '보상형' : '전면형';

      console.log(`✅ [${adTypeName}] 광고 표시 시작`);
      console.log('📞 GoogleAdMob.showAppsInTossAdMob 호출:', {
        adGroupId,
        adType: adType,
        adLoaded: adLoaded
      });
      
      // 네이티브 광고 표시 준비 - 상태 먼저 업데이트
      setAdShowing(true);
      setAdWatching(true);
      rewardEarnedRef.current = false;
      adSkippedRef.current = false; // 건너뛰기 플래그 초기화
      
      // 모달을 숨기지 않고 유지 (네이티브 광고가 위에 오버레이됨)
      // 단, adShowing이 true가 되면 모달은 조건부 렌더링으로 숨김
      
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId }, // ES6 shorthand 사용
        onEvent: (event) => {
          switch (event.type) {
            case 'requested':
              console.log(`✅ [${adTypeName}] 광고 표시 요청 완료`);
              break;

            case 'show':
              console.log(`✅ [${adTypeName}] 광고 컨텐츠 표시 시작 - 네이티브 레이어에 표시됨`);
              // 네이티브 광고가 표시되면 웹뷰 위에 오버레이되므로
              // 모달은 자동으로 가려지지만, 명확성을 위해 유지
              // (네이티브 광고가 z-index: 1000보다 훨씬 위에 표시됨)
              break;

            case 'impression':
              console.log(`✅ [${adTypeName}] 광고 노출 완료`);
              break;

            case 'clicked':
              console.log(`✅ [${adTypeName}] 광고 클릭됨`);
              break;

            case 'userEarnedReward':
              // 보상형 광고만 해당
              console.log('🎁 보상 획득!', event.data);
              rewardEarnedRef.current = true;
              break;

            case 'dismissed':
              console.log(`[${adTypeName}] 광고 닫힘`);

              if (adType === 'rewarded') {
                // 보상형: 보상 획득 여부 확인
                if (rewardEarnedRef.current) {
                  console.log('✅ 보상형 광고 완료 - 스핀 횟수 지급');
                  setRemainingSpins(prev => prev + AD_CONFIG.REWARD_SPINS);
                  setSaveToast({ show: true, message: `🎁 ${AD_CONFIG.REWARD_SPINS}번의 기회를 획득했습니다!` });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                } else {
                  console.warn('⚠️ 보상형 광고 중도 종료 - 보상 지급하지 않음');
                  setSaveToast({ show: true, message: '광고를 끝까지 시청해주세요' });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                }
              } else {
                // 전면형: dismissed 시 보상 지급 (단, 중간에 건너뛰면 지급 안 함)
                if (adSkippedRef.current) {
                  console.warn('⚠️ 전면형 광고 건너뛰기 - 보상 지급하지 않음');
                  // 보상 지급 안 함
                } else {
                  console.log('✅ 전면형 광고 닫힘 - 스핀 횟수 지급');
                  setRemainingSpins(prev => prev + AD_CONFIG.REWARD_SPINS);
                  setSaveToast({ show: true, message: `🎁 ${AD_CONFIG.REWARD_SPINS}번의 기회를 획득했습니다!` });
                  setTimeout(() => {
                    setSaveToast({ show: false, message: '' });
                  }, 2500);
                }
              }

              // 상태 정리 (다음 광고는 사용자가 다시 모달을 열고 광고 보기를 클릭할 때만 로드)
              setAdShowing(false);
              setAdWatching(false);
              setShowAdModal(false);
              setAdProgress(0);
              // 광고 로딩 중지 및 정리
              cleanupRef.current?.();
              cleanupRef.current = undefined;
              setAdLoaded(false);
              setAdLoading(false);
              break;

            case 'failedToShow':
              console.warn(`⚠️ [${adTypeName}] 광고 표시 실패`, event.data);
              setAdShowing(false);
              setAdWatching(false);
              setShowAdModal(false);
              // 광고 로딩 중지 및 정리
              cleanupRef.current?.();
              cleanupRef.current = undefined;
              setAdLoaded(false);
              setAdLoading(false);
              // 실패 시 1회 지급
              grantConsolationSpin('광고 로딩에 실패했어요. 1회 기회를 드립니다.');
              break;
          }
        },
        onError: (showError) => {
          console.error(`❌ [${adTypeName}] 광고 표시 에러:`, showError);
          setAdShowing(false);
          setAdWatching(false);
          setShowAdModal(false);
          // 광고 로딩 중지 및 정리
          cleanupRef.current?.();
          cleanupRef.current = undefined;
          setAdLoaded(false);
          setAdLoading(false);
          // 에러 시 1회 지급
          grantConsolationSpin('광고 표시 중 오류가 발생했어요. 1회 기회를 드립니다.');
        }
      });
    } catch (error) {
      console.error('❌ 광고 표시 중 예외 발생:', error);
      setAdShowing(false);
      setAdWatching(false);
      setShowAdModal(false);
      // 광고 로딩 중지 및 정리
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      setAdLoaded(false);
      setAdLoading(false);
      // 예외 발생 시 1회 지급
      grantConsolationSpin('광고 표시 중 오류가 발생했어요. 1회 기회를 드립니다.');
    }
  }, [adType, loadAd]);

  /**
   * 광고 로드 완료 후 자동 표시 (사용자가 "광고 보기" 버튼을 클릭한 경우만)
   * 다크패턴 방지: 모달이 열려도 자동으로 광고를 표시하지 않음
   * 사용자가 명시적으로 "광고 보기" 버튼을 클릭했을 때만 광고를 표시
   * (토스 다크패턴 방지 정책: 예상치 못한 순간에 광고가 뜨면 안 됨)
   */
  const [userRequestedAd, setUserRequestedAd] = useState(false); // 사용자가 광고 보기 버튼을 클릭했는지 추적
  
  useEffect(() => {
    // 사용자가 광고 보기를 요청했고, 광고가 로드 완료되면 자동으로 표시
    if (userRequestedAd && adLoaded && !adLoading && !adShowing && showAdModal) {
      console.log('✅ 사용자 요청 + 광고 로드 완료 - 자동으로 광고 표시');
      setUserRequestedAd(false); // 플래그 리셋
      showAd();
    }
  }, [userRequestedAd, adLoaded, adLoading, adShowing, showAdModal, showAd]);

  /**
   * 광고 미지원 환경 체크 - 모달이 열려있을 때 자동으로 닫기
   */
  useEffect(() => {
    if (showAdModal) {
      const checkSupported = () => {
        const loadSupported = GoogleAdMob.loadAppsInTossAdMob.isSupported?.();
        const showSupported = GoogleAdMob.showAppsInTossAdMob.isSupported?.();
        
        if (loadSupported === false || showSupported === false) {
          console.warn('⚠️ 모달이 열려있지만 광고 미지원 - 모달 닫기');
          setShowAdModal(false);
          grantConsolationSpin('돌리기 기회를 얻었어요!');
        }
      };
      
      // 약간의 지연 후 체크 (초기화 시간 고려)
      const timeout = setTimeout(checkSupported, 500);
      return () => clearTimeout(timeout);
    }
  }, [showAdModal]);

  /**
   * 광고 보기 버튼 클릭 핸들러 - 이때만 광고 로딩 시작
   */
  const handleWatchAd = useCallback(() => {
    try {
      const isSupported = GoogleAdMob.showAppsInTossAdMob.isSupported?.();
      console.log('🔍 [handleWatchAd] showAppsInTossAdMob.isSupported():', isSupported);
      console.log('🔍 [handleWatchAd] adLoaded:', adLoaded);
      console.log('🔍 [handleWatchAd] adLoading:', adLoading);
      console.log('🔍 [handleWatchAd] adType:', adType);

      // 광고 기능 미지원 시
      if (isSupported !== true) {
        console.warn('⚠️ 광고 기능 미지원');
        setShowAdModal(false);
        grantConsolationSpin('광고 기능이 지원되지 않아요. 1회 기회를 드립니다.');
        return;
      }

      // 이미 광고가 로드되어 있으면 바로 표시
      if (adLoaded && !adLoading) {
        console.log('✅ 광고 로드 완료 - show 호출');
        showAd();
        return;
      }

      // 광고가 로드 안 되어 있으면 로드 시작 (처음 광고 보기 버튼 클릭 시)
      if (!adLoading && !adLoaded) {
        console.log('📥 광고 보기 버튼 클릭 - 광고 로딩 시작');
        setAdLoading(true);
        setAdType('rewarded'); // 보상형 광고로 설정
        setUserRequestedAd(true); // 사용자가 광고 보기를 요청함
        loadAd('rewarded'); // 보상형 광고부터 시도
      } else if (adLoading) {
        console.log('⏳ 광고 로드 중 - 대기 중...');
        // 이미 로딩 중이면 사용자 요청 플래그 설정 (로드 완료 후 자동 표시)
        setUserRequestedAd(true);
      }
    } catch (error) {
      console.error('❌ 광고 표시 중 예외 발생:', error);
      setShowAdModal(false);
      grantConsolationSpin('광고 표시 중 오류가 발생했어요. 1회 기회를 드립니다.');
    }
  }, [adLoaded, adLoading, adType, showAd, loadAd]);

  // 광고 건너뛰기 (중간에 끊으면 보상 지급 안 함)
  const handleAdSkip = () => {
    console.warn('⚠️ 광고 건너뛰기 - 보상 지급하지 않음');
    adSkippedRef.current = true; // 건너뛰기 플래그 설정
    setAdShowing(false);
    setAdWatching(false);
    setShowAdModal(false);
    setAdProgress(0);
    rewardEarnedRef.current = false; // 보상 지급 안 함
  };

  // 모달 닫기 (광고 보지 않고 닫을 때 1회 지급, 진행 중인 광고 로딩 중지)
  const handleCloseAdModal = () => {
    // 진행 중인 광고 로딩 중지
    console.log('⚠️ 모달 닫기 - 진행 중인 광고 로딩 중지');
    cleanupRef.current?.();
    cleanupRef.current = undefined;
    
    // 상태 정리
    setAdLoaded(false);
    setAdLoading(false);
    setAdShowing(false);
    setAdWatching(false);
    setAdProgress(0);
    rewardEarnedRef.current = false;
    adSkippedRef.current = false;
    setUserRequestedAd(false); // 사용자 요청 플래그 리셋
    
    // 광고를 보지 않고 닫으면 1회 지급
    setRemainingSpins(prev => prev + 1);
    setShowAdModal(false);
    setSaveToast({ 
      show: true, 
      message: '💡 광고를 보면 5회, 지금은 1회만 지급되었어요!' 
    });
    if (saveToastTimerRef.current) {
      clearTimeout(saveToastTimerRef.current);
    }
    saveToastTimerRef.current = setTimeout(() => {
      setSaveToast({ show: false, message: '' });
      saveToastTimerRef.current = undefined;
    }, 3000); // 3초로 조금 늘림 (메시지가 좀 길어서)
  };

  /**
   * 컴포넌트 언마운트 시 정리
   * 광고 로딩은 사용자가 "광고 보기" 버튼을 클릭했을 때만 시작
   */
  useEffect(() => {
    console.log('🚀 ResultPage 마운트');

    return () => {
      console.log('🧹 ResultPage 언마운트 - cleanup 실행');
      // cleanup 함수 호출 (진행 중인 광고 로딩 중지)
      cleanupRef.current?.();
      cleanupRef.current = undefined;

      // 타이머 정리
      clearAllTimers();
      
      // 저장 관련 타이머 정리
      if (saveToastTimerRef.current) {
        clearTimeout(saveToastTimerRef.current);
        saveToastTimerRef.current = undefined;
      }
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    // 남은 스핀 횟수 확인
    if (remainingSpins <= 0) {
      // 모달만 열고, 광고 로딩은 시작하지 않음
      // 광고 상태 초기화 (이전 상태 정리)
      setAdLoaded(false);
      setAdLoading(false);
      setAdShowing(false);
      setAdWatching(false);
      setUserRequestedAd(false);
      setShowAdModal(true);
      return;
    }
    
    // 결정적 회전: 먼저 목표 섹션을 선택하고 그 섹션에 정확히 멈추도록 회전값 계산
    const sectionAngle = 360 / totalSections;
    const selectedIndex = Math.floor(Math.random() * totalSections);

    // 최종 각도(finalAngle)를 선택 섹션의 중앙에 오도록 설정
    const targetFinalAngle = 360 - (selectedIndex * sectionAngle + sectionAngle / 2);

    // 현재 각도 대비 양의 방향으로 충분히 회전하여 targetFinalAngle에 도달
    const currentAngle = ((rotation % 360) + 360) % 360;
    const baseSpins = 5; // 최소 5바퀴
    const targetTotalRotation = baseSpins * 360 + targetFinalAngle; // 기준 목표
    // 현재 각도를 고려해 추가 회전량 산출
    let additionalRotation = targetTotalRotation - currentAngle;
    while (additionalRotation <= 0) additionalRotation += 360; // 양수 보정

    const newRotation = rotation + additionalRotation;
    setIsSpinning(true);
    setRemainingSpins(prev => prev - 1);
    setRotation(newRotation);

    setTimeout(() => {
      setResult(wheelSections[selectedIndex]);
      setShowResult(true);
      setIsSpinning(false);
      setCanSave(true);
    }, 4000);
  };

  // 갤러리 저장 (Apps in Toss 공식 API 사용)
  // 메모리 최적화: 타이머 참조를 ref로 관리하여 정리 가능하도록 수정
  const saveToastTimerRef = useRef(undefined);
  
  const handleSave = async () => {
    try {
      // 결과가 표시 중일 때만 저장
      if (!showResult) {
        // 기존 타이머 정리
        if (saveToastTimerRef.current) {
          clearTimeout(saveToastTimerRef.current);
        }
        setSaveToast({ show: true, message: '먼저 돌림판을 돌려주세요!' });
        saveToastTimerRef.current = setTimeout(() => {
          setSaveToast({ show: false, message: '' });
          saveToastTimerRef.current = undefined;
        }, 2500);
        return;
      }
      
      // 저장 시에는 결과 카드만 캡처 (오버레이, 버튼 등은 제외)
      const closeButton = document.querySelector('.close-result-button');
      const bottomButtons = document.querySelector('.bottom-buttons');
      const headerElement = document.querySelector('.result-header');
      const overlayElement = document.querySelector('.result-overlay');
      const resultCard = document.querySelector('.result-card');
      
      if (closeButton) closeButton.style.visibility = 'hidden';
      if (bottomButtons) bottomButtons.style.visibility = 'hidden';
      if (headerElement) headerElement.style.visibility = 'hidden';
      // 두번째 스샷처럼 배경 흐림 + 카드가 함께 보이도록 오버레이는 유지
      
      // DOM 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 결과 페이지 전체 캡처 (배경 흐림 + 카드 포함)
      // 메모리 최적화: scale을 1.5로 감소 (2배에서 4배 메모리 감소)
      const target = document.querySelector('.result-page');
      const canvas = await html2canvas(target, {
        backgroundColor: null, // 원 배경 유지
        scale: 1.5, // 메모리 최적화: 2 -> 1.5 (화질은 거의 동일, 메모리 44% 감소)
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true, // 메모리 정리: 임시 컨테이너 제거
        onclone: (clonedDoc) => {
          // 클론된 문서에서 불필요한 요소 제거로 메모리 절약
          const clonedTarget = clonedDoc.querySelector('.result-page');
          if (clonedTarget) {
            // 스타일 최적화로 렌더링 부하 감소
            clonedTarget.style.willChange = 'auto';
          }
        }
      });
      
      // 원래 상태로 복원
      if (closeButton) closeButton.style.visibility = 'visible';
      if (bottomButtons) bottomButtons.style.visibility = 'visible';
      if (headerElement) headerElement.style.visibility = 'visible';
      // overlay는 변경하지 않음
      
      // Canvas를 Base64로 변환 (JPEG로 압축하여 메모리 및 파일 크기 감소)
      const base64Data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]; // PNG 대신 JPEG 90% 품질 사용
      const timestamp = new Date().getTime();
      const filename = `돌림판_결과_${timestamp}.jpg`;
      
      // Canvas 메모리 정리
      canvas.width = 0;
      canvas.height = 0;
      
      // Apps in Toss saveBase64Data API 사용 (Result.tsx 참고)
      // API 형식: { data, fileName, mimeType }
      try {
        await saveBase64Data({
          data: base64Data,
          fileName: filename,
          mimeType: 'image/jpeg', // JPEG로 변경
        });
        console.log('갤러리 저장 성공');
        setSaveToast({ show: true, message: '📷 갤러리에 저장했습니다!' });
        // 기존 타이머 정리
        if (saveToastTimerRef.current) {
          clearTimeout(saveToastTimerRef.current);
        }
        saveToastTimerRef.current = setTimeout(() => {
          setSaveToast({ show: false, message: '' });
          saveToastTimerRef.current = undefined;
        }, 2500);
      } catch (saveError) {
        console.warn('갤러리 저장 실패, 브라우저 다운로드로 대체:', saveError);
        // 샌드박스/로컬 등 미지원 환경에서는 브라우저 다운로드로 대체
        // Canvas가 이미 정리되었을 수 있으므로 다시 생성 필요
        try {
          const target = document.querySelector('.result-page');
          const retryCanvas = await html2canvas(target, {
            backgroundColor: null,
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          fallbackDownload(retryCanvas, filename.replace('.jpg', '.png'));
        } catch (retryError) {
          console.error('재시도 캡처 실패:', retryError);
          setSaveToast({ show: true, message: '이미지 저장에 실패했습니다.' });
          if (saveToastTimerRef.current) {
            clearTimeout(saveToastTimerRef.current);
          }
          saveToastTimerRef.current = setTimeout(() => {
            setSaveToast({ show: false, message: '' });
            saveToastTimerRef.current = undefined;
          }, 2500);
        }
      }
      
    } catch (error) {
      console.error('Failed to save image:', error);
        setSaveToast({ show: true, message: '이미지 저장에 실패했습니다.' });
        if (saveToastTimerRef.current) {
          clearTimeout(saveToastTimerRef.current);
        }
        saveToastTimerRef.current = setTimeout(() => {
          setSaveToast({ show: false, message: '' });
          saveToastTimerRef.current = undefined;
        }, 2500);
    }
  };

  // 브라우저 다운로드 (대체 방법)
  // 메모리 최적화: Canvas 정리 및 타이머 관리 추가
  const fallbackDownload = (canvas, filename) => {
    canvas.toBlob((blob) => {
      // Canvas 메모리 정리
      canvas.width = 0;
      canvas.height = 0;
      
      if (!blob) {
        setSaveToast({ show: true, message: '이미지 생성에 실패했습니다.' });
        if (saveToastTimerRef.current) {
          clearTimeout(saveToastTimerRef.current);
        }
        saveToastTimerRef.current = setTimeout(() => {
          setSaveToast({ show: false, message: '' });
          saveToastTimerRef.current = undefined;
        }, 2500);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // 메모리 정리
        }, 100);
      }, 0);
      
      setSaveToast({ show: true, message: '💾 다운로드 폴더를 확인해주세요!' });
      if (saveToastTimerRef.current) {
        clearTimeout(saveToastTimerRef.current);
      }
      saveToastTimerRef.current = setTimeout(() => {
        setSaveToast({ show: false, message: '' });
        saveToastTimerRef.current = undefined;
      }, 2500);
    }, 'image/png');
  };

  const handleBackClick = () => {
    setShowResult(false);
    setResult(null);
    setCanSave(false);
    setRotation(0);
    if (onBack) {
      onBack();
    }
  };

  // SVG로 돌림판 섹션 그리기
  const createSVGPath = (index, total) => {
    const centerX = 220;
    const centerY = 220;
    const radius = 200;
    
    const angle = (360 / total) * Math.PI / 180;
    const startAngle = index * angle - Math.PI / 2;
    const endAngle = (index + 1) * angle - Math.PI / 2;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getTextPosition = (index, total) => {
    const centerX = 220;
    const centerY = 220;
    const textRadius = 130; // 텍스트 위치
    
    const angle = (360 / total) * Math.PI / 180;
    const midAngle = (index + 0.5) * angle - Math.PI / 2;
    
    return {
      x: centerX + textRadius * Math.cos(midAngle),
      y: centerY + textRadius * Math.sin(midAngle),
      rotation: (index * 360 / total) + (180 / total)
    };
  };

  // 항목 개수에 따라 글자 크기 조정
  const getFontSize = () => {
    if (totalSections <= 6) return '16px';
    if (totalSections <= 8) return '14px';
    if (totalSections <= 12) return '12px';
    return '10px';
  };

  // 하드웨어/제스처 뒤로가기 처리: 히스토리 스택에 따라 이전 화면으로 이동
  useEffect(() => {
    // 현재 페이지에서 한 단계 더 쌓아 두어 뒤로가기를 감지
    try {
      window.history.pushState({ page: 'result-guard' }, '');
    } catch {}

    const onPop = (e) => {
      // 뒤로가기가 발생하면 React Router의 navigate로 처리
      e?.preventDefault?.();
      
      // 히스토리 스택이 있으면 이전 화면으로, 없으면 설정 페이지로 이동
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // 스택이 없으면 설정 페이지로 이동
        if (onBack) {
          onBack();
        }
      }
      // 다시 가드 상태를 쌓아서 반복 뒤로가기에 대비
      try { window.history.pushState({ page: 'result-guard' }, ''); } catch {}
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, [navigate, onBack]);

  return (
    <div className="result-page" style={{ 
      position: 'relative', 
      minHeight: '100vh',
      height: '100vh',
      background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
      padding: '20px',
      paddingBottom: '100px',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      <div className="result-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#ffffff',
          margin: 0
        }}>돌림판</h2>
      </div>

      <div className="wheel-container" style={{ position: 'relative', width: '100%', maxWidth: '350px', margin: '60px auto 80px' }}>
        {/* 받침대 - 돌림판 뒤 */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '140px solid transparent',
          borderRight: '140px solid transparent',
          borderBottom: '80px solid #87CEEB',
          zIndex: 0
        }} />

        {/* 화살표 표시 - 돌림판 앞 */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderTop: '35px solid #ff6b6b',
          zIndex: 15
        }} />

        <div 
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '100%',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
            zIndex: 5
          }}
        >
          <svg
            viewBox="0 0 440 440"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.2))'
            }}
          >
            {/* 돌림판 섹션들 */}
            {wheelSections.map((section, i) => (
              <g key={i}>
                <path
                  d={createSVGPath(i, totalSections)}
                  fill={section.color}
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth="1"
                />
              </g>
            ))}
            
            {/* 외곽 테두리 원 - 섹션 위에 그리기 */}
            <circle cx="220" cy="220" r="200" fill="none" stroke="#87CEEB" strokeWidth="8" />
            
            {/* 텍스트 레이어 */}
            {wheelSections.map((section, i) => (
              <text
                key={`text-${i}`}
                x={getTextPosition(i, totalSections).x}
                y={getTextPosition(i, totalSections).y}
                fill="white"
                fontSize={getFontSize()}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${getTextPosition(i, totalSections).rotation}, ${getTextPosition(i, totalSections).x}, ${getTextPosition(i, totalSections).y})`}
                style={{
                  filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.7))'
                }}
              >
                {section.text.length > 10 ? section.text.substring(0, 10) + '...' : section.text}
              </text>
            ))}
            
            {/* 중앙 원 */}
            <circle cx="220" cy="220" r="50" fill="#ffffff" stroke="#87CEEB" strokeWidth="6" />
          </svg>
        </div>
        
        {/* 중앙 버튼 - SPIN */}
        <div 
          style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
            width: '90px',
            height: '90px',
          borderRadius: '50%',
            backgroundColor: '#fff',
            border: '5px solid #87CEEB',
            cursor: isSpinning ? 'not-allowed' : 'pointer',
          display: 'flex',
            flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
            fontSize: '18px',
          fontWeight: 'bold',
            color: '#3182f6',
            zIndex: 15,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s',
            userSelect: 'none'
          }} 
          onClick={handleSpin}
          onMouseDown={(e) => !isSpinning && (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)')}
          onMouseUp={(e) => !isSpinning && (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
          onMouseLeave={(e) => !isSpinning && (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
        >
          <div>SPIN</div>
          {remainingSpins > 0 && (
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#ff6b6b', fontWeight: '600' }}>
              {remainingSpins}회
            </div>
          )}
        </div>
      </div>

      {/* 광고 모달 - 네이티브 광고가 표시되면 자동으로 가려짐 */}
      {showAdModal && !adShowing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          // 네이티브 광고가 표시될 때는 모달 숨김 (adShowing이 true면 네이티브 광고가 위에 있음)
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '90%',
            width: '350px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* 다크패턴 방지: 나갈 수 있는 X 버튼 추가 */}
            {!adWatching && (
              <button
                onClick={handleCloseAdModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
            
            {adLoading ? (
              <>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '20px',
                  animation: 'spin 1s linear infinite'
                }}>⏳</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#191F28'
                }}>광고 불러오는 중...</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: 0
                }}>잠시만 기다려주세요...</p>
              </>
            ) : adWatching ? (
              <>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '20px'
                }}>📺</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#191F28'
                }}>광고 시청 중...</h3>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: `${adProgress}%`,
                    height: '100%',
                    backgroundColor: '#3182f6',
                    transition: 'width 0.05s linear'
                  }} />
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '20px'
                }}>끝까지 시청해주세요...</p>
                <button
                  onClick={handleAdSkip}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f0f0f0',
                    color: '#666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  건너뛰기
                </button>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '20px'
                }}>🎁</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#191F28'
                }}>기회가 부족해요!</h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  marginBottom: '30px',
                  lineHeight: '1.5'
                }}>
                  광고를 끝까지 시청하면 <strong style={{ color: '#3182f6' }}>5번의 기회</strong>를 드려요<br/>
                  <span style={{ fontSize: '13px', color: '#999' }}>
                    (광고를 보지 않으면 1번만 지급됩니다)
                  </span>
                </p>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={handleCloseAdModal}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    1회 받기
                  </button>
                  <button
                    onClick={handleWatchAd}
                    disabled={adLoading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: adLoading ? '#ccc' : '#3182f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: adLoading ? 'not-allowed' : 'pointer',
                      opacity: adLoading ? 0.6 : 1
                    }}
                  >
                    {adLoading ? '로딩 중...' : '광고 보기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

             {showResult && result && (
        <>
          {/* 버튼 위쪽까지 그라데이션 흐림 효과 */}
                 <div 
                   className="result-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: '100px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,0.5) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          />
          
          {/* 폭죽 효과 - 메모리 최적화: 50개 -> 30개로 감소 */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 24,
            overflow: 'hidden'
          }}>
            {[...Array(30)].map((_, i) => {
              const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3', '#ff9ff3', '#54a0ff', '#48dbfb', '#1dd1a1'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              const randomX = Math.random() * 100;
              const randomDelay = Math.random() * 0.5;
              const randomDuration = 2 + Math.random() * 2;
              const randomRotate = Math.random() * 360;
              
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${randomX}%`,
                    top: '-10px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: randomColor,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                    opacity: 0,
                    animation: `confettiFall ${randomDuration}s ease-out ${randomDelay}s forwards`,
                    transform: `rotate(${randomRotate}deg)`
                  }}
                />
              );
            })}
          </div>
          
          {/* 결과 텍스트 - 중앙 배치 */}
                 <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '90%'
          }}>
                   <div className="result-card" style={{
              position: 'relative',
                     backgroundColor: '#ffffff', // 완전한 흰색으로 뒤 배경 완전히 차단
                     padding: '44px 68px',
                     borderRadius: '24px',
                     textAlign: 'center',
                     boxShadow: '0 24px 64px rgba(0, 0, 0, 0.38)',
                     border: '2px solid #ffffff',
                     backdropFilter: 'none',
              minWidth: '200px',
              maxWidth: '80vw',
              animation: 'resultPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}>
              {/* X 버튼 */}
              <button
                className="close-result-button"
                onClick={() => {
                  setShowResult(false);
                  setResult(null);
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontSize: '20px',
                  fontWeight: '300',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  padding: 0,
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.color = '#666';
                }}
              >
                ×
              </button>
              
                     <h2 style={{ 
                       fontSize: '48px', 
                       fontWeight: 900,
                       margin: 0,
                       color: '#0D0F12', // 훨씬 진하게
                       wordBreak: 'keep-all',
                       lineHeight: '1.25',
                       maxWidth: '100%',
                       overflowWrap: 'break-word',
                       textShadow: '0 1px 0 rgba(255,255,255,0.6)'
                     }}>
                {result.text}
              </h2>
            </div>
          </div>
        </>
      )}

      <div 
        className="bottom-buttons"
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '16px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          paddingTop: '40px',
          display: 'flex', 
          gap: '10px',
          background: 'linear-gradient(to top, rgba(13, 13, 13, 1) 0%, rgba(13, 13, 13, 0.9) 30%, rgba(13, 13, 13, 0.6) 60%, transparent 100%)',
          zIndex: 30,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <button
          onClick={handleBackClick}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: '#f0f0f0',
            color: '#191F28',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          이전
        </button>
        <button
          onClick={handleSave}
          disabled={!showResult}
          style={{
            flex: 1,
            padding: '16px',
            backgroundColor: showResult ? '#3182f6' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: showResult ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
          onMouseDown={(e) => showResult && (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => showResult && (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => showResult && (e.currentTarget.style.transform = 'scale(1)')}
        >
          저장하기
        </button>
      </div>

      {/* 저장 토스트 메시지 */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: `translateX(-50%) translateY(${saveToast.show ? '0' : '-100px'})`,
          backgroundColor: '#191F28',
          color: '#ffffff',
          padding: '14px 28px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: '90%',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        {saveToast.message}
      </div>
    </div>
  );
}
