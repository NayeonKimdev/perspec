const Media = require('../models/Media');
const path = require('path');

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
    
    // 저장된 미디어 정보 반환 (밀린 정보 제외)
    const mediaData = media.toJSON();
    
    res.status(201).json({
      media: mediaData
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
    
    res.status(201).json({
      media: mediaList,
      count: mediaList.length
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
    
    const offset = (page - 1) * limit;
    const orderDirection = sort === 'created_at_asc' ? 'ASC' : 'DESC';
    
    // 조건 설정
    const where = { user_id: userId };
    
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

module.exports = {
  uploadImage,
  uploadMultipleImages,
  getMediaList,
  deleteMedia
};

