import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Loader2, Sparkles, Calendar } from 'lucide-react';
import api from '../services/api';
import { mediaApi, documentApi, reportApi, mbtiApi, emotionApi } from '../services/api';

const ReportGeneration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [dataCounts, setDataCounts] = useState({
    hasProfile: false,
    hasMBTI: false,
    hasEmotion: false,
    imageCount: 0,
    documentCount: 0,
    analysisCount: 0
  });
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 프로필 확인
        const profileRes = await api.get('/profile');
        const hasProfile = profileRes.data.profile !== null;

        // 이미지 개수
        const mediaRes = await mediaApi.getMediaList();
        const imageCount = mediaRes.data.total || 0;

        // 문서 개수
        const docRes = await documentApi.getDocumentList();
        const documentCount = docRes.data.total || 0;

        // 분석 개수
        let analysisCount = 0;
        try {
          const analysisRes = await api.get('/analysis/history');
          analysisCount = analysisRes.data.analyses?.length || 0;
        } catch (error) {
          console.error('분석 조회 실패:', error);
        }

        // MBTI 확인
        let hasMBTI = false;
        try {
          const mbtiRes = await mbtiApi.getHistory();
          hasMBTI = mbtiRes.data.estimations && mbtiRes.data.estimations.length > 0;
        } catch (error) {
          console.error('MBTI 조회 실패:', error);
        }

        // 감정 분석 확인
        let hasEmotion = false;
        try {
          await emotionApi.getLatestAnalysis();
          hasEmotion = true;
        } catch (error) {
          // 404면 없음
        }

        // 기존 레포트 목록
        try {
          const reportRes = await reportApi.getReportList();
          setReports(reportRes.data.reports || []);
        } catch (error) {
          console.error('레포트 목록 조회 실패:', error);
        }

        setDataCounts({
          hasProfile,
          hasMBTI,
          hasEmotion,
          imageCount,
          documentCount,
          analysisCount
        });
      } catch (error) {
        console.error('데이터 조회 실패:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const reportTitle = title || `종합 분석 레포트 - ${new Date().toLocaleDateString('ko-KR')}`;
      const response = await reportApi.generateReport(reportTitle);
      if (response.data.report) {
        navigate(`/reports/${response.data.report.id}`);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message || '충분한 데이터가 없습니다.');
      } else {
        alert('레포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      console.error('레포트 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDataPoints = (dataCounts.hasProfile ? 1 : 0) + 
    (dataCounts.hasMBTI ? 1 : 0) +
    (dataCounts.hasEmotion ? 1 : 0) +
    dataCounts.imageCount + 
    dataCounts.documentCount + 
    dataCounts.analysisCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            종합 분석 레포트 생성
          </h1>
          <p className="text-xl text-gray-600">
            모든 데이터를 종합하여 당신에 대한 완전한 분석 레포트를 생성합니다
          </p>
        </div>

        {/* 포함될 데이터 체크리스트 */}
        {!dataLoading && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              포함될 데이터
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {dataCounts.hasProfile ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">프로필 정보</span>
              </div>

              <div className="flex items-center space-x-3">
                {dataCounts.hasMBTI ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">MBTI 분석</span>
              </div>

              <div className="flex items-center space-x-3">
                {dataCounts.hasEmotion ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">감정 패턴</span>
              </div>

              <div className="flex items-center space-x-3">
                {dataCounts.imageCount > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">이미지 {dataCounts.imageCount}개</span>
              </div>

              <div className="flex items-center space-x-3">
                {dataCounts.documentCount > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">문서 {dataCounts.documentCount}개</span>
              </div>

              <div className="flex items-center space-x-3">
                {dataCounts.analysisCount > 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-gray-700">기존 분석 {dataCounts.analysisCount}개</span>
              </div>
            </div>
          </div>
        )}

        {/* 레포트 제목 입력 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            레포트 제목 (선택적)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 2025년 1월 종합 분석 레포트"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            제목을 입력하지 않으면 자동으로 생성됩니다.
          </p>
        </div>

        {/* 레포트 생성 버튼 */}
        <div className="text-center mb-12">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                AI가 종합 레포트를 작성하고 있습니다...
              </p>
              <p className="text-gray-500">
                이 작업은 1-3분 소요될 수 있습니다. 잠시만 기다려주세요...
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={totalDataPoints < 3 || loading}
              className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                <Sparkles className="w-6 h-6" />
                <span>레포트 생성</span>
              </div>
            </button>
          )}
        </div>

        {/* 기존 레포트 리스트 */}
        {reports.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              이전에 생성한 레포트
            </h2>
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-800">{report.title}</p>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    보기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGeneration;


