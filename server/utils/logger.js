/**
 * 구조화된 로깅 시스템
 * Winston을 사용한 로깅 설정
 * 환경별 설정을 통합하여 로깅 레벨 및 출력 방식 제어
 */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 환경별 설정 로드 (순환 참조 방지를 위해 직접 확인)
const nodeEnv = process.env.NODE_ENV || 'development';

// 로그 디렉토리 생성
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 콘솔 출력 포맷 (개발 환경용)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// 로그 레벨 설정 (환경별 기본값)
const getDefaultLogLevel = () => {
  if (nodeEnv === 'production') return 'info';
  if (nodeEnv === 'test') return 'error';
  return 'debug';
};

const logLevel = process.env.LOG_LEVEL || getDefaultLogLevel();

// 파일 로테이션 설정
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // 14일 보관
  format: logFormat,
  level: 'info'
});

// 에러 로그 파일 (에러만 별도 저장)
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // 에러는 30일 보관
  format: logFormat,
  level: 'error'
});

// Winston 로거 생성
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'perspec-api' },
  transports: [
    // 파일 로그
    fileRotateTransport,
    errorFileRotateTransport,
  ],
  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  // Promise 거부 처리
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat
    })
  ],
});

// 환경별 콘솔 출력 설정
if (nodeEnv === 'production') {
  // 프로덕션: 간단한 포맷으로 콘솔 출력 (컨테이너 로깅용)
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: logLevel
  }));
} else if (nodeEnv !== 'test') {
  // 개발 환경: 색상 포맷으로 콘솔 출력
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: logLevel
  }));
}
// 테스트 환경에서는 콘솔 출력하지 않음

// 헬퍼 메서드 추가
logger.request = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.errorRequest = (req, error, statusCode = 500) => {
  logger.error('HTTP Error', {
    method: req.method,
    url: req.url,
    status: statusCode,
    error: error.message,
    stack: error.stack,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.database = (operation, query, duration) => {
  logger.debug('Database Operation', {
    operation,
    query,
    duration: `${duration}ms`
  });
};

logger.security = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;

