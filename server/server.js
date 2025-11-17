const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const { ensureDirectoriesExist } = require('./config/storage');
const { validateAndThrow } = require('./config/envValidator');
const envConfig = require('./config/environments');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { swaggerSetup } = require('./config/swagger');
const { trackError } = require('./utils/errorTracker');
const passport = require('./config/passport');
const {
  securityHeaders,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  analysisLimiter,
} = require('./middleware/security');

// 환경변수 로드
dotenv.config({ path: path.join(__dirname, '.env') });

// AWS Secrets Manager 초기화 (프로덕션 환경)
// 서버 시작 전에 완료되어야 하므로 동기적으로 대기
if (process.env.NODE_ENV === 'production') {
  const { initializeSecrets } = require('./config/awsSecretsManager');
  // 비동기 초기화를 동기적으로 대기
  (async () => {
    try {
      await initializeSecrets();
      // Secrets Manager 로드 후 passport 전략 재등록
      const passport = require('./config/passport');
      if (passport.initializePassportStrategies) {
        passport.initializePassportStrategies();
        logger.info('Secrets Manager 초기화 완료, Passport 전략 재등록 완료');
      }
    } catch (error) {
      logger.error('Secrets Manager 초기화 실패', { error: error.message });
      // 프로덕션에서는 환경 변수 직접 사용 시도
    }
  })();
}

// 환경별 설정 로드
const nodeEnv = process.env.NODE_ENV || 'development';
const appConfig = envConfig.getConfig();

// 환경변수 검증 (개발 환경에서는 경고만, 프로덕션에서는 에러)
try {
  if (nodeEnv === 'production') {
    validateAndThrow('production');
  } else {
    const result = require('./config/envValidator').validateEnvVars(nodeEnv);
    if (!result.isValid) {
      logger.warn('일부 환경변수가 설정되지 않았습니다. 개발 환경에서는 계속 진행합니다.', {
        missing: result.missing
      });
    }
  }
} catch (error) {
  logger.error('환경변수 검증 실패', { error: error.message });
  if (nodeEnv === 'production') {
    process.exit(1);
  }
}

// 업로드 디렉토리 생성
ensureDirectoriesExist();

// API 버전 관리 라우터는 routes/v1.js에서 처리하므로 여기서는 제거

const app = express();
const PORT = process.env.PORT || 5000;

// 긴 작업을 위한 타임아웃 설정 (3분)
app.timeout = 180000; // 3분

// 보안 미들웨어 (가장 먼저 적용)
app.use(securityHeaders);

// Trust Proxy 설정 (리버스 프록시 사용 시)
if (appConfig.trustProxy) {
  app.set('trust proxy', true);
}

// CORS 설정 (환경별로 다르게 설정)
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경에서는 모든 origin 허용
    if (envConfig.isDevelopment || !origin) {
      return callback(null, true);
    }

    // 프로덕션 환경에서는 설정된 origin만 허용
    const allowedOrigins = appConfig.corsOrigin && appConfig.corsOrigin !== '*'
      ? appConfig.corsOrigin.split(',').map((o) => o.trim())
      : [];

    if (allowedOrigins.length === 0) {
      // CORS_ORIGIN이 설정되지 않았으면 모든 origin 허용 (경고)
      logger.warn('CORS_ORIGIN이 설정되지 않아 모든 origin을 허용합니다.');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.security('CORS 차단', { origin });
      callback(new Error('CORS 정책에 의해 허용되지 않은 origin입니다.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 응답 압축 미들웨어 (설정에 따라)
if (appConfig.compressionEnabled) {
  app.use(compression());
}

// 요청 로깅 미들웨어
app.use(requestLogger);

// Body parser 미들웨어 (환경별 설정)
app.use(express.json({ limit: appConfig.maxRequestBodySize || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: appConfig.maxRequestBodySize || '10mb' }));

// 세션 설정 (Passport를 위한 최소 설정, JWT를 주로 사용하므로 간단하게 설정)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: nodeEnv === 'production', // 프로덕션에서는 HTTPS만
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 제공 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 버전 관리 라우터 로드
let apiRouter;
try {
  apiRouter = require('./routes/api');
  logger.info('API 라우터 로드 성공', { loaded: !!apiRouter });
} catch (error) {
  logger.error('API 라우터 로드 실패', { error: error.message, stack: error.stack });
  apiRouter = null;
}

// API 버전 관리 라우트 등록
if (apiRouter) {
  // 레거시 경로를 v1으로 리다이렉트하는 미들웨어
  // 모든 /api 요청을 가로채서 레거시 경로인지 확인
  const legacyPaths = ['/auth', '/profile', '/media', '/documents', '/analysis', '/mbti', '/emotion', '/reports'];
  
  // 레거시 경로 프록시 미들웨어 (requestLogger 이후에 배치)
  app.use('/api', (req, res, next) => {
    // req.originalUrl에서 직접 경로 추출
    const originalUrl = req.originalUrl; // /api/media/upload
    let path = originalUrl;
    
    // 쿼리 문자열 제거
    const queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      path = path.substring(0, queryIndex);
    }
    
    // /api 제거
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    
    // 디버깅: 모든 /api 요청 로깅
    logger.info('레거시 프록시 미들웨어 실행', {
      originalUrl,
      reqPath: req.path,
      extractedPath: path,
      method: req.method
    });
    
    // 레거시 경로인지 확인
    for (const legacyPath of legacyPaths) {
      if (path.startsWith(legacyPath)) {
        // /media/upload -> /upload 추출
        const remainingPath = path.substring(legacyPath.length) || '/';
        const v1Path = `/v1${legacyPath}${remainingPath}`;
        
        logger.info('레거시 경로 프록시 실행 - 변환', {
          originalUrl,
          path,
          v1Path,
          method: req.method
        });
        
        // URL 재설정
        const originalBaseUrl = req.baseUrl;
        const originalPath = req.path;
        
        req.url = v1Path;
        req.baseUrl = '/api';
        req.originalUrl = `/api${v1Path}`;
        
        // apiRouter로 요청 전달
        return apiRouter(req, res, (err) => {
          if (err) {
            req.url = originalPath;
            req.baseUrl = originalBaseUrl;
            req.originalUrl = originalUrl;
            logger.error('레거시 경로 프록시 에러', {
              error: err.message,
              originalUrl,
              v1Path
            });
            return next(err);
          }
        });
      }
    }
    
    // 레거시 경로가 아니면 다음 미들웨어로 (v1 경로는 apiRouter가 처리)
    next();
  });
  
  // 정상 v1 경로 처리
  app.use('/api', apiRouter);
  logger.info('API 라우터 등록 완료', { path: '/api' });
} else {
  logger.error('API 라우터가 null입니다. /api 엔드포인트가 작동하지 않습니다.');
  app.use('/api', (req, res) => {
    res.status(503).json({ message: 'API 라우터를 로드할 수 없습니다.' });
  });
}

// 기본 라우트
/**
 * @swagger
 * /:
 *   get:
 *     summary: 서버 상태 확인
 *     tags: [헬스]
 *     responses:
 *       200:
 *         description: 서버가 정상적으로 실행 중입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perspec API 서버가 실행 중입니다.
 */
app.get('/', (req, res) => {
  res.json({ message: 'Perspec API 서버가 실행 중입니다.' });
});

// Swagger API 문서 설정 (환경별 제어)
if (appConfig.enableSwagger) {
  try {
    swaggerSetup(app);
    logger.info('Swagger API 문서 설정 완료', { path: '/api-docs' });
  } catch (error) {
    logger.warn('Swagger 설정 실패', { error: error.message });
  }
} else {
  logger.debug('Swagger API 문서가 비활성화되어 있습니다.');
}

// 헬스 체크 엔드포인트 (인증 불필요)
try {
  const healthController = require('./controllers/healthController');
  app.get('/health', healthController.healthCheck);
  app.get('/health/live', healthController.livenessProbe);
  app.get('/health/ready', healthController.readinessProbe);
  logger.debug('헬스 체크 엔드포인트 등록 완료');
} catch (error) {
  logger.warn('헬스 체크 컨트롤러를 로드할 수 없습니다', { error: error.message });
}

// 에러 핸들링 미들웨어 (환경별 에러 정보 표시)
app.use((err, req, res, next) => {
  // 에러 추적 및 로깅
  const errorInfo = trackError(err, {
    middleware: 'errorHandler',
    route: req.path,
    method: req.method
  }, req);
  
  logger.error('서버 에러 발생', {
    error: err.message,
    stack: appConfig.showErrorDetails ? err.stack : undefined,
    url: req.url,
    method: req.method,
    errorType: errorInfo.type,
    severity: errorInfo.severity
  });
  
  const errorResponse = {
    message: '서버 내부 오류가 발생했습니다.'
  };
  
  // 개발 환경에서는 에러 상세 정보 포함
  if (appConfig.showErrorDetails) {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
    errorResponse.type = errorInfo.type;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// 404 핸들러
app.use('*', (req, res) => {
  logger.warn('404 Not Found', { url: req.url, method: req.method });
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 분석 큐 초기화 및 시작
try {
  logger.debug('분석 큐 모듈 로드 시도');
  const analysisQueue = require('./services/analysisQueue');
  logger.debug('분석 큐 모듈 로드 성공');
  
  // 비동기 초기화를 서버 시작 후에 실행
  setTimeout(async () => {
    try {
      logger.debug('분석 큐 초기화 시작');
      await analysisQueue.restorePendingItems();
      logger.debug('분석 큐 복구 완료, 처리 시작');
      analysisQueue.startProcessing();
      logger.debug('이미지 분석 큐가 시작되었습니다');
    } catch (error) {
      logger.error('이미지 분석 큐 시작 실패', {
        error: error.message,
        stack: error.stack
      });
    }
  }, 2000); // 서버가 완전히 시작된 후 2초 뒤에 초기화
  
} catch (error) {
  logger.error('이미지 분석 큐를 로드할 수 없습니다', {
    error: error.message,
    stack: error.stack
  });
}

// 파일 정리 스케줄러 초기화 및 시작
try {
  const fileCleanupScheduler = require('./services/fileCleanupScheduler');
  setTimeout(() => {
    try {
      fileCleanupScheduler.start();
      logger.debug('파일 정리 스케줄러가 시작되었습니다');
    } catch (error) {
      logger.error('파일 정리 스케줄러 시작 실패', {
        error: error.message,
        stack: error.stack
      });
    }
  }, 5000); // 서버가 완전히 시작된 후 5초 뒤에 시작
} catch (error) {
  logger.warn('파일 정리 스케줄러를 로드할 수 없습니다', {
    error: error.message
  });
}

// 프로덕션 설정 검증
if (envConfig.isProduction) {
  envConfig.validateProductionConfig();
}

// 서버 시작 전 데이터베이스 연결 테스트
const testDatabaseConnection = async () => {
  try {
    const sequelize = require('./models/index');
    await sequelize.authenticate();
    logger.info('데이터베이스 연결 성공', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || '(설정 안됨)',
      environment: nodeEnv
    });
    return true;
  } catch (error) {
    logger.error('데이터베이스 연결 실패', {
      error: error.message,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || '(설정 안됨)',
      user: process.env.DB_USER || '(설정 안됨)',
      password: process.env.DB_PASSWORD ? '***' : '(설정 안됨)',
      environment: nodeEnv
    });
    return false;
  }
};

// 서버 시작
app.listen(PORT, async () => {
  logger.info('서버 시작', { 
    port: PORT, 
    environment: nodeEnv,
    logLevel: appConfig.logLevel,
    compression: appConfig.compressionEnabled,
    swagger: appConfig.enableSwagger
  });
  
  // 데이터베이스 연결 테스트
  await testDatabaseConnection();
}).on('error', (error) => {
  logger.error('서버 시작 실패', {
    error: error.message,
    stack: error.stack,
    code: error.code
  });
  console.error('서버 시작 실패:', error);
  process.exit(1);
});

module.exports = app;
