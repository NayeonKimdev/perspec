# Docker 배포 가이드

## Docker Compose를 사용한 배포

### 전제 조건
- Docker 및 Docker Compose 설치
- 환경변수 파일 준비

### 1. 환경변수 설정

```bash
# docker-compose.env.example을 복사하여 .env 파일 생성
cp docker-compose.env.example .env

# .env 파일 편집하여 실제 값 입력
nano .env
```

### 2. 프로덕션 환경 배포

```bash
# 이미지 빌드 및 컨테이너 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f api

# 서비스 상태 확인
docker-compose ps
```

### 3. 데이터베이스 마이그레이션

```bash
# 컨테이너 내에서 마이그레이션 실행
docker-compose exec api npm run migrate

# 또는 로컬에서 실행 (환경변수 설정 필요)
npm run migrate
```

### 4. 개발 환경 실행

```bash
# 개발 모드로 실행 (nodemon 포함)
docker-compose -f docker-compose.dev.yml up
```

## Docker 명령어

### 컨테이너 관리
```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart api

# 로그 확인
docker-compose logs -f api

# 서비스 상태 확인
docker-compose ps
```

### 데이터베이스 접근
```bash
# PostgreSQL 콘솔 접근
docker-compose exec postgres psql -U postgres -d perspec

# 데이터베이스 백업
docker-compose exec postgres pg_dump -U postgres perspec > backup.sql

# 데이터베이스 복구
docker-compose exec -T postgres psql -U postgres perspec < backup.sql
```

### 볼륨 관리
```bash
# 볼륨 목록 확인
docker volume ls

# 볼륨 삭제 (주의: 데이터 손실)
docker-compose down -v
```

## 수동 Docker 빌드

### 단일 컨테이너 빌드 및 실행

```bash
# 이미지 빌드
cd server
docker build -t perspec-api .

# 컨테이너 실행
docker run -d \
  --name perspec-api \
  -p 5000:5000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  perspec-api
```

## 프로덕션 배포 체크리스트

- [ ] 환경변수 설정 완료 (특히 JWT_SECRET 강화)
- [ ] CORS_ORIGIN 설정 완료
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 로그 디렉토리 권한 확인
- [ ] 업로드 디렉토리 권한 확인
- [ ] 헬스 체크 엔드포인트 동작 확인
- [ ] SSL/TLS 인증서 설정 (프로덕션)
- [ ] 백업 스크립트 설정 및 스케줄링

## 문제 해결

### 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker-compose logs api

# 컨테이너 상태 확인
docker-compose ps
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 네트워크 확인
docker network ls
docker network inspect perspec-network
```

### 볼륨 마운트 문제
```bash
# 볼륨 확인
docker volume inspect perspec_postgres_data

# 권한 문제 확인
ls -la server/logs
ls -la server/uploads
```

