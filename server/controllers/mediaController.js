/**
 * @fileoverview 미디어 컨트롤러
 * 이미지 업로드, 조회, 검색, 분석 관리 등의 기능을 제공합니다.
 * @module controllers/mediaController
 */

const Media = require('../models/Media');
const { Op } = require('sequelize');
const path = require('path');
const analysisQueue = require('../services/analysisQueue');
const imageOptimization = require('../services/imageOptimizationService');
const logger = require('../utils/logger');
const { logActivity, ActivityType } = require('../utils/activityLogger');

/**
 * 단일 이미지 업로드
 * @param {import('express').Request & { user: { id: string }, file?: import('multer').File }} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 * 
 * 처리 과정:
 * 1. 파일 유효성 검사
 * 2. 파일 URL 생성 (프론트엔드 접근 가능한 경로)
 * 3. 데이터베이스에 미디어 정보 저장
 * 4. 분석 큐에 추가 (비동기 분석 시작)
 */
const uploadImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    
    // 파일이 없으면 에러
    if (!file) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }
    
    // 파일 URL 생성 (프론트엔드에서 접근 가능한 URL)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/images/${file.filename}`;
    
    // 이미지 최적화 (백그라운드에서 처리되므로 응답 지연 없음)
    let optimizationResult = null;
    try {
      if (process.env.ENABLE_IMAGE_OPTIMIZATION !== 'false') {
        // 원본 보존 옵션이 켜져있으면 별도 처리, 아니면 원본 덮어쓰기
        if (imageOptimization.OPTIMIZATION_CONFIG.keepOriginal) {
          optimizationResult = await imageOptimization.optimizeImageWithOriginal(file.path);
        } else {
          optimizationResult = await imageOptimization.optimizeImageInPlace(file.path);
        }
        
        logger.info('이미지 최적화 완료', {
          mediaId: null, // 아직 생성 전
          originalSize: optimizationResult.originalSize,
          optimizedSize: optimizationResult.optimizedSize,
          compressionRatio: `${optimizationResult.compressionRatio}%`,
          format: optimizationResult.format
        });
      }
    } catch (optimizationError) {
      // 최적화 실패해도 업로드는 계속 진행
      logger.warn('이미지 최적화 실패 (업로드 계속 진행)', {
        error: optimizationError.message,
        file: file.filename
      });
    }
    
    // 미디어 정보 저장
    const media = await Media.create({
      user_id: userId,
      file_name: file.originalname,
      file_path: file.path,
      file_type: file.mimetype,
      file_size: optimizationResult ? optimizationResult.optimizedSize : file.size,
      file_url: fileUrl,
      metadata: optimizationResult ? {
        optimization: {
          originalSize: optimizationResult.originalSize,
          optimizedSize: optimizationResult.optimizedSize,
          compressionRatio: optimizationResult.compressionRatio,
          format: optimizationResult.format,
          dimensions: optimizationResult.dimensions
        }
      } : {}
    });
    
    // 분석 큐에 추가
    await analysisQueue.addToQueue(media.id);
    
    // 활동 로깅
    await logActivity(userId, ActivityType.UPLOAD_MEDIA, {
      resourceType: 'media',
      resourceId: media.id,
      metadata: {
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        optimized: !!optimizationResult
      },
      req
    });
    
    // 저장된 미디어 정보 반환 (밀린 정보 제외)
    const mediaData = media.toJSON();
    
    res.status(201).json({
      media: mediaData,
      message: '이미지가 업로드되었습니다. 분석은 백그라운드에서 진행됩니다.'
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다' });
  }
};

/**
 * 다중 이미지 업로드
 * @param {Object} req - Express 요청 객체
 * @param {Array} req.files - 업로드된 파일 배열 (Multer)
 * @param {Object} res - Express 응답 객체
 * 
 * 처리 과정:
 * 1. 파일 배열 유효성 검사
 * 2. 각 파일에 대해 순차적으로:
 *    - 파일 URL 생성
 *    - 데이터베이스에 미디어 정보 저장
 *    - 분석 큐에 추가
 * 3. 전체 결과 반환
 * 
 * 성능 고려사항:
 * - 대량 업로드 시 순차 처리로 인한 지연 가능
 * - 필요시 배치 처리로 개선 가능
 */
const uploadMultipleImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const mediaList = [];
    
    // 각 파일에 대해 미디어 정보 저장 및 최적화
    for (const file of files) {
      const fileUrl = `${baseUrl}/uploads/images/${file.filename}`;
      
      // 이미지 최적화
      let optimizationResult = null;
      try {
        if (process.env.ENABLE_IMAGE_OPTIMIZATION !== 'false') {
          if (imageOptimization.OPTIMIZATION_CONFIG.keepOriginal) {
            optimizationResult = await imageOptimization.optimizeImageWithOriginal(file.path);
          } else {
            optimizationResult = await imageOptimization.optimizeImageInPlace(file.path);
          }
          
          logger.debug('이미지 최적화 완료', {
            file: file.filename,
            compressionRatio: `${optimizationResult.compressionRatio}%`
          });
        }
      } catch (optimizationError) {
        logger.warn('이미지 최적화 실패', {
          error: optimizationError.message,
          file: file.filename
        });
      }
      
      const media = await Media.create({
        user_id: userId,
        file_name: file.originalname,
        file_path: file.path,
        file_type: file.mimetype,
        file_size: optimizationResult ? optimizationResult.optimizedSize : file.size,
        file_url: fileUrl,
        metadata: optimizationResult ? {
          optimization: {
            originalSize: optimizationResult.originalSize,
            optimizedSize: optimizationResult.optimizedSize,
            compressionRatio: optimizationResult.compressionRatio,
            format: optimizationResult.format,
            dimensions: optimizationResult.dimensions
          }
        } : {}
      });
      
      mediaList.push(media.toJSON());
    }
    
    // 각 미디어를 분석 큐에 추가
    for (const mediaItem of mediaList) {
      await analysisQueue.addToQueue(mediaItem.id);
    }
    
    // 활동 로깅 (다중 업로드)
    await logActivity(userId, ActivityType.UPLOAD_MULTIPLE_MEDIA, {
      resourceType: 'media',
      metadata: {
        count: mediaList.length,
        fileNames: files.map(f => f.originalname)
      },
      req
    });
    
    res.status(201).json({
      media: mediaList,
      count: mediaList.length,
      message: `${mediaList.length}개의 이미지가 업로드되었습니다. 분석은 백그라운드에서 진행됩니다.`
    });
  } catch (error) {
    console.error('다중 이미지 업로드 오류:', error);
    res.status(500).json({ message: '이미지 업로드 중 오류가 발생했습니다' });
  }
};

/**
 * 사용자의 모든 미디어 조회 (페이지네이션 지원)
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.query - 쿼리 파라미터
 * @param {number} req.query.page - 페이지 번호 (기본값: 1)
 * @param {number} req.query.limit - 페이지당 항목 수 (기본값: 20)
 * @param {string} req.query.sort - 정렬 방식 ('created_at_desc' | 'created_at_asc')
 * @param {string} req.query.analysis_status - 분석 상태 필터 ('completed' | 'pending' | 'analyzing' | 'failed' | 'all')
 * @param {string} req.query.date_filter - 날짜 필터 ('today' | 'week' | 'month' | 'all')
 * @param {Object} res - Express 응답 객체
 * 
 * 필터링 로직:
 * - 분석 상태 필터: 특정 상태의 미디어만 조회
 * - 날짜 필터: 
 *   - 'today': 오늘 00:00:00 이후
 *   - 'week': 7일 전 이후
 *   - 'month': 1개월 전 이후
 * 
 * 페이지네이션:
 * - offset = (page - 1) * limit
 * - 총 페이지 수 = Math.ceil(전체 개수 / limit)
 */
const getMediaList = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'created_at_desc'; // created_at_desc or created_at_asc
    const analysisStatus = req.query.analysis_status; // completed, pending, analyzing, failed, all
    const dateFilter = req.query.date_filter; // today, week, month, all
    
    const offset = (page - 1) * limit;
    const orderDirection = sort === 'created_at_asc' ? 'ASC' : 'DESC';
    
    // 조건 설정
    const where = { user_id: userId };
    
    // 분석 상태 필터 적용
    if (analysisStatus && analysisStatus !== 'all') {
      where.analysis_status = analysisStatus;
    }
    
    // 날짜 필터 적용
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          // 오늘 00:00:00 설정
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          // 7일 전 날짜 계산
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          // 1개월 전 날짜 계산
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      // Sequelize의 Op.gte (greater than or equal) 연산자 사용
      where.created_at = {
        [Op.gte]: startDate
      };
    }
    
    const { count, rows } = await Media.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', orderDirection]]
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      media: rows,
      total: count,
      page,
      totalPages,
      limit
    });
  } catch (error) {
    console.error('미디어 조회 오류:', error);
    res.status(500).json({ message: '미디어 조회 중 오류가 발생했습니다' });
  }
};

// 이미지 검색
const searchMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q;
    const analysisStatus = req.query.analysis_status;
    const dateFilter = req.query.date_filter;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'created_at_desc';
    
    const offset = (page - 1) * limit;
    const orderDirection = sort === 'created_at_asc' ? 'ASC' : 'DESC';
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: '검색어를 입력해주세요' });
    }
    
    // 검색 조건 구성
    const where = {
      user_id: userId,
      [Op.or]: [
        { file_name: { [Op.iLike]: `%${query}%` } }
      ]
    };
    
    // 분석 결과에서도 검색 (JSON 필드)
    // 분석 상태 필터
    if (analysisStatus && analysisStatus !== 'all') {
      where.analysis_status = analysisStatus;
    }
    
    // 날짜 필터
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      where.created_at = {
        [Op.gte]: startDate
      };
    }
    
    const { count, rows } = await Media.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', orderDirection]]
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.json({
      media: rows,
      total: count,
      page,
      totalPages,
      query
    });
  } catch (error) {
    console.error('이미지 검색 오류:', error);
    res.status(500).json({ message: '이미지 검색 중 오류가 발생했습니다' });
  }
};

// 특정 미디어 삭제
const deleteMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.id;
    
    // 미디어 조회
    const media = await Media.findOne({
      where: { id: mediaId }
    });
    
    if (!media) {
      return res.status(404).json({ message: '미디어를 찾을 수 없습니다' });
    }
    
    // 권한 확인 (해당 사용자의 파일인지)
    if (media.user_id !== userId) {
      return res.status(403).json({ message: '해당 파일을 삭제할 권한이 없습니다' });
    }
    
    // 파일시스템에서 파일 삭제
    const fs = require('fs');
    if (fs.existsSync(media.file_path)) {
      fs.unlinkSync(media.file_path);
    }
    
    // 데이터베이스에서 삭제
    await media.destroy();
    
    // 활동 로깅
    await logActivity(userId, ActivityType.DELETE_MEDIA, {
      resourceType: 'media',
      resourceId: mediaId,
      metadata: {
        fileName: media.file_name
      },
      req
    });
    
    res.json({ message: '파일이 삭제되었습니다' });
  } catch (error) {
    console.error('미디어 삭제 오류:', error);
    res.status(500).json({ message: '미디어 삭제 중 오류가 발생했습니다' });
  }
};

// 특정 미디어의 분석 상태 조회
const getAnalysisStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.id;
    
    // 미디어 조회
    const media = await Media.findOne({
      where: { id: mediaId }
    });
    
    if (!media) {
      return res.status(404).json({ message: '미디어를 찾을 수 없습니다' });
    }
    
    // 권한 확인
    if (media.user_id !== userId) {
      return res.status(403).json({ message: '해당 파일을 조회할 권한이 없습니다' });
    }
    
    // 분석 상태에 따라 응답 구성
    const response = {
      status: media.analysis_status,
      analyzed_at: media.analyzed_at
    };
    
    if (media.analysis_status === 'completed') {
      response.result = media.analysis_result;
      response.message = '분석이 완료되었습니다';
    } else if (media.analysis_status === 'pending') {
      response.message = '분석 대기 중입니다';
    } else if (media.analysis_status === 'analyzing') {
      response.message = '분석 진행 중입니다';
    } else if (media.analysis_status === 'failed') {
      response.error = media.analysis_error;
      response.message = '분석에 실패했습니다';
    }
    
    res.json({ analysis: response });
  } catch (error) {
    console.error('분석 상태 조회 오류:', error);
    res.status(500).json({ message: '분석 상태 조회 중 오류가 발생했습니다' });
  }
};

/**
 * 모든 이미지 분석 결과 종합 (통계 집계)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 * 
 * 기능:
 * 사용자의 모든 분석 완료된 이미지에서 다음 정보를 집계합니다:
 * 1. 관심사 빈도 집계 (inferred_interests 배열)
 * 2. 키워드 빈도 집계 (keywords 배열)
 * 3. 분위기 목록 수집 (mood 문자열)
 * 4. 분석 상태별 통계
 * 
 * 집계 알고리즘:
 * - 각 미디어의 analysis_result JSON에서 배열 필드를 순회
 * - 객체를 사용하여 빈도 카운트 (Map 대신 객체 사용으로 간단한 구조 유지)
 * - Object.entries()로 변환 후 빈도순 정렬
 * - 상위 10개만 추출하여 반환
 * 
 * 성능 고려사항:
 * - 대량 데이터의 경우 메모리에서 집계하므로 메모리 사용량 증가 가능
 * - 필요시 데이터베이스 레벨 집계(aggregation)로 최적화 가능
 */
const getAnalysisSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 데이터베이스 레벨에서 필터링하여 메모리 사용량 최적화
    // 분석 완료된 미디어만 조회 (JavaScript 필터링 대신 DB 쿼리 최적화)
    const completedMedia = await Media.findAll({
      where: { 
        user_id: userId,
        analysis_status: 'completed'
      },
      // 필요한 컬럼만 선택 (메모리 사용량 감소)
      attributes: ['id', 'analysis_result', 'analysis_status', 'created_at']
    });
    
    // 전체 미디어 개수만 조회 (분석 결과는 필요 없음)
    const allMediaCount = await Media.count({
      where: { user_id: userId }
    });
    
    // 분석 상태별 개수 집계 (한 번의 쿼리로 처리)
    const statusCounts = await Media.findAll({
      where: { user_id: userId },
      attributes: [
        'analysis_status',
        [Media.sequelize.fn('COUNT', Media.sequelize.col('id')), 'count']
      ],
      group: ['analysis_status'],
      raw: true
    });
    
    // 상태별 개수를 객체로 변환
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item.analysis_status] = parseInt(item.count);
    });
    
    // 분석 완료된 이미지가 없으면 빈 결과 반환
    if (completedMedia.length === 0) {
      return res.json({
        summary: {
          total_images: allMediaCount,
          analyzed_images: 0,
          pending_images: statusMap.pending || 0,
          analyzing_images: statusMap.analyzing || 0,
          failed_images: statusMap.failed || 0,
          top_interests: [],
          top_keywords: [],
          common_moods: [],
          overall_insight: '분석된 이미지가 없습니다.'
        }
      });
    }
    
    // 관심사 빈도 집계
    // 각 미디어의 inferred_interests 배열을 순회하며 카운트
    const interestsCount = {};
    completedMedia.forEach(media => {
      if (media.analysis_result && Array.isArray(media.analysis_result.inferred_interests)) {
        media.analysis_result.inferred_interests.forEach(interest => {
          interestsCount[interest] = (interestsCount[interest] || 0) + 1;
        });
      }
    });
    
    // 키워드 빈도 집계
    // 각 미디어의 keywords 배열을 순회하며 카운트
    const keywordsCount = {};
    completedMedia.forEach(media => {
      if (media.analysis_result && Array.isArray(media.analysis_result.keywords)) {
        media.analysis_result.keywords.forEach(keyword => {
          keywordsCount[keyword] = (keywordsCount[keyword] || 0) + 1;
        });
      }
    });
    
    // 분위기 수집 (중복 포함)
    const moodsList = [];
    completedMedia.forEach(media => {
      if (media.analysis_result && media.analysis_result.mood) {
        moodsList.push(media.analysis_result.mood);
      }
    });
    
    // 관심사 상위 10개 추출
    // Object.entries()로 [키, 값] 배열 변환 → 빈도순 정렬 → 상위 10개 추출
    const topInterests = Object.entries(interestsCount)
      .sort((a, b) => b[1] - a[1]) // 빈도 내림차순 정렬
      .slice(0, 10) // 상위 10개만 선택
      .map(([interest, count]) => ({ interest, count })); // 객체 형태로 변환
    
    // 키워드 상위 10개 추출
    const topKeywords = Object.entries(keywordsCount)
      .sort((a, b) => b[1] - a[1]) // 빈도 내림차순 정렬
      .slice(0, 10) // 상위 10개만 선택
      .map(([keyword, count]) => ({ keyword, count })); // 객체 형태로 변환
    
    // 전체 인사이트 생성
    // 가장 빈도가 높은 관심사를 기반으로 인사이트 생성
    const overallInsight = topInterests.length > 0
      ? `${topInterests[0][0]}과(와) 같은 관심사를 가진 활동을 즐기는 것으로 보입니다.`
      : '이미지에서 다양한 패턴을 발견할 수 있습니다.';
    
    res.json({
      summary: {
        total_images: allMediaCount,
        analyzed_images: completedMedia.length,
        pending_images: statusMap.pending || 0,
        analyzing_images: statusMap.analyzing || 0,
        failed_images: statusMap.failed || 0,
        top_interests: topInterests,
        top_keywords: topKeywords,
        common_moods: [...new Set(moodsList)], // 중복 제거
        overall_insight: overallInsight
      }
    });
  } catch (error) {
    console.error('분석 요약 조회 오류:', error);
    res.status(500).json({ message: '분석 요약 조회 중 오류가 발생했습니다' });
  }
};

// 특정 이미지 재분석 요청
const retryAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.id;
    
    // 미디어 조회
    const media = await Media.findOne({
      where: { id: mediaId }
    });
    
    if (!media) {
      return res.status(404).json({ message: '미디어를 찾을 수 없습니다' });
    }
    
    // 권한 확인
    if (media.user_id !== userId) {
      return res.status(403).json({ message: '해당 파일을 재분석할 권한이 없습니다' });
    }
    
    // 상태를 pending으로 변경하고 큐에 추가
    await media.update({
      analysis_status: 'pending',
      analysis_error: null
    });
    
    await analysisQueue.addToQueue(media.id);
    
    res.json({ 
      message: '재분석이 시작되었습니다',
      media_id: media.id
    });
  } catch (error) {
    console.error('재분석 요청 오류:', error);
    res.status(500).json({ message: '재분석 요청 중 오류가 발생했습니다' });
  }
};

// 실패한 모든 이미지 재분석 요청
const retryAllFailedAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자의 실패한 이미지 조회
    const failedMedias = await Media.findAll({
      where: {
        user_id: userId,
        analysis_status: 'failed'
      }
    });
    
    if (failedMedias.length === 0) {
      return res.json({ 
        message: '재분석할 이미지가 없습니다',
        count: 0
      });
    }
    
    // 모든 실패한 이미지를 pending으로 변경하고 큐에 추가
    for (const media of failedMedias) {
      await media.update({
        analysis_status: 'pending',
        analysis_error: null
      });
      await analysisQueue.addToQueue(media.id);
    }
    
    res.json({ 
      message: `${failedMedias.length}개의 이미지 재분석이 시작되었습니다`,
      count: failedMedias.length
    });
  } catch (error) {
    console.error('일괄 재분석 요청 오류:', error);
    res.status(500).json({ message: '일괄 재분석 요청 중 오류가 발생했습니다' });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  getMediaList,
  searchMedia,
  deleteMedia,
  getAnalysisStatus,
  getAnalysisSummary,
  retryAnalysis,
  retryAllFailedAnalysis
};

