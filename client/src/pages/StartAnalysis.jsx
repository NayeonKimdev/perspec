import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';

const StartAnalysis = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    interests: '',
    hobbies: '',
    ideal_type: '',
    ideal_life: '',
    current_job: '',
    future_dream: '',
    personality: '',
    concerns: '',
    dreams: '',
    dating_style: '',
    other_info: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/profile');
        if (response.data.profile) {
          setProfile(response.data.profile);
          setProfileData(response.data.profile);
        }
      } catch (err) {
        console.error('프로필 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 실제 프로필 필드 정의 (ProfileForm에 정의된 8개 필드)
  const profileFields = [
    { key: 'interests', label: '좋아하는 것' },
    { key: 'hobbies', label: '취미 활동' },
    { key: 'personality', label: '성격 특징' },
    { key: 'dreams', label: '꿈/희망' },
    { key: 'ideal_type', label: '이상형' },
    { key: 'concerns', label: '현재 고민' },
    { key: 'dating_style', label: '연애 스타일' },
    { key: 'other_info', label: '기타 정보' }
  ];

  const countFilledFields = () => {
    return profileFields.filter(field => {
      const value = profileData[field.key];
      return value && value.trim() !== '';
    }).length;
  };

  const getMissingFields = () => {
    return profileFields
      .filter(field => {
        const value = profileData[field.key];
        return !value || value.trim() === '';
      })
      .map(field => field.label);
  };

  const handleStartAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // AI 분석은 시간이 오래 걸리므로 timeout을 60초로 설정
      const response = await api.post('/analysis/create', {}, {
        timeout: 60000 // 60초
      });
      
      // 분석 완료 후 결과 페이지로 이동
      navigate(`/analysis/${response.data.analysis.id}`);
    } catch (err) {
      console.error('분석 실패:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(err.response?.data?.message || '분석 중 오류가 발생했습니다');
      }
      
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            프로필이 필요합니다
          </h2>
          <p className="text-gray-600 mb-6">
            AI 분석을 시작하려면 먼저 프로필을 작성해주세요
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              프로필 작성하기
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filledCount = countFilledFields();
  const missingFields = getMissingFields();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            프로필 분석하기
          </h1>
          <p className="text-gray-600">
            AI가 당신의 프로필을 분석하여 성격, 진로, 취미, 여행지를 추천해드립니다
          </p>
        </div>

        {/* 프로필 요약 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">현재 프로필</h2>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                작성된 항목
              </span>
              <span className="text-sm font-bold text-blue-600">
                {filledCount}개 작성됨
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / profileFields.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {missingFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm font-medium text-yellow-800">
                  더 자세한 프로필을 작성하면 더 정확한 분석이 가능합니다
                </p>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                미작성 항목: {missingFields.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* 분석 시작 버튼 */}
        {analyzing ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-transparent mb-4"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              AI가 분석 중입니다
            </h3>
            <p className="text-gray-600 mb-4">
              당신의 프로필을 종합적으로 분석하고 있습니다...
            </p>
            <p className="text-sm text-gray-500">
              예상 소요 시간: 약 30초
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg p-8 text-center">
            <div className="bg-white/20 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 text-sm text-left">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">분석 중 오류가 발생했습니다</p>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-4">
              분석을 시작하시겠습니까?
            </h2>
            <p className="text-white/90 mb-6">
              AI가 프로필 데이터를 바탕으로 맞춤형 분석 결과를 제공합니다
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleStartAnalysis}
                className="w-full bg-white text-purple-600 px-6 py-4 rounded-lg hover:bg-gray-100 transition font-bold text-lg shadow-lg"
                disabled={analyzing}
              >
                <div className="flex items-center justify-center gap-2">
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      분석 시작하기
                    </>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="w-full bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition"
              >
                프로필 수정하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartAnalysis;

