const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * 보안 헤더 미들웨어 설정
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // OpenAI API 호출을 위해 false
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * 일반 API 요청 Rate Limiting
 * 15분 동안 최대 100회 요청
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 인증 관련 엔드포인트 Rate Limiting (더 엄격)
 * 15분 동안 최대 5회 요청 (브루트포스 방지)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 요청
  message: '너무 많은 로그인 시도를 했습니다. 15분 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트 제외
});

/**
 * 파일 업로드 Rate Limiting
 * 15분 동안 최대 20회 업로드
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 20, // 최대 20회 업로드
  message: '너무 많은 파일을 업로드했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 분석 요청 Rate Limiting (AI API 비용 절감)
 * 1시간 동안 최대 10회 분석 요청
 */
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // 최대 10회 분석 요청
  message: '분석 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  analysisLimiter,
};


