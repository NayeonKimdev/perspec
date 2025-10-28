const path = require('path');
const fs = require('fs');

// 파일 저장 경로 설정
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const IMAGES_DIR = path.join(__dirname, '../uploads/images');
const TEMP_DIR = path.join(__dirname, '../uploads/temp');

// 허용된 파일 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// 디렉토리 생성 함수
const ensureDirectoriesExist = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

// MIME 타입 확인
const isAllowedMimeType = (mimetype) => {
  return ALLOWED_MIME_TYPES.includes(mimetype);
};

// 확장자 확인
const isAllowedExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
};

// 파일 타입 검증
const validateFileType = (mimetype, filename) => {
  return isAllowedMimeType(mimetype) && isAllowedExtension(filename);
};

// 파일 크기 검증
const validateFileSize = (size) => {
  return size <= MAX_FILE_SIZE;
};

module.exports = {
  UPLOAD_DIR,
  IMAGES_DIR,
  TEMP_DIR,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  ensureDirectoriesExist,
  isAllowedMimeType,
  isAllowedExtension,
  validateFileType,
  validateFileSize
};

