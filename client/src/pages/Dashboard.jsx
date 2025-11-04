import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, History, TrendingUp, Image, Upload, Sparkles, CheckCircle2, FileText, Heart, UserCircle, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { mediaApi, documentApi, mbtiApi, emotionApi, reportApi } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [recentImages, setRecentImages] = useState([]);
  const [imageAnalysisSummary, setImageAnalysisSummary] = useState(null);
  const [documentCount, setDocumentCount] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [latestMBTI, setLatestMBTI] = useState(null);
  const [latestEmotion, setLatestEmotion] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);

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

    const fetchAnalysisCount = async () => {
      try {
        const response = await api.get('/analysis/history');
        setAnalysisCount(response.data.total || response.data.analyses?.length || 0);
      } catch (error) {
        console.error('분석 개수 조회 실패:', error);
        setAnalysisCount(0);
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

    const fetchImageAnalysisSummary = async () => {
      try {
        const response = await mediaApi.getAnalysisSummary();
        setImageAnalysisSummary(response.data.summary);
      } catch (error) {
        console.error('이미지 분석 요약 조회 실패:', error);
      }
    };

    const fetchDocuments = async () => {
      try {
        const response = await documentApi.getDocumentList({ limit: 3 });
        setDocumentCount(response.data.total || 0);
        setRecentDocuments(response.data.documents || []);
      } catch (error) {
        console.error('문서 조회 실패:', error);
      }
    };

    const fetchMBTI = async () => {
      try {
        const response = await mbtiApi.getHistory();
        if (response.data.estimations && response.data.estimations.length > 0) {
          const latestId = response.data.estimations[0].id;
          const detailRes = await mbtiApi.getEstimationById(latestId);
          setLatestMBTI(detailRes.data.estimation);
        }
      } catch (error) {
        // MBTI가 없을 수 있으므로 에러는 무시
      }
    };

    const fetchEmotion = async () => {
      try {
        const response = await emotionApi.getLatestAnalysis();
        setLatestEmotion(response.data.analysis);
      } catch (error) {
        // 감정 분석이 없을 수 있으므로 에러는 무시
      }
    };

    const fetchReports = async () => {
      try {
        const response = await reportApi.getReportList();
        setReportsCount(response.data.reports?.length || 0);
      } catch (error) {
        // 에러 무시
      }
    };

    checkProfile();
    fetchLatestAnalysis();
    fetchAnalysisCount();
    fetchMedia();
    fetchImageAnalysisSummary();
    fetchDocuments();
    fetchMBTI();
    fetchEmotion();
    fetchReports();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    환영합니다, {user.email}님!
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Perspec 사용자 분석 플랫폼에 오신 것을 환영합니다.
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                {/* 프로필 상태 카드 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    프로필 상태
                  </h2>
                  {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">확인 중...</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-green-600" />
                            최근 분석 결과
                          </h2>
                          <button
                            onClick={() => navigate('/analysis-history')}
                            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            히스토리 보기 →
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>{new Date(latestAnalysis.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 transition-colors duration-200">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      내 갤러리
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {recentImages.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <Image className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">아직 업로드한 이미지가 없습니다</p>
                      </div>
                    ) : (
                      <>
                        {recentImages.slice(0, 3).map((image) => (
                          <div
                            key={image.id}
                            className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                            onClick={() => navigate('/gallery')}
                          >
                            <img
                              src={image.file_url}
                              alt={image.file_name}
                              className="w-full h-full object-cover"
                              style={{ minHeight: '120px', maxHeight: '120px' }}
                              loading="lazy"
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

                {/* 이미지 분석 요약 위젯 */}
                {imageAnalysisSummary && imageAnalysisSummary.analyzed_images > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        이미지 분석 현황
                      </h2>
                      <button
                        onClick={() => navigate('/image-analysis-summary')}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                      >
                        전체 요약 보기 →
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                          분석 완료: {imageAnalysisSummary.analyzed_images}개
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          대기 중: {imageAnalysisSummary.pending_images}개
                        </span>
                      </div>
                    </div>

                    {/* 주요 관심사 */}
                    {imageAnalysisSummary.top_interests && imageAnalysisSummary.top_interests.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 transition-colors duration-200">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">주요 관심사 Top 3</h3>
                        <div className="flex flex-wrap gap-2">
                          {imageAnalysisSummary.top_interests.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                              {item.interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate('/image-analysis-summary')}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                      >
                        전체 분석 요약 보기
                      </button>
                      <button
                        onClick={() => navigate('/gallery')}
                        className="px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium"
                      >
                        갤러리
                      </button>
                    </div>
                  </div>
                )}

                {/* 문서 섹션 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      내 문서
                    </h2>
                  </div>
                  
                  <div className="mb-4">
                    {recentDocuments.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">아직 업로드한 문서가 없습니다</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentDocuments.slice(0, 3).map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => navigate(`/documents/${doc.id}`)}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{doc.file_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {doc.content_preview || '내용 미리보기 없음'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate('/documents')}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      전체 보기 ({documentCount}개)
                    </button>
                    <button
                      onClick={() => navigate('/document-upload')}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      문서 업로드
                    </button>
                  </div>
                </div>

                {/* 프로필 완성도 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    프로필 완성도
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">프로필 작성</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{hasProfile ? '25%' : '0%'}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: hasProfile ? '25%' : '0%' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">이미지 업로드</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{Math.min(mediaCount * 2.5, 25).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(mediaCount * 2.5, 25)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">문서 업로드</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{Math.min(documentCount * 2.5, 25).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(documentCount * 2.5, 25)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">분석 완료</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{Math.min(analysisCount * 2.5, 25).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(analysisCount * 2.5, 25)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">전체 완성도</span>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {Math.min(
                          (hasProfile ? 25 : 0) + 
                          Math.min(mediaCount * 2.5, 25) + 
                          Math.min(documentCount * 2.5, 25) + 
                          Math.min(analysisCount * 2.5, 25),
                          100
                        ).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* MBTI 결과 카드 */}
                {latestMBTI ? (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        MBTI 성격 유형
                      </h2>
                      <button
                        onClick={() => navigate(`/mbti/${latestMBTI.id}`)}
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                      >
                        자세히 보기 →
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 transition-colors duration-200">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          {latestMBTI.mbti_type}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          {latestMBTI.description || 'MBTI 분석 결과'}
                        </p>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">신뢰도:</span>
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">{latestMBTI.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/mbti')}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      MBTI 다시 분석하기
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      MBTI 분석
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      아직 MBTI 분석을 하지 않았습니다. 분석하면 성격 유형을 확인할 수 있습니다.
                    </p>
                    <button
                      onClick={() => navigate('/mbti')}
                      className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      MBTI 분석하기 →
                    </button>
                  </div>
                )}

                {/* 감정 건강 점수 카드 */}
                {latestEmotion ? (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                        감정 건강 점수
                      </h2>
                      <button
                        onClick={() => navigate('/emotion')}
                        className="text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
                      >
                        자세히 보기 →
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 transition-colors duration-200">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 mb-3">
                          <span className={`text-3xl font-bold ${
                            latestEmotion.health_score >= 75 ? 'text-green-600 dark:text-green-400' :
                            latestEmotion.health_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {latestEmotion.health_score}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          안정성: {latestEmotion.stability_score}점
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                          긍정 {latestEmotion.positive_ratio}% / 부정 {latestEmotion.negative_ratio}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/emotion')}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-medium"
                    >
                      감정 분석 다시하기
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      감정 분석
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      이미지를 업로드하면 더 정확한 감정 분석이 가능합니다.
                    </p>
                    <button
                      onClick={() => navigate('/emotion')}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-medium"
                    >
                      감정 분석하기 →
                    </button>
                  </div>
                )}

                {/* 종합 레포트 카드 */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      종합 분석 레포트
                    </h2>
                    {reportsCount > 0 && (
                      <span className="text-sm text-gray-600">
                        {reportsCount}개의 레포트
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    모든 데이터를 종합하여 당신에 대한 완전한 분석 레포트를 생성합니다.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/reports')}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      레포트 생성
                    </button>
                    {reportsCount > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await reportApi.getReportList();
                            if (res.data.reports && res.data.reports.length > 0) {
                              navigate(`/reports/${res.data.reports[0].id}`);
                            }
                          } catch (error) {
                            navigate('/reports');
                          }
                        }}
                        className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                      >
                        최근 레포트 보기
                      </button>
                    )}
                  </div>
                </div>

                {/* 빠른 액션 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    빠른 액션
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => navigate('/profile')}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">프로필</span>
                    </button>
                    <button
                      onClick={() => navigate('/upload')}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">업로드</span>
                    </button>
                    <button
                      onClick={() => navigate('/analytics')}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">통계</span>
                    </button>
                    <button
                      onClick={() => navigate('/reports')}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">레포트</span>
                    </button>
                  </div>
                </div>

                {/* 대시보드 개요 */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 transition-colors duration-200">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    대시보드 개요
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">프로필</h3>
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {hasProfile ? '✓' : '✗'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">MBTI</h3>
                        <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {latestMBTI ? latestMBTI.mbti_type : '-'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">감정 점수</h3>
                        <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {latestEmotion ? `${latestEmotion.health_score}` : '-'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-colors duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">레포트</h3>
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportsCount}
                      </p>
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
