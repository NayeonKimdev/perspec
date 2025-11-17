# AWS 배포 가이드 - 레거시 프록시 및 경로 설정

## 현재 아키텍처

이 프로젝트는 **API Gateway를 사용하지 않고** 다음 구조를 사용합니다:

```
인터넷 → ALB (Application Load Balancer) → ECS Fargate (Express 서버)
```

- **ALB**: `perspec-alb` (ARN: `arn:aws:elasticloadbalancing:ap-southeast-2:109968338833:loadbalancer/app/perspec-alb/d2c596b0fa478651`)
- **Target Group**: `perspec-api-tg` (백엔드), `perspec-client-tg` (프론트엔드)
- **ECS Cluster**: `perspec-cluster`

## 프론트엔드 baseURL 설정

### 로컬 개발 환경
```javascript
// client/src/services/api.js
const api = axios.create({
  baseURL: '/api/v1',  // ✅ 이미 수정됨
  timeout: 10000,
});
```

### 프로덕션 환경 (AWS)
프론트엔드가 ALB를 통해 백엔드에 접근하므로, baseURL은 상대 경로를 사용합니다:
```javascript
// client/src/services/api.js
const api = axios.create({
  baseURL: '/api/v1',  // ✅ ALB를 통해 자동으로 백엔드로 라우팅됨
  timeout: 10000,
});
```

## ALB 리스너 규칙 설정

ALB에서 다음 리스너 규칙이 설정되어 있어야 합니다:

### 백엔드 (포트 5000)
```
조건: Path is /api/*
작업: Forward to perspec-api-tg
우선순위: 높음
```

### 프론트엔드 (포트 80)
```
조건: Default
작업: Forward to perspec-client-tg
우선순위: 낮음 (기본 규칙)
```

## 레거시 프록시 미들웨어

백엔드 Express 서버에서 레거시 경로를 v1 경로로 자동 변환합니다:

### 지원하는 레거시 경로
- `/api/auth/*` → `/api/v1/auth/*`
- `/api/profile/*` → `/api/v1/profile/*`
- `/api/media/*` → `/api/v1/media/*`
- `/api/documents/*` → `/api/v1/documents/*`
- `/api/analysis/*` → `/api/v1/analysis/*`
- `/api/mbti/*` → `/api/v1/mbti/*`
- `/api/emotion/*` → `/api/v1/emotion/*`
- `/api/reports/*` → `/api/v1/reports/*`

### 작동 방식
```javascript
// server/server.js
app.use('/api', (req, res, next) => {
  // 레거시 경로 감지 및 변환
  // /api/media/upload → /api/v1/media/upload
});
```

## 문제 해결

### 1. "요청한 리소스를 찾을 수 없습니다" (404 에러)

**원인:**
- 프론트엔드가 `/api/media/upload`로 요청 (레거시 경로)
- 레거시 프록시 미들웨어가 실행되지 않음

**해결:**
- ✅ 프론트엔드 baseURL을 `/api/v1`로 변경 (완료)
- 이제 `/api/v1/media/upload`로 직접 요청하므로 레거시 프록시 불필요

### 2. ALB에서 404 에러 발생

**확인 사항:**
1. ALB 리스너 규칙이 올바르게 설정되어 있는지
2. Target Group의 헬스 체크가 통과하는지
3. ECS 서비스가 정상 실행 중인지

**확인 명령어:**
```bash
# ALB 리스너 규칙 확인
aws elbv2 describe-rules --listener-arn <LISTENER_ARN>

# Target Group 상태 확인
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>

# ECS 서비스 상태 확인
aws ecs describe-services --cluster perspec-cluster --services perspec-api-service
```

### 3. CORS 에러

**확인 사항:**
- `CORS_ORIGIN` 환경 변수가 올바르게 설정되어 있는지
- 프론트엔드 도메인이 허용 목록에 포함되어 있는지

**설정 위치:**
- `docker-compose.yml` (로컬)
- AWS Secrets Manager (프로덕션)

## 배포 체크리스트

### 로컬 환경
- [x] 프론트엔드 baseURL을 `/api/v1`로 변경
- [x] 레거시 프록시 미들웨어 등록
- [x] Docker Compose로 로컬 테스트

### AWS 프로덕션 환경
- [ ] ALB 리스너 규칙 확인 (`/api/*` → 백엔드)
- [ ] Target Group 헬스 체크 확인
- [ ] ECS 서비스 정상 실행 확인
- [ ] CORS 설정 확인 (Secrets Manager)
- [ ] 프론트엔드 빌드 및 배포

## 참고 사항

### API Gateway를 사용하지 않는 이유
- 이 프로젝트는 ECS Fargate에 직접 배포되므로 ALB만으로 충분
- API Gateway는 추가 비용과 복잡성을 증가시킴
- ALB가 더 간단하고 비용 효율적

### 레거시 프록시가 필요한 경우
레거시 프록시는 **기존 API 클라이언트와의 호환성**을 위해 제공됩니다:
- 기존 클라이언트가 `/api/media/upload`로 요청하는 경우
- 점진적 마이그레이션을 위해 레거시 경로 지원

**권장 사항:** 모든 클라이언트를 `/api/v1/*` 경로로 업데이트하고, 레거시 프록시는 나중에 제거 가능

