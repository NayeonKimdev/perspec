/**
 * 환경별 설정 관리
 * 프로덕션, 개발, 테스트 환경에 따른 설정 분리
 */

const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * 환경별 설정
 */
const config = {
  development: {
    // 로깅 설정
    logLevel: process.env.LOG_LEVEL || 'debug',
    consoleLogging: true,
    
    // 데이터베이스 설정
    dbLogging: false, // 개발 시 true로 변경 가능
    dbPool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // 보안 설정
    corsOrigin: process.env.CORS_ORIGIN || '*', // 개발 환경에서는 모든 origin 허용
    rateLimitEnabled: true,
    
    // API 설정
    showErrorDetails: true, // 에러 상세 정보 표시
    enableSwagger: true, // Swagger 문서 활성화
    
    // 성능 설정
    compressionEnabled: true,
    trustProxy: false,
  },
  
  production: {
    // 로깅 설정
    logLevel: process.env.LOG_LEVEL || 'info',
    consoleLogging: true, // 컨테이너 로깅을 위해 필요
    
    // 데이터베이스 설정
    dbLogging: false, // 프로덕션에서는 SQL 로그 비활성화
    dbPool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10), // 프로덕션에서는 더 많은 연결 허용
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
    
    // 보안 설정
    corsOrigin: process.env.CORS_ORIGIN || '', // 프로덕션에서는 필수 설정 필요
    rateLimitEnabled: true,
    
    // API 설정
    showErrorDetails: false, // 프로덕션에서는 에러 상세 정보 숨김
    enableSwagger: process.env.ENABLE_SWAGGER === 'true', // 기본적으로 비활성화
    
    // 성능 설정
    compressionEnabled: true,
    trustProxy: process.env.TRUST_PROXY === 'true', // 리버스 프록시 사용 시 true
    
    // 프로덕션 최적화
    maxRequestBodySize: '10mb',
    requestTimeout: 30000, // 30초
  },
  
  test: {
    // 로깅 설정
    logLevel: 'error', // 테스트에서는 에러만 로깅
    consoleLogging: false,
    
    // 데이터베이스 설정
    dbLogging: false,
    dbPool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // 보안 설정
    corsOrigin: '*',
    rateLimitEnabled: false, // 테스트에서는 비활성화
    
    // API 설정
    showErrorDetails: true,
    enableSwagger: false,
    
    // 성능 설정
    compressionEnabled: false,
    trustProxy: false,
  }
};

/**
 * 현재 환경의 설정 가져오기
 */
const getConfig = () => {
  const env = nodeEnv.toLowerCase();
  return config[env] || config.development;
};

/**
 * 설정 검증 (프로덕션 환경)
 */
const validateProductionConfig = () => {
  if (nodeEnv === 'production') {
    const currentConfig = getConfig();
    const warnings = [];
    
    if (!currentConfig.corsOrigin || currentConfig.corsOrigin === '*') {
      warnings.push('⚠️  CORS_ORIGIN이 설정되지 않았거나 모든 origin을 허용하고 있습니다. 보안상 위험할 수 있습니다.');
    }
    
    if (currentConfig.enableSwagger) {
      warnings.push('⚠️  Swagger 문서가 활성화되어 있습니다. 프로덕션에서는 비활성화하는 것을 권장합니다.');
    }
    
    if (currentConfig.showErrorDetails) {
      warnings.push('⚠️  에러 상세 정보가 표시되고 있습니다. 프로덕션에서는 비활성화해야 합니다.');
    }
    
    if (warnings.length > 0) {
      console.warn('프로덕션 설정 경고:');
      warnings.forEach(warning => console.warn(warning));
    }
    
    return warnings.length === 0;
  }
  
  return true;
};

module.exports = {
  config: getConfig(),
  getConfig,
  validateProductionConfig,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  nodeEnv,
};

