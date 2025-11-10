/**
 * 환경변수 검증 모듈
 * 서버 시작 시 필수 환경변수가 설정되어 있는지 확인
 */

const requiredEnvVars = {
  development: [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ],
  production: [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'NODE_ENV',
  ],
  test: [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ],
};

/**
 * 환경변수 검증 함수
 * @param {string} env - 환경 (development, production, test)
 * @returns {Object} - { isValid: boolean, missing: string[], warnings: string[] }
 */
const validateEnvVars = (env = 'development') => {
  const missing = [];
  const warnings = [];
  const required = requiredEnvVars[env] || requiredEnvVars.development;

  // 필수 환경변수 확인
  required.forEach((varName) => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  });

  // JWT_SECRET 강도 확인
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      warnings.push(
        'JWT_SECRET이 너무 짧습니다. 최소 32자 이상을 권장합니다.'
      );
    }
  }

  // 프로덕션 환경에서 추가 확인
  if (env === 'production') {
    // 프로덕션에서 기본값 사용 방지
    if (process.env.PORT === '5000') {
      warnings.push('프로덕션 환경에서 기본 포트(5000)를 사용하고 있습니다.');
    }

    // CORS 설정 확인
    if (!process.env.CORS_ORIGIN) {
      warnings.push(
        'CORS_ORIGIN이 설정되지 않았습니다. 프로덕션에서는 특정 origin을 지정하는 것을 권장합니다.'
      );
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
};

/**
 * 환경변수 검증 및 에러 출력
 * @param {string} env - 환경
 * @throws {Error} - 필수 환경변수가 없을 경우
 */
const validateAndThrow = (env = 'development') => {
  const result = validateEnvVars(env);

  if (!result.isValid) {
    console.error('\n❌ 필수 환경변수가 설정되지 않았습니다:');
    result.missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\n💡 해결 방법: server/.env 파일을 확인하고 필요한 환경변수를 설정하세요.'
    );
    console.error('   참고: server/env.example 파일을 참고하세요.\n');
    throw new Error(`필수 환경변수가 누락되었습니다: ${result.missing.join(', ')}`);
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  환경변수 경고:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  return true;
};

module.exports = {
  validateEnvVars,
  validateAndThrow,
};


