const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 환경 변수 확인
const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false, // SQL 로그 비활성화 (개발 시에는 true로 설정)
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// 환경 변수 확인 및 경고
if (!dbConfig.database || !dbConfig.username || !dbConfig.password) {
  console.warn('⚠️  데이터베이스 환경 변수가 설정되지 않았습니다.');
  console.warn('필요한 환경 변수: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT');
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

module.exports = sequelize;
