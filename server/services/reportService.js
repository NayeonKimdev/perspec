const { OpenAI } = require('openai');
const Profile = require('../models/Profile');
const Media = require('../models/Media');
const TextDocument = require('../models/TextDocument');
const Analysis = require('../models/Analysis');
const MBTIEstimation = require('../models/MBTIEstimation');
const EmotionAnalysis = require('../models/EmotionAnalysis');

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
 * 모든 분석 결과를 종합한 레포트를 생성하는 함수
 * @param {string} userId - 사용자 ID
 * @param {string} title - 레포트 제목 (선택적)
 * @returns {Promise<Object>} 종합 레포트 결과
 */
const generateComprehensiveReport = async (userId, title = null) => {
  try {
    // 1. 모든 분석 데이터 수집
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });

    const latestAnalysis = await Analysis.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    const latestMBTI = await MBTIEstimation.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    const latestEmotion = await EmotionAnalysis.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    // 이미지 분석 요약
    const mediaList = await Media.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // 문서 분석 요약
    const textDocuments = await TextDocument.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 20
    });

    // 데이터 소스 정보
    const dataSources = {
      profile: !!profile,
      analyses: latestAnalysis ? 1 : 0,
      mbti: latestMBTI ? 1 : 0,
      emotion: latestEmotion ? 1 : 0,
      images: mediaList.length,
      documents: textDocuments.length
    };

    // 데이터가 너무 적으면 에러
    const totalDataPoints = Object.values(dataSources).reduce((sum, val) => sum + (typeof val === 'number' ? val : val ? 1 : 0), 0);
    if (totalDataPoints < 3) {
      return {
        error: 'INSUFFICIENT_DATA',
        message: '충분한 데이터가 없습니다. 프로필 작성 및 파일 업로드를 해주세요.',
        dataSources
      };
    }

    // 2. AI 프롬프트 생성
    const prompt = generateReportPrompt(profile, latestAnalysis, latestMBTI, latestEmotion, mediaList, textDocuments);

    // 3. AI 호출
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
              content: `당신은 전문 심리 분석가이자 커리어 컨설턴트입니다. 사용자의 모든 데이터를 종합하여 
상세하고 실용적인 분석 레포트를 작성해주세요. 각 섹션은 최소 200자 이상 작성하고, 
구체적인 예시와 실용적인 조언을 포함해주세요.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });

        break;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`AI 분석 서비스에 연결할 수 없습니다: ${error.message}`);
        }
        console.log(`레포트 생성 API 호출 실패 (${attempt}/${maxRetries}), 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;

    // 4. 응답 파싱
    const parsedResult = parseReportResponse(rawResponse);

    // 5. 레포트 제목 생성
    const reportTitle = title || `종합 분석 레포트 - ${new Date().toLocaleDateString('ko-KR')}`;

    return {
      title: reportTitle,
      ...parsedResult,
      data_sources: dataSources
    };

  } catch (error) {
    console.error('레포트 생성 에러:', error);
    throw error;
  }
};

/**
 * 레포트 생성을 위한 프롬프트 생성
 */
const generateReportPrompt = (profile, latestAnalysis, latestMBTI, latestEmotion, mediaList, textDocuments) => {
  let prompt = `당신은 전문 심리 분석가입니다. 다음 모든 데이터를 종합하여 
사용자에 대한 종합적인 분석 레포트를 작성해주세요.\n\n`;

  // 기본 프로필
  if (profile) {
    prompt += `[기본 프로필]\n`;
    if (profile.interests) prompt += `관심사: ${profile.interests}\n`;
    if (profile.hobbies) prompt += `취미: ${profile.hobbies}\n`;
    if (profile.personality) prompt += `성격: ${profile.personality}\n`;
    if (profile.current_job) prompt += `현재 직업: ${profile.current_job}\n`;
    if (profile.future_dream) prompt += `미래 꿈: ${profile.future_dream}\n`;
    if (profile.concerns) prompt += `고민: ${profile.concerns}\n`;
    prompt += `\n`;
  }

  // MBTI 분석 결과
  if (latestMBTI) {
    prompt += `[MBTI 분석 결과]\n`;
    prompt += `MBTI 유형: ${latestMBTI.mbti_type}\n`;
    prompt += `신뢰도: ${latestMBTI.confidence}%\n`;
    if (latestMBTI.dimensions) {
      prompt += `차원 분석: ${JSON.stringify(latestMBTI.dimensions)}\n`;
    }
    if (latestMBTI.characteristics && latestMBTI.characteristics.length > 0) {
      prompt += `특징: ${latestMBTI.characteristics.join(', ')}\n`;
    }
    if (latestMBTI.suitable_careers && latestMBTI.suitable_careers.length > 0) {
      prompt += `적합 직업: ${latestMBTI.suitable_careers.join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 감정 패턴 분석
  if (latestEmotion) {
    prompt += `[감정 패턴 분석]\n`;
    prompt += `감정 건강 점수: ${latestEmotion.health_score}/100\n`;
    prompt += `안정성 점수: ${latestEmotion.stability_score}/100\n`;
    prompt += `긍정/부정 비율: ${latestEmotion.positive_ratio}% / ${latestEmotion.negative_ratio}%\n`;
    if (latestEmotion.primary_emotions && latestEmotion.primary_emotions.length > 0) {
      prompt += `주요 감정: ${latestEmotion.primary_emotions.join(', ')}\n`;
    }
    if (latestEmotion.concerns && latestEmotion.concerns.length > 0) {
      prompt += `우려사항: ${latestEmotion.concerns.join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 이미지 분석 인사이트
  if (mediaList.length > 0) {
    prompt += `[이미지 분석 인사이트]\n`;
    const insights = [];
    mediaList.slice(0, 10).forEach(media => {
      const result = media.analysis_result;
      if (result) {
        if (result.interests) insights.push(...(Array.isArray(result.interests) ? result.interests : [result.interests]));
        if (result.theme) insights.push(result.theme);
      }
    });
    if (insights.length > 0) {
      prompt += `주요 키워드: ${[...new Set(insights)].slice(0, 10).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 텍스트 문서 분석
  if (textDocuments.length > 0) {
    prompt += `[텍스트 문서 분석]\n`;
    const docInsights = [];
    textDocuments.slice(0, 10).forEach(doc => {
      const result = doc.analysis_result;
      if (result) {
        if (result.keywords) docInsights.push(...(Array.isArray(result.keywords) ? result.keywords : [result.keywords]));
        if (result.sentiment) docInsights.push(`감정: ${result.sentiment}`);
      }
    });
    if (docInsights.length > 0) {
      prompt += `문서 인사이트: ${docInsights.slice(0, 10).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // 기존 분석 결과
  if (latestAnalysis) {
    prompt += `[기존 분석 결과]\n`;
    if (latestAnalysis.personality_analysis) {
      prompt += `성격 분석: ${latestAnalysis.personality_analysis.substring(0, 300)}...\n`;
    }
    if (latestAnalysis.career_recommendations) {
      prompt += `직업 추천: ${latestAnalysis.career_recommendations.substring(0, 300)}...\n`;
    }
    prompt += `\n`;
  }

  prompt += `다음 형식으로 종합 레포트를 작성해주세요:\n\n`;
  prompt += `1. 전체 요약 (Executive Summary) - 사용자에 대한 전체적인 개요 (300자 이상)\n`;
  prompt += `2. 성격 종합 분석 - MBTI, 감정 패턴, 프로필을 종합한 성격 분석 (400자 이상)\n`;
  prompt += `3. 강점 및 재능 - 사용자의 강점과 재능을 구체적으로 나열 (300자 이상)\n`;
  prompt += `4. 개선이 필요한 영역 - 개선이 필요한 부분과 이유 (300자 이상)\n`;
  prompt += `5. 커리어 방향 제안 - 적합한 직업과 커리어 경로 (400자 이상)\n`;
  prompt += `6. 라이프스타일 추천 - 일상 생활과 라이프스타일 제안 (300자 이상)\n`;
  prompt += `7. 관계 및 소통 스타일 - 대인관계와 소통 방식 분석 (300자 이상)\n`;
  prompt += `8. 성장 로드맵 - 단계별 성장 계획과 목표 (400자 이상)\n`;
  prompt += `9. 주의사항 및 조언 - 주의할 점과 전문가 조언 (300자 이상)\n\n`;
  prompt += `JSON 형식으로 응답:\n`;
  prompt += `{\n`;
  prompt += `  "summary": "전체 요약 텍스트",\n`;
  prompt += `  "personality": "성격 분석 텍스트",\n`;
  prompt += `  "strengths": ["강점1", "강점2"],\n`;
  prompt += `  "improvements": ["개선1", "개선2"],\n`;
  prompt += `  "career_suggestions": ["직업1", "직업2"],\n`;
  prompt += `  "lifestyle_recommendations": ["추천1", "추천2"],\n`;
  prompt += `  "relationship_style": "관계 스타일 텍스트",\n`;
  prompt += `  "growth_roadmap": ["단계1", "단계2"],\n`;
  prompt += `  "cautions": ["주의1", "주의2"]\n`;
  prompt += `}\n`;

  return prompt;
};

/**
 * AI 응답을 파싱하는 함수
 */
const parseReportResponse = (rawResponse) => {
  try {
    let jsonStr = rawResponse;
    
    const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const firstBrace = rawResponse.indexOf('{');
      const lastBrace = rawResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = rawResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || '',
      personality: parsed.personality || '',
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      career_suggestions: parsed.career_suggestions || [],
      lifestyle_recommendations: parsed.lifestyle_recommendations || [],
      relationship_style: parsed.relationship_style || '',
      growth_roadmap: parsed.growth_roadmap || [],
      cautions: parsed.cautions || []
    };

  } catch (error) {
    console.error('레포트 응답 파싱 에러:', error);
    console.error('원본 응답:', rawResponse);
    
    return {
      summary: '레포트 생성 중 오류가 발생했습니다.',
      personality: '',
      strengths: [],
      improvements: [],
      career_suggestions: [],
      lifestyle_recommendations: [],
      relationship_style: '',
      growth_roadmap: [],
      cautions: []
    };
  }
};

module.exports = {
  generateComprehensiveReport
};


