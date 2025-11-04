import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, AlertCircle, Loader, CheckCircle, Clock, XCircle, Eye, RefreshCw, Home, BarChart3, Search, Filter } from 'lucide-react';
import { mediaApi } from '../services/api';
import ImageModal from '../components/ImageModal';
import ImageAnalysisModal from '../components/ImageAnalysisModal';
import { SkeletonGallery } from '../components/Skeleton';

const MediaGallery = () => {
  const toast = useToast();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [previousAnalysisStatuses, setPreviousAnalysisStatuses] = useState(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisStatusFilter, setAnalysisStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const navigate = useNavigate();

  // 미디어 목록 로드 (스크롤 위치 유지)
  const loadMedia = async (preserveScroll = false) => {
    try {
      // 스크롤 위치 저장
      const scrollPosition = preserveScroll ? window.scrollY : null;
      
      if (preserveScroll) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      let response;
      if (searchQuery.trim()) {
        // 검색
        response = await mediaApi.searchMedia({
          q: searchQuery,
          analysis_status: analysisStatusFilter !== 'all' ? analysisStatusFilter : undefined,
          date_filter: dateFilter !== 'all' ? dateFilter : undefined,
          page,
          limit: 20
        });
      } else {
        // 목록 조회
        response = await mediaApi.getMediaList({
          analysis_status: analysisStatusFilter !== 'all' ? analysisStatusFilter : undefined,
          date_filter: dateFilter !== 'all' ? dateFilter : undefined,
          page,
          limit: 20
        });
      }
      
      const newMedia = response.data.media;
      
      // 상태 변경 여부 확인
      let hasStatusChanged = false;
      
      // 분석 상태 변경 감지 (pending/analyzing -> completed)
      newMedia.forEach(item => {
        const previousStatus = previousAnalysisStatuses.get(item.id);
        if (previousStatus !== item.analysis_status) {
          hasStatusChanged = true;
        }
        if (previousStatus && (previousStatus === 'pending' || previousStatus === 'analyzing') && item.analysis_status === 'completed') {
          setNotification({
            type: 'success',
            message: `${item.file_name}의 분석이 완료되었습니다!`,
            imageId: item.id,
            imageUrl: item.file_url
          });
        }
      });
      
      // 상태가 변경되지 않았고 자동 새로고침인 경우 스킵
      if (preserveScroll && !hasStatusChanged) {
        setIsRefreshing(false);
        return;
      }
      
      // 현재 상태 저장
      const newStatusMap = new Map();
      newMedia.forEach(item => {
        newStatusMap.set(item.id, item.analysis_status);
      });
      setPreviousAnalysisStatuses(newStatusMap);
      
      setMedia(newMedia);
      setTotal(response.data.total || 0);
      setPage(response.data.page || 1);
      setTotalPages(response.data.totalPages || 1);
      
      // 스크롤 위치 복원
      if (preserveScroll && scrollPosition !== null) {
        // 다음 프레임에서 스크롤 복원 (렌더링 완료 후)
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || '이미지를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [page, analysisStatusFilter, dateFilter]);

  // 검색 debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadMedia();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 분석 대기 중이거나 진행 중인 이미지가 있으면 자동 새로고침 (스크롤 위치 유지)
  useEffect(() => {
    const hasPendingOrAnalyzing = media.some(m => m.analysis_status === 'pending' || m.analysis_status === 'analyzing');
    
    if (hasPendingOrAnalyzing && !isRefreshing) {
      const interval = setInterval(() => {
        loadMedia(true); // 스크롤 위치 유지
      }, 10000); // 10초마다 새로고침 (5초에서 10초로 변경하여 부담 감소)
      
      return () => clearInterval(interval);
    }
  }, [media, isRefreshing]);

  // 이미지 클릭 - 모달 열기
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  // 이미지 삭제
  const handleDelete = async (id, e) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (!window.confirm('이 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(id);
      await mediaApi.deleteMedia(id);
      // 목록에서 제거
      setMedia(media.filter(item => item.id !== id));
      toast.success('이미지가 삭제되었습니다.');
    } catch (err) {
      toast.error(err.response?.data?.message || '삭제 중 오류가 발생했습니다');
    } finally {
      setDeletingId(null);
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  // 분석 결과 보기
  const handleViewAnalysis = async (imageItem) => {
    try {
      const response = await mediaApi.getAnalysisStatus(imageItem.id);
      setAnalysisData(response.data.analysis);
      setViewingAnalysis(imageItem);
    } catch (err) {
      toast.error(err.response?.data?.message || '분석 결과를 불러오는 중 오류가 발생했습니다');
    }
  };

  // 분석 상태 배지 컴포넌트 (컴팩트 버전 - 이미지 위 오버레이용)
  const AnalysisStatusBadge = ({ status, compact = false }) => {
    const baseClasses = compact 
      ? "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm"
      : "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold";
    
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-500/90 text-white shadow-md`}>
            {!compact && <CheckCircle className="w-3 h-3" />}
            {compact ? '완료' : '분석 완료'}
          </span>
        );
      case 'analyzing':
        return (
          <span className={`${baseClasses} bg-blue-500/90 text-white shadow-md animate-pulse`}>
            <Loader className="w-2.5 h-2.5 animate-spin" />
            {compact ? '분석중' : '분석 중...'}
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-gray-500/90 text-white shadow-md`}>
            {!compact && <Clock className="w-3 h-3" />}
            {compact ? '대기' : '분석 대기 중'}
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-500/90 text-white shadow-md`}>
            {!compact && <XCircle className="w-3 h-3" />}
            {compact ? '실패' : '분석 실패'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">내 갤러리</h1>
            <p className="text-gray-600 dark:text-gray-400">이미지를 불러오는 중...</p>
          </div>
          <SkeletonGallery count={12} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      {/* 새로고침 인디케이터 */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">상태 업데이트 중...</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto w-full">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">내 갤러리</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Home className="w-4 h-4" />
              대시보드
            </button>
            <button
              onClick={() => navigate('/image-analysis-summary')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
            >
              <BarChart3 className="w-4 h-4" />
              분석 요약
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Upload className="w-5 h-5" />
              이미지 업로드
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="이미지 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 flex-wrap">
            {/* 분석 상태 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">상태:</span>
              {['all', 'completed', 'pending', 'analyzing', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setAnalysisStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    analysisStatusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'all' ? '전체' :
                   status === 'completed' ? '완료' :
                   status === 'pending' ? '대기' :
                   status === 'analyzing' ? '분석중' : '실패'}
                </button>
              ))}
            </div>

            {/* 날짜 필터 */}
            <div className="flex items-center gap-2 ml-4">
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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

        {/* 이미지 그리드 */}
        {media.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">아직 업로드한 이미지가 없습니다</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">첫 이미지를 업로드해보세요!</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              첫 이미지 업로드하기
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                  onClick={() => handleImageClick(item)}
                >
                  {/* 이미지 썸네일 - 고정 크기 */}
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={item.file_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '200px', maxHeight: '200px' }}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=Image+Error';
                      }}
                    />
                    
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                      <p className="text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition px-2 text-center">
                        클릭하여 확대
                      </p>
                    </div>
                    
                    {/* 분석 상태 오버레이 (이미지 위) */}
                    <div className="absolute top-2 left-2 z-10">
                      <AnalysisStatusBadge status={item.analysis_status} compact={true} />
                    </div>
                  </div>

                  {/* 정보 - 컴팩트하게 */}
                  <div className="p-3 space-y-1.5">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-xs" title={item.file_name}>
                      {item.file_name}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    {/* 분석 완료/실패 버튼 */}
                    <div className="flex gap-1.5 pt-1.5">
                      {item.analysis_status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-xs font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          분석 보기
                        </button>
                      )}
                      {item.analysis_status === 'failed' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('이 이미지 분석을 다시 시도하시겠습니까?')) {
                              try {
                                await mediaApi.retryAnalysis(item.id);
                                toast.success('재분석이 시작되었습니다.');
                                loadMedia();
                              } catch (err) {
                                toast.error(err.response?.data?.message || '재분석 요청 중 오류가 발생했습니다');
                              }
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition text-xs font-medium"
                        >
                          <Clock className="w-3 h-3" />
                          재시도
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 disabled:opacity-50 shadow-lg"
                    title="이미지 삭제"
                  >
                    {deletingId === item.id ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  다음
                </button>
              </div>
            )}

            {searchQuery && (
              <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
                총 {total}개의 결과를 찾았습니다
              </div>
            )}
          </>
        )}
      </div>

      {/* 이미지 모달 */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.file_url}
          imageData={selectedImage}
        />
      )}

      {/* 분석 결과 모달 */}
      {viewingAnalysis && analysisData && (
        <ImageAnalysisModal
          isOpen={!!viewingAnalysis}
          onClose={() => setViewingAnalysis(null)}
          imageUrl={viewingAnalysis.file_url}
          analysisData={analysisData}
        />
      )}

      {/* 알림 토스트 */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-w-sm animate-slide-up">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              {notification.imageId && (
                <button
                  onClick={() => {
                    const imageItem = media.find(img => img.id === notification.imageId);
                    if (imageItem) {
                      handleViewAnalysis(imageItem);
                    }
                    setNotification(null);
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  결과 보기 →
                </button>
              )}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGallery;

