const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { ensureDirectoriesExist } = require('./config/storage');

// 환경변수 로드
dotenv.config();

// 업로드 디렉토리 생성
ensureDirectoriesExist();

// 데이터베이스 연결 테스트를 위해 auth 라우트를 조건부로 로드
let authRoutes;
let profileRoutes;
let analysisRoutes;
let mediaRoutes;
let documentRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✓ Auth 라우트 로드 성공');
} catch (error) {
  console.log('✗ Auth 라우트 로드 실패:', error.message);
  authRoutes = null;
}

try {
  profileRoutes = require('./routes/profile');
  console.log('✓ Profile 라우트 로드 성공');
} catch (error) {
  console.log('✗ Profile 라우트 로드 실패:', error.message);
  profileRoutes = null;
}

try {
  analysisRoutes = require('./routes/analysis');
  console.log('✓ Analysis 라우트 로드 성공');
} catch (error) {
  console.log('✗ Analysis 라우트 로드 실패:', error.message);
  console.error(error.stack);
  analysisRoutes = null;
}

try {
  mediaRoutes = require('./routes/media');
  console.log('✓ Media 라우트 로드 성공');
} catch (error) {
  console.log('✗ Media 라우트 로드 실패:', error.message);
  mediaRoutes = null;
}

try {
  documentRoutes = require('./routes/documents');
  console.log('✓ Documents 라우트 로드 성공');
} catch (error) {
  console.log('✗ Documents 라우트 로드 실패:', error.message);
  console.error('✗ Documents 라우트 로드 실패 상세:', error.stack);
  documentRoutes = null;
}

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우트
if (authRoutes) {
  app.use('/api/auth', authRoutes);
} else {
  app.use('/api/auth', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

if (profileRoutes) {
  app.use('/api/profile', profileRoutes);
} else {
  app.use('/api/profile', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

if (analysisRoutes) {
  app.use('/api/analysis', analysisRoutes);
} else {
  app.use('/api/analysis', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

if (mediaRoutes) {
  app.use('/api/media', mediaRoutes);
} else {
  app.use('/api/media', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

if (documentRoutes) {
  app.use('/api/documents', documentRoutes);
} else {
  app.use('/api/documents', (req, res) => {
    res.status(503).json({ message: '데이터베이스 연결이 필요합니다.' });
  });
}

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Perspec API 서버가 실행 중입니다.' });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 분석 큐 초기화 및 시작
try {
  console.log('[서버 시작] 분석 큐 모듈 로드 시도...');
  const analysisQueue = require('./services/analysisQueue');
  console.log('[서버 시작] 분석 큐 모듈 로드 성공');
  
  // 비동기 초기화를 서버 시작 후에 실행
  setTimeout(async () => {
    try {
      console.log('[서버 시작] 분석 큐 초기화 시작...');
      await analysisQueue.restorePendingItems();
      console.log('[서버 시작] 분석 큐 복구 완료, 처리 시작...');
      analysisQueue.startProcessing();
      console.log('✓ 이미지 분석 큐가 시작되었습니다.');
    } catch (error) {
      console.error('✗ 이미지 분석 큐 시작 실패:', error.message);
      console.error('✗ 에러 스택:', error.stack);
    }
  }, 2000); // 서버가 완전히 시작된 후 2초 뒤에 초기화
  
} catch (error) {
  console.log('✗ 이미지 분석 큐를 로드할 수 없습니다:', error.message);
  console.log('✗ 에러 스택:', error.stack);
}

// 서버 시작 전 데이터베이스 연결 테스트
const testDatabaseConnection = async () => {
  try {
    const sequelize = require('./models/index');
    await sequelize.authenticate();
    console.log('✓ 데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('✗ 데이터베이스 연결 실패:', error.message);
    console.error('✗ 연결 정보:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || '(설정 안됨)',
      user: process.env.DB_USER || '(설정 안됨)',
      password: process.env.DB_PASSWORD ? '***' : '(설정 안됨)'
    });
    console.error('✗ 해결 방법:');
    console.error('  1. PostgreSQL이 실행 중인지 확인하세요');
    console.error('  2. server/.env 파일의 DB_* 환경 변수를 확인하세요');
    console.error('  3. 데이터베이스가 존재하는지 확인하세요: createdb perspec');
    return false;
  }
};

// 서버 시작
app.listen(PORT, async () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 데이터베이스 연결 테스트
  console.log('[데이터베이스 연결 테스트 시작...]');
  await testDatabaseConnection();
});

module.exports = app;
