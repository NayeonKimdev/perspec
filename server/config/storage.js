const path = require('path');
const fs = require('fs');

// 파일 저장 경로 설정
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const IMAGES_DIR = path.join(__dirname, '../uploads/images');
const TEMP_DIR = path.join(__dirname, '../uploads/temp');
const DOCUMENTS_DIR = path.join(__dirname, '../uploads/documents');
const DOCUMENTS_TXT_DIR = path.join(__dirname, '../uploads/documents/txt');
const DOCUMENTS_JSON_DIR = path.join(__dirname, '../uploads/documents/json');
const DOCUMENTS_OTHER_DIR = path.join(__dirname, '../uploads/documents/other');

// 허용된 이미지 파일 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 허용된 텍스트 파일 타입
const ALLOWED_TEXT_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'text/x-log'
];

const ALLOWED_TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.csv', '.log'];

// 최대 파일 크기
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes (텍스트 파일용)

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
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCUMENTS_TXT_DIR)) {
    fs.mkdirSync(DOCUMENTS_TXT_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCUMENTS_JSON_DIR)) {
    fs.mkdirSync(DOCUMENTS_JSON_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCUMENTS_OTHER_DIR)) {
    fs.mkdirSync(DOCUMENTS_OTHER_DIR, { recursive: true });
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

// 텍스트 파일 MIME 타입 확인
const isAllowedTextMimeType = (mimetype) => {
  return ALLOWED_TEXT_MIME_TYPES.includes(mimetype);
};

// 텍스트 파일 확장자 확인
const isAllowedTextExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_TEXT_EXTENSIONS.includes(ext);
};

// 텍스트 파일 타입 검증
const validateTextFileType = (mimetype, filename) => {
  return isAllowedTextMimeType(mimetype) && isAllowedTextExtension(filename);
};

// 텍스트 파일 크기 검증
const validateTextFileSize = (size) => {
  return size <= MAX_TEXT_FILE_SIZE;
};

// 파일명 sanitization (안전한 파일명으로 변환)
const sanitizeFilename = (filename) => {
  // 위험한 문자 제거 및 허용된 문자만 유지
  let sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 영문, 숫자, 점, 언더스코어, 하이픈만 허용
    .replace(/\.\./g, '_') // 경로 탐색 공격 방지
    .replace(/^\.+/, '') // 선행 점 제거
    .replace(/\.+$/, ''); // 후행 점 제거
  
  // 파일명이 너무 길면 자르기
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized || 'file';
};

module.exports = {
  UPLOAD_DIR,
  IMAGES_DIR,
  TEMP_DIR,
  DOCUMENTS_DIR,
  DOCUMENTS_TXT_DIR,
  DOCUMENTS_JSON_DIR,
  DOCUMENTS_OTHER_DIR,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  ALLOWED_TEXT_MIME_TYPES,
  ALLOWED_TEXT_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_TEXT_FILE_SIZE,
  ensureDirectoriesExist,
  isAllowedMimeType,
  isAllowedExtension,
  isAllowedTextMimeType,
  isAllowedTextExtension,
  validateFileType,
  validateFileSize,
  validateTextFileType,
  validateTextFileSize,
  sanitizeFilename
};

