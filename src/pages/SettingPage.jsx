import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../components/TDSComponents.jsx';
import './SettingPage.css';

export default function SettingPage({ onGenerate, savedItems }) {
  const navigate = useNavigate();
  // 색깔 중복 방지 함수
  const getUniqueColors = (count) => {
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, colors.length));
  };
  
  // 초기 아이템 생성
  const getInitialItems = () => {
    if (savedItems && savedItems.length > 0) {
      return savedItems;
    }
    const uniqueColors = getUniqueColors(5);
    return Array(5).fill('').map((_, i) => ({
      text: `항목 ${i + 1}`,
      color: uniqueColors[i],
      count: 1
    }));
  };
  
  const [items, setItems] = useState(getInitialItems);
  const [numberOfItems, setNumberOfItems] = useState(savedItems?.length || 5);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isPageVisible, setIsPageVisible] = useState(false);
  
  // savedItems가 변경되면 items 업데이트
  useEffect(() => {
    if (savedItems && savedItems.length > 0) {
      setItems(savedItems);
      setNumberOfItems(savedItems.length);
    }
  }, [savedItems]);

  // 페이지 진입 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // 토스트 자동 숨김
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Android 환경에서 뒤로가기 처리: 이전 페이지로 이동
  useEffect(() => {
    // 다른 페이지를 방문했다는 플래그 설정 (WelcomePage에서 앱 종료 방지)
    sessionStorage.setItem('has_visited_other_page', 'true');
    
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // 현재 페이지에서 한 단계 더 쌓아 두어 뒤로가기를 감지
    try {
      window.history.pushState({ page: 'setting-guard' }, '');
    } catch {}

    const handleBackButton = () => {
      // 이전 페이지로 이동 (Welcome 페이지)
      navigate(-1);
    };

    const onPop = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      
      // Android 환경에서는 더 확실하게 처리
      if (isAndroid) {
        handleBackButton();
      } else {
        // 히스토리 스택이 있으면 이전 화면으로
        if (window.history.length > 1) {
          navigate(-1);
        }
      }
      
      // 다시 가드 상태를 쌓아서 반복 뒤로가기에 대비
      try { 
        window.history.pushState({ page: 'setting-guard' }, ''); 
      } catch {}
    };

    window.addEventListener('popstate', onPop);
    
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, [navigate]);

  // 토스트 표시 함수
  const showToast = (message) => {
    setToast({ show: true, message });
  };

  // 전체 count 합계
  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
  }, [items]);

  // 각 항목의 확률 계산
  const getProbability = (count) => {
    const numCount = parseInt(count) || 0;
    if (totalCount === 0) return '0.00';
    return ((numCount / totalCount) * 100).toFixed(2);
  };

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text: value };
    setItems(newItems);
  };

  const handleCountChange = (index, delta) => {
    const newItems = [...items];
    const newCount = Math.max(1, Math.min(100, newItems[index].count + delta));
    newItems[index] = { ...newItems[index], count: newCount };
    setItems(newItems);
  };

  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      showToast('최소 1개의 항목이 필요합니다.');
      return;
    }
    
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setNumberOfItems(newItems.length);
  };

  const handleGenerate = () => {
    // 빈 항목 검증
    const hasEmptyItem = items.some(item => !item.text || item.text.trim() === '');
    
    if (hasEmptyItem) {
      showToast('빈 항목이 있습니다.');
      return;
    }
    
    if (onGenerate) {
      onGenerate(items);
    }
  };

  const updateNumberOfItems = (newNumber) => {
    const num = Math.max(1, Math.min(100, newNumber));
    setNumberOfItems(num);
    const newItems = [...items];
    
    if (num > items.length) {
      // 현재 사용 중인 색깔 찾기
      const usedColors = new Set(newItems.map(item => item.color));
      const availableColors = colors.filter(color => !usedColors.has(color));
      
      for (let i = items.length; i < num; i++) {
        // 사용 가능한 색깔이 있으면 그 중에서, 없으면 전체에서 랜덤
        const colorPool = availableColors.length > 0 ? availableColors : colors;
        const selectedColor = colorPool[Math.floor(Math.random() * colorPool.length)];
        
        newItems.push({
          text: `항목 ${i + 1}`,
          color: selectedColor,
          count: 1
        });
        
        // 선택한 색깔을 사용 목록에 추가
        if (availableColors.length > 0) {
          const colorIndex = availableColors.indexOf(selectedColor);
          if (colorIndex > -1) {
            availableColors.splice(colorIndex, 1);
          }
        }
      }
    } else if (num < items.length) {
      newItems.splice(num);
    }
    
    setItems(newItems);
  };

  const handleItemCountInput = (index, value) => {
    if (value === '') {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], count: '' };
      setItems(newItems);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      const newCount = Math.max(1, Math.min(100, num));
      const newItems = [...items];
      newItems[index] = { ...newItems[index], count: newCount };
      setItems(newItems);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
      paddingBottom: '100px',
      opacity: isPageVisible ? 1 : 0,
      transform: isPageVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
    }}>
      <h1 style={{ 
        fontSize: '20px', 
        marginBottom: '20px', 
        color: '#ffffff', 
        fontWeight: '600',
        opacity: isPageVisible ? 1 : 0,
        transform: isPageVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s'
      }}>
        돌림판 설정
      </h1>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px', 
        marginBottom: '30px', 
        justifyContent: 'center',
        opacity: isPageVisible ? 1 : 0,
        transform: isPageVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s'
      }}>
        <button 
          onClick={() => updateNumberOfItems(Math.max(1, (numberOfItems || 1) - 1))}
          style={{ 
            width: '48px', 
            height: '48px', 
            fontSize: '20px', 
            cursor: 'pointer',
            border: '2px solid #444',
            borderRadius: '50%',
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: 'scale(1)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          -
        </button>
        <input
          type="number"
          value={numberOfItems}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setNumberOfItems('');
            } else {
              const num = parseInt(value, 10);
              if (!isNaN(num)) {
                updateNumberOfItems(num);
              }
            }
          }}
          onBlur={(e) => {
            if (e.target.value === '' || parseInt(e.target.value) < 1) {
              updateNumberOfItems(1);
            }
          }}
          style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            width: '70px', 
            textAlign: 'center', 
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid #444',
            borderRadius: '8px',
            padding: '8px',
            outline: 'none'
          }}
          min="1"
          max="100"
        />
        <button 
          onClick={() => updateNumberOfItems(Math.min(100, (numberOfItems || 1) + 1))}
          style={{ 
            width: '48px', 
            height: '48px', 
            fontSize: '20px', 
            cursor: 'pointer',
            border: '2px solid #444',
            borderRadius: '50%',
            backgroundColor: '#2a2a2a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: 'scale(1)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          +
        </button>
      </div>
      
      <div 
        className="list-wrapper"
        style={{ 
          maxHeight: 'calc(100vh - 280px)', 
          overflowY: 'auto', 
          marginBottom: '20px',
          overflowX: 'hidden'
        }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '16px 0',
              borderBottom: '1px solid #333',
              gap: '12px',
              position: 'relative',
              opacity: isPageVisible ? 1 : 0,
              transform: isPageVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: `opacity 0.5s ease-out ${0.3 + index * 0.1}s, transform 0.5s ease-out ${0.3 + index * 0.1}s`
            }}
          >
            {/* 삭제 버튼 */}
            <button
              onClick={() => handleDeleteItem(index)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '0px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#888',
                fontSize: '20px',
                fontWeight: '300',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                padding: 0,
                lineHeight: 1,
                opacity: 0.5
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ff5555';
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#888';
                e.currentTarget.style.opacity = '0.5';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.15)';
                e.currentTarget.style.color = '#ff5555';
                e.currentTarget.style.opacity = '1';
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#888';
                  e.currentTarget.style.opacity = '0.5';
                }, 200);
              }}
            >
              ×
            </button>

            {/* 색깔 원 */}
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: item.color,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }} 
            />
            
            {/* 항목 입력 */}
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder="항목을 입력하세요"
              style={{ 
                flex: 1, 
                minWidth: '80px',
                padding: '8px 12px', 
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                backgroundColor: 'transparent',
                color: '#ffffff'
              }}
            />
            
            {/* 갯수 표시 및 조절 - 수직 배치 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 8px',
              borderRadius: '8px',
              flexShrink: 0,
              minWidth: '80px',
              justifyContent: 'center'
            }}>
              <input
                type="number"
                value={item.count}
                onChange={(e) => handleItemCountInput(index, e.target.value)}
                onBlur={(e) => {
                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                    handleItemCountInput(index, '1');
                  }
                }}
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  width: '35px',
                  textAlign: 'center',
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '2px',
                  flexShrink: 0,
                  appearance: 'textfield',
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }}
                min="1"
                max="100"
              />
              
              {/* + - 버튼 수직 배치 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                flexShrink: 0
              }}>
                <button
                  onClick={() => handleCountChange(index, 1)}
                  disabled={(item.count || 1) >= 100}
                  style={{
                    width: '20px',
                    height: '18px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: (item.count || 1) >= 100 ? '#555' : '#ffffff',
                    cursor: (item.count || 1) >= 100 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'transform 0.15s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  +
                </button>
                <button
                  onClick={() => handleCountChange(index, -1)}
                  disabled={(item.count || 1) <= 1}
                  style={{
                    width: '20px',
                    height: '18px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: (item.count || 1) <= 1 ? '#555' : '#ffffff',
                    cursor: (item.count || 1) <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'transform 0.15s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.8)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  -
                </button>
              </div>
            </div>
            
            {/* 확률 표시 */}
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#9CA3AF',
              minWidth: '65px',
              textAlign: 'right',
              flexShrink: 0,
              paddingTop: '4px'
            }}>
              {getProbability(item.count)}%
            </span>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleGenerate}
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          width: '100%',
          padding: '16px 20px',
          backgroundColor: '#3182f6',
          color: 'white',
          border: 'none',
          borderRadius: '0',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transform: isPageVisible ? 'scale(1) translateY(0)' : 'scale(1) translateY(100px)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          opacity: isPageVisible ? 1 : 0
        }}
        onMouseDown={(e) => {
          if (isPageVisible) e.currentTarget.style.transform = 'scale(0.98) translateY(0)';
        }}
        onMouseUp={(e) => {
          if (isPageVisible) e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
        onMouseLeave={(e) => {
          if (isPageVisible) e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
        onTouchStart={(e) => {
          if (isPageVisible) e.currentTarget.style.transform = 'scale(0.98) translateY(0)';
        }}
        onTouchEnd={(e) => {
          if (isPageVisible) e.currentTarget.style.transform = 'scale(1) translateY(0)';
        }}
      >
        생성하기
      </button>

      {/* 토스트 메시지 */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: `translateX(-50%) translateY(${toast.show ? '20px' : '-100px'})`,
          backgroundColor: '#ffffff',
          color: '#191F28',
          padding: '14px 24px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          zIndex: 10000,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: '90%',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        {toast.message}
      </div>
    </div>
  );
}

