const { OpenAI } = require('openai');
const Profile = require('../models/Profile');
const Media = require('../models/Media');
const TextDocument = require('../models/TextDocument');
const Analysis = require('../models/Analysis');

// OpenAI 클라이언트 초기화
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
 * 사용자의 모든 데이터를 수집하여 MBTI를 추정하는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} MBTI 추정 결과
 */
const estimateMBTI = async (userId) => {
  try {
    // 1. 프로필 데이터 수집
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });

    // 2. 이미지 분석 결과 수집
    const mediaList = await Media.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 50 // 최대 50개
    });

    // 3. 텍스트 문서 분석 결과 수집
    const textDocuments = await TextDocument.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 50 // 최대 50개
    });

    // 4. 기존 분석 결과 수집
    const analyses = await Analysis.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10 // 최대 10개
    });

    // 데이터 소스 정보 계산
    const dataSources = {
      profile: !!profile,
      images: mediaList.length,
      documents: textDocuments.length,
      analyses: analyses.length
    };

    // 데이터가 너무 적으면 경고
    const totalDataPoints = (profile ? 1 : 0) + mediaList.length + textDocuments.length + analyses.length;
    if (totalDataPoints < 3) {
      return {
        error: 'INSUFFICIENT_DATA',
        message: '충분한 데이터가 없습니다. 프로필 작성 및 파일 업로드를 해주세요.',
        dataSources
      };
    }

    // 5. AI 프롬프트 생성
    const prompt = generateMBTIPrompt(profile, mediaList, textDocuments, analyses);

    // 6. OpenAI API 호출
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
              role: 'system',
              content: `당신은 MBTI 전문가입니다. 사용자의 다양한 데이터를 종합적으로 분석하여 
정확한 MBTI 유형을 추정해주세요. 데이터가 부족한 경우 신뢰도를 낮게 설정하고, 
가능한 한 객관적이고 정확한 분석을 제공해주세요.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        });

        break; // 성공 시 루프 종료
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`AI 분석 서비스에 연결할 수 없습니다: ${error.message}`);
        }
        console.log(`MBTI 추정 API 호출 실패 (${attempt}/${maxRetries}), 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;

    // 7. 응답 파싱
    const parsedResult = parseMBTIResponse(rawResponse, totalDataPoints);

    // 8. 결과 반환
    return {
      ...parsedResult,
      dataSources
    };

  } catch (error) {
    console.error('MBTI 추정 에러:', error);
    throw error;
  }
};

/**
 * MBTI 분석을 위한 프롬프트 생성
 */
const generateMBTIPrompt = (profile, mediaList, textDocuments, analyses) => {
  let prompt = `당신은 MBTI 전문가입니다. 다음 정보를 종합하여 사용자의 MBTI 유형을 추정해주세요.\n\n`;

  // 프로필 정보
  if (profile) {
    prompt += `[프로필 정보]\n`;
    if (profile.interests) prompt += `- 관심사: ${profile.interests}\n`;
    if (profile.hobbies) prompt += `- 취미: ${profile.hobbies}\n`;
    if (profile.personality) prompt += `- 성격: ${profile.personality}\n`;
    if (profile.current_job) prompt += `- 현재 직업: ${profile.current_job}\n`;
    if (profile.future_dream) prompt += `- 미래 꿈: ${profile.future_dream}\n`;
    if (profile.ideal_life) prompt += `- 이상적인 삶: ${profile.ideal_life}\n`;
    if (profile.concerns) prompt += `- 고민: ${profile.concerns}\n`;
    prompt += `\n`;
  }

  // 이미지 분석 결과
  if (mediaList.length > 0) {
    prompt += `[이미지 분석 인사이트]\n`;
    const imageInterests = [];
    const imagePatterns = [];
    const imageMoods = [];

    mediaList.forEach(media => {
      const result = media.analysis_result;
      if (result) {
        if (result.interests && Array.isArray(result.interests)) {
          imageInterests.push(...result.interests);
        }
        if (result.mood) {
          imageMoods.push(result.mood);
        }
        if (result.theme) {
          imagePatterns.push(result.theme);
        }
      }
    });

    if (imageInterests.length > 0) {
      prompt += `- 주요 관심사: ${[...new Set(imageInterests)].join(', ')}\n`;
    }
    if (imagePatterns.length > 0) {
      prompt += `- 활동 패턴: ${[...new Set(imagePatterns)].join(', ')}\n`;
    }
    if (imageMoods.length > 0) {
      prompt += `- 분위기: ${[...new Set(imageMoods)].join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 텍스트 문서 분석
  if (textDocuments.length > 0) {
    prompt += `[텍스트 문서 분석]\n`;
    const documentEmotions = [];
    const thinkingPatterns = [];
    const relationships = [];

    textDocuments.forEach(doc => {
      const result = doc.analysis_result;
      if (result) {
        if (result.emotions && Array.isArray(result.emotions)) {
          documentEmotions.push(...result.emotions);
        }
        if (result.thinking_pattern) {
          thinkingPatterns.push(result.thinking_pattern);
        }
        if (result.relationship_style) {
          relationships.push(result.relationship_style);
        }
      }
    });

    if (documentEmotions.length > 0) {
      prompt += `- 감정 패턴: ${[...new Set(documentEmotions)].join(', ')}\n`;
    }
    if (thinkingPatterns.length > 0) {
      prompt += `- 사고방식: ${thinkingPatterns.join(', ')}\n`;
    }
    if (relationships.length > 0) {
      prompt += `- 관계 스타일: ${relationships.join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 기존 분석 결과
  if (analyses.length > 0) {
    prompt += `[기존 분석 결과]\n`;
    analyses.forEach((analysis, index) => {
      prompt += `분석 ${index + 1}:\n`;
      if (analysis.personality_analysis) {
        prompt += `- 성격 분석: ${analysis.personality_analysis.substring(0, 200)}...\n`;
      }
      if (analysis.career_recommendations) {
        prompt += `- 직업 추천: ${analysis.career_recommendations.substring(0, 200)}...\n`;
      }
    });
    prompt += `\n`;
  }

  prompt += `다음 형식으로 MBTI를 추정해주세요:\n\n`;
  prompt += `1. 각 지표별 분석:\n`;
  prompt += `   - E/I (외향/내향): 점수 (0-100), 설명\n`;
  prompt += `   - S/N (감각/직관): 점수 (0-100), 설명\n`;
  prompt += `   - T/F (사고/감정): 점수 (0-100), 설명\n`;
  prompt += `   - J/P (판단/인식): 점수 (0-100), 설명\n\n`;
  prompt += `2. 최종 MBTI 유형: (예: ENFP)\n\n`;
  prompt += `3. 신뢰도: (0-100) - 데이터의 충분성에 따라\n\n`;
  prompt += `4. 유형별 특징 설명\n\n`;
  prompt += `5. 적합한 직업 및 환경\n\n`;
  prompt += `6. 성장 방향 제안\n\n`;
  prompt += `JSON 형식으로 응답:\n`;
  prompt += `{\n`;
  prompt += `  "dimensions": {\n`;
  prompt += `    "EI": { "score": 65, "type": "E", "description": "..." },\n`;
  prompt += `    "SN": { "score": 70, "type": "N", "description": "..." },\n`;
  prompt += `    "TF": { "score": 55, "type": "F", "description": "..." },\n`;
  prompt += `    "JP": { "score": 60, "type": "P", "description": "..." }\n`;
  prompt += `  },\n`;
  prompt += `  "mbti_type": "ENFP",\n`;
  prompt += `  "confidence": 75,\n`;
  prompt += `  "description": "열정적이고 창의적인 활동가",\n`;
  prompt += `  "characteristics": ["특징1", "특징2"],\n`;
  prompt += `  "suitable_careers": ["직업1", "직업2"],\n`;
  prompt += `  "suitable_environments": ["환경1", "환경2"],\n`;
  prompt += `  "growth_suggestions": ["제안1", "제안2"]\n`;
  prompt += `}\n`;

  return prompt;
};

/**
 * AI 응답을 파싱하는 함수
 */
const parseMBTIResponse = (rawResponse, dataPointCount) => {
  try {
    // JSON 블록 추출
    let jsonStr = rawResponse;
    
    // 코드 블록에서 JSON 추출
    const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // 코드 블록이 없으면 첫 번째 { 부터 마지막 } 까지
      const firstBrace = rawResponse.indexOf('{');
      const lastBrace = rawResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = rawResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);

    // 데이터가 적으면 신뢰도 조정
    let confidence = parsed.confidence || 50;
    if (dataPointCount < 5) {
      confidence = Math.max(confidence - 20, 30);
    }

    // 필수 필드 검증 및 기본값 설정
    return {
      dimensions: parsed.dimensions || {
        EI: { score: 50, type: 'I', description: '데이터 부족' },
        SN: { score: 50, type: 'S', description: '데이터 부족' },
        TF: { score: 50, type: 'T', description: '데이터 부족' },
        JP: { score: 50, type: 'J', description: '데이터 부족' }
      },
      mbti_type: parsed.mbti_type || 'XXXX',
      confidence: confidence,
      description: parsed.description || '분석 결과가 없습니다.',
      characteristics: parsed.characteristics || [],
      suitable_careers: parsed.suitable_careers || [],
      suitable_environments: parsed.suitable_environments || [],
      growth_suggestions: parsed.growth_suggestions || []
    };

  } catch (error) {
    console.error('MBTI 응답 파싱 에러:', error);
    console.error('원본 응답:', rawResponse);
    
    // 파싱 실패 시 기본값 반환
    return {
      dimensions: {
        EI: { score: 50, type: 'I', description: '분석 실패' },
        SN: { score: 50, type: 'S', description: '분석 실패' },
        TF: { score: 50, type: 'T', description: '분석 실패' },
        JP: { score: 50, type: 'J', description: '분석 실패' }
      },
      mbti_type: 'XXXX',
      confidence: 0,
      description: '분석 중 오류가 발생했습니다.',
      characteristics: [],
      suitable_careers: [],
      suitable_environments: [],
      growth_suggestions: []
    };
  }
};

module.exports = {
  estimateMBTI
};


