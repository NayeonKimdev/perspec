const Media = require('../models/Media');
const visionService = require('./visionService');

let isProcessing = false;
let processingQueue = [];
const PROCESSING_INTERVAL = 3000; // 3초마다 큐 확인

/**
 * 큐에 미디어 ID 추가
 */
const addToQueue = (mediaId) => {
  if (!processingQueue.includes(mediaId)) {
    processingQueue.push(mediaId);
    console.log(`[분석 큐] 추가됨: ${mediaId}`);
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
  return processingQueue.shift();
};

/**
 * 단일 미디어 분석 처리
 */
const processMedia = async (mediaId) => {
  try {
    console.log(`[분석 시작] Media ID: ${mediaId}`);
    
    // 미디어 조회
    const media = await Media.findByPk(mediaId);
    
    if (!media) {
      console.error(`[분석 실패] Media ID ${mediaId}를 찾을 수 없습니다.`);
      return;
    }
    
    // 이미 완료된 경우 스킵
    if (media.analysis_status === 'completed') {
      console.log(`[분석 스킵] Media ID ${mediaId}는 이미 완료되었습니다.`);
      return;
    }
    
    // analyzing 상태인 경우, 오래된 분석인지 확인 (30분 이상)
    if (media.analysis_status === 'analyzing') {
      const now = new Date();
      const updatedAt = new Date(media.updated_at);
      const diffMinutes = (now - updatedAt) / (1000 * 60);
      
      // 30분 이상 analyzing 상태면 재시도
      if (diffMinutes > 30) {
        console.log(`[분석 재시도] Media ID ${mediaId}가 ${Math.round(diffMinutes)}분 동안 analyzing 상태입니다. 재시도합니다.`);
        // 상태를 pending으로 변경하고 계속 진행
      } else {
        console.log(`[분석 스킵] Media ID ${mediaId}는 현재 처리 중입니다.`);
        return;
      }
    }
    
    // 상태를 'analyzing'으로 변경
    await media.update({ 
      analysis_status: 'analyzing',
      analysis_error: null 
    });
    
    // 이미지 파일 유효성 검사
    await visionService.validateImageFile(media.file_path);
    
    // 이미지 분석 실행
    const analysisResult = await visionService.analyzeImage(media.file_path);
    
    // 결과 저장
    await media.update({
      analysis_status: 'completed',
      analysis_result: analysisResult,
      analyzed_at: new Date(),
      analysis_error: null
    });
    
    console.log(`[분석 완료] Media ID: ${mediaId}`);
    
  } catch (error) {
    console.error(`[분석 실패] Media ID ${mediaId}:`, error.message);
    
    // 미디어를 다시 조회하여 에러 정보 업데이트
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
 * 큐 처리
 */
const processQueue = async () => {
  if (isProcessing) {
    console.log('[큐 처리] 현재 처리 중이므로 스킵');
    return;
  }
  
  if (processingQueue.length === 0) {
    // 큐가 비어있을 때는 로그를 출력하지 않음 (너무 많이 출력됨)
    return;
  }
  
  console.log(`[큐 처리] 큐 확인 - 큐 길이: ${processingQueue.length}, 처리 중: ${isProcessing}`);
  isProcessing = true;
  
  try {
    const mediaId = getNextFromQueue();
    
    if (mediaId) {
      console.log(`[큐 처리] Media ID ${mediaId} 처리 시작 (남은 큐 길이: ${processingQueue.length})`);
      await processMedia(mediaId);
    } else {
      console.log('[큐 처리] 큐에서 항목을 가져올 수 없습니다.');
    }
  } catch (error) {
    console.error('[큐 처리 에러]:', error);
    console.error('[큐 처리 에러 스택]:', error.stack);
  } finally {
    isProcessing = false;
    console.log(`[큐 처리] 처리 완료, isProcessing: ${isProcessing}`);
  }
};

/**
 * 큐 처리 시작
 */
const startProcessing = () => {
  console.log('[분석 큐] 백그라운드 처리를 시작합니다.');
  console.log(`[분석 큐] 처리 간격: ${PROCESSING_INTERVAL}ms (${PROCESSING_INTERVAL / 1000}초)`);
  console.log(`[분석 큐] 현재 큐 길이: ${processingQueue.length}`);
  
  // 즉시 한 번 처리 시도 (비동기로 실행)
  setTimeout(() => {
    processQueue().catch(err => {
      console.error('[분석 큐] 즉시 처리 시도 중 에러:', err);
    });
  }, 1000);
  
  // 이후 주기적으로 처리
  setInterval(async () => {
    await processQueue();
  }, PROCESSING_INTERVAL);
};

/**
 * 대기 중인 모든 미디어를 큐에 추가
 * 서버 시작 시 미완료 항목들을 복구할 때 사용
 */
const restorePendingItems = async () => {
  try {
    const pendingMedias = await Media.findAll({
      where: {
        analysis_status: ['pending', 'analyzing']
      }
    });
    
    console.log(`[분석 큐] ${pendingMedias.length}개의 미완료 항목 발견`);
    
    if (pendingMedias.length === 0) {
      console.log('[분석 큐] 복구할 항목이 없습니다.');
      return;
    }
    
    for (const media of pendingMedias) {
      // analyzing 상태를 pending으로 복구
      if (media.analysis_status === 'analyzing') {
        console.log(`[분석 큐] Media ID ${media.id}의 상태를 analyzing에서 pending으로 복구`);
        await media.update({ analysis_status: 'pending' });
      }
      addToQueue(media.id);
    }
    
    console.log(`[분석 큐] 미완료 항목 ${pendingMedias.length}개를 큐에 추가했습니다.`);
    console.log(`[분석 큐] 현재 큐 길이: ${processingQueue.length}`);
  } catch (error) {
    console.error('[분석 큐 복구 에러]:', error);
    console.error('[분석 큐 복구 에러 스택]:', error.stack);
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


