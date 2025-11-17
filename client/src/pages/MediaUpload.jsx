import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Check, AlertCircle, Camera, FileImage } from 'lucide-react';
import { mediaApi } from '../services/api';
import { useToast } from '../components/Toast';

const MediaUpload = () => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'camera'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [error, setError] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  
  // 카메라 관련 상태
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

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

  // 카메라 스트림 시작
  useEffect(() => {
    if (uploadMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [uploadMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 후면 카메라 우선
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('카메라 접근 오류:', err);
      setCameraError('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 사진 촬영
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0);

    // 캔버스를 Blob으로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        // Blob을 File 객체로 변환
        const timestamp = new Date().getTime();
        const file = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' });
        
        // 파일 목록에 추가
        processFiles([file]);
      }
    }, 'image/jpeg', 0.9);
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
    setUploadSpeed(null);
    setUploadStartTime(Date.now());

    const formData = new FormData();
    
    // 단일 파일인지 다중 파일인지 확인
    if (selectedFiles.length === 1) {
      formData.append('image', selectedFiles[0]);
      
      try {
        const fileSize = selectedFiles[0].size;
        setUploadStatus([{ status: 'uploading', progress: 0, fileSize }]);
        
        let lastProgressTime = Date.now();
        let lastProgress = 0;
        
        const response = await mediaApi.uploadImage(formData, (progress) => {
          setUploadProgress(progress);
          setUploadStatus([{ status: 'uploading', progress, fileSize }]);
          
          // 업로드 속도 계산
          const now = Date.now();
          const timeDiff = (now - lastProgressTime) / 1000; // 초 단위
          if (timeDiff > 0.5 && progress > lastProgress) {
            const progressDiff = progress - lastProgress;
            const bytesUploaded = (fileSize * progressDiff) / 100;
            const speed = bytesUploaded / timeDiff; // bytes per second
            
            if (speed > 0) {
              const speedMBps = (speed / (1024 * 1024)).toFixed(2);
              setUploadSpeed(speedMBps);
            }
            
            lastProgressTime = now;
            lastProgress = progress;
          }
        });
        
        setUploadStatus([{ status: 'completed', progress: 100 }]);
        setUploadProgress(100);
        toast.success('업로드 완료!');
        setTimeout(() => navigate('/gallery'), 1000);
      } catch (err) {
        setUploadStatus([{ status: 'failed', error: err.response?.data?.message || '업로드 실패' }]);
        setError(err.response?.data?.message || '업로드 중 오류가 발생했습니다');
        setUploading(false);
      }
    } else {
      // 다중 파일 업로드
      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      try {
        const initialStatus = selectedFiles.map((file) => ({ 
          status: 'uploading', 
          progress: 0, 
          fileSize: file.size,
          fileName: file.name
        }));
        setUploadStatus(initialStatus);
        
        let lastProgressTime = Date.now();
        let lastProgress = 0;
        
        const response = await mediaApi.uploadMultipleImages(formData, (progress) => {
          setUploadProgress(progress);
          
          // 전체 진행률을 각 파일에 동일하게 표시
          const updatedStatus = selectedFiles.map((file) => ({ 
            status: 'uploading', 
            progress,
            fileSize: file.size,
            fileName: file.name
          }));
          setUploadStatus(updatedStatus);
          
          // 업로드 속도 계산
          const now = Date.now();
          const timeDiff = (now - lastProgressTime) / 1000;
          if (timeDiff > 0.5 && progress > lastProgress) {
            const progressDiff = progress - lastProgress;
            const bytesUploaded = (totalSize * progressDiff) / 100;
            const speed = bytesUploaded / timeDiff;
            
            if (speed > 0) {
              const speedMBps = (speed / (1024 * 1024)).toFixed(2);
              setUploadSpeed(speedMBps);
            }
            
            lastProgressTime = now;
            lastProgress = progress;
          }
        });
        
        setUploadStatus(selectedFiles.map((file) => ({ 
          status: 'completed', 
          progress: 100,
          fileName: file.name
        })));
        setUploadProgress(100);
        toast.success(`업로드 완료! (${selectedFiles.length}개 파일)`);
        setTimeout(() => navigate('/gallery'), 1000);
      } catch (err) {
        const failedStatus = selectedFiles.map((file) => ({ 
          status: 'failed', 
          error: err.response?.data?.message || '업로드 실패',
          fileName: file.name
        }));
        setUploadStatus(failedStatus);
        setError(err.response?.data?.message || '업로드 중 오류가 발생했습니다');
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">이미지 업로드</h1>

        {/* 업로드 모드 선택 탭 */}
        <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setUploadMode('file')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              uploadMode === 'file'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileImage className="w-5 h-5 inline-block mr-2" />
            파일 업로드
          </button>
          <button
            onClick={() => setUploadMode('camera')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              uploadMode === 'camera'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Camera className="w-5 h-5 inline-block mr-2" />
            카메라 촬영
          </button>
        </div>

        {/* 카메라 모드 */}
        {uploadMode === 'camera' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">카메라로 사진 촬영</h2>
            
            {cameraError ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full max-h-96 object-contain"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    사진 촬영
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 파일 업로드 모드 - 드래그 앤 드롭 영역 */}
        {uploadMode === 'file' && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging
              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
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
            <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              JPG, PNG, GIF, WEBP 파일 (최대 10MB, 최대 10개)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              파일 선택
            </button>
          </div>
        </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 transition-colors duration-200">
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">선택된 이미지</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden transition-colors duration-200">
                  <img
                    src={preview.url}
                    alt={preview.file}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* 업로드 상태 표시 */}
                  {uploadStatus[index] && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 rounded-lg flex flex-col items-center justify-center p-4">
                      {uploadStatus[index].status === 'uploading' && (
                        <div className="text-white text-center w-full">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-lg font-bold mb-1">{uploadStatus[index].progress}%</p>
                          {/* 개별 파일 진행률 바 */}
                          <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                            <div
                              className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadStatus[index].progress}%` }}
                            />
                          </div>
                          {uploadStatus[index].fileSize && (
                            <p className="text-xs text-white/80">
                              {((uploadStatus[index].fileSize * uploadStatus[index].progress) / 100 / 1024 / 1024).toFixed(2)} MB / {(uploadStatus[index].fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      )}
                      {uploadStatus[index].status === 'completed' && (
                        <div className="text-center">
                          <Check className="w-12 h-12 text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-white font-semibold">완료</p>
                        </div>
                      )}
                      {uploadStatus[index].status === 'failed' && (
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-white font-semibold">실패</p>
                          {uploadStatus[index].error && (
                            <p className="text-xs text-red-300 mt-1">{uploadStatus[index].error}</p>
                          )}
                        </div>
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
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate">{preview.file}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 업로드 진행률 */}
        {uploading && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">업로드 진행률</h3>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && (
                  <span className="text-xs text-white font-semibold">{uploadProgress}%</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{selectedFiles.length}개 파일 업로드 중</span>
              {uploadSpeed && (
                <span className="flex items-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{uploadSpeed} MB/s</span>
                </span>
              )}
            </div>
            {uploadProgress < 100 && uploadStartTime && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                {(() => {
                  const elapsed = (Date.now() - uploadStartTime) / 1000;
                  const remaining = uploadProgress > 0 ? (elapsed / uploadProgress) * (100 - uploadProgress) : 0;
                  return remaining > 0 ? `예상 남은 시간: ${Math.ceil(remaining)}초` : '';
                })()}
              </div>
            )}
          </div>
        )}

        {/* 업로드 버튼 */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleUpload}
              className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
            >
              업로드 ({selectedFiles.length}개 파일)
            </button>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setPreviews([]);
                setError(null);
              }}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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

