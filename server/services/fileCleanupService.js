/**
 * @fileoverview 파일 정리 서비스
 * 오래된 파일 자동 정리 및 스토리지 관리
 * @module services/fileCleanupService
 */

const fs = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');
const Media = require('../models/Media');
const TextDocument = require('../models/TextDocument');
const { IMAGES_DIR, DOCUMENTS_DIR, TEMP_DIR } = require('../config/storage');
const logger = require('../utils/logger');

/**
 * 파일 정리 설정
 */
const CLEANUP_CONFIG = {
  // 미디어 파일 보관 기간 (일)
  mediaRetentionDays: parseInt(process.env.MEDIA_RETENTION_DAYS || '90'),
  
  // 문서 파일 보관 기간 (일)
  documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS || '90'),
  
  // 임시 파일 보관 기간 (일)
  tempRetentionDays: parseInt(process.env.TEMP_RETENTION_DAYS || '1'),
  
  // 실패한 분석 파일 보관 기간 (일)
  failedAnalysisRetentionDays: parseInt(process.env.FAILED_ANALYSIS_RETENTION_DAYS || '30'),
  
  // 파일 정리 활성화 여부
  enabled: process.env.FILE_CLEANUP_ENABLED !== 'false'
};

/**
 * 디렉토리 크기 계산
 * @param {string} dirPath - 디렉토리 경로
 * @returns {Promise<number>} 디렉토리 크기 (바이트)
 */
const getDirectorySize = async (dirPath) => {
  try {
    let totalSize = 0;
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('디렉토리 크기 계산 실패', { dirPath, error: error.message });
    return 0;
  }
};

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 변환된 크기 문자열
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 스토리지 통계 조회
 * @returns {Promise<Object>} 스토리지 통계 정보
 */
const getStorageStats = async () => {
  try {
    const [imagesSize, documentsSize, tempSize] = await Promise.all([
      getDirectorySize(IMAGES_DIR),
      getDirectorySize(DOCUMENTS_DIR),
      getDirectorySize(TEMP_DIR)
    ]);

    const totalSize = imagesSize + documentsSize + tempSize;

    // 데이터베이스 통계
    const mediaCount = await Media.count();
    const documentCount = await TextDocument.count();
    
    const mediaSize = await Media.sum('file_size') || 0;
    const documentSize = await TextDocument.sum('file_size') || 0;

    return {
      directories: {
        images: {
          path: IMAGES_DIR,
          size: imagesSize,
          formattedSize: formatBytes(imagesSize)
        },
        documents: {
          path: DOCUMENTS_DIR,
          size: documentsSize,
          formattedSize: formatBytes(documentsSize)
        },
        temp: {
          path: TEMP_DIR,
          size: tempSize,
          formattedSize: formatBytes(tempSize)
        }
      },
      total: {
        size: totalSize,
        formattedSize: formatBytes(totalSize)
      },
      database: {
        media: {
          count: mediaCount,
          totalSize: mediaSize,
          formattedSize: formatBytes(mediaSize)
        },
        documents: {
          count: documentCount,
          totalSize: documentSize,
          formattedSize: formatBytes(documentSize)
        }
      }
    };
  } catch (error) {
    logger.error('스토리지 통계 조회 실패', { error: error.message });
    throw error;
  }
};

/**
 * 오래된 미디어 파일 정리
 * @param {number} days - 보관 기간 (일)
 * @returns {Promise<Object>} 정리 결과
 */
const cleanupOldMedia = async (days = CLEANUP_CONFIG.mediaRetentionDays) => {
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 오래된 미디어 조회
    const oldMedia = await Media.findAll({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    for (const media of oldMedia) {
      try {
        // 파일 삭제
        if (media.file_path) {
          try {
            await fs.access(media.file_path);
            const stats = await fs.stat(media.file_path);
            await fs.unlink(media.file_path);
            results.freedSpace += stats.size;
            results.deleted++;
            
            logger.debug('오래된 미디어 파일 삭제', {
              mediaId: media.id,
              fileName: media.file_name,
              age: Math.floor((new Date() - media.created_at) / (1000 * 60 * 60 * 24))
            });
          } catch (fileError) {
            // 파일이 이미 없는 경우 무시
            if (fileError.code !== 'ENOENT') {
              results.errors.push({
                mediaId: media.id,
                error: fileError.message
              });
            }
          }
        }

        // 데이터베이스에서 삭제
        await media.destroy();
      } catch (error) {
        results.failed++;
        results.errors.push({
          mediaId: media.id,
          error: error.message
        });
        logger.error('미디어 파일 정리 실패', {
          mediaId: media.id,
          error: error.message
        });
      }
    }

    if (results.deleted > 0 || results.failed > 0) {
      logger.info('오래된 미디어 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    } else {
      logger.debug('오래된 미디어 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('오래된 미디어 파일 정리 오류', { error: error.message });
    throw error;
  }
};

/**
 * 실패한 분석 미디어 파일 정리
 * @param {number} days - 보관 기간 (일)
 * @returns {Promise<Object>} 정리 결과
 */
const cleanupFailedAnalysisMedia = async (days = CLEANUP_CONFIG.failedAnalysisRetentionDays) => {
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 실패한 분석 미디어 조회
    const failedMedia = await Media.findAll({
      where: {
        analysis_status: 'failed',
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    for (const media of failedMedia) {
      try {
        // 파일 삭제
        if (media.file_path) {
          try {
            await fs.access(media.file_path);
            const stats = await fs.stat(media.file_path);
            await fs.unlink(media.file_path);
            results.freedSpace += stats.size;
            results.deleted++;
          } catch (fileError) {
            if (fileError.code !== 'ENOENT') {
              results.errors.push({
                mediaId: media.id,
                error: fileError.message
              });
            }
          }
        }

        // 데이터베이스에서 삭제
        await media.destroy();
      } catch (error) {
        results.failed++;
        results.errors.push({
          mediaId: media.id,
          error: error.message
        });
      }
    }

    if (results.deleted > 0 || results.failed > 0) {
      logger.info('실패한 분석 미디어 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    } else {
      logger.debug('실패한 분석 미디어 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('실패한 분석 미디어 파일 정리 오류', { error: error.message });
    throw error;
  }
};

/**
 * 오래된 문서 파일 정리
 * @param {number} days - 보관 기간 (일)
 * @returns {Promise<Object>} 정리 결과
 */
const cleanupOldDocuments = async (days = CLEANUP_CONFIG.documentRetentionDays) => {
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 오래된 문서 조회
    const oldDocuments = await TextDocument.findAll({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    for (const document of oldDocuments) {
      try {
        // 파일 삭제
        if (document.file_path) {
          try {
            await fs.access(document.file_path);
            const stats = await fs.stat(document.file_path);
            await fs.unlink(document.file_path);
            results.freedSpace += stats.size;
            results.deleted++;
          } catch (fileError) {
            if (fileError.code !== 'ENOENT') {
              results.errors.push({
                documentId: document.id,
                error: fileError.message
              });
            }
          }
        }

        // 데이터베이스에서 삭제
        await document.destroy();
      } catch (error) {
        results.failed++;
        results.errors.push({
          documentId: document.id,
          error: error.message
        });
      }
    }

    if (results.deleted > 0 || results.failed > 0) {
      logger.info('오래된 문서 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    } else {
      logger.debug('오래된 문서 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('오래된 문서 파일 정리 오류', { error: error.message });
    throw error;
  }
};

/**
 * 임시 파일 정리
 * @param {number} days - 보관 기간 (일)
 * @returns {Promise<Object>} 정리 결과
 */
const cleanupTempFiles = async (days = CLEANUP_CONFIG.tempRetentionDays) => {
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // 임시 디렉토리의 모든 파일 조회
    const files = await fs.readdir(TEMP_DIR, { withFileTypes: true });

    for (const file of files) {
      try {
        const filePath = path.join(TEMP_DIR, file.name);
        const stats = await fs.stat(filePath);

        // 파일이 오래된 경우 삭제
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          results.freedSpace += stats.size;
          results.deleted++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          fileName: file.name,
          error: error.message
        });
      }
    }

    if (results.deleted > 0 || results.failed > 0) {
      logger.info('임시 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    } else {
      logger.debug('임시 파일 정리 완료', {
        days,
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('임시 파일 정리 오류', { error: error.message });
    throw error;
  }
};

/**
 * 고아 파일 정리 (데이터베이스에 없지만 파일시스템에 있는 파일)
 * @returns {Promise<Object>} 정리 결과
 */
const cleanupOrphanFiles = async () => {
  const results = {
    deleted: 0,
    failed: 0,
    freedSpace: 0,
    errors: []
  };

  try {
    // 데이터베이스에 있는 모든 파일 경로 조회
    const [mediaFiles, documentFiles] = await Promise.all([
      Media.findAll({ attributes: ['file_path'] }),
      TextDocument.findAll({ attributes: ['file_path'] })
    ]);

    const dbFilePaths = new Set([
      ...mediaFiles.map(m => m.file_path),
      ...documentFiles.map(d => d.file_path)
    ]);

    // 이미지 디렉토리에서 고아 파일 찾기
    const imageFiles = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
    for (const file of imageFiles) {
      if (file.isFile()) {
        const filePath = path.join(IMAGES_DIR, file.name);
        if (!dbFilePaths.has(filePath)) {
          try {
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            results.freedSpace += stats.size;
            results.deleted++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              fileName: file.name,
              error: error.message
            });
          }
        }
      }
    }

    // 문서 디렉토리에서 고아 파일 찾기 (재귀적으로)
    const findOrphanDocuments = async (dir) => {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          await findOrphanDocuments(filePath);
        } else if (!dbFilePaths.has(filePath)) {
          try {
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            results.freedSpace += stats.size;
            results.deleted++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              fileName: file.name,
              error: error.message
            });
          }
        }
      }
    };

    await findOrphanDocuments(DOCUMENTS_DIR);

    if (results.deleted > 0 || results.failed > 0) {
      logger.info('고아 파일 정리 완료', {
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    } else {
      logger.debug('고아 파일 정리 완료', {
        deleted: results.deleted,
        failed: results.failed,
        freedSpace: formatBytes(results.freedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('고아 파일 정리 오류', { error: error.message });
    throw error;
  }
};

/**
 * 전체 파일 정리 실행
 * @param {Object} options - 정리 옵션
 * @returns {Promise<Object>} 정리 결과
 */
const runCleanup = async (options = {}) => {
  if (!CLEANUP_CONFIG.enabled) {
    logger.debug('파일 정리가 비활성화되어 있습니다.');
    return { skipped: true };
  }

  const results = {
    media: null,
    documents: null,
    temp: null,
    failedAnalysis: null,
    orphan: null,
    totalFreedSpace: 0,
    startTime: new Date(),
    endTime: null,
    duration: null
  };

  try {
    logger.debug('파일 정리 시작');

    // 각 정리 작업 실행
    if (options.cleanOldMedia !== false) {
      results.media = await cleanupOldMedia(options.mediaRetentionDays);
      results.totalFreedSpace += results.media.freedSpace;
    }

    if (options.cleanOldDocuments !== false) {
      results.documents = await cleanupOldDocuments(options.documentRetentionDays);
      results.totalFreedSpace += results.documents.freedSpace;
    }

    if (options.cleanTempFiles !== false) {
      results.temp = await cleanupTempFiles(options.tempRetentionDays);
      results.totalFreedSpace += results.temp.freedSpace;
    }

    if (options.cleanFailedAnalysis !== false) {
      results.failedAnalysis = await cleanupFailedAnalysisMedia(options.failedAnalysisRetentionDays);
      results.totalFreedSpace += results.failedAnalysis.freedSpace;
    }

    if (options.cleanOrphanFiles !== false) {
      results.orphan = await cleanupOrphanFiles();
      results.totalFreedSpace += results.orphan.freedSpace;
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    if (results.totalFreedSpace > 0) {
      // 파일이 실제로 삭제된 경우에만 info 로그
      logger.info('파일 정리 완료', {
        duration: `${results.duration}ms`,
        totalFreedSpace: formatBytes(results.totalFreedSpace)
      });
    } else {
      logger.debug('파일 정리 완료', {
        duration: `${results.duration}ms`,
        totalFreedSpace: formatBytes(results.totalFreedSpace)
      });
    }

    return results;
  } catch (error) {
    logger.error('파일 정리 중 오류 발생', { error: error.message });
    throw error;
  }
};

module.exports = {
  runCleanup,
  cleanupOldMedia,
  cleanupOldDocuments,
  cleanupTempFiles,
  cleanupFailedAnalysisMedia,
  cleanupOrphanFiles,
  getStorageStats,
  formatBytes,
  CLEANUP_CONFIG
};

