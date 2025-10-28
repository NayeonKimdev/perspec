import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProfileForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    interests: '',
    hobbies: '',
    personality: '',
    dreams: '',
    ideal_type: '',
    concerns: '',
    dating_style: '',
    other_info: ''
  });

  const [selectedTags, setSelectedTags] = useState({
    interests: [],
    hobbies: [],
    personality: [],
    dreams: [],
    ideal_type: [],
    concerns: [],
    dating_style: [],
    other_info: []
  });

  const [customTags, setCustomTags] = useState({
    interests: [],
    hobbies: [],
    personality: [],
    dreams: [],
    ideal_type: [],
    concerns: [],
    dating_style: [],
    other_info: []
  });

  const [newTagInputs, setNewTagInputs] = useState({
    interests: '',
    hobbies: '',
    personality: '',
    dreams: '',
    ideal_type: '',
    concerns: '',
    dating_style: '',
    other_info: ''
  });

  // 태그 데이터 (더 다양하게)
  const tagOptions = {
    interests: [
      { id: 1, label: '잔잔한 인디 팝', color: 'bg-blue-100 text-blue-800' },
      { id: 2, label: 'SF 영화', color: 'bg-purple-100 text-purple-800' },
      { id: 3, label: '하루키 소설', color: 'bg-green-100 text-green-800' },
      { id: 4, label: '핸드드립 커피', color: 'bg-amber-100 text-amber-800' },
      { id: 5, label: '클래식 음악', color: 'bg-gray-100 text-gray-800' },
      { id: 6, label: '판타지 소설', color: 'bg-pink-100 text-pink-800' },
      { id: 7, label: '일본 음식', color: 'bg-red-100 text-red-800' },
      { id: 8, label: '사진 촬영', color: 'bg-teal-100 text-teal-800' },
      { id: 9, label: '록 음악', color: 'bg-red-100 text-red-800' },
      { id: 10, label: '로맨틱 코미디', color: 'bg-pink-100 text-pink-800' },
      { id: 11, label: '추리 소설', color: 'bg-indigo-100 text-indigo-800' },
      { id: 12, label: '맛집 탐방', color: 'bg-orange-100 text-orange-800' },
      { id: 13, label: '재즈', color: 'bg-slate-100 text-slate-800' },
      { id: 14, label: '블랙 앤 화이트 영화', color: 'bg-gray-100 text-gray-800' },
      { id: 15, label: '시집', color: 'bg-violet-100 text-violet-800' },
      { id: 16, label: '디저트', color: 'bg-pink-100 text-pink-800' }
    ],
    hobbies: [
      { id: 1, label: '등산과 캠핑', color: 'bg-green-100 text-green-800' },
      { id: 2, label: '키보드 커스텀', color: 'bg-blue-100 text-blue-800' },
      { id: 3, label: '플랜테리어', color: 'bg-emerald-100 text-emerald-800' },
      { id: 4, label: '웹툰 추적', color: 'bg-pink-100 text-pink-800' },
      { id: 5, label: '요리', color: 'bg-orange-100 text-orange-800' },
      { id: 6, label: '독서', color: 'bg-indigo-100 text-indigo-800' },
      { id: 7, label: '게임', color: 'bg-violet-100 text-violet-800' },
      { id: 8, label: '운동', color: 'bg-red-100 text-red-800' },
      { id: 9, label: '강아지 산책', color: 'bg-yellow-100 text-yellow-800' },
      { id: 10, label: '뜨개질', color: 'bg-pink-100 text-pink-800' },
      { id: 11, label: '피아노', color: 'bg-gray-100 text-gray-800' },
      { id: 12, label: '볼링', color: 'bg-blue-100 text-blue-800' },
      { id: 13, label: '스케이트보드', color: 'bg-orange-100 text-orange-800' },
      { id: 14, label: '영화 감상', color: 'bg-purple-100 text-purple-800' },
      { id: 15, label: '노래 부르기', color: 'bg-rose-100 text-rose-800' },
      { id: 16, label: '요가', color: 'bg-teal-100 text-teal-800' }
    ],
    personality: [
      { id: 1, label: 'INFP', color: 'bg-purple-100 text-purple-800' },
      { id: 2, label: '혼자만의 시간', color: 'bg-blue-100 text-blue-800' },
      { id: 3, label: '꼼꼼한 계획력', color: 'bg-teal-100 text-teal-800' },
      { id: 4, label: '배우는 것을 좋아함', color: 'bg-green-100 text-green-800' },
      { id: 5, label: 'ENFJ', color: 'bg-pink-100 text-pink-800' },
      { id: 6, label: '즉흥적', color: 'bg-yellow-100 text-yellow-800' },
      { id: 7, label: '이타적', color: 'bg-rose-100 text-rose-800' },
      { id: 8, label: '창의적', color: 'bg-violet-100 text-violet-800' },
      { id: 9, label: 'ENTP', color: 'bg-orange-100 text-orange-800' },
      { id: 10, label: '내향적', color: 'bg-indigo-100 text-indigo-800' },
      { id: 11, label: '외향적', color: 'bg-yellow-100 text-yellow-800' },
      { id: 12, label: '감성적', color: 'bg-pink-100 text-pink-800' },
      { id: 13, label: '논리적', color: 'bg-blue-100 text-blue-800' },
      { id: 14, label: '긍정적', color: 'bg-green-100 text-green-800' },
      { id: 15, label: '철두철미한', color: 'bg-gray-100 text-gray-800' },
      { id: 16, label: '열린 마음', color: 'bg-cyan-100 text-cyan-800' }
    ],
    dreams: [
      { id: 1, label: '자격증 따기', color: 'bg-blue-100 text-blue-800' },
      { id: 2, label: '북유럽 오로라', color: 'bg-cyan-100 text-cyan-800' },
      { id: 3, label: 'AI 엔지니어', color: 'bg-purple-100 text-purple-800' },
      { id: 4, label: '버킷리스트', color: 'bg-pink-100 text-pink-800' },
      { id: 5, label: '해외 여행', color: 'bg-yellow-100 text-yellow-800' },
      { id: 6, label: '마라톤 완주', color: 'bg-green-100 text-green-800' },
      { id: 7, label: '창업', color: 'bg-orange-100 text-orange-800' },
      { id: 8, label: '봉사 활동', color: 'bg-red-100 text-red-800' },
      { id: 9, label: '몬테네그로 여행', color: 'bg-teal-100 text-teal-800' },
      { id: 10, label: '커리어 전환', color: 'bg-indigo-100 text-indigo-800' },
      { id: 11, label: '언어 배우기', color: 'bg-violet-100 text-violet-800' },
      { id: 12, label: '집 마련', color: 'bg-amber-100 text-amber-800' },
      { id: 13, label: '책 출간', color: 'bg-rose-100 text-rose-800' },
      { id: 14, label: '운동 습관', color: 'bg-emerald-100 text-emerald-800' },
      { id: 15, label: '주식 투자', color: 'bg-slate-100 text-slate-800' },
      { id: 16, label: '사이드 프로젝트', color: 'bg-orange-100 text-orange-800' }
    ],
    ideal_type: [
      { id: 1, label: '유머 감각', color: 'bg-yellow-100 text-yellow-800' },
      { id: 2, label: '대화가 잘 통함', color: 'bg-blue-100 text-blue-800' },
      { id: 3, label: '공간 존중', color: 'bg-gray-100 text-gray-800' },
      { id: 4, label: '성장할 수 있는', color: 'bg-green-100 text-green-800' },
      { id: 5, label: '진지한 사람', color: 'bg-slate-100 text-slate-800' },
      { id: 6, label: '배려심 많음', color: 'bg-pink-100 text-pink-800' },
      { id: 7, label: '독립적', color: 'bg-violet-100 text-violet-800' },
      { id: 8, label: '열정적', color: 'bg-red-100 text-red-800' },
      { id: 9, label: '리더십', color: 'bg-amber-100 text-amber-800' },
      { id: 10, label: '긍정적 에너지', color: 'bg-green-100 text-green-800' },
      { id: 11, label: '지적 호기심', color: 'bg-indigo-100 text-indigo-800' },
      { id: 12, label: '솔직함', color: 'bg-teal-100 text-teal-800' },
      { id: 13, label: '열린 생각', color: 'bg-cyan-100 text-cyan-800' },
      { id: 14, label: '도전적', color: 'bg-orange-100 text-orange-800' },
      { id: 15, label: '여유로운 사람', color: 'bg-purple-100 text-purple-800' },
      { id: 16, label: '깊이 있는 대화', color: 'bg-gray-100 text-gray-800' }
    ],
    concerns: [
      { id: 1, label: 'AI 기술 학습', color: 'bg-purple-100 text-purple-800' },
      { id: 2, label: '진로 결정', color: 'bg-blue-100 text-blue-800' },
      { id: 3, label: '건강 관리', color: 'bg-green-100 text-green-800' },
      { id: 4, label: 'work-life balance', color: 'bg-teal-100 text-teal-800' },
      { id: 5, label: '인간관계', color: 'bg-pink-100 text-pink-800' },
      { id: 6, label: '재정 관리', color: 'bg-yellow-100 text-yellow-800' },
      { id: 7, label: '시간 관리', color: 'bg-orange-100 text-orange-800' },
      { id: 8, label: '자기계발', color: 'bg-indigo-100 text-indigo-800' },
      { id: 9, label: '스트레스 관리', color: 'bg-red-100 text-red-800' },
      { id: 10, label: '취업 준비', color: 'bg-amber-100 text-amber-800' },
      { id: 11, label: '코딩 테스트', color: 'bg-violet-100 text-violet-800' },
      { id: 12, label: '이직 고민', color: 'bg-slate-100 text-slate-800' },
      { id: 13, label: '외국어 실력', color: 'bg-cyan-100 text-cyan-800' },
      { id: 14, label: '불안감 극복', color: 'bg-rose-100 text-rose-800' },
      { id: 15, label: '목표 설정', color: 'bg-emerald-100 text-emerald-800' },
      { id: 16, label: '성장 속도', color: 'bg-blue-100 text-blue-800' }
    ],
    dating_style: [
      { id: 1, label: '따뜻한 관심', color: 'bg-red-100 text-red-800' },
      { id: 2, label: '배려심 많음', color: 'bg-pink-100 text-pink-800' },
      { id: 3, label: '성장형 관계', color: 'bg-green-100 text-green-800' },
      { id: 4, label: '의존하지 않는', color: 'bg-blue-100 text-blue-800' },
      { id: 5, label: '서로 독립적', color: 'bg-gray-100 text-gray-800' },
      { id: 6, label: '커뮤니케이션', color: 'bg-cyan-100 text-cyan-800' },
      { id: 7, label: '로맨틱', color: 'bg-rose-100 text-rose-800' },
      { id: 8, label: '성숙한 관계', color: 'bg-indigo-100 text-indigo-800' },
      { id: 9, label: '직진 형', color: 'bg-orange-100 text-orange-800' },
      { id: 10, label: '서서히 발전', color: 'bg-purple-100 text-purple-800' },
      { id: 11, label: '깊은 공감', color: 'bg-teal-100 text-teal-800' },
      { id: 12, label: '유머 있는', color: 'bg-yellow-100 text-yellow-800' },
      { id: 13, label: '리액션 좋은', color: 'bg-emerald-100 text-emerald-800' },
      { id: 14, label: '진지한 대화', color: 'bg-slate-100 text-slate-800' },
      { id: 15, label: '함께 성장', color: 'bg-violet-100 text-violet-800' },
      { id: 16, label: '균형잡힌', color: 'bg-amber-100 text-amber-800' }
    ],
    other_info: [
      { id: 1, label: '빗소리와 책', color: 'bg-gray-100 text-gray-800' },
      { id: 2, label: '아침 햇살', color: 'bg-yellow-100 text-yellow-800' },
      { id: 3, label: '맛있는 디저트', color: 'bg-pink-100 text-pink-800' },
      { id: 4, label: '소확행', color: 'bg-blue-100 text-blue-800' },
      { id: 5, label: '카페 분위기', color: 'bg-amber-100 text-amber-800' },
      { id: 6, label: '여유로운 주말', color: 'bg-green-100 text-green-800' },
      { id: 7, label: '취침 전 독서', color: 'bg-purple-100 text-purple-800' },
      { id: 8, label: '좋은 음악', color: 'bg-teal-100 text-teal-800' },
      { id: 9, label: '따뜻한 차 한잔', color: 'bg-orange-100 text-orange-800' },
      { id: 10, label: '산책하면서 생각', color: 'bg-emerald-100 text-emerald-800' },
      { id: 11, label: '새로운 카페 발견', color: 'bg-amber-100 text-amber-800' },
      { id: 12, label: '감동적인 영화', color: 'bg-violet-100 text-violet-800' },
      { id: 13, label: '생긴 플랜트 새싹', color: 'bg-green-100 text-green-800' },
      { id: 14, label: '기대되는 소포', color: 'bg-cyan-100 text-cyan-800' },
      { id: 15, label: '복잡한 퍼즐 완성', color: 'bg-indigo-100 text-indigo-800' },
      { id: 16, label: '별 보는 밤', color: 'bg-slate-100 text-slate-800' }
    ]
  };

  // 기존 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get('/profile');
        if (response.data.profile) {
          const profile = response.data.profile;
          setFormData({
            interests: profile.interests || '',
            hobbies: profile.hobbies || '',
            personality: profile.personality || '',
            dreams: profile.dreams || '',
            ideal_type: profile.ideal_type || '',
            concerns: profile.concerns || '',
            dating_style: profile.dating_style || '',
            other_info: profile.other_info || ''
          });
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 태그 선택 처리
  const handleTagClick = (fieldName, tag) => {
    setSelectedTags(prev => {
      const currentTags = prev[fieldName];
      const isSelected = currentTags.some(t => t.id === tag.id);
      
      if (isSelected) {
        // 태그 제거: 해당 태그 라벨을 텍스트에서 제거
        setFormData(prev => {
          const currentText = prev[fieldName];
          // 태그 라벨을 콤마로 분리해서 제거
          const tags = currentText.split(',').map(t => t.trim()).filter(t => t !== tag.label);
          const newText = tags.join(', ');
          return {
            ...prev,
            [fieldName]: newText
          };
        });
        return { ...prev, [fieldName]: currentTags.filter(t => t.id !== tag.id) };
      } else {
        // 태그 추가: 기존 텍스트 끝에 추가 (기존 내용 보존)
        setFormData(prev => {
          const currentText = prev[fieldName];
          // 이미 같은 태그가 있는지 확인
          const tags = currentText.split(',').map(t => t.trim());
          if (tags.includes(tag.label)) {
            return prev; // 이미 있으면 추가하지 않음
          }
          // 기존 내용이 있으면 콤마로 구분, 없으면 그냥 추가
          const newText = currentText 
            ? `${currentText}, ${tag.label}` 
            : tag.label;
          return {
            ...prev,
            [fieldName]: newText
          };
        });
        return { ...prev, [fieldName]: [...currentTags, tag] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (filledFieldsCount < 3) {
      setMessage('⚠️ 최소 3개 이상의 필드를 10자 이상 작성해주세요.');
      setSuccess(false);
      return;
    }

    setSaving(true);
    setMessage('');
    setSuccess(false);

    try {
      const response = await api.post('/profile', formData);
      setSuccess(true);
      setMessage(response.data.message);
      
      setTimeout(() => {
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setMessage(error.response?.data?.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filledFieldsCount = Object.values(formData).filter(field => field.trim().length >= 10).length;
  const totalFields = 8;
  const canSave = filledFieldsCount >= 3;

  const TagSelector = ({ fieldName, title }) => {
    const tags = tagOptions[fieldName];
    const selected = selectedTags[fieldName];

    return (
      <div className="mb-2">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => {
            const isSelected = selected.some(s => s.id === tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagClick(fieldName, tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  isSelected 
                    ? `${tag.color} shadow-md border-2 border-blue-400` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">프로필 작성하기</h1>
          <p className="mt-2 text-sm text-gray-600">
            {totalFields}개 중 <span className="font-semibold text-blue-600">{filledFieldsCount}</span>개 작성됨 (각 10자 이상)
          </p>
        </div>

        {/* 알림 메시지 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* 작성 진행 상황 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">작성 진행도</span>
            <span className="text-sm text-blue-700">{filledFieldsCount}개 완료</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(filledFieldsCount / totalFields) * 100}%` }}
            />
          </div>
          {!canSave && (
            <p className="mt-2 text-sm text-blue-700">
              💡 최소 3개 이상의 필드를 10자 이상 작성하세요 ({filledFieldsCount}/3)
            </p>
          )}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-8">
          {/* 좋아하는 것 */}
          <div className="mb-6">
            <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
              좋아하는 것 (음악, 영화, 책, 음식 등)
            </label>
            <TagSelector fieldName="interests" />
            <textarea
              id="interests"
              name="interests"
              rows="3"
              value={formData.interests}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 취미 활동 */}
          <div className="mb-6">
            <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-2">
              취미 활동 (주말 활동, 최근 관심사)
            </label>
            <TagSelector fieldName="hobbies" />
            <textarea
              id="hobbies"
              name="hobbies"
              rows="3"
              value={formData.hobbies}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 성격 특징 */}
          <div className="mb-6">
            <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-2">
              성격 특징 (MBTI, 에너지 원천, 장점)
            </label>
            <TagSelector fieldName="personality" />
            <textarea
              id="personality"
              name="personality"
              rows="3"
              value={formData.personality}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 목표와 꿈 */}
          <div className="mb-6">
            <label htmlFor="dreams" className="block text-sm font-medium text-gray-700 mb-2">
              목표와 꿈 (올해 목표, 버킷리스트)
            </label>
            <TagSelector fieldName="dreams" />
            <textarea
              id="dreams"
              name="dreams"
              rows="3"
              value={formData.dreams}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 이상형 */}
          <div className="mb-6">
            <label htmlFor="ideal_type" className="block text-sm font-medium text-gray-700 mb-2">
              이상형 (좋아하는 사람 스타일)
            </label>
            <TagSelector fieldName="ideal_type" />
            <textarea
              id="ideal_type"
              name="ideal_type"
              rows="3"
              value={formData.ideal_type}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 현재 고민 */}
          <div className="mb-6">
            <label htmlFor="concerns" className="block text-sm font-medium text-gray-700 mb-2">
              현재 고민 (최근 도전, 관심 주제)
            </label>
            <TagSelector fieldName="concerns" />
            <textarea
              id="concerns"
              name="concerns"
              rows="3"
              value={formData.concerns}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 연애 스타일 */}
          <div className="mb-6">
            <label htmlFor="dating_style" className="block text-sm font-medium text-gray-700 mb-2">
              연애 스타일 (친구관계, 인간관계)
            </label>
            <TagSelector fieldName="dating_style" />
            <textarea
              id="dating_style"
              name="dating_style"
              rows="3"
              value={formData.dating_style}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 기타 정보 */}
          <div className="mb-6">
            <label htmlFor="other_info" className="block text-sm font-medium text-gray-700 mb-2">
              기타 정보 (소소한 즐거움, 특별한 경험 등)
            </label>
            <TagSelector fieldName="other_info" />
            <textarea
              id="other_info"
              name="other_info"
              rows="3"
              value={formData.other_info}
              onChange={handleChange}
              placeholder="태그를 선택하거나 직접 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 버튼 */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving || loading || !canSave}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {saving ? '저장 중...' : canSave ? '저장하기' : '저장 불가 (최소 3개 필드 필요)'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
