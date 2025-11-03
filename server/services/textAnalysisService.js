const { OpenAI } = require('openai');

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
 * 일기 분석 프롬프트 생성
 */
const generateDiaryPrompt = (content) => {
  return `다음은 사용자가 작성한 일기입니다. 이 일기를 분석해주세요.

[일기 내용]

${content}

다음을 분석해주세요:

1. 주요 감정: 기쁨, 슬픔, 분노, 불안, 평온 등
2. 주요 사건 및 활동
3. 관계 (가족, 친구, 동료 등)
4. 관심사 및 가치관
5. 심리 상태 및 고민

JSON 형식으로 응답해주세요:

{
  "emotions": ["감정1", "감정2"],
  "main_events": ["사건1", "사건2"],
  "relationships": ["관계1", "관계2"],
  "interests": ["관심사1", "관심사2"],
  "psychological_state": "심리 상태 요약",
  "insights": "종합 인사이트"
}`;
};

/**
 * 메모/노트 분석 프롬프트 생성
 */
const generateNotePrompt = (content) => {
  return `다음은 사용자의 메모입니다. 이 메모를 분석해주세요.

[메모 내용]

${content}

다음을 분석해주세요:

1. 주제 및 카테고리
2. 관심 분야
3. 계획이나 목표 (있다면)
4. 성향 및 사고방식

JSON 형식으로 응답해주세요:

{
  "topics": ["주제1", "주제2"],
  "categories": ["카테고리1", "카테고리2"],
  "interests": ["관심 분야1", "관심 분야2"],
  "plans": ["계획1", "계획2"],
  "thinking_style": "사고방식 요약",
  "insights": "종합 인사이트"
}`;
};

/**
 * 기타 텍스트 분석 프롬프트 생성
 */
const generateOtherPrompt = (content) => {
  return `다음 텍스트를 분석해주세요.

[내용]

${content}

주요 주제, 키워드, 인사이트를 JSON 형식으로 제공해주세요:

{
  "topics": ["주제1", "주제2"],
  "keywords": ["키워드1", "키워드2"],
  "summary": "요약",
  "insights": "인사이트"
}`;
};

/**
 * AI 응답 파싱 (JSON 추출)
 */
const parseAIResponse = (response) => {
  try {
    // JSON 블록 찾기
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // JSON이 아니면 전체를 파싱 시도
    return JSON.parse(response);
  } catch (error) {
    console.error('AI 응답 파싱 오류:', error);
    // 파싱 실패 시 기본 구조 반환
    return {
      error: '응답을 파싱할 수 없습니다',
      raw_response: response
    };
  }
};

/**
 * 텍스트 문서를 AI로 분석
 */
const analyzeTextDocument = async (documentContent, documentType) => {
  try {
    // 문서 유형에 따라 프롬프트 생성
    let prompt;
    switch (documentType) {
      case 'diary':
        prompt = generateDiaryPrompt(documentContent);
        break;
      case 'note':
        prompt = generateNotePrompt(documentContent);
        break;
      default:
        prompt = generateOtherPrompt(documentContent);
    }

    // OpenAI API 호출
    let maxRetries = 3;
    let attempt = 0;
    let completion;

    while (attempt < maxRetries) {
      try {
        const client = getOpenAIClient();
        completion = await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 전문 분석가입니다. 사용자가 제공한 텍스트를 분석하여 구조화된 JSON 형식으로 응답해주세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        });

        break; // 성공 시 루프 종료
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error('AI 분석 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
        console.log(`AI API 호출 실패 (${attempt}/${maxRetries}), 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;

    // 응답 파싱
    const parsedResponse = parseAIResponse(rawResponse);

    // 문서 유형에 따라 결과 구조화
    if (documentType === 'diary') {
      return {
        emotions: parsedResponse.emotions || [],
        main_events: parsedResponse.main_events || [],
        relationships: parsedResponse.relationships || [],
        interests: parsedResponse.interests || [],
        psychological_state: parsedResponse.psychological_state || '',
        insights: parsedResponse.insights || ''
      };
    } else if (documentType === 'note') {
      return {
        topics: parsedResponse.topics || [],
        categories: parsedResponse.categories || [],
        interests: parsedResponse.interests || [],
        plans: parsedResponse.plans || [],
        thinking_style: parsedResponse.thinking_style || '',
        insights: parsedResponse.insights || ''
      };
    } else {
      return {
        topics: parsedResponse.topics || [],
        keywords: parsedResponse.keywords || [],
        summary: parsedResponse.summary || '',
        insights: parsedResponse.insights || ''
      };
    }
  } catch (error) {
    console.error('텍스트 분석 에러:', error);
    throw new Error(`텍스트 분석 중 오류가 발생했습니다: ${error.message}`);
  }
};

module.exports = {
  analyzeTextDocument
};

