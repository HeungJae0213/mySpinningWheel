import React from 'react'

export default function WelcomePage({ onConfirm }) {
  const handleConfirm = () => {
    console.log('확인했어요 클릭');
    if (onConfirm) {
      onConfirm();
    }
  };

  // 12가지 무지개색 (겹치지 않게)
  const colors = [
    '#FF6B6B', // 빨강
    '#FF8E53', // 주황
    '#FFA500', // 진한 주황
    '#FFD93D', // 노랑
    '#A8E063', // 연두
    '#6BCF7F', // 초록
    '#4ECDC4', // 민트
    '#45B7D1', // 하늘
    '#5DADE2', // 파랑
    '#6C5CE7', // 남색
    '#A29BFE', // 연보라
    '#FDA7DF', // 분홍
  ];

  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main Content */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0'
      }}>
        {/* Title */}
        <h1 style={{ 
          fontSize: '20px', 
          marginBottom: '40px',
          textAlign: 'center',
          fontWeight: '600',
          color: '#ffffff'
        }}>
          돌림판 돌리기에 오신걸 환영해요
        </h1>

        {/* Spinning Wheel Container with Stand */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px',
          position: 'relative',
        }}>
          {/* Arrow Pointer */}
          <div style={{
            width: '0',
            height: '0',
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '35px solid #FF7043',
            marginBottom: '-5px',
            zIndex: 10,
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
            position: 'relative',
          }} />

          {/* Wheel Stand (Behind) - Triangle/Trapezoid Shape */}
          <div style={{
            width: '0',
            height: '0',
            borderLeft: '100px solid transparent',
            borderRight: '100px solid transparent',
            borderBottom: '140px solid #81D4FA',
            position: 'absolute',
            bottom: '-20px',
            zIndex: 1,
            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))',
          }}>
            {/* 3D highlight effect on stand */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '60px',
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }} />
          </div>

          {/* Spinning Wheel - 12 Segments with 3D effect */}
          <div style={{
            width: '80vw',
            height: '80vw',
            maxWidth: '320px',
            maxHeight: '320px',
            minWidth: '240px',
            minHeight: '240px',
            position: 'relative',
            zIndex: 5,
            filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))',
          }}>
            <svg viewBox="0 0 220 220" style={{ width: '100%', height: '100%' }}>
              {/* Outer border circle for 3D effect */}
              <defs>
                <radialGradient id="outerBorder" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#E3F2FD" />
                  <stop offset="100%" stopColor="#90CAF9" />
                </radialGradient>
                <radialGradient id="centerGradient" cx="40%" cy="40%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f5f5f5" />
                  <stop offset="100%" stopColor="#e0e0e0" />
                </radialGradient>
              </defs>
              
              {/* Outer decorative circle */}
              <circle cx="110" cy="110" r="108" fill="url(#outerBorder)" />
              
              {/* Main wheel segments */}
              {colors.map((color, index) => {
                const angle = (360 / 12) * index;
                const startAngle = (angle - 15) * (Math.PI / 180);
                const endAngle = (angle + 15) * (Math.PI / 180);
                
                const x1 = 110 + 100 * Math.cos(startAngle);
                const y1 = 110 + 100 * Math.sin(startAngle);
                const x2 = 110 + 100 * Math.cos(endAngle);
                const y2 = 110 + 100 * Math.sin(endAngle);
                
                const gradientId = `gradient-${index}`;
                const midAngle = angle * (Math.PI / 180);
                
                return (
                  <g key={index}>
                    <defs>
                      <linearGradient 
                        id={gradientId} 
                        x1="0%" 
                        y1="0%" 
                        x2="100%" 
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="50%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.75" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 110 110 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                      fill={`url(#${gradientId})`}
                      stroke="#2C3E50"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
              
              {/* Center circle with enhanced 3D effect */}
              <circle 
                cx="110" 
                cy="110" 
                r="18" 
                fill="url(#centerGradient)" 
                stroke="#2C3E50" 
                strokeWidth="3"
              />
              
              {/* Inner highlight for 3D effect */}
              <circle 
                cx="110" 
                cy="110" 
                r="15" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="1.5" 
                opacity="0.4"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <button 
        onClick={handleConfirm}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#3182f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'scale(1)',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        확인했어요
      </button>
    </div>
  );
}