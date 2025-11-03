const express = require('express');
const router = express.Router();
const { createAnalysis, createEnhancedAnalysis, getHistory, getAnalysisById } = require('../controllers/analysisController');
const auth = require('../middleware/auth');

// 모든 분석 라우트는 인증 필요
router.use(auth);

// 건강 체크 엔드포인트 (디버깅용)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    routes: {
      create: 'POST /api/analysis/create',
      createEnhanced: 'POST /api/analysis/create-enhanced',
      history: 'GET /api/analysis/history',
      getById: 'GET /api/analysis/:id'
    }
  });
});

// 분석 생성
router.post('/create', createAnalysis);

// 향상된 분석 생성 (프로필 + 이미지)
router.post('/create-enhanced', createEnhancedAnalysis);

// 분석 히스토리 조회
router.get('/history', getHistory);

// 특정 분석 결과 조회
router.get('/:id', getAnalysisById);

module.exports = router;

