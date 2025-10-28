const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// 회원가입
const register = async (req, res) => {
  try {
    // 유효성 검사 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '입력 데이터가 유효하지 않습니다.',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 이메일 중복 체크
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: '이미 존재하는 이메일입니다.'
      });
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await User.create({
      email,
      password: hashedPassword
    });

    // 비밀번호 제외하고 응답
    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: userResponse
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    // 유효성 검사 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '입력 데이터가 유효하지 않습니다.',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 사용자 정보 (비밀번호 제외)
    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    res.json({
      message: '로그인 성공',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  register,
  login
};
