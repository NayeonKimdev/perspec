# AWS 배포 설정 체크리스트

이 문서는 AWS 배포를 위한 단계별 체크리스트입니다.

## 📋 사전 준비

### 1. AWS 계정 및 권한
- [ ] AWS 계정 생성 완료
- [ ] IAM 사용자 생성 (프로그래밍 방식 액세스)
- [ ] 필요한 권한 부여:
  - [ ] ECS (Elastic Container Service) 전체 권한
  - [ ] ECR (Elastic Container Registry) 전체 권한
  - [ ] RDS 전체 권한
  - [ ] S3 전체 권한
  - [ ] Secrets Manager 전체 권한
  - [ ] IAM 역할 생성 권한
  - [ ] CloudWatch Logs 전체 권한
  - [ ] Application Load Balancer 전체 권한
  - [ ] Route 53 전체 권한 (도메인 사용 시)
  - [ ] ACM (Certificate Manager) 전체 권한 (SSL 사용 시)
- [ ] AWS CLI 설치 및 설정 (`aws configure`)

### 2. GitHub Secrets 설정
- [ ] GitHub 저장소 > Settings > Secrets and variables > Actions
- [ ] 다음 시크릿 추가:
  - [ ] `AWS_ACCESS_KEY_ID`: IAM 사용자 액세스 키
  - [ ] `AWS_SECRET_ACCESS_KEY`: IAM 사용자 시크릿 키

---

## 🗄️ 데이터베이스 설정 (RDS)

### 1. RDS 인스턴스 생성
- [ ] RDS 콘솔에서 PostgreSQL 15.x 선택
- [ ] 인스턴스 클래스 선택 (예: db.t3.micro)
- [ ] 마스터 사용자 이름 및 비밀번호 설정
- [ ] 데이터베이스 이름: `perspec`
- [ ] VPC 및 서브넷 그룹 선택
- [ ] 퍼블릭 액세스: 아니오 (보안)
- [ ] 보안 그룹 생성 및 설정
- [ ] 자동 백업 활성화
- [ ] 인스턴스 생성 완료

### 2. RDS 연결 정보 기록
- [ ] 엔드포인트 주소 기록
- [ ] 포트 번호 기록 (기본: 5432)
- [ ] 마스터 사용자 이름 기록
- [ ] 마스터 비밀번호 기록

### 3. 보안 그룹 설정
- [ ] RDS 보안 그룹 인바운드 규칙 추가
- [ ] 타입: PostgreSQL
- [ ] 소스: ECS 보안 그룹 (나중에 설정)

---

## 🪣 S3 버킷 설정

### 1. S3 버킷 생성
- [ ] S3 콘솔에서 버킷 생성
- [ ] 버킷 이름: `perspec-uploads-[고유ID]`
- [ ] 리전: `ap-northeast-2` (서울)
- [ ] 퍼블릭 액세스 차단: 모든 퍼블릭 액세스 차단
- [ ] 버전 관리: 활성화 (선택사항)
- [ ] 암호화: AWS 관리형 키 (SSE-S3)

### 2. 버킷 정책 설정
- [ ] ECS 태스크 역할이 접근할 수 있도록 정책 설정
- [ ] 버킷 이름 기록

---

## 🔐 Secrets Manager 설정

### 1. 시크릿 생성
- [ ] Secrets Manager 콘솔로 이동
- [ ] "새 시크릿 저장" 클릭
- [ ] 시크릿 유형: "다른 유형의 시크릿"
- [ ] 키-값 쌍 입력 (참고: `server/env.production.example`)
- [ ] 시크릿 이름: `perspec/production`
- [ ] 시크릿 저장

### 2. 시크릿 ARN 기록
- [ ] 시크릿 ARN 복사 및 기록

---

## 🐳 ECR (Elastic Container Registry) 설정

### 1. ECR 리포지토리 생성
```bash
# 백엔드 리포지토리
aws ecr create-repository \
  --repository-name perspec-api \
  --region ap-northeast-2

# 프론트엔드 리포지토리
aws ecr create-repository \
  --repository-name perspec-client \
  --region ap-northeast-2
```

- [ ] 백엔드 리포지토리 생성 완료
- [ ] 프론트엔드 리포지토리 생성 완료
- [ ] 리포지토리 URI 기록

### 2. Docker 로그인 테스트
```bash
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com
```
- [ ] 로그인 성공 확인

---

## 🚀 ECS 클러스터 및 서비스 설정

### 1. IAM 역할 생성

#### ECS Task Execution Role
- [ ] IAM 콘솔에서 역할 생성
- [ ] 역할 이름: `ecsTaskExecutionRole`
- [ ] 신뢰 관계: ECS Tasks
- [ ] 정책 연결:
  - [ ] `AmazonECSTaskExecutionRolePolicy`
  - [ ] Secrets Manager 읽기 권한
  - [ ] ECR 이미지 풀 권한
  - [ ] CloudWatch Logs 쓰기 권한

#### ECS Task Role
- [ ] IAM 콘솔에서 역할 생성
- [ ] 역할 이름: `ecsTaskRole`
- [ ] 신뢰 관계: ECS Tasks
- [ ] 정책 연결:
  - [ ] S3 읽기/쓰기 권한
  - [ ] Secrets Manager 읽기 권한 (필요시)

### 2. CloudWatch Logs 그룹 생성
```bash
aws logs create-log-group --log-group-name /ecs/perspec-api --region ap-northeast-2
aws logs create-log-group --log-group-name /ecs/perspec-client --region ap-northeast-2
```
- [ ] API 로그 그룹 생성 완료
- [ ] Client 로그 그룹 생성 완료

### 3. ECS 클러스터 생성
- [ ] ECS 콘솔에서 클러스터 생성
- [ ] 클러스터 이름: `perspec-cluster`
- [ ] 인프라: AWS Fargate (서버리스)
- [ ] 클러스터 생성 완료

### 4. 태스크 정의 생성

#### 백엔드 태스크 정의
- [ ] `aws/task-definition-api.json` 파일 수정:
  - [ ] `YOUR_ACCOUNT_ID`를 실제 AWS 계정 ID로 변경
  - [ ] `YOUR_BUCKET_ID`를 실제 S3 버킷 이름으로 변경
  - [ ] Secrets Manager ARN 업데이트
- [ ] 태스크 정의 등록:
```bash
aws ecs register-task-definition \
  --cli-input-json file://aws/task-definition-api.json \
  --region ap-northeast-2
```

#### 프론트엔드 태스크 정의
- [ ] `aws/task-definition-client.json` 파일 수정:
  - [ ] `YOUR_ACCOUNT_ID`를 실제 AWS 계정 ID로 변경
- [ ] 태스크 정의 등록:
```bash
aws ecs register-task-definition \
  --cli-input-json file://aws/task-definition-client.json \
  --region ap-northeast-2
```

### 5. 보안 그룹 생성
- [ ] EC2 콘솔 > 보안 그룹
- [ ] 보안 그룹 생성:
  - [ ] 이름: `perspec-ecs-sg`
  - [ ] 인바운드 규칙:
    - [ ] HTTP (80) - ALB에서
    - [ ] HTTPS (443) - ALB에서
  - [ ] 아웃바운드 규칙:
    - [ ] 모든 트래픽 허용

### 6. Application Load Balancer 생성
- [ ] EC2 콘솔 > 로드 밸런서
- [ ] Application Load Balancer 생성
- [ ] 이름: `perspec-alb`
- [ ] 스키마: 인터넷 연결
- [ ] 리스너: HTTP (80), HTTPS (443)
- [ ] 가용 영역: 2개 이상 선택
- [ ] 보안 그룹: ALB용 보안 그룹 생성
- [ ] 대상 그룹 생성:
  - [ ] `perspec-api-tg` (백엔드)
  - [ ] `perspec-client-tg` (프론트엔드)

### 7. ECS 서비스 생성

#### 백엔드 서비스
- [ ] ECS 콘솔에서 서비스 생성
- [ ] 클러스터: `perspec-cluster`
- [ ] 서비스 이름: `perspec-api-service`
- [ ] 태스크 정의: `perspec-api`
- [ ] 서비스 유형: REPLICA
- [ ] 태스크 수: 1
- [ ] 배포 유형: Rolling update
- [ ] 네트워크:
  - [ ] VPC 선택
  - [ ] 서브넷: 퍼블릭 서브넷
  - [ ] 보안 그룹: `perspec-ecs-sg`
- [ ] 로드 밸런서:
  - [ ] ALB 선택
  - [ ] 대상 그룹: `perspec-api-tg`
  - [ ] 컨테이너 포트: 5000
  - [ ] 헬스 체크 경로: `/health`

#### 프론트엔드 서비스
- [ ] ECS 콘솔에서 서비스 생성
- [ ] 클러스터: `perspec-cluster`
- [ ] 서비스 이름: `perspec-client-service`
- [ ] 태스크 정의: `perspec-client`
- [ ] 서비스 유형: REPLICA
- [ ] 태스크 수: 1
- [ ] 네트워크:
  - [ ] VPC 선택
  - [ ] 서브넷: 퍼블릭 서브넷
  - [ ] 보안 그룹: `perspec-ecs-sg`
- [ ] 로드 밸런서:
  - [ ] ALB 선택
  - [ ] 대상 그룹: `perspec-client-tg`
  - [ ] 컨테이너 포트: 80

### 8. ALB 리스너 규칙 설정
- [ ] ALB 리스너 편집
- [ ] 규칙 추가:
  - [ ] `/api/*` → `perspec-api-tg`
  - [ ] `/*` → `perspec-client-tg`

---

## 🌐 도메인 및 SSL 설정

### 1. Route 53 설정
- [ ] 도메인 구매 또는 기존 도메인 사용
- [ ] Route 53 호스팅 영역 생성
- [ ] A 레코드 생성:
  - [ ] 이름: `@` 또는 `www`
  - [ ] 타입: A - IPv4 주소
  - [ ] 별칭: 예
  - [ ] 별칭 대상: ALB 선택

### 2. SSL 인증서 발급
- [ ] ACM (Certificate Manager) 콘솔로 이동
- [ ] 인증서 요청:
  - [ ] 도메인: `yourdomain.com`, `*.yourdomain.com`
  - [ ] 검증 방법: DNS 검증
- [ ] Route 53에서 레코드 생성
- [ ] 검증 완료 대기

### 3. ALB에 SSL 인증서 연결
- [ ] ALB 리스너 편집
- [ ] HTTPS 리스너 추가:
  - [ ] 포트: 443
  - [ ] 프로토콜: HTTPS
  - [ ] SSL 인증서: ACM 인증서 선택
- [ ] HTTP → HTTPS 리다이렉트 설정

---

## 📦 애플리케이션 배포

### 1. 로컬 테스트
- [ ] 프로덕션 Docker 이미지 빌드 테스트
- [ ] `docker-compose.prod.yml`로 로컬 테스트

### 2. 수동 배포 (첫 배포)
```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드 및 푸시
docker build -t perspec-api:latest -f server/Dockerfile .
docker tag perspec-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/perspec-api:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/perspec-api:latest

docker build -t perspec-client:latest -f client/Dockerfile ./client
docker tag perspec-client:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/perspec-client:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/perspec-client:latest
```

### 3. 데이터베이스 마이그레이션
- [ ] RDS에 연결하여 마이그레이션 실행
- [ ] 로컬에서 마이그레이션 실행 (환경 변수 설정 후):
```bash
export DB_HOST=perspec-db.xxxxxxxxx.ap-northeast-2.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=perspec
export DB_USER=postgres
export DB_PASSWORD=your-password
export DB_SSL=true
npm run migrate
```

### 4. 자동 배포 설정
- [ ] GitHub Actions 워크플로우 확인
- [ ] `.github/workflows/deploy-aws.yml` 파일 검토
- [ ] GitHub Secrets 설정 확인
- [ ] main 브랜치에 푸시하여 자동 배포 테스트

---

## ✅ 배포 검증

### 1. 서비스 상태 확인
- [ ] ECS 서비스가 실행 중인지 확인
- [ ] 태스크가 정상적으로 실행 중인지 확인
- [ ] 헬스 체크 통과 확인

### 2. 애플리케이션 테스트
- [ ] ALB 엔드포인트로 접속 테스트
- [ ] API 엔드포인트 테스트 (`/api/health`)
- [ ] 프론트엔드 로드 확인
- [ ] 주요 기능 테스트

### 3. 로그 확인
- [ ] CloudWatch Logs에서 로그 확인
- [ ] 에러 로그 확인
- [ ] 애플리케이션 로그 확인

### 4. 모니터링 설정
- [ ] CloudWatch 알람 설정
- [ ] CPU 사용률 모니터링
- [ ] 메모리 사용률 모니터링
- [ ] HTTP 5xx 에러 모니터링

---

## 🔧 트러블슈팅

### 일반적인 문제
1. **ECS 태스크가 시작되지 않음**
   - CloudWatch Logs 확인
   - 태스크 역할 권한 확인
   - 보안 그룹 설정 확인

2. **데이터베이스 연결 실패**
   - RDS 보안 그룹에서 ECS 보안 그룹 허용 확인
   - 연결 문자열 확인
   - SSL 설정 확인

3. **Secrets Manager 접근 실패**
   - IAM 역할에 Secrets Manager 읽기 권한 확인
   - 시크릿 이름 확인

4. **S3 업로드 실패**
   - IAM 역할에 S3 권한 확인
   - 버킷 정책 확인

---

## 📝 다음 단계

배포 완료 후:
- [ ] 성능 모니터링 및 최적화
- [ ] 자동 스케일링 설정
- [ ] 백업 전략 수립
- [ ] 재해 복구 계획 수립

