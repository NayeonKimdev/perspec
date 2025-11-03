import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, AlertCircle, Loader, Smile, Heart, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { documentApi } from '../services/api';

const DocumentAnalysisResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [docResponse, analysisResponse] = await Promise.all([
        documentApi.getDocumentById(id),
        documentApi.getDocumentAnalysis(id)
      ]);

      setDocument(docResponse.data.document);
      setAnalysis(analysisResponse.data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || '데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 분석 대기 중일 때 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 문서가 없는 경우
  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {error || '문서를 찾을 수 없습니다'}
          </p>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  // 분석이 아직 완료되지 않은 경우
  if (!analysis || analysis.status === 'pending' || analysis.status === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{document.file_name}</h1>
                <p className="text-sm text-gray-500">분석 중...</p>
              </div>
            </div>
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {analysis?.status === 'analyzing' 
                  ? '문서를 분석하고 있습니다. 잠시만 기다려주세요...' 
                  : '분석 대기 중입니다. 곧 시작됩니다...'}
              </p>
              <button
                onClick={() => loadData()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 분석 실패한 경우
  if (analysis.status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                분석 중 오류가 발생했습니다.
              </p>
              {analysis.error && (
                <p className="text-sm text-gray-500 mb-4">{analysis.error}</p>
              )}
              <button
                onClick={() => navigate('/documents')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const result = analysis.result;

  // 일기 분석 결과 렌더링
  const renderDiaryAnalysis = () => {
    if (document.document_type !== 'diary' || !result.emotions) return null;

    return (
      <div className="space-y-6">
        {/* 감정 분석 */}
        {result.emotions && result.emotions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Smile className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold text-gray-800">감정 분석</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.emotions.map((emotion, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm"
                >
                  {emotion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 주요 사건 */}
        {result.main_events && result.main_events.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">주요 사건</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {result.main_events.map((event, index) => (
                <li key={index}>{event}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 관계 */}
        {result.relationships && result.relationships.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-800">관계</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.relationships.map((rel, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {rel}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 관심사 */}
        {result.interests && result.interests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">관심사</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 심리 상태 */}
        {result.psychological_state && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-800">심리 상태</h2>
            </div>
            <p className="text-gray-700">{result.psychological_state}</p>
          </div>
        )}

        {/* 종합 인사이트 */}
        {result.insights && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">종합 인사이트</h2>
            <p className="text-gray-700 leading-relaxed">{result.insights}</p>
          </div>
        )}
      </div>
    );
  };

  // 메모 및 기타 문서 분석 결과 렌더링
  const renderNoteAnalysis = () => {
    // note 또는 other 타입 처리
    if (document.document_type !== 'note' && document.document_type !== 'other') {
      return null;
    }

    // 분석 결과가 없는 경우
    if (!result || Object.keys(result).length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-center">
            분석 결과가 아직 준비되지 않았습니다. 잠시 후 다시 확인해주세요.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 주제 및 카테고리 */}
        {result.topics && result.topics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">주제 및 카테고리</h2>
            <div className="flex flex-wrap gap-2">
              {result.topics.map((topic, index) => (
                <span key={index} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 키워드 (other 타입) */}
        {result.keywords && result.keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">주요 키워드</h2>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword, index) => (
                <span key={index} className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 카테고리 (note 타입) */}
        {result.categories && result.categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">카테고리</h2>
            <div className="flex flex-wrap gap-2">
              {result.categories.map((category, index) => (
                <span key={index} className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 관심사 */}
        {result.interests && result.interests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">관심 분야</h2>
            <div className="flex flex-wrap gap-2">
              {result.interests.map((interest, index) => (
                <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 계획 (note 타입) */}
        {result.plans && result.plans.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">계획 및 목표</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {result.plans.map((plan, index) => (
                <li key={index}>{plan}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 사고방식 (note 타입) */}
        {result.thinking_style && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">사고방식</h2>
            <p className="text-gray-700">{result.thinking_style}</p>
          </div>
        )}

        {/* 요약 (other 타입) */}
        {result.summary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">요약</h2>
            <p className="text-gray-700 leading-relaxed">{result.summary}</p>
          </div>
        )}

        {/* 종합 인사이트 */}
        {result.insights && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">종합 인사이트</h2>
            <p className="text-gray-700 leading-relaxed">{result.insights}</p>
          </div>
        )}

        {/* 모든 결과가 비어있는 경우 */}
        {(!result.topics || result.topics.length === 0) && 
         (!result.keywords || result.keywords.length === 0) && 
         (!result.categories || result.categories.length === 0) && 
         (!result.interests || result.interests.length === 0) && 
         (!result.plans || result.plans.length === 0) && 
         (!result.thinking_style) && 
         (!result.summary) && 
         (!result.insights) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 text-center">
              분석 결과가 없습니다. 문서 내용을 확인해주세요.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/documents/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
            원본 문서 보기
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{document.file_name}</h1>
              <p className="text-sm text-gray-500">
                {document.document_type === 'diary' 
                  ? '일기 분석 결과' 
                  : document.document_type === 'note'
                  ? '메모 분석 결과'
                  : '문서 분석 결과'}
              </p>
            </div>
          </div>
        </div>

        {document.document_type === 'diary' ? renderDiaryAnalysis() : renderNoteAnalysis()}

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/documents')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisResult;

