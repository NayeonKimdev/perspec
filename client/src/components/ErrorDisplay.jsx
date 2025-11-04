import React, { useState } from 'react';
import { AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react';
import ErrorModal from './ErrorModal';
import { getErrorMessage, isRetryableError } from '../utils/errorHandler';

/**
 * 에러를 표시하는 재사용 가능한 컴포넌트
 * Toast와 함께 사용하거나 독립적으로 사용 가능
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss,
  showAsModal = false,
  className = '' 
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!error) return null;

  const errorInfo = getErrorMessage(error);
  const canRetry = isRetryableError(error);

  // 모달로 표시
  if (showAsModal) {
    return (
      <>
        <ErrorModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            if (onDismiss) onDismiss();
          }}
          title={errorInfo.title}
          message={errorInfo.message}
          type={errorInfo.type}
          onRetry={canRetry && onRetry ? () => {
            setShowModal(false);
            onRetry();
          } : null}
          showHomeButton={errorInfo.showHomeButton}
        />
        {/* 모달 트리거 버튼 (선택적) */}
      </>
    );
  }

  // 인라인 에러 표시
  const Icon = errorInfo.type === 'error' ? XCircle : AlertTriangle;
  const bgColor = errorInfo.type === 'error' 
    ? 'bg-red-50 border-red-200' 
    : 'bg-yellow-50 border-yellow-200';
  const textColor = errorInfo.type === 'error'
    ? 'text-red-800'
    : 'text-yellow-800';
  const iconColor = errorInfo.type === 'error'
    ? 'text-red-600'
    : 'text-yellow-600';

  return (
    <div className={`${bgColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {errorInfo.title}
          </h3>
          <p className={`text-sm ${textColor} whitespace-pre-line`}>
            {errorInfo.message}
          </p>
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;

