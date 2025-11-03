import { XCircle } from 'lucide-react';

const ImageAnalysisModal = ({ isOpen, onClose, imageUrl, analysisData }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">이미지 분석 결과</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="닫기"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {analysisData && analysisData.status === 'completed' && analysisData.result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 왼쪽: 이미지 */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="분석된 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 오른쪽: 분석 결과 */}
              <div className="space-y-6">
                {/* 이미지 설명 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">이미지 설명</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                    {analysisData.result.description}
                  </p>
                </div>

                {/* 분위기 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">분위기</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {analysisData.result.mood}
                  </p>
                </div>

                {/* 추론된 관심사 */}
                {analysisData.result.inferred_interests && analysisData.result.inferred_interests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">추론된 관심사</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.result.inferred_interests.map((interest, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 키워드 */}
                {analysisData.result.keywords && analysisData.result.keywords.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">키워드</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.result.keywords.map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추가 인사이트 */}
                {analysisData.result.additional_insights && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">추가 인사이트</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                      {analysisData.result.additional_insights}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {analysisData?.message || '분석 결과를 불러올 수 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysisModal;

