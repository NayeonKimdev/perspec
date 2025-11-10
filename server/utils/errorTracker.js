/**
 * @fileoverview 에러 추적 서비스
 * 구조화된 에러 로깅 및 추적을 위한 유틸리티
 * 추후 Sentry 등의 서비스와 통합 가능하도록 설계
 * @module utils/errorTracker
 */

const logger = require('./logger');

/**
 * 에러 분류 타입
 * @enum {string}
 */
const ErrorType = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  DATABASE: 'database',
  EXTERNAL_API: 'external_api',
  FILE_SYSTEM: 'file_system',
  NETWORK: 'network',
  INTERNAL: 'internal',
  UNKNOWN: 'unknown'
};

/**
 * 에러 심각도 레벨
 * @enum {string}
 */
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * 에러 분류 함수
 * 에러 메시지나 타입을 기반으로 에러 분류
 * @param {Error} error - 에러 객체
 * @returns {keyof typeof ErrorType} 에러 타입
 */
const classifyError = (error) => {
  if (!error) return ErrorType.UNKNOWN;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // 데이터베이스 관련 에러
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('sequelize') ||
    errorMessage.includes('postgres') ||
    errorCode.includes('sql') ||
    errorCode.includes('db')
  ) {
    return ErrorType.DATABASE;
  }

  // 인증 관련 에러
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('token') ||
    errorMessage.includes('jwt') ||
    errorCode === '401'
  ) {
    return ErrorType.AUTHENTICATION;
  }

  // 권한 관련 에러
  if (
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('authorization') ||
    errorCode === '403'
  ) {
    return ErrorType.AUTHORIZATION;
  }

  // 검증 에러
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorCode === '400'
  ) {
    return ErrorType.VALIDATION;
  }

  // 파일 시스템 에러
  if (
    errorMessage.includes('enoent') ||
    errorMessage.includes('file') ||
    errorMessage.includes('path') ||
    errorCode.includes('fs')
  ) {
    return ErrorType.FILE_SYSTEM;
  }

  // 외부 API 에러
  if (
    errorMessage.includes('api') ||
    errorMessage.includes('openai') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('api')
  ) {
    return ErrorType.EXTERNAL_API;
  }

  // 네트워크 에러
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('net')
  ) {
    return ErrorType.NETWORK;
  }

  // 404 에러
  if (errorMessage.includes('not found') || errorCode === '404') {
    return ErrorType.NOT_FOUND;
  }

  return ErrorType.INTERNAL;
};

/**
 * 에러 심각도 판단 함수
 * @param {Error} error - 에러 객체
 * @param {keyof typeof ErrorType} errorType - 에러 타입
 * @returns {keyof typeof ErrorSeverity} 심각도 레벨
 */
const determineSeverity = (error, errorType) => {
  // 데이터베이스 에러는 높은 심각도
  if (errorType === ErrorType.DATABASE) {
    return ErrorSeverity.HIGH;
  }

  // 외부 API 에러는 중간 심각도
  if (errorType === ErrorType.EXTERNAL_API) {
    return ErrorSeverity.MEDIUM;
  }

  // 인증/권한 에러는 중간 심각도
  if (
    errorType === ErrorType.AUTHENTICATION ||
    errorType === ErrorType.AUTHORIZATION
  ) {
    return ErrorSeverity.MEDIUM;
  }

  // 검증 에러는 낮은 심각도
  if (errorType === ErrorType.VALIDATION || errorType === ErrorType.NOT_FOUND) {
    return ErrorSeverity.LOW;
  }

  // 그 외는 중간 심각도
  return ErrorSeverity.MEDIUM;
};

/**
 * 에러 추적 및 로깅
 * @param {Error} error - 에러 객체
 * @param {Object} context - 추가 컨텍스트 정보
 * @param {import('express').Request} [req] - Express 요청 객체 (선택사항)
 * @returns {Object} 에러 추적 정보
 */
const trackError = (error, context = {}, req = null) => {
  const errorType = classifyError(error);
  const severity = determineSeverity(error, errorType);

  // 에러 추적 정보 구성
  const errorInfo = {
    message: error.message || 'Unknown error',
    type: errorType,
    severity: severity,
    stack: error.stack,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...context
  };

  // 요청 정보 추가 (있는 경우)
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      query: req.query,
      body: req.body ? Object.keys(req.body) : null // 보안을 위해 키만 저장
    };
  }

  // 심각도에 따른 로깅 레벨 결정
  const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' :
                   severity === ErrorSeverity.HIGH ? 'error' :
                   severity === ErrorSeverity.MEDIUM ? 'warn' : 'warn';

  // 구조화된 에러 로깅
  logger[logLevel]('에러 추적', errorInfo);

  // 추후 Sentry 등 외부 서비스 통합 포인트
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     tags: {
  //       errorType,
  //       severity
  //     },
  //     extra: context,
  //     user: req?.user ? { id: req.user.id } : undefined
  //   });
  // }

  return errorInfo;
};

/**
 * 에러 응답 생성
 * 프로덕션 환경에서는 민감한 정보를 숨김
 * @param {Error} error - 에러 객체
 * @param {keyof typeof ErrorType} errorType - 에러 타입
 * @param {boolean} [isProduction=false] - 프로덕션 환경 여부
 * @returns {Object} 클라이언트에게 보낼 에러 응답 객체
 */
const createErrorResponse = (error, errorType, isProduction = false) => {
  const baseResponse = {
    message: '서버 내부 오류가 발생했습니다.',
    type: errorType
  };

  // 개발 환경에서는 상세 정보 포함
  if (!isProduction) {
    baseResponse.error = error.message;
    baseResponse.stack = error.stack;
  }

  // 에러 타입별 사용자 친화적 메시지
  switch (errorType) {
    case ErrorType.VALIDATION:
      baseResponse.message = error.message || '입력 데이터가 유효하지 않습니다.';
      break;
    case ErrorType.AUTHENTICATION:
      baseResponse.message = '인증이 필요합니다.';
      break;
    case ErrorType.AUTHORIZATION:
      baseResponse.message = '접근 권한이 없습니다.';
      break;
    case ErrorType.NOT_FOUND:
      baseResponse.message = '요청한 리소스를 찾을 수 없습니다.';
      break;
    case ErrorType.DATABASE:
      baseResponse.message = '데이터베이스 오류가 발생했습니다.';
      break;
    case ErrorType.EXTERNAL_API:
      baseResponse.message = '외부 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
      break;
    case ErrorType.FILE_SYSTEM:
      baseResponse.message = '파일 처리 중 오류가 발생했습니다.';
      break;
    case ErrorType.NETWORK:
      baseResponse.message = '네트워크 오류가 발생했습니다.';
      break;
  }

  return baseResponse;
};

/**
 * Promise 에러 처리 헬퍼
 * async/await 함수에서 발생하는 에러를 자동으로 추적
 * @param {Function} fn - async 함수
 * @returns {Function} 에러 추적이 포함된 래퍼 함수
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const errorInfo = trackError(error, { handler: 'asyncHandler' }, req);
      const errorType = errorInfo.type;
      const isProduction = process.env.NODE_ENV === 'production';
      const errorResponse = createErrorResponse(error, errorType, isProduction);

      // HTTP 상태 코드 결정
      let statusCode = 500;
      if (errorType === ErrorType.VALIDATION) statusCode = 400;
      else if (errorType === ErrorType.AUTHENTICATION) statusCode = 401;
      else if (errorType === ErrorType.AUTHORIZATION) statusCode = 403;
      else if (errorType === ErrorType.NOT_FOUND) statusCode = 404;

      res.status(statusCode).json(errorResponse);
    });
  };
};

module.exports = {
  trackError,
  classifyError,
  determineSeverity,
  createErrorResponse,
  asyncHandler,
  ErrorType,
  ErrorSeverity
};

