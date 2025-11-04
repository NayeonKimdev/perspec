const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createAnalysis,
  getLatestAnalysis
} = require('../controllers/emotionController');

// 감정 분석 생성
router.post('/analyze', authMiddleware, createAnalysis);

// 최신 감정 분석 결과 조회
router.get('/latest', authMiddleware, getLatestAnalysis);

module.exports = router;


