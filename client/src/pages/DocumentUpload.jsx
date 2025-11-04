import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, X, Upload, Check, AlertCircle, Edit3, FilePlus } from 'lucide-react';
import { documentApi } from '../services/api';

const DocumentUpload = () => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'editor'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // 텍스트 에디터 관련 상태
  const [editorContent, setEditorContent] = useState('');
  const [editorFileName, setEditorFileName] = useState('');
  const [editorType, setEditorType] = useState('note'); // 'note', 'diary', 'other'
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 허용된 파일 타입
  const allowedTypes = ['.txt', '.md', '.json', '.csv', '.log'];
  const allowedMimeTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv', 'text/x-log'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 10;

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
      // MIME 타입이 허용된 형식인지 먼저 확인
      const isValidMimeType = allowedMimeTypes.includes(file.type);
      
      // 파일 확장자 확인
      let ext = '';
      const fileNameParts = file.name.split('.');
      
      // 파일명에 점이 있고, 마지막 부분이 실제 확장자인지 확인 (5자 이하)
      if (fileNameParts.length > 1) {
        const lastPart = fileNameParts[fileNameParts.length - 1].toLowerCase();
        if (lastPart.length <= 5 && lastPart.length > 0) {
          ext = '.' + lastPart;
        }
      }
      
      // 확장자 또는 MIME 타입이 허용된 형식인지 확인
      const isValidType = (ext && allowedTypes.includes(ext)) || isValidMimeType;
      
      if (!isValidType) {
        invalidFiles.push({ file, error: `${file.name}: 텍스트 파일만 업로드 가능합니다 (.txt, .md, .json, .csv, .log)` });
        return;
      }

      // 파일 크기 검증
      if (file.size > maxSize) {
        invalidFiles.push({ file, error: `${file.name}: 파일 크기는 5MB 이하여야 합니다` });
        return;
      }

      validFiles.push(file);
    });

    // 파일 개수 제한
    const remainingSlots = maxFiles - selectedFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      setError(`최대 ${maxFiles}개까지만 업로드 가능합니다. ${remainingSlots}개만 추가되었습니다.`);
    }

    setSelectedFiles([...selectedFiles, ...filesToAdd]);

    // 파일 미리보기 생성 (텍스트 파일의 첫 500자)
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const preview = content.length > 500 ? content.substring(0, 500) + '...' : content;
        setFilePreviews(prev => [...prev, { 
          fileName: file.name, 
          preview: preview,
          size: file.size,
          type: file.type
        }]);
      };
      reader.readAsText(file, 'UTF-8');
    });

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(item => item.error).join(' / ');
      setError(errorMessages);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    const newProgress = { ...uploadProgress };
    delete newProgress[index];
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
    setUploadProgress(newProgress);
  };

  // 텍스트 에디터에서 파일 생성
  const createFileFromEditor = () => {
    if (!editorContent.trim()) {
      setError('텍스트를 입력해주세요');
      return;
    }

    let fileName = editorFileName.trim() || `note_${new Date().getTime()}`;
    
    // 파일명에 확장자가 없으면 .txt 추가
    if (!fileName.includes('.') || fileName.endsWith('.')) {
      fileName += '.txt';
    } else {
      // 확장자가 허용된 형식인지 확인
      const ext = '.' + fileName.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(ext)) {
        fileName += '.txt'; // 허용되지 않은 확장자면 .txt 추가
      }
    }
    
    const blob = new Blob([editorContent], { type: 'text/plain' });
    const file = new File([blob], fileName, { type: 'text/plain' });

    // 파일 목록에 추가
    processFiles([file]);
    
    // 에디터 초기화
    setEditorContent('');
    setEditorFileName('');
    setUploadMode('file'); // 파일 모드로 전환하여 업로드 가능하게 함
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 업로드
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('파일을 선택해주세요');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      if (selectedFiles.length === 1) {
        // 단일 파일 업로드
        const formData = new FormData();
        formData.append('document', selectedFiles[0]);

        const response = await documentApi.uploadDocument(formData, (progress) => {
          setUploadProgress({ 0: progress });
        });

        if (response.data.document) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/documents');
          }, 2000);
        }
      } else {
        // 다중 파일 업로드
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('documents', file);
        });

        const response = await documentApi.uploadMultipleDocuments(formData, (progress) => {
          setUploadProgress({ all: progress });
        });

        if (response.data.documents && response.data.documents.length > 0) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/documents');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('업로드 오류:', err);
      console.error('오류 응답:', err.response?.data);
      
      // 503 오류인 경우 더 자세한 메시지
      if (err.response?.status === 503) {
        const errorMessage = err.response?.data?.message || '데이터베이스 연결이 필요합니다.';
        setError(`${errorMessage}\n\n해결 방법:\n1. 백엔드 서버가 실행 중인지 확인하세요 (포트 5000)\n2. PostgreSQL이 실행 중인지 확인하세요\n3. server/.env 파일의 데이터베이스 설정을 확인하세요`);
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('서버에 연결할 수 없습니다.\n\n백엔드 서버가 실행 중인지 확인하세요:\ncd server && npm run dev');
      } else {
        // 서버에서 반환한 상세 오류 메시지 표시
        const errorMessage = err.response?.data?.message || '파일 업로드 중 오류가 발생했습니다';
        const errorDetail = err.response?.data?.error;
        const errorDetails = err.response?.data?.details;
        
        let fullErrorMessage = errorMessage;
        if (errorDetail) {
          fullErrorMessage += `\n\n상세: ${errorDetail}`;
        }
        if (errorDetails && process.env.NODE_ENV === 'development') {
          fullErrorMessage += `\n\n디버그 정보:\n${errorDetails}`;
        }
        
        setError(fullErrorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">텍스트 문서 업로드</h1>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="text-gray-600 hover:text-gray-800"
            >
              목록으로
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            일기, 메모, JSON 파일 등을 업로드하여 분석을 받아보세요
          </p>

          {/* 업로드 모드 선택 탭 */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                uploadMode === 'file'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FilePlus className="w-5 h-5 inline-block mr-2" />
              파일 업로드
            </button>
            <button
              onClick={() => setUploadMode('editor')}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                uploadMode === 'editor'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="w-5 h-5 inline-block mr-2" />
              직접 작성
            </button>
          </div>

          {/* 텍스트 에디터 모드 */}
          {uploadMode === 'editor' && (
            <div className="mb-6 bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">텍스트 직접 작성</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문서 제목
                  </label>
                  <input
                    type="text"
                    value={editorFileName}
                    onChange={(e) => setEditorFileName(e.target.value)}
                    placeholder="예: 내_일기_2024.txt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문서 유형
                  </label>
                  <select
                    value={editorType}
                    onChange={(e) => setEditorType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="note">메모</option>
                    <option value="diary">일기</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="텍스트를 입력하세요..."
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {editorContent.length}자 작성됨
                  </p>
                </div>

                <button
                  onClick={createFileFromEditor}
                  disabled={!editorContent.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  파일로 추가하기
                </button>
              </div>
            </div>
          )}

          {/* 파일 선택 영역 */}
          {uploadMode === 'file' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </p>
            <p className="text-sm text-gray-500 mb-4">
              지원 형식: .txt, .md, .json, .csv, .log (최대 5MB)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.log"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          )}

          {/* 선택된 파일 목록 */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">선택된 파일 ({selectedFiles.length}개)</h2>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-800">{file.name}</span>
                          <span className="text-sm text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        
                        {/* 미리보기 */}
                        {filePreviews[index] && (
                          <div className="mt-2 p-3 bg-white rounded border text-sm text-gray-600 max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {filePreviews[index].preview}
                            </pre>
                          </div>
                        )}

                        {/* 진행률 */}
                        {uploadProgress[index] !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {uploadProgress[index]}% 업로드 중...
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-600 whitespace-pre-line text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-600">업로드 완료! 문서 목록 페이지로 이동합니다...</p>
            </div>
          )}

          {/* 업로드 버튼 */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setFilePreviews([]);
                setUploadProgress({});
                setError(null);
                setSuccess(false);
                setEditorContent('');
                setEditorFileName('');
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
