# Perspec 사용자 분석 플랫폼

## 프로젝트 개요
Perspec은 사용자 분석을 위한 웹 플랫폼입니다. React + Vite 프론트엔드와 Node.js + Express 백엔드를 사용하여 구축되었습니다.

## 기술 스택
- **프론트엔드**: React 18, Vite, Tailwind CSS, React Router, Lucide Icons
- **백엔드**: Node.js, Express.js
- **데이터베이스**: PostgreSQL
- **인증**: JWT (JSON Web Token)
- **ORM**: Sequelize
- **AI**: OpenAI GPT-3.5-turbo

## 프로젝트 구조
```
perspec/
├── client/          # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 서비스
│   │   └── App.jsx        # 메인 앱 컴포넌트
│   └── package.json
├── server/          # 백엔드 (Node.js + Express)
│   ├── controllers/       # 컨트롤러
│   ├── routes/           # 라우트 정의
│   ├── models/           # 데이터베이스 모델
│   ├── middleware/       # 미들웨어
│   ├── config/           # 설정 파일
│   ├── migrations/       # 데이터베이스 마이그레이션
│   └── server.js         # 서버 진입점
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치
```bash
# 루트 디렉토리에서 모든 패키지 설치
npm run install-all

# 또는 개별적으로 설치
npm install
cd server && npm install
cd ../client && npm install
```

### 2. 환경변수 설정
`server/env.example` 파일을 참고하여 `server/.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
NODE_ENV=development
PORT=5000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perspec
DB_USER=postgres
DB_PASSWORD=your_password

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI API 설정
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. 데이터베이스 설정
PostgreSQL이 설치되어 있다고 가정하고 다음 단계를 진행하세요:

```bash
# 데이터베이스 생성
createdb perspec

# 마이그레이션 실행
cd server
npm run migrate
```

### 4. 개발 서버 실행
```bash
# 루트 디렉토리에서 모든 서버 동시 실행
npm run dev

# 또는 개별적으로 실행
npm run server  # 백엔드 서버 (포트 5000)
npm run client  # 프론트엔드 서버 (포트 3000)
```

## API 엔드포인트

### 인증 관련
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 프로필 관련
- `GET /api/profile` - 프로필 조회
- `POST /api/profile` - 프로필 저장 (생성/수정)

### 분석 관련
- `POST /api/analysis/create` - 분석 생성
- `GET /api/analysis/history` - 분석 히스토리 조회
- `GET /api/analysis/:id` - 특정 분석 결과 조회

### 요청/응답 예시

#### 회원가입
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### 로그인
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

## 주요 기능

### 백엔드
- ✅ JWT 기반 인증 시스템
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ 입력 데이터 유효성 검사
- ✅ 에러 핸들링
- ✅ PostgreSQL 데이터베이스 연동
- ✅ Sequelize ORM 사용
- ✅ OpenAI GPT-3.5-turbo 연동
- ✅ AI 기반 프로필 분석 기능
- ✅ 분석 결과 저장 및 히스토리 관리

### 프론트엔드
- ✅ 반응형 UI (Tailwind CSS)
- ✅ 폼 유효성 검사
- ✅ JWT 토큰 관리
- ✅ Protected Route 구현
- ✅ 자동 로그인 상태 관리
- ✅ AI 분석 UI (성격, 진로, 취미, 여행지)
- ✅ 분석 히스토리 관리

## 페이지 구성
- `/` - 로그인 페이지로 리다이렉트
- `/login` - 로그인 페이지
- `/register` - 회원가입 페이지
- `/dashboard` - 대시보드 (인증 필요)
- `/profile` - 프로필 작성/수정 (인증 필요)
- `/profile-view` - 프로필 보기 (인증 필요)
- `/start-analysis` - 분석 시작 페이지 (인증 필요)
- `/analysis/:id` - 분석 결과 페이지 (인증 필요)
- `/analysis-history` - 분석 히스토리 페이지 (인증 필요)

## 보안 고려사항
- 비밀번호는 bcrypt로 해싱하여 저장
- JWT 토큰을 통한 인증
- 입력 데이터 유효성 검사
- CORS 설정
- 환경변수를 통한 민감한 정보 관리

## 개발 가이드
1. 새로운 기능 개발 시 브랜치를 생성하여 작업
2. 코드 스타일은 ESLint 규칙을 따름
3. API 테스트는 Postman 또는 curl 사용
4. 데이터베이스 변경 시 마이그레이션 파일 생성

## 문제 해결
- 데이터베이스 연결 오류: `.env` 파일의 데이터베이스 설정 확인
- 포트 충돌: `PORT` 환경변수로 다른 포트 사용
- 토큰 만료: 로그인 페이지에서 재로그인
