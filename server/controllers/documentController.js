const TextDocument = require('../models/TextDocument');
const { parseAndExtract } = require('../services/textParserService');
const analysisQueue = require('../services/analysisQueue');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../models/index');

// 데이터베이스 연결 확인 헬퍼 함수
const checkDatabaseConnection = async () => {
  try {
    // 환경 변수 확인
    const dbConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '***' : undefined
    };

    if (!dbConfig.host || !dbConfig.port || !dbConfig.database || !dbConfig.user) {
      console.error('데이터베이스 환경 변수가 설정되지 않았습니다:', {
        host: !!dbConfig.host,
        port: !!dbConfig.port,
        database: !!dbConfig.database,
        user: !!dbConfig.user,
        password: !!process.env.DB_PASSWORD
      });
      return false;
    }

    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 오류:', {
      message: error.message,
      name: error.name,
      code: error.code,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });
    return false;
  }
};

// 단일 텍스트 파일 업로드
const uploadDocument = async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
    }

    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }

    // 파일 파싱 및 메타데이터 추출
    const { content, metadata, documentType } = await parseAndExtract(
      file.path,
      file.originalname
    );

    // 파일 확장자 추출
    const fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();

    // 텍스트 문서 저장
    const document = await TextDocument.create({
      user_id: userId,
      file_name: file.originalname,
      file_type: fileExtension,
      file_path: file.path,
      file_size: file.size,
      content: content,
      document_type: documentType,
      metadata: metadata,
      analysis_status: 'pending'
    });

    // 분석 큐에 추가
    await analysisQueue.addToQueue({ type: 'text', id: document.id });

    // 응답 데이터 구성
    const contentPreview = content.substring(0, 100);
    const documentData = document.toJSON();

    res.status(201).json({
      document: {
        id: documentData.id,
        file_name: documentData.file_name,
        file_type: documentData.file_type,
        document_type: documentData.document_type,
        content_preview: contentPreview,
        char_count: metadata.charCount,
        word_count: metadata.wordCount,
        analysis_status: documentData.analysis_status,
        created_at: documentData.created_at
      },
      message: '문서가 업로드되었습니다. 분석은 백그라운드에서 진행됩니다.'
    });
  } catch (error) {
    console.error('문서 업로드 오류:', error);
    console.error('오류 이름:', error.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    
    // 업로드된 파일이 있으면 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('파일 삭제 실패:', unlinkError);
      }
    }

    // 데이터베이스 연결 오류인지 확인
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(503).json({ 
        message: '데이터베이스 연결이 필요합니다.',
        error: error.message
      });
    }

    // Sequelize 유효성 검사 오류
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: '데이터 검증 오류가 발생했습니다.',
        errors: error.errors?.map(e => e.message) || [error.message]
      });
    }

    // 파일 파싱 오류
    if (error.message && error.message.includes('parse')) {
      return res.status(400).json({ 
        message: '파일을 읽을 수 없습니다. 텍스트 파일인지 확인해주세요.',
        error: error.message
      });
    }

    res.status(500).json({ 
      message: '문서 업로드 중 오류가 발생했습니다',
      error: error.message || '알 수 없는 오류',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 다중 텍스트 파일 업로드
const uploadMultipleDocuments = async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
    }

    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }

    if (files.length > 10) {
      return res.status(400).json({ message: '최대 10개까지 업로드 가능합니다' });
    }

    const documentList = [];
    const errors = [];

    // 각 파일 처리
    for (const file of files) {
      try {
        // 파일 파싱 및 메타데이터 추출
        const { content, metadata, documentType } = await parseAndExtract(
          file.path,
          file.originalname
        );

        const fileExtension = path.extname(file.originalname).replace('.', '').toLowerCase();

        // 텍스트 문서 저장
        const document = await TextDocument.create({
          user_id: userId,
          file_name: file.originalname,
          file_type: fileExtension,
          file_path: file.path,
          file_size: file.size,
          content: content,
          document_type: documentType,
          metadata: metadata,
          analysis_status: 'pending'
        });

        // 분석 큐에 추가
        await analysisQueue.addToQueue({ type: 'text', id: document.id });

        documentList.push(document.toJSON());
      } catch (error) {
        console.error(`파일 ${file.originalname} 처리 오류:`, error);
        
        // 실패한 파일 삭제
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('파일 삭제 실패:', unlinkError);
          }
        }

        errors.push({
          file_name: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      documents: documentList.map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        document_type: doc.document_type,
        content_preview: doc.content.substring(0, 100),
        char_count: doc.metadata?.charCount || 0,
        word_count: doc.metadata?.wordCount || 0,
        analysis_status: doc.analysis_status,
        created_at: doc.created_at
      })),
      count: documentList.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${documentList.length}개의 문서가 업로드되었습니다. ${errors.length > 0 ? `(${errors.length}개 실패)` : ''}`
    });
  } catch (error) {
    console.error('다중 문서 업로드 오류:', error);
    
    // 데이터베이스 연결 오류인지 확인
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      return res.status(503).json({ 
        message: '데이터베이스 연결이 필요합니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({ 
      message: '문서 업로드 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 텍스트 문서 목록 조회
const getDocumentList = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const documentType = req.query.document_type;
    const offset = (page - 1) * limit;

    // 필터 조건 구성
    const where = { user_id: userId };
    if (documentType && ['note', 'diary', 'json', 'other'].includes(documentType)) {
      where.document_type = documentType;
    }

    // 정렬 설정
    const sort = req.query.sort || 'created_at_desc';
    let order;
    switch (sort) {
      case 'created_at_asc':
        order = [['created_at', 'ASC']];
        break;
      case 'updated_at_desc':
        order = [['updated_at', 'DESC']];
        break;
      case 'updated_at_asc':
        order = [['updated_at', 'ASC']];
        break;
      default:
        order = [['created_at', 'DESC']];
    }

    // 문서 목록 조회
    const { count, rows } = await TextDocument.findAndCountAll({
      where,
      order,
      limit,
      offset,
      attributes: [
        'id',
        'file_name',
        'file_type',
        'document_type',
        'file_size',
        'content',
        'metadata',
        'analysis_status',
        'created_at',
        'updated_at'
      ]
    });

    // 응답 데이터 구성
    const documents = rows.map(doc => {
      const docData = doc.toJSON();
      const content = docData.content || '';
      const contentPreview = content.substring(0, 150);

      return {
        id: docData.id,
        file_name: docData.file_name,
        document_type: docData.document_type,
        content_preview: contentPreview,
        char_count: docData.metadata?.charCount || 0,
        word_count: docData.metadata?.wordCount || 0,
        analysis_status: docData.analysis_status,
        created_at: docData.created_at
      };
    });

    res.json({
      documents,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('문서 목록 조회 오류:', error);
    res.status(500).json({ message: '문서 목록을 불러오는 중 오류가 발생했습니다' });
  }
};

// 특정 텍스트 문서 조회
const getDocumentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const document = await TextDocument.findOne({
      where: {
        id: documentId,
        user_id: userId
      }
    });

    if (!document) {
      return res.status(404).json({ message: '문서를 찾을 수 없습니다' });
    }

    const documentData = document.toJSON();

    res.json({
      document: {
        id: documentData.id,
        file_name: documentData.file_name,
        file_type: documentData.file_type,
        document_type: documentData.document_type,
        content: documentData.content,
        metadata: documentData.metadata,
        analysis_status: documentData.analysis_status,
        file_size: documentData.file_size,
        created_at: documentData.created_at,
        updated_at: documentData.updated_at
      }
    });
  } catch (error) {
    console.error('문서 조회 오류:', error);
    res.status(500).json({ message: '문서를 불러오는 중 오류가 발생했습니다' });
  }
};

// 텍스트 문서 삭제
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const document = await TextDocument.findOne({
      where: {
        id: documentId,
        user_id: userId
      }
    });

    if (!document) {
      return res.status(404).json({ message: '문서를 찾을 수 없습니다' });
    }

    // 파일 삭제
    const filePath = document.file_path;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('파일 삭제 실패:', unlinkError);
        // 파일 삭제 실패해도 DB 레코드는 삭제
      }
    }

    // 데이터베이스에서 삭제
    await document.destroy();

    res.json({ message: '문서가 삭제되었습니다' });
  } catch (error) {
    console.error('문서 삭제 오류:', error);
    res.status(500).json({ message: '문서 삭제 중 오류가 발생했습니다' });
  }
};

// 텍스트 문서 분석 상태 조회
const getDocumentAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const document = await TextDocument.findOne({
      where: {
        id: documentId,
        user_id: userId
      },
      attributes: ['id', 'analysis_status', 'analysis_result', 'analyzed_at', 'analysis_error']
    });

    if (!document) {
      return res.status(404).json({ message: '문서를 찾을 수 없습니다' });
    }

    const documentData = document.toJSON();

    res.json({
      analysis: {
        status: documentData.analysis_status,
        result: documentData.analysis_result,
        analyzed_at: documentData.analyzed_at,
        error: documentData.analysis_error
      }
    });
  } catch (error) {
    console.error('분석 상태 조회 오류:', error);
    res.status(500).json({ message: '분석 상태를 불러오는 중 오류가 발생했습니다' });
  }
};

// 텍스트 문서 검색
const searchDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q;
    const documentType = req.query.document_type;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: '검색어를 입력해주세요' });
    }

    // 검색 조건 구성
    const where = {
      user_id: userId,
      [Op.or]: [
        { file_name: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } }
      ]
    };

    if (documentType && ['note', 'diary', 'json', 'other'].includes(documentType)) {
      where.document_type = documentType;
    }

    // 문서 검색
    const { count, rows } = await TextDocument.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'file_name',
        'file_type',
        'document_type',
        'content',
        'metadata',
        'analysis_status',
        'created_at'
      ]
    });

    // 응답 데이터 구성
    const documents = rows.map(doc => {
      const docData = doc.toJSON();
      const content = docData.content || '';
      const contentPreview = content.substring(0, 150);

      return {
        id: docData.id,
        file_name: docData.file_name,
        document_type: docData.document_type,
        content_preview: contentPreview,
        char_count: docData.metadata?.charCount || 0,
        word_count: docData.metadata?.wordCount || 0,
        analysis_status: docData.analysis_status,
        created_at: docData.created_at
      };
    });

    res.json({
      documents,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      query
    });
  } catch (error) {
    console.error('문서 검색 오류:', error);
    res.status(500).json({ message: '문서 검색 중 오류가 발생했습니다' });
  }
};

// 텍스트 문서 다운로드
const downloadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    const document = await TextDocument.findOne({
      where: {
        id: documentId,
        user_id: userId
      }
    });

    if (!document) {
      return res.status(404).json({ message: '문서를 찾을 수 없습니다' });
    }

    // 파일이 존재하는지 확인
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다' });
    }

    // 파일 다운로드
    res.download(document.file_path, document.file_name, (err) => {
      if (err) {
        console.error('파일 다운로드 오류:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: '파일 다운로드 중 오류가 발생했습니다' });
        }
      }
    });
  } catch (error) {
    console.error('문서 다운로드 오류:', error);
    res.status(500).json({ message: '문서 다운로드 중 오류가 발생했습니다' });
  }
};

module.exports = {
  uploadDocument,
  uploadMultipleDocuments,
  getDocumentList,
  getDocumentById,
  deleteDocument,
  getDocumentAnalysis,
  searchDocuments,
  downloadDocument
};

