import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Briefcase, Heart, MapPin, ArrowLeft, RefreshCw, History, Image, Sparkles, Eye } from 'lucide-react';
import api from '../services/api';
import { mediaApi } from '../services/api';
import ImageAnalysisModal from '../components/ImageAnalysisModal';

const AnalysisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedImages, setRelatedImages] = useState([]);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/analysis/${id}`);
        setAnalysis(response.data.analysis);
        
        // 향상된 분석인 경우 관련 이미지 조회
        if (response.data.analysis.is_enhanced) {
          try {
            const mediaResponse = await mediaApi.getMediaList({ limit: 5 });
            const completedImages = mediaResponse.data.media.filter(
              img => img.analysis_status === 'completed'
            );
            setRelatedImages(completedImages);
          } catch (err) {
            console.error('이미지 조회 실패:', err);
          }
        }
      } catch (err) {
        console.error('분석 결과 조회 실패:', err);
        setError(err.response?.data?.message || '분석 결과를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  // 분석 결과 보기
  const handleViewImageAnalysis = async (imageItem) => {
    try {
      const response = await mediaApi.getAnalysisStatus(imageItem.id);
      setAnalysisData(response.data.analysis);
      setViewingAnalysis(imageItem);
    } catch (err) {
      alert(err.response?.data?.message || '분석 결과를 불러오는 중 오류가 발생했습니다');
    }
  };

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">분석 결과</h1>
                {analysis.is_enhanced && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Enhanced
                  </span>
                )}
              </div>
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

        {/* 이미지 기반 인사이트 (향상된 분석인 경우) */}
        {analysis.is_enhanced && analysis.image_analysis_summary && (
          <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">이미지 기반 인사이트</h2>
            </div>
            
            {analysis.image_analysis_summary.top_interests && analysis.image_analysis_summary.top_interests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">이미지에서 발견된 주요 관심사</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.image_analysis_summary.top_interests.slice(0, 10).map((item, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {item.interest} ({item.count}회)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.image_analysis_summary.common_moods && analysis.image_analysis_summary.common_moods.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">전반적인 분위기</h3>
                <p className="text-gray-700">
                  {analysis.image_analysis_summary.common_moods.join(', ')}
                </p>
              </div>
            )}

            <div className="bg-white/60 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                총 {analysis.image_analysis_summary.analyzed_images}개의 이미지에서 데이터를 수집했습니다.
              </p>
              <p className="text-sm text-indigo-700 font-medium">
                텍스트 프로필과 이미지 분석을 종합하여 더 정확한 인사이트를 제공했습니다.
              </p>
            </div>
          </div>
        )}

        {/* 참고된 이미지 미리보기 (향상된 분석인 경우) */}
        {analysis.is_enhanced && relatedImages.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">참고된 이미지</h2>
              </div>
              <button
                onClick={() => navigate('/gallery')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                갤러리에서 모두 보기 →
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {relatedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => handleViewImageAnalysis(image)}
                >
                  <img
                    src={image.file_url}
                    alt={image.file_name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: '120px', maxHeight: '120px' }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 분석 모달 */}
      {viewingAnalysis && analysisData && (
        <ImageAnalysisModal
          isOpen={!!viewingAnalysis}
          onClose={() => setViewingAnalysis(null)}
          imageUrl={viewingAnalysis.file_url}
          analysisData={analysisData}
        />
      )}
    </div>
  );
};

export default AnalysisResult;

