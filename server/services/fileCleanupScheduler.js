/**
 * @fileoverview 파일 정리 스케줄러
 * 주기적으로 파일 정리 작업을 실행하는 스케줄러
 * @module services/fileCleanupScheduler
 */

const fileCleanupService = require('./fileCleanupService');
const logger = require('../utils/logger');

/**
 * 파일 정리 스케줄러
 */
class FileCleanupScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.cleanupInterval = parseInt(process.env.FILE_CLEANUP_INTERVAL_HOURS || '24') * 60 * 60 * 1000; // 기본 24시간
  }

  /**
   * 스케줄러 시작
   */
  start() {
    if (this.intervalId) {
      logger.warn('파일 정리 스케줄러가 이미 실행 중입니다.');
      return;
    }

    if (!fileCleanupService.CLEANUP_CONFIG.enabled) {
      logger.debug('파일 정리가 비활성화되어 있어 스케줄러를 시작하지 않습니다.');
      return;
    }

    logger.debug('파일 정리 스케줄러 시작', {
      intervalHours: this.cleanupInterval / (60 * 60 * 1000)
    });

    // 즉시 한 번 실행
    this.runCleanup();

    // 주기적으로 실행
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.cleanupInterval);
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('파일 정리 스케줄러 중지');
    }
  }

  /**
   * 파일 정리 실행
   */
  async runCleanup() {
    if (this.isRunning) {
      logger.warn('파일 정리가 이미 실행 중입니다. 스킵합니다.');
      return;
    }

    this.isRunning = true;

    try {
      logger.debug('스케줄된 파일 정리 시작');
      const results = await fileCleanupService.runCleanup();
      
      if (!results.skipped && results.totalFreedSpace > 0) {
        // 파일이 실제로 삭제된 경우에만 info 로그
        logger.info('스케줄된 파일 정리 완료', {
          totalFreedSpace: fileCleanupService.formatBytes(results.totalFreedSpace),
          duration: `${results.duration}ms`
        });
      } else {
        logger.debug('스케줄된 파일 정리 완료', {
          totalFreedSpace: fileCleanupService.formatBytes(results.totalFreedSpace || 0),
          duration: `${results.duration}ms`
        });
      }
    } catch (error) {
      logger.error('스케줄된 파일 정리 중 오류 발생', {
        error: error.message,
        stack: error.stack
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 수동으로 파일 정리 실행
   */
  async runManualCleanup(options = {}) {
    if (this.isRunning) {
      throw new Error('파일 정리가 이미 실행 중입니다.');
    }

    this.isRunning = true;

    try {
      const results = await fileCleanupService.runCleanup(options);
      return results;
    } finally {
      this.isRunning = false;
    }
  }
}

// 싱글톤 인스턴스
const scheduler = new FileCleanupScheduler();

module.exports = scheduler;

