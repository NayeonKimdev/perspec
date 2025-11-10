const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 데이터베이스 백업 스크립트
 * 사용법: 
 *   - Docker 컨테이너 내부: node scripts/backup.js
 *   - 호스트에서 Docker 컨테이너 내부 실행: npm run backup
 *   - 직접 실행: docker-compose exec postgres pg_dump -U postgres perspec > backup.sql
 */

const SERVER_DIR = path.join(__dirname, '../server');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Docker 컨테이너 내부에서 실행 중인지 확인
const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

// 환경변수 로드
const envPath = path.join(SERVER_DIR, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 백업 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 백업 파일명 생성
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(BACKUP_DIR, `perspec_backup_${timestamp}.sql`);

// 환경변수 확인
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'password';
const dbName = process.env.DB_NAME || 'perspec';

console.log('🔄 데이터베이스 백업 중...');
console.log(`데이터베이스: ${dbName}@${dbHost}:${dbPort}`);

try {
  if (isDocker) {
    // Docker 컨테이너 내부에서 실행
    console.log('🐳 Docker 컨테이너 내부에서 실행 중...');
    execSync(
      `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${backupFile}"`,
      { stdio: 'inherit' }
    );
  } else {
    // 호스트에서 실행 시 Docker 컨테이너를 통해 백업
    console.log('💡 호스트에서 실행 중입니다. Docker 컨테이너를 통해 백업합니다...');
    execSync(
      `docker-compose exec -T postgres pg_dump -U ${dbUser} ${dbName} > "${backupFile}"`,
      { stdio: 'inherit' }
    );
  }

  console.log(`✅ 백업 완료: ${backupFile}`);

  // 오래된 백업 파일 삭제 (30일 이상)
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  files.forEach((file) => {
    if (file.startsWith('perspec_backup_') && file.endsWith('.sql')) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`🧹 삭제된 오래된 백업: ${file}`);
      }
    }
  });

  console.log('✅ 백업 정리 완료');
} catch (error) {
  console.error('❌ 백업 실패:', error.message);
  if (!isDocker) {
    console.log('💡 Docker 컨테이너가 실행 중인지 확인하세요:');
    console.log('   docker-compose ps');
  }
  process.exit(1);
}
