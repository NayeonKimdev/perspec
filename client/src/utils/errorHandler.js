/**
 * 사용자 친화적인 에러 메시지 변환 유틸리티
 */
import { t } from './i18n';

export const getErrorMessage = (error) => {
  // 네트워크 에러
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        title: t('errors.network.title'),
        message: t('errors.network.message'),
        type: 'error',
        showHomeButton: false
      };
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        title: t('errors.timeout.title'),
        message: t('errors.timeout.message'),
        type: 'warning',
        showHomeButton: false
      };
    }

    return {
      title: t('errors.unknown.title'),
      message: t('errors.unknown.message'),
      type: 'error',
      showHomeButton: false
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  // HTTP 상태 코드별 처리
  switch (status) {
    case 400:
      return {
        title: t('errors.badRequest.title'),
        message: data?.message || t('errors.badRequest.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 401:
      return {
        title: t('errors.unauthorized.title'),
        message: t('errors.unauthorized.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 403:
      return {
        title: t('errors.forbidden.title'),
        message: t('errors.forbidden.message'),
        type: 'error',
        showHomeButton: true
      };

    case 404:
      return {
        title: t('errors.notFound.title'),
        message: t('errors.notFound.message'),
        type: 'warning',
        showHomeButton: true
      };

    case 409:
      return {
        title: t('errors.conflict.title'),
        message: data?.message || t('errors.conflict.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 413:
      return {
        title: t('errors.fileTooLarge.title'),
        message: t('errors.fileTooLarge.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 422:
      return {
        title: t('errors.validation.title'),
        message: data?.message || t('errors.validation.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 429:
      return {
        title: t('errors.rateLimit.title'),
        message: t('errors.rateLimit.message'),
        type: 'warning',
        showHomeButton: false
      };

    case 500:
      return {
        title: t('errors.serverError.title'),
        message: t('errors.serverError.message'),
        type: 'error',
        showHomeButton: true
      };

    case 503:
      return {
        title: t('errors.serviceUnavailable.title'),
        message: t('errors.serviceUnavailable.message'),
        type: 'error',
        showHomeButton: true
      };

    default:
      return {
        title: t('errors.default.title'),
        message: data?.message || `${t('errors.default.message')} (${status})`,
        type: 'error',
        showHomeButton: false
      };
  }
};

/**
 * 에러를 Toast 메시지로 변환
 */
export const getToastMessage = (error) => {
  const errorInfo = getErrorMessage(error);
  return errorInfo.message;
};

/**
 * 에러가 재시도 가능한지 확인
 */
export const isRetryableError = (error) => {
  if (!error.response) {
    // 네트워크 에러는 재시도 가능
    return true;
  }

  const status = error.response.status;
  // 5xx 에러와 429(요청 한도)는 재시도 가능
  return status >= 500 || status === 429 || status === 408;
};

