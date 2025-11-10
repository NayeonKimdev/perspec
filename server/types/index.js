/**
 * @fileoverview JSDoc 타입 정의 파일
 * 프로젝트 전반에서 사용되는 공통 타입 정의
 * @module types
 */

/**
 * Express Request 확장 타입
 * @typedef {Object} AuthenticatedRequest
 * @property {Object} user - 인증된 사용자 정보
 * @property {string} user.id - 사용자 ID (UUID)
 * @property {string} user.email - 사용자 이메일
 */

/**
 * 분석 상태 타입
 * @typedef {'pending'|'analyzing'|'completed'|'failed'} AnalysisStatus
 */

/**
 * 문서 타입
 * @typedef {'note'|'diary'|'json'|'other'} DocumentType
 */

/**
 * 이미지 최적화 결과 타입
 * @typedef {Object} OptimizationResult
 * @property {string} originalPath - 원본 파일 경로
 * @property {string} optimizedPath - 최적화된 파일 경로
 * @property {number} originalSize - 원본 파일 크기 (바이트)
 * @property {number} optimizedSize - 최적화된 파일 크기 (바이트)
 * @property {string} compressionRatio - 압축률 (%)
 * @property {string} format - 이미지 포맷
 * @property {Object} dimensions - 이미지 크기 정보
 * @property {Object} dimensions.original - 원본 이미지 크기
 * @property {number} dimensions.original.width - 원본 너비
 * @property {number} dimensions.original.height - 원본 높이
 * @property {Object} dimensions.optimized - 최적화된 이미지 크기
 * @property {number} dimensions.optimized.width - 최적화 너비
 * @property {number} dimensions.optimized.height - 최적화 높이
 */

/**
 * 분석 결과 타입
 * @typedef {Object} AnalysisResult
 * @property {Object} mbti - MBTI 분석 결과
 * @property {Object} emotion - 감정 분석 결과
 * @property {Object} report - 종합 리포트
 */

/**
 * 페이지네이션 파라미터
 * @typedef {Object} PaginationParams
 * @property {number} [page=1] - 페이지 번호
 * @property {number} [limit=10] - 페이지당 항목 수
 */

/**
 * 페이지네이션 결과
 * @typedef {Object} PaginationResult
 * @property {Array} items - 항목 배열
 * @property {number} total - 전체 항목 수
 * @property {number} page - 현재 페이지
 * @property {number} limit - 페이지당 항목 수
 * @property {number} totalPages - 전체 페이지 수
 */


