import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Briefcase, Heart, MapPin, ArrowLeft, RefreshCw, History } from 'lucide-react';
import api from '../services/api';

const AnalysisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/analysis/${id}`);
        setAnalysis(response.data.analysis);
      } catch (err) {
        console.error('분석 결과 조회 실패:', err);
        setError(err.response?.data?.message || '분석 결과를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error || '분석 결과를 찾을 수 없습니다'}</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/start-analysis')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              새로운 분석 하기
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">분석 결과</h1>
              <p className="text-gray-600">
                {formatDate(analysis.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/start-analysis')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로운 분석
              </button>
              <button
                onClick={() => navigate('/analysis-history')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                히스토리
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                대시보드
              </button>
            </div>
          </div>
        </div>

        {/* 분석 결과 카드들 */}
        {(!analysis.personality_analysis && 
          !analysis.career_recommendations && 
          !analysis.hobby_suggestions && 
          !analysis.travel_recommendations &&
          !analysis.additional_insights) ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-4">분석 결과를 불러오는 중</h2>
            <p className="text-yellow-700">잠시만 기다려주세요...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 성격 분석 */}
          {analysis.personality_analysis && (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">성격 분석</h2>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {analysis.personality_analysis}
                </p>
              </div>
            </div>
          )}

          {/* 추천 진로/직업 */}
          {analysis.career_recommendations && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">추천 진로/직업</h2>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {analysis.career_recommendations}
                </p>
              </div>
            </div>
          )}

          {/* 취미 추천 */}
          {analysis.hobby_suggestions && (
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Heart className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">취미 추천</h2>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {analysis.hobby_suggestions}
                </p>
              </div>
            </div>
          )}

          {/* 여행지 추천 */}
          {analysis.travel_recommendations && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">여행지 추천</h2>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {analysis.travel_recommendations}
                </p>
              </div>
            </div>
          )}
          </div>
        )}

        {/* 전체 분석 결과 (4개 섹션이 모두 비어있을 때만 표시) */}
        {analysis.additional_insights && 
         (!analysis.personality_analysis || 
          !analysis.career_recommendations || 
          !analysis.hobby_suggestions || 
          !analysis.travel_recommendations) && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">전체 분석 결과</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {analysis.additional_insights}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;

