/**
 * @fileoverview API 버전 관리 라우터
 * 모든 API 엔드포인트를 버전별로 관리합니다.
 * @module routes/api
 */

const express = require('express');
const router = express.Router();

// v1 라우터 로드
const v1Router = require('./v1');

// 버전별 라우터 등록
router.use('/v1', v1Router);

/**
 * 기본 API 정보
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Perspec API',
    version: '1.0.0',
    availableVersions: ['v1'],
    currentVersion: 'v1',
    documentation: '/api-docs'
  });
});

module.exports = router;

