import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, CheckCircle, Clock, XCircle, Sparkles, AlertCircle } from 'lucide-react';
import { mediaApi, analysisApi } from '../services/api';

const ImageAnalysisSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAnalysis, setCreatingAnalysis] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mediaApi.getAnalysisSummary();
      setSummary(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || '분석 요약을 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnhancedAnalysis = async () => {
    if (!window.confirm('텍스트 프로필과 이미지 분석을 통합하여 더 정확한 분석을 생성하시겠습니까?')) {
      return;
    }

    try {
      setCreatingAnalysis(true);
      const response = await analysisApi.createEnhancedAnalysis();
      
      // 생성된 분석 결과 페이지로 이동
      if (response.data.analysis && response.data.analysis.id) {
        navigate(`/analysis/${response.data.analysis.id}`);
      } else {
        alert('분석이 생성되었습니다!');
        navigate('/analysis-history');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || '분석 생성 중 오류가 발생했습니다';
      alert(errorMessage);
      console.error('통합 분석 생성 실패:', err);
    } finally {
      setCreatingAnalysis(false);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!window.confirm('실패한 모든 이미지 분석을 다시 시도하시겠습니까?')) {
      return;
    }

    try {
      await mediaApi.retryAllFailedAnalysis();
      alert('재분석이 시작되었습니다. 잠시 후 새로고침해주세요.');
      loadSummary();
    } catch (err) {
      alert(err.response?.data?.message || '재분석 요청 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 요약을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadSummary} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">이미지 분석 요약</h1>
          <p className="text-gray-600">업로드한 이미지에서 발견된 패턴과 인사이트</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">총 이미지</p>
                <p className="text-3xl font-bold text-gray-900">{summary.total_images}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">분석 완료</p>
                <p className="text-3xl font-bold text-green-600">{summary.analyzed_images}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">대기 중</p>
                <p className="text-3xl font-bold text-gray-600">{summary.pending_images || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">실패</p>
                <p className="text-3xl font-bold text-red-600">{summary.failed_images || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 주요 관심사 */}
        {summary.top_interests && summary.top_interests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">주요 관심사</h2>
            </div>
            <div className="space-y-3">
              {summary.top_interests.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-semibold text-gray-900">{item.interest}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(item.count / summary.top_interests[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-600 text-sm">{item.count}회</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 키워드 */}
        {summary.top_keywords && summary.top_keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">자주 등장하는 키워드</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {summary.top_keywords.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
                  <span className="font-semibold text-purple-700">{item.keyword}</span>
                  <span className="text-purple-500 text-sm">({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 종합 인사이트 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white mb-8">
          <h2 className="text-xl font-bold mb-3">종합 인사이트</h2>
          <p className="text-lg">{summary.overall_insight}</p>
        </div>

        {/* 통합 분석 버튼 및 재분석 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleCreateEnhancedAnalysis}
            disabled={creatingAnalysis || summary.analyzed_images === 0}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creatingAnalysis ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                통합 분석 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                텍스트 프로필과 이미지 통합 분석하기
              </>
            )}
          </button>
          
          {summary.failed_images > 0 && (
            <button
              onClick={handleRetryAllFailed}
              className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              실패한 이미지 모두 재분석 ({summary.failed_images}개)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisSummary;



