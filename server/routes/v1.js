/**
 * @fileoverview API v1 라우터
 * 모든 v1 API 엔드포인트를 관리합니다.
 * @module routes/v1
 */

const express = require('express');
const router = express.Router();

// 라우트 모듈 로드 (지연 로딩으로 데이터베이스 연결 오류 처리)
let authRoutes;
let profileRoutes;
let analysisRoutes;
let mediaRoutes;
let documentRoutes;
let mbtiRoutes;
let emotionRoutes;
let reportRoutes;

// 인증 라우트
try {
  authRoutes = require('../routes/auth');
  console.log('인증 라우트 로드 성공:', !!authRoutes);
} catch (error) {
  console.error('인증 라우트 로드 실패:', error.message, error.stack);
  authRoutes = null;
}

// 프로필 라우트
try {
  profileRoutes = require('../routes/profile');
} catch (error) {
  profileRoutes = null;
}

// 분석 라우트
try {
  analysisRoutes = require('../routes/analysis');
} catch (error) {
  analysisRoutes = null;
}

// 미디어 라우트
try {
  mediaRoutes = require('../routes/media');
} catch (error) {
  mediaRoutes = null;
}

// 문서 라우트
try {
  documentRoutes = require('../routes/documents');
} catch (error) {
  documentRoutes = null;
}

// MBTI 라우트
try {
  mbtiRoutes = require('../routes/mbti');
} catch (error) {
  mbtiRoutes = null;
}

// 감정 라우트
try {
  emotionRoutes = require('../routes/emotion');
} catch (error) {
  emotionRoutes = null;
}

// 리포트 라우트
try {
  reportRoutes = require('../routes/reports');
} catch (error) {
  reportRoutes = null;
}

// 파일 정리 라우트
let fileCleanupRoutes;
try {
  fileCleanupRoutes = require('../routes/fileCleanup');
} catch (error) {
  fileCleanupRoutes = null;
}

// Rate Limiting 미들웨어
const {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  analysisLimiter,
} = require('../middleware/security');

// 인증 관련 라우트 (Rate Limiting 적용)
if (authRoutes) {
  router.use('/auth', authLimiter, authRoutes);
} else {
  router.use('/auth', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 프로필 라우트
if (profileRoutes) {
  router.use('/profile', apiLimiter, profileRoutes);
} else {
  router.use('/profile', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 분석 라우트
if (analysisRoutes) {
  router.use('/analysis', analysisLimiter, analysisRoutes);
} else {
  router.use('/analysis', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 미디어 라우트
if (mediaRoutes) {
  router.use('/media', apiLimiter, mediaRoutes);
} else {
  router.use('/media', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 문서 라우트
if (documentRoutes) {
  router.use('/documents', apiLimiter, documentRoutes);
} else {
  router.use('/documents', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// MBTI 라우트
if (mbtiRoutes) {
  router.use('/mbti', apiLimiter, mbtiRoutes);
} else {
  router.use('/mbti', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 감정 라우트
if (emotionRoutes) {
  router.use('/emotion', apiLimiter, emotionRoutes);
} else {
  router.use('/emotion', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 리포트 라우트
if (reportRoutes) {
  router.use('/reports', apiLimiter, reportRoutes);
} else {
  router.use('/reports', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 파일 정리 라우트
if (fileCleanupRoutes) {
  router.use('/cleanup', apiLimiter, fileCleanupRoutes);
} else {
  router.use('/cleanup', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

/**
 * v1 API 정보
 */
router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    message: 'Perspec API v1',
    endpoints: {
      auth: '/api/v1/auth',
      profile: '/api/v1/profile',
      media: '/api/v1/media',
      documents: '/api/v1/documents',
      analysis: '/api/v1/analysis',
      mbti: '/api/v1/mbti',
      emotion: '/api/v1/emotion',
      reports: '/api/v1/reports',
      cleanup: '/api/v1/cleanup'
    }
  });
});

module.exports = router;

