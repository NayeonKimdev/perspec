import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Eye, Search, Upload, Loader, CheckCircle, Clock, XCircle, AlertCircle, Download } from 'lucide-react';
import { documentApi } from '../services/api';
import { useToast } from '../components/Toast';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();
  const toast = useToast();

  // 문서 목록 로드
  const loadDocuments = async (preserveScroll = false) => {
    try {
      if (preserveScroll) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let response;
      if (searchQuery.trim()) {
        // 검색
        response = await documentApi.searchDocuments({
          q: searchQuery,
          document_type: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
          page,
          limit: 20
        });
      } else {
        // 목록 조회
        response = await documentApi.getDocumentList({
          document_type: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
          page,
          limit: 20
        });
      }

      setDocuments(response.data.documents || []);
      setTotal(response.data.total || 0);
      setPage(response.data.page || 1);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || '문서를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [documentTypeFilter, page]);

  // 검색 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || documentTypeFilter !== 'all') {
        setPage(1);
        loadDocuments();
      } else {
        loadDocuments();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 분석 대기 중이거나 진행 중인 문서가 있으면 자동 새로고침
  useEffect(() => {
    const hasPendingOrAnalyzing = documents.some(
      d => d.analysis_status === 'pending' || d.analysis_status === 'analyzing'
    );
    
    if (hasPendingOrAnalyzing && !isRefreshing) {
      const interval = setInterval(() => {
        loadDocuments(true);
      }, 10000); // 10초마다 새로고침
      
      return () => clearInterval(interval);
    }
  }, [documents, isRefreshing]);

  // 문서 삭제
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('이 문서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(id);
      await documentApi.deleteDocument(id);
      setDocuments(documents.filter(item => item.id !== id));
      setTotal(total - 1);
      toast.success('문서가 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.message || '삭제 중 오류가 발생했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  // 문서 다운로드
  const handleDownload = async (id, fileName, e) => {
    e.stopPropagation();
    
    try {
      const response = await documentApi.downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('다운로드가 시작되었습니다.');
    } catch (err) {
      toast.error('다운로드 중 오류가 발생했습니다');
    }
  };

  // 분석 상태 배지
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            분석 완료
          </span>
        );
      case 'analyzing':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
            <Loader className="w-3 h-3 animate-spin" />
            분석 중...
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            분석 대기
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            분석 실패
          </span>
        );
      default:
        return null;
    }
  };

  // 문서 유형 배지
  const getDocumentTypeBadge = (type) => {
    const types = {
      diary: { label: '일기', color: 'bg-pink-100 text-pink-800' },
      note: { label: '메모', color: 'bg-blue-100 text-blue-800' },
      json: { label: 'JSON', color: 'bg-yellow-100 text-yellow-800' },
      other: { label: '기타', color: 'bg-gray-100 text-gray-800' }
    };
    const typeInfo = types[type] || types.other;
    return (
      <span className={`px-2 py-1 ${typeInfo.color} text-xs rounded-full`}>
        {typeInfo.label}
      </span>
    );
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">내 문서</h1>
            </div>
            <button
              onClick={() => navigate('/document-upload')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              문서 업로드
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="문서 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 필터 탭 */}
            <div className="flex gap-2">
              {['all', 'diary', 'note', 'json', 'other'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setDocumentTypeFilter(type);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    documentTypeFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? '전체' : 
                   type === 'diary' ? '일기' :
                   type === 'note' ? '메모' :
                   type === 'json' ? 'JSON' : '기타'}
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 문서 카드 리스트 */}
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery ? '검색 결과가 없습니다' : '아직 업로드한 문서가 없습니다'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/document-upload')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  첫 문서 업로드하기
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">{doc.file_name}</span>
                          {getDocumentTypeBadge(doc.document_type)}
                          {getStatusBadge(doc.analysis_status)}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {doc.content_preview || '내용 미리보기 없음'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>문자: {doc.char_count?.toLocaleString() || 0}</span>
                          <span>단어: {doc.word_count?.toLocaleString() || 0}</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDownload(doc.id, doc.file_name, e)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="다운로드"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {doc.analysis_status === 'completed' && (
                          <button
                            onClick={() => navigate(`/documents/${doc.id}/analysis`)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="분석 결과 보기"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          disabled={deletingId === doc.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === doc.id ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <span className="px-4 py-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    다음
                  </button>
                </div>
              )}

              {searchQuery && (
                <div className="mt-4 text-center text-gray-600">
                  총 {total}개의 결과를 찾았습니다
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList;

