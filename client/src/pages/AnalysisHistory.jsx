import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, FileText, ArrowLeft, Clock } from 'lucide-react';
import api from '../services/api';

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAnalyses();
  }, [page]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analysis/history?page=${page}&limit=10`);
      setAnalyses(response.data.analyses);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('히스토리 조회 실패:', err);
    } finally {
      setLoading(false);
    }
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

  const truncateText = (text, maxLength) => {
    if (!text) return '내용 없음';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">히스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">분석 히스토리</h1>
                <p className="text-gray-600 mt-1">
                  총 {analyses.length}개의 분석 결과
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              대시보드
            </button>
          </div>
        </div>

        {/* 분석 결과 리스트 */}
        {analyses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="bg-gray-100 rounded-full p-8 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              아직 분석 결과가 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              AI가 당신의 프로필을 분석해드립니다
            </p>
            <button
              onClick={() => navigate('/start-analysis')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              첫 분석 시작하기
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {analyses.map((analysis, index) => (
                <div
                  key={analysis.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 cursor-pointer"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(analysis.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        분석 #{analyses.length - index}
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-purple-700 mb-1">
                            성격 분석
                          </p>
                          <p className="text-sm text-gray-700">
                            {truncateText(analysis.personality_analysis, 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                        자세히 보기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => navigate('/start-analysis')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            새로운 분석 하기
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisHistory;

