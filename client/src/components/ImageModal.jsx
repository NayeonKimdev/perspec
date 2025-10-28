import { X, Download } from 'lucide-react';
import { useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl, imageData }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 스크롤 방지
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageData?.file_name || 'image';
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>

        {/* 이미지 */}
        <div className="flex justify-center mb-4 max-h-[70vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={imageData?.file_name}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* 이미지 정보 */}
        {imageData && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">파일명</p>
                <p className="font-semibold text-gray-900">{imageData.file_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">파일 크기</p>
                <p className="font-semibold text-gray-900">{formatFileSize(imageData.file_size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">파일 타입</p>
                <p className="font-semibold text-gray-900">{imageData.file_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">업로드 날짜</p>
                <p className="font-semibold text-gray-900">{formatDate(imageData.created_at)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 다운로드 버튼 */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-5 h-5" />
            다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

