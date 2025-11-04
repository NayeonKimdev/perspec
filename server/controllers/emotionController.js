const EmotionAnalysis = require('../models/EmotionAnalysis');
const { analyzeEmotions } = require('../services/emotionAnalysisService');

/**
 * 감정 분석 생성
 */
const createAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    // emotionAnalysisService를 호출하여 분석
    const result = await analyzeEmotions(userId);

    // 데이터 부족 에러 처리
    if (result.error === 'INSUFFICIENT_DATA') {
      return res.status(400).json({
        message: result.message,
        dataCount: result.dataCount
      });
    }

    // 결과를 DB에 저장
    const analysis = await EmotionAnalysis.create({
      user_id: userId,
      primary_emotions: result.primary_emotions || [],
      emotion_timeline: result.emotion_timeline || [],
      positive_ratio: result.positive_negative_ratio?.positive || 50,
      negative_ratio: result.positive_negative_ratio?.negative || 50,
      stability_score: result.stability_score || 50,
      health_score: result.health_score || 50,
      concerns: result.concerns || [],
      suggestions: result.suggestions || [],
      data_count: result.data_count || 0
    });

    return res.status(201).json({
      message: '감정 분석이 완료되었습니다.',
      analysis: {
        id: analysis.id,
        primary_emotions: analysis.primary_emotions,
        emotion_timeline: analysis.emotion_timeline,
        positive_ratio: analysis.positive_ratio,
        negative_ratio: analysis.negative_ratio,
        stability_score: analysis.stability_score,
        health_score: analysis.health_score,
        concerns: analysis.concerns,
        suggestions: analysis.suggestions,
        data_count: analysis.data_count,
        created_at: analysis.created_at
      }
    });

  } catch (error) {
    console.error('감정 분석 생성 에러:', error);
    
    // API 에러 처리
    if (error.message.includes('AI 분석 서비스에 연결할 수 없습니다')) {
      return res.status(503).json({
        message: 'AI 분석 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: error.message
      });
    }

    return res.status(500).json({
      message: '감정 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 최신 감정 분석 결과 조회
 */
const getLatestAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    const analysis = await EmotionAnalysis.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    if (!analysis) {
      return res.status(404).json({
        message: '감정 분석 결과를 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      analysis: {
        id: analysis.id,
        primary_emotions: analysis.primary_emotions,
        emotion_timeline: analysis.emotion_timeline,
        positive_ratio: analysis.positive_ratio,
        negative_ratio: analysis.negative_ratio,
        stability_score: analysis.stability_score,
        health_score: analysis.health_score,
        concerns: analysis.concerns,
        suggestions: analysis.suggestions,
        data_count: analysis.data_count,
        created_at: analysis.created_at
      }
    });

  } catch (error) {
    console.error('감정 분석 조회 에러:', error);
    return res.status(500).json({
      message: '감정 분석 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  createAnalysis,
  getLatestAnalysis
};


