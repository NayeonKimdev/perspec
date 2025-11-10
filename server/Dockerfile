# Node.js 18 Alpine 이미지 사용 (경량)
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY server/package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사
COPY server/ .

# 사용자 생성 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 로그 및 업로드 디렉토리 생성 (사용자 변경 전)
RUN mkdir -p logs uploads/images uploads/documents/txt uploads/documents/json uploads/documents/other uploads/temp && \
    chown -R nodejs:nodejs /app

# 포트 노출
EXPOSE 5000

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 엔트리포인트 스크립트 생성 (볼륨 권한 조정)
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'chown -R nodejs:nodejs /app/logs /app/uploads 2>/dev/null || true' >> /entrypoint.sh && \
    echo 'exec su-exec nodejs "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh && \
    apk add --no-cache su-exec

# 엔트리포인트 설정
ENTRYPOINT ["/entrypoint.sh"]

# 사용자 변경 (보안) - 엔트리포인트에서 처리
# 서버 시작
CMD ["node", "server.js"]

