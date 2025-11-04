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
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Perspec</h1>
          </div>
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
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 px-4 py-2 text-gray-600 text-sm font-medium">
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                    {item.subItems?.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleNavClick(subItem.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                          isActive(subItem.path)
                            ? 'bg-purple-100 text-purple-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" />
                        <span>{subItem.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>설정</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <header className="md:hidden bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Perspec</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">Perspec</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
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
                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3 px-4 py-2 text-gray-600 text-sm font-medium">
                          <Icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </div>
                        {item.subItems?.map((subItem, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() => handleNavClick(subItem.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                              isActive(subItem.path)
                                ? 'bg-purple-100 text-purple-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" />
                            <span>{subItem.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-8 pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    handleNavClick('/dashboard');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>설정</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>로그아웃</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;


