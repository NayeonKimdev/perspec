/**
 * 간단한 다국어 지원 유틸리티
 */

const translations = {
  ko: {
    errors: {
      network: {
        title: '서버 연결 오류',
        message: '서버에 연결할 수 없습니다.\n\n확인 사항:\n• 백엔드 서버가 실행 중인지 확인하세요 (포트 5000)\n• 인터넷 연결을 확인하세요'
      },
      timeout: {
        title: '요청 시간 초과',
        message: '요청 시간이 초과되었습니다.\n\n잠시 후 다시 시도해주세요.'
      },
      unknown: {
        title: '알 수 없는 오류',
        message: '예상치 못한 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.'
      },
      badRequest: {
        title: '잘못된 요청',
        message: '입력한 정보를 확인해주세요.'
      },
      unauthorized: {
        title: '인증 오류',
        message: '로그인이 필요하거나 세션이 만료되었습니다.\n\n로그인 페이지로 이동합니다.'
      },
      forbidden: {
        title: '접근 권한 없음',
        message: '이 작업을 수행할 권한이 없습니다.'
      },
      notFound: {
        title: '페이지를 찾을 수 없음',
        message: '요청한 리소스를 찾을 수 없습니다.'
      },
      conflict: {
        title: '충돌 발생',
        message: '이미 존재하는 데이터입니다.'
      },
      fileTooLarge: {
        title: '파일 크기 초과',
        message: '업로드한 파일이 너무 큽니다.\n\n파일 크기를 확인해주세요.'
      },
      validation: {
        title: '입력 데이터 오류',
        message: '입력한 데이터에 문제가 있습니다.\n\n확인 후 다시 시도해주세요.'
      },
      rateLimit: {
        title: '요청 한도 초과',
        message: '너무 많은 요청을 보냈습니다.\n\n잠시 후 다시 시도해주세요.'
      },
      serverError: {
        title: '서버 오류',
        message: '서버에서 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.'
      },
      serviceUnavailable: {
        title: '서비스 일시 중단',
        message: '서비스가 일시적으로 사용할 수 없습니다.\n\n확인 사항:\n• 데이터베이스 연결 상태\n• 서버 상태\n\n잠시 후 다시 시도해주세요.'
      },
      default: {
        title: '오류 발생',
        message: '오류가 발생했습니다.'
      }
    }
  },
  en: {
    errors: {
      network: {
        title: 'Server Connection Error',
        message: 'Unable to connect to the server.\n\nPlease check:\n• Backend server is running (port 5000)\n• Internet connection'
      },
      timeout: {
        title: 'Request Timeout',
        message: 'The request has timed out.\n\nPlease try again later.'
      },
      unknown: {
        title: 'Unknown Error',
        message: 'An unexpected error occurred.\n\nPlease try again later.'
      },
      badRequest: {
        title: 'Bad Request',
        message: 'Please check the information you entered.'
      },
      unauthorized: {
        title: 'Authentication Error',
        message: 'Login required or session expired.\n\nRedirecting to login page.'
      },
      forbidden: {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.'
      },
      notFound: {
        title: 'Not Found',
        message: 'The requested resource could not be found.'
      },
      conflict: {
        title: 'Conflict',
        message: 'Data already exists.'
      },
      fileTooLarge: {
        title: 'File Too Large',
        message: 'The uploaded file is too large.\n\nPlease check the file size.'
      },
      validation: {
        title: 'Validation Error',
        message: 'There is a problem with the entered data.\n\nPlease check and try again.'
      },
      rateLimit: {
        title: 'Rate Limit Exceeded',
        message: 'Too many requests sent.\n\nPlease try again later.'
      },
      serverError: {
        title: 'Server Error',
        message: 'An error occurred on the server.\n\nPlease try again later.'
      },
      serviceUnavailable: {
        title: 'Service Unavailable',
        message: 'The service is temporarily unavailable.\n\nPlease check:\n• Database connection status\n• Server status\n\nPlease try again later.'
      },
      default: {
        title: 'Error Occurred',
        message: 'An error occurred.'
      }
    }
  }
};

// 언어 감지 (localStorage 또는 브라우저 설정)
const getLanguage = () => {
  const saved = localStorage.getItem('language');
  if (saved && (saved === 'ko' || saved === 'en')) {
    return saved;
  }
  // 브라우저 언어 감지
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('en') ? 'en' : 'ko';
};

// 언어 설정
let currentLanguage = getLanguage();

export const setLanguage = (lang) => {
  if (lang === 'ko' || lang === 'en') {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
  }
};

export const getCurrentLanguage = () => currentLanguage;

export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (!value) {
    // 한국어로 fallback
    let fallbackValue = translations.ko;
    for (const k of keys) {
      fallbackValue = fallbackValue?.[k];
    }
    value = fallbackValue || key;
  }
  
  // 파라미터 치환
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }
  
  return value || key;
};

export default { t, setLanguage, getCurrentLanguage };












