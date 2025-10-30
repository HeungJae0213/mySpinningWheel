import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import WelcomePage from './pages/WelcomePage.jsx';
import SettingPage from './pages/SettingPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import './App.css';

const WELCOME_PATH = '/welcome';
const SETTING_PATH = '/setting';
const LOADING_PATH = '/loading';
const RESULT_PATH = '/result';

function AppRoutes() {
  const [wheelItems, setWheelItems] = useState([])
  const [savedSettings, setSavedSettings] = useState(null)
  const navigate = useNavigate()

  const handleWelcomeConfirm = () => {
    navigate(SETTING_PATH)
  }

  const handleGenerate = (items) => {
    setWheelItems(items)
    setSavedSettings(items) // 설정 저장
    navigate(LOADING_PATH)
    
    setTimeout(() => {
      navigate(RESULT_PATH)
    }, 100)
  }

  const handleBackToSetting = () => {
    navigate(SETTING_PATH)
  }

  return (
    <Routes>
      {/* 기본 루트로 들어오면 /welcome으로 이동 */}
      <Route path="/" element={<Navigate to={WELCOME_PATH} replace />} />
      <Route path={WELCOME_PATH} element={<WelcomePage onConfirm={handleWelcomeConfirm} />} />
      <Route path={SETTING_PATH} element={<SettingPage onGenerate={handleGenerate} savedItems={savedSettings} />} />
      <Route path={LOADING_PATH} element={<LoadingPage />} />
      <Route path={RESULT_PATH} element={<ResultPage items={wheelItems} onBack={handleBackToSetting} />} />
      <Route path="*" element={<Navigate to={WELCOME_PATH} replace />} />
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />;
}