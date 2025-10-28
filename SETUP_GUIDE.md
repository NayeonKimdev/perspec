# Perspec 프로젝트 설정 가이드

## 🚀 빠른 시작

### 1. 서버 재시작 필요
현재 서버를 중지하고 다시 시작하세요:

```bash
# 터미널에서 Ctrl+C로 서버 중지

# 서버 재시작
cd server
npm start
```

### 2. 문제 해결

#### 타임아웃 에러 해결됨 ✅
- 분석 API 호출 타임아웃을 10초 → 60초로 증가
- `StartAnalysis.jsx`에서 타임아웃 처리 개선

#### 서버 재시작 필요 ⚠️
새로 추가된 analysis 라우트를 사용하려면 서버 재시작이 필수입니다.

### 3. 환경 변수 확인
`server/.env` 파일에 OpenAI API 키가 있는지 확인:

```bash
OPENAI_API_KEY=sk-... # 여기에 실제 키가 있어야 함
```

### 4. 분석 기능 테스트

1. 대시보드에서 "분석 시작하기" 클릭
2. 프로필 확인 후 "분석 시작하기" 버튼 클릭
3. AI 분석 대기 (약 20-30초)
4. 분석 결과 확인

### 5. 에러 발생 시

#### "분석 시간이 초과되었습니다"
- 네트워크 연결 확인
- OpenAI API 상태 확인
- 서버 로그 확인

#### "요청한 리소스를 찾을 수 없습니다"
- 서버가 실행 중인지 확인
- 서버 콘솔에서 "✓ Analysis 라우트 로드 성공" 메시지 확인
- 서버 재시작

### 6. 서버 로그 확인
서버 콘솔에서 다음 메시지들을 확인하세요:

```
✓ Auth 라우트 로드 성공
✓ Profile 라우트 로드 성공
✓ Analysis 라우트 로드 성공
서버가 포트 5000에서 실행 중입니다.
```

만약 "✗ Analysis 라우트 로드 실패"가 보이면 에러 메시지를 확인하세요.

## 📝 주요 변경사항

### 추가된 파일
- `server/models/Analysis.js` - 분석 모델
- `server/controllers/analysisController.js` - 분석 컨트롤러
- `server/routes/analysis.js` - 분석 라우트
- `server/services/aiService.js` - AI 서비스
- `server/services/promptService.js` - 프롬프트 서비스
- `server/services/responseParser.js` - 응답 파서
- `client/src/pages/StartAnalysis.jsx` - 분석 시작 페이지
- `client/src/pages/AnalysisResult.jsx` - 분석 결과 페이지
- `client/src/pages/AnalysisHistory.jsx` - 분석 히스토리 페이지

### 수정된 파일
- `server/server.js` - analysis 라우트 추가
- `client/src/App.jsx` - 분석 페이지 라우트 추가
- `client/src/pages/Dashboard.jsx` - 분석 기능 추가
- `client/src/pages/StartAnalysis.jsx` - 타임아웃 증가

## 🎯 다음 단계

### Phase 3 완료 확인
- [x] Analysis 테이블 생성
- [x] AI API 설정
- [x] 분석 프롬프트 생성
- [x] AI 분석 실행
- [x] 분석 API 엔드포인트
- [x] 분석 결과 조회 API
- [x] 분석 시작 페이지
- [x] 분석 결과 페이지
- [x] 분석 히스토리 페이지
- [x] 대시보드 분석 기능
- [x] 라우팅 설정

### Phase 4 준비
다음은 파일 업로드 기능입니다!

