const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const authenticateToken = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/security');

// 모든 미디어 라우트는 인증 필요
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: 미디어
 *   description: 이미지 업로드 및 관리 API
 */

/**
 * @swagger
 * /api/v1/media/upload:
 *   post:
 *     summary: 단일 이미지 업로드
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 이미지 파일 (최대 10MB)
 *     responses:
 *       201:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *                 message:
 *                   type: string
 *                   example: 이미지가 업로드되었습니다. 분석은 백그라운드에서 진행됩니다.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: 파일 크기 초과
 */
// 단일 이미지 업로드 (Rate Limiting 적용)
router.post('/upload', uploadLimiter, uploadSingle, mediaController.uploadImage);

/**
 * @swagger
 * /api/v1/media/upload-multiple:
 *   post:
 *     summary: 다중 이미지 업로드 (최대 10개)
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 이미지 파일들 (최대 10개, 각 최대 10MB)
 *     responses:
 *       201:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 message:
 *                   type: string
 */
// 다중 이미지 업로드 (Rate Limiting 적용)
router.post('/upload-multiple', uploadLimiter, uploadMultiple, mediaController.uploadMultipleImages);

/**
 * @swagger
 * /api/v1/media/list:
 *   get:
 *     summary: 미디어 목록 조회
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at_desc, created_at_asc]
 *           default: created_at_desc
 *         description: 정렬 기준
 *       - in: query
 *         name: analysis_status
 *         schema:
 *           type: string
 *           enum: [completed, pending, analyzing, failed, all]
 *         description: 분석 상태 필터
 *       - in: query
 *         name: date_filter
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: all
 *         description: 날짜 필터
 *     responses:
 *       200:
 *         description: 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// 사용자의 모든 미디어 조회
router.get('/list', mediaController.getMediaList);

/**
 * @swagger
 * /api/v1/media/search:
 *   get:
 *     summary: 이미지 검색
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 검색 성공
 *       400:
 *         description: 검색어가 없습니다
 */
// 이미지 검색
router.get('/search', mediaController.searchMedia);

/**
 * @swagger
 * /api/v1/media/{id}:
 *   delete:
 *     summary: 특정 미디어 삭제
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 미디어 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// 특정 미디어 삭제
router.delete('/:id', mediaController.deleteMedia);

/**
 * @swagger
 * /api/v1/media/{id}/analysis:
 *   get:
 *     summary: 특정 미디어의 분석 상태 조회
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 분석 상태 조회 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// 특정 미디어의 분석 상태 조회
router.get('/:id/analysis', mediaController.getAnalysisStatus);

/**
 * @swagger
 * /api/v1/media/analysis-summary:
 *   get:
 *     summary: 모든 이미지 분석 결과 종합
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 분석 요약 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_images:
 *                       type: integer
 *                     analyzed_images:
 *                       type: integer
 *                     top_interests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           interest:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     top_keywords:
 *                       type: array
 *                     common_moods:
 *                       type: array
 *                     overall_insight:
 *                       type: string
 */
// 모든 이미지 분석 결과 종합
router.get('/analysis-summary', mediaController.getAnalysisSummary);

/**
 * @swagger
 * /api/v1/media/{id}/retry-analysis:
 *   post:
 *     summary: 특정 이미지 재분석 요청
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 재분석 요청 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// 특정 이미지 재분석 요청
router.post('/:id/retry-analysis', mediaController.retryAnalysis);

/**
 * @swagger
 * /api/v1/media/retry-all-failed-analysis:
 *   post:
 *     summary: 실패한 모든 이미지 재분석 요청
 *     tags: [미디어]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 재분석 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 */
// 실패한 모든 이미지 재분석 요청
router.post('/retry-all-failed-analysis', mediaController.retryAllFailedAnalysis);

module.exports = router;

