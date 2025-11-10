# Perspec 프로젝트 - 자주 사용하는 명령어

## 🚀 빠른 시작

### 프로젝트 시작
```bash
docker-compose up -d
```

### 프로젝트 중지
```bash
docker-compose down
```

### 프로젝트 재시작
```bash
docker-compose restart
```

## 📊 상태 확인

### 컨테이너 상태 확인
```bash
docker-compose ps
```

### 로그 확인
```bash
# API 서버 로그 (실시간)
docker-compose logs -f api

# 데이터베이스 로그
docker-compose logs -f postgres

# 모든 로그
docker-compose logs -f
```

## 🗄️ 데이터베이스 관리

### 마이그레이션 실행
```bash
docker-compose exec api npm run migrate
```

### 마이그레이션 상태 확인
```bash
docker-compose exec api npm run migrate:status
```

### 마이그레이션 롤백
```bash
docker-compose exec api npm run migrate:undo
```

### 데이터베이스 백업
```bash
npm run backup
# 또는
docker-compose exec postgres pg_dump -U postgres perspec > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 데이터베이스 복구
```bash
npm run restore <backup_file>
```

## 🔧 개발 환경

### 개발 모드로 실행 (nodemon, 핫 리로드)
```bash
docker-compose -f docker-compose.dev.yml up
```

### 개발 모드 백그라운드 실행
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 🌐 접속 정보

- **API 서버**: http://localhost:5000
- **헬스 체크**: http://localhost:5000/health
- **API 문서**: http://localhost:5000/api-docs
- **데이터베이스**: localhost:5432

## 📝 기타 유용한 명령어

### 컨테이너 내부 접속
```bash
# API 컨테이너 접속
docker-compose exec api sh

# 데이터베이스 접속
docker-compose exec postgres psql -U postgres -d perspec
```

### 이미지 재빌드
```bash
docker-compose up -d --build
```

### 볼륨 삭제 (주의: 데이터 삭제됨)
```bash
docker-compose down -v
```

### 특정 서비스만 재시작
```bash
docker-compose restart api
docker-compose restart postgres
```

## ⚠️ 문제 해결

### 컨테이너가 시작되지 않을 때
```bash
# 로그 확인
docker-compose logs

# 컨테이너 재시작
docker-compose restart

# 완전히 재시작 (볼륨 유지)
docker-compose down && docker-compose up -d
```

### 포트가 이미 사용 중일 때
```bash
# 포트 확인
netstat -ano | findstr :5000
netstat -ano | findstr :5432

# .env 파일에서 PORT 변경 후 재시작
```

