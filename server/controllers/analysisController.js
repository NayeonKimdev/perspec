const Analysis = require('../models/Analysis');
const Profile = require('../models/Profile');
const { analyzeProfile } = require('../services/aiService');

/**
 * 분석 생성
 * POST /api/analysis/create
 */
const createAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    // 사용자 프로필 조회
    const profile = await Profile.findOne({
      where: { user_id: userId }
    });

    if (!profile) {
      return res.status(400).json({
        message: '프로필을 먼저 작성해주세요'
      });
    }

    // 프로필 데이터 구성 (ProfileForm의 필드)
    const profileData = {
      interests: profile.interests,
      hobbies: profile.hobbies,
      personality: profile.personality,
      dreams: profile.dreams,
      ideal_type: profile.ideal_type,
      concerns: profile.concerns,
      dating_style: profile.dating_style,
      other_info: profile.other_info
    };

    // AI 분석 실행
    let analysisResult;
    try {
      analysisResult = await analyzeProfile(profileData);
    } catch (error) {
      console.error('AI 분석 에러:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = '분석 서비스를 일시적으로 사용할 수 없습니다';
      
      // OpenAI API 키 관련 에러
      if (error.message && error.message.includes('OPENAI_API_KEY')) {
        errorMessage = 'OpenAI API 키가 설정되지 않았습니다';
      }
      
      // OpenAI API 에러
      if (error.status) {
        errorMessage = `OpenAI API 에러 (${error.status}): ${error.message}`;
      }
      
      return res.status(503).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // 분석 결과 저장
    const analysis = await Analysis.create({
      user_id: userId,
      profile_snapshot: profileData,
      personality_analysis: analysisResult.personality_analysis,
      career_recommendations: analysisResult.career_recommendations,
      hobby_suggestions: analysisResult.hobby_suggestions,
      travel_recommendations: analysisResult.travel_recommendations,
      additional_insights: analysisResult.additional_insights
    });

    res.status(201).json({
      analysis: {
        id: analysis.id,
        personality_analysis: analysis.personality_analysis,
        career_recommendations: analysis.career_recommendations,
        hobby_suggestions: analysis.hobby_suggestions,
        travel_recommendations: analysis.travel_recommendations,
        additional_insights: analysis.additional_insights,
        created_at: analysis.created_at
      }
    });
  } catch (error) {
    console.error('분석 생성 에러:', error);
    res.status(500).json({
      message: '분석 생성 중 오류가 발생했습니다'
    });
  }
};

/**
 * 분석 히스토리 조회
 * GET /api/analysis/history
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 전체 개수 조회
    const { count, rows } = await Analysis.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      analyses: rows,
      total: count,
      page,
      totalPages
    });
  } catch (error) {
    console.error('히스토리 조회 에러:', error);
    res.status(500).json({
      message: '히스토리 조회 중 오류가 발생했습니다'
    });
  }
};

/**
 * 특정 분석 결과 조회
 * GET /api/analysis/:id
 */
const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await Analysis.findOne({
      where: { id }
    });

    if (!analysis) {
      return res.status(404).json({
        message: '분석 결과를 찾을 수 없습니다'
      });
    }

    // 권한 체크
    if (analysis.user_id !== userId) {
      return res.status(403).json({
        message: '다른 사용자의 분석 결과에 접근할 수 없습니다'
      });
    }

    res.json({
      analysis
    });
  } catch (error) {
    console.error('분석 조회 에러:', error);
    res.status(500).json({
      message: '분석 조회 중 오류가 발생했습니다'
    });
  }
};

module.exports = {
  createAnalysis,
  getHistory,
  getAnalysisById
};

