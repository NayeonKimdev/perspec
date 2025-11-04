import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, CheckCircle2, TrendingUp, Lightbulb, Target, AlertTriangle, Briefcase } from 'lucide-react';
import { reportApi } from '../services/api';
import { useToast } from '../components/Toast';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await reportApi.getReportById(id);
        setReport(response.data.report);
      } catch (error) {
        console.error('레포트 조회 실패:', error);
        setError('레포트를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // 동적으로 html2canvas와 jsPDF 로드
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const element = document.getElementById('report-content');
      if (!element) {
        toast.error('레포트 내용을 찾을 수 없습니다.');
        setDownloading(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${report?.title || 'report'}.pdf`);
      toast.success('PDF 다운로드가 완료되었습니다!');
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      toast.error('PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">레포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '레포트를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/reports')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'summary', title: '전체 요약', icon: CheckCircle2 },
    { id: 'personality', title: '성격 분석', icon: TrendingUp },
    { id: 'strengths', title: '강점 및 재능', icon: Lightbulb },
    { id: 'improvements', title: '개선 영역', icon: Target },
    { id: 'career', title: '커리어 제안', icon: Briefcase },
    { id: 'lifestyle', title: '라이프스타일 추천', icon: Lightbulb },
    { id: 'relationship', title: '관계 스타일', icon: TrendingUp },
    { id: 'roadmap', title: '성장 로드맵', icon: Target },
    { id: 'cautions', title: '주의사항', icon: AlertTriangle }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto w-full">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{report.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  생성일: {new Date(report.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span>{downloading ? '다운로드 중...' : 'PDF 다운로드'}</span>
                </button>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    toast.success('레포트 링크가 복사되었습니다!');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>공유</span>
                </button>
              </div>
            </div>
          </div>

          {/* 목차 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors duration-200">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">목차</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center space-x-2 text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 레포트 내용 */}
        <div id="report-content" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 prose prose-lg max-w-none transition-colors duration-200">
          {/* 전체 요약 */}
          {report.summary && (
            <section id="summary" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>전체 요약</span>
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {report.summary}
              </div>
            </section>
          )}

          {/* 성격 분석 */}
          {report.personality && (
            <section id="personality" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>성격 종합 분석</span>
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {report.personality}
              </div>
            </section>
          )}

          {/* 강점 및 재능 */}
          {report.strengths && report.strengths.length > 0 && (
            <section id="strengths" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Lightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>강점 및 재능</span>
              </h2>
              <ul className="space-y-3">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300">{strength}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 개선 영역 */}
          {report.improvements && report.improvements.length > 0 && (
            <section id="improvements" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>개선이 필요한 영역</span>
              </h2>
              <ul className="space-y-3">
                {report.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300">{improvement}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 커리어 제안 */}
          {report.career_suggestions && report.career_suggestions.length > 0 && (
            <section id="career" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>커리어 방향 제안</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.career_suggestions.map((career, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <p className="text-gray-800 font-medium">{career}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 라이프스타일 추천 */}
          {report.lifestyle_recommendations && report.lifestyle_recommendations.length > 0 && (
            <section id="lifestyle" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Lightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>라이프스타일 추천</span>
              </h2>
              <ul className="space-y-3">
                {report.lifestyle_recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{recommendation}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 관계 스타일 */}
          {report.relationship_style && (
            <section id="relationship" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>관계 및 소통 스타일</span>
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {report.relationship_style}
              </div>
            </section>
          )}

          {/* 성장 로드맵 */}
          {report.growth_roadmap && report.growth_roadmap.length > 0 && (
            <section id="roadmap" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>성장 로드맵</span>
              </h2>
              <ol className="space-y-4">
                {report.growth_roadmap.map((step, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* 주의사항 */}
          {report.cautions && report.cautions.length > 0 && (
            <section id="cautions" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <span>주의사항 및 조언</span>
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <ul className="space-y-3">
                  {report.cautions.map((caution, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-yellow-900">{caution}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;


