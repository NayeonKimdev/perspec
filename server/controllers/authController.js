/**
 * @fileoverview 인증 컨트롤러
 * @module controllers/authController
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const UserSocialLogin = require('../models/UserSocialLogin');
const logger = require('../utils/logger');
const { trackError, ErrorType } = require('../utils/errorTracker');
const emailService = require('../services/emailService');
const { logActivity, ActivityType } = require('../utils/activityLogger');

/**
 * 회원가입
 * @param {import('express').Request<{}, {}, { email: string, password: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
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
      logger.warn('회원가입 시도 - 이메일 중복', { email });
      return res.status(409).json({
        message: '이미 존재하는 이메일입니다.'
      });
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 이메일 인증 토큰 생성
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24시간 후 만료

    // 사용자 생성
    const user = await User.create({
      email,
      password: hashedPassword,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_token_expires: tokenExpires
    });

    // 이메일 인증 메일 발송 (비동기, 실패해도 회원가입은 성공)
    let emailSent = false;
    let verificationLink = null;
    try {
      const emailResult = await emailService.sendVerificationEmail(email, verificationToken);
      if (emailResult.success) {
        emailSent = true;
        logger.info('이메일 인증 메일 발송 완료', { userId: user.id, email });
      } else if (emailResult.skipped && emailResult.verificationLink) {
        // 개발 환경에서 이메일 발송이 건너뛰어진 경우
        verificationLink = emailResult.verificationLink;
        logger.warn('이메일 발송 건너뜀 (개발 환경)', { 
          userId: user.id, 
          email,
          verificationLink 
        });
      }
    } catch (emailError) {
      logger.error('이메일 인증 메일 발송 실패', {
        userId: user.id,
        email,
        error: emailError.message
      });
      // 이메일 발송 실패해도 회원가입은 성공 처리
    }

    logger.info('회원가입 성공', { userId: user.id, email: user.email });

    // 활동 로깅
    await logActivity(user.id, ActivityType.REGISTER, {
      metadata: { email: user.email },
      req
    });

    // 비밀번호 제외하고 응답
    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    const response = {
      message: '회원가입이 완료되었습니다.',
      user: userResponse
    };

    // 개발 환경에서 이메일 발송이 실패한 경우 인증 링크를 응답에 포함
    if (!emailSent && verificationLink) {
      response.verificationLink = verificationLink;
      response.message = '회원가입이 완료되었습니다. (개발 환경: 이메일 발송이 비활성화되어 있습니다. 아래 링크로 이메일을 인증해주세요.)';
    }

    res.status(201).json(response);

  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'register',
      email: req.body.email
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

/**
 * 로그인
 * @param {import('express').Request<{}, {}, { email: string, password: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
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
      logger.warn('로그인 실패 - 사용자 없음', { email });
      return res.status(401).json({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 소셜 로그인 사용자인지 확인 (UserSocialLogin 테이블에서 확인)
    const socialLogins = await UserSocialLogin.findAll({
      where: { user_id: user.id }
    });

    if (socialLogins.length > 0) {
      const providers = socialLogins.map(sl => {
        const providerName = sl.provider;
        if (providerName === 'google') return 'Google';
        if (providerName === 'kakao') return 'Kakao';
        if (providerName === 'naver') return 'Naver';
        return providerName;
      }).join(', ');
      
      logger.warn('로그인 실패 - 소셜 로그인 사용자', { email, userId: user.id, providers: socialLogins.map(sl => sl.provider) });
      return res.status(400).json({
        message: `이 계정은 ${providers} 소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 사용해주세요.`,
        providers: socialLogins.map(sl => sl.provider)
      });
    }

    // 비밀번호가 없는 경우 (일반적으로 발생하지 않지만 안전을 위해)
    if (!user.password) {
      logger.warn('로그인 실패 - 비밀번호 없음', { email, userId: user.id });
      return res.status(400).json({
        message: '이 계정은 비밀번호 로그인을 사용할 수 없습니다. 소셜 로그인을 사용해주세요.'
      });
    }

    // 이메일 인증 여부 확인
    if (!user.email_verified) {
      logger.warn('로그인 실패 - 이메일 미인증', { email, userId: user.id });
      return res.status(403).json({
        message: '이메일 인증이 필요합니다. 회원가입 시 발송된 이메일을 확인해주세요.',
        requiresVerification: true
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('로그인 실패 - 비밀번호 불일치', { email, userId: user.id });
      return res.status(401).json({
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET이 설정되지 않았습니다.');
      return res.status(500).json({
        message: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.'
      });
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info('로그인 성공', { userId: user.id, email: user.email });

    // 사용자 정보 (비밀번호 제외)
    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    // 활동 로깅 (비동기, 에러가 발생해도 로그인은 성공)
    logActivity(user.id, ActivityType.LOGIN, {
      metadata: { email: user.email },
      req
    }).catch((activityError) => {
      // 활동 로깅 실패는 무시 (이미 activityLogger에서 로깅됨)
      logger.warn('활동 로깅 실패 (로그인은 성공)', {
        userId: user.id,
        error: activityError.message
      });
    });

    res.json({
      message: '로그인 성공',
      token,
      user: userResponse
    });

  } catch (error) {
    // 에러 상세 로깅
    logger.error('로그인 에러 발생', {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
      jwtSecretExists: !!process.env.JWT_SECRET,
      errorName: error.name,
      errorCode: error.code
    });
    
    const errorInfo = trackError(error, {
      operation: 'login',
      email: req.body.email
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    
    // 개발 환경에서는 항상 상세 에러 정보 포함
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const errorResponse = {
      message: '서버 내부 오류가 발생했습니다.'
    };
    
    // 개발 환경이거나 NODE_ENV가 설정되지 않은 경우 상세 정보 포함
    if (isDevelopment) {
      errorResponse.error = error.message;
      errorResponse.errorName = error.name;
      errorResponse.errorCode = error.code;
      errorResponse.stack = error.stack;
      errorResponse.details = {
        jwtSecretExists: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV || 'not set',
        operation: 'login'
      };
    }
    
    // 콘솔에도 직접 출력 (디버깅용)
    console.error('=== 로그인 에러 상세 ===');
    console.error('Error:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.error('========================');
    
    res.status(statusCode).json(errorResponse);
  }
};

/**
 * 이메일 인증
 * @param {import('express').Request<{}, {}, {}, { token: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: '인증 토큰이 필요합니다.'
      });
    }

    // 토큰으로 사용자 찾기
    const user = await User.findOne({
      where: {
        email_verification_token: token
      }
    });

    if (!user) {
      logger.warn('이메일 인증 실패 - 잘못된 토큰', { token: token.substring(0, 10) + '...' });
      return res.status(400).json({
        message: '유효하지 않은 인증 토큰입니다.'
      });
    }

    // 이미 인증된 경우
    if (user.email_verified) {
      return res.status(200).json({
        message: '이미 인증된 이메일입니다.'
      });
    }

    // 토큰 만료 확인
    if (user.email_verification_token_expires && new Date() > user.email_verification_token_expires) {
      logger.warn('이메일 인증 실패 - 토큰 만료', { userId: user.id, email: user.email });
      return res.status(400).json({
        message: '인증 토큰이 만료되었습니다. 새로운 인증 메일을 요청해주세요.',
        expired: true
      });
    }

    // 이메일 인증 완료
    await user.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_token_expires: null
    });

    logger.info('이메일 인증 완료', { userId: user.id, email: user.email });

    // 활동 로깅
    await logActivity(user.id, ActivityType.EMAIL_VERIFIED, {
      req
    });

    res.json({
      message: '이메일 인증이 완료되었습니다.'
    });
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'verifyEmail'
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

/**
 * 이메일 인증 메일 재발송
 * @param {import('express').Request<{}, {}, { email: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: '이메일 주소가 필요합니다.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // 보안을 위해 사용자가 없는 경우에도 성공 응답 반환
      logger.warn('이메일 재발송 시도 - 사용자 없음', { email });
      return res.json({
        message: '이메일이 발송되었습니다. (만약 등록된 이메일이라면 메일함을 확인해주세요.)'
      });
    }

    // 이미 인증된 경우
    if (user.email_verified) {
      return res.status(400).json({
        message: '이미 인증된 이메일입니다.'
      });
    }

    // 새로운 인증 토큰 생성
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24시간 후 만료

    // 토큰 업데이트
    await user.update({
      email_verification_token: verificationToken,
      email_verification_token_expires: tokenExpires
    });

    // 이메일 인증 메일 발송
    try {
      const emailResult = await emailService.sendVerificationEmail(email, verificationToken);
      if (emailResult.success) {
        logger.info('이메일 인증 메일 재발송 완료', { userId: user.id, email });
        res.json({
          message: '인증 메일이 발송되었습니다. 메일함을 확인해주세요.'
        });
      } else if (emailResult.skipped && emailResult.verificationLink) {
        // 개발 환경에서 이메일 발송이 건너뛰어진 경우
        logger.warn('이메일 재발송 건너뜀 (개발 환경)', { 
          userId: user.id, 
          email,
          verificationLink: emailResult.verificationLink 
        });
        res.json({
          message: '개발 환경: 이메일 발송이 비활성화되어 있습니다. 아래 링크로 이메일을 인증해주세요.',
          verificationLink: emailResult.verificationLink
        });
      } else {
        res.status(500).json({
          message: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
      }
    } catch (emailError) {
      logger.error('이메일 인증 메일 재발송 실패', {
        userId: user.id,
        email,
        error: emailError.message
      });
      res.status(500).json({
        message: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'resendVerificationEmail',
      email: req.body.email
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

/**
 * 비밀번호 재설정 요청 (이메일 발송)
 * @param {import('express').Request<{}, {}, { email: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: '이메일 주소가 필요합니다.'
      });
    }

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });

    // 보안을 위해 사용자가 없는 경우에도 성공 응답 반환 (이메일 탈취 방지)
    if (!user) {
      logger.warn('비밀번호 재설정 요청 - 사용자 없음', { email });
      return res.json({
        message: '이메일이 발송되었습니다. (만약 등록된 이메일이라면 메일함을 확인해주세요.)'
      });
    }

    // 이메일 인증이 안 된 사용자는 비밀번호 재설정 불가
    if (!user.email_verified) {
      logger.warn('비밀번호 재설정 요청 - 이메일 미인증', { email, userId: user.id });
      return res.status(403).json({
        message: '이메일 인증이 완료되지 않은 계정입니다. 먼저 이메일 인증을 완료해주세요.'
      });
    }

    // 비밀번호 재설정 토큰 생성
    const resetToken = emailService.generateVerificationToken();
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // 1시간 후 만료

    // 토큰 저장
    await user.update({
      password_reset_token: resetToken,
      password_reset_token_expires: tokenExpires
    });

    // 비밀번호 재설정 메일 발송
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
      logger.info('비밀번호 재설정 메일 발송 완료', { userId: user.id, email });
      res.json({
        message: '비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해주세요.'
      });
    } catch (emailError) {
      logger.error('비밀번호 재설정 메일 발송 실패', {
        userId: user.id,
        email,
        error: emailError.message
      });
      res.status(500).json({
        message: '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'requestPasswordReset',
      email: req.body.email
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

/**
 * 비밀번호 재설정 (토큰 검증 후 비밀번호 변경)
 * @param {import('express').Request<{}, {}, { token: string, password: string }>} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: '토큰과 새 비밀번호가 필요합니다.'
      });
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      return res.status(400).json({
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        message: '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
      });
    }

    // 토큰으로 사용자 찾기
    const user = await User.findOne({
      where: {
        password_reset_token: token
      }
    });

    if (!user) {
      logger.warn('비밀번호 재설정 실패 - 잘못된 토큰', { token: token.substring(0, 10) + '...' });
      return res.status(400).json({
        message: '유효하지 않은 재설정 토큰입니다.'
      });
    }

    // 토큰 만료 확인
    if (user.password_reset_token_expires && new Date() > user.password_reset_token_expires) {
      logger.warn('비밀번호 재설정 실패 - 토큰 만료', { userId: user.id, email: user.email });
      return res.status(400).json({
        message: '재설정 토큰이 만료되었습니다. 새로운 재설정 요청을 해주세요.',
        expired: true
      });
    }

    // 새 비밀번호 해싱
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 비밀번호 업데이트 및 토큰 제거
    await user.update({
      password: hashedPassword,
      password_reset_token: null,
      password_reset_token_expires: null
    });

    logger.info('비밀번호 재설정 완료', { userId: user.id, email: user.email });

    // 활동 로깅
    await logActivity(user.id, ActivityType.PASSWORD_RESET_COMPLETED, {
      req
    });

    res.json({
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    const errorInfo = trackError(error, {
      operation: 'resetPassword'
    }, req);
    
    const statusCode = errorInfo.type === ErrorType.DATABASE ? 503 : 500;
    res.status(statusCode).json({
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
};

/**
 * Google 소셜 로그인 콜백 처리
 * Passport 미들웨어에서 인증이 완료된 후 호출됨
 * @param {import('express').Request} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
/**
 * 소셜 로그인 콜백 공통 함수
 * @param {string} provider - 소셜 로그인 제공자 이름
 * @param {import('express').Request} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 */
const handleSocialCallback = async (provider, req, res) => {
  try {
    const user = req.user;

    if (!user) {
      logger.warn(`${provider} 로그인 실패 - 사용자 정보 없음`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${provider}_auth_failed`);
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET이 설정되지 않았습니다.');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`${provider} 로그인 성공`, { userId: user.id, email: user.email });

    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    logActivity(user.id, ActivityType.LOGIN, {
      metadata: { email: user.email, provider },
      req
    }).catch((activityError) => {
      logger.warn('활동 로깅 실패 (로그인은 성공)', {
        userId: user.id,
        error: activityError.message
      });
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userResponse))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error(`${provider} 로그인 콜백 처리 중 오류`, {
      error: error.message,
      stack: error.stack
    });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=${provider}_auth_failed`);
  }
};

const googleCallback = async (req, res) => {
  return handleSocialCallback('google', req, res);
};

const kakaoCallback = async (req, res) => {
  return handleSocialCallback('kakao', req, res);
};

const naverCallback = async (req, res) => {
  return handleSocialCallback('naver', req, res);
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  googleCallback,
  kakaoCallback,
  naverCallback
};
