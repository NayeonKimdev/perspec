/**
 * @fileoverview 파일 정리 컨트롤러
 * 파일 정리 및 스토리지 관리 API 엔드포인트
 * @module controllers/fileCleanupController
 */

const fileCleanupService = require('../services/fileCleanupService');
const fileCleanupScheduler = require('../services/fileCleanupScheduler');
const logger = require('../utils/logger');
const { trackError, ErrorType } = require('../utils/errorTracker');

/**
 * 스토리지 통계 조회
 * @param {import('express').Request} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const getStorageStats = async (req, res) => {
  try {
    const stats = await fileCleanupService.getStorageStats();
    res.json(stats);
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'getStorageStats'
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '스토리지 통계 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 수동 파일 정리 실행
 * @param {import('express').Request} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const runManualCleanup = async (req, res) => {
  try {
    const options = {
      cleanOldMedia: req.body.cleanOldMedia !== false,
      cleanOldDocuments: req.body.cleanOldDocuments !== false,
      cleanTempFiles: req.body.cleanTempFiles !== false,
      cleanFailedAnalysis: req.body.cleanFailedAnalysis !== false,
      cleanOrphanFiles: req.body.cleanOrphanFiles !== false,
      mediaRetentionDays: parseInt(req.body.mediaRetentionDays) || undefined,
      documentRetentionDays: parseInt(req.body.documentRetentionDays) || undefined,
      tempRetentionDays: parseInt(req.body.tempRetentionDays) || undefined,
      failedAnalysisRetentionDays: parseInt(req.body.failedAnalysisRetentionDays) || undefined
    };

    logger.info('수동 파일 정리 요청', { options });

    const results = await fileCleanupScheduler.runManualCleanup(options);

    res.json({
      message: '파일 정리가 완료되었습니다.',
      results: {
        ...results,
        totalFreedSpace: fileCleanupService.formatBytes(results.totalFreedSpace)
      }
    });
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'runManualCleanup'
    }, req);
    
    if (error.message.includes('이미 실행 중')) {
      return res.status(409).json({
        message: error.message
      });
    }
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '파일 정리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getStorageStats,
  runManualCleanup
};

