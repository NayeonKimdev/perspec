# 프론트엔드 프로덕션 Dockerfile
# 멀티 스테이지 빌드를 사용하여 최적화

# Stage 1: 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치 (빌드에 devDependencies 필요)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: 프로덕션 스테이지 (Nginx)
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 포트 노출
EXPOSE 80

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]

