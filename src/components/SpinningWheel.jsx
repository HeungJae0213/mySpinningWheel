import { useState } from 'react'
import '../App.css'

function SpinningWheel({ items = [] }) {
  const [rotation, setRotation] = useState(0)
  const numItems = items.length || 6

  const handleSpin = () => {
    const newRotation = rotation + 720 + Math.random() * 720
    setRotation(newRotation)
  }

  const getAngleForItem = (index, total) => (360 / total) * index

  const createSection = (index, total) => {
    const angle = getAngleForItem(index, total)
    const skewAngle = 90 - 360 / total
    const item = items[index] || { text: `${index + 1}`, color: '#ff6b6b' }
    
    return (
      <div
        key={index}
        className="wheel-section"
        style={{
          transform: `rotate(${angle}deg) skewY(${skewAngle}deg)`,
          backgroundColor: item.color,
          width: '50%',
          height: '50%',
          position: 'absolute',
          transformOrigin: '0 100%',
          borderTopLeftRadius: index === 0 ? '100%' : '0',
        }}
      >
        <span className="section-text">{item.text}</span>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎡 Spinning Wheel</h1>
        <p>돌림판을 돌려보세요!</p>
      </header>
      
      <main className="app-main">
        <div className="wheel-container">
          <div 
            className="wheel"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {Array.from({ length: numItems }).map((_, index) => 
              createSection(index, numItems)
            )}
            <div className="wheel-center"></div>
          </div>
          
          <button 
            className="spin-button"
            onClick={handleSpin}
          >
            🎲 돌리기!
          </button>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Built with React & Vite</p>
      </footer>
    </div>
  )
}

export default SpinningWheel
