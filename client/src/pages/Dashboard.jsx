import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, History, TrendingUp, Image, Upload } from 'lucide-react';
import api from '../services/api';
import { mediaApi } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [recentImages, setRecentImages] = useState([]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await api.get('/profile');
        setHasProfile(response.data.profile !== null);
      } catch (error) {
        console.error('프로필 확인 실패:', error);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    const fetchLatestAnalysis = async () => {
      try {
        const response = await api.get('/analysis/history?limit=1');
        if (response.data.analyses && response.data.analyses.length > 0) {
          setLatestAnalysis(response.data.analyses[0]);
        }
      } catch (error) {
        console.error('최근 분석 조회 실패:', error);
      }
    };

    const fetchMedia = async () => {
      try {
        const response = await mediaApi.getMediaList({ limit: 3 });
        setMediaCount(response.data.total);
        setRecentImages(response.data.media);
      } catch (error) {
        console.error('미디어 조회 실패:', error);
      }
    };

    checkProfile();
    fetchLatestAnalysis();
    fetchMedia();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                대시보드 홈
              </button>
              {hasProfile && (
                <>
                  <button
                    onClick={() => navigate('/profile-view')}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    프로필 보기
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    프로필 수정
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    환영합니다, {user.email}님!
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Perspec 사용자 분석 플랫폼에 오신 것을 환영합니다.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                {/* 프로필 상태 카드 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    프로필 상태
                  </h2>
                  {loading ? (
                    <p className="text-gray-500">확인 중...</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        {hasProfile 
                          ? '✅ 프로필이 작성되어 있습니다' 
                          : '⚠️ 아직 프로필을 작성하지 않았습니다'}
                      </p>
                      <button
                        onClick={() => navigate('/profile')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {hasProfile ? '프로필 수정하기' : '프로필 작성하기'}
                      </button>
                    </>
                  )}
                </div>

                {/* AI 분석 섹션 */}
                {hasProfile && (
                  <>
                    <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Brain className="w-6 h-6" />
                            프로필 분석하기
                          </h2>
                          <p className="text-white/90 mb-4">
                            AI가 당신의 프로필을 분석하여 성격, 진로, 취미, 여행지를 추천해드립니다
                          </p>
                          <button
                            onClick={() => navigate('/start-analysis')}
                            className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                          >
                            분석 시작하기
                          </button>
                        </div>
                        <div className="hidden md:block">
                          <Brain className="w-32 h-32 text-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* 최근 분석 결과 */}
                    {latestAnalysis && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-green-600" />
                            최근 분석 결과
                          </h2>
                          <button
                            onClick={() => navigate('/analysis-history')}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            히스토리 보기 →
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <span>{new Date(latestAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {latestAnalysis.personality_analysis || '분석 내용이 없습니다.'}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/analysis/${latestAnalysis.id}`)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                          자세히 보기
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* 갤러리 섹션 */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      내 갤러리
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {recentImages.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm mb-4">아직 업로드한 이미지가 없습니다</p>
                      </div>
                    ) : (
                      <>
                        {recentImages.slice(0, 3).map((image) => (
                          <div
                            key={image.id}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                            onClick={() => navigate('/gallery')}
                          >
                            <img
                              src={image.file_url}
                              alt={image.file_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/gallery')}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      갤러리 보기 ({mediaCount}개)
                    </button>
                    <button
                      onClick={() => navigate('/upload')}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      이미지 업로드
                    </button>
                  </div>
                </div>

                {/* 대시보드 개요 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    대시보드 개요
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">프로필 상태</h3>
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {hasProfile ? '완료' : '미작성'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">분석 횟수</h3>
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {latestAnalysis ? '1+' : '0'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                        <History className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">활성</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
