/**
 * 분석 큐 서비스
 * 이미지 및 텍스트 문서의 분석 작업을 큐에 추가하고 순차적으로 처리합니다.
 * 
 * 큐 처리 방식:
 * - 단일 스레드 처리: 동시에 하나의 항목만 처리 (isProcessing 플래그로 제어)
 * - 주기적 처리: 3초마다 큐를 확인하여 항목 처리
 * - 상태 관리: pending → analyzing → completed/failed
 * 
 * 재시도 로직:
 * - analyzing 상태가 30분 이상 지속되면 재시도
 * - 서버 재시작 시 미완료 항목 자동 복구
 */

const Media = require('../models/Media');
const TextDocument = require('../models/TextDocument');
const visionService = require('./visionService');
const textAnalysisService = require('./textAnalysisService');
const logger = require('../utils/logger');

// 큐 처리 상태 플래그 (동시 처리 방지)
let isProcessing = false;
// 대기 중인 분석 항목 큐
let processingQueue = [];
// 큐 확인 간격 (밀리초)
const PROCESSING_INTERVAL = 3000; // 3초마다 큐 확인

/**
 * 큐에 항목 추가
 * @param {string|Object} item - mediaId 문자열 또는 { type: 'image'|'text', id: string } 객체
 * 
 * 호환성:
 * - 이전 버전 호환을 위해 문자열 형태도 지원
 * - 중복 항목은 큐에 추가하지 않음
 */
const addToQueue = (item) => {
  // 이전 버전 호환성: 문자열인 경우 이미지로 처리
  const queueItem = typeof item === 'string' 
    ? { type: 'image', id: item }
    : item;

  // 중복 확인
  const exists = processingQueue.some(
    q => q.type === queueItem.type && q.id === queueItem.id
  );

  if (!exists) {
    processingQueue.push(queueItem);
    console.log(`[분석 큐] 추가됨: ${queueItem.type} - ${queueItem.id}`);
  }
};

/**
 * 현재 처리 중인지 확인
 */
const isProcessingQueue = () => {
  return isProcessing;
};

/**
 * 큐에서 첫 번째 항목 제거
 */
const getNextFromQueue = () => {
  if (processingQueue.length === 0) {
    return null;
  }
  const item = processingQueue.shift();
  // 이전 버전 호환성: 문자열인 경우 객체로 변환
  return typeof item === 'string' ? { type: 'image', id: item } : item;
};

/**
 * 이미지 미디어 분석 처리
 * @param {string} mediaId - 분석할 미디어 ID
 * 
 * 처리 흐름:
 * 1. 미디어 존재 확인
 * 2. 상태 확인 및 검증:
 *    - completed: 스킵
 *    - analyzing: 30분 이상 지속 시 재시도, 그 외 스킵
 *    - pending/failed: 정상 처리
 * 3. 상태를 'analyzing'으로 변경 (동시 처리 방지)
 * 4. 파일 유효성 검사
 * 5. 이미지 분석 실행 (OpenAI Vision API 호출)
 * 6. 결과 저장 및 상태 업데이트
 * 
 * 에러 처리:
 * - 분석 실패 시 상태를 'failed'로 변경하고 에러 메시지 저장
 * - 미디어를 재조회하여 최신 상태 확인 후 업데이트 (낙관적 잠금 고려)
 */
const processImageMedia = async (mediaId) => {
  try {
    console.log(`[이미지 분석 시작] Media ID: ${mediaId}`);
    
    // 미디어 조회
    const media = await Media.findByPk(mediaId);
    
    if (!media) {
      console.error(`[분석 실패] Media ID ${mediaId}를 찾을 수 없습니다.`);
      return;
    }
    
    // 이미 완료된 경우 스킵 (중복 처리 방지)
    if (media.analysis_status === 'completed') {
      console.log(`[분석 스킵] Media ID ${mediaId}는 이미 완료되었습니다.`);
      return;
    }
    
    // analyzing 상태인 경우, 오래된 분석인지 확인 (30분 이상)
    // 장시간 분석 중인 경우 서버 재시작 등으로 인한 비정상 상태로 간주
    if (media.analysis_status === 'analyzing') {
      const now = new Date();
      const updatedAt = new Date(media.updated_at);
      const diffMinutes = (now - updatedAt) / (1000 * 60);
      
      // 30분 이상 analyzing 상태면 재시도 (타임아웃 처리)
      if (diffMinutes > 30) {
        console.log(`[분석 재시도] Media ID ${mediaId}가 ${Math.round(diffMinutes)}분 동안 analyzing 상태입니다. 재시도합니다.`);
        // 상태를 pending으로 변경하고 계속 진행
      } else {
        console.log(`[분석 스킵] Media ID ${mediaId}는 현재 처리 중입니다.`);
        return;
      }
    }
    
    // 상태를 'analyzing'으로 변경 (동시 처리 방지)
    await media.update({ 
      analysis_status: 'analyzing',
      analysis_error: null 
    });
    
    // 이미지 파일 유효성 검사 (파일 존재, 형식 확인)
    await visionService.validateImageFile(media.file_path);
    
    // 이미지 분석 실행 (OpenAI Vision API 호출)
    const analysisResult = await visionService.analyzeImage(media.file_path);
    
    // 분석 결과 저장 및 상태 업데이트
    await media.update({
      analysis_status: 'completed',
      analysis_result: analysisResult,
      analyzed_at: new Date(),
      analysis_error: null
    });
    
    console.log(`[분석 완료] Media ID: ${mediaId}`);
    
  } catch (error) {
    console.error(`[분석 실패] Media ID ${mediaId}:`, error.message);
    
    // 에러 발생 시 상태를 'failed'로 변경하고 에러 정보 저장
    // 미디어를 다시 조회하여 최신 상태 확인 (다른 프로세스에서 변경 가능성 고려)
    const media = await Media.findByPk(mediaId);
    if (media) {
      await media.update({
        analysis_status: 'failed',
        analysis_error: error.message,
        analyzed_at: new Date()
      });
    }
  }
};

/**
 * 텍스트 문서 분석 처리
 */
const processTextDocument = async (documentId) => {
  try {
    console.log(`[텍스트 분석 시작] Document ID: ${documentId}`);
    
    // 문서 조회
    const document = await TextDocument.findByPk(documentId);
    
    if (!document) {
      console.error(`[분석 실패] Document ID ${documentId}를 찾을 수 없습니다.`);
      return;
    }
    
    // 이미 완료된 경우 스킵
    if (document.analysis_status === 'completed') {
      console.log(`[분석 스킵] Document ID ${documentId}는 이미 완료되었습니다.`);
      return;
    }
    
    // analyzing 상태인 경우, 오래된 분석인지 확인 (30분 이상)
    if (document.analysis_status === 'analyzing') {
      const now = new Date();
      const updatedAt = new Date(document.updated_at);
      const diffMinutes = (now - updatedAt) / (1000 * 60);
      
      // 30분 이상 analyzing 상태면 재시도
      if (diffMinutes > 30) {
        console.log(`[분석 재시도] Document ID ${documentId}가 ${Math.round(diffMinutes)}분 동안 analyzing 상태입니다. 재시도합니다.`);
      } else {
        console.log(`[분석 스킵] Document ID ${documentId}는 현재 처리 중입니다.`);
        return;
      }
    }
    
    // 상태를 'analyzing'으로 변경
    await document.update({ 
      analysis_status: 'analyzing',
      analysis_error: null 
    });
    
    // 텍스트 분석 실행
    const analysisResult = await textAnalysisService.analyzeTextDocument(
      document.content,
      document.document_type
    );
    
    // 결과 저장
    await document.update({
      analysis_status: 'completed',
      analysis_result: analysisResult,
      analyzed_at: new Date(),
      analysis_error: null
    });
    
    console.log(`[분석 완료] Document ID: ${documentId}`);
    
  } catch (error) {
    console.error(`[분석 실패] Document ID ${documentId}:`, error.message);
    
    // 문서를 다시 조회하여 에러 정보 업데이트
    const document = await TextDocument.findByPk(documentId);
    if (document) {
      await document.update({
        analysis_status: 'failed',
        analysis_error: error.message,
        analyzed_at: new Date()
      });
    }
  }
};

/**
 * 단일 항목 분석 처리 (이미지 또는 텍스트)
 */
const processItem = async (queueItem) => {
  if (queueItem.type === 'text') {
    await processTextDocument(queueItem.id);
  } else {
    // 기본값 또는 이전 버전 호환성: 이미지로 처리
    await processImageMedia(queueItem.id);
  }
};

/**
 * 큐 처리 메인 함수
 * 
 * 처리 로직:
 * 1. isProcessing 플래그 확인 (동시 처리 방지)
 * 2. 큐가 비어있으면 종료
 * 3. 큐에서 다음 항목 추출 (FIFO 방식)
 * 4. 항목 타입에 따라 이미지 또는 텍스트 분석 실행
 * 5. finally 블록에서 isProcessing 플래그 해제 (에러 발생 시에도 보장)
 * 
 * 동시성 제어:
 * - isProcessing 플래그로 동시 실행 방지
 * - 하나의 항목 처리 완료 후 다음 항목 처리
 * - setInterval로 주기적으로 호출하여 지속적인 처리 보장
 */
const processQueue = async () => {
  // 이미 처리 중이면 스킵 (동시 처리 방지)
  if (isProcessing) {
    console.log('[큐 처리] 현재 처리 중이므로 스킵');
    return;
  }
  
  // 큐가 비어있으면 종료
  if (processingQueue.length === 0) {
    // 큐가 비어있을 때는 로그를 출력하지 않음 (너무 많이 출력됨)
    return;
  }
  
  console.log(`[큐 처리] 큐 확인 - 큐 길이: ${processingQueue.length}, 처리 중: ${isProcessing}`);
  isProcessing = true;
  
  try {
    // 큐에서 다음 항목 추출 (FIFO: First In First Out)
    const queueItem = getNextFromQueue();
    
    if (queueItem) {
      const itemType = queueItem.type || 'image';
      const itemId = queueItem.id;
      console.log(`[큐 처리] ${itemType} - ${itemId} 처리 시작 (남은 큐 길이: ${processingQueue.length})`);
      // 항목 타입에 따라 이미지 또는 텍스트 분석 실행
      await processItem(queueItem);
    } else {
      console.log('[큐 처리] 큐에서 항목을 가져올 수 없습니다.');
    }
  } catch (error) {
    console.error('[큐 처리 에러]:', error);
    console.error('[큐 처리 에러 스택]:', error.stack);
  } finally {
    // 에러 발생 여부와 관계없이 플래그 해제 (다음 처리 보장)
    isProcessing = false;
    console.log(`[큐 처리] 처리 완료, isProcessing: ${isProcessing}`);
  }
};

/**
 * 큐 처리 시작
 */
const startProcessing = () => {
  logger.debug('분석 큐 백그라운드 처리 시작', {
    interval: `${PROCESSING_INTERVAL}ms (${PROCESSING_INTERVAL / 1000}초)`,
    queueLength: processingQueue.length
  });
  
  // 즉시 한 번 처리 시도 (비동기로 실행)
  setTimeout(() => {
    processQueue().catch(err => {
      logger.error('분석 큐 즉시 처리 시도 중 에러', { error: err.message });
    });
  }, 1000);
  
  // 이후 주기적으로 처리
  setInterval(async () => {
    await processQueue();
  }, PROCESSING_INTERVAL);
};

/**
 * 대기 중인 모든 미디어와 문서를 큐에 추가
 * 서버 시작 시 미완료 항목들을 복구할 때 사용
 */
const restorePendingItems = async () => {
  try {
    // 미완료 이미지 미디어 조회
    const pendingMedias = await Media.findAll({
      where: {
        analysis_status: ['pending', 'analyzing']
      }
    });
    
    // 미완료 텍스트 문서 조회
    const pendingDocuments = await TextDocument.findAll({
      where: {
        analysis_status: ['pending', 'analyzing']
      }
    });
    
    const totalPending = pendingMedias.length + pendingDocuments.length;
    logger.debug(`분석 큐 미완료 항목 발견`, {
      total: totalPending,
      images: pendingMedias.length,
      texts: pendingDocuments.length
    });
    
    if (totalPending === 0) {
      logger.debug('분석 큐 복구할 항목이 없습니다.');
      return;
    }
    
    // 이미지 미디어 복구
    for (const media of pendingMedias) {
      // analyzing 상태를 pending으로 복구
      if (media.analysis_status === 'analyzing') {
        logger.debug(`Media ID ${media.id}의 상태를 analyzing에서 pending으로 복구`);
        await media.update({ analysis_status: 'pending' });
      }
      addToQueue({ type: 'image', id: media.id });
    }
    
    // 텍스트 문서 복구
    for (const document of pendingDocuments) {
      // analyzing 상태를 pending으로 복구
      if (document.analysis_status === 'analyzing') {
        logger.debug(`Document ID ${document.id}의 상태를 analyzing에서 pending으로 복구`);
        await document.update({ analysis_status: 'pending' });
      }
      addToQueue({ type: 'text', id: document.id });
    }
    
    logger.debug(`분석 큐 미완료 항목 ${totalPending}개를 큐에 추가했습니다.`, {
      queueLength: processingQueue.length
    });
  } catch (error) {
    logger.error('분석 큐 복구 에러', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * 큐 상태 확인
 */
const getQueueStatus = () => {
  return {
    queueLength: processingQueue.length,
    isProcessing: isProcessing,
    queue: processingQueue
  };
};

module.exports = {
  addToQueue,
  processQueue,
  isProcessingQueue,
  startProcessing,
  restorePendingItems,
  getQueueStatus
};


