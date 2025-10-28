const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 환경변수 로드
dotenv.config();

// 데이터베이스 연결 테스트를 위해 auth 라우트를 조건부로 로드
let authRoutes;
let profileRoutes;
let analysisRoutes;

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

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
