import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { ArrowLeft, RefreshCw, Share2, TrendingUp, Briefcase, Lightbulb, Target } from 'lucide-react';
import { mbtiApi } from '../services/api';

const MBTIResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [estimation, setEstimation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstimation = async () => {
      try {
        const response = await mbtiApi.getEstimationById(id);
        setEstimation(response.data.estimation);
      } catch (error) {
        console.error('MBTI 결과 조회 실패:', error);
        setError('MBTI 결과를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEstimation();
    }
  }, [id]);

  const getScoreColor = (score) => {
    if (score >= 75) return 'from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500';
    if (score >= 50) return 'from-blue-500 to-cyan-600 dark:from-blue-400 dark:to-cyan-500';
    if (score >= 25) return 'from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400';
    return 'from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return 'text-green-600 dark:text-green-400';
    if (confidence >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !estimation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || '결과를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/mbti')}
            className="px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const dimensions = [
    {
      key: 'EI',
      label: '외향 / 내향',
      dimension: estimation.dimensions?.EI,
      labels: { left: '내향 (I)', right: '외향 (E)' }
    },
    {
      key: 'SN',
      label: '감각 / 직관',
      dimension: estimation.dimensions?.SN,
      labels: { left: '감각 (S)', right: '직관 (N)' }
    },
    {
      key: 'TF',
      label: '사고 / 감정',
      dimension: estimation.dimensions?.TF,
      labels: { left: '사고 (T)', right: '감정 (F)' }
    },
    {
      key: 'JP',
      label: '판단 / 인식',
      dimension: estimation.dimensions?.JP,
      labels: { left: '판단 (J)', right: '인식 (P)' }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mbti')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
        </div>

        {/* MBTI 유형 표시 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 text-center transition-colors duration-200">
          <div className="mb-6">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">당신은</p>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
              {estimation.mbti_type}
            </h1>
            <p className="text-2xl text-gray-700 dark:text-gray-300 font-semibold mb-4">
              {estimation.description || '분석 결과'}
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <span className="text-gray-600 dark:text-gray-300">신뢰도:</span>
              <span className={`font-semibold ${getConfidenceColor(estimation.confidence)}`}>
                {estimation.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* 4개 지표 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {dimensions.map((dim) => {
            const score = dim.dimension?.score || 50;
            const type = dim.dimension?.type || '?';
            const description = dim.dimension?.description || '';

            return (
              <div key={dim.key} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{dim.label}</h3>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{type}</span>
                  </div>
                  
                  {/* 프로그레스 바 */}
                  <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{dim.labels.left}</span>
                    <span className="font-semibold">{score}/100</span>
                    <span>{dim.labels.right}</span>
                  </div>
                </div>
                
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{description}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* 특징 섹션 */}
        {estimation.characteristics && estimation.characteristics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">주요 특징</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {estimation.characteristics.map((char, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 적합한 직업 */}
        {estimation.suitable_careers && estimation.suitable_careers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">적합한 직업</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {estimation.suitable_careers.map((career, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{career}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 적합한 환경 */}
        {estimation.suitable_environments && estimation.suitable_environments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">적합한 환경</h2>
            </div>
            <ul className="space-y-2">
              {estimation.suitable_environments.map((env, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">{env}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 성장 제안 */}
        {estimation.growth_suggestions && estimation.growth_suggestions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">성장 방향 제안</h2>
            </div>
            <div className="space-y-3">
              {estimation.growth_suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/mbti')}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>다시 분석하기</span>
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              toast.success('결과 링크가 복사되었습니다!');
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>결과 공유</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MBTIResult;


