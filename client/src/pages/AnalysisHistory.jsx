import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, FileText, ArrowLeft, Clock, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { SkeletonList } from '../components/Skeleton';

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchAnalyses();
  }, [page, dateFilter]);

  // 검색 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAnalyses();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (dateFilter !== 'all') {
        params.append('date_filter', dateFilter);
      }
      
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      
      const response = await api.get(`/analysis/history?${params.toString()}`);
      setAnalyses(response.data.analyses);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-8 w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">분석 히스토리</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">히스토리를 불러오는 중...</p>
              </div>
            </div>
          </div>
          <SkeletonList count={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">분석 히스토리</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {searchQuery ? `검색 결과: ${total}개` : `총 ${total}개의 분석 결과`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              대시보드
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="분석 내용 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 날짜 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">기간:</span>
              {['all', 'today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setDateFilter(filter);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    dateFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter === 'all' ? '전체' :
                   filter === 'today' ? '오늘' :
                   filter === 'week' ? '주간' : '월간'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 분석 결과 리스트 */}
        {analyses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-200">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-8 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {searchQuery ? '검색 결과가 없습니다' : '아직 분석 결과가 없습니다'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : 'AI가 당신의 프로필을 분석해드립니다'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/start-analysis')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                첫 분석 시작하기
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {analyses.map((analysis, index) => (
                <div
                  key={analysis.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition p-6 cursor-pointer transition-colors duration-200"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(analysis.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        분석 #{analyses.length - index}
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                            성격 분석
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
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
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
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
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisHistory;

