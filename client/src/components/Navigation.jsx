import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  UserCircle,
  Image,
  FileText,
  Brain,
  Heart,
  FileCheck,
  BarChart3,
  Menu,
  X,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: '대시보드',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      title: '프로필',
      icon: User,
      subItems: [
        { title: '프로필 보기', path: '/profile-view' },
        { title: '프로필 수정', path: '/profile' }
      ]
    },
    {
      title: '미디어',
      icon: Image,
      subItems: [
        { title: '이미지 갤러리', path: '/gallery' },
        { title: '이미지 업로드', path: '/upload' },
        { title: '이미지 분석 요약', path: '/image-analysis-summary' }
      ]
    },
    {
      title: '문서',
      icon: FileText,
      subItems: [
        { title: '문서 목록', path: '/documents' },
        { title: '문서 업로드', path: '/document-upload' }
      ]
    },
    {
      title: '분석',
      icon: Brain,
      subItems: [
        { title: '프로필 분석', path: '/start-analysis' },
        { title: '분석 히스토리', path: '/analysis-history' },
        { title: 'MBTI 분석', path: '/mbti' },
        { title: '감정 분석', path: '/emotion' }
      ]
    },
    {
      title: '레포트',
      icon: FileCheck,
      subItems: [
        { title: '레포트 생성', path: '/reports' }
      ]
    },
    {
      title: '통계 대시보드',
      path: '/analytics',
      icon: BarChart3
    },
    {
      title: '설정',
      path: '/settings',
      icon: Settings
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg h-screen sticky top-0 transition-colors duration-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center space-x-3 w-full hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Perspec</h1>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isItemActive = isActive(item.path || item.subItems?.[0]?.path || '');

            return (
              <div key={index} className="mb-2">
                {item.path ? (
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isItemActive
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    aria-label={item.title}
                    aria-current={isItemActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                    {item.subItems?.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleNavClick(subItem.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(subItem.path)
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        aria-label={subItem.title}
                        aria-current={isActive(subItem.path) ? 'page' : undefined}
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" aria-hidden="true" />
                        <span>{subItem.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* 테마 토글 */}
          <div className="flex items-center justify-between px-4 py-3 mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">다크 모드</span>
            <ThemeToggle />
          </div>
          
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 모바일 헤더 - 절대 위치로 고정 */}
      <header className="md:hidden bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-50 transition-colors duration-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Perspec</h1>
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* 모바일용 헤더 공간 확보 */}
      <div className="md:hidden h-16"></div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="md:hidden fixed top-0 right-0 w-64 h-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto transition-transform duration-300 z-50" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => handleNavClick('/dashboard')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Perspec</h1>
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <div key={index} className="mb-4">
                    {item.path ? (
                      <button
                        onClick={() => handleNavClick(item.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        aria-label={item.title}
                        aria-current={isActive(item.path) ? 'page' : undefined}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 px-4 py-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                          <Icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                        {item.subItems?.map((subItem, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() => handleNavClick(subItem.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive(subItem.path)
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            aria-label={subItem.title}
                            aria-current={isActive(subItem.path) ? 'page' : undefined}
                          >
                            <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" aria-hidden="true" />
                            <span>{subItem.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* 테마 토글 */}
                <div className="flex items-center justify-between px-4 py-3 mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">다크 모드</span>
                  <ThemeToggle />
                </div>
                
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="설정"
                >
                  <Settings className="w-5 h-5" />
                  <span>설정</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                  <span>로그아웃</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Navigation;


