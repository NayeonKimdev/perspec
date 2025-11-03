import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

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

// 응답 인터셉터 - 토큰 만료 처리
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

export default api;
