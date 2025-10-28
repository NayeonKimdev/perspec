import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { mediaApi } from '../services/api';

const MediaUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 파일 선택
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // 파일 처리
  const processFiles = (files) => {
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      // 파일 타입 검증
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({ file, error: '이미지 파일만 업로드 가능합니다' });
        return;
      }

      // 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        invalidFiles.push({ file, error: '파일 크기는 10MB 이하여야 합니다' });
        return;
      }

      validFiles.push(file);
    });

    // 10개 제한
    const filesToAdd = validFiles.slice(0, 10 - selectedFiles.length);
    setSelectedFiles([...selectedFiles, ...filesToAdd]);

    // 미리보기 생성
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, { file: file.name, url: e.target.result }]);
      };
      reader.readAsDataURL(file);
    });

    if (invalidFiles.length > 0) {
      setError(invalidFiles.map(item => item.error).join(', '));
    }
  };

  // 드래그 앤 드롭
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // 파일 제거
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newStatus = uploadStatus.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setUploadStatus(newStatus);
  };

  // 업로드
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('파일을 선택해주세요');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    
    // 단일 파일인지 다중 파일인지 확인
    if (selectedFiles.length === 1) {
      formData.append('image', selectedFiles[0]);
      
      try {
        setUploadStatus([{ status: 'uploading', progress: 0 }]);
        
        const response = await mediaApi.uploadImage(formData, (progress) => {
          setUploadProgress(progress);
          setUploadStatus([{ status: 'uploading', progress }]);
        });
        
        setUploadStatus([{ status: 'completed' }]);
        alert('업로드 완료!');
        navigate('/gallery');
      } catch (err) {
        setUploadStatus([{ status: 'failed', error: err.response?.data?.message || '업로드 실패' }]);
        setError(err.response?.data?.message || '업로드 중 오류가 발생했습니다');
        setUploading(false);
      }
    } else {
      // 다중 파일 업로드
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      try {
        const initialStatus = selectedFiles.map(() => ({ status: 'uploading', progress: 0 }));
        setUploadStatus(initialStatus);
        
        const response = await mediaApi.uploadMultipleImages(formData, (progress) => {
          setUploadProgress(progress);
          // 전체 진행률을 각 파일에 동일하게 표시
          const updatedStatus = selectedFiles.map(() => ({ status: 'uploading', progress }));
          setUploadStatus(updatedStatus);
        });
        
        setUploadStatus(selectedFiles.map(() => ({ status: 'completed' })));
        alert(`업로드 완료! (${selectedFiles.length}개 파일)`);
        navigate('/gallery');
      } catch (err) {
        const failedStatus = selectedFiles.map(() => ({ status: 'failed', error: err.response?.data?.message || '업로드 실패' }));
        setUploadStatus(failedStatus);
        setError(err.response?.data?.message || '업로드 중 오류가 발생했습니다');
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">이미지 업로드</h1>

        {/* 드래그 앤 드롭 영역 */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            <Upload className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG, GIF, WEBP 파일 (최대 10MB, 최대 10개)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              파일 선택
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 미리보기 영역 */}
        {previews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">선택된 이미지</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview.url}
                    alt={preview.file}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  
                  {/* 업로드 상태 표시 */}
                  {uploadStatus[index] && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      {uploadStatus[index].status === 'uploading' && (
                        <div className="text-white text-center">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm">{uploadStatus[index].progress}%</p>
                        </div>
                      )}
                      {uploadStatus[index].status === 'completed' && (
                        <Check className="w-12 h-12 text-green-400" />
                      )}
                      {uploadStatus[index].status === 'failed' && (
                        <AlertCircle className="w-12 h-12 text-red-400" />
                      )}
                    </div>
                  )}
                  
                  {/* 제거 버튼 */}
                  {!uploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-600 mt-2 truncate">{preview.file}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 업로드 진행률 */}
        {uploading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{uploadProgress}%</p>
          </div>
        )}

        {/* 업로드 버튼 */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleUpload}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              업로드 ({selectedFiles.length}개 파일)
            </button>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setPreviews([]);
                setError(null);
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              모두 제거
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUpload;

