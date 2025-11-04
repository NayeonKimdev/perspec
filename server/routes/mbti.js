const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createEstimation,
  getHistory,
  getEstimationById
} = require('../controllers/mbtiController');

// MBTI 추정 생성
router.post('/estimate', authMiddleware, createEstimation);

// MBTI 추정 히스토리 조회
router.get('/history', authMiddleware, getHistory);

// 특정 MBTI 추정 결과 상세 조회
router.get('/:id', authMiddleware, getEstimationById);

module.exports = router;


