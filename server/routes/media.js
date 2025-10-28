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

// 특정 미디어 삭제
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;

