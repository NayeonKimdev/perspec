/**
 * AI 응답 파싱 서비스
 */

/**
 * AI 원시 응답을 구조화된 객체로 파싱
 */
const parseAIResponse = (rawResponse) => {
  try {
    const response = {
      personality_analysis: '',
      career_recommendations: '',
      hobby_suggestions: '',
      travel_recommendations: '',
      additional_insights: ''
    };

    console.log('=== AI 응답 파싱 시작 ===');
    console.log('응답 길이:', rawResponse.length);
    console.log('응답 내용 (처음 200자):', rawResponse.substring(0, 200));

    // 간단한 split 방식으로 섹션 분리
    const sections = rawResponse.split(/\*\*\d+\./);
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      
      // 콜론(:) 위치 찾기 (마지막 콜론 찾기)
      const lastColonIndex = section.lastIndexOf(':');
      if (lastColonIndex === -1) continue;
      
      const header = section.substring(0, lastColonIndex).replace(/\*\*/g, '').trim();
      let content = section.substring(lastColonIndex + 1).trim();
      
      // 콜론 이후의 ** 제거
      content = content.replace(/^\*\*\s*/, '').trim();
      
      // 다음 섹션 제거
      content = content.replace(/\*\*2\..*$/, '').replace(/\*\*3\..*$/, '').replace(/\*\*4\..*$/, '').trim();
      
      if (!content) continue;
      
      // 각 섹션 타입에 맞게 저장
      if (header.includes('성격 분석')) {
        response.personality_analysis = content;
        console.log('✓ 성격 분석 추출 성공');
      } else if (header.includes('추천 진로')) {
        response.career_recommendations = content;
        console.log('✓ 진로 추천 추출 성공');
      } else if (header.includes('취미 추천')) {
        response.hobby_suggestions = content;
        console.log('✓ 취미 추천 추출 성공');
      } else if (header.includes('여행지 추천')) {
        response.travel_recommendations = content;
        console.log('✓ 여행지 추천 추출 성공');
      }
    }

    // 파싱 성공 여부 확인
    const parsedCount = [
      response.personality_analysis,
      response.career_recommendations,
      response.hobby_suggestions,
      response.travel_recommendations
    ].filter(s => s && s.length > 0).length;

    console.log(`파싱된 섹션: ${parsedCount}/4`);

    // 파싱이 안 된 경우 전체 응답을 additional_insights에 저장
    if (parsedCount === 0) {
      console.log('전체 응답을 additional_insights에 저장');
      response.additional_insights = rawResponse;
    }

    console.log('=== AI 응답 파싱 완료 ===\n');
    return response;
  } catch (error) {
    console.error('AI 응답 파싱 에러:', error);
    return {
      personality_analysis: '',
      career_recommendations: '',
      hobby_suggestions: '',
      travel_recommendations: '',
      additional_insights: rawResponse
    };
  }
};

module.exports = {
  parseAIResponse
};

