const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const authenticateToken = require('../middleware/auth');

// 모든 미디어 라우트는 인증 필요
router.use(authenticateToken);

// 단일 이미지 업로드
router.post('/upload', uploadSingle, mediaController.uploadImage);

// 다중 이미지 업로드
router.post('/upload-multiple', uploadMultiple, mediaController.uploadMultipleImages);

// 사용자의 모든 미디어 조회
router.get('/list', mediaController.getMediaList);

// 이미지 검색
router.get('/search', mediaController.searchMedia);

// 특정 미디어 삭제
router.delete('/:id', mediaController.deleteMedia);

// 특정 미디어의 분석 상태 조회
router.get('/:id/analysis', mediaController.getAnalysisStatus);

// 모든 이미지 분석 결과 종합
router.get('/analysis-summary', mediaController.getAnalysisSummary);

// 특정 이미지 재분석 요청
router.post('/:id/retry-analysis', mediaController.retryAnalysis);

// 실패한 모든 이미지 재분석 요청
router.post('/retry-all-failed-analysis', mediaController.retryAllFailedAnalysis);

module.exports = router;

