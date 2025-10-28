# 문제 해결 가이드

## 🚨 503 에러 (분석 서비스를 일시적으로 사용할 수 없습니다)

### 1단계: 서버 재시작
서버를 완전히 종료하고 다시 시작하세요:

```bash
# 터미널에서 Ctrl+C로 서버 중지

# 서버 재시작
cd server
npm start
```

### 2단계: 서버 콘솔 확인
서버가 시작될 때 다음 메시지들을 확인하세요:

**정상적인 경우:**
```
✓ Auth 라우트 로드 성공
✓ Profile 라우트 로드 성공
✓ Analysis 라우트 로드 성공
서버가 포트 5000에서 실행 중입니다.
```

**에러가 있는 경우:**
```
✗ Analysis 라우트 로드 실패: ...
```
이 경우 에러 메시지를 복사해서 알려주세요.

### 3단계: OpenAI API 키 확인
`server/.env` 파일을 확인하세요:

```bash
# server/.env 파일에서
OPENAI_API_KEY=sk-proj-... (키가 제대로 있는지 확인)
```

**중요:** 
- `OPENAI_API_KEY=sk-proj-...` 형식이어야 함
- 키 앞뒤에 공백이 없어야 함
- 따옴표 없이 입력

### 4단계: 테스트
브라우저에서 분석을 시작하고, **서버 콘솔**을 확인하세요:

**에러가 발생하면:**
```
AI 분석 에러: ...
Error details: ...
Error stack: ...
```

이 로그를 복사해서 알려주세요!

## 📋 프로필 필드 카운팅 문제

### 문제
"작성된 항목 12개"로 잘못 표시됨

### 해결
- 실제 프로필 필드 11개만 카운팅
- id, user_id 등은 제외

**변경 사항:**
- `interests` (취향)
- `hobbies` (취미)
- `ideal_type` (이상형)
- `ideal_life` (이상향)
- `current_job` (현재 직업/학업)
- `future_dream` (미래의 꿈)
- `personality` (성격/특징)
- `concerns` (현재 고민)
- `dreams` (꿈/희망)
- `dating_style` (데이팅 스타일)
- `other_info` (기타 정보)

## 🔍 디버깅 명령어

### 서버 로그 확인
```bash
# 서버 콘솔에서 계속 확인
# 분석 버튼을 누르면 자동으로 로그가 출력됨
```

### API 테스트
```bash
# 서버가 실행 중일 때
curl http://localhost:5000/api/analysis/health
```

### 데이터베이스 확인
```bash
# PostgreSQL 접속
psql -U postgres -d perspec

# 테이블 확인
\dt

# analyses 테이블 확인
SELECT * FROM analyses;
```

## 📞 추가 도움이 필요하면

1. 서버 콘솔의 **전체 로그**를 복사해서 공유
2. 브라우저 콘솔의 **전체 에러 메시지**를 복사해서 공유
3. `.env` 파일의 **OPENAI_API_KEY 값** 확인 (실제 키는 공유하지 마세요!)

