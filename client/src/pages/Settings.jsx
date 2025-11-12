import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Globe, Moon, Sun, Save, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useTheme } from '../contexts/ThemeContext';
import { setLanguage, getCurrentLanguage } from '../utils/i18n';

const Settings = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    analysisNotifications: true,
    reportNotifications: true,
    language: getCurrentLanguage(),
    theme: theme
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 저장된 설정 불러오기
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // 언어 변경
      if (settings.language !== getCurrentLanguage()) {
        setLanguage(settings.language);
      }
      
      toast.success('설정이 저장되었습니다!');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast.error('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>대시보드로 돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">설정</h1>
          <p className="text-gray-600 dark:text-gray-400">앱 설정을 관리하세요</p>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">알림 설정</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 dark:text-gray-300">이메일 알림</span>
              </div>
              <button
                onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={settings.emailNotifications}
                aria-label="이메일 알림"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 dark:text-gray-300">분석 완료 알림</span>
              </div>
              <button
                onClick={() => handleChange('analysisNotifications', !settings.analysisNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.analysisNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={settings.analysisNotifications}
                aria-label="분석 완료 알림"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.analysisNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 dark:text-gray-300">레포트 생성 알림</span>
              </div>
              <button
                onClick={() => handleChange('reportNotifications', !settings.reportNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reportNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={settings.reportNotifications}
                aria-label="레포트 생성 알림"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reportNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* 언어 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">언어 설정</h2>
          </div>
          
          <div className="space-y-2">
            {['ko', 'en'].map((lang) => (
              <label key={lang} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  checked={settings.language === lang}
                  onChange={() => handleChange('language', lang)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {lang === 'ko' ? '한국어' : 'English'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 테마 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center space-x-3 mb-6">
            {theme === 'dark' ? (
              <Moon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <Sun className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">테마 설정</h2>
          </div>
          
          <button
            onClick={() => {
              toggleTheme();
              handleChange('theme', theme === 'dark' ? 'light' : 'dark');
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span>라이트 모드로 변경</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>다크 모드로 변경</span>
              </>
            )}
          </button>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>설정 저장</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;












