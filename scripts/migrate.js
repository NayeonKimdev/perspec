const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 데이터베이스 마이그레이션 스크립트
 * 사용법: 
 *   - Docker 컨테이너 내부: node scripts/migrate.js [up|down|undo|status]
 *   - 호스트에서 Docker 컨테이너 내부 실행: npm run migrate
 *   - 직접 실행: docker-compose exec api npm run migrate
 */

const SERVER_DIR = path.join(__dirname, '../server');
const COMMAND = process.argv[2] || 'up';

// Docker 컨테이너 내부에서 실행 중인지 확인
const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

if (isDocker) {
  // Docker 컨테이너 내부에서 실행
  console.log('🐳 Docker 컨테이너 내부에서 실행 중...');
  process.chdir(SERVER_DIR);
} else {
  // 호스트에서 실행 시 환경변수 파일 확인
  const envPath = path.join(SERVER_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 파일이 없습니다. server/.env 파일을 생성하세요.');
    console.log('💡 또는 Docker 컨테이너 내부에서 실행하세요:');
    console.log('   docker-compose exec api npm run migrate');
    process.exit(1);
  }
  process.chdir(SERVER_DIR);
}

function runMigration(command) {
  try {
    switch (command) {
      case 'up':
        console.log('🔄 데이터베이스 마이그레이션 실행 중...');
        execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
        console.log('✅ 마이그레이션 완료');
        break;

      case 'down':
      case 'undo':
        console.log('🔄 마지막 마이그레이션 롤백 중...');
        execSync('npx sequelize-cli db:migrate:undo', { stdio: 'inherit' });
        console.log('✅ 롤백 완료');
        break;

      case 'status':
        console.log('📊 마이그레이션 상태 확인 중...');
        execSync('npx sequelize-cli db:migrate:status', { stdio: 'inherit' });
        break;

      default:
        console.log('사용법: node scripts/migrate.js [up|down|undo|status]');
        console.log('  up     - 마이그레이션 실행');
        console.log('  down   - 마지막 마이그레이션 롤백');
        console.log('  undo   - 마지막 마이그레이션 롤백 (별칭)');
        console.log('  status - 마이그레이션 상태 확인');
        console.log('');
        console.log('💡 Docker 컨테이너 내부에서 실행:');
        console.log('   docker-compose exec api npm run migrate');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ 마이그레이션 실행 실패:', error.message);
    process.exit(1);
  }
}

runMigration(COMMAND);
