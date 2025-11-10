/**
 * HTTP 요청 로깅 미들웨어
 * 요청/응답 정보를 구조화된 로그로 기록
 */
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 요청 정보 상세 로깅 (디버깅용)
  if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
    logger.debug('요청 수신', {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      baseUrl: req.baseUrl,
      query: req.query,
      ip: req.ip
    });
  }

  // 응답이 완료되면 로그 기록
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // 에러 상태 코드는 별도로 로깅
    if (res.statusCode >= 400) {
      logger.errorRequest(req, {
        message: `HTTP ${res.statusCode}`,
        statusCode: res.statusCode
      }, res.statusCode);
    } else {
      logger.request(req, res, responseTime);
    }
  });

  next();
};

module.exports = requestLogger;

