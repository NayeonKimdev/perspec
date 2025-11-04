import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, RefreshCw, Calendar, TrendingUp, Image, FileText, UserCircle, Heart, Brain } from 'lucide-react';
import api from '../services/api';
import { mediaApi, documentApi, mbtiApi, emotionApi } from '../services/api';

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    profile: false,
    images: 0,
    documents: 0,
    analyses: 0,
    mbti: null,
    emotion: null
  });
  const [dateFilter, setDateFilter] = useState('all'); // all, 30, 90

  useEffect(() => {
    fetchStatistics();
  }, [dateFilter]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 프로필 확인
      const profileRes = await api.get('/profile');
      const hasProfile = profileRes.data.profile !== null;

      // 이미지 개수
      const mediaRes = await mediaApi.getMediaList();
      const imageCount = mediaRes.data.total || 0;

      // 문서 개수
      const docRes = await documentApi.getDocumentList();
      const documentCount = docRes.data.total || 0;

      // 분석 개수
      let analysisCount = 0;
      try {
        const analysisRes = await api.get('/analysis/history');
        analysisCount = analysisRes.data.analyses?.length || 0;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">통계를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>대시보드로 돌아가기</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
                <BarChart3 className="w-10 h-10 text-blue-600" />
                <span>분석 대시보드</span>
              </h1>
              <p className="text-gray-600">
                모든 분석 결과를 한눈에 확인하세요
              </p>
            </div>
            <button
              onClick={fetchStatistics}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* KPI 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">프로필 완성도</h3>
              <UserCircle className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {calculateCompletion()}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">총 분석 횟수</h3>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.analyses}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              프로필 분석
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">MBTI 유형</h3>
              <UserCircle className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.mbti ? stats.mbti.mbti_type : '-'}
            </p>
            {stats.mbti && (
              <p className="text-sm text-gray-500 mt-2">
                신뢰도 {stats.mbti.confidence}%
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">감정 건강 점수</h3>
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.emotion ? stats.emotion.health_score : '-'}
            </p>
            {stats.emotion && (
              <p className="text-sm text-gray-500 mt-2">
                안정성 {stats.emotion.stability_score}점
              </p>
            )}
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 이미지/문서 분포 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Image className="w-6 h-6 text-blue-600" />
              <span>데이터 분포</span>
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">이미지</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.images}개</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ 
                      width: `${stats.images + stats.documents > 0 ? (stats.images / (stats.images + stats.documents)) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-700">문서</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.documents}개</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all"
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span>MBTI 지표</span>
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.mbti.dimensions || {}).map(([key, dim]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">{key}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {dim.type} ({dim.score}/100)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          dim.score >= 75 ? 'bg-green-600' :
                          dim.score >= 50 ? 'bg-blue-600' :
                          dim.score >= 25 ? 'bg-yellow-600' : 'bg-gray-400'
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Heart className="w-6 h-6 text-pink-600" />
                <span>감정 건강 상태</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">긍정 비율</span>
                    <span className="text-sm font-semibold text-green-600">
                      {stats.emotion.positive_ratio}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all"
                      style={{ width: `${stats.emotion.positive_ratio}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">부정 비율</span>
                    <span className="text-sm font-semibold text-red-600">
                      {stats.emotion.negative_ratio}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-red-500 h-4 rounded-full transition-all"
                      style={{ width: `${stats.emotion.negative_ratio}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">안정성 점수</span>
                    <span className={`text-2xl font-bold ${
                      stats.emotion.stability_score >= 75 ? 'text-green-600' :
                      stats.emotion.stability_score >= 50 ? 'text-yellow-600' : 'text-red-600'
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-pink-600" />
                <span>주요 감정</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.emotion.primary_emotions.map((emotion, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 rounded-full text-sm font-medium"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 활동 요약 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>활동 요약</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Image className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.images}</p>
              <p className="text-sm text-gray-600">이미지</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              <p className="text-sm text-gray-600">문서</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.analyses}</p>
              <p className="text-sm text-gray-600">분석</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <UserCircle className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {stats.mbti ? '1' : '0'}
              </p>
              <p className="text-sm text-gray-600">MBTI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


