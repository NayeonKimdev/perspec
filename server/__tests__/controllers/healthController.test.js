/**
 * 헬스 체크 컨트롤러 테스트
 */
const { healthCheck, livenessProbe, readinessProbe } = require('../../controllers/healthController');
const sequelize = require('../../models/index');

// 데이터베이스 모델 모킹
jest.mock('../../models/index', () => ({
  authenticate: jest.fn()
}));

describe('healthController 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    test('정상적인 헬스 체크 응답', () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      healthCheck(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          environment: expect.any(String)
        })
      );
    });
  });

  describe('livenessProbe', () => {
    test('데이터베이스 연결 성공 시 alive 반환', async () => {
      sequelize.authenticate.mockResolvedValueOnce();

      const req = {};
      const res = {
        json: jest.fn()
      };

      await livenessProbe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
          database: 'connected',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        })
      );
    });

    test('데이터베이스 연결 실패 시 unhealthy 반환', async () => {
      sequelize.authenticate.mockRejectedValueOnce(new Error('Connection failed'));

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await livenessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          database: 'disconnected',
          error: expect.any(String)
        })
      );
    });
  });

  describe('readinessProbe', () => {
    test('모든 서비스 준비 완료 시 ready 반환', async () => {
      sequelize.authenticate.mockResolvedValueOnce();
      process.env.JWT_SECRET = 'test-secret';
      process.env.OPENAI_API_KEY = 'test-key';

      const req = {};
      const res = {
        json: jest.fn()
      };

      await readinessProbe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready',
          checks: {
            database: true,
            environment: true
          }
        })
      );
    });

    test('데이터베이스 연결 실패 시 not ready 반환', async () => {
      sequelize.authenticate.mockRejectedValueOnce(new Error('Connection failed'));
      process.env.JWT_SECRET = 'test-secret';
      process.env.OPENAI_API_KEY = 'test-key';

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not ready',
          checks: {
            database: false,
            environment: true
          }
        })
      );
    });

    test('필수 환경변수 누락 시 not ready 반환', async () => {
      sequelize.authenticate.mockResolvedValueOnce();
      delete process.env.JWT_SECRET;
      delete process.env.OPENAI_API_KEY;

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await readinessProbe(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not ready',
          checks: {
            database: true,
            environment: false
          },
          missingEnvVars: expect.any(Array)
        })
      );
    });
  });
});


