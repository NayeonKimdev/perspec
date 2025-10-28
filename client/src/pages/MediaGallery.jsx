import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, AlertCircle, Loader } from 'lucide-react';
import { mediaApi } from '../services/api';
import ImageModal from '../components/ImageModal';

const MediaGallery = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const navigate = useNavigate();

  // 미디어 목록 로드
  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mediaApi.getMediaList({ limit: 100 });
      setMedia(response.data.media);
    } catch (err) {
      setError(err.response?.data?.message || '이미지를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

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
    } catch (err) {
      alert(err.response?.data?.message || '삭제 중 오류가 발생했습니다');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 갤러리</h1>
          <div className="flex gap-4">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 이미지 그리드 */}
        {media.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">아직 업로드한 이미지가 없습니다</h2>
            <p className="text-gray-500 mb-8">첫 이미지를 업로드해보세요!</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              첫 이미지 업로드하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => handleImageClick(item)}
              >
                {/* 이미지 썸네일 */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={item.file_url}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error';
                    }}
                  />
                  
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                    <p className="text-white font-semibold opacity-0 group-hover:opacity-100 transition">
                      클릭하여 확대
                    </p>
                  </div>
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 truncate mb-1">{item.file_name}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{formatDate(item.created_at)}</span>
                    <span>{formatFileSize(item.file_size)}</span>
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  disabled={deletingId === item.id}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
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
    </div>
  );
};

export default MediaGallery;

