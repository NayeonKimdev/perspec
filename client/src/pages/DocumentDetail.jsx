import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Trash2, Download, Eye, AlertCircle, Loader } from 'lucide-react';
import { documentApi } from '../services/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentApi.getDocumentById(id);
      setDocument(response.data.document);
    } catch (err) {
      setError(err.response?.data?.message || '문서를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 문서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeleting(true);
      await documentApi.deleteDocument(id);
      navigate('/documents');
    } catch (err) {
      alert(err.response?.data?.message || '삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await documentApi.downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('다운로드 중 오류가 발생했습니다');
    }
  };

  const getDocumentTypeBadge = (type) => {
    const types = {
      diary: { label: '일기', color: 'bg-pink-100 text-pink-800' },
      note: { label: '메모', color: 'bg-blue-100 text-blue-800' },
      json: { label: 'JSON', color: 'bg-yellow-100 text-yellow-800' },
      other: { label: '기타', color: 'bg-gray-100 text-gray-800' }
    };
    const typeInfo = types[type] || types.other;
    return (
      <span className={`px-3 py-1 ${typeInfo.color} text-sm rounded-full`}>
        {typeInfo.label}
      </span>
    );
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || '문서를 찾을 수 없습니다'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              목록으로
            </button>
            <div className="flex gap-2">
              {document.analysis_status === 'completed' && (
                <button
                  onClick={() => navigate(`/documents/${id}/analysis`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Eye className="w-5 h-5" />
                  분석 결과 보기
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-5 h-5" />
                다운로드
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                삭제
              </button>
            </div>
          </div>

          {/* 문서 정보 */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{document.file_name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {getDocumentTypeBadge(document.document_type)}
                  <span className="text-sm text-gray-500">
                    {formatDate(document.created_at)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm text-gray-600">
              <span>문자: {document.metadata?.charCount?.toLocaleString() || 0}</span>
              <span>단어: {document.metadata?.wordCount?.toLocaleString() || 0}</span>
              <span>줄: {document.metadata?.lineCount?.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                {document.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;

