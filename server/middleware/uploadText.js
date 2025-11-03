const multer = require('multer');
const path = require('path');
const { 
  DOCUMENTS_DIR, 
  DOCUMENTS_TXT_DIR,
  DOCUMENTS_JSON_DIR,
  DOCUMENTS_OTHER_DIR,
  validateTextFileType, 
  MAX_TEXT_FILE_SIZE 
} = require('../config/storage');

// 파일 확장자에 따라 저장 디렉토리 결정
const getDestinationByFileType = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (['.txt', '.md'].includes(ext)) {
    return DOCUMENTS_TXT_DIR;
  } else if (ext === '.json') {
    return DOCUMENTS_JSON_DIR;
  } else {
    return DOCUMENTS_OTHER_DIR;
  }
};

// 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = getDestinationByFileType(file);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // 파일명 형식: {user_id}_{timestamp}_{random}.{extension}
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

// 파일 필터 (파일 타입 검증)
const fileFilter = (req, file, cb) => {
  if (!validateTextFileType(file.mimetype, file.originalname)) {
    const error = new Error('텍스트 파일만 업로드 가능합니다 (.txt, .md, .json, .csv, .log)');
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
};

// 단일 파일 업로드 설정
const singleUpload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_TEXT_FILE_SIZE
  },
  fileFilter: fileFilter
});

// 다중 파일 업로드 설정 (최대 10개)
const multipleUpload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_TEXT_FILE_SIZE,
    files: 10
  },
  fileFilter: fileFilter
}).array('documents', 10);

// 단일 파일 업로드 미들웨어
const uploadSingle = (req, res, next) => {
  singleUpload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: '파일 크기는 5MB 이하여야 합니다' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: '파일은 최대 10개까지 업로드 가능합니다' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      if (err.status === 400) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }
    
    next();
  });
};

// 다중 파일 업로드 미들웨어
const uploadMultiple = (req, res, next) => {
  multipleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: '파일 크기는 5MB 이하여야 합니다' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: '파일은 최대 10개까지 업로드 가능합니다' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      if (err.status === 400) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '파일을 선택해주세요' });
    }
    
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple
};

