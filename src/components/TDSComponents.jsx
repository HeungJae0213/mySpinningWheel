// @tds/mobile 패키지 미설치 시 대체 컴포넌트
import { useState } from 'react';

export const Asset = {
  Icon: ({ name, color, frameShape, backgroundColor, ratio, ariaHidden, ...props }) => (
    <div 
      className={`asset-icon ${frameShape}`}
      style={{ color, backgroundColor }}
      aria-hidden={ariaHidden}
      {...props}
    >
      {name}
    </div>
  ),
  Image: ({ src, frameShape, ariaHidden, ...props }) => (
    <img 
      src={src}
      className={`asset-image ${frameShape}`}
      aria-hidden={ariaHidden}
      {...props}
    />
  ),
  frameShape: {
    CleanW24: 'clean-w24',
    CleanW20: 'clean-w20',
    CleanW16: 'clean-w16',
    CleanWFull: 'clean-w-full',
  }
};

export const Text = ({ children, color, typography, fontWeight, ...props }) => (
  <span style={{ color }} className={`text-${typography} ${fontWeight}`} {...props}>
    {children}
  </span>
);

export const Post = {
  H3: ({ children, paddingBottom, color, ...props }) => (
    <h3 style={{ paddingBottom, color }} className="post-h3" {...props}>
      {children}
    </h3>
  )
};

export const Paragraph = {
  Text: ({ children, ...props }) => (
    <p className="paragraph-text" {...props}>
      {children}
    </p>
  )
};

export const FixedBottomCTA = {
  Single: ({ children, loading, onClick, ...props }) => (
    <button 
      className="fixed-bottom-cta"
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? '로딩중...' : children}
    </button>
  )
};

export const adaptive = {
  grey900: '#191F28',
  grey800: '#4E5968'
};

export const colors = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AED6DC', '#FF6B9D', '#C44569', '#F8B500', '#20BF6B',
  '#0ABDE3', '#5F27CD', '#FF9F43', '#10AC84', '#EE5A6F',
  '#3742FA', '#FF6A88', '#4B7BEC', '#00D2D3', '#FF3838'
];

export const Spacing = ({ size, ...props }) => (
  <div style={{ height: `${size}px` }} {...props} />
);

export const NumericSpinner = ({ 
  number = 0,
  defaultNumber,
  onNumberChange,
  minNumber = 0,
  maxNumber = 999,
  size = 'medium',
  disable = false,
  decreaseAriaLabel = '빼기',
  increaseAriaLabel = '더하기',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultNumber ?? 0);
  
  const currentValue = number !== undefined ? number : internalValue;
  
  const handleIncrement = () => {
    if (disable || currentValue >= maxNumber) return;
    
    const newValue = currentValue + 1;
    if (onNumberChange) {
      onNumberChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleDecrement = () => {
    if (disable || currentValue <= minNumber) return;
    
    const newValue = currentValue - 1;
    if (onNumberChange) {
      onNumberChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const sizeStyles = {
    tiny: { button: { width: '24px', height: '24px', fontSize: '14px' }, span: { fontSize: '16px', minWidth: '40px' } },
    small: { button: { width: '32px', height: '32px', fontSize: '16px' }, span: { fontSize: '18px', minWidth: '50px' } },
    medium: { button: { width: '40px', height: '40px', fontSize: '18px' }, span: { fontSize: '22px', minWidth: '60px' } },
    large: { button: { width: '48px', height: '48px', fontSize: '20px' }, span: { fontSize: '32px', minWidth: '70px' } },
  };

  const styles = sizeStyles[size] || sizeStyles.medium;

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        opacity: disable ? 0.5 : 1,
        pointerEvents: disable ? 'none' : 'auto'
      }}
      {...props}
    >
      <button 
        onClick={handleDecrement}
        disabled={currentValue <= minNumber || disable}
        aria-label={decreaseAriaLabel}
        style={{
          width: styles.button.width,
          height: styles.button.height,
          fontSize: styles.button.fontSize,
          cursor: disable || currentValue <= minNumber ? 'not-allowed' : 'pointer',
          border: '2px solid #444',
          borderRadius: '50%',
          backgroundColor: '#2a2a2a',
          color: currentValue <= minNumber ? '#555' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'scale(1)',
        }}
        onMouseDown={(e) => !disable && currentValue > minNumber && (e.currentTarget.style.transform = 'scale(0.9)')}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => !disable && currentValue > minNumber && (e.currentTarget.style.transform = 'scale(0.9)')}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        −
      </button>
      <span 
        aria-live="polite"
        style={{ 
          fontSize: styles.span.fontSize,
          fontWeight: '700',
          minWidth: styles.span.minWidth,
          textAlign: 'center',
          color: '#ffffff'
        }}
      >
        {currentValue}
      </span>
      <button 
        onClick={handleIncrement}
        disabled={currentValue >= maxNumber || disable}
        aria-label={increaseAriaLabel}
        style={{
          width: styles.button.width,
          height: styles.button.height,
          fontSize: styles.button.fontSize,
          cursor: disable || currentValue >= maxNumber ? 'not-allowed' : 'pointer',
          border: '2px solid #444',
          borderRadius: '50%',
          backgroundColor: '#2a2a2a',
          color: currentValue >= maxNumber ? '#555' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: 'scale(1)',
        }}
        onMouseDown={(e) => !disable && currentValue < maxNumber && (e.currentTarget.style.transform = 'scale(0.9)')}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={(e) => !disable && currentValue < maxNumber && (e.currentTarget.style.transform = 'scale(0.9)')}
        onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        +
      </button>
    </div>
  );
};

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', ...props }) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      ...props.style
    }}
    {...props}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        animation: 'skeleton-loading 1.5s infinite'
      }}
    />
    <style>
      {`
        @keyframes skeleton-loading {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}
    </style>
  </div>
);

export const Button = ({ children, onClick, display, ...props }) => (
  <button 
    className={`app-button ${display || ''}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

export const List = ({ children, ...props }) => (
  <div className="list-container" {...props}>
    {children}
  </div>
);

export const ListRow = ({ children, contents, verticalPadding, ref, ...props }) => (
  <div 
    className={`list-row ${verticalPadding}`}
    {...props}
  >
    {contents}
  </div>
);

export const ListRowRef = ListRow;

ListRow.Texts = ({ type, top, topProps, ariaLabel, ...props }) => (
  <div className={`list-row-texts ${type}`} aria-label={ariaLabel} {...props}>
    {typeof top === 'string' ? (
      <span style={topProps}>{top}</span>
    ) : (
      top
    )}
  </div>
);

export const CTAButton = ({ children, onClick, display, color, variant, disabled, ...props }) => (
  <button 
    className={`cta-button ${color || ''} ${variant || ''} ${display || ''}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

FixedBottomCTA.Double = ({ leftButton, rightButton, ...props }) => (
  <div className="fixed-bottom-cta-double" {...props}>
    {leftButton}
    {rightButton}
  </div>
);
