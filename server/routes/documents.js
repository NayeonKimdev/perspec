const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadText');
const { uploadLimiter } = require('../middleware/security');
const {
  uploadDocument,
  uploadMultipleDocuments,
  getDocumentList,
  getDocumentById,
  deleteDocument,
  getDocumentAnalysis,
  searchDocuments,
  downloadDocument
} = require('../controllers/documentController');

// 모든 라우트는 인증 필요
router.use(authenticateToken);

// 텍스트 문서 업로드 (단일) - Rate Limiting 적용
router.post('/upload', uploadLimiter, uploadSingle, uploadDocument);

// 텍스트 문서 업로드 (다중) - Rate Limiting 적용
router.post('/upload-multiple', uploadLimiter, uploadMultiple, uploadMultipleDocuments);

// 텍스트 문서 목록 조회
router.get('/list', getDocumentList);

// 텍스트 문서 검색
router.get('/search', searchDocuments);

// 특정 텍스트 문서 조회
router.get('/:id', getDocumentById);

// 텍스트 문서 다운로드
router.get('/:id/download', downloadDocument);

// 텍스트 문서 분석 상태 조회
router.get('/:id/analysis', getDocumentAnalysis);

// 텍스트 문서 삭제
router.delete('/:id', deleteDocument);

module.exports = router;

