const Analysis = require('../models/Analysis');
const Profile = require('../models/Profile');
const Media = require('../models/Media');
const { Op } = require('sequelize');
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
    const dateFilter = req.query.date_filter; // today, week, month, all
    const query = req.query.q; // 검색어

    // 조건 설정
    const where = { user_id: userId };

    // 날짜 필터
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      where.created_at = {
        [Op.gte]: startDate
      };
    }

    // 검색어 필터
    if (query && query.trim().length > 0) {
      where[Op.or] = [
        { personality_analysis: { [Op.iLike]: `%${query}%` } },
        { career_recommendations: { [Op.iLike]: `%${query}%` } },
        { hobby_suggestions: { [Op.iLike]: `%${query}%` } },
        { travel_recommendations: { [Op.iLike]: `%${query}%` } },
        { additional_insights: { [Op.iLike]: `%${query}%` } }
      ];
    }

    // 전체 개수 조회
    const { count, rows } = await Analysis.findAndCountAll({
      where,
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

/**
 * 향상된 분석 생성 (프로필 + 이미지)
 * POST /api/analysis/create-enhanced
 */
const createEnhancedAnalysis = async (req, res) => {
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

    // 이미지 분석 요약 조회
    const allMedia = await Media.findAll({
      where: { user_id: userId }
    });

    const completedMedia = allMedia.filter(m => m.analysis_status === 'completed');
    
    if (completedMedia.length === 0) {
      return res.status(400).json({
        message: '분석된 이미지가 없습니다. 이미지를 업로드하고 분석이 완료되면 다시 시도해주세요.'
      });
    }

    // 이미지 분석 데이터 집계
    const interestsCount = {};
    const keywordsCount = {};
    const moodsList = [];
    
    completedMedia.forEach(media => {
      if (media.analysis_result && Array.isArray(media.analysis_result.inferred_interests)) {
        media.analysis_result.inferred_interests.forEach(interest => {
          interestsCount[interest] = (interestsCount[interest] || 0) + 1;
        });
      }
      if (media.analysis_result && Array.isArray(media.analysis_result.keywords)) {
        media.analysis_result.keywords.forEach(keyword => {
          keywordsCount[keyword] = (keywordsCount[keyword] || 0) + 1;
        });
      }
      if (media.analysis_result && media.analysis_result.mood) {
        moodsList.push(media.analysis_result.mood);
      }
    });

    const topInterests = Object.entries(interestsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interest, count]) => ({ interest, count }));

    const topKeywords = Object.entries(keywordsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // 프로필 데이터 구성
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

    // 통합 프롬프트 생성
    const enhancedPrompt = `당신은 전문 심리 분석가입니다. 다음 정보를 종합하여 사용자를 분석해주세요.

[텍스트 프로필]
취향: ${profileData.interests || '없음'}
취미: ${profileData.hobbies || '없음'}
성격: ${profileData.personality || '없음'}
꿈: ${profileData.dreams || '없음'}
이상형: ${profileData.ideal_type || '없음'}
고민: ${profileData.concerns || '없음'}
데이트 스타일: ${profileData.dating_style || '없음'}
기타 정보: ${profileData.other_info || '없음'}

[이미지 분석 데이터]
주요 관심사: ${topInterests.map(i => `${i.interest}(${i.count}회)`).join(', ')}
자주 등장하는 키워드: ${topKeywords.map(k => `${k.keyword}(${k.count}회)`).join(', ')}
전반적인 분위기: ${[...new Set(moodsList)].join(', ')}

텍스트 프로필과 이미지 분석 결과를 종합하여:
1. 더 정확한 성격 분석
2. 실제 관심사와 행동 패턴
3. 숨겨진 성향이나 가치관
4. 맞춤형 추천 (진로, 취미, 여행지)

를 제공해주세요. 각 섹션은 최소 150-200자 이상 작성해주세요.`;

    // AI 분석 실행
    let analysisResult;
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 전문 심리 분석가이자 커리어 컨설턴트입니다. 텍스트와 이미지 데이터를 종합하여 상세하고 구체적인 인사이트를 제공해주세요.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const rawResponse = completion.choices[0].message.content;

      // 응답 파싱
      const { parseAIResponse } = require('../services/responseParser');
      analysisResult = parseAIResponse(rawResponse);
    } catch (error) {
      console.error('AI 분석 에러:', error);
      return res.status(503).json({
        message: 'AI 분석 서비스를 일시적으로 사용할 수 없습니다'
      });
    }

    // 이미지 분석 요약 저장
    const imageSummary = {
      analyzed_images: completedMedia.length,
      top_interests: topInterests,
      top_keywords: topKeywords,
      common_moods: [...new Set(moodsList)]
    };

    // 분석 결과 저장
    const analysis = await Analysis.create({
      user_id: userId,
      profile_snapshot: profileData,
      personality_analysis: analysisResult.personality_analysis,
      career_recommendations: analysisResult.career_recommendations,
      hobby_suggestions: analysisResult.hobby_suggestions,
      travel_recommendations: analysisResult.travel_recommendations,
      additional_insights: analysisResult.additional_insights,
      is_enhanced: true,
      image_analysis_summary: imageSummary
    });

    res.status(201).json({
      analysis: {
        id: analysis.id,
        is_enhanced: true,
        personality_analysis: analysis.personality_analysis,
        career_recommendations: analysis.career_recommendations,
        hobby_suggestions: analysis.hobby_suggestions,
        travel_recommendations: analysis.travel_recommendations,
        additional_insights: analysis.additional_insights,
        image_summary: imageSummary,
        created_at: analysis.created_at
      }
    });
  } catch (error) {
    console.error('향상된 분석 생성 에러:', error);
    res.status(500).json({
      message: '향상된 분석 생성 중 오류가 발생했습니다'
    });
  }
};

module.exports = {
  createAnalysis,
  createEnhancedAnalysis,
  getHistory,
  getAnalysisById
};

