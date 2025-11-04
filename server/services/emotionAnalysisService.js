const { OpenAI } = require('openai');
const Media = require('../models/Media');
const TextDocument = require('../models/TextDocument');

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
 * 사용자의 전반적인 감정 패턴을 분석하는 함수
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 감정 분석 결과
 */
const analyzeEmotions = async (userId) => {
  try {
    // 1. 텍스트 문서(특히 일기)에서 감정 데이터 수집
    const textDocuments = await TextDocument.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed',
        document_type: 'diary' // 일기 우선
      },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    // 일기가 없으면 모든 문서 타입 포함
    if (textDocuments.length < 5) {
      const allDocuments = await TextDocument.findAll({
        where: {
          user_id: userId,
          analysis_status: 'completed'
        },
        order: [['created_at', 'DESC']],
        limit: 100
      });
      textDocuments.push(...allDocuments.slice(0, 100 - textDocuments.length));
    }

    // 2. 이미지 분석에서 mood 데이터 수집
    const mediaList = await Media.findAll({
      where: {
        user_id: userId,
        analysis_status: 'completed'
      },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const dataCount = textDocuments.length + mediaList.length;

    // 데이터가 너무 적으면 경고
    if (dataCount < 3) {
      return {
        error: 'INSUFFICIENT_DATA',
        message: '충분한 데이터가 없습니다. 문서와 이미지를 더 업로드해주세요.',
        dataCount
      };
    }

    // 3. 감정 데이터 정리
    const documentEmotions = [];
    const imageMoods = [];

    // 텍스트 문서 감정 수집
    textDocuments.forEach(doc => {
      const result = doc.analysis_result;
      if (result) {
        if (result.emotions && Array.isArray(result.emotions)) {
          documentEmotions.push({
            emotion: result.emotions,
            date: doc.created_at,
            type: doc.document_type
          });
        }
        // sentiment도 있으면 사용
        if (result.sentiment) {
          documentEmotions.push({
            emotion: [result.sentiment],
            date: doc.created_at,
            type: doc.document_type
          });
        }
      }
    });

    // 이미지 분위기 수집
    mediaList.forEach(media => {
      const result = media.analysis_result;
      if (result && result.mood) {
        imageMoods.push({
          mood: result.mood,
          date: media.created_at
        });
      }
    });

    // 4. AI 프롬프트 생성
    const prompt = generateEmotionPrompt(documentEmotions, imageMoods);

    // 5. OpenAI API 호출
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
              content: `당신은 전문 감정 분석가입니다. 사용자의 감정 데이터를 종합적으로 분석하여 
감정 패턴, 건강 상태, 개선 방안을 제시해주세요.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });

        break;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`AI 분석 서비스에 연결할 수 없습니다: ${error.message}`);
        }
        console.log(`감정 분석 API 호출 실패 (${attempt}/${maxRetries}), 재시도 중...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }

    const rawResponse = completion.choices[0].message.content;

    // 6. 응답 파싱
    const parsedResult = parseEmotionResponse(rawResponse, dataCount);

    // 7. 시간대별 감정 데이터 생성
    const emotionTimeline = buildEmotionTimeline(documentEmotions, imageMoods);

    return {
      ...parsedResult,
      emotion_timeline: emotionTimeline,
      data_count: dataCount
    };

  } catch (error) {
    console.error('감정 분석 에러:', error);
    throw error;
  }
};

/**
 * 감정 분석을 위한 프롬프트 생성
 */
const generateEmotionPrompt = (documentEmotions, imageMoods) => {
  let prompt = `다음은 사용자의 감정 데이터입니다. 종합적으로 분석해주세요.\n\n`;

  // 텍스트 문서 감정 데이터
  if (documentEmotions.length > 0) {
    prompt += `[텍스트 문서 감정 데이터]\n`;
    documentEmotions.slice(0, 50).forEach(item => {
      prompt += `- 날짜: ${new Date(item.date).toLocaleDateString('ko-KR')}, `;
      prompt += `감정: ${Array.isArray(item.emotion) ? item.emotion.join(', ') : item.emotion}, `;
      prompt += `유형: ${item.type}\n`;
    });
    prompt += `\n`;
  }

  // 이미지 분위기 데이터
  if (imageMoods.length > 0) {
    prompt += `[이미지 분위기 데이터]\n`;
    imageMoods.slice(0, 50).forEach(item => {
      prompt += `- 날짜: ${new Date(item.date).toLocaleDateString('ko-KR')}, `;
      prompt += `분위기: ${item.mood}\n`;
    });
    prompt += `\n`;
  }

  prompt += `다음을 분석해주세요:\n`;
  prompt += `1. 주요 감정 (빈도순)\n`;
  prompt += `2. 감정의 변화 패턴 (시간에 따라)\n`;
  prompt += `3. 긍정/부정 비율\n`;
  prompt += `4. 감정 안정성 (변화가 심한지)\n`;
  prompt += `5. 주의가 필요한 감정 패턴 (불안, 우울 등)\n`;
  prompt += `6. 감정 건강 점수 (0-100)\n`;
  prompt += `7. 개선 제안\n\n`;
  prompt += `JSON 형식으로 응답:\n`;
  prompt += `{\n`;
  prompt += `  "primary_emotions": ["감정1", "감정2"],\n`;
  prompt += `  "emotion_patterns": ["패턴1", "패턴2"],\n`;
  prompt += `  "positive_negative_ratio": { "positive": 60, "negative": 40 },\n`;
  prompt += `  "stability_score": 70,\n`;
  prompt += `  "concerns": ["우려사항1"],\n`;
  prompt += `  "health_score": 75,\n`;
  prompt += `  "suggestions": ["제안1", "제안2"]\n`;
  prompt += `}\n`;

  return prompt;
};

/**
 * AI 응답을 파싱하는 함수
 */
const parseEmotionResponse = (rawResponse, dataCount) => {
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

    // 데이터가 적으면 건강 점수 조정
    let healthScore = parsed.health_score || 50;
    let stabilityScore = parsed.stability_score || 50;
    if (dataCount < 10) {
      healthScore = Math.max(healthScore - 10, 30);
      stabilityScore = Math.max(stabilityScore - 10, 30);
    }

    return {
      primary_emotions: parsed.primary_emotions || [],
      emotion_patterns: parsed.emotion_patterns || [],
      positive_negative_ratio: parsed.positive_negative_ratio || { positive: 50, negative: 50 },
      stability_score: stabilityScore,
      concerns: parsed.concerns || [],
      health_score: healthScore,
      suggestions: parsed.suggestions || []
    };

  } catch (error) {
    console.error('감정 분석 응답 파싱 에러:', error);
    console.error('원본 응답:', rawResponse);
    
    return {
      primary_emotions: [],
      emotion_patterns: [],
      positive_negative_ratio: { positive: 50, negative: 50 },
      stability_score: 50,
      concerns: [],
      health_score: 50,
      suggestions: []
    };
  }
};

/**
 * 시간대별 감정 타임라인 생성
 */
const buildEmotionTimeline = (documentEmotions, imageMoods) => {
  const timeline = [];
  
  // 문서 감정을 타임라인에 추가
  documentEmotions.forEach(item => {
    timeline.push({
      date: item.date,
      type: 'document',
      emotion: Array.isArray(item.emotion) ? item.emotion[0] : item.emotion
    });
  });

  // 이미지 분위기를 타임라인에 추가
  imageMoods.forEach(item => {
    timeline.push({
      date: item.date,
      type: 'image',
      emotion: item.mood
    });
  });

  // 날짜순 정렬
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return timeline;
};

module.exports = {
  analyzeEmotions
};


