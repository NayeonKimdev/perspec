/**
 * AWS S3 스토리지 연동
 * 프로덕션 환경에서 파일을 S3에 저장
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getS3SignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

let s3Client = null;
let useS3 = false;
let bucketName = null;

/**
 * S3 클라이언트 초기화
 */
const initS3Client = () => {
  if (!s3Client && process.env.AWS_S3_BUCKET) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
    });
    useS3 = true;
    bucketName = process.env.AWS_S3_BUCKET;
    console.log(`✅ S3 스토리지 초기화 완료: ${bucketName}`);
  }
  return s3Client;
};

/**
 * S3 사용 여부 확인
 */
const isS3Enabled = () => {
  return useS3 && !!s3Client && !!bucketName;
};

/**
 * 파일을 S3에 업로드
 * @param {string} localPath - 로컬 파일 경로
 * @param {string} s3Key - S3 객체 키 (경로)
 * @param {string} contentType - MIME 타입
 * @returns {Promise<string>} S3 객체 URL
 */
const uploadToS3 = async (localPath, s3Key, contentType = 'application/octet-stream') => {
  if (!isS3Enabled()) {
    throw new Error('S3가 활성화되지 않았습니다.');
  }

  try {
    const fileContent = await fs.readFile(localPath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      // 메타데이터 추가 (선택사항)
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    
    // S3 객체 URL 반환
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${s3Key}`;
    return url;
  } catch (error) {
    console.error(`S3 업로드 실패: ${error.message}`);
    throw error;
  }
};

/**
 * S3에서 파일 다운로드
 * @param {string} s3Key - S3 객체 키
 * @param {string} localPath - 저장할 로컬 경로
 */
const downloadFromS3 = async (s3Key, localPath) => {
  if (!isS3Enabled()) {
    throw new Error('S3가 활성화되지 않았습니다.');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    await fs.writeFile(localPath, buffer);
    
    return localPath;
  } catch (error) {
    console.error(`S3 다운로드 실패: ${error.message}`);
    throw error;
  }
};

/**
 * S3에서 파일 삭제
 * @param {string} s3Key - S3 객체 키
 */
const deleteFromS3 = async (s3Key) => {
  if (!isS3Enabled()) {
    throw new Error('S3가 활성화되지 않았습니다.');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`S3 삭제 실패: ${error.message}`);
    throw error;
  }
};

/**
 * S3 파일 존재 여부 확인
 * @param {string} s3Key - S3 객체 키
 * @returns {Promise<boolean>}
 */
const existsInS3 = async (s3Key) => {
  if (!isS3Enabled()) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * S3에 파일 업로드 (로컬 파일 삭제 옵션)
 * @param {string} localPath - 로컬 파일 경로
 * @param {string} category - 파일 카테고리 (images, documents, temp)
 * @param {string} filename - 파일명
 * @param {string} contentType - MIME 타입
 * @param {boolean} deleteLocal - 업로드 후 로컬 파일 삭제 여부
 * @returns {Promise<{url: string, s3Key: string}>}
 */
const uploadFile = async (localPath, category, filename, contentType, deleteLocal = true) => {
  if (!isS3Enabled()) {
    // S3가 비활성화된 경우 로컬 경로 반환
    return {
      url: localPath,
      s3Key: null,
      local: true,
    };
  }

  // S3 키 생성 (카테고리/년/월/파일명)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sanitizedFilename = path.basename(filename);
  const s3Key = `${category}/${year}/${month}/${sanitizedFilename}`;

  try {
    const url = await uploadToS3(localPath, s3Key, contentType);
    
    // 업로드 성공 후 로컬 파일 삭제
    if (deleteLocal) {
      try {
        await fs.unlink(localPath);
      } catch (error) {
        console.warn(`로컬 파일 삭제 실패 (무시): ${error.message}`);
      }
    }
    
    return {
      url,
      s3Key,
      local: false,
    };
  } catch (error) {
    console.error(`파일 업로드 실패: ${error.message}`);
    // 업로드 실패 시 로컬 경로 반환
    return {
      url: localPath,
      s3Key: null,
      local: true,
      error: error.message,
    };
  }
};

/**
 * S3에서 서명된 URL 생성 (임시 접근용)
 * @param {string} s3Key - S3 객체 키
 * @param {number} expiresIn - 만료 시간 (초, 기본 1시간)
 * @returns {Promise<string>} 서명된 URL
 */
const getSignedUrl = async (s3Key, expiresIn = 3600) => {
  if (!isS3Enabled()) {
    throw new Error('S3가 활성화되지 않았습니다.');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const url = await getS3SignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`서명된 URL 생성 실패: ${error.message}`);
    throw error;
  }
};

// 초기화
initS3Client();

module.exports = {
  isS3Enabled,
  uploadToS3,
  downloadFromS3,
  deleteFromS3,
  existsInS3,
  uploadFile,
  getSignedUrl,
  initS3Client,
};

