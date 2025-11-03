const fs = require('fs');
const path = require('path');

/**
 * 텍스트 파일을 읽고 파싱
 */
const parseTextFile = async (filePath, fileType) => {
  try {
    let content = '';
    const ext = path.extname(filePath).toLowerCase();

    // 파일 읽기 (UTF-8 인코딩)
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    switch (ext) {
      case '.txt':
      case '.md':
      case '.log':
        // 일반 텍스트 파일: 그대로 읽기
        content = rawContent;
        break;

      case '.json':
        // JSON 파일: 파싱 후 예쁘게 포맷팅
        try {
          const jsonData = JSON.parse(rawContent);
          content = JSON.stringify(jsonData, null, 2); // 들여쓰기로 포맷팅
        } catch (jsonError) {
          // JSON 파싱 실패 시 원본 그대로 반환
          content = rawContent;
          console.warn('JSON 파싱 실패, 원본 텍스트로 저장:', jsonError.message);
        }
        break;

      case '.csv':
        // CSV 파일: 읽기 쉬운 형태로 변환
        content = rawContent; // CSV는 텍스트 그대로 저장
        break;

      default:
        content = rawContent;
    }

    return content;
  } catch (error) {
    console.error('파일 파싱 오류:', error);
    throw new Error(`파일을 읽는 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * 메타데이터 추출
 */
const extractMetadata = (content, fileType) => {
  try {
    // 문자 수 (공백 포함)
    const charCount = content.length;

    // 단어 수 (공백으로 분리)
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // 줄 수
    const lineCount = content.split('\n').length;

    // 키워드 추출 (간단한 빈도 분석)
    // 빈도가 높은 단어들을 추출 (최소 2글자 이상, 특수문자 제외)
    const wordFrequency = {};
    words.forEach(word => {
      // 특수문자 제거
      const cleanWord = word.toLowerCase().replace(/[^\w가-힣]/g, '');
      if (cleanWord.length >= 2) {
        wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
      }
    });

    // 빈도가 높은 상위 10개 키워드 추출
    const keywords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return {
      charCount,
      wordCount,
      lineCount,
      keywords
    };
  } catch (error) {
    console.error('메타데이터 추출 오류:', error);
    return {
      charCount: content.length,
      wordCount: 0,
      lineCount: 0,
      keywords: []
    };
  }
};

/**
 * 문서 유형 추정
 */
const detectDocumentType = (content, fileName) => {
  const lowerContent = content.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // 일기 감지
  if (
    lowerContent.includes('일기') ||
    lowerContent.includes('오늘') ||
    lowerContent.includes('오늘은') ||
    lowerContent.includes('오늘의') ||
    lowerFileName.includes('diary') ||
    lowerFileName.includes('일기')
  ) {
    return 'diary';
  }

  // 메모/노트 감지
  if (
    lowerContent.includes('메모') ||
    lowerContent.includes('노트') ||
    lowerContent.includes('note') ||
    lowerFileName.includes('memo') ||
    lowerFileName.includes('note') ||
    lowerFileName.includes('메모') ||
    lowerFileName.includes('노트')
  ) {
    return 'note';
  }

  // JSON 파일 감지
  if (fileName.toLowerCase().endsWith('.json')) {
    return 'json';
  }

  // 기타
  return 'other';
};

/**
 * 텍스트 파일 파싱 및 메타데이터 추출 (통합 함수)
 */
const parseAndExtract = async (filePath, fileName) => {
  try {
    // 파일 파싱
    const fileType = path.extname(fileName).toLowerCase();
    const content = await parseTextFile(filePath, fileType);

    // 메타데이터 추출
    const metadata = extractMetadata(content, fileType);

    // 문서 유형 추정
    const documentType = detectDocumentType(content, fileName);

    return {
      content,
      metadata,
      documentType
    };
  } catch (error) {
    console.error('파싱 및 추출 오류:', error);
    throw error;
  }
};

module.exports = {
  parseTextFile,
  extractMetadata,
  detectDocumentType,
  parseAndExtract
};

