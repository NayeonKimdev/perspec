/**
 * @fileoverview 사용자 활동 로깅 유틸리티
 * 사용자 행동을 추적하고 분석하기 위한 활동 로깅 시스템
 * @module utils/activityLogger
 */

const UserActivity = require('../models/UserActivity');
const logger = require('./logger');

/**
 * 활동 타입 정의
 * @enum {string}
 */
const ActivityType = {
  // 인증 관련
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  EMAIL_VERIFIED: 'email_verified',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  
  // 미디어 관련
  UPLOAD_MEDIA: 'upload_media',
  UPLOAD_MULTIPLE_MEDIA: 'upload_multiple_media',
  DELETE_MEDIA: 'delete_media',
  VIEW_MEDIA: 'view_media',
  SEARCH_MEDIA: 'search_media',
  
  // 문서 관련
  UPLOAD_DOCUMENT: 'upload_document',
  UPLOAD_MULTIPLE_DOCUMENTS: 'upload_multiple_documents',
  DELETE_DOCUMENT: 'delete_document',
  VIEW_DOCUMENT: 'view_document',
  SEARCH_DOCUMENTS: 'search_documents',
  DOWNLOAD_DOCUMENT: 'download_document',
  
  // 프로필 관련
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',
  
  // 분석 관련
  ANALYSIS_REQUESTED: 'analysis_requested',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  ANALYSIS_RETRY: 'analysis_retry',
  
  // 기타
  API_ACCESS: 'api_access',
  ERROR: 'error'
};

/**
 * 사용자 활동 로깅
 * @param {string} userId - 사용자 ID
 * @param {keyof typeof ActivityType} action - 활동 타입
 * @param {Object} options - 추가 옵션
 * @param {string} [options.resourceType] - 리소스 타입
 * @param {string} [options.resourceId] - 리소스 ID
 * @param {Object} [options.metadata] - 추가 메타데이터
 * @param {import('express').Request} [options.req] - Express 요청 객체 (IP, User-Agent 추출용)
 * @returns {Promise<void>}
 */
const logActivity = async (userId, action, options = {}) => {
  try {
    const {
      resourceType = null,
      resourceId = null,
      metadata = {},
      req = null
    } = options;

    // 요청 정보 추출
    let ipAddress = null;
    let userAgent = null;
    
    if (req) {
      ipAddress = req.ip || req.connection?.remoteAddress || null;
      userAgent = req.get('user-agent') || null;
      
      // 추가 메타데이터에 요청 정보 포함
      if (req.method) metadata.method = req.method;
      if (req.path) metadata.path = req.path;
    }

    // 활동 로그 생성
    await UserActivity.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // 디버그 로그 (선택사항)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('사용자 활동 로깅', {
        userId,
        action,
        resourceType,
        resourceId
      });
    }
  } catch (error) {
    // 활동 로깅 실패가 앱 동작에 영향을 주지 않도록 에러만 로깅
    logger.error('사용자 활동 로깅 실패', {
      userId,
      action,
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * 사용자 활동 조회 (최근 N개)
 * @param {string} userId - 사용자 ID
 * @param {number} [limit=50] - 조회할 활동 수
 * @param {Object} [filters] - 필터 옵션
 * @param {string} [filters.action] - 활동 타입 필터
 * @param {Date} [filters.startDate] - 시작 날짜
 * @param {Date} [filters.endDate] - 종료 날짜
 * @returns {Promise<Array>} 활동 로그 배열
 */
const getUserActivities = async (userId, limit = 50, filters = {}) => {
  try {
    const where = { user_id: userId };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at[require('sequelize').Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at[require('sequelize').Op.lte] = filters.endDate;
      }
    }

    const activities = await UserActivity.findAll({
      where,
      limit,
      order: [['created_at', 'DESC']]
    });

    return activities;
  } catch (error) {
    logger.error('사용자 활동 조회 실패', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * 활동 통계 조회
 * @param {string} userId - 사용자 ID
 * @param {Date} [startDate] - 시작 날짜
 * @param {Date} [endDate] - 종료 날짜
 * @returns {Promise<Object>} 활동 통계 객체
 */
const getActivityStats = async (userId, startDate = null, endDate = null) => {
  try {
    const { Op } = require('sequelize');
    const where = { user_id: userId };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = startDate;
      }
      if (endDate) {
        where.created_at[Op.lte] = endDate;
      }
    }

    // 전체 활동 수
    const totalActivities = await UserActivity.count({ where });

    // 활동 타입별 통계
    const activitiesByType = await UserActivity.findAll({
      where,
      attributes: [
        'action',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    // 날짜별 통계 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await UserActivity.findAll({
      where: {
        ...where,
        created_at: {
          [Op.gte]: startDate || sevenDaysAgo
        }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'DESC']],
      raw: true
    });

    return {
      total: totalActivities,
      byType: activitiesByType.reduce((acc, item) => {
        acc[item.action] = parseInt(item.count);
        return acc;
      }, {}),
      daily: dailyStats.map(item => ({
        date: item.date,
        count: parseInt(item.count)
      }))
    };
  } catch (error) {
    logger.error('활동 통계 조회 실패', {
      userId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  logActivity,
  getUserActivities,
  getActivityStats,
  ActivityType
};

