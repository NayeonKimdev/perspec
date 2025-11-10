/**
 * 이미지 최적화 서비스
 * 업로드된 이미지를 리사이징 및 압축하여 저장 공간 절약 및 전송 속도 향상
 * 
 * 기능:
 * - 이미지 리사이징 (최대 크기 제한)
 * - 이미지 압축 (품질 최적화)
 * - WebP 포맷 변환 (선택사항)
 * - 원본 이미지 보존 옵션
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

// 이미지 최적화 설정
const OPTIMIZATION_CONFIG = {
  // 최대 이미지 크기 (너비 또는 높이)
  maxWidth: parseInt(process.env.MAX_IMAGE_WIDTH || '1920', 10),
  maxHeight: parseInt(process.env.MAX_IMAGE_HEIGHT || '1080', 10),
  
  // JPEG 품질 (1-100, 낮을수록 작은 파일)
  jpegQuality: parseInt(process.env.JPEG_QUALITY || '85', 10),
  
  // PNG 품질 (compressionLevel: 0-9, 높을수록 더 압축)
  pngCompressionLevel: parseInt(process.env.PNG_COMPRESSION_LEVEL || '6', 10),
  
  // WebP 품질 (1-100)
  webpQuality: parseInt(process.env.WEBP_QUALITY || '80', 10),
  
  // WebP 변환 사용 여부 (기본값: false)
  convertToWebP: process.env.CONVERT_TO_WEBP === 'true',
  
  // 원본 이미지 보존 여부 (기본값: false)
  keepOriginal: process.env.KEEP_ORIGINAL_IMAGE === 'true'
};

/**
 * 이미지 최적화 함수
 * @param {string} inputPath - 원본 이미지 경로
 * @param {string} outputPath - 최적화된 이미지 저장 경로 (선택사항, 지정하지 않으면 원본 덮어쓰기)
 * @param {Object} options - 추가 옵션
 * @returns {Promise<Object>} 최적화 결과 정보 (원본 크기, 최적화 후 크기, 압축률 등)
 */
const optimizeImage = async (inputPath, outputPath = null, options = {}) => {
  try {
    const finalOutputPath = outputPath || inputPath;
    
    // 원본 파일 크기 확인
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;
    
    // 이미지 메타데이터 읽기
    const metadata = await sharp(inputPath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // Sharp 인스턴스 생성
    let image = sharp(inputPath);
    
    // 리사이징 (비율 유지)
    const shouldResize = originalWidth > OPTIMIZATION_CONFIG.maxWidth || 
                        originalHeight > OPTIMIZATION_CONFIG.maxHeight;
    
    if (shouldResize) {
      image = image.resize(
        OPTIMIZATION_CONFIG.maxWidth,
        OPTIMIZATION_CONFIG.maxHeight,
        {
          fit: 'inside', // 비율 유지하면서 지정된 크기 내에 맞춤
          withoutEnlargement: true // 작은 이미지는 확대하지 않음
        }
      );
    }
    
    // 포맷별 최적화 처리
    const format = metadata.format;
    let optimizedImage = image;
    
    if (OPTIMIZATION_CONFIG.convertToWebP) {
      // WebP로 변환
      optimizedImage = optimizedImage.webp({ 
        quality: OPTIMIZATION_CONFIG.webpQuality 
      });
      // 확장자 변경
      const ext = path.extname(finalOutputPath);
      const webpPath = finalOutputPath.replace(ext, '.webp');
      await optimizedImage.toFile(webpPath);
      
      // 최적화된 파일 크기 확인
      const optimizedStats = await fs.stat(webpPath);
      const optimizedSize = optimizedStats.size;
      
      return {
        originalPath: inputPath,
        optimizedPath: webpPath,
        originalSize,
        optimizedSize,
        compressionRatio: ((1 - optimizedSize / originalSize) * 100).toFixed(2),
        format: 'webp',
        dimensions: {
          original: { width: originalWidth, height: originalHeight },
          optimized: await sharp(webpPath).metadata().then(m => ({ 
            width: m.width, 
            height: m.height 
          }))
        }
      };
    } else {
      // 원본 포맷 유지하며 최적화
      switch (format) {
        case 'jpeg':
        case 'jpg':
          optimizedImage = optimizedImage.jpeg({ 
            quality: OPTIMIZATION_CONFIG.jpegQuality,
            progressive: true // 점진적 JPEG (저해상도에서 점차 선명해짐)
          });
          break;
        case 'png':
          optimizedImage = optimizedImage.png({ 
            compressionLevel: OPTIMIZATION_CONFIG.pngCompressionLevel,
            adaptiveFiltering: true // 적응형 필터링
          });
          break;
        case 'webp':
          optimizedImage = optimizedImage.webp({ 
            quality: OPTIMIZATION_CONFIG.webpQuality 
          });
          break;
        case 'gif':
          // GIF는 리사이징만 수행 (압축은 손실 발생 가능)
          break;
        default:
          logger.warn(`지원하지 않는 이미지 포맷: ${format}`);
          // 원본 그대로 복사
          await fs.copyFile(inputPath, finalOutputPath);
          return {
            originalPath: inputPath,
            optimizedPath: finalOutputPath,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
            format: format,
            dimensions: {
              original: { width: originalWidth, height: originalHeight },
              optimized: { width: originalWidth, height: originalHeight }
            }
          };
      }
      
      // 최적화된 이미지 저장
      await optimizedImage.toFile(finalOutputPath);
      
      // 최적화된 파일 크기 확인
      const optimizedStats = await fs.stat(finalOutputPath);
      const optimizedSize = optimizedStats.size;
      
      return {
        originalPath: inputPath,
        optimizedPath: finalOutputPath,
        originalSize,
        optimizedSize,
        compressionRatio: ((1 - optimizedSize / originalSize) * 100).toFixed(2),
        format: format,
        dimensions: {
          original: { width: originalWidth, height: originalHeight },
          optimized: await sharp(finalOutputPath).metadata().then(m => ({ 
            width: m.width, 
            height: m.height 
          }))
        }
      };
    }
  } catch (error) {
    logger.error('이미지 최적화 실패', {
      error: error.message,
      inputPath,
      outputPath
    });
    throw new Error(`이미지 최적화 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 이미지 최적화 (원본 보존)
 * 원본 이미지를 보존하고 최적화된 버전을 별도 파일로 저장
 * @param {string} inputPath - 원본 이미지 경로
 * @returns {Promise<Object>} 최적화 결과 정보
 */
const optimizeImageWithOriginal = async (inputPath) => {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  
  // 원본 파일명에 _original 접미사 추가
  const originalPath = path.join(dir, `${basename}_original${ext}`);
  
  // 원본 파일 이동
  await fs.rename(inputPath, originalPath);
  
  // 최적화된 이미지 저장 (원본 파일명 사용)
  const result = await optimizeImage(originalPath, inputPath);
  
  return {
    ...result,
    originalPath: originalPath,
    optimizedPath: inputPath
  };
};

/**
 * 이미지 최적화 (원본 덮어쓰기)
 * 원본 이미지를 최적화된 버전으로 대체
 * @param {string} inputPath - 원본 이미지 경로
 * @returns {Promise<Object>} 최적화 결과 정보
 */
const optimizeImageInPlace = async (inputPath) => {
  return await optimizeImage(inputPath, inputPath);
};

module.exports = {
  optimizeImage,
  optimizeImageWithOriginal,
  optimizeImageInPlace,
  OPTIMIZATION_CONFIG
};

