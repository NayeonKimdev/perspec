/**
 * 사용자 친화적인 에러 메시지 변환 유틸리티
 */

export const getErrorMessage = (error) => {
  // 네트워크 에러
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return {
        title: '서버 연결 오류',
        message: '서버에 연결할 수 없습니다.\n\n확인 사항:\n• 백엔드 서버가 실행 중인지 확인하세요 (포트 5000)\n• 인터넷 연결을 확인하세요',
        type: 'error',
        showHomeButton: false
      };
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        title: '요청 시간 초과',
        message: '요청 시간이 초과되었습니다.\n\n잠시 후 다시 시도해주세요.',
        type: 'warning',
        showHomeButton: false
      };
    }

    return {
      title: '알 수 없는 오류',
      message: '예상치 못한 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.',
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
        title: '잘못된 요청',
        message: data?.message || '입력한 정보를 확인해주세요.',
        type: 'warning',
        showHomeButton: false
      };

    case 401:
      return {
        title: '인증 오류',
        message: '로그인이 필요하거나 세션이 만료되었습니다.\n\n로그인 페이지로 이동합니다.',
        type: 'warning',
        showHomeButton: false
      };

    case 403:
      return {
        title: '접근 권한 없음',
        message: '이 작업을 수행할 권한이 없습니다.',
        type: 'error',
        showHomeButton: true
      };

    case 404:
      return {
        title: '페이지를 찾을 수 없음',
        message: '요청한 리소스를 찾을 수 없습니다.',
        type: 'warning',
        showHomeButton: true
      };

    case 409:
      return {
        title: '충돌 발생',
        message: data?.message || '이미 존재하는 데이터입니다.',
        type: 'warning',
        showHomeButton: false
      };

    case 413:
      return {
        title: '파일 크기 초과',
        message: '업로드한 파일이 너무 큽니다.\n\n파일 크기를 확인해주세요.',
        type: 'warning',
        showHomeButton: false
      };

    case 422:
      return {
        title: '입력 데이터 오류',
        message: data?.message || '입력한 데이터에 문제가 있습니다.\n\n확인 후 다시 시도해주세요.',
        type: 'warning',
        showHomeButton: false
      };

    case 429:
      return {
        title: '요청 한도 초과',
        message: '너무 많은 요청을 보냈습니다.\n\n잠시 후 다시 시도해주세요.',
        type: 'warning',
        showHomeButton: false
      };

    case 500:
      return {
        title: '서버 오류',
        message: '서버에서 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.',
        type: 'error',
        showHomeButton: true
      };

    case 503:
      return {
        title: '서비스 일시 중단',
        message: '서비스가 일시적으로 사용할 수 없습니다.\n\n확인 사항:\n• 데이터베이스 연결 상태\n• 서버 상태\n\n잠시 후 다시 시도해주세요.',
        type: 'error',
        showHomeButton: true
      };

    default:
      return {
        title: '오류 발생',
        message: data?.message || `오류가 발생했습니다. (${status})`,
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

