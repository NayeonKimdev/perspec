const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createReport,
  getReportList,
  getReportById
} = require('../controllers/reportController');

// 종합 레포트 생성
router.post('/generate', authMiddleware, createReport);

// 레포트 목록 조회
router.get('/list', authMiddleware, getReportList);

// 특정 레포트 조회
router.get('/:id', authMiddleware, getReportById);

module.exports = router;


