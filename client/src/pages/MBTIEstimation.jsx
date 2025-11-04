import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api';
import { mediaApi, documentApi, mbtiApi } from '../services/api';
import { useToast } from '../components/Toast';
import { SkeletonDashboard } from '../components/Skeleton';

const MBTIEstimation = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataCounts, setDataCounts] = useState({
    hasProfile: false,
    imageCount: 0,
    documentCount: 0,
    analysisCount: 0
  });
  const [latestEstimation, setLatestEstimation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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

        // 최근 MBTI 추정 결과
        try {
          const mbtiRes = await mbtiApi.getHistory();
          if (mbtiRes.data.estimations && mbtiRes.data.estimations.length > 0) {
            const latestId = mbtiRes.data.estimations[0].id;
            const detailRes = await mbtiApi.getEstimationById(latestId);
            setLatestEstimation(detailRes.data.estimation);
          }
        } catch (error) {
          console.error('MBTI 히스토리 조회 실패:', error);
        }

        setDataCounts({
          hasProfile,
          imageCount,
          documentCount,
          analysisCount
        });
      } catch (error) {
        console.error('데이터 조회 실패:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const response = await mbtiApi.estimateMBTI();
      if (response.data.estimation) {
        navigate(`/mbti/${response.data.estimation.id}`);
      }
    } catch (error) {
      const errorMessage = error.response?.status === 400
        ? (error.response.data.message || '충분한 데이터가 없습니다.')
        : 'MBTI 추정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      toast.error(errorMessage);
      console.error('MBTI 추정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDataPoints = (dataCounts.hasProfile ? 1 : 0) + 
    dataCounts.imageCount + 
    dataCounts.documentCount + 
    dataCounts.analysisCount;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            MBTI 성격 유형 분석
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            당신의 데이터를 바탕으로 MBTI 성격 유형을 추정합니다
          </p>
        </div>

        {/* 데이터 준비 상황 */}
        {!dataLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 transition-colors duration-200">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              데이터 준비 상황
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {dataCounts.hasProfile ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">프로필 작성됨</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {dataCounts.imageCount > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <span className="text-gray-700">
                    이미지 {dataCounts.imageCount}개 업로드
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {dataCounts.documentCount > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <span className="text-gray-700">
                    문서 {dataCounts.documentCount}개 업로드
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {dataCounts.analysisCount > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                  <span className="text-gray-700">
                    기존 분석 {dataCounts.analysisCount}개
                  </span>
                </div>
              </div>
            </div>

            {totalDataPoints < 3 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>데이터 부족:</strong> 더 많은 데이터가 있으면 정확도가 높아집니다.
                  {' '}
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-yellow-900 underline font-semibold"
                  >
                    프로필 작성하기
                  </button>
                  {' 또는 '}
                  <button
                    onClick={() => navigate('/upload')}
                    className="text-yellow-900 underline font-semibold"
                  >
                    파일 업로드하기
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* 최근 추정 결과 */}
        {latestEstimation && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              최근 추정 결과
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600 mb-2">
                  {latestEstimation.mbti_type}
                </p>
                <p className="text-gray-600">
                  신뢰도: {latestEstimation.confidence}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(latestEstimation.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() => navigate(`/mbti/${latestEstimation.id}`)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                결과 보기
              </button>
            </div>
          </div>
        )}

        {/* MBTI 추정 시작 버튼 */}
        <div className="text-center">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                AI가 당신의 성격을 분석하고 있습니다...
              </p>
              <p className="text-gray-500">
                이 작업은 30-60초 정도 소요됩니다.
              </p>
            </div>
          ) : (
            <button
              onClick={handleEstimate}
              disabled={totalDataPoints < 3 || loading}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="w-6 h-6" />
                <span>MBTI 추정 시작</span>
              </div>
            </button>
          )}
        </div>

        {/* 히스토리 버튼 */}
        {!loading && (
          <div className="text-center mt-6">
            <button
              onClick={() => {
                // 히스토리 페이지로 이동 (추후 구현)
                mbtiApi.getHistory().then(res => {
                  if (res.data.estimations && res.data.estimations.length > 0) {
                    navigate(`/mbti/${res.data.estimations[0].id}`);
                  } else {
                    toast.warning('이전 추정 결과가 없습니다.');
                  }
                }).catch(err => {
                  toast.error('히스토리를 불러오는 중 오류가 발생했습니다.');
                });
              }}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              이전 추정 결과 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MBTIEstimation;


