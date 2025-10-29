import React from 'react'
import './LoadingPage.css';

export default function LoadingPage() {
  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '20px', fontSize: '16px', color: '#191F28' }}>
        돌림판을 생성하고 있어요
      </p>
    </div>
  );
}
