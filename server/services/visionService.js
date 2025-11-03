const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');

// OpenAI 클라이언트를 지연 초기화
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
};

/**
 * 이미지를 base64로 인코딩
 */
const encodeImage = async (imagePath) => {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    return base64Image;
  } catch (error) {
    console.error('이미지 인코딩 에러:', error);
    throw new Error('이미지를 읽을 수 없습니다.');
  }
};

/**
 * 이미지를 분석하는 함수
 * @param {string} imagePath - 분석할 이미지의 파일 경로
 * @returns {Promise<Object>} 분석 결과 객체
 */
const analyzeImage = async (imagePath) => {
  try {
    // 이미지 존재 확인
    await fs.access(imagePath);
    
    // 이미지를 base64로 인코딩
    const base64Image = await encodeImage(imagePath);
    
    // 분석 프롬프트
    const prompt = `이 이미지를 자세히 분석해주세요. 다음 관점에서 분석해주세요:

1. 주요 내용 및 장면:
   - 이미지에 무엇이 있는지
   - 어떤 활동이나 상황인지

2. 감정 및 분위기:
   - 이미지가 전달하는 감정
   - 전반적인 분위기

3. 추론 가능한 사용자 정보:
   - 관심사나 취미
   - 생활 방식이나 성향
   - 가치관이나 선호도

4. 키워드 추출:
   - 이미지를 대표하는 5-10개 키워드

JSON 형식으로 응답해주세요:
{
  "description": "이미지 설명",
  "mood": "분위기",
  "inferred_interests": ["관심사1", "관심사2", ...],
  "keywords": ["키워드1", "키워드2", ...],
  "additional_insights": "추가 인사이트"
}`;

    // 재시도 로직
    let maxRetries = 3;
    let attempt = 0;
    let completion;

    while (attempt < maxRetries) {
      try {
        const client = getOpenAIClient();
        completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        break; // 성공 시 루프 종료
      } catch (error) {
        attempt++;
        console.error(`Vision API 호출 실패 (${attempt}/${maxRetries}):`, error.message);
        
        if (attempt >= maxRetries) {
          throw new Error('이미지 분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;
    
    // JSON 추출 시도
    let parsedResponse;
    try {
      // JSON 코드 블록 제거하고 파싱
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) || rawResponse.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON 파싱 에러:', parseError);
      console.error('원본 응답:', rawResponse);
      
      // 파싱 실패 시 기본 구조로 반환
      parsedResponse = {
        description: rawResponse || '이미지 설명을 가져올 수 없습니다.',
        mood: '분위기를 파악할 수 없습니다.',
        inferred_interests: [],
        keywords: [],
        additional_insights: '상세 분석을 가져올 수 없습니다.'
      };
    }

    // 검증 및 정규화
    return {
      description: parsedResponse.description || '이미지 설명을 가져올 수 없습니다.',
      mood: parsedResponse.mood || '분위기를 파악할 수 없습니다.',
      inferred_interests: Array.isArray(parsedResponse.inferred_interests) 
        ? parsedResponse.inferred_interests 
        : [],
      keywords: Array.isArray(parsedResponse.keywords) 
        ? parsedResponse.keywords 
        : [],
      additional_insights: parsedResponse.additional_insights || '추가 인사이트를 제공할 수 없습니다.'
    };
  } catch (error) {
    console.error('이미지 분석 에러:', error);
    
    // 구체적인 에러 메시지 반환
    if (error.message.includes('ENOENT')) {
      throw new Error('이미지 파일을 찾을 수 없습니다.');
    } else if (error.message.includes('rate limit')) {
      throw new Error('API 호출 제한에 도달했습니다. 잠시 후 다시 시도해주세요.');
    } else if (error.message.includes('quota')) {
      throw new Error('API 사용량 할당량을 초과했습니다.');
    } else if (error.message.includes('timeout')) {
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    } else {
      throw error;
    }
  }
};

/**
 * 이미지 파일 유효성 검사
 */
const validateImageFile = async (imagePath) => {
  try {
    const stats = await fs.stat(imagePath);
    
    // 파일 크기 확인 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error('파일 크기가 너무 큽니다. (최대 10MB)');
    }
    
    // 파일 확장자 확인
    const ext = path.extname(imagePath).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      throw new Error('지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp만 지원)');
    }
    
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('이미지 파일을 찾을 수 없습니다.');
    }
    throw error;
  }
};

module.exports = {
  analyzeImage,
  validateImageFile,
  encodeImage
};


