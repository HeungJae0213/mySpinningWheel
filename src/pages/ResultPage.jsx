import React, { useState, useMemo, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import './ResultPage.css';
import { AD_CONFIG } from '../config/adConfig';
import { GoogleAdMob, saveBase64Data } from '@apps-in-toss/web-framework';

export default function ResultPage({ items, onBack }) {
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
  const [adLoadAttempts, setAdLoadAttempts] = useState(0);
  const [adLoadFailed, setAdLoadFailed] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

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

  // 실제 광고 로드 (Apps in Toss 공식 API 사용)
  const loadAd = useCallback((attemptCount = 0) => {
    if (attemptCount >= AD_CONFIG.MAX_LOAD_ATTEMPTS) {
      setAdLoadFailed(true);
      setIsAdLoading(false);
      setSaveToast({ show: true, message: '광고를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.' });
      setTimeout(() => {
        setSaveToast({ show: false, message: '' });
        setShowAdModal(false);
      }, 2500);
      return;
    }

    // 광고 지원 여부 확인 (with-rewarded-ad 예제 방식)
    const isAdUnsupported = GoogleAdMob?.loadAppsInTossAdMob?.isSupported?.() === false;
    
    if (isAdUnsupported) {
      console.warn('광고가 준비되지 않았거나, 지원되지 않아요.');
      setIsAdLoading(false);
      setAdLoadFailed(true);
      return;
    }

    setIsAdLoading(true);
    setAdLoadAttempts(attemptCount + 1);
    
    console.log(`광고 로드 시작 - ID: ${AD_CONFIG.TEST_REWARDED_AD_ID}`);
    
    // 실제 광고 로드 (공식 문서 기반)
    // https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EA%B4%91%EA%B3%A0/loadAppsInTossAdMob.html
    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: AD_CONFIG.TEST_REWARDED_AD_ID,
      },
      onEvent: (event) => {
        console.log('광고 로드 이벤트:', event.type);
        if (event.type === 'loaded') {
          console.log('✅ 광고 로드 성공', event.data);
          setIsAdLoading(false);
          setAdLoadFailed(false);
          setAdLoadAttempts(0);
        }
      },
      onError: (error) => {
        console.error(`❌ 광고 로드 실패 (시도 ${attemptCount + 1}/${AD_CONFIG.MAX_LOAD_ATTEMPTS})`, error);
        setIsAdLoading(false);
        
        // 재시도
        if (attemptCount + 1 < AD_CONFIG.MAX_LOAD_ATTEMPTS) {
          console.log(`${AD_CONFIG.LOAD_RETRY_DELAY}ms 후 재시도...`);
          setTimeout(() => {
            loadAd(attemptCount + 1);
          }, AD_CONFIG.LOAD_RETRY_DELAY);
        } else {
          setAdLoadFailed(true);
          setSaveToast({ show: true, message: '광고를 불러올 수 없습니다.' });
          setTimeout(() => {
            setSaveToast({ show: false, message: '' });
            setShowAdModal(false);
          }, 2500);
        }
      },
    });

    // cleanup 함수 반환
    return cleanup;
  }, []);

  // 실제 광고 표시 (Apps in Toss 공식 API 사용) - with-rewarded-ad 예제 방식
  const handleWatchAd = useCallback(() => {
    console.log(`🎬 보상형 광고 시작 - ID: ${AD_CONFIG.TEST_REWARDED_AD_ID}`);
    
    // 광고 지원 여부 확인 (with-rewarded-ad 예제 방식)
    const isAdUnsupported = GoogleAdMob?.showAppsInTossAdMob?.isSupported?.() === false;
    
    if (isAdLoading || isAdUnsupported) {
      console.warn('광고가 준비되지 않았거나, 지원되지 않아요.');
      setSaveToast({ show: true, message: '광고가 준비되지 않았습니다.' });
      setTimeout(() => {
        setSaveToast({ show: false, message: '' });
        setShowAdModal(false);
      }, 2500);
      return;
    }

    setAdWatching(true);
    setAdProgress(0);
    setAdLoadFailed(false);
    
    // 실제 광고 표시 (공식 문서 기반)
    // https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EA%B4%91%EA%B3%A0/showAppsInTossAdMob.html
    GoogleAdMob.showAppsInTossAdMob({
      options: {
        adGroupId: AD_CONFIG.TEST_REWARDED_AD_ID,
      },
      onEvent: (event) => {
        console.log('📺 광고 이벤트:', event.type);
        switch (event.type) {
          case 'requested':
            console.log('광고 요청됨');
            break;
          
          case 'impression':
            console.log('광고가 화면에 노출됨');
            break;
          
          case 'show':
            console.log('✅ 광고 컨텐츠 보여짐');
            setAdWatching(true);
            break;
          
          case 'userEarnedReward':
            console.log(`🎁 광고 시청 보상 획득 - ${AD_CONFIG.REWARD_SPINS}번의 기회`);
            // 보상 지급
            setRemainingSpins(AD_CONFIG.REWARD_SPINS);
            setSaveToast({ show: true, message: `🎁 ${AD_CONFIG.REWARD_SPINS}번의 기회를 획득했습니다!` });
            setTimeout(() => {
              setSaveToast({ show: false, message: '' });
            }, 2500);
            break;
          
          case 'dismissed':
            console.log('광고 닫힘');
            setAdWatching(false);
            setShowAdModal(false);
            setAdProgress(0);
            // 광고 다시 로드
            loadAd(0);
            break;
          
          case 'failedToShow':
            console.error('❌ 광고 표시 실패');
            setAdWatching(false);
            setSaveToast({ show: true, message: '광고를 표시할 수 없습니다.' });
            setTimeout(() => {
              setSaveToast({ show: false, message: '' });
              setShowAdModal(false);
            }, 2500);
            break;
        }
      },
      onError: (error) => {
        console.error('❌ 광고 표시 에러:', error);
        setAdWatching(false);
        setShowAdModal(false);
        setSaveToast({ show: true, message: '광고 표시 중 오류가 발생했습니다.' });
        setTimeout(() => {
          setSaveToast({ show: false, message: '' });
        }, 2500);
      },
    });
  }, [isAdLoading, loadAd]);

  // 광고 건너뛰기
  const handleAdSkip = () => {
    setAdWatching(false);
    setShowAdModal(false);
    setAdProgress(0);
  };

  // 컴포넌트 마운트 시 광고 로드 (with-rewarded-ad 예제 방식)
  useEffect(() => {
    console.log('🔄 컴포넌트 마운트 - 광고 로드 시작');
    const cleanup = loadAd(0);
    
    return () => {
      if (cleanup) {
        console.log('🧹 컴포넌트 언마운트 - 광고 cleanup');
        cleanup();
      }
    };
  }, [loadAd]);

  const handleSpin = () => {
    if (isSpinning) return;
    
    // 남은 스핀 횟수 확인
    if (remainingSpins <= 0) {
      setShowAdModal(true);
      return;
    }
    
    setIsSpinning(true);
    setRemainingSpins(prev => prev - 1);
    
    // 현재 rotation에서 시작하여 항상 오른쪽(양수)으로 5~10바퀴 추가 회전
    const additionalRotation = 1800 + Math.random() * 1800; // 5~10바퀴
    const newRotation = rotation + additionalRotation;
    setRotation(newRotation);
    
    setTimeout(() => {
      const finalAngle = newRotation % 360;
      const sectionAngle = 360 / totalSections;
      // 화살표가 위를 가리키므로, 위쪽 섹션을 선택
      let selectedIndex = Math.floor((360 - finalAngle + sectionAngle / 2) / sectionAngle) % totalSections;
      
      setResult(wheelSections[selectedIndex]);
      setShowResult(true);
      setIsSpinning(false);
      setCanSave(true);
    }, 4000);
  };

  // 갤러리 저장 (Apps in Toss 공식 API 사용)
  const handleSave = async () => {
    try {
      // 결과가 표시 중일 때만 저장
      if (!showResult) {
        setSaveToast({ show: true, message: '먼저 돌림판을 돌려주세요!' });
        setTimeout(() => {
          setSaveToast({ show: false, message: '' });
        }, 2500);
        return;
      }
      
      // X 버튼과 하단 버튼만 숨김
      const closeButton = document.querySelector('.close-result-button');
      const bottomButtons = document.querySelector('.bottom-buttons');
      const headerElement = document.querySelector('.result-header');
      
      if (closeButton) closeButton.style.visibility = 'hidden';
      if (bottomButtons) bottomButtons.style.visibility = 'hidden';
      if (headerElement) headerElement.style.visibility = 'hidden';
      
      // DOM 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const element = document.querySelector('.result-page');
      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // 원래 상태로 복원
      if (closeButton) closeButton.style.visibility = 'visible';
      if (bottomButtons) bottomButtons.style.visibility = 'visible';
      if (headerElement) headerElement.style.visibility = 'visible';
      
      // Canvas를 Base64로 변환
      const base64Data = canvas.toDataURL('image/png').split(',')[1];
      const timestamp = new Date().getTime();
      const filename = `돌림판_결과_${timestamp}.png`;
      
      // Apps in Toss saveBase64Data API 사용 (try-catch로 감싸기)
      // https://developers-apps-in-toss.toss.im/bedrock/reference/framework/데이터/saveBase64Data.html
      try {
        if (saveBase64Data && saveBase64Data.isSupported?.() === true) {
          console.log('Apps in Toss 갤러리 저장 사용');
          saveBase64Data({
            base64Data: base64Data,
            filename: filename,
            onSuccess: () => {
              console.log('갤러리 저장 성공');
              setSaveToast({ show: true, message: '📷 갤러리에 저장했습니다!' });
              setTimeout(() => {
                setSaveToast({ show: false, message: '' });
              }, 2500);
            },
            onError: (error) => {
              console.error('갤러리 저장 실패:', error);
              // 실패 시 브라우저 다운로드로 대체
              fallbackDownload(canvas, filename);
            },
          });
        } else {
          console.warn('갤러리 저장이 지원되지 않는 환경입니다. (샌드박스/로컬) 브라우저 다운로드를 사용합니다.');
          // 브라우저 다운로드로 대체
          fallbackDownload(canvas, filename);
        }
      } catch (saveError) {
        console.warn('갤러리 저장 API 호출 실패 (샌드박스 환경):', saveError);
        // 샌드박스에서는 에러를 무시하고 브라우저 다운로드 사용
        fallbackDownload(canvas, filename);
      }
      
    } catch (error) {
      console.error('Failed to save image:', error);
      setSaveToast({ show: true, message: '이미지 저장에 실패했습니다.' });
      setTimeout(() => {
        setSaveToast({ show: false, message: '' });
      }, 2500);
    }
  };

  // 브라우저 다운로드 (대체 방법)
  const fallbackDownload = (canvas, filename) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaveToast({ show: true, message: '이미지 생성에 실패했습니다.' });
        setTimeout(() => {
          setSaveToast({ show: false, message: '' });
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
          URL.revokeObjectURL(url);
        }, 100);
      }, 0);
      
      setSaveToast({ show: true, message: '💾 다운로드 폴더를 확인해주세요!' });
      setTimeout(() => {
        setSaveToast({ show: false, message: '' });
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

      {/* 광고 모달 */}
      {showAdModal && (
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
          zIndex: 1000
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
                onClick={() => setShowAdModal(false)}
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
            
            {isAdLoading ? (
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
                }}>시도 {adLoadAttempts}/3</p>
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
                }}>광고를 끝까지 시청하면<br/>5번의 기회를 드려요</p>
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => setShowAdModal(false)}
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
                    닫기
                  </button>
                  <button
                    onClick={handleWatchAd}
                    disabled={isAdLoading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: isAdLoading ? '#ccc' : '#3182f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isAdLoading ? 'not-allowed' : 'pointer',
                      opacity: isAdLoading ? 0.6 : 1
                    }}
                  >
                    {isAdLoading ? '로딩 중...' : '광고 보기'}
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
          
          {/* 폭죽 효과 */}
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
            {[...Array(50)].map((_, i) => {
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
            <div style={{
              position: 'relative',
              backgroundColor: '#fff',
              padding: '40px 60px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              border: '3px solid #f0f0f0',
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
                fontSize: '42px', 
                fontWeight: 'bold', 
                margin: 0,
                color: '#191F28',
                wordBreak: 'keep-all',
                lineHeight: '1.3',
                maxWidth: '100%',
                overflowWrap: 'break-word'
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
