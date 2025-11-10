/**
 * 환경변수 검증 유틸리티 테스트
 */
const { validateEnvVars } = require('../../config/envValidator');

describe('envValidator 테스트', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 각 테스트 전에 환경변수 초기화
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // 테스트 후 원래 환경변수 복원
    process.env = originalEnv;
  });

  describe('validateEnvVars', () => {
    test('모든 필수 환경변수가 있으면 유효', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'test';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      process.env.JWT_SECRET = 'test-secret-key-12345678901234567890';
      process.env.OPENAI_API_KEY = 'test-key';

      const result = validateEnvVars('development');
      expect(result.isValid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('필수 환경변수가 없으면 무효', () => {
      delete process.env.DB_HOST;
      delete process.env.JWT_SECRET;
      delete process.env.OPENAI_API_KEY;

      const result = validateEnvVars('development');
      expect(result.isValid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    test('빈 문자열 환경변수는 누락으로 처리', () => {
      process.env.JWT_SECRET = '';
      process.env.OPENAI_API_KEY = '   ';

      const result = validateEnvVars('development');
      expect(result.missing).toContain('JWT_SECRET');
      expect(result.missing).toContain('OPENAI_API_KEY');
    });

    test('JWT_SECRET이 너무 짧으면 경고', () => {
      process.env.JWT_SECRET = 'short';

      const result = validateEnvVars('development');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('JWT_SECRET'))).toBe(true);
    });

    test('프로덕션 환경에서 기본 포트 사용 시 경고', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '5000';

      const result = validateEnvVars('production');
      expect(result.warnings.some(w => w.includes('포트'))).toBe(true);
    });

    test('프로덕션 환경에서 CORS_ORIGIN 미설정 시 경고', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CORS_ORIGIN;

      const result = validateEnvVars('production');
      expect(result.warnings.some(w => w.includes('CORS_ORIGIN'))).toBe(true);
    });
  });
});


