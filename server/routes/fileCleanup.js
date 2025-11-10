/**
 * @fileoverview 파일 정리 라우트
 * 파일 정리 및 스토리지 관리 API 엔드포인트
 * @module routes/fileCleanup
 */

const express = require('express');
const router = express.Router();
const fileCleanupController = require('../controllers/fileCleanupController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');

// 모든 라우트는 인증 필요
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: 파일 정리
 *   description: 파일 정리 및 스토리지 관리 API
 */

/**
 * @swagger
 * /api/v1/cleanup/stats:
 *   get:
 *     summary: 스토리지 통계 조회
 *     tags: [파일 정리]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 스토리지 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 directories:
 *                   type: object
 *                 total:
 *                   type: object
 *                 database:
 *                   type: object
 */
router.get('/stats', apiLimiter, fileCleanupController.getStorageStats);

/**
 * @swagger
 * /api/v1/cleanup/run:
 *   post:
 *     summary: 수동 파일 정리 실행
 *     tags: [파일 정리]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cleanOldMedia:
 *                 type: boolean
 *               cleanOldDocuments:
 *                 type: boolean
 *               cleanTempFiles:
 *                 type: boolean
 *               cleanFailedAnalysis:
 *                 type: boolean
 *               cleanOrphanFiles:
 *                 type: boolean
 *               mediaRetentionDays:
 *                 type: integer
 *               documentRetentionDays:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 파일 정리 완료
 *       409:
 *         description: 파일 정리가 이미 실행 중입니다
 */
router.post('/run', apiLimiter, fileCleanupController.runManualCleanup);

module.exports = router;

