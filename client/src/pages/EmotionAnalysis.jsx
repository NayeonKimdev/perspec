import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { emotionApi } from '../services/api';

const EmotionAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const response = await emotionApi.getLatestAnalysis();
        setAnalysis(response.data.analysis);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('감정 분석 조회 실패:', error);
        }
      } finally {
        setAnalysisLoading(false);
      }
    };

    fetchLatestAnalysis();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await emotionApi.analyzeEmotions();
      if (response.data.analysis) {
        setAnalysis(response.data.analysis);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setError(error.response.data.message || '충분한 데이터가 없습니다.');
      } else {
        setError('감정 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      console.error('감정 분석 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthBgColor = (score) => {
    if (score >= 75) return 'from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600';
    if (score >= 50) return 'from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600';
    return 'from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600';
  };

  const getHealthRingColor = (score) => {
    if (score >= 75) return 'stroke-green-500 dark:stroke-green-400';
    if (score >= 50) return 'stroke-yellow-500 dark:stroke-yellow-400';
    return 'stroke-red-500 dark:stroke-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-red-900/20 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto w-full">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            감정 패턴 분석
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            당신의 감정을 종합적으로 분석하여 건강 상태를 파악합니다
          </p>
        </div>

        {/* 분석 시작 버튼 */}
        {!analysis && !analysisLoading && !loading && (
          <div className="text-center mb-12">
            <button
              onClick={handleAnalyze}
              className="px-12 py-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="w-6 h-6" />
                <span>감정 분석 시작</span>
              </div>
            </button>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-200">
            <Loader2 className="w-16 h-16 text-pink-600 dark:text-pink-400 animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              감정을 분석하고 있습니다...
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              이 작업은 30-60초 정도 소요됩니다.
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {analysis && !loading && (
          <div className="space-y-6">
            {/* 감정 건강 점수 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-colors duration-200">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
                감정 건강 점수
              </h2>
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  {/* 원형 게이지 */}
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 84}`}
                      strokeDashoffset={`${2 * Math.PI * 84 * (1 - analysis.health_score / 100)}`}
                      className={`${getHealthRingColor(analysis.health_score)} transition-all duration-1000`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${getHealthColor(analysis.health_score)}`}>
                        {analysis.health_score}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">점</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 주요 감정 */}
            {analysis.primary_emotions && analysis.primary_emotions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">주요 감정</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {analysis.primary_emotions.map((emotion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full"
                    >
                      <span className="text-pink-800 dark:text-pink-300 font-medium">{emotion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 긍정/부정 비율 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                긍정/부정 비율
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-green-700 dark:text-green-400 font-medium">긍정</span>
                    <span className="text-gray-600 dark:text-gray-400">{analysis.positive_ratio}%</span>
                  </div>
                  <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 transition-all duration-500"
                      style={{ width: `${analysis.positive_ratio}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-red-700 dark:text-red-400 font-medium">부정</span>
                    <span className="text-gray-600 dark:text-gray-400">{analysis.negative_ratio}%</span>
                  </div>
                  <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600 transition-all duration-500"
                      style={{ width: `${analysis.negative_ratio}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 감정 안정성 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                감정 안정성
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getHealthBgColor(analysis.stability_score)} transition-all duration-500`}
                      style={{ width: `${analysis.stability_score}%` }}
                    />
                  </div>
                </div>
                <span className={`text-2xl font-bold ${getHealthColor(analysis.stability_score)}`}>
                  {analysis.stability_score}점
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                {analysis.stability_score >= 70 
                  ? '감정이 안정적입니다.' 
                  : analysis.stability_score >= 50
                  ? '감정 변화가 다소 있습니다.'
                  : '감정 변화가 심합니다.'}
              </p>
            </div>

            {/* 감정 패턴 */}
            {analysis.emotion_patterns && analysis.emotion_patterns.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  감정 패턴
                </h2>
                <ul className="space-y-2">
                  {analysis.emotion_patterns.map((pattern, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">{pattern}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 주의사항 */}
            {analysis.concerns && analysis.concerns.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">주의사항</h2>
                </div>
                <ul className="space-y-2">
                  {analysis.concerns.map((concern, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-yellow-900 dark:text-yellow-200">{concern}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선 제안 */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  개선 제안
                </h2>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 다시 분석 버튼 */}
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                className="px-8 py-3 bg-pink-600 dark:bg-pink-700 text-white rounded-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors"
              >
                다시 분석하기
              </button>
            </div>
          </div>
        )}

        {/* 분석 결과 없음 */}
        {!analysis && !analysisLoading && !loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-200">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              아직 감정 분석 결과가 없습니다. 분석을 시작해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionAnalysis;


