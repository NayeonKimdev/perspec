const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 데이터베이스 복구 스크립트
 * 사용법: 
 *   - Docker 컨테이너 내부: node scripts/restore.js <backup_file>
 *   - 호스트에서 Docker 컨테이너 내부 실행: npm run restore <backup_file>
 *   - 직접 실행: docker-compose exec -T postgres psql -U postgres perspec < backup.sql
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

// 백업 파일 확인
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ 백업 파일을 지정해주세요.');
  console.log('사용법: node scripts/restore.js <backup_file>');
  console.log('');
  console.log('사용 가능한 백업 파일:');
  
  if (fs.existsSync(BACKUP_DIR)) {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
    if (files.length > 0) {
      files.forEach(f => console.log(`  - ${f}`));
    } else {
      console.log('  (백업 파일 없음)');
    }
  } else {
    console.log('  (백업 디렉토리 없음)');
  }
  console.log('');
  console.log('💡 Docker 컨테이너 내부에서 실행:');
  console.log('   docker-compose exec api npm run restore <backup_file>');
  process.exit(1);
}

// 전체 경로인 경우 그대로 사용, 파일명만인 경우 BACKUP_DIR에서 찾기
let backupPath = backupFile;
if (!path.isAbsolute(backupFile)) {
  backupPath = path.join(BACKUP_DIR, backupFile);
}

if (!fs.existsSync(backupPath)) {
  console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupPath}`);
  process.exit(1);
}

// 환경변수 확인
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'password';
const dbName = process.env.DB_NAME || 'perspec';

// 확인 메시지
console.log('⚠️  경고: 이 작업은 현재 데이터베이스의 모든 데이터를 덮어씁니다!');
console.log(`백업 파일: ${backupPath}`);
console.log(`데이터베이스: ${dbName}@${dbHost}:${dbPort}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('계속하시겠습니까? (yes/no): ', (answer) => {
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ 복구 취소됨');
    process.exit(0);
  }

  console.log('🔄 데이터베이스 복구 중...');

  try {
    if (isDocker) {
      console.log('🐳 Docker 컨테이너 내부에서 실행 중...');
      execSync(
        `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${backupPath}"`,
        { stdio: 'inherit' }
      );
    } else {
      console.log('💡 호스트에서 실행 중입니다. Docker 컨테이너를 통해 복구합니다...');
      execSync(
        `docker-compose exec -T postgres psql -U ${dbUser} ${dbName} < "${backupPath}"`,
        { stdio: 'inherit' }
      );
    }

    console.log('✅ 복구 완료');
  } catch (error) {
    console.error('❌ 복구 실패:', error.message);
    if (!isDocker) {
      console.log('💡 Docker 컨테이너가 실행 중인지 확인하세요:');
      console.log('   docker-compose ps');
    }
    process.exit(1);
  }
});

