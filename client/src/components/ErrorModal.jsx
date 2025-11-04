import React from 'react';
import { XCircle, AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorModal = ({ 
  isOpen, 
  onClose, 
  title = '오류가 발생했습니다', 
  message, 
  type = 'error',
  onRetry,
  showHomeButton = false
}) => {
  if (!isOpen) return null;

  const icons = {
    error: XCircle,
    warning: AlertTriangle
  };

  const Icon = icons[type] || XCircle;

  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    }
  };

  const colorScheme = colors[type] || colors.error;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative ${colorScheme.bg} ${colorScheme.border} border-2 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all`}>
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <XCircle className="w-5 h-5" />
          </button>

          {/* 아이콘 및 내용 */}
          <div className="flex flex-col items-center text-center">
            <div className={`${colorScheme.icon} mb-4`}>
              <Icon className="w-16 h-16" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>

            <div className="text-gray-700 mb-6 whitespace-pre-line">
              {message}
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3 w-full">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`flex-1 flex items-center justify-center gap-2 ${colorScheme.button} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </button>
              )}
              
              {showHomeButton && (
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  홈으로
                </button>
              )}

              {!onRetry && !showHomeButton && (
                <button
                  onClick={onClose}
                  className={`flex-1 ${colorScheme.button} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

