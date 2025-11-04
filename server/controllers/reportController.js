const Report = require('../models/Report');
const { generateComprehensiveReport } = require('../services/reportService');

/**
 * 종합 레포트 생성
 */
const createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    // reportService를 호출하여 레포트 생성
    const result = await generateComprehensiveReport(userId, title);

    // 데이터 부족 에러 처리
    if (result.error === 'INSUFFICIENT_DATA') {
      return res.status(400).json({
        message: result.message,
        dataSources: result.dataSources
      });
    }

    // 결과를 DB에 저장
    const report = await Report.create({
      user_id: userId,
      title: result.title,
      summary: result.summary || '',
      personality: result.personality || '',
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      career_suggestions: result.career_suggestions || [],
      lifestyle_recommendations: result.lifestyle_recommendations || [],
      relationship_style: result.relationship_style || '',
      growth_roadmap: result.growth_roadmap || [],
      cautions: result.cautions || [],
      data_sources: result.data_sources || {}
    });

    return res.status(201).json({
      message: '종합 레포트가 생성되었습니다.',
      report: {
        id: report.id,
        title: report.title,
        summary: report.summary,
        personality: report.personality,
        strengths: report.strengths,
        improvements: report.improvements,
        career_suggestions: report.career_suggestions,
        lifestyle_recommendations: report.lifestyle_recommendations,
        relationship_style: report.relationship_style,
        growth_roadmap: report.growth_roadmap,
        cautions: report.cautions,
        data_sources: report.data_sources,
        created_at: report.created_at
      }
    });

  } catch (error) {
    console.error('레포트 생성 에러:', error);
    
    // API 에러 처리
    if (error.message.includes('AI 분석 서비스에 연결할 수 없습니다')) {
      return res.status(503).json({
        message: 'AI 분석 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        error: error.message
      });
    }

    return res.status(500).json({
      message: '레포트 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 레포트 목록 조회
 */
const getReportList = async (req, res) => {
  try {
    const userId = req.user.id;

    const reports = await Report.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'created_at']
    });

    return res.status(200).json({
      reports: reports.map(report => ({
        id: report.id,
        title: report.title,
        created_at: report.created_at
      }))
    });

  } catch (error) {
    console.error('레포트 목록 조회 에러:', error);
    return res.status(500).json({
      message: '레포트 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 특정 레포트 조회
 */
const getReportById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const report = await Report.findOne({
      where: {
        id: id,
        user_id: userId // 권한 확인
      }
    });

    if (!report) {
      return res.status(404).json({
        message: '레포트를 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      report: {
        id: report.id,
        title: report.title,
        summary: report.summary,
        personality: report.personality,
        strengths: report.strengths,
        improvements: report.improvements,
        career_suggestions: report.career_suggestions,
        lifestyle_recommendations: report.lifestyle_recommendations,
        relationship_style: report.relationship_style,
        growth_roadmap: report.growth_roadmap,
        cautions: report.cautions,
        data_sources: report.data_sources,
        created_at: report.created_at,
        updated_at: report.updated_at
      }
    });

  } catch (error) {
    console.error('레포트 조회 에러:', error);
    return res.status(500).json({
      message: '레포트 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  createReport,
  getReportList,
  getReportById
};


