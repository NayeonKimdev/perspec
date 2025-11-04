import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, RefreshCw, Calendar, TrendingUp, Image, FileText, UserCircle, Heart, Brain, Filter, Download } from 'lucide-react';
import api from '../services/api';
import { mediaApi, documentApi, mbtiApi, emotionApi } from '../services/api';
import { downloadCSV, downloadJSON } from '../utils/exportUtils';
import { useToast } from '../components/Toast';

const Analytics = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    profile: false,
    images: 0,
    documents: 0,
    analyses: 0,
    mbti: null,
    emotion: null
  });
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchStatistics();
  }, [dateFilter]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 프로필 확인
      const profileRes = await api.get('/profile');
      const hasProfile = profileRes.data.profile !== null;

      // 날짜 필터 파라미터 구성
      const dateParams = dateFilter !== 'all' ? { date_filter: dateFilter } : {};

      // 이미지 개수 (날짜 필터 적용)
      const mediaRes = await mediaApi.getMediaList({ limit: 1000, ...dateParams });
      let imageCount = mediaRes.data.total || 0;
      
      // 날짜 필터가 적용된 경우 날짜 범위 내 이미지만 카운트
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        const filteredImages = (mediaRes.data.media || []).filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= startDate;
        });
        imageCount = filteredImages.length;
      }

      // 문서 개수 (날짜 필터 적용)
      const docRes = await documentApi.getDocumentList({ limit: 1000, ...dateParams });
      let documentCount = docRes.data.total || 0;
      
      // 날짜 필터가 적용된 경우 날짜 범위 내 문서만 카운트
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        const filteredDocs = (docRes.data.documents || []).filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= startDate;
        });
        documentCount = filteredDocs.length;
      }

      // 분석 개수 (날짜 필터 적용)
      let analysisCount = 0;
      try {
        const analysisParams = dateFilter !== 'all' ? { date_filter: dateFilter } : {};
        const analysisRes = await api.get('/analysis/history', { params: analysisParams });
        analysisCount = analysisRes.data.total || analysisRes.data.analyses?.length || 0;
      } catch (error) {
        console.error('분석 조회 실패:', error);
      }

      // MBTI
      let mbti = null;
      try {
        const mbtiRes = await mbtiApi.getHistory();
        if (mbtiRes.data.estimations && mbtiRes.data.estimations.length > 0) {
          const latestId = mbtiRes.data.estimations[0].id;
          const detailRes = await mbtiApi.getEstimationById(latestId);
          mbti = detailRes.data.estimation;
        }
      } catch (error) {
        // 무시
      }

      // 감정 분석
      let emotion = null;
      try {
        const emotionRes = await emotionApi.getLatestAnalysis();
        emotion = emotionRes.data.analysis;
      } catch (error) {
        // 무시
      }

      setStats({
        profile: hasProfile,
        images: imageCount,
        documents: documentCount,
        analyses: analysisCount,
        mbti,
        emotion
      });
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    const total = 4;
    let completed = 0;
    if (stats.profile) completed++;
    if (stats.images > 0) completed++;
    if (stats.documents > 0) completed++;
    if (stats.analyses > 0) completed++;
    return Math.round((completed / total) * 100);
  };

  const handleExportData = async (format) => {
    try {
      // 데이터 수집
      const exportData = {
        exportDate: new Date().toISOString(),
        dateFilter,
        statistics: {
          profile: stats.profile,
          images: stats.images,
          documents: stats.documents,
          analyses: stats.analyses,
          mbti: stats.mbti,
          emotion: stats.emotion
        }
      };

      // 추가 데이터 수집
      try {
        const [mediaRes, docRes, analysisRes] = await Promise.all([
          mediaApi.getMediaList({ limit: 1000, ...(dateFilter !== 'all' ? { date_filter: dateFilter } : {}) }),
          documentApi.getDocumentList({ limit: 1000, ...(dateFilter !== 'all' ? { date_filter: dateFilter } : {}) }),
          api.get('/analysis/history', { params: { limit: 1000, ...(dateFilter !== 'all' ? { date_filter: dateFilter } : {}) } })
        ]);

        exportData.detailedData = {
          media: mediaRes.data.media || [],
          documents: docRes.data.documents || [],
          analyses: analysisRes.data.analyses || []
        };
      } catch (error) {
        console.error('상세 데이터 수집 실패:', error);
      }

      const filename = `analytics_${dateFilter}_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        // CSV 형식으로 변환
        const csvData = [
          {
            '항목': '프로필 완성',
            '값': stats.profile ? '완료' : '미완료'
          },
          {
            '항목': '이미지 개수',
            '값': stats.images
          },
          {
            '항목': '문서 개수',
            '값': stats.documents
          },
          {
            '항목': '분석 개수',
            '값': stats.analyses
          },
          {
            '항목': 'MBTI 유형',
            '값': stats.mbti?.mbti_type || '-'
          },
          {
            '항목': '감정 건강 점수',
            '값': stats.emotion?.health_score || '-'
          }
        ];
        downloadCSV(csvData, filename, ['항목', '값']);
        toast.success('CSV 파일이 다운로드되었습니다!');
      } else {
        downloadJSON(exportData, filename);
        toast.success('JSON 파일이 다운로드되었습니다!');
      }
    } catch (error) {
      console.error('데이터 내보내기 실패:', error);
      toast.error('데이터 내보내기 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>대시보드로 돌아가기</span>
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-3">
                <BarChart3 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <span>분석 대시보드</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                모든 분석 결과를 한눈에 확인하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 날짜 필터 */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                {['all', 'today', 'week', 'month'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      dateFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    {filter === 'all' ? '전체' :
                     filter === 'today' ? '오늘' :
                     filter === 'week' ? '주간' : '월간'}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchStatistics}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>새로고침</span>
              </button>
              {/* 데이터 내보내기 드롭다운 */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-5 h-5" />
                  <span>내보내기</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExportData('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                  >
                    CSV로 내보내기
                  </button>
                  <button
                    onClick={() => handleExportData('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                  >
                    JSON으로 내보내기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">프로필 완성도</h3>
              <UserCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {calculateCompletion()}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">총 분석 횟수</h3>
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.analyses}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              프로필 분석
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">MBTI 유형</h3>
              <UserCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.mbti ? stats.mbti.mbti_type : '-'}
            </p>
            {stats.mbti && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                신뢰도 {stats.mbti.confidence}%
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">감정 건강 점수</h3>
              <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.emotion ? stats.emotion.health_score : '-'}
            </p>
            {stats.emotion && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                안정성 {stats.emotion.stability_score}점
              </p>
            )}
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 이미지/문서 분포 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
              <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>데이터 분포</span>
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">이미지</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.images}개</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all"
                    style={{ 
                      width: `${stats.images + stats.documents > 0 ? (stats.images / (stats.images + stats.documents)) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">문서</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.documents}개</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-4 rounded-full transition-all"
                    style={{ 
                      width: `${stats.images + stats.documents > 0 ? (stats.documents / (stats.images + stats.documents)) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MBTI 지표 레이더 차트 (간단 버전) */}
          {stats.mbti && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span>MBTI 지표</span>
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.mbti.dimensions || {}).map(([key, dim]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{key}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {dim.type} ({dim.score}/100)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          dim.score >= 75 ? 'bg-green-600 dark:bg-green-500' :
                          dim.score >= 50 ? 'bg-blue-600 dark:bg-blue-500' :
                          dim.score >= 25 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-gray-400 dark:bg-gray-600'
                        }`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 감정 건강 상태 */}
          {stats.emotion && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                <span>감정 건강 상태</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">긍정 비율</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {stats.emotion.positive_ratio}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-green-500 dark:bg-green-500 h-4 rounded-full transition-all"
                      style={{ width: `${stats.emotion.positive_ratio}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">부정 비율</span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {stats.emotion.negative_ratio}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-red-500 dark:bg-red-500 h-4 rounded-full transition-all"
                      style={{ width: `${stats.emotion.negative_ratio}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">안정성 점수</span>
                    <span className={`text-2xl font-bold ${
                      stats.emotion.stability_score >= 75 ? 'text-green-600 dark:text-green-400' :
                      stats.emotion.stability_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stats.emotion.stability_score}점
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 주요 감정 */}
          {stats.emotion && stats.emotion.primary_emotions && stats.emotion.primary_emotions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                <span>주요 감정</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.emotion.primary_emotions.map((emotion, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-800 dark:text-pink-300 rounded-full text-sm font-medium"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 활동 요약 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>활동 요약</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Image className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.images}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">이미지</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <FileText className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.documents}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">문서</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.analyses}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">분석</p>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
              <UserCircle className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.mbti ? '1' : '0'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">MBTI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


