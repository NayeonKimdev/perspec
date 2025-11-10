/**
 * AI 서비스
 * OpenAI API를 사용하여 프로필 분석을 수행합니다.
 */

const { OpenAI } = require('openai');
const { generateAnalysisPrompt } = require('./promptService');
const { parseAIResponse } = require('./responseParser');

// OpenAI 클라이언트 지연 초기화 (Lazy Initialization)
// API 키가 없을 때까지 초기화를 지연하여 환경변수 검증 시점 제어
let openai = null;

/**
 * OpenAI 클라이언트 싱글톤 반환
 * @returns {OpenAI} OpenAI 클라이언트 인스턴스
 * @throws {Error} OPENAI_API_KEY가 설정되지 않은 경우
 */
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
 * 프로필 데이터를 AI로 분석하는 함수
 * @param {Object} profileData - 분석할 프로필 데이터
 * @returns {Object} 분석 결과 객체
 * 
 * 재시도 로직:
 * - 최대 3회 재시도
 * - 각 재시도 간 2초 대기 (지수 백오프 대신 고정 대기)
 * - 네트워크 오류, API 제한 등 일시적 오류 처리
 * 
 * 프롬프트 구성:
 * - System 메시지: AI 역할 및 출력 형식 지정
 * - User 메시지: 실제 분석할 프로필 데이터
 * 
 * 응답 처리:
 * - JSON 파싱하여 구조화된 데이터로 변환
 * - 각 필드별로 기본값 설정하여 안정성 확보
 */
const analyzeProfile = async (profileData) => {
  try {
    // 프롬프트 생성 (프로필 데이터를 분석 가능한 형태로 변환)
    const prompt = generateAnalysisPrompt(profileData);

    // OpenAI API 호출 (재시도 로직 포함)
    let maxRetries = 3;
    let attempt = 0;
    let completion;

    // 최대 재시도 횟수까지 반복
    while (attempt < maxRetries) {
      try {
        const client = getOpenAIClient();
        completion = await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `당신은 전문 심리 분석가이자 커리어 컨설턴트입니다. 
사용자의 프로필을 분석하여 상세하고 구체적인 인사이트를 제공해주세요.

중요 규칙:
1. 각 섹션은 반드시 최소 150-200자 이상 작성해야 합니다.
2. 구체적인 직업명, 지역명, 활동명을 명확히 제시해야 합니다.
3. 각 추천 항목마다 이유를 명확히 설명해야 합니다.
4. 절대로 "~수 있습니다" 같은 모호한 표현을 사용하지 마세요.
5. "추천 진로/직업" 섹션에서는 절대로 역량만 나열하지 말고, 반드시 구체적인 직업명과 함께 이유를 설명해야 합니다.
6. 예: "창의성, 논리적 사고..." ❌ | "1. AI 엔지니어 - 창의적 성향이..." ✅`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8, // 창의성 수준 (0~1, 높을수록 다양한 응답)
          max_tokens: 2000  // 최대 토큰 수 제한
        });

        break; // 성공 시 루프 종료
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          // 최대 재시도 횟수 초과 시 에러 발생
          throw new Error('AI 분석 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
        console.log(`AI API 호출 실패 (${attempt}/${maxRetries}), 재시도 중...`);
        // 재시도 전 대기 (서버 부하 감소 및 Rate Limit 회피)
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;

    // 응답 파싱
    const parsedResponse = parseAIResponse(rawResponse);

    return {
      personality_analysis: parsedResponse.personality_analysis || '',
      career_recommendations: parsedResponse.career_recommendations || '',
      hobby_suggestions: parsedResponse.hobby_suggestions || '',
      travel_recommendations: parsedResponse.travel_recommendations || '',
      additional_insights: parsedResponse.additional_insights || ''
    };
  } catch (error) {
    console.error('AI 분석 에러:', error);
    throw new Error('프로필 분석 중 오류가 발생했습니다.');
  }
};

/**
 * API 연결 테스트 함수
 */
const testConnection = async () => {
  try {
    const client = getOpenAIClient();
    const testCompletion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: '안녕하세요'
        }
      ],
      max_tokens: 10
    });

    return {
      success: true,
      message: 'API 연결 성공'
    };
  } catch (error) {
    console.error('API 연결 테스트 실패:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  analyzeProfile,
  testConnection
};

