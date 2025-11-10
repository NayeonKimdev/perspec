const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const envConfig = require('./environments');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const currentConfig = envConfig.getConfig();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: currentConfig.dbLogging ? console.log : false,
    pool: currentConfig.dbPool
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: currentConfig.dbPool
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: currentConfig.dbLogging ? console.log : false,
    pool: currentConfig.dbPool,
    // 프로덕션 최적화 옵션
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false // 프로덕션에서는 인증서 검증 권장
      } : false
    }
  }
};
