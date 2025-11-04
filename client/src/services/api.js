import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 기본 10초
});

// 긴 작업을 위한 별도 인스턴스 (레포트 생성 등)
const longRunningApi = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3분 (180초)
});

// 요청 인터셉터 - 토큰 자동 추가
longRunningApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 및 서버 오류 처리
longRunningApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 503) {
      console.error('503 Service Unavailable:', error.response?.data?.message || '서버 연결 오류');
    } else if (!error.response) {
      console.error('Network Error:', error.message);
      console.error('백엔드 서버가 실행 중인지 확인하세요 (포트 5000)');
    }
    return Promise.reject(error);
  }
);

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 및 서버 오류 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 503) {
      // 서비스 일시 중단 (데이터베이스 연결 실패 등)
      console.error('503 Service Unavailable:', error.response?.data?.message || '서버 연결 오류');
    } else if (!error.response) {
      // 네트워크 오류 또는 서버가 응답하지 않는 경우
      console.error('Network Error:', error.message);
      console.error('백엔드 서버가 실행 중인지 확인하세요 (포트 5000)');
    }
    return Promise.reject(error);
  }
);

// 미디어 관련 API
export const mediaApi = {
  // 단일 이미지 업로드
  uploadImage: (formData, onUploadProgress) => {
    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
  },

  // 다중 이미지 업로드
  uploadMultipleImages: (formData, onUploadProgress) => {
    return api.post('/media/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
  },

  // 미디어 목록 조회
  getMediaList: (params = {}) => {
    return api.get('/media/list', { params });
  },

  // 미디어 삭제
  deleteMedia: (id) => {
    return api.delete(`/media/${id}`);
  },

  // 특정 미디어의 분석 상태 조회
  getAnalysisStatus: (id) => {
    return api.get(`/media/${id}/analysis`);
  },

  // 모든 이미지 분석 결과 종합
  getAnalysisSummary: () => {
    return api.get('/media/analysis-summary');
  },

  // 재분석 요청
  retryAnalysis: (id) => {
    return api.post(`/media/${id}/retry-analysis`);
  },

  // 일괄 재분석 요청
  retryAllFailedAnalysis: () => {
    return api.post('/media/retry-all-failed-analysis');
  }
};

// 분석 관련 API
export const analysisApi = {
  // 통합 분석 생성 (프로필 + 이미지)
  createEnhancedAnalysis: () => {
    return api.post('/analysis/create-enhanced');
  }
};

// 문서 관련 API
export const documentApi = {
  // 단일 문서 업로드
  uploadDocument: (formData, onUploadProgress) => {
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
  },

  // 다중 문서 업로드
  uploadMultipleDocuments: (formData, onUploadProgress) => {
    return api.post('/documents/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
  },

  // 문서 목록 조회
  getDocumentList: (params = {}) => {
    return api.get('/documents/list', { params });
  },

  // 문서 검색
  searchDocuments: (params = {}) => {
    return api.get('/documents/search', { params });
  },

  // 특정 문서 조회
  getDocumentById: (id) => {
    return api.get(`/documents/${id}`);
  },

  // 문서 삭제
  deleteDocument: (id) => {
    return api.delete(`/documents/${id}`);
  },

  // 문서 분석 상태 조회
  getDocumentAnalysis: (id) => {
    return api.get(`/documents/${id}/analysis`);
  },

  // 문서 다운로드
  downloadDocument: (id) => {
    return api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
  }
};

// MBTI 관련 API
export const mbtiApi = {
  // MBTI 추정 생성
  estimateMBTI: () => {
    return api.post('/mbti/estimate');
  },

  // MBTI 추정 히스토리 조회
  getHistory: () => {
    return api.get('/mbti/history');
  },

  // 특정 MBTI 추정 결과 조회
  getEstimationById: (id) => {
    return api.get(`/mbti/${id}`);
  }
};

// 감정 분석 관련 API
export const emotionApi = {
  // 감정 분석 생성
  analyzeEmotions: () => {
    return api.post('/emotion/analyze');
  },

  // 최신 감정 분석 결과 조회
  getLatestAnalysis: () => {
    return api.get('/emotion/latest');
  }
};

// 레포트 관련 API
export const reportApi = {
  // 종합 레포트 생성 (타임아웃 3분)
  generateReport: (title) => {
    return longRunningApi.post('/reports/generate', { title });
  },

  // 레포트 목록 조회
  getReportList: () => {
    return api.get('/reports/list');
  },

  // 특정 레포트 조회
  getReportById: (id) => {
    return api.get(`/reports/${id}`);
  }
};

export default api;
