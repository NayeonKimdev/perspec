/**
 * @fileoverview JWT 인증 미들웨어
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express Request 객체에 사용자 정보를 추가하는 타입 정의
 * @typedef {Object} AuthenticatedRequest
 * @property {Object} user - 인증된 사용자 정보
 * @property {string} user.id - 사용자 ID
 * @property {string} user.email - 사용자 이메일
 */

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 JWT 토큰을 추출하여 검증하고, 사용자 정보를 req.user에 추가합니다.
 * @param {import('express').Request & AuthenticatedRequest} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @param {import('express').NextFunction} next - Express next 함수
 * @returns {Promise<void>}
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        message: '인증 토큰이 필요합니다.'
      });
    }

    // Bearer 토큰 형식 확인
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: '유효하지 않은 토큰 형식입니다.'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: '유효하지 않은 토큰입니다.'
      });
    }

    // req.user에 사용자 정보 저장
    req.user = {
      id: user.id,
      email: user.email
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: '토큰이 만료되었습니다.'
      });
    }

    // 데이터베이스 연결 오류 처리
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionRefusedError') {
      console.error('인증 미들웨어 - 데이터베이스 연결 오류:', error.message);
      return res.status(503).json({
        message: '데이터베이스 연결이 필요합니다.'
      });
    }

    console.error('인증 미들웨어 에러:', error);
    res.status(500).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

module.exports = authMiddleware;
