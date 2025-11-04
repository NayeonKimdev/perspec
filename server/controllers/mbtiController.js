const MBTIEstimation = require('../models/MBTIEstimation');
const { estimateMBTI } = require('../services/mbtiService');

/**
 * MBTI 추정 생성
 */
const createEstimation = async (req, res) => {
  try {
    const userId = req.user.id;

    // mbtiService를 호출하여 추정
    const result = await estimateMBTI(userId);

    // 데이터 부족 에러 처리
    if (result.error === 'INSUFFICIENT_DATA') {
      return res.status(400).json({
        message: result.message,
        dataSources: result.dataSources
      });
    }

    // 결과를 DB에 저장
    const estimation = await MBTIEstimation.create({
      user_id: userId,
      mbti_type: result.mbti_type,
      dimensions: result.dimensions,
      confidence: result.confidence,
      characteristics: result.characteristics || [],
      suitable_careers: result.suitable_careers || [],
      suitable_environments: result.suitable_environments || [],
      growth_suggestions: result.growth_suggestions || [],
      data_sources: result.dataSources || {}
    });

    return res.status(201).json({
      message: 'MBTI 추정이 완료되었습니다.',
      estimation: {
        id: estimation.id,
        mbti_type: estimation.mbti_type,
        dimensions: estimation.dimensions,
        confidence: estimation.confidence,
        characteristics: estimation.characteristics,
        suitable_careers: estimation.suitable_careers,
        suitable_environments: estimation.suitable_environments,
        growth_suggestions: estimation.growth_suggestions,
        data_sources: estimation.data_sources,
        created_at: estimation.created_at
      }
    });

  } catch (error) {
    console.error('MBTI 추정 생성 에러:', error);
    
    // API 에러 처리
    if (error.message.includes('AI 분석 서비스에 연결할 수 없습니다')) {
      return res.status(503).json({
        message: 'AI 분석 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'MBTI 추정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * MBTI 추정 히스토리 조회
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const estimations = await MBTIEstimation.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'mbti_type', 'confidence', 'created_at']
    });

    return res.status(200).json({
      estimations: estimations.map(est => ({
        id: est.id,
        mbti_type: est.mbti_type,
        confidence: est.confidence,
        created_at: est.created_at
      }))
    });

  } catch (error) {
    console.error('MBTI 히스토리 조회 에러:', error);
    return res.status(500).json({
      message: 'MBTI 히스토리 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 특정 MBTI 추정 결과 상세 조회
 */
const getEstimationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const estimation = await MBTIEstimation.findOne({
      where: {
        id: id,
        user_id: userId // 권한 확인
      }
    });

    if (!estimation) {
      return res.status(404).json({
        message: 'MBTI 추정 결과를 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      estimation: {
        id: estimation.id,
        mbti_type: estimation.mbti_type,
        dimensions: estimation.dimensions,
        confidence: estimation.confidence,
        characteristics: estimation.characteristics,
        suitable_careers: estimation.suitable_careers,
        suitable_environments: estimation.suitable_environments,
        growth_suggestions: estimation.growth_suggestions,
        data_sources: estimation.data_sources,
        created_at: estimation.created_at,
        updated_at: estimation.updated_at
      }
    });

  } catch (error) {
    console.error('MBTI 추정 상세 조회 에러:', error);
    return res.status(500).json({
      message: 'MBTI 추정 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  createEstimation,
  getHistory,
  getEstimationById
};


