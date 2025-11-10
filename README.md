# Perspec 사용자 분석 플랫폼

## 프로젝트 개요
Perspec은 사용자 분석을 위한 웹 플랫폼입니다. React + Vite 프론트엔드와 Node.js + Express 백엔드를 사용하여 구축되었습니다. 이미지와 텍스트 문서를 업로드하여 AI 기반 분석을 수행하고, 사용자의 성격, 관심사, MBTI, 감정 등을 분석합니다.

## 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구 및 개발 서버
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Lucide Icons** - 아이콘
- **Axios** - HTTP 클라이언트

### 백엔드
- **Node.js** - 런타임 환경
- **Express.js** - 웹 프레임워크
- **PostgreSQL** - 관계형 데이터베이스
- **Sequelize** - ORM
- **JWT** - 인증 토큰
- **OpenAI GPT-3.5-turbo** - AI 분석
- **Winston** - 로깅 시스템
- **Swagger** - API 문서화

### 보안 및 성능
- **Helmet** - 보안 헤더 설정
- **express-rate-limit** - Rate Limiting
- **compression** - 응답 압축
- **bcryptjs** - 비밀번호 해싱

## 프로젝트 구조

```
perspec/
├── client/                    # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navigation.jsx
│   │   │   └── ...
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MediaUpload.jsx
│   │   │   └── ...
│   │   ├── services/          # API 서비스
│   │   │   └── api.js
│   │   ├── contexts/          # React Context
│   │   │   └── ThemeContext.jsx
│   │   ├── utils/             # 유틸리티 함수
│   │   │   ├── errorHandler.js
│   │   │   └── i18n.js
│   │   ├── App.jsx            # 메인 앱 컴포넌트
│   │   └── main.jsx           # 진입점
│   ├── index.html
│   └── package.json
│
├── server/                    # 백엔드 애플리케이션
│   ├── controllers/          # 컨트롤러 (비즈니스 로직)
│   │   ├── authController.js
│   │   ├── mediaController.js
│   │   ├── documentController.js
│   │   └── ...
│   ├── routes/               # 라우트 정의
│   │   ├── auth.js
│   │   ├── media.js
│   │   └── ...
│   ├── models/               # 데이터베이스 모델
│   │   ├── User.js
│   │   ├── Media.js
│   │   └── ...
│   ├── middleware/           # Express 미들웨어
│   │   ├── auth.js           # 인증 미들웨어
│   │   ├── upload.js         # 파일 업로드
│   │   ├── security.js       # 보안 미들웨어
│   │   └── requestLogger.js  # 요청 로깅
│   ├── services/             # 비즈니스 서비스
│   │   ├── aiService.js      # OpenAI 연동
│   │   ├── analysisQueue.js  # 분석 큐 관리
│   │   └── ...
│   ├── config/               # 설정 파일
│   │   ├── config.js         # 데이터베이스 설정
│   │   ├── storage.js        # 파일 저장 설정
│   │   ├── envValidator.js   # 환경변수 검증
│   │   └── swagger.js        # Swagger 설정
│   ├── utils/                # 유틸리티
│   │   └── logger.js         # 로깅 시스템
│   ├── migrations/           # 데이터베이스 마이그레이션
│   ├── logs/                 # 로그 파일 (자동 생성)
│   ├── uploads/              # 업로드된 파일 (자동 생성)
│   ├── server.js             # 서버 진입점
│   ├── .env                  # 환경변수 (gitignore)
│   └── env.example           # 환경변수 예시
│
├── .gitignore
├── package.json              # 루트 패키지 설정
└── README.md                 # 이 파일
```

## 아키텍처 개요

### 백엔드 아키텍처
```
Client Request
    ↓
[Express Middleware]
    ├── Security Headers (Helmet)
    ├── CORS
    ├── Compression
    ├── Request Logger
    ├── Rate Limiting
    └── Body Parser
    ↓
[Router]
    ├── Authentication Middleware
    └── Route Handler
    ↓
[Controller]
    ├── Input Validation
    ├── Business Logic
    └── Response Formatting
    ↓
[Service Layer]
    ├── AI Service (OpenAI)
    ├── Analysis Queue
    └── Database Operations
    ↓
[Database]
    └── PostgreSQL (via Sequelize)
```

### 주요 기능 플로우

#### 이미지 분석 플로우
1. 사용자가 이미지 업로드
2. 파일 검증 및 저장
3. 분석 큐에 작업 추가
4. 백그라운드에서 AI 분석 수행
5. 결과를 데이터베이스에 저장
6. 클라이언트에서 폴링하여 결과 조회

#### 텍스트 문서 분석 플로우
1. 사용자가 텍스트 문서 업로드
2. 파일 파싱 및 메타데이터 추출
3. 분석 큐에 작업 추가
4. AI 기반 텍스트 분석 수행
5. 결과 저장 및 반환

## 설치 및 실행

### 전제 조건
- Node.js 16 이상
- PostgreSQL 12 이상
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone <repository-url>
cd perspec
```

### 2. 의존성 설치
```bash
# 루트 디렉토리에서 모든 패키지 설치
npm run install-all

# 또는 개별적으로 설치
npm install
cd server && npm install
cd ../client && npm install
```

### 3. 환경변수 설정

#### 서버 환경변수 (`server/.env`)
`server/env.example` 파일을 참고하여 `server/.env` 파일을 생성하세요:

```bash
cp server/env.example server/.env
```

필수 환경변수:
```env
NODE_ENV=development
PORT=5000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=perspec
DB_USER=postgres
DB_PASSWORD=your_password

# JWT 설정 (강력한 키 생성: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI API 설정
OPENAI_API_KEY=your-openai-api-key-here

# 로깅 레벨 (선택사항)
LOG_LEVEL=debug
```

### 4. 데이터베이스 설정

```bash
# PostgreSQL 실행 확인
psql --version

# 데이터베이스 생성
createdb perspec

# 마이그레이션 실행
cd server
npm run migrate
```

### 5. 개발 서버 실행

```bash
# 루트 디렉토리에서 모든 서버 동시 실행
npm run dev

# 또는 개별적으로 실행
npm run server  # 백엔드 서버 (포트 5000)
npm run client  # 프론트엔드 서버 (포트 3000)
```

서버가 정상적으로 시작되면:
- 백엔드: http://localhost:5000
- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:5000/api-docs

## API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
- **URL**: http://localhost:5000/api-docs
- **JSON 형식**: http://localhost:5000/api-docs.json

### API 인증
대부분의 API 엔드포인트는 JWT 토큰 인증이 필요합니다:
1. `/api/auth/login` 엔드포인트로 로그인
2. 응답으로 받은 `token`을 저장
3. 이후 요청에 `Authorization: Bearer <token>` 헤더 추가

Swagger UI에서는 "Authorize" 버튼을 클릭하여 토큰을 입력할 수 있습니다.

## 주요 기능

### 백엔드 기능
- ✅ JWT 기반 인증 시스템
- ✅ 비밀번호 해싱 (bcrypt, salt rounds: 12)
- ✅ 입력 데이터 유효성 검사 (express-validator)
- ✅ 구조화된 에러 핸들링
- ✅ PostgreSQL 데이터베이스 연동
- ✅ Sequelize ORM 사용
- ✅ OpenAI GPT-3.5-turbo 연동
- ✅ AI 기반 이미지/텍스트 분석
- ✅ 분석 큐 시스템 (백그라운드 처리)
- ✅ 파일 업로드 (이미지, 텍스트 문서)
- ✅ 파일명 sanitization (보안)
- ✅ Rate Limiting (DDoS 방지)
- ✅ 보안 헤더 설정 (Helmet)
- ✅ 구조화된 로깅 시스템 (Winston)
- ✅ 로그 파일 로테이션
- ✅ 헬스 체크 엔드포인트
- ✅ API 문서화 (Swagger)

### 프론트엔드 기능
- ✅ 반응형 UI (Tailwind CSS)
- ✅ 다크 모드 지원
- ✅ 폼 유효성 검사
- ✅ JWT 토큰 관리
- ✅ Protected Route 구현
- ✅ 자동 로그인 상태 관리
- ✅ AI 분석 UI
- ✅ 분석 히스토리 관리
- ✅ 이미지 갤러리
- ✅ 문서 업로드 및 관리
- ✅ 에러 처리 및 사용자 친화적 메시지

## API 엔드포인트

### 인증 관련 (`/api/auth`)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 프로필 관련 (`/api/profile`)
- `GET /api/profile` - 프로필 조회 (인증 필요)
- `POST /api/profile` - 프로필 저장 (인증 필요)

### 미디어 관련 (`/api/media`)
- `POST /api/media/upload` - 단일 이미지 업로드 (인증 필요)
- `POST /api/media/upload-multiple` - 다중 이미지 업로드 (인증 필요)
- `GET /api/media/list` - 미디어 목록 조회 (인증 필요)
- `GET /api/media/search` - 이미지 검색 (인증 필요)
- `GET /api/media/:id/analysis` - 분석 상태 조회 (인증 필요)
- `GET /api/media/analysis-summary` - 분석 요약 조회 (인증 필요)
- `POST /api/media/:id/retry-analysis` - 재분석 요청 (인증 필요)
- `DELETE /api/media/:id` - 미디어 삭제 (인증 필요)

### 문서 관련 (`/api/documents`)
- `POST /api/documents/upload` - 단일 문서 업로드 (인증 필요)
- `POST /api/documents/upload-multiple` - 다중 문서 업로드 (인증 필요)
- `GET /api/documents/list` - 문서 목록 조회 (인증 필요)
- `GET /api/documents/:id` - 문서 조회 (인증 필요)
- `DELETE /api/documents/:id` - 문서 삭제 (인증 필요)

### 헬스 체크 (`/health`)
- `GET /health` - 기본 헬스 체크
- `GET /health/live` - 라이브니스 프로브
- `GET /health/ready` - 레디니스 프로브

더 자세한 API 문서는 http://localhost:5000/api-docs 에서 확인하세요.

## 보안 기능

### 구현된 보안 기능
- ✅ **Helmet** - 보안 HTTP 헤더 설정 (XSS, Clickjacking 방지)
- ✅ **Rate Limiting** - API 요청 제한 (DDoS 방지)
  - 인증: 15분당 5회
  - 일반 API: 15분당 100회
  - 파일 업로드: 15분당 20회
  - 분석 요청: 1시간당 10회
- ✅ **CORS** - 프로덕션 환경에서 특정 origin만 허용
- ✅ **비밀번호 정책** - 최소 8자, 대문자/소문자/숫자 필수
- ✅ **JWT 인증** - 토큰 기반 인증 시스템
- ✅ **파일 검증** - MIME 타입 및 확장자 검증
- ✅ **파일명 Sanitization** - 경로 탐색 공격 방지
- ✅ **환경변수 검증** - 서버 시작 시 필수 환경변수 확인

### 보안 권장사항
1. 프로덕션 환경에서는 반드시 강력한 `JWT_SECRET` 사용 (최소 32자)
2. `CORS_ORIGIN` 환경변수로 허용된 origin 설정
3. 정기적인 보안 업데이트 및 의존성 점검 (`npm audit`)
4. HTTPS 사용
5. 데이터베이스 접근 권한 최소화

## 로깅 시스템

구조화된 로깅 시스템이 구현되어 있습니다:

### 로그 파일 위치
- `server/logs/application-YYYY-MM-DD.log` - 일반 로그
- `server/logs/error-YYYY-MM-DD.log` - 에러 로그만
- `server/logs/exceptions.log` - 예외 로그
- `server/logs/rejections.log` - Promise 거부 로그

### 로그 레벨
- `error` - 에러만 기록
- `warn` - 경고 및 에러
- `info` - 정보, 경고, 에러 (프로덕션 기본값)
- `debug` - 모든 로그 (개발 기본값)

### 로그 설정
환경변수 `LOG_LEVEL`로 로그 레벨을 조정할 수 있습니다:
```env
LOG_LEVEL=info  # 프로덕션 권장
LOG_LEVEL=debug  # 개발 환경
```

## 테스트

### 테스트 실행
```bash
cd server

# 모든 테스트 실행
npm test

# Watch 모드로 실행
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage
```

### 테스트 구조
- `__tests__/config/` - 설정 파일 테스트
- `__tests__/controllers/` - 컨트롤러 테스트
- `__tests__/integration/` - 통합 테스트

## 배포 가이드

### 프로덕션 환경 설정

1. **환경변수 설정**
```env
NODE_ENV=production
PORT=5000

# 데이터베이스 설정
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=perspec
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# JWT 설정 (강력한 키 필수!)
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# OpenAI API 설정
OPENAI_API_KEY=your-openai-api-key

# CORS 설정 (프로덕션 필수!)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# 로깅 레벨
LOG_LEVEL=info
```

2. **데이터베이스 마이그레이션**
```bash
cd server
npm run migrate
```

3. **프로덕션 빌드**
```bash
# 프론트엔드 빌드
cd client
npm run build

# 서버 시작
cd ../server
npm start
```

### 프로세스 관리
PM2를 사용한 프로세스 관리 권장:
```bash
npm install -g pm2

# 서버 시작
cd server
pm2 start server.js --name perspec-api

# 로그 확인
pm2 logs perspec-api

# 재시작
pm2 restart perspec-api
```

### 헬스 체크
컨테이너 오케스트레이션 환경에서 사용:
- `/health` - 기본 헬스 체크
- `/health/live` - 라이브니스 프로브
- `/health/ready` - 레디니스 프로브

### Docker 배포

#### 전제 조건
- Docker 및 Docker Compose 설치
- 환경변수 파일 준비 (`docker-compose.env.example` 참고)

#### 프로덕션 배포

1. **환경변수 설정**
```bash
cp docker-compose.env.example .env
# .env 파일 편집하여 실제 값 입력
```

2. **Docker Compose로 시작**
```bash
# 빌드 및 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f api

# 서비스 상태 확인
docker-compose ps
```

3. **데이터베이스 마이그레이션**
```bash
# 컨테이너 내에서 실행
docker-compose exec api npm run migrate

# 또는 로컬에서 실행
npm run migrate
```

4. **데이터베이스 백업/복구**
```bash
# 백업
node scripts/backup.js

# 복구
node scripts/restore.js <backup_file>
```

#### 개발 환경 실행
```bash
# 개발 모드로 실행 (nodemon 포함)
docker-compose -f docker-compose.dev.yml up
```

#### Docker 명령어
```bash
# 서비스 시작
npm run docker:up

# 서비스 중지
npm run docker:down

# 로그 확인
npm run docker:logs

# 개발 모드
npm run docker:dev
```

자세한 Docker 배포 가이드는 `DOCKER_GUIDE.md`를 참고하세요.

## 문제 해결

### 일반적인 문제

#### 데이터베이스 연결 오류
```bash
# PostgreSQL 실행 확인
sudo service postgresql status  # Linux
brew services list | grep postgresql  # macOS

# 데이터베이스 존재 확인
psql -U postgres -l | grep perspec

# 데이터베이스 생성
createdb -U postgres perspec
```

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 다른 포트 사용
PORT=5001 npm run server
```

#### 토큰 만료
- 로그인 페이지에서 재로그인
- 토큰 만료 시간 조정: `JWT_EXPIRES_IN=30d`

#### 파일 업로드 실패
- 파일 크기 확인 (이미지: 10MB, 텍스트: 5MB)
- 파일 형식 확인 (허용된 형식만 가능)
- 디스크 공간 확인

## 개발 가이드

### 코드 스타일
- JavaScript Standard Style 권장
- 함수 및 변수명은 camelCase 사용
- 파일명은 camelCase 사용

### 새 기능 추가 가이드
1. 기능 명세 작성
2. 데이터베이스 마이그레이션 (필요시)
3. 모델 생성/수정
4. 컨트롤러 작성
5. 라우트 추가
6. Swagger 문서화 주석 추가
7. 테스트 작성

### 로깅 및 모니터링

#### 로깅 시스템
- **Winston**: 구조화된 로깅 시스템
- **로그 레벨**: 환경별 자동 설정 (개발: debug, 프로덕션: info)
- **로그 파일**: 
  - `logs/application-YYYY-MM-DD.log`: 일반 로그 (14일 보관)
  - `logs/error-YYYY-MM-DD.log`: 에러 로그 (30일 보관)
  - `logs/exceptions.log`: 처리되지 않은 예외
  - `logs/rejections.log`: 처리되지 않은 Promise 거부

#### 에러 추적 시스템
- **에러 분류**: 자동으로 에러 타입 분류 (validation, authentication, database, external_api 등)
- **심각도 판단**: 에러 심각도 자동 판단 (low, medium, high, critical)
- **구조화된 로깅**: 에러 발생 시 상세 컨텍스트 정보 자동 수집
- **Sentry 통합 준비**: 외부 에러 추적 서비스 연동을 위한 구조 제공

```bash
# 로그 확인
tail -f server/logs/application-$(date +%Y-%m-%d).log
tail -f server/logs/error-$(date +%Y-%m-%d).log
```

#### 헬스 체크
- `GET /health`: 전체 헬스 체크
- `GET /health/live`: Liveness probe (컨테이너 재시작 판단용)
- `GET /health/ready`: Readiness probe (트래픽 수신 준비 여부)

### 코드 스타일 및 포맷팅

#### 사용 방법

```bash
# 코드 스타일 검사
npm run lint

# 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format

# 포맷팅 확인
npm run format:check
```

#### EditorConfig
프로젝트 루트의 `.editorconfig` 파일로 에디터 간 일관된 설정 유지

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정 등
```

## 라이선스
MIT License

## 기여
프로젝트에 기여하고 싶으시면 이슈를 생성하거나 Pull Request를 보내주세요.

## 변경 이력

### v1.0.0 (현재)
- ✅ 기본 인증 시스템
- ✅ 이미지/텍스트 업로드 및 분석
- ✅ 보안 미들웨어 (Helmet, Rate Limiting)
- ✅ 구조화된 로깅 시스템
- ✅ 헬스 체크 엔드포인트
- ✅ API 문서화 (Swagger)
- ✅ 테스트 인프라 구축
- ✅ Docker 컨테이너화
- ✅ 데이터베이스 마이그레이션/백업 스크립트

## 추가 정보
- API 문서: http://localhost:5000/api-docs
- 로그 파일: `server/logs/` 디렉토리
- 환경변수 예시: `server/env.example`
- Docker 가이드: `DOCKER_GUIDE.md`
- 마이그레이션 스크립트: `scripts/migrate.js`
- 백업 스크립트: `scripts/backup.js`, `scripts/restore.js`
