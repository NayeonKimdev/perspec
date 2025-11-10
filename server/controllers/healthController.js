/**
 * 헬스 체크 및 라이브니스 프로브 엔드포인트
 * Kubernetes, Docker Swarm 등 컨테이너 오케스트레이션에서 사용
 */

const sequelize = require('../models/index');

/**
 * @swagger
 * tags:
 *   name: 헬스
 *   description: 서버 상태 확인 API
 */

/**
 * 기본 헬스 체크 - 서버가 실행 중인지 확인
 * @swagger
 * /health:
 *   get:
 *     summary: 기본 헬스 체크
 *     tags: [헬스]
 *     responses:
 *       200:
 *         description: 서버가 정상적으로 실행 중입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: 서버 가동 시간 (초)
 *                 environment:
 *                   type: string
 *                   example: development
 */
const healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
};

/**
 * 라이브니스 프로브 - 서버가 정상적으로 요청을 처리할 수 있는지 확인
 * 데이터베이스 연결 상태도 확인
 * @swagger
 * /health/live:
 *   get:
 *     summary: 라이브니스 프로브
 *     tags: [헬스]
 *     description: 서버와 데이터베이스 연결 상태를 확인합니다
 *     responses:
 *       200:
 *         description: 서버가 정상적으로 작동 중입니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *       503:
 *         description: 서버 또는 데이터베이스 연결에 문제가 있습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                   example: disconnected
 *                 error:
 *                   type: string
 */
const livenessProbe = async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();

    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
};

/**
 * 레디니스 프로브 - 서버가 트래픽을 받을 준비가 되었는지 확인
 * 필요한 모든 서비스가 준비되었는지 확인
 * @swagger
 * /health/ready:
 *   get:
 *     summary: 레디니스 프로브
 *     tags: [헬스]
 *     description: 서버가 모든 서비스를 준비하고 트래픽을 받을 준비가 되었는지 확인합니다
 *     responses:
 *       200:
 *         description: 서버가 준비되었습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: boolean
 *                     environment:
 *                       type: boolean
 *       503:
 *         description: 서버가 준비되지 않았습니다
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 checks:
 *                   type: object
 *                 missingEnvVars:
 *                   type: array
 *                   items:
 *                     type: string
 */
const readinessProbe = async (req, res) => {
  try {
    const checks = {
      database: false,
      environment: true,
    };

    // 데이터베이스 연결 확인
    try {
      await sequelize.authenticate();
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    // 필수 환경변수 확인
    const requiredEnvVars = ['JWT_SECRET', 'OPENAI_API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName] || process.env[varName].trim() === ''
    );

    if (missingEnvVars.length > 0) {
      checks.environment = false;
    }

    const isReady = checks.database && checks.environment;

    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks,
        missingEnvVars,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

module.exports = {
  healthCheck,
  livenessProbe,
  readinessProbe,
};


