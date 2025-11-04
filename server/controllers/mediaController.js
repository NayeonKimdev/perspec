const Media = require('../models/Media');
const { Op } = require('sequelize');
const path = require('path');
const analysisQueue = require('../services/analysisQueue');

// 단일 이미지 업로드
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
    
    // 미디어 정보 저장
    const media = await Media.create({
      user_id: userId,
      file_name: file.originalname,
      file_path: file.path,
      file_type: file.mimetype,
      file_size: file.size,
      file_url: fileUrl,
      metadata: {}
    });
    
    // 분석 큐에 추가
    await analysisQueue.addToQueue(media.id);
    
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

// 다중 이미지 업로드
const uploadMultipleImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const mediaList = [];
    
    // 각 파일에 대해 미디어 정보 저장
    for (const file of files) {
      const fileUrl = `${baseUrl}/uploads/images/${file.filename}`;
      
      const media = await Media.create({
        user_id: userId,
        file_name: file.originalname,
        file_path: file.path,
        file_type: file.mimetype,
        file_size: file.size,
        file_url: fileUrl,
        metadata: {}
      });
      
      mediaList.push(media.toJSON());
    }
    
    // 각 미디어를 분석 큐에 추가
    for (const mediaItem of mediaList) {
      await analysisQueue.addToQueue(mediaItem.id);
    }
    
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

// 사용자의 모든 미디어 조회
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

// 모든 이미지 분석 결과 종합
const getAnalysisSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자의 모든 이미지 조회 (분석 완료된 것만)
    const allMedia = await Media.findAll({
      where: { user_id: userId }
    });
    
    const completedMedia = allMedia.filter(m => m.analysis_status === 'completed');
    
    if (completedMedia.length === 0) {
      return res.json({
        summary: {
          total_images: allMedia.length,
          analyzed_images: 0,
          top_interests: [],
          top_keywords: [],
          common_moods: [],
          overall_insight: '분석된 이미지가 없습니다.'
        }
      });
    }
    
    // 관심사 집계
    const interestsCount = {};
    completedMedia.forEach(media => {
      if (media.analysis_result && Array.isArray(media.analysis_result.inferred_interests)) {
        media.analysis_result.inferred_interests.forEach(interest => {
          interestsCount[interest] = (interestsCount[interest] || 0) + 1;
        });
      }
    });
    
    // 키워드 집계
    const keywordsCount = {};
    completedMedia.forEach(media => {
      if (media.analysis_result && Array.isArray(media.analysis_result.keywords)) {
        media.analysis_result.keywords.forEach(keyword => {
          keywordsCount[keyword] = (keywordsCount[keyword] || 0) + 1;
        });
      }
    });
    
    // 분위기 집계
    const moodsList = [];
    completedMedia.forEach(media => {
      if (media.analysis_result && media.analysis_result.mood) {
        moodsList.push(media.analysis_result.mood);
      }
    });
    
    // 가장 많이 나타나는 관심사 상위 10개
    const topInterests = Object.entries(interestsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interest, count]) => ({ interest, count }));
    
    // 가장 많이 나타나는 키워드 상위 10개
    const topKeywords = Object.entries(keywordsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    
    // 전체 인사이트 생성
    const overallInsight = topInterests.length > 0
      ? `${topInterests[0][0]}과(와) 같은 관심사를 가진 활동을 즐기는 것으로 보입니다.`
      : '이미지에서 다양한 패턴을 발견할 수 있습니다.';
    
    res.json({
      summary: {
        total_images: allMedia.length,
        analyzed_images: completedMedia.length,
        pending_images: allMedia.filter(m => m.analysis_status === 'pending').length,
        analyzing_images: allMedia.filter(m => m.analysis_status === 'analyzing').length,
        failed_images: allMedia.filter(m => m.analysis_status === 'failed').length,
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

