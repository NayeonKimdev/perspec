import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // localStorage에서 테마 설정 불러오기 (기본값: light)
  // 초기 로드 시 HTML에 즉시 적용
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    let initialTheme = savedTheme || 'light';
    
    // 저장된 테마가 없고 시스템이 다크 모드를 선호하는 경우
    if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
    }
    
    // 초기 로드 시 즉시 HTML에 적용
    const root = document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    return initialTheme;
  });

  // 테마 변경 시 HTML 클래스 및 localStorage 업데이트
  useEffect(() => {
    const root = document.documentElement;
    
    // 기존 클래스 제거 후 새로 추가 (강제 적용)
    root.classList.remove('dark', 'light');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

